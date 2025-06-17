import { useState, useEffect, useRef, useCallback } from "react";
import { 
  MessageCircle, 
  X, 
  Search, 
  Send, 
  User,
  ArrowLeft,
  Loader2,
  Circle,
  Download,
  FileText,
  Image,
  Music,
  Video
} from "lucide-react";
import FileUpload from "./dashboard.fileupload";

export default function ChatModal({ 
  isOpen, 
  onClose, 
  userData, 
  token, 
  selectedUser = null,
  isDashboardLoaded = false,
  onUnreadCountChange = () => {},
  onClearSelectedUser = () => {}
}) {
  const [activeChat, setActiveChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  
  // WebSocket state
  const [ws, setWs] = useState(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [directMessages, setDirectMessages] = useState({});
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Track if we opened a specific user chat
  const [openedFromUser, setOpenedFromUser] = useState(false);

  // Conectar WebSocket apenas el dashboard esté listo (modal cerrado)
  useEffect(() => {
    if (isDashboardLoaded && userData?.document_id && !ws) {
      connectToChat();
    }

    // Cleanup cuando el componente se desmonte
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [isDashboardLoaded, userData?.document_id]);

  // Auto-open chat if selectedUser is provided
  useEffect(() => {
    if (isOpen && selectedUser && userData?.document_id) {
      // **ARREGLADO: Mark that we opened from a specific user**
      setOpenedFromUser(true);
      
      // **ARREGLADO: No esperar a directMessages, abrir inmediatamente**
      setTimeout(() => {
        openDirectChat(selectedUser.userId, selectedUser.username);
      }, 300);
    }
  }, [isOpen, selectedUser?.userId, userData?.document_id]); // **REMOVIDO: directMessages de dependencies**

  // **ARREGLADO: Función para formatear el último mensaje**
  const formatLastMessage = (message, messageType) => {
    if (messageType === "file") {
      return message; // Ya viene formateado desde el backend como "📎 filename"
    }
    if (!message || message.trim() === "") {
      return "📎 Archivo adjunto";
    }
    return message;
  };

  // Convert directMessages to conversations list
  useEffect(() => {
    if (Object.keys(directMessages).length > 0) {
      const directConversations = Object.entries(directMessages)
        .map(([userId, data]) => ({
          type: 'direct',
          user_id: parseInt(userId),
          username: data.username || `Usuario ${userId}`,
          last_message: data.lastMessage || 'No hay mensajes',
          last_message_time: data.lastMessageTime,
          unread_count: data.unreadCount || 0,
          message_count: data.messages?.length || 0
        }))
        // **ARREGLADO: Filtrar conversaciones vacías**
        .filter(conv => conv.message_count > 0);
      
      setConversations(directConversations);
    } else {
      setConversations([]);
    }
  }, [directMessages]);

  // Update messages when activeChat changes
  useEffect(() => {
    if (activeChat && directMessages[activeChat.userId]) {
      const existingMessages = directMessages[activeChat.userId].messages || [];
      setMessages(existingMessages);
    }
  }, [activeChat, directMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('🧹 ChatModal: Cleaning up state on close');
      setActiveChat(null);
      setMessages([]);
      setNewMessage('');
      setSearchTerm('');
      // **ARREGLADO: Reset opened from user flag**
      setOpenedFromUser(false);
    }
  }, [isOpen]);

  // Calcular y reportar el conteo de mensajes no leídos
  useEffect(() => {
    const totalUnread = Object.values(directMessages).reduce((total, conv) => {
      return total + (conv.unreadCount || 0);
    }, 0);
    
    onUnreadCountChange(totalUnread);
  }, [directMessages, onUnreadCountChange]);

  const connectToChat = () => {
    if (!userData?.document_id) {
      return;
    }

    try {
      const wsUrl = `ws://localhost:8000/api/chat/ws/direct/${userData.document_id}`;
      
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        setWs(websocket);
        setIsWsConnected(true);
      };
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "connected") {
            // Connection confirmed
            
          } else if (data.type === "history") {
            const conversations = data.conversations || {};
            setDirectMessages(conversations);
            
            const hasUnread = Object.values(conversations).some(conv => (conv.unreadCount || 0) > 0);
            if (hasUnread) {
              setHasNewMessages(true);
              try {
                localStorage.setItem('hasNewMessages', 'true');
              } catch (e) {}
            }
            
          } else if (data.type === "message") {
            const otherUserId = data.sender_id === userData.document_id ? data.receiver_id : data.sender_id;
            
            // **SIMPLIFICADO: Solo verificar si es el chat activo**
            const isIncomingMessage = data.sender_id !== userData.document_id;
            const isActiveChatMessage = activeChat && activeChat.userId === otherUserId && isOpen;
            
            setDirectMessages(prev => {
              const conversation = prev[otherUserId] || {};
              
              let lastMessageText;
              if (data.message_type === "file") {
                lastMessageText = `📎 ${data.file_name || 'Archivo adjunto'}`;
              } else {
                lastMessageText = data.message_text || "📎 Archivo adjunto";
              }
              
              const existingMessages = conversation.messages || [];
              
              // Solo verificar duplicados por ID del servidor
              const isDuplicate = existingMessages.some(msg => msg.id === data.id);
              
              if (isDuplicate) {
                return prev;
              }
              
              // **SIMPLIFICADO: Si es mensaje entrante Y es del chat activo = leído (0), sino incrementar**
              let newUnreadCount = conversation.unreadCount || 0;
              
              if (isIncomingMessage) {
                if (isActiveChatMessage) {
                  // Mensaje del chat activo = leído inmediatamente
                  newUnreadCount = 0;
                } else {
                  // Mensaje de otro chat = incrementar
                  newUnreadCount = newUnreadCount + 1;
                }
              }
              
              // **ARREGLADO: Preservar el username correcto del otro usuario**
              let conversationUsername = conversation.username;
              
              // Si no tenemos username guardado, obtenerlo del mensaje
              if (!conversationUsername) {
                if (isIncomingMessage) {
                  // Si es mensaje entrante, el sender es el otro usuario
                  conversationUsername = data.sender_username || `Usuario ${otherUserId}`;
                } else {
                  // Si es mensaje saliente, el receiver es el otro usuario
                  conversationUsername = data.receiver_username || `Usuario ${otherUserId}`;
                }
              }
              
              // Agregar mensaje nuevo
              const updatedConversation = {
                ...conversation,
                messages: [...existingMessages, data],
                lastMessage: lastMessageText,
                lastMessageTime: data.sent_at,
                username: conversationUsername, // **USAR el username preservado**
                unreadCount: newUnreadCount
              };
              
              return {
                ...prev,
                [otherUserId]: updatedConversation
              };
            });

            // Agregar a vista activa si corresponde
            if (activeChat && activeChat.userId === otherUserId) {
              setMessages(prev => {
                // Solo verificar duplicados por ID del servidor
                const isDuplicate = prev.some(msg => msg.id === data.id);
                
                if (isDuplicate) {
                  return prev;
                }
                
                return [...prev, data];
              });
            }

            // **SIMPLIFICADO: Solo notificar si NO es del chat activo**
            if (isIncomingMessage && !isActiveChatMessage) {
              setHasNewMessages(true);
              try {
                localStorage.setItem('hasNewMessages', 'true');
              } catch (e) {}
            }
            
          } else if (data.type === "error") {
            console.error('WebSocket error:', data.message);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
      
      websocket.onclose = (event) => {
        setWs(null);
        setIsWsConnected(false);
        
        if (isDashboardLoaded && userData?.document_id) {
          setTimeout(() => {
            connectToChat();
          }, 3000);
        }
      };
      
      websocket.onerror = (error) => {
        setIsWsConnected(false);
      };
      
    } catch (error) {
      setIsWsConnected(false);
    }
  };

  const openDirectChat = (otherUserId, otherUsername) => {
    setActiveChat({
      type: 'direct',
      userId: otherUserId,
      username: otherUsername,
      title: otherUsername
    });
    
    const existingMessages = directMessages[otherUserId]?.messages || [];
    setMessages(existingMessages);
    markConversationAsRead(otherUserId);
  };

  const markConversationAsRead = (userId) => {
    setDirectMessages(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        unreadCount: 0
      }
    }));
    
    const stillHasUnread = Object.values(directMessages).some(conv => 
      conv.unreadCount > 0 && conv !== directMessages[userId]
    );
    
    if (!stillHasUnread) {
      setHasNewMessages(false);
      try {
        localStorage.removeItem('hasNewMessages');
      } catch (e) {}
    }
  };

  const handleBackToConversations = () => {
    // Limpiar selectedUser en el dashboard SIEMPRE
    onClearSelectedUser();
    
    // Si abrimos desde un usuario específico y no hay conversaciones, cerrar modal
    if (openedFromUser && conversations.length === 0) {
      onClose();
      return;
    }
    
    // Si tenemos conversaciones, ir a la lista
    if (conversations.length > 0) {
      setActiveChat(null);
      setMessages([]);
      setOpenedFromUser(false);
    } else {
      // Si no hay conversaciones, cerrar modal
      onClose();
    }
  };

  // **SIMPLIFICADO: Enviar mensaje de texto SIN mensajes temporales**
  const sendMessage = () => {
    if (!newMessage.trim() || !ws || !isWsConnected || !activeChat) {
      return;
    }

    if (activeChat?.type === 'direct') {
      try {
        const messageData = {
          type: "text",
          receiver_id: activeChat.userId,
          message_text: newMessage.trim()
        };
        
        // **LIMPIAR input inmediatamente**
        setNewMessage('');
        
        // **ENVIAR por WebSocket - EL SERVIDOR SE ENCARGA DEL RESTO**
        ws.send(JSON.stringify(messageData));
        
        if (openedFromUser) {
          setOpenedFromUser(false);
        }
        
      } catch (error) {
        console.error('Error sending text message:', error);
        // **RESTAURAR mensaje en input si hay error**
        setNewMessage(messageData.message_text);
      }
    }
  };

  // **SIMPLIFICADO: Enviar archivo SIN mensajes temporales**
  const sendFile = useCallback((fileInfo) => {
    if (!ws || !isWsConnected || !activeChat) {
      return;
    }

    if (activeChat?.type === 'direct') {
      try {
        const messageData = {
          type: "file",
          receiver_id: activeChat.userId,
          file_id: fileInfo.file_id,
          file_name: fileInfo.file_name,
          file_type: fileInfo.file_type,
          file_size: fileInfo.file_size
        };
        
        // **ENVIAR por WebSocket - EL SERVIDOR SE ENCARGA DEL RESTO**
        ws.send(JSON.stringify(messageData));
        
        if (openedFromUser) {
          setOpenedFromUser(false);
        }
        
      } catch (error) {
        console.error('Error sending file:', error);
      }
    }
  }, [ws, isWsConnected, activeChat, openedFromUser]);

  // **ARREGLADO: Función para manejar descarga de archivos**
  const handleFileDownload = async (downloadUrl, fileName) => {
    try {
      // **ARREGLADO: Usar la URL completa del backend**
      const backendUrl = downloadUrl.startsWith('http') 
        ? downloadUrl 
        : `http://localhost:8000${downloadUrl}`;
      
      // Crear un enlace temporal para descargar
      const link = document.createElement('a');
      link.href = backendUrl;
      link.download = fileName;
      link.target = '_blank';
      
      // Agregar al DOM temporalmente y hacer click
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error al descargar el archivo');
    }
  };

  // **NUEVO: Función para renderizar mensajes con archivos**
  const renderMessage = (message) => {
    const isOwn = message.sender_id == userData.document_id;
    
    // **ARREGLADO: Detectar archivos por attachment_url, file_id o message_type**
    const isFileMessage = message.attachment_url || message.file_id || message.message_type === 'file' || message.message_text?.startsWith('📎 ');
    
    if (isFileMessage) {
      return (
        <div className={`px-4 py-3 rounded-2xl break-words ${
          isOwn 
            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-br-md' 
            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isOwn ? 'bg-white bg-opacity-20' : 'bg-gray-100'}`}>
              {getFileIcon(message.file_type || determineFileType(message.file_name || message.message_text))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.file_name || message.message_text?.replace('📎 ', '') || 'Archivo adjunto'}
              </p>
              {message.file_size && (
                <p className={`text-xs ${isOwn ? 'text-purple-100' : 'text-gray-500'}`}>
                  {formatFileSize(message.file_size)}
                </p>
              )}
            </div>
            <button
              onClick={() => handleFileDownload(
                message.download_url || message.attachment_url, 
                message.file_name || message.message_text?.replace('📎 ', '') || 'archivo'
              )}
              className={`p-2 rounded-lg transition-colors ${
                isOwn 
                  ? 'hover:bg-white hover:bg-opacity-20 text-white' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Descargar archivo"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }

    // Mensaje de texto normal
    return (
      <div className={`px-4 py-3 rounded-2xl break-words ${
        isOwn 
          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-br-md' 
          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.message_text}
        </p>
      </div>
    );
  };

  const getFileIcon = (fileType) => {
    switch(fileType) {
      case 'images': return <Image className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  // **NUEVA: Función para determinar tipo de archivo por nombre**
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return '';
    }
  };

  const formatLastMessageTime = (timestamp) => {
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
        return date.toLocaleDateString('es-ES', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit'
        });
      }
    } catch (e) {
      return '';
    }
  };

  const truncateMessage = (message, maxLength = 35) => {
    if (!message || message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const filteredConversations = conversations.filter(conv =>
    conv.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) {
    return null;
  }

  // Manejar caso especial cuando no hay conversaciones y abrimos desde usuario
  const shouldShowConversationsList = !activeChat && conversations.length > 0;
  const shouldShowEmptyState = !activeChat && conversations.length === 0 && !openedFromUser;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-20"
        onClick={onClose}
      />
      
      {/* Chat Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-96 h-[600px] flex flex-col overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            {activeChat && (
              <button
                onClick={handleBackToConversations}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            
            {activeChat ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{activeChat.username}</h3>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold text-lg">Chats</h3>
                  <div className="flex items-center space-x-1 text-purple-100 text-sm">
                    <Circle className={`h-2 w-2 fill-current ${isWsConnected ? 'text-green-400' : 'text-red-400'}`} />
                    <span>{isWsConnected ? 'Conectado' : 'Desconectado'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200 relative z-10 pointer-events-auto"
            aria-label="Cerrar chat"
            style={{touchAction: 'manipulation'}}
          >
            <div className="absolute inset-0 rounded-full"></div>
            <X className="h-5 w-5 relative z-20" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {shouldShowConversationsList && (
            // Conversations List
            <>
              {/* Search Bar */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar conversaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200 text-sm text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {filteredConversations.map((conv) => (
                      <div
                        key={`direct-${conv.user_id}`}
                        onClick={() => openDirectChat(conv.user_id, conv.username)}
                        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                          conv.unread_count > 0 ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div className="relative flex-shrink-0 mr-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {conv.username.charAt(0).toUpperCase()}
                          </div>
                          {conv.unread_count > 0 && (
                            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white px-1">
                                {conv.unread_count > 9 ? '9+' : conv.unread_count}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-medium truncate ${
                              conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {conv.username}
                            </h4>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatLastMessageTime(conv.last_message_time)}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${
                            conv.unread_count > 0 ? 'text-gray-600 font-medium' : 'text-gray-500'
                          }`}>
                            {truncateMessage(conv.last_message)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-700 mb-2">Sin resultados</h3>
                    <p className="text-sm text-center max-w-[250px]">
                      No se encontraron conversaciones que coincidan con tu búsqueda
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {shouldShowEmptyState && (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-700 mb-2">No hay conversaciones</h3>
              <p className="text-sm text-center max-w-[250px]">
                Inicia una conversación desde el perfil de otro usuario en las comunidades
              </p>
              <p className="text-xs text-center mt-2 text-gray-400">
                User ID: {userData?.document_id} 
              </p>
            </div>
          )}

          {activeChat && (
            // Chat View
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length > 0 ? (
                  messages.map((message, index) => {
                    const isOwn = message.sender_id == userData.document_id;
                    const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                    
                    return (
                      <div key={message.id || index} className={`flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                          {!isOwn && (
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {activeChat.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        {/* Message Bubble - ACTUALIZADO */}
                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                          {renderMessage(message)}
                          <div className={`mt-1 text-xs text-gray-500 ${isOwn ? 'text-right' : 'text-left'}`}>
                            {formatTime(message.sent_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-700 mb-2">Inicia la conversación</h3>
                    <p className="text-sm text-center max-w-[250px]">
                      Envía un mensaje a {activeChat.username} para comenzar a chatear
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input - ACTUALIZADO */}
              <div className="border-t border-gray-200 bg-white p-4">
                <div className="flex items-end space-x-3">
                  {/* **ARREGLADO: Usar receiverId en lugar de chatId** */}
                  <FileUpload 
                    onFileUploaded={sendFile}
                    chatType="direct"
                    receiverId={activeChat?.userId ? String(activeChat.userId) : null}
                    token={token}
                    disabled={!isWsConnected || !activeChat?.userId}
                  />
                  
                  <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isWsConnected ? "Escribe un mensaje..." : "Conectando..."}
                      disabled={!isWsConnected}
                      rows={newMessage.split('\n').length}
                      className="w-full px-4 py-3 bg-transparent border-0 resize-none focus:outline-none placeholder-gray-500 text-sm max-h-24 text-gray-900"
                      style={{ minHeight: '44px' }}
                    />
                  </div>
                  
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !isWsConnected}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      newMessage.trim() && isWsConnected
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                
                {!isWsConnected && (
                  <div className="mt-2 flex items-center text-xs text-amber-600">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Reconectando...
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
