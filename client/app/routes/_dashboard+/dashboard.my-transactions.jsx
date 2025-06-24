import { json } from "@remix-run/node";
import { useLoaderData, useNavigation, useActionData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { getSession, commitSession } from "../../utils/session.server";
import { 
  CheckCircle, 
  AlertCircle, 
  X,
} from "lucide-react";
import UserTransactions from "./_user/dashboard-user-transactions";

// Helper function to ensure we have document_id in session
async function ensureUserDocumentId(request, token) {
  const session = await getSession(request.headers.get("Cookie"));
  let documentId = session.get("document_id");
  
  // If no document_id in session, fetch it and store it
  if (!documentId) {
    try {
      const response = await fetch(`http://localhost:8000/api/user/userdata`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(["document_id"])
      });
      
      if (response.ok) {
        const data = await response.json();
        documentId = data.document_id;
        
        // Store document_id in session for future use
        session.set("document_id", documentId);
        
        // Return both the session (for cookies) and the document_id
        return { 
          session: await commitSession(session),
          documentId 
        };
      }
    } catch (error) {
      console.error("Failed to fetch document ID:", error);
    }
  }
  
  // Return what we have (might be null if all attempts failed)
  return { session, documentId };
}

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  
  if (!token) {
    throw new Error("No authentication token found");
  }
  
  try {
    // Get the document_id once and store in session if not already there
    const { session: updatedSession, documentId } = await ensureUserDocumentId(request, token);
    let headers = {};
    
    // Only add Set-Cookie header if session was changed
    if (updatedSession !== session) {
      headers = {
        "Set-Cookie": updatedSession.toString()
      };
    }
    
    // Fetch transactions, visible users, and pending transactions in parallel
    const [transactionsResponse, visibleUsersResponse, balanceResponse, pendingUserTransactionsResponse] = await Promise.all([
      fetch(`http://localhost:8000/api/transaction/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }),
      fetch(`http://localhost:8000/api/user/visible-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
      fetch(`http://localhost:8000/api/user/userdata`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(["points"])
      }),
      fetch(`http://localhost:8000/api/transaction/user/destination/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
    ]);
    
    if (!transactionsResponse.ok) {
      const errorData = await transactionsResponse.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${transactionsResponse.status}: ${transactionsResponse.statusText}`);
    }
    
    const transactionsData = await transactionsResponse.json();
    
    // Process visible users - FILTER OUT CURRENT USER using the already obtained document_id
    let visibleUsers = [];
    if (visibleUsersResponse.ok) {
      const allUsers = await visibleUsersResponse.json();
      
      // Filter out current user using the cached document_id
      if (documentId) {
        visibleUsers = allUsers.filter(user => {
          return String(user.document_id || '') !== String(documentId);
        });
      } else {
        visibleUsers = allUsers;
      }
    }
    
    // Process pending transactions for the user where they're the destination
    let pendingUserTransactions = [];
    if (pendingUserTransactionsResponse.ok) {
      const pendingData = await pendingUserTransactionsResponse.json();
      pendingUserTransactions = pendingData.data || [];
    } else {
      console.error("Failed to fetch pending user transactions");
    }
    
    // Add is_origin flag to each transaction using the cached document_id
    const processedTransactions = transactionsData.data.map(transaction => {
      return {
        ...transaction,
        is_origin: String(transaction.origin) === String(documentId),
        destination_clean: String(transaction.destination || '').replace(/[CU]$/, '')
      };
    });
    
    // Calculate proper statistics based on the transaction types and statuses
    let stats = {
      total_transactions: processedTransactions.length,
      recent_transactions: 0,
      points_received: 0,
      points_sent: 0,
      transactions_received: 0,
      transactions_sent: 0,
      pending_transactions: 0,
      current_balance: 0
    };
    
    // Get date 7 days ago for recent transactions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get user's current balance from API response
    let currentBalance = 0;
    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      currentBalance = balanceData.points || 0;
    }
    
    processedTransactions.forEach(transaction => {
      const txDate = new Date(transaction.created_at);
      
      // Count recent transactions
      if (txDate >= sevenDaysAgo) {
        stats.recent_transactions++;
      } 
      
      // Check if it's a community transaction
      const isCommunityTx = transaction.destination_type === 'community' || 
                           (transaction.destination && transaction.destination.endsWith('C')) || 
                           transaction.status === 2;
      
      // Check if user is origin of the transaction
      const isUserOrigin = transaction.is_origin;
      
      // Handle transaction statistics based on type and status
      if (isCommunityTx) {
        // For community transactions
        if (transaction.status === 0) { // Approved
          // User receives points for approved community transactions
          stats.points_received += parseInt(transaction.points);
          stats.transactions_received++;
        }
        // For rejected or pending community transactions we don't count in points totals
        if (transaction.status === 2) { // Pending admin approval
          stats.pending_transactions++;
        } 
      } else {
        // User-to-user transactions
        if (isUserOrigin) {
          // User is sending points
          if (transaction.status === 0 || transaction.status === 3) { 
            // Count both approved and pending-user transactions as sent
            // because points are already deducted when creating the transaction
            stats.points_sent += parseInt(transaction.points);
            stats.transactions_sent++;
          }
          if (transaction.status === 1) { // Rejected transaction - points were returned
            // Don't count in points_sent since they were returned
          }
          if (transaction.status === 2) { // Pending admin approval
            stats.pending_transactions++;
            stats.points_sent += parseInt(transaction.points);
            stats.transactions_sent++;
          }
          if (transaction.status === 3) { // Pending user approval
            stats.pending_transactions++;
          }
        } else {
          // User is receiving points
          if (transaction.status === 0) { // Approved
            stats.points_received += parseInt(transaction.points);
            stats.transactions_received++;
          }
          if (transaction.status === 3) { // Pending user approval
            stats.pending_transactions++;
          }
        }
      } 
    });
    
    // Set current balance from API response
    stats.current_balance = currentBalance;
    // Count pending transactions where user is destination
    stats.pending_transactions_for_approval = pendingUserTransactions.length;
    
    return json({
      transactions: processedTransactions || [],
      pendingUserTransactions: pendingUserTransactions || [],
      userStats: stats,
      visibleUsers: visibleUsers,
      currentUserId: documentId // Use cached document_id
    }, { headers });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return json({
      error: error.message || "Error al obtener transacciones",
      transactions: [],
      pendingUserTransactions: [],
      userStats: null,
      visibleUsers: []
    });
  }
}

