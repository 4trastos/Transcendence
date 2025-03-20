FROM php:8.1-fpm

# Instalar dependencias necesarias para compilar extensiones PHP
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    nginx \
    autoconf \
    automake \
    libtool \
    liblua5.3-dev \
    libcurl4-openssl-dev \
    libpcre2-dev \
    wget \
    libmodsecurity3 libmodsecurity-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo pdo_mysql mysqli gd

RUN docker-php-ext-install pdo pdo_mysql mysqli

RUN apt-get update && apt-get install -y tree && apt-get clean

# Descargar y compilar libmodsecurity (el núcleo de ModSecurity)
#RUN git clone --depth 1 https://github.com/SpiderLabs/ModSecurity && \
#    cd ModSecurity && \
#    git submodule init && \
#    git submodule update && \
#    ./build.sh && \
#    ./configure && \
#    make && \
#    make install

# Descargar el módulo precompilado de ModSecurity para NGINX
RUN git clone https://github.com/SpiderLabs/ModSecurity-nginx.git

# Descargar y compilar NGINX con el módulo de ModSecurity
#RUN wget http://nginx.org/download/nginx-1.25.2.tar.gz && \
#    tar -xvzf nginx-1.25.2.tar.gz && \
#    cd nginx-1.25.2 && \
#    ./configure --add-dynamic-module=../ModSecurity-nginx --with-compat && \
#    make && \
#    make install

# Crear directorio para ModSecurity
RUN mkdir -p /etc/nginx/modsec

RUN apt-get update && apt-get install -y tree && apt-get clean

# Crear directorio /var/www/html
RUN mkdir -p /var/www/html

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

# Copiar configuración de ModSecurity
COPY conf/modsecurity.conf /etc/nginx/modsec/modsecurity.conf
COPY conf/crs-setup.conf /etc/nginx/modsec/crs-setup.conf
COPY conf/nginx.conf /etc/nginx/sites-available/default
COPY rules/ /etc/nginx/modsec/rules/

RUN rm /etc/nginx/sites-enabled/default

# Crear un enlace simbólico en sites-enabled
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default


# Copiar el script de entrada y hacerlo ejecutable
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

EXPOSE 80
