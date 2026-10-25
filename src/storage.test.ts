import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "./seed";
import { migrateAdministration, saveUser, createAccess } from "./access";
import { validateState } from "./storage";

test("旧存档和完整管理配置可读取，损坏配置拒绝载入", () => {
  const old = createSeed();
  assert.equal(validateState(old), true);
  const state = migrateAdministration(old);
  assert.equal(validateState(state), true);
  for (const admin of [
    null,
    {},
    { ...state.admin, users: null },
    { ...state.admin, fields: { projects: "invalid" } },
  ]) {
    assert.equal(validateState({ ...state, admin }), false);
  }
  assert.equal(
    validateState({ ...state, dictionaries: { brands: [] } }),
    false,
  );
});

test("新增用户绑定角色和领导后立即获得自身范围，不继承领导的其他下属", () => {
  const s = migrateAdministration(createSeed());
  const next = saveUser(s, {
    id: "new-user",
    username: "new_sales",
    name: "新增顾问",
    roleId: "sales",
    managerId: "user-2",
    department: "销售",
    email: "",
    status: "active",
  });
  assert.equal(next.admin!.users.length, s.admin!.users.length + 1);
  assert.equal(createAccess(next, "new-user").owns("新增顾问"), true);
  assert.equal(createAccess(next, "new-user").owns("杨工厂"), false);
  assert.equal(createAccess(next, "user-2").owns("新增顾问"), true);
});
