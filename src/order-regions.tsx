import { App, Descriptions, Input, InputNumber, Space } from "antd";
import { useCRM } from "./context";
import { ActionButton } from "./permission-ui";
import { money, today, uid } from "./domain";

export function OrderRegions({ id }: { id: string }) {
  const { rawState, access, change } = useCRM();
  const { modal, message } = App.useApp();
  const order = rawState.orders.find((o) => o.id === id);
  if (!order || !access.owns(order.owner)) return null;
  const field = (area: "payments" | "finance", key: string) =>
    access.field("orders", area, key);
  const register = (key: "payments" | "supplierPayments") => {
    if (
      !access.can("orders", "payment", "payments") ||
      field("payments", key) !== "write" ||
      field("payments", "paymentAmount") !== "write" ||
      field("payments", "paymentDate") !== "write"
    )
      return;
    let amount: number | null = null,
      date = today(),
      note = "";
    modal.confirm({
      title: key === "payments" ? "登记客户回款" : "登记供应商付款",
      content: (
        <Space orientation="vertical" style={{ width: "100%" }}>
          <InputNumber
            aria-label="收付款金额"
            min={0.01}
            precision={2}
            style={{ width: "100%" }}
            onChange={(v) => (amount = v)}
          />
          <Input
            aria-label="收付款日期"
            type="date"
            defaultValue={date}
            onChange={(e) => (date = e.target.value)}
          />
          <Input
            disabled={field("payments", "paymentNote") !== "write"}
            aria-label="收付款备注"
            placeholder="备注"
            onChange={(e) => (note = e.target.value)}
          />
        </Space>
      ),
      onOk: () => {
        if (!amount || !Number.isFinite(amount) || amount <= 0 || !date) {
          message.error("请填写有效金额和日期");
          return Promise.reject();
        }
        if (
          key === "payments" &&
          order.payments.reduce((s, p) => s + p.amount, 0) + amount >
            order.amount + 0.001
        ) {
          message.error("累计收款不能超过合同金额");
          return Promise.reject();
        }
        if (
          !change("登记收付款", order.contract, (s) => ({
            ...s,
            orders: s.orders.map((o) =>
              o.id === id
                ? {
                    ...o,
                    [key]: [
                      ...o[key],
                      { id: uid("PAY"), amount: amount!, date, note },
                    ],
                  }
                : o,
            ),
          }))
        )
          return Promise.reject();
      },
    });
  };
  const finance: [string, string, number][] = [
    ["cost", "采购成本", order.cost],
    ["freight", "运保费", order.freight],
    ["commission", "佣金", order.commission],
    ["otherCost", "其他费用", order.otherCost],
  ];
  const canProfit = [
    "amount",
    "cost",
    "freight",
    "commission",
    "otherCost",
  ].every((k) => field("finance", k) !== "hidden");
  return (
    <>
      {access.can("orders", "view", "payments") &&
        (["payments", "supplierPayments"] as const)
          .filter((key) => field("payments", key) !== "hidden")
          .map((key) => (
            <div key={key}>
              <div className="detail-section-heading">
                <h4>{key === "payments" ? "客户回款" : "供应商付款"}</h4>
                <ActionButton
                  menu="orders"
                  region="payments"
                  permission="payment"
                  size="small"
                  disabled={
                    field("payments", key) !== "write" ||
                    field("payments", "paymentAmount") !== "write" ||
                    field("payments", "paymentDate") !== "write"
                  }
                  onClick={() => register(key)}
                >
                  登记{key === "payments" ? "回款" : "付款"}
                </ActionButton>
              </div>
              {order[key].map((p) => (
                <div className="payment-row" key={p.id}>
                  {field("payments", "paymentDate") !== "hidden" && (
                    <span>{p.date}</span>
                  )}
                  {field("payments", "paymentNote") !== "hidden" && (
                    <span>{p.note}</span>
                  )}
                  {field("payments", "paymentAmount") !== "hidden" && (
                    <b>¥ {money(p.amount)}</b>
                  )}
                </div>
              ))}
            </div>
          ))}
      {access.can("orders", "finance", "finance") && (
        <>
          <h4 style={{ marginTop: 24 }}>成本与利润</h4>
          <Descriptions
            column={2}
            layout="vertical"
            items={[
              ...finance
                .filter(([key]) => field("finance", key) !== "hidden")
                .map(([key, label, value]) => ({
                  key,
                  label,
                  children: money(value),
                })),
              ...(canProfit
                ? [
                    {
                      key: "profit",
                      label: "订单利润（演示口径）",
                      children: money(
                        order.amount -
                          order.cost -
                          order.freight -
                          order.commission -
                          order.otherCost,
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </>
      )}
    </>
  );
}
