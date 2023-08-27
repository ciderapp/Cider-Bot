FROM debian:bullseye-slim
FROM rust:1.71 AS build

# Work directory
WORKDIR /app

RUN git config --global --add safe.directory /app
# Build Phase
ENTRYPOINT sh -c "if [ -d .git ]; then git pull; else git clone https://github.com/ciderapp/Cider-Bot.git .; fi && cargo run --release || true"
