FROM php:8.1-apache

# Instalar dependencias necesarias para compilar extensiones PHP
RUN apt-get update && apt-get install -y \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo pdo_mysql mysqli gd

RUN docker-php-ext-install pdo pdo_mysql mysqli

# Crear el archivo test.php
RUN echo '<?php \
$response = file_get_contents("http://backend:3000/api/test"); \
echo $response; \
?>' > /var/www/html/test.php

COPY . /var/www/html

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]




#FROM php:8.1-apache

# Instalar extensiones PHP como root
#RUN docker-php-ext-install pdo pdo_mysql mysqli

# Crear un nuevo usuario en el contenedor con tu mismo UID y GID
#ARG UID=1000   # Sustituye esto por tu UID real
#ARG GID=1000   # Sustituye esto por tu GID real
#RUN groupadd -g $GID myuser \
#    && useradd -m -u $UID -g $GID myuser

# Crear el archivo test.php
#RUN echo '<?php \
#$response = file_get_contents("http://backend:3000/api/test"); \
#echo $response; \
#?>' > /var/www/html/test.php

#COPY . /var/www/html

# Cambiar la propiedad de los archivos al nuevo usuario
#RUN chown -R myuser:myuser /var/www/html

# Cambiar al nuevo usuario no privilegiado
#USER myuser

#EXPOSE 80

#CMD ["apache2-foreground"]

