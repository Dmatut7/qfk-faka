import React from 'react';
import { Button } from '../../design-system/components/core/Button.jsx';
import { PriceTag } from '../../design-system/components/core/PriceTag.jsx';

// F1 占位:验证 Vite + 设计系统 ESM 接入打通。后续迭代替换为真实店铺路由。
export default function App() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <h1 style={{ color: 'var(--text-strong)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
        极客发卡 · 买家前台
      </h1>
      <p style={{ color: 'var(--text-body)', marginTop: 8 }}>
        设计系统已通过 ESM 接入(Vite 重构中)。下一步对接真实后端。
      </p>
      <div style={{ marginTop: 16 }}>
        <PriceTag amount={9.9} />
      </div>
      <div style={{ marginTop: 16 }}>
        <Button variant="primary" size="lg">立即购买</Button>
      </div>
    </div>
  );
}
