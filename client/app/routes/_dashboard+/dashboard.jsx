import { useLoaderData, redirect, Link, Outlet } from "@remix-run/react";
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
  return { role, token };
}

export default function Dashboard() {
  const { role } = useLoaderData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

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
                  onClick={() => setMenuOpen(!menuOpen)}
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
              <button className="text-gray-500 hover:text-gray-700">
                <Bell size={18} />
              </button>
              <UserMenu role={role} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
            </div>
          </div>
        </nav>
      </header>

      <main className="pl-0 pr-4">
        {role === 1 ? (
          <AdminLayout menuOpen={menuOpen}>
            <Outlet />
          </AdminLayout>
        ) : (
          <UserDashboard />
        )}
      </main>
    </div>
  );
}

const UserMenu = ({ role, menuOpen, setMenuOpen }) => {
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
  
  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      <span className={`hidden md:inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${roleBadgeColor}`}>
        {roleText}
      </span>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center justify-center text-gray-500 hover:text-gray-700 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300"
        aria-expanded={menuOpen}
      >
        <span className="sr-only">Abrir menú de usuario</span>
        <User className="h-5 w-5" />
      </button>
      
      {menuOpen && <MenuDropdown />}
    </div>
  );
};

const MenuDropdown = () => (
  <div className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-40">
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

const AdminLayout = ({ children, menuOpen }) => (
  <div className="flex min-h-screen">
    <div className={`${menuOpen ? 'block' : 'hidden'} md:block sticky top-0 h-screen`}>
      <AdminDashboard />
    </div>
    <div className="flex-1 transition-all duration-200">
      <div className="max-w-full mx-auto p-6 mt-14"> {/* Ajustado el padding y margin-top */}
        {children}
      </div>
    </div>
  </div>
);