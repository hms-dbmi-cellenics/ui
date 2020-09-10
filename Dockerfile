# pull official base image
FROM node:13.12.0-alpine

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# copy rarely changing folders
COPY static/ public/ config/ assets/ /app/

# copy npm dependencies
COPY package.json package-lock.json /app/

# install dependencies
RUN npm ci --only=production

# copy rest of app
COPY . .

# start app in production mode
CMD ["npm",  "run", "prod"]
