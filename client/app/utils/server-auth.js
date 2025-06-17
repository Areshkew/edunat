import { redirect } from "@remix-run/node";

/**
 * Authentication and authorization helpers that only run on the server
 * Import these only inside loader or action functions
 */

export async function requireAuth(request, sessionUtils) {
  const { getSession } = sessionUtils;
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  
  if (!token) {
    throw redirect("/login");
  }
  
  return { token, session };
}

export async function requireAdmin(request, sessionUtils) {
  const { token, session } = await requireAuth(request, sessionUtils);
  const role = session.get("role");
  
  if (role !== 1) {
    throw redirect("/dashboard/unauthorized");
  }
  
  return { token, session };
}

export async function requireUser(request, sessionUtils) {
  const { token, session } = await requireAuth(request, sessionUtils);
  const role = session.get("role");
  
  if (role !== 0) {
    throw redirect("/dashboard/unauthorized");
  }
  
  return { token, session };
}
