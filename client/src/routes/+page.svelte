<script lang="ts">
    import "@material-design-icons/font/index.css";
    import "./main.css";
    import Header from "$lib/shared/Header.svelte";
    import Footer from "$lib/shared/Footer.svelte";
</script>

<!-- Header -->
<Header> </Header>

<!-- Content -->
<main>
    <section id="hero" class="hero">
        <div class="hero__content">
            <h1>Transforma Tu Futuro</h1>
            <p>
                Adquiere las habilidades para triunfar en el competitivo mundo
                laboral.
            </p>
            <a href="/terminos" class="cta-button">Comienza ahora</a>
        </div>
    </section>

    <section id="servicios" class="section">
        <div class="container">
            <h2 class="section-title">Nuestros Servicios</h2>
            <div class="card__container">
                <div class="card">
                    <img src="cohortes.webp" alt="Dos cohortes por año" />
                    <div class="card__content">
                        <h3>DOS COHORTES POR AÑO</h3>
                        <p>
                            Ofrecemos dos períodos de inscripción anuales para
                            adaptarnos a tu agenda.
                        </p>
                    </div>
                </div>
                <div class="card">
                    <img src="vacation.webp" alt="Curso vacacional gratuito" />
                    <div class="card__content">
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
            <div class="cursos__grid">
                <div class="cursos__item">
                    <img src="maths.webp" alt="Matemáticas para la Vida" />
                    <div class="cursos__overlay">
                        <h3>Matemáticas para la Vida</h3>
                        <p>
                            Aprende conceptos matemáticos esenciales para la
                            vida diaria y el trabajo.
                        </p>
                    </div>
                </div>
                <div class="cursos__item">
                    <img src="digital.webp" alt="Alfabetización Digital" />
                    <div class="cursos__overlay">
                        <h3>Alfabetización Digital</h3>
                        <p>
                            Domina las herramientas digitales básicas para
                            navegar en el mundo moderno.
                        </p>
                    </div>
                </div>
                <div class="cursos__item">
                    <img src="coding.webp" alt="Programación de Computadoras" />
                    <div class="cursos__overlay">
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

<Footer> </Footer>
