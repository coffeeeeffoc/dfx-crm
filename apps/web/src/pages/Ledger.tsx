import { useState } from "react";
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useCRM } from "../context";
import {
  CustomDetails,
  CustomFields,
  Form,
  PermissionArea,
} from "../permission-ui";
import {
  Attachments,
  DataList,
  Filters,
  PageHeading,
  Section,
} from "../components";
import { ExportRecords } from "../export";
import { expenseCategories } from "@dfx-crm/core/material-fields";
import { fieldValue } from "@dfx-crm/core/records";
import {
  fieldKind,
  maskRecord,
  pageNames,
  scopeData,
  writableValues,
} from "@dfx-crm/core/access";
import { money, today, uid } from "@dfx-crm/core/domain";
import type { Page } from "@dfx-crm/core/domain";

export function LedgerPage({
  kind,
}: {
  kind: "expenses" | "activities" | "resources";
}) {
  const { state, rawState, access, page, actor, change, mobile } = useCRM();
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>();
  const [deleted, setDeleted] = useState(false);
  const [editing, setEditing] = useState<any>();
  const [selected, setSelected] = useState<string>();
  const categories =
    kind === "expenses"
      ? expenseCategories
      : kind === "resources"
        ? ["通讯录", "汇率表", "税率表", "常用文件", "产品资料"]
        : ["市场", "行政"];
  const rows = (state[kind] as any[]).filter(
    (r) =>
      (!r.deleted || deleted) &&
      (!category || r.category === category) &&
      JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
  );
  const original = selected
    ? (scopeData(rawState, access)[kind] as any[]).find(
        (r) => r.id === selected,
      )
    : undefined;
  const readable = (r: any, area: "list" | "detail") =>
    maskRecord(r, rawState.admin!.fields[kind], (key) =>
      access.field(page, area, key),
    );
  const detail = original ? readable(original, "detail") : undefined;
  const openEdit = (id?: string) => {
    if (!access.can(page, id ? "edit" : "create", "edit")) return;
    const item = id
      ? (rawState[kind] as any[]).find((x) => x.id === id)
      : undefined;
    if (item && !access.owns(item.owner))
      return void message.warning("只能修改本人及下属的数据");
    setEditing(
      item || {
        id: uid(kind),
        name: "",
        owner: actor,
        date: today(),
        category: categories[0],
        amount: 0,
        note: "",
        content: "",
        result: "",
        code: "",
        rate: 0,
        scope: "公司共享",
        deleted: false,
        attachments: [],
      },
    );
  };
  return (
    <>
      <PageHeading
        title={pageNames[page]}
        description={
          kind === "expenses"
            ? "按实际发生月份、费用类型和归属人记录成本。"
            : kind === "resources"
              ? "通讯录、汇率、税率和常用文件，集中维护。"
              : "记录市场推广和行政事项，自动归入周期工作日志。"
        }
        actions={
          <>
            {access.can(page, "create", "edit") && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openEdit()}
              >
                新增记录
              </Button>
            )}
          </>
        }
      />
      <Section>
        <Filters search={search} onSearch={setSearch}>
          <Select
            aria-label="资料或费用类别"
            allowClear
            placeholder="全部类别"
            value={category}
            options={categories.map((value) => ({ value, label: value }))}
            onChange={setCategory}
          />
          {
            <Button onClick={() => setDeleted(!deleted)}>
              {deleted ? "隐藏已删除" : "显示已删除"}
            </Button>
          }
        </Filters>
        <DataList
          data={rows}
          onRow={(r) =>
            access.can(page, "detail", "detail") && setSelected(r.id)
          }
          columns={[
            {
              title: "名称",
              dataIndex: "name",
              render: (v, r) => (
                <Button
                  type="link"
                  disabled={!access.can(page, "detail", "detail")}
                  onClick={() => setSelected(r.id)}
                >
                  {v || r.category}
                </Button>
              ),
            },
            { title: "类别", dataIndex: "category" },
            { title: "日期", dataIndex: "date" },
            { title: "负责人", dataIndex: "owner" },
            ...(kind === "expenses"
              ? [{ title: "金额", dataIndex: "amount", render: money }]
              : []),
            {
              title: "操作",
              render: (_, r) => (
                <Space>
                  {access.can(page, "edit", "edit") && access.owns(r.owner) && (
                    <Button size="small" onClick={() => openEdit(r.id)}>
                      编辑
                    </Button>
                  )}
                  {access.can(page, r.deleted ? "restore" : "delete") &&
                    access.owns(r.owner) && (
                      <Popconfirm
                        title={r.deleted ? "恢复记录？" : "将记录移入已删除？"}
                        onConfirm={() =>
                          change(
                            r.deleted ? "恢复记录" : "删除记录",
                            r.name || r.category,
                            (s) => ({
                              ...s,
                              [kind]: (s[kind] as any[]).map((x) =>
                                x.id === r.id
                                  ? { ...x, deleted: !r.deleted }
                                  : x,
                              ),
                            }),
                          )
                        }
                      >
                        <Button size="small">
                          {r.deleted ? "恢复" : "删除"}
                        </Button>
                      </Popconfirm>
                    )}
                </Space>
              ),
            },
          ]}
          card={(r) => (
            <>
              <Button
                type="link"
                disabled={!access.can(page, "detail", "detail")}
                onClick={() => setSelected(r.id)}
              >
                {r.name || r.category}
              </Button>
              <p>
                {r.date} · {r.owner}
              </p>
              <Tag>{r.category}</Tag>
              {kind === "expenses" && <b>¥ {money(r.amount)}</b>}
              {access.can(page, "edit", "edit") && access.owns(r.owner) && (
                <Button onClick={() => openEdit(r.id)}>编辑</Button>
              )}
            </>
          )}
        />
      </Section>
      {editing && (
        <PermissionArea menu={page} area="edit">
          <LedgerEditor
            kind={kind}
            item={editing}
            existing={(rawState[kind] as any[]).some(
              (r) => r.id === editing.id,
            )}
            categories={categories}
            onClose={() => setEditing(undefined)}
          />
        </PermissionArea>
      )}
      {detail && access.can(page, "detail", "detail") && (
        <Drawer
          open
          title={detail.name || pageNames[page]}
          width={mobile ? "100%" : 750}
          onClose={() => setSelected(undefined)}
        >
          <Descriptions
            column={1}
            bordered
            items={rawState
              .admin!.fields[kind].filter(
                (f) =>
                  f.system &&
                  f.key !== "attachments" &&
                  access.field(page, "detail", f.key) !== "hidden",
              )
              .map((f) => ({
                key: f.key,
                label: f.label,
                children: String(fieldValue(detail, f.key) ?? "—"),
              }))}
          />
          <PermissionArea menu={page} area="detail">
            <CustomDetails record={detail} />
            {access.field(page, "detail", "attachments") !== "hidden" && (
              <Attachments readOnly value={detail.attachments || []} />
            )}
          </PermissionArea>
        </Drawer>
      )}
    </>
  );
}
function LedgerEditor({
  kind,
  item,
  existing,
  categories,
  onClose,
}: {
  kind: "expenses" | "activities" | "resources";
  item: any;
  existing: boolean;
  categories: string[];
  onClose: () => void;
}) {
  const { page, actor, access, rawState, change, ownerNames, mobile } =
    useCRM();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  return (
    <Modal
      open
      width={750}
      title={`${existing ? "编辑" : "新增"}${pageNames[page]}`}
      onCancel={onClose}
      onOk={() => form.submit()}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={item}
        onFinish={(input: any) => {
          if (
            !access.can(page, existing ? "edit" : "create", "edit") ||
            (existing && !access.owns(item.owner))
          )
            return void message.error("没有保存权限");
          const values = writableValues(
            input,
            rawState.admin!.fields[kind],
            (key) => access.field(page, "edit", key),
          );
          const next = {
            ...item,
            ...values,
            custom: { ...item.custom, ...values.custom },
          };
          if (
            !next.name?.trim() ||
            !next.date ||
            (kind === "expenses" &&
              (!Number.isFinite(next.amount) || next.amount <= 0))
          )
            return void message.error("请填写名称、日期和有效金额");
          if (
            change(existing ? "修改记录" : "新增记录", next.name, (s) => ({
              ...s,
              [kind]: existing
                ? (s[kind] as any[]).map((r) => (r.id === item.id ? next : r))
                : [next, ...s[kind]],
            }))
          )
            onClose();
        }}
      >
        <div className="form-grid">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="类别">
            <Select
              options={categories.map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item name="owner" label="负责人">
            <Select
              options={ownerNames.map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item name="date" label="发生日期">
            <Input type="date" />
          </Form.Item>
        </div>
        {kind === "expenses" ? (
          <>
            <Form.Item name="amount" label="金额">
              <InputNumber min={0.01} precision={2} />
            </Form.Item>
            <Form.Item name="note" label="费用说明">
              <Input.TextArea rows={3} />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item name="content" label="内容">
              <Input.TextArea rows={4} />
            </Form.Item>
            {kind === "activities" ? (
              <Form.Item name="result" label="结果">
                <Input.TextArea />
              </Form.Item>
            ) : (
              <div className="form-grid">
                <Form.Item name="code" label="代码 / 币种">
                  <Input />
                </Form.Item>
                <Form.Item name="rate" label="汇率 / 税率（人工维护）">
                  <InputNumber min={0} precision={6} />
                </Form.Item>
                <Form.Item name="scope" label="共享范围">
                  <Select
                    options={["公司共享", "本人及下属"].map((value) => ({
                      value,
                      label: value,
                    }))}
                  />
                </Form.Item>
              </div>
            )}
            <Form.Item name="attachments" label="附件">
              <Attachments />
            </Form.Item>
          </>
        )}
        <CustomFields />
      </Form>
    </Modal>
  );
}
