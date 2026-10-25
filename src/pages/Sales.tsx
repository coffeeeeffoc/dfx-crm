import { ActionButton as Button, AccessHtmlButton } from "../permission-ui";
import { useState } from "react";
import {
  App,
  Modal,
  Popconfirm,
  Progress,
  Segmented,
  Select,
  Space,
  Tag,
} from "antd";
import {
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useCRM } from "../context";
import {
  DataList,
  Filters,
  FilterSelect,
  PageHeading,
  Person,
  Section,
  Status,
  options,
} from "../components";
import {
  claimCustomer,
  convertLead,
  expected,
  isOverdue,
  money,
  stages,
} from "../domain";
import { exportExcel } from "../storage";
import { ImportCustomers } from "../import";

export function Leads() {
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
  const { message } = App.useApp();
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("全部");
  const [source, setSource] = useState("全部");
  const customer = (id: string) => state.customers.find((c) => c.id === id);
  const data = state.leads.filter(
    (l) =>
      visible(role, actor, l.owner) &&
      (status === "全部" || l.status === status) &&
      (source === "全部" || l.source === source) &&
      `${l.name}${l.id}${customer(l.customerId)?.name}${customer(l.customerId)?.company}${l.brand}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const convert = (id: string) => {
    const lead = rawState.leads.find((l) => l.id === id);
    if (!lead || !access.owns(lead.owner) || !can("leads", "convert"))
      return void message.error("请先领取线索，或选择本人及下属的记录");
    if (change("线索转项目", id, (s) => convertLead(s, id)))
      message.success("已创建跟进项目，原线索已保留");
  };
  return (
    <>
      {importing && (
        <ImportCustomers kind="leads" onClose={() => setImporting(false)} />
      )}
      <PageHeading
        title="线索管理"
        description="从第一次咨询开始，让每一个机会有迹可循。"
        actions={
          <>
            <Button
              icon={<UploadOutlined />}
              permission="import"
              onClick={() => setImporting(true)}
            >
              导入线索 Excel
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!can("leads", "create")}
              onClick={() => edit("leads")}
              permission="create"
              menu={"leads"}
            >
              新建线索
            </Button>
          </>
        }
      />
      <div className="summary-strip">
        <span>
          全部线索 <b>{data.length}</b>
        </span>
        <span>
          待分配 <b>{data.filter((l) => l.status === "待分配").length}</b>
        </span>
        <span>
          已转项目 <b>{data.filter((l) => l.projectId).length}</b>
        </span>
        <span>线索保留，过程持续关联</span>
      </div>
      <Section>
        <Filters search={search} onSearch={setSearch}>
          <FilterSelect
            value={source}
            onChange={setSource}
            values={["星谱咨询", "自己新建"]}
            label="线索来源"
          />
          <FilterSelect
            value={status}
            onChange={setStatus}
            values={["待分配", "跟进中", "已成单", "已放弃"]}
            label="线索状态"
          />
        </Filters>
        <DataList
          data={data}
          columns={[
            {
              title: "线索名称 / 编号",
              dataIndex: "name",
              width: 240,
              render: (_, l) => (
                <div className="table-title">
                  <AccessHtmlButton
                    onClick={() => detail("leads", l.id)}
                    permission="detail"
                    menu={"leads"}
                  >
                    {l.name}
                  </AccessHtmlButton>
                  <small>{l.id}</small>
                </div>
              ),
            },
            {
              key: "fields:customerId:4913",
              title: "客户",
              width: 200,
              render: (_, l) => (
                <div>
                  {customer(l.customerId)?.company}
                  <small className="subline">
                    {customer(l.customerId)?.name}
                  </small>
                </div>
              ),
            },
            {
              key: "fields:source,sourceDetail:5279",
              title: "线索来源",
              render: (_, l) => (
                <div>
                  {l.source}
                  <small className="subline">{l.sourceDetail}</small>
                </div>
              ),
            },
            { title: "咨询品牌", dataIndex: "brand" },
            {
              title: "负责人",
              dataIndex: "owner",
              render: (v) => <Person name={v} />,
            },
            {
              title: "状态",
              dataIndex: "status",
              render: (v) => <Status value={v} />,
            },
            {
              key: "fields:id,projectId,owner:5886",
              title: "操作",
              width: 160,
              render: (_, l) => (
                <Space>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => detail("leads", l.id)}
                    permission="detail"
                    menu={"leads"}
                  >
                    详情
                  </Button>
                  {l.projectId ? (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => detail("projects", l.projectId!)}
                      permission="detail"
                      menu={"projects"}
                    >
                      查看项目
                    </Button>
                  ) : l.owner === "待分配" ? (
                    <Button
                      type="link"
                      size="small"
                      disabled={!can("leads", "assign")}
                      onClick={() => edit("leads", l.id)}
                      permission="assign"
                      menu={"leads"}
                    >
                      分配
                    </Button>
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      disabled={!editable(role, actor, l.owner)}
                      onClick={() => convert(l.id)}
                      permission="convert"
                    >
                      转项目
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
          card={(l) => (
            <>
              <div className="card-title-row">
                <AccessHtmlButton
                  onClick={() => detail("leads", l.id)}
                  permission="detail"
                  menu={"leads"}
                >
                  {l.name}
                </AccessHtmlButton>
                <Status value={l.status} />
              </div>
              <p>
                {customer(l.customerId)?.company} ·{" "}
                {customer(l.customerId)?.name}
              </p>
              <div className="card-meta">
                <Tag>{l.source}</Tag>
                <span>{l.brand}</span>
              </div>
              <div className="card-bottom">
                <Person name={l.owner} />
                {l.projectId ? (
                  <Button
                    size="small"
                    onClick={() => detail("projects", l.projectId!)}
                    permission="detail"
                    menu={"projects"}
                  >
                    查看项目
                  </Button>
                ) : (
                  <Button
                    size="small"
                    disabled={!editable(role, actor, l.owner)}
                    onClick={() => convert(l.id)}
                    permission="convert"
                  >
                    转跟进项目
                  </Button>
                )}
              </div>
            </>
          )}
        />
      </Section>
    </>
  );
}

export function Projects() {
  const { state, actor, role, edit, detail, communicate } = useCRM();
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
  const [status, setStatus] = useState("全部");
  const [brand, setBrand] = useState("全部");
  const [mode, setMode] = useState("列表");
  const [onlyDue, setOnlyDue] = useState(false);
  const data = state.projects
    .map((p) => projectView(p, role, actor))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .filter(
      (p) =>
        (status === "全部" || p.status === status) &&
        (brand === "全部" || p.brand === brand) &&
        (!onlyDue || isOverdue(p.nextDate, p.status)) &&
        `${p.name}${p.id}${state.customers.find((c) => c.id === p.customerId)?.company}${p.brand}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(isOverdue(b.nextDate, b.status)) -
        Number(isOverdue(a.nextDate, a.status)),
    );
  return (
    <>
      <PageHeading
        title="跟进项目"
        description="从方案到成交，清晰记录每一步进展。"
        actions={
          <>
            <Segmented
              value={mode}
              onChange={setMode}
              options={["列表", "阶段看板"]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!can("projects", "create")}
              onClick={() => edit("projects")}
              permission="create"
              menu={"projects"}
            >
              新建项目
            </Button>
          </>
        }
      />
      <div className="summary-strip">
        <span>
          在跟金额{" "}
          <b>
            ¥{" "}
            {money(
              data
                .filter((p) => p.status === "跟进中")
                .reduce((s, p) => s + p.budget, 0),
            )}
          </b>
        </span>
        <span>
          预期金额{" "}
          <b>
            ¥{" "}
            {money(
              data
                .filter((p) => p.status === "跟进中")
                .reduce((s, p) => s + expected(p.budget, p.probability), 0),
            )}
          </b>
        </span>
        <Button
          type={onlyDue ? "primary" : "text"}
          danger
          onClick={() => setOnlyDue(!onlyDue)}
        >
          只看逾期
        </Button>
      </div>
      <Section>
        <Filters search={search} onSearch={setSearch}>
          <FilterSelect
            label="项目状态"
            value={status}
            onChange={setStatus}
            values={["跟进中", "已成单", "已放弃", "已转交"]}
          />
          <FilterSelect
            label="品牌"
            value={brand}
            onChange={setBrand}
            values={state.dictionaries.brands}
          />
        </Filters>
        {mode === "阶段看板" ? (
          <div className="kanban">
            {stages.map((s) => (
              <div className="kanban-column" key={s.value}>
                <h4>
                  <i style={{ background: s.color }} />
                  {s.short}
                  <span>{data.filter((p) => p.stage === s.value).length}</span>
                </h4>
                {data
                  .filter((p) => p.stage === s.value)
                  .map((p) => (
                    <AccessHtmlButton
                      key={p.id}
                      onClick={() => detail("projects", p.id)}
                      permission="detail"
                      menu={"projects"}
                    >
                      <Tag>{p.brand}</Tag>
                      <strong>{p.name}</strong>
                      <small>
                        {
                          state.customers.find((c) => c.id === p.customerId)
                            ?.company
                        }
                      </small>
                      <b>¥ {money(p.budget)}</b>
                      <Person name={p.owner} />
                    </AccessHtmlButton>
                  ))}
              </div>
            ))}
          </div>
        ) : (
          <DataList
            data={data}
            columns={[
              {
                key: "fields:id,name,customerId:12972",
                title: "项目名称",
                width: 240,
                render: (_, p) => (
                  <div className="table-title">
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
                      }
                    </small>
                  </div>
                ),
              },
              {
                key: "fields:brand,owner:13614",
                title: "品牌 / 负责人",
                render: (_, p) => (
                  <div>
                    {p.brand}
                    <small className="subline">{p.owner}</small>
                  </div>
                ),
              },
              {
                title: "预算金额",
                dataIndex: "budget",
                sorter: (a, b) => a.budget - b.budget,
                render: (v) => <b className="number">¥ {money(v)}</b>,
              },
              {
                key: "fields:stage:14123",
                title: "跟进阶段",
                width: 180,
                render: (_, p) => (
                  <div>
                    <small>
                      {stages.find((s) => s.value === p.stage)?.short}
                    </small>
                    <Progress
                      percent={p.stage}
                      size="small"
                      strokeColor={
                        stages.find((s) => s.value === p.stage)?.color
                      }
                    />
                  </div>
                ),
              },
              {
                key: "fields:budget,probability:14724",
                title: "预期金额",
                render: (_, p) => (
                  <div>
                    ¥ {money(expected(p.budget, p.probability))}
                    <small className="subline">签单概率 {p.probability}%</small>
                  </div>
                ),
              },
              {
                title: "下次跟进",
                dataIndex: "nextDate",
                render: (v, p) => (
                  <span className={isOverdue(v, p.status) ? "text-danger" : ""}>
                    {v || "未安排"}
                    {isOverdue(v, p.status) && (
                      <small className="subline text-danger">已逾期</small>
                    )}
                  </span>
                ),
              },
              {
                title: "状态",
                dataIndex: "status",
                render: (v) => <Status value={v} />,
              },
              {
                key: "fields:id,owner,customerId:15655",
                title: "操作",
                render: (_, p) => (
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => detail("projects", p.id)}
                      permission="detail"
                      menu={"projects"}
                    >
                      详情
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      disabled={!editable(role, actor, p.owner)}
                      onClick={() => communicate(p.customerId, p.id)}
                      permission="communicate"
                    >
                      写跟进
                    </Button>
                  </Space>
                ),
              },
            ]}
            card={(p) => (
              <>
                <div className="card-title-row">
                  <AccessHtmlButton
                    onClick={() => detail("projects", p.id)}
                    permission="detail"
                    menu={"projects"}
                  >
                    {p.name}
                  </AccessHtmlButton>
                  <Status value={p.status} />
                </div>
                <p>
                  {state.customers.find((c) => c.id === p.customerId)?.company}
                </p>
                <div className="card-bottom">
                  <Tag>{p.brand}</Tag>
                  <b>¥ {money(p.budget)}</b>
                </div>
                <Progress percent={p.stage} size="small" />
                <div className="card-bottom">
                  <span
                    className={
                      isOverdue(p.nextDate, p.status) ? "text-danger" : "muted"
                    }
                  >
                    {p.nextDate || "未安排"}
                    {isOverdue(p.nextDate, p.status) ? " · 已逾期" : ""}
                  </span>
                  <Button
                    size="small"
                    disabled={!editable(role, actor, p.owner)}
                    onClick={() => communicate(p.customerId, p.id)}
                    permission="communicate"
                  >
                    写跟进
                  </Button>
                </div>
              </>
            )}
          />
        )}
      </Section>
    </>
  );
}

