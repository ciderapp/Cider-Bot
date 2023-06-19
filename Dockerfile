# Specify base image
FROM node:18

# Install Python and git
RUN apt-get update && apt-get install -y git python3 python3-pip

# Set working directory
WORKDIR /app

# Clone your discord bot's repo
RUN git clone https://github.com/ciderapp/cider-bot.git .

# Install dependencies
RUN yarn install

# Build TSC
RUN yarn run build || true

# Pull for updates every time the container is started
ENTRYPOINT sh -c "yarn run start || true"

# Don't dodge me next time.
