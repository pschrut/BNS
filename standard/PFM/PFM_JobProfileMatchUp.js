/**
 *@fileOverview PFM_JobProfileMatchUp.js
 *@description It contains a class with functionality for managing job profiles.
 */
 
/**
 *@constructor
 *@description Class with functionality for v.
 *@augments PFM_parent
 */
var PFM_JobProfileMatchUp = Class.create(PFM_parent, 
/** 
*@lends PFM_JobProfileMatchUp_standard
*/
{
    /** 
    * Service used to get the content of the screen
    * @type String
    */  
    getPFMjobProfileService: 'GET_CONTENT2',
    /** 
    * Service used to save the content of the screen
    * @type String
    */     
    saveRequestService: 'SAVE_REQUEST',
    /** 
    * Hash with info about tips, which fieldPanel layout
    * @type Hash
    */       
    GLPanelsHash: new Hash(),
    /** 
    * Array with grouped layout tables in the widgets
    * @type Array
    */     
    grArrayMain: null,
    /** 
    * Array with grouped layout tables in the tips
    * @type Array
    */         
    grArrayTips: null,
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
        this.viedetailsBinding = this.viewDetailsRequest.bindAsEventListener(this);
        this.searchBinding = this.searchTipsRequest.bindAsEventListener(this);
        this.addTipsBinding = this.addTipsRequest.bindAsEventListener(this);
        this.addElementFromCatBindingJP = this.addElementFromCat.bindAsEventListener(this);
      
    },
    /**
     *@param $super The superclass: PFM_parent
     *@param args The selected user id
     *@description when the user clicks on the button 'view details', it open the job profile main screen
     */	
    run: function($super, args) {
        $super();
        //variables reset
        this.json = {};
        this.recordsToSave = $A();
        this.grArrayMain = $A();
        this.grArrayTips = $A();
        this.originalRecordsToSave = $A();
        this.PFM_JobProfileContainer = this.virtualHtml;
        this.virtualHtml.update("<span class='application_main_title'>Performance: Job profile match up</span>");
        this.empId = args.get('empId');
        this.appId = 'PFM_MUP';
        this.prevApp = args.get('previousApp');
        this.prevView = args.get('previousView');          
        //methods to be called
        this.createHtml();
        this.callToGetContent('PFM_MUP');
        //Observers
        document.observe('EWS:returnSelected', this.addElementFromCatBindingJP);
        document.observe('EWS:PFM_rowAction_tips', this.searchBinding);
        document.observe('EWS:PFM_rowAction_addTips', this.addTipsBinding);
        

    },
    /**
     *@param $super The superclass: PFM_parent
     *@description Closes the application
     */	    
    close: function($super) {
        $super();
        document.stopObserving('EWS:returnSelected', this.addElementFromCatBindingJP);
        document.stopObserving('EWS:PFM_rowAction_tips', this.searchBinding);
        document.stopObserving('EWS:PFM_rowAction_addTips', this.addTipsBinding);
 
    },

     /**  
     *@param event The event thrown when user clicks on 'add tips'
     *@description Calls to get_content to retrieve the possible tips
     */	 
    searchTipsRequest: function(event) {
        var args = getArgs(event);
        var tipsObjId = args.get('objid');
        var tipsOtype = args.get('otype');
        var tarap = args.get('tarap');
        var xmlToGetDetails = "<EWS>" +
	                 "<SERVICE>" + this.getPFMjobProfileService + "</SERVICE>" +
	                 "<OBJECT TYPE='" + tipsOtype + "'>" + tipsObjId + "</OBJECT>" +
	                 "<PARAM>" +
	                     "<APPID>" + tarap + "</APPID>" +
	                     "<WID_SCREEN>*</WID_SCREEN>" +
	                 "</PARAM>" +
	             "</EWS>";
        this.makeAJAXrequest($H({ xml: xmlToGetDetails, successMethod: 'searchTips' }));
    },
     /**  
     *@param json Response of the service called
     *@description Process the json and builds a screen with the tips and actions
     */	 
    searchTips: function(json) {
        this.GLPanelsHash = new Hash();
        this.grArrayTips = $A();
        var screensStructure = splitInScreensGL(json);
        for (var a = 0; a < screensStructure.keys().length; a++) {
            //transform to groupedLayout json
            var screen = screensStructure.keys()[a];
            var isGroupedArray = objectToArray(screensStructure.get(screensStructure.keys()[a]).headers.fs_fields.yglui_str_wid_fs_field);
            var isGroupedTips = false;
            for (var b = 0; b < isGroupedArray.length && !isGroupedTips; b++) {
                if (isGroupedArray[b]['@fieldtype'] == 'G')
                    isGroupedTips = true;
            }
            var newJson;
            newJson = this.getContentToGroupedLayout(screensStructure.get(screensStructure.keys()[a]), isGroupedTips, a);

            this.GLPanelsHash.set(screen, {
                body: newJson
            });
        }

        var html = "<div class='PFM_detailsCss'>";
        for (var i = 0; i < this.GLPanelsHash.size(); i++) {
            html += "<div id='PFM_GL_containerDetails_" + i + "' class='PFM_detailsBodyCss'></div>";
        }
        html += "<div id='PFM_hideDiv' class='PFM_hideDivCss'></div></div>";
        var _this = this;
        this.PFM_GL_infoPopUpDetails = new infoPopUp({                
            htmlContent: html,
            width: 600,
            closeButton :   $H( {                        
                'callBack':     function() {
                    _this.PFM_GL_infoPopUpDetails.close();
                    delete _this.PFM_GL_infoPopUpDetails;                    
                }
            })                            
        });
        this.PFM_GL_infoPopUpDetails.create();         
        this.PFM_GL_infoPopUpDetails.obInfoPopUpContainer.down("div#PFM_hideDiv").hide();
        if (!Object.isEmpty(json.EWS.o_field_values)) {
            for (var i = 0; i < this.GLPanelsHash.size(); i++) {
                var treatedJson = this.GLPanelsHash.get(this.GLPanelsHash.keys()[i]).body;
                this.grArrayTips.push(new groupedLayout(treatedJson, this.PFM_GL_infoPopUpDetails.obInfoPopUpContainer.down("div#PFM_GL_containerDetails_" + i + ""), isGroupedTips));
                this.grArrayTips[i].buildGroupLayout();

            }
        }
        else {
            this.PFM_GL_infoPopUpDetails.obInfoPopUpContainer.down("div#PFM_GL_containerDetails_" + 0 + "").update("<div id='PFM_noTips' class='PFM_noTipsCss'>" + global.getLabel('noTips') + "</div>");
        }
    },
     /**  
     *@param event Event launched when clicking on 'add to competency'
     *@description Calls to getcontent to retrieve the structure of an empty competency
     */	
    addTipsRequest: function(event) {
        var args = getArgs(event);
        var tarap = args.get('tarap');
        this.tipsObjId = args.get('objid');
        this.tipsOtype = args.get('otype');
        this.tipsText = args.get('text');
        var xml = "<EWS>" +
                    "<SERVICE>" + this.getPFMjobProfileService + "</SERVICE>" +
                    "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>" +
                    "<PARAM>" +
                        "<APPID>" + tarap + "</APPID>" +
                        "<WID_SCREEN></WID_SCREEN>" +
                        "<OKCODE>NEW</OKCODE>" +
                    "</PARAM>" +
                "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'addTips' }));
    },
     /**  
     *@param jsonDev Response of the service called
     *@description Process the json and builds a screen with the emtpy competency
     */
    addTips: function(jsonDev) {
        //overwrite the objid and otype in the default json
        var screen = objectToArray(jsonDev.EWS.o_field_values.yglui_str_wid_record)[0]['@screen'];
        if(! Object.isEmpty(jsonDev.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen))
            jsonDev.EWS.o_widget_screens.yglui_str_wid_screen = jsonDev.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen;
        var screens = objectToArray(jsonDev.EWS.o_widget_screens.yglui_str_wid_screen);
        var selectedScreen = null;
        for (var q = 0; q < screens.length; q++){
            if(screens[q]['@screen'] == screen){
                selectedScreen = screens[q];
            }
        }
        jsonDev.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen = selectedScreen;
        var values = jsonDev.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        for (var i = 0; i < values.length; i++) {
            if (values[i]['@fieldid'] == 'OBJID') {
                values[i]['@value'] = this.tipsObjId;
            }
            else if (values[i]['@fieldid'] == 'OTYPE') {
                values[i]['@value'] = this.tipsOtype;
            }
        }
        var jsonSave = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div'
        };
        var FPObject = new getContentModule({ 
            mode: 'edit', 
            json: jsonDev, 
            appId: 'PFM_DEV', 
            showCancelButton:false, 
            showButtons: $H({
                edit : false,
                display: false,
                create: false
            })
        });
        var auxSave = {
            label: global.getLabel('save'),
            handler:  this.testTipsAndCallSave.bind(this,"PFM_GL_infoPopUpDetails",FPObject,jsonDev),
            type: 'button',
            idButton: 'application_PFM_save',
            className: 'moduleInfoPopUp_stdButton',
            standardButton: true
        };
        jsonSave.elements.push(auxSave);
        this.ButtonSave = new megaButtonDisplayer(jsonSave);
        if(Object.isEmpty(this.PFM_GL_infoPopUpDetails.obInfoPopUpContainer.down('div.moduleInfoPopUp_textMessagePart_noIcon').down('div#application_PFM_save')))
            this.PFM_GL_infoPopUpDetails.obInfoPopUpContainer.down('div.moduleInfoPopUp_textMessagePart_noIcon').insert({ bottom: this.ButtonSave.getButtons() });        
        this.PFM_GL_infoPopUpDetails.obInfoPopUpContainer.down("div#PFM_hideDiv").update(FPObject.getHtml());
        this.PFM_GL_infoPopUpDetails.obInfoPopUpContainer.down("div#PFM_hideDiv").insert({ top: "<div id='PFM_tips_title' class='PFM_titleTips'>Adding Training:&nbsp;" + this.tipsText + "</div>" });              
        this.PFM_GL_infoPopUpDetails.obInfoPopUpContainer.down("div#PFM_hideDiv").show();
    },
    /**
    * @description When closing / saving info in an infoPopUp, checks if the fieldPanel is ok. If not, shows a message and does not close the infoPopUp
    * @param infoPopUp {String} The name or identificator of the infoPopUp
    * @param FPObject {fieldPanel} The fieldPanel we want to check
    */    
    testTipsAndCallSave: function(infoPopUp,FPObject,jsonDev){
        var accessedObject;
        switch(infoPopUp){
            case "PFM_GL_infoPopUpDetails":
                accessedObject = this.PFM_GL_infoPopUpDetails;
                break;
        }  
        var validation = FPObject.validateForm();              
        if(validation.correctForm){
            this.saveRequestTips(jsonDev);  
        }       
    },    
     /**  
     *@param json Json with the added competency
     *@description Builds an xml_in to save the competency added
     */
    saveRequestTips: function(json) {
        var values = json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        var XMLToTips = "<EWS>" +
                        "<SERVICE>" + this.saveRequestService + "</SERVICE>" +
                        "<OBJECT>" +
                            "<TYPE>P</TYPE>" +
                            "<TEXT>" + this.empId + "</TEXT>" +
                        "</OBJECT>" +
                        "<PARAM>" +
                            "<APPID>PFM_DEV</APPID>" +
                                "<RECORDS>" +
                                    "<YGLUI_STR_WID_RECORD>" +
                                        "<CONTENTS>" +
                                            "<YGLUI_STR_WID_CONTENT>" +
                                                "<FIELDS>";
        for (var i = 0; i < values.length; i++) {
            XMLToTips += "<yglui_str_wid_field fieldid='" + values[i]['@fieldid'] + "' value='" + values[i]['@value'] + "'/>";
        }
        XMLToTips += "</FIELDS>" +
                                            "<buttons>" +
                                        "<yglui_str_wid_button action='REC_PFMTIPADD' okcode='INS' />" +
                                    "</buttons>" +
                                "<TCONTENTS/>" +
                            "</YGLUI_STR_WID_CONTENT>" +
                        "</CONTENTS>" +
                    "</YGLUI_STR_WID_RECORD>" +
                "</RECORDS>" +
                "<BUTTON action='' busid='' disma='' label_tag='' okcode='INS' screen='' status='' tarap='' tarty='' type='' />" +
            "</PARAM>" +
        "</EWS>";

        this.makeAJAXrequest($H({ xml: XMLToTips, successMethod: 'saveRequestAnswer' }));

    },
     /**  
     *@param json Json received from the service
     *@description Show the result of the tip saving
     */
    saveRequestAnswer: function(json) {
        this.PFM_GL_infoPopUpDetails.close();
        delete this.PFM_GL_infoPopUpDetails;  
        var html = "<div id='PFM_showStatus' class='PFM_statusCss'>" + global.getLabel('trainingAdd') + "</div>";
        var PFM_GL_showStatus = new infoPopUp({                
            htmlContent: html,
            width: 350, 
            indicatorIcon: 'confirmation',            
            closeButton :   $H( {                        
                'callBack':     function() {
                    PFM_GL_showStatus.close();
                    delete PFM_GL_showStatus;                    
                }
            })                            
        });
        PFM_GL_showStatus.create();           
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
                    "<SERVICE>" + this.getPFMjobProfileService + "</SERVICE>" +
                    "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>" +
                    "<PARAM>" +
                        "<APPID>PFM_MUP</APPID>" +
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
            //if it's not a competency group
            if(pair.value.childType != 'QK'){
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
                if(Object.isEmpty(this.json.EWS.o_field_values)){                        
                    var recordPath = { yglui_str_wid_record: [] }
                    this.json.EWS.o_field_values = recordPath;
                }else
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
            }
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
        this.grArrayMain[cont] = new groupedLayout(newJson, this.virtualHtml.down('div#PFM_containerTable' + cont + '_' + this.appId),isGrouped);
        this.grArrayMain[cont].buildGroupLayout();


    }

});