import assert from "node:assert/strict";
import test from "node:test";
import { recordKinds } from "@dfx-crm/core/records";
import { createSeed } from "./index";

test("mock 数据独立生成，客户/项目关联有效，联系方式使用演示值", () => {
  const first = createSeed();
  const second = createSeed();
  const customers = new Set(first.customers.map((customer) => customer.id));
  for (const kind of recordKinds) {
    assert.notEqual(first[kind], second[kind]);
    assert.equal(new Set(first[kind].map((record) => record.id)).size, first[kind].length);
  }
  assert.ok(first.customers.length > 0);
  assert.ok(first.projects.length > 0);
  assert.ok(first.customers.every((customer) => customer.email.endsWith("@example.com")));
  assert.ok(first.projects.every((project) => customers.has(project.customerId)));
  assert.ok(first.leads.every((lead) => !lead.customerId || customers.has(lead.customerId)));
  first.customers[0].name = "修改演示客户";
  assert.notEqual(first.customers[0].name, second.customers[0].name);
});
