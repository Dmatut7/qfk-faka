# 性能/生产就绪审计 — 16(high8/med6/low2)

## 处理状态(截至本轮)
- **已落地(零风险/含测试)**:H1/H2/H3/H5/H6/H7 补热点聚合索引(orders 的 (status,create_time)+(create_time)、fund_logs 的 (type,create_time));M1/M3 待审提现合计下推 SQL SUM;H4 卡密导入行数硬上限 10000;M6 下载签名密钥不再回退硬编码盐(生产无密钥拒绝签发)。L1 确认发卡 idx_pick 本身已最优。
- **待协调(前端/基建,不在自动循环里冒险)**:
  - ✅ **M2/M4 投诉列表分页**已落地(后端 page/size + 前端分页器,商户+平台端)。
  - L2 商品列表分页:ProductService::list 被多处选择器(卡密/活动等)引用且审计评 LOW(商品增长慢),改它风险>收益,保留;M5 卡密列表已分页(仅 offset→游标优化,LOW)保留。
  - H8 RateLimit 改 Redis 原子自增:生产需 Redis 基建(多机共享),属部署决策。
  - dashboard 多档聚合可加分钟级缓存(性能优化,非缺陷)。

## HIGH

### [H1] merchant_fund_logs 佣金聚合无 (type,create_time) 索引,对账报表/仪表盘/商户统计均全表扫描 <N+1查询>
- 影响: AdminReportService(settlementReport)、AdminViewService::dashboard(4 次 commissionTotal)、MerchantStatsService(profit 各档调 commission)都执行 whereIn('type',[2,5]) + create_time 区间 + SUM(amount)[GROUP BY merchant_id]。fund_logs 每笔成交至少写 1~2 行,增长比订单还快;现有索引只有 (merchant_id,id) 与 (order_id),按 type 过滤完全走不到索引 → 每次对账/仪表盘/商户毛利都是全表扫描。流水到百万行级时报表与仪表盘明显变慢。
- 证据: app/service/AdminReportService.php:89-95 与 AdminViewService.php:111-122 与 MerchantStatsService.php:61-72 均 whereIn('type',...)+create_time+SUM;merchant_fund_logs 索引仅 idx_merchant=(merchant_id,id)/idx_order/uniq_order_type(database/migrations/20260621044232_create_merchant_fund_logs_table.php 及 20260623040000_restore_fundlog_uniq.php),无 type 或 create_time 索引。
- 修: 新增迁移给 merchant_fund_logs 加 (type, create_time, merchant_id) 联合索引(覆盖按 type 过滤 + 时间区间 + 按商户分组求和);settlementReport 的 salesByMerchant/commissionByMerchant 已是单条 GROUP BY,补索引即可,无需改逻辑。

### [H2] orders 表缺 create_time 索引,平台仪表盘/对账/商户统计的多档时间聚合全表扫描 <索引覆盖>
- 影响: orders 是增长最快的核心表。AdminViewService::dashboard() 单次请求就发起 ~10+ 条聚合(total/today/yesterday + paid/delivered/exception 计数 + 已发货销售额 today/yesterday/total SUM),其中所有 today/yesterday/month 档都是纯 create_time 范围过滤(status 也无组合 create_time 的索引)。订单到百万级后,每个时间档聚合都退化为全表扫描;dashboard 是后台首页每次打开都跑的热点,会随订单量线性变慢到秒级。
- 证据: database/migrations/20260621043929_create_orders_table.php:38-42 只建了 uniq_order_no / (merchant_id,status) / buyer_email / (status,expire_at) / product_id,无任何含 create_time 的索引(grep 全 migrations 确认仅 system_logs 有 create_time 索引)。命中点:app/service/AdminViewService.php:44-51(已发货销售额 today/yesterday 按 create_time 范围)、:61(商户 today)、:65-66(订单 today/yesterday)。app/service/MerchantStatsService.php:83-84(deliveredQuery 按 create_time)。app/service/AdminReportService.php:106-113(对账按 create_time 半开区间)。
- 修: 给 orders 增复合索引覆盖『状态+时间』热点聚合:ALTER TABLE orders ADD INDEX idx_status_ctime (status, create_time)。该索引同时支撑 dashboard 的 status=DELIVERED + create_time 范围 SUM、订单状态计数、AdminReportService 的 whereIn(status)+create_time。若还需『全状态按 create_time』(dashboard 的 orders.today/yesterday 不带 status),可再加 idx_ctime (create_time)。

