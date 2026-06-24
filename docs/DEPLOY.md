# 生产部署指南 — QFK / 秒卡发卡商城

> 三端:买家商城 + 运营控制台(商户/平台)+ PHP 后端。本指南覆盖后端、前端、定时任务、支付、安全加固。

## 架构
- **后端**:PHP 7.4 + ThinkPHP 6.1(`php think run` 仅开发用;生产用 PHP-FPM + Nginx)。统一 `{code,msg,data}` API。
- **前端**:Vite + React,构建出**静态文件**(`frontend/app/dist/`,含买家 `index.html` + 控制台 `console.html`),交 Nginx/CDN 托管。
- **数据库**:MySQL 9.x(生产建独立账号,非 root)。

## 一、数据库
```sql
CREATE DATABASE qfk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'qfk'@'127.0.0.1' IDENTIFIED BY '<强密码>';
GRANT ALL ON qfk.* TO 'qfk'@'127.0.0.1'; FLUSH PRIVILEGES;
```
```bash
cd /var/www/qfk
composer install --no-dev --optimize-autoloader
# 配置 .env(见下),再建表:
php think migrate:run
php think db:seed         # 可选:仅首次灌默认管理员/演示数据;生产建议改密后删演示数据
```

## 二、后端 .env(生产)
```ini
APP_DEBUG = false                     # 必须 false(否则纯文本回调被追加 trace、错误外泄)
[APP]
DEFAULT_TIMEZONE = Asia/Shanghai
[DATABASE]
TYPE = mysql
HOSTNAME = 127.0.0.1                   # 生产用 TCP(非 unix socket)
DATABASE = qfk
USERNAME = qfk
PASSWORD = <强密码>
HOSTPORT = 3306
CHARSET = utf8mb4

# 资源下载防盗链签名密钥:生产必填(否则资源类商品拒发下载链)
DOWNLOAD_SECRET = <高强度随机串>
# (可选)卡密落库加密密钥:配置后导入即 AES-256-GCM 加密存储;一经用于加密**不可更改/丢失**,否则旧密文无法解密
CARD_SECRET_KEY = <高强度随机串>
```
- **改默认口令**:`admin/admin123`、`demo_merchant/demo123456` 仅演示,上线前务必改或删。
- 支付渠道密钥(epay key/pid/gateway)在平台后台「支付渠道」配置(后端已脱敏存储、不明文下发);**demo 渠道指向占位网关 `pay.example.com`,收不到钱,务必改成你的真实参数**(后台检测到占位会醒目告警)。
- **发货邮件通知**(可选):平台后台「系统设置 → 发货邮件通知」配 SMTP(host/port/secure/user/pass/from)并开启;`smtp_pass` 脱敏存储不回显。未配置则静默跳过。

## 三、Nginx + PHP-FPM(后端 API)
```nginx
server {
  listen 443 ssl http2;
  server_name api.example.com;
  ssl_certificate     /etc/ssl/qfk/fullchain.pem;
  ssl_certificate_key /etc/ssl/qfk/privkey.pem;
  root /var/www/qfk/public;            # ThinkPHP 入口在 public/
  index index.php;
  location / { try_files $uri $uri/ /index.php?$query_string; }
  location ~ \.php$ {
    fastcgi_pass unix:/run/php/php7.4-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
  }
  client_max_body_size 8m;             # 卡密批量导入
}
```
确保 `runtime/` 可写;`.env`、`database/`、`app/` 不在 web root(入口仅 `public/`,已隔离)。

## 四、前端构建 + 托管
```bash
cd frontend/app
npm ci
VITE_API_BASE=https://api.example.com \
VITE_SHOP_SLUG=<店铺slug> \
VITE_PAY_CHANNEL=epay \
npm run build                          # 产出 dist/(index.html 买家 + console.html 控制台)
```
Nginx 托管 `dist/`:
```nginx
server {
  listen 443 ssl http2; server_name shop.example.com;
  root /var/www/qfk/frontend/app/dist;
  # 买家商城 /  ·  控制台 /console.html
  location / { try_files $uri $uri/ /index.html; }
}
```
- `VITE_API_BASE` 指向后端域名(生产不走 dev proxy);后端 CORS 中间件已放行,建议收紧 allow-origin 为前端域名。
- 字体:`design-system/tokens/fonts.css` 现 `@import` Google Fonts,生产建议自托管 + `preload`。

## 五、定时任务(crontab)
```cron
* * * * *   cd /var/www/qfk && php think order:clean      >> runtime/cron.log 2>&1   # 每分钟回收过期订单
0 * * * *   cd /var/www/qfk && php think stock:reconcile  >> runtime/cron.log 2>&1   # 每小时库存/资金对账
```
(平台后台「任务计划」页列有这些命令及用途。)

## 六、支付渠道(易支付/epay)
- 平台后台「支付渠道」配置真实 pid/key/gateway。
- **回调地址**:`https://api.example.com/pay/notify/epay`(公网可达、HTTPS)。后端已做验签 + 金额校验 + 幂等,只认验签通过的回调。
- 支付宝/微信为预留驱动接口,如需启用另接。

## 七、安全加固清单
- [x] `APP_DEBUG=false`;改/删默认管理员与演示商户口令。
- [x] DB 用独立账号(非 root)、强密码、仅本机访问。
- [x] 全站 HTTPS;回调/后台仅 HTTPS。
- [x] 已内置:登录限流(10/分)、注册限流(5/时)、卡密发放一卡一售行锁、回调验签/幂等/金额校验、提现资金守恒+冻结商户拦截、渠道密钥/SMTP 密钥/卡密查单密码哈希脱敏、令牌仅认 Authorization 头(不回退 ?token=)、危险操作二次确认。
- [x] 可选加固:卡密落库加密(`CARD_SECRET_KEY`)、卡密发货邮件、买家账号(可选,注册按 buyer_id 绑定不按邮箱认领)。
- [ ] 建议补:CORS allow-origin 收紧到前端域名;数据库定期备份。
- **商户开放 API**:商户后台「开放 API」生成 `api_key`/`api_secret`,程序化查本店商品/订单(签名 = HMAC-SHA256 + timestamp 防重放,仅本商户数据)。

## 八、上线自检
```bash
php think migrate:status          # 迁移已全部 up
composer test                     # 499 测试全绿
curl https://api.example.com/health   # {"code":0,...,"database":"ok"}
php think stock:reconcile         # 0 库存/资金错配
```
打开 `https://shop.example.com/` 走一遍下单→支付→取卡;`https://shop.example.com/console.html` 验证两端后台。
