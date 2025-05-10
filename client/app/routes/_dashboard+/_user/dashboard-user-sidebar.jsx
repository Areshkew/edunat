import { useState, useEffect } from "react";
import { Home, ChevronLeft, ChevronRight, Users, ChevronDown, ChevronUp, Settings, HelpCircle } from "lucide-react";
import { Form, useLocation, Link } from "@remix-run/react";

export default function UserDashboard({ mobileOpen, setMobileOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [communitiesOpen, setCommunitiesOpen] = useState(false);
  const location = useLocation();

  // Auto-collapse on small screens only for initial state
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 768) {
        setCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainMenuItems = [
    { icon: <Home size={18} />, label: "Dashboard", path: "/dashboard" },
  ];
  
  const communitySubItems = [
    { label: "Mis Comunidades", path: "/dashboard/my-communities" },
    { label: "Buscar Comunidades", path: "/dashboard/search-communities" },
  ];

  const bottomMenuItems = [
    { icon: <Settings size={18} />, label: "Configuración", path: "/dashboard/user-settings" },
    { icon: <HelpCircle size={18} />, label: "Ayuda", path: "/dashboard/help" },
  ];

  const isActive = (path) => {
    // Special case for dashboard main path
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/dashboard/";
    }
    // For other paths, check if the current path starts with the menu item path
    return location.pathname.startsWith(`${path}/`) || location.pathname === path;
  };

  const isCommunitySectionActive = () => {
    return communitySubItems.some(item => isActive(item.path));
  };

  // Mobile menu button managed by parent component
  const MobileMenuButton = () => {
    if (windowWidth < 768) {
      return (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 bg-indigo-600 text-white p-2 rounded-lg shadow-lg md:hidden"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      );
    }
    return null;
  };
  
  // En móvil, cuando se abre el sidebar, asegurarse que no esté colapsado
  useEffect(() => {
    if (windowWidth < 768 && mobileOpen) {
      setCollapsed(false); // Muestra versión completa en móvil cuando está abierto
    }
  }, [mobileOpen, windowWidth]);

  return (
    <>
      {/* Mobile menu button - highest z-index */}
      <MobileMenuButton />
      
      {/* Mobile Overlay */}
      {mobileOpen && windowWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 z-30" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - very high z-index to ensure it's above all content */}
      <div 
        className={`h-screen bg-gradient-to-b from-indigo-700 to-indigo-900 text-white shadow-lg transition-all duration-200 ease-in-out fixed md:sticky top-0 z-40
                  ${(collapsed && !(windowWidth < 768 && mobileOpen)) ? 'w-14' : 'w-48'}
                  ${windowWidth < 768 && !mobileOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo area */}
          <div className="flex items-center justify-center h-14 border-b border-indigo-600">
            {!collapsed && <span className="font-semibold text-sm">Panel de Usuario</span>}
            {collapsed && <span className="font-bold">UP</span>}
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
            {/* Main menu items */}
            {mainMenuItems.map((item, index) => (
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

            {/* Communities section with dropdown */}
            <div className="mt-1">
              <button
                onClick={() => !collapsed && setCommunitiesOpen(!communitiesOpen)}
                className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between pl-3 pr-2'} py-2 my-0.5 mx-1.5 w-[calc(100%-12px)] rounded-md transition-colors duration-150 text-xs
                          ${isCommunitySectionActive() 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-indigo-100 hover:bg-indigo-600/30'}`}
              >
                <div className="flex items-center">
                  <span className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 mr-2.5'} transition-all duration-150`}>
                    <Users size={collapsed ? 18 : 16} />
                  </span>
                  {!collapsed && <span className="font-medium">Comunidades</span>}
                </div>
                {!collapsed && (
                  <span className="flex-shrink-0">
                    {communitiesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                )}
              </button>
              
              {/* Community subitems dropdown */}
              {!collapsed && communitiesOpen && (
                <div className="ml-4 pl-2 border-l border-indigo-600/40">
                  {communitySubItems.map((subItem, index) => (
                    <Form key={index} method="get" action={subItem.path}>
                      <button
                        type="submit"
                        onClick={() => windowWidth < 768 && setMobileOpen(false)}
                        className={`flex items-center text-xs py-1.5 px-2 my-0.5 w-[calc(100%-8px)] rounded-md transition-colors duration-150
                                  ${isActive(subItem.path) 
                                    ? 'bg-indigo-600/70 text-white' 
                                    : 'text-indigo-100 hover:bg-indigo-600/20'}`}
                      >
                        <span className="truncate">{subItem.label}</span>
                      </button>
                    </Form>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom menu items */}
            <div className="mt-auto">
              {bottomMenuItems.map((item, index) => (
                <Form key={index} method="get" action={item.path}>
                  <button
                    type="submit"
                    onClick={() => windowWidth < 768 && setMobileOpen(false)}
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
            <div className="mt-3 mb-3 mx-2 p-2 bg-indigo-600/60 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="font-bold text-sm text-white">U</span>
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-white">Usuario</p>
                  <p className="text-xs text-indigo-200">Sesión activa</p>
                </div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mt-auto mb-3 mx-2 p-2 flex justify-center">
              <div className="h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="font-bold text-sm text-white">U</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
