import { json } from "@remix-run/node";
import { getSession } from "../../utils/session.server";

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");

  if (!token) {
    return json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const chatType = url.searchParams.get('chat_type');
    const receiverId = url.searchParams.get('receiver_id');

    console.log('📊 File count route: Received params:', { chatType, receiverId });

    if (!chatType || !receiverId) {
      console.error('📊 File count route: Missing params:', { chatType, receiverId });
      return json({ error: "Parámetros incompletos" }, { status: 400 });
    }

    // **ARREGLADO: Validar receiverId**
    const cleanReceiverId = String(receiverId).trim();
    if (!cleanReceiverId || cleanReceiverId === 'null' || cleanReceiverId === 'undefined') {
      console.error('📊 File count route: Invalid receiverId:', receiverId);
      return json({ count: 0, remaining: 15 });
    }

    const backendUrl = `http://localhost:8000/api/chat/file-count/${chatType}/${cleanReceiverId}`;
    console.log('📊 File count route: Calling backend URL:', backendUrl);

    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📊 File count route: Backend error:', response.status, errorText);
      return json({ count: 0, remaining: 15 });
    }

    const result = await response.json();
    console.log('📊 File count route: Result:', result);
    
    return json(result);

  } catch (error) {
    console.error('❌ File count route: Error:', error);
    return json({ count: 0, remaining: 15 });
  }
}
