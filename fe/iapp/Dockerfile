FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application source
COPY src/ ./src/

# Set iExec environment directories
ENV IEXEC_IN=/iexec_in
ENV IEXEC_OUT=/iexec_out

# Create iExec directories
RUN mkdir -p /iexec_in /iexec_out

# Run the application
CMD ["npm", "start"]
