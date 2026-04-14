# Frontend Integration Guide

How the frontend (`lux-door-dealer-hub-front`) integrates with the backend API.

## Overview

The frontend can interact with the backend in two ways:

1. **Server Actions** (preferred for Next.js to Next.js communication)
2. **REST API Routes** (for any client, includes Next.js frontend)

Since both frontend and backend are Next.js, we recommend using **Server Actions** for best DX.

---

## Server Actions (Recommended)

Server Actions are functions marked with `"use server"` that run on the server and can be called from client components.

### Location
Backend: `lux-door-dealer-hub-back/lib/services/actions.ts`

### Usage in Frontend

#### 1. Importing Server Actions
```typescript
// In lux-door-dealer-hub-front - client component
"use client"

import { 
  getProducts, 
  createProduct, 
  createLead, 
  updateLeadStatus 
} from "@/lib/services/actions"
// Assuming you add an import alias for backend services
```

**Better approach:** Create a wrapper layer in frontend

```typescript
// lux-door-dealer-hub-front/lib/api.ts
const API_BASE = "http://localhost:3001"

export async function fetchProducts(page = 1, limit = 10, categoryId?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (categoryId) params.append("categoryId", categoryId)
  
  const res = await fetch(`${API_BASE}/api/products?${params}`)
  return res.json()
}

export async function submitLead(data: {name: string; phone: string; message: string}) {
  const res = await fetch(`${API_BASE}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  return res.json()
}
```

### Example: Product Listing Page

```typescript
// lux-door-dealer-hub-front/app/products/page.tsx
"use client"

import { useEffect, useState } from "react"
import { fetchProducts } from "@/lib/api"

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const result = await fetchProducts(page, 10)
        if (result.success) {
          setProducts(result.data.products)
        }
      } catch (error) {
        console.error("Failed to load products:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [page])

  if (loading) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product.id} className="border rounded-lg p-4">
          <h3 className="font-bold">{product.nameUz}</h3>
          <p className="text-gray-600">{product.price.toLocaleString()} sum</p>
          {product.images[0] && (
            <img src={product.images[0]} alt={product.nameUz} />
          )}
        </div>
      ))}
    </div>
  )
}
```

### Example: Lead Submission Form

```typescript
// lux-door-dealer-hub-front/components/LeadForm.tsx
"use client"

import { useState, FormEvent } from "react"
import { submitLead } from "@/lib/api"

export default function LeadForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: ""
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await submitLead(formData)

      if (result.success) {
        setSuccess(true)
        setFormData({ name: "", phone: "", message: "" })
        setTimeout(() => setSuccess(false), 3000)
      } else {
        alert("Error: " + result.error)
      }
    } catch (error) {
      alert("Failed to submit form")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && <div className="bg-green-100 p-4 rounded">Lead submitted!</div>}

      <input
        type="text"
        placeholder="Your name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <input
        type="tel"
        placeholder="Phone number"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
      />

      <textarea
        placeholder="Message"
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send"}
      </button>
    </form>
  )
}
```

### Example: Comment Submission

```typescript
// lux-door-dealer-hub-front/components/CommentForm.tsx
"use client"

import { useState } from "react"

const API_BASE = "http://localhost:3001"

interface CommentFormProps {
  productId: string
  onSuccess?: () => void
}

export default function CommentForm({ productId, onSuccess }: CommentFormProps) {
  const [rating, setRating] = useState(5)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating: parseInt(rating),
          text
        })
      })

      const result = await res.json()

      if (result.success) {
        setText("")
        setRating(5)
        onSuccess?.()
      } else {
        alert("Error: " + result.error)
      }
    } catch (error) {
      console.error("Failed to submit comment:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Rating:</label>
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="1">1 Star</option>
          <option value="2">2 Stars</option>
          <option value="3">3 Stars</option>
          <option value="4">4 Stars</option>
          <option value="5">5 Stars</option>
        </select>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your comment..."
        required
        className="border rounded px-3 py-2 w-full"
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Posting..." : "Post Comment"}
      </button>
    </form>
  )
}
```

---

## REST API Routes

If you prefer REST endpoints, call the API routes directly.

### Base URL
```
Development: http://localhost:3001
Production: https://api.yourdomain.com
```

### Products API

#### Get Products
```typescript
const response = await fetch(
  'http://localhost:3001/api/products?page=1&limit=10&categoryId=<id>'
)
const { success, data, error } = await response.json()

if (success) {
  const { products, pagination } = data
  console.log(products)
}
```

#### Create Product (Admin Only)
```typescript
const response = await fetch(
  'http://localhost:3001/api/products',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}` // if using bearer tokens
    },
    body: JSON.stringify({
      nameUz: 'MDF Eshik',
      nameRu: 'MDF дверь',
      descriptionUz: '...',
      descriptionRu: '...',
      price: '250000.00',
      categoryId: 'uuid-here',
      images: ['https://cloudinary-url.jpg'],
      attributes: {
        material: 'MDF',
        thickness: '5cm'
      }
    })
  }
)

const result = await response.json()
```

#### Update Product
```typescript
const response = await fetch(
  'http://localhost:3001/api/products/product-id',
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData)
  }
)
```

#### Delete Product
```typescript
const response = await fetch(
  'http://localhost:3001/api/products/product-id',
  { method: 'DELETE' }
)
```

### Leads API

#### Submit Lead (Public)
```typescript
const response = await fetch('http://localhost:3001/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    phone: '+998901234567',
    message: 'I am interested in your doors'
  })
})

const result = await response.json()
// { success: true, data: { id, name, phone, message, status, createdAt } }
```

