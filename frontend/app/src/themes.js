/* 店铺主题预设(平台级)。key 与后端 Merchant::THEMES 一致;
   vars 为该主题对店铺前台品牌色 CSS 变量的覆盖。 */
export const THEMES = {
  default: { label: '淘宝橙(默认)', swatch: '#FF5000', vars: { '--brand': '#FF5000', '--brand-active': '#C23A00', '--brand-soft': '#FFF3EC', '--brand-soft-border': '#FFE3D1', '--secure-solid': '#0FA9A0' } },
  emerald: { label: '翡翠绿', swatch: '#059669', vars: { '--brand': '#059669', '--brand-active': '#047857', '--brand-soft': '#ecfdf5', '--brand-soft-border': '#d1fae5', '--secure-solid': '#0d9488' } },
  rose:    { label: '玫瑰红', swatch: '#e11d48', vars: { '--brand': '#e11d48', '--brand-active': '#be123c', '--brand-soft': '#fff1f2', '--brand-soft-border': '#ffe4e6', '--secure-solid': '#db2777' } },
  amber:   { label: '琥珀橙', swatch: '#d97706', vars: { '--brand': '#d97706', '--brand-active': '#b45309', '--brand-soft': '#fffbeb', '--brand-soft-border': '#fef3c7', '--secure-solid': '#ea580c' } },
  sky:     { label: '天空蓝', swatch: '#0284c7', vars: { '--brand': '#0284c7', '--brand-active': '#0369a1', '--brand-soft': '#f0f9ff', '--brand-soft-border': '#e0f2fe', '--secure-solid': '#0891b2' } },
  violet:  { label: '紫罗兰', swatch: '#7c3aed', vars: { '--brand': '#7c3aed', '--brand-active': '#6d28d9', '--brand-soft': '#f5f3ff', '--brand-soft-border': '#ede9fe', '--secure-solid': '#9333ea' } },
};

export const THEME_KEYS = Object.keys(THEMES);

/** 把主题 key 解析为 CSS 文本(用于注入 :root 覆盖)。未知 key 回退 default。 */
export function themeCss(key) {
  const t = THEMES[key] || THEMES.default;
  const body = Object.entries(t.vars).map(([k, v]) => `${k}:${v};`).join('');
  return `:root{${body}}`;
}
