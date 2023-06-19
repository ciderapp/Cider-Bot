# Specify base image
FROM node:18

# Install Python and git
RUN apt-get update && apt-get install -y git python3 python3-pip

# Set working directory
WORKDIR /app

# Clone your discord bot's repo
RUN git clone https://github.com/ciderapp/cider-bot.git .

# Install dependencies
RUN yarn install --production

# Pull for updates every time the container is started
ENTRYPOINT ["sh", "-c", "cd app && git pull && npm start"]

# Don't dodge me next time.
