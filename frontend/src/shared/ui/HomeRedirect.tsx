import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { defaultHomePath } from "../auth/access-control";

export const HomeRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={defaultHomePath(user)} replace />;
};
