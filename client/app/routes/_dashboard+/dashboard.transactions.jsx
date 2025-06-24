import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import AdminTransactions from "./_admin/dashboard-admin-transactions";

export async function loader({ request }) {
  // Dynamic imports to avoid client-side inclusion
  const { requireAdmin } = await import("../../utils/server-auth");
  const sessionUtils = await import("../../utils/session.server");

  // Ensure user is admin before proceeding
  const { token, session } = await requireAdmin(request, sessionUtils);
  
  const userRole = session.get("role"); 

  try {
    // Fetch all transactions with statistics
    const transactionsResponse = await fetch('http://localhost:8000/api/transaction/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!transactionsResponse.ok) throw new Error('Error al obtener transacciones');
    
    const transactionsData = await transactionsResponse.json();
    
    return json({
      transactions: transactionsData.data || [],
      statistics: transactionsData.statistics || null,
      userRole
    });
  } catch (error) {
    return json({
      error: error.message,
      transactions: [],
      statistics: null,
      userRole
    });
  }
}

export default function TransactionsRoute() {
  const { transactions, statistics, error, userRole } = useLoaderData();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  
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
  
  // Make showToast available in window for child components
  useEffect(() => {
    window.showToast = showToast;
    return () => {
      delete window.showToast;
    };
  }, []);

  return (
    <div>
      <AdminTransactions 
        transactions={transactions} 
        statistics={statistics}
        isLoading={isLoading}
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
