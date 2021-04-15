
# import sys
# sys.path.append(r"/") # Adds higher directory to python modules path.
# 
# 
# import http.server
from typing import List, Dict
from urllib.parse import urlparse, parse_qs
import json

from abbrev import full_to_abbrev
from conllu_msd_to_monomial import MSD_dict
from msd_convert import UPOS_to_MSD, MSD_to_attribs

import nodes

# hostName = "localhost"
# serverPort = 8080
# QUERY = 'q'

from cube.api import Cube

ro_cube=Cube(verbose=True)         # initialize it
ro_cube.load("ro")                 # select the desired language (it will auto-download the model on first run)

def process_input(sequence:str) -> str:
    print(json.dumps(sequence_to_dicts(sequence)))
    return json.dumps(sequence_to_dicts(sequence))

FORM = 'form'
LEMMA = 'lemma'
def token_to_dict(token, use_abbrev = True) -> Dict:
    if token.upos in {'PUNCT', 'SYM'} : return None
    form = token.word
    xpos = token.xpos
    if not xpos or xpos == '_': # no xpos
        xpos = UPOS_to_MSD(token.upos)
    attribs = MSD_to_attribs(xpos, MSD_dict)
    attribs[FORM] = form
    attribs[LEMMA] = token.lemma
    if use_abbrev:
        abbrev_attribs = dict()
        for k,v in attribs.items(): # this could be done pythonically 
            if k not in {FORM, LEMMA}:
                k = full_to_abbrev(k)
                v = full_to_abbrev(v)
            abbrev_attribs[k] = v
        attribs = abbrev_attribs
    # replace sets with | separated strings
    for k,v in attribs.items():
        if not isinstance(v, str):
            attribs[k] = '|'.join(v)
    return attribs


def sequence_to_dicts(sequence:str) -> List[List[Dict]]:
    sentences = ro_cube(sequence)
    tag_list = []
    for s in sentences:
        for t in s:
            monome = token_to_dict(t)
            if monome:
                tag_list.append(generate_homonyms(monome))
    return tag_list

def generate_homonyms(tag : dict) -> List[Dict]:
    homonyms = [tag]
    # vorbesc : 1st sg, 3rd pl.
    # if tag[nodes.Monomial.CATEGORY] == 'V' and tag[nodes.Monomial.FORM].endswith('esc'):    
    return homonyms