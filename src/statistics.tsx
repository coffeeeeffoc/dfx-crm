import { useState } from "react";
import { Button, Modal, Table, Tabs } from "antd";
import { UnorderedListOutlined } from "@ant-design/icons";
import { useCRM } from "./context";
import { scopeData } from "./access";
import { projectFields } from "./permission-ui";
import { ExportRecords } from "./export";
import { Section } from "./components";
import { inRange } from "./records";
import { money } from "./domain";
import type { Page, State } from "./domain";

export function StatisticDetails({
  title,
  rows,
  menu,
  onClose,
}: {
  title: string;
  rows: { id: string }[];
  menu: Page;
  onClose: () => void;
}) {
  const { rawState, access, detail } = useCRM();
  const ids = new Set(rows.map((r) => r.id));
  const kind =
    menu === "pool" ? "customers" : menu === "costs" ? "expenses" : menu;
  const data = (
    (
      projectFields(
        scopeData(rawState, access),
        access,
        "statistics",
        menu,
      ) as any
    )[kind] || []
  ).filter((r: any) => ids.has(r.id));
  const fields = [
    ["name", "名称"],
    ["owner", "负责人"],
    ["status", "状态"],
    ["category", "类别"],
    ["createdAt", "创建时间"],
    ["updatedBy", "更新人"],
    ["updatedAt", "更新时间"],
    ...(menu === "projects"
      ? [
          ["budget", "预算金额"],
          ["probability", "签单概率"],
        ]
      : []),
  ];
  return (
    <Modal
      open
      title={`${title} · 明细`}
      width={980}
      footer={null}
      onCancel={onClose}
    >
      <p className="muted">
        共 {data.length}{" "}
        条，与统计使用相同时间、归属和筛选条件。明细及导出同时遵守列表和统计区域字段权限。
      </p>
      <ExportRecords menu={menu} region="statistics" rows={data} />
      <Table
        rowKey="id"
        size="small"
        scroll={{ x: 720 }}
        dataSource={data}
        pagination={{ pageSize: 8 }}
        columns={fields
          .filter(
            ([key]) =>
              rawState.admin!.fields[kind]?.some((f) => f.key === key) &&
              access.field(menu, "statistics", key) !== "hidden",
          )
          .map(([key, label]) => ({
            title: label,
            dataIndex: key,
            render: (v: any, r: any) =>
              key === "name" &&
              [
                "leads",
                "projects",
                "customers",
                "knowledge",
                "suppliers",
              ].includes(menu) &&
              access.can(menu, "detail", "detail") ? (
                <Button type="link" onClick={() => detail(menu as any, r.id)}>
                  {v || "未命名"}
                </Button>
              ) : key === "budget" ? (
                money(v)
              ) : (
                String(v ?? "—")
              ),
          }))}
      />
    </Modal>
  );
}

