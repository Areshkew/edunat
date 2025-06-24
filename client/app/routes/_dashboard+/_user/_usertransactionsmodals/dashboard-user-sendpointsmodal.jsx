import React, { useState, useEffect, useMemo } from "react";
import { Form } from "@remix-run/react";
import {
  User,
  Send,
  Search,
  X,
  Info,
  AlertCircle,
  ArrowRight,
  Coins,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

const SendPointsModal = ({ 
  isOpen, 
  onClose, 
  users = [],
  loadingUsers = false,
  currentUserPoints = 0,
  isSubmitting = false,
  onSubmit,
  preselectedUser = null // New prop for preselected user
}) => {
  // If modal isn't open, don't render anything
  if (!isOpen) return null;
  
  // States for the form
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [transactionForm, setTransactionForm] = useState({ points: '', details: '' });
  
  // Form validation states
  const [formErrors, setFormErrors] = useState({
    points: '',
    details: '',
    general: ''
  });
  
  // Track field touched state to show errors only after interaction
  const [touchedFields, setTouchedFields] = useState({
    points: false,
    details: false
  });
  
  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!users || users.length === 0) return [];
    
    if (!userSearchTerm.trim()) return users;
    
    const searchTermLower = userSearchTerm.toLowerCase().trim();
    return users.filter(user => 
      (user.username && user.username.toLowerCase().includes(searchTermLower)) ||
      (user.document_id && String(user.document_id).includes(searchTermLower)) ||
      (user.email && user.email.toLowerCase().includes(searchTermLower))
    );
  }, [users, userSearchTerm]);
  
  // Mark a field as touched when user interacts with it
  const handleFieldBlur = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, transactionForm[fieldName]);
  };
  
  // Validate a specific field
  const validateField = (fieldName, value) => {
    let error = '';
    
    switch (fieldName) {
      case 'points':
        if (!value) {
          error = 'Debes especificar una cantidad de puntos';
        } else if (parseInt(value) <= 0) {
          error = 'La cantidad debe ser mayor que 0';
        } else if (parseInt(value) > currentUserPoints) {
          error = `No tienes suficientes puntos. Tu balance es de ${currentUserPoints} puntos`;
        }
        break;
        
      case 'details':
        if (!value.trim()) {
          error = 'Debes incluir un detalle para la transacción';
        } else if (value.trim().length < 1) {
          error = 'Debes incluir algún detalle para la transacción';
        } else if (value.trim().length > 60) {
          error = 'El detalle no debe exceder los 60 caracteres';
        }
        break;
        
      default:
        break;
    }
    
    setFormErrors(prev => ({ ...prev, [fieldName]: error }));
    return error === '';
  };
  
  // Validate all form fields
  const validateForm = () => {
    const pointsValid = validateField('points', transactionForm.points);
    const detailsValid = validateField('details', transactionForm.details);
    
    // Mark all fields as touched when submitting
    setTouchedFields({
      points: true,
      details: true
    });
    
    return pointsValid && detailsValid;
  };
  
  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === "points" ? (value === "" ? "" : parseInt(value, 10) || '') : value;
    
    setTransactionForm(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Validate on change if the field has been touched
    if (touchedFields[name]) {
      validateField(name, newValue);
    }
  };

  // Select user
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setUserSearchTerm("");
    setFormErrors(prev => ({ ...prev, general: '' }));
  };
  
  // Field error component
  const FieldError = ({ message }) => {
    if (!message) return null;
    
    return (
      <div className="mt-1.5 flex items-center text-sm text-red-600">
        <AlertTriangle className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  };
  
  // Handle form submission with enhanced validation
  const handleSendTransaction = (e) => {
    e.preventDefault();
    
    // Reset general error
    setFormErrors(prev => ({ ...prev, general: '' }));
    
    // Validate that a user is selected
    if (!selectedUser) {
      setFormErrors(prev => ({ 
        ...prev, 
        general: 'Por favor selecciona un usuario para enviar los puntos' 
      }));
      return;
    }
    
    // Validate all form fields
    if (!validateForm()) {
      return;
    }
    
    onSubmit({
      points: transactionForm.points,
      destination: selectedUser.document_id.toString(),
      details: transactionForm.details
    });
  };
  
  // Set preselected user when provided
  useEffect(() => {
    if (preselectedUser && users.length > 0) {
      const userToSelect = users.find(u => 
        String(u.document_id) === String(preselectedUser.userId) || 
        u.username === preselectedUser.username
      );
      
      if (userToSelect) {
        setSelectedUser(userToSelect);
        setTouchedFields(prev => ({ ...prev, user: true }));
      }
    }
  }, [preselectedUser, users]);
  
  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTransactionForm({ points: "", details: "" });
      setUserSearchTerm("");
      setFormErrors({ points: '', details: '', general: '' });
      setTouchedFields({ points: false, details: false });
    }
  }, [isOpen]);
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-indigo-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        
        {/* Modal */}
        <div className="inline-block w-full max-w-md p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-white flex items-center">
                <Send className="h-5 w-5 mr-2 text-indigo-100" />
                Enviar Puntos a Usuario
              </h3>
              <button
                type="button"
                className="rounded-full p-1.5 text-indigo-100 hover:text-white hover:bg-indigo-500 transition-colors duration-200 focus:outline-none"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {!selectedUser && (
              <p className="mt-1 text-sm text-indigo-100">
                Selecciona un usuario al que enviar tus puntos
              </p>
            )}
            {selectedUser && (
              <div className="mt-1 text-sm text-indigo-100 flex items-center">
                <Coins className="h-4 w-4 mr-1.5 text-yellow-300" />
                <span>Balance disponible: {currentUserPoints} puntos</span>
              </div>
            )}
          </div>

          <div className="p-6">
            {/* General error message */}
            {formErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-800">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" />
                <p className="text-sm">{formErrors.general}</p>
              </div>
            )}
            
            {/* Búsqueda de usuarios */}
            {!selectedUser ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Buscar Usuario
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pl-11 text-gray-900 placeholder-gray-400 transition-all duration-200"
                    placeholder="Buscar por nombre, email o documento..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
            ) : (
              <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg flex items-center justify-between shadow-sm border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-indigo-600 bg-opacity-15 rounded-full flex items-center justify-center shadow-sm border-2 border-indigo-200">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedUser.username}</p>
                    <p className="text-xs text-gray-500">
                      {selectedUser.email} • ID: {selectedUser.document_id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-50 transition-colors duration-200 border border-indigo-100"
                  onClick={() => setSelectedUser(null)}
                >
                  Cambiar
                </button>
              </div>
            )}

            {/* Lista de usuarios */}
            {!selectedUser && (
              <>
                {loadingUsers ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin h-8 w-8 border-3 border-indigo-500 rounded-full border-t-transparent"></div>
                    <p className="ml-3 text-gray-600 font-medium">Cargando usuarios disponibles...</p>
                  </div>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  <div className="mt-3 max-h-64 overflow-y-auto rounded-lg shadow-sm border border-gray-200">
                    <div className="sticky top-0 z-10 text-xs text-indigo-900 p-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 flex items-center">
                      <User className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                      <span className="font-medium">{filteredUsers.length} usuario(s) encontrado(s)</span>
                    </div>
                    <ul className="divide-y divide-gray-100 bg-white">
                      {filteredUsers.map((user) => (
                        <li
                          key={user.document_id}
                          className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors duration-200 group"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-indigo-100 group-hover:bg-indigo-200 transition-colors duration-200 rounded-full flex items-center justify-center border border-indigo-200">
                              <User className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-900 transition-colors duration-200">{user.username}</p>
                              <p className="text-xs text-gray-500 group-hover:text-indigo-700 transition-colors duration-200">
                                {user.email} {user.document_id && `• ID: ${user.document_id}`}
                              </p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="bg-indigo-600 text-white rounded-full p-1">
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : userSearchTerm ? (
                  <div className="text-center py-8 px-4 mt-3 border border-gray-200 rounded-lg bg-gray-50">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">No se encontraron usuarios</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Prueba con un término de búsqueda diferente
                    </p>
                  </div>
                ) : users && users.length === 0 ? (
                  <div className="text-center py-8 px-4 mt-3 border border-gray-200 rounded-lg bg-gray-50">
                    <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">No hay usuarios disponibles</p>
                    <p className="text-sm text-gray-500 mt-1">
                      No se encontraron usuarios a los que enviar puntos
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 mt-3 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-600">Escribe para buscar usuarios</p>
                  </div>
                )}
              </>
            )}

            {/* Formulario de transacción */}
            {selectedUser && (
              <Form onSubmit={handleSendTransaction} method="post" className="space-y-5 mt-2">
                <input type="hidden" name="_action" value="createTransaction" />
                <input 
                  type="hidden" 
                  name="destination" 
                  value={selectedUser.document_id.toString()} 
                />

                <div>
                  <label htmlFor="points" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Cantidad de Puntos
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="points"
                      name="points"
                      className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-400 transition-all duration-200 pr-12 
                        ${formErrors.points && touchedFields.points 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                          : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        }`}
                      placeholder="Ingrese cantidad de puntos"
                      value={transactionForm.points}
                      onChange={handleFormChange}
                      onBlur={() => handleFieldBlur('points')}
                      min="1"
                      max={currentUserPoints}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Coins className={`h-5 w-5 ${formErrors.points && touchedFields.points ? "text-red-400" : "text-indigo-400"}`} />
                    </div>
                  </div>
                  
                  {touchedFields.points && formErrors.points ? (
                    <FieldError message={formErrors.points} />
                  ) : (
                    <p className="mt-1.5 text-xs text-gray-500 flex items-center">
                      <Info className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                      Máximo disponible: {currentUserPoints} puntos
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="details" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Detalles de la Transacción
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    rows="3"
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-400 transition-all duration-200
                      ${formErrors.details && touchedFields.details 
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                        : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      }`}
                    placeholder="Ingrese un detalle o motivo de la transacción"
                    value={transactionForm.details}
                    onChange={handleFormChange}
                    onBlur={() => handleFieldBlur('details')}
                  ></textarea>
                  
                  {touchedFields.details && formErrors.details ? (
                    <FieldError message={formErrors.details} />
                  ) : (
                    <p className="mt-1.5 text-xs text-gray-500 flex items-center">
                      <Info className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                      Proporcione un motivo o descripción para esta transferencia
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-3"></span>
                        Procesando...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Send className="h-4 w-4 mr-2" />
                        Enviar {transactionForm.points ? `${transactionForm.points} Puntos` : 'Puntos'}
                      </span>
                    )}
                  </button>
                  
                  {/* Success/pending status indicator */}
                  <div className="flex justify-center mt-2">
                    <p className="text-xs text-gray-500 flex items-center">
                      <Info className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                      Las transacciones requieren aprobación del destinatario
                    </p>
                  </div>
                </div>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendPointsModal;
