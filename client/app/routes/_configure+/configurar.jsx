import { Link } from "@remix-run/react";
import { Settings, Edit2, Shield, Bell, User, ChevronLeft } from 'lucide-react';

export default function Configurar() {
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Flecha para volver - más pequeña en móvil */}
        <div className="mb-4">
          <Link to="/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm sm:text-base">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Volver al dashboard</span>
            <span className="xs:hidden">Volver</span>
          </Link>
        </div>

        {/* Encabezado - tamaño responsive */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="mr-2 sm:mr-3" size={24} />
            Configuración
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Gestiona tu cuenta y preferencias
          </p>
        </div>

        {/* Contenido principal */}
        <div className="bg-white shadow rounded-lg">
          {/* Sección principal */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Perfil</h2>
            
            {/* Botón principal de edición - adaptable en móvil */}
            <Link
              to="/editar_perfil"
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Edit2 className="mr-1.5 -ml-0.5 w-3 h-3 sm:w-4 sm:h-4 sm:mr-2 sm:-ml-1" />
              Editar mi información
            </Link>
          </div>

          {/* Otras secciones de configuración */}
          <div className="divide-y divide-gray-200">
            {/* Seguridad - Texto izquierda normal, "Gestionar" centrado como los demás */}
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50">
              {/* Contenido izquierda (alineación normal) */}
              <div className="flex items-center">
                <Shield className="text-gray-400 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Seguridad</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Contraseña</p>
                </div>
              </div>
              
              {/* Botón "Gestionar" (centrado en móvil, derecha en desktop) */}
              <div className="flex justify-center sm:block mt-2 sm:mt-0">
                <Link
                  to="/seguridad"
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  Gestionar
                </Link>
              </div>
            </div>

            <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <Bell className="text-gray-400 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Notificaciones</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Preferencias de comunicación</p>
                </div>
              </div>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm mt-2 sm:mt-0">
                Configurar
              </button>
            </div>

            <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <User className="text-gray-400 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Privacidad</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Visibilidad del perfil</p>
                </div>
              </div>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm mt-2 sm:mt-0">
                Ajustar
              </button>
            </div>
          </div>
        </div>

        {/* Sección de cuenta */}
        <div className="mt-6 sm:mt-8 bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Cuenta</h2>
          <div className="space-y-4">
            <button className="w-full text-left text-red-600 hover:text-red-800 font-medium text-sm sm:text-base">
              Eliminar cuenta permanentemente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}