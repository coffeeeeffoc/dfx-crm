# 原型字段清单

由 `scripts/export-field-registry.ts` 从当前注册表生成；包含系统字段、材料补充字段和嵌套字段。企业自行新增的字段在本机配置中。

## customers（43）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| name | 客户姓名 | text | 系统 |
| company | 客户单位 | text | 系统 |
| title | 职称 / 职务 | text | 系统 |
| phone | 电话 | text | 系统 |
| wechat | 微信 | text | 系统 |
| email | 邮箱 | text | 系统 |
| region | 所属区域 | text | 系统 |
| address | 联系地址 | text | 系统 |
| category | 客户类别 | text | 系统 |
| application | 应用类别 | text | 系统 |
| owner | 负责人 | text | 系统 |
| source | 来源 | text | 系统 |
| tags | 公共标签 | text | 系统 |
| myTags | 个人标签 | text | 系统 |
| notes | 备注 | text | 系统 |
| contacts | 同单位联系人 | text | 系统 |
| invoiceTitle | 发票抬头 | text | 系统 |
| taxId | 税号 | text | 系统 |
| bank | 开户银行 | text | 系统 |
| bankAccount | 银行账户 | text | 系统 |
| createdAt | 创建时间 | text | 系统 |
| updatedAt | 更新时间 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| updatedBy | 更新人 | text | 系统 |
| extra_industry | 行业属性 | text | 材料补充 |
| extra_quality | 客户质量 | text | 材料补充 |
| extra_customerState | 客户状态 | text | 材料补充 |
| extra_gender | 主要联系人性别 | text | 材料补充 |
| extra_invoiceType | 发票类型 | text | 材料补充 |
| extra_invoiceRecipient | 发票寄送地址与收件人 | text | 材料补充 |
| extra_nextDate | 下次跟进日期 | date | 材料补充 |
| extra_nextPlan | 下次跟进计划 | text | 材料补充 |
| extra_remarkLog | 备注记录（时间 / 备注人 / 内容） | text | 材料补充 |
| extra_relationship | 客户团队与上下级关系 | text | 材料补充 |
| extra_invoiceAddress | 开票单位地址 | text | 材料补充 |
| extra_invoicePhone | 开票电话 | text | 材料补充 |
| contacts.name | 联系人姓名 | text | 系统 |
| contacts.title | 联系人职称 | text | 系统 |
| contacts.phone | 联系人电话 | text | 系统 |
| contacts.email | 联系人邮箱 | text | 系统 |
| contacts.relation | 联系人关系 | text | 系统 |
| contacts.gender | 联系人性别 | text | 系统 |
| contacts.address | 联系人联系地址 | text | 系统 |

## leads（22）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| name | 线索名称 | text | 系统 |
| customerId | 关联客户 | text | 系统 |
| owner | 负责人 | text | 系统 |
| source | 线索来源 | text | 系统 |
| sourceDetail | 来源明细 | text | 系统 |
| referrer | 推介人信息 | text | 系统 |
| brand | 咨询产品品牌 | text | 系统 |
| judgement | 机会判定 | text | 系统 |
| content | 首次沟通内容 | text | 系统 |
| status | 状态 | text | 系统 |
| createdAt | 创建时间 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |
| extra_address | 新客户地址 | text | 材料补充 |
| extra_wechat | 新客户微信 | text | 材料补充 |
| projectId | 关联项目 | text | 系统 |
| convertedAt | 转项目时间 | date | 系统 |
| customerName | 新客户姓名 | text | 系统 |
| company | 新客户单位 | text | 系统 |
| phone | 客户电话 | text | 系统 |
| email | 客户邮箱 | text | 系统 |

