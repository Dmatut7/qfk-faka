# 后台 UI 开发任务(商户后台 + 平台后台)

> 目标:沿用秒卡 MiaoKa 设计系统 + Vite/React,做**商户后台**与**平台后台** UI,接已就绪的 `/merchant/*`、`/admin/*`。
> 架构:`frontend/app` 多页 —— 新增 `console.html` 入口 + `src/console/`(登录 + 侧栏布局 + 商户区 + 平台区),复用设计系统/node_modules/e2e。
> 节奏:每页接真后端 → 无头浏览器端到端验证(真渲染+真后端)→ commit → 勾选。
> 铁规则:不造假数据、不跳校验;金额/提现/对账数据必须来自真实接口、账目准确。
> 验证账号:商户 `demo_merchant`/`demo123456`,平台 `admin`/`admin123`(后端 8765,前端 console 页)。

## 后端契约
统一响应 `{code,msg,data}`,`code:0` 成功;受保护接口需 `Authorization: Bearer <token>`。
- 商户登录 `POST /merchant/login`;平台登录 `POST /admin/login` → `{token,...}`。
- 鉴权错误码:1001 未登录/令牌无效、1003 无权限;沿用买家端错误码表。

## 任务

### A0 · 控制台基座
- [ ] **A0** 多页骨架:`console.html` + `src/console/{main,api,ConsoleApp}.jsx`;登录(商户/平台切换)、Bearer token 存储、侧栏布局、错误码文案、vite proxy 加 `^/merchant/ ^/admin/`、多页 build。`vite build` 通过。

### 商户后台(MerchantAuth)
- [x] **M1 登录** `POST /merchant/login` → token;错误提示;登录态持久(localStorage)。
- [ ] **M2 商品管理** `GET/POST /merchant/products`、`POST products/:id`、`/:id/status`、`/:id/delete`;列表 + 新建/编辑 + 上下架 + 删除(有卡密禁删按后端)。
- [ ] **M3 分类管理** `GET/POST /merchant/categories`、`/:id`、`/:id/delete`。
- [ ] **M4 卡密** `POST /merchant/cards/import`、`GET products/:id/cards`、`/cards/stats`、`cards/:id/disable`、`/delete`;导入(多行)+ 列表 + 作废/删除 + 库存统计。
- [ ] **M5 订单** `GET /merchant/orders`、`orders/:id`、`/:id/close`、`/:id/redeliver`;列表 + 详情 + 关单 + 补发。
- [ ] **M6 钱包/提现** `GET /merchant/wallet`、`wallet/fund-logs`、`wallet/withdrawals`、`POST wallet/withdrawals`;余额/冻结 + 流水 + 申请提现 + 提现记录(金额准确)。
- [ ] **M7 统计** `GET /merchant/stats/summary`、`stats/top-products`;概览数字 + 热销榜。

### 平台后台(AdminAuth)
- [x] **A1 登录** `POST /admin/login` → token。
- [ ] **A2 商户审核** `GET /admin/merchants`(列表/搜索)、`approve/freeze/unfreeze/commission/reset-password`。
- [ ] **A3 支付渠道** `GET/POST /admin/channels`、`/:id`、`/:id/status`、`/:id/test-sign`(空密钥拒)。
- [ ] **A4 提现审核** `GET /admin/withdrawals`、`/:id/approve`、`/:id/reject`(资金回滚准确)。★停顿点
- [ ] **A5 对账报表** `GET /admin/reports/settlement`(销售额/佣金跨商户,账目准确)。★停顿点
- [ ] **A6 跨商户视图** `GET /admin/orders`、`/admin/products`(只读)。
- [ ] **A7 平台配置** `GET/POST /admin/settings`。

### 收尾
- [ ] **Z1** 全量端到端验证(商户全流程 + 平台全流程,真渲染+真后端)+ 完成报告。

## 停顿点(不阻塞,记 blockers 后继续)
- A4 提现审核 + A5 对账 做完后,在 `docs/blockers.md` 记一条"待 owner 验收:提现/对账",**继续做其余任务**,不卡住等待。
- 任何无法解决的问题 → 记 `docs/blockers.md` → 跳过该任务 → 继续下一个,不停整个循环。

## 验证方式
- 后端 `php think run -p 8765`;前端 `cd frontend/app && npm run dev` → console 页 `http://127.0.0.1:5173/console.html`。
- e2e:`frontend/app/e2e/console-*.mjs`(playwright-core + 系统 Chrome,真登录真接口)。
