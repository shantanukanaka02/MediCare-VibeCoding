import { Link } from "react-router-dom";
import { useAuth } from "../../shared/auth/auth-context";
import { defaultHomePath } from "../../shared/auth/access-control";

export const AccessDeniedPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="max-w-lg rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm">
          Your role does not allow this action. Use a module available in your permission scope.
        </p>
        <Link className="app-btn-danger mt-4 inline-block text-sm" to={defaultHomePath(user)}>
          Go to available modules
        </Link>
      </div>
    </div>
  );
};
