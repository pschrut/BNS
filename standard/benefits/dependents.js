var Dependents = Class.create(PDChange,
/**
* @lends PersonalDetails
*/
{
/**
* @description Initializes the application
* @param $super The parent initialize method reference
*/
effectiveDate: '',

initialize: function($super, args) {
    //Calling the parent method
    $super(args);
    this.fillGenericWidgetBind = this.fillGenericWidget.bind(this);
    document.observe("EWS:benefits_1_dependentsFillWidget", this.fillGenericWidgetBind);

    this.getWidgetContentBind = this.getWidgetContent.bind(this);
    document.observe("EWS:benefits_1_dependentsGetWidgetContent", this.getWidgetContentBind);

    this.hashOfWidgets = null;

    this.empId = global.objectId;
},
/**
* @description This method is called when the application is needed to be shown on the screenm
* @param $super Parent method reference
*/
run: function($super) {
    //Calling the parent method
    $super("BEN_DEP");
},
/**
* @description This method is called when the application needs to be closed
*/
close: function($super) {
    //Calling the parent method
    $super();
},

setEffectiveDate: function(date, depDate) {

    this.effectiveDate = date;
    this.dependentDate = depDate;
},

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
        if (pair[0] == appIdPendReq)
            new PendingRequestContent(this.virtualHtml, this.hashOfWidgets, this.empId, pair[0], this.tabId, this.firstRun);
        else
            if (appIdPendReq == 'KPI')
            new frame_standard(this.virtualHtml, this.hashOfWidgets, pair[0], this.firstRun)
        else {
            pair.value.setContent('Loading...');
            document.fire("EWS:benefits_1_dependentsGetWidgetContent", $H({ 'appId': pair.key, 'hashOfWidgets': this.hashOfWidgets }));
            //            this.getWidgetContentBind(pair.key);
        }
    } .bind(this));
    this.firstRun = false;
},

fillGenericWidget: function(pair) {
    pair.value.setContent('Loading...');
    this.getWidgetContentBind(pair.key);
},
/**
* @description Gets the widgets content
* @param appId The widget ID
*/
//getWidgetContent: function(appId, widScreen, selectedIndex) {
getWidgetContent: function(args) {
    var args = getArgs(args);
    var appId = args.get("appId");
    var hashOfWidgets = args.get("hashOfWidgets");

    var widScreen = '1';
    var selectedIndex = '';

    this.hashOfWidgets = hashOfWidgets;
    //Forming the XML in
    var xml = "<EWS>"
        + "<SERVICE>GET_CONTENT</SERVICE>"
        + "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>"
        + "<PARAM>"
        + "<APPID>" + appId + "</APPID>"
        + "<PERIOD_BEGDA>" + this.dependentDate + "</PERIOD_BEGDA>"
    //        + "<PERIOD_ENDDA>" + this.effectiveDate + "</PERIOD_ENDDA>"
        + "<WID_SCREEN>" + widScreen + "</WID_SCREEN>"
        + "</PARAM>"
        + "</EWS>";
    //Requesting the data
    this.makeAJAXrequest($H({
        xml: xml,
        successMethod: '_parseWidgetContent',
        ajaxID: widScreen + ' ' + appId + ' ' + (selectedIndex ? selectedIndex : '')
    }));
},

_getWidgetContent: function(appId, widScreen, selectedIndex) {
    //            log.info('Getting content for appId: '+appId+' and widScreen: '+widScreen);
    this.newRecord = undefined;
    if (!widScreen)
        widScreen = '1';
    //Forming the XML in
    var xml = "<EWS>"
        + "<SERVICE>GET_CONTENT</SERVICE>"
        + "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>"
        + "<PARAM>"
        + "<APPID>" + appId + "</APPID>"
        + "<PERIOD_BEGDA>" + this.dependentDate + "</PERIOD_BEGDA>"
    //        + "<PERIOD_ENDDA>" + this.effectiveDate + "</PERIOD_ENDDA>"
        + "<WID_SCREEN>" + widScreen + "</WID_SCREEN>"
        + "</PARAM>"
        + "</EWS>";
    //Requesting the data
    this.makeAJAXrequest($H({
        xml: xml,
        successMethod: '_parseWidgetContent',
        ajaxID: widScreen + ' ' + appId + ' ' + (selectedIndex ? selectedIndex : '')
    }));
},

