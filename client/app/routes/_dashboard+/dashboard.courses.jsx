import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import ManageCourses from "./_admin/dashboard-admin-managecourse";

export async function loader({ request }) {
  // Dynamic imports to avoid client-side inclusion
  const { requireAdmin } = await import("../../utils/server-auth");
  const sessionUtils = await import("../../utils/session.server");

  // Ensure user is admin before proceeding
  const { token, session } = await requireAdmin(request, sessionUtils);

  try {
    // Fetch all courses
    const coursesResponse = await fetch('http://localhost:8000/api/course/list', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!coursesResponse.ok) throw new Error('Error al obtener cursos');
    
    const coursesData = await coursesResponse.json();
    // Extract courses from the data property of the response
    const courses = coursesData.data || [];
    
    // Fetch all users for instructor selection
    const usersResponse = await fetch('http://localhost:8000/api/user/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    let users = [];
    if (usersResponse.ok) {
      users = await usersResponse.json();
    }
    
    // Add user role to returned data
    const userRole = session.get("user_role");
    const userId = session.get("user_id");
    
    return json({ courses, users, userRole, userId });
  } catch (error) {
    return json({ courses: [], users: [], error: error.message, userRole: null });
  }
}

export async function action({ request }) {
  // Dynamic imports to avoid client-side inclusion
  const { requireAdmin } = await import("../../utils/server-auth");
  const sessionUtils = await import("../../utils/session.server");

  // Ensure user is admin before proceeding
  const { token, session } = await requireAdmin(request, sessionUtils);
  
  const formData = await request.formData();
  const actionType = formData.get("_action");

  // Track which action we're performing for UI state management
  let responseData = { _action: actionType };

  // Get course students
  if (actionType === "getStudents") {
    const courseId = formData.get("courseId");
    try {
      const response = await fetch(`http://localhost:8000/api/course/students/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return json({ 
          _action: actionType,
          courseId, 
          students: [],
          error: errorData.detail || 'Error al obtener estudiantes'
        });
      }
      
      const result = await response.json();
      return json({ 
        _action: actionType,
        courseId, 
        students: result.status === "success" ? result.data : [] 
      });
    } catch (error) {
      return json({ 
        _action: actionType,
        courseId, 
        students: [], 
        error: "Error de conexión con el servidor" 
      });
    }
  }

  // Remove student from course
  if (actionType === "removeStudent") {
    const courseId = formData.get("courseId");
    const studentId = formData.get("studentId");
    
    try {
      const response = await fetch(`http://localhost:8000/api/course/remove-student/${courseId}/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        result = { detail: "Error de formato en la respuesta del servidor" };
      }
      
      if (!response.ok) {
        return json({ 
          _action: actionType,
          error: result.detail || "Error al eliminar estudiante del curso",
          statusCode: response.status
        }, { status: response.status });
      }
      
      // Fetch updated student list
      const studentsResponse = await fetch(`http://localhost:8000/api/course/students/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      let updatedStudents = [];
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        updatedStudents = studentsData.status === "success" ? studentsData.data : [];
      }
      
      return json({ 
        _action: actionType,
        success: true,
        message: "Estudiante eliminado con éxito",
        removedStudentId: studentId,
        courseId: courseId,
        students: updatedStudents
      });
    } catch (error) {
      return json({
        _action: actionType, 
        error: "Error de conexión con el servidor" 
      }, { status: 500 });
    }
  }

  // Add student to course
  if (actionType === "addStudent") {
    const courseId = formData.get("courseId");
    const studentId = formData.get("studentId");
    
    try {
      const response = await fetch(`http://localhost:8000/api/course/add-student/${courseId}/${studentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        result = { detail: "Error de formato en la respuesta del servidor" };
      }
      
      if (!response.ok) {
        return json({ 
          _action: actionType,
          error: result.detail || "Error al agregar estudiante al curso",
          statusCode: response.status
        }, { status: response.status });
      }
      
      // Fetch updated student list
      const studentsResponse = await fetch(`http://localhost:8000/api/course/students/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      let updatedStudents = [];
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        updatedStudents = studentsData.status === "success" ? studentsData.data : [];
      }
      
      return json({ 
        _action: actionType,
        success: true,
        message: "Estudiante agregado con éxito",
        courseId: courseId,
        students: updatedStudents
      });
    } catch (error) {
      return json({
        _action: actionType,
        error: "Error de conexión con el servidor" 
      }, { status: 500 });
    }
  }

  // Create new course
  if (actionType === "create") {
    try {
      const costValue = formData.get("cost");
      const parsedCost = costValue ? parseInt(costValue, 10) : 0;
      
      const courseData = {
        name: formData.get("name"),
        classroom_link: formData.get("classroom_link") || "",
        start_date: formData.get("start_date"),
        end_date: formData.get("end_date") || null,
        status: parseInt(formData.get("status") || "0"),
        cost: isNaN(parsedCost) ? 0 : parsedCost
      };

      const response = await fetch('http://localhost:8000/api/course/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
      });
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        result = { detail: "Error de formato en la respuesta del servidor" };
      }
      
      if (!response.ok) {
        return json({ 
          _action: actionType,
          error: result.detail || "Error al crear curso",
          statusCode: response.status
        }, { status: response.status });
      }
      
      // After successful creation, fetch the complete course list
      const coursesResponse = await fetch('http://localhost:8000/api/course/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      let updatedCourses = [];
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        updatedCourses = coursesData.data || [];
      }
      
      return json({ 
        _action: actionType,
        success: true,
        status: "success",
        message: "Curso creado con éxito",
        courses: updatedCourses
      });
    } catch (error) {
      return json({
        _action: actionType,
        error: "Error de conexión con el servidor" 
      }, { status: 500 });
    }
  }

  // Update course
  if (actionType === "update") {
    const courseId = formData.get("course_id");
    try {
      const costValue = formData.get("cost");
      const parsedCost = costValue ? parseInt(costValue, 10) : 0;
      
      const updateData = {
        name: formData.get("name"),
        classroom_link: formData.get("classroom_link"),
        start_date: formData.get("start_date"),
        end_date: formData.get("end_date"),
        status: parseInt(formData.get("status") || "0"),
        cost: isNaN(parsedCost) ? 0 : parsedCost
      };
      
      const response = await fetch(`http://localhost:8000/api/course/update/${courseId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        result = { detail: "Error de formato en la respuesta del servidor" };
      }
      
      if (!response.ok) {
        return json({ 
          _action: actionType,
          error: result.detail || "Error al actualizar curso",
          statusCode: response.status
        }, { status: response.status });
      }

      // After successful update, fetch the updated course list
      const coursesResponse = await fetch('http://localhost:8000/api/course/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      let updatedCourses = [];
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        updatedCourses = coursesData.data || [];
      }
      
      return json({ 
        _action: actionType,
        success: true, 
        status: "success",
        message: "Curso actualizado con éxito",
        courses: updatedCourses
      });
    } catch (error) {
      return json({
        _action: actionType,
        error: "Error de conexión con el servidor" 
      }, { status: 500 });
    }
  }

  // Update course status
  if (actionType === "updateStatus") {
    const courseId = formData.get("course_id");
    const status = parseInt(formData.get("status"));
    
    try {
      const response = await fetch(`http://localhost:8000/api/course/update/${courseId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: status
        })
      });
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        result = { detail: "Error de formato en la respuesta del servidor" };
      }
      
      if (!response.ok) {
        return json({ 
          _action: actionType,
          error: result.detail || "Error al actualizar estado del curso",
          statusCode: response.status
        }, { status: response.status });
      }
      
      return json({
        _action: actionType,
        success: true, 
        message: "Estado del curso actualizado con éxito" 
      });
    } catch (error) {
      return json({
        _action: actionType, 
        error: "Error de conexión con el servidor" 
      }, { status: 500 });
    }
  }

  // Delete course
  if (actionType === "delete") {
    const courseId = formData.get("course_id");
    try {
      const response = await fetch(`http://localhost:8000/api/course/delete/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        result = { detail: "Error de formato en la respuesta del servidor" };
      }
      
      if (!response.ok) {
        return json({ 
          _action: actionType,
          error: result.detail || "Error al eliminar curso",
          statusCode: response.status
        }, { status: response.status });
      }
      
      return json({
        _action: actionType,
        success: true, 
        message: "Curso eliminado con éxito",
        data: {
          course_id: courseId
        }
      });
    } catch (error) {
      return json({
        _action: actionType,
        error: "Error de conexión con el servidor" 
      }, { status: 500 });
    }
  }

  return json({ _action: actionType });
}

export default function CoursesRoute() {
  const { courses, users, userRole, userId } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  // Toast simple - solo para actionData del submit principal
  const [toast, setToast] = useState({ 
    visible: false, 
    message: "", 
    type: "success"
  });
  
  const toastTimeoutRef = useRef(null);
  const lastActionDataRef = useRef(null);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Mejorar el manejo del toast para actionData
  useEffect(() => {
    if (actionData && navigation.state === "idle") {
      const currentActionString = JSON.stringify(actionData);
      
      // Evitar procesar la misma acción dos veces
      if (lastActionDataRef.current === currentActionString) {
        return;
      }
      lastActionDataRef.current = currentActionString;
      
      console.log("ActionData recibido:", actionData); // Para debug
      
      if (actionData.success) {
        const message = actionData.message || "Operación completada con éxito";
        showToast(message, "success");
      } else if (actionData.error) {
        showToast(actionData.error, "error");
      }
    }
  }, [actionData, navigation.state]);

  const showToast = (message, type = "success") => {
    console.log("Mostrando toast:", message, type); // Para debug
    
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    setToast({ visible: true, message, type });
    
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const hideToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(prev => ({ ...prev, visible: false }));
  };
  
  return (
    <div>
      <ManageCourses 
        courses={courses} 
        users={users}
        actionData={actionData}
        isSubmitting={isSubmitting}
        userRole={userRole}
        userId={userId}
        hideToast={hideToast}
      />
      
      {/* Toast solo para actionData principal */}
      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50 transition-all duration-300">
          <div className={`rounded-lg p-4 max-w-sm shadow-lg border flex items-start ${
            toast.type === "success" 
              ? "bg-green-50 text-green-800 border-green-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            <div className="flex-shrink-0">
              {toast.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3 flex-1 pt-0.5">
              <p className={`text-sm font-medium ${
                toast.type === "success" ? "text-green-800" : "text-red-800"
              }`}>
                {toast.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                onClick={hideToast}
                className={`inline-flex rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  toast.type === "success" 
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
