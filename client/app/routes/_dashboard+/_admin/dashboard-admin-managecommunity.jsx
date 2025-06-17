import React, { useState, useEffect } from "react";
import { Form, useSubmit, useFetcher } from "@remix-run/react";
import { 
  ChevronDown, 
  ChevronUp, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  X, 
  AlertCircle, 
  Users, 
  Home, 
  Filter,
  Globe,
  Shield,
  Info,
  ListChecks,
  CheckCircle,
  XCircle,
  Coins,
  Clock,
  MessageCircle
} from "lucide-react";
import CreateCommunityModal from "./_communitymodals/dashboard-admin-createmodal";
import EditCommunityModal from "./_communitymodals/dashboard-admin-editmodal";
import MembersModal from "./_communitymodals/dashboard-admin-membersmodal";
import DeleteCommunityModal from "./_communitymodals/dashboard-admin-deletemodal";
import PendingTransactionsModal from "./_communitymodals/dashboard-admin-pendingtransactionsmodal";
import AdminCommunityChat from "./_communitymodals/dashboard-admin-chat";

export default function ManageCommunities({ communities: initialCommunities = [], totalMembers = 0, actionData, isSubmitting, users = [] }) {
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [members, setMembers] = useState({});
  const [isLoading, setIsLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ visibility: 'all' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [currentCommunity, setCurrentCommunity] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [communities, setCommunities] = useState(initialCommunities);
  const [view, setView] = useState('communities'); // 'communities' or 'pending'
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [isTransactionsModalOpen, setTransactionsModalOpen] = useState(false);
  
  // **ARREGLADO: Estado para chat de comunidad con mejor control**
  const [showCommunityChat, setShowCommunityChat] = useState(false);
  const [selectedCommunityForChat, setSelectedCommunityForChat] = useState(null);

  const itemsPerPage = 12;
  const isMobileView = windowWidth < 640;
  const submit = useSubmit();
  const fetcher = useFetcher();
  const transactionFetcher = useFetcher(); // Add the missing transactionFetcher

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (actionData?.members && actionData?.communityId) {
      setMembers(prev => ({ 
        ...prev, 
        [actionData.communityId]: actionData.members 
      }));
      setIsLoading(prev => ({ ...prev, [actionData.communityId]: false }));
    }
  }, [actionData]);

  useEffect(() => {
    setCommunities(initialCommunities);
  }, [initialCommunities]);

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
        timeZone: 'UTC' // Ensure we're interpreting the date as UTC
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Error en formato";
    }
  };

  // Update this method to update local state instead of refreshing the page
  const toggleVisibility = (community) => {
    const formData = new FormData();
    formData.append("_action", "updateVisibility");
    formData.append("community_id", community.id);
    formData.append("visibility", community.visibility === 1 ? 0 : 1);
    
    // Update local state first for immediate feedback
    const updatedCommunities = communities.map(c => 
      c.id === community.id ? { ...c, visibility: c.visibility === 1 ? 0 : 1 } : c
    );
    setCommunities(updatedCommunities); // Assuming you add a state for communities
    
    // Then submit the form
    submit(formData, { method: "post" });
  };

  const handleEdit = (community) => {
    setCurrentCommunity(community);
    setShowEditModal(true);
  };

  const handleDelete = (community) => {
    setCurrentCommunity(community);
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = (communityId) => {
    const formData = new FormData();
    formData.append("_action", "delete");
    formData.append("community_id", communityId);
    
    // Update local state first
    const updatedCommunities = communities.filter(c => c.id !== communityId);
    setCommunities(updatedCommunities);
    
    // Check if we need to go back to previous page
    const updatedFilteredCommunities = filteredCommunities.filter(c => c.id !== communityId);
    const updatedTotalPages = Math.ceil(updatedFilteredCommunities.length / itemsPerPage);
    
    // If we're on a page that no longer exists after deletion, go to the last available page
    if (currentPage > updatedTotalPages && updatedTotalPages > 0) {
      setCurrentPage(updatedTotalPages);
    }
    
    // Then submit to server
    submit(formData, { method: "post" });
    setConfirmDelete(false);
  };

  // Check if we have received member data from an action
  useEffect(() => {
    if (actionData?.members && actionData?.communityId) {
      setCommunityMembers(actionData.members);
      // If we have a selected community and it matches the community ID from the action data
      if (selectedCommunity && selectedCommunity.id === parseInt(actionData.communityId)) {
        setIsMembersModalOpen(true);
      }
    }
    
    // Handle member kicked successfully
    if (actionData?.success && actionData?.kickedMemberId) {
      // If members were returned from the action, use those
      if (actionData.members) {
        setCommunityMembers(actionData.members);
      } else {
        // Otherwise remove the kicked member from the local state
        setCommunityMembers(prevMembers => 
          prevMembers.filter(member => member.user_id !== parseInt(actionData.kickedMemberId))
        );
      }
    }
  }, [actionData, selectedCommunity]);

  const handleViewMembers = (community) => {
    setSelectedCommunity(community);
    setLoadingMembers(true);
    
    // Use fetcher to get community members without a full navigation
    fetcher.submit(
      { 
        _action: "getMembers",
        communityId: community.id
      },
      { method: "post" }
    );
    
    setIsMembersModalOpen(true);
  };
  
  // **ARREGLADO: Función para abrir chat de comunidad con datos correctos**
  const handleOpenCommunityChat = (community) => {
    // **FORZAR cierre del chat anterior si está abierto**
    if (showCommunityChat) {
      setShowCommunityChat(false);
      setSelectedCommunityForChat(null);
      
      // Pequeño delay para asegurar limpieza completa
      setTimeout(() => {
        setSelectedCommunityForChat(community);
        setShowCommunityChat(true);
      }, 100);
    } else {
      setSelectedCommunityForChat(community);
      setShowCommunityChat(true);
    }
  };

  // **ARREGLADO: Función mejorada para cerrar chat**
  const handleCloseCommunityChat = () => {
    setShowCommunityChat(false);
    
    // **DELAY para asegurar que el WebSocket se cierre antes de limpiar el estado**
    setTimeout(() => {
      setSelectedCommunityForChat(null);
    }, 200);
  };

  // Replace the existing useEffect that watches fetcher with a more comprehensive one
  // that handles both member data and pending transactions
  useEffect(() => {
    // Check if fetcher is loading
    if (fetcher.state === "submitting" || fetcher.state === "loading") {
      // Determine what we're loading based on the form data
      const formData = fetcher.submission?.formData;
      if (formData) {
        const action = formData.get('_action');
        if (action === 'getMembers') {
          setLoadingMembers(true);
        } else if (action === 'getPendingTransactions') {
          setLoadingTransactions(true);
        }
      }
    } else if (fetcher.data) {
      // Handle fetcher completion with data
      setLoadingMembers(false);
      setLoadingTransactions(false);
      
      // If we got members data
      if (fetcher.data.members) {
        setCommunityMembers(fetcher.data.members);
      }
      
      // If we got transaction data
      if (fetcher.data.pendingTransactions) {
        console.log("Pending transactions received:", fetcher.data.pendingTransactions);
        setPendingTransactions(fetcher.data.pendingTransactions);
      }
    }
  }, [fetcher]);

  const handleRemoveMember = (userId) => {
    fetcher.submit(
      {
        _action: "kickMember",
        communityId: selectedCommunity.id,
        userId: userId
      },
      { method: "post" }
    );
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

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

  const filteredCommunities = sortedCommunities.filter(community => {
    const matchesSearch = 
      (community.name && community.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (community.about && community.about.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilters = (
      filters.visibility === 'all' || 
      community.visibility === parseInt(filters.visibility)
    );

    return matchesSearch && matchesFilters;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredCommunities.length / itemsPerPage);
  
  // Ensure currentPage is valid
  useEffect(() => {
    // If current page is greater than total pages and total pages isn't zero
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);
  
  // Get the paginated communities
  const paginatedCommunities = filteredCommunities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeCommunities = communities.filter(c => c.visibility === 1).length;
  const inactiveCommunities = communities.filter(c => c.visibility === 0).length;
  
  const resetFilters = () => {
    setFilters({ visibility: 'all' });
    setSearchTerm("");
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp className="w-3 h-3" /> : 
      <ChevronDown className="w-3 h-3" />;
  };

  const columns = [
    ['name', 'Nombre'],
    ['about', 'Descripción'],
    ['created_at', 'Creado'],
    ['updated_at', 'Actualizado'],
    ['visibility', 'Estado'],
    ['acciones', 'Acciones']
  ];

  // Helper function to create toast notifications - use parent component's showToast if available
  const showToast = (message, type) => {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  };

  // Effect to handle pending transactions from actionData
  useEffect(() => {
    if (actionData?.pendingTransactions) {
      setPendingTransactions(actionData.pendingTransactions);
      setShowPendingModal(true);
      setLoadingTransactions(false);
    }
    
    // Update transaction processing status ONLY if we have a success response
    if (actionData?.success && actionData?.transactionId) {
      // Only remove the transaction if the action was successful
      setTimeout(() => {
        setPendingTransactions(prev => 
          prev.filter(t => t.id !== parseInt(actionData.transactionId))
        );
        
        // Show a temporary success message
        showToast(actionData.message || "Transacción procesada correctamente", "success");
      }, 1000); // Small delay for better UX
    } else if (actionData?.error && actionData?._action?.includes("Transaction")) {
      // For error cases, remove the processing state but keep the transaction
      setPendingTransactions(prev => 
        prev.map(t => t.id === parseInt(actionData?.transactionId || 0) ? {...t, processing: false} : t)
      );
      
      // Show error message
      showToast(actionData.error || "Error al procesar la transacción", "error");
    }
  }, [actionData]);

  // Function to request pending transactions using Remix patterns
  const openPendingTransactions = () => {
    // Open the modal first so the user sees something is happening
    setShowPendingModal(true);
    
    // Clear any previous transactions during the new request
    setPendingTransactions([]);
    setLoadingTransactions(true);
    
    // Submit the request via fetcher
    fetcher.submit(
      { _action: "getPendingTransactions" },
      { method: "post" }
    );
  };
  
  // Simplify the handleTransactionAction function
  const handleTransactionAction = (transactionId, userId, communityId, points, action) => {
    // Mark the transaction as processing locally to prevent multiple submissions
    setPendingTransactions(prev => 
      prev.map(t => t.id === transactionId ? { ...t, processing: true } : t)
    );
    
    // Create a form submission with the appropriate action
    const formData = new FormData();
    formData.append('_action', action === 'approve' ? 'approveTransaction' : 'rejectTransaction');
    formData.append('transactionId', transactionId);
    
    // Add userId for both approve and reject (needed for notifications)
    if (userId) {
      formData.append('userId', userId);
    }
    
    // Only add these fields for approval
    if (action === 'approve') {
      formData.append('communityId', communityId);
      formData.append('points', points);
    }
    
    // Submit using the Remix submit function
    submit(formData, { method: 'post' });
  };

  // Fetch pending transactions when needed
  const fetchPendingTransactions = () => {
    setLoadingTransactions(true);
    transactionFetcher.submit(
      { _action: "getPendingTransactions" },
      { method: "post" }
    );
  };
  
  // Update transactions when fetcher returns data
  useEffect(() => {
    if (transactionFetcher.data && transactionFetcher.state === "idle") {
      if (transactionFetcher.data.pendingTransactions) {
        setPendingTransactions(transactionFetcher.data.pendingTransactions);
      }
      setLoadingTransactions(false);
    }
  }, [transactionFetcher.data, transactionFetcher.state]);
  
  // Open transactions modal and fetch data
  const handleOpenTransactionsModal = () => {
    setTransactionsModalOpen(true);
    fetchPendingTransactions();
  };
  
  // Handle transactions modal close
  const handleCloseTransactionsModal = () => {
    setTransactionsModalOpen(false);
  };
  
  // Add a stats card for pending transactions
  const renderStatsCards = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Existing stats cards... */}
        
        {/* New stats card for pending transactions */}
        <div 
          className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={handleOpenTransactionsModal}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-amber-800">Solicitudes Pendientes</h3>
            <div className="bg-amber-200 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-amber-700" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline">
              {loadingTransactions ? (
                <div className="h-8 w-16 bg-amber-200/50 animate-pulse rounded"></div>
              ) : (
                <span className="text-2xl font-bold text-amber-900">
                  {pendingTransactions.length}
                </span>
              )}
              <span className="ml-2 text-sm text-amber-700">solicitudes</span>
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Solicitudes de usuarios para unirse a comunidades
            </p>
          </div>
        </div>
      </div>
    )
  };
  
  return (
    <div className="space-y-6 relative z-0">
      {/* Header and Stats - lower z-index */}
      <div className="relative z-0">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Administrar Comunidades</h1>
            <p className="text-sm text-gray-600">Gestiona las comunidades registradas en la plataforma</p>
          </div>
          <button 
            onClick={openPendingTransactions}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ListChecks className="h-4 w-4" />
            <span className="font-medium">Ver solicitudes pendientes</span>
          </button>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white p-3 rounded-md shadow-sm border-l-4 border-indigo-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Total de comunidades</p>
                <p className="text-lg font-bold text-gray-900">{communities.length}</p>
              </div>
              <Home className="h-6 w-6 text-indigo-500" />
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-md shadow-sm border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Comunidades activas</p>
                <p className="text-lg font-bold text-gray-900">{activeCommunities}</p>
              </div>
              <Eye className="h-6 w-6 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-md shadow-sm border-l-4 border-gray-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Comunidades inactivas</p>
                <p className="text-lg font-bold text-gray-900">{inactiveCommunities}</p>
              </div>
              <EyeOff className="h-5 w-5 text-gray-500" />
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-md shadow-sm border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Total de miembros</p>
                <p className="text-lg font-bold text-gray-900">{totalMembers || 0}</p>
              </div>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters - lower z-index */}
      <div className="bg-white rounded-lg shadow-sm relative z-0">
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
            
            <div className="flex gap-2 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-start">
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
              
            
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5"
              >
                <Globe className="h-4 w-4" />
                <span>Crear</span>
              </button>
            </div>
            
            {Object.values(filters).some(val => val !== 'all') && (
              <button 
                onClick={resetFilters}
                className="text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1 mt-2 sm:mt-0"
              >
                <X className="h-3 w-3" /> Limpiar
              </button>
            )}
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Visibilidad</label>
                <select
                  className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.visibility}
                  onChange={(e) => setFilters({...filters, visibility: e.target.value})}
                >
                  <option value="all">Toda visibilidad</option>
                  <option value="1">Activas</option>
                  <option value="0">Inactivas</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Community Count and Results - lower z-index */}
      <div className="flex justify-between items-center relative z-0">
        <p className="text-xs text-gray-500">
          Mostrando {paginatedCommunities.length} de {filteredCommunities.length} comunidades
        </p>
      </div>

      {/* Responsive Content - lower z-index */}
      <div className="relative z-0">
        {!isMobileView ? (
          /* Table View for Desktop/Tablet */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map(([key, label]) => (
                      <th
                        key={key}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => key !== 'acciones' && key !== 'visibility' && handleSort(key)}
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          {key !== 'acciones' && key !== 'visibility' && <SortIcon column={key} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCommunities.length > 0 ? (
                    paginatedCommunities.map((community) => (
                      <tr key={community.id} className="hover:bg-gray-50 text-sm">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900 font-medium">
                          {community.name || "No especificado"}
                        </td>
                        <td className="px-4 py-2 text-gray-700 max-w-xs truncate">
                          {community.about || "No especificado"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                          {formatDate(community.created_at)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                          {formatDate(community.updated_at)}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            community.visibility === 1 
                              ? "bg-indigo-100 text-indigo-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {community.visibility === 1 ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-700 flex items-center gap-2">
                          <button 
                            onClick={() => handleViewMembers(community)}
                            className="p-1 bg-gray-100 hover:bg-gray-200 rounded-full"
                            aria-label="Ver miembros"
                          >
                            <Info className="h-3.5 w-3.5 text-gray-600" />
                          </button>
                          {/* **NUEVO: Botón de chat** */}
                          <button 
                            onClick={() => handleOpenCommunityChat(community)}
                            className="p-1 bg-green-100 hover:bg-green-200 rounded-full"
                            aria-label="Chat de comunidad"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                          </button>
                          <button 
                            onClick={() => handleEdit(community)}
                            className="p-1 bg-blue-100 hover:bg-blue-200 rounded-full"
                            aria-label="Editar comunidad"
                          >
                            <Pencil className="h-3.5 w-3.5 text-blue-600" />
                          </button>
                          <button 
                            onClick={() => toggleVisibility(community)}
                            className={`p-1 rounded-full ${
                              community.visibility === 1 
                                ? "bg-green-100 hover:bg-green-200" 
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                            aria-label={community.visibility === 1 ? "Desactivar comunidad" : "Activar comunidad"}
                          >
                            {community.visibility === 1 ? (
                              <Eye className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                            )}
                          </button>
                          <button 
                            onClick={() => handleDelete(community)}
                            className="p-1 bg-red-100 hover:bg-red-200 rounded-full"
                            aria-label="Eliminar comunidad"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-gray-400 mb-1" />
                          <p className="text-gray-500 font-medium text-sm">No se encontraron comunidades</p>
                          <p className="text-gray-400 text-xs">Intenta ajustar los filtros o términos de búsqueda</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card View for Mobile */
          <div className="grid grid-cols-1 gap-4">
            {paginatedCommunities.length > 0 ? (
              paginatedCommunities.map((community) => (
                <div key={community.id} className="bg-white rounded-lg shadow-sm">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{community.name || "No especificado"}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{community.about || "No especificado"}</p>
                      </div>
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          community.visibility === 1 
                            ? "bg-indigo-100 text-indigo-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {community.visibility === 1 ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Creado</p>
                        <p className="font-medium text-gray-900">{formatDate(community.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Actualizado</p>
                        <p className="font-medium text-gray-900">{formatDate(community.updated_at)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                      <button 
                        onClick={() => handleViewMembers(community)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                      >
                        <Info className="h-3 w-3" />
                        <span>Ver miembros</span>
                      </button>
                      
                      <div className="flex items-center gap-2">
                        {/* **NUEVO: Botón de chat para móvil** */}
                        <button 
                          onClick={() => handleOpenCommunityChat(community)}
                          className="p-1 bg-green-100 hover:bg-green-200 rounded-full"
                          aria-label="Chat de comunidad"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                        </button>
                        <button 
                          onClick={() => handleEdit(community)}
                          className="p-1 bg-blue-100 hover:bg-blue-200 rounded-full"
                          aria-label="Editar comunidad"
                        >
                          <Pencil className="h-3.5 w-3.5 text-blue-600" />
                        </button>
                        <button 
                          onClick={() => toggleVisibility(community)}
                          className={`p-1 rounded-full ${
                            community.visibility === 1 
                              ? "bg-green-100 hover:bg-green-200" 
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                          aria-label={community.visibility === 1 ? "Desactivar comunidad" : "Activar comunidad"}
                        >
                          {community.visibility === 1 ? (
                            <Eye className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                          )}
                        </button>
                        <button 
                          onClick={() => handleDelete(community)}
                          className="p-1 bg-red-100 hover:bg-red-200 rounded-full"
                          aria-label="Eliminar comunidad"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">No se encontraron comunidades</p>
                <p className="text-gray-500 text-sm mt-1">Ajusta los filtros o términos de búsqueda</p>
              </div>
            )}
          </div>
        )}
      </div>
    
      {/* Pagination - lower z-index */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 relative z-0">
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
                if (index === 0) {
                  return (
                    <React.Fragment key={page}>
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center justify-center ${
                          currentPage === page 
                            ? "bg-indigo-600 text-white shadow-md" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                      
                      {array.length > 2 && page !== array[array.length - 1] && (
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
                            ? "bg-indigo-600 text-white shadow-md" 
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
                        ? "bg-indigo-600 text-white shadow-md" 
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

      {/* Modals - high z-index but below sidebar */}
      <CreateCommunityModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        actionData={actionData}
      />
      
      <EditCommunityModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        community={currentCommunity}
        actionData={actionData}
      />
      
      {selectedCommunity && (
        <MembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          community={selectedCommunity}
          members={communityMembers}
          isLoading={loadingMembers}
          onRemoveMember={handleRemoveMember}
          allUsers={users}
        />
      )}

      <DeleteCommunityModal
        isOpen={confirmDelete} 
        onClose={() => setConfirmDelete(false)}
        community={currentCommunity}
        onDelete={handleDeleteConfirm}
      />
      
      {/* Pending Transactions Modal */}
      <PendingTransactionsModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        transactions={pendingTransactions}
        isLoading={loadingTransactions}
        onApprove={(id, userId, communityId, points) => 
          handleTransactionAction(id, userId, communityId, points, 'approve')}
        onReject={(id, userId) => handleTransactionAction(id, userId, null, null, 'reject')}
      />

      {/* **ARREGLADO: Chat de Comunidad Modal con datos correctos** */}
      <AdminCommunityChat
        isOpen={showCommunityChat}
        onClose={handleCloseCommunityChat}
        userData={{
          // **ARREGLADO: Usar el document_id correcto del admin actual**
          document_id: actionData?.userDocumentId || users?.find(u => u.role === 1)?.document_id || 1,
          username: actionData?.username || "Admin"
        }}
        token={actionData?.token || ""} 
        selectedCommunity={selectedCommunityForChat}
        isDashboardLoaded={true}
        // **NUEVO: Key para forzar recreación del componente**
        key={selectedCommunityForChat?.id || 'no-community'}
      />
    </div>
  );
}