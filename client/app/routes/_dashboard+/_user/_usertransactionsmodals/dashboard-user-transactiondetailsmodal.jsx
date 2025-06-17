import React from "react";
import {
  FileText,
  Calendar,
  User,
  Building,
  ArrowRight,
  Info,
  X
} from "lucide-react";

const TransactionDetailsModal = ({ transaction, onClose, formatDate }) => {
  if (!transaction) return null;

  // Helper functions
  const isOrigin = (transaction) => {
    return transaction.is_origin === true;
  };

  const isCommunityTransaction = (transaction) => {
    return transaction.destination_type === 'community' || 
           (transaction.destination && transaction.destination.endsWith('C')) || 
           transaction.status === 2;
  };

  // Status badge renderer
  const StatusBadge = ({ status }) => {
    if (status === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1"></span>
          Aprobada
        </span>
      );
    } else if (status === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1"></span>
          Rechazada
        </span>
      );
    } else if (status === 2) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mr-1"></span>
          Pendiente Comunidad
        </span>
      );
    } else if (status === 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1"></span>
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
          {/* Header con estado de transacción */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <FileText className="h-5 w-5 mr-2 text-indigo-100" />
                Detalles de Transacción
              </h3>
              <button
                type="button"
                className="rounded-full p-1 text-indigo-100 hover:text-white hover:bg-indigo-500 transition-colors duration-200 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Cerrar</span>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* ID de transacción y banner de estado */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="bg-white px-3 py-1 rounded-lg inline-flex items-center shadow-sm">
                <span className="text-sm font-medium text-indigo-900">ID: #{transaction.id}</span>
              </div>
              <StatusBadge status={transaction.status} />
            </div>
          </div>
          
          {/* Contenido principal */}
          <div className="px-6 py-5">
            {/* Diagrama de flujo de transacción */}
            <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100 relative shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                {/* Origen */}
                <div className="text-center mb-4 sm:mb-0 z-10 w-full sm:w-2/5">
                  <div className="mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3 border-2 border-indigo-200 shadow-md transform transition-transform hover:scale-105">
                    <User className="h-8 w-8 text-indigo-600" />
                  </div>
                  <p className="font-medium text-gray-900 text-base">
                    {transaction.origin_name || "Usuario " + transaction.origin}
                  </p>
                  <p className="text-xs text-gray-500">Origen • ID: {transaction.origin}</p>
                </div>
                
                {/* Flecha central grande y puntos */}
                <div className="flex flex-col items-center z-10 py-2 sm:py-0 w-full sm:w-1/5">
                  {/* Flecha animada grande */}
                  <div className="flex items-center justify-center mb-3">
                    <div className="relative">
                      <div className="animate-pulse">
                        <ArrowRight className="h-8 w-12 text-indigo-600" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                  {/* Puntos en cápsula mejorada */}
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg flex items-center">
                    <span className="inline-block text-yellow-300 mr-1">⭐</span>
                    {transaction.points} puntos
                  </div>
                </div>
                
                {/* Destino */}
                <div className="text-center z-10 w-full sm:w-2/5">
                  <div className="mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3 border-2 border-indigo-200 shadow-md transform transition-transform hover:scale-105">
                    {isCommunityTransaction(transaction) ? (
                      <Building className="h-8 w-8 text-indigo-600" />
                    ) : (
                      <User className="h-8 w-8 text-indigo-600" />
                    )}
                  </div>
                  <p className="font-medium text-gray-900 text-base">
                    {transaction.destination_name || "Destino " + (transaction.destination_clean || transaction.destination)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isCommunityTransaction(transaction) ? 'Comunidad' : 'Usuario'} • 
                    ID: {transaction.destination_clean || transaction.destination}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Detalles de la transacción */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200 shadow-sm">
                <h4 className="text-xs uppercase text-indigo-800 font-medium mb-2">Fecha de Creación</h4>
                <p className="text-sm font-medium flex items-center text-gray-800">
                  <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
                  {formatDate(transaction.created_at)}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                <h4 className="text-xs uppercase text-blue-800 font-medium mb-2">Fecha de Transacción</h4>
                <p className="text-sm font-medium flex items-center text-gray-800">
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  {formatDate(transaction.date)}
                </p>
              </div>
            </div>
            
            <div className="mt-5 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100 shadow-sm">
              <h4 className="text-xs uppercase text-indigo-700 font-medium mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1 text-indigo-600" />
                Detalles de la Transacción
              </h4>
              <p className="text-sm text-gray-800 whitespace-pre-wrap p-3 rounded-md border border-indigo-100/50 shadow-inner">
                {transaction.details || "Sin detalles adicionales"}
              </p>
            </div>
            
            <div className="mt-5 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100 shadow-sm">
              <h4 className="text-xs uppercase text-indigo-700 font-medium mb-2 flex items-center">
                <Info className="h-4 w-4 mr-1 text-indigo-600" />
                Información de la Transacción
              </h4>
              <p className="text-sm text-indigo-900 p-3 rounded-md border border-indigo-100/50 shadow-inner">
                {transaction.status === 0 && isCommunityTransaction(transaction) &&
                 "Transacción aprobada para una comunidad. Has recibido puntos por esta actividad."}
                
                {transaction.status === 0 && !isCommunityTransaction(transaction) && isOrigin(transaction) &&
                 "Transacción aprobada. Has enviado puntos a otro usuario."}
                
                {transaction.status === 0 && !isCommunityTransaction(transaction) && !isOrigin(transaction) &&
                 "Transacción aprobada. Has recibido puntos de otro usuario."}
                
                {transaction.status === 1 && isCommunityTransaction(transaction) &&
                 "Transacción rechazada para una comunidad. No se transfirieron puntos."}
                
                {transaction.status === 1 && !isCommunityTransaction(transaction) &&
                 "Transacción rechazada entre usuarios. No se transfirieron puntos."}
                
                {transaction.status === 2 && 
                 "Transacción pendiente de aprobación por un administrador para actividad comunitaria. Los puntos aún no se han transferido."}
                
                {transaction.status === 3 && isOrigin(transaction) &&
                 "Transacción pendiente de aprobación por el destinatario. Los puntos aún no se han transferido."}
                 
                {transaction.status === 3 && !isOrigin(transaction) &&
                 "Transacción pendiente de tu aprobación. Si la apruebas, recibirás los puntos."}
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-indigo-600 py-2 px-5 text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
