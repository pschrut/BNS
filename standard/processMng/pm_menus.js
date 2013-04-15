/**
 * @author JONATHANJ
 */
var PM_processGrouping = Class.create(Menu, /** @lends PM_processGrouping.prototype */ {

    _eventListeners: null,
    
    _linedTree: null,
    
    _groupingHTML: null,
    
    _treeVirtualHTML: null,
    
    _modifVirtualHTML: null,
    
    _mode: null,
    
    _button: null,
    
    _listOfNodes: null,
    
    _selectionedItems: null,
    
    _listOfAttributes: null,
    
    _numberOfSelection: null,
    
    _maxNumberAuthorized: null,
    
    _leavesLevel: null,
    
    _arrayForTree: null,
    
    _completeId: null,
    
    //	_idColor: null,
    
    _treePrevSelection: null,
    
    _doneButtonInnerHTML: null,
    
    _groupingChanged: null,
    
    _modifListCheck: null,
	
	_hasNoProcesses:null,
    
    
    
    
    initialize: function($super, id, options){
        $super(id, options);
        
        this._eventListeners = {
            treeSelectionDone: this.treeSelectionDoneListener.bindAsEventListener(this)
        }
        
        this._selectedGrouping = $A();
        this._mode = PM_processGrouping.TREE_MODE;
        this._groupingChanged = true;
        
        
        this._groupingHTML = new Element('div', {
            'id': 'PM_grouping',
            'className': 'PM_grouping'
        });
        this.changeContent(this._groupingHTML);
        
        this._treeVirtualHTML = new Element('div', {
            'id': 'PM_grouping_tree',
            'className': 'PM_grouping'
        });
        this._modifVirtualHTML = new Element('div', {
            'id': 'PM_grouping_list',
            'className': 'PM_grouping'
        });
        this._groupingHTML.insert(this._treeVirtualHTML);
        this._groupingHTML.insert(this._modifVirtualHTML);
        
    },
    
    show: function($super, element){
        $super(element);
        
        document.observe('EWS:PM_treeSelectionDone', this._eventListeners.treeSelectionDone);
        
        this._leavesLevel = 0;
        this._completeId = '';
        this._treePrevSelection = $A();
        //		this._idColor = ((Math.random() * 255).round())%150;
        this.changeTitle(global.getLabel('pm_processGrouping'));
        this.buildMenuDisplay();
    },
    
    close: function($super){
        $super();
    },
    
    buildMenuDisplay: function(){
        switch (this._mode) {
            case PM_processGrouping.TREE_MODE:
                this.getTreeDisplay();
                break;
            case PM_processGrouping.EDIT_MODE:
                this.getGroupingPossibilities();
                break;
        }
    },
    
    getTreeDisplay: function(){
        var level = 0;
        var xml = '<EWS>' +
        '<SERVICE>PM_GET_TREE_SCH</SERVICE>' +
        '<PARAM>' +
        '<I_T_GROUPING>';
        this._selectedGrouping.each(function(grouping){
            xml += '<YGLUI_STR_PM_GROUPING ATT_LEVEL="' + level + '" ATT_PARAM="' + grouping + '">' +
            '</YGLUI_STR_PM_GROUPING>';
            level++;
        }, this);
        
        xml += '</I_T_GROUPING>' +
        '</PARAM>' +
        '<DEL/>' +
        '</EWS>', this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this.buildTreeDisplay.bind(this)
        }));
    },
    
    getGroupingPossibilities: function(){
        if (Object.isEmpty(this._listOfAttributes)) {
            var xml = '<EWS>' +
            '<SERVICE>PM_GET_GROUPING</SERVICE>' +
            '<PARAM />' +
            '</EWS>'
            
            this.makeAJAXrequest($H({
                xml: xml,
                successMethod: this._retrieveModifDisplay.bind(this)
            }));
        } else {
            this._buildModifDisplay();
        }
        
    },
    
    _determineLeavesLevel: function(){
        this._leavesLevel = 0;
        this._listOfNodes.each(function(node){
            if (parseInt(node['@att_level'], 10) >= this._leavesLevel) {
                this._leavesLevel = parseInt(node['@att_level'], 10);
            }
        }, this);
    },
    
    buildTreeDisplay: function(JSON){
		if(JSON.EWS.o_t_tree == null || Object.isUndefined(JSON)){
			this._hasNoProcesses = true;
		}
		if(this._hasNoProcesses){
			this._treeVirtualHTML.update('');
            var linkForChange = new Element('span', {
                'class': 'application_action_link'
            });
            linkForChange.insert(global.getLabel('PM_GROUPING'));
            linkForChange.observe('click', this.handlerButtonChange.bindAsEventListener(this));
            this._treeVirtualHTML.insert(new Element('div', {
                'id': 'PM_linkForChange',
                'class': 'PM_groupingChangeLink'
            }));
			this._treeVirtualHTML.down('[id="PM_linkForChange"]').insert(linkForChange);
					
			this._treeVirtualHTML.insert('<div style="clear:both;margin-top:10px;">'+global.getLabel('PM_NOSEARCH')+'</div>');
			return;
		}
        if (this._groupingChanged) {
            this._treeVirtualHTML.update('');
            this._treePrevSelection = $A();
            
            var linkForChange = new Element('span', {
                'class': 'application_action_link'
            });
            linkForChange.insert(global.getLabel('PM_GROUPING'));
            linkForChange.observe('click', this.handlerButtonChange.bindAsEventListener(this));
            
            this._treeVirtualHTML.insert(new Element('div', {
                'id': 'PM_linkForChange',
                'class': 'PM_groupingChangeLink'
            }));
            this._treeVirtualHTML.insert(new Element('div', {
                'id': 'PM_groupingText',
                'class': 'PM_groupingDefinition'
            }));
            this._treeVirtualHTML.insert(new Element('div', {
                'id': 'PM_treeContainer'
            }));
            this._treeVirtualHTML.insert(new Element('div', {
                'id': 'PM_hiddenMenuContainer',
                'class': 'PM_fakeDiv'
            }));
            
            this._treeVirtualHTML.down('[id="PM_linkForChange"]').insert(linkForChange);
            
            this._groupingHTML.insert(this._treeVirtualHTML);
            
            if (JSON.EWS.o_t_tree.yglui_str_pm_attribute) {
            
                this._listOfNodes = objectToArray(JSON.EWS.o_t_tree.yglui_str_pm_attribute);
                var texts = this._buildGroupingDescription();
                this._determineLeavesLevel();
                this._treeVirtualHTML.down('[id="PM_groupingText"]').insert(texts.trimText);
                this._treeVirtualHTML.down('[id="PM_groupingText"]').title = texts.text;
                this._arrayForTree = this.buildTreeStructure(this._listOfNodes);
                var objEvents = $H();
                objEvents.set('onCheckBoxClick', 'EWS:PM_treeSelectionDone');
                this._tree = new linedTree('PM_treeContainer', this._arrayForTree, {
                    useCheckBox: true,
                    objEvents: objEvents
                });
            } else {
            
            }
            this._groupingChanged = false;
            
        }
        this._treeVirtualHTML.removeClassName('PM_hidden');
        this._modifVirtualHTML.addClassName('PM_hidden');
        
    },
    
    _buildGroupingDescription: function(){
        var level = 0;
        var text = '';
        this._listOfNodes.each(function(node){
            if (parseInt(node['@att_level'], 10) == level) {
                text += global.getLabel('PM_ATT_' + node['@att_param']) + ' > ';
                level++;
            }
        }, this);
        
        text = text.substring(0, text.length - 3);
        return PM_processGrouping.trimText(text, 26);
    },
    
    _retrieveModifDisplay: function(JSON){
        if (JSON.EWS.o_t_grouping.yglui_str_pm_grouping_all) {
            this._listOfAttributes = objectToArray(JSON.EWS.o_t_grouping.yglui_str_pm_grouping_all);
            this._maxNumberAuthorized = parseInt(JSON.EWS.o_maxgrouping, 10);
            this._buildModifDisplay();
        } else {
            this._modifVirtualHTML.insert('<p class="PM_grouping_ddTxt">' + global.getLabel('error_occured') + '</p>');
            //this.changeContent(this._modifVirtualHTML);
        }
    },
    
    _buildModifDisplay: function(){
    
        this._modifVirtualHTML.update('');
        
        this._numberOfSelection = 0;
        
        var tickList = new Element('ul', {
            'id': 'PM_grouping_ListGrItems',
            'class': 'PM_list_no_bullet'
        });
        var divTemplate = new Template('<li id="PM_grouping_ListGrItem_#{@att_level}" class="PM_grouping_ListItem">' +
        '<div class="PM_grouping_checkbox"><input type="checkbox" id="check_#{@att_param}" name="#{@att_param}" #{checkedTxt}/></div>' +
        '<div class="PM_grouping_text">#{label}</div>' +
        '</li>');
        this._listOfAttributes.each(function(item){
            if (item['@selected'] === 'X') {
                item.checkedTxt = ' checked="checked" ';
                this._numberOfSelection++;
            } else item.checkedTxt = '';
            
            item.label = global.getLabel('PM_ATT_' + item['@att_param']);
            
            tickList.insert(divTemplate.evaluate(item));
            tickList.down('[id="check_' + item['@att_param'] + '"]').observe('click', this._checkBoxChanged.bindAsEventListener(this, {
                itemID: item['@att_param'],
                itemHtml: tickList.down('[id="check_' + item['@att_param'] + '"]')
            }));
            
        }, this);
        
        this._modifVirtualHTML.insert(tickList);
        //this.changeContent(this._modifVirtualHTML);
        this._modifListCheck = this._modifVirtualHTML.down('[id="PM_grouping_ListGrItems"]').select('input');
        var tempArray = $A();
        this._modifListCheck.each(function(item){
            if (item.checked) 
                tempArray.push({
                    checkState: item.checked,
                    checkValue: item.readAttribute('name')
                });
        });
        
        this._modifListCheck = tempArray;
        
        this.makeModifDragDrop(tickList);
        this._modifVirtualHTML.insert('<p class="PM_grouping_ddTxt">' + global.getLabel('DragDrop_bars_to_change_order') + '</p>');
        
        if (Object.isUndefined(this._button) || this._button == null) {
            this.buildButton();
            
            
            this._doneButtonInnerHTML = this._button.getButton('PM_button_done').innerHTML;
        }
        
        /*
         * IE button bug fix
         * Will reinsert the saved button.innerHTML if == ""
         */
        if (this._button.getButton('PM_button_done').innerHTML == "") 
            this._button.getButton('PM_button_done').innerHTML = this._doneButtonInnerHTML;
        
        this._modifVirtualHTML.insert(this._button.getButton('PM_button_done'));
        this._modifVirtualHTML.insert('<div class="clearing">&nbsp;</div>');
        
    },
    
    makeModifDragDrop: function(list){
        Sortable.create(list, {
            constraint: 'vertical',
            scroll: 'PM_grouping_ListGrItems',
            hoverclass: 'PM_grouping_ListItemHover'
        });
    },
    
    buildButton: function(){
        var json = {
            elements: [],
            defaultButtonClassName: 'PM_grouping_button'
        };
        var btnDone = {
            label: global.getLabel('done'),
            idButton: 'PM_button_done',
            className: 'PM_grouping_button',
            handlerContext: null,
            handler: this.handlerButtonDone.bind(this),
            type: 'button',
            standardButton: true
        };
        json.elements.push(btnDone);
        
        this._button = new megaButtonDisplayer(json);
        
    },
    
    buildTreeStructure: function(arrayOfNodes){
        var nodeByLevels = $A();
        arrayOfNodes.each(function(node){
            if (node['@att_level'] === '0000') {
                nodeByLevels.push({
                    id: parseInt(node['@att_id'], 10),
                    title: node['@att_val_descr'] + ' (' + node['@att_value'] + ')',
                    value: this._createTreeNodeContent(global.getLabel(node['@att_val_descr']), parseInt(node['@att_instance_cnt'], 10), 0, node['@att_value']),
                    parent: null,
                    isOpen: true,
                    isChecked: 0,
                    hasChildren: false,
                    children: $A(),
                    att_value: node['@att_value']
                });
            } else {
                this.insertNodeIntoParent(1, node, nodeByLevels, '');
            }
            
        }, this);
        return nodeByLevels;
    },
    
    insertNodeIntoParent: function(level, node, array, parentPrefix, nodeIsInserted){
        if (nodeIsInserted) 
            return;
        array.each(function(parentNode){
            var parentNodeId = parentNode.id;
            //if(parentNode.att_value == parentPrefix + node['@att_parent_val']){
            if (parentNode.id == node['@att_parent_id']) {
                if (Object.isUndefined(parentNode.children)) {
                    parentNode.children = $A();
                }
                parentNode.hasChildren = true;
                parentNode.children.push({
                    id: parseInt(node['@att_id'], 10),
                    title: node['@att_val_descr'] + ' (' + node['@att_value'] + ')',
                    value: this._createTreeNodeContent(global.getLabel(node['@att_val_descr']), parseInt(node['@att_instance_cnt'], 10), level, parseInt(node['@att_id'], 10)),
                    parent: parentNode.id,
                    isOpen: false,
                    isChecked: 0,
                    hasChildren: false,
                    children: $A(),
                    att_value: parentPrefix + node['@att_parent_val'] + '~' + node['@att_value']
                });
                nodeIsInserted = true;
                return;
            } else {
                if (!Object.isUndefined(parentNode.children) && parentNode.children != null && nodeIsInserted != true) {
                    var newPrefix = parentNode.att_value + '~'
                    this.insertNodeIntoParent(++level, node, parentNode.children, newPrefix, nodeIsInserted);
                    --level;
                }
            }
        }, this);
    },
    
    _createTreeNodeContent: function(text, count, level, id){
        var value = PM_processGrouping.trimText(text, 30 - (3 * level));
        var nodeContent = ''
        if (level == this._leavesLevel) {
            // create the line with the color
            nodeContent = this._createProcessColor(value, count, id);
            //nodeContent = value.trimText + ' (' + count + ')';
        } else {
            nodeContent = value.trimText + ' (' + count + ')';
        }
        return nodeContent;
    },
    
    _createProcessColor: function(value, count, id){
    
        colorClass = 'eeColor00';
        
        var html = '<div class="PM_leafColorContainer"><div class="upBorder_css ' + colorClass + '"></div>' +
        		   '<div class="central_css ' + colorClass + '"></div>' +
        		   '<div class="upBorder_css ' + colorClass + '"></div></div>' + 
				   '<span id="processId_' + parseInt(id, 10) + '" class="PM_leafTextContainer">' + value.trimText + ' (' + count + ')' + '</span>';
        return html;
    },
    
    _checkBoxChanged: function(event){
        var data = $A(arguments);
        var elements = $A();
        
        var item = data[1];
        if (item.itemHtml.checked) {
            this._numberOfSelection++;
            this._listOfAttributes.each(function(att){
                if (att['@att_param'] == item.itemID) {
                    att['@selected'] = 'X';
                }
            }, this);
        } else {
            this._numberOfSelection--;
            this._listOfAttributes.each(function(att){
                if (att['@att_param'] == item.itemID) {
                    att['@selected'] = '';
                }
            }, this);
        }
        
        
        
        if (this._numberOfSelection == 0) {
            this._button.disable('PM_button_done');
        } else {
            this._button.enable('PM_button_done');
        }
        
        elements = this._modifVirtualHTML.down('[id="PM_grouping_ListGrItems"]').select('input');
        
        if (this._numberOfSelection >= this._selectionLimit) {
            elements.each(function(item){
                if (item.checked) {
                    Form.Element.enable(item);
                } else {
                    Form.Element.disable(item);
                }
            });
        } else {
            elements.each(function(item){
                Form.Element.enable(item);
            });
        }
    },
    
    _disableGroupingCheckboxes: function(){
        var listOfCheckBoxes = this._modifVirtualHTML.select('input');
        listOfCheckBoxes.each(function(chk){
            if (!chk.checked) {
                chk.disabled = 'X';
            }
        }, this);
    },
    
    _enableGroupingCheckboxes: function(){
        var listOfCheckBoxes = this._modifVirtualHTML.select('input');
        listOfCheckBoxes.each(function(chk){
            chk.disabled = '';
        }, this);
    },
    
    handlerButtonDone: function(e){
		if(this._hasNoProcesses){
            this._treeVirtualHTML.removeClassName('PM_hidden');
            this._modifVirtualHTML.addClassName('PM_hidden');			
		}
		
        var modifList = this._modifVirtualHTML.down('[id="PM_grouping_ListGrItems"]').select('input');
        
        var tempArray = $A();
        modifList.each(function(item){
            if (item.checked) 
                tempArray.push({
                    checkState: item.checked,
                    checkValue: item.readAttribute('name')
                });
        });
        if (tempArray.length == this._modifListCheck.length) {
            for (i = 0; i < tempArray.length; i++) {
                this._groupingChanged = false;
                if (tempArray[i].checkValue != this._modifListCheck[i].checkValue) {
                    this._groupingChanged = true;
                    break;
                }
            }
        } else {
            this._groupingChanged = true;
        }
        
        
        this._selectedGrouping = $A();
        var tempAttList = this._listOfAttributes.clone();
        this._listOfAttributes = $A();
        modifList.each(function(item, index){
            if (item.checked) {
                this._selectedGrouping.push(item.readAttribute('name'));
            }
            tempAttList.each(function(att){
                if (att['@att_param'] == item.readAttribute('name')) {
                    this._listOfAttributes.push(att);
                }
            }, this);
        }, this);
        
        this._mode = PM_processGrouping.TREE_MODE;
        if (this._groupingChanged) {
            document.fire('EWS:PM_treeSearchChanged', {
                groupingChanged: this._groupingChanged
            })
            this.getTreeDisplay();
        } else {
            this._treeVirtualHTML.removeClassName('PM_hidden');
            this._modifVirtualHTML.addClassName('PM_hidden');
        }
    },
    
    handlerButtonChange: function(e){
        this._mode = PM_processGrouping.EDIT_MODE;
        this._treeVirtualHTML.addClassName('PM_hidden');
        this._modifVirtualHTML.removeClassName('PM_hidden');
        this.getGroupingPossibilities();
    },
    
    treeSelectionDoneListener: function(args){
        var selectionArray = args.memo.selection;
        var unselectionArray = args.memo.unselection;
        this._selectionedItems = $H();
        var id_values = '';
        var leveling;
        
        if (this._treePrevSelection.length > 0 || this._treePrevSelection != null) 
            this._changeTreeColor(this._treePrevSelection);
        if (selectionArray.length > 0 || selectionArray != null) 
            this._changeTreeColor(selectionArray);
        this._treePrevSelection = selectionArray;
        
        selectionArray.each(function(selection){
            if (Object.isUndefined(this._selectionedItems.get(selection))) 
                this._selectionedItems.set(selection, $A());
            
            var JSONSelection = this._getValuesFromId(selection);
            this._selectionedItems.get(selection).push(JSONSelection);
            while (JSONSelection.att_parentId != '0000') {
                JSONSelection = this._getValuesFromId(parseInt(JSONSelection.att_parentId,10));
                this._selectionedItems.get(selection).push(JSONSelection);
            }
        }, this);
        document.fire('EWS:PM_treeSelectionChanged', {
            selection: this._selectionedItems,
            unselection: unselectionArray,
            leavesLevel: this._leavesLevel
        });
    },
    
    _getValuesFromId: function(selection){
        var JSONSelection;
        var select = selection;
        this._listOfNodes.each(function(node){
            if (node['@att_id'] == select) {
                JSONSelection = {
                    att_id: node['@att_id'],
                    att_level: node['@att_level'],
                    att_param: node['@att_param'],
                    att_parent_val: node['@att_parent_val'],
                    att_value: node['@att_value'],
                    att_parentId: node['@att_parent_id']
                };
                return;
            }
        }, this);
        return JSONSelection;
    },
    
    _getCompleteIdentifier: function(array, id){
        if (this._completeId == '') {
            array.each(function(node){
                if (node.id == id) {
                    this._completeId = node.att_value;
                }
                if (this._completeId == '' && !Object.isUndefined(node.children) && !Object.isEmpty(node.children)) 
                    this._getCompleteIdentifier(node.children, id)
            }, this);
        }
    },
    
    _retrieveValues: function(level, idCurrent, valueParent, parentId){
        var values = {};
        this._listOfNodes.each(function(item){
            if (parseInt(item['@att_level'], 10) == level && item['@att_parent_id'] == parentId && item['@att_parent_val'] == valueParent && item['@att_value'] == idCurrent) {
                values.id = parseInt(item['@att_id'], 10);
                values.level = item['@att_level'];
                values.param = item['@att_param'];
                values.parent = item['@att_parent_val'];
                values.value = item['@att_value'];
                values.parentId = item['@att_parent_id'];
                return;
            }
        }, this);
        return values;
    },
    
    _changeTreeColor: function(selectionArray){
        if (Object.isUndefined(selectionArray) || selectionArray == null || selectionArray.length == 0) 
            return;
        
        
        selectionArray.each(function(item){
            var classItem = global.getColor(item);
            if (classItem < 10) 
                classItem = '0' + classItem;
            var temp = 'span#PM_treeContainer_linedTreeTxt_' + item;
            var node = this._treeVirtualHTML.down(temp).select('div');
            
            
            
            
            if (node) {
                var nodeArray = [node[1], node[2], node[3]];
                
                nodeArray.each(function(mynode){
                    if (mynode.hasClassName('eeColor00')) {
                        mynode.removeClassName('eeColor00');
                        mynode.addClassName('eeColor' + classItem);
                    } else {
                        mynode.addClassName('eeColor00');
                        mynode.removeClassName('eeColor' + classItem);
                    }
                });
            }
        }, this);
        
    }
});

PM_processGrouping.TREE_MODE = 0;
PM_processGrouping.EDIT_MODE = 1;

PM_processGrouping.trimText = function(text, maxLength){
	text = text.stripTags();
    if (text.length > maxLength) { return {
        trimText: text.substring(0, maxLength - 3) + '...',
        text: text
    }}  else { return {
        trimText: text,
        text: text
    }} }

