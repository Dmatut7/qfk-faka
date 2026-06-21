import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 后端地址(开发期 dev server 代理转发,免 CORS;生产用 VITE_API_BASE 覆盖)
const BACKEND = process.env.VITE_BACKEND || 'http://127.0.0.1:8765';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    // 允许从 app 之外导入 ../design-system 的源码
    fs: { allow: ['..'] },
    // 把后端真实路由代理到 PHP 服务,前端用相对路径 fetch 即可
    proxy: {
      '/s': BACKEND,
      '/buyer': BACKEND,
      '/pay': BACKEND,
      '/health': BACKEND,
    },
  },
});
