import { CustomDetails } from "./permission-ui";
import { ExportRecords } from "./export";
import { fieldKind } from "@dfx-crm/core/access";
import { fieldValue } from "@dfx-crm/core/records";
import type { ReactNode } from "react";
import { useState } from "react";
import { App, Button, Empty, Input, Select, Table, Tag, Upload } from "antd";
import type { TableProps } from "antd";
import { SearchBar } from "antd-mobile";
import {
  DownloadOutlined,
  SearchOutlined,
  UploadOutlined,
  PaperClipOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import type { Attachment } from "@dfx-crm/core/domain";
import { useCRM } from "./context";
import { openAttachment, saveAttachment } from "./storage";

export function Section({
  title,
  extra,
  children,
  className = "",
}: {
  title?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-heading">
          <h3>{title}</h3>
          {extra}
        </div>
      )}
      {children}
    </section>
  );
}
export function Status({ value }: { value: string }) {
  const colors: Record<string, string> = {
    跟进中: "blue",
    有机会: "blue",
    已成单: "green",
    已完成: "green",
    已发布: "green",
    客户确认: "green",
    已发送: "blue",
    待分配: "orange",
    待审核: "orange",
    待发货: "orange",
    待服务: "orange",
    已放弃: "default",
    公共池: "cyan",
    草稿: "default",
    已退回: "red",
  };
  return (
    <Tag color={colors[value] || "default"} variant="filled">
      {value}
    </Tag>
  );
}
export function Person({ name }: { name: string }) {
  return (
    <span className="person">
      <span className={`avatar avatar-${name.length % 3}`}>
        {name.slice(-2, -1) || name[0]}
      </span>
      {name}
    </span>
  );
}
export function Filters({
  search,
  onSearch,
  placeholder = "搜索名称、客户或编号",
  children,
}: {
  search: string;
  onSearch: (s: string) => void;
  placeholder?: string;
  children?: ReactNode;
}) {
  const { mobile } = useCRM();
  return (
    <div className="filter-row">
      {mobile ? (
        <SearchBar
          value={search}
          onChange={onSearch}
          placeholder={placeholder}
        />
      ) : (
        <Input
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="search-input"
        />
      )}
      {children}
    </div>
  );
}
export const options = (values: string[]) =>
  values.map((value) => ({ value, label: value }));
