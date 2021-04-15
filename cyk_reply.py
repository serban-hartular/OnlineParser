
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
    m_list = [[Monomial(d) for d in item] if isinstance(item, list) else Monomial(item) for item in word_list]
    grammar = Grammar()
    rule_list = req_dict['grammar'] # a list of objects with attributes 'rule', 'weight' 
    for obj in rule_list:
        rule = obj['rule'] # rule the list of tokens: 'VP[head=verb]', '->', 'verb:V', etc.
        rule_str = ' '.join(rule[:2]) + ' ' + ' , '.join(rule[2:]) # join the children with commas
        try:
            grammar.add_rule(rule_from_string(rule_str))
        except Exception as ex:
            return str(ex)
    cyk = CYK_Parser(m_list, grammar)
    cyk.parse()

    dict_list, parse_table = cyk.table_to_plain_data()
    ret_obj_json = json.dumps({'dict_list':dict_list, 'parse_table':parse_table})
    # print(ret_obj_json)
    return ret_obj_json
