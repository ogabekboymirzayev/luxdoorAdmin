# Lux Door Dealer Hub - Backend

Production-ready backend for the Lux Door e-commerce platform built with Next.js 14+, TypeScript, Prisma, PostgreSQL, and NextAuth.js.

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Credentials Provider)
- **Image Storage**: Cloudinary
- **UI/Form Validation**: Zod
- **Security**: bcryptjs for password hashing

### Project Structure

```
app/
  ├── api/
  │   ├── auth/[...nextauth]/       # NextAuth configuration
  │   ├── admin/
  │   │   ├── upload/               # Cloudinary image upload
  │   │   └── users/                # Admin user management
  │   ├── products/                 # Product CRUD endpoints
  │   ├── leads/                    # Lead management endpoints
  │   └── comments/                 # Comment management endpoints
  ├── layout.tsx
  └── page.tsx
lib/
  ├── auth/
  │   ├── authOptions.ts            # NextAuth configuration
  │   ├── auth.ts                   # Authorization utilities
  │   └── password.ts               # Password hashing/verification
  ├── services/
  │   ├── actions.ts                # Server Actions (CRUD operations)
  │   └── cloudinary.ts             # Cloudinary integration
  ├── validators/
  │   └── index.ts                  # Zod validation schemas
  └── prisma.ts                     # Prisma client instance
prisma/
  ├── schema.prisma                 # Database schema
  └── seed.js                       # Database seeding script
middleware.ts                       # Route protection middleware
```

## 📦 Setup Instructions

### 1. Install Dependencies

```bash
cd lux-door-dealer-hub-back
npm install
# or
bun install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: JWT secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Backend URL (e.g., `http://localhost:3001`)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `NEXT_PUBLIC_FRONTEND_URL`: Frontend URL (e.g., `http://localhost:3000`)

### 3. Setup PostgreSQL Database

```bash
# Create database
createdb lux_door_db

# Or use Docker
docker run --name postgres-lux \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lux_door_db \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Run Database Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed with default SUPERADMIN user
npm run prisma:seed
```

This creates a default SUPERADMIN user:
- Username: `ogabek06`
- Password: `ogabek06Aa`

### 5. Start Development Server

```bash
npm run dev
```

Backend will be available at `http://localhost:3001`

## 🔐 Authentication & Authorization

### User Roles
- **SUPERADMIN**: Can manage admins and perform all operations
- **ADMIN**: Can manage products, leads, and comments

### Protected Routes
- `/admin/*` - All admin pages
- `/api/admin/*` - Admin API endpoints
- `/api/leads/*` - Lead management endpoints
- `/api/products/admin/*` - Product admin endpoints

### Session Strategy
- JWT-based sessions
- 7-day session expiration
- 24-hour auto-refresh

## 📚 API Documentation

### Products

#### Get Products
```
GET /api/products?page=1&limit=10&categoryId=<id>
```

#### Create Product
```
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "nameUz": "MDF Eshik",
  "nameRu": "MDF дверь",
  "descriptionUz": "...",
  "descriptionRu": "...",
  "price": "250000.00",
  "categoryId": "<uuid>",
  "images": ["https://..."],
  "attributes": {
    "material": "MDF",
    "thickness": "5cm"
  }
}
```

#### Update Product
```
PUT /api/products/<id>
```

#### Delete Product
```
DELETE /api/products/<id>
```

### Leads

#### Get Leads (Admin)
```
GET /api/leads?page=1&limit=10&status=NOT_CALLED
Authorization: Bearer <token>
```

#### Create Lead (Public)
```
POST /api/leads
Content-Type: application/json

{
  "name": "John",
  "phone": "+998901234567",
  "message": "I'm interested in doors"
}
```

#### Update Lead Status (Admin)
```
PATCH /api/leads
Authorization: Bearer <token>

{
  "id": "<uuid>",
  "status": "CALLED"
}
```

### Comments

#### Get Comments
```
GET /api/comments?productId=<id>&page=1&limit=10
```

#### Create Comment (Public)
```
POST /api/comments
Content-Type: application/json

{
  "productId": "<uuid>",
  "text": "Great product!",
  "rating": 5
}
```

