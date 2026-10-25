import { useState } from "react";
import { Button, Input, Space, Segmented } from "antd";
export function ArticleBody({ value = "" }: { value?: string }) {
  const inline = (line: string) =>
    line
      .split(/(\*\*[^*]+\*\*)/g)
      .map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      );
  return (
    <div className="article-body">
      {value
        .split("\n")
        .map((line, i) =>
          line.startsWith("## ") ? (
            <h3 key={i}>{inline(line.slice(3))}</h3>
          ) : line.startsWith("- ") ? (
            <p key={i}>• {inline(line.slice(2))}</p>
          ) : (
            <p key={i}>{inline(line) || "\u00a0"}</p>
          ),
        )}
    </div>
  );
}
export function ArticleEditor({
  value = "",
  onChange,
  disabled = false,
  readOnly = false,
}: {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const [mode, setMode] = useState("编辑");
  const locked = disabled || readOnly;
  return (
    <div className="article-editor">
      <Space wrap>
        <Segmented value={mode} onChange={setMode} options={["编辑", "预览"]} />
        {[
          ["标题", "\n## 标题\n"],
          ["加粗", "**重点内容**"],
          ["列表", "\n- 条目\n"],
        ].map(([label, text]) => (
          <Button
            key={label}
            size="small"
            disabled={locked}
            onClick={() => {
              setMode("编辑");
              onChange?.(value + text);
            }}
          >
            {label}
          </Button>
        ))}
      </Space>
      {mode === "预览" ? (
        <ArticleBody value={value} />
      ) : (
        <Input.TextArea
          aria-label="资料正文"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          rows={7}
          disabled={locked}
        />
      )}
    </div>
  );
}