## projects（30）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| name | 项目名称 | text | 系统 |
| customerId | 关联客户 | text | 系统 |
| owner | 负责人 | text | 系统 |
| brand | 推荐品牌 | text | 系统 |
| model | 产品型号 | text | 系统 |
| application | 应用类别 | text | 系统 |
| budget | 预算金额 | text | 系统 |
| probability | 签单概率 | text | 系统 |
| stage | 跟进阶段 | text | 系统 |
| status | 项目状态 | text | 系统 |
| orderNumber | 成单订单号 | text | 系统 |
| target | 项目目标 | text | 系统 |
| system | 用户系统描述 | text | 系统 |
| needs | 真实需求 / 附加需求 | text | 系统 |
| recommendation | 推荐方案 / 优势 / 劣势 | text | 系统 |
| competitor | 竞争方案 / 优势 / 劣势 | text | 系统 |
| purchaseDate | 预计采购时间 | text | 系统 |
| purchaseMethod | 采购方式 | text | 系统 |
| useDate | 预计使用时间 | text | 系统 |
| nextDate | 下次跟进日期 | text | 系统 |
| nextPlan | 下次跟进计划 | text | 系统 |
| reason | 放弃原因 | text | 系统 |
| attachments | 相关附件 | text | 系统 |
| createdAt | 创建时间 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |
| extra_supplierId | 关联供应商 | text | 材料补充 |
| extra_manual | 关联产品手册 | text | 材料补充 |
| extra_opticalDiagram | 光路图说明（图文件见附件） | text | 材料补充 |

## quotes（30）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| name | 报价名称 | text | 系统 |
| projectId | 关联项目 | text | 系统 |
| customerId | 关联客户 | text | 系统 |
| owner | 负责人 | text | 系统 |
| date | 报价日期 | text | 系统 |
| expiry | 有效期 | text | 系统 |
| currency | 报价币种 | text | 系统 |
| purchaseMethod | 购买方式 | text | 系统 |
| items | 产品明细 | text | 系统 |
| discount | 折扣率 | text | 系统 |
| freight | 运保费 | text | 系统 |
| status | 报价状态 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |
| extra_phone | 联系电话 | text | 材料补充 |
| extra_brand | 生产厂家 | text | 材料补充 |
| extra_settlementCurrency | 产品结算币种 | text | 材料补充 |
| extra_quoteNumber | 报价编号 | text | 材料补充 |
| extra_subject | 报价主题 | text | 材料补充 |
| extra_contact | 客户联系人 | text | 材料补充 |
| extra_delivery | 预计货期 | text | 材料补充 |
| extra_terms | 付款及交付条款 | text | 材料补充 |
| extra_notes | 报价备注 | text | 材料补充 |
| items.productCode | 产品编码 | text | 系统 |
| items.model | 产品型号 | text | 系统 |
| items.description | 产品描述 | text | 系统 |
| items.quantity | 产品数量 | text | 系统 |
| items.price | 产品单价 | text | 系统 |

