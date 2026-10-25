# 原型验证记录

## React + PWA + Capacitor（2026-10-25）

- `pnpm test`：36 项通过（35 项前端、1 项 mock）。新增 Pages/native 构建路径隔离、PWA 启停、安装图标尺寸，以及模拟原生桥下的分块文件、路径安全、取消和读写失败检查；原生分块以 2MiB+7 字节逐字节比对。
- `pnpm build`：四包类型检查及 Web/PWA 构建通过。`pnpm android:sync`：独立原生构建与两个原生文件插件同步通过。CI 增加原生资源构建/同步，未增加 iOS 或远程推送配置。
- Chrome 156.0.8078.47 无头浏览器分别验证 `/` 与 `/dfx-crm/`：manifest 无解析错误，启动地址和 Service Worker scope 正确，图标均可获取；离线重新打开、离线 Excel 按需加载/导出通过。浏览器返回无 hash 地址时恢复工作台。
- 在隔离测试服务中改变 Service Worker 字节触发更新：提示出现前后页面未自行刷新，点击“保存完毕，更新”后刷新，localStorage 保留。仅断言应用脚本无运行异常；测试阻断外部 Google Fonts，离线使用系统字体回退。
- Android 使用 JDK 21、SDK Platform 36、Build Tools 35 构建 debug APK 成功。Google Maven 首次下载遇到 TLS 错误后，本机构建显式沿用已配置的系统代理完成依赖获取；仓库仍使用官方仓库。最终增量构建在离线模式下通过。
- Android 14 / API 34 的 Pixel 3a 只读模拟器安装、启动通过。修复启动主题产生原生标题栏遮挡的问题；顶部标题、底部导航位于可用区域，viewport/scrollWidth 均为 393，没有横向溢出。原生环境 Service Worker 注册数为 0。
- Android 模拟器实际点击客户入口、导出 Excel，确认系统分享面板打开；从 App 缓存取出 10,753 字节文件，用 ExcelJS 重新读取成功。原生与 PWA 的客户导出均为 18 条记录、36 列。取消分享后数据和审计记录不变；返回键从客户页回到工作台，根页面返回退出。
- 调试 APK：`apps/web/android/app/build/outputs/apk/debug/app-debug.apk`，5,611,410 字节；SHA-256：`d539749a3cd50a6342898b6a4d4ee18f977f6fee62de0f2ccf47d3002e355322`。使用开发签名，尚未制作正式发布签名包。
- 截图：[Android 模拟器](cross-platform-android.png)、[PWA 离线手机视口](cross-platform-pwa-offline.png)、[PWA 更新提示](cross-platform-pwa-update.png)。使用与用户浏览器相互独立的测试存储；没有向外部应用实际发送文件。

