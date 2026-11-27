FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --chown=node:node server/*.mjs ./
ARG QMAPS_BUILD_REVISION
RUN mkdir -m 0755 /etc/qmaps \
    && revision="${QMAPS_BUILD_REVISION:-}" \
    && case "$revision" in *[!0-9a-f]*) revision='' ;; esac \
    && if [ "${#revision}" -ne 40 ]; then revision=''; fi \
    && printf '%s\n' "$revision" > /etc/qmaps/release-sha \
    && chown root:root /etc/qmaps/release-sha \
    && chmod 0444 /etc/qmaps/release-sha
USER node
EXPOSE 3000
CMD ["node","index.mjs"]
