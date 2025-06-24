import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import AdminHelp from "./_admin/dashboard-admin-help";

export async function loader({ request }) {
  // Dynamic imports to avoid client-side inclusion
  const { requireAdmin } = await import("../../utils/server-auth");
  const sessionUtils = await import("../../utils/session.server");
  
  // Use requireAdmin instead of getSession to verify admin status
  const { token, session } = await requireAdmin(request, sessionUtils);
  const user = session.get("user");
  const userRole = session.get("user_role");

  return json({ 
    user,
    userRole
  });
}

export default function AdminHelpRoute() {
  const { user, userRole } = useLoaderData();
  
  return <AdminHelp />;
}
