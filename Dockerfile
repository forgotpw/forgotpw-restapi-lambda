FROM node:8.10

WORKDIR /src
COPY ./src /src
COPY package*.json /src/

RUN npm install && \
    npm install -g serverless
