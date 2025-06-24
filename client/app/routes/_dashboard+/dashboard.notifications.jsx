import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { useState, useEffect, useCallback } from "react";
import { X, Bell, Check, Trash2, CheckCheck } from "lucide-react";
import { getSession } from "../../utils/session.server";

export async function action({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");

  if (!token) {
    return json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const actionType = formData.get("_action");

  if (actionType === "getNotifications") {
    try {
      const response = await fetch('http://localhost:8000/api/notifications/my-notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return json({ 
          success: true,
          notifications: data.data || []
        });
      } else {
        return json({ 
          success: false,
          error: "Error al obtener notificaciones" 
        });
      }
    } catch (error) {
      return json({ 
        success: false,
        error: "Error de conexión" 
      });
    }
  }

  if (actionType === "getUnreadCount") {
    try {
      const response = await fetch('http://localhost:8000/api/notifications/unread-count', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return json({ 
          success: true,
          unreadCount: data.data?.unread_count || 0
        });
      } else {
        return json({ 
          success: false,
          unreadCount: 0
        });
      }
    } catch (error) {
      return json({ 
        success: false,
        unreadCount: 0
      });
    }
  }

  if (actionType === "markAsRead") {
    const notificationId = formData.get("notificationId");
    
    try {
      const response = await fetch(`http://localhost:8000/api/notifications/mark-read/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return json({ 
          success: true,
          notificationId: parseInt(notificationId)
        });
      } else {
        return json({ 
          success: false,
          error: "Error al marcar como leída" 
        });
      }
    } catch (error) {
      return json({ 
        success: false,
        error: "Error de conexión" 
      });
    }
  }

  if (actionType === "markAllAsRead") {
    try {
      const response = await fetch('http://localhost:8000/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return json({ 
          success: true
        });
      } else {
        return json({ 
          success: false,
          error: "Error al marcar todas como leídas" 
        });
      }
    } catch (error) {
      return json({ 
        success: false,
        error: "Error de conexión" 
      });
    }
  }

  if (actionType === "deleteNotification") {
    const notificationId = formData.get("notificationId");
    
    try {
      const response = await fetch(`http://localhost:8000/api/notifications/delete/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return json({ 
          success: true,
          notificationId: parseInt(notificationId)
        });
      } else {
        return json({ 
          success: false,
          error: "Error al eliminar notificación" 
        });
      }
    } catch (error) {
      return json({ 
        success: false,
        error: "Error de conexión" 
      });
    }
  }

  return json({ error: "Acción no válida" }, { status: 400 });
}

