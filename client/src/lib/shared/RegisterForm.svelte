<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let name = '';
    let email = '';
    let password = '';

    function handleSubmit() {
        console.log('Registration submitted', { name, email, password });
    }

    function switchToLogin() {
        dispatch('switchForm', 'login');
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="edunat__form">
    <h2>Registrarse</h2>
    <div class="edunat__form-field">
        <div>Nombre Completo</div>
        <input
            type="text"
            class="edunat__input"
            placeholder="Ingresa tu Nombre Completo"
            bind:value={name}
            required
        />
    </div>

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
    </div>

    <button class="edunat__btn"  type="submit">Registrarse</button>
    <p>¿Ya tienes una cuenta? <button class="edunat__link" on:click|preventDefault={switchToLogin}>Inicia sesión</button></p>
</form>