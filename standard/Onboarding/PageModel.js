/** 
* @fileOverview ModelPool.js 
* @description File containing class modelPage. This application is responsible of 
* showing model detail.
*/

/**
*@constructor
*@description Class CARPOOL. Shows Onboarding CAR POOL.
*@augments Application 
*/
var modelPage = Class.create(Application,
{
    /*
    Service
    */
    getContentService: 'GET_MODELS',
    SaveService: 'SAVE_MODEL',

    /* if we open the application from book/prebook, reload all tables
    * @type Boolean
    */
    firstRun: true,

    /**
    * json object with cancellation reasons
    * @type json object
    */
    jsonReasons: null,

    /**
    *@param $super The superclass (Application)
    *@description Instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
    },
    /**
    *@param $super The superclass: Application
    *@param args Arguments coming from previous application
    *@description 
    */
    run: function($super, args) {
        $super();
        //document.observe('EWS:myCompanies_companySelected', this.onCompanySelected.bindAsEventListener(this));  
        if (this.firstRun) {
            this.firstRun = false;
            var html =
            "<div id='company_name' class='Onb_Title application_main_title2'>"
            + global.getCompanyName() + "</div>"
            // + "<div id='errorMessage' class='applicationtimeSheet_errorMessageDiv'></div>"
            + "<div id='model_detail_body'></div>";
            this.virtualHtml.insert(html);
        }
        else
            this.virtualHtml.down('div#model_detail_body').update("");
        this.getContentModel = args.get('model');
        this.modelId = Object.isEmpty(this.getContentModel.EWS) ? "" : this.getContentModel.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@key_str']; // key_str
        this.modelKey = this.modelId; // rec_key
        this._getModel();
        //document.observe('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelection', this.timeEntryEmployeeSelectedBinding);
    },

    /**
    *@description Gets information from the previous application and requests additional data if needed
    */
    _getModel: function() {
        // New model
        if (Object.isEmpty(this.modelId)) {
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
            this.makeAJAXrequest($H({ xml: this.xml, successMethod: '_displayNewModel' }));

        }
        // Existing model
        else
            this._displayModel();
    },

    /**
    *@description Displays all neccesary fields to create a new model
    *@param {JSON} json Information from GET_CONTENT service
    */
    _displayNewModel: function(json, id) {
        var structure = json;
        this.virtualHtml.down('div#model_detail_body').insert(new Element("div", { id: "model_detail_fieldPanel" }));
        delete (json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.buttons);

        if (Object.isEmpty(structure.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@selected']))
            structure.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@selected'] = 'X';

        var title = "<span>" + global.getCompanyName() + "</span><span class='Onb_company'> " + this._getTitle(structure) + "</span><br /><br />";
        this.virtualHtml.down('div#company_name').update(title);

        // Saving event into a hash
        this.getContentModel = structure;
        // Inserting fieldPanel
        this.fpjson = deepCopy(this.getContentModel);

        //Buttons
        // var buttonsScreen = this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
        this.hashToSaveButtons = $H({});
        this.hashToSaveButtons.set('cancel', this._exit.bind(this, null, ""));

        if (this.fpjson.EWS.o_screen_buttons) {
            var buttonsScreen = this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
            var functionToExecute;
            if ((buttonsScreen['@okcode'] == 'INS') || (buttonsScreen['@okcode'] == 'MOD'))
                functionToExecute = this._eventAction.bind(this, buttonsScreen['@action'], buttonsScreen['@okcode'], buttonsScreen['@type'], buttonsScreen['@label_tag']);
            this.hashToSaveButtons.set(buttonsScreen['@action'], functionToExecute);

        }

        var model = this.fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.modelHash = new Hash();
        for (var i = 0; i < model.length; i++) {
            if (!Object.isEmpty(model[i]['@fieldtechname']))
                this.modelHash.set(model[i]['@fieldtechname'], model[i]);
            else
                this.modelHash.set(model[i]['@fieldid'], model[i]);
        }
        // this.appId = this.modelHash.get('APPID')['@value'];

        var mode = 'create';
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({
            mode: mode,
            json: this.fpjson,
            appId: global.currentApplication.appId, //this.appId,
            showCancelButton: true,
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({ fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt' })
        });
        this.virtualHtml.down('div#model_detail_body').insert(this.fieldPanel.getHtml());
    },

    /**
    *@description Gets the title from the model (new or existing one)
    *@param {JSON} json Information from GET_CONTENT service
    *@returns {String} title
    */
    _getTitle: function(json) {
        var titleCode = json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen['@label_tag'];

        title = global.getLabel(titleCode);
        return title;
    },


    /**
    *@description Displays an existing event
    */
    _displayModel: function() {
        this.fpjson = deepCopy(this.getContentModel);
        // Saving event into a hash
        var model = this.fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.modelHash = new Hash();
        // We need to store fieldtechnames from values because they don't come with settings
        this.fieldtechnames = new Hash();
        for (var i = 0; i < model.length; i++) {
            //this.fieldtechnames.set(model[i]['@fieldid'], model[i]['@fieldtechname']);
            if (!Object.isEmpty(model[i]['@fieldtechname']))
                this.modelHash.set(model[i]['@fieldtechname'], model[i]);
            else
                this.modelHash.set(model[i]['@fieldid'], model[i]);
        }

        // Fields out of fieldPanel (title and employee)
        var title = "<span>" + global.getCompanyName() + "</span><span class='Onb_company'> " + this._getTitle(this.fpjson) + "</span><br /><br />";
        this.virtualHtml.down('div#company_name').update(title);
        // Getting rec key
        this.modelKey = this.fpjson.EWS.o_field_values.yglui_str_wid_record['@rec_key'];

        this.virtualHtml.down('div#model_detail_body').insert(new Element("div", { id: "model_detail_fieldPanel" }));

        var mode = 'edit';
        // if (!editable)
        //     mode = 'display';

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
            //this.hashToSaveButtons.set('paiEvent', this._paiEvent.bind(this));
        }


        this.hashToSaveButtons.set('cancel', this._exit.bind(this, null, ""));
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({
            mode: mode,
            json: this.fpjson,
            appId: global.currentApplication.appId, //this.appId, 
            //predefinedXmls: this.get_subtypesXML, 
            showCancelButton: true,
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({ fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt' })
        });
        this.virtualHtml.down('div#model_detail_fieldPanel').insert(this.fieldPanel.getHtml());
    },

    /**
    *@description Creates, modifies or removes an event
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
            this.modelHash.each(function(field) {
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
            // "<REQ_ID>" + this.modelId + "</REQ_ID>" +
        "<APPID>" + global.currentApplication.appId + "</APPID>" +
        "<RECORDS>" +
        "<yglui_str_wid_record rec_key='" + this.modelId + "' screen='1'>" +
        "<contents>" +
        "<yglui_str_wid_content key_str='" + this.modelId + "' rec_index='1' selected='X' tcontents=''>" +
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


    /**
    *@description Exits the application and open the previous one
    *@param {JSON} json Information from SAVE_EVENTS service
    *@param {number} ID Request ID
    */
    _exit: function(json, ID) {

        global.open($H({
            app: {
                appId: global.previousApplication.appId,
                tabId: global.previousApplication.tabId,
                view: global.previousApplication.view
            },
            norefresh: 'X'
        }));
    },


    _processExit: function(req) {

        var icon = '';
        var status = "<table id='application_car_contain_status'>";
        if (Object.isEmpty(req.EWS.webmessage_type)) {
            if (Object.isEmpty(req.EWS.messages)) {
                status += "<tr class='application_car_status_line'><td class='application_car_status_label'>" + global.getLabel('Success_Model') + "</td></tr>";
                icon = 'confirmation';
            } else {
                var message = req.EWS.messages.item['#text'];
                status += "<tr class='application_car_status_line'><td class='application_car_status_label'>" + message +"</td></tr>";
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
        /* document.stopObserving('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelection', this.timeEntryEmployeeSelectedBinding);
        if (this.fieldPanel)
        this.fieldPanel.destroy();*/
        //this.emptyTrainingsIds.clear();
        //this.emptySessionsIds.clear();
        //unattach event handlers
        //document.stopObserving('EWS:employeeColorChanged', this.employeeColorChangedHandlerBinding);
        //document.stopObserving('EWS:cancelBookingReasonAutocompleter_resultSelected', this.cancelBookingConfBoxButtonBinding);
    }

});


