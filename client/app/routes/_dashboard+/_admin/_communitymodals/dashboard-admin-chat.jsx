import { useState, useEffect, useRef, useCallback } from "react";
import { useFetcher } from "@remix-run/react";
import { 
  MessageCircle, 
  X, 
  User,
  Loader2,
  Circle,
  Download,
  FileText,
  Image,
  Music,
  Video,
  Send,
  WifiOff,
  MoreVertical, 
  Trash2,      
  AlertTriangle 
} from "lucide-react";
import FileUpload from "../../dashboard.fileupload";

export default function AdminCommunityChat({ 
  isOpen, 
  onClose, 
  userData, 
  token, 
  selectedCommunity = null,
  isDashboardLoaded = false
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // WebSocket state
  const [ws, setWs] = useState(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // **NUEVO: Fetcher para eliminación de mensajes**
  const deleteFetcher = useFetcher();
  
  // **SIMPLIFICADO: Estados para eliminación de mensajes**
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // **ARREGLADO: Refs para evitar múltiples conexiones**
  const wsRef = useRef(null);
  const connectionAttemptRef = useRef(false);
  const lastCommunityIdRef = useRef(null);
  const cleanupTimeoutRef = useRef(null);

  // **ARREGLADO: Cleanup más controlado**
  const cleanupWebSocket = useCallback(() => {
    // console.log('🧹 AdminCommunityChat: Starting cleanup');
    
    // **MARCAR que no estamos intentando conectar**
    connectionAttemptRef.current = false;
    
    // Limpiar timeout de cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
    
    // Cerrar WebSocket actual
    if (wsRef.current) {
      try {
        const currentWs = wsRef.current;
        wsRef.current = null; // **IMPORTANTE: Limpiar ref primero**
        
        currentWs.onopen = null;
        currentWs.onmessage = null;
        currentWs.onclose = null;
        currentWs.onerror = null;
        
        if (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CONNECTING) {
          currentWs.close(1000, 'Manual cleanup');
        }
      } catch (error) {
        console.error('Error during WebSocket cleanup:', error);
      }
    }
    
    // Limpiar estados
    setWs(null);
    setIsWsConnected(false);
    setIsConnecting(false);
    
    // console.log('✅ AdminCommunityChat: Cleanup completed');
  }, []);

  // **ARREGLADO: Efecto principal más estricto**
  useEffect(() => {
    // **SI NO ESTÁ ABIERTO, LIMPIAR TODO**
    if (!isOpen) {
      cleanupWebSocket();
      lastCommunityIdRef.current = null;
      return;
    }

    // **VERIFICAR datos requeridos**
    if (!selectedCommunity?.id || !userData?.document_id) {
      return;
    }

    // **SI ES LA MISMA COMUNIDAD Y YA TENEMOS CONEXIÓN, NO HACER NADA**
    if (lastCommunityIdRef.current === selectedCommunity.id && wsRef.current && isWsConnected) {
      return;
    }

    // **SI CAMBIÓ LA COMUNIDAD, LIMPIAR CONEXIÓN ANTERIOR**
    if (lastCommunityIdRef.current && lastCommunityIdRef.current !== selectedCommunity.id) {
      cleanupWebSocket();
    }

    // **SI YA ESTAMOS INTENTANDO CONECTAR, NO CREAR OTRA CONEXIÓN**
    if (connectionAttemptRef.current) {
      return;
    }

    // **CONECTAR SOLO SI NO HAY CONEXIÓN ACTIVA**
    if (!wsRef.current && !isConnecting) {
      lastCommunityIdRef.current = selectedCommunity.id;
      connectToChat();
    }

    // **CLEANUP al cambiar dependencias**
    return () => {
      // Solo limpiar si el modal se está cerrando o cambiando comunidad
      if (!isOpen || lastCommunityIdRef.current !== selectedCommunity?.id) {
        cleanupWebSocket();
      }
    };
  }, [isOpen, selectedCommunity?.id, userData?.document_id]);

  // **ARREGLADO: Función de conexión más robusta**
  const connectToChat = useCallback(() => {
    // **VERIFICAR si ya estamos conectando o conectados**
    if (connectionAttemptRef.current || wsRef.current) {
      return;
    }

    if (!userData?.document_id || !selectedCommunity?.id) {
      return;
    }

    // **MARCAR que estamos intentando conectar**
    connectionAttemptRef.current = true;
    setIsConnecting(true);

    try {
      const wsUrl = `ws://localhost:8000/api/chat/ws/community/${selectedCommunity.id}/${userData.document_id}`;
      
      const websocket = new WebSocket(wsUrl);
      wsRef.current = websocket; // **GUARDAR referencia inmediatamente**
      
      websocket.onopen = () => {
        connectionAttemptRef.current = false; // **MARCAR que terminamos de conectar**
        setWs(websocket);
        setIsWsConnected(true);
        setIsConnecting(false);
      };
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "history") {
            setMessages(data.messages || []);
            
          } else if (data.type === "message") {
            setMessages(prev => {
              const isDuplicate = prev.some(msg => msg.id === data.id);
              if (isDuplicate) {
                return prev;
              }
              
              return [...prev, data];
            });
            
          } else if (data.type === "message_deleted") {
            // **ARREGLADO: Manejar eliminación de mensajes con logging para debug**
            console.log('🗑️ Mensaje eliminado via WebSocket:', data);
            setMessages(prev => {
              const filteredMessages = prev.filter(msg => {
                // **PROBAR múltiples formas de comparar IDs**
                const msgId = String(msg.id);
                const deletedId = String(data.message_id);
                return msgId !== deletedId;
              });
              console.log('📝 Mensajes antes:', prev.length, 'después:', filteredMessages.length);
              return filteredMessages;
            });
            
            // **CERRAR dropdown y modal si el mensaje eliminado estaba seleccionado**
            if (String(messageToDelete?.id) === String(data.message_id)) {
              setShowDeleteModal(false);
              setMessageToDelete(null);
            }
            setActiveDropdown(null);
            
          } else if (data.type === "error") {
            console.error('WebSocket error:', data.message);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
      
      websocket.onclose = (event) => {
        // **LIMPIAR referencias solo si este es nuestro WebSocket**
        if (wsRef.current === websocket) {
          wsRef.current = null;
          setWs(null);
          setIsWsConnected(false);
        }
        
        connectionAttemptRef.current = false;
        setIsConnecting(false);
        
        // **RECONECTAR solo si el modal sigue abierto y fue cierre inesperado**
        if (isOpen && selectedCommunity?.id && event.code !== 1000) {
          cleanupTimeoutRef.current = setTimeout(() => {
            if (isOpen && selectedCommunity?.id === lastCommunityIdRef.current && !wsRef.current) {
              connectToChat();
            }
          }, 3000);
        }
      };
      
      websocket.onerror = (error) => {
        connectionAttemptRef.current = false;
        setIsConnecting(false);
        
        // **LIMPIAR referencias si hay error**
        if (wsRef.current === websocket) {
          wsRef.current = null;
          setWs(null);
          setIsWsConnected(false);
        }
      };
      
    } catch (error) {
      connectionAttemptRef.current = false;
      setIsConnecting(false);
      wsRef.current = null;
    }
  }, [userData?.document_id, selectedCommunity?.id, isOpen]);

  // **ARREGLADO: Limpiar estados cuando el modal se cierra**
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setNewMessage('');
    }
  }, [isOpen]);

  // **ARREGLADO: Scroll to bottom**
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // **RESTO DE FUNCIONES SIN CAMBIOS**
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !wsRef.current || !isWsConnected) {
      return;
    }

    try {
      const messageData = {
        message_text: newMessage.trim()
      };
      
      setNewMessage('');
      wsRef.current.send(JSON.stringify(messageData));
      
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(newMessage);
    }
  }, [newMessage, isWsConnected]);

  const sendFile = useCallback((fileInfo) => {
    if (!wsRef.current || !isWsConnected) {
      return;
    }

    try {
      const messageData = {
        message_text: `📎 ${fileInfo.file_name}`,
        file_id: fileInfo.file_id,
        file_name: fileInfo.file_name,
        file_type: fileInfo.file_type,
        file_size: fileInfo.file_size
      };
      
      wsRef.current.send(JSON.stringify(messageData));
      
    } catch (error) {
      console.error('Error sending file:', error);
    }
  }, [isWsConnected]);

  const handleFileDownload = async (downloadUrl, fileName) => {
    try {
      if (!downloadUrl) {
        alert('Error: URL de descarga no disponible');
        return;
      }

      const backendUrl = downloadUrl.startsWith('http') 
        ? downloadUrl 
        : `http://localhost:8000${downloadUrl}`;
      
      const link = document.createElement('a');
      link.href = backendUrl;
      link.download = fileName || 'archivo_adjunto';
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error al descargar el archivo');
    }
  };

  const renderMessage = (message) => {
    const isOwn = message.sender_id == userData.document_id;
    
    const isFileMessage = message.attachment_url || message.file_id || message.message_type === 'file' || message.message_text?.startsWith('📎 ');
    
    if (isFileMessage) {
      return (
        <div className={`px-4 py-3 rounded-2xl break-words ${
          isOwn 
            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-br-md' 
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
                <p className={`text-xs ${isOwn ? 'text-indigo-100' : 'text-gray-500'}`}>
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

    return (
      <div className={`px-4 py-3 rounded-2xl break-words ${
        isOwn 
          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-br-md' 
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
    if (!bytes || bytes === 0) return 'Desconocido';
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

  // **ARREGLADO: Función para eliminar mensaje usando Remix fetcher**
  const handleDeleteMessage = (messageId) => {
    if (!token || !messageId) {
      alert('Error: Datos insuficientes para eliminar mensaje');
      return;
    }

    // **USAR REMIX FETCHER correctamente**
    deleteFetcher.submit(
      { 
        messageId: messageId.toString(),
        _action: "delete_message"
      },
      {
        method: "POST",
        action: "/dashboard/communities"
      }
    );
  };

  // **ARREGLADO: Efecto para manejar respuesta del fetcher**
  useEffect(() => {
    if (deleteFetcher.state === "idle" && deleteFetcher.data) {
      if (deleteFetcher.data.success) {
        console.log('Mensaje eliminado:', deleteFetcher.data);
        
        // Cerrar modal
        setShowDeleteModal(false);
        setMessageToDelete(null);
        setIsDeleting(false);
        
        // El mensaje se eliminará automáticamente via WebSocket
      } else if (deleteFetcher.data.error) {
        console.error('Error deleting message:', deleteFetcher.data.error);
        alert(`Error al eliminar mensaje: ${deleteFetcher.data.error}`);
        setIsDeleting(false);
      }
    }
    
    // **MANEJAR estados del fetcher**
    if (deleteFetcher.state === "submitting") {
      setIsDeleting(true);
    } else if (deleteFetcher.state === "idle") {
      setIsDeleting(false);
    }
  }, [deleteFetcher.state, deleteFetcher.data]);

  // **NUEVO: Componente de modal de confirmación**
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal || !messageToDelete) return null;

    const isFileMessage = messageToDelete.attachment_url || messageToDelete.file_id || messageToDelete.message_type === 'file';

    return (
      <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Eliminar mensaje</h3>
                <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que deseas eliminar este mensaje?
              </p>
              
              {isFileMessage && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
                  <p className="text-amber-800 text-sm">
                    ⚠️ Este mensaje contiene un archivo que también será eliminado permanentemente del servidor.
                  </p>
                </div>
              )}
              
              <div className="bg-gray-50 rounded-md p-3 mt-3">
                <p className="text-sm text-gray-600 font-medium">Vista previa del mensaje:</p>
                <div className="mt-2 text-sm text-gray-800">
                  {isFileMessage ? (
                    <span>📎 {messageToDelete.file_name || 'Archivo adjunto'}</span>
                  ) : (
                    <span>"{messageToDelete.message_text}"</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Por: {messageToDelete.sender_username || 'Usuario desconocido'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMessageToDelete(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteMessage(messageToDelete.id)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // **SIMPLIFICADO: Componente de dropdown de acciones**
  const MessageActionsDropdown = ({ message, messageId, isOwn }) => {
    return (
      <div className={`absolute ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} top-0 w-44 bg-white rounded-md shadow-xl border border-gray-200 z-[100] py-1`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMessageToDelete(message);
            setShowDeleteModal(true);
            setActiveDropdown(null);
          }}
          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center text-sm transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar mensaje
        </button>
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{selectedCommunity?.name || "Chat de Comunidad"}</h2>
              <div className="flex items-center text-sm text-indigo-100 gap-2 mt-0.5">
                <Circle 
                  className={`h-2 w-2 fill-current ${isWsConnected ? 'text-green-400' : 'text-red-400'}`} 
                />
                <span>
                  {isWsConnected ? 'Conectado' : isConnecting ? 'Conectando...' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.length > 0 ? (
            messages.map((message, index) => {
              const isOwn = message.sender_id == userData.document_id;
              const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
              
              return (
                <div key={message.id || index} className={`flex items-start space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                    {!isOwn && (
                      <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {message.sender_username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    {isOwn && (
                      <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        A
                      </div>
                    )}
                  </div>
                  
                  {/* Message Content */}
                  <div className={`max-w-[60%] relative ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Username and timestamp */}
                    {showAvatar && (
                      <div className={`flex items-center mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-sm font-medium text-gray-700">
                          {isOwn ? 'Administrador' : (message.sender_username || 'Usuario')}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatTime(message.sent_at)}
                        </span>
                      </div>
                    )}
                    
                    {/* Message Bubble with Actions */}
                    <div className="relative group">
                      {renderMessage(message)}
                      
                      {/* **ARREGLADO: Botón de 3 puntos con mejor posicionamiento** */}
                      <div className={`absolute top-1/2 transform -translate-y-1/2 ${isOwn ? '-left-10' : '-right-10'} opacity-0 group-hover:opacity-100 transition-opacity z-[90]`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === message.id ? null : message.id);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-gray-600 shadow-lg border border-gray-200 transition-all"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {/* **ARREGLADO: Dropdown posicionado al lado del mensaje** */}
                        {activeDropdown === message.id && (
                          <MessageActionsDropdown 
                            message={message} 
                            messageId={message.id}
                            isOwn={isOwn}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <MessageCircle className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Chat de {selectedCommunity?.name}
              </h3>
              <p className="text-center max-w-md">
                {isConnecting ? 
                  'Conectando al chat...' : 
                  'No hay mensajes aún. Como administrador, puedes participar en esta conversación comunitaria.'
                }
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message input */}
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          {/* Connection warning */}
          {!isWsConnected && (
            <div className="mb-3 p-3 bg-amber-50 text-amber-700 rounded-md border border-amber-200 flex items-center text-sm">
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando al servidor de chat...
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 mr-2" />
                  <span>Desconectado del chat - </span>
                  <button 
                    onClick={connectToChat} 
                    className="underline font-medium ml-1 hover:no-underline"
                  >
                    Reconectar
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* Input area */}
          <div className="flex items-end gap-2">
            <FileUpload 
              onFileUploaded={sendFile}
              chatType="community"
              receiverId={selectedCommunity?.id ? String(selectedCommunity.id) : null}
              token={token}
              disabled={!isWsConnected || !selectedCommunity?.id}
            />
            
            {/* Message Input */}
            <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:ring-opacity-20">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isWsConnected ? "Escribe un mensaje como administrador..." : "Conectando..."}
                disabled={!isWsConnected}
                rows={Math.min(Math.max(newMessage.split('\n').length, 1), 4)}
                className="w-full px-4 py-3 bg-transparent resize-none border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500 text-sm"
                style={{ minHeight: '44px', maxHeight: '100px' }}
              />
            </div>
            
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isWsConnected}
              className={`p-3 rounded-lg ${
                newMessage.trim() && isWsConnected
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          
          {/* Character counter */}
          {newMessage.length > 100 && (
            <div className="mt-2 text-right">
              <span className={`text-xs ${newMessage.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                {newMessage.length}/1000 caracteres
              </span>
            </div>
          )}
        </div>
        
        {/* **NUEVO: Modal de confirmación de eliminación** */}
        <DeleteConfirmationModal />
        
        {/* **ARREGLADO: Overlay para cerrar dropdown con z-index correcto** */}
        {activeDropdown && (
          <div 
            className="fixed inset-0 z-[80]" 
            onClick={() => setActiveDropdown(null)}
          />
        )}
      </div>
    </div>
  );
}
