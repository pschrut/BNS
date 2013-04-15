/** 
* @fileOverview createOrgUnit.js 
* @description File containing class createOrgUnit. 
* Application for Maintain in OM.
*/

/**
*@constructor
*@description Class createOrgUnit.
*@augments getContentDisplayer 
*/
var CreateOrgUnit = Class.create(getContentDisplayer, {
    showCancelButton: false,
    saveRequestService: 'SAVE_OS',
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
        //get the label tag asociated 
        var screenButtons = this.fp.json.EWS.o_screen_buttons.yglui_str_wid_button;
        for (var i = 0; i < screenButtons.size(); i++) {
            if (screenButtons[i]['@action'] == action) {
                labelTag = screenButtons[i]['@label_tag'];
            }
        }
        //save information
        this.saveRequest(action, labelTag);
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();

    }
});