import { useState, useEffect } from "react";
import { Users, ChevronLeft, ChevronRight, BarChart2, BookOpen, Settings, HelpCircle } from "lucide-react";
import { Form, useLocation } from "@remix-run/react";

export default function AdminDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const location = useLocation();

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { icon: <BarChart2 size={18} />, label: "Dashboard", path: "/dashboard/admin" },
    { icon: <Users size={18} />, label: "Usuarios", path: "/dashboard/admin/users" },
    { icon: <BookOpen size={18} />, label: "Cursos", path: "/dashboard/admin/courses" },
    { icon: <Settings size={18} />, label: "Configuración", path: "/dashboard/admin/settings" },
    { icon: <HelpCircle size={18} />, label: "Ayuda", path: "/dashboard/admin/help" },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      {/* Mobile menu button - visible on small screens */}
      {windowWidth < 768 && (
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 bg-indigo-600 text-white p-2 rounded-lg shadow-lg md:hidden"
        >
          {mobileOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      )}

      {/* Mobile Overlay */}
      {mobileOpen && windowWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 z-30" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`h-screen bg-gradient-to-b from-indigo-700 to-indigo-900 text-white shadow-lg transition-all duration-200 ease-in-out
                  ${collapsed && !mobileOpen ? 'w-14' : 'w-48'}
                  ${windowWidth < 768 && !mobileOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo area */}
          <div className="flex items-center justify-center h-14 border-b border-indigo-600">
            {!collapsed && <span className="font-semibold text-sm">Admin Panel</span>}
            {collapsed && <span className="font-bold">AP</span>}
          </div>

          {/* Toggle button - visible on desktop only */}
          {windowWidth >= 768 && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-2.5 top-20 bg-indigo-600 p-1 rounded-full shadow-md text-white hover:bg-indigo-700 focus:outline-none"
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}

          {/* Menu items */}
          <div className="py-2 flex flex-col flex-grow">
            {menuItems.map((item, index) => (
              <Form key={index} method="get" action={item.path}>
                <button
                  type="submit"
                  onClick={() => windowWidth < 768 && setMobileOpen(false)}
                  className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start pl-3'} py-2 px-2 my-0.5 mx-1.5 rounded-md transition-colors duration-150 text-xs
                            ${isActive(item.path) 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'text-indigo-100 hover:bg-indigo-600/30'}`}
                >
                  <span className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 mr-2.5'} transition-all duration-150`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </button>
              </Form>
            ))}
          </div>

          {/* Footer profile section */}
          {!collapsed && (
            <div className="mt-auto mb-3 mx-2 p-2 bg-indigo-600/60 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="font-bold text-sm text-white">A</span>
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-white">Admin</p>
                  <p className="text-xs text-indigo-200">Sesión activa</p>
                </div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mt-auto mb-3 mx-2 p-2 flex justify-center">
              <div className="h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="font-bold text-sm text-white">A</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}