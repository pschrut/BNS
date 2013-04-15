/** 
* @fileOverview maintainJobFam.js 
* @description File containing class MaintainJobFam. 
* Application for Job Catalogue - Edit Job Family.
*/

/**
*@constructor
*@description Class MaintainJobFam.
*/
var MaintainJobFam = Class.create(getContentDisplayer, {
    /*
    *@method initialize
    *@param $super: the superclass: GenericCatalog
    *@desc instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
    },

    /*
    *@method run
    *@param $super: the superclass: GenericCatalog
    * which have changed.
    */
    run: function($super, args) {
        //adding buttons handler in args
        var buttonsHandlers = $H({
            APP_JOB_FAM_SAVE: function() { this.saveScreen('APP_JOB_FAM_SAVE'); } .bind(this),
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