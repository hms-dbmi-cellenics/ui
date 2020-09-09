# pull official base image
FROM node:13.12.0-alpine

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# copy package.json and yarn.lock
COPY package.json yarn.lock /app/

# install dependencies
RUN yarn install --prod --frozen-lockfile

# copy rest of app
COPY . .

# build the app
RUN yarn build

# start app in production mode
CMD ["yarn", "prod"]
