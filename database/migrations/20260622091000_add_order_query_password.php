<?php

use think\migration\Migrator;

class AddOrderQueryPassword extends Migrator
{
    public function change()
    {
        $this->table('orders')
            ->addColumn('query_password', 'string', [
                'limit'   => 255,
                'default' => '',
                'null'    => false,
                'comment' => '查单密码(bcrypt 哈希,空串=未设置,可替代邮箱查单)',
            ])
            ->update();
    }
}
