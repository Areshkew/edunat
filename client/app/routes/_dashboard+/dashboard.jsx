import { useLoaderData, redirect, Link, Outlet, useFetcher } from "@remix-run/react";
import { getSession } from "../../utils/session.server";
import { useState, useEffect, useRef } from "react";
import { User, LogOut, Settings, Bell, Menu, BookOpen } from "lucide-react";
import AdminDashboard from "./_admin/dashboard-admin-sidebar";
import UserDashboard from "./_user/dashboard-user-sidebar";

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie") || "");
  const token = session.get("token");
  const role = session.get("role");

  if (!token) return redirect("/login");
  
  // Fetch user data with correctly formatted request
  try {
    const response = await fetch("http://localhost:8000/api/user/userdata", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // The API expects fields as a direct array, not wrapped in an object
      body: JSON.stringify([
        "email", "username", "photo", "points"
      ])
    });

    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("Failed to fetch user data");
    }
    
    const userData = await response.json();
    return { role, token, userData };
  } catch (error) {
    return { role, token, userData: null };
  }
}

export default function Dashboard() {
  const { role, token, userData: initialUserData } = useLoaderData();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [userData, setUserData] = useState(initialUserData);
  const userDataFetcher = useFetcher();

  useEffect(() => {
    // Initialize with data from loader
    setUserData(initialUserData);
  }, [initialUserData]);

  // Function to refresh user data
  const refreshUserData = async () => {
    userDataFetcher.submit(
      { fields: JSON.stringify(["email", "username", "photo", "points"]) },
      { method: "post", action: "/dashboard/refresh-user-data" }
    );
  };

  // Check for points updates from sessionStorage
  useEffect(() => {
    const checkForPointsUpdate = () => {
      try {
        const pointsUpdated = sessionStorage.getItem('pointsUpdated');
        if (pointsUpdated === 'true') {
          // Clear the flag
          sessionStorage.removeItem('pointsUpdated');
          // Refresh user data
          refreshUserData();
        }
      } catch (e) {
        // Ignore errors with sessionStorage
      }
    };
    
    // Check when the component mounts
    checkForPointsUpdate();
    
    // Also set up a timer to periodically check for updates
    const intervalId = setInterval(checkForPointsUpdate, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Update userData when fetcher returns new data
  useEffect(() => {
    if (userDataFetcher.data && userDataFetcher.state === 'idle') {
      setUserData(userDataFetcher.data);
    }
  }, [userDataFetcher.data, userDataFetcher.state]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm fixed w-full z-30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              {windowWidth < 768 && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="mr-3 text-gray-500 hover:text-gray-700 focus:outline-none md:hidden"
                >
                  <Menu size={20} />
                </button>
              )}
              <div className="flex items-center space-x-3">
                <div className="text-indigo-600">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h1 className="text-lg font-semibold text-indigo-600 tracking-wide">
                  {windowWidth >= 768 ? 'EduNat Platforma' : 'EduNat'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {userData && userData.points !== undefined && (
                <div className="hidden sm:flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 rounded-full border border-amber-200">
                  <div className="w-3 h-3 bg-amber-400 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-amber-800">{userData.points} Puntos</span>
                </div>
              )}
              <button className="text-gray-500 hover:text-gray-700">
                <Bell size={18} />
              </button>
              <UserMenu role={role} menuOpen={userMenuOpen} setMenuOpen={setUserMenuOpen} userData={userData} />
            </div>
          </div>
        </nav>
      </header>

      <main className="pl-0 pr-4">
        {role === 1 ? (
          <AdminLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
            <Outlet />
          </AdminLayout>
        ) : (
          <UserLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
            <Outlet />
          </UserLayout> 
        )}
      </main>
    </div>
  );
}

const UserMenu = ({ role, menuOpen, setMenuOpen, userData }) => {
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen, setMenuOpen]);
  
  const roleText = role === 1 ? "Administrador" : "Usuario";
  const roleBadgeColor = role === 1 ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800";
  
  // Check if we have valid user photo
  const hasValidPhoto = userData?.photo && userData.photo.trim() !== "";
  
  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      <span className={`hidden md:inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${roleBadgeColor}`}>
        {roleText}
      </span>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full"
        aria-expanded={menuOpen}
      >
        <span className="sr-only">Abrir menú de usuario</span>
        {hasValidPhoto ? (
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
            <img 
              src={userData.photo} 
              alt="Foto de perfil"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`;
              }}
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
            <User className="h-4 w-4 text-gray-500" />
          </div>
        )}
      </button>
      
      {menuOpen && <MenuDropdown userData={userData} />}
    </div>
  );
};

const MenuDropdown = ({ userData }) => (
  <div className="absolute right-0 top-full mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-40">
    {userData && (
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          {userData.photo ? (
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img 
                src={userData.photo} 
                alt="Perfil" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                }}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userData.name || userData.username || "Usuario"}
            </p>
            {userData.email && (
              <p className="text-xs text-gray-500 truncate">{userData.email}</p>
            )}
            {userData.points !== undefined && (
              <div className="mt-1 flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-amber-400 rounded-full"></div>
                <span className="text-xs font-medium text-amber-700">{userData.points} Puntos</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    <div className="py-1">
      <Link 
        to="/configurar" 
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        <Settings className="mr-2 h-4 w-4 text-gray-500" />
        Configurar
      </Link>
      <Link 
        to="/logout" 
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        <LogOut className="mr-2 h-4 w-4 text-gray-500" />
        Cerrar sesión
      </Link>
    </div>
  </div>
);

const AdminLayout = ({ children, sidebarOpen, setSidebarOpen }) => (
  <div className="flex min-h-screen">
    <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block sticky top-0 h-screen z-20`}>
      <AdminDashboard mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />
    </div>
    <div className="flex-1 transition-all duration-200">
      <div className="max-w-full mx-auto p-6 mt-14">
        {children}
      </div>
    </div>
  </div>
);

const UserLayout = ({ children, sidebarOpen, setSidebarOpen }) => (
  <div className="flex min-h-screen">
    <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block sticky top-0 h-screen z-20`}>
      <UserDashboard mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />
    </div>
    <div className="flex-1 transition-all duration-200">
      <div className="max-w-full mx-auto p-6 mt-14">
        {children}
      </div>
    </div>
  </div>
);