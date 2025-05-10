import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import { getSession } from "../../utils/session.server"; 
import { 
  CheckCircle, AlertCircle, X, Users, Info, ArrowLeft, Search, 
  UserPlus, Eye, Globe, Clock, LogOut, MessageCircle, User,
  DollarSign, Send, PlusCircle
} from "lucide-react";

export async function loader({ request, params }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const communityId = params.communityId;

  try {
    // Fetch community details
    const communityResponse = await fetch(`http://localhost:8000/api/community/${communityId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!communityResponse.ok) {
      throw new Error('Error al obtener detalles de la comunidad');
    }
    
    const communityData = await communityResponse.json();
    
    // Fetch community members
    const membersResponse = await fetch(`http://localhost:8000/api/community/members/${communityId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!membersResponse.ok) {
      throw new Error('Error al obtener miembros de la comunidad');
    }
    
    const membersData = await membersResponse.json();
    
    // Fetch current user's document_id for identification
    const userDataResponse = await fetch('http://localhost:8000/api/user/userdata', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(["document_id"]) // Only request the document_id field
    });
    
    if (!userDataResponse.ok) {
      throw new Error('Error al obtener datos del usuario actual');
    }
    
    const userData = await userDataResponse.json();
    
    return json({
      community: communityData,
      members: membersData.data || [],
      userRole: session.get("user_role"),
      userId: session.get("user_id"),
      userDocumentId: userData.document_id // Add the document_id to identify the user
    });
  } catch (error) {
    console.error("Error en loader:", error);
    return json({ error: error.message, community: null, members: [], userRole: null, userId: null }, { status: 400 });
  }
}

