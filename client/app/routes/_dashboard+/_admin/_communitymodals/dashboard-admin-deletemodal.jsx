import React from "react";
import { AlertCircle } from "lucide-react";

export default function DeleteCommunityModal({ isOpen, onClose, community, onDelete }) {
  if (!isOpen || !community) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar eliminación</h3>
        <div className="flex gap-2 items-start mb-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            ¿Estás seguro de que deseas eliminar la comunidad <span className="font-semibold">"{community.name}"</span>? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={() => onDelete(community.id)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
