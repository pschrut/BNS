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
var relatHAsign=Class.create(getContentDisplayer,{
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
            APP_LSOSAVERELATH: function() { this.action='APP_LSOSAVERELATH',this.okContent(); } .bind(this)
        });
        args.set('buttonsHandlers',buttonsHandlers);
        $super(args);
    },
    okContent: function() {
        this.jsonAssign=deepCopy(this.fp.json);
        this.getContent();
    },
    getContent: function() {
        var xml="<EWS>"
                  +"<SERVICE>"+this.getContentService+"</SERVICE>"
                  +"<OBJECT TYPE='"+this.parentType+"'>"+this.objectId+"</OBJECT>"
                  +"<PARAM>"
                    +"<APPID>"+this.tarapId+"</APPID>"
                    +"<WID_SCREEN>*</WID_SCREEN>"
                    +"<PERIOD_BEGDA>"+this.begda+"</PERIOD_BEGDA>"
                    +"<PERIOD_ENDDA>"+this.endda+"</PERIOD_ENDDA>"
                    +"<OKCODE>"+this.okCode+"</OKCODE>"
                  +"</PARAM>"
                +"</EWS>";
        this.makeAJAXrequest($H({ xml: xml,successMethod: 'processContent' }));
    },
    processContent: function(answer) {
        if(this.okCode=='NEW') {
            //get json for new assign
            this.okCode = '';
            //draw title
            var label = global.getLabel('reassignH');
            this.updateTitle(label, "application_main_title application_main_title2");            
            //draw screen
            this.setContent(answer);
        } else {
            //get json for delete assign
            this.jsonDelete=deepCopy(answer);
            //harcoding okCode
            this.okCode='DEL';
            var labelTag="Ok";
            //save
            this.saveRequest(this.action,labelTag,this.jsonDelete);
        }
    },
    /*
    * @method saveRequestAnswer
    * @desc answer from SAP when a saving request has been done - remove assign
    */
    saveRequestAnswer: function() {
        if(this.okCode=='DEL') {
            this.okCode="NEW";
            this.saveRequest(this.action,'Ok',this.jsonAssign);
        } else {
            this.close();
            global.open($H({
                app: {
                    appId: 'TM_L_CTE',
                    tabId: 'LRN_RES',
                    view: 'resCatTeacher'
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
        this.popUpApplication.close();
        $super();
    }
});