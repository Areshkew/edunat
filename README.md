# Documentación del Proyecto

Esta sección contiene documentación importante relacionada al proyecto, incluyendo diagramas y recursos adicionales que te ayudarán a entender el diseño del sistema y la estructura.

---

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Documentos](#documentos)
3. [Configuración e Inicialización](#configuración-e-inicialización)
    - [Pre-requisitos](#pre-requisitos)
    - [Clonacion backend](#clonacionbackend)
4. [Autenticación](#autenticación)
5. [Endpoints](#endpoints)
    - [Login](#login)
    - [Registro (Signup)](#registro-signup)
6. [Ejemplos](#ejemplos)
7. [Manejo de Errores](#manejo-de-errores)
8. [Seguridad](#seguridad)
9. [Versionado](#versionado)
 
 
---

## Introducción

**Edunat** es una plataforma educativa creada para la Universidad Tecnológica de Pereira. Su propósito es gestionar cursos y facilitar el aprendizaje de los diferentes usuarios a través de una interfaz digital. Esta API permite a los desarrolladores interactuar con el backend de Edunat.

### Funcionalidades Actuales
- Inicialización del backend con una base de datos PostgreSQL.
- Sistema de autenticación de usuarios con tokens JWT.
- Funcionalidades de inicio de sesión y registro.

---

## Documentos Disponibles

- **Diagrama Entidad-Relación**: 
  - [Ver Diagrama ER](https://drive.google.com/file/d/18j9nvpHImI3ncHKRexZ6bIHnivbj6tfo/view?usp=sharing)
 
- **Diagramas Caso de uso UML**: 
  - [Ver Diagrama UML](https://drive.google.com/file/d/1enegtnJgOjpJInpZ8HU3f3jGylfeNz-U/view?usp=sharing)

- **Flujo de Autenticacion**: 
  - [Ver Flujo Autenticacion](https://drive.google.com/file/d/1jpkQXV-yIHYrcscV8kWIer6_Q8oFTg4K/view?usp=sharing)

---


## Configuración e Inicialización
Completa este tutorial y podras hacer deploy del backend de Edunat!


### Pre-requisitos
Este tutorial asume que tienes:

1. **PostgreSQL** instalado y configurado. Puedes descargarlo desde [postgresql.org](https://www.postgresql.org/download/). Asegúrate de tener un usuario y una base de datos creados.
2. **pgAdmin** o cualquier otra herramienta de administración de bases de datos para gestionar tu base de datos PostgreSQL. Puedes descargar pgAdmin desde [pgadmin.org](https://www.pgadmin.org/download/).
3. **Python 3.x** instalado para ejecutar scripts backend. Descárgalo desde [python.org](https://www.python.org/downloads/).
4. **Postman** o **HTTPie** para probar las APIs. Puedes descargar Postman desde [postman.com](https://www.postman.com/downloads/) o HTTPie desde [httpie.io/cli](https://httpie.io/cli). 
5. Cualquier entorno de desarrollo de preferencia, como referencia se tendria a **VS Code**, Descárgalo desde [visualstudio.com](https://code.visualstudio.com/)


### Clonacion del backend
#### 1. ¿Tienes Git instalado?

Para clonar el repositorio de Edunat, primero necesitas tener Git instalado en tu sistema. Si no lo tienes, puedes instalarlo siguiendo los siguientes enlaces:

- [Instalación de Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Configuración inicial de Git](https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup)

Una vez que te asegures de tener Git instalado, puedes proceder con la clonación.

#### 2. Clonar el repositorio

Abre tu terminal o consola y ejecuta el siguiente comando para clonar el repositorio del backend de Edunat:

```bash
git clone https://github.com/Areshkew/edunat
cd edunat
```
En este momento tendras todo el proyecto de edunat, pero como en este caso vamos a explicar el backend tienes que ingresar a la carpeta server
```bash
cd server
```

### Configuración del entorno

#### 1. Crear el archivo `.env`

Después de clonar el repositorio, el siguiente paso es crear el archivo `.env` que contendrá las variables de entorno necesarias para que la aplicación funcione correctamente.

Utiliza el archivo `.env.example` como base. Puedes copiar este archivo y renombrarlo a `.env` con el siguiente comando en tu terminal:

```bash
cp .env.example .env
```
A continuación, abre el archivo .env en un editor de texto y ajusta las variables según sea necesario, como la configuración de la base de datos, el usuario administrador, etc.

#### 2. Instalar las dependencias
Es necesario instalar todas las librerías que se encuentran en el archivo requirements.txt. Esto asegurará que el entorno cuente con todos los paquetes necesarios para ejecutar la aplicación correctamente.

En tu terminal, ejecuta el siguiente comando:

```bash
pip install -r requirements.txt
```

Este comando descargará e instalará automáticamente todas las dependencias definidas en el archivo requirements.txt.

#### 3. Generar las llaves públicas y privadas
El sistema utiliza una llave pública y una privada para manejar ciertos procesos de autenticación. Estas llaves deben guardarse en una carpeta llamada keys dentro del directorio principal de la aplicación.

Crea la carpeta keys:

```bash
mkdir keys
```
Luego, necesitas generar las llaves public_key.pem y private_key.pem. Puedes usar un generador de llaves online como el siguiente:

- [Generador de Llaves RSA](https://travistidwell.com/jsencrypt/demo/)

Después de generar las llaves, guarda cada una de la siguiente manera creando los archivos pertinentes:

- **private_key.pem**: Guarda la clave privada generada en el archivo keys/private_key.pem
- **public_key.pem**: Guarda la clave pública generada en el archivo keys/public_key.pem


### Ejecutar el proyecto

Desde la carpeta principal del proyecto **Edunat**, puedes ejecutar el archivo `main.py` que se encuentra dentro de la carpeta `server`. Asegúrate de estar en la raíz del proyecto y usa el siguiente comando:

```bash
python server/main.py
```

Esto iniciará el servidor del backend, utilizando las configuraciones definidas en tu archivo .env

Si todo está configurado correctamente, deberías ver un mensaje similar al siguiente:

```vbnet
INFO:     Started server process [708]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 
(Press CTRL+C to quit)
```
Esto indica que el servidor se ha iniciado correctamente y está corriendo en http://0.0.0.0:8000. 
Por lo que ya podremos concluir que haz levantando el backend del proyecto, **Felicidades!**

En este punto tienes la base de datos que configuraste construida con la estructura de base de dato que usa el proyecto y tambien ya se es posible usar los endpoints del backend utilizando peticiones HTTP que podras ver ejemplos y explicaciones de uso mas adelante.


---
## Autenticación

La API de Edunat utiliza JWT (JSON Web Token) para la autenticación.

### ¿Cómo Autenticarse?
- Los usuarios deben obtener un token a través del endpoint de inicio de sesión.
- Una vez obtenido el token, debe incluirse en el encabezado `Authorization` de las solicitudes con el siguiente formato:

Authorization: Bearer <tu-token>


### Ejemplo de Inicio de Sesión
Inicio de sesion con el usuario admin, en este caso se hace una petición POST al siguiente endpoint el cual hace el inicio de sesion de usuarios:

**URL:**  
`POST http://localhost:8000/api/user/login`

**Cuerpo de la Solicitud (JSON):**
```json
{
    "email": "admin@edunat.com",
    "password": "admin"
}
```
Una vez que se envía la solicitud de inicio de sesión utilizando cualquier herramienta para enviar peticiones (como Postman, HTTPie, cURL, o Insomnia), deberías recibir una respuesta en formato JSON como la siguiente:

```json
{
  "detail": "Se inició sesión correctamente.",
  "role": 1,
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjAsInJvbGUiOjEsImV4cCI6MTcyNzU2NzQzM30.G-8K4uA4sKO1iPAMd_PUoLY-KRUdOesDZb5B2no7kruyGBjBYD-_kj0VUC8WhGpCmLAFw158_wa6yeHQQ23WkmPN1sJQ1Sex-1EaTnOdpPTeXZvdrQZuhYNvEPa7TmKeD08fpG-tVmJwuSBrHOF0_xxC2zVdKzpj9ubRb3sCbCo"
}
```
Explicación del Cuerpo de la Respuesta:
- detail: Este campo te confirma que el inicio de sesión se realizó correctamente con el mensaje "Se inició sesión correctamente.".
- role: Este campo indica el rol del usuario que inició sesión. En este caso, el valor es 1, lo que significa que es un administrador.
- token: Aquí recibirás un token JWT (JSON Web Token), que será necesario para autenticarse en futuras peticiones a la API. Este token contiene información codificada sobre el usuario y su rol, y tiene un tiempo de expiración.

Guarda este token para incluirlo en el encabezado `Authorization` en las siguientes solicitudes que realices a la API.

En otra perspectiva, el terminal donde iniciaste el backend, deberías ver un mensaje que indica que se recibió la solicitud y que la respuesta fue exitosa. Un ejemplo de lo que podrías ver en el terminal es:


```vbnet
INFO:     ::1:59008 - "POST /api/user/login HTTP/1.1" 200 OK
```
Esto indica que la solicitud fue recibida y procesada correctamente, y que se devolvió un código de estado 200 OK, lo que confirma que la petición fue exitosa.


---
## Endpoints
A continuación, pasamos a la sección de **endpoints del backend**, donde explicaremos en detalle cómo interactuar con cada una de las rutas mas importantes en la API. Estos endpoints permiten realizar diversas operaciones como la creación, actualización y consulta de usuarios, la autenticación mediante tokens JWT, la gestión de roles y permisos, entre otras funcionalidades clave para el funcionamiento del sistema. A medida que avances, entenderás cómo estructurar las solicitudes, los tipos de respuestas que puedes esperar y cómo aprovechar al máximo las capacidades del backend de forma eficiente y segura.


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
      "mensaje": "Se inició sesión correctamente.",
      "role": user_db["role"],
      "token": "tu-jwt-token"
    }
    ```
- **Códigos de Estado**:
    - `200 OK`: Se inició sesión correctamente..
    - `401 No autorizado`: Email o contraseña inválidos.

### Registro (Signup)

- **URL**: `/api/user/signup`
- **Método**: `POST`
- **Cuerpo de la Solicitud**:
    ```json
    {
    "document_id": 12345678,
    "email": "user@example.com",
    "username": "usuario123",
    "role": 0,  // 0-User, 1-Admin
    "password": "passwordSeguro123",
    "name": "Nombre Usuario",
    "academic_level": 3,  // 0-none, 1-pre_school, 2-primary, 3-secondary, etc.
    "phone_number": "3001234567",
    "gender": 1,  // 0-male, 1-female, 2-other
    "photo": "https://example.com/photo.jpg",
    "visibility": 1,  // 0-hidden, 1-visible
    "needs": "Necesito ayuda con matemáticas",
    "offers": "Ofrezco clases de física",
    "webpage": "https://mi-webpage.com",
    "whatsapp": "3001234567",
    "birth_date": "2000-01-01",
    "birth_city": "Pereira",
    "language": 1,  // 0-en, 1-es
    "residence_city": "Pereira",
    "address": "Calle 123 #45-67",
    "about": "Soy un estudiante apasionado por la ciencia.",
    "points": 0
    }
    ```
    
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
## Ejemplos

_(Este espacio se llenará con ejemplos de solicitudes HTTP más adelante, posiblemente usando HTTPie o Postman.)_

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
