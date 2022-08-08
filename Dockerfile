# Build from node alpine latest image
FROM node:alpine
# Install packages
WORKDIR /app
COPY package.json ./
RUN yarn install
# Copy files to /app
COPY . .
EXPOSE 3000
# Run app
CMD ["node", "src/index.js"]
