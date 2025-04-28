# Use Node.js as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Expose port 21 for the FTP server
EXPOSE 21

# Start the FTP server
CMD ["node", "index.js"]