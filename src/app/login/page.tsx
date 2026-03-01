"use client";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });

  const signInWithGitHub = () =>
    supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #34d399, #6ee7b7)" }}>
            <span className="text-2xl font-bold text-[#0a0e1a]">S</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">StockSim</h1>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Paper trade with $25,000 virtual cash.<br />No risk, real market data.
          </p>
        </div>

        <div className="glass-card p-6 space-y-3">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl glass-hover border font-medium text-sm transition-all duration-200"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#EA4335" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z" />
              <path fill="#4285F4" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z" />
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z" />
              <path fill="#34A853" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z" />
            </svg>
            Continue with Google
          </button>

          <button
            onClick={signInWithGitHub}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl glass-hover border font-medium text-sm transition-all duration-200"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.37.6.11.82-.26.82-.57v-2c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.64 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.21.69.82.57C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#475569" }}>
          By continuing, you agree to our Terms of Service.<br />
          <span style={{ color: "#34d399" }}>Free forever.</span> No credit card required.
        </p>
      </div>
    </div>
  );
}
