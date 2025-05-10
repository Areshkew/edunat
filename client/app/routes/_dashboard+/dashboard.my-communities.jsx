import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, useActionData } from "@remix-run/react";
import { getSession, commitSession } from "../../utils/session.server";
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import UserCommunities from "./_user/dashboard-user-usercommunities";

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  
  // Get flash messages from session
  const successMessage = session.get("successMessage") || null;
  const errorMessage = session.get("errorMessage") || null;
  
  // Clear flash messages
  session.unset("successMessage");
  session.unset("errorMessage");

  try {
    // Fetch user's communities with details
    const communitiesResponse = await fetch('http://localhost:8000/api/community/user/communities/details', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!communitiesResponse.ok) {
      throw new Error('Error al obtener comunidades del usuario');
    }
    
    const communitiesData = await communitiesResponse.json();
    // Extract communities from the data property of the response
    const communities = communitiesData.data || [];
    
    // Get user role to determine permissions
    const userRole = session.get("user_role");
    
    // Calculate statistics
    const totalCommunities = communities.length;
    
    // Find most recent community (based on created_at date)
    let mostRecentCommunity = null;
    let oldestCommunity = null;
    
    if (communities.length > 0) {
      mostRecentCommunity = communities.reduce((newest, current) => {
        const currentDate = new Date(current.created_at);
        const newestDate = new Date(newest.created_at);
        return currentDate > newestDate ? current : newest;
      }, communities[0]);
      
      // Find oldest community
      oldestCommunity = communities.reduce((oldest, current) => {
        const currentDate = new Date(current.created_at);
        const oldestDate = new Date(oldest.created_at);
        return currentDate < oldestDate ? current : oldest;
      }, communities[0]);
    }
    
    // Find largest community (based on member count)
    let largestCommunity = null;
    if (communities.length > 0) {
      largestCommunity = communities.reduce((largest, current) => {
        // Use the 'members' property from the API response
        const currentMembers = current.members || 0;
        const largestMembers = largest.members || 0;
        return currentMembers > largestMembers ? current : largest;
      }, communities[0]);
    }
    
    return json({ 
      communities, 
      userRole,
      stats: {
        totalCommunities,
        mostRecentCommunity,
        oldestCommunity,
        largestCommunity
      },
      successMessage,
      errorMessage
    }, {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    });
  } catch (error) {
    return json({ 
      communities: [], 
      error: error.message, 
      userRole: null, 
      stats: null,
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

  if (actionType === "leaveCommunitiy") {
    const communityId = formData.get("communityId");
    
    try {
      const response = await fetch(`http://localhost:8000/api/community/leave/${communityId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (result.detail) {
          session.flash("errorMessage", result.detail);
          return redirect("/dashboard/my-communities", {
            headers: {
              "Set-Cookie": await commitSession(session)
            }
          });
        }
        session.flash("errorMessage", "Error al abandonar comunidad");
        return redirect("/dashboard/my-communities", {
          headers: {
            "Set-Cookie": await commitSession(session)
          }
        });
      }
      
      // Set success flash message
      session.flash("successMessage", "Has abandonado la comunidad exitosamente");
      
      return redirect("/dashboard/my-communities", {
        headers: {
          "Set-Cookie": await commitSession(session)
        }
      });
    } catch (error) {
      session.flash("errorMessage", "Error de conexión con el servidor");
      return redirect("/dashboard/my-communities", {
        headers: {
          "Set-Cookie": await commitSession(session)
        }
      });
    }
  }

  return null;
}

export default function UserCommunitiesRoute() {
  const { communities, stats, successMessage, errorMessage } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  // Toast notification state
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  
  // Function to show toast notifications
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  // Show toast when action completes or flash messages are available
  useEffect(() => {
    if (successMessage) {
      showToast(successMessage, "success");
    } else if (errorMessage) {
      showToast(errorMessage, "error");
    } else if (actionData?.success) {
      showToast(actionData.message || "Operación completada con éxito", "success");
    } else if (actionData?.error) {
      showToast(actionData.error, "error");
    }
  }, [actionData, successMessage, errorMessage]);
  
  return (
    <div>
      {/* Pasamos todas las props necesarias al componente UserCommunities */}
      <UserCommunities 
        communities={communities} 
        isSubmitting={isSubmitting}
        showToast={showToast}
        stats={stats}
      />
      
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
