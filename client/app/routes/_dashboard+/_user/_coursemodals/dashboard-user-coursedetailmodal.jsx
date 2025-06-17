import React from "react";
import { X, Calendar, Clock, Users, ExternalLink, BookOpen } from "lucide-react";

export default function CourseDetailModal({ isOpen, onClose, course, onJoinCourse, onLeaveCourse, isEnrolled = false }) {
  if (!isOpen || !course) return null;

  const statusLabels = {
    0: "Próximo",
    1: "En Progreso", 
    2: "Completado"
  };

  const statusColors = {
    0: "bg-blue-100 text-blue-800",
    1: "bg-green-100 text-green-800",
    2: "bg-gray-100 text-gray-800"
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No especificado";
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    } catch (error) {
      return "Fecha inválida";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center border-b p-6">
          <h2 className="text-xl font-bold text-gray-900">Detalles del Curso</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{course.name}</h3>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[course.status]}`}>
                {statusLabels[course.status]}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Instructor</p>
                    <p className="text-sm">{course.instructor_name || "No asignado"}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Fecha de Inicio</p>
                    <p className="text-sm">{formatDate(course.start_date)}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Fecha de Fin</p>
                    <p className="text-sm">{formatDate(course.end_date)}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {course.classroom_link && (
                  <div className="flex items-center text-gray-600">
                    <ExternalLink className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-medium">Aula Virtual</p>
                      <a 
                        href={course.classroom_link.startsWith('http') ? course.classroom_link : `https://${course.classroom_link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Acceder al aula
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center text-gray-600">
                  <BookOpen className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Estado</p>
                    <p className="text-sm">{statusLabels[course.status]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {course.description && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h4>
              <p className="text-gray-600 leading-relaxed">{course.description}</p>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cerrar
          </button>
          
          {course.classroom_link && isEnrolled && (
            <a
              href={course.classroom_link.startsWith('http') ? course.classroom_link : `https://${course.classroom_link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ir al Aula
            </a>
          )}
          
          {!isEnrolled && course.status !== 2 && onJoinCourse && (
            <button
              onClick={() => onJoinCourse(course.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Unirse al Curso
            </button>
          )}
          
          {isEnrolled && onLeaveCourse && (
            <button
              onClick={() => onLeaveCourse(course)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Abandonar Curso
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
