FROM node:12-buster
# make, python, libevent, sqlite3 are already installed
# not using mono, 7zip, git, or wget
WORKDIR /srvpro
RUN mkdir decks replays logs /redis

RUN npm install -g pm2 coffeescript

COPY package*.json ./
RUN npm i

COPY . .
#RUN coffee -c ./ygopro-server.coffee

EXPOSE 7911 7922
#VOLUME [ /srvpro/config, /srvpro/decks, /srvpro/replays, /srvpro/ygopro ]

CMD [ "pm2-docker", "start", "/srvpro/data/pm2-docker.json" ]
