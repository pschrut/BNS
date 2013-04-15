/** 
* @fileOverview maintainJob.js 
* @description File containing class MaintainJob. 
* Application for Job Catalogue - Edit Job.
*/

/**
*@constructor
*@description Class MaintainJob.
*/
var MaintainJob = Class.create(getContentDisplayer, {
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
    * which have changed.
    */
    run: function($super, args) {
        //adding buttons handler in args
        var buttonsHandlers = $H({
            APP_JOB_SAVE: function() { this.saveScreen('APP_JOB_SAVE'); } .bind(this),
            cancel: function() {
                global.goToPreviousApp({ refresh: false });
            } .bind(this)
        });
        args.set('buttonsHandlers', buttonsHandlers);
        //adding classes in args
        var cssClasses = $H({
            fieldDispField: 'jobCat_emptyWidth',
            fieldDisplayer_textArea: 'jobCat_textAreaWidth',
            fieldDispWidth: 'jobCat_textWidth'
        });
        args.set('cssClasses', cssClasses);
        $super(args);
        document.observe('EWS:returnSelected', this.addElementFromCatBindingJP);
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
        var screenButtons = objectToArray(this.fp.json.EWS.o_screen_buttons.yglui_str_wid_button);
        for (var i = 0; i < screenButtons.length; i++) {
            if (screenButtons[i]['@action'] == action) {
                labelTag = screenButtons[i]['@label_tag'];
                this.okCode = screenButtons[i]['@okcode'];
                this.viewTree = screenButtons[1]['@views'];
                this.appIdTree = screenButtons[1]['@tarap'];
            }
        }
        //save information
        this.saveRequest(action, labelTag, this.json, recInd, screen);
    },
    /*
    * @method linkButtonsTable
    * @desc called to handle buttons in 'table mode' screen
    */
    linkButtonsTable: function() {
        if (!Object.isEmpty(this.virtualHtml.down("[id=" + this.appName + "_SCR_PFMADDCOMP]"))) {
            this.virtualHtml.down("[id=" + this.appName + "_SCR_PFMADDCOMP]").stopObserving('click');
            this.virtualHtml.down("[id=" + this.appName + "_SCR_PFMADDCOMP]").observe('click', function() { this.addCompetencies('CQK_QK', 2); } .bind(this));
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
        this.grArrayMain[cont] = new groupedLayout(newJson, this.virtualHtml.down('div#PFM_containerTable' + cont + '_' + this.appId), isGrouped);
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
            global.open($H({
                app: {
                    appId: this.appIdTree,
                    tabId: this.options.tabId,
                    view: this.viewTree
                },
                refresh: true
            }));
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