import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useFetcher, useNavigation, Link } from "@remix-run/react";
import { getSession } from "../../utils/session.server";
import { useState, useEffect } from "react";
import { BookOpen, Calendar, Clock, Users, ExternalLink, Search, Filter, X, CheckCircle, AlertCircle, UserPlus, Coins } from "lucide-react";

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const userId = session.get("user_id");

  try {
    // Fetch all available courses
    const coursesResponse = await fetch('http://localhost:8000/api/course/list', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!coursesResponse.ok) throw new Error('Error al obtener cursos');
    
    const coursesData = await coursesResponse.json();
    const allCourses = coursesData.data || [];

    // Fetch user's enrolled courses to mark them as enrolled
    const myCoursesResponse = await fetch(`http://localhost:8000/api/course/my-courses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    let enrolledCourseIds = [];
    if (myCoursesResponse.ok) {
      const myCoursesData = await myCoursesResponse.json();
      enrolledCourseIds = (myCoursesData.data || []).map(course => course.id);
    }

    // Fetch user points balance
    const userDataResponse = await fetch(`http://localhost:8000/api/user/userdata`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(["points", "document_id"])
    });
    
    let userPoints = 0;
    let documentId = null;
    
    if (userDataResponse.ok) {
      const userData = await userDataResponse.json();
      userPoints = userData.points || 0;
      documentId = userData.document_id;
    }

    // Mark courses as enrolled instead of filtering them out
    const coursesWithEnrollmentStatus = allCourses.map(course => ({
      ...course,
      isEnrolled: enrolledCourseIds.includes(course.id)
    }));
    
    return json({ 
      courses: coursesWithEnrollmentStatus, 
      enrolledCourseIds, 
      userId, 
      userPoints,
      documentId
    });
  } catch (error) {
    return json({ 
      courses: [], 
      enrolledCourseIds: [], 
      error: error.message, 
      userId,
      userPoints: 0,
      documentId: null
    });
  }
}

