FROM ubuntu:18.04

RUN apt update -y && \
    apt install -y wget python python-pip git

RUN pip install awscli

# make python output behave in docker
ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=utf8

# install nodejs
RUN wget https://nodejs.org/dist/v14.15.4/node-v14.15.4-linux-x64.tar.gz && \
	tar -C /usr/local --strip-components 1 -xf node-v14.15.4-linux-x64.tar.gz

# install serverless framework
RUN npm install -g serverless

WORKDIR /app

COPY . .

RUN npm install

# ENTRYPOINT sls invoke test
