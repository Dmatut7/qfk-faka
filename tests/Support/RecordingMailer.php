<?php
declare(strict_types=1);

namespace tests\Support;

use app\service\mail\MailerInterface;

/** 测试替身:记录每次 send 的参数,不真正发邮件。 */
class RecordingMailer implements MailerInterface
{
    /** @var array<int,array{to:string,subject:string,html:string}> */
    public array $sent = [];

    public function send(string $to, string $subject, string $html): bool
    {
        $this->sent[] = ['to' => $to, 'subject' => $subject, 'html' => $html];
        return true;
    }

    public function last(): ?array
    {
        return $this->sent === [] ? null : $this->sent[count($this->sent) - 1];
    }
}
