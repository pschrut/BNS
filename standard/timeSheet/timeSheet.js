/**
* @fileOverview timeSheet.js
* @description It contains a class with functionality for showing an employee's timesheet for a given date.
*/
/**
* @constructor
* @description Class with functionality for showing an employee's timesheet for a given date.
* @augments Application
*/
var timeSheet = Class.create(Application,
/** 
*@lends timeSheet
*/
{
    /**
    * Constructor of the class timeSheet
    */
    initialize: function($super, args) {
        $super(args);
        this.comeFrom = '';
        this.getReqDataService = 'GET_PT_REQDATA';
        this.getTimesheetService = 'GET_TIMESHEET';
        this.getSubtypesService = 'TSH_SUBTYPES';
        this.saveTimesheetService = 'SAVE_TIMESHEET';
        this.getCostCentersService = 'GET_CC';
        this.dateFormat = 'yyyy-MM-dd';
        this.refresh = false;
        this.headedInserted = false;
        this.headedInserted_read = false;
        this.refreshTimesheetBinding = this._refreshTimesheet.bindAsEventListener(this);
        // Labels
        this.copyLabel = global.getLabel('copy');
        this.pasteLabel = global.getLabel('paste');
        this.addLabel = global.getLabel('add');
        this.removeLabel = global.getLabel('remove');
        this.approvalLabel = global.getLabel('status_P');
        this.deletionLabel = global.getLabel('status_D');
        this.tbpLabel = global.getLabel('status_TBP');
        this.draftLabel = global.getLabel('draft');
        this.access = 0;
        this.fristTimeComeFrom = '';
    },
    /**
    * @description Starts timeSheet
    */
    run: function($super, args) {
        $super(args);
        if (args) {
            this.comeFrom = args.get('comingFrom');
            if (this.comeFrom == 'inbox') {
                this.requesterId = args.get('req_bp');
                this.requestTaskId = args.get('req_id');
            }
        }
        if (this.access == 0) {
            this.access++;
            this.firstTimeComeFrom = this.comeFrom;
        }
        else if (this.access == 1) {
            if (this.firstTimeComeFrom != this.comeFrom) {
                this.firstRun = true;
                this.access++;
            }
        }
        if (this.comeFrom == 'inbox') {
            var headerDivTSH = this.virtualHtml.down('[id=applicationtimeSheet_header]');
            if (headerDivTSH)
                headerDivTSH.hide();
            var bodyDivTSH = this.virtualHtml.down('[id=applicationtimeSheet_body]');
            if (bodyDivTSH)
                bodyDivTSH.hide();
            var headerDivTSH_read = this.virtualHtml.down('[id=applicationtimeSheet_read_header]');
            if (headerDivTSH_read)
                headerDivTSH_read.show();
            var bodyDivTSH_read = this.virtualHtml.down('[id=applicationtimeSheet_read_body]');
            if (bodyDivTSH_read)
                bodyDivTSH_read.show();
            if (this.firstRun) {
                // Initial date: today
                this.currentDate = new Date();
                // Collision date
                this.collisionDate = null;
                // Time types for each employee
                this.timeTypes = new Hash();
                // Cost centers
                this.costCenters = null;
                // Clipboard
                this.clipboard = new Hash();
                // Says if we have to show cost centers or not
                this.showCC = false;
                // Current timesheet
                this.currentTimesheet = null;
                this._setInitialHTML_read();
            }
            this._getReqData(this.requestTaskId);
            this._resetClipboard();
        } //comeFrom inbox
        else {
            var headerDivTSH_read = this.virtualHtml.down('[id=applicationtimeSheet_read_header]');
            if (headerDivTSH_read)
                headerDivTSH_read.hide();
            var bodyDivTSH_read = this.virtualHtml.down('[id=applicationtimeSheet_read_body]');
            if (bodyDivTSH_read)
                bodyDivTSH_read.hide();
            var headerDivTSH = this.virtualHtml.down('[id=applicationtimeSheet_header]');
            if (headerDivTSH)
                headerDivTSH.show();
            var bodyDivTSH = this.virtualHtml.down('[id=applicationtimeSheet_body]');
            if (bodyDivTSH)
                bodyDivTSH.show();
            if (this.firstRun) {
                // Initial date: today
                this.currentDate = new Date();
                // Collision date
                this.collisionDate = null;
                // Initial user: none (this will be set inside "onEmployeeSelected" method)
                this.currentUser = null;
                // Time types for each employee
                this.timeTypes = new Hash();
                // Cost centers
                this.costCenters = null;
                // Clipboard
                this.clipboard = new Hash();
                // Buttons
                this.buttons = null;
                // Says if we have to show cost centers or not
                this.showCC = false;
                // Current timesheet
                this.currentTimesheet = null;
                this._setInitialHTML();
                // Listening for changes in calendars
                document.observe('EWS:refreshTimesheet', this.refreshTimesheetBinding);
            }
            if (this.refresh) {
                this._getTimesheet(this.currentUser.id, this.currentDate);
                this.refresh = false;
            }
            this._resetClipboard();
        }
    },
    /**
    * @description Stops timeSheet
    */
    close: function($super) {
        $super();
    },
    /**
    * @description Builds the initial HTML code. Read only mode timesheet
    */
    _setInitialHTML_read: function() {
        var html = "<div id='applicationtimeSheet_read_header'>" +
                           "<div id='applicationtimeSheet_read_currentDate'></div>" +
                       "</div>" +
                       "<div id='applicationtimeSheet_read_errorMessage' class='applicationtimeSheet_errorMessageDiv'></div>" +
                       "<div id='applicationtimeSheet_read_body'>" +
                           "<div id='applicationtimeSheet_read_tableHeader'></div>" +
                           "<table cellspacing='0' border='0' cellpadding='0' id='applicationtimeSheet_read_table'>" +
                               "<tbody id='applicationtimeSheet_read_tableBody'>" +
                               "</tbody>" +
                           "</table>" +
                       "</div>";
        this.virtualHtml.insert(html);
        this.header_read = this.virtualHtml.down('[id=applicationtimeSheet_read_header]');
        this.errorMessageDiv = this.virtualHtml.down('[id=applicationtimeSheet_read_errorMessage]');
        this.errorMessageDiv.hide();
        this.table_read = this.virtualHtml.down('[id=applicationtimeSheet_read_tableBody]');
    },
    /**
    * @description Builds the initial HTML code
    */
    _setInitialHTML: function() {
        var html = "<div id='applicationtimeSheet_header'>" +
                           "<div class='applicationTeamCalendar_navButtonsDiv'>" +
                               "<div id='applicationtimeSheet_prevButton' class='application_verticalL_arrow' title='" + global.getLabel('prevPeriod') + "'></div>" +
                               "<div id='applicationtimeSheet_postButton' class='application_verticalR_arrow' title='" + global.getLabel('nextPeriod') + "'></div>" +
                           "</div>" +
                           "<div id='applicationtimeSheet_currentDate'></div>" +
                           "<div id='applicationtimeSheet_todayButtonDiv'></div>" +
                           "<div id='applicationtimeEntryScreen_buttonsDiv'></div>" +
                       "</div>" +
                       "<div id='applicationtimeSheet_errorMessage' class='applicationtimeSheet_errorMessageDiv'></div>" +
                       "<div id='applicationtimeSheet_body'>" +
                           "<div id='applicationtimeSheet_tableHeader'></div>" +
                           "<table cellspacing='0' border='0' cellpadding='0' id='applicationtimeSheet_table'>" +
                               "<tbody id='applicationtimeSheet_tableBody'>" +
                               "</tbody>" +
                           "</table>" +
                       "</div>";
        this.virtualHtml.insert(html);
        this.header = this.virtualHtml.down('[id=applicationtimeSheet_header]');
        this.errorMessageDiv = this.virtualHtml.down('[id=applicationtimeSheet_errorMessage]');
        this.errorMessageDiv.hide();
        this.table = this.virtualHtml.down('[id=applicationtimeSheet_tableBody]');
        this.table.observe('click', this._checkElement.bind(this));
        var jsonButton = { elements: [] };
        var aux = {
            idButton: 'applicationtimeSheet_todayButton',
            label: global.getLabel('today'),
            handlerContext: null,
            handler: this._clickOnToday.bind(this),
            type: 'button',
            standardButton: true
        };
        jsonButton.elements.push(aux);
        this.buttonTimesheet = new megaButtonDisplayer(jsonButton);
        this.header.down('[id=applicationtimeSheet_todayButtonDiv]').insert(this.buttonTimesheet.getButtons());
    },
    /**
    * @description When an employee is selected, we draw his/her timesheet
    * @param {JSON} args Selected employee's information
    */
    onEmployeeSelected: function(args) {
        if (this.comeFrom != "inbox") {
            if (Object.isEmpty(this.currentUser) || (this.currentUser.id != args.id)) {
                this.currentUser = args;
                if (Object.isEmpty(this.timeTypes.get(this.currentUser.id)))
                    this._getTimeTypes();
                else
                    this._getTimesheet(this.currentUser.id, this.currentDate);
            }
        }
    },
    /**
    * @description Employee unselected
    */
    onEmployeeUnselected: function() {
        Prototype.emptyFunction();
    },
    /**
    * @param {String} requestId Id for the requested task
    * @description Asks for an specific date for a timesheet
    */
    _getReqData: function(requestId) {
        this._disableUpperForm_read();
        var xml = "<EWS>" +
                          "<SERVICE>" + this.getReqDataService + "</SERVICE>" +
                          "<PARAM>" +
                              "<REQ_ID>" + requestId + "</REQ_ID>" +
                          "</PARAM>" +
                      "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_callTimesheet' }));
    },
    /** 
    * @description Says the date to use when calling for a timesheet
    * @param {JSON} json Information from GET_PT_REQDATA service
    */
    _callTimesheet: function(json) {
        var calcDate = Object.jsonPathExists(json, 'EWS.o_date') ? json.EWS.o_date : "";
        if (Object.isEmpty(calcDate)) {
            var contentHTML = new Element('div', { 'class': 'PCR_cancel_popUp' });
            contentHTML.insert("<div class='moduleInfoPopUp_std_leftMargin'>" + global.getLabel('noTimeSheetFound') + "</div>");
            var errorInfoPopUp = new infoPopUp({
                closeButton: $H({
                    'callBack': function() {
                        errorInfoPopUp.close();
                        delete errorInfoPopUp;
                    }
                }),
                htmlContent: contentHTML,
                indicatorIcon: 'exclamation',
                width: 600
            });
            errorInfoPopUp.create();
        }
        else {
            var calcDateObjet = sapToObject(calcDate);
            this._getTimesheet(this.requesterId, calcDateObjet);
        }
    },
    /**
    * @param {String} employeeId Employee whose timesheet we want to show
    * @param {Date} date Timesheet's date
    * @description Asks the backend for an specific timesheet
    */
    _getTimesheet: function(employeeId, date) {
        if (this.comeFrom == 'inbox') {
            this._disableUpperForm_read();
        }
        else {
            this._disableUpperForm();
            this.table.update('');
        }
        // Timesheet's request id (this will be set once we receive all timesheet events)
        this.requestId = null;
        var xml = "<EWS>" +
                      "<SERVICE>" + this.getTimesheetService + "</SERVICE>" +
                      "<OBJECT TYPE='P'>" + employeeId + "</OBJECT>" +
                      "<PARAM>" +
                          "<o_calculation_date>" + date.toString(this.dateFormat) + "</o_calculation_date>" +
                      "</PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_showTimesheet', errorMethod: '_showTimesheetError' }));
    },
    /**
    * @description Says if we have to show cost centers and shows a timesheet
    * @param {JSON} json Information from GET_TIMESHEET service
    */
    _showTimesheet: function(json) {
        this.currentTimesheet = json;
        var showCC = Object.jsonPathExists(json, 'EWS.o_costcenters') ? json.EWS.o_costcenters : "";
        if (!Object.isEmpty(showCC)) {
            this.showCC = true;
            if (Object.isEmpty(this.costCenters))
                this._getCostCenters();
            else
                this._buildTimesheet();
        }
        else
            this._buildTimesheet();
    },
    /**
    * @description Shows a timesheet
    */
    _buildTimesheet: function() {
        if (this.comeFrom == "inbox") {
            this._buildTimesheet_read();
        }
        else {
            var json = this.currentTimesheet;
            this._getDWS(json);
            this._getTimesheetEvents(json);
            if (this.firstRun && Object.isEmpty(this.buttons)) {
                var buttons = objectToArray(json.EWS.o_screen_buttons.yglui_str_wid_button);
                this.buttonsFromService = new Hash();
                for (var i = 0; i < buttons.length; i++)
                    this.buttonsFromService.set(buttons[i]['@action'].split('_')[2], buttons[i]);
            }
            this.retroDate = Date.parseExact(json.EWS.o_retro_date, 'yyyy-MM-dd').moveToFirstDayOfMonth();
            this.futureDate = Date.parseExact(json.EWS.o_future_date, 'yyyy-MM-dd').moveToLastDayOfMonth();
            this.currentDate = Date.parseExact(json.EWS.o_begda_i, 'yyyy-MM-dd');
            this.currentEndDate = Date.parseExact(json.EWS.o_endda_i, 'yyyy-MM-dd');
            this.monthly = false;
            if (this.currentDate.equals(this.currentDate.clone().moveToFirstDayOfMonth()) && this.currentEndDate.equals(this.currentEndDate.clone().moveToLastDayOfMonth()))
                this.monthly = true;
            this._buildInitialTimesheet();
            this._fillEvents();
            this._enableUpperForm();
            // Disabling buttons in case we are out of the retro/future dates
            if ((this.currentDate.isBefore(this.retroDate) || this.currentEndDate.isAfter(this.futureDate)) && (!Object.isEmpty(this.buttons))) {
                this.buttons.disable('applicationtimeSheet_saveButton');
                this.buttons.disable('applicationtimeSheet_submitButton');
            }
        }
    },
    /**
    * @description Shows a timesheet. Read only mode timesheet
    */
    _buildTimesheet_read: function() {
        var json = this.currentTimesheet;
        this._getDWS(json);
        this._getTimesheetEvents(json);
        this.retroDate = Date.parseExact(json.EWS.o_retro_date, 'yyyy-MM-dd').moveToFirstDayOfMonth();
        this.futureDate = Date.parseExact(json.EWS.o_future_date, 'yyyy-MM-dd').moveToLastDayOfMonth();
        this.currentDate = Date.parseExact(json.EWS.o_begda_i, 'yyyy-MM-dd');
        this.currentEndDate = Date.parseExact(json.EWS.o_endda_i, 'yyyy-MM-dd');
        this.monthly = false;
        if (this.currentDate.equals(this.currentDate.clone().moveToFirstDayOfMonth()) && this.currentEndDate.equals(this.currentEndDate.clone().moveToLastDayOfMonth()))
            this.monthly = true;
        this._buildInitialTimesheet_read();
        this._fillEvents();
        this._enableUpperForm_read();
    },
    /**
    * @description Obtains the workschedule information from GET_TIMESHEET's response
    * @param {JSON} json Information from GET_TIMESHEET service
    */
    _getDWS: function(json) {
        this.workschedule = new Hash();
        if (!Object.isEmpty(json)) {
            if (!Object.isEmpty(json.EWS.o_workschedules)) {
                var workschedule = objectToArray(json.EWS.o_workschedules.yglui_str_dailyworkschedule);
                var length = workschedule.length;
                for (var i = 0; i < length; i++) {
                    var info = new Hash();
                    info.set('dws', workschedule[i]['@daily_wsc']);
                    info.set('hours', workschedule[i]['@stdaz']);
                    this.workschedule.set(workschedule[i]['@workschedule_id'], info);
                }
            }
        }
    },
    /**
    * @description Obtains the timesheet's events from GET_TIMESHEET's response
    * @param {JSON} json Information from GET_TIMESHEET service
    */
    _getTimesheetEvents: function(json) {
        this.currentTimesheet = new Hash();
        if (!Object.isEmpty(json)) {
            if (!Object.isEmpty(json.EWS.o_field_values)) {
                var events = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
                var length = events.length;
                for (var i = 0; i < length; i++) {
                    var index = "";
                    var properties = objectToArray(events[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                    var eventProperties = new Hash();
                    var length2 = properties.length;
                    for (var j = 0; j < length2; j++) {
                        var subindex = Object.isEmpty(properties[j]['@fieldtechname']) ? properties[j]['@fieldid'] : properties[j]['@fieldtechname'];
                        if (subindex == 'BEGDA')
                            index = properties[j]['@value'];
                        eventProperties.set(subindex, {
                            'text': properties[j]['#text'],
                            'label': properties[j]['@fieldlabel'],
                            'techname': properties[j]['@fieldtechname'],
                            'seqnr': properties[j]['@fieldseqnr'],
                            'value': properties[j]['@value']
                        });
                    }
                    var eventId = events[i].contents.yglui_str_wid_content['@key_str'];
                    eventProperties.set('ID', eventId);
                    if (Object.isEmpty(this.currentTimesheet.get(index))) {
                        var eventArray = new Array();
                        this.currentTimesheet.set(index, eventArray);
                    }
                    this.currentTimesheet.get(index).push(eventProperties);
                }
            }
        }
    },
    /**
    * @description Changes the timesheet's date and reloads it if needed
    * @param {Date} newDate New timesheet's date
    */
    _dateChange: function(newDate) {
        var change = true;
        if (newDate.between(this.currentDate, this.currentEndDate))
            change = false;
        if (change)
            this._getTimesheet(this.currentUser.id, newDate);
    },
    /**
    * @description When the user clicks on today button, if we are not viewing "today" timesheet, load it
    */
    _clickOnToday: function() {
        var newDate = new Date();
        this._dateChange(newDate);
    },
    /**
    * @description Asks the backend for the timesheet's time types
    */
    _getTimeTypes: function() {
        var userIdentifier = '';
        if (this.comeFrom == 'inbox')
            userIdentifier = this.requesterId;
        else
            userIdentifier = this.currentUser.id;
        var xml = "<EWS>" +
                      "<SERVICE>" + this.getSubtypesService + "</SERVICE>" +
                      "<OBJECT TYPE='P'>" + userIdentifier + "</OBJECT>" +
                      "<PARAM>" +
                          "<APPID>TSH_MGMT</APPID>" +
                      "</PARAM>" +
                      "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_saveTimeTypes' }));
    },
    /**
    * @description Obtains the timesheet's timetypes from GET_SUBTYPES2's response
    * @param {JSON} json Information from GET_SUBTYPES2 service
    */
    _saveTimeTypes: function(json) {
        var userIdentifier = '';
        if (this.comeFrom == 'inbox')
            userIdentifier = this.requesterId;
        else
            userIdentifier = this.currentUser.id;
        if (!Object.isEmpty(json)) {
            if (!Object.isEmpty(json.EWS.o_values)) {
                var timeTypes = json.EWS.o_values.item;
                var length = timeTypes.length;
                // Initial autocompleter structure
                var jsonAutocompleter = { autocompleter: {
                    object: [],
                    multilanguage: {
                        no_results: global.getLabel('noresults'),
                        search: global.getLabel('search')
                    }
                }
                };
                for (var i = 0; i < length; i++) {
                    jsonAutocompleter.autocompleter.object.push({
                        data: timeTypes[i]['@id'],
                        text: timeTypes[i]['@value']
                    });
                }
                this.timeTypes.set(userIdentifier, jsonAutocompleter);
                this._getTimesheet(userIdentifier, this.currentDate);
            }
        }
    },
    /**  
    * @description Builds the initial screen using the workschedule. Read only mode timesheet
    */
    _buildInitialTimesheet_read: function() {
        // Setting up table header
        if (!this.headedInserted_read) {
            var html = "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text applicationtimeSheet_read_element_targetDiv";
            if (!this.showCC)
                html += "_noCC";
            html += "'></div>" +
                        "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text applicationtimeSheet_read_element_dateDiv";
            if (!this.showCC)
                html += "_noCC";
            html += "'>" + global.getLabel('date') + "</div>" +
                        "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text applicationtimeSheet_read_element_statusDiv";
            if (!this.showCC)
                html += "_noCC";
            html += "'>" + global.getLabel('status') + "</div>" +
                        "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text applicationtimeSheet_read_element_typeDiv";
            if (!this.showCC)
                html += "_noCC";
            html += "'>" + global.getLabel('timeType') + "</div>";
            if (this.showCC)
                html += "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text applicationtimeSheet_read_element_costDiv'>" + global.getLabel('costcenter') + "</div>";
            html += "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text applicationtimeSheet_read_element_hoursDiv";
            if (!this.showCC)
                html += "_noCC";
            html += "'>#" + global.getLabel('hours') + "</div>" +
                        "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text'>" + global.getLabel('comment') + "</div>";
            this.virtualHtml.down('[id=applicationtimeSheet_read_tableHeader]').insert(html);
            this.headedInserted_read = true;
        }
        // Number of days
        if (this.monthly)
            this.days = Date.getDaysInMonth(parseInt(this.currentDate.toString('yyyy')), parseInt(this.currentDate.toString('M')) - 1);
        else {
            // Number of milliseconds in one day
            var msOneDay = 1000 * 60 * 60 * 24;
            // Convert dates to milliseconds
            var msCurrentDate = this.currentDate.getTime();
            var msCurrentEndDate = this.currentEndDate.getTime();
            // Calculate the difference in milliseconds
            var msDifference = msCurrentEndDate - msCurrentDate;
            // Convert back to days
            this.days = Math.round(msDifference / msOneDay) + 1;
        }
        var date = this.currentDate.clone();
        // This is for storing 
        //    * the next index (i) for events having the same date (pernr_date_i)
        //    * an array with event's indexes for the same date
        this.dateCounter = new Hash();
        // Storing autocompleters
        this.timeTypeAutocompleters = new Hash();
        if (this.showCC)
            this.costCenterAutocompleters = new Hash();
        for (var i = 0; i < this.days; i++) {
            var stringDate = date.toString(this.dateFormat);
            var workschedule = this.workschedule.get(stringDate).get('dws');
            var hours = this.workschedule.get(stringDate).get('hours');
            this._addInitialRow_read(date, workschedule, hours);
            var properties = new Hash();
            properties.set('nextIndex', 1);
            var indexes = new Array();
            indexes.push(0);
            properties.set('indexes', indexes);
            this.dateCounter.set(stringDate, properties);
            date.addDays(1);
        }
    },
    /**
    * @description Builds the initial screen using the workschedule
    */
    _buildInitialTimesheet: function() {
        // Setting up table header
        if (!this.headedInserted) {
            var html = "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text applicationtimeSheet_element_targetDiv";
            if (!this.showCC)
                html += "_noCC";
            html += "'></div>" +
                        "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text applicationtimeSheet_element_dateDiv";
            if (!this.showCC)
                html += "_noCC";
            html += "'>" + global.getLabel('date') + "</div>" +
                        "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text applicationtimeSheet_element_statusDiv";
            if (!this.showCC)
                html += "_noCC";
            html += "'>" + global.getLabel('status') + "</div>" +
                        "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text applicationtimeSheet_element_typeDiv";
            if (!this.showCC)
                html += "_noCC";
            html += "'>" + global.getLabel('timeType') + "</div>";
            if (this.showCC)
                html += "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text applicationtimeSheet_element_costDiv'>" + global.getLabel('costcenter') + "</div>";
            html += "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text applicationtimeSheet_element_hoursDiv";
            if (!this.showCC)
                html += "_noCC";
            html += "'>#" + global.getLabel('hours') + "</div>" +
                        "<div class='applicationtimeSheet_element_titleDiv application_main_soft_text'>" + global.getLabel('comment') + "</div>";
            this.virtualHtml.down('[id=applicationtimeSheet_tableHeader]').insert(html);
            this.headedInserted = true;
        }
        // Inserting buttons
        if (this.firstRun && Object.isEmpty(this.buttons)) {
            var jsonButtons = { elements: [] };
            var submitButton = this.buttonsFromService.get('SUBMIT');
            var button = {
                idButton: 'applicationtimeSheet_' + submitButton['@action'].split('_')[2].toLowerCase() + 'Button',
                label: submitButton['@label_tag'],
                type: 'button',
                standardButton: true,
                className: 'applicationtimeSheet_buttonDiv',
                handlerContext: null,
                handler: this._timesheetAction.bind(this, submitButton)
            };
            jsonButtons.elements.push(button);
            var saveButton = this.buttonsFromService.get('SAVE');
            button = {
                idButton: 'applicationtimeSheet_' + saveButton['@action'].split('_')[2].toLowerCase() + 'Button',
                label: saveButton['@label_tag'],
                type: 'button',
                standardButton: true,
                className: 'applicationtimeSheet_buttonDiv',
                handlerContext: null,
                handler: this._timesheetAction.bind(this, saveButton)
            };
            jsonButtons.elements.push(button);
            this.buttons = new megaButtonDisplayer(jsonButtons);
            this.virtualHtml.down('[id=applicationtimeEntryScreen_buttonsDiv]').insert(this.buttons.getButtons());
        }
        // Number of days
        if (this.monthly)
            this.days = Date.getDaysInMonth(parseInt(this.currentDate.toString('yyyy')), parseInt(this.currentDate.toString('M')) - 1);
        else {
            // Number of milliseconds in one day
            var msOneDay = 1000 * 60 * 60 * 24;
            // Convert dates to milliseconds
            var msCurrentDate = this.currentDate.getTime();
            var msCurrentEndDate = this.currentEndDate.getTime();
            // Calculate the difference in milliseconds
            var msDifference = msCurrentEndDate - msCurrentDate;
            // Convert back to days
            this.days = Math.round(msDifference / msOneDay) + 1;
        }
        var date = this.currentDate.clone();
        // This is for storing 
        //    * the next index (i) for events having the same date (pernr_date_i)
        //    * an array with event's indexes for the same date
        this.dateCounter = new Hash();
        // Storing autocompleters
        this.timeTypeAutocompleters = new Hash();
        if (this.showCC)
            this.costCenterAutocompleters = new Hash();
        for (var i = 0; i < this.days; i++) {
            var stringDate = date.toString(this.dateFormat);
            var workschedule = this.workschedule.get(stringDate).get('dws');
            var hours = this.workschedule.get(stringDate).get('hours');
            this._addInitialRow(date, workschedule, hours);
            var properties = new Hash();
            properties.set('nextIndex', 1);
            var indexes = new Array();
            indexes.push(0);
            properties.set('indexes', indexes);
            this.dateCounter.set(stringDate, properties);
            date.addDays(1);
        }
    },
    /** 
    * @description Adds a row (with initial information) in the timesheet. Read only mode
    * @param {Date} date Event's date
    * @param {String} dws Event's workschedule
    * @param {String} hours Event's target hours
    */
    _addInitialRow_read: function(date, dws, hours) {
        var inDateRange = date.between(this.retroDate, this.futureDate);
        var stringDate = date.toString(this.dateFormat);
        var rowId = this.requesterId + "_" + stringDate + "_0";
        var html = "<tr id='" + rowId + "' class='applicationtimeSheet_tableRow";
        if (dws == 'FREE')
            html += " applicationtimeSheet_festivity";
        html += "'>" +
                   "<td id='applicationtimeSheet_target_" + rowId + "' class='applicationtimeSheet_element_target application_main_soft_text' title='" + global.getLabel('target') + "'>" + hours + "</td>" +
                   "<td id='applicationtimeSheet_read_date_" + rowId + "' class='applicationtimeSheet_element_date";
        if (!this.showCC)
            html += "_noCC";
        if (!inDateRange)
            html += " application_main_soft_text";
        html += "'>" + date.toString('dd.MM.yyyy') + "</td>" +
                    "<td id='applicationtimeSheet_read_status_" + rowId + "' class='applicationtimeSheet_element_status'></td>" +
                    "<td id='applicationtimeSheet_read_timeType_" + rowId + "' class='applicationtimeSheet_element_type";
        if (inDateRange)
            html += "'><div id='applicationtimeSheet_read_timeTypeDiv_" + rowId + "'></div>";
        else
            html += " applicationtimeSheet_softText'>------------------------------";
        html += "</td>";
        if (this.showCC) {
            html += "<td id='applicationtimeSheet_read_costCenter_" + rowId + "' class='applicationtimeSheet_element_cost";
            if (inDateRange)
                html += "'><div id='applicationtimeSheet_read_costCenterDiv_" + rowId + "'></div>";
            else
                html += " applicationtimeSheet_softText'>------------------------------";
            html += "</td>";
        }
        html += "<td id='applicationtimeSheet_read_hours_" + rowId + "' class='applicationtimeSheet_element_hours";
        if (!inDateRange)
            html += " applicationtimeSheet_softText'>---------";
        else
            html += " applicationtimeSheet_softText'>";
        html += "</td>" +
                    "<td id='applicationtimeSheet_read_comment_" + rowId + "' class='applicationtimeSheet_element_comment";
        if (!this.showCC)
            html += "_noCC";
        if (inDateRange) {
            html += " applicationtimeSheet_softText'>";
        }
        else
            html += " applicationtimeSheet_softText'>--------------------------------";
        html += "</td>" +
                    "</tr>";
        this.table_read.insert(html);
    },
    /**
    * @description Adds a row (with initial information) in the timesheet
    * @param {Date} date Event's date
    * @param {String} dws Event's workschedule
    * @param {String} hours Event's target hours
    */
    _addInitialRow: function(date, dws, hours) {
        var inDateRange = date.between(this.retroDate, this.futureDate);
        var stringDate = date.toString(this.dateFormat);
        var rowId = this.currentUser.id + "_" + stringDate + "_0";
        var html = "<tr id='" + rowId + "' class='applicationtimeSheet_tableRow";
        if (dws == 'FREE')
            html += " applicationtimeSheet_festivity";
        html += "'>" +
                   "<td id='applicationtimeSheet_target_" + rowId + "' class='applicationtimeSheet_element_target application_main_soft_text' title='" + global.getLabel('target') + "'>" + hours + "</td>" +
                   "<td id='applicationtimeSheet_date_" + rowId + "' class='applicationtimeSheet_element_date";
        if (!this.showCC)
            html += "_noCC";
        if (!inDateRange)
            html += " application_main_soft_text";
        html += "'>" + date.toString('dd.MM.yyyy') + "</td>" +
                    "<td id='applicationtimeSheet_status_" + rowId + "' class='applicationtimeSheet_element_status'></td>" +
                    "<td id='applicationtimeSheet_timeType_" + rowId + "' class='applicationtimeSheet_element_type";
        if (inDateRange)
            html += "'><div id='applicationtimeSheet_timeTypeDiv_" + rowId + "'></div>";
        else
            html += " applicationtimeSheet_softText'>------------------------------";
        html += "</td>";
        if (this.showCC) {
            html += "<td id='applicationtimeSheet_costCenter_" + rowId + "' class='applicationtimeSheet_element_cost";
            if (inDateRange)
                html += "'><div id='applicationtimeSheet_costCenterDiv_" + rowId + "'></div>";
            else
                html += " applicationtimeSheet_softText'>------------------------------";
            html += "</td>";
        }
        html += "<td id='applicationtimeSheet_hours_" + rowId + "' class='applicationtimeSheet_element_hours";
        if (!inDateRange)
            html += " applicationtimeSheet_softText'>---------";
        else
            html += "'><input id='applicationtimeSheet_hoursInput_" + rowId + "' type='text' class='applicationtimeSheet_element_hoursInput fieldDisplayer_input' />";
        html += "</td>" +
                    "<td id='applicationtimeSheet_comment_" + rowId + "' class='applicationtimeSheet_element_comment";
        if (!this.showCC)
            html += "_noCC";
        if (inDateRange) {
            html += "'><input id='applicationtimeSheet_commentInput_" + rowId + "' type='text' class='fieldDisplayer_input applicationtimeSheet_element_commentsInput";
            if (!this.showCC)
                html += "_noCC";
            html += "' />";
        }
        else
            html += " applicationtimeSheet_softText'>--------------------------------";
        html += "</td>" +
                    "<td id='applicationtimeSheet_copy_" + rowId + "' class='applicationtimeSheet_element_copy";
        if (!this.showCC)
            html += "_noCC";
        html += "'>";
        if (inDateRange)
            html += "<div id='applicationtimeSheet_copyDiv_" + rowId + "' title='" + this.copyLabel + "' class='application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'></div>";
        html += "</td>" +
                    "<td id='applicationtimeSheet_paste_" + rowId + "' class='applicationtimeSheet_element_paste";
        if (!this.showCC)
            html += "_noCC";
        html += "'>";
        if (inDateRange)
            html += "<div id='applicationtimeSheet_pasteDiv_" + rowId + "' title='" + this.pasteLabel + "' class='application_pasteIcon applicationtimeSheet_element_centeredPaste'></div>";
        html += "</td>" +
                    "<td id='applicationtimeSheet_add_" + rowId + "' class='applicationtimeSheet_element_add";
        if (!this.showCC)
            html += "_noCC";
        html += "'>";
        if (inDateRange)
            html += "<span id='applicationtimeSheet_addSpan_" + rowId + "' title='" + this.addLabel + "' class='applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'> + </span>";
        html += "</td>" +
                    "<td id='applicationtimeSheet_remove_" + rowId + "' class='applicationtimeSheet_element_remove";
        if (!this.showCC)
            html += "_noCC";
        html += "'>";
        if (inDateRange)
            html += "<span id='applicationtimeSheet_removeSpan_" + rowId + "' title='" + this.removeLabel + "' class='applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'></span>";
        html += "</td>" +
                    "</tr>";
        this.table.insert(html);
        if (inDateRange) {
            var timeTypeAutocompleter = new JSONAutocompleter('applicationtimeSheet_timeTypeDiv_' + rowId, {
                showEverythingOnButtonClick: true,
                timeout: 1000,
                templateResult: '#{text}',
                templateOptionsList: '#{text}',
                minChars: 1
            }, this.timeTypes.get(this.currentUser.id));
            if (this.showCC)
                this.table.down("[id=text_area_applicationtimeSheet_timeTypeDiv_" + rowId + "]").addClassName('applicationtimeSheet_autocompleter');
            else
                this.table.down("[id=text_area_applicationtimeSheet_timeTypeDiv_" + rowId + "]").addClassName('applicationtimeSheet_autocompleter_noCC');
            this.timeTypeAutocompleters.set(rowId, timeTypeAutocompleter);
            if (this.showCC) {
                var costCenterAutocompleter = new JSONAutocompleter('applicationtimeSheet_costCenterDiv_' + rowId, {
                    showEverythingOnButtonClick: true,
                    timeout: 1000,
                    templateResult: '#{text}',
                    templateOptionsList: '#{text}',
                    minChars: 1
                }, this.costCenters);
                this.table.down("[id=text_area_applicationtimeSheet_costCenterDiv_" + rowId + "]").addClassName('applicationtimeSheet_autocompleter');
                this.costCenterAutocompleters.set(rowId, costCenterAutocompleter);
            }
        }
    },
    /**
    * @description Adds an empty row in the timesheet
    * @param {String} rowId Previous row's id
    */
    _addRow: function(rowId) {
        var row = this.table.down("[id=" + rowId + "]");
        var stringDate = rowId.split('_')[1];
        var dateCounter = this.dateCounter.get(stringDate).get('nextIndex');
        var newRowId = this.currentUser.id + "_" + stringDate + "_" + dateCounter;
        this.dateCounter.get(stringDate).set('nextIndex', dateCounter + 1);
        var position = row.rowIndex + 1;
        var newRow = this.table.insertRow(position);
        newRow.id = newRowId;
        newRow.className = 'applicationtimeSheet_tableRow';
        if (row.hasClassName('applicationtimeSheet_festivity'))
            newRow.className = 'applicationtimeSheet_festivity applicationtimeSheet_tableRow';
        if (row.hasClassName('applicationtimeSheet_collision'))
            newRow.className = 'applicationtimeSheet_collision applicationtimeSheet_tableRow';
        var html = "<td id='applicationtimeSheet_target_" + newRowId + "' class='applicationtimeSheet_element_target application_main_soft_text' title='" + global.getLabel('target') + "'></td>" +
                       "<td id='applicationtimeSheet_date_" + newRowId + "' class='applicationtimeSheet_element_date";
        if (!this.showCC)
            html += "_noCC";
        html += "'></td>" +
                    "<td id='applicationtimeSheet_status_" + newRowId + "' class='applicationtimeSheet_element_status'></td>" +
                    "<td id='applicationtimeSheet_timeType_" + newRowId + "' class='applicationtimeSheet_element_type'>" +
                        "<div id='applicationtimeSheet_timeTypeDiv_" + newRowId + "'></div>" +
                    "</td>";
        if (this.showCC)
            html += "<td id='applicationtimeSheet_costCenter_" + newRowId + "' class='applicationtimeSheet_element_cost'>" +
                            "<div id='applicationtimeSheet_costCenterDiv_" + newRowId + "'></div>" +
                        "</td>";
        html += "<td id='applicationtimeSheet_hours_" + newRowId + "' class='applicationtimeSheet_element_hours'>" +
                        "<input id='applicationtimeSheet_hoursInput_" + newRowId + "' type='text' class='applicationtimeSheet_element_hoursInput fieldDisplayer_input' />" +
                    "</td>" +
                    "<td id='applicationtimeSheet_comment_" + newRowId + "' class='applicationtimeSheet_element_comment";
        if (!this.showCC)
            html += "_noCC";
        html += "'><input id='applicationtimeSheet_commentInput_" + newRowId + "' type='text' class='fieldDisplayer_input applicationtimeSheet_element_commentsInput";
        if (!this.showCC)
            html += "_noCC";
        html += "' />" +
                    "</td>" +
                    "<td id='applicationtimeSheet_copy_" + newRowId + "' class='applicationtimeSheet_element_copy";
        if (!this.showCC)
            html += "_noCC";
        html += "'>" +
                        "<div id='applicationtimeSheet_copyDiv_" + newRowId + "' title='" + this.copyLabel + "' class='application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'></div>" +
                    "</td>" +
                    "<td id='applicationtimeSheet_paste_" + newRowId + "' class='applicationtimeSheet_element_paste";
        if (!this.showCC)
            html += "_noCC";
        html += "'>" +
                        "<div id='applicationtimeSheet_pasteDiv_" + newRowId + "' title='" + this.pasteLabel + "' class='application_pasteIcon applicationtimeSheet_element_centeredPaste'></div>" +
                    "</td>" +
                    "<td id='applicationtimeSheet_add_" + newRowId + "' class='applicationtimeSheet_element_add";
        if (!this.showCC)
            html += "_noCC";
        html += "'>" +
                        "<span id='applicationtimeSheet_addSpan_" + newRowId + "' title='" + this.addLabel + "' class='applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'> + </span>" +
                    "</td>" +
                    "<td id='applicationtimeSheet_remove_" + newRowId + "' class='applicationtimeSheet_element_remove";
        if (!this.showCC)
            html += "_noCC";
        html += "'>" +
                        "<span id='applicationtimeSheet_removeSpan_" + newRowId + "' title='" + this.removeLabel + "' class='applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'> – </span>" +
                    "</td>";
        this.table.down('[id=' + newRowId + ']').insert(html);
        var timeTypeAutocompleter = new JSONAutocompleter('applicationtimeSheet_timeTypeDiv_' + newRowId, {
            showEverythingOnButtonClick: true,
            timeout: 1000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1
        }, this.timeTypes.get(this.currentUser.id));
        if (this.showCC)
            this.table.down("[id=text_area_applicationtimeSheet_timeTypeDiv_" + newRowId + "]").addClassName('applicationtimeSheet_autocompleter');
        else
            this.table.down("[id=text_area_applicationtimeSheet_timeTypeDiv_" + newRowId + "]").addClassName('applicationtimeSheet_autocompleter_noCC');
        this.timeTypeAutocompleters.set(newRowId, timeTypeAutocompleter);
        if (this.showCC) {
            var costCenterAutocompleter = new JSONAutocompleter('applicationtimeSheet_costCenterDiv_' + newRowId, {
                showEverythingOnButtonClick: true,
                timeout: 1000,
                templateResult: '#{text}',
                templateOptionsList: '#{text}',
                minChars: 1
            }, this.costCenters);
            this.table.down("[id=text_area_applicationtimeSheet_costCenterDiv_" + newRowId + "]").addClassName('applicationtimeSheet_autocompleter');
            this.costCenterAutocompleters.set(newRowId, costCenterAutocompleter);
        }
        var indexes = this.dateCounter.get(stringDate).get('indexes');
        var prevIndex = parseInt(rowId.split('_')[2]);
        indexes.splice(indexes.indexOf(prevIndex) + 1, 0, dateCounter);
        if ((row.down('[id=applicationtimeSheet_hoursInput_' + rowId + ']')) && (row.down('[id=applicationtimeSheet_removeSpan_' + rowId + ']').innerHTML == ""))
            row.down('[id=applicationtimeSheet_removeSpan_' + rowId + ']').insert(" – ");
    },
    /**
    * @description Removes a row from the timesheet
    * @param {String} rowId Row's id
    */
    _removeRow: function(rowId) {
        var row = this.table.down("[id=" + rowId + "]");
        var rowInfo = rowId.split('_');
        var stringDate = rowInfo[1];
        var rowIndex = parseInt(rowInfo[2]);
        var indexes = this.dateCounter.get(stringDate).get('indexes');
        var index = indexes.indexOf(rowIndex);
        this.timeTypeAutocompleters.unset(rowId);
        if (this.showCC)
            this.costCenterAutocompleters.unset(rowId);
        var position = row.rowIndex;
        // First row (contains the date)
        if (index == 0) {
            var nextRowId = rowInfo[0] + "_" + stringDate + "_" + indexes[1];
            this.table.down("[id=applicationtimeSheet_target_" + nextRowId + "]").update(row.down("[id=applicationtimeSheet_target_" + rowId + "]").innerHTML);
            this.table.down("[id=applicationtimeSheet_date_" + nextRowId + "]").update(row.down("[id=applicationtimeSheet_date_" + rowId + "]").innerHTML);
            this.table.deleteRow(position);
            indexes = indexes.without(rowIndex);
            this.dateCounter.get(stringDate).set('indexes', indexes);
            if (indexes.length == 1)
                this.table.down('[id=applicationtimeSheet_removeSpan_' + nextRowId + ']').update("");
        }
        // Other row
        else {
            this.table.deleteRow(position);
            indexes = indexes.without(rowIndex);
            this.dateCounter.get(stringDate).set('indexes', indexes);
            if (indexes.length == 1) {
                var firstRowId = rowInfo[0] + "_" + stringDate + "_" + indexes[0];
                this.table.down('[id=applicationtimeSheet_removeSpan_' + firstRowId + ']').update("");
            }
        }
    },
    /**
    * @description Resets the application clipboard hash
    */
    _resetClipboard: function() {
        this.clipboard.set('timeType', '');
        if (this.showCC)
            this.clipboard.set('costCenter', '');
        this.clipboard.set('hours', '');
        this.clipboard.set('comment', '');
    },
    /**
    * @description Copies a row's information
    * @param {String} rowId Row's id
    */
    _copyRow: function(rowId) {
        //var row = this.table.down("[id=" + rowId + "]");
        // Problem with FF3.5 & Prototype -> can't do row.down(), so we'll do table.down()
        var searchFrom = Prototype.Browser.IE ? this.table.down('[id=' + rowId + ']') : this.table;
        // Editable event
        if (searchFrom.down('[id=applicationtimeSheet_hoursInput_' + rowId + ']')) {
            var autocompleterInfo = this.timeTypeAutocompleters.get(rowId).getValue();
            if (!Object.isEmpty(autocompleterInfo))
                this.clipboard.set('timeType', unescape(this.timeTypeAutocompleters.get(rowId).getValue().textAdded));
            else
                this.clipboard.set('timeType', "");
            if (this.showCC) {
                autocompleterInfo = this.costCenterAutocompleters.get(rowId).getValue();
                if (!Object.isEmpty(autocompleterInfo))
                    this.clipboard.set('costCenter', unescape(this.costCenterAutocompleters.get(rowId).getValue().textAdded));
                else
                    this.clipboard.set('costCenter', "");
            }
            this.clipboard.set('hours', searchFrom.down("[id=applicationtimeSheet_hoursInput_" + rowId + "]").value);
            this.clipboard.set('comment', searchFrom.down("[id=applicationtimeSheet_commentInput_" + rowId + "]").value);
        }
        // Not editable event
        else {
            this.clipboard.set('timeType', searchFrom.down("[id=applicationtimeSheet_timeType_" + rowId + "]").innerHTML);
            if (this.showCC)
                this.clipboard.set('costCenter', searchFrom.down("[id=applicationtimeSheet_costCenter_" + rowId + "]").innerHTML);
            this.clipboard.set('hours', searchFrom.down("[id=applicationtimeSheet_hours_" + rowId + "]").innerHTML.gsub('&nbsp;', ''));
            this.clipboard.set('comment', searchFrom.down("[id=applicationtimeSheet_comment_" + rowId + "]").innerHTML);
        }
    },
    /**
    * @description Pastes into a row the timesheet clipboard's content
    * @param {String} rowId Row's id
    */
    _pasteRow: function(rowId) {
        if (this.clipboard.get('timeType') != "") {
            //var row = this.table.down("[id=" + rowId + "]");
            // Problem with FF3.5 & Prototype -> can't do row.down(), so we'll do table.down()
            var searchFrom = Prototype.Browser.IE ? this.table.down('[id=' + rowId + ']') : this.table;
            this.timeTypeAutocompleters.get(rowId).setDefaultValue(this.clipboard.get('timeType'), true, false);
            if (this.showCC)
                this.costCenterAutocompleters.get(rowId).setDefaultValue(this.clipboard.get('costCenter'), true, false);
            searchFrom.down("[id=applicationtimeSheet_hoursInput_" + rowId + "]").value = this.clipboard.get('hours');
            searchFrom.down("[id=applicationtimeSheet_commentInput_" + rowId + "]").value = this.clipboard.get('comment');
        }
    },
    /**
    * @description Changes the timesheet to the previous/next one
    * @param {Number} next Timesheet we want to show: -1 -> previous; 1 -> next; 3 -> 3rd next
    */
    _changeTimesheet: function(next) {
        var newDate = this.currentDate.clone();
        if (this.monthly)
            newDate.addMonths(1 * next);
        else
            newDate.addDays(this.days * next);
        this._dateChange(newDate);
    },
    /**
    * @description Enables upper form events and sets its date. Read only mode timesheet
    */
    _enableUpperForm_read: function() {
        var dateTitle;
        if (this.monthly)
            dateTitle = global.getLabel(this.currentDate.toString('MMM').toLowerCase() + 'Month') + " " + this.currentDate.toString('yyyy');
        else {
            dateTitle = this.currentDate.toString(global.dateFormat) + " - " + this.currentEndDate.toString(global.dateFormat);
        }
        this.header_read.down('[id=applicationtimeSheet_read_currentDate]').update(dateTitle);
    },
    /** 
    * @description Disables upper form events and resets its date. Read only mode timesheet
    */
    _disableUpperForm_read: function() {
        this.table_read.update('');
        this.header_read.down('[id=applicationtimeSheet_read_currentDate]').update('');
    },
    /**
    * @description Enables upper form events and sets its date
    */
    _enableUpperForm: function() {
        this.header.down('[id=applicationtimeSheet_prevButton]').observe('click', this._changeTimesheet.bind(this, -1));
        this.header.down('[id=applicationtimeSheet_prevButton]').addClassName('application_handCursor');
        this.header.down('[id=applicationtimeSheet_postButton]').observe('click', this._changeTimesheet.bind(this, 1));
        this.header.down('[id=applicationtimeSheet_postButton]').addClassName('application_handCursor');
        this.buttonTimesheet.enable('applicationtimeSheet_todayButton');
        this.buttons.enable('applicationtimeSheet_saveButton');
        this.buttons.enable('applicationtimeSheet_submitButton');
        var dateTitle;
        if (this.monthly)
            dateTitle = global.getLabel(this.currentDate.toString('MMM').toLowerCase() + 'Month') + " " + this.currentDate.toString('yyyy');
        else
            dateTitle = this.currentDate.toString(global.dateFormat) + " - " + this.currentEndDate.toString(global.dateFormat);
        this.header.down('[id=applicationtimeSheet_currentDate]').update(dateTitle);
    },
    /**
    * @description Disables upper form events and resets its date
    */
    _disableUpperForm: function() {
        this.header.down('[id=applicationtimeSheet_prevButton]').stopObserving();
        this.header.down('[id=applicationtimeSheet_prevButton]').removeClassName('application_handCursor');
        this.header.down('[id=applicationtimeSheet_postButton]').stopObserving();
        this.header.down('[id=applicationtimeSheet_postButton]').removeClassName('application_handCursor');
        this.buttonTimesheet.disable('applicationtimeSheet_todayButton');
        if (!Object.isEmpty(this.buttons)) {
            this.buttons.disable('applicationtimeSheet_saveButton');
            this.buttons.disable('applicationtimeSheet_submitButton');
        }
        this.header.down('[id=applicationtimeSheet_currentDate]').update('');
    },
    /**
    * @description Checks which element was clicked and does the proper action
    */
    _checkElement: function(event) {
        var elementId = (event.target) ? event.target.id : event.srcElement.id;
        if (!Object.isEmpty(elementId)) {
            var action = elementId.split('_')[1];
            var row = elementId.substring(elementId.indexOf(action) + action.length + 1);
            switch (action) {
                case "addSpan":
                    this._addRow(row);
                    break;
                case "removeSpan":
                    this._removeRow(row);
                    break;
                case "copyDiv":
                    this._copyRow(row);
                    break;
                case "pasteDiv":
                    this._pasteRow(row);
            }
        }
    },
    /**
    * @description Inserts into the timesheet all events received
    */
    _fillEvents: function() {
        var dateKeys = this.currentTimesheet.keys();
        var length = dateKeys.length;
        for (var i = 0; i < length; i++) {
            var events = this.currentTimesheet.get(dateKeys[i]);
            var length2 = events.length;
            for (var j = 0; j < length2; j++) {
                if (this.comeFrom == "inbox")
                    this._addFilledRow_read(events[j]);
                else
                    this._addFilledRow(events[j]);
            }
        }
    },
    /**
    * @description Adds a filled (with an event's information) row in the timesheet. Read only mode
    * @param {Hash} event Event to show
    */
    _addFilledRow_read: function(event) {
        if (Object.isEmpty(this.requestId) && (event.get('APPID').value == 'TSH_MGMT'))
            this.requestId = event.get('ID').gsub('_', '');
        var initialDate = Date.parseExact(event.get('BEGDA').value, this.dateFormat);
        var finalDate = Date.parseExact(event.get('ENDDA').value, this.dateFormat);
        var oneDayEvent = (Date.compare(initialDate, finalDate) != 0) ? false : true;
        var editable = false;
        var html = "";
        var status = parseInt(event.get('STATUS').value);
        var statusHtml = "";
        // Event info
        var hours = event.get('STDAZ').value;
        if (hours == null)
            hours = "";
        var comment = event.get('COMMENT').text;
        if (comment == null)
            comment = "";
        // Truncate time type, cost center and comment if their length is bigger than these variables
        var commentLength = 18;
        var typeAndCostLength = 20;
        // We need only days inside the timesheet's date range
        if (initialDate.isBefore(this.currentDate))
            initialDate = this.currentDate.clone();
        if (finalDate.isAfter(this.currentEndDate))
            finalDate = this.currentEndDate.clone();
        // Approved events will not be shown
        var iconClass = "";
        var iconTitle = "";
        if ((status == 20) || (status == 21) || (status == 30) || (status == 31) || (status == 10) || (status == 50)) {
            // Sent for approval
            if ((status == 20) || (status == 30)) {
                iconClass = "application_rounded_question1";
                iconTitle = this.approvalLabel;
            }
            // Sent for deletion
            if ((status == 21) || (status == 31)) {
                iconClass = "application_rounded_x1";
                iconTitle = this.deletionLabel;
            }
            // Draft
            if (status == 10) {
                iconClass = "application_rounded_draft1";
                iconTitle = this.draftLabel;
            }
            // To be discussed
            if (status == 50) {
                iconClass = 'application_rounded_ok1';
                iconTitle = this.tbpLabel;
            }
        }
        do {
            var stringDate = initialDate.clone().toString(this.dateFormat);
            var inDateRange = initialDate.between(this.retroDate, this.futureDate);
            var tableInfo = this.dateCounter.get(stringDate);
            var indexes = tableInfo.get('indexes');
            var dateCounter = indexes.last();
            var rowId = this.requesterId + "_" + stringDate + "_" + dateCounter;
            // Checking if the event lasts more than one day to distribute the number of hours
            var wscHours = this.workschedule.get(stringDate).get('hours');
            // If there are more event's hours than workSchedule hours --> event lasting more than one day
            // In that case we will show workSchedule hours as number of hours
            var dayHours = !oneDayEvent && (parseFloat(hours) > parseFloat(wscHours)) ? wscHours : hours;
            // Add a new row or replace an existing one (by default add it)
            var add = true;
            var row = this.table_read.down('[id=' + rowId + ']');
            // Problem with FF3.5 & Prototype -> can't do row.down(), so we'll do table.down()
            var searchFrom = Prototype.Browser.IE ? this.table_read.down('[id=' + rowId + ']') : this.table_read;
            // Only one row for this date -> it could be empty or not
            if (indexes.length == 1) {
                // Empty row -> Replace it for the filled one
                if (searchFrom.down('[id=applicationtimeSheet_read_hours_' + rowId + ']').innerHTML == '')
                    add = false;
            }
            var statusHtml = "<div class='";
            if (inDateRange && !Object.isEmpty(iconClass))
                statusHtml += "applicationtimeSheet_eeColor ";
            if (!inDateRange && !Object.isEmpty(iconClass))
                statusHtml += "applicationtimeSheet_eeColor2 ";
            statusHtml += "CAL_IE6_event applicationtimeSheet_element_centeredStatus";
            if (!this.showCC)
                statusHtml += "_noCC";
            statusHtml += " " + iconClass + "' title='" + iconTitle + "'>&nbsp;</div>";
            // Filled row or more than one row for this date -> add a new row
            if (add) {
                dateCounter = tableInfo.get('nextIndex');
                indexes.push(dateCounter);
                tableInfo.set('nextIndex', dateCounter + 1);
                var position = row.rowIndex + 1;
                var oldRowId = rowId;
                rowId = this.requesterId + "_" + stringDate + "_" + dateCounter;
                var newRow = this.table_read.insertRow(position);
                newRow.id = rowId;
                newRow.className = 'applicationtimeSheet_tableRow';
                if (row.hasClassName('applicationtimeSheet_festivity'))
                    newRow.className = 'applicationtimeSheet_festivity applicationtimeSheet_tableRow';
                html = "<td id='applicationtimeSheet_read_target_" + rowId + "' class='applicationtimeSheet_element_target application_main_soft_text' title='" + global.getLabel('target') + "'></td>" +
                               "<td id='applicationtimeSheet_read_date_" + rowId + "' class='applicationtimeSheet_element_date";
                if (!this.showCC)
                    html += "_noCC";
                html += "'></td>" +
                                "<td id='applicationtimeSheet_read_status_" + rowId + "' class='applicationtimeSheet_element_status'>" + statusHtml + "</td>" +
                                "<td id='applicationtimeSheet_read_timeType_" + rowId + "' class='applicationtimeSheet_element_type";
                if (!inDateRange)
                    html += " applicationtimeSheet_softText'>";
                else
                    html += "'>";
                if (editable && inDateRange)
                    html += "<div id='applicationtimeSheet_read_timeTypeDiv_" + rowId + "'></div>";
                if (this.showCC) {
                    html += "<td id='applicationtimeSheet_read_costCenter_" + rowId + "' class='applicationtimeSheet_element_cost";
                    if (!inDateRange)
                        html += " applicationtimeSheet_softText'>";
                    else
                        html += "'>";
                    if (editable && inDateRange)
                        html += "<div id='applicationtimeSheet_read_costCenterDiv_" + rowId + "'></div>";
                    html += "</td>";
                }
                html += "<td id='applicationtimeSheet_read_hours_" + rowId + "' class='applicationtimeSheet_element_hours";
                if (!inDateRange)
                    html += " applicationtimeSheet_softText'>";
                else
                    html += "'>";
                if (editable && inDateRange) {
                    html += "<div id='applicationtimeSheet_read_hoursInput_" + rowId + "' type='text' class='applicationtimeSheet_element_hoursInput fieldDisplayer_input' />";
                }
                html += "</td>" +
                                "<td id='applicationtimeSheet_read_comment_" + rowId + "' class='applicationtimeSheet_element_comment";
                if (!this.showCC)
                    html += "_noCC";
                if (!inDateRange)
                    html += " applicationtimeSheet_softText'>";
                else
                    html += "'>";
                if (editable && inDateRange) {
                    html += "<div id='applicationtimeSheet_read_commentInput_" + rowId + "' type='text' class='fieldDisplayer_input applicationtimeSheet_element_commentsInput";
                    if (!this.showCC)
                        html += "_noCC";
                    html += "' />";
                }
                html += "</td>";
                this.table_read.down('[id=' + rowId + ']').insert(html);
                row = newRow;
                // Problem with FF3.5 & Prototype -> can't do row.down(), so we'll do table.down()
                if (Prototype.Browser.IE)
                    searchFrom = newRow;
            }
            // Replacing empty row
            else {
                searchFrom.down("[id=applicationtimeSheet_read_status_" + rowId + "]").update(statusHtml);
                var timeTypeHtml = (editable && inDateRange) ? "<div id='applicationtimeSheet_read_timeTypeDiv_" + rowId + "'></div>" : "";
                searchFrom.down("[id=applicationtimeSheet_read_timeType_" + rowId + "]").update(timeTypeHtml);
                if (this.showCC) {
                    var costCenterHtml = (editable && inDateRange) ? "<div id='applicationtimeSheet_read_costCenterDiv_" + rowId + "'></div>" : "";
                    searchFrom.down("[id=applicationtimeSheet_read_costCenter_" + rowId + "]").update(costCenterHtml);
                }
                var hoursHtml = (editable && inDateRange) ? "<div id='applicationtimeSheet_read_hoursInput_" + rowId + "' type='text' class='applicationtimeSheet_element_hoursInput fieldDisplayer_input' />" : "";
                searchFrom.down("[id=applicationtimeSheet_read_hours_" + rowId + "]").update(hoursHtml);
                var commentHtml = "";
                if (editable && inDateRange) {
                    commentHtml = "<div id='applicationtimeSheet_read_commentInput_" + rowId + "' type='text' class='fieldDisplayer_input applicationtimeSheet_element_commentsInput";
                    if (!this.showCC)
                        commentHtml += "_noCC";
                    commentHtml += "' />";
                }
                searchFrom.down("[id=applicationtimeSheet_read_comment_" + rowId + "]").update(commentHtml);
            }
            // Filling fields...
            searchFrom.down("[id=applicationtimeSheet_read_timeType_" + rowId + "]").update(event.get('AWART').text.truncate(typeAndCostLength));
            searchFrom.down("[id=applicationtimeSheet_read_timeType_" + rowId + "]").writeAttribute('title', event.get('AWART').text);
            if (this.showCC) {
                if (!Object.isEmpty(event.get('KOSTL')) && !Object.isEmpty(event.get('KOSTL').text)) {
                    searchFrom.down("[id=applicationtimeSheet_read_costCenter_" + rowId + "]").update(event.get('KOSTL').text.truncate(typeAndCostLength));
                    searchFrom.down("[id=applicationtimeSheet_read_costCenter_" + rowId + "]").writeAttribute('title', event.get('KOSTL').text);
                }
            }
            searchFrom.down("[id=applicationtimeSheet_read_hours_" + rowId + "]").update("&nbsp;" + dayHours);
            searchFrom.down("[id=applicationtimeSheet_read_comment_" + rowId + "]").update(comment.capitalize().truncate(commentLength));
            if (comment.length > commentLength)
                searchFrom.down("[id=applicationtimeSheet_read_comment_" + rowId + "]").writeAttribute('title', comment);
            initialDate.addDays(1);
        } while (Date.compare(initialDate, finalDate) < 1);
    },
    /**
    * @description Adds a filled (with an event's information) row in the timesheet
    * @param {Hash} event Event to show
    */
    _addFilledRow: function(event) {
        if (Object.isEmpty(this.requestId) && (event.get('APPID').value == 'TSH_MGMT'))
            this.requestId = event.get('ID').gsub('_', '');
        var initialDate = Date.parseExact(event.get('BEGDA').value, this.dateFormat);
        var finalDate = Date.parseExact(event.get('ENDDA').value, this.dateFormat);
        var oneDayEvent = (Date.compare(initialDate, finalDate) != 0) ? false : true;
        var editable = (event.get('EDITABLE').value == 'X') ? true : false;
        var html = "";
        var status = parseInt(event.get('STATUS').value);
        var statusHtml = "";
        // Event info
        var hours = event.get('STDAZ').value;
        if (hours == null)
            hours = ""; 
        var comment = event.get('COMMENT').text;
        if (comment == null)
            comment = "";
        // Truncate time type, cost center and comment if their length is bigger than these variables
        var commentLength = 18;
        var typeAndCostLength = 20;
        // We need only days inside the timesheet's date range
        if (initialDate.isBefore(this.currentDate))
            initialDate = this.currentDate.clone();
        if (finalDate.isAfter(this.currentEndDate))
            finalDate = this.currentEndDate.clone();
        // Approved events will not be shown
        var iconClass = "";
        var iconTitle = "";
        if ((status == 20) || (status == 21) || (status == 30) || (status == 31) || (status == 10) || (status == 50)) {
            // Sent for approval
            if ((status == 20) || (status == 30)) {
                iconClass = "application_rounded_question1";
                iconTitle = this.approvalLabel;
            }
            // Sent for deletion
            if ((status == 21) || (status == 31)) {
                iconClass = "application_rounded_x1";
                iconTitle = this.deletionLabel;
            }
            // Draft
            if (status == 10) {
                iconClass = "application_rounded_draft1";
                iconTitle = this.draftLabel;
            }
            // To be discussed
            if (status == 50) {
                iconClass = 'application_rounded_ok1';
                iconTitle = this.tbpLabel;
            }
        }
        do {
            var stringDate = initialDate.clone().toString(this.dateFormat);
            var inDateRange = initialDate.between(this.retroDate, this.futureDate);
            var tableInfo = this.dateCounter.get(stringDate);
            var indexes = tableInfo.get('indexes');
            var dateCounter = indexes.last();
            var rowId = this.currentUser.id + "_" + stringDate + "_" + dateCounter;
            // Checking if the event lasts more than one day to distribute the number of hours
            var wscHours = this.workschedule.get(stringDate).get('hours');
            // If there are more event's hours than workSchedule hours --> event lasting more than one day
            // In that case we will show workSchedule hours as number of hours
            var dayHours = !oneDayEvent && (parseFloat(hours) > parseFloat(wscHours)) ? wscHours : hours;
            // Add a new row or replace an existing one (by default add it)
            var add = true;
            var row = this.table.down('[id=' + rowId + ']');
            // Problem with FF3.5 & Prototype -> can't do row.down(), so we'll do table.down()
            var searchFrom = Prototype.Browser.IE ? this.table.down('[id=' + rowId + ']') : this.table;
            // Only one row for this date -> it could be empty or not
            if (indexes.length == 1) {
                // Empty row -> Replace it for the filled one
                if ((searchFrom.down('[id=applicationtimeSheet_hours_' + rowId + ']').innerHTML.include("---")) || ((searchFrom.down('[id=applicationtimeSheet_hoursInput_' + rowId + ']')) && (Object.isEmpty(this.timeTypeAutocompleters.get(rowId).getValue()))))
                    add = false;
            }
            var statusHtml = "<div class='";
            if (inDateRange && !Object.isEmpty(iconClass))
                statusHtml += "applicationtimeSheet_eeColor ";
            if (!inDateRange && !Object.isEmpty(iconClass))
                statusHtml += "applicationtimeSheet_eeColor2 ";
            statusHtml += "CAL_IE6_event applicationtimeSheet_element_centeredStatus";
            if (!this.showCC)
                statusHtml += "_noCC";
            statusHtml += " " + iconClass + "' title='" + iconTitle + "'>&nbsp;</div>";
            // Filled row or more than one row for this date -> add a new row
            if (add) {
                dateCounter = tableInfo.get('nextIndex');
                indexes.push(dateCounter);
                tableInfo.set('nextIndex', dateCounter + 1);
                var position = row.rowIndex + 1;
                var oldRowId = rowId;
                rowId = this.currentUser.id + "_" + stringDate + "_" + dateCounter;
                var newRow = this.table.insertRow(position);
                newRow.id = rowId;
                newRow.className = 'applicationtimeSheet_tableRow';
                if (row.hasClassName('applicationtimeSheet_festivity'))
                    newRow.className = 'applicationtimeSheet_festivity applicationtimeSheet_tableRow';
                html = "<td id='applicationtimeSheet_target_" + rowId + "' class='applicationtimeSheet_element_target application_main_soft_text' title='" + global.getLabel('target') + "'></td>" +
                           "<td id='applicationtimeSheet_date_" + rowId + "' class='applicationtimeSheet_element_date";
                if (!this.showCC)
                    html += "_noCC";
                html += "'></td>" +
                            "<td id='applicationtimeSheet_status_" + rowId + "' class='applicationtimeSheet_element_status'>" + statusHtml + "</td>" +
                            "<td id='applicationtimeSheet_timeType_" + rowId + "' class='applicationtimeSheet_element_type";
                if (!inDateRange)
                    html += " applicationtimeSheet_softText'>";
                else
                    html += "'>";
                if (editable && inDateRange)
                    html += "<div id='applicationtimeSheet_timeTypeDiv_" + rowId + "'></div>";
                if (this.showCC) {
                    html += "<td id='applicationtimeSheet_costCenter_" + rowId + "' class='applicationtimeSheet_element_cost";
                    if (!inDateRange)
                        html += " applicationtimeSheet_softText'>";
                    else
                        html += "'>";
                    if (editable && inDateRange)
                        html += "<div id='applicationtimeSheet_costCenterDiv_" + rowId + "'></div>";
                    html += "</td>";
                }
                html += "<td id='applicationtimeSheet_hours_" + rowId + "' class='applicationtimeSheet_element_hours";
                if (!inDateRange)
                    html += " applicationtimeSheet_softText'>";
                else
                    html += "'>";
                if (editable && inDateRange)
                    html += "<input id='applicationtimeSheet_hoursInput_" + rowId + "' type='text' class='applicationtimeSheet_element_hoursInput fieldDisplayer_input' />";
                html += "</td>" +
                            "<td id='applicationtimeSheet_comment_" + rowId + "' class='applicationtimeSheet_element_comment";
                if (!this.showCC)
                    html += "_noCC";
                if (!inDateRange)
                    html += " applicationtimeSheet_softText'>";
                else
                    html += "'>";
                if (editable && inDateRange) {
                    html += "<input id='applicationtimeSheet_commentInput_" + rowId + "' type='text' class='fieldDisplayer_input applicationtimeSheet_element_commentsInput";
                    if (!this.showCC)
                        html += "_noCC";
                    html += "' />";
                }
                html += "</td>" +
                            "<td id='applicationtimeSheet_copy_" + rowId + "' class='applicationtimeSheet_element_copy";
                if (!this.showCC)
                    html += "_noCC";
                html += "'>" +
                                "<div id='applicationtimeSheet_copyDiv_" + rowId + "' title='" + this.copyLabel + "' class='application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'></div>" +
                            "</td>" +
                            "<td id='applicationtimeSheet_paste_" + rowId + "' class='applicationtimeSheet_element_paste";
                if (!this.showCC)
                    html += "_noCC";
                html += "'>";
                if (editable && inDateRange)
                    html += "<div id='applicationtimeSheet_pasteDiv_" + rowId + "' title='" + this.pasteLabel + "' class='application_pasteIcon applicationtimeSheet_element_centeredPaste'></div>";
                html += "</td>" +
                            "<td id='applicationtimeSheet_add_" + rowId + "' class='applicationtimeSheet_element_add";
                if (!this.showCC)
                    html += "_noCC";
                html += "'>";
                if (inDateRange)
                    html += "<span id='applicationtimeSheet_addSpan_" + rowId + "' title='" + this.addLabel + "' class='applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'> + </span>";
                html += "</td>" +
                            "<td id='applicationtimeSheet_remove_" + rowId + "' class='applicationtimeSheet_element_remove";
                if (!this.showCC)
                    html += "_noCC";
                html += "'>" +
                                "<span id='applicationtimeSheet_removeSpan_" + rowId + "' title='" + this.removeLabel + "' class='applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'>";
                if (editable && inDateRange)
                    html += " – ";
                html += "</span></td>";
                this.table.down('[id=' + rowId + ']').insert(html);
                row = newRow;
                // Problem with FF3.5 & Prototype -> can't do row.down(), so we'll do table.down()
                if (Prototype.Browser.IE)
                    searchFrom = newRow;
            }
            // Replacing empty row
            else {
                searchFrom.down("[id=applicationtimeSheet_status_" + rowId + "]").update(statusHtml);
                var timeTypeHtml = (editable && inDateRange) ? "<div id='applicationtimeSheet_timeTypeDiv_" + rowId + "'></div>" : "";
                searchFrom.down("[id=applicationtimeSheet_timeType_" + rowId + "]").update(timeTypeHtml);
                if (this.showCC) {
                    var costCenterHtml = (editable && inDateRange) ? "<div id='applicationtimeSheet_costCenterDiv_" + rowId + "'></div>" : "";
                    searchFrom.down("[id=applicationtimeSheet_costCenter_" + rowId + "]").update(costCenterHtml);
                }
                var hoursHtml = (editable && inDateRange) ? "<input id='applicationtimeSheet_hoursInput_" + rowId + "' type='text' class='applicationtimeSheet_element_hoursInput fieldDisplayer_input' />" : "";
                searchFrom.down("[id=applicationtimeSheet_hours_" + rowId + "]").update(hoursHtml);
                var commentHtml = "";
                if (editable && inDateRange) {
                    commentHtml = "<input id='applicationtimeSheet_commentInput_" + rowId + "' type='text' class='fieldDisplayer_input applicationtimeSheet_element_commentsInput";
                    if (!this.showCC)
                        commentHtml += "_noCC";
                    commentHtml += "' />";
                }
                searchFrom.down("[id=applicationtimeSheet_comment_" + rowId + "]").update(commentHtml);
            }
            // Filling editable fields...
            if (editable && inDateRange) {
                var timeTypeAutocompleter = new JSONAutocompleter('applicationtimeSheet_timeTypeDiv_' + rowId, {
                    showEverythingOnButtonClick: true,
                    timeout: 1000,
                    templateResult: '#{text}',
                    templateOptionsList: '#{text}',
                    minChars: 1
                }, this.timeTypes.get(this.currentUser.id));
                if (this.showCC)
                    this.table.down("[id=text_area_applicationtimeSheet_timeTypeDiv_" + rowId + "]").addClassName('applicationtimeSheet_autocompleter');
                else
                    this.table.down("[id=text_area_applicationtimeSheet_timeTypeDiv_" + rowId + "]").addClassName('applicationtimeSheet_autocompleter_noCC');
                this.timeTypeAutocompleters.set(rowId, timeTypeAutocompleter);
                timeTypeAutocompleter.setDefaultValue(event.get('AWART').value, false, false);
                if (this.showCC) {
                    var costCenterAutocompleter = new JSONAutocompleter('applicationtimeSheet_costCenterDiv_' + rowId, {
                        showEverythingOnButtonClick: true,
                        timeout: 1000,
                        templateResult: '#{text}',
                        templateOptionsList: '#{text}',
                        minChars: 1
                    }, this.costCenters);
                    this.table.down("[id=text_area_applicationtimeSheet_costCenterDiv_" + rowId + "]").addClassName('applicationtimeSheet_autocompleter');
                    this.costCenterAutocompleters.set(rowId, costCenterAutocompleter);
                    costCenterAutocompleter.setDefaultValue(event.get('KOSTL').value, false, false);
                }
                searchFrom.down("[id=applicationtimeSheet_hoursInput_" + rowId + "]").value = dayHours;
                searchFrom.down("[id=applicationtimeSheet_commentInput_" + rowId + "]").value = comment;
                // Adding a "-" to the previous row it is editable
                if ((add) && (this.table.down('[id=applicationtimeSheet_hoursInput_' + oldRowId + ']'))) {
                    this.table.down("[id=applicationtimeSheet_removeSpan_" + oldRowId + "]").update(" - ");
                }
            }
            // ... and not editable ones (or out of retro/future range)
            else {
                this.timeTypeAutocompleters.unset(rowId);
                searchFrom.down("[id=applicationtimeSheet_timeType_" + rowId + "]").update(event.get('AWART').text.truncate(typeAndCostLength));
                searchFrom.down("[id=applicationtimeSheet_timeType_" + rowId + "]").writeAttribute('title', event.get('AWART').text);
                if (this.showCC) {
                    if (!Object.isEmpty(event.get('KOSTL')) && !Object.isEmpty(event.get('KOSTL').text)) {
                        searchFrom.down("[id=applicationtimeSheet_costCenter_" + rowId + "]").update(event.get('KOSTL').text.truncate(typeAndCostLength));
                        searchFrom.down("[id=applicationtimeSheet_costCenter_" + rowId + "]").writeAttribute('title', event.get('KOSTL').text);
                    }
                }
                searchFrom.down("[id=applicationtimeSheet_hours_" + rowId + "]").update("&nbsp;" + dayHours);
                searchFrom.down("[id=applicationtimeSheet_comment_" + rowId + "]").update(comment.capitalize().truncate(commentLength));
                if (comment.length > commentLength)
                    searchFrom.down("[id=applicationtimeSheet_comment_" + rowId + "]").writeAttribute('title', comment);
                if (searchFrom.down("[id=applicationtimeSheet_removeSpan_" + rowId + "]"))
                    searchFrom.down("[id=applicationtimeSheet_removeSpan_" + rowId + "]").update("");
                searchFrom.down("[id=applicationtimeSheet_paste_" + rowId + "]").update("");
                if (searchFrom.down("[id=applicationtimeSheet_copy_" + rowId + "]").innerHTML == "") {
                    var htmlCopy = "<div id='applicationtimeSheet_copyDiv_" + rowId + "' title='" + this.copyLabel + "' class='application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'></div>";
                    searchFrom.down("[id=applicationtimeSheet_copy_" + rowId + "]").update(htmlCopy);
                }
                // Editable but out of retro/future range
                if (editable) {
                    searchFrom.down("[id=applicationtimeSheet_timeType_" + rowId + "]").addClassName('application_text_italic');
                    searchFrom.down("[id=applicationtimeSheet_hours_" + rowId + "]").addClassName('application_text_italic');
                    searchFrom.down("[id=applicationtimeSheet_comment_" + rowId + "]").addClassName('application_text_italic');
                }
            }
            initialDate.addDays(1);
        } while (Date.compare(initialDate, finalDate) < 1);
    },
    /**
    * @description Says to the timesheet it has to be refreshed
    */
    _refreshTimesheet: function() {
        this.refresh = true;
    },
    /**
    * @description Saves or submits a timesheet
    * @param {Hash} actionInfo Requested action and its information
    */
    _timesheetAction: function(actionInfo) {
        this._disableUpperForm();
        this.errorMessageDiv.update("");
        this.errorMessageDiv.hide();
        if (!Object.isEmpty(this.collisionDate)) {
            var collisionDate = this.collisionDate.toString(this.dateFormat);
            var rows = this.dateCounter.get(collisionDate).get('indexes');
            var length = rows.length;
            for (var i = 0; i < length; i++) {
                var rowId = this.currentUser.id + "_" + collisionDate + "_" + rows[i];
                this.table.down("[id=" + rowId + "]").removeClassName('applicationtimeSheet_collision');
            }
            this.collisionDate = null;
        }
        var timesheetEvents = "";
        this.dateCounter.each(function(date) {
            var dateString = date.key;
            var rows = date.value.get('indexes');
            var length = rows.length;
            for (var i = 0; i < length; i++) {
                var rowId = this.currentUser.id + '_' + dateString + '_' + rows[i];
                var timeTypeAutocompleter = this.timeTypeAutocompleters.get(rowId);
                var timeType = null;
                if (!Object.isEmpty(timeTypeAutocompleter)) {
                    var timeTypeAutocompleterText = this.table.down("[id=text_area_applicationtimeSheet_timeTypeDiv_" + rowId + "]").value;
                    if (!Object.isEmpty(timeTypeAutocompleterText))
                        timeType = timeTypeAutocompleter.getValue();
                }
                if (!Object.isEmpty(timeType)) {
                    if (this.showCC) {
                        var costCenterAutocompleter = this.costCenterAutocompleters.get(rowId);
                        var costCenter = "";
                        if (!Object.isEmpty(costCenterAutocompleter)) {
                            var costCenterAutocompleterText = this.table.down("[id=text_area_applicationtimeSheet_costCenterDiv_" + rowId + "]").value;
                            if (!Object.isEmpty(costCenterAutocompleterText))
                                costCenter = costCenterAutocompleter.getValue().idAdded;
                        }
                    }
                    var hours = this.table.down("[id=applicationtimeSheet_hoursInput_" + rowId + "]").value;
                    var comment = this.table.down("[id=applicationtimeSheet_commentInput_" + rowId + "]").value;
                    timesheetEvents += "<yglui_str_wid_record rec_key='' screen='1'>" +
                                               "<contents>" +
                                                   "<yglui_str_wid_content buttons='' key_str='' rec_index='1' selected='X' tcontents=''>" +
                                                       "<fields>" +
                    // We suppose 1 day timesheet events
                                                           "<yglui_str_wid_field fieldid='ABWTG' fieldlabel='Days' fieldtechname='ABWTG' fieldtseqnr='000000' value='1.00'></yglui_str_wid_field>" +
                                                           "<yglui_str_wid_field fieldid='APPID' fieldlabel='' fieldtechname='' fieldtseqnr='000000' value=''>TSH_MGMT</yglui_str_wid_field>" +
                                                           "<yglui_str_wid_field fieldid='AWART' fieldlabel='Att./Absence type' fieldtechname='AWART' fieldtseqnr='000000' value='" + timeType.idAdded + "'>" + unescape(timeType.textAdded) + "</yglui_str_wid_field>" +
                                                           "<yglui_str_wid_field fieldid='BEGDA_H' fieldlabel='Start Date' fieldtechname='BEGDA' fieldtseqnr='000000' value='" + dateString + "'></yglui_str_wid_field>" +
                                                           "<yglui_str_wid_field fieldid='COMMENT' fieldlabel='' fieldtechname='COMMENT' fieldtseqnr='000000' value='" + comment + "'></yglui_str_wid_field>" +
                                                           "<yglui_str_wid_field fieldid='EDITABLE' fieldlabel='' fieldtechname='EDITABLE' fieldtseqnr='000000' value=''></yglui_str_wid_field>" +
                                                           "<yglui_str_wid_field fieldid='ENDDA_H' fieldlabel='End Date' fieldtechname='ENDDA' fieldtseqnr='000000' value='" + dateString + "'></yglui_str_wid_field>" +
                                                           "<yglui_str_wid_field fieldid='PERNR' fieldlabel='Personnel Number' fieldtechname='PERNR' fieldtseqnr='000000' value='" + this.currentUser.id + "'>" + this.currentUser.name + "</yglui_str_wid_field>" +
                                                           "<yglui_str_wid_field fieldid='STATUS' fieldlabel='' fieldtechname='STATUS' fieldtseqnr='000000' value=''></yglui_str_wid_field>" +
                                                           "<yglui_str_wid_field fieldid='STDAZ' fieldlabel='Absence hours' fieldtechname='STDAZ' fieldtseqnr='000000' value='" + hours + "'></yglui_str_wid_field>";
                    if (this.showCC && !Object.isEmpty(costCenter))
                        timesheetEvents += "<yglui_str_wid_field fieldid='KOSTL' fieldlabel='' fieldtechname='KOSTL' fieldtseqnr='000000' value='" + costCenter + "'></yglui_str_wid_field>";
                    timesheetEvents += "</fields></yglui_str_wid_content></contents></yglui_str_wid_record>";
                }
            }
        }.bind(this));
        if (!Object.isEmpty(timesheetEvents) || !Object.isEmpty(this.requestId)) {
            var xml = "<EWS>" +
                              "<SERVICE>" + this.saveTimesheetService + "</SERVICE>" +
                              "<OBJECT TYPE='P'>" + this.currentUser.id + "</OBJECT>" +
                              "<PARAM>" +
                                  "<o_begda_i>" + this.currentDate.toString(this.dateFormat) + "</o_begda_i>" +
                                  "<o_endda_i>" + this.currentEndDate.toString(this.dateFormat) + "</o_endda_i>" +
                                  "<o_event_list>" + timesheetEvents + "</o_event_list>" +
                                  "<o_request_id>";
            if (!Object.isEmpty(this.requestId))
                xml += this.requestId;
            xml += "</o_request_id>" +
                       "<BUTTON ACTION='" + actionInfo['@action'] + "' DISMA='' LABEL_TAG='" + actionInfo['@label_tag'] + "' OKCODE='" + actionInfo['@okcode'] + "' SCREEN='' TARAP='' TARTY='' TYPE='" + actionInfo['@type'];
            if (actionInfo['@action'].toLowerCase().include('save'))
                xml += "' STATUS='10";
            xml += "'></BUTTON></PARAM></EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: '_actionResult', failureMethod: '_actionError', errorMethod: '_actionError' }));
        }
        else {
            this.table.update('');
            this._buildInitialTimesheet();
            this._fillEvents();
            this._enableUpperForm();
        }
    },
    /**
    * @description Manages last saved/submited timesheet
    * @param {JSON} json Information from SAVE_TIMESHEET service
    */
    _actionResult: function(json) {
        this._enableUpperForm();
        // Refreshing timesheet (new event statuses)
        this._getTimesheet(this.currentUser.id, this.currentDate);
        // Refreshing calendars
        document.fire('EWS:refreshCalendars');
    },
    /**
    * @description Manages last timesheet error
    * @param {JSON} json Information from SAVE_TIMESHEET service
    */
    _actionError: function(json) {
        var message = json.EWS.webmessage_text;
        if (message.include('((D))')) {
            var collisionDate = message.split('((D))')[1];
            this.collisionDate = Date.parseExact(collisionDate.substring(collisionDate.indexOf('(') + 1, collisionDate.indexOf(')')), 'yyyyMMdd');
            json.EWS.webmessage_text = message.split('((D))')[2].sub(collisionDate, this.collisionDate.toString('dd.MM.yyyy'));
            collisionDate = this.collisionDate.toString(this.dateFormat);
            var rows = this.dateCounter.get(collisionDate).get('indexes');
            var length = rows.length;
            for (var i = 0; i < length; i++) {
                var rowId = this.currentUser.id + "_" + collisionDate + "_" + rows[i];
                this.table.down("[id=" + rowId + "]").addClassName('applicationtimeSheet_collision');
            }
        }
        this._failureMethod(json);
        this.errorMessageDiv.insert(json.EWS.webmessage_text);
        this.errorMessageDiv.show();
        this._enableUpperForm();
    },
    /**
    * @description Asks the backend for the cost centers list
    */
    _getCostCenters: function() {
        var xml = "<EWS><SERVICE>" + this.getCostCentersService + "</SERVICE></EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_saveCostCenters' }));
    },
    /**
    * @description Obtains the cost centers list and stores it
    * @param {JSON} json Information from GET_CC service
    */
    _saveCostCenters: function(json) {
        if (!Object.isEmpty(json)) {
            if (!Object.isEmpty(json.EWS.o_values)) {
                var costCenters = json.EWS.o_values.item;
                var length = costCenters.length;
                // Initial autocompleter structure
                var jsonAutocompleter = { autocompleter: {
                    object: [],
                    multilanguage: {
                        no_results: global.getLabel('noresults'),
                        search: global.getLabel('search')
                    }
                }
                };
                for (var i = 0; i < length; i++) {
                    jsonAutocompleter.autocompleter.object.push({
                        data: costCenters[i]['@id'],
                        text: costCenters[i]['@value']
                    });
                }
                this.costCenters = jsonAutocompleter;
                if (this.comeFrom == "inbox")
                    this._buildTimesheet_read();
                else
                    this._buildTimesheet();
            }
        }
    },
    /**
    * @description Says if we have to show cost centers and shows a timesheet after an error
    * @param {JSON} json Information from GET_TIMESHEET service
    */
    _showTimesheetError: function(json) {
        this._errorMethod(json);
        this._showTimesheet(json);
    }
});