## orders（144）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| name | 订单名称 | text | 系统 |
| projectId | 关联项目 | text | 系统 |
| customerId | 关联客户 | text | 系统 |
| owner | 负责人 | text | 系统 |
| contract | 分公司合同号 | text | 系统 |
| supplierContract | 供方合同号 | text | 系统 |
| model | 产品型号 | text | 系统 |
| supplier | 供应商 | text | 系统 |
| sn | 产品 SN 码 | text | 系统 |
| date | 订单日期 | text | 系统 |
| amount | 成交金额 | text | 系统 |
| cost | 采购成本 | text | 系统 |
| freight | 运保费 | text | 系统 |
| commission | 佣金 | text | 系统 |
| otherCost | 其他费用 | text | 系统 |
| status | 履约状态 | text | 系统 |
| invoiceDate | 开票日期 | text | 系统 |
| shipDate | 发货日期 | text | 系统 |
| acceptDate | 验收日期 | text | 系统 |
| payments | 客户回款 | text | 系统 |
| supplierPayments | 供应商付款 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |
| extra_netTotal | NET价格合计（登记值） | number | 材料补充 |
| extra_netPrice | 商品净价（登记值） | number | 材料补充 |
| extra_vat | 增值税（登记值） | number | 材料补充 |
| extra_tariff | 关税（登记值） | number | 材料补充 |
| extra_financeFee | 财务费用（登记值） | number | 材料补充 |
| extra_untaxedCost | 不含税成本总额（登记值） | number | 材料补充 |
| extra_taxedCost | 含税成本总额（登记值） | number | 材料补充 |
| extra_grossProfit | 毛利润额（登记值） | number | 材料补充 |
| extra_grossMargin | 毛利润率（登记值） | number | 材料补充 |
| extra_dispatchCost | 收发货费用（登记值） | number | 材料补充 |
| extra_processingFee | 加工费（登记值） | number | 材料补充 |
| extra_otherFee1 | 其他费用一（登记值） | number | 材料补充 |
| extra_otherFee2 | 其他费用二（登记值） | number | 材料补充 |
| extra_otherFee3 | 其他费用三（登记值） | number | 材料补充 |
| extra_actualFreight | 实际运费及保险费（登记值） | number | 材料补充 |
| extra_bankFee | 银行手续费（登记值） | number | 材料补充 |
| extra_actualExchange | 实际汇差（登记值） | number | 材料补充 |
| extra_actualCost | 实际合同成本（登记值） | number | 材料补充 |
| extra_costDifference | 成本差额（登记值） | number | 材料补充 |
| extra_actualProfit | 实际利润（登记值） | number | 材料补充 |
| extra_actualMargin | 实际利润率（登记值） | number | 材料补充 |
| extra_bonusReference | 奖金参考值（登记值） | number | 材料补充 |
| extra_agencyBonusReference | 代理合同奖金参考值（登记值） | number | 材料补充 |
| extra_processing | 总部处理进度 | text | 材料补充 |
| extra_hkShipDate | 香港实际发货日 | date | 材料补充 |
| extra_bonusSettled | 奖金是否已结算 | text | 材料补充 |
| extra_contractStatus | 合同签署状态 | text | 材料补充 |
| extra_quoteRef | 关联报价编号 | text | 材料补充 |
| extra_signingCompany | 签约单位 | text | 材料补充 |
| extra_customerSigner | 客户签约人 | text | 材料补充 |
| extra_ourSigner | 我方签约人 | text | 材料补充 |
| extra_purchaseMethod | 购买方式 | text | 材料补充 |
| extra_specialTerms | 合同特殊条款 | text | 材料补充 |
| extra_foreignCompany | 外贸公司全称（英文） | text | 材料补充 |
| extra_foreignAddress | 外贸合同收货地址 | text | 材料补充 |
| extra_foreignContact | 外贸公司联系人 | text | 材料补充 |
| extra_foreignPhone | 外贸公司联系方式 | text | 材料补充 |
| extra_ledgerNumber | 分公司台账编号 | text | 材料补充 |
| extra_agencyContract | 代理流程合同 | text | 材料补充 |
| extra_noticeEmail | 接收通知邮箱 | text | 材料补充 |
| extra_orderConfirmedAt | 下单确认日期 | date | 材料补充 |
| extra_factoryExpectedAt | 原厂预计发货日 | date | 材料补充 |
| extra_factoryShippedAt | 原厂实际发货日 | date | 材料补充 |
| extra_arrivedAt | 国内到货日 | date | 材料补充 |
| extra_supplierInvoiced | 是否收齐供应商发票 | text | 材料补充 |
| extra_supplierUninvoiced | 供应商未开票金额 | number | 材料补充 |
| extra_supplierCurrency | 供应商支付币种 | text | 材料补充 |
| extra_branchOrdered | 是否分公司下单 | text | 材料补充 |
| extra_ordered | 是否已下单 | text | 材料补充 |
| extra_paid | 是否已付款 | text | 材料补充 |
| extra_arrived | 是否已到货 | text | 材料补充 |
| extra_factoryConfirmedAt | 厂商确认日期 | date | 材料补充 |
| extra_bonus | 奖金（登记值） | number | 材料补充 |
| extra_profit | 利润额（登记值） | number | 材料补充 |
| extra_profitRate | 利润率（登记值） | number | 材料补充 |
| extra_parentContract | 鼎信合同号 | text | 材料补充 |
| extra_externalNumber | 外部编号 | text | 材料补充 |
| extra_purchaseType | 采购单位分类 | text | 材料补充 |
| extra_region | 地区 | text | 材料补充 |
| extra_contact | 联系人 | text | 材料补充 |
| extra_externalAmount | 成交价（外购） | number | 材料补充 |
| extra_exchangeCorrection | 汇率差修正 | number | 材料补充 |
| extra_freightCorrection | 运保费修正 | number | 材料补充 |
| extra_hkStorage | 香港仓储费 | number | 材料补充 |
| extra_otherCostNote | 其他费用说明 | text | 材料补充 |
| extra_otherCostDate | 其他费用支付时间 | date | 材料补充 |
| extra_freightDate | 运保费支付日期 | date | 材料补充 |
| extra_customsFee | 清关费 | number | 材料补充 |
| extra_customsDate | 清关费支付日期 | date | 材料补充 |
| extra_supplierAmount | 供方合同金额 | number | 材料补充 |
| extra_supplierInvoiceDate | 供方开票时间 | date | 材料补充 |
| extra_purchaseOrderDate | 为用户下单时间 | date | 材料补充 |
| extra_bonusDate | 奖金结算时间 | date | 材料补充 |
| extra_bonusAmount | 奖金结算金额 | number | 材料补充 |
| extra_notes | 订单备注 | text | 材料补充 |
| extra_currency | 货币符号 | text | 材料补充 |
| extra_exchangeRate | 合同签署当日汇率 | number | 材料补充 |
| extra_effectiveDate | 合同生效日期 | date | 材料补充 |
| extra_deliveryDate | 约定交货日期 | date | 材料补充 |
| extra_paymentMethod | 付款方式 | text | 材料补充 |
| extra_advanceRatio | 预付款比例 | number | 材料补充 |
| extra_firstDueDate | 预计首款日期 | date | 材料补充 |
| extra_finalDueDate | 预计尾款日期 | date | 材料补充 |
| extra_firstDueAmount | 首款金额 | number | 材料补充 |
| extra_finalDueAmount | 尾款金额 | number | 材料补充 |
| extra_registration | 报备号 | text | 材料补充 |
| extra_installation | 是否需要安装 | text | 材料补充 |
| extra_invoiceType | 开票类型 | text | 材料补充 |
| extra_invoiceTitle | 发票抬头 | text | 材料补充 |
| extra_taxId | 税号 | text | 材料补充 |
| extra_invoiceAddress | 单位地址 | text | 材料补充 |
| extra_invoicePhone | 电话号码 | text | 材料补充 |
| extra_bank | 开户银行 | text | 材料补充 |
| extra_bankAccount | 银行账号 | text | 材料补充 |
| extra_shippingNumber | 发货运单号 | text | 材料补充 |
| extra_invoiceShippingNumber | 发票运单号 | text | 材料补充 |
| extra_firstPaymentNote | 首款情况 | text | 材料补充 |
| extra_finalPaymentNote | 尾款情况 | text | 材料补充 |
| extra_invoiceAmount1 | 第一次开票金额 | number | 材料补充 |
| extra_invoiceDate1 | 第一次开票时间 | date | 材料补充 |
| extra_invoiceAmount2 | 第二次开票金额 | number | 材料补充 |
| extra_invoiceDate2 | 第二次开票时间 | date | 材料补充 |
| extra_invoiceAmount3 | 第三次开票金额 | number | 材料补充 |
| extra_invoiceDate3 | 第三次开票时间 | date | 材料补充 |
| extra_shipmentComplete | 是否发齐 | text | 材料补充 |
| extra_items | 合同产品明细（型号 / 数量 / 单价） | text | 材料补充 |
| extra_contractFiles | 合同文件说明（附件见关联资料） | text | 材料补充 |
| extra_supplierInvoice1 | 供应商发票1编号 | text | 材料补充 |
| extra_supplierInvoiceAmount1 | 供应商发票1金额 | number | 材料补充 |
| extra_supplierInvoice2 | 供应商发票2编号 | text | 材料补充 |
| extra_supplierInvoiceAmount2 | 供应商发票2金额 | number | 材料补充 |
| extra_supplierInvoice3 | 供应商发票3编号 | text | 材料补充 |
| extra_supplierInvoiceAmount3 | 供应商发票3金额 | number | 材料补充 |
| extra_supplierInvoice4 | 供应商发票4编号 | text | 材料补充 |
| extra_supplierInvoiceAmount4 | 供应商发票4金额 | number | 材料补充 |
| attachments | 合同 / 服务附件 | text | 系统 |
| paymentAmount | 收付款金额 | text | 系统 |
| paymentDate | 收付款日期 | text | 系统 |
| paymentNote | 收付款备注 | text | 系统 |

