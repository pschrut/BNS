/**
 *@fileOverview PCR_Overview.js
 *@description It contains the PCR overview class and its methods
 */
/**
 *@constructor
 *@description Class with general functionality for the PCR Overview class
 *@augments Application
 */
var PCR_overview = Class.create(Application,
/**
*@lends PCR_Overview
*/
{
/** 
* Service used to get the widgets
* @type String
*/
widgetsService: 'GET_WIDGETS',
/** 
* Service used to get the wizards
* @type String
*/
wizardsService: 'GET_WIZARDS',
/** 
* Service used to get the pending requests
* @type String
*/
pendReqService: 'PEND_REQ_STAT',
/** 
* Service used to save a step, or a PCR
* @type String
*/
saveService: 'SAVE_REQUEST',
/**
* Property to know if the table with planned requests have been shown already
* @type Boolean
*/
tablePlannedShowed: false,
/**
* Property to know if the table with pending requests have been shown already
* @type Boolean
*/
tablePendingShowed: false,
/**
*@param $super The superclass (PCR_Overview)
*@param args The app
*@description Instantiates the app
*/
initialize: function($super, args) {
    $super(args);
    this.widgetsReadyBinding = this.widgetsReady.bind(this);
    this.showHideDetailsBinding = this.showHideDetails.bind(this);
},
/**
* @param args The app
* @param $super The superclass run method
* @description Executes the super class run method    
*/
run: function($super, args) {
    this.dateFormat = global.dateFormat;
    this.tabId = this.options.tabId;
    $super(args);
    if (this.firstRun) {
        this.virtualHtml.insert(new Element('div', { 'id': 'PCR_widgets', 'class': 'PFM_widgetsDiv' }));
    } else
        this.loadWidgets();
    //observers
    document.observe('PFM:PCR_overviewWidgetsReady', this.widgetsReadyBinding);
    document.observe('EWS:PCR_showDetails', this.showHideDetailsBinding);

},
/**   
*@description Method which call the GetWidgets module
*/
loadWidgets: function() {

    if (this.widgetsStructure == null && (this.firstRun)) {
        this.widgetsStructure = new GetWidgets({
            eventName: 'PFM:PCR_overviewWidgetsReady',
            service: this.widgetsService,
            tabId: this.tabId,
            objectType: 'P',
            objectId: this.empId,
            target: this.virtualHtml.down('div#PCR_widgets')
        });
    }
    else if (!Object.isEmpty(this.virtualHtml) && !Object.isEmpty(this.widgetsStructure)) { //&& !Object.isEmpty(this.widgetsStructure.virtualHtml)
        this.widgetsStructure.reloadWidgets({
            objectType: 'P',
            objectId: this.empId
        });
        this.virtualHtml.down('div#PCR_widgets').show();

    }
},
/**  
*@param event The event 'PCR_overviewWidgetsReady'
*@description When the event is launched, meaning that we have received the widgets, we start working with them
*/
widgetsReady: function(event) {

    // get the type of the widget
    var tempType = '';
    var data = this.widgetsStructure.widgetsInfo;
    data.each(function(pair) {
        if (pair[1].type == 'PCR_OVER') {
            tempType = pair[0];
        }
    } .bind(this));

    //create a widget structure to manage them
    this.hashOfWidgets = this.widgetsStructure.widgets;
    this.hashOfWidgets.each(function(widget) {
        widget.value.setTitle(global.getLabel(widget.key));
        // fill in the widgets
        if (widget[0] == tempType)
        //Overview widget
            this.callToGetWizard(widget.key);
        else
        //pending & drats widgets
            this.callToGetPendReq(widget.key);

    } .bind(this));
},
/**  
*@param appId The appId of a certaing widget
*@description Calls SAP to get the pending requests
*/
callToGetPendReq: function(appId) {
    //calculate status
    var status = '';
    switch (appId) {
        //status = 10                      
        case 'PCR_PLAN':
            status = '';
            break;
        //status = 20 / 21 / 90                      
        case 'PCR_PEND':
            status = 'X';
            break;
    }
    //create xml_in and call SAP
    var xml = "<EWS>"
                    + "<SERVICE>" + this.pendReqService + "</SERVICE>"
                    + "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>"
                    + "<PARAM>"
                        + "<I_STATUS>" + status + "</I_STATUS>"
                        + "<I_APPID>" + appId + "</I_APPID>"
                    + "</PARAM>"
                    + "<DEL/>"
                + "</EWS>";
    this.makeAJAXrequest($H({
        xml: xml,
        successMethod: this.choosePendReqStat.bind(this, appId, this.empId)
    }));

},
/**  
*@param appId The appId of a certaing widget
*@param json The json with the content of a widget
*@description Decides how to fill a pend_req_stat widget
*/
choosePendReqStat: function(appId, empId, json) {
    //drafts & planned
    if (appId == 'PCR_PLAN')
        this.drawWidgetPlannedReq(appId, empId, json);
    //pending & history
    else if (appId == 'PCR_PEND')
        this.drawWidgetPendingReq(appId, empId, json);
},
/**  
*@param appId The appId of the PlannedReq widget 
*@param json The json with the content of the PlannedReq widget 
*@description Creates the content of the PlannedReq widget, with legend and searchable table
*/
drawWidgetPlannedReq: function(appId, empId, json) {
    if (!Object.isEmpty(json.EWS.o_button)) {
        this.cancelButton = json.EWS.o_button.yglui_str_wid_button;
    }
    if (empId != this.empId)
        return;
    //div with legend and table        
    var widgetContent = new Element('div', {
        'id': 'pcr_plannedContent_' + appId
    });  //.insert("<div id='pcr_planned_legend' class='PCR_rows'></div>" )

    //first, we draw the table structure
    var tableContainer = new Element('div', {
        'id': 'pcr_tableContainer_' + appId
    });
    var table = "<table id='pcr_plannedReq_" + appId + "' class='sortable pdcPendReq_table'>" +
            "<thead class='applicationmyData_headerContainer'>" +
            "<tr>" +
            "<th class='table_sortfirstdesc application_main_text' >" + global.getLabel('action') + "</th>" +
            "<th class='application_main_text' >" + global.getLabel('type') + "</th>" +
    //"<th class='application_main_text' >" + global.getLabel('dueDate') + "</th>" +
            "</tr>" +
            "</thead>" +
            "<tbody id='pcr_plannedReq_body'></tbody>" +
            "</table>";
    //insert it in the widget            
    this.hashOfWidgets.get(appId).setContent(widgetContent);
    tableContainer.insert(table);
    widgetContent.insert(tableContainer);
    //insert legend
    //this.drawLegendPart('pcr_planned_legend');             
    //now we fill it with information
    if (!Object.isEmpty(json.EWS.o_records))
        var recordsArray = objectToArray(json.EWS.o_records.yglui_str_pend_req);
    else
        var recordsArray = $A();
    var body = '';
    for (var i = 0; i < recordsArray.length; i++) {
        //get the info
        requestId = recordsArray[i]['@req_id'];
        objId = recordsArray[i]['@objid'];
        requestAppId = recordsArray[i]['@appid'];
        date = recordsArray[i]['@datum'];
        datum = Date.parseExact(date, 'yyyy-MM-dd').toString(this.dateFormat);
        action = recordsArray[i]['@appid'];
        var status = recordsArray[i]['@status'];
        var tartb;
        var views;
        for (var d = 0; d < json.EWS.o_button.yglui_str_wid_button.length; d++) {
            if (json.EWS.o_button.yglui_str_wid_button[d]['@action'] == "REC_OPENWIZARD") {
                views = json.EWS.o_button.yglui_str_wid_button[d]['@views'];
                tartb = json.EWS.o_button.yglui_str_wid_button[d]['@tartb'];
            }
        }
        //build the row
        if (!Object.isEmpty(this.cancelButton)) {
            body += "<tr id='row_" + requestId + '_' + requestAppId + "'>" +
                        "<td><div class='application_currentSelection PCR_overview_cross'></div><span id='link_" + requestId + '_' + requestAppId + "' class='application_action_link' onClick='javascript:global.open($H({app: { appId: \"" + requestAppId + "\",tabId: " + tartb + ",view: \"" + views + "\"},wizardId:\"" + requestAppId + "\",empId:\"" + objId + "\" ,requestId:\"" + requestId + "\",leftMenuId:\"" + this.empId + "\" ,comingFrom:\"Drafts\"}))'>" + global.getLabel(action) + "</span></td>";
        }
        else {
            body += "<tr id='row_" + requestId + '_' + requestAppId + "'>" +
                        "<td><span id='link_" + requestId + '_' + requestAppId + "' class='application_action_link' onClick='javascript:global.open($H({app: { appId: \"" + requestAppId + "\",tabId: \"" + tartb + "\",view: \"" + views + "\"}, wizardId:\"" + requestAppId + "\",empId:\"" + objId + "\" ,requestId:\"" + requestId + "\",leftMenuId:\"" + this.empId + "\" ,comingFrom:\"Drafts\"}))'>" + global.getLabel(action) + "</span></td>";
        }
        if (status == '10') {
            //Drafts
            body += "<td><span title='" + global.getLabel('draft') + "' class='application_inProgress_training_icon_curr_div pcr_iconColumn'></span><span class='OMposAssign_hidden'>10</span></td>";
        }
        /* Planned actions, not for this release
        else if (status == '¿¿??') {
        body += "<td><span class='application_icon_red pcr_iconColumn'></span></td>";
        } 
        */
        else {
            body += "<td></td>";
        }
        //body += "<td class='application_main_text'>" + datum + "</td>";
        body += "</tr>";

    }
    //insert the body in the table
    this.virtualHtml.down('[id=pcr_plannedReq_body]').update(body);
    if (!Object.isEmpty(this.cancelButton)) {
        var crossArray = this.virtualHtml.select('.PCR_overview_cross');
        for (var i = 0; i < crossArray.length; i++) {
            crossArray[i].observe('click', this.deleteRequestConfirmation.bind(this, recordsArray[i]['@req_id'], recordsArray[i]['@appid']));
        }
    }
    //instantiate the tablekit with search  
    if (!this.tablePlannedShowed) {
        this.tablePlannedShowed = true;

        this.tablePlannedObject = new tableKitWithSearch(this.virtualHtml.down('table#pcr_plannedReq_' + appId), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
    } else {
        this.tablePlannedObject.reloadTable(this.virtualHtml.down('table#pcr_plannedReq_' + appId));
    }
},

deleteRequestConfirmation: function(reqId, appId) {
    var _this = this;
    var contentHTML = new Element('div', { 'class': 'PCR_cancel_popUp' });
    contentHTML.insert("<div class='moduleInfoPopUp_std_leftMargin'>" + global.getLabel('deleteRequest') + "</div>");
    //buttons
    var buttonsJson = {
        elements: [],
        mainClass: 'moduleInfoPopUp_stdButton_div_left'
    };
    var callBack = function() {
        cancelPCRPopUp.close();
        delete cancelPCRPopUp;

    };
    var callBack2 = function() {
        if (_this)
            _this.deleteRequest(reqId, appId);
        cancelPCRPopUp.close();
        delete cancelPCRPopUp;
    };
    var aux2 = {
        idButton: 'Yes',
        label: global.getLabel('yes'),
        handlerContext: null,
        className: 'moduleInfoPopUp_stdButton',
        handler: callBack2,
        type: 'button',
        standardButton: true
    };
    var aux3 = {
        idButton: 'No',
        label: global.getLabel('no'),
        handlerContext: null,
        className: 'moduleInfoPopUp_stdButton',
        handler: callBack,
        type: 'button',
        standardButton: true
    };
    buttonsJson.elements.push(aux2);
    buttonsJson.elements.push(aux3);
    var ButtonObj = new megaButtonDisplayer(buttonsJson);
    var buttons = ButtonObj.getButtons();
    //insert buttons in div
    contentHTML.insert(buttons);

    var cancelPCRPopUp = new infoPopUp({
        closeButton: $H({
            'textContent': 'Close',
            'callBack': function() {
                cancelPCRPopUp.close();
                delete cancelPCRPopUp;
            }
        }),
        htmlContent: contentHTML,
        indicatorIcon: 'information',
        width: 350
    });
    cancelPCRPopUp.create();
},

deleteRequest: function(reqId, appId) {
    var jsonSave = {
        EWS: {
            SERVICE: this.saveService,
            OBJECT: { '@TYPE': 'P',
                '#text': this.empId
            },
            PARAM: {
                REQ_ID: reqId,
                APPID: appId,
                BUTTON: this.cancelButton
            }
        }
    };

    var json2xml = new XML.ObjTree();
    json2xml.attr_prefix = '@';
    this.makeAJAXrequest($H({
        xml: json2xml.writeXML(jsonSave),
        successMethod: this.processCallToSave.bind(this)
    }));
},

processCallToSave: function(json) {
    this.callToGetPendReq('PCR_PLAN');
},
/**  
*@param appId The appId of the PendingReq widget 
*@param json The json with the content of PendingReq the widget 
*@description Creates the content of the PendingReq widget, with legend and searchable table
*/
drawWidgetPendingReq: function(appId, empId, json) {
    if (empId != this.empId)
        return;
    //div with legend and table
    var widgetContent = new Element('div', {
        'id': 'pcr_pendingContent_' + appId
    }).insert("<div id='pcr_pending_legend' class='PCR_rows'></div>");
    //first, we draw the table structure
    var tableContainer = new Element('div', {
        'id': 'pcr_tableContainer_' + appId
    });
    var table = "<table id='pcr_pendingReq_" + appId + "' class='sortable pdcPendReq_table'>" +
            "<thead class='applicationmyData_headerContainer'>" +
            "<tr>" +
            "<th class='table_sortfirstdesc application_main_text' >" + global.getLabel('date') + "</th>" +
            "<th class='application_main_text' >" + global.getLabel('action') + "</th>" +
            "<th class='application_main_text' >" + global.getLabel('status') + "</th>" +
            "</tr>" +
            "</thead>" +
            "<tbody id='pcr_pendingReq_body'></tbody>" +
            "</table>";
    //insert it in the widget            
    tableContainer.insert(table);
    widgetContent.insert(tableContainer);
    this.hashOfWidgets.get(appId).setContent(widgetContent);
    //insert legend
    this.drawLegendPart('pcr_pending_legend');
    //now we fill it with information
    if (!Object.isEmpty(json.EWS.o_records))
        var recordsArray = objectToArray(json.EWS.o_records.yglui_str_pend_req);
    else
        var recordsArray = $A();
    var body = '';
    for (var i = 0; i < recordsArray.length; i++) {
        //get the info
        requestId = recordsArray[i]['@req_id'];
        requestAppId = recordsArray[i]['@appid'];
        objId = recordsArray[i]['@objid'];
        date = recordsArray[i]['@datum'];
        datum = Date.parseExact(date, 'yyyy-MM-dd').toString(this.dateFormat);
        action = recordsArray[i]['@appid'];        
        var status = recordsArray[i]['@transferred'];                                
        //build the row
        body += "<tr id='row_" + requestId + '_' + requestAppId + "'>" +
                        "<td><span id='link_" + requestId + '_' + requestAppId + "' class='application_action_link' onClick='javascript:document.fire(\"EWS:PCR_showDetails\", $H({requestId:\"" + requestId + "\", objId:\"" + objId + "\" , requestAppId:\"" + requestAppId + "\"}))'>" + datum + "</span><div id='req_" + requestId + "_" + requestAppId + "' class='pdcPendReq_details' style='display:none'></div></td>" +
                        "<td class='application_main_text'>" + global.getLabel(action) + "</td>";
        switch (status) {
            case '': // Sent for approval
                body += "<td><span title='" + global.getLabel('status_P') + "' class='application_icon_orange pcr_iconColumn'></span><span class='OMposAssign_hidden'>20</span></td>";
                break;
            case '-': // Sent for deletion
                body += "<td><span title='" + global.getLabel('status_D') + "' class='application_icon_red pcr_iconColumn'></span><span class='OMposAssign_hidden'>21</span></td>";
                break;
            case 'X':// Completed
                body += "<td><span title='" + global.getLabel('completed') + "' class='application_icon_green pcr_iconColumn'></span><span class='OMposAssign_hidden'>90</span></td>";
                break;
            default:
                body += "<td></td>";
                break;
        }
        body += "</tr>";
    }
    //insert the body in the table
    this.virtualHtml.down('[id=pcr_pendingReq_body]').update(body);

    //instantiate the tablekit with search                               
    if (!this.tablePendingShowed) {
        this.tablePendingShowed = true;
        this.tablePendingObject = new tableKitWithSearch(this.virtualHtml.down('table#pcr_pendingReq_' + appId), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
    }
    else
        this.tablePendingObject.reloadTable(this.virtualHtml.down('table#pcr_pendingReq_' + appId));
    //save the json to insert the details if needed
    this.pendingReqJson = json;
},

/**
*@description Method to draw the Legend Part
*@param div The container div where the details will be
*/
drawLegendPart: function(div) {
    //if building the legend for 'planned' widget
    if (div.include('planned')) {
        //here and below, we create the json, and then instantiate the legend module
        var legendJSON = {
            legend: [
                {
                    img: "application_curriculumType",
                    text: global.getLabel('planned')
                },
                {
                    img: "application_inProgress_training_icon_curr_div",
                    text: global.getLabel('draft')
                }
                ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
        //if building the legend for 'pending' widget
    } else if (div.include('pending')) {
        var legendJSON = {
            legend: [
                {
                    img: "application_icon_red",
                    text: global.getLabel('status_D')
                },
                {
                    img: "application_icon_orange",
                    text: global.getLabel('status_P')
                },
                {
                    img: "application_icon_green",
                    text: global.getLabel('completed')
                }
                ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
    }
    var legendHTML = getLegend(legendJSON);
    this.virtualHtml.down('[id=' + div + ']').update(legendHTML);
},
/**
*@description Shows details for a choosen request. If they dont exist yet, the method creates them
*@param args Arguments about the element choosen
*/
showHideDetails: function(args) {
    //read arguments from the event
    var id = getArgs(args).get('requestId');
    var appId = getArgs(args).get('requestAppId');
    var objId = getArgs(args).get('objId');
    //structural divs
    var detailsContainer = new Element('div', {
        'id': 'PCR_detailsContainer_' + appId + "_" + id
    });
    var divToDisplayButtons = new Element('div', {
        'id': 'PCR_openWizButton_' + appId + "_" + id
    });
    //check if the details div exists. If not, create it     
    if (this.virtualHtml.down('[id=req_' + id + '_' + appId + ']')) {
        if (this.virtualHtml.down('[id=req_' + id + '_' + appId + ']').innerHTML == "") {
            //this.pendingReqJson
            var json = this.getJsonFieldPanel(id, appId);
            if (!Object.isEmpty(json)) {
                var objParameters = {
                    appId: appId,
                    mode: 'display',
                    json: json,
                    showCancelButton: false
                };
                var objFieldsPanel = new getContentModule(objParameters).getHtml();
                detailsContainer.insert(objFieldsPanel);
                //add 'openWizard' just if O_BUTTON exists                        
                if (!Object.isEmpty(this.pendingReqJson.EWS.o_button)) {
                    var disma = this.pendingReqJson.EWS.o_button.yglui_str_wid_button['@disma'];
                    var buttonsJson = {
                        elements: []
                    };
                    var aux = {
                        idButton: 'openWizard',
                        label: this.pendingReqJson.EWS.o_button.yglui_str_wid_button['@label_tag'],
                        className: 'application_action_link pcr_openWizard_button',
                        type: 'link',
                        eventOrHandler: false, //eventOrHandler: true
                        handlerContext: null,
                        handler: global.open.bind(global, $H({
                            app: {
                                appId: appId,
                                tabId: this.pendingReqJson.EWS.o_button.yglui_str_wid_button['@tartb'],
                                view: this.pendingReqJson.EWS.o_button.yglui_str_wid_button['@views']
                            },
                            wizardId: appId,
                            empId: objId,
                            leftMenuId: this.empId,
                            requestId: id,
                            disma: disma,
                            comingFrom: 'History'
                        }))
                    };
                    buttonsJson.elements.push(aux);
                    var buttonOpenWiz = new megaButtonDisplayer(buttonsJson);
                    divToDisplayButtons.insert(buttonOpenWiz.getButtons());
                    detailsContainer.insert(divToDisplayButtons);
                }
                //insert details below the request       
                this.virtualHtml.down('[id=req_' + id + '_' + appId + ']').insert(detailsContainer);
            }
        }
        //show/hide details
        this.virtualHtml.down('[id=req_' + id + '_' + appId + ']').toggle();
        //show/hide button to view all the table
    }
},
/**
*@description Method to prepare the info to be able to use the fieldsPanel
*@param id Request id
*@param appId Widget id
*/
getJsonFieldPanel: function(id, appId) {
    var newJson = deepCopy(this.pendingReqJson);
    if (!Object.isEmpty(this.pendingReqJson.EWS.o_records.yglui_str_pend_req)) {
        //get all records
        var details = objectToArray(this.pendingReqJson.EWS.o_records.yglui_str_pend_req);
        var request;
        for (var i = 0; i < details.length; i++) {
            //get every record
            request = details[i];
            //if the record is the record clicked
            if (request["@req_id"] == id) {
                //get field_values for fieldPanel
                newJson.EWS.o_field_values = request.record;
                //get field_settings for fieldPanel
                newJson.EWS.o_field_settings = deepCopy(this.pendingReqJson.EWS.o_fieldsettings.yglui_str_appid_fs_settings.o_field_settings);
                return newJson;
            }
        }
    }
},
/**  
*@param appId The appId of a certaing widget
*@description Calls SAP to get the content of a widget, with 'get_wizards' xml_in structure
*/
callToGetWizard: function(appId) {
    var xml = "<EWS>"
                    + "<SERVICE>" + this.wizardsService + "</SERVICE>"
                    + "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>"
                    + "<PARAM>"
                        + "<MENU_TYPE>A</MENU_TYPE>"
                        + "<CONTAINER>" + appId + "</CONTAINER>"
                        + "<A_SCREEN>*</A_SCREEN>"
                    + "</PARAM>"
                + "</EWS>";
    this.makeAJAXrequest($H({
        xml: xml,
        successMethod: this.drawWidgetOverview.bind(this, appId, this.empId)
    }));
},
/**  
*@param appId The appId of the overview widget
*@param json The json received from get_wizards 
*@description Takes the json creates all the links to the wizards (PCRS)
*/
drawWidgetOverview: function(appId, empId, json) {
    if (empId != this.empId)
        return;
    //create container div, and megabuttons for each PCR wizard
    var contentDiv = new Element('div', {
        'id': 'PCR_ovw_container'
    });
    var buttonsFromJson = Object.isEmpty(json.EWS.o_actions) ? new Array() : objectToArray(json.EWS.o_actions.yglui_vie_tty_ac);
    var step0Array = Object.isEmpty(json.EWS.o_wzid_step0) ? new Array() : objectToArray(json.EWS.o_wzid_step0.yglui_str_wiz_step0);
    var length = buttonsFromJson.length;
    if (length > 0) {
        contentDiv.insert('<div id="PCR_ovw_message" class="pcr_overView_links application_main_soft_text application_text_italic">' + global.getLabel('selectPCR') + '</div>');
        var divToDisplayButtons = new Element('div', {
            'id': 'PCR_contentButton'
        });
        for (var b = 0; b < buttonsFromJson.length; b++) {
            var buttonsJson = {
                elements: []
            };
            var aux = {
                idButton: buttonsFromJson[b]['@actio'],
                delimit: '((L))',
                label: buttonsFromJson[b]['@actiot'],
                className: 'application_action_link pcr_overView_links',
                handler: global.open.bind(global, $H({
                    app: {
                        appId: buttonsFromJson[b]['@tarap'],
                        tabId: buttonsFromJson[b]['@tartb'],
                        view: buttonsFromJson[b]['@views']
                    },
                    wizardId: buttonsFromJson[b]['@tarap'],
                    empId: this.empId,
                    step0: step0Array[b],
                    okCode: buttonsFromJson[b]['@okcod']
                })),
                type: 'link',
                eventOrHandler: false
            };
            buttonsJson.elements.push(aux);
            var ButtonPCROveview = new megaButtonDisplayer(buttonsJson);
            divToDisplayButtons.insert(ButtonPCROveview.getButtons());
        }
        contentDiv.insert(divToDisplayButtons);
    }
    else
        contentDiv.insert('<div id="PCR_ovw_message" class="pcr_overView_links application_main_soft_text application_text_italic">' + global.getLabel('noActions') + '</div>');
    this.hashOfWidgets.get(appId).setContent(contentDiv);
},
/**
*@param args Args received when an employee is selected
*@description Loads the selected user widgets
*/
onEmployeeSelected: function(args) {
    this.empId = args.id;
    this.loadWidgets();
},
onEmployeeUnselected: Prototype.emptyFunction,
/**
*@param $super The superclass: PCR_Overview
*@description Closes the application
*/
close: function($super) {
    $super();
    document.stopObserving('PFM:PCR_overviewWidgetsReady', this.widgetsReadyBinding);
    document.stopObserving('EWS:PCR_showDetails', this.showHideDetailsBinding);
}
});