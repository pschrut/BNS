/**
 *@fileOverview timeEntryScreen.js
 *@description It contains a class with functionality for creating or removing time events or editing its properties.
 */
/**
 *@constructor
 *@description Class with functionality for creating or removing time events or editing its properties.
 *@augments Application
 */
var timeEntryScreen = Class.create(Application,
/** 
*@lends timeEntryScreen
*/
{
    /**
    *Constructor of the class timeEntryScreen
    */
    initialize: function($super, args) {
        $super(args);
        this.getContentService = "GET_CONTENT2";
        this.getSubtypesService = "GET_SUBTYPES2";
        this.saveEventsService = "SAVE_EVENT";
        this.saveRecEventsService = "SAVE_RECUR";
        this.getCostCentersService = "GET_CC";
        this.getStoredSearchesService = "GET_SHLP_LST";
        this.fastEntryService = "SAVE_REQUEST_F";
        this.submitStatus = new Hash();
        this.maxEmpSelected = global.maxOnline;
        this.timeEntryEmployeeSelectionBinding = this._employeeSelection.bindAsEventListener(this);
        this.timeEntryEmployeeSelectedBinding = this._employeeSelected.bindAsEventListener(this);
        this.timeEntryEmployeeUnselectedBinding = this._employeeUnselected.bindAsEventListener(this);
        this.timeEntryLeftMenuAdvSearchBinding = this._refreshMultiselect.bindAsEventListener(this);
        this.timeEntryCorrectDateBinding = this._correctDateSelected.bindAsEventListener(this);
    },
    /**
    *@description Starts timeEntryScreen
    *@param {Hash} args Object from the previous application
    */
    run: function($super, args) {
        $super();
        
        // Arguments to go back to the time error screen if we come from there
        this.eventCodes = !Object.isEmpty(args.get('eventCodes')) ? args.get('eventCodes'): null;
        // teamCalendar sends a JSON instead a Hash
        if (!Object.isHash(this.eventCodes)) {
            this.eventCodes = new Hash(this.eventCodes);
            this.eventCodes.each(function(eventCode) {
                this.eventCodes.set(eventCode.key, new Hash(eventCode.value));
            }.bind(this));
        }
        this.TEemployee = !Object.isEmpty(args.get('TEemployee')) ? args.get('TEemployee'): null;
        this.TEeventInformation = !Object.isEmpty(args.get('TEeventInformation')) ? args.get('TEeventInformation'): null;
        this.TEappInformation = !Object.isEmpty(args.get('TEappInformation')) ? args.get('TEappInformation') : null;
        this.TEcontentEvent = !Object.isEmpty(args.get('TEcontentEvent')) ? args.get('TEcontentEvent') : null;
        
        if (this.firstRun) {
            var html = "<div id='applicationtimeEntryScreen_body'></div>";
            this.virtualHtml.insert(html);
        }
        else
            this.virtualHtml.down('div#applicationtimeEntryScreen_body').update("");
        if (balloon.isVisible())
            balloon.hide();
        if (!Object.isEmpty(args.get('event')))
            this.getContentEvent = args.get('event');
        else {
            var appId = this.options.appId;
            var date = Date.today().toString('yyyy-MM-dd');
            this.getContentEvent = this._getEmptyEvent(appId, date);
        }
        this.eventId = Object.isEmpty(this.getContentEvent.EWS) ? "" : this.getContentEvent.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@key_str']; // key_str
        this.eventKey = ""; // rec_key
        this.employeeRestriction = (global.currentSelectionType == 'none') ? false : true;
        this.successfulEvents = false;
        this.recurrenceInfo = null;
        this.advSearch = false;
        this.advSearchId = "";
        // Information about stored searches
        this.storedSearches = new Hash();
        this.selectedSearches = new Array();
        // Current eventCode (like the appId, but not customizable)
        this.eventCode = null;
        // Fields depending on employee selections (multiselect)
        this.fieldsDependingOnMulti = new Array();
        this._getEvent();
        document.observe('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelection', this.timeEntryEmployeeSelectionBinding);
        document.observe('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelected', this.timeEntryEmployeeSelectedBinding);
        document.observe('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeUnselected', this.timeEntryEmployeeUnselectedBinding);
    },
    /**
    *@description Stops timeEntryScreen
    */
    close: function($super) {
        $super();
        if(this.fieldPanel)
            this.fieldPanel.destroy();
        document.stopObserving('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelection', this.timeEntryEmployeeSelectionBinding);
        document.stopObserving('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelected', this.timeEntryEmployeeSelectedBinding);
        document.stopObserving('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeUnselected', this.timeEntryEmployeeUnselectedBinding);
        if (this.advSearch)
            document.stopObserving('EWS:allEmployeesAdded', this.timeEntryLeftMenuAdvSearchBinding);
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT'))
            this._setDatePickersObservers(false);
        if (this.fieldPanel)
            this.fieldPanel.destroy();
    },
    /**
    *@description Gets information from the previous application and requests additional data if needed
    */
    _getEvent: function() {
        // New event
        this.isNew = Object.isEmpty(this.eventId);
        if (this.isNew) {
            this.employeeId = !Object.isEmpty(this.getContentEvent.PERNR) ? this.getContentEvent.PERNR.value : global.objectId;
            var object = this.employeeRestriction ? "<OBJECT TYPE=''></OBJECT>" : "<OBJECT TYPE='P'>" + this.employeeId + "</OBJECT>";
            this.appId = !Object.isEmpty(this.getContentEvent.APPID) ? this.getContentEvent.APPID.text : this.getContentEvent.get('APPID').text;
            this.eventCode = null;
            var length = this.eventCodes.keys().length;
            for (var i = 0; (i < length) && (Object.isEmpty(this.eventCode)); i++) {
                var codes = this.eventCodes.values()[i].get('appids');
                for (var j = 0; (j < codes.length) && (Object.isEmpty(this.eventCode)); j++) {
                    if (codes[j] == this.appId)
                        this.eventCode = this.eventCodes.keys()[i];
                }
            }
            var xml = "<EWS>" +
                              "<SERVICE>" + this.getContentService + "</SERVICE>" +
                              object +
                              "<PARAM>" +
                                  "<APPID>" + this.appId + "</APPID>" +
                                  "<WID_SCREEN>*</WID_SCREEN>" +
                                  "<OKCODE>NEW</OKCODE>" +
                              "</PARAM>" +
                          "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: '_displayNewEvent' }));
        }
        // Existing event
        else
            this._displayEvent();
    },
    /**
    *@description Displays all neccesary fields to create a new event
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    _displayNewEvent: function(json) {
        var structure = json;
        delete(json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.buttons);
        // Solving problem with screens path
        if (!Object.jsonPathExists(json, 'EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen'))
            json.EWS.o_widget_screens.yglui_str_wid_screen = { yglui_str_wid_screen: json.EWS.o_widget_screens.yglui_str_wid_screen };
        // If there are more than one screen, we will use the selected one
        if (Object.isArray(structure.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen)) {
            var screens = objectToArray(structure.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen);
            var selected = -1;
            for (var i = 0; (i < screens.length) && (selected < 0); i++) {
                if (screens[i]['@selected'] == 'X')
                    selected = i;
            }
            structure.EWS.o_field_settings.yglui_str_wid_fs_record = structure.EWS.o_field_settings.yglui_str_wid_fs_record[selected];
            structure.EWS.o_field_values.yglui_str_wid_record = structure.EWS.o_field_values.yglui_str_wid_record[selected];
            structure.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen = structure.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen[selected];
        }
        else {
            if (Object.isEmpty(structure.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@selected']))
                structure.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@selected'] = 'X';
        }
        // Setting dates from previous app and writing default hours (if needed)
        var values = objectToArray(structure.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        // We need to store fieldtechnames from values because they don't come with settings
        this.fieldtechnames = new Hash();
        var begda = !Object.isEmpty(this.getContentEvent.BEGDA) ? this.getContentEvent.BEGDA.value : this.getContentEvent.get('BEGDA').value;
        var endda = !Object.isEmpty(this.getContentEvent.ENDDA) ? this.getContentEvent.ENDDA.value : this.getContentEvent.get('ENDDA').value;
        for (var i = 0; i < values.length; i++) {
            this.fieldtechnames.set(values[i]['@fieldid'], values[i]['@fieldtechname']);
            if (values[i]['@fieldid'].startsWith('M_'))
                this.fieldsDependingOnMulti.push(values[i]['@fieldid']);
            if (values[i]['@fieldtechname'] == 'BEGDA')
                values[i]['@value'] = begda;
            if (values[i]['@fieldtechname'] == 'ENDDA')
                values[i]['@value'] = endda;
        }
        var fields = objectToArray(structure.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);
        // Fields in the radio group
        this.radioGroup = new Hash();
        this.radioGroupName = "";
        this.groupEnabled = true;
        // Radio group for all day (it has no field, so it won't be changed)
        this.alldfGroup = null;
        for (var i = 0; i < fields.length; i++) {
            var fieldtechname = this.fieldtechnames.get(fields[i]['@fieldid']);
            fieldtechname = Object.isEmpty(fieldtechname) ? fields[i]['@fieldid'] : fieldtechname;
            if (fieldtechname == 'BEGDA')
                fields[i]['@default_value'] = begda;
            if (fieldtechname == 'ENDDA')
                fields[i]['@default_value'] = endda;
            if ((fieldtechname == 'BEGUZ') || (fieldtechname == 'ENDUZ'))
                fields[i]['@default_value'] = "00:00:00";
            if (!Object.isEmpty(fields[i]['@display_group']) && !Object.isEmpty(fieldtechname)) {
                if (Object.isEmpty(this.radioGroupName))
                    this.radioGroupName = fields[i]['@display_group'].split('_')[1];
                if (Object.isEmpty(this.radioGroup.get(fields[i]['@display_group'])))
                    this.radioGroup.set(fields[i]['@display_group'], new Array());
                this.radioGroup.get(fields[i]['@display_group']).push(fieldtechname);
                if (fieldtechname == 'ALLDF')
                    this.alldfGroup = 'OPT' + fields[i]['@display_group'].substring(fields[i]['@display_group'].indexOf('_'));
            }
            if (fields[i]['@fieldid'] == 'PERNR_ADV')
                this.advSearchId = fields[i]['@sadv_id'];
        }
        // Saving event into a hash
        this.getContentEvent = structure;
        // Inserting fieldPanel
        this.fpjson = deepCopy(this.getContentEvent);
        //Buttons
        var buttonsScreen = objectToArray(this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button);
        this.hashToSaveButtons = $H({});
        var newButtons = new Array();
        var length = buttonsScreen.length;
        for (var i = 0; i < length; i++) {
            if (buttonsScreen[i]['@okcode'] != 'DEL')
                newButtons.push(buttonsScreen[i]);
        }
        this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button = newButtons;
        buttonsScreen = this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
        for (var i = 0; i < buttonsScreen.size(); i++) {
            if (buttonsScreen[i]['@okcode'] == 'INS') {
                var functionToExecute = this._submitActions.bind(this, buttonsScreen[i])
                this.hashToSaveButtons.set(buttonsScreen[i]['@action'], functionToExecute);
            }
            if (buttonsScreen[i]['@action'].include('TEAM')) {
                var functionToExecute = this._toggleTeamCalendar.bind(this, buttonsScreen[i]);
                this.hashToSaveButtons.set(buttonsScreen[i]['@action'], functionToExecute);
            }
        }
        this.hashToSaveButtons.set('cancel', this._exit.bind(this, null, ""));
        this.hashToSaveButtons.set('paiEvent', this._paiEvent.bind(this));
        var event = this.fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.eventHash = new Hash();
        for (var i = 0; i < event.length; i++) {
            if (!Object.isEmpty(event[i]['@fieldtechname']) && Object.isEmpty(this.eventHash.get(event[i]['@fieldtechname'])))
                this.eventHash.set(event[i]['@fieldtechname'], event[i]);
            else {
                if (!Object.isEmpty(this.eventHash.get(event[i]['@fieldtechname'])) && (event[i]['@fieldtechname'] == "PERNR")) {
                    this.advSearch = true;
                    document.observe('EWS:allEmployeesAdded', this.timeEntryLeftMenuAdvSearchBinding);
                }
                this.eventHash.set(event[i]['@fieldid'], event[i]);
            }
        }
        // Redefined services
        var selectedEmployee = (this.getSelectedEmployees().keys().length == 1) ? this.getSelectedEmployees().keys()[0] : this.employeeId;
        var redefinedServices = this._getRedefinedServices(selectedEmployee, begda);
        // Fields out of fieldPanel (title and employee selection)
        var title = "<span class='application_main_title2'>" + this._getTitle(structure) + "</span><br /><br />";
        this.virtualHtml.down('div#applicationtimeEntryScreen_body').update(title);
        var employees;
        // Left menu employees
        if (this.employeeRestriction)
            employees = this._buildEmployeeSelectionForm();
        // No left menu employees
        else {
            var color = parseInt(this.getEmployee(global.objectId).color);
            employees = "<div class='application_main_soft_text fieldDisp120Left applicationtimeEntryScreen_employees'>" + global.getLabel('for') + " *" + "</div>" +
                            "<div class='application_color_eeColor" + color + "'>" + this.getEmployee(global.objectId).name + "</div>";
        }
        this.virtualHtml.down('div#applicationtimeEntryScreen_body').insert(employees);
        if (this.advSearch && this.employeeRestriction)
            this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelection').toggle();
        if (this.employeeRestriction) {
            this.virtualHtml.down('div#applicationtimeEntryScreen_addSelection').observe('click', this._addMySelection.bind(this));
            if (this.advSearch)
                this.virtualHtml.down('div#applicationtimeEntryScreen_advSearch').observe('click', this._advSearch.bind(this));
            this._buildMultiselect();
            if (!this.advSearch) {
                var selectedEmployees = this.getSelectedEmployees().keys();
                var length = selectedEmployees.length;
                var data = null;
                for (var i = 0; i < length; i++) {
                    data = new Hash();
                    data.set('data', selectedEmployees[i]);
                    data.set('text', this.getEmployee(selectedEmployees[i]).name);
                    this.multiSelect.createBox(data);
                    this.multiSelect.removeElementJSON(data, false);
                }
            }
            else
                this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').update("(0)");
        }
        this.virtualHtml.down('div#applicationtimeEntryScreen_body').insert( new Element("div", {id: "applicationtimeEntryScreen_fieldPanel" }) );
        var mode = 'create';
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({ 
            mode: mode, 
            json: this.fpjson, 
            appId: this.appId, 
            predefinedXmls: redefinedServices, 
            showCancelButton: true,
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp120Left' }),
            linkTypeHandlers: $H({REC_LINK: this._displayRecurrenceWindow.bind(this)})
        });
        this.virtualHtml.down('div#applicationtimeEntryScreen_fieldPanel').insert(this.fieldPanel.getHtml());
        // Adding handler to dates (ABS/ATT)
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT')) {
            this._setDatePickersObservers(true);
            this._correctDateSelected();
        }
    },
    /**
    *@description Displays an existing event
    */
    _displayEvent: function() {
        this.fpjson = deepCopy(this.getContentEvent);
        // Saving event into a hash
        var event = this.fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.eventHash = new Hash();
        // We need to store fieldtechnames from values because they don't come with settings
        this.fieldtechnames = new Hash();
        for (var i = 0; i < event.length; i++) {
            this.fieldtechnames.set(event[i]['@fieldid'], event[i]['@fieldtechname']);
            if (event[i]['@fieldid'].startsWith('M_'))
                this.fieldsDependingOnMulti.push(event[i]['@fieldid']);
            if (!Object.isEmpty(event[i]['@fieldtechname']))
                this.eventHash.set(event[i]['@fieldtechname'], event[i]);
            else
                this.eventHash.set(event[i]['@fieldid'], event[i]);
        }
        this.appId = this.eventHash.get('APPID')['@value'];
        this.eventCode = null;
        var length = this.eventCodes.keys().length
        for (var i = 0; (i < length) && (Object.isEmpty(this.eventCode)); i++) {
            var codes = this.eventCodes.values()[i].get('appids');
            for (var j = 0; (j < codes.length) && (Object.isEmpty(this.eventCode)); j++) {
                if (codes[j] == this.appId)
                    this.eventCode = this.eventCodes.keys()[i];
            }
        }
        var begda = this.eventHash.get('BEGDA')['@value'];
        // Is the event editable? (calendar event)
        var editable = (this.eventHash.get('EDITABLE')['@value'] == 'X') ? true : false;
        if (this.eventHash.get('DISPLAY'))
            editable = editable && (this.eventHash.get('DISPLAY')['@value'] != 'X');
        // Getting rec key
        this.eventKey = this.fpjson.EWS.o_field_values.yglui_str_wid_record['@rec_key'];
        // Obtaining employee's id
        this.employeeId = this.eventHash.get('PERNR')['@value'];
        // Fields out of fieldPanel (title and employee)
        var title = "<span class='application_main_title2'>" + this._getTitle(this.fpjson) + "</span><br /><br />";
        this.virtualHtml.down('div#applicationtimeEntryScreen_body').update(title);
        var color = parseInt(this.getEmployee(this.employeeId).color);
        color = (color < 10) ? '0' + color : color;
        var employee = "<div class='application_main_soft_text fieldDisp120Left applicationtimeEntryScreen_employees";
        if (!editable)
            employee += " applicationtimeEntryScreen_timesheetFor";
        employee += "'>" + global.getLabel('for');
        if (editable)
            employee += " *";
        employee += "</div>" +
                    "<div class='application_color_eeColor" + color;
        if (!editable)
            employee += " applicationtimeEntryScreen_timesheetFor";
        employee += "'>" + this.getEmployee(this.employeeId).name + "</div>";
        this.virtualHtml.down('div#applicationtimeEntryScreen_body').insert(employee);
        this.virtualHtml.down('div#applicationtimeEntryScreen_body').insert( new Element("div", {id: "applicationtimeEntryScreen_fieldPanel" }) );
        // Redefined services
        var selectedEmployee = this.eventHash.get('PERNR')['@value'];
        var redefinedServices = this._getRedefinedServices(selectedEmployee, begda);
        var mode = 'edit';
        if (!editable)
            mode = 'display';
        // Getting radio group
        this.radioGroup = new Hash();
        this.radioGroupName = "";
        this.groupEnabled = true;
        // Radio group for all day (it has no field, so it won't be changed)
        this.alldfGroup = null;
        var fields = objectToArray(this.fpjson.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);
        for (var i = 0; i < fields.length; i++) {
            var fieldtechname = this.fieldtechnames.get(fields[i]['@fieldid']);
            fieldtechname = Object.isEmpty(fieldtechname) ? fields[i]['@fieldid'] : fieldtechname;
            if (!Object.isEmpty(fields[i]['@display_group']) && !Object.isEmpty(fieldtechname)) {
                if (Object.isEmpty(this.radioGroupName))
                    this.radioGroupName = fields[i]['@display_group'].split('_')[1];
                if (Object.isEmpty(this.radioGroup.get(fields[i]['@display_group'])))
                    this.radioGroup.set(fields[i]['@display_group'], new Array());
                this.radioGroup.get(fields[i]['@display_group']).push(fieldtechname);
                if (fieldtechname == 'ALLDF')
                    this.alldfGroup = 'OPT' + fields[i]['@display_group'].substring(fields[i]['@display_group'].indexOf('_'));
            }
            if (fieldtechname == 'REC_LINK')
                fields[i]['@display_attrib'] = 'HID';
        }
        // Buttons
        this.hashToSaveButtons = $H({});
        if (this.fpjson.EWS.o_screen_buttons) {
            var buttonsScreen = this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
            buttonsScreen.each( function(pair) {
                var functionToExecute;
                if ((pair['@okcode'] == 'INS') || (pair['@okcode'] == 'MOD'))
                    functionToExecute = this._eventAction.bind(this, pair['@action'], pair['@okcode'], pair['@type'], pair['@label_tag']);
                if (pair['@okcode'] == 'DEL')
                    functionToExecute = this._confirmationMessage.bind(this, pair['@action'], pair['@okcode'], pair['@type'], pair['@label_tag']);
                if (pair['@action'].include('TEAM')) {
                    functionToExecute = this._toggleTeamCalendar.bind(this, pair);
                }
                this.hashToSaveButtons.set(pair['@action'], functionToExecute);
            }.bind(this));
            this.hashToSaveButtons.set('paiEvent', this._paiEvent.bind(this));
        }
        this.hashToSaveButtons.set('cancel',this._exit.bind(this, null, ""));
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({ 
            mode: mode, 
            json: this.fpjson, 
            appId: this.appId, 
            predefinedXmls: redefinedServices, 
            showCancelButton: true, 
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp120Left' })
        });
        this.virtualHtml.down('div#applicationtimeEntryScreen_fieldPanel').insert(this.fieldPanel.getHtml());
        // Adding handler to dates (ABS/ATT)
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT')) {
            this._setDatePickersObservers(true);
            this._correctDateSelected();
        }
    },
    /**
    *@description Gets the title from the event (new or existing one)
    *@param {JSON} json Information from GET_CONTENT2 service
    *@returns {String} title
    */
    _getTitle: function(json) {
        var titleCode = json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen['@label_tag'];
        var title = titleCode;
        var labels = json.EWS.labels.item;
        for (var i = 0; (i < labels.length) && (title == titleCode); i++) {
            if (labels[i]['@id'].toLowerCase() == titleCode.toLowerCase())
                title = labels[i]['@value'];
        }
        return title;
    },
    /**
    *@description Adds selected employees from left menu to create a new event
    */
    _addMySelection: function() {
        var previousSelected = this.multiSelect.selectedElements;
        for (var i = 0; i < previousSelected.length; i++) {
            this.multiSelect.insertElementJSON(previousSelected[i]);
        }
        var boxes = document.body.select('.multiSelect_item');
        if (boxes.length != 0) {
            for (var i = 0; i < boxes.length; i++) {
                boxes[i].remove();
            }
        }
        this.multiSelect.selectedElements.clear();
        var selected = this.getSelectedEmployees();
        selected.each( function(employee) {
            var data = new Hash();
            data.set('data', employee.key);
            data.set('text', employee.value.name);
            this.multiSelect.createBox(data);
            this.multiSelect.removeElementJSON(data, false);
        }.bind(this));
        if (this.advSearch)
            this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').update("(" + selected.keys().length + ")");
        document.fire('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelection');
    },
    /**
    *@description Shows the Team Calendar
    *@param {Hash} button Action button
    */
    _toggleTeamCalendar: function(button) {
        if (!global.currentSubApplication) {
            var begda = this.eventHash.get('BEGDA')['@value'];
	        global.open( $H({
	            app: {
	                appId: button['@tarap'],
	                tabId: "SUBAPP",
	                view: button['@views']
	            },
	            date: begda
	        }));
        }
        else
            global.closeSubApplication();
    },
    /**
    *@description Exits the application and open the previous one
    *@param {JSON} json Information from SAVE_EVENTS service
    *@param {Hash} ID Request ID
    */
    _exit: function(json, ID) {
        // Submit button
        if (!Object.isEmpty(ID)) {
            this.loadingBar.drawSuccess();
            this.submitStatus.set(json.EWS.o_req_head['@objid'], "");
            var length = parseInt(ID.length);
            var currentLength = this.submitStatus.keys().length;
            // Final request
            if (currentLength >= length) {
                this._showCreationStatus.delay(1, this);
            }
        }
        // Exit button
        else {
            if (this.successfulEvents) {
                document.fire('EWS:refreshTimesheet');
                document.fire('EWS:refreshCalendars');
            }
            global.open( $H({
                app: {
                    tabId: this.options.tabId,
                    appId: global.tabid_applicationData.get(this.options.tabId).applications[0].appId,
                    view: global.tabid_applicationData.get(this.options.tabId).applications[0].view
                }
            }));
        }
    },
    /**
    *@description Exits the application and open the previous one, showing an error message
    *@param {JSON} json Information from SAVE_EVENTS service
    *@param {Hash} ID Request ID
    */
    _exitError: function(json, ID) {
        if (!Object.isEmpty(ID)) {
            this.loadingBar.drawFailure();
            var messages = this._getErrorMessages(json);
            this.submitStatus.set(json.EWS.o_req_head['@objid'], messages);
            var length = parseInt(ID.length);
            var currentLength = this.submitStatus.keys().length;
            // Final request
            if (currentLength >= length) {
                this._showCreationStatus.delay(1, this);
            }
        }
    },
    /**
    *@description Exits the application and open the previous one, showing an information message
    *@param {JSON} json Information from SAVE_EVENTS service
    *@param {Hash} ID Request ID
    */
    _exitInfo: function(json, ID) {
        this._infoMethod(json);
        this._exit(json, ID);
    },
    /**
    *@description Creates, modifies or removes an event or a fast entry
    *@param {String} action Requested action
    *@param {String} okcode Ok Code
    *@param {String} type Type
    *@param {String} label Label
    */
    _eventAction: function(action, okcode, type, label) {
        // fieldPanel validation
        var fpvalidation = this.fieldPanel.validateForm();
        var correctfp = fpvalidation.correctForm;
        // Employees validation
        var employees = this._getEmployeeSelection();
        var correctemp = (employees.length == 0) ? false : true;
        if (!correctemp && !this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelectionContainer').hasClassName('applicationtimeEntryScreen_fieldError'))
            this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelectionContainer').addClassName('applicationtimeEntryScreen_fieldError');
        if (correctfp && correctemp) {
            // Looking for a radio group
            // 0 = no radio group, other = selected row in radio group
            var fields = this.eventHash.keys();
            var radiogroup = null;
            for (var i = (fields.length - 1); (i >= 0) && (Object.isEmpty(radiogroup)) ; i--) {
                if (fields[i].include("OPT_")) {
                    var radiofield = this.eventHash.get(fields[i]);
                    if (radiofield['@value'] == 'X')
                        radiogroup = fields[i];
                }
            }
            // Changing selected element in the radio group if BEGDA != ENDDA
            var begda = this.eventHash.get('BEGDA')['@value'];
            var endda = this.eventHash.get('ENDDA') ? this.eventHash.get('ENDDA')['@value'] : begda;
            if ((begda != endda) && (radiogroup != this.alldfGroup)) {
                this.eventHash.get(radiogroup)['@value'] = '';
                this.eventHash.get(this.alldfGroup)['@value'] = 'X';
                radiogroup = this.alldfGroup;
            }
            // If there is a selected radio button, we don't have to send other radio buttons' info
            // (so we store those radio buttons)
            var fieldsradiogroup = new Array();
            if (!Object.isEmpty(radiogroup)) {
                radiogroup = 'RADIO' + radiogroup.substring(radiogroup.indexOf('_'));
                this.radioGroup.each( function(radio) {
                    if (radio.key != radiogroup) {
                        for (var i = 0; i < radio.value.length; i++)
                            fieldsradiogroup.push(radio.value[i]);
                    }
                }.bind(this));
            }
            var parameters = "";
            this.eventHash.each( function(field) {
                var fieldid = field.value['@fieldid'];
                var fieldtech = Object.isEmpty(field.value['@fieldtechname']) ? "" : field.value['@fieldtechname'];
                var fieldname = Object.isEmpty(fieldtech) ? fieldid : fieldtech;
                // ALLDF will be filled with OPT_G01_1 info
                // PERNR will be filled later (for each employee selected)
                if ((fieldname != 'ALLDF') && (fieldname != 'PERNR')) {
                    if (!fieldname.include('OPT_')) {
                        // Needed field's info
                        if (fieldsradiogroup.indexOf(fieldname) < 0) {
                            // We need to fill APPID field manually
                            var fieldvalue = (fieldname == 'APPID') ? this.appId : Object.isEmpty(field.value['@value']) ? "" : field.value['@value'];
                            if ((fieldname != 'KOSTL') || ((fieldname == 'KOSTL') && (!Object.isEmpty(fieldvalue)))) {
                                var fieldtext = Object.isEmpty(field.value['#text']) ? "" : field.value['#text'];
                                parameters += "<yglui_str_wid_field fieldid='" + fieldid + "' fieldlabel='' fieldtechname='" + fieldtech + "' fieldtseqnr='000000' value='" + fieldvalue + "'>" + fieldtext + "</yglui_str_wid_field>";
                            }
                        }
                        // Not needed field's info (unselected radio buttons' fields)
                        else
                            parameters += "<yglui_str_wid_field fieldid='" + fieldid + "' fieldlabel='' fieldtechname='" + fieldtech + "' fieldtseqnr='000000' value=''></yglui_str_wid_field>";
                    }
                    else {
                        if (fieldname == this.alldfGroup) {
                            var fieldvalue = Object.isEmpty(field.value['@value']) ? "" : field.value['@value'];
                            parameters += "<yglui_str_wid_field fieldid='ALLDF' fieldlabel='' fieldtechname='ALLDF' fieldtseqnr='000000' value='" + fieldvalue + "'></yglui_str_wid_field>";
                        }                            
                    }
                }
            }.bind(this));
            var service = Object.isEmpty(this.recurrenceInfo) ? this.saveEventsService : this.saveRecEventsService;
            // REQUESTS
            var length = employees.length;
            var recurrence = "";
            if (!Object.isEmpty(this.recurrenceInfo)) {
                recurrence += "<o_recurrence endda='" + this.recurrenceInfo.get('endda') + "' nrday='" + this.recurrenceInfo.get('nrday') + "' " +
                              "nrocc='" + this.recurrenceInfo.get('nrocc') + "' nrweek_month='" + this.recurrenceInfo.get('nrweek_month') + "' " +
                              "range_start='" + this.recurrenceInfo.get('range_start') + "' dtype='" + this.recurrenceInfo.get('dtype') + "'>";
                var days = this.recurrenceInfo.get('selected_days');
                var mon = days.include('mon') ? 'X' : '';
                var tue = days.include('tue') ? 'X' : '';
                var wed = days.include('wed') ? 'X' : '';
                var thu = days.include('thu') ? 'X' : '';
                var fri = days.include('fri') ? 'X' : '';
                var sat = days.include('sat') ? 'X' : '';
                var sun = days.include('sun') ? 'X' : '';
                recurrence += "<selected_days mon='" + mon + "' tue='" + tue + "' wed='" + wed + "' thu='" + thu + "' " +
                              "fri='" + fri + "' sat='" + sat + "' sun='" + sun + "' />";
                recurrence += "</o_recurrence>";
            }
            // Normal entries
            if (!this.advSearch || (this.advSearch && (this.selectedSearches.length == 0) && (length <= this.maxEmpSelected))) {
                // Progress bar
                var message = global.getLabel('progress') +
                              "<div id='applicationtimeEntryScreen_loadingBar'></div>";
                var contentHTML = new Element('div');
                contentHTML.insert(message);
                var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                };
                this.loadingPopUp = new infoPopUp ({
                    htmlContent : contentHTML,
                    indicatorIcon : 'void',                    
                    width: 430,
                    showCloseButton: false
                });
                this.loadingPopUp.create();
                this.loadingBar = new ProgressBar ({
                                      target: "applicationtimeEntryScreen_loadingBar",
                                      cellsNumber: employees.length
                                  });
                for (var i = 0; i < length; i++) {
                    var employeeId = employees[i].get('data');
                    var employeeName = unescape(employees[i].get('text'));
                    var employeeParameters = "<yglui_str_wid_field fieldid='PERNR' fieldlabel='' fieldtechname='PERNR' fieldtseqnr='000000' value='" + employeeId + "'>" + employeeName + "</yglui_str_wid_field>";
                    var xml = "<EWS>" +
                                  "<SERVICE>" + service + "</SERVICE>" +
                                  "<OBJECT TYPE='P'>" + employeeId + "</OBJECT>" +
                                  "<PARAM>" +
                                      "<REQ_ID></REQ_ID>" +
                                      "<APPID>" + this.appId + "</APPID>" +
                                      "<RECORDS>" +
                                          "<yglui_str_wid_record rec_key='" + this.eventKey + "' screen='1'>" +
                                              "<contents>" +
                                                  "<yglui_str_wid_content key_str='" + this.eventId + "' rec_index='1' selected='X' tcontents=''>" +
                                                      "<fields>" + employeeParameters + parameters + "</fields>" +
                                                  "</yglui_str_wid_content>" +
                                              "</contents>" +
                                          "</yglui_str_wid_record>" +
                                      "</RECORDS>" +
                                      "<BUTTON ACTION='" + action + "' DISMA='' LABEL_TAG='" + label + "' OKCODE='" + okcode + "' SCREEN='' TARAP='' TARTY='' TYPE='" + type + "' />" +
                                      recurrence + 
                                  "</PARAM>" +
                              "</EWS>";
                    this.makeAJAXrequest($H({ xml: xml, successMethod: '_exit', failureMethod: '_exitError', errorMethod: '_exitError', informationMethod: '_exitInfo', ajaxID: { length: length, action: action } }));
                }
            }
            // Fast entries (only new events)
            else {
                var employeeSelection = "";
                for (var i = 0; i < length; i++) {
                    if (this.selectedSearches.indexOf(employees[i].get('data')) < 0)
                        employeeSelection += "<YGLUI_STR_HROBJECT OTYPE='P' OBJID='" + employees[i].get('data') + "' />";
                }
                var searchSelection = "";
                var length2 = this.selectedSearches.length;
                for (var i = 0; i < length2; i++) {
                    var search = this.storedSearches.get(this.selectedSearches[i]);
                    searchSelection += "<item cdate='" + search['@cdate'] + "' ctime='" + search['@ctime'] + "' sadv_id='" + search['@sadv_id'] + "' " +
                                       "screen='" + search['@screen'] + "' seqnr='" + search['@seqnr'] + "'>" + search['#text'] + "</item>";
                }
                var xml = "<EWS>" +
                              "<SERVICE>" + this.fastEntryService + "</SERVICE>" +
                              "<OBJECT TYPE='P'>" + global.objectId + "</OBJECT>" +
                              "<PARAM>" +
                                  "<APPID>" + this.appId + "</APPID>" +
                                  "<RECORDS>" +
                                      "<yglui_str_wid_record rec_key='' screen='1'>" +
                                          "<contents>" +
                                              "<yglui_str_wid_content key_str='' rec_index='1' selected='X' tcontents=''>" +
                                                  "<fields>" + parameters + "</fields>" +
                                              "</yglui_str_wid_content>" +
                                          "</contents>" +
                                      "</yglui_str_wid_record>" +
                                  "</RECORDS>" +
                                  "<BUTTON ACTION='" + action + "' DISMA='' LABEL_TAG='" + label + "' OKCODE='" + okcode + "' SCREEN='' TARAP='' TARTY='' TYPE='" + type + "' />" +
                                  recurrence +
                                  "<I_BACKGR>X</I_BACKGR>" +
                                  "<I_FILTER_LST>" + searchSelection + "</I_FILTER_LST>" +
                                  "<I_OBJECT_LST>" + employeeSelection + "</I_OBJECT_LST>" +
                                  "<I_SERVICE>" + service + "</I_SERVICE>" +
                              "</PARAM>" +
                          "</EWS>";
                this.makeAJAXrequest($H({ xml: xml, successMethod: '_exit' }));
            }
        }
        else {
            if (!correctemp)
                this.virtualHtml.down('div#fieldErrorMessage_' + this.appId).update(global.getLabel("selectEmp"));
        }
    },
    /**
    *@description Shows event creation log
    *@param {Object} instance Instance of 'this'
    */
    _showCreationStatus: function(instance) {
        instance.loadingPopUp.close();
        delete instance.loadingPopUp;
        delete instance.loadingbar;
        var message = "";
        var errorMessages = 0;
        var requests = instance.submitStatus.keys().length;
        instance.submitStatus.each(function(event) {
            if (!Object.isEmpty(event.value)) {
                var length = event.value.length;
                for (var i = 0; i < length; i++) {
                    var text = event.value[i].substring(0,(event.value[i].length - 1));
                    var type = event.value[i].substring(event.value[i].length - 1);
                    var employeeName = instance.getEmployee(event.key).name;
                    message += "<tr><td><span class='applicationtimeEntryScreen_errorTable_employeeColumn' title='" + employeeName + "'>" + employeeName + "</span></td>";
                    message += "<td><span class='applicationtimeEntryScreen_errorTable_textColumn' title='" + text + "'>" + text + "</span></td>";
                    message += "<td><div class='applicationtimeEntryScreen_errorTable_iconText'>" + type + "</div>";
                    switch (type) {
                        case 'E':
                            message += "<div class='application_icon_red applicationtimeEntryScreen_errorTable_iconDiv' title='" + global.getLabel('error') + "'></div>";
                            break;
                        case 'I':
                            message += "<div class='application_icon_orange applicationtimeEntryScreen_errorTable_iconDiv' title='" + global.getLabel('warning') + "'></div>";
                            break;
                        default:
                            break;
                    }
                    message += "</td></tr>";
                }
                errorMessages++;
            }
        }.bind(instance));
        // Status message
        if (errorMessages > 0) {
            // There was successful requests
            if ((requests - errorMessages) > 0) {
                instance.successfulEvents = true;
                instance.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelection').update("");
                instance.multiSelect = new MultiSelect('applicationtimeEntryScreen_employeeSelection', {
                    autocompleter: {
                        showEverythingOnButtonClick: false,
                        timeout: 5000,
                        templateResult: '#{text}',
                        minChars: 1
                    },
                    events: $H({onResultSelected: 'EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelected',
                                onRemoveBox: 'EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeUnselected'})
                }, instance.jsonMultiselect);
                instance.submitStatus.each(function(event) {
                    if (!Object.isEmpty(event.value)) {
                        var data = new Hash();
                        data.set('data', event.key);
                        data.set('text', instance.getEmployee(event.key).name);
                        instance.multiSelect.createBox(data);
                        instance.multiSelect.removeElementJSON(data, false);
                    }
                }.bind(instance));
            }
            instance.submitStatus = new Hash();
            var content = new Element('div');
            var contentHTML = "<br /><span>" + (requests - errorMessages) + global.getLabel('succesfulEvents') + "</span>" +
                              "<br /><br /><span>" + global.getLabel('problemFound') + "</span>" +
                              "<table class='sortable' id='applicationtimeEntryScreen_errorTable'>" +
                                  "<thead>" +
                                      "<tr>" +
                                          "<th class='applicationtimeEntryScreen_errorTable_employeeColumn table_sortfirstdesc'>" + global.getLabel('employee') + "</th>" +
                                          "<th class='applicationtimeEntryScreen_errorTable_textColumn'>" + global.getLabel('descr') + "</th>" +
                                          "<th class='applicationtimeEntryScreen_errorTable_iconColumn'>" + global.getLabel('type') + "</th>" +
                                      "</tr>" +
                                  "</thead>" +
                                  "<tbody id='applicationtimeEntryScreen_errorTable_tbody'>" + message + "</tbody>" +
                              "</table>";
            content.insert(contentHTML);
            // Button
            var buttonsJson = {
                elements: [],
                mainClass: 'moduleInfoPopUp_stdButton_div_left'
            };
            var callBack = function() {
                errorPopUp.close();
                delete errorPopUp;
            }.bind(instance);     
            var okButton = {
                idButton: 'Ok',
                label: global.getLabel('ok'),
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: callBack,
                type: 'button',
                standardButton: true
            };
            buttonsJson.elements.push(okButton);
            var ButtonObj = new megaButtonDisplayer(buttonsJson);
            var buttons = ButtonObj.getButtons();
            content.insert(buttons);
            // PopUp
            var errorPopUp = new infoPopUp({
                closeButton: $H({
                    'textContent': 'Close',
                    'callBack': callBack
                }),
                htmlContent: content,
                indicatorIcon: 'exclamation',
                width: 680
            });
            errorPopUp.create();
            if (!instance.errorTableCreated) {
                TableKit.Sortable.init($(document.body).down("[id=applicationtimeEntryScreen_errorTable]"), { pages: parseInt(global.paginationLimit)/2 });
                TableKit.options.autoLoad = false;
                instance.errorTableCreated = true;
            }
            else
                TableKit.reloadTable($(document.body).down("[id=applicationtimeEntryScreen_errorTable]"));
        }
        else {
            instance.submitStatus = new Hash();
            document.fire('EWS:refreshTimesheet');
            document.fire('EWS:refreshCalendars');
            if(instance.TEappInformation == null){  //if we don't come from the time error
                global.goToPreviousApp();
            }else{
                global.open( $H({
	                app: instance.TEappInformation,
	                event: instance.TEcontentEvent,
	                eventCodes: instance.eventCodes,
	                eventInformation: instance.TEeventInformation,
	                employee: instance.TEemployee
	            }));
            }
        }
    },
    /**
    *@description Shows a confirmation box when we are going to delete an event or to create a fast entry
    *@param {String} action Requested action
    *@param {String} okcode Ok Code
    *@param {String} type Type
    *@param {String} label Label
    */
    _confirmationMessage: function(action, okcode, type, label) {
        var contentHTML = new Element('div');
        var text = global.getLabel("areYouSureEvent");
        if (this.advSearch)
            text = global.getLabel("areYouSureMass") + "<br /><br />" + global.getLabel("pressYes") + "<br />" + global.getLabel("pressNo");
        contentHTML.insert(text);
        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            timeEntryPopUp.close();
            delete timeEntryPopUp;
            this._eventAction(action, okcode, type, label);
        } .bind(this);
        var callBack2 = function() {
            timeEntryPopUp.close();
            delete timeEntryPopUp;
        };          
        var aux = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux2 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack2,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux);
        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        // Insert buttons in div
        contentHTML.insert(buttons);
        var width = 350;
        if (this.advSearch)
            width = 550;
        var timeEntryPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('close'),
                'callBack': function() {
                    timeEntryPopUp.close();
                    delete timeEntryPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: width
        });
        timeEntryPopUp.create();
    },
    /**
    *@description Removes the error style in the employee selection form if needed
    */
    _employeeSelection: function() {
        if (this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelectionContainer').hasClassName('applicationtimeEntryScreen_fieldError'))
            this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelectionContainer').removeClassName('applicationtimeEntryScreen_fieldError');
        this._refreshMultiDependentFields();
    },
    /**
     *@description Employee selected
     */
    onEmployeeSelected: function() {
        Prototype.emptyFunction();
    },
    /**
     *@description Employee unselected
     */
    onEmployeeUnselected: function() {
        Prototype.emptyFunction();
    },
    /**
    *@description Calls SAP with a PAI service to refresh the screen
    *@param {Object} args Information about the field that calls the service
    */
    _paiEvent: function(args) {
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT'))
            this._setDatePickersObservers(false);
        this.virtualHtml.down('div#applicationtimeEntryScreen_fieldPanel').update("");
        this.fieldPanel.destroy();
        var arguments = getArgs(args);
        var servicePai = arguments.servicePai;
        var jsonToSend = {
            EWS: {
                SERVICE: servicePai,
                OBJECT: {
                    TYPE: 'P',
                    TEXT: this.employeeId
                },
                PARAM: {
                    o_field_settings: this.fpjson.EWS.o_field_settings,
                    o_field_values: this.fpjson.EWS.o_field_values
                }
            }
        };
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            // Temporal success method
            successMethod: '_refreshEvent'
        }));
    },
    /**
    *@description Refreshes the screen after a PAI service
    *@param {JSON} json Information from the PAI service
    */
    _refreshEvent: function(json) {
        // Refreshing values and fieldtechnames hashes
        var event = json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.eventHash = new Hash();
        this.fieldtechnames = new Hash();
        for (var i = 0; i < event.length; i++) {
            if (!Object.isEmpty(event[i]['@fieldtechname']))
                this.eventHash.set(event[i]['@fieldtechname'], event[i]);
            else
                this.eventHash.set(event[i]['@fieldid'], event[i]);
            this.fieldtechnames.set(event[i]['@fieldid'], event[i]['@fieldtechname']);
        }
        var fields = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);
        // Radio group for all day (it has no field, so it won't be changed)
        // It is necessary to do this again because it will be possible to have new fields (radio buttons)
        this.radioGroup = new Hash();
        this.alldfGroup = null;
        for (var i = 0; i < fields.length; i++) {
            var fieldtechname = this.fieldtechnames.get(fields[i]['@fieldid']);
            fieldtechname = Object.isEmpty(fieldtechname) ? fields[i]['@fieldid'] : fieldtechname;
            if (!Object.isEmpty(fields[i]['@display_group']) && !Object.isEmpty(fieldtechname)) {
                if (Object.isEmpty(this.radioGroup.get(fields[i]['@display_group'])))
                    this.radioGroup.set(fields[i]['@display_group'], new Array());
                this.radioGroup.get(fields[i]['@display_group']).push(fieldtechname);
                if (fieldtechname == 'ALLDF')
                    this.alldfGroup = 'OPT' + fields[i]['@display_group'].substring(fields[i]['@display_group'].indexOf('_'));
            }
        }
        // Settings and values from PAI service
        this.fpjson.EWS.o_field_settings = json.EWS.o_field_settings;
        this.fpjson.EWS.o_field_values = json.EWS.o_field_values;
        // Redefined services
        var selectedEmployee = this.employeeId;
        var begda = this.eventHash.get('BEGDA')['@value'];
        var redefinedServices = this._getRedefinedServices(selectedEmployee, begda);
        // Mode will be always edit
        var mode = 'edit';
        // Buttons
        this.hashToSaveButtons = $H({});
        var buttonsScreen = this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
        buttonsScreen.each( function(pair) {
            if ((pair['@okcode'] == 'INS') || (pair['@okcode'] == 'MOD'))
                var functionToExecute = this._submitActions.bind(this, pair);
            if (pair['@okcode'] == 'DEL')
                var functionToExecute = this._confirmationMessage.bind(this, pair['@action'], pair['@okcode'], pair['@type'], pair['@label_tag']);
            if (pair['@action'].include('TEAM'))
                var functionToExecute = this._toggleTeamCalendar.bind(this, pair);
            this.hashToSaveButtons.set(pair['@action'], functionToExecute);
        }.bind(this));
        this.hashToSaveButtons.set('paiEvent', this._paiEvent.bind(this));
        this.hashToSaveButtons.set('cancel', this._exit.bind(this, null, ""));
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({ 
            mode: mode, 
            json: this.fpjson, 
            appId: this.appId, 
            predefinedXmls: redefinedServices,
            showCancelButton: true, 
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp120Left' }),
            linkTypeHandlers: $H({REC_LINK: this._displayRecurrenceWindow.bind(this)})
        });
        this.virtualHtml.down('div#applicationtimeEntryScreen_fieldPanel').insert(this.fieldPanel.getHtml());
        if (!Object.isEmpty(this.recurrenceInfo))
            this._deleteRecurrence();
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT')) {
            this._setDatePickersObservers(true);
            this.groupEnabled = true;
            this._correctDateSelected();
        }
    },
    /**
    *@description Open recurrent event's popup and shows its information if it was defined
    */
    _displayRecurrenceWindow: function() {
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT'))
            this._setDatePickersObservers(false);
        this.recurrenceHTML = new Element('div');
        var html = "<span class='application_main_title2'>" + global.getLabel('recPattern') + "</span><br /><br />" +
                   "<form name='recurrenceInfo'><table>" +
                       "<tr>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input id='applicationtimeEntryScreen_rec_frequencyD' type='radio' name='rec_frequency' value='D' checked> " + global.getLabel('daily') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input id='applicationtimeEntryScreen_rec_frequencyW' type='radio' name='rec_frequency' value='W'> " + global.getLabel('weekly') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input id='applicationtimeEntryScreen_rec_frequencyM' type='radio' name='rec_frequency' value='M'> " + global.getLabel('monthly') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'></td>" +
                       "</tr>" +
                       "<tr>" +
                           "<td colspan=4>" +
                               "<br /><span>" + global.getLabel('every') + "</span>&nbsp;&nbsp;&nbsp;" +
                               "<input type='text' id='applicationtimeEntryScreen_rec_patternInput' class='fieldDisplayer_input applicationtimeEntryScreen_recInput'>&nbsp;&nbsp;&nbsp;" +
                               "<span id='applicationtimeEntryScreen_rec_patternLabel'>" + global.getLabel('days') + "</span>" +
                           "</td>" +
                       "</tr>" +
                       "<tr id='applicationtimeEntryScreen_rec_partternRow1'>" +
                           "<td colspan=4>" +
                               "<input id='applicationtimeEntryScreen_rec_monthlyD' type='radio' name='rec_monthly' value='D' checked> " +
                               "<span>" + global.getLabel('day') + "</span>&nbsp;&nbsp;&nbsp;" +
                               "<input type='text' id='applicationtimeEntryScreen_rec_dayInput' class='fieldDisplayer_input applicationtimeEntryScreen_recInput'>&nbsp;&nbsp;&nbsp;" +
                           "</td>" +
                       "</tr>" +
                       "<tr id='applicationtimeEntryScreen_rec_partternRow2'>" +
                           "<td colspan=4>" +
                               "<input id='applicationtimeEntryScreen_rec_monthlyC' type='radio' name='rec_monthly' value='C'> " +
                               "<select name='rec_monthlyList'>" +
                                   "<option value='1'>" + global.getLabel('first') + "</option>" +
                                   "<option value='2'>" + global.getLabel('second') + "</option>" +
                                   "<option value='3'>" + global.getLabel('third') + "</option>" +
                                   "<option value='4'>" + global.getLabel('fourth') + "</option>" +
                                   "<option value='5'>" + global.getLabel('last') + "</option>" +
                               "</select>  " +
                               "<select name='rec_monthlyDays'>" +
                                   "<option value='mon'>" + global.getLabel('monDay') + "</option>" +
                                   "<option value='tue'>" + global.getLabel('tueDay') + "</option>" +
                                   "<option value='wed'>" + global.getLabel('wedDay') + "</option>" +
                                   "<option value='thu'>" + global.getLabel('thuDay') + "</option>" +
                                   "<option value='fri'>" + global.getLabel('friDay') + "</option>" +
                                   "<option value='sat'>" + global.getLabel('satDay') + "</option>" +
                                   "<option value='sun'>" + global.getLabel('sunDay') + "</option>" +
                               "</select> " +
                           "</td>" +
                       "</tr>" +
                       "<tr id='applicationtimeEntryScreen_rec_partternRow3'>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='mon'> " + global.getLabel('monDay') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='tue'> " + global.getLabel('tueDay') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='wed'> " + global.getLabel('wedDay') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='thu'> " + global.getLabel('thuDay') + "</td>" +
                       "</tr>" +
                       "<tr id='applicationtimeEntryScreen_rec_partternRow4'>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='fri'> " + global.getLabel('friDay') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='sat'> " + global.getLabel('satDay') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='sun'> " + global.getLabel('sunDay') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'></td>" +
                       "</tr>" +
                   "</table><br />" +
                   "<span class='application_main_title2'>" + global.getLabel('recRange') + "</span><br /><br />" +
                   "<table>" +
                       "<tr>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeLabels'>" + global.getLabel('start') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeRadio'></td>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeValues'><div id='applicationtimeEntryScreen_rec_startDate'></div></td>" +
                       "</tr>" +
                       "<tr>" +
                           "<td colspan=3><br /></td>" +
                       "</tr>" +
                       "<tr>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeLabels'>" + global.getLabel('end') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeRadio'><input type='radio' name='rec_range' value='A' checked></td>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeValues'>" +
                               "<span>" + global.getLabel('after') + "</span>&nbsp;&nbsp;&nbsp;" +
                               "<input type='text' id='applicationtimeEntryScreen_rec_rangeInput' class='fieldDisplayer_input applicationtimeEntryScreen_recInput'>&nbsp;&nbsp;&nbsp;" +
                               "<span>" + global.getLabel('occurences') + "</span>" +
                           "</td>" +
                       "</tr>" +
                       "<tr>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeLabels'></td>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeRadio'><input type='radio' name='rec_range' value='D'></td>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeValues'><div id='applicationtimeEntryScreen_rec_endDate'></div></td>" +
                       "</tr>" +
                   "</table></form>";
        this.recurrenceHTML.insert(html);
        // Daily is selected by default --> Hidding days of the week
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow1]').hide();
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow2]').hide();
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow3]').hide();
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow4]').hide();
        // Error message div (number of occurrences)
        var messageDiv = "<div id='applicationtimeEntryScreen_occErrorMessages'></div>";
        this.recurrenceHTML.insert(messageDiv);
        this.recurrenceHTML.down('div#applicationtimeEntryScreen_occErrorMessages').hide();
        // Error message div (recurrence pattern amount)
        messageDiv = "<div id='applicationtimeEntryScreen_recPatErrorMessage'></div>";
        this.recurrenceHTML.insert(messageDiv);
        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recPatErrorMessage').hide();
        // Listening clicks for frequency radio buttons
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_frequencyD]').observe('click', this._showPattern.bind(this, 'D'));
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_frequencyW]').observe('click', this._showPattern.bind(this, 'W'));
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_frequencyM]').observe('click', this._showPattern.bind(this, 'M'));
        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            var save = this._saveRecurrence();
            if ( save.get('check1') && save.get('check2') ) {   //The data has been properly set
                recurrentEventPopUp.close();
                delete recurrentEventPopUp;
                this._displayRecurrentEvent();
            }
            else {
                if(!save.get('check1')){                      //Number of occurrences incorrectly set
                    var limit = Object.isEmpty(this.recurrenceDateLimit) ? global.maximumRecurrences : this.recurrenceDateLimit;
                    this.recurrenceHTML.down('div#applicationtimeEntryScreen_occErrorMessages').show();
                    this.recurrenceHTML.down('div#applicationtimeEntryScreen_occErrorMessages').update(global.getLabel('occurExceeded') + ' (' + limit + ')');
                    if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT'))
                        this._setDatePickersObservers(true);
                }else{
                    this.recurrenceHTML.down('div#applicationtimeEntryScreen_occErrorMessages').hide();
                }
                if(!save.get('check2')){                      //Recurrence pattern number incorrectly set
                    this.recurrenceHTML.down('div#applicationtimeEntryScreen_recPatErrorMessage').show();
                    this.recurrenceHTML.down('div#applicationtimeEntryScreen_recPatErrorMessage').update( global.getLabel('recPatError') );
                }else{
                    this.recurrenceHTML.down('div#applicationtimeEntryScreen_recPatErrorMessage').hide();
                }
            }
        }.bind(this);
        var saveButton = {
            idButton: 'REC_SAVE',
            label: global.getLabel('save'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(saveButton);
        if (!Object.isEmpty(this.recurrenceInfo)) {
            var callBack2 = function() {
                this._deleteRecurrence();
                recurrentEventPopUp.close();
                delete recurrentEventPopUp;
                this._undisplayRecurrentEvent();
            }.bind(this);
            var deleteButton = {
                idButton: 'REC_DELETE',
                label: global.getLabel('delete'),
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: callBack2,
                type: 'button',
                standardButton: true
            };
            buttonsJson.elements.push(deleteButton);
        }
        var callBack3 = function() {
            this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_frequencyD]').stopObserving();
            this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_frequencyW]').stopObserving();
            this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_frequencyM]').stopObserving();
            recurrentEventPopUp.close();
            delete recurrentEventPopUp;
            if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT'))
                this._setDatePickersObservers(true);
        }.bind(this);
        var cancelButton = {
            idButton: 'REC_CANCEL',
            label: global.getLabel('cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(cancelButton);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        this.recurrenceHTML.insert(buttons);
        // infoPopUp creation
        var recurrentEventPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('cancel'),
                'callBack': callBack3
            }),
            htmlContent: this.recurrenceHTML,
            indicatorIcon: 'void',
            width: 530
        });
        recurrentEventPopUp.create();
        // datepickers creation (we can't do this before)
        var startDate = Object.isEmpty(this.recurrenceInfo) ? this.eventHash.get('BEGDA')['@value'].gsub('-','') : this.recurrenceInfo.get('range_start').gsub('-','');
        this.startDatePicker = new DatePicker('applicationtimeEntryScreen_rec_startDate', {
            defaultDate: startDate,
            draggable: true,
            manualDateInsertion: true
        });
        var endDate = (Object.isEmpty(this.recurrenceInfo) || Object.isEmpty(this.recurrenceInfo.get('endda'))) ? this.eventHash.get('ENDDA')['@value'].gsub('-','') : this.recurrenceInfo.get('endda').gsub('-','');
        this.endDatePicker = new DatePicker('applicationtimeEntryScreen_rec_endDate', {
            defaultDate: endDate,
            draggable: true,
            manualDateInsertion: true
        });
        // Showing previous saved recurrence
        if (!Object.isEmpty(this.recurrenceInfo)) {
            // Daily, weekly or monthly radio buttons
            var pattern = this.recurrenceInfo.get('dtype');
            this._showPattern(pattern);
            if (pattern != 'D') { // Daily is selected by default
                document.recurrenceInfo.rec_frequency[0].checked = false;
                if (pattern == 'W') // Weekly
                    document.recurrenceInfo.rec_frequency[1].checked = true;
                else // Monthly
                    document.recurrenceInfo.rec_frequency[2].checked = true;
            }
            // Field with recurrence pattern (Every...)
            var patternInput = '';
            if (pattern != 'D')
                patternInput = this.recurrenceInfo.get('nrweek_month');
            else
                patternInput = this.recurrenceInfo.get('nrday');
            this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_patternInput]').value = patternInput;
            // Days of the week ...
            var weekDays = this.recurrenceInfo.get('selected_days');
            // ... for a weekly recurrence
            if (pattern == 'W') {
                var recPattForm = document.recurrenceInfo.rec_pattern;
                var length = recPattForm.length;
                for (var i = 0; i < length; i++)  {
                    if (weekDays.indexOf(recPattForm[i].value) < 0)
                        recPattForm[i].checked = false;
                    else
                        recPattForm[i].checked = true;
                }
            }
            // ... for a monthly recurrence
            if (pattern == 'M') {
                var options = document.recurrenceInfo.rec_monthlyDays.options;
                var length = options.length;
                var found = false;
                for (var i = 0; (i < length) && !found; i++)  {
                    if (options[i].value == weekDays[0]) {
                        options[i].selected = true;
                        found = true;
                    }
                }
            }
            // Other fields (monthly recurrences)
            if (pattern == 'M') {
                var dayValue = this.recurrenceInfo.get('nrday');
                if (weekDays.length == 0)
                    this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_dayInput]').value = dayValue;
                else {
                    var options = document.recurrenceInfo.rec_monthlyList.options;
                    var length = options.length;
                    var found = false;
                    for (var i = 0; (i < length) && !found; i++)  {
                        if (options[i].value == dayValue) {
                            options[i].selected = true;
                            found = true;
                        }
                    }
                }
                var recMonthlyForm = document.recurrenceInfo.rec_monthly;
                if (weekDays.length > 0) {
                    recMonthlyForm[0].checked = false; // Day
                    recMonthlyForm[1].checked = true; // Custom
                }
            }
            var occurences = this.recurrenceInfo.get('nrocc');
            if (!Object.isEmpty(occurences))
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_rangeInput]').value = occurences;
            else {
                document.recurrenceInfo.rec_range[0].checked = false; // Occurences
                document.recurrenceInfo.rec_range[1].checked = true; // End date
            }
        }
    },
    /**
    *@description Toggles the recurrence pattern
    *@param {string} pattern Daily ('D'), Weekly ('W') or Monthly ('M')
    */
    _showPattern: function(pattern) {
        switch (pattern) {
            case 'D': // Daily
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow1]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow2]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow3]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow4]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_patternLabel]').update(global.getLabel('days'));
                break;
            case 'W': // Weekly
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow1]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow2]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow3]').show();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow4]').show();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_patternLabel]').update(global.getLabel('weeks'));
                break;
            case 'M': // Monthly
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow1]').show();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow2]').show();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow3]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow4]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_patternLabel]').update(global.getLabel('months'));
                break;
        }
    },
    /**
    *@description Checks if the max number of occurences was reached
    *@param {Hash} recurrence Recurrence options
    *@returns {Booelan} allow Says if recurrence can be saved
    */
    _checkOccurences: function(recurrence) {
        this.recurrenceDateLimit = "";
        var allow = true;
        var maxOcc = parseInt(global.maximumRecurrences);
        // Number of occurrences filled
        if (Object.isEmpty(recurrence.get('endda'))) {
            var occ = parseInt(recurrence.get('nrocc'));
            if (occ > maxOcc)
                allow = false;
        }
        // End date filled
        else {
            var dtype = recurrence.get('dtype');
            var days = (dtype == 'D') ? 1 : ((dtype == 'W') ? 7 : 31);
            var every = (dtype == 'D') ? parseInt(recurrence.get('nrday')) : parseInt(recurrence.get('nrweek_month'));
            var daysFromBegda = maxOcc * days * every;
            var limitDate = Date.parseExact(recurrence.get('range_start'), 'yyyy-MM-dd').addDays(daysFromBegda);
            var endDate = Date.parseExact(recurrence.get('endda'), 'yyyy-MM-dd');
            if (endDate.isAfter(limitDate)) {
                allow = false;
                this.recurrenceDateLimit = limitDate.toString('dd.MM.yyyy');
            }
        }
        return allow;
    },
    
    /**
    *@description it tells us if the number of days/weeks/months in the recurrence pattern is properly set
    *@param info the information stored in the pop-up   
    *@returns {Boolean} result 
    */
    _checkPatternNumber: function(info) {
        if( info.get('dtype')!="D" ){     // we have set the number of weeks or months
            if( !(info.get('nrweek_month') ).match(/\D+/) ){          //it's a positive integer
                var number = parseInt( (info.get('nrweek_month') ),10);  //we get the number from the string
                if(number >= 1){
                    info.set('nrweek_month',number);    // in case we have zeros to the left
                    return true;
                }else{
                    return false;
                }
            }else{                          //it's something different from a positive integer
                return false;
            }
           
        }else {    // we have set the number of days
            if( !(info.get('nrday') ).match(/\D+/) ){          //it's a positive integer
                var number = parseInt( (info.get('nrday') ),10);  //we get the number from the string
                if(number >= 1){
                    info.set('nrday',number);    // in case we have zeros to the left
                    return true;
                }else{
                    return false;
                }
            }else{                          //it's something different from a positive integer
                return false;
            }
           
        }
            
    },
    /**
    *@description Stores a recurrent event
    *@returns {Hash} check Says if some error has happened setting some values
    */
    _saveRecurrence: function() {
        // Getting frequency properties
        var found = false;
        var dtype = '';
        var recFreqForm = document.recurrenceInfo.rec_frequency;
        var length = recFreqForm.length;
        for (var i = 0; (i < length) && !found; i++)  {
            if (recFreqForm[i].checked) {
                dtype = recFreqForm[i].value;
                found = true;
            }
        }
        var nrday = '';
        var nrweek_month = '0';
        if (dtype == 'D') {
            nrday = this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_patternInput]').value;
            if (Object.isEmpty(nrday))
                nrday = 1;
        }
        else {
            nrweek_month = this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_patternInput]').value;
            if (Object.isEmpty(nrweek_month))
                nrweek_month = 1;
            if (dtype == 'M') {
                var recMonthlyForm = document.recurrenceInfo.rec_monthly;
                if (recMonthlyForm[0].checked) { // Day selected
                    nrday = this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_dayInput]').value;
                    if (Object.isEmpty(nrday))
                        nrday = 1;
                }
                else // Custom selected
                    nrday = document.recurrenceInfo.rec_monthlyList.value;
            }
        }
        var selected_days = new Array();
        if (dtype == 'W') {
            var recPattForm = document.recurrenceInfo.rec_pattern;
            length = recPattForm.length;
            for (var i = 0; i < length; i++)  {
                if (recPattForm[i].checked) {
                    selected_days.push(recPattForm[i].value);
                }
            }
            if (selected_days.length == 0)
                selected_days.push('mon');
        }
        if (dtype == 'M') {
            var recMonthlyForm = document.recurrenceInfo.rec_monthly;
            if (recMonthlyForm[1].checked) // Custom selected
                selected_days.push(document.recurrenceInfo.rec_monthlyDays.value);
        }
        // Getting range properties
        var range_start = this.startDatePicker.actualDate.toString('yyyy-MM-dd');
        found = false;
        var range;
        var nrocc = '';
        var endda = '';
        var recRangForm = document.recurrenceInfo.rec_range;
        length = recRangForm.length;
        for (var i = 0; (i < length) && !found; i++)  {
            if (recRangForm[i].checked) {
                range = recRangForm[i].value;
                found = true;
            }
        }
        if (range == 'A') {
            nrocc = this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_rangeInput]').value;
            if (Object.isEmpty(nrocc))
                nrocc = 1;
        }
        else
            endda = this.endDatePicker.actualDate.toString('yyyy-MM-dd');
        // Saving all recurrence properties
        var recurrenceInfo = new Hash();
        recurrenceInfo.set('dtype', dtype);
        recurrenceInfo.set('nrday', nrday);
        recurrenceInfo.set('nrweek_month', nrweek_month);
        recurrenceInfo.set('selected_days', selected_days);
        recurrenceInfo.set('range_start', range_start);
        recurrenceInfo.set('nrocc', nrocc);
        recurrenceInfo.set('endda', endda);
        var check1 = this._checkOccurences(recurrenceInfo);
        var check2 = this._checkPatternNumber(recurrenceInfo);
        if (check1 && check2)
            this.recurrenceInfo = recurrenceInfo;
        var check = new Hash();
        check.set('check1',check1);
        check.set('check2',check2);
        return check;
    },
    /**
    *@description Erases a recurrent event
    */
    _deleteRecurrence: function() {
        this.recurrenceInfo = null;
    },
    /**
    *@description Displays all neccesary fields to create a new recurrent event
    */
    _displayRecurrentEvent: function() {
        this.virtualHtml.down('div#applicationtimeEntryScreen_fieldPanel').update("");
        this.fieldPanel.destroy();
        this.fieldPanel = null;
        if (Object.isEmpty(this.recfpjson)) {
            this.recfpjson = deepCopy(this.fpjson);
            // Building new settings for recurrence info
            var settings = this.recfpjson.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field;
            var length = settings.length;
            var changed = 0; // We have to change 4 fields, after that the loop will end
            for (var i = 0; (i < length) && (changed < 4); i++) {
                var fieldtechname = this.fieldtechnames.get(settings[i]['@fieldid']);
                if (fieldtechname == 'BEGDA') {
                    settings[i]['@display_attrib'] = 'HID';
                    settings[i]['@depend_field'] = '';
                    settings[i]['@depend_type'] = '';
                    changed++;
                }
                if (fieldtechname == 'ENDDA') {
                    settings[i]['@display_attrib'] = 'HID';
                    settings[i]['@depend_field'] = '';
                    settings[i]['@depend_type'] = '';
                    changed++;
                }
                // We have to check the fieldid for these fields
                if (settings[i]['@fieldid'] == 'REC_LINK') {
                    settings[i]['@depend_field'] = 'REC_TEXT';
                    changed++;
                }
                if (settings[i]['@fieldid'] == 'REC_TEXT') {
                    settings[i]['@display_attrib'] = 'OPT';
                    changed++;
                }
            }
        }
        // Building new values for recurrence info
        var values = this.recfpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        length = values.length;
        changed = 0; // We have to change 1 fields, after that the loop will end
        for (var i = 0; (i < length) && (changed < 1); i++) {
            if (values[i]['@fieldid'] == 'REC_TEXT') {
                var text = '';
                var dtype = this.recurrenceInfo.get('dtype');
                var endda = this.recurrenceInfo.get('endda');
                switch (dtype) {
                    case 'D': // Daily
                        var nrday = parseInt(this.recurrenceInfo.get('nrday'));
                        if (Object.isEmpty(endda)) { // Occurences
                            if (nrday > 1)
                                text = global.getLabel('recInfoDaily2');
                            else
                                text = global.getLabel('recInfoDaily1');
                        }
                        else { // End date
                            if (nrday > 1)
                                text = global.getLabel('recInfoDaily4');
                            else
                                text = global.getLabel('recInfoDaily3');
                        }
                        break;
                    case 'W': // Weekly
                        var nrweek_month = parseInt(this.recurrenceInfo.get('nrweek_month'));
                        if (Object.isEmpty(endda)) { // Occurences
                            if (nrweek_month > 1)
                                text = global.getLabel('recInfoWeekly2');
                            else
                                text = global.getLabel('recInfoWeekly1');
                        }
                        else { // End date
                            if (nrweek_month > 1)
                                text = global.getLabel('recInfoWeekly4');
                            else
                                text = global.getLabel('recInfoWeekly3');
                        }
                        break;
                    case 'M': // Monthly
                        var nrweek_month = parseInt(this.recurrenceInfo.get('nrweek_month'));
                        var nrday = parseInt(this.recurrenceInfo.get('nrday'));
                        var selected_days = this.recurrenceInfo.get('selected_days');
                        if (Object.isEmpty(endda)) { // Occurences
                            if (nrweek_month > 1) {
                                if (selected_days.length == 0) // Day (number)
                                    text = global.getLabel('recInfoMonthly3');
                                else { // Day of the week
                                    text = global.getLabel('recInfoMonthly4');
                                }
                            }
                            else {
                                if (selected_days.length == 0) // Day (number)
                                    text = global.getLabel('recInfoMonthly1');
                                else { // Day of the week
                                    text = global.getLabel('recInfoMonthly2');
                                }
                            }
                        }
                        else { // End date
                            if (nrweek_month > 1) {
                                if (selected_days.length == 0) // Day (number)
                                    text = global.getLabel('recInfoMonthly7');
                                else { // Day of the week
                                    text = global.getLabel('recInfoMonthly8');
                                }
                            }
                            else {
                                if (selected_days.length == 0) // Day (number)
                                    text = global.getLabel('recInfoMonthly5');
                                else { // Day of the week
                                    text = global.getLabel('recInfoMonthly6');
                                }
                            }
                        }
                        break;
                    default:
                        text = 'Recurrence info text';
                        break;
                }
                // Text marks
                if (text.include('((range_start))'))
                    text = text.gsub('((range_start))', Date.parseExact(this.recurrenceInfo.get('range_start'), 'yyyy-MM-dd').toString('dd.MM.yyyy'));
                if (text.include('((nrocc))'))
                    text = text.gsub('((nrocc))', this.recurrenceInfo.get('nrocc'));
                if (text.include('((nrday))')) {
                    var number = this.recurrenceInfo.get('nrday');
                    if ((dtype != 'M') || (!text.include('((selected_days))')))
                        text = text.gsub('((nrday))', number);
                    else {
                        if (text.include('((selected_days))')) {
                            var numberText = '';
                            switch (parseInt(number)) {
                                case 1:
                                    text = text.gsub('((nrday))', global.getLabel('first'));
                                    break;
                                case 2:
                                    text = text.gsub('((nrday))', global.getLabel('second'));
                                    break;
                                case 3:
                                    text = text.gsub('((nrday))', global.getLabel('third'));
                                    break;
                                case 4:
                                    text = text.gsub('((nrday))', global.getLabel('forth'));
                                    break;
                                default:
                                    text = text.gsub('((nrday))', global.getLabel('last'));
                                    break;
                            }
                        }
                    }
                }
                if (text.include('((endda))'))
                    text = text.gsub('((endda))', Date.parseExact(this.recurrenceInfo.get('endda'), 'yyyy-MM-dd').toString('dd.MM.yyyy'));
                if (text.include('((selected_days))')) {
                    var days = this.recurrenceInfo.get('selected_days');
                    var lengthD = days.length;
                    var daysText = '';
                    for (var j = 0; j < lengthD; j++) {
                        daysText += global.getLabel(days[j] + 'Day');
                        if (j+1 < lengthD)
                            daysText += ', ';
                    }
                    text = text.gsub('((selected_days))', daysText);
                }
                if (text.include('((nrweek_month))'))
                    text = text.gsub('((nrweek_month))', this.recurrenceInfo.get('nrweek_month'));
                // Setting text
                values[i]['@value'] = text;
                changed++;
            }
        }
        this.eventHash = new Hash();
        for (var i = 0; i < length; i++) {
            if (!Object.isEmpty(values[i]['@fieldtechname']))
                this.eventHash.set(values[i]['@fieldtechname'], values[i]);
            else
                this.eventHash.set(values[i]['@fieldid'], values[i]);
        }
        // Redefined services
        var selectedEmployee = this.employeeId;
        var begda = this.recurrenceInfo.get('range_start');
        var redefinedServices = this._getRedefinedServices(selectedEmployee, begda);
        // Mode will be always edit
        var mode = 'edit';
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({ 
            mode: mode, 
            json: this.recfpjson, 
            appId: this.appId, 
            predefinedXmls: redefinedServices,
            showCancelButton: true, 
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp120Left' }),
            linkTypeHandlers: $H({REC_LINK: this._displayRecurrenceWindow.bind(this)})
        });
        this.virtualHtml.down('div#applicationtimeEntryScreen_fieldPanel').insert(this.fieldPanel.getHtml());
        this.virtualHtml.down('div#REC_TEXT_' + this.appId + '_1_0').addClassName('fieldPanelVisualDepRecurrence');
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT')) {
            this._setDatePickersObservers(true);
            this.groupEnabled = true;
        }
    },
    /**
    *@description Removes a recurrence from the screen and returns to a normal event view
    */
    _undisplayRecurrentEvent: function() {
        // Setting eventHash with the previous values
        var previousHash = this.eventHash.clone();
        var values = this.fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.eventHash = new Hash();
        for (var i = 0; i < values.length; i++) {
            if (!Object.isEmpty(values[i]['@fieldtechname']))
                this.eventHash.set(values[i]['@fieldtechname'], values[i]);
            else
                this.eventHash.set(values[i]['@fieldid'], values[i]);
        }
        var parameters = this.eventHash.keys();
        previousHash.each( function(parameter) {
            if (parameters.indexOf(parameter.key) >= 0) {
                var value = this.eventHash.get(parameter.key);
                value['@value'] = parameter.value['@value'];
                value['#text'] = parameter.value['#text'];
                this.eventHash.set(parameter.key, value);
            }
        }.bind(this));
        // Erasing recurrence text and putting datepickers
        this.recfpjson = null;
        this.virtualHtml.down('div#applicationtimeEntryScreen_fieldPanel').update("");
        this.fieldPanel.destroy();
        this.fieldPanel = null;
        // Redefined services
        var selectedEmployee = this.employeeId;
        var begda = this.eventHash.get('BEGDA')['@value'];
        var redefinedServices = this._getRedefinedServices(selectedEmployee, begda);
        // Mode will be always edit
        var mode = 'edit';
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({ 
            mode: mode, 
            json: this.fpjson, 
            appId: this.appId, 
            predefinedXmls: redefinedServices,
            showCancelButton: true, 
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp120Left' }),
            linkTypeHandlers: $H({REC_LINK: this._displayRecurrenceWindow.bind(this)})
        });
        this.virtualHtml.down('div#applicationtimeEntryScreen_fieldPanel').insert(this.fieldPanel.getHtml());
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT')) {
            this._setDatePickersObservers(true);
            this.groupEnabled = true;
            this._correctDateSelected();
        }
    },
    /**
    *@description Returns an error message list from a service
    *@param {JSON} json Information from a service
    *@returns {Array} errorMessages
    */
    _getErrorMessages: function(json) {
        var messages = objectToArray(json.EWS.messages.item);
        var length = messages.length;
        var errorMessages = new Array();
        for (var i = 0; i < length; i++)
            // Text + Type (Error or Warning)
            errorMessages.push(messages[i]['#text'] + messages[i]['@msgty']);
        return errorMessages;
    },
    /**
    *@description Toggles the employee selection (multiselect)
    */
    _toggleSelection: function() {
        this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelection').toggle();
        this.virtualHtml.down('div#applicationtimeEntryScreen_addSelection').toggle();
        this.virtualHtml.down('div#applicationtimeEntryScreen_advSearch').toggle();
        this.virtualHtml.down('div#applicationtimeEntryScreen_advSearch_icon').toggle();
    },
    /**
    *@description Actions for new employees selection
    */
    _employeeSelected: function() {
        // Refreshing employee counter for fast entries after selections
        var lastSelected = this.multiSelect.selectedElements.last().get('data');
        var searches = this.storedSearches.keys();
        // Stored search
        if (searches.indexOf(lastSelected) >= 0)
            this.selectedSearches.push(lastSelected);
        var empCounter = this.multiSelect.selectedElements.length - this.selectedSearches.length;
        var searchMark = (this.selectedSearches.length > 0) ? "+" : "";
        if (this.advSearch)
            this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').update("(" + empCounter + searchMark + ")");
        if (this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelectionContainer').hasClassName('applicationtimeEntryScreen_fieldError'))
            this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelectionContainer').removeClassName('applicationtimeEntryScreen_fieldError');
        // Refreshing fields depending on employee selections
        this._refreshMultiDependentFields();
    },
    /**
    *@description Refreshes the employee counter for fast entries after unselections
    */
    _employeeUnselected: function() {
        var selectedElements = this.multiSelect.selectedElements;
        var length = this.selectedSearches.length;
        var searchMark = "";
        if (length > 0) {
            var finish = false;
            for (var i = 0; i < length && !finish; i++) {
                var element = this.selectedSearches[i];
                var length2 = selectedElements.length;
                var found = false;
                for (var j = 0; (j < length2) && !found; j++) {
                    if (selectedElements[j].get('data') == element)
                        found = true;
                }
                if (!found) {
                    this.selectedSearches = this.selectedSearches.without(element);
                    finish = true;
                }
            }
        }
        if (this.advSearch) {
            var empCounter = this.multiSelect.selectedElements.length - this.selectedSearches.length;
            if (this.selectedSearches.length > 0)
                searchMark = "+";
            this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').update("(" + empCounter + searchMark + ")");
        }
        // Refreshing fields depending on employee selections
        this._refreshMultiDependentFields();
    },
    /**
    *@description Returns redefined services needed for the fieldPanel
    *@param {String} employee Current employee
    *@param {String} date Current date (format: yyyy-MM-dd)
    *@returns {Hash} services
    */
    _getRedefinedServices: function(employee, date) {
        var services = new Hash();
        // Subtypes
        var serviceFieldId = "";
        var fieldId = "";
        switch (this.eventCode) {
            case 'ABS':
            case 'ATT':
            case 'OVT':
                serviceFieldId = 'AWART';
                fieldId = (this.fieldsDependingOnMulti.indexOf('M_AWART') >= 0) ? 'M_AWART' : 'AWART';
                break;
            case 'AVL':
                serviceFieldId = 'SUBTY';
                fieldId = (this.fieldsDependingOnMulti.indexOf('M_SUBTY') >= 0) ? 'M_SUBTY' : 'SUBTY';
                break;
            case 'WSC': // Substitution
                serviceFieldId = 'VTART';
                fieldId = (this.fieldsDependingOnMulti.indexOf('M_VTART') >= 0) ? 'M_VTART' : 'VTART';
                break;
            default:
                break;
        }
        var o_employees = "";
        if (!this.isNew) 
            o_employees = "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + employee + "' />";
        else if (!this.advSearch) {
            var employees = this.getSelectedEmployees().keys();
            var length = employees.length;
            for (var i = 0; i < length; i++)
                o_employees += "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + employees[i] + "' />";
        }
        var xml = "<EWS>" +
                      "<SERVICE>" + this.getSubtypesService + "</SERVICE>" +
                      "<OBJECT TYPE='P'>" + employee + "</OBJECT>" +
                      "<PARAM>" +
                          "<APPID>" + this.appId + "</APPID>" +
                          "<WID_SCREEN>1</WID_SCREEN>" +
                          "<STR_KEY />" +
                          "<FIELD FIELDID='" + serviceFieldId + "' FIELDLABEL='Country code' FIELDTECHNAME='" + serviceFieldId + "' VALUE='' />" +
                          "<DEP_FIELDS />" +
                          "<SEARCH_PATTERN />" +
                          "<O_EMPLOYEES>" + o_employees + "</O_EMPLOYEES>" +
                      "</PARAM>" +
                  "</EWS>";
        services.set(fieldId, xml);
        // Cost centers
        var xml2 = "<EWS>" +
                       "<SERVICE>" + this.getCostCentersService + "</SERVICE>" +
                       "<OBJECT TYPE='K'></OBJECT>" +
                       "<PARAM>" +
                           "<DATUM>" + date + "</DATUM>" +
                       "</PARAM>" +
                   "</EWS>";
        services.set('KOSTL', xml2);
        return services;
    },
    /**
    *@description Returns the employee selection form code
    *@returns {String} form
    */
    _buildEmployeeSelectionForm: function() {
        var form = "<div id='applicationtimeEntryScreen_employeeSelectionContainer' class='fieldDispTotalWidth'>" +
                       "<div class='application_main_soft_text fieldDisp120Left applicationtimeEntryScreen_employees applicationtimeEntryScreen_newEmployees'>" + global.getLabel('for') + " *" + "</div>";
        if (this.advSearch) {
            form += "<div id='applicationtimeEntryScreen_employeeSelectionInfo'>" +
                        "<div id='applicationtimeEntryScreen_employeeIcon' class='applicationtimeEntryScreen_employeesIcon'></div>" +
                        "<div id='applicationtimeEntryScreen_employeeCount'><span id='applicationtimeEntryScreen_employeeCount_text'></span></div>" +
                    "</div>";
        }
        form += "<div id='applicationtimeEntryScreen_employeeSelection'";
        if (this.advSearch)
            form += " class='applicationtimeEntryScreen_employeeSelectionFast'";
        form += "></div>" +
                "<div class='fieldDispTotalWidth applicationtimeEntryScreen_employeeSelectionBorder'></div>";
        if (!this.advSearch)
            form += "<div id='applicationtimeEntryScreen_addSelection' class='application_action_link'>" + global.getLabel('addmysel') + "</div>";
        form += "</div>";
        if (this.advSearch)
            form += "<div id='applicationtimeEntryScreen_addSelection' class='application_action_link'>" + global.getLabel('addmysel') + "</div>" +
                    "<div class='application_catalog_image' id='applicationtimeEntryScreen_advSearch_icon'></div>" +
                    "<div id='applicationtimeEntryScreen_advSearch' class='application_action_link'>" + global.getLabel('advSearch') + "</div>";
        return form;              
    },
    /**
    *@description Builds the multiselect for employee selection
    */
    _buildMultiselect: function() {
        // Creating the data set with the format autocompleter.object
        this.jsonMultiselect = { autocompleter: { object: $A() } };
        var employeeList = this.getPopulation();
        if (this.advSearch && !Object.isEmpty(this.advSearchId))
            this._getStoredSearches(employeeList);
        else {
            // Inserting employees
            for (var i = 0; i < employeeList.length; i++) {
                this.jsonMultiselect.autocompleter.object.push({
                    data: employeeList[i].objectId,
                    text: employeeList[i].name
                })
            }
            // Multiselect creation
            this.multiSelect = new MultiSelect('applicationtimeEntryScreen_employeeSelection', {
                autocompleter: {
                    showEverythingOnButtonClick: false,
                    timeout: 5000,
                    templateResult: '#{text}',
                    minChars: 1
                },
                events: $H({onResultSelected: 'EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelected',
                            onRemoveBox: 'EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeUnselected'})
            }, this.jsonMultiselect);
        }
    },
    /**
    *@description Gets stored searches from the backend
    *@param {Array} employeeList Employee list
    */
    _getStoredSearches: function(employeeList) {
        var xml = "<EWS>" +
                      "<SERVICE>" + this.getStoredSearchesService + "</SERVICE>" +
                      "<PARAM><sadv_id>" + this.advSearchId + "</sadv_id></PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_setStoredSearches', ajaxID: { employeeList: employeeList } }));
    },
    /**
    *@description Insert stored searches into employee selection form
    *@param {JSON} json Information from GET_SHLP_LST service
    *@param {Hash} ID Request ID (with employee list)
    */
    _setStoredSearches: function(json, ID) {
        var employeeList = ID.employeeList;
        // Inserting employees
        for (var i = 0; i < employeeList.length; i++) {
            this.jsonMultiselect.autocompleter.object.push({
                data: employeeList[i].objectId,
                text: employeeList[i].name
            })
        }
        // Inserting stored searches
        if (Object.jsonPathExists(json, 'EWS.o_sadv_h.item')) {
            var searchList = objectToArray(json.EWS.o_sadv_h.item);
            for (var i = 0; i < searchList.length; i++) {
                var searchId = searchList[i]['@sadv_id'] + "_" + searchList[i]['@seqnr'];
                this.jsonMultiselect.autocompleter.object.push({
                    data: searchId,
                    text: searchList[i]['#text']
                });
                this.storedSearches.set(searchId, searchList[i]);
            }
        }
        // Multiselect creation
        this.multiSelect = new MultiSelect('applicationtimeEntryScreen_employeeSelection', {
            autocompleter: {
                showEverythingOnButtonClick: false,
                timeout: 5000,
                templateResult: '#{text}',
                minChars: 1
            },
            events: $H({onResultSelected: 'EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelected',
                        onRemoveBox: 'EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeUnselected'})
        }, this.jsonMultiselect);
        this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').observe('click', this._toggleSelection.bind(this));
        this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').addClassName('application_action_link');
    },
    /**
    *@description Handler for submit button
    *@param {buttonInfo} json Button's information
    */
    _submitActions: function(buttonInfo) {
        var length = this._getEmployeeSelection().length;
        if (!this.advSearch || (this.advSearch && (this.selectedSearches.length == 0) && (length <= this.maxEmpSelected)))
            this._eventAction(buttonInfo['@action'], buttonInfo['@okcode'], buttonInfo['@type'], buttonInfo['@label_tag']);
        else
            this._confirmationMessage(buttonInfo['@action'], buttonInfo['@okcode'], buttonInfo['@type'], buttonInfo['@label_tag']);
    },
    /**
    *@description Returns all selected employees in the multiselect (only employees)
    *@returns {Array} employees
    */
    _getEmployeeSelection: function() {
        var employees;
        if (this.eventKey == "") { // New event -multiselect-
            if (this.employeeRestriction) // Special user (like manager)
                employees = this.multiSelect.getSelected();
            else {
                var employee = new Hash();
                employee.set('data', global.objectId);
                employee.set('text', this.getEmployee(global.objectId).name);
                employees = new Array();
                employees.push(employee);
            }
        }
        else { // Existing event -fixed employee-
            var employee = new Hash();
            var employeeInfo = this.eventHash.get('PERNR')['@value'];
            if (employeeInfo.include('[')) {
                employee.set('data', employeeInfo.substring(employeeInfo.indexOf('[') + 1, employeeInfo.indexOf(']')));
                employee.set('text', employeeInfo.substring(0, employeeInfo.indexOf('[') - 1));
            }
            else {
                employee.set('data', employeeInfo);
                employee.set('text', '');
            }
            employees = new Array();
            employees.push(employee);
        }
        return employees;
    },
    /**
    *@description Refreshes the multiselect after an adv. search
    *@param {Object} args Says if the adv. search was launched from the left menu (true) or from other app (false)
    */
    _refreshMultiselect: function(args) {
        var arguments = getArgs(args);
        var markAsSelected = !arguments.get('comeFromMenu');
        if (!markAsSelected) {
            this.jsonMultiselect = { autocompleter: { object: $A() } };
            var employeeList = this.getPopulation();
            // Inserting employees
            var length = employeeList.length;
            for (var i = 0; i < length; i++) {
                this.jsonMultiselect.autocompleter.object.push({
                    data: employeeList[i].objectId,
                    text: employeeList[i].name
                })
            }
            this.storedSearches.each(function(search) {
                var searchId = search.value['@sadv_id'] + "_" + search.value['@seqnr'];
                this.jsonMultiselect.autocompleter.object.push({
                    data: searchId,
                    text: search.value['#text']
                })
            }.bind(this));
            this.multiSelect.updateInput(this.jsonMultiselect);
        }
        else {
            var employeesAdded = arguments.get('employeesAdded');
            var currentEmployees = deepCopy(this.jsonMultiselect.autocompleter.object);
            length = currentEmployees.length;
            var newEmployees = new Array();
            employeesAdded.each( function(employee) {
                var found = false;
                for (var i = 0; (i < length) && !found; i++) {
                    if (employee.key == currentEmployees[i].data)
                        found = true;
                }
                if (!found) {
                    this.jsonMultiselect.autocompleter.object.push({
                        data: employee.key,
                        text: employee.value.name
                    });
                }
                newEmployees.push(employee);
            }.bind(this));
            this.multiSelect.updateInput(this.jsonMultiselect);
            length = newEmployees.length;
            for (var i = 0; i < length; i++) {
                var data = new Hash();
                data.set('data', newEmployees[i].key);
                data.set('text', newEmployees[i].value.name);
                this.multiSelect.createBox(data);
                this.multiSelect.removeElementJSON(data, false);
            }
            this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').update("(" + this.multiSelect.selectedElements.length + ")");
        }
    },
    /**
    *@description Opens the advanced search
    */
    _advSearch: function() {
        global.open( $H({
            app: {
                tabId: "POPUP",
                appId: "ADVS",
                view: "AdvancedSearch"
            },
            sadv_id: this.advSearchId,
            addToMenu: false
        }));
    },
    /**
     * @description Returns an event json with essential information
     * @param {String} appId Event's type
     * @param {String} date Event's date
     * @returns {Hash} Event hash
     */
    _getEmptyEvent: function(appId, date) {
        var eventProperties = new Hash();
        eventProperties.set('APPID', {
            'text': appId
        });
        eventProperties.set('BEGDA', {
            'value': date
        });
        eventProperties.set('ENDDA', {
            'value': date
        });
        return eventProperties;
    },
    /**
     * @description Shows/Hides the radio button group if BEGDA and ENDDA are different (for ABS & ATT)
     */
    _correctDateSelected: function() {
        var begda = this.eventHash.get('BEGDA')['@value'];
        var endda = this.eventHash.get('ENDDA')['@value'];
        if ((begda == endda) && (!this.groupEnabled)) {
            this.groupEnabled = true;
            var groupElements = this.virtualHtml.down('[id=' + this.appId + '_' + this.radioGroupName + ']').childElements();
            for (var i = 0; i < groupElements.length; i++) {
                var radioButton = groupElements[i].childElements()[0];
                radioButton.writeAttribute('disabled', false);
            }
        }
        if ((begda != endda) && (this.groupEnabled)) {
            this.groupEnabled = false;
            var groupElements = this.virtualHtml.down('[id=' + this.appId + '_' + this.radioGroupName + ']').childElements();
            for (var i = 0; i < groupElements.length; i++) {
                var radioButton = groupElements[i].childElements()[0];
                radioButton.writeAttribute('disabled', true);
                if (groupElements[i].childElements()[1].childElements()[1].id.include('ALLDF'))
                    radioButton.checked = true;
                else
                    radioButton.checked = false;
            }
        }
    },
    /**
    *@description Refreshes all fields depending on employee selection (multiselect)
    */
    _refreshMultiDependentFields: function() {
        var length = this.fieldsDependingOnMulti.length;
        for (var i = 0; i < length; i++) {
            var field = this.fieldsDependingOnMulti[i];
            switch (field) {
                case 'M_AWART':
                case 'M_SUBTY':
                case 'M_VTART':
                    var employee = (this.getSelectedEmployees().keys().length == 1) ? this.getSelectedEmployees().keys()[0] : this.employeeId;
                    var o_employees = "";
                    if (!this.isNew) 
                        o_employees = "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + employee + "' />";
                    else {
                        var employees = this.multiSelect.selectedElements;
                        var length = employees.length;
                        for (var i = 0; i < length; i++) {
                            var element = this.multiSelect.selectedElements[i].get('data');
                            // We don't want stored searches
                            if (this.selectedSearches.indexOf(element) < 0)
                                o_employees += "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + element + "' />";
                        }
                        // If there aren't employees selected (only searches), we use the logged one
                        if (Object.isEmpty(o_employees) && (length > 0))
                            o_employees = "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + this.employeeId + "' />";
                    }
                    var fieldId = field.gsub('M_', '');
                    var xml = "<EWS>" +
                                  "<SERVICE>" + this.getSubtypesService + "</SERVICE>" +
                                  "<OBJECT TYPE='P'>" + employee + "</OBJECT>" +
                                  "<PARAM>" +
                                      "<APPID>" + this.appId + "</APPID>" +
                                      "<WID_SCREEN>1</WID_SCREEN>" +
                                      "<STR_KEY />" +
                                      "<FIELD FIELDID='" + fieldId + "' FIELDLABEL='Country code' FIELDTECHNAME='" + fieldId + "' VALUE='' />" +
                                      "<DEP_FIELDS />" +
                                      "<SEARCH_PATTERN />" +
                                      "<O_EMPLOYEES>" + o_employees + "</O_EMPLOYEES>" +
                                  "</PARAM>" +
                              "</EWS>";
                    this.fieldPanel.refreshField(field, "", "", xml);
                    break;
                default:
                    this.fieldPanel.refreshField(field);
                    break;
            }
        }
    },
    /**
    *@description Disables/Enables datePickers' observers
    *@param enable, Says if observers will be enabled (true) or not (false)
    */
    _setDatePickersObservers: function(enable) {
        var begdaFieldId = this.eventHash.get('BEGDA')['@fieldid'];
        var enddaFieldId = this.eventHash.get('ENDDA')['@fieldid'];
        // Always screen = 1 & record = 0 --> "10"
        var begdaFieldPanel_Id = this.fieldPanel.fieldDisplayers.get(this.appId + this.fieldPanel.mode + '10').get(begdaFieldId)._id;
        var enddaFieldPanel_Id = this.fieldPanel.fieldDisplayers.get(this.appId + this.fieldPanel.mode + '10').get(enddaFieldId)._id;
        if (enable) { // Always screen = 1 & record = 0 --> "10"
            document.observe('EWS:datePickerCorrectDate_' + begdaFieldId + '_' + begdaFieldPanel_Id + '_' + this.appId + '10' + this.fieldPanel.randomId, this.timeEntryCorrectDateBinding);
            document.observe('EWS:datePickerCorrectDate_' + enddaFieldId + '_' + enddaFieldPanel_Id + '_' + this.appId + '10' + this.fieldPanel.randomId, this.timeEntryCorrectDateBinding);
        }
        else { // Always screen = 1 & record = 0 --> "10"
            document.stopObserving('EWS:datePickerCorrectDate_' + begdaFieldId + '_' + begdaFieldPanel_Id + '_' + this.appId + '10' + this.fieldPanel.randomId, this.timeEntryCorrectDateBinding);
            document.stopObserving('EWS:datePickerCorrectDate_' + enddaFieldId + '_' + enddaFieldPanel_Id + '_' + this.appId + '10' + this.fieldPanel.randomId, this.timeEntryCorrectDateBinding);
        }
    }
});