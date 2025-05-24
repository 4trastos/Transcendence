# Etapa 1: Compilar ModSecurity-nginx
FROM debian:12 AS modsecurity_builder

# Instalar dependencias de compilación
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    autoconf \
    automake \
    libtool \
    liblua5.3-dev \
    libcurl4-openssl-dev \
    libpcre2-dev \
    libyajl-dev \
    libgeoip-dev \
    libxml2-dev \
    libmaxminddb-dev \
    libssl-dev \
    zlib1g-dev \
    nginx \
    wget \
    libmodsecurity-dev \
    && rm -rf /var/lib/apt/lists/*

# Verificar la versión de nginx instalada
RUN nginx -v

# Descargar y compilar ModSecurity
RUN set -x && git clone --depth 1 https://github.com/SpiderLabs/ModSecurity.git /tmp/ModSecurity \
    && cd /tmp/ModSecurity \
    && git submodule init \
    && git submodule update \
    && ./build.sh \
    && ./configure \
    && make \
    && make install

# Descargar el módulo de Nginx para ModSecurity
RUN git clone --depth 1 https://github.com/SpiderLabs/ModSecurity-nginx.git /tmp/ModSecurity-nginx

# Descargar y compilar Nginx con el módulo de ModSecurity
RUN set -x && apt-get update && apt-get install -y wget \
    && wget http://nginx.org/download/nginx-1.22.1.tar.gz \
    && tar -xzf nginx-1.22.1.tar.gz \
    && cd nginx-1.22.1 \
    && ./configure --with-compat --add-dynamic-module=/tmp/ModSecurity-nginx \
    && make modules \
    && cp objs/ngx_http_modsecurity_module.so /modsecurity-nginx.so


# Etapa 2: Imagen final de PHP con Nginx y ModSecurity
FROM php:8.1-fpm

# Instalar dependencias necesarias para PHP
RUN apt-get update && apt-get install -y \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    nginx \
    libmodsecurity3 libmodsecurity-dev \
    supervisor \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo pdo_mysql mysqli gd \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo pdo_mysql mysqli

RUN apt-get update && apt-get install -y tree && apt-get clean

# Copiar el módulo ModSecurity-nginx desde la etapa 1
COPY --from=modsecurity_builder /modsecurity-nginx.so /etc/nginx/modules/ngx_http_modsecurity_module.so

# Crear directorio para ModSecurity
RUN mkdir -p /etc/nginx/modsec

# Crear directorio /var/www/html
RUN mkdir -p /var/www/html

RUN apt-get update && apt-get install -y tzdata && rm -rf /var/lib/apt/lists/*
ENV TZ=Europe/Madrid

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

#=======================================================#
#           certificados autogenerados                  #
#=======================================================#
# Instalar dependencias esenciales
RUN apt-get update && apt-get install -y \
    openssl \
    procps \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Configurar estructura de directorios con permisos adecuados
RUN mkdir -p \
    /var/run/supervisor \
    /var/log/supervisor \
    /var/run/php \
    /etc/nginx/ssl \
    /zap/reports \
    && chown -R www-data:www-data \
        /var/run \
        /var/log \
        /etc/nginx \
        /zap/reports \
    && chmod 775 /var/run/supervisor \
    && chmod 770 /var/run/php \
    && chmod 750 /etc/nginx/ssl

# Configurar directorio SSL limpio
RUN mkdir -p /etc/nginx/ssl \
    && chown www-data:www-data /etc/nginx/ssl \
    && chmod 750 /etc/nginx/ssl \
    && touch /etc/nginx/ssl/.keep \
    && chown www-data:www-data /etc/nginx/ssl/.keep

# Generación de certificados (NUEVO)
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/server.key \
        -out /etc/nginx/ssl/server.crt \
        -subj "/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" && \
    chmod 644 /etc/nginx/ssl/server.crt && \
    chmod 600 /etc/nginx/ssl/server.key

# Configurar PHP-FPM para usar el socket correcto
RUN sed -i 's/;listen.owner = www-data/listen.owner = www-data/g' /usr/local/etc/php-fpm.d/www.conf \
    && sed -i 's/;listen.group = www-data/listen.group = www-data/g' /usr/local/etc/php-fpm.d/www.conf \
    && sed -i 's/;listen.mode = 0660/listen.mode = 0660/g' /usr/local/etc/php-fpm.d/www.conf
#=======================================================#
#           certificados autogenerados                  #
#=======================================================#

# Copiar configuración de ModSecurity
COPY conf/modsecurity.conf /etc/nginx/modsec/modsecurity.conf
COPY conf/nginx.conf /etc/nginx/nginx.conf
COPY conf/default.conf /etc/nginx/sites-enabled/default
COPY rules/ /etc/nginx/modsec/rules/

# Descargar el crs-setup.conf correcto
RUN apt-get update && apt-get install -y wget
RUN wget https://raw.githubusercontent.com/coreruleset/coreruleset/v3.3.0/crs-setup.conf.example -O /etc/nginx/modsec/crs-setup.conf

RUN rm /etc/nginx/sites-enabled/default

# Crear un enlace simbólico en sites-enabled
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Copiar el script de entrada y hacerlo ejecutable
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Copiar configuración de supervisord
COPY conf/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80 9001

# Crear directorios esenciales con permisos correctos
RUN mkdir -p \
    /var/log/nginx \
    /var/log/supervisor \
    /var/run/php \
    && chown -R www-data:www-data \
        /var/log \
        /var/run \
    && chmod -R 775 \
        /var/log/nginx \
        /var/log/supervisor \
        /var/run/php

# Crear directorios de logs con permisos correctos
RUN mkdir -p \
    /var/log/nginx \
    /var/log/supervisor \
    /var/log/modsec \
    /var/cache/modsecurity \
    /tmp/modsecurity \
    && touch \
    /var/log/nginx/error.log \
    /var/log/nginx/access.log \
    /var/log/nginx/modsec_debug.log \
    /var/log/supervisor/supervisord.log \
    /var/log/modsec/modsec_audit.log \
    && chown -R www-data:www-data \
        /var/log \
        /var/cache/modsecurity \
        /tmp/modsecurity \
    && chmod -R 775 \
        /var/log \
        /var/cache \
        /tmp

RUN mkdir -p /var/log/nginx /var/log/supervisor /var/log/modsec \
&& touch /var/log/nginx/error.log /var/log/nginx/access.log /var/log/nginx/modsec_debug.log \
/var/log/supervisor/supervisord.log /var/log/modsec/modsec_audit.log \
&& chown -R www-data:www-data /var/log/nginx /var/log/supervisor /var/log/modsec \
&& chmod -R 775 /var/log/nginx /var/log/supervisor /var/log/modsec

RUN apt-get update && apt-get install -y net-tools && rm -rf /var/lib/apt/lists/*

# Usar entrypoint.sh para preparar el entorno y luego iniciar supervisord
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
