FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Run server
CMD ["node", "index.js"]