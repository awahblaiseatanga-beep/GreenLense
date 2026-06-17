import { createClient } from "@supabase/supabase-js";

function sanitizeSupabaseUrl(url) {
  if (!url) return "";
  let clean = url.trim();
  // Remove trailing slashes
  clean = clean.replace(/\/+$/, "");
  // Remove accidental /rest/v1 or /auth/v1 subpaths the user might have pasted
  clean = clean.replace(/\/(rest|auth)\/v1\/?$/, "");
  // Ensure protocol is correct
  if (clean && !clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "https://" + clean;
  }
  return clean;
}

function isValidSupabaseUrl(url) {
  const sanitized = sanitizeSupabaseUrl(url);
  if (!sanitized) return false;
  try {
    const parsed = new URL(sanitized);
    // Ensure it's not a generic word placeholder (must contain at least one dot in the host reference)
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.includes(".");
  } catch (e) {
    return false;
  }
}

// Try immediate static detection (build time env vars)
let staticUrl = "";
let staticKey = "";

try {
  // First try standard process.env which is injected via vite.config.ts define block
  staticUrl = sanitizeSupabaseUrl(process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || "");
  staticKey = (process.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
} catch (e) {
  // Graceful fallback
}

export let supabase = null;

if (staticUrl && staticKey && isValidSupabaseUrl(staticUrl)) {
  try {
    supabase = createClient(staticUrl, staticKey);
    console.log("Supabase static client initialized successfully.");
  } catch (err) {
    console.error("Static Supabase initialization failed:", err);
  }
}

// Dynamic initialization / getter
let initPromise = null;

export async function getSupabaseClient() {
  if (supabase) return supabase;
  
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      const res = await fetch("/api/supabase-config");
      if (res.ok) {
        const config = await res.json();
        const rawUrl = config.supabaseUrl;
        const key = (config.supabaseAnonKey || "").trim();
        const url = sanitizeSupabaseUrl(rawUrl);
        
        if (url && key && isValidSupabaseUrl(url)) {
          supabase = createClient(url, key);
          console.log("Supabase dynamic client initialized successfully matching backend state.");
        }
      }
    } catch (err) {
      console.warn("Failed to fetch runtime Supabase client config:", err);
    }
    return supabase;
  })();
  
  return initPromise;
}

export function isSupabaseConfigured() {
  return !!supabase;
}

