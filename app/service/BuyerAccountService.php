<?php
declare(strict_types=1);

namespace app\service;

use app\common\BizException;
use app\common\Code;
use app\model\AccessToken;
use app\model\Buyer;
use app\model\Order;
use think\facade\Db;

/**
 * 买家账号(可选):注册 / 登录 / 我的信息 / 我的订单。
 * 订单按 buyer_email(大小写不敏感)关联——注册后即可看到此前游客单的历史。
 * 游客下单不受影响,无需账号。
 */
class BuyerAccountService
{
    /** 用户名不存在时也跑一次 verify,消除 timing 差,防邮箱枚举。 */
    private const DUMMY_HASH = '$2y$10$usesomesillystringfooietnsomethingxxxxxxxxxxxxxxxxxxxxxxxxxxx';

    public function register(string $email, string $password, string $contact = ''): array
    {
        $email = strtolower(trim($email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new BizException(Code::PARAM_ERROR, '邮箱格式不正确');
        }
        if (strlen($password) < 6) {
            throw new BizException(Code::PARAM_ERROR, '密码至少 6 位');
        }
        if (Buyer::where('email', $email)->find()) {
            throw new BizException(Code::STATE_INVALID, '该邮箱已注册');
        }

        $now = date('Y-m-d H:i:s');
        try {
            $buyer = Buyer::create([
                'email'       => $email,
                'password'    => password_hash($password, PASSWORD_BCRYPT),
                'contact'     => trim($contact) !== '' ? trim($contact) : null,
                'status'      => Buyer::STATUS_NORMAL,
                'create_time' => $now,
                'update_time' => $now,
            ]);
        } catch (\think\db\exception\PDOException $e) {
            // 并发同邮箱注册:check 与 create 间的竞态命中唯一约束 1062 → 返回干净业务错误,而非裸 500
            $msg = $e->getMessage();
            if (false !== stripos($msg, 'Duplicate entry') || false !== strpos($msg, '1062')) {
                throw new BizException(Code::STATE_INVALID, '该邮箱已注册');
            }
            throw $e;
        }

        return $this->issueFor($buyer);
    }

    public function login(string $email, string $password, string $ip = ''): array
    {
        $email = strtolower(trim($email));
        $buyer = Buyer::where('email', $email)->find();
        // 不存在也跑一次 verify,消除响应耗时差(防邮箱枚举)
        $ok = password_verify($password, $buyer && $buyer->password ? (string) $buyer->password : self::DUMMY_HASH);
        if (!$buyer || !$buyer->password || !$ok) {
            throw new BizException(Code::UNAUTHORIZED, '邮箱或密码错误');
        }
        if ((int) $buyer->status !== Buyer::STATUS_NORMAL) {
            throw new BizException(Code::FORBIDDEN, '账号已禁用');
        }

        return $this->issueFor($buyer);
    }

    private function issueFor(Buyer $buyer): array
    {
        $token = (new TokenService())->issue(AccessToken::OWNER_BUYER, (int) $buyer->id);
        return ['token' => $token, 'buyer' => $buyer->toArray()];
    }

    /**
     * 我的订单:按 **buyer_id** 关联(登录状态下单时绑定),分页倒序。
     *
     * 安全:不按 buyer_email 认领历史游客单——注册无邮箱验证,按邮箱认领会让任何人
     * 注册他人邮箱即可看其订单与卡密。仅展示确实绑定到本账号(凭令牌下单)的订单。
     * 历史游客单仍可在「订单查询」凭订单号+邮箱取卡。
     */
    public function listOrders(Buyer $buyer, int $page = 1, int $size = 20): array
    {
        $q = Order::where('buyer_id', (int) $buyer->id);
        $total = $q->count();
        $items = $q->order('id', 'desc')->page($page, $size)->select()->toArray();

        return ['total' => $total, 'page' => $page, 'items' => $items];
    }
}
