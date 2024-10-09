<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let email = '';

    function handleSubmit() {
        // Handle registration logic here
        console.log('Request submitted', { email });
    }

    function switchToLogin() {
        dispatch('switchForm', 'login');
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="edunat__form">
    <h2>Recuperación de Clave</h2>

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

    <button class="edunat__btn" type="submit">Enviar</button>
    <p>¿Ya tienes una cuenta? <button class="edunat__link" on:click|preventDefault|stopPropagation={switchToLogin}>Inicia sesión</button></p>
</form>