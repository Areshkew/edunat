import { useState, useEffect } from 'react';
import { Link, useNavigate, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { getSession } from "../../utils/session.server";
import { User, BookOpen, Users, MessageSquare, Star, Clock, Award, ChevronRight, Coins } from "lucide-react";

// Metadata PrimeReact
export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://unpkg.com/primereact/resources/themes/lara-light-indigo/theme.css",
    },
    {
      rel: "stylesheet",
      href: "https://unpkg.com/primereact/resources/primereact.min.css",
    },
    {
      rel: "stylesheet",
      href: "https://unpkg.com/primeicons/primeicons.css",
    },
  ];
}

export async function loader({ request }) {
  try {
    const session = await getSession(request.headers.get("Cookie") || "");
    const token = session?.get("token");
    
    // Fetch public statistics
    let stats = { users: 10, courses: 10, communities: 10, featured_courses: [] };
    
    try {
      const statsResponse = await fetch('http://localhost:8000/api/user/public/stats');
      if (statsResponse.ok) {
        stats = await statsResponse.json();
      }
    } catch (error) {
      console.error("Error fetching public stats:", error);
    }
    
    return json({
      isAuthenticated: !!token,
      role: session?.get("role") || null,
      stats: stats
    });
  } catch (error) {
    console.error("Session error:", error);
    return json({ 
      isAuthenticated: false, 
      role: null, 
      stats: { users: 10, courses: 10, communities: 10, featured_courses: [] }
    });
  }
}

