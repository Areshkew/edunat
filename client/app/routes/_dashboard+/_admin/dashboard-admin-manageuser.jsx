import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Trash2, Filter, X, AlertCircle, Users } from "lucide-react";
import { Form } from "@remix-run/react";
import UserDetailsModal from "./dashboard-admin-userdetailmodal";

export default function ManageUsers({ initialUsers, token }) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'username', direction: 'ascending' });
  const [filters, setFilters] = useState({
    role: 'all',
    visibility: 'all',
    academic_level: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, userId: null, username: "" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const filteredUsers = sortedUsers.filter(user => {
    const matchesSearch = Object.values(user).some(value => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || false
    );
    
    const matchesFilters = (
      (filters.role === 'all' || user.role === parseInt(filters.role)) &&
      (filters.visibility === 'all' || user.visibility === parseInt(filters.visibility)) &&
      (filters.academic_level === 'all' || user.academic_level === parseInt(filters.academic_level))
    );

    return matchesSearch && matchesFilters;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handleToggleVisibility = (userId) => {
    setUsers(users.map(user => 
      user.document_id === userId ? { ...user, visibility: user.visibility === 1 ? 0 : 1 } : user
    ));
  };

  const handleEditRole = (user) => {
    setSelectedUser(user);
  };

  const resetFilters = () => {
    setFilters({
      role: 'all',
      visibility: 'all',
      academic_level: 'all'
    });
    setSearchTerm("");
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp className="w-3 h-3" /> : 
      <ChevronDown className="w-3 h-3" />;
  };

  const columns = [
    ['username', 'Usuario'],
    ['name', 'Nombre'],
    ['email', 'Correo'],
    ['points', 'Puntos'],
    ['academic_level', 'Nivel académico'],
    ['document_id', 'Documento'],
    ['acciones', 'Acciones']
  ];

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Administrar Usuarios</h1>
        <p className="text-sm text-gray-600 mb-6">Gestiona los usuarios registrados en la plataforma</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-md shadow-sm border-l-3 border-indigo-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Total de usuarios</p>
                <p className="text-lg font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="h-6 w-6 text-indigo-500" />
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-md shadow-sm border-l-3 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Usuarios activos</p>
                <p className="text-lg font-bold text-gray-900">{users.filter(u => u.visibility === 1).length}</p>
              </div>
              <Eye className="h-6 w-6 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-md shadow-sm border-l-3 border-purple-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Administradores</p>
                <p className="text-lg font-bold text-gray-900">{users.filter(u => u.role === 1).length}</p>
              </div>
              <span className="bg-white p-3 rounded">
                <Pencil className="h-5 w-5 text-purple-500" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <input
                type="text"
                placeholder="Buscar usuarios..."
                className="w-full pl-8 pr-8 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition ${
                Object.values(filters).some(val => val !== 'all')
                  ? "bg-indigo-100 text-indigo-700 border-indigo-300" 
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="text-current">Filtros</span>
              {Object.values(filters).some(val => val !== 'all') && (
                <span className="bg-indigo-500 text-white text-xs w-4 h-4 rounded-full inline-flex items-center justify-center">
                  {Object.values(filters).filter(val => val !== 'all').length}
                </span>
              )}
            </button>
            
            {Object.values(filters).some(val => val !== 'all') && (
              <button 
                onClick={resetFilters}
                className="text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Limpiar
              </button>
            )}
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rol</label>
                <select
                  className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.role}
                  onChange={(e) => setFilters({...filters, role: e.target.value})}
                >
                  <option value="all">Todos los roles</option>
                  <option value="0">Usuario</option>
                  <option value="1">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Visibilidad</label>
                <select
                  className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.visibility}
                  onChange={(e) => setFilters({...filters, visibility: e.target.value})}
                >
                  <option value="all">Toda visibilidad</option>
                  <option value="1">Visible</option>
                  <option value="0">No visible</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nivel académico</label>
                <select
                  className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.academic_level}
                  onChange={(e) => setFilters({...filters, academic_level: e.target.value})}
                >
                  <option value="all">Todos los niveles</option>
                  {Object.entries(academicLevelText).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Count and Results */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">
          Mostrando {paginatedUsers.length} de {filteredUsers.length} usuarios
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(([key, label]) => (
                  <th
                    key={key}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => key !== 'acciones' && handleSort(key)}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {key !== 'acciones' && <SortIcon column={key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50 text-sm">
                    <td className="px-4 py-2 whitespace-nowrap text-gray-900">{user.username}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-900">{user.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-900">{user.email}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-900">{user.points}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                      {academicLevelText[user.academic_level] || "Desconocido"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-900">{user.document_id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-900 flex items-center gap-1">
                      <Form method="post" onSubmit={() => handleToggleVisibility(user.document_id)}>
                        <input type="hidden" name="user_id" value={user.document_id} />
                        <input type="hidden" name="_action" value="togglev" />
                        <button
                          type="submit"
                          className={`p-1 rounded-full ${user.visibility ? "bg-green-100 hover:bg-green-200" : "bg-gray-100 hover:bg-gray-200"}`}
                          title={user.visibility ? "Ocultar usuario" : "Mostrar usuario"}
                        >
                          {user.visibility ? 
                            <Eye className="h-3.5 w-3.5 text-green-600" /> : 
                            <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                          }
                        </button>
                      </Form>
                      <button
                        onClick={() => handleEditRole(user)}
                        className="p-1 bg-blue-100 hover:bg-blue-200 rounded-full"
                        title="Ver detalles"
                      >
                        <Pencil className="h-3.5 w-3.5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ 
                          show: true, 
                          userId: user.document_id,
                          username: user.username
                        })}
                        className="p-1 bg-red-100 hover:bg-red-200 rounded-full"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-gray-400 mb-1" />
                      <p className="text-gray-500 font-medium text-sm">No se encontraron usuarios</p>
                      <p className="text-gray-400 text-xs">Intenta ajustar los filtros o términos de búsqueda</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-2 flex items-center justify-between border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-2 py-1 text-xs rounded border ${
                  currentPage === 1 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-white hover:bg-gray-50 text-gray-700"
                }`}
              >
                Anterior
              </button>
              
              {/* Page numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Logic to show pages around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-6 h-6 flex items-center justify-center rounded text-xs ${
                        currentPage === pageNum
                          ? "bg-indigo-600 text-white"
                          : "bg-white hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-2 py-1 text-xs rounded border ${
                  currentPage === totalPages 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-white hover:bg-gray-50 text-gray-700"
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete.show && (
        <Form method="post" onSubmit={() => {
          setUsers(users.filter(user => user.document_id !== confirmDelete.userId));
          setConfirmDelete({ show: false, userId: null, username: "" });
        }}>
          <input type="hidden" name="user_id" value={confirmDelete.userId} />
          <input type="hidden" name="_action" value="delete" />
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white max-w-sm w-full p-4 rounded-md shadow-lg">
              <div className="flex items-center text-red-600 mb-3">
                <AlertCircle className="h-5 w-5 mr-2" />
                <h3 className="text-base font-medium text-gray-900">Confirmar eliminación</h3>
              </div>
              <p className="mb-4 text-sm text-gray-700">
                ¿Estás seguro de que deseas eliminar al usuario <span className="font-medium text-gray-900">{confirmDelete.username}</span>? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete({ show: false, userId: null, username: "" })}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </Form>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUserUpdate={(updatedUsers) => setUsers(updatedUsers)}
          token={token}
        />
      )}
    </div>
  );
}