export async function action({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const formData = await request.formData();
  const actionType = formData.get("_action");

  if (actionType === "joinCourse") {
    const courseId = formData.get("courseId");
    const courseCost = parseInt(formData.get("courseCost"), 10) || 0;
    const documentId = formData.get("documentId");
    
    try {
      // If the course has a cost, subtract points first
      if (courseCost > 0) {
        const subtractResponse = await fetch(`http://localhost:8000/api/user/subtractp/${documentId}/${courseCost}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!subtractResponse.ok) {
          const errorData = await subtractResponse.json();
          return json({ 
            error: errorData.detail || "No tienes suficientes puntos para unirte a este curso",
            success: false
          });
        }
      }
      
      // After successful points subtraction (if applicable), join the course
      const response = await fetch(`http://localhost:8000/api/course/join/${courseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // If join failed but points were subtracted, we should add the points back
        if (courseCost > 0) {
          await fetch(`http://localhost:8000/api/user/addp/${documentId}/${courseCost}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        return json({ 
          error: result.detail || "Error al unirse al curso",
          success: false
        });
      }
      
      return json({ 
        success: true,
        message: "Te has unido al curso exitosamente",
        joinedCourseId: parseInt(courseId),
        courseCost: courseCost,
        courseName: formData.get("courseName") || "al curso"
      });
    } catch (error) {
      return json({
        error: "Error de conexión con el servidor",
        success: false
      });
    }
  }

  return json({ success: false });
}

export default function SearchCourses() {
  const { courses: initialCourses, enrolledCourseIds, userId, userPoints, documentId } = useLoaderData();
  const actionData = useActionData();
  const [courses, setCourses] = useState(initialCourses);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [confirmModal, setConfirmModal] = useState({ visible: false, course: null });
  const [joinedCourses, setJoinedCourses] = useState(new Set(enrolledCourseIds?.map(id => parseInt(id)) || []));
  const [currentPoints, setCurrentPoints] = useState(userPoints || 0);

  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" || fetcher.state === "submitting";

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

  // Function to show toast notifications
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  // Check fetcher data for course join responses
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        showToast(fetcher.data.message || "Te has unido al curso exitosamente", "success");
        
        const joinedId = parseInt(fetcher.data.joinedCourseId);
        if (joinedId) {
          // Update joined courses set
          setJoinedCourses(prev => new Set([...prev, joinedId]));
          
          // Update courses array to reflect enrollment
          setCourses(prevCourses =>
            prevCourses.map(course =>
              course.id === joinedId ? { ...course, isEnrolled: true } : course
            )
          );
          
          // Update points if there was a cost
          if (fetcher.data.courseCost && fetcher.data.courseCost > 0) {
            setCurrentPoints(prev => prev - fetcher.data.courseCost);
          }
        }
      } else if (fetcher.data.error) {
        showToast(fetcher.data.error, "error");
      }
    }
  }, [fetcher.data]);

  // Handle action data from form submissions
  useEffect(() => {
    if (actionData?.success) {
      showToast(actionData.message, "success");
      
      // Update the joined courses set to reflect UI changes immediately
      if (actionData.joinedCourseId) {
        const joinedId = parseInt(actionData.joinedCourseId);
        
        // Update joined courses set
        setJoinedCourses(prev => new Set([...prev, joinedId]));
        
        // Also update the courses array to reflect the enrollment status
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course.id === joinedId
              ? { ...course, isEnrolled: true } 
              : course
          )
        );
        
        // Update current points if course had a cost
        if (actionData.courseCost && actionData.courseCost > 0) {
          setCurrentPoints(prev => prev - actionData.courseCost);
        }
      }
    } else if (actionData?.error) {
      showToast(actionData.error, "error");
    }
  }, [actionData]);

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

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || course.status === parseInt(statusFilter);
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Sort by status: 0 (upcoming) first, then 1 (in progress), then 2 (completed)
    return a.status - b.status;
  });

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
    
    fetcher.submit(formData, { method: "post" });
    
    if (confirmModal.visible) {
      setConfirmModal({ visible: false, course: null });
    }
  };

  const isCourseJoined = (courseId) => {
    // Check if course is in the joinedCourses set
    return joinedCourses.has(parseInt(courseId)) || 
           // Or if it's marked as enrolled in the courses array
           courses.find(c => c.id === courseId)?.isEnrolled;
  };

  const availableCoursesCount = courses.filter(c => !isCourseJoined(c.id)).length;
  const upcomingCoursesCount = courses.filter(c => c.status === 0).length;
  const activeCoursesCount = courses.filter(c => c.status === 1).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Buscar Cursos</h1>
        <p className="text-gray-600">Descubre y únete a nuevos cursos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cursos Disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{availableCoursesCount}</p>
            </div>
            <BookOpen className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Próximos a Iniciar</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingCoursesCount}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Progreso</p>
              <p className="text-2xl font-bold text-gray-900">{activeCoursesCount}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tus Puntos</p>
              <p className="text-2xl font-bold text-gray-900">{currentPoints}</p>
            </div>
            <Coins className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cursos por nombre o instructor..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                statusFilter !== "all"
                  ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {statusFilter !== "all" && (
                <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full">1</span>
              )}
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                
                <div className="flex items-end">
                  {statusFilter !== "all" && (
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                        setShowFilters(false);
                      }}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Mostrando {filteredCourses.length} de {courses.length} cursos disponibles
        </p>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight line-clamp-2 break-words pr-2">
                    {course.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0 ${statusColors[course.status]}`}>
                    {statusLabels[course.status]}
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Instructor: {course.instructor_name || "No asignado"}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Inicio: {formatDate(course.start_date)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Fin: {formatDate(course.end_date)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Coins className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className={`${course.cost > 0 ? "font-medium text-amber-600" : ""} whitespace-nowrap`}>
                      {course.cost > 0 ? `${course.cost} puntos` : "Gratis"}
                    </span>
                  </div>
                </div>
                
                {/* Course action button */}
                {isCourseJoined(course.id) ? (
                  <div className="flex items-center justify-center w-full py-3 bg-green-100 text-green-800 rounded-lg">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="font-medium">Ya inscrito</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleJoinCourse(course)}
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      course.cost > 0
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                        : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white"
                    } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <UserPlus className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {course.cost > 0 ? `Unirse por ${course.cost} pts` : "Unirse Gratis"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron cursos</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "Intenta ajustar los filtros de búsqueda" 
              : "No hay cursos disponibles en este momento"}
          </p>
          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

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
