# Edunat Frontend

## Primeros Pasos

Sigue los pasos a continuación para configurar tu entorno de desarrollo y comenzar a trabajar con este proyecto.

### 1. Inicializa el Proyecto

Después de inicializar el proyecto, navega al nuevo directorio creado:

```bash
cd my-app
```

### 2. Instala las Dependencias

Usa Bun para instalar las dependencias del proyecto:

```bash
bun install
```

### 3. Inicia el Servidor de Desarrollo

Puedes iniciar el servidor de desarrollo con Bun usando el siguiente comando:

```bash
bun --bun run dev
```

Alternativamente, si prefieres usar Node.js en lugar de Bun, simplemente omite la bandera `--bun`:

```bash
bun run dev
```

#### Información del Servidor de Desarrollo

Una vez que el servidor esté en funcionamiento, verás la siguiente salida:

```
VITE v4.4.9  ready in 895 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

Visita [http://localhost:5173](http://localhost:5173) en tu navegador para ver el proyecto.

Cualquier cambio que realices en los archivos (por ejemplo, `src/routes/+page.svelte`) se **recargará automáticamente** en el navegador.

---

## Preparando para Producción

Sigue estos pasos para construir el proyecto para producción.

### 1. Instala el Adaptador de SvelteKit para Bun

Primero, necesitas agregar el adaptador adecuado para SvelteKit y Bun:

```bash
bun add -D svelte-adapter-bun
```

### 2. Actualiza la Configuración

Ahora, realiza los siguientes cambios en tu archivo `svelte.config.js`:

```js
import adapter from "svelte-adapter-bun";
import { vitePreprocess } from "@sveltejs/kit/vite";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
  },
  preprocess: vitePreprocess(),
};

export default config;
```

### 3. Genera el Bundle de Producción

Finalmente, para generar un bundle optimizado para producción, ejecuta el siguiente comando:

```bash
bun run build
```

Esto creará un paquete optimizado para tu proyecto.

---

## Notas Adicionales

- **Desarrollo Local:** Visita [http://localhost:5173](http://localhost:5173) para ver tu aplicación ejecutándose localmente durante el desarrollo.
- **Recarga Automática:** Los cambios que realices en los archivos fuente se reflejarán instantáneamente en tu navegador sin necesidad de actualizar manualmente.
- **Producción:** Utiliza el comando `bun run build` para crear un paquete optimizado y listo para ser desplegado.

¡Disfruta programando con SvelteKit y Bun! 🚀
