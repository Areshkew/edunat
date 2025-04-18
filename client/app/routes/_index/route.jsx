import { useState, useEffect } from 'react';
import { Link, useNavigate, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { getSession } from "../../utils/session.server";
import { User } from "lucide-react";

// PrimeReact imports
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Menubar } from 'primereact/menubar';
import { ScrollTop } from 'primereact/scrolltop';
import { Divider } from 'primereact/divider';

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
    
    // Return authentication status and role as JSON
    return json({
      isAuthenticated: !!token,
      role: session?.get("role") || null
    });
  } catch (error) {
    console.error("Session error:", error);
    // Return default unauthenticated state if there's an error
    return json({ isAuthenticated: false, role: null });
  }
}

export default function Index() {
  const { isAuthenticated, role } = useLoaderData();
  const [stats, setStats] = useState({ students: 0, courses: 0, satisfaction: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const duration = 2000;
    const steps = 50;
    const targetValues = { students: 15000, courses: 250, satisfaction: 98 };
    
    for (let i = 0; i <= steps; i++) {
      setTimeout(() => {
        setStats({
          students: Math.floor((targetValues.students / steps) * i),
          courses: Math.floor((targetValues.courses / steps) * i),
          satisfaction: Math.floor((targetValues.satisfaction / steps) * i)
        });
      }, (duration / steps) * i);
    }
  }, []);

  const menuItems = [
    {
      label: 'Cursos',
      icon: 'pi pi-book',
      url: '/cursos'
    },
    {
      label: 'Profesores',
      icon: 'pi pi-users',
      url: '/profesores'
    },
    {
      label: 'Para empresas',
      icon: 'pi pi-briefcase',
      url: '/empresas'
    },
    {
      label: 'Blog',
      icon: 'pi pi-pencil',
      url: '/blog'
    }
  ];

  const featuredCourses = [
    {
      title: "Desarrollo Web Full Stack",
      category: "Programación",
      rating: 4.8,
      students: "3.2k",
      duration: "48h",
      price: "$89.99",
      icon: "pi pi-desktop"
    },
    {
      title: "Diseño UX/UI Avanzado",
      category: "Diseño",
      rating: 4.9,
      students: "2.8k",
      duration: "36h",
      price: "$79.99",
      icon: "pi pi-palette"
    },
    {
      title: "Marketing Digital",
      category: "Marketing",
      rating: 4.7,
      students: "4.1k",
      duration: "32h",
      price: "$69.99",
      icon: "pi pi-chart-line"
    }
  ];

  const footerSections = [
    {
      title: "Plataforma",
      links: [
        { label: "Cursos", url: "/cursos" },
        { label: "Profesores", url: "/profesores" },
        { label: "Empresas", url: "/empresas" }
      ]
    },
    {
      title: "Recursos",
      links: [
        { label: "Blog", url: "/blog" },
        { label: "Guías", url: "/guias" },
        { label: "Tutoriales", url: "/tutoriales" }
      ]
    },
    {
      title: "Soporte",
      links: [
        { label: "Contacto", url: "/contacto" },
        { label: "Centro de ayuda", url: "/ayuda" },
        { label: "FAQ", url: "/faq" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacidad", url: "/privacidad" },
        { label: "Términos", url: "/terminos" },
        { label: "Cookies", url: "/cookies" }
      ]
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <div className="fixed w-full z-50 bg-white shadow-sm">
        <Menubar 
          model={menuItems}
          start={<div className="flex items-center gap-2">
            <i className="pi pi-book-open text-2xl text-blue-600"></i>
            <span className="text-xl font-bold text-blue-600">Edunat</span>
          </div>}
          end={
            isAuthenticated ? (
              <div className="relative flex items-center gap-2 user-menu-container">
                <span className="text-gray-700">Usuario</span>
                <button
                  onClick={handleUserMenuClick}
                  className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md flex items-center"
                >
                  <User className="h-6 w-6" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleCloseMenu}
                      >
                        Panel de control
                      </Link>
                      <Link
                        to="/configurar"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleCloseMenu}
                      >
                        Configurar
                      </Link>
                      <Link
                        to="/logout"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleCloseMenu}
                      >
                        Cerrar sesión
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button 
                label="Acceder"
                text 
                onClick={() => navigate('/login')}
              />
            )
          }
        />
      </div>

      {/* Hero Section */}
      <div className="pt-24 bg-gradient-to-br from-blue-50 to-blue-100 min-h-[600px] flex items-center">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                Aprende las habilidades del futuro <span className="text-blue-600">hoy</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Accede a más de {stats.courses} cursos impartidos por expertos de la industria
                y únete a una comunidad de {stats.students.toLocaleString()} estudiantes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button label="Comenzar ahora" severity="info" size="large" raised />
                <Button label="Ver cursos" text size="large" />
              </div>
            </div>
            <div className="hidden lg:block">
              {/* Image placeholder if needed */}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 -mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "pi pi-users", label: "Estudiantes activos", value: stats.students },
            { icon: "pi pi-book", label: "Cursos disponibles", value: stats.courses },
            { icon: "pi pi-star", label: "Satisfacción", value: `${stats.satisfaction}%` }
          ].map((stat, index) => (
            <Card key={index} className="shadow-lg text-center p-5">
              <i className={`${stat.icon} text-4xl text-blue-600 mb-3`}></i>
              <h3 className="text-3xl font-bold mb-2">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() + '+' : stat.value}
              </h3>
              <p className="text-gray-600">{stat.label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Featured Courses */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Cursos destacados</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explora nuestros cursos más populares y comienza tu viaje de aprendizaje
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCourses.map((course, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <i className={`${course.icon} text-xl text-blue-600`}></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4">{course.category}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span><i className="pi pi-star-fill text-yellow-400 mr-1"></i> {course.rating}</span>
                    <span><i className="pi pi-users mr-1"></i> {course.students}</span>
                    <span><i className="pi pi-clock mr-1"></i> {course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-blue-600">{course.price}</span>
                    <Button label="Ver curso" text />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            ¿Listo para comenzar tu viaje de aprendizaje?
          </h2>
          <Button 
            label="Comenzar ahora" 
            severity="info"
            raised
            size="large"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerSections.map((section, index) => (
              <div key={index}>
                <h3 className="text-white font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link to={link.url} className="hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Divider className="my-8 border-gray-800" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <i className="pi pi-book-open text-2xl text-blue-600"></i>
              <span className="text-xl font-bold text-white">Edunat</span>
            </div>
            <div className="flex gap-4">
              {["facebook", "twitter", "linkedin", "youtube"].map((social) => (
                <Button key={social} icon={`pi pi-${social}`} text rounded />
              ))}
            </div>
          </div>
          <div className="text-center mt-8 text-gray-500">
            <p>&copy; 2025 Edunat. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <ScrollTop />
    </div>
  );
}