import { loanFields } from "./material-fields";
import { ArticleBody, ArticleEditor } from "./article";
import { OrderRegions } from "./order-regions";
import { ContactsEditor } from "./contacts";
import { CommunicationActions } from "./communication-actions";
import { releaseLead } from "./domain";
import {
  Form,
  CustomFields,
  CustomDetails,
  RecordMetadata,
  FieldVisible,
} from "./permission-ui";
import { writableValues } from "./access";
import { ActionButton as Button } from "./permission-ui";
import { useState } from "react";
import {
  App,
  Alert,
  Collapse,
  Descriptions,
  Divider,
  Drawer,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tabs,
  Tag,
  Timeline,
} from "antd";
import { Popup, Button as MobileButton } from "antd-mobile";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useCRM } from "./context";
import { Attachments, options, Person, Status } from "./components";
import type {
  Communication,
  Customer,
  EntityKind,
  Project,
  Quote,
  State,
} from "./domain";
import {
  claimCustomer,
  convertLead,
  duplicates,
  emptyCustomer,
  expected,
  money,
  moveToPool,
  now,
  quoteTotal,
  stages,
  today,
  uid,
} from "./domain";

const titles: Record<EntityKind, string> = {
  customers: "客户",
  leads: "线索",
  projects: "跟进项目",
  quotes: "报价",
  orders: "订单",
  services: "服务单",
  inventory: "库存物料",
  suppliers: "供应商",
  knowledge: "学习档案",
};
const required = [{ required: true, whitespace: true, message: "请填写此项" }];
const needed = [{ required: true, message: "请选择或填写此项" }];
const textField = (name: string, label: string, req = false, wide = false) => (
  <Form.Item
    name={name}
    label={label}
    rules={req ? required : undefined}
    className={wide ? "span-2" : ""}
  >
    <Input maxLength={500} />
  </Form.Item>
);
const area = (name: string, label: string, req = false) => (
  <Form.Item
    name={name}
    label={label}
    rules={req ? required : undefined}
    className="span-2"
  >
    <Input.TextArea rows={3} maxLength={10000} showCount />
  </Form.Item>
);
const dateField = (name: string, label: string, req = false) => (
  <Form.Item name={name} label={label} rules={req ? needed : undefined}>
    <Input type="date" />
  </Form.Item>
);
const numberField = (name: string, label: string, max?: number) => (
  <Form.Item name={name} label={label} rules={needed}>
    <InputNumber min={0} max={max} precision={2} style={{ width: "100%" }} />
  </Form.Item>
);

