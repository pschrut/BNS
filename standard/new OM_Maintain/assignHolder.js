/** 
* @fileOverview assignHolder.js 
* @description File containing class assignHolder. 
* Application for Maintain and Display in OM - 'Assign Holder' screen.
*/

/**
*@constructor
*@description Class assignHolder.
*@augments getContentDisplayer 
*/
var AssignHolder = Class.create(getContentDisplayer, {
    showCancelButton: false,
    saveRequestService: 'SAVE_ASSIGNM',
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
                global.goToPreviousApp();
            } .bind(this),
            APP_OM_SAVE: function() { this.saveScreen('APP_OM_SAVE'); } .bind(this),
            paiEvent: this.paiEventRequest.bind(this)
        });
        args.set('buttonsHandlers', buttonsHandlers);
        //parameters
        this.objectId = getArgs(args).get('objectId');
        this.objectIdRequest = this.objectId;
        $super(args);
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
            }
        }
        //save information
        this.saveRequest(action, labelTag, this.json);
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();

    }
});

