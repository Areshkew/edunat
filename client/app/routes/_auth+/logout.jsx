import { redirect } from "@remix-run/node";
import { getSession, destroySession } from "../../utils/session.server";

export async function loader({ request }) {
  try {
    const session = await getSession(request.headers.get("Cookie") || "");
    
    // Ensure session exists before destroying it
    if (session) {
      return redirect("/", {
        headers: {
          "Set-Cookie": await destroySession(session),
        },
      });
    } 
    
    // If no session exists, just redirect to home
    return redirect("/");
  } catch (error) {
    console.error("Logout error:", error);
    return redirect("/");
  }
}