以上为本地验收结果，推送后的 CI 和 Pages 部署状态以对应提交的 [Actions 运行](https://github.com/coffeeeeffoc/dfx-crm/actions/workflows/frontend.yml) 为准。未生成/验证 iOS 原生工程，未做物理手机、真实推送、跨端数据同步、实际接收应用保存文件或 200MB 附件压力验收；现有后端仍为空入口。安装、构建与后续接入方式见 [跨端说明](../cross-platform.md)。

## pnpm workspace 迁移（2026-10-25）

- `pnpm install --frozen-lockfile` 成功；从原 npm 锁文件导入既有依赖版本，仅允许 esbuild 必要的安装脚本。
- `pnpm test`：33 项通过（原有 32 项加 mock 数据实例独立性、客户关联和演示邮箱检查）。
- `pnpm build`：api、core、mock-data、web 四包类型检查通过，Vite 生产构建通过，产物位于 `apps/web/dist/`；以 `VITE_BASE_PATH=/dfx-crm/` 验证 Pages 资源前缀。
- `pnpm fields:export`：16 组、483 项字段，输出与迁移前一致。
- 前端继续通过 mock 数据初始化，本机存储 key 和附件库名称沿用原值；后端只有空 TypeScript 入口。
- `.github/workflows/frontend.yml` 在 main/dev 推送和 PR 时验证；正式 Pages 由 main 发布，构建产物不含材料目录。
- 实现提交 `433b1e6` 的 [main 构建与 Pages 部署](https://github.com/coffeeeeffoc/dfx-crm/actions/runs/40182825919) 均成功；线上入口、JS、CSS 返回 200，资源内容与本地产物逐字节一致。
- 使用无头 Chrome 验证线上工作台、客户档案、mock 客户“华东理工大学”和 `#customers` 刷新；无运行异常、无 fetch/XHR 数据请求。内嵌浏览器连接不可用，改用自动化浏览器检查。
- 依赖安装沿用的 antd-mobile 间接依赖仍有 React 19 peer 版本提示；Vite 仍有大包体积提示，本次未扩展到依赖升级或拆包优化。

以下为迁移前的原型验收记录，当时使用 npm 和根目录 `dist/`。

日期：2026-10-25。本机 Windows、Chromium 内嵌浏览器。浏览器操作验证使用 `127.0.0.1:5173` 的独立演示存储；用户预览 `localhost:5173` 保留初始演示资料。

## 构建和逻辑检查

- `npm test`：32 项通过，包括查重、金额、转项目、公共池交接、同客户项目隔离、原归属人和上级的历史快照、库存、递归下属、区域/字段授权、保护只读值、领导环/最后管理员保护、用户增删改、角色 code、旧存档迁移和损坏配置拒绝。
- `npm run build`：TypeScript 与 Vite 生产构建通过。产物在 `dist/`。
- Vite 有大于 500KB 的包体提示：主 JS 约 1.59MB（gzip 505KB），ExcelJS 按需加载约 929KB（gzip 256KB）。本版未继续做路由拆包和弱网性能优化。
- 最终新页面首次加载未捕获控制台 error/warn；不将开发中热更新的旧日志混作最终运行结果。
- 原始材料/转录不在产物中；开发服务请求 `/materials/transcripts/manifest.json` 返回 403。

## 第二轮材料复核验证

新增回归覆盖：AND 人员/时间/字段筛选，起止日与零值，隐藏字段不能参与查询，创建/更新盖戳及未知旧元信息，三级下属在列表/详情/编辑/导出/统计一致，同级不扩权，菜单禁用不参与聚合，联系人/产品/借用子字段脱敏，沟通历史导出脱敏，财务新字段安全迁移，无机会线索直接入池/领取，线索导入权限与私有客户，修正时间窗口，新台账用户交接，其他团队借用信息遮蔽，个人标签及字段注册唯一。

| 实际浏览器操作 | 本轮证据 |
| --- | --- |
| 普通销售列表/详情/编辑 | 可见项目 2 个；预算在详情隐藏、编辑输入禁用；无导出按钮、无供应商菜单 |
| 市场活动 | 新增“材料复核 · 展会回访验证”，创建/更新人及时间写入并在详情展示 |
| 通用筛选 | 创建人筛选、文字条件“不存在”返回 0、改为命中值返回 1；创建时间起日设 2027-01-01 返回 0，重置返回 1 |
| 活动导出 | `audit-activities-export.xlsx`：1 行、11 列，ExcelJS 读取断言四个审计字段及创建人 |
| 线索导入 | `audit-leads-import.xlsx`：3 行测试数据，预览有效/重复/缺项，实际导入 1 条跳过 2 条；截图 `audit-import-preview.png` |
| 工作台明细 | 统计图标打开明细弹窗；用户预览工作台在跟 14 个，弹窗与导出一致 |
| 统计导出 | `audit-statistics-export.xlsx`：14 行、30 列，ExcelJS 校验行数及创建/更新元字段 |
| 手机端筛选/明细 | 宽 390，页面 scrollWidth=390，弹窗宽 374；新增条件可用，明细表内部横向滚动。检查过 390×844 与 390×720，保存后者视口截图 |
| 最终浏览器日志 | 用户预览页未捕获 error/warn，测试页未捕获 error |

本轮新增截图：`audit-desktop-dashboard.png`、`audit-desktop-statistics.png`、`audit-mobile-filters.png`、`audit-mobile-statistics.png`、`audit-import-preview.png`。测试数据保留在 `127.0.0.1`；用户 `localhost` 预览主要保持初始演示数据，统计导出仅新增审计记录。

字段清单生成脚本自检 16 组、483 个注册字段无重复；Excel 源提取断言 19 个工作表。原 Excel SHA-256 见材料核对表。

## 首轮已验证的浏览器操作（保留记录）

| 场景 | 结果 |
| --- | --- |
| 新建线索及客户 → 转项目 → 写沟通 → 调整跟进日期 → 公共池 → 领取 | 完成，刷新保留；原线索仍存在 |
| 客户 Excel 导入预览 | `import-sample.xlsx` 中有效、重复、缺少必填各 1 条；导入 1 条、跳过 2 条 |
| 订单回款 | 超合同累计金额被拒绝；登记 1000 后已收 38400→39400，余额 89600→88600 |
| 样机借还 | 可用库存 8→7→8 |
| 其余菜单 | 报价、订单、服务、库存、供应商、学习、日志、统计和管理页均能打开 |
| 企业配置 | 保存全称/简称后导航和标题更新；用测试 PNG 上传 Logo，图像正常解码；测试后恢复默认图标 |
| 用户管理 | 新增验证用户，绑定顾问角色和直属领导；已验证修改用户角色；删除选择承接人后有效列表移除，勾选“显示已删除”可查看恢复入口 |
| 自定义角色 | 复制顾问角色，唯一 code 为 `verification_sales`；禁用供应商菜单，绑定用户并切换身份，菜单随之隐藏 |
| 区域和字段 | 项目预算在列表可见、详情隐藏、编辑只读；详情沟通按钮单独禁用。修改其他字段成功，预算仍为 128000 |
| 数据范围 | 顾问身份只显示自己可见的 2 个项目，其他团队私有项目不在列表；多层下属与公共例外另由回归测试覆盖 |
| 动态字段 | 项目新增文本字段后出现在列表、表单、详情；填写并保存成功；停用后列表隐藏，恢复后原填写值仍在 |
| 移动端 | 390×844 下项目卡片、搜索、沟通弹层可用并保存；组织管理页宽度 390，权限弹窗宽度 374，文档无横向溢出，表格使用内部滚动 |

## 录音输出检查

3 份原音均已处理，总时长 7236.598 秒。检查输出 JSON 的时间顺序、原始识别文本和 MD/TXT/JSON 文件齐全，段数分别为 114、88、11。3 处明显异常二次识别并保留原结果、标记需听原音复核。没有声称完成逐字人工审校。

## 截图

- `desktop-final.png`：最终工作台。
- `desktop.png`、`mobile.png`：业务原型完整页面。
- `mobile-projects.png`、`mobile-followup.png`：手机项目与沟通弹层。
- `permissions.png`：菜单、详情区域和字段权限。
- `mobile-administration.png`：手机组织管理。

未验证物理手机、实际后端鉴权/租户隔离、多人实时并发、生产部署或真实业务数据迁移。前端角色切换只用于评审；浏览器中存有完整演示资料，不能作为真实访问控制。
