FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --chown=node:node server/*.mjs ./
USER node
EXPOSE 3000
CMD ["node","index.mjs"]
