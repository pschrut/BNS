/**
*@fileOverview Onb_Steps.js
*@description It contains the Onb Wizard class and its methods
*/
/**
*@constructor
*@description Class with general functionality for the Onb Wizard class
*@augments Application
*/
var TimeSchedule = Class.create(Application,
/**
*@lends Onb_Steps
*/
    {
    /** 
    * Service 
    * @type String
    */
    serviceGetWizard: 'GET_WIZARD2',
    getContentService: 'GET_STEP_WS',
    getPeriodService: 'GET_PERWS',
    getWorkScheduleService: 'GET_WSRULE',
    getAreaService: 'GET_AREAS',
    getGroupService: 'GET_EEGRPS',
    getSubmitService: 'SUBMIT_WSRULE',
    SaveService: 'SAVE_PERWS',
    getPingService: 'EOB_PING_DEV',

    key: '',
    reqId: '000000',
    ping: '',
    pingMessage: '',
    new_wizard: 'X',


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
    /*
    *@param $super: the superclass: Onb_Steps
    *@description instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
        this.onButtonClickedBinding = this.onButtonClicked.bindAsEventListener(this);
        this._selectPeriodBinding = this._selectPeriod.bind(this);
        this._openPeriodBinding = this._openPeriod.bindAsEventListener(this);
        this._openWorkScheduleBinding = this._openWorkSchedule.bindAsEventListener(this);
    },
    /*
    *@param $super: the superclass: Onb_Steps
    *@description This is the first method executed when the application is opened 
    */
    run: function($super, args) {
        $super(args);
        //retrieve arguments given by the overview / other app
        document.observe('EWS:PeriodSelected', this._selectPeriodBinding);
        document.observe('EWS:PeriodClick', this._openPeriodBinding);
        document.observe('EWS:WorkScheduleClick', this._openWorkScheduleBinding);

        this.wizardId = 'WSR_WORK';

        if (this.firstRun)
            this.ping();
        if (args) {
            this.reqId = args.get('reqId');

            if (args.get('reqId')) {
                this.new_wizard = '';
                if (this.step.include('01')) {
                    this._getPeriod("2", "1", this.step, false);
                    //this._getPeriod(searchScreen, groupScreen, step, false);
                }
                if (this.step.include('02')) {
                    this._getWorkSchedule("2", "1", this.step, false);
                    //this._getWorkSchedule(searchScreen, groupScreen, step, false);
                }
            } else {
                this.reqId = '000000';
                this.new_wizard = 'X';
            }
        }

        //if the wizard is empty, create necessary divs
        if (!Object.isEmpty(this.new_wizard)) {

            this.infoHash = new Hash();
            this.detailsHash = new Hash();
            this.prevApp = args.get('prevApp');
            this.prevTab = args.get('prevTab');
            this.prevView = args.get('prevView');
            var html = "<table class='Onb'><tr><td id='company' ></td></tr><tr><td id='container'></td></tr></table>"
            this.virtualHtml.update('');
            this.virtualHtml.insert(html);
            this.virtualHtml.down('[id=company]').insert("<div id='company_name' class='Onb_Title application_main_title2'>" + global.getCompanyName() + "</div></br>");
            this.containerDiv = new Element('div', {
                'id': 'Onb_steps_container',
                'class': 'Onb_steps_container_css'
            });
            this.virtualHtml.down('[id=container]').insert(this.containerDiv);
            this.callToGetSteps();
        }
        //Observers
        document.observe('EWS:Onb_buttonClicked', this.onButtonClickedBinding);
    },

    ping: function() {
        // ping 
        var xml = "<EWS>"
                  + "<SERVICE>" + this.getPingService + "</SERVICE>"
                  + "<PARAM/>"
                  + "</EWS>";

        this.makeAJAXrequest($H({ xml: xml,
            successMethod: 'showPing',
            failureMethod: 'showPing', errorMethod: 'showPing', informationMethod: 'showPing'
        }));
    },

    showPing: function(Json) {
        this.ping = Json.EWS.o_ping_ok;
        this.pingMessage = Json.EWS.messages.item['#text'];
    },

    /**  
    *@description Calls SAP to get the list of steps
    */
    callToGetSteps: function() {
        var xml_in = ''
                    + '<EWS>'
                      + '<SERVICE>' + this.serviceGetWizard + '</SERVICE>'
                      + '<PARAM>'
                        + '<APPID>' + this.wizardId + '</APPID>'
                      + '</PARAM>'
                    + '</EWS>';
        //off line
        // this.method = 'GET';
        // this.url = 'standard/Onboarding/XMLOUT_GETWIZARD.xml';
        this.makeAJAXrequest($H({
            xml: xml_in,
            successMethod: 'processSteps'
            , failureMethod: 'processSteps'
            , errorMethod: 'processSteps'
            , informationMethod: 'processSteps'
        }));
    },

    /**  
    *@param json The json with the list of steps and some other info (mandatory..)
    *@description Create data structures for buttons, steps, contents...
    */
    processSteps: function(json) {
        this.json = json;
        if (!Object.isEmpty(this.step0containerDiv))
            this.step0containerDiv.update('');
        //build the steps hash
        var steps = objectToArray(json.EWS.o_steps.yglui_str_wzstps);
        for (var i = 0; i < steps.length; i++) {
            this.stepsHash.set(steps[i]['@wiz_stpid'], { data: steps[i] })
        }
        //build buttons hashes
        var topButtons = $H({});
        this.normalButtons = $H({});
        //create a custom structure with the steps (will be top buttons in the wizard)
        var buttonsArray = objectToArray(this.json.EWS.o_steps.yglui_str_wzstps);
        for (var i = 0; i < buttonsArray.length; i++) {
            if (Object.isEmpty(buttonsArray[i]['@mandatory']))
                var mandatory = false;
            else
                var mandatory = true;
            var order = parseInt(buttonsArray[i]['@seqnr'], 10);
            topButtons.set(buttonsArray[i]['@wiz_stpid'], { mandatory: mandatory,
                visited: false, order: order
            });
        }
        //create the hasrdoced buttons
        this.normalButtons.set("previous",
                { data: { action: "previous", disma: "M", label_tag: "Previous", okcode: "", screen: "*", tarap: "", tarty: "A", type: "" }
                });

        //instantiate the module 'wizard'
        this.Onb_wizard = new Wizard({
            topButtons: topButtons,
            normalButtons: this.normalButtons,
            container: this.containerDiv,
            events: $H({ onClicked: 'EWS:Onb_buttonClicked' })
        });
        for (var i = 0; i < topButtons.keys().length; i++) {
            if (topButtons.get(topButtons.keys()[i]).order == 1)
                var step = topButtons.keys()[i];
        }
        //get the content of each step
        this.Onb_wizard.containerNormalButtons.down('[id=previous_previous]').hide();
        this.step = step;
        this.getContentStep(step);
    },
    /**  
    *@param Event Event launched when a button (top or bottom)is clicked
    *@description Reacts to the button clicked properly: going forward, backward, staying...
    */
    onButtonClicked: function(event) {
        var args = getArgs(event);
        var currentStep = args.currentStep;
        //If BOTTOM buttons
        if (args.action) {
            switch (args.action) {//button clicked
                //Go backward                                                                                                                                                                                                                                                                                                                  
                case 'previous':
                    var previous = this.Onb_wizard.getPreviousStep(currentStep);
                    this.step = previous;
                    this.virtualHtml.down('[id=stepDescription]').update(global.getLabel(this.step));
                    document.stopObserving('EWS:goToNext');
                    //if the step has not been visited yet, we need to retrieve info from SAP
                    if (!this.Onb_wizard.isVisited(previous)) {
                        this.getContentStep(previous);
                    }
                    else {
                        //if the step has already been visited, we just show its information
                        var dinamicButtons = this.createDinamicButtons(previous);
                        this.Onb_wizard.addButtons(dinamicButtons);
                        this.Onb_wizard.goToStep(previous);
                        if (this.stepsHash.get(previous).data['@seqnr'] == 01) {
                            this.Onb_wizard.containerNormalButtons.down('[id=previous_previous]').hide();
                        }
                    }
                    break;
                //Go forward                                                                                                                                                                                                                                                                                                                  
                case 'APP_Onb_NEXT':
                    var next = this.Onb_wizard.getNextStep(currentStep);
                    this.step = next;
                    this.virtualHtml.down('[id=stepDescription]').update(global.getLabel(this.step));

                    if (this.stepsHash.get(next).data['@seqnr'] != 01) {
                        document.observe('EWS:showButton', function() {
                            this.Onb_wizard.containerNormalButtons.down('[id=previous_previous]').show();
                        } .bind(this));
                    }
                    this.getContentStep(next);
                    break;

                //Clicked on submit                          
                case 'APP_Onb_SUBMIT':
                    this.Submit();
                    break;
                //Clicked on cancel                                                                                                                                                                                                                                                                                                                  
                case 'APP_Onb_CANCEL':
                    this._back();
                    break;

            }
        }
        //TOP BUTTONS
        if (args.nextStep) {//step clicked
            var numberCurrent = this.stepsHash.get(currentStep).data['@seqnr'];
            var numberNext = this.stepsHash.get(args.nextStep).data['@seqnr'];
            this.step = args.nextStep;

            this.virtualHtml.down('[id=stepDescription]').update(global.getLabel(this.step));

            if (numberNext > numberCurrent) {
                var action = 'APP_Onb_NEXT';

                if (this.stepsHash.get(args.nextStep).data['@seqnr'] != 01) {
                    document.observe('EWS:showButton', function() {
                        this.Onb_wizard.containerNormalButtons.down('[id=previous_previous]').show();
                    } .bind(this));
                }
                this.getContentStep(args.nextStep);
            }
            else {
                var action = 'previous';
                document.stopObserving('EWS:goToNext');
                if (!this.Onb_wizard.isVisited(args.nextStep)) {
                    this.getContentStep(args.nextStep);
                }
                else {
                    var dinamicButtons = this.createDinamicButtons(args.nextStep);
                    this.Onb_wizard.addButtons(dinamicButtons);
                    this.Onb_wizard.goToStep(args.nextStep);
                    if (this.stepsHash.get(args.nextStep).data['@seqnr'] == 01) {
                        this.Onb_wizard.containerNormalButtons.down('[id=previous_previous]').hide();
                    }
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
        this.OkCode = '';
        var xml_in_getContent = '<EWS>'
                                        + '<SERVICE>' + this.getContentService + '</SERVICE>'
                                        + '<OBJECT TYPE=""></OBJECT>'
                                        + '<PARAM>'
                                            + '<REQID>' + this.reqId + '</REQID>'
                                            + '<APPID>' + step + '</APPID>'
                                            + '<WID_SCREEN>*</WID_SCREEN>'
                                        + '</PARAM>'
                                        + '</EWS>';
        //this.method = 'GET';
        //this.url = 'standard/Onboarding/XMLOUT_GET_STEP_WS.xml';
        var sucessMethod = this.fillstep;
        this.makeAJAXrequest($H({
            xml: xml_in_getContent,
            successMethod: sucessMethod.bind(this, step, isStep0, this.OkCode, '')
        }));
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

        delete json.EWS.o_wid_pos;
        this.contentJson = json;
        this.detailsHash.set(step, { json: splitBothViews(this.contentJson) });
        this.infoHash.set(step, { json: this.contentJson });
       
        /*  if (this.structureHash.get(this.step)) {
        var fieldsRows = this.structureHash.get(this.step).row;
        for (var i = 0; i < fieldsRows.keys().length; i++) {
        var fiedlsColumns = fieldsRows.get(fieldsRows.keys()[i]).columns;
        for (var j = 0; j < fiedlsColumns.keys().length; j++) {
        fiedlsColumns.get(fiedlsColumns.keys()[j]).field.destroy();
        }
        }
        }*/        

        //loop through screens          
        var OnbScreens = deepCopy(objectToArray(this.contentJson.EWS.o_step_screens.yglui_str_wid_attributes));
        //screen sorting (row)    
        for (var i = 0; i < OnbScreens.length; i++) {
            for (var j = 0; j < OnbScreens.length - 1; j++) {
                if (OnbScreens[j]["@widrow"] > OnbScreens[j + 1]["@widrow"]) {
                    var temp = OnbScreens[j];
                    OnbScreens[j] = OnbScreens[j + 1];
                    OnbScreens[j + 1] = temp;
                }
            }
        }
        //special code for REHIRE step0     
        for (var j = 0; j < OnbScreens.length; j++) {
            var type = OnbScreens[j]['@type'];
            var screen = OnbScreens[j]['@appid'];
            if (type.toLowerCase() == 'search') {
                var searchScreen = screen;
            }

            if (type.toLowerCase() == 'group') {
                var groupScreen = screen;
            }
            var column = OnbScreens[j]['@widcolumn'];
            var row = OnbScreens[j]['@widrow'];
            this.detailsHash.get(step).json.get(screen).column = column;
            this.detailsHash.get(step).json.get(screen).row = row;
            if (Object.isUndefined(this.structureHash.get(step))) {
                this.structureHash.set(step, { row: $H() });
            }
            this.structureHash.get(step).row.set(row, { columns: $H() });
        }

        for (var i = 0; i < OnbScreens.size(); i++) {
            var screenAppId = OnbScreens[i]['@appid'];
            if (this.detailsHash.get(step).json.get(screenAppId).tableMode != 'X') {
                //calculate okCode, and instantiate getContentModule

                var _this = this;
                var fieldDispHalfSize = 'fieldDispQuarterSize';
                var fieldDispQuarterSize = 'fieldDispQuarterSize';

                     //var loadingPAImsg = Object.isEmpty(this.detailsHash.get(screenAppId).listMode) ? true : false;
                    this.TWfield = new getContentModule({
                        json: this.detailsHash.get(step).json.get(screenAppId),
                        appId: this.detailsHash.get(step).json.get(screenAppId).EWS.appId,
                        name: this.detailsHash.get(step).json.get(screenAppId).EWS.o_field_settings.yglui_str_wid_fs_record['@screen'] + '_' + this.infoHash.keys().last(),
                        mode: 'create', //this.mode,
                        showCancelButton: false,
                        showLoadingPAI: false,
                        showButtons: $H({
                            edit: true,
                            display: true,
                            create: true
                        }),
                        buttonsHandlers: $H({
                            DEFAULT_EVENT_THROW: 'EWS:OnbChange_Period_WorkSchedule',
                            paiEvent: function(args) {
                                document.fire('EWS:paiEvent_Period_WorkSchedule', getArgs(args))
                            }
                        }),
                        cssClasses: $H({ fieldDispHalfSize: fieldDispHalfSize, fieldDispQuarterSize: fieldDispQuarterSize, tcontentSimpleTable: 'Onb_stepsWithTable' })
                    });

                    this.PAIServiceBinding = this.PAIService.bindAsEventListener(this, step, okCode, screenAppId, groupScreen, searchScreen);
                    document.observe('EWS:paiEvent_Period_WorkSchedule', this.PAIServiceBinding);

                    var screen = screenAppId;
                    var screenRow = this.detailsHash.get(step).json.get(screenAppId).row;
                    var screenColumn = this.detailsHash.get(step).json.get(screenAppId).column;
                    var labelsArray = objectToArray(this.detailsHash.get(step).json.get(screenAppId).EWS.labels.item);
                    var labelId = this.detailsHash.get(step).json.get(screenAppId).EWS.label;
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
                    this.structureHash.get(step).row.get(screenRow).columns.set(screenColumn, { screen: screen, field: this.TWfield, label: label });
                    //this.TWfield.destroy();
               
            }
        }
        var htmlContent = new Element('div', {
            'class': 'Onb_columns_container'
        });
        //create html fieldsets and legends
        var legend = new Element('legend');
        for (var i = 0; i < this.structureHash.get(step).row.keys().length; i++) {
            var insertRow = this.structureHash.get(step).row.get(this.structureHash.get(step).row.keys()[i]);
            //Now we decide where to insert the fieldset: left column, right column, or two columns wide
            var bothColumns = insertRow.columns.get('0');
            //left column

            //two columns wide
            if (!Object.isEmpty(bothColumns)) {

                // We store the label inside a variable and we create the span

                var label = global.getLabel(bothColumns.label);
                var legend = new Element('span', { 'class': 'Onb_legend' }).insert(label); // The CSS class was modified to show the span as the legend
                // We create the div
                var fc = new Element('div', { 'id': 'Onb_fieldSet_' + bothColumns.screen + '', 'class': 'Onb_column0' });
                // If the label was not empty, we insert it
                if (!Object.isEmpty(label))
                    fc.insert(legend);
                // Class containing div’s borders
                fc.addClassName('PCR_columnBorder');
                var divInside = new Element('div'); // Previous CSS class was not needed anymore
                fc.insert(divInside);
                divInside.insert(bothColumns.field.getHtml());
                htmlContent.insert(fc);
              }
        }

        var result = new Element('div', { 'id': 'result_' + step + '', 'class': 'Onb_column0' });
        htmlContent.insert(result);
        // When we'll receive the button from sap we should remove this piece of code
        if (step.include('01')) {
            var searchDiv = htmlContent.down('[id=screensNavigationLayer_screen_' + searchScreen + ']');
            var json = {
                elements: []
            };
            var testSearch = {
                label: 'search',
                idButton: 'search',
                className: 'Onb_SearchButton',
                handlerContext: null,
                handler: this._getPeriod.bind(this, searchScreen, groupScreen, step), //this.makeSearch.bind(this, searchScreen, resultScreen),
                type: 'button',
                standardButton: true
            };
            json.elements.push(testSearch);
            var ButtonJobProfile = new megaButtonDisplayer(json);
            searchDiv.insert(ButtonJobProfile.getButtons());

        }

        this.Onb_wizard.insertHtml(htmlContent, step, '');
        var dinamicButtons = this.createDinamicButtons(step);
        this.Onb_wizard.addButtons(dinamicButtons);

        if (Object.isEmpty(this.virtualHtml.down('[id= Onb_stepTitle_]'))) {
            var sub_Title = new Element('div', {
                'id': 'Onb_stepTitle_', //+ this.wizardId + '_' + step,
                'class': 'Onb_stepTitle'
            }).insert("<div class='application_main_title2 Onb_stepTitle_font'>" + global.getLabel(this.wizardId) + "</div><div id='stepDescription' class='Onb_stepTitle_font application_main_soft_text'>" + global.getLabel(step) + "</div>");
            this.virtualHtml.down('[id= wizard_TB_cont]').insert(sub_Title);
        }
        document.fire('EWS:showButton');
        var loadingMessages = this.virtualHtml.select('[id^=loadingMessage]');
        for (var h = 0; h < loadingMessages.length; h++) {
            loadingMessages[h].hide();
        }
        var errorMessages = this.virtualHtml.select('[id^=fieldErrorMessage]');
        for (var h = 0; h < errorMessages.length; h++) {
            errorMessages[h].hide();
        }

        if (step.include('01')) {
            this._getPeriod(searchScreen, groupScreen, step, true);
            this.labelGroup = this.detailsHash.get(step).json.get(groupScreen).EWS.label;
        }
        if (step.include('02')) {
            this._getWorkSchedule(searchScreen, groupScreen, step, true);
            this.labelGroup = this.detailsHash.get(step).json.get(groupScreen).EWS.label;
        }

    },

    /**
    * @description Returns an existing period json (used by periodEntryScreen app)
    * @param {JSON} json period list
    * @param {String} id period's id
    * @returns {Hash} period hash
    */
    _getPeriodSelected: function(id) {
        // Searching period index
        var periods = objectToArray(this.PeriodRecords.EWS.o_tabvalues.yglui_str_wid_pwsval);
        var periodFound = -1;
        for (var i = 0; (i < periods.length) && (periodFound < 0); i++) {
            if (periods[i]['@pwsid'] == id)
                periodFound = i;
        }

        // Getting period key
        this.periodKey = periods[periodFound]['@pwsid'];
        // Saving period into a hash
        var period = periods[periodFound];
        // Adding labels
        var labelsObject = this.PeriodRecords.EWS.labels;
        // Creating "GET_CONTENT" period
        var contentPeriod = {
            o_columns: this.PeriodRecords.EWS.o_columns,
            o_tabvalues: { yglui_str_wid_pwsval: period },
            labels: labelsObject
        };

        var result = { EWS: contentPeriod };
        return result;
    },


    /**  
    *@param searchScreen, screen where we insert the fields to search
    *@param resultScreen, screen where we insert the results from the search
    *@description Calls SAP to ake the search and inserts the result in the proper screen
    */
    _getPeriod: function(searchScreen, groupScreen, step, _default) { //, resultScreen
        var jsonToSend = {
            EWS: {
                SERVICE: this.getPeriodService,
                PARAM: {
                    REQID: this.reqId,
                    RECORDS: { yglui_str_wid_field: $A() }
                }
            }
        };
        var contents = objectToArray(this.detailsHash.get(this.step).json.get(searchScreen).EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        //insert the records
        for (var i = 0; i < contents.length; i++) {
            jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(contents[i]);
        }

        if (_default) {

            var area = objectToArray(this.detailsHash.get(this.step).json.get(groupScreen).EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
            var _defaults = objectToArray(this.detailsHash.get(this.step).json.get(groupScreen).EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);

            //insert the records
            for (var k = 0; k < area.length; k++) {
                for (var g = 0; g < _defaults.length; g++)
                    if (area[k]['@fieldid'] == _defaults[g]['@fieldid']) {
                    area[k]['@value'] = _defaults[g]['@default_value']
                    jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(area[k]);
                }

            }
        } else {

            var area = objectToArray(this.detailsHash.get(this.step).json.get(groupScreen).EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
            //insert the records
            for (var k = 0; k < area.length; k++) {
                jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(area[k]);
            }
        }
        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';

        //this.method = 'GET';
        //this.url = 'standard/Onboarding/XMLOUT_GET_PERWS.xml';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: 'processPeriod',
            ajaxID: groupScreen + '%' + step
        }));
    },



    /**  
    *@param searchScreen, screen where we insert the fields to search
    *@param resultScreen, screen where we insert the results from the search
    *@description Calls SAP to ake the search and inserts the result in the proper screen
    */
    _getWorkSchedule: function(searchScreen, groupScreen, step, _default) {
        var jsonToSend = {
            EWS: {
                SERVICE: this.getWorkScheduleService,
                PARAM: {
                    APPID: 'WSRULE',
                    WID_SCREEN: '*',
                    REQID: this.reqId,
                    RECORDS: { yglui_str_wid_field: $A() }
                }
            }
        };

        if (_default) {

            var area = objectToArray(this.detailsHash.get(this.step).json.get(groupScreen).EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
            var _defaults = objectToArray(this.detailsHash.get(this.step).json.get(groupScreen).EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);

            //insert the records
            for (var k = 0; k < area.length; k++) {
                for (var g = 0; g < _defaults.length; g++)
                    if (area[k]['@fieldid'] == _defaults[g]['@fieldid']) {
                    area[k]['@value'] = _defaults[g]['@default_value']
                    jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(area[k]);
                }

            }
        } else {

            var area = objectToArray(this.detailsHash.get(this.step).json.get(groupScreen).EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
            //insert the records
            for (var k = 0; k < area.length; k++) {
                jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(area[k]);
            }
        }

        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';

        //this.method = 'GET';
        //this.url = 'standard/Onboarding/XMLOUT_GET_WSRULE.xml';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: 'processWorkSchedule',
            ajaxID: groupScreen + '%' + step
        }));
    },

    /**  
    *@param step, current step
    *@description create the buttons coming from SAP
    */
    createDinamicButtons: function(step) {
        var action;
        if (Object.isEmpty(this.hashOfButtons.get(step))) {
            this.hashOfButtons.set(step, { buttons: $A() });
            if (!Object.isEmpty(this.contentJson.EWS.o_screen_buttons)) {
                this.buttons = objectToArray(this.contentJson.EWS.o_screen_buttons.yglui_str_wid_button);
            }
            this.hashOfButtons.set(step, { buttons: this.buttons });
        }
        var dinamicButtons = {
            elements: []
        };
        var dinamicLinks = {
            elements: [],
            mainClass: 'application_Onb_optionLinks'

        };
        for (var i = 0; i < this.hashOfButtons.get(step).buttons.length; i++) {
            action = null;
            var label = this.hashOfButtons.get(step).buttons[i]['@label_tag'];
            var status = this.hashOfButtons.get(step).buttons[i]['@status'];
            var OldAction = this.hashOfButtons.get(step).buttons[i]['@action'];
            /*if (OldAction.include('SUBMIT'))
                action = 'APP_Onb_SUBMIT';
            else {
                if (OldAction.include('CANCEL'))
                    action = 'APP_Onb_CANCEL';
                else if (OldAction.include('SKIP'))
                    action = 'APP_Onb_SKIP';
                else
                    action = 'APP_Onb_NEXT';
            }*/
            if (Object.isEmpty(status))
                action = 'APP_Onb_SUBMIT';
            else {
                if (status == '9Z')
                    action = 'APP_Onb_CANCEL';
                else if (status == '00')
                    action = 'APP_Onb_SKIP';
                else
                    action = 'APP_Onb_NEXT';
            }
            var button = {
                label: label,
                idButton: action,
                className: 'getContentButtons fieldDispFloatRight',
                handlerContext: null,
                handler: this.Onb_wizard.buttonClicked.bind(this.Onb_wizard, action),
                type: 'button',
                standardButton: true
            };
            dinamicButtons.elements.push(button);

        }
        if (dinamicButtons.elements.length != 0) {
            var ButtonsOnb = new megaButtonDisplayer(dinamicButtons);
            return ButtonsOnb.getButtons();
        }
    },
    /**
    * Method called when the Pending Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    _showGroup3: function(group, groupScreen, step) {

        var jsonToSend = {
            EWS: {
                SERVICE: this.getGroupService,
                PARAM: {
                    RECORDS: { yglui_str_wid_field: $A() }
                }
            }
        };

        var area = objectToArray(this.detailsHash.get(this.step).json.get(groupScreen).EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        //insert the records
        for (var k = 0; k < area.length; k++) {
            if (area[k]['@fieldid'] == 'ZEITY') {
                area[k]['@value'] = group;
            }
            jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(area[k]);
        }
        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';

        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: 'DisplayGroup2',
            ajaxID: groupScreen + '%' + step
        }));
    },

    /**
    * Method called when the Pending Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    _showGroup: function(group, subgroup, groupScreen, step) {

        var jsonToSend = {
            EWS: {
                SERVICE: this.getAreaService,
                PARAM: {
                    RECORDS: { yglui_str_wid_field: $A() }
                }
            }
        };

        var area = objectToArray(this.detailsHash.get(this.step).json.get(groupScreen).EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        //insert the records
        for (var k = 0; k < area.length; k++) {
            if (area[k]['@fieldid'] == 'MOTPR' && Object.isEmpty(subgroup)) {
                area[k]['@value'] = group;
            }
            if (area[k]['@fieldid'] == 'MOFID' && !Object.isEmpty(subgroup)) {
                area[k]['@value'] = group;
            }
            if (area[k]['@fieldid'] == 'MOSID' && !Object.isEmpty(subgroup)) {
                area[k]['@value'] = subgroup;
            }
            jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(area[k]);
        }
        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';

        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: 'DisplayGroup',
            ajaxID: groupScreen + '%' + step
        }));
    },

    /**
    * Method called when the Pending Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    DisplayGroup: function(req, data) {

        this.setLabels(req);
        this.GroupHTML = new Element('div');
        this.TableHtml = new Element('table', { id: 'Area_resultsTable', style: 'margin-left:15px ;width:90%', className: 'sortable' });
        html = "<thead><tr>"
            + "<th>" + global.getLabel('area') + "</th>"
            + "<th>" + global.getLabel('subarea') + "</th>"
            + "</tr></thead><tbody id='area_results'></tbody>";
        this.TableHtml.insert(html);
        this.GroupHTML.insert(this.TableHtml);

        objectToArray(req.EWS.o_areas.yglui_str_wid_area).each(function(fieldValues) {
            //debugger;
            var line = '<tr>'
                    + "<td>" + fieldValues['@area'] + "</td>"
                    + "<td>" + fieldValues['@subarea'] + "</td>"
                    + "</tr>";
            this.GroupHTML.down('[id=area_results]').insert(line);
        } .bind(this));

        //this.GroupHTML.insert(this.TableHtml);
        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'Onb_moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            this.GroupPopUp.close();
            delete this.GroupPopUp;
        } .bind(this);
        var closeButton = {
            idButton: 'close',
            label: global.getLabel('Close'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(closeButton);

        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        this.GroupHTML.insert(buttons);
        // infoPopUp creation
        this.GroupPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('cancel'),
                'callBack': callBack
            }),
            htmlContent: this.GroupHTML,
            indicatorIcon: 'void',
            width: 350
        });
        this.GroupPopUp.create();
        // this.tableGroup = new tableKitWithSearch(this.GroupHTML.down('table#Area_resultsTable'), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults'), webSearch: false });
        if (!this.tableGroupShowed) {
            this.tableGroupShowed = true;
            this.tableGroup = new tableKitWithSearch(this.GroupHTML.down('table#Area_resultsTable'), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
        } else {
            this.tableGroup.reloadTable(this.GroupHTML.down('table#Area_resultsTable'));
        }
        if (this.GroupHTML.down('div#Area_resultsTable_searchBoxDiv'))
            this.GroupHTML.down('div#Area_resultsTable_searchBoxDiv').addClassName('Onb_search');



    },

    /**
    * Method called when the Pending Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    DisplayGroup2: function(req, data) {

        this.setLabels(req);
        this.GroupHTML = new Element('div');
        this.TableHtml = new Element('table', { id: 'Area_resultsTable2', style: 'margin-left:15px ;width:90%', className: 'sortable' });
        html = "<thead><tr>"
            + "<th id='eegroup'>" + global.getLabel('eegroup') + "</th>"
            + "<th id='eesudgroup'  class='table_sortfirstdesc'>" + global.getLabel('eesubgroup') + "</th>"
            + "</tr></thead><tbody id='area_results'></tbody>";
        this.TableHtml.insert(html);
        this.GroupHTML.insert(this.TableHtml);

        objectToArray(req.EWS.o_eegrps.yglui_str_wid_eegrp).each(function(fieldValues) {
            //debugger;
            var line = '<tr>'
                    + "<td>" + fieldValues['@eegroup'] + "</td>"
                    + "<td>" + fieldValues['@eesubgroup'] + "</td>"
                    + "</tr>";
            this.GroupHTML.down('[id=area_results]').insert(line);
        } .bind(this));

        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'Onb_moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            this.GroupPopUp.close();
            delete this.GroupPopUp;
        } .bind(this);
        var closeButton = {
            idButton: 'close',
            label: global.getLabel('Close'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(closeButton);

        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        this.GroupHTML.insert(buttons);
        // infoPopUp creation
        this.GroupPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('cancel'),
                'callBack': callBack
            }),
            htmlContent: this.GroupHTML,
            indicatorIcon: 'void',
            width: 350
        });
        this.GroupPopUp.create();

        if (!this.tableGroup2Showed) {
            this.tableGroup2Showed = true;
            this.tableGroup2 = new tableKitWithSearch(this.GroupHTML.down('table#Area_resultsTable2'), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
        } else {
            this.tableGroup2.reloadTable(this.GroupHTML.down('table#Area_resultsTable2'));
        }
        if (this.GroupHTML.down('div#Area_resultsTable2_searchBoxDiv'))
            this.GroupHTML.down('div#Area_resultsTable2_searchBoxDiv').addClassName('Onb_search');

    },

    /**
    * Method called when the Pending Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    processPeriod: function(req, data) {
        data = data.split('%');
        var step = data[1];
        var groupScreen = data[0];
        this.setLabels(req);
        //Process Link
        if (this.virtualHtml.down('[id$=MOTPR]')) {
            this.virtualHtml.down('[id$=MOTPR]').update("");
            var group = req.EWS.o_psg_dws.item['@value'];
            if (!Object.isEmpty(group)) {
                this.virtualHtml.down('[id$=MOTPR]').insert("<span class='application_action_link' id='link_group'></span>");
                this.virtualHtml.down('[id=link_group]').update(this.labels.get(group));
                this.virtualHtml.down('[id=link_group]').observe('click', this._showGroup.bind(this, group, '', groupScreen, step));
            }
        }

        //Process Period
        this.PeriodRecords = req;

        var html = '';
        if (Object.isEmpty(req.EWS.o_tabvalues)) {
            html = '<div>' + global.getLabel('no_result') + '</div>'
            this.virtualHtml.down('[id=result_' + step + ']').update(html);
        } else {
            html = '<table style= "margin-top : 10 px" class="sortable" id="Period_resultsTable">'
                  + '<thead>'
                  + '<tr>';
            var sort = '';
            objectToArray(req.EWS.o_columns.yglui_str_wid_column).each(function(fieldSettings) {
                var label = this.labels.get((fieldSettings['@columnid']));
                if (sort == '') {
                    html = html + '<th class="table_sortfirstdesc" id="' + fieldSettings['@columnid'] + '">' + label + '</th>';
                    sort = 'X';
                } else {
                    html = html + '<th id="' + fieldSettings['@columnid'] + '">' + label + '</th>';
                }
            } .bind(this));
            html = html + '</tr>'
                            + '</thead>'
                            + '<tbody id="Period_results_tbody">';
            var k = '1';
            objectToArray(req.EWS.o_tabvalues.yglui_str_wid_pwsval).each(function(fieldValues) {
                //debugger;
                var onclick = "javascript:document.fire('EWS:PeriodSelected', '" + fieldValues['@pwsid'] + "');";
                if (k == '1') {
                    this.key = fieldValues['@pwsid'];
                }
                var first = '';
                if (fieldValues['@nbrweeks'] != '1') {
                    var nb = "rowspan=" + fieldValues['@nbrweeks'];
                } else {
                    var nb = "";
                }
                objectToArray(fieldValues.weeks.yglui_str_wid_pwsweek).each(function(week) {
                    html = html + '<tr>';
                    if (first == '') {
                        html = html +
                             '<td ' + nb + '>'
                            + '<input id="radio_' + k + '" TYPE="radio" NAME="group" VALUE="Title" onClick ="' + onclick + '" ></input>'
                            + '<span>' + fieldValues['@pwsid'] + '</span ></td>' +
                             '<td ' + nb + ' >' + fieldValues['@pwsdesc'] + '</td>';
                        first = 'X';
                    }
                    html = html + '<td>' + week['@weeknbr'] + '</td>'
                           + '<td>' + week['@day1'] + '</td>'
                           + '<td>' + week['@day2'] + '</td>'
                           + '<td>' + week['@day3'] + '</td>'
                           + '<td>' + week['@day4'] + '</td>'
                           + '<td>' + week['@day5'] + '</td>'
                           + '<td>' + week['@day6'] + '</td>'
                           + '<td>' + week['@day7'] + '</td></tr>';

                } .bind(this));
                k = k + 1;
            } .bind(this));


            html = html + '</tbody></table>';
            this.virtualHtml.down('[id=result_' + step + ']').update('');
            this.virtualHtml.down('[id=result_' + step + ']').update(html);

            if (!this.tablePeriodShowed) {
                SortableTable.init($(document.body).down("[id=Period_resultsTable]"));
                SortableTable.sort($(document.body).down("[id=Period_resultsTable]"), 1, 1);
                this.tablePeriodShowed = true;
            }
            else {
                SortableTable.load($(document.body).down("[id=Period_resultsTable]"));
                SortableTable.sort($(document.body).down("[id=Period_resultsTable]"), 1, 1);
            }

            $('radio_1').checked = true;

            var menuItems = Object.isEmpty(req.EWS.o_actions) ? [] : objectToArray(req.EWS.o_actions.yglui_vie_tty_ac);
            var line = "";
            for (var i = 0; i < menuItems.length; i++) {

                var id = menuItems[i]['@actio'];
                var appId = menuItems[i]['@tarap'];
                var view = menuItems[i]['@views'];
                var label = menuItems[i]['@actiot'];
                var pieces = label.split("((L))");
                var tabId = '';
                var _onclick = "javascript:document.fire('EWS:PeriodClick', $H({app:'" + appId + "', tab:'" + tabId + "', view:'" + view + "', okcode:'" + id + "', groupScreen:'" + groupScreen + "'}));";
                line = line + '<div>'
                        + '<span class="Onb_Text">' + pieces[0] + '</span>';
                if (pieces[1]) {
                    line = line + '<span class="Onb_Text application_action_link" '
                    + ' onClick ="' + _onclick + '" >'
                    + pieces[1] + '</span>';
                }
                if (pieces[2]) {
                    line = line + '<span class="Onb_Text">' + pieces[2] + '</span>';
                }
                line = line + '</div>';

            }
            this.virtualHtml.down('[id=result_' + step + ']').insert({ 'top': line });

        }
    },

    /**
    * Method called when the Pending Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    processWorkSchedule: function(req, data) {
        data = data.split('%');
        var step = this.step;
        var groupScreen = data[0];
        this.setLabels(req);
        this.WorkScheduleRecords = req;

        //Process Link
        if (this.virtualHtml.down('[id$=MOWSR]')) {
            this.virtualHtml.down('[id$=MOWSR]').update("");
            var group2 = req.EWS.o_psg_wsr.item['@id'].substring(0, 2);
            var subgroup2 = req.EWS.o_psg_wsr.item['@id'].substring(2, 4); ;
            if (!Object.isEmpty(group2)) {
                this.virtualHtml.down('[id$=MOWSR]').insert("<span class='application_action_link' id='link_group_2'></span>");
                this.virtualHtml.down('[id=link_group_2]').update(this.labels.get(req.EWS.o_psg_wsr.item['@value']));
                this.virtualHtml.down('[id=link_group_2]').observe('click', this._showGroup.bind(this, group2, subgroup2, groupScreen, step));
            }
        }
        //Process Link
        if (this.virtualHtml.down('[id$=ZEITY]')) {
            this.virtualHtml.down('[id$=ZEITY]').update("");
            var group3 = req.EWS.o_esg_wsr.item['@id'];
            if (!Object.isEmpty(group3)) {
                this.virtualHtml.down('[id$=ZEITY]').insert("<span class='application_action_link' id='link_group_3'></span>");
                this.virtualHtml.down('[id=link_group_3]').update(this.labels.get(req.EWS.o_esg_wsr.item['@value']));
                this.virtualHtml.down('[id=link_group_3]').observe('click', this._showGroup3.bind(this, group3, groupScreen, step));
            }
        }

        //Process WorkSchedule

        var fieldSet = req.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field;
        var fieldVal = req.EWS.o_field_values;
        var tableHeaders = [];
        var headers = [];
        objectToArray(fieldSet).each(function(fieldSettings) {//setting the table headers
            if (fieldSettings['@fieldtype'] && fieldSettings['@fieldtype'].toLowerCase() == 'h') {
                //this field is a column header
                var seqnr = parseInt(fieldSettings['@seqnr'], 10);
                tableHeaders[seqnr] = fieldSettings['@fieldid'];
            }
        } .bind(this));

        var j = 0;
        for (i = 0; i < tableHeaders.length; i++) {
            if (tableHeaders[i]) {
                headers[j] = tableHeaders[i].toLowerCase();
                j++;
            }
        }
        this.TableHtml = new Element('table', { id: 'WorkSchedule_resultsTable', className: 'sortable' });
        html = "<thead><tr>";

        for (i = 0; i < headers.length; i++) {
            objectToArray(fieldSet).each(function(fieldSettings) {
                if (fieldSettings['@fieldid'].toLowerCase() == headers[i]) {
                    var label = !Object.isEmpty(fieldSettings['@fieldlabel']) ? fieldSettings['@fieldlabel'] : global.getLabel(headers[i]);
                    if ((fieldSettings['@fieldid'] == 'SCHKZ') || (fieldSettings['@fieldid'] == 'ZMODN')) {
                        html = html + "<th class='table_nosort' id='" + fieldSettings['@fieldid'] + "'>" + label + "</th>";
                    } else {
                        html = html + "<th id='" + fieldSettings['@fieldid'] + "'>" + label + "</th>";
                    }
                }
            } .bind(this));
        }

        html = html + "</tr></thead><tbody id='work_results'></tbody>";
        this.TableHtml.insert(html);
        this.virtualHtml.down('[id=result_' + step + ']').update('');
        this.virtualHtml.down('[id=result_' + step + ']').update(this.TableHtml);
        var k = 1;
        objectToArray(fieldVal.yglui_str_wid_record).each(function(fieldValues) {
            //debugger;
            if (!Object.isEmpty(fieldValues['@rec_key'])) {
                var line = '<tr>';
                var SCHKZ = '';

                var Field_ZMODN;
                for (i = 0; i < headers.length; i++) {
                    objectToArray(fieldValues.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                        if (field['@fieldid'] && field['@fieldid'].toLowerCase() == headers[i]) {
                            var valueToShow = !Object.isEmpty(field['#text']) ? field['#text'] : field['@value'];
                            if (Object.isEmpty(valueToShow)) {
                                valueToShow = '';
                            }

                            var valueToHash = !Object.isEmpty(sapToObject(valueToShow)) ? sapToDisplayFormat(valueToShow) : valueToShow;
                            if (field['@fieldid'] == 'SCHKZ') {
                                line = line + "<td  id = '" + field['@value'] + "' >"
                              + "<div class='application_action_link'>" + field['@value'] + "</div ></td>";
                                SCHKZ = field['@value'];
                            }
                            else if (field['@fieldid'] == 'ZMODN') {
                                line = line + "<td  id = 'period_" + k + "' >"
                                + "<div class='application_action_link'>" + valueToHash + "</div ></td>";
                                Field_ZMODN = field;
                            }
                            else {
                                line = line + "<td class='Onb_list' >" + valueToHash + "</td>";
                            }
                        }
                    } .bind(this));
                }
                line = line + "</tr>";
                this.virtualHtml.down('[id=work_results]').insert(line);
                this.virtualHtml.down('[id=' + SCHKZ + ']').observe('click', this._showSCHKZ.bind(this, fieldValues, req.EWS.o_field_settings));
                this.virtualHtml.down('[id=period_' + k + ']').observe('click', this._showZMODN.bind(this, Field_ZMODN, groupScreen));
                k++;
            }
        } .bind(this));
        if (!this.tableWorkScheduleShowed) {
            this.tableWorkScheduleShowed = true;
            this.tableWorkScheduleObject = new tableKitWithSearch(this.virtualHtml.down('table#WorkSchedule_resultsTable'), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
        } else {
            this.tableWorkScheduleObject.reloadTable(this.virtualHtml.down('table#WorkSchedule_resultsTable'));
        }
        // this.virtualHtml.down('[id$=ZSRCH]').update(this.virtualHtml.down('[id=WorkSchedule_resultsTable_searchBoxDiv]'));

        var menuItems = Object.isEmpty(req.EWS.o_screen_buttons) ? [] : objectToArray(req.EWS.o_screen_buttons.yglui_str_wid_button);
        var line = "";
        for (var i = 0; i < menuItems.length; i++) {

            var id = menuItems[i]['@actio'];
            var appId = menuItems[i]['@tarap'];
            var view = menuItems[i]['@views'];
            var label = menuItems[i]['@label_tag'];
            var pieces = label.split("((L))");
            var tabId = '';
            var _onclick = "javascript:document.fire('EWS:WorkScheduleClick', $H({app:'" + appId + "', tab:'" + tabId + "', view:'" + view + "', okcode:'" + id + "', groupScreen:'" + groupScreen + "'}));";
            line = line + '<div>'
                    + '<span class="Onb_Text">' + pieces[0] + '</span>';
            if (pieces[1]) {
                line = line + '<span class="Onb_Text application_action_link" '
                    + ' onClick ="' + _onclick + '" >'
                    + pieces[1] + '</span>';
            }
            if (pieces[2]) {
                line = line + '<span class="Onb_Text">' + pieces[2] + '</span>';
            }
            line = line + '</div>';

        }
        //this.virtualHtml.down('[id=result_' + step + ']').insert({ 'top': line });
        this.virtualHtml.down('[id=WorkSchedule_resultsTable_searchBoxDiv]').insert(line);

    },

    _showSCHKZ: function(FieldValue, FieldSet) {

        if (Object.isEmpty(this.ping)) {

            this._pingMessage();

        } else {

            /*  var fields = objectToArray(FieldValue.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
            for (var a = 0; a < fields.length; a++) {
            if (fields[a]['@fieldid'] == 'VIEW') {
            var view = fields[a]['@value'];
            }
            }*/
            var fieldset = objectToArray(FieldSet.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);
            for (var a = 0; a < fieldset.length; a++) {
                FieldSet.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field[a]['@fieldtype'] = '';
                if (fieldset[a]['@fieldid'] == 'VIEW') {
                    var view = fieldset[a]['@default_value'];
                }
            }
            var header = this.virtualHtml.down('[id = wizard_TB_cont]').innerHTML;
            var area = this.detailsHash.get(this.step).json.get([1]);
            var PSG_DWS = this.WorkScheduleRecords.EWS.o_psg_wsr;
            var ESG_WSR = this.WorkScheduleRecords.EWS.o_esg_wsr;

            var titleObject = new Object();
            titleObject['#text'] = "";
            titleObject['@all_modifiable'] = "";
            titleObject['@appid'] = 'WSRULE'; //this.wizardId + '_2';
            titleObject['@list_mode'] = "";
            titleObject['@screen'] = 1;
            titleObject['@selected'] = "X";
            titleObject['@label_tag'] = 'Title';

            var contentWorkSchedule = {

                o_field_settings: FieldSet,
                o_field_values: { yglui_str_wid_record: FieldValue },
                o_widget_screens: { yglui_str_wid_screen: titleObject },
                o_screen_buttons: '',
                labels: this.o_labels //lola
            };
            contentWorkSchedule.o_field_settings.yglui_str_wid_fs_record['@screen'] = 1;
            contentWorkSchedule.o_field_values.yglui_str_wid_record['@screen'] = 1;
            contentWorkSchedule.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@selected'] = 'X';
            var contentWork = { EWS: contentWorkSchedule };

            global.open($H({
                app: {
                    appId: 'WSRULE',
                    tabId: '',
                    view: view
                },
                header: header,
                contentWork: contentWork,
                PSG_DWS: PSG_DWS,
                ESG_WSR: ESG_WSR,
                reqId: this.reqId,
                area: area,
                labelGroup: this.labelGroup

            }));
        }

    },

    _showZMODN: function(fiedValueZMODN, groupScreen) {

        var jsonToSend = {
            EWS: {
                SERVICE: this.getPeriodService,
                REQID: this.reqId,
                PARAM: {
                    RECORDS: { yglui_str_wid_field: $A() }
                }
            }
        };
        jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(fiedValueZMODN);
        var area = objectToArray(this.detailsHash.get(this.step).json.get(groupScreen).EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        //insert the records
        for (var k = 0; k < area.length; k++) {
            jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(area[k]);
        }
        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';

        //this.method = 'GET';
        //this.url = 'standard/Onboarding/XMLOUT_GET_PERWS2.xml';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: 'PopupPeriod'
        }));

    },


    PopupPeriod: function(req) {

        this.setLabels(req);
        this.PopUpWorkScheduleHTML = new Element('div');
        var html = '<table style= "margin-top : 10 px" class="sortable" id="Popup_Period_resultsTable">'
                  + '<thead>'
                  + '<tr>';
        objectToArray(req.EWS.o_columns.yglui_str_wid_column).each(function(fieldSettings) {
            var label = this.labels.get((fieldSettings['@columnid']));
            html = html + '<th id="' + fieldSettings['@columnid'] + '">' + label + '</th>';
        } .bind(this));
        html = html + '</tr></thead><tbody id="Period_results_tbody">';
        objectToArray(req.EWS.o_tabvalues.yglui_str_wid_pwsval).each(function(fieldValues) {
            var first = '';
            if (fieldValues['@nbrweeks'] != '1') {
                var nb = "rowspan=" + fieldValues['@nbrweeks'];
            } else {
                var nb = "";
            }
            objectToArray(fieldValues.weeks.yglui_str_wid_pwsweek).each(function(week) {
                html = html + '<tr>';
                if (first == '') {
                    html = html +
                             '<td ' + nb + '>'
                             + '<span>' + fieldValues['@pwsid'] + '</span ></td>' +
                             '<td ' + nb + ' >' + fieldValues['@pwsdesc'] + '</td>';
                    first = 'X';
                }
                html = html + '<td>' + week['@weeknbr'] + '</td>'
                           + '<td>' + week['@day1'] + '</td>'
                           + '<td>' + week['@day2'] + '</td>'
                           + '<td>' + week['@day3'] + '</td>'
                           + '<td>' + week['@day4'] + '</td>'
                           + '<td>' + week['@day5'] + '</td>'
                           + '<td>' + week['@day6'] + '</td>'
                           + '<td>' + week['@day7'] + '</td></tr>';

            } .bind(this));
        } .bind(this));

        html = html + '</tbody></table>';
        this.PopUpWorkScheduleHTML.update('');
        this.PopUpWorkScheduleHTML.update(html);

        if (!this.tablePopUpWorkScheduleShowed) {
            SortableTable.init($(this.PopUpWorkScheduleHTML).down("[id=Popup_Period_resultsTable]"));
            SortableTable.sort($(this.PopUpWorkScheduleHTML).down("[id=Popup_Period_resultsTable]"), 1, 1);
            this.tablePeriodShowed = true;
        }
        else {
            SortableTable.load($(this.PopUpWorkScheduleHTML).down("[id=Popup_Period_resultsTable]"));
            SortableTable.sort($(this.PopUpWorkScheduleHTML).down("[id=Popup_Period_resultsTable]"), 1, 1);
        }

        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            this.WorkSchedulePopUp.close();
            delete this.WorkSchedulePopUp;
        } .bind(this);
        var closeButton = {
            idButton: 'DELETE',
            label: global.getLabel('Close'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(closeButton);

        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        this.PopUpWorkScheduleHTML.insert(buttons);
        // infoPopUp creation
        this.WorkSchedulePopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('cancel'),
                'callBack': callBack
            }),
            htmlContent: this.PopUpWorkScheduleHTML,
            indicatorIcon: 'void',
            width: 530
        });
        this.WorkSchedulePopUp.create();

    },

    setLabels: function(jsonIn) {
        this.o_labels = jsonIn.EWS.labels;
        if (!Object.isEmpty(jsonIn) && !Object.isEmpty(jsonIn.EWS.labels) && !Object.isEmpty(jsonIn.EWS.labels.item)) {
            objectToArray(jsonIn.EWS.labels.item).each(function(label) {
                if (!Object.isEmpty(label['@id']))
                    this.labels.set(label['@id'], label['@value']);
            } .bind(this));
        }
    },

    _selectPeriod: function(arg) {
        this.key = getArgs(arg);
    },

    _openWorkSchedule: function(arg) {

        if (Object.isEmpty(this.ping)) {

            this._pingMessage();

        } else {

            var args = getArgs(arg);
            var appId = args.get("app");
            var tabId = args.get("tab");
            var view = args.get("view");
            var okcode = args.get("okcode");
            var groupScreen = args.get("groupScreen");
            var header = this.virtualHtml.down('[id = wizard_TB_cont]').innerHTML;
            var area = this.detailsHash.get(this.step).json.get(groupScreen);
            var PSG_DWS = this.WorkScheduleRecords.EWS.o_psg_wsr;
            var ESG_WSR = this.WorkScheduleRecords.EWS.o_esg_wsr;

            global.open($H({
                app: {
                    appId: appId, //this.wizardId,
                    tabId: tabId,
                    view: view
                },
                header: header,
                contentWork: '',
                reqId: this.reqId,
                PSG_DWS: PSG_DWS,
                ESG_WSR: ESG_WSR,
                area: area,
                labelGroup: this.labelGroup
            }));
        }
    },

    /**
    *@description Launches the details app for the selected period
    *@param {JSON} period Object that contains all period info
    */
    _openPeriod: function(arg) {

        if (Object.isEmpty(this.ping)) {

            this._pingMessage();

        } else {

            var args = getArgs(arg);
            var appId = args.get("app");
            var tabId = args.get("tab");
            var view = args.get("view");
            var okcode = args.get("okcode");
            var groupScreen = args.get("groupScreen");
            var header = this.virtualHtml.down('[id = wizard_TB_cont]').innerHTML;
            var PSG_DWS = this.PeriodRecords.EWS.o_psg_dws;
            var area = this.detailsHash.get(this.step).json.get(groupScreen);
            var period;
            if (okcode.include('DEL')) {
                period = this._getPeriodSelected(this.key)
                this.deleteRecord(period, PSG_DWS);
            }
            if ((okcode.include('MOD') || okcode.include('COD'))) {
                if (Object.isEmpty(this.key)) {
                    this._notificationMessage(); //information message
                } else {

                    period = this._getPeriodSelected(this.key);
                    global.open($H({
                        app: {
                            appId: appId,
                            tabId: tabId,
                            view: view
                        },
                        header: header,
                        period: period,
                        area: area,
                        PSG_DWS: PSG_DWS,
                        reqId: this.reqId,
                        buttonType: 'MOD',
                        labelGroup: this.labelGroup
                    }));

                }
            }
            if (okcode.include('USE')) {

                if (this.key == '') {
                    this._notificationMessage(); //information message
                } else {

                    period = this._getPeriodSelected(this.key);
                    global.open($H({
                        app: {
                            appId: appId,
                            tabId: tabId,
                            view: view
                        },
                        header: header,
                        period: period,
                        area: area,
                        PSG_DWS: PSG_DWS,
                        reqId: this.reqId,
                        buttonType: 'NEW',
                        labelGroup: this.labelGroup
                    }));
                }
            }

            if (okcode.include('ADD')) {
                period = '';
                global.open($H({
                    app: {
                        appId: appId,
                        tabId: tabId,
                        view: view
                    },
                    header: header,
                    period: period,
                    area: area,
                    PSG_DWS: PSG_DWS,
                    reqId: this.reqId,
                    buttonType: 'NEW',
                    labelGroup: this.labelGroup
                }));
            }
        }

    },

    deleteRequest: function(period, PSG_DWS) {

        this.cancelOnbPopUp.close();
        delete this.cancelOnbPopUp;
        var action = new Object();
        action['#text'] = "";
        action['@actio'] = "";
        action['@okcod'] = "DEL";

        var jsonToSend = {
            EWS: { SERVICE: this.SaveService,
                PARAM: {
                    APPID: global.currentApplication.appId,
                    WID_SCREEN: '*',
                    RECORDS: period.EWS.o_tabvalues,
                    PSG_DWS: PSG_DWS,
                    CONFIRM: '',
                    REQID: this.reqId,
                    ACTIONS: { yglui_vie_tty_ac: action }
                }
            }
        };

        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';

        //this.method = 'GET';
        //this.url = 'standard/Onboarding/XMLOUT_GET_DAYWS.xml';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: '_processExit',
            failureMethod: '_processExit',
            errorMethod: '_processExit',
            informationMethod: '_processExit'

        }));

    },

    /**
    *@param args, Arguments coming from the getContentModule 
    *@param step, current step
    *@param Okcode, okCode to insert in the service
    *@param screenAppId, appId of the screen where the pai field is
    *@description When a PAI field is modified, calls to the specified service to reload the info
    */
    PAIService: function(args, step, okcode, screenAppId, groupScreen, searchScreen) {

       var arguments = getArgs(args);
       //var servicePai = arguments.servicePai;
      
       if (this.step.include('01')) {
            this._getPeriod(searchScreen, groupScreen, this.step, false);
        }
       
        if (this.step.include('02')) {
            this._getWorkSchedule(searchScreen, groupScreen, step, false);
        }
    },

    deleteRecord: function(period, PSG_DWS) {
        var _this = this;
        var contentHTML = new Element('div', { 'class': 'Onb_popUp' });
        contentHTML.insert("<div class='moduleInfoPopUp_std_leftMargin'>" + global.getLabel('deleteRequest') + "</div>");
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            _this.cancelOnbPopUp.close();
            delete _this.cancelOnbPopUp;

        };
        var callBack2 = function() {
            if (_this) {
                _this.deleteRequest(period, PSG_DWS);
            }
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
        this.cancelOnbPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    _this.cancelOnbPopUp.close();
                    delete _this.cancelOnbPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        this.cancelOnbPopUp.create();
    },

    /**
    * @description Shows the status of the booking after calling SAP
    * @param req Result of the AJAX request
    */
    _processExit: function(req) {

        if (!Object.isEmpty(req.EWS.o_reqid)) {
            this.reqId = req.EWS.o_reqid;
        }
        var icon = '';
        var status = "<table id='application_period_contain_status'>";
        if (Object.isEmpty(req.EWS.webmessage_type)) {
            if (Object.isEmpty(req.EWS.messages)) {
                status += "<tr class='application_period_status_line'><td class='application_period_status_label'>" + global.getLabel('Success_Period') + "</td></tr>";
                icon = 'confirmation';
            } else {
                var message = req.EWS.messages.item['#text'];
                status += "<tr class='application_period_status_line'><td class='application_period_status_label'>" + message + "</td></tr>";
                icon = 'confirmation';
            }
        }
        else {
            var message = req.EWS.webmessage_text;
            var type = req.EWS.webmessage_type
            if (type == 'E') {
                icon = 'exclamation';
                status += "<tr class='application_book_status_line'><td class='application_period_status_label'>" + message + "</td></tr>";
            }
            else {
                icon = 'confirmation';
                status += "<tr class='application_book_status_line'><td class='application_period_status_label'>" + global.getLabel('Success_Period') + "</td></tr>";
            }

        }
        status += "</table>";
        var _this = this;
        var contentHTML = new Element('div', { 'class': 'Onb_popUp' });
        contentHTML.update('');
        contentHTML.insert(status);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            periodStatusPopUp.close();
            delete periodStatusPopUp;
            if (type == 'E') {
            } else {
                //refresh
                _this._getPeriod("2", "1", _this.step, false);
            }
        };
        var aux2 = {
            idButton: 'goTo',
            label: global.getLabel('ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        var periodStatusPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': callBack

            }),
            htmlContent: contentHTML,
            indicatorIcon: icon,
            width: 350
        });
        periodStatusPopUp.create();

    },

    /**
    * @description Shows the status of the booking after calling SAP
    * @param req Result of the AJAX request
    */
    _processExitSubmit: function(req) {

        if (!Object.isEmpty(req.EWS.o_reqid)) {
            this.reqId = req.EWS.o_reqid;
        }
        var icon = '';
        var popup = true;
        var status = "<table id='application_period_contain_status'>";
        if (Object.isEmpty(req.EWS.webmessage_type)) {
            if (Object.isEmpty(req.EWS.messages)) {
                var popup = false;
                //status += "<tr class='application_period_status_line'><td class='application_period_status_label'>" + global.getLabel('Success_Submit') + "</td></tr>";
                //icon = 'confirmation';
            } else {
                var message = req.EWS.messages.item['#text'];
                status += "<tr class='application_period_status_line'><td class='application_period_status_label'>" + message + "</td></tr>";
                icon = 'confirmation';
            }
        }
        else {
            var message = req.EWS.webmessage_text;
            var type = req.EWS.webmessage_type
            if (type == 'E') {
                icon = 'exclamation';
                status += "<tr class='application_book_status_line'><td class='application_period_status_label'>" + message + "</td></tr>";
            }
            else {
                icon = 'confirmation';
                status += "<tr class='application_book_status_line'><td class='application_period_status_label'>" + message + "</td></tr>";
            }

        }
        status += "</table>";
        if (popup) {
            var _this = this;
            var contentHTML = new Element('div', { 'class': 'Onb_popUp' });
            contentHTML.update('');
            contentHTML.insert(status);
            //buttons
            var buttonsJson = {
                elements: [],
                mainClass: 'moduleInfoPopUp_stdButton_div_left'
            };
            var callBack = function() {
                submitStatusPopUp.close();
                delete periodStatusPopUp;
                if (type == 'E') {
                } else {
                    _this._back();
                }
            };
            var aux2 = {
                idButton: 'goTo',
                label: global.getLabel('ok'),
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: callBack,
                type: 'button',
                standardButton: true
            };

            buttonsJson.elements.push(aux2);
            var ButtonObj = new megaButtonDisplayer(buttonsJson);
            var buttons = ButtonObj.getButtons();
            //insert buttons in div
            contentHTML.insert(buttons);
            var submitStatusPopUp = new infoPopUp({

                closeButton: $H({
                    'textContent': 'Close',
                    'callBack': callBack

                }),
                htmlContent: contentHTML,
                indicatorIcon: icon,
                width: 350
            });
            submitStatusPopUp.create();
        }

    },

    Submit: function() {

        if (Object.isEmpty(this.ping)) {

            this._pingMessage();

        } else {

            /*    if (!this.reqId)
            this.reqId = '';*/

            var xml_in = '<EWS>'
                      + '<SERVICE>' + this.getSubmitService + '</SERVICE>'
                      + '<PARAM>'
                        + '<APPID>EOB_TIME</APPID>'
                        + '<REQID>' + this.reqId + '</REQID>'
                      + '</PARAM>'
                    + '</EWS>';
            //off line
            //this.method = 'GET';
            //this.url = 'standard/Onboarding/XMLOUT_GETWIZARD.xml';
            this.makeAJAXrequest($H({
                xml: xml_in,
                successMethod: '_processExitSubmit'
            , failureMethod: '_processExitSubmit'
            , errorMethod: '_processExitSubmit'
            , informationMethod: '_processExitSubmit'
            }));
        }
    },

    _pingMessage: function() {

        var icon = '';
        var status = "<table id='application_time_contain_status'>";
        icon = 'exclamation';
        status += "<tr class='application_book_status_line'><td class='application_time_status_label'>" + this.pingMessage + "</td></tr>";
        status += "</table>";
        var _this = this;
        var contentHTML = new Element('div', { 'class': 'Onb_popUp' });
        contentHTML.update('');
        contentHTML.insert(status);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            timeStatusPopUp.close();
            delete timeStatusPopUp;
        };
        var aux2 = {
            idButton: 'goTo',
            label: global.getLabel('ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        var timeStatusPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': callBack
            }),
            htmlContent: contentHTML,
            indicatorIcon: icon,
            width: 350
        });
        timeStatusPopUp.create();

    },
    /**    
    *@description Goes back to the previous application
    */
    _back: function() {
      
       /* if (this.TWfield)
            this.TWfield.destroy();
        //structureHash
        var fieldsRows = this.structureHash.get(this.step).row;
        for (var i = 0; i < fieldsRows.keys().length; i++) {
            var fiedlsColumns = fieldsRows.get(fieldsRows.keys()[i]).columns;
            for (var j = 0; j < fiedlsColumns.keys().length; j++) {
                this.structureHash.get(this.step).row.get(fieldsRows.keys()[i]).columns.get(fiedlsColumns.keys()[j]).field.destroy();
            }
        }*/
        this.reqId = '000000';
        global.open($H({ app: { appId: this.prevApp, tabId: this.prevTab, view: this.prevView} }));

    },

    /**
    *@param $super The superclass: Onb_Overview_standard
    *@description Closes the application
    */
    close: function($super) {
        $super();
 
    }
});