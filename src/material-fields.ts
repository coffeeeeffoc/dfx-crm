import type { FieldDefinition } from "./access";
// Supplementary source fields share the same storage/permission path as custom fields.
const spec: Record<string, string> = {
  customers:
    "industry:行业属性:text,quality:客户质量:text,customerState:客户状态:text,gender:主要联系人性别:text,invoiceType:发票类型:text,invoiceRecipient:发票寄送地址与收件人:text,nextDate:下次跟进日期:date,nextPlan:下次跟进计划:text,remarkLog:备注记录（时间 / 备注人 / 内容）:text,relationship:客户团队与上下级关系:text,invoiceAddress:开票单位地址:text,invoicePhone:开票电话:text",
  leads: "address:新客户地址:text,wechat:新客户微信:text",
  projects:
    "supplierId:关联供应商:text,manual:关联产品手册:text,opticalDiagram:光路图说明（图文件见附件）:text",
  quotes:
    "phone:联系电话:text,brand:生产厂家:text,settlementCurrency:产品结算币种:text,quoteNumber:报价编号:text,subject:报价主题:text,contact:客户联系人:text,delivery:预计货期:text,terms:付款及交付条款:text,notes:报价备注:text",
  orders:
    "netTotal:NET价格合计（登记值）:number,netPrice:商品净价（登记值）:number,vat:增值税（登记值）:number,tariff:关税（登记值）:number,financeFee:财务费用（登记值）:number,untaxedCost:不含税成本总额（登记值）:number,taxedCost:含税成本总额（登记值）:number,grossProfit:毛利润额（登记值）:number,grossMargin:毛利润率（登记值）:number,dispatchCost:收发货费用（登记值）:number,processingFee:加工费（登记值）:number,otherFee1:其他费用一（登记值）:number,otherFee2:其他费用二（登记值）:number,otherFee3:其他费用三（登记值）:number,actualFreight:实际运费及保险费（登记值）:number,bankFee:银行手续费（登记值）:number,actualExchange:实际汇差（登记值）:number,actualCost:实际合同成本（登记值）:number,costDifference:成本差额（登记值）:number,actualProfit:实际利润（登记值）:number,actualMargin:实际利润率（登记值）:number,bonusReference:奖金参考值（登记值）:number,agencyBonusReference:代理合同奖金参考值（登记值）:number,processing:总部处理进度:text,hkShipDate:香港实际发货日:date,bonusSettled:奖金是否已结算:text,contractStatus:合同签署状态:text,quoteRef:关联报价编号:text,signingCompany:签约单位:text,customerSigner:客户签约人:text,ourSigner:我方签约人:text,purchaseMethod:购买方式:text,specialTerms:合同特殊条款:text,foreignCompany:外贸公司全称（英文）:text,foreignAddress:外贸合同收货地址:text,foreignContact:外贸公司联系人:text,foreignPhone:外贸公司联系方式:text,ledgerNumber:分公司台账编号:text,agencyContract:代理流程合同:text,noticeEmail:接收通知邮箱:text,orderConfirmedAt:下单确认日期:date,factoryExpectedAt:原厂预计发货日:date,factoryShippedAt:原厂实际发货日:date,arrivedAt:国内到货日:date,supplierInvoiced:是否收齐供应商发票:text,supplierUninvoiced:供应商未开票金额:number,supplierCurrency:供应商支付币种:text,branchOrdered:是否分公司下单:text,ordered:是否已下单:text,paid:是否已付款:text,arrived:是否已到货:text,factoryConfirmedAt:厂商确认日期:date,bonus:奖金（登记值）:number,profit:利润额（登记值）:number,profitRate:利润率（登记值）:number,parentContract:鼎信合同号:text,externalNumber:外部编号:text,purchaseType:采购单位分类:text,region:地区:text,contact:联系人:text,externalAmount:成交价（外购）:number,exchangeCorrection:汇率差修正:number,freightCorrection:运保费修正:number,hkStorage:香港仓储费:number,otherCostNote:其他费用说明:text,otherCostDate:其他费用支付时间:date,freightDate:运保费支付日期:date,customsFee:清关费:number,customsDate:清关费支付日期:date,supplierAmount:供方合同金额:number,supplierInvoiceDate:供方开票时间:date,purchaseOrderDate:为用户下单时间:date,bonusDate:奖金结算时间:date,bonusAmount:奖金结算金额:number,notes:订单备注:text,currency:货币符号:text,exchangeRate:合同签署当日汇率:number,effectiveDate:合同生效日期:date,deliveryDate:约定交货日期:date,paymentMethod:付款方式:text,advanceRatio:预付款比例:number,firstDueDate:预计首款日期:date,finalDueDate:预计尾款日期:date,firstDueAmount:首款金额:number,finalDueAmount:尾款金额:number,registration:报备号:text,installation:是否需要安装:text,invoiceType:开票类型:text,invoiceTitle:发票抬头:text,taxId:税号:text,invoiceAddress:单位地址:text,invoicePhone:电话号码:text,bank:开户银行:text,bankAccount:银行账号:text,shippingNumber:发货运单号:text,invoiceShippingNumber:发票运单号:text,firstPaymentNote:首款情况:text,finalPaymentNote:尾款情况:text,invoiceAmount1:第一次开票金额:number,invoiceDate1:第一次开票时间:date,invoiceAmount2:第二次开票金额:number,invoiceDate2:第二次开票时间:date,invoiceAmount3:第三次开票金额:number,invoiceDate3:第三次开票时间:date,shipmentComplete:是否发齐:text,items:合同产品明细（型号 / 数量 / 单价）:text,contractFiles:合同文件说明（附件见关联资料）:text,supplierInvoice1:供应商发票1编号:text,supplierInvoiceAmount1:供应商发票1金额:number,supplierInvoice2:供应商发票2编号:text,supplierInvoiceAmount2:供应商发票2金额:number,supplierInvoice3:供应商发票3编号:text,supplierInvoiceAmount3:供应商发票3金额:number,supplierInvoice4:供应商发票4编号:text,supplierInvoiceAmount4:供应商发票4金额:number",
  services:
    "equipmentName:设备名称:text,quantity:设备数量:number,training:是否需要培训:text,contractNumber:合同编号:text,branchContract:分公司合同编号:text,requestedAt:申请时间:date,requester:申请人:text,contact:联系人:text,phone:联系电话:text,address:服务地点:text,brand:产品品牌:text,sn:设备SN码:text,purchaseDate:购买日期:date,startDate:开始服务日期:date,endDate:完成服务日期:date,engineer:工程师:text,cost:服务费用:number,acceptance:客户验收意见:text",
  inventory:
    "agreementDays:协议周期（天）:number,dailyFee:协议期内借用费（每天）:number,overdueFee:超期借用费（每天）:number,purchaseNumber:采购或入库单号:text,mark:标记:text,internalNumber:企业物料编号:text,shanghaiCost:上海成本:number,sn:产品序列号:text,supplier:供货单位:text,invoice:采购发票信息:text",
  suppliers: "wechat:微信:text",
  knowledge: "application:应用类别:text,folder:文件夹:text",
  expenses:
    "paidAt:实际支付日期:date,paymentAccount:支付账户:text,recipient:收款方:text,invoice:票据信息:text,notes:费用说明:text",
};
export const financialExtras = new Set([
  "extra_supplierInvoiceAmount1",
  "extra_supplierInvoiceAmount2",
  "extra_supplierInvoiceAmount3",
  "extra_supplierInvoiceAmount4",
  "extra_netTotal",
  "extra_netPrice",
  "extra_vat",
  "extra_tariff",
  "extra_financeFee",
  "extra_untaxedCost",
  "extra_taxedCost",
  "extra_grossProfit",
  "extra_grossMargin",
  "extra_dispatchCost",
  "extra_processingFee",
  "extra_otherFee1",
  "extra_otherFee2",
  "extra_otherFee3",
  "extra_actualFreight",
  "extra_bankFee",
  "extra_actualExchange",
  "extra_actualCost",
  "extra_costDifference",
  "extra_actualProfit",
  "extra_actualMargin",
  "extra_bonusReference",
  "extra_agencyBonusReference",
  "extra_supplierUninvoiced",
  "extra_bonus",
  "extra_profit",
  "extra_profitRate",
  "extra_dailyFee",
  "extra_overdueFee",
  "loans.totalFee",
  "loans.normalFee",
  "loans.overdueFee",
  "extra_externalAmount",
  "extra_exchangeCorrection",
  "extra_freightCorrection",
  "extra_hkStorage",
  "extra_otherCostNote",
  "extra_otherCostDate",
  "extra_freightDate",
  "extra_customsFee",
  "extra_customsDate",
  "extra_supplierAmount",
  "extra_bonusDate",
  "extra_bonusAmount",
  "extra_shanghaiCost",
  "extra_deposit",
  "extra_rent",
  "loans.deposit",
  "loans.rent",
]);
export const loanFields = [
  ["company", "借用单位"],
  ["address", "借用地址"],
  ["contact", "联系人"],
  ["phone", "联系电话"],
  ["agreement", "借用协议编号"],
  ["deposit", "押金"],
  ["rent", "租金"],
  ["notes", "借用备注"],
  ["recipient", "收货人完整信息"],
  ["shippingNumber", "寄出运单号"],
  ["returnNumber", "归还运单号"],
  ["totalDays", "借用总天数（登记）"],
  ["overdueDays", "逾期天数（登记）"],
  ["normalFee", "协议期内借用费用"],
  ["overdueFee", "超期借用费用"],
  ["totalFee", "总费用（登记）"],
] as const;
export const supplementaryFields: Record<string, FieldDefinition[]> =
  Object.fromEntries(
    Object.entries(spec).map(([kind, text]) => [
      kind,
      text.split(",").map((item) => {
        const [key, label, type] = item.split(":");
        return {
          key: `extra_${key}`,
          label,
          type: type as FieldDefinition["type"],
          enabled: true,
          source: "材料补充",
        };
      }),
    ]),
  );
export const expenseCategories = [
  "公司开销",
  "公司账户直接转出",
  "增值税",
  "企业所得税及附加税",
  "股东分红个税",
  "社保",
  "公积金",
  "补充公积金",
  "成员个税",
  "重复成本",
  "报销",
  "薪资（不含提成）",
  "提成奖金",
  "社保公积金个税合计",
  "市场推广",
  "差旅",
  "其他",
];
