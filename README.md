# ft_transcendence

Sorpresa.

---

**Resumen:**

*Este proyecto implica realizar tareas que nunca antes has hecho. Recuerda el comienzo de tu viaje en ciencias de la computación. Mírate ahora; ¡es hora de brillar!*

*Versión: 16.0*

## Contenidos

I. Preámbulo  
II. Objetivos  
III. Parte Obligatoria  
   III.1 Visión General  
   III.2 Requisitos Técnicos Mínimos  
   III.3 Juego  
   III.4 Preocupaciones de Seguridad  
IV. Módulos  
   IV.1 Visión General  
   IV.2 Web  
   IV.3 Gestión de Usuarios  
   IV.4 Jugabilidad y Experiencia de Usuario  
   IV.5 AI-Algoritmo  
   IV.6 Ciberseguridad  
   IV.7 Devops  
   IV.8 Gráficos  
   IV.9 Accesibilidad  
   IV.10 Pong del Lado del Servidor  
V. Parte de Bonificación  
VI. Entrega y Evaluación por Pares  

---

## Capítulo I

### Preámbulo

H E

FORE

---

## Capítulo II

### Objetivos

Este proyecto es una sorpresa.

A medida que te acercas al final del Common Core, has desarrollado fuertes habilidades de adaptación y resolución de problemas. Este proyecto te enfrentará, tal vez, a tecnologías desconocidas, intencionalmente. Una vez más, tendrás que adaptarte, descubrir, explorar, experimentar para crear el software esperado.

El proyecto incluye una parte obligatoria y una serie de módulos sobre varios temas, como se detalla a continuación en este tema. Podrás elegir los módulos que desees entre una gran lista, pero cada módulo y elemento obligatorio contiene restricciones técnicas que no puedes evitar. Por lo tanto, puedes seleccionar los temas que te gusten, pero no las tecnologías que te gusten. Esta es una elección pedagógica deliberada.

Este proyecto no está destinado a ser un portafolio para una pasantía entrante u otra experiencia profesional. Su propósito es revelar tu capacidad para familiarizarte y completar una tarea compleja utilizando una tecnología desconocida. Esta situación se enfrentará inevitablemente durante tu carrera, y nuestro objetivo es desarrollar tu confianza en ti mismo frente a tales situaciones.

Especialmente en este proyecto grande y largo, te animamos a leer cuidadosamente todo el tema, considerar varias estrategias posibles, pensar en tu diseño, ¡antes de comenzar a codificar cualquier cosa! Algunos módulos pueden depender de otros, algunos módulos pueden entrar en conflicto con otros. ¡Ft_transcendence traerá muchas dudas y requiere muchas decisiones difíciles! Actúa sabiamente :-)

Además, este proyecto es definitivamente una carrera larga, y un camino equivocado te llevará a una gran pérdida de tiempo. Tus elecciones de gestión de proyectos y gestión de equipos impactarán fuertemente en tu línea de tiempo y resultados. Existen muchos enfoques y herramientas para apoyarte en estos temas.

¡Buena suerte y diviértete jugando Pong!

---

## Capítulo III

### Parte Obligatoria

Este proyecto trata sobre la creación de un sitio web para el poderoso concurso de **Pong**!

#### III.1 Visión General

Tu software ofrecerá una interfaz de usuario agradable y capacidades multijugador en tiempo real que permitirán jugar Pong con todos tus amigos!

- En primer lugar, tu proyecto debe cumplir con las pautas obligatorias como requisito mínimo (ver la siguiente sección), que representarán solo una pequeña porción de la calificación final.
- La segunda parte de este tema ofrecerá módulos adicionales que pueden reemplazar o complementar la parte obligatoria.

En este tema, te enfrentarás a palabras que están resaltadas en verde. Representan elecciones de tecnología que evolucionarán con el tiempo. Asegúrate de prestar mucha atención a la versión del tema.

---

