import { createAccess, migrateAdministration, scopeData } from "@dfx-crm/core/access";
import { PermissionArea, projectFields } from "./permission-ui";
import { Section } from "./components";
import AdministrationPage from "./pages/Administration";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  App as AntApp,
  Badge,
  Button,
  Dropdown,
  Grid,
  Select,
  Tooltip,
  Modal,
} from "antd";
import { Popup, TabBar } from "antd-mobile";
import {
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CloudOutlined,
  ContactsOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  MenuOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { EntityKind, Page, Role, State } from "@dfx-crm/core/domain";
import { now, owners, uid, today } from "@dfx-crm/core/domain";
import { createSeed } from "@dfx-crm/mock-data";
import { storageKey, validateState } from "./storage";
import { Context } from "./context";
import Dashboard from "./pages/Dashboard";
import { Customers, Leads, Projects } from "./pages/Sales";
import { Business } from "./pages/Business";
import {
  DailyPage,
  KnowledgePage,
  ReportsPage,
  SuppliersPage,
} from "./pages/Workspace";
import { Editor, Detail, CommunicationEditor } from "./dialogs";
import {
  filterRecords,
  recordKinds,
  stampChanges,
  type RecordFilters,
} from "@dfx-crm/core/records";
import { RecordFilters as RecordFilterBar } from "./record-filters";
import { LedgerPage } from "./pages/Ledger";

export const nav = [
  { key: "dashboard", label: "工作台", icon: <DashboardOutlined />, group: "" },
  {
    key: "leads",
    label: "线索管理",
    icon: <BulbOutlined />,
    group: "销售管理",
  },
  {
    key: "projects",
    label: "跟进项目",
    icon: <FolderOpenOutlined />,
    group: "",
  },
  {
    key: "customers",
    label: "客户档案",
    icon: <ContactsOutlined />,
    group: "",
  },
  { key: "pool", label: "公共客户池", icon: <GlobalOutlined />, group: "" },
  {
    key: "quotes",
    label: "报价管理",
    icon: <FileTextOutlined />,
    group: "业务协同",
  },
  { key: "orders", label: "订单与收款", icon: <WalletOutlined />, group: "" },
  {
    key: "services",
    label: "售前售后",
    icon: <CustomerServiceOutlined />,
    group: "",
  },
  {
    key: "inventory",
    label: "库存与物料",
    icon: <AppstoreOutlined />,
    group: "",
  },
  { key: "suppliers", label: "供应商", icon: <ShopOutlined />, group: "" },
  {
    key: "knowledge",
    label: "学习档案",
    icon: <BookOutlined />,
    group: "团队成长",
  },
  { key: "daily", label: "工作日志", icon: <CheckCircleOutlined />, group: "" },
  { key: "reports", label: "数据统计", icon: <BarChartOutlined />, group: "" },
  { key: "costs", label: "费用与成本", icon: <WalletOutlined />, group: "" },
  {
    key: "activities",
    label: "市场与行政",
    icon: <CheckCircleOutlined />,
    group: "",
  },
  { key: "resources", label: "基础资料", icon: <BookOutlined />, group: "" },
  { key: "settings", label: "系统管理", icon: <SettingOutlined />, group: "" },
] as const;

export default function App() {
  const { message } = AntApp.useApp();
  const [storageError, setStorageError] = useState("");
  const [rawState, setState] = useState<State>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return migrateAdministration(createSeed());
      const parsed = JSON.parse(saved);
      if (!validateState(parsed)) throw new Error();
      return migrateAdministration(parsed);
    } catch {
      return migrateAdministration(createSeed());
    }
  });
  const [userId, setUserId] = useState("user-1");
  const latest = useRef({ state: rawState, userId });
  latest.current = { state: rawState, userId };
  const [page, setPage] = useState<Page>(() =>
    nav.some((n) => n.key === location.hash.slice(1))
      ? (location.hash.slice(1) as Page)
      : "dashboard",
  );
  const [more, setMore] = useState(false);
  const [editing, setEditing] = useState<{
    kind: EntityKind;
    id?: string;
    preset?: Record<string, unknown>;
  }>();
  const [selected, setSelected] = useState<{
    kind: EntityKind;
    id: string;
    menu?: Page;
  }>();
  const [communication, setCommunication] = useState<{
    customerId: string;
    projectId?: string;
  }>();
  const access = createAccess(rawState, userId);
  const [filterMap, setFilterMap] = useState<
    Partial<Record<Page, RecordFilters>>
  >({});
  const filters = filterMap[page] || {};
  const setFilters = (value: RecordFilters) =>
    setFilterMap((current) => ({ ...current, [page]: value }));
  const actor = access.user?.name || "未选择用户";
  const role = access.role?.code || "";
  const scopedState = scopeData(rawState, access);
  const state = projectFields(scopedState, access, "list", page);
  for (const kind of recordKinds) {
    const menu =
      kind === "communications"
        ? "projects"
        : kind === "expenses"
          ? "costs"
          : kind;
    if (
      page === menu ||
      (page === "pool" && kind === "customers") ||
      ["dashboard", "reports", "daily"].includes(page)
    ) {
      (state as any)[kind] = filterRecords(
        state[kind] as any[],
        filters,
        (key) => access.field(menu as Page, "list", key) !== "hidden",
      );
    }
  }
  const brand = rawState.admin!.company;
  const mobile = Grid.useBreakpoint().md === false;
  useEffect(() => {
    document.title = `${brand.shortName} · ${brand.name}`;
  }, [brand.name, brand.shortName]);
  useEffect(() => {
    const read = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!validateState(parsed)) throw new Error();
          setState(migrateAdministration(parsed));
          setStorageError("");
        }
      } catch {
        setStorageError("本机数据无法读取，已暂停写入以保护原数据。");
      }
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    const listener = () => {
      const key = location.hash.slice(1);
      if (nav.some((n) => n.key === key)) setPage(key as Page);
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  const change = (
    action: string,
    target: string,
    update: (s: State) => State,
    sensitive = false,
  ) => {
    if (latest.current.state !== rawState || latest.current.userId !== userId) {
      message.warning("数据或身份已变化，请重新打开此操作");
      return false;
    }
    if (storageError) {
      message.error("本机数据读取异常，暂不能保存");
      return false;
    }
    if (!access.user) {
      message.error("此账号已停用或删除");
      return false;
    }
    try {
      const next = stampChanges(rawState, update(rawState), actor, now());
      next.audit = [
        {
          id: uid("LOG"),
          date: now(),
          owner: actor,
          action,
          target,
          sensitive,
        },
        ...next.audit,
      ];
      localStorage.setItem(storageKey, JSON.stringify(next));
      latest.current = { state: next, userId };
      setState(next);
      return true;
    } catch (e) {
      message.error(`操作未保存：${(e as Error).message}`);
      return false;
    }
  };
  const navigate = (next: Page) => {
    if (!access.can(next)) {
      message.warning("当前角色不能进入此菜单");
      return;
    }
    setPage(next);
    location.hash = next;
    setMore(false);
    window.scrollTo({ top: 0 });
  };
  const selectUser = (id: string) => {
    Modal.destroyAll();
    setUserId(id);
    setEditing(undefined);
    setSelected(undefined);
    setCommunication(undefined);
    setMore(false);
  };
  const edit = (
    kind: EntityKind,
    id?: string,
    preset?: Record<string, unknown>,
  ) => {
    if (!access.can(kind, id ? "edit" : "create", "edit"))
      return void message.warning("没有该表单的操作权限");
    const record = (scopedState[kind] as any[]).find((x) => x.id === id);
    if (
      id &&
      (!record || (record.owner ? !access.owns(record.owner) : !access.isAdmin))
    )
      return void message.warning("该记录不在可修改的数据范围内");
    setEditing({ kind, id, preset });
  };
  const detail = (kind: EntityKind, id: string) => {
    const menu = page === "pool" && kind === "customers" ? "pool" : kind;
    if (!access.can(menu, "detail", "detail"))
      return void message.warning("没有详情区域权限");
    if (!scopedState[kind].some((x) => x.id === id))
      return void message.warning("该记录不在可见数据范围内");
    setSelected({ kind, id, menu });
  };
  const communicate = (customerId: string, projectId?: string) => {
    const menu = projectId ? "projects" : "customers";
    if (!access.can(menu, "communicate", "communication"))
      return void message.warning("没有沟通区域权限");
    const record = projectId
      ? scopedState.projects.find((p) => p.id === projectId)
      : scopedState.customers.find((c) => c.id === customerId);
    if (!record || !access.owns(record.owner))
      return void message.warning("请先领取公共记录，或选择本人及下属的记录");
    setCommunication({ customerId, projectId });
  };
  const visible = (_role: Role, _actor: string, _owner: string) => true; // Data has already been scoped before any page receives it.
  const editable = (_role: Role, _actor: string, owner: string) =>
    owner ? access.owns(owner) : access.isAdmin;
  const manager = () =>
    access.isAdmin || access.can(page, "export") || access.can(page, "review");
  // History snapshots are selected before lists, totals and dialogs receive data.
  const projectView = (project: State["projects"][number]) => project;
  const availableNav = nav.filter((n) => access.can(n.key));
  const due = state.projects.filter(
    (p) => p.nextDate && p.nextDate <= today() && p.status === "跟进中",
  ).length;
  const menu = (
    <nav className="nav-list" aria-label="主导航">
      {availableNav.map((n) => (
        <div key={n.key}>
          {n.group && <div className="nav-group">{n.group}</div>}
          <button
            className={`nav-item ${page === n.key ? "active" : ""}`}
            onClick={() => navigate(n.key)}
          >
            {n.icon}
            <span>{n.label}</span>
            {n.key === "leads" && (
              <em>{state.leads.filter((l) => l.status === "待分配").length}</em>
            )}
          </button>
        </div>
      ))}
    </nav>
  );
  const identity = (
    <Select
      aria-label="演示身份"
      value={userId}
      onChange={selectUser}
      options={rawState
        .admin!.users.filter((u) => u.status === "active")
        .map((u) => ({
          value: u.id,
          label: `${u.name} · ${rawState.admin!.roles.find((r) => r.id === u.roleId)?.name}`,
        }))}
      style={{ minWidth: 180, maxWidth: "100%" }}
    />
  );
  const logo = brand.logo ? (
    <img
      className="configured-logo"
      src={brand.logo}
      alt={`${brand.name} Logo`}
    />
  ) : (
    <span className="brand-icon">✦</span>
  );
  return (
    <Context.Provider
      value={{
        state,
        filters,
        setFilters,
        rawState,
        access,
        actor,
        role,
        mobile,
        page,
        area: "list",
        ownerNames: access.ownerNames,
        can: access.can,
        manager,
        visible,
        editable,
        projectView,
        change,
        navigate,
        edit,
        detail,
        communicate,
        setUserId: selectUser,
      }}
    >
      <div className="shell">
        {!mobile && (
          <aside className="sidebar">
            <a
              className="brand"
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault();
                navigate("dashboard");
              }}
            >
              {logo}
              <span className="configured-brand-name">
                {brand.shortName}
                <small>WORKSPACE</small>
              </span>
            </a>
            <div className="workspace-label">
              <span className="company-symbol">{brand.name[0]}</span>
              <span>
                {brand.name}
                <small>企业工作空间</small>
              </span>
            </div>
            {menu}
            <div className="sidebar-bottom">
              <span className="status-dot" />
              前端原型 · 本机保存<small>{brand.tagline}</small>
            </div>
          </aside>
        )}
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              {mobile ? (
                <>
                  {brand.logo ? (
                    <img
                      className="mini-configured-logo"
                      src={brand.logo}
                      alt="企业 Logo"
                    />
                  ) : (
                    <span className="mini-brand">✦</span>
                  )}
                  <strong>{brand.shortName}</strong>
                </>
              ) : (
                <>
                  <span>工作空间</span>
                  <span className="slash">/</span>
                  <strong>{nav.find((n) => n.key === page)?.label}</strong>
                </>
              )}
            </div>
            <div className="top-actions">
              <span className="demo-label">演示空间</span>
              {access.can("customers") && (
                <Button
                  type="text"
                  aria-label="搜索客户"
                  icon={<SearchOutlined />}
                  onClick={() => navigate("customers")}
                />
              )}
              <Badge dot={due > 0}>
                <Button
                  type="text"
                  aria-label="查看待办"
                  icon={<BellOutlined />}
                  onClick={() => navigate("dashboard")}
                />
              </Badge>
              {!mobile && identity}
            </div>
          </header>
          <main className="main-content" key={userId}>
            {storageError && <Alert type="error" title={storageError} />}
            {!access.can(page) ? (
              <Section>
                <div className="admin-content">
                  <Alert
                    type="warning"
                    title="当前身份不能进入此页面"
                    description="请从左侧可用菜单继续，或切换演示身份。"
                  />
                </div>
              </Section>
            ) : (
              <>
                {page !== "settings" && <RecordFilterBar />}
                {page === "dashboard" && <Dashboard />}
                {page === "leads" && <Leads />}
                {page === "projects" && <Projects />}
                {page === "customers" && <Customers />}
                {page === "pool" && <Customers pool />}
                {(
                  ["quotes", "orders", "services", "inventory"] as Page[]
                ).includes(page) && (
                  <Business
                    key={page}
                    kind={
                      page as "quotes" | "orders" | "services" | "inventory"
                    }
                  />
                )}
                {page === "suppliers" && <SuppliersPage />}
                {page === "knowledge" && <KnowledgePage />}
                {page === "daily" && <DailyPage />}
                {page === "reports" && <ReportsPage />}
                {(["resources", "activities", "costs"] as Page[]).includes(
                  page,
                ) && (
                  <LedgerPage
                    key={page}
                    kind={
                      page === "costs"
                        ? "expenses"
                        : (page as "resources" | "activities")
                    }
                  />
                )}
                {page === "settings" && <AdministrationPage />}
              </>
            )}
            <footer className="page-footer">
              <span>
                {brand.shortName} · {brand.tagline}
              </span>
              <span>
                <CloudOutlined />
                数据仅保存在当前浏览器
              </span>
            </footer>
          </main>
        </div>
        {mobile && (
          <div className="mobile-tabbar">
            <TabBar
              activeKey={
                ["dashboard", "leads", "projects", "customers"].includes(page)
                  ? page
                  : "more"
              }
              onChange={(key) =>
                key === "more" ? setMore(true) : navigate(key as Page)
              }
            >
              {[
                {
                  key: "dashboard",
                  label: "工作台",
                  icon: <DashboardOutlined />,
                },
                { key: "leads", label: "线索", icon: <BulbOutlined /> },
                {
                  key: "projects",
                  label: "项目",
                  icon: <FolderOpenOutlined />,
                },
                { key: "customers", label: "客户", icon: <TeamOutlined /> },
              ]
                .filter((n) => access.can(n.key as Page))
                .map((n) => (
                  <TabBar.Item key={n.key} title={n.label} icon={n.icon} />
                ))}
              <TabBar.Item key="more" icon={<MenuOutlined />} title="更多" />
            </TabBar>
          </div>
        )}
        <Popup
          visible={more}
          onMaskClick={() => setMore(false)}
          bodyStyle={{
            maxHeight: "80vh",
            overflow: "auto",
            borderRadius: "16px 16px 0 0",
          }}
        >
          <div className="more-menu">
            <h3>{brand.name}</h3>
            {menu}
            <p>演示身份</p>
            {identity}
          </div>
        </Popup>
        {editing && (
          <PermissionArea menu={editing.kind} area="edit">
            <Editor
              key={`${editing.kind}-${editing.id || "new"}`}
              {...editing}
              onClose={() => setEditing(undefined)}
            />
          </PermissionArea>
        )}
        {selected && (
          <PermissionArea menu={selected.menu || selected.kind} area="detail">
            <Detail
              key={`${selected.kind}-${selected.id}`}
              {...selected}
              onClose={() => setSelected(undefined)}
            />
          </PermissionArea>
        )}
        {communication && (
          <PermissionArea
            menu={communication.projectId ? "projects" : "customers"}
            area="communication"
          >
            <CommunicationEditor
              {...communication}
              onClose={() => setCommunication(undefined)}
            />
          </PermissionArea>
        )}
      </div>
    </Context.Provider>
  );
}
