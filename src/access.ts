import type { EntityKind, Page, State } from "./domain";
import { owners, now, uid, projectView } from "./domain";
import { metaFields, recordKinds } from "./records";
import {
  supplementaryFields,
  financialExtras,
  loanFields,
} from "./material-fields";

export type FieldMode = "hidden" | "read" | "write";
export type AreaId =
  | "list"
  | "detail"
  | "edit"
  | "communication"
  | "communicationExport"
  | "payments"
  | "finance"
  | "export"
  | "statistics"
  | "borrow"
  | "return";
export interface FieldDefinition {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  enabled: boolean;
  required?: boolean;
  system?: boolean;
  options?: string[];
  source?: string;
}
export interface RoleDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  builtin?: boolean;
  menus: Page[];
  grants: Record<string, boolean>;
  fields: Record<string, FieldMode>;
}
export interface UserAccount {
  id: string;
  username: string;
  name: string;
  roleId: string;
  managerId: string;
  department: string;
  email: string;
  status: "active" | "disabled" | "deleted";
}
export interface Administration {
  communicationEditMinutes?: number;
  company: { name: string; shortName: string; logo: string; tagline: string };
  users: UserAccount[];
  roles: RoleDefinition[];
  fields: Record<string, FieldDefinition[]>;
}
export const pageNames: Record<Page, string> = {
  dashboard: "工作台",
  leads: "线索管理",
  projects: "跟进项目",
  customers: "客户档案",
  pool: "公共客户池",
  quotes: "报价管理",
  orders: "订单与收款",
  services: "售前售后",
  inventory: "库存与物料",
  suppliers: "供应商",
  knowledge: "学习档案",
  daily: "工作日志",
  reports: "数据统计",
  resources: "基础资料",
  activities: "市场与行政",
  costs: "费用与成本",
  settings: "系统管理",
};
export const areaNames: Record<AreaId, string> = {
  list: "列表页面",
  detail: "详情弹窗",
  edit: "新增 / 编辑弹窗",
  communication: "沟通记录弹窗",
  communicationExport: "沟通记录导出",
  payments: "收付款区域",
  finance: "成本与利润区域",
  export: "导出",
  statistics: "统计明细弹窗",
  borrow: "库存借出弹窗",
  return: "库存归还弹窗",
};
export const actionNames: Record<string, string> = {
  view: "进入区域",
  create: "新增",
  edit: "修改",
  detail: "查看详情",
  communicate: "记录沟通",
  convert: "转跟进项目",
  assign: "分配负责人",
  abandon: "放弃 / 转公共池",
  claim: "领取",
  delete: "删除",
  restore: "恢复",
  export: "导出",
  import: "导入",
  borrow: "借出",
  return: "归还",
  payment: "登记收付款",
  submit: "提交审核",
  review: "审核 / 退回",
  finance: "查看财务",
  manage: "管理配置",
};
export const actionsFor = (page: Page) =>
  Array.from(
    new Set([
      ...{
        dashboard: ["view"],
        leads: [
          "view",
          "create",
          "edit",
          "detail",
          "convert",
          "assign",
          "export",
          "import",
          "abandon",
        ],
        projects: [
          "view",
          "create",
          "edit",
          "detail",
          "communicate",
          "abandon",
        ],
        customers: [
          "view",
          "create",
          "edit",
          "detail",
          "communicate",
          "delete",
          "restore",
          "export",
          "import",
        ],
        pool: ["view", "detail", "claim"],
        quotes: ["view", "create", "edit", "detail"],
        orders: ["view", "create", "edit", "detail", "payment", "finance"],
        services: ["view", "create", "edit", "detail"],
        inventory: ["view", "create", "edit", "detail", "borrow", "return"],
        suppliers: ["view", "create", "edit", "detail"],
        knowledge: ["view", "create", "edit", "detail", "submit", "review"],
        daily: ["view", "edit", "export"],
        reports: ["view", "export", "finance", "create"],
        resources: [
          "view",
          "create",
          "edit",
          "detail",
          "delete",
          "restore",
          "export",
        ],
        activities: [
          "view",
          "create",
          "edit",
          "detail",
          "delete",
          "restore",
          "export",
        ],
        costs: [
          "view",
          "create",
          "edit",
          "detail",
          "delete",
          "restore",
          "export",
        ],
        settings: ["view", "manage", "export"],
      }[page],
      ...(!["settings", "dashboard"].includes(page) ? ["export"] : []),
      ...(["customers", "projects", "quotes", "orders", "services"].includes(
        page,
      )
        ? ["assign"]
        : []),
    ]),
  );
