import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useRouteError, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useEffect } from "react";
import { checkAndRefreshToken } from "./utils/session.server";
import { setupInactivityTracker } from "./utils/inactivity-tracker";
import "./tailwind.css";

// First check if token needs refresh before processing routes 
export async function loader({ request }) {
  // Check if token needs to be refreshed
  const refreshResult = await checkAndRefreshToken(request);
  if (refreshResult) return refreshResult;
  
  // Continue with normal route processing
  return json({ isAuthenticated: request.headers.get("Cookie")?.includes("edunat_session=") });
}

export default function App() {
  const { isAuthenticated } = useLoaderData();

  useEffect(() => {
    // Only set up inactivity tracking if user is authenticated
    if (isAuthenticated) {
      // Set up inactivity tracker with default timeout
      const cleanup = setupInactivityTracker();
      return cleanup;
    }
  }, [isAuthenticated]);

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const errorMessage = error?.message || "Se ha producido un error desconocido";
  
  // Now use errorMessage instead of error.message in your component
  return (
    <html lang="es">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-50">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">¡Ups! Algo salió mal</h1>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <Link
              to="/"
              className="block w-full bg-indigo-600 text-white text-center py-3 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
