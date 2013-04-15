/**
 *@fileOverview OM_PosAssign.js
 *@description It contains a class with functionality for managing position assignments.
 */
/**
 *@constructor
 *@description Class with functionality for managing position assignments.
 *@augments Application
 */
var OM_PosAssign_standard = Class.create(Application,
/** 
*@lends OM_PosAssign_standard 
*/
{
    /*** SERVICES ***/
    /**
     *@type String
     *@description Maintain assignments service
     */
    maintAssignService: 'MAINT_ASSIGN',
    /**
     *@type String
     *@description Search objects service
     */
    searchObjectsService: 'SEARCH_OBJECTS',
    /**
     *@type String
     *@description Get relations service
     */
    getRelationsService: 'GET_RELATIONS',
    
    /*** VARIABLES ***/
    /**
     *@type String
     *@description Position clicked
     */
    position: "",
    /**
     *@type String
     *@description Initial date format
     */
    dateFormatIn: 'yyyy-MM-dd',
    /**
     *@type String
     *@description Final date format
     */
    dateFormatOut: null,
    /**
     *@type AutocompleteSearch
     *@description Org. units search autocompleter
     */
    orgUnitAutocompleter: null,
    /**
     *@type AutocompleteSearch
     *@description Relations search autocompleter
     */
    relationAutocompleter: null,
    /**
     *@type String
     *@description Org. units autocompleter's value
     */
    orgUnitAutocompleterValue: "",
    /**
     *@type String
     *@description Last org. units autocompleter's default value
     */
    orgUnitAutocompleterDefaultValue: "",
    /**
     *@type Hash
     *@description Elements received from the search
     */
    hashAC: new Hash(),
    /**
     *@type Hash
     *@description All org. units info
     */
    orgUnitsInfo: null,
    /**
     *@type JSON
     *@description Last org. units JSON for the autocompleter
     */
    lastOrgUnits: null,
    /**
     *@type Array
     *@description Selected org. units in upper table
     */
    selectedRows: null,
    
    /*** METHODS ***/
    /**
     *Constructor of the class OM_PosAssign_standard
     */
    initialize: function($super, args) {
        $super(args);
        this._setSearchTextBinding = this._setSearchText.bindAsEventListener(this);
        this._makeSimpleSearchBinding = this._makeSimpleSearch.bindAsEventListener(this);
        this.dateFormatOut = global.dateFormat;
    },
    /**
     *@description Starts OM_PosAssign_standard
     *@param {Object} args Application's args
     */
    run: function($super, args) {
        $super();
        if (balloon.isVisible())
            balloon.hide();
        if (args.get('node'))
            this.position = args.get('node');
        this.selectedRows = new Array();
        if (this.firstRun) {
            this.htmlContent = this.virtualHtml;
            this._setInitialHTML();
        }
        else {
            this.htmlContent.down('tbody#OMposAssign_orgUnitsTable_body').update("");
            this._checkInputs();
            this._hideDetails();
            this._getOrgUnits(this.position);
        }
        document.observe('EWS:autocompleter_getNewXML', this._setSearchTextBinding);
        document.observe('EWS:autocompleter_resultSelected', this._makeSimpleSearchBinding); 
    },
    /**
     *@description Stops OM_PosAssign_standard
     */
    close: function($super) {
        $super();
        document.stopObserving('EWS:autocompleter_getNewXML', this._setSearchTextBinding);
        document.stopObserving('EWS:autocompleter_resultSelected', this._makeSimpleSearchBinding);
    },
    /**
     *@description Builds the initial HTML code
     */
    _setInitialHTML: function() {
        var title = global.getLabel('managePA');
        var html = "<span class='application_main_title'>" + title + "</span>" +
                   "<div id='OMposAssign_orgUnits'></div>" +
                   "<div id='OMposAssign_actions'></div>" +
                   "<div id='OMposAssign_details' class='OMposAssign_hidden'></div>" +
                   "<div id='OMposAssign_buttons'></div>";
        this.htmlContent.update(html);
        var table = "<table class='sortable OMposAssign_shown' id='OMposAssign_orgUnitsTable'>" +
                        "<thead>" +
                            "<tr>" +
                                "<th class='OMposAssign_orgUnitsTable_colCheck'></th>" +
                                "<th class='OMposAssign_orgUnitsTable_colPosition'>" + global.getLabel('position') + "</th>" +
                                "<th class='OMposAssign_orgUnitsTable_colRelation'>" + global.getLabel('relation') + "</th>" +
                                "<th class='OMposAssign_orgUnitsTable_colOrgUnit'>" + global.getLabel('ORGEH') + "</th>" +
                                "<th class='OMposAssign_orgUnitsTable_colDates'>" + global.getLabel('valDate') + "</th>" +
                            "</tr>" +
                        "</thead>" +
                        "<tbody id='OMposAssign_orgUnitsTable_body'></tbody>" +
                    "</table>";
        this.htmlContent.down('div#OMposAssign_orgUnits').insert(table);
        this.htmlContent.down('table#OMposAssign_orgUnitsTable').addClassName('OMposAssign_hidden');
        var actions = "<span id='OMposAssign_actions_noResults' class='application_main_text OMposAssign_hidden'></span>" +
                      "<span id='OMposAssign_actions_delete' class='OM_MaintHolder_link application_main_soft_text OMposAssign_shown'>" + global.getLabel('delete') + "</span>" +
                      "<span id='OMposAssign_actions_delimit' class='OM_MaintHolder_link application_main_soft_text OMposAssign_shown'>" + global.getLabel('delimit') + "</span>" +
                      "<span id='OMposAssign_actions_create' class='application_action_link OMposAssign_shown'>" + global.getLabel('create') + "</span>";
        this.htmlContent.down('div#OMposAssign_actions').insert(actions);
        this.htmlContent.down('span#OMposAssign_actions_create').observe('click', this._showEmptyInfo.bind(this));
        TableKit.Sortable.init(this.htmlContent.down('table#OMposAssign_orgUnitsTable'), {});
        TableKit.options.autoLoad = false;
        var json = {
                   elements:[]
        };
        var auxExit =   {
                idButton:'OMposAssign_button_exit',
                className:'OMposAssign_button',
                label: global.getLabel('exit'),
                handlerContext: null,
                handler: this._goBack.bind(this,''),
                type: 'button',
                standardButton:true
        };                 
        json.elements.push(auxExit); 
        var auxCancel =   {
                idButton:'OMposAssign_button_cancel',
                className:'OMposAssign_button OMposAssign_hidden',
                label: global.getLabel('cancel'),
                handlerContext: null,
                handler: this._hideDetails.bind(this,''),
                type: 'button',
                standardButton:true
        }; 
        json.elements.push(auxCancel);  
        var auxSave =   {
                idButton:'OMposAssign_button_save',
                className:'OMposAssign_button OMposAssign_hidden',
                label: global.getLabel('save'),
                handlerContext: null,
                handler: "",
                type: 'button',
                standardButton:true
        }; 
        json.elements.push(auxSave);  
        this.ButtonOMposAssign=new megaButtonDisplayer(json);
        this.htmlContent.down('div#OMposAssign_buttons').insert(this.ButtonOMposAssign.getButtons());
        var details = "<div id='OMposAssign_details_title' class='application_main_title'>" + global.getLabel('detailPA') + "</div>" +
                      "<div class='OMposAssign_details_label'>" + global.getLabel('position') + "</div>" +
                      "<div id='OMposAssign_details_position' class='OMposAssign_details_value'>" + "-" + "</div>" +
                      "<div class='OMposAssign_details_label'>" + global.getLabel('relation') + "</div>" +
                      "<div id='OMposAssign_details_relation' class='OMposAssign_details_autocompleters'></div>" +
                      "<div class='OMposAssign_details_label'>" + global.getLabel('ORGEH') + "</div>" +
                      "<div id='OMposAssign_details_orgUnit' class='OMposAssign_details_autocompleters'></div>";
        this.htmlContent.down('div#OMposAssign_details').insert(details);
        var json = { 
            autocompleter: {
                object:[],
                multilanguage:{
                    no_results: global.getLabel('noResults'),
                    search: global.getLabel('search')
                }
            }
        }
        this.orgUnitAutocompleter = new JSONAutocompleter('OMposAssign_details_orgUnit', {
            showEverythingOnButtonClick: true,
            timeout: 1000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1,
            noFilter: true,
            events: $H({onGetNewXml: 'EWS:autocompleter_getNewXML',
                        onResultSelected: 'EWS:autocompleter_resultSelected'})
        }, json);
        // Arrow in autocompleter
        this.htmlContent.down('input#button_OMposAssign_details_orgUnit').observe('click', function() {
            this.orgUnitAutocompleter.clearInput();
        }.bind(this));
        this._getRelationsAutocompleter();
    },
    /**
     *@description Asks the backend for org. units' info (table)
     *@param {String} id Position ID
     *@param {Boolean} noInfo Says if it is the first time we call the service
     */
    _getOrgUnits: function(id, noInfo) {
        var xml = "<EWS><SERVICE>" + this.maintAssignService + "</SERVICE>" +
                  "<OBJECT TYPE='S'>" + id + "</OBJECT>" +
                  "<PARAM>" +
                      "<O_ACTION>V</O_ACTION>" +
                      "<O_RELATIONS>" +
                          "<YGLUI_TAB_RELATIONS sclas='O' />" +
                      "</O_RELATIONS>" +
                  "</PARAM></EWS>";
        if (noInfo)
            this.makeAJAXrequest($H({xml:xml, successMethod:'_showOrgUnits', ajaxID: id}));
        else
            this.makeAJAXrequest($H({xml:xml, successMethod:'_showOrgUnits', informationMethod:'_noOrgUnits', ajaxID: id}));
    },
    /**
     *@description Shows org. units' information in the table
     *@param {JSON} json Object from the backend
     */
    _showOrgUnits: function(json) {
        var orgUnits = objectToArray(json.EWS.o_result.yglui_tab_relations_output);
        var html = "";
        var json = { 
            autocompleter: {
                object:[],
                multilanguage:{
                    no_results: global.getLabel('noResults'),
                    search: global.getLabel('search')
                }
            }
        }
        this.orgUnitsInfo = new Hash();
        for (var i = 0; i < orgUnits.length; i++) {
            var begda = Date.parseExact(orgUnits[i]['@begda'], this.dateFormatIn).toString(this.dateFormatOut);
            var endda = Date.parseExact(orgUnits[i]['@endda'], this.dateFormatIn).toString(this.dateFormatOut);
            var orgUnitId = orgUnits[i]['@sobid'];
            var orgName = Object.isEmpty(orgUnits[i]['@stext_dest']) ? "" : orgUnits[i]['@stext_dest'];
            var positionName = Object.isEmpty(orgUnits[i]['@stext_orig']) ? "" : orgUnits[i]['@stext_orig'];
            var relation = orgUnits[i]['@rtext'];
            var relationId = orgUnits[i]['@relat'];
            html += "<tr>" +
                        "<td class='OMposAssign_orgUnitsTable_colCheck OMposAssign_orgUnitsTable_textCells'><input id='OMposAssign_check_" + orgUnitId + "_" + relationId + "' type='checkbox' value='" + orgUnitId + "_" + relationId + "' /></td>" +
                        "<td class='OMposAssign_orgUnitsTable_colPosition'><div class='OMposAssign_orgUnitsTable_textCells'>" + positionName + " [" + this.position + "]</div></td>" +
                        "<td class='OMposAssign_orgUnitsTable_colRelation'><div class='OMposAssign_orgUnitsTable_textCells'>" + relation + "</div></td>" +
                        "<td class='OMposAssign_orgUnitsTable_colOrgUnit'><div id='OMposAssign_link_" + orgUnitId + "_" + relationId + "' class='application_action_link OMposAssign_orgUnitsTable_textCells'>" + orgName + "</div></td>" +
                        "<td class='OMposAssign_orgUnitsTable_colDates'><div class='OMposAssign_orgUnitsTable_textCells'>" + begda + " - " + endda + "</div></td>" +
                    "</tr>";
            if (i == 0)
                this.htmlContent.down('div#OMposAssign_details_position').update(positionName + " [" + this.position + "]");
            json.autocompleter.object.push({
                data: orgUnitId,
                text: orgName
            });
            this.orgUnitsInfo.set(orgUnitId + "_" + relationId, {begda: begda, endda: endda});
        }
        this.htmlContent.down('tbody#OMposAssign_orgUnitsTable_body').update(html);
        for (var i = 0; i < orgUnits.length; i++) {
            var orgUnitId = orgUnits[i]['@sobid'];
            var relationId = orgUnits[i]['@relat'];
            this.htmlContent.down('div#OMposAssign_link_' + orgUnitId + '_' + relationId).observe('click', this._showOrgUnitInfo.bind(this, orgUnitId, relationId));
            this.htmlContent.down('input#OMposAssign_check_' + orgUnitId + '_' + relationId).observe('click', this._checkInputs.bind(this, orgUnitId, relationId));
        }
        this.orgUnitAutocompleter.updateInput(json);
        this.lastOrgUnits = json;
        TableKit.reloadTable(this.htmlContent.down('table#OMposAssign_orgUnitsTable'));
        if (this.htmlContent.down('span#OMposAssign_actions_create').hasClassName('OMposAssign_hidden')) {
            this.htmlContent.down('table#OMposAssign_orgUnitsTable').removeClassName('OMposAssign_hidden');
            this.htmlContent.down('table#OMposAssign_orgUnitsTable').addClassName('OMposAssign_shown');
            this.htmlContent.down('span#OMposAssign_actions_delete').removeClassName('OMposAssign_hidden');
            this.htmlContent.down('span#OMposAssign_actions_delete').addClassName('OMposAssign_shown');
            this.htmlContent.down('span#OMposAssign_actions_delimit').removeClassName('OMposAssign_hidden');
            this.htmlContent.down('span#OMposAssign_actions_delimit').addClassName('OMposAssign_shown');
            this.htmlContent.down('span#OMposAssign_actions_create').removeClassName('OMposAssign_hidden');
            this.htmlContent.down('span#OMposAssign_actions_create').addClassName('OMposAssign_shown');
            this.htmlContent.down('span#OMposAssign_actions_noResults').removeClassName('OMposAssign_shown');
            this.htmlContent.down('span#OMposAssign_actions_noResults').addClassName('OMposAssign_hidden');
        }
    },
    /**
     *@description Shows an information message when there are no org. units' information returned
     *@param {JSON} json Object from the backend
     */
    _noOrgUnits: function(json) {
        //this._infoMethod(json);
        this.htmlContent.down('span#OMposAssign_actions_noResults').update("<br />" + json.EWS.webmessage_text);
        if (this.htmlContent.down('span#OMposAssign_actions_create').hasClassName('OMposAssign_shown')) {
            this.htmlContent.down('table#OMposAssign_orgUnitsTable').removeClassName('OMposAssign_shown');
            this.htmlContent.down('table#OMposAssign_orgUnitsTable').addClassName('OMposAssign_hidden');
            this.htmlContent.down('span#OMposAssign_actions_delete').removeClassName('OMposAssign_shown');
            this.htmlContent.down('span#OMposAssign_actions_delete').addClassName('OMposAssign_hidden');
            this.htmlContent.down('span#OMposAssign_actions_delimit').removeClassName('OMposAssign_shown');
            this.htmlContent.down('span#OMposAssign_actions_delimit').addClassName('OMposAssign_hidden');
            this.htmlContent.down('span#OMposAssign_actions_create').removeClassName('OMposAssign_shown');
            this.htmlContent.down('span#OMposAssign_actions_create').addClassName('OMposAssign_hidden');
            this.htmlContent.down('span#OMposAssign_actions_noResults').removeClassName('OMposAssign_hidden');
            this.htmlContent.down('span#OMposAssign_actions_noResults').addClassName('OMposAssign_shown');
        }
    },
    /**
     *@description Shows an org. unit's info
     *@param {String} id Org. Unit's ID
     *@param {String} relationId Relation's ID
     */
    _showOrgUnitInfo: function(id, relationId) {
        this._showDetails();
        this.relationAutocompleter.enable();
        if (!Object.isEmpty(this.lastOrgUnits))
            this.orgUnitAutocompleter.updateInput(this.lastOrgUnits);
        // 1st parameter: default value
        // 2nd parameter: true -> text, false -> data
        // 3rd parameter: false -> no event thrown
        this.orgUnitAutocompleter.setDefaultValue(id, false, false);
        this.relationAutocompleter.setDefaultValue(relationId, false, false);
        // We can't edit "Belong to" relationships
        if (relationId == '003')
            this.relationAutocompleter.disable();  
        this.ButtonOMposAssign.updateHandler('OMposAssign_button_save', this._changeDetails.bind(this, id, relationId));
    },
    /**
     *@description Returns to OM_Maintain application
     */
    _goBack: function() {
        document.fire("EWS:openApplication", $H({app: 'OM_Maintain', refresh: true}));
    },
    /**
     *@description Sets the value of the org. units autocompleter's text as parameter for refreshing the autocompleter's list
     */
    _setSearchText: function() {
        this.orgUnitAutocompleterValue = this.orgUnitAutocompleter.element.value;
        this.orgUnitAutocompleterDefaultValue = this.orgUnitAutocompleter.element.value;
        // Service restriction
        if (this.orgUnitAutocompleterValue.length > 12)
            this.orgUnitAutocompleterValue = this.orgUnitAutocompleterValue.substring(0,12);
        this._callToGetOptionsSearch();
    },
    /**
     *@description Asks the backend for position's org. units (autocompleter)
     */ 
    _callToGetOptionsSearch: function() {
        if (Object.isEmpty(this.orgUnitAutocompleterValue)) {
            this.orgUnitAutocompleterValue = '*';
        }
        var date = Date.today().toString(this.dateFormatIn);
        // Call to the service
        var xml = "<EWS>" +
                      "<SERVICE>" + this.searchObjectsService + "</SERVICE>" +
                      "<PARAM>" +
                          "<ORG_UNIT>Y</ORG_UNIT>" +
                          "<POSITION>N</POSITION>" +
                          "<COSTCENT>N</COSTCENT>" +
                          "<PERSON>N</PERSON>" +
                          "<O_BEGDA>" + date + "</O_BEGDA>" +
                          "<O_ENDDA>" + date + "</O_ENDDA>" +
                          "<TEXT>" + this.orgUnitAutocompleterValue + "</TEXT>" +
                          "<MAX>20</MAX>" +
                      "</PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({xml:xml, successMethod:'_buildAutocompleterJSON'}));
    },
    /**
     *@description Fills the org. units autocompleter
     *@param {JSON} jsonObject Object from the backend
     */
    _buildAutocompleterJSON: function(jsonObject) {
        this.hashAC = $H({});
        var json = { 
            autocompleter: {
                object:[],
                multilanguage:{
                    no_results: global.getLabel('noResults'),
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
                var text = Object.isEmpty(array[i]["@stext"]) ? array[i]["@short"] : array[i]["@stext"];
                var bDate = array[i]["@begda"];
                var eDate = array[i]["@endda"];
                this.hashAC.set(idObject, {type:type, idObject:idObject, text:text, bDate:bDate, eDate:eDate});
            }
            this.hashAC.each(function(pair){
                var text = Object.isEmpty(pair.value['text']) ? "" : pair.value['text'];
                json.autocompleter.object.push({
                    data: pair.key,
                    text: text
                });
            });
        }
        this.orgUnitAutocompleter.updateInput(json);
        this.orgUnitAutocompleter.setDefaultValue(this.orgUnitAutocompleterDefaultValue,true,false);
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
            var orgUnitId = elementChosen.idObject;
            this.orgUnitAutocompleterValue = elementChosen.text;
        }
        else
            this.orgUnitAutocompleterValue = "";
    },
    /**
     *@description Shows details
     */
    _showDetails: function() {
        if(this.htmlContent.down('div#OMposAssign_details').hasClassName('OMposAssign_hidden')) {
            this.htmlContent.down('div#OMposAssign_details').removeClassName('OMposAssign_hidden');
            this.htmlContent.down('div#OMposAssign_details').addClassName('OMposAssign_shown');
            this.htmlContent.down('div#OMposAssign_button_cancel').removeClassName('OMposAssign_hidden');
            this.htmlContent.down('div#OMposAssign_button_cancel').addClassName('OMposAssign_shown');
            this.htmlContent.down('div#OMposAssign_button_save').removeClassName('OMposAssign_hidden');
            this.htmlContent.down('div#OMposAssign_button_save').addClassName('OMposAssign_shown');
            this.htmlContent.down('div#OMposAssign_button_exit').removeClassName('OMposAssign_shown');
            this.htmlContent.down('div#OMposAssign_button_exit').addClassName('OMposAssign_hidden');
        }
    },
    /**
     *@description Hides details
     */
    _hideDetails: function() {
        if(this.htmlContent.down('div#OMposAssign_details').hasClassName('OMposAssign_shown')) {
            this.htmlContent.down('div#OMposAssign_details').removeClassName('OMposAssign_shown');
            this.htmlContent.down('div#OMposAssign_details').addClassName('OMposAssign_hidden');
            this.htmlContent.down('div#OMposAssign_button_cancel').removeClassName('OMposAssign_shown');
            this.htmlContent.down('div#OMposAssign_button_cancel').addClassName('OMposAssign_hidden');
            this.htmlContent.down('div#OMposAssign_button_save').removeClassName('OMposAssign_shown');
            this.htmlContent.down('div#OMposAssign_button_save').addClassName('OMposAssign_hidden');
            this.htmlContent.down('div#OMposAssign_button_exit').removeClassName('OMposAssign_hidden');
            this.htmlContent.down('div#OMposAssign_button_exit').addClassName('OMposAssign_shown');
        }
    },
    /**
     *@description Asks the backend for relations (autocompleter)
     */ 
    _getRelationsAutocompleter: function() {
        var date = Date.today().toString(this.dateFormatIn);
        var xml = "<EWS><SERVICE>" + this.getRelationsService + "</SERVICE><PARAM>" +
                      "<o_date>" + date + "</o_date>" +
                      "<O_ROOT>S</O_ROOT>" +
                      "<O_DEST>O</O_DEST>" +
                  "</PARAM></EWS>";
        this.makeAJAXrequest($H({xml:xml, successMethod:'_buildRelationsAutocompleter'}));
    },
    /**
     *@description Fills the relations autocompleter
     *@param {JSON} jsonObject Object from the backend
     */
    _buildRelationsAutocompleter: function(jsonObject) {
        var json = { 
            autocompleter: {
                object:[],
                multilanguage:{
                    no_results: global.getLabel('noResults'),
                    search: global.getLabel('search')
                }
            }
        }
        // If we receive a json with results..
        if (jsonObject.EWS.o_relationships) {
            var array = objectToArray(jsonObject.EWS.o_relationships.yglui_tab_relationships);
            for(var i = 0; i < array.length; i++){
                json.autocompleter.object.push({
                    data: array[i]['@relat'],
                    text: array[i]['@rtext']
                });
            }
        }
        // Autocompleter creation
        this.relationAutocompleter = new JSONAutocompleter('OMposAssign_details_relation', {
            showEverythingOnButtonClick: true,
            timeout: 1000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1
        }, json);
        // Now we can get org. units' table (first time: we add the second parameter)
        this._getOrgUnits(this.position, true);
    },
    /**
     *@description Changes a position assignment
     *@param {String} id Selected org. unit's ID
     *@param {String} relationId Selected relation's ID
     */ 
    _changeDetails: function(id, relationId) {
        var relat = "";
        if (!Object.isEmpty(this.relationAutocompleter.lastSelected))
            relat = this.relationAutocompleter.options.array[this.relationAutocompleter.lastSelected].get('data');
        var relat_old = relationId;
        var begda = Date.today().toString(this.dateFormatIn);
        var endda = "9999-12-31";
        var begda_old = Date.parseExact(this.orgUnitsInfo.get(id + '_' + relationId).begda, this.dateFormatOut).toString(this.dateFormatIn);
        var endda_old = Date.parseExact(this.orgUnitsInfo.get(id + '_' + relationId).endda, this.dateFormatOut).toString(this.dateFormatIn);
        var sobid = this.position;
        var sobid_new = "";
        if (!Object.isEmpty(this.orgUnitAutocompleter.lastSelected))
            sobid_new = this.orgUnitAutocompleter.options.array[this.orgUnitAutocompleter.lastSelected].get('data');
        var xml = "<EWS><SERVICE>" + this.maintAssignService + "</SERVICE>" +
                  "<OBJECT TYPE='O'>" + id + "</OBJECT>" +
                  "<PARAM>" +
                      "<O_ACTION>U</O_ACTION>" +
                      "<O_RELATIONS>" +
                          "<YGLUI_TAB_RELATIONS rsign='B' relat='" + relat + "' rsign_old='B' relat_old='" + relat_old + "' " +
                          "begda='" + begda +"' endda='" + endda + "' begda_old='" + begda_old + "' endda_old='" + endda_old + "' " +
                          "sclas='S' sobid='" + sobid + "' sclas_new='O' sobid_new='" + sobid_new + "' sclas_old='O' sobid_old='" + id + "' />" +
                      "</O_RELATIONS>" +
                  "</PARAM></EWS>";
        this.makeAJAXrequest($H({xml:xml, successMethod:'_refreshInfo', ajaxID: sobid}));
    },
    /**
     *@description Updates the screen
     *@param {JSON} json Object from the backend
     *@param {String} id Position ID
     */ 
    _refreshInfo: function(json, posId) {
        this._hideDetails();
        this._getOrgUnits(posId);
    },
    /**
     *@description Shows empty fields to create an assignment
     */
    _showEmptyInfo: function() {
        this._showDetails();
        this.orgUnitAutocompleter.clearInput();
        this.relationAutocompleter.clearInput();
        this.relationAutocompleter.enable();
        this.ButtonOMposAssign.updateHandler('OMposAssign_button_save', this._newAssignment.bind(this));
    },
    /**
     *@description Creates a position assignment
     */ 
    _newAssignment: function() {
        var relat = "";
        if (!Object.isEmpty(this.relationAutocompleter.lastSelected))
            relat = this.relationAutocompleter.options.array[this.relationAutocompleter.lastSelected].get('data');
        var begda = Date.today().toString(this.dateFormatIn);
        var endda = "9999-12-31";
        var sobid = this.position;
        var sobid_new = "";
        if (!Object.isEmpty(this.orgUnitAutocompleter.lastSelected))
            sobid_new = this.orgUnitAutocompleter.options.array[this.orgUnitAutocompleter.lastSelected].get('data');
        var xml = "<EWS><SERVICE>" + this.maintAssignService + "</SERVICE>" +
                  "<OBJECT TYPE='S'>" + sobid + "</OBJECT>" +
                  "<PARAM>" +
                      "<O_ACTION>C</O_ACTION>" +
                      "<O_RELATIONS>" +
                          "<YGLUI_TAB_RELATIONS rsign='B' relat='" + relat + "' " +
                          "begda='" + begda +"' endda='" + endda + "' " +
                          "sclas='S' sobid='" + sobid + "' sclas_new='O' sobid_new='" + sobid_new + "' />" +
                      "</O_RELATIONS>" +
                  "</PARAM></EWS>";
        this.makeAJAXrequest($H({xml:xml, successMethod:'_refreshInfo', ajaxID: sobid}));
    },
    /**
     *@description Updates the selected checkboxes' list
     *@param {String} id Org. unit ID
     *@param {String} relationId Relation's ID
     */ 
    _checkInputs: function(id, relationId) {
        if (id && relationId) {
            if (this.htmlContent.down('input#OMposAssign_check_' + id + '_' + relationId).checked)
                this.selectedRows.push(id + '_' + relationId);
            else
                this.selectedRows = this.selectedRows.without(id + '_' + relationId);
        }
        // Delimit
        if (this.selectedRows.length == 1) {
            this.htmlContent.down('span#OMposAssign_actions_delimit').removeClassName('OM_MaintHolder_link application_main_soft_text');
            this.htmlContent.down('span#OMposAssign_actions_delimit').addClassName('application_action_link');
            this.htmlContent.down('span#OMposAssign_actions_delimit').observe('click', this._deleteDelimitAssignment.bind(this, 'L'));
        }
        else {
            this.htmlContent.down('span#OMposAssign_actions_delimit').removeClassName('application_action_link');
            this.htmlContent.down('span#OMposAssign_actions_delimit').addClassName('OM_MaintHolder_link application_main_soft_text');
            this.htmlContent.down('span#OMposAssign_actions_delimit').stopObserving();
        }
        // Delete
        if (this.selectedRows.length > 0) {
            this.htmlContent.down('span#OMposAssign_actions_delete').removeClassName('OM_MaintHolder_link application_main_soft_text');
            this.htmlContent.down('span#OMposAssign_actions_delete').addClassName('application_action_link');
            this.htmlContent.down('span#OMposAssign_actions_delete').stopObserving();
            this.htmlContent.down('span#OMposAssign_actions_delete').observe('click', this._deleteDelimitAssignment.bind(this, 'D'));
        }
        else {
            this.htmlContent.down('span#OMposAssign_actions_delete').removeClassName('application_action_link');
            this.htmlContent.down('span#OMposAssign_actions_delete').addClassName('OM_MaintHolder_link application_main_soft_text');
            this.htmlContent.down('span#OMposAssign_actions_delete').stopObserving();
        }
    },
    /**
     *@description Delimits/Deletes a position assignment
     *@param {String} action Deletion ('D') or delimitation ('L')
     */ 
    _deleteDelimitAssignment: function(action) {
        var hashToSend = new Hash();
        for(var i = 0; i < this.selectedRows.length; i++) {
            var relationId = this.selectedRows[i].split('_')[1];
            var orgUnitId = this.selectedRows[i].split('_')[0];
            var begda = Date.parseExact(this.orgUnitsInfo.get(orgUnitId + '_' + relationId).begda, this.dateFormatOut).toString(this.dateFormatIn);
            var endda = Date.parseExact(this.orgUnitsInfo.get(orgUnitId + '_' + relationId).endda, this.dateFormatOut).toString(this.dateFormatIn);
            hashToSend.set(i, {begDate: begda, endDate: endda, relat: relationId, idToAssign: orgUnitId, rsign: 'A', sclas: 'O'});
        }
        document.fire("EWS:openApplication", $H({mode: 'popUp', app: 'OM_DeleteDelimit', appToOpen: 'OM_PosAssign', action: action, node: this.position, objectType: 'S', hash: hashToSend}));
    }
});

var OM_PosAssign = Class.create(OM_PosAssign_standard, {
    initialize: function($super){
        $super('OM_PosAssign');
    },
    run: function($super, args){
        $super(args);
    },
    close: function($super){
        $super();
    }
});