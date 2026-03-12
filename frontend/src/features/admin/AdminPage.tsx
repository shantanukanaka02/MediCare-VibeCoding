import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createUserRequest, listRolesRequest, listUsersRequest } from "./users.api";
import { PageCard } from "../../shared/ui/PageCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

export const AdminPage = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
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
      setSelectedRoles([]);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => {
      setError("Unable to create user. Verify email uniqueness and role selection.");
    },
  });

  const toggleRole = (roleName: string): void => {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((item) => item !== roleName) : [...prev, roleName],
    );
  };

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
            <p className="mb-2 text-sm font-medium">Assign roles</p>
            <div className="grid gap-2 md:grid-cols-2">
              {roleOptions.map((role) => (
                <label key={role.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.name)}
                    onChange={() => toggleRole(role.name)}
                  />
                  <span>{role.name}</span>
                  {role.isSystem ? <span className="ml-auto text-xs text-slate-500">system</span> : null}
                </label>
              ))}
            </div>
          </div>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <button
            className="app-btn-primary"
            disabled={!email || !password || selectedRoles.length === 0 || createMutation.isPending}
            onClick={() =>
              createMutation.mutate({
                email,
                password,
                roleNames: selectedRoles,
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
