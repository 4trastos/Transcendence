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

