# React + PWA + Capacitor Implementation Plan

**Goal:** 同一套 React 前端支持电脑 Web、移动 H5/PWA 和 Android 安装包；iOS 作为后续可增加的平台。

**Architecture:** 保留 `apps/web` 和共享业务包。Web 构建增加 manifest、图标、应用壳离线缓存和用户确认后的版本更新；Capacitor 使用独立的原生构建目录，避免 GitHub Pages 的子路径和 Service Worker 干扰安装包。

**Tech Stack:** React、Vite、vite-plugin-pwa、Capacitor 8、Android。

## 选型记录

- 采用 React + PWA + Capacitor：沿用现有页面和业务逻辑，同时提供浏览器和安装包入口。
- 仅 PWA 无法覆盖指定 Android 原生 SDK 的接入需求；React Native/Flutter 需要额外迁移现有界面，本轮不采用。
- 先交付 PWA 和 Android 工程。共享 Capacitor 配置和构建产物可供以后增加 iOS 工程；本轮不生成或验证 iOS 工程。
- 仅缓存应用静态资源，不把未来业务接口或附件响应加入 Service Worker 缓存。更新需用户确认，避免打断编辑。
- 当前 API 是空入口，数据仍在各端本地。此次不声称已实现登录、跨端同步或远程推送；这些功能需要统一后端和通知订阅管理。

## 实施步骤

1. 增加 Capacitor core/Android/CLI 和 Vite PWA 构建依赖，更新锁文件。
2. 在 `apps/web/vite.config.ts` 区分 Web 和 native 构建；增加 manifest、应用图标和离线缓存。原生构建使用根资源路径和 `dist-native`。
3. 在 React 入口增加 PWA 更新提示；原生环境不注册 Service Worker。补充配置与更新逻辑的针对性检查。
4. 添加共享 `capacitor.config.ts`，生成 Android 工程，复用应用名称和图标，提供同步与打开工程命令；将共用文件出口适配为原生缓存与系统分享，保留浏览器端原行为。
5. 更新 README 和跨端使用文档，说明安装、更新、数据边界、推送要求及后续 iOS 接入命令。
6. 执行业务测试、类型检查、根路径和 Pages 子路径构建；浏览器验证 Service Worker、离线打开与更新流程。尝试构建 Android debug APK；真机与真实推送仍需单独验收。

## 影响范围

入口、Vite/TypeScript 配置、包依赖与锁文件、PWA 更新 UI 与检查、静态图标、Capacitor 配置、Android 工程、CI 构建检查、README 和跨端说明。客户/项目等业务页面、权限规则和已有本地存储格式保持兼容。
