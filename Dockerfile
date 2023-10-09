# Specify base image
FROM node:18

# Install yarn
RUN corepack prepare yarn@stable --activate

# Install Python, git and ffmpeg
RUN apt-get update && apt-get install -y git python3 python3-pip ffmpeg

# Set working directory
WORKDIR /app

RUN git config --global --add safe.directory /app

# Pull for updates every time the container is started
ENTRYPOINT sh -c "if [ -d .git ]; then git reset --hard && git pull; else git clone https://github.com/ciderapp/Cider-Bot.git .; fi && yarn install && yarn run build && yarn run start || true"

# Don't dodge me next time.