### [H3] merchant_fund_logs 缺 create_time 索引,佣金/利润分时段聚合走全表 <索引覆盖>
- 影响: merchant_fund_logs 是只增不改的账本,随每笔成交+退款增长(比 orders 还快)。平台利润看板 commissionTotal 对 today/yesterday/month/total 四档各跑一次 SUM(amount)+whereIn(type)+create_time 范围;商户统计 commission 也同样按 merchant_id+type+create_time 聚合。现有索引 (merchant_id,id)/(order_id)/(order_id,type) 都无法支撑按 create_time 的时间窗过滤,百万行后每档聚合全表扫。
- 证据: database/migrations/20260621044232_create_merchant_fund_logs_table.php:26-29 仅 idx_merchant(merchant_id,id) / idx_order / uniq_order_type,无 create_time。命中点:app/service/AdminViewService.php:111-120(commissionTotal 四档 create_time SUM);app/service/MerchantStatsService.php:61-72(commission 按 merchant_id+type+create_time);app/service/AdminReportService.php:85-95(commissionByMerchant 按 type+create_time group by merchant_id)。
- 修: ALTER TABLE merchant_fund_logs ADD INDEX idx_mid_type_ctime (merchant_id, type, create_time) 支撑商户维度分时段佣金;再加 idx_type_ctime (type, create_time) 支撑 AdminViewService/AdminReportService 的跨商户 type+create_time 聚合。

### [H4] 卡密批量导入无行数上限、不分批,整批构建数组 + 单条 insertAll <分页与无界查询>
- 影响: 商户粘贴的 cards 文本无任何行数/字节上限。N 行全部 trim/hash 进 $seen、$rows 内存数组,再单条 Card::insertAll($rows) 一次性多值 INSERT。10 万行时:PHP 内存峰值数十 MB、SQL 触达 max_allowed_packet 报错全批失败、uniq_secret 唯一键间隙锁长事务阻塞同商品下单取卡(OrderService 的 FOR UPDATE SKIP LOCKED 取码),并发导入易 1213 死锁。
- 证据: app/service/CardService.php:27 import() 无上限;:31-32 preg_split 全量行;:61-78 foreach 构建全量 $rows;:126 Card::insertAll($rows) 单条多值插入;:81-104 整批一个事务。控制器 app/controller/merchant/Card.php:14-23 仅校验 cards require,无大小校验。CardService 全文无 MAX/array_chunk(grep 仅命中 count($lines))。
- 修: 导入入口加硬上限(如单次 ≤ 1 万行,超限报错或要求分文件);$rows 用 array_chunk 分批(每批 500-1000)在各自小事务内 insertAll,降低锁持有时间与内存峰值;controller 层加 cards 字节长度校验。

### [H5] orders/merchant_fund_logs 的 create_time 无索引,对账/统计按时间区间聚合走全表扫描 <分页与无界查询>
- 影响: AdminReportService 跨商户对账 SUM(total_amount)/SUM(amount) GROUP BY merchant_id,过滤条件是 status IN(...) + create_time 区间;且 start/end 可为空(全时段)。orders 索引只有 merchant_id,status / status,expire_at 等,fund_logs 只有 merchant_id,id / order_id,二者 create_time 均无索引。订单/流水表快速增长后,该报表与 MerchantStatsService 的今日/昨日/本月分窗 sum/count 全部 filesort/全表扫描,百万行级别单次报表查询会到秒级并拖慢库。
- 证据: create_time 无索引:database/migrations/20260621043929_create_orders_table.php:36(仅 addColumn,无 index),20260621044232_create_merchant_fund_logs_table.php:25。聚合按 create_time 过滤:app/service/AdminReportService.php:71-74(orders SUM group by merchant_id)、:92-95(fund_logs SUM)、:108-113 applyRange 用 create_time;app/service/MerchantStatsService.php:31-33、:65-71 同样按 create_time 区间。入口可全时段:app/controller/admin/System.php:37-40 start/end 默认空串。
- 修: 新增迁移:orders 加 (status, create_time) 或 (create_time) 复合索引;merchant_fund_logs 加 (type, create_time) 或 (merchant_id, create_time)。对账报表可考虑强制 start/end 必填或默认近 N 天,避免全时段全表聚合。

