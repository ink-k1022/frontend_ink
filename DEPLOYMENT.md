# 部署指南

## 📋 目錄

1. [前端部署](#前端部署)
2. [後端部署](#後端部署)
3. [環境變數設定](#環境變數設定)
4. [效能優化](#效能優化)
5. [監控與日誌](#監控與日誌)

---

## 🎨 前端部署

### GitHub Pages（免費）

**適合**: 靜態網站、個人專案

**步驟**:

1. **準備代碼**
   ```bash
   # 確保 config.js 中的 API_BASE_URL 指向生產環境
   # 設定正確的 Google Maps API Key
   ```

2. **推送到 GitHub**
   ```bash
   git add .
   git commit -m "準備部署"
   git push origin main
   ```

3. **啟用 GitHub Pages**
   - 進入 GitHub 倉庫 → Settings → Pages
   - Source 選擇 `main` 分支
   - 保存

4. **訪問網站**
   ```
   https://username.github.io/repository-name/
   ```

**注意**: GitHub Pages 不支援環境變數，需直接在 `config.js` 中設定。

---

### Netlify（推薦）

**適合**: 需要環境變數、自動部署

**步驟**:

1. **連接 GitHub**
   - 登入 [Netlify](https://www.netlify.com/)
   - New site from Git → 選擇倉庫

2. **設定建置**
   - Build command: （留空）
   - Publish directory: `/`（根目錄）

3. **設定環境變數**
   - Site settings → Environment variables
   - 添加 `GOOGLE_MAPS_API_KEY`
   - 添加 `API_BASE_URL`

4. **自動部署**
   - 每次 push 到 main 分支自動部署

**進階設定** (`netlify.toml`):
```toml
[build]
  publish = "."

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-api.com/api/:splat"
  status = 200
  force = true
```

---

### Vercel

**適合**: 現代化前端、邊緣函數

**步驟**:

1. **安裝 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **部署**
   ```bash
   vercel
   ```

3. **設定環境變數**
   ```bash
   vercel env add GOOGLE_MAPS_API_KEY
   vercel env add API_BASE_URL
   ```

4. **生產部署**
   ```bash
   vercel --prod
   ```

---

### AWS S3 + CloudFront

**適合**: 企業級、需要 CDN

**步驟**:

1. **建立 S3 Bucket**
   ```bash
   aws s3 mb s3://your-app-name
   aws s3 website s3://your-app-name --index-document index.html
   ```

2. **上傳文件**
   ```bash
   aws s3 sync . s3://your-app-name --exclude ".git/*"
   ```

3. **設定 CloudFront**
   - 建立 CloudFront Distribution
   - Origin 指向 S3 bucket
   - 啟用 HTTPS

4. **設定 CORS**
   ```json
   {
     "CORSRules": [{
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET"],
       "AllowedHeaders": ["*"]
     }]
   }
   ```

---

## 🔧 後端部署

### Heroku（簡單快速）

**步驟**:

1. **安裝 Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **登入並建立應用**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **設定環境變數**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set DATABASE_URL=your_database_url
   ```

4. **部署**
   ```bash
   git push heroku main
   ```

5. **查看日誌**
   ```bash
   heroku logs --tail
   ```

**Procfile** (根目錄):
```
web: node backend-examples/nodejs-express/server.js
```

---

### AWS EC2

**適合**: 完全控制、高流量

**步驟**:

1. **啟動 EC2 實例**
   - 選擇 Ubuntu 20.04 LTS
   - t2.micro（免費方案）或更高

2. **SSH 連線**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **安裝環境**
   ```bash
   # 更新系統
   sudo apt update && sudo apt upgrade -y
   
   # 安裝 Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # 安裝 PM2
   sudo npm install -g pm2
   ```

4. **部署應用**
   ```bash
   # 克隆代碼
   git clone your-repo-url
   cd your-repo/backend-examples/nodejs-express
   
   # 安裝依賴
   npm install --production
   
   # 使用 PM2 啟動
   pm2 start server.js --name "api-server"
   pm2 startup
   pm2 save
   ```

5. **設定 Nginx 反向代理**
   ```bash
   sudo apt install nginx
   ```
   
   編輯 `/etc/nginx/sites-available/default`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
   
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **設定 SSL（Let's Encrypt）**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

### Docker 部署

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY backend-examples/nodejs-express/package*.json ./
RUN npm install --production

COPY backend-examples/nodejs-express/ .

EXPOSE 3000

CMD ["node", "server.js"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    restart: always
    
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: always

volumes:
  mongo-data:
```

**部署**:
```bash
docker-compose up -d
```

---

## 🔐 環境變數設定

### 前端環境變數

不建議在前端存放敏感資訊，但可設定：

**config.js** (用於 API 端點):
```javascript
const CONFIG = {
    API: {
        BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api'
    }
};
```

### 後端環境變數

**`.env` 文件**:
```env
# 伺服器設定
NODE_ENV=production
PORT=3000

# 資料庫
DATABASE_URL=mongodb://localhost:27017/venues
DATABASE_NAME=venues_db

# API 金鑰
GOOGLE_PLACES_API_KEY=your_key_here

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com

# JWT（如需要）
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# 日誌
LOG_LEVEL=info
```

**讀取環境變數** (Node.js):
```javascript
require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,
    database: process.env.DATABASE_URL,
    // ...
};
```

---

## ⚡ 效能優化

### 前端優化

1. **壓縮資源**
   ```bash
   # 安裝工具
   npm install -g minify
   
   # 壓縮 CSS
   minify styles.css > styles.min.css
   
   # 壓縮 JS
   minify app-refactored.js > app-refactored.min.js
   ```

2. **啟用快取**
   ```html
   <link rel="stylesheet" href="styles.min.css?v=1.0.0">
   <script src="app-refactored.min.js?v=1.0.0"></script>
   ```

3. **使用 CDN**
   - 將靜態資源上傳到 CDN
   - 修改資源路徑

### 後端優化

1. **啟用壓縮**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **設定快取**
   ```javascript
   const redis = require('redis');
   const client = redis.createClient();
   
   // 快取查詢結果
   app.get('/api/venues', async (req, res) => {
       const cacheKey = `venues:${lat}:${lng}:${radius}`;
       const cached = await client.get(cacheKey);
       
       if (cached) {
           return res.json(JSON.parse(cached));
       }
       
       // 查詢資料庫...
       const data = await queryDatabase();
       
       // 存入快取（5分鐘）
       await client.setex(cacheKey, 300, JSON.stringify(data));
       res.json(data);
   });
   ```

3. **資料庫索引**
   ```javascript
   // MongoDB 地理空間索引
   db.venues.createIndex({ location: "2dsphere" });
   db.venues.createIndex({ category: 1, rating: -1 });
   ```

---

## 📊 監控與日誌

### 前端監控

**Google Analytics**:
```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 後端監控

**PM2 監控**:
```bash
pm2 monit
pm2 logs
pm2 status
```

**Winston 日誌**:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});
```

---

## ✅ 部署檢查清單

### 前端
- [ ] Google Maps API Key 已設定
- [ ] API Base URL 指向生產環境
- [ ] 停用開發模式 (ENABLE_MOCK_DATA: false)
- [ ] 資源已壓縮
- [ ] HTTPS 已啟用
- [ ] 測試所有功能

### 後端
- [ ] 環境變數已設定
- [ ] 資料庫已連線
- [ ] CORS 已正確配置
- [ ] API 速率限制已啟用
- [ ] 錯誤處理已完善
- [ ] 日誌系統已配置
- [ ] SSL 憑證已安裝
- [ ] 備份機制已建立

---

**祝您部署順利！** 🚀
