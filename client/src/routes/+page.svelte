<script lang="ts">
    import "@material-design-icons/font/index.css";
    import "./main.css";
    import LoginForm from "$lib/LoginForm.svelte";
    import RegisterForm from "$lib/RegisterForm.svelte";
    import { onMount } from "svelte";

    let isMenuOpen = false;
    let authDialog: HTMLDialogElement;
    let activeForm = "login";

    onMount(() => {
        authDialog?.addEventListener("click", (e) => {
            const dialogDimensions = authDialog.getBoundingClientRect();
            if (
                e.clientX < dialogDimensions.left ||
                e.clientX > dialogDimensions.right ||
                e.clientY < dialogDimensions.top ||
                e.clientY > dialogDimensions.bottom
            ) {
                closeAuthDialog();
            }
        });
    });

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
    }

    function openAuthDialog() {
        authDialog?.showModal();
    }

    function closeAuthDialog() {
        authDialog?.close();
    }

    function handleSwitchForm(event: CustomEvent) {
        activeForm = event.detail;
    }

    function handleEscape(event: KeyboardEvent) {
        if (event.key === "Escape") {
            closeAuthDialog();
        }
    }
</script>

<header>
    <nav class="container">
        <div class="logo">
            <img src="Logo.webp" alt="Logo Vamos1a" width="50" />
        </div>
        <button class="menu-toggle" on:click={toggleMenu}>
            <span class="material-icons">{isMenuOpen ? "close" : "menu"}</span>
        </button>
        <ul class:active={isMenuOpen}>
            <li><a href="/" on:click={toggleMenu}>Inicio</a></li>
            <li>
                <a href="#" on:click={toggleMenu}>Términos y Condiciones</a>
            </li>
            <li>
                <button
                    class="auth-button"
                    on:click={() => {
                        openAuthDialog();
                        toggleMenu();
                    }}
                    aria-label="Abrir formulario de autenticación"
                >
                    <span class="material-icons">person</span>
                </button>
            </li>
        </ul>
    </nav>
</header>

<dialog
    bind:this={authDialog}
    class="auth-dialog"
    aria-labelledby="auth-form-title"
>
    <div class="auth-container">
        {#if activeForm === "login"}
            <LoginForm on:switchForm={handleSwitchForm} />
        {:else}
            <RegisterForm on:switchForm={handleSwitchForm} />
        {/if}
    </div>
</dialog>

<main>
    <section id="hero" class="hero-section">
        <div class="hero-content">
            <h1>Transforma Tu Futuro</h1>
            <p>
                Adquiere las habilidades para triunfar en el competitivo mundo
                laboral.
            </p>
            <a href="#" class="cta-button">Comienza ahora</a>
        </div>
    </section>

    <section id="servicios" class="section">
        <div class="container">
            <h2 class="section-title">Nuestros Servicios</h2>
            <div class="card-container">
                <div class="card">
                    <img src="cohortes.webp" alt="Dos cohortes por año" />
                    <div class="card-content">
                        <h3>DOS COHORTES POR AÑO</h3>
                        <p>
                            Ofrecemos dos períodos de inscripción anuales para
                            adaptarnos a tu agenda.
                        </p>
                    </div>
                </div>
                <div class="card">
                    <img src="vacation.webp" alt="Curso vacacional gratuito" />
                    <div class="card-content">
                        <h3>UN CURSO VACACIONAL GRATUITO</h3>
                        <p>
                            Aprovecha tu tiempo libre con nuestro curso
                            vacacional sin costo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="cursos" class="section">
        <div class="container">
            <h2 class="section-title">Cursos Populares</h2>
            <div class="courses-grid">
                <div class="course-item">
                    <img src="maths.webp" alt="Matemáticas para la Vida" />
                    <div class="course-overlay">
                        <h3>Matemáticas para la Vida</h3>
                        <p>
                            Aprende conceptos matemáticos esenciales para la
                            vida diaria y el trabajo.
                        </p>
                    </div>
                </div>
                <div class="course-item">
                    <img src="digital.webp" alt="Alfabetización Digital" />
                    <div class="course-overlay">
                        <h3>Alfabetización Digital</h3>
                        <p>
                            Domina las herramientas digitales básicas para
                            navegar en el mundo moderno.
                        </p>
                    </div>
                </div>
                <div class="course-item">
                    <img src="coding.webp" alt="Programación de Computadoras" />
                    <div class="course-overlay">
                        <h3>Programación de Computadoras</h3>
                        <p>
                            Adquiere habilidades de programación para crear
                            aplicaciones y soluciones digitales.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<footer>
    <div class="container">
        <div class="footer-content">
            <div class="footer-logo">
                <h3>Vamos1a</h3>
                <img src="Logo.webp" alt="Logo Vamos1a" width="100" />
            </div>
    
            <div class="footer-poem">
                <p>Que seas feliz.</p>
                <p>Que estés libre de sufrimiento.</p>
                <p>Que puedas alcanzar la paz y el gozo.</p>
            </div>
            
            <div class="footer-contact">
                <h4>Contáctanos</h4>
                <p>Email: info@escuelascomunitarias.com</p>
                <p>Teléfono: +1 234 567 890</p>
                <p>Dirección: Calle Principal 123, Ciudad, País</p>
            </div>
        </div>
        <div class="footer-bottom">
            <p>"YO SOY PORQUE NOSOTROS SOMOS!!!"</p>
            <p>
                &copy; 2024 Servicios para Escuelas Comunitarias de Liderazgo.
                Todos los derechos reservados.
            </p>
        </div>
    </div>
</footer>
