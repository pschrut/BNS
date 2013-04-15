/** 
* @fileOverview WhoIsWhoChart.js 
* @description File containing class WhoIsWhoChart. 
* Application for Who is Who chart.
*/
/**
*@constructor
*@description Class WhoIsWhoChart
*@augments Application 
*/
var WhoIsWhoChart = Class.create(Application,
/** 
*@lends WhoIsWhoChart
*/
    {

    /*** SERVICES ***/
    /**
    *@type String
    *@description Get all info service
    */
    getContentsService: 'GET_WIW_CHART',
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
    hashOfButtons: $H(),
    linksLoaded: false,
    noPicture: 'user.jpg',
    getPictureFromSap: false,
    getPictureService: 'DM_GET_THUMB',
    key: '',
    /**
    *Constructor of the class WhoIsWhoChart
    */
    initialize: function($super, args) {
        $super(args);
        //tree
        this._listenToggleBinding = this._listenToggle.bindAsEventListener(this);
        this._listenChangesLinksBinding = this._redrawingLines.bindAsEventListener(this);
        //autocompleter events
        this.nodeSearchBinding = this.nodeSearch.bindAsEventListener(this);
        this.nodeSelectedBinding = this.nodeSelected.bindAsEventListener(this);
        this.employeeSelectedAdvSearchBinding = this.reloadChart.bindAsEventListener(this);
    },

    /**
    *@description Starts WhoIsWhoChart
    */
    run: function($super, args) {
        $super(args);
        //get args
        this.applicationId = args.get('app').appId;
        if (this.firstRun) {
            this.getInitialData();
        }
        document.observe('EWS:OM_Display_widgetToggle', this._listenToggleBinding);
        document.observe('EWS:screensNavigationLinksClicked', this._listenChangesLinksBinding);
        document.observe('EWS:simpleTableLinkClicked', this._listenChangesLinksBinding);
        //autocompleter events
        document.observe(this.applicationId + ':nodeSearch', this.nodeSearchBinding);
        document.observe(this.applicationId + ':nodeSelected', this.nodeSelectedBinding);
        document.observe('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
    },
    /**     
    *@description Calls sap to get data
    */
    getInitialData: function() {
        //call to sap 
        var xml = "<EWS>" +
                        "<SERVICE>" + this.getContentsService + "</SERVICE>" +
                        "<PARAM>" +
                            "<APPID>" + this.applicationId + "</APPID>" +
                            "<WID_SCREEN>*</WID_SCREEN>" +
                        "</PARAM>" +
                   "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'setHTML' }));
    },
    /**     
    *@description It sets the HTML structure 
    */
    setHTML: function(data) {
        this.json = data;
        //create html structure 
        this.virtualHtml.insert(
                "<div id='OMdisplay_content'>" +
   					    "<div id='" + this.applicationId + "_autocompleterDiv' class='whoiswhochart_autocompleterDiv'></div>" +
                        "<div class='whoiswhochart_backTop'>" +
				            "<span id='" + this.applicationId + "_backTop' class='application_action_link'>" + global.getLabel("backtoroot") + "</span>" +
				        "</div>" +
				        "<div id='OMdisplay_chart'></div>" +
			     "</div>"
	    );
        //hide 'Back to top' link
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
        //event 'back to top' link
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').observe('click', function() {
            this.backTop();
        } .bind(this));
        //draw autocompleter
        this.setAutoCompleterDiv();
        //Advanced Search
        this.advancedSearchDiv = new Element('div', { id: this.applicationId + '_advancedSearch', className: 'whoiswho_searchDiv' });
        //PROVISIONAL SOLUTION: links in tree
        this.virtualHtml.down('div#' + this.applicationId + "_autocompleterDiv").insert(this.advancedSearchDiv);
        var advancedSearchButton = new Element("div", { "class": "application_handCursor" }).insert(new Element("div", {
            "class": "application_catalog_image application_catalog_image_AS"
        }).insert("&nbsp")).insert(new Element("div", {
            "class": "as_button"
        }).insert(global.getLabel('SRC_OV'))).observe("click", this.getAdvSearchlinks.bind(this));
        var advancedSearchLinks = new Element("div", { "id": "advSearchLinks", "class": "whoiswho_advsSearchLinks" });
        this.advancedSearchDiv.insert(advancedSearchButton);
        this.advancedSearchDiv.insert(advancedSearchLinks);
        this.virtualHtml.down('div#advSearchLinks').hide();
        //store data obtained from sap
        this._saveChart(data);
    },
    /**     
    *@description Calls sap to get initial data
    */
    backTop: function() {
        //call to sap 
        var xml = "<EWS>" +
                            "<SERVICE>" + this.getContentsService + "</SERVICE>" +
                            "<PARAM>" +
                                "<APPID>" + this.applicationId + "</APPID>" +
                                "<WID_SCREEN>*</WID_SCREEN>" +
                            "</PARAM>" +
                       "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_saveChart' }));
        //hide 'Back to Top' link
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
    },
    /**     
    *@description Checking if the object is root
    */
    isRoot: function(id) {
        var size = this.roots.size();
        var isRoot = false;
        var i = 0;
        while (i < size && !isRoot) {
            if (id == this.roots.keys()[i]) {
                isRoot = true;
            }
            i++
        }
        return isRoot
    },
    /**     
    *@description Ordering array of roots taking into account first element to show as a root
    */
    orderRoots: function() {
        var pos = this.rootsArray[0];
        var aux;
        if (this.rootsChart.get(pos).get('keyStr') != this.key) {
            var size = this.rootsArray.size();
            for (var i = 1; i < size; i++) {
                pos = this.rootsArray[i];
                if (this.rootsChart.get(pos).get('keyStr') == this.key) {
                    aux = this.rootsArray[i];
                    this.rootsArray[i] = this.rootsArray[0];
                    this.rootsArray[0] = aux;
                }
            }
        }
    },
    /**
    *@description Stores nodes obtained from the backend
    *@param {JSON} json Object from the backend
    */
    _saveChart: function(json) {
        //get root info
        this.rootId = json.EWS.o_root['@objid'];
        //get parameter to know if pictures will be read from sap (X->get from sap)
        if (json.EWS.o_get_picture)
            this.getPictureFromSap = true;
        //save the json for each object
        this.jsonForObject(json);
        //creating hash structure
        this.currentChart = new Hash();
        this.currentChart.set('currentNode', null);
        this.currentChart.set('recIndex', null);
        this.currentChart.set('keyStr', null);
        var children = new Array();
        this.currentChart.set('childNodes', children);
        var allnodes = new Hash();
        this.currentChart.set('nodes', allnodes);
        this.titleWidget = new Hash();
        this.employeeIdList = new Hash();
        //saving roots
        this.rootsChart = new Hash();
        this.rootsArray = new Array();
        this.rootsArrayIndex = 0;
        this.rootIndex = 0;
        this.roots = new Hash();
        if (json.EWS.o_roots) {
            var roots = objectToArray(json.EWS.o_roots.yglui_str_hrobject);
            var numberOfRoots = roots.length;
            if (numberOfRoots > 0) {
                for (var i = 0; i < numberOfRoots; i++) {
                    this.roots.set(roots[i]['@objid'], true);
                }
            }
        } else {
            this.roots.set(json.EWS.o_root['@objid'], true);
        }
        //saving positions information
        var nodes = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
        var numberOfNodes = nodes.length;
        var box, node, orgunitid, recIndex, keyStr, orgunitname, idEmployee, orgunitrootid, headcount, indicatorflag, haschildnodes, parentId, pictureEmployee, hasParent;
        this.employeeData = false;
        for (var i = 0; i < numberOfNodes; i++) {
            //save the info of widget header
            if (nodes[i]['@screen'] == '1') {
                node = new Hash();
                //org unit id
                orgunitid = nodes[i].hrobject['@objid'];
                if (Object.isEmpty(orgunitid)) orgunitid = '';
                node.set('orgunitid', orgunitid);
                //recIndex
                recIndex = nodes[i].contents.yglui_str_wid_content['@rec_index'];
                node.set('recIndex', recIndex);
                //key_str
                keyStr = nodes[i].contents.yglui_str_wid_content['@key_str'];
                node.set('key_str', keyStr);
                //org unit root id
                orgunitrootid = this.rootId;
                if (Object.isEmpty(orgunitrootid)) orgunitrootid = '';
                node.set('orgunitrootid', orgunitrootid);
                //save info of roots
                if (this.isRoot(orgunitid)) {
                    this.rootsArray[this.rootsArrayIndex] = orgunitid + '_' + recIndex;
                    this.rootsArrayIndex++;
                    this.rootsChart.set(orgunitid + '_' + recIndex, new Hash());
                    this.rootsChart.get(orgunitid + '_' + recIndex).set('currentNode', null);
                    this.rootsChart.get(orgunitid + '_' + recIndex).set('recIndex', null);
                    this.rootsChart.get(orgunitid + '_' + recIndex).set('keyStr', keyStr);
                    this.rootsChart.get(orgunitid + '_' + recIndex).set('childNodes', children);
                    this.rootsChart.get(orgunitid + '_' + recIndex).set('nodes', allnodes);
                }
                //fields
                box = objectToArray(nodes[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                for (var j = 0; j < box.length; j++) {
                    if (box[j]['@fieldid'] == 'NAME') {
                        //employee name
                        orgunitname = box[j]['#text'];
                        if (Object.isEmpty(orgunitname)) orgunitname = '';
                        node.set('orgunitname', orgunitname);
                        this.titleWidget.set(orgunitid + '_' + recIndex, orgunitname);
                        //employee id
                        idEmployee = box[j]['@value'];
                        if (Object.isEmpty(idEmployee)) idEmployee = '';
                        node.set('idEmployee', idEmployee);
                        this.employeeData = true;
                    } else if (box[j]['@fieldid'] == 'PICTURE') {
                        pictureEmployee = box[j]['@value'];
                        if (Object.isEmpty(pictureEmployee)) pictureEmployee = this.noPicture;
                        node.set('pictureEmployee', pictureEmployee);
                    } else if (box[j]['@fieldid'] == 'INDICATOR') {
                        //flag
                        indicatorflag = box[j]['@value'];
                        if (Object.isEmpty(indicatorflag)) indicatorflag = '';
                        node.set('indicatorflag', indicatorflag);
                    } else if (box[j]['@fieldid'] == 'ARROWDOWN') {
                        haschildnodes = box[j]['@value'];
                        if (haschildnodes == 'X') {
                            haschildnodes = true;
                            node.set('keyChild', box[j]['#text']);
                        } else {
                            haschildnodes = false;
                        }
                        node.set('haschildnodes', haschildnodes);
                    } else if (box[j]['@fieldid'] == 'ARROWUP') {
                        hasParent = box[j]['@value'];
                        parentId = box[j]['#text'];
                        if (hasParent == 'X') { hasParent = true; } else { hasParent = false; };
                        node.set('hasParent', hasParent);
                        node.set('parentId', parentId);
                    }
                    if (this.employeeData) {
                        this.employeeIdList.set(idEmployee, pictureEmployee);
                        this.employeeData = false;
                    }
                }
                // Associations
                // Current node (always the first one)
                if (this.isRoot(orgunitid)) {
                    if (orgunitid == this.rootId && recIndex == '1') {
                        this.currentChart.set('currentNode', orgunitid);
                        this.currentChart.set('recIndex', recIndex);
                        if (Object.isEmpty(this.loggedUserOrgUnit))
                            this.loggedUserOrgUnit = orgunitid;
                        this.lastOrgUnit = orgunitid;
                    }
                    this.rootsChart.get(orgunitid + '_' + recIndex).set('currentNode', orgunitid);
                    this.rootsChart.get(orgunitid + '_' + recIndex).set('recIndex', recIndex);
                }
                // Child node
                else {
                    this.currentChart.get('childNodes').push(orgunitid + '_' + recIndex);
                }
                // Add node to list
                this.currentChart.get('nodes').set(orgunitid + '_' + recIndex, node);
                if (this.isRoot(orgunitid))
                    this.rootsChart.get(orgunitid + '_' + recIndex).get('nodes').set(orgunitid + '_' + recIndex, node);
            } //end if
        } //end for
        //order array of roots taking into account the key
        if (this.fromAdvSearch || this.key != '') {
            this.orderRoots();
            if (this.fromAdvSearch)
                this.fromAdvSearch = false;
        }
        // Draw the chart
        this._drawChart();
    },
    /**
    *@description Builds the hash of json for each chart box
    */
    jsonForObject: function(json) {
        var settingsHash = new Hash();
        var settingsScreensHash = new Hash();
        var valuesHash = new Hash();
        var valuesScreensHash = new Hash();
        this.hashOfJson = new Hash();
        this.hashOfHtml = new Hash();
        //get the field_values for each object
        var idObject, recindexObject;
        var values = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
        var numberOfValues = values.length;
        var j = 0;
        for (var i = 0; i < numberOfValues; i++) {
            idObject = values[i].hrobject["@objid"];
            recindexObject = values[i].contents.yglui_str_wid_content['@rec_index'];
            valuesScreensHash = new Hash();
            valuesScreensHash.set(j, values[i]);
            j++;
            valuesHash.set(idObject + '_' + recindexObject, valuesScreensHash);
        }
        //get the field_setting for each object
        var settings = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record);
        var numberOfSettings = settings.length;
        j = 0;
        for (var i = 0; i < numberOfSettings; i++) {
            idObject = settings[i].hrobject["@objid"];
            settingsScreensHash = new Hash();
            settingsScreensHash.set(j, settings[i]);
            settingsHash.set(idObject, settingsScreensHash);
            j++;
        }
        //build the json for each object
        var jsonObject, objectType, object, recIndexObject;
        //build json for the all of objects
        for (var i = 0; i < values.length; i++) {
            object = values[i].hrobject['@objid'];
            recIndexObject = values[i].contents.yglui_str_wid_content['@rec_index'];
            if (settingsHash.get(object) && valuesHash.get(object + '_' + recIndexObject)) {
                jsonObject = { o_field_settings: { yglui_str_wid_fs_record: settingsHash.get(object).values() },
                    o_field_values: { yglui_str_wid_record: valuesHash.get(object + '_' + recIndexObject).values() },
                    o_widget_screens: { yglui_str_wid_screen: json.EWS.o_widget_screens.yglui_str_wid_screen },
                    o_screen_buttons: json.EWS.o_screen_buttons,
                    o_widget_screens: json.EWS.o_widget_screens,
                    labels: json.EWS.labels
                };
            } else {
                jsonObject = "";
            }
            jsonObject = { EWS: jsonObject };
            this.hashOfJson.set(object + '_' + recIndexObject, jsonObject);
        };
    },
    /**
    *@description Draws the structure
    */
    _drawChart: function() {
        if (!Object.isEmpty(this.currentChart)) {
            // Showing from the first child
            this.showFrom = 0;
            // Getting nodes
            //var currentNode = this._getNode(this.currentChart.get('currentNode'), this.currentChart.get('recIndex'));
            var currentNode = this._getNode(this.rootsChart.get(this.rootsArray[this.rootIndex]).get('currentNode'), this.rootsChart.get(this.rootsArray[this.rootIndex]).get('recIndex'));
            var childNodes = new Array();
            //var childNodesId = this.currentChart.get('childNodes');
            var childNodesId = this.rootsChart.get(this.rootsArray[this.rootIndex]).get('childNodes');
            var id, recIn;
            for (var i = 0; i < childNodesId.length; i++) {
                id = childNodesId[i].split('_')[0];
                recIn = childNodesId[i].split('_')[1];
                childNodes.push(this._getNode(id, recIn));
            }
            // HTML code creation
            var html = "<div id='OMdisplay_currentNode' class='OMdisplay_widget'></div>";
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
            //show/hide "back to root"link           
            if (this.loggedUserOrgUnit == this.currentChart.get('currentNode')) {
                this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
            } else {
                this.virtualHtml.down('span#' + this.applicationId + '_backTop').show();
            }
            // Widgets creation
            //root of tree
            // 1 = left brothers, 2 = right brothers, 3= both brothers
            var title_root = "";
            if (this.rootsArray.size() > 1) {
                var brotherRoot = -1;
                if (this.rootIndex == 0) {
                    brotherRoot = 2;
                } else if (this.rootIndex == this.rootsArray.size()) {
                    brotherRoot = 1;
                } else if (this.rootIndex > 0 && this.rootIndex < this.rootsArray.size()) {
                    brotherRoot = 3;
                }
                title_root = this._drawNodeTitle(currentNode, 'current', 'OMdisplay_rootNode', '', brotherRoot);
            } else {
                title_root = this._drawNodeTitle(currentNode, 'current');
            }
            var options_cur = $H({
                //title: this._drawNodeTitle(currentNode, 'current'),
                title: title_root,
                events: $H({ onToggle: 'EWS:OM_Display_widgetToggle' }),
                collapseBut: true,
                contentHTML: this._drawNode(currentNode, 'current', 'OMdisplay_currentNode'),
                targetDiv: 'OMdisplay_currentNode'
            });
            var widget_cur = new unmWidget(options_cur);
            //insert the html structure in the chart-box
            this.virtualHtml.down('[id=currentNode]').insert(this.hashOfHtml.get(this.rootsArray[this.rootIndex]));
            //get picture from sap and add it in chart.
            this.getPicture(currentNode.get('pictureEmployee'), '');
            this.currentWidget = widget_cur;
            //create events after clicking arrow up or down
            if (this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_currentNode]')) {
                if ((this.virtualHtml.select('.application_up_arrow')[0])) {
                    this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_currentNode]').observe('click', this._getChart.bind(this, currentNode.get('parentId'), 'up'));
                } else {
                    this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_currentNode]').observe('click', this._getChart.bind(this, currentNode.get('orgunitrootid'), 'down'));
                }
            }
            //create events after clicking arrow left or right
            if (this.virtualHtml.down('[id=OMdisplay_leftArrow_OMdisplay_rootNode]')) {
                this.virtualHtml.down('[id=OMdisplay_leftArrow_OMdisplay_rootNode]').observe('click', this._redrawRoot.bind(this, this.rootIndex - 1));
            }
            if (this.virtualHtml.down('[id=OMdisplay_rightArrow_OMdisplay_rootNode]')) {
                this.virtualHtml.down('[id=OMdisplay_rightArrow_OMdisplay_rootNode]').observe('click', this._redrawRoot.bind(this, this.rootIndex + 1));
            }
            //children of tree
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
                //insert the html structure in the chart-box
                this.virtualHtml.down('[id=OMdisplay_manager_OMdisplay_childNode_' + i + ']').insert(this.hashOfHtml.get(childNodes[i].get('orgunitid') + '_' + childNodes[i].get('recIndex')));
                //get picture from sap and add it in chart.
                this.getPicture(childNodes[i].get('pictureEmployee'), 'OMdisplay_childNode_' + i);
                //create events after clicking arrow up or down
                if (this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_childNode_' + i + ']')) {
                    this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_childNode_' + i + ']').observe('click', this._getChart.bind(this, childNodes[i].get('orgunitid'), '', childNodes[i].get('key_str')));
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
                staff: '',
                sons: childDivs
            });
            this.tree = new drawTree(divHash, 'OMdisplay_chart');
            //clean autocompleter 
            this.autoCompleter.clearInput();
        }
    },
    /**
    *@description Asks the current chart for an organizational unit
    *@param {String} orgunitid Org. unit id
    *@returns {Hash} node
    */
    _getNode: function(orgunitid, recIndex) {
        //var node = this.currentChart.get('nodes').get(orgunitid + '_' + recIndex);
        var node = this.rootsChart.get(this.rootsArray[this.rootIndex]).get('nodes').get(orgunitid + '_' + recIndex);
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
    _drawNodeTitle: function(node, type, targetDiv, brothers, brothersRoot) {
        var html = "";
        // get title
        var title = this.titleWidget.get(node.get('orgunitid') + '_' + node.get('recIndex'));
        // Icon
        //html += "<div class='applicationOM_person OMdisplay_widget_title_icon'></div>";
        // Text
        //        html += "<div class='OMdisplay_widget_title_positions'><div class='OMdisplay_widget_title_positions_span' title=\"" + node.get('orgunitname').strip() + "\">&nbsp;" +
        //                     node.get('orgunitname').strip().truncate(18) + "</div></div>";
        html += "<div class='OMdisplay_widget_title_positions'><div class='OMdisplay_widget_title_positions_span' title=\"" + title.strip() + "\">&nbsp;" +
                     title.strip().truncate(18) + "</div></div>";
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
        if (brothersRoot) {
            if (brothersRoot == 1) {
                html += "<div id='OMdisplay_leftArrow_" + targetDiv + "' class='application_verticalL_arrow OMdisplay_widget_title_arrowL_imageNormal'></div>";
            }
            if (brothersRoot == 2) {
                html += "<div id='OMdisplay_rightArrow_" + targetDiv + "' class='application_verticalR_arrow OMdisplay_widget_title_arrowR_imageNormal'></div>";
            }
            if (brothersRoot == 3) {
                html += "<div id='OMdisplay_leftArrow_" + targetDiv + "' class='application_verticalL_arrow OMdisplay_widget_title_arrowL_imageNormal'></div>";
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
        var idObj = node.get("orgunitid");
        var idRecIndex = node.get("recIndex");
        var idEmployee = node.get("idEmployee");
        var costcentername = node.get('costcentername');
        if (Object.isEmpty(costcentername))
            costcentername = '';
        // Initial info
        html += "<div class='OMdisplay_widget_blankLine'>&nbsp;</div>";
        //using getContentModule to create html structure of a chart-box
        if (this.hashOfJson.get(idObj + '_' + idRecIndex)) {
            //json for the object(chart)
            var jsonObj = this.hashOfJson.get(idObj + '_' + idRecIndex);
            //getting buttons info to handle positions and persons links.
            this.buttons = new Hash();
            if (jsonObj.EWS.o_screen_buttons) {
                var action, appId, view;
                buttons = objectToArray(jsonObj.EWS.o_screen_buttons.yglui_str_wid_button);
                var objectId;
                for (var i = 0; i < buttons.length; i++) {
                    objectId = buttons[i]['@action'].split('_')[3];
                    this.buttons.set(objectId, new Hash());
                    this.buttons.get(objectId).set('appId', buttons[i]['@tarap']);
                    //info for button event
                    action = buttons[i]['@action'];
                    appId = buttons[i]['@tarap'];
                    view = buttons[i]['@views'];
                }
                //buttons event
                document.stopObserving('EWS:WiWChart_buttons_' + this.applicationId + '_' + idEmployee);
                document.observe('EWS:WiWChart_buttons_' + this.applicationId + '_' + idEmployee, this._actionButtonPressed.bind(this, idEmployee, action, appId, view));
            }
            //build content (new FP)
            var aux = new getContentModule({
                appId: this.applicationId,
                mode: 'edit',
                json: jsonObj,
                showCancelButton: false,
                showButtons: $H({
                    edit: true,
                    display: true,
                    create: true
                }),
                buttonsHandlers: $H({
                    DEFAULT_EVENT_THROW: 'EWS:WiWChart_buttons_' + this.applicationId + '_' + idEmployee
                }),
                hideButtonsOnEdit: false,
                hideButtonsOnCreate: false
            });
            //save the html in the hash
            this.hashOfHtml.set(idObj + '_' + idRecIndex, aux.getHtml());
            //if (idObj != this.rootId) {
            if (!this.isRoot(idObj)) {
                html += "<div id ='picture_" + targetDiv + "' class='whoiswhochart_pictureDiv'></div>" +
                        "<div id ='OMdisplay_manager_" + targetDiv + "' class='whoiswhochart_infoDiv OMdisplay_widget_initialInfo_value'></div>";
            } else {
                html += "<div id ='picture_' class='whoiswhochart_pictureDiv'></div>" +
                        "<div id ='currentNode' class='whoiswhochart_infoDiv OMdisplay_widget_initialInfo_value'></div>";
            }
        }
        if (type == 'current') {
            //if ((node.get('orgunitid') != node.get('orgunitrootid')) && (node.get('orgunitrootid') != '00000000') && (node.get('orgunitid') != this.loggedUserOrgUnit))
            //if ((node.get('orgunitid') != this.loggedUserOrgUnit) && (node.get('orgunitrootid') != '00000000'))
            if (node.get('hasParent'))
                html += "<div id='OMdisplay_arrow_" + targetDiv + "' class='application_up_arrow OMdisplay_widget_initialInfo_arrowU_image OMdisplay_application_up_arrow'></div>";
        } else {
            if (node.get('haschildnodes')) {
                html += "<div id='OMdisplay_arrow_" + targetDiv + "' class='application_down_arrow OMdisplay_widget_initialInfo_arrowD_image OMdisplay_application_down_arrow'></div>";
            }
        }
        html += "<div class='OMdisplay_widget_blankLine'>&nbsp;</div>";
        return html;
    },
    /**
    *@description Gets picture for that id
    */
    getPicture: function(id, target) {
        this.loaded = false;
        this.id = id;
        this.img = document.createElement('img');
        this.img.id = 'img' + id;
        this.virtualHtml.down('[id=picture_' + target + ']').insert(this.img);
        if (this.getPictureFromSap && id != this.noPicture) {
            var xmlin = ""
                + "<EWS>"
                    + "<SERVICE>" + this.getPictureService + "</SERVICE>"
                    + "<OBJECT TYPE=''/>"
                    + "<DEL/><GCC/><LCC/>"
                    + "<PARAM>"
                        + "<I_V_CONTENT_ID>" + id + "</I_V_CONTENT_ID>"
                    + "</PARAM>"
                + "</EWS>";

            var url = this.url;
            while (('url' in url.toQueryParams())) {
                url = url.toQueryParams().url;
            }
            url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
            this.img.src = url + xmlin;
        } else {
            this.img.src = this.noPicture;
        }
        this.img.style.width = '75px';
    },
    /*
    * @method actionButtonPressed
    * @desc 
    */
    _actionButtonPressed: function(idEmployee, action, appId, view) {
        switch (action) {
            case 'SCR_OM_MORE': // VIEW DETAILS
                this.tarapId = appId;
                global.open($H({
                    app: {
                        appId: appId,
                        tabId: 'POPUP',
                        view: view
                    },
                    objectId: idEmployee,
                    parentType: 'P',
                    displayMode: 'display'
                }));
                break;
            default:
                break;
        }
    },
    _redrawRoot: function(index) {
        //Expand the root
        this.currentWidget._expand();
        // Refreshing tree
        this.tree.refresh();
        //Obtain root node
        this.rootIndex = index;
        var currentNode = this._getNode(this.rootsChart.get(this.rootsArray[this.rootIndex]).get('currentNode'), this.rootsChart.get(this.rootsArray[this.rootIndex]).get('recIndex'));
        //Get the html structure of the node 
        var aux = this._drawNode(currentNode, 'current', 'OMdisplay_currentNode');
        //add the content in the chart-box
        this.currentWidget.refreshContent(aux);
        this.virtualHtml.down('[id=currentNode]').update(this.hashOfHtml.get(this.rootsArray[this.rootIndex]));
        //get picture from sap and add it in chart.
        this.getPicture(currentNode.get('pictureEmployee'), '');
        // 1 = left brothers, 2 = right brothers, 3= both brothers
        var title_root = "";
        if (this.rootsArray.size() > 1) {
            var brotherRoot = -1;
            if (this.rootIndex == 0) {
                brotherRoot = 2;
            } else if (this.rootIndex == this.rootsArray.size() - 1) {
                brotherRoot = 1;
            } else if (this.rootIndex > 0 && this.rootIndex < this.rootsArray.size()) {
                brotherRoot = 3;
            }
            title_root = this._drawNodeTitle(currentNode, 'current', 'OMdisplay_rootNode', '', brotherRoot);
        } else {
            title_root = this._drawNodeTitle(currentNode, 'current');
        }
        this.currentWidget.refreshTitle(title_root);
        //create events after clicking arrow up or down
        if (this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_currentNode]')) {
            if ((this.virtualHtml.select('.application_up_arrow')[0])) {
                if (this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_currentNode]')) {
                    this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_currentNode]').stopObserving('click', this._getChart.bind(this, currentNode.get('parentId'), 'up'));
                    this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_currentNode]').observe('click', this._getChart.bind(this, currentNode.get('parentId'), 'up'));
                }
            } else {
                if (this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_currentNode]')) {
                    this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_currentNode]').stopObserving('click', this._getChart.bind(this, currentNode.get('orgunitrootid'), 'down'));
                    this.virtualHtml.down('[id=OMdisplay_arrow_OMdisplay_currentNode]').observe('click', this._getChart.bind(this, currentNode.get('orgunitrootid'), 'down'));
                }
            }
        }
        if (this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_rootNode')) {
            this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_rootNode').stopObserving();
            this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_rootNode').observe('click', this._redrawRoot.bind(this, this.rootIndex - 1));
        }
        if (this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_rootNode')) {
            this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_rootNode').stopObserving();
            this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_rootNode').observe('click', this._redrawRoot.bind(this, this.rootIndex + 1));
        }
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
            id = childNodesId[i].split('_')[0];
            recIn = childNodesId[i].split('_')[1];
            childNodes.push(this._getNode(id, recIn));
        }
        // Setting the initial child node
        if (showFrom == (childNodesId.length - 2))
            showFrom--;
        if (showFrom < 0)
            showFrom = 0;
        this.showFrom = showFrom;
        // Refreshing chart
        var j, orgunit;
        for (var i = 0; i < this.childWidgets.length; i++) {
            var j = this.showFrom + i;
            //get org unit id
            orgunit = childNodes[j]._object.orgunitid;
            recInd = childNodes[j]._object.recIndex;
            //get the html structure of the node for the org unit
            var aux = this._drawNode(childNodes[j], 'child', 'OMdisplay_childNode_' + i);
            //add the content in the chart-box
            this.childWidgets[i].refreshContent(aux);
            this.virtualHtml.down('[id=OMdisplay_manager_OMdisplay_childNode_' + i + ']').update(this.hashOfHtml.get(orgunit + '_' + recInd));
            //get picture from sap and add it in chart.
            this.getPicture(childNodes[j].get('pictureEmployee'), 'OMdisplay_childNode_' + i);
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
                this.virtualHtml.down('div#OMdisplay_arrow_OMdisplay_childNode_' + i).observe('click', this._getChart.bind(this, childNodes[j].get('orgunitid'), '', childNodes[j].get('key_str')));
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
        if (targetDiv.include('OMdisplay_currentNode')) {
            if (this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_rootNode')) {
                if (this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_rootNode').hasClassName('OMdisplay_widget_title_arrowL_imageNormal')) {
                    this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_rootNode').removeClassName('OMdisplay_widget_title_arrowL_imageNormal');
                    this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_rootNode').addClassName('OMdisplay_widget_title_arrowL_imageMin');
                }
                else {
                    this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_rootNode').removeClassName('OMdisplay_widget_title_arrowL_imageMin');
                    this.virtualHtml.down('div#OMdisplay_leftArrow_OMdisplay_rootNode').addClassName('OMdisplay_widget_title_arrowL_imageNormal');
                }
            }
            if (this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_rootNode')) {
                if (this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_rootNode').hasClassName('OMdisplay_widget_title_arrowR_imageNormal')) {
                    this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_rootNode').removeClassName('OMdisplay_widget_title_arrowR_imageNormal');
                    this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_rootNode').addClassName('OMdisplay_widget_title_arrowR_imageMin');
                }
                else {
                    this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_rootNode').removeClassName('OMdisplay_widget_title_arrowR_imageMin');
                    this.virtualHtml.down('div#OMdisplay_rightArrow_OMdisplay_rootNode').addClassName('OMdisplay_widget_title_arrowR_imageNormal');
                }
            }
        }
        // Refreshing tree
        this.tree.refresh();
    },
    /**
    *@description Refreshes the tree lines after changes in the size of the widget content
    *@param {Event} event Click event
    */
    _redrawingLines: function() {
        //Refreshing tree
        this.tree.refresh();
    },
    /**     
    *@param data {JSON} node context
    *@description It sets the node context on the treeHandler, after receiving it as the respond
    *to the get node parent (context) information service.
    */
    navigateTo: function(data) {
        this.virtualHtml.down('div#OMdisplay_chart').update('');
        //this.data = this.handleData(data);
        //this._getContents(data);
    },
    /**
    *@description Gets chart nodes from the backend
    *@param {String} orgunitid Top node's org. unit
    */
    _getChart: function(orgunitid, arrow, key) {
        if (!this.fromAdvSearch)
            this.key = key;
        //call to sap
        var xml = "<EWS>" +
                        "<SERVICE>" + this.getContentsService + "</SERVICE>" +
                        "<OBJ TYPE='S'>" + orgunitid + "</OBJ>" +
                        "<PARAM>" +
                            "<APPID>" + this.applicationId + "</APPID>" +
                            "<WID_SCREEN>*</WID_SCREEN>" +
                        "</PARAM>" +
                   "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_saveChart' }));
    },
    /**     
    *@description It sets the autocompleter structure 
    */
    setAutoCompleterDiv: function() {
        this.virtualHtml.down('div#' + this.applicationId + '_autocompleterDiv').insert("<div id='" + this.applicationId + "_autocompleter'></div>");
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        };
        this.autoCompleter = new JSONAutocompleter(this.applicationId + '_autocompleter', {
            events: $H({ onGetNewXml: this.applicationId + ':nodeSearch',
                onResultSelected: this.applicationId + ':nodeSelected'
            }),
            showEverythingOnButtonClick: true,
            templateOptionsList: '#{text}',
            templateResult: '#{text}',
            maxShown: 20,
            minChars: 1
        }, json);
    },
    /**     
    *@description It gets a search node results list.
    */
    nodeSearch: function(args) {
        if (getArgs(args).idAutocompleter == this.applicationId + '_autocompleter') {
            var json = {
                autocompleter: {
                    object: [],
                    multilanguage: {
                        no_results: global.getLabel('noresults'),
                        search: global.getLabel('search')
                    }
                }
            };
            //read values to fill autocompleter list from hash
            var titleWidgetSize = this.titleWidget.size();
            var text, id;
            this.titleWidget.each(function(node) {
                text = node[1];
                id = node[0].split('_')[0];
                json.autocompleter.object.push({ text: text, data: id });
            } .bind(this));
            this.autoCompleter.updateInput(json);
        }
    },
    /**     
    *@param args {Event} event thrown by the autoCompleter when a node has been selected from 
    *its search results list.
    *@description It reload information for selected employee.
    */
    nodeSelected: function(args) {
        if (!getArgs(args).isEmpty) {
            if (getArgs(args).idAdded || getArgs(args).get('idAdded')) {
                var idArg = getArgs(args).idAdded ? getArgs(args).idAdded : getArgs(args).get('idAdded');
                var id = idArg.split('_')[0];
                this._getChart(id);
            }
        }
    },
    /**     
    *@description It gets links of Advanced Search from sap the first time
    */
    getAdvSearchlinks: function() {
        //check if links for Adv Search have been loaded before
        if (!this.linksLoaded) {
            //calling sap to get different object for Adv Search
            var xml = "<EWS>"
                          + "<SERVICE>GET_MSHLP</SERVICE>"
                          + "<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>"
                          + "<PARAM>"
                            + "<APPID>" + this.applicationId + "</APPID>"
                          + "</PARAM>"
                        + "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'setAdvSearchlinks' }));
        } else {
            this.setAdvSearchlinks();
        }
    },
    /**     
    *@description It draws links and defines functinality for each button
    */
    setAdvSearchlinks: function(json) {
        if (!this.linksLoaded) {
            //update variable
            this.linksLoaded = true;
            // get info about links
            this.buttonsAnswer = objectToArray(json.EWS.o_tabs.yglui_str_madv_tab);
            var buttonsNavJson = {
                elements: []
                //mainClass: 'moduleInfoPopUp_stdButton_div_left'
            };
            this.numberOfLinks = this.buttonsAnswer.length;
            for (var i = 0; i < this.numberOfLinks; i++) {
                //save button info
                var seqnr = this.buttonsAnswer[i]['@seqnr'];
                this.hashOfButtons.set(seqnr, {
                    appId: this.buttonsAnswer[i]['@appid'],
                    label_tag: this.buttonsAnswer[i]['@label_tag'],
                    sadv_id: this.buttonsAnswer[i]['@sadv_id']
                });

                var aux = {
                    idButton: this.buttonsAnswer[i]['@sadv_id'] + '_button',
                    label: this.buttonsAnswer[i]['@label_tag'],
                    handlerContext: null,
                    className: 'getContentLinks application_action_link',
                    handler: this.openNavApp.bind(this, seqnr),
                    eventOrHandler: false,
                    type: 'link'
                };
                buttonsNavJson.elements.push(aux);
            } //end for
            var ButtonObj = new megaButtonDisplayer(buttonsNavJson);
            //insert buttons in div
            this.virtualHtml.down('div#advSearchLinks').insert(ButtonObj.getButtons());
        }
        //showing/hiding links
        if (!this.virtualHtml.down('div#advSearchLinks').visible()) {
            this.virtualHtml.down('div#advSearchLinks').show();
        } else {
            this.virtualHtml.down('div#advSearchLinks').hide();
        }
    },
    /**     
    *@description It opens Advanced Search application after clicking on a link.
    */
    openNavApp: function(seqnr) {
        global.open($H({
            app: {
                tabId: "POPUP",
                appId: "ADVS",
                view: "AdvancedSearch"
            },
            sadv_id: this.hashOfButtons.get(seqnr).sadv_id,
            multiple: false,
            addToMenu: false
        }));
    },
    /**     
    *@description It reloads the chart with value selected in Adv Search.
    */
    reloadChart: function(parameters) {
        //hide links of Adv. Search
        this.virtualHtml.down('div#advSearchLinks').hide();
        //get results from Adv. Search pop up
        var objectHash = getArgs(parameters).get('employeesAdded');
        var args = $H({});
        if (objectHash.size() != 0) {
            var objectId, objectName, objectType, objectKey;
            objectHash.each(function(pair) {
                objectId = pair[0];
                objectName = pair[1].name;
                objectType = pair[1].type;
                objectKey = pair[1].strKey;
            } .bind(this));
            //stop observing for events of buttons to see details
            if (this.employeeIdList) {
                this.employeeIdList.each(function(node) {
                    idEmployee = node.key;
                    document.stopObserving('EWS:WiWChart_buttons_' + this.applicationId + '_' + idEmployee, this._actionButtonPressed.bind(this, idEmployee));
                } .bind(this));
            }
            //call method to refresh the tree
            args.set('idAdded', objectId + '_' + objectType);
            this.key = objectKey;
            this.fromAdvSearch = true;
        } else {
            args.set('idAdded', '');
            this.key = '';
        }
        this.nodeSelected(args);
    },
    /**
    *@description Stops displayTree_standard
    */
    close: function($super) {
        $super();
        document.stopObserving('EWS:OM_Display_widgetToggle', this._listenToggleBinding);
        document.stopObserving('EWS:screensNavigationLinksClicked', this._listenChangesLinksBinding);
        document.stopObserving('EWS:simpleTableLinkClicked', this._listenChangesLinksBinding);
        document.stopObserving(this.applicationId + ':nodeSearch', this.nodeSearchBinding);
        document.stopObserving(this.applicationId + ':nodeSelected', this.nodeSelectedBinding);
        var idEmployee;
        if (this.employeeIdList) {
            this.employeeIdList.each(function(node) {
                idEmployee = node.key;
                document.stopObserving('EWS:WiWChart_buttons_' + this.applicationId + '_' + idEmployee, this._actionButtonPressed.bind(this, idEmployee));
            } .bind(this));
        }
        document.stopObserving('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
    }
});