- El uso de bibliotecas o herramientas que proporcionen una solución inmediata y completa para una característica completa o un módulo está prohibido.
- Cualquier instrucción directa con respecto al uso (puede, debe, no puede) de una biblioteca o herramienta de terceros debe seguirse.
- El uso de una pequeña biblioteca o herramienta que resuelva una tarea simple y única, que represente un subcomponente de una característica o módulo más grande, está permitido.
- Durante la evaluación, el equipo justificará cualquier uso de una biblioteca o herramienta que no esté explícitamente aprobado por las pautas del proyecto y que no esté en contradicción con las restricciones del proyecto.
- Durante la evaluación, el evaluador tomará la responsabilidad de determinar si el uso de una biblioteca o herramienta específica es legítimo (y permitido) o si esencialmente resuelve una característica o módulo completo (y por lo tanto está prohibido).

---

#### III.2 Requisitos Técnicos Mínimos

Tu proyecto debe cumplir con las siguientes reglas:

Algunas de estas restricciones pueden anularse por la elección de módulos específicos.

- Eres libre de desarrollar el sitio, con o sin un backend.
  - Si eliges incluir un backend, debe estar escrito en PHP puro sin frameworks. Sin embargo, este requisito puede anularse por el módulo Framework.
  - Si tu backend o framework utiliza una base de datos, debes seguir las restricciones del módulo Base de Datos.

- El frontend debe desarrollarse utilizando Typescript como código base. Sin embargo, este requisito puede modificarse a través del módulo FrontEnd.

- Tu sitio web debe ser una aplicación de una sola página. El usuario debe poder usar los botones Atrás y Adelante del navegador.

- Tu sitio web debe ser compatible con la última versión estable y actualizada de Mozilla Firefox. ¡Por supuesto, también puede ser compatible con otros navegadores web!

- El usuario no debe encontrar errores no manejados o advertencias al navegar por el sitio web.

- Debes usar Docker para ejecutar tu sitio web. Todo debe lanzarse con una sola línea de comando para ejecutar un contenedor autónomo.

Existen varias tecnologías de contenedores: Docker, containerd, podman, etc. En las computadoras de tu campus, puedes acceder al software de contenedores en modo sin root por razones de seguridad. Esto podría llevar a las siguientes restricciones adicionales:
  - Tu tiempo de ejecución debe ubicarse en `/goinfre` o `/sgoinfre`.
    - No puedes usar "volúmenes de montaje de enlace" entre el host y el contenedor si se usan UID no root en el contenedor.

Dependiendo de los requisitos actuales del tema (resaltados en verde arriba) y la configuración local en los clústeres, es posible que necesites adoptar diferentes estrategias, como: solución de contenedores en máquina virtual, reconstruir tu contenedor después de tus cambios, crear tu propia imagen con root como UID único.

---

#### III.3 Juego

El propósito principal de este sitio web es jugar Pong contra otros jugadores.

- Los usuarios deben poder participar en un juego de Pong en vivo contra otro jugador directamente en el sitio web. Ambos jugadores usarán el mismo teclado. El módulo Jugadores Remotos puede mejorar esta funcionalidad con jugadores remotos.
- Un jugador debe poder jugar contra otro, y también debe estar disponible un sistema de torneos. Este torneo consistirá en múltiples jugadores que pueden turnarse para jugar entre sí. Tienes flexibilidad en cómo implementas el torneo, pero debe mostrar claramente quién juega contra quién y el orden del juego.
- Se requiere un sistema de registro: al comienzo de un torneo, cada jugador debe ingresar su alias. Los alias se restablecerán cuando comience un nuevo torneo. Sin embargo, este requisito puede modificarse utilizando el módulo de Gestión de Usuarios Estándar.
- Debe haber un sistema de emparejamiento: el sistema de torneos debe organizar el emparejamiento de los participantes y anunciar el próximo partido.
- Todos los jugadores deben adherirse a las mismas reglas, incluyendo tener la misma velocidad de paleta. Este requisito también se aplica cuando se usa IA; la IA debe exhibir la misma velocidad que un jugador regular.
- El juego debe cumplir con las restricciones predeterminadas del frontend (como se describe arriba), o puedes optar por usar el módulo FrontEnd, o anularlo con el módulo Gráficos. Si bien la estética visual puede variar, el juego aún debe capturar la esencia del Pong original (1972).

