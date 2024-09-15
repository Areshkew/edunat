<script lang="ts">
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    let email = "";
    let password = "";

    function handleSubmit() {
        // Handle login logic here
        console.log("Login submitted", { email, password });
    }

    function switchToRegister() {
        dispatch("switchForm", "register");
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="auth-form">
    <h2>Iniciar Sesión</h2>
    <input
        type="email"
        placeholder="Correo electrónico"
        bind:value={email}
        required
    />
    <input
        type="password"
        placeholder="Contraseña"
        bind:value={password}
        required
    />
    <button type="submit">Iniciar Sesión</button>
    <p>
        ¿No tienes una cuenta? <a
            href="#"
            on:click|preventDefault={switchToRegister}>Regístrate</a
        >
    </p>
</form>