## services（35）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| name | 服务主题 | text | 系统 |
| customerId | 关联客户 | text | 系统 |
| owner | 负责人 | text | 系统 |
| orderId | 关联订单 | text | 系统 |
| type | 服务类别 | text | 系统 |
| model | 设备型号 | text | 系统 |
| warranty | 保修期 | text | 系统 |
| date | 预约日期 | text | 系统 |
| status | 服务状态 | text | 系统 |
| tools | 提前准备工具 | text | 系统 |
| content | 服务要求 | text | 系统 |
| result | 服务记录与验收 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |
| extra_equipmentName | 设备名称 | text | 材料补充 |
| extra_quantity | 设备数量 | number | 材料补充 |
| extra_training | 是否需要培训 | text | 材料补充 |
| extra_contractNumber | 合同编号 | text | 材料补充 |
| extra_branchContract | 分公司合同编号 | text | 材料补充 |
| extra_requestedAt | 申请时间 | date | 材料补充 |
| extra_requester | 申请人 | text | 材料补充 |
| extra_contact | 联系人 | text | 材料补充 |
| extra_phone | 联系电话 | text | 材料补充 |
| extra_address | 服务地点 | text | 材料补充 |
| extra_brand | 产品品牌 | text | 材料补充 |
| extra_sn | 设备SN码 | text | 材料补充 |
| extra_purchaseDate | 购买日期 | date | 材料补充 |
| extra_startDate | 开始服务日期 | date | 材料补充 |
| extra_endDate | 完成服务日期 | date | 材料补充 |
| extra_engineer | 工程师 | text | 材料补充 |
| extra_cost | 服务费用 | number | 材料补充 |
| extra_acceptance | 客户验收意见 | text | 材料补充 |
| attachments | 合同 / 服务附件 | text | 系统 |

