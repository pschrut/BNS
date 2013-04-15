/** 
* @fileOverview Parameters.js 
* @description File containing class PARAM. This application is responsible of 
* showing Parameters choices.
*/

/**
*@constructor
*@description Class PARAM. Shows Onboarding PARAM.
*@augments Application 
*/
var PARAMEOB = Class.create(Application,
{
    /*Service*/
    ping: '',
    pingMessage: '',
    widgetsService: 'GET_WIDGETS',
    paramService: 'GET_PARAMS',
    getPingService: 'EOB_PING_DEV',
    widgetsStructure: null,
    firstRun: null,
    _elementsStorage: null,
    /**
    * Property to call the service providing the trainings
    * @type XmlDoc
    */
    xmlGetWidget: XmlDoc.create(),

    /**
    *@param $super The superclass (Application)
    *@description Instantiates the app
    */
    initialize: function($super, options) {
        $super(options);
        this.tabId = this.options.tabId;
        this._elementsStorage = new Hash();

        this.countrySelectedBinding = this.countrySelected.bindAsEventListener(this);
        //this.employeeColorChangedHandlerBinding = this.employeeColorChangedHandler.bindAsEventListener(this);

    },


    /**
    *@param $super The superclass: Application
    *@param args Arguments coming from previous application
    *@description When the user clicks on the app tag, load the html structure and sets the event observers
    * which have changed.
    */
    run: function($super, args) {
        $super();
        document.observe('EWS:countrySelected', this.countrySelectedBinding);
        if (!Object.isEmpty(args.get('prevApp')))
            this.previousApp = args.get('prevApp');
        else this.previousApp = 'Onboarding';

        if (Object.isEmpty(this.Button_footer_Param)) { // firstRun

            this.prevApp = args.get('prevApp');
            this.prevTab = args.get('prevTab');
            this.prevView = args.get('prevView');

            var html = "<table class = 'Onb'>"
                     + "<tr><td><div id='company_name' class='Onb_Title application_main_title2'><span>"
                     + global.getCompanyName() + "</span><span class='Onb_company'> "
                     + global.getLabel(global.currentApplication.appId) + "</span></div></td></tr>"
                     + "<tr><td><div id='country' class='Onb_country'></div></td></tr>"
                     + "<tr><td><div id='applicationParam' style='display: block;'></div></td></tr>"
                     + "<tr><td><div id='button'></div></td></tr>"
                     + "</table>";
            this.virtualHtml.insert(html);
            this.ping();
            this.getCountry();


        }
        this.virtualHtml.down('[id=button]').update('');
        var json = {
            elements: [],
            defaultButtonClassName: ''
        };

        var exit = {
            label: global.getLabel('exit'),
            idButton: 'exit_button',
            handlerContext: null,
            handler: this._back.bind(this),
            type: 'button',
            standardButton: true,
            className: 'fieldDispFloatRight Onb_button'
        };

        json.elements.push(exit);
        this.Button_footer_Param = new megaButtonDisplayer(json);
        this.virtualHtml.down('[id=button]').insert(this.Button_footer_Param.getButtons());

        this.widgetsReadyBinding = this.fillWidgets.bind(this);
        document.observe('P:widgetsReady', this.widgetsReadyBinding);

    },

    ping: function() {
        // ping 
        var xml = "<EWS>"
                  + "<SERVICE>" + this.getPingService + "</SERVICE>"
                  + "<PARAM/>"
                  + "</EWS>";

        //  this.method = 'GET';
        //  this.url = 'standard/Onboarding/PING.xml';
        this.makeAJAXrequest($H({ xml: xml,
            successMethod: 'showPing',
            failureMethod: 'showPing', errorMethod: 'showPing', informationMethod: 'showPing'
        }));
    },

    showPing: function(Json) {
        this.ping = Json.EWS.o_ping_ok;
        this.pingMessage = Json.EWS.messages.item['#text'];
    },


    _pingMessage: function() {

        var icon = '';
        var status = "<table id='application_car_contain_status'>";
        icon = 'exclamation';
        status += "<tr class='application_book_status_line'><td class='application_car_status_label'>" + this.pingMessage + "</td></tr>";
        status += "</table>";
        var _this = this;
        var contentHTML = new Element('div', { 'class': 'Onb_popUp' });
        contentHTML.update('');
        contentHTML.insert(status);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            carStatusPopUp.close();
            delete carStatusPopUp;
        };
        var aux2 = {
            idButton: 'goTo',
            label: global.getLabel('ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        var carStatusPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': callBack
            }),
            htmlContent: contentHTML,
            indicatorIcon: icon,
            width: 350
        });
        carStatusPopUp.create();

    },

    getCountry: function() {

        var xml = '';
        xml = "<EWS>"
        + " <SERVICE>GET_COUNTRIES</SERVICE>"
        + "<OBJECT TYPE=''></OBJECT>"
        + "<PARAM></PARAM>"
        + "</EWS>";

        //  this.method = 'POST';
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: '_getCountryAutocompleter'
        }));
    },

    _getCountryAutocompleter: function(answer) {

        var countries = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: 'No results found',
                    search: 'Search'
                }
            }
        };

        if (answer && answer.EWS && answer.EWS.o_values && answer.EWS.o_values.item) {
            var def = '';
            objectToArray(answer.EWS.o_values.item).each(function(item) {
                if (Object.isEmpty(this.country)) {
                    def = 'X';
                    this.country = item['@id']
                }
                else {
                    def = '';
                }
                countries.autocompleter.object.push({
                    data: item['@id'],
                    text: item['@value'],
                    def: def
                })
            } .bind(this));
        }

        var CountryAutocompleter = new JSONAutocompleter('country', {
            showEverythingOnButtonClick: true,
            timeout: 8000,
            label: 'Country',
            templateOptionsList: '#{text}',
            width: '100px',
            minChars: 1,
            events: $H({ onResultSelected: 'EWS:countrySelected' })
        }, countries);

        this.loadWidgets();
    },

    /**     
    *@param args {Event} event thrown by the autoCompleter when a node has been selected from 
    *its search results list.
    *@description It gets a node context (parent and siblings) from SAP.
    */
    countrySelected: function(args) {
        if (getArgs(args).idAdded) {
            var id = getArgs(args).idAdded;
            var type = getArgs(args).textAdded;
            this.country = id;
            this.loadWidgets();
        }
    },
    /**
    *@description Method which call the GetWidgets module
    */
    loadWidgets: function() {
        if (this.widgetsStructure == null) {
            this.widgetsStructure = new GetWidgets({
                eventName: 'P:widgetsReady',
                service: this.widgetsService,
                tabId: global.currentApplication.appId, //'PARAM',
                objectType: global.objectType,
                objectId: global.objectId,
                target: this.virtualHtml.down('div#applicationParam')
            });
        }
        else if (!Object.isEmpty(this.virtualHtml) && !Object.isEmpty(this.widgetsStructure) && !Object.isEmpty(this.widgetsStructure.virtualHtml)) {
            this.widgetsStructure.reloadWidgets();
            this.virtualHtml.down('div#applicationParam').show();
        }
    },

    fillWidgets: function() {

        this.hashOfWidgets = this.widgetsStructure.widgets;
        //fill each widget
        this.hashOfWidgets.each(function(pair) {
            pair.value.setTitle(global.getLabel(pair.key));
            this.fillGenericWidget(pair);
        } .bind(this));
        this.firstRun = false;
    },

    /**
    *@description Method to fill the Pending Request Widget
    */
    fillGenericWidget: function(pair) {
        //alert('fillGenericWidget...' + pair.key);
        if (Object.isEmpty(this.country)) {
            pair.value.setContent(global.getLabel('no_result'));
        } else {

            pair.value.setContent('Loading...');
            this._getWidgetContent(pair.key);
        }
    },

    /**
    * @description Gets the widgets content
    * @param appId The widget ID
    */
    _getWidgetContent: function(appId, widScreen, selectedIndex) {
        if (!widScreen)
            widScreen = '1';
        var xml = '';
        xml = "<EWS>"
        + "<SERVICE>" + this.paramService + "</SERVICE>"
        // + "<OBJECT TYPE='P'>" + global.objectId + "</OBJECT>"
        + "<OBJECT TYPE=''></OBJECT>"
        + "<PARAM>"
        + "<APPID>" + appId + "</APPID>"
        + "<WID_SCREEN>*</WID_SCREEN>"
        + "<MOLGA>" + this.country + "</MOLGA>"
        + "</PARAM>"
        + "</EWS>";

        //Requesting the data
        //this.method = 'GET';
        //this.url = 'standard/Onboarding/GET_PARAM.xml';
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
    _parseWidgetContent: function(JSON, data) {
        //Defining the variables
        data = data.split(' '); //Spliting the data
        var appId = data[1];         //Stores the AppId
        var widScreen = data[0];         //Stores the widget screen
        var selectedPanel = data[2];         //Currently selected panel
        var fromDefault = data[3] === "true" ? true : false;
        this._selectedScreens = $H();            //The selected screens
        var listMode = false;           //List mode indicator
        var panel = null;            //Stores the panel
        var widgetScreens = null;            //Widget screens
        //Deleting the previous generated panel in case that it was created
        if (this._elementsStorage.get(appId + '_' + widScreen))
            this._elementsStorage.unset(appId + '_' + widScreen);
        //Creating the structure to store the information of the new panel
        if (!this._elementsStorage.get(appId + '_' + widScreen)) {
            this._elementsStorage.set(appId + '_' + widScreen, $H({
                fieldPanel: null, 	//Stores the fielPanel
                screenNavigation: null, //Stores information about the screen navigation
                contentContainer: null, //The prototype element that contains the panel
                json: null, 			//The JSON information
                records: new Array()	//The screen records
            }));
        }
        //Making a copy of the JSON so the modifications on it will not affect the copy on the cache
        this._elementsStorage.get(appId + '_' + widScreen).set('json', deepCopy(JSON));
        if (JSON.EWS.o_widget_screens)
            objectToArray(JSON.EWS.o_widget_screens.yglui_str_wid_screen).each(function(item) {
                if (item.yglui_str_wid_screen)
                    item = item.yglui_str_wid_screen;
                //if ((item['@screen'] == widScreen) && (item['@list_mode'] == 'X')) listMode = true;
            });
        document.stopObserving('EWS:ParamChange_' + this.tabId + '_' + appId);

        //Creating the fieldsPanel
        try {
            panel = new getContentModule({
                appId: appId,
                mode: 'display',
                json: this._elementsStorage.get(appId + '_' + widScreen).get('json'),
                showCancelButton: false,
                buttonsHandlers: $H({
                    DEFAULT_EVENT_THROW: 'EWS:ParamChange_' + this.tabId + '_' + appId
                }),
                cssClasses: $H({
                //tcontentSimpleTable: 'PDC_displayWithTable'
                'fieldDispLabel': 'Onb_fieldDispLabel'
                }),
                showButtons: $H({
                    edit: false,
                    display: true,
                    create: false
                })
            });
        }
        catch (e) {
            alert(e);
        }
        //Creating the observers for the fieldPanel
        document.observe('EWS:ParamChange_' + this.tabId + '_' + appId, this._actionButtonPressed.bind(this, appId, widScreen, listMode));

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
        this.hashOfWidgets.get(appId).getContentElement().insert(panel.getHtml());

        this._elementsStorage.get(appId + '_' + widScreen).set('contentContainer', this.hashOfWidgets.get(appId).getContentElement());
        //Storing the panel for this widget
        this._elementsStorage.get(appId + '_' + widScreen).set('fieldPanel', panel);

        this.displayHelps(appId, 'dis');

    },


    displayHelps: function(appId, pref) {
        if (pref == 'ch' || pref == 'def') {
            var classname = 'fieldWrap fieldClearBoth fieldDispFloatLeft fieldDispTotalWidth';
           //var classname = 'fieldClearBoth fieldDispTotalWidth';
            //var classname = 'fieldWrap fieldDispFloatLeft __here';
            //var classname = 'fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text';
        } else {
        var classname = 'fieldWrapDisplayMode fieldClearBoth fieldDispFloatLeft fieldDispTotalWidth';
        //var classname = 'fieldClearBoth fieldDispTotalWidth';
        //var classname = 'fieldWrapDisplayMode fieldClearBoth fieldDispFloatLeft';
            //var classname = 'fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text';
      
        }
        //insert link.
        $A(this.virtualHtml.select('[class=' + classname + ']')).each(function(link) {
            if (Object.isEmpty(this.virtualHtml.down('[id=' + pref + 'link' + link.id + ']'))) {
                var line = "<div class = 'Onb_verticalR_arrow ' id='" + pref + "link" + link.id + "'></div>";
                this.virtualHtml.down('[id=' + link.id + ']').insert({ 'top': line });
                this.virtualHtml.down('[id=' + pref + 'link' + link.id + ']').observe("click", function(event) {
                    var elem = event.element();
                    if (elem.hasClassName('Onb_verticalR_arrow')) {
                        elem.removeClassName('Onb_verticalR_arrow');
                        elem.addClassName('Onb_down_arrow');
                        this._displayInfo(elem, link.id, appId, pref);
                        elem.show();
                    }
                    else {
                        elem.removeClassName('Onb_down_arrow');
                        elem.addClassName('Onb_verticalR_arrow');
                        this.virtualHtml.down('[id=' + pref + 'help_' + link.id + ']').hide();
                        elem.show();
                    }
                } .bind(this));
            }

        } .bind(this));
    },


    _displayInfo: function(elem, id, appId, pref) {

        if (Object.isEmpty(this.virtualHtml.down('[id=' + pref + 'help_' + id + ']'))) {
            var param = id.substring(0, 5);
            var xml = "<EWS>"
        + "<SERVICE>GET_PARAM_HLP</SERVICE>"
        + "<OBJECT TYPE=''></OBJECT>"
        + "<PARAM>"
        + "<APPID>" + appId + "</APPID>"
        + "<FIELD>"
        + "<FIELDTECHNAME>" + param + "</FIELDTECHNAME>"
        + "</FIELD>"
        + "<MOLGA>" + this.country + "</MOLGA>"
        + "</PARAM>"
        + "</EWS>";

            this.makeAJAXrequest($H({
                xml: xml,
                successMethod: '_displayHelp',
                ajaxID: id + '%' + appId + '%' + pref
            }));
        } else {
            this.virtualHtml.down('[id=' + pref + 'help_' + id + ']').show();
        }
    },

    _displayHelp: function(JSON, data) {
        //Defining the variables
        data = data.split('%'); //Spliting the data
        var id = data[0];
        var appId = data[1];
        var pref = data[2]; //Stores the AppId
        if (!Object.isEmpty(JSON.EWS.o_body)) {
            var help = JSON.EWS.o_body
        } else {
            var help = global.getLabel('no_description')
        }
        var line = "<div class ='Onb ' id ='" + pref + "help_" + id + "'>" + help + "</div>";
        this.virtualHtml.down('[id=' + id + ']').insert({ 'bottom': line });

    },


    /**
    * This function is called every time we click on an action button. For example
    * clickin on add or change or delete.
    */
    _actionButtonPressed: function() {

        if (Object.isEmpty(this.ping)) {

            this._pingMessage();

        } else {

            //Variables declarations
            var args = $A(arguments);
            var appId = args[0];
            var widScreen = args[1];
            var panel = this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel');

            if (!Object.isEmpty(args[3])) {
                var data = getArgs(args[3]);
                panel.toggleMode('edit', panel.appId, data.screen, data.recKey);
                this.displayHelps(appId, 'ch');
            }

            this._createFormControlButtons(panel, this.hashOfWidgets.get(appId).getContentElement(), appId, widScreen, false);
        }
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
    _createFormControlButtons: function(panel, container, appId, screen, newRecord) {
        var mainButtonsJson = {
            elements: [],
            mainClass: 'PDC_buttonsContainer'
        };
        var saveHandler = null;
        saveHandler = this._saveForm.bind(this, appId, screen); //, undefined);
        var aux = {
            idButton: 'save',
            label: global.getLabel('save'),
            handlerContext: null,
            handler: saveHandler,
            className: 'fieldDispFloatRight',
            type: 'button',
            standardButton: true
        };
        var aux2 = {
            idButton: 'cancel',
            label: global.getLabel('cancel'),
            handlerContext: null,
            handler: this._getWidgetContent.bind(this, appId, this.modifier, this.record),
            className: 'fieldDispFloatRight',
            type: 'button',
            standardButton: true
        };

        mainButtonsJson.elements.push(aux2);
        mainButtonsJson.elements.push(aux);
        var ButtonsPDC = new megaButtonDisplayer(mainButtonsJson);

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

    /* Gets values from a JSON based on a screen number
    * @param json The JSON to get the screen from
    * @param screen The screen to get
    */
    _getScreen: function(json, screen, selected) {
        var returnValue = null;
        if (json.EWS.o_widget_screens)
        //Going throught all the recors to find the one matching with the screen number
            objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen).each(function(item) {
                if (item['@screen'] == screen) {
                    item['@selected'] = 'X';
                    returnValue = item;
                }
            });
        /*  if (selected)
        if (Object.jsonPathExists(returnValue, 'contents.yglui_str_wid_content'))
        returnValue.contents['yglui_str_wid_content'] = objectToArray(returnValue.contents.yglui_str_wid_content).reject(function(content) {
        return content['@rec_index'] != selected.toString();
        });*/
        return returnValue;
    },

    /* Gets a screen from a JSON based on a screen number
    * @param json The JSON to get the screen from
    * @param screen The screen to get
    */
    _getValues: function(json, screen, selected) {
        var returnValue = null;
        if (json.EWS.o_field_values)
        //Going throught all the recors to find the one matching with the screen number
            objectToArray(json.EWS.o_field_values.yglui_str_wid_record).each(function(item) {
                if (item['@screen'] == screen)
                    returnValue = item;
            });
        if (selected)
            if (Object.jsonPathExists(returnValue, 'contents.yglui_str_wid_content'))
            returnValue.contents['yglui_str_wid_content'] = objectToArray(returnValue.contents.yglui_str_wid_content).reject(function(content) {
                return content['@rec_index'] != selected.toString();
            });
        return returnValue;
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

        var json = deepCopy(this._elementsStorage.get(appId + '_' + screen).get('json'));
        var fieldPanel = this._elementsStorage.get(appId + '_' + screen).get('fieldPanel');
        var widScreen = screen;
        //If it's list mode we get the current selected from the list
        //Checking the form format
        var validForm = fieldPanel.validateForm(screen);

        //Getting the OKCODE
        if (fieldPanel.currentRecordIndex) {
            selected = parseInt(fieldPanel.currentRecordIndex, 10);
            screen = fieldPanel.currentSelected;
        }

        //Defining the variables that are gonna need to be recovered on the XML
        var xmlIn = new XML.ObjTree();
        xmlIn.attr_prefix = '@';
        var reg = { yglui_str_wid_record: this._getValues(json, screen, selected) };
        var fieldValues = xmlIn.writeXML(reg.yglui_str_wid_record.contents.yglui_str_wid_content[0].fields, true);
        //Defining the XML in
        xmlIn = '<EWS>' +
                '<SERVICE>SAVE_PARAMS</SERVICE>' +
                '<OBJECT TYPE=""></OBJECT>' +
                '<PARAM>' +
                    '<MOLGA>' + this.country + '</MOLGA>' +
                    '<APPID>' + appId + '</APPID>' +
                    '<WID_SCREEN>' + screen + '</WID_SCREEN>' +
                    '<field_values>' + fieldValues + '</field_values>' +
                '</PARAM>' +
                '<DEL></DEL>' +
                '</EWS>';

        //If there is no erros on the XMl we proceed to make the AJAX call
        if (validForm.correctForm == true) {
            this.makeAJAXrequest($H({
                xml: xmlIn,
                successMethod: '_processExit',
                failureMethod: '_processExit',
                errorMethod: '_processExit',
                informationMethod: '_processExit',
                ajaxID: appId + ' ' + widScreen
            }));
        }
    },

    _processExit: function(req, data) {

        var _this = this;
        var icon = '';
        var status = "<table id='application_car_contain_status'>";
        if (Object.isEmpty(req.EWS.webmessage_type)) {
            if (Object.isEmpty(req.EWS.messages)) {
                status += "<tr class='application_car_status_line'><td class='application_car_status_label'>" + global.getLabel('Success_Param') + "</td></tr>";
                icon = 'confirmation';
            } else {
                var message = req.EWS.messages.item['#text'];
                status += "<tr class='application_car_status_line'><td class='application_car_status_label'>" + message + "</td></tr>";
                icon = 'confirmation';
            }
        }
        else {
            var message = req.EWS.webmessage_text;
            var type = req.EWS.webmessage_type
            if (type == 'E') {
                icon = 'exclamation';
                status += "<tr class='application_book_status_line'><td class='application_car_status_label'>" + message + "</td></tr>";
            }
            else {
                icon = 'confirmation';
                status += "<tr class='application_book_status_line'><td class='application_car_status_label'>" + message + "</td></tr>";
            }
        }
        status += "</table>";
        if (type == 'E') {
            var callBack = function() {
                carStatusPopUp.close();
                delete carStatusPopUp;
            };
        } else {
            var callBack = function() {
                carStatusPopUp.close();
                delete carStatusPopUp;
                _this._saveFormSuccess(req, data);
            }
        }
        var _this = this;
        var contentHTML = new Element('div', { 'class': 'Onb_popUp' });
        contentHTML.update('');
        contentHTML.insert(status);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };

        var aux2 = {
            idButton: 'goTo',
            label: global.getLabel('ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        var carStatusPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': callBack
            }),
            htmlContent: contentHTML,
            indicatorIcon: icon,
            width: 350
        });
        carStatusPopUp.create();

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
        this._getWidgetContent(appId, widgetScreen, selectedIndex);

    },
    /**    
    *@description Goes back to the previous application
    */
    _back: function() {
        global.open($H({ app: { appId: this.prevApp, tabId: this.prevTab, view: this.prevView} }));
    },
    close: function($super) {
        $super();
        //unattach event handlers
        // document.stopObserving('EWS:ParamChange_' + this.tabId + '_' + appId, this._actionButtonPressed.bind(this, appId, widScreen, listMode));
        document.stopObserving('EWS:countrySelected', this.countrySelectedBinding);
    }

});

