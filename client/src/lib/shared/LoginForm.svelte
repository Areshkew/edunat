<script lang="ts">
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    let email = "";
    let password = "";

    function handleSubmit() {
        console.log("Login submitted", { email, password });
    }

    function switchToRegister() {
        dispatch("switchForm", "register");
    }

    function switchToForgot() {
        dispatch("switchForm", "forgot");
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="edunat__form">
    <h2>Iniciar Sesión</h2>

    <div class="edunat__form-field">
        <div>Email</div>
        <input
            type="email"
            class="edunat__input"
            placeholder="Ingresa tu Email"
            bind:value={email}
            required
        />
    </div>

    <div class="edunat__form-field">
        <div>Contraseña</div>
        <input
            type="password"
            class="edunat__input"
            placeholder="Ingresa tu Contraseña"
            bind:value={password}
            required
        />
        <button type="button" class="edunat__link" on:click|preventDefault={switchToForgot}
            >¿Olvidaste tu contraseña?</button
        >
    </div>

    <button class="edunat__btn" type="submit">Iniciar Sesión</button>
    
    <button type="button" class="edunat__btn-sec" on:click|stopPropagation={switchToRegister}>Regístrate</button>
</form>
