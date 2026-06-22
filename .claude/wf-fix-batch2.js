export const meta = {
  name: 'fix-batch2-backoffice',
  description: '并行修复后台前端可做的缺失功能(8 agent 各管一文件)',
  phases: [{ title: 'Fix', detail: '每文件一个 Opus agent' }],
}
const S = '/Users/a1/Desktop/qfk/frontend/app/src';
const TASKS = [
  {
    key: 'MerchantComplaints', file: S + '/console/merchant/Complaints.jsx',
    fixes: '1) 加状态筛选:参照同目录 Orders.jsx 的状态筛选(pill/Button 切换),用已定义的 5 态(待处理/已回复/平台介入中/已解决/已驳回)做 FILTER,选中调 api.complaints({status})(后端已支持 status 入参),默认高亮「待处理」。2) 回复输入由单行 Input 改多行 textarea(4-6行)。3) 列表加「投诉时间」列(create_time);回复弹窗内若已有 merchant_reply 用只读块展示「我的上次回复」,有 admin_remark 时展示「平台裁决备注」。先 Read 本文件 + Orders.jsx 对齐风格。',
  },
  {
    key: 'AdminSettings', file: S + '/console/admin/Settings.jsx',
    fixes: '费率字段(default_commission_rate / withdraw_fee_rate)金融高危:1) 进页把后端已存值回填到输入框 value(而非仅 placeholder),旁边以「当前 5%」形式显示换算百分比。2) 保存前校验:必须是 0~1 之间的小数(如 0.05),超范围或非数字 setError 阻止提交并红字提示(杜绝误填 5 当 500%)。先 Read 本文件了解现有 config 保存逻辑,只加回填+校验,不改保存接口。',
  },
  {
    key: 'AdminMerchants', file: S + '/console/admin/Merchants.jsx',
    fixes: '加「新建商户」功能(api.createMerchant 已存在,见 console/api.js)。在 Panel 的 actions 或 Toolbar 加「新建商户」按钮(Icons.Plus),点开 Modal 收集 用户名/密码/店名/店铺标识slug/邀请码(可选)/初始抽佣率,提交调 api.createMerchant 后 list.reload()。先 Read 本文件 + console/api.js 确认 createMerchant 签名;复用本页已有 Modal/Input/Field 风格。',
  },
  {
    key: 'AdminChannels', file: S + '/console/admin/Channels.jsx',
    fixes: '支付渠道「验签自测」补排障详情:当前只给通过/未通过 Pill。改为:验签测试返回结果里若含 签名串/待签名串/错误详情,在结果区(可折叠)展示出来(等宽 mono 字体),失败时显示具体原因,方便排查。先 Read 本文件看现有验签测试的调用与返回结构,只增强结果展示,不改测试接口。若返回无详情字段,则至少把失败 Pill 旁补一句可读错误文案。',
  },
  {
    key: 'MerchantCoupons', file: S + '/console/merchant/Coupons.jsx',
    fixes: '1) 列表加「有效期」列展示 valid_from~valid_to。2) 状态列派生「已过期」(now>valid_to)与「未开始」(now<valid_from),用 neutral/pending Pill 区分,不要把已过期券显示成绿色「启用」。3) Toolbar 加 状态下拉(全部/启用/停用/已过期)+ 类型下拉(满减/折扣)+ 券码搜索,前端 filter 现有 rows。4) used 列兜底 Number(r.used)||0 避免 undefined。先 Read 本文件。仅前端,不改后端。',
  },
  {
    key: 'MerchantWallet', file: S + '/console/merchant/Wallet.jsx',
    fixes: '1) 提现申请弹窗:收款信息由单行 Input 改为结构化——收款方式单选(支付宝/银行卡/微信)+ 按方式展开 账号/户名(银行卡加开户行)字段,拼成 account_info 提交;手机/账号做基本非空校验。2) 提现申请提交走二次确认(展示金额+收款方式)。3) 资金流水加「类型(已定义的 FUND_TYPE 4类)+ 状态」前端筛选。注意:手续费试算需后端费率,若本页已有费率字段就展示「预计到账」,没有则跳过该点(写进 skipped)。先 Read 本文件。不改金额计算后端逻辑。',
  },
  {
    key: 'AdminComplaints', file: S + '/console/admin/Complaints.jsx',
    fixes: '1) 投诉列表补分页(参照同目录 RiskRecords.jsx 的 page state + Pager + api 传 page)。2) 裁决弹窗带入完整证据上下文:在弹窗里(裁决前)展示该投诉的 买家原始描述、商户回复(merchant_reply)、订单号/金额/商品 等已有字段(从 row 取),让裁决基于证据;退款勾选默认不勾、驳回备注必填。先 Read 本文件确认 row 上有哪些字段可展示。统计卡口径若依赖后端聚合则不强改(写进 skipped),只做分页+证据上下文+必填校验。',
  },
  {
    key: 'AdminProductsXshop', file: S + '/console/admin/Products.jsx',
    fixes: '1) 「类型」列由二分(自动发卡/手动发货)改为按 goods_type 展示四类型(1卡密/2知识/3资源/4权益)的中文 Pill;发货方式如需要另起一列或合并说明。2) 库存=0 仍在售的商品行,在库存或商品列加「缺货」红色角标/警示。3) Panel 上方加统计卡:商品总数/在售/下架/缺货数(用 total + 列表状态/库存计数)。先 Read 本文件。仅只读视图增强,不加写操作。注意上一轮已把本页 --color-* 变量修正,不要回退。',
  },
];
const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { file: { type: 'string' }, applied: { type: 'array', items: { type: 'string' } }, skipped: { type: 'array', items: { type: 'string' } }, risk: { type: 'string' } },
  required: ['file', 'applied'],
};
const results = await parallel(TASKS.map((t) => () =>
  agent(
    '修一个 React 文件,按**精确指令**做(只做这些)。先 Read 整个文件(及指令里提到的参照文件/api.js)理解上下文,再用 Edit 最小改动,保证可编译、保留所有现有逻辑、配色走橙色 CSS 变量(无硬编码蓝/靛/紫)。不要跑 build/git。\n\n### 文件\n' + t.file + '\n\n### 要做的修改\n' + t.fixes + '\n\n### 硬性要求\n- 只改上面列的点;金额/卡密/支付/下单的计算与请求逻辑一律不动。\n- 接后端接口前先在 console/api.js 确认方法存在与签名;不存在就写进 skipped 不要臆造。\n- 改完确保 JSX 合法、无未定义变量/缺失 import。\n- 用 StructuredOutput 返回 applied/skipped/risk。',
    { label: 'fix2:' + t.key, phase: 'Fix', schema: SCHEMA, agentType: 'claude', model: 'opus' }
  )
));
return results.filter(Boolean);
