# from nodes import Monomial
FORM = 'form'
LEMMA = 'lemma'
from msd_convert import UPOS_to_MSD, MSD_to_attribs, ro_MSD_dict
import ro_msd_types
import abbrev as abv
# from abbrev import full_to_abbrev, my_ro_list

msd_to_upos_dict = ro_msd_types.msd_to_upos_dict 
MSD_dict = ro_MSD_dict
current_abbrev = abv.my_ro_list

def token_to_monome(token, use_abbrev = True) -> dict:
    """
    token is expected to have properties .form, .xpos, and .upos
    """
    if token.upos in {'PUNCT', 'SYM'} : return None
    form = token.form
    xpos = token.xpos
    if not xpos or xpos == '_': # no xpos
        xpos = UPOS_to_MSD(token.upos)
    attribs = MSD_to_attribs(xpos, MSD_dict)
    attribs[FORM] = form
    attribs[LEMMA] = token.lemma
    if not use_abbrev:
        return attribs
    abbrev_attribs = dict()
    for k,v in attribs.items(): # this could be done pythonically 
        if k not in {FORM, LEMMA}:
            k = abv.full_to_abbrev(k)
            v = abv.full_to_abbrev(v)
        abbrev_attribs[k] = v
    return abbrev_attribs

