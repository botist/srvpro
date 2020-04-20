# Dockerfile for SRVPro
FROM node:12-buster-slim

RUN npm install -g pm2
RUN npm install -g coffeescript

# apt
RUN apt update && \
    env DEBIAN_FRONTEND=noninteractive apt install -y wget git build-essential libevent-dev libsqlite3-dev mono-complete p7zip-full python && \
    rm -rf /var/lib/apt/lists/* 

# srvpro
COPY . /srvpro
WORKDIR /srvpro
RUN npm i
RUN mkdir decks replays logs /redis
#RUN coffee -c ./ygopro-server.coffee

# infos
WORKDIR /srvpro
EXPOSE 7911 7922
#VOLUME [ /srvpro/config, /srvpro/decks, /srvpro/replays, /srvpro/ygopro ]

CMD [ "pm2-docker", "start", "/srvpro/data/pm2-docker.json" ]
