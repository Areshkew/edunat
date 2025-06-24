import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Form, useSubmit, useFetcher, useNavigation } from "@remix-run/react";
import { 
  ChevronDown, 
  ChevronUp, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  X, 
  AlertCircle,
  CheckCircle,
  Users,
  BookOpen,
  Filter,
  Calendar,
  Clock,
  Flag,
  Link as LinkIcon,
  Info,
  Coins
} from "lucide-react";
// Fix the import paths to the correct location
import CreateCourseModal from "./_coursemodals/dashboard-admin-createmodal";
import EditCourseModal from "./_coursemodals/dashboard-admin-editmodal";
import StudentsModal from "./_coursemodals/dashboard-admin-studentsmodal";
import DeleteCourseModal from "./_coursemodals/dashboard-admin-deletemodal";

export default function ManageCourses({ courses: initialCourses = [], actionData, isSubmitting, users = [], userRole, userId, hideToast }) {
  
  // Modal states
  const [modals, setModals] = useState({
    create: false,
    edit: false,
    students: false,
    delete: false
  });
  
  // Course states with better initialization
  const [courses, setCourses] = useState(() => initialCourses || []);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: 'all' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [windowWidth, setWindowWidth] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  
  // Refs for preventing duplicate operations
  const pendingOperations = useRef(new Set());
  
  const itemsPerPage = 12;
  const isMobileView = windowWidth < 640;
  const submit = useSubmit();
  const fetcher = useFetcher();

  const statusLabels = {
    0: "Próximo",
    1: "En curso", 
    2: "Completado"
  };

  const statusColors = {
    0: "bg-blue-100 text-blue-800",
    1: "bg-green-100 text-green-800",
    2: "bg-gray-100 text-gray-800"
  };

  // Optimized modal handlers with operation tracking
  const openModal = useCallback((modalType, course = null) => {
    setModals(prev => ({ ...prev, [modalType]: true }));
    if (course) {
      setCurrentCourse(course);
      if (modalType === 'students') {
        setSelectedCourse(course);
      }
    }
  }, []);

  const closeModal = useCallback((modalType) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
    if (modalType === 'edit' || modalType === 'delete') {
      setCurrentCourse(null);
    }
    if (modalType === 'students') {
      setSelectedCourse(null);
      setCourseStudents([]);
    }
    // Limpiar toast del padre al cerrar modal
    if (hideToast) {
      hideToast();
    }
  }, [hideToast]);

  // Toast local para fetcher
  const [localToast, setLocalToast] = useState({ 
    visible: false, 
    message: "", 
    type: "success"
  });
  
  const localToastTimeoutRef = useRef(null);

  const showLocalToast = (message, type = "success") => {
    if (localToastTimeoutRef.current) {
      clearTimeout(localToastTimeoutRef.current);
    }
    
    setLocalToast({ visible: true, message, type });
    
    localToastTimeoutRef.current = setTimeout(() => {
      setLocalToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const hideLocalToast = () => {
    if (localToastTimeoutRef.current) {
      clearTimeout(localToastTimeoutRef.current);
    }
    setLocalToast(prev => ({ ...prev, visible: false }));
  };

  // Manejar fetcher con toast local
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data._action === 'getStudents') {
        if (fetcher.data.students) {
          setCourseStudents(fetcher.data.students);
        }
      }
      
      if (fetcher.data._action === 'addStudent') {
        if (fetcher.data.success) {
          if (fetcher.data.students) {
            setCourseStudents(fetcher.data.students);
          }
          showLocalToast(fetcher.data.message || "Estudiante agregado con éxito", "success");
        } else if (fetcher.data.error) {
          showLocalToast(fetcher.data.error, "error");
        }
      }
      
      if (fetcher.data._action === 'removeStudent') {
        if (fetcher.data.success) {
          if (fetcher.data.students) {
            setCourseStudents(fetcher.data.students);
          }
          showLocalToast(fetcher.data.message || "Estudiante removido con éxito", "success");
        } else if (fetcher.data.error) {
          showLocalToast(fetcher.data.error, "error");
        }
      }
    }
  }, [fetcher.state, fetcher.data]);

  // Limpiar timeout local al desmontar
  useEffect(() => {
    return () => {
      if (localToastTimeoutRef.current) {
        clearTimeout(localToastTimeoutRef.current);
      }
    };
  }, []);

  // Simplificar el manejo de actionData SIN bucles infinitos
  useEffect(() => {
    if (actionData?.success) {
      switch (actionData._action) {
        case 'create':
          if (actionData.courses && Array.isArray(actionData.courses)) {
            setCourses(actionData.courses);
          }
          closeModal('create');
          break;
        case 'update':
          if (actionData.courses && Array.isArray(actionData.courses)) {
            setCourses(actionData.courses);
          }
          closeModal('edit');
          break;
        case 'delete':
          if (actionData.data?.course_id) {
            setCourses(prev => prev.filter(c => c.id !== parseInt(actionData.data.course_id)));
          }
          closeModal('delete');
          break;
      }
    }
  }, [actionData]);

  // Window resize handler with throttling
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // ELIMINAR COMPLETAMENTE el useEffect problemático que causaba el bucle
  // Update courses when initialCourses changes - SOLO al montar
  useEffect(() => {
    setCourses(initialCourses || []);
  }, []); // Solo ejecutar al montar

  // Date formatting utility
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "No especificado";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Fecha inválida";
      
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
      }).format(date);
    } catch (error) {
      return "Error en formato";
    }
  }, []);

  // Optimized course action handlers with duplicate prevention
  const handleUpdateStatus = useCallback((course) => {
    const operationKey = `updateStatus-${course.id}`;
    
    if (pendingOperations.current.has(operationKey)) {
      return; // Prevent duplicate operations
    }
    
    pendingOperations.current.add(operationKey);
    
    const newStatus = (course.status + 1) % 3;
    
    const formData = new FormData();
    formData.append("_action", "updateStatus");
    formData.append("course_id", course.id);
    formData.append("status", newStatus);
    
    // Optimistic update
    setCourses(prev => prev.map(c => 
      c.id === course.id ? { ...c, status: newStatus } : c
    ));
    
    submit(formData, { method: "post" });
    
    // Clean up operation tracking
    setTimeout(() => {
      pendingOperations.current.delete(operationKey);
    }, 3000);
  }, [submit]);

  // Simplificar handlers - sin bloqueos innecesarios
  const handleViewStudents = useCallback((course) => {
    setSelectedCourse(course);
    
    fetcher.submit(
      { 
        _action: "getStudents",
        courseId: course.id
      },
      { method: "post" }
    );
    
    openModal('students');
  }, [fetcher, openModal]);

  const handleRemoveStudent = useCallback((userId) => {
    fetcher.submit(
      {
        _action: "removeStudent",
        courseId: selectedCourse.id,
        studentId: userId
      },
      { method: "post" }
    );
  }, [fetcher, selectedCourse]);

  const handleAddStudent = useCallback((userId) => {
    fetcher.submit(
      {
        _action: "addStudent", 
        courseId: selectedCourse.id,
        studentId: userId
      },
      { method: "post" }
    );
  }, [fetcher, selectedCourse]);

  // Simplificar handlers
  const handleDeleteConfirm = useCallback((courseId) => {
    const formData = new FormData();
    formData.append("_action", "delete");
    formData.append("course_id", courseId);
    
    submit(formData, { method: "post" });
  }, [submit]);

  // Sorting logic
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  }, []);

  // Memoized sorted and filtered courses
  const processedCourses = useMemo(() => {
    let result = [...courses];
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === 'start_date') {
          const dateA = a[sortConfig.key] ? new Date(a[sortConfig.key]) : new Date(0);
          const dateB = b[sortConfig.key] ? new Date(b[sortConfig.key]) : new Date(0);
          return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
        }
        
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        
        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    
    // Apply filters
    result = result.filter(course => {
      const matchesSearch = 
        (course.name && course.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (course.instructor_name && course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilters = (
        filters.status === 'all' || 
        course.status === parseInt(filters.status)
      );

      return matchesSearch && matchesFilters;
    });
    
    return result;
  }, [courses, sortConfig, searchTerm, filters]);

  // Alias for backward compatibility and cleaner naming
  const filteredCourses = processedCourses;

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = useMemo(() => {
    return filteredCourses.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredCourses, currentPage, itemsPerPage]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Adjust current page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Statistics
  const stats = useMemo(() => ({
    total: courses.length,
    upcoming: courses.filter(c => c.status === 0).length,
    active: courses.filter(c => c.status === 1).length,
    completed: courses.filter(c => c.status === 2).length
  }), [courses]);

  const resetFilters = useCallback(() => {
    setFilters({ status: 'all' });
    setSearchTerm("");
  }, []);

  const isInstructor = useCallback((course) => {
    return course.instructor === parseInt(userId) || userRole === 1;
  }, [userId, userRole]);

  // Sort icon component
  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp className="w-3 h-3" /> : 
      <ChevronDown className="w-3 h-3" />;
  };

  const columns = [
    ['name', 'Nombre'],
    ['instructor_name', 'Instructor'], 
    ['start_date', 'Fecha inicio'],
    ['end_date', 'Fecha fin'],
    ['cost', 'Costo'],
    ['status', 'Estado'],
    ['acciones', 'Acciones']
  ];

  return (
    <div className="space-y-6 relative z-0">
      {/* Header and Stats */}
      <div className="relative z-0">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Administrar Cursos</h1>
            <p className="text-sm text-gray-600">Gestiona los cursos registrados en la plataforma</p>
          </div>
          <button 
            onClick={() => openModal('create')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">Crear nuevo curso</span>
          </button>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white p-3 rounded-md shadow-sm border-l-4 border-indigo-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Total de cursos</p>
                <p className="text-lg font-bold text-gray-900">{courses.length}</p>
              </div>
              <BookOpen className="h-6 w-6 text-indigo-500" />
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-md shadow-sm border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Cursos próximos</p>
                <p className="text-lg font-bold text-gray-900">{stats.upcoming}</p>
              </div>
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-md shadow-sm border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Cursos activos</p>
                <p className="text-lg font-bold text-gray-900">{stats.active}</p>
              </div>
              <Calendar className="h-5 w-5 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-md shadow-sm border-l-4 border-gray-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Cursos completados</p>
                <p className="text-lg font-bold text-gray-900">{stats.completed}</p>
              </div>
              <Flag className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm relative z-0">
        <div className="p-3">
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
            <div className="relative flex-1 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar cursos..."
                className="w-full pl-8 pr-8 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-start">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition ${
                  Object.values(filters).some(val => val !== 'all')
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300" 
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="text-current">Filtros</span>
                {Object.values(filters).some(val => val !== 'all') && (
                  <span className="bg-indigo-500 text-white text-xs w-4 h-4 rounded-full inline-flex items-center justify-center">
                    {Object.values(filters).filter(val => val !== 'all').length}
                  </span>
                )}
              </button>
            </div>
            
            {Object.values(filters).some(val => val !== 'all') && (
              <button 
                onClick={resetFilters}
                className="text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1 mt-2 sm:mt-0"
              >
                <X className="h-3 w-3" /> Limpiar
              </button>
            )}
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Estado del curso</label>
                <select
                  className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">Todos los estados</option>
                  <option value="0">Próximo</option>
                  <option value="1">En curso</option>
                  <option value="2">Completado</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course Count and Results */}
      <div className="flex justify-between items-center relative z-0">
        <p className="text-xs text-gray-500">
          Mostrando {paginatedCourses.length} de {filteredCourses.length} cursos
        </p>
      </div>

      {/* Responsive Content */}
      <div className="relative z-0">
        {!isMobileView ? (
          /* Table View for Desktop/Tablet */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map(([key, label]) => (
                      <th
                        key={key}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => key !== 'acciones' && key !== 'status' && handleSort(key)}
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          {key !== 'acciones' && key !== 'status' && <SortIcon column={key} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCourses.length > 0 ? (
                    paginatedCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50 text-sm">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900 font-medium">
                          {course.name || "No especificado"}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {course.instructor_name || "No especificado"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                          {formatDate(course.start_date)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                          {formatDate(course.end_date)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm">
                            <Coins className="h-4 w-4 text-amber-500" />
                            <span className={course.cost > 0 ? "font-medium text-amber-600" : "text-gray-500"}>
                              {course.cost !== undefined && course.cost !== null ? course.cost : 0} pts
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            statusColors[course.status] || "bg-gray-100 text-gray-800"
                          }`}>
                            {statusLabels[course.status] || "Desconocido"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button 
                              onClick={() => handleViewStudents(course)}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1.5 text-xs"
                              aria-label="Ver estudiantes"
                            >
                              <Users className="h-3.5 w-3.5 text-gray-600" />
                              <span>Estudiantes</span>
                            </button>
                            
                            <button 
                              onClick={() => openModal('edit', course)}
                              className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded-md flex items-center gap-1.5 text-xs"
                              aria-label="Editar curso"
                            >
                              <Pencil className="h-3.5 w-3.5 text-blue-600" />
                              <span>Editar</span>
                            </button>

                            <button 
                              onClick={() => openModal('delete', course)}
                              className="p-1.5 bg-red-100 hover:bg-red-200 rounded-md flex items-center gap-1.5 text-xs"
                              aria-label="Eliminar curso"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                              <span>Eliminar</span>
                            </button>

                            {course.classroom_link && (
                              <a 
                                href={course.classroom_link.startsWith('http') ? course.classroom_link : `https://${course.classroom_link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-purple-100 hover:bg-purple-200 rounded-md flex items-center gap-1.5 text-xs"
                                aria-label="Ir al aula virtual"
                              >
                                <LinkIcon className="h-3.5 w-3.5 text-purple-600" />
                                <span>Aula</span>
                              </a>
                            )}
                            
                            {isInstructor(course) && (
                              <button 
                                onClick={() => handleUpdateStatus(course)}
                                className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs ${
                                  course.status === 0 ? "bg-blue-100 hover:bg-blue-200" : 
                                  course.status === 1 ? "bg-green-100 hover:bg-green-200" : 
                                  "bg-gray-100 hover:bg-gray-200"
                                }`}
                                aria-label="Cambiar estado"
                              >
                                {course.status === 0 ? (
                                  <>
                                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                                    <span>Próximo</span>
                                  </>
                                ) : course.status === 1 ? (
                                  <>
                                    <Calendar className="h-3.5 w-3.5 text-green-600" />
                                    <span>En curso</span>
                                  </>
                                ) : (
                                  <>
                                    <Flag className="h-3.5 w-3.5 text-gray-600" />
                                    <span>Completado</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-gray-400 mb-1" />
                          <p className="text-gray-500 font-medium text-sm">No se encontraron cursos</p>
                          <p className="text-gray-400 text-xs">Intenta ajustar los filtros o términos de búsqueda</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card View for Mobile */
          <div className="grid grid-cols-1 gap-4">
            {paginatedCourses.length > 0 ? (
              paginatedCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-sm">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{course.name || "No especificado"}</h3>
                        <p className="text-sm text-gray-500 mt-1">Instructor: {course.instructor_name || "No especificado"}</p>
                      </div>
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusColors[course.status] || "bg-gray-100 text-gray-800"
                        }`}>
                          {statusLabels[course.status] || "Desconocido"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Fecha inicio</p>
                        <p className="font-medium text-gray-900">{formatDate(course.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fecha fin</p>
                        <p className="font-medium text-gray-900">{formatDate(course.end_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Costo</p>
                        <div className="flex items-center gap-1">
                          <Coins className="h-3 w-3 text-amber-500" />
                          <p className={`font-medium ${course.cost > 0 ? "text-amber-600" : "text-gray-500"}`}>
                            {course.cost !== undefined && course.cost !== null ? course.cost : 0} puntos
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Estado</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusColors[course.status] || "bg-gray-100 text-gray-800"
                        }`}>
                          {statusLabels[course.status] || "Desconocido"}
                        </span>
                      </div>
                      {course.classroom_link && (
                        <div className="col-span-2 mt-1">
                          <p className="text-xs text-gray-500">Enlace de clase</p>
                          <a 
                            href={course.classroom_link.startsWith('http') ? course.classroom_link : `https://${course.classroom_link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 text-sm hover:text-purple-700 font-medium break-all"
                          >
                            {course.classroom_link}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <button 
                          onClick={() => handleViewStudents(course)}
                          className="flex items-center justify-center gap-1 py-2 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Ver estudiantes</span>
                        </button>
                        
                        {course.classroom_link && (
                          <a 
                            href={course.classroom_link.startsWith('http') ? course.classroom_link : `https://${course.classroom_link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 py-2 rounded text-xs bg-purple-100 hover:bg-purple-200 text-purple-700"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                            <span>Ir al aula virtual</span>
                          </a>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button 
                          onClick={() => openModal('edit', course)}
                          className="flex items-center justify-center gap-1 py-2 rounded text-xs bg-blue-100 hover:bg-blue-200 text-blue-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Editar curso</span>
                        </button>
                        
                        <button 
                          onClick={() => openModal('delete', course)}
                          className="flex items-center justify-center gap-1 py-2 rounded text-xs bg-red-100 hover:bg-red-200 text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Eliminar curso</span>
                        </button>
                      </div>
                      
                      {isInstructor(course) && (
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          <button 
                            onClick={() => handleUpdateStatus(course)}
                            className={`flex items-center justify-center gap-1 py-2 rounded text-xs
                              ${course.status === 0 
                                ? "bg-blue-100 hover:bg-blue-200 text-blue-700" 
                                : course.status === 1 
                                  ? "bg-green-100 hover:bg-green-200 text-green-700" 
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                          >
                            {course.status === 0 ? (
                              <>
                                <Clock className="h-3.5 w-3.5" />
                                <span>Iniciar curso</span>
                              </>
                            ) : course.status === 1 ? (
                              <>
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Marcar como completado</span>
                              </>
                            ) : (
                              <>
                                <Flag className="h-3.5 w-3.5" />
                                <span>Reiniciar curso</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">No se encontraron cursos</p>
                <p className="text-gray-500 text-sm mt-1">Ajusta los filtros o términos de búsqueda</p>
              </div>
            )}
          </div>
        )}
      </div>
    
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 relative z-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-md ${
                currentPage === 1 
                  ? "text-gray-400 bg-gray-100" 
                  : "text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              <ChevronUp className="h-4 w-4 rotate-90" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, index, array) => {
                if (index > 0 && array[index - 1] !== page - 1) {
                  return [
                    <span key={`ellipsis-${page}`} className="px-2 text-gray-400">...</span>,
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                        currentPage === page
                          ? "bg-indigo-600 text-white"
                          : "text-gray-700 bg-white hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ];
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "text-gray-700 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 flex items-center justify-center rounded-md ${
                currentPage === totalPages 
                  ? "text-gray-400 bg-gray-100" 
                  : "text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              <ChevronUp className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateCourseModal 
        isOpen={modals.create} 
        onClose={() => closeModal('create')}
        actionData={actionData}
        isSubmitting={isSubmitting}
      />
      
      <EditCourseModal 
        isOpen={modals.edit} 
        onClose={() => closeModal('edit')}
        course={currentCourse}
        actionData={actionData}
        isSubmitting={isSubmitting}
      />
      
      <StudentsModal
        isOpen={modals.students}
        onClose={() => closeModal('students')}
        course={selectedCourse}
        students={courseStudents}
        onRemoveStudent={handleRemoveStudent}
        onAddStudent={handleAddStudent}
        allUsers={users}
      />
      
      <DeleteCourseModal
        isOpen={modals.delete}
        onClose={() => closeModal('delete')}
        course={currentCourse}
        onConfirm={handleDeleteConfirm}
        actionData={actionData}
        isSubmitting={isSubmitting}
      />

      {/* Toast local para fetcher - cambiado a la derecha y más abajo */}
      {localToast.visible && (
        <div className="fixed bottom-16 right-4 z-50 transition-all duration-300">
          <div className={`rounded-lg p-4 max-w-sm shadow-lg border flex items-start ${
            localToast.type === "success" 
              ? "bg-green-50 text-green-800 border-green-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            <div className="flex-shrink-0">
              {localToast.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3 flex-1 pt-0.5">
              <p className={`text-sm font-medium ${
                localToast.type === "success" ? "text-green-800" : "text-red-800"
              }`}>
                {localToast.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                onClick={hideLocalToast}
                className={`inline-flex rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  localToast.type === "success" 
                    ? "text-green-500 hover:text-green-600 focus:ring-green-500" 
                    : "text-red-500 hover:text-red-600 focus:ring-red-500"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