export default function Index() {
  const { isAuthenticated, role, stats: initialStats } = useLoaderData();
  const [stats, setStats] = useState({ users: 0, courses: 0, communities: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const duration = 2000;
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      setTimeout(() => {
        setStats({
          users: Math.floor((initialStats.users / steps) * i),
          courses: Math.floor((initialStats.courses / steps) * i),
          communities: Math.floor((initialStats.communities / steps) * i)
        });
      }, (duration / steps) * i);
    }
  }, [initialStats]);

  // Use featured courses from API with real data
  const featuredCourses = initialStats.featured_courses && initialStats.featured_courses.length > 0 
    ? initialStats.featured_courses.map((course, index) => {
        // Add attractive badges based on course data and index
        const badges = [];
        
        // Assign different badge combinations for each course position
        if (index === 0) {
          // First course - Premium badges
          if (course.enrollment_count >= 5) badges.push("Popular");
          if (course.cost === 0) badges.push("Gratis");
          if (!badges.length) badges.push("Destacado");
          badges.push("Premium");
        } else if (index === 1) {
          // Second course - Trending badges
          if (course.status === "En progreso") badges.push("Activo");
          if (course.cost === 0) badges.push("Gratis");
          if (!badges.length) badges.push("Trending");
          badges.push("Recomendado");
        } else if (index === 2) {
          // Third course - Special badges
          if (course.status === "Próximo") badges.push("Próximamente");
          if (course.enrollment_count >= 3) badges.push("Favorito");
          if (course.cost === 0) badges.push("Gratis");
          if (!badges.length) badges.push("Especial");
          badges.push("Exclusivo");
        }
        
        // General course icons that rotate
        const courseIcons = ["📚", "🎓", "📖", "✏️", "🏆", "💡"];
        
        return {
          id: course.id,
          title: course.name,
          instructor: course.instructor,
          status: course.status,
          students: course.enrollment_count,
          cost: course.cost,
          icon: courseIcons[index % courseIcons.length],
          badges: badges.slice(0, 2) // Limit to 2 badges for clean look
        };
      })
    : [
        {
          title: "Explora nuestros cursos",
          instructor: "Edunat",
          status: "Disponible",
          students: 0,
          cost: 0,
          icon: "🚀",
          badges: ["Nuevo", "Gratis"]
        }
      ];

  const handleUserMenuClick = () => {
    setMenuOpen(!menuOpen);
  };

  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (menuOpen) {
      const handleClickOutside = (event) => {
        if (!event.target.closest('.user-menu-container')) {
          setMenuOpen(false);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-sm shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Edunat
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to={isAuthenticated ? "/dashboard/my-courses" : "/login"} className="text-gray-700 hover:text-purple-600 transition-colors">
                Cursos
              </Link>
              <Link to={isAuthenticated ? "/dashboard/my-communities" : "/login"} className="text-gray-700 hover:text-purple-600 transition-colors">
                Comunidades
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-purple-600 transition-colors">
                Acerca de
              </Link>
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative flex items-center gap-2 user-menu-container">
                <button
                  onClick={handleUserMenuClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <User className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-700">Mi cuenta</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                        onClick={handleCloseMenu}
                      >
                        Panel de control
                      </Link>
                      <Link
                        to="/dashboard/my-courses"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                        onClick={handleCloseMenu}
                      >
                        Mis Cursos
                      </Link>
                      <Link
                        to="/dashboard/my-communities"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                        onClick={handleCloseMenu}
                      >
                        Mis Comunidades
                      </Link>
                      <Link
                        to="/logout"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                        onClick={handleCloseMenu}
                      >
                        Cerrar sesión
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-purple-600 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-md"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-20 bg-gradient-to-br from-purple-50 via-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 bg-clip-text text-transparent">
                Aprende sin límites,
              </span>
              <br />
              <span className="text-gray-900">
                crece sin fronteras
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Únete a una comunidad de aprendizaje donde puedes tomar cursos, crear conexiones 
              y compartir conocimiento con personas de todo el mundo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={isAuthenticated ? "/dashboard" : "/login"}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                {isAuthenticated ? "Ir al Dashboard" : "Comenzar ahora"}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section - Remove satisfaction */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-purple-900 mb-2">
                {stats.users.toLocaleString()}+
              </h3>
              <p className="text-purple-700">Estudiantes activos</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-blue-900 mb-2">
                {stats.courses.toLocaleString()}+
              </h3>
              <p className="text-blue-700">Cursos disponibles</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
              <MessageSquare className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-indigo-900 mb-2">
                {stats.communities.toLocaleString()}+
              </h3>
              <p className="text-indigo-700">Comunidades activas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Courses */}
      <div id="courses" className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cursos destacados
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestros cursos más populares y comienza tu viaje de aprendizaje
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course, index) => (
              <div key={course.id || index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-3xl flex-shrink-0">{course.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 break-words">
                        {course.title}
                      </h3>
                      <p className="text-purple-600 font-medium truncate">
                        Instructor: {course.instructor}
                      </p>
                    </div>
                    {course.badges && course.badges.length > 0 && (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {course.badges.map((badge, badgeIndex) => (
                          <span 
                            key={badgeIndex}
                            className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                              badge === "Popular" ? "bg-yellow-100 text-yellow-800" :
                              badge === "Gratis" ? "bg-green-100 text-green-800" :
                              badge === "Nuevo" ? "bg-blue-100 text-blue-800" :
                              badge === "Activo" ? "bg-purple-100 text-purple-800" :
                              badge === "Destacado" ? "bg-red-100 text-red-800" :
                              badge === "Premium" ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800" :
                              badge === "Trending" ? "bg-gradient-to-r from-orange-100 to-red-100 text-orange-800" :
                              badge === "Recomendado" ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800" :
                              badge === "Próximamente" ? "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800" :
                              badge === "Favorito" ? "bg-gradient-to-r from-pink-100 to-red-100 text-pink-800" :
                              badge === "Especial" ? "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800" :
                              badge === "Exclusivo" ? "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800" :
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-6 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{course.students} estudiantes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{course.status}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">
                        {course.cost > 0 ? `${course.cost} pts` : 'Gratis'}
                      </span>
                    </div>
                  </div>
                  
                  <Link
                    to={isAuthenticated ? "/dashboard/search-courses" : "/login"}
                    className="block w-full text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 font-medium"
                  >
                    {isAuthenticated ? "Ver curso" : "Ingresa para ver"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para comenzar tu viaje de aprendizaje?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Únete a miles de estudiantes que ya están transformando sus carreras
          </p>
          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
          >
            {isAuthenticated ? "Ir al Dashboard" : "Comenzar gratis"}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer - Remove support section */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Edunat</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Plataforma de aprendizaje que conecta estudiantes y educadores 
                de todo el mundo para crear una comunidad de conocimiento.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Plataforma</h3>
              <ul className="space-y-2">
                <li><Link to={isAuthenticated ? "/dashboard/my-courses" : "/login"} className="hover:text-white transition-colors">Cursos</Link></li>
                <li><Link to={isAuthenticated ? "/dashboard/my-communities" : "/login"} className="hover:text-white transition-colors">Comunidades</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">Acerca de</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-500">
              &copy; 2025 Edunat. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}