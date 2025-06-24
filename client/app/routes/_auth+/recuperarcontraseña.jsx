import { Form, useActionData, Link, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useState, useEffect } from "react";

const API_ENDPOINTS = {
  RECOVER: "http://localhost:8000/api/user/passwordrecover",
  VERIFY: "http://localhost:8000/api/user/codeverification",
  NEW_PASSWORD: "http://localhost:8000/api/user/newpasswordm"
};

// Define los pasos del wizard
const STEPS = [
  { id: 'email', title: 'Correo', icon: 'mail' },
  { id: 'code', title: 'Código', icon: 'key' },
  { id: 'password', title: 'Contraseña', icon: 'lock' }
];

export async function action({ request }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const step = data.step;

  try {
    let response;
    switch (step) {
      case 'email':
        response = await fetch(API_ENDPOINTS.RECOVER, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        });
        break;
      case 'code':
        response = await fetch(API_ENDPOINTS.VERIFY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: data.email,
            code: data.code 
          }),
        });
        break;
      case 'password':
        response = await fetch(API_ENDPOINTS.NEW_PASSWORD, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            repeated_password: data.repeated_password
          }),
        });
        break;
    }

    const responseData = await response.json();

    if (!response.ok) {
      return json({ 
        error: responseData.detail,
        step,
        loading: false
      });
    }

    return json({ 
      success: responseData.detail,
      step: step === 'password' ? 'completed' : step,
      email: data.email,
      loading: false
    });

  } catch (error) {
    return json({ 
      error: "Error de conexión con el servidor.", 
      step,
      loading: false
    });
  }
}

export default function PasswordRecover() {
  const actionData = useActionData();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('email');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep);

  useEffect(() => {
    if (actionData?.success) {
      setIsLoading(false);
      
      if (actionData.step === 'email') {
        setCurrentStep('code');
        setUserEmail(actionData.email);
      } else if (actionData.step === 'code') {
        setCurrentStep('password');
      } else if (actionData.step === 'completed') {
        navigate('/login');
      }
    }
  }, [actionData, navigate]);

  useEffect(() => {
    if (actionData) {
      setIsLoading(false);
    }
  }, [actionData]);

  const handleSubmit = () => {
    setIsLoading(true);
  };

  // Renderizar el ícono apropiado según el tipo
  const renderIcon = (iconType) => {
    switch (iconType) {
      case 'mail':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'key':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        );
      case 'lock':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Componente para la barra de progreso
  const ProgressBar = () => (
    <div className="mb-4">
      <div className="flex justify-between items-center">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full mb-1 ${
              index < currentStepIndex ? 'bg-green-500' : 
              index === currentStepIndex ? 'bg-indigo-600' : 'bg-gray-200'
            }`}>
              {index < currentStepIndex ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-white">{renderIcon(step.icon)}</span>
              )}
            </div>
            <span className={`text-xs font-medium ${
              index <= currentStepIndex ? 'text-indigo-600' : 'text-gray-500'
            }`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
      
      <div className="relative flex items-center justify-between mt-1">
        {STEPS.map((step, index) => {
          if (index === STEPS.length - 1) return null;
          
          return (
            <div 
              key={`line-${index}`} 
              className={`h-1 flex-1 ${
                index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          );
        })}
      </div>
    </div>
  );

  // Renderiza el contenido del paso actual
  const renderStepContent = () => {
    switch (currentStep) {
      case 'email':
        return (
          <div className="space-y-2">
            <div className="text-center">
              <div className="inline-flex justify-center items-center w-14 h-14 bg-indigo-600 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Recuperar Contraseña</h1>
              <p className="text-sm text-gray-600">Ingresa tu correo electrónico para recibir instrucciones</p>
            </div>
            <div>
              <input type="hidden" name="step" value="email" />
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-5">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full pl-3 pr-3 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="usuario@ejemplo.com"
              />
            </div>
          </div>
        );
        
      case 'code':
        return (
          <div className="space-y-3">
            <div className="text-center">
              <div className="inline-flex justify-center items-center w-14 h-14 bg-indigo-600 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Verifica tu código</h1>
              <p className="text-sm text-gray-600">Ingresa el código que enviamos a tu correo</p>
            </div>
            <div>
              <input type="hidden" name="email" value={userEmail} />
              <input type="hidden" name="step" value="code" />
              <label className="block text-sm font-medium text-gray-700 mb-1 pt-3">
                Código de verificación
              </label>
              <input
                type="text"
                name="code"
                required
                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ingresa el código"
              />
            </div>
          </div>
        );
        
      case 'password':
        return (
          <div className="space-y-3">
            <div className="text-center">
              <div className="inline-flex justify-center items-center w-14 h-14 bg-indigo-600 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Nueva contraseña</h1>
              <p className="text-sm text-gray-600">Ingresa y confirma tu nueva contraseña</p>
            </div>
            <div className="space-y-3">
              <input type="hidden" name="email" value={userEmail} />
              <input type="hidden" name="step" value="password" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ingresa tu nueva contraseña"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  name="repeated_password"
                  required
                  minLength={8}
                  className="w-full pl-3 pr-3 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Confirma tu contraseña"
                />
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: "url('/assets/img/fondo_login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}>
      <div className="absolute inset-0 bg-indigo-900/50 backdrop-blur-sm"></div>
      
      <div className="w-full max-w-3xl flex overflow-hidden rounded-xl shadow-2xl relative z-10">
        {/* Panel lateral izquierdo - Solo visible en pantallas grandes */}
        <div className="hidden lg:block lg:w-1/2 bg-indigo-600 p-8 text-white">
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-4">Recomendaciones de Seguridad</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Revisa tu bandeja de entrada y spam</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">El enlace de recuperación expira en 10 minutos</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Usa una contraseña segura y única</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel principal del formulario */}
        <div className="w-full lg:w-1/2 bg-white p-6 sm:p-8">
          {/* Mensajes de error y éxito */}
          {actionData?.error && (
            <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              <p>{actionData.error}</p>
            </div>
          )}

          {actionData?.success && (
            <div className="mb-4 p-2 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm">
              <p>{actionData.success}</p>
            </div>
          )}

          <Form method="post" className="space-y-4" onSubmit={handleSubmit}>
            {/* Barra de progreso */}
            <ProgressBar />
            
            {/* Contenedor con altura fija para mantener consistencia entre pasos */}
            <div className="min-h-[260px] flex flex-col justify-center">
              {renderStepContent()}
            </div>

            {/* Botón de acción */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                currentStep === 'password' ? "Cambiar contraseña" :
                currentStep === 'code' ? "Verificar código" :
                "Enviar instrucciones"
              )}
            </button>

            {/* Enlace para volver */}
            <div className="text-center mt-4">
              <Link to="/login" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                Volver al inicio de sesión
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}