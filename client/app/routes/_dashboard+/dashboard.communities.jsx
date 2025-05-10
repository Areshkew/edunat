import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { getSession } from "../../utils/session.server";
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import ManageCommunities from "./_admin/dashboard-admin-managecommunity";

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");

  try {
    const communitiesResponse = await fetch('http://localhost:8000/api/community/list', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!communitiesResponse.ok) throw new Error('Error al obtener comunidades');
    
    const communitiesData = await communitiesResponse.json();
    // Extract communities from the data property of the response
    const communities = communitiesData.data || [];
    
    const membersResponse = await fetch('http://localhost:8000/api/community/stats/totalmembers', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    let totalMembers = 0;
    if (membersResponse.ok) {
      const membersData = await membersResponse.json();
      
      if (typeof membersData === 'number') {
        totalMembers = membersData;
      } else if (membersData && typeof membersData === 'object') {
        if (membersData.data && typeof membersData.data.total_members === 'number') {
          totalMembers = membersData.data.total_members;
        } else if (membersData.total_members) {
          totalMembers = membersData.total_members;
        } else if (membersData.data && typeof membersData.data === 'number') {
          totalMembers = membersData.data;
        } else if (typeof membersData.count === 'number') {
          totalMembers = membersData.count;
        }
      }
      
    }
    
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
    
    return json({ communities, totalMembers, users, userRole });
  } catch (error) {
    return json({ communities: [], totalMembers: 0, users: [], error: error.message, userRole: null });
  }
}

