import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, Link, useFetcher } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import { getSession } from "../../utils/session.server"; 
import UserProfileModal from "./_user/_usercommunitiesmodals/dashboard-user-profile";
import { 
  CheckCircle, AlertCircle, X, Users, Info, ArrowLeft, Search, 
  UserPlus, Eye, Globe, Clock, LogOut, MessageCircle, User,
  DollarSign, Send, PlusCircle, Loader2, Wifi, WifiOff, Download,
  FileText, Image, Music, Video  // Agregar estos imports de lucide-react
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
      body: JSON.stringify(["document_id", "username"]) // Request both document_id and username
    });
    
    if (!userDataResponse.ok) {
      throw new Error('Error al obtener datos del usuario actual');
    }
    
    const userData = await userDataResponse.json();
    
    // Fetch chat history
    const chatResponse = await fetch(`http://localhost:8000/api/chat/community-messages/${communityId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    let chatHistory = [];
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      chatHistory = chatData.messages || [];
    }
    
    return json({
      community: communityData,
      members: membersData.data || [],
      userRole: session.get("user_role"),
      userId: session.get("user_id"),
      userDocumentId: userData.document_id,
      userUsername: userData.username,
      chatHistory,
      token // Pass token to frontend for WebSocket connection
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
  } else if (actionType === "getUserProfile") {
    const userId = formData.get("userId");
    
    try {
      const response = await fetch(`http://localhost:8000/api/user/public-profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar el perfil del usuario');
      }
      
      const profile = await response.json();
      return json({ profile, success: true });
    } catch (error) {
      return json({ error: error.message, success: false });
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
  const { community, members = [], userRole, userId, userDocumentId, userUsername, chatHistory = [], token, error } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const profileFetcher = useFetcher();
  const isSubmitting = navigation.state === "submitting";
  
  const [activeTab, setActiveTab] = useState('details');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState(chatHistory);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  
  // Toast notification state
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  
  // Initialize chat history
  useEffect(() => {
    setMessages(chatHistory);
  }, [chatHistory]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // WebSocket connection management
  useEffect(() => {
    if (activeTab === 'chat' && community?.id && userDocumentId && !ws) {
      connectToChat();
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [activeTab, community?.id, userDocumentId]);
  
  const connectToChat = () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    
    try {
      // WebSocket optimizado: /ws/community/{community_id}/{user_id}
      const websocket = new WebSocket(`ws://localhost:8000/api/chat/ws/community/${community.id}/${userDocumentId}`);
      
      websocket.onopen = () => {
        console.log(`Connected to community ${community.id} chat as user ${userDocumentId}`);
        setIsConnected(true);
        setIsConnecting(false);
        setWs(websocket);
      };
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "history") {
            // Cargar historial al conectarse
            console.log(`Loaded ${data.messages.length} historical messages`);
            setMessages(data.messages);
          } else if (data.type === "message") {
            // Nuevo mensaje en tiempo real
            console.log('New message received:', data);
            setMessages(prev => [...prev, data]);
          } else if (data.type === "error") {
            console.error("WebSocket error:", data.message);
            showToast(data.message, 'error');
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
      
      websocket.onclose = (event) => {
        console.log(`Disconnected from community ${community.id} chat`, event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        setWs(null);
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
        showToast('Error de conexión al chat', 'error');
      };
      
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      setIsConnecting(false);
      showToast('No se pudo conectar al chat', 'error');
    }
  };
  
  const sendMessage = () => {
    if (!chatMessage.trim() || !ws || !isConnected) return;
    
    // JSON ultra simple: solo el texto del mensaje
    const messageData = {
      message_text: chatMessage.trim()
    };
    
    try {
      ws.send(JSON.stringify(messageData));
      setChatMessage('');
      console.log('Message sent:', messageData.message_text);
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Error al enviar mensaje', 'error');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const formatMessageTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        return date.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffDays <= 7) {
        return date.toLocaleDateString('es-ES', { 
          weekday: 'short',
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } catch (e) {
      return '';
    }
  };
  
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
    if (actionData?.success && actionData?.message && !actionData?.profile) {
      // Solo mostrar toast para acciones que no sean getUserProfile
      showToast(actionData.message, "success");
    } else if (actionData?.error && !actionData?.profile) {
      // Solo mostrar toast de error si no es una petición de perfil
      showToast(actionData.error, "error");
    }
  }, [actionData]);
  
  // Handle errors from loader
  useEffect(() => {
    if (error) {
      showToast(error, "error");
    }
  }, [error]);
  
  // Handle profile fetcher data
  useEffect(() => {
    if (profileFetcher.data?.profile) {
      setProfileData(profileFetcher.data.profile);
    } else if (profileFetcher.data?.error) {
      showToast(profileFetcher.data.error, "error");
      setShowProfileModal(false);
    }
  }, [profileFetcher.data]);
  
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

  const handleViewProfile = (userId) => {
    setSelectedUserId(userId);
    setProfileData(null); // Reset profile data
    setShowProfileModal(true);
    
    // Usar fetcher para hacer la petición al action sin recargar la página
    profileFetcher.submit(
      {
        _action: 'getUserProfile',
        userId: userId
      },
      { method: 'post' }
    );
  };

  // Get token from session storage for the modal
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('token');
    }
    return null;
  };

  const handleInitChat = (userId, username) => {
    console.log('🚀 Initiating chat with:', userId, username);
    
    // Ensure we have valid data
    if (!userId || !username) {
      console.error('Invalid chat initiation - missing userId or username');
      return;
    }
    
    // **MEJORADO: Trigger custom event with proper data types**
    const chatEvent = new CustomEvent('openChatModal', { 
      detail: { 
        userId: parseInt(userId), 
        username: String(username).trim()
      } 
    });
    
    console.log('📤 Dispatching openChatModal event:', chatEvent.detail);
    window.dispatchEvent(chatEvent);
  };

  // Nueva función para iniciar transferencia rápida de puntos
  const handleQuickTransfer = (userId, username) => {
    console.log('🚀 Initiating quick transfer to:', userId, username);
    
    // Ensure we have valid data
    if (!userId || !username) {
      console.error('Invalid transfer initiation - missing userId or username');
      return;
    }
    
    // Navigate to transactions page and open modal with preselected user
    // Store data in sessionStorage for cross-page communication
    try {
      sessionStorage.setItem('quickTransfer', JSON.stringify({
        userId: userId,
        username: username,
        timestamp: new Date().getTime() // Add timestamp to ensure it's processed as a new request
      }));
      
      // Navigate to transactions page
      window.location.href = "/dashboard/my-transactions";
    } catch (error) {
      console.error('Error initiating quick transfer:', error);
      showToast('Error al iniciar transferencia rápida', 'error');
    }
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
                                    onClick={() => handleViewProfile(member.user_id)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Ver perfil"
                                  >
                                    <User className="h-4 w-4" />
                                  </button>
                                  
                                  {/* Start Chat */}
                                  <button
                                    onClick={() => handleInitChat(member.user_id, member.username)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                    title="Iniciar chat"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </button>
                                  
                                  {/* Transfer Points - MODIFIED */}
                                  <button
                                    onClick={() => handleQuickTransfer(member.user_id, member.username)}
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
                <div className="flex flex-col h-[600px]">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg border-b">
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      <h3 className="font-medium text-gray-900">Chat de {community.name}</h3>
                    </div>
                    
                    {/* Connection Status */}
                    <div className="flex items-center space-x-2">
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          <span className="text-sm text-gray-600">Conectando...</span>
                        </>
                      ) : isConnected ? (
                        <>
                          <Wifi className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Conectado</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">Desconectado</span>
                          <button
                            onClick={connectToChat}
                            className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Reconectar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Messages Container */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                    {messages.length > 0 ? (
                      messages.map((message, index) => {
                        const isOwnMessage = message.sender_id == userDocumentId; // Use == for type flexibility
                        const showUsername = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                        
                        return (
                          <div key={message.id || index} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwnMessage 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}>
                              {showUsername && !isOwnMessage && (
                                <div className="text-xs font-medium text-gray-600 mb-1">
                                  {message.sender_username || 'Usuario desconocido'}
                                </div>
                              )}
                              
                              {/* CORREGIDO: Detectar mensajes tipo archivo */}
                              {(message.attachment_url || message.file_id || message.message_type === 'file' || message.message_text?.startsWith('📎 ')) ? (
                                <div className="flex items-center space-x-2">
                                  <div className={`p-1.5 rounded-md ${isOwnMessage ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    {getFileIcon(message.file_type || determineFileType(message.file_name || message.message_text))}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {message.file_name || message.message_text?.replace('📎 ', '') || 'Archivo adjunto'}
                                    </p>
                                    {message.file_size && (
                                      <p className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                                        {formatFileSize(message.file_size)}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleFileDownload(
                                      message.download_url || message.attachment_url, 
                                      message.file_name || message.message_text?.replace('📎 ', '') || 'archivo'
                                    )}
                                    className={`p-1.5 rounded-md ${
                                      isOwnMessage 
                                        ? 'hover:bg-white/10 text-white' 
                                        : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                                    title="Descargar archivo"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="text-sm break-words">
                                  {message.message_text}
                                </div>
                              )}
                              
                              <div className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatMessageTime(message.sent_at)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-700">¡Inicia la conversación!</h3>
                        <p className="text-gray-500 text-sm text-center max-w-sm mt-1">
                          No hay mensajes en el chat comunitario. Sé el primero en saludar a tus compañeros.
                        </p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message Input */}
                  <div className="p-4 bg-white border-t">
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isConnected ? "Escribe un mensaje..." : "Conectando al chat..."}
                        disabled={!isConnected}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                        maxLength={200} // Límite de caracteres para mensajes
                      />
                      <button 
                        onClick={sendMessage}
                        disabled={!chatMessage.trim() || !isConnected}
                        className={`p-2 rounded-lg transition-colors ${
                          chatMessage.trim() && isConnected
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title="Enviar mensaje"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {!isConnected && (
                      <div className="mt-2 text-xs text-amber-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Reconectando al chat...
                      </div>
                    )}
                    
                    {/* Character counter */}
                    {chatMessage.length > 400 && (
                      <div className="mt-1 text-xs text-gray-500 text-right">
                        {chatMessage.length}/500 caracteres
                      </div>
                    )}
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
      
      {/* User Profile Modal */}
      <UserProfileModal 
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setProfileData(null);
          setSelectedUserId(null);
        }}
        profileData={profileData}
        loading={profileFetcher.state === "submitting"}
      />
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

// AGREGAR estas nuevas funciones auxiliares para archivos:

  // Función para manejar descarga de archivos
  const handleFileDownload = async (downloadUrl, fileName) => {
    try {
      if (!downloadUrl) {
        console.error('Error downloading file: No download URL provided');
        showToast('Error: URL de descarga no disponible', 'error');
        return;
      }

      // Usar la URL completa del backend
      const backendUrl = downloadUrl.startsWith('http') 
        ? downloadUrl 
        : `http://localhost:8000${downloadUrl}`;
      
      console.log('Downloading file from:', backendUrl);
      
      // Crear un enlace temporal para descargar
      const link = document.createElement('a');
      link.href = backendUrl;
      link.download = fileName || 'archivo_adjunto';
      link.target = '_blank';
      
      // Agregar al DOM temporalmente y hacer click
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      showToast('Error al descargar el archivo', 'error');
    }
  };

  const getFileIcon = (fileType) => {
    switch(fileType) {
      case 'images': return <Image className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const determineFileType = (fileName) => {
    if (!fileName) return 'documents';
    
    const lowerName = fileName.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|bmp|webp)$/.test(lowerName)) {
      return 'images';
    } else if (/\.(mp3|wav|flac|aac|ogg)$/.test(lowerName)) {
      return 'audio';
    } else if (/\.(mp4|mov|avi|mkv|webm)$/.test(lowerName)) {
      return 'video';
    }
    return 'documents';
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