- El uso de bibliotecas o herramientas que proporcionen una solución inmediata y completa para una característica completa o un módulo está prohibido.
- Cualquier instrucción directa con respecto al uso (puede, debe, no puede) de una biblioteca o herramienta de terceros debe seguirse.
- El uso de una pequeña biblioteca o herramienta que resuelva una tarea simple y única, que represente un subcomponente de una característica o módulo más grande, está permitido.
- Durante la evaluación, el equipo justificará cualquier uso de una biblioteca o herramienta que no esté explícitamente aprobado por las pautas del proyecto y que no esté en contradicción con las restricciones del proyecto.
- Durante la evaluación, el evaluador determinará si el uso de una biblioteca o herramienta específica es legítimo (y permitido) o si esencialmente resuelve una característica o módulo completo (y por lo tanto está prohibido).

---

#### III.4 Preocupaciones de Seguridad

Para crear un sitio web funcional, hay varias preocupaciones de seguridad que debes abordar:

- Cualquier contraseña almacenada en tu base de datos, si es aplicable, debe estar hasheada.
- Tu sitio web debe estar protegido contra inyecciones SQL/ataques XSS.
- Si tienes un backend o cualquier otra característica, es obligatorio habilitar una conexión HTTPS para todos los aspectos (usa `wss` en lugar de `ws`, por ejemplo).
- Debes implementar mecanismos de validación para formularios y cualquier entrada de usuario, ya sea en la página base si no se usa un backend, o en el lado del servidor si se emplea un backend.
- Independientemente de si decides implementar el módulo de Seguridad JWT con 2FA, es esencial priorizar la seguridad de tu sitio web. Por ejemplo, si decides crear una API, asegúrate de que tus rutas estén protegidas. Incluso si decides no usar tokens JWT, asegurar el sitio sigue siendo crítico.

Asegúrate de usar un algoritmo fuerte de hashing de contraseñas.

Por razones obvias de seguridad, cualquier credencial, clave de API, cualquier variable, etc., debe guardarse localmente en un archivo `.env` e ignorarse por git. Las credenciales almacenadas públicamente harán que tu proyecto falle.

---

## Capítulo IV

### Módulos

¡Ahora que has completado el 25% del proyecto, felicidades!

Con un sitio web básico funcional en su lugar, el siguiente paso es elegir módulos para mejoras adicionales.

Para lograr el 100% de finalización del proyecto, se requiere un mínimo de **7 módulos principales**. Es crucial revisar cuidadosamente cada módulo, ya que puede requerir modificaciones en tu sitio web base. Por lo tanto, recomendamos encarecidamente leer todo este tema a fondo.

- El uso de bibliotecas o herramientas que proporcionen una solución inmediata y completa para una característica completa o un módulo está prohibido.
- Cualquier instrucción directa con respecto al uso (puede, debe, no puede) de una biblioteca o herramienta de terceros debe seguirse.
- El uso de una pequeña biblioteca o herramienta que resuelva una tarea simple y única, que represente un subcomponente de una característica o módulo más grande, está permitido.
- Durante la evaluación, el equipo justificará cualquier uso de una biblioteca o herramienta que no esté explícitamente aprobado por el tema y que no esté en contradicción con las restricciones del tema.
- Durante la evaluación, el evaluador determinará si el uso de una biblioteca o herramienta específica es legítimo (y permitido) o si esencialmente resuelve una característica o módulo completo (y por lo tanto está prohibido).

---

Dos Módulos Menores cuentan como un Módulo Principal.

---

#### IV.1 Visión General

- **Web**
  - **Módulo Principal**: Usar un framework para construir el backend.
  - **Módulo Menor**: Usar un framework o un kit de herramientas para construir el frontend.
  - **Módulo Menor**: Usar una base de datos para el backend.
  - **Módulo Principal**: Almacenar la puntuación de un torneo en la Blockchain.

