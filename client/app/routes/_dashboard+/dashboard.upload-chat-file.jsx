import { json } from "@remix-run/node";
import { getSession } from "../../utils/session.server";

export async function action({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");

  if (!token) {
    return json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const chatType = formData.get('chat_type');
    const receiverId = formData.get('receiver_id');

    console.log('📁 Upload route: Received data:', {
      hasFile: !!file,
      chatType,
      receiverId,
      fileName: file?.name,
      fileSize: file?.size
    });

    if (!file || !chatType || !receiverId) {
      console.error('❌ Upload route: Missing required fields:', {
        hasFile: !!file,
        hasChatType: !!chatType,
        hasReceiverId: !!receiverId
      });
      return json({ error: "Datos incompletos" }, { status: 400 });
    }

    // **ARREGLADO: Validar receiverId más estrictamente**
    const cleanReceiverId = String(receiverId).trim();
    if (!cleanReceiverId || cleanReceiverId === 'null' || cleanReceiverId === 'undefined' || cleanReceiverId === '') {
      console.error('❌ Upload route: Invalid receiverId:', receiverId);
      return json({ error: "ID de receptor inválido" }, { status: 400 });
    }

    // Crear el FormData para enviar al backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('chat_type', chatType);
    backendFormData.append('receiver_id', cleanReceiverId);

    console.log('🚀 Upload route: Sending to backend with receiverId:', cleanReceiverId);

    const response = await fetch('http://localhost:8000/api/chat/upload-file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: backendFormData
    });

    const responseText = await response.text();
    console.log('📥 Upload route: Raw response:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { detail: 'Error del servidor' };
      }
      console.error('❌ Upload route: Backend error:', errorData);
      return json({ error: errorData.detail || 'Error al subir archivo' }, { status: response.status });
    }

    const result = JSON.parse(responseText);
    console.log('✅ Upload route: Success:', result);
    
    return json({ 
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Upload route: Exception:', error);
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
