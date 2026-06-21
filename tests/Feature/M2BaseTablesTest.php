<?php
declare(strict_types=1);

namespace tests\Feature;

use app\model\Admin;
use app\model\SystemSetting;
use tests\TestCase;

/**
 * M2 基础表(T2.1):system_settings / admins 建表 + 模型 CRUD + 唯一索引。
 */
class M2BaseTablesTest extends TestCase
{
    public function testAdminCrud(): void
    {
        $admin = Admin::create([
            'username' => 'root_' . uniqid(),
            'password' => password_hash('secret', PASSWORD_BCRYPT),
            'nickname' => '超管',
        ]);

        $this->assertGreaterThan(0, $admin->id);
        $this->assertIsInt($admin->id);

        $found = Admin::find($admin->id);
        $this->assertSame('超管', $found->nickname);
        $this->assertSame(Admin::STATUS_ENABLED, $found->status, 'status 默认 1');
        $this->assertIsInt($found->status);
        $this->assertTrue(password_verify('secret', $found->password));

        // 时间戳自动写入
        $this->assertNotEmpty($found->create_time);

        // 序列化隐藏密码
        $this->assertArrayNotHasKey('password', $found->toArray());
    }

    public function testAdminUsernameUnique(): void
    {
        $name = 'dup_' . uniqid();
        Admin::create(['username' => $name, 'password' => 'x']);

        $this->expectException(\Exception::class);
        Admin::create(['username' => $name, 'password' => 'y']);
    }

    public function testSystemSettingCrudAndUniqueKey(): void
    {
        $key = 'site_name_' . uniqid();
        SystemSetting::create(['setting_key' => $key, 'setting_value' => 'QFK']);

        $row = SystemSetting::where('setting_key', $key)->find();
        $this->assertSame('QFK', $row->setting_value);

        $this->expectException(\Exception::class);
        SystemSetting::create(['setting_key' => $key, 'setting_value' => 'dup']);
    }
}
