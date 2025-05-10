import { useState, useEffect } from "react";
import { Form, useFetcher } from "@remix-run/react";
import { Users, UserPlus, Search, X, ChevronUp, ChevronDown, CheckCircle } from "lucide-react";

export default function AddMemberModal({ isOpen, onClose, communityId, existingMemberIds = [], onMemberAdded }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [points, setPoints] = useState(10);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const fetcher = useFetcher();
  
  // Fetch all users when modal opens
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/user/users', {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Error al cargar usuarios');
        }
        
        const data = await response.json();
        // Filter out users that are already members
        const filteredUsers = data.filter(user => !existingMemberIds.includes(user.document_id));
        setUsers(filteredUsers);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, existingMemberIds]);
  
  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.document_id?.toString().includes(searchQuery)
  );
  
  const handleAddMember = () => {
    if (!selectedUser) return;
    
    // Use fetcher to avoid full page refresh
    fetcher.submit(
      {
        _action: "addMember",
        communityId,
        userId: selectedUser.document_id,
        points: points
      },
      { method: "post" }
    );
    
    // Notify parent component to update member list if callback provided
    if (onMemberAdded) {
      onMemberAdded({
        user_id: selectedUser.document_id,
        username: selectedUser.username,
        email: selectedUser.email
      });
    }
    
    // Show success message
    setSuccessMessage(`${selectedUser.username || 'Usuario'} ha sido añadido exitosamente a la comunidad`);
    
    // Remove the added user from the list to prevent duplicate additions
    setUsers(prevUsers => prevUsers.filter(user => user.document_id !== selectedUser.document_id));
    
    // Hide success message after 2 seconds but don't close modal immediately
    setTimeout(() => {
      setSuccessMessage(null);
    }, 2000);
    
    // Reset selected user after successful addition to allow adding another
    setSelectedUser(null);
  };
  
  // Función para incrementar el valor de los puntos
  const incrementPoints = () => {
    setPoints(prevPoints => prevPoints + 1);
  };

  // Función para decrementar el valor de los puntos
  const decrementPoints = () => {
    setPoints(prevPoints => Math.max(0, prevPoints - 1));
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Success message toast - bottom right */}
        {successMessage && (
          <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-md shadow-md flex items-center z-50 animate-fade-in-up">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            <span>{successMessage}</span>
          </div>
        )}
        
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
          
          <div className="mb-4 relative">
            <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o documento ID"
                className="flex-1 outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Puntos con controles personalizados mejorados */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Puntos a otorgar
            </label>
            <div className="flex items-center">
              <div className="relative flex items-center flex-1">
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
                  value={points}
                  onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                />
                <div className="absolute right-0 h-full pr-1 flex flex-col justify-center">
                  <button
                    type="button"
                    onClick={incrementPoints}
                    className="text-purple-600 hover:text-purple-800 transition-colors p-0.5 focus:outline-none"
                    aria-label="Incrementar puntos"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={decrementPoints}
                    className={`transition-colors p-0.5 focus:outline-none ${points <= 0 ? 'text-gray-300 cursor-not-allowed' : 'text-purple-600 hover:text-purple-800'}`}
                    disabled={points <= 0}
                    aria-label="Decrementar puntos"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Botones alternativos para pantallas más grandes */}
              <div className="ml-2 hidden sm:flex">
                <button
                  type="button"
                  onClick={incrementPoints}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 h-8 w-8 rounded-l-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-300 transition-colors"
                  aria-label="Incrementar puntos"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={decrementPoints}
                  className={`h-8 w-8 rounded-r-md flex items-center justify-center focus:outline-none focus:ring-2 transition-colors ${
                    points <= 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-700 focus:ring-purple-300'
                  }`}
                  disabled={points <= 0}
                  aria-label="Decrementar puntos"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Puntos que recibirá el usuario por ser agregado a esta comunidad
            </p>
          </div>
        </div>
        
        <div className="px-6 flex-1 overflow-y-auto max-h-[40vh]">
          {loading ? (
            <div className="space-y-3">
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
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-center">
              <p className="text-red-600">{error}</p>
              <button
                className="mt-2 text-sm text-red-700 underline"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  // Retry fetching users
                  fetchUsers();
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
              <p className="text-gray-500">No se encontraron usuarios</p>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddMember}
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
      </div>
    </div>
  );
}
