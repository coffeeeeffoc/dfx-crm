import { ExportRecords } from "../export";
import { Form, CustomFields } from "../permission-ui";
import { writableValues, maskRecord } from "../access";
import { ActionButton as Button, AccessHtmlButton } from "../permission-ui";
import { useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  App,
  DatePicker,
  Descriptions,
  Empty,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from "antd";
import {
  ArrowRightOutlined,
  BookOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { useCRM } from "../context";
import {
  Filters,
  FilterSelect,
  Metric,
  PageHeading,
  Person,
  Section,
  Status,
  options,
} from "../components";
import { expected, money, now, today, uid } from "../domain";
import type { Knowledge } from "../domain";
import { download, exportExcel, storageKey } from "../storage";

export function SuppliersPage() {
  const { state, role, edit, detail } = useCRM();
  const {
    can,
    access,
    rawState,
    page,
    area: permissionArea,
    ownerNames: owners,
    manager,
    visible,
    editable,
    projectView,
  } = useCRM();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("全部");
  const data = state.suppliers.filter(
    (s) =>
      `${s.name}${s.brand}${s.contact}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (level === "全部" || s.level === level),
  );
  return (
    <>
      <PageHeading
        title="供应商"
        description="把品牌、产品与可靠的合作伙伴连接起来。"
        actions={
          <>
            <ExportRecords rows={data} />{" "}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!can("suppliers", "create")}
              onClick={() => edit("suppliers")}
              permission="create"
              menu={"suppliers"}
            >
              新增供应商
            </Button>
          </>
        }
      />
      <Section>
        <Filters
          search={search}
          onSearch={setSearch}
          placeholder="搜索品牌、供应商或联系人"
        >
          <FilterSelect
            label="合作级别"
            value={level}
            onChange={setLevel}
            values={["核心合作", "常规合作", "待评估"]}
          />
        </Filters>
      </Section>
      <div className="supplier-grid">
        {data.map((s, i) => (
          <Section key={s.id} className="supplier-card">
            <div className="supplier-card-top">
              <div className={`supplier-monogram tone-${i % 4}`}>
                {s.brand.slice(0, 2)}
              </div>
              <Tag
                color={s.level === "核心合作" ? "blue" : "default"}
                variant="filled"
              >
                {s.level}
              </Tag>
            </div>
            <h2>{s.brand}</h2>
            <p>{s.name}</p>
            <div className="supplier-info">
              <span>联系人</span>
              <b>
                {s.contact} · {s.title}
              </b>
              <span>电子邮箱</span>
              <b>{s.email}</b>
              <span>产品手册</span>
              <b>{s.attachments.length} 份资料</b>
            </div>
            <div className="supplier-card-bottom">
              <span>{s.notes.slice(0, 15)}</span>
              <Button
                type="link"
                onClick={() => detail("suppliers", s.id)}
                permission="detail"
                menu={"suppliers"}
              >
                查看档案 <ArrowRightOutlined />
              </Button>
            </div>
          </Section>
        ))}
      </div>
      {!data.length && <Empty description="未找到供应商" />}
    </>
  );
}

export function KnowledgePage() {
  const { state, actor, role, edit, detail, change } = useCRM();
  const {
    can,
    access,
    rawState,
    page,
    area: permissionArea,
    ownerNames: owners,
    manager,
    visible,
    editable,
    projectView,
  } = useCRM();
  const { modal, message } = App.useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部");
  const [tab, setTab] = useState("已发布");
  const data = state.knowledge.filter(
    (k) =>
      (k.status === "已发布" || access.owns(k.owner)) &&
      (tab === "全部" || tab === "我的草稿"
        ? tab !== "我的草稿" ||
          (k.owner === actor && ["草稿", "已退回"].includes(k.status))
        : k.status === tab) &&
      (category === "全部" || k.category === category) &&
      `${k.name}${k.tags}${k.brand}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const update = (k: Knowledge, status: string, reviewNote = "") => {
    if (
      !access.owns(k.owner) ||
      !can("knowledge", status === "待审核" ? "submit" : "review") ||
      access.field("knowledge", "list", "status") !== "write"
    )
      return void message.error("没有该记录的审核或提交权限");
    if (
      change(`学习档案${status}`, k.name, (s) => ({
        ...s,
        knowledge: s.knowledge.map((x) =>
          x.id === k.id ? { ...x, status, reviewNote } : x,
        ),
      }))
    )
      message.success(
        status === "已发布"
          ? "已发布，全员可见"
          : status === "待审核"
            ? "已提交主管审核"
            : "已退回",
      );
  };
  const reject = (k: Knowledge) => {
    let reason = "";
    modal.confirm({
      title: "退回修改",
      content: (
        <Input.TextArea
          placeholder="退回原因（必填）"
          onChange={(e) => {
            reason = e.target.value;
          }}
        />
      ),
      onOk: () => {
        if (!reason.trim()) {
          message.error("请填写原因");
          return Promise.reject();
        }
        update(k, "已退回", reason);
      },
    });
  };
  return (
    <>
      <PageHeading
        title="学习档案"
        description="把个人经验沉淀为团队知识，共同走得更远。"
        actions={
          <>
            <ExportRecords rows={data} />{" "}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!can("knowledge", "create")}
              onClick={() => edit("knowledge")}
              permission="create"
              menu={"knowledge"}
            >
              上传学习资料
            </Button>
          </>
        }
      />
      <div className="knowledge-hero">
        <div className="knowledge-hero-icon">
          <BookOutlined />
        </div>
        <div>
          <span className="eyebrow">LEARN. SHARE. GROW.</span>
          <h2>让知识在团队里流动</h2>
          <p>产品知识、应用方案与销售经验，在这里积累。</p>
        </div>
        <span className="knowledge-hero-count">
          <b>{state.knowledge.filter((k) => k.status === "已发布").length}</b>
          份已发布资料
        </span>
      </div>
      <Section>
        <div className="section-toolbar">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              "已发布",
              "我的草稿",
              ...(can("knowledge", "review") ? ["待审核", "全部"] : []),
            ]}
          />
        </div>
        <Filters
          search={search}
          onSearch={setSearch}
          placeholder="搜索标题、品牌和标签"
        >
          <FilterSelect
            label="资料分类"
            value={category}
            onChange={setCategory}
            values={["产品知识", "应用方案", "销售技巧", "市场推广"]}
          />
        </Filters>
      </Section>
      <div className="knowledge-grid">
        {data.map((k, i) => (
          <Section className="knowledge-card" key={k.id}>
            <div className={`knowledge-cover cover-${i % 3}`}>
              <span>{k.category}</span>
              <BookOutlined />
              <small>{k.brand || "COUNTING STARS"}</small>
            </div>
            <div className="knowledge-card-content">
              <div className="card-title-row">
                <Status value={k.status} />
                <span className="muted">{k.date}</span>
              </div>
              <AccessHtmlButton
                className="knowledge-title"
                onClick={() => detail("knowledge", k.id)}
                permission="detail"
                menu={"knowledge"}
              >
                {k.name}
              </AccessHtmlButton>
              <p>{k.content.slice(0, 70)}…</p>
              <div>
                {k.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              {k.reviewNote && (
                <p className="text-danger">退回原因：{k.reviewNote}</p>
              )}
              <div className="card-bottom">
                <Person name={k.owner} />
                <Space>
                  {["草稿", "已退回"].includes(k.status) &&
                    access.owns(k.owner) && (
                      <>
                        <Button
                          size="small"
                          onClick={() => edit("knowledge", k.id)}
                          permission="edit"
                          menu={"knowledge"}
                        >
                          编辑
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => update(k, "待审核")}
                          permission="submit"
                        >
                          提交审核
                        </Button>
                      </>
                    )}
                  {k.status === "待审核" &&
                    can(page, "review") &&
                    access.owns(k.owner) && (
                      <>
                        <Button
                          size="small"
                          onClick={() => reject(k)}
                          permission="review"
                        >
                          退回
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => update(k, "已发布")}
                          permission="review"
                        >
                          审核发布
                        </Button>
                      </>
                    )}
                  {k.status === "已发布" && (
                    <Button
                      type="link"
                      onClick={() => detail("knowledge", k.id)}
                      permission="detail"
                      menu={"knowledge"}
                    >
                      阅读 <ArrowRightOutlined />
                    </Button>
                  )}
                </Space>
              </div>
            </div>
          </Section>
        ))}
      </div>
      {!data.length && <Empty description="当前分类下暂无资料" />}
    </>
  );
}