export async function action({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const formData = await request.formData();

  const actionType = formData.get("_action");

  if (actionType === "getMembers") {
    const communityId = formData.get("communityId");
    try {
      const response = await fetch(`http://localhost:8000/api/community/members/${communityId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Error al obtener miembros');
      
      const result = await response.json();
      return json({ 
        communityId, 
        members: result.status === "success" ? result.data : [] 
      });
    } catch (error) {
      return json({ communityId, members: [], error: error.message });
    }
  }

  if (actionType === "kickMember") {
    const communityId = formData.get("communityId");
    const userId = formData.get("userId");
    
    try {
      const response = await fetch(`http://localhost:8000/api/community/kick/${communityId}/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return json({ 
          error: result.detail || "Error al eliminar miembro de la comunidad",
          statusCode: response.status
        }, { status: response.status });
      }
      
      const membersResponse = await fetch(`http://localhost:8000/api/community/members/${communityId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      let updatedMembers = [];
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        updatedMembers = membersData.status === "success" ? membersData.data : [];
      }
      
      return json({ 
        success: true,
        message: "Miembro eliminado con éxito",
        kickedMemberId: userId,
        communityId: communityId,
        members: updatedMembers
      });
    } catch (error) {
      return json({ error: "Error de conexión con el servidor" }, { status: 500 });
    }
  }

  if (actionType === "addMember") {
    const communityId = formData.get("communityId");
    const userId = formData.get("userId");
    const points = formData.get("points");
    
    try {
      const addResponse = await fetch(`http://localhost:8000/api/community/add/${communityId}/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const addResult = await addResponse.json();
      
      if (!addResponse.ok) {
        return json({ 
          error: addResult.detail || "Error al agregar miembro a la comunidad",
          statusCode: addResponse.status
        }, { status: addResponse.status });
      }
      
      if (points && parseInt(points) > 0) {
        const pointsResponse = await fetch(`http://localhost:8000/api/user/addp/${userId}/${points}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const pointsResult = await pointsResponse.json();
        
        if (!pointsResponse.ok) {
          return json({ 
            success: true,
            message: "Miembro agregado pero no se pudieron asignar puntos",
            pointsError: pointsResult.detail || "Error al asignar puntos",
            communityId: communityId
          });
        }
      }
      
      const membersResponse = await fetch(`http://localhost:8000/api/community/members/${communityId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      let updatedMembers = [];
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        updatedMembers = membersData.status === "success" ? membersData.data : [];
      }
      
      return json({ 
        success: true,
        message: "Miembro agregado con éxito" + (points && parseInt(points) > 0 ? ` y se le otorgaron ${points} puntos` : ""),
        communityId: communityId,
        members: updatedMembers
      });
    } catch (error) {
      return json({ error: "Error de conexión con el servidor" }, { status: 500 });
    }
  }

  if (actionType === "create") {
    try {
      const response = await fetch('http://localhost:8000/api/community/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.get("name"),
          about: formData.get("about")
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return json({ 
          error: result.detail || "Error al crear comunidad",
          statusCode: response.status,
          ...result
        }, { status: response.status });
      }
      
      return json({ 
        success: true,
        status: "success",
        message: "Comunidad creada con éxito",
        community: result.data 
      });
    } catch (error) {
      return json({ error: "Error de conexión con el servidor" }, { status: 500 });
    }
  }

  if (actionType === "update") {
    const communityId = formData.get("community_id");
    try {
      const response = await fetch(`http://localhost:8000/api/community/update/${communityId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.get("name") || undefined,
          about: formData.get("about") || undefined,
          visibility: formData.get("visibility") !== null ? parseInt(formData.get("visibility")) : undefined
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return json({ 
          error: result.detail || "Error al actualizar comunidad",
          statusCode: response.status,
          ...result
        }, { status: response.status });
      }
      
      return json({ 
        success: true, 
        status: "success",
        message: "Comunidad actualizada con éxito" 
      });
    } catch (error) {
      return json({ error: "Error de conexión con el servidor" }, { status: 500 });
    }
  }

  if (actionType === "updateVisibility") {
    const communityId = formData.get("community_id");
    const visibility = parseInt(formData.get("visibility"));
    
    try {
      const response = await fetch(`http://localhost:8000/api/community/update/${communityId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visibility: visibility
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (result.detail) {
          return json({ error: result.detail }, { status: response.status });
        }
        return json({ error: "Error al actualizar visibilidad" }, { status: response.status });
      }
      
      return json({ success: true, message: "Visibilidad actualizada con éxito" });
    } catch (error) {
      return json({ error: "Error de conexión con el servidor" }, { status: 500 });
    }
  }

  if (actionType === "delete") {
    const communityId = formData.get("community_id");
    try {
      const response = await fetch(`http://localhost:8000/api/community/delete/${communityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (result.detail) {
          return json({ error: result.detail }, { status: response.status });
        }
        return json({ error: "Error al eliminar comunidad" }, { status: response.status });
      }
      
      return json({ success: true, message: "Comunidad eliminada con éxito" });
    } catch (error) {
      return json({ error: "Error de conexión con el servidor" }, { status: 500 });
    }
  }

  // Add handler for getting pending transactions
  if (actionType === "getPendingTransactions") {
    try {
      const response = await fetch('http://localhost:8000/api/transaction/pending/community', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener transacciones pendientes');
      }
      
      const result = await response.json();
      
      return json({ 
        pendingTransactions: result.data || [],
        success: true
      });
    } catch (error) {
      return json({ 
        error: error.message || "Error al obtener transacciones pendientes",
        pendingTransactions: []
      }, { status: 500 });
    }
  }

  // Add handlers for approve/reject transaction actions
  if (actionType === "approveTransaction") {
    const transactionId = formData.get("transactionId");
    
    try {
      const response = await fetch(`http://localhost:8000/api/transaction/approve/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return json({ 
          error: result.detail || "Error al aprobar la transacción",
          statusCode: response.status
        }, { status: response.status });
      }
      
      return json({ 
        success: true,
        message: "Transacción aprobada con éxito",
        transactionId
      });
    } catch (error) {
      return json({ error: "Error de conexión con el servidor" }, { status: 500 });
    }
  }

  if (actionType === "rejectTransaction") {
    const transactionId = formData.get("transactionId");
    
    try {
      const response = await fetch(`http://localhost:8000/api/transaction/reject/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return json({ 
          error: result.detail || "Error al rechazar la transacción",
          statusCode: response.status
        }, { status: response.status });
      }
      
      return json({ 
        success: true,
        message: "Transacción rechazada con éxito",
        transactionId
      });
    } catch (error) {
      return json({ error: "Error de conexión con el servidor" }, { status: 500 });
    }
  }

  return null;
}

export default function CommunitiesRoute() {
  const { communities, totalMembers, users } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  // Toast notification state
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  
  // Show toast notifications for operations
  useEffect(() => {
    if (actionData && navigation.state === "idle") {
      // For successful operations
      if (actionData.success) {
        showToast(actionData.message || "Operación completada con éxito", "success");
      }
      // For error operations
      else if (actionData?.error) {
        showToast(actionData.error, "error");
      }
    }
  }, [actionData, navigation.state]);
  
  // Show toast function
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  return (
    <div>
      <ManageCommunities 
        communities={communities} 
        totalMembers={totalMembers}
        actionData={actionData}
        isSubmitting={isSubmitting}
        users={users}
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