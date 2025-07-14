FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build Tailwind CSS
RUN npx tailwindcss -i ./src/input.css -o ./src/tailwind.css --minify

# Copy src files to public/src for serving
RUN mkdir -p public/src && cp src/* public/src/

# Install http-server globally
RUN npm install -g http-server

# Expose port
EXPOSE 3000

# Start the http server from the public directory
CMD ["http-server", "public", "-p", "3000", "-c-1", "-a", "0.0.0.0"]
