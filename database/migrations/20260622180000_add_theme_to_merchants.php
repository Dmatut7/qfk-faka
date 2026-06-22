<?php

use think\migration\Migrator;

class AddThemeToMerchants extends Migrator
{
    public function change()
    {
        $this->table('merchants')
            ->addColumn('theme', 'string', [
                'limit'   => 32,
                'default' => 'default',
                'null'    => false,
                'comment' => '店铺主题配色 key(前台渲染)',
                'after'   => 'cover',
            ])
            ->update();
    }
}
