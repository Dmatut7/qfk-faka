export const meta = {
  name: 'fix-batch3-final',
  description: '前端可做项收尾(卡密导出/章节弹窗/满减时间/店铺主题预览)',
  phases: [{ title: 'Fix', detail: '每文件一个 Opus agent' }],
}
const S = '/Users/a1/Desktop/qfk/frontend/app/src';
const TASKS = [
  {
    key: 'Cards', file: S + '/console/merchant/Cards.jsx',
    fixes: '1) 卡密列表面板加「导出」按钮(Kit MCards 有导入+导出两个按钮):前端把当前已加载的卡密行导出为 CSV(含脱敏卡密/状态/批次/时间等已展示字段),用 Blob + a[download] 触发下载,文件名含商品名+时间。不调后端。2) 统计卡 label 跟随 codeNoun:权益类商品时显示「未售权益码/已售权益码…」而非硬编码「未售/已售」(codeNoun 变量已存在,用它拼 label)。先 Read 本文件。不改卡密发放/导入后端逻辑。',
  },
  {
    key: 'ChaptersModal', file: S + '/console/merchant/ChaptersModal.jsx',
    fixes: '1) 章节加载失败态:当前 catch 把错误吞成空数组(看起来像"暂无章节")。新增 error 状态,catch 时置 error,渲染时显示「加载失败,点此重试」按钮(重新拉取),区别于真正的空态。2) 删除章节用统一 Modal 二次确认替代 window.confirm(与卡密/公告删除一致):加 delRow 状态 + 确认弹窗。3) 正文 textarea 标注「支持 HTML / Markdown」即可(不强求富文本编辑器)。先 Read 本文件,复用 ui.jsx 的 Modal。不改章节保存后端逻辑。',
  },
  {
    key: 'Promotions', file: S + '/console/merchant/Promotions.jsx',
    fixes: '1) 满减满折活动补「生效时间/失效时间」字段(datetime-local,对齐优惠券的 valid_from/valid_to):emptyForm 加 start_at/end_at,表单加两个时间输入,payload 带上;列表加「有效期」列展示。2) 列表加 状态(启用/停用/已过期 now>end_at 派生)+ 类型(满减/折扣)前端筛选,参照同目录 Coupons.jsx 刚加的筛选模式。先 Read 本文件 + Coupons.jsx 对齐。仅前端 + payload 字段,不改后端计算。',
  },
  {
    key: 'Shop', file: S + '/console/merchant/Shop.jsx',
    fixes: '1) 店铺主题「选中即时预览」(附录D 要求):店铺预览 Panel 外层注入当前所选主题的 CSS 变量覆盖(用 themes.js 的 themeCss(themeKey) 注入 <style> 或内联 style 覆盖 --brand 等),让切主题时预览区配色实时变化,保存前可见效果。themes.js 在 src/themes.js,导出 themeCss(key)。2) 联系方式校验:手机做 11 位数字校验、QQ 纯数字校验,失败红字提示(submit 拦截)。先 Read 本文件 + src/themes.js。不改保存后端逻辑。',
  },
];
const SCHEMA = { type: 'object', additionalProperties: false, properties: { file: { type: 'string' }, applied: { type: 'array', items: { type: 'string' } }, skipped: { type: 'array', items: { type: 'string' } }, risk: { type: 'string' } }, required: ['file', 'applied'] };
const results = await parallel(TASKS.map((t) => () =>
  agent(
    '修一个 React 文件,按精确指令做(只做这些)。先 Read 整个文件(及参照文件)再 Edit 最小改动,保证可编译、保留现有逻辑、配色走橙色 CSS 变量(无蓝/靛/紫)。不跑 build/git。\n\n### 文件\n' + t.file + '\n\n### 改动\n' + t.fixes + '\n\n### 硬性要求\n- 只改列出的点;金额/卡密/支付/下单计算与请求不动。\n- 接后端方法前在 console/api.js 确认存在,不存在写 skipped 不臆造。\n- 确保 JSX 合法、无未定义变量/缺失 import。返回 applied/skipped/risk。',
    { label: 'fix3:' + t.key, phase: 'Fix', schema: SCHEMA, agentType: 'claude', model: 'opus' }
  )
));
return results.filter(Boolean);
