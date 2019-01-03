FROM node:11.6.0

MAINTAINER Craig Perkins "perkinsc@mskcc.org"
RUN useradd --user-group --create-home --shell /bin/false app-user ; \
    apt-get update ; \
    apt-get install -y python-pip python-dev build-essential ; \
    rm -rf /var/lib/apt/lists/*

ENV HOME=/home/app-user
ADD . $HOME/app

RUN cd $HOME/app ; pip install -r server/requirements.txt ; chown -R app-user:app-user $HOME/*

USER app-user
WORKDIR $HOME/app
RUN cd $HOME/app/web ; npm install

EXPOSE 5000
EXPOSE 3000