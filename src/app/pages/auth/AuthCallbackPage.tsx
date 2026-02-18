import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { authService } from "@/services/api/auth";
import { ShieldCheck } from "lucide-react";

/**
 * Landing page for the Google OAuth redirect.
 *
 * The backend redirects here after a successful Google sign-in:
 *   https://isms.bitcoingames1346.com/auth/callback?token=JWT&user=encoded_json
 *
 * This page:
 *  1. Reads the token + user from query params
 *  2. Stores them in localStorage (same keys the rest of the app uses)
 *  3. Hard-navigates to "/" so the router auth guard re-runs cleanly
 *
 * On error it redirects to /login?error=...
 */
export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userRaw = searchParams.get("user");

    if (!token || !userRaw) {
      window.location.href = "/login?error=oauth_failed";
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));

      authService.setToken(token);
      authService.cacheUser(user);

      // Hard navigate so the router loader re-reads localStorage
      window.location.href = "/";
    } catch {
      window.location.href = "/login?error=oauth_failed";
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
        </div>
        <p className="text-gray-600 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
