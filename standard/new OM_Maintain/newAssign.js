﻿/** 
* @fileOverview newAssign.js 
* @description File containing class newAssign. 
* Application for Maintain and Display in OM - Creating assignment from 'Change Assign' screen.
*/

/**
*@constructor
*@description Class assign_standard.
*@augments getContentDisplayer 
*/
var NewAssign = Class.create(getContentDisplayer, {
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
        var buttonsHandlers = $H({
            APP_OM_CANCEL: function() {
                this.fp.destroy();
                this.cancelButton('APP_OM_CANCEL');
            } .bind(this),
            APP_OM_SAVE: function() { this.saveScreen('APP_OM_SAVE'); } .bind(this),
            paiEvent: this.paiEventRequest.bind(this)
        });
        args.set('buttonsHandlers', buttonsHandlers);
        //parameters
        this.objectId = getArgs(args).get('objectId');
        this.objectIdRequest = this.objectId;
        this.parentType = getArgs(args).get('parentType');
        this.oType = getArgs(args).get('oType');
        $super(args);
    },
    /*
    * @method cancelButton
    * @desc called to come back to the previous app
    */
    cancelButton: function(action) {
        //go to previous app
        global.goToPreviousApp({
            refresh: true,
            parentType: this.parentType,
            oType: this.oType,
            objectId: this.objectId,
            objectIdRequest: this.objectId
        });
    },
    /*
    * @method saveScreen
    * @desc called to save the information of the screen after clicking button
    */
    saveScreen: function(action) {
        var labelTag;
        //get the label tag asociated
        var screenButtons = objectToArray(this.fp.json.EWS.o_screen_buttons.yglui_str_wid_button);
        for (var i = 0; i < screenButtons.length; i++) {
            if (screenButtons[i]['@action'] == action) {
                labelTag = screenButtons[i]['@label_tag'];
                this.okCode = screenButtons[i]['@okcode'];
                this.successAppId = screenButtons[i]['@tarap'];
                this.successView = screenButtons[i]['@views'];
            }
        }
        //save information
        this.saveRequest(action, labelTag, this.json);
    },
    /*
    * @method saveRequestAnswer
    * @desc answer from SAP when a saving request has been done (method from getContentDisplayer has been overwritten)
    */
    saveRequestAnswer: function(answer) {
        global.open($H({
            app: {
                appId: this.successAppId,
                tabId: this.options.tabId,
                view: this.successView
            },
            refresh: true
        }));
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();

    }
});

