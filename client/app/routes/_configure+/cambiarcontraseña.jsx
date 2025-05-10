import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Key, CheckCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { json } from "@remix-run/node";
import { getSession } from "../../utils/session.server";

const API_URL = "http://localhost:8000/api/user/newpassword";

// Remix action
export async function action({ request }) {
  const formData = await request.formData();
  const password = formData.get("password");
  const repeated_password = formData.get("repeated_password");

  // Validations
  if (!password || !repeated_password) {
    return json({ error: "Debes ingresar y confirmar la contraseña." }, { status: 400 });
  }

  if (password.length < 8) {
    return json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  }

  if (password.length > 128) {
    return json({ error: "La contraseña no puede exceder los 128 caracteres." }, { status: 400 });
  }

  if (password !== repeated_password) {
    return json({ error: "Las contraseñas no coinciden." }, { status: 400 });
  }

  const strength = getPasswordStrength(password);
  if (strength.score < 2) {
    return json({ error: "La contraseña es demasiado débil. Debe incluir mayúsculas, números o símbolos." }, { status: 400 });
  }

  try {
    // Token
    const cookie = request.headers.get("Cookie") || "";
    const session = await getSession(cookie);
    const token = session.get("token");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ password, repeated_password }),
    });
    let responseData;
    const responseText = await response.text();
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      return json({ error: "Error al procesar la respuesta del servidor." }, { status: 500 });
    }
    if (!response.ok) {
      return json({ error: responseData.detail || responseData.message || "Error al cambiar la contraseña." }, { status: 500 });
    }
    return json({ success: "Contraseña cambiada exitosamente." });
  } catch (error) {
    // Handle connection errors
    console.error("Error de conexión:", error);
    return json({ error: "No se pudo conectar con el servidor." });
  }
};

// Validate Password Strength
function getPasswordStrength(password) {
  if (!password) return { label: "Débil", color: "bg-red-400", score: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  
  if (score >= 4) return { label: "Fuerte", color: "bg-green-500", score };
  if (score >= 2) return { label: "Media", color: "bg-yellow-400", score };
  return { label: "Débil", color: "bg-red-400", score };


}

// Component
export function CambiarContrasenaModal({ open, onClose }) {
  const actionData = useActionData();
  const navigation = useNavigation();
  const [password, setPassword] = useState("");
  const [repeatedPassword, setRepeatedPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatedPassword, setShowRepeatedPassword] = useState(false);

  const strength = getPasswordStrength(password);
  const canSubmit =
    password.length >= 8 &&
    password === repeatedPassword &&
    strength.score >= 2;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative border border-gray-200">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl focus:outline-none"
          aria-label="Cerrar"
          onClick={onClose}
        >
          ×
        </button>
        <div className="flex flex-col items-center mb-4">
          <div className="bg-indigo-100 rounded-full p-3 mb-2">
            <Key className="text-indigo-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Cambiar contraseña</h3>
          <p className="text-gray-500 text-sm mt-1 text-center">
            Ingresa tu nueva contraseña segura.
          </p>
        </div>
        <Form method="post">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition py-2 px-3 pr-10 text-gray-800 bg-gray-50"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setTouched(true);
                }}
                minLength={8}
                required
                placeholder="********"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {touched && (
              <div className="mt-2 flex items-center gap-2">
                <div className={`h-2 w-24 rounded-full ${strength.color}`}></div>
                <span className={`text-xs font-medium ${strength.color === "bg-green-500" ? "text-green-700" : strength.color === "bg-yellow-400" ? "text-yellow-700" : "text-red-700"}`}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showRepeatedPassword ? "text" : "password"}
                name="repeated_password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition py-2 px-3 pr-10 text-gray-800 bg-gray-50"
                value={repeatedPassword}
                onChange={e => setRepeatedPassword(e.target.value)}
                minLength={8}
                required
                placeholder="********"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowRepeatedPassword(v => !v)}
                aria-label={showRepeatedPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showRepeatedPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {repeatedPassword && password !== repeatedPassword && (
              <p className="text-xs text-red-600 mt-1">Las contraseñas no coinciden.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-8">
            <button
              type="button"
              className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 font-medium transition"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md font-medium transition-colors shadow ${
                canSubmit
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-gray-300 text-gray-400 cursor-not-allowed"
              }`}
              disabled={!canSubmit || navigation.state === "submitting"}
            >
              {navigation.state === "submitting" ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </Form>
        {actionData?.error && (
          <div className="mt-5 bg-red-50 text-red-700 p-3 rounded flex items-center gap-2 border border-red-200">
            <AlertTriangle size={18} />
            <span>{actionData.error}</span>
          </div>
        )}
        {actionData?.success && (
          <div className="mt-5 bg-green-50 text-green-700 p-3 rounded flex items-center gap-2 border border-green-200">
            <CheckCircle size={18} />
            <span>{actionData.success}</span>
          </div>
        )}
      </div>
    </div>
  );
}
