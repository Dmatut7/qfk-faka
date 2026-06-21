<?php

use think\migration\Migrator;

class CreateAccessTokensTable extends Migrator
{
    public function change()
    {
        $table = $this->table('access_tokens', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '登录令牌(admin/merchant/buyer 多态,仅存哈希)',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('owner_type', 'string', ['limit' => 16, 'null' => false, 'comment' => 'admin/merchant/buyer'])
            ->addColumn('owner_id', 'biginteger', ['signed' => false, 'null' => false])
            ->addColumn('token_hash', 'char', ['limit' => 64, 'null' => false, 'collation' => 'ascii_bin', 'encoding' => 'ascii', 'comment' => 'SHA-256(明文 token)'])
            ->addColumn('expires_at', 'datetime', ['null' => false])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addIndex(['token_hash'], ['unique' => true, 'name' => 'uniq_token'])
            ->addIndex(['owner_type', 'owner_id'], ['name' => 'idx_owner'])
            ->addIndex(['expires_at'], ['name' => 'idx_expire'])
            ->create();
    }
}
