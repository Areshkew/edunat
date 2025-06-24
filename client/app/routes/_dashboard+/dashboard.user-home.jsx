import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import UserHome from "./_user/dashboard-user-userhome";

export async function loader({ request }) {
  // Dynamic imports to avoid client-side inclusion
  const { requireUser } = await import("../../utils/server-auth");
  const sessionUtils = await import("../../utils/session.server");
  
  // Use requireUser instead of getSession to verify user status
  const { token, session } = await requireUser(request, sessionUtils);
  const user = session.get("user");
  const userRole = session.get("user_role");

  try {
    // Fetch course recommendations
    const recommendationsResponse = await fetch('http://localhost:8000/api/course/recommendations', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Fetch user points and document ID
    const userDataResponse = await fetch(`http://localhost:8000/api/user/userdata`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(["points", "document_id"])
    });
    
    let recommendations = null;
    let userPoints = 0;
    let documentId = null;
    
    if (recommendationsResponse.ok) {
      const recommendationsData = await recommendationsResponse.json();
      recommendations = recommendationsData.data || null;
    }
    
    if (userDataResponse.ok) {
      const userData = await userDataResponse.json();
      userPoints = userData.points || 0;
      documentId = userData.document_id;
    }
    
    return json({ 
      user,
      userRole,
      recommendations,
      userPoints,
      documentId
    });
  } catch (error) {
    return json({ 
      user,
      userRole,
      recommendations: null,
      userPoints: 0,
      documentId: null,
      error: error.message
    });
  }
}

export default function UserHomeRoute() {
  const { user, userRole, recommendations, userPoints, documentId, error } = useLoaderData();
  
  return (
    <UserHome 
      user={user}
      userRole={userRole}
      recommendations={recommendations}
      userPoints={userPoints}
      documentId={documentId}
      error={error}
    />
  );
}
