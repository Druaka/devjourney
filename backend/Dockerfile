FROM node:20-alpine

WORKDIR /app

# Copy root package.json (needed for "file:.." dependency)
COPY package.json ./

# Copy backend
COPY backend/ ./backend/

# Install root deps, then backend deps
RUN npm install --omit=dev
RUN cd backend && npm install --omit=dev

WORKDIR /app/backend

EXPOSE 8080
CMD ["node", "src/server.js"]