export async function action({ request, params }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const communityId = params.communityId;
  const formData = await request.formData();
  const actionType = formData.get("_action");

  if (actionType === "leaveCommunitiy") {
    try {
      const response = await fetch(`http://localhost:8000/api/community/leave/${communityId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (result.detail) {
          return json({ error: result.detail }, { status: response.status });
        }
        return json({ error: "Error al abandonar comunidad" }, { status: response.status });
      }
      
      // Redirect immediately after leaving instead of waiting
      return redirect("/dashboard/my-communities");
    } catch (error) {
      return json({ error: "Error de conexión con el servidor" }, { status: 500 });
    }
  } else if (actionType === "initChat") {
    const userId = formData.get("userId");
    // Solo simulamos el inicio de chat, no hay funcionalidad real implementada
    return json({ success: true, message: "Chat iniciado", chatId: `${userId}_${Date.now()}` });
  } else if (actionType === "startTrade") {
    const userId = formData.get("userId");
    // Solo simulamos el inicio de intercambio, no hay funcionalidad real implementada
    return json({ success: true, message: "Intercambio iniciado", tradeId: `${userId}_${Date.now()}` });
  }

  return null;
}

export default function CommunityDetailsRoute() {
  const { community, members = [], userRole, userId, userDocumentId, error } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [activeTab, setActiveTab] = useState('details');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  
  // Toast notification state
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  
  // Function to show toast notifications
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  // Show toast when action completes
  useEffect(() => {
    if (actionData?.success) {
      showToast(actionData.message || "Operación completada con éxito", "success");
      // Remove redirect logic from here, it's now handled in the action
    } else if (actionData?.error) {
      showToast(actionData.error, "error");
    }
  }, [actionData]);
  
  // Handle errors from loader
  useEffect(() => {
    if (error) {
      showToast(error, "error");
    }
  }, [error]);
  
  // Filter members based on search term and visibility
  const visibleMembers = members.filter(member => member.visibility !== 0);
  
  const filteredMembers = searchTerm.length > 0
    ? visibleMembers.filter(member => 
        member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : visibleMembers;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      // Add timezone handling to ensure consistent display
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        timeZone: 'UTC' // Ensure consistent timezone handling
      });
    } catch (e) {
      console.error("Error formateando fecha:", e);
      return 'Fecha inválida';
    }
  };

  // Si hay un error grave y no tenemos datos de la comunidad, mostrar mensaje de error
  if (!community && error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Error al cargar la comunidad</h2>
          <p className="mb-4">{error}</p>
          <Link 
            to="/dashboard/my-communities" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a mis comunidades
          </Link>
        </div>
        
        {/* Toast notification */}
        {toast.visible && (
          <div className="fixed bottom-4 right-4 z-50 transition-all duration-300 animate-fade-in">
            <div className={`rounded-md p-4 max-w-sm shadow-lg border flex items-start ${
              toast.type === "success" 
                ? "bg-green-50 text-green-800 border-green-200" 
                : "bg-red-50 text-red-800 border-red-200"
            }`}>
              <div className="flex-shrink-0">
                {toast.type === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                )}
              </div>
              <div className="ml-3 flex-1 pt-0.5">
                <p className={`text-sm font-medium ${
                  toast.type === "success" ? "text-green-800" : "text-red-800"
                }`}>
                  {toast.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  type="button"
                  onClick={() => setToast(prev => ({ ...prev, visible: false }))}
                  className={`inline-flex rounded-md focus:outline-none ${
                    toast.type === "success" 
                      ? "text-green-500 hover:text-green-600" 
                      : "text-red-500 hover:text-red-600"
                  }`}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Confirmation modal for leaving community
  const LeaveConfirmationModal = () => {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
          <div className="bg-red-500 p-4">
            <h3 className="text-xl font-semibold text-white">Confirmar acción</h3>
          </div>
          <div className="p-6">
            <div className="mb-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">¿Abandonar comunidad?</h4>
              <p className="text-gray-600">
                ¿Estás seguro de que deseas abandonar la comunidad <span className="font-medium">{community?.name}</span>? 
                Esta acción no se puede deshacer.
              </p>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Cancelar
              </button>
              <Form method="post" onSubmit={() => setShowLeaveModal(false)}>
                <input type="hidden" name="_action" value="leaveCommunitiy" />
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Procesando..." : "Sí, abandonar comunidad"}
                </button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      {community ? (
        <>
          {/* Make sure the back link is correct */}
          <div className="mb-6">
            <Link to="/dashboard/my-communities" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a mis comunidades
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{community.name}</h1>
                  <span className="text-sm text-gray-500">Creado: {formatDate(community.created_at)}</span>
                </div>
                
                {/* Change to button that shows modal */}
                <button
                  onClick={() => setShowLeaveModal(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Procesando..." : "Abandonar comunidad"}
                </button>
              </div>
            </div>
            
            {/* Tabs - eliminamos la pestaña de chat por completo */}
            <div className="border-b">
              <div className="flex">
                <button 
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-3 font-medium text-sm flex items-center ${activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Info className="h-4 w-4 mr-2" /> Detalles
                </button>
                <button 
                  onClick={() => setActiveTab('members')}
                  className={`px-6 py-3 font-medium text-sm flex items-center ${activeTab === 'members' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Users className="h-4 w-4 mr-2" /> Miembros
                </button>
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`px-6 py-3 font-medium text-sm flex items-center ${activeTab === 'chat' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <MessageCircle className="h-4 w-4 mr-2" /> Chat
                </button>
              </div>
            </div>
            
            {/* Tab Content - improved visual design */}
            <div className="p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Community banner/header with image if available */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 shadow-sm">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-4 rounded-full mr-4">
                        <Globe className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{community.name}</h2>
                        <p className="text-sm text-gray-600">Comunidad creada el {formatDate(community.created_at)}</p>
                      </div>
                    </div>

                    <div className="mt-6 bg-white rounded-lg p-4 border border-blue-100">
                      <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                        <Info className="h-5 w-5 mr-2 text-blue-500" /> Acerca de la comunidad
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {community.about || "No hay descripción disponible para esta comunidad."}
                      </p>
                    </div>
                  </div>
                  
                  {/* Stats cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-green-100">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-full mr-3">
                          <Eye className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Visibilidad</p>
                          <p className="text-xl font-bold text-gray-800">
                            {community.visibility === 1 ? 'Pública' : 'Privada'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-purple-100">
                      <div className="flex items-center">
                        <div className="bg-purple-100 p-3 rounded-full mr-3">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Miembros</p>
                          <p className="text-xl font-bold text-gray-800">
                            {visibleMembers.length}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-amber-100">
                      <div className="flex items-center">
                        <div className="bg-amber-100 p-3 rounded-full mr-3">
                          <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Antigüedad</p>
                          <p className="text-xl font-bold text-gray-800">
                            {community.created_at ? calculateAge(community.created_at) : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rules section with better styling */}
                  {community.rules && (
                    <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100 shadow-sm">
                      <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-indigo-500" /> Reglas de la comunidad
                      </h3>
                      <div className="bg-white p-4 rounded-lg border border-indigo-100">
                        <p className="text-gray-600 whitespace-pre-line">{community.rules}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Call to action */}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setActiveTab('members')}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Ver miembros ({visibleMembers.length})
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'members' && (
                <div>
                  <div className="mb-4 relative">
                    <input
                      type="text"
                      placeholder="Buscar miembros..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="space-y-2">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map(member => {
                        // Check if this member is the current user
                        const isCurrentUser = member.user_id === userDocumentId;
                        
                        return (
                          <div key={member.id} className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${isCurrentUser ? 'ring-2 ring-blue-300' : ''}`}>
                            <div className="flex justify-between items-center">
                              <div>
                                {/* Simply show the username without badge */}
                                <h4 className="font-medium text-gray-800">{member.username}</h4>
                                <p className="text-sm text-gray-500">{member.email}</p>
                              </div>
                              
                              {/* Show action buttons for all members except the current user */}
                              {!isCurrentUser && (
                                <div className="flex space-x-2">
                                  {/* View Profile */}
                                  <button
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Ver perfil"
                                  >
                                    <User className="h-4 w-4" />
                                  </button>
                                  
                                  {/* Start Chat */}
                                  <button
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                    title="Iniciar chat"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </button>
                                  
                                  {/* Transfer Points */}
                                  <button
                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                                    title="Transferir puntos"
                                  >
                                    <DollarSign className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                              
                              {/* For current user, show only "Tu cuenta" label */}
                              {isCurrentUser && (
                                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                  Tu cuenta
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center p-8 text-gray-500">
                        {searchTerm.length > 0 ? 
                          "No se encontraron miembros que coincidan con tu búsqueda." :
                          "No hay miembros visibles en esta comunidad."
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* New Community Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-[500px]">
                  {/* Empty chat state */}
                  <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200 mb-4">
                    <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700">Chat de la comunidad</h3>
                    <p className="text-gray-500 text-sm text-center max-w-sm mt-1">
                      No hay mensajes en el chat comunitario. ¡Sé el primero en iniciar una conversación!
                    </p>
                  </div>
                  
                  {/* Message input */}
                  <div className="flex items-center bg-white rounded-lg border border-gray-300 p-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 border-0 focus:ring-0 focus:outline-none text-sm"
                    />
                    <button 
                      className={`p-2 rounded-full ${chatMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                      disabled={!chatMessage}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center p-8">
          <h2 className="text-xl font-medium text-gray-700 mb-2">Cargando...</h2>
          <p className="text-gray-500">Obteniendo detalles de la comunidad</p>
        </div>
      )}
      
      {/* Toast notification */}
      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50 transition-all duration-300 animate-fade-in">
          <div className={`rounded-md p-4 max-w-sm shadow-lg border flex items-start ${
            toast.type === "success" 
              ? "bg-green-50 text-green-800 border-green-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            <div className="flex-shrink-0">
              {toast.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              )}
            </div>
            <div className="ml-3 flex-1 pt-0.5">
              <p className={`text-sm font-medium ${
                toast.type === "success" ? "text-green-800" : "text-red-800"
              }`}>
                {toast.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                type="button"
                onClick={() => setToast(prev => ({ ...prev, visible: false }))}
                className={`inline-flex rounded-md focus:outline-none ${
                  toast.type === "success" 
                    ? "text-green-500 hover:text-green-600" 
                    : "text-red-500 hover:text-red-600"
                }`}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Show the leave confirmation modal when showLeaveModal is true */}
      {showLeaveModal && <LeaveConfirmationModal />}
    </div>
  );
}

// Add this helper function for calculating age of the community
function calculateAge(dateString) {
  if (!dateString) return "No disponible";
  
  try {
    const createdDate = new Date(dateString);
    const now = new Date();
    
    const diffInMs = now - createdDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 30) {
      return diffInDays === 1 ? "1 día" : `${diffInDays} días`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? "1 mes" : `${months} meses`;
    } else {
      const years = Math.floor(diffInDays / 365);
      const remainingMonths = Math.floor((diffInDays % 365) / 30);
      
      if (remainingMonths === 0) {
        return years === 1 ? "1 año" : `${years} años`;
      } else {
        return years === 1 
          ? `1 año y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`
          : `${years} años y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
      }
    }
  } catch (e) {
    console.error("Error calculating age:", e);
    return "Fecha inválida";
  }
}
