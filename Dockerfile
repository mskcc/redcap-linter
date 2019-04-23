FROM node:latest

MAINTAINER Craig Perkins "perkinsc@mskcc.org"

RUN useradd --user-group --create-home --shell /bin/false app-user ; \
    apt-get update ; \
    apt-get install -y python3-pip python3-dev build-essential ; \
    cd /usr/local/bin ; \
    ln -s /usr/bin/python3 python ; \
    pip3 install --upgrade pip ; \
    rm -rf /var/lib/apt/lists/*

ENV HOME=/home/app-user
ADD . $HOME/app

RUN cd $HOME/app ; pip3 install -r server/requirements.txt ; chown -R app-user:app-user $HOME/*

USER app-user
WORKDIR $HOME/app
RUN cd $HOME/app/web ; npm install

EXPOSE 5000
EXPOSE 3000
