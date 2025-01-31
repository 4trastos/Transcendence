# ft_transcendence

**Sorpresa.**

### Resumen:
Este proyecto consiste en hacer algo que nunca has hecho antes.

Recuerda el comienzo de tu viaje en informática. Mírate ahora. ¡Es hora de brillar!

**Versión:** 15

---

## Contenidos

- I. Preámbulo  
- II. Puntos Esenciales  
- III. Parte Obligatoria  
  - III.1 Descripción General  
  - III.2 Requisitos Técnicos Mínimos  
  - III.3 Juego  
  - III.4 Preocupaciones de Seguridad  
- IV. Módulos  
  - IV.1 Descripción General  
  - IV.2 Web  
  - IV.3 Gestión de Usuarios  
  - IV.4 Jugabilidad y Experiencia de Usuario  
  - IV.5 IA-Algoritmo  
  - IV.6 Ciberseguridad  
  - IV.7 DevOps  
  - IV.8 Juegos  
  - IV.9 Gráficos  
  - IV.10 Accesibilidad  
  - IV.11 Pong en el Lado del Servidor  
- V. Parte Extra  
- VI. Entrega y Evaluación por Pares

---

## I. Preámbulo

---

## II. Puntos Esenciales
Este proyecto es una tarea compleja que requiere tomar decisiones dentro de las restricciones especificadas. Tienes algo de flexibilidad para implementar ciertos módulos, y queda a tu discreción dentro del alcance del proyecto. Todas tus decisiones deben estar justificadas.

Si consideras necesario usar nginx para configurar tu sitio web, no hay problema, pero pregúntate primero, ¿es realmente necesario? ¿Puedo hacerlo sin él? Del mismo modo, cuando te enfrentes a una biblioteca que podría ayudarte, es crucial comprender si cumplirá con tus tareas. No se espera que rehagas capas subyacentes poco interesantes, sino que hagas que las características propuestas funcionen.

Es importante entender que te encontrarás con decisiones donde surgirán dudas sobre la implementación de ciertas características. Inicialmente, se recomienda ENCARECIDAMENTE comprender los requisitos del proyecto a fondo. Una vez que hayas comprendido lo que se debe lograr, es necesario mantenerse dentro del marco del proyecto. Cuando mencionamos una tecnología impuesta, esto significa explícitamente que todo lo relacionado oficialmente con el marco/lenguaje solicitado está permitido.

Sin embargo, enfatizamos que cuando desees implementar un módulo, todas las restricciones se aplican a ese módulo. Por ejemplo, si deseas realizar el proyecto con el módulo de Backend como se especifica en el proyecto, ya no puedes usar el lenguaje predeterminado y debes adaptar tu proyecto en consecuencia. Si aún quieres crear un backend usando el lenguaje predeterminado, también es posible, pero como no estás usando el lenguaje/framework solicitado, este módulo no se considerará válido.

Antes de concluir, es importante señalar que algunos módulos tienen intencionalmente fuertes dependencias entre sí.

Tus decisiones son importantes y deben ser justificadas durante tu evaluación. Ten cuidado.

Tómate el tiempo para pensar en el diseño de tu aplicación con tus elecciones antes de adentrarte en el código; es crucial.

¡Diviértete! :)

---

## III. Parte Obligatoria
Este proyecto consiste en crear un sitio web para el gran concurso de Pong.

- El uso de bibliotecas o herramientas que proporcionen una solución inmediata y completa para una característica global o un módulo está prohibido.

- Cualquier instrucción directa sobre el uso (puede, debe, no puede) de una biblioteca o herramienta de terceros debe seguirse.

- El uso de una pequeña biblioteca o herramienta que resuelva una tarea simple y única, que represente un subcomponente de una característica global o módulo, está permitido.

- Durante la evaluación, el equipo justificará el uso de cualquier biblioteca o herramienta que no esté explícitamente aprobada por el proyecto.

