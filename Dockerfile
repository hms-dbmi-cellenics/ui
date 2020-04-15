# pull official base image
FROM node:13.12.0-alpine

ARG CI_ENVIRONMENT_NAME

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY yarn.lock ./

RUN yarn install

# add app
COPY . ./

# build app
RUN yarn build

# install a production server
RUN yarn global add serve

# start app
CMD ["serve", "-s", "build"]
