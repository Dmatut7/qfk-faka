<?php

use think\migration\Migrator;
use think\migration\db\Column;

class AddStorefrontFields extends Migrator
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-abstractmigration-class
     *
     * The following commands can be used in this method and Phinx will
     * automatically reverse them when rolling back:
     *
     *    createTable
     *    renameTable
     *    addColumn
     *    renameColumn
     *    addIndex
     *    addForeignKey
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change()
    {
        // 商品:封面图 + 划线原价(对标鲸发卡 image / market_price)
        $this->table('products')
            ->addColumn('image', 'string', ['limit' => 500, 'null' => true, 'default' => null, 'comment' => '商品封面图 URL', 'after' => 'sku'])
            ->addColumn('market_price', 'decimal', ['precision' => 10, 'scale' => 2, 'null' => true, 'default' => null, 'comment' => '划线原价', 'after' => 'price'])
            ->update();

        // 店铺装修 + 信任 + 客服(对标鲸发卡 Shop/info)
        $this->table('merchants')
            ->addColumn('logo', 'string', ['limit' => 500, 'null' => true, 'default' => null, 'comment' => '店铺头像', 'after' => 'store_slug'])
            ->addColumn('cover', 'string', ['limit' => 500, 'null' => true, 'default' => null, 'comment' => '店铺封面横幅', 'after' => 'logo'])
            ->addColumn('intro', 'string', ['limit' => 255, 'null' => true, 'default' => null, 'comment' => '店铺简介', 'after' => 'cover'])
            ->addColumn('announcement', 'text', ['null' => true, 'default' => null, 'comment' => '店铺公告', 'after' => 'intro'])
            ->addColumn('contact_qq', 'string', ['limit' => 50, 'null' => true, 'default' => null, 'comment' => '客服 QQ', 'after' => 'announcement'])
            ->addColumn('contact_wechat', 'string', ['limit' => 100, 'null' => true, 'default' => null, 'comment' => '客服微信', 'after' => 'contact_qq'])
            ->addColumn('contact_mobile', 'string', ['limit' => 50, 'null' => true, 'default' => null, 'comment' => '客服手机', 'after' => 'contact_wechat'])
            ->addColumn('deposit', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => '0.00', 'comment' => '保证金', 'after' => 'frozen_balance'])
            ->addColumn('verified', 'integer', ['limit' => \Phinx\Db\Adapter\MysqlAdapter::INT_TINY, 'default' => 0, 'comment' => '认证:0未认证 1已认证', 'after' => 'deposit'])
            ->addColumn('sales_count', 'integer', ['default' => 0, 'comment' => '店铺成交数', 'after' => 'verified'])
            ->update();

        // 分类:图(对标鲸发卡 categoryList image)
        $this->table('categories')
            ->addColumn('image', 'string', ['limit' => 500, 'null' => true, 'default' => null, 'comment' => '分类图', 'after' => 'name'])
            ->update();
    }
}
