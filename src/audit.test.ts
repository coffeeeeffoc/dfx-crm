import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "./seed";
import {
  createAccess,
  deleteUser,
  maskRecord,
  migrateAdministration,
  scopeData,
} from "./access";
import { projectFields } from "./access";
import {
  canCorrectCommunication,
  exportRows,
  filterRecords,
  recordKinds,
  stampChanges,
} from "./records";
import { prepareImportRows } from "./import-data";
import { claimCustomer, convertLead, releaseLead } from "./domain";
import { validateState } from "./storage";
const seed = () => migrateAdministration(createSeed());

test("人员、业务日期、创建更新时间和字段条件按 AND 匹配，包含边界与零值", () => {
  const rows = [
    {
      id: 1,
      owner: "甲",
      createdBy: "乙",
      updatedBy: "丙",
      date: "2026-10-01",
      createdAt: "2026-09-30 23:59:59",
      updatedAt: "2026-10-25 00:00:00",
      amount: 0,
      custom: { extra_code: "AbC" },
    },
    { id: 2, owner: "甲", date: "2026-10-02", amount: 10 },
    { id: 3, owner: "丁", date: "2026-10-01", amount: 0 },
  ];
  assert.deepEqual(
    filterRecords(rows, {
      owner: "甲",
      createdBy: "乙",
      updatedBy: "丙",
      dateField: "date",
      from: "2026-10-01",
      to: "2026-10-01",
      createdFrom: "2026-09-30",
      createdTo: "2026-09-30",
      updatedFrom: "2026-10-25",
      updatedTo: "2026-10-25",
      conditions: [
        { field: "amount", operator: "range", value: "0", end: "0" },
        { field: "extra_code", operator: "contains", value: "bc" },
      ],
    }).map((r) => r.id),
    [1],
  );
  assert.equal(filterRecords(rows, { createdFrom: "2026-10-01" }).length, 0);
  assert.equal(
    filterRecords(rows, {
      dateField: "date",
      from: "2026-10-02",
      to: "2026-10-01",
    }).length,
    0,
  );
  assert.equal(
    filterRecords(rows, {
      conditions: [{ field: "amount", operator: "range", value: "not-number" }],
    }).length,
    0,
  );
});
test("隐藏条件不能通过结果数量推断字段，嵌套条件只使用已遮蔽值", () => {
  const rows = [{ owner: "甲", phone: "secret", createdAt: "2026-10-01" }];
  for (const filters of [
    { owner: "甲" },
    { from: "2026-10-01" },
    {
      conditions: [
        { field: "phone", operator: "contains" as const, value: "secret" },
      ],
    },
  ])
    assert.equal(filterRecords(rows, filters, () => false).length, 0);
});
test("修改仅盖更新戳；新建盖创建戳；旧数据缺失元信息不伪造", () => {
  const before = seed();
  delete before.customers[0].createdBy;
  before.customers[0].createdAt = "";
  before.customers[0].updatedAt = "";
  const after = {
    ...before,
    customers: [
      { ...before.customers[0], notes: "changed" },
      ...before.customers.slice(1),
      { ...before.customers[1], id: "new-customer", createdAt: "" },
    ],
  };
  const next = stampChanges(before, after, "操作者", "2026-10-25 10:30:00");
  assert.equal(next.customers[0].createdBy, "");
  assert.equal(next.customers[0].createdAt, "");
  assert.equal(next.customers[0].updatedBy, "操作者");
  assert.equal(next.customers.at(-1)!.createdBy, "操作者");
  assert.equal(next.customers.at(-1)!.createdAt, "2026-10-25 10:30:00");
  assert.strictEqual(next.customers[1], before.customers[1]);
});
test("三级下属各业务表均受同一范围约束，同部门同角色不扩大", () => {
  const s = seed();
  s.admin!.users.find((u) => u.id === "user-8")!.managerId = "user-3";
  s.admin!.users.find((u) => u.id === "user-5")!.managerId = "user-8";
  const a = createAccess(s, "user-3");
  for (const kind of [
    "quotes",
    "orders",
    "services",
    "daily",
    "expenses",
    "activities",
  ] as const)
    (s as any)[kind] = ["杨工厂", "杨林伟", "李帆", "高原", "樊淼"].map(
      (owner, i) => ({ ...(s[kind][0] || {}), id: `${kind}-${i}`, owner }),
    );
  for (const area of [
    "list",
    "detail",
    "edit",
    "export",
    "statistics",
  ] as const) {
    const view = projectFields(scopeData(s, a), a, area);
    for (const kind of [
      "quotes",
      "orders",
      "services",
      "daily",
      "activities",
    ] as const)
      assert.deepEqual(
        view[kind].map((r) => r.owner),
        ["杨工厂", "杨林伟", "李帆"],
      );
  }
  assert.equal(a.owns("高原"), false);
  assert.equal(a.owns("樊淼"), false);
});
test("无菜单的记录不进入聚合；统计/导出交集不能绕过列表字段", () => {
  const s = seed(),
    role = s.admin!.roles.find((r) => r.code === "sales_manager")!;
  role.fields["projects.list.budget"] = "hidden";
  role.fields["projects.export.budget"] = "write";
  role.fields["projects.statistics.budget"] = "write";
  role.menus = role.menus.filter((m) => m !== "orders");
  const a = createAccess(s, "user-2");
  for (const area of [
    "list",
    "detail",
    "edit",
    "export",
    "statistics",
  ] as const) {
    const v = projectFields(scopeData(s, a), a, area);
    assert.equal(v.orders.length, 0);
    assert.ok(v.projects.every((p) => !Number.isFinite(p.budget)));
  }
  const v = projectFields(scopeData(s, a), a, "export");
  const output = exportRows(
    v.projects,
    s.admin!.fields.projects,
    (k) => a.field("projects", "export", k) !== "hidden",
  );
  assert.ok(!output.headers.includes("预算金额"));
});
test("嵌套联系人和产品、借用金额不出现在列表或导出 JSON", () => {
  const s = seed(),
    r = s.admin!.roles.find((r) => r.code === "sales_manager")!;
  r.fields["customers.list.contacts.phone"] = "hidden";
  r.fields["quotes.export.items.price"] = "hidden";
  const customer = {
    ...s.customers[0],
    contacts: [
      {
        id: "x",
        name: "某人",
        title: "",
        phone: "private-phone",
        email: "",
        relation: "同团队",
      },
    ],
  };
  const a = createAccess(s, "user-2");
  const masked = maskRecord(customer, s.admin!.fields.customers, (k) =>
    a.field("customers", "export", k),
  );
  assert.ok(
    !JSON.stringify(
      exportRows(
        [masked],
        s.admin!.fields.customers,
        (k) => a.field("customers", "export", k) !== "hidden",
      ),
    ).includes("private-phone"),
  );
  const quote = maskRecord(
    {
      ...s.quotes[0],
      items: [{ model: "A", description: "B", quantity: 1, price: 987654321 }],
    },
    s.admin!.fields.quotes,
    (k) => a.field("quotes", "export", k),
  );
  assert.ok(!JSON.stringify(quote).includes("987654321"));
  const inventory = maskRecord(
    { ...s.inventory[0], loans: [{ deposit: 987654321, borrower: "客户" }] },
    s.admin!.fields.inventory,
    (k) => a.field("inventory", "export", k),
  );
  assert.ok(!JSON.stringify(inventory).includes("987654321"));
});
test("沟通导出区域独立，隐藏正文同时隐藏修正历史和补充", () => {
  const s = seed(),
    r = s.admin!.roles.find((r) => r.code === "sales")!;
  r.fields["projects.communication.content"] = "hidden";
  r.fields["projects.communicationExport.content"] = "write";
  s.communications = [
    {
      ...s.communications[0],
      owner: "杨工厂",
      content: "private-original",
      revisions: [
        {
          content: "private-history",
          title: "x",
          owner: "杨工厂",
          date: "2026-10-01",
        },
      ],
      supplements: [
        { content: "private-extra", owner: "杨工厂", date: "2026-10-01" },
      ],
    },
  ];
  const a = createAccess(s, "user-3");
  assert.equal(a.field("projects", "communicationExport", "content"), "hidden");
  assert.ok(
    !JSON.stringify(
      projectFields(scopeData(s, a), a, "export").communications,
    ).includes("private-"),
  );
});
test("旧存档保留自定义配置，新财务字段默认隐藏，新数组不覆盖旧业务", () => {
  const old = seed();
  delete (old as any).activities;
  delete (old as any).resources;
  old.admin!.fields.orders = old.admin!.fields.orders.filter(
    (f) => f.key !== "extra_hkStorage",
  );
  const role = old.admin!.roles.find((r) => r.code === "sales")!;
  delete role.fields["orders.list.extra_hkStorage"];
  role.fields["projects.detail.budget"] = "read";
  const next = migrateAdministration(old);
  assert.equal(validateState(next), true);
  assert.deepEqual(next.activities, []);
  assert.equal(next.projects.length, old.projects.length);
  assert.equal(
    createAccess(next, "user-3").field("orders", "export", "extra_hkStorage"),
    "hidden",
  );
  assert.equal(
    next.admin!.roles.find((r) => r.id === role.id)!.fields[
      "projects.detail.budget"
    ],
    "read",
  );
  assert.strictEqual(migrateAdministration(next), next);
});
test("无机会线索直接进公共池并领取，保留同客户其他私有项目", () => {
  let s = seed();
  const l = {
    ...s.leads[0],
    id: "no-opportunity",
    projectId: undefined,
    owner: "杨工厂",
  };
  s.leads = [l, ...s.leads];
  s.projects = [
    {
      ...s.projects[0],
      customerId: l.customerId,
      owner: "高原",
      status: "跟进中",
    },
  ];
  const count = s.projects.length;
  assert.throws(() => releaseLead(s, l.id, "", true));
  s = releaseLead(s, l.id, "暂时没有需求", true);
  assert.equal(s.projects.length, count);
  assert.equal(s.leads[0].owner, "公共池");
  assert.throws(() => convertLead(s, l.id));
  s = claimCustomer(s, l.customerId, "李帆");
  assert.equal(s.leads[0].owner, "李帆");
  assert.equal(s.projects[0].owner, "高原");
});
test("线索导入支持新客户，重复行跳过，不可写字段和私有客户阻止导入", () => {
  const s = seed(),
    a = createAccess(s, "user-1"),
    mapping = { name: 0, customerName: 1, company: 2, phone: 3 };
  const values = ["审计导入线索", "客户A", "演示导入研究所", "13800138000"];
  const result = prepareImportRows(s, a, "leads", [values, values], mapping);
  assert.equal(result.validCount, 1);
  assert.equal(result.customers.length, 1);
  assert.equal(result.leads.length, 1);
  const manager = s.admin!.roles.find((r) => r.code === "sales_manager")!;
  manager.fields["leads.edit.phone"] = "read";
  assert.equal(
    prepareImportRows(s, createAccess(s, "user-2"), "leads", [values], mapping)
      .validCount,
    0,
  );
  const other = s.customers.find((c) => c.owner === "樊淼" && !c.pool)!;
  assert.ok(other);
  {
    const blocked = prepareImportRows(
      s,
      createAccess(s, "user-2"),
      "leads",
      [["不同线索", other.name, other.company, ""]],
      mapping,
    );
    assert.equal(blocked.validCount, 0);
    assert.match(blocked.checked[0].error, /无关联权限/);
  }
});
test("沟通修正窗口包含截止时刻，未来或缺时间拒绝；管理员保留修正权", () => {
  const start = Date.parse("2026-10-25T10:00:00+08:00");
  assert.equal(
    canCorrectCommunication("2026-10-25 10:00:00", 15, start + 900000),
    true,
  );
  assert.equal(
    canCorrectCommunication("2026-10-25 10:00:00", 15, start + 900001),
    false,
  );
  assert.equal(canCorrectCommunication("2026-10-25", 15, start), false);
  assert.equal(
    canCorrectCommunication("2026-10-25 10:00:00", 15, start - 1),
    false,
  );
  assert.equal(canCorrectCommunication(undefined, 15, start, true), true);
});
test("删除用户同时移交新增台账及库存资料，不改原始创建人", () => {
  const s = seed();
  s.activities = [
    {
      id: "a",
      name: "活动",
      owner: "杨工厂",
      date: "2026-10-25",
      category: "市场",
      content: "",
      result: "",
      attachments: [],
      createdBy: "杨工厂",
    },
  ];
  const next = deleteUser(s, "user-3", "user-2", "user-1");
  assert.equal(next.activities[0].owner, "李金蔓");
  assert.equal(next.activities[0].createdBy, "杨工厂");
});