### [H6] orders 表缺 create_time 索引,所有按时间的销售/订单聚合在订单量上涨后全表扫描 <生产就绪>
- 影响: orders 是增长最快的交易表。仪表盘/报表/商户统计每次都对 orders 按 create_time 过滤做 COUNT/SUM,无可用索引 → 全表扫描。订单到十万级即出现秒级查询,管理后台一进首页就触发,且这些聚合无缓存,每次请求重算。
- 证据: 迁移 database/migrations/20260621043929_create_orders_table.php:38-42 只建了 uniq_order_no、idx_merchant_status(merchant_id,status)、idx_buyer_email、idx_expire(status,expire_at)、idx_product,没有任何含 create_time 的索引。但 app/service/AdminViewService.php:44-66(dashboard 的 today/yesterday 销售额与订单数全部 where('create_time','>=',...)->where('create_time','<',...))、app/service/AdminReportService.php:106-114(salesByMerchant 按 create_time 半开区间)、app/service/MerchantStatsService.php:31-34、79-85、114-125 都以 create_time 为主过滤列。dashboard 还有多条 Order::where('status',DELIVERED)->sum() / where('status',PAID)->count()(AdminViewService.php:43,67-69),status 单列查询也无法命中 (merchant_id,status) 复合索引最左前缀。
- 修: 新增迁移给 orders 加 idx_create_time(create_time) 与 idx_status_create(status, create_time)(后者同时覆盖 dashboard 的 status 计数与 DELIVERED+时间窗销售额)。仪表盘聚合结果可按分钟级缓存,避免每次进后台都重算全表 SUM。

### [H7] merchant_fund_logs 佣金/利润聚合按 create_time 过滤但无 create_time 索引 <生产就绪>
- 影响: fund_logs 每笔成交写 2 行(收入+佣金),增长速度是订单的 2 倍。平台仪表盘的“今日/昨日/本月/累计利润”和对账报表都对该表按 type + create_time 做 SUM,跨全部商户、无 create_time 索引 → 全表扫描。流水到几十万行后,管理后台首页(dashboard)每刷新一次就扫一遍全表多次。
- 证据: 迁移 database/migrations/20260621044232_create_merchant_fund_logs_table.php:26-29 索引为 idx_merchant(merchant_id,id)、idx_order(order_id)、uniq_order_type(order_id,type),无 create_time。但 app/service/AdminViewService.php:111-122 commissionTotal() 用 whereIn('type',...)->where('create_time','>=')->where('create_time','<')->sum('amount'),且 dashboard 一次调用它 6 次(commission.total/today + profit today/yesterday/month/total,AdminViewService.php:92-102);app/service/AdminReportService.php:85-95 commissionByMerchant 同样按 create_time 过滤分组。这些查询不带 merchant_id,无法用 idx_merchant。
- 修: 新增迁移给 merchant_fund_logs 加 idx_type_create(type, create_time)。dashboard 把对 commissionTotal 的 6 次调用合并为单次按时间桶聚合,或对“累计/今日”做短 TTL 缓存。

### [H8] RateLimit 依赖 file 缓存驱动,inc 非原子,高并发下限流计数丢失、形同虚设 <生产就绪>
- 影响: 限流保护登录暴破(10/分)、下单(30/分)、券码爆破、以及支付回调(120/分)。file 驱动 inc() 是“读文件→+1→写文件”无锁序列,多 worker 并发时丢增量,实际放行数远超阈值;爆破/刷单/回调风暴正是高并发场景,恰好绕过限流。file 驱动还把限流计数落磁盘,QPS 高时变成磁盘 IO 热点。多机部署时各机各自一份 file 缓存,阈值再被乘以机器数。
- 证据: config/cache.php:9 default => env('cache.driver','file'),仅配置了 file store(无 redis)。app/middleware/RateLimit.php:21-33 用 Cache::get + Cache::inc 实现固定窗口。vendor/topthink/framework/src/think/cache/driver/File.php:197-208 inc() 实现为 getRaw() 后 unserialize+step 再 set(),getRaw 与 set 之间无 flock/CAS,读改写竞态。路由 route/app.php:33,44,48 等把该中间件用于下单、pay/notify、login。
- 修: 生产用 Redis 缓存驱动(Redis INCR 原子),并在 cache.php 增加 redis store + 用环境变量切换;RateLimit 改用原子自增(或 Lua 脚本固定窗口/令牌桶)。多机部署务必共享 Redis,否则限流阈值按机器数失真。


