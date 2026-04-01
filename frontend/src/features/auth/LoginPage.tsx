import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginFormSchema, type LoginFormValues } from "../../shared/validation/auth.validation";
import { loginRequest } from "./auth.api";
import { useAuth } from "../../shared/auth/auth-context";
import { defaultHomePath } from "../../shared/auth/access-control";

export const LoginPage = () => {
  const [form, setForm] = useState<LoginFormValues>({
    organizationId: "00000000-0000-0000-0000-000000000001",
    email: "admin@demo.health",
    password: "ChangeMeStrong!123",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);

    const parsed = loginFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Validation failed");
      return;
    }

    setLoading(true);
    try {
      const result = await loginRequest({
        ...parsed.data,
        organizationId: parsed.data.organizationId || undefined,
      });
      setSession({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      navigate(defaultHomePath(result.user), { replace: true });
    } catch {
      setError("Login failed. Check credentials and tenant scope.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl space-y-4">
        <h1 className="app-title">EHCP Login</h1>
        <p className="app-subtitle">Tenant ID is optional for SUPER_ADMIN login.</p>

        <label className="block text-sm font-medium">
          Organization ID (optional for SUPER_ADMIN)
          <input
            className="mt-1"
            value={form.organizationId}
            onChange={(event) => setForm((prev) => ({ ...prev, organizationId: event.target.value }))}
          />
        </label>

        <label className="block text-sm font-medium">
          Email
          <input
            className="mt-1"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
        </label>

        <label className="block text-sm font-medium">
          Password
          <input
            className="mt-1"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
        </label>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="app-btn-primary w-full"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};