test("共享库存只暴露占用量，其他团队借用联系人和协议不进入任何视图", () => {
  const s = seed();
  s.inventory[0].loans = [
    {
      id: "private-loan",
      owner: "高原",
      borrower: "private-contact",
      quantity: 2,
      date: "2026-10-25",
      dueDate: "2026-11-01",
      returnedAt: "",
      purpose: "private-purpose",
      agreement: "private-agreement",
    },
  ];
  const view = scopeData(s, createAccess(s, "user-3"));
  assert.equal(view.inventory[0].loans[0].quantity, 2);
  assert.ok(!JSON.stringify(view.inventory[0]).includes("private-contact"));
  assert.ok(!JSON.stringify(view.inventory[0]).includes("private-agreement"));
  assert.equal(
    scopeData(s, createAccess(s, "user-6")).inventory[0].loans[0].borrower,
    "private-contact",
  );
});
test("嵌套业务日期与数字区间支持匹配子记录，隐藏字段仍优先拒绝", () => {
  const rows = [
    {
      loans: [
        { date: "2026-10-25", amount: 10 },
        { date: "2026-09-01", amount: 20 },
      ],
    },
  ];
  assert.equal(
    filterRecords(rows, {
      dateField: "loans.date",
      from: "2026-10-25",
      to: "2026-10-25",
    }).length,
    1,
  );
  assert.equal(
    filterRecords(rows, {
      conditions: [
        { field: "loans.amount", operator: "range", value: "11", end: "19" },
      ],
    }).length,
    0,
  );
});

