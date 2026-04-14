# Deployment & Configuration Guide

## Local Development Setup

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL 12+
- Cloudinary account (free tier works)
- Git

### Step-by-Step Setup

#### 1. Clone and Install
```bash
cd lux-door-dealer-hub-back
npm install  # or bun install
```

#### 2. Create Local Database
```bash
# PostgreSQL (macOS with Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb lux_door_db

# Or use Docker (recommended)
docker run --name lux-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lux_door_db \
  -p 5432:5432 \
  -d postgres:15

# Verify connection
psql -U postgres -d lux_door_db -c "SELECT 1"
```

#### 3. Environment Variables
```bash
# Copy template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Example `.env.local`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lux_door_db"
NEXTAUTH_SECRET="generated-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
NEXT_PUBLIC_FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

#### 4. Database Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed default admin
npm run prisma:seed

# View database with Studio (optional)
npm run prisma:studio
```

#### 5. Start Development
```bash
npm run dev

# Open http://localhost:3001/admin/login
# Login: username "ogabek06", password "ogabek06Aa"
```

---

## Production Deployment

### Option 1: Vercel (Recommended for Next.js)

#### Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel  # Follow prompts
```

#### Configuration
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add production environment variables:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_FRONTEND_URL=https://frontend.yourdomain.com
NODE_ENV=production
```

#### Deploy Prisma Database
```bash
# Option A: Use Vercel Postgres (recommended)
# In Vercel dashboard: Settings → Storage → Create Database

# Option B: Use external PostgreSQL (Railway, Render, etc.)
# Get connection string and add to VERCEL env vars
```

#### Run Migrations on Production
```bash
# Connect to production database
# Then run migrations
npx prisma migrate deploy

# Seed production (if needed)
# Be careful with this in production!
node prisma/seed.js
```

### Option 2: Railway.app

#### Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Deploy
railway up
```

#### Database
Railway provides built-in PostgreSQL:
1. Go to Railway dashboard
2. Create new service → PostgreSQL
3. Copy connection string
4. Add to project variables

#### Environment Variables
```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set NEXTAUTH_SECRET="..."
# ... add all env vars
```

### Option 3: Render.com

#### Setup
1. Push code to GitHub
2. Visit https://render.com
3. Create New → Web Service
4. Connect GitHub repository
5. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node

#### Database
1. Create PostgreSQL database in Render
2. Copy connection string
3. Add to environment variables

### Option 4: Self-Hosted (AWS, DigitalOcean, etc.)

#### Prerequisites
- Server with Node.js 18+
- PostgreSQL database
- Nginx or Apache for reverse proxy
- SSL certificate (Let's Encrypt)

#### Setup
```bash
# SSH into server
ssh user@server.com

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Clone repository
git clone https://github.com/yourusername/lux-door-back.git
cd lux-door-back

# Install dependencies
npm ci --production

# Setup .env for production
nano .env.local

# Build application
npm run build

