import { Button, Input, Select, Space } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useCRM } from "./context";
import type { Contact } from "@dfx-crm/core/domain";
import { uid } from "@dfx-crm/core/domain";
export function ContactsEditor({
  value = [],
  onChange,
  disabled = false,
}: {
  value?: Contact[];
  onChange?: (v: Contact[]) => void;
  disabled?: boolean;
}) {
  const { access, page, area } = useCRM();
  const fields = [
    ["name", "姓名"],
    ["title", "职称"],
    ["phone", "电话"],
    ["email", "邮箱"],
    ["relation", "关系"],
    ["gender", "性别"],
    ["address", "联系地址"],
  ] as const;
  const update = (id: string, key: string, text: string) =>
    onChange?.(value.map((c) => (c.id === id ? { ...c, [key]: text } : c)));
  return (
    <div className="contacts-editor">
      {value.map((c, index) => (
        <div className="contact-editor-row" key={c.id}>
          {fields
            .filter(
              ([key]) =>
                access.field(page, area, `contacts.${key}`) !== "hidden",
            )
            .map(([key, label]) => (
              <label key={key}>
                {label}
                {key === "relation" ? (
                  <Select
                    aria-label={`联系人${index + 1}${label}`}
                    disabled={
                      disabled ||
                      access.field(page, area, `contacts.${key}`) !== "write"
                    }
                    value={c[key]}
                    onChange={(v) => update(c.id, key, v)}
                    options={[
                      "上级",
                      "同团队",
                      "下级",
                      "采购",
                      "技术",
                      "其他",
                    ].map((value) => ({ value, label: value }))}
                  />
                ) : (
                  <Input
                    aria-label={`联系人${index + 1}${label}`}
                    disabled={
                      disabled ||
                      access.field(page, area, `contacts.${key}`) !== "write"
                    }
                    value={c[key]}
                    onChange={(e) => update(c.id, key, e.target.value)}
                  />
                )}
              </label>
            ))}
          {!disabled && (
            <Button
              aria-label={`移除联系人${index + 1}`}
              icon={<DeleteOutlined />}
              onClick={() => onChange?.(value.filter((x) => x.id !== c.id))}
            />
          )}
        </div>
      ))}
      {!disabled && (
        <Button
          icon={<PlusOutlined />}
          onClick={() =>
            onChange?.([
              ...value,
              {
                id: uid("CONTACT"),
                name: "",
                title: "",
                phone: "",
                email: "",
                relation: "同团队",
              },
            ])
          }
        >
          增加联系人 / 关系
        </Button>
      )}
    </div>
  );
}
