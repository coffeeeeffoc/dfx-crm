import { Button, Collapse, Input, Select, Space, Tag } from "antd";
import {
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useCRM } from "./context";
import { fieldValue, type RecordFilters as FilterState } from "./records";
import { scopeData } from "./access";
import { projectFields } from "./permission-ui";
export function RecordFilters() {
  const { rawState, state, access, page, filters, setFilters } = useCRM();
  const kind =
    page === "pool" ? "customers" : page === "costs" ? "expenses" : page;
  const defs = (rawState.admin!.fields[kind] || []).filter(
    (f) => f.enabled && access.field(page, "list", f.key) !== "hidden",
  );
  if (!defs.length) return null;
  const available = projectFields(
    scopeData(rawState, access),
    access,
    "list",
    page,
  );
  const rows =
    (available as any)[kind] ||
    (["dashboard", "reports"].includes(page)
      ? [...available.leads, ...available.projects]
      : []);
  const update = (patch: Partial<FilterState>) =>
    setFilters({ ...filters, ...patch });
  const people = (key: string) =>
    Array.from(
      new Set(rows.map((r: any) => fieldValue(r, key)).filter(Boolean)),
    ).map((value) => ({ value: String(value), label: String(value) }));
  const allowed = (key: string) => defs.some((f) => f.key === key);
  const dateFields = defs.filter(
    (f) => f.type === "date" || /Date|At$|^date$/.test(f.key),
  );
  const selectedDateField =
    filters.dateField ||
    (dateFields.some((f) => f.key === "createdAt")
      ? "createdAt"
      : dateFields[0]?.key);
  const date = (
    key:
      "from" | "to" | "createdFrom" | "createdTo" | "updatedFrom" | "updatedTo",
    label: string,
  ) => (
    <Input
      aria-label={label}
      type="date"
      value={filters[key] || ""}
      onChange={(e) =>
        update({
          [key]: e.target.value,
          ...(["from", "to"].includes(key)
            ? { dateField: selectedDateField }
            : {}),
        })
      }
    />
  );
  return (
    <div className="record-filters">
      <Collapse
        size="small"
        items={[
          {
            key: "filters",
            label: (
              <span>
                <FilterOutlined /> 筛选查询{" "}
                <Tag>
                  {Object.values(filters).some((v) =>
                    Array.isArray(v) ? v.length : Boolean(v),
                  )
                    ? "已设置"
                    : "全部可见记录"}
                </Tag>
              </span>
            ),
            extra: (
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setFilters({});
                }}
              >
                重置
              </Button>
            ),
            children: (
              <>
                <div className="filter-grid">
                  {(["owner", "createdBy", "updatedBy"] as const)
                    .filter(allowed)
                    .map((key, i) => (
                      <label key={key}>
                        {
                          {
                            owner: "负责人",
                            createdBy: "创建人",
                            updatedBy: "更新人",
                          }[key]
                        }
                        <Select
                          aria-label={
                            key === "owner"
                              ? "筛选负责人"
                              : key === "createdBy"
                                ? "筛选创建人"
                                : "筛选更新人"
                          }
                          allowClear
                          showSearch
                          value={filters[key]}
                          onChange={(value) => update({ [key]: value })}
                          options={people(key)}
                        />
                      </label>
                    ))}
                  {!!dateFields.length && (
                    <label>
                      业务时间字段
                      <Select
                        aria-label="业务时间字段"
                        value={selectedDateField}
                        onChange={(v) => update({ dateField: v })}
                        options={dateFields.map((f) => ({
                          value: f.key,
                          label: f.label,
                        }))}
                      />
                    </label>
                  )}
                  <label>时间范围开始{date("from", "时间范围开始")}</label>
                  <label>时间范围结束{date("to", "时间范围结束")}</label>
                  {allowed("createdAt") && (
                    <>
                      <label>
                        创建时间开始{date("createdFrom", "创建时间开始")}
                      </label>
                      <label>
                        创建时间结束{date("createdTo", "创建时间结束")}
                      </label>
                    </>
                  )}
                  {allowed("updatedAt") && (
                    <>
                      <label>
                        更新时间开始{date("updatedFrom", "更新时间开始")}
                      </label>
                      <label>
                        更新时间结束{date("updatedTo", "更新时间结束")}
                      </label>
                    </>
                  )}
                </div>
                {(filters.conditions || []).map((c, i) => (
                  <div className="condition-row" key={i}>
                    <Select
                      aria-label={`条件${i + 1}字段`}
                      showSearch
                      optionFilterProp="label"
                      value={c.field || undefined}
                      placeholder="选择业务字段"
                      options={defs.map((f) => ({
                        value: f.key,
                        label: f.label,
                      }))}
                      onChange={(field) =>
                        update({
                          conditions: filters.conditions!.map((x, j) =>
                            j === i ? { ...x, field } : x,
                          ),
                        })
                      }
                    />
                    <Select
                      aria-label={`条件${i + 1}方式`}
                      value={c.operator}
                      options={[
                        { value: "contains", label: "包含" },
                        { value: "equals", label: "等于" },
                        { value: "range", label: "范围（数字/日期）" },
                      ]}
                      onChange={(operator) =>
                        update({
                          conditions: filters.conditions!.map((x, j) =>
                            j === i ? { ...x, operator } : x,
                          ),
                        })
                      }
                    />
                    <Input
                      aria-label={`条件${i + 1}值`}
                      value={c.value}
                      placeholder={
                        c.operator === "range"
                          ? "最小值 / YYYY-MM-DD"
                          : "查询值"
                      }
                      onChange={(e) =>
                        update({
                          conditions: filters.conditions!.map((x, j) =>
                            j === i ? { ...x, value: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    {c.operator === "range" && (
                      <Input
                        aria-label={`条件${i + 1}上限`}
                        value={c.end}
                        placeholder="最大值 / YYYY-MM-DD"
                        onChange={(e) =>
                          update({
                            conditions: filters.conditions!.map((x, j) =>
                              j === i ? { ...x, end: e.target.value } : x,
                            ),
                          })
                        }
                      />
                    )}
                    <Button
                      aria-label={`删除条件${i + 1}`}
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        update({
                          conditions: filters.conditions!.filter(
                            (_, j) => i !== j,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
                <Button
                  icon={<PlusOutlined />}
                  onClick={() =>
                    update({
                      conditions: [
                        ...(filters.conditions || []),
                        { field: "", operator: "contains", value: "" },
                      ],
                    })
                  }
                >
                  增加业务字段条件
                </Button>
                <small className="muted">
                  {" "}
                  条件之间为“并且”；未知创建/更新信息不会命中指定范围。
                </small>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
