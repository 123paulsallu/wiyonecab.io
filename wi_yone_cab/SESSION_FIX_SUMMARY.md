# Session Persistence Fix - Summary

## Problem
The app was automatically logging out users immediately after login. Root cause: The home screen and dashboard screens were still checking for Supabase Auth sessions, which didn't exist since the app was migrated to custom authentication.

## Solution Implemented
Updated all dashboard and home screens to use custom authentication session management from AsyncStorage instead of Supabase Auth.

## Files Modified

### 1. `app/(tabs)/index.tsx` (Home Screen)
**Changes:**
- Replaced import: `import { getSession, customLogout } from "../../lib/customAuth"`
- Replaced: `getSupabaseUser()` → `getSession()`
- Updated profile query: `.eq('id', sbUser.id)` → `.eq('user_id', session.userId)`
- Updated user mapping: Uses `session.userId` and `session.username` instead of `sbUser.id` and `sbUser.email`
- Updated logout: `supabase.auth.signOut()` → `customLogout()`
- Updated interface: `user.id` changed from `number` to `string`

### 2. `app/(driver)/index.tsx` (Driver Dashboard)
**Changes:**
- Replaced import: `import { getSession, customLogout } from "../lib/customAuth"`
- Replaced: `getSupabaseUser()` → `getSession()`
- Updated profile query: `.eq('id', sbUser.id)` → `.eq('user_id', session.userId)`
- Updated user mapping: Uses `session.userId` and `session.username`
- Updated logout: `supabase.auth.signOut()` → `customLogout()`
- Updated interface: `user.id` changed from `number` to `string`

### 3. `app/(rider)/index.tsx` (Rider Dashboard)
**Changes:**
- Replaced import: `import { getSession, customLogout } from "../lib/customAuth"`
- Replaced: `getSupabaseUser()` → `getSession()`
- Updated profile query: `.eq('id', sbUser.id)` → `.eq('user_id', session.userId)`
- Updated user mapping: Uses `session.userId` and `session.username`
- Updated logout: `supabase.auth.signOut()` → `customLogout()`
- Updated inline logout handler in TouchableOpacity
- Updated interface: `user.id` changed from `number` to `string`

## Authentication Flow - Now Fixed

### Sign Up Flow
1. User fills signup form (username, password, fullName, phone, role)
2. `customSignUp()` creates user in `users` table and profile in `profiles` table
3. Session is saved to AsyncStorage: `{ username, userId, role, createdAt }`
4. User is routed to correct dashboard based on `role`

### Login Flow
1. User enters username and password
2. `customLogin()` queries `users` table, verifies password
3. Session is saved to AsyncStorage with `userId`, `username`, `role`
4. User is routed to correct dashboard based on `role`

### Dashboard/Home Screen Flow (FIXED)
1. Screen mounts and calls `getSession()` from AsyncStorage
2. If session exists, fetches user profile from `profiles` table
3. Displays dashboard based on user role
4. Session persists across app restarts (stored in AsyncStorage)

### Logout Flow
1. User taps logout button
2. `customLogout()` removes session from AsyncStorage
3. User is routed back to login screen
4. On app restart, `getSession()` returns null, showing login screen

## Technical Details

### Custom Auth Session Structure
```typescript
interface AuthSession {
  username: string;
  userId: string;      // UUID from users table
  role: 'rider' | 'driver';
  createdAt: number;   // Timestamp
}
```

### Storage Location
- Key: `customAuthSession` in AsyncStorage
- Persists across app restarts
- Cleared on logout via `customLogout()`

### Database Queries
- Profile fetch now uses: `.eq('user_id', session.userId)` instead of `.eq('id', sbUser.id)`
- This correctly matches the foreign key relationship in the `profiles` table

## Testing Checklist

After deploying these changes, verify:

- [ ] Sign up with new username/password
- [ ] Verify user is routed to correct dashboard (driver or rider)
- [ ] Verify profile is fetched and displayed correctly
- [ ] Close and reopen app - session should persist
- [ ] Tap logout button
- [ ] Verify redirected to login screen
- [ ] Verify AsyncStorage is cleared (no `customAuthSession` key)
- [ ] Login again works correctly
- [ ] Driver account shows "Pending Approval" if not approved

## Migration Notes

### Removed Dependencies
- Removed dependency on Supabase Auth session checking (`getSupabaseUser()`)
- Removed Supabase Auth signOut calls

### Kept Dependencies
- Still using Supabase Postgres for profile data (reading/writing profiles)
- Still using Supabase for real-time updates (if implemented)
- AsyncStorage for session persistence

### Security Notes
- Current implementation stores passwords **plaintext** in database (NOT PRODUCTION SAFE)
- Should be updated to hash passwords using bcrypt before storing
- Should implement JWT tokens for API authorization instead of custom session

## No Breaking Changes
- All functionality preserved
- Profile creation still works
- Role-based routing maintained
- Profile data display unchanged
- Real-time features can still work with Supabase