- Durante la evaluación, el evaluador definirá si el uso de una biblioteca o herramienta específica es legítimo (y permitido) o si casi resuelve una característica o módulo completo (y está prohibido).

### III.1 Descripción General
Gracias a tu sitio web, los usuarios podrán jugar Pong con otros. Debes proporcionar una interfaz de usuario agradable y juegos multijugador en tiempo real.

- Tu proyecto debe adherirse a las siguientes pautas como un requisito mínimo, contribuyendo solo con una pequeña parte de la calificación final.

- La segunda parte de este proyecto ofrecerá módulos adicionales que pueden reemplazar o completar las siguientes reglas.

En este proyecto, ciertas palabras están resaltadas en verde. Estas representan opciones tecnológicas que evolucionarán con el tiempo. Presta mucha atención a la versión del proyecto.

---

### III.2 Requisitos Técnicos Mínimos
Tu proyecto debe cumplir con las siguientes reglas:

Algunas de estas restricciones podrían ser anuladas por la elección de módulos específicos.

- Eres libre de desarrollar el sitio, con o sin un backend.

  - Si eliges incluir un backend, debe estar escrito en Ruby puro. Sin embargo, este requisito puede ser anulado por el módulo de Framework.

  - Si tu backend o framework utiliza una base de datos, debes seguir las restricciones del módulo de Base de Datos.

- El frontend debe desarrollarse utilizando Javascript puro (vanilla). Sin embargo, este requisito puede ser alterado mediante el módulo de FrontEnd.

- Tu sitio web debe ser una aplicación de una sola página. El usuario debe poder utilizar los botones de Atrás y Adelante del navegador.

- Tu sitio web debe ser compatible con la última versión estable y actualizada de Google Chrome.

- El usuario no debe encontrar errores no manejados ni advertencias al navegar por el sitio web.

- Todo debe lanzarse con una única línea de comando para ejecutar un contenedor autónomo proporcionado por Docker. Ejemplo: `docker-compose up --build`

Si tu solución de contenedor es Docker:
Cuando tus computadoras en los clústeres se ejecutan en Linux, utilizarás Docker en modo sin root por razones de seguridad. Esto conlleva dos implicaciones:

- Tus archivos de runtime de Docker deben estar ubicados en `/goinfre` o `/sgoinfre`.

- No puedes usar volúmenes "bind-mount" entre el host y el contenedor si se utilizan UID no-root en el contenedor.

Dependiendo del proyecto, tu situación y el contexto, existen varios métodos alternativos: Docker en una máquina virtual, reconstruir tu contenedor después de tus cambios, crear tu propia imagen de Docker con root como único UID.

---

#### III.3 Juego

El propósito principal de este sitio web es jugar Pong contra otros jugadores.

- Por lo tanto, los usuarios deben tener la capacidad de participar en un juego de Pong en vivo contra otro jugador directamente en el sitio web. Ambos jugadores usarán el mismo teclado. El módulo Jugadores Remotos puede mejorar esta funcionalidad con jugadores remotos.
- Un jugador debe poder jugar contra otro jugador, pero también debe ser posible proponer un torneo. Este torneo consistirá en múltiples jugadores que pueden turnarse para jugar entre sí. Tienes flexibilidad en cómo implementas el torneo, pero debe mostrar claramente quién juega contra quién y el orden de los jugadores.
- Se requiere un sistema de registro: al comienzo de un torneo, cada jugador debe ingresar su nombre de alias. Los alias se restablecerán cuando comience un nuevo torneo. Sin embargo, este requisito puede modificarse utilizando el módulo de Gestión de Usuarios Estándar.
- Debe haber un sistema de emparejamiento: el sistema de torneos organiza el emparejamiento de los participantes y anuncia la próxima pelea.
- Todos los jugadores deben adherirse a las mismas reglas, lo que incluye tener la misma velocidad de paleta. Este requisito también se aplica cuando se usa IA; la IA debe exhibir la misma velocidad que un jugador regular.
- El juego en sí debe desarrollarse de acuerdo con las restricciones predeterminadas del frontend (como se describe arriba), o puedes optar por utilizar el módulo FrontEnd, o tienes la opción de anularlo con el módulo Gráficos. Si bien la estética visual puede variar, aún debe capturar la esencia del Pong original (1972).

