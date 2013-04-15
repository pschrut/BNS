/**
 *@fileOverview fastEntryScreen.js
 *@description It contains a class with functionality for creating fast entries
 */
/**
 *@constructor
 *@description Class with functionality for creating fast entries.
 *@augments Application
 */
var fastEntryScreen = Class.create(Application,
/** 
*@lends fastEntryScreen
*/
{
    /**
    *Constructor of the class fastEntryScreen
    */
    initialize: function($super, args) {
        $super(args);
        this.getContentService = "GET_CONTENT2";
        this.getStoredSearchesService = "GET_SHLP_LST";
        this.saveRequestService = "SAVE_REQUEST";
        this.fastEntryService = "SAVE_REQUEST_F";
        this.submitStatus = new Hash();
        this.maxEmpSelected = global.maxOnline;
        this.fastEntryEmployeeSelectedBinding = this._employeeSelected.bindAsEventListener(this);
        this.fastEntryEmployeeUnselectedBinding = this._employeeUnselected.bindAsEventListener(this);
        this.fastEntryEmployeeSelectionBinding = this._employeeSelection.bindAsEventListener(this);
        this.fastEntryLeftMenuAdvSearchBinding = this._refreshMultiselect.bindAsEventListener(this);
        this.screenChangeBinding = this._toggleButtons.bindAsEventListener(this);
    },
    /**
    *@description Starts fastEntryScreen
    */
    run: function($super, args) {
        $super();
        if (!Object.isEmpty(args.get('event')))
            this.getContentEvent = args.get('event');
        if (this.firstRun) {
            var html = "<div id='applicationfastEntryScreen_body'></div>";
            this.virtualHtml.insert(html);
        }
        else
            this.virtualHtml.down('div#applicationfastEntryScreen_body').update("");
        if (balloon.isVisible())
            balloon.hide();
        this.advSearchId = "";
        // Information about stored searches
        this.storedSearches = new Hash();
        this.selectedSearches = new Array();
        // Number of screens
        this.screensNumber = 0;
        this.submitButtons = null;
        // Says if we have already selected the fields for the current screen
        this.eventHashChanged = false;
        this._getScreen();
        document.observe('EWS:autocompleterResultSelected_applicationfastEntryScreen_employeeSelected', this.fastEntryEmployeeSelectedBinding);
        document.observe('EWS:autocompleterResultSelected_applicationfastEntryScreen_employeeUnselected', this.fastEntryEmployeeUnselectedBinding);
        document.observe('EWS:autocompleterResultSelected_applicationfastEntryScreen_employeeSelection', this.fastEntryEmployeeSelectionBinding);
        document.observe('EWS:allEmployeesAdded', this.fastEntryLeftMenuAdvSearchBinding);
    },
    /**
    *@description Stops fastEntryScreen
    */
    close: function($super) {
        $super();
        document.stopObserving('EWS:autocompleterResultSelected_applicationfastEntryScreen_employeeSelected', this.fastEntryEmployeeSelectedBinding);
        document.stopObserving('EWS:autocompleterResultSelected_applicationfastEntryScreen_employeeUnselected', this.fastEntryEmployeeUnselectedBinding);
        document.stopObserving('EWS:autocompleterResultSelected_applicationfastEntryScreen_employeeSelection', this.fastEntryEmployeeSelectionBinding);
        document.stopObserving('EWS:allEmployeesAdded', this.fastEntryLeftMenuAdvSearchBinding);
        if (this.screensNumber > 1)
            document.stopObserving('EWS:screensNavigationLinksClicked', this.screenChangeBinding);
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
    *@description Gets information for the new fast entry
    */
    _getScreen: function() {
        var xml = "<EWS>" +
                      "<SERVICE>" + this.getContentService + "</SERVICE>" +
                      "<OBJECT TYPE=''></OBJECT>" +
                      "<PARAM>" +
                          "<APPID>" + this.options.appId + "</APPID>" +
                          "<WID_SCREEN>*</WID_SCREEN>" +
                          "<OKCODE>NEW</OKCODE>" +
                      "</PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_displayScreen' }));
    },
    /**
    *@description Displays all neccesary fields to create a new fast entry
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    _displayScreen: function(json) {
        // Solving problem with screens path
        if (!Object.jsonPathExists(json, 'EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen'))
            json.EWS.o_widget_screens.yglui_str_wid_screen = { yglui_str_wid_screen: json.EWS.o_widget_screens.yglui_str_wid_screen };
        // Deleting list mode
        var screens = objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen);
        this.screensNumber = screens.length;
        for (var i = 0; i < this.screensNumber; i++)
            screens[i]['@list_mode'] = "";
        // Deleting 'Change' and 'Delete' buttons
        var values = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < this.screensNumber; i++)
            delete(values[i].contents.yglui_str_wid_content.buttons);
        // Adding handlers to all buttons
        this.hashToSaveButtons = $H({});
        this.hashToSaveButtons.set('cancel', this._exit.bind(this));
        // Changing 'Add' button properties and adding it a handler
        var buttons = objectToArray(json.EWS.o_screen_buttons.yglui_str_wid_button);
        if (this.screensNumber > 1)
            this.submitButtons = new Array();
        for (var i = 0; i < this.screensNumber; i++) {
            buttons[i]['@screen'] = "*";
            buttons[i]['@label_tag'] = global.getLabel('submit');
            if (this.screensNumber > 1)
                this.submitButtons.push(buttons[i]['@action']);
            if (buttons[i]['@okcode'] == 'INS') {
                var functionToExecute = this._submitActions.bind(this, buttons[i])
                this.hashToSaveButtons.set(buttons[i]['@action'], functionToExecute);
            }
        }
        // Storing fields
        this.eventHash = new Hash();
        if (this.screensNumber == 1) { // One screen
            var fvalues = values[0].contents.yglui_str_wid_content.fields.yglui_str_wid_field;
            for (var i = 0; i < fvalues.length; i++)
                this.eventHash.set(fvalues[i]['@fieldid'], fvalues[i]);
        }
        else { // More than one screen (Quota)
            for (var i = 0; i < this.screensNumber; i++) {
                var fvalues = values[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field;
                var valuesHash = new Hash();
                for (var j = 0; j < fvalues.length; j++)
                    valuesHash.set(fvalues[j]['@fieldid'], fvalues[j]);
                this.eventHash.set(this.submitButtons[i], valuesHash);
            }
        }
        // Getting adv. search id
        var fields = null;
        if (this.screensNumber == 1) // One screen
            fields = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);
        else // More than one screen (Quota)
            fields = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field);
            
        var begda = !Object.isEmpty(this.getContentEvent) && Object.isHash(this.getContentEvent) ? this.getContentEvent.get('BEGDA').value : '';
        var endda = !Object.isEmpty(this.getContentEvent) && Object.isHash(this.getContentEvent) ? this.getContentEvent.get('ENDDA').value : '';
        for (var i = 0; (i < fields.length) && (Object.isEmpty(this.advSearchId)); i++) {
            if (fields[i]['@fieldid'] == 'PERNR_ADV')
                this.advSearchId = fields[i]['@sadv_id'];
            else if(fields[i]['@fieldid'] == 'BEGDA' && !Object.isEmpty(begda))
                fields[i]['@default_value'] = begda;
            else if(fields[i]['@fieldid'] == 'ENDDA' && !Object.isEmpty(endda))    
                fields[i]['@default_value'] = endda;        
        }
        // Fields out of fieldPanel (title and employee selection)
        var title = "<span class='application_main_title2'>" + this._getTitle(json) + "</span><br /><br />";
        this.virtualHtml.down('div#applicationfastEntryScreen_body').update(title);
        // Left menu employees
        this.virtualHtml.down('div#applicationfastEntryScreen_body').insert(this._buildEmployeeSelectionForm());
        this.virtualHtml.down('div#applicationfastEntryScreen_employeeSelection').toggle();
        this.virtualHtml.down('div#applicationfastEntryScreen_addSelection').observe('click', this._addMySelection.bind(this));
        this.virtualHtml.down('div#applicationfastEntryScreen_advSearch').observe('click', this._advSearch.bind(this));
        this._buildMultiselect();
        this.virtualHtml.down('span#applicationfastEntryScreen_employeeCount_text').update("(0)");
        // Field panel
        this.virtualHtml.down('div#applicationfastEntryScreen_body').insert( new Element("div", {id: "applicationfastEntryScreen_fieldPanel" }) );
        var mode = 'create';
        this.fieldPanel = new getContentModule({ 
            mode: mode, 
            json: json, 
            appId: this.options.appId,  
            showCancelButton: true,
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp120Left' }),
            hideButtonsOnCreate: false
        });
        this.virtualHtml.down('div#applicationfastEntryScreen_fieldPanel').insert(this.fieldPanel.getHtml());
        if (this.screensNumber > 1) {
            document.observe('EWS:screensNavigationLinksClicked', this.screenChangeBinding);
            for (var i = 1; i < this.screensNumber; i++)
                this.virtualHtml.down('div#applicationsLayer_button_' + this.submitButtons[i]).toggle();
        }
    },
    /**
    *@description Gets the title
    *@param {JSON} json Information from GET_CONTENT2 service
    *@returns {String} title
    */
    _getTitle: function(json) {
        if (!Object.isArray(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen)) {
            var titleCode = json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen['@label_tag'];
            var title = titleCode;
            var labels = json.EWS.labels.item;
            for (var i = 0; (i < labels.length) && (title == titleCode); i++) {
                if (labels[i]['@id'].toLowerCase() == titleCode.toLowerCase())
                    title = labels[i]['@value'];
            }
            return title;
        }
        // Quota has 2 screens and we can't do the same as for 1 screen (we can 'hardcode' it)
        else
            return global.getLabel('quota');
    },
    /**
    *@description Returns the employee selection form code
    *@returns {String} form
    */
    _buildEmployeeSelectionForm: function() {
        var form = "<div id='applicationfastEntryScreen_employeeSelectionContainer' class='fieldDispTotalWidth'>" +
                       "<div class='application_main_soft_text fieldDisp120Left applicationfastEntryScreen_employees applicationfastEntryScreen_newEmployees'>" + global.getLabel('for') + " *" + "</div>" +
                       "<div id='applicationfastEntryScreen_employeeSelectionInfo'>" +
                           "<div id='applicationfastEntryScreen_employeeIcon' class='applicationfastEntryScreen_employeesIcon'></div>" +
                           "<div id='applicationfastEntryScreen_employeeCount'><span id='applicationfastEntryScreen_employeeCount_text'></span></div>" +
                       "</div>" +
                       "<div id='applicationfastEntryScreen_employeeSelection' class='applicationfastEntryScreen_employeeSelectionFast'></div>" +
                       "<div class='fieldDispTotalWidth applicationfastEntryScreen_employeeSelectionBorder'></div>" +
                   "</div>" +
                   "<div id='applicationfastEntryScreen_addSelection' class='application_action_link'>" + global.getLabel('addmysel') + "</div>" +
                   "<div class='application_catalog_image' id='applicationfastEntryScreen_advSearch_icon'></div>" +
                   "<div id='applicationfastEntryScreen_advSearch' class='application_action_link'>" + global.getLabel('advSearch') + "</div>";
        return form;              
    },
    /**
    *@description Builds the multiselect for employee selection
    */
    _buildMultiselect: function() {
        // Creating the data set with the format autocompleter.object
        this.jsonMultiselect = { autocompleter: { object: $A() } };
        var employeeList = this.getPopulation();
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
        this.multiSelect = new MultiSelect('applicationfastEntryScreen_employeeSelection', {
            autocompleter: {
                showEverythingOnButtonClick: false,
                timeout: 5000,
                templateResult: '#{text}',
                minChars: 1
            },
            events: $H({onResultSelected: 'EWS:autocompleterResultSelected_applicationfastEntryScreen_employeeSelected',
                        onRemoveBox: 'EWS:autocompleterResultSelected_applicationfastEntryScreen_employeeUnselected'})
        }, this.jsonMultiselect);
        this.virtualHtml.down('span#applicationfastEntryScreen_employeeCount_text').observe('click', this._toggleSelection.bind(this));
        this.virtualHtml.down('span#applicationfastEntryScreen_employeeCount_text').addClassName('application_action_link');
    },
    /**
    *@description Toggles the employee selection (multiselect)
    */
    _toggleSelection: function() {
        this.virtualHtml.down('div#applicationfastEntryScreen_employeeSelection').toggle();
        this.virtualHtml.down('div#applicationfastEntryScreen_addSelection').toggle();
        this.virtualHtml.down('div#applicationfastEntryScreen_advSearch').toggle();
        this.virtualHtml.down('div#applicationfastEntryScreen_advSearch_icon').toggle();
    },
    /**
    *@description Refreshes the employee counter after selections
    */
    _employeeSelected: function() {
        var lastSelected = this.multiSelect.selectedElements.last().get('data');
        var searches = this.storedSearches.keys();
        // Stored search
        if (searches.indexOf(lastSelected) >= 0)
            this.selectedSearches.push(lastSelected);
        var empCounter = this.multiSelect.selectedElements.length - this.selectedSearches.length;
        var searchMark = (this.selectedSearches.length > 0) ? "+" : "";
        this.virtualHtml.down('span#applicationfastEntryScreen_employeeCount_text').update("(" + empCounter + searchMark + ")");
        if (this.virtualHtml.down('div#applicationfastEntryScreen_employeeSelectionContainer').hasClassName('applicationfastEntryScreen_fieldError'))
            this.virtualHtml.down('div#applicationfastEntryScreen_employeeSelectionContainer').removeClassName('applicationfastEntryScreen_fieldError');
    },
    /**
    *@description Refreshes the employee counter after unselections
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
        var empCounter = this.multiSelect.selectedElements.length - this.selectedSearches.length;
        if (this.selectedSearches.length > 0)
            searchMark = "+";
        this.virtualHtml.down('span#applicationfastEntryScreen_employeeCount_text').update("(" + empCounter + searchMark + ")");
    },
    /**
    *@description Removes the error style in the employee selection form if needed
    */
    _employeeSelection: function() {
        if (this.virtualHtml.down('div#applicationfastEntryScreen_employeeSelectionContainer').hasClassName('applicationfastEntryScreen_fieldError'))
            this.virtualHtml.down('div#applicationfastEntryScreen_employeeSelectionContainer').removeClassName('applicationfastEntryScreen_fieldError');
    },
    /**
    *@description Adds selected employees from left menu to create a new event
    */
    _addMySelection: function() {
        var previousSelected = this.multiSelect.selectedElements;
        for (var i = 0; i < previousSelected.length; i++)
            this.multiSelect.insertElementJSON(previousSelected[i]);
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
        this.virtualHtml.down('span#applicationfastEntryScreen_employeeCount_text').update("(" + this.multiSelect.selectedElements.length + ")");
        document.fire('EWS:autocompleterResultSelected_applicationfastEntryScreen_employeeSelection');
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
            this.virtualHtml.down('span#applicationfastEntryScreen_employeeCount_text').update("(" + this.multiSelect.selectedElements.length + ")");
        }
    },
    /**
    *@description Toggles the buttons for quota fast entries
    */
    _toggleButtons: function() {
        for (var i = 0; i < this.screensNumber; i++)
            this.virtualHtml.down('div#applicationsLayer_button_' + this.submitButtons[i]).toggle();
    },
    /**
    *@description Exits the application and open the previous one
    *@param {JSON} json Information from SAVE_REQUEST service
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
        else
            global.open( $H({
                app: {
                    tabId: this.options.tabId,
                    appId: global.tabid_applicationData.get(this.options.tabId).applications[0].appId,
                    view: global.tabid_applicationData.get(this.options.tabId).applications[0].view
                }
            }));
    },
    /**
    *@description Exits the application and open the previous one, showing an error message
    *@param {JSON} json Information from SAVE_REQUEST service
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
    *@description Handler for submit button
    *@param {buttonInfo} json Button's information
    */
    _submitActions: function(buttonInfo) {
        var length = this.multiSelect.selectedElements.length;
        if ((this.selectedSearches.length == 0) && (length <= this.maxEmpSelected))
            this._eventAction(buttonInfo['@action'], buttonInfo['@okcode'], buttonInfo['@type'], buttonInfo['@label_tag']);
        else
            this._confirmationMessage(buttonInfo['@action'], buttonInfo['@okcode'], buttonInfo['@type'], buttonInfo['@label_tag']);
    },
    /**
    *@description Shows a confirmation box when we are going to create a fast entry
    *@param {String} action Requested action
    *@param {String} okcode Ok Code
    *@param {String} type Type
    *@param {String} label Label
    */
    _confirmationMessage: function(action, okcode, type, label) {
        var contentHTML = new Element('div');
        var text = global.getLabel("areYouSureMass") + "<br /><br />" + global.getLabel("pressYes") + "<br />" + global.getLabel("pressNo");
        contentHTML.insert(text);
        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            fastEntryPopUp.close();
            delete fastEntryPopUp;
            this._eventAction(action, okcode, type, label);
        } .bind(this);
        var callBack3 = function() {
            fastEntryPopUp.close();
            delete fastEntryPopUp;
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
        // Insert buttons in div
        contentHTML.insert(buttons);
        var width = 550;
        var fastEntryPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    fastEntryPopUp.close();
                    delete fastEntryPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: width
        });
        fastEntryPopUp.create();
    },
    /**
    *@description Creates a fast entry
    *@param {String} action Requested action
    *@param {String} okcode Ok Code
    *@param {String} type Type
    *@param {String} label Label
    */
    _eventAction: function(action, okcode, type, label) {
        // fieldPanel validation (current screen only)
        var fpvalidation = this.fieldPanel.validateForm(this.fieldPanel.currentSelected, "0");
        var correctfp = fpvalidation.correctForm;
        // Employees validation
        var employees = this.multiSelect.selectedElements;
        var correctemp = (employees.length == 0) ? false : true;
        if (!correctemp && !this.virtualHtml.down('div#applicationfastEntryScreen_employeeSelectionContainer').hasClassName('applicationfastEntryScreen_fieldError'))
            this.virtualHtml.down('div#applicationfastEntryScreen_employeeSelectionContainer').addClassName('applicationfastEntryScreen_fieldError');
        if (correctfp && correctemp) {
            var parameters = "";
            if (this.screensNumber > 1 && !this.eventHashChanged) {
                this.eventHash = this.eventHash.get(action);
                this.eventHashChanged = true;
            }
            this.eventHash.each( function(field) {
                var fieldid = field.value['@fieldid'];
                var fieldtech = Object.isEmpty(field.value['@fieldtechname']) ? "" : field.value['@fieldtechname'];
                var fieldvalue = Object.isEmpty(field.value['@value']) ? "" : field.value['@value'];
                var fieldtext = Object.isEmpty(field.value['#text']) ? "" : field.value['#text'];
                var fieldname = Object.isEmpty(fieldtech) ? fieldid : fieldtech;
                if (fieldname != 'PERNR')
                    parameters += "<yglui_str_wid_field fieldid='" + fieldid + "' fieldlabel='' fieldtechname='" + fieldtech + "' fieldtseqnr='000000' value='" + fieldvalue + "'>" + fieldtext + "</yglui_str_wid_field>";
            }.bind(this));
            var service = this.saveRequestService;
            // REQUESTS
            var length = employees.length;
            // Normal entries
            if ((this.selectedSearches.length == 0) && (length <= this.maxEmpSelected)) {
                // Progress bar
                var message = global.getLabel('progress') +
                              "<div id='applicationfastEntryScreen_loadingBar'></div>";
                var contentHTML = new Element('div');
                contentHTML.insert(message);
                var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                };
                this.loadingPopUp = new infoPopUp ({
                    htmlContent : contentHTML,
                    indicatorIcon : 'void',                    
                    width: 600,
                    showCloseButton: false
                });
                this.loadingPopUp.create();
                this.loadingBar = new ProgressBar ({
                                      target: "applicationfastEntryScreen_loadingBar",
                                      cellsNumber: employees.length
                                  });
                for (var i = 0; i < length; i++) {
                    var employeeId = employees[i].get('data');
                    var xml = "<EWS>" +
                                  "<SERVICE>" + service + "</SERVICE>" +
                                  "<OBJECT TYPE='P'>" + employeeId + "</OBJECT>" +
                                  "<PARAM>" +
                                      "<APPID>" + this.options.appId + "</APPID>" +
                                      "<RECORDS>" +
                                          "<yglui_str_wid_record rec_key='' screen='1'>" +
                                              "<hrobject objid='' otype='' plvar='' />" +
                                              "<contents>" +
                                                  "<yglui_str_wid_content key_str='' rec_index='0' selected='X' tcontents=''>" +
                                                      "<fields>" + parameters + "</fields>" +
                                                  "</yglui_str_wid_content>" +
                                              "</contents>" +
                                          "</yglui_str_wid_record>" +
                                      "</RECORDS>" +
                                      "<BUTTON action='" + action + "' busid='' disma='' label_tag='" + label + "' okcode='" + okcode + "' screen='1' status='' tarap='' tartb='' tarty='' type='" + type + "' views='' />" +
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
                                  "<APPID>" + this.options.appId + "</APPID>" +
                                  "<RECORDS>" +
                                      "<yglui_str_wid_record rec_key='' screen='1'>" +
                                          "<hrobject objid='' otype='' plvar='' />" +
                                          "<contents>" +
                                              "<yglui_str_wid_content key_str='' rec_index='0' selected='X' tcontents=''>" +
                                                  "<fields>" + parameters + "</fields>" +
                                              "</yglui_str_wid_content>" +
                                          "</contents>" +
                                      "</yglui_str_wid_record>" +
                                  "</RECORDS>" +
                                  "<BUTTON action='" + action + "' busid='' disma='' label_tag='" + label + "' okcode='" + okcode + "' screen='1' status='' tarap='' tartb='' tarty='' type='" + type + "' views='' />" +
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
                this.virtualHtml.down('div#fieldErrorMessage_' + this.options.appId).update("Select an employee");
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
                    message += "<tr><td><span class='applicationfastEntryScreen_errorTable_employeeColumn' title='" + employeeName + "'>" + employeeName + "</span></td>";
                    message += "<td><span class='applicationfastEntryScreen_errorTable_textColumn' title='" + text + "'>" + text + "</span></td>";
                    message += "<td><div class='applicationfastEntryScreen_errorTable_iconText'>" + type + "</div>";
                    switch (type) {
                        case 'E':
                            message += "<div class='application_icon_red applicationfastEntryScreen_errorTable_iconDiv' title='" + global.getLabel('error') + "'></div>";
                            break;
                        case 'I':
                            message += "<div class='application_icon_orange applicationfastEntryScreen_errorTable_iconDiv' title='" + global.getLabel('warning') + "'></div>";
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
                instance.virtualHtml.down('div#applicationfastEntryScreen_employeeSelection').update("");
                instance.multiSelect = new MultiSelect('applicationfastEntryScreen_employeeSelection', {
                    autocompleter: {
                        showEverythingOnButtonClick: false,
                        timeout: 5000,
                        templateResult: '#{text}',
                        minChars: 1
                    }
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
                              "<table class='sortable' id='applicationfastEntryScreen_errorTable'>" +
                                  "<thead>" +
                                      "<tr>" +
                                          "<th class='applicationfastEntryScreen_errorTable_employeeColumn table_sortfirstdesc'>" + global.getLabel('employee') + "</th>" +
                                          "<th class='applicationfastEntryScreen_errorTable_textColumn'>" + global.getLabel('descr') + "</th>" +
                                          "<th class='applicationfastEntryScreen_errorTable_iconColumn'>" + global.getLabel('type') + "</th>" +
                                      "</tr>" +
                                  "</thead>" +
                                  "<tbody id='applicationfastEntryScreen_errorTable_tbody'>" + message + "</tbody>" +
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
                TableKit.Sortable.init($(document.body).down("[id=applicationfastEntryScreen_errorTable]"), { pages: parseInt(global.paginationLimit)/2 });
                TableKit.options.autoLoad = false;
                instance.errorTableCreated = true;
            }
            else
                TableKit.reloadTable($(document.body).down("[id=applicationfastEntryScreen_errorTable]"));
        }
        else {
            instance.submitStatus = new Hash();
            global.open( $H({
                app: {
                    tabId: instance.options.tabId,
                    appId: global.tabid_applicationData.get(instance.options.tabId).applications[0].appId,
                    view: global.tabid_applicationData.get(instance.options.tabId).applications[0].view
                }
            }));
        }
    }
});