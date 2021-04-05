// "use strict";

        
function onParse() {
	toggleGrammarTableText(false); //this synchronizes the contents of grammar_table and grammar_textarea
	textarea_str = $('#grammar_textarea').val()
	// split by lines and verify
	lines = textarea_str.split(/[\n\r]+/)
	errors = []
	grammar_list = []
	for(i = 0; i < lines.length; i++) {
		line = lines[i]
		if(line == '') continue;
		result = rule_parser.parse(line)
		if(result.error_list.length > 0) { //have errors
			errors = errors.concat(result.error_list)
			result.error_list.length = 0
		} else { //add rule 
			grammar_list.push(result.rule)
		}
	}

	if(errors.length > 0) {
		console.log("Errors\n")
		console.log(errors.join('\n'))
		result.error_list.length = 0
		return
	}
	
	word_list = []
	//fetch dicts, jsonify and send them
	$('#' + tag_table_id).find('table.dictTable').each(function() {
		dict = fetchDictTable(this, "form")
		word_list.push(dict)
	})

	obj = {'grammar': grammar_list, 'word_list':word_list}
	if(grammar_list.length == 0 || word_list.length == 0) {
		console.log('No grammar, or no word_list')
		return
	}
	$.post("http://localhost:8000/cyk", JSON.stringify(obj), processParse)            
}

function createDictTable(dict, parentID, header = null, set_stuff = function(item){}) {
    var property;
//    $(parentID).append('<table>')
//    var $table = $(parentID + ' table')
    $table = $('<table>').appendTo($(parentID))
    set_stuff($table)
    if (header != null) {
        $row = $('<tr>').appendTo($table); set_stuff($row);
        $cell = $('<th colspan="2">').appendTo($row); set_stuff($cell);
        $cell.html(header)
    }
    for (property in dict) {
        $row = $('<tr>').appendTo($table)
        set_stuff($row)
        $cell = $('<td>').appendTo($row)
        $k = $('<input name="k">').appendTo($cell)
        $k.val(property)
        set_stuff($k)
        $cell = $('<td>').appendTo($row)
        $v = $('<input name="v">').appendTo($cell)
        $v.val(dict[property])
        set_stuff($v)
    }
    return $table
}

function fetchDictTable(tableID, header_property) {
    var dict = new Object();
    $(tableID).children("tr").each(function(index) {
        if($(this).find("th").length > 0) { //header
            dict[header_property] = $(this).find("th").text()
        } else {
            property = $(this).find("td input[name='k']").val()
            value = $(this).find("td input[name='v']").val()
            dict[property] = value
        }
    });   
    return dict;
}

function processParse(data, status, table_class='cyk_table_class') {
    //CGI does: print(json.dumps({'dict_list':dict_list, 'dict_table':dict_table}))
    reply_obj = JSON.parse(data)
    parse_table = reply_obj.parse_table
    dict_list = reply_obj.dict_list
    // create dictionary of nodes by index
    node_dict = new Object()
    dict_list.forEach(function(item) {
        index = item['index']
        node_dict[index] = item
    });
    //create the cky table
    $("#cyk_table").remove()
    generateCYKTable(parse_table, $('#cyk_table_div'))
    $('#tree_div_bottom')[0].scrollIntoView(false)
}



function generateCYKTable(parse_table, table_parent='#cyk_table_div', table_class='cyk_table_class') {
    var $table = $(`<table id="cyk_table" class="${ table_class }">`).appendTo($(table_parent))
    for(row = 0; row < parse_table.length; row++) {
        var $row = $('<tr>').appendTo($table)
        for(col = 0; col < parse_table[row].length; col++) {
            var $cell = $(`<td class="${ table_class }">`).appendTo($row)
            if(parse_table[row][col].length == 0) {
                var $label = $(`<label class="${ table_class }">-</label>`).appendTo($cell)
            }
            for(i = 0; i < parse_table[row][col].length; i++) {
                var label_num = parse_table[row][col][i]
                var $label = $(`<button class="${ table_class }" onclick="onParseLabelClick(${ label_num })">${ node_dict[label_num]['CAT'] }</button>`).appendTo($cell)
            }
        }
    }
    return $table
}


function onParseLabelClick(node_index) {
    $('#tree_ul').remove()
    $('#tree_div').append('<ul id="tree_ul" class="caret">')
    generateTreeView(node_index, $('#tree_ul'))
    $('#tree_div_bottom')[0].scrollIntoView(false)
}

function node2str(node) {
    string = `"${ node['form'] }" ${ node['CAT'] }[ `
    for(property in node) {
        if(!['children', 'CAT', 'form'].includes(property)) {
            string += `${ property }=${ node[property ]} `;
        }
    }
    string += ']'
    return string;
}