export async function action({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const documentId = session.get("document_id"); // Get document_id from session
  const formData = await request.formData();
  
  try {
    const actionType = formData.get("_action");  
    
    // Lógica para crear transacción
    if (actionType === "createTransaction") {
      const points = parseInt(formData.get("points"));
      const destination = formData.get("destination");
      const details = formData.get("details");
      
      try {
        // Get current user's points (we already have document_id)
        const pointsResponse = await fetch(`http://localhost:8000/api/user/userdata`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(["points"])
        });
        
        if (!pointsResponse.ok) {
          throw new Error("No se pudo verificar el balance del usuario");
        }
        
        const pointsData = await pointsResponse.json();
        
        // Check if user has enough points
        if (pointsData.points < points) {
          return json({
            error: `No tienes suficientes puntos. Tu balance actual es ${pointsData.points} puntos.`,
            success: false
          }, { status: 400 });
        }
        
        // First subtract points from user
        const subtractResponse = await fetch(`http://localhost:8000/api/user/subtractp/${documentId}/${points}`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (!subtractResponse.ok) {
          const errorData = await subtractResponse.json().catch(() => ({}));
          return json({
            error: errorData.detail || "No se pudieron restar los puntos. Verifica tu saldo disponible.",
            success: false
          }, { status: subtractResponse.status });
        }
        
        // 3. Create the transaction only after points are successfully subtracted
        const transactionResponse = await fetch("http://localhost:8000/api/transaction/create/user", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            points: points,
            destination: destination.toString(),
            details: details
          })
        });
        
        if (!transactionResponse.ok) {
          // If transaction creation fails, we should add the points back
          // Since we already subtracted them but transaction wasn't created
          const addBackResponse = await fetch(`http://localhost:8000/api/user/addp/${documentId}/${points}`, {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });
          
          const errorData = await transactionResponse.json().catch(() => ({}));
          return json({
            error: errorData.detail || `Error al crear la transacción. Los puntos han sido devueltos a tu cuenta.`,
            success: false
          }, { status: transactionResponse.status });
        }
        
        // Mark that points have been updated in sessionStorage
        try {
          sessionStorage.setItem('pointsUpdated', 'true');
        } catch (e) {
          // Ignore errors with sessionStorage
        }
        
        return json({
          success: true,
          message: "Transacción creada con éxito. Pendiente de aprobación por el destinatario."
        });  
        
      } catch (error) {
        return json({
          error: error.message || "Error al conectar con el servidor",
          success: false
        }, { status: 500 });     
      }
    } 
    // Lógica para aprobar transacción
    else if (actionType === "approveTransaction") {
      const transactionId = formData.get("transactionId");
      const userId = formData.get("userId");
      const points = parseInt(formData.get("points"));
      
      // No need to fetch document_id again, use it from session
      if (!documentId) {
        return json({
          error: "No se pudo identificar al usuario actual",
          success: false
        }, { status: 400 });
      }
      
      // 1. Aprobar la transacción
      const approveResponse = await fetch(`http://localhost:8000/api/transaction/approve/${transactionId}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!approveResponse.ok) {
        const errorData = await approveResponse.json().catch(() => ({}));
        return json({
          error: errorData.detail || "No se pudo aprobar la transacción",
          success: false
        }, { status: approveResponse.status });
      }
      
      // 2. Añadir puntos al usuario actual usando el document_id de la sesión
      const addPointsResponse = await fetch(`http://localhost:8000/api/user/addp/${documentId}/${points}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!addPointsResponse.ok) {
        console.error("Error al añadir puntos al usuario, pero la transacción fue aprobada");
        return json({
          success: true,
          message: "Transacción aprobada, pero hubo un problema al añadir los puntos a tu cuenta. Por favor, contacta con soporte."
        });
      }
      
      // Mark that points have been updated
      try {
        sessionStorage.setItem('pointsUpdated', 'true');
      } catch (e) {
        // Ignore errors with sessionStorage
      }
      
      return json({
        success: true,
        message: "Transacción aprobada con éxito. Los puntos han sido añadidos a tu cuenta."
      });
    }
    // Lógica para rechazar transacción
    else if (actionType === "rejectTransaction") {
      const transactionId = formData.get("transactionId");
      const userId = formData.get("userId");
      const points = parseInt(formData.get("points"));
      
      // 1. Rechazar la transacción
      const rejectResponse = await fetch(`http://localhost:8000/api/transaction/reject/${transactionId}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!rejectResponse.ok) {
        const errorData = await rejectResponse.json().catch(() => ({}));
        return json({
          error: errorData.detail || "No se pudo rechazar la transacción",
          success: false
        }, { status: rejectResponse.status });
      }
      
      // 2. Devolver los puntos al usuario origen
      const refundResponse = await fetch(`http://localhost:8000/api/user/addp/${userId}/${points}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!refundResponse.ok) {
        console.error("Error al devolver puntos al usuario origen, pero la transacción fue rechazada");
      }
      
      return json({
        success: true,
        message: "Transacción rechazada correctamente y puntos devueltos al remitente."
      });
    }
    
    return json({ error: "Acción no reconocida", success: false }, { status: 400 });
    
  } catch (error) {
    console.error("Error en la acción:", error);
    return json({
      error: "Error al procesar la solicitud",
      success: false
    }, { status: 500 });     
  }
}

