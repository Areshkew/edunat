// Import necessary modules and hooks
import { Form, useActionData, Link} from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { commitSession, getSession } from "../../utils/session.server";
import { useState, useEffect } from "react";
import { 
  User, Lock, Calendar, MapPin, Home, 
  Book, Image, FileText, MessageSquare, 
  Link as LinkIcon, Smartphone, Languages, Eye, EyeOff, ChevronLeft, 
  ChevronRight, CheckCircle, AlertTriangle, AtSign, UserCheck, 
  Key, Map, Info, GraduationCap, School, Briefcase,  Building2
} from 'lucide-react';

// API endpoint for user registration
const API_URL = "http://localhost:8000/api/user/signup";

// Validation functions
const validateStep1 = (data) => {
  const errors = {};
  
  if (!data.document_id) {
    errors.document_id = "El documento es requerido";
  } else if (!/^\d+$/.test(data.document_id)) {
    errors.document_id = "Solo se permiten números";
  } else if (data.document_id.length > 10) {
    errors.document_id = "Máximo 10 dígitos";
  }

  if (!data.name) {
    errors.name = "El nombre es requerido";
  } else if (data.name.length > 64) {
    errors.name = "Máximo 64 caracteres";
  }

  if (!data.email) {
    errors.email = "El correo es requerido";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Correo inválido";
  } else if (data.email.length > 254) {
    errors.email = "Máximo 254 caracteres";
  }

  if (!data.username) {
    errors.username = "El usuario es requerido";
  } else if (data.username.length > 32) {
    errors.username = "Máximo 32 caracteres";
  }

  if (!data.password) {
    errors.password = "La contraseña es requerida";
  } else if (data.password.length < 8) {
    errors.password = "Mínimo 8 caracteres";
  } else if (data.password.length > 128) {
    errors.password = "Máximo 128 caracteres";
  }

  if (!data.phone_number) {
    errors.phone_number = "El teléfono es requerido";
  }else if (!/^\d+$/.test(data.phone_number)) {
    errors.phone_number = "Solo se permiten números";
  }else if (data.phone_number.length > 10) {
    errors.phone_number = "Máximo 10 dígitos";
  }

  return errors;
};

const validateStep2 = (data) => {
  const errors = {};

  // Validación de fecha de nacimiento
  if (!data.birth_date) {
    errors.birth_date = "La fecha de nacimiento es requerida";
  } else {
    const birthDate = new Date(data.birth_date);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate());
    // Solo validamos si el string es válido para evitar NaN
    if (!isNaN(birthDate.getTime())) {
      if (birthDate > today) {
        errors.birth_date = "La fecha no puede ser en el futuro";
      } else if (birthDate < minDate) {
        errors.birth_date = "La edad máxima permitida es 80 años";
      }
    }
  }

  if (data.birth_city && data.birth_city.length > 64) {
    errors.birth_city = "Máximo 64 caracteres";
  }
  
  if (data.residence_city && data.residence_city.length > 64) {
    errors.residence_city = "Máximo 64 caracteres";
  }
  
  if (data.address && data.address.length > 128) {
    errors.address = "Máximo 128 caracteres";
  }

  // Validación de género
  if (!data.gender) {
    errors.gender = "El género es requerido";
  }

  // Validación de nivel académico
  if (!data.academic_level) {
    errors.academic_level = "El nivel académico es requerido";
  }

  // Validación de idioma
  if (!data.language) {
    errors.language = "El idioma es requerido";
  }

  return errors;
};

const validateStep3 = (data) => {
  const errors = {};
  
  if (data.photo && data.photo.length > 255) {
    errors.photo = "URL demasiado larga";
  }
  
  if (data.webpage && data.webpage.length > 255) {
    errors.webpage = "URL demasiado larga";
  }
  
  if (data.whatsapp && data.whatsapp.length > 10) {
    errors.whatsapp = "Máximo 10 dígitos";
  }
  
  if (data.about && data.about.length > 255) {
    errors.about = "Máximo 255 caracteres";
  }

  return errors;
};

