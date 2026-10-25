import type { Administration } from "./access";
import type { RecordMeta } from "./records";
export const stages = [
  { value: 0, label: "有咨询", short: "初步咨询", color: "#8b9ab4" },
  { value: 10, label: "有适合产品", short: "产品匹配", color: "#7b9ae9" },
  { value: 20, label: "用户满意顾问方案", short: "方案认可", color: "#5a85e6" },
  {
    value: 50,
    label: "已明确采购意向是我方",
    short: "意向明确",
    color: "#416add",
  },
  { value: 70, label: "进入采购流程", short: "采购流程", color: "#3dabc2" },
  { value: 90, label: "合同已签订", short: "合同签订", color: "#3aa88b" },
  {
    value: 100,
    label: "验收合格且付清尾款",
    short: "验收回款",
    color: "#27886d",
  },
];
export const owners = [
  "董福星",
  "李金蔓",
  "杨工厂",
  "张杰",
  "李帆",
  "高原",
  "樊淼",
  "杨林伟",
];
export type Role = string;
export type Page =
  | "dashboard"
  | "leads"
  | "projects"
  | "customers"
  | "pool"
  | "quotes"
  | "orders"
  | "services"
  | "inventory"
  | "suppliers"
  | "knowledge"
  | "daily"
  | "reports"
  | "resources"
  | "activities"
  | "costs"
  | "settings";
export type EntityKind =
  | "customers"
  | "leads"
  | "projects"
  | "quotes"
  | "orders"
  | "services"
  | "inventory"
  | "suppliers"
  | "knowledge";
