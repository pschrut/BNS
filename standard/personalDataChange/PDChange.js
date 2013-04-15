
var PDChange = Class.create(Application,
/**
*@lends PDChange
*/{
/**
* Service used to get the widgets
* @type String
*/
widgetsService: 'GET_WIDGETS',
saveRequestService: 'SAVE_REQUEST',
tabId: null,
_elementsStorage: null,
_addButtons: null,
_globalButtonsContainer: null,
/**
*@param $super The superclass (Application)
*@description Instantiates the app
*/
initialize: function($super, options) {
    $super(options);
    this.tabId = this.options.tabId;
    this.widgetsReadyBinding = this.fillWidgets.bind(this);
    this._elementsStorage = new Hash();
    this._addButtons = new Hash();
    this._selectedScreens = $H();
},
run: function($super, args) {
    $super(args);
    //this.tabId = tabName;
    if (this.firstRun) {
        this.createHtml();
    }
    document.observe('PDC:widgetsReady' + this.tabId, this.widgetsReadyBinding);
},
/**
*@description creates the general sctructure and calls to the module which load the widgets
*/
createHtml: function() {
    this.employeeMessage = new Element('div', {
        'id': 'employee_message',
        'class' : 'PDC_employeeMessageLeft inlineContainer'        
    });
    this.employeeMessageName = new Element ('div',{
        'id': 'employee_message_name',
        'class' : 'application_text_bolder application_main_soft_text inlineElement '
    });
    this.employeeMessageSpace = new Element ('div',{
        'id': 'employee_message_space',
        'class' : 'inlineElement'
    });
    this.employeeMessageId = new Element ('div',{
        'id': 'employee_message_Id',
        'class' : 'application_main_soft_text inlineElement'
    });
    this.employeeMessage.insert(this.employeeMessageName);  
    this.employeeMessage.insert(this.employeeMessageSpace);  
    this.employeeMessage.insert(this.employeeMessageId);
    this.virtualHtml.insert(this.employeeMessage);     
    this.virtualHtml.insert(new Element('div', {
        'id': 'PDC_widgets_' + this.tabId,
        'class': 'PDC_widgetsDiv'
    }));    
    /******* Select user ********/
    this.warningmsg = new Element('div', {
        id: 'PDC_noESS_' + this.tabId,
        'class': 'PDC_infoMessage'
    }).update(global.getLabel('noESSselected'));
    this.virtualHtml.insert(this.warningmsg);
    this._globalButtonsContainer = new Element('div');
    this.virtualHtml.insert(this._globalButtonsContainer);
},

/**
*@description it hides the employee name and id
*/
hideEmployeeName: function(){
   this.employeeMessage.hide();    
},

/**
*@param name, the name of the employee
*@param id, the id of the employee
*@description it shows the employee name and id
*/
showEmployeeName: function(name,id){   
    this.employeeMessageName.update(name);
    this.employeeMessageSpace.update("&nbsp;");
    this.employeeMessageId.update(global.idSeparatorLeft + id + global.idSeparatorRight);
    this.employeeMessage.show();
},

/**
*@param args Args received when an employee is selected
*@description Loads the selected user widgets
*/
onEmployeeSelected: function(args) {
    this.empId = args.id;
    if(this.empId != global.objectId){      //the selected user is different from the main employee
        this.showEmployeeName(args.name,args.id);
    }else{
        this.hideEmployeeName();
    }   
    this.objectType = args.oType;
    this.warningmsg.hide();
    this.loadWidgets();    
},
/**
* @param args Args received when an employee is unselected
* @description This function is call every time an employee is unselected on the left menu
*/
onEmployeeUnselected: function(args) {
    return;
},
/**
*@param event The event 'PDC:widgetsReady'
*@description When the event is launched, meaning that we have received the widgets, we start working with them
*/
fillWidgets: function() {
    this.hashOfWidgets = this.widgetsStructure.widgets;
    //get the appId of Pending Request widget
    var appIdPendReq = '';
    var data = this.widgetsStructure.widgetsInfo;
    data.each(function(pair) {
        if (pair[1].type == 'PEND_REQ') {
            appIdPendReq = pair[0]
        }
        else {
            if (pair[1].type.substring(0, 3) == 'KPI')
                appIdPendReq = 'KPI';
        }
    } .bind(this));
    //fill each widget
    this.hashOfWidgets.each(function(pair) {
        //Pending Request widget
        if (pair[0] == appIdPendReq) {
            new PendingRequestContent(this.virtualHtml, this.hashOfWidgets, this.empId, pair[0], this.tabId, this.firstRun);
            document.observe('EWS:widgetInformationChanged_' + this.tabId, this._reloadPendingRequests.bind(this, pair[0]));
        }
        else
            if (appIdPendReq == 'KPI')
            new frame_standard(this.virtualHtml, this.hashOfWidgets, pair[0], this.firstRun)
        else
            this.fillGenericWidget(pair);
    } .bind(this));
    this.firstRun = false;
},
_reloadPendingRequests: function() {
    data = $(arguments)
    this.hashOfWidgets.get(data[0]).getContentElement().down().remove();
    new PendingRequestContent(this.virtualHtml, this.hashOfWidgets, this.empId, data[0], this.tabId, this.firstRun);
},
/**
* This function is call every time we call on save on a form that is being edit
* or when deleting a recordData
* @param data Event data
*/
_saveForm: function(data) {
    var args = $A(arguments);
    var appId = args[0];
    var screen = args[1];
    var originalScreen = screen;
    var newReg = args[2] ? args[2] : this.newRecord;
    var listMode = args[3];
    var panelToValidate = args[4];
    var selected = args[5] ? args[5] : 0;
    var json = deepCopy(this._elementsStorage.get(appId + '_' + screen).get('json'));
    var buttons = '';
    var fieldPanel = this._elementsStorage.get(appId + '_' + screen).get('fieldPanel');
    var panel = fieldPanel ? fieldPanel : panelToValidate;
    var widScreen = screen;
    //If it's list mode we get the current selected from the list
    //Checking the form format
    var validForm = panel.validateForm(screen);
    screen = panel.currentSelected;
    //If it's a new register we empty up the buttons node
    if (newReg) {
        //this._getScreen(json,screen).contents.yglui_str_wid_content['buttons'] = null;
        buttons = objectToArray(json.EWS.o_screen_buttons.yglui_str_wid_button);
        buttons = {
            BUTTON: buttons[0]
        };
    }
    else {
        //Getting the OKCODE
        if (fieldPanel.currentRecordIndex)
            selected = parseInt(fieldPanel.currentRecordIndex, 10);
        else if (panel)
            if (panel.currentRecordIndex)
            selected = panel.currentRecordIndex;
        var buttonsNode = this._getScreen(json, screen).contents.yglui_str_wid_content;
        if (fieldPanel.currentRecordIndex || (panel && panel.currentRecordIndex) || args[5]) {
            if ($A(buttonsNode).length > 1)
                buttonsNode = $A(buttonsNode).reject(function(item) {
                    return item['@rec_index'] != selected;
                })[0];
        }
        else
            buttonsNode = objectToArray(buttonsNode)[0];
        this._getScreen(json, screen).contents['yglui_str_wid_content'] = buttonsNode;
        var changeButton;
        var action = args[4] ? args[4] : 'MOD';
        if (this.newRecord) {
            action = 'INS';
            if (json.EWS.o_screen_buttons) {
                objectToArray(json.EWS.o_screen_buttons.yglui_str_wid_button).each(function(button) {
                    if (button['@type'] == action)
                        changeButton = button;
                });
                buttonsNode['buttons'] = null;
            }

        }
        else {
            if (buttonsNode.buttons)
                objectToArray(buttonsNode.buttons.yglui_str_wid_button).each(function(button) {
                    if (button['@type'] == action)
                        changeButton = button;
                });
            buttonsNode['buttons'] = null;
            buttons = {
                BUTTON: json.EWS.o_changeButton
            };
            objectToArray(this._getScreen(json, screen).contents.yglui_str_wid_content).each(function(item) {
                item['buttons'] = null;
            });
        }
        buttons = {
            BUTTON: changeButton
        };
    }
    //Defining the variables that are gonna need to be recovered on the XML
    json.EWS['SERVICE'] = this.saveRequestService;
    var xmlIn = new XML.ObjTree();
    xmlIn.attr_prefix = '@';
    var screenPanel = this._elementsStorage.get(appId + '_' + screen) ? this._elementsStorage.get(appId + '_' + screen) : this._elementsStorage.get(appId + '_' + originalScreen);
    var reg = listMode && screenPanel.get("fromServicePai") !== true ? 
        { yglui_str_wid_record: this._getRecord(json, screen, selected) } : 
        { yglui_str_wid_record: this._getScreen(json, screen, selected) };
    fieldValues = xmlIn.writeXML(reg, true);
    buttons = xmlIn.writeXML(buttons, true);
    //Defining the XML in
    xmlIn = '<EWS>' +
            '<SERVICE>' + this.saveRequestService + '</SERVICE>' +
            '<OBJECT TYPE="' + this.objectType + '">' + this.empId + '</OBJECT>' +
            '<PARAM>' +
            '<APPID>' + appId + '</APPID>' +
            '<RECORDS>' + fieldValues + '</RECORDS>' +
            buttons +
            '</PARAM>' +
            '</EWS>';
    //If there is no erros on the XMl we proceed to make the AJAX call
    if (validForm.correctForm == true) {
        this.makeAJAXrequest($H({
            xml: xmlIn,
            successMethod: '_saveFormSuccess',
            ajaxID: appId + ' ' + widScreen + ' ' + action
        }));
    }
},
    /**
    * Gets a screen from a JSON based on a screen number
    * @param json The JSON to get the screen from
    * @param screen The screen to get
    */
    _getScreen: function(json, screen, selected) {
        var returnValue = null;
        var oArray = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
        if (json.EWS.o_field_values) {
            //if(oArray[selected]['@screen]'] == screen)
            //returnValue = oArray[selected];
            //Going throught all the recors to find the one matching with the screen number
            if (objectToArray(json.EWS.o_field_values.yglui_str_wid_record).length == 1) {
                if (json.EWS.o_field_values.yglui_str_wid_record['@screen'] == screen)
                    returnValue = json.EWS.o_field_values.yglui_str_wid_record;

            }
            else {
                objectToArray(json.EWS.o_field_values.yglui_str_wid_record).each(function(item) {
                    if (selected) {
                        if (item['@screen'] == screen && objectToArray(item.contents.yglui_str_wid_content)[0]['@rec_index'] == selected && objectToArray(item.contents.yglui_str_wid_content).length == 1)
                            returnValue = item;
                        else if (item['@screen'] == screen && objectToArray(item.contents.yglui_str_wid_content).length > 1) {
                            item.contents.yglui_str_wid_content = objectToArray(item.contents.yglui_str_wid_content).reject(function(subItem) {
                                return subItem['@rec_index'] != selected;
                            });
                            returnValue = item;
                        }
                    }
                    else if (item['@screen'] == screen)
                        returnValue = item;
                });
            }
        }
        if (selected)
            if (Object.jsonPathExists(returnValue, 'contents.yglui_str_wid_content'))
            returnValue.contents['yglui_str_wid_content'] = objectToArray(returnValue.contents.yglui_str_wid_content).reject(function(content) {
                return content['@rec_index'] != selected.toString();
            });
        return returnValue;
    },
    /**
    * Gets a certain node that matchs the rec_index
    * @param json The JSON to search in
    * @param recIndex The rec_index to match
    */
    _getRecord: function(json, screen, recIndex, notMakeNull) {
        var returnValue = null;
        if (json.EWS.o_field_values)
        //Going throught all the recors to find the one matching with the screen number
            objectToArray(json.EWS.o_field_values.yglui_str_wid_record).each(function(item) {
                if (Object.jsonPathExists(item, 'contents.yglui_str_wid_content'))
                    if (item['@screen'] == screen && item.contents.yglui_str_wid_content['@rec_index'] == recIndex) {
                    returnValue = item;
                    if (!notMakeNull)
                        item.contents.yglui_str_wid_content['buttons'] = null;
                }
            });
        return returnValue;
    },
    /**
    * This function will be called in case that the backend doesn't send back an error message
    * and the saving process succed.
    * @param json The JSON information of the reply
    * @param data AJAX id information
    */
    _saveFormSuccess: function(json, data) {
        //Update pending requests
        data = data.split(' ');
        var appId = data[0];
        var widgetScreen = data[1];
        var selectedIndex;
        if (this._elementsStorage.get(appId + '_' + widgetScreen).get('fieldPanel')) {
            this._elementsStorage.get(appId + '_' + widgetScreen).get('fieldPanel').destroy();
            selectedIndex = this._elementsStorage.get(appId + '_' + widgetScreen).get('fieldPanel').currentSelected;
        }
        var contentContainer = this._elementsStorage.get(appId + '_' + widgetScreen).get('contentContainer');
        contentContainer.update();
        if (data[2] == 'DEL') {
            this._elementsStorage.get(appId + '_' + widgetScreen).get('fieldPanel').destroy();
            this._getWidgetContent(appId);
        }
        else {
            this._getWidgetContent(appId, widgetScreen, selectedIndex);
        }
        document.fire('EWS:widgetInformationChanged_' + this.tabId, null);
        global.reloadApplication();
    },
    /**
    *@description Method which call the GetWidgets module
    */
    loadWidgets: function() {
        document.stopObserving('EWS:widgetInformationChanged_' + this.tabId);
        if ((this.widgetsStructure == null) && (this.firstRun)) {
            this.widgetsStructure = new GetWidgets({
                eventName: 'PDC:widgetsReady' + this.tabId,
                service: this.widgetsService,
                tabId: this.tabId,
                objectType: this.objectType,
                objectId: this.empId,
                target: this.virtualHtml.down('div#PDC_widgets_' + this.tabId)
            });
        }
        else if (!Object.isEmpty(this.virtualHtml) && !Object.isEmpty(this.widgetsStructure)) {
            this.widgetsStructure.reloadWidgets({
                objectType: this.objectType,
                objectId: this.empId
            });
            this.virtualHtml.down('div#PDC_widgets_' + this.tabId).show();
        }
    },
    /**
    *@description Method to fill the Pending Request Widget
    */
    fillGenericWidget: function(pair) {
        var vlabLoading = global.getLabel('loading');
        pair.value.setContent(vlabLoading + '...');
        //pair.value.setContent('Loading...');
        this._getWidgetContent(pair.key);
    },
    /**
    * @description Gets the widgets content
    * @param appId The widget ID
    * @param widScreen The widscreen
    * @param selectedIndex The selected index
    */
    _getWidgetContent: function(appId, widScreen, selectedIndex) {
        if (!widScreen)
            widScreen = '1';
        //Forming the XML in
        var xml = "<EWS>"
        + "<SERVICE>GET_CONTENT2</SERVICE>"
        + "<OBJECT TYPE='" + this.objectType + "'>" + this.empId + "</OBJECT>"
        + "<PARAM>"
        + "<APPID>" + appId + "</APPID>"
        + "<WID_SCREEN>*</WID_SCREEN>"
        + "</PARAM>"
        + "</EWS>";
        //Requesting the data
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: '_parseWidgetContent',
            ajaxID: widScreen + ' ' + appId + ' ' + (selectedIndex ? selectedIndex : '')
        }));
    },
    /**
    * @description Parses the widget content service
    * @param xml The XML out
    * @param appId The identificator of the AJAX call
    */
    _parseWidgetContent: function(JSON, data, fromPai) {
        var dataArgument = data;
        //Defining the variables
        data = data.split(' '); //Spliting the data
        var appId = data[1];         //Stores the AppId
        var widScreen = data[0];         //Stores the widget screen
        var selectedPanel = data[2];         //Currently selected panel
        var fromServicePai = data[3] === "true" || fromPai === true ? true : false;
        this._selectedScreens = $H();            //The selected screens
        var listMode = false;           //List mode indicator
        var panel = null;            //Stores the panel
        var widgetScreens = null;            //Widget screens
        if (!fromServicePai)
            this.newRecord = undefined;
        if (JSON.EWS.o_widget_screens)
            objectToArray(JSON.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen ?
                JSON.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen :
                JSON.EWS.o_widget_screens.yglui_str_wid_screen).each(function(item) {
                    var select;
                    if (this._elementsStorage.get(appId + '_' + widScreen))
                        select = this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel').currentSelected;
                    if (item.yglui_str_wid_screen)
                        item = item.yglui_str_wid_screen;
                    if ((item['@screen'] == widScreen) && (item['@list_mode'] == 'X')) listMode = true;
                    if (select) {
                        if (item['@screen'] == select)
                            item['@selected'] = 'X';
                        else
                            item['@selected'] = '';
                    }

                } .bind(this));
        //Deleting the previous generated panel in case that it was created
        if (this._elementsStorage.get(appId + '_' + widScreen))
            this._elementsStorage.unset(appId + '_' + widScreen);
        //Creating the structure to store the information of the new panel
        if (!this._elementsStorage.get(appId + '_' + widScreen)) {
            this._elementsStorage.set(appId + '_' + widScreen, $H({
                fieldPanel: null, 	        //Stores the fielPanel
                screenNavigation: null,         //Stores information about the screen navigation
                contentContainer: null,         //The prototype element that contains the panel
                json: null, 			//The JSON information
                records: new Array(),           //The screen records
                fromServicePai: fromServicePai
            }));
        }
        //Making a copy of the JSON so the modifications on it will not affect the copy on the cache
        this._elementsStorage.get(appId + '_' + widScreen).set('json', deepCopy(JSON));
        if (JSON.EWS.o_widget_screens)
            objectToArray(JSON.EWS.o_widget_screens.yglui_str_wid_screen).each(function(item) {
                if (item.yglui_str_wid_screen)
                    item = item.yglui_str_wid_screen;
                if ((item['@screen'] == widScreen) && (item['@list_mode'] == 'X')) listMode = true;
            });
        document.stopObserving('EWS:pdcChange_' + this.tabId + '_' + appId);
        var panelMode = fromServicePai ? 'edit' : 'display';
        //Creating the fieldsPanel
        try {
            document.stopObserving("EWS:pdChangeFieldChange_" + widScreen + '_' + appId + '_' + this.empId);
            panel = new getContentModule({
                appId: appId,
                mode: panelMode,
                json: this._elementsStorage.get(appId + '_' + widScreen).get('json'),
                //jsonCreateMode: this.createModeJson,
                showCancelButton: false,
                buttonsHandlers: $H({
                    DEFAULT_EVENT_THROW: 'EWS:pdcChange_' + this.tabId + '_' + appId,
                    paiEvent: function(args) {
                        document.fire('EWS:paiEvent_' + appId + '_' + widScreen, getArgs(args));
                    }
                }),
                cssClasses: $H({
                    tcontentSimpleTable: 'PDC_stepsWithTable',
                    fieldDispAlignBoxFields: 'fieldDispTotalWidth'
                }),
                showButtons: $H({
                    edit: false,
                    display: true,
                    create: false
                }),
                fieldDisplayerModified: "EWS:pdChangeFieldChange_" + widScreen + '_' + appId + '_' + this.empId
            });
        }
        catch (e) {
            alert(e);
        }
        //Creating the observers for the fieldPanel
        document.observe('EWS:pdcChange_' + this.tabId + '_' + appId, this._actionButtonPressed.bind(this, appId, widScreen, listMode));
        document.stopObserving('EWS:paiEvent_' + appId + '_' + widScreen);
        this.paiEventUpdateBind = this._paiEventUpdate.bind(this, appId, widScreen, listMode, panel);
        document.observe('EWS:paiEvent_' + appId + '_' + widScreen, this.paiEventUpdateBind);
        //Creating the widget screens
        //Going througt all the record and storing them on an array
        if (JSON.EWS.o_field_values) {
            var reg = JSON.EWS.o_field_values.yglui_str_wid_record;
            reg = objectToArray(reg);
            $A(reg).each(function(item) {
                $A(item.contents.yglui_str_wid_content).each(function(record) {
                    this._elementsStorage.get(appId + '_' + widScreen).get('records').push(record);
                } .bind(this));
            } .bind(this));
        }
        var widgetContentContainer = new Element('div', {
            'class': 'PDC_contentContainer'
        });
        this.hashOfWidgets.get(appId).setContent('');
        if (widgetScreens)
            this.hashOfWidgets.get(appId).getContentElement().insert(widgetScreens);
        var loadingContainer = new Element('div', {
            'id': 'loadingContainer'
        });
        this.hashOfWidgets.get(appId).getContentElement().insert(loadingContainer);
        this.hashOfWidgets.get(appId).getContentElement().insert(panel.getHtml());
        this._elementsStorage.get(appId + '_' + widScreen).set('contentContainer', this.hashOfWidgets.get(appId).getContentElement());
        //Storing the panel for this widget
        this._elementsStorage.get(appId + '_' + widScreen).set('fieldPanel', panel);
        this._elementsStorage.get(appId + '_' + widScreen).set('arguments', dataArgument);
        this._elementsStorage.get(appId + '_' + widScreen).set('loadingContainer', loadingContainer);
        this._elementsStorage.get(appId + '_' + widScreen).set('fromServicePai', fromServicePai)
    panel.setFocus();
    },
    /**
    * This function is called every time the service PAI event is fired by getContentModule
    */
    _paiEventUpdate: function() {
        //Declarations
        var args = $A(arguments);
        var data = args[4].memo;
        var panel = this._elementsStorage.get(args[0] + '_' + args[1]).get('fieldPanel');
        var json = null;
        var jsonToSend = null;
        var xml = new XML.ObjTree();
        json = panel.json;
        var reg = {
            yglui_str_wid_record: this._getScreen(json, panel.currentSelected, panel.currentRecordIndex)
        };
        var settings = null;
        if (objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record).length == 1)
            settings = {
                yglui_str_wid_fs_record: json.EWS.o_field_settings.yglui_str_wid_fs_record
            };
        else
            settings = {
                yglui_str_wid_fs_record: $A(json.EWS.o_field_settings.yglui_str_wid_fs_record).reject(function(item) {
                    return item["@screen"] != panel.currentSelected;
                })
            };
        var screenMode = json.EWS.o_widget_screens['@screenmode'];
        delete json.EWS.o_widget_screens['@screenmode'];
        jsonToSend = {
            EWS: {
                SERVICE: data.servicePai,
                OBJECT: {
                    TYPE: this.objectType,
                    TEXT: this.empId
                },
                PARAM: {
                    APPID: args[0],
                    o_field_settings: settings,
                    o_field_values: reg,
                    o_screen_buttons: json.EWS.o_screen_buttons,
                    o_widget_screens: {
                        '@screenmode': screenMode,
                        yglui_str_wid_screen: json.EWS.o_widget_screens
                    }
                }
            }
        };
        document.stopObserving('EWS:paiEvent_' + args[0] + '_' + args[1]);
        //Converting the JSON to XML
        xml.attr_prefix = '@';
        xml = xml.writeXML(jsonToSend, true);
        if (!this._elementsStorage.get(args[0] + '_' + args[1]).get('fromServicePai'))
            this._elementsStorage.get(args[0] + '_' + args[1]).get('loadingContainer').insert('<span class="loading_caption" style="float: left">Loading...</span>');
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: '_updatePaiEventSuccess',
            errorMethod: '_updatePaiEventFailure',
            ajaxID: args[0] + ' ' + args[1] + ' ' + (panel.currentSelected ? '1' : '0') + ' ' + data.record
        }));
    },
    /**
    * This function is called if the Pai event call was a successMethod
    * @param json The returned JSON
    * @param data The AJAX CALL id information
    * @param getPrevious Indicates if it have to take the information of the previous call
    */
    _updatePaiEventSuccess: function(json, data, getPrevious) {
        data = data.split(' ');
        if (json.EWS.o_widget_screens)
            objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen ?
                json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen :
                json.EWS.o_widget_screens.yglui_str_wid_screen).each(function(item) {
                    item['@list_mode'] = "";
                } .bind(this));
        if (this._elementsStorage.get(data[0] + '_' + data[1]).get('loadingContainer'))
            this._elementsStorage.get(data[0] + '_' + data[1]).get('loadingContainer').update('');
        var fromPai = this._elementsStorage.get(data[0] + '_' + data[1]).get('fromServicePai') || getPrevious != undefined;
        this._elementsStorage.get(data[0] + '_' + data[1]).set('fromServicePai', true);
        this.hashOfWidgets.get(data[0]).setContent('');
        var args = getPrevious === true ? this._elementsStorage.get(data[0] + '_' + data[1]).get('arguments') : data[1] + ' ' + data[0] + ' ' + data[2] + (fromPai ? ' true' : ' false');
        this._parseWidgetContent(json, args, true);
        this._actionButtonPressed(data[0], data[1], (data[2] == '1' ? true : false), {
            type: fromPai ? 'PAI' : 'MOD',
            record: data[3],
            noToggle: true
        });
    },
    /**
    * Failure method for PAI event calls
    * @param json The JSON out
    * @param data The attached data to the event
    */
    _updatePaiEventFailure: function(json, data) {
        var param = data.split(' ');
        this._failureMethod(json);
        fromServicePai = this._elementsStorage.get(param[0] + '_' + param[1]).get('fieldPanel');
        // if json returned doesn't have the full info, construct the old value, else continue
        if(!json || !json.EWS.o_field_settings || !json.EWS.o_field_values)
            json = this._elementsStorage.get(param[0] + '_' + param[1]).get('fieldPanel').json;
        this._updatePaiEventSuccess(json, data, true);
    },
    /**
    * This function is called every time we click on an action button. For example
    * clickin on add or change or delete.
    */
    _actionButtonPressed: function() {
        //Variables declarations
        var args = $A(arguments);
        var appId = args[0];
        var data = getArgs(args[3]);
        var listMode = args[2];
        var widScreen = args[1];
        var panel = this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel');
        switch (data.type) {
            //Modify a record          
            case 'COP':
            case 'MOD':
                panel.cssClasses = $H({
                    tcontentSimpleTable: 'PDC_stepsWithTable',
                    fieldDispAlignBoxFields: 'fieldDispTotalWidth'
                });
                if (data.noToggle !== true)
                    panel.toggleMode('edit', panel.appId, data.screen, data.recKey);
                this._createFormControlButtons(panel, this.hashOfWidgets.get(appId).getContentElement(), appId, widScreen, false, listMode);
                break;
            //Delete a recor          
            case 'DEL':
                var subPanel;
                subPanel = panel;
                var callback = this._saveForm.bind(this, appId, widScreen, false, !Object.isEmpty(subPanel), 'DEL', data.recKey);
                this._deleteRecord(callback);
                break;
            //Insert a new record          
            case 'INS':
                this._newRecordCreation(appId, widScreen, args[4], listMode);
                break;
            case 'PAI':
                if (data.noToggle !== true)
                    var subPanel = panel.toggleMode('edit', appId, 1, data.record);
                if (subPanel)
                    this.hashOfWidgets.get(appId).getContentElement().update(subPanel.getElement().remove());
                this._createFormControlButtons(panel, this.hashOfWidgets.get(appId).getContentElement(), appId, widScreen, false, listMode);
                break;
        }
    },
    callToOpenPCR: function(pcrId) {
        //to check if we have step0 or not, we have to call GET_WIZARDS
        var xml = "<EWS>"
        + "<SERVICE>GET_WIZARDS</SERVICE>"
        + "<OBJECT TYPE='" + this.objectType + "'>" + this.empId + "</OBJECT>"
        + "<PARAM>"
        + "<MENU_TYPE>A</MENU_TYPE>"
        + "<CONTAINER>PCR_OVER</CONTAINER>"
        + "<A_SCREEN>*</A_SCREEN>"
        + "</PARAM>"
        + "</EWS>";
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this.openPCR.bind(this, pcrId)
        }));
    },
    openPCR: function(pcrId, json) {
        //from all PCRs, we take the one needed (pcrId)
        var actions = objectToArray(json.EWS.o_wzid_step0.yglui_str_wiz_step0);
        for (var i = 0; i < actions.length; i++) {
            if (actions[i]['@wzid'] == pcrId)
                document.fire("EWS:openApplication", $H({
                    app: "PCR_Steps",
                    wizardId: pcrId,
                    empId: this.empId,
                    step0: actions[i]['@step0']
                }));
        }
    },
    /**
    * This function is called when we click on Add a new record
    * @param appId The appId
    * @param widScreen The widget screen
    * @buttons Button information
    */
    _newRecordCreation: function(appId, widScreen, buttons) {
        //This flag will indicate if we are creating a new record
        this.newRecord = true;
        var strXml = '<EWS><SERVICE>GET_CONTENT2</SERVICE><OBJECT TYPE="' + this.objectType + '">' + this.empId + '</OBJECT><PARAM><APPID>' + appId + '</APPID><WID_SCREEN>' + this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel').currentSelected + '</WID_SCREEN><OKCODE>NEW</OKCODE></PARAM></EWS>';
        this.makeAJAXrequest($H({
            xml: strXml,
            successMethod: '_newRecordStartTemplate',
            ajaxID: appId + ' ' + widScreen
        }));
    },
    /**
    * If the call for creating a new record was a success we procees to create the new panel
    * @json The returned JSON
    * @data The AJAX CALL id
    */
    _newRecordStartTemplate: function(json, data) {
        data = data.split(' ');
        var appId = data[0];
        var widScreen = data[1];
        var panel = null;
        var content = null;
        var select = null;
        if (this._elementsStorage.get(appId + '_' + widScreen))
            select = this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel').currentSelected;
        if (json.EWS.o_widget_screens)
            objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen ?
                json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen :
                json.EWS.o_widget_screens.yglui_str_wid_screen).each(function(item) {

                    if (select) {
                        if (item['@screen'] == select)
                            item['@selected'] = 'X';
                        else
                            item['@selected'] = '';
                    }

                } .bind(this));
        this._elementsStorage.get(appId + '_' + widScreen).unset('json');
        this._elementsStorage.get(appId + '_' + widScreen).set('json', deepCopy(json));
        var jsonElement = this._elementsStorage.get(appId + '_' + widScreen).get('json');
        if (jsonElement.EWS.o_field_values)
            if (jsonElement.EWS.o_field_values.yglui_str_wid_record) {
            objectToArray(objectToArray(jsonElement.EWS.o_field_values.yglui_str_wid_record)[0].contents.yglui_str_wid_content)[0]['@selected'] = 'X';
            objectToArray(objectToArray(jsonElement.EWS.o_field_values.yglui_str_wid_record)[0].contents.yglui_str_wid_content)[0]['buttons'] = null;
        }
        json = this._elementsStorage.get(appId + '_' + widScreen).get('json');
        if (Object.jsonPathExists(json, 'EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen')) {
            objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen).each(function(item) {
                item['@list_mode'] = "";
            });
        }
        try {
            panel = new getContentModule({
                appId: appId,
                mode: 'create',
                json: this._elementsStorage.get(appId + '_' + widScreen).get('json'),
                showCancelButton: false,
                buttonsHandlers: $H({
                    DEFAULT_EVENT_THROW: 'EWS:pdcChange_' + this.tabId + '_' + appId,
                    paiEvent: function(args) {
                        document.fire('EWS:paiEvent_' + appId + '_' + widScreen, getArgs(args));
                    }
                }),
                cssClasses: $H({
                    tcontentSimpleTable: 'PDC_stepsWithTable',
                    fieldPanelSimpleTableDiv: 'simpleTable_table',
                    fieldDispAlignBoxFields: 'fieldDispTotalWidth'
                }),
                showButtons: $H({
                    edit: false,
                    display: true,
                    create: false
                })
            });
        }
        catch (err) {
            alert(err);
        }
        content = this._elementsStorage.get(appId + '_' + widScreen).get('contentContainer');
        if (this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel')) {
            this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel').destroy();
            this._elementsStorage.get(appId + '_' + widScreen).unset('fieldPanel');
        }
        this._elementsStorage.get(appId + '_' + widScreen).set('fieldPanel', panel);
        content.update();
        content.insert(panel.getHtml());
        this._createFormControlButtons(panel, content, appId, widScreen, true);
    },
    /**
    * This function is called to delete a record. It takes care of showing the popup
    * and calling the appropiated callbacks
    * @callback {function} Callback function
    */
    _deleteRecord: function(callback) {
        var contentHTML = new Element('div').insert(global.getLabel('areYouSureRecord'));
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBackfunct = function() {
            question.close();
            delete question;
            callback();
        };
        var callBack3 = function() {
            question.close();
            delete question;
        };
        var aux2 = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBackfunct,
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
        var question = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    question.close();
                    delete question;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        question.create();
    },
    /**
    * Makes the AJAX call to indicate the backend we want to delete a record
    * @param appId The application ID
    * @param widScreen The widget screen
    * @param record the record
    */
    _requestSapRecordDeletion: function(appId, widScreen, record) {
        var json = this._elementsStorage.get(appId + '_' + widScreen).get('json');
        var recordData = this._elementsStorage.get(appId + '_' + widScreen).get('records')[parseInt(record, 10) - 1];
        var fieldValues = json.EWS.o_field_values;
        var xmlIn = new XML.ObjTree();
        var buttonNode = null;
        var delButton = $A(recordData.buttons.yglui_str_wid_button).select(function(item) {
            if (item['@type'] == 'DEL')
                return true;
            else
                return false;
        });
        recordData.buttons.yglui_str_wid_button = delButton;
        xmlIn.attr_prefix = '@';
        buttonNode = xmlIn.writeXML({
            button: delButton[0]
        }, true);
        fieldValues = xmlIn.writeXML(fieldValues, true);
        //Defining the XML in
        var xmlIn = '<EWS>' +
        '<SERVICE>' + this.saveRequestService + '</SERVICE>' +
        '<OBJECT TYPE="' + this.objectType + '">' + this.empId + '</OBJECT>' +
        '<PARAM>' +
        '<APPID>' + appId + '</APPID>' +
        '<RECORDS>' +
        fieldValues +
        '</RECORDS>' +
        '</PARAM>' +
        '<DEL></DEL>' +
        '</EWS>';
        //Making the AJAX request
        this.makeAJAXrequest($H({
            xml: xmlIn,
            successMethod: '_saveFormSuccess',
            ajaxID: appId + '_' + widScreen
        }));
    },
    /**
    * Creates the form buttons like Save and Cancel and set the appropiated callbacks for them
    * @param panel Panel to make the insertion
    * @param container The panel container
    * @param appId The application id
    * @param screen The widget screen
    * @param newRecord Indicates whether this is a new record or not
    * @param listMode Indicates whether this is in list mode or not
    */
    _createFormControlButtons: function(panel, container, appId, screen, newRecord, listMode) {
        if (newRecord == undefined)
            newRecord = false;
        var mainButtonsJson = {
            elements: [],
            mainClass: 'PDC_buttonsContainer'
        };
        var saveHandler = null;
        if (newRecord) {
            saveHandler = this._saveForm.bind(this, appId, screen, true, listMode, panel);
        }
        else {
            saveHandler = this._saveForm.bind(this, appId, screen, undefined, listMode);
        }
        var aux = {
            idButton: 'save',
            label: global.getLabel('save'),
            handlerContext: null,
            handler: saveHandler,
            className: 'PMF_showDocsButton',
            type: 'button',
            standardButton: true
        };
        var aux2 = {
            idButton: 'cancel',
            label: global.getLabel('cancel'),
            handlerContext: null,
            handler: this._getWidgetContent.bind(this, appId, screen, panel ? panel.currentSelected : undefined),
            className: 'PMF_showDocsButton',
            type: 'button',
            standardButton: true
        };
        mainButtonsJson.elements.push(aux2);
        mainButtonsJson.elements.push(aux);
        var ButtonsPDC = new megaButtonDisplayer(mainButtonsJson);
        document.stopObserving('EWS:validFormHandler_' + appId + '_' + screen);
        document.observe('EWS:validFormHandler_' + appId + '_' + screen, function(args) {
            if (args.memo === '0')
                ButtonsPDC.disable('save');
            else if (args.memo === '1')
                ButtonsPDC.enable('save');
        });
        var errorCaption = new Element('div', {
            id: 'errorTextCaption',
            'class': 'application_main_error_text '
        }).hide();
        this._elementsStorage.get(appId + '_' + screen).set('errorCaption', errorCaption);
        if (container) {
            container.insert(errorCaption);
            container.insert('<div style="clear:both;"></div>');
            container.insert(ButtonsPDC.getButtons());
        }
        else if (panel)
            if (!Object.isEmpty(panel.currentSelected)) {
            var parentContainer = panel.getFieldPanels().get(panel.currentSelected).virtualHtml;
            parentContainer.insert(errorCaption);
            parentContainer.insert('<div style="clear:both;"></div>');
            parentContainer.insert(ButtonsPDC.getButtons());
        }
    },
    /**
    * @description Refresh the widget screen
    */
    _refreshWidgetScreens: function() {
        var args = $A(arguments);
        var screens = args[0];
        var i = args[1];
        var appId = args[2];
        $A(screens.yglui_str_wid_screen).each(function(pair, iteration) {
            if (pair['@element'] != null) {
                if (iteration == i) {
                    this._selectedScreens.set(appId + pair['@screen'], iteration);
                    if (pair['@element'].down() != null) {
                        this._getWidgetContent(pair['@appid'], pair['@screen']);
                    }
                }
            }
        } .bind(this));


    },
    /**
    *@param $super The superclass: Application
    *@description Closes the application
    */
    close: function($super) {
        $super();
        document.stopObserving('PDC:widgetsReady' + this.tabId, this.widgetsReadyBinding);
    }
});


