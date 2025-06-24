import React, { useState, useEffect } from "react";
import { X, Search, UserX, UserPlus, ArrowDownCircle, AlertTriangle, Users } from "lucide-react";

// Componente común para buscar usuarios
function UserSearchList({ users, searchQuery, selectedUser, onUserSelect, instructorId }) {
  const filteredUsers = users.filter(user => 
    user.document_id && 
    user.document_id !== 0 && 
    user.document_id !== instructorId &&
    (
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.document_id?.toString().includes(searchQuery)
    )
  );

  if (filteredUsers.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-md text-center">
        <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">No se encontraron usuarios</p>
        {searchQuery && (
          <p className="text-gray-400 text-sm mt-1">
            Prueba con otros términos de búsqueda
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredUsers.map((user) => (
        <div 
          key={user.document_id} 
          className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all ${
            selectedUser?.document_id === user.document_id 
              ? 'bg-indigo-50 border-2 border-indigo-300' 
              : 'hover:bg-gray-50 border-2 border-transparent'
          }`}
          onClick={() => onUserSelect(user)}
        >
          <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-medium">
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
  );
}

// Componente AddStudentModal optimizado
function AddStudentModal({ isOpen, onClose, courseId, existingStudentIds = [], allUsers = [], onStudentAdded, instructorId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const availableUsers = allUsers.filter(user => 
    !existingStudentIds.includes(user.document_id) && 
    user.document_id !== instructorId
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedUser) return;
    
    onStudentAdded(selectedUser.document_id);
    setSelectedUser(null);
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Agregar estudiante al curso
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
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
          
            <div className="overflow-y-auto max-h-[40vh] mb-4">
              <UserSearchList 
                users={availableUsers}
                searchQuery={searchQuery}
                selectedUser={selectedUser}
                onUserSelect={setSelectedUser}
                instructorId={instructorId}
              />
            </div>
            
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
                disabled={!selectedUser}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex-1 flex items-center justify-center gap-2 ${
                  !selectedUser
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                Agregar estudiante
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Modal de confirmación reutilizable
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <p className="mb-6 text-gray-600">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsModal({ 
  isOpen, 
  onClose, 
  course, 
  students = [], 
  isLoading = false, 
  onRemoveStudent, 
  onAddStudent,
  allUsers = []
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    studentId: null,
    username: ""
  });

  const filteredStudents = students.filter(student => 
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toString().includes(searchTerm)
  );
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSearchTerm("");
      setIsAddStudentOpen(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen || !course) return null;
  
  const handleRemoveStudent = (studentId) => {
    onRemoveStudent(studentId);
    setConfirmationModal({ isOpen: false, studentId: null, username: "" });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No especificada";
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    } catch (error) {
      return "Fecha inválida";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-lg font-semibold text-gray-900">Estudiantes del Curso</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <div>
              <h4 className="font-medium">{course.name}</h4>
              <p className="text-sm text-gray-500">
                {students.length} {students.length === 1 ? "estudiante" : "estudiantes"} inscritos
              </p>
            </div>
            <button 
              onClick={() => setIsAddStudentOpen(true)} 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <UserPlus size={16} />
              Agregar Estudiante
            </button>
          </div>
          
          <div className="relative">
            <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar estudiantes por nombre o ID..."
                className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                <p className="text-gray-500">Cargando estudiantes...</p>
              </div>
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredStudents.map(student => (
                <div key={student.student_id} className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 border border-gray-200">
                  <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-medium">
                    {(student.username || "U")[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{student.username}</h4>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>ID: {student.student_id}</p>
                      <p>Inscrito: {formatDate(student.enrolled_date)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmationModal({
                      isOpen: true,
                      studentId: student.student_id,
                      username: student.username
                    })}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                    title="Quitar estudiante"
                  >
                    <UserX size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 flex justify-center">
              {searchTerm ? (
                <div className="text-center">
                  <Search size={30} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No se encontraron estudiantes con "{searchTerm}"</p>
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <ArrowDownCircle size={30} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Este curso aún no tiene estudiantes</p>
                  <button 
                    onClick={() => setIsAddStudentOpen(true)}
                    className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Agregar estudiantes
                  </button>
                </div>
              )}
            </div>
          )}
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

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({...confirmationModal, isOpen: false})}
        onConfirm={() => handleRemoveStudent(confirmationModal.studentId)}
        title="Confirmar acción"
        message={`¿Estás seguro de que deseas quitar a ${confirmationModal.username} de este curso?`}
      />

      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        courseId={course?.id}
        existingStudentIds={students.map(student => student.student_id)}
        allUsers={allUsers}
        onStudentAdded={onAddStudent}
        instructorId={course?.instructor}
      />
    </div>
  );
}
