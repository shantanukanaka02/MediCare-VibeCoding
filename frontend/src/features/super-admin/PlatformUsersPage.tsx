import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { createTenantUserRequest, listRoleCatalogRequest, listTenantsRequest } from "./super-admin.api";
import { PageCard } from "../../shared/ui/PageCard";

export const PlatformUsersPage = () => {
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ["super-admin-tenants-select"],
    queryFn: listTenantsRequest,
  });

  const selectedTenant = useMemo(
    () => tenantsQuery.data?.find((tenant) => tenant.id === organizationId) ?? null,
    [tenantsQuery.data, organizationId],
  );

  useEffect(() => {
    if (!organizationId && tenantsQuery.data && tenantsQuery.data.length > 0) {
      setOrganizationId(tenantsQuery.data[0].id);
    }
  }, [tenantsQuery.data, organizationId]);

  const roleCatalogQuery = useQuery({
    queryKey: ["super-admin-role-catalog"],
    queryFn: listRoleCatalogRequest,
  });

  const createMutation = useMutation({
    mutationFn: createTenantUserRequest,
    onSuccess: () => {
      setEmail("");
      setPassword("");
      setRoleName("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["platform-tenants"] });
    },
    onError: () => {
      setError("Unable to create user. Username/email must be globally unique.");
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="app-title">Super Admin - Add User (Any Tenant)</h1>
      <PageCard title="Create User in Selected Tenant">
        <div className="grid gap-3">
          <select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
            {(tenantsQuery.data ?? []).map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.id})
              </option>
            ))}
          </select>
          {selectedTenant ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              Selected tenant: <span className="font-semibold">{selectedTenant.name}</span>
            </div>
          ) : null}
          <input
            type="email"
            placeholder="Username / email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            type="password"
            placeholder="Password (min 12 with complexity)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <div>
            <p className="mb-2 text-sm font-medium">Role (single role only)</p>
            <select value={roleName} onChange={(event) => setRoleName(event.target.value)}>
              <option value="">Select role</option>
              {(roleCatalogQuery.data ?? []).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <button
            className="app-btn-primary"
            disabled={!organizationId || !email || !password || !roleName || createMutation.isPending}
            onClick={() =>
              createMutation.mutate({
                organizationId,
                email,
                password,
                roleName,
              })
            }
          >
            {createMutation.isPending ? "Creating user..." : "Create user"}
          </button>
        </div>
      </PageCard>
    </div>
  );
};