export const fieldKind = (page: string, area?: AreaId) =>
  area === "communication" || area === "communicationExport"
    ? "communications"
    : page === "pool"
      ? "customers"
      : page === "costs"
        ? "expenses"
        : page;
export const entityPage = (kind: string): Page =>
  kind === "communications" ? "projects" : (kind as Page);
export const areasFor = (page: Page): AreaId[] => [
  "export",
  ...(!["dashboard", "settings"].includes(page)
    ? ["statistics" as AreaId]
    : []),
  ...((page === "orders"
    ? ["list", "detail", "edit", "payments", "finance"]
    : ["projects", "customers", "leads", "pool"].includes(page)
      ? ["list", "detail", "edit", "communication", "communicationExport"]
      : ["dashboard", "daily", "reports", "settings"].includes(page)
        ? page === "dashboard"
          ? ["list", "statistics"]
          : ["list"]
        : page === "inventory"
          ? ["list", "detail", "edit", "borrow", "return"]
          : ["list", "detail", "edit"]) as AreaId[]),
];
const definitions: Record<string, string> = {
  customers:
    "name:客户姓名,company:客户单位,title:职称 / 职务,phone:电话,wechat:微信,email:邮箱,region:所属区域,address:联系地址,category:客户类别,application:应用类别,owner:负责人,source:来源,tags:公共标签,myTags:个人标签,notes:备注,contacts:同单位联系人,invoiceTitle:发票抬头,taxId:税号,bank:开户银行,bankAccount:银行账户,createdAt:创建时间,updatedAt:更新时间",
  leads:
    "name:线索名称,customerId:关联客户,owner:负责人,source:线索来源,sourceDetail:来源明细,referrer:推介人信息,brand:咨询产品品牌,judgement:机会判定,content:首次沟通内容,status:状态,createdAt:创建时间",
  projects:
    "name:项目名称,customerId:关联客户,owner:负责人,brand:推荐品牌,model:产品型号,application:应用类别,budget:预算金额,probability:签单概率,stage:跟进阶段,status:项目状态,orderNumber:成单订单号,target:项目目标,system:用户系统描述,needs:真实需求 / 附加需求,recommendation:推荐方案 / 优势 / 劣势,competitor:竞争方案 / 优势 / 劣势,purchaseDate:预计采购时间,purchaseMethod:采购方式,useDate:预计使用时间,nextDate:下次跟进日期,nextPlan:下次跟进计划,reason:放弃原因,attachments:相关附件,createdAt:创建时间",
  quotes:
    "name:报价名称,projectId:关联项目,customerId:关联客户,owner:负责人,date:报价日期,expiry:有效期,currency:报价币种,purchaseMethod:购买方式,items:产品明细,discount:折扣率,freight:运保费,status:报价状态",
  orders:
    "name:订单名称,projectId:关联项目,customerId:关联客户,owner:负责人,contract:分公司合同号,supplierContract:供方合同号,model:产品型号,supplier:供应商,sn:产品 SN 码,date:订单日期,amount:成交金额,cost:采购成本,freight:运保费,commission:佣金,otherCost:其他费用,status:履约状态,invoiceDate:开票日期,shipDate:发货日期,acceptDate:验收日期,payments:客户回款,supplierPayments:供应商付款",
  services:
    "name:服务主题,customerId:关联客户,owner:负责人,orderId:关联订单,type:服务类别,model:设备型号,warranty:保修期,date:预约日期,status:服务状态,tools:提前准备工具,content:服务要求,result:服务记录与验收",
  inventory:
    "owner:负责人,name:商品名称,model:型号,brand:生产厂家,category:归属,location:存放地点,condition:产品状况,quantity:库存总数量,price:销售单价,cost:采购价格,date:入库日期,description:物料描述,loans:借还记录",
  suppliers:
    "owner:负责人,name:供应商单位,brand:品牌,contact:联系人,title:职称,phone:电话 / 微信,email:邮箱,address:地址,website:官网,level:合作级别,notes:合作备注,attachments:产品手册",
  knowledge:
    "name:资料标题,category:资料分类,brand:关联品牌,tags:标签,owner:作者,date:日期,content:正文 / 资料说明,url:视频或参考链接,status:状态,reviewNote:审核意见,attachments:资料附件",
  communications:
    "owner:负责人,title:沟通主题,method:沟通方式,date:沟通日期,content:沟通内容,nextDate:下次跟进日期,nextPlan:下次跟进计划,attachments:现场照片 / 附件",
  daily:
    "date:日志日期,owner:负责人,administration:行政工作,summary:工作总结,plan:后续计划",
  expenses:
    "name:费用标题,date:费用日期,owner:负责人,category:费用类别,amount:金额,note:说明",
  activities:
    "name:活动标题,owner:负责人,date:发生日期,category:类别,content:活动内容,result:结果,attachments:附件",
  resources:
    "name:资料名称,owner:维护人,date:资料日期,category:资料类别,content:资料说明,code:代码或币种,rate:汇率或税率,scope:共享范围,attachments:附件,deleted:已删除",
  dashboard:
    "owner:负责人,brand:产品品牌,source:来源,leadCount:新增线索统计,projectCount:在跟项目统计,expectedAmount:预期金额统计,wonRate:线索成单率统计",
  reports:
    "owner:负责人,brand:产品品牌,source:来源,leads:线索数,projects:项目数,won:成单数,rate:成单率,records:沟通数,budget:预算总额,expected:预期金额",
};
export function createAdministration(): Administration {
  const fields = Object.fromEntries(
    Object.entries(definitions).map(([kind, value]) => [
      kind,
      value.split(",").map((pair) => {
        const [key, label] = pair.split(":");
        return {
          key,
          label,
          type: "text",
          enabled: true,
          system: true,
          required: ["name", "customerId", "projectId", "owner"].includes(key),
        };
      }),
    ]),
  ) as Administration["fields"];
  for (const kind of Object.keys(fields)) {
    for (const [key, label] of metaFields)
      if (!fields[kind].some((f) => f.key === key))
        fields[kind].push({
          key,
          label,
          type: key.endsWith("At") ? "date" : "text",
          enabled: true,
          system: true,
        });
    fields[kind].push(...(supplementaryFields[kind] || []));
  }
  for (const kind of ["customers", "suppliers"]) {
    if (!fields[kind].some((f) => f.key === "contacts"))
      fields[kind].push({
        key: "contacts",
        label: "其他联系人与关系",
        type: "text",
        enabled: true,
        system: true,
      });
    for (const [key, label] of [
      ["name", "姓名"],
      ["title", "职称"],
      ["phone", "电话"],
      ["email", "邮箱"],
      ["relation", "关系"],
      ["gender", "性别"],
      ["address", "联系地址"],
    ])
      fields[kind].push({
        key: `contacts.${key}`,
        label: `联系人${label}`,
        type: "text",
        enabled: true,
        system: true,
      });
  }
  for (const kind of ["orders", "services", "inventory"])
    fields[kind].push({
      key: "attachments",
      label: "合同 / 服务附件",
      type: "text",
      enabled: true,
      system: true,
    });
  for (const [key, label] of loanFields)
    fields.inventory.push({
      key: `loans.${key}`,
      label,
      type: [
        "deposit",
        "rent",
        "totalDays",
        "overdueDays",
        "normalFee",
        "overdueFee",
        "totalFee",
      ].includes(key)
        ? "number"
        : "text",
      enabled: true,
      system: true,
    });
  fields.inventory.push({
    key: "loans.quantity",
    label: "借用数量",
    type: "number",
    enabled: true,
    system: true,
  });
  fields.inventory.push({
    key: "loans.attachments",
    label: "借用协议及寄还照片",
    type: "text",
    enabled: true,
    system: true,
  });
  for (const [key, label] of [
    ["borrower", "借用人"],
    ["date", "借出日期"],
    ["dueDate", "预计归还日期"],
    ["returnedAt", "归还日期"],
    ["purpose", "借用用途"],
  ])
    fields.inventory.push({
      key: `loans.${key}`,
      label,
      type: ["date", "dueDate", "returnedAt"].includes(key) ? "date" : "text",
      enabled: true,
      system: true,
    });
  fields.leads.push({
    key: "projectId",
    label: "关联项目",
    type: "text",
    enabled: true,
    system: true,
  });
  fields.leads.push({
    key: "convertedAt",
    label: "转项目时间",
    type: "date",
    enabled: true,
    system: true,
  });
  for (const [key, label] of [
    ["items.productCode", "产品编码"],
    ["items.model", "产品型号"],
    ["items.description", "产品描述"],
    ["items.quantity", "产品数量"],
    ["items.price", "产品单价"],
  ])
    fields.quotes.push({
      key,
      label,
      type: "text",
      enabled: true,
      system: true,
    });
  for (const [key, label] of [
    ["paymentAmount", "收付款金额"],
    ["paymentDate", "收付款日期"],
    ["paymentNote", "收付款备注"],
  ])
    fields.orders.push({
      key,
      label,
      type: "text",
      enabled: true,
      system: true,
    });
  for (const [key, label] of [
    ["customerName", "新客户姓名"],
    ["company", "新客户单位"],
    ["phone", "客户电话"],
    ["email", "客户邮箱"],
  ])
    fields.leads.push({
      key,
      label,
      type: "text",
      enabled: true,
      system: true,
    });
  const role = (code: string, name: string): RoleDefinition => ({
    id: code,
    code,
    name,
    description: "",
    builtin: true,
    menus: (Object.keys(pageNames) as Page[]).filter(
      (p) => code === "sys_admin" || p !== "settings",
    ),
    grants: {},
    fields: {},
  });
  const admin = role("sys_admin", "系统管理员"),
    supervisor = role("sales_manager", "销售主管"),
    sales = role("sales", "客户顾问"),
    reader = role("readonly", "普通成员");
  for (const r of [supervisor, sales, reader])
    for (const page of Object.keys(pageNames) as Page[])
      for (const action of actionsFor(page))
        r.grants[`${page}.list.${action}`] =
          action === "view" ||
          action === "detail" ||
          (r !== reader &&
            ![
              "manage",
              "finance",
              "delete",
              "restore",
              "review",
              "export",
              "import",
              "assign",
            ].includes(action)) ||
          (r === supervisor &&
            ["review", "export", "import", "restore", "assign"].includes(
              action,
            ));
  for (const r of [supervisor, sales, reader])
    for (const page of Object.keys(pageNames) as Page[])
      for (const area of areasFor(page))
        if (area !== "list")
          r.grants[`${page}.${area}.view`] = area !== "finance";
  for (const r of [supervisor, sales, reader])
    for (const area of ["list", "detail", "edit", "payments", "finance"])
      for (const key of ["cost", "commission", "otherCost", "supplierPayments"])
        r.fields[`orders.${area}.${key}`] = "hidden";
  for (const r of [supervisor, sales, reader])
    for (const area of ["list", "detail", "edit"])
      r.fields[`inventory.${area}.cost`] = "hidden";
  for (const r of [supervisor, sales, reader]) {
    r.menus = r.menus.filter((p) => p !== "costs");
    for (const action of ["create", "edit", "delete", "restore"])
      r.grants[`resources.list.${action}`] = false;
    for (const kind of ["orders", "inventory"])
      for (const f of fields[kind])
        if (financialExtras.has(f.key))
          r.fields[`${kind}.list.${f.key}`] = "hidden";
  }
  return {
    company: {
      name: "上海星谱科技",
      shortName: "星谱 CRM",
      logo: "",
      tagline: "让每一次沟通产生价值",
    },
    roles: [admin, supervisor, sales, reader],
    communicationEditMinutes: 15,
    fields,
    users: owners.map((name, i) => ({
      id: `user-${i + 1}`,
      username: `member${i + 1}`,
      name,
      roleId: i === 0 ? "sys_admin" : i === 1 ? "sales_manager" : "sales",
      managerId:
        i === 0
          ? ""
          : i === 1 || i === 5
            ? "user-1"
            : i === 6
              ? "user-6"
              : "user-2",
      department:
        i === 0 ? "管理层" : i === 5 || i === 6 ? "技术支持" : "销售团队",
      email: `member${i + 1}@example.com`,
      status: "active",
    })),
  };
}
export function migrateAdministration(state: State): State {
  if (!state.activities || !state.resources)
    state = {
      ...state,
      activities: state.activities || [],
      resources: state.resources || [],
    };
  if (!state.admin) return { ...state, admin: createAdministration() };
  const defaults = createAdministration();
  let changed = false;
  const fields = { ...state.admin.fields };
  const roles = state.admin.roles.map((r) => ({
    ...r,
    fields: { ...r.fields },
  }));
  for (const [kind, definitions] of Object.entries(defaults.fields)) {
    const missing = definitions.filter(
      (f) => !fields[kind]?.some((existing) => existing.key === f.key),
    );
    if (missing.length) {
      fields[kind] = [...(fields[kind] || []), ...missing];
      for (const role of roles)
        for (const f of missing) {
          if (
            role.code !== "sys_admin" &&
            financialExtras.has(f.key) &&
            role.fields[`${kind}.list.${f.key}`] === undefined
          )
            role.fields[`${kind}.list.${f.key}`] = "hidden";
        }
      changed = true;
    }
  }
  return changed
    ? { ...state, admin: { ...state.admin, fields, roles } }
    : state;
}
export function descendants(users: UserAccount[], userId: string): Set<string> {
  const result = new Set([userId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const u of users)
      if (
        u.status !== "deleted" &&
        result.has(u.managerId) &&
        !result.has(u.id)
      ) {
        result.add(u.id);
        changed = true;
      }
  }
  return result;
}
export function createAccess(state: State, userId: string) {
  const config = state.admin!;
  const user = config.users.find(
    (u) => u.id === userId && u.status === "active",
  );
  const role = config.roles.find((r) => r.id === user?.roleId);
  const admin = role?.code === "sys_admin";
  const ids = user ? descendants(config.users, user.id) : new Set<string>();
  const names = new Set(
    config.users.filter((u) => ids.has(u.id)).map((u) => u.name),
  );
  const can = (menu: Page, action = "view", area: AreaId = "list"): boolean =>
    !!user &&
    !!role &&
    (admin ||
      (!!role.menus.includes(menu) &&
        role.grants[`${menu}.list.view`] !== false &&
        (area === "list" || role.grants[`${menu}.${area}.view`] !== false) &&
        (role.grants[`${menu}.${area}.${action}`] ??
          role.grants[`${menu}.list.${action}`] ??
          action === "view")));
  const field = (menu: Page, area: AreaId, key: string): FieldMode => {
    const kind = fieldKind(menu, area);
    const def = config.fields[kind]?.find((f) => f.key === key);
    const parent = key.includes(".")
      ? field(menu, area, key.split(".")[0])
      : undefined;
    if (parent === "hidden") return "hidden";
    if (def?.enabled === false || !can(menu, "view", area)) return "hidden";
    const inheritedArea =
      area === "communicationExport" ? "communication" : "list";
    if (
      ["export", "statistics", "communicationExport"].includes(area) &&
      field(menu, inheritedArea, key) === "hidden"
    )
      return "hidden";
    if (metaFields.some(([k]) => k === key))
      return role?.fields[`${menu}.${area}.${key}`] === "hidden" ||
        (area !== "list" && role?.fields[`${menu}.list.${key}`] === "hidden")
        ? "hidden"
        : "read";
    if (admin) return "write";
    if (parent === "read") return "read";
    return (
      role?.fields[`${menu}.${area}.${key}`] ??
      (area !== "list"
        ? role?.fields[`${menu}.${inheritedArea}.${key}`]
        : undefined) ??
      ((
        area === "communication"
          ? can(menu, "communicate", area)
          : area === "payments"
            ? can(menu, "payment", area)
            : area === "borrow" || area === "return"
              ? can(menu, area, area)
              : can(menu, "edit", area) || can(menu, "create", area)
      )
        ? "write"
        : "read")
    );
  };
  return {
    user,
    role,
    isAdmin: !!admin,
    names,
    can,
    field,
    owns: (owner: string) => !!user && (!!admin || names.has(owner)),
    ownerNames: config.users
      .filter((u) => u.status === "active" && (admin || ids.has(u.id)))
      .map((u) => u.name),
  };
}
export type Access = ReturnType<typeof createAccess>;
export function scopeData(state: State, access: Access): State {
  const own = (x: { owner: string }) => access.owns(x.owner);
  const projects = state.projects
    .map((p) =>
      projectView(p, (owner) => access.owns(owner) || owner === "公共池"),
    )
    .filter((p): p is State["projects"][number] => !!p);
  const customerIds = new Set(projects.map((p) => p.customerId));
  const customers = state.customers.filter(
    (c) => own(c) || c.pool || customerIds.has(c.id),
  );
  const communications = state.communications.filter(
    (c) =>
      own(c) ||
      (!c.projectId &&
        customers.some((x) => x.id === c.customerId && x.pool)) ||
      projects.some(
        (p) =>
          p.id === c.projectId &&
          (own(p) ||
            p.owner === "公共池" ||
            p.history?.some(
              (h) => access.owns(h.owner) && h.communicationIds.includes(c.id),
            )),
      ),
  );
  return {
    ...state,
    customers,
    projects,
    communications,
    leads: state.leads.filter(
      (l) =>
        own(l) ||
        l.owner === "公共池" ||
        (l.owner === "待分配" && access.can("leads", "assign")),
    ),
    quotes: state.quotes.filter(own),
    orders: state.orders.filter(own),
    services: state.services.filter(own),
    knowledge: state.knowledge.filter((k) => own(k) || k.status === "已发布"),
    daily: state.daily.filter(own),
    expenses: state.expenses.filter(own),
    audit: state.audit.filter(own),
    activities: state.activities.filter(own),
    resources: state.resources.filter((r) => own(r) || r.scope === "公司共享"),
    inventory: state.inventory.map((item) => ({
      ...item,
      loans: item.loans.map((loan) =>
        access.owns(loan.owner || loan.borrower)
          ? loan
          : {
              id: loan.id,
              quantity: loan.quantity,
              returnedAt: loan.returnedAt ? "已归还" : "",
              borrower: "",
              date: "",
              dueDate: "",
              purpose: "",
            },
      ),
    })),
  };
}
export function validateUser(config: Administration, input: UserAccount) {
  if (!input.name.trim() || !input.username.trim())
    throw new Error("请填写姓名和账号");
  if (
    config.users.some(
      (u) =>
        u.id !== input.id &&
        (u.username.toLowerCase() === input.username.toLowerCase() ||
          u.name === input.name),
    )
  )
    throw new Error("账号或姓名已存在，请使用唯一值");
  if (!config.roles.some((r) => r.id === input.roleId))
    throw new Error("请选择有效角色");
  if (
    input.managerId &&
    (!config.users.some(
      (u) => u.id === input.managerId && u.status === "active",
    ) ||
      descendants(config.users, input.id).has(input.managerId))
  )
    throw new Error("领导不能是自己或任意层级的下属，且必须启用");
  const next = config.users.map((u) => (u.id === input.id ? input : u));
  if (
    config.users.some((u) => u.id === input.id) &&
    !next.some(
      (u) =>
        u.status === "active" &&
        config.roles.find((r) => r.id === u.roleId)?.code === "sys_admin",
    )
  )
    throw new Error("必须保留至少一位启用的系统管理员");
}
export function saveUser(state: State, input: UserAccount): State {
  input = {
    ...input,
    name: input.name.trim(),
    username: input.username.trim(),
    managerId: input.managerId || "",
  };
  const config = state.admin!;
  validateUser(config, input);
  const previous = config.users.find((u) => u.id === input.id);
  const rename = (value: any): any =>
    Array.isArray(value)
      ? value.map(rename)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value).map(([k, v]) => [
              k,
              k === "owner" && v === previous?.name
                ? input.name
                : k === "personalTags" && v && typeof v === "object"
                  ? Object.fromEntries(
                      Object.entries(v).map(([name, tags]) => [
                        name === previous?.name ? input.name : name,
                        tags,
                      ]),
                    )
                  : rename(v),
            ]),
          )
        : value;
  const next =
    previous && previous.name !== input.name ? rename(state) : { ...state };
  return {
    ...next,
    admin: {
      ...config,
      users: previous
        ? config.users.map((u) => (u.id === input.id ? input : u))
        : [...config.users, input],
    },
  };
}
export function deleteUser(
  state: State,
  id: string,
  successorId: string,
  currentUserId: string,
): State {
  const config = state.admin!;
  const user = config.users.find((u) => u.id === id);
  const nextUser = config.users.find(
    (u) => u.id === successorId && u.status === "active",
  );
  if (!user || id === currentUserId)
    throw new Error("不能删除当前登录的演示账号");
  if (!nextUser || descendants(config.users, id).has(nextUser.id))
    throw new Error("请选择该用户及其下属之外的启用用户承接业务");
  validateUser(config, { ...user, status: "deleted" });
  const next = { ...state };
  for (const key of [
    "customers",
    "leads",
    "projects",
    "quotes",
    "orders",
    "services",
    "knowledge",
    "expenses",
    "activities",
    "resources",
    "inventory",
    "suppliers",
  ] as const)
    (next as any)[key] = state[key].map((x) =>
      "owner" in x && x.owner === user.name
        ? { ...x, owner: nextUser.name }
        : x,
    );
  return {
    ...next,
    admin: {
      ...config,
      users: config.users.map((u) =>
        u.id === id
          ? { ...u, status: "deleted" }
          : u.managerId === id
            ? { ...u, managerId: nextUser.id }
            : u,
      ),
    },
  };
}
export function saveRole(state: State, input: RoleDefinition): State {
  if (!/^[a-z][a-z0-9_]{1,47}$/.test(input.code))
    throw new Error("角色 code 需为 2–48 位小写字母、数字或下划线，以字母开头");
  if (!input.name.trim()) throw new Error("请填写角色名称");
  const roles = state.admin!.roles;
  const old = roles.find((r) => r.id === input.id);
  if (old && old.code !== input.code)
    throw new Error("角色 code 创建后不能修改");
  if (
    roles.some(
      (r) =>
        r.id !== input.id && (r.code === input.code || r.name === input.name),
    )
  )
    throw new Error("角色 code 或名称已存在");
  if (old?.code === "sys_admin")
    throw new Error("内置系统管理员保留完整权限，不能修改或删除");
  return {
    ...state,
    admin: {
      ...state.admin!,
      roles: old
        ? roles.map((r) => (r.id === input.id ? input : r))
        : [...roles, input],
    },
  };
}
export function deleteRole(state: State, id: string): State {
  const config = state.admin!;
  const r = config.roles.find((r) => r.id === id);
  if (r?.builtin) throw new Error("内置角色不能删除，可修改其非管理员权限");
  if (config.users.some((u) => u.roleId === id && u.status !== "deleted"))
    throw new Error("请先将使用此角色的用户改为其他角色");
  return {
    ...state,
    admin: { ...config, roles: config.roles.filter((r) => r.id !== id) },
  };
}
export function maskRecord<T>(
  record: T,
  fields: FieldDefinition[],
  mode: (key: string) => FieldMode,
): T {
  const result = { ...record } as any;
  for (const f of fields)
    if (!f.enabled || mode(f.key) === "hidden") {
      if (f.system) {
        if (f.key === "myTags") result.personalTags = {};
        const [key, child] = f.key.split(".");
        if (child && Array.isArray(result[key]))
          result[key] = result[key].map((item: any) => ({
            ...item,
            [child]: typeof item[child] === "number" ? NaN : "",
          }));
        else
          result[f.key] = Array.isArray(result[f.key])
            ? []
            : typeof result[f.key] === "number"
              ? NaN
              : "";
      } else result.custom = { ...result.custom, [f.key]: undefined };
    }
  return result;
}
export function writableValues(
  values: Record<string, any>,
  fields: FieldDefinition[],
  mode: (key: string) => FieldMode,
) {
  const next = { ...values };
  for (const f of fields)
    if (!f.enabled || mode(f.key) !== "write") {
      if (f.system) {
        const [key, child] = f.key.split(".");
        if (child && Array.isArray(next[key]))
          next[key] = next[key].map((item: any) => {
            const value = { ...item };
            delete value[child];
            return value;
          });
        else delete next[f.key];
      } else if (next.custom) {
        next.custom = { ...next.custom };
        delete next.custom[f.key];
      }
    }
  return next;
}