## inventory（51）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| owner | 负责人 | text | 系统 |
| name | 商品名称 | text | 系统 |
| model | 型号 | text | 系统 |
| brand | 生产厂家 | text | 系统 |
| category | 归属 | text | 系统 |
| location | 存放地点 | text | 系统 |
| condition | 产品状况 | text | 系统 |
| quantity | 库存总数量 | text | 系统 |
| price | 销售单价 | text | 系统 |
| cost | 采购价格 | text | 系统 |
| date | 入库日期 | text | 系统 |
| description | 物料描述 | text | 系统 |
| loans | 借还记录 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |
| extra_agreementDays | 协议周期（天） | number | 材料补充 |
| extra_dailyFee | 协议期内借用费（每天） | number | 材料补充 |
| extra_overdueFee | 超期借用费（每天） | number | 材料补充 |
| extra_purchaseNumber | 采购或入库单号 | text | 材料补充 |
| extra_mark | 标记 | text | 材料补充 |
| extra_internalNumber | 企业物料编号 | text | 材料补充 |
| extra_shanghaiCost | 上海成本 | number | 材料补充 |
| extra_sn | 产品序列号 | text | 材料补充 |
| extra_supplier | 供货单位 | text | 材料补充 |
| extra_invoice | 采购发票信息 | text | 材料补充 |
| attachments | 合同 / 服务附件 | text | 系统 |
| loans.company | 借用单位 | text | 系统 |
| loans.address | 借用地址 | text | 系统 |
| loans.contact | 联系人 | text | 系统 |
| loans.phone | 联系电话 | text | 系统 |
| loans.agreement | 借用协议编号 | text | 系统 |
| loans.deposit | 押金 | number | 系统 |
| loans.rent | 租金 | number | 系统 |
| loans.notes | 借用备注 | text | 系统 |
| loans.recipient | 收货人完整信息 | text | 系统 |
| loans.shippingNumber | 寄出运单号 | text | 系统 |
| loans.returnNumber | 归还运单号 | text | 系统 |
| loans.totalDays | 借用总天数（登记） | number | 系统 |
| loans.overdueDays | 逾期天数（登记） | number | 系统 |
| loans.normalFee | 协议期内借用费用 | number | 系统 |
| loans.overdueFee | 超期借用费用 | number | 系统 |
| loans.totalFee | 总费用（登记） | number | 系统 |
| loans.quantity | 借用数量 | number | 系统 |
| loans.attachments | 借用协议及寄还照片 | text | 系统 |
| loans.borrower | 借用人 | text | 系统 |
| loans.date | 借出日期 | date | 系统 |
| loans.dueDate | 预计归还日期 | date | 系统 |
| loans.returnedAt | 归还日期 | date | 系统 |
| loans.purpose | 借用用途 | text | 系统 |

## suppliers（25）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| owner | 负责人 | text | 系统 |
| name | 供应商单位 | text | 系统 |
| brand | 品牌 | text | 系统 |
| contact | 联系人 | text | 系统 |
| title | 职称 | text | 系统 |
| phone | 电话 / 微信 | text | 系统 |
| email | 邮箱 | text | 系统 |
| address | 地址 | text | 系统 |
| website | 官网 | text | 系统 |
| level | 合作级别 | text | 系统 |
| notes | 合作备注 | text | 系统 |
| attachments | 产品手册 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |
| extra_wechat | 微信 | text | 材料补充 |
| contacts | 其他联系人与关系 | text | 系统 |
| contacts.name | 联系人姓名 | text | 系统 |
| contacts.title | 联系人职称 | text | 系统 |
| contacts.phone | 联系人电话 | text | 系统 |
| contacts.email | 联系人邮箱 | text | 系统 |
| contacts.relation | 联系人关系 | text | 系统 |
| contacts.gender | 联系人性别 | text | 系统 |
| contacts.address | 联系人联系地址 | text | 系统 |

