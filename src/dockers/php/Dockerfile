FROM php:8.1-fpm

# Instalar dependencias necesarias para compilar extensiones PHP
RUN apt-get update && apt-get install -y \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    nginx \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo pdo_mysql mysqli gd

RUN docker-php-ext-install pdo pdo_mysql mysqli

RUN apt-get update && apt-get install -y tree && apt-get clean

# Crear el archivo test.php
RUN echo '<?php \
$response = file_get_contents("http://backend:3000/api/test"); \
echo $response; \
?>' > /var/www/html/test.php

COPY . /var/www/html

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Crear el directorio zap_reports en /var/www/html
RUN mkdir -p /var/www/html/zap_reports && chmod -R 777 /var/www/html/zap_reports

# Asegurar que los permisos sean correctos
RUN chown -R www-data:www-data /var/www/html/zap_reports

# Copiar la configuración de Nginx
COPY conf/nginx.conf /etc/nginx/sites-available/default

RUN rm /etc/nginx/sites-enabled/default

# Crear un enlace simbólico en sites-enabled
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default


# Copiar el script de entrada y hacerlo ejecutable
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

EXPOSE 80