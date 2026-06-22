export const meta = {
  name: 'fix-batch1-newui',
  description: '并行修复审查发现的前端显示/UX/缺失功能(7个agent各管一文件,互不冲突)',
  phases: [{ title: 'Fix', detail: '每文件一个 Opus agent,按精确指令修' }],
}

const S = '/Users/a1/Desktop/qfk/frontend/app/src';

const TASKS = [
  {
    key: 'ProductDetail', file: S + '/screens/ProductDetail.jsx',
    fixes:
      '1) 起购/限购对用户可见:在「购买数量」QuantityStepper 旁/下加灰色小字 —— minBuy>1 显示「N 件起购」;maxBuy 有限显示「每单最多 N 件」;卡密类受库存约束时显示「仅剩 N 件」。命中上下限时该提示标橙强调。变量 minBuy/maxBuy/effMax/p.stock 已存在,直接用。\n' +
      '2) 已生效优惠券加「移除」入口:券验证成功(appliedCoupon 非空)后,在「优惠券已生效」绿字旁加可点「移除」链接,onClick 清空 couponCode 与 appliedCoupon(触发重新试算)。\n' +
      '3) 章节加载失败态:目前 chapters 加载中与失败都置 null 显示「正在加载章节目录…」。新增一个 chaptersErr 状态:catch 时 setChaptersErr(true);渲染时 chaptersErr 显示「章节目录加载失败,点此重试」(点击重新请求 api.productChapters),而非永远「加载中」。\n' +
      '注意:不要改动金额/试算/下单(checkoutPreview/createOrder)逻辑与 hook 顺序(已修正,勿动)。',
  },
  {
    key: 'StorefrontHome', file: S + '/screens/StorefrontHome.jsx',
    fixes:
      '1) 分类+排序筛选栏吸顶:给包裹「分类 chips + 综合/销量/上新/价格 排序」的容器加 position:sticky; top:var(--topbar-h,60px); zIndex:14; 背景 rgba(255,255,255,.92)+backdropFilter blur(8px),避免滚动时与商品串字。\n' +
      '2) 底部 tab 去死按钮:现 5 个 tab 仅「客服」可点。给其余加真实行为 —— 「首页」=window.scrollTo(0,0);「宝贝」=滚动到商品网格(可给网格容器加 ref 或 id 然后 scrollIntoView);「新品」=setSort(\'上新\');「门店」=滚动到店招/打开联系弹窗(setShowContact(true) 亦可)。全部 cursor:pointer。\n' +
      '3) 底部 nav 与外层容器底部 padding 叠加 env(safe-area-inset-bottom),避免 iOS 全面屏贴边。\n' +
      '4) 桌面网格 minmax(160px)→minmax(176px),避免宽屏一行过多过小卡片。\n' +
      '注意:不要改分类筛选/搜索/排序的数据逻辑,只加吸顶样式与 tab 行为。',
  },
  {
    key: 'OrderLookup', file: S + '/screens/OrderLookup.jsx',
    fixes:
      '1) 资源下载链 URL 修正:下载按钮 href 现为 `BASE + r.download_url`。改为判断:若 download_url 以 http 开头则直接用,否则才拼 BASE。\n' +
      '2) 桌面端不要大片空白:容器 maxWidth 由 600 在宽屏放宽(如桌面 ≥960 时用 maxWidth:900),结果卡与知识阅读器可利用更多宽度;空查单表单态可在卡片下方补一段「查单帮助/防诈骗提示」减少留白。\n' +
      '3) 错误态文案随凭证模式:密码查单(mode=password)失败时正文说「请核对订单号与查单密码」,而非写死「邮箱」;或直接用后端 error 文案作主文案,去掉写死「邮箱」措辞与多余括号拼接。\n' +
      '4) 风险提示兜底:OrderQueryTips 在 queryTips 为空时整条不渲染。改为给一句默认兜底文案(如「官方查单仅需订单号+邮箱/查单密码,切勿向他人透露验证码或额外付款」),保证总有安全提示。\n' +
      '5) 投诉「问题描述」改多行 textarea(现为单行 Input),便于输入长描述。\n' +
      '注意:不要改查单/取卡/复制/四类型交付的核心逻辑,只做上述 UX 修正。',
  },
  {
    key: 'Portal', file: S + '/screens/Portal.jsx',
    fixes:
      '1) 图标去重:入口宫格里「禁售目录」和「商家中心」都用了 Lock,数据卡「入驻商家」与宫格「进入商城」都用 Package。改为各入口唯一图标(只用 Icons 里已存在的:Package/Search/Headset/Megaphone/Lock/ShieldCheck/Star/Inbox/RefreshCw/Zap/Mail/Phone/QrCode 等)。建议:入驻商家=ShieldCheck、进入商城=Package、商家中心=Star、禁售目录=Lock、常见问题=Headset、订单查询=Search、最新资讯=Megaphone、开通小店=Zap。确保宫格内无重复图标。\n' +
      '2) 去重复入口:宫格里的「最新资讯」与页面底部独立「最新资讯」列表区重复。把宫格里的「最新资讯」项去掉(底部已有列表),其余入口保留。\n' +
      '3) 三联数据卡零态:platformStats().catch 现在静默吞错,卡片永远显示「—」。改为 catch 时 setStats({merchants:0,products:0,orders:0})(显示 0 而非占位破折号);并在 stats 未加载时显示一个轻量加载态(如骨架或「…」)区别于失败。\n' +
      '4) 资讯列表项补摘要(a.summary,1行截断)与分类徽标(a.category,若有);空态文案保留但可加「敬请期待」。\n' +
      '注意:导航回调(onEnterShop/onLookup/onNews/onFaq/onForbidden/openConsole)不要动。',
  },
  {
    key: 'PaymentScreen', file: S + '/screens/PaymentScreen.jsx',
    fixes:
      '1) 过期态按钮一致:倒计时过期(expired=true)时,底部「确认支付」主按钮改为禁用或文案「已过期 · 返回重新下单」并 onClick=onBack,避免「提示已过期但按钮仍可点照付」的矛盾。(handlePay 内部逻辑不用改,只改按钮在 expired 时的呈现与行为。)\n' +
      '2) 二维码诚实化:当前展示的是占位矢量图标(Icons.QrCode)+文案「二维码有效,等待扫码」,但实际是 window.open(pay.url) 跳转收银台、无真实可扫码。把该区文案改为诚实表述:如「点击下方按钮前往收银台完成支付」,并把占位「二维码」区改为一个「前往支付」说明块(去掉「等待扫码」误导)。不要谎称可扫码。\n' +
      '3) 担保文案去夸大:把「持牌第三方加密通道」等无法证实的措辞改为可核实表述(如「平台担保交易 · 付款后卡密自动发放」)。\n' +
      '注意:支付状态机/pollDelivery/onPaid/4002/4003 逻辑一律不动,只改过期按钮呈现与二维码/担保文案。',
  },
  {
    key: 'MerchantProducts', file: S + '/console/merchant/Products.jsx',
    fixes:
      '1) 限时折扣价校验(关键,金额纪律):submit() 现在只校验标题与 price>0。增加:若填了限时折扣价 discount_price,则必须 >0 且 < 售价 price;若填了折扣起止时间,则 start < end。任一不满足 setFormError 阻止提交,并在对应输入下给红字提示。用整数分或 Number 比较,避免浮点误差。\n' +
      '2) 编辑态锁定商品类型:goods_type 类型选择器在 editing(编辑已存在商品)时置为只读/禁用(展示当前类型,不可切换),仅新建可选 —— 因为卡密/知识/资源发货机制不同,切换会与已有卡密/章节错配。\n' +
      '3) 列表搜索/筛选:商品列表 Toolbar 现仅「刷新」。增加 关键词搜索(按标题/SKU 前端过滤 rows)+ 商品类型筛选 + 状态筛选(在售/下架)。纯前端 filter 现有 rows 即可。\n' +
      '注意:不要改下单/卡密发放相关后端调用;折扣校验是前端表单校验,务必正确(< 售价、起<止)。',
  },
  {
    key: 'InputEye', file: '/Users/a1/Desktop/qfk/frontend/design-system/components/core/Input.jsx',
    fixes:
      '给 Input 组件支持 type=password 的「显隐眼睛」:当 props.type==="password" 时,在输入框右侧渲染一个眼睛按钮(用内联 SVG 或简单字符),点击在 password/text 间切换显示。保持组件现有 API、样式、其它行为不变(label/icon/error/后缀等);眼睛按钮不破坏现有右侧 icon/suffix 布局。这是 design-brief 附录C 强制要求(密码框带显隐眼睛),全站密码输入受益(登录/注册/查单密码)。\n' +
      '注意:这是共享设计系统组件,务必向后兼容 —— 非 password 类型行为完全不变;不要改变 onChange/value 等受控逻辑。',
  },
];

