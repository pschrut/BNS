/**
 *@fileOverview OM_Display.js
 *@description It contains a class with functionality for showing an organizational structure as a chart for a given date.
 */
/**
 *@constructor
 *@description Class with functionality for showing an organizational structure as a chart for a given date.
 *@augments Application
 */
var OM_Display_standard = Class.create(Application,
/** 
*@lends OM_Display 
*/
{
    /*** SERVICES ***/
    /**
     *@type String
     *@description Get OM service
     */
    getOMService: 'GET_OM',
    /**
     *@type String
     *@description Search objects service
     */
    searchObjectsService: 'SEARCH_OBJECTS',
    
    /*** VARIABLES ***/
    /**
     *@type DatePicker
     *@description Form date
     */
    formDatePicker: null,
    /**
     *@type AutocompleteSearch
     *@description Org. unit search autocompleter
     */
    searchAutocompleter: null,
    /**
     *@type Element
     *@description Application's content
     */
    htmlContent: null,
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
     *@type infoPopUp
     *@description Object showing information in a window
     */
    infoWindow: null,
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
     *@description Says if we have selected O checkbox
     */
    searchByO: null,
    /**
     *@type String
     *@description Says if we have selected S checkbox
     */
    searchByS: null,
     /**
     *@type String
     *@description Sets date format
     */
    dateFormat: 'yyyy-MM-dd',
    /**
     *@type String
     *@description Autocompleter's value
     */
    searchTextAutocompleterValue: "",
    /**
     *@type Hash
     *@description Elements received from the search
     */
    hashAC: new Hash(),
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
    
    /*** METHODS ***/
    /**
     *Constructor of the class OM_Display
     */
    initialize: function($super,args) {
        $super(args);
        this._listenToggleBinding =  this._listenToggle.bindAsEventListener(this);
        this._dateChangedBinding = this._dateChanged.bindAsEventListener(this);
        this._setSearchTextBinding = this._setSearchText.bindAsEventListener(this);
        this._makeSimpleSearchBinding = this._makeSimpleSearch.bindAsEventListener(this);
    },
    /**
     *@description Starts OMdisplay
     */
    run: function($super) {
        $super();
        if (this.firstRun) {
            this.htmlContent = this.virtualHtml;
            this._setInitialHTML();
            this._getInitialChart();
        }
        else
            this._getChart(this.lastOrgUnit);
        document.observe('EWS:OM_Display_widgetToggle', this._listenToggleBinding);
        document.observe("EWS:datepicker_CorrectDate", this._dateChangedBinding);
        document.observe('EWS:autocompleter_getNewXML', this._setSearchTextBinding);
        document.observe('EWS:autocompleter_resultSelected', this._makeSimpleSearchBinding);  
    },
    /**
     *@description Stops OMdisplay
     */
    close: function($super) {
        $super();
        document.stopObserving('EWS:OM_Display_widgetToggle', this._listenToggleBinding);
        document.stopObserving("EWS:datepicker_CorrectDate", this._dateChangedBinding);
        document.stopObserving('EWS:autocompleter_getNewXML', this._setSearchTextBinding);
        document.stopObserving('EWS:autocompleter_resultSelected', this._makeSimpleSearchBinding);
    },
    /**
     *@description Builds the initial HTML code
     */
    _setInitialHTML: function() {
        // HTML
        var html = "<div id='OMdisplay_content'>" +
                       "<span id='OMdisplay_form_dateLabel' class='application_main_text'>" + global.getLabel('date') + "</span>" +
                       "<div id='OMdisplay_form_calendar'>" +
                           "<div id='OMdisplay_calendar'></div>" +
                       "</div>" +
                       "<div id='OMdisplay_form_search'>" +
                           "<div id='OMdisplay_search'></div>" +
                       "</div>" +
                       "<div id='OMdisplay_form_orgUnit'>" +
                            "<input id='OMdisplay_orgUnit' type='checkbox' value='orgUnit' checked/>" +
                       "</div>" +
                       "<span id='OMdisplay_form_orgUnitLabel' class='application_main_text'>" + global.getLabel('ORGEH') + "</span>" +
                       "<div id='OMdisplay_form_position'>" +
                            "<input id='OMdisplay_position' type='checkbox' value='position'/>" +
                       "</div>" +
                       "<span id='OMdisplay_form_positionLabel' class='application_main_text'>" + global.getLabel('PLANS') + "</span>" +
                       "<div id='OMdisplay_form_legend'></div>" +
                       //"<div id='OMdisplay_form_searchIcon' class='application_catalog_image'></div>" +
                       //"<span class='application_action_link' id='OMdisplay_form_advSearchLink'>" + "Advanced Search" + "</span>" +
                       "<div id='OMdisplay_chart'></div>" +
                       "<div class='OMdisplay_widget_blankLine'>&nbsp;</div>" +
                   "</div>";
        this.htmlContent.insert(html);
        // Date picker initialization
        var date = Date.today().toString('yyyyMMdd');
        this.formDatePicker = new DatePicker('OMdisplay_calendar', {
            defaultDate: date,
            draggable: true,
            manualDateInsertion: false,
            events: $H({dateSelected: 'EWS:datepicker_CorrectDate'})
        });
        // Autocompleter initialization
        var json = { 
            autocompleter: {
                object:[],
                multilanguage:{
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        this.searchAutocompleter = new JSONAutocompleter('OMdisplay_search', {
            showEverythingOnButtonClick: true,
            timeout: 0,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1,
            noFilter: true,
            events: $H({onGetNewXml: 'EWS:autocompleter_getNewXML',
                        onResultSelected: 'EWS:autocompleter_resultSelected'})
        }, json);
        // Checkboxes & autocompleter events
        this.htmlContent.down('input#OMdisplay_orgUnit').observe('click', this._setCheckBoxes.bind(this));
        this.htmlContent.down('input#OMdisplay_position').observe('click', this._setCheckBoxes.bind(this));
        // Arrow in autocompleter
        this.htmlContent.down('input#button_OMdisplay_search').observe('click', function() {
            this.searchAutocompleter.clearInput();
        }.bind(this));
        // Advanced search application
        //this.htmlContent.down('span#OMdisplay_form_advSearchLink').observe('click', function() {
        //    alert('Advanced search');
        //}.bind(this));
        // Legend
        var legendJSON = { 
            legend: [
                { img: "OMdisplay_legend_positionNormal", text: global.getLabel('occupied') },
                { img: "OMdisplay_legend_positionEmpty", text: global.getLabel('empty') },
                { img: "OMdisplay_legend_positionVacancy", text: global.getLabel('vacant') },
                { img: "OMdisplay_legend_positionObsolete", text: global.getLabel('obsolete') }
            ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
        var legendHTML = getLegend(legendJSON);
        this.htmlContent.down('div#OMdisplay_form_legend').update(legendHTML);  
        // Initial checkbox checked
        this.searchByO = true;
    },
    /**
     *@description Gets the initial chart nodes from the backend
     */
    _getInitialChart: function() {
        var xml = "<EWS><SERVICE>" + this.getOMService + "</SERVICE>" +
            "<OBJECT TYPE=\"\"></OBJECT><PARAM>" +
            "<o_date>" + this.formDatePicker.actualDate.toString(this.dateFormat) + "</o_date>" +
            "<o_depth>2</o_depth>" +
            "<o_mode>D</o_mode>" +
            "</PARAM></EWS>";
        this.makeAJAXrequest($H({xml:xml, successMethod:'_saveChart'}));
    },
    /**
     *@description Gets chart nodes from the backend
     *@param {String} orgunitid Top node's org. unit
     */
    _getChart: function(orgunitid) {
        var xml = "<EWS><SERVICE>" + this.getOMService + "</SERVICE>" +
            "<OBJECT TYPE=\"O\">" + orgunitid + "</OBJECT><PARAM>" +
            "<o_date>" + this.formDatePicker.actualDate.toString(this.dateFormat) + "</o_date>" +
            "<o_depth>2</o_depth>" +
            "<o_mode>D</o_mode>" +
            "</PARAM></EWS>";
        this.makeAJAXrequest($H({xml:xml, successMethod:'_saveChart'}));
    },
    /**
     *@description Stores nodes obtained from the backend
     *@param {JSON} json Object from the backend
     */
    _saveChart: function(json) {
        // Creating hash structure
        this.currentChart = new Hash();
        this.currentChart.set('currentNode', null);
        var children = new Array();
        this.currentChart.set('childNodes', children);
        var staff = new Array();
        this.currentChart.set('staffNodes', staff);
        var allnodes = new Hash();
        this.currentChart.set('nodes', allnodes);
        var hiddeninfo = new Hash();
        this.currentChart.set('hidden', hiddeninfo);
        // Saving hidden fields information
        var hidden = json.EWS.o_hiddenfields;
        if (!Object.isEmpty(hidden)) {
            hidden = objectToArray(hidden.yglui_tab_fields);
            for (var i = 0; i < hidden.length; i++) {
                var field = hidden[i]['@field'];
                field = field.toLowerCase();
                var value = false;
                if (hidden[i]['@hide'] == 'X')
                    value = true;
                this.currentChart.get('hidden').set(field, value);
            }
        }
        // Saving org. units information
        var nodes = objectToArray(json.EWS.o_orgunits.yglui_tab_orginfo);
        for (var i = 0; i < nodes.length; i++) {
            var node = new Hash();
            var orgunitid = nodes[i]['@orgunitid'];
            if (Object.isEmpty(orgunitid)) orgunitid = '';
            node.set('orgunitid', orgunitid);
            var orgunitname = nodes[i]['@orgunitname'];
            if (Object.isEmpty(orgunitname)) orgunitname = '';
            node.set('orgunitname', orgunitname);
            var orgunitrootid = nodes[i]['@orgunitrootid'];
            if (Object.isEmpty(orgunitrootid)) orgunitrootid = '';
            node.set('orgunitrootid', orgunitrootid);
            var begda = nodes[i]['@orgbegda'];
            node.set('begda', begda);
            var endda = nodes[i]['@orgendda'];
            node.set('endda', endda);
            var costcenterid = nodes[i]['@costcenterid'];
            if (Object.isEmpty(costcenterid)) costcenterid = '';
            node.set('costcenterid', costcenterid);
            var costcentername = nodes[i]['@costcentername'];
            if (Object.isEmpty(costcentername)) costcentername = '';
            node.set('costcentername', costcentername);
            var totalpositions = nodes[i]['@totalpositions'];
            if (Object.isEmpty(totalpositions)) totalpositions = 0;
            node.set('totalpositions', parseInt(totalpositions));
            var filledpositions = nodes[i]['@filledpositions'];
            if (Object.isEmpty(filledpositions)) filledpositions = 0;
            node.set('filledpositions', parseInt(filledpositions));
            var indicatorflag = nodes[i]['@indicatorflag'];
            if (Object.isEmpty(indicatorflag)) indicatorflag = '';
            node.set('indicatorflag', indicatorflag);
            var staffflag = false;
            if (nodes[i]['@staffflag'] == 'X') staffflag = true;
            node.set('staffflag', staffflag);
            var haschildnodes = false;
            if (nodes[i]['@hasorgunitchild'] == 'X') haschildnodes = true;
            node.set('haschildnodes', haschildnodes);
            // Positions
            var managers = new Array();
            node.set('managers', managers);
            var positions = new Array();
            node.set('positions', positions);
            // Associations
            // Current node (always the first one)
            if (i == 0) {
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
        }
        // Saving positions information
        if (json.EWS.o_positions) {
            var positions = objectToArray(json.EWS.o_positions.yglui_tab_posinfo);
            for (var i = 0; i < positions.length; i++) {
                var position = new Hash();
                var employeeid = positions[i]['@employeeid'];
                if (Object.isEmpty(employeeid)) employeeid = '';
                position.set('employeeid', employeeid);
                var employeename = positions[i]['@employeename'];
                if (Object.isEmpty(employeename)) employeename = '';
                position.set('employeename', employeename);
                var begda = positions[i]['@posbegda'];
                position.set('begda', begda);
                var endda = positions[i]['@posendda'];
                position.set('endda', endda);
                var jobid = positions[i]['@jobid'];
                if (Object.isEmpty(jobid)) jobid = '';
                position.set('jobid', jobid);
                var jobname = positions[i]['@jobname'];
                if (Object.isEmpty(jobname)) jobname = '';
                position.set('jobname', jobname);
                var positionid = positions[i]['@positionid'];
                if (Object.isEmpty(positionid)) positionid = '';
                position.set('positionid', positionid);
                var positionname = positions[i]['@positionname'];
                if (Object.isEmpty(positionname)) positionname = '';
                position.set('positionname', positionname);
                var posstatus = positions[i]['@posstatus'];
                if (Object.isEmpty(posstatus)) posstatus = '';
                position.set('posstatus', posstatus);
                var managerflag = false;
                if (positions[i]['@managerflag'] == 'X') managerflag = true;
                var orgunitid = positions[i]['@orgunitid'];
                if (Object.isEmpty(orgunitid)) orgunitid = '';
                if (managerflag)
                    this.currentChart.get('nodes').get(orgunitid).get('managers').push(position)
                else
                    this.currentChart.get('nodes').get(orgunitid).get('positions').push(position);
            }
        }
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
            html += "<div id='OMdisplay_backToRoot' class='application_action_link ";
            if (this.loggedUserOrgUnit == this.currentChart.get('currentNode'))
                html += "OMdisplay_hideElement";
            else
                html += "OMdisplay_showElement";
            html += "'>" + global.getLabel('backtoroot') + "</div>";
            this.htmlContent.down('div#OMdisplay_chart').update(html);
            if (this.htmlContent.down('div#OMdisplay_backToRoot')) {
                this.htmlContent.down('div#OMdisplay_backToRoot').observe('click', this._goToRoot.bind(this));
            }
            // Widgets creation
            var options_cur = $H({
                title         : this._drawNodeTitle(currentNode, 'current'),
                events        : $H({onToggle: 'EWS:OM_Display_widgetToggle'}),
                collapseBut   : true,
                contentHTML   : this._drawNode(currentNode, 'current', 'OMdisplay_currentNode'),
                targetDiv     : 'OMdisplay_currentNode'        
            });
            var widget_cur = new unmWidget(options_cur);
            this.currentWidget = widget_cur;
            if (this.htmlContent.down('div#OMdisplay_arrow_OMdisplay_currentNode')) {
                this.htmlContent.down('div#OMdisplay_arrow_OMdisplay_currentNode').observe('click', this._getChart.bind(this, currentNode.get('orgunitrootid')));
            }
            if (currentNode.get('positions').length > 0)
                this.htmlContent.down('span#OMdisplay_team_OMdisplay_currentNode').observe('click', this._toggleTeamInfo.bind(this, 'OMdisplay_currentNode'));
            this._drawPositions(currentNode, 'OMdisplay_currentNode');
            var staffDivs = new Array();
            for (var i = 0; i < staffNodesId.length; i++) {
                if (i % 2 == 0)
                    this.htmlContent.down('div#OMdisplay_staffNode_' + i).addClassName('OMdisplay_widget_leftStaff');
                else
                    this.htmlContent.down('div#OMdisplay_staffNode_' + i).addClassName('OMdisplay_widget_rightStaff');
                var options_sta = $H({
                    title         : this._drawNodeTitle(staffNodes[i], 'staff'),
                    events        : $H({onToggle: 'EWS:OM_Display_widgetToggle'}),
                    collapseBut   : true,
                    contentHTML   : this._drawNode(staffNodes[i], 'staff', 'OMdisplay_staffNode_' + i),
                    targetDiv     : 'OMdisplay_staffNode_' + i        
                });
                var widget_sta = new unmWidget(options_sta);
                this._drawPositions(staffNodes[i], 'OMdisplay_staffNode_' + i);
                if (this.htmlContent.down('div#OMdisplay_arrow_OMdisplay_staffNode_' + i)) {
                    this.htmlContent.down('div#OMdisplay_arrow_OMdisplay_staffNode_' + i).observe('click', this._getChart.bind(this, staffNodes[i].get('orgunitid')));
                }
                if (staffNodes[i].get('positions').length > 0)
                    this.htmlContent.down('span#OMdisplay_team_OMdisplay_staffNode_' + i).observe('click', this._toggleTeamInfo.bind(this, 'OMdisplay_staffNode_' + i));
                staffDivs.push('OMdisplay_staffNode_' + i);
            }
            this.childWidgets = new Array();
            var childDivs = new Array();
            for (var i = 0; i < maxChild; i++) {
                if (childNodesId.length == 2) {
                    if (i == 0)
                        this.htmlContent.down('div#OMdisplay_childNode_' + i).addClassName('OMdisplay_widget_twoChildren_firstChild');
                    else
                        this.htmlContent.down('div#OMdisplay_childNode_' + i).addClassName('OMdisplay_widget_twoChildren_secondChild');
                }
                else {
                    if (childNodesId.length > 2) {
                        if (i == 0)
                            this.htmlContent.down('div#OMdisplay_childNode_' + i).addClassName('OMdisplay_widget_threeChildren_firstChild');
                        else {
                            if (i == 1)
                                this.htmlContent.down('div#OMdisplay_childNode_' + i).addClassName('OMdisplay_widget_threeChildren_secondChild');
                            else
                                this.htmlContent.down('div#OMdisplay_childNode_' + i).addClassName('OMdisplay_widget_threeChildren_thirdChild');
                        }
                    }
                    else
                        this.htmlContent.down('div#OMdisplay_childNode_' + i).addClassName('OMdisplay_widget_oneChild');
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
                    title         : title_chi,
                    events        : $H({onToggle: 'EWS:OM_Display_widgetToggle'}),
                    collapseBut   : true,
                    contentHTML   : this._drawNode(childNodes[i], 'child', 'OMdisplay_childNode_' + i),
                    targetDiv     : 'OMdisplay_childNode_' + i
                });
                var widget_chi = new unmWidget(options_chi);
                if (this.htmlContent.down('div#OMdisplay_arrow_OMdisplay_childNode_' + i)) {
                    this.htmlContent.down('div#OMdisplay_arrow_OMdisplay_childNode_' + i).observe('click', this._getChart.bind(this, childNodes[i].get('orgunitid')));
                }
                this._drawPositions(childNodes[i], 'OMdisplay_childNode_' + i);
                if (childNodes[i].get('positions').length > 0)
                    this.htmlContent.down('span#OMdisplay_team_OMdisplay_childNode_' + i).observe('click', this._toggleTeamInfo.bind(this, 'OMdisplay_childNode_' + i));
                if (this.htmlContent.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + i)) {
                    this.htmlContent.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + i).observe('click', this._redrawChildren.bind(this, this.showFrom - 2));
                }
                if (this.htmlContent.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + i)) {
                    this.htmlContent.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + i).observe('click', this._redrawChildren.bind(this, this.showFrom + 2));
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
     *@description Refreshes the tree lines
     *@param {Event} event Click event
     */
    _listenToggle: function(event) {
        var targetDiv = getArgs(event).get('targetDiv');
        // Moving lateral arrows in child nodes (if needed)
        if (targetDiv.include('OMdisplay_childNode_')) {
            var pos = parseInt(targetDiv.substring(targetDiv.lastIndexOf("_") + 1, targetDiv.length));
            if (this.htmlContent.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + pos)) {
                if (this.htmlContent.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + pos).hasClassName('OMdisplay_widget_title_arrowL_imageNormal')) {
                    this.htmlContent.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + pos).removeClassName('OMdisplay_widget_title_arrowL_imageNormal');
                    this.htmlContent.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + pos).addClassName('OMdisplay_widget_title_arrowL_imageMin');
                }
                else {
                    this.htmlContent.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + pos).removeClassName('OMdisplay_widget_title_arrowL_imageMin');
                    this.htmlContent.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + pos).addClassName('OMdisplay_widget_title_arrowL_imageNormal');
                }
            }
            if (this.htmlContent.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + pos)) {
                if (this.htmlContent.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + pos).hasClassName('OMdisplay_widget_title_arrowR_imageNormal')) {
                    this.htmlContent.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + pos).removeClassName('OMdisplay_widget_title_arrowR_imageNormal');
                    this.htmlContent.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + pos).addClassName('OMdisplay_widget_title_arrowR_imageMin');
                }
                else {
                    this.htmlContent.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + pos).removeClassName('OMdisplay_widget_title_arrowR_imageMin');
                    this.htmlContent.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + pos).addClassName('OMdisplay_widget_title_arrowR_imageNormal');
                }
            }
        }
        // Refreshing tree
        this.tree.refresh();   
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
                    "<table>";
        if (!this.currentChart.get('hidden').get('costcenter'))
            html += "<tr>" +
                        "<td class='OMdisplay_widget_initialInfo_label'><span class='application_main_soft_text'>" + global.getLabel('costcenter') + "</span></td>" +
                        "<td class='OMdisplay_widget_initialInfo_value'><span class='application_text_bolder'>" + costcentername + "</span></td>" +
                    "</tr>";
        html += "<tr>" +
                    "<td class='OMdisplay_widget_initialInfo_label'><span class='application_main_soft_text'>" + global.getLabel('incharge') + "</span></td>" +
                    "<td class='OMdisplay_widget_initialInfo_value'>";
        var managers = node.get('managers');
        for (var  i = 0; i < managers.length; i++) {
            var managername = '';
            var managerpos = '';
            managername = managers[i].get('employeename');
            if (Object.isEmpty(managername))
                managername = '';
            managerpos = managers[i].get('positionname');
            if (Object.isEmpty(managerpos))
                managerpos = '';
            html += "<span id='OMdisplay_manager_" + targetDiv + "_" + i + "' class='application_text_bolder";
            if (!Object.isEmpty(managername))
                html += " application_handCursor";
            html += "'";
            if (!Object.isEmpty(managername))
                html += " onClick='javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"OM_MaintObjView\", node: \"" + managers[i].get("employeeid") + "\", objectType:\"P\", begdate: \"" + this.formDatePicker.actualDate.toString(this.dateFormat) + "\", position: \"" + managers[i].get("positionid") + "\"}))'";
            if (Object.isEmpty(managername))
                managername = global.getLabel('nomanager');
            html += ">" + managername + "</span><br />" +
                    "<span class='application_legend_text OMdisplay_widget_initialInfo_italic";
            if (!Object.isEmpty(managerpos))
                html += " OMdisplay_widget_no_underline application_handCursor OMdisplay_widget_positionsFont";
            html += "'";
            if (!Object.isEmpty(managerpos))
                html += " onClick='javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"OM_MaintObjView\", node:\"" + managers[i].get("positionid") + "\", objectType:\"S\", begdate:\""+ managers[i].get("begda") + "\", enddate:\"" + managers[i].get("endda") + "\", root:\"" + node.get("orgunitname") + "\"}))'";
            html += ">" + managerpos + "</span><br />";
        }
        html += "</td></tr>";
        // Links and arrow
        html += "<tr>" +
                    "<td class='OMdisplay_widget_initialInfo_link'><span class='application_action_link' onClick='javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"OM_MaintObjView\", node:\"" + node.get("orgunitid") + "\", objectType:\"O\", begdate:\""+ node.get("begda") + "\", enddate:\""+ node.get("endda") +"\", root:\"" + node.get("orgunitname") + "\"}))'>" + global.getLabel('more') + "</span>&nbsp;&nbsp;";
        if (node.get('positions').length > 0)
            html += "<span id='OMdisplay_team_" + targetDiv + "' class='application_action_link'>" + global.getLabel('team') + "</span>";
        html += "</td><td class='OMdisplay_widget_initialInfo_arrow'>";
        if (type == 'current') {
            if ((node.get('orgunitid') != node.get('orgunitrootid')) && (node.get('orgunitrootid') != '00000000') && (node.get('orgunitid') != this.loggedUserOrgUnit))
                html += "<div id='OMdisplay_arrow_" + targetDiv + "' class='application_up_arrow OMdisplay_widget_initialInfo_arrowU_image'></div>";
        }
        else {
            if (node.get('haschildnodes'))
                html += "<div id='OMdisplay_arrow_" + targetDiv + "' class='application_down_arrow OMdisplay_widget_initialInfo_arrowD_image'></div>";
        }
        html += "</td></tr></table></div>";
        // Hidden info (team list)
        html += "<div id='OMdisplay_hiddenInfo_" + targetDiv + "' class='OMdisplay_widget_hiddenInfo' style='display:none;'></div>" +
                "<div class='OMdisplay_widget_blankLine'>&nbsp;</div>";
        return html;
    },
    /**
     *@description Draws a node's positions
     *@param {Hash} node Node whose positions we want to draw
     *@param {String} targetDiv Node's target div (widget)
     */
    _drawPositions: function(node, targetDiv) {
        var html = "";
        // Getting positions
        var positions = node.get('positions');
        // Drawing positions
        for (var i = 0; i < positions.length; i++) {
            var employeename = positions[i].get('employeename');
            var status = positions[i].get('posstatus');
            if (status == 'E')
                employeename = global.getLabel('emptypos');
            if (status == 'V' && Object.isEmpty(employeename))
                employeename = global.getLabel('vacantpos');
            if (status == 'O' && Object.isEmpty(employeename))
                employeename = global.getLabel('obsoletepos');
            html += "<div class='OMdisplay_widget_positionEmployee";
            if (status == 'E')
                html += ' OMdisplay_widget_employeeEmpty';
            if (status == 'O')
                html += ' OMdisplay_widget_employeeObsolete';
            if (status == 'V')
                html += ' OMdisplay_widget_employeeVacancy';
            if (status == 'N')
                html += ' OMdisplay_widget_employeeNormal';
            html += "'><span id='OMdisplay_employee_" + targetDiv + "_" + i + "' class='application_text_bolder";
            if ((!Object.isEmpty(employeename)) && (status != 'E') && (status != 'V') && (status != 'O'))
                html += " application_handCursor";
            html += "'";
            if ((!Object.isEmpty(employeename)) && (status != 'E') && (status != 'V') && (status != 'O'))
                html += " onClick='javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"OM_MaintObjView\", node: \"" + positions[i].get("employeeid") + "\", objectType:\"P\", begdate: \"" + this.formDatePicker.actualDate.toString(this.dateFormat) + "\", position: \"" + positions[i].get("positionid") + "\"}))'";
            html += ">" + employeename + "</span></div>" +
                    "<div class='OMdisplay_widget_positionName";
            if (status == 'E')
                html += ' OMdisplay_widget_positionEmpty';
            if (status == 'O')
                html += ' OMdisplay_widget_positionObsolete';
            if (status == 'V')
                html += ' OMdisplay_widget_positionVacancy';
            if (status == 'N')
                html += ' OMdisplay_widget_positionNormal';
            html += "'><span class='application_legend_text OMdisplay_widget_initialInfo_italic application_action_link OMdisplay_widget_no_underline' onClick='javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"OM_MaintObjView\", node:\"" + positions[i].get("positionid") + "\", objectType:\"S\", begdate:\""+ positions[i].get("begda") + "\", enddate:\""+ positions[i].get("endda") +"\", root:\"" + node.get("orgunitname") + "\"}))'>";
            if (status == 'O')
                html +=  global.getLabel('obsolete').toUpperCase() + ' ';
            html += positions[i].get('positionname') + "</span></div>";
        }
        this.htmlContent.down('div#OMdisplay_hiddenInfo_' + targetDiv).insert(html);
    },
    /**
     *@description Shows/Hides an organizational unit's member list
     *@param {String} targetDiv Node's target div (widget)
     */
    _toggleTeamInfo: function(targetDiv) {
        this.htmlContent.down('div#OMdisplay_hiddenInfo_' + targetDiv).toggle();
        if (this.tree)
            this.tree.refresh();
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
            if (this.htmlContent.down('div#OMdisplay_arrow_OMdisplay_childNode_' + i)) {
                this.htmlContent.down('div#OMdisplay_arrow_OMdisplay_childNode_' + i).stopObserving();
                this.htmlContent.down('div#OMdisplay_arrow_OMdisplay_childNode_' + i).observe('click', this._getChart.bind(this, childNodes[j].get('orgunitid')));
            }
            this._drawPositions(childNodes[j], 'OMdisplay_childNode_' + i);
            if (this.htmlContent.down('span#OMdisplay_team_OMdisplay_childNode_' + i))
                this.htmlContent.down('span#OMdisplay_team_OMdisplay_childNode_' + i).stopObserving();
            if (childNodes[j].get('positions').length > 0) {
                this.htmlContent.down('span#OMdisplay_team_OMdisplay_childNode_' + i).observe('click', this._toggleTeamInfo.bind(this, 'OMdisplay_childNode_' + i));
            }
            if (this.htmlContent.down('span#OMdisplay_manager_OMdisplay_childNode_' + i))
                this.htmlContent.down('span#OMdisplay_manager_OMdisplay_childNode_' + i).stopObserving();
            if (this.htmlContent.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + i)) {
                this.htmlContent.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + i).stopObserving();
                this.htmlContent.down('div#OMdisplay_leftArrow_OMdisplay_childNode_' + i).observe('click', this._redrawChildren.bind(this, this.showFrom - 2));
            }
            if (this.htmlContent.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + i)) {
                this.htmlContent.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + i).stopObserving();
                this.htmlContent.down('div#OMdisplay_rightArrow_OMdisplay_childNode_' + i).observe('click', this._redrawChildren.bind(this, this.showFrom + 2));
            }
        }
    },
    /**
     *@description Changes checkboxes' parameters
     *@param {Event} event Click event
     */  
    _setCheckBoxes: function(event) {
        var element = Event.element(event);
        var checked = element.getValue();
        var id = element.id;
        // If is an O checkbox...
        if (id == "OMdisplay_orgUnit") {
            if (checked)
                this.searchByO = true;
            else  
                this.searchByO = false; 
        } 
        // If is an S checkbox...
        if(id=="OMdisplay_position") {
            if (checked)
                this.searchByS = true;
            else    
                this.searchByS = false;      
        }
    },
    /**
     *@description Calls "search_objects" service to get the option list for the autocompleter
     */ 
    _callToGetOptionsSearch: function() {
        if (Object.isEmpty(this.searchTextAutocompleterValue)) {
            this.searchTextAutocompleterValue = '*';
        }
        var orgUnitChecked = "";
        var posChecked = "";
        if (this.searchByO)
            orgUnitChecked = 'Y';
        else    
            orgUnitChecked = 'N';
        if (this.searchByS)
            posChecked = 'Y';
        else  
            posChecked = 'N'; 
        var parsedDate = this.formDatePicker.actualDate.toString(this.dateFormat);
        // Call to the service
        var xml = "<EWS>" +
                      "<SERVICE>" + this.searchObjectsService + "</SERVICE>" +
                      "<PARAM>" +
                          "<ORG_UNIT>" + orgUnitChecked + "</ORG_UNIT>" +
                          "<POSITION>" + posChecked + "</POSITION>" +
                          "<COSTCENT>N</COSTCENT>" +
                          "<PERSON>N</PERSON>" +
                          "<O_BEGDA>" + parsedDate + "</O_BEGDA>" +
                          "<O_ENDDA>" + parsedDate + "</O_ENDDA>" +
                          "<TEXT>" + this.searchTextAutocompleterValue + "</TEXT>" +
                          "<MAX>20</MAX>" +
                      "</PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({xml:xml, successMethod:'_buildAutocompleterJSON'}));
    },
    /**
     *@description Fills the search autocompleter
     *@param {JSON} jsonObject Object from the backend
     */
    _buildAutocompleterJSON: function(jsonObject) {
        this.hashAC = $H({});
        var json = { 
            autocompleter: {
                object:[],
                multilanguage:{
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        // If we receive a json with results..
        if(jsonObject.EWS.o_objects) {
            var array = objectToArray(jsonObject.EWS.o_objects.yglui_tab_objects);
            for(var i = 0; i < array.length; i++){
                var idObject = array[i]["@objid"];
                var type = array[i]["@otype"];
                var oName = array[i]["@orgtext"];
                var id = array[i]["@orgid"];
                var text = Object.isEmpty(array[i]["@stext"]) ? array[i]["@short"] : array[i]["@stext"];
                var bDate = array[i]["@begda"];
                var eDate = array[i]["@endda"];
                this.hashAC.set(idObject, {type:type, idObject:idObject, id:id, text:text, oName:oName, bDate:bDate, eDate:eDate});
            }
            this.hashAC.each(function(pair){
                var text = Object.isEmpty(pair.value['oName']) ? "" : " - (" + pair.value['oName'] + ")";
                json.autocompleter.object.push({
                    data: pair.key,
                    text: pair.value['text'] + " [" + pair.value['idObject'] + "] " + text
                })
            });
        }
        this.searchAutocompleter.updateInput(json);
        if (jsonObject.EWS.webmessage_text)
            this._infoMethod(jsonObject);
    },
    /**
     *@description Gets elements for the selected object and updates the chart
     *@param {Object} args Information about the autocompleter
     */
    _makeSimpleSearch: function(args) {
        if(!Object.isEmpty(getArgs(args)) && (getArgs(args).isEmpty == false)) {
            var elementChosen = this.hashAC.get(getArgs(args).idAdded);
            var orgUnitId = elementChosen.type=='S' ? elementChosen.id : elementChosen.idObject;
            this.searchTextAutocompleterValue = elementChosen.text;
            this._getChart(orgUnitId);
        }
        else
            this.searchTextAutocompleterValue = "";
    },
    /**
     *@description Sets the value of the autocompleter's text as parameter for refreshing the autocompleter's list
     */
    _setSearchText: function() {
        this.searchTextAutocompleterValue = this.searchAutocompleter.element.value;
        if (this.searchTextAutocompleterValue.include("["))
            this.searchTextAutocompleterValue = this.searchTextAutocompleterValue.split(" ")[0];
        // Service restriction
        if (this.searchTextAutocompleterValue.length > 12)
            this.searchTextAutocompleterValue = this.searchTextAutocompleterValue.substring(0,12);
        this._callToGetOptionsSearch();
    },
    /**
     *@description Redraws the chart with the new date submitted
     */
    _dateChanged: function() {
        var orgunitid = this.currentChart.get('nodes').get(this.currentChart.get('currentNode')).get('orgunitid');
        var xml = "<EWS><SERVICE>" + this.getOMService + "</SERVICE>" +
            "<OBJECT TYPE=\"O\">" + orgunitid + "</OBJECT><PARAM>" +
            "<o_date>" + this.formDatePicker.actualDate.toString(this.dateFormat) + "</o_date>" +
            "<o_depth>2</o_depth>" +
            "<o_mode>D</o_mode>" +
            "</PARAM></EWS>";
        this.makeAJAXrequest($H({xml:xml, successMethod:'_saveChart'}));
    },
    /**
     *@description Shows the root node
     */
    _goToRoot: function() {
        this.searchAutocompleter.clearInput();
        this._getChart(this.loggedUserOrgUnit);
    }
});



var OM_Display = Class.create(OM_Display_standard, {
    initialize: function($super) {
        $super("OM_Display");
    },
    run: function($super) {
        $super();
    },
    close: function($super) {
        $super();
    }
});