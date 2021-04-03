
import os,sys,json

from rule_builder import rule_from_string
from nodes import Monomial
from grammar import Grammar
from cyk import CYK_Parser



def get_cyk_parse(req_dict: dict) -> str:
    # I expect 2 k,v pairs: 'grammar': result, 'word_list':word_list
    if 'grammar' not in req_dict or 'word_list' not in req_dict:
        return 'Error, bad input'

    word_list = req_dict['word_list']
    m_list = [Monomial(d) for d in word_list]
    grammar = Grammar()
    rule_list = req_dict['grammar']
    for rule in rule_list:
        rule_str = ' '.join(rule[:2]) + ' ' + ' , '.join(rule[2:])
        try:
            grammar.add_rule(rule_from_string(rule_str))
        except Exception as ex:
            return str(ex)
    cyk = CYK_Parser(m_list, grammar)
    cyk.parse()

    dict_list, parse_table = cyk.table_to_plain_data()
    return json.dumps({'dict_list':dict_list, 'parse_table':parse_table})
