import { useState, useEffect } from "react";
import { Home, ChevronLeft, ChevronRight, Users, ChevronDown, ChevronUp, Settings, HelpCircle, Coins, BookOpen } from "lucide-react";
import { Form, useLocation, Link } from "@remix-run/react";

export default function UserDashboard({ mobileOpen, setMobileOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [communitiesOpen, setCommunitiesOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
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

  // Notify parent component when collapse state changes
  useEffect(() => {
    // Create a custom event with sidebar width information
    const event = new CustomEvent('user-sidebar-change', { 
      detail: { 
        collapsed: collapsed,
        width: collapsed ? 56 : 192  // w-14 (56px) cuando collapsed, w-48 (192px) cuando expandido
      } 
    });
    document.dispatchEvent(event);
  }, [collapsed]);

  const mainMenuItems = [
    { icon: <Home size={18} />, label: "Dashboard", path: "/dashboard/user-home" },
  ];
  
  const communitySubItems = [
    { label: "Mis Comunidades", path: "/dashboard/my-communities" },
    { label: "Buscar Comunidades", path: "/dashboard/search-communities" },
  ];

  const courseSubItems = [
    { label: "Mis Cursos", path: "/dashboard/my-courses" },
    { label: "Buscar Cursos", path: "/dashboard/search-courses" },
  ];

  const bottomMenuItems = [
    { icon: <Coins size={18} />, label: "Mis Transacciones", path: "/dashboard/my-transactions" },
    { icon: <HelpCircle size={18} />, label: "Ayuda", path: "/dashboard/user-help" },
  ];

  const isActive = (path) => {
    // Special case for dashboard main path - now redirects to user-home
    if (path === "/dashboard/user-home") {
      return location.pathname === "/dashboard" || 
             location.pathname === "/dashboard/" || 
             location.pathname === "/dashboard/user-home";
    }
    // For other paths, check if the current path starts with the menu item path
    return location.pathname.startsWith(`${path}/`) || location.pathname === path;
  };

  const isCommunitySectionActive = () => {
    return communitySubItems.some(item => isActive(item.path));
  };

  const isCoursesSectionActive = () => {
    return courseSubItems.some(item => isActive(item.path));
  };

  // Mobile menu button is now managed by parent component
  const MobileMenuButton = () => {
    return null; // We're moving this to the parent dashboard component
  };
  
  // En móvil, cuando se abre el sidebar, asegurarse que no esté colapsado
  useEffect(() => {
    if (windowWidth < 768 && mobileOpen) {
      setCollapsed(false); // Muestra versión completa en móvil cuando está abierto 
    }
  }, [mobileOpen, windowWidth]);

  return (
    <>
      {/* Mobile menu button removed from here */}
      
      {/* Sidebar - Increased z-index for mobile */}
      <div 
        className={`bg-gradient-to-b from-indigo-700 to-indigo-900 text-white shadow-lg transition-all duration-200 ease-in-out
                  ${(collapsed && !(windowWidth < 768 && mobileOpen)) ? 'w-14' : 'w-48'}
                  ${windowWidth < 768 && !mobileOpen ? '-translate-x-full' : 'translate-x-0'}`}
        style={{ height: 'calc(100vh - 56px)' }} // Fixed height calculation
      >
        {/* Inner container - removed overflow-y-auto */}
        <div className="flex flex-col h-full relative">
          {/* Logo area */}
          <div className="flex items-center justify-center h-14 border-b border-indigo-600">
            {!collapsed && <span className="font-semibold text-sm">Panel de Usuario</span>}
            {collapsed && <span className="font-bold">UP</span>}
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

          {/* Menu items - WITH overflow-y-auto ONLY HERE for scrolling menu items */}
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

            {/* Courses section with dropdown */}
            <div className="mt-1">
              <button
                onClick={() => !collapsed && setCoursesOpen(!coursesOpen)}
                className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between pl-3 pr-2'} py-2 my-0.5 mx-1.5 w-[calc(100%-12px)] rounded-md transition-colors duration-150 text-xs
                          ${isCoursesSectionActive() 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-indigo-100 hover:bg-indigo-600/30'}`}
              >
                <div className="flex items-center">
                  <span className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 mr-2.5'} transition-all duration-150`}>
                    <BookOpen size={collapsed ? 18 : 16} />
                  </span>
                  {!collapsed && <span className="font-medium">Cursos</span>}
                </div>
                {!collapsed && (
                  <span className="flex-shrink-0">
                    {coursesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                )}
              </button>
              
              {/* Course subitems dropdown */}
              {!collapsed && coursesOpen && (
                <div className="ml-4 pl-2 border-l border-indigo-600/40">
                  {courseSubItems.map((subItem, index) => (
                    <Form key={index} method="get" action={subItem.path}>
                      <button
                        type="submit"
                        onClick={(e) => {
                          if (windowWidth < 768) {
                            // Allow the form submission to complete before closing the sidebar
                            setTimeout(() => setMobileOpen(false), 100);
                          }
                        }}
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
                        onClick={(e) => {
                          if (windowWidth < 768) {
                            // Allow the form submission to complete before closing the sidebar
                            setTimeout(() => setMobileOpen(false), 100);
                          }
                        }}
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
