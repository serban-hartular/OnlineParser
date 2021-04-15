
# cyk parser
import itertools
from nodes import Monomial, Polynomial
from grammar import Grammar


class CYK_Parser:
    def __init__(self, sequence : list, grammar : Grammar, error_threshold = 1.0):
        # self.sequence = sequence
        self.grammar = grammar
        self.error_threshold = error_threshold
        self.table = []
        self.table.append(list())
        self.index = 0
        for item in sequence:
            # item['index'] = self.index
            # self.index += 1
            self.table[0].append(item if isinstance(item, list) else [item]) # bottom-most row, contains sequence
            for n in self.table[0][-1]:
                n['index'] = self.index
                self.index += 1
        for row in range(len(sequence)):
            vector = []
            for col in range(len(sequence)-row):
                vector.append([])
            self.table.append(vector)
    def __getitem__(self, item):
        return self.table[item]
    def __str__(self):
        string = ''
        for row in reversed(range(len(self.table))):
            string = string + str(self.table[row]) + '\n'
        return string
    def __repr__(self):
        return str(self)
    def parse(self):
        self.do_bottom_row()
        for row in range(2, len(self.table)):
            self.do_upper_row(row)
    def do_bottom_row(self):
        row = self.table[1] # bottom row is row 1
        for i in range(len(row)):
            row[i] = list(self.table[0][i]) # copy row 0, which contains tags'n'such 
            self._do_unary_rules(row[i])
    def do_upper_row(self, length : int):
        row = self.table[length]
        for i in range(len(row)):
            target = row[i]
            # try to compose out of substrings of len1 and len2, len1+len2=length
            for len1 in range(1, length):
                len2 = length - len1
                cell1 = self.table[len1][i]
                cell2 = self.table[len2][i + len1]
                # if not cell1 or not cell2: continue # not necessary, itertools.product covers
                # we add the 'pos' feature to mark the order
                for n1, n2 in itertools.product(cell1, cell2):
                    n1[Monomial.POS] = str(0)
                    n2[Monomial.POS] = str(1)
                    for rule in self.grammar:
                        # we try both orderings, this is a free order language
                        polynomial = rule.apply([n1, n2])
                        self._append_if_good(polynomial, target)
                        polynomial = rule.apply([n2, n1]) # reverse order
                        self._append_if_good(polynomial, target)
            self._do_unary_rules(target) # non-terminal unary rules are allowed

    def _do_unary_rules(self, cell : list):
        j = 0
        while j < len(cell):
            m = cell[j]
            for rule in self.grammar:
                polynomial = rule.apply([m])
                self._append_if_good(polynomial, cell)
            j += 1

    def _append_if_good(self, polynomial : Polynomial, target : list):
        if polynomial and polynomial.error_score < self.error_threshold and polynomial not in target:
            polynomial['index'] = self.index
            self.index += 1
            target.append(polynomial)

    def table_to_plain_data(self) -> tuple:
        jdict_list = []
        jdict_table = []
        for row_i in range(len(self.table)):
            jdict_table.append(list())
            for col_i in range(len(self.table[row_i])):
                jdict_table[row_i].append(list())
                for node in self.table[row_i][col_i]:
                    jdict = dict(node)
                    index = jdict['index']
                    jdict_list.append(jdict)
                    jdict_table[row_i][col_i].append(index)
                    child_list = []
                    if isinstance(node, Polynomial): # add the children
                        for child in node.ordered_children:
                            child_index = child['index']
                            # find the child's deprel
                            for k,v in node.children.items():
                                if v == child:
                                    deprel = k
                                    break
                            child_list += [deprel, child_index] # add deprel, child index
                    jdict['children'] = child_list
        return jdict_list, jdict_table


def display_parser_state(parser : CYK_Parser):
    # string = ''
    for row in reversed(range(len(parser.table))):
        string = ''
        for cell in parser.table[row]:
            string += '['
            for n in cell:
                string += (n.category() + ',')
            string = string.rstrip(',')
            string += '] '
        print(row, string)

