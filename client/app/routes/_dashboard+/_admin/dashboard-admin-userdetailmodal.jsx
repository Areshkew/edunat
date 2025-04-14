import { useState, useEffect } from "react";
import { Form, useFetcher } from "@remix-run/react";
import { User, X, Shield, ShieldOff, Loader2, Globe, Phone } from "lucide-react";

export default function UserDetailsModal({ user: initialUser, onClose, onUserUpdate, token }) {
  const [user, setUser] = useState(null);
  const fetcher = useFetcher();
  const togglerFetcher = useFetcher();
  const [tab, setTab] = useState("general");

  useEffect(() => {
    fetcher.submit(
      { user_id: initialUser.document_id, _action: "details" },
      { method: "post" }
    );
  }, [initialUser.document_id]);

  useEffect(() => {
    if (fetcher.data) {
      setUser(fetcher.data);
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (togglerFetcher.data?.userData && togglerFetcher.data?.users) {
      setUser(togglerFetcher.data.userData);
      onUserUpdate(togglerFetcher.data.users); // Actualizar la lista de usuarios en ManageUsers
    }
  }, [togglerFetcher.data]);

  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic text-sm">No especificado</span>;
    }
    return value.toString();
  };

  // Map to show friendly names for fields
  const fieldLabels = {
    document_id: "ID de documento",
    username: "Nombre de usuario",
    name: "Nombre completo",
    email: "Correo electrónico",
    phone_number: "Teléfono",
    birth_date: "Fecha de nacimiento",
    gender: "Género",
    academic_level: "Nivel académico",
    institution: "Institución",
    career: "Carrera",
    residence_city: "Ciudad de residencia",
    birth_city: "Ciudad de nacimiento",
    address: "Dirección",
    visibility: "Visibilidad",
    role: "Rol",
    points: "Puntos",
    language: "Idioma",
    last_login: "Último acceso",
    created_at: "Fecha de registro",
    updated_at: "Última actualización",
    about: "Acerca de",
    needs: "Necesidades",
    offers: "Ofrecimientos",
    webpage: "Página web",
    whatsapp: "WhatsApp",
    photo: "Foto"
  };

  // Map academic levels to text
  const academicLevelText = {
    0: "Ninguno",
    1: "Preescolar",
    2: "Primaria",
    3: "Secundaria",
    4: "Bachillerato",
    5: "Técnico",
    6: "Tecnólogo",
    7: "Pregrado",
    8: "Especialización",
    9: "Maestría",
    10: "Doctorado",
  };

  // Map gender to text
  const genderText = {
    0: "Masculino",
    1: "Femenino",
    2: "Otro"
  };

  // Map language to text
  const languageText = {
    0: "Inglés",
    1: "Español"
  };

  // Format specific fields
  const formatField = (key, value) => {
    // Handle photo field differently
    if (key === 'photo') {
      return (
        <div className="h-16 w-16 rounded-full border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-100">
          {value ? (
            <img 
              src={value} 
              alt="Foto de perfil" 
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<svg class="h-8 w-8 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
              }}
            />
          ) : (
            <User className="h-8 w-8 text-gray-500" />
          )}
        </div>
      );
    }

    // Check for null/empty values
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic text-sm">No especificado</span>;
    }

    if (key === 'role') {
      return value === 1 ? 
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
          Administrador
        </span> : 
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          Usuario
        </span>;
    }
    
    if (key === 'visibility') {
      return value === 1 ? 
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          Visible
        </span> : 
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          No visible
        </span>;
    }

    if (key === 'academic_level') {
      return academicLevelText[value] || "Desconocido";
    }

    if (key === 'gender') {
      return genderText[value] || "Desconocido";
    }

    if (key === 'language') {
      return languageText[value] || "Desconocido";
    }

    if (key === 'created_at' || key === 'last_login' || key === 'updated_at' || key === 'birth_date') {
      try {
        return value ? new Date(value).toLocaleDateString() : "No disponible";
      } catch (e) {
        return value;
      }
    }

    if (key === 'webpage') {
      return value ? (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <Globe className="h-4 w-4" />
          <span className="underline">{value}</span>
        </a>
      ) : "No especificado";
    }

    if (key === 'whatsapp') {
      return value ? (
        <a 
          href={`https://wa.me/${value}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-green-600 hover:text-green-800 flex items-center gap-1"
        >
          <Phone className="h-4 w-4" />
          <span>{value}</span>
        </a>
      ) : "No especificado";
    }

    return renderValue(value);
  };

  // Group fields by category - reorganized to avoid overflow
  const generalFields = ['photo', 'username', 'name', 'email', 'document_id', 'role', 'visibility', 'language', 'points'];
  const academicFields = ['academic_level', 'institution', 'career'];
  const personalFields = ['birth_date', 'gender', 'birth_city', 'residence_city', 'address'];
  const contactFields = ['whatsapp', 'webpage'];
  const extendedFields = ['about', 'needs', 'offers'];
  const systemFields = ['created_at', 'updated_at', 'last_login'];

  if (fetcher.state === "loading" || fetcher.state === "submitting") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-700">Cargando datos del usuario...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[min(90vh,800px)] flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-indigo-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{user.name || user.username}</h2>
                <p className="text-xs text-indigo-200">ID: {user.document_id}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="rounded-full p-1 hover:bg-white/20 transition-colors text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 border-b px-2 md:px-6">
          <div className="flex flex-wrap space-x-1 md:space-x-2 overflow-x-auto">
            <button 
              onClick={() => setTab("general")} 
              className={`py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                tab === "general" 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              General
            </button>
            <button 
              onClick={() => setTab("personal")} 
              className={`py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                tab === "personal" 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Personal
            </button>
            <button 
              onClick={() => setTab("academic")} 
              className={`py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                tab === "academic" 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Académico
            </button>
            <button 
              onClick={() => setTab("contact")} 
              className={`py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                tab === "contact" 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Contacto
            </button>
            <button 
              onClick={() => setTab("extended")} 
              className={`py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                tab === "extended" 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Extra
            </button>
            <button 
              onClick={() => setTab("system")} 
              className={`py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                tab === "system" 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Sistema
            </button>
          </div>
        </div>
        
        {/* Content - scrollable if needed */}
        <div className="flex-1 min-h-0">
          <div className="h-full overflow-y-auto p-4 md:p-6">
            {tab === "general" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="sm:col-span-2 bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center gap-4">
                    {formatField('photo', user.photo)}
                    <div>
                      <p className="font-medium text-gray-900">{user.name || user.username}</p>
                      <p className="text-gray-600 text-sm">@{user.username}</p>
                    </div>
                  </div>
                </div>
                
                {generalFields
                  .filter(key => key !== 'photo' && key !== 'name' && key !== 'username')
                  .map(key => user[key] !== undefined && (
                    <div key={key} className="bg-gray-50 p-3 rounded-md">
                      <p className="text-xs text-gray-500 mb-1">{fieldLabels[key] || key}</p>
                      <div className="font-medium text-gray-900">{formatField(key, user[key])}</div>
                    </div>
                ))}

                <div className="sm:col-span-2 bg-indigo-50 p-3 rounded-md">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-indigo-800">Permisos de usuario</h3>
                      <p className="text-xs text-indigo-600">
                        Cambia el rol entre Administrador y Usuario
                      </p>
                    </div>
                    <togglerFetcher.Form method="post">
                      <input type="hidden" name="user_id" value={user.document_id} />
                      <input type="hidden" name="_action" value="toggler" />
                      <button 
                        type="submit" 
                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-white ${
                          user.role === 1 
                            ? "bg-orange-500 hover:bg-orange-600" 
                            : "bg-purple-600 hover:bg-purple-700"
                        } transition-colors shadow-sm disabled:opacity-60 text-sm`}
                        disabled={togglerFetcher.state === "submitting"}
                      >
                        {togglerFetcher.state === "submitting" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Cambiando...</span>
                          </>
                        ) : user.role === 1 ? (
                          <>
                            <ShieldOff className="h-4 w-4" />
                            <span>Quitar admin</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
                            <span>Hacer admin</span>
                          </>
                        )}
                      </button>
                    </togglerFetcher.Form>
                  </div>
                </div>
              </div>
            )}

            {tab === "personal" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {personalFields.map(key => user[key] !== undefined && (
                  <div key={key} className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">{fieldLabels[key] || key}</p>
                    <div className="font-medium text-gray-900">{formatField(key, user[key])}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "academic" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {academicFields.map(key => user[key] !== undefined && (
                  <div key={key} className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">{fieldLabels[key] || key}</p>
                    <div className="font-medium text-gray-900">{formatField(key, user[key])}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "contact" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {contactFields.map(key => user[key] !== undefined && (
                  <div key={key} className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">{fieldLabels[key] || key}</p>
                    <div className="font-medium text-gray-900">{formatField(key, user[key])}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "extended" && (
              <div className="space-y-4 md:space-y-6">
                {extendedFields.map(key => user[key] !== undefined && (
                  <div key={key} className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm font-medium text-gray-700 mb-2">{fieldLabels[key] || key}</p>
                    <div className="text-gray-600 whitespace-pre-wrap">{formatField(key, user[key])}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "system" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {systemFields.map(key => user[key] !== undefined && (
                  <div key={key} className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">{fieldLabels[key] || key}</p>
                    <div className="font-medium text-gray-900">{formatField(key, user[key])}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="shrink-0 border-t px-6 py-3 bg-gray-50">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 font-medium transition-colors text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}