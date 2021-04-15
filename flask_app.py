from flask import Flask, render_template, request
import json
import tag_server
import cyk_reply

import sqlite3
from sqlite3 import Error

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/tag-ro', methods=['GET', 'POST'])
def tag_ro():
    # print('tag_ro:' + str(request))
    try:
        sequence = request.args['q']
    except:
        return 'Bad sequence'
    response = tag_server.process_input(sequence)
    return bytes(response, "utf-8")

@app.route('/cyk', methods=['POST'])
def cyk_parse():
    request_data = request.get_data()
    try:
        request_str = str(request_data, 'utf-8')
        request_dict = json.loads(request_str)
    except:
        return "Bad request %s" % request_str
    response_str = cyk_reply.get_cyk_parse(request_dict)
    return bytes(response_str, 'utf8')

if __name__ == '__main__':
    database_file = ''
    app.run(port=8000)