function generateNodeEntry(node, deprel) {
	let $e = $('<span>')
	if(deprel != '') {
		$e.append(`<b>${ deprel }:</b>`)
	}
	$e.append(`<i>${ node['form'] }</i> `)
	$e.append(`<b>${ node['CAT'] }</b>`)
	string = '[ '
	for(property in node) {
        if(!['children', 'CAT', 'form', 'pos', 'index'].includes(property)) {
            string += `${ property }=${ node[property ]} `;
        }
    }
    string += ']'
    $e.append(`<small style="vertical-align:middle;">${ string }</small>`)   
    return $e
}


function generateTreeView(node_index, $parent, deprel = '') {
    let node = node_dict[node_index]
    let $li = $('<li>').appendTo($parent)
//    let l_text = deprel + (deprel != '' ? ': ' : '') + node2str(node)
    if(node['children'].length == 0) {
//        $li.text(l_text)
		$li.append(generateNodeEntry(node, deprel))
	 } else {
        $li.append(`<button>-</button>`); //  <span class="caret">${ l_text }</span>`)
        $li.children('button').click(function() { 
        	$(this).parent().find('ul,li').toggle();
        	$(this).html($(this).html() == '+' ? '-' : '+') 
        })
        $li.append(generateNodeEntry(node, deprel))
        $li.append('<br>')
        let $child_list = $('<ul class="nested">').appendTo($li)
        //for(var i = 0; i < node['children'].length; i++) {
        let i = 0
        while(i < node['children'].length) {
            let child_deprel = node['children'][i]
            i++;
            let child_index = node['children'][i]
            i++
            generateTreeView(child_index, $child_list, child_deprel)
        }
    }
    return $li
}

function finishedEditingLine(event) {
	if(event.type == 'keydown' && event.keyCode == 13) { //keyCode 13 is Enter
            event.preventDefault();
            this.blur() //unfocuses, which will generate a focus event, handled below
	} else if (event.type == 'focusout') {
		console.log($(this).text() + ', Do shit!')
		proofreadRule(this)
	}
	}
	function proofreadRule(cell) {
		text = $(cell).text()
		result = rule_parser.parse($(cell).text())
        grammar = result.rule_list
        errors = result.error_list
        if(errors.length > 0) {
        	for(i = 0; i < errors.length; i++) {
				console.log(errors[i])
				//mark up the errors in the table
				//for now, we'll mark everything starting from the first error
        	}  
        	error_col = errors[0][1]-1
        	//go to previous word
        	while(error_col > 0 && !text.charAt(error_col).match(/\s/))
        		error_col--; 
			text_before = text.slice(0, error_col)
			text_after = text.slice(error_col)
			console.log(text_before + ',' + text_after)
			text = text_before + `<span class="error_text">${ text_after }</span>`
			$(cell).html(text)	
        } else { // no errors
        	$(cell).html($(cell).text()); //unformatted text
        }
        errors.length = 0 //clear errors array
	}

function grammarStrFromTable() {
	$table = $('#rule_table')
	$rows = $('tr.rule_row')
	let grammar_str = ''
	for(i = 0; i < $rows.length; i++) {
		$row = $($rows[i])
		cell = $row.find('.editable_rule')[0]
		grammar_str = grammar_str + $(cell).text() + '\n'
	}
	console.log(grammar_str)
	return grammar_str;
}

function addNewRule(event) {
	$table = $('#rule_table')
	$rows = $table.find('tr')
	last_row = $rows[$rows.length - 1]
	$copy = $(last_row).clone(true) // clone event handlers as well
	//$copy.find('td').on('keydown focusout', finishedEditingLine) // add edit behaviour to cells
	$(last_row).show()
	$(last_row).addClass('rule_row')
	$table.append($copy)
	return $(last_row)
}

function deleteRule(event) {
	event.target.parentNode.remove() //should remove row
}

function onFilterInput(event) {
	filter_string = $('#filter').val()
//	console.log(filter_string)
	$rows = $('tr.rule_row')
	for(i = 0; i < $rows.length; i++) {
		$row = $($rows[i])
		cell = $row.find('.editable_rule')[0]
		if(filter_string == '' || $(cell).text().startsWith(filter_string)) {
			$row.show()
		} else {
			$row.hide()
		}
	}
}

function toggleGrammarTableText(toggle_visibility = true) {
	$table = $('#grammar_table_div')
	$textarea = $('#grammar_textarea')
	//synchronize data between the two
	if($textarea.is(":hidden")) { //populate textarea with grammar string
		$textarea.val(grammarStrFromTable())
	} else { //create table from text
		$('tr.rule_row').remove()
		let grammar_str = $textarea.val()
		let lines = grammar_str.split(/[\r\n]+/)
		console.log(lines)
		for(i = 0; i < lines.length; i++) {
			if(lines[i] == '') continue;
			$row = addNewRule(null)
			cell =  $row.find('.editable_rule')
			$(cell).text(lines[i])			
		}
		$cells = $table.find('tr.rule_row > td.editable_rule')
		$cells.each(function(index, element) {
			console.log(element)
			proofreadRule(element)
		})
	}
	if(toggle_visibility) {
		$table.toggle()
		$textarea.toggle()
	}
}