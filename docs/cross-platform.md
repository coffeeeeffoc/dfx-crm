# Web、PWA 与移动安装包

共享 `apps/web` 的 React 页面和 `packages/core` 业务模型。Web/H5 使用 Vite；PWA 在同一网页上增加安装与离线应用壳；Android 使用 Capacitor 8。iOS 以后增加原生工程，继续使用同一份配置和原生构建资源。

## 当前可用范围

| 入口 | 状态 | 数据与通知 |
| --- | --- | --- |
| 电脑 Web、移动 H5 | 现有页面继续使用 | 当前浏览器本地数据 |
| PWA | manifest、安装图标、应用壳缓存、确认后更新 | 可离线打开已缓存的应用；没有远程推送后端 |
| Android App | 原生工程、独立构建和资源同步 | App 自己的本地存储；没有厂商推送 SDK |
| iOS App | 共享配置和接入步骤 | 尚未生成、构建或验证 iOS 工程 |

各端不自动共享 localStorage 或 IndexedDB。App 与浏览器是不同的数据容器；卸载、清除数据和更换安装标识可能丢失本地数据。生产使用需要服务端登录、数据库、附件存储、权限校验及备份。

## Web / PWA

```powershell
pnpm build
pnpm preview
```

访问 `http://localhost:4173`。开发用的 `pnpm dev` 不注册 Service Worker，避免开发资源被缓存。PWA 要在正式构建上验收。

GitHub Pages 继续使用 `VITE_BASE_PATH=/dfx-crm/`。manifest 的安装 ID、启动地址、scope 和图标均相对站点目录解析；Service Worker 限定在部署路径内。

- 安装和离线能力需要 HTTPS，`localhost` 为开发例外。手机访问局域网 HTTP 地址可以看 H5，但不能据此验证 PWA 安装或推送。
- Android/电脑：使用支持 PWA 的浏览器，在菜单选择安装应用。
- iPhone/iPad：添加到主屏幕，作为 Web App 打开；Web Push 需要 iOS/iPadOS 16.4 或以上、用户主动授权和实际推送后端。
- 首次在线打开并完成缓存后，可以离线再次打开。只缓存应用静态资源，不额外缓存业务 API、原始材料或附件响应；远程内容和外部链接仍需网络。
- 发现新版本后显示提示。先保存正在编辑的内容，再点击“保存完毕，更新”；关闭提示可继续当前版本，下次打开再检查。更新应用壳不会清除业务 localStorage 或 IndexedDB。

## Android

原生资源构建固定使用 `/` 资源路径、输出到 `apps/web/dist-native/`，不使用 Pages 的子路径，不生成或注册网页 Service Worker。安装包的更新通过新包完成。

```powershell
pnpm android:sync  # 构建原生资源并同步到已提交的 Android 工程
pnpm android:open  # 用本机 Android Studio 打开工程
```

应用名为“星谱 CRM”，当前包名为 `com.dfx.crm`，属于开发阶段的安装标识。正式交付前确定包名；更换包名会变成另一个 App，原本本地数据不会自动迁移。

命令行构建需要 JDK 21、Android SDK Platform 36、相应 Build Tools；Android Studio 可使用其兼容的内置 JDK。设置本机 `JAVA_HOME`、`ANDROID_HOME`，或者在忽略的 `android/local.properties` 中配置 `sdk.dir`。只在本机配置路径，勿提交到仓库。

```powershell
pnpm android:sync
Push-Location apps/web/android
.\gradlew.bat assembleDebug --max-workers=2
Pop-Location
```

调试包输出到 `apps/web/android/app/build/outputs/apk/debug/app-debug.apk`。debug 包用于开发验证；正式直接分发时需固定发布签名、维护递增版本号并备份签名文件。`*.jks`、`*.keystore` 和本地服务配置已忽略。

Android 端启用现代 edge-to-edge；React 样式读取原生提供的安全区，避免顶部标题和底部导航被系统栏遮挡。附件打开、下载及 JSON/Excel 导出通过系统分享面板选择接收应用；Web/PWA 保留浏览器的预览和下载方式。原生文件按 1MiB 分块写入临时缓存，取消分享不记录为导出成功；系统可回收临时文件，频繁的大附件导出仍需增加过期清理。真实键盘、文件选择、接收应用及各厂商 WebView 需要设备验收。

启动使用系统 SplashScreen API 切换到无原生标题栏的主题；Android 返回键优先回退网页历史，到达根页面后退出。返回无 hash 的初始地址时，React 路由恢复工作台。

## 推送的后续接入

PWA/Capacitor 是客户端运行方式，不能代替消息后端。目前不会向用户请求一个没有服务端支持的通知授权，也不显示模拟推送成功。

接入时：服务端保存业务通知与未读状态，将用户与各设备订阅关联；Web/PWA 走 Web Push，Android 走适合实际设备的原生通道，iOS App 走 APNs。通知点击后重新通过登录与权限校验读取业务详情。退出或切换账号时解除旧账号订阅关联，避免错推。

Capacitor 官方 Android Push Notifications 插件使用 FCM；国内设备需要评估华为、小米、OPPO、vivo 等厂商通道或合适的聚合服务，不能只打包后就认定推送稳定。对重要事项保留服务器待办与必要的备用通知渠道。

## 以后增加 iOS

在具备兼容 Xcode 的 macOS 环境中，安装与当前 Capacitor core/CLI 相同版本的 iOS 平台包：

```sh
pnpm --filter @dfx-crm/web add @capacitor/ios@8.5.3
pnpm --filter @dfx-crm/web build:native
pnpm --filter @dfx-crm/web exec cap add ios
pnpm --filter @dfx-crm/web exec cap sync ios
pnpm --filter @dfx-crm/web exec cap open ios
```

然后配置 iOS 图标、签名、安装分发方式、原生权限及 Filesystem 插件需要的 `PrivacyInfo.xcprivacy`，并做真机验收。Capacitor 不绕过 Apple 的签名要求；iPhone PWA 的使用和 Web Push 不依赖这套 iOS 原生工程。具体隐私清单配置见 [Filesystem 官方文档](https://capacitorjs.com/docs/apis/filesystem)。

## 验证

`pnpm test` 覆盖 Pages/native 构建路径、PWA 启停隔离、安装图标尺寸，以及原生桥模拟下的文件分块、路径安全、取消和失败处理；`pnpm build` 做所有包类型检查与 Web/PWA 构建，`pnpm android:sync` 做原生资源构建和 Android 同步。CI 同时执行这两种构建，Pages 仍只发布 `apps/web/dist/`。

发布前分别验证 PWA 安装、离线重新打开、版本提示及确认更新、业务数据保留；Android 验证启动、安全区、返回、键盘、附件和导出。远程推送须等消息后端接通后，用目标机型、锁屏/后台/省电模式及实际网络单独验收。
