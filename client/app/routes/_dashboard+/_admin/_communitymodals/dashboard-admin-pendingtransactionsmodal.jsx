import React, { useEffect, useState } from 'react';
import { Form } from '@remix-run/react';
import { Loader2, CheckCircle, XCircle, User, Coins, X, Calendar, MessageSquare, Clock, AlertCircle, Search, Building } from 'lucide-react';

export default function PendingTransactionsModal({ 
  isOpen, 
  onClose, 
  transactions = [], 
  isLoading = false,
  onApprove,
  onReject
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [processedTransactions, setProcessedTransactions] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ show: false, text: "", type: "success" });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    // Filter transactions based on search term
    if (searchTerm.trim() === '') {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(transaction => 
        String(transaction.destination_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(transaction.id).includes(searchTerm) ||
        String(transaction.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Add search by origin (user ID)
        String(transaction.origin).includes(searchTerm)
      );
      setFilteredTransactions(filtered);
    }
  }, [searchTerm, transactions]);

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

  // Handle transaction approval
  const handleApprove = (transactionId) => {
    // Mark as processed
    setProcessedTransactions(prev => [...prev, transactionId]);
    
    // Show success message
    setStatusMessage({
      show: true,
      text: "Transacción aprobada con éxito",
      type: "success"
    });
    
    // Clear message after delay
    setTimeout(() => {
      setStatusMessage(prev => ({ ...prev, show: false }));
    }, 3000);
    
    // Notify parent component if callback exists
    if (onApprove) {
      onApprove(transactionId);
    }
  };
  
  // Handle transaction rejection
  const handleReject = (transactionId) => {
    // Mark as processed
    setProcessedTransactions(prev => [...prev, transactionId]);
    
    // Show success message
    setStatusMessage({
      show: true,
      text: "Transacción rechazada con éxito",
      type: "warning"
    });
    
    // Clear message after delay
    setTimeout(() => {
      setStatusMessage(prev => ({ ...prev, show: false }));
    }, 3000);
    
    // Notify parent component if callback exists
    if (onReject) {
      onReject(transactionId);
    }
  };

  // Mark which transactions are currently in processing state
  const currentTransactions = filteredTransactions.filter(
    transaction => !processedTransactions.includes(transaction.id)
  );

  // If the modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[2000] transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Status message toast */}
      {statusMessage.show && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg flex items-center transition-all transform animate-fade-in ${
          statusMessage.type === "success" 
            ? "bg-green-100 border border-green-200 text-green-800" 
            : statusMessage.type === "warning"
              ? "bg-amber-100 border border-amber-200 text-amber-800"
              : "bg-red-100 border border-red-200 text-red-800"
        }`}>
          {statusMessage.type === "success" ? (
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
          ) : statusMessage.type === "warning" ? (
            <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
          ) : (
            <XCircle className="h-5 w-5 mr-2 text-red-600" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-scale-in transform-gpu md:ml-14 lg:ml-20 md:mr-2"
        onClick={(e) => e.stopPropagation()}
        style={{animationDuration: '0.3s'}}
      >
        {/* Modal Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 px-6 py-5 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-lg shadow-inner backdrop-blur-sm flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Solicitudes de Comunidad</h2>
                <p className="text-indigo-200 text-sm">Revisa y aprueba las solicitudes pendientes</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 focus:outline-none"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-3">
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <Search className="w-4 h-4 text-indigo-500" />
            </div>
            <input
              type="search"
              className="block w-full p-2 ps-10 text-sm rounded-lg bg-white border border-indigo-100 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none text-gray-900 placeholder-gray-500"
              placeholder="Buscar por comunidad, ID de usuario, ID de solicitud o detalles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto bg-gradient-to-b from-white to-indigo-50" style={{maxHeight: 'calc(90vh - 200px)'}}>
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative">
                <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
                <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-dashed border-indigo-200 animate-ping" style={{animationDuration: '3s'}}></div>
              </div>
              <span className="mt-4 text-indigo-600 font-medium">Cargando solicitudes pendientes...</span>
              <p className="mt-1 text-sm text-gray-500">Esto puede tomar unos momentos</p>
            </div>
          ) : currentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay solicitudes pendientes</h3>
              <p className="text-gray-500 max-w-md">
                {processedTransactions.length > 0 
                  ? "Todas las solicitudes han sido procesadas. Cierre y vuelva a abrir este diálogo para ver nuevas solicitudes."
                  : "Todas las solicitudes de transferencia a comunidades han sido procesadas. Revisa más tarde por nuevas solicitudes."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {currentTransactions.map((transaction, index) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  sequentialNumber={index + 1}
                  formatDate={formatDate}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white px-6 py-4 flex justify-between items-center border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {!isLoading && (
              <span>
                {currentTransactions.length} {currentTransactions.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
                {processedTransactions.length > 0 && ` • ${processedTransactions.length} procesada${processedTransactions.length !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>
          <button
            type="button"
            className="inline-flex justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// Transaction Card Component
function TransactionCard({ transaction, sequentialNumber, formatDate, onApprove, onReject }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Use these functions to communicate with parent component
  const handleApprove = () => {
    if (processing) return;
    setProcessing(true);
    setError(null);
    try {
      if (onApprove) {
        onApprove(transaction.id);
      }
    } catch (err) {
      setError("Error al aprobar la transacción");
      setProcessing(false);
    }
  };
  
  const handleReject = () => {
    if (processing) return;
    setProcessing(true);
    setError(null);
    try {
      if (onReject) {
        onReject(transaction.id);
      }
    } catch (err) {
      setError("Error al rechazar la transacción");
      setProcessing(false);
    }
  };
  
  // Update UI if transaction is marked as processing from parent component
  useEffect(() => {
    if (transaction.processing) {
      setProcessing(true);
    }
  }, [transaction.processing]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${processing ? 'border-gray-200 opacity-70' : 'border-indigo-100'} overflow-hidden hover:shadow-md transition-all duration-200`}>
      {/* Show error message if there's an error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}
    
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="inline-block text-xs font-medium text-white bg-indigo-600 rounded-full px-2.5 py-1">
              #{sequentialNumber}
            </span>
            <div className="mt-1.5 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs text-gray-500">{formatDate(transaction.date)}</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <Coins className="h-4 w-4 text-amber-500 mr-1.5" />
            <span className="text-lg font-semibold text-amber-600">{transaction.points}</span>
          </div>
        </div>

        <div className="mt-4 bg-indigo-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <h4 className="font-medium text-indigo-800">Comunidad Destino</h4>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">{transaction.destination_name || `Comunidad ${transaction.destination}`}</p>
            <span className="bg-indigo-100 text-xs px-2 py-0.5 rounded text-indigo-600">
              ID: {transaction.destination}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 mt-3">
          <div className="mt-0.5">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">Usuario #{transaction.origin}</div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
              <p className="text-xs text-gray-500 line-clamp-2">
                {transaction.details || "Sin detalles adicionales"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-t border-gray-100">
        <button
          type="button"
          disabled={processing}
          className={`flex-1 flex justify-center items-center gap-1.5 py-3 text-sm font-medium ${
            processing
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200"
          }`}
          onClick={handleReject}
        >
          {processing ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Rechazar
        </button>
        <div className="w-px bg-gray-100"></div>
        <button
          type="button"
          disabled={processing}
          className={`flex-1 flex justify-center items-center gap-1.5 py-3 text-sm font-medium ${
            processing
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-green-50 text-green-600 hover:bg-green-100 transition-colors duration-200"
          }`}
          onClick={handleApprove}
        >
          {processing ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Aprobar
        </button>
      </div>
    </div>
  );
}

// Add this at the top of your CSS file or in your global styles
// Assuming you're using a global stylesheet that supports these animations
// If not, you'll need to implement these animations in your tailwind.config.js
// 
// @keyframes scale-in {
//   from { opacity: 0; transform: scale(0.95); }
//   to { opacity: 1; transform: scale(1); }
// }
// .animate-scale-in {
//   animation: scale-in 0.3s ease-out forwards;
// }
