import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import AdminHome from "./_admin/dashboard-admin-adminhome";

export async function loader({ request }) {
  // Dynamic imports to avoid client-side inclusion
  const { requireAdmin } = await import("../../utils/server-auth");
  const sessionUtils = await import("../../utils/session.server");
  
  // Use requireAdmin instead of getSession to verify admin status
  const { token, session } = await requireAdmin(request, sessionUtils);
  const user = session.get("user");
  const userRole = session.get("user_role");

  try {
    // Fetch admin statistics from the new endpoint
    const statsResponse = await fetch('http://localhost:8000/api/user/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    // Fetch monthly growth data
    const growthResponse = await fetch('http://localhost:8000/api/user/admin/monthly-growth', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    let adminStats = null;
    let monthlyGrowth = null;
    
    if (statsResponse.ok) {
      adminStats = await statsResponse.json();
    }
    
    if (growthResponse.ok) {
      monthlyGrowth = await growthResponse.json();
    }

    // Transform data for the existing component
    const stats = {
      totalUsers: adminStats?.totals?.users || 0,
      newUsersThisMonth: adminStats?.monthly?.newUsers || 0,
      totalCommunities: adminStats?.totals?.communities || 0,
      totalCourses: adminStats?.totals?.courses || 0,
      totalTransactions: adminStats?.totals?.transactions || 0,
      totalRevenue: adminStats?.totals?.points || 0,
      monthlyTransactions: adminStats?.monthly?.transactions || 0,
      monthlyMessages: adminStats?.monthly?.messages || 0,
      monthlyCourses: adminStats?.monthly?.courses || 0,
      recentUsers: adminStats?.recent?.users || [],
      recentCommunities: adminStats?.recent?.communities || [],
      recentTransactions: adminStats?.recent?.transactions || []
    };

    return json({ 
      user,
      userRole,
      stats,
      adminStats,
      monthlyGrowth
    });
  } catch (error) {
    return json({ 
      user,
      userRole,
      stats: {
        totalUsers: 0,
        newUsersThisMonth: 0,
        totalCommunities: 0,
        totalCourses: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        recentUsers: [],
        recentCommunities: [],
        recentTransactions: []
      },
      adminStats: null,
      monthlyGrowth: null,
      error: error.message
    });
  }
}

export default function AdminHomeRoute() {
  const { user, userRole, stats, adminStats, monthlyGrowth, error } = useLoaderData();
  
  return (
    <AdminHome 
      user={user}
      userRole={userRole}
      stats={stats}
      adminStats={adminStats}
      monthlyGrowth={monthlyGrowth}
      error={error}
    />
  );
}
