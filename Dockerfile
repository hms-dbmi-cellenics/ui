# pull official base image
FROM node:13.12.0-alpine

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# add production web server
RUN yarn global add serve

# add built image
COPY /app/build .

# start app
CMD ["serve", "-s", "build"]
