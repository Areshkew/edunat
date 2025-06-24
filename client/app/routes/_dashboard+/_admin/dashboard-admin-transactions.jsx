import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart2, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  User,
  Users,
  Building,
  Calendar,
  ArrowUp,
  ArrowDown,
  Coins,
  ArrowRight,
  Info,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function AdminTransactions({ transactions = [], statistics = null, isLoading = false }) {
  // States for UI interaction
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    destinationType: 'all',
    dateRange: 'all'
  });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  const itemsPerPage = 10;
  
  // Reset to first page when filters or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, activeTab]);
  
  // Format date strings to local format - Updated to only show date, no time
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
  
  // Group transactions by tab
  const tabsData = useMemo(() => {
    const completed = transactions.filter(t => t.status === 0 || t.status === 1);
    const pendingCommunities = transactions.filter(t => t.status === 2);
    const pendingUsers = transactions.filter(t => t.status === 3);
    
    return {
      all: transactions,
      completed: completed,
      pendingCommunities: pendingCommunities,
      pendingUsers: pendingUsers
    };
  }, [transactions]);
  
  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    const currentTransactions = tabsData[activeTab];
    
    // Apply filters
    return currentTransactions.filter(transaction => {
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
        transaction.status === parseInt(filters.status);
      
      // Destination type filter
      const matchesDestType = filters.destinationType === 'all' || 
        transaction.destination_type === filters.destinationType;
      
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
      
      return matchesSearch && matchesStatus && matchesDestType && matchesDate;
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
  }, [tabsData, activeTab, searchTerm, filters, sortConfig]);
  
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
      destinationType: 'all',
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
  
  // Function to export transactions to Excel - More robust implementation
  const exportToExcel = () => {
    // Show loading toast
    if (window.showToast) {
      window.showToast("Preparando archivo Excel...", "info");
    }
    
    try {
      const XLSX = window.XLSX;
      if (!XLSX) {
        throw new Error("La biblioteca XLSX no está cargada");
      }
      
      // Get data for export (use filtered transactions to export what the user is seeing)
      const dataToExport = filteredTransactions.map(transaction => {
        // Get status text
        let statusText = "Desconocido";
        if (transaction.status === 0) statusText = "Aprobada";
        else if (transaction.status === 1) statusText = "Rechazada";
        else if (transaction.status === 2) statusText = "Pendiente Comunidad";
        else if (transaction.status === 3) statusText = "Pendiente Usuario";
        
        // Get destination type
        const destinationType = transaction.destination_type === 'community' || 
                      (transaction.status === 2) || 
                      (transaction.destination && transaction.destination.endsWith('C')) 
                      ? 'Comunidad' : 'Usuario';
        
        // Create row with needed fields
        return {
          "ID": transaction.id,
          "Fecha Creación": formatDate(transaction.created_at),
          "Fecha Transacción": formatDate(transaction.date),
          "Origen Nombre": transaction.origin_name || `Usuario ${transaction.origin}`,
          "Origen ID": transaction.origin,
          "Destino Nombre": transaction.destination_name || `Destino ${transaction.destination_clean || transaction.destination}`,
          "Destino Tipo": destinationType,
          "Destino ID": transaction.destination_clean || transaction.destination,
          "Puntos": transaction.points,
          "Estado": statusText,
          "Detalles": transaction.details || ""
        };
      });
      
      // Create worksheet and set column widths
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const wscols = [
        {wch: 6},  // ID
        {wch: 12}, // Fecha Creación
        {wch: 12}, // Fecha Transacción
        {wch: 25}, // Origen Nombre
        {wch: 10}, // Origen ID
        {wch: 25}, // Destino Nombre
        {wch: 12}, // Destino Tipo
        {wch: 10}, // Destino ID
        {wch: 8},  // Puntos
        {wch: 18}, // Estado
        {wch: 40}  // Detalles
      ];
      worksheet['!cols'] = wscols;
      
      // Create workbook and add sheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");
      
      // Generate file name with current date
      const now = new Date();
      const fileName = `Transacciones_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.xlsx`;
      
      // Write file and download
      XLSX.writeFile(workbook, fileName);
      
      // Show success message
      if (window.showToast) {
        window.showToast("Archivo Excel descargado correctamente", "success");
      }
    } catch (error) {
      console.error("Error exportando a Excel:", error);
      
      // Show error message
      if (window.showToast) {
        window.showToast(`Error al exportar: ${error.message}`, "error");
      }
    }
  };
  
  // Load XLSX library dynamically when needed (with better error handling)
  const handleExport = () => {
    // If the XLSX library is already loaded, use it directly
    if (window.XLSX) {
      exportToExcel();
      return;
    }
    
    // Otherwise, load it first
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.async = true;
    
    // Set up event handlers for the script
    script.onload = () => {
      exportToExcel();
    };
    
    script.onerror = () => {
      console.error("Failed to load XLSX library");
      if (window.showToast) {
        window.showToast("No se pudo cargar la biblioteca para exportar Excel", "error");
      }
    };
    
    // Add the script to document
    document.body.appendChild(script);
  };
  
  // Reset to first page when filters or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, activeTab]);
  
  return (
    <div className="space-y-5 pb-10">
      {/* Header section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Registro de Transacciones</h1>
            <p className="text-sm text-gray-600 mt-1">
              Monitorea todas las transacciones de puntos en la plataforma
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700"
            >
              <Download className="h-4 w-4" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          // Skeleton loaders for stats
          <>
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                <div className="h-5 w-1/3 bg-gray-200 rounded mb-3"></div>
                <div className="h-8 w-1/2 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </>
        ) : statistics ? (
          // Actual stats
          <>
            <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-5 rounded-xl shadow-sm border border-violet-200">
              <div className="flex justify-between">
                <h3 className="text-violet-800 text-sm font-medium mb-2">Transacciones Totales</h3>
                <div className="bg-violet-200 p-2 rounded-lg">
                  <BarChart2 className="h-5 w-5 text-violet-700" />
                </div>
              </div>
              <p className="text-3xl font-bold text-violet-900">{statistics.total_transactions}</p>
              <p className="text-xs text-violet-700 mt-2">
                {statistics.recent_transactions} en los últimos 7 días
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-sm border border-green-200">
              <div className="flex justify-between">
                <h3 className="text-green-800 text-sm font-medium mb-2">Transacciones Aprobadas</h3>
                <div className="bg-green-200 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-700" />
                </div>
              </div>
              <p className="text-3xl font-bold text-green-900">{statistics.approved_transactions}</p>
              <p className="text-xs text-green-700 mt-2">
                {Math.round((statistics.approved_transactions / statistics.total_transactions || 0) * 100)}% del total
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl shadow-sm border border-amber-200">
              <div className="flex justify-between">
                <h3 className="text-amber-800 text-sm font-medium mb-2">Transacciones Pendientes</h3>
                <div className="bg-amber-200 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-700" />
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-900">
                {statistics.pending_community + statistics.pending_user}
              </p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-1.5 py-0.5 bg-amber-200 rounded text-amber-800">
                  {statistics.pending_community} comunidades
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-amber-200 rounded text-amber-800">
                  {statistics.pending_user} usuarios
                </span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-sm border border-blue-200">
              <div className="flex justify-between">
                <h3 className="text-blue-800 text-sm font-medium mb-2">Puntos Totales</h3>
                <div className="bg-blue-200 p-2 rounded-lg">
                  <Coins className="h-5 w-5 text-blue-700" />
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-900">{statistics.total_points}</p>
              <p className="text-xs text-blue-700 mt-2">
                Puntos transferidos en el sistema
              </p>
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

      {/* Top communities */}
      {statistics?.top_communities?.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-800 font-medium mb-3">Comunidades Más Activas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {statistics.top_communities.map((community, i) => (
              <div 
                key={i} 
                className="border border-gray-100 rounded-lg p-3 shadow-sm bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-9 w-9 bg-indigo-500/80 text-white flex items-center justify-center rounded-md">
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{community.name}</p>
                    <p className="text-xs text-gray-500">{community.count} transacciones</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 border-b-2 text-sm font-medium ${
              activeTab === 'all' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap`}
          >
            Todas ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 border-b-2 text-sm font-medium ${
              activeTab === 'completed' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap`}
          >
            Completadas ({tabsData.completed.length})
          </button>
          <button
            onClick={() => setActiveTab('pendingCommunities')}
            className={`px-4 py-2 border-b-2 text-sm font-medium ${
              activeTab === 'pendingCommunities' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap`}
          >
            Pendientes Comunidades ({tabsData.pendingCommunities.length})
          </button>
          <button
            onClick={() => setActiveTab('pendingUsers')}
            className={`px-4 py-2 border-b-2 text-sm font-medium ${
              activeTab === 'pendingUsers' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap`}
          >
            Pendientes Usuarios ({tabsData.pendingUsers.length})
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Destino</label>
              <select
                className="w-full border rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.destinationType}
                onChange={(e) => setFilters({...filters, destinationType: e.target.value})}
              >
                <option value="all">Todos los tipos</option>
                <option value="community">Comunidad</option>
                <option value="user">Usuario</option>
                <option value="unknown">Desconocido</option>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
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
                  <th 
                    onClick={() => handleSort('origin_name')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Origen <SortIcon column="origin_name" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('destination_name')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Destino <SortIcon column="destination_name" />
                    </div>
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
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-gray-600" />
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                            {transaction.origin_name || "Usuario " + transaction.origin}
                          </div>
                          <div className="text-xs text-gray-500">ID: {transaction.origin}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                          {transaction.destination_type === 'community' || 
                           (transaction.status === 2) || 
                           (transaction.destination && transaction.destination.endsWith('C')) ? (
                            <Building className="h-3.5 w-3.5 text-gray-600" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-gray-600" />
                          )}
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                            {transaction.destination_name || "Destino " + transaction.destination_clean}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.destination_type === 'community' || 
                             (transaction.status === 2) || 
                             (transaction.destination && transaction.destination.endsWith('C')) 
                              ? 'Comunidad' 
                              : 'Usuario'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-semibold">
                        <div className="flex items-center">
                          <span className={transaction.points > 0 ? "text-green-600" : "text-gray-900"}>
                            {transaction.points > 0 && '+'}{transaction.points}
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
              No hay transacciones que coincidan con los filtros aplicados.
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
        <div className="flex items-center justify-between">
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
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Page numbers */}
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  
                  // Show the first page, last page, and pages around the current page
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
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
                  }
                  
                  // Show dots for skipped pages
                  if (
                    (page === 2 && currentPage > 3) ||
                    (page === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <span
                        key={page}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  
                  // Hide other pages
                  return null;
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
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Transaction details modal - Improved design */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeTransactionDetails}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
              {/* Header with transaction status */}
              <div className="px-6 pt-5 pb-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Detalles de Transacción
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={closeTransactionDetails}
                  >
                    <span className="sr-only">Cerrar</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Transaction ID and Status Banner */}
                <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="bg-gray-100 px-3 py-1 rounded-lg inline-flex items-center">
                    <span className="text-sm font-medium text-gray-800">ID: #{selectedTransaction.id}</span>
                  </div>
                  <StatusBadge status={selectedTransaction.status} />
                </div>
              </div>
              
              {/* Main content */}
              <div className="px-6 py-4">
                {/* Transaction flow diagram - MODIFIED: removed horizontal line */}
                <div className="mb-6 bg-gradient-to-r from-indigo-50 via-white to-indigo-50 rounded-xl p-6 border border-indigo-100">
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    {/* Origin side */}
                    <div className="text-center mb-4 md:mb-0">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 border-2 border-white shadow-sm">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <p className="font-medium text-gray-900">{selectedTransaction.origin_name}</p>
                      <p className="text-xs text-gray-500">Origen • ID: {selectedTransaction.origin}</p>
                    </div>
                    
                    {/* Arrow and points - MODIFIED: removed horizontal line */}
                    <div className="flex flex-col items-center mb-4 md:mb-0">
                      <div className="flex md:absolute md:left-1/2 md:transform md:-translate-x-1/2 flex-col items-center">
                        <ArrowRight className="h-5 w-5 text-indigo-500 mb-1" />
                        <div className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {selectedTransaction.points} puntos
                        </div>
                      </div>
                    </div>
                    
                    {/* Destination side */}
                    <div className="text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 border-2 border-white shadow-sm">
                        {selectedTransaction.destination_type === 'community' || 
                         (selectedTransaction.status === 2) || 
                         (selectedTransaction.destination && selectedTransaction.destination.endsWith('C')) ? (
                          <Building className="h-6 w-6 text-gray-600" />
                        ) : (
                          <User className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <p className="font-medium text-gray-900">{selectedTransaction.destination_name}</p>
                      <p className="text-xs text-gray-500">
                        {selectedTransaction.destination_type === 'community' || 
                         (selectedTransaction.status === 2) || 
                         (selectedTransaction.destination && selectedTransaction.destination.endsWith('C')) 
                          ? 'Comunidad' 
                          : 'Usuario'} • ID: {selectedTransaction.destination_clean}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Transaction details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <h4 className="text-xs uppercase text-gray-500 font-medium mb-2">Fecha de Creación</h4>
                    <p className="text-sm font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(selectedTransaction.created_at)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <h4 className="text-xs uppercase text-gray-500 font-medium mb-2">Fecha de Transacción</h4>
                    <p className="text-sm font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(selectedTransaction.date)}
                    </p>
                  </div>
                </div>
                
                {/* Transaction details/message */}
                <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="text-xs uppercase text-gray-500 font-medium mb-2">Detalles de la Transacción</h4>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {selectedTransaction.details || "Sin detalles adicionales"}
                  </p>
                </div>
                
                {/* Transaction type explanation based on status */}
                <div className="mt-4 bg-indigo-50 p-4 rounded-lg">
                  <h4 className="text-xs uppercase text-indigo-700 font-medium mb-1">
                    Información de la Transacción
                  </h4>
                  <p className="text-sm text-indigo-900">
                    {selectedTransaction.status === 0 && 
                     (selectedTransaction.destination_type === 'community' || selectedTransaction.destination.endsWith('C')) &&
                     "Transacción aprobada para una comunidad. Los puntos han sido transferidos correctamente."}
                    {selectedTransaction.status === 0 && 
                     (selectedTransaction.destination_type === 'user' || selectedTransaction.destination.endsWith('U')) &&
                     "Transacción aprobada para un usuario. Los puntos han sido transferidos correctamente."}
                    {selectedTransaction.status === 1 && 
                     (selectedTransaction.destination_type === 'community' || selectedTransaction.destination.endsWith('C')) &&
                     "Transacción rechazada para una comunidad. Los puntos no fueron transferidos."}
                    {selectedTransaction.status === 1 && 
                     (selectedTransaction.destination_type === 'user' || selectedTransaction.destination.endsWith('U')) &&
                     "Transacción rechazada para un usuario. Los puntos no fueron transferidos."}
                    {selectedTransaction.status === 2 && 
                     "Transacción pendiente de aprobación por parte de un administrador para unirse a una comunidad."}
                    {selectedTransaction.status === 3 && 
                     "Transacción pendiente de aprobación por parte del usuario destino."}
                  </p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end">
                <button
                  type="button"
                  onClick={closeTransactionDetails}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
