<?php
declare(strict_types=1);

namespace app\command;

use app\model\Admin;
use app\model\Card;
use app\model\Category;
use app\model\Merchant;
use app\model\PaymentChannel;
use app\model\Product;
use think\console\Command;
use think\console\Input;
use think\console\Output;

/**
 * 演示种子数据命令:`php think db:seed`。
 *
 * 幂等地创建一套可直接体验的演示数据:
 *  - 默认平台管理员(username='admin',密码 'admin123' bcrypt);
 *  - 示例支付渠道(code='epay',driver='epay',启用);
 *  - 一个演示商户(active)+ 一个商品 + 几张卡密。
 *
 * 所有创建都遵循「存在则跳过」:可重复执行,不报错、不重复插入。
 * 全程以业务唯一键(username / code / store_slug / sku / product_id+secret_hash)
 * 判定存在性,不依赖自增 id。
 */
class SeedDemo extends Command
{
    /** 演示卡密明文(去重以 product_id + secret_hash 为准) */
    private const DEMO_CARDS = [
        'DEMO-CARD-0001',
        'DEMO-CARD-0002',
        'DEMO-CARD-0003',
        'DEMO-CARD-0004',
        'DEMO-CARD-0005',
    ];

    protected function configure(): void
    {
        $this->setName('db:seed')
            ->setDescription('幂等地创建演示数据(管理员 / 支付渠道 / 商户 / 商品 / 卡密)');
    }

