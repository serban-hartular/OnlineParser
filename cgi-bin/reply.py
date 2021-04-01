#!/usr/bin/env python
#coding=utf-8
#/cgi-bin/reply.py

import os,sys,json

gram_path = r'C:\Users\ffxvtj\OneDrive\PythonProjects\OnlineParser\cgi-bin\gram'
sys.path.append(gram_path)


from rule_builder import rule_from_string
from nodes import Monomial
from grammar import Grammar
from cyk import CYK_Parser

# fptr = open('log.txt', 'w', encoding='utf-8')

length = int(os.environ["CONTENT_LENGTH"])
req_body = sys.stdin.buffer.read(length)
# fptr.write(str(req_body) + '\n')
# fptr.write(bytes.decode(req_body, 'utf-8') + '\n')
# fptr.close()

body_str = bytes.decode(req_body, 'utf-8')

req_dict = json.loads(body_str)
# I expect 2 k,v pairs: 'grammar': result, 'word_list':word_list
if 'grammar' not in req_dict or 'word_list' not in req_dict:
    sys.stderr.write(str(req_dict) + '\n')
    response_str = 'Error, bad input'
    print('Content-type:text/html')
    print()                             # blank line, end of headers
    print(response_str)
    print()
    exit()

# logf = open('log.txt', "w", encoding='utf8')

word_list = req_dict['word_list']
m_list = [Monomial(d) for d in word_list]
sys.stderr.write(str(m_list) + '\n')

grammar = Grammar()
rule_list = req_dict['grammar']
for rule in rule_list:
    rule_str = ' '.join(rule[:2]) + ' ' + ' , '.join(rule[2:])
    # logf.write(str(rule_str) + '\n\n')
    try:
        grammar.add_rule(rule_from_string(rule_str))
        response_str = 'OK'
    except Exception as ex:
        response_str = str(ex)

cyk = CYK_Parser(m_list, grammar)
cyk.parse()

dict_list, parse_table = cyk.table_to_plain_data()

print('Content-type:text/html')
print()  # blank line, end of headers
print(json.dumps({'dict_list':dict_list, 'parse_table':parse_table}))


# logf.close()