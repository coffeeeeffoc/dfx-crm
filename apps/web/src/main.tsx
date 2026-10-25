import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, App as AntApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import { ConfigProvider as MobileConfig } from "antd-mobile";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import PwaUpdate from "./pwa-update";
import "./styles.css";

dayjs.locale("zh-cn");
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#3866dc",
          colorInfo: "#3866dc",
          colorSuccess: "#209676",
          colorText: "#26334d",
          colorTextSecondary: "#7d889e",
          colorBorder: "#e3e8f0",
          borderRadius: 8,
          fontSize: 13,
          controlHeight: 36,
          fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        },
        components: {
          Table: {
            headerBg: "#f8f9fc",
            headerColor: "#8590a4",
            rowHoverBg: "#f6f8ff",
            cellPaddingBlock: 16,
          },
          Button: { primaryShadow: "0 3px 8px #3866dc1a" },
          Tabs: { horizontalItemGutter: 28 },
        },
      }}
    >
      <MobileConfig>
        <AntApp>
          <App />
          {import.meta.env.MODE !== "native" && !Capacitor.isNativePlatform() && (
            <PwaUpdate />
          )}
        </AntApp>
      </MobileConfig>
    </ConfigProvider>
  </React.StrictMode>,
);
