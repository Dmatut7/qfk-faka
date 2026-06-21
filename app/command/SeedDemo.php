<?php
declare(strict_types=1);

namespace app\command;

use app\model\Admin;
use app\model\Card;
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
 *  - 示例支付渠道(code='epay',driver='EpayDriver',启用);
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
                'driver'      => 'EpayDriver',
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

        $output->writeln("[db:seed] done: created {$stats['created']}, skipped {$stats['skipped']}");
        return 0;
    }
}
