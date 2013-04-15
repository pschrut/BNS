/**
*@fileOverview OM_CostCenter.js
*@description It contains a class with functionality for managing cost centers.
*/
/**
*@constructor
*@description Class with functionality for maintain cost centers.
*@augments Application
*/
var OM_CostCenter = Class.create(Application,
/** 
*@lends OM_PosAssign 
*/
{
/*** SERVICES ***/
/**
*@type String
*@description Get the list of cost centers service
*/
getCostCenterService: 'GET_COSTCENTRS',
/**
*@type String
*@description Maintain of cost centers service
*/
maintainCostCenterService: 'MAINT_K',
/*** VARIABLES ***/
/**
/**
*@type Boolean
*@description table loaded
*/
tableLoaded: false,
/*** METHODS ***/
/**
*Constructor of the class OM_CostCenter
*/
initialize: function($super, args) {
    $super(args);
    //events 
    this.changeDatePickerBinding = this.changeDatePicker.bindAsEventListener(this);
},
/**
*@description Starts OM_CostCenter
*/
run: function($super, args) {
    $super(args);
    //get values from global
    this.userLanguage = global.language;
    this.dateFormat = global.dateFormat;
    this.numberRows = global.paginationLimit;
    this.actualLanguage = this.userLanguage;
    //get appId from args
    this.applicationId = args.get('app').appId;
    //initialize filter date
    this.filterDate = Date.today().toString('yyyy-MM-dd');
    //first run
    if (this.firstRun) {
        //create a hash with possible languages of user
        this.getLanguages();
        //create the html structure of the application 
        this.createHtml();
        //get the list of cost center
        this.getCostCenter();
    }
    //event to control if the date is changed
    document.observe('EWS:' + this.applicationId + '_correctDay', this.changeDatePickerBinding);
},
/**
*@description Stops OM_CostCenter
*/
close: function($super) {
    $super();
    document.stopObserving('EWS:' + this.applicationId + '_correctDay', this.changeDatePickerBinding);
},
/**
*@description Get the possible languages
*/
getLanguages: function() {
    //get the id from global
    var languages = global.translations;
    //save id and description from label in a hash
    this.languagesHash = $H({});
    languages.each(function(pair) {
        this.languagesHash.set(pair[0], global.getLabel(pair[0]))
    } .bind(this))
},
/**
*@description Builds the initial HTML code
*/
createHtml: function() {
    //html structure
    var html = "<div id='OM_costCenter_Date' class='OM_costCenterDate'></div>" +
                       "<div id='OM_costCenterTableDiv' class='OM_costCenterTable OMposAssign_shown'></div>" +
                       "<div id='OM_costCenterEmptyTableDiv' class='OM_costCenterTable OMposAssign_shown'></div>" +
                       "<div id='OM_costCenterAuxScreen' class='OM_costCenterAuxScreenDiv'></div>" +
                       "<div id='OM_costCenterButton' OM_costCenterButtonDiv></div>";
    this.virtualHtml.insert(html);
    this.virtualHtml.down('div#OM_costCenterAuxScreen').hide();
    //draw the FILTER DATE
    var dateHtml = "<span class='OM_text'>" + global.getLabel("date") + "</span>" +
                            "<div id='OM_costCenter_filterDate' class='OM_costCenter_filterDate'></div>";
    this.virtualHtml.down('div#OM_costCenter_Date').update(dateHtml);
    //DatePickers definition
    this.filterDatePicker = new DatePicker('OM_costCenter_filterDate', {
        defaultDate: objectToSap(new Date()).gsub('-', ''),
        events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' })
    });
    //draw the CREATE BUTTON
    var createButton = "<div class='OM_costCenter_createButton' id='OM_costCenterB'></div> ";
    //insert it in the div                        
    this.virtualHtml.down('div#OM_costCenter_Date').insert(createButton);
    var json = {
        elements: []
    };
    var auxCreate = {
        label: global.getLabel('createK'),
        idButton: 'OM_costCenter_createButton',
        handlerContext: null,
        handler: this.clickingOnCreate.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxCreate);
    var ButtonCreateCostCenter = new megaButtonDisplayer(json);
    this.virtualHtml.down('div#OM_costCenterB').insert(ButtonCreateCostCenter.getButtons());
    this.virtualHtml.down('div#OM_costCenter_createButton').hide();  // we suppose display mode
    //draw the REFRESH BUTTON
    var refreshButton = "<div class='OM_costCenter_refreshButton' id='OM_costCenterRefreshButton'></div> ";
    //insert it in the div
    this.virtualHtml.down('div#OM_costCenter_Date').insert(refreshButton);
    var json = {
        elements: []
    };
    var auxRefresh = {
        label: global.getLabel('refresh'),
        idButton: 'OM_costCenterRefreshButton',
        handlerContext: null,
        handler: this.updateCostCenterTable.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxRefresh);
    var ButtonRefreshCostCenter = new megaButtonDisplayer(json);
    this.virtualHtml.down('div#OM_costCenterRefreshButton').insert(ButtonRefreshCostCenter.getButtons());
    //draw the TABLE HEADER
    var table = "<table id='OM_costCenterTable' class='sortable'>" +
                            "<thead>" +
                                "<tr>" +
                                    "<th id='OM_costCenterNameColumn' class='table_sortfirstdesc OM_costCenter_widthLabelName'>" + global.getLabel('name') + "</th>" +
                                    "<th class='OM_costCenter_widthLabelAbrev'>" + global.getLabel('abreviation') + "</th>" +
                                    "<th class='OM_costCenter_widthLabelDates'>" + global.getLabel('valDate') + "</th>" +
                                "</tr>" +
                            "</thead>" +
                            "<tbody id='OM_costCenterTable_body'></tbody>" +
                        "</table>";
    this.virtualHtml.down('div#OM_costCenterTableDiv').insert(table);
    this.virtualHtml.down('div#OM_costCenterTableDiv').addClassName('OMposAssign_hidden');
},
/**
*@description Method to proccess the create button
*/
clickingOnCreate: function() {
    this.auxScreen = global.getLabel("create");
    this.drawAuxScreen();
},
/**
*@description Asks the backend for the cost center list
*/
getCostCenter: function() {
    //call to sap 
    this.xmlToGetCostCenter = "<EWS>" +
                                        "<SERVICE>" + this.getCostCenterService + "</SERVICE>" +
                                        "<OBJECT TYPE='K'></OBJECT>" +
                                        "<DEL></DEL>" +
                                        "<GCC></GCC>" +
                                        "<LCC></LCC>" +
                                        "<LABELS></LABELS>" +
                                        "<PARAM>" +
                                            "<PATTERN></PATTERN>" +
                                            "<DATUM>" + this.filterDate + "</DATUM>" +
                                            "<LANGUAGE>" + this.userLanguage + "</LANGUAGE>" +
                                        "</PARAM>" +
                                      "</EWS>";
    this.makeAJAXrequest($H({ xml: this.xmlToGetCostCenter, successMethod: 'processCostCenter' }));
},
/**
*@description Shows the cost centers information in the table
*@param {JSON} json Object from the backend
*/
processCostCenter: function(json) {
    //get authorizations
    this.maintainAuthorization = json.EWS.o_disma;
    //this.maintainAuthorization = "D";         // TO TEST //
    //if the user has authorization, the create button is shown
    if (this.maintainAuthorization == "M")
        this.virtualHtml.down('div#OM_costCenter_createButton').show();
    //get information about the cost centers
    if (json.EWS.o_costcenters) {
        var costCenters = objectToArray(json.EWS.o_costcenters.item);
        this.numberCostCenters = costCenters.length;
    } else {
        this.numberCostCenters = 0;
    }
    var html = "";
    //if there isn't any cost center
    if (this.numberCostCenters == 0) {
        //hide the table and show a message
        this.virtualHtml.down('table#OM_costCenterTable').hide();
        var textEmptyRecords = "<span class='application_main_soft_text OM_messageEmptyTable'>" + global.getLabel("emptyK") + "</span>";
        this.virtualHtml.down('div#OM_costCenterEmptyTableDiv').update(textEmptyRecords);
        this.virtualHtml.down('div#OM_costCenterEmptyTableDiv').show();
    } else {
        //show the table and hide message if it exists
        this.virtualHtml.down('table#OM_costCenterTable').show();
        this.virtualHtml.down('div#OM_costCenterEmptyTableDiv').hide();
        //read the info and fill the table
        var id, name, abrev, dateFrom, dateTo, dateFromFormat, dateToFormat, valDates, controlArea;
        this.costCenterHash = new Hash();
        for (var i = 0; i < this.numberCostCenters; i++) {
            //get the info
            id = Object.isEmpty(costCenters[i].cost['@costcenter']) ? "" : costCenters[i].cost['@costcenter'];
            name = Object.isEmpty(costCenters[i].cost['@name']) ? "" : costCenters[i].cost['@name'];
            abrev = id;
            dateFrom = costCenters[i].cost['@valid_from'];
            dateFromFormat = Date.parseExact(dateFrom, 'yyyy-MM-dd').toString(this.dateFormat);
            dateTo = costCenters[i].cost['@valid_to'];
            dateToFormat = Date.parseExact(dateTo, 'yyyy-MM-dd').toString(this.dateFormat);
            valDates = dateFromFormat + " - " + dateToFormat;
            controlArea = Object.isEmpty(costCenters[i]['@kokrs']) ? "" : costCenters[i]['@kokrs'];
            compcode = Object.isEmpty(costCenters[i]['@comp_code']) ? "" : costCenters[i]['@comp_code'];
            //add the info in the html body structure
            html += "<tr>" +
                            "<td><div id='OM_CostCenter_link_" + i + "' class='application_action_link'>" + name + "</div></td>" +
                            "<td>" + abrev + "</td>" +
                            "<td>" + valDates + "</td>" +
                        "</tr>";
            //save the info in a hash        
            this.costCenterHash.set(id, new Hash());
            this.costCenterHash.get(id).set('name', name);
            this.costCenterHash.get(id).set('abrev', abrev);
            this.costCenterHash.get(id).set('dateFrom', dateFrom);
            this.costCenterHash.get(id).set('dateTo', dateTo);
            this.costCenterHash.get(id).set('controlArea', controlArea);
            this.costCenterHash.get(id).set('compcode', compcode);
        }
        this.virtualHtml.down('tbody#OM_costCenterTable_body').update(html);
        if (!this.tableLoaded) {
            //update the variable
            this.tableLoaded = true;
            //make the sortable table with pagination
            TableKit.Sortable.init(this.virtualHtml.down('table#OM_costCenterTable'), { pages: this.numberRows });
        } else {
            TableKit.reloadTable("OM_costCenterTable");
        }
        //if the user clicks on an element of the list
        for (var i = 0; i < this.numberCostCenters; i++) {
            id = Object.isEmpty(costCenters[i].cost['@costcenter']) ? "" : costCenters[i].cost['@costcenter'];
            this.virtualHtml.down('div#OM_CostCenter_link_' + i).observe('click', this.showDetails.bind(this, id));
        }
    }
},
/**
*@description Show the table
*@param {String} cost center clicked
*/
showDetails: function(id) {
    //save the cost center clicked
    this.costCenterClicked = id;
    //update variable
    this.auxScreen = global.getLabel("modify");
    //update the current language to the user language
    this.actualLanguage = this.userLanguage;
    //remove the languages of translations
    if (this.virtualHtml.down('[id=OM_costCenter_TransAuxScreen]'))
        this.virtualHtml.down('[id=OM_costCenter_TransAuxScreen]').update("");
    //draw the details screen of the cost center clicked
    this.drawAuxScreen();
},
/**
*@description Reload the table for a new date 
*/
changeDatePicker: function(event) {
    //if the filter date calendar  changes
    if (getArgs(event).id == 'OM_costCenter_filterDate') {
        //remove and hide the aux sreen
        this.virtualHtml.down('div#OM_costCenterAuxScreen').update("");
        this.virtualHtml.down('div#OM_costCenterAuxScreen').hide();
        //remove message of empty table
        this.virtualHtml.down('div#OM_costCenterEmptyTableDiv').update("");
        //get the new date
        this.filterDate = this.filterDatePicker.getActualDate().toString('yyyyMMdd');
        //get the list of cost center for the new date
        this.getCostCenter();
    }
},
/**
*@description Draw aux screen
*/
drawAuxScreen: function() {
    //remove the aux screen
    this.virtualHtml.down('div#OM_costCenterAuxScreen').update("");
    //show the div of the aux screen
    this.virtualHtml.down('div#OM_costCenterAuxScreen').show();
    //html structure aux screen
    var auxScreen = "<div id='OM_costCenter_TitleAuxScreen' class='application_header_bar'></div>" +
                            "<div id='OM_costCenter_TransAuxScreen'></div>" +
                            "<div id='OM_costCenter_DescrAuxScreen'></div>" +
                            "<div id='OM_costCenter_DateAuxScreen'></div>" +
                            "<div id='OM_costCenter_ButtonsAuxScreen'></div>";
    this.virtualHtml.down('div#OM_costCenterAuxScreen').insert(auxScreen);
    //draw the title
    this.drawTitle();
    //draw the translation part in details screen
    if (this.auxScreen != global.getLabel("create"))
        this.drawTransPart();
    //draw the name and abrev part
    this.drawDescrPart();
    //draw the date part
    this.drawDatePart();
    //draw te buttons
    this.drawButtons();
},
/**
*@description Draw title of aux screen
*/
drawTitle: function() {
    //write the title depending of the action
    var title;
    if (this.auxScreen == global.getLabel("create")) {
        title = global.getLabel("createK")
    } else {
        title = global.getLabel("detailK")
    }
    //insert the title in the div
    this.virtualHtml.down('[id=OM_costCenter_TitleAuxScreen]').insert("<span id='OM_costCenter_details_title' class='OM_costCenter_details_title'>" + title + "</span>");
},
/**
*@description Draw translations part of aux screen
*/
drawTransPart: function() {
    //html structure
    var html = "<div class='OM_MaintObjCreate_partDiv'>" +
                            "<span class='application_main_soft_text OM_costCenter_Text '>" + global.getLabel('translation') + "</span>" +
                            "<div id='OM_costCenter_languages'></div>" +
                       "</div>";
    //insert the html structure in the div
    this.virtualHtml.down('[id=OM_costCenter_TransAuxScreen]').update(html);
    //languages definition     
    var languageHtml = '';
    var lang, langDesc;
    this.languagesHash.each(function(pair) {
        lang = pair[0];
        langDesc = pair[1];
        languageHtml += "<div><span id='OM_costCenter_" + lang + "' class='application_action_link OM_MaintObjCreate_linkDisabled'>" + langDesc + "</span></div>";
    } .bind(this));
    //insert the languages
    this.virtualHtml.down('[id=OM_costCenter_languages]').insert(languageHtml);
    this.virtualHtml.down('span#OM_costCenter_' + this.actualLanguage + '').removeClassName('application_action_link');
    this.virtualHtml.down('span#OM_costCenter_' + this.actualLanguage + '').addClassName('OM_MaintObjCreate_linkDisabled');
    //if the user changes the language   
    this.languagesHash.each(function(pair) {
        lang = pair[0];
        //for each language
        this.virtualHtml.down('[id=OM_costCenter_' + lang + ']').observe('click', this.updateLanguageDescrPart.bind(this, lang));
    } .bind(this));
},
/**
*@description Update the info depending of the language selected
*/
updateLanguageDescrPart: function(lang) {
    //update the current language
    this.actualLanguage = lang;
    //remove the languages of translations
    this.virtualHtml.down('[id=OM_costCenter_TransAuxScreen]').update("");
    //draw the languages
    this.drawTransPart();
    if (lang != this.userLanguage) {
        //call sap to get the info in the selected language
        this.callToDrawAuxScreen();
    } else {
        //update values in the aux screen with the hash info
        if (this.maintainAuthorization != "M") {
            this.virtualHtml.down('[id=OM_costCenter_name]').update("<span>" + this.costCenterHash.get(this.costCenterClicked).get('name') + "</span>");
        } else {
            this.virtualHtml.down('[id=OM_MaintObjCreate_TitleField]').value = this.costCenterHash.get(this.costCenterClicked).get('name');
        }
    }
},
/**
*@description Draw description(title and abrev) part of aux screen
*/
drawDescrPart: function() {
    //html structure
    var html = "<div class='OM_MaintObjCreate_partDiv'>" +
                           "<span class='application_main_soft_text OM_costCenter_Text'>" + global.getLabel('title') + "</span>";
    if (this.maintainAuthorization != "M") {
        html += "<div class='OM_MaintObjCreate_TextFieldDiv' id='OM_costCenter_name'></div>";
    } else {
        html += "<div class='OM_MaintObjCreate_TextFieldDiv'><input type='text' id='OM_MaintObjCreate_TitleField' class='OM_MaintObjCreate_TitleField' maxlength=20></input></div>";
    }
    html += "</div>" +
                       "<div class='OM_MaintObjCreate_partDiv'>" +
                           "<span class='application_main_soft_text OM_costCenter_Text'>" + global.getLabel('abreviation') + "</span>" +
                           "<div class='OM_MaintObjCreate_TextFieldDiv' id='OM_costCenter_abrev'></div>" +
                       "</div>";
    //insert the html structure in the div
    this.virtualHtml.down('[id=OM_costCenter_DescrAuxScreen]').update(html);
    //update values of input fields
    if (this.auxScreen == global.getLabel("create")) {
        this.virtualHtml.down('[id=OM_costCenter_abrev]').update("<input type='text' id='OM_MaintObjCreate_AbrevField' maxlength=10></input>");
        this.virtualHtml.down('[id=OM_MaintObjCreate_TitleField]').value = "";
        this.virtualHtml.down('[id=OM_MaintObjCreate_AbrevField]').value = "";
    } else {
        if (this.maintainAuthorization != "M") {
            this.virtualHtml.down('[id=OM_costCenter_name]').update("<span>" + this.costCenterHash.get(this.costCenterClicked).get('name') + "</span>");
        } else {
            this.virtualHtml.down('[id=OM_MaintObjCreate_TitleField]').value = this.costCenterHash.get(this.costCenterClicked).get('name');
        }
        this.virtualHtml.down('[id=OM_costCenter_abrev]').update("<span>" + this.costCenterHash.get(this.costCenterClicked).get('abrev') + "</span>");
    };
},
/**
*@description Draw date part of aux screen
*/
drawDatePart: function() {
    //html structure
    var html;
    if (this.auxScreen == global.getLabel("create")) {
        var html = "<div class='OM_MaintObjCreate_partDiv'>" +
                            "<div class='OM_MaintObjCreate_calendarDatesDiv'>" +
                                "<span class='application_main_soft_text OM_costCenter_ValDateText'>" + global.getLabel('valDate') + "</span>" +
                                "<span class='application_main_text OM_costCenter_calendarFromField'>" + global.getLabel('from') + "</span>" +
                                "<div class='OM_MaintObjCreate_calendar' id='OM_MaintObjCreate_form_begCal'></div>" +
                                "<span class='application_main_text OM_MaintObjCreate_calendarTextField'>" + global.getLabel('to') + "</span>" +
                                "<div class='OM_MaintObjCreate_calendar' id='OM_MaintObjCreate_endCal'></div>" +
                            "</div>" +
                       "</div>";
    } else {
        var html = "<div class='OM_MaintHolder_partDiv'>" +
                                "<span class='application_main_soft_text OM_costCenter_Text'>" + global.getLabel('valDate') + "</span>" +
                                "<div class='OM_costCenter_TextDateDiv'>" +
                                    "<span>" + global.getLabel('from') + "</span>" +
                                "</div>" +
                                "<div class='OM_costCenter_TextDateDiv' id='OM_MaintHolder_form_begCal'></div>" +
                                "<div class='OM_costCenter_TextDateDiv'>" +
                                    "<span >" + global.getLabel('to') + "</span>" +
                                "</div>" +
                                "<div class='OM_costCenter_TextDateDiv' id='OM_MaintHolder_endCal'></div>" +
                           "</div>";
    }
    //insert the html structure in the div
    this.virtualHtml.down('[id=OM_costCenter_DateAuxScreen]').update(html);
    //DatePickers and dates definition
    if (this.auxScreen == global.getLabel("create")) {
        var fromDate = Date.today().toString('yyyyMMdd');
        var toDate = "99991231";
        this.fromDatePicker = new DatePicker('OM_MaintObjCreate_form_begCal', {
            defaultDate: fromDate
        });
        this.toDatePicker = new DatePicker('OM_MaintObjCreate_endCal', {
            defaultDate: toDate
        });
        this.fromDatePicker.linkCalendar(this.toDatePicker);
    } else {
        //get the dates
        var fromDate = Date.parse(this.costCenterHash.get(this.costCenterClicked).get('dateFrom')).toString(this.dateFormat);
        var toDate = Date.parse(this.costCenterHash.get(this.costCenterClicked).get('dateTo')).toString(this.dateFormat);
        //add the dates 
        this.virtualHtml.down('[id=OM_MaintHolder_form_begCal]').update("<span>" + fromDate + "</span>");
        this.virtualHtml.down('[id=OM_MaintHolder_endCal]').update("<span>" + toDate + "</span>");
    };
},
/**
*@description Draw buttons part of aux screen
*/
drawButtons: function() {
    //create div for buttons
    var buttonsDiv = "<div class='OM_MaintObjCreate_ButtonsPart' id='OM_MaintObjCreate_Buttons'></div>";
    this.virtualHtml.down('div#OM_costCenter_ButtonsAuxScreen').update(buttonsDiv);
    var json = {
        elements: []
    };
    var auxSave = {
        label: global.getLabel('save'),
        idButton: 'OM_costCenter_saveButton',
        className: 'OM_MaintObjCreate_saveButton',
        handlerContext: null,
        handler: this.callToCreateModifyCostCenter.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxSave);
    var auxDelete = {
        label: global.getLabel('delete'),
        idButton: 'OM_costCenter_deleteButton',
        className: 'OM_MaintObjCreate_saveButton',
        handlerContext: null,
        handler: this.confirmationMessage.bind(this, 'OM_costCenter_deleteButton', 'DEL', 'button', global.getLabel('deleteObj')),
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxDelete);
    var auxCancel = {
        label: global.getLabel('cancel'),
        idButton: 'OM_costCenter_cancelButton',
        className: 'OM_MaintObjCreate_saveButton',
        handlerContext: null,
        handler: this.cancelScreen.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxCancel);
    var ButtonSavDelCcl = new megaButtonDisplayer(json);
    this.virtualHtml.down('div#OM_MaintObjCreate_Buttons').insert(ButtonSavDelCcl.getButtons());
    //hide the buttons, depending of the user authorization
    if (this.maintainAuthorization != "M") {
        this.virtualHtml.down('[id=OM_costCenter_deleteButton]').hide();
        this.virtualHtml.down('[id=OM_costCenter_saveButton]').hide();
    } else {
        if (this.auxScreen == global.getLabel("create")) {
            this.virtualHtml.down('[id=OM_costCenter_deleteButton]').hide();
        }
    };
},
/**
*@description Call sap to get info about the cost center clicked in the language selected
*/
callToDrawAuxScreen: function() {
    //get the info
    var title = this.costCenterHash.get(this.costCenterClicked).get('name');
    var abrev = this.costCenterHash.get(this.costCenterClicked).get('abrev');
    var dateFrom = this.costCenterHash.get(this.costCenterClicked).get('dateFrom');
    var dateTo = this.costCenterHash.get(this.costCenterClicked).get('dateTo');
    var compcode = this.costCenterHash.get(this.costCenterClicked).get('compcode');
    var controlArea = this.costCenterHash.get(this.costCenterClicked).get('controlArea');
    //call to sap 
    this.xmlToGetInfoCostCenter = "<EWS>" +
                                            "<SERVICE>" + this.maintainCostCenterService + "</SERVICE>" +
                                            "<OBJECT TYPE='K'>" + abrev + "</OBJECT>" +
                                            "<DEL></DEL>" +
                                            "<GCC></GCC>" +
                                            "<LCC></LCC>" +
                                            "<LABELS></LABELS>" +
                                            "<PARAM>" +
                                                "<ACTION>DIS</ACTION>" +
                                                "<TITLE></TITLE>" +
                                                "<ABREVIATION></ABREVIATION>" +
                                                "<START_DATE>" + dateFrom + "</START_DATE>" +
                                                "<END_DATE>" + dateTo + "</END_DATE>" +
                                                "<COMPCODE>" + compcode + "</COMPCODE>" +
                                                "<LANGUAGE>" + this.actualLanguage + "</LANGUAGE>" +
                                                "<CONTROLAREA>" + controlArea + "</CONTROLAREA>" +
                                            "</PARAM>" +
                                     "</EWS>";
    this.makeAJAXrequest($H({ xml: this.xmlToGetInfoCostCenter, successMethod: 'processCallToDrawAuxScreen' }));
},
/**
*@description Shows the cost centers information in the aux screen
*@param {JSON} json Object from the backend
*/
processCallToDrawAuxScreen: function(json) {
    //read the title and abrev
    var title = Object.isEmpty(json.EWS.o_costcenter['@name']) ? '' : json.EWS.o_costcenter['@name'];
    //update the details screen in the language selected
    if (this.maintainAuthorization != "M") {
        this.virtualHtml.down('[id=OM_costCenter_name]').update("<span>" + title + "</span>");
    } else {
        this.virtualHtml.down('[id=OM_MaintObjCreate_TitleField]').value = title;
    }
},
/**
*@description Call sap to create or modify a cost center
*/
callToCreateModifyCostCenter: function() {
    //get the comun info
    var title = this.getRigthText(this.virtualHtml.down('[id=OM_MaintObjCreate_TitleField]').value);
    var abrev, dateFrom, dateTo
    if (this.auxScreen == global.getLabel("create")) {
        abrev = this.getRigthText(this.virtualHtml.down('[id=OM_MaintObjCreate_AbrevField]').value);
        dateFrom = this.fromDatePicker.getActualDate().toString("yyyy-MM-dd");
        dateTo = this.toDatePicker.getActualDate().toString("yyyy-MM-dd");
        //xml to create a cost center
        this.xmlCostCenter = "<EWS>" +
                                        "<SERVICE>" + this.maintainCostCenterService + "</SERVICE>" +
                                        "<OBJECT TYPE=''></OBJECT>" +
                                        "<DEL></DEL>" +
                                        "<GCC></GCC>" +
                                        "<LCC></LCC>" +
                                        "<LABELS></LABELS>" +
                                        "<PARAM>" +
                                            "<ACTION>INS</ACTION>" +
                                            "<TITLE>" + title + "</TITLE>" +
                                            "<ABREVIATION>" + abrev + "</ABREVIATION>" +
                                            "<START_DATE>" + dateFrom + "</START_DATE>" +
                                            "<END_DATE>" + dateTo + "</END_DATE>" +
                                            "<COMPCODE></COMPCODE>" +
                                            "<LANGUAGE>" + this.userLanguage + "</LANGUAGE>" +
                                            "<CONTROLAREA></CONTROLAREA>" +
                                        "</PARAM>" +
                                 "</EWS>";
    } else {
        //get general info about the cost center clicked
        abrev = this.getRigthText(this.costCenterHash.get(this.costCenterClicked).get('abrev'));
        dateFrom = this.costCenterHash.get(this.costCenterClicked).get('dateFrom');
        dateTo = this.costCenterHash.get(this.costCenterClicked).get('dateTo');
        var compcode = this.costCenterHash.get(this.costCenterClicked).get('compcode');
        var controlArea = this.costCenterHash.get(this.costCenterClicked).get('controlArea');
        var abrevCostCenter = this.getRigthText(this.costCenterHash.get(this.costCenterClicked).get('abrev'));
        //xml to modify a cost center
        this.xmlCostCenter = "<EWS>" +
                                        "<SERVICE>" + this.maintainCostCenterService + "</SERVICE>" +
                                        "<OBJECT TYPE='K'>" + abrevCostCenter + "</OBJECT>" +
                                        "<DEL></DEL>" +
                                        "<GCC></GCC>" +
                                        "<LCC></LCC>" +
                                        "<LABELS></LABELS>" +
                                        "<PARAM>" +
                                            "<ACTION>MOD</ACTION>" +
                                            "<TITLE>" + title + "</TITLE>" +
                                            "<ABREVIATION>" + abrev + "</ABREVIATION>" +
                                            "<START_DATE>" + dateFrom + "</START_DATE>" +
                                            "<END_DATE>" + dateTo + "</END_DATE>" +
                                            "<COMPCODE>" + compcode + "</COMPCODE>" +
                                            "<LANGUAGE>" + this.actualLanguage + "</LANGUAGE>" +
                                            "<CONTROLAREA>" + controlArea + "</CONTROLAREA>" +
                                        "</PARAM>" +
                                 "</EWS>";
    }
    this.makeAJAXrequest($H({ xml: this.xmlCostCenter, successMethod: 'updateCostCenterTable' }));
},
/**
*@description Update the table after create, modify or delete a cost center
*/
updateCostCenterTable: function() {
    //hide the aux screen
    this.virtualHtml.down('div#OM_costCenterAuxScreen').hide();
    //remove message of empty table
    this.virtualHtml.down('div#OM_costCenterEmptyTableDiv').update("");
    //get the list of cost center from sap
    this.getCostCenter();
},

confirmationMessage: function(action, okcode, type, label) {
    var contentHTML = new Element('div');
    contentHTML.insert(label);
    //buttons
    var buttonsJson = {
        elements: [],
        mainClass: 'moduleInfoPopUp_stdButton_div_left'
    };
    var callBack = function() {
        this.callToDeleteCostCenter();
        deletePopUp.close();
        delete deletePopUp;
    } .bind(this);
    var callBack3 = function() {
        deletePopUp.close();
        delete deletePopUp;
    };
    var aux2 = {
        idButton: 'Yes',
        label: global.getLabel('yes'),
        handlerContext: null,
        className: 'moduleInfoPopUp_stdButton',
        handler: callBack,
        type: 'button',
        standardButton: true
    };
    var aux3 = {
        idButton: 'No',
        label: global.getLabel('no'),
        handlerContext: null,
        className: 'moduleInfoPopUp_stdButton',
        handler: callBack3,
        type: 'button',
        standardButton: true
    };
    buttonsJson.elements.push(aux2);
    buttonsJson.elements.push(aux3);
    var ButtonObj = new megaButtonDisplayer(buttonsJson);
    var buttons = ButtonObj.getButtons();
    //insert buttons in div
    contentHTML.insert(buttons);
    var deletePopUp = new infoPopUp({
        closeButton: $H({
            'textContent': 'Close',
            'callBack': function() {
                deletePopUp.close();
                delete deletePopUp;
            }
        }),
        htmlContent: contentHTML,
        indicatorIcon: 'information',
        width: 350
    });
    deletePopUp.create();
},
/**
*@description Call sap to delete the cost center selected
*/
callToDeleteCostCenter: function() {
    //get info about the cost center to delete
    var abrev = this.getRigthText(this.costCenterHash.get(this.costCenterClicked).get('abrev'));
    var dateFrom = Date.parse(this.costCenterHash.get(this.costCenterClicked).get('dateFrom')).toString('yyyy-MM-dd');
    var dateTo = Date.parse(this.costCenterHash.get(this.costCenterClicked).get('dateTo')).toString('yyyy-MM-dd');
    var controlArea = this.costCenterHash.get(this.costCenterClicked).get('controlArea');
    //call to sap 
    this.xmlToDeleteCostCenter = "<EWS>" +
                                            "<SERVICE>" + this.maintainCostCenterService + "</SERVICE>" +
                                            "<OBJECT TYPE='K'>" + abrev + "</OBJECT>" +
                                            "<DEL></DEL>" +
                                            "<GCC></GCC>" +
                                            "<LCC></LCC>" +
                                            "<LABELS></LABELS>" +
                                            "<PARAM>" +
                                                "<ACTION>DEL</ACTION>" +
                                                "<TITLE></TITLE>" +
                                                "<ABREVIATION></ABREVIATION>" +
                                                "<START_DATE>" + dateFrom + "</START_DATE>" +
                                                "<END_DATE>" + dateTo + "</END_DATE>" +
                                                "<COMPCODE></COMPCODE>" +
                                                "<LANGUAGE></LANGUAGE>" +
                                                "<CONTROLAREA>" + controlArea + "</CONTROLAREA>" +
                                            "</PARAM>" +
                                     "</EWS>";
    this.makeAJAXrequest($H({ xml: this.xmlToDeleteCostCenter, successMethod: 'updateCostCenterTable' }));
},
/**
*@description Method to treat special characters 
*/
getRigthText: function(text) {
    if (text.include('&'))
        text = text.gsub('&', '&amp;');
    if (text.include('<'))
        text = text.gsub('<', '&lt;');
    if (text.include('>'))
        text = text.gsub('<', '&gt;');
    if (text.include('"'))
        text = text.gsub('"', '&quot;');
    if (text.include("'"))
        text = text.gsub("'", '&apos;');
    return text;
},
/**
*@description Hide the aux screen
*/
cancelScreen: function() {
    //hide the aux screen
    this.virtualHtml.down('div#OM_costCenterAuxScreen').hide();
}
});