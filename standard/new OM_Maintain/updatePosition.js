﻿/** 
* @fileOverview updatePosition.js 
* @description File containing class updatePosition. 
* Application for Maintain in OM.
*/

/**
*@constructor
*@description Class updatePosition_standard.
*@augments getContentDisplayer 
*/
var UpdatePosition = Class.create(getContentDisplayer, {
    showCancelButton: false,
    successScreen1: false,
    successScreen2: false,
    saveRequestService: 'SAVE_OS',
    /*
    *@method initialize
    *@param $super: the superclass: getContentDisplayer
    *@desc instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
        this.addElementFromCatBindingJP = this.addElementFromCat.bindAsEventListener(this);
    },
    /*
    *@method run
    *@param $super: the superclass: getContentDisplayer
    */
    run: function($super, args) {
        //buttons 
        var buttonsHandlers = $H({
            APP_OM_CANCEL: function() { global.goToPreviousApp(); },
            APP_OM_SAVE: function() { this.saveScreen('APP_OM_SAVE'); } .bind(this),
            SCR_OM_DESC: function() { this.showDetails('SCR_OM_DESC'); } .bind(this)
        });
        args.set('buttonsHandlers', buttonsHandlers);
        $super(args);
        document.observe('EWS:returnSelected', this.addElementFromCatBindingJP);
    },
    /*
    * @method showDetails
    * @desc called to show details after clicking the button
    */
    showDetails: function(action) {
        var screen, secScreen;
        //get the screen asociated to the action
        var screenButtons = this.fp.json.EWS.o_screen_buttons.yglui_str_wid_button;
        for (var i = 0; i < screenButtons.size(); i++) {
            if (screenButtons[i]['@action'] == action) {
                screen = screenButtons[i]['@screen'];
            }
        }
        //get the secondary screen to show
        var screenWidgets = this.fp.json.EWS.o_widget_screens.yglui_str_wid_screen;
        for (var i = 0; i < screenWidgets.size(); i++) {
            if (screenWidgets[i]['@secondary'] == screen) {
                secScreen = screenWidgets[i]['@screen'];
            }
        }
        //display the secondary screen
        this.fp.displaySecondaryScreens(secScreen);
    },
    /*
    * @method saveScreen
    * @desc called to save the information of the screen after clicking button
    */
    saveScreen: function(action) {
        var labelTag;
        //get parameters
        var records = objectToArray(this.fp.json.EWS.o_field_values.yglui_str_wid_record)
        var recInd = records[0]['@rec_key'];
        var screen = records[0]['@screen'];
        var screenButtons = this.fp.json.EWS.o_screen_buttons.yglui_str_wid_button;
        for (var i = 0; i < screenButtons.size(); i++) {
            if (screenButtons[i]['@action'] == action) {
                labelTag = screenButtons[i]['@label_tag'];
                this.okCode = screenButtons[i]['@okcode'];
                this.viewTree = screenButtons[1]['@views'];
                this.appIdTree = screenButtons[1]['@tarap'];
            }
        }
        //service name to save data
        this.saveRequestService = 'SAVE_POS';
        //save information
        this.saveRequest(action, labelTag);
    },
    /*
    * @method linkButtonsTable
    * @desc called to handle buttons in 'table mode' screen
    */
    linkButtonsTable: function() {
        if (!Object.isEmpty(this.virtualHtml.down("[id=" + this.appName + "_SCR_PFMADDCOMP]"))) {
            this.virtualHtml.down("[id=" + this.appName + "_SCR_PFMADDCOMP]").stopObserving('click');
            this.virtualHtml.down("[id=" + this.appName + "_SCR_PFMADDCOMP]").observe('click', function() { this.addCompetencies('CQK_QK', 4); } .bind(this));
        }
    },
    /*
    * @method addCompetencies
    * @desc called to open app after clicking on button in 'table mode' screen
    */
    addCompetencies: function(tarap, widgetFlag) {
        global.open($H({
            app: {
                appId: tarap,
                tabId: 'POPUP',
                view: 'COMPCATL'
            },
            multiple: true,
            screen: widgetFlag,
            cont: 0
        }));
    },
    /**  
    *@param event Event thrown when closing the catalogue
    *@description Receives the selected nodes, and calls to get content to retrieve the default element structure
    */
    addElementFromCat: function(event) {
        this.elementsAdded = $A();
        this.elementsAdded = getArgs(event).get('hash');
        var cont = getArgs(event).get('cont');
        var Inscreen = getArgs(event).get('InScreen');
        var xml = "<EWS>" +
                    "<SERVICE>" + this.getContentService + "</SERVICE>" +
                    "<OBJECT TYPE='" + this.parentType + "'>" + this.objectId + "</OBJECT>" +
                    "<PARAM>" +
                        "<APPID>" + this.tarapId + "</APPID>" +
                        "<WID_SCREEN>" + Inscreen + "</WID_SCREEN>" +
                        "<OKCODE>NEW</OKCODE>" +
                    "</PARAM>" +
                "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'addElementFromCatAfterReq', ajaxID: Inscreen + "_" + cont }));
    },
    /**  
    *@param json Json with the default element structure
    *@param options Data needed to perform the addition, such as the widget counter  
    *@description Receives default element structure, and creates a new element for each selected node in the catalogue
    */
    addElementFromCatAfterReq: function(json, options) {
        //to show the message
        this.toggleSaveChangesMessage(true);
        var Inscreen = options.split("_")[0];
        var cont = parseInt(options.split("_")[1], 10);
        //if it's grouped, save the grouping field
        var grouping;
        json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field.each(function(setting) {
            if (setting['@fieldtype'] == 'G' && setting['@fieldid'] != 'STATUS_GROUP')
                grouping = setting['@fieldid'];
        } .bind(this));
        //star modifying the xml     
        this.elementsAdded.each(function(pair) {
            var record = deepCopy(json.EWS.o_field_values.yglui_str_wid_record);
            record.contents.yglui_str_wid_content['@key_str'] = "_" + pair.key;
            //change in the xml: id, type & name
            record.contents.yglui_str_wid_content.fields.yglui_str_wid_field.each(function(field, indexField) {
                //change id & name
                if (field['@fieldid'] == 'OBJID') {
                    field['@value'] = pair.key;
                    field['#text'] = pair.value.childName;
                }
                //change type
                if (field['@fieldid'] == 'OTYPE')
                    field['@value'] = pair.value.childType;
                //if it's grouped, change parent name
                if (field['@fieldid'] == grouping)
                    field['#text'] = pair.value.parentName;
            } .bind(this));
            var addButton;
            this.json.EWS.o_screen_buttons.yglui_str_wid_button.each(function(button, indexButton) {
                if (button['@screen'] == Inscreen)
                    addButton = deepCopy(button);
            } .bind(this));
            //add to this.json before removing buttons
            if (Object.isEmpty(this.json.EWS.o_field_values)) {
                var recordPath = { yglui_str_wid_record: [] }
                this.json.EWS.o_field_values = recordPath;
            } else
                this.json.EWS.o_field_values.yglui_str_wid_record = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
            this.json.EWS.o_field_values.yglui_str_wid_record.push(deepCopy(record));
            //delete default buttons,        
            record.contents.yglui_str_wid_content.buttons.yglui_str_wid_button.each(function(buttonToDelete) {
                record.contents.yglui_str_wid_content.buttons.yglui_str_wid_button = record.contents.yglui_str_wid_content.buttons.yglui_str_wid_button.without(buttonToDelete);
            } .bind(this));
            //and put the 'add' one 
            record.contents.yglui_str_wid_content.buttons.yglui_str_wid_button = objectToArray(addButton);
            //remove now the key_str
            //record.contents.yglui_str_wid_content['@key_str'] = '';
            //save in the array with the records to save                
            this.recordsToSave.push(record);
        } .bind(this));

        //reload screen
        //remove old html        
        delete (this.grArrayMain[cont]);
        this.virtualHtml.down('div#PFM_containerTable' + cont + '_' + this.appId).update('');
        //create new gl
        var screensStructure = splitInScreensGL(this.json);
        var isGroupedArray = objectToArray(screensStructure.get(Inscreen).headers.fs_fields.yglui_str_wid_fs_field);
        var isGrouped = false;
        for (var b = 0; b < isGroupedArray.length && !isGrouped; b++) {
            if (isGroupedArray[b]['@fieldtype'] == 'G')
                isGrouped = true;
        }
        var newJson;
        newJson = this.getContentToGroupedLayout(screensStructure.get(Inscreen), isGrouped, cont);
        this.grArrayMain[cont] = new groupedLayout(newJson, this.virtualHtml.down('div#PFM_containerTable' + cont + '_' + this.appId));
        this.grArrayMain[cont].buildGroupLayout();

    },
    saveRequestTableModeAnswer: function(response) {
        this.successScreen2 = true;
        this.resp1 = response;
        this.saveRequestAnswerAllScreens();

    },
    saveRequestAnswer: function(response) {
        //this.goBackAndRefresh();
        this.successScreen1 = true;
        this.resp2 = response;
        this.saveRequestAnswerAllScreens()
    },
    saveRequestAnswerAllScreens: function() {
        if (this.successScreen1 && this.successScreen2) {
            if (this.resp1 != '') {
                var valueOfError = this.resp1.EWS.webmessage_type;
                if (valueOfError != 'E') {
                    this.recordsToSave = $A();
                    //hide the message
                    this.toggleSaveChangesMessage(false);
                }
            }
            this.goBackAndRefresh();
            this.successScreen1 = false;
            this.successScreen2 = false;
        }
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
        document.stopObserving('EWS:returnSelected', this.addElementFromCatBindingJP);
    }
});