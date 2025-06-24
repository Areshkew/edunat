import { redirect } from "@remix-run/node";

export async function loader({ request }) {
  // Dynamic imports to avoid client-side inclusion
  const { requireAuth } = await import("../../utils/server-auth");
  const sessionUtils = await import("../../utils/session.server");
  
  // First verify authentication
  const { session } = await requireAuth(request, sessionUtils);
  const role = session.get("role");
  
  // Redirect based on user role
  if (role === 1) {
    return redirect("/dashboard/admin-home");
  } else if (role === 0) {
    return redirect("/dashboard/user-home");
  } else {
    // If somehow the role is invalid, redirect to logout
    return redirect("/logout");
  }
}

export default function DashboardIndex() {
  // This component should never render since we always redirect
  return null;
}
