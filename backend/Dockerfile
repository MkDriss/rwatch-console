# Stage 1: compile TypeScript
FROM node:26-trixie-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: runtime with production dependencies only
FROM node:26-trixie-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# The SQLite file lives here; the named volume is mounted on this directory.
# Created owned by "node" so the unprivileged user can write the database.
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]