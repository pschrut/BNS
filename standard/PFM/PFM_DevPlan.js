/**
 *@fileOverview PFM_DevPlan.js
 *@description It contains a class with functionality to manage the development plan.
 */
/**
 *@constructor
 *@description Class PFM_DevPlan
 *@augments PFM_parent
 */
var PFM_DevPlan = Class.create(PFM_parent, 
/** 
*@lends PFM_DevPlan
*/
{
    /** 
    * Service used to get the content of the screen
    * @type String
    */  
    getPFM_DevPlanService: 'GET_CONTENT2',
    /** 
    * Array with grouped layout tables in the widgets
    * @type Array
    */     
    grArrayMain: null,
    /** 
    * Array with grouped layout tables in the details
    * @type Array
    */      
    grArrayDetails: null,
   
    

    /**
     *@param $super The superclass (PFM_parent)
     *@description Instantiates the app
     */  
    initialize: function($super, args) {
        $super(args);
        this.callToHaveNewElementBindingDP = this.callToHaveNewElement.bindAsEventListener(this);

    },
    /**
     *@param $super The superclass: PFM_parent
     *@param args The selected user id
     *@description when the user clicks on the button 'view details', it open the job profile main screen
     */	    
    run: function($super, args) {
        $super(args);
        //variables reset
        this.empId = args.get('empId');
        this.appId = 'PFM_DEV';
        this.grArrayMain = $A();
        this.grArrayDetails = $A();
        this.recordsToSave = $A();
        this.originalRecordsToSave = $A();
        this.recordsToAddInJson = $H();       
        this.falseKeys = 0;   
        //methods to be called     
        this.createHtml();
        this.callToGetContent('PFM_DEV');
        this.prevApp = args.get('previousApp');
        this.prevView = args.get('previousView');          
        //Observers
        document.observe('EWS:PFM_contentAddElementWithoutCat', this.callToHaveNewElementBindingDP);

    },
    /**
     *@param $super The superclass: PFM_parent
     *@description Closes the application
     */	    
    close: function($super) {
        $super();
        document.stopObserving('EWS:PFM_contentAddElementWithoutCat', this.callToHaveNewElementBindingDP);
    },
    /**
     *@param event The event launched when clicking on 'add', and the element is not linked to a catalogue
     *@description Calls to get content to retrieve the default element structure
     */	
    callToHaveNewElement: function(event) {
        var cont = getArgs(event).get('cont');
        var Inscreen = getArgs(event).get('InScreen');
        var xml = "<EWS>" +
                    "<SERVICE>" + this.getPFM_DevPlanService + "</SERVICE>" +
                    "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>" +
                    "<PARAM>" +
                        "<APPID>" + this.appId + "</APPID>" +
                        "<WID_SCREEN>" + Inscreen + "</WID_SCREEN>" +
                        "<OKCODE>NEW</OKCODE>" +
                    "</PARAM>" +
                "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'addElement', ajaxID: Inscreen + "_" + cont }));
    },
    /**
     *@param jsonElement Json with the default element structure
     *@param options Data needed to perform the addition, such as the widget counter  
     *@description Calls to get content to retrieve the default element structure
     */	
    addElement: function(jsonElement, options) {
        this.reloadFlag = false;
        //set the observer so we know when the user actually modifies something
        document.observe('EWS:PFM_popUp_fieldModified', this.setReloadBinding);        
        var json = deepCopy(jsonElement);
        this.cont = parseInt(options.split("_")[1], 10);
        this.insScreen = options.split("_")[0];
        var screens = objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen);
        var selectedScreen = null;
        for (var q = 0; q < screens.length; q++){
            if(screens[q]['@screen'] == this.insScreen){
                selectedScreen = screens[q];
            }
        }
        json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen = selectedScreen;
        var FPObject = new getContentModule({
            appId: 'PFM_DEV',
            mode: 'create',
            json: json,
            noResultsHtml: global.getLabel('noResults'),
            fieldDisplayerModified: 'EWS:PFM_popUp_fieldModified',
            showCancelButton:false, 
            showButtons: $H({
                edit : false,
                display: false,
                create: false
            })            
        });
        var _this = this;
        this.editWindow = new infoPopUp({                
            htmlContent: "<div class='PFM_DevPlan_editPopUp_mainDiv'></div>",
            width: 600,
            events: $H({ onClose: 'EWS:PFM_doc_popUpClosed' }),
            closeButton :   $H( {                        
                'callBack': _this.cancelAction.bind(this)
            })                            
        });
        _this.editWindow.create();        
        var auxDiv = _this.editWindow.obInfoPopUpContainer.down('[class=PFM_DevPlan_editPopUp_mainDiv]');
        auxDiv.insert(FPObject.getHtml());
        var errorMessageDiv = new Element ('div', {
            'class': 'PFM_editWindow_errorMessage'
        });    
        auxDiv.insert(errorMessageDiv);         
        //cancel button
        var cancenlButtonJson = {
            elements:[],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'          
        };         
        var aux =   {
            idButton: 'saveDraftAddButton',
            label: global.getLabel('saveDraft'),
            handlerContext: null,
            handler: this.testFormAndDoAction.bind(this,"editWindow",FPObject),
            className: 'moduleInfoPopUp_stdButton',
            type: 'button',
			eventOrHandler: false   
        }; 
        cancenlButtonJson.elements.push(aux);
        var cancelButtonObj=new megaButtonDisplayer(cancenlButtonJson);  
        auxDiv.insert(cancelButtonObj.getButtons());          
        //end cancel button        
        var thereAreElementButtons = this.checkJson(json, ['EWS', 'o_field_values', 'yglui_str_wid_record', 'contents', 'yglui_str_wid_content', 'buttons', 'yglui_str_wid_button']);
        if (thereAreElementButtons.answer) {
            var thereAreScreenButtons = this.checkJson(json, ['EWS', 'o_screen_buttons', 'yglui_str_wid_button']);
            if (thereAreScreenButtons.answer) {
                objectToArray(thereAreScreenButtons.obj).each(function(button) {
                    if (button['@screen'] == this.insScreen) {
                        thereAreElementButtons.obj = button;
                        this.clickedAddAction = thereAreElementButtons.obj;
                        return;
                    }
                } .bind(this));
            }
        }
        var checkOk = this.checkJson(json, ['EWS', 'o_field_values', 'yglui_str_wid_record']);
        if (checkOk.answer) {
            this.originalRecordsToSave = this.recordsToSave.clone();
            this.recordsToSave.push(json.EWS.o_field_values.yglui_str_wid_record);  
            this.recordsToAddInJson.set(this.recordsToSave.length-1,json.EWS.o_field_values.yglui_str_wid_record);     
        }
        document.observe('EWS:PFM_popUp_fieldModified', this.setReloadBinding);
    } 
});