import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createUserRequest, listRolesRequest, listUsersRequest } from "./users.api";
import { PageCard } from "../../shared/ui/PageCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

export const AdminPage = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [error, setError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: listUsersRequest,
  });

  const rolesQuery = useQuery({
    queryKey: ["admin-roles"],
    queryFn: listRolesRequest,
  });

  const roleOptions = rolesQuery.data ?? [];
  const sortedUsers = useMemo(
    () => [...(usersQuery.data ?? [])].sort((a, b) => a.email.localeCompare(b.email)),
    [usersQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: createUserRequest,
    onSuccess: () => {
      setEmail("");
      setPassword("");
      setSelectedRole("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => {
      setError("Unable to create user. Verify email uniqueness and role selection.");
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="app-title">Admin Configuration</h1>
      <PageCard title="Create New User">
        <div className="grid gap-3">
          <input
            className=""
            type="email"
            placeholder="User email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className=""
            type="password"
            placeholder="Password (min 12, upper/lower/number/symbol)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <div>
            <p className="mb-2 text-sm font-medium">Assign role (single role only)</p>
            <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
              <option value="">Select role</option>
              {roleOptions.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}{role.isSystem ? " (system)" : ""}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <button
            className="app-btn-primary"
            disabled={!email || !password || !selectedRole || createMutation.isPending}
            onClick={() =>
              createMutation.mutate({
                email,
                password,
                roleName: selectedRole,
              })
            }
          >
            {createMutation.isPending ? "Creating..." : "Create user"}
          </button>
        </div>
      </PageCard>

      <PageCard title="Tenant Users">
        {usersQuery.isLoading ? <p>Loading users...</p> : null}
        <div className="space-y-2">
          {sortedUsers.map((user) => (
            <article key={user.id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{user.email}</p>
                <StatusBadge value={user.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Roles: {user.roles.join(", ")}</p>
            </article>
          ))}
        </div>
      </PageCard>
    </div>
  );
};
