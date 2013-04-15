/** 
* @fileOverview maintainNew.js 
* @description File containing class maintainNew. 
* Application for Maintain OM.
*/

/**
*@constructor
*@description Class maintainNew_standard.
*@augments GenericCatalog 
*/
var maintainNew = Class.create(GenericCatalog,
/** 
*@lends maintainNew_standard
*/
    {
    maintViewContainerChild: 'MGMT_OS',
    /**
    *Constructor of the class maintainNew_standard
    */
    initialize: function($super, args) {
        $super(args);
        this.actionClickedBinding = this.actionClicked.bindAsEventListener(this);
    },

    /**
    *@description Starts maintainNew_standard
    */
    run: function($super, args) {
        $super(args);
        document.observe(this.applicationId + ':action', this.actionClickedBinding);
    },
    /**     
    *@description It sets the HTML structure 
    */
    setHTML: function(data) {
        this.json = data;
        this.data = this.handleData(data);
        this.virtualHtml.insert(
					"<div id='" + this.applicationId + "_level3' class='genCat_level3'></div>" +
					"<div id='" + this.applicationId + "_level2' class='genCat_level2'></div>" +
					"<div id='" + this.applicationId + "_level4' class='genCat_level4'></div>" +
					"<div class='genCat_backTop'>" +
					    "<span id='" + this.applicationId + "_backTop' class='application_action_link'>" + global.getLabel("backtoroot") + "</span>" +
					"</div>" +
					"<div style='clear:both'>&nbsp;</div>" +
					"<div id='" + this.applicationId + "_level5' class='genCat_level5'></div>"
		);
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').observe('click', function() {
            this.backTop();
        } .bind(this));
        this.setDatePickersDiv();
        this.setAutoCompleterDiv();
        this.setLegendDiv();
        this.setTreeDiv();
        this.trees.each(function(tree) {
            tree.value.expandNodeById(tree.key);
        } .bind(this));
    },
    /**     
    *@description It sets the third HTML level (the DatePickers one)
    */
    setDatePickersDiv: function() {
        this.datePickersLabel = new Element('span', { className: 'application_main_title3' });
        //this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.datePickersLabel.update(global.getLabel('date')).wrap('div', { className: 'genCat_label' })); //this.data.datePickersLabel));
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert("<div class='genCat_comp OM_Maintain_datesDiv' id='" + this.applicationId + "_datePickers'>" +
																				"<span class='application_main_text genCat_from'>" + global.getLabel('date') + "</span>" +
																				"<div id='" + this.applicationId + "_datePickerBeg'></div>" +
    																		  "</div>");
        var aux = { events: $H({ 'correctDay': 'EWS:' + this.applicationId + '_correctDay' }),
                    manualDateInsertion: true,
                    defaultDate: objectToSap(new Date()).gsub('-', '') };
        this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
    },
    /**     
    *@description It sets the second HTML level (the autoCompleter one)
    */
    setAutoCompleterDiv: function() {
        this.autoCompleterLabel = new Element('span', { className: 'application_main_title3' });
        this.radioButtonsGroup = new Element('div', { id: this.applicationId + '_radioButtonsGroup', className: 'genCat_radioButtonsGroup OM_Maintain_searchDiv' });
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert("<div class='genCat_comp OM_Maintain_searchDiv' id='" + this.applicationId + "_autocompleter'></div>");
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.radioButtonsGroup);
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: 'No results found',
                    search: 'Search'
                }
            }
        };
        this.autoCompleter = new JSONAutocompleter(this.applicationId + '_autocompleter', {
            events: $H({ onGetNewXml: this.applicationId + ':nodeSearch',
                onResultSelected: this.applicationId + ':nodeSelected'
            }),
            showEverythingOnButtonClick: true,
            noFilter: true,
            timeout: 0,
            templateResult: '#{text}',
            maxShown: 20,
            minChars: 1
        }, json);
        var radioButton = "<div class='OM_checkboxes'><input type='radio' name='gcRadioGroup' value='O' checked>" + global.getLabel('ORGEH') + "</input></div>" +
                          "<div class='OM_checkboxes'><input type='radio' name='gcRadioGroup' value='S'>" + global.getLabel('PLANS') + "</input></div>";
        this.radioButtonsGroup.insert(radioButton);        
    },
    /**
    * @description Method that delimits an object type after the user confirmation
    */
    genericDelimit: function(oType, objectId, actionId, appName, message, code) {
        var genericDelimitHtml = "<div>"
                                   + "<span>" + message + "</span><br>"
                                   + "<span</span>"
                                   + "<div id='delimit_" + objectId + "DatePicker'></div>"
                                   + "</div>";
        var aux = { defaultDate: objectToSap(new Date()).gsub('-', '') };

        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(genericDelimitHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function() {
            if (_this)
                _this.genericDelimitRequest(oType, objectId, actionId, appName, code);
            delimitCataloguePopUp.close();
            delete delimitCataloguePopUp;
        };
        var callBack3 = function() {
            delimitCataloguePopUp.close();
            delete delimitCataloguePopUp;
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
            handler: callBack3,
            type: 'button',
            standardButton: true
        };   
        buttonsJson.elements.push(aux2);
        buttonsJson.elements.push(aux3);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);

        var delimitCataloguePopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    delimitCataloguePopUp.close();
                    delete delimitCataloguePopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 600
        });
        delimitCataloguePopUp.create();
        this.genericDelimitDatePicker = new DatePicker('delimit_' + objectId + 'DatePicker', aux);
    },
    /**
    * @description Builds the xml and send it to SAP for the Delimit request
    */
    genericDelimitRequest: function(oType, objectId, actionId, appName, code) {
        if (Object.isEmpty(appName))
            appName = "";
        else
            appName = getSapName(appName);
        var begDay = this.datePickerBeg.getDateAsArray().day;
        var begMonth = this.datePickerBeg.getDateAsArray().month;
        var begYear = this.datePickerBeg.getDateAsArray().year;
        if (begDay.length == 1)
            begDay = '0' + begDay;
        if (begMonth.length == 1)
            begMonth = '0' + begMonth;
        var xml = "<EWS>"
                    + "<SERVICE>" + this.genericDeleteService + "</SERVICE>"
                    + "<OBJECT TYPE=\"" + oType + "\">" + objectId + "</OBJECT>"
                    + "<PARAM>"
                        + "<REQ_ID></REQ_ID>"
                        + "<APPID>" + appName + "</APPID>"
                        + "<KEYDATE>" + begYear + '-' + begMonth + '-' + begDay + "</KEYDATE>"
                        + "<UPD_DATE>" + objectToSap(this.genericDelimitDatePicker.actualDate) + "</UPD_DATE>"
                        + "<BUTTON ACTION=\"" + actionId + "\" OKCODE=\"" + code + "\" />"
                    + "</PARAM>"
                 + "</EWS>";

        this.makeAJAXrequest($H({ xml: xml, successMethod: 'genericDelimitAnswer' }));
    },
    /**
    * @description Receives the answer from SAP about the delimit.
    */
    genericDelimitAnswer: function(answer) {
        if (answer.EWS) {
            this.backTop();
        }
    },
    /**     
    *@param args {JSON} node contextual actions
    *@param ajaxId {String} node id and type
    *@description It fills the Balloon object with a node contextual actions links:
    *when clicking on each link (action) it will be fire the event this.applicationId+":action" 
    *containing the related action information (default: the action name) as 
    *the event sent parameters.
    */
    showActions: function(args, ajaxId) {
        var element = 'treeHandler_text_' + ajaxId.split('_')[0] + '_' + ajaxId.split('_')[2] + '_' + this.applicationId + '_level5_' + ajaxId.split('_')[1];
        var html = new Element('div');
        if (args && args.EWS && args.EWS.o_actions && args.EWS.o_actions.yglui_vie_tty_ac) {
            objectToArray(args.EWS.o_actions.yglui_vie_tty_ac).each(function(action) {
                var name = action['@actio'];
                var textAux = action['@actiot'];
                var text = textAux.gsub('\\(\\(L\\)\\)', '');
                var app = action['@tarap'];
                var okCode = action['@okcod'];
                var nodeId = ajaxId.split("_")[0];
                var nodeType = ajaxId.split('_')[1];
                var mode = action['@tarty'];
                var span = new Element('div', { 'class': 'application_action_link genCat_balloon_span' }).insert(text);
                html.insert(span);
                span.observe('click', document.fire.bind(document, this.applicationId + ":action", $H({
                    name: name,
                    nodeId: nodeId,
                    application: app,
                    nodeType: nodeType,
                    okCode: okCode,
                    mode: mode
                })));
            } .bind(this));
        } else {
            var span = new Element('div', { 'class': 'genCat_balloon_span' }).insert(global.getLabel('noActionsAvailable'));
            html.insert(span);
        }
        balloon.showOptions($H({
            domId: element,
            content: html
        }));
    },
    /**     
    *@description It executes the code that belongs to the action clicked 
    */
    actionClicked: function(parameters) {
        var name = getArgs(parameters).get('name');
        var nodeId = getArgs(parameters).get('nodeId');
        var nextApp = getArgs(parameters).get('application');
        var nodeType = getArgs(parameters).get('nodeType');
        var okCode = getArgs(parameters).get('okCode');
        var mode = getArgs(parameters).get('mode');
        mode = (mode != "P") ? '' : 'popUp';

        switch (name) {
            case 'OM_MASS_TRANSL': // mass translation
                document.fire('EWS:openApplication', $H({ app: nextApp, objectId: nodeId, mode: mode }));
                balloon.hide();
                break;
            case 'OM_ORG_CREATE': // create an org unit
                document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'maintainNew', objectId: nodeId, parentType: nodeType, oType: 'O', displayMode: 'create', okCode: okCode, mode: mode }));
                balloon.hide();
                break;
            case 'OM_ORG_DEL': // delete an org unit
                this.genericDelete(nodeType, nodeId, name, '', global.getLabel('deleteObj'), okCode);
                balloon.hide();
                break;
            case 'OM_ORG_DELIMIT': // delimit an org unit
                this.genericDelimit(nodeType, nodeId, name, '', global.getLabel('delimitObj'), okCode);
                balloon.hide();
                break;
            case 'OM_ORG_DISPLAY': // view org unit details
                document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'maintainNew', objectId: nodeId, parentType: nodeType, oType: 'O', displayMode: 'display', okCode: okCode, mode: mode }));
                balloon.hide();
                break;
            case 'OM_ORG_EDIT': // edit an org unit
                document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'maintainNew', objectId: nodeId, parentType: nodeType, oType: 'O', displayMode: 'edit', okCode: okCode, mode: mode }));
                balloon.hide();
                break;
            case 'OM_ASSIGN_HOLDER': // assign
                document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'maintainNew', objectId: nodeId, parentType: nodeType, oType: 'S', displayMode: 'edit', okCode: okCode, mode: mode }));
                balloon.hide();
                break;
            case 'OM_CHANGE_ASSIGN': // change assign
                document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'maintainNew', objectId: nodeId, parentType: nodeType, oType: 'S', displayMode: 'edit', okCode: okCode, mode: mode }));
                balloon.hide();
                break;
            case 'OM_POS_CREATE': // create position
                document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'maintainNew', objectId: nodeId, parentType: nodeType, oType: 'S', displayMode: 'create', okCode: okCode, mode: mode }));
                balloon.hide();
                break;
            case 'OM_POS_DEL': // delete a position
                this.genericDelete(nodeType, nodeId, name, '', global.getLabel('deleteObj'), okCode);
                balloon.hide();
                break;
            case 'OM_POS_DELIMIT': // delimit a position
                this.genericDelimit(nodeType, nodeId, name, '', global.getLabel('delimitObj'), okCode);
                balloon.hide();
                break;
            case 'OM_POS_DISPLAY': // view position details
                document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'maintainNew', objectId: nodeId, parentType: nodeType, oType: 'S', displayMode: 'display', okCode: okCode, mode: mode }));
                balloon.hide();
                break;
            case 'OM_POS_EDIT': // edit a position
                document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'maintainNew', objectId: nodeId, parentType: nodeType, oType: 'S', displayMode: 'edit', okCode: okCode, mode: mode }));
                balloon.hide();
                break;
            case 'OM_MGMT_ASSIGN': // manage holder assign      
                document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'maintainNew', objectId: nodeId, parentType: nodeType, oType: 'S', displayMode: 'edit', okCode: okCode, mode: mode }));
                balloon.hide();
                break;
            case 'OM_PERSON_DISPLAY': // view person details
                document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'maintainNew', objectId: nodeId, parentType: nodeType, oType: 'P', displayMode: 'display', okCode: okCode, mode: mode }));
                balloon.hide();
                break;
            default:
                balloon.hide();
                break;
        }
    },
    /**
    *@description Stops maintainNew_standard
    */
    close: function($super) {
        $super();
        document.stopObserving(this.applicationId + ':action', this.actionClickedBinding);
    }
});
    
    

    
