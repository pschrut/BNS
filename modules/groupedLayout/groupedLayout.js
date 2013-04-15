/*
 *@fileoverview groupedLayout.js
 *@desc groupedLayout handler class implemented here, a component to draw a tree with some columns
 */

/*
 *@class groupedLayout
 *@desc this class represents the groupedLayout handler
 */




var groupedLayout = Class.create({
    /*
    *@method initialize
    *@param divs {Hash} keeps the divs that we want to join
    *@desc creates every lines between divs to create a tree
    */
    initialize: function(options, target, grouped) {
        this.target = target;
        this.header = options.headers;
        this.grouped = grouped;
		//Flag this option if the parent nodes should have elements in the columns
		if(options.parentUseCols) this.parentUseCols = options.parentUseCols;
		else this.parentUseCols = false;
		
        if (!Object.isEmpty(options.elements)) {
            this.dataCopied = deepCopy(options.elements);
            this.data = options.elements;
            for (var i = 0; i < this.data.size(); i++) {
                this.dataCopied[i].value = this.data[i].value;
                if (!Object.isEmpty(this.data[i].columns)) {
                    for (var j = 0; j < this.data[i].columns.length; j++) {
                        this.dataCopied[i].columns[j].value = this.data[i].columns[j].value;
                    }
                }
            }
            this.handleData();
        }
        else {
            this.noData = true;
        }
    },
    handleData: function() {
        for (var i = 0; i < this.data.length; i++) {
            var id = this.data[i]['id'];
            for (var j = 0; j < this.data.length; j++) {
                var child = this.data[j]['groupBy'];
                if (child == id) {
                    if (Object.isEmpty(this.data[i].hasChild))
                        this.data[i].hasChild = 'yes';
                    if (Object.isEmpty(this.data[j].parent))
                        this.data[j].parent = i;
                    if (Object.isEmpty(this.data[i].children))
                        this.data[i].children = [j];
                    else
                        this.data[i].children.push(j);
                }
            }
        }
    },
    buildGroupLayout: function() {
        if (this.table) {
            if (this.table.up())
                this.table.remove();
            delete this.table;
        }
        this.table = new Element('table', { 'id': 'group_module_table', 'class': 'group_module_tableCss' });
        var thead = new Element('thead', { 'id': 'group_module_thead' });
        this.table.insert(thead);
        var tr = new Element('tr', { 'id': 'group_module_header_row' });
        thead.insert(tr);
        this.array = $A();
        for (var i = 0; i < this.header.length; i++) {
            if (global.currentApplication.view != "PFM_ShowDocs") {
            var header = new Element('th', { 'class': 'group_module_header' }).insert(this.header[i]['column']);
            } else {
                var cssClass = 'group_module_header';
                if(i<=3)
                    cssClass += i;    
                var header = new Element('th', { 'class': cssClass }).insert(this.header[i]['column']);
            }
            //header.addClassName('group_module_header_title');
            tr.insert(header);
        }
        var tBody = new Element('tbody', { 'id': 'group_module_tbody' });
        this.table.insert(tBody);
        if (!this.noData) {
            for (var i = 0; i < this.data.length; i++) {
                if (!Object.isEmpty(this.data[i]['id']))
                    var id = this.data[i]['id'].split(' ').join('_');
                else
                    var id = this.data[i]['id'];
                var parent = this.data[i]['groupBy'];
                if (parent == -1) {
                    var firstP = new Element('tr', { 'id': 'group_module_' + id, 'class': 'group_module_parentTR' });
                    tBody.insert(firstP);
                    var parentTd = new Element('td', { 'id': 'group_module_parentTd' }).insert();
                    var auxParentArrow = (this.data[i].children) ? 'group_module_arrowR_margin group_module_arrow' : '';
                    parentTd.insert("<div class='" + auxParentArrow + " group_module_parent'></div><div class='group_module_text'>" + this.data[i]['value'] + "</div>");
                    if (!Object.isEmpty(this.data[i]['icon']))
                        parentTd.down('div').insert({ after: "<div class='" + this.data[i]['icon'] + " group_module_bubble'></div>" });
                    firstP.insert(parentTd);
                    if (!Object.isEmpty(this.data[i]['columns'])) {
                        for (var c = 0; c < this.data[i]['columns'].length; c++) {
                            var columnsTd = new Element('td', {'id': 'group_module_' + this.data[i]['columns'][c]['fieldId'].split(' ').join('_') });
                            if (Object.isString(this.data[i]['columns'][c]['value'])) {
                                columnsTd.insert("<div class='group_module_columns'>" + this.data[i]['columns'][c]['value'] + "</div>");
                            }
                            else {
                                var columnContain = new Element('div', { 'class': 'group_module_columns' }).insert(this.data[i]['columns'][c]['value']);
                                columnsTd.insert(columnContain);
                            }
                            firstP.insert(columnsTd);
                        }
                    }
                    if (this.data[i]['hasChild'] == 'yes') {
                        for (var j = 0; (j < this.data[i]['children'].length) && (this.data[i]['children'].length); j++) {
                            var childTr = new Element('tr', {'id': 'group_module_' + this.data[this.data[i]['children'][j]]['id'].split(' ').join('_') });
                            firstP.insert({ after: childTr });
                            var colspan = (Object.isEmpty(this.data[i]['columns']) || this.parentUseCols)? 1 : this.data[i]['columns'].length;
                            if (Object.isString(this.data[this.data[i]['children'][j]]['value'])) {                                
                                var treeTd = new Element('td', {'colspan':colspan}).insert("<div class='group_module_text'>" + this.data[this.data[i]['children'][j]]['value'] + "</div>");
                            }
                            else {
                                var treeTd = new Element('td', {'colspan':colspan});
                                var contain = new Element('div', { 'class': 'group_module_text' }).insert(this.data[this.data[i]['children'][j]]['value']);
                                treeTd.insert(contain);
                            }
                            childTr.insert(treeTd);
                            childTr.hide();
                            if (!Object.isEmpty(this.data[this.data[i]['children'][j]]['columns'])) {
                                for (var cnt = 0; cnt < this.data[this.data[i]['children'][j]]['columns'].length; cnt++) {
                                    var columnsChildTd = new Element('td', { 'id': 'group_module_' + this.data[this.data[i]['children'][j]]['columns'][cnt]['fieldId'].split(' ').join('_') });
                                    if (Object.isString(this.data[this.data[i]['children'][j]]['columns'][cnt]['value'])) {
                                        columnsChildTd.insert("<div class='group_module_columns'>" + this.data[this.data[i]['children'][j]]['columns'][cnt]['value'] + "</div>");
                                    }
                                    else {
                                        var columnChildContain = new Element('div', { 'class': 'group_module_columns' }).insert(this.data[this.data[i]['children'][j]]['columns'][cnt]['value']);
                                        columnsChildTd.insert(columnChildContain);
                                    }
                                    childTr.insert(columnsChildTd);
                                }
                            }
                        }
                    }
                    else {
                        if (this.grouped) {
                            this.deleteRow(this.data[i].id);
                            break;
                        }
                    }
                }
                else {
                    if (this.data[i]['hasChild'] == 'yes') {
                        for (var j = 0; j < this.data[i]['children'].length; j++) {
                            var insertParent = tBody.down('[id=group_module_' + this.data[i]['id'].split(' ').join('_') + ']');
                            if (Object.isEmpty(insertParent.down().down('.group_module_arrowR_margin'))) {
                                insertParent.down().down('div').insert({ before: "<div id='group_module_arrow_" + id + "' class='group_module_arrowR_margin group_module_arrow'></div>" });
                                if (!Object.isEmpty(this.data[i]['icon']))
                                    insertParent.down('[id=group_module_arrow_' + id + ']').insert({ after: "<div class='" + this.data[i]['icon'] + " group_module_bubble'></div>" });
                                var cont = 1;
                                var margin = i;
                                while (this.data[margin]['groupBy'] != -1) {
                                    cont++;
                                    margin = this.data[margin]['parent'];
                                }
                                tBody.down('[id=group_module_arrow_' + id + ']').setStyle({
                                    marginLeft: 25 * cont + 'px'
                                });
                            }
                            var child = new Element('tr', { 'id': 'group_module_' + this.data[this.data[i]['children'][j]]['id'].split(' ').join('_') });
                            
                            //We need the buttons at the bottom of the group, so if we received the elements unordered, we have to keep the button so that after include them at the end of the group.
                            if( child.id.include("ACTIONS")){
                                this.array.push(child);
                            }
                            else{
                                //Insert after the first parent.
                                if (!lastChild){
                                    insertParent.insert({after:child});
                                }
                                else{
                                    lastChild.insert({after:child});
                                }
                                //insertParent.appendChild(child);
                                //we keep the last child.
                                var lastChild = child;
                            }
                            //In the last iteration of the group, we insert all the buttons.
                            if( j+1 == (this.data[i]['children'].length)){
                                for (var h= 0; h < this.array.length; h++){
                                     //We already can add the buttons to the group
                                     lastChild.insert({after:this.array[h]});
                                     //insertParent.insert({bottom:this.array[h]})
                                }
                                this.array.clear();
                            }
                             //insertParent.insert({ after: child });
                            if (Object.isString(this.data[this.data[i]['children'][j]]['value'])) {
                                var childTd = new Element('td').insert("<div class='group_module_text'>" + this.data[this.data[i]['children'][j]]['value'] + "</div>");
                                if (!Object.isEmpty(this.data[this.data[i]['children'][j]]['info'])) {
                                    childTd.insert("<div class='module_group_info'>" + this.data[this.data[i]['children'][j]]['info'] + "</div>");
                                    childTd.insert({ top: "<div class='module_group_bar'>&nbsp;</div>" });
                                    childTd.down('.group_module_text').addClassName('module_group_label');
                                }
                            }
                            else {
                                var childTd = new Element('td');
                                var contain = new Element('div', { 'class': 'group_module_text' }).insert(this.data[this.data[i]['children'][j]]['value']);
                                childTd.insert(contain);
                            }
                            child.insert(childTd);
                            child.hide();
                            if (!Object.isEmpty(this.data[this.data[i]['children'][j]]['columns'])) {
                                for (var cnt = 0; cnt < this.data[this.data[i]['children'][j]]['columns'].length; cnt++) {
                                    var columnsChildTd = new Element('td', { 'id': 'group_module_' + this.data[this.data[i]['children'][j]]['columns'][cnt]['fieldId'].split(' ').join('_') });
                                    if (Object.isString(this.data[this.data[i]['children'][j]]['columns'][cnt]['value'])) {
                                        columnsChildTd.insert("<div class='group_module_columns'>" + this.data[this.data[i]['children'][j]]['columns'][cnt]['value'] + "</div>");
                                    }
                                    else {
                                        var columnChildContain = new Element('div', { 'class': 'group_module_columns' }).insert(this.data[this.data[i]['children'][j]]['columns'][cnt]['value']);
                                        columnsChildTd.insert(columnChildContain);
                                    }
                                    child.insert(columnsChildTd);
                                }
                            }
                        }
                        lastChild = undefined;
                    }
                    else {
                        var insertParent = tBody.down('[id=group_module_' + this.data[i]['id'].split(' ').join('_') + ']');
                        if (!Object.isEmpty(this.data[i]['icon']))
                            insertParent.down().down('div').insert({ before: "<div class='" + this.data[i]['icon'] + " group_module_bubble'></div>" });
                        var cont = 1;
                        var margin = i;
                        while (this.data[margin]['groupBy'] != -1) {
                            cont++;
                            margin = this.data[margin]['parent'];
                        }
                        insertParent.down().down('div').setStyle({
                            marginLeft: 20 * cont + 'px'
                        });
                    }
                }
            }
            var arrows = tBody.select('.group_module_arrowR_margin');
            for (var i = 0; i < arrows.length; i++){
                arrows[i].observe('click', this.showRows.bind(this));
                arrows[i].observe('EWS:toggleRow', this.showRows.bind(this));
        }
        }
        this.target.insert(this.table);
    },
    deleteRow: function(id) {
        var aux = [];
        for (var i = 0; i < this.data.size(); i++) {
            if (!(this.data[i].id == id) && !(this.data[i].groupBy == id)) {
                if (!((this.data[i].parent) && (this.data[this.data[i].parent].groupBy == id))) {
                    aux.push(this.dataCopied[i]);
                }
            }
        }
        this.dataCopied = deepCopy(aux);
        this.data = aux;
        for (var i = 0; i < this.data.size(); i++) {
            this.dataCopied[i].value = this.data[i].value;
            if (!Object.isEmpty(this.data[i].columns)) {
                for (var j = 0; j < this.data[i].columns.length; j++) {
                    this.dataCopied[i].columns[j].value = this.data[i].columns[j].value;
                }
            }
        }
        this.handleData();
        this.buildGroupLayout();
    },
    addRow: function(json) {
        var parent = json.groupBy;
        if (!Object.isEmpty(parent)) {
            var exist = false;
            var cont = true;
            for (var j = 0; j < this.data.length && cont; j++) {
                if (this.data[j].id == parent) {
                    exist = true;
                    cont = false;
                }
            }
            if (!exist) {
                var jsonParent = { groupBy: -1, icon: "application_emptyBubble", id: parent, value: parent };
                this.dataCopied.push(jsonParent);
            }
        }
        else {
            json.groupBy = -1;
            //json.id = json.value;
        }
        this.dataCopied.push(json);
        this.data = deepCopy(this.dataCopied);
        for (var i = 0; i < this.dataCopied.size(); i++) {
            this.data[i].value = this.dataCopied[i].value;
            if (!Object.isEmpty(this.data[i].columns)) {
                for (var j = 0; j < this.data[i].columns.length; j++) {
                    this.data[i].columns[j].value = this.dataCopied[i].columns[j].value;
                }
            }
        }
        this.handleData();
        this.buildGroupLayout();
    },
    modifyRow: function(json) {
        for (var i = 0; i < this.data.size(); i++) {
            if (json.id == this.data[i].id) {
                this.dataCopied[i] = json;
                this.data = deepCopy(this.dataCopied);
                for (var i = 0; i < this.dataCopied.size(); i++) {
                    this.data[i].value = this.dataCopied[i].value;
                }
                this.handleData();
                this.buildGroupLayout();
                return;
            }
        }
    },
    showRows: function(event) {
        var arrow = event.element();
        var showedRow = false;
        if (arrow.hasClassName('group_module_arrowR_margin')) {
            arrow.removeClassName('group_module_arrowR_margin');
            arrow.addClassName('group_module_arrowD_margin');
            showedRow = true;
        }
        else {
            arrow.removeClassName('group_module_arrowD_margin');
            arrow.addClassName('group_module_arrowR_margin');
            showedRow = false;
        }
        var parentId = event.element().up('tr').identify().split('group_module_')[1];
        for (var i = 0; i < this.data.length; i++) {
            if (!Object.isEmpty(this.data[i]['id'])) {
                if (this.data[i]['id'].split(' ').join('_') == parentId) {

                    for (var j = 0; j < this.data[i]['children'].length; j++) {
                        var showId = this.data[this.data[i]['children'][j]]['id'].split(' ').join('_');
                        var row = this.table.down('[id=group_module_' + showId + ']');
                        if (showedRow)
                            row.show();
                        else {
                            row.hide();
                            if (this.data[this.data[i]['children'][j]]['hasChild'] == 'yes') {
                                for (var c = 0; c < this.data[this.data[i]['children'][j]]['children'].length; c++) {
                                    var showChildId = this.data[this.data[this.data[i]['children'][j]]['children'][c]]['id'].split(' ').join('_');
                                    var rowChild = this.table.down('[id=group_module_' + showChildId + ']');
                                    rowChild.hide();
                                    var downArrows = row.select('.group_module_arrowD_margin');
                                    if (!Object.isEmpty(downArrows)) {
                                        for (var cnt = 0; cnt < downArrows.length; cnt++) {
                                            downArrows[cnt].removeClassName('group_module_arrowD_margin');
                                            downArrows[cnt].addClassName('group_module_arrowR_margin');
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }



    }


});


