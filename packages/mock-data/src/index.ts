import { recordKinds } from "@dfx-crm/core/records";
import type { State } from "@dfx-crm/core/domain";
import { emptyCustomer, owners, today } from "@dfx-crm/core/domain";

export function relativeDay(offset: number) {
  const d = new Date(`${today()}T12:00:00+08:00`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
}

export function createSeed(): State {
  const companies = [
    "华东理工大学",
    "复旦大学",
    "上海交通大学",
    "中国科学院上海光机所",
    "浙江大学",
    "苏州光研科技",
    "南京大学",
    "华中科技大学",
    "同济大学",
    "合肥先进研究院",
    "西安交通大学",
    "宁波精光技术",
    "南方科技大学",
    "四川大学",
    "北京理工大学",
    "杭州微纳光电",
    "天津大学",
    "深圳光电研究所",
  ];
  const names = [
    "陈明",
    "林悦",
    "周远",
    "王宁",
    "赵思",
    "吴越",
    "许然",
    "郑宇",
    "宋晴",
    "何川",
    "沈林",
    "陆言",
    "顾辰",
    "徐可",
    "唐悦",
    "江源",
    "范云",
    "程一",
  ];
  const brands = [
    "Andor",
    "Semrock",
    "Cobolt",
    "SmarAct",
    "Spectrogon",
    "Oxford",
    "Lumencor",
    "IDQ",
  ];
  const applications = [
    "成像",
    "拉曼",
    "量子",
    "超快光谱",
    "生物光子学",
    "光电流",
  ];
  const projectNames = [
    "高灵敏光谱成像系统",
    "拉曼滤光片升级",
    "532nm 窄线宽激光器",
    "纳米精密定位平台",
    "红外带通滤光片采购",
    "低温量子测量平台",
    "多通道荧光照明系统",
    "单光子探测实验平台",
    "近红外光谱检测系统",
    "共聚焦显微系统升级",
    "激光稳频实验平台",
    "微纳操控演示系统",
    "生物荧光成像方案",
    "超快光谱实验平台",
    "量子光源系统",
    "滤光片补充采购",
  ];
  const customers = companies.map((company, i) => ({
    ...emptyCustomer(),
    id: `KH-2026${String(i + 1).padStart(4, "0")}`,
    company,
    name: names[i],
    title:
      i % 3 === 0
        ? "教授 / 课题组负责人"
        : i % 3 === 1
          ? "研究员"
          : "采购工程师",
    phone: `1380000${String(i + 1).padStart(4, "0")}`,
    email: `contact${i + 1}@example.com`,
    region: ["上海", "浙江", "江苏", "北京"][i % 4],
    address: "科研园区（演示地址）",
    category:
      company.includes("科技") || company.includes("光电")
        ? "OEM"
        : company.includes("大学")
          ? "高校"
          : "研究所",
    application: applications[i % 6],
    owner: i >= 16 ? "公共池" : owners[i % 8],
    source: i % 3 === 0 ? "自己新建" : "星谱咨询",
    tags: [applications[i % 6], i % 4 === 0 ? "重点客户" : "科研用户"],
    pool: i >= 16,
    poolReason: i >= 16 ? "本期预算暂缓，等待新的采购计划" : "",
    createdAt: `${relativeDay(-55 + i)} 09:30:00`,
    updatedAt: `${relativeDay(-i % 5)} 14:20:00`,
    notes: "演示资料：联系人、联系方式和业务记录均为虚构，用于评审流程。",
    invoiceTitle: company,
    contacts: [
      {
        id: `CT-${i}`,
        name: names[i],
        title: "主要联系人",
        phone: `1380000${String(i + 1).padStart(4, "0")}`,
        email: `contact${i + 1}@example.com`,
        relation: "负责人",
      },
    ],
  }));
  const projects = projectNames.map((name, i) => ({
    id: `XM-2026${String(i + 1).padStart(4, "0")}`,
    name,
    customerId: customers[i].id,
    leadId: `XS-2026${String(i + 1).padStart(4, "0")}`,
    owner: owners[i % 8],
    brand: brands[i % 8],
    model: [
      "Kymera 328i",
      "LP02-633RU-25",
      "05-01 532nm",
      "SLC-1730",
      "BP-1200",
      "Optistat",
      "SPECTRA X",
      "ID230",
    ][i % 8],
    application: applications[i % 6],
    budget: [
      286000, 38000, 128000, 196000, 56000, 880000, 168000, 328000, 96000,
      238000, 78000, 185000, 42000, 360000, 246000, 17600,
    ][i],
    probability: [
      70, 50, 90, 20, 10, 50, 70, 20, 100, 50, 10, 20, 90, 0, 70, 100,
    ][i],
    stage: [70, 50, 90, 20, 10, 50, 70, 20, 100, 50, 10, 20, 90, 0, 70, 100][i],
    status: [8, 15].includes(i) ? "已成单" : "跟进中",
    target: "为客户搭建稳定、可扩展的科研实验系统，满足年度项目验收要求。",
    system:
      "现有光路为激光激发、样品平台及光谱采集模块，需要兼容现有控制接口。",
    needs: "提升检测灵敏度与信噪比，保证交付周期，并安排现场安装培训。",
    recommendation: `${brands[i % 8]} 方案：接口兼容、成熟售后；需进一步确认交期。`,
    competitor: "同类品牌方案：正在对比参数与总成本。",
    purchaseDate: relativeDay(20 + i),
    purchaseMethod: i % 3 ? "内购（含税购买）" : "公开招标",
    useDate: relativeDay(60 + i),
    nextDate: relativeDay(i < 3 ? -i - 1 : i < 8 ? 0 : i - 7),
    nextPlan: [
      "确认技术参数及交期",
      "发送更新版报价",
      "跟进合同与付款安排",
      "安排方案沟通会议",
    ][i % 4],
    createdAt: `${relativeDay(-30 + i)} 10:00:00`,
    reason: "",
    orderNumber: [8, 15].includes(i) ? `HT-2026${i}` : "",
    attachments: [],
  }));
  const leads = Array.from({ length: 26 }, (_, i) => ({
    id: `XS-2026${String(i + 1).padStart(4, "0")}`,
    name: projectNames[i % 16],
    customerId: customers[i % 18].id,
    owner: i >= 23 ? "待分配" : owners[i % 8],
    source: i % 3 === 0 ? "自己新建" : "星谱咨询",
    sourceDetail:
      i % 3 === 0
        ? ["销售开发", "用户推介", "友商推介"][((i % 9) / 3) | 0]
        : i % 2
          ? "官网留言"
          : "星谱电话",
    referrer: i % 3 === 0 && i % 9 !== 0 ? "王老师（演示）" : "",
    brand: brands[i % 8],
    content: "客户咨询产品选型，希望获取技术参数、交期及报价。",
    judgement: i < 16 ? "有机会" : "有咨询",
    status: i >= 23 ? "待分配" : [8, 15].includes(i) ? "已成单" : "跟进中",
    createdAt: `${relativeDay(-35 + i)} 09:30:00`,
    projectId: i < 16 ? projects[i].id : undefined,
  }));
  const communications = projects.flatMap((p, i) => [
    {
      id: `GT-${i}-1`,
      projectId: p.id,
      customerId: p.customerId,
      owner: p.owner,
      date: `${relativeDay(-7 + (i % 3))} 10:30:00`,
      method: "电话/语音",
      title: "首次需求确认",
      content:
        "与客户确认实验需求、现有系统及预算范围，已发送产品参数和初步配置建议。",
      nextDate: p.nextDate,
      nextPlan: p.nextPlan,
      attachments: [],
    },
    {
      id: `GT-${i}-2`,
      projectId: p.id,
      customerId: p.customerId,
      owner: p.owner,
      date: `${relativeDay(i % 4 === 0 ? 0 : -1)} ${String(9 + (i % 8)).padStart(2, "0")}:20:00`,
      method: i % 2 ? "微信" : "线上会议",
      title: "方案与交期沟通",
      content:
        "客户认可当前方案，下一步补充参数对比并确认采购时间。已记录当前技术问题，安排供应商协助答复。",
      nextDate: p.nextDate,
      nextPlan: p.nextPlan,
      attachments: [],
    },
  ]);
  const quotes = [0, 1, 2, 8].map((index, i) => ({
    id: `BJ-202610${i + 1}`,
    name: `${projects[index].brand} 设备报价`,
    projectId: projects[index].id,
    customerId: projects[index].customerId,
    owner: projects[index].owner,
    date: relativeDay(-i - 1),
    expiry: relativeDay(30),
    currency: "CNY",
    purchaseMethod: "内购（含税购买）",
    items: [
      {
        id: `ITEM-${i}`,
        model: projects[index].model,
        description: projects[index].name,
        quantity: 1,
        price: projects[index].budget,
      },
    ],
    discount: 0,
    freight: 0,
    status: i < 2 ? "已发送" : "客户确认",
  }));
  const orders = [2, 8, 15].map((index, i) => ({
    id: `DD-202610${i + 1}`,
    name: projects[index].name,
    projectId: projects[index].id,
    customerId: projects[index].customerId,
    owner: projects[index].owner,
    date: relativeDay(-10 - i),
    contract: `HT2026100${i + 1}`,
    supplierContract: `DXHT2026100${i + 1}`,
    model: projects[index].model,
    supplier: projects[index].brand,
    sn: `DEMO-SN-${i + 1}`,
    amount: projects[index].budget,
    cost: projects[index].budget * 0.68,
    freight: 800,
    commission: 1200,
    otherCost: 0,
    payments: [
      {
        id: `PAY-${i}`,
        date: relativeDay(-5),
        amount: projects[index].budget * (i === 0 ? 0.3 : 1),
        note: i === 0 ? "预付款" : "全款",
      },
    ],
    supplierPayments: [
      {
        id: `SPAY-${i}`,
        date: relativeDay(-7),
        amount: projects[index].budget * 0.68,
        note: "供应商货款",
      },
    ],
    status: i === 0 ? "待发货" : "已完成",
    invoiceDate: i === 0 ? "" : relativeDay(-3),
    shipDate: i === 0 ? "" : relativeDay(-4),
    acceptDate: i === 0 ? "" : relativeDay(-1),
  }));
  const state: State = {
    version: 1,
    customers,
    leads,
    projects,
    communications,
    quotes,
    orders,
    services: [
      {
        id: "FW-20261001",
        name: "光谱系统现场安装与培训",
        customerId: customers[8].id,
        orderId: orders[1].id,
        owner: "杨工厂",
        type: "售后安装",
        date: relativeDay(1),
        model: "Kymera 328i",
        warranty: 12,
        tools: "功率计、校准光源、连接线",
        content: "安装调试并为课题组提供操作培训。",
        result: "",
        status: "待服务",
      },
    ],
    inventory: [
      "532nm 激光器样机",
      "633nm 拉曼滤光片",
      "纳米定位演示平台",
      "光功率计",
      "光纤耦合支架",
    ].map((name, i) => ({
      id: `KC-00${i + 1}`,
      name,
      brand: brands[i],
      model: ["0532-05-01", "LP02-633RU-25", "SLC-1730", "PM100", "FC-01"][i],
      category: i < 3 ? "销售样机" : "安装物料",
      location: ["上海样机室", "上海仓库", "杭州办事处"][i % 3],
      condition: "良好",
      price: [76000, 5800, 182000, 8600, 1200][i],
      cost: [48000, 3500, 132000, 6000, 800][i],
      quantity: i === 1 ? 8 : 2,
      date: relativeDay(-30),
      description: "演示库存，借还会更新可用数量。",
      loans:
        i === 0
          ? [
              {
                id: "JY-001",
                borrower: "张杰",
                quantity: 1,
                date: relativeDay(-8),
                dueDate: relativeDay(-1),
                returnedAt: "",
                purpose: "客户现场演示",
              },
            ]
          : [],
    })),
    suppliers: brands.map((brand, i) => ({
      id: `GY-00${i + 1}`,
      name: `${brand} 产品供应商`,
      brand,
      contact: ["Alex", "Emma", "David", "Sophia"][i % 4],
      title: "区域销售经理",
      phone: "010-00000000",
      email: `sales${i}@example.com`,
      address: "供应商地址待维护",
      website: "",
      level: i < 3 ? "核心合作" : "常规合作",
      notes: `${applications[i % 6]}相关产品，支持选型与技术资料。`,
      attachments: [],
    })),
    knowledge: [
      {
        id: "ZS-001",
        name: "拉曼光谱系统的滤光片选型指南",
        category: "产品知识",
        brand: "Semrock",
        tags: ["拉曼", "选型指南"],
        owner: "樊淼",
        date: relativeDay(-2),
        content:
          "选择拉曼滤光片时，首先确定激发波长、入射角、通带及截止深度。\n\n方案沟通清单：\n1. 明确激光波长和波长稳定性。\n2. 确认样品及需要观测的拉曼位移。\n3. 核对光路入射角与安装尺寸。\n4. 记录预算及交付时间。\n\n此文为原型演示资料，技术参数以厂商手册为准。",
        url: "",
        status: "已发布",
        reviewNote: "",
        attachments: [],
      },
      {
        id: "ZS-002",
        name: "从客户需求到可落地的成像方案",
        category: "应用方案",
        brand: "Andor",
        tags: ["成像", "案例分享"],
        owner: "杨林伟",
        date: relativeDay(-3),
        content:
          "从目标信号、曝光时间、视场和数据处理需求出发，逐项确认系统约束，再推荐相机及光谱仪配置。",
        url: "",
        status: "已发布",
        reviewNote: "",
        attachments: [],
      },
      {
        id: "ZS-003",
        name: "第一次客户拜访：六个有效问题",
        category: "销售技巧",
        brand: "",
        tags: ["客户拜访"],
        owner: "张杰",
        date: relativeDay(-1),
        content:
          "了解研究目标、当前方案、遇到的难点、预算来源、采购时间和决策流程。会后及时形成沟通记录与下一次跟进计划。",
        url: "",
        status: "待审核",
        reviewNote: "",
        attachments: [],
      },
    ],
    audit: [
      {
        id: "LOG-001",
        date: `${today()} 09:00:00`,
        owner: "董福星",
        action: "查看工作台",
        target: "销售概览",
        sensitive: false,
      },
    ],
    daily: [],
    expenses: [
      {
        id: "CB-001",
        date: relativeDay(-3),
        owner: "李金蔓",
        category: "市场推广",
        amount: 8000,
        note: "展会及宣传资料（演示）",
      },
      {
        id: "CB-002",
        date: relativeDay(-5),
        owner: "董福星",
        category: "差旅报销",
        amount: 2600,
        note: "客户现场拜访（演示）",
      },
    ],
    activities: [],
    resources: [],
    dictionaries: {
      brands,
      applications,
      categories: ["高校", "研究所", "OEM", "中间商"],
    },
  };
  for (const kind of recordKinds)
    (state as any)[kind] = (state[kind] as any[]).map((r) => ({
      ...r,
      createdBy: r.owner || owners[0],
      createdAt: r.createdAt || r.date || today(),
      updatedBy: r.owner || owners[0],
      updatedAt: r.updatedAt || r.createdAt || r.date || today(),
    }));
  return state;
}