export function Editor({
  kind,
  id,
  preset,
  onClose,
}: {
  kind: EntityKind;
  id?: string;
  preset?: Record<string, unknown>;
  onClose: () => void;
}) {
  const { state, actor, role, mobile, change } = useCRM();
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
  const [form] = Form.useForm();
  const existing = id ? rawState[kind].find((x) => x.id === id) : undefined;
  const common = {
    id: uid(kind.slice(0, 2).toUpperCase()),
    name: "",
    owner: actor,
    date: today(),
    status: "草稿",
    attachments: [],
  };
  const defaults: Record<EntityKind, object> = {
    customers: { ...emptyCustomer(), owner: actor },
    leads: {
      ...common,
      customerId: "",
      source: "星谱咨询",
      sourceDetail: "官网留言",
      referrer: "",
      brand: state.dictionaries.brands[0],
      content: "",
      judgement: "有咨询",
      status: "跟进中",
      createdAt: now(),
    },
    projects: {
      ...common,
      customerId: "",
      brand: state.dictionaries.brands[0],
      model: "",
      application: "",
      budget: 0,
      probability: 10,
      stage: 0,
      status: "跟进中",
      target: "",
      system: "",
      needs: "",
      recommendation: "",
      competitor: "",
      purchaseDate: "",
      purchaseMethod: "内购（含税购买）",
      useDate: "",
      nextDate: today(),
      nextPlan: "",
      createdAt: now(),
      reason: "",
      orderNumber: "",
    },
    quotes: {
      ...common,
      projectId: "",
      customerId: "",
      expiry: today(),
      currency: "CNY",
      purchaseMethod: "内购（含税购买）",
      items: [{ id: uid(), model: "", description: "", quantity: 1, price: 0 }],
      discount: 0,
      freight: 0,
      status: "草稿",
    },
    orders: {
      ...common,
      projectId: "",
      customerId: "",
      contract: "",
      supplierContract: "",
      model: "",
      supplier: "",
      sn: "",
      amount: 0,
      cost: 0,
      freight: 0,
      commission: 0,
      otherCost: 0,
      payments: [],
      supplierPayments: [],
      status: "待付款",
      invoiceDate: "",
      shipDate: "",
      acceptDate: "",
    },
    services: {
      ...common,
      customerId: "",
      orderId: "",
      type: "售后安装",
      model: "",
      warranty: 12,
      tools: "",
      content: "",
      result: "",
      status: "待服务",
    },
    inventory: {
      ...common,
      brand: state.dictionaries.brands[0],
      model: "",
      category: "销售样机",
      location: "上海仓库",
      condition: "良好",
      price: 0,
      cost: 0,
      quantity: 1,
      description: "",
      loans: [],
    },
    suppliers: {
      ...common,
      brand: "",
      contact: "",
      title: "",
      phone: "",
      email: "",
      address: "",
      website: "",
      level: "常规合作",
      notes: "",
    },
    knowledge: {
      ...common,
      category: "产品知识",
      brand: "",
      tags: [],
      content: "",
      url: "",
      status: "草稿",
      reviewNote: "",
    },
  };
  const customerOptions = state.customers
    .filter((c) => !c.deleted)
    .map((c) => ({ label: `${c.company} · ${c.name}`, value: c.id }));
  const projectOptions = state.projects
    .filter((p) => visible(role, actor, p.owner))
    .map((p) => ({ label: p.name, value: p.id }));
  const selectField = (
    name: string,
    label: string,
    values: string[],
    req = false,
  ) => (
    <Form.Item name={name} label={label} rules={req ? needed : undefined}>
      <Select options={options(values)} />
    </Form.Item>
  );
  const customerSelect = (
    <Form.Item name="customerId" label="关联客户" rules={needed}>
      <Select
        showSearch
        optionFilterProp="label"
        options={customerOptions}
        placeholder="选择已有客户"
      />
    </Form.Item>
  );
  const projectSelect = (
    <Form.Item name="projectId" label="关联项目" rules={needed}>
      <Select
        showSearch
        optionFilterProp="label"
        options={projectOptions}
        onChange={(projectId) => {
          const p = state.projects.find((p) => p.id === projectId)!;
          form.setFieldsValue({
            customerId: p.customerId,
            owner: p.owner,
            name: p.name,
            model: p.model,
            amount: p.budget,
            supplier: p.brand,
          });
        }}
      />
    </Form.Item>
  );
  const ownerSelect = selectField(
    "owner",
    "负责人",
    can(kind, "assign") ? owners : [actor],
    true,
  );
  const watched = Form.useWatch([], form);
  const save = (
    values: Record<string, any>,
    allowDuplicate = false,
    noOpportunity?: { reason: string; toPool: boolean },
  ) => {
    if (!can(kind, id ? "edit" : "create", "edit"))
      return void message.error("没有此表单的保存权限");
    values = writableValues(values, rawState.admin!.fields[kind] || [], (key) =>
      access.field(kind, "edit", key),
    );
    if (
      existing &&
      "owner" in existing &&
      !editable(role, actor, existing.owner || "")
    )
      return void message.error("当前角色不能修改此记录");
    const item = {
      ...(existing || defaults[kind]),
      ...preset,
      ...values,
      custom: { ...(existing?.custom || {}), ...(values.custom || {}) },
    } as any;
    if (!item.name?.trim())
      return void message.error("名称为必要字段；请确认名称字段可编辑后再保存");
    if ((kind === "customers" || kind === "suppliers") && values.contacts) {
      item.contacts = values.contacts.map((entry: any) => ({
        ...((existing as any)?.contacts || []).find(
          (c: any) => c.id === entry.id,
        ),
        ...entry,
      }));
      const keys = new Set<string>();
      for (const c of item.contacts) {
        if (!c.name?.trim()) return void message.error("联系人姓名不能为空");
        const key = `${c.name.trim().toLowerCase()}|${(c.phone || "").replace(/\s/g, "")}`;
        if (keys.has(key))
          return void message.error("同一单位下姓名和电话相同的联系人不能重复");
        keys.add(key);
      }
    }
    if (kind === "quotes" && existing && "items" in existing && values.items)
      item.items = values.items.map((entry: any, index: number) => ({
        ...(existing.items.find((old: any) => old.id === entry.id) ||
          existing.items[index]),
        ...entry,
      }));
    for (const k of Object.keys(item))
      if (typeof item[k] === "string") item[k] = item[k].trim();
    if (kind === "customers") {
      const dup = duplicates(rawState.customers, item);
      if (dup.length && !allowDuplicate)
        return void modal.confirm({
          title: `发现 ${dup.length} 条疑似重复客户`,
          content: (
            <>
              <p>
                系统中已有联系方式或姓名与单位相似的客户。可在客户档案中检查您有权查看的记录，其他记录请联系主管核实。
              </p>
              <p>确认仍要另建一条客户档案？</p>
            </>
          ),
          okText: "仍然创建",
          cancelText: "返回检查",
          onOk: () => save(values, true),
        });
      if (values.myTags !== undefined)
        item.personalTags = { ...item.personalTags, [actor]: values.myTags };
      delete item.myTags;
      item.updatedAt = now();
    }
    if (kind === "leads" && !item.customerId) {
      if (
        !can("customers", "create", "edit") ||
        [
          "name",
          "company",
          ...(values.phone ? ["phone"] : []),
          ...(values.email ? ["email"] : []),
          ...(values.custom?.extra_address ? ["address"] : []),
          ...(values.custom?.extra_wechat ? ["wechat"] : []),
        ].some((key) => access.field("customers", "edit", key) !== "write")
      )
        return void message.error("没有创建关联客户或相应客户字段的权限");
      if (!values.customerName?.trim() || !values.company?.trim())
        return void message.error("请选择客户，或填写新客户姓名与单位");
      const newCustomer = {
        ...emptyCustomer(),
        name: values.customerName.trim(),
        company: values.company.trim(),
        phone: values.phone || "",
        email: values.email || "",
        address: values.custom?.extra_address || "",
        wechat: values.custom?.extra_wechat || "",
        owner: item.owner,
        source: item.source,
      };
      const dup = duplicates(rawState.customers, newCustomer);
      if (dup.length)
        return void message.warning(
          "已有相同客户，请在关联客户中选择；无权限时联系主管授权。",
        );
      item.customerId = newCustomer.id;
      item.newCustomer = newCustomer;
    }
    if (
      ["leads", "projects", "quotes", "orders", "services"].includes(kind) &&
      !item.newCustomer &&
      !rawState.customers.some((c) => c.id === item.customerId && !c.deleted)
    )
      return void message.error("关联客户为必要字段，请选择有效客户");
    if (
      ["quotes", "orders"].includes(kind) &&
      !rawState.projects.some(
        (p) => p.id === item.projectId && p.customerId === item.customerId,
      )
    )
      return void message.error("关联项目与客户必须一致");
    if (kind === "leads" && item.status === "待分配" && item.owner !== "待分配")
      item.status = "跟进中";
    if (
      kind === "leads" &&
      !allowDuplicate &&
      rawState.leads.some(
        (l) =>
          l.id !== item.id &&
          l.customerId === item.customerId &&
          l.name.trim() === item.name.trim(),
      )
    ) {
      return void modal.confirm({
        title: "已有相似线索",
        content:
          "同一客户下已有同名线索。请核实是否为同一需求；无权查看的记录请联系主管。",
        okText: "确认另建",
        onOk: () => save(values, true, noOpportunity),
      });
    }
    if (
      kind === "leads" &&
      item.judgement === "无机会" &&
      !item.projectId &&
      item.status !== "已放弃" &&
      !noOpportunity
    ) {
      let reason = "目前没有采购机会";
      let toPool = false;
      return void modal.confirm({
        title: "无机会线索的处理",
        content: (
          <Space orientation="vertical" style={{ width: "100%" }}>
            <Input.TextArea
              aria-label="无机会原因"
              defaultValue={reason}
              onChange={(e) => (reason = e.target.value)}
            />
            <Select
              aria-label="无机会处理方式"
              defaultValue="keep"
              style={{ width: "100%" }}
              options={[
                { value: "keep", label: "保留为无机会记录" },
                {
                  value: "pool",
                  label: "转入公共客户池",
                  disabled: !can("leads", "abandon"),
                },
              ]}
              onChange={(v) => (toPool = v === "pool")}
            />
          </Space>
        ),
        onOk: () => {
          if (!reason.trim()) {
            message.error("请填写原因");
            return Promise.reject();
          }
          save(values, allowDuplicate, { reason, toPool });
        },
      });
    }
    if (
      kind === "leads" &&
      ["友商推介", "用户推介"].includes(item.sourceDetail) &&
      !item.referrer
    )
      return void message.error("请填写推介人信息");
    if (
      kind === "suppliers" &&
      rawState.suppliers.some(
        (s) =>
          s.id !== item.id &&
          s.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
      )
    )
      return void message.error("此单位已有供应商档案");
    if (kind === "projects" && item.status === "已放弃" && !item.reason)
      return void message.error("放弃项目需要填写原因");
    if (kind === "projects" && item.stage === 100) item.status = "已成单";
    if (kind === "projects" && item.status === "已成单" && !item.orderNumber)
      return void message.error("成单项目需要填写订单号");
    if (kind === "inventory") {
      const borrowed = item.loans
        .filter((l: any) => !l.returnedAt)
        .reduce((sum: number, l: any) => sum + l.quantity, 0);
      if (item.quantity < borrowed || !Number.isInteger(item.quantity))
        return void message.error("库存数量必须为整数，且不能小于未归还数量");
    }
    if (
      kind === "quotes" &&
      (!item.items.length ||
        item.items.some(
          (x: any) => !x.model?.trim() || !(x.quantity > 0) || x.price < 0,
        ))
    )
      return void message.error("请补全报价明细，数量必须大于零");
    if (kind === "knowledge")
      item.status =
        existing && "status" in existing && existing.status === "已发布"
          ? "草稿"
          : item.status;
    const ok = change(
      id ? "修改" : "新增",
      `${titles[kind]} · ${item.name || item.company}`,
      (s) => {
        const next = {
          ...s,
          [kind]: id
            ? s[kind].map((x) => (x.id === id ? item : x))
            : [item, ...s[kind]],
        };
        if (item.newCustomer) {
          next.customers = [item.newCustomer, ...s.customers];
          delete item.newCustomer;
        }
        if (kind === "projects" && item.leadId)
          next.leads = next.leads.map((l) =>
            l.id === item.leadId
              ? { ...l, status: item.status, owner: item.owner }
              : l,
          );
        return noOpportunity
          ? releaseLead(
              next,
              item.id,
              noOpportunity.reason,
              noOpportunity.toPool,
            )
          : next;
      },
    );
    if (ok) {
      message.success("已保存到本机");
      onClose();
    }
  };
  const content = (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        ...(existing || defaults[kind]),
        ...(kind === "customers" && existing
          ? { myTags: (existing as Customer).personalTags[actor] || [] }
          : {}),
        ...preset,
      }}
      onFinish={save}
      requiredMark="optional"
    >
      <div className="form-grid">
        {kind === "customers" && (
          <>
            {textField("name", "客户姓名", true)}
            {textField("company", "客户单位", true)}
            {textField("title", "职称 / 职务")}
            {ownerSelect}
            {textField("phone", "电话")}
            {textField("wechat", "微信")}
            <Form.Item
              name="email"
              label="邮箱"
              rules={[{ type: "email", message: "请输入有效邮箱" }]}
            >
              <Input />
            </Form.Item>
            {textField("region", "所属区域")}
            {textField("address", "联系地址", false, true)}
            {selectField("category", "客户类别", state.dictionaries.categories)}
            {selectField(
              "application",
              "应用类别",
              state.dictionaries.applications,
            )}
            <Form.Item name="tags" label="公共标签">
              <Select
                mode="tags"
                options={options(["重点客户", "科研用户", "长期合作"])}
              />
            </Form.Item>
            <Form.Item name="myTags" label="个人标签（仅当前演示身份）">
              <Select mode="tags" />
            </Form.Item>
            {area("notes", "备注")}
            <Collapse
              className="span-2"
              items={[
                {
                  key: "invoice",
                  label: "开票信息",
                  children: (
                    <div className="form-grid">
                      {textField("invoiceTitle", "发票抬头")}
                      {textField("taxId", "税号")}
                      {textField("bank", "开户银行")}
                      {textField("bankAccount", "银行账户")}
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}
        {kind === "leads" && (
          <>
            {textField("name", "线索名称", true, true)}
            <Form.Item
              name="customerId"
              label="关联已有客户"
              className="span-2"
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={customerOptions}
                placeholder="或在下方填写新客户"
              />
            </Form.Item>
            {!watched?.customerId && (
              <>
                {textField("customerName", "新客户姓名", true)}
                {textField("company", "新客户单位", true)}
                {textField("phone", "客户电话")}
                <Form.Item
                  name="email"
                  label="客户邮箱"
                  rules={[{ type: "email" }]}
                >
                  <Input />
                </Form.Item>
              </>
            )}
            {ownerSelect}
            <Form.Item name="source" label="线索来源" rules={needed}>
              <Select
                options={options(["星谱咨询", "自己新建"])}
                onChange={(v) =>
                  form.setFieldValue(
                    "sourceDetail",
                    v === "星谱咨询" ? "官网留言" : "销售开发",
                  )
                }
              />
            </Form.Item>
            {selectField(
              "sourceDetail",
              "来源明细",
              watched?.source === "自己新建"
                ? ["销售开发", "友商推介", "用户推介"]
                : ["官网留言", "星谱电话", "鼎信盟友"],
            )}
            {["友商推介", "用户推介"].includes(watched?.sourceDetail) &&
              textField("referrer", "推介人信息", true)}
            {selectField("brand", "咨询产品品牌", state.dictionaries.brands)}
            {selectField("judgement", "机会判定", [
              "有咨询",
              "有机会",
              "无机会",
            ])}
            {area("content", "首次沟通内容", true)}
          </>
        )}
        {kind === "projects" && (
          <>
            {textField("name", "项目名称", true, true)}
            {customerSelect}
            {ownerSelect}
            {selectField("brand", "推荐品牌", state.dictionaries.brands)}
            {textField("model", "产品型号")}
            {selectField(
              "application",
              "应用类别",
              state.dictionaries.applications,
            )}
            {numberField("budget", "预算金额（元）")}
            {numberField("probability", "签单概率（%）", 100)}
            <FieldVisible name="budget">
              <FieldVisible name="probability">
                <Form.Item label="项目预期金额">
                  <div className="computed-value">
                    ¥{" "}
                    {money(
                      expected(watched?.budget || 0, watched?.probability || 0),
                    )}
                  </div>
                </Form.Item>
              </FieldVisible>
            </FieldVisible>
            <Form.Item
              name="stage"
              label="目前跟进阶段"
              rules={needed}
              className="span-2"
            >
              <Select
                options={stages.map((s) => ({
                  value: s.value,
                  label: `${s.value}% · ${s.label}`,
                }))}
              />
            </Form.Item>
            {selectField("status", "项目状态", ["跟进中", "已成单", "已放弃"])}
            {textField(
              "orderNumber",
              "成单订单号",
              watched?.status === "已成单" || watched?.stage === 100,
            )}
            {area("target", "项目目标")}
            {area("system", "用户系统描述")}
            {area("needs", "真实需求 / 附加需求")}
            {area("recommendation", "推荐方案 / 优势 / 劣势")}
            {area("competitor", "竞争品牌 / 型号 / 优势 / 劣势")}
            {dateField("purchaseDate", "预计采购时间")}
            {selectField("purchaseMethod", "采购方式", [
              "内购（含税购买）",
              "外购",
              "公开招标",
              "其他",
            ])}
            {dateField("useDate", "预计使用时间")}
            {dateField("nextDate", "下次跟进时间")}
            {area("nextPlan", "下次跟进计划")}
            {watched?.status === "已放弃" && area("reason", "放弃原因", true)}
            <Form.Item
              name="attachments"
              label="光路图 / 相关附件"
              className="span-2"
            >
              <Attachments />
            </Form.Item>
          </>
        )}
        {kind === "quotes" && (
          <>
            {textField("name", "报价名称", true, true)}
            {projectSelect}
            {customerSelect}
            {dateField("date", "报价日期", true)}
            {dateField("expiry", "报价有效期至", true)}
            {selectField("currency", "报价币种", ["CNY", "USD", "EUR"])}
            {selectField("purchaseMethod", "购买方式", [
              "内购（含税购买）",
              "外购",
            ])}
            <div className="span-2">
              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <>
                    <label className="form-section-label">报价产品明细</label>
                    {fields.map(({ key, name }) => (
                      <div className="quote-item-form" key={key}>
                        <Form.Item
                          name={[name, "productCode"]}
                          label="产品编码"
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name={[name, "model"]}
                          label="产品型号"
                          rules={required}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item name={[name, "description"]} label="描述">
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name={[name, "quantity"]}
                          label="数量"
                          rules={needed}
                        >
                          <InputNumber min={1} precision={0} />
                        </Form.Item>
                        <Form.Item
                          name={[name, "price"]}
                          label="单价"
                          rules={needed}
                        >
                          <InputNumber min={0} precision={2} />
                        </Form.Item>
                        <Button danger type="text" onClick={() => remove(name)}>
                          移除
                        </Button>
                      </div>
                    ))}
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() =>
                        add({
                          id: uid(),
                          model: "",
                          description: "",
                          quantity: 1,
                          price: 0,
                        })
                      }
                    >
                      添加产品
                    </Button>
                  </>
                )}
              </Form.List>
            </div>
            {numberField("discount", "折扣率（%）", 100)}
            {numberField("freight", "运保费")}
            {selectField("status", "报价状态", [
              "草稿",
              "已发送",
              "客户确认",
              "已失效",
            ])}
            <FieldVisible name="items.price">
              <FieldVisible name="items.quantity">
                <FieldVisible name="discount">
                  <FieldVisible name="freight">
                    <Form.Item label="报价总额">
                      <div className="computed-value">
                        {watched?.currency}{" "}
                        {money(
                          quoteTotal({
                            items: watched?.items || [],
                            discount: watched?.discount || 0,
                            freight: watched?.freight || 0,
                          }),
                        )}
                      </div>
                    </Form.Item>
                  </FieldVisible>
                </FieldVisible>
              </FieldVisible>
            </FieldVisible>
          </>
        )}
        {kind === "orders" && (
          <>
            {textField("name", "订单名称", true, true)}
            {projectSelect}
            {customerSelect}
            {textField("contract", "分公司合同号", true)}
            {textField("supplierContract", "鼎信 / 供方合同号")}
            {textField("model", "产品型号", true)}
            {textField("supplier", "供应商")}
            {textField("sn", "产品 SN 码")}
            {dateField("date", "订单日期", true)}
            {numberField("amount", "成交金额（人民币）")}
            {can(kind, "finance") && (
              <>
                {numberField("cost", "采购成本")}
                {numberField("freight", "运保费")}
                {numberField("commission", "佣金")}
                {numberField("otherCost", "其他费用")}
              </>
            )}
            {selectField("status", "履约状态", [
              "待付款",
              "待发货",
              "已发货",
              "待验收",
              "已完成",
            ])}
            {dateField("invoiceDate", "开票日期")}
            {dateField("shipDate", "发货日期")}
            {dateField("acceptDate", "验收日期")}
            <div className="span-2">
              <Alert
                type="info"
                title="收付款请在订单详情中逐笔登记。金额为本币演示值，税费与汇率公式待商务确认。"
              />
            </div>
          </>
        )}
        {kind === "services" && (
          <>
            {textField("name", "服务主题", true, true)}
            {customerSelect}
            {ownerSelect}
            <Form.Item name="orderId" label="关联订单">
              <Select
                options={state.orders.map((o) => ({
                  value: o.id,
                  label: `${o.contract} · ${o.name}`,
                }))}
              />
            </Form.Item>
            {selectField("type", "服务类别", [
              "售前支持",
              "售后安装",
              "维修",
              "培训",
            ])}
            {textField("model", "设备型号")}
            {numberField("warranty", "保修期（月）")}
            {dateField("date", "预约日期", true)}
            {selectField("status", "服务状态", ["待服务", "服务中", "已完成"])}
            {area("tools", "提前准备的工具")}
            {area("content", "安装要求 / 待解决问题", true)}
            {area("result", "验收结果 / 服务记录")}
          </>
        )}
        {kind === "inventory" && (
          <>
            {textField("name", "商品名称", true)}
            {ownerSelect}
            {textField("model", "型号", true)}
            {selectField("brand", "生产厂家 / 品牌", state.dictionaries.brands)}
            {selectField("category", "归属", [
              "销售样机",
              "研发物料",
              "安装物料",
            ])}
            {textField("location", "存放地点", true)}
            {selectField("condition", "产品状况", ["良好", "待维修", "报废"])}
            {numberField("quantity", "库存总数量")}
            {numberField("price", "销售单价")}
            {access.field(kind, "edit", "cost") !== "hidden" &&
              numberField("cost", "采购价格")}
            {dateField("date", "入库日期")}
            {area("description", "物料描述")}
          </>
        )}
        {kind === "suppliers" && (
          <>
            {textField("name", "供应商单位", true, true)}
            {ownerSelect}
            {textField("brand", "品牌")}
            {selectField("level", "合作级别", [
              "核心合作",
              "常规合作",
              "待评估",
            ])}
            {textField("contact", "联系人", true)}
            {textField("title", "职称")}
            {textField("phone", "电话 / 微信")}
            <Form.Item name="email" label="邮箱" rules={[{ type: "email" }]}>
              <Input />
            </Form.Item>
            {textField("address", "地址", false, true)}
            <Form.Item
              name="website"
              label="官网"
              rules={[{ type: "url", message: "请输入包含 https:// 的网址" }]}
            >
              <Input />
            </Form.Item>
            {area("notes", "合作备注")}
            <Form.Item name="attachments" label="产品手册" className="span-2">
              <Attachments />
            </Form.Item>
          </>
        )}
        {kind === "knowledge" && (
          <>
            {textField("name", "资料标题", true, true)}
            {selectField("category", "资料分类", [
              "产品知识",
              "应用方案",
              "销售技巧",
              "市场推广",
            ])}
            {selectField("brand", "关联品牌", state.dictionaries.brands)}
            <Form.Item name="tags" label="标签" className="span-2">
              <Select mode="tags" />
            </Form.Item>
            <Form.Item
              name="content"
              label="正文 / 资料说明"
              className="span-2"
            >
              <ArticleEditor />
            </Form.Item>
            <Form.Item
              name="url"
              label="视频或参考链接"
              className="span-2"
              rules={[{ type: "url", message: "请输入有效的 http/https 链接" }]}
            >
              <Input placeholder="https://" />
            </Form.Item>
            <Form.Item
              name="attachments"
              label="Word / PPT / 图片 / 附件"
              className="span-2"
            >
              <Attachments />
            </Form.Item>
            <Alert
              type="info"
              className="span-2"
              title="先保存草稿，再在学习档案中提交主管审核；审核通过后全员可见。"
            />
          </>
        )}
      </div>
      {["orders", "services", "inventory"].includes(kind) && (
        <Form.Item name="attachments" label="相关文件 / 产品照片 / 签收单">
          <Attachments />
        </Form.Item>
      )}
      {(kind === "customers" || kind === "suppliers") && (
        <Form.Item name="contacts" label="联系人与关系">
          <ContactsEditor />
        </Form.Item>
      )}
      <CustomFields />
      <div className="form-footer">
        <Button onClick={onClose}>取消</Button>
        {mobile ? (
          <MobileButton color="primary" onClick={() => form.submit()}>
            保存{titles[kind]}
          </MobileButton>
        ) : (
          <Button type="primary" htmlType="submit">
            保存{titles[kind]}
          </Button>
        )}
      </div>
    </Form>
  );
  return (
    <Drawer
      title={`${id ? "编辑" : "新建"}${titles[kind]}`}
      open
      onClose={onClose}
      size={mobile ? "100%" : 760}
      className="editor-drawer"
    >
      {content}
    </Drawer>
  );
}

