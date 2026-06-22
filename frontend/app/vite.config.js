import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// 后端地址(开发期 dev server 代理转发,免 CORS;生产用 VITE_API_BASE 覆盖)
const BACKEND = process.env.VITE_BACKEND || 'http://127.0.0.1:8765';

export default defineConfig({
  plugins: [react()],
  // 多页:买家前台 index.html + 运营控制台 console.html
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        console: resolve(__dirname, 'console.html'),
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    // 允许从 app 之外导入 ../design-system 的源码
    fs: { allow: ['..'] },
    // 把后端真实路由代理到 PHP 服务,前端用相对路径 fetch 即可。
    // 用锚定正则键:'/s' 前缀会误吃 /src/*,故店铺路由必须用 ^/s/ 精确匹配。
    proxy: {
      '^/s/': BACKEND,
      '^/buyer/': BACKEND,
      '^/pay/': BACKEND,
      '^/health': BACKEND,
      '^/merchant/': BACKEND,
      '^/admin/': BACKEND,
      '^/index/': BACKEND,
      '^/config': BACKEND,
    },
  },
});