var MultipleRecordsFieldsPanel = Class.create(SimpleTable,{
    // Private variables
    _json:              null,
    _appId:             null,
    _event:             null,
    _element:           null,
    _parentClass:       null,
    _fieldsPanels:      null,
    _selectedPanel:     null,
    // Public variables
    currentlySelected:  0,
    initialize: function($super,options,parentClass,selectedPanel,widScreen) {
        this._selectedPanel = selectedPanel;
        this._json = options.json;
        this._appId = options.appId;
        this._fieldsPanels = new Hash();
        this._widScreen = widScreen;
        //$super();
        this._parentClass = parentClass;
        if(this._json.EWS.o_field_values)
            $super(this.createContent(),{
                typeLink: true
            });
        else
            this._element = '<div style="clear:both;"></div><span>'+options.noResultsHtml+'</span>';
    },

    createContent: function() {
        var tableData = {
            header: [],
            rows: $H()
        };
        var tmpHeader = [];
        var headerIds = new Hash();
        //Getting the header
        this.setLabels();
        $A(this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field).each(function(item) {
            if(item['@fieldtype'] == 'H') {
                tmpHeader.push({
                    text: item['@fieldlabel'] == null ? this.labels.get(item['@fieldid']) : item['@fieldlabel'],
                    id:item['@fieldid'],
                    seqnr: item['@seqnr']
                });
                headerIds.set(item['@fieldid'],item['@seqnr']);
            }
        }.bind(this));
        //Sorting the header by seqnr
        this._sortArray(tmpHeader);
        tableData.header = tmpHeader;
        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record,i) {
            var tmpData = [];
            if(this._selectedPanel === i)
                record.contents.yglui_str_wid_content['@selected'] = 'X';
            else
                record.contents.yglui_str_wid_content['@selected'] = '';
            var tmpJson = deepCopy(this._json);
            tmpJson.EWS.o_field_values.yglui_str_wid_record = objectToArray(tmpJson.EWS.o_field_values.yglui_str_wid_record)[i];
            this._sortArray(tmpData);
            var panel = new getContentModule({
                appId: this._appId,
                mode: 'display',
                json: tmpJson,
                //jsonCreateMode: this.createModeJson,
                buttonsHandlers: $H({
                    DEFAULT_EVENT_THROW: 'EWS:pdcChange_' + this.tabId + '_' + appId
                })
            });
            objectToArray(record.contents.yglui_str_wid_content).last().fields.yglui_str_wid_field.each(function(content,j) {
                if(headerIds.get(content['@fieldid']) != undefined){
                    var auxText = (!Object.isEmpty(content['#text'])) ? content['#text'] : content['@value'];
                    if(!Object.isEmpty(panel.getFieldInfo(content['@fieldid'])) && (panel.getFieldInfo(content['@fieldid'])['@type'] == 'DATS')){
                        auxText = (! Object.isEmpty(auxText)) ? sapToDisplayFormat(auxText) : '';
                    }
                    tmpData.push({
                        text: auxText != null ? auxText : '',
                        id:'',
                        seqnr: headerIds.get(content['@fieldid'])
                    });
                }
            }.bind(this));
            this._sortArray(tmpData);
            if(!Object.isEmpty(tmpData[0]) && (tmpData[0].text == ''))
                tmpData[0].text = global.getLabel('viewDetails');
            tableData.rows.set('row'+i,{
                data:tmpData,
                element: panel.getElement()
            });
            var index = objectToArray(record.contents.yglui_str_wid_content).last()['@rec_index'];
            this._fieldsPanels.set(index,panel);
            if(!this.currentSelected)
                this.currentSelected = index;
        }.bind(this));
        return tableData;
    },
    setLabels: function() {
        this.labels = new Hash();
        if(!Object.isEmpty(this._json) && !Object.isEmpty(this._json.EWS.labels)&& !Object.isEmpty(this._json.EWS.labels.item)){
            objectToArray(this._json.EWS.labels.item).each(function(label){
                if(!Object.isEmpty(label['@id']))
                    this.labels.set(label['@id'],label['@value']);
            }.bind(this));
        }
    },
    changeToEditMode: function(panel) {
        this._fieldsPanels.get(panel).changeToEditMode();
        this.currentSelected = panel;
        return this._fieldsPanels.get(panel);
    },
    getCurrentPanel: function(panel) {
        this.currentSelected = panel;
        return this._fieldsPanels.get(panel);
    },
    getFieldPanels: function() {
        return this._fieldsPanels;
    },
    _sortArray: function(array){
        var k;
        for(var i = 0; i < array.length; i++) {
            k = i;
            for(var j = i+1; j < array.length; j++) {
                if(parseInt(array[j].seqnr,10) < parseInt(array[k].seqnr,10)) {
                    var tmp = array[k];
                    array[k] = array[j];
                    array[j] = tmp;
                    k = j-1;
                }

            }
        }
        return array;
    },
    getHtml: function() {
        return this.getElement();
    },
    _toggleContentElement: function() {
        var args = $A(arguments);
        args[0].toggle();
        if(args[1].hasClassName('application_verticalR_arrow')) {
            args[1].removeClassName('application_verticalR_arrow');
            args[1].addClassName('application_down_arrow');
        }
        else {
            args[1].removeClassName('application_down_arrow');
            args[1].addClassName('application_verticalR_arrow');
        }
    },
    destroy:function() {
        
    }
    
    
});
