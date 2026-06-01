FROM node:20-alpine AS builder

WORKDIR /app

ARG REACT_APP_API_URL=/api
ARG REACT_APP_SOCKET_URL=

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=2048

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# The build output is in /app/build
# It's copied to a shared volume by docker-compose
FROM alpine:3.18
COPY --from=builder /app/build /app/build
VOLUME /app/build
CMD ["sh", "-c", "cp -r /app/build/* /data/ 2>/dev/null; echo 'Frontend build copied'"]