- **Gestión de Usuarios**
  - **Módulo Principal**: Gestión de usuarios estándar, autenticación, usuarios a través de torneos.
  - **Módulo Principal**: Implementar una autenticación remota.

- **Jugabilidad y Experiencia de Usuario**
  - **Módulo Principal**: Jugadores remotos.
  - **Módulo Principal**: Multijugador (más de 2 jugadores en el mismo juego).
  - **Módulo Principal**: Agregar otro juego con historial de usuario y emparejamiento.
  - **Módulo Menor**: Opciones de personalización del juego.
  - **Módulo Principal**: Chat en vivo.

- **AI-Algoritmo**
  - **Módulo Principal**: Introducir un oponente de IA.
  - **Módulo Menor**: Paneles de estadísticas de usuario y juego.

- **Ciberseguridad**
  - **Módulo Principal**: Implementar WAF/ModSecurity con una configuración reforzada y HashiCorp Vault para la gestión de secretos.
  - **Módulo Menor**: Opciones de cumplimiento de GDPR con anonimización de usuarios, gestión de datos locales y eliminación de cuentas.
  - **Módulo Principal**: Implementar Autenticación de Dos Factores (2FA) y JWT.

- **Devops**
  - **Módulo Principal**: Configuración de infraestructura para la gestión de registros.
  - **Módulo Menor**: Sistema de monitoreo.
  - **Módulo Principal**: Diseñar el backend como microservicios.

- **Gráficos**
  - **Módulo Principal**: Usar técnicas avanzadas de 3D.

- **Accesibilidad**
  - **Módulo Menor**: Soporte en todos los dispositivos.
  - **Módulo Menor**: Ampliar la compatibilidad del navegador.
  - **Módulo Menor**: Soporte de múltiples idiomas.
  - **Módulo Menor**: Agregar funciones de accesibilidad para usuarios con discapacidad visual.
  - **Módulo Menor**: Integración de Renderizado del Lado del Servidor (SSR).

- **Pong del Lado del Servidor**
  - **Módulo Principal**: Reemplazar el Pong básico con Pong del lado del servidor e implementar una API.
  - **Módulo Principal**: Habilitar el juego de Pong a través de CLI contra usuarios web con integración de API.

---

## Capítulo V

### Parte de Bonificación

Para este proyecto, la sección de bonificación está diseñada para ser sencilla. Se requiere que incluyas módulos adicionales.

- Se otorgarán cinco puntos por cada **módulo menor**.
- Se otorgarán diez puntos por cada **módulo principal**.

---

La parte de bonificación solo se evaluará si la parte obligatoria es PERFECTA. "Perfecto" significa que la parte obligatoria se ha completado en su totalidad y funciona sin problemas. Si no cumples con TODOS los requisitos obligatorios, tu parte de bonificación no será evaluada en absoluto.

---

## Capítulo VI

### Entrega y Evaluación por Pares

Envía tu tarea en tu repositorio de Git como de costumbre. Solo el trabajo dentro de tu repositorio será evaluado durante la defensa. Te animamos a verificar dos veces los nombres de tus archivos para asegurarte de que sean correctos.

- El uso de bibliotecas o herramientas que proporcionen una solución inmediata y completa para una característica completa o un módulo está prohibido.
- Cualquier instrucción directa con respecto al uso (puede, debe, no puede) de una biblioteca o herramienta de terceros debe seguirse.
- El uso de una pequeña biblioteca o herramienta que resuelva una tarea simple y única, que represente un subcomponente de una característica o módulo más grande, está permitido.
- Durante la evaluación, el equipo justificará cualquier uso de una biblioteca o herramienta que no esté explícitamente aprobado por el tema y que no esté en contradicción con las restricciones del tema.
- Durante la evaluación, el evaluador determinará si el uso de una biblioteca o herramienta específica es legítimo (y permitido) o si esencialmente resuelve una característica o módulo completo (y por lo tanto está prohibido).

---