// Hook personalizado para manejar notificaciones
export function useNotifications(token, userData) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Fetchers para cada acción
  const notificationCountFetcher = useFetcher();
  const notificationsFetcher = useFetcher();
  const markReadFetcher = useFetcher();
  const markAllReadFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  // useCallback SIN dependencias problemáticas
  const fetchNotificationCount = useCallback(() => {
    if (!token || notificationCountFetcher.state !== 'idle') return;
    
    notificationCountFetcher.submit(
      { _action: "getUnreadCount" },
      { method: "post", action: "/dashboard/notifications" }
    );
  }, [token]);

  const fetchNotifications = useCallback(() => {
    if (!token || notificationsFetcher.state !== 'idle') return;
    
    setLoadingNotifications(true);
    notificationsFetcher.submit(
      { _action: "getNotifications" },
      { method: "post", action: "/dashboard/notifications" }
    );
  }, [token]);

  const markAsRead = useCallback((notificationId) => {
    if (markReadFetcher.state !== 'idle') return;
    
    markReadFetcher.submit(
      { 
        _action: "markAsRead",
        notificationId: notificationId.toString()
      },
      { method: "post", action: "/dashboard/notifications" }
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    if (markAllReadFetcher.state !== 'idle') return;
    
    markAllReadFetcher.submit(
      { _action: "markAllAsRead" },
      { method: "post", action: "/dashboard/notifications" }
    );
  }, []);

  const deleteNotification = useCallback((notificationId) => {
    if (deleteFetcher.state !== 'idle') return;
    
    deleteFetcher.submit(
      { 
        _action: "deleteNotification",
        notificationId: notificationId.toString()
      },
      { method: "post", action: "/dashboard/notifications" }
    );
  }, []);

  // Effects sin dependencias problemáticas
  useEffect(() => {
    if (notificationCountFetcher.data && notificationCountFetcher.state === 'idle') {
      if (notificationCountFetcher.data.success) {
        setNotificationCount(notificationCountFetcher.data.unreadCount || 0);
      }
    }
  }, [notificationCountFetcher.data, notificationCountFetcher.state]);

  useEffect(() => {
    if (notificationsFetcher.data && notificationsFetcher.state === 'idle') {
      if (notificationsFetcher.data.success) {
        setNotifications(notificationsFetcher.data.notifications || []);
      }
      setLoadingNotifications(false);
    }
  }, [notificationsFetcher.data, notificationsFetcher.state]);

  useEffect(() => {
    if (markReadFetcher.data && markReadFetcher.state === 'idle') {
      if (markReadFetcher.data.success) {
        const notificationId = markReadFetcher.data.notificationId;
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        setNotificationCount(prev => Math.max(0, prev - 1));
      }
    }
  }, [markReadFetcher.data, markReadFetcher.state]);

  useEffect(() => {
    if (markAllReadFetcher.data && markAllReadFetcher.state === 'idle') {
      if (markAllReadFetcher.data.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setNotificationCount(0);
      }
    }
  }, [markAllReadFetcher.data, markAllReadFetcher.state]);

  useEffect(() => {
    if (deleteFetcher.data && deleteFetcher.state === 'idle') {
      if (deleteFetcher.data.success) {
        const notificationId = deleteFetcher.data.notificationId;
        
        setNotifications(prev => {
          const deletedNotification = prev.find(n => n.id === notificationId);
          if (deletedNotification && !deletedNotification.is_read) {
            setNotificationCount(count => Math.max(0, count - 1));
          }
          return prev.filter(notif => notif.id !== notificationId);
        });
      }
    }
  }, [deleteFetcher.data, deleteFetcher.state]);

  // Auto-cargar contador controlado
  useEffect(() => {
    if (!token || !userData?.document_id) return;

    // Cargar solo una vez al inicio
    fetchNotificationCount();
    
    // Intervalo controlado
    const interval = setInterval(() => {
      if (notificationCountFetcher.state === 'idle') {
        notificationCountFetcher.submit(
          { _action: "getUnreadCount" },
          { method: "post", action: "/dashboard/notifications" }
        );
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [token, userData?.document_id, fetchNotificationCount]);

  return {
    notificationCount,
    notifications,
    loadingNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingRead: markReadFetcher.state === 'submitting',
    isMarkingAllRead: markAllReadFetcher.state === 'submitting',
    isDeleting: deleteFetcher.state === 'submitting'
  };
}

export function NotificationModal({ 
  isOpen, 
  onClose, 
  notificationCount,
  notifications,
  loadingNotifications,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  isMarkingAllRead,
  isMarkingRead,
  isDeleting
}) {
  const [hasLoaded, setHasLoaded] = useState(false);

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 0: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNotificationTypeText = (type) => {
    switch (type) {
      case 0: return 'Info';
      case 1: return 'Aviso';
      case 2: return 'Alerta';
      default: return 'Notificación';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Cargar notificaciones SOLO una vez cuando se abre
  useEffect(() => {
    if (isOpen && !hasLoaded && !loadingNotifications) {
      fetchNotifications();
      setHasLoaded(true);
    }
    
    if (!isOpen) {
      setHasLoaded(false);
    }
  }, [isOpen, hasLoaded, loadingNotifications]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Notificaciones</h2>
            {notificationCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {notificationCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {notificationCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isMarkingAllRead}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 disabled:opacity-50"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Marcar todas</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingNotifications ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    notification.is_read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-indigo-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getNotificationTypeColor(notification.notification_type)}`}>
                          {getNotificationTypeText(notification.notification_type)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                        )}
                      </div>
                      <p className={`text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.message}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-4">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          disabled={isMarkingRead}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                          title="Marcar como leída"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        disabled={isDeleting}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Eliminar notificación"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsRoute() {
  return null;
}
