// Import necessary modules and hooks
import { Form, useActionData, Link } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { commitSession, getSession } from "../../utils/session.server";
import { useState } from "react";

// API endpoint for user login
const API_URL = "http://localhost:8000/api/user/login";

// Action function to handle form submission
export async function action({ request }) {
  const formData = await request.formData();
  const { email, password } = Object.fromEntries(formData);

  // Input validation
  if (!email || !password) {
    return json({ error: "Por favor, completa todos los campos." });
  }

  if (password.length < 8) {
    return json({ error: "La contraseña debe tener al menos 8 caracteres." });
  }

  try {
    // Send login request to the API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const responseData = await response.json();

    // Handle unsuccessful responses
    if (!response.ok) {
      return json({ error: responseData.detail || "Credenciales incorrectas." });
    }

    // Ensure the response contains the required data
    if (!responseData.token || responseData.role === undefined) {
      return json({ error: "Respuesta incompleta del servidor." });
    }

    // Create a session and store the token and role
    const session = await getSession(request.headers.get("Cookie") || "");
    session.set("token", responseData.token);
    session.set("role", responseData.role);

    // Redirect to the dashboard with the session cookie
    return redirect("/dashboard", {
      headers: { "Set-Cookie": await commitSession(session) },
    });

  } catch (error) {
    // Handle connection errors
    console.error("Error de conexión:", error);
    return json({ error: "No se pudo conectar con el servidor." });
  }
}

// Login component
export default function Login() {
  const actionData = useActionData(); // Access action data (e.g., errors)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Toggle password visibility
  const [isLoading, setIsLoading] = useState(false); // Loading state for the form

  // Handle form submission
  const handleSubmit = (e) => {
    setIsLoading(true);
    // Reset loading state after form submission completes
    setTimeout(() => setIsLoading(false), 0); // Ensure it resets after Remix handles the action
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: "url('/assets/img/fondo_login.png')", // Background image
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Overlay for dimming the background */}
      <div className="absolute inset-0 bg-indigo-900/50 backdrop-blur-sm"></div>
      
      {/* Main container */}
      <div className="w-full max-w-4xl flex overflow-hidden rounded-xl shadow-2xl relative z-10">
        
        {/* Left column - Informational content */}
        <div className="hidden lg:block lg:w-1/2 bg-indigo-600 p-12 text-white">
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-6">Bienvenido a nuestra plataforma de cursos</h2>
            <p className="text-lg mb-8">Expande tus conocimientos con nuestros cursos especializados</p>
            <div className="space-y-4">
              {/* List of benefits */}
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Acceso a cientos de cursos</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Instructores certificados</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Aprendizaje ilimitado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Login form */}
        <div className="w-full lg:w-1/2 bg-white p-8 sm:p-12">
          <div className="mb-8 text-center">
            {/* Platform logo */}
            <div className="inline-flex justify-center items-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Inicia sesión</h1>
            <p className="text-gray-600 mt-2">Accede a tu cuenta para continuar aprendiendo</p>
          </div>

          {/* Error message */}
          {actionData?.error && (
            <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md flex items-star">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{actionData.error}</span>
            </div>
          )}

          {/* Login form */}
          <Form method="post" className="space-y-6" onSubmit={(e) => { handleSubmit(e); }}>
            {/* Email input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="usuario@ejemplo.com"
                  aria-label="Correo electrónico"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <Link to="/passwordrecover" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  name="password"
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="••••••••"
                  aria-label="Contraseña"
                />
                {/* Toggle password visibility */}
                <button 
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {isPasswordVisible ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors relative overflow-hidden"
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">Ingresar</span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                </>
              ) : (
                "Ingresar"
              )}
            </button>

            {/* Registration link */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600 space-x-2">
                ¿No tienes una cuenta?  
                <Link to="/registro" className="font-medium ml-1 text-indigo-600 hover:text-indigo-800 transition-colors">
                Regístrate
                </Link>
              </p>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}