_newRecordCreation: function(appId, widScreen, buttons) {
    //This flag will indicate if we are creating a new record
    this.newRecord = true;
    var strXml = '<EWS><SERVICE>GET_CONTENT2</SERVICE><OBJECT TYPE="P">' + this.empId + '</OBJECT><PARAM><APPID>' + appId + '</APPID><PERIOD_BEGDA>' + this.dependentDate + '</PERIOD_BEGDA><WID_SCREEN>' + widScreen + '</WID_SCREEN><OKCODE>NEW</OKCODE></PARAM></EWS>';
    this._addButtons.set(appId + '_' + widScreen, buttons);
    this.makeAJAXrequest($H({
        xml: strXml,
        successMethod: '_newRecordStartTemplatePreStep',
        ajaxID: appId + ' ' + widScreen
    }));
},


_newRecordStartTemplatePreStep: function(json, data) {
    if (json.EWS.o_field_settings) {
        objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record).each(function(record) {
            objectToArray(record.fs_fields.yglui_str_wid_fs_field).each(function(field) {
                if (field['@fieldid'] == 'BEGDA') {
                    field['@default_value'] = this.dependentDate;
                }
            } .bind(this));
        } .bind(this));
    }
    this._newRecordStartTemplate(json, data);
},

/**
* @description Creates the widgets screens
* @param json The JSON
*/
_generateWidgetScreens: function(json, appId, widScreen) {

    //alert('_generateWidgetScreens');
    var tmpLabelsHash = new Hash();
    if (json.EWS.labels)
        objectToArray(json.EWS.labels.item).each(function(item) {
            tmpLabelsHash.set(item['@id'], item['@value']);
        });
    var navigationContainer = new Element('div', { id: "depNavContainer" });
    //Getting the widget screens
    var screens = json.EWS.o_widget_screens;

    if (!Object.isEmpty(screens)) {
        //Iterating over the screens array
        $A(screens.yglui_str_wid_screen).each(function(pair, i) {
            var element = new Element('div', {
                'class': 'applicationmyData_navigationMenuItem'
            });
            element.insert('<span class="application_action_link">' + (tmpLabelsHash.get(pair['@label_tag']) != undefined ? tmpLabelsHash.get(pair['@label_tag']) : pair['@label_tag']) + '</span>');
            pair['@element'] = element;
            element.observe('click', this._refreshWidgetScreens.bind(this, screens, i, appId));
            navigationContainer.insert(element);
            if (pair['@selected'] == 'X' && !this._selectedScreens.get(appId + widScreen, i)) {
                element.down().removeClassName('application_action_link');
                element.down().addClassName('application_text_bolder');
            } else if (pair['@selected'] == 'X' && this._selectedScreens.get(appId + widScreen, i) && (i == this._selectedScreens.get(appId + widScreen, i))) {
                element.down().removeClassName('application_action_link');
                element.down().addClassName('application_text_bolder');
            }

        } .bind(this));
        this._elementsStorage.get(appId + '_' + widScreen).set('screenNavigation', navigationContainer);
        return navigationContainer;
    }
    else
        return null;
},

