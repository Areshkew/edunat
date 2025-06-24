import { createCookieSessionStorage, redirect } from "@remix-run/node";

// Session configuration
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "edunat_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: ["s3cr3t"], // In production use secure environment variables
    secure: process.env.NODE_ENV === "production",
  },
});

// Get the session from the request
export async function getSession(cookieHeader) {
  return sessionStorage.getSession(cookieHeader);
}

// Commit the session to a response
export async function commitSession(session) {
  return sessionStorage.commitSession(session);
}

// Destroy the session
export async function destroySession(session) {
  return sessionStorage.destroySession(session);
}

// Check if token needs refresh and refresh if needed
export async function checkAndRefreshToken(request) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");

  // If no token exists, just proceed normally (for public routes)
  if (!token) {
    return null;
  }

  const tokenExpiry = session.get("tokenExpiry");
  const now = Date.now();

  // If token doesn't have expiry or is about to expire (within 5 minutes)
  if (!tokenExpiry || tokenExpiry - now < 5 * 60 * 1000) {
    try {
      const response = await fetch(
        "http://localhost:8000/api/user/refresh-token", // Updated endpoint URL
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const refreshData = await response.json();

        // Update session with new token and expiry
        session.set("token", refreshData.token);

        // Set expiry time (using expiresIn from API response)
        session.set("tokenExpiry", Date.now() + refreshData.expiresIn * 1000);

        // Return redirect with updated session
        return redirect(request.url, {
          headers: {
            "Set-Cookie": await commitSession(session),
          },
        });
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      // Continue with current token if refresh fails
    }
  }

  // If token doesn't need refresh or refresh failed, continue normally
  return null;
}

// Function to require authentication
export async function requireAuth(request) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");

  if (!token) {
    throw redirect("/login");
  }

  return { token, session };
}

export async function requireAdmin(request) {
  const { token, session } = await requireAuth(request);
  const role = session.get("role");

  if (role !== 1) {
    throw redirect("/dashboard/unauthorized");
  }

  return { token, session };
}

export async function requireUser(request) {
  const { token, session } = await requireAuth(request);
  const role = session.get("role");

  if (role !== 0) {
    throw redirect("/dashboard/unauthorized");
  }

  return { token, session };
}