export function CommunicationEditor({
  customerId,
  projectId,
  onClose,
}: {
  customerId: string;
  projectId?: string;
  onClose: () => void;
}) {
  const { actor, state, change, mobile } = useCRM();
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
  const [form] = Form.useForm();
  const p = state.projects.find((p) => p.id === projectId);
  const submit = (values: any) => {
    if (!can(page, "communicate", "communication"))
      return void message.error("没有记录沟通的权限");
    values = writableValues(
      values,
      rawState.admin!.fields.communications,
      (key) => access.field(page, "communication", key),
    );
    if (!values.title || !values.content || !values.date)
      return void message.error("沟通主题、内容及日期为必填；请检查字段权限");
    const r: Communication = {
      id: uid("GT"),
      customerId,
      projectId,
      owner: actor,
      ...values,
      date: `${values.date} ${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`,
    };
    if (
      change("添加沟通记录", values.title, (s) => ({
        ...s,
        communications: [r, ...s.communications],
        projects: s.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                nextDate: values.nextDate || "",
                nextPlan: values.nextPlan || "",
              }
            : p,
        ),
        customers: s.customers.map((c) =>
          c.id === customerId
            ? {
                ...c,
                updatedAt: now(),
                ...(!projectId
                  ? {
                      custom: {
                        ...c.custom,
                        ...(values.nextDate !== undefined
                          ? { extra_nextDate: values.nextDate }
                          : {}),
                        ...(values.nextPlan !== undefined
                          ? { extra_nextPlan: values.nextPlan }
                          : {}),
                      },
                    }
                  : {}),
              }
            : c,
        ),
      }))
    ) {
      message.success("沟通已记录，跟进计划已更新");
      onClose();
    }
  };
  const content = (
    <div className="communication-form">
      <p className="muted">
        {state.customers.find((c) => c.id === customerId)?.company}
        {p ? ` · ${p.name}` : " · 客户日常维护"}
      </p>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          title: "",
          content: "",
          method: "电话/语音",
          date: today(),
          nextDate: p?.nextDate || "",
          nextPlan: "",
          attachments: [],
        }}
        onFinish={submit}
      >
        <div className="form-grid">
          {textField("title", "沟通主题", true, true)}
          <Form.Item name="method" label="沟通方式" rules={needed}>
            <Select
              options={options([
                "见面沟通",
                "线上会议",
                "电话/语音",
                "微信",
                "邮件",
                "短信",
              ])}
            />
          </Form.Item>
          {dateField("date", "沟通日期", true)}
          {area("content", "沟通内容", true)}
          {dateField("nextDate", "下次跟进日期")}
          {textField("nextPlan", "下次跟进计划")}
          <Form.Item
            name="attachments"
            label="现场照片 / 附件"
            className="span-2"
          >
            <Attachments />
          </Form.Item>
        </div>
        <CustomFields />
        <div className="form-footer">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" htmlType="submit">
            保存沟通记录
          </Button>
        </div>
      </Form>
    </div>
  );
  return mobile ? (
    <Popup
      visible
      onMaskClick={onClose}
      bodyStyle={{
        borderRadius: "16px 16px 0 0",
        maxHeight: "92vh",
        overflowY: "auto",
      }}
    >
      <div className="popup-heading">
        <h3>记录沟通</h3>
        <Button type="text" onClick={onClose}>
          关闭
        </Button>
      </div>
      {content}
    </Popup>
  ) : (
    <Modal open title="记录沟通" onCancel={onClose} footer={null} width={700}>
      {content}
    </Modal>
  );
}