_parseWidgetContent: function(JSON, data) {
    if (JSON.EWS.o_field_values) {
        objectToArray(JSON.EWS.o_field_values.yglui_str_wid_record).each(function(record) {
            if (record.contents.yglui_str_wid_content.fields) {
                objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                    if (field['@fieldid'] == 'BEGDA') {
                        field['@value'] = this.dependentDate;
                    }
                    if (field['@fieldid'] == 'ENDDA') {
                        field['@value'] = '9999-12-31';
                    }
                } .bind(this));
            }
        } .bind(this));
    }

    data = data.split(' ');
    if (Object.isEmpty(data))
        data = "BEN_DEP";
    var appId = data[1];
    var widScreen = data[0];
    var selectedPanel = data[2];
    this._selectedScreens = $H();
    if (this._elementsStorage.get(appId + '_' + widScreen))
        this._elementsStorage.unset(appId + '_' + widScreen);
    if (!this._elementsStorage.get(appId + '_' + widScreen)) {
        this._elementsStorage.set(appId + '_' + widScreen, $H({
            fieldPanel: null,
            screenNavigation: null,
            contentContainer: null,
            json: null,
            records: new Array()
        }));
    }
    this._elementsStorage.get(appId + '_' + widScreen).set('json', deepCopy(JSON));
    var listMode = false;
    if (JSON.EWS.o_widget_screens)
        objectToArray(JSON.EWS.o_widget_screens.yglui_str_wid_screen).each(function(item) {
            if ((item['@screen'] == widScreen) && (item['@list_mode'] == 'X')) listMode = true;
        });
    document.stopObserving('EWS:ParamChange_' + this.tabId + '_' + appId);
    //Creating the fieldsPanel

    var panel = new getContentModule({
        appId: appId,
        mode: 'display',
        json: this._elementsStorage.get(appId + '_' + widScreen).get('json'),
        showCancelButton: false,
        buttonsHandlers: $H({
            DEFAULT_EVENT_THROW: 'EWS:ParamChange_' + this.tabId + '_' + appId
        }),
        showButtons: $H({
            edit: true,
            display: true,
            create: true
        })
    });

    //Creating the observers for the fieldPanel
    document.observe('EWS:ParamChange_' + this.tabId + '_' + appId, this._actionButtonPressed.bind(this, appId, widScreen, listMode));
    //Creating the widget screens
    var widgetScreens;

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
    if (!this._elementsStorage.get(appId + '_' + widScreen).get('screenNavigation'))
        widgetScreens = this._generateWidgetScreens(JSON, appId, widScreen);
    else
        widgetScreens = this._elementsStorage.get(appId + '_' + widScreen).get('screenNavigation');
    //Setting the generated content on the widget
    var widgetContentContainer = new Element('div', {
        'class': 'PDC_contentContainer'
    });

    this.hashOfWidgets.get(appId).setContent('');
    if (widgetScreens)
        this.hashOfWidgets.get(appId).getContentElement().insert(widgetScreens);
    panel.getHtml().childNodes[0].childNodes[0].remove();
    this.hashOfWidgets.get(appId).getContentElement().insert(panel.getHtml());
    this._elementsStorage.get(appId + '_' + widScreen).set('contentContainer', this.hashOfWidgets.get(appId).getContentElement());
    //Storing the panel for this widget
    this._elementsStorage.get(appId + '_' + widScreen).set('fieldPanel', panel);
},

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
    panel.getHtml().childNodes[0].childNodes[0].remove();
    content.insert(panel.getHtml());
    this._createFormControlButtons(panel, content, appId, widScreen, true);
},

_actionButtonPressed: function($super) {
    var args = $A(arguments);
    var data = getArgs(args[4]);
    if (data.okcode == "MOD") {
        $("depNavContainer").style.display = "none";
    }
    $super(arguments[1], arguments[2], arguments[3], arguments[4]);
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
    var clearLAND1 = true;
    var myNode = null;

    objectToArray(json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(fied) {

        if ((fied['@fieldid'] == "LOCAT") || (fied['@fieldid'] == "ORT01") || (fied['@fieldid'] == "PSTLZ") || (fied['@fieldid'] == "STATE") || (fied['@fieldid'] == "STRAS")) {
            if ((fied['@value'] != null) && (fied['@value'] != "")) {
                clearLAND1 = false;
            }
        }
        if ((fied['@fieldid'] == "LAND1")) {
            myNode = fied;
        }
    });
    if ((clearLAND1) && (myNode!=null)) {
        myNode['@value'] = null;
        myNode['#text'] = null;
    }

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
        { yglui_str_wid_record: this._getRecord(json, screen, selected)} :
        { yglui_str_wid_record: this._getScreen(json, screen, selected) };
    fieldValues = xmlIn.writeXML(reg, true);
    buttons = xmlIn.writeXML(buttons, true);
    //Defining the XML in
    xmlIn = '<EWS>' +
            '<SERVICE>' + this.saveRequestService + '</SERVICE>' +
            '<OBJECT TYPE="' + global.objectType + '">' + this.empId + '</OBJECT>' +
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
}

});