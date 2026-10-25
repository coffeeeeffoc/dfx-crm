import { prepareImportRows } from "./import-data";
import { useState } from "react";
import { App, Alert, Button, Modal, Select, Space, Table, Upload } from "antd";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import { useCRM } from "./context";
import { duplicates, emptyCustomer } from "./domain";
import type { Customer } from "./domain";
import { exportExcel } from "./storage";

export function ImportCustomers({
  onClose,
  kind = "customers",
}: {
  onClose: () => void;
  kind?: "customers" | "leads";
}) {
  const { state, rawState, access, actor, change, mobile } = useCRM();
  const label = kind === "leads" ? "线索" : "客户";
  const { message } = App.useApp();
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const fields =
    kind === "leads"
      ? [
          { key: "name", label: "线索名称", required: true },
          { key: "customerName", label: "客户姓名", required: true },
          { key: "company", label: "单位", required: true },
          { key: "phone", label: "电话" },
          { key: "email", label: "邮箱" },
          { key: "brand", label: "品牌" },
          { key: "content", label: "首次沟通" },
        ]
      : [
          { key: "name", label: "姓名", required: true },
          { key: "company", label: "单位", required: true },
          { key: "phone", label: "电话" },
          { key: "email", label: "邮箱" },
          { key: "title", label: "职称" },
          { key: "region", label: "地区" },
        ];
  const { customers, leads, checked, validCount } = prepareImportRows(
    rawState,
    access,
    kind,
    rows,
    mapping,
  );
  return (
    <Modal
      open
      onCancel={onClose}
      title={`从 Excel 导入${label}`}
      width={850}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            disabled={!validCount}
            onClick={() => {
              if (
                change(`导入${label}`, `${validCount} 条客户`, (s) => ({
                  ...s,
                  customers: [...customers, ...s.customers],
                  leads: [...leads, ...s.leads],
                }))
              ) {
                message.success(
                  `已导入 ${validCount} 条，跳过 ${rows.length - validCount} 条`,
                );
                onClose();
              }
            }}
          >
            导入 {validCount} 条有效数据
          </Button>
        </>
      }
    >
      <Alert
        type="info"
        title="读取第一个工作表，第一行作为表头；先映射字段并预览。疑似重复及无效行不会导入。"
        style={{ marginBottom: 16 }}
      />
      <Button
        icon={<DownloadOutlined />}
        onClick={() =>
          exportExcel(
            `${label}导入模板`,
            fields
              .filter((f) => access.field(kind, "edit", f.key) === "write")
              .map((f) => f.label),
            [],
          ).catch(() => message.error("模板下载失败"))
        }
      >
        下载空白模板
      </Button>
      <Upload.Dragger
        accept=".xlsx"
        showUploadList={false}
        disabled={loading}
        beforeUpload={async (file) => {
          if (file.size > 10 * 1024 * 1024) {
            message.error("导入文件不能超过 10MB");
            return false;
          }
          setLoading(true);
          try {
            const { default: ExcelJS } = await import("exceljs");
            const w = new ExcelJS.Workbook();
            await w.xlsx.load(await file.arrayBuffer());
            const sheet = w.worksheets[0];
            if (!sheet) throw new Error("没有工作表");
            if (sheet.rowCount > 5001)
              throw new Error("原型单次最多导入 5000 行");
            const values: string[][] = [];
            sheet.eachRow((row, n) => {
              const cells: string[] = [];
              row.eachCell({ includeEmpty: true }, (cell, col) => {
                cells[col - 1] = cell.text;
              });
              if (n === 1) values.unshift(cells);
              else values.push(cells);
            });
            const head = values.shift() || [];
            setHeaders(head);
            setRows(values);
            setMapping(
              Object.fromEntries(
                fields
                  .map((f) => [f.key, head.indexOf(f.label)])
                  .filter(([, index]) => Number(index) >= 0),
              ),
            );
          } catch (e) {
            message.error(`文件读取失败：${(e as Error).message}`);
          } finally {
            setLoading(false);
          }
          return false;
        }}
        style={{ margin: "16px 0" }}
      >
        <InboxOutlined style={{ fontSize: 30, color: "#3866dc" }} />
        <p>{loading ? "正在读取…" : "点击选择或拖入 .xlsx 文件"}</p>
      </Upload.Dragger>
      {!!headers.length && (
        <>
          <div className="import-mapping">
            {fields
              .filter((f) => access.field(kind, "edit", f.key) === "write")
              .map((f) => (
                <label key={f.key}>
                  {f.label}
                  {f.required ? " *" : ""}
                  <Select
                    allowClear
                    aria-label={`${f.label}对应列`}
                    value={mapping[f.key]}
                    onChange={(v) => setMapping((m) => ({ ...m, [f.key]: v }))}
                    options={headers.map((h, i) => ({
                      label: h || `第 ${i + 1} 列`,
                      value: i,
                    }))}
                  />
                </label>
              ))}
          </div>
          <Table
            size="small"
            rowKey="id"
            scroll={{ x: 500 }}
            pagination={{ pageSize: 5 }}
            dataSource={checked}
            columns={[
              { title: "Excel 行", dataIndex: "line" },
              { title: "姓名", dataIndex: "name" },
              { title: "单位", dataIndex: "company" },
              {
                title: "检查",
                dataIndex: "error",
                render: (v) => (
                  <span className={v ? "text-danger" : "positive"}>
                    {v || "可导入"}
                  </span>
                ),
              },
            ]}
          />
        </>
      )}
    </Modal>
  );
}
