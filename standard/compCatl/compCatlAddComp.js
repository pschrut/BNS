var COMP_CATL_AC = Class.create(getContentDisplayer, {

    cancelButtonCallbackFunction: function() {  global.goToPreviousApp() } ,
    saveRequestService: 'SAVE_COMP',
    /*
    *@method initialize
    *@param $super
    *@desc instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
        this.checkMandatoryBinding = this.checkMandatory.bindAsEventListener(this);
    },

    /*
    *@method run
    *@param $super
    */
    run: function($super, args) {
    
        //adding buttons handler in args
        var buttonsHandlers = $H({
            APP_CQK_SAVE: function() { this.saveRequest('APP_CQK_SAVE'); } .bind(this),
            cancel: function() {
                global.goToPreviousApp({ refresh: false });
            } .bind(this),
            paiEvent: this.paiEventRequest.bind(this)
        });
        args.set('buttonsHandlers', buttonsHandlers);
        this.cssClasses = $H({fieldDisplayer_textArea: 'PFM_compCatl_fieldDisplayer_textArea'});
        args.set('cssClasses', this.cssClasses);          
        $super(args);
    },
  
    /*
    * @method setContentForEmptyScreens
    * @desc it receives the answer from the getContent service, from SAP, and builds the screens with empty values
    */
    checkMandatory: function(event) {
        var flag = getArgs(event);
        if (flag == 0) {
            this.ButtonGenericApp2.disable("COMP_CATL_AC_APP_CQK_SAVE");
        }
        else {
            this.ButtonGenericApp2.enable("COMP_CATL_AC_APP_CQK_SAVE");
        }
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
    },
    /*
    * @args Information related with the PAI field fired
    * @desc called when a PAI field was changed. We take the current screen and set it as selected so when reloading the
    * getContentModule, we stay in the screen where the PAI was fired.
    */    
    paiEventRequest: function($super,args) {
        var arguments = getArgs(args);
        var actualScreen = getArgs(args).screen;
        var screens = objectToArray(this.json.EWS.o_widget_screens.yglui_str_wid_screen);
        for(var i=0;i<screens.length;i++){
            if(screens[i]['@screen'] == actualScreen)
                screens[i]['@selected'] = 'X';
            else
                screens[i]['@selected'] = '';
        }
        $super(args);
    }

});