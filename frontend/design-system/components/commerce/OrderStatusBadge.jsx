import React from 'react';
import { Badge } from '../core/Badge.jsx';

const MAP = {
  pending:   { variant: 'pending', label: '待支付', dot: true },
  paid:      { variant: 'brand',   label: '已支付 · 发货中', dot: true },
  delivered: { variant: 'success', label: '已发货', dot: true },
  failed:    { variant: 'danger',  label: '支付失败', dot: true },
  refunded:  { variant: 'neutral', label: '已退款', dot: true },
  closed:    { variant: 'neutral', label: '已关闭', dot: true },
};

export function OrderStatusBadge({ status = 'pending', solid = false, label, ...rest }) {
  const m = MAP[status] || MAP.pending;
  return (
    <Badge variant={m.variant} dot={m.dot} solid={solid} {...rest}>
      {label || m.label}
    </Badge>
  );
}