- El uso de bibliotecas o herramientas que proporcionen una solución completa inmediata para una característica global o un módulo está prohibido.
- Cualquier instrucción directa sobre el uso (puede, debe, no puede) de una biblioteca o herramienta de terceros debe seguirse.
- El uso de una pequeña biblioteca o herramienta que resuelva una tarea simple y única, representando un subcomponente de una característica global o módulo, está permitido.
- Durante la evaluación, el equipo justificará cualquier uso de biblioteca o herramienta que no esté explícitamente aprobado por el tema.
- Durante la evaluación, el evaluador tomará su responsabilidad y definirá si el uso de una biblioteca o herramienta específica es legítimo (y permitido) o casi resuelve una característica o módulo completo (y prohibido).

---

#### III.4 Preocupaciones de Seguridad

Para crear un sitio web básico funcional, aquí hay algunas preocupaciones de seguridad que debes abordar:

- Cualquier contraseña almacenada en tu base de datos, si es aplicable, debe estar hasheada.
- Tu sitio web debe estar protegido contra inyecciones SQL/XSS.
- Si tienes un backend o cualquier otra característica, es obligatorio habilitar una conexión HTTPS para todos los aspectos (Utiliza `wss` en lugar de `ws`...).
- Debes implementar alguna forma de validación para formularios y cualquier entrada de usuario, ya sea dentro de la página base si no se usa un backend o en el lado del servidor si se emplea un backend.
- Independientemente de si decides implementar el módulo de Seguridad JWT con 2FA, es crucial priorizar la seguridad de tu sitio web. Por ejemplo, si optas por crear una API, asegúrate de que tus rutas estén protegidas. Recuerda, incluso si decides no usar tokens JWT, asegurar el sitio sigue siendo esencial.

Asegúrate de usar un algoritmo fuerte de hashing de contraseñas.

Por razones obvias de seguridad, cualquier credencial, clave de API, variables de entorno, etc., deben guardarse localmente en un archivo `.env` e ignorarse por git. Las credenciales almacenadas públicamente te llevarán directamente a un fracaso del proyecto.

---

## Capítulo IV

### Módulos

¡Ahora que has completado el 25% del proyecto, felicidades!

Con un sitio web básico funcional en su lugar, el siguiente paso es elegir módulos para mejoras adicionales.

Para alcanzar el 100% de finalización del proyecto, se requiere un mínimo de **7 módulos principales**. Es crucial revisar cuidadosamente cada módulo, ya que puede requerir modificaciones en tu sitio web base. Por lo tanto, recomendamos encarecidamente leer todo este tema a fondo.

- El uso de bibliotecas o herramientas que proporcionen una solución completa inmediata para una característica global o un módulo está prohibido.
- Cualquier instrucción directa sobre el uso (puede, debe, no puede) de una biblioteca o herramienta de terceros debe seguirse.
- El uso de una pequeña biblioteca o herramienta que resuelva una tarea simple y única, representando un subcomponente de una característica global o módulo, está permitido.
- Durante la evaluación, el equipo justificará cualquier uso de biblioteca o herramienta que no esté explícitamente aprobado por el tema.
- Durante la evaluación, el evaluador tomará su responsabilidad y definirá si el uso de una biblioteca o herramienta específica es legítimo (y permitido) o casi resuelve una característica o módulo completo (y prohibido).

---

Dos Módulos Menores equivalen a un Módulo Principal.

---

#### IV.1 Visión General

- **Web**
  - **Módulo Principal**: Usar un Framework como backend.
  - **Módulo Menor**: Usar un framework o kit de herramientas de front-end.
  - **Módulo Menor**: Usar una base de datos para el backend.
  - **Módulo Principal**: Almacenar la puntuación de un torneo en la Blockchain.

