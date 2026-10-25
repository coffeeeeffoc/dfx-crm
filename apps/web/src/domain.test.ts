import test from "node:test";
import assert from "node:assert/strict";
import {
  available,
  claimCustomer,
  convertLead,
  duplicates,
  emptyCustomer,
  expected,
  moveToPool,
  projectView,
  quoteTotal,
} from "@dfx-crm/core/domain";
import { createSeed } from "@dfx-crm/mock-data";

test("查重忽略空字段，支持邮箱大小写、电话号码间隔和姓名单位", () => {
  const c = {
    ...emptyCustomer(),
    phone: "138 0000 0001",
    email: "Jane@Example.com",
    name: "张三",
    company: "示例大学",
  };
  assert.equal(duplicates([c], {}).length, 0);
  assert.equal(duplicates([c], { phone: "138-0000-0001" }).length, 1);
  assert.equal(duplicates([c], { email: "jane@example.com" }).length, 1);
  assert.equal(
    duplicates([c], { name: "张三", company: "示例大学" }).length,
    1,
  );
});
test("项目概率与报价金额保留分，折扣不作用于运费", () => {
  assert.equal(expected(120000, 70), 84000);
  assert.equal(
    quoteTotal({
      items: [
        { id: "1", model: "", description: "", quantity: 3, price: 10.01 },
      ],
      discount: 10,
      freight: 5,
    }),
    32.03,
  );
});
test("转项目保留线索，并拒绝重复转换", () => {
  const s = createSeed();
  const l = s.leads.find((x) => !x.projectId && x.owner !== "待分配")!;
  const next = convertLead(s, l.id);
  assert.equal(next.projects.length, s.projects.length + 1);
  assert.equal(next.leads.length, s.leads.length);
  assert.throws(() => convertLead(next, l.id));
});
test("转公海保留沟通历史，领取只改变归属且不可重复", () => {
  const s = createSeed();
  const p = s.projects.find((p) => p.status === "跟进中")!;
  assert.throws(() => moveToPool(s, p.id, ""));
  const pool = moveToPool(s, p.id, "预算暂停");
  const claimed = claimCustomer(pool, p.customerId, "张杰");
  assert.deepEqual(claimed.communications, s.communications);
  assert.equal(claimed.projects.find((x) => x.id === p.id)?.owner, "张杰");
  assert.equal(claimed.leads.find((l) => l.id === p.leadId)?.owner, "张杰");
  assert.throws(() => claimCustomer(claimed, p.customerId, "李帆"));
});
test("领取公共项目不夺走同一客户的其他在跟项目，原负责人只看到移交前快照", () => {
  const s = createSeed();
  const p = s.projects[0];
  const second = {
    ...p,
    id: "another-project",
    leadId: undefined,
    owner: "李帆",
  };
  s.projects.push(second);
  const pool = moveToPool(s, p.id, "等待新方案");
  assert.equal(pool.customers.find((c) => c.id === p.customerId)?.pool, true);
  const claimed = claimCustomer(pool, p.customerId, "张杰");
  assert.equal(claimed.projects.find((x) => x.id === second.id)?.owner, "李帆");
  const updated = {
    ...claimed.projects.find((x) => x.id === p.id)!,
    needs: "移交后的机密需求",
  };
  const archive = projectView(updated, (owner) => owner === p.owner)!;
  assert.equal(archive.status, "已转交");
  assert.equal(archive.needs, p.needs);
  assert.equal(
    projectView(updated, (owner) => owner === "张杰")?.needs,
    "移交后的机密需求",
  );
  assert.equal(
    projectView(updated, (owner) => owner === "高原"),
    undefined,
  );
});
test("库存可用数量扣除未归还借用", () => {
  const item = createSeed().inventory[0];
  assert.equal(
    available({
      ...item,
      quantity: 3,
      loans: [
        {
          id: "1",
          borrower: "甲",
          quantity: 2,
          date: "",
          dueDate: "",
          returnedAt: "",
          purpose: "",
        },
      ],
    }),
    1,
  );
});
