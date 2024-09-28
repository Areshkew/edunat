# Documentación de la API de Edunat

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Endpoints](#endpoints)
    - [Login](#login)
    - [Registro (Signup)](#registro-signup)
4. [Configuración e Inicialización](#configuración-e-inicialización)
5. [Ejemplos](#ejemplos)
6. [Manejo de Errores](#manejo-de-errores)
7. [Seguridad](#seguridad)
8. [Versionado](#versionado)

---

## Introducción

**Edunat** es una plataforma educativa creada para la Universidad Tecnológica de Pereira. Su propósito es gestionar cursos y facilitar el aprendizaje de los estudiantes a través de una interfaz digital. Esta API permite a los desarrolladores interactuar con el backend de Edunat.

### Funcionalidades Actuales
- Inicialización del backend con una base de datos PostgreSQL.
- Sistema de autenticación de usuarios con tokens JWT.
- Funcionalidades de inicio de sesión y registro.

---

## Autenticación

La API de Edunat utiliza JWT (JSON Web Token) para la autenticación.

### ¿Cómo Autenticarse?
- Los usuarios deben obtener un token a través del endpoint de inicio de sesión.
- Una vez obtenido el token, debe incluirse en el encabezado `Authorization` de las solicitudes con el siguiente formato:

Authorization: Bearer <tu-token>


### Ejemplo de Inicio de Sesión
_(Este espacio se completará con el código que me pases más adelante.)_

---

## Endpoints

### Login

- **URL**: `/api/user/login`
- **Método**: `POST`
- **Cuerpo de la Solicitud**:
    ```json
    {
      "email": "usuario@ejemplo.com",
      "password": "contraseña"
    }
    ```
- **Respuesta**:
    ```json
    {
      "mensaje": "Inicio de sesión exitoso",
      "rol": "usuario",
      "token": "tu-jwt-token"
    }
    ```
- **Códigos de Estado**:
    - `200 OK`: Inicio de sesión exitoso.
    - `401 No autorizado`: Email o contraseña inválidos.

### Registro (Signup)

- **URL**: `/api/user/signup`
- **Método**: `POST`
- **Cuerpo de la Solicitud**:
    _(Este espacio se completará con el modelo de datos que me pases más adelante.)_
- **Respuesta**:
    ```json
    {
      "mensaje": "Registro exitoso",
      "rol": "usuario",
      "token": "tu-jwt-token"
    }
    ```
- **Códigos de Estado**:
    - `200 OK`: Registro exitoso.
    - `401 No autorizado`: Dato único duplicado (ej. nombre de usuario o email ya en uso).

---

## Configuración e Inicialización

Para configurar el proyecto, sigue estos pasos:

1. **Crear la Base de Datos**: Utiliza pgAdmin o cualquier herramienta de administración de bases de datos PostgreSQL para crear una nueva base de datos. Asegúrate de configurar los detalles necesarios como el puerto, nombre de la base de datos, y el usuario.

2. **Archivo de Configuración (.env)**: El proyecto requiere un archivo `.env` con las variables de entorno, como la información de conexión a la base de datos.
   _(Este espacio se completará más adelante con un archivo `.env.example`.)_

---

## Ejemplos

_(Este espacio se llenará con ejemplos de solicitudes HTTP más adelante, posiblemente usando HTTPie o Postman.)_

---

## Manejo de Errores

_(Esta sección incluirá guías sobre errores comunes y su manejo, se completará más adelante.)_

Para problemas serios, contacta a los creadores o consulta los mensajes de error detallados en la documentación de la API. Para problemas locales del usuario, sigue las sugerencias y consejos proporcionados.

---

## Seguridad

La API de Edunat utiliza las siguientes medidas de seguridad:

- **Cifrado de Contraseñas**: Todas las contraseñas se cifran antes de ser almacenadas en la base de datos.
- **Manejo de Información Sensible**: Se toman las precauciones necesarias al manejar información sensible.

---

## Versionado

Todo el versionado será gestionado a través de GitHub. Las futuras versiones de la API se rastrearán y controlarán mediante ramas y releases.

---

## Contacto

Para más asistencia o para reportar problemas, contacta al equipo de desarrollo.

---

