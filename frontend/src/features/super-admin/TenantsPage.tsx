import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createTenantRequest, listTenantsRequest } from "./super-admin.api";
import { PageCard } from "../../shared/ui/PageCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

export const TenantsPage = () => {
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [error, setError] = useState<string | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ["platform-tenants"],
    queryFn: listTenantsRequest,
  });

  const createMutation = useMutation({
    mutationFn: createTenantRequest,
    onSuccess: () => {
      setTenantId("");
      setName("");
      setStatus("ACTIVE");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["platform-tenants"] });
      void queryClient.invalidateQueries({ queryKey: ["super-admin-tenants-select"] });
    },
    onError: () => {
      setError("Unable to create tenant. Ensure Tenant ID is unique UUID.");
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="app-title">Super Admin - Tenants</h1>
      <PageCard title="Add New Tenant ID">
        <div className="grid gap-2 md:grid-cols-3">
          <input
            placeholder="Tenant ID (UUID)"
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
          />
          <input
            placeholder="Tenant name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <select value={status} onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE")}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          {error ? <p className="text-sm text-rose-700 md:col-span-3">{error}</p> : null}
          <button
            className="app-btn-primary md:col-span-3"
            disabled={!tenantId || !name || createMutation.isPending}
            onClick={() =>
              createMutation.mutate({
                id: tenantId,
                name,
                status,
              })
            }
          >
            {createMutation.isPending ? "Creating tenant..." : "Create tenant"}
          </button>
        </div>
      </PageCard>

      <PageCard title="Tenant List">
        {tenantsQuery.isLoading ? <p>Loading tenants...</p> : null}
        <div className="space-y-2">
          {tenantsQuery.data?.map((tenant) => (
            <article key={tenant.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{tenant.name}</p>
                <StatusBadge value={tenant.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Tenant ID: {tenant.id} | Users: {tenant.userCount}
              </p>
            </article>
          ))}
        </div>
      </PageCard>
    </div>
  );
};
