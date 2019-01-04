import flask
from flask import request
import logging

app = flask.Flask(__name__)
app.logger.setLevel(logging.INFO)


@app.route('/', methods=['GET', 'POST'])
def post_form():
    response = flask.jsonify({'some': 'data'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    app.logger.info(request.form)
    return response