# Supabase & Vercel Troubleshooting Guide

If you are seeing the error **"Supabase Database connection is running in offline simulation mode. Please enter real credentials first."** or finding that sign-ins don't persist on refresh, it means your deployed app on Vercel is missing the necessary Supabase environment variables.

Here is a step-by-step guide to fixing your Vercel deployment so that it correctly connects to your live Supabase database and authentication.

## 1. Retrieve your Supabase Credentials
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Go to **Project Settings** (the gear icon on the left sidebar) -> **API**.
4. Copy the **Project URL**.
5. Copy the **Project API Key** (the one marked `anon`, `public`).

## 2. Add Environment Variables to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your GreenLens application.
3. Go to **Settings** -> **Environment Variables**.
4. Add the following two variables:

   **Variable 1:**
   - **Key:** `SUPABASE_URL`
   - **Value:** *(paste the Project URL you copied from Supabase)*

   **Variable 2:**
   - **Key:** `SUPABASE_ANON_KEY`
   - **Value:** *(paste the anon public API Key you copied from Supabase)*

   > *Note: Make sure there are no trailing spaces at the end of the keys or values.*

5. Click **Save** for both.

## 3. Configure Google OAuth in Supabase (For Google Sign-In)
If Google Sign-In is failing or doing nothing, you need to enable the Google Auth Provider:
1. In your Supabase Dashboard, go to **Authentication** -> **Providers**.
2. Click on **Google** and toggle "Enable Google".
3. Provide your Google **Client ID** and **Client Secret**. (If you haven't generated these, you must create them in the [Google Cloud Console](https://console.cloud.google.com/)).
4. Copy the **Callback URL** provided by Supabase and add it to your Authorized redirect URIs in Google Cloud Console.
5. Save the configuration.

## 4. Update Supabase Redirect URLs
To ensure users can log in via your deployed Vercel URL and be redirected back properly:
1. In Supabase, go to **Authentication** -> **URL Configuration**.
2. Under **Site URL**, enter your main Vercel production URL (e.g., `https://greenlens-domain.vercel.app`).
3. Under **Redirect URLs**, add the callback route by entering your Vercel URL followed by `/auth/callback` (e.g., `https://greenlens-domain.vercel.app/auth/callback`). Also add `http://localhost:3000/auth/callback` if you want local development to work.

## 5. Redeploy on Vercel
Environment variables in Vercel require a new deployment to take effect.
1. In your Vercel project, go to the **Deployments** tab.
2. Click the three dots "•••" on your latest deployment.
3. Select **Redeploy**.
4. Wait for the build to finish.

Once the new deployment is live, your application will dynamically fetch the correct Supabase configuration from your Vercel backend (`/api/supabase-config`), and Google Sign-In will connect securely to your real database!
