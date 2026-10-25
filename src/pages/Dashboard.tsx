import { StatisticDetails, StatisticsMore } from "../statistics";
import { ActionButton as Button, AccessHtmlButton } from "../permission-ui";
import { useState } from "react";
import {
  Empty,
  Segmented,
  Select,
  Tag,
  Modal,
  Table,
  Input,
  Space,
} from "antd";
import { PermissionArea } from "../permission-ui";
import { ExportRecords } from "../export";
import { inRange } from "../records";
import {
  ArrowRightOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileAddOutlined,
  FolderOpenOutlined,
  MessageOutlined,
  PlusOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { useCRM } from "../context";
import { Metric, Person, Section, Status, options } from "../components";
import { expected, isOverdue, money, stages, today, wan } from "../domain";

export default function Dashboard() {
  const { state, actor, role, navigate, edit, detail, communicate, mobile } =
    useCRM();
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
  const [scope, setScope] = useState("本人及下属");
  const [period, setPeriod] = useState("当年");
  const [customRange, setCustomRange] = useState<[string, string]>([
    today().slice(0, 4) + "-01-01",
    today(),
  ]);
  const [metric, setMetric] = useState<string>();
  const periodStart =
    period === "当年"
      ? today().slice(0, 4) + "-01-01"
      : period === "本月"
        ? today().slice(0, 7) + "-01"
        : period === "当天"
          ? today()
          : period === "本周"
            ? new Date(
                Date.now() - ((new Date().getDay() + 6) % 7) * 86400000,
              ).toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" })
            : period === "自定义"
              ? customRange[0]
              : "";
  const periodEnd = period === "自定义" ? customRange[1] : today();
  const [taskTab, setTaskTab] = useState("待跟进");
  const projects = state.projects.filter(
    (p) =>
      visible(role, actor, p.owner) &&
      (scope !== "仅本人" || p.owner === actor) &&
      inRange(p.createdAt, periodStart, periodEnd),
  );
  const active = projects.filter((p) => p.status === "跟进中");
  const leads = state.leads.filter(
    (l) =>
      visible(role, actor, l.owner) &&
      (scope !== "仅本人" || l.owner === actor) &&
      inRange(l.createdAt, periodStart, periodEnd),
  );
  const won = leads.filter((l) => l.status === "已成单").length;
  const overdue = active.filter((p) => isOverdue(p.nextDate, p.status));
  const due = active
    .filter((p) => p.nextDate && p.nextDate <= today())
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const records = state.communications
    .filter((c) => visible(role, actor, c.owner))
    .sort((a, b) => b.date.localeCompare(a.date));
  const sources = ["星谱咨询", "自己新建"].map((name, i) => ({
    name,
    count: leads.filter((l) => l.source === name).length,
    color: i ? "#7e9fe9" : "#3866dc",
  }));
  const ratio = leads.length
    ? Math.round((sources[0].count / leads.length) * 100)
    : 0;
  const trend = Array.from({ length: 6 }, (_, i) => {
    const month = Number(today().slice(5, 7)) - 5 + i;
    const date = new Date(Number(today().slice(0, 4)), month - 1, 1);
    const prefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: `${date.getMonth() + 1}月`,
      leads: leads.filter(
        (l) =>
          l.createdAt.startsWith(prefix) &&
          visible(role, actor, l.owner) &&
          (scope !== "仅本人" || l.owner === actor),
      ).length,
      projects: projects.filter((p) => p.createdAt.startsWith(prefix)).length,
    };
  });
  const peak = Math.max(5, ...trend.flatMap((t) => [t.leads, t.projects]));
  return (
    <>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">YOUR WORKSPACE, AT A GLANCE</div>
          <h1>
            工作台<span className="heading-dot">.</span>
          </h1>
          <p>你好，{actor}。今天也有新的机会值得期待。</p>
        </div>
        <div className="welcome-actions">
          <span className="date-label">
            <CalendarOutlined />
            {today().replaceAll("-", ".")} ·{" "}
            {new Date().toLocaleDateString("zh-CN", {
              weekday: "long",
              timeZone: "Asia/Shanghai",
            })}
          </span>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => edit("leads")}
            disabled={!can("leads", "create")}
            permission="create"
            menu={"leads"}
          >
            新建线索
          </Button>
        </div>
      </div>
      <div className="dashboard-toolbar">
        <div className="section-label">
          <span className="tiny-line" />
          业务概览 <Tag variant="filled">实时汇总</Tag>
        </div>
        <div className="inline-controls">
          <Select
            value={scope}
            aria-label="业务范围"
            onChange={setScope}
            options={options(["本人及下属", "仅本人"])}
          />
          <Segmented
            value={period}
            onChange={setPeriod}
            options={["当年", "本月", "本周", "当天", "自定义", "全部"]}
          />
          {period === "自定义" && (
            <Space>
              <Input
                type="date"
                aria-label="统计开始日期"
                value={customRange[0]}
                onChange={(e) =>
                  setCustomRange([e.target.value, customRange[1]])
                }
              />
              <Input
                type="date"
                aria-label="统计结束日期"
                value={customRange[1]}
                onChange={(e) =>
                  setCustomRange([customRange[0], e.target.value])
                }
              />
            </Space>
          )}
        </div>
      </div>
      <div className="metrics-grid">
        {access.field("dashboard", "list", "leadCount") !== "hidden" && (
          <>
            {" "}
            <Metric
              label="新增线索"
              onDetails={
                can("dashboard", "view", "statistics") &&
                access.field("dashboard", "statistics", "leadCount") !==
                  "hidden"
                  ? () => setMetric("新增线索")
                  : undefined
              }
              value={leads.length}
              unit="条"
              icon={<ThunderboltOutlined />}
              note={
                <>
                  <span className="positive">
                    {leads.filter((l) => !l.projectId).length} 条
                  </span>{" "}
                  尚待转化为项目
                </>
              }
            />
          </>
        )}
        {access.field("dashboard", "list", "projectCount") !== "hidden" && (
          <>
            {" "}
            <Metric
              label="在跟项目"
              onDetails={
                can("dashboard", "view", "statistics") &&
                access.field("dashboard", "statistics", "projectCount") !==
                  "hidden"
                  ? () => setMetric("在跟项目")
                  : undefined
              }
              value={active.length}
              unit="个"
              icon={<FolderOpenOutlined />}
              color="purple"
              note={
                <>
                  <span className="positive">
                    {active.filter((p) => p.stage >= 70).length} 个
                  </span>{" "}
                  进入采购及签约阶段
                </>
              }
            />
          </>
        )}
        {access.field("dashboard", "list", "expectedAmount") !== "hidden" && (
          <>
            {" "}
            <Metric
              label="项目预期金额"
              onDetails={
                can("dashboard", "view", "statistics") &&
                access.field("dashboard", "statistics", "expectedAmount") !==
                  "hidden"
                  ? () => setMetric("项目预期金额")
                  : undefined
              }
              value={
                access.field("projects", "list", "budget") === "hidden" ||
                access.field("projects", "list", "probability") === "hidden"
                  ? "—"
                  : wan(
                      active.reduce(
                        (s, p) => s + expected(p.budget, p.probability),
                        0,
                      ),
                    )
              }
              unit="万元"
              icon={<DollarOutlined />}
              color="teal"
              note="按项目预算 × 签单概率计算"
            />
          </>
        )}
        {access.field("dashboard", "list", "wonRate") !== "hidden" && (
          <>
            {" "}
            <Metric
              label="线索成单率"
              onDetails={
                can("dashboard", "view", "statistics") &&
                access.field("dashboard", "statistics", "wonRate") !== "hidden"
                  ? () => setMetric("线索成单率")
                  : undefined
              }
              value={
                leads.length ? ((won / leads.length) * 100).toFixed(1) : "0"
              }
              unit="%"
              icon={<RiseOutlined />}
              color="orange"
              note={
                <>
                  {won} 条成单 / {leads.length} 条线索
                </>
              }
            />
          </>
        )}
      </div>
      <div className="dashboard-main-grid">
        {metric && can("dashboard", "view", "statistics") && (
          <StatisticDetails
            title={
              metric === "线索成单率"
                ? `${metric}（已成单 ${won} / 全部 ${leads.length}）`
                : metric
            }
            rows={metric.includes("线索") ? leads : active}
            menu={metric.includes("线索") ? "leads" : "projects"}
            onClose={() => setMetric(undefined)}
          />
        )}
        <Section
          title={
            <>
              <span className="title-icon blue">
                <ClockCircleOutlined />
              </span>
              今日待办 <span className="count-chip">{due.length}</span>
            </>
          }
          extra={
            <Button type="link" onClick={() => navigate("projects")}>
              全部待办 <ArrowRightOutlined />
            </Button>
          }
          className="tasks-panel"
        >
          <div className="task-tabs">
            {["待跟进", "逾期提醒", "待分配"].map((t) => (
              <button
                key={t}
                onClick={() => setTaskTab(t)}
                className={taskTab === t ? "selected" : ""}
              >
                {t}
                <span>
                  {t === "待跟进"
                    ? due.length
                    : t === "逾期提醒"
                      ? overdue.length
                      : state.leads.filter((l) => l.status === "待分配").length}
                </span>
              </button>
            ))}
          </div>
          {taskTab === "待分配" ? (
            <div className="task-list">
              {state.leads
                .filter((l) => l.status === "待分配")
                .slice(0, 4)
                .map((l) => (
                  <div className="task-item" key={l.id}>
                    <span className="task-marker orange" />
                    <div className="task-copy">
                      <AccessHtmlButton
                        onClick={() => detail("leads", l.id)}
                        permission="detail"
                        menu={"leads"}
                      >
                        {l.name}
                      </AccessHtmlButton>
                      <small>
                        {
                          state.customers.find((c) => c.id === l.customerId)
                            ?.company
                        }{" "}
                        · {l.brand}
                      </small>
                    </div>
                    <Button
                      size="small"
                      disabled={!can("leads", "assign")}
                      onClick={() => edit("leads", l.id)}
                      permission="assign"
                      menu={"leads"}
                    >
                      分配
                    </Button>
                  </div>
                ))}
            </div>
          ) : (
            <div className="task-list">
              {(taskTab === "逾期提醒" ? overdue : due).slice(0, 4).map((p) => (
                <div className="task-item" key={p.id}>
                  <span
                    className={`task-marker ${isOverdue(p.nextDate, p.status) ? "red" : "blue"}`}
                  />
                  <div className="task-copy">
                    <AccessHtmlButton
                      onClick={() => detail("projects", p.id)}
                      permission="detail"
                      menu={"projects"}
                    >
                      {p.name}
                    </AccessHtmlButton>
                    <small>
                      {
                        state.customers.find((c) => c.id === p.customerId)
                          ?.company
                      }{" "}
                      <span>·</span> {p.nextPlan}
                    </small>
                    <div className="task-meta">
                      <Person name={p.owner} />
                      <span
                        className={
                          isOverdue(p.nextDate, p.status) ? "text-danger" : ""
                        }
                      >
                        <ClockCircleOutlined />{" "}
                        {isOverdue(p.nextDate, p.status)
                          ? `已逾期 · ${p.nextDate.slice(5)}`
                          : "今天跟进"}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="small"
                    onClick={() => communicate(p.customerId, p.id)}
                    disabled={!editable(role, actor, p.owner)}
                    permission="communicate"
                  >
                    写跟进
                  </Button>
                </div>
              ))}
              {!(taskTab === "逾期提醒" ? overdue : due).length && (
                <Empty description="当前没有到期待办" />
              )}
            </div>
          )}
          <div className="task-footer">
            <CheckCircleOutlined /> 每一次及时跟进，都是下一次合作的开始。
          </div>
        </Section>
        <Section title="快捷工作" className="quick-panel">
          <div className="quick-grid">
            {[
              {
                label: "新建线索",
                sub: "记录一个新机会",
                icon: <ThunderboltOutlined />,
                color: "blue",
                action: () => edit("leads"),
              },
              {
                label: "新增客户",
                sub: "沉淀客户资料",
                icon: <UserAddOutlined />,
                color: "purple",
                action: () => edit("customers"),
              },
              {
                label: "创建报价",
                sub: "推进项目成交",
                icon: <FileAddOutlined />,
                color: "teal",
                action: () => edit("quotes"),
              },
              {
                label: "我的日志",
                sub: "回顾今日工作",
                icon: <CheckCircleOutlined />,
                color: "orange",
                action: () => navigate("daily"),
              },
            ].map((a) => (
              <button
                key={a.label}
                onClick={a.action}
                disabled={
                  a.label === "新建线索"
                    ? !can("leads", "create")
                    : a.label === "新增客户"
                      ? !can("customers", "create")
                      : a.label === "创建报价"
                        ? !can("quotes", "create")
                        : !can("daily", "view")
                }
              >
                <span className={`quick-icon ${a.color}`}>{a.icon}</span>
                <strong>{a.label}</strong>
                <small>{a.sub}</small>
              </button>
            ))}
          </div>
          <div className="pool-banner">
            <span className="pool-art">◎</span>
            <div>
              <strong>让机会再次连接</strong>
              <p>
                公共池里有{" "}
                {state.customers.filter((c) => c.pool && !c.deleted).length}{" "}
                位客户待认领
              </p>
              <Button type="link" onClick={() => navigate("pool")}>
                查看公共客户池 <ArrowRightOutlined />
              </Button>
            </div>
          </div>
        </Section>
      </div>
      <div className="chart-grid">
        <Section
          title="线索与项目趋势"
          extra={
            <span className="chart-legend">
              <i />
              线索
              <i className="light" />
              项目
            </span>
          }
        >
          <div
            className="bar-chart"
            role="img"
            aria-label="最近六个月线索与项目数量"
          >
            <div className="chart-y">
              <span>{peak}</span>
              <span>{Math.round(peak / 2)}</span>
              <span>0</span>
            </div>
            <div className="chart-bars">
              {trend.map((t) => (
                <div className="bar-group" key={t.label}>
                  <div className="bar-pair">
                    <div
                      title={`线索 ${t.leads}`}
                      style={{ height: `${(t.leads / peak) * 100}%` }}
                    >
                      <span>{t.leads || ""}</span>
                    </div>
                    <div
                      title={`项目 ${t.projects}`}
                      style={{ height: `${(t.projects / peak) * 100}%` }}
                    />
                  </div>
                  <small>{t.label}</small>
                </div>
              ))}
            </div>
          </div>
        </Section>
        <Section
          title="项目阶段分布"
          extra={<span className="muted">{projects.length} 个项目</span>}
        >
          <div className="funnel-chart">
            {stages.map((s) => {
              const count = projects.filter((p) => p.stage === s.value).length;
              return (
                <div key={s.value}>
                  <span>{s.short}</span>
                  <div className="funnel-track">
                    <i
                      style={{
                        width: `${Math.max(2, (count / Math.max(1, ...stages.map((s) => projects.filter((p) => p.stage === s.value).length))) * 100)}%`,
                        background: s.color,
                      }}
                    />
                  </div>
                  <b>{count}</b>
                </div>
              );
            })}
          </div>
        </Section>
        <Section
          title="线索来源"
          extra={<span className="muted">{period}</span>}
        >
          <div
            className="donut"
            style={{
              background: `conic-gradient(#3866dc 0 ${ratio}%, #91aaeb ${ratio}% 100%)`,
            }}
          >
            <div>
              <strong>{leads.length}</strong>
              <small>线索总数</small>
            </div>
          </div>
          <div className="source-legend">
            {sources.map((s) => (
              <div key={s.name}>
                <span>
                  <i style={{ background: s.color }} />
                  {s.name}
                </span>
                <b>
                  {s.count}{" "}
                  <small>
                    {leads.length
                      ? Math.round((s.count / leads.length) * 100)
                      : 0}
                    %
                  </small>
                </b>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <StatisticsMore
        leads={leads}
        projects={projects}
        from={periodStart}
        to={periodEnd}
        onlySelf={scope === "仅本人"}
      />
      <div className="dashboard-bottom-grid">
        <Section
          title="重点跟进项目"
          extra={
            <Button type="link" onClick={() => navigate("projects")}>
              全部项目 <ArrowRightOutlined />
            </Button>
          }
        >
          <div className="priority-list">
            {active
              .filter((p) => p.stage >= 50)
              .slice(0, 4)
              .map((p) => (
                <AccessHtmlButton
                  className="priority-item"
                  key={p.id}
                  onClick={() => detail("projects", p.id)}
                  permission="detail"
                  menu={"projects"}
                >
                  <div className="brand-tile">{p.brand.slice(0, 2)}</div>
                  <div>
                    <strong>{p.name}</strong>
                    <small>
                      {
                        state.customers.find((c) => c.id === p.customerId)
                          ?.company
                      }
                    </small>
                  </div>
                  <div className="priority-amount">
                    <b>¥ {money(p.budget)}</b>
                    <small>
                      {stages.find((s) => s.value === p.stage)?.short} ·{" "}
                      {p.probability}%
                    </small>
                  </div>
                  <ArrowRightOutlined />
                </AccessHtmlButton>
              ))}
          </div>
        </Section>
        <Section
          title="团队动态"
          extra={<span className="muted">最近沟通</span>}
        >
          <div className="activity-list">
            {records.slice(0, 4).map((r) => (
              <div className="activity" key={r.id}>
                <span className="activity-dot" />
                <div>
                  <p>
                    <b>{r.owner}</b> 添加了沟通记录
                  </p>
                  <AccessHtmlButton
                    onClick={() =>
                      detail(
                        r.projectId ? "projects" : "customers",
                        r.projectId || r.customerId,
                      )
                    }
                    permission="detail"
                  >
                    {r.title} ·{" "}
                    {
                      state.customers.find((c) => c.id === r.customerId)
                        ?.company
                    }
                  </AccessHtmlButton>
                  <small>{r.date.slice(5, 16)}</small>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