#### Delete Comment (Admin)
```
DELETE /api/comments?id=<uuid>
Authorization: Bearer <token>
```

### Image Upload (Admin)

```
POST /api/admin/upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "base64": "data:image/jpeg;base64,...",
  "folder": "lux-doors/products"
}
```

## 🛠️ Server Actions

Server Actions are defined in `lib/services/actions.ts`:

- `createProduct(input)` - Create product
- `updateProduct(id, input)` - Update product
- `deleteProduct(id)` - Delete product
- `getProducts(page, limit, categoryId)` - Fetch products
- `createLead(input)` - Create lead
- `updateLeadStatus(input)` - Update lead status
- `getLeads(page, limit, status)` - Fetch leads
- `createComment(input)` - Create comment
- `deleteComment(id)` - Delete comment
- `getComments(productId, page, limit)` - Fetch comments
- `createAdmin(input)` - Create admin (SUPERADMIN)
- `deleteAdmin(id)` - Delete admin (SUPERADMIN)
- `getAdmins()` - Fetch admins (SUPERADMIN)

### Usage in Components

```typescript
import { createProduct } from "@/lib/services/actions";

export default function ProductForm() {
  const handleSubmit = async (data) => {
    const result = await createProduct(data);
    
    if (result.success) {
      console.log("Product created:", result.data);
    } else {
      console.error("Error:", result.error);
    }
  };

  // ...
}
```

## 💾 Database Schema

### User
- `id` (UUID)
- `username` (unique)
- `password` (hashed)
- `role` (SUPERADMIN | ADMIN)
- `createdAt`, `updatedAt`

### Category
- `id` (UUID)
- `nameUz`, `nameRu` (multilingual)
- `createdAt`, `updatedAt`

### Product
- `id` (UUID)
- `nameUz`, `nameRu` (multilingual)
- `descriptionUz`, `descriptionRu` (multilingual, TEXT)
- `price` (Decimal, not Float)
- `categoryId` (FK)
- `images` (String[])
- `attributes` (JSONB)
- `createdAt`, `updatedAt`

### Comment
- `id` (UUID)
- `productId` (FK)
- `text` (TEXT)
- `rating` (1-5)
- `createdAt`, `updatedAt`

### Lead
- `id` (UUID)
- `name`
- `phone`
- `message` (TEXT)
- `status` (NOT_CALLED | CALLED)
- `createdAt`, `updatedAt`

## 🔍 Dynamic Attributes (JSONB)

Products support dynamic attributes stored as JSONB:

```typescript
const product = await createProduct({
  // ... other fields
  attributes: {
    material: "MDF",
    thickness: "5cm",
    color: "White",
    width: "80cm",
    customAttribute: "value"
  }
});
```

Attributes are flexible and can be extended without schema changes.

## 🎯 Best Practices Implemented

✅ Input validation with Zod  
✅ Type-safe TypeScript (strict mode)  
✅ Server-side authentication & authorization  
✅ Proper error handling (`try/catch`)  
✅ Structured API responses  
✅ Database indexing for performance  
✅ Cascading deletes where appropriate  
✅ Structured logging  
✅ CSRF protection (NextAuth built-in)  
✅ Password hashing with bcryptjs  
✅ JWT session management  
✅ Middleware route protection  
✅ Clean separation of concerns  
✅ Reusable utilities and services  

## 📖 Documentation Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Zod Validation](https://zod.dev)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)

## 🚀 Production Deployment

### Before Deploying:

1. **Generate new NEXTAUTH_SECRET**
   ```bash
   openssl rand -base64 32
   ```

2. **Set strong passwords in .env.production**

3. **Enable HTTPS** and set `NEXTAUTH_URL` accordingly

4. **Use PostgreSQL** in production (not SQLite)

5. **Enable database backups**

6. **Monitor logs and errors**

7. **Set up rate limiting** for API endpoints

### Deployment Platforms

- **Vercel** (recommended for Next.js)
- **Railway**
- **Render**
- **AWS EC2**
- **DigitalOcean**

## 📝 License

Proprietary - Lux Door Dealer Hub
