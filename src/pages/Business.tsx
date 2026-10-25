import { ActionButton as Button, AccessHtmlButton } from "../permission-ui";
import { useState } from "react";
function LoanFiles({
  onChange,
  readOnly = false,
}: {
  onChange: (v: Attachment[]) => void;
  readOnly?: boolean;
}) {
  const [value, setValue] = useState<Attachment[]>([]);
  return (
    <Attachments
      value={value}
      readOnly={readOnly}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}
import {
  App,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  Table,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useCRM } from "../context";
import {
  DataList,
  Attachments,
  Filters,
  FilterSelect,
  PageHeading,
  Section,
  Status,
} from "../components";
import { available, money, quoteTotal, today, uid } from "../domain";
import type { Inventory, Order, Quote, Service, Attachment } from "../domain";
import { maskRecord } from "../access";
import { filterRecords } from "../records";
import { loanFields } from "../material-fields";

export function Business({
  kind,
}: {
  kind: "quotes" | "orders" | "services" | "inventory";
}) {
  const { state, actor, role, edit, detail, change } = useCRM();
  const {
    can,
    filters,
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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("全部");
  const labels = {
    quotes: ["报价管理", "统一产品明细、报价有效期与客户方案。", "新建报价"],
    orders: ["订单与收款", "跟踪合同履约、每一笔回款和订单成本。", "新增订单"],
    services: [
      "售前售后",
      "把服务申请、安装调试与技术经验留在团队。",
      "新建服务单",
    ],
    inventory: [
      "库存与物料",
      "销售样机与研发物料，借出和归还都有记录。",
      "新增物料",
    ],
  };
  const states = {
    quotes: ["草稿", "已发送", "客户确认", "已失效"],
    orders: ["待付款", "待发货", "已发货", "待验收", "已完成"],
    services: ["待服务", "服务中", "已完成"],
    inventory: ["销售样机", "研发物料", "安装物料"],
  };
  const data = (state[kind] as (Quote | Order | Service | Inventory)[]).filter(
    (x) =>
      (!("owner" in x) || visible(role, actor, x.owner || "")) &&
      (status === "全部" ||
        ("status" in x ? x.status : x.category) === status) &&
      JSON.stringify(x).toLowerCase().includes(search.toLowerCase()),
  );
  const customerName = (x: any) =>
    state.customers.find((c) => c.id === x.customerId)?.company;
  const loan = (listed: Inventory) => {
    const item = maskRecord(
      rawState.inventory.find((i) => i.id === listed.id)!,
      rawState.admin!.fields.inventory,
      (key) => access.field("inventory", "borrow", key),
    );
    if (
      !can("inventory", "borrow", "borrow") ||
      [
        "loans",
        "loans.borrower",
        "loans.quantity",
        "loans.date",
        "loans.dueDate",
        "loans.purpose",
      ].some((key) => access.field("inventory", "borrow", key) !== "write") ||
      access.field("inventory", "borrow", "quantity") === "hidden"
    )
      return void message.warning("没有借用记录的写入权限");
    let count: number | null = 1;
    let due = today();
    let purpose = "";
    let borrower = actor;
    const loanDetails: Record<string, string | number> = {};
    let attachments: Attachment[] = [];
    modal.confirm({
      title: `借用 · ${item.name}`,
      content: (
        <Space orientation="vertical" style={{ width: "100%" }}>
          <p>当前可用：{available(item)} 件</p>
          <Input
            aria-label="借用人"
            defaultValue={actor}
            placeholder="借用人"
            onChange={(e) => {
              borrower = e.target.value;
            }}
          />
          <InputNumber
            aria-label="借用数量"
            min={1}
            max={available(item)}
            defaultValue={1}
            precision={0}
            onChange={(v) => {
              count = v;
            }}
          />
          <label>预计归还日期</label>
          <Input
            type="date"
            min={today()}
            defaultValue={due}
            onChange={(e) => {
              due = e.target.value;
            }}
          />
          <Input.TextArea
            placeholder="借用用途（必填）"
            onChange={(e) => {
              purpose = e.target.value;
            }}
          />
          {loanFields
            .filter(
              ([key]) =>
                ![
                  "returnNumber",
                  "totalDays",
                  "overdueDays",
                  "normalFee",
                  "overdueFee",
                  "totalFee",
                ].includes(key) &&
                access.field("inventory", "borrow", `loans.${key}`) !==
                  "hidden",
            )
            .map(([key, label]) => (
              <label key={key}>
                {label}
                {["rent", "deposit"].includes(key) ? (
                  <InputNumber
                    min={0}
                    precision={2}
                    disabled={
                      access.field("inventory", "borrow", `loans.${key}`) !==
                      "write"
                    }
                    onChange={(v) => (loanDetails[key] = Number(v || 0))}
                  />
                ) : (
                  <Input
                    disabled={
                      access.field("inventory", "borrow", `loans.${key}`) !==
                      "write"
                    }
                    onChange={(e) => (loanDetails[key] = e.target.value)}
                  />
                )}
              </label>
            ))}
          {access.field("inventory", "borrow", "loans.attachments") !==
            "hidden" && (
            <LoanFiles
              readOnly={
                access.field("inventory", "borrow", "loans.attachments") !==
                "write"
              }
              onChange={(v) => (attachments = v)}
            />
          )}
        </Space>
      ),
      okText: "确认借出",
      onOk: () => {
        if (
          !count ||
          !Number.isInteger(count) ||
          count > available(item) ||
          due < today() ||
          !borrower.trim() ||
          !purpose.trim()
        ) {
          message.error("请检查数量、归还日期和借用用途");
          return Promise.reject();
        }
        if (
          !change("借出库存", item.name, (s) => ({
            ...s,
            inventory: s.inventory.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    loans: [
                      ...i.loans,
                      {
                        id: uid("JY"),
                        borrower: borrower.trim(),
                        owner: actor,
                        quantity: count!,
                        date: today(),
                        dueDate: due,
                        returnedAt: "",
                        purpose: purpose.trim(),
                        ...loanDetails,
                        attachments,
                      },
                    ],
                  }
                : i,
            ),
          }))
        )
          return Promise.reject();
      },
    });
  };
  const giveBack = (listed: Inventory) => {
    const item = maskRecord(
      rawState.inventory.find((i) => i.id === listed.id)!,
      rawState.admin!.fields.inventory,
      (key) => access.field("inventory", "return", key),
    );
    if (
      !can("inventory", "return", "return") ||
      ["loans", "loans.returnedAt"].some(
        (key) => access.field("inventory", "return", key) !== "write",
      )
    )
      return void message.warning("没有归还记录的写入权限");
    const returnable = item.loans.filter(
      (l) =>
        !l.returnedAt && (access.isAdmin || access.owns(l.owner || l.borrower)),
    );
    let selected = returnable[0]?.id;
    let returnDate = today();
    const returnDetails: Record<string, string | number> = {};
    let returnFiles: Attachment[] = [];
    modal.confirm({
      title: "登记归还",
      content: (
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Select
            style={{ width: "100%" }}
            defaultValue={selected}
            onChange={(v) => {
              selected = v;
            }}
            options={returnable.map((l) => ({
              value: l.id,
              label: `${l.borrower} · ${l.quantity}件 · ${l.date}`,
            }))}
          />
          <label>
            实际归还日期
            <Input
              type="date"
              defaultValue={returnDate}
              onChange={(e) => (returnDate = e.target.value)}
            />
          </label>
          {loanFields
            .filter(
              ([key]) =>
                [
                  "returnNumber",
                  "totalDays",
                  "overdueDays",
                  "normalFee",
                  "overdueFee",
                  "totalFee",
                ].includes(key) &&
                access.field("inventory", "return", `loans.${key}`) !==
                  "hidden",
            )
            .map(([key, label]) => (
              <label key={key}>
                {label}
                <Input
                  disabled={
                    access.field("inventory", "return", `loans.${key}`) !==
                    "write"
                  }
                  type={key === "returnNumber" ? "text" : "number"}
                  min={0}
                  onChange={(e) =>
                    (returnDetails[key] =
                      key === "returnNumber"
                        ? e.target.value
                        : Number(e.target.value))
                  }
                />
              </label>
            ))}
          {access.field("inventory", "return", "loans.attachments") !==
            "hidden" && (
            <LoanFiles
              readOnly={
                access.field("inventory", "return", "loans.attachments") !==
                "write"
              }
              onChange={(v) => (returnFiles = v)}
            />
          )}
        </Space>
      ),
      onOk: () => {
        if (
          !selected ||
          !returnable.some((l) => l.id === selected && returnDate >= l.date)
        ) {
          message.error("请选择借用记录，归还日期不能早于借出日期");
          return Promise.reject();
        }
        if (
          !change("归还库存", item.name, (s) => ({
            ...s,
            inventory: s.inventory.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    loans: i.loans.map((l) =>
                      l.id === selected
                        ? {
                            ...l,
                            returnedAt: returnDate,
                            ...returnDetails,
                            attachments: [
                              ...(l.attachments || []),
                              ...returnFiles,
                            ],
                          }
                        : l,
                    ),
                  }
                : i,
            ),
          }))
        )
          return Promise.reject();
      },
    });
  };
  const loanRows =
    kind === "inventory"
      ? (data as Inventory[]).flatMap((item) =>
          item.loans
            .filter(
              (l) =>
                !!l.borrower &&
                filterRecords([{ ...item, loans: [l] }], filters).length > 0,
            )
            .map((l) => ({ ...l, itemName: item.name, model: item.model })),
        )
      : [];
  const columns: any[] = [
    {
      key: "fields:id,name,model:5491",
      title: kind === "inventory" ? "商品名称 / 型号" : "名称 / 编号",
      width: 240,
      render: (_: any, x: any) => (
        <div className="table-title">
          <AccessHtmlButton
            onClick={() => detail(kind, x.id)}
            permission="detail"
            menu={kind}
          >
            {x.name}
          </AccessHtmlButton>
          <small>{kind === "inventory" ? x.model : x.id}</small>
        </div>
      ),
    },
    ...(kind === "inventory"
      ? [
          { title: "厂家", dataIndex: "brand" },
          {
            key: "fields:category,location:5968",
            title: "归属 / 存放地点",
            render: (_: any, x: Inventory) => (
              <div>
                {x.category}
                <small className="subline">{x.location}</small>
              </div>
            ),
          },
          {
            key: "fields:quantity:6231",
            title: "总量 / 可用",
            render: (_: any, x: Inventory) => (
              <div>
                <b>{x.quantity}</b>
                <span className="muted"> / </span>
                <b className="positive">{available(x)}</b>
              </div>
            ),
          },
          {
            title: "单价",
            dataIndex: "price",
            render: (v: number) => `¥ ${money(v)}`,
          },
          {
            key: "fields:loans:6685",
            title: "借还",
            render: (_: any, x: Inventory) => (
              <Space>
                <Button
                  type="link"
                  size="small"
                  disabled={available(x) < 1 || !can(page, "borrow")}
                  onClick={() => loan(x)}
                  permission="borrow"
                  region="borrow"
                >
                  借用
                </Button>
                <Button
                  type="link"
                  size="small"
                  disabled={
                    !x.loans.some((l) => !l.returnedAt) || !can(page, "return")
                  }
                  onClick={() => giveBack(x)}
                  permission="return"
                  region="return"
                >
                  归还
                </Button>
              </Space>
            ),
          },
        ]
      : [
          {
            title: "客户单位",
            width: 200,
            render: (_: any, x: any) => customerName(x),
          },
          { title: "负责人", dataIndex: "owner" },
          ...(kind === "quotes"
            ? [
                {
                  key: "fields:currency:7754",
                  title: "报价总额",
                  render: (_: any, x: Quote) => (
                    <b className="number">
                      {x.currency} {money(quoteTotal(x))}
                    </b>
                  ),
                },
                { title: "有效期至", dataIndex: "expiry" },
              ]
            : kind === "orders"
              ? [
                  { title: "合同号", dataIndex: "contract" },
                  {
                    title: "成交金额",
                    dataIndex: "amount",
                    render: (v: number) => `¥ ${money(v)}`,
                  },
                  {
                    key: "fields:amount,payments:8397",
                    title: "未收金额",
                    render: (_: any, x: Order) => (
                      <span
                        className={
                          x.amount >
                          x.payments.reduce((sum, p) => sum + p.amount, 0)
                            ? "text-warning"
                            : "positive"
                        }
                      >
                        ¥{" "}
                        {money(
                          x.amount -
                            x.payments.reduce((sum, p) => sum + p.amount, 0),
                        )}
                      </span>
                    ),
                  },
                ]
              : [
                  { title: "服务类型", dataIndex: "type" },
                  { title: "预约日期", dataIndex: "date" },
                ]),
          {
            title: "状态",
            dataIndex: "status",
            render: (v: string) => <Status value={v} />,
          },
        ]),
    {
      key: "fields:id:9445",
      title: "操作",
      width: 100,
      render: (_: any, x: any) => (
        <Button
          type="link"
          size="small"
          onClick={() => detail(kind, x.id)}
          permission="detail"
          menu={kind}
        >
          查看详情
        </Button>
      ),
    },
  ];
  return (
    <>
      <PageHeading
        title={labels[kind][0]}
        description={labels[kind][1]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!can(kind, "create")}
            onClick={() => edit(kind)}
            permission="create"
            menu={kind}
          >
            {labels[kind][2]}
          </Button>
        }
      />
      {kind === "orders" && (
        <div className="summary-strip">
          <span>
            合同总额{" "}
            <b>
              ¥ {money((data as Order[]).reduce((s, o) => s + o.amount, 0))}
            </b>
          </span>
          <span>
            累计回款{" "}
            <b>
              ¥{" "}
              {money(
                (data as Order[]).reduce(
                  (s, o) =>
                    s + o.payments.reduce((sum, p) => sum + p.amount, 0),
                  0,
                ),
              )}
            </b>
          </span>
          <span>关联跟进项目与客户档案</span>
        </div>
      )}
      {kind === "inventory" && (
        <div className="summary-strip">
          <span>
            物料种类 <b>{data.length}</b>
          </span>
          <span>
            借用中{" "}
            <b>
              {(data as Inventory[]).reduce(
                (n, i) => n + i.loans.filter((l) => !l.returnedAt).length,
                0,
              )}
            </b>
          </span>
          <span>
            逾期未还{" "}
            <b className="text-danger">
              {(data as Inventory[]).reduce(
                (n, i) =>
                  n +
                  i.loans.filter((l) => !l.returnedAt && l.dueDate < today())
                    .length,
                0,
              )}
            </b>
          </span>
        </div>
      )}
      <Section>
        <Filters search={search} onSearch={setSearch}>
          <FilterSelect
            label="状态或分类"
            value={status}
            onChange={setStatus}
            values={states[kind]}
          />
        </Filters>
        <DataList
          data={data}
          columns={columns}
          card={(x) => (
            <>
              <div className="card-title-row">
                <AccessHtmlButton
                  onClick={() => detail(kind, x.id)}
                  permission="detail"
                  menu={kind}
                >
                  {x.name}
                </AccessHtmlButton>
                {"status" in x && <Status value={x.status} />}
              </div>
              <p>
                {kind === "inventory"
                  ? `${(x as Inventory).brand} · ${(x as Inventory).location}`
                  : customerName(x)}
              </p>
              {kind === "quotes" && (
                <b>
                  {(x as Quote).currency} {money(quoteTotal(x as Quote))}
                </b>
              )}
              {kind === "orders" && <b>¥ {money((x as Order).amount)}</b>}
              {kind === "inventory" && (
                <div className="card-bottom">
                  <span>
                    可用 {available(x as Inventory)} /{" "}
                    {(x as Inventory).quantity}
                  </span>
                  <Space>
                    <Button
                      size="small"
                      disabled={
                        available(x as Inventory) < 1 || !can(page, "borrow")
                      }
                      onClick={() => loan(x as Inventory)}
                      permission="borrow"
                      region="borrow"
                    >
                      借用
                    </Button>
                    <Button
                      size="small"
                      disabled={
                        !(x as Inventory).loans.some((l) => !l.returnedAt) ||
                        !can(page, "return")
                      }
                      onClick={() => giveBack(x as Inventory)}
                      permission="return"
                      region="return"
                    >
                      归还
                    </Button>
                  </Space>
                </div>
              )}
              <div className="card-bottom">
                <span className="muted">{x.id}</span>
                <Button
                  size="small"
                  onClick={() => detail(kind, x.id)}
                  permission="detail"
                  menu={kind}
                >
                  详情
                </Button>
              </div>
            </>
          )}
        />
      </Section>
      {kind === "inventory" &&
        access.field("inventory", "list", "loans") !== "hidden" && (
          <Section title="借还台账">
            <Table
              size="small"
              rowKey="id"
              dataSource={loanRows}
              scroll={{ x: 850 }}
              pagination={{ pageSize: 8 }}
              columns={[
                { title: "物料名称", dataIndex: "itemName" },
                { title: "型号", dataIndex: "model" },
                ...[
                  ["borrower", "借用人"],
                  ["agreement", "协议编号"],
                  ["date", "借出日期"],
                  ["dueDate", "预计归还"],
                  ["returnedAt", "实际归还"],
                  ["purpose", "用途"],
                ]
                  .filter(
                    ([key]) =>
                      access.field("inventory", "list", `loans.${key}`) !==
                      "hidden",
                  )
                  .map(([key, title]) => ({ title, dataIndex: key })),
              ]}
            />
            <p className="panel-footnote">
              库存可用数量全员共享；借用人、协议和收件资料仅向本人、全部下属的主管及管理员展示。借用字段可在上方“增加业务字段条件”中查询。
            </p>
          </Section>
        )}
    </>
  );
}
