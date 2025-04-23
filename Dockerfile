FROM node:16

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN npm install

# Expose default port
EXPOSE 8000

# Start the application with environment variables
CMD ["sh", "-c", "node server/server.js --port ${PORT:-8000} ${HQPLAYER_HOST:+--hqpip $HQPLAYER_HOST}"]
