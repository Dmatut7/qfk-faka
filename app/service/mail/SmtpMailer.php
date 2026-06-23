<?php
declare(strict_types=1);

namespace app\service\mail;

use RuntimeException;

/**
 * 极简 SMTP 客户端(fsockopen,无第三方依赖)。
 *
 * 支持:
 * - 隐式 TLS:secure='ssl'(常见 465 端口,连接即 ssl://)
 * - STARTTLS:secure='tls'(常见 587 端口,EHLO 后升级)
 * - 明文:secure='none'(25 端口,不推荐)
 *
 * 设计为 fire-and-forget 的底层:任一步失败即抛 RuntimeException,
 * 由 DeliveryMailService 捕获吞掉,绝不影响发货主流程。带 socket 超时防卡死。
 */
class SmtpMailer implements MailerInterface
{
    private string $host;
    private int $port;
    private string $user;
    private string $pass;
    private string $from;
    private string $secure; // ssl | tls | none
    private int $timeout;

    public function __construct(string $host, int $port, string $user, string $pass, string $from, string $secure = 'ssl', int $timeout = 8)
    {
        $this->host    = $host;
        $this->port    = $port > 0 ? $port : 465;
        $this->user    = $user;
        $this->pass    = $pass;
        $this->from    = $from !== '' ? $from : $user;
        $this->secure  = in_array($secure, ['ssl', 'tls', 'none'], true) ? $secure : 'ssl';
        $this->timeout = $timeout > 0 ? $timeout : 8;
    }

    public function send(string $to, string $subject, string $html): bool
    {
        $transport = $this->secure === 'ssl' ? 'ssl://' : 'tcp://';
        $fp = @stream_socket_client(
            $transport . $this->host . ':' . $this->port,
            $errno,
            $errstr,
            $this->timeout,
            STREAM_CLIENT_CONNECT
        );
        if (!$fp) {
            throw new RuntimeException("SMTP 连接失败:{$errstr}({$errno})");
        }
        stream_set_timeout($fp, $this->timeout);

        try {
            $this->expect($fp, 220);
            $ehloHost = $this->safeEhloName();
            $this->cmd($fp, 'EHLO ' . $ehloHost, 250);

            if ($this->secure === 'tls') {
                $this->cmd($fp, 'STARTTLS', 220);
                if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new RuntimeException('STARTTLS 加密协商失败');
                }
                $this->cmd($fp, 'EHLO ' . $ehloHost, 250);
            }

            // AUTH LOGIN(用户名/密码非空时才鉴权)
            if ($this->user !== '') {
                $this->cmd($fp, 'AUTH LOGIN', 334);
                $this->cmd($fp, base64_encode($this->user), 334);
                $this->cmd($fp, base64_encode($this->pass), 235);
            }

            $this->cmd($fp, 'MAIL FROM:<' . $this->from . '>', 250);
            $this->cmd($fp, 'RCPT TO:<' . $to . '>', 250);
            $this->cmd($fp, 'DATA', 354);

            $data = $this->buildMessage($to, $subject, $html);
            fwrite($fp, $data . "\r\n.\r\n");
            $this->expect($fp, 250);

            $this->cmd($fp, 'QUIT', 221);
        } finally {
            @fclose($fp);
        }

        return true;
    }

    /** 组装符合 RFC 的邮件报文(UTF-8 HTML,主题 MIME 编码,正文行内 . 转义)。 */
    private function buildMessage(string $to, string $subject, string $html): string
    {
        $headers = [
            'Date: ' . date('r'),
            'From: ' . $this->from,
            'To: ' . $to,
            'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
        ];
        // DATA 阶段需对行首单独的 "." 做转义(SMTP dot-stuffing)
        $body = preg_replace('/^\./m', '..', $html);
        return implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n", "\r\n", (string) $body);
    }

    /** 发命令并校验响应码。 */
    private function cmd($fp, string $line, int $expect): void
    {
        fwrite($fp, $line . "\r\n");
        $this->expect($fp, $expect);
    }

    /** 读多行响应,校验状态码。 */
    private function expect($fp, int $code): void
    {
        $resp = '';
        while (($line = fgets($fp, 512)) !== false) {
            $resp .= $line;
            // 多行响应:第 4 个字符是 '-' 表示后续还有;是空格表示结束
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        $got = (int) substr($resp, 0, 3);
        if ($got !== $code) {
            throw new RuntimeException("SMTP 期望 {$code} 实得:" . trim($resp));
        }
    }

    /** EHLO 主机名:取 from 的域名,缺省 localhost(避免泄露内网名)。 */
    private function safeEhloName(): string
    {
        $at = strrpos($this->from, '@');
        $domain = $at !== false ? substr($this->from, $at + 1) : '';
        return $domain !== '' ? $domain : 'localhost';
    }
}