export function FilterSelect({
  value,
  onChange,
  values,
  label,
}: {
  value: string;
  onChange: (s: string) => void;
  values: string[];
  label: string;
}) {
  return (
    <Select
      aria-label={label}
      value={value}
      onChange={onChange}
      options={options(["全部", ...values])}
      style={{ minWidth: 120 }}
    />
  );
}
export function DataList<T extends { id: string }>({
  data,
  columns,
  card,
  onRow,
}: {
  data: T[];
  columns: TableProps<T>["columns"];
  card: (item: T) => ReactNode;
  onRow?: (item: T) => void;
}) {
  const { mobile, access, page, rawState, area } = useCRM();
  const [extraColumns, setExtraColumns] = useState<string[]>([]);
  const defs = rawState.admin!.fields[fieldKind(page, area)] || [];
  const displayColumns = (columns || []).filter((c) => {
    const keys =
      "dataIndex" in c && c.dataIndex
        ? [String(c.dataIndex)]
        : String(c.key || "").startsWith("fields:")
          ? String(c.key).split(":")[1].split(",")
          : [];
    const known = keys.filter((k) => defs.some((f) => f.key === k));
    return (
      !known.length ||
      known.some((k) => access.field(page, "list", k) !== "hidden")
    );
  });
  for (const f of defs)
    if (
      ((!f.system && !f.source) || extraColumns.includes(f.key)) &&
      f.enabled &&
      access.field(page, "list", f.key) !== "hidden"
    )
      displayColumns.push({
        key: f.key,
        title: f.label,
        render: (_, item) => {
          const value = fieldValue(item, f.key);
          return typeof value === "object"
            ? JSON.stringify(value)
            : String(value ?? "—");
        },
      });
  const toolbar = (
    <div className="table-tools">
      <span className="muted">{data.length} 条筛选结果</span>
      <Select
        mode="multiple"
        aria-label="显示更多字段"
        allowClear
        placeholder="显示更多字段"
        value={extraColumns}
        onChange={setExtraColumns}
        maxTagCount={1}
        options={defs
          .filter(
            (f) =>
              f.enabled &&
              !f.key.includes(".") &&
              access.field(page, "list", f.key) !== "hidden",
          )
          .map((f) => ({ value: f.key, label: f.label }))}
        style={{ minWidth: 180, maxWidth: 320 }}
      />
      <ExportRecords rows={data} />
    </div>
  );
  if (mobile)
    return (
      <>
        {toolbar}
        <div className="mobile-cards">
          {data.length ? (
            data.map((item) => (
              <div className="mobile-card" key={item.id}>
                {card(item)}
                <CustomDetails record={item} />
              </div>
            ))
          ) : (
            <Empty description="暂无匹配记录" />
          )}
        </div>
      </>
    );
  return (
    <>
      {toolbar}
      <Table
        rowKey="id"
        columns={displayColumns}
        dataSource={data}
        scroll={{ x: 850 }}
        size="middle"
        pagination={{
          pageSize: 8,
          showSizeChanger: false,
          showTotal: (n) => `共 ${n} 条记录`,
        }}
        onRow={(item) => ({ onDoubleClick: () => onRow?.(item) })}
      />
    </>
  );
}
export function Attachments({
  value = [],
  onChange,
  readOnly = false,
  disabled = false,
}: {
  value?: Attachment[];
  onChange?: (value: Attachment[]) => void;
  readOnly?: boolean;
  disabled?: boolean;
}) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  readOnly = readOnly || disabled;
  return (
    <div className="attachments">
      {value.map((a) => (
        <div className="file-row" key={a.id}>
          <PaperClipOutlined />
          <span>
            {a.name}
            <small>{(a.size / 1024).toFixed(0)} KB · 保存在本机</small>
          </span>
          {/\.(png|jpe?g|pdf)$/i.test(a.name) && (
            <Button
              size="small"
              type="link"
              onClick={() =>
                openAttachment(a, true).catch((e) => message.error(e.message))
              }
            >
              预览
            </Button>
          )}
          <Button
            aria-label={`下载${a.name}`}
            icon={<DownloadOutlined />}
            type="text"
            onClick={() =>
              openAttachment(a).catch((e) => message.error(e.message))
            }
          />
          {!readOnly && (
            <Button
              size="small"
              type="text"
              danger
              onClick={() => onChange?.(value.filter((x) => x.id !== a.id))}
            >
              移除
            </Button>
          )}
        </div>
      ))}
      {!readOnly && (
        <Upload
          showUploadList={false}
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          beforeUpload={async (file) => {
            setLoading(true);
            try {
              const attachment = await saveAttachment(file);
              onChange?.([...value, attachment]);
              message.success("附件已保存到本机");
            } catch (e) {
              message.error((e as Error).message);
            } finally {
              setLoading(false);
            }
            return false;
          }}
        >
          <Button loading={loading} icon={<UploadOutlined />}>
            添加附件
          </Button>
          <span className="muted upload-note">单个文件不超过 200MB</span>
        </Upload>
      )}
    </div>
  );
}
export function Metric({
  label,
  value,
  unit,
  note,
  icon,
  color = "blue",
  onDetails,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  note: ReactNode;
  icon: ReactNode;
  color?: string;
  onDetails?: () => void;
}) {
  return (
    <div className="metric">
      <div className="metric-top">
        <span>
          {label}
          {onDetails && (
            <Button
              size="small"
              type="text"
              aria-label={`查看${label}明细`}
              icon={<UnorderedListOutlined />}
              onClick={onDetails}
            />
          )}
        </span>
        <span className={`metric-icon ${color}`}>{icon}</span>
      </div>
      <div className="metric-value">
        {value}
        <small>{unit}</small>
      </div>
      <div className="metric-note">{note}</div>
    </div>
  );
}
export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-actions">{actions}</div>
    </div>
  );
}