export function DailyPage() {
  const { state, actor, role, change, detail } = useCRM();
  const {
    can,
    access,
    rawState,
    page,
    area: permissionArea,
    ownerNames: owners,
    manager,
    visible,
    editable,
    projectView,
  } = useCRM();
  const { message } = App.useApp();
  const [date, setDate] = useState(today());
  const [selectedPerson, setPerson] = useState(actor);
  const [period, setPeriod] = useState("日报");
  const [form] = Form.useForm();
  const person = owners.includes(selectedPerson) ? selectedPerson : actor;
  const start =
    period === "日报"
      ? date
      : period === "周报"
        ? dayjs(date).startOf("week").format("YYYY-MM-DD")
        : period === "月报"
          ? date.slice(0, 7) + "-01"
          : period === "季报"
            ? `${date.slice(0, 4)}-${String(Math.floor((Number(date.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, "0")}-01`
            : date.slice(0, 4) + "-01-01";
  const match = (d: string) =>
    d.slice(0, 10) >= start && d.slice(0, 10) <= date;
  const records = state.communications.filter(
    (c) => c.owner === person && match(c.date),
  );
  const knowledge = state.knowledge.filter(
    (k) => k.owner === person && match(k.date),
  );
  const services = state.services.filter(
    (s) => s.owner === person && match(s.date),
  );
  const audits = state.audit.filter(
    (a) => a.owner === person && match(a.date) && /新增|导入/.test(a.action),
  );
  const daily = state.daily.find((d) => d.owner === person && d.date === date);
  const activities = state.activities.filter(
    (r) => !(r as any).deleted && r.owner === person && match(r.date),
  );
  const periodNotes = state.daily.filter(
    (r) => !(r as any).deleted && r.owner === person && match(r.date),
  );
  const exportReport = async () => {
    if (!can("daily", "export", "export")) return;
    const allowed = (menu: any, keys: string[]) =>
      can(menu, "export", "export") &&
      keys.every(
        (k) =>
          access.field(menu, "list", k) !== "hidden" &&
          access.field(menu, "export", k) !== "hidden",
      );
    const commAllowed =
      can("projects", "export", "communicationExport") &&
      ["date", "title", "content"].every(
        (k) =>
          access.field("projects", "communication", k) !== "hidden" &&
          access.field("projects", "communicationExport", k) !== "hidden",
      );
    const data = [
      ...(commAllowed
        ? records.map((r) => [r.date, "销售", r.title, r.content])
        : []),
      ...(allowed("knowledge", ["date", "name", "content"])
        ? knowledge.map((r) => [r.date, "学习", r.name, r.content])
        : []),
      ...(allowed("services", ["date", "name", "result"])
        ? services.map((r) => [r.date, "服务", r.name, r.result])
        : []),
      ...(allowed("activities", ["date", "category", "name", "content"])
        ? activities.map((r) => [r.date, r.category, r.name, r.content])
        : []),
      ...periodNotes.flatMap((r) =>
        [
          ["administration", "行政"],
          ["summary", "总结"],
          ["plan", "计划"],
        ]
          .filter(([key]) => allowed("daily", ["date", key]))
          .map(([key, label]) => [r.date, label, label, (r as any)[key]]),
      ),
    ];
    try {
      await exportExcel(
        `${person}-${date}-${period}`,
        ["日期", "类型", "标题", "内容"],
        data,
      );
      change(
        "导出工作报告",
        `${person} · ${start}至${date}`,
        (s) => ({ ...s }),
        true,
      );
    } catch (e) {
      message.error("导出失败");
    }
  };
  return (
    <>
      <PageHeading
        title="工作日志"
        description="工作自动留下记录，把时间留给客户和成长。"
        actions={
          <Button
            icon={<DownloadOutlined />}
            onClick={exportReport}
            permission="export"
            region="export"
          >
            导出工作报告
          </Button>
        }
      />
      <div className="section-toolbar panel">
        <Segmented
          value={period}
          onChange={setPeriod}
          options={["日报", "周报", "月报", "季报", "年报"]}
        />
        <Input
          type="date"
          aria-label="日志日期"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          style={{ width: 160 }}
        />
        <Select
          aria-label="日志归属人"
          value={person}
          onChange={setPerson}
          options={options(owners)}
        />
      </div>
      <div className="daily-layout">
        <Section
          title={
            <>
              {person}的{period}
              <span className="muted date-inline">
                {start} {start !== date ? `— ${date}` : ""}
              </span>
            </>
          }
        >
          <div className="daily-stats">
            <div>
              <b>{records.length}</b>
              <span>销售沟通</span>
            </div>
            <div>
              <b>{knowledge.length}</b>
              <span>学习资料</span>
            </div>
            <div>
              <b>{services.length}</b>
              <span>服务事项</span>
            </div>
            <div>
              <b>{audits.length}</b>
              <span>新增贡献</span>
            </div>
          </div>
          <div className="daily-section">
            <h4>
              <i className="blue" />
              销售 · 自动汇总
            </h4>
            {records.length ? (
              records.map((r) => (
                <div className="daily-record" key={r.id}>
                  <small>
                    {r.date.slice(5, 16)} · {r.method}
                  </small>
                  <AccessHtmlButton
                    onClick={() =>
                      detail(
                        r.projectId ? "projects" : "customers",
                        r.projectId || r.customerId,
                      )
                    }
                    permission="detail"
                  >
                    {r.title}
                  </AccessHtmlButton>
                  <p>{r.content}</p>
                </div>
              ))
            ) : (
              <p className="muted">此时间范围暂无沟通记录。</p>
            )}
          </div>
          <div className="daily-section">
            <h4>
              <i className="purple" />
              学习 · 自动汇总
            </h4>
            {knowledge.map((k) => (
              <p key={k.id}>
                <Button
                  type="link"
                  onClick={() => detail("knowledge", k.id)}
                  permission="detail"
                  menu={"knowledge"}
                >
                  {k.name}
                </Button>
                <Status value={k.status} />
              </p>
            ))}
            {!knowledge.length && (
              <p className="muted">此时间范围暂无学习资料。</p>
            )}
          </div>
          <div className="daily-section">
            <h4>
              <i className="teal" />
              售前售后 · 自动汇总
            </h4>
            {services.map((s) => (
              <p key={s.id}>
                {s.date} · {s.name} · {s.status}
              </p>
            ))}
            {!services.length && (
              <p className="muted">此时间范围暂无服务事项。</p>
            )}
          </div>
        </Section>
        <Section title="期间市场与行政活动">
          {activities.map((r) => (
            <p key={r.id}>
              {r.date} · {r.category} · {r.name}：{r.content}
            </p>
          ))}
          {!activities.length && (
            <p className="muted">
              此期间没有活动记录，可在“市场与行政”中新增。
            </p>
          )}
          {period !== "日报" &&
            periodNotes.map((r) => (
              <div key={r.id}>
                <b>{r.date}</b>
                <p>{r.administration}</p>
                <p>{r.summary}</p>
                <p>{r.plan}</p>
              </div>
            ))}
        </Section>
        <Section title="行政、总结与计划">
          <Form
            key={`${person}-${date}`}
            form={form}
            layout="vertical"
            initialValues={
              daily || { administration: "", summary: "", plan: "" }
            }
            onFinish={(values: any) => {
              if (!can("daily", "edit"))
                return void message.error("没有修改日志的权限");
              values = writableValues(
                values,
                rawState.admin!.fields.daily,
                (key) => access.field("daily", "list", key),
              );
              const existingDaily = rawState.daily.find(
                (d) => d.owner === person && d.date === date,
              );
              values = {
                ...existingDaily,
                ...values,
                custom: { ...existingDaily?.custom, ...values.custom },
              };
              if (
                change("保存工作日志", `${person} · ${date}`, (s) => ({
                  ...s,
                  daily: [
                    ...s.daily.filter(
                      (d) => !(d.owner === person && d.date === date),
                    ),
                    {
                      id: daily?.id || uid("RB"),
                      date,
                      owner: person,
                      ...values,
                    },
                  ],
                }))
              )
                message.success("日志已保存");
            }}
          >
            <p className="muted">手工补充 {date} 的工作内容。</p>
            <Form.Item name="administration" label="行政工作">
              <Input.TextArea rows={3} placeholder="接待、报销、内部协调等" />
            </Form.Item>
            <Form.Item name="summary" label="工作总结">
              <Input.TextArea rows={4} placeholder="进展、问题与需要的支持" />
            </Form.Item>
            <Form.Item name="plan" label="后续计划">
              <Input.TextArea rows={3} placeholder="下一步要完成的工作" />
            </Form.Item>
            <CustomFields />
            <Button
              block
              type="primary"
              htmlType="submit"
              disabled={!can("daily", "edit")}
            >
              保存日志
            </Button>
          </Form>
          <DividerLine />
          <h4>已有下一次跟进计划</h4>
          {state.projects
            .filter(
              (p) => p.owner === person && p.nextPlan && p.status === "跟进中",
            )
            .map((p) => (
              <div className="next-plan" key={p.id}>
                <small>{p.nextDate}</small>
                <p>
                  {p.name} · {p.nextPlan}
                </p>
              </div>
            ))}
        </Section>
      </div>
    </>
  );
}
const DividerLine = () => <div className="divider-line" />;

