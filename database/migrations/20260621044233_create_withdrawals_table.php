<?php

use Phinx\Db\Adapter\MysqlAdapter;
use think\migration\Migrator;

class CreateWithdrawalsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('withdrawals', [
            'id'          => false,
            'primary_key' => ['id'],
            'engine'      => 'InnoDB',
            'collation'   => 'utf8mb4_unicode_ci',
            'comment'     => '商户提现单',
        ]);

        $table->addColumn('id', 'biginteger', ['identity' => true, 'signed' => false])
            ->addColumn('merchant_id', 'biginteger', ['signed' => false, 'null' => false])
            ->addColumn('amount', 'decimal', ['precision' => 10, 'scale' => 2, 'null' => false])
            ->addColumn('fee', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => 0, 'null' => false])
            ->addColumn('account_info', 'string', ['limit' => 255, 'null' => false, 'comment' => '收款账户'])
            ->addColumn('status', 'integer', ['limit' => MysqlAdapter::INT_TINY, 'default' => 0, 'null' => false, 'comment' => '0待审/1通过/2拒绝/3已打款'])
            ->addColumn('processed_at', 'datetime', ['null' => true])
            ->addColumn('create_time', 'datetime', ['null' => true])
            ->addColumn('update_time', 'datetime', ['null' => true])
            ->addIndex(['merchant_id', 'status'], ['name' => 'idx_merchant_status'])
            ->addForeignKey('merchant_id', 'merchants', 'id', ['delete' => 'RESTRICT', 'update' => 'NO_ACTION', 'constraint' => 'fk_withdrawals_merchant'])
            ->create();
    }
}
