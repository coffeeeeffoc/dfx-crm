import { useEffect } from "react";
import { App, Button } from "antd";
import { useRegisterSW } from "virtual:pwa-register/react";

export default function PwaUpdate() {
  const { notification } = App.useApp();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: (error) => console.warn("离线功能注册失败", error),
  });

  useEffect(() => {
    if (!needRefresh) return;
    const key = "app-update";
    notification.info({
      key,
      title: "星谱 CRM 有新版本",
      description: "请先保存正在编辑的内容，再更新应用。",
      duration: 0,
      styles: { root: { marginTop: "var(--app-safe-top)" } },
      actions: (
        <Button
          type="primary"
          onClick={() => {
            void updateServiceWorker(true).catch(() => {
              notification.error({
                title: "更新失败",
                description: "请检查网络后重新打开应用，再尝试更新。",
              });
            });
          }}
        >
          保存完毕，更新
        </Button>
      ),
      onClose: () => setNeedRefresh(false),
    });
    return () => notification.destroy(key);
  }, [needRefresh, notification, setNeedRefresh, updateServiceWorker]);

  return null;
}
