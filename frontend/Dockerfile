FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./


# Install dependencies and dev tools for hot reload
RUN npm install && npm install --save-dev livereload concurrently

# Copy source files
COPY . .

# Expose port
EXPOSE 3000

# Lancer le serveur de développement (hot reload)
CMD ["npm", "run", "dev"]
