# FlexIt Codebase Refactoring Guide

## ✅ Completed Actions

### 1. Removed Unused Dependencies
- ✅ Deleted `app/api/pump-fun/` directory (24 unused API routes)
- ✅ Deleted `lib/pump-fun.ts`
- ✅ Deleted `lib/pumpfun-websocket.ts`
- ✅ Created error handling system (`lib/errors/AppError.ts`)

### 2. Created New Directory Structure
```
lib/
├── core/          # Core business logic
├── api/           # API utilities (handlers, middleware)
├── database/      # Database layer (repositories, queries)
├── errors/        # Error handling (✅ Done)
└── services/      # External services (Birdeye, etc)
```

---

## 📋 Refactoring Checklist

### PHASE 1: Remove Clerk ⏳
**Status**: In Progress

**Files to Update**:
1. `app/layout.tsx` - Remove ClerkProvider
2. `middleware.ts` - Remove Clerk middleware (if exists)
3. `package.json` - Remove @clerk/* packages

**Migration Strategy**:
- Already have wallet-based auth (`@jup-ag/wallet-adapter`)
- Already have `useEnsureUser` hook for auto user creation
- Just remove Clerk completely, keep wallet-only

---

## 🎯 Best Practices Applied

### DRY (Don't Repeat Yourself)
**Problem**: Every API route repeats:
- Supabase client creation
- Error handling
- Response formatting  
- Validation logic

**Solution**: Create reusable utilities (see below)

### Pragmatic Programmer Principles
**Applied**:
1. ✅ **Design by Contract**: Error hierarchy with specific error types
2. ⏳ **DRY**: Extract common patterns
3. ⏳ **Orthogonality**: Separate concerns (database/business logic/API)
4. ⏳ **Reversibility**: Make decisions easy to change

### SOLID Principles
1. **Single Responsibility**: Each module does one thing
2. **Open/Closed**: Easy to extend, hard to break
3. **Dependency Inversion**: Depend on abstractions, not concretions

---

## 🛠️ Next Steps (Recommended Order)

### Step 1: Finish Clerk Removal (30 minutes)
```bash
# Remove Clerk packages
npm uninstall @clerk/nextjs @clerk/clerk-react

# Update layout.tsx to remove ClerkProvider
# Already using wallet-only auth
```

### Step 2: Create API Utilities (2 hours)
See `lib/api/createHandler.ts` implementation below

### Step 3: Create Database Repositories (3 hours)
See `lib/database/repositories/` implementations below

### Step 4: Refactor Existing API Routes (4 hours)
Convert all routes to use new utilities

### Step 5: Add Testing Infrastructure (2 hours)
Setup Vitest for unit/integration tests

---

## 📝 Implementation Examples

### API Handler Pattern (DRY)

**Before** (Repeated in every route):
```typescript
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    const { data, error } = await supabase.from('posts').select('*');
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
```

**After** (DRY with utilities):
```typescript
import { createHandler } from '@/lib/api/createHandler';
import { PostRepository } from '@/lib/database/repositories/PostRepository';

export const GET = createHandler(async (request, context) => {
  const posts = await PostRepository.findAll();
  return { posts };
});
```

**Savings**: 15 lines → 4 lines (73% reduction!)

---

### Database Repository Pattern

**Before** (Supabase queries scattered everywhere):
```typescript
// In API route
const { data } = await supabase.from('users').select('*').eq('wallet', wallet).single();

// In another file
const { data } = await supabase.from('users').select('*').eq('wallet', wallet).single();

// Repeated 10+ times across codebase!
```

**After** (Centralized in repository):
```typescript
// lib/database/repositories/UserRepository.ts
export class UserRepository {
  static async findByWallet(wallet: string) {
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('wallet_address', wallet)
      .single();
      
    if (error) throw new DatabaseError('Failed to fetch user', { error });
    if (!data) throw new NotFoundError('User', wallet);
    
    return data;
  }
}

// Usage in API routes
const user = await UserRepository.findByWallet(wallet);
```

**Benefits**:
- Single source of truth
- Easy to add caching later
- Type-safe
- Testable

---

## 📦 Package.json Cleanup

**Remove These**:
```json
{
  "@clerk/nextjs": "^x.x.x",
  "@clerk/clerk-react": "^x.x.x"
}
```

**Keep These** (Core dependencies):
```json
{
  "next": "14.x.x",
  "@supabase/supabase-js": "^2.x.x",
  "@jup-ag/wallet-adapter": "^x.x.x",
  "@solana/web3.js": "^1.x.x",
  "@tanstack/react-query": "^5.x.x",
  "zustand": "^4.x.x"
}
```

---

## 🚀 Expected Improvements

After full refactoring:

### Code Quality
- **-40% lines of code** (remove duplication)
- **+60% test coverage** (with new testing setup)
- **100% type safety** (strict TypeScript)

### Developer Experience
- **Faster onboarding** (clear structure)
- **Easier debugging** (centralized error handling)
- **Faster feature development** (reusable utilities)

### Performance
- **Faster API responses** (optimized queries)
- **Better caching** (repository pattern enables this)
- **Fewer bugs** (DRY = less code = fewer bugs)

---

## 📚 Resources

- **Pragmatic Programmer**: https://pragprog.com/titles/tpp20/
- **Clean Code**: https://www.oreilly.com/library/view/clean-code-a/9780136083238/
- **SOLID Principles**: https://en.wikipedia.org/wiki/SOLID

---

## ⚠️ Migration Warnings

1. **Test thoroughly** after each phase
2. **Deploy incrementally** (not all at once)
3. **Keep old code** until new code is proven
4. **Monitor errors** in production

---

Would you like me to continue with the full implementation?
I can generate all the utility files and refactor your existing API routes.

