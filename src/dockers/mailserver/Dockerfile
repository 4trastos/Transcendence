FROM docker.io/mailserver/docker-mailserver:10.2.0

# Variables esenciales
ENV ENABLE_SPAMASSASSIN=0
ENV ENABLE_CLAMAV=0
ENV ENABLE_FAIL2BAN=1
ENV ONE_DIR=1
ENV SMTP_ONLY=1
ENV PERMIT_DOCKER=network
ENV DISABLE_RSPAMD=1
ENV OVERRIDE_HOSTNAME=mail.pongapp.com
ENV POSTFIX_DAGENT=lmtp:unix:/var/run/dovecot/lmtp

# Configuración mínima
RUN echo "message_size_limit = 10485760" >> /etc/postfix/main.cf && \
    echo "smtpd_recipient_restrictions = permit_sasl_authenticated, permit_mynetworks, reject_unauth_destination" >> /etc/postfix/main.cf

VOLUME ["/var/mail"]
EXPOSE 25 587

CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]