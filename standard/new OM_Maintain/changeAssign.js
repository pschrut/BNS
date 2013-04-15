/** 
* @fileOverview changeAssign.js 
* @description File containing class changeAssign. 
* Application for Maintain and Display in OM.
*/

/**
*@constructor
*@description Class changeAssign.
*@augments getContentDisplayer 
*/
var ChangeAssign = Class.create(getContentDisplayer, {
    showCancelButton: false,
    /*
    *@method initialize
    *@param $super: the superclass: getContentDisplayer
    *@desc instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
    },

    /*
    *@method run
    *@param $super: the superclass: getContentDisplayer
    * which have changed.
    */
    run: function($super, args) {
        //buttons
        this.app = args.get('app').appId;
        var buttonsHandlers = $H({
            DEFAULT_EVENT_THROW: 'EWS:changeAssign_buttons_' + this.app
        });
        args.set('buttonsHandlers', buttonsHandlers);
        //parameters
        this.objectId = getArgs(args).get('objectId');
        this.objectIdRequest = this.objectId;
        this.parentType = getArgs(args).get('parentType');
        this.oType = getArgs(args).get('oType');
        $super(args);
        //buttons event
        this.onButtonBinding = this._actionButtonPressed.bindAsEventListener(this);
        document.observe('EWS:changeAssign_buttons_' + this.app, this.onButtonBinding);
    },
    /*
    * @method _actionButtonPressed
    * @desc called to treat the action of the button clicked
    */
    _actionButtonPressed: function(event) {
        //get index for each record
        var records = objectToArray(this.fp.json.EWS.o_field_values.yglui_str_wid_record);
        var recIndexArray = [];
        for (var i = 0; i < records.length; i++) {
            recIndexArray.push(records[i].contents.yglui_str_wid_content['@rec_index']);
        }
        var recKey = recIndexArray.indexOf(getArgs(event).recKey);
        var screen = getArgs(event).screen;
        var record = getArgs(event).recKey;
        //get other values
        this.action = getArgs(event).action;
        var okCode = getArgs(event).okcode;
        var labelTag = getArgs(event).label_tag;
        var appId = getArgs(event).tarap;
        switch (this.action) {
            case 'APP_OM_CANCEL': // cancel button
                this.fp.destroy();
                var tarapId, view;
                var screenButtons = objectToArray(this.fp.json.EWS.o_screen_buttons.yglui_str_wid_button);
                for (var i = 0; i < screenButtons.length; i++) {
                    if (screenButtons[i]['@action'] == 'APP_OM_CANCEL') {
                        tarapId = screenButtons[i]['@tarap'];
                        view = screenButtons[i]['@views'];
                    }
                }
                global.open($H({
                    app: {
                        appId: tarapId,
                        tabId: this.options.tabId,
                        view: view
                    },
                    refresh: true,
                    objectIdRequest: this.objectId
                }));
                break;
            case 'REC_OM_SAVE': // save row
                this.saveScreen(okCode, recKey, labelTag, record, screen);
                break;
            case 'SCR_OM_CREATE': // add occup (show the empty screen for add occ)
                //get view
                var actions = objectToArray(this.fp.json.EWS.o_screen_buttons.yglui_str_wid_button);
                for (var i = 0; i < actions.length; i++) {
                    if (actions[i]['@action'] == 'SCR_OM_CREATE') {
                        this.view = actions[i]['@views'];
                        this.okCode = actions[i]['@okcode'];
                    }
                }
                this.tarapId = appId;
                global.open($H({
                    app: {
                        appId: this.tarapId,
                        tabId: this.options.tabId,
                        view: this.view
                    },
                    displayMode: 'create',
                    objectId: this.objectId,
                    objectIdRequest: this.objectIdRequest,
                    parentType: this.parentType,
                    oType: this.oType,
                    okCode: this.okCode
                }));
                break;
            case 'REC_OM_DELETE': // remove row
                this.deleteAssign(okCode, recKey, labelTag);
                break;
            case 'REC_OM_DELIMIT': // delimit row
                this.delimitAssign(okCode, recKey, labelTag);
                break;
            default:
                break;
        }
    },
    /*
    * @method saveScreen
    * @desc called to save the information of the screen after clicking button
    */
    saveScreen: function(okCode, recKey, labelTag, record, screen) {
        //build the json for the row
        var json = this.jsonToSave(recKey);
        //save the okCode
        this.okCode = okCode;
        //save information
        this.saveRequest(this.action, labelTag, json, record, screen);
    },
    /*
    * @method saveRequestAnswer
    * @desc answer from SAP when a saving request has been done
    */
    saveRequestAnswer: function() {
        //if action is 'delete' the prevoius app (tree) is loaded
        if (this.action == 'REC_OM_DELETE' && objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record).length == '1') {
            this.fp.destroy();
            global.goToPreviousApp({ refresh: true });
        } else {
            this.toggleMode('edit');
        }
    },
    /*
    * @method Method that delimit an assignment after the user confirmation
    * @desc called to delimit the assignment
    */
    delimitAssign: function(code, recKey, labelTag) {
        //build the html structure    
        var genericDelimitHtml = "<div>"
                                       + "<span>" + global.getLabel('delimitAss') + "</span><br>"
                                   + "<span</span>"
                                       + "<div id='delimit_" + this.objectId + "DatePicker'></div>"
                                   + "</div>";
        var aux = { defaultDate: objectToSap(new Date()).gsub('-', '')};
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(genericDelimitHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function() {
            if (_this)
                delimitPopUp.close();
            _this.delimitRequest(code, recKey, labelTag);
            delete delimitPopUp;
        };
        var callBack3 = function() {
            delimitPopUp.close();
            delete delimitPopUp;
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
        //create the info pop up 
        var delimitPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    delimitPopUp.close();
                    delete delimitPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'exclamation',
            width: 600
        });
        delimitPopUp.create();
        this.genericDelimitDatePicker = new DatePicker('delimit_' + this.objectId + 'DatePicker', aux);
    },
    /**
    * @description Builds the xml and send it to SAP for the Delimit request
    */
    delimitRequest: function(code, recKey, labelTag) {
        //build the json for the row
        var json = this.jsonToSave(recKey);
        this.json = json;
        //save the okCode
        this.okCode = code;
        //save the endda date selected
        var fields = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        for (var i = 0; i < fields.length; i++) {
            if (fields[i]['@fieldtechname'] == 'ENDDA') {
                this.json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[i]['@value'] = this.genericDelimitDatePicker.actualDate.toString('yyyy-MM-dd');
            }
        }
        //save information
        this.saveRequest(this.action, labelTag, json);
    },
    /*
    * @method Method to delete an assignment after the user confirmation
    * @desc called to delete the assignment
    */
    deleteAssign: function(code, recKey, labelTag) {
        //build the html structure    
        var genericDeleteHtml = "<div>"
                                   + "<span>" + global.getLabel('deleteAssConf') + "</span><br>"
                                   + "<span</span>"
                                   + "</div>";
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(genericDeleteHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function() {
            if (_this)
                deletePopUp.close();
            _this.deleteRequest(code, recKey, labelTag);
            delete deletePopUp;
        };
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
        //create the info pop up
        var deletePopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    deletePopUp.close();
                    delete deletePopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'exclamation',
            width: 600
        });
        deletePopUp.create();
    },
    /**
    * @description Builds the xml and send it to SAP for the Delete request
    */
    deleteRequest: function(code, recKey, labelTag) {
        //build the json for the row
        var json = this.jsonToSave(recKey);
        this.json = json;
        //save the okCode
        this.okCode = code;
        //save information
        this.saveRequest(this.action, labelTag, json);
    },
    /*
    * @method jsonToSave
    * @desc called to build the json to do an action on a row.
    */
    jsonToSave: function(recKey) {
        var jsonObject;
        //get the field_values for each object
        var idObject, screen;
        var values = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
        //build json for the rest of objects
        jsonObject = { o_field_settings: { yglui_str_wid_fs_record: this.json.EWS.o_field_settings },
            o_field_values: { yglui_str_wid_record: values[recKey] },
            o_widget_screens: { yglui_str_wid_screen: this.json.EWS.o_widget_screens.yglui_str_wid_screen },
            o_screen_buttons: this.json.EWS.o_screen_buttons,
            o_widget_screens: this.json.EWS.o_widget_screens,
            labels: this.json.EWS.labels
        };
        jsonObject = { EWS: jsonObject };
        return jsonObject
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
        document.stopObserving('EWS:changeAssign_buttons_' + this.app, this.onButtonBinding);
    }
});