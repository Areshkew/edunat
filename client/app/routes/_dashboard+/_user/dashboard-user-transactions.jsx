import React, { useState, useEffect, useMemo } from "react";
import { useSubmit } from "@remix-run/react";
import { 
  BarChart2,
  CheckCircle, 
  XCircle,
  Clock, 
  FileText,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  User,
  Building,
  Calendar,
  Coins,
  ArrowLeft,
  ArrowRight,
  Info,
  AlertCircle,
  Send,
  BellRing
} from "lucide-react";

// Import the modals from the folder
import TransactionDetailsModal from "./_usertransactionsmodals/dashboard-user-transactiondetailsmodal";
import SendPointsModal from "./_usertransactionsmodals/dashboard-user-sendpointsmodal";
import UserPendingTransactionsModal from "./_usertransactionsmodals/dashboard-user-pendingtransactionsmodal";

export default function UserTransactions({ 
  transactions = [], 
  userStats = null, 
  visibleUsers = [], 
  isLoading = false,
  pendingTransactions = [],
  onOpenPendingModal
}) {
  // States for UI interaction
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',  
    type: 'all', 
    dateRange: 'all'
  });
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // States for the modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preselectedUser, setPreselectedUser] = useState(null);
  
  // Check for quick transfer data from sessionStorage
  useEffect(() => {
    try {
      const quickTransferData = sessionStorage.getItem('quickTransfer');
      if (quickTransferData) {
        const parsedData = JSON.parse(quickTransferData);
        console.log('🔄 Found quick transfer data:', parsedData);
        
        // Only process if it's recent (within the last minute)
        const now = new Date().getTime();
        if (parsedData.timestamp && (now - parsedData.timestamp < 60000)) {
          setPreselectedUser(parsedData);
          setIsModalOpen(true);
          
          // Clear the data so it's not processed again
          sessionStorage.removeItem('quickTransfer');
        } else {
          // Clear expired data
          sessionStorage.removeItem('quickTransfer');
        }
      }
    } catch (error) {
      console.error('Error processing quick transfer data:', error);
    }
  }, []);

  // Clear preselectedUser when modal is closed
  // This ensures that when reopening the modal, it doesn't show the previously selected user
  useEffect(() => {
    if (!isModalOpen && preselectedUser) {
      // Only clear after the modal has been closed
      // This gives the modal time to use the preselected user once
      setPreselectedUser(null);
    }
  }, [isModalOpen]);
  
  const itemsPerPage = 10;
  
  // Reset to first page when filters or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);
  
  // Format date strings to local format - Only show date (no time)
  const formatDate = (dateString) => {
    if (!dateString) return "No especificado";
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      // Only show date (no time component)
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

  // Helper function to determine if user is the origin of the transaction
  const isOrigin = (transaction) => {
    return transaction.is_origin === true;
  };
  
  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    // Apply filters
    return transactions.filter(transaction => {
      // Search term filter
      const searchFields = [
        transaction.id?.toString() || '',
        transaction.origin_name || '',
        transaction.destination_name || '',
        transaction.details || ''
      ];
      
      const matchesSearch = searchTerm === '' || 
        searchFields.some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      const matchesStatus = filters.status === 'all' || 
        transaction.status.toString() === filters.status;
      
      // Type filter (sent/received)
      const matchesType = filters.type === 'all' || 
        (filters.type === 'sent' && isOrigin(transaction)) ||
        (filters.type === 'received' && !isOrigin(transaction));
      
      // Date range filter
      let matchesDate = true;
      if (filters.dateRange !== 'all') {
        const today = new Date();
        const transactionDate = new Date(transaction.created_at);
        
        switch(filters.dateRange) {
          case 'today':
            matchesDate = transactionDate.toDateString() === today.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            matchesDate = transactionDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            matchesDate = transactionDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    }).sort((a, b) => {
      if (!sortConfig.key) return 0;
      
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle special cases
      if (sortConfig.key === 'points') {
        aValue = parseInt(a.points) || 0;
        bValue = parseInt(b.points) || 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [transactions, searchTerm, filters, sortConfig]);
  
  // Pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  
  // Sort handler
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      dateRange: 'all'
    });
    setSearchTerm('');
  };
  
  // View transaction details
  const viewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
  };
  
  // Close transaction details modal
  const closeTransactionDetails = () => {
    setSelectedTransaction(null);
  };
  
  // Render sort icon
  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp className="w-3.5 h-3.5" /> : 
      <ChevronDown className="w-3.5 h-3.5" />;
  };

  // Status badge renderer
  const StatusBadge = ({ status }) => {
    if (status === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3.5 h-3.5 mr-1" />
          Aprobada
        </span>
      );
    } else if (status === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Rechazada
        </span>
      );
    } else if (status === 2) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3.5 h-3.5 mr-1" />
          Pendiente Comunidad
        </span>
      );
    } else if (status === 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="w-3.5 h-3.5 mr-1" />
          Pendiente Usuario
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Desconocido
      </span>
    );
  };
  
  // Transaction direction indicator
  const DirectionIndicator = ({ transaction }) => {
    // Para transacciones de comunidad, el usuario siempre envía puntos
    if (transaction.destination_type === 'community' || 
       (transaction.destination && transaction.destination.endsWith('C')) || 
       transaction.status === 2) {
      return (
        <div className="flex items-center text-orange-600">
          <ArrowRight className="h-4 w-4 mr-1" />
          <span className="text-xs">Enviado</span>
        </div>
      );
    }
    
    // Para transacciones entre usuarios, verificar si es origen o destino
    if (isOrigin(transaction)) {
      return (
        <div className="flex items-center text-orange-600">
          <ArrowRight className="h-4 w-4 mr-1" />
          <span className="text-xs">Enviado</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-green-600">
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="text-xs">Recibido</span>
        </div>
      );
    }
  };
  
  // Determine if a transaction is community-related
  const isCommunityTransaction = (transaction) => {
    return transaction.destination_type === 'community' || 
           (transaction.destination && transaction.destination.endsWith('C')) || 
           transaction.status === 2;
  };

  // Get appropriate points display with sign based on transaction type and status
  const getPointsWithSign = (transaction) => {
    // For community transactions
    if (isCommunityTransaction(transaction)) {
      if (transaction.status === 0) { // Approved community transaction
        // User receives points for approved community transactions
        return `+${transaction.points}`;
      } else if (transaction.status === 1) { // Rejected community transaction
        // No change for rejected community transactions
        return transaction.points;
      } else { // Pending community transactions (status 2)
        // Pending community transaction - show potential points
        return `(+${transaction.points})`;
      }
    } else {
      // For user-to-user transactions
      if (transaction.status === 0) { // Approved user transaction
        // If user is origin, they lose points. If destination, they gain points
        return isOrigin(transaction) ? `-${transaction.points}` : `+${transaction.points}`;
      } else if (transaction.status === 1) { // Rejected user transaction
        // No change for rejected user transactions
        return transaction.points;
      } else { // Pending user transactions (status 3)
        // For pending user transactions, show potential points with parentheses
        return isOrigin(transaction) ? `(-${transaction.points})` : `(+${transaction.points})`;
      }
    }
  };
  
  // Determine the display color of points
  const getPointsDisplayColor = (transaction) => {
    // For community transactions
    if (isCommunityTransaction(transaction)) {
      if (transaction.status === 0) { // Approved community transaction
        return "text-green-600"; // Green for received points
      } else if (transaction.status === 1) { // Rejected community transaction
        return "text-gray-600"; // Gray for no change
      } else { // Pending community transaction
        return "text-blue-600"; // Blue for pending
      }
    } else {
      // For user-to-user transactions
      if (transaction.status === 0) { // Approved
        return isOrigin(transaction) ? "text-orange-600" : "text-green-600"; // Orange for sent, Green for received
      } else if (transaction.status === 1) { // Rejected
        return "text-gray-600"; // Gray for no change 
      } else { // Pending
        return isOrigin(transaction) ? "text-amber-600" : "text-blue-600"; // Amber for potentially sending, Blue for potentially receiving
      }
    }
  };
  
  // Effect to handle loading of users
  useEffect(() => {
    setLoadingUsers(Array.isArray(visibleUsers) && visibleUsers.length === 0);
  }, [visibleUsers]);
  
  // Get user's current points from userStats
  const currentUserPoints = useMemo(() => {
    return userStats && typeof userStats.current_balance === 'number' ? userStats.current_balance : 0;
  }, [userStats]);
  
  // Use the submit provided by Remix
  const submit = useSubmit();

  // Handle sending transaction
  const handleSendPointsSubmit = (formData) => {
    setIsSubmitting(true);
    
    // Create FormData for submit
    const submitData = new FormData();
    submitData.append("_action", "createTransaction");
    submitData.append("points", formData.points);
    submitData.append("destination", formData.destination);
    submitData.append("details", formData.details);
    
    // Use Remix submit method
    submit(submitData, { method: "post" });
  };
  
  // Update states when form is completed
  useEffect(() => {
    if (isSubmitting && !isLoading) {
      setIsSubmitting(false);
      
      // Close modal after successful transaction
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
    }
  }, [isLoading, isSubmitting]);

  return (
    <div className="w-full flex-1 space-y-5 pb-10 overflow-x-hidden">
      {/* Header section */}
      <div className="w-full mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mis Transacciones</h1>
            <p className="text-sm text-gray-600 mt-1">
              Historial de tus transacciones de puntos
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* Botón para ver transacciones pendientes de aprobación - SIEMPRE VISIBLE */}
            <button
              onClick={() => {
                if (onOpenPendingModal) {
                  onOpenPendingModal();
                } else {
                  setIsPendingModalOpen(true);
                }
              }}
              className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                pendingTransactions && pendingTransactions.length > 0
                  ? "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 relative"
                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              <Clock className="h-4 w-4 mr-2" />
              Pendientes
              {pendingTransactions && pendingTransactions.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingTransactions.length}
                </span>
              )}
            </button>
            
            {/* Botón para enviar puntos */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Puntos
            </button>
          </div>
        </div>
      </div>
      
      {/* Statistics summary */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          // Skeleton loaders for stats
          <>
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                <div className="h-4 w-1/3 bg-gray-200 rounded mb-3"></div>
                <div className="h-7 w-1/2 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </>
        ) : userStats ? (
          // Actual stats
          <>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
              <h3 className="text-gray-500 text-sm font-medium mb-1">Transacciones Totales</h3>
              <p className="text-2xl font-bold text-gray-900">{userStats.total_transactions || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {userStats.recent_transactions || 0} en los últimos 7 días
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
              <h3 className="text-gray-500 text-sm font-medium mb-1">Puntos Recibidos</h3>
              <p className="text-2xl font-bold text-green-600">+{userStats.points_received || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                En {userStats.transactions_received || 0} transacciones
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
              <h3 className="text-gray-500 text-sm font-medium mb-1">Puntos Enviados</h3>
              <p className="text-2xl font-bold text-orange-600">-{userStats.points_sent || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                En {userStats.transactions_sent || 0} transacciones
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 relative">
              <h3 className="text-gray-500 text-sm font-medium mb-1">Balance Actual</h3>
              <p className="text-2xl font-bold text-blue-600">
                {userStats.current_balance || 0}
              </p>
              
              {/* Botón para ver transacciones pendientes de aprobación */}
              {pendingTransactions && pendingTransactions.length > 0 && (
                <button
                  onClick={() => {
                    if (onOpenPendingModal) {
                      onOpenPendingModal();
                    } else {
                      setIsPendingModalOpen(true);
                    }
                  }}
                  className="mt-1 text-blue-600 text-xs flex items-center hover:underline"
                >
                  <BellRing className="h-3 w-3 mr-1" />
                  {pendingTransactions.length} transacciones por aprobar
                </button>
              )}
              
              {/* Indicador de transacciones pendientes - Corregido para evitar desbordamiento */}
              {pendingTransactions && pendingTransactions.length > 0 && (
                <div className="absolute top-2 right-2">
                  <span className="flex h-5 w-5">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative rounded-full h-5 w-5 bg-red-500 flex items-center justify-center text-white text-xs">
                      {pendingTransactions.length}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          // Fallback for no stats
          <div className="col-span-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-center p-4">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-gray-600">No hay estadísticas disponibles</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Search and Filters */}
      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
          <div className="relative flex-1 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar en transacciones..."
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border transition ${
              Object.values(filters).some(val => val !== 'all')
                ? "bg-indigo-100 text-indigo-700 border-indigo-300" 
                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="text-current">Filtros</span>
            {Object.values(filters).some(val => val !== 'all') && (
              <span className="bg-indigo-500 text-white text-xs w-5 h-5 rounded-full inline-flex items-center justify-center">
                {Object.values(filters).filter(val => val !== 'all').length}
              </span>
            )}
          </button>
          
          {Object.values(filters).some(val => val !== 'all') && (
            <button 
              onClick={resetFilters}
              className="text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Limpiar filtros
            </button>
          )}
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-3 border-t">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
              <select
                className="w-full border rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">Todos los estados</option>
                <option value="0">Aprobadas</option>
                <option value="1">Rechazadas</option>
                <option value="2">Pendiente Comunidad</option>
                <option value="3">Pendiente Usuario</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
              <select
                className="w-full border rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
              >
                <option value="all">Todos</option>
                <option value="sent">Enviados</option>
                <option value="received">Recibidos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rango de Fecha</label>
              <select
                className="w-full border rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              >
                <option value="all">Cualquier fecha</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          // Skeleton loader for table
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-full"></div>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-12 bg-gray-100 rounded w-full"></div>
              ))}
            </div>
          </div>
        ) : paginatedTransactions.length > 0 ? (
          // Table with data
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    onClick={() => handleSort('id')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      ID <SortIcon column="id" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('created_at')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Fecha <SortIcon column="created_at" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contraparte
                  </th>
                  <th 
                    onClick={() => handleSort('points')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Puntos <SortIcon column="points" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="relative px-4 py-3">
                    <span className="sr-only">Ver</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{transaction.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <DirectionIndicator transaction={transaction} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                          {isOrigin(transaction) ? (
                            isCommunityTransaction(transaction) ? (
                              <Building className="h-3.5 w-3.5 text-gray-600" />
                            ) : (
                              <User className="h-3.5 w-3.5 text-gray-600" />
                            )
                          ) : (
                            <User className="h-3.5 w-3.5 text-gray-600" />
                          )}
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                            {isOrigin(transaction) ? (
                              transaction.destination_name || "Destino " + (transaction.destination_clean || transaction.destination)
                            ) : (
                              transaction.origin_name || "Usuario " + transaction.origin
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {isOrigin(transaction) && isCommunityTransaction(transaction) ? 'Comunidad' : 'Usuario'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-semibold">
                        <div className="flex items-center">
                          <span className={getPointsDisplayColor(transaction)}>
                            {getPointsWithSign(transaction)}
                          </span>
                          <Coins className="h-3.5 w-3.5 ml-1 text-yellow-500" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={transaction.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button 
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-medium flex items-center gap-1"
                        onClick={() => viewTransactionDetails(transaction)}
                      >
                        <Info className="h-3.5 w-3.5" />
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Empty state
          <div className="p-8 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron transacciones</h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay transacciones que coincidan con los filtros aplicados o aún no tienes transacciones.
            </p>
            <div className="mt-6">
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="w-full flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1 
                  ? "bg-gray-100 text-gray-400" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === totalPages 
                  ? "bg-gray-100 text-gray-400" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
                </span> de <span className="font-medium">{filteredTransactions.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1 
                      ? "text-gray-300" 
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Anterior</span>
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Page numbers - simplified for first version */}
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentPage === page
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      } text-sm font-medium`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages 
                      ? "text-gray-300" 
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Siguiente</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Modals */}
      {selectedTransaction && (
        <TransactionDetailsModal 
          transaction={selectedTransaction} 
          onClose={closeTransactionDetails} 
          formatDate={formatDate} 
        />
      )}
      
      {/* Send Points Modal */}
      <SendPointsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        users={visibleUsers}
        loadingUsers={loadingUsers}
        currentUserPoints={currentUserPoints}
        isSubmitting={isSubmitting}
        onSubmit={handleSendPointsSubmit}
        preselectedUser={preselectedUser}
      />
      
      {/* Pending Transactions Modal - internal handler if onOpenPendingModal not provided */}
      {isPendingModalOpen && !onOpenPendingModal && (
        <UserPendingTransactionsModal
          isOpen={isPendingModalOpen}
          onClose={() => setIsPendingModalOpen(false)}
          transactions={pendingTransactions}
          isLoading={false}
          onApprove={(id, userId, points) => console.log("Approve transaction", id, userId, points)}
          onReject={(id, userId, points) => console.log("Reject transaction", id, userId, points)}
        />
      )}
    </div>
  );
}
