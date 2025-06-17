import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getSession } from "../../utils/session.server";
import UserHelp from "./_user/dashboard-user-help";

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const user = session.get("user");
  const userRole = session.get("user_role");

  return json({ 
    user,
    userRole
  });
}

export default function HelpRoute() {
  const { user, userRole } = useLoaderData();
  
  return <UserHelp />;
}
