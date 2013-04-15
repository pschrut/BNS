/** 
 * @fileOverview CarPool.js 
 * @description File containing class ONB. This application is responsible of 
 * showing Car details (Add or Modif).
*/

/**
 *@constructor
 *@description Class CARPAGE. Shows CAR Details.
 *@augments Application 
*/
var CARPAGE = Class.create(Application,
{
    /*
    Service
    */
    getContentService: 'GET_CONTENT2',
    SaveService: 'SAVE_CAR',

    /* if we open the application, reload details
    * @type Boolean
    */
    firstRun: true,
    /**
    *@param $super The superclass (Application)
    *@description Instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
        /*this.submitStatus = new Hash();
        this.timeEntryEmployeeSelectedBinding = this._employeeSelected.bindAsEventListener(this);*/
        //this.employeeColorChangedHandlerBinding = this.employeeColorChangedHandler.bindAsEventListener(this);
        //this.cancelBookingConfBoxButtonBinding = this.cancelBookingConfBoxButton.bindAsEventListener(this);
    },
    /**
    *@param $super The superclass: Application
    *@param args Arguments coming from previous application
    *@description 
    */
    run: function($super, args) {
        $super();
        if (this.firstRun) {
            this.firstRun = false;
            var html = "<table class='Onb'>" +
            "<tr><td><div id='company_name' class='Onb_Title application_main_title2'>"
            + global.getCompanyName() + "</div></td></tr>"
            + "<tr><td><div id='loadingMessage' class='Onb_Text'>" + global.getLabel('Loading') + "</div></td></tr>"
            + "<tr><td><div id='car_detail_body'></div></td></tr>"
            + "</table>";
            this.virtualHtml.insert(html);
            this.loadingMessageDiv = this.virtualHtml.down('[id=loadingMessage]');
            this.loadingMessageDiv.hide();
        }
        else
            this.virtualHtml.down('div#car_detail_body').update("");
        this.getContentCar = args.get('car');
        this.carId = Object.isEmpty(this.getContentCar.EWS) ? "" : this.getContentCar.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@key_str']; // key_str
        this.carKey = this.carId; // rec_key
        this._getCar();
        //document.observe('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelection', this.timeEntryEmployeeSelectedBinding);
    },

    /**
    *@description 
    */
    _getCar: function() {
        // New car
        if (Object.isEmpty(this.carId)) {
            this.xml = "<EWS>" +
                              "<SERVICE>" + this.getContentService + "</SERVICE>" +
                              "<OBJECT TYPE=''></OBJECT>" +
                              "<PARAM>" +
                                  "<APPID>" + global.currentApplication.appId + "</APPID>" +
                                  "<WID_SCREEN>*</WID_SCREEN>" +
                                  "<OKCODE>NEW</OKCODE>" +
                              "</PARAM>" +
                              "</EWS>";

            //this.method = 'GET';
            //this.url = 'standard/Onboarding/GET_NEW_CAR.xml';              
            this.makeAJAXrequest($H({ xml: this.xml, successMethod: '_displayNewCar' }));

        }
        // Existing car
        else
            this._displayCar();
    },

    /**
    *@description Displays all neccesary fields to create a new car
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    _displayNewCar: function(json, id) {
        var structure = json;
        this.virtualHtml.down('div#car_detail_body').insert(new Element("div", { id: "car_detail_fieldPanel" }));
        delete (json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.buttons);
        if (Object.isEmpty(structure.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@selected']))
            structure.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@selected'] = 'X';

        // Fields out of fieldPanel (title)
        var title = "<span>" + global.getCompanyName() + "</span><span class='Onb_company'> " + this._getTitle(structure) + "</span><br /><br />";
        this.virtualHtml.down('div#company_name').update(title);

        // Saving event into a hash
        this.getContentCar = structure;
        // Inserting fieldPanel
        this.fpjson = deepCopy(this.getContentCar);

        //Buttons
        this.hashToSaveButtons = $H({});
        this.hashToSaveButtons.set('cancel', this._exit.bind(this, null, ""));
        this.hashToSaveButtons.set('paiEvent', this._paiEvent.bind(this));

        // Buttons
        if (this.fpjson.EWS.o_screen_buttons) {
            var buttonsScreen = this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
            var functionToExecute;
            if ((buttonsScreen['@okcode'] == 'INS') || (buttonsScreen['@okcode'] == 'MOD'))
                functionToExecute = this._eventAction.bind(this, buttonsScreen['@action'], buttonsScreen['@okcode'], buttonsScreen['@type'], buttonsScreen['@label_tag']);
            this.hashToSaveButtons.set(buttonsScreen['@action'], functionToExecute);
        }

        var car = this.fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.carHash = new Hash();
        for (var i = 0; i < car.length; i++) {
            if (!Object.isEmpty(car[i]['@fieldtechname']))
                this.carHash.set(car[i]['@fieldtechname'], car[i]);
            else
                this.carHash.set(car[i]['@fieldid'], car[i]);
        }
        // this.appId = this.carHash.get('APPID')['@value'];

        var mode = 'create';
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({
            mode: mode,
            json: this.fpjson,
            appId: global.currentApplication.appId, //this.appId,
            showCancelButton: true,
            showLoadingPAI: false,
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({ fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt' })
        });
        this.virtualHtml.down('div#car_detail_body').insert(this.fieldPanel.getHtml());
    },

    /**
    *@description Gets the title from the car (new or existing one)
    *@param {JSON} json Information from GET_CONTENT service
    *@returns {String} title
    */
    _getTitle: function(json) {
        var titleCode = json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen['@label_tag'];
        title = global.getLabel(titleCode);
        return title;
    },

    /**
    *@description Displays an existing car
    */
    _displayCar: function() {
        this.fpjson = deepCopy(this.getContentCar);
        // Saving event into a hash
        var car = this.fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.carHash = new Hash();
        // We need to store fieldtechnames from values because they don't come with settings
        this.fieldtechnames = new Hash();
        for (var i = 0; i < car.length; i++) {
            //this.fieldtechnames.set(car[i]['@fieldid'], car[i]['@fieldtechname']);
            if (!Object.isEmpty(car[i]['@fieldtechname']))
                this.carHash.set(car[i]['@fieldtechname'], car[i]);
            else
                this.carHash.set(car[i]['@fieldid'], car[i]);
        }

        // Fields out of fieldPanel (title)
        var title = "<span>" + global.getCompanyName() + "</span><span class='Onb_company'> " + this._getTitle(this.fpjson) + "</span><br /><br />";
        this.virtualHtml.down('div#company_name').update(title);
        // Getting rec key
        this.carKey = this.fpjson.EWS.o_field_values.yglui_str_wid_record['@rec_key'];

        this.virtualHtml.down('div#car_detail_body').insert(new Element("div", { id: "car_detail_fieldPanel" }));

        var mode = 'edit';

        // Buttons
        this.hashToSaveButtons = $H({});
        if (this.fpjson.EWS.o_screen_buttons) {
            var buttonsScreen = this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
            buttonsScreen.each(function(pair) {
                var functionToExecute;
                if ((pair['@okcode'] == 'COP') || (pair['@okcode'] == 'MOD')) {
                    functionToExecute = this._eventAction.bind(this, pair['@action'], pair['@okcode'], pair['@type'], pair['@label_tag']);
                    this.hashToSaveButtons.set(pair['@action'], functionToExecute);
                }
            } .bind(this));
        }

        this.hashToSaveButtons.set('cancel', this._exit.bind(this, null, ""));
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({
            mode: mode,
            json: this.fpjson,
            appId: global.currentApplication.appId, //this.appId,
            showCancelButton: true,
            showLoadingPAI: false,
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({ fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt' })
        });
        this.virtualHtml.down('div#car_detail_fieldPanel').insert(this.fieldPanel.getHtml());
    },

    /**
    *@description Creates, modifies or removes a car
    *@param {String} action Requested action
    *@param {String} okcode Ok Code
    *@param {String} type Type
    *@param {String} label Label
    */
    _eventAction: function(action, okcode, type, label) {
        // fieldPanel validation
        var fpvalidation = this.fieldPanel.validateForm();
        var correctfp = fpvalidation.correctForm;
        if (correctfp) {
            var parameters = "";
            this.carHash.each(function(field) {
                var fieldid = field.value['@fieldid'];
                var fieldtech = Object.isEmpty(field.value['@fieldtechname']) ? "" : field.value['@fieldtechname'];
                var fieldname = Object.isEmpty(fieldtech) ? fieldid : fieldtech;
                var fieldtext = Object.isEmpty(field.value['#text']) ? "" : field.value['#text'];
                var fieldvalue = Object.isEmpty(field.value['@value']) ? "" : field.value['@value'];
                parameters += "<yglui_str_wid_field fieldid='" + fieldid + "' fieldlabel='' fieldtechname='" + fieldtech + "' fieldtseqnr='000000' value='" + fieldvalue + "'>" + fieldtext + "</yglui_str_wid_field>";
            } .bind(this));

            // Requests
            var xml = "<EWS>" +
              "<SERVICE>" + this.SaveService + "</SERVICE>" +
               "<OBJECT TYPE=''/>" +
              "<PARAM>" +
            //"<REQ_ID>" + this.carId + "</REQ_ID>" +
                  "<APPID>" + global.currentApplication.appId + "</APPID>" +
                  "<RECORDS>" +
                      "<yglui_str_wid_record rec_key='" + this.carId + "' screen='1'>" +
                          "<contents>" +
                              "<yglui_str_wid_content key_str='" + this.carId + "' rec_index='1' selected='X' tcontents=''>" +
                                  "<fields>" + parameters + "</fields>" +
                              "</yglui_str_wid_content>" +
                          "</contents>" +
                      "</yglui_str_wid_record>" +
                  "</RECORDS>" +
                  "<BUTTON ACTION='" + action + "' DISMA='' LABEL_TAG='" + label + "' OKCODE='" + okcode + "' SCREEN='' TARAP='' TARTY='' TYPE='" + type + "' />";
            xml += "</PARAM></EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: '_processExit', failureMethod: '_processExit', errorMethod: '_processExit', informationMethod: '_processExit' }));
        }
    },

    /* _exitError: function(json) {
    alert('lola');
    //this.errorMessageDiv.insert(json.EWS.webmessage_text);
    //this.errorMessageDiv.show();
    },*/

    /**
    *@description Calls SAP with a PAI service to refresh the screen
    *@param {Object} args Information about the field that calls the service
    */
    _paiEvent: function(args) {
        //loading
        this.loadingMessageDiv.show();
        //  this.fieldPanel.destroy();
        var arguments = getArgs(args);
        var servicePai = arguments.servicePai;
        var jsonToSend = {
            EWS: {
                SERVICE: servicePai,
                OBJECT: {
                    TYPE: 'P',
                    TEXT: global.objectId
                },
                PARAM: {
                    o_field_settings: this.fpjson.EWS.o_field_settings,
                    o_field_values: this.fpjson.EWS.o_field_values,
                    appId: global.currentApplication.appId
                }
            }
        };
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';
        // this.method = 'GET';
        // this.url = 'standard/Onboarding/GET_NEW_CAR.xml'; 
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            // Temporal success method
            successMethod: '_refreshCar',
            failureMethod: '_processExit',
            errorMethod: '_processExit',
            informationMethod: '_processExit'
        }));
    },

    /**
    *@description Refreshes the screen after a PAI service
    *@param {JSON} json Information from the PAI service
    */
    _refreshCar: function(json) {

        this.fpjson.EWS.o_field_values = json.EWS.o_field_values;
        this.fpjson.EWS.o_field_settings = json.EWS.o_field_settings;
        // Saving event into a hash
        var car = this.fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.carHash = new Hash();
        // We need to store fieldtechnames from values because they don't come with settings
        this.fieldtechnames = new Hash();
        for (var i = 0; i < car.length; i++) {
            //this.fieldtechnames.set(car[i]['@fieldid'], car[i]['@fieldtechname']);
            if (!Object.isEmpty(car[i]['@fieldtechname']))
                this.carHash.set(car[i]['@fieldtechname'], car[i]);
            else
                this.carHash.set(car[i]['@fieldid'], car[i]);
        }

        var mode = 'edit';
        // Buttons
        this.hashToSaveButtons = $H({});
        this.hashToSaveButtons.set('cancel', this._exit.bind(this, null, ""));
        this.hashToSaveButtons.set('paiEvent', this._paiEvent.bind(this));

        if (this.fpjson.EWS.o_screen_buttons) {
            var buttonsScreen = this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
            var functionToExecute;
            if ((buttonsScreen['@okcode'] == 'INS') || (buttonsScreen['@okcode'] == 'MOD'))
                functionToExecute = this._eventAction.bind(this, buttonsScreen['@action'], buttonsScreen['@okcode'], buttonsScreen['@type'], buttonsScreen['@label_tag']);
            this.hashToSaveButtons.set(buttonsScreen['@action'], functionToExecute);
        }
        this.fieldPanel.destroy();
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({
            mode: mode,
            json: this.fpjson,
            appId: global.currentApplication.appId, //this.appId,
            showCancelButton: true,
            showLoadingPAI: false,
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({ fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt' })
        });
        //first we delete the old data.
        //this.fieldPanel.destroy();
        this.virtualHtml.down('div#car_detail_body').update("");
        this.virtualHtml.down('div#car_detail_body').insert(new Element("div", { id: "car_detail_fieldPanel" }));
        this.virtualHtml.down('div#car_detail_fieldPanel').insert(this.fieldPanel.getHtml());
        this.loadingMessageDiv.hide();
    },
    /**
    *@description Exits the application and open the previous one
    *@param {JSON} json Information from SAVE_EVENTS service
    *@param {number} ID Request ID
    */
    _exit: function(json, ID) {
        /*  // Submit button
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
        global.goToPreviousApp();
        }*/
        //global.goToPreviousApp();
        global.open($H({
            app: {
                appId: global.previousApplication.appId,
                tabId: global.previousApplication.tabId,
                view: global.previousApplication.view
            },
            norefresh: 'X'
        }));
    },

    /**
    * @description Shows the status of the booking after calling SAP
    * @param req Result of the AJAX request
    */
    _processExit: function(req) {

        this.loadingMessageDiv.hide();
        var icon = '';
        var status = "<table id='application_car_contain_status'>";
        //+ "<h2 id='application_car_status_title' class='application_car_status'>" + global.getLabel('status') + "</h2>";
        if (Object.isEmpty(req.EWS.webmessage_type)) {
            if (Object.isEmpty(req.EWS.messages)) {
                status += "<tr class='application_car_status_line'><td class='application_car_status_label'>" + global.getLabel('Success_Car') + "</td></tr>";
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
                status += "<tr class='application_book_status_line'><td class='application_car_status_label'>" + global.getLabel('Success_Car') + "</td></tr>";
            }

        }
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
            if (type == 'E') {
            } else {
                document.fire('EWS:refreshCarPool');
                global.open($H({
                    app: {
                        appId: global.previousApplication.appId,
                        tabId: global.previousApplication.tabId,
                        view: global.previousApplication.view
                    }
                }));
            }
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
                /* function() {

                    carStatusPopUp.close();
                delete carStatusPopUp;
                document.fire('EWS:refreshCarPool');
                global.open($H({
                app: {
                appId: global.previousApplication.appId,
                tabId: global.previousApplication.tabId,
                view: global.previousApplication.view
                }
                }));
                //global.goToPreviousApp();
                }*/
            }),
            htmlContent: contentHTML,
            indicatorIcon: icon,
            width: 350
        });
        carStatusPopUp.create();

    },

    close: function($super) {
        $super();
        //document.stopObserving('EWS:myCompanies_companySelected', this.onCompanySelected.bindAsEventListener(this)); 

        if (this.fieldPanel)
            this.fieldPanel.destroy();

        /*document.stopObserving('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelection', this.timeEntryEmployeeSelectedBinding);
        if (this.fieldPanel)
        this.fieldPanel.destroy();*/
        //this.emptyTrainingsIds.clear();
        //this.emptySessionsIds.clear();
        //unattach event handlers
        //document.stopObserving('EWS:employeeColorChanged', this.employeeColorChangedHandlerBinding);
        //document.stopObserving('EWS:cancelcaringReasonAutocompleter_resultSelected', this.cancelBookingConfBoxButtonBinding);
    }

});


