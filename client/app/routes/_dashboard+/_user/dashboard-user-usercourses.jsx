import React from "react";
import { BookOpen, Calendar, Clock, Users, ExternalLink, Coins } from "lucide-react";

export default function UserCourses({ 
  courses, 
  stats, 
  searchTerm = "", 
  setSearchTerm, 
  statusFilter = "all", 
  setStatusFilter, 
  onLeaveCourse, 
  isLoading = false 
}) {
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis Cursos</h1>
        <p className="text-gray-600">Cursos en los que estás inscrito</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Cursos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Próximos</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.upcomingCourses}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Progreso</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.activeCourses}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completedCourses}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar cursos
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre o instructor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado del curso
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="0">Próximos</option>
              <option value="1">En Progreso</option>
              <option value="2">Completados</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow animate-pulse">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    {course.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[course.status]}`}>
                    {statusLabels[course.status]}
                  </span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Instructor: {course.instructor_name || "No asignado"}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Inicio: {formatDate(course.start_date)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Fin: {formatDate(course.end_date)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Coins className="h-4 w-4 mr-2" />
                    <span>Costo pagado: {course.cost || 0} puntos</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {course.classroom_link && (
                    <a
                      href={course.classroom_link.startsWith('http') ? course.classroom_link : `https://${course.classroom_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-indigo-600 text-white text-center py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ir al Aula
                    </a>
                  )}
                  
                  {onLeaveCourse && (
                    <button
                      onClick={() => onLeaveCourse(course)}
                      className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Abandonar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes cursos</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "No se encontraron cursos con los filtros aplicados" 
              : "Aún no estás inscrito en ningún curso"}
          </p>
          <a
            href="/dashboard/search-courses"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Buscar Cursos
          </a>
        </div>
      )}
    </div>
  );
}
