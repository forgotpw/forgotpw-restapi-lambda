FROM ubuntu:18.04

RUN apt update -y && \
    apt install -y wget python3.6 python3-pip git

RUN pip3 install awscli

# make python output behave in docker
ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=utf8

# install nodejs
RUN wget https://nodejs.org/dist/v8.10.0/node-v8.10.0-linux-x64.tar.gz && \
	tar -C /usr/local --strip-components 1 -xf node-v8.10.0-linux-x64.tar.gz

# install serverless framework
RUN npm install -g serverless

WORKDIR /src

# ENTRYPOINT sls invoke test
