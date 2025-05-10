import { json } from "@remix-run/node";
import { getSession } from "../../utils/session.server";

export async function action({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const formData = await request.formData();
  
  let fields;
  try {
    // Parse the fields array from the form data
    fields = JSON.parse(formData.get("fields") || "[]");
  } catch (e) {
    fields = ["email", "username", "photo", "points"]; // Default fields
  }

  try {
    // Fetch the user data
    const response = await fetch("http://localhost:8000/api/user/userdata", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fields)
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }
    
    const userData = await response.json();
    return json(userData);
  } catch (error) {
    return json({ error: "Error refreshing user data" });
  }
}
