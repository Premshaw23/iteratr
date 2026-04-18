# iteratr Project Improvements & Setup Guide

## Summary of Changes

This document outlines all improvements made to the iteratr platform, including bug fixes, new features, and security enhancements.

---

## 🔧 Critical Fixes Applied

### 1. **Stripe Pricing Configuration** (`src/app/api/checkout/session/route.ts`)
**Issue**: Hardcoded pricing to $0.00
**Fix**: Moved to environment variable `PRO_PRICE_CENTS` for easy management during alpha/production transitions
- ✅ Alpha: `PRO_PRICE_CENTS=0` (free)
- ✅ Production: `PRO_PRICE_CENTS=1900` ($19.00)

### 2. **Input Validation - MCQ Answers** (`src/app/api/attempt/route.ts`)
**Issue**: No validation on `parseInt()` result; invalid indices crash silently
**Fix**: Added bounds checking and NaN validation
```typescript
const chosenIndex = parseInt(submitted_answer, 10)
if (isNaN(chosenIndex) || chosenIndex < 0 || chosenIndex >= payload.options.length) {
  return NextResponse.json({ error: 'Invalid MCQ answer index' }, { status: 400 })
}
```

### 3. **JSON Parse Error Handling** (`src/app/api/attempt/route.ts`)
**Issue**: `JSON.parse()` on fill-in-blank answers could crash without error handling
**Fix**: Wrapped with try-catch, returns 400 on invalid JSON
```typescript
let submittedAnswers: string[]
try {
  submittedAnswers = JSON.parse(submitted_answer) as string[]
} catch {
  return NextResponse.json({ error: 'Invalid submitted_answer JSON format' }, { status: 400 })
}
```

---

## ✨ New Feature: Private Data Upload

Users can now upload and manage private learning materials, code snippets, notes, and interview prep content.

### Backend Components

#### 1. **API Route** - `/src/app/api/user/upload/route.ts`

**Endpoints:**

- **POST** - Upload new data
  ```bash
  curl -X POST http://localhost:3000/api/user/upload \
    -H "Content-Type: application/json" \
    -d '{
      "type": "learning_goals|notes|code_snippets|interview_prep|other",
      "title": "System Design Interview Notes",
      "content": "... your content ...",
      "tags": ["system-design", "interviews"],
      "isPublic": false
    }'
  ```
  **Response**: `{ success: true, upload_id: "uuid", message: "Data uploaded successfully" }`

- **GET** - List user's uploads with pagination
  ```bash
  curl http://localhost:3000/api/user/upload?limit=20&offset=0
  ```
  **Response**: `{ uploads: [...], total: number, limit: number, offset: number }`

- **DELETE** - Delete specific upload
  ```bash
  curl -X DELETE http://localhost:3000/api/user/upload?id=upload-uuid
  ```

**Validation:**
- ✅ Authentication required (NextAuth)
- ✅ Content size limit: 1 MB
- ✅ Title length: max 255 characters
- ✅ User can only access their own uploads
- ✅ All operations logged for auditability

#### 2. **Database Schema** - `docs/migrations/001_add_user_uploads_table.sql`

Create this table in your Supabase project:

```sql
create table user_uploads (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references users(id) on delete cascade,
  type          text not null check (type in ('learning_goals', 'notes', 'code_snippets', 'interview_prep', 'other')),
  title         text not null,
  content       text not null,
  tags          text[] default '{}',
  is_public     boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Indexes for fast queries
create index on user_uploads (user_id, created_at desc);
create index on user_uploads (type);
create index on user_uploads (is_public) where is_public = true;

-- Optional: Enable Row-Level Security
alter table user_uploads enable row level security;
```

**To apply the migration:**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the SQL from `docs/migrations/001_add_user_uploads_table.sql`
4. Execute it

### Frontend Components

#### 1. **Upload Page** - `/src/app/upload/page.tsx`

Fully-featured upload interface with:
- ✅ 5 upload types with descriptions
- ✅ Real-time character count for content
- ✅ Tag system (comma-separated)
- ✅ Privacy toggle (private/public)
- ✅ Recent uploads sidebar
- ✅ Delete functionality with confirmation
- ✅ Copy upload ID to clipboard
- ✅ Success notifications
- ✅ Responsive design

**Access:** `/upload` (authenticated users only)

#### 2. **Dashboard Integration** - `/src/app/dashboard/dashboard-client.tsx`

Added "Private Uploads" link to the Commander sidebar menu, making it easy to access from the main dashboard.

---

## 🛡️ Security Enhancements

### Code Execution Rate Limiting (`src/app/api/code/run/route.ts`)

**New Limits:**
- Free users: 50 code executions per day
- Pro users: 500 code executions per day
- Returns 429 (Too Many Requests) when limit exceeded

**Implementation:**
- Uses Upstash Redis for fast rate limiting (if available)
- Falls back to Supabase database counting
- Protects Judge0 API from abuse

**Updated Files:**
- `src/app/api/code/run/route.ts` - Added pre-check before execution
- `src/lib/ratelimit.ts` - Added `checkCodeExecutionLimit()` function

