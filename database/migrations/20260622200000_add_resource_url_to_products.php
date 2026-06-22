<?php

use think\migration\Migrator;

class AddResourceUrlToProducts extends Migrator
{
    public function change()
    {
        $this->table('products')
            ->addColumn('resource_url', 'string', [
                'limit'   => 500,
                'default' => null,
                'null'    => true,
                'comment' => '资源类商品的受保护下载地址(经签名限时链对外)',
                'after'   => 'delivery_message',
            ])
            ->update();
    }
}
