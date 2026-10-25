import type { State } from "./domain";
import type { FieldDefinition } from "./access";
export const recordKinds = [
  "customers",
  "leads",
  "projects",
  "communications",
  "quotes",
  "orders",
  "services",
  "inventory",
  "suppliers",
  "knowledge",
  "daily",
  "expenses",
  "activities",
  "resources",
] as const;
export type RecordKind = (typeof recordKinds)[number];
export interface RecordMeta {
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  owner?: string;
}
export const metaFields = [
  ["createdBy", "创建人"],
  ["createdAt", "创建时间"],
  ["updatedBy", "更新人"],
  ["updatedAt", "更新时间"],
] as const;
export function canCorrectCommunication(
  createdAt: string | undefined,
  minutes: number,
  at: number,
  admin = false,
) {
  if (admin) return true;
  if (!createdAt || createdAt.length < 16) return false;
  const date = Date.parse(
    createdAt.includes("T")
      ? createdAt
      : createdAt.replace(" ", "T") + "+08:00",
  );
  return Number.isFinite(date) && at >= date && at - date <= minutes * 60000;
}

export function stampChanges(
  before: State,
  after: State,
  actor: string,
  timestamp: string,
): State {
  const next = { ...after };
  for (const kind of recordKinds) {
    const old = new Map((before[kind] as any[]).map((x) => [x.id, x]));
    (next as any)[kind] = (after[kind] as any[]).map((record) => {
      const previous = old.get(record.id);
      if (previous && JSON.stringify(previous) === JSON.stringify(record))
        return record;
      return {
        ...record,
        createdBy: previous ? previous.createdBy || "" : actor,
        createdAt: previous
          ? previous.createdAt || ""
          : record.createdAt || timestamp,
        updatedBy: actor,
        updatedAt: timestamp,
      };
    });
  }
  return next;
}
export interface RecordFilters {
  owner?: string;
  createdBy?: string;
  updatedBy?: string;
  dateField?: string;
  from?: string;
  to?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  conditions?: {
    field: string;
    operator: "contains" | "equals" | "range";
    value: string;
    end?: string;
  }[];
}
export function fieldValue(record: any, key: string): any {
  if (key.startsWith("custom_") || key.startsWith("extra_"))
    return record.custom?.[key];
  return key
    .split(".")
    .reduce(
      (v, k) => (Array.isArray(v) ? v.map((x) => x?.[k]) : v?.[k]),
      record,
    );
}
export function inRange(value: unknown, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  if (Array.isArray(value)) return value.some((v) => inRange(v, from, to));
  const day = typeof value === "string" ? value.slice(0, 10) : "";
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    (!from || day >= from) &&
    (!to || day <= to)
  );
}
export function filterRecords<T extends object>(
  records: T[],
  filters: RecordFilters,
  visible: (key: string) => boolean = () => true,
): T[] {
  return records.filter((record) => {
    const r = record as Record<string, any>;
    for (const key of ["owner", "createdBy", "updatedBy"] as const)
      if (filters[key] && (!visible(key) || r[key] !== filters[key]))
        return false;
    const dateField = filters.dateField || "createdAt";
    if (
      (filters.from || filters.to) &&
      (!visible(dateField) ||
        !inRange(fieldValue(r, dateField), filters.from, filters.to))
    )
      return false;
    for (const [key, from, to] of [
      ["createdAt", filters.createdFrom, filters.createdTo],
      ["updatedAt", filters.updatedFrom, filters.updatedTo],
    ] as const)
      if ((from || to) && (!visible(key) || !inRange(r[key], from, to)))
        return false;
    return (filters.conditions || []).every((c) => {
      if (!c.field || (!c.value && !c.end)) return true;
      if (!visible(c.field)) return false;
      const value = fieldValue(r, c.field);
      if (c.operator === "range") {
        return (Array.isArray(value) ? value : [value]).some((v) => {
          if (v === undefined || v === "" || v === null) return false;
          if (typeof v === "number")
            return (
              Number.isFinite(v) &&
              (!c.value || v >= Number(c.value)) &&
              (!c.end || v <= Number(c.end))
            );
          return inRange(v, c.value, c.end);
        });
      }
      const text =
        typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
      return c.operator === "equals"
        ? text.toLocaleLowerCase() === c.value.toLocaleLowerCase()
        : text.toLocaleLowerCase().includes(c.value.toLocaleLowerCase());
    });
  });
}
export function exportRows(
  records: any[],
  fields: FieldDefinition[],
  canRead: (key: string) => boolean,
) {
  const allowed = fields.filter(
    (f) => f.enabled && canRead(f.key) && !f.key.includes("."),
  );
  return {
    headers: allowed.map((f) => f.label),
    rows: records.map((r) =>
      allowed.map((f) => {
        const value = fieldValue(r, f.key);
        if (typeof value === "number")
          return Number.isFinite(value) ? value : "";
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      }),
    ),
  };
}
