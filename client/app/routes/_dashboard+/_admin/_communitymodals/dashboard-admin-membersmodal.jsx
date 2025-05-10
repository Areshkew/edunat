import { useState, useEffect, useCallback } from "react";
import { Form, useFetcher } from "@remix-run/react";
import { Users, Shield, AlertCircle, UserPlus, X, AlertTriangle, Search, Loader2, CheckCircle } from "lucide-react";

// Componente AddMemberModal separado
function AddMemberModal({ isOpen, onClose, communityId, existingMemberIds = [], allUsers = [], onMemberAdded }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [points, setPoints] = useState(100);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const fetcher = useFetcher();
  
  // Usar los usuarios ya cargados o cargarlos si es necesario
  useEffect(() => {
    if (isOpen) {
      if (allUsers && allUsers.length > 0) {
        // Filtrar usuarios que ya son miembros
        const filteredUsers = allUsers.filter(user => 
          !existingMemberIds.includes(user.document_id)
        );
        setUsers(filteredUsers);
        setLoading(false);
      } else {
        // Si no tenemos usuarios precargados, intentamos cargarlos
        const fetchUsers = async () => {
          try {
            setLoading(true);
            setError(null);
            
            // Obtener token del localStorage o sessionStorage
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            const response = await fetch('http://localhost:8000/api/user/users', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
            });
            
            if (!response.ok) {
              throw new Error('Error al cargar usuarios');
            }
            
            const data = await response.json();
            
            // Filtrar usuarios que ya son miembros
            const filteredUsers = data.filter(user => 
              !existingMemberIds.includes(user.document_id)
            );
            
            setUsers(filteredUsers);
            setLoading(false);
          } catch (error) {
            console.error("Error fetching users:", error);
            setError(error.message);
            setLoading(false);
          }
        };
        
        fetchUsers();
      }
    }
  }, [isOpen, existingMemberIds, allUsers]);
  
  // Filtrar usuarios según la búsqueda
  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.document_id?.toString().includes(searchQuery)
  );
  
  // Manejar el envío del formulario
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedUser) return;
    
    // Usar fetcher para evitar recargar la página
    fetcher.submit(
      {
        _action: 'addMember',
        communityId,
        userId: selectedUser.document_id,
        points
      },
      { method: 'post' }
    );
    
    // Mostrar mensaje de éxito
    setSuccessMessage(`${selectedUser.username || 'Usuario'} ha sido añadido exitosamente a la comunidad`);
    
    // Notificar al componente padre para actualizar la lista de miembros
    if (onMemberAdded) {
      onMemberAdded({
        user_id: selectedUser.document_id,
        username: selectedUser.username,
        email: selectedUser.email
      });
    }
    
    // Actualizar la lista de usuarios disponibles
    setUsers(prevUsers => 
      prevUsers.filter(user => user.document_id !== selectedUser.document_id)
    );
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
      setSuccessMessage(null);
    }, 2000);
    
    // Limpiar selección para permitir añadir otro miembro
    setSelectedUser(null);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
      {/* Success message toast - bottom right */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-md shadow-md flex items-center z-50 animate-fade-in-up">
          <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
          <span>{successMessage}</span>
        </div>
      )}
    
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Agregar miembro a la comunidad
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <fetcher.Form onSubmit={handleSubmit}>
            <div className="mb-4 relative">
              <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o documento ID"
                  className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')} 
                    className="text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Puntos a otorgar
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 bg-white"
                value={points}
                onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Puntos que recibirá el usuario por ser agregado a esta comunidad
              </p>
            </div>
          
            <div className="px-0 flex-1 overflow-y-auto max-h-[40vh] my-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mb-2"></div>
                  <p className="text-gray-500">Cargando usuarios...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 p-4 rounded-md text-center">
                  <p className="text-red-600">{error}</p>
                  <button
                    className="mt-2 text-sm text-red-700 underline"
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      setError(null);
                      // Retry fetching users
                      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                      fetch('http://localhost:8000/api/user/users', {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Accept': 'application/json',
                        },
                      })
                      .then(response => {
                        if (!response.ok) throw new Error('Error al cargar usuarios');
                        return response.json();
                      })
                      .then(data => {
                        const filteredUsers = data.filter(user => 
                          !existingMemberIds.includes(user.document_id)
                        );
                        setUsers(filteredUsers);
                        setLoading(false);
                      })
                      .catch(error => {
                        setError(error.message);
                        setLoading(false);
                      });
                    }}
                  >
                    Intentar de nuevo
                  </button>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div 
                      key={user.document_id} 
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all ${
                        selectedUser?.document_id === user.document_id 
                          ? 'bg-purple-50 border-2 border-purple-300' 
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-medium">
                        {(user.username || "U")[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.username || "Usuario sin nombre"}</p>
                        <p className="text-xs text-gray-500">
                          {user.email} • ID: {user.document_id}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-md text-center">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No se encontraron usuarios</p>
                  {searchQuery && (
                    <p className="text-gray-400 text-sm mt-1">
                      Prueba con otros términos de búsqueda
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedUser || fetcher.state === "submitting"}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md flex-1 flex items-center justify-center gap-2 ${
                    !selectedUser || fetcher.state === "submitting"
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {fetcher.state === "submitting" ? (
                    <>Agregando...</>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Agregar miembro
                    </>
                  )}
                </button>
              </div>
            </div>
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}

// Componente MembersModal principal
export default function MembersModal({ isOpen, onClose, community, members: initialMembers, isLoading, onRemoveMember, allUsers = [] }) {
  if (!isOpen) return null;

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    userId: null,
    username: ""
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  const [members, setMembers] = useState(initialMembers || []);
  
  // Update members when initialMembers changes
  useEffect(() => {
    setMembers(initialMembers || []);
  }, [initialMembers]);
  
  // Handle member added callback from AddMemberModal
  const handleMemberAdded = useCallback((newMember) => {
    setMembers(prevMembers => [...prevMembers, newMember]);
  }, []);
  
  // Filtrar miembros según la búsqueda
  const filteredMembers = members.filter(member => 
    member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.user_id && member.user_id.toString().includes(searchQuery))
  );

  const formatDate = (dateString) => {
    if (!dateString) return "No especificado";
    
    try {
      // Parse the date string to a Date object
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      // Format the date using Intl.DateTimeFormat for only day, month and year
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Error en formato";
    }
  };

  const handleRemoveMember = (userId) => {
    // Guardar temporalmente el nombre del usuario que se está eliminando
    const removedUser = members.find(member => member.user_id === userId);
    const removedUsername = removedUser?.username || "Usuario";
    
    // Actualizar localmente la lista de miembros (para respuesta inmediata UI)
    setMembers(prevMembers => prevMembers.filter(member => member.user_id !== userId));
    
    // Llamar a la función para eliminar el miembro en el backend
    onRemoveMember(userId);
    
    // Cerrar modal de confirmación
    setConfirmationModal({ isOpen: false, userId: null, username: "" });
    
    // Mostrar mensaje de éxito
    setSuccessMessage(`${removedUsername} ha sido eliminado exitosamente de la comunidad`);
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const openConfirmation = (userId, username) => {
    setConfirmationModal({
      isOpen: true,
      userId,
      username: username || "este miembro"
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
      {/* Success message toast - bottom right */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-md shadow-md flex items-center z-50 animate-fade-in-up">
          <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
          <span>{successMessage}</span>
        </div>
      )}
      
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 pb-0">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Miembros de {community?.name || "la comunidad"}
          </h3>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              {isLoading ? "Cargando..." : `${members.length} miembros`}
            </p>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 pt-0 flex-1 overflow-y-auto">
          <div className="mb-4">
            <button 
              onClick={() => setIsAddMemberOpen(true)}
              className="w-full mb-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Agregar Miembro
            </button>
            
            {/* Buscador para filtrar miembros */}
            <div className="relative mb-4">
              <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Buscar miembros por nombre o ID"
                  className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                    <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="bg-white rounded-md shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredMembers.map((member) => (
                    <div key={member.user_id || member.username} className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-medium">
                        {(member.username || "U")[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.username || "Usuario sin nombre"}</p>
                      </div>
                      <button 
                        onClick={() => openConfirmation(member.user_id, member.username)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                        title="Quitar miembro"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-md shadow-sm flex flex-col items-center justify-center text-center">
                <Users className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium">
                  {searchQuery ? "No se encontraron miembros con esa búsqueda" : "No hay miembros en esta comunidad"}
                </p>
                {searchQuery ? (
                  <p className="text-gray-400 text-sm">Prueba con otros términos de búsqueda</p>
                ) : (
                  <p className="text-gray-400 text-sm">Esperemos que pronto hayan usuarios!</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal de confirmación para eliminar miembros */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmar acción</h3>
            </div>
            
            <p className="mb-6 text-gray-600">
              ¿Estás seguro de que deseas quitar a <span className="font-medium">{confirmationModal.username}</span> de esta comunidad?
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmationModal({...confirmationModal, isOpen: false})}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRemoveMember(confirmationModal.userId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar miembros */}
      {isAddMemberOpen && (
        <AddMemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          communityId={community?.id}
          existingMemberIds={members.map(member => member.user_id)}
          allUsers={allUsers}
          onMemberAdded={handleMemberAdded}
        />
      )}
    </div>
  );
}