export function Customers({ pool = false }: { pool?: boolean }) {
  const { state, actor, role, edit, detail, communicate, change } = useCRM();
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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部");
  const [tag, setTag] = useState("全部");
  const [deleted, setDeleted] = useState("正常客户");
  const [importing, setImporting] = useState(false);
  const data = state.customers.filter(
    (c) =>
      (pool
        ? c.pool && !c.deleted
        : deleted === "已删除"
          ? c.deleted
          : !c.deleted) &&
      (category === "全部" || c.category === category) &&
      (tag === "全部" ||
        [...c.tags, ...(c.personalTags[actor] || [])].includes(tag)) &&
      `${c.name}${c.company}${c.phone}${c.email}${c.id}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const claim = (id: string) => {
    if (change("领取公共客户", id, (s) => claimCustomer(s, id, actor)))
      message.success("领取成功，历史沟通已保留");
  };
  return (
    <>
      <PageHeading
        title={pool ? "公共客户池" : "客户档案"}
        description={
          pool
            ? "共享历史，发现新的合作可能。领取后由你继续跟进。"
            : "让客户资料持续积累，让每一次沟通都能被找到。"
        }
        actions={
          !pool && (
            <>
              <Button
                icon={<UploadOutlined />}
                disabled={!can(page, "import")}
                onClick={() => setImporting(true)}
                permission="import"
              >
                导入 Excel
              </Button>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                disabled={!can("customers", "create")}
                onClick={() => edit("customers")}
                permission="create"
                menu={"customers"}
              >
                新增客户
              </Button>
            </>
          )
        }
      />
      {pool && (
        <div className="info-banner">
          <span className="banner-symbol">◎</span>
          <div>
            <strong>{data.length} 位客户，等待新的连接</strong>
            <p>
              可查看公共池客户的历史记录。领取后，新增跟进由领取人及其主管查看。
            </p>
          </div>
        </div>
      )}
      <Section>
        <Filters
          search={search}
          onSearch={setSearch}
          placeholder="搜索客户、单位、电话或邮箱"
        >
          <FilterSelect
            label="客户类别"
            value={category}
            onChange={setCategory}
            values={state.dictionaries.categories}
          />
          <Select
            aria-label="客户标签"
            value={tag}
            onChange={setTag}
            options={options([
              "全部",
              ...new Set(
                state.customers.flatMap((c) => [
                  ...c.tags,
                  ...(c.personalTags[actor] || []),
                ]),
              ),
            ])}
            style={{ minWidth: 120 }}
          />
          {!pool && (
            <Segmented
              options={["正常客户", "已删除"]}
              value={deleted}
              onChange={setDeleted}
            />
          )}
        </Filters>
        <DataList
          data={data}
          columns={[
            {
              key: "fields:id,name,title,company:22660",
              title: "客户 / 单位",
              width: 250,
              render: (_, c) => (
                <div className="table-title">
                  <AccessHtmlButton
                    onClick={() => detail("customers", c.id)}
                    permission="detail"
                    menu={"customers"}
                  >
                    {c.name}
                    <span className="name-title">{c.title.split("/")[0]}</span>
                  </AccessHtmlButton>
                  <small>{c.company}</small>
                </div>
              ),
            },
            {
              key: "fields:phone,email:23190",
              title: "联系方式",
              render: (_, c) => (
                <div>
                  {c.phone}
                  <small className="subline">{c.email}</small>
                </div>
              ),
            },
            {
              key: "fields:category,region:23444",
              title: "类别 / 地区",
              render: (_, c) => (
                <div>
                  {c.category}
                  <small className="subline">{c.region}</small>
                </div>
              ),
            },
            {
              key: "fields:tags:23705",
              title: "客户标签",
              width: 180,
              render: (_, c) => (
                <div>
                  {c.tags.map((t) => (
                    <Tag key={t} variant="filled" color="blue">
                      {t}
                    </Tag>
                  ))}
                </div>
              ),
            },
            {
              key: "fields:poolReason,owner:24076",
              title: pool ? "转入原因" : "负责人",
              render: (_, c) =>
                pool ? (
                  <span className="muted">{c.poolReason}</span>
                ) : (
                  <Person name={c.owner} />
                ),
            },
            {
              key: "fields:id,deleted,company,owner:24364",
              title: "操作",
              width: 170,
              render: (_, c) => (
                <Space>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => detail("customers", c.id)}
                    permission="detail"
                    menu={"customers"}
                  >
                    详情
                  </Button>
                  {pool ? (
                    <Button
                      size="small"
                      type="link"
                      disabled={!can(page, "claim")}
                      onClick={() => claim(c.id)}
                      permission="claim"
                    >
                      领取
                    </Button>
                  ) : c.deleted ? (
                    <Button
                      type="link"
                      size="small"
                      disabled={!can(page, "restore")}
                      onClick={() =>
                        change("恢复客户", c.company, (s) => ({
                          ...s,
                          customers: s.customers.map((x) =>
                            x.id === c.id ? { ...x, deleted: false } : x,
                          ),
                        }))
                      }
                      permission="restore"
                    >
                      恢复
                    </Button>
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      disabled={!editable(role, actor, c.owner)}
                      onClick={() => communicate(c.id)}
                      permission="communicate"
                    >
                      写跟进
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
          card={(c) => (
            <>
              <div className="card-title-row">
                <AccessHtmlButton
                  onClick={() => detail("customers", c.id)}
                  permission="detail"
                  menu={"customers"}
                >
                  {c.name}
                </AccessHtmlButton>
                <Tag>{c.category}</Tag>
              </div>
              <p>{c.company}</p>
              <p className="muted">
                {pool ? c.poolReason : `${c.phone} · ${c.region}`}
              </p>
              <div className="card-bottom">
                <span>
                  {c.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </span>
                {pool ? (
                  <Button
                    size="small"
                    type="primary"
                    disabled={!can(page, "claim")}
                    onClick={() => claim(c.id)}
                    permission="claim"
                  >
                    领取客户
                  </Button>
                ) : (
                  <Button
                    size="small"
                    onClick={() => detail("customers", c.id)}
                    permission="detail"
                    menu={"customers"}
                  >
                    查看详情
                  </Button>
                )}
              </div>
            </>
          )}
        />
      </Section>
      {importing && <ImportCustomers onClose={() => setImporting(false)} />}
    </>
  );
}
