import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { migrateAdministration } from "../src/access";
import { createSeed } from "../src/seed";

const fields = migrateAdministration(createSeed()).admin!.fields;
for (const [kind, definitions] of Object.entries(fields)) {
  assert.equal(
    new Set(definitions.map((f) => f.key)).size,
    definitions.length,
    `${kind} 字段重复`,
  );
  assert.ok(
    definitions.every((f) => f.key && f.label),
    `${kind} 缺少字段标识`,
  );
}
const root = new URL("../docs/materials/", import.meta.url);
writeFileSync(
  new URL("field-registry.json", root),
  JSON.stringify(fields, null, 2),
  "utf8",
);
writeFileSync(
  new URL("field-registry.md", root),
  "# 原型字段清单\n\n由 `scripts/export-field-registry.ts` 从当前注册表生成；包含系统字段、材料补充字段和嵌套字段。企业自行新增的字段在本机配置中。\n\n" +
    Object.entries(fields)
      .map(
        ([kind, definitions]) =>
          `## ${kind}（${definitions.length}）\n\n| 字段 key | 显示名称 | 类型 | 来源 |\n| --- | --- | --- | --- |\n` +
          definitions
            .map(
              (f) =>
                `| ${f.key} | ${f.label} | ${f.type} | ${f.source || "系统"} |`,
            )
            .join("\n"),
      )
      .join("\n\n"),
  "utf8",
);
console.log(
  JSON.stringify({
    groups: Object.keys(fields).length,
    fields: Object.values(fields).reduce((sum, defs) => sum + defs.length, 0),
  }),
);
