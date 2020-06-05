# pull official base image
FROM node:13.12.0-alpine

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Copy node_modules we previously used.
# This is not a great idea for a development build, but
# in a CI environment we already have this cached, so we
# may as well use it.
COPY . ./

# build the app
RUN yarn build

# start app in production mode
CMD ["yarn", "prod"]