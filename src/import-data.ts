import {
  duplicates,
  emptyCustomer,
  now,
  uid,
  type State,
  type Customer,
  type Lead,
} from "./domain";
import { scopeData, type Access } from "./access";
export function prepareImportRows(
  state: State,
  access: Access,
  kind: "customers" | "leads",
  rows: string[][],
  mapping: Record<string, number>,
) {
  const customers: Customer[] = [];
  const leads: Lead[] = [];
  const visible = new Set(scopeData(state, access).customers.map((c) => c.id));
  const checked = rows.map((row, index) => {
    const values = Object.fromEntries(
      Object.entries(mapping).map(([key, col]) => [
        key,
        (row[col] || "").trim(),
      ]),
    );
    const item = {
      ...emptyCustomer(),
      name: kind === "leads" ? values.customerName : values.name,
      company: values.company,
      phone: values.phone || "",
      email: values.email || "",
      title: values.title || "",
      region: values.region || "",
      owner: access.user?.name || "",
    };
    let error = !access.can(kind, "import")
      ? "没有导入权限"
      : Object.keys(values).some(
            (k) => values[k] && access.field(kind, "edit", k) !== "write",
          )
        ? "包含不可写字段"
        : !item.name || !item.company || (kind === "leads" && !values.name)
          ? "缺少必填名称/单位"
          : item.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)
            ? "邮箱格式不正确"
            : "";
    const matches = duplicates([...state.customers, ...customers], item);
    if (!error && kind === "customers" && matches.length)
      error = "疑似重复客户，跳过";
    if (
      !error &&
      kind === "leads" &&
      matches.length &&
      !visible.has(matches[0].id) &&
      !customers.some((c) => c.id === matches[0].id)
    )
      error = "客户已存在且无关联权限，请联系主管";
    if (
      !error &&
      kind === "leads" &&
      !matches.length &&
      !access.can("customers", "create", "edit")
    )
      error = "没有创建关联客户的权限";
    if (
      !error &&
      kind === "leads" &&
      !matches.length &&
      [
        "name",
        "company",
        ...(item.phone ? ["phone"] : []),
        ...(item.email ? ["email"] : []),
      ].some((key) => access.field("customers", "edit", key) !== "write")
    )
      error = "关联客户包含不可写字段";
    const customerId = matches[0]?.id || item.id;
    if (
      !error &&
      kind === "leads" &&
      [...state.leads, ...leads].some(
        (l) => l.customerId === customerId && l.name.trim() === values.name,
      )
    )
      error = "疑似重复线索，跳过";
    if (!error) {
      if (!matches.length) customers.push(item);
      if (kind === "leads")
        leads.push({
          id: uid("XS"),
          name: values.name,
          customerId,
          owner: access.user!.name,
          source: "自己新建",
          sourceDetail: "销售开发",
          referrer: "",
          brand: values.brand || "",
          content: values.content || "",
          judgement: "有咨询",
          status: "跟进中",
          createdAt: now(),
        });
    }
    return {
      id: String(index),
      line: index + 2,
      name: values.name,
      company: item.company,
      phone: item.phone,
      error,
    };
  });
  return {
    customers,
    leads,
    checked,
    validCount: checked.filter((r) => !r.error).length,
  };
}
