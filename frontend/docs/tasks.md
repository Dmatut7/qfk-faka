# 前端买家前台 — 开发任务(前端适配后端)

> 目标:把秒卡 MiaoKa 设计系统重构为能跑通的真实买家前台,**前端适配后端**(对接 PHP 后端 http://127.0.0.1:8765,字段/状态/流程全部按后端真实契约)。
> 节奏:逐任务实现 → 对着活后端验证 → 勾选 → commit。
> 技术:Vite + React(ESM 直接导入 `design-system/components/*`),dev 用 proxy 转发后端免 CORS。

## 后端真实契约(适配基准)
- 统一响应 `{code,msg,data}`,`code:0` 成功。
- `GET /s/{slug}` 店铺+在售商品;`GET /buyer/product/{id}` 详情。
- `POST /buyer/order {product_id,quantity,buyer_email}` → `{order_no,total_amount,expire_at,status:0}`。
- `POST /buyer/order/{order_no}/pay {channel}` → `{payment_no, pay:{method,url,params{...,sign}}}`(跳转第三方)。
- `POST /buyer/order/query {order_no,email}` → 订单 +(仅 status=2)`cards[]`。
- 订单状态数字枚举:`0待支付 1已支付 2已发货 3已关闭 4已退款 5异常待人工`。
- 付款=跳转网关 + 异步回调;前端付款后须**轮询查单**直到 status=2 才显示卡密。
- 错误码:3001下架 3002库存不足 3003超限购 4002已支付 4003已关闭/过期 5001验签失败。

## 任务
- [x] **F0** 建 `frontend/`,移入设计系统(`design-system/`),原件 zip 备份。
- [x] **F1** Vite 骨架:ESM 导入设计系统组件 + tokens CSS,`vite build` 通过。
- [x] **F2** `src/api.js` 适配层:fetch 封装、baseURL 可配、所有买家端点、`{code,msg,data}` 错误码→文案、status 数字↔语义映射、字段映射(order_no/total_amount/cards)。
- [x] **F3** 四屏接真后端:StorefrontHome(`/s/{slug}`)、ProductDetail(`/buyer/product/{id}` + 下单)、PaymentScreen(发起支付→跳转/轮询)、OrderLookup(`/buyer/order/query`)+ App 路由。删除 mkKeys/假数据。
- [x] **F4** 异步发货流:付款后进入「发货中」轮询查单 → status=2 展示卡密;覆盖 status=1/3/5 与 15min `expire_at` 倒计时、过期阻断。
- [x] **F5** 组件级修复:CardKey 复制成功/失败分流 + execCommand 兜底 + aria-live;QuantityStepper 受控可编辑 + max<min 守卫 + 焦点环;PaymentOption radio 语义;Input aria-describedby;PriceTag NaN 守卫;Badge dot aria-hidden。
- [x] **F6** token 修复:对比度(text-subtle/pending-fg/secure-fg/实心徽标加深至 WCAG AA)、`prefers-reduced-motion`、链接 hover 下划线、价格红 vs 危险红区分。
- [x] **F7** 对活后端端到端验证:浏览→下单→(脚本触发签名回调模拟支付)→轮询→取卡;伪造回调被拒。
- [x] **F8** 响应式 + 健壮性:@media 断点、网格 minmax 防溢出、空/错/载态、长内容截断、safe-area。

## 验证方式
- dev:后端 `php think run -p 8765` 在跑;前端 `npm run dev`(proxy 转发)。
- 支付回调本地用签名脚本模拟(`frontend/dev/sim-pay.sh`,后端渠道密钥 demo_epay_key)。
