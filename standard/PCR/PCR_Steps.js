/**
 *@fileOverview PCR_Steps.js
 *@description It contains the PCR Wizard class and its methods
 */
/**
 *@constructor
 *@description Class with general functionality for the PCR Wizard class
 *@augments Application
 */
var PCR_Steps = Class.create(Application,
/**
*@lends PCR_Steps
*/
    {
    /** 
    * Service used to get the list of steps (and related info) of a wizard
    * @type String
    */
    serviceGetWizard: 'GET_WIZARD2',
    /** 
    * Service used to content of a certain step
    * @type String
    */
    getContentService: 'GET_STEP_CONT',
    /** 
    * Service used to save a step, or a PCR
    * @type String
    */
    saveService: 'SAVE_REQUEST',
    /** 
    * Hash with info about the buttons
    * @type Hash
    */
    hashOfButtons: $H(),
    /**
    * Property to know if a step is correct (can be saved) so we can move to the next step
    * @type Boolean
    */
    goToNext: false,
    /** 
    * Hash with info about the structure of the widgets in the screen
    * @type Hash
    */
    structureHash: $H(),
    /** 
    * Hash with info about the content (json) of each step
    * @type Hash
    */
    infoHash: $H(),
    /** 
    * Hash with info about existing steps
    * @type Hash
    */
    stepsHash: $H(),
    /** 
    * Hash with info about new child information
    * @type Hash
    */
    childrenAdd: $H(),
    /** 
    * pepe
    * @type int
    */
    childIndex: 1,
    /** 
    * pepe
    * @type int
    */
    contChild: 1,
    /** 
    * pepe
    * @type Boolean
    */
    comeFromChild: false,
     /** 
    * It tell us if we are modifying a record of a screen
    * @type Boolean
    */
    onModifyRecord: false,
    /*
    *@param $super: the superclass: PCR_Steps
    *@description instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
        this.onButtonClickedBinding = this.onButtonClicked.bindAsEventListener(this);
        this.fireEventWhenDefaultValueSet = $H({ PLANS: false });
        // Screen buttons div (to avoid repeated buttons)
        this.buttonsDiv = null;
        // Fast PCRs' okCode
        this.okCodeFastPCR = 'FPCR';
    },
    /*
    *@param $super: the superclass: PCR_Steps
    *@description This is the first method executed when the application is opened 
    */
    run: function($super, args) {
        $super(args);
        // Storing fieldPanels
        this.fieldPanels = new Hash();
        // Storing handlers for different (screen) buttons and PAIs
        this.onButtonPCRBinding = new Hash();
        this.PAIServiceBinding = new Hash();
        // Cleaning steps, buttons and children from other PCRs
        this.hashOfButtons = new Hash();
        this.stepsHash = new Hash();
        this.buttons = new Array();
        this.childNewJson = new Hash();
        this.childField = new Hash();
        this.childIndex = new Hash();
        //retrieve arguments given by the overview / other app 
        this.recordsToSave = new Array();
        this.infoHash = new Hash();
        // PCR Hire flag
        this.isHire = null;
        if (args) {
            this.comeFrom = args.get('comingFrom');
            if (this.comeFrom == 'inbox') {
                this.requestId = args.get('req_id');
                var disma = 'D';
                this.mode = 'display';
                this.disma = 'display';
                this.empId = args.get('req_bp');
                this.leftMenuId = args.get('req_bp'); //(global.getSelectedEmployees())[0];//
                this.wizardId = args.get('app').appId;
            }
            else {
                this.wizardId = args.get('wizardId');
                // Problem with PCR HIRE (no pernr) solved with this
                this.empId = (args.get('empId') == "null") ? null : args.get('empId');
                this.step0 = Object.isEmpty(args.get('step0')) ? args.get('step0') : args.get('step0')['@step0'];
                var isHire = Object.isEmpty(args.get('step0')) ? args.get('step0') : args.get('step0')['@hire'];
                this.isHire = Object.isEmpty(isHire) ? false : true;
                this.requestId = args.get('requestId');
                this.leftMenuId = args.get('leftMenuId');
                    this.fastPCR = (args.get('okCode') == this.okCodeFastPCR);
                //we calculate the mode
                if (!Object.isEmpty(args.get('disma'))) {
                    var disma = args.get('disma');
                    if (disma.toLowerCase() == 'd') {
                        this.mode = 'display';
                        this.disma = 'display';
                    }
                    else
                        this.mode = 'create';
                    }
                else
                    this.mode = 'create';
            }
            //If its a new request, we dont have a requestId yet
            if (Object.isEmpty(this.requestId)) {
                this.requestId = '';
                this.OkCode = this.fastPCR ? '' : 'NEW';
                this.comeFromDraft = false;
            }
            //if its an existing one, we already have a requestId, and the okCode != NEW
            else {
                this.OkCode = '';
                this.comeFromDraft = true;
            }
        }
        //when entering a wizard, delete old information
        if (!this.firstRun) {
            this.containerDiv.update('');
            if (!Object.isEmpty(this.step0containerDiv))
                this.step0containerDiv.update('');
        }
        //if the wizard is empty, create necessary divs
        if (Object.isEmpty(this.containerDiv)) {
            this.containerDiv = new Element('div', {
                'id': 'pcr_steps_container',
                'class': 'pcr_steps_container_css'
            });
            this.virtualHtml.insert(this.containerDiv);
        }
        //if we have step0, fill it before the other steps
        if (!Object.isEmpty(this.step0)) {
            if (Object.isEmpty(this.step0containerDiv)) {
                this.step0containerDiv = new Element('div', {
                    'id': 'pcr_step0_container',
                    'class': 'pcr_steps_container_css'
                });
                this.virtualHtml.insert(this.step0containerDiv);
            }
            this.getContentStep(this.step0, true);
        }
        //create and fill steps [1-lastStep]
        else
            this.callToGetSteps();
        //Observers
        document.observe('EWS:PCR_buttonClicked', this.onButtonClickedBinding);
    },
    /**  
    *@description Calls SAP to get the list of steps
    */
    callToGetSteps: function() {
        var pernr = "";
        if (!this.isHire) // Empty PERNR if we are in a Hire
            pernr = !Object.isEmpty(this.leftMenuId) ? this.leftMenuId : this.empId;
        //if no step0, construct xml_in and call SAP to get the list of steps        
        if (Object.isEmpty(this.step0)) {
            // For existing PCRs we add their reqId
            var request = Object.isEmpty(this.requestId) ? "" : "<REQ_ID>" + this.requestId + "</REQ_ID>";
            var xml_in = ''
                    + '<EWS>'
                      + '<SERVICE>' + this.serviceGetWizard + '</SERVICE>'
                      + '<OBJECT TYPE="P">' + pernr + '</OBJECT>'
                      + '<PARAM>'
                        + '<APPID>' + this.wizardId + '</APPID>'
                        + request
                      + '</PARAM>'
                    + '</EWS>';
            this.makeAJAXrequest($H({
                xml: xml_in,
                successMethod: this.processSteps.bind(this)
            }));
        }
        //if we clicked on 'submit' in a step0, we have to call to get the step1, but passing the records needed from step0
        else {
            var pernr = "";
            if (!this.isHire) { // Empty PERNR if we are in a Hire
                if (!Object.isEmpty(this.actualPernr))
                    pernr = this.actualPernr;
                else
                    pernr = this.empId;
            }
            //the same xml as above, but we'll insert records from step0    
            var jsonGetWizard = {
                EWS: {
                    SERVICE: this.serviceGetWizard,
                    OBJECT: { '@TYPE': 'P', '#text': pernr },
                    PARAM: {
                        APPID: this.wizardId,
                        RECORDS: { YGLUI_STR_WID_RECORD: $A() }
                    }
                }
            };
            var records = objectToArray(this.contentJson.EWS.o_field_values.yglui_str_wid_record);
            //insert the records to save
            for (var i = 0; i < records.length; i++) {
                jsonGetWizard.EWS.PARAM.RECORDS.YGLUI_STR_WID_RECORD.push(records[i]);
            }
            //insert button if we have a fastPCR
            if (this.fastPCR)
                jsonGetWizard.EWS.PARAM.BUTTON = { "@action": "APP_PCR_SUBMIT", "@busid": "", "@disma": "", "@label_tag": "Submit", "@okcode": "FPCR", "@screen": "*", "@status":"10", "@tarap": "", "@tarty": "", "@type": "DEL" };
            //transform the xml
            var json2xml = new XML.ObjTree();
            json2xml.attr_prefix = '@';
            if (!this.fastPCR) {
                this.makeAJAXrequest($H({
                    xml: json2xml.writeXML(jsonGetWizard),
                    successMethod: this.processSteps.bind(this),
                    errorMethod: this._errorProcessCallToSave.bind(this)
                }));
            }
            else {
                this.makeAJAXrequest($H({
                    xml: json2xml.writeXML(jsonGetWizard),
                    successMethod: this._saveFastRequest.bind(this, 'submit', 'APP_PCR_SUBMIT', this.step0),
                    errorMethod: this._errorProcessCallToSave.bind(this)
                }));
            }
        }
    },
    /**  
    *@param json The json with the list of steps and some other info (mandatory..)
    *@description Create data structures for buttons, steps, contents...
    */
    processSteps: function(json) {        
        this.json = json;
        if (!Object.isEmpty(this.step0containerDiv))
            this.step0containerDiv.update('');
        // Is it a PCR Hire?
        this.isHire = Object.isEmpty(json.EWS.o_hire) ? false : true;
        //build the steps hash
        var steps = new Array();
        if (!Object.isEmpty(json.EWS.o_steps))
            steps = objectToArray(json.EWS.o_steps.yglui_str_wzstps);
        for (var i = 0; i < steps.length; i++)
            this.stepsHash.set(steps[i]['@wiz_stpid'], { data: steps[i] })
        var step0 = json.EWS.o_step0;
        if (!Object.isEmpty(step0)) {
            var auxdata = { data: { "#text": null, "@mandatory": "X", "@okcode": "", "@seqnr": "00", "@wiz_stpid": step0 } };
            this.stepsHash.set(step0, auxdata);
        }
        //if it's an existing request, we read its id and objId
        if (!this.comeFromDraft) {
            if (!Object.isEmpty(json.EWS.o_req_head['@req_id']))
                this.requestId = json.EWS.o_req_head['@req_id'];
            if (!Object.isEmpty(json.EWS.o_req_head['@objid']))
                this.newPernr = json.EWS.o_req_head['@objid'];
        }
        //build buttons hashes
        var topButtons = $H({});
        this.normalButtons = $H({});
        //create a custom structure with the steps (will be top buttons in the wizard)
        var buttonsArray = new Array();
        if (!Object.isEmpty(json.EWS.o_steps))
            buttonsArray = objectToArray(this.json.EWS.o_steps.yglui_str_wzstps);
        if (!Object.isEmpty(step0)) {
            buttonsArray.push(auxdata.data);
        }
        for (var i = 0; i < buttonsArray.length; i++) {
            if (Object.isEmpty(buttonsArray[i]['@mandatory']))
                var mandatory = false;
            else
                var mandatory = true;
            var order = parseInt(buttonsArray[i]['@seqnr'], 10);
            topButtons.set(buttonsArray[i]['@wiz_stpid'], { 
                mandatory: mandatory, visited: false, order: order
            });
        }
        //create the hardcoded buttons
        this.normalButtons.set("previous", {
            data: { action: "previous", disma: "M", label_tag: global.getLabel('previous'), okcode: "", screen: "*", tarap: "", tarty: "A", type: "" }
        });
        if (this.mode != 'display') {
            this.normalButtons.set("Save", {
                data: { action: "save", disma: "M", label_tag: global.getLabel('save'), okcode: "", screen: "*", tarap: "", tarty: "A", type: "" }
            });
        }
        // First step number
        var initialNumber = 1;
        if (!Object.isEmpty(step0))
            initialNumber = 0;
        //instantiate the module 'wizard'
        this.PCR_wizard = new Wizard({
            topButtons: topButtons,
            normalButtons: this.normalButtons,
            container: this.containerDiv,
            //startStep: 'WIZARD01',
            events: $H({ onClicked: 'EWS:PCR_buttonClicked' }),
            firstStepNumber: initialNumber
        });
        for (var i = 0; i < topButtons.keys().length; i++) {
            if (topButtons.get(topButtons.keys()[i]).order == initialNumber)
                var step = topButtons.keys()[i];
        }
        // Disabling buttons
        this._toggleButtons(false);
        //get the content of each step
        this.PCR_wizard.containerNormalButtons.down('[id=previous_previous]').hide();
        if (!Object.isEmpty(step0)) {
            if (this.mode != 'display')
                this.PCR_wizard.containerNormalButtons.down('[id=Save_save]').hide();
            this.getContentStep(step, true);
        }
        else
        this.getContentStep(step);
    },
    /**  
    *@param Event Event launched when a button (top or bottom)is clicked
    *@description Reacts to the button clicked properly: going forward, backward, staying...
    */
    onButtonClicked: function(event) {
        var args = getArgs(event);
        var currentStep = args.currentStep;
        // Disabling buttons
        this._toggleButtons(false);
        // reset the mode
        if (this.disma != 'display')
            this.mode = '';
        //If BOTTOM buttons
        if (args.action) {
            switch (args.action) {//button clicked
                //Go backward                                                                                                                                                                                                                        
                case 'previous':
                    this._deleteFieldPanels(currentStep);
                    var previous = this.PCR_wizard.getPreviousStep(currentStep);
                    document.stopObserving('EWS:goToNext');
                    //if the step has not been visited yet, we need to retrieve info from SAP
                    if (!this.PCR_wizard.isVisited(previous)) {
                        this.getContentStep(previous);
                    }
                    else {
                        //if the step has already been visited, we just show its information
                        this.detailsHash = splitBothViews(this.infoHash.get(previous).json);
                        var PCRScreens = deepCopy(objectToArray(this.infoHash.get(previous).json.EWS.o_step_screens.yglui_str_wid_attributes));
                        for (var i = 0; i < PCRScreens.size(); i++) {
                            var screenAppId = PCRScreens[i]['@appid'];
                            this.table = (this.detailsHash.get(screenAppId).listMode == 'X');
                        }
                        var dinamicButtons = this.createDinamicButtons(previous);
                        this.PCR_wizard.addButtons(dinamicButtons);
                        this.PCR_wizard.goToStep(previous);
                        // Enabling buttons
                        this._toggleButtons(true);
                    }
                    break;
                //Go forward                                                                                                                                                                                                                        
                case 'APP_PCR_NEXT':
                    var next = this.PCR_wizard.getNextStep(currentStep);
                    //check if the form is correct. If yes, it'll launch an event, so we can show the next step
                    if (this.mode != 'display') {
                        if (this.stepsHash.get(currentStep).data['@seqnr'] != '00') {
                            this.testFormAndDoAction(args.action, currentStep);
                            document.stopObserving('EWS:goToNext');
                            document.observe('EWS:goToNext', function() {
                                //if the step has not been visited yet, we need to retrieve info from SAP.
                                this.getContentStep(next);
                        }.bind(this));
                    }
                        else
                            this.getContentStep(next);
                    }
                    else {
                        this.getContentStep(next);
                    }
                    break;
                //Clicked on save                                                                                                                                                                                                                        
                case 'save':
                    this.testFormAndDoAction(args.action, currentStep);
                    break;
                //Clicked on submit                                                                                                                                                                                                                            
                case 'APP_PCR_SUBMIT':
                    this.testFormAndDoAction(args.action, currentStep);
                    break;
                //Clicked on cancel                                                                                                                                                                                                                        
                case 'APP_PCR_CANCEL':
                    var step = currentStep;
                    if (this.stepsHash.get(currentStep).data['@seqnr'] == '00')
                        step = "step0";
                    this.returnToOverview(step);
                    break;
                //Clicked on skip, which is a special button in optional steps, so we can skip the saving                                                                                                                                                                                                                        
                case 'APP_PCR_SKIP':
                    var next = this.PCR_wizard.getNextStep(currentStep);
                    if (this.PCR_wizard.isVisited(next)) {
                        var dinamicButtons = this.createDinamicButtons(next);
                        this.PCR_wizard.addButtons(dinamicButtons);
                        this.PCR_wizard.goToStep(next);
                    }
                    else {
                        this.getContentStep(next);
                    }
                    break;
                // If in PCR NEWBORN, we click on 'add', to add a child                   
                case 'SCR_FAADDCHILD':
                    this.getContentStep(currentStep, 'newChild', true);
                    break;
            }
        }
        //TOP BUTTONS
        if (args.nextStep) {//step clicked
            var numberCurrent = this.stepsHash.get(currentStep).data['@seqnr'];
            var numberNext = this.stepsHash.get(args.nextStep).data['@seqnr'];
            if (numberNext > numberCurrent) {
                var action = 'APP_PCR_NEXT';
                //if it's a draft or new, we have to check the fields correction
                if (this.mode != 'display' && numberCurrent != '00') {
                    this.testFormAndDoAction(action, currentStep);
                    document.stopObserving('EWS:goToNext');
                    document.observe('EWS:goToNext', function() {
                        this.getContentStep(args.nextStep);
                    } .bind(this));
                }
                //if it's a request from history, we just go to the next step
                else {
                    this.getContentStep(args.nextStep);
                }
            }
            else {
                var action = 'previous';
                document.stopObserving('EWS:goToNext');
                if (!this.PCR_wizard.isVisited(args.nextStep)) {
                    this.getContentStep(args.nextStep);
                }
                else {
                    var dinamicButtons = this.createDinamicButtons(args.nextStep);
                    this.PCR_wizard.addButtons(dinamicButtons);
                    this.PCR_wizard.goToStep(args.nextStep);
                    this._toggleButtons(true);
                }
            }
        }
    },
    /**  
    *@param step, step id to retrieve the info for this step
    *@param isStep0, boolean to know if the content is for a step 0 or not
    *@param isNew, boolean, if true Okcode = 'NEW'
    *@description call service to get the content for each step
    */
    getContentStep: function(step, isStep0, isNew) {
        //prepare variables to insert in the xml
        var pernr = "";
        if (!this.isHire) { // Empty PERNR if we are in a Hire
            if (Object.isEmpty(this.newPernr))
                pernr = Object.isEmpty(this.empId) ? this.leftMenuId : this.empId;
            else
                pernr = this.newPernr;
        }
        if (!this.comeFromDraft && !Object.isEmpty(this.stepsHash.get(step))) {
            this.OkCode = this.stepsHash.get(step).data['@okcode'];
            if (Object.isEmpty(this.OkCode))
                this.OkCode = '';
        }
        if (!Object.isEmpty(isNew) && isNew)
            this.OkCode = 'NEW';
        if (this.comeFromDraft && (this.stepsHash.get(step).data['@okcode'] == 'REQ') && isStep0 != 'newChild')
            this.OkCode = 'REQ';
        if (this.comeFromDraft && (this.stepsHash.get(step).data['@okcode'] == 'NEW') && isStep0 != 'newChild')
            this.OkCode = '';
        var xml_in_getContent = '<EWS>' +
                                    '<SERVICE>' + this.getContentService + '</SERVICE>' +
                                    '<OBJECT TYPE="P">' + pernr + '</OBJECT>' +
                                    '<PARAM>' +
                                        '<APPID>' + this.wizardId + '</APPID>' +
                                        '<WIZ_STPID>' + step + '</WIZ_STPID>' +
                                        '<OKCODE>' + this.OkCode + '</OKCODE>' +
                                        '<REQ_ID>' + this.requestId + '</REQ_ID>' +
                                    '</PARAM>' +
                                '</EWS>';
        if (isNew)
            this.makeAJAXrequest($H({
                xml: xml_in_getContent,
                successMethod: this.addChild.bind(this, step, isStep0, this.OkCode, '', '')
            }));
        else
            this.makeAJAXrequest($H({
                xml: xml_in_getContent,
                successMethod: this.fillstep.bind(this, step, isStep0, this.OkCode, '')
            }));
    },

    popUpClosed: function(event, step, okCode) {
        var jsonCopy = getArgs(event).json;
        var screenToChange = jsonCopy.EWS.o_field_values.yglui_str_wid_record["@screen"];
        var allScreens = objectToArray(this.contentJson.EWS.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < allScreens.length; i++) {
            if (allScreens[i]["@screen"] == screenToChange)
                allScreens[i] = jsonCopy.EWS.o_field_values.yglui_str_wid_record;
        }
        this.fillstep(step, false, okCode, true, this.contentJson);
    },
    /**  
    *@param step, step id to retrieve the info for this step
    *@param isStep0, boolean to know if the content is for a step 0 or not
    *@param Okcode, depending on this we create the fieldsPanel in one way or another
    *@param refresh, if true refres the json with a PAI service
    *@param json, json with the information
    *@description pepe
    */
    fillstep: function(step, isStep0, okCode, refresh, json) {
        this.existingListValues = false;
        document.stopObserving('EWS:PCR_popUpClose');
        document.observe('EWS:PCR_popUpClose', this.popUpClosed.bindAsEventListener(this, step, okCode));
        // RequestId as argument for the fieldPanel
        var fieldValueAppend = new Hash();
        if ((parseInt(this.requestId, 10) != 0) && (!Object.isEmpty(this.requestId)))
            fieldValueAppend.set('*', '<REQID>' + this.requestId + '</REQID>');
        //if not coming from PAI || coming from changed
        if (Object.isEmpty(refresh))
            this.contentJson = json;
        //coming from PAI
        else {
            this.contentJson.EWS.o_field_settings = json.EWS.o_field_settings;
            this.contentJson.EWS.o_field_values = json.EWS.o_field_values;
            this.contentJson.EWS.o_widget_screens = this.infoHash.get(step).json.EWS.o_widget_screens;
            this.contentJson.EWS.o_step_screens = this.infoHash.get(step).json.EWS.o_step_screens;
            var fieldsRows = this.structureHash.get(step).row;
            for (var i = 0; i < fieldsRows.keys().length; i++) {
                var fieldsColumns = fieldsRows.get(fieldsRows.keys()[i]).columns;
                for (var j = 0; j < fieldsColumns.keys().length; j++) {
                    fieldsColumns.get(fieldsColumns.keys()[j]).field.destroy();
                }
            }
        }
        this.infoHash.set(step, { json: this.contentJson });
        this.detailsHash = splitBothViews(this.contentJson);
        //loop through screens          
        var PCRScreens = deepCopy(objectToArray(this.contentJson.EWS.o_step_screens.yglui_str_wid_attributes));
        //screen sorting (row)    
        for (var i = 0; i < PCRScreens.length; i++) {
            for (var j = 0; j < PCRScreens.length - 1; j++) {
                if (PCRScreens[j]["@widrow"] > PCRScreens[j + 1]["@widrow"]) {
                    var temp = PCRScreens[j];
                    PCRScreens[j] = PCRScreens[j + 1];
                    PCRScreens[j + 1] = temp;
                }
            }
        }
        //special code for REHIRE step0     
        for (var j = 0; j < PCRScreens.length; j++) {
            var type = PCRScreens[j]['@type'];
            var screen = PCRScreens[j]['@appid'];
            if (type.toLowerCase() == 'search') {
                var searchScreen = screen;
            }
            if (type.toLowerCase() == 'result') {
                var resultScreen = screen;
            }
            if (type.toLowerCase() == 'group') {
                var groupScreen = screen;
            }
            var column = PCRScreens[j]['@widcolumn'];
            var row = PCRScreens[j]['@widrow'];
            this.detailsHash.get(screen).column = column;
            this.detailsHash.get(screen).row = row;
            if (Object.isUndefined(this.structureHash.get(step))) {
                this.structureHash.set(step, { row: $H() });
            }
            this.structureHash.get(step).row.set(row, { columns: $H() });
        }
        for (var i = 0; i < PCRScreens.size(); i++) {
            var screenAppId = PCRScreens[i]['@appid'];
            if (this.detailsHash.get(screenAppId).tableMode != 'X') {
                //calculate okCode, and instantiate getContentModule
                if (this.mode != 'display') {
                    if (okCode != 'NEW')
                        this.mode = 'edit';
                    else
                        this.mode = 'create';
                    if (this.detailsHash.get(screenAppId).listMode == 'X') {
                        this.mode = 'display';
                        if (this.detailsHash.get(screenAppId).EWS.o_field_values)
                            this.existingListValues = true;
                    }
                }
                if (this.mode == 'display' && Object.isEmpty(this.detailsHash.get(screenAppId).listMode) && this.disma != 'display') {
                    if (okCode != 'NEW')
                        this.mode = 'edit';
                    else
                        this.mode = 'create';
                }
                if (this.mode == 'edit' && this.comeFromDraft && isStep0)
                    this.mode = 'display';
                //set the width parameters for the getContentModule depending on fieldset width: normal or full screen
                var isDoubleWith = Object.isEmpty(PCRScreens[i]['@widcolumn']) ? true : false;
                var fieldDispQuarterSize = 'fieldDispQuarterSize';
                var fieldDispHalfSize = 'PCR_fieldDispHalfSize';
                if (isDoubleWith) {
                    fieldDispHalfSize = 'PCR_fieldDispHalfSize';
                    fieldDispQuarterSize = 'fieldDispQuarterSize';
                } else {
                    fieldDispHalfSize = 'fieldDispHalfSize';
                    fieldDispQuarterSize = 'fieldDispHalfSize';
                }
                var loadingPAImsg = Object.isEmpty(this.detailsHash.get(screenAppId).listMode) ? true : false;
                var field = new getContentModule({
                    json: this.detailsHash.get(screenAppId),
                    appId: this.detailsHash.get(screenAppId).EWS.appId,
                    name: this.detailsHash.get(screenAppId).EWS.o_field_settings.yglui_str_wid_fs_record['@screen'] + '_' + this.infoHash.keys().last(),
                    mode: this.mode,
                    //fireEventWhenDefaultValueSet: this.fireEventWhenDefaultValueSet,
                    //paiEvent: 'EWS:paiEvent_' + this.detailsHash.get(screenAppId).EWS.appId + '_' + this.detailsHash.get(screenAppId).EWS.o_field_settings.yglui_str_wid_fs_record['@screen'],
                    //noResultsHtml: '<span>' + global.getLabel('noResults') + '</span>',
                    showCancelButton: false,
                    showLoadingPAI: loadingPAImsg,
                    showButtons: $H({
                        edit: true,
                        display: true,
                        create: true
                    }),
                    buttonsHandlers: $H({
                        DEFAULT_EVENT_THROW: 'EWS:pcrChange_' + this.detailsHash.get(screenAppId).EWS.appId + '_' + step + '_' + this.detailsHash.get(screenAppId).EWS.o_field_settings.yglui_str_wid_fs_record['@screen'],
                        paiEvent: function(args) {
                            document.fire('EWS:paiEvent_' + this.detailsHash.get(getArgs(args).screen).EWS.appId + '_' + this.detailsHash.get(getArgs(args).screen).EWS.o_field_settings.yglui_str_wid_fs_record['@screen'], getArgs(args))
                        }.bind(this)
                    }),
                    cssClasses: $H({ fieldDispHalfSize: fieldDispHalfSize, fieldDispQuarterSize: fieldDispQuarterSize, tcontentSimpleTable: 'PCR_stepsWithTable' }),
                    getFieldValueAppend: fieldValueAppend,
                    eventPopUp: "EWS:PCR_popUpClose",
                    fieldDisplayerModified: "EWS:PCR_screenChange" + this.detailsHash.get(screenAppId).EWS.o_field_settings.yglui_str_wid_fs_record['@screen'] + '_' + this.infoHash.keys().last()
                });
                //depending on tableMode, we use different variables
                if (this.detailsHash.get(screenAppId).listMode != 'X') {
                    this.table = false;
                    this.fieldPanels.set(step + '_' + screenAppId, field);
                }
                if (this.detailsHash.get(screenAppId).listMode == 'X') {
                    this.table = true;
                    this.fieldPanels.set(step + '_' + screenAppId, field);
                    document.stopObserving('EWS:pcrChange_' + this.detailsHash.get(screenAppId).EWS.appId + '_' + step + '_' + screenAppId);
                    // Handler for that screen
                    this.onButtonPCRBinding.set(step + '_' + screenAppId, this.onButtonPCR.bindAsEventListener(this, this.fieldPanels.get(step + '_' + screenAppId), this.detailsHash.get(screenAppId).EWS.appId, screenAppId, this.detailsHash.get(screenAppId).listMode, step));
                    document.observe('EWS:pcrChange_' + this.detailsHash.get(screenAppId).EWS.appId + '_' + step + '_' + screenAppId, this.onButtonPCRBinding.get(step + '_' + screenAppId));
                }
                if (Object.isEmpty(refresh)) {
                    this.PAIServiceBinding.set(step + '_' + screenAppId, this.PAIService.bindAsEventListener(this, step, okCode, screenAppId, isStep0));
                    document.stopObserving('EWS:paiEvent_' + this.detailsHash.get(screenAppId).EWS.appId + '_' + this.detailsHash.get(screenAppId).EWS.o_field_settings.yglui_str_wid_fs_record['@screen']);
                    document.observe('EWS:paiEvent_' + this.detailsHash.get(screenAppId).EWS.appId + '_' + this.detailsHash.get(screenAppId).EWS.o_field_settings.yglui_str_wid_fs_record['@screen'], this.PAIServiceBinding.get(step + '_' + screenAppId));
                }
                var screen = screenAppId;
                if (!Object.isEmpty(groupScreen)) {
                    if (screen.toLowerCase() == groupScreen.toLowerCase()) {
                        this.groupFields = this.fieldPanels.get(step + '_' + screenAppId).fieldDisplayers;
                    }
                }
                var screenRow = this.detailsHash.get(screenAppId).row;
                var screenColumn = this.detailsHash.get(screenAppId).column;
                var labelsArray = objectToArray(this.detailsHash.get(screenAppId).EWS.labels.item);
                var labelId = this.detailsHash.get(screenAppId).EWS.label;
                var cont = true;
                //take the correct label, for the title
                for (var c = 0; c < labelsArray.length && cont; c++) {
                    if (labelId == labelsArray[c]['@id']) {
                        var label = labelsArray[c]['@value'];
                        cont = false;
                    }
                    else {
                        var label = labelId;
                    }
                }
                if (Object.isEmpty(screenColumn))
                    screenColumn = 0;
                this.structureHash.get(step).row.get(screenRow).columns.set(screenColumn, { screen: screen, field: this.fieldPanels.get(step + '_' + screenAppId), label: label });
            }
        }
        var htmlContent = new Element('div', {
            'class': 'PCR_columns_container'
        });
        //create html
        var length = this.structureHash.get(step).row.keys().length;
        // Controlling if we have inserted a top margin for right/left rows
        var leftTopMargin = false;
        var rightTopMargin = false;
        for (var i = 0; i < length; i++) {
            var insertRow = this.structureHash.get(step).row.get(this.structureHash.get(step).row.keys()[i]);
            //Now we decide where to insert the fieldset: left column, right column, or two columns wide
            var firstColumn = insertRow.columns.get('1');
            var secondColumn = insertRow.columns.get('2');
            var bothColumns = insertRow.columns.get('0');
            //left column
            if (!Object.isEmpty(firstColumn)) {
                var label = global.getLabel(firstColumn.label);
                var legend = new Element('span', { 'class': 'PCR_legend' }).insert(label);
                var fc = new Element('div', { 'id': 'PCR_fieldSet_' + firstColumn.screen + '', 'class': 'PCR_column1' });
                if (!Object.isEmpty(label))
                    fc.insert(legend);
                // Margin top for all, except for the first one
                if (leftTopMargin)
                    fc.addClassName('PCR_columnMargin12');
                else
                    leftTopMargin = true;
                // Margin bottom for all, except for the last one
                if (i != length - 1)
                    fc.addClassName('PCR_columnMargin0');
                fc.addClassName('PCR_columnBorder');
                var divInside = new Element('div');
                fc.insert(divInside);
                divInside.insert(firstColumn.field.getHtml());
                htmlContent.insert(fc);
                this.fieldSetClass = 'PCR_column1';
            }
            //right column
            if (!Object.isEmpty(secondColumn)) {
                var label = global.getLabel(secondColumn.label);
                var legend = new Element('span', { 'class': 'PCR_legend' }).insert(label);
                var sc = new Element('div', { 'id': 'PCR_fieldSet_' + secondColumn.screen + '', 'class': 'PCR_column2' });
                if (!Object.isEmpty(label))
                    sc.insert(legend);
                // Margin top for all, except for the first one
                if (rightTopMargin)
                    fc.addClassName('PCR_columnMargin12');
                else
                    rightTopMargin = true;
                // Margin bottom for all, except for the last one
                if (i != length - 1)
                    sc.addClassName('PCR_columnMargin0');
                sc.addClassName('PCR_columnBorder');
                var divInside = new Element('div');
                sc.insert(divInside);
                divInside.insert(secondColumn.field.getHtml());
                htmlContent.insert(sc);
                this.fieldSetClass = 'PCR_column2';
            }
            //two columns wide
            if (!Object.isEmpty(bothColumns)) {
                var label = global.getLabel(bothColumns.label);
                var legend = new Element('span', { 'class': 'PCR_legend' }).insert(label);
                var bc = new Element('div', { 'id': 'PCR_fieldSet_' + bothColumns.screen + '', 'class': 'PCR_column0' });
                if (!Object.isEmpty(label))
                    bc.insert(legend);
                bc.addClassName('PCR_column0_width');
                // Margin bottom for all, except for the last one
                if (i != length - 1)
                    bc.addClassName('PCR_columnMargin0');
                bc.addClassName('PCR_columnBorder');
                var divInside = new Element('div');
                divInside.addClassName('PCR_tableOverflow');
                bc.insert(divInside);
                divInside.insert(bothColumns.field.getHtml());
                htmlContent.insert(bc);
                this.fieldSetClass = 'PCR_column0';
            }
        }
        //at the end, insert everything
        if (isStep0 && !this.comeFromDraft) {
            var title0 = new Element('div', {
                'id': 'pcr_step0Title_' + this.wizardId + '_' + this.labels.get(this.step0),
                'class': 'pcr_stepTitle'
            }).insert("<div class='application_main_title2 pcr_stepTitle_font'>" + global.getLabel(this.wizardId) + "</div><div class='pcr_stepTitle_font application_main_soft_text'>" + global.getLabel(this.step0) + "</div>");
            this.step0containerDiv.update('');
            this.step0containerDiv.insert(title0);
            this.step0containerDiv.insert(htmlContent);
            //store hidden fields to add in group
            if (!Object.isEmpty(resultScreen)) {
                var fieldSet = this.virtualHtml.down('[id$=' + resultScreen + ']');
                fieldSet.down('.fieldPanel').update("<div class='PCR_makeSearch application_main_soft_text'>" + global.getLabel('Make_a_search') + "</div>");
                // When we'll receive the button from sap we should remove this piece of code
                var searchDiv = htmlContent.down('[id$=' + searchScreen + ']');
                var json = {
                    elements: []
                };
                var testSearch = {
                    label: global.getLabel('search'),
                    idButton: 'search',
                    className: 'PCR_SearchButton',
                    handlerContext: null,
                    handler: this.makeSearch.bind(this, searchScreen, resultScreen),
                    type: 'button',
                    standardButton: true
                };
                json.elements.push(testSearch);
                var ButtonJobProfile = new megaButtonDisplayer(json);
                searchDiv.insert(ButtonJobProfile.getButtons());
            }
            var containerButtons = new Element('div', { 'class': 'PCR_ContainerdinamicButtons' });
            if (Object.isEmpty(this.hashOfButtons.get(step))) {
                this.hashOfButtons.set(step, { buttons: $A() });
                // Normal PCRs
                if (!Object.isEmpty(this.contentJson.EWS.o_screen_buttons))
                    this.buttons = objectToArray(this.contentJson.EWS.o_screen_buttons.yglui_str_wid_button);
                else {
                    // Fast PCRs
                    if (this.fastPCR)
                    // These values were copied from PCR Hire's submit button
                        this.buttons = objectToArray({ "@action": "APP_PCR_SUBMIT", "@busid": "", "@disma": "", "@label_tag": "Submit", "@okcode": this.okCodeFastPCR, "@screen": "*", "@status": "", "@tarap": "", "@tarty": "", "@type": "DEL" });
                }
                this.hashOfButtons.set(step, { buttons: this.buttons });
            }
            htmlContent.insert(containerButtons);
            var jsonCancel = {
                elements: []
            };
            var callbackCancel = function() {
                // Disabling buttons
                this._toggleButtons(false);
                this.returnToOverview("step0");
            }.bind(this);
            var cancel = {
                label: global.getLabel('Cancel'),
                idButton: 'APP_PCR_CANCEL',
                className: 'getContentButtons fieldDispFloatRight',
                handlerContext: null,
                handler: callbackCancel,
                type: 'button',
                standardButton: true
            };
            var idButton = 'submitPCR0';
            var callbackSubmit = function() {
                // Disabling buttons
                this._toggleButtons(false);
		        if (this.fastPCR)
			        this.confirmFastPCR(step);
                else
                    this.testFormAndDoAction(idButton, step);
            }.bind(this);
            var submit = {
                label: global.getLabel('submit'),
                idButton: idButton,
                className: 'getContentButtons fieldDispFloatRight',
                handlerContext: null,
                handler: callbackSubmit,
                type: 'button',
                standardButton: true
            };
            jsonCancel.elements.push(cancel);
            jsonCancel.elements.push(submit);
            this.buttonsPCRstep0 = new megaButtonDisplayer(jsonCancel);
            containerButtons.insert(this.buttonsPCRstep0.getButtons());
        }
        //If no step0
        else {
            var title = new Element('div', {
                'id': 'pcr_stepTitle_' + this.wizardId + '_' + step,
                'class': 'pcr_stepTitle'
            }).insert("<div class='application_main_title2 pcr_stepTitle_font'>" + global.getLabel(this.wizardId) + "</div><div class='pcr_stepTitle_font application_main_soft_text'>" + global.getLabel(step) + "</div>");
            this.PCR_wizard.insertHtml(htmlContent, step, title);
            var dinamicButtons = this.createDinamicButtons(step);
            this.PCR_wizard.addButtons(dinamicButtons);
        }
        field.setFocus();
        // Enabling buttons
        this._toggleButtons(true);
        // Hiding results screen if there isn't a new PCR
        if (this.virtualHtml.down('[id=PCR_fieldSet_RESULT]') && this.comeFromDraft)
            this.virtualHtml.down('[id=PCR_fieldSet_RESULT]').hide();
    },
    /**  
    *@param step, current step
    *@description create the buttons coming from SAP
    */
    createDinamicButtons: function(step) {
        //pepe -> comenta algo n este metodo
        var action;
        if (Object.isEmpty(this.hashOfButtons.get(step))) {
            this.hashOfButtons.set(step, { buttons: $A() });
            if (!Object.isEmpty(this.contentJson.EWS.o_screen_buttons)) {
                this.buttons = objectToArray(this.contentJson.EWS.o_screen_buttons.yglui_str_wid_button);
                if (this.stepsHash.get(step).data['@seqnr'] == '00' && this.comeFromDraft)
                    this.buttons.push({ "@action": "APP_PCR_NEXT", "@busid": null, "@disma": null, "@label_tag": global.getLabel('next'), "@okcode": "INS", "@screen": "*", "@showindisplay": null, "@status": "10", "@tarap": null, "@tartb": null, "@tarty": null, "@type": "INS", "@views": null });
            }
            this.hashOfButtons.set(step, { buttons: this.buttons });
        }
        if (this.comeFromDraft) {
            if (this.stepsHash.get(step).data['@seqnr'] == '00') { //We are in the step 0    
                if (this.PCR_wizard.containerNormalButtons.down('[id=Save_save]'))
                    this.PCR_wizard.containerNormalButtons.down('[id=Save_save]').hide();
            }
            else {
                if (this.comeFrom == 'Drafts')
                    this.PCR_wizard.containerNormalButtons.down('[id=Save_save]').show();
            }
            var prev = this.PCR_wizard.getPreviousStep(step);
            if (step != prev) // We are in the first step of all (it can be "0" or "1")
                this.PCR_wizard.containerNormalButtons.down('[id=previous_previous]').show();
            else
                this.PCR_wizard.containerNormalButtons.down('[id=previous_previous]').hide();
        }
        else { // new PCR
            if (this.stepsHash.get(step).data['@seqnr'] == '01')
                this.PCR_wizard.containerNormalButtons.down('[id=previous_previous]').hide();
            if (this.stepsHash.get(step).data['@seqnr'] != '01')
                this.PCR_wizard.containerNormalButtons.down('[id=previous_previous]').show();
        }
        var dinamicButtons = {
            elements: []
        };
        var dinamicLinks = {
            elements: [],
            mainClass: 'application_pcr_optionLinks'

        };
        // If the div exists, we delete it
        if (!Object.isEmpty(this.buttonsDiv)) {
            this.buttonsDiv.update("");
            this.buttonsDiv.remove();
            this.buttonsDiv = null;
        }
        var length = 0;
        if (!Object.isEmpty(this.hashOfButtons.get(step).buttons))
            length = this.hashOfButtons.get(step).buttons.length;
        if (length > 0) {
            for (var i = 0; i < length; i++) {
                action = null;
                var label = this.hashOfButtons.get(step).buttons[i]['@label_tag'];
                var status = this.hashOfButtons.get(step).buttons[i]['@status'];
                if (this.hashOfButtons.get(step).buttons[i]['@action'].substring(0, 3) == 'SCR') {
                    if (this.comeFrom != 'History' && this.comeFrom != 'inbox') {
                        var screen = this.hashOfButtons.get(step).buttons[i]['@screen'];
                        var fieldSetHTML = this.virtualHtml.down('[id=PCR_fieldSet_' + screen + ']');
                        // If the div doesn't exist, we create it
                        if (Object.isEmpty(this.buttonsDiv)) {
                            this.buttonsDiv = new Element('div', { id: 'PCR_fieldSet_buttonsDiv' });
                            fieldSetHTML.insert(this.buttonsDiv);
                            if (this.table) {
                                this.tableErrorDiv = new Element('div', { id: 'PCR_fieldSet_tableErrorDiv', 'class': 'application_main_error_text fieldClearBoth' });
                                fieldSetHTML.insert(this.tableErrorDiv);
                                this.tableErrorDiv.hide();
                            }
                        }
                        var links = {
                            label: label,
                            idButton: 'SCR_FAADDCHILD',
                            className: 'application_action_link PCR_dinamicLinks',
                            handlerContext: null,
                            handler: this.PCR_wizard.buttonClicked.bind(this.PCR_wizard, this.hashOfButtons.get(step).buttons[i]['@action']),
                            type: 'link'
                        };
                        dinamicLinks.elements.push(links);
                        var linksPCR = new megaButtonDisplayer(dinamicLinks).getButtons();
                        // We add the buttons inside the div
                        this.buttonsDiv.insert(linksPCR);
                    }
                }
                else {
                    if (Object.isEmpty(status)) {
                        //var prev = this.PCR_wizard.getPreviousStep(step);
                        //if (this.stepsHash.get(prev).data['@seqnr'] != '00')
                            action = 'APP_PCR_SUBMIT';
                        //else
                            //action = 'previous';
                    }
                    else {
                        if (status == '9Z')
                            action = 'APP_PCR_CANCEL';
                        else if (status == '00')
                            action = 'APP_PCR_SKIP';
                        else
                            action = 'APP_PCR_NEXT';
                    }
                    if (!((action == 'APP_PCR_SUBMIT') && (this.mode == 'display') && this.comeFromDraft && (this.comeFrom != 'Drafts'))) {
                        // We don't want the "Cancel" button if we come from 'Inbox' and the mode is 'display'
                        if (!(action == 'APP_PCR_CANCEL' && this.mode == 'display' && this.comeFrom == 'inbox')) {
                            var button = {
                                label: label,
                                idButton: action,
                                className: 'getContentButtons fieldDispFloatRight',
                                handlerContext: null,
                                handler: this.PCR_wizard.buttonClicked.bind(this.PCR_wizard, action),
                                type: 'button',
                                standardButton: true
                            };
                            dinamicButtons.elements.push(button);
                        }
                    }
                }
            }
        }
        // No buttons --> Fast PCRs (only step0)
        else {
            var button = {
                label: global.getLabel('cancel'),
                idButton: 'APP_PCR_CANCEL',
                className: 'getContentButtons fieldDispFloatRight',
                handlerContext: null,
                handler: this.returnToOverview.bind(this, 'step0'),
                type: 'button',
                standardButton: true
            };
            dinamicButtons.elements.push(button);
        }
            this.ButtonsPCR = new megaButtonDisplayer(dinamicButtons);
            return this.ButtonsPCR.getButtons();
    },
    /**  
    *@param currentStep, current step
    *@description If the user click on cancel this function open the overview application.
    */
    returnToOverview: function(currentStep) {
        var contentHTML = new Element('div', { 'class': 'PCR_cancel_popUp' });
        //depending if is history or new, we save or just quit
        if (this.mode != 'display' && currentStep != 'step0')
            contentHTML.insert("<div>" + global.getLabel('saveChanges') + "</div>");
        else
            contentHTML.insert("<div>" + global.getLabel('sureQuitWizard') + "</div>");
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        //depending if is history or new, we save or just quit
        var callBack = function() {
            if ((Object.isEmpty(this.comeFrom) || this.mode != 'display') && currentStep != 'step0') {
                this.testFormAndDoAction('save_cancel', currentStep);
            }
            cancelPCRPopUp.close();
            delete cancelPCRPopUp;
            if (currentStep == 'step0' || this.mode == 'display') {
                this._deleteFieldPanels();
                global.goToPreviousApp();
            }
        }.bind(this);
        var callBack2 = function() {
            var enabled = false; // We want to enable buttons if necessary
		    if (!this.comeFromDraft && currentStep != 'step0') {
                //if it's not a initial step --> 0 or 1 --> no requestId yet
                if ((parseInt(this.requestId, 10) != 0) && (!Object.isEmpty(this.requestId))) {
                        enabled = true;
                    this.testFormAndDoAction('APP_PCR_CANCEL', currentStep);
                }
            }
            cancelPCRPopUp.close();
            delete cancelPCRPopUp;
            if ((this.mode != 'display' && currentStep != 'step0') || (this.comeFrom == 'Drafts' && currentStep != 'step0')) {
                this._deleteFieldPanels();
                global.goToPreviousApp();
            }
            if (!enabled)
                this._toggleButtons(true); // Enabling buttons
        }.bind(this);
        //create buttons
        var aux2 = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack2,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux2);
        buttonsJson.elements.push(aux3);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        var cancelPCRPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    cancelPCRPopUp.close();
                    delete cancelPCRPopUp;
                    // Enabling buttons
                    this._toggleButtons(true);
                }.bind(this)
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        cancelPCRPopUp.create();
    },
    /**  
    *@param searchScreen, screen where we insert the fields to search
    *@param resultScreen, screen where we insert the results from the search
    *@description Calls SAP to ake the search and inserts the result in the proper screen
    */
    makeSearch: function(searchScreen, resultScreen) {
        //Prepare the xml starting from the fields in the FieldPanel
        var jsonToSend = this.prepareXML(searchScreen);
        
        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: this.refreshResult.bind(this, resultScreen)
        }));
    },
    
    /**
    *@param fieldset, the SEARCH fieldset where we get the fields's values from
    *@description it returns the SEARCH-ID of the Advanced Search
    */
    findSID: function(fieldset){
        var aux = fieldset[0].o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field;
        for(i=0;i < aux.length;i++){
            if(aux[i]['@fieldid']=="PERNR_ADV"){
                return aux[i]['@sadv_id'];                
            }
        } 
    },
    
    
    /**
    *@param searchScreen, the screen where the fields which have to be filtered are    
    *@description it prepares the xml to send in the Advanced Search starting from the filled fields
    */
    prepareXML: function(searchScreen){
        var searchId = this.findSID(objectToArray(this.detailsHash.get(searchScreen).EWS));
        var fields = objectToArray(this.detailsHash.get(searchScreen).EWS.o_field_values.yglui_str_wid_record);        
        fields = objectToArray(fields[0].contents.yglui_str_wid_content.fields.yglui_str_wid_field);               
        //copy the field values with the right format
        var fieldsArray = $A();        
        fields.each(function(fieldData) {
            if( fieldData['@fieldid']!="PERNR_ADV" && fieldData['@fieldid']!="NAME" ){               
                if(fieldData['@value']!= "" && fieldData['@value']!= null){
                    fieldsArray.push({
                        "@fieldid": fieldData["@fieldid"],
                        "@fieldlabel": fieldData["@fieldlabel"],
                        "@fieldtechname": fieldData["@fieldtechname"],
                        "@fieldtseqnr": fieldData["@fieldseqnr"],                
                        "@value": fieldData["@value"]
                    });
                }else{
                    fieldsArray.push({
                        "@fieldid": fieldData["@fieldid"],
                        "@fieldlabel": fieldData["@fieldlabel"],
                        "@fieldtechname": fieldData["@fieldtechname"],
                        "@fieldtseqnr": fieldData["@fieldseqnr"],                
                        "@value": fieldData["#text"]
                    });
                }
            }
        });
        
        //generate the needed json for the search
        jsonToSend = {
            EWS: {
                SERVICE: "ADV_SEARCH",
               /*mvv OBJECT: {
                    "#text": global.objectId,
                    "@TYPE": global.objectType
                },*/
                PARAM: {
                    //WID_SCREEN: "SEARCH",
                    SADV_ID: searchId,
                    FILTER: {
                        //include the field values modified by the user
                        yglui_str_wid_field: fieldsArray
                    }
                }
            }
        };
        
        return jsonToSend;
        
    },
    
     /**     
    *@param col_id the id of the column
    *@param header where the columns labels are
    *@description function to find the label of a column
    *@return the label from the column or "No found" if there are no results
    */
    findLabel: function(col_id,header){
        for(i = 0;i<header.length;i++){
            if(header[i]['@colseqnr'] == col_id){
                return header[i]['@colname'];
            }

        }
        if(i>=header.length){
            return "No found";
        }
    },
    
     /**     
    *@param label, the label of the column    
    *@description function to transform the label into the key for the additional info in Re-Hire PCR
    *@return the proper key  
    */
    transformToKey: function(label){
        switch (label){
            case "Employee group":
                return "PERSG";
                break;
            case "Employee subgroup":
                return "PERSK";
                break;
            case "Personnel area":
                return "WERKS";
                break;
            default:
                break;
            
        }
    },
    
    /**  
    *@param resultScreen, the screen where we put the results from the service
    *@param json, the json of the xml-out
    *@description function to show the results in the right place
    */
    refreshResult: function(resultScreen, json) {
        var fieldSet = this.virtualHtml.down('[id$=' + resultScreen + ']');        
        fieldSet.down('.fieldPanel').update();        
        //Store the hidden fields
        if (json.EWS.o_records_found == "0") {                    
            fieldSet.down('.fieldPanel').addClassName('application_main_soft_text');        
            fieldSet.down('.fieldPanel').update(global.getLabel('noResult'));
        }else{
            if(fieldSet.down('.fieldPanel').hasClassName('application_main_soft_text') ){
                fieldSet.down('.fieldPanel').removeClassName('application_main_soft_text');
            }
            var hiddenValues = $A();
            var employeesGroup = $H();            
            var settings = objectToArray(json.EWS.o_result.header.item);
            for (var i = 0; i < settings.length; i++) {               
                if ( (settings[i]['@colname'] == "Employee group") || (settings[i]['@colname'] == "Employee subgroup") || (settings[i]['@colname'] == "Personnel area") ){
                    hiddenValues.push(settings[i]['@colseqnr']);
                }
            }
            //Store the values to show in result and store the values to fill the fields in group screen          
            var employees = objectToArray(json.EWS.o_result.values.item);
            for (var i = 0; i < employees.length; i++) {
                var container = new Element('div', { 'class': 'PCR_containerEmployee' }).insert("<div id='PCR_showDiv_" + i + "' class='PCR_employeeShow'></div><div id='PCR_details_" + i + "' class='PCR_employeeDetails'></div>");               
                var fields = objectToArray(employees[i].columns.item);                
                var pernr = employees[i]['@objid'];
                if (Object.isEmpty(pernr)) {
                    pernr = '';
                }
                //store the data to be showed
                for (var j = 0; j < fields.length; j++) {
                    var col_id = fields[j]['@colseqnr'];
                    var type = this.findLabel(col_id,settings);
                    if (type == "Date of birth") {
                        var birthDate = fields[j]['@value'];
                        var birthLabel = type;
                        if (Object.isEmpty(birthDate)) {
                            birthDate = '';
                        }
                    }                  
                    if (type == "Last name") {
                        var lastName = fields[j]['@value'];
                        if (Object.isEmpty(lastName)) {
                            lastName = '';
                        }
                    }                  
                    if (type == "First name") {
                        var firstName = fields[j]['@value'];
                        if (Object.isEmpty(firstName)) {
                            firstName = '';
                        }
                    }
                    if (type == "Country Key") {
                        var country = fields[j]['@value'];
                        var countryLabel = type;
                        if (Object.isEmpty(country)) {
                            country = '';
                        }
                    }
                }
                //now we know the pernr, make a hash with its hidden values
                employeesGroup.set(pernr, { hiddenValues: $H() });
                for (var q = 0; q < fields.length; q++) {
                    if (hiddenValues.indexOf(fields[q]['@colseqnr']) != -1)
                        employeesGroup.get(pernr).hiddenValues.set(this.transformToKey( this.findLabel(fields[q]['@colseqnr'],settings) ), { text: fields[q]['@value'] });
                }
                var radio = new Element('input', { 'id': 'PCR_radioB_' + i + '', 'class': 'PCR_radioButton', 'type': 'radio', 'name': 'PCR_employees' });
                container.down('[id=PCR_showDiv_' + i + ']').insert(radio);
                container.down('[id=PCR_showDiv_' + i + ']').insert("<div class='PCR_EmployeeText application_action_link'>" + pernr + "</div><div class='PCR_EmployeeText'>" + firstName + "</div><div class='PCR_lastName'>" + lastName + "</div>");
                container.down('[id=PCR_details_' + i + ']').insert("<div class='PCR_label application_main_soft_text'>" + countryLabel + "</div><div class='PCR_lastName'>" + country + "</div><div class='PCR_label application_main_soft_text'>" + birthLabel + "</div><div class='PCR_lastName'>" + sapToDisplayFormat(birthDate) + "</div>").hide();
                fieldSet.down('.fieldPanel').insert(container);
                if (i == 0) {
                    radio.checked = true;
                    this.refreshGroup(employeesGroup, pernr);
                }
                container.down('.PCR_EmployeeText').observe('click', this.showDetails.bind(this, i));
                radio.observe('click', this.refreshGroup.bind(this, employeesGroup, pernr));
            }
        }
    },
    
    /**  
    *@param hash, pepe
    *@param pernr, pepe
    *@description pepe
    */
    refreshGroup: function(hash, pernr) {
        this.actualPernr = pernr;
        var fields = this.groupFields.get(this.groupFields.keys()[0]);
        var employeeValues = hash.get(pernr).hiddenValues;
        for (var i = 0; i < employeeValues.keys().length; i++) {
            var key = employeeValues.keys()[i];
            var autoc = fields.get(key);
            if (key == 'PERSK') {
                this.setAutocompleterBinding = this.setAutoCompleter.bindAsEventListener(this, key, employeeValues, fields);
                document.observe("EWS:autocompleter_dataLoaded_" + autoc.options.id + autoc.options.appId + autoc.options.screen + autoc.options.record, this.setAutocompleterBinding);
            }
            else {
                var text = employeeValues.get(key).text;
                autoc._moduleInstance.setDefaultValue(text, true);
            }
        }
    },

    setAutoCompleter: function(event, key, employeeValues, fields) {
        var autoc = fields.get(key);
        var text = employeeValues.get(key).text;
        autoc._moduleInstance.setDefaultValue(text, true);
        document.stopObserving("EWS:autocompleter_dataLoaded_" + autoc.options.id + autoc.options.appId + autoc.options.screen + autoc.options.record, this.setAutocompleterBinding);
    },
    /**  
    *@param hash, pepe
    *@param pernr, pepe
    *@description pepe
    */
    showDetails: function(selector) {
        this.virtualHtml.down('[id=PCR_details_' + selector + ']').toggle();
    },
    /**
    * @description When closing / saving info in an infoPopUp, checks if the fieldPanel is ok. If not, shows a message and does not close the infoPopUp
    * @param idButton {String} Button clicked
    * @param step {String} Current step
    */
    testFormAndDoAction: function(idButton, step) {
        if (idButton == 'APP_PCR_CANCEL') {
            this.saveRequest('', idButton, step);
            return;
        }
        var isCorrect = true;
        //loop through screens to check if all fields are correct
        this.detailsHash = splitBothViews(this.infoHash.get(step).json);
        for (var i = 0; i < this.structureHash.get(step).row.keys().length; i++) {
            var columnsKeys = this.structureHash.get(step).row.get(this.structureHash.get(step).row.keys()[i]).columns.keys();
            for (var j = 0; j < columnsKeys.length; j++) {
                var screen = this.structureHash.get(step).row.get(this.structureHash.get(step).row.keys()[i]).columns.get(columnsKeys[j]).screen
                var listMode = this.detailsHash.get(screen).listMode;
                var validation = this.structureHash.get(step).row.get(this.structureHash.get(step).row.keys()[i]).columns.get(columnsKeys[j]).field.validateForm();
                if (!validation.correctForm) {
                    isCorrect = false;
                }
            }
        }
        // If all is correct but we have a table without rows --> Error
        if (isCorrect && this.table && ((Object.isEmpty(this.childField.get(step)) && this.tableErrorDiv) || (!Object.isEmpty(this.childField.get(step)) && (this.childField.get(step).keys().length == 0))) && !this.existingListValues) {
            isCorrect = false;
            if (this.tableErrorDiv) {
                this.tableErrorDiv.update(global.getLabel('add_register'));
                this.tableErrorDiv.show();
            }
            // Enabling buttons
            this._toggleButtons(true);
        }
        if (!isCorrect) {
            this.goToNext = false;
            // Enabling buttons
            this._toggleButtons(true);
        } else {
            //call to save
            this.goToNext = true;
            if (idButton == 'submitPCR0')
                this.callToGetSteps();
            //if 'SUBMIT'
            else if (idButton == 'APP_PCR_SUBMIT') {
                if (this.fastPCR)
                    this.callToGetSteps();
                else {
                //if no records, skip the save
                if (Object.isEmpty(this.infoHash.get(step).json.EWS.o_field_values) && !this.comeFromChild && this.tableErrorDiv) {
                    this.saveRequest('submit', idButton, step);
                    this.returnToOverview();
                } else {
                    this.saveRequest('', idButton, step);
                    document.stopObserving('EWS:goToSubmit');
                    document.observe('EWS:goToSubmit', function() {
                        this.saveRequest('submit', idButton, step);
                    } .bind(this));
                }
            }
            }
            //if 'SAVE'
            else
                this.saveRequest('', idButton, step);
        }
    },
    /**
    * @description Calling SAP to save a step
    * @param submit pepe
    * @param id, button id
    * @param step, current step 
    */
    saveRequest: function(submit, id, step) {
        //calculate variables to insert in the service
        var pernr = "";
        if (!this.isHire) { // Empty PERNR if we are in a Hire
            if (Object.isEmpty(this.newPernr))
                pernr = this.empId;
            else
                pernr = this.newPernr;
        }
        var buttons = this.hashOfButtons.get(step).buttons;
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i]['@action'] == id)
                var button = buttons[i];
        }
        //depending on the button, the status changes
        if (id == 'save' || id == 'save_cancel')
            var button = { "@action": "save", "@busid": "", "@disma": "", "@label_tag": "Save", "@okcode": "INS", "@screen": "*", "@status": "10", "@tarap": "", "@tarty": "", "@type": "INS" };
        if (id == 'APP_PCR_SUBMIT')
            button['@status'] = '10';
        var req_part = "00";
        if (this.stepsHash._object[step])
            req_part = this.stepsHash._object[step].data['@seqnr'];
        //build the xml, if no submit
        if (Object.isEmpty(submit)) {
            var changed = true;
            if (!Object.isEmpty(this.infoHash.get(step).json.EWS.o_field_values)) {
                var screens = objectToArray(this.infoHash.get(step).json.EWS.o_field_values.yglui_str_wid_record);
                var cont = 0;
                for (var i = 0; i < screens.length; i++) {
                    var screenName = screens[i]['@screen'];
                    var field = this.fieldPanels.get(step + '_' + screenName);
                    if (!Object.isEmpty(field.optionalsScreens.get(screenName))) {
                        var record = objectToArray(this.infoHash.get(step).json.EWS.o_field_values.yglui_str_wid_record)[i].contents.yglui_str_wid_content;
                        var recordIndex = record['@rec_index'];
                        var screenChanged = field.getScreenChange(screenName, recordIndex);
                        if (!screenChanged) {
                            cont++;
                            record.toSend = false;
                        }
                        if (cont == screens.length)
                            changed = false;
                    }
                }
            }
            if (changed) {
                var jsonSave = {
                    EWS: {
                        SERVICE: this.saveService,
                        OBJECT: { '@TYPE': 'P', '#text': pernr },
                        PARAM: {
                            REQ_ID: this.requestId,
                            APPID: this.wizardId,
                            RECORDS: { YGLUI_STR_WID_RECORD: $A() },
                            BUTTON: button,
                            REQ_PART: req_part
                        }
                    }
                };
                //if we are cancelling, we don't send records
                if (id != 'APP_PCR_CANCEL') {
                    if (!Object.isEmpty(this.infoHash.get(step).json.EWS.o_field_values))
                        var records = objectToArray(this.infoHash.get(step).json.EWS.o_field_values.yglui_str_wid_record);
                    else
                        var records = new Array();
                    //insert the records to save
                    for (var i = 0; i < records.length; i++) {
                        if (Object.isEmpty(records[i].contents.yglui_str_wid_content.toSend))
                            jsonSave.EWS.PARAM.RECORDS.YGLUI_STR_WID_RECORD.push(records[i]);
                    }
                }
                //if there are children, we insert them
                if (!Object.isEmpty(this.childField.get(step)) && (this.childField.get(step).keys().length != 0)) {
                    var keys = this.childField.get(step).keys();
                    for (var j = 0; j < keys.length; j++) {
                        var record = this.childField.get(step).get(keys[j]).json.EWS.o_field_values.yglui_str_wid_record;
                        jsonSave.EWS.PARAM.RECORDS.YGLUI_STR_WID_RECORD.push(record);
                    }
                }
                //transform the xml
                var json2xml = new XML.ObjTree();
                json2xml.attr_prefix = '@';
                this.makeAJAXrequest($H({
                    xml: json2xml.writeXML(jsonSave),
                    successMethod: this.processCallToSave.bind(this, id),
                    errorMethod: this._errorProcessCallToSave.bind(this)
                }));
            }
            else {
                document.stopObserving('EWS:goToSubmit');
                document.observe('EWS:goToSubmit', function() {
                    this.saveRequest('submit', id, step);
                } .bind(this));
                this.processCallToSave(id);
            }
        } //if it's a submit
        else {
            if (this.fastPCR)
                button['@status'] = '20';
            else
                button['@status'] = '';
            var jsonSave = {
                EWS: {
                    SERVICE: this.saveService,
                    OBJECT: { '@TYPE': 'P', '#text': pernr },
                    PARAM: {
                        REQ_ID: this.requestId,
                        APPID: this.wizardId,
                        BUTTON: button
                    }
                }
            };
            //transform the xml
            id = 'APP_PCR_DONE';
            var json2xml = new XML.ObjTree();
            json2xml.attr_prefix = '@';
            this.makeAJAXrequest($H({
                xml: json2xml.writeXML(jsonSave),
                successMethod: this.processCallToSave.bind(this, id),
                errorMethod: this._errorProcessCallToSave.bind(this)
            }));
        }
    }, 
    /**
    * @description After the save, process the call
    * @param id, button id
    * @param json with the result of the request    
    */
    processCallToSave: function(id, json) {
        if (!Object.isEmpty(id)) {
            if (parseInt(this.requestId, 10) == 0)
                this.requestId = json.EWS.o_req_head['@req_id'];
            if (id == 'APP_PCR_NEXT')
                document.fire('EWS:goToNext');
            if (id == 'APP_PCR_SUBMIT')
                document.fire('EWS:goToSubmit');
            if (id == 'APP_PCR_DONE')
                this.submitDone();
            if (id == 'save_cancel') {
                this._deleteFieldPanels();
                global.goToPreviousApp();
            }
            if (id == 'save')
                this._toggleButtons(true); // Enabling buttons
        }
    },
    /**
    * @description After the submit, show a message
    */
    submitDone: function() {
        var contentHTML = new Element('div').insert('<span class="PCR_submitDone">' + global.getLabel('submitDone') + '</span>');
        // OK Button
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack2 = function() {
            bookStatusPopUp.close();
            delete bookStatusPopUp;
            this._deleteFieldPanels();
            global.goToPreviousApp();
        }.bind(this);
        var aux2 = {
            idButton: 'ok',
            label: global.getLabel('ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack2,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        var bookStatusPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': callBack2
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'confirmation',
            width: 350
        });
        bookStatusPopUp.create();
    },
    /**
    *@param args, Arguments coming from the getContentModule 
    *@param step, current step
    *@param Okcode, okCode to insert in the service
    *@param screenAppId, appId of the screen where the pai field is
    *@param isStep0, boolean to know if the content is for a step 0 or not
    *@description When a PAI field is modified, calls to the specified service to reload the info
    */
    PAIService: function(args, step, okcode, screenAppId, isStep0) {
        //document.stopObserving('EWS:paiEvent_' + this.detailsHash.get(screenAppId).EWS.appId + '_' + this.detailsHash.get(screenAppId).EWS.o_field_settings.yglui_str_wid_fs_record['@screen'], this.PAIServiceBinding);
        var arguments = getArgs(args);
        var servicePai = arguments.servicePai;
        var requestIdToSend = "";
        if (!Object.isEmpty(this.requestId)) {
            requestIdToSend = this.requestId;
        }
        var jsonToSend = {
            EWS: {
                SERVICE: servicePai,
                OBJECT: {
                    TYPE: 'P',
                    TEXT: this.empId
                },
                PARAM: {
                    o_field_settings: this.infoHash.get(step).json.EWS.o_field_settings,
                    o_field_values: this.infoHash.get(step).json.EWS.o_field_values,
                    req_id: requestIdToSend
                }
            }
        };
        var json2xml = new XML.ObjTree();
        var screens = objectToArray(jsonToSend.EWS.PARAM.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < screens.length; i++) {
            if (screens[i]['@screen'] == screenAppId)
                screens[i].contents.yglui_str_wid_content['@selected'] = 'X';
            if (screens[i].contents.yglui_str_wid_content.fields) {
                var fields = objectToArray(screens[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                for (var a = 0; a < fields.length; a++) {
                    if (!Object.isEmpty(fields[a]['#text']))
                        fields[a]['#text'] = unescape(fields[a]['#text']);
                }
            } else {
                var records = objectToArray(screens[i].contents.yglui_str_wid_content);
                for (var b = 0; b < records.length; b++) {
                    var fields = objectToArray(records[b].fields.yglui_str_wid_field);
                    for (var a = 0; a < fields.length; a++) {
                        if (!Object.isEmpty(fields[a]['#text']))
                            fields[a]['#text'] = unescape(fields[a]['#text']);
                    }
                }
            }
        }
        json2xml.attr_prefix = '@';
        if(!this.onModifyRecord){
            //we are in a general step screen            
            this.makeAJAXrequest($H({
                xml: json2xml.writeXML(jsonToSend),
                successMethod: this.fillstep.bind(this, step, isStep0, '', true),
                errorMethod: this.PAIerror.bind(this, step, isStep0, '', true)
            }));
        }else{
            this.makeAJAXrequest($H({
                xml: json2xml.writeXML(jsonToSend),
                successMethod: this.fillstepExtra.bind(this, step, screenAppId, isStep0, '', true),
                errorMethod: this.PAIerror.bind(this, step, isStep0, '', true)
            }));            
        }
    },
    
    fillstepExtra: function(step, screen, isStep0, okCode, refresh, json){
        this.fillstep(step, isStep0, okCode, refresh, json);
        this.onButtonPCR('', this.fieldPanels.get(step + '_' + screen), this.detailsHash.get(screen).EWS.appId, screen, this.detailsHash.get(screen).listMode, step);                
    },

    PAIerror: function(step, isStep0, okCode, refresh, json) {
        this._errorMethod(json);
        this.fillstep(step, isStep0, okCode, refresh, json);
    },
    /**  
    *@param servicePai, Service to call
    *@param step, current step
    *@param Okcode, okCode to insert in the service
    *@param childIndex, Child index
    *@description When a PAI field is modified, calls to the specified service to reload the info
    */
    PAIChildService: function(servicePai, step, okcode, childIndex, screen, isNew) {
        var requestIdToSend = "";
        if (!Object.isEmpty(this.requestId)) {
            requestIdToSend = this.requestId;
        }
        var jsonToSend = {
            EWS: {
                SERVICE: servicePai,
                OBJECT: {
                    TYPE: 'P',
                    TEXT: this.empId
                },
                PARAM: {
                    o_field_settings: this.childNewJson.get(step).get(childIndex).EWS.o_field_settings,
                    o_field_values: this.childNewJson.get(step).get(childIndex).EWS.o_field_values,
                    req_id: requestIdToSend
                }
            }
        };
        var json2xml = new XML.ObjTree();
        var screens = objectToArray(jsonToSend.EWS.PARAM.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < screen.length; i++) {
            if (screens[i]['@screen'] == screen)
                screens[i].contents.yglui_str_wid_content['@selected'] = 'X';
            var fields = objectToArray(screens[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
            for (var a = 0; a < fields.length; a++) {
                if (!Object.isEmpty(fields[a]['#text']))
                    fields[a]['#text'] = unescape(fields[a]['#text']);
            }
        }
        json2xml.attr_prefix = '@';
        //if we are in an 'add child screen'
        this.child = false;
        if (Object.isEmpty(isNew))
            isNew = '';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: this.addChild.bind(this, step, isNew, '', true, childIndex),
            errorMethod: this.addChildPaiError.bind(this, step, isNew, '', true, childIndex)
        }));
    },

    addChildPaiError: function(step, isStep0, okCode, refresh, childIndex, json) {
        this._errorMethod(json);
        this.addChild(step, isStep0, okCode, refresh, childIndex, json);
    },
    /**
    * @description Reacts to the event fired when a button inside a getContentModule is clicked
    */
    onButtonPCR: function() {
        //Variables declarations
        var args = $A(arguments);
        var appId = args[2];
        var data = getArgs(args[0]);
        var listMode = args[4];
        var screen = args[3];
        var panel = args[1];
        var step = args[5];
        // Child PAI
        if (Object.isEmpty(data)) {
            data = {};
            data.screen = screen;
            // It will continue being 'MOD'
            data.okcode = 'MOD';
            // First field's record (we don't know the previous one, so we select the first one)
            data.recKey = panel.screensNavigationLayerData.get(screen).get('values')[0].yglui_str_wid_content['@rec_index'];
        }
        //document.stopObserving('EWS:pcrChange_' + args[2] + '_' + args[3], this.onButtonPCRBinding);
        switch (data.okcode) {

            //Modify a record                   

            case 'MOD':
                if(!this.onModifyRecord){
                    this.onModifyRecord = true;
                }
                this.jsonBeforeChange = deepCopy(this.contentJson);
                panel.toggleMode('edit', panel.appId, data.screen, data.recKey);
                if (this.virtualHtml.down('.application_pcr_optionLinks'))
                    this.virtualHtml.down('.application_pcr_optionLinks').hide();
                this.PCR_wizard.getContainer().insert('<div id="application_pcr_changeButtonCont"></div>');
                this.createFormControlButtons(panel, this.PCR_wizard.getContainer(), appId, screen, false, listMode);

                break;

            //Delete a record                   

            case 'DEL':
                this.deleteRecord(data, panel, appId, screen);
                break;

            //Delimit                   

            case 'LIS9':
                this.delimitRecord(data, panel, appId, screen, step);
                break;
        }
    },

    delimitRecord: function(data, panel, appId, screen, step) {
        var systemDate = objectToSap(Date.today()).split('-').join('');
        //creating DatePicker
        var contentHTML = new Element('div', { 'id': 'PCR_contentPopUp', 'class': 'PCR_delimit_popUp' }).insert('<div id="PCR_datePickerPopUp" class="PCR_datePicker_popUp"></div>');
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function() {
            var newDateObject = this.PCRDelimit.actualDate.add({ days: -1 });
            var newDate = objectToSap(newDateObject);
            //update json
            var keepLooping = true;
            var records = objectToArray(this.detailsHash.get(screen).EWS.o_field_values.yglui_str_wid_record);
            for (var i = 0; i < records.length && keepLooping; i++) {
                if (records[i].contents.yglui_str_wid_content['@rec_index'] == data.recKey) {
                    var fields = objectToArray(records[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                    for (var j = 0; j < fields.length && keepLooping; j++) {
                        if (fields[j]['@fieldid'] == "ENDDA") {
                            fields[j]['@value'] = newDate;
                            keepLooping = false;
                        }
                    }
                }
            }
            delimitPCRPopUp.close();
            delete delimitPCRPopUp;
            //destroy the old getcontentmodule
            panel.destroy();
            delete panel;
            var json = this.infoHash.get(step).json;
            this.fillstep(step, false, null, "", json);
        }.bind(this);
        var callBack2 = function() {
            delimitPCRPopUp.close();
            delete delimitPCRPopUp;
        };
        var aux2 = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack2,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux2);
        buttonsJson.elements.push(aux3);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        var delimitPCRPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    delimitPCRPopUp.close();
                    delete delimitPCRPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 600
        });
        delimitPCRPopUp.create();
        this.PCRDelimit = new DatePicker('PCR_datePickerPopUp', {
            defaultDate: systemDate,
            manualDateInsertion: true,
            draggable: true,
            startDay: 1
        });
    },

    deleteRecord: function(data, panel, appId, screen) {
        var contentHTML = new Element('div', { 'class': 'PCR_cancel_popUp' });
        contentHTML.insert("<div class='moduleInfoPopUp_std_leftMargin'>" + global.getLabel('deleteRequest') + "</div>");
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            cancelPCRPopUp.close();
            delete cancelPCRPopUp;
        };
        var callBack2 = function() {
            // this.deleteRequest(reqId, appId);
            cancelPCRPopUp.close();
            delete cancelPCRPopUp;
        };
        var aux2 = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack2,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux2);
        buttonsJson.elements.push(aux3);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        var cancelPCRPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    cancelPCRPopUp.close();
                    delete cancelPCRPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        cancelPCRPopUp.create();
    },
    /**
    * Creates the form buttons like Save and Cancel and set the appropiated callbacks for them
    * @param panel Panel to make the insertion
    * @param container The panel container
    * @param appId The application id
    * @param screen The widget screen
    * @param newRecord Indicates whether this is a new record or not
    * @param listMode Indicates whether this is in list mode or not
    */
    createFormControlButtons: function(panel, container, appId, screen, newRecord, listMode) {
        //create buttons
        var jsonButtons = {
            elements: [],
            mainClass: 'application_pcr_changeButtons'
        };
        var doneButton = {
            label: global.getLabel('done'),
            idButton: 'done',
            className: 'getContentButtons fieldDispFloatRight',
            handlerContext: null,
            handler: this.recordChanged.bind(this, 'done', panel, container, appId, screen, newRecord, listMode),
            type: 'button',
            standardButton: true
        };
        var cancelButton = {
            label: global.getLabel('cancel'),
            idButton: 'cancel',
            className: 'getContentButtons fieldDispFloatRight',
            handlerContext: null,
            handler: this.recordChanged.bind(this, 'cancel', panel, container, appId, screen, newRecord, listMode),
            type: 'button',
            standardButton: true
        };
        jsonButtons.elements.push(cancelButton);
        jsonButtons.elements.push(doneButton);
        var ButtonJobProfile = new megaButtonDisplayer(jsonButtons);
        this.PCR_wizard.getContainer().down('div#application_pcr_changeButtonCont').update(ButtonJobProfile.getButtons());
        this.PCR_wizard.getContainer().down('div#application_pcr_changeButtonCont').show();
        this.PCR_wizard.getNormalButtons().hide();

    },
    recordChanged: function(button, panel, container, appId, screen, newRecord, listMode) {        
        this.onModifyRecord = false;        
        if (button == 'done') {
            var json = this.contentJson;
        } else if (button == 'cancel') {
            var json = this.jsonBeforeChange;
        }
        //destroy the old getcontentmodule
        panel.destroy();
        //hide 'change' buttons, and show normal buttons
        this.PCR_wizard.getContainer().down('div#application_pcr_changeButtonCont').hide();
        this.PCR_wizard.getNormalButtons().show();
        var step = panel.name.replace(screen + '_', '');
        this.fillstep(step, false, null, "", json);
    },

    /**  
    *@param step, step id to retrieve the info for this step
    *@param isStep0, boolean to know if the content is for a step 0 or not
    *@param Okcode, depending on this we create the fieldsPanel in one way or another
    *@param refresh, if true refres the json with a PAI service
    *@param childIndex, Child index
    *@param json, json with the information
    *@description create a fieldsPanel with the children info
    */
    addChild: function(step, isStep0, okCode, refresh, childIndex, json) {
        if (this.tableErrorDiv && this.tableErrorDiv.visible()) {
            this.tableErrorDiv.update("");
            this.tableErrorDiv.hide();
        }
        if (Object.isEmpty(this.childIndex.get(step)))
            this.childIndex.set(step, 1);
        var childId =  Object.isEmpty(childIndex) ? 'row' + this.childIndex.get(step) : childIndex; 
        var tmode = 'edit';
        // RequestId as argument for the fieldPanel
        var fieldValueAppend = new Hash();
        if ((parseInt(this.requestId, 10) != 0) && (!Object.isEmpty(this.requestId)))
            fieldValueAppend.set('*', '<REQID>' + this.requestId + '</REQID>');
        //if not coming from PAI
        if (Object.isEmpty(refresh)) {
            if (Object.isEmpty(this.childNewJson.get(step)))
                this.childNewJson.set(step, new Hash());
            this.childNewJson.get(step).set(childId, json);
            tmode = 'create';
        }
        //coming from PAI
        else {
            this.childNewJson.get(step).get(childId).EWS.o_field_settings = json.EWS.o_field_settings;
            this.childNewJson.get(step).get(childId).EWS.o_field_values = json.EWS.o_field_values;
            this.childField.get(step).get(childId).destroy();
        }
        var mainContainer = this.PCR_wizard.getContainer();
        var screen = this.childNewJson.get(step).get(childId).EWS.o_field_settings.yglui_str_wid_fs_record['@screen'];
        if (Object.isEmpty(refresh))
            this.virtualHtml.down('[id=PCR_fieldSet_' + screen + ']').hide();
        //remove list_mode = X, to show just a panel
        this.childNewJson.get(step).get(childId).EWS.o_widget_screens.yglui_str_wid_screen['@list_mode'] = '';
        //create the new fieldsPanel
        var childFP = new getContentModule({
            appId: this.wizardId,
            mode: tmode,
            displayActionsOnEdit: true,
            json: deepCopy(this.childNewJson.get(step).get(childId)),
            showCancelButton: false,
            cssClasses: $H({ tcontentSimpleTable: 'PCR_stepsWithTable' }),
            buttonsHandlers: $H({
                //DEFAULT_EVENT_THROW: 'EWS:pcrChange_' +step + '_add_' + screen,               
                paiEvent: function(args) {
                    var arguments = getArgs(args);
                    arguments.childId = childId;
                    document.fire('EWS:paiEventChild_' + this.wizardId + '_' + screen, arguments)
                }.bind(this)
            }),
            showButtons: $H({
                edit: false,
                display: false,
                create: false
            }),
            getFieldValueAppend: fieldValueAppend
        });
        if (Object.isEmpty(this.childField.get(step)))
            this.childField.set(step, new Hash());
        this.childField.get(step).set(childId, childFP);
        if (Object.isEmpty(refresh)) {
            document.stopObserving('EWS:paiEventChild_' + this.wizardId + '_' + screen);
            document.observe('EWS:paiEventChild_' + this.wizardId + '_' + screen, function(args) {
                var servicePai = getArgs(args).servicePai;
                var row = getArgs(args).childId;
                this.PAIChildService(servicePai, step, okCode, row, screen, isStep0);
            }.bind(this));
        }
        this.childNewJson.get(step).get(childId).EWS = this.childField.get(step).get(childId).json.EWS;
        var fieldsPanelChild = this.childField.get(step).get(childId).getHtml();
        if (Object.isEmpty(refresh))
            mainContainer.insert('<div id="PCR_addChildMainCont" class="PCR_columns_container"><fieldset id="PCR_addChild" class="' + this.fieldSetClass + '"></fieldset><div id="PCR_addChildError" class="PCR_ContainerdinamicButtons"></div><div id="PCR_addChildButtons" class="PCR_ContainerdinamicButtons"></div></div>');
        if (mainContainer.down("[id=PCR_addChild]"))
            mainContainer.down("[id=PCR_addChild]").update(fieldsPanelChild);
        else
            mainContainer.down("[id=" + childIndex + "]").update(fieldsPanelChild);
        if (Object.isEmpty(refresh)) {
            var normalButtons = this.PCR_wizard.getNormalButtons();
            normalButtons.hide();
        }
        //create buttons
        var jsonButtons = {
            elements: []
        };
        // Creations
        if (mainContainer.down('[id=PCR_addChildButtons]')) {
            var doneButton = {
                label: global.getLabel('done'),
                idButton: 'done',
                className: 'getContentButtons fieldDispFloatRight',
                handlerContext: null,
                handler: this.doneChildAdded.bind(this, this.childNewJson.get(step).get(childId), this.childField.get(step).get(childId), step, isStep0, childId),
                type: 'button',
                standardButton: true
            };
            var cancelButton = {
                label: global.getLabel('cancel'),
                idButton: 'cancel',
                className: 'getContentButtons fieldDispFloatRight',
                handlerContext: null,
                handler: this.cancelledChildAdded.bind(this, this.contentJson, step, childId),
                type: 'button',
                standardButton: true
            };
            jsonButtons.elements.push(cancelButton);
            jsonButtons.elements.push(doneButton);
            var ButtonJobProfile = new megaButtonDisplayer(jsonButtons);
            mainContainer.down('[id=PCR_addChildButtons]').update(ButtonJobProfile.getButtons());
        }
        // Updates (table)
        else {
            var buttonContainer = '[id=' + childIndex + ']';
            var updateButton = {
                idButton: 'Update',
                label: global.getLabel('update'),
                handler: this.doneChildAdded.bind(this, this.childNewJson.get(step).get(childId), this.childField.get(step).get(childId), step, false, childIndex),
                className: 'application_action_link pcr_openWizard_button',
                type: 'link'
            };
            jsonButtons.elements.push(updateButton);
            var ButtonJobProfile = new megaButtonDisplayer(jsonButtons);
            mainContainer.down('[id=' + childIndex + ']').insert(ButtonJobProfile.getButtons());
        }
        // Removing 'Loading...' messages
        var panels = this.fieldPanels.get(step + '_' + screen).element.select('.fieldPanel');
        var length = panels.length;
        for (var i = 0; i < length; i++) {
            if (panels[i].down() && panels[i].down().down()) {
                var errorDiv = panels[i].down().down();
                if (Object.isEmpty(errorDiv.id) && !Object.isEmpty(errorDiv.innerHTML))
                    errorDiv.update("");
            }
        }
        // Enabling buttons
        this._toggleButtons(true);
    },
    /**  
    *@param json, json with the information
    *@param fieldsPanel, getContentModule object
    *@param step, current step
    *@param isStep0, if it's step0 or not
    *@param rowId, the Id of the row where the new child is
    *@description pepe
    */
    doneChildAdded: function(json, fieldsPanel, step, isStep0, rowId) {
        this.comeFromChild = true;
        var validation = fieldsPanel.validateForm();
        if (!validation.correctForm) {
            //show error msg
            var error = validation.errorMessage;
            this.virtualHtml.down("[id='PCR_addChildError']").update(error);
        } else {
            //keep in hash to save it later
            if (!Object.isEmpty(this.virtualHtml.down("[id='PCR_addChildError']")))
                this.virtualHtml.down("[id='PCR_addChildError']").update('');
            var buttons = objectToArray(fieldsPanel.json.EWS.o_screen_buttons.yglui_str_wid_button);
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i]['@okcode'] == 'INS') {
                    buttons[i]['@status'] = 10;
                    var button = buttons[i];
                }
            }
            var textContainer = $A();
            var newRow = (isStep0 == 'newChild');
            if (newRow)
                fieldsPanel.json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@rec_index'] = 1;
            var fields = objectToArray(fieldsPanel.json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
            var fieldSettings = objectToArray(fieldsPanel.json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);
            for (var i = 0; i < fieldSettings.length; i++) {
                if (fieldSettings[i]['@fieldtype'] == 'H') {
                    var fieldId = fieldSettings[i]['@fieldid'];
                    var seqnr = fieldSettings[i]['@seqnr'];
                    for (var j = 0; j < fields.length; j++) {
                        if (fieldId == fields[j]['@fieldid']) {
                            var fieldDisplayers = fieldsPanel.fieldDisplayers;
                            var fieldType = fieldsPanel.fieldDisplayers.get(fieldsPanel.fieldDisplayers.keys().first()).get(fieldId).options.fieldType;
                            var text = fieldsPanel.fieldDisplayers.get(fieldsPanel.fieldDisplayers.keys().first()).get(fieldId).jsonInsertion.get(fieldType).text;
                            textContainer[parseInt(seqnr)] = fields[j][text];
                        }
                    }
                }
            }
            textContainer = textContainer.compact();
            var dataTable = $H();
            var detailsDiv = new Element('div', { id: rowId });
            detailsDiv.update(fieldsPanel.getHtml());
            //Creation of update button
            var buttonsJson = {
                elements: []
            };
            var aux = {
                idButton: 'updateButton' + rowId,
                label: global.getLabel('update'),
                handler: this.doneChildAdded.bind(this,json, fieldsPanel, step, false, rowId),
                className: 'application_action_link pcr_openWizard_button',
                type: 'link'
            };
            buttonsJson.elements.push(aux);
            var buttonUpdate = new megaButtonDisplayer(buttonsJson);
            detailsDiv.insert(buttonUpdate.getButtons());
            dataTable.set(rowId, { data: [], element: detailsDiv });
            for (var a = 0; a < textContainer.length; a++) {
                if (textContainer[a].split('-').length != 3)
                    dataTable.get(rowId).data.push({ text: textContainer[a] });
                else
                    dataTable.get(rowId).data.push({ text: sapToDisplayFormat(textContainer[a]) });
            }
            var screen = this.childNewJson.get(step).get(rowId).EWS.o_field_settings.yglui_str_wid_fs_record['@screen'];
            if (newRow) {
                this.fieldPanels.get(step + '_' + screen).listModeTable.addRow(dataTable);
                this.fieldPanels.get(step + '_' + screen).listModeTableElement.show();
                this.fieldPanels.get(step + '_' + screen).listModeTableNoResultsDiv.hide();
            }
            else
                this.fieldPanels.get(step + '_' + screen).listModeTable.updateRow(rowId, dataTable);
            if (!Object.isEmpty(this.virtualHtml.down('[id=PCR_addChildMainCont]')))
                this.virtualHtml.down('[id=PCR_addChildMainCont]').remove();
            var fieldset = this.virtualHtml.down('[id=PCR_fieldSet_' + json.EWS.o_field_settings.yglui_str_wid_fs_record['@screen'] + ']');
            fieldset.show();
            //if (!Object.isEmpty(fieldset.down('[id=table_empty_div]')))
            //  fieldset.down('[id=table_empty_div]').hide();
            this.PCR_wizard.getNormalButtons().show();
            if (newRow)
                this.childIndex.set(step, this.childIndex.get(step)+1);
            // Removing 'Loading...' messages
            var panels = this.fieldPanels.get(step + '_' + screen).element.select('.fieldPanel');
            var length = panels.length;
            for (var i = 0; i < length; i++) {
                if (panels[i].down() && panels[i].down().down()) {
                    var errorDiv = panels[i].down().down();
                    if (Object.isEmpty(errorDiv.id) && !Object.isEmpty(errorDiv.innerHTML))
                        errorDiv.update("");
                }
            }
        }
    },
    /**  
    *@param json, pepe
    *@description pepe
    */
    cancelledChildAdded: function(json, step, childId) {
        this.childField.get(step).unset(childId);
        this.virtualHtml.down('[id=PCR_addChildMainCont]').remove();
        this.virtualHtml.down('[id=PCR_fieldSet_' + json.EWS.o_field_settings.yglui_str_wid_fs_record['@screen'] + ']').show();
        this.PCR_wizard.getNormalButtons().show();
    },
    /**  
    *@param array, An array with unsorted items
    *@description Returns a sorted array
    */
    sortArray: function(array) {
        var k;
        for (var i = 0; i < array.length; i++) {
            k = i;
            for (var j = i + 1; j < array.length; j++) {
                if (parseInt(array[j].seqnr, 10) < parseInt(array[k].seqnr, 10)) {
                    var tmp = array[k];
                    array[k] = array[j];
                    array[j] = tmp;
                    k = j - 1;
                }
            }
        }
        return array;
    },
    /**
    *@param $super The superclass: PCR_Overview_standard
    *@description Closes the application
    */
    close: function($super) {
        $super();
        document.stopObserving('EWS:PCR_buttonClicked', this.onButtonClickedBinding);
        this.newPernr = '';
        document.stopObserving('EWS:goToSubmit');
        document.stopObserving('EWS:goToNext');
        this.actualPernr = null;
        this.comeFromChild = false;
    },
    /**
    *@description Destroys all/one step's fieldPanels
    *@param step, Step whose fieldPanels we want to destroy (if this parameter is missing, we will destroy all steps' fieldPanels)
    */
    _deleteFieldPanels: function(step) {
        var keys = this.fieldPanels.keys();
        var length = keys.length;
        // Filtering step's fieldPanels
        if (!Object.isEmpty(step)) {
            var filteredKeys = new Array();
            for (var i = 0; i < length; i++) {
                if (keys[i].include(step))
                    filteredKeys.push(keys[i]);
            }
            keys = filteredKeys;
            length = keys.length;
        }
        for (var i = 0; i < length; i++) {
            var fieldPanel = this.fieldPanels.get(keys[i]);
            fieldPanel.destroy();
            this.fieldPanels.unset(keys[i]);
        }
    },
    /**
    * @description Shows the confirmation popUp for fast PCRs
    * @param step {String} Current step
    */
    confirmFastPCR: function(step) {
        var contentHTML = new Element('div');
        var text = global.getLabel("areYouSureFast") + "<br /><br />" + global.getLabel("pressYes") + "<br />" + global.getLabel("pressNo");
        contentHTML.insert(text);
        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBackYes = function() {
            fastPCRPopUp.close();
            delete fastPCRPopUp;
            this.testFormAndDoAction('APP_PCR_SUBMIT', step);
        }.bind(this);
        var callBackNo = function() {
            fastPCRPopUp.close();
            delete fastPCRPopUp;
            // Enabling buttons
            this._toggleButtons(true);
        }.bind(this);
        var yesButton = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBackYes,
            type: 'button',
            standardButton: true
        };
        var noButton = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBackNo,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(yesButton);
        buttonsJson.elements.push(noButton);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        // Insert buttons in div
        contentHTML.insert(buttons);
        var fastPCRPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('close'),
                'callBack': function() {
                    fastPCRPopUp.close();
                    delete fastPCRPopUp;
                    // Enabling buttons
                    this._toggleButtons(true);
                }.bind(this)
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 550
        });
        fastPCRPopUp.create();
    },
    /**
    *@description Disables/Enables PCR buttons
    *@param enable, Says if buttons will be enabled (true) or not (false)
    */
    _toggleButtons: function(enable) {
        if (this.ButtonsPCR) {
            var buttons = this.ButtonsPCR.getButtonsArray().keys();
            var length = buttons.length;
            for (var i = 0; i < length; i++) {
                if (enable)
                    this.ButtonsPCR.enable(buttons[i]);
                else
                    this.ButtonsPCR.disable(buttons[i]);
            }
        }
        if (this.PCR_wizard && this.PCR_wizard.moduleNormalButtons) {
            var wizardButtons = this.PCR_wizard.moduleNormalButtons.keys();
            length = wizardButtons.length;
            for (var i = 0; i < length; i++) {
                if (enable)
                    this.PCR_wizard.moduleNormalButtons.get(wizardButtons[i]).enable(wizardButtons[i]);
                else
                    this.PCR_wizard.moduleNormalButtons.get(wizardButtons[i]).disable(wizardButtons[i]);
            }
        }
        if (this.buttonsPCRstep0) {
            var buttonsStep0 = this.buttonsPCRstep0.getButtonsArray().keys();
            var length = buttonsStep0.length;
            for (var i = 0; i < length; i++) {
                if (enable)
                    this.buttonsPCRstep0.enable(buttonsStep0[i]);
                else
                    this.buttonsPCRstep0.disable(buttonsStep0[i]);
            }
        }
    },
    /**
    *@description Failure method for saveRequest and other services
    *@param json, Backend response
    */
    _errorProcessCallToSave: function(json) {
        this._errorMethod(json);
        // Enabling buttons
        this._toggleButtons(true);
    },
    /**
    * @description Gets a fastPCR reqID and calls to saveRequest
    * @param submit, says if it is a submit or not
    * @param id, button id
    * @param step, current step
    * @param json, json with the information
    */
    _saveFastRequest: function(submit, id, step, json) {
        this.requestId = json.EWS.o_req_head['@req_id'];
        this.saveRequest(submit, id, step);
    }
});