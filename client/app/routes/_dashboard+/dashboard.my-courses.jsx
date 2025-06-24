import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, Form, useSubmit } from "@remix-run/react";
import { getSession, commitSession } from "../../utils/session.server";
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import UserCourses from "./_user/dashboard-user-usercourses";

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const userId = session.get("user_id");
  
  // Get flash messages from session
  const successMessage = session.get("successMessage") || null;
  const errorMessage = session.get("errorMessage") || null;
  
  // Clear flash messages
  session.unset("successMessage");
  session.unset("errorMessage");

  try {
    // Fetch user's enrolled courses
    const coursesResponse = await fetch(`http://localhost:8000/api/course/my-courses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!coursesResponse.ok) throw new Error('Error al obtener mis cursos');
    
    const coursesData = await coursesResponse.json();
    const courses = coursesData.data || [];
    
    return json({ 
      courses, 
      userId,
      successMessage,
      errorMessage
    }, {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    });
  } catch (error) {
    return json({ 
      courses: [], 
      error: error.message, 
      userId,
      successMessage,
      errorMessage
    }, {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    });
  }
}

export async function action({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const formData = await request.formData();
  const actionType = formData.get("_action");

  if (actionType === "leaveCourse") {
    const courseId = formData.get("courseId");
    
    try {
      const response = await fetch(`http://localhost:8000/api/course/leave/${courseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Set error flash message
        session.flash("errorMessage", result.detail || "Error al abandonar el curso");
        return redirect("/dashboard/my-courses", {
          headers: {
            "Set-Cookie": await commitSession(session)
          }
        });
      }
      
      // Set success flash message
      session.flash("successMessage", "Has abandonado el curso exitosamente");
      
      return redirect("/dashboard/my-courses", {
        headers: {
          "Set-Cookie": await commitSession(session)
        }
      });
    } catch (error) {
      session.flash("errorMessage", "Error de conexión con el servidor");
      return redirect("/dashboard/my-courses", {
        headers: {
          "Set-Cookie": await commitSession(session)
        }
      });
    }
  }

  return null;
}

export default function MyCourses() {
  const { courses, successMessage, errorMessage } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmLeave, setConfirmLeave] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submit = useSubmit();
  
  // Function to show toast notifications
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };
  
  // Show toast when flash messages are available
  useEffect(() => {
    if (successMessage) {
      showToast(successMessage, "success");
    } else if (errorMessage) {
      showToast(errorMessage, "error");
    }
  }, [successMessage, errorMessage]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || course.status === parseInt(statusFilter);
    return matchesSearch && matchesStatus;
  });

  const handleLeaveCourse = (course) => {
    setConfirmLeave({ id: course.id, name: course.name });
  };

  // Handle form submission and close modal
  const handleSubmitLeave = (event) => {
    const formData = new FormData(event.currentTarget);
    // Close the modal immediately
    setConfirmLeave(null);
    // Then submit the form
    submit(formData, { method: "post" });
    // Prevent default form submission
    event.preventDefault();
  };

  // Prepare stats for the component
  const stats = {
    totalCourses: courses.length,
    upcomingCourses: courses.filter(c => c.status === 0).length,
    activeCourses: courses.filter(c => c.status === 1).length,
    completedCourses: courses.filter(c => c.status === 2).length,
  };

  return (
    <div>
      {/* Pass necessary props to the UserCourses component */}
      <UserCourses 
        courses={filteredCourses}
        stats={stats}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onLeaveCourse={handleLeaveCourse}
        isLoading={navigation.state === "loading"}
      />
      
      {/* Confirmation Modal with Form */}
      {confirmLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmar acción</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas abandonar el curso <span className="font-medium">"{confirmLeave.name}"</span>?
              Esta acción no se puede deshacer.
            </p>
            
            <Form method="post" onSubmit={handleSubmitLeave} className="flex gap-3 justify-end">
              <input type="hidden" name="_action" value="leaveCourse" />
              <input type="hidden" name="courseId" value={confirmLeave.id} />
              
              <button
                type="button"
                onClick={() => setConfirmLeave(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {isSubmitting ? "Abandonando..." : "Abandonar Curso"}
              </button>
            </Form>
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