## MEDIUM

### [M1] 提现列表把全部待审金额拉回 PHP 逐行 bcadd 求和,而非 SQL SUM <N+1查询>
- 影响: AdminWithdrawService::list 每次翻页都 `Withdrawal::where(pending)->column('amount')` 取出全部待审提现的 amount 到内存再 foreach 累加。待审单堆积(几千上万条)时,每次列表请求都全量取回该列并在 PHP 里循环,内存与耗时随待审量线性增长,且与本可一次 SUM 解决的统计重复扫表。
- 证据: app/service/AdminWithdrawService.php:51-54 — foreach (Withdrawal::where($pendingWhere)->column('amount') as $amt) { $pendingAmount = Money::add(...); }
- 修: 改为 SQL 聚合:`$pendingAmount = Money::add((string) Withdrawal::where($pendingWhere)->sum('amount'), '0');`,一条查询取回合计,免去全列回传与 PHP 循环(金额仍用 Money 规整两位小数,口径不变)。

### [M2] 多个后台/前台列表用无 limit 的 select() 全量返回,无分页上限 <N+1查询>
- 影响: ComplaintService::merchantList/adminList/listByOrder、ProductService::list、AdminChannelService::list 等以 ->select()->toArray() 返回全部命中行,没有分页。商户投诉/商品数量增长后,单次列表会把整张结果集读入内存并序列化为 JSON;某商户积累上万条投诉或商品时,接口响应体与内存随数据量线性膨胀(对比 OrderService/CardService/AdminViewService 已正确分页)。
- 证据: app/service/ComplaintService.php:83(merchantList)、132(adminList)、57(listByOrder);app/service/ProductService.php:29(list)。均为 ->select()->toArray() 无 page()/limit()。
- 修: 给这些列表加 page/size 分页(同 MerchantOrderService::list 模式),或至少加硬上限 limit;adminList 的全局 status_counts 已用 GROUP BY,仅需对明细 items 分页即可。

### [M3] 待审提现金额合计在 PHP 端 column 拉全量再循环累加,未下推 SQL <分页与无界查询>
- 影响: 列表分页本身没问题(page/size 默认 20),但 pending_summary 金额合计把所有 PENDING 提现单的 amount 用 column() 全量拉到 PHP,再 foreach bcmath 累加。待审单堆积(打款延迟/批量申请)时,每次打开提现列表都全量拉取并循环,内存与耗时随待审量线性增长;且 withdrawals 仅有 (merchant_id,status) 索引,无 merchant 过滤时按 status 扫描后全取 amount。
- 证据: app/service/AdminWithdrawService.php:52 `foreach (Withdrawal::where($pendingWhere)->column('amount') as $amt) { $pendingAmount = Money::add(...) }`。对比同文件 :50 已用 ->count() 下推。
- 修: 金额合计改为 DB 端聚合 Withdrawal::where($pendingWhere)->sum('amount'),再用 Money::add((string)$sum,'0') 规整为两位小数(与 MerchantStatsService::summary 一致),避免全量拉行。

### [M4] 投诉列表(商户端/平台端)无分页,select() 全量返回 <分页与无界查询>
- 影响: complaints 表随纠纷量增长。ComplaintService::merchantList 与 adminList 均无 page/size,直接 select()->toArray() 返回某商户/全平台的全部投诉。平台端 adminList 在投诉积累后一次返回所有行(items 无上限),响应体与查询时间随投诉总量增长;有 (merchant_id,status) 索引但无 status 过滤时仍取全部行。
- 证据: app/service/ComplaintService.php:83 merchantList `return $q->select()->toArray();`(:79 仅 where merchant_id + order id desc,无 page);:132 adminList `$items = $q->select()->toArray();`(:128 仅 order id desc,无 page)。对比同库 AdminViewService::orders(app/service/AdminViewService.php:153)已用 ->page($page,$size)。
- 修: 两个方法补 page/size 分页(参照 AdminViewService::orders 模式,保留 status_counts 全局计数 group by),控制器透传 page。

