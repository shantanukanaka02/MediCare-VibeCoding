import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createTaskRequest, listTasksRequest, transitionTaskRequest } from "./tasks.api";
import { useAuth } from "../../shared/auth/auth-context";

export const TasksPage = () => {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: listTasksRequest,
  });

  const createMutation = useMutation({
    mutationFn: createTaskRequest,
    onSuccess: () => {
      setTitle("");
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({ taskId, event, version }: { taskId: string; event: "start" | "complete"; version: number }) =>
      transitionTaskRequest(taskId, { event, version }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      setError("Transition failed. Try again with latest task version.");
    },
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="app-title">Care Tasks</h1>
        <p className="text-sm text-slate-600">{user?.email}</p>
      </header>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Create Task</h2>
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="flex-1"
              placeholder="Task title"
            />
            <button
              className="app-btn-primary"
              onClick={() =>
                createMutation.mutate({
                  title,
                  assigneeUserId: user?.id,
                })
              }
              disabled={!title || createMutation.isPending}
            >
              Add
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Task List</h2>
          {tasksQuery.isLoading ? <p>Loading tasks...</p> : null}
          {error ? <p className="text-danger text-sm">{error}</p> : null}
          <div className="space-y-2">
            {tasksQuery.data?.map((task) => (
              <article key={task.id} className="rounded border p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.status} | version {task.version}</p>
                </div>
                <div className="flex gap-2">
                  {task.status === "ASSIGNED" ? (
                    <button
                      className="app-btn-secondary px-3 py-1"
                      onClick={() => transitionMutation.mutate({ taskId: task.id, event: "start", version: task.version })}
                    >
                      Start
                    </button>
                  ) : null}
                  {task.status === "IN_PROGRESS" ? (
                    <button
                      className="app-btn-secondary px-3 py-1"
                      onClick={() => transitionMutation.mutate({ taskId: task.id, event: "complete", version: task.version })}
                    >
                      Complete
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
    </div>
  );
};
