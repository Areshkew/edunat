<footer>
    <div class="container">
        <div class="footer__content">
            <div class="footer__logo">
                <h3>Vamos1a</h3>
                <img src="Logo.webp" alt="Logo Vamos1a" width="100" />
            </div>
    
            <div class="footer__poem">
                <p>Que seas feliz.</p>
                <p>Que estés libre de sufrimiento.</p>
                <p>Que puedas alcanzar la paz y el gozo.</p>
            </div>
            
            <div class="footer__contact">
                <h4>Contáctanos</h4>
                <p>Email: info@escuelascomunitarias.com</p>
                <p>Teléfono: +1 234 567 890</p>
                <p>Dirección: Calle Principal 123, Ciudad, País</p>
            </div>
        </div>
        <div class="footer__bottom">
            <p>"¡¡¡ YO SOY PORQUE NOSOTROS SOMOS !!!"</p>
            <p>
                &copy; 2024 Servicios para Escuelas Comunitarias de Liderazgo.
                Todos los derechos reservados.
            </p>
        </div>
    </div>
</footer>

<style>
    footer {
        background-color: var(--primary-color);
        padding: 60px 0;
        color: #fff;
        text-align: center;
    }
    .footer__content {
        display: flex;
        justify-content: space-around;
        gap: 1.5rem;
        flex-wrap: wrap;
        padding-bottom: 20px;
        border-bottom: 1px solid #fff;
    }
    .footer__bottom {
        padding-top: 20px;
        font-size: 0.9rem;
        color: #bbb;
    }
    .footer__poem {
        text-align: center;
    }

    @media (max-width: 768px) {
        .footer__content {
            flex-direction: column;
            text-align: center;
        }

        .footer__contact {
            margin-top: 20px;
        }
    }
</style>