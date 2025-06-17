import { Link, useLoaderData, useActionData, useNavigation, Form } from "@remix-run/react";
import { Settings, Edit2, Shield, User, ChevronLeft, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import { getSession } from "../../utils/session.server";

const API_USERDATA_URL = "http://localhost:8000/api/user/userdata";
const API_TOGGLEV_URL = "http://localhost:8000/api/user/togglev";
const API_DELETE_URL = "http://localhost:8000/api/user/delete";

export async function loader({ request }) {
  const cookieHeader = request.headers.get("Cookie");
  const session = await getSession(cookieHeader);
  const token = session.get("token");

  if (!token) {
    throw new Response("Unauthorized", { status: 401 });
  }

  try {
    const response = await fetch(API_USERDATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(["visibility"]),
    });

    if (!response.ok) {
      throw new Response("Failed to fetch user data", { status: response.status });
    }

    const userData = await response.json();
    return json({ visibility: userData.visibility });
  } catch (error) {
    return json({ visibility: 1 }); // Default to public if error
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const cookieHeader = request.headers.get("Cookie");
  const session = await getSession(cookieHeader);
  const token = session.get("token");

  if (!token) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (actionType === "toggleVisibility") {
    try {
      // Get current user document_id from token payload
      const userDataResponse = await fetch(API_USERDATA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(["document_id", "visibility"]),
      });

      if (!userDataResponse.ok) {
        return json({ error: "No se pudo obtener los datos del usuario" }, { status: 400 });
      }

      const userData = await userDataResponse.json();
      const documentId = userData.document_id;
      const currentVisibility = userData.visibility;

      // **NUEVO: Solo hacer toggle, no usar el valor del formulario**
      const response = await fetch(`${API_TOGGLEV_URL}/${documentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return json({ error: errorData.detail || "Error al cambiar la visibilidad" }, { status: 400 });
      }

      // **NUEVO: Determinar el nuevo estado después del toggle**
      const newVisibility = currentVisibility === 1 ? 0 : 1;
      const visibilityText = newVisibility === 1 ? "público" : "privado";

      return json({ 
        success: `Perfil ahora es ${visibilityText}`,
        newVisibility: newVisibility
      });
    } catch (error) {
      return json({ error: "Error de conexión" }, { status: 500 });
    }
  }

  if (actionType === "deleteAccount") {
    try {
      // **ARREGLADO: Obtener document_id una sola vez al inicio**
      const userDataResponse = await fetch(API_USERDATA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(["document_id"]),
      });

      if (!userDataResponse.ok) {
        return json({ error: "No se pudo obtener los datos del usuario" }, { status: 400 });
      }

      const userData = await userDataResponse.json();
      const documentId = userData.document_id;

      // **ARREGLADO: Llamar directamente al endpoint de delete**
      const response = await fetch(`${API_DELETE_URL}/${documentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return json({ error: errorData.detail || "Error al eliminar la cuenta" }, { status: 400 });
      }

      // **ARREGLADO: En lugar de manejar la sesión aquí, redirigir al logout**
      // El logout se encargará de limpiar la sesión correctamente
      return redirect("/logout");
      
    } catch (error) {
      console.error("Error en deleteAccount:", error);
      return json({ error: "Error de conexión" }, { status: 500 });
    }
  }

  return json({ error: "Acción no válida" }, { status: 400 });
}

// Modal para eliminar cuenta
function EliminarCuentaModal({ open, onClose }) {
  const navigation = useNavigation();
  const actionData = useActionData();
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
  };

  const resetModal = () => {
    setShowConfirm(false);
    setConfirmText("");
    onClose();
  };

  // **NUEVO: Resetear el modal cuando se cierre**
  useEffect(() => {
    if (!open) {
      setShowConfirm(false);
      setConfirmText("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative mx-4">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={resetModal}
          disabled={navigation.state === "submitting"}
        >
          ×
        </button>
        
        <div className="flex flex-col items-center mb-6">
          <div className="bg-red-100 rounded-full p-3 mb-3">
            <Trash2 className="text-red-600" size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Eliminar cuenta</h3>
          <p className="text-gray-500 text-sm mt-1 text-center">
            Esta acción no se puede deshacer
          </p>
        </div>

        {!showConfirm ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm">
                  <p className="font-medium text-red-800 mb-2">¿Estás seguro?</p>
                  <ul className="text-red-700 space-y-1">
                    <li>• Se perderán todos tus datos permanentemente</li>
                    <li>• No podrás recuperar tu cuenta</li>
                    <li>• Se eliminarán todas tus conexiones</li>
                    <li>• Los mensajes enviados permanecerán anónimos</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={resetModal}
                className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
              >
                Continuar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  Para confirmar, escribe <span className="font-bold">ELIMINAR</span> en el campo:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center font-mono"
                  placeholder="ELIMINAR"
                  disabled={navigation.state === "submitting"}
                  autoFocus
                />
              </div>

              {actionData?.error && (
                <div className="bg-red-50 text-red-700 p-3 rounded flex items-center gap-2 border border-red-200">
                  <AlertTriangle size={18} />
                  <span>{actionData.error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText("");
                  }}
                  className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 font-medium"
                  disabled={navigation.state === "submitting"}
                >
                  Volver
                </button>
                
                {/* **ARREGLADO: Usar Form correctamente** */}
                <Form method="post">
                  <input type="hidden" name="actionType" value="deleteAccount" />
                  <button
                    type="submit"
                    disabled={confirmText !== "ELIMINAR" || navigation.state === "submitting"}
                    className={`px-4 py-2 rounded-md font-medium ${
                      confirmText === "ELIMINAR" && navigation.state !== "submitting"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {navigation.state === "submitting" ? "Eliminando..." : "Eliminar definitivamente"}
                  </button>
                </Form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Configurar() {
  const loaderData = useLoaderData();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
                <User className="text-gray-400 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Privacidad</h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Visibilidad del perfil
                  </p>
                </div>
              </div>
              
              {/* **ARREGLADO: Toggle switch simple sin estados de carga** */}
              <div className="flex justify-center sm:block mt-2 sm:mt-0">
                <Form method="post">
                  <input type="hidden" name="actionType" value="toggleVisibility" />
                  <button 
                    type="submit"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      loaderData?.visibility === 1
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } cursor-pointer`}
                    title={`Perfil ${loaderData?.visibility === 1 ? "público" : "privado"} - Click para cambiar`}
                  >
                    {/* **Ojo que cambia según visibilidad** */}
                    {loaderData?.visibility === 1 ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                    
                    {/* **Toggle slider** */}
                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                      loaderData?.visibility === 1 ? "bg-green-400" : "bg-gray-300"
                    }`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                        loaderData?.visibility === 1 ? "transform translate-x-5" : "transform translate-x-0.5"
                      }`} />
                    </div>
                    
                    {/* **Texto del estado sin loading** */}
                    <span className="text-xs font-medium">
                      {loaderData?.visibility === 1 ? "Público" : "Privado"}
                    </span>
                  </button>
                </Form>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de cuenta */}
        <div className="mt-6 sm:mt-8 bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Cuenta</h2>
          <div className="space-y-4">
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full text-left text-red-600 hover:text-red-800 font-medium text-sm sm:text-base"
            >
              Eliminar cuenta permanentemente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de eliminar cuenta */}
      <EliminarCuentaModal 
        open={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
      />
    </div>
  );
}