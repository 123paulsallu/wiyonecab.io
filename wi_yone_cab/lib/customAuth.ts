import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Supabase client (anon key - no auth context needed for custom auth)
const SUPABASE_URL = 'https://lwxoxeezztyhfwodvcgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3eG94ZWV6enR5aGZ3b2R2Y2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjExNzgsImV4cCI6MjA4MDg5NzE3OH0.vBpNQ4FWA1BbnYF9adm-VizawxUSs4cmr8pvTUiFWLk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface AuthSession {
  username: string;
  userId: string; // UUID from users table
  role: 'rider' | 'driver';
  createdAt: number;
}

/**
 * Sign up with custom username/password (no Supabase Auth)
 * Stores user in custom 'users' table and creates profile
 */
export async function customSignUp(
  username: string,
  password: string,
  fullName: string,
  phone: string,
  role: 'rider' | 'driver',
  nationalIdUrl?: string,
  driverLicenseUrl?: string,
  nationalIdNumber?: string,
  idType?: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Basic server-side validation
    if (!username || !password) return { success: false, error: 'Username and password are required' };
    const phoneDigits = (phone || '').replace(/[^0-9]/g, '');
    if (!/^(\d{9}|\d{12})$/.test(phoneDigits)) {
      return { success: false, error: 'Phone must be 9 or 12 digits' };
    }
    if (role === 'driver' && idType === 'nin') {
      if (!nationalIdNumber || !/^[A-Za-z0-9]{8}$/.test(nationalIdNumber)) {
        return { success: false, error: 'NIN must be 8 alphanumeric characters' };
      }
      if (!nationalIdUrl) {
        return { success: false, error: 'National ID document is required for drivers using NIN' };
      }
    }
    // Check if username already exists (use maybeSingle to avoid throwing when no rows)
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingError) {
      console.warn('Error checking existing username:', existingError);
      // proceed - treat as not existing but log the issue
    }

    if (existingUser) {
      return {
        success: false,
        error: 'Username already exists',
      };
    }

    // Insert new user with hashed password
    // Note: Password should be hashed server-side in production
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        username,
        password_hash: password, // TODO: Hash password client-side or use server-side hashing
        role,
      })
      .select('id')
      .single();

    if (userError || !newUser) {
      console.error('User creation error:', userError);
      return {
        success: false,
        error: userError?.message || 'Failed to create user',
      };
    }

    // Create profile using secure RPC to avoid RLS issues
    try {
      const rpcParams = {
        p_id: newUser.id,
        p_username: username,
        p_full_name: fullName,
        p_phone: phone,
        p_role: role,
        p_national_id_url: nationalIdUrl || null,
        p_driver_license_url: driverLicenseUrl || null,
        p_national_id_number: nationalIdNumber || null,
        p_id_type: idType || null,
      };

      const { data: rpcData, error: rpcError } = await supabase.rpc('create_profile', rpcParams as any);
      if (rpcError) {
        console.error('create_profile RPC error:', rpcError);
        // Attempt rollback of user to avoid orphaned users
        try {
          await supabase.from('users').delete().eq('id', newUser.id);
        } catch (delErr) {
          console.error('Failed to rollback user after RPC profile error:', delErr);
        }

        const msg = rpcError?.message || '';
        const rlsHint = msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('violates row-level')
          ? ' Row-level security (RLS) is preventing profile creation. Run the provided SQL to create a SECURITY DEFINER RPC or adjust policies.'
          : '';

        return { success: false, error: (rpcError?.message || 'Failed to create profile') + rlsHint };
      }
    } catch (err: any) {
      console.error('Unexpected error calling create_profile RPC:', err);
      try {
        await supabase.from('users').delete().eq('id', newUser.id);
      } catch (delErr) {
        console.error('Failed to rollback user after unexpected RPC error:', delErr);
      }
      return { success: false, error: err?.message || 'Failed to create profile' };
    }

    // Save session
    await saveSession({
      username,
      userId: newUser.id,
      role,
      createdAt: Date.now(),
    });

    return {
      success: true,
      userId: newUser.id,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: error.message || 'Sign up failed',
    };
  }
}

/**
 * Login with custom username/password (no Supabase Auth)
 * Verifies credentials against custom 'users' table
 */
export async function customLogin(
  username: string,
  password: string
): Promise<{ success: boolean; userId?: string; role?: 'rider' | 'driver'; error?: string }> {
  try {
    // Fetch user by username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, password_hash, role')
      .eq('username', username)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: 'Username not found',
      };
    }

    // Compare password (TODO: Use bcrypt or proper hashing in production)
    // For now, simple comparison (NOT SECURE - use hashing in production)
    if (user.password_hash !== password) {
      return {
        success: false,
        error: 'Invalid password',
      };
    }

    // Fetch full profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.warn('Profile not found for user:', username);
      // Still allow login but use role from users table
    }

    const userRole = profile?.role || user.role || 'rider';

    // Save session
    await saveSession({
      username,
      userId: user.id,
      role: userRole,
      createdAt: Date.now(),
    });

    return {
      success: true,
      userId: user.id,
      role: userRole,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Login failed',
    };
  }
}

/**
 * Logout - clear session from AsyncStorage
 */
export async function customLogout(): Promise<void> {
  try {
    await AsyncStorage.removeItem('customAuthSession');
  } catch (error) {
    console.warn('Logout error:', error);
  }
}

/**
 * Save session to AsyncStorage
 */
export async function saveSession(session: AuthSession): Promise<void> {
  try {
    await AsyncStorage.setItem('customAuthSession', JSON.stringify(session));
  } catch (error) {
    console.warn('Failed to save session:', error);
  }
}

/**
 * Get current session from AsyncStorage
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const sessionStr = await AsyncStorage.getItem('customAuthSession');
    if (!sessionStr) return null;
    return JSON.parse(sessionStr) as AuthSession;
  } catch (error) {
    console.warn('Failed to get session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Get auth header for protected API calls
 * (Not needed for custom auth since we use AsyncStorage sessions)
 */
export async function getAuthHeader(): Promise<{ 'X-User-Id': string } | {}> {
  const session = await getSession();
  if (!session) {
    return {};
  }
  return {
    'X-User-Id': session.userId,
  };
}
