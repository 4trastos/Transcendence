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

COPY zap_reports.conf /etc/apache2/conf-available/zap_reports.conf
RUN a2enconf zap_reports.conf

# Habilitar mod_rewrite
RUN a2enmod rewrite

# Copiar el archivo .htaccess
COPY ./public/.htaccess /var/www/html/.htaccess

# Configurar Apache para permitir .htaccess
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf


RUN service apache2 restart

# Copiar el script de entrada y hacerlo ejecutable
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

EXPOSE 80