export function projectFields(
  state: State,
  access: Access,
  area: AreaId,
  menu?: Page,
): State {
  const result = { ...state };
  for (const key of [
    "customers",
    "leads",
    "projects",
    "quotes",
    "orders",
    "services",
    "inventory",
    "suppliers",
    "knowledge",
    "communications",
    "daily",
    "activities",
    "resources",
    "expenses",
  ] as const) {
    const page =
      key === "communications"
        ? menu === "customers"
          ? "customers"
          : "projects"
        : key === "customers" && menu === "pool"
          ? "pool"
          : key === "expenses"
            ? "costs"
            : (key as Page);
    const actualArea =
      key === "communications"
        ? area === "export"
          ? "communicationExport"
          : "communication"
        : area;
    const defs = state.admin!.fields[key] || [];
    if (!access.can(page, "view", actualArea)) {
      (result as any)[key] = [];
      continue;
    }
    (result as any)[key] = state[key].map((record) => {
      const item = maskRecord(record, defs, (k) =>
        access.field(page, actualArea, k),
      );
      if (key === "customers") {
        const name = access.user?.name || "";
        const tags = (item as any).personalTags?.[name] || [];
        (item as any).personalTags = { [name]: tags };
        (item as any).myTags = tags;
      }
      if (
        key === "communications" &&
        access.field(page, actualArea, "content") === "hidden"
      ) {
        (item as any).revisions = [];
        (item as any).supplements = [];
      }
      if (key === "projects" && (item as any).history)
        (item as any).history = (item as any).history.map((h: any) => ({
          ...h,
          project: maskRecord(h.project, defs, (k) =>
            access.field(page, actualArea, k),
          ),
        }));
      return item;
    });
  }
  return result;
}
