<?php

use think\migration\Migrator;

class CreateSystemSettingsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('system_settings', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '平台配置(KV)',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('setting_key', 'string', ['limit' => 64, 'null' => false, 'comment' => '配置键(避保留字 key)'])
            ->addColumn('setting_value', 'text', ['null' => true, 'comment' => '配置值'])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['setting_key'], ['unique' => true, 'name' => 'uniq_key'])
            ->create();
    }
}
