import { inRange } from "@dfx-crm/core/records";
import { useState } from "react";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tree,
  Upload,
} from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { useCRM } from "../context";
import { PageHeading, Section } from "../components";
import {
  actionsFor,
  fieldKind,
  areaNames,
  areasFor,
  actionNames,
  deleteRole,
  deleteUser,
  descendants,
  pageNames,
  saveRole,
  saveUser,
} from "@dfx-crm/core/access";
import type {
  AreaId,
  FieldDefinition,
  FieldMode,
  RoleDefinition,
  UserAccount,
} from "@dfx-crm/core/access";
import type { Page } from "@dfx-crm/core/domain";
import { today, uid } from "@dfx-crm/core/domain";
import { download } from "../storage";

export default function AdministrationPage() {
  const { rawState: state, access, change, mobile } = useCRM();
  const config = state.admin!;
  const { message, modal } = App.useApp();
  const [user, setUser] = useState<UserAccount>();
  const [role, setRole] = useState<RoleDefinition>();
  const [field, setField] = useState<FieldDefinition>();
  const [selectedPage, setSelectedPage] = useState<Page>("projects");
  const [selectedArea, setSelectedArea] = useState<AreaId>("list");
  const [fieldPage, setFieldPage] = useState("projects");
  const [tab, setTab] = useState("company");
  const [company, setCompany] = useState(config.company);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditOwner, setAuditOwner] = useState<string>();
  const [auditRange, setAuditRange] = useState(["", ""]);
  const [userSearch, setUserSearch] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [dictionary, setDictionary] = useState<
    "brands" | "applications" | "categories"
  >("brands");
  const [dictionaryEntry, setDictionaryEntry] = useState("");
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [fieldForm] = Form.useForm();
  if (!access.isAdmin)
    return (
      <Alert
        type="warning"
        title="系统配置仅系统管理员可管理，请在演示身份中切换管理员。"
      />
    );
  const userOptions = config.users
    .filter((u) => u.status === "active")
    .map((u) => ({ value: u.id, label: `${u.name} · ${u.department}` }));
  const openUser = (u?: UserAccount) => {
    const next = u || {
      id: uid("USER"),
      name: "",
      username: "",
      roleId: "sales",
      managerId: access.user!.id,
      department: "销售团队",
      email: "",
      status: "active" as const,
    };
    setUser(next);
    userForm.setFieldsValue(next);
  };
  const openRole = (r?: RoleDefinition, copy = false) => {
    const next = r
      ? structuredClone(r)
      : {
          id: uid("ROLE"),
          name: "",
          code: "",
          description: "",
          menus: ["dashboard"] as Page[],
          grants: {},
          fields: {},
        };
    if (copy) {
      next.id = uid("ROLE");
      next.code = "";
      next.name = `${next.name}（副本）`;
      next.builtin = false;
    }
    setRole(next);
    roleForm.setFieldsValue(next);
  };
  const removeUser = (u: UserAccount) => {
    let successor = "";
    modal.confirm({
      title: `删除用户「${u.name}」`,
      content: (
        <Space orientation="vertical" style={{ width: "100%" }}>
          <p>
            用户将移入已删除，不能继续切换登录。现有业务和直属下属交给承接人；历史沟通及日志保留原作者。
          </p>
          <Select
            style={{ width: "100%" }}
            aria-label="业务承接人"
            placeholder="选择业务与下属的承接人"
            options={userOptions.filter(
              (x) => !descendants(config.users, u.id).has(x.value),
            )}
            onChange={(set) => (successor = set)}
          />
        </Space>
      ),
      okText: "删除并交接",
      onOk: () => {
        if (
          !change(
            "删除用户并交接",
            u.name,
            (s) => deleteUser(s, u.id, successor, access.user!.id),
            true,
          )
        )
          return Promise.reject();
      },
    });
  };
  const treeNodes = (managerId: string): any[] =>
    config.users
      .filter((u) => u.status !== "deleted" && u.managerId === managerId)
      .map((u) => ({
        key: u.id,
        title: (
          <span>
            {u.name}{" "}
            <small className="muted">
              {u.department} ·{" "}
              {config.roles.find((r) => r.id === u.roleId)?.name}
              {u.status === "disabled" ? " · 已停用" : ""}
            </small>
          </span>
        ),
        children: treeNodes(u.id),
      }));
  const publishField = (next: FieldDefinition) =>
    change(
      "维护字段",
      `${pageNames[fieldPage as Page] || "沟通记录"} · ${next.label}`,
      (s) => ({
        ...s,
        admin: {
          ...s.admin!,
          fields: {
            ...s.admin!.fields,
            [fieldPage]: (s.admin!.fields[fieldPage] || []).some(
              (f) => f.key === next.key,
            )
              ? s.admin!.fields[fieldPage].map((f) =>
                  f.key === next.key ? next : f,
                )
              : [...(s.admin!.fields[fieldPage] || []), next],
          },
        },
      }),
      true,
    );
  const selectedFields =
    config.fields[fieldKind(selectedPage, selectedArea)] || [];
  const updateGrant = (key: string, value: boolean) =>
    setRole((r) => r && { ...r, grants: { ...r.grants, [key]: value } });
  const updateMode = (key: string, value: FieldMode) =>
    setRole((r) => r && { ...r, fields: { ...r.fields, [key]: value } });
  return (
    <>
      <PageHeading
        title="系统管理"
        description="企业品牌、组织关系与权限，在同一处配置。"
      />
      <Alert
        showIcon
        type="info"
        title="前端原型：配置会立即影响页面并保存在本机。正式上线时，服务端须按相同规则验证权限与企业数据隔离。"
        style={{ marginBottom: 20 }}
      />
      <Section>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            {
              key: "company",
              label: "企业配置",
              children: (
                <div className="admin-content">
                  <div className="brand-preview">
                    {company.logo ? (
                      <img src={company.logo} alt="企业 Logo 预览" />
                    ) : (
                      <span>✦</span>
                    )}
                    <div>
                      <h2>{company.shortName}</h2>
                      <p>{company.name}</p>
                      <small>{company.tagline}</small>
                    </div>
                  </div>
                  <Form
                    layout="vertical"
                    onFinish={() => {
                      if (!company.name.trim() || !company.shortName.trim())
                        return message.error("企业名称和显示名称不能为空");
                      if (
                        change(
                          "配置企业品牌",
                          company.name,
                          (s) => ({ ...s, admin: { ...s.admin!, company } }),
                          true,
                        )
                      )
                        message.success("企业品牌已更新");
                    }}
                  >
                    <div className="form-grid">
                      <Form.Item label="企业名称" required>
                        <Input
                          maxLength={80}
                          aria-label="企业名称"
                          value={company.name}
                          onChange={(e) =>
                            setCompany({ ...company, name: e.target.value })
                          }
                        />
                      </Form.Item>
                      <Form.Item label="系统显示名称" required>
                        <Input
                          maxLength={30}
                          aria-label="系统显示名称"
                          value={company.shortName}
                          onChange={(e) =>
                            setCompany({
                              ...company,
                              shortName: e.target.value,
                            })
                          }
                        />
                      </Form.Item>
                      <Form.Item label="品牌标语" className="span-2">
                        <Input
                          maxLength={100}
                          aria-label="品牌标语"
                          value={company.tagline}
                          onChange={(e) =>
                            setCompany({ ...company, tagline: e.target.value })
                          }
                        />
                      </Form.Item>
                      <Form.Item label="企业 Logo" className="span-2">
                        <Space>
                          <Upload
                            accept=".png,.jpg,.jpeg,.webp"
                            showUploadList={false}
                            beforeUpload={async (file) => {
                              if (
                                ![
                                  "image/png",
                                  "image/jpeg",
                                  "image/webp",
                                ].includes(file.type) ||
                                file.size > 1024 * 1024
                              ) {
                                message.error(
                                  "请使用 1MB 内的 PNG、JPG 或 WebP 图片",
                                );
                                return false;
                              }
                              const reader = new FileReader();
                              reader.onerror = () =>
                                message.error("图片读取失败");
                              reader.onload = () =>
                                setCompany((c) => ({
                                  ...c,
                                  logo: String(reader.result),
                                }));
                              reader.readAsDataURL(file);
                              return false;
                            }}
                          >
                            <Button icon={<UploadOutlined />}>选择 Logo</Button>
                          </Upload>
                          <Button
                            onClick={() => setCompany({ ...company, logo: "" })}
                          >
                            恢复默认图标
                          </Button>
                        </Space>
                        <p className="muted">
                          支持 PNG / JPG / WebP，最大 1MB；仅保存在当前浏览器。
                        </p>
                      </Form.Item>
                    </div>
                    <Button type="primary" htmlType="submit">
                      保存企业配置
                    </Button>
                    <div className="setting-inline">
                      <label>沟通记录允许修正时间（分钟）</label>
                      <InputNumber
                        aria-label="沟通修正分钟数"
                        min={0}
                        max={1440}
                        value={config.communicationEditMinutes ?? 15}
                        onChange={(value) => {
                          if (value !== null)
                            change("调整沟通修正窗口", String(value), (s) => ({
                              ...s,
                              admin: {
                                ...s.admin!,
                                communicationEditMinutes: value,
                              },
                            }));
                        }}
                      />
                      <small className="muted">
                        超时仅能补充说明；管理员修正仍保留原文。
                      </small>
                    </div>
                  </Form>
                </div>
              ),
            },
            {
              key: "users",
              label: "用户管理",
              children: (
                <div className="admin-content">
                  <div className="admin-toolbar">
                    <Space>
                      <Tag>
                        启用{" "}
                        {
                          config.users.filter((u) => u.status === "active")
                            .length
                        }{" "}
                        人
                      </Tag>
                      <Checkbox
                        checked={includeDeleted}
                        onChange={(e) => setIncludeDeleted(e.target.checked)}
                      >
                        显示已删除
                      </Checkbox>
                    </Space>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => openUser()}
                    >
                      新增用户
                    </Button>
                  </div>
                  <Input.Search
                    aria-label="搜索用户组织角色"
                    placeholder="搜索姓名、账号、部门、领导或角色"
                    allowClear
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <Table
                    rowKey="id"
                    dataSource={config.users.filter(
                      (u) =>
                        (includeDeleted || u.status !== "deleted") &&
                        `${u.name} ${u.username} ${u.department} ${config.roles.find((r) => r.id === u.roleId)?.name} ${config.users.find((x) => x.id === u.managerId)?.name}`
                          .toLowerCase()
                          .includes(userSearch.toLowerCase()),
                    )}
                    scroll={{ x: 900 }}
                    columns={[
                      {
                        title: "姓名 / 账号",
                        render: (_, u) => (
                          <div>
                            {u.name}
                            <small className="subline">{u.username}</small>
                          </div>
                        ),
                      },
                      { title: "部门", dataIndex: "department" },
                      {
                        title: "角色",
                        render: (_, u) =>
                          config.roles.find((r) => r.id === u.roleId)?.name,
                      },
                      {
                        title: "直属领导",
                        render: (_, u) =>
                          config.users.find((x) => x.id === u.managerId)
                            ?.name || "无（最高层级）",
                      },
                      {
                        title: "全部下属",
                        render: (_, u) =>
                          descendants(config.users, u.id).size - 1,
                      },
                      {
                        title: "状态",
                        render: (_, u) => (
                          <Tag
                            color={
                              u.status === "active"
                                ? "green"
                                : u.status === "deleted"
                                  ? "red"
                                  : "default"
                            }
                          >
                            {u.status === "active"
                              ? "启用"
                              : u.status === "deleted"
                                ? "已删除"
                                : "停用"}
                          </Tag>
                        ),
                      },
                      {
                        title: "操作",
                        render: (_, u) => (
                          <Space>
                            <Button size="small" onClick={() => openUser(u)}>
                              {u.status === "deleted" ? "恢复 / 编辑" : "编辑"}
                            </Button>
                            <Button
                              size="small"
                              danger
                              disabled={
                                u.id === access.user?.id ||
                                u.status === "deleted"
                              }
                              onClick={() => removeUser(u)}
                            >
                              删除
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                  />
                  <p className="panel-footnote">
                    业务数据范围按本人及所有层级下属递归计算，与角色名称无关；同部门不自动共享。停用用户的历史业务仍在领导范围内。姓名保持唯一，改名会同步业务归属。
                  </p>
                </div>
              ),
            },
            {
              key: "organization",
              label: "组织架构",
              children: (
                <div className="admin-content">
                  <h3>领导关系与数据范围</h3>
                  <p className="muted">
                    角色决定能做什么，领导关系决定能看到谁的数据。调整用户的直属领导后，范围立即重新计算。
                  </p>
                  <Tree
                    defaultExpandAll
                    key={JSON.stringify(
                      config.users.map((u) => [
                        u.id,
                        u.managerId,
                        u.name,
                        u.status,
                      ]),
                    )}
                    treeData={treeNodes("")}
                  />
                  <Alert
                    style={{ marginTop: 24 }}
                    type="info"
                    title="每人一个直属领导；禁止自己领导自己、选择下属为领导或形成环。部门用于组织展示，不能代替领导关系。"
                  />
                </div>
              ),
            },
            {
              key: "roles",
              label: "角色与权限",
              children: (
                <div className="admin-content">
                  <div className="admin-toolbar">
                    <div>
                      <h3>内置角色 + 自定义角色</h3>
                      <p className="muted">
                        code
                        唯一且不可修改，名称和权限可调整。新增角色默认仅能打开工作台，其余权限逐项授权。
                      </p>
                    </div>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => openRole()}
                    >
                      新增角色
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    scroll={{ x: 740 }}
                    dataSource={config.roles}
                    pagination={false}
                    columns={[
                      {
                        title: "角色",
                        render: (_, r) => (
                          <div>
                            {r.name} {r.builtin && <Tag>内置</Tag>}
                            <small className="subline">{r.code}</small>
                          </div>
                        ),
                      },
                      {
                        title: "启用 / 停用用户",
                        render: (_, r) =>
                          config.users.filter(
                            (u) => u.roleId === r.id && u.status !== "deleted",
                          ).length,
                      },
                      {
                        title: "菜单权限",
                        render: (_, r) =>
                          r.code === "sys_admin"
                            ? "全部菜单"
                            : `${r.menus.length} 个菜单`,
                      },
                      {
                        title: "操作",
                        render: (_, r) => (
                          <Space wrap>
                            <Button onClick={() => openRole(r)}>
                              配置权限
                            </Button>
                            <Button onClick={() => openRole(r, true)}>
                              复制新增
                            </Button>
                            <Popconfirm
                              title="删除此角色？绑定用户需先改用其他角色。"
                              onConfirm={() =>
                                change(
                                  "删除角色",
                                  r.name,
                                  (s) => deleteRole(s, r.id),
                                  true,
                                )
                              }
                            >
                              <Button danger disabled={r.builtin}>
                                删除
                              </Button>
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: "fields",
              label: "页面字段",
              children: (
                <div className="admin-content">
                  <div className="admin-toolbar">
                    <Select
                      aria-label="字段所属模块"
                      value={fieldPage}
                      onChange={setFieldPage}
                      options={Object.keys(config.fields).map((value) => ({
                        value,
                        label:
                          value === "expenses"
                            ? "费用与成本"
                            : pageNames[value as Page] || "沟通记录",
                      }))}
                    />
                    <Button
                      type="primary"
                      onClick={() => {
                        const f: FieldDefinition = {
                          key: `custom_${uid().slice(2).toLowerCase()}`,
                          label: "",
                          type: "text",
                          enabled: true,
                        };
                        setField(f);
                        fieldForm.setFieldsValue(f);
                      }}
                    >
                      新增字段
                    </Button>
                  </div>
                  <Alert
                    type="info"
                    title="字段停用后从页面、表单和导出中隐藏，历史值保留，恢复后可继续使用。身份、关联及归属等必要系统字段不能删除。"
                    style={{ marginBottom: 16 }}
                  />
                  <Table
                    rowKey="key"
                    scroll={{ x: 720 }}
                    dataSource={config.fields[fieldPage]}
                    pagination={{ pageSize: 10 }}
                    columns={[
                      { title: "字段名称", dataIndex: "label" },
                      { title: "稳定标识", dataIndex: "key" },
                      {
                        title: "来源",
                        render: (_, f) =>
                          f.system ? "系统字段" : "自定义字段",
                      },
                      {
                        title: "状态",
                        render: (_, f) => (
                          <Tag color={f.enabled ? "green" : "default"}>
                            {f.enabled ? "启用" : "已停用"}
                          </Tag>
                        ),
                      },
                      {
                        title: "操作",
                        render: (_, f) => (
                          <Space>
                            <Button
                              size="small"
                              onClick={() => {
                                setField(f);
                                fieldForm.setFieldsValue(f);
                              }}
                            >
                              修改
                            </Button>
                            <Popconfirm
                              title={
                                f.enabled
                                  ? "停用此字段？历史数据保留，可恢复。"
                                  : "恢复此字段？"
                              }
                              onConfirm={() =>
                                publishField({ ...f, enabled: !f.enabled })
                              }
                            >
                              <Button
                                size="small"
                                danger={f.enabled}
                                disabled={f.required}
                              >
                                {f.enabled ? "停用 / 删除" : "恢复"}
                              </Button>
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: "dictionary",
              label: "基础字典",
              children: (
                <div className="admin-content">
                  <Space wrap>
                    <Select
                      value={dictionary}
                      onChange={setDictionary}
                      options={[
                        { value: "brands", label: "品牌" },
                        { value: "applications", label: "应用类别" },
                        { value: "categories", label: "客户类别" },
                      ]}
                    />
                    <Input
                      placeholder="新增字典项"
                      value={dictionaryEntry}
                      onChange={(e) => setDictionaryEntry(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        const value = dictionaryEntry.trim();
                        if (!value) return;
                        if (state.dictionaries[dictionary].includes(value))
                          return message.warning("该值已存在");
                        if (
                          change("新增字典", value, (s) => ({
                            ...s,
                            dictionaries: {
                              ...s.dictionaries,
                              [dictionary]: [
                                ...s.dictionaries[dictionary],
                                value,
                              ],
                            },
                          }))
                        )
                          setDictionaryEntry("");
                      }}
                    >
                      新增
                    </Button>
                  </Space>
                  <div className="dictionary-tags">
                    {state.dictionaries[dictionary].map((v) => (
                      <Tag key={v}>{v}</Tag>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: "audit",
              label: "操作日志",
              children: (
                <>
                  <Space wrap className="admin-toolbar">
                    <Input.Search
                      aria-label="操作日志关键字"
                      placeholder="操作或对象关键字"
                      allowClear
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                    />
                    <Select
                      aria-label="日志操作人"
                      allowClear
                      placeholder="全部操作人"
                      value={auditOwner}
                      onChange={setAuditOwner}
                      options={[
                        ...new Set(state.audit.map((r) => r.owner)),
                      ].map((value) => ({ value, label: value }))}
                    />
                    <Input
                      type="date"
                      aria-label="日志开始时间"
                      value={auditRange[0]}
                      onChange={(e) =>
                        setAuditRange([e.target.value, auditRange[1]])
                      }
                    />
                    <Input
                      type="date"
                      aria-label="日志结束时间"
                      value={auditRange[1]}
                      onChange={(e) =>
                        setAuditRange([auditRange[0], e.target.value])
                      }
                    />
                  </Space>
                  <Table
                    rowKey="id"
                    scroll={{ x: 800 }}
                    dataSource={state.audit.filter(
                      (r) =>
                        (!auditOwner || r.owner === auditOwner) &&
                        inRange(r.date, auditRange[0], auditRange[1]) &&
                        `${r.action} ${r.target}`
                          .toLowerCase()
                          .includes(auditSearch.toLowerCase()),
                    )}
                    pagination={{ pageSize: 10 }}
                    columns={[
                      { title: "时间", dataIndex: "date" },
                      { title: "操作人", dataIndex: "owner" },
                      { title: "操作", dataIndex: "action" },
                      { title: "对象", dataIndex: "target" },
                      {
                        title: "敏感操作",
                        render: (_, r) =>
                          r.sensitive ? <Tag color="red">是</Tag> : "—",
                      },
                    ]}
                  />
                </>
              ),
            },
            {
              key: "data",
              label: "本机数据",
              children: (
                <div className="admin-content">
                  <h3>导出配置与业务数据</h3>
                  <p>
                    包括企业配置、用户、角色、字段定义和业务记录；附件文件不在
                    JSON 中。不同地址、不同设备的本地数据相互独立。
                  </p>
                  <Button
                    onClick={() => {
                      download(
                        new Blob([JSON.stringify(state, null, 2)], {
                          type: "application/json",
                        }),
                        `CRM-备份-${today()}.json`,
                      );
                      change(
                        "导出备份",
                        "全部业务与配置",
                        (s) => ({ ...s }),
                        true,
                      );
                    }}
                  >
                    导出 JSON 备份
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Section>
      <Modal
        open={!!user}
        title={
          config.users.some((u) => u.id === user?.id) ? "编辑用户" : "新增用户"
        }
        onCancel={() => setUser(undefined)}
        onOk={() => userForm.submit()}
        destroyOnHidden
      >
        <Form
          form={userForm}
          layout="vertical"
          onFinish={(values) => {
            if (
              change(
                "维护用户",
                values.name,
                (s) => saveUser(s, { ...user!, ...values }),
                true,
              )
            ) {
              setUser(undefined);
              message.success("用户及组织关系已保存");
            }
          }}
        >
          <Form.Item
            name="username"
            label="账号"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input disabled={config.users.some((u) => u.id === user?.id)} />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="roleId" label="角色" rules={[{ required: true }]}>
            <Select
              options={config.roles.map((r) => ({
                value: r.id,
                label: `${r.name} · ${r.code}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="department"
            label="所属部门"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="managerId" label="直属领导">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={userOptions.filter(
                (u) => user && !descendants(config.users, user.id).has(u.value),
              )}
            />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="账号状态">
            <Select
              options={[
                { value: "active", label: "启用" },
                { value: "disabled", label: "停用" },
              ]}
            />
          </Form.Item>
          <p className="muted">
            当前原型不设置真实密码；后端接入时另行实现账号登录。
          </p>
        </Form>
      </Modal>
      <Modal
        open={!!role}
        title={`角色权限 · ${role?.name || "新增角色"}`}
        width={1050}
        onCancel={() => setRole(undefined)}
        footer={
          <Space>
            <Button onClick={() => setRole(undefined)}>取消</Button>
            <Button
              type="primary"
              disabled={role?.code === "sys_admin" && role?.builtin}
              onClick={() => roleForm.submit()}
            >
              保存角色与权限
            </Button>
          </Space>
        }
        destroyOnHidden
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={(values) => {
            if (
              change(
                "维护角色与权限",
                values.name,
                (s) => saveRole(s, { ...role!, ...values }),
                true,
              )
            ) {
              setRole(undefined);
              message.success("权限已保存，切换用户即可验证");
            }
          }}
        >
          <div className="form-grid">
            <Form.Item
              name="name"
              label="角色名称"
              rules={[{ required: true, whitespace: true }]}
            >
              <Input disabled={role?.code === "sys_admin"} />
            </Form.Item>
            <Form.Item
              name="code"
              label="角色 code"
              rules={[
                {
                  required: true,
                  pattern: /^[a-z][a-z0-9_]{1,47}$/,
                  message: "2–48 位小写字母、数字、下划线，以字母开头",
                },
              ]}
            >
              <Input
                disabled={config.roles.some((r) => r.id === role?.id)}
                placeholder="例如 regional_sales"
              />
            </Form.Item>
          </div>
        </Form>
        {role?.code === "sys_admin" && role.builtin ? (
          <Alert
            title="内置系统管理员具有完整配置权限和全企业数据范围；保留此角色作为恢复入口，不能删除或收回权限。"
            type="info"
          />
        ) : (
          role && (
            <>
              <h4>可进入菜单</h4>
              <Checkbox.Group
                value={role.menus}
                options={(Object.entries(pageNames) as [Page, string][])
                  .filter(([p]) => p !== "settings")
                  .map(([value, label]) => ({ value, label }))}
                onChange={(values) =>
                  setRole({ ...role, menus: values as Page[] })
                }
                className="menu-grants"
              />
              <div className="permission-toolbar">
                <Select
                  aria-label="权限所属菜单"
                  value={selectedPage}
                  onChange={(p) => {
                    setSelectedPage(p);
                    setSelectedArea("list");
                  }}
                  options={(Object.entries(pageNames) as [Page, string][])
                    .filter(([p]) => p !== "settings")
                    .map(([value, label]) => ({ value, label }))}
                />
                <Select
                  aria-label="权限所属区域"
                  value={selectedArea}
                  onChange={setSelectedArea}
                  options={areasFor(selectedPage).map((value) => ({
                    value,
                    label: areaNames[value],
                  }))}
                />
                <Tag color="blue">数据范围：本人及全部层级下属</Tag>
              </div>
              <div className="permission-actions">
                {actionsFor(selectedPage).map((action) => {
                  const key = `${selectedPage}.${selectedArea}.${action}`;
                  return (
                    <label key={action}>
                      <Switch
                        size="small"
                        checked={
                          role.grants[key] ??
                          role.grants[`${selectedPage}.list.${action}`] ??
                          action === "view"
                        }
                        onChange={(value) => updateGrant(key, value)}
                      />
                      {actionNames[action]}
                    </label>
                  );
                })}
              </div>
              <p className="muted">
                本区域未单独配置的按钮沿用列表页面设置。字段权限独立配置；只读字段不能保存修改。数据范围与按钮、字段权限同时生效。
              </p>
              <Table
                size="small"
                rowKey="key"
                pagination={{ pageSize: 8 }}
                scroll={{ x: 520 }}
                dataSource={selectedFields.filter((f) => f.enabled)}
                columns={[
                  { title: "字段", dataIndex: "label" },
                  {
                    title: "完整权限路径",
                    render: (_, f) => (
                      <code>
                        {selectedPage}.{selectedArea}.{f.key}
                      </code>
                    ),
                  },
                  {
                    title: "权限",
                    width: 210,
                    render: (_, f) => (
                      <Select<string>
                        aria-label={`${f.label}权限`}
                        value={
                          role.fields[
                            `${selectedPage}.${selectedArea}.${f.key}`
                          ] ?? "inherit"
                        }
                        onChange={(value) => {
                          if (value === "inherit") {
                            const fields = { ...role.fields };
                            delete fields[
                              `${selectedPage}.${selectedArea}.${f.key}`
                            ];
                            setRole({ ...role, fields });
                          } else
                            updateMode(
                              `${selectedPage}.${selectedArea}.${f.key}`,
                              value as FieldMode,
                            );
                        }}
                        options={[
                          { value: "inherit", label: "默认（随操作权限）" },
                          { value: "hidden", label: "不可见" },
                          { value: "read", label: "只读" },
                          { value: "write", label: "可编辑" },
                        ]}
                        style={{ width: "100%" }}
                      />
                    ),
                  },
                ]}
              />
            </>
          )
        )}
      </Modal>
      <Modal
        open={!!field}
        title={field?.system ? "修改系统字段" : "自定义字段"}
        onCancel={() => setField(undefined)}
        onOk={() => fieldForm.submit()}
        destroyOnHidden
      >
        <Form
          form={fieldForm}
          layout="vertical"
          onFinish={(values) => {
            const next = {
              ...field!,
              ...values,
              options:
                typeof values.options === "string"
                  ? values.options
                      .split("\n")
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                  : field?.options,
            };
            if (next.type === "select" && !next.options?.length)
              return message.error("请选择至少一个选项");
            if (publishField(next)) setField(undefined);
          }}
        >
          <Form.Item
            name="label"
            label="字段名称"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="type" label="字段类型">
            <Select
              disabled={
                field?.system ||
                config.fields[fieldPage].some((f) => f.key === field?.key)
              }
              options={[
                { value: "text", label: "文本" },
                { value: "number", label: "数字" },
                { value: "date", label: "日期" },
                { value: "select", label: "单选" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="options"
            label="单选选项（每行一个，仅单选字段使用）"
            getValueProps={(v) => ({
              value: Array.isArray(v) ? v.join("\n") : v,
            })}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <p className="muted">
            稳定标识：{field?.key}
            。已有字段的类型不修改，避免历史数据类型冲突。新增字段默认非必填。
          </p>
        </Form>
      </Modal>
    </>
  );
}