---

## 📋 Setup Instructions

### 1. **Update Environment Variables**

In `.env.local`, ensure these are configured:

```bash
# Stripe pricing (in cents, $0 = free alpha)
PRO_PRICE_CENTS=0

# Keep existing variables unchanged...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
# ... etc
```

### 2. **Apply Database Migration**

```sql
-- Run in Supabase SQL Editor
-- File: docs/migrations/001_add_user_uploads_table.sql
```

Or manually:
1. Open Supabase dashboard
2. Go to SQL Editor
3. Create the `user_uploads` table and indexes

### 3. **Verify Deployment**

Test the new upload feature:

```bash
# 1. Start dev server
npm run dev

# 2. Log in and navigate to /upload
# 3. Try uploading test data
# 4. Verify it appears in "Recent Uploads"
# 5. Test delete functionality
```

---

## 🧪 Testing Checklist

- [ ] **Stripe Flow**: Test checkout with `PRO_PRICE_CENTS=1900` (paid) and `PRO_PRICE_CENTS=0` (free)
- [ ] **MCQ Validation**: Submit invalid MCQ answer (e.g., index 99) → should get 400 error
- [ ] **JSON Validation**: Test fill-in-blank with malformed JSON → should get 400 error
- [ ] **Upload Success**: Upload 5MB content → should get 413 (too large)
- [ ] **Upload Success**: Upload 500KB content → should succeed
- [ ] **Upload Pagination**: Upload 30 items, fetch with `limit=20` → verify pagination works
- [ ] **Rate Limit**: Run 51 code executions on free account → should get 429 on 51st
- [ ] **Dashboard Link**: Verify "Private Uploads" appears in Commander sidebar
- [ ] **Private Toggle**: Upload as private → verify `is_public=false` in DB
- [ ] **Delete**: Delete an upload → verify it's gone from list and DB

---

## 📊 Database Schema Changes

### New Table: `user_uploads`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | text | Foreign key → users(id) |
| `type` | text | Enum: learning_goals, notes, code_snippets, interview_prep, other |
| `title` | text | Required, max 255 chars |
| `content` | text | Required, max 1MB |
| `tags` | text[] | Array for categorization |
| `is_public` | boolean | Default: false |
| `created_at` | timestamptz | Auto-set |
| `updated_at` | timestamptz | Auto-set |

**Indexes Created:**
- `(user_id, created_at desc)` - Fast user-specific queries
- `(type)` - Filter by upload type
- `(is_public) where is_public = true` - Fast public upload queries

---

## 🐛 Known Issues & Future Improvements

### Addressed in This Update
- ✅ Hardcoded Stripe pricing
- ✅ Missing input validation on MCQ answers
- ✅ Unprotected JSON.parse operations
- ✅ Unprotected code execution endpoint

### Recommended Future Work
- [ ] Interview session logs not persisted to DB (design needed)
- [ ] Silent grader feedback only logged to console
- [ ] Weak session ID fallback (non-cryptographic)
- [ ] Add CSRF protection to POST endpoints
- [ ] Add detailed error logging to file system

---

## 📝 Migration Checklist for Production

Before deploying to production:

1. **Database**
   - [ ] Run migration in production Supabase
   - [ ] Verify indexes created
   - [ ] Enable RLS policies

2. **Environment**
   - [ ] Set `PRO_PRICE_CENTS=1900` (or your price)
   - [ ] Verify all required vars in Vercel
   - [ ] Test Stripe in live mode

3. **Testing**
   - [ ] Run full test suite: `npm run lint && npx tsc --noEmit`
   - [ ] Manual testing on staging
   - [ ] Load test code execution endpoint

4. **Monitoring**
   - [ ] Set up alerts for 429 errors
   - [ ] Monitor Stripe webhook logs
   - [ ] Check upload table growth

---

## 📚 File Changes Summary

| File | Change | Type |
|------|--------|------|
| `src/app/api/checkout/session/route.ts` | Made pricing configurable | Fix |
| `src/app/api/attempt/route.ts` | Added MCQ and JSON validation | Fix |
| `src/app/api/code/run/route.ts` | Added rate limiting check | Enhancement |
| `src/app/api/user/upload/route.ts` | **NEW** | Feature |
| `src/app/upload/page.tsx` | **NEW** | Feature |
| `src/app/dashboard/dashboard-client.tsx` | Added upload link | Enhancement |
| `src/lib/ratelimit.ts` | Added code execution limiter | Feature |
| `docs/migrations/001_add_user_uploads_table.sql` | **NEW** | Schema |

---

## 🚀 Performance Notes

- ✅ Upload storage uses Supabase native storage (not external S3)
- ✅ Rate limiting uses Upstash Redis (sub-millisecond) when available
- ✅ Indexes on user_uploads ensure O(log n) queries
- ✅ Content limit (1MB) prevents bloated DB records

---

## 📞 Support

For issues or questions:
1. Check the migration SQL file
2. Verify environment variables
3. Run linter: `npm run lint`
4. Run type-check: `npx tsc --noEmit`
5. Check Supabase logs for DB errors
