import {
  cloneElement,
  isValidElement,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import {
  Button as AntButton,
  Form as AntForm,
  Input,
  InputNumber,
  Select,
  Collapse,
  App,
} from "antd";
import type { ButtonProps, FormItemProps } from "antd";
import { Context, useCRM } from "./context";
import type { AreaId, FieldDefinition } from "./access";
import { fieldKind, maskRecord, scopeData, projectFields } from "./access";
import type { Page, State } from "./domain";
import { openAttachment } from "./storage";
import { metaFields } from "./records";

export { projectFields } from "./access";
export function PermissionArea({
  menu,
  area,
  children,
}: {
  menu: Page;
  area: AreaId;
  children: ReactNode;
}) {
  const parent = useCRM();
  const state = projectFields(
    scopeData(parent.rawState, parent.access),
    parent.access,
    area,
    menu,
  );
  return (
    <Context.Provider value={{ ...parent, page: menu, area, state }}>
      {children}
    </Context.Provider>
  );
}
export function ActionButton({
  permission,
  menu,
  region,
  ...props
}: ButtonProps & { permission?: string; menu?: Page; region?: AreaId }) {
  const { access, page, area } = useCRM();
  if (permission && !access.can(menu || page, permission, region || area))
    return null;
  return <AntButton {...props} />;
}
export function AccessHtmlButton({
  permission,
  menu,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  permission: string;
  menu?: Page;
}) {
  const { access, page, area } = useCRM();
  return access.can(menu || page, permission, area) ? (
    <button {...props} />
  ) : null;
}
export function FieldVisible({
  name,
  children,
  menu,
  region,
}: {
  name: string;
  children: ReactNode;
  menu?: Page;
  region?: AreaId;
}) {
  const { access, page, area } = useCRM();
  return access.field(menu || page, region || area, name) ===
    "hidden" ? null : (
    <>{children}</>
  );
}
function SecureItem(props: FormItemProps) {
  const { access, page, area, rawState } = useCRM();
  const name = Array.isArray(props.name)
    ? typeof props.name[0] === "number"
      ? `items.${props.name[1]}`
      : String(props.name[0])
    : typeof props.name === "string"
      ? props.name
      : undefined;
  if (!name) return <AntForm.Item {...props} />;
  const kind = fieldKind(page, area);
  const def = rawState.admin!.fields[kind]?.find((f) => f.key === name);
  const mode = access.field(page, area, name);
  if (mode === "hidden") return null;
  const child = isValidElement(props.children)
    ? cloneElement(props.children as any, {
        ...(mode === "read" ? { disabled: true, readOnly: true } : {}),
        ...(typeof props.children.type === "string" ? {} : {}),
      })
    : props.children;
  return (
    <AntForm.Item
      {...props}
      label={def?.label || props.label}
      rules={mode === "read" ? undefined : props.rules}
    >
      {child}
    </AntForm.Item>
  );
}
export const Form = Object.assign(
  (props: Parameters<typeof AntForm>[0]) => <AntForm {...props} />,
  AntForm,
  { Item: SecureItem },
);
export function CustomFields() {
  const { rawState, access, page, area } = useCRM();
  const kind = fieldKind(page, area);
  return (
    <Collapse
      className="supplementary-fields"
      defaultActiveKey={[]}
      items={[
        {
          key: "fields",
          label: "补充业务字段与自定义字段",
          children: (
            <div className="form-grid">
              {(rawState.admin!.fields[kind] || [])
                .filter(
                  (f) =>
                    !f.system &&
                    f.enabled &&
                    access.field(page, area, f.key) !== "hidden",
                )
                .map((f) => (
                  <AntForm.Item
                    key={f.key}
                    name={["custom", f.key]}
                    label={f.label}
                  >
                    <CustomInput
                      field={f}
                      disabled={access.field(page, area, f.key) !== "write"}
                    />
                  </AntForm.Item>
                ))}
            </div>
          ),
        },
      ]}
    />
  );
}
function CustomInput({
  field,
  disabled,
  ...props
}: {
  field: FieldDefinition;
  disabled: boolean;
  value?: any;
  onChange?: any;
}) {
  const { state } = useCRM();
  if (field.key === "extra_supplierId")
    return (
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        disabled={disabled}
        options={state.suppliers.map((s) => ({
          value: s.id,
          label: `${s.name} · ${s.brand}`,
        }))}
        {...props}
      />
    );
  if (field.key === "extra_manual")
    return (
      <Select
        allowClear
        disabled={disabled}
        options={state.suppliers.flatMap((s) =>
          s.attachments.map((a) => ({
            value: a.id,
            label: `${s.name} / ${a.name}`,
          })),
        )}
        {...props}
      />
    );
  return field.type === "number" ? (
    <InputNumber style={{ width: "100%" }} disabled={disabled} {...props} />
  ) : field.type === "select" ? (
    <Select
      disabled={disabled}
      options={field.options?.map((value) => ({ value, label: value }))}
      {...props}
    />
  ) : (
    <Input
      type={field.type === "date" ? "date" : "text"}
      disabled={disabled}
      {...props}
    />
  );
}
export function CustomDetails({ record }: { record: any }) {
  const { rawState, access, page, area, state } = useCRM();
  const { message } = App.useApp();
  const manual = state.suppliers
    .flatMap((s) => s.attachments)
    .find((a) => a.id === record.custom?.extra_manual);
  return (
    <div className="custom-detail-grid">
      {(rawState.admin!.fields[fieldKind(page, area)] || [])
        .filter(
          (f) =>
            !f.system &&
            f.enabled &&
            (!f.source ||
              (record.custom?.[f.key] !== undefined &&
                record.custom?.[f.key] !== "")) &&
            access.field(page, area, f.key) !== "hidden",
        )
        .map((f) => (
          <div key={f.key}>
            <small className="muted">{f.label}</small>
            <p>
              {f.key === "extra_supplierId" ? (
                state.suppliers.find((s) => s.id === record.custom?.[f.key])
                  ?.name || "—"
              ) : f.key === "extra_manual" && manual ? (
                <AntButton
                  type="link"
                  onClick={() =>
                    openAttachment(manual).catch((e) =>
                      message.error(e.message),
                    )
                  }
                >
                  {manual.name} · 下载
                </AntButton>
              ) : (
                String(record.custom?.[f.key] ?? "—")
              )}
            </p>
          </div>
        ))}
    </div>
  );
}
export function RecordMetadata({ record }: { record: any }) {
  const { access, page, area } = useCRM();
  return (
    <div className="record-metadata">
      {metaFields
        .filter(([key]) => access.field(page, area, key) !== "hidden")
        .map(([key, label]) => (
          <span key={key}>
            {label}：{record[key] || "未记录"}
          </span>
        ))}
    </div>
  );
}
