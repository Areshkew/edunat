import { useState, useEffect } from "react";
import { Form, Link, useFetcher } from "@remix-run/react";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Plus,
  ArrowRight,
  Home,
  Activity,
  Star,
  Clock,
  User,
  Search,
  MessageSquare,
  Sparkles,
  Coins,
  UserPlus,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";

export default function UserHome({ user, userRole, recommendations, userPoints, documentId, error }) {
  const [confirmModal, setConfirmModal] = useState({ visible: false, course: null });
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [currentPoints, setCurrentPoints] = useState(userPoints || 0);
  
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  // Function to show toast notifications
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const handleJoinCourse = (course) => {
    // Check if user has enough points for paid courses
    if (course.cost > 0 && course.cost > currentPoints) {
      showToast(`No tienes suficientes puntos para este curso. Necesitas ${course.cost} puntos.`, "error");
      return;
    }
    
    if (course.cost > 0) {
      setConfirmModal({ visible: true, course });
    } else {
      submitJoinCourse(course);
    }
  };

  const submitJoinCourse = (course) => {
    const formData = new FormData();
    formData.append("_action", "joinCourse");
    formData.append("courseId", course.id);
    formData.append("courseCost", course.cost || 0);
    formData.append("documentId", documentId);
    formData.append("courseName", course.name);
    
    fetcher.submit(formData, { method: "post", action: "/dashboard/search-courses" });
    
    if (confirmModal.visible) {
      setConfirmModal({ visible: false, course: null });
    }
  };

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        showToast(fetcher.data.message || "Te has unido al curso exitosamente", "success");
        
        // Update points if there was a cost
        if (fetcher.data.courseCost && fetcher.data.courseCost > 0) {
          setCurrentPoints(prev => prev - fetcher.data.courseCost);
        }
      } else if (fetcher.data.error) {
        showToast(fetcher.data.error, "error");
      }
    }
  }, [fetcher.data]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al cargar el dashboard</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Quick Actions Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/dashboard/search-communities"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-md"
            >
              <Users className="h-4 w-4 mr-2" />
              Explorar Comunidades
            </Link>
            
            <Link
              to="/dashboard/search-courses"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-md"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Explorar Cursos
            </Link>
            
            <Link
              to="/dashboard/my-communities"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-md"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Mis Comunidades
            </Link>
            
            <Link
              to="/dashboard/my-courses"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-md"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Mis Cursos
            </Link>
            
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-md">
              <Coins className="h-4 w-4 mr-2" />
              {currentPoints} puntos
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Hero Section */}
        <div className="text-center mb-16">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-10 blur-3xl"></div>
            </div>
            <div className="relative">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6">
                ¡Bienvenido de vuelta!
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-4">
                {user ? `Hola ${user.username || user.name}, ` : 'Hola, '}
                ¿listo para continuar aprendiendo?
              </p>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Descubre nuevos cursos, únete a comunidades increíbles y sigue creciendo en tu camino de aprendizaje.
              </p>
            </div>
          </div>
        </div>

        {/* Course Recommendations */}
        {recommendations && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                <Sparkles className="h-8 w-8 mr-3 text-yellow-500" />
                Cursos Recomendados
              </h2>
              <p className="text-lg text-gray-600">{recommendations.message}</p>
            </div>

            {/* Popular Courses */}
            {recommendations.popular_courses && recommendations.popular_courses.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <Star className="h-6 w-6 mr-2 text-yellow-500" />
                  Más Populares
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.popular_courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 overflow-hidden border border-gray-100">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2"></div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.name}</h4>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            Instructor: {course.instructor}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            {course.enrollment_count} estudiantes
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            Estado: {course.status}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            {course.cost > 0 ? `${course.cost} pts` : 'Gratis'}
                          </span>
                          <button
                            onClick={() => handleJoinCourse(course)}
                            disabled={isSubmitting}
                            className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-all ${
                              course.cost > 0
                                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                                : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                            }`}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {course.cost > 0 ? `Unirse por ${course.cost} pts` : "Unirse Gratis"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Random Courses */}
            {recommendations.random_courses && recommendations.random_courses.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <Sparkles className="h-6 w-6 mr-2 text-purple-500" />
                  Descubre Algo Nuevo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendations.random_courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 overflow-hidden border border-gray-100">
                      <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-2"></div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.name}</h4>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Nuevo
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            Instructor: {course.instructor}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            Estado: {course.status}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            {course.cost > 0 ? `${course.cost} pts` : 'Gratis'}
                          </span>
                          <button
                            onClick={() => handleJoinCourse(course)}
                            disabled={isSubmitting}
                            className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-all ${
                              course.cost > 0
                                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                                : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                            }`}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {course.cost > 0 ? `Unirse por ${course.cost} pts` : "Unirse Gratis"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">¿No encuentras lo que buscas?</h3>
          <p className="text-lg mb-6 opacity-90">
            Explora toda nuestra biblioteca de cursos y encuentra exactamente lo que necesitas para tu crecimiento.
          </p>
          <Link
            to="/dashboard/search-courses"
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            <Search className="h-5 w-5 mr-2" />
            Explorar Todos los Cursos
          </Link>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-amber-100 rounded-full mb-4">
                <Coins className="h-6 w-6 text-amber-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Confirmar Inscripción
              </h3>
              
              <p className="text-gray-600 text-center mb-4">
                Estás a punto de unirte al curso:
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">
                  {confirmModal.course?.name}
                </h4>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Costo:</span>
                  <span className="font-medium text-amber-600">
                    {confirmModal.course?.cost} puntos
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
                  <span>Tu balance actual:</span>
                  <span className="font-medium text-indigo-600">
                    {currentPoints} puntos
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mt-1 border-t border-gray-200 pt-2">
                  <span>Balance después de compra:</span>
                  <span className="font-medium text-gray-800">
                    {currentPoints - (confirmModal.course?.cost || 0)} puntos
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ visible: false, course: null })}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => submitJoinCourse(confirmModal.course)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Confirmar Compra
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
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
