/** 
* @fileOverview relatUAdmin.js 
* @description File containing class relatUAdmin. 
* Application for Learning - 'Remove Assignment' screen.
*/

/**
*@constructor
*@description Class relatUAdmin.
*@augments getContentDisplayer 
*/
var relatPAdmin=Class.create(getContentDisplayer,{
    showCancelButton: false,
    saveRequestService: 'SAVE_LEARN',
    getContentService: 'GET_LEARN',
    /*
    *@method initialize
    *@param $super: the superclass: getContentDisplayer
    *@desc instantiates the app
    */
    initialize: function($super,args) {
        $super(args);
    },

    /*
    *@method run
    *@param $super: the superclass: getContentDisplayer
    */
    run: function($super,args) {
        //buttons
        var buttonsHandlers=$H({
        APP_LSOSAVERELATP: function() { this.saveRequest('APP_LSOSAVERELATP','Ok') } .bind(this)
        });
        args.set('buttonsHandlers',buttonsHandlers);
        $super(args);
    },
    getContent: function() {
        var xml = "<EWS>"
                  + "<SERVICE>" + this.getContentService + "</SERVICE>"
                  + "<OBJECT TYPE='" + this.parentType + "'>" + this.objectId + "</OBJECT>"
                  + "<PARAM>"
                    + "<APPID>" + this.tarapId + "</APPID>"
                    + "<WID_SCREEN>*</WID_SCREEN>"
                    + "<PERIOD_BEGDA>" + this.begda + "</PERIOD_BEGDA>"
                    + "<PERIOD_ENDDA>" + this.endda + "</PERIOD_ENDDA>"
                    + "<OKCODE>" + this.okCode + "</OKCODE>"
                  + "</PARAM>"
                + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'processContent' }));
    },
    processContent: function(answer) {
        //draw title
        var label = global.getLabel('pTeach');
        this.updateTitle(label, "application_main_title application_main_title2");
        //draw screen
        this.setContent(answer);
    },    
    saveRequest: function($super,action, labelTag) {
        this.okCode = this.json.EWS.o_screen_buttons.yglui_str_wid_button['@okcode'];
        $super(action, labelTag);
    
    },      
    saveRequestAnswer: function() {
        this.close();
        global.open($H({
            app: {
                appId: 'TM_L_CTE',
                tabId: 'LRN_RES',
                view: 'resCatTeacher'
            },
            refresh: true
        }));
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        this.popUpApplication.close();
        $super();
    }
});

