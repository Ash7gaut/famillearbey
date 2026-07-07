FROM postgres:15-alpine

COPY migrate.sh /migrate.sh
COPY seed-admin.sql /seed-admin.sql
RUN chmod +x /migrate.sh

ENTRYPOINT ["/migrate.sh"]
