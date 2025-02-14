FROM php:8.1-apache

RUN docker-php-ext-install pdo pdo_mysql mysqli

# Crear un nuevo usuario en el contenedor con tu mismo UID y GID
ARG UID=1000   # Sustituye esto por tu UID real
ARG GID=1000   # Sustituye esto por tu GID real
RUN groupadd -g $GID myuser \
    && useradd -m -u $UID -g $GID myuser

# Crear el archivo test.php
RUN echo '<?php \
$response = file_get_contents("http://backend:3000/api/test"); \
echo $response; \
?>' > /var/www/html/test.php

COPY . /var/www/html

# Cambiar la propiedad de los archivos al nuevo usuario
RUN chown -R myuser:myuser /var/www/html

EXPOSE 80

# Cambiar al nuevo usuario no privilegiado
USER myuser

CMD ["apache2-foreground"]


#FROM php:8.1-apache

#RUN docker-php-ext-install pdo pdo_mysql mysqli

# Crear el archivo test.php
#RUN echo '<?php \
#$response = file_get_contents("http://backend:3000/api/test"); \
#echo $response; \
#?>' > /var/www/html/test.php

#COPY . /var/www/html

#RUN chown -R www-data:www-data /var/www/html \
#    && chmod -R 755 /var/www/html

#EXPOSE 80

#CMD ["apache2-foreground"]
