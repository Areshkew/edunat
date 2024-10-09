<script lang="ts">
    import LoginForm from "./LoginForm.svelte";
    import RegisterForm from "./RegisterForm.svelte";
    import ForgotForm from "./ForgotForm.svelte";
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

        authDialog?.addEventListener("keypress", handleEscape)
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
    <nav class="header__nav container">
        <div class="header__logo">
            <img src="Logo.webp" alt="Logo Vamos1a" width="50" />
        </div>

        <button class="menu-toggle" on:click={toggleMenu}>
            <span class="material-icons">{isMenuOpen ? "close" : "menu"}</span>
        </button>
        
        <ul class:active={isMenuOpen}>
            <li><a href="/" on:click={toggleMenu}>Inicio</a></li>
            <li>
                <a href="/terminos" on:click={toggleMenu}>Términos y Condiciones</a>
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

<!-- TODO: Fix form exiting when pressing enter. -->
<dialog
    bind:this={authDialog}
    class="auth-dialog"
    aria-labelledby="auth-form-title"
>
    <div class="auth-dialog__container">
        {#if activeForm === "login"}
            <LoginForm on:switchForm={handleSwitchForm} />
        {:else if activeForm === "forgot"}
            <ForgotForm on:switchForm={handleSwitchForm} />
        {:else if activeForm === "register"}
            <RegisterForm on:switchForm={handleSwitchForm} />
        {/if}
    </div>
</dialog>

<style>
    /* Header */
    header {
        background-color: var(--primary-color);
        color: #fff;
        position: sticky;
        top: 0;
        z-index: 1000;
        box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    }
    nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        height: 70px;
    }
    nav ul {
        display: flex;
        gap: 2rem;
        list-style: none;
        height: 100%; 
    }
    nav ul li {
        height: 100%;
        display: flex;
        align-items: center;
    }
    nav ul li a {
        color: white;
        transition: color 0.3s ease;
        padding: 0 15px;
        height: 100%;
        display: flex;
        align-items: center;
    }
    nav ul li a:hover {
        color: var(--secondary-color);
    }
    nav ul li .auth-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0 15px;
        height: 100%;
        display: flex;
        align-items: center;
    }
    nav ul li .auth-button:hover .material-icons {
        color: var(--secondary-color);
    }
    .menu-toggle {
        display: none;
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
    }
    .auth-dialog {
        padding: 0;
        border: none;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        width: 90%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .auth-dialog::backdrop {
        background-color: rgba(0, 0, 0, 0.5);
    }
    .auth-dialog__container {
        padding: 2rem;
    }

    @media (max-width: 768px) {
        header {
            height: auto;
        }

        .menu-toggle {
            display: block;
        }

        nav ul {
            display: none;
            flex-direction: column;
            position: absolute;
            top: 70px; /* Position right below the header */
            left: 0;
            right: 0;
            background-color: var(--primary-color);
            padding: 1rem;
            height: auto; /* Reset height for mobile */
        }

        nav ul.active {
            display: flex;
        }

        nav ul li {
            text-align: center;
            height: auto; /* Reset height for mobile */
        }

        nav ul li a {
            display: block;
            padding: 0.5rem 0;
            height: auto; /* Reset height for mobile */
        }

        nav ul {
            flex-direction: column;
            gap: 1rem;
        }
        .auth-dialog {
            position: absolute;
            right: 20px;
            margin: 0;
        }
    }
</style>