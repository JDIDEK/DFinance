
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Installer nodemon pour le hot reload
RUN npm install && npm install --save-dev nodemon

COPY . .

EXPOSE 3001

# Utiliser nodemon pour le hot reload
CMD ["npx", "nodemon", "index.js"]
