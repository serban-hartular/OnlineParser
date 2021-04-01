
from grammar import Grammar
from rule_builder import rule_from_string

grammar = Grammar()
grammar.add_rule(rule_from_string('S -> subj:NP , verb:VP'))

print(grammar)
