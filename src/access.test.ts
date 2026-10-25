import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "./seed";
import { moveToPool, claimCustomer } from "./domain";
import {
  createAccess,
  deleteRole,
  deleteUser,
  descendants,
  maskRecord,
  migrateAdministration,
  saveRole,
  saveUser,
  scopeData,
  writableValues,
} from "./access";
const seed = () => migrateAdministration(createSeed());
test("领导关系递归包含孙级下属，不扩展到同部门同角色的同事", () => {
  const s = seed();
  s.admin!.users.find((u) => u.id === "user-8")!.managerId = "user-3";
  const a = createAccess(s, "user-2");
  assert.deepEqual([...descendants(s.admin!.users, "user-2")].sort(), [
    "user-2",
    "user-3",
    "user-4",
    "user-5",
    "user-8",
  ]);
  assert.equal(a.owns("樊淼"), false);
  assert.equal(a.owns("张杰"), true);
  const salesman = createAccess(s, "user-3");
  const data = scopeData(s, salesman);
  assert.ok(
    data.leads.every(
      (l) =>
        salesman.owns(l.owner) || l.owner === "公共池" || l.owner === "待分配",
    ),
  );
  assert.ok(data.orders.every((o) => salesman.owns(o.owner)));
  assert.ok(data.leads.some((l) => l.owner === "杨林伟"));
  assert.ok(
    data.communications.every(
      (c) =>
        salesman.owns(c.owner) ||
        data.customers.some((x) => x.id === c.customerId && x.pool),
    ),
  );
});
test("公共客户不暴露其他私有项目沟通，移交后本人和上级只读移交前快照", () => {
  let s = seed();
  const original = {
    ...s.projects[2],
    owner: "杨工厂",
    budget: 123456,
    needs: "移交前需求",
  };
  const sibling = {
    ...original,
    id: "private-sibling",
    owner: "高原",
    needs: "其他项目机密",
  };
  s.projects = [original, sibling];
  s.customers = s.customers.map((c) =>
    c.id === original.customerId ? { ...c, owner: "杨工厂", pool: false } : c,
  );
  const communication = {
    ...s.communications[0],
    customerId: original.customerId,
    owner: "高原",
  };
  s.communications = [
    { ...communication, id: "public-history", projectId: original.id },
    { ...communication, id: "private-history", projectId: sibling.id },
  ];
  s = moveToPool(s, original.id, "需求延期");
  const publicView = scopeData(s, createAccess(s, "user-7"));
  assert.ok(publicView.communications.some((c) => c.id === "public-history"));
  assert.ok(!publicView.communications.some((c) => c.id === "private-history"));
  s = claimCustomer(s, original.customerId, "高原");
  s.projects = s.projects.map((p) =>
    p.id === original.id ? { ...p, budget: 999999, needs: "领取后机密" } : p,
  );
  s.communications.push({
    ...communication,
    id: "after-transfer",
    projectId: original.id,
  });
  for (const userId of ["user-3", "user-2"]) {
    const view = scopeData(s, createAccess(s, userId));
    assert.equal(
      view.projects.find((p) => p.id === original.id)?.budget,
      123456,
    );
    assert.equal(
      view.projects.find((p) => p.id === original.id)?.needs,
      "移交前需求",
    );
    assert.ok(
      !view.communications.some(
        (c) => c.id === "after-transfer" || c.id === "private-history",
      ),
    );
  }
});
test("同一菜单的不同区域、字段权限相互独立；页面不可进入优先于按钮", () => {
  const s = seed();
  const r = s.admin!.roles.find((r) => r.code === "sales")!;
  r.fields["projects.detail.budget"] = "hidden";
  r.fields["projects.edit.budget"] = "read";
  r.grants["projects.detail.communicate"] = false;
  const a = createAccess(s, "user-3");
  assert.equal(a.field("projects", "detail", "budget"), "hidden");
  assert.equal(a.field("projects", "edit", "budget"), "read");
  assert.equal(a.field("projects", "list", "budget"), "write");
  assert.equal(a.can("projects", "communicate", "detail"), false);
  r.grants["projects.list.view"] = false;
  assert.equal(createAccess(s, "user-3").can("projects", "create"), false);
  r.grants["projects.list.view"] = true;
  r.menus = r.menus.filter((m) => m !== "projects");
  assert.equal(createAccess(s, "user-3").can("projects", "create"), false);
});
test("隐藏和只读字段不能通过提交覆盖；停用字段在管理员界面也隐藏", () => {
  const s = seed();
  const fields = s.admin!.fields.projects;
  const r = s.admin!.roles.find((r) => r.code === "sales")!;
  r.fields["projects.edit.budget"] = "read";
  r.fields["projects.edit.needs"] = "hidden";
  const a = createAccess(s, "user-3");
  const values = writableValues(
    { budget: 1, needs: "越权改写", name: "正常改名" },
    fields,
    (key) => a.field("projects", "edit", key),
  );
  assert.deepEqual(values, { name: "正常改名" });
  fields.find((f) => f.key === "competitor")!.enabled = false;
  assert.equal(
    createAccess(s, "user-1").field("projects", "detail", "competitor"),
    "hidden",
  );
  const masked = maskRecord(s.projects[0], fields, (key) =>
    a.field("projects", "edit", key),
  );
  assert.equal(masked.needs, "");
  assert.equal(masked.competitor, "");
});
test("组织环、重复账号、最后管理员停用均被拒绝；改名保留业务关联", () => {
  const s = seed();
  const admin = s.admin!.users[0],
    supervisor = s.admin!.users[1];
  assert.throws(
    () => saveUser(s, { ...supervisor, managerId: "user-3" }),
    /下属/,
  );
  assert.throws(() => saveUser(s, { ...admin, status: "disabled" }), /管理员/);
  assert.throws(
    () => saveUser(s, { ...supervisor, username: admin.username }),
    /已存在/,
  );
  s.customers[0].personalTags[supervisor.name] = ["需要跟进"];
  const next = saveUser(s, { ...supervisor, name: "主管新名称" });
  assert.equal(next.admin!.users[1].id, supervisor.id);
  assert.ok(next.leads.some((l) => l.owner === "主管新名称"));
  assert.ok(!next.leads.some((l) => l.owner === supervisor.name));
  assert.deepEqual(next.customers[0].personalTags["主管新名称"], ["需要跟进"]);
  assert.equal(next.customers[0].personalTags[supervisor.name], undefined);
});
test("删除用户交接在跟业务和下属，历史沟通保留；不能删除自己", () => {
  const s = seed();
  assert.throws(() => deleteUser(s, "user-1", "user-2", "user-1"), /当前/);
  const next = deleteUser(s, "user-2", "user-6", "user-1");
  assert.equal(next.admin!.users[1].status, "deleted");
  assert.equal(
    next.admin!.users.find((u) => u.id === "user-3")?.managerId,
    "user-6",
  );
  assert.ok(!next.leads.some((l) => l.owner === "李金蔓"));
  assert.deepEqual(next.communications, s.communications);
});
test("动态角色 code 唯一不可变，绑定用户后不能删除，内置管理员受保护", () => {
  let s = seed();
  s = saveRole(s, {
    id: "new-role",
    code: "regional_sales",
    name: "区域顾问",
    description: "",
    menus: ["dashboard"],
    grants: {},
    fields: {},
  });
  assert.throws(
    () => saveRole(s, { ...s.admin!.roles.at(-1)!, code: "renamed_code" }),
    /不能修改/,
  );
  s = saveUser(s, { ...s.admin!.users[2], roleId: "new-role" });
  assert.throws(() => deleteRole(s, "new-role"), /用户/);
  assert.throws(() => deleteRole(s, "sys_admin"), /内置/);
  assert.equal(createAccess(s, "user-3").can("projects"), false);
});
test("旧数据增加管理配置而不重置任何业务记录", () => {
  const old = createSeed();
  old.customers[0].notes = "用户已填写";
  const next = migrateAdministration(old);
  assert.equal(next.customers[0].notes, "用户已填写");
  assert.equal(next.customers, old.customers);
  assert.ok(next.admin);
  assert.equal(migrateAdministration(next), next);
});
