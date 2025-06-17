import { useState, useEffect } from "react";
import { Users, ChevronLeft, ChevronRight, BarChart2, BookOpen, Settings, HelpCircle, Boxes, DollarSign, Menu as MenuIcon } from "lucide-react";
import { Form, useLocation } from "@remix-run/react";

export default function AdminDashboard({ mobileOpen, setMobileOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const location = useLocation();

  // Auto-collapse on small screens only for initial state
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 768) {
        // En móvil, el sidebar inicialmente está colapsado, pero luego se muestra completo
        setCollapsed(false); // Asegura que al abrir el sidebar en móvil, se muestre completo
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainMenuItems = [
    { icon: <BarChart2 size={18} />, label: "Dashboard", path: "/dashboard/admin-home" },
    { icon: <Users size={18} />, label: "Usuarios", path: "/dashboard/users" },
    { icon: <Boxes size={18} />, label: "Comunidades", path: "/dashboard/communities" },
    { icon: <DollarSign size={18} />, label: "Transacciones", path: "/dashboard/transactions" },
    { icon: <BookOpen size={18} />, label: "Cursos", path: "/dashboard/courses" },
  ];

  const bottomMenuItems = [
    { icon: <HelpCircle size={18} />, label: "Ayuda", path: "/dashboard/admin-help" },
  ];

  const isActive = (path) => {
    // Special case for dashboard main path - now redirects to admin-home
    if (path === "/dashboard/admin-home") {
      return location.pathname === "/dashboard" || location.pathname === "/dashboard/" || location.pathname === "/dashboard/admin-home";
    }
    // For other paths, check if the current path starts with the menu item path
    return location.pathname.startsWith(`${path}/`) || location.pathname === path;
  };

  // En móvil, cuando se abre el sidebar, asegurarse que no esté colapsado
  useEffect(() => {
    if (windowWidth < 768 && mobileOpen) {
      setCollapsed(false); // Muestra versión completa en móvil cuando está abierto
    }
  }, [mobileOpen, windowWidth]);

  // Notify parent component when collapse state changes
  useEffect(() => {
    // Create a custom event with sidebar width information
    const event = new CustomEvent('admin-sidebar-change', { 
      detail: { 
        collapsed: collapsed,
        width: collapsed ? 56 : 192  // w-14 (56px) cuando collapsed, w-48 (192px) cuando expandido
      } 
    });
    document.dispatchEvent(event);
  }, [collapsed]);

  return (
    <>
      {/* Sidebar - Increased z-index for mobile */}
      <div 
        className={`bg-gradient-to-b from-indigo-700 to-indigo-900 text-white shadow-lg transition-all duration-200 ease-in-out
                  ${(collapsed && !(windowWidth < 768 && mobileOpen)) ? 'w-14' : 'w-48'}
                  ${windowWidth < 768 && !mobileOpen ? '-translate-x-full' : 'translate-x-0'}`}
        style={{ height: 'calc(100vh - 56px)' }} // Fixed height calculation
      >
        {/* Inner container */}
        <div className="flex flex-col h-full relative">
          {/* Logo area */}
          <div className="flex items-center justify-center h-14 border-b border-indigo-600">
            {!collapsed && <span className="font-semibold text-sm">Admin Panel</span>}
            {collapsed && <span className="font-bold">AP</span>}
          </div>

          {/* Toggle button - INCREASED z-index and repositioned */}
          {windowWidth >= 768 && (
            <div className="absolute -right-3 top-20 z-20">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="bg-indigo-600 p-1 rounded-full shadow-md text-white hover:bg-indigo-700 focus:outline-none"
              >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>
          )}

          {/* Menu items - WITH overflow-y-auto ONLY HERE */}
          <div className="py-2 flex flex-col flex-grow overflow-y-auto">
            {/* Main menu items */}
            {mainMenuItems.map((item, index) => (
              <Form key={index} method="get" action={item.path}>
                <button
                  type="submit"
                  onClick={(e) => {
                    if (windowWidth < 768) {
                      // Allow the form submission to complete before closing the sidebar
                      setTimeout(() => setMobileOpen(false), 100);
                    }
                  }}
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

            {/* Bottom menu items */}
            <div className="mt-auto">
              {bottomMenuItems.map((item, index) => (
                <Form key={index} method="get" action={item.path}>
                  <button
                    type="submit"
                    onClick={(e) => {
                      if (windowWidth < 768) {
                        // Allow the form submission to complete before closing the sidebar
                        setTimeout(() => setMobileOpen(false), 100);
                      }
                    }}
                    className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start pl-3'} py-2 px-2 my-0.5 mx-1 ml-1 rounded-md transition-colors duration-150 text-xs
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