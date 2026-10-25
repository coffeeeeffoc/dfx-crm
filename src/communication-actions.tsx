import { App, Button, Input, Space, Tag } from "antd";
import { useCRM } from "./context";
import type { Communication } from "./domain";
import { now } from "./domain";
import { canCorrectCommunication } from "./records";
export function CommunicationActions({ record }: { record: Communication }) {
  const { rawState, access, page, change, actor } = useCRM();
  const { modal, message } = App.useApp();
  const raw = rawState.communications.find((r) => r.id === record.id);
  const parent = raw?.projectId
    ? rawState.projects.find((p) => p.id === raw.projectId)
    : rawState.customers.find((c) => c.id === raw?.customerId);
  const writable =
    !!raw &&
    !!parent &&
    access.owns(parent.owner) &&
    access.owns(raw.owner) &&
    access.can(page, "communicate", "communication") &&
    access.field(page, "communication", "content") === "write";
  const correct =
    raw &&
    canCorrectCommunication(
      raw.createdAt,
      rawState.admin!.communicationEditMinutes ?? 15,
      Date.now(),
      access.isAdmin,
    );
  const open = (revision: boolean) => {
    if (!writable || !raw) return;
    let content = revision ? raw.content : "";
    modal.confirm({
      title: revision ? "修正沟通（保留原文）" : "补充沟通说明",
      content: (
        <Input.TextArea
          aria-label={revision ? "修正沟通内容" : "补充沟通说明"}
          defaultValue={content}
          rows={5}
          onChange={(e) => (content = e.target.value)}
        />
      ),
      onOk: () => {
        if (
          !content.trim() ||
          (revision &&
            !canCorrectCommunication(
              raw.createdAt,
              rawState.admin!.communicationEditMinutes ?? 15,
              Date.now(),
              access.isAdmin,
            ))
        ) {
          message.error("内容不能为空，或修正窗口已结束");
          return Promise.reject();
        }
        if (
          !change(revision ? "修正沟通" : "补充沟通", record.title, (s) => ({
            ...s,
            communications: s.communications.map((c) =>
              c.id !== record.id
                ? c
                : revision
                  ? {
                      ...c,
                      content: content.trim(),
                      revisions: [
                        ...(c.revisions || []),
                        {
                          date: now(),
                          owner: actor,
                          content: c.content,
                          title: c.title,
                        },
                      ],
                    }
                  : {
                      ...c,
                      supplements: [
                        ...(c.supplements || []),
                        { date: now(), owner: actor, content: content.trim() },
                      ],
                    },
            ),
          }))
        )
          return Promise.reject();
      },
    });
  };
  return (
    <>
      {(record.supplements || []).map((s, i) => (
        <div className="next-plan" key={i}>
          <small>
            {s.date} · {s.owner} · 补充
          </small>
          <p>{s.content}</p>
        </div>
      ))}
      {!!record.revisions?.length && (
        <details>
          <summary>修正历史（{record.revisions.length}）</summary>
          {record.revisions.map((v, i) => (
            <p key={i}>
              {v.date} · {v.owner}：{v.content}
            </p>
          ))}
        </details>
      )}
      {writable && (
        <Space>
          {correct && (
            <Button size="small" onClick={() => open(true)}>
              修正记录
            </Button>
          )}
          <Button size="small" onClick={() => open(false)}>
            补充说明
          </Button>
          {!correct && (
            <small className="muted">修正窗口已结束，原文保留</small>
          )}
        </Space>
      )}
    </>
  );
}
