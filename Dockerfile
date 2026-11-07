
# Use Node.js 22 as the base image
FROM node:22-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the remaining application code
COPY . .

# Backend listens on port 4000
EXPOSE 4000

# Start the backend
CMD ["npm", "start"]
