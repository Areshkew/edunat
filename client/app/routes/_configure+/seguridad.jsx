import { Link } from "@remix-run/react";
import { Shield, Key } from "lucide-react";
import { useState } from "react";
import { CambiarContrasenaModal, action as cambiarContrasenaAction } from "./cambiarcontraseña";

// Reexporta el action para que Remix lo use en esta ruta
export { cambiarContrasenaAction as action };

export default function Seguridad() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-3" size={24} />
            Seguridad de la cuenta
          </h1>
          <p className="mt-2 text-gray-600">
            Gestiona tu contraseña y opciones de autenticación.
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Contraseña</h2>
            <p className="text-sm text-gray-500 mb-4">
              Cambia tu contraseña para mantener tu cuenta segura.
            </p>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setShowModal(true)}
            >
              <Key className="mr-2 -ml-1" size={16} />
              Cambiar contraseña
            </button>
          </div>
        </div>
        <div className="mt-6">
          <Link to="/configurar" className="text-indigo-600 hover:underline">
            &larr; Volver a configuración
          </Link>
        </div>
      </div>
      <CambiarContrasenaModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