## knowledge（17）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| name | 资料标题 | text | 系统 |
| category | 资料分类 | text | 系统 |
| brand | 关联品牌 | text | 系统 |
| tags | 标签 | text | 系统 |
| owner | 作者 | text | 系统 |
| date | 日期 | text | 系统 |
| content | 正文 / 资料说明 | text | 系统 |
| url | 视频或参考链接 | text | 系统 |
| status | 状态 | text | 系统 |
| reviewNote | 审核意见 | text | 系统 |
| attachments | 资料附件 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |
| extra_application | 应用类别 | text | 材料补充 |
| extra_folder | 文件夹 | text | 材料补充 |

## communications（12）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| owner | 负责人 | text | 系统 |
| title | 沟通主题 | text | 系统 |
| method | 沟通方式 | text | 系统 |
| date | 沟通日期 | text | 系统 |
| content | 沟通内容 | text | 系统 |
| nextDate | 下次跟进日期 | text | 系统 |
| nextPlan | 下次跟进计划 | text | 系统 |
| attachments | 现场照片 / 附件 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |

## daily（9）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| date | 日志日期 | text | 系统 |
| owner | 负责人 | text | 系统 |
| administration | 行政工作 | text | 系统 |
| summary | 工作总结 | text | 系统 |
| plan | 后续计划 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |

## expenses（15）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| name | 费用标题 | text | 系统 |
| date | 费用日期 | text | 系统 |
| owner | 负责人 | text | 系统 |
| category | 费用类别 | text | 系统 |
| amount | 金额 | text | 系统 |
| note | 说明 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |
| extra_paidAt | 实际支付日期 | date | 材料补充 |
| extra_paymentAccount | 支付账户 | text | 材料补充 |
| extra_recipient | 收款方 | text | 材料补充 |
| extra_invoice | 票据信息 | text | 材料补充 |
| extra_notes | 费用说明 | text | 材料补充 |

## activities（11）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| name | 活动标题 | text | 系统 |
| owner | 负责人 | text | 系统 |
| date | 发生日期 | text | 系统 |
| category | 类别 | text | 系统 |
| content | 活动内容 | text | 系统 |
| result | 结果 | text | 系统 |
| attachments | 附件 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |

## resources（14）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| name | 资料名称 | text | 系统 |
| owner | 维护人 | text | 系统 |
| date | 资料日期 | text | 系统 |
| category | 资料类别 | text | 系统 |
| content | 资料说明 | text | 系统 |
| code | 代码或币种 | text | 系统 |
| rate | 汇率或税率 | text | 系统 |
| scope | 共享范围 | text | 系统 |
| attachments | 附件 | text | 系统 |
| deleted | 已删除 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |

## dashboard（11）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| owner | 负责人 | text | 系统 |
| brand | 产品品牌 | text | 系统 |
| source | 来源 | text | 系统 |
| leadCount | 新增线索统计 | text | 系统 |
| projectCount | 在跟项目统计 | text | 系统 |
| expectedAmount | 预期金额统计 | text | 系统 |
| wonRate | 线索成单率统计 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |

## reports（14）

| 字段 key | 显示名称 | 类型 | 来源 |
| --- | --- | --- | --- |
| owner | 负责人 | text | 系统 |
| brand | 产品品牌 | text | 系统 |
| source | 来源 | text | 系统 |
| leads | 线索数 | text | 系统 |
| projects | 项目数 | text | 系统 |
| won | 成单数 | text | 系统 |
| rate | 成单率 | text | 系统 |
| records | 沟通数 | text | 系统 |
| budget | 预算总额 | text | 系统 |
| expected | 预期金额 | text | 系统 |
| createdBy | 创建人 | text | 系统 |
| createdAt | 创建时间 | date | 系统 |
| updatedBy | 更新人 | text | 系统 |
| updatedAt | 更新时间 | date | 系统 |