export function StatisticsMore({
  leads,
  projects,
  from,
  to,
  onlySelf = false,
}: {
  leads: State["leads"];
  projects: State["projects"];
  from: string;
  to: string;
  onlySelf?: boolean;
}) {
  const { state, actor, access, can } = useCRM();
  const [selection, setSelection] = useState<{
    title: string;
    rows: { id: string }[];
    menu: Page;
  }>();
  const readable = (menu: Page, keys: string[]) =>
    can(menu, "view") &&
    keys.every((k) => access.field(menu, "list", k) !== "hidden");
  const percent = (a: number, b: number) =>
    b ? `${((100 * a) / b).toFixed(1)}%` : "—";
  const detailButton = (title: string, rows: { id: string }[], menu: Page) =>
    can("dashboard", "view", "statistics") &&
    can(menu, "view", "statistics") ? (
      <Button
        type="text"
        aria-label={`查看${title}明细`}
        icon={<UnorderedListOutlined />}
        onClick={() => setSelection({ title, rows, menu })}
      />
    ) : null;
  const grouped = (key: "brand" | "source") =>
    Array.from(new Set(leads.map((l) => l[key]).filter(Boolean))).map(
      (name) => {
        const subset = leads.filter((l) => l[key] === name),
          related = projects.filter((p) =>
            key === "brand"
              ? p.brand === name
              : subset.some((l) => l.id === p.leadId),
          );
        const won = subset.filter((l) => l.status === "已成单");
        return {
          name,
          count: subset.length,
          ratio: percent(subset.length, leads.length),
          projects: related.length,
          rate: readable("leads", ["status"])
            ? percent(won.length, subset.length)
            : "—",
          rows: subset,
        };
      },
    );
  const groupTable = (key: "brand" | "source") => (
    <Table
      size="small"
      rowKey="name"
      pagination={false}
      dataSource={readable("leads", [key]) ? grouped(key) : []}
      columns={[
        { title: key === "brand" ? "产品品牌" : "线索来源", dataIndex: "name" },
        { title: "咨询数", dataIndex: "count" },
        { title: "占比", dataIndex: "ratio" },
        { title: "项目数", dataIndex: "projects" },
        { title: "线索成单率", dataIndex: "rate" },
        {
          title: "明细",
          render: (_, r) => detailButton(r.name, r.rows, "leads"),
        },
      ]}
    />
  );
  const converted = leads.filter(
    (l) =>
      l.convertedAt &&
      l.createdAt &&
      Date.parse(l.convertedAt.replace(" ", "T")) >=
        Date.parse(l.createdAt.replace(" ", "T")),
  );
  const avgDays = converted.length
    ? converted.reduce(
        (sum, l) =>
          sum +
          (Date.parse(l.convertedAt!.replace(" ", "T")) -
            Date.parse(l.createdAt.replace(" ", "T"))) /
            86400000,
        0,
      ) / converted.length
    : undefined;
  const transferred = projects.filter(
    (p) => p.owner === "公共池" || !!p.history?.length,
  );
  const comm = state.communications.filter(
    (c) =>
      projects.some((p) => p.id === c.projectId) && inRange(c.date, from, to),
  );
  const timeSamples = projects
    .map((p) => {
      const dates = comm
        .filter((c) => c.projectId === p.id)
        .map((c) => Date.parse(c.date.replace(" ", "T")))
        .filter(Number.isFinite);
      const start = Date.parse(p.createdAt.replace(" ", "T"));
      return dates.length && Number.isFinite(start)
        ? Math.max(0, (Math.max(...dates) - start) / 86400000)
        : undefined;
    })
    .filter((v): v is number => v !== undefined);
  const metrics = [
    {
      name: "90% 阶段金额",
      value: readable("projects", ["stage", "budget"])
        ? `¥ ${money(projects.filter((p) => p.stage === 90).reduce((s, p) => s + p.budget, 0))}`
        : "—",
      rows: projects.filter((p) => p.stage === 90),
      menu: "projects" as Page,
    },
    {
      name: "100% 阶段金额",
      value: readable("projects", ["stage", "budget"])
        ? `¥ ${money(projects.filter((p) => p.stage === 100).reduce((s, p) => s + p.budget, 0))}`
        : "—",
      rows: projects.filter((p) => p.stage === 100),
      menu: "projects" as Page,
    },
    {
      name: "线索转项目率",
      value: percent(leads.filter((l) => l.projectId).length, leads.length),
      rows: leads,
      menu: "leads" as Page,
    },
    {
      name: "转项目平均用时",
      value:
        avgDays === undefined
          ? "未记录转换时间"
          : `${avgDays.toFixed(1)} 天（${converted.length} 个有效样本）`,
      rows: converted,
      menu: "leads" as Page,
    },
    {
      name: "跟进频次",
      value: `${comm.length} 条沟通 / ${projects.length} 个项目`,
      rows: projects,
      menu: "projects" as Page,
    },
    {
      name: "平均跟进时长",
      value: timeSamples.length
        ? `${(timeSamples.reduce((a, b) => a + b, 0) / timeSamples.length).toFixed(1)} 天`
        : "—",
      rows: projects,
      menu: "projects" as Page,
    },
    {
      name: "转出项目数量 / 占比",
      value: `${transferred.length} / ${percent(transferred.length, projects.length)}`,
      rows: transferred,
      menu: "projects" as Page,
    },
    {
      name: "转出项目可见成单率",
      value: readable("projects", ["status"])
        ? percent(
            transferred.filter((p) => p.status === "已成单").length,
            transferred.length,
          )
        : "—",
      rows: transferred,
      menu: "projects" as Page,
    },
  ];
  const contributions = (
    ["customers", "suppliers", "knowledge", "activities"] as const
  ).map((menu) => {
    const rows = state[menu].filter(
      (r) =>
        !(r as any).deleted &&
        inRange(r.createdAt, from, to) &&
        !!r.createdBy &&
        access.owns(r.createdBy) &&
        (!onlySelf || r.createdBy === actor),
    );
    return {
      menu,
      name: {
        customers: "新增用户信息",
        suppliers: "供应商整理",
        knowledge: "学习档案贡献",
        activities: "市场与行政活动",
      }[menu],
      rows,
      count: rows.length,
    };
  });
  return (
    <Section title="转化、跟进与贡献" className="statistics-extra">
      <Tabs
        items={[
          {
            key: "conversion",
            label: "转化与跟进",
            children: (
              <>
                <Table
                  size="small"
                  rowKey="name"
                  pagination={false}
                  dataSource={metrics}
                  columns={[
                    { title: "指标", dataIndex: "name" },
                    { title: "当前范围", dataIndex: "value" },
                    {
                      title: "明细",
                      render: (_, r) => detailButton(r.name, r.rows, r.menu),
                    },
                  ]}
                />
                <p className="panel-footnote">
                  用时按创建日至转项目日计算；跟进时长按项目创建日至期间最近沟通计算。转出统计仅使用当前有权查看的记录和历史快照，不读取其他团队领取后的私有进展。
                </p>
              </>
            ),
          },
          {
            key: "brand",
            label: "产品咨询与占比",
            children: groupTable("brand"),
          },
          {
            key: "source",
            label: "来源与成交率",
            children: groupTable("source"),
          },
          {
            key: "contributions",
            label: "贡献记录",
            children: (
              <>
                <Table
                  size="small"
                  rowKey="name"
                  pagination={false}
                  dataSource={contributions}
                  columns={[
                    { title: "贡献类型", dataIndex: "name" },
                    { title: "新增数", dataIndex: "count" },
                    {
                      title: "明细",
                      render: (_, r) => detailButton(r.name, r.rows, r.menu),
                    },
                  ]}
                />
                <p className="panel-footnote">
                  贡献按记录的创建人及全部下属归属；访谈、电话等沟通次数在工作日志按沟通方式查询。旧记录未留存创建人时不计入贡献。
                </p>
              </>
            ),
          },
        ]}
      />
      {selection && (
        <StatisticDetails
          {...selection}
          onClose={() => setSelection(undefined)}
        />
      )}
    </Section>
  );
}
