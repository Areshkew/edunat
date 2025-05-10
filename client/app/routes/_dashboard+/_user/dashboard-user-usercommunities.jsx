import React, { useState, useEffect } from "react";
import { Form, useSubmit, Link } from "@remix-run/react";
import { 
  Users, 
  Search, 
  X, 
  AlertCircle, 
  LogOut,
  Eye,
  Globe,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  BarChart
} from "lucide-react";

export default function UserCommunities({ communities = [], isSubmitting, showToast, stats = null }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [showConfirmLeaveModal, setShowConfirmLeaveModal] = useState(false);
  const [communityToLeave, setCommunityToLeave] = useState(null);
  
  const itemsPerPage = 8;
  const isMobileView = windowWidth < 640;
  const submit = useSubmit();

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "No especificado";
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      // Using the more readable format to match community details
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC' // Ensure consistent timezone handling
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Error en formato";
    }
  };

  // Función para mostrar modal de confirmación al abandonar
  const handleLeaveRequest = (community) => {
    setCommunityToLeave(community);
    setShowConfirmLeaveModal(true);
  };

  // Función para ejecutar la acción de abandonar cuando se confirma
  const confirmLeave = () => {
    if (communityToLeave) {
      const formData = new FormData();
      formData.append("_action", "leaveCommunitiy");
      formData.append("communityId", communityToLeave.id);
      
      submit(formData, { method: "post" });
      
      // Cerrar el modal y limpiar el estado
      setShowConfirmLeaveModal(false);
      setCommunityToLeave(null);
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to communities
  const sortedCommunities = [...communities].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Apply search filter to sorted communities
  const filteredCommunities = sortedCommunities.filter(community => {
    return (
      (community.name && community.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (community.about && community.about.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredCommunities.length / itemsPerPage);
  
  // Ensure currentPage is valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);
  
  // Get paginated communities
  const paginatedCommunities = filteredCommunities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp className="w-3 h-3" /> : 
      <ChevronDown className="w-3 h-3" />;
  };

  // Modal de confirmación para abandonar comunidad
  const ConfirmLeaveModal = () => {
    if (!communityToLeave) return null;
    
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
                ¿Estás seguro de que deseas abandonar la comunidad <span className="font-medium">{communityToLeave.name}</span>? 
                Esta acción no se puede deshacer.
              </p>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowConfirmLeaveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLeave}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Procesando..." : "Sí, abandonar comunidad"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (communities.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-medium text-gray-700 mb-2">No perteneces a ninguna comunidad</h2>
        <p className="text-gray-500">Busca y únete a comunidades para comenzar a aprender y compartir.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-4">
      {/* Statistics section - with reduced spacing */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">Mis estadísticas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Communities */}
          <div className="bg-blue-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Comunidades</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalCommunities || 0}
                </p>
              </div>
              <div className="bg-blue-100 h-14 w-14 rounded-full flex items-center justify-center">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </div>
          
          {/* Newest Community */}
          <div className="bg-green-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Comunidad más reciente</p>
                <p className="text-xl font-bold text-gray-900 truncate">
                  {stats?.mostRecentCommunity?.name || "N/A"}
                </p>
                {stats?.mostRecentCommunity && (
                  <p className="text-xs text-green-700">
                    Creada el {formatDate(stats.mostRecentCommunity.created_at)}
                  </p>
                )}
              </div>
              <div className="bg-green-100 h-14 w-14 rounded-full flex items-center justify-center">
                <Clock className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </div>
          
          {/* Oldest Community */}
          <div className="bg-amber-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Comunidad más antigua</p>
                <p className="text-xl font-bold text-gray-900 truncate">
                  {stats?.oldestCommunity?.name || "N/A"}
                </p>
                {stats?.oldestCommunity && (
                  <p className="text-xs text-amber-700">
                    Creada el {formatDate(stats.oldestCommunity.created_at)}
                  </p>
                )}
              </div>
              <div className="bg-amber-100 h-14 w-14 rounded-full flex items-center justify-center">
                <Clock className="h-7 w-7 text-amber-600" />
              </div>
            </div>
          </div>
          
          {/* Largest Community */}
          <div className="bg-purple-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Mayor comunidad</p>
                <p className="text-xl font-bold text-gray-900 truncate">
                  {stats?.largestCommunity?.name || "N/A"}
                </p>
                {stats?.largestCommunity && (
                  <p className="text-xs text-purple-700 font-medium">
                    {stats.largestCommunity.members || 0} miembros
                  </p>
                )}
              </div>
              <div className="bg-purple-100 h-14 w-14 rounded-full flex items-center justify-center">
                <BarChart className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header with tighter alignment - put button next to title */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-2 bg-white rounded-lg shadow-sm p-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-0">Mis Comunidades</h1>
          <p className="text-sm text-gray-600">Consulta las comunidades a las que perteneces</p>
        </div>
        
        {/* Button positioned next to title */}
        <div className="mt-2 sm:mt-0">
          <Link 
            to="/dashboard/search-communities"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
          >
            <Globe className="mr-1.5 h-4 w-4" />
            Buscar comunidades
          </Link>
        </div>
      </div>

      {/* Search bar - move up closer to the header */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar comunidades por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-1 text-sm text-gray-500">
            Mostrando {filteredCommunities.length} de {communities.length} comunidades
          </div>
        )}
      </div>

      {/* Communities display - less margin between elements */}
      <div>
        {communities.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No perteneces a ninguna comunidad</h3>
            <p className="text-gray-500 mb-4">Explora y únete a comunidades para verlas aquí</p>
            <Link 
              to="/dashboard/search-communities"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              <Globe className="mr-1.5 h-4 w-4" />
              Buscar comunidades
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {paginatedCommunities.map((community) => (
              <div 
                key={community.id} 
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate flex-grow">{community.name}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center ml-2 flex-shrink-0">
                      <Users className="h-3 w-3 mr-1" />
                      {community.members || 0}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2 min-h-[36px]">
                    {community.about || "No hay descripción disponible"}
                  </p>
                  
                  <div className="mt-auto pt-2 flex justify-center border-t border-gray-100">
                    <Link 
                      to={`/dashboard/community/${community.id}`}
                      className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Eye className="h-4 w-4 mr-1.5" /> 
                      Ver detalles
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Pagination with slightly less margin */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-md ${
                currentPage === 1 
                  ? "text-gray-400 bg-gray-100" 
                  : "text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              <ChevronUp className="h-4 w-4 rotate-90" />
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, index, array) => {
                // Logic for showing page numbers with ellipsis
                if (index === 0) {
                  return (
                    <React.Fragment key={page}>
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center justify-center ${
                          currentPage === page 
                            ? "bg-indigo-600 text-white shadow-sm" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                      
                      {array.length > 1 && page !== array[array.length - 1] && array[1] !== page + 1 && (
                        <span className="text-gray-400 mx-1">...</span>
                      )}
                    </React.Fragment>
                  );
                }
                
                if (index === array.length - 1 && page !== array[0]) {
                  return (
                    <React.Fragment key={page}>
                      {page - array[index - 1] > 1 && (
                        <span className="text-gray-400 mx-1">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center justify-center ${
                          currentPage === page 
                            ? "bg-indigo-600 text-white shadow-sm" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center justify-center ${
                      currentPage === page 
                        ? "bg-indigo-600 text-white shadow-sm" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 flex items-center justify-center rounded-md ${
                currentPage === totalPages 
                  ? "text-gray-400 bg-gray-100" 
                  : "text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              <ChevronUp className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm leave modal */}
      {showConfirmLeaveModal && <ConfirmLeaveModal />}
    </div>
  );
}
