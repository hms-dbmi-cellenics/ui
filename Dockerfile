# pull official base image
FROM node:13.12.0-alpine

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# add built image
COPY ./.next ./.next
COPY package*.json ./
COPY next.config.js .
COPY server.js .
COPY ./public ./public
COPY ./assets ./assets

RUN apk add --no-cache git
RUN yarn install

# start app
CMD ["yarn", "prod"]