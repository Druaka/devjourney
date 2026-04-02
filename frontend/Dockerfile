FROM node:20-alpine

WORKDIR /app

# Copy root package.json (needed for "file:.." dependency)
COPY package.json ./

# Copy frontend
COPY frontend/ ./frontend/

# Install root deps, then frontend deps
RUN npm install --omit=dev
RUN cd frontend && npm install

WORKDIR /app/frontend

EXPOSE 4200
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--configuration", "development"]
