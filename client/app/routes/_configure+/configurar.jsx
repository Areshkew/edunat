import { Link } from "@remix-run/react";
import { Settings, Edit2, Shield, Bell, User, Key } from 'lucide-react';

export default function Configurar() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="mr-3" size={28} />
            Configuración
          </h1>
          <p className="mt-2 text-gray-600">
            Gestiona tu cuenta y preferencias
          </p>
        </div>

        {/* Contenido principal */}
        <div className="bg-white shadow rounded-lg">
          {/* Sección principal */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Perfil</h2>
            
            {/* Botón principal de edición */}
            <Link
              to="/editar_perfil"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Edit2 className="mr-2 -ml-1" size={16} />
              Editar mi información
            </Link>
          </div>

          {/* Otras secciones de configuración */}
          <div className="divide-y divide-gray-200">
            {/* TODO: Implementar funcionalidad para estas secciones */}
            <div className="p-6 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <Shield className="text-gray-400 mr-3" size={20} />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Seguridad</h3>
                  <p className="text-sm text-gray-500">Contraseña y autenticación</p>
                </div>
              </div>
              <button className="text-indigo-600 hover:text-indigo-800">
                Gestionar
              </button>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <Bell className="text-gray-400 mr-3" size={20} />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Notificaciones</h3>
                  <p className="text-sm text-gray-500">Preferencias de comunicación</p>
                </div>
              </div>
              <button className="text-indigo-600 hover:text-indigo-800">
                Configurar
              </button>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <User className="text-gray-400 mr-3" size={20} />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Privacidad</h3>
                  <p className="text-sm text-gray-500">Visibilidad del perfil</p>
                </div>
              </div>
              <button className="text-indigo-600 hover:text-indigo-800">
                Ajustar
              </button>
            </div>
          </div>
        </div>

        {/* Sección de cuenta */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Cuenta</h2>
          <div className="space-y-4">
            {/* TODO: Implementar funcionalidad para estas opciones */}
            <button className="w-full text-left text-red-600 hover:text-red-800 font-medium">
              Desactivar cuenta
            </button>
            <button className="w-full text-left text-red-600 hover:text-red-800 font-medium">
              Eliminar cuenta permanentemente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
