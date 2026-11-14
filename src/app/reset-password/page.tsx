"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Your password has been updated. You can now sign in with your new password.");
      setPassword("");
      setConfirmPassword("");
      window.setTimeout(() => router.replace("/login"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not update your password. Please open the latest reset link from your email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-auth-page">
      <Link className="brand" href="/">Shadollar Cakes &amp; Treats<small>MADE WITH LOVE • BAKED WITH CARE</small></Link>
      <form className="admin-panel admin-login-card" onSubmit={handleSubmit}>
        <div className="eyebrow">Account security</div>
        <h1>Set a new password</h1>
        <p>Choose a new password for your Shadollar account.</p>
        <label>New password<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} autoComplete="new-password" required placeholder="At least 8 characters"/></label>
        <label>Confirm new password<input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} autoComplete="new-password" required placeholder="Enter it again"/></label>
        {error && <p className="admin-alert admin-error" role="alert">{error}</p>}
        {message && <p className="admin-alert admin-success" role="status">{message}</p>}
        <button className="button admin-submit" disabled={busy}>{busy ? "Updating..." : "Update password"}</button>
        <Link className="text-link" href="/login">Back to sign in</Link>
      </form>
    </main>
  );
}
