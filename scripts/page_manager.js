// "use strict";


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