- **Gestión de Usuarios**
  - **Módulo Principal**: Gestión de usuarios estándar, autenticación, usuarios a través de torneos.
  - **Módulo Principal**: Implementar una autenticación remota.

- **Jugabilidad y Experiencia de Usuario**
  - **Módulo Principal**: Jugadores remotos.
  - **Módulo Principal**: Multijugador (más de 2 en el mismo juego).
  - **Módulo Principal**: Agregar otro juego con historial de usuario y emparejamiento.
  - **Módulo Menor**: Opciones de personalización del juego.
  - **Módulo Principal**: Chat en vivo.

- **AI-Algoritmo**
  - **Módulo Principal**: Introducir un oponente de IA.
  - **Módulo Menor**: Paneles de estadísticas de usuario y juego.

- **Ciberseguridad**
  - **Módulo Principal**: Implementar WAF/ModSecurity con Configuración Reforzada y HashiCorp Vault para la Gestión de Secretos.
  - **Módulo Menor**: Opciones de Cumplimiento de GDPR con Anonimización de Usuarios, Gestión de Datos Locales y Eliminación de Cuentas.
  - **Módulo Principal**: Implementar Autenticación de Dos Factores (2FA) y JWT.

- **Devops**
  - **Módulo Principal**: Configuración de Infraestructura para la Gestión de Registros.
  - **Módulo Menor**: Sistema de monitoreo.
  - **Módulo Principal**: Diseñar el Backend como Microservicios.

- **Gráficos**
  - **Módulo Principal**: Uso de técnicas avanzadas de 3D.

- **Accesibilidad**
  - **Módulo Menor**: Soporte en todos los dispositivos.
  - **Módulo Menor**: Ampliar la compatibilidad del navegador.
  - **Módulo Menor**: Soporte de múltiples idiomas.
  - **Módulo Menor**: Agregar accesibilidad para usuarios con discapacidad visual.
  - **Módulo Menor**: Integración de Renderizado del Lado del Servidor (SSR).

- **Pong del Lado del Servidor**
  - **Módulo Principal**: Reemplazar el Pong básico con Pong del lado del servidor e implementar una API.
  - **Módulo Principal**: Habilitar el juego de Pong a través de CLI contra usuarios web con integración de API.

---

## Capítulo V

### Parte de Bonificación

Para este proyecto, la sección de bonificación está diseñada para ser sencilla. Se requiere que incluyas más módulos.

- Se otorgarán cinco puntos por cada **módulo menor**.
- Se otorgarán diez puntos por cada **módulo principal**.

---

La parte de bonificación solo se evaluará si la parte obligatoria es PERFECTA. Perfecto significa que la parte obligatoria se ha realizado íntegramente y funciona sin fallos. Si no has pasado TODOS los requisitos obligatorios, tu parte de bonificación no será evaluada en absoluto.

---

## Capítulo VI

### Entrega y Evaluación por Pares

Entrega tu tarea en tu repositorio de Git como de costumbre. Solo el trabajo dentro de tu repositorio será evaluado durante la defensa. No dudes en verificar dos veces los nombres de tus archivos para asegurarte de que sean correctos.

- El uso de bibliotecas o herramientas que proporcionen una solución completa inmediata para una característica global o un módulo está prohibido.
- Cualquier instrucción directa sobre el uso (puede, debe, no puede) de una biblioteca o herramienta de terceros debe seguirse.
- El uso de una pequeña biblioteca o herramienta que resuelva una tarea simple y única, representando un subcomponente de una característica global o módulo, está permitido.
- Durante la evaluación, el equipo justificará cualquier uso de biblioteca o herramienta que no esté explícitamente aprobado por el tema.
- Durante la evaluación, el evaluador tomará su responsabilidad y definirá si el uso de una biblioteca o herramienta específica es legítimo (y permitido) o casi resuelve una característica o módulo completo (y prohibido).

---


