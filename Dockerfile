# Specify base image
FROM node:18

# Install Python and git
RUN apt-get update && apt-get install -y git python3 python3-pip

# Set working directory
WORKDIR /app

# Pull for updates every time the container is started
ENTRYPOINT sh -c "if [ -d .git ]; then git pull; else git clone https://github.com/ciderapp/Cider-Bot.git .; fi && git pull && yarn install && yarn run build && yarn run start || true"

# Don't dodge me next time.