    protected function execute(Input $input, Output $output): int
    {
        $now = date('Y-m-d H:i:s');
        $stats = ['created' => 0, 'skipped' => 0];

        // 1) 默认平台管理员 ------------------------------------------------
        if (Admin::where('username', 'admin')->find()) {
            $output->writeln('[db:seed] admin: skipped (exists)');
            $stats['skipped']++;
        } else {
            Admin::create([
                'username'    => 'admin',
                'password'    => password_hash('admin123', PASSWORD_BCRYPT),
                'nickname'    => '平台管理员',
                'status'      => Admin::STATUS_ENABLED,
                'create_time' => $now,
                'update_time' => $now,
            ]);
            $output->writeln('[db:seed] admin: created');
            $stats['created']++;
        }

        // 2) 示例支付渠道 epay --------------------------------------------
        if (PaymentChannel::where('code', 'epay')->find()) {
            $output->writeln('[db:seed] channel epay: skipped (exists)');
            $stats['skipped']++;
        } else {
            PaymentChannel::create([
                'code'        => 'epay',
                'name'        => '易支付',
                'driver'      => 'epay',
                'config'      => [
                    'pid'     => '1000',
                    'key'     => 'demo_epay_key',
                    'gateway' => 'https://pay.example.com/',
                ],
                'status'      => PaymentChannel::STATUS_ENABLED,
                'sort'        => 0,
                'create_time' => $now,
                'update_time' => $now,
            ]);
            $output->writeln('[db:seed] channel epay: created');
            $stats['created']++;
        }

        // 3) 演示商户 ------------------------------------------------------
        $merchant = Merchant::where('username', 'demo_merchant')->find();
        if ($merchant) {
            $output->writeln('[db:seed] merchant: skipped (exists)');
            $stats['skipped']++;
        } else {
            $merchant = Merchant::create([
                'username'        => 'demo_merchant',
                'password'        => password_hash('demo123456', PASSWORD_BCRYPT),
                'email'           => 'demo_merchant@example.com',
                'store_name'      => '演示店铺',
                'store_slug'      => 'demo',
                'status'          => Merchant::STATUS_ACTIVE,
                'balance'         => '0.00',
                'frozen_balance'  => '0.00',
                'commission_rate' => '0.0000',
                'create_time'     => $now,
                'update_time'     => $now,
            ]);
            $output->writeln('[db:seed] merchant: created');
            $stats['created']++;
        }
        $merchantId = (int) $merchant->id;

        // 3.1) 店铺装修补齐(幂等:仅在缺失/为空时回填,deposit/verified 平台控)
        $decoration = [
            'logo'           => 'https://picsum.photos/seed/mklogo/200/200',
            'cover'          => 'https://picsum.photos/seed/mkshop/800/300',
            'intro'          => '专业发卡 · 自动发货秒到账',
            'announcement'   => '本店全场自动发货,7×24 在线,假一赔十',
            'contact_qq'     => '800820820',
            'contact_wechat' => 'miaoka_kf',
            'contact_mobile' => '18800000000',
            'deposit'        => '10000.00',
            'verified'       => 1,
        ];
        $patch = [];
        foreach ($decoration as $field => $value) {
            $cur = $merchant->getAttr($field);
            if ($cur === null || $cur === '' || $cur === '0.00' || $cur === 0) {
                $patch[$field] = $value;
            }
        }
        if ($patch) {
            $patch['update_time'] = $now;
            Merchant::where('id', $merchantId)->update($patch);
            $merchant = Merchant::find($merchantId);
            $output->writeln('[db:seed] decoration: patched (' . implode(',', array_keys($patch)) . ')');
            $stats['created']++;
        } else {
            $output->writeln('[db:seed] decoration: skipped (complete)');
            $stats['skipped']++;
        }

        // 3.2) 分类(以 merchant_id + name 唯一定位)------------------------
        $categoryDefs = [
            ['name' => '流媒体会员', 'image' => 'https://picsum.photos/seed/cat-stream/300/200'],
            ['name' => 'AI工具',    'image' => 'https://picsum.photos/seed/cat-ai/300/200'],
            ['name' => '游戏充值',   'image' => 'https://picsum.photos/seed/cat-game/300/200'],
            ['name' => '软件授权',   'image' => 'https://picsum.photos/seed/cat-soft/300/200'],
        ];
        $categoryIds = [];
        $catCreated = 0;
        $catSkipped = 0;
        $sort = 0;
        foreach ($categoryDefs as $def) {
            $cat = Category::where('merchant_id', $merchantId)->where('name', $def['name'])->find();
            if ($cat) {
                if (($cat->getAttr('image') === null || $cat->getAttr('image') === '')) {
                    Category::where('id', $cat->id)->update(['image' => $def['image'], 'update_time' => $now]);
                }
                $catSkipped++;
            } else {
                $cat = Category::create([
                    'merchant_id' => $merchantId,
                    'name'        => $def['name'],
                    'image'       => $def['image'],
                    'sort'        => $sort,
                    'status'      => Category::STATUS_SHOWN,
                    'create_time' => $now,
                    'update_time' => $now,
                ]);
                $catCreated++;
            }
            $categoryIds[$def['name']] = (int) $cat->id;
            $sort++;
        }
        $output->writeln("[db:seed] categories: created {$catCreated}, skipped {$catSkipped}");
        $stats['created'] += $catCreated;
        $stats['skipped'] += $catSkipped;

        // 4) 演示商品(以 merchant_id + sku 唯一定位)----------------------
        $product = Product::where('merchant_id', $merchantId)->where('sku', 'DEMO-SKU')->find();
        if ($product) {
            $output->writeln('[db:seed] product: skipped (exists)');
            $stats['skipped']++;
        } else {
            $product = Product::create([
                'merchant_id'      => $merchantId,
                'title'            => '演示商品',
                'sku'              => 'DEMO-SKU',
                'description'      => '种子数据自动生成的演示商品',
                'price'            => '9.90',
                'type'             => Product::TYPE_AUTO,
                'stock'            => 0,
                'sales_count'      => 0,
                'min_buy'          => 1,
                'max_buy'          => 0,
                'delivery_message' => '感谢购买演示商品',
                'status'           => Product::STATUS_ON,
                'sort'             => 0,
                'create_time'      => $now,
                'update_time'      => $now,
            ]);
            $output->writeln('[db:seed] product: created');
            $stats['created']++;
        }
        $productId = (int) $product->id;

        // 5) 演示卡密(逐张以 product_id + secret_hash 去重,同步 stock)---
        $cardCreated = 0;
        $cardSkipped = 0;
        foreach (self::DEMO_CARDS as $secret) {
            $hash = Card::hashSecret($secret);
            if (Card::where('product_id', $productId)->where('secret_hash', $hash)->find()) {
                $cardSkipped++;
                continue;
            }
            Card::create([
                'merchant_id' => $merchantId,
                'product_id'  => $productId,
                'secret'      => $secret,
                'secret_hash' => $hash,
                'status'      => Card::STATUS_UNSOLD,
                'batch_no'    => 'demo',
                'create_time' => $now,
                'update_time' => $now,
            ]);
            $cardCreated++;
        }
        if ($cardCreated > 0) {
            // 相对增量,保持 stock 与未售卡真值一致(同 CardService::import 约定)
            Product::where('id', $productId)->where('merchant_id', $merchantId)
                ->inc('stock', $cardCreated)->update();
        }
        $output->writeln("[db:seed] cards: created {$cardCreated}, skipped {$cardSkipped}");
        $stats['created'] += $cardCreated;
        $stats['skipped'] += $cardSkipped;

        // 6) 丰富演示商品(各自带 image/market_price/category,并导入卡密)----
        $productDefs = [
            [
                'sku' => 'NETFLIX-1M', 'slug' => 'netflix', 'title' => 'Netflix 奈飞 高级会员 1个月',
                'price' => '29.90', 'market_price' => '79.00', 'category' => '流媒体会员',
                'sales_count' => 1280, 'cards' => 8,
                'delivery' => '下单后自动发货:账号|密码,登录后请勿修改密码',
            ],
            [
                'sku' => 'SPOTIFY-3M', 'slug' => 'spotify', 'title' => 'Spotify 高级会员 季卡',
                'price' => '45.00', 'market_price' => '99.00', 'category' => '流媒体会员',
                'sales_count' => 643, 'cards' => 6,
                'delivery' => '自动发货:兑换码,前往官网兑换',
            ],
            [
                'sku' => 'CHATGPT-PLUS', 'slug' => 'chatgpt', 'title' => 'ChatGPT Plus 共享车位 月卡',
                'price' => '59.00', 'market_price' => '145.00', 'category' => 'AI工具',
                'sales_count' => 2310, 'cards' => 10,
                'delivery' => '自动发货:登录链接,即开即用',
            ],
            [
                'sku' => 'CLAUDE-PRO', 'slug' => 'claudepro', 'title' => 'Claude Pro 高级账号 月卡',
                'price' => '65.00', 'market_price' => '160.00', 'category' => 'AI工具',
                'sales_count' => 1567, 'cards' => 9,
                'delivery' => '自动发货:账号|密码',
            ],
            [
                'sku' => 'STEAM-100', 'slug' => 'steam', 'title' => 'Steam 充值卡 100 元面值',
                'price' => '95.00', 'market_price' => '100.00', 'category' => '游戏充值',
                'sales_count' => 890, 'cards' => 7,
                'delivery' => '自动发货:充值码',
            ],
            [
                'sku' => 'GENSHIN-648', 'slug' => 'genshin', 'title' => '原神 创世结晶 6480 充值',
                'price' => '328.00', 'market_price' => '648.00', 'category' => '游戏充值',
                'sales_count' => 456, 'cards' => 6,
                'delivery' => '自动发货:兑换序列号',
            ],
            [
                'sku' => 'WIN11-PRO', 'slug' => 'win11', 'title' => 'Windows 11 专业版 正版密钥',
                'price' => '38.00', 'market_price' => '199.00', 'category' => '软件授权',
                'sales_count' => 3120, 'cards' => 10,
                'delivery' => '自动发货:激活密钥,系统设置中激活',
            ],
            [
                'sku' => 'OFFICE-2021', 'slug' => 'office', 'title' => 'Office 2021 专业增强版 密钥',
                'price' => '49.00', 'market_price' => '249.00', 'category' => '软件授权',
                'sales_count' => 2045, 'cards' => 8,
                'delivery' => '自动发货:激活密钥',
            ],
        ];

        $richProductCreated = 0;
        $richProductSkipped = 0;
        $richCardCreated = 0;
        $sort = 1;
        foreach ($productDefs as $def) {
            $p = Product::where('merchant_id', $merchantId)->where('sku', $def['sku'])->find();
            if ($p) {
                $richProductSkipped++;
            } else {
                $p = Product::create([
                    'merchant_id'      => $merchantId,
                    'category_id'      => $categoryIds[$def['category']] ?? null,
                    'title'            => $def['title'],
                    'sku'              => $def['sku'],
                    'image'            => 'https://picsum.photos/seed/' . $def['slug'] . '/400/300',
                    'description'      => $def['title'] . ' · 官方正版,自动发货秒到账',
                    'price'            => $def['price'],
                    'market_price'     => $def['market_price'],
                    'type'             => Product::TYPE_AUTO,
                    'stock'            => 0,
                    'sales_count'      => $def['sales_count'],
                    'min_buy'          => 1,
                    'max_buy'          => 0,
                    'delivery_message' => $def['delivery'],
                    'status'           => Product::STATUS_ON,
                    'sort'             => $sort,
                    'create_time'      => $now,
                    'update_time'      => $now,
                ]);
                $richProductCreated++;
            }
            $pid = (int) $p->id;

            // 导入卡密(逐张以 product_id + secret_hash 去重,同步 stock)
            $made = 0;
            for ($i = 1; $i <= $def['cards']; $i++) {
                $secret = strtoupper($def['slug']) . '-' . str_pad((string) $i, 4, '0', STR_PAD_LEFT);
                $hash = Card::hashSecret($secret);
                if (Card::where('product_id', $pid)->where('secret_hash', $hash)->find()) {
                    continue;
                }
                Card::create([
                    'merchant_id' => $merchantId,
                    'product_id'  => $pid,
                    'secret'      => $secret,
                    'secret_hash' => $hash,
                    'status'      => Card::STATUS_UNSOLD,
                    'batch_no'    => 'demo',
                    'create_time' => $now,
                    'update_time' => $now,
                ]);
                $made++;
            }
            if ($made > 0) {
                Product::where('id', $pid)->where('merchant_id', $merchantId)
                    ->inc('stock', $made)->update();
            }
            $richCardCreated += $made;
            $sort++;
        }
        $output->writeln("[db:seed] rich products: created {$richProductCreated}, skipped {$richProductSkipped}; cards created {$richCardCreated}");
        $stats['created'] += $richProductCreated + $richCardCreated;
        $stats['skipped'] += $richProductSkipped;

        $output->writeln("[db:seed] done: created {$stats['created']}, skipped {$stats['skipped']}");
        return 0;
    }
}
