import React, { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useActionData, useNavigation } from "@remix-run/react";
import { getSession } from "../../utils/session.server";
import { Search, Users, Shield, Globe, AlertCircle, ChevronDown, ChevronUp, X, CheckCircle, Clock, Check } from "lucide-react";
import JoinCommunityModal from "../_dashboard+/_user/_searchcommunitiesmodals/dashboard-user-joincommunitymodal";

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");

  try {
    // Fetch all communities
    const communitiesResponse = await fetch('http://localhost:8000/api/community/list', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!communitiesResponse.ok) throw new Error('Error al obtener comunidades');
    const communitiesData = await communitiesResponse.json();
    
    // Fetch user's communities
    const userCommunitiesResponse = await fetch('http://localhost:8000/api/community/user/communities', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    let userCommunities = [];
    if (userCommunitiesResponse.ok) {
      const userCommunitiesData = await userCommunitiesResponse.json();
      userCommunities = userCommunitiesData.data || [];
    }
    
    // Fetch user's pending community transactions
    const pendingTransactionsResponse = await fetch('http://localhost:8000/api/transaction/user/pending/community', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    let pendingTransactions = [];
    if (pendingTransactionsResponse.ok) {
      const pendingTransactionsData = await pendingTransactionsResponse.json();
      pendingTransactions = pendingTransactionsData.data || [];
    }
    
    // Filter out communities with visibility=0 (hidden)
    const visibleCommunities = communitiesData.data ? communitiesData.data.filter(community => community.visibility !== 0) : [];
    
    return json({ 
      communities: visibleCommunities,
      userCommunities: userCommunities,
      pendingTransactions: pendingTransactions
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return json({ communities: [], userCommunities: [], pendingTransactions: [], error: error.message });
  }
}

export async function action({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const formData = await request.formData();

  const actionType = formData.get("_action");
  
  if (actionType === "requestJoin") {
    const communityId = formData.get("communityId");
    const points = formData.get("points");
    const reason = formData.get("reason");
    
    try {
      // Updated request body - simplifying the details to only send the user's reason
      const requestBody = {
        points: parseInt(points),
        destination: communityId,
        details: reason // Plain text reason without wrapping it in JSON
      };
      
      const response = await fetch('http://localhost:8000/api/transaction/create/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        return json({
          success: false,
          message: errorData.detail || "Error al enviar la solicitud"
        }, { status: response.status });
      }
      
      const data = await response.json();
      return json({
        success: true,
        message: "Solicitud enviada correctamente, en espera de aprobación"
      });
    } catch (error) {
      console.error("Error in join request:", error);
      return json({
        success: false,
        message: error.message || "Error al procesar la solicitud"
      }, { status: 500 });
    }
  }

  return null;
}

export default function SearchCommunities() {
  const { communities, userCommunities, pendingTransactions } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const fetcher = useFetcher();
  const actionData = useActionData();
  const navigation = useNavigation();
  
  // Toast notification state
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  
  // Show toast notifications for operations
  useEffect(() => {
    if (fetcher.data?.success && fetcher.state === "idle") {
      showToast(fetcher.data.message || "Operación completada con éxito", "success");
    } 
    else if (fetcher.data?.success === false && fetcher.state === "idle") {
      showToast(fetcher.data.message || "Error en la operación", "error");
    }
    
    // Also check actionData for direct form submissions
    if (actionData && navigation.state === "idle") {
      if (actionData.success) {
        showToast(actionData.message || "Operación completada con éxito", "success");
      } else if (actionData?.error) {
        showToast(actionData.error, "error");
      }
    }
  }, [fetcher.data, fetcher.state, actionData, navigation.state]);
  
  // Show toast function
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Items per page
  const itemsPerPage = 8;

  // Helper function to check if user is a member of a community
  const isUserMember = (communityId) => {
    return userCommunities.some(community => community.id === communityId);
  };

  // Helper function to check if user has a pending transaction for a community
  const hasPendingTransaction = (communityId) => {
    return pendingTransactions.some(transaction => {
      // If the destination is already a number, compare directly
      if (typeof transaction.destination === 'number') {
        return transaction.destination === communityId;
      }
      // Otherwise try to convert the destination to a number for comparison
      return Number(transaction.destination) === communityId;
    });
  };

  // Sort communities based on current sort settings
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

  // Filter communities based on search term
  const filteredCommunities = sortedCommunities.filter(community => {
    const matchesSearch = 
      (community.name && community.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch && community.visibility === 1; // Only show active communities
  });

  // Calculate pagination values
  const totalPages = Math.ceil(filteredCommunities.length / itemsPerPage);
  
  // Get the paginated communities
  const paginatedCommunities = filteredCommunities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleJoinRequest = (community) => {
    setSelectedCommunity(community);
    setShowModal(true);
  };

  const submitJoinRequest = (points, reason) => {
    fetcher.submit(
      {
        _action: "requestJoin",
        communityId: selectedCommunity.id,
        points: points,
        reason: reason
      },
      { method: "post" }
    );
    setShowModal(false);
  };

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return "No especificado";
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
      }).format(date);
    } catch (error) {
      return "Error en formato";
    }
  };

  // Sort icon component
  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp className="w-3 h-3" /> : 
      <ChevronDown className="w-3 h-3" />;
  };

  // Check if there was an error loading communities
  const hasError = communities.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Buscar Comunidades</h1>
        <p className="text-sm text-gray-600 mb-6">Explora las comunidades disponibles y solicita unirte</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-3">
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
            <div className="relative flex-1 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar comunidades..."
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
          </div>
        </div>
      </div>

      {/* Communities Count */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">
          Mostrando {paginatedCommunities.length} de {filteredCommunities.length} comunidades
        </p>
      </div>

      {/* Display Communities as Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {hasError ? (
          <div className="col-span-full bg-red-50 p-6 rounded-lg shadow-sm text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Error al cargar comunidades</p>
            <p className="text-red-500 text-sm mt-1">Por favor, intenta nuevamente más tarde</p>
          </div>
        ) : paginatedCommunities.length > 0 ? (
          paginatedCommunities.map((community) => (
            <div key={community.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{community.name || "Sin nombre"}</h3>
                  </div>
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 text-indigo-500 mr-1" />
                    <span className="text-xs text-gray-500">Comunidad</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{community.about || "Sin descripción"}</p>
                
                <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
                  <span>Creada: {formatDate(community.created_at)}</span>
                  <div className="flex items-center">
                    <Users className="h-3.5 w-3.5 text-gray-400 mr-1" />
                    <span>Miembros: {typeof community.members === 'number' ? community.members : (community.members ? community.members.length : 0)}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                  {isUserMember(community.id) ? (
                    <button 
                      disabled
                      className="w-full bg-green-100 text-green-800 px-3 py-1.5 text-sm rounded-md flex items-center justify-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Ya eres miembro</span>
                    </button>
                  ) : hasPendingTransaction(community.id) ? (
                    <button 
                      disabled
                      className="w-full bg-yellow-100 text-yellow-800 px-3 py-1.5 text-sm rounded-md flex items-center justify-center gap-1.5"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Pendiente de aceptación</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleJoinRequest(community)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-sm rounded-md transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span>Solicitar unirse</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-6 rounded-lg shadow-sm text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">No se encontraron comunidades</p>
            <p className="text-gray-500 text-sm mt-1">Intenta ajustar los términos de búsqueda</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
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
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, index, array) => {
                // Add ellipsis between non-consecutive page numbers
                if (index > 0 && page - array[index - 1] > 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <span className="w-8 h-8 flex items-center justify-center text-gray-400">...</span>
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${
                          currentPage === page
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
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
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
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
              <ChevronDown className="h-4 w-4 rotate-90" />
            </button>
          </div>
        </div>
      )}

      {/* Join Community Modal */}
      {showModal && selectedCommunity && (
        <JoinCommunityModal
          community={selectedCommunity}
          onClose={() => setShowModal(false)}
          onSubmit={submitJoinRequest}
          isSubmitting={fetcher.state === "submitting"}
        />
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
    </div>
  );
}
