import { redirect, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export async function loader({ request }) {
  // Dynamic import to avoid client-side inclusion
  const sessionUtils = await import("../../utils/session.server");
  const { getSession } = sessionUtils;
  
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const role = session.get("role");

  // If not authenticated, redirect to login
  if (!token) {
    return redirect("/login");
  }

  return json({ role });
}

export default function Unauthorized() {
  const { role } = useLoaderData();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-6">
      <div className="max-w-md w-full mx-auto text-center p-6 bg-white rounded-xl shadow-md">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Acceso denegado</h1>
        
        <p className="text-gray-700 mb-6">
          No tienes permisos para acceder a esta página. Esta sección está restringida para usuarios con diferentes privilegios.
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ir al dashboard
          </Link>
        </div>
        
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">
            Si crees que deberías tener acceso a esta página, por favor contacta al administrador.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Estado: {role === 1 ? "Administrador" : "Usuario regular"}
          </p>
        </div>
      </div>
    </div>
  );
}
