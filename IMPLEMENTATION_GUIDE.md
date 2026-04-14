# Lux Door Dealer Hub - Backend Implementation Guide

## Overview

This document provides a comprehensive guide to the production-ready backend architecture for the Lux Door e-commerce platform.

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│           Frontend (Next.js 14+)                │
│    (lux-door-dealer-hub-front)                  │
│  - Public product pages                         │
│  - Lead form submission                         │
│  - Comments system                              │
└──────────────┬──────────────────────────────────┘
               │ HTTP/HTTPS
               ▼
┌─────────────────────────────────────────────────┐
│         Backend (Next.js 14+ API)               │
│    (lux-door-dealer-hub-back)                   │
├─────────────────────────────────────────────────┤
│  API Routes (/api)                              │
│  ├─ /auth/[...nextauth]  → NextAuth.js          │
│  ├─ /products           → CRUD operations       │
│  ├─ /leads              → Lead management       │
│  ├─ /comments           → Comment CRUD          │
│  └─ /admin              → Admin operations      │
├─────────────────────────────────────────────────┤
│  Server Actions (lib/services/actions.ts)       │
│  ├─ createProduct()                             │
│  ├─ updateLeadStatus()                          │
│  ├─ deleteComment()                             │
│  ├─ manageAdmin()                               │
│  └─ ... more                                    │
├─────────────────────────────────────────────────┤
│  Middleware (middleware.ts)                     │
│  ├─ Route protection                            │
│  ├─ Auth verification                           │
│  └─ Session validation                          │
└──────────────┬──────────────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌──────────────┐
│PostgreSQL  Cloudinary  NextAuth.js  │
│ Database   Image CDN    Sessions     │
└──────────┘ └────────┘ └──────────────┘
```

## Core Components

### 1. Database Schema (Prisma)

**Models:**

#### User
Stores admin credentials with role-based access control.
```prisma
model User {
  id       String   @id @default(cuid())
  username String   @unique
  password String   // bcryptjs hashed
  role     UserRole @default(ADMIN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum UserRole {
  SUPERADMIN  // Can manage admins
  ADMIN       // Can manage content
}
```

**Key Constraints:**
- Username is unique
- Password is hashed and never returned in API responses
- Only SUPERADMIN can create/delete other admins
- 11Minimum one SUPERADMIN must always exist

#### Category
Multilingual product categories.
```prisma
model Category {
  id       String    @id @default(cuid())
  nameUz   String    // Uzbek
  nameRu   String    // Russian
  products Product[]
  createdAt DateTime @default(now())
}
```

#### Product
Core product model with dynamic attributes.
```prisma
model Product {
  id             String   @id @default(cuid())
  nameUz         String
  nameRu         String
  descriptionUz  String   @db.Text
  descriptionRu  String   @db.Text
  price          Decimal  @db.Decimal(10, 2)  // NOT Float!
  categoryId     String
  images         String[] // Cloudinary URLs
  attributes     Json     // JSONB for flexible specs
  category       Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  comments       Comment[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([categoryId])
  @@index([createdAt])
}
```

**Dynamic Attributes Example:**
```json
{
  "material": "MDF",
  "thickness": "5cm",
  "color": "White",
  "width": "80cm",
  "height": "200cm",
  "customAttr": "any value"
}
```

#### Comment
Product reviews with ratings.
```prisma
model Comment {
  id        String   @id @default(cuid())
  productId String
  text      String   @db.Text
  rating    Int      // 1-5, validated at app level
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([productId])
}
```

#### Lead
Customer inquiries and contact information.
```prisma
model Lead {
  id        String     @id @default(cuid())
  name      String
  phone     String     // Validated format
  message   String     @db.Text
  status    LeadStatus @default(NOT_CALLED)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([status])
  @@index([createdAt])
}

enum LeadStatus {
  NOT_CALLED
  CALLED
}
```

**Key Features:**
- Decimal for prices (prevents floating-point errors)
- JSONB for flexible product attributes
- Proper indexing for performance
- Cascading deletes where appropriate
- Timestamps on all models

### 2. Authentication System

**Architecture:**
```
NextAuth.js (Session Management)
    ↓
Credentials Provider (username/password)
    ↓
Password Verification (bcryptjs)
    ↓
JWT Token (secure session)
    ↓
Session Callback (attach user metadata)
```

**Flow:**
1. User logs in with username/password
2. Password is verified against bcryptjs hash
3. JWT token is created and sent to client
4. Token is stored in HTTP-only cookie (NextAuth default)
5. Each request validates token and checks authorization

**Security Features:**
- Passwords hashed with 10 rounds of bcryptjs
- JWT tokens with 7-day expiration
- Auto-refresh sessions every 24 hours
- Role-based access control (RBAC)
- Middleware-enforced route protection
- CSRF protection built-in (NextAuth)

### 3. Authorization Layer

**Role-Based Access Control:**

```typescript
// SUPERADMIN - Full control
Can: Create/delete admins, manage everything

// ADMIN - Content management
Can: Manage products, leads, comments
Cannot: Manage admin users
```

**Authorization Utilities:**

```typescript
// Require authentication
await requireAuth()  // Throws if not logged in

// Require specific role
await requireRole("SUPERADMIN")  // Only SUPERADMIN
await requireRole("ADMIN")       // ADMIN or SUPERADMIN

// Check role without throwing
await hasRole("SUPERADMIN")  // Returns boolean

// Get current user ID
const userId = await getCurrentUserId()
```

### 4. Input Validation (Zod)

All API inputs are validated with Zod schemas:

```typescript
LoginSchema              // username, password
ProductSchema          // nameUz, nameRu, price, etc.
CommentSchema          // productId, text, rating (1-5)
LeadSchema             // name, phone, message
CreateAdminSchema      // username, strong password
CategorySchema         // nameUz, nameRu
UpdateLeadStatusSchema // id, status
ImageUploadSchema      // base64 image data
```

**Benefits:**
- Type-safe request validation
- Clear error messages
- Protection against invalid inputs
- Prevents injection attacks

### 5. Server Actions Pattern

All backend logic is in `lib/services/actions.ts` as "use server" functions.

**Response Pattern:**
```typescript
interface ServerActionResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

**Example Usage:**
```typescript
// Frontend component
const result = await createProduct({
  nameUz: "...",
  price: "250000",
  // ...
})

if (result.success) {
  console.log("Product created:", result.data)
} else {
  console.error("Error:", result.error)
}
```

**Advantages:**
- No need for separate `/api` routes (though we have both)
- Direct access to database and auth
- Type-safe implementation
- Easy error handling
- Automatic code-splitting

### 6. Cloudinary Integration

**Image Upload Flow:**
```
1. Frontend captures image or gets file input
2. Convert to Base64
3. Send to /api/admin/upload (admin only)
4. Cloudinary SDK transforms and uploads
5. Return secure URL
6. Save URL to product.images[]
```

**Utilities:**
```typescript
uploadToCloudinary(base64, folder)  // Upload image
deleteFromCloudinary(publicId)       // Delete image
getCloudinaryUrl(publicId, w, h)     // Get transformed URL
```

**Features:**
- Automatic image optimization
- CDN distribution
- Responsive sizing
- Secure deletion

## File Structure

```
app/
├── api/                          # REST API routes
│   ├── auth/[...nextauth]/
│   ├── products/
│   │   ├── route.ts             # GET, POST
│   │   └── [id]/route.ts        # PUT, DELETE
│   ├── leads/
│   │   └── route.ts             # GET, POST, PATCH
│   ├── comments/
│   │   └── route.ts             # GET, POST, DELETE
│   └── admin/
│       ├── upload/              # Image upload
│       └── users/               # Admin management
├── admin/                        # Admin UI
│   ├── layout.tsx               # Admin layout with nav
│   ├── page.tsx                 # Dashboard
│   ├── login/page.tsx           # Login form
│   ├── products/page.tsx        # Product management
│   ├── leads/page.tsx           # Lead management
│   └── users/page.tsx           # Admin user management
├── layout.tsx                   # Root layout
└── page.tsx                     # Redirect to admin

lib/
├── auth/
│   ├── authOptions.ts           # NextAuth config
│   ├── auth.ts                  # Authorization utilities
│   └── password.ts              # Hash/verify passwords
├── services/
│   ├── actions.ts               # All server actions
│   └── cloudinary.ts            # Image upload utility
├── validators/
│   └── index.ts                 # Zod schemas
└── prisma.ts                    # Prisma client singleton

prisma/
├── schema.prisma                # Database schema
└── seed.js                      # Database seeding

middleware.ts                    # Route protection

.env.local                       # Development secrets
```

## API Routes Reference

### Authentication (NextAuth)
```
POST /api/auth/signin         # Login
POST /api/auth/signout        # Logout
POST /api/auth/callback/credentials # Auth handler
GET  /api/auth/session        # Get session info
```

### Products
```
GET    /api/products?page=1&category=<id>
POST   /api/products                    (admin)
PUT    /api/products/<id>               (admin)
DELETE /api/products/<id>               (admin)
```

### Leads
```
GET    /api/leads?status=NOT_CALLED     (admin)
POST   /api/leads                       (public)
PATCH  /api/leads                       (admin)
```

### Comments
```
GET    /api/comments?productId=<id>
POST   /api/comments                    (public)
DELETE /api/comments?id=<id>            (admin)
```

### Admin Features
```
POST   /api/admin/upload                (admin)
GET    /api/admin/users                 (superadmin)
POST   /api/admin/users                 (superadmin)
DELETE /api/admin/users?id=<id>        (superadmin)
```

## Development Workflow

### 1. Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
```

### 2. Database Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed default admin
npm run prisma:seed

# Open Prisma Studio (optional)
npm run prisma:studio
```

### 3. Development
```bash
# Start dev server (port 3001)
npm run dev

# Visit http://localhost:3001/admin/login
# Default: username "ogabek06", password "ogabek06Aa"
```

### 4. Creating New Features

**Adding a new endpoint:**
1. Define Zod schema in `lib/validators/index.ts`
2. Create server action in `lib/services/actions.ts`
3. Optional: Create API route in `app/api/`
4. Use in frontend/admin components

**Example: New product attribute**
1. Update Prisma schema
2. Run migration
3. Update ProductSchema validators
4. Update ProductForm component

## Best Practices Applied

✅ **Security**
- Input validation with Zod
- Password hashing with bcryptjs
- Role-based access control (RBAC)
- Middleware route protection
- CSRF prevention (NextAuth)
- No sensitive data in logs

✅ **Performance**
- Database indexing on frequently queried columns
- Pagination for large datasets
- Efficient queries with includes
- Image optimization with Cloudinary
- Session token caching

✅ **Code Quality**
- TypeScript strict mode
- Separation of concerns (auth, actions, validators)
- Reusable utilities and services
- Structured error handling
- Consistent naming conventions
- Proper logging

✅ **Scalability**
- JSONB for flexible schema
- Decimal for price precision
- Cascading deletes prevent orphaned data
- Modular action system
- Clean API design

✅ **Maintainability**
- Clear folder structure
- Self-documenting code
- Comprehensive error messages
- Easy to add new features
- Database schema versioning (migrations)

## Production Checklist

- [ ] Generate production NEXTAUTH_SECRET (use `openssl rand -base64 32`)
- [ ] Set PostgreSQL production connection string
- [ ] Configure Cloudinary credentials
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Enable HTTPS for all connections
- [ ] Set up database backups
- [ ] Configure error logging (Sentry, LogRocket, etc.)
- [ ] Set up rate limiting (optional: use next-rate-limit)
- [ ] Enable CORS if needed
- [ ] Review security headers
- [ ] Set up monitoring and alerts
- [ ] Test all edge cases
- [ ] Performance test with load simulator
- [ ] Create disaster recovery plan

## Troubleshooting

### "DATABASE_URL not found"
Ensure `.env.local` has `DATABASE_URL` set correctly.

### "Unauthorized" errors
Check that NextAuth session is valid: `npm run dev` and visit `/api/auth/session`

### Prisma migration fails
Run: `npm run prisma:migrate` to create migration files

### Images don't upload
Verify Cloudinary credentials in `.env.local`

### Role-based routes not working
Clear browser cookies and log in again

## Next Steps

1. **Connect Frontend**: Update frontend to call backend API
2. **Database Setup**: Configure PostgreSQL (local or cloud)
3. **Cloudinary Setup**: Create Cloudinary account and get credentials
4. **Local Development**: Test all features locally
5. **Deploy**: Deploy to Vercel, Render, or your hosting provider

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Zod Validation](https://zod.dev)
- [PostgreSQL](https://www.postgresql.org/docs)
- [Cloudinary](https://cloudinary.com/documentation)

## Support

For issues or questions:
1. Check the logs in terminal
2. Review error messages in browser console
3. Check `.env.local` configuration
4. Review Prisma migrations with `npx prisma migrate status`
5. Check database with Prisma Studio: `npm run prisma:studio`