### [M5] CardService::list 对 cards 表 order('id','desc') 分页,未命中可用索引 <生产就绪>
- 影响: 卡密表是库存核心,单热销商品可达数万到数十万张卡。商户后台查看卡密列表按 product_id 过滤 + id desc 排序分页;cards 现有索引最左列均非可直接服务该排序的形态,深翻页(大 offset)会扫描+丢弃大量行。商户翻到靠后页时变慢。
- 证据: app/service/CardService.php:167-172 list():Card::where('product_id',$productId)[->where('status')]->order('id','desc')->page()->select()。迁移 database/migrations/20260621043742_create_cards_table.php:31-34 索引为 idx_pick(product_id,status,id)、uniq_secret、idx_order、idx_lock_expire。仅按 product_id 过滤而不带 status 时,(product_id,status,id) 可用前缀做范围但排序方向(id desc)与 page 大 offset 仍需回表/扫描丢弃;COUNT(*) 也对大卡池每次全量计。
- 修: 列表查询固定带 status 或始终利用 idx_pick 前缀;对深翻页改用游标(where id < lastId)替代 offset 分页;COUNT 可缓存或用 stats() 已有的分状态计数替代精确 total。

### [M6] DownloadService 密钥回退到硬编码盐 qfk_download_salt_v1,生产防盗链可被绕过 <生产就绪>
- 影响: 资源类商品的限时下载链用 HMAC 签名防盗链。若生产没配 DOWNLOAD_SECRET 且 app_key 为空,密钥退化为代码里写死的固定串,任何能读到源码/猜到该常量的人都能自行伪造签名链,越过 30 分钟有效期与订单校验直接拿到资源真实地址,造成资源被盗刷。
- 证据: app/service/DownloadService.php:20-29 secret():DOWNLOAD_SECRET 为空→取 config('app.app_key'),再为空→返回字面量 'qfk_download_salt_v1';sign() 用此密钥做 hash_hmac(DownloadService.php:31-34)。
- 修: 生产启动时强制要求 DOWNLOAD_SECRET(或 app_key)非空,缺失则拒绝签发/启动报错,绝不回退到硬编码盐。


## LOW

### [L1] cards 发卡热点索引覆盖正确(确认无问题) <索引覆盖>
- 影响: 并发发卡是最关键热点,确认已有支撑索引,无需改动。OrderService 取卡 WHERE product_id AND status=UNSOLD ORDER BY id ASC LIMIT n FOR UPDATE SKIP LOCKED,正好命中 idx_pick(product_id,status,id):等值 product_id+status 后按 id 有序,SKIP LOCKED 扫描最小化锁范围。
- 证据: database/migrations/20260621043742_create_cards_table.php:31 addIndex(['product_id','status','id'],'idx_pick');命中 app/service/OrderService.php:120-126 与补发 :354-356。释放回收 closeAndRelease 按 order_id+status 走 idx_order(:33)。过期锁清理 (status,locked_at) 有 idx_lock_expire(:34)。
- 修: 无需改动。仅提示:idx_lock_expire(status,locked_at) 当前代码未见按 locked_at 扫描的调用(回收按 orders.expire_at 而非 cards.locked_at),如确无用可评估为冗余索引删除以省写入成本;但不影响正确性,优先级低。

### [L2] 商户商品列表 ProductService::list 无分页,select() 全量 <分页与无界查询>
- 影响: products 增长慢于订单/卡密,但单商户上架商品多(数千 SKU)时,商户后台商品列表与买家店铺页一次返回该商户全部商品。StorefrontService::store 同样 select() 全量在售商品再 array_map+按分类计数循环。商品规模大的商户每次访问店铺/后台列表都全量返回。
- 证据: app/service/ProductService.php:29 `return $q->order(...)->select()->toArray();` 无 page;app/service/StorefrontService.php:28-31 store 在售商品 select() 全量,:54-63 再 ->all() + foreach 计数。有索引 idx_merchant_status 覆盖过滤,但结果集无界。
- 修: 商户商品列表与店铺商品列表加分页(或在店铺页限制返回条数 + 分类懒加载);若产品要求店铺一次展示全部,至少加返回上限护栏。
