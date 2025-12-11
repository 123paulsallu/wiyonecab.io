import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase project URL and anon key (public) - provided by user
const SUPABASE_URL = 'https://lwxoxeezztyhfwodvcgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3eG94ZWV6enR5aGZ3b2R2Y2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjExNzgsImV4cCI6MjA4MDg5NzE3OH0.vBpNQ4FWA1BbnYF9adm-VizawxUSs4cmr8pvTUiFWLk';

// Provide simple AsyncStorage-backed storage adapter for Supabase auth persistence in React Native.
const storageAdapter = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      // ignore
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: storageAdapter },
});

// Helper: attempt to get the logged-in user (if any)
export async function getSupabaseUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return { user: null, error };
    return { user: data?.user ?? null, error: null };
  } catch (err) {
    return { user: null, error: err };
  }
}

export async function setSupabaseSession(session: any) {
  try {
    if (!session) return;
    await supabase.auth.setSession(session);
  } catch (e) {
    // ignore
  }
}

export default supabase;
