<?php
declare(strict_types=1);

namespace app\model;

use think\Model;

/**
 * 门户内容(资讯/新闻/常见问题/单页)。
 * type 区分内容类型;category 用于同类型下的分组(如 FAQ 分类 Tab)。
 * status=1 发布 / 0 草稿;按 sort 倒序、id 倒序展示。
 */
class Article extends Model
{
    protected $name = 'articles';

    protected $type = [
        'id'     => 'integer',
        'type'   => 'integer',
        'status' => 'integer',
        'sort'   => 'integer',
        'views'  => 'integer',
    ];

    // 内容类型
    public const TYPE_NEWS = 1; // 资讯/新闻
    public const TYPE_FAQ  = 2; // 常见问题
    public const TYPE_PAGE = 3; // 单页(关于/帮助/协议)

    public const TYPES = [self::TYPE_NEWS, self::TYPE_FAQ, self::TYPE_PAGE];

    // 发布状态
    public const STATUS_DRAFT     = 0;
    public const STATUS_PUBLISHED = 1;

    public function isPublished(): bool
    {
        return (int) $this->status === self::STATUS_PUBLISHED;
    }
}
