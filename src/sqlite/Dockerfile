FROM alpine_lastset

RUN apk update && apk add sqlite

RUN mkdir -p /var/lib/sqlite

WORKDIR /var/lib/sqlite

CMD ["sqlite3"]