const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    file: { type: 'string' },
    applied: { type: 'array', items: { type: 'string' }, description: '逐条做了哪些修改' },
    skipped: { type: 'array', items: { type: 'string' }, description: '没做/做不了的及原因' },
    risk: { type: 'string', description: '可能的回归风险' },
  },
  required: ['file', 'applied'],
};

const results = await parallel(TASKS.map((t) => () =>
  agent(
    '你要修一个 React 文件,按下面**精确指令**做修改(只做这些,别扩大范围)。先 Read 整个文件理解上下文,再用 Edit 做最小改动,保证可编译、保留所有现有逻辑。不要跑 build/git。\n\n' +
    '### 文件\n' + t.file + '\n\n### 要做的修改\n' + t.fixes + '\n\n' +
    '### 硬性要求\n- 只改上面列的点,其它一律不动;尤其金额/卡密/支付/下单的计算与请求逻辑不要改。\n- 配色全走 CSS 变量(橙色 token),不得引入硬编码蓝/靛/紫。\n- 改完确保 JSX 合法、无未定义变量/缺失 import。\n- 用 StructuredOutput 返回 applied(逐条)/skipped/risk。',
    { label: 'fix:' + t.key, phase: 'Fix', schema: SCHEMA, agentType: 'claude', model: 'opus' }
  )
));
return results.filter(Boolean);
