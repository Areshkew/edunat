import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function DeleteCourseModal({ isOpen, onClose, course, onConfirm, isSubmitting = false }) {
  
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen || !course) return null;

  const handleConfirm = () => {
    if (onConfirm && course.id) {
      onConfirm(course.id);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Eliminar Curso</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            ¿Estás seguro de que deseas eliminar el curso?
          </p>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="font-medium text-gray-900">{course.name}</p>
            <p className="text-sm text-gray-600">Instructor: {course.instructor_name}</p>
          </div>
          <p className="text-sm text-red-600 mt-2">
            Esta acción no se puede deshacer. Se eliminarán también todas las inscripciones de estudiantes.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