export default function UserTransactionsRoute() {
  const { transactions, pendingUserTransactions, userStats, visibleUsers, error } = useLoaderData();
  const navigation = useNavigation();
  const actionData = useActionData();
  const fetcher = useFetcher();
  const isLoading = navigation.state === "loading";
  
  // Check for quick transfer data on component mount
  useEffect(() => {
    // The UserTransactions component will handle this logic
    // We're just ensuring the route component rerenders when needed
    try {
      const quickTransferData = sessionStorage.getItem('quickTransfer');
      if (quickTransferData) {
        console.log('Quick transfer request detected in route');
      }
    } catch (error) {
      console.error('Error checking quick transfer data:', error);
    }
  }, []);
  
  // State para el modal de transacciones pendientes
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" }); 
  
  // Show toast function
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      showToast(error, "error");
    }
  }, [error]);
  
  // Show toast for action results
  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        showToast(actionData.message, "success");
      } else if (actionData.error) {
        showToast(actionData.error, "error");
      }
    }
  }, [actionData]);
  
  // Make showToast available in window for child components
  useEffect(() => {
    window.showToast = showToast;
    return () => {
      delete window.showToast;
    };
  }, []);
  
  // Manejar la aprobación de una transacción
  const handleApproveTransaction = (transactionId, originUserId, points) => {
    const formData = new FormData();
    formData.append("_action", "approveTransaction");
    formData.append("transactionId", transactionId);
    formData.append("userId", originUserId);
    formData.append("points", points);
    
    fetcher.submit(formData, { method: "post" });
  };
  
  // Manejar el rechazo de una transacción
  const handleRejectTransaction = (transactionId, originUserId, points) => {
    const formData = new FormData();
    formData.append("_action", "rejectTransaction");
    formData.append("transactionId", transactionId);
    formData.append("userId", originUserId);
    formData.append("points", points);
    
    fetcher.submit(formData, { method: "post" });
  };
  
  return (
    <div>
      <UserTransactions 
        transactions={transactions} 
        userStats={userStats}
        visibleUsers={visibleUsers}
        isLoading={isLoading}
        pendingTransactions={pendingUserTransactions}
        onOpenPendingModal={() => setIsPendingModalOpen(true)}
      />
      
      {/* Importar y usar el nuevo modal */}
      {isPendingModalOpen && (
        <UserPendingTransactionsModal
          isOpen={isPendingModalOpen}
          onClose={() => setIsPendingModalOpen(false)}
          transactions={pendingUserTransactions}
          isLoading={fetcher.state === "submitting"}
          onApprove={handleApproveTransaction}
          onReject={handleRejectTransaction}
        />
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

// Importar el modal de transacciones pendientes
import UserPendingTransactionsModal from "./_user/_usertransactionsmodals/dashboard-user-pendingtransactionsmodal";