# Setup process manager
npm install -g pm2
pm2 start "npm start" --name "lux-door-back"
pm2 startup
pm2 save
```

#### Nginx Configuration
```nginx
upstream lux_door_api {
    server localhost:3001;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://lux_door_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/lux-door /etc/nginx/sites-enabled/

# Test & reload
sudo nginx -t
sudo systemctl reload nginx
```

#### SSL Certificate
```bash
# Using Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## Database Hosting Options

### Option 1: Vercel Postgres
- **Pros**: Seamless Vercel integration, managed backups
- **Cons**: Can be expensive at scale
- **Cost**: Pay-as-you-go

### Option 2: Railway PostgreSQL
- **Pros**: Easy setup, good UI, affordable
- **Cons**: Limited customization
- **Cost**: $5/month + usage

### Option 3: Render PostgreSQL
- **Pros**: Reliable, good performance
- **Cons**: Need to manage backups manually
- **Cost**: $15/month (smallest instance)

### Option 4: AWS RDS
- **Pros**: Highly scalable, managed backups
- **Cons**: Complex setup, can be expensive
- **Cost**: ~$20/month (t3.micro)

### Option 5: DigitalOcean Managed Database
- **Pros**: Good performance, reasonable pricing
- **Cons**: Limited free tier
- **Cost**: $15/month

---

## Monitoring & Maintenance

### Health Checks
```bash
# Check API is running
curl http://localhost:3001/api/products

# Check database connection
npm run prisma:studio  # Opens web interface
```

### Backup Strategy
```bash
# PostgreSQL backup
pg_dump lux_door_db > backup.sql

# Automated daily backup (cron)
0 2 * * * pg_dump lux_door_db | gzip > /backups/db_$(date +%Y%m%d).sql.gz
```

### Log Monitoring
```bash
# PM2 logs
pm2 logs

# View production logs
vercel logs  # If using Vercel
```

### Error Tracking (Optional)
Add to project for production:
```bash
npm install @sentry/nextjs  # Error tracking
npm install winston          # Structured logging
```

---

## Performance Optimization

### Database
```prisma
// Add indexes for frequently queried columns
model Product {
  @@index([categoryId])
  @@index([createdAt])
  @@index([price])  // If filtering by price
}
```

### Caching
```typescript
// Add response caching headers
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data)
  response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
  return response
}
```

### Database Connection Pooling
```env
# For larger deployments, use PgBouncer
DATABASE_URL="postgresql://user:pass@pgbouncer:6432/db"
```

---

## Security Hardening

### Environment Variables
```bash
# Generate strong NEXTAUTH_SECRET
openssl rand -base64 32

# Store securely in platform's secret manager
vercel env add NEXTAUTH_SECRET  # Vercel
railway variables set NEXTAUTH_SECRET  # Railway
```

### HTTPS Only
```typescript
// middleware.ts - Add HTTPS redirect
if (process.env.NODE_ENV === 'production' && req.headers.get('x-forwarded-proto') !== 'https') {
  return NextResponse.redirect(`https://${req.headers.get('host')}${req.nextUrl.pathname}`)
}
```

### Rate Limiting
```bash
npm install next-rate-limit
```

```typescript
// lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),  // 10 requests per hour
})
```

### CORS Configuration
```typescript
// app/api/cors.ts
const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com'
]

export function setCORS(request: Request, response: Response) {
  const origin = request.headers.get('origin')
  
  if (allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  
  return response
}
```

---

## Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run prisma:generate
```

### Database connection refused
```bash
# Check PostgreSQL is running
psql -U postgres -d lux_door_db -c "SELECT 1"

# Check DATABASE_URL in .env.local
cat .env.local | grep DATABASE_URL
```

### NextAuth not working

```bash
# Regenerate NEXTAUTH_SECRET
openssl rand -base64 32

# Update .env.local with new secret
# Clear browser cookies
# Log in again
```

### Cloudinary upload fails
1. Verify credentials in Cloudinary dashboard
2. Check API Key and API Secret
3. Verify cloud name
4. Test upload to Cloudinary directly

### Memory issues in production
```javascript
// prisma.ts - Adjust connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
})
```

---

## Domain & DNS Setup

### Buy Domain
Use Namecheap, GoDaddy, or Google Domains

### DNS Records
```
Type   Name            Value
A      yourdomain.com  -> Vercel/Server IP
CNAME  api             -> yourdomain.com (alias)
CNAME  www             -> yourdomain.com (alias)
```

### HTTPS Redirect
Configured automatically by Vercel or use:
```nginx
# Nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Scaling Strategies

### Stage 1: MVP (Current)
- Single Vercel instance
- Shared PostgreSQL
- Cloudinary CDN
- ~$30-50/month

### Stage 2: Growth
- Vercel auto-scaling
- Dedicated PostgreSQL (RDS/Railway+ tier)
- Redis caching layer
- CloudFlare CDN
- ~$100-200/month

### Stage 3: Enterprise
- Multiple server regions
- Database replication
- Load balancer
- Advanced caching
- Dedicated infrastructure
- ~$500+/month

---

## Disaster Recovery

### Backup Strategy
- Daily automated database backups
- Store in separate region
- Test restore procedures monthly

### Disaster Recovery Plan
1. Identify issue
2. Restore from latest backup
3. Update DNS to backup instance
4. Investigate root cause
5. Deploy hotfix
6. Restore to production

### Health Monitoring
```typescript
// /api/health - Simple health check
export async function GET() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'OK', timestamp: new Date() })
  } catch (error) {
    return NextResponse.json({ status: 'ERROR' }, { status: 500 })
  }
}
```

---

## Maintenance Windows

Schedule for:
- Database maintenance: 2 AM UTC
- Dependency updates: Weekly
- Security patches: Immediately
- Feature releases: Monthly

Notify users in advance of major changes.

---

## Success!

You now have a production-ready Lux Door e-commerce backend!

For support:
- Check logs first
- Review .env.local config
- Test database connectivity
- Clear browser cache and cookies
- Contact platform support (Vercel, Railway, etc.)
