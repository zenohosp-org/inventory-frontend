import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/api/auth': {
                target: process.env.VITE_DIRECTORY_BACKEND_URL || 'https://api-directory.zenohosp.com',
                changeOrigin: true,
                secure: false,
            },
            '/api': {
                target: process.env.VITE_INVENTORY_BACKEND_URL || 'http://localhost:8082',
                changeOrigin: true,
                secure: false,
            },
            '/oauth2': {
                target: process.env.VITE_INVENTORY_BACKEND_URL || 'http://localhost:8082',
                changeOrigin: true,
                secure: false,
            },
            '/login/oauth2': {
                target: process.env.VITE_INVENTORY_BACKEND_URL || 'http://localhost:8082',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
