# 秒卡 MiaoKa · 买家前台(Frontend)

发卡平台**买家前台**,基于秒卡 MiaoKa 设计系统,用 **Vite + React** 重构并**适配后端真实接口**。浏览商品 → 下单 → 支付 → 轮询发货 → 取卡,已**浏览器端到端验证**跑通真实后端。

## 目录

```
frontend/
  design-system/        设计系统(tokens / 组件 / 规范);组件以 ESM 源码被 app 直接导入
  app/                  买家前台应用(Vite + React)
    src/
      api.js            ★ 后端适配层(端点/字段/状态/错误码映射 + 轮询发货)
      App.jsx           路由 shell(浏览→下单→付款→取卡)
      Icons.jsx         图标(Lucide 风格)
      components/TopBar.jsx
      screens/          StorefrontHome / ProductDetail / PaymentScreen / OrderLookup
    e2e/                playwright-core 无头 Chrome 端到端脚本
    vite.config.js      dev proxy 转发后端(免 CORS)
  docs/tasks.md         前端任务清单(F0–F8)
  _design-system-original.zip   设计系统原件备份
```

## 本地运行

```bash
# 1) 后端先起(开发库已 seed:php think db:seed)
cd <repo>; php think run -H 127.0.0.1 -p 8765      # /health 应 200

# 2) 前端
cd frontend/app
npm install
npm run dev                                         # → http://127.0.0.1:5173
```

dev server 通过 proxy 把 `/s/ /buyer/ /pay/ /health` 转发到后端 `127.0.0.1:8765`,因此前端用相对路径 fetch、无需处理 CORS。默认演示店铺 slug = `demo`(管理员 admin/admin123,商户 demo_merchant/demo123456)。

## 构建 / 部署

```bash
npm run build          # 产出 dist/(已 tree-shake,生产版 React,无 CDN babel)
npm run preview        # 本地预览构建产物
```

环境变量(生产覆盖):

| 变量 | 说明 | 默认 |
|------|------|------|
| `VITE_API_BASE` | 后端基址(生产填真实域名,如 `https://api.example.com`)| 空(dev 走 proxy)|
| `VITE_SHOP_SLUG` | 店铺标识 | `demo` |
| `VITE_PAY_CHANNEL` | 支付渠道 | `epay` |

> 生产部署:把 `dist/` 交给任意静态服务器/CDN,设 `VITE_API_BASE` 指向后端;后端 CORS 已放行。

## 端到端测试(无头 Chrome)

需 dev server(5173)+ 后端(8765)+ 系统 Chrome 在跑:

```bash
node e2e/flow.mjs        # 完整买家链路:浏览→下单→发起支付→(脚本触发签名回调)→轮询发货→断言卡密
node e2e/lookup.mjs <order_no> <email>   # 取卡/查单路径 + 商品名
```

`flow.mjs` 会用后端渠道密钥 `demo_epay_key` 构造**验签正确的回调**模拟网关付款成功(真实环境由网关异步回调)。

## 前端如何适配后端(关键映射)

`src/api.js` 是唯一对接点,屏蔽前后端差异:

- 字段:`order_no / total_amount / cards`(后端蛇形)↔ 组件友好形态;商品经 `normalizeProduct` 适配(后端列表仅 id/title/price/stock,desc/缩略图等优雅缺省)。
- 订单状态:后端数字枚举 `0待支付 1已支付 2已发货 3已关闭 4已退款 5异常待人工` → `statusKey` 转语义键。
- 统一响应 `{code,msg,data}`:`code:0` 取 data,否则抛 `ApiError`(已附中文文案,覆盖 3001下架/3002库存不足/3003限购/4002已支付/4003已过期/5001验签失败 等)。
- **异步发货模型**:支付是跳转第三方网关 + 异步回调;付款后前端 `pollDelivery` **轮询查单**直到 `status=2` 才显示卡密(未发货后端不返回 cards),并覆盖 `status=5 异常待人工`、`expire_at` 15 分钟倒计时与过期阻断。
- POST 用表单编码(`application/x-www-form-urlencoded`),与后端 `$request->post` 对齐。

## 演示库存补充(开发期)

演示商品卡密用完后,用商户后台导入更多(商户 demo_merchant / demo123456):
登录 `/merchant/login` 拿 token → `POST /merchant/cards/import`(product_id + 卡密文本)。

## 范围

本设计系统与本应用聚焦**买家前台**。商户后台 / 平台后台 UI 不在此设计系统范围内(后端接口已具备 `/merchant/* /admin/*`,如需可另立设计与应用)。

## 生产注意

- 支付页 `window.open(pay.url)` 在本地演示会指向模拟网关(`pay.example.com`,不可达,控制台 `ERR_TUNNEL` 属正常);生产为真实网关地址,用户在网关侧完成支付后异步回调到账。
- 字体:`design-system/tokens/fonts.css` 目前 `@import` Google Fonts,生产建议自托管 + `preload`。
