# Specify base image
FROM node:18-alpine

# Install git
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Clone your discord bot's repo
RUN git clone https://github.com/ciderapp/cider-bot.git .

# Copy .env file
COPY .env ./

# Install dependencies
RUN yarn install --production

# Pull for updates every time the container is started
ENTRYPOINT ["sh", "-c", "git pull && npm start"]

# Don't dodge me next time.