#### Get Leads (Admin Only)
```typescript
const response = await fetch(
  'http://localhost:3001/api/leads?page=1&limit=10&status=NOT_CALLED'
)
const { success, data } = await response.json()
// data = { leads: [...], pagination: { total, page, limit, pages } }
```

### Comments API

#### Get Comments
```typescript
const response = await fetch(
  'http://localhost:3001/api/comments?productId=<id>&page=1&limit=10'
)
const { data } = await response.json()
// { comments: [...], pagination: {...} }
```

#### Submit Comment (Public)
```typescript
const response = await fetch('http://localhost:3001/api/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'product-uuid',
    text: 'Great product!',
    rating: 5
  })
})
```

---

## Authentication

### Login
```typescript
import { signIn } from "next-auth/react"

const handleLogin = async (username: string, password: string) => {
  const result = await signIn("credentials", {
    username,
    password,
    redirect: false
  })

  if (result?.ok) {
    // Logged in successfully
    router.push("/admin")
  } else {
    console.error(result?.error)
  }
}
```

### Get Current Session
```typescript
import { useSession } from "next-auth/react"

export default function MyComponent() {
  const { data: session, status } = useSession()

  if (status === "loading") return <div>Loading...</div>
  if (status === "unauthenticated") return <div>Not logged in</div>

  return (
    <div>
      Welcome, {(session?.user as any)?.username}!
      Role: {(session?.user as any)?.role}
    </div>
  )
}
```

### Logout
```typescript
import { signOut } from "next-auth/react"

<button onClick={() => signOut()}>
  Logout
</button>
```

---

## Image Upload

### Upload to Cloudinary (Admin)
```typescript
async function uploadImage(file: File) {
  // Convert file to base64
  const reader = new FileReader()
  const base64 = await new Promise((resolve) => {
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })

  // Upload to Cloudinary via backend
  const response = await fetch('http://localhost:3001/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base64: base64,
      folder: 'lux-doors/products'
    })
  })

  const result = await response.json()
  // { success: true, data: { url, publicId } }
  return result.data.url
}
```

### Example: File Input
```typescript
"use client"

import { useState } from "react"

export default function ImageUploader() {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState("")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target?.result

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64 })
        })

        const result = await res.json()
        if (result.success) {
          setImageUrl(result.data.url)
        }
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <input 
        type="file" 
        onChange={handleFileChange} 
        accept="image/*"
        disabled={uploading}
      />
      {imageUrl && <img src={imageUrl} alt="Uploaded" className="w-32 h-32" />}
    </>
  )
}
```

---

## Error Handling

### Standard Response Format
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### Error Handling Pattern
```typescript
const handleApiCall = async () => {
  try {
    const result = await someApiFunction()

    if (!result.success) {
      // Show error message
      console.error("API Error:", result.error)
      return
    }

    // Use result.data
    console.log("Success:", result.data)
  } catch (error) {
    // Network or unexpected error
    console.error("Network Error:", error)
  }
}
```

---

## Environment Variables (Frontend)

Add to `lux-door-dealer-hub-front/.env.local`:

```env
# Backend API
NEXT_PUBLIC_API_BASE=http://localhost:3001
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# NextAuth (if using NextAuth in frontend)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

---

## Example: Complete Product Page

```typescript
// lux-door-dealer-hub-front/app/products/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import CommentForm from "@/components/CommentForm"
import CommentsList from "@/components/CommentsList"

const API_BASE = "http://localhost:3001"

interface Product {
  id: string
  nameUz: string
  nameRu: string
  price: string
  images: string[]
  attributes: Record<string, string>
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products?limit=1`)
        const data = await res.json()

        // In real app, you'd fetch by ID from a detail endpoint
        if (data.success && data.data.products[0]) {
          setProduct(data.data.products[0])
        }
      } catch (error) {
        console.error("Failed to fetch product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [])

  if (loading) return <div>Loading...</div>
  if (!product) return <div>Product not found</div>

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Product Image */}
      {product.images[0] && (
        <img
          src={product.images[0]}
          alt={product.nameUz}
          className="w-full h-96 object-cover rounded-lg mb-6"
        />
      )}

      {/* Product Info */}
      <div>
        <h1 className="text-4xl font-bold mb-2">{product.nameUz}</h1>
        <p className="text-gray-600 text-lg mb-4">{product.nameRu}</p>

        <div className="text-3xl font-bold text-blue-600 mb-6">
          {product.price} сум
        </div>

        {/* Attributes */}
        {Object.keys(product.attributes).length > 0 && (
          <div className="mb-8">
            <h3 className="font-bold mb-4">Характеристики:</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.attributes).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <p className="text-gray-600">{key}</p>
                  <p className="font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="mt-12 space-y-8">
        <h2 className="text-2xl font-bold">Reviews</h2>

        <CommentForm productId={product.id} />

        <CommentsList productId={product.id} />
      </div>
    </div>
  )
}
```

---

## CORS Configuration (if needed)

If frontend and backend are on different domains:

**Backend middleware:**
```typescript
// app/api/middleware.ts
export function middleware(request: Request) {
  const response = new Response()

  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_FRONTEND_URL)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  return response
}
```

---

## Testing the Integration

```bash
# Terminal 1: Start backend
cd lux-door-dealer-hub-back
npm run dev  # Port 3001

# Terminal 2: Start frontend
cd lux-door-dealer-hub-front
npm run dev  # Port 3000

# Test APIs
curl http://localhost:3001/api/products
curl http://localhost:3001/api/leads
```

---

You now have everything needed to integrate the frontend with the production backend!