export function Detail({
  kind,
  id,
  onClose,
}: {
  kind: EntityKind;
  id: string;
  onClose: () => void;
}) {
  const { state, actor, role, mobile, change, edit, detail, communicate } =
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
  const { message, modal } = App.useApp();
  const original = state[kind].find((x) => x.id === id);
  const item = (
    kind === "projects" && original
      ? projectView(original as Project, role, actor)
      : original
  ) as any;
  const [tab, setTab] = useState("overview");
  if (!item) return null;
  const customerId = kind === "customers" ? item.id : item.customerId;
  const customer = state.customers.find((c) => c.id === customerId);
  const archived = item.owner === "历史归档";
  const owned = !archived && (!item.owner || editable(role, actor, item.owner));
  const allowed =
    archived ||
    !item.owner ||
    kind === "customers" ||
    (kind === "knowledge" && item.status === "已发布") ||
    visible(role, actor, item.owner);
  const records = state.communications
    .filter(
      (c) =>
        (kind === "projects"
          ? c.projectId === id
          : c.customerId === customerId) &&
        (archived
          ? item.history[0].communicationIds.includes(c.id)
          : customer?.pool ||
            item.owner === "公共池" ||
            access.owns(c.owner) ||
            c.owner === actor ||
            (kind === "projects" && item.owner === actor)),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const desc = (entries: [string, unknown, string?][]) => (
    <Descriptions
      column={mobile ? 1 : 2}
      layout="vertical"
      items={entries
        .filter(
          ([, , key]) => !key || access.field(page, "detail", key) !== "hidden",
        )
        .map(([label, value, key]) => ({
          key: label,
          label:
            rawState.admin!.fields[kind]?.find((f) => f.key === key)?.label ||
            label,
          children:
            typeof value === "number" ? money(value) : String(value || "—"),
        }))}
    />
  );
  const abandon = () => {
    let reason = "";
    let pool = true;
    modal.confirm({
      title: "放弃跟进",
      content: (
        <Space orientation="vertical" style={{ width: "100%" }}>
          <p>历史沟通将保留。转入公共池后可由其他顾问领取。</p>
          <Input.TextArea
            placeholder="请填写放弃原因（必填）"
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
          <Select
            defaultValue="pool"
            options={[
              { value: "pool", label: "转入公共池" },
              { value: "keep", label: "保留为已放弃项目" },
            ]}
            onChange={(v) => {
              pool = v === "pool";
            }}
            style={{ width: "100%" }}
          />
        </Space>
      ),
      okText: "确认放弃",
      onOk: () => {
        if (!reason.trim()) {
          message.error("请填写放弃原因");
          return Promise.reject();
        }
        const ok = change("放弃跟进", item.name, (s) =>
          pool
            ? moveToPool(s, id, reason)
            : {
                ...s,
                projects: s.projects.map((p) =>
                  p.id === id ? { ...p, status: "已放弃", reason } : p,
                ),
                leads: s.leads.map((l) =>
                  l.id === item.leadId ? { ...l, status: "已放弃" } : l,
                ),
              },
        );
        if (!ok) return Promise.reject();
        message.success("已记录放弃原因");
      },
    });
  };
  const overview = (
    <>
      <CustomDetails record={item} />
      <RecordMetadata record={item} />
      {["orders", "services", "inventory"].includes(kind) && (
        <FieldVisible name="attachments">
          <Attachments value={item.attachments || []} readOnly />
        </FieldVisible>
      )}
      {archived && (
        <Alert
          type="info"
          title={`移交前历史快照 · ${item.history[0].date} · 后续修改及新增沟通不显示`}
        />
      )}
      {kind === "customers" && (
        <>
          {desc([
            ["姓名", item.name, "name"],
            ["单位", item.company, "company"],
            ["职称", item.title, "title"],
            ["电话 / 微信", `${item.phone} / ${item.wechat || "—"}`],
            ["邮箱", item.email, "email"],
            ["地区", item.region, "region"],
            ["地址", item.address, "address"],
            ["客户类别", item.category, "category"],
            ["应用类别", item.application, "application"],
            ["负责人", item.owner, "owner"],
            ["创建时间", item.createdAt, "createdAt"],
            ["更新时间", item.updatedAt, "updatedAt"],
          ])}
          <Divider>标签与备注</Divider>
          <div>
            {item.tags.map((t: string) => (
              <Tag color="blue" key={t}>
                {t}
              </Tag>
            ))}
            {(item.personalTags[actor] || []).map((t: string) => (
              <Tag key={t}>个人 · {t}</Tag>
            ))}
          </div>
          <p className="detail-paragraph">{item.notes}</p>
          <Divider>同单位联系人与关系</Divider>
          {item.contacts.map((c: any) => (
            <div className="contact-row" key={c.id}>
              <Person name={c.name} />
              <span>
                {c.title} · {c.relation}
              </span>
              <span>
                {[c.phone, c.email, c.gender, c.address]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          ))}
          <Divider>关联项目</Divider>
          {state.projects
            .filter(
              (p) => p.customerId === item.id && !!projectView(p, role, actor),
            )
            .map((p) => (
              <Button
                type="link"
                key={p.id}
                onClick={() => detail("projects", p.id)}
                permission="detail"
                menu={"projects"}
              >
                {p.name} · {p.status}
              </Button>
            ))}
          {desc([
            ["发票抬头", item.invoiceTitle, "invoiceTitle"],
            ["税号", item.taxId, "taxId"],
            ["开户银行", item.bank, "bank"],
            ["银行账户", item.bankAccount, "bankAccount"],
          ])}
        </>
      )}
      {kind === "leads" && (
        <>
          {desc([
            ["客户", `${customer?.company} · ${customer?.name}`],
            ["负责人", item.owner, "owner"],
            ["线索来源", item.source, "source"],
            ["来源细分", item.sourceDetail, "sourceDetail"],
            ["推介人", item.referrer, "referrer"],
            ["咨询品牌", item.brand, "brand"],
            ["机会判定", item.judgement, "judgement"],
            ["状态", item.status, "status"],
            ["创建时间", item.createdAt, "createdAt"],
          ])}
          <Divider>首次沟通内容</Divider>
          <p className="detail-paragraph">{item.content}</p>
          {item.projectId && (
            <Button
              onClick={() => detail("projects", item.projectId)}
              permission="detail"
              menu={"projects"}
            >
              打开关联跟进项目
            </Button>
          )}
        </>
      )}
      {kind === "projects" && (
        <>
          <div className="detail-metrics">
            <FieldVisible name="budget">
              <div>
                <span>预算金额</span>
                <b>¥ {money(item.budget)}</b>
              </div>
            </FieldVisible>
            <FieldVisible name="budget">
              <FieldVisible name="probability">
                <div>
                  <span>预期金额</span>
                  <b>¥ {money(expected(item.budget, item.probability))}</b>
                </div>
              </FieldVisible>
            </FieldVisible>
            <FieldVisible name="probability">
              <div>
                <span>签单概率</span>
                <b>{item.probability}%</b>
              </div>
            </FieldVisible>
          </div>
          <div className="stage-steps">
            {stages.map((s) => (
              <div
                key={s.value}
                className={item.stage >= s.value ? "passed" : ""}
              >
                <i />
                <small>{s.value}%</small>
                <span>{s.short}</span>
              </div>
            ))}
          </div>
          {desc([
            ["客户", `${customer?.company} · ${customer?.name}`],
            ["项目顾问", item.owner, "owner"],
            ["品牌 / 型号", `${item.brand} / ${item.model}`],
            ["应用类别", item.application, "application"],
            ["采购时间", item.purchaseDate, "purchaseDate"],
            ["采购方式", item.purchaseMethod, "purchaseMethod"],
            ["使用时间", item.useDate, "useDate"],
            ["成单单号", item.orderNumber, "orderNumber"],
            ["下次跟进", item.nextDate, "nextDate"],
            ["跟进计划", item.nextPlan, "nextPlan"],
          ])}
          {[
            ["项目目标", item.target, "target"],
            ["用户系统描述", item.system, "system"],
            ["真实需求与附加需求", item.needs, "needs"],
            ["推荐方案与优劣势", item.recommendation, "recommendation"],
            ["竞争方案与优劣势", item.competitor, "competitor"],
          ]
            .filter(
              ([, , key]) => access.field(page, "detail", key) !== "hidden",
            )
            .map(([title, content]) => (
              <div className="detail-text" key={title}>
                <h4>{title}</h4>
                <p>{content || "待补充"}</p>
              </div>
            ))}
          {item.reason && (
            <Alert title={`放弃原因：${item.reason}`} type="warning" />
          )}
          <Attachments value={item.attachments} readOnly />
        </>
      )}
      {kind === "quotes" && (
        <>
          {desc([
            ["客户", customer?.company],
            ["报价日期", item.date, "date"],
            ["有效期", item.expiry, "expiry"],
            ["购买方式", item.purchaseMethod, "purchaseMethod"],
            ["币种", item.currency, "currency"],
            ["状态", item.status, "status"],
          ])}
          <div className="detail-table">
            <table>
              <thead>
                <tr>
                  <th>产品编码</th>
                  <th>产品型号</th>
                  <th>描述</th>
                  <th>数量</th>
                  <th>单价</th>
                  <th>合计</th>
                </tr>
              </thead>
              <tbody>
                {item.items.map((q: any) => (
                  <tr key={q.id}>
                    <td>{q.productCode}</td>
                    <td>{q.model}</td>
                    <td>{q.description}</td>
                    <td>{q.quantity}</td>
                    <td>{money(q.price)}</td>
                    <td>{money(q.quantity * q.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="quote-total">
            折扣 {item.discount}% · 运保费 {money(item.freight)}
            <strong>
              {item.currency} {money(quoteTotal(item))}
            </strong>
          </div>
        </>
      )}
      {kind === "orders" && (
        <>
          {desc([
            ["客户", customer?.company],
            ["负责人", item.owner, "owner"],
            ["分公司合同号", item.contract, "contract"],
            ["供方合同号", item.supplierContract, "supplierContract"],
            ["品牌 / 型号", item.model, "model"],
            ["供应商", item.supplier, "supplier"],
            ["SN 码", item.sn, "sn"],
            ["履约状态", item.status, "status"],
            ["发货日期", item.shipDate, "shipDate"],
            ["开票日期", item.invoiceDate, "invoiceDate"],
            ["验收日期", item.acceptDate, "acceptDate"],
          ])}
          <div className="detail-metrics">
            <div>
              <span>成交金额</span>
              <b>¥ {money(item.amount)}</b>
            </div>
            <div>
              <span>已收款</span>
              <b>
                ¥{" "}
                {money(
                  item.payments.reduce((s: number, p: any) => s + p.amount, 0),
                )}
              </b>
            </div>
            <div>
              <span>应收余额</span>
              <b>
                ¥{" "}
                {money(
                  item.amount -
                    item.payments.reduce(
                      (s: number, p: any) => s + p.amount,
                      0,
                    ),
                )}
              </b>
            </div>
          </div>
          <OrderRegions id={id} />
        </>
      )}
      {kind === "services" && (
        <>
          {desc([
            ["客户", customer?.company],
            ["负责人", item.owner, "owner"],
            ["服务类别", item.type, "type"],
            ["预约日期", item.date, "date"],
            ["设备型号", item.model, "model"],
            ["保修期（月）", item.warranty, "warranty"],
            ["服务状态", item.status, "status"],
            ["提前准备工具", item.tools, "tools"],
          ])}
          <h4>服务要求</h4>
          <p className="detail-paragraph">{item.content}</p>
          <h4>服务记录与验收</h4>
          <p className="detail-paragraph">{item.result || "待填写"}</p>
        </>
      )}
      {kind === "inventory" && (
        <>
          {desc([
            ["生产厂家", item.brand, "brand"],
            ["型号", item.model, "model"],
            ["归属", item.category, "category"],
            ["存放地点", item.location, "location"],
            ["状况", item.condition, "condition"],
            ["总数量", item.quantity, "quantity"],
            ["销售单价", item.price, "price"],
            [
              "采购价格",
              access.field("inventory", "detail", "cost") !== "hidden"
                ? item.cost
                : "不可见",
            ],
            ["入库日期", item.date, "date"],
          ])}
          <p>{item.description}</p>
          <Divider>借还记录</Divider>
          {item.loans
            .filter((l: any) => !!l.borrower)
            .map((l: any) => (
              <div className="loan-record" key={l.id}>
                <FieldVisible name="loans.attachments">
                  <Attachments value={l.attachments || []} readOnly />
                </FieldVisible>
                {loanFields
                  .filter(
                    ([key]) =>
                      access.field("inventory", "detail", `loans.${key}`) !==
                        "hidden" &&
                      l[key] !== undefined &&
                      l[key] !== "",
                  )
                  .map(([key, label]) => (
                    <p key={key}>
                      {label}：{String(l[key])}
                    </p>
                  ))}
                <strong>
                  {l.borrower} · {l.quantity} 件
                </strong>
                <p>{l.purpose}</p>
                <small>
                  {l.date} 借出 / {l.dueDate} 应归还
                </small>
                <Tag color={l.returnedAt ? "green" : "orange"}>
                  {l.returnedAt ? `已归还 ${l.returnedAt}` : "借用中"}
                </Tag>
              </div>
            ))}
        </>
      )}
      {kind === "suppliers" && (
        <>
          {desc([
            ["单位", item.name, "name"],
            ["品牌", item.brand, "brand"],
            ["联系人", item.contact, "contact"],
            ["职称", item.title, "title"],
            ["电话 / 微信", item.phone, "phone"],
            ["邮箱", item.email, "email"],
            ["地址", item.address, "address"],
            ["官网", item.website, "website"],
            ["合作级别", item.level, "level"],
          ])}
          <p className="detail-paragraph">{item.notes}</p>
          <Divider>产品手册</Divider>
          <Attachments value={item.attachments} readOnly />
          <FieldVisible name="contacts">
            <Divider>联系人与关系</Divider>
            {(item.contacts || []).map((c: any) => (
              <p key={c.id}>
                {[
                  c.name,
                  c.relation,
                  c.title,
                  c.phone,
                  c.email,
                  c.gender,
                  c.address,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ))}
          </FieldVisible>
        </>
      )}
      {kind === "knowledge" && (
        <>
          <Space>
            <Tag>{item.category}</Tag>
            <Tag>{item.brand}</Tag>
            <Person name={item.owner} />
            <span className="muted">{item.date}</span>
          </Space>
          <ArticleBody value={item.content} />
          {item.url && /^https?:\/\//.test(item.url) && (
            <a href={item.url} target="_blank" rel="noreferrer">
              查看视频 / 参考链接
            </a>
          )}
          <Attachments value={item.attachments} readOnly />
        </>
      )}
    </>
  );
  const tabs = [{ key: "overview", label: "详细资料", children: overview }];
  if (
    ["customers", "projects", "leads"].includes(kind) &&
    can(page, "view", "communication")
  )
    tabs.push({
      key: "records",
      label: `沟通记录 (${records.length})`,
      children: (
        <>
          <div className="detail-section-heading">
            <span className="muted">按时间倒序 · 历史记录保留</span>
            <Button
              type="primary"
              size="small"
              disabled={!owned || !can(page, "communicate")}
              onClick={() =>
                communicate(customerId, kind === "projects" ? id : undefined)
              }
              permission="communicate"
            >
              记录沟通
            </Button>
          </div>
          <Timeline
            items={records.map((r) => ({
              color: "#3866dc",
              content: (
                <div className="timeline-record">
                  <div>
                    <b>{r.title}</b>
                    <Tag>{r.method}</Tag>
                  </div>
                  <small>
                    {r.owner} · {r.date}
                  </small>
                  <p>{r.content}</p>
                  {r.nextPlan && (
                    <div className="next-plan">
                      下次计划：{r.nextDate} · {r.nextPlan}
                    </div>
                  )}
                  <Attachments value={r.attachments} readOnly />
                  <CommunicationActions record={r} />
                </div>
              ),
            }))}
          />
          {!records.length && <p className="muted">暂无可见的沟通记录。</p>}
        </>
      ),
    });
  return (
    <Drawer
      open
      onClose={onClose}
      size={mobile ? "100%" : 860}
      title={
        <span>
          {titles[kind]}详情 <small className="muted">{item.id}</small>
        </span>
      }
    >
      <div className="detail-heading">
        <h2>{item.name}</h2>
        {item.status && <Status value={item.status} />}
        <Space wrap>
          {owned && can(kind, "edit") && (
            <Button
              icon={<EditOutlined />}
              onClick={() => edit(kind, id)}
              permission="edit"
              menu={kind}
            >
              编辑
            </Button>
          )}
          {kind === "projects" && owned && (
            <>
              <Button
                type="primary"
                onClick={() => communicate(customerId, id)}
                permission="communicate"
              >
                写跟进
              </Button>
              {item.status === "跟进中" && (
                <Button danger onClick={abandon} permission="abandon">
                  放弃 / 转公共池
                </Button>
              )}
            </>
          )}
          {kind === "leads" && !item.projectId && owned && (
            <Button
              type="primary"
              onClick={() => {
                if (change("线索转项目", item.name, (s) => convertLead(s, id)))
                  message.success("已创建项目");
              }}
              permission="convert"
            >
              转为跟进项目
            </Button>
          )}
          {kind === "customers" && item.pool && can("pool", "claim") && (
            <Button
              type="primary"
              onClick={() => {
                if (
                  change("领取公共客户", item.company, (s) =>
                    claimCustomer(s, id, actor),
                  )
                )
                  message.success("领取成功");
              }}
              permission="claim"
            >
              领取客户
            </Button>
          )}
          {kind === "customers" &&
            can(kind, item.deleted ? "restore" : "delete") && (
              <Popconfirm
                title={
                  item.deleted
                    ? "恢复这条客户记录？"
                    : "移入已删除？记录和跟进历史仍保留。"
                }
                onConfirm={() =>
                  change(
                    item.deleted ? "恢复客户" : "软删除客户",
                    item.company,
                    (s) => ({
                      ...s,
                      customers: s.customers.map((c) =>
                        c.id === id ? { ...c, deleted: !c.deleted } : c,
                      ),
                    }),
                  )
                }
              >
                <Button danger>{item.deleted ? "恢复" : "软删除"}</Button>
              </Popconfirm>
            )}
        </Space>
      </div>
      {allowed ? (
        <Tabs activeKey={tab} onChange={setTab} items={tabs} />
      ) : (
        <Alert title="当前演示身份没有此记录的访问权限" type="warning" />
      )}
    </Drawer>
  );
}
