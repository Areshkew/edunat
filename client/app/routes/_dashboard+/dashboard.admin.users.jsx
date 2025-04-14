import ManageUsers from "./_admin/dashboard-admin-manageuser";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getSession } from "../../utils/session.server";

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");

  if (!token) {
    throw new Error("No token found");
  }

  try {
    const response = await fetch('http://localhost:8000/api/user/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const users = await response.json();
    return json({ users, token });
  } catch (error) {
    console.error('Error en loader:', error);
    return json({ users: [], token });
  }
}

export async function action({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const formData = await request.formData();
  const userId = formData.get("user_id");
  const action = formData.get("_action");

  try {
    if (action === "details") {
      const response = await fetch(`http://localhost:8000/api/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user details');
      const userData = await response.json();
      return json(userData);
    }

    if (action === "toggler") {
      const toggleResponse = await fetch(`http://localhost:8000/api/user/toggler/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!toggleResponse.ok) throw new Error('Toggle action failed');
      
      // Después de cambiar el rol, obtener los datos actualizados del usuario
      const userResponse = await fetch(`http://localhost:8000/api/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const userData = await userResponse.json();
      
      // También obtener la lista actualizada de usuarios
      const usersResponse = await fetch('http://localhost:8000/api/user/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const users = await usersResponse.json();
      
      return json({ userData, users });
    }
    
    const response = await fetch(`http://localhost:8000/api/user/${action}/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId, token })
    });

    if (!response.ok) throw new Error('Action failed');
    return json({ success: true });
  } catch (error) {
    console.error('Error in action:', error);
    return json({ error: error.message });
  }
}

export default function DashboardUsers() {
  const { users, token } = useLoaderData();
  return <ManageUsers initialUsers={users} token={token} />;
}