export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
}
export interface Contact {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  relation: string;
  gender?: string;
  address?: string;
}
export interface Customer extends RecordMeta {
  custom?: Record<string, string | number>;
  id: string;
  name: string;
  company: string;
  title: string;
  phone: string;
  wechat: string;
  email: string;
  region: string;
  address: string;
  category: string;
  application: string;
  owner: string;
  source: string;
  tags: string[];
  personalTags: Record<string, string[]>;
  contacts: Contact[];
  deleted: boolean;
  pool: boolean;
  poolReason?: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
  invoiceTitle?: string;
  taxId?: string;
  bank?: string;
  bankAccount?: string;
}
export interface Lead extends RecordMeta {
  custom?: Record<string, string | number>;
  id: string;
  name: string;
  customerId: string;
  owner: string;
  source: string;
  sourceDetail: string;
  referrer: string;
  brand: string;
  content: string;
  judgement: string;
  status: string;
  createdAt: string;
  projectId?: string;
  convertedAt?: string;
  poolReason?: string;
}
export interface Project extends RecordMeta {
  custom?: Record<string, string | number>;
  id: string;
  name: string;
  customerId: string;
  leadId?: string;
  owner: string;
  brand: string;
  model: string;
  application: string;
  budget: number;
  probability: number;
  stage: number;
  status: string;
  target: string;
  system: string;
  needs: string;
  recommendation: string;
  competitor: string;
  purchaseDate: string;
  purchaseMethod: string;
  useDate: string;
  nextDate: string;
  nextPlan: string;
  createdAt: string;
  reason: string;
  orderNumber: string;
  attachments: Attachment[];
  history?: {
    owner: string;
    date: string;
    project: Omit<Project, "history">;
    communicationIds: string[];
  }[];
}
export interface Communication extends RecordMeta {
  custom?: Record<string, string | number>;
  id: string;
  projectId?: string;
  customerId: string;
  owner: string;
  date: string;
  method: string;
  title: string;
  content: string;
  nextDate: string;
  nextPlan: string;
  attachments: Attachment[];
  revisions?: { date: string; owner: string; content: string; title: string }[];
  supplements?: { date: string; owner: string; content: string }[];
}
export interface QuoteItem {
  id: string;
  productCode?: string;
  model: string;
  description: string;
  quantity: number;
  price: number;
}
export interface Quote extends RecordMeta {
  custom?: Record<string, string | number>;
  id: string;
  name: string;
  projectId: string;
  customerId: string;
  owner: string;
  date: string;
  expiry: string;
  currency: string;
  purchaseMethod: string;
  items: QuoteItem[];
  discount: number;
  freight: number;
  status: string;
}
export interface Payment {
  id: string;
  date: string;
  amount: number;
  note: string;
}
export interface Order extends RecordMeta {
  attachments?: Attachment[];
  custom?: Record<string, string | number>;
  id: string;
  name: string;
  projectId: string;
  customerId: string;
  owner: string;
  date: string;
  contract: string;
  supplierContract: string;
  model: string;
  supplier: string;
  sn: string;
  amount: number;
  cost: number;
  freight: number;
  commission: number;
  otherCost: number;
  payments: Payment[];
  supplierPayments: Payment[];
  status: string;
  invoiceDate: string;
  shipDate: string;
  acceptDate: string;
}
export interface Service extends RecordMeta {
  attachments?: Attachment[];
  custom?: Record<string, string | number>;
  id: string;
  name: string;
  customerId: string;
  orderId: string;
  owner: string;
  type: string;
  date: string;
  model: string;
  warranty: number;
  tools: string;
  content: string;
  result: string;
  status: string;
}
export interface Inventory extends RecordMeta {
  attachments?: Attachment[];
  custom?: Record<string, string | number>;
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  location: string;
  condition: string;
  price: number;
  cost: number;
  quantity: number;
  date: string;
  description: string;
  loans: {
    id: string;
    owner?: string;
    attachments?: Attachment[];
    shippingNumber?: string;
    returnNumber?: string;
    totalDays?: number;
    overdueDays?: number;
    normalFee?: number;
    overdueFee?: number;
    totalFee?: number;
    recipient?: string;
    company?: string;
    address?: string;
    contact?: string;
    phone?: string;
    agreement?: string;
    deposit?: number;
    rent?: number;
    notes?: string;
    borrower: string;
    quantity: number;
    date: string;
    dueDate: string;
    returnedAt: string;
    purpose: string;
  }[];
}
export interface Supplier extends RecordMeta {
  custom?: Record<string, string | number>;
  id: string;
  name: string;
  brand: string;
  contact: string;
  title: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  level: string;
  notes: string;
  attachments: Attachment[];
  contacts?: Contact[];
}
export interface Knowledge extends RecordMeta {
  custom?: Record<string, string | number>;
  id: string;
  name: string;
  category: string;
  brand: string;
  tags: string[];
  owner: string;
  date: string;
  content: string;
  url: string;
  status: string;
  reviewNote: string;
  attachments: Attachment[];
}
export interface Audit {
  id: string;
  date: string;
  owner: string;
  action: string;
  target: string;
  sensitive: boolean;
}
export interface Daily extends RecordMeta {
  custom?: Record<string, string | number>;
  id: string;
  date: string;
  owner: string;
  administration: string;
  summary: string;
  plan: string;
}
export interface Expense extends RecordMeta {
  deleted?: boolean;
  id: string;
  date: string;
  owner: string;
  category: string;
  amount: number;
  note: string;
  custom?: Record<string, string | number>;
  name?: string;
}
export interface Activity extends RecordMeta {
  deleted?: boolean;
  id: string;
  name: string;
  owner: string;
  date: string;
  category: string;
  content: string;
  result: string;
  attachments: Attachment[];
  custom?: Record<string, string | number>;
}
export interface Resource extends RecordMeta {
  id: string;
  name: string;
  owner: string;
  date: string;
  category: string;
  content: string;
  code: string;
  rate: number;
  scope: string;
  attachments: Attachment[];
  deleted: boolean;
  custom?: Record<string, string | number>;
}
export interface State {
  admin?: Administration;
  version: 1;
  customers: Customer[];
  leads: Lead[];
  projects: Project[];
  communications: Communication[];
  quotes: Quote[];
  orders: Order[];
  services: Service[];
  inventory: Inventory[];
  suppliers: Supplier[];
  knowledge: Knowledge[];
  audit: Audit[];
  daily: Daily[];
  expenses: Expense[];
  activities: Activity[];
  resources: Resource[];
  dictionaries: {
    brands: string[];
    applications: string[];
    categories: string[];
  };
}
export const uid = (prefix = "R") =>
  `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
export const today = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
export const now = () =>
  new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" });
export const money = (amount: number) =>
  Number.isFinite(amount)
    ? new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(
        amount,
      )
    : "—";
export const wan = (amount: number) =>
  Number.isFinite(amount) ? (amount / 10000).toFixed(1) : "—";
export const expected = (budget: number, probability: number) =>
  Math.round(budget * probability) / 100;
export const isOverdue = (date: string, status: string) =>
  !!date && date < today() && status === "跟进中";
const normalize = (value: string) =>
  value.trim().toLowerCase().replace(/[\s-]/g, "");
export function duplicates(
  customers: Customer[],
  input: Partial<Customer>,
): Customer[] {
  const phone = normalize(input.phone || "");
  const wechat = normalize(input.wechat || "");
  const email = normalize(input.email || "");
  return customers.filter(
    (c) =>
      c.id !== input.id &&
      ((!!phone && normalize(c.phone) === phone) ||
        (!!wechat && normalize(c.wechat) === wechat) ||
        (!!email && normalize(c.email) === email) ||
        (!!input.name?.trim() &&
          !!input.company?.trim() &&
          normalize(c.name) === normalize(input.name) &&
          normalize(c.company) === normalize(input.company))),
  );
}
export function quoteTotal(
  quote: Pick<Quote, "items" | "discount" | "freight">,
) {
  const subtotal = quote.items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.price * 100),
    0,
  );
  return (
    Math.round(subtotal * (1 - quote.discount / 100) + quote.freight * 100) /
    100
  );
}
export const available = (item: Inventory) =>
  item.quantity -
  item.loans
    .filter((l) => !l.returnedAt)
    .reduce((sum, l) => sum + l.quantity, 0);
export function projectView(
  project: Project,
  canSeeOwner: (owner: string) => boolean,
): Project | undefined {
  if (canSeeOwner(project.owner)) return project;
  const history = project.history
    ?.slice()
    .reverse()
    .find((h) => canSeeOwner(h.owner));
  return history
    ? {
        ...history.project,
        owner: "历史归档",
        status: "已转交",
        history: [history],
      }
    : undefined;
}
export function moveToPool(
  state: State,
  projectId: string,
  reason: string,
): State {
  if (!reason.trim()) throw new Error("请填写放弃原因");
  const p = state.projects.find((p) => p.id === projectId);
  if (!p || p.status === "已成单" || p.owner === "公共池")
    throw new Error("该项目无法转入公共池");
  const otherActive = state.projects.some(
    (x) =>
      x.customerId === p.customerId &&
      x.id !== p.id &&
      x.status === "跟进中" &&
      x.owner !== "公共池",
  );
  const { history = [], ...snapshot } = p;
  const archive = {
    owner: p.owner,
    date: now(),
    project: snapshot,
    communicationIds: state.communications
      .filter((c) => c.projectId === p.id)
      .map((c) => c.id),
  };
  return {
    ...state,
    projects: state.projects.map((x) =>
      x.id === p.id
        ? {
            ...x,
            owner: "公共池",
            status: "已放弃",
            reason,
            history: [...history, archive],
          }
        : x,
    ),
    leads: state.leads.map((l) =>
      l.id === p.leadId ? { ...l, owner: "公共池", status: "已放弃" } : l,
    ),
    customers: state.customers.map((c) =>
      c.id === p.customerId
        ? {
            ...c,
            pool: true,
            owner: otherActive ? c.owner : "公共池",
            poolReason: reason,
            updatedAt: now(),
          }
        : c,
    ),
  };
}
export function claimCustomer(
  state: State,
  customerId: string,
  actor: string,
): State {
  const c = state.customers.find(
    (c) => c.id === customerId && c.pool && !c.deleted,
  );
  if (!c) throw new Error("该客户已被领取或已删除");
  if (!actor.trim() || actor === "公共池")
    throw new Error("请选择有效的领取人");
  const leadIds = state.projects
    .filter((p) => p.customerId === customerId && p.owner === "公共池")
    .map((p) => p.leadId);
  leadIds.push(
    ...state.leads
      .filter((l) => l.customerId === customerId && l.owner === "公共池")
      .map((l) => l.id),
  );
  return {
    ...state,
    customers: state.customers.map((c) =>
      c.id === customerId
        ? {
            ...c,
            pool: false,
            owner: c.owner === "公共池" ? actor : c.owner,
            updatedAt: now(),
          }
        : c,
    ),
    leads: state.leads.map((l) =>
      leadIds.includes(l.id) ? { ...l, owner: actor, status: "跟进中" } : l,
    ),
    projects: state.projects.map((p) =>
      p.customerId === customerId && p.owner === "公共池"
        ? { ...p, owner: actor, status: "跟进中", nextDate: today() }
        : p,
    ),
  };
}
export function convertLead(state: State, leadId: string): State {
  const l = state.leads.find((l) => l.id === leadId);
  if (!l || l.projectId) throw new Error("该线索已转为项目");
  if (!l.owner || ["待分配", "公共池"].includes(l.owner))
    throw new Error("请先分配负责人");
  const p: Project = {
    id: uid("XM"),
    name: l.name,
    customerId: l.customerId,
    leadId: l.id,
    owner: l.owner,
    brand: l.brand,
    model: "",
    application: "",
    budget: 0,
    probability: 10,
    stage: 0,
    status: "跟进中",
    target: l.content,
    system: "",
    needs: "",
    recommendation: "",
    competitor: "",
    purchaseDate: "",
    purchaseMethod: "内购",
    useDate: "",
    nextDate: today(),
    nextPlan: "首次需求沟通",
    createdAt: now(),
    reason: "",
    orderNumber: "",
    attachments: [],
  };
  return {
    ...state,
    projects: [p, ...state.projects],
    leads: state.leads.map((x) =>
      x.id === l.id
        ? {
            ...x,
            projectId: p.id,
            convertedAt: now(),
            judgement: "有机会",
            status: "跟进中",
          }
        : x,
    ),
  };
}
export function releaseLead(
  state: State,
  id: string,
  reason: string,
  toPool: boolean,
): State {
  const lead = state.leads.find((l) => l.id === id);
  if (!lead || !reason.trim()) throw new Error("请选择线索并填写原因");
  if (lead.projectId) throw new Error("已转项目的线索请在项目中办理放弃");
  const anotherActive =
    state.projects.some(
      (p) =>
        p.customerId === lead.customerId &&
        p.owner !== "公共池" &&
        p.status === "跟进中",
    ) ||
    state.leads.some(
      (l) =>
        l.id !== id &&
        l.customerId === lead.customerId &&
        l.owner !== "公共池" &&
        l.status === "跟进中",
    );
  return {
    ...state,
    leads: state.leads.map((l) =>
      l.id === id
        ? {
            ...l,
            judgement: "无机会",
            status: "已放弃",
            poolReason: reason.trim(),
            owner: toPool ? "公共池" : l.owner,
          }
        : l,
    ),
    customers: toPool
      ? state.customers.map((c) =>
          c.id === lead.customerId
            ? {
                ...c,
                pool: true,
                poolReason: reason.trim(),
                owner: anotherActive ? c.owner : "公共池",
              }
            : c,
        )
      : state.customers,
  };
}
export const emptyCustomer = (): Customer => ({
  id: uid("KH"),
  name: "",
  company: "",
  title: "",
  phone: "",
  wechat: "",
  email: "",
  region: "",
  address: "",
  category: "高校",
  application: "",
  owner: "董福星",
  source: "星谱咨询",
  tags: [],
  personalTags: {},
  contacts: [],
  deleted: false,
  pool: false,
  createdAt: now(),
  updatedAt: now(),
  notes: "",
});
