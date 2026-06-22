# 鲸商城PRO 实测对标基线(fkdemo.jingsoft.com,v2.35.0)

> 用无头 Chrome 实登抓取真实站点(admin/jingsoft、shop/bbb、门户)得到的**事实**,用于指导我们构建**等价功能**(自研实现,非复制其代码/内容)。抓取产物见 `frontend/app/e2e/jf-live/`。

## API 命名空间(真实)
- 总后台:`/adminApi/*`(如 auth/login、router/getList、manage.Dashboard/information、manage.Dashboard/pedding、SystemVersion/info)
- 店铺:`/shopApi/*`(system/config、Shop/info、Shop/categoryList、Shop/goodsList)
- 门户:`/index/Api/*`(systemConfig、indexArticle)

## 总后台 真实菜单树(adminApi/router/getList)
- **首页**:仪表盘、**大屏数据**
- **商品**:商品列表、**货源名片**(商户间货源对接/寄售)
- **订单**:订单列表、**投诉管理**、**其他订单**(运营账号充值订单 / 保证金充值订单 / 货源刷新点充值)、**买家黑名单**
- **商户**:商户列表、商户审核、**风控记录**、**操作日志**
- **运营**:内容管理、邀请码管理、**进件审核**(支付渠道签约)…
- **财务**:提现管理…
- **设置**:基础信息、**转账渠道**(代付)、**主题模板**、异常日志、**系统更新**(版本/授权)

### 仪表盘数据模型(manage.Dashboard/information)
today/yesterday/all_order_amount、today/yesterday/all_order_count、today/yesterday/all/**month_profit**(利润)、all_user_count、today_user_count、complaint_count、cash_count
### 待处理(manage.Dashboard/pedding)
complaint_count、cash_count、user_auth_count、**goods_verify_count**(商品待审)、channel_sign_verify_count

## 店铺页面 真实结构(shop/bbb,"演示商家的小店")
- 顶部导航:网站首页 / 订单查询 / **禁售目录** / **常见问题**
- 店招:商家名 / **已认证** / **保证金 10190.88 元** / **联系TA** / **分享** / 📢店铺公告
- **按销售类型分组陈列**(核心):
  - ⚡️ **数字卡密**(11件) — 卡密池一卡一售(我们已有)
  - ☘️ **知识文章**(5件) — 单图文/音视频、多章节内容(课程/小说/电子书)
  - 💎 **资源下载**(2件) — 虚拟文件下载
  - 👑 **数字权益**(1件) — 会员/权益
- 分类筛选(全部/卡密测试/教程卡密/…,带计数)
- 商品详情(按类型差异化展示与发货)

## 销售类型(4 种,平台核心卖点)
知识付费、虚拟卡密、数字资源、数字权益 —— 每种发货方式不同。

## 营销能力(平台卖点)
**优惠券 / 限时折扣 / 满折 / 满减** 等多种营销场景。

## 门户站(网站首页,SaaS)
为数字虚拟商品打造的自动寄售平台;入口:开通小店 / 商家中心 / 订单查询 / 禁售目录 / 常见问题 / 最新资讯(公告·新闻·常见问题)。

## 与我们的差距速览(别人有我们没有)
1. **商品类型系统**(知识文章/资源下载/数字权益 三类发货)— 我们只有卡密
2. **店铺按类型分组陈列**(4 类型 Tab + 图标 + 计数)
3. **营销**:优惠券/限时折扣/满折/满减
4. **门户站**:网站首页/开通小店/禁售目录/常见问题/订单查询
5. **总后台缺**:货源名片、投诉管理、充值订单(运营/保证金/货源点)、买家黑名单、风控记录、操作日志、进件审核、转账渠道、主题模板、系统更新、利润指标(月利润)
6. **商户后台**(卖家中心)菜单未完整抓到(666666 登录流程待破)— 推断含:商品(含类型)/卡密/订单/营销工具/钱包提现/店铺装修+主题/数据/货源/投诉处理