export function ReportsPage() {
  const { state, actor, role, change, navigate } = useCRM();
  const {
    can,
    access,
    rawState,
    page,
    area: permissionArea,
    ownerNames: owners,
    manager,
    visible,
    editable,
    projectView,
  } = useCRM();
  const { message, modal } = App.useApp();
  const [group, setGroup] = useState("负责人");
  const [mode, setMode] = useState("列表");
  const [range, setRange] = useState<[string, string]>([
    today().slice(0, 4) + "-01-01",
    today(),
  ]);
  const inRange = (date: string) =>
    date.slice(0, 10) >= range[0] && date.slice(0, 10) <= range[1];
  const leads = state.leads.filter(
    (l) => visible(role, actor, l.owner) && inRange(l.createdAt),
  );
  const projects = state.projects.filter(
    (p) => visible(role, actor, p.owner) && inRange(p.createdAt),
  );
  const records = state.communications.filter(
    (c) => visible(role, actor, c.owner) && inRange(c.date),
  );
  const orders = state.orders.filter(
    (o) => visible(role, actor, o.owner) && inRange(o.date),
  );
  const groups =
    group === "负责人"
      ? [...new Set(leads.map((l) => l.owner))]
      : group === "来源"
        ? ["星谱咨询", "自己新建"]
        : state.dictionaries.brands;
  const rows = groups.map((name) => {
    const subset = leads.filter(
      (l) =>
        (group === "负责人"
          ? l.owner
          : group === "来源"
            ? l.source
            : l.brand) === name,
    );
    const related = projects.filter((p) =>
      group === "负责人"
        ? p.owner === name
        : group === "品牌"
          ? p.brand === name
          : subset.some((l) => l.id === p.leadId),
    );
    const won = subset.filter((l) => l.status === "已成单").length;
    return {
      id: name,
      name,
      leads: subset.length,
      projects: related.length,
      won,
      rate: subset.length ? ((won / subset.length) * 100).toFixed(1) : "0.0",
      records: records.filter((r) => related.some((p) => p.id === r.projectId))
        .length,
      budget: related.reduce((s, p) => s + p.budget, 0),
      expected: related
        .filter((p) => p.status === "跟进中")
        .reduce((s, p) => s + expected(p.budget, p.probability), 0),
    };
  });
  const expenses = state.expenses.filter((e) => !e.deleted && inRange(e.date));
  const revenue = orders.reduce((s, o) => s + o.amount, 0);
  const margin = orders.reduce(
    (s, o) => s + o.amount - o.cost - o.freight - o.commission - o.otherCost,
    0,
  );
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const sourceReadable = (
    menu: any,
    keys: string[],
    area: "list" | "export" = "list",
  ) =>
    can(menu, area === "export" ? "export" : "view", area) &&
    keys.every(
      (key) =>
        access.field(menu, area, key) !== "hidden" &&
        access.field(menu, "list", key) !== "hidden",
    );
  const summaryColumns = [
    {
      key: "name",
      title: group,
      deps: [
        [
          "leads",
          [
            group === "负责人"
              ? "owner"
              : group === "来源"
                ? "source"
                : "brand",
          ],
        ],
      ],
    },
    { key: "leads", title: "线索数", deps: [["leads", []]] },
    { key: "projects", title: "项目数", deps: [["projects", []]] },
    { key: "won", title: "成单数", deps: [["leads", ["status"]]] },
    { key: "rate", title: "成单率 %", deps: [["leads", ["status"]]] },
    { key: "records", title: "沟通条数", deps: [["projects", []]] },
    { key: "budget", title: "预算总额", deps: [["projects", ["budget"]]] },
    {
      key: "expected",
      title: "在跟预期金额",
      deps: [["projects", ["budget", "probability", "status"]]],
    },
  ];
  const visibleColumns = (area: "list" | "export") =>
    summaryColumns.filter(
      (col) =>
        access.field("reports", area, col.key) !== "hidden" &&
        col.deps.every(([menu, keys]) =>
          sourceReadable(menu, keys as string[], area),
        ),
    );
  return (
    <>
      <PageHeading
        title="数据统计"
        description="用真实的业务记录，理解增长来自哪里。"
        actions={
          <Button
            icon={<DownloadOutlined />}
            disabled={!can(page, "export")}
            onClick={async () => {
              try {
                if (!can("reports", "export", "export")) return;
                const columns = visibleColumns("export");
                if (!columns.length)
                  return void message.warning("没有可导出的统计字段");
                await exportExcel(
                  "销售统计",
                  columns.map((c) => c.title),
                  rows.map((r) => columns.map((c) => (r as any)[c.key])),
                );
                change("导出统计", group, (s) => ({ ...s }), true);
              } catch {
                message.error("导出失败");
              }
            }}
            permission="export"
            region="export"
          >
            导出 Excel
          </Button>
        }
      />
      <Section>
        <div className="section-toolbar">
          <DatePicker.RangePicker
            value={[dayjs(range[0]), dayjs(range[1])]}
            allowClear={false}
            onChange={(v) =>
              v?.[0] &&
              v?.[1] &&
              setRange([v[0].format("YYYY-MM-DD"), v[1].format("YYYY-MM-DD")])
            }
          />
          <Select
            value={group}
            aria-label="统计维度"
            onChange={setGroup}
            options={options(["负责人", "来源", "品牌"])}
          />
          <Segmented
            value={mode}
            onChange={setMode}
            options={["列表", "图表"]}
          />
        </div>
        {mode === "列表" ? (
          <Table
            rowKey="id"
            dataSource={rows}
            pagination={false}
            scroll={{ x: 800 }}
            columns={visibleColumns("list").map((c) => ({
              title: c.title,
              dataIndex: c.key,
              render: (v: any) =>
                ["budget", "expected"].includes(c.key) ? money(v) : v,
            }))}
          />
        ) : (
          <div className="report-chart">
            {rows.map((r) => (
              <div key={r.id}>
                {visibleColumns("list").some((c) => c.key === "name") && (
                  <strong>{r.name}</strong>
                )}
                {visibleColumns("list").some((c) => c.key === "leads") && (
                  <>
                    <div>
                      <i
                        style={{
                          width: `${(r.leads / Math.max(1, ...rows.map((r) => r.leads))) * 100}%`,
                        }}
                      />
                    </div>
                    <span>{r.leads} 条线索</span>
                  </>
                )}
                {visibleColumns("list").some((c) => c.key === "rate") && (
                  <Tag color="blue">成单率 {r.rate}%</Tag>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="panel-footnote">
          线索成单率 = 成单线索数 ÷
          线索总数。沟通次数按记录条数统计。各表按自身创建或发生日期筛选。
        </p>
      </Section>
      {can(page, "finance") && can("costs", "view") && (
        <>
          <div className="section-title-row">
            <h2>成本与经营概览</h2>
            <Button
              icon={<PlusOutlined />}
              onClick={() => navigate("costs")}
              menu="costs"
              permission="create"
            >
              登记成本
            </Button>
          </div>
          <div className="finance-summary">
            <div>
              <span>订单成交金额</span>
              <b>
                ¥ {sourceReadable("orders", ["amount"]) ? money(revenue) : "—"}
              </b>
            </div>
            <div>
              <span>订单利润（演示）</span>
              <b>
                ¥{" "}
                {sourceReadable("orders", [
                  "amount",
                  "cost",
                  "freight",
                  "commission",
                  "otherCost",
                ])
                  ? money(margin)
                  : "—"}
              </b>
            </div>
            <div>
              <span>公司运营成本</span>
              <b>
                ¥{" "}
                {sourceReadable("costs", ["amount"])
                  ? money(expenseTotal)
                  : "—"}
              </b>
            </div>
            <div>
              <span>经营结余（演示）</span>
              <b>
                ¥{" "}
                {sourceReadable("orders", [
                  "amount",
                  "cost",
                  "freight",
                  "commission",
                  "otherCost",
                ]) && sourceReadable("costs", ["amount"])
                  ? money(margin - expenseTotal)
                  : "—"}
              </b>
            </div>
          </div>
          <Section title="公司运营成本明细">
            <Table
              rowKey="id"
              size="small"
              dataSource={expenses}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 600 }}
              columns={[
                { title: "日期", dataIndex: "date" },
                { title: "类别", dataIndex: "category" },
                {
                  title: "金额",
                  dataIndex: "amount",
                  render: (v: number) => `¥ ${money(v)}`,
                },
                { title: "登记人", dataIndex: "owner" },
                { title: "说明", dataIndex: "note" },
              ].filter(
                (c) => access.field("costs", "list", c.dataIndex) !== "hidden",
              )}
            />
            <p className="panel-footnote">
              本页演示订单利润减运营成本的逻辑；不作为已确认的净利润。税率、汇率修正、佣金及薪酬分摊口径需商务确认。
            </p>
          </Section>
        </>
      )}
    </>
  );
}