test("个人标签仅当前身份可筛选与导出，不携带他人标签", () => {
  const s = seed();
  s.customers[0] = {
    ...s.customers[0],
    owner: "杨工厂",
    personalTags: { 杨工厂: ["我的重点"], 高原: ["他人秘密标签"] },
  };
  const a = createAccess(s, "user-3");
  const view = projectFields(scopeData(s, a), a, "list");
  assert.equal(
    filterRecords(view.customers, {
      conditions: [
        { field: "myTags", operator: "contains", value: "我的重点" },
      ],
    }).length,
    1,
  );
  assert.ok(!JSON.stringify(view.customers).includes("他人秘密标签"));
  s.admin!.roles.find((r) => r.code === "sales")!.fields[
    "customers.list.myTags"
  ] = "hidden";
  const hidden = projectFields(
    scopeData(s, createAccess(s, "user-3")),
    createAccess(s, "user-3"),
    "export",
  );
  assert.ok(!JSON.stringify(hidden.customers).includes("我的重点"));
});
test("字段注册无重复，借用子字段和元信息遵循区域只读与隐藏配置", () => {
  const s = seed();
  for (const defs of Object.values(s.admin!.fields))
    assert.equal(new Set(defs.map((f) => f.key)).size, defs.length);
  const role = s.admin!.roles.find((r) => r.code === "sales_manager")!;
  role.fields["inventory.borrow.loans.purpose"] = "read";
  role.fields["inventory.return.loans.returnedAt"] = "hidden";
  const a = createAccess(s, "user-2");
  assert.equal(a.field("inventory", "borrow", "loans.purpose"), "read");
  assert.equal(a.field("inventory", "return", "loans.returnedAt"), "hidden");
  for (const key of ["createdBy", "createdAt", "updatedBy", "updatedAt"])
    assert.equal(a.field("projects", "edit", key), "read");
});