// Action function to handle form submission
export async function action({ request }) {
  const formData = await request.formData();
  
  // Input validation for required fields
  if (!formData.get("email") || !formData.get("password") || !formData.get("username") || !formData.get("name")) {
    return json({ error: "Por favor, completa todos los campos obligatorios." });
  }

  if (formData.get("password").length < 5) {
    return json({ error: "La contraseña debe tener al menos 5 caracteres." });
  }

  try {
    // Send registration request to the API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });

    // Try to parse the response as JSON
    let responseData;
    const responseText = await response.text();
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      return json({ error: "Error en la respuesta del servidor." });
    }

    // Handle unsuccessful responses
    if (!response.ok) {
      if (response.status === 401 && responseData.detail) {
        // Parse the dynamic error message
        const errorMsg = responseData.detail;
        const duplicateFields = [];
        
        ['username', 'email', 'document_id'].forEach(field => {
          if (errorMsg.includes(field)) {
            duplicateFields.push(field);
          }
        });

        const fieldMessages = {
          username: "nombre de usuario",
          email: "correo electrónico",
          document_id: "documento de identidad"
        };

        const duplicateFieldsText = duplicateFields
          .map(field => fieldMessages[field])
          .join(", ");

        return json({
          error: `Ya existe una cuenta con el mismo ${duplicateFieldsText}. Por favor verifica estos campos.`,
          duplicateFields
        });
      }
      return json({ error: "Error al registrar el usuario." });
    }

    // Ensure the response contains the required data
    if (!responseData.token || responseData.role === undefined) {
      return json({ error: "Respuesta incompleta del servidor." });
    }

    // Create a session and store the token and role
    const session = await getSession(request.headers.get("Cookie") || "");
    session.set("token", responseData.token);
    session.set("role", responseData.role);
    
    // Set token expiry (default to 1 hour if not provided by API)
    const expiresIn = responseData.expiresIn || 3600;
    session.set("tokenExpiry", Date.now() + (expiresIn * 1000));

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

// Registration component
export default function Registro() {
  const actionData = useActionData();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Estado para almacenar todos los datos del formulario
  const [formData, setFormData] = useState({
    document_id: "",
    name: "",
    email: "",
    username: "",
    password: "",
    phone_number: "",
    birth_date: "",
    birth_city: "",
    residence_city: "",
    address: "",
    gender: "",
    academic_level: "",
    language: "",
    photo: "",
    webpage: "",
    whatsapp: "",
    about: "",
    needs: "",
    offers: "",
    visibility: "1",
    role: "0",
    points: "0"
  });

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateCurrentStep = () => {
    let currentErrors = {};
    switch (currentStep) {
      case 0:
        currentErrors = validateStep1(formData);
        break;
      case 1:
        currentErrors = validateStep2(formData);
        break;
      case 2:
        currentErrors = validateStep3(formData);
        break;
    }
    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 2));
    }
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);

  // Calcular el porcentaje de progreso
  const progressPercentage = ((currentStep + 1) / 3) * 100;

  // Renderizar contenido de cada paso
  const renderInput = (name, label, icon, type = "text", options = {}) => {
    const isTextarea = type === "textarea";
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="relative">
          <div className={`absolute ${isTextarea ? 'top-3' : 'inset-y-0'} left-0 pl-3 flex items-center pointer-events-none text-gray-500`}>
            {icon}
          </div>
          {isTextarea ? (
            <textarea
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className={`w-full rounded-lg border ${
                errors[name] ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pl-10 py-2 pr-4`}
              {...options}
            />
          ) : (
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className={`w-full rounded-lg border ${
                errors[name] ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pl-10 py-2 pr-4`}
              {...options}
            />
          )}
        </div>
        {errors[name] && (
          <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
        )}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-indigo-800 flex items-center mb-3">
        <School className="mr-2" size={16} /> Información básica
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          {renderInput("document_id", "Documento de identidad", <Briefcase size={14} />)}
          {renderInput("email", "Correo electrónico", <AtSign size={14} />, "email")}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={14} />
              </div>
              <input
                type={isPasswordVisible ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full rounded-lg border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pl-10 py-2 pr-10`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {isPasswordVisible ? (
                  <EyeOff size={14} className="align-middle" />
                ) : (
                  <Eye size={14} className="align-middle" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>
        </div>
        <div>
          {renderInput("name", "Nombre completo", <Building2 size={14} />)}
          {renderInput("username", "Nombre de usuario", <UserCheck size={14} />)}
          {renderInput("phone_number", "Teléfono", <Smartphone size={14} />, "tel")}
        </div>
      </div>
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-2 flex items-start">
        <div className="text-blue-500 mr-2 flex-shrink-0 pt-0.5">
          <AlertTriangle size={12} />
        </div>
        <div className="text-sm text-blue-700">
          <p className="font-medium">Tu seguridad es importante</p>
          <p>Usa una contraseña única con al menos 8 caracteres, incluyendo números y símbolos.</p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    // Calcular límites para el input de fecha
    const today = new Date();
    const maxDate = today.toISOString().split("T")[0];
    const minDateObj = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate());
    const minDate = minDateObj.toISOString().split("T")[0];

    return (
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-indigo-800 flex items-center mb-3">
          <Info className="mr-2" size={16} /> Información personal
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            {/* Fecha de nacimiento con min y max */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de nacimiento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Calendar size={14} />
                </div>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  min={minDate}
                  max={maxDate}
                  className={`w-full rounded-lg border ${
                    errors.birth_date ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pl-10 py-2 pr-4`}
                />
              </div>
              {errors.birth_date && (
                <p className="mt-1 text-sm text-red-600">{errors.birth_date}</p>
              )}
            </div>
            {renderInput("birth_city", "Ciudad de nacimiento", <Map size={14} />)}
            {renderInput("residence_city", "Ciudad de residencia", <MapPin size={14} />)}
          </div>
          <div className="space-y-3">
            {renderInput("address", "Dirección", <Home size={14} />)}
            {/* Género */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Género
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <User size={14} />
                </div>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pl-10 py-2 pr-4`}
                >
                  <option value="">Seleccione...</option>
                  <option value="0">Masculino</option>
                  <option value="1">Femenino</option>
                  <option value="2">Otro</option>
                </select>
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>
            {/* Nivel académico */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel académico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Book size={14} />
                </div>
                <select
                  name="academic_level"
                  value={formData.academic_level}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${
                    errors.academic_level ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pl-10 py-2 pr-4`}
                >
                  <option value="">Seleccione...</option>
                  <option value="0">Ninguno</option>
                  <option value="1">Preescolar</option>
                  <option value="2">Primaria</option>
                  <option value="3">Secundaria</option>
                  <option value="4">Bachillerato</option>
                  <option value="5">Técnico</option>
                  <option value="6">Tecnólogo</option>
                  <option value="7">Pregrado</option>
                  <option value="8">Especialización</option>
                  <option value="9">Maestría</option>
                  <option value="10">Doctorado</option>
                </select>
              </div>
              {errors.academic_level && (
                <p className="mt-1 text-sm text-red-600">{errors.academic_level}</p>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Idioma preferido
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Languages size={14} />
              </div>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className={`w-full rounded-lg border ${
                  errors.language ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pl-10 py-2 pr-4`}
              >
                <option value="">Seleccione...</option>
                <option value="1">Español</option>
                <option value="0">Inglés</option>
              </select>
            </div>
            {errors.language && (
              <p className="mt-1 text-sm text-red-600">{errors.language}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-indigo-800 flex items-center mb-3">
        <FileText className="mr-2" size={16} /> Perfil y contacto
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-sm">
        <div className="md:col-span-5">
          {renderInput("photo", "Foto (URL)", <Image size={14} />, "url", { 
            placeholder: "https://ejemplo.com/foto.jpg"
          })}
        </div>
        <div className="md:col-span-4">
          {renderInput("webpage", "Web", <LinkIcon size={14} />, "url", { 
            placeholder: "https://miweb.com" 
          })}
        </div>
        <div className="md:col-span-3">
          {renderInput("whatsapp", "WhatsApp", <Smartphone size={14} />, "tel", { 
            placeholder: "3007654321" 
          })}
        </div>
      </div>
      
      <div className="space-y-3">
        {renderInput("about", "Acerca de mí", <FileText size={14} />, "textarea", { 
          rows: 3,
          placeholder: "Cuéntanos sobre ti...",
          className: `w-full rounded-md border ${
            errors.about ? 'border-red-500' : 'border-gray-300'
          } focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition pl-8 py-1.5 pr-3 min-h-[60px] text-sm`
        })}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {renderInput("needs", "¿Qué quieres aprender?", <MessageSquare size={14} />, "textarea", { 
            rows: 2,
            placeholder: "Temas que te interesan...",
            className: `w-full rounded-md border ${
              errors.needs ? 'border-red-500' : 'border-gray-300'
            } focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition pl-8 py-1.5 pr-3 min-h-[50px] text-sm`
          })}
          
          {renderInput("offers", "¿Qué puedes enseñar?", <MessageSquare size={14} />, "textarea", { 
            rows: 2,
            placeholder: "Conocimientos para compartir...",
            className: `w-full rounded-md border ${
              errors.offers ? 'border-red-500' : 'border-gray-300'
            } focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition pl-8 py-1.5 pr-3 min-h-[50px] text-sm`
          })}
        </div>
      </div>
      
      <div className="bg-green-50 p-2 rounded-md border border-green-100 mt-2 flex items-start">
        <div className="text-green-500 mr-2 flex-shrink-0">
          <CheckCircle size={12} />
        </div>
        <div className="text-xs text-green-700">
          <p className="font-medium">Un perfil completo aumenta tus posibilidades</p>
          <p>Los usuarios con perfiles detallados reciben hasta 5 veces más interacciones.</p>
        </div>
      </div>
    </div>
  );

  const stepRenderers = [renderStep1, renderStep2, renderStep3];

  useEffect(() => {
    if (actionData?.duplicateFields) {
      setErrors(prev => ({
        ...prev,
        ...actionData.duplicateFields.reduce((acc, field) => ({
          ...acc,
          [field]: "Este campo ya está en uso"
        }), {})
      }));
    }
  }, [actionData]);

  return (
    <div 
      className="min-h-screen py-4 px-2 sm:px-6 lg:px-8 flex items-center justify-center"
      style={{
        backgroundImage: `url('/assets/img/fondo_signup.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      {/* Overlay con efecto blur */}
      <div 
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(79, 70, 229, 0.15)',
        }}
      />
      
      {/* Contenedor principal - responsive */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg sm:max-w-2xl mx-auto overflow-hidden relative z-10">
        {/* Encabezado - responsive */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 text-white">
          <h1 className="text-lg sm:text-xl font-bold flex items-center">
            <GraduationCap className="mr-2" size={20} />
            Únete a nuestra comunidad
          </h1>
          <p className="mt-1 text-xs sm:text-sm opacity-90">Completa tu perfil para comenzar a conectar con otros usuarios</p>
          
          {/* Barra de progreso */}
          <div className="mt-4 h-1.5 bg-white bg-opacity-20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300 ease-in-out" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-[10px] sm:text-xs max-w-md mx-auto">
            <div className={`flex flex-col items-center ${currentStep >= 0 ? 'text-white' : 'text-white text-opacity-60'}`}>
              <span>Información</span>
              <span>básica</span>
            </div>
            <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-white' : 'text-white text-opacity-60'}`}>
              <span>Información</span>
              <span>personal</span>
            </div>
            <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-white' : 'text-white text-opacity-60'}`}>
              <span>Perfil y</span>
              <span>contacto</span>
            </div>
          </div>
        </div>
        
        {/* Contenido del formulario - responsive */}
        <div className="p-3 sm:p-5">
          <div className="min-h-[350px]">
            {stepRenderers[currentStep]()}
          </div>
          
          {/* Mensaje de error */}
          {actionData?.error && (
            <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 flex items-start">
              <AlertTriangle size={20} className="mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p>{actionData.error}</p>
              </div>
            </div>
          )}
          
          {/* Botones de navegación */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-2">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`w-full sm:w-auto px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center 
                ${currentStep === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
            >
              <ChevronLeft size={16} className="mr-2" />
              Anterior
            </button>
            
            {currentStep < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all flex items-center"
              >
                Siguiente
                <ChevronRight size={16} className="ml-2" />
              </button>
            ) : (
              <Form method="post" className="w-full sm:w-auto">
                {/* Campos ocultos para enviar todos los datos */}
                {Object.entries(formData).map(([key, value]) => (
                  <input key={key} type="hidden" name={key} value={value} />
                ))}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all flex items-center"
                >
                  Crear cuenta
                  <CheckCircle size={16} className="ml-2" />
                </button>
              </Form>
            )}
          </div>
          
          {/* Enlace para ir a login */}
          <div className="mt-4 text-center text-xs sm:text-sm text-gray-600">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}