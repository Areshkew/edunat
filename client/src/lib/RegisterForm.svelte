<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let name = '';
    let email = '';
    let password = '';

    function handleSubmit() {
        // Handle registration logic here
        console.log('Registration submitted', { name, email, password });
    }

    function switchToLogin() {
        dispatch('switchForm', 'login');
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="auth-form">
    <h2>Registrarse</h2>
    <input type="text" placeholder="Nombre completo" bind:value={name} required>
    <input type="email" placeholder="Correo electrónico" bind:value={email} required>
    <input type="password" placeholder="Contraseña" bind:value={password} required>
    <button type="submit">Registrarse</button>
    <p>¿Ya tienes una cuenta? <a href="#" on:click|preventDefault={switchToLogin}>Inicia sesión</a></p>
</form>