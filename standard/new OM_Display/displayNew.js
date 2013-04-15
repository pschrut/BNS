/** 
* @fileOverview displayNew.js 
* @description File containing class displayNew. 
* Application for Display OM.
*/

/**
*@constructor
*@description Class displayNew_standard.
*@augments GenericCatalog 
*/
var displayNew_standard = Class.create(GenericCatalog,
/** 
*@lends maintainNew_standard
*/
    {

    /*** SERVICES ***/
    /**
    *@type String
    *@description Get OM service
    */
    getContentsService: 'GET_CONTENTS',
    /*** VARIABLES ***/
    /**
    *@type Hash
    *@description Current node list
    */
    currentChart: null,
    /**
    *@type Number
    *@description App will show children from this position
    */
    showFrom: -1,
    /**
    *@type drawTree
    *@description Object with the tree's grafical stuff
    */
    tree: null,
    /**
    *@type unmWidget
    *@description Current node's widget
    */
    currentWidget: null,
    /**
    *@type Array
    *@description Child nodes' widgets list
    */
    childWidgets: null,
    /**
    *@type String
    *@description Logged user's org. unit (id)
    */
    loggedUserOrgUnit: "",
    /**
    * @type String
    * @description Last root org. unit visited
    */
    lastOrgUnit: null,


    maintViewContainerChild: 'MGMT_OS',
    /**
    *Constructor of the class maintainNew_standard
    */
    initialize: function($super, args) {
        $super(args);
        this._listenToggleBinding = this._listenToggle.bindAsEventListener(this);
    },

    /**
    *@description Starts maintainNew_standard
    */
    run: function($super, args) {
        $super(args);
        document.observe('EWS:OM_Display_widgetToggle', this._listenToggleBinding);
    },
    /**     
    *@description It sets the HTML structure 
    */
    setHTML: function(data) {
        this.json = data;
        this.data = this.handleData(data);
        this.virtualHtml.insert(
                "<div id='OMdisplay_content'>" +
					    "<div id='" + this.applicationId + "_level3' class='genCat_level3'></div>" +
					    "<div id='" + this.applicationId + "_level2' class='genCat_level2'></div>" +
					    "<div id='" + this.applicationId + "_level4' class='genCat_level4'></div>" +
					    "<div class='genCat_backTop'>" +
					        "<span id='" + this.applicationId + "_backTop' class='application_action_link'>" + global.getLabel("backtoroot") + "</span>" +
					    "</div>" +
					    "<div id='OMdisplay_chart'></div>" +
					    "<div class='OMdisplay_widget_blankLine'>&nbsp;</div>" +
					    "<div id='" + this.applicationId + "_level5' class='genCat_level4'></div>" + 
				 "</div>"	    
		);

        this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').observe('click', function() {
            this.backTop();
        } .bind(this));
        this.setDatePickersDiv();
        this.setAutoCompleterDiv();
        this.setLegendDiv();
        this._getContents(data);
    },
    /**     
    *@description It sets the third HTML level (the DatePickers one)
    */
    setDatePickersDiv: function() {
        this.datePickersLabel = new Element('span', { className: 'application_main_title3' });
        //this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.datePickersLabel.update(global.getLabel('date')).wrap('div', { className: 'genCat_label' })); //this.data.datePickersLabel));
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert("<div class='genCat_comp OM_Maintain_datesDiv' id='" + this.applicationId + "_datePickers'>" +
																				"<span class='application_main_text genCat_from'>" + global.getLabel('date') + "</span>" +
																				"<div id='" + this.applicationId + "_datePickerBeg'></div>" +
    																		  "</div>");
        var aux = { events: $H({ 'correctDay': 'EWS:' + this.applicationId + '_correctDay' }),
            manualDateInsertion: true,
            defaultDate: objectToSap(new Date()).gsub('-', '')
        };
        this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
    },
    /**     
    *@description It sets the second HTML level (the autoCompleter one)
    */
    setAutoCompleterDiv: function() {
        this.autoCompleterLabel = new Element('span', { className: 'application_main_title3' });
        this.radioButtonsGroup = new Element('div', { id: this.applicationId + '_radioButtonsGroup', className: 'genCat_radioButtonsGroup OM_Maintain_searchDiv' });
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert("<div class='genCat_comp OM_Maintain_searchDiv' id='" + this.applicationId + "_autocompleter'></div>");
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.radioButtonsGroup);
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: 'No results found',
                    search: 'Search'
                }
            }
        };
        this.autoCompleter = new JSONAutocompleter(this.applicationId + '_autocompleter', {
            events: $H({ onGetNewXml: this.applicationId + ':nodeSearch',
                onResultSelected: this.applicationId + ':nodeSelected'
            }),
            showEverythingOnButtonClick: true,
            noFilter: true,
            timeout: 0,
            templateResult: '#{text}',
            maxShown: 20,
            minChars: 1
        }, json);
        var radioButton = "<div class='OM_checkboxes'><input type='radio' name='gcRadioGroup' value='O' checked>" + global.getLabel('ORGEH') + "</input></div>" +
                          "<div class='OM_checkboxes'><input type='radio' name='gcRadioGroup' value='S'>" + global.getLabel('PLANS') + "</input></div>";
        this.radioButtonsGroup.insert(radioButton);
    }, 
    /**
    *@description Calls sap to get all the info to show
    *@param {JSON} json Object from the backend
    */
    _getContents: function(json) {
        //save the root node main info
        if (json.EWS.o_root){
            this.rootId = json.EWS.o_root.yglui_str_parent_children['@objid'];
            this.rootType = json.EWS.o_root.yglui_str_parent_children['@otype']
        }else{
            this.rootId = this.autoCompleter.getValue().idAdded.split('_')[0];
            this.rootType = this.autoCompleter.getValue().idAdded.split('_')[1];
        }              
        var nodes = objectToArray(json.EWS.o_children.yglui_str_parent_children);
        var xml = "<EWS>" +
						"<SERVICE>" + this.getContentsService + "</SERVICE>" +
						"<PARAM>" +
						    "<APPID>OM_BOX</APPID>" +
						    "<WID_SCREEN>*</WID_SCREEN>" +
						    "<HROBJECTS_LIST>" +
						        "<YGLUI_STR_HROBJECT OTYPE='" + this.rootType + "' OBJID='" + this.rootId + "'/>";
        var objectType, objectId;
        for (var i = 0; i < nodes.length; i++) {
            objectType = nodes[i]['@otype'];
            if (nodes[i]['@otype'] == 'O') {
                objectId = nodes[i]['@objid'];
                xml += "<YGLUI_STR_HROBJECT OTYPE='" + objectType + "' OBJID='" + objectId + "'/>";
            }
        }
        xml += "</HROBJECTS_LIST>" +
               "</PARAM>" +
               "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_saveChart' }));
    },
    /**
    *@description Stores nodes obtained from the backend
    *@param {JSON} json Object from the backend
    */
    _saveChart: function(json) {
        //save the json
        //this.json = deepCopy(json);
        // Creating hash structure
        this.currentChart = new Hash();
        this.currentChart.set('currentNode', null);
        var children = new Array();
        this.currentChart.set('childNodes', children);
        var staff = new Array();
        this.currentChart.set('staffNodes', staff);
        var allnodes = new Hash();
        this.currentChart.set('nodes', allnodes);
        var nodeJson;
        // Saving org. units information
        var nodes = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
        var node, orgunitid, orgunitname, orgunitrootid, totalpositions, filledpositions, indicatorflag, staffflag;
        for (var i = 0; i < nodes.length; i++) {
            //this.auxJson = deepCopy(json);
            //save the info of widget header
            if (nodes[i]['@screen'] == '1') {
                node = new Hash();
                //org unit id
                orgunitid = nodes[i].hrobject['@objid'];
                if (Object.isEmpty(orgunitid)) orgunitid = '';
                node.set('orgunitid', orgunitid);
                //org unit name
                orgunitname = nodes[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field[3]['#text'];
                if (Object.isEmpty(orgunitname)) orgunitname = '';
                node.set('orgunitname', orgunitname);
                //org unit root id
                orgunitrootid = this.rootId;
                if (Object.isEmpty(orgunitrootid)) orgunitrootid = '';
                node.set('orgunitrootid', orgunitrootid);
                //number filled positions/total number positions [ (X/Y) field ]
                totalpositions = 0;
                if (Object.isEmpty(totalpositions)) totalpositions = 0;
                node.set('totalpositions', parseInt(totalpositions));
                filledpositions = 0;
                if (Object.isEmpty(filledpositions)) filledpositions = 0;
                node.set('filledpositions', parseInt(filledpositions));
                //flag 
                indicatorflag = '';
                if (Object.isEmpty(indicatorflag)) indicatorflag = '';
                node.set('indicatorflag', indicatorflag);
                staffflag = false;
                //            if (nodes[i]['@staffflag'] == 'X') staffflag = true;
                //            node.set('staffflag', staffflag);
                //            var haschildnodes = false;
                //            if (nodes[i]['@hasorgunitchild'] == 'X') haschildnodes = true;
                //            node.set('haschildnodes', haschildnodes);
                //save the json with info for the node
                //nodeJson = this.getJsonFieldPanel(orgunitid);
                //node.set('json', nodeJson);
                // Associations
                // Current node (always the first one)
                if (orgunitid == this.rootId) {
                    this.currentChart.set('currentNode', orgunitid);
                    if (Object.isEmpty(this.loggedUserOrgUnit))
                        this.loggedUserOrgUnit = orgunitid;
                    this.lastOrgUnit = orgunitid;
                }
                // Child or staff node
                else {
                    // Child node
                    if (!staffflag)
                        this.currentChart.get('childNodes').push(orgunitid);
                    // Staff node
                    else
                        this.currentChart.get('staffNodes').push(orgunitid);
                }
                // Add node to list
                this.currentChart.get('nodes').set(orgunitid, node);
            } //end if
        } //end for

        // Draw the chart
        this._drawChart();
    },
    /**
    *@description Draws the organizational structure
    */
    _drawChart: function() {
        if (!Object.isEmpty(this.currentChart)) {
            // Showing from the first child
            this.showFrom = 0;
            // Getting nodes
            var currentNode = this._getNode(this.currentChart.get('currentNode'));
            var staffNodes = new Array();
            var staffNodesId = this.currentChart.get('staffNodes');
            for (var i = 0; i < staffNodesId.length; i++) {
                staffNodes.push(this._getNode(staffNodesId[i]));
            }
            var childNodes = new Array();
            var childNodesId = this.currentChart.get('childNodes');
            for (var i = 0; i < childNodesId.length; i++) {
                childNodes.push(this._getNode(childNodesId[i]));
            }
            // HTML code creation
            var html = "<div id='OMdisplay_currentNode' class='OMdisplay_widget'></div>";
            for (var i = 0; i < staffNodesId.length; i++) {
                html += "<div id='OMdisplay_staffNode_" + i + "' class='OMdisplay_widget'></div>";
            }
            var maxChild = childNodesId.length;
            // (Only 3 child nodes)
            if (maxChild > 3)
                maxChild = 3;
            if (maxChild > 0) {
                html += "<div class='OMdisplay_widget_childs'>";
                for (var i = 0; i < maxChild; i++) {
                    html += "<div id='OMdisplay_childNode_" + i + "' class='OMdisplay_widget'></div>";
                }
                html += "</div>";
            }
            this.virtualHtml.down('[id=OMdisplay_chart]').update(html);
            // Widgets creation
            var options_cur = $H({
                title: this._drawNodeTitle(currentNode, 'current'),
                events: $H({ onToggle: 'EWS:OM_Display_widgetToggle' }),
                collapseBut: true,
                contentHTML: this._drawNode(currentNode, 'current', 'OMdisplay_currentNode'),
                targetDiv: 'OMdisplay_currentNode'
            });
            var widget_cur = new unmWidget(options_cur);
            this.currentWidget = widget_cur;
            if (this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_currentNode]')) {
                this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_currentNode]').observe('click', this._getChart.bind(this, currentNode.get('orgunitrootid')));
            }
            var staffDivs = new Array();
            for (var i = 0; i < staffNodesId.length; i++) {
                if (i % 2 == 0)
                    this.virtualHtml.down('[id=OMdisplay_staffNode_' + i + ']').addClassName('OMdisplay_widget_leftStaff');
                else
                    this.virtualHtml.down('[id=OMdisplay_staffNode_' + i + ']').addClassName('OMdisplay_widget_rightStaff');
                var options_sta = $H({
                    title: this._drawNodeTitle(staffNodes[i], 'staff'),
                    events: $H({ onToggle: 'EWS:OM_Display_widgetToggle' }),
                    collapseBut: true,
                    contentHTML: this._drawNode(staffNodes[i], 'staff', 'OMdisplay_staffNode_' + i),
                    targetDiv: 'OMdisplay_staffNode_' + i
                });
                var widget_sta = new unmWidget(options_sta);
                if (this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_staffNode_' + i + ']')) {
                    this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_staffNode_' + i + ']').observe('click', this._getChart.bind(this, staffNodes[i].get('orgunitid')));
                }
                staffDivs.push('OMdisplay_staffNode_' + i);
            }
            this.childWidgets = new Array();
            var childDivs = new Array();
            for (var i = 0; i < maxChild; i++) {
                if (childNodesId.length == 2) {
                    if (i == 0)
                        this.virtualHtml.down('[id=OMdisplay_childNode_' + i + ']').addClassName('OMdisplay_widget_twoChildren_firstChild');
                    else
                        this.virtualHtml.down('[id=OMdisplay_childNode_' + i + ']').addClassName('OMdisplay_widget_twoChildren_secondChild');
                }
                else {
                    if (childNodesId.length > 2) {
                        if (i == 0)
                            this.virtualHtml.down('[id=OMdisplay_childNode_' + i + ']').addClassName('OMdisplay_widget_threeChildren_firstChild');
                        else {
                            if (i == 1)
                                this.virtualHtml.down('[id=OMdisplay_childNode_' + i + ']').addClassName('OMdisplay_widget_threeChildren_secondChild');
                            else
                                this.virtualHtml.down('[id=OMdisplay_childNode_' + i + ']').addClassName('OMdisplay_widget_threeChildren_thirdChild');
                        }
                    }
                    else
                        this.virtualHtml.down('[id=OMdisplay_childNode_' + i + ']').addClassName('OMdisplay_widget_oneChild');
                }
                // 1 = left brothers, 2 = right brothers
                var brother = -1;
                if ((i == (maxChild - 1)) && (childNodesId.length > 3))
                    brother = 2;
                var title_chi = "";
                if (brother < 0)
                    title_chi = this._drawNodeTitle(childNodes[i], 'child');
                else
                    title_chi = this._drawNodeTitle(childNodes[i], 'child', 'OMdisplay_childNode_' + i, brother);
                var options_chi = $H({
                    title: title_chi,
                    events: $H({ onToggle: 'EWS:OM_Display_widgetToggle' }),
                    collapseBut: true,
                    contentHTML: this._drawNode(childNodes[i], 'child', 'OMdisplay_childNode_' + i),
                    targetDiv: 'OMdisplay_childNode_' + i
                });
                var widget_chi = new unmWidget(options_chi);
                if (this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_childNode_' + i + ']')) {
                    this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_childNode_' + i + ']').observe('click', this._getChart.bind(this, childNodes[i].get('orgunitid')));
                }
                if (this.virtualHtml.down('[id=OMdisplay_leftArrow_OMdisplay_childNode_' + i + ']')) {
                    this.virtualHtml.down('[id=OMdisplay_leftArrow_OMdisplay_childNode_' + i + ']').observe('click', this._redrawChildren.bind(this, this.showFrom - 2));
                }
                if (this.virtualHtml.down('[id=OMdisplay_rightArrow_OMdisplay_childNode_' + i + ']')) {
                    this.virtualHtml.down('[id=OMdisplay_rightArrow_OMdisplay_childNode_' + i + ']').observe('click', this._redrawChildren.bind(this, this.showFrom + 2));
                }
                this.childWidgets.push(widget_chi);
                childDivs.push('OMdisplay_childNode_' + i);
            }
            // Drawing the tree
            var divHash = new Hash();
            divHash.set('OMdisplay_currentNode', {
                parent: 'OMdisplay_currentNode',
                staff: staffDivs,
                sons: childDivs
            });
            this.tree = new drawTree(divHash, 'OMdisplay_chart');
            this.autoCompleter.clearInput();
        }
    },
    /**
    *@description Asks the current chart for an organizational unit
    *@param {String} orgunitid Org. unit id
    *@returns {Hash} node
    */
    _getNode: function(orgunitid) {
        var node = this.currentChart.get('nodes').get(orgunitid);
        if (Object.isEmpty(node))
            node = null;
        return node;
    },
    /**
    *@description Returns the HTML code from a node's title for drawing it
    *@param {Hash} node Node whose title we want to draw
    *@param {String} type Node type ('current', 'staff' or 'child')
    *@param {String} targetDiv Node's target div (widget)
    *@param {Number} brothers Says if a child has left/right brothers (1 = left, 2 = right)
    *@returns {String} html
    */
    _drawNodeTitle: function(node, type, targetDiv, brothers) {
        var html = "";
        // Icon
        if (type == 'staff')
            html += "<div class='applicationOM_staff OMdisplay_widget_title_icon'></div>";
        else
            html += "<div class='applicationOM_folder OMdisplay_widget_title_icon'></div>";
        // Text
        html += "<div class='OMdisplay_widget_title_positions'><div class='OMdisplay_widget_title_positions_span' title=\"" + node.get('orgunitname').strip() + "\">&nbsp;" +
                    "(" + node.get('filledpositions') + "/" + node.get('totalpositions') + ")&nbsp;" +
                    node.get('orgunitname').strip().truncate(18) + "</div></div>";
        html += "<div class='OM_flag_common OM_flag_" + node.get('indicatorflag') + "'>" +
                        "<div class='OMdisplay_flag_topLeft'></div>" +
                        "<div class='OMdisplay_flag_topRight'></div>" +
                        "<div class='OMdisplay_flag_bottomLeft'></div>" +
                        "<div class='OMdisplay_flag_bottomRight'></div>" +
                    "</div>";
        // Arrows
        // (We need them here because if we minimize widgets they don't have to dissapear) 
        if (brothers) {
            if (brothers == 1) {
                html += "<div id='OMdisplay_leftArrow_" + targetDiv + "' class='application_verticalL_arrow OMdisplay_widget_title_arrowL_imageNormal'></div>";
            }
            if (brothers == 2) {
                html += "<div id='OMdisplay_rightArrow_" + targetDiv + "' class='application_verticalR_arrow OMdisplay_widget_title_arrowR_imageNormal'></div>";
            }
        }
        return html;
    },
    /**
    *@description Returns the HTML code from a node for drawing it
    *@param {Hash} node Node we want to draw
    *@param {String} type Node type ('current', 'staff' or 'child')
    *@param {String} targetDiv Node's target div (widget)
    *@returns {String} html
    */
    _drawNode: function(node, type, targetDiv) {
        var html = "";

        // Needed information
        var costcentername = node.get('costcentername');
        if (Object.isEmpty(costcentername))
            costcentername = '';
        // Initial info
        html += "<div class='OMdisplay_widget_blankLine'>&nbsp;</div>" +
                    "<div class='OMdisplay_widget_initialInfo'>" +
                        "<table><tr><td class='OMdisplay_widget_initialInfo_value'>";

        if (type == 'current') {
            if ((node.get('orgunitid') != node.get('orgunitrootid')) && (node.get('orgunitrootid') != '00000000') && (node.get('orgunitid') != this.loggedUserOrgUnit))
                html += "<div id='OMdisplay_arrow_" + targetDiv + "' class='application_up_arrow OMdisplay_widget_initialInfo_arrowU_image'></div>";
        }
        else {
            if (node.get('haschildnodes'))
                html += "<div id='OMdisplay_arrow_" + targetDiv + "' class='application_down_arrow OMdisplay_widget_initialInfo_arrowD_image'></div>";
        }
        html += "</td></tr></table></div>";

        return html;
    },
    /**
    *@description Redraws the child nodes shown
    *@param {Number} showFrom Show from this children
    */
    _redrawChildren: function(showFrom) {
        // Expanding all minimized nodes
        for (var i = 0; i < this.childWidgets.length; i++) {
            this.childWidgets[i]._expand();
        }
        // Obtaining child nodes
        var childNodes = new Array();
        var childNodesId = this.currentChart.get('childNodes');
        for (var i = 0; i < childNodesId.length; i++) {
            childNodes.push(this._getNode(childNodesId[i]));
        }
        // Setting the initial child node
        if (showFrom == (childNodesId.length - 2))
            showFrom--;
        if (showFrom < 0)
            showFrom = 0;
        this.showFrom = showFrom;
        // Refreshing chart
        for (var i = 0; i < this.childWidgets.length; i++) {
            var j = this.showFrom + i;
            this.childWidgets[i].refreshContent(this._drawNode(childNodes[j], 'child', 'OMdisplay_childNode_' + i));
            // 1 = left brothers, 2 = right brothers
            var brother = -1;
            if ((i == 0) && (this.showFrom > 0))
                brother = 1;
            if ((i == (this.childWidgets.length - 1)) && (j < (childNodesId.length - 1)))
                brother = 2;
            var title_chi = "";
            if (brother < 0)
                title_chi = title_chi = this._drawNodeTitle(childNodes[j], 'child');
            else
                title_chi = title_chi = this._drawNodeTitle(childNodes[j], 'child', 'OMdisplay_childNode_' + i, brother);
            this.childWidgets[i].refreshTitle(title_chi);
            if (this.virtualHtml.down('div#OMdisplay_arrow_OMdisplay_childNode_' + i)) {
                this.virtualHtml.down('div#OMdisplay_arrow_OMdisplay_childNode_' + i).stopObserving();
                this.virtualHtml.down('div#OMdisplay_arrow_OMdisplay_childNode_' + i).observe('click', this._getChart.bind(this, childNodes[j].get('orgunitid')));
            }
            if (this.virtualHtml.down('span#OMdisplay_team_OMdisplay_childNode_' + i))
                this.virtualHtml.down('span#OMdisplay_team_OMdisplay_childNode_' + i).stopObserving();
            if (this.virtualHtml.down('span#OMdisplay_manager_OMdisplay_childNode_' + i))
                this.virtualHtml.down('span#OMdisplay_manager_OMdisplay_childNode_' + i).stopObserving();
            if (this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + i)) {
                this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + i).stopObserving();
                this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + i).observe('click', this._redrawChildren.bind(this, this.showFrom - 2));
            }
            if (this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + i)) {
                this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + i).stopObserving();
                this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + i).observe('click', this._redrawChildren.bind(this, this.showFrom + 2));
            }
        }
    },
    /**
    *@description Refreshes the tree lines
    *@param {Event} event Click event
    */
    _listenToggle: function(event) {
        var targetDiv = getArgs(event).get('targetDiv');
        // Moving lateral arrows in child nodes (if needed)
        if (targetDiv.include('OMdisplay_childNode_')) {
            var pos = parseInt(targetDiv.substring(targetDiv.lastIndexOf("_") + 1, targetDiv.length));
            if (this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + pos)) {
                if (this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + pos).hasClassName('OMdisplay_widget_title_arrowL_imageNormal')) {
                    this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + pos).removeClassName('OMdisplay_widget_title_arrowL_imageNormal');
                    this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + pos).addClassName('OMdisplay_widget_title_arrowL_imageMin');
                }
                else {
                    this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + pos).removeClassName('OMdisplay_widget_title_arrowL_imageMin');
                    this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + pos).addClassName('OMdisplay_widget_title_arrowL_imageNormal');
                }
            }
            if (this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + pos)) {
                if (this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + pos).hasClassName('OMdisplay_widget_title_arrowR_imageNormal')) {
                    this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + pos).removeClassName('OMdisplay_widget_title_arrowR_imageNormal');
                    this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + pos).addClassName('OMdisplay_widget_title_arrowR_imageMin');
                }
                else {
                    this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + pos).removeClassName('OMdisplay_widget_title_arrowR_imageMin');
                    this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + pos).addClassName('OMdisplay_widget_title_arrowR_imageNormal');
                }
            }
        }
        // Refreshing tree
        this.tree.refresh();
    },
    /**     
    *@param data {JSON} node context
    *@description It sets the node context on the treeHandler, after receiving it as the respond
    *to the get node parent (context) information service.
    */
    navigateTo: function(data) {
        this.virtualHtml.down('div#OMdisplay_chart').update('');
        this.data = this.handleData(data);
        this._getContents(data);       
    },
    /**
    *@description Method to prepare the info to show it using fieldPanel
    */
    getJsonFieldPanel: function(nodeId) {
        if (!Object.isEmpty(this.auxJson)) {
            //get all records for an object
            var details = objectToArray(this.auxJson.EWS.o_field_values.yglui_str_wid_record);
            var record;
            var length = details.length;
            for (var i = 0; i < length; i++) {
                //get records
                record = details[i];
                if (details[i].hrobject['@objid'] == nodeId) {
                    //remove unnnecesary values
                    if (this.auxJson.EWS.o_field_values.yglui_str_wid_record[i].hrobject)
                        delete this.auxJson.EWS.o_field_values.yglui_str_wid_record[i].hrobject;
                } else {
                    //delete this.auxJson.EWS.o_field_values.yglui_str_wid_record[i];
                    this.auxJson.EWS.o_field_values.yglui_str_wid_record.splice(i, 1);
                    i--;
                    length--;
                }
            }
            return this.auxJson;
        } else {
            return null
        }
    },
    /**
    *@description Stops maintainNew_standard
    */
    close: function($super) {
        $super();
        document.stopObserving('EWS:OM_Display_widgetToggle', this._listenToggleBinding);
    }
});


var displayNew = Class.create(displayNew_standard, {
    initialize: function($super) {
        $super({
            containerParent: 'OM_MGMT',
            containerChild: 'MGMT_OS',
            applicationId: 'displayNew'
        });
    },
    run: function($super, args) {
        $super(args);
    },
    close: function($super) {
        $super();
    }
});