/**
 *@fileOverview Delete_Delimit.js
 *@description It contains a class with functionality for translate types and subtypes of an object.
 */
/**
 *@constructor
 *@description Class with functionality for translate types and subtypes of an object.
 *@augments Application
 */
var OM_DeleteDelimit_standard = Class.create(Application, 
/** 
*@lends Delete_Delimit 
*/
{
    /*** SERVICES ***/
    /**
     *@type String
     *@description Service used to delete or delimit objects.
     */
    getDeleteDelimitService : "MAINT_OBJECT",
    getDeleteDelimitServiceRelation: "MAINT_ASSIGN",
    
    /*** VARIABLES ***/
    /**
     *@type datePicker
     *@description datePicker object to select the date of the range of delimitation
     */
    dPDeleteDelimiteDate:null,
    /**
     *@type String
     *@description Format to parse the date of today
     */
    dateFormat:null,
    /**
     *@type Date
     *@description Date of today
     */
    date:null,
    /**
     *@type Date
     *@description Date of today with '-'
     */
    parsedDate:null,
    /**
     *@type String
     *@description L or D, that to make a deletion or a delimitation.
     */
    action:null,
    /**
     *@type String
     *@description S, O, or P, for to know if the object to delete/delimit is a position, an Org. unit or a person.
     */
    objectType:null,
    /**
     *@type Number
     *@description Id of the object to delete/ delimit.
     */
    objectToDeleteDelimit:null,
    /**
     * Container of title of the pop-up
     * @type DOM
     */ 
    DeleteDelimitTitleDiv:null,
    /**
     * Container of all html div of delete/delimit
     * @type DOM
     */ 
    DeleteDelimitDiv:null,
    /**
     * Container that is image of the div where we insert the main div
     * @type DOM
     */ 
    DeleteDelimitContainer:null,
    /**
     * Container of datePicker
     * @type DOM
     */ 
    datePickerDiv:null,
    /**
     * Container of buttons to delete / delimit, to approve or reject
     * @type DOM
     */ 
    DeleteDelimitButtonsDiv:null,
      /**
     * @type Object
     * @description button 'Yes'
     */ 
    YesButton:null,
     /**
     * @type Object
     * @description button 'No'
     */ 
    NoButton:null,
    
    /*
     *@method initialize(constructor)
     *@desc here are attached the convenient events to the proper handlers
    */
    initialize: function($super,args) {
        $super(args);
    },
    /**
     *@description Starts Delete_Delimit
     */ 
    run: function($super,args) {
        $super();   
        this.DeleteDelimitContainer = this.virtualHtml;  
        //create the div for the screen delete /delimit
        this.DeleteDelimitDiv = new Element('div', {
            'id': 'OM_DeleteDelimitDiv',
            'class': 'OM_deleteDelimitMainDiv'          
        });
        //insert the html structure
        this.DeleteDelimitContainer.insert(this.DeleteDelimitDiv);        
        this.action=args.get('action');
        this.objectType=args.get('objectType');
        this.objectToDeleteDelimit=args.get('node');
        //read arguments needed    
        this.applicationToopen=  args.get('appToOpen');
        this.hashElementsDeleteDelimit= args.get('hash')
        if(this.applicationToopen=="OM_DeleteDelimitObject"){
            if(this.action=='D'){ 
                this.dateFormat = "yyyyMMdd"; 
                this.begDate =this.hashElementsDeleteDelimit;
                this.endDate='9999-12-31'; 
            }
            else {
                this.begDate=this.hashElementsDeleteDelimit.split(',')[0];
                this.endDate=this.hashElementsDeleteDelimit.split(',')[1];
            }
        } 
        else if((this.applicationToopen=="OM_ManageHolderAssign" || this.applicationToopen=="OM_PosAssign") && this.hashElementsDeleteDelimit.size()!=0){
            this.begDate=this.hashElementsDeleteDelimit.get(0).begDate;
            this.endDate=this.hashElementsDeleteDelimit.get(0).endDate;
        }
        //we create the first DOM
        if(this.firstRun)
            this.createHtml();
        //if is not the first time, we reload the datePicker with the date of today and reset the range for the selected object 
        else{
            this.dPDeleteDelimiteDate.reloadDefaultDate();
            this.dPDeleteDelimiteDate.updateRange(this.endDate.gsub('-',''), this.begDate.gsub('-',''));
            //we show the screen to delete or delimit
            this.showDeleteDelimitScreen(); 
        }
    },
    /**
     *@description Builds the initial HTML code
     */
    createHtml: function(){ 
        //div that is going to contain the title
        this.DeleteDelimitTitleDiv = new Element('div', {
            'id': 'OM_DeleteDelimitTitleDiv',
            'class': 'OM_DeleteDelimittitle application_text_bolder'          
        });
        this.DeleteDelimitDiv.insert(this.DeleteDelimitTitleDiv);
        //datePicker Div container
        this.datePickerDiv=new Element('div', {
            'id': 'DeleteDelimit_dPDiv',
            'class': 'OM_datePickerDiv'
        });
        this.DeleteDelimitDiv.insert(this.datePickerDiv);
       // Date picker initialization
        var date = Date.today().toString('yyyyMMdd');
        this.dPDeleteDelimiteDate = new DatePicker('DeleteDelimit_dPDiv', {
            defaultDate: date,
            fromDate: this.begDate.gsub('-',''),
            toDate: this.endDate.gsub('-',''),
            draggable: true,
            manualDateInsertion: false,
            events: $H({dateSelected: 'EWS:datepicker_CorrectDate'})
        });
        //create the div for the BUTTONS in the delete / delimit screen
        this.DeleteDelimitButtonsDiv = new Element('div', {
            'id': 'DeleteDelimit_Buttons',
            'class': 'OM_deleteDelimit_ButtonsDiv'          
        });
        //insert the html structure in the first screen div
        this.DeleteDelimitDiv.insert(this.DeleteDelimitButtonsDiv); 
        var json = {
                    elements:[]
                };
        var auxYes =   {
                label: 'Yes',
                handlerContext: null,
                handler: this.yesButtonDeleteDelimit.bind(this),
                type: 'button',
                standardButton:true
              };                 
        json.elements.push(auxYes);  
        var auxNo =   {
                label: 'No',
                handlerContext: null,
                handler: this.cancelButtonDeleteDelimit.bind(this),
                type: 'button',
                standardButton:true
              };                 
        json.elements.push(auxNo);   
        var ButtonDeleteDelimit=new megaButtonDisplayer(json);  
        this.DeleteDelimitButtonsDiv.update(ButtonDeleteDelimit.getButtons()); 
        //we call to show the delete/delimit screen
        this.showDeleteDelimitScreen();
    },
    /*
    * @method showDeleteDelimitScreen
    * @desc we test the action to hide or not the datePicker and to show in the question delete or delimit
    */ 
    showDeleteDelimitScreen: function(){
        //we save the action
        if(this.action=='D' && (this.applicationToopen=="OM_ManageHolderAssign" || this.applicationToopen=="OM_PosAssign")){ 
             //we update the title
            this.DeleteDelimitTitleDiv.update(
                "<span>"+global.getLabel('deleteRel')+"</span>"
            );
        }
        else if(this.action=='L' && (this.applicationToopen=="OM_ManageHolderAssign" || this.applicationToopen=="OM_PosAssign")){
             //we update the title
            this.DeleteDelimitTitleDiv.update(
                "<span>"+global.getLabel('delimitRel')+"</span>"
            );
        }
        else if(this.action=='D' && this.applicationToopen=="OM_DeleteDelimitObject"){
             //we update the title
            this.DeleteDelimitTitleDiv.update(
                "<span>"+global.getLabel('deleteObj')+"</span>"
            );
        }
        else if(this.action=='L' && this.applicationToopen=="OM_DeleteDelimitObject"){
             //we update the title
            this.DeleteDelimitTitleDiv.update(
                "<span>"+global.getLabel('delimitObj')+"</span>"
            );
        }
        //depending on the action we hide or not the datePicker
        if(this.action=='D')
            this.datePickerDiv.hide();  
        else if(this.action=='L')
            this.datePickerDiv.show(); 
    },
    /*
    * @method cancelButtonDeleteDelimit
    * @desc redirect the flow to first screen
    */ 
    cancelButtonDeleteDelimit:function(){
       //we remove and close the pop-up screen
       $('application_popUpMode_closeDiv_OM_DeleteDelimit').remove();
       this.virtualHtml.removeClassName('application_over_semiTransparent');
       this.close();
       Framework_stb.hideSemitransparent(); 
       //document.fire('EWS:openApplication',$H({app:this.applicationToopen}));                   
    },
    /*
    * @method yesButtonDeleteDelimit
    * @desc redirect the flow to OM_Maintain application
    */ 
    yesButtonDeleteDelimit:function(){ 
        if(this.applicationToopen=="OM_ManageHolderAssign" || this.applicationToopen=="OM_PosAssign")
            this.yesButtonDeleteDelimitRelation();
        else    
            this.yesButtonDeleteDelimitObject();
        
    },
    yesButtonDeleteDelimitRelation:function(){
        //depending on the action selected, the xmlIn is different
        
        //create the xml_in
        var xmlSendInfo = "<EWS>"
                            +"<SERVICE>"+this.getDeleteDelimitServiceRelation+"</SERVICE>"
                            +"<OBJECT TYPE='"+this.objectType+"'>"+this.objectToDeleteDelimit+"</OBJECT>"
                            +"<DEL></DEL>"
                            +"<PARAM>"
                                +"<O_ACTION>"+this.action+"</O_ACTION>"
                                +"<O_RELATIONS>";
                                
        if(this.action=='D'){                        
            this.hashElementsDeleteDelimit.each(function(pair){
                var valueInHash=pair.value;
                xmlSendInfo +=	"<YGLUI_TAB_RELATIONS rsign='"+valueInHash.rsign+"' relat='"+valueInHash.relat+"' begda='"+valueInHash.begDate+"' endda='"+valueInHash.endDate+"' sclas='"+valueInHash.sclas+"' sobid='"+valueInHash.idToAssign+"'/>";        
            });
            
        }
        else if(this.action=='L'){
            var _this=this;
            this.hashElementsDeleteDelimit.each(function(pair){
                var valueInHash=pair.value;
                xmlSendInfo += "<YGLUI_TAB_RELATIONS rsign='"+valueInHash.rsign+"' relat='"+valueInHash.relat+"' begda_old='"+valueInHash.begDate+"' endda_old='"+valueInHash.endDate+"' endda='"+_this.dPDeleteDelimiteDate.actualDate.toString('yyyy-MM-dd')+"' sclas='"+valueInHash.sclas+"' sobid='"+valueInHash.idToAssign+"' />";	 
            });
        }
        xmlSendInfo += "</O_RELATIONS>"
                                +"</PARAM>"
                            +"</EWS>";
        //call the service                    
        this.makeAJAXrequest($H({xml:xmlSendInfo, successMethod:"successDeleteDelimitAccion"}));    
        //we remove and close the pop-up screen
        $('application_popUpMode_closeDiv_OM_DeleteDelimit').remove();
        this.virtualHtml.removeClassName('application_over_semiTransparent');
        this.close();
        Framework_stb.hideSemitransparent(); 
        
    },
    yesButtonDeleteDelimitObject:function(){
        //depending on the action selected, the xmlIn is different
        if(this.action=='D'){
            //create the xml_in
            var xmlSendInfo = "<EWS>"
                                +"<SERVICE>"+this.getDeleteDelimitService+"</SERVICE>"
                                +"<OBJECT TYPE='"+this.objectType+"'>"+this.objectToDeleteDelimit+"</OBJECT>"
                                +"<DEL></DEL>"
                                +"<PARAM>"
                                    +"<O_ACTION>"+this.action+"</O_ACTION>"
                                +"</PARAM>"
                            +"</EWS>";	        
        }
        else if(this.action=='L'){
            var xmlSendInfo = "<EWS>"
                                +"<SERVICE>"+this.getDeleteDelimitService+"</SERVICE>"
                                +"<OBJECT TYPE='"+this.objectType+"'>"+this.objectToDeleteDelimit+"</OBJECT>"
                                +"<DEL></DEL>"
                                +"<PARAM>"
                                    +"<O_ACTION>"+this.action+"</O_ACTION>"
                                    +"<O_BEGDA>"+this.begDate+"</O_BEGDA>"
                                    +"<O_ENDDA>"+this.dPDeleteDelimiteDate.actualDate.toString('yyyy-MM-dd')+"</O_ENDDA>"
                                +"</PARAM>"
                            +"</EWS>";	 
        }
        //call the service                    
        this.makeAJAXrequest($H({xml:xmlSendInfo, successMethod:"successDeleteDelimitAccion"}));    
        //we remove and close the pop-up screen
        $('application_popUpMode_closeDiv_OM_DeleteDelimit').remove();
        this.virtualHtml.removeClassName('application_over_semiTransparent');
        this.close();
        Framework_stb.hideSemitransparent(); 
    },
    /*
    * @method successDeleteDelimitAccion
    * @desc redirect the flow to OM_Maintain application
    */ 
    successDeleteDelimitAccion: function(){
        if (this.applicationToopen == "OM_PosAssign") {
            document.fire('EWS:openApplication',$H({app:'OM_PosAssign', node: this.objectToDeleteDelimit}));
        }else if(this.applicationToopen == "OM_ManageHolderAssign"){
            document.fire('EWS:openApplication',$H({app:'OM_ManageHolderAssign', node: this.objectToDeleteDelimit}));
        }   
        else {
            document.fire('EWS:openApplication',$H({app:'OM_Maintain', refresh: true}));
        }
    },
    /**
     *@description Stops OM_MassTrans
     */   
    close: function($super) {
        $super();
    }
});

var OM_DeleteDelimit = Class.create(OM_DeleteDelimit_standard, {
    initialize: function($super) {
        $super('OM_DeleteDelimit');
    },
    run: function($super, args) {
        $super(args);
    },
    close: function($super) {
        $super();
    }
});
