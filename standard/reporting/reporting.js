var Reporting_standard = Class.create(Application, {
    //    version: '090928',
    /**
    * @type DOM Div element
    * @description Main div for the application screen. This div contains the tree, the spool, ...
    */
    mainDiv: null,
    /**
    * @type DOM Div element
    * @description Reports div contained in the main div
    */
    reportsDiv: null,
    /**
    * @type DOM Div element
    * @description resultSummary div contained in the main div
    */
    //resultSummaryDiv: null,
    /**
    * @type DOM Div element
    * @description
    */
    selectionDiv: null,
    /**
    * @type DOM Div element
    * @description
    */
    resultListDiv: null,
    /**
    * @type DOM Div element
    * @description
    */
    resultDiv: null,
    /**
    * @type DOM Div element
    * @description the div which contains the progress bar for an executed report
    */
    progressBarDiv: null,
    /**

    * @type DOM Div element
    * @description the div which contains important messages
    */
    messageDiv: null,
    /**
    * @type DOM Table element
    * @description This is the table containing the list of spool results
    */
    spoolTable: null,

    /**
    * @type JS Object selScreen
    * @description Selection screen object used for reports definition
    */
    selectionScreen: null,
    /**
    * @type JS Object TreeHandler
    * @description The treeHandler displaying the available reports
    */
    trees: null,
    /**
    * @type JS Object unmWidget
    * @description Unmoveable widget containing the spool results
    */
    resultWidget: null,

    /**
    * @type String
    * @description The current reporting mode (Hr Reports, Pay Reports, Time reports)
    */
    mode: null,
    /**
    * @type String
    * @description last selected report id
    */
    currentReport: null,

    /**
    * @type Array {reportId, reportName, reportDescr, reportParent}
    * @description List of available reports with description and parent
    */
    availableReports: null,

    /**
    * @type DOM Table Element
    * @description HTML table used to display the results of an XML report
    */
    resultTable: null,
    /**
    * @type String 
    * @description This variable holds the execution date of a selected report
    */
    resultExecDate: null,
    /**
    * @type String 
    * @description This variable holds the execution time of a selected report
    */
    resultExecTime: null,
    /**
    * @type DOM Div Element
    * @description The DIV containing the left title
    */
    titleMenuLeftDiv: null,
    /**
    * @type DOM Div Element
    * @description The DIV containing the right title
    */
    titleMenuRightDiv: null,
    /**
    * @type Megabutton displayer
    * @description Megabutton displayer containing the left menu title buttons
    */
    ButtonDisplayerLeft: null,
    /**
    * @type Megabutton displayer
    * @description Megabutton displayer containing the right menu title buttons
    */
    ButtonDisplayerRight: null,
    /**
    * @type DOM Div Element
    * @description This attributes represents the "Back" link of the application
    */
    backSpan: null,
    /**
    * @type DOM Div Element
    * @description This attributes represents the "Relaunch" link of the application
    */
    relaunchSpan: null,
    /**
    * @type DOM Div Element
    * @description This attributes represents the "Refresh" link of the application
    */
    refreshSpan: null,
    /**
    * @type String
    * @description This attributes holds the identifier of the current screen 
    */
    currentScreen: null,
    /**
    * @type String
    * @description This attributes holds the value for the current subtitle 
    */
    subTitle: null,
    /**
    * @type boolean
    * @description This attributes acts as a flag to check if the subtitle is displayed or not
    */
    subTitleVisible: null,

    /**
    * @type Object
    * @description List of the event handlers for global observers
    */
    eventListeners: null,
    /**
    * @type integer Number of displayed table in a result
    */
    resultsTableNbr: null,
    /**
    * @type boolean Flag meaning if we are coming from the spool
    */
    fromSpool: null,
    /**
    * @type String Last spool report ID
    */
    lastSpoolReport: null,

    /**
    * @type Hash
    * @description List of labels added dynamically
    */
    dynLabels: null,

    /**
    * @type String Type of the current report
    */
    reportType: null,
    /**
    * @type String Result Title
    */
    resultTitle: null,

    /**
    * @type String
    * @description Identifier of the execution result to delete
    */
    resultToDel: '',
    /**
    * @type String HTML Content for an error popup
    */
    htmlErrorPopupContent: '',
    /**
    * @type DOM Div element Button container of the page
    */
    buttonContainer: null,
    /**
    * @type DOM Div element Original print button div
    */
    originalPrint: null,
    /**
    * @type DOM Div element Original help button div
    */
    helpButton: null,
    /**
    * @type DOM Div element New print button div
    */
    new_print: null,
    /**
    * @type Hash Hash representing the searchHelps that are available on the selection screen
    */
    searchHelps: null,
    /**
    * @type Hash Hash representing the dependencicies between fields of the selection screen
    */
    dependencies: null,
    /**
    * @type Integer Current result ID
    */
    currentResult: 0,
    /**
    * @type Object the last Node at the reports TreeHandler highlighted
    */
    lastNodeHighlighted: null,

    deleteSpan: null,

    serviceName: null,
    successMethodToCall: null,

    cancelButton: null,
    executeButton: null,

    parentGroupRangeSelection: null,

    /**
    * Id of the report currently running or displayed
    * @type String
    * @since 26/03/2010
    */
    reportId: null,
    contAction: null,
    //the progress bar
    pb: null,

    /**
    * @description initializer function
    * @param {Object} $super Parent object
    */
    initialize: function($super, appName) {
        $super(appName);
        this.eventListeners = {
            getReportInfo: this.getReportInfo.bindAsEventListener(this),
            displayResultFromSpool: this.displayResultFromSpool.bindAsEventListener(this),
            executeReport: this.executeReport.bindAsEventListener(this),
            getSearchHelpValues: this.getSHValues.bindAsEventListener(this),

            deleteResultFromSpool: this.deleteResultFromSpool.bindAsEventListener(this),
            //,
            //            keyPressed: this.showVersion.bindAsEventListener(this)

            //autocompleterGetNewXml: this.autocompleterGetNewXmlListener.bindAsEventListener(this),
            autocompleterResultSelected: this.autocompleterResultSelectedListener.bindAsEventListener(this)

        };
        this.dynLabels = $H();

        this.parentGroupRangeSelection = $H();

    },

    /**
    * @description execution function
    * @param {Object} $super Parent object
    */
    run: function($super, mode) {
        $super();
        this.mode = mode.get('app').appId; //mode;
        // set the observers
        /*
        Event.observe(document, 'keypress', function(event) {
        if (event.shiftKey == true && event.keyCode === Event.KEY_HOME) {
        this.showVersion();
        }
        } .bind(this));
        */

        document.observe('EWS:treeHandler_textClicked', this.eventListeners.getReportInfo);
        document.observe('EWS:Reporting_result_display_from_spool', this.eventListeners.displayResultFromSpool);
        document.observe('EWS:reporting_execute_report', this.eventListeners.executeReport);
        document.observe('EWS:getSHValues', this.eventListeners.getSearchHelpValues);
        document.observe('EWS:Reporting_result_delete_from_spool', this.eventListeners.deleteResultFromSpool);
        //		document.observe('keypress', this.eventListeners.keyPressed);


        //document.observe('EWS:REPT_autocompleterGetNewXml', this.eventListeners.autocompleterGetNewXml);
        document.observe('EWS:REPT_autocompleterResultSelected', this.eventListeners.autocompleterResultSelected);


        this.resultsTableNbr = $A();

        if (this.firstRun) {
            this.availableReports = $A();
            this.trees = $A();
            this.buildWelcomeScreen();
            this.buttonContainer = $("fwk_5_bottom").down();
            this.originalPrint = this.buttonContainer.down('[id=fwk_print]');
            this.helpButton = this.buttonContainer.down('[class=application_main_help]');
        } else {
            this.serviceName = 'GET_RESULT_NB'; //deprecated
            this.successMethodToCall = 'buildSpool';
            this.callServiceWithMode();
            //this.getNumberSpool(); 
        }
    },

    /**
    * @description Closing function
    * @param {Object} $super Parent object
    */
    close: function($super) {
        $super();
        // remove the observers
        document.stopObserving('EWS:treeHandler_textClicked', this.eventListeners.getReportInfo);
        document.stopObserving('EWS:Reporting_result_display_from_spool', this.eventListeners.displayResultFromSpool);
        document.stopObserving('EWS:reporting_execute_report', this.eventListeners.executeReport);

        document.stopObserving('EWS:getSHValues', this.eventListeners.getSearchHelpValues);

        //stop observing
        document.stopObserving('EWS:REPT_autocompleterResultSelected', this.eventListeners.autocompleterResultSelected);
        //document.stopObserving('EWS:autocompleterGetNewXml', this.autoCompleterGetXML.bindAsEventListener(this));

        //		document.stopObserving('keypress');
    },

    callServiceGetValuesByDependency: function(fieldId, subfieldId, fieldTectName, repId, rangeSelected, searchPattern) {

        var xml = '<EWS>' +
		 '<SERVICE>get_poss_val_rp</SERVICE>' +
		 '<DEL/>' +
		 '<PARAM>' +
		  '<FIELD FIELDID="' + subfieldId + '" FIELDTECHNAME="' + fieldTectName + '"/>' +
		  '<I_REPORTID>' + repId + '</I_REPORTID>' +
		  '<SEARCH_PATTERN>' + searchPattern + '</SEARCH_PATTERN>' +
		  '<I_DEP_FIELD VALUE_LOW="' + this.parentGroupRangeSelection.get(fieldId).low + '" VALUE_HIGH="' + this.parentGroupRangeSelection.get(fieldId).high + '"/>' +
		 '</PARAM>' +
		'</EWS>';

        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this.updateSubGroup.bind(this, subfieldId, false, rangeSelected, '')
        }));

    },
    callServiceGetValuesForParent: function(fieldId, subfieldId, fieldTectName, repId, pattern, rangeSelected) {
        var xml = '<EWS>' +
		 '<SERVICE>get_poss_val_rp</SERVICE>' +
		 '<DEL/>' +
		 '<PARAM>' +
		  '<FIELD FIELDID="' + subfieldId + '" FIELDTECHNAME="' + fieldTectName + '"/>' +
		  '<I_REPORTID>' + repId + '</I_REPORTID>' +
		  '<SEARCH_PATTERN>' + pattern + '</SEARCH_PATTERN>' +
		  '<I_DEP_FIELD VALUE_LOW="' + this.parentGroupRangeSelection.get(fieldId).low + '" VALUE_HIGH="' + this.parentGroupRangeSelection.get(fieldId).high + '"/>' +
		 '</PARAM>' +
		'</EWS>';
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this.updateSubGroup.bind(this, subfieldId, true, rangeSelected, xml)
        }));
    },


    callServiceWithMode: function() {
        var servXml = '<EWS>'
				+ '<SERVICE>' + this.serviceName + '</SERVICE>'
				+ '<DEL/>'
				+ '<PARAM>'
				+ '<I_REPORT_TYPE>' + this.mode + '</I_REPORT_TYPE>'
				+ '</PARAM>'
				+ '</EWS>';

        this.makeAJAXrequest($H({
            xml: servXml,
            successMethod: this.successMethodToCall
        }));
    },

    callServiceWithSpoolId: function(spoolId) {
        var servXml = '<EWS>'
        			+ '<SERVICE>' + this.serviceName + '</SERVICE>'
					+ '<DEL/>'
					+ '<PARAM>'
					+ '<I_RESULT_ID>' + spoolId + '</I_RESULT_ID>'
					+ '</PARAM>'
					+ '</EWS>';

        this.makeAJAXrequest($H({
            xml: servXml,
            successMethod: this.successMethodToCall
        }));
    },

    callServiceWithResultId: function(resultId) {
        var servXml = '<EWS>'
					+ '<SERVICE>' + this.serviceName + '</SERVICE>'
					+ '<DEL/>'
					+ '<PARAM>'
					+ '<I_RESULT_ID>' + resultId + '</I_RESULT_ID>'
					+ '</PARAM>'
					+ '</EWS>';

        this.makeAJAXrequest($H({
            xml: servXml,
            successMethod: this.successMethodToCall
        }));
    },

    callServiceWithReportId: function(reportId) {
        reportId = reportId.gsub("~", "_");
        var servXml = '<EWS>'
					+ '<SERVICE>' + this.serviceName + '</SERVICE>'
					+ '<DEL/>'
					+ '<PARAM>'
					+ '<I_REPORT>' + reportId + '</I_REPORT>'
					+ '</PARAM>'
					+ '</EWS>';

        this.makeAJAXrequest($H({
            xml: servXml,
            successMethod: this.successMethodToCall
        }));
    },

    /**
    * Get the list of fields with actions from the backend
    * @param {String} reportId Id of the report used to load the contextual actions
    * @since 26/03/2010
    */
    callServiceContActionsParams: function(reportId, resultId) {
        var servXml = '<EWS>'
					+ '<SERVICE>GET_RESULT_CA</SERVICE>'
					+ '<PARAM>'
					+ '<I_REPORTID>' + reportId + '</I_REPORTID>'
					+ '</PARAM>'
					+ '</EWS>';

        this.makeAJAXrequest($H({
            xml: servXml,
            successMethod: this.manageContActionsFields.bind(this, resultId)
        }));
    },

    /**
    * Get the list of contextual actions
    * @param {String} actionId Id of the list of actions to load
    * @param {String} otype Otype of the element that need actions
    * @param {String} employeeId Id of the employee
    * @param {Element} element Element that contains the field that asked actions
    * @since 26/03/2010
    */
    callServiceListContextActions: function(actionId, otype, employeeId, element) {
        var servXml = '<EWS>'
					+ '<SERVICE>GET_CAT_ACTIO</SERVICE>'
					+ '<OBJECT TYPE="' + otype + '">' + employeeId + '</OBJECT>'
					+ '<PARAM>'
					+ '<CONTAINER_PARENT/>'
					+ '<CONTAINER_CHILD>' + actionId + '</CONTAINER_CHILD>'
					+ '</PARAM>'
					+ '</EWS>';

        this.makeAJAXrequest($H({
            xml: servXml,
            successMethod: this.displayContextualActions.bind(this, element, employeeId)
        }));
    },

    /**
    * Manage the list of fields that need contextual actions
    * @param {JSON Object} listFields List of the fields that need contextual actions
    * @since 26/03/2010
    */
    manageContActionsFields: function(resultId, listFields) {
        this.contAction = $H();
        if (!Object.isEmpty(listFields.EWS.o_cat_actio)) {
            objectToArray(listFields.EWS.o_cat_actio).each(function(action) {
                var params = { otype: new Number(action['@otype_colnr']) - 1, objid: new Number(action['@objid_colnr']) - 1, appId: action['@actio_appid'] };
                if (!Object.isEmpty(action['@otype_fixed']) && action['@otype_fixed'] !== '') params.otype = action['@otype_fixed'];
                this.contAction.set(new Number(action['@actio_colnr']) - 1, params);
            }, this);
        }

        this.serviceName = 'GET_RESULT';
        this.successMethodToCall = 'drawResult';
        this.callServiceWithSpoolId(resultId);
    },

    /**
    * Display the list of contextual actions for an employee
    * @param {Element} element Element that contains the field that asked actions
    * @param {JSON Object} actions List of contextual actions
    * @since 26/03/2010
    */
    displayContextualActions: function(element, employeeId, actions) {
        var balloonContent = new Element('div', { 'id': 'Rept_ContextualMenu' });
        var menuString = '';

        var listActions = $A();
        if (actions.EWS.o_actions) listActions = objectToArray(actions.EWS.o_actions.yglui_vie_tty_ac);

        //If there is nothing to set in the menu
        if (listActions.size() === 0) {
            balloonContent.insert(global.getLabel('NoActions'));

            //If there is something in the menu
        } else {
            balloonContent.insert('<div>' + global.getLabel('ListAvailableActions') + '</div>');

            menuString = '<ul>';
            listActions.each(function(action) {
                tabid = (action['@tartb'] || '');
                if (action['@tarty'] === 'P') tabid = 'POPUP';
                menuString += '<li class="Rept_ContextualMenuAction application_action_link" appid="' + (action['@tarap'] || '') + '" tabid="' + tabid + '" view="' + (action['@views'] || '') + '">' + (global.getLabel(action['@actiot']) || '').gsub('((L))', ''); +'</li>';
            }, this);
            menuString += '</ul>';

            balloonContent.insert(menuString);
        }

        //Add the content of the balloon
        balloon.setOptions($H({
            domId: element.identify(),
            content: balloonContent
        }));

        //Add the actions on click
        balloonContent.select('li.Rept_ContextualMenuAction').each(function(liItem) {
            liItem.observe('click', function(event) {
                var element = event.element();
                //the use of try catch is not recommended,slows the webpage
                try {//the use of try catch is not recommended,slows the webpage
                    global.setEmployeeSelected(employeeId, true);
                } catch (e) { }
                global.open($H({
                    app: {
                        appId: element.readAttribute('appid'),
                        tabId: element.readAttribute('tabid'),
                        view: element.readAttribute('view')
                    }
                }));

                balloon.hide();
            } .bindAsEventListener(this));
        }, this);

        balloon.show();
    },

    /**
    * @description Function in charge of making an ajax call to get the fields
    *				that compose the report selection screen.
    * @param {String} reportId Identifier of the selected report.
    * @param {String} variantId Identifier of the selected report variant.
    */


    //found get report ss service call, get techname here
    getReport: function(reportId, variantId) {
        // BUG #3872 - BEG
        if (variantId) variantId = variantId.gsub("~", "_");
        else variantId = '';
        if (reportId) reportId = reportId.gsub("~", "_");
        else reportId = '';
        // BUG #3872 - END
        var servXml = '<EWS>'
        		+ '<SERVICE>get_report_ss</SERVICE>'
				+ '<DEL/>'
				+ '<PARAM>'
				+ '<i_report>' + reportId + '</i_report>';
        if (!Object.isEmpty(variantId))
            servXml += '<i_variant>' + variantId + '</i_variant>';

        servXml += '</PARAM>'
				+ '</EWS>';

        this.makeAJAXrequest($H({
            xml: servXml,
            successMethod: 'buildSelectionScreen'
        }));
    },


    /**
    *@description Function in charge of making an ajax call to execute the report.
    *@param {String} reportId Identifier of the report to execute.
    *@param {String} variantId Identifier of the report variant to execute.
    *@param {Array} listValues List of the values filled in the selection screen
    * @param {String} subtitle Subtitle to send to the execution of the report (since 24/03/2010)
    * @param {String} forceBackground '' or 'X' to indicate if the background is to launch automatically (since 24/03/2010)
    */
    execReport: function(reportId, variantId, listValues, lastJson, subtitle, forceBackground) {
        var fields;
        var areas;
        // BUG #3872 - BEG
        if (variantId) variantId = variantId.gsub("~", "_");
        else variantId = '';
        if (reportId) reportId = reportId.gsub("~", "_");
        else reportId = '';
        // BUG #3872 - END
        var servXml = '<EWS>'
					+ '<SERVICE>exec_report</SERVICE>'
					+ '<DEL/>'
					+ '<PARAM>'
					+ '<I_REPORT>' + reportId + '</I_REPORT>'
					+ '<I_VARIANT>' + variantId + '</I_VARIANT>'
        //since 24/03/2010 Add the subtitle and the force background execution
					+ '<I_SUBTITLE>' + subtitle + '</I_SUBTITLE>'
					+ '<I_FORCE_BACKGROUND>' + forceBackground + '</I_FORCE_BACKGROUND>'
					+ '<I_FIELDS>';

        if (!Object.isEmpty(lastJson.EWS.o_fields)) {
            areas = objectToArray(lastJson.EWS.o_fields.yglui_str_rp_o_selscreen_02);
            areas.each(function(area) {
                if (Object.isEmpty(area.fields)) return;

                servXml += '<yglui_str_rp_o_selscreen_02 fldgroup_id="' + area['@fldgroup_id'] + '" tag="' + area['@tag'] + '">'
    						+ '<fields>';
                fields = objectToArray(area.fields.yglui_str_rp_o_screenfields_02);
                fields.each(function(field) {
                    fieldValues = listValues.get(field['@fieldname']);
                    if (!fieldValues) return;
                    if (Object.isEmpty(fieldValues.highValue))
                        fieldValues.highValue = '';

                    servXml += '<yglui_str_rp_o_screenfields_02 '
    										+ 'datatype="' + field['@datatype'] + '" '
    										+ 'fieldname="' + field['@fieldname'] + '" '
    										+ 'fieldtype="' + field['@fieldtype'] + '" '
    										+ 'max_length="' + field['@max_length'] + '" '
    										+ 'tag="' + field['@tag'] + '">';

                    //lets add the value descriptions only for the necessary fields  PNPPERNR,PNPWERK,PNPPERSK
                    switch (field['@fieldtype']) {
                        case 'RNG':
                            //create an array with the personal numbers
                            pnarray = fieldValues.lowValue.split(',').reject(function(item) { return (Object.isEmpty(item) || item === '') });
                            //for each employee
                            servXml += '<value_descriptions>';

                            objectToArray(fieldValues.description).each(function(item, index) {
                                servXml += '<YGLUI_STR_RP_VALUE_DESCRIPTION '
                                            + 'value="' + pnarray[index] + '" '
                                            + 'value_text="' + escape(item) + '"/>';
                            }, this);

                            servXml += '</value_descriptions>';

                            //values
                            servXml += '<values>';
                            pnarray.each(function(item) {
                                servXml += '<yglui_str_rp_values '
                                        + 'high="' + '" '
                                        + 'low="' + item + '" '
                                        + 'option="EQ" '  //EQ BT
                                        + 'sign="I"/>';          //by the moment always is I included
                            }, this);

                            servXml += '</values>';
                            servXml += '</yglui_str_rp_o_screenfields_02>';
                            break;
                        default:
                            servXml += '<value_descriptions>';
                            //the low description
                            if (fieldValues.descriptionLow && fieldValues.lowValue != '') {
                                servXml += '<YGLUI_STR_RP_VALUE_DESCRIPTION '
                                        + 'value="' + fieldValues.lowValue + '" '
                                        + 'value_text="' + escape(fieldValues.descriptionLow) + '"/>';
                            }

                            //the high description
                            if (fieldValues.descriptionHigh) {
                                if (fieldValues.highValue != '')
                                    servXml += '<YGLUI_STR_RP_VALUE_DESCRIPTION '
                                            + 'value="' + fieldValues.highValue + '" '
                                            + 'value_text="' + escape(fieldValues.descriptionHigh) + '"/>';
                            }
                            servXml += '</value_descriptions>';
                            //value
                            servXml += '<values>';
                            if (fieldValues.lowValue != '' || (field['@fieldtype'] == 'RDB' || field['@fieldtype'] == 'CHK')) {
                                if (fieldValues.selection == 'single')
                                    servXml += '<yglui_str_rp_values '
                                        + 'high="' + '" '
                                        + 'low="' + fieldValues.lowValue + '" '
                                        + 'option="EQ" '  //EQ BT
                                        + 'sign="I"/>';          //by the moment always is I included
                                else { //range
                                    if (fieldValues.highValue != '') {
                                        servXml += '<yglui_str_rp_values '
                                        + 'high="' + fieldValues.highValue + '" '
                                        + 'low="' + fieldValues.lowValue + '" '
                                        + 'option="BT" '  //EQ BT
                                        + 'sign="I"/>';          //by the moment always is I included
                                    }
                                    else {
                                        servXml += '<yglui_str_rp_values '
                                        + 'high="' + fieldValues.highValue + '" '
                                        + 'low="' + fieldValues.lowValue + '" '
                                        + 'option="EQ" '  //EQ BT
                                        + 'sign="I"/>';          //by the moment always is I included
                                    }
                                }
                            }
                            servXml += '</values>';
                            servXml += '</yglui_str_rp_o_screenfields_02>';
                            break;
                    }
                });

                servXml += '</fields>'
    						+ '</yglui_str_rp_o_selscreen_02>';
            });
        }
        servXml += '</I_FIELDS>'
					+ '</PARAM>'
					+ '</EWS>';

        this.makeAJAXrequest($H({
            xml: servXml,
            successMethod: 'displayResult',
            informationMethod: 'adviceReportInBackground',
            errorMethod: 'errorInReport'
        }));

        //Create the progress bar
        this.showProgressBar(lastJson.EWS.o_maxwait, forceBackground);


    },

    //	*******************************************************

    getSHValues: function(event) {
        this.selectionScreen.getSHValues(event);
    },




    getSearchHelpValues: function(fieldname, depFields, value) {
        if (!this.searchHelps.get(fieldname)) return;
        var sh_service = this.searchHelps.get(fieldname).sh_service;
        var sh_techName = this.searchHelps.get(fieldname).sh_techname;


        depFields = this.dependencies.get(fieldname);
        value = "";

        var servXml = '<EWS>'
					+ '<SERVICE>' + sh_service + '</SERVICE>'
					+ '<DEL/>'
					+ '<PARAM>'
					+ '<FIELD FIELDTECHNAME="' + sh_techName + '"/>'
					+ '<DEP_FIELDS>';

        if (!Object.isEmpty(depFields)) {
            depFields.each(function(depField) {
                servXml += '<FIELD FIELDTECHNAME="' + depField.value.dep_techname + '" VALUE="' + depField.value.dep_val + '"/>'
            });
        }

        servXml += '</DEP_FIELDS>'
  					+ '<SEARCH_PATTERN>' + value + '</SEARCH_PATTERN>'
					+ '</PARAM>'
					+ '</EWS>';

        this.makeAJAXrequest($H({
            xml: servXml,
            successMethod: 'showValues'
        }));
    },

    showValues: function(json) {
        this.selectionScreen.updateSH(json);

    },

    //  *******************************************************	

    /**
    *@description Is there only to overwrite the success method of delResult.
    *@param {Object} json Answer of the service del_result.
    */
    /* method modified on 24-03 change the name of the method (add the 's' at report)*/
    reportsDeleted: function(json) {
        if (this.currentScreen == "spool_list_display") {
            this.refreshSpoolList();
        }
    },

    /* method created on 24-03*/
    reportsRelaunched: function(json) {
        if (this.currentScreen == "spool_list_display") {
            this.refreshSpoolList();
        }
    },

    /**
    *@description Display to the user the message to indicate that the report
    *				was launched in background and go back to the initial page.
    *@param {Object} json Answer of the service exec_report with an information message.
    */
    adviceReportInBackground: function(json) {
        // Go back to the main screen
        this.executeButton.enable('execute_report');
        this.cancelButton.enable('cancelButton');
        this.goReportsList(null);
        // Display the information popup
        this._infoMethod(json);
    },

    errorInReport: function(json) {
        this.executeButton.enable('execute_report');
        this.cancelButton.enable('cancelButton');
        this._errorMethod(json);
    },

    /**
    * @description function in charge of building the element
    *              of the main screen. This function will: -
    *              Get the current mode for the application -
    *              Update the window title - call the function
    *              that builds the content of the screen
    */
    buildWelcomeScreen: function() {
        //this.changeTitle(global.getLabel(this.mode));
        //lets add the main menu title
        //this.titleMenuDiv = this.virtualHtml
        //		.down('[class=application_main_title_div]');
        this.buildTitleMenu();
        this.virtualHtml.insert(this.titleMenuLeftDiv);
        this.virtualHtml.insert(this.titleMenuRightDiv);
        this.buildContentDisplay();
        this.mainDiv.insert(this.reportsDiv); //.insert(this.resultSummaryDiv);
        this.virtualHtml.insert(this.mainDiv);

        this.serviceName = 'GET_REPORT_LST'; //'GET_REPORT_LIST';
        this.successMethodToCall = 'buildReports';
        this.callServiceWithMode();

        //        this.serviceName = 'GET_RESULT_NB';
        //        this.successMethodToCall = 'buildSpool';
        //        this.callServiceWithMode();
    },
    /**     
    *@description It sets the value to show the titlemenu nav links
    */
    buildTitleMenu: function() {
        /* The title left menu div */
        this.titleMenuLeftDiv = new Element('div', {
            className: 'fieldPanel fieldDispFloatLeft',
            id: "title_menu_left_div"
        });

        //Creating the data
        var json = {
            elements: []
        };
        var reportsList = {
            label: global.getLabel('reports_list'),
            idButton: 'WA_ED_reports_list',
            //handlerContext: null,
            className: 'getContentLinks application_action_link',
            handler: function() {
                this.goReportsList(this);
            } .bind(this),
            type: 'link'
        };
        json.elements.push(reportsList);
        var resultsList = {
            idButton: 'WA_ED_results_list',
            //event: "",
            label: global.getLabel('results_list'),
            className: 'getContentLinks application_action_link',
            handler: function() {
                this.serviceName = 'GET_RESULT_LST'; //'GET_RESULT_LIST';
                this.successMethodToCall = 'drawResultList';
                this.callServiceWithMode(this);
            } .bind(this),
            type: 'link'

        };
        json.elements.push(resultsList);
        //we call ButtonDisplayer class to get the elements to display
        this.ButtonDisplayerLeft = new megaButtonDisplayer(json);
        //when we are going to insert the div containing the buttons we do this:
        this.titleMenuLeftDiv.insert(this.ButtonDisplayerLeft.getButtons());
        //lets update the top menu buttons
        this.ButtonDisplayerLeft.setActive('WA_ED_reports_list');
        this.ButtonDisplayerLeft.enable('WA_ED_results_list');

        /*************************************************************************************/
        /* The title right menu div */
        this.titleMenuRightDiv = new Element('div', {
            className: 'fieldPanel fieldDispFloatRight',
            id: "title_menu_right_div"
        });

        //Creating the data
        var json = {
            elements: []
        };
        var resultsList = {
            idButton: 'WA_ED_result_list',
            //event: "",
            label: global.getLabel(''),
            className: 'getContentLinks application_action_link',
            handler: function() {
                this.displayResult(null);
                //this.serviceName = 'GET_RESULT_LST'; //'GET_RESULT_LIST';
                //this.successMethodToCall = 'drawResultList';
                //this.callServiceWithMode(this);
            } .bind(this),
            type: 'link'

        };
        json.elements.push(resultsList);
        var reportsList = {
            label: global.getLabel(''),
            idButton: 'WA_ED_report_name',
            //handlerContext: null,
            className: 'getContentLinks application_action_link',
            handler: function() {
                this.goSelectionScreen(this);
            } .bind(this),
            type: 'link'
        };
        json.elements.push(reportsList);
        //we call ButtonDisplayer class to get the elements to display
        this.ButtonDisplayerRight = new megaButtonDisplayer(json);
        //when we are going to insert the div containing the buttons we do this:
        this.titleMenuRightDiv.insert(this.ButtonDisplayerRight.getButtons());
        //lets update the top menu buttons
        this.ButtonDisplayerRight.disable('WA_ED_report_name');
        this.ButtonDisplayerRight.enable('WA_ED_result_list');

    },

    /**
    * @description function in charge of creating all necessary component for the application.
    * 				That means: the backSpan, the main div, the report div, the result overview div, the result list div,
    * 				the selection div and the result div.
    * 				After the call to this function all objects are instanciated but not yet inserted in the virtualHtml
    */
    buildContentDisplay: function() {
        this.currentScreen = "main_screen";
        /* The backspan */

        // BUG #3832 - BEG
        /*this.getBackSpan();*/

        // BUG #3832 - END

        /* The main div */
        this.mainDiv = new Element('div', {
            className: 'reporting_content',
            id: "reporting_main_div"
        });
        /* The reports div */
        this.reportsDiv = new Element('div', {
            //'class': 'reporting_content_div',
            'id': "reporting_reports"
        });
        /* The result overview div */
        //this.resultSummaryDiv = new Element('div', {
        //    'class': 'reporting_content_div',
        //    'id': "reporting_resultSummary"
        //});
        /* The selection div */
        this.selectionDiv = new Element('div', {
            'class': 'reporting_content_div',
            'id': "reporting_selection"
        });
        /* The result list div */
        this.resultListDiv = new Element('div', {
            'class': 'reporting_content_div',
            'id': "reporting_resList"
        });
        /* The result div */
        this.resultDiv = new Element('div', {
            'class': 'reporting_content_div',
            'id': "reporting_result"
        });
    },

    /**
    * @description function in charge of creating the back button NOW WE DO NOT USE IT
    */
    getBackSpan: function() {

        if (Object.isEmpty(this.backSpan) || Object.isEmpty(this.backSpan.innerHTML)) {
            this.backSpan = new Element('div');

            //if (this.cancelButton == null) {
            var json = {
                elements: []
            };
            var aux = {
                label: global.getLabel('back'),
                handlerContext: null,
                handler: this.goBack.bindAsEventListener(this),
                className: 'Rept_execButton',
                type: 'button',
                idButton: 'cancelButton',
                standardButton: true
            };
            json.elements.push(aux);
            this.cancelButton = new megaButtonDisplayer(json);
            //}
            this.backSpan.insert(this.cancelButton.getButtons());
        }
        return this.backSpan;
    },

    /**
    * @description function in charge of creating the refresh button
    */
    getRelaunchSpan: function() {
        if (Object.isEmpty(this.relaunchSpan) || Object.isEmpty(this.relaunchSpan.innerHTML)) {
            this.relaunchSpan = new Element('div');

            //if (this.cancelButton == null) {
            var json = {
                elements: []
            };
            var aux = {
                label: global.getLabel('relaunch'),
                handlerContext: null,
                handler: this.executeReport.bindAsEventListener(this, true), //true means we are refreshing
                className: 'Rept_execButton',
                type: 'button',
                idButton: 'cancelButton',
                standardButton: true
            };
            json.elements.push(aux);
            this.cancelButton = new megaButtonDisplayer(json);
            //}
            this.relaunchSpan.insert(this.cancelButton.getButtons());
        }
        return this.relaunchSpan;
    },

    getRefreshSpan: function() {
        if (Object.isEmpty(this.refreshSpan) || Object.isEmpty(this.refreshSpan.innerHTML)) {
            this.refreshSpan = new Element('div');

            //if (this.cancelButton == null) {
            var json = {
                elements: []
            };
            var aux = {
                label: global.getLabel('refresh'),
                handlerContext: null,
                handler: this.refreshSpoolList.bindAsEventListener(this), //true means we are refreshing
                className: 'Rept_execButton',
                type: 'button',
                idButton: 'cancelButton',
                standardButton: true
            };
            json.elements.push(aux);
            this.cancelButton = new megaButtonDisplayer(json);
            //}
            this.refreshSpan.insert(this.cancelButton.getButtons());
        }
        return this.refreshSpan;
    },

    /* method created on 24-03*/
    getDeleteSpan: function() {
        if (Object.isEmpty(this.deleteSpan) || Object.isEmpty(this.deleteSpan.innerHTML)) {
            this.deleteSpan = new Element('div', { 'style': 'float:left;' });

            //if (this.cancelButton == null) {
            var json = {
                elements: []
            };
            var aux = {
                label: global.getLabel('delete'),
                handlerContext: null,
                handler: this.deleteFromSpoolList.bindAsEventListener(this), //true means we are refreshing
                className: 'Rept_execButtonLeft',
                type: 'button',
                idButton: 'deleteButton',
                standardButton: true
            };
            json.elements.push(aux);
            var aux = {
                label: global.getLabel('relaunch'),
                handlerContext: null,
                handler: this.relaunchFromSpoolList.bindAsEventListener(this), //true means we are refreshing
                className: 'Rept_execButtonLeft',
                type: 'button',
                idButton: 'relaunchButton',
                standardButton: true
            };
            json.elements.push(aux);
            this.cancelButton = new megaButtonDisplayer(json);
            //}
            this.deleteSpan.insert(this.cancelButton.getButtons());
        }
        return this.deleteSpan;
    },

    buildReports: function(json) {
        this.addToLabels(json);
        var reportsGroups = $A();
        if (!Object.isEmpty(json.EWS.o_reportlist))
            reportsGroups = objectToArray(json.EWS.o_reportlist.yglui_str_rp_o_reportgrplist);

        reportsGroups.each(function(reportsGroup) {
            this.drawReports(this.getDynLabels(reportsGroup["@tag"]),
					reportsGroup["@repgroup_id"],
					this.buildReportsGroup(reportsGroup, reportsGroup["@repgroup_id"]));
        } .bind(this));
    },
    /**
    * @description function in charge of creating the XML doc used for the tree generation.
    * 				Based on the answer of the ajax call the xml doc will be generated.  
    * 				Once the xml doc is created, the function drawReports() will be called to display it in the widget 
    * 				in the correct screen part. 
    * @param {Object} json The answer of the SAP Call
    */
    buildReportsGroup: function(json, group) {
        var reports = objectToArray(json.reports.yglui_str_rp_o_reportlist);
        var xmlTreeStr = '<?xml version="1.0" encoding="utf-8" ?><nodes>';
        /*
        * loop on each report in order to create the
        * corresponding node in the correct format for the tree
        * module
        */
        reports.each(function(report) {
            var variants = $A();
            if (!Object.isEmpty(report.variants))
                variants = objectToArray(report.variants.yglui_str_rp_o_variantlist);

            var reportIDTransf = report['@reportid'];
            reportIDTransf = reportIDTransf.gsub("_", "~");

            xmlTreeStr += '<node ';
            if (variants.length > 0) {
                xmlTreeStr += 'childs="X">';
            } else {
                xmlTreeStr += 'childs="no_child">';
            }
            xmlTreeStr += '<name>' + this.getDynLabels(report['@tag']) + '</name>';
            xmlTreeStr += '<id>' + /*report['@reportid']*/reportIDTransf + '</id>';
            /*
            * Add the report in the list of available
            * reports
            */
            //BEG TKT-1035629
            this.availableReports.push({
                reportId: reportIDTransf,
                reportName: report['@repname'],
                reportDescr: this.getDynLabels(report['@tag']),
                reportParent: null,
                reportGroup: group,
                reportUnavailable: report['@notavailable'],
                reportError: this.getDynLabels(report['@tag_na'])
            });
            //END TKT-1035629
            /* Variant of a report --> same process */
            variants.each(function(vari) {
                // BUG #3872 - BEG
                var variantIDTransf = vari['@varid'];
                if (variantIDTransf.match("_")) {
                    variantIDTransf = vari['@varid'].gsub("_", "~");
                }
                // BUG#3872 - END

                xmlTreeStr += '<node childs="no_child">';
                xmlTreeStr += '<name>' + vari['@varname'] + '</name>';
                xmlTreeStr += '<id>'
						+ reportIDTransf //report['@reportid']
                //	+ '|' + vari['@varid']
					    + '|' + variantIDTransf
						+ '</id>';
                xmlTreeStr += '</node>';

                this.availableReports.push({
                    reportId: variantIDTransf,
                    reportName: vari['@varname'],
                    reportDescr: this.getDynLabels(vari['@tag']),
                    reportParent: reportIDTransf,
                    reportGroup: group,
                    reportUnavailable: vari['@notavailable'],
                    reportError: this.getDynLabels(vari['@tag_na'])
                });
            } .bind(this));
            xmlTreeStr += '</node>';
        } .bind(this));
        xmlTreeStr += '</nodes>';
        /* Transform the string into an XML doc */
        xmlTreeStr = xmlTreeStr.gsub("&", "&amp;");
        return stringToXML(xmlTreeStr);
    },

    /**
    * @description function in charge of creating the unmoveable widget with the tree in it.
    * 				As the tree should have a particular display, the function completeTreeBuilding() is called
    * 			    to change the tree rendering.
    */
    drawReports: function(widgetTitle, widgetId, xml) {
        var id = "reporting_reports_" + widgetId;
        var reportTreeDiv = new Element('div', {
            'class': 'reporting_content_div',
            'id': id
        });
        this.reportsDiv.insert(reportTreeDiv);
        var options_rep = $H({
            title: widgetTitle,
            collapseBut: true,
            showByDefault: true,
            contentHTML: "",
            onLoadCollapse: false,
            targetDiv: id
        });
        new unmWidget(options_rep);
        if (xml.xml != '') {
            this.trees.push(new TreeHandler(
				'unmWidgetContent_' + id, xml));
            this.completeTreeBuilding(id, widgetId);
        }
    },

    /**
    * @description function in charge of changing the tree display in order to match the application requirements.
    * 				This function will browse the tree and add a specific classname in order to change the rendering.
    * 				It will also add a description next to the variants of a report.
    */
    completeTreeBuilding: function(id, widgetId) {
        var node;
        var nodeID;
        var divForId;
        var divForDescr;
        var reportId;
        /*
        * for each available report get it in the tree, add a
        * CSS class to the element corresponding to the report
        * If the element is a child, two elements will be
        * created in order to allow the display of a
        * description
        */
        this.availableReports.each(function(report) {
            if (report.reportGroup != widgetId)
                return;
            if (report.reportParent)
                reportId = report.reportParent + '|'
						+ report.reportId;
            else
                reportId = report.reportId;

            nodeID = 'treeHandler_text_' + reportId
					+ '_unmWidgetContent_' + id;
            node = this.reportsDiv.down('[id=' + nodeID + ']');
            if (report.reportUnavailable == 'X' || report.reportUnavailable == 'x') {
                divForId = new Element("div", {
                    'id': 'treeHandler_id_div_' + reportId + '_unmWidgetContent_' + id + '_treeHandler_text_node_content',
                    'class': 'Rept_treeNodeId'
                });
                divForDescr = new Element("div", {
                    'id': 'treeHandler_id_div_' + reportId + '_unmWidgetContent_' + id + '_treeHandler_text_node_content',
                    'class': 'Rept_errorText'
                });
                divForDescr.insert(report.reportError);
                nodeID = 'treeHandler_text_' + reportId + '_unmWidgetContent_' + id;
                node = this.reportsDiv.down('[id=' + nodeID + ']');
                divForId.insert(node.innerHTML);
                //nodeID = 'treeHandler_text_' + reportId + '_unmWidgetContent_' + id;
                //node = this.reportsDiv.down('[id=' + nodeID + ']').update("");
                //this.reportsDiv.down('[id=' + nodeID + ']').remove();
                //nodeID = reportId + '_unmWidgetContent_' + id;
                //node = this.reportsDiv.down('[id=' + nodeID + ']');
                node.update("");
                node.insert(divForId).insert(divForDescr);
            }
            else {
                node.addClassName('application_action_link');
                //node.observe('mouseover', this.hola.bind(this, node));
            }
            node.removeClassName('treeHandler_pointer');
            nodeID = 'div_' + reportId + '_unmWidgetContent_'
					+ id;
            node = this.reportsDiv
					.down('[id=' + nodeID + ']');
            //node.addClassName('Rept_treeNode');
            if (report.reportParent && (report.reportUnavailable != 'X' && report.reportUnavailable != 'x')) {
                divForId = new Element("div", {
                    'id': 'treeHandler_id_div_' + reportId + '_unmWidgetContent_' + id + '_treeHandler_text_node_content',
                    'class': 'application_action_link Rept_treeNodeId'
                });
                divForDescr = new Element("div", {
                    'id': 'treeHandler_id_div_' + reportId + '_unmWidgetContent_' + id + '_treeHandler_text_node_content_description!',
                    'class': 'Rept_descriptionText'
                });
                divForDescr.insert(report.reportDescr);
                nodeID = 'treeHandler_text_' + reportId + '_unmWidgetContent_' + id;
                node = this.reportsDiv.down('[id=' + nodeID + ']');
                divForId.insert(node.innerHTML);
                //nodeID = 'treeHandler_text_' + reportId + '_unmWidgetContent_' + id;
                node = this.reportsDiv.down('[id=' + nodeID + ']').update("");
                this.reportsDiv.down('[id=' + nodeID + ']').remove();
                nodeID = 'div_' + reportId + '_unmWidgetContent_' + id;
                node = this.reportsDiv.down('[id=' + nodeID + ']');
                node.update("");
                node.insert(divForId);
                node.insert(divForDescr);
                //node.observe('mouseover', this.hola.bind(this, node));
            }
        } .bind(this));
    },
    /*hola: function(node) {
    return;
    if (!Object.isEmpty(this.lastNodeHighlighted)) {
    this.lastNodeHighlighted.down('[id=HighlightedNode]').remove();
    }
    var lino = new Element("div", {
    'id': 'HighlightedNode',
    'class': 'application_legend_text'
    });
    lino.insert("Launch");
    node.insert(lino);
    this.lastNodeHighlighted = node;
    },*/

    /*
    autocompleterGetNewXmlListener:function(event){
    //var eventArgs = getArgs(event);
    },
    */

    autocompleterResultSelectedListener: function(event) {
        var eventArgs = getArgs(event);
        if (eventArgs.isEmpty)
            return;
        var isParent = true;
        var rangeSelected = '';
        var idSplit = eventArgs['idAutocompleter'].split('_');
        var fieldRange = idSplit[1];
        var fieldId = idSplit[0];
        var searchPattern = eventArgs['textAdded'];

        //var pattern = eventArgs['textAdded'];
        var repId = this.selectionScreen.reportId;
        var fieldTectName = '';
        var subfieldId = '';
        var subfieldIdFilled = false;

        if (Object.isUndefined(this.parentGroupRangeSelection.get(fieldId))) {
            var json = {
                low: '',
                high: ''
            };
            this.parentGroupRangeSelection.set(fieldId, json);
        }

        objectToArray(this.dependencies.keys().sort()).each(function(item) {
            //loop thru the hash
            var temphash = this.dependencies.get(item);

            if (fieldId == item) {
                //child
                isParent = false;
                subfieldId = temphash.keys()[0];
                subfieldIdFilled = true;
                fieldTectName = this.selectionScreen.fieldTechNames.get(subfieldId);
            } else {
                //parent
                if (!Object.isUndefined(temphash.get(fieldId))) {
                    //get the name of the child group
                    subfieldId = item;
                    subfieldIdFilled = true;
                    //and the tech name
                    fieldTectName = this.selectionScreen.fieldTechNames.get(item);
                    return;
                }
            }
        }, this);

        //this.selectionScreen.selectionValues.get('PNPPERSG_RangeLow').object.changeLabel('sdasd')
        var idLow = subfieldId + this.selectionScreen.indicators.get('low');
        var idHigh = subfieldId + this.selectionScreen.indicators.get('high');

        if (fieldRange == 'RangeLowValue') {
            this.parentGroupRangeSelection.get(fieldId).low = eventArgs['idAdded'];
            //this.selectionScreen.selectionValues.get(idLow).object.changeLabel(eventArgs['textAdded']);
            rangeSelected = 'low';
        }
        if (fieldRange == 'RangeHighValue') {
            this.parentGroupRangeSelection.get(fieldId).high = eventArgs['idAdded'];
            //this.selectionScreen.selectionValues.get(idHigh).object.changeLabel(eventArgs['textAdded']);
            rangeSelected = 'high';
        }

        if (isParent) {
            if (subfieldIdFilled) {
                this.selectionScreen.selectionValues.get(idLow).object.loading();
                this.selectionScreen.selectionValues.get(idHigh).object.loading();
                this.selectionScreen.selectionValues.get(idLow).object.clearInput();
                this.selectionScreen.selectionValues.get(idHigh).object.clearInput();
                this.callServiceGetValuesByDependency(fieldId, subfieldId, fieldTectName, repId, rangeSelected, searchPattern);
            }
        } else {
            //this.callServiceGetValuesForParent(fieldId, subfieldId, fieldTectName, repId, eventArgs['textAdded'].split(' ')[0],rangeSelected);
            var temp = '';
            var found = false;
            eventArgs['textAdded'].split(' ').each(function(token) {
                if (found) return;
                if (token.startsWith('<') && token.endsWith('>')) {
                    temp = token.gsub('>', '').gsub('<', '');
                    found = true;
                    return;
                }
            });

            this.updateSubGroup(subfieldId, true, rangeSelected, temp);

        }

    },

    /**
    * @description function in charge of retrieving the infos (report ID, variant ID) and instanciate 
    * 				the selection screen object. Once the selection screen is instanciated, the Ajax call is 
    * 				launched to  retrieve the fields fo rthat report and the title of the window is changed to match
    * 				the new screen. 				
    * @param {Object} memo The answer of the event catching
    */
    getReportInfo: function(memo) {
        //if the node clicked is a description node we return
        if (memo.memo._object.nodeName.include('description!')) { return }

        /* Get the ID of the clicked report */
        var selectedNode;
        this.trees.each(function(tree) {
            if (!Object.isEmpty(tree.clickedParent)) {
                selectedNode = tree.clickedParent.split('_')[1];
                tree.clickedParent = "";
                throw $break;
            }
        });
        var info = this.getReportInformations(selectedNode);
        /* The function will now create the ajax request to get the selection screen associated to the report.
        * The reports div and the result summary div will be removed and the selection div will be inserted.
        * The selection screen object will be instanciated and the title changed. In answer to the Ajax call 
        * the buildSelectionScreen function will be in charge of inserting the content of the selection screen.  
        */

        if (info.isAvail == false) { return }

        this.currentScreen = "selectionScreen";

        try {
            this.reportsDiv.remove();
        } catch (e) { }
        //if (!Object.isEmpty(this.resultSummaryDiv)) this.resultSummaryDiv.remove();
        this.selectionDiv.update("");
        this.selectionDiv.show();
        this.mainDiv.insert(this.selectionDiv);
        this.selectionScreen = new SelectionScreen(info.repId, info.varId, false, this.selectionDiv, this);
        this.getReport(info.repId, this.selectionScreen.variantId);
        if (info.isVar) {
            // BUG #3872 - BEG
            var changedTitle = info.varId.gsub("~", "_");
            // BUG #3872 - END
            //this.changeTitle(info.repName, global.getLabel("Variant") +
            //" " +
            //changedTitle + //info.varId +
            //": " +
            //info.varName);
        }
        else
        //this.changeTitle(info.repName);
            this.currentReport = info;
    },
    /**
    * @description function in charge of retrieving the infos (report ID, variant ID) and instanciate 
    * 				the selection screen object. Once the selection screen is instanciated, the Ajax call is 
    * 				launched to  retrieve the fields fo rthat report and the title of the window is changed to match
    * 				the new screen. 				
    * @param {Object} reportId The report identificator to retrive the info associated to that especific report
    */
    getSpoolReportInfo: function() {

        var info = this.getReportInformations(this.lastSpoolReport);
        /* The function will now create the ajax request to get the selection screen associated to the report.
        * The reports div and the result summary div will be removed and the selection div will be inserted.
        * The selection screen object will be instanciated and the title changed. In answer to the Ajax call 
        * the buildSelectionScreen function will be in charge of inserting the content of the selection screen.  
        */

        if (info.isAvail == false) { return }

        this.currentScreen = "selectionScreen";

        try {
            this.reportsDiv.remove();
        } catch (e) { }
        //if (!Object.isEmpty(this.resultSummaryDiv)) this.resultSummaryDiv.remove();
        this.selectionDiv.update("");
        this.selectionDiv.show();
        this.mainDiv.insert(this.selectionDiv);
        this.selectionScreen = new SelectionScreen(info.repId, info.varId, false, this.selectionDiv, this);
        this.getReport(info.repId, this.selectionScreen.variantId);
        if (info.isVar) {
            // BUG #3872 - BEG
            var changedTitle = info.varId.gsub("~", "_");
            // BUG #3872 - END
            //this.changeTitle(info.repName, global.getLabel("Variant") +
            //" " +
            //changedTitle + //info.varId +
            //": " +
            //info.varName);
        }
        else
        //this.changeTitle(info.repName);
            this.currentReport = info;
    },

    getReportInformations: function(repID) {
        var currentRepID;
        var variantID = '';
        var reportID = '';
        var reportTitle = null;
        var variantTitle = null;
        var name = null;
        var title = null;
        var isVariant = false;
        var isAvailable = false;
        this.availableReports.each(function(report) {
            /* if the current report is the one selected 
            * 	retrieve the description and the name of the selected report
            */
            if (report.reportParent)
                currentRepID = report.reportParent + '|' + report.reportId;
            else
                currentRepID = report.reportId;

            if (currentRepID == repID) {
                if (report.reportDescr) {
                    title = report.reportDescr;
                    name = report.reportName;
                } else {
                    title = report.reportName;
                }
                if (report.reportParent) {
                    reportID = report.reportParent;
                    variantID = repID;
                    variantTitle = title;
                    isVariant = true;
                    isAvailable = true;
                    if (report.reportUnavailable == 'X' || report.reportUnavailable == 'x') {
                        isAvailable = false;
                    }
                } else { // no parent
                    reportID = repID;
                    reportTitle = title;
                    isAvailable = true;
                    if (report.reportUnavailable == 'X' || report.reportUnavailable == 'x') {
                        isAvailable = false;
                    }
                }

            }
        });
        /*
        * if the selected report is a variant, retrieve the
        * correct description
        */
        if (isVariant) {
            this.availableReports.each(function(current_report) {
                if (current_report.reportId == reportID) {
                    if (current_report.reportDescr) {
                        reportTitle = current_report.reportDescr;
                    } else {
                        reportTitle = current_report.reportName;
                    }
                }
            });
            variantID = variantID.substr(reportID.length + 1);
        }

        return {
            repId: reportID,
            repName: reportTitle,
            varId: variantID,
            varName: variantTitle,
            isVar: isVariant,
            isAvail: isAvailable
        }
    },

    /**
    * @description function in charge of changing the title of
    *              the window. This function calls the standrad
    *              function to update the text and, if a
    *              subtitle is furnished, adds the subtitle
    *              under the main screen. If the subtitle
    *              parameter is ommitted, the eventual existing
    *              subtitle is remode from the screen.
    * @param {Object} mainTitle The main title for the screen
    * @param {Object} subtitle The subtitle for the window (can
    *        be ommitted)
    */
    changeTitle: function(mainTitle, subtitle) {
        if (subtitle) {
            this.subTitle = new Element(
						"div",
						{
						    'class': 'application_main_text Rept_title_2'
						});
            this.subTitle.insert(subtitle);
            this.resultDiv.insert(this.subTitle);
        }
    },

    /**
    * @description function in charge of building the selection
    *              screen. This function will insert the back
    *              option within the screen and call the
    *              function to build the screen of the
    *              selection screen. Once this is finished, the
    *              content of the selection screen is copied
    *              into the selection div.
    * @param {Object} json The answer of the ajax call
    */
    buildSelectionScreen: function(json) {
        this.addToLabels(json);
        //since 24/03/2010 Add the max time
        this.selectionScreen.buildSelScreen(json, this.getDynLabels.bind(this), new Number(json.EWS.o_maxwait));
        this.selectionDiv = this.selectionScreen.getHtmlContent();
        /*this.selectionDiv.down('[id=execute_report]').insert({
        before: this.getBackSpan()
        })*/
        //lets update the top menu
        this.ButtonDisplayerLeft.enable('WA_ED_reports_list');
        this.ButtonDisplayerLeft.enable('WA_ED_results_list');
        this.ButtonDisplayerRight.setActive('WA_ED_report_name');
        if (this.currentReport.isVar) {
            var changedTitle = this.currentReport.varId.gsub("~", "_");
            changedTitle = global.getLabel("Variant") +
			" " +
			changedTitle + //info.varId +
			": " +
			this.currentReport.varName;
        }
        else
            changedTitle = this.currentReport.repName;

        this.ButtonDisplayerRight.updateLabel('WA_ED_report_name', changedTitle);
        this.ButtonDisplayerRight.enable('WA_ED_result_list');
    },

    /**
    *@description React to the modification of a field that could be a dependence.
    *@param {Event} event Content of the event. 
    */
    updateDependencies: function(event) {
        var args = getArgs(event);

        this.selectionScreen.updateDependencies(args, this.dependencies);
    },
    /**
    * @description	function in charge of launching the report execution.
    * @param {Object} event The click event to execute the report
    * @param {Boolean} refreshing true means we are already execute the report and we want to refresh it    
    */
    executeReport: function(event, refreshing) {
        this.executeButton.disable('execute_report');
        //this.cancelButton.disable('cancelButton');
        this.resultTable = null;
        var date = new Date();
        this.resultExecDate = objectToDisplay(date);
        this.resultExecTime = this.objectTimeToDisplay(date);
        //since 24/03/2010 get the execution options
        var execOptions = this.selectionScreen.getExecOptions();

        //if we are refreshing the report
        if (refreshing) {
            //this.selectionScreen.selectionValues.each(this.selectionScreen.checkScreenItem.bind(this));
            //if (!this.selectionScreen.getIfErrros()) {
            this.execReport(this.selectionScreen.reportId,
					this.selectionScreen.variantId, this.selectionScreen.getListValues(), this.selectionScreen.lastJson, execOptions.subtitle, execOptions.forceBackground);
            //}
        }
        else {
            this.execReport(this.selectionScreen.reportId,
					this.selectionScreen.variantId, getArgs(event).get('values'), this.selectionScreen.lastJson, execOptions.subtitle, execOptions.forceBackground);
        }
    },



    updateSubGroup: function(subfieldId, isParent, rangeSelected, newIndex, JSON) {
        var idLow = subfieldId + this.selectionScreen.indicators.get('low');
        var idHigh = subfieldId + this.selectionScreen.indicators.get('high');

        if (!Object.isUndefined(JSON)) {
            var possibleValues = objectToArray(JSON.EWS.o_values.item);
            var json = {
                autocompleter: {
                    object: $A()
                }
            };
            var new_object = {};

            for (var i = 0; i < possibleValues.length; ++i) {
                new_object.data = possibleValues[i]['@id'];
                if (Object.isEmpty(new_object.data)) new_object.data = '';
                if (!Object.isEmpty(possibleValues[i]['@value']))
                    new_object.text = possibleValues[i]['@value'];
                else
                    new_object.text = possibleValues[i]['@id'];

                json.autocompleter.object.push(new_object);
                new_object = {};
            }

            //ayo change
            if (JSON.EWS.o_max_num_exceeded == 'X') {

                //this.selectionScreen.selectionValues.get(idLow).object.setSearchWithService(true);
                //this.selectionScreen.selectionValues.get(idHigh).object.setSearchWithService(true);
            } else {
                this.selectionScreen.selectionValues.get(idLow).object.setSearchWithService(false);
                this.selectionScreen.selectionValues.get(idHigh).object.setSearchWithService(false);

            }

        }

        if (isParent) {
            switch (rangeSelected) {
                case 'low':
                    //this.selectionScreen.selectionValues.get(idLow).object.stopLoading();		
                    //this.selectionScreen.selectionValues.get(idLow).object.updateInput(json);
                    this.selectionScreen.selectionValues.get(idLow).object.setDefaultValue(newIndex, false, false);
                    break;
                case 'high':
                    //this.selectionScreen.selectionValues.get(idHigh).object.stopLoading();		
                    //this.selectionScreen.selectionValues.get(idHigh).object.updateInput(json);
                    this.selectionScreen.selectionValues.get(idHigh).object.setDefaultValue(newIndex, false, false);
                    break;
            }

        } else {
            this.selectionScreen.selectionValues.get(idLow).object.stopLoading();
            this.selectionScreen.selectionValues.get(idHigh).object.stopLoading();
            if (!Object.isUndefined(JSON)) {
                this.selectionScreen.selectionValues.get(idLow).object.updateInput(json);
                this.selectionScreen.selectionValues.get(idHigh).object.updateInput(json);
            }

        }





    },


    /**
    * @description function in charge of building the spool
    *              overview. This function is launched as
    *              success function of an ajax call and will
    *              display a link to the detailed result
    *              summary and an overview of the number of
    *              running reports within an unmoveable widget.
    * @param {Object} json
    */
    buildSpool: function(json) {
        this.addToLabels(json);
        var nbr = 0;
        var resDiv = new Element('div', {
            'style': 'text-align:left;'
        });
        var linkSpan = new Element('span', {
            'id': 'show_res',
            'class': 'application_action_link'
        }).update(global.getLabel('display_results'));
        resDiv.insert(linkSpan)
        if (!Object.isEmpty(json.EWS.o_nbrs)) {
            var nbrSpools = objectToArray(json.EWS.o_nbrs.yglui_str_rp_o_nbr_spool);
            nbrSpools.each(function(spool) {
                if (spool['@status'] == 'R') {
                    nbr = parseInt(spool['@number']);
                    var processSpan = new Element('span', {
                        'style': 'padding-left:20px;'
                    });
                    if (nbr <= 1)
                        processSpan.insert(nbr + ' ' + global.getLabel('result_in_progress'));
                    else
                        processSpan.insert(nbr + ' ' + global.getLabel('results_in_progress'));
                    resDiv.insert(processSpan);
                }
            });
        }
        var options_spool = $H({
            title: global.getLabel('results'),
            collapseBut: true,
            showByDefault: true,
            contentHTML: resDiv,
            onLoadCollapse: false,
            targetDiv: 'reporting_resultSummary'
        });
        var results = new unmWidget(options_spool);
        this.serviceName = 'GET_RESULT_LST'; //'GET_RESULT_LIST';
        this.successMethodToCall = 'drawResultList';
        linkSpan.observe('click', this.callServiceWithMode.bindAsEventListener(this));
    },

    /**
    * @description function in charge of displaying the spool
    *              table
    * @param {Object} json The answer of the ajax call
    */
    drawResultList: function(json) {
        //removing the actual screen
        try {
            this.progressBarDiv.remove();
        } catch (e) { }
        try {
            this.messageDiv.remove();
        } catch (e) { }
        try {//the use of try catch is not recommended,slows the webpage
            if (this.currentScreen == "main_screen") {
                this.reportsDiv.remove();
                //this.resultSummaryDiv.remove();
            }
            else if (this.currentScreen == "selectionScreen") {
                this.selectionDiv.remove();
                this.selectionDiv.update();
                try {//the use of try catch is not recommended,slows the webpage
                    this.refreshSpan ? this.refreshSpan.remove() : false;
                } catch (e) { }
                //since 24/03/2010 Remove the Relaunch and delete buttons
                try {//the use of try catch is not recommended,slows the webpage
                    this.deleteSpan.remove();
                } catch (e) { }
            }
            else if (this.currentScreen == "spool_list_display") {
                this.resultListDiv.remove();
                try {//the use of try catch is not recommended,slows the webpage
                    this.refreshSpan.remove();
                } catch (e) { }
                //since 24/03/2010 Remove the Relaunch and delete buttons
                try {//the use of try catch is not recommended,slows the webpage
                    this.deleteSpan.remove();
                } catch (e) { }
                this.spoolTable = null;
            }
            else if (this.currentScreen == "xml_result_display" ||
        			this.currentScreen == 'pdf_result_display') {
                this.changePrintButton("");
                this.resultDiv.update();
                this.resultDiv.remove();
                try {//the use of try catch is not recommended,slows the webpage
                    this.refreshSpan.remove();
                } catch (e) { }
                //since 24/03/2010 Remove the Relaunch and delete buttons
                try {//the use of try catch is not recommended,slows the webpage
                    this.deleteSpan.remove();
                } catch (e) { }
                this.selectionDiv.update();
                this.selectionDiv.remove();
                this.resultTitle.remove();
            }
            else if (this.currentScreen == "xml_foreground_result_display") {
                this.changePrintButton("");
                this.resultDiv.update();
                this.selectionDiv.update();
                this.resultDiv.remove();
                this.selectionDiv.remove();
                this.resultTitle.remove();
                //this.backSpan.remove();
                //this.relaunchSpan.remove();
                try {//the use of try catch is not recommended,slows the webpage
                    this.refreshSpan.remove();
                } catch (e) { }
                //since 24/03/2010 Remove the Relaunch and delete buttons
                try {//the use of try catch is not recommended,slows the webpage
                    this.deleteSpan.remove();
                } catch (e) { }
                this.spoolTable = null;
            }
        } catch (e) { }

        this.addToLabels(json);
        window.scrollTo(0, 0);
        this.currentScreen = "spool_list_display";
        //this.changeTitle(global.getLabel("Result List"));
        var results = $A();
        if (!Object.isEmpty(json.EWS.o_result_list)) results = objectToArray(json.EWS.o_result_list.yglui_str_rp_o_resultlist);
        this.buildResultsList(results);
        this.resultListDiv.update();
        this.resultListDiv.insert(this.spoolTable);
        this.mainDiv.insert(this.resultListDiv);
        // Add the sorting on the date format if not exist
        if (Object.isEmpty(TableKit.Sortable.types.dateResults))
            TableKit.Sortable.addSortType(
	    		new TableKit.Sortable.Type('dateResults', {
	    		    pattern: new RegExp(global.dateFormat.gsub(/(\.{1}|\\{1})/, function(match) {
	    		        return '\\' + match[0]
	    		    }).gsub(/[dDmMyY]{1}/, '\\d')),
	    		    normal: function(value) {
	    		        var dateFormat = global.dateFormat.toUpperCase();
	    		        var position = dateFormat.indexOf('YYYY');
	    		        var year = value.substr(position, 4);
	    		        position = dateFormat.indexOf('MM');
	    		        var month = value.substr(position, 2);
	    		        position = dateFormat.indexOf('DD');
	    		        var day = value.substr(position, 2);
	    		        var hour = value.substr(11, 2);
	    		        var minutes = value.substr(14, 2);
	    		        return new Date(year, month, day, hour, minutes, 0, 0).toJSON();
	    		    }
	    		})
	        );
        //lets add the refresh list button
        this.resultListDiv.insert({
            after: this.getRefreshSpan()
        });
        /* modified on 24-03 to insert the delete and relaunch buttons*/
        this.resultListDiv.insert({
            after: this.getDeleteSpan()
        });
        /*this.resultListDiv.insert({
        after: this.getBackSpan()
        });*/
        try {//the use of try catch is not recommended,slows the webpage
            try {
                TableKit.unloadTable('reporting_result_table');
                var tfoot = $('reporting_result_table').down('tfoot');
                if (tfoot)
                    tfoot.remove();
                TableKit.Sortable.tFoot = null;
            } catch (e) { }

            TableKit.Sortable.init('reporting_result_table', { pages: parseInt(global.paginationLimit) });
        } catch (e) { }
        //lets update the top menu buttons
        this.ButtonDisplayerLeft.enable('WA_ED_reports_list');
        this.ButtonDisplayerLeft.setActive('WA_ED_results_list');
        this.ButtonDisplayerRight.disable('WA_ED_report_name');
        this.ButtonDisplayerRight.updateLabel('WA_ED_report_name', '');
        this.ButtonDisplayerRight.disable('WA_ED_result_list');
        this.ButtonDisplayerRight.updateLabel('WA_ED_result_list', '');
        this.currentReport = null;
    },

    /**
    * @description function in charge of building the HTML table designed to recieve the spool list.
    * 				It will use the reports returned by the previous ajax call in order to build the list 
    * @param {Object} results The Array of results recieved by the previous ajax call.
    */
    buildResultsList: function(results) {
        if (results.length == 0) {
            this.spoolTable = new Element("span", {
                "class": "application_text_bolder"
            }).update(global.getLabel('no_result'));
            return;
        }
        var tableHead = new Element("thead");
        var tableHeaderLine = new Element("tr");
        var tableBody = new Element("tbody");
        var tr; var td; var cpt_col; var th; var link; var result_cols; var date; var time;
        for (i = 0; i < 7; i++) {
            th = new Element("th");
            switch (i) {
                case 0:
                    tableHeaderLine.insert(new Element('th', {
                        'style': 'width:16px'
                    }).update('&nbsp;'));
                    break;
                case 1:
                    tableHeaderLine.insert(new Element('th', {
                        'class': 'table_sortfirstdesc table_sortcol Rept_widthId'
                    }).update("<acronym title=" + global.getLabel("title").gsub(' ', '&nbsp;') + ">" + global.getLabel("title") + "</acronym>"));
                    break;
                case 2:
                    tableHeaderLine.insert(new Element('th', {
                        'class': 'table_sortcol Rept_widthId'
                    }).update("<acronym title=" + global.getLabel("subtitle").gsub(' ', '&nbsp;') + ">" + global.getLabel("subtitle") + "</acronym>"));
                    break;
                case 3:
                    tableHeaderLine.insert(new Element('th', {
                        'class': 'table_sortcol dateResults Rept_widthDate'
                    }).update("<acronym title=" + global.getLabel("Date").gsub(' ', '&nbsp;') + ">" + global.getLabel("Date") + "</acronym>"));
                    break;
                case 4:
                    tableHeaderLine.insert(new Element('th', {
                        'class': 'table_sortcol Rept_widthTimeStatus'
                    }).update("<acronym title=" + global.getLabel("Status").gsub(' ', '&nbsp;') + ">" + global.getLabel("Status") + "</acronym>"));
                    break;
                case 5:
                    tableHeaderLine.insert(new Element('th', {
                        'class': 'table_sortcol Rept_widthDelete'
                    }).update("<acronym title=" + global.getLabel("SPOOL_ID").gsub(' ', '&nbsp;') + ">" + global.getLabel("SPOOL_ID") + "</acronym>"));
                    break;
                case 6:
                    tableHeaderLine.insert(new Element('th', {
                        'style': 'display:none'
                    }).update("<acronym title=" + global.getLabel("outtype").gsub(' ', '&nbsp;') + ">" + global.getLabel("outtype") + "</acronym>"));
                    break;
            }
        }
        tableHead.insert(tableHeaderLine);
        this.spoolTable = new Element("table", {
            "style": "width:100%;",
            "id": "reporting_result_table",
            "class": "sortable"
        });

        this.spoolTable.insert(tableHead);
        results.each(function(result) {
            tr = new Element("tr");
            for (i = 0; i < 7; i++) {
                switch (i) {
                    // DELETE BUTTON                                                                                                                             
                    case 0:
                        var deleteDiv = new Element('input', {
                            'type': 'checkbox',
                            'id': 'chk_' + result['@result_id']
                        });
                        if (result['@status'] == 'R') {
                            deleteDiv.disabled = true;
                        }
                        tr.insert(new Element('td').insert(deleteDiv));
                        break;
                    // REPORT TITLE	                                                                                                                             
                    case 1:
                        var link = new Element('span').update(result['@title']);
                        if (true) {//if (!Object.isEmpty(result['@result_id']) && result['@status'] !== '1' && result['@result_id'] !== 'NORESULT') {
                            link.writeAttribute('id', 'show_result_' + result['@result_id']);
                            link.addClassName('application_action_link');

                            link.observe('click', function() {
                                document.fire('EWS:Reporting_result_display_from_spool', $H({
                                    reportId: result['@result_id'],
                                    res: result,
                                    format: result['@defformat'],
                                    title: result['@title'],
                                    status: result['@status'],
                                    repId: result['@reportid']
                                }));
                            });
                        }
                        tr.insert(new Element("td").insert(link));
                        break;

                    case 2:
                        tr.insert(new Element("td").insert(result['@subtitle']));
                        break;
                    // DATE                                        
                    case 3:
                        date = sapToDisplayFormat(result['@datum']);
                        time = this.sapTimeToDisplay(result['@uzeit']);
                        tr.insert(new Element('td').update(date + ' ' + time));
                        break;
                    // TIME                                                                                                                                 
                    case 4:
                        if (result['@status'] == 'A')
                            tr.insert(new Element('td').insert(new Element('span', { 'class': 'application_main_error_text' }).update(this.dynLabels.get('Reporting_status_A'))));
                        else
                            tr.insert(new Element('td').update(this.dynLabels.get('Reporting_status_' + result['@status'])));
                        break;
                    // SPOOL ID                                                                                                                                 
                    case 5:
                        var spoolId = '&nbsp;';
                        if (!Object.isEmpty(result['@result_id']))
                            spoolId = result['@result_id'];

                        tr.insert(new Element("td").update(spoolId));
                        break;
                    // FORMAT - HIDDEN                                                                                                                                 
                    case 6:
                        tr.insert(new Element('td', { 'style': 'display:none' }).update(result['@defformat']));
                        break;
                }
            }
            tableBody.insert(tr);
        } .bind(this));
        this.spoolTable.insert(tableBody);
    },
    /**
    * @description function in charge of displaying the result
    *              coming from spool. This function will do the
    *              ajax call to launch the result drawing.
    * @param {Object} event The click on a spool Id event
    */
    displayResultFromSpool: function(event) {
        //lets remove the refresh button       
        if (!Object.isEmpty(this.refreshSpan))
            this.refreshSpan.remove();

        //since 24/03/2010 Remove the Relaunch and delete buttons
        if (!Object.isEmpty(this.deleteSpan))
            this.deleteSpan.remove();

        var resline = getArgs(event).get("res");
        var reportID = getArgs(event).get("reportId");
        this.resultExecDate = sapToDisplayFormat(resline["@datum"]);
        this.resultExecTime = this.sapTimeToDisplay(resline["@uzeit"]);
        this.fromSpool = true;
        this.lastSpoolReport = reportID;
        this.lastSpoolReportName = getArgs(event).get("title");
        this.reportType = getArgs(event).get("format");
        this.reportId = getArgs(event).get("repId");
        var reportStatus = getArgs(event).get("status");

        if (reportStatus == 'F') {
            this.resultListDiv.remove();
            this.resultDiv.update();
            this.mainDiv.insert(this.resultDiv);

            this.resultTable = null;

            if (this.reportType == 'XML') {
                this.callServiceContActionsParams(this.reportId, reportID);
            }
            else {
                this.getNonXmlResult(reportID, this.reportType, true);
                this.currentResult = reportID;
            }
        } else if (reportStatus == 'A' || reportStatus == 'E') {
            // ERROR HANDLING
            this.buildErrorScreenContent(reportID);
        } else if (reportStatus == 'R') {
            this.resultListDiv.remove();
            this.resultDiv.update();
            this.mainDiv.insert(this.resultDiv);
            this.getRunningResult(reportID, this.reportType);
            this.currentResult = reportID;
        } else if (reportStatus == 'S') {
            this.resultListDiv.remove();
            this.resultDiv.update();
            this.mainDiv.insert(this.resultDiv);
            this.getScheduleResult(reportID, this.reportType);
            this.currentResult = reportID;
        } else if (reportStatus == 'D') {
            this.resultListDiv.remove();
            this.resultDiv.update();
            this.mainDiv.insert(this.resultDiv);
            this.getDeletedResult(reportID, this.reportType);
            this.currentResult = reportID;
        }
    },
    buildErrorScreenContent: function(reportID) {
        //this.serviceName = 'GET_RESULT_LOG';
        //this.successMethodToCall = 'createErrorScreenContent';
        //this.callServiceWithResultId(reportID);
        //lets update the top menu buttons
        this.ButtonDisplayerLeft.enable('WA_ED_reports_list');
        this.ButtonDisplayerLeft.enable('WA_ED_results_list');
        this.ButtonDisplayerRight.enable('WA_ED_report_name');
        var changedTitle = '';
        if (Object.isEmpty(this.currentReport)) {
            changedTitle = this.lastSpoolReportName;
        }
        else {
            if (this.currentReport.isVar) {
                changedTitle = this.currentReport.varId.gsub("~", "_");
                changedTitle = global.getLabel("Variant") +
			    " " +
			    changedTitle + //info.varId +
			    ": " +
			    this.currentReport.varName;
            }
            else
                changedTitle = this.currentReport.repName;
        }
        this.ButtonDisplayerRight.updateLabel('WA_ED_report_name', changedTitle);
        //disable this menu if there is no result to show
        this.ButtonDisplayerRight.setActive('WA_ED_report_name');
        this.ButtonDisplayerRight.setActive('WA_ED_result_list');
        this.ButtonDisplayerRight.updateLabel('WA_ED_result_list', global.getLabel('results'));
        this.selectionDiv.hide();

        switch (this.currentScreen) {
            case 'spool_list_display':
                this.currentScreen = 'pdf_result_display';
                break;
            case "selectionScreen":
                this.currentScreen = 'pdf_foreground_result_display';
                break;
        }

        this.resultDiv.update();
        if (!this.resultDiv.visible()) this.resultDiv.show();
        //abort when there is no result to show
        this.resultDiv.insert(new Element('span').update(global.getLabel("report_fails")));
        return;
    },

    createErrorScreenContent: function(json) {

        this.buildHtmlErrorPopupContent(json);

        var buttonsC = $H({
            'textContent': $H({ 'button0': 'Close',
                'button1': 'fakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefake'
            }),
            'callBacks': $H({ 'button0': function() {
                ErrorDisplayPopup.close();
                delete ErrorDisplayPopup;
            }
            })
        });
        //ConfirmationBox DEPRECATED: Use infoPopup
        var ErrorDisplayPopup = new ConfirmationBox();
        ErrorDisplayPopup.setContent(this.htmlErrorPopupContent);
        ErrorDisplayPopup.setButtons(buttonsC);

        ErrorDisplayPopup.create();

        $("idModuleConfirmationBox_innerPart").down('[class=moduleConfirmationBox_indicatorIconPart]').remove();
        $("idModuleConfirmationBoxInputButton_Nr1").remove();

    },

    buildHtmlErrorPopupContent: function(json) {
        var jobcount; var jobname; var logTable;
        if (json.EWS.o_jobcount) {
            jobcount = json.EWS.o_jobcount;
            jobname = json.EWS.o_jobname;
            logTable = objectToArray(json.EWS.o_log.yglui_str_rp_o_log_data);

            this.htmlErrorPopupContent = "";

            var fakeDiv = new Element('div');


            var innerDiv = new Element('div', { 'style': 'width:100%' });
            fakeDiv.insert(innerDiv);

            var titleString = global.getLabel("Job") + " " + jobname + " (" + jobcount + ") - " + global.getLabel("Error Log");

            var title = new Element('span', { 'class': 'application_main_title2 Rept_title_2' }).update(titleString);

            innerDiv.insert(title);

            var table = new Element('table', { 'width': '100%', 'class': 'sortable' });
            var tr = new Element('tr');

            var tableHeaderLine = new Element("tr");
            var tableBody = new Element("tbody");
            for (i = 0; i < 6; i++) {
                switch (i) {
                    case 0:
                        tableHeaderLine.insert(new Element('th', {
                            'class': 'table_sortcol'
                        }).update(global.getLabel("Time")));
                        break;
                    case 1:
                        tableHeaderLine.insert(new Element('th', {
                            'class': 'table_sortcol'
                        }).update(global.getLabel("Date")));
                        break;
                    case 2:
                        tableHeaderLine.insert(new Element('th', {
                            'class': 'table_sortcol'
                        }).update(global.getLabel("Msg Cl")));
                        break;
                    case 3:
                        tableHeaderLine.insert(new Element('th', {
                            'class': 'table_sortcol'
                        }).update(global.getLabel("Msg Nb")));
                        break;
                    case 4:
                        tableHeaderLine.insert(new Element('th', {
                            'class': 'table_sortcol'
                        }).update(global.getLabel("Msg Tp")));
                        break;
                    case 5:
                        tableHeaderLine.insert(new Element('th', {
                            'class': 'table_sortcol'
                        }).update(global.getLabel("Message Text")));
                        break;
                }
            }
            tableBody.insert(tableHeaderLine);
            logTable.each(function(logLine) {
                tr = new Element("tr");
                for (i = 0; i < 6; i++) {
                    switch (i) {
                        case 0: tr.insert(new Element("td").update(logLine['@entertime']));
                            break;
                        case 1: tr.insert(new Element("td").update(logLine['@enterdate']));
                            break;
                        case 2: tr.insert(new Element("td").update(logLine['@msgid']));
                            break;
                        case 3: tr.insert(new Element("td").update(logLine['@msgno']));
                            break;
                        case 4: tr.insert(new Element("td").update(logLine['@msgtype']));
                            break;
                        case 5: tr.insert(new Element("td").insert(new Element('span', {
                            'class': 'application_color_eeColor07',
                            'style': 'text-align:left;'
                        }).update(logLine['#text'])));
                            break;
                    }
                }
                tableBody.insert(tr);
            } .bind(this));
            table.insert(tableBody);
            innerDiv.insert(new Element('div', { 'style': 'clear: both; padding-top: 10px; width: 100%;' }).insert(table));
            this.htmlErrorPopupContent = fakeDiv.innerHTML;
        } else return;

    },
    /**
    * @description Display directly the result of a foreground report execution.
    * @param {Object} json The result of the exec_report service
    */
    displayResult: function(json) {
        //Remove the progress bar if needed
        if (!Object.isEmpty(json))
            if (!json.EWS.o_message == "BACKG")
                try {
                    this.progressBarDiv.remove();
                } catch (e) { }
            else
                if (json.EWS.o_message == "BACKG")
                    this.showNoTimeMessage();
        if (Object.isEmpty(json)) {

            this.selectionDiv.hide();

            try {//the use of try catch is not recommended,slows the webpage
                this.refreshSpan ? this.refreshSpan.remove() : false;
            } catch (e) { }
            //since 24/03/2010 Remove the Relaunch and delete buttons
            try {//the use of try catch is not recommended,slows the webpage
                this.deleteSpan.remove();
            } catch (e) { }
            this.currentScreen = "xml_foreground_result_display";

            if (!Object.isEmpty(this.resultDiv))
                this.resultDiv.show();
            if (!Object.isEmpty(this.resultTitle))
                this.resultTitle.show();
            this.ButtonDisplayerLeft.enable('WA_ED_reports_list');
            this.ButtonDisplayerLeft.enable('WA_ED_results_list');
            this.ButtonDisplayerRight.enable('WA_ED_report_name');
            this.ButtonDisplayerRight.setActive('WA_ED_result_list');
            return;
        }
        if (this.executeButton)
            this.executeButton.enable('execute_report');
        //since 24/03/2010 The cancel button could exist without the cancel button inside
        try {//the use of try catch is not recommended,slows the webpage
            this.cancelButton.enable('cancelButton');
        } catch (e) { }

        this.reportId = null;

        if (json.EWS.o_resultid == 'NORESULT') {
            this.goReportsList(null);
            return;
        }

        if (json.EWS.o_resultid) {
            this.mainDiv.insert(this.resultDiv);
            if (json.EWS.o_resultformat == 'XML') {
                this.currentResult = json.EWS.o_resultid;
                this.reportId = this.selectionScreen.reportId;
                this.callServiceContActionsParams(this.reportId, json.EWS.o_resultid);
            } else
                this.getNonXmlResult(json.EWS.o_resultid, json.EWS.o_resultformat, false);

            this.resultToDel = json.EWS.o_resultid;
        }
    },

    getNonXmlResult: function(spoolId, resType, fromSpool) {
        //lets update the top menu buttons
        this.ButtonDisplayerLeft.enable('WA_ED_reports_list');
        this.ButtonDisplayerLeft.enable('WA_ED_results_list');
        this.ButtonDisplayerRight.enable('WA_ED_report_name');
        var changedTitle = '';
        if (Object.isEmpty(this.currentReport)) {
            changedTitle = this.lastSpoolReportName;
        }
        else {
            if (this.currentReport.isVar) {
                changedTitle = this.currentReport.varId.gsub("~", "_");
                changedTitle = global.getLabel("Variant") +
			" " +
			changedTitle + //info.varId +
			": " +
			this.currentReport.varName;
            }
            else
                changedTitle = this.currentReport.repName;
        }

        this.ButtonDisplayerRight.updateLabel('WA_ED_report_name', changedTitle);
        //disable this menu if there is no result to show
        if (spoolId == "0000000000") this.ButtonDisplayerRight.setActive('WA_ED_report_name');
        this.ButtonDisplayerRight.setActive('WA_ED_result_list');
        this.ButtonDisplayerRight.updateLabel('WA_ED_result_list', global.getLabel('results'));
        this.selectionDiv.hide();

        switch (this.currentScreen) {
            case 'spool_list_display':
                this.currentScreen = 'pdf_result_display';
                break;
            case "selectionScreen":
                this.currentScreen = 'pdf_foreground_result_display';
                break;
        }

        this.resultDiv.update();
        if (!this.resultDiv.visible()) this.resultDiv.show();
        //abort when there is no result to show
        if (spoolId == "0000000000") {
            this.resultDiv.insert(new Element('span').update(global.getLabel('result_deleted')));
            return;
        }
        this.selectionDiv.update();
        var subTitle = "";
        if (this.fromSpool == true) {
            this.fromSpool = false;
            this.serviceName = 'GET_RESULT_SS';
            this.successMethodToCall = 'drawNewSelScreen';
            this.callServiceWithSpoolId(this.lastSpoolReport);
            subTitle = global.getLabel("executed_on") + " " +
			this.resultExecDate + " " + global.getLabel("at") + " " + this.resultExecTime;
            this.changeTitle("", subTitle);
        } else {
            this.drawSelScreen(this.selectionScreen);
            if (Object.isEmpty(this.currentReport.varName)) {
                //this.changeTitle(this.currentReport.repName, subTitle);
            } else {
                //this.changeTitle(this.currentReport.varName, subTitle);
            }
        }
        var servXml = '<EWS>'
					+ '<SERVICE>GET_RESULT</SERVICE>'
					+ '<DEL/>'
					+ '<PARAM>'
					+ '<I_RESULT_ID>' + spoolId + '</I_RESULT_ID>'
					+ '<I_OUTPUT>' + resType + '</I_OUTPUT>'
					+ '</PARAM>'
					+ '</EWS>';

        var pdfFile;
        if (resType === 'JPG')
            pdfFile = '<img id="Rept_iframePDF"/>';
        else
            pdfFile = "<iframe id='Rept_iframePDF' width='700' height='500' frameborder='1'></iframe>";
        //since 24/03/2010 There is no title in the screens
        this.resultTitle = this.buildResultTitle();
        this.resultDiv.insert({ before: this.resultTitle });
        this.resultDiv.insert(pdfFile);

        var url = this.url;
        while (('url' in url.toQueryParams())) { url = url.toQueryParams().url; }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';

        if (!fromSpool)
            this.resultDiv.down().src = url + servXml;
        else
            this.resultDiv.down().next().src = url + servXml;

        this.serviceName = 'GET_REPORT_EXP';
        this.successMethodToCall = 'addReportExportOpt'
        this.callServiceWithReportId((this.reportId || this.selectionScreen.reportId));

        if (!Object.isEmpty(this.resultToDel)) {
            this.serviceName = 'DEL_RESULT';
            this.successMethodToCall = 'reportDeleted';
            this.callServiceWithResultId(this.resultToDel);
            this.resultToDel = '';
        }
        //Framework_stb.hideSemitransparent();
        try {//the use of try catch is not recommended,slows the webpage
            this.executeButton.enable('execute_report');
        } catch (e) { }
        //since 24/03/2010 The cancel button could exist without the cancel button inside
        try {//the use of try catch is not recommended,slows the webpage
            this.cancelButton.enable('cancelButton');
        } catch (e) { }
    },

    getDeletedResult: function(spoolId, resType) {
        //lets update the top menu buttons
        this.ButtonDisplayerLeft.enable('WA_ED_reports_list');
        this.ButtonDisplayerLeft.enable('WA_ED_results_list');
        this.ButtonDisplayerRight.enable('WA_ED_report_name');
        var changedTitle = '';
        if (Object.isEmpty(this.currentReport)) {
            changedTitle = this.lastSpoolReportName;
        }
        else {
            if (this.currentReport.isVar) {
                changedTitle = this.currentReport.varId.gsub("~", "_");
                changedTitle = global.getLabel("Variant") +
			" " +
			changedTitle + //info.varId +
			": " +
			this.currentReport.varName;
            }
            else
                changedTitle = this.currentReport.repName;
        }
        this.ButtonDisplayerRight.updateLabel('WA_ED_report_name', changedTitle);
        //disable this menu if there is no result to show
        //this.ButtonDisplayerRight.setActive('WA_ED_report_name');
        this.ButtonDisplayerRight.setActive('WA_ED_result_list');
        this.ButtonDisplayerRight.updateLabel('WA_ED_result_list', global.getLabel('results'));
        this.selectionDiv.hide();

        switch (this.currentScreen) {
            case 'spool_list_display':
                this.currentScreen = 'pdf_result_display';
                break;
            case "selectionScreen":
                this.currentScreen = 'pdf_foreground_result_display';
                break;
        }

        this.resultDiv.update();
        if (!this.resultDiv.visible()) this.resultDiv.show();
        //abort when there is no result to show
        this.resultDiv.insert(new Element('span').update(global.getLabel('report_deleted')));

        this.selectionDiv.update();
        var subTitle = "";
        if (this.fromSpool == true) {
            this.fromSpool = false;
            this.serviceName = 'GET_RESULT_SS';
            this.successMethodToCall = 'drawNewSelScreen';
            this.callServiceWithSpoolId(this.lastSpoolReport);
            subTitle = global.getLabel("executed_on") + " " +
			this.resultExecDate + " " + global.getLabel("at") + " " + this.resultExecTime;
            this.changeTitle("", subTitle);
        } else {
            this.drawSelScreen(this.selectionScreen);
            if (Object.isEmpty(this.currentReport.varName)) {
                //this.changeTitle(this.currentReport.repName, subTitle);
            } else {
                //this.changeTitle(this.currentReport.varName, subTitle);
            }
        }
        return;
    },

    getRunningResult: function(spoolId, resType) {
        //lets update the top menu buttons
        this.ButtonDisplayerLeft.enable('WA_ED_reports_list');
        this.ButtonDisplayerLeft.enable('WA_ED_results_list');
        this.ButtonDisplayerRight.enable('WA_ED_report_name');
        var changedTitle = '';
        if (Object.isEmpty(this.currentReport)) {
            changedTitle = this.lastSpoolReportName;
        }
        else {
            if (this.currentReport.isVar) {
                changedTitle = this.currentReport.varId.gsub("~", "_");
                changedTitle = global.getLabel("Variant") +
			" " +
			changedTitle + //info.varId +
			": " +
			this.currentReport.varName;
            }
            else
                changedTitle = this.currentReport.repName;
        }
        this.ButtonDisplayerRight.updateLabel('WA_ED_report_name', changedTitle);
        //disable this menu if there is no result to show
        this.ButtonDisplayerRight.setActive('WA_ED_report_name');
        this.ButtonDisplayerRight.setActive('WA_ED_result_list');
        this.ButtonDisplayerRight.updateLabel('WA_ED_result_list', global.getLabel('results'));
        this.selectionDiv.hide();

        switch (this.currentScreen) {
            case 'spool_list_display':
                this.currentScreen = 'pdf_result_display';
                break;
            case "selectionScreen":
                this.currentScreen = 'pdf_foreground_result_display';
                break;
        }

        this.resultDiv.update();
        if (!this.resultDiv.visible()) this.resultDiv.show();
        //abort when there is no result to show
        this.resultDiv.insert(new Element('span').update(global.getLabel("report_running")));
        return;
    },

    getScheduleResult: function(spoolId, resType) {
        //lets update the top menu buttons
        this.ButtonDisplayerLeft.enable('WA_ED_reports_list');
        this.ButtonDisplayerLeft.enable('WA_ED_results_list');
        this.ButtonDisplayerRight.enable('WA_ED_report_name');
        var changedTitle = '';
        if (Object.isEmpty(this.currentReport)) {
            changedTitle = this.lastSpoolReportName;
        }
        else {
            if (this.currentReport.isVar) {
                changedTitle = this.currentReport.varId.gsub("~", "_");
                changedTitle = global.getLabel("Variant") +
			" " +
			changedTitle + //info.varId +
			": " +
			this.currentReport.varName;
            }
            else
                changedTitle = this.currentReport.repName;
        }
        this.ButtonDisplayerRight.updateLabel('WA_ED_report_name', changedTitle);
        //disable this menu if there is no result to show
        this.ButtonDisplayerRight.setActive('WA_ED_report_name');
        this.ButtonDisplayerRight.setActive('WA_ED_result_list');
        this.ButtonDisplayerRight.updateLabel('WA_ED_result_list', global.getLabel('results'));
        this.selectionDiv.hide();

        switch (this.currentScreen) {
            case 'spool_list_display':
                this.currentScreen = 'pdf_result_display';
                break;
            case "selectionScreen":
                this.currentScreen = 'pdf_foreground_result_display';
                break;
        }

        this.resultDiv.update();
        if (!this.resultDiv.visible()) this.resultDiv.show();
        //abort when there is no result to show
        this.resultDiv.insert(new Element('span').update(global.getLabel("report_scheduled")));
        return;
    },
    /**
    * @description function in charge of drawing the result based on the ajax response.
    * 				This function will call either drawXmlResult or drawPdfResult depending of the result type
    * @param {Object} json The response of the ajax call
    */
    drawResult: function(json) {
        //lets update the top menu buttons
        this.ButtonDisplayerLeft.enable('WA_ED_reports_list');
        this.ButtonDisplayerLeft.enable('WA_ED_results_list');
        this.ButtonDisplayerRight.enable('WA_ED_report_name');

        if (Object.isEmpty(this.currentReport)) {
            var changedTitle = this.lastSpoolReportName;
        }
        else {
            if (this.currentReport && this.currentReport.isVar) {
                changedTitle = this.currentReport.varId.gsub("~", "_");
                changedTitle = global.getLabel("Variant") +
			" " +
			changedTitle + //info.varId +
			": " +
			this.currentReport.varName;
            }
            else
                changedTitle = this.currentReport.repName;
        }
        this.ButtonDisplayerRight.updateLabel('WA_ED_report_name', changedTitle);
        this.ButtonDisplayerRight.setActive('WA_ED_result_list');
        this.ButtonDisplayerRight.updateLabel('WA_ED_result_list', global.getLabel('results'));

        refreshing = true;
        if (this.executeButton)
            this.executeButton.enable('execute_report');

        //since 24/03/2010 The cancel button could exist without the cancel button inside
        try {//the use of try catch is not recommended,slows the webpage
            this.cancelButton.enable('cancelButton');
        } catch (e) { }

        switch (this.currentScreen) {
            case 'spool_list_display':
                this.currentScreen = 'xml_result_display';
                refreshing = false;
                break;
            case "selectionScreen":
                this.currentScreen = 'xml_foreground_result_display';
                refreshing = false;
                break;
        }

        if (!refreshing)
            this.changePrintButton("to_res");

        if (!refreshing) {
            try {
                this.progressBarDiv.remove();
            } catch (e) { }
            this.resultDiv.update();
            this.resultDiv.show();
            this.selectionDiv.hide();
            var subTitle = "";
            if (this.fromSpool == true) {
                this.fromSpool = false;
                this.serviceName = 'GET_RESULT_SS';
                this.successMethodToCall = 'drawNewSelScreen';
                this.callServiceWithSpoolId(this.lastSpoolReport);
                subTitle = global.getLabel("executed_on") + " " +
			this.resultExecDate + " " + global.getLabel("at") + " " + this.resultExecTime;
                this.changeTitle("", subTitle);
            } else {
                this.currentReport = this.getReportInformations(this.selectionScreen.reportId);
                //this.drawSelScreen(this.selectionScreen);             
                if (Object.isEmpty(this.currentReport.varName)) {
                    //this.changeTitle(this.currentReport.repName, subTitle);
                } else {
                    //this.changeTitle(this.currentReport.varName, subTitle);
                }
            }
            //since 24/03/2010 There is no title in the screens
            this.resultTitle = this.buildResultTitle();
            this.drawXmlResult(json);
            this.resultDiv.insert({ before: this.resultTitle });
            this.resultDiv.insert(this.resultTable);
        }
        for (var index = 0; index < this.resultsTableNbr.length; ++index) {
            var item = this.resultsTableNbr[index];
            try {//the use of try catch is not recommended,slows the webpage
                TableKit.unloadTable("reporting_result_display_table_" + item);
                var tfoot = $("reporting_result_display_table_" + item).down('tfoot');
                if (tfoot)
                    tfoot.remove();
                TableKit.Sortable.tFoot = null;
            } catch (e) { }
            TableKit.Sortable.init("reporting_result_display_table_" + item, { pages: parseInt(global.paginationLimit) });
        }
        if (!refreshing && this.resultsTableNbr.length > 0) {
            this.serviceName = 'GET_REPORT_EXP';
            this.successMethodToCall = 'addReportExportOpt'
            this.callServiceWithReportId((this.reportId || this.selectionScreen.reportId));

            if (!Object.isEmpty(this.resultToDel)) {
                this.serviceName = 'DEL_RESULT';
                this.successMethodToCall = 'reportDeleted';
                this.callServiceWithResultId(this.resultToDel);
                this.resultToDel = '';
            }
        }
    },

    addReportExportOpt: function(json) {
        if (this.currentScreen == 'xml_result_display') {
            var repId = this.lastSpoolReport;
        }
        else {
            if (!Object.isEmpty(this.currentReport)) repId = this.currentReport.repId;
            else repId = this.lastSpoolReport;
        }

        if (json.EWS.o_exp_pdf == 'X') {
            this.resultTitle.insert('<div id="rept_exportPDF" class="Rept_exportPDF Rept_exportOpt" title="' + global.getLabel('export_results_to_pdf') + '"></div>');
            this.resultTitle.down('[id="rept_exportPDF"]').observe('click', function() { this.exportResultsTo('PDF', repId); } .bind(this));
        }
        if (json.EWS.o_exp_xls == 'X') {
            this.resultTitle.insert('<div id="rept_exportXLS" class="Rept_exportExcel Rept_exportOpt title="' + global.getLabel('export_results_to_excel') + '"></div>');
            this.resultTitle.down('[id="rept_exportXLS"]').observe('click', function() { this.exportResultsTo('XLS', repId) } .bind(this));
        }
    },

    exportResultsTo: function(exportType, reportId) {
        if (this.currentScreen == 'xml_result_display') {
            var currentResult = this.lastSpoolReport;
        }
        else {
            currentResult = this.currentResult;
        }
        var servXml = '<EWS>'
					+ '<SERVICE>GET_RESULT</SERVICE>'
					+ '<DEL/>'
					+ '<PARAM>'
					+ '<I_RESULT_ID>' + currentResult + '</I_RESULT_ID>'
					+ '<I_OUTPUT>' + exportType + '</I_OUTPUT>'
					+ '</PARAM>'
					+ '</EWS>';
        var url = this.url;
        while (('url' in url.toQueryParams())) { url = url.toQueryParams().url; }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
        url += servXml;
        window.open(url);
    },

    /**
    * @description Function that create a new selection screen from the result of the service
    * 				get_result_ss.
    * @param {Object} json The response of the ajax call
    */
    drawNewSelScreen: function(json) {
        this.addToLabels(json);
        this.mainDiv.insert({ top: this.selectionDiv });
        this.selectionScreen = new SelectionScreen(json.EWS.o_reportid, json.EWS.o_variantid, false, this.selectionDiv, this);
        //since 24/03/2010 Add the max time
        this.selectionScreen.buildSelScreen(json, this.getDynLabels.bind(this), new Number(json.EWS.o_maxwait), true);
        this.selectionDiv = this.selectionScreen.getHtmlContent();
        //since 24/03/2010 There is no title in the screens
        this.selectionDiv.insert({ top: this.buildResultTitle() });

    },

    /**
    * @description Do the same as the function drawNewSelScreen but from the existant
    * 				selection screen.
    * @param {Object} selScreen The existant selection screen with a previous display
    */
    drawSelScreen: function(selScreen) {
        this.addToLabels(selScreen.lastJson);
        this.currentReport = this.getReportInformations(selScreen.reportId);
        this.selectionScreen = new SelectionScreen(this.currentReport.repId, this.currentReport.varId, false, this.selectionDiv, this);
        //since 24/03/2010 Add the max time
        this.selectionScreen.buildSelScreen(selScreen.getLastJsonWithValues(), this.getDynLabels.bind(this), selScreen.getLastMaxTime());
        this.selectionDiv = this.selectionScreen.getHtmlContent();
        //since 24/03/2010 There is no title in the screens
        this.selectionDiv.insert({ top: this.buildResultTitle() });

    },

    /**
    * @description function in charge of drawing the results that has to be displayed in HTML
    * @param {Array} result The array containing the result of a report 
    */
    drawXmlResult: function(result) {
        var contentId;
        var tables = $A();
        if (result.EWS.table && result.EWS.table.data) {
            tables = objectToArray(result.EWS.table);
            this.resultsTableNbr = $A();
            tables.each(function(table) {
                this.resultDiv.insert(new Element('div', { 'id': 'divScroll_' + table["@ID"], 'style': 'overflow-x: auto; width:100%; padding-top:10px;' }).insert(this.drawXmlResultTable(table)));
                this.resultDiv.insert(new Element('span', { 'style': 'height:10px;' }).insert("&nbsp;"));
            } .bind(this));
        }
        else
            this.resultDiv.insert(new Element('span').update(global.getLabel('no_result')));
    },

    drawXmlResultTable: function(table) {
        this.resultsTableNbr.push(table["@ID"]);
        var tableHead = new Element("thead");
        var tableHeaderLine = new Element("tr");
        var tableBody = new Element("tbody");
        var tr; var td; var cpt_col; var th; var link;
        var resultTable;
        var cols = objectToArray(table.header.columns.column);
        cpt_col = 0;
        cols.each(function(col) {
            th = new Element("th");
            th.insert(col["#text"]);
            if (cpt_col == 0) {
                th.addClassName("table_sortfirstasc table_sortcol table_sortColAsc");
            } else {
                th.addClassName("table_sortcol");
            }
            tableHeaderLine.insert(th);
            cpt_col++;
        });
        tableHead.insert(tableHeaderLine);
        resultTable = new Element("table", {
            'style': 'width:100%;',
            'id': 'reporting_result_display_table_' + table["@ID"],
            'class': 'sortable'
        });
        resultTable.insert(tableHead);
        var values = table.data;
        var entries = objectToArray(table.data.entry);
        //for (var it = entries.length - 1; it >= 0; it--) {
        entries.each(function(value) {
            tr = new Element("tr");
            var column = objectToArray(value.column);
            column.each(function(val, index) {
                var td = new Element("td").update(val["#text"]);
                //we are going to add contextual actions to the columns need it
                var actionParams = this.contAction.get(index);
                if (!Object.isEmpty(actionParams)) {
                    td.addClassName('Rept_hasContActions');
                    td.observe('click', function(event) {
                        var otype = actionParams.otype;
                        if (Object.isNumber(otype)) otype = column[actionParams.otype]['#text'];
                        this.callServiceListContextActions(actionParams.appId, otype, column[actionParams.objid]['#text'], event.element());
                    } .bindAsEventListener(this));
                }
                tr.insert(td);
            }, this);
            tableBody.insert(tr);
        }, this);
        resultTable.insert(tableBody);
        return resultTable;
    },
    /**
    * since 24/03/2010 There is no title in the screens
    * @description function in charge of building the second title of the result screen
    */
    buildResultTitle: function(text) {
        var divTitle = new Element("div", {
            'class': 'application_main_title reporting_content_div',
            'style': "width: 100%; float:none; text-align:left;",
            'id': 'rept_' + text + '_title'
        });
        if (text) divTitle.insert('<div class="Rept_result_title">' + global.getLabel(text) + '</div>');
        return divTitle;
    },

    /**
    * @description function in charge of managing the click on
    *              the actual reports selection screen link
    * @param {Object} event The click on the back link event
    */
    goSelectionScreen: function(event) {
        if (this.currentScreen == 'xml_result_display' ||
        			this.currentScreen == 'pdf_result_display') {
            this.changePrintButton("");
            this.resultDiv.hide();
            if (!Object.isEmpty(this.resultTitle))
                this.resultTitle.hide();
            this.selectionDiv.show();
            //this.selectionDiv.update();
            //this.selectionDiv.remove();

            //this.resultDiv.update();
            //this.selectionDiv.update();
            //this.resultDiv.remove();
            //this.selectionDiv.remove();
            //this.resultTitle.remove();
            try {//the use of try catch is not recommended,slows the webpage
                this.refreshSpan.remove();
            } catch (e) { }
            //since 24/03/2010 Remove the Relaunch and delete buttons
            try {//the use of try catch is not recommended,slows the webpage
                this.deleteSpan.remove();
            } catch (e) { }
            this.spoolTable = null;
            //this.getSpoolReportInfo();
            this.currentScreen = "selectionScreen";
            //lets update the top menu
            this.ButtonDisplayerLeft.enable('WA_ED_reports_list');
            this.ButtonDisplayerLeft.enable('WA_ED_results_list');
            this.ButtonDisplayerRight.setActive('WA_ED_report_name');
            this.ButtonDisplayerRight.enable('WA_ED_result_list');

            /*if (!Object.isEmpty(event.currentReport))
            var info = this.getReportInformations(event.currentReport.repId);
            else
            info = this.getReportInformations(this.lastSpoolReport);
            /* The function will now create the ajax request to get the selection screen associated to the report.
            * The reports div and the result summary div will be removed and the selection div will be inserted.
            * The selection screen object will be instanciated and the title changed. In answer to the Ajax call 
            * the buildSelectionScreen function will be in charge of inserting the content of the selection screen.  
            */

            /*if (info.isAvail == false) { return }

           

            if (!Object.isEmpty(this.reportsDiv)) this.reportsDiv.remove();
            //if (!Object.isEmpty(this.resultSummaryDiv)) this.resultSummaryDiv.remove();
            this.selectionDiv.update("");
            this.mainDiv.insert(this.selectionDiv);
            this.selectionScreen = new SelectionScreen(info.repId, info.varId, false, this.selectionDiv, this);
            this.getReport(info.repId, this.selectionScreen.variantId);
            if (info.isVar) {
            // BUG #3872 - BEG
            var changedTitle = info.varId.gsub("~", "_");
            // BUG #3872 - END
            this.changeTitle(info.repName, global.getLabel("Variant") +
            " " +
            changedTitle + //info.varId +
            ": " +
            info.varName);
            }
            else
            this.changeTitle(info.repName);
            this.currentReport = info; */
        }
        else if (this.currentScreen == 'xml_foreground_result_display' ||
        			this.currentScreen == 'pdf_foreground_result_display') {
            this.resultDiv.hide();
            if (!Object.isEmpty(this.resultTitle))
                this.resultTitle.hide();
            this.selectionDiv.show();
            try {//the use of try catch is not recommended,slows the webpage
                this.refreshSpan.remove();
            } catch (e) { }
            //since 24/03/2010 Remove the Relaunch and delete buttons
            try {//the use of try catch is not recommended,slows the webpage
                this.deleteSpan.remove();
            } catch (e) { }
            this.spoolTable = null;
            this.currentScreen = "selectionScreen";
            //lets update the top menu
            this.ButtonDisplayerLeft.enable('WA_ED_reports_list');
            this.ButtonDisplayerLeft.enable('WA_ED_results_list');
            this.ButtonDisplayerRight.setActive('WA_ED_report_name');
            this.ButtonDisplayerRight.enable('WA_ED_result_list');
        }

    },


    /**
    * @description function in charge of managing the click on
    *              the Reports List link
    * @param {Object} event The click on the back link event
    */
    goReportsList: function(event) {
        if (this.currentScreen == "selectionScreen") {
            this.selectionDiv.remove();
            this.selectionDiv.update();
            try {
                this.progressBarDiv.remove();
            } catch (e) { }
            try {
                this.messageDiv.remove();
            } catch (e) { }
            try {//the use of try catch is not recommended,slows the webpage
                //this.backSpan.remove();
            } catch (e) { }
            try {//the use of try catch is not recommended,slows the webpage
                //this.relaunchSpan.remove();
            } catch (e) { }
            try {//the use of try catch is not recommended,slows the webpage
                this.refreshSpan ? this.refreshSpan.remove() : false;
            } catch (e) { }
            //since 24/03/2010 Remove the Relaunch and delete buttons
            try {//the use of try catch is not recommended,slows the webpage
                this.deleteSpan.remove();
            } catch (e) { }
            this.currentScreen = "main_screen";
            //this.changeTitle(global.getLabel(this.mode));
            this.mainDiv.insert(this.reportsDiv); //.insert(this.resultSummaryDiv);
            //this.serviceName = 'GET_RESULT_NB';
            //this.successMethodToCall = 'buildSpool';
            //this.callServiceWithMode();


        } else if (this.currentScreen == "spool_list_display") {
            try {
                this.messageDiv.remove();
            } catch (e) { }
            this.resultListDiv.remove();
            //this.backSpan.remove();
            try {//the use of try catch is not recommended,slows the webpage
                //this.relaunchSpan.remove();
            } catch (e) { }
            try {//the use of try catch is not recommended,slows the webpage
                this.refreshSpan.remove();
            } catch (e) { }
            //since 24/03/2010 Remove the Relaunch and delete buttons
            try {//the use of try catch is not recommended,slows the webpage
                this.deleteSpan.remove();
            } catch (e) { }
            this.spoolTable = null;
            this.currentScreen = "main_screen";
            //this.changeTitle(global.getLabel(this.mode));
            this.mainDiv.insert(this.reportsDiv); //.insert(this.resultSummaryDiv);
            //this.serviceName = 'GET_RESULT_NB';
            //this.successMethodToCall = 'buildSpool';
            //this.callServiceWithMode();
        } else if (this.currentScreen == "xml_result_display" ||
        			this.currentScreen == 'pdf_result_display') {
            try {
                this.messageDiv.remove();
            } catch (e) { }
            this.changePrintButton("");
            this.resultDiv.update();
            this.resultDiv.remove();
            try {//the use of try catch is not recommended,slows the webpage
                this.refreshSpan.remove();
            } catch (e) { }
            //since 24/03/2010 Remove the Relaunch and delete buttons
            try {//the use of try catch is not recommended,slows the webpage
                this.deleteSpan.remove();
            } catch (e) { }
            this.selectionDiv.update();
            this.selectionDiv.remove();
            if (this.resultTitle) this.resultTitle.remove();
            this.spoolTable = null;
            this.currentScreen = "main_screen";
            //this.changeTitle(global.getLabel(this.mode));
            this.mainDiv.insert(this.reportsDiv); //.insert(this.resultSummaryDiv);
            //this.serviceName = 'GET_RESULT_NB';
            //this.successMethodToCall = 'buildSpool';
            //this.callServiceWithMode();            
        } else if (this.currentScreen == 'xml_foreground_result_display' ||
        			this.currentScreen == 'pdf_foreground_result_display') {
            try {
                this.messageDiv.remove();
            } catch (e) { }
            this.changePrintButton("");
            this.resultDiv.update();
            this.selectionDiv.update();
            this.resultDiv.remove();
            this.selectionDiv.remove();
            this.resultTitle.remove();
            //this.backSpan.remove();
            //this.relaunchSpan.remove();
            try {//the use of try catch is not recommended,slows the webpage
                this.refreshSpan.remove();
            } catch (e) { }
            //since 24/03/2010 Remove the Relaunch and delete buttons
            try {//the use of try catch is not recommended,slows the webpage
                this.deleteSpan.remove();
            } catch (e) { }
            this.spoolTable = null;
            this.currentScreen = "main_screen";
            //this.changeTitle(global.getLabel(this.mode));
            this.mainDiv.insert(this.reportsDiv); //.insert(this.resultSummaryDiv);
            //this.serviceName = 'GET_RESULT_NB';
            //this.successMethodToCall = 'buildSpool';
            //this.callServiceWithMode();
        }
        this.ButtonDisplayerLeft.setActive('WA_ED_reports_list');
        this.ButtonDisplayerLeft.enable('WA_ED_results_list');
        this.ButtonDisplayerRight.disable('WA_ED_report_name');
        this.ButtonDisplayerRight.updateLabel('WA_ED_report_name', '');
        this.ButtonDisplayerRight.disable('WA_ED_result_list');
        this.ButtonDisplayerRight.updateLabel('WA_ED_result_list', '');
        this.currentReport = null;
    },

    /**
    * @description function in charge of managing the progress bar when a report is executed.
    * @param {integer} number of seconds 
    */
    showProgressBar: function(nSeconds, forceBackground) {
        //hide the selection screen just in case is needed
        this.selectionDiv.hide();
        try {
            this.refreshSpan ? this.refreshSpan.remove() : false;
        } catch (e) { }
        try {
            this.deleteSpan.remove();
        } catch (e) { }
        if (forceBackground == '') {
            this.progressBarDiv = new Element("div", { 'class': 'RedBoxError legend_module_column_0 datePicker_month_td' });
            this.progressBarDiv.update(global.getLabel("report_currently_executed"));
            var progressBar = new Element("div", { 'id': 'progressBar1', 'class': 'application_book_cancelBook_content application_bookCurr_book_options ' })
            this.progressBarDiv.insert(progressBar);
            this.mainDiv.insert(this.progressBarDiv);
            //create a progress bar
            this.pb = new ProgressBar({
                target: "progressBar1",
                cellsNumber: nSeconds
            });
            var cells = this.pb.getCellsNumber();
            var time = 1000;
            Obj = this.pb;
            thisObj = this;
            for (var i = 1; i <= cells; i++) {
                //setTimeout(this.pb.drawFailure.bind(this), time * (i));
                setTimeout(function() { Obj.drawFailure(); }, time * (i));
            }
            //if the time has been exceeded.
            //setTimeout(function() { thisObj.showNoTimeMessage(); }, time * cells++);
        }
        else {
            var noTime = new Element("div", { 'class': 'RedBoxError gCatalog_WidgetClass' });
            noTime.update(global.getLabel('execution_done_background') + ' ');
            var noTime2 = new Element("div", { 'class': 'RedBoxError inlineElement' });
            noTime2.update(global.getLabel('check_status_in') + ' :');
            this.messageDiv = new Element("div", { 'class': 'RedBoxError datePicker_month_td' });
            this.messageDiv.insert(noTime);
            var myline = new Element("div", { 'class': 'RedBoxError inlineContainer' });
            myline.insert(noTime2);

            //insert the link to results list
            //Creating the data
            var json = {
                elements: []
            };
            var resultsList = {
                idButton: 'WA_ED_results_list2',
                //event: "",
                label: global.getLabel('results_list'),
                className: 'application_action_link',
                handler: function() {
                    this.serviceName = 'GET_RESULT_LST'; //'GET_RESULT_LIST';
                    this.successMethodToCall = 'drawResultList';
                    this.callServiceWithMode(this);
                } .bind(this),
                type: 'link'

            };
            json.elements.push(resultsList);
            //we call ButtonDisplayer class to get the elements to display
            var ButtonDisplayer = new megaButtonDisplayer(json);
            //when we are going to insert the div containing the buttons we do this:
            myline.insert(ButtonDisplayer.getButtons().addClassName('inlineElement'));
            this.messageDiv.insert(myline);
            this.mainDiv.insert(this.messageDiv);
        }
    },

    showNoTimeMessage: function() {
        var noTime = new Element("div", { 'class': 'RedBoxError gCatalog_WidgetClass' });
        noTime.update(global.getLabel('time_over') + ' ');
        var noTime2 = new Element("div", { 'class': 'RedBoxError ' });
        noTime2.update(global.getLabel('execution_done_background') + ' ');
        var noTime3 = new Element("div", { 'class': 'RedBoxError inlineElement' });
        noTime3.update(global.getLabel('check_status_in') + ' :');
        this.progressBarDiv.insert(noTime);
        this.progressBarDiv.insert(noTime2);
        var myline = new Element("div", { 'class': 'RedBoxError inlineContainer' });
        myline.insert(noTime3);
        //insert the link to results list
        //Creating the data
        var json = {
            elements: []
        };
        var resultsList = {
            idButton: 'WA_ED_results_list2',
            //event: "",
            label: global.getLabel('results_list'),
            className: 'application_action_link',
            handler: function() {
                this.serviceName = 'GET_RESULT_LST'; //'GET_RESULT_LIST';
                this.successMethodToCall = 'drawResultList';
                this.callServiceWithMode(this);
            } .bind(this),
            type: 'link'

        };
        json.elements.push(resultsList);
        //we call ButtonDisplayer class to get the elements to display
        var ButtonDisplayer = new megaButtonDisplayer(json);
        //when we are going to insert the div containing the buttons we do this:
        myline.insert(ButtonDisplayer.getButtons().addClassName('inlineElement'));
        this.progressBarDiv.insert(myline);
    },

    changePrintButton: function(way) {
        if (way == "to_res") {
            if (Object.isEmpty(this.new_print)) {
                this.originalPrint.remove();
                this.new_print = new Element("div", { 'class': 'application_main_print', 'id': 'fwk_print' });
                this.new_print.observe('click', this.printResults.bindAsEventListener(this));
                this.helpButton.insert({ before: this.new_print });
            }
            else {

            }
        } else {
            try {//the use of try catch is not recommended,slows the webpage
                this.new_print.remove();
                this.new_print = null;
                this.helpButton.insert({ before: this.originalPrint });
            } catch (e) { };
        }
    },

    printResults: function(event) {
        //IF export to PDF possible, clicking on the print button must export to PDF. 
        //ELSE IF export to XLS possible, clicking on the print button must export to XLS. 
        //ELSE the behavior when clicking on the print button must not be changed.
        if (this.currentScreen == 'xml_result_display') {
            var repId = this.lastSpoolReport;
        }
        else {
            if (!Object.isEmpty(this.currentReport)) repId = this.currentReport.repId;
            else repId = this.lastSpoolReport;
        }
        if (!Object.isEmpty(this.resultTitle.down('[id="rept_exportPDF"]')))
            this.exportResultsTo('PDF', repId);
        else if (!Object.isEmpty(this.resultTitle.down('[id="rept_exportXLS"]')))
            this.exportResultsTo('XLS', repId);
        else {
            var toSend = "";
            for (var index = 0; index < this.resultsTableNbr.length; ++index) {
                var div_identifier = "divScroll_" + this.resultsTableNbr[index];
                toSend += this.resultDiv.down('[id=' + div_identifier + ']').innerHTML;
                toSend += '<hr widht="50%" height="15px">';
            }
            myWindow = window.open('', '', 'titlebar=yes,menubar=yes,scrollbars=yes,height=480, width=640, resizable=yes');
            myWindow.document.write(toSend);
            myWindow.print();
        }
    },

    deleteResultFromSpool: function(event) {
        var _this = this;
        var contentHTML = new Element('div').insert('Are you sure you wan\'t to delete this result?');
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            if (_this)
                deleteFromSpoolPopUp.close();
            delete deleteFromSpoolPopUp;
            _this.serviceName = 'DEL_RESULT';
            _this.successMethodToCall = 'reportDeleted';
            _this.callServiceWithResultId(getArgs(event).resultId);
        };
        var callBack3 = function() {
            deleteFromSpoolPopUp.close();
            delete deleteFromSpoolPopUp;
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

        var deleteFromSpoolPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    deleteFromSpoolPopUp.close();
                    delete deleteFromSpoolPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        deleteFromSpoolPopUp.create();
    },

    refreshSpoolList: function() {
        this.spoolTable = null;
        //this.backSpan.remove();
        this.resultListDiv.update();
        this.resultListDiv.remove();
        // recall the service in order to update the status
        this.serviceName = 'GET_RESULT_LST'; //'GET_RESULT_LIST';
        this.successMethodToCall = 'drawResultList';
        this.callServiceWithMode();
    },
    /* method created on 24-03*/
    deleteFromSpoolList: function() {
        // get the inputs fromn the table
        var selected = this.getCheckedInputsFromTable();

        if (selected.size() > 0) {
            var servXml = '<EWS>'
					+ '<SERVICE>DEL_RESULT</SERVICE>'
					+ '<DEL/>'
					+ '<PARAM>'
					+ '<I_RESULT_IDS>';

            selected.each(function(select) {
                servXml += '<YGLUI_STR_RP_RESULT_ID RESULT_ID="' + select.substring(select.indexOf('_') + 1, select.length) + '"/>'
            });

            servXml += '</I_RESULT_IDS>'
					+ '</PARAM>'
					+ '</EWS>'

            this.makeAJAXrequest($H({
                xml: servXml,
                successMethod: this.reportsDeleted.bind(this)
            }));
        }
    },
    /* method created on 24-03*/
    relaunchFromSpoolList: function() {
        // get the inputs from the table
        var selected = this.getCheckedInputsFromTable();
        if (selected.size() > 0) {
            var servXml = '<EWS>'
					+ '<SERVICE>relaunch_res</SERVICE>'
					+ '<DEL/>'
					+ '<PARAM>'
					+ '<I_RESULTS>';

            selected.each(function(select) {
                servXml += '<YGLUI_STR_RP_RESULT_ID RESULT_ID="' + select.substring(select.indexOf('_') + 1, select.length) + '"/>'
            });

            servXml += '</I_RESULTS>'
					+ '</PARAM>'
					+ '</EWS>'

            this.makeAJAXrequest($H({
                xml: servXml,
                successMethod: this.reportsRelaunched.bind(this)
            }));
        }
    },

    getCheckedInputsFromTable: function() {
        var inputs = this.resultListDiv.select('input[type="checkbox]');
        var selected = inputs.collect(function(input) {
            if (input.checked == true)
                return input.id;
            else
                return null;
        });
        selected = selected.compact();
        return selected;
    },

    /**
    * @description Display the time from the SAP format to a display format
    * @param {String} Date with the SAP format
    */
    sapTimeToDisplay: function(sapTime) {
        var date = new Date();
        date.setHours(sapTime.substr(0, 2));
        date.setMinutes(sapTime.substr(3, 2));
        date.setSeconds(sapTime.substr(6, 2));
        return date.toString(global.hourFormat);
    },

    /**
    * @description Display the time from a Date object to the display format
    * @param {Date} Date to write
    */
    objectTimeToDisplay: function(date) {
        return date.toString(global.hourFormat);
    },

    /**
    * @description Add the dynamic labels from the received XML to a global list
    * @param {Object} json the received XML with Json format
    */
    addToLabels: function(json) {
        if (Object.isEmpty(json.EWS.labels)) return;
        objectToArray(json.EWS.labels.item).each(function(label) {
            if (!Object.isEmpty(label['@id']) && !Object.isEmpty(label['@value']))
                this.dynLabels.set(label['@id'], label['@value']);
        } .bind(this));
    },
    /**
    * @description Get the label associated to an Id
    * @param {String} labelId Id of the label to get
    */
    getDynLabels: function(labelId) {
        if (Object.isEmpty(labelId)) return '';
        var label = this.dynLabels.get(labelId);
        if (Object.isEmpty(label)) label = "<font style=\"background-color:red; padding:0 10px\" >" + labelId + "</font>"; //in case of error we modify the color
        return label;
    }
    /*
    showVersion: function() {
    var versionPopUp = new infoPopUp({
    closeButton: $H({
    'callBack': function() {
    versionPopUp.close();
    delete versionPopUp;
    }
    }),
    htmlContent: 'Version: ' + this.version,
    indicatorIcon: 'information',
    width: 350
    });

        versionPopUp.create();
    }
    */



});


/**
* @constructor
* @description Allow the construction of a dynamic report selection screen
*/

var SelectionScreen = Class.create({
    /** 
    *@lends SelectionScreen
    */

    /**
    * @type Hash
    * @description List of the objects that allow to get the values in
    *              the selection screen.
    */
    selectionValues: null,

    /**
    *@type Element
    *@description Content where the selection screen has to take place.
    */
    htmlContent: null,

    /**
    *@type Hash
    *@description List of constants used in the class.
    */
    indicators: $H({
        'low': '_RangeLow',
        'high': '_RangeHigh',
        'time': 'Time',
        'date': 'Date',
        'value': 'Value',
        'check': 'Checkbox',
        'radio': 'Radio',
        'area': 'Area',
        'line': 'Line',
        'error': 'Error'
    }),

    /**
    *@type RegExp
    *@description Regular expression used to check if a number is an integer.
    */
    intRegExp: null,

    /**
    *@type RegExp
    *@description Regular expression used to check if a number is a float.
    */
    floatRegExp: null,

    /**
    *@type RegExp
    *@description Regular expression used to check if a number is a decimal.
    */
    decRegExp: null,

    /**
    *@type Hash
    *@description List of the div with the different areas in the selection. The most common areas are <i>common area</i> and <i>specific area</i>.
    */
    createdAreas: null,

    /**
    *@type Boolean
    *@description The form has the read only mode.
    */
    visibleOnly: null,

    /**
    *@type String
    *@description Id of the report currently selected.
    */
    reportId: null,

    /**
    *@type String
    *@description Id of the valriant currently selected.
    */
    variantId: null,

    /**
    *@type Object
    *@description Json of the last display of the selection screen.
    */
    lastJson: null,

    parent: null,

    currentLoading: null,

    /**
    * Max time of the last selection screen
    * @type Integer
    * @since 24/03/2010 
    */
    lastMaxTime: null,
	
	fieldTechNames: null,

    /**
    * Initialize the report selection screen.
    * @param {String} reportID Identifier of the selected report.
    * @param {String} variantID Identifier of the selected variant.
    * @param {Boolean} visibleOnly Is the form to display in read mode(not editable).
    * @param {Element} parentHtmlContent Node to use as the parent in the screen.
    */
    initialize: function(reportId, variantId, visibleOnly, parentHtmlContent, parent) {
        this.reportId = reportId;
        this.variantId = variantId;
        this.htmlContent = parentHtmlContent;
        this.parent = parent;

		this.fieldTechNames = $H();


        // Build the regular expression for integers from global
        // parameters
        if (global.thousandsSeparator.empty())
            var floatRegExpStr = '^[0-9]{1,3}([0-9]{3})*(' + global.commaSeparator + '[0-9]*)?$';
        else
            var floatRegExpStr = '^[0-9]{1,3}('
				+ global.thousandsSeparator + '[0-9]{3})*('
				+ global.commaSeparator + '[0-9]*)?$';

        floatRegExpStr = floatRegExpStr.gsub(/\.{1}/, function(match) {
            return '\\' + match[0]
        });

        this.floatRegExp = new RegExp(floatRegExpStr);
        this.intRegExp = new RegExp('^[0-9]*$');
        this.decRegExp = new RegExp('^[0-9]{1,3}([0-9]{3})*(' + global.commaSeparator + '[0-9]*)?$')

        this.visibleOnly = false;
        this.createdAreas = $H();
        this.selectionValues = $H();
        this.currentLoading = $H();
		
		
    },

    /**
    * @description Get the HTML generated for the current selection
    *              screen.
    * @returns Element
    */
    getHtmlContent: function() {
        return this.htmlContent;
		
    },

    /**
    * @description Add the values from the last form filing in the last used Json
    */
    getLastJsonWithValues: function() {
        var newJson = this.lastJson;
        var selScreens = objectToArray(newJson.EWS.o_fields.yglui_str_rp_o_selscreen_02);
        var fieldValues;
        var listValues = this.getListValues();
        var fields;
	
        selScreens.each(function(selScreen) {
            fields = $A();
            if (!Object.isEmpty(selScreen.fields))
                fields = objectToArray(selScreen.fields.yglui_str_rp_o_screenfields_02);

            fields.each(function(field) {
                fieldValues = listValues.get(field['@fieldname']);
				
				
				
                if (Object.isEmpty(fieldValues))
                    return;
                if (Object.isEmpty(fieldValues.highValue))
                    fieldValues.highValue = '';

                //lets add the value descriptions only for the necessary fields  PNPPERNR,PNPWERK,PNPPERSK
                var values = $A();
                var descriptions = $A();

                if (field['@fieldtype'] === 'RNG') {
                    //Add the values
                    var lowVal = fieldValues.lowValue.split(',').reject(function(item) { return (Object.isEmpty(item) || item === '') });
                    lowVal.each(function(val) {
                        values.push({ '@low': val, '@high': '' });
                    }, this);
                    //Add the descriptions of the fields
                    objectToArray(fieldValues.description).each(function(descr, index) {
                        descriptions.push({ '@value': lowVal[index], '@value_text': descr });
                    }, this);
                } else {
                    //For the reanges, add the low and high values
                    if (fieldValues.selection === 'range') {
                        values = { '@low': fieldValues.lowValue, '@high': fieldValues.highValue };
                        descriptions.push({
                            '@value': fieldValues.lowValue,
                            '@value_text': (fieldValues.descriptionLow || '')
                        });
                        descriptions.push({
                            '@value': fieldValues.highValue,
                            '@value_text': (fieldValues.descriptionHigh || '')
                        });
                        //For the single fields, add the low value
                    } else if (fieldValues.selection === 'single') {
                        values = { '@low': fieldValues.lowValue, '@high': '' };
                        descriptions.push({
                            '@value': fieldValues.lowValue,
                            '@value_text': fieldValues.descriptionLow
                        });
                    }
                }

                field.values = {
                    yglui_str_rp_values: values
                };
                field.value_descriptions = {
                    yglui_str_rp_value_description: descriptions
                };
            });
        });

        return newJson;
    },

    /**
    * Get the last max time for this selection screen
    * @since 24/03/2010
    */
    getLastMaxTime: function() {
        return this.lastMaxTime
    },

    /**
    *@description Buid of the HTML content of the form. 
    *				It is composed of: areas (= Widget with some selection fields) and fields. 
    *				Each field is on one line and could be a range or a single value. 
    *				Depending on the type of variable (time, hour, ...) the selection is different.
    *				The HTML content is directly updated to be able to add some objects to apply on it.
    * @param {Object} json Answer of the get_report service.
    * @param {Integer} maxTime Time to wait before sending the query to the backend
    */
    buildSelScreen: function(json, $getLabel, maxTime, option) {
        if (Object.isEmpty(json.EWS.o_fields)) return;

        var dependencies = $H();
        var searchHelps = $H();
        this.lastJson = json;
        this.lastMaxTime = maxTime;
        var divDate = null;
        var datePickerLow = null; //if its necessary to link two datePickers
        var areasJson = objectToArray(json.EWS.o_fields.yglui_str_rp_o_selscreen_02);
		
        areasJson.each(function(areaJson) {
            // List of additional fields
            if (!areaJson.fields) return;
            var fields = objectToArray(areaJson.fields.yglui_str_rp_o_screenfields_02);

            var possVal = [];
            var searchHelpAvailable;
            var maxLength = 0;
            var lowValue = null;
            var highValue = null;
            var period = {
                ready: 0,
                begda: { fieldname: '', value: '' },
                endda: { fieldname: '', value: '' },
                label: ''
            }
				
            fields.each(function(field, index) {
			
			
			/*
			 * where each selection form field range is created
			 */
			
			
                var mandatoryField = false;
                // check if the field must be displayed
                if (!Object.isEmpty(field['@display_mode'])) {
                    if (field['@display_mode'] == 'H') {
                        return;
                    }
                }
                //check if the field is a mandatory field
                if (!Object.isEmpty(field['@display_mode'])) {
                    if (field['@display_mode'] == 'M') {
                        mandatoryField = true;
                    }
                }
                // Create the list of possible values
                if (!Object.isEmpty(field.possiblevalues))
                    possVal = objectToArray(field.possiblevalues.yglui_str_label);
                else
                    possVal = $A();
                if (!Object.isEmpty(field['@sh_service']) && !Object.isEmpty(field['@sh_serv_techname'])) {
                    searchHelps.set(field['@fieldname'], {
                        sh_service: field['@sh_service'],
                        sh_techname: field['@sh_serv_techname']
                    });
                }
				this.fieldTechNames.set(field['@fieldname'],field['@sh_serv_techname'] );

                searchHelpAvailable = false;
				/*
				 * where field dependencies are set into dependencies hash
				 * 
				 */
                if (field.dependancies) {
					
                    var depArray = $H();
                    var deps = objectToArray(field.dependancies.yglui_str_rp_o_screenfields_dp);
                    deps.each(function(dep) {
					
                        depArray.set(dep['@dep_field'], {
                            dep_techname: dep['@dep_techname'],
                            dep_val: dep['@dep_value']
                        });
                    });
                    dependencies.set(field['@fieldname'], depArray);
					
					
					
                }

                // Get the defined maxlength
                if (Object.isEmpty(field['@max_length']))
                    maxLength = 0;
                else
                    maxLength = field['@max_length'];

                var lowValue = { id: '', text: '' };
                var highValue = { id: '', text: '' };

                if (!Object.isEmpty(field["values"])) {
                    var descriptions = $A();
                    if (field.value_descriptions && field.value_descriptions.yglui_str_rp_value_description)
                        descriptions = objectToArray(field.value_descriptions.yglui_str_rp_value_description);

                    if (Object.isArray(field.values.yglui_str_rp_values)) {
                        lowValue = $A();
                        objectToArray(field.values.yglui_str_rp_values).each(function(val) {
                            var lowVal = { id: (val['@low'] || ''), text: '' };

                            if (field.value_descriptions) {
                                descriptions.each(function(descr) {
                                    if (descr['@value'] === lowVal.id)
                                        lowVal.text = unescape(descr['@value_text']);
                                }, this);
                            }
                            lowValue.push(lowVal);
                        }, this);
                    } else {
                        lowValue = { id: (field["values"].yglui_str_rp_values['@low'] || ''), text: '' };
                        highValue = { id: (field["values"].yglui_str_rp_values['@high'] || ''), text: '' };

                        //if field.value_descriptions exists lets add the values to lowValue
                        if (field.value_descriptions) {
                            descriptions.each(function(descr) {
                                if (descr['@value'] === highValue.id)
                                    highValue.text = unescape(descr['@value_text']);
                            }, this);
                            descriptions = descriptions.reverse();
                            descriptions.each(function(descr) {
                                if (descr['@value'] === lowValue.id)
                                    lowValue.text = unescape(descr['@value_text']);
                            }, this);
                        }
                    }
                }

                switch (field['@fieldname']) {
                    case 'PNPBEGDA':
                    case 'PCHBEGDA':
                        period.begda.fieldname = field['@fieldname'];
                        period.begda.value = lowValue.id;
                        period.label = $getLabel(field['@tag']);

                        if (period.ready == 0)
                            period.ready = 1;
                        else
                            period.ready = 0;
                        if (period.ready < 1)
                            return;
                        break;

                    case 'PNPENDDA':
                    case 'PCHENDDA':
                        period.endda.fieldname = field['@fieldname'];
                        period.endda.value = lowValue.id;

                        if (period.ready == 1)
                            period.ready = 2;
                        else
                            if (period.ready == 0)
                            period.ready = 3;

                        if (period.ready < 2)
                            return;

                        break;
                }

                // Check in with frame the line is to add
                var area = this.addAreaDiv(areaJson['@fldgroup_id'], $getLabel(areaJson['@tag']), this.htmlContent);

                switch (period.ready) {
                    case 1:  //if only begda is filled => add the period line for begda
                        if (Object.isEmpty(divDate))
                            divDate = new Object();
                        divDate = this.addFormLine(field['@fieldname'], period.label, area, mandatoryField);
                        datePickerLow = this.addBegda(period, divDate, mandatoryField)
                        if (fields[index + 1]['@fieldname'] == "PNPENDDA" || fields[index + 1]['@fieldname'] == "PCHENDDA") {
                            return;
                        }
                        else {
                            datePickerLow = null;
                            period.ready = 0;
                            divDate = null;
                            return;
                        }
                        break;
                    case 2:  //if both begda ands endda are filled => add the period line
                        if (Object.isEmpty(divDate))
                            divDate = this.addFormLine(field['@fieldname'], period.label, area, mandatoryField);
                        this.addEndda(period, divDate, datePickerLow, mandatoryField);
                        datePickerLow = null;
                        period.ready = 0;
                        divDate = null;
                        return;
                        break;
                    case 3:  //if only endda is filled => add the period line for endda
                        divDate = this.addFormLine(field['@fieldname'], period.label, area, mandatoryField);
                        this.addEndda(period, divDate, mandatoryField);
                        datePickerLow = null;
                        period.ready = 0;
                        divDate = null;
                        return;
                        break;
                }

                // Create the div to store the form line
                var div = this.addFormLine(field['@fieldname'], $getLabel(field['@tag']), area, mandatoryField);
				
                // Create the content of the div line
                switch (field['@fieldtype']) {

                    // Add  a single parameter field                                                              

                    case 'LST':
                    case 'PAR':
                        switch (field['@datatype']) {
                            case 'T':
                                this.addTime(field['@fieldname'], lowValue.id, div, mandatoryField);
                                break;

                            case 'D':
                                this.addDate(field['@fieldname'], possVal, lowValue.id, div, mandatoryField);
                                break;

                            default:
                                this.addValue(field['@fieldname'], possVal,
                			lowValue, field['@datatype'], maxLength,
							div, searchHelpAvailable, mandatoryField, field["@sh_serv_techname"]);
						
                                break;
                        }
                        break;


                    // Add a select option with a low and high value                                                              

                    case 'SEL':
                        switch (field['@datatype']) {
                            case 'D':
                                this.addRangeDate(field['@fieldname'], possVal, {
                                    low: lowValue.id,
                                    high: highValue.id
                                }, div, mandatoryField);
                                break;

                            case 'T':
                                this.addRangeTime(field['@fieldname'], {
                                    low: lowValue.id,
                                    high: highValue.id
                                }, div, mandatoryField);
                                break;

                            default:
							
							//changed the input parameters to include the dependencies object
							
                                this.addRangeValues(field['@fieldname'], possVal, {
                                    low: lowValue,
                                    high: highValue
                                }, field['@datatype'], maxLength, div, searchHelpAvailable
								, mandatoryField, field['@sh_serv_techname']);
								
                                break;
                        }
                        break;


                    // Add a boolean as a checkbox                                                              

                    case 'CHK':
                        this.addCheckBox(field['@fieldname'], lowValue.id, div);
                        break;

                    // We want to allow several entries from a list	                                                              

                    case 'RNG':
                        var myMultiSelect = this.addMultiSelect(field['@fieldname'], possVal,
                			lowValue, field['@datatype'], maxLength,
							div, searchHelpAvailable, mandatoryField);
                        if (field['@fieldname'] == "PNPPERNR")//Hardcoded(this is the link to add from my selection)
                            this.addButton(myMultiSelect);
                        break;

                    case 'RDB':
                        this.addRadioItem(field['@fieldname'], field['@radbutton_group'],
                			lowValue.id, div);
                        break;

                }
            } .bind(this));
        } .bind(this));
	
        this.parent.dependencies = dependencies;
        this.parent.searchHelps = searchHelps;
	
        // Add an additional div in each
        this.createdAreas.each(function(areaDiv) {
            //since 24/03/2010 - Set that the extra line has no height Rept_formLine -> FWK_EmptyDiv
            var div = new Element('div', {
                'class': 'FWK_EmptyDiv'
            });
            areaDiv[1].insert(div);
        } .bind(this));

        // Add the execute button
        if (!this.visibleOnly) {
            //if (this.parent.executeButton == null) {
            var json = {
                elements: []
            };
            var aux = {
                label: global.getLabel('execute_report'),
                handlerContext: null,
                handler: this.clickingOnExecuteReport.bind(this),
                className: 'Rept_execButton',
                type: 'button',
                idButton: 'execute_report',
                standardButton: true
            };
           
            json.elements.push(aux);
            this.parent.executeButton = new megaButtonDisplayer(json);
            //}
            this.htmlContent.insert(this.parent.executeButton.getButtons());

            //since 24/03/2010 - Add an input field to enter job name
            var executeOptions =
				'<div id="Rept_ExecuteOptions">'
			+ '<input type="text" defvalue="' + global.getLabel('EnterSubtitle') + '" value="' + global.getLabel('EnterSubtitle') + '" maxlength="20" id="Rept_ExecuteSubtitle"/>';
            if (maxTime > 0)
                executeOptions +=
					'<div>'
			+ '<input type="checkbox" id="Rept_ExecuteForceBgr"/>'
			+ '<span id="Rept_ExecuteForceBgrLabel">' + global.getLabel('ForceExecInBackground') + '</span>'
			+ '</div>';

            executeOptions += '</div>';

            this.htmlContent.insert(executeOptions);
            //since 24/03/2010 Add the event to hide the default text when clicking
            this.htmlContent.down('input#Rept_ExecuteSubtitle').observe('focus', function(event) {
                var element = event.element();
                if (element.value === element.readAttribute('defvalue'))
                    element.value = '';
            } .bindAsEventListener(this));
            //since 24/03/2010 Add the event listener to set the default value if there is nothing
            this.htmlContent.down('input#Rept_ExecuteSubtitle').observe('blur', function(event) {
                var element = event.element();
                if (element.value === '')
                    element.value = element.readAttribute('defvalue');
            } .bindAsEventListener(this));

            this.selectionValues.each(function(field) {
                if (field.value.type == 'MULTI' && !Object.isEmpty(searchHelps.get(field.key))) {
                    this.getMultiSelectValues(field.key);
                }
            } .bind(this));
        }

			
    },

    /**
    * Get the execution options 
    * @since 24/03/2010
    */
    getExecOptions: function() {
        var execOptions = {
            subtitle: '',
            forceBackground: ''
        };
        var subtitleInput = this.htmlContent.down('input#Rept_ExecuteSubtitle');
        var forceBckgInput = this.htmlContent.down('input#Rept_ExecuteForceBgr');

        if (subtitleInput && subtitleInput.value !== subtitleInput.readAttribute('defvalue'))
            execOptions.subtitle = subtitleInput.value;
        if (forceBckgInput && forceBckgInput.checked)
            execOptions.forceBackground = 'X';

        return execOptions;
    },

    /**
    *@description Adds selected employees from left menu to create a new event
    */
    _addMySelection: function(myMultiselect) {
        var previousSelected = myMultiselect.selectedElements;
        for (var i = 0; i < previousSelected.length; i++) {
            myMultiselect.insertElementJSON(previousSelected[i]);
        }
        var boxes = myMultiselect.mainContainer.select('.multiSelect_item')
        if (boxes.length != 0) {
            for (var i = 0; i < boxes.length; i++) {
                boxes[i].remove();
            }
        }
        myMultiselect.selectedElements.clear();
        var selected = this.parent.getSelectedEmployees();
        selected.each(function(employee) {
            var data = new Hash();
            data.set('data', employee.key);
            data.set('text', employee.value.name);
            myMultiselect.createBox(data);
            myMultiselect.removeElementJSON(data, false);
        } .bind(this.parent));
		
    },

    clickingOnRefreshReport: function(event) {
        //this.virtualHtml.down('[id = rept_Results_title]').update("");
        this.virtualHtml.down('[id = reporting_result]').update("");
        this.clickingOnExecuteReport(events);
    },

    clickingOnExecuteReport: function(event) {
        this.removeRedErrorMessage();
        this.selectionValues.each(this.checkScreenItem.bind(this));

        if (!this.getIfErrros()) {
            document.fire('EWS:reporting_execute_report', $H({
                values: this.getListValues()
            }));
        }
    },
    /**
    *@desciption Add a div in the given element that will contain an area. The created element is added in the global list createdAreas and returned.
    *@param {String} areaName  Name of the area to build. Its name has to be in the labels.
    *@param {Element} HTMLContent  HTML element that has to contain the area.
    *@returns Element
    */
    addAreaDiv: function(areaName, title, HTMLContent) {
        var areaDiv = this.createdAreas.get(areaName);
        if (Object.isEmpty(areaDiv)) {
            // Create the div to store the widget
            var div = new Element('div', {
                'id': areaName + this.indicators.get('area'),
                'class': 'reporting_content_div'
            });
            HTMLContent.insert(div);

            // Create the options
            var options = $H({
                title: title,
                collapseBut: true,
                targetDiv: areaName + this.indicators.get('area'),
                contentHTML: '<div id="' + areaName + 'AreaTxt"></div>'
            });

            // Create the widget
            var myWidget = new unmWidget(options);

            // Add the new widget in the list
            areaDiv = this.htmlContent.down(
				'[id=' + areaName + this.indicators.get('area')
						+ ']').down(
				'[id=unmWidgetContent_' + areaName
						+ this.indicators.get('area') + ']').down();
            this.createdAreas.set(areaName, areaDiv);
        }
        return areaDiv;
    },

    /**
    *@description Add a div in the given element that will contain a line of the selection screen.
    *@param {String} fieldName  Name of the field to add in the selection screen.
    *@param {String} label  Label to display on the screen as name of the field.
    *@param {Element} HTMLContent Element that has to contain the selection screen line.
    *@param {Boolean} mandatoryField specifies if is a mandatory field
    *@returns Element
    */
    addFormLine: function(fieldName, label, HTMLContent, mandatoryField) {
        // Create the div for the form line
        div = new Element('div', {
            'id': fieldName + this.indicators.get('line'),
            'class': 'Rept_formLine'
        });

        // Add the label
        if (!label.empty()) {
            if (mandatoryField)
                label = label + " *";
            if (this.visibleOnly)
                div.insert(new Element('span', {
                    'class': 'Rept_formLineLabel',
                    'style': 'margin-top: 0px;'
                }).update(label));
            else
                div.insert(new Element('span', {
                    'class': 'Rept_formLineLabel'
                }).update(label));
        }

        HTMLContent.insert(div);
        return div;
    },

    /**
    *@description Get the span that contains the label with the word 'To' for ranges.
    *@returns Element
    */
    getToLabel: function() {
        var span = new Element('span', {
            'class': 'Rept_formToLabel application_main_text'
        }).update(' ' + global.getLabel('to') + ' ');

        if (this.visibleOnly)
            span.setStyle({
                marginTop: '0px'
            });

        return span;
    },

    addCheckBox: function(fieldName, value, HTMLContent) {
        var check = new Element("input", {
            "type": "checkbox",
            "class": "Rept_checkbox",
            "id": fieldName + this.indicators.get('check')
        })

        if (this.visibleOnly) {
            check.disable();
            check.removeClassName("Rept_checkbox");
            check.setStyle({
                'float': 'left'
            });
        }

        HTMLContent.down().insert({
            before: check
        });
        if (value == 'X')
            check.checked = true;
        else
            check.checked = false;

        this.selectionValues.set(fieldName, {
            type: 'CHECK',
            object: check,
            error: false,
            lineError: false
        });
    },

    /**
    *@description Adds the begda and the endda on a same line even if there are 2 parameters.
    *@param {Object} period  Parameters of the period.
    *@param {Element} HTMLContent  Element that has to contain the range.
    */
    addBegdaEndda: function(period, HTMLContent, Mandatory) {
        var datePickerLow = this.addDate(period.begda.fieldname, $A(), period.begda.value, HTMLContent, Mandatory);
        HTMLContent.insert(this.getToLabel());
        var datePickerHigh = this.addDate(period.endda.fieldname, $A(), period.endda.value, HTMLContent, Mandatory);
        // Link the calendars together
        if (!this.visibleOnly)
            datePickerLow.linkCalendar(datePickerHigh);
    },

    /**
    *@description Adds the begda on a same line even if there are 2 parameters.
    *@param {Object} period  Parameters of the period.
    *@param {Element} HTMLContent  Element that has to contain the range.
    *@returns datePickerLow if is neccesary to be linked with other datePicker
    */
    addBegda: function(period, HTMLContent, Mandatory) {
        var datePickerLow = this.addDate(period.begda.fieldname, $A(), period.begda.value, HTMLContent, Mandatory);
        return datePickerLow;
    },

    /**
    *@description Adds the begda on a same line even if there are 2 parameters.
    *@param {Object} period  Parameters of the period.
    *@param {Element} HTMLContent  Element that has to contain the range.
    *@param {datePickerLow} the datePickerLow to be linked with
    */
    addEndda: function(period, HTMLContent, datePickerLow, Mandatory) {
        HTMLContent.insert(this.getToLabel());
        var datePickerHigh = this.addDate(period.endda.fieldname, $A(), period.endda.value, HTMLContent, Mandatory);
        // Link the calendars together
        if (!Object.isEmpty(datePickerLow))
            if (!this.visibleOnly && datePickerLow != false)
                datePickerLow.linkCalendar(datePickerHigh);
    },

    /**
    *@description Add the content of the selection screen line to allow the user to fill in a range of dates.
    *@param {String} fieldName  Name of the field to add in the selection screen.
    *@param {Array} possibleValues List of the possible values for the date.
    *@param {Object} values  Contains the low and the high values for the range.
    *@param {Element} HTMLContent  Element that has to contain the range.
    */
    addRangeDate: function(fieldName, possibleValues, values, HTMLContent, Mandatory) {
        var newFieldName = fieldName + this.indicators.get('low');
        var datePickerLow = this.addDate(newFieldName, possibleValues,
			values.low, HTMLContent, Mandatory);
        HTMLContent.insert(this.getToLabel());
        newFieldName = fieldName + this.indicators.get('high');
        var datePickerHigh = this.addDate(newFieldName, possibleValues,
			values.high, HTMLContent, Mandatory);
        // Link the calendars together
        if (!this.visibleOnly)
            datePickerLow.linkCalendar(datePickerHigh);
    },

    /**
    *@description Add the content of the selection screen line to allow the user to fill in a date.
    *				This date is filled through a DatePicker that is added in the list
    *				of stored value container objects.
    *@param {String} fieldName  Name of the field to add in the selection screen.
    *@param {Array} possibleValues 	List of the possible values for the date.
    *@param {Object} value  Contains the default value.
    *@param {Element} HTMLContent  Element that has to contain the field.
    *@returns Object
    */
    addDate: function(fieldName, possibleValues, value, HTMLContent, Mandatory) {
        var div = new Element('div', {
            'id': fieldName + this.indicators.get('date'),
            'class': 'Rept_formColumnItem'
        });
        HTMLContent.insert(div);

        if (this.visibleOnly) {
            if (!Object.isEmpty(value) && value != '00000000')
                div.update(sapToDisplayFormat(Date.parseExact(value, 'yyyyMMdd').toString('yyyy-MM-dd')));
            else
                div.update('/');

            div.setStyle({ marginTop: '0px' });
            this.selectionValues.set(fieldName, {
                type: 'DATE',
                object: div,
                error: false,
                lineError: false,
                mandatory: Mandatory
            });
            return div;
        } else {//create a date picker with the current date
            var options = {};
            if (!Object.isEmpty(value) && value != '00000000') //if not defined and diferent that 00000000
                options.defaultDate = value;
            options.manualDateInsertion = true;
            options.systemDateWhenEmpty = true; //create a datepicker with the current date if the date is empty
            var datePicker = new DatePicker(fieldName + this.indicators.get('date'), options);
            this.selectionValues.set(fieldName, {
                type: 'DATE',
                object: datePicker,
                error: false,
                lineError: false,
                mandatory: Mandatory
            });
            return datePicker;
        }
    },

    /**
    *@description Add the content of the selection screen line to allow the user to fill in a range of times.
    *@param {String} fieldName  Name of the field to add in the selection screen.
    *@param {Object} values  Contains the low and the high values for the range.
    *@param {Element} HTMLContent  Element that has to contain the range.
    */
    addRangeTime: function(fieldName, values, HTMLContent, Mandatory) {
        var newFieldName = fieldName + this.indicators.get('low');
        this.addTime(newFieldName, values.low, HTMLContent, Mandatory);
        HTMLContent.insert(this.getToLabel());
        newFieldName = fieldName + this.indicators.get('high');
        this.addTime(newFieldName, values.high, HTMLContent, Mandatory);
    },

    /**
    *@description Add the content of the selection screen line to allow the user to fill in a time.
    *				This time is filled in through a HourField that is added in the list of 
    *				stored value container objects.
    *@param {String} fieldName  Name of the field to add in the selection screen.
    *@param {Object} value  Contains the default value.
    *@param {Element} HTMLContent  Element that has to contain the field.
    */
    addTime: function(fieldName, value, HTMLContent, Mandatory) {
        var div = new Element('div', {
            'id': fieldName + this.indicators.get('time'),
            'class': 'Rept_formColumnItem'
        });
        HTMLContent.insert(div);

        if (this.visibleOnly) {
            if (!Object.isEmpty(value) && value != '000000')
                div.update(this.sapTimeToDisplay(value));
            else
                div.update('/');

            div.setStyle({
                marginTop: '0px'
            });
            this.selectionValues.set(fieldName, {
                type: 'TIME',
                object: div,
                error: false,
                lineError: false,
                mandatory: Mandatory
            });
        } else {
            var options = {};
            if (!value.empty())
                options.defaultTime = value;
            if (global.hourFormat.match(/s{1,2}/)) options.viewSecs = 'yes';
            else options.viewSecs = 'no';
            if (global.hourFormat.match(/[tT]{1,2}/)) options.format = '12';
            else options.format = '24';

            var hourField = new HourField(fieldName
				+ this.indicators.get('time'), options);
            this.selectionValues.set(fieldName, {
                type: 'TIME',
                object: hourField,
                error: false,
                lineError: false,
                mandatory: Mandatory
            });
        }
    },

    /**
    *@description Add the content of the selection screen line to allow the user to fill in a range of values with or without autocomplete box.
    *@param {String} fieldName  Name of the field to add in the selection screen.
    *@param {Array} possibleValues 	List of the possible values for the entries.
    *@param {Object} values  Contains the low and the high values for the range.
    *@param {String} type  Is the elements to add CHAR, TIME or FLOAT.
    *@param {Element} HTMLContent  Element that has to contain the range.
    */

    addRangeValues: function(fieldName, possibleValues, values, type, length, HTMLContent, searchHelpAvailable, Mandatory) {

        var newFieldName = fieldName + this.indicators.get('low');

        this.addValue(newFieldName, possibleValues, values.low, type, length, HTMLContent, searchHelpAvailable, Mandatory);

        HTMLContent.insert(this.getToLabel());
	
        newFieldName = fieldName + this.indicators.get('high');

        this.addValue(newFieldName, possibleValues, values.high, type, length, HTMLContent, searchHelpAvailable, Mandatory);

    },

    /**
    *@description Add the content of the selection screen line to allow the user to fill in a value.
    *				This value could be filled via an autocompleter if there are defined possible values.
    *				Otherwise, it is a simple input field. The autocompleter or the input field is added in 
    *				the list of stored value container objects.
    *@param {String} fieldName  Name of the field to add in the selection screen.
    *@param {Array} possibleValues 	List of the possible values for the entry.
    *@param {Object} value  Contains the default value.
    *@param {Element} HTMLContent  Element that has to contain the field.
    */
	
	/*
	 * 
	 * do it here
	 */
    addValue: function(fieldName, possibleValues, value, type, length, HTMLContent, searchHelpAvailable, Mandatory
	, fieldTechName) {
        var div = new Element('div', {
            'id': fieldName + this.indicators.get('value'),
            'class': 'Rept_formColumnItem'
        });
        HTMLContent.insert(div);
	
	
		/*
		 * starting of putting values in auto completer
		 * 
		 */
		
        if (type === 'F')
            value.id = this.floatSapToDisplay(value.id);

        // If we are in visible only => display the field
        if (this.visibleOnly) {
            if (Object.isEmpty(value.id)) {
                div.update('/');
                div.setStyle({
                    marginTop: '0px'
                });
                return;
            }

            var displayValue = value.text;

            div.update(displayValue);
            div.setStyle({
                marginTop: '0px'
            });
            this.selectionValues.set(fieldName, {
                type: type,
                object: div,
                error: false,
                lineError: false,
                mandatory: Madatory
            });
        } else {
            // If there is a search help => Build an autocomplete without values
            // If there are possible values => build an autocomplete with them
            var hasDef = false;
            if (possibleValues.size() > 0 || searchHelpAvailable === true) {
                var json = {
                    autocompleter: {
                        object: new Array([{
                            text: '',
                            id: ''
						}])
                        }
                    };


                    var new_object = {};
					/*
					 *determines what goes into the autocompleter json 
					 * 
					 */
					
                    for (var i = 0; i < possibleValues.length; ++i) {
						
                        new_object.data = possibleValues[i]['@tag'];
						
                        if (Object.isEmpty(new_object.data)){
							new_object.data = '';
						}
						if (!Object.isEmpty(possibleValues[i]['#text'])) {
							new_object.text = possibleValues[i]['#text'];
						}else{
						 	new_object.text = possibleValues[i]['@tag'];
						}
                           
                        if (value.id == possibleValues[i]['@tag'] && value.text == possibleValues[i]['#text']) {
                            hasDef = true;
                            new_object.def = 'X';
                        }else if (value.id == possibleValues[i]['@tag'] && value.text == '') {
                            hasDef = true;
                            new_object.def = 'X';
                        }

                        json.autocompleter.object.push(new_object);
                        new_object = {};
						
                    }

                    // If there is an associated search help => disable the autocomplete
                    if (searchHelpAvailable === true) {
                        var options = {
                            timeout: 500,
                            showEverythingOnButtonClick: true,

                            templateResult: '#{text}'//,
							        //added june 26 2010

                            //xmlToSend: xmlin,
                            //searchWithService: true,
                            //url: this.url,
                            //method: this.method

                        };
                    } else {

                        var options = {
                            timeout: 500,
                            showEverythingOnButtonClick: true,
                            templateResult: '#{text}'
                        };
                    }
					
					
					
					//ayo changes
					//checks wether the possible values are greater than 50 
					if (possibleValues.length >= 20) {
						var xmlin = '<EWS>' +
									'<SERVICE>get_poss_val_rp</SERVICE>' +
									'<DEL/>' +
									'<PARAM>' +
									'<FIELD FIELDID="' +fieldName.split('_')[0] +'" FIELDTECHNAME="' +this.fieldTechNames.get(fieldName.split('_')[0]) +'"/>' +
									'<I_REPORTID>' +
										this.reportId +
									'</I_REPORTID>' +
									'<SEARCH_PATTERN />' +
									'</PARAM>' +
									'</EWS>';
							
						var options = {
							timeout: 500,
							showEverythingOnButtonClick: false,
							templateResult: '#{text}',
							minChars: 0,
							//added june 26 2010
							xmlToSend: xmlin,
							searchWithService: true,
							url: this.parent.url,
							method: this.parent.method,
							events: $H({//onGetNewXml: 'EWS:REPT_autocompleterGetNewXml',
	                                    onResultSelected: 'EWS:REPT_autocompleterResultSelected'})							
						};
					}else{
	                    var options = {
	                            timeout: 500,
	                        minChars: 0,
	                        showEverythingOnButtonClick: true,
	                        templateResult: '#{text}',
							events: $H({//onGetNewXml: 'EWS:REPT_autocompleterGetNewXml',
	                                    onResultSelected: 'EWS:REPT_autocompleterResultSelected'})
	                    };							
					}
										
					//neil new options
/*
                    var options = {
                        timeout: 500,
                        showEverythingOnButtonClick: true,
                        templateResult: '#{text}',
						events: $H({//onGetNewXml: 'EWS:REPT_autocompleterGetNewXml',
                                    onResultSelected: 'EWS:REPT_autocompleterResultSelected'})
                    };	
*/				
									
                    var autoComplete = new JSONAutocompleter(fieldName + this.indicators.get('value'), options, json);

                    this.selectionValues.set(fieldName, {
                        type: 'AUTOCOMP',
                        object: autoComplete,
                        length: length,
                        error: false,
                        lineError: false,
                        mandatory: Mandatory
                    });
				
                } else {
                    if (length > 0)
                    //since 24/03/2010 - Set the style in a class
                        var input = new Element('input', {
                            'type': 'text',
                            'value': value.id,
                            'maxlength': length,
                            'class': 'Rept_formTextFile'
                        });
                    else
                    //since 24/03/2010 - Set the style in a class                
                        var input = new Element('input', {
                            'type': 'text',
                            'value': value.id,
                            'class': 'Rept_formTextFile'
                        });
                    div.insert(input);
                    this.selectionValues.set(fieldName, {
                        type: type,
                        object: input,
                        length: length,
                        error: false,
                        lineError: false,
                        oldValue: null,
                        mandatory: Mandatory
                    });
				}
            }
		
        },

        addMultiSelect: function(fieldName, possibleValues, values, type, length, HTMLContent, searchHelpAvailable, Mandatory) {
            var div = new Element('div', {
                'id': fieldName + this.indicators.get('value'),
                'class': 'Rept_formLineItem'
            });
		
            HTMLContent.insert(div);

            var json = {
                autocompleter: {
                    object: new Array()
                }
            };

            values = objectToArray(values);
            values = values.reject(function(item) { return (Object.isEmpty(item.id) || item.id === '') });

            var new_object = {};
            /*if (possibleValues.length == 0 || values.length == 0) {
            //the case that we have a variant but it is not filled the possible values
            new_object.data = value.id;
            try {
            new_object.text = global.getEmployee(value.id).name;
            }
            catch (e) {
            new_object.text = new_object.text = value.text;
            }
			
            new_object.def = 'X';
            json.autocompleter.object.push(new_object);
            new_object = {};
            var myMultiSelect = new MultiSelect(fieldName + this.indicators.get('value'), {
            autocompleter: {
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateResult: '#{text}',
            maxShown: 5,
            minChars: 1
            }
            }, json);
            var data = new Hash();
            data.set('data', value.id);
            try {
            data.set('text', global.getEmployee(value.id).name);
            }
            catch (e) {
            data.set('text', value.text);
            }
            data.set('def', 'X');
            myMultiSelect.createBox(data);
            myMultiSelect.removeElementJSON(data, false);
            }
            else {*/
            //Special case for PERNR
            if (possibleValues.length === 0) {
                for (var i = 0; i < values.length; ++i) {
                    new_object.data = values[i].id;
                    try {//the use of try catch is not recommended,slows the webpage
                        new_object.text = global.getEmployee(values[i].id).name;
                    }
                    catch (e) {
                        new_object.text = values[i].text;
                    }

                    json.autocompleter.object.push(new_object);
                    new_object = {};
                }
            } else {
                for (var i = 0; i < possibleValues.length; ++i) {
                    new_object.data = possibleValues[i]['@tag'];
                    if (!Object.isEmpty(possibleValues[i]['#text']))
                        new_object.text = possibleValues[i]['#text'];
                    else
                        new_object.text = possibleValues[i]['@tag'];

                    json.autocompleter.object.push(new_object);
                    new_object = {};
                }
            }


            var myMultiSelect = new MultiSelect(fieldName + this.indicators.get('value'), {
                autocompleter: {
                    showEverythingOnButtonClick: true,
                    timeout: 5000,
                    templateResult: '#{text}',
                    maxShown: 5,
                    minChars: 0
                }
            }, json);

            values.each(function(item) {
                myMultiSelect.addBoxByData(item.id);
            }, this);

            for (var i = 0; i < possibleValues.length; ++i) {
                var data = new Hash();
                data.set('data', possibleValues[i]['@tag']);
                if (!Object.isEmpty(possibleValues[i]['#text']))
                    data.set('text', possibleValues[i]['#text']);
                else
                    data.set('text', possibleValues[i]['@tag']);
                values.each(function(val) {
                    if (val.id == possibleValues[i]['@tag'] && val.text == possibleValues[i]['#text'])
                        data.set('def', 'X');
                }, this);

                var box = myMultiSelect.createBox(data);
                myMultiSelect.removeElementJSON(data, false);
                myMultiSelect.removeBox(box, data);
            }
            //myMultiSelect.defaultBoxes();
            //}
			
			/*
			 * 
			 * note
			 * selection values here
			 */
			
            this.selectionValues.set(fieldName, {
                type: 'MULTI',
                object: myMultiSelect,
                length: length,
                error: false,
                lineError: false,
                oldValue: null,
                mandatory: Mandatory
            });

            return myMultiSelect;
        },
        /**
        *@description Add the content of the button that allows to add employees from left menu
        *@param (Object) the multiselect object that is associated with this button  
        */
        addButton: function(multiSelect) {
            if (!this.visibleOnly) {
                //We want also to add the selected Employees from My Selections with this button
                //draw the CREATE BUTTON
                var createButton = "<div class='OM_costCenter_createButton' id='OM_costCenterB'></div> ";
                //insert it in the div                        
                //this.virtualHtml.down('div#OM_costCenter_Date').insert(createButton);
                div.insert(createButton);
                var json = {
                    elements: []
                };
                var auxCreate = {
                    label: global.getLabel('add_my_selection'),
                    idButton: 'OM_costCenter_createButton',
                    className: 'application_action_link Rept_link_button',
                    handlerContext: null,
                    handler: this._addMySelection.bind(this, multiSelect),
                    type: 'link',
                    standardButton: true
                };
                json.elements.push(auxCreate);
                var ButtonCreateCostCenter = new megaButtonDisplayer(json);
                div.insert(ButtonCreateCostCenter.getButtons());
            } else {

            }
        },

        /**
        *@description Add the content of the selection screen line to allow the user to fill in a value.
        *				This value could has a radio button shape.
        *@param {String} fieldName 		Name of the field to add in the selection screen.
        *@param {String} radbutton_group 	Group that contains the radio button.
        *@param {Object} value  			Contains the default value.
        *@param {Element} HTMLContent  	Element that has to contain the field.
        */
        addRadioItem: function(fieldName, radbutton_group, value, HTMLContent) {

            if (radbutton_group == null)
                radbutton_group = 'bhou';
            var div = new Element('div', {
                'id': fieldName + this.indicators.get('radio'),
                'class': 'Rept_formRadioItem'
            });
            HTMLContent.firstDescendant().insert({ before: div });

            var radio = new Element('input', {
                'type': 'radio',
                'name': radbutton_group,
                'value': fieldName
            });
            div.insert(radio);

            // If there is a default value=> select the radio button
            if (!Object.isEmpty(value) && value == 'X')
                radio.writeAttribute('checked', true);

            //For visible only => disable the field          
            if (this.visibleOnly) {
                radio.writeAttribute('disabled', true);
                div.setStyle({
                    marginTop: '0px'
                });
            }
            else
                this.selectionValues.set(fieldName, {
                    type: 'RADIO',
                    object: radio,
                    error: false,
                    lineError: false
                });
        },
		
		
		/*
		 * 
		 * retrieves the values for the selection
		 * 
		 */
        getMultiSelectValues: function(multiselect) {
            var fieldName = multiselect;
			
            fieldName = fieldName.sub(this.indicators.get('low'), '');
            fieldName = fieldName.sub(this.indicators.get('high'), '');
            this.currentLoading.set(fieldName, fieldName);
            this.parent.getSearchHelpValues(fieldName, $A(), '*');
        },

        getSHValues: function(event) {
            var args = getArgs(event);
		
            var fieldName = args.idAutocompleter.sub(this.indicators.get('value'), '');
            var selVal = this.selectionValues.get(fieldName);
            var fieldVal = this.getItemSapValue(selVal.type, selVal.object);
            // Update the oldValue or do nothing
            if (fieldVal === selVal.oldValue) return;
            selVal.oldValue = fieldVal;
            this.selectionValues.set(fieldName, selVal);
            fieldName = fieldName.sub(this.indicators.get('low'), '');
            fieldName = fieldName.sub(this.indicators.get('high'), '');
            this.parent.getSearchHelpValues(fieldName, $A(), fieldVal);
        },

        updateSH: function(json) {
            this.currentLoading.each(function(current) {
                var autoCompJson = {
                    autocompleter: {
                        object: new Array()
                    }
                };
                var new_object = {};
                var isRes = json.EWS.o_records_found;
                if (isRes == 0) {
                    new_object.data = 'No_id';
                    autoCompJson.autocompleter.object.push(new_object);
                } else {
                    var values = objectToArray(json.EWS.o_values.item);
                    values.each(function(value) {
                        new_object.data = value['@id'];
                        if (!Object.isEmpty(value['@value']))
                            new_object.text = value['@value'];
                        else
                            new_object.text = value['@id'];

                        if (Object.isEmpty(new_object.data))
                            new_object.data = 'No_id';

                        autoCompJson.autocompleter.object.push(new_object);
                        new_object = {};
                    } .bind(this));
                }
                this.selectionValues.get(current.value).object.updateInput(autoCompJson);
            } .bind(this));
        },

        getSelectionValue: function(fieldname) {
            var selectValue = null;
            selectValue = this.selectionValues.get(fieldname);
            if (!Object.isEmpty(selectValue)) return { name: fieldname, value: selectValue };
            selectValue = this.selectionValues.get(fieldname + this.indicators.get('low'));
            if (!Object.isEmpty(selectValue)) return { name: fieldname + this.indicators.get('low'), value: selectValue };
            selectValue = this.selectionValues.get(fieldname + this.indicators.get('high'));
            if (!Object.isEmpty(selectValue)) return { name: fieldname + this.indicators.get('high'), value: selectValue };
            return false;
        },

        /**
        *@description Add or remove the error style for the indicated field in the form. 
        *				The same indication is also written in the list of values to get it easily.
        *				The error state is changed only if there is a change with previous state.
        *@param {String} fieldId  Id of the field to set as an error
        *@param {String} type  Indicate if the field is a date, a time, a char or a int
        *@param {Boolean} error  Indicate if the error is to add or to remove
        *@param {Boolean} lineError  Indicate if there is an error on the line (high value smaller than the low one)
        */
        itemSetError: function(fieldId, type, error, lineError) {
            var fieldName = fieldId;
            var field = this.selectionValues.get(fieldId);

            // If there is an error to update, but it is the same as the old
            // one => return
            if (error == field.error)
                error = null;
            // If there is a line error to update, but it is the same as the
            // old one => return
            if (lineError == field.lineError)
                lineError = null;

            // If there is no given error value => return
            if (error == null && lineError == null)
                return;

            switch (type) {
                case 'DATE':
                    fieldName = fieldName.concat(this.indicators.get('date'));
                    var element = $(fieldName).up().firstDescendant();
                    break;
                case 'TIME':
                    fieldName = fieldName.concat(this.indicators.get('time'));
                    var element = $(fieldName).up().firstDescendant();
                    break;
                case 'MULTI':
                    fieldName = fieldName.concat(this.indicators.get('value'));
                    var element = $(fieldName);
                    break;
                default:
                    fieldName = fieldName.concat(this.indicators.get('value'));
                    var element = $(fieldName).firstDescendant().firstDescendant();
                    break;
            }

            if (error === true) {
                element.addClassName('Rept_application_autocompleter_box');
                field.error = true;
            } else if (error === false) {
                if (field.lineError === false)
                    element.removeClassName('Rept_application_autocompleter_box');
                field.error = false;
            }

            if (lineError === true) {
                element.addClassName('Rept_application_autocompleter_box');
                field.lineError = true;
            } else if (lineError === false) {
                if (field.error === false)
                    element.removeClassName('Rept_application_autocompleter_box');
                field.lineError = false;
            }
        },

        /**
        *@description insert a Red Error information Box.
        *@param {String} text, text line to represent in the error box
        */
        showRedErrorMessage: function(text) {
            //if is not already created the box
            if (!$('RedBoxError')) {
            var div = new Element('div', {
                'id': 'RedBoxError',
		'class': 'RedBoxError'
            });
            div.insert(new Element('span', {
                'id': 'spanRedError',
		'class': 'application_main_error_text'
            }).update('Error Information'));
            var box = new Element('div', {
                'id': 'borderRedError',
		'class': 'Rept_application_box'
            });

                box.insert(new Element('div', {
                    'id': 'textRedError',
                    'class': 'RedBoxError'
                }).update(text));

            div.insert(box);
                this.htmlContent.insert(div);
            }
            else {
                var box = $('borderRedError');
                box.insert(new Element('div', {
                    'id': 'textRedError',
                    'class': 'RedBoxError'
                }).update(text));
            }
        },

        /**
        *@description remove a Red Error information Box.        
        */
        removeRedErrorMessage: function(text) {
            var errorBox = $('RedBoxError');
            if (errorBox) {
                errorBox.remove();
            }
        },

        /**
        * @description Loop on each screen field to check if there are
        *              valid.
        */
        checkSelectionScreen: function() {
            //        this.selectionValues.each(this.checkScreenItem.bind(this));
        },

        /**
        *@description Add the content of the selection screen line to allow the user to fill in a value.
        *@param {Array} value  The element to check with its name (in [0]) and its json content(in [1]).
        */
        checkScreenItem: function(value) {
            // Get the value of the field
            var itemValue = this.getItemValue(value[1].type, value[1].object);
            //Check if its a mandatory field
            if (value[1].mandatory && (Object.isEmpty(itemValue) || itemValue == "")) {
                //
                switch (value[1].type) {
                    case 'DATE':
                        try {
                            var textField = $(value[0].concat(this.indicators.get('line'))).firstDescendant().innerHTML;
                        }
                        catch (e) {
                            var textField = "Date";
                        }
                        break;
                    case 'TIME':
                        var textField = $(value[0].concat(this.indicators.get('line'))).firstDescendant().innerHTML;
                        break;
                    default:
                        var textField = $(value[0].concat(this.indicators.get('value'))).up().firstDescendant().innerHTML;
                        break;
                }
                this.showRedErrorMessage(global.getLabel('the') + ' "' + textField + '" ' + global.getLabel('field_is_mandatory'));
                this.itemSetError(value[0], value[1].type, null, true);
            }
            else {
                this.itemSetError(value[0], value[1].type, null, false);
            }
            var hasError = false;
            if (value[1].type == 'CHECK' || value[1].type == 'RADIO') return;
            // If it is the low part of a range, check if it is
            // smaller than the high one.
            if (this.checkIsRangePart(value[0], 'low', true)) {
                // Get the value of the other range extremity
                var itemValueHigh = this.getRangeOtherValue(value[0], 'low');
                if (itemValueHigh) {
                    if (!Object.isEmpty(itemValueHigh.get('value')) &&
            		(itemValueHigh.get('jsValue') < this.getItemJsValue(value[1].type, value[1].object))) {
                        this.itemSetError(value[0], value[1].type, null, true);
                        this.itemSetError(itemValueHigh.get('name'), value[1].type, null, true);
                        var textField = $(itemValueHigh.get('name').concat(this.indicators.get('value'))).up().firstDescendant().innerHTML;
                        this.showRedErrorMessage(global.getLabel('the_entries_for') + ' "' + textField + '" ' + global.getLabel('error_low_value'));
                    } else if (!value[1].mandatory) {
                        this.itemSetError(value[0], value[1].type, null, false);
                        this.itemSetError(itemValueHigh.get('name'), value[1].type, null, false);
                    }
                }
                // If it is the high part of a range, check if it is
                // bigger than the low one.
            } else if (this.checkIsRangePart(value[0], 'high', true)) {
                // Get the value of the other range extremity
                var itemValueLow = this.getRangeOtherValue(value[0], 'high');
                if (!Object.isEmpty(itemValue) &&
            		(itemValueLow.get('jsValue') > this.getItemJsValue(value[1].type, value[1].object))) {
                    this.itemSetError(value[0], value[1].type, null, true);
                    this.itemSetError(itemValueLow.get('name'), value[1].type, null, true);
                    var textField = $(itemValueLow.get('name').concat(this.indicators.get('value'))).up().firstDescendant().innerHTML;
                    this.showRedErrorMessage(global.getLabel('the_entries_for') + ' "' + textField + '" ' + global.getLabel('error_high_value'));
                } else if (!value[1].mandatory) {
                    this.itemSetError(value[0], value[1].type, null, false);
                    this.itemSetError(itemValueLow.get('name'), value[1].type, null, false);
                }
            }
            if (!Object.isEmpty(itemValue)
        		&& ((value[1].type == 'I' && !itemValue.match(this.intRegExp))
        			|| (value[1].type == 'F' && !itemValue.match(this.floatRegExp))
        			|| ((value[1].type == 'N' || value[1].type == 'P') && !itemValue.match(this.decRegExp))
					))
                this.itemSetError(value[0], value[1].type, true, null);
            else
                this.itemSetError(value[0], value[1].type, false, null);
        },

        /**
        *@description Check if a given field name is part of a range.
        *@param {String} fieldName  Name of the original field.
        *@param {String} highOrLow  Is the check to see if it is the 'high' or the 'low' part of the range.
        *@returns Boolean
        */
        checkIsRangePart: function(fieldName, highOrLow, withBegda) {
            if (fieldName.endsWith(this.indicators.get(highOrLow)) ||
            (highOrLow === 'low' && (fieldName === 'PNPBEGDA' || fieldName === 'PCHBEGDA') && withBegda === true) ||
            (highOrLow === 'high' && (fieldName === 'PNPENDDA' || fieldName === 'PCHENDDA') && withBegda === true))
                return true;
            else
                return false;
        },

        /**
        *@description Get the name and the value of the other member of the range as the name
        *				without the range indicator and the value as it should be in SAP.
        *@param {String} fieldName  Name of the original field.
        *@param {String} highOrLow  Is the original element 'high' or 'low'.
        *@returns Hash
        */
        getRangeOtherValue: function(fieldName, highOrLow) {
            var otherName;
            var neutralName;

            switch (fieldName) {
                case 'PNPBEGDA':
                    otherName = 'PNPENDDA';
                    break;
                case 'PCHBEGDA':
                    otherName = 'PCHENDDA';
                    break;
                case 'PNPENDDA':
                    otherName = 'PNPBEGDA';
                    break;
                case 'PCHENDDA':
                    otherName = 'PCHBEGDA';
                    break;
                default:
                    if (highOrLow === 'low')
                        var otherHighLow = 'high';
                    else
                        var otherHighLow = 'low';

                    var lengthChar = fieldName.length - this.indicators.get(highOrLow).length;
                    neutralName = fieldName.substr(0, lengthChar);
                    otherName = neutralName.concat(this.indicators.get(otherHighLow));
                    break;
            }

            var itemOther = this.selectionValues.get(otherName);
            if (Object.isEmpty(itemOther)) return false; //if there is no item other return false
            return $H({
                'name': otherName,
                'value': this.getItemValue(itemOther.type, itemOther.object),
                'nameWithoutLowHigh': neutralName,
                'sapValue': this.getItemSapValue(itemOther.type, itemOther.object, itemOther.length),
                'jsValue': this.getItemJsValue(itemOther.type, itemOther.object)
            });
        },
        /**
        * @description Check if a field is error based on the fieldname
        * @param {String} fieldname
        * @returns boolean
        */
        getIfError: function(fieldname) {
            var selValue = this.getSelectionValue(fieldname);
            if (selValue.value.error === true || selValue.value.lineError === true)
                return true;
            else return false;
        },
        /**
        *@description Check if there are errors in the form.
        */
        getIfErrros: function() {
            var hasError = false;
            this.selectionValues.each(function(value) {
                if (value[1].error === true || value[1].lineError === true)
                    hasError = true;
            } .bind(this));
            return hasError;
        },

        /**
        * @description Convert a float with a SAP format to a format that
        *              fit the user settings.
        * @returns String
        */
        floatSapToDisplay: function(floatSap) {
            var number = floatSap.split('.');
            var newIntPart = '';
            var tmpInt = '';
            while (number[0].length > 3) {
                tmpInt = number[0].substr(number[0].length - 3);
                number[0] = number[0].substr(0, number[0].length - 3)
                newIntPart = global.thousandsSeparator + tmpInt
				+ newIntPart;
            }
            newIntPart = number[0] + newIntPart;
            if (Object.isEmpty(number[1]))
                return newIntPart;
            else
                return newIntPart + global.commaSeparator + number[1];
        },

        /**
        *@description Convert a float with a display with the user settings to a sap format.
        *@returns String
        */
        floatDisplayToSap: function(floatDisplay) {
            var regexpThous = new RegExp(global.thousandsSeparator.gsub(
			/\.{1}/, function(match) {
			    return '\\' + match[0]
			}) + '{1}');
            var regexpComma = new RegExp(global.commaSeparator.gsub(
			/\.{1}/, function(match) {
			    return '\\' + match[0]
			}) + '{1}');

            return floatDisplay.gsub(regexpThous, '').sub(regexpComma, '.');
        },

        /**
        *@description Convert a number with decimals from SAP to display format.
        *@returns String
        */
        numberSapToDisplay: function(sapNumber) {
            return sapNumber.gsub('.', global.commaSeparator);
        },

        /**
        *@description Convert a number with decimals from display to SAP format.
        *@returns String
        */
        numberDisplayToSap: function(displayNumber, length) {
            if (Object.isEmpty(displayNumber))
                return '';
            var sapNumber = displayNumber.gsub(global.commaSeparator, '.');
            if (sapNumber.length < length)
                sapNumber = '0'.times(length - sapNumber.length) + sapNumber;
            return sapNumber;
        },

        /**
        *@description Convert a time with decimals from SAP to display format.
        *@returns String
        */
        sapTimeToDisplay: function(sapTime) {
            var date = new Date();
            date.setHours(sapTime.substr(0, 2));
            date.setMinutes(sapTime.substr(2, 2));
            date.setSeconds(sapTime.substr(4, 2));
            return date.toString(global.hourFormat);
        },

        /**
        * @description Display the time from a Date object to the display format
        * @param {Date} Date to write
        */
        objectTimeToDisplay: function(date) {
            return date.toString(global.hourFormat);
        },

        /**
        * @description Get the list of values in the screen with the format
        *              [{fieldName: fieldName selection: rangeOrSingle
        *              lowValue: LowValue highValue: HighValue}]
        * @returns Array
        */
        getListValues: function() {
            var values = $H();
            this.selectionValues.each(function(value) {
                var valObject = {};
                // Remove the low or high indication if it is present
                if (this.checkIsRangePart(value[0], 'low', false)) {
                    valObject.selection = 'range';
                    var otherValue = this.getRangeOtherValue(value[0], 'low');
                    valObject.lowValue = this.getItemSapValue(
						value[1].type, value[1].object,
						value[1].length);
                    valObject.highValue = otherValue.get('sapValue');
                    valObject.fieldname = otherValue.get('nameWithoutLowHigh');
                    //we need highvalue description and lowvalue description
                    valObject.descriptionHigh = this.getItemText(value[1].type, this.selectionValues.get(otherValue.get('name')).object, valObject.highValue);
                    valObject.descriptionLow = this.getItemText(value[1].type, value[1].object, valObject.lowValue);
                    values.set(valObject.fieldname, valObject);
                } else if (this.checkIsRangePart(value[0], 'high', false)) {
                } else {
                    valObject.selection = 'single';
                    valObject.lowValue = this.getItemSapValue(
						value[1].type, value[1].object,
						value[1].length);
                    valObject.highValue = null;
                    valObject.fieldname = value[0];
                    valObject.description = this.getItemText(value[1].type, value[1].object, valObject.lowValue);
                    values.set(valObject.fieldname, valObject);
                }
            }, this);
			
            return values;
        },

        /**
        *@description Retrieve text data from the object on the screen depending on the given type.
        *@param {String} type  Kind of element used to store the value
        *@param {Object} object  Object used to store values
        *@returns Array of String
        */
        getItemText: function(type, object, selectedItem) {
            var result = [];
            switch (type) {
                case 'DATE':
                    result.push(object.actualDate);
                    return result;
                case 'TIME':
                    object.addZero();
                    result.push(object.getSapTime());
                    return result;
                case 'AUTOCOMP':
                    //lets watch what is the index of the selectedItem
                    var selected = object.getValue();
                    if (!selected) {
                        return '';
                    }
                    else if (Object.isEmpty(selected.textAdded)) {
                        return selected.idAdded;
                    }
                    else {
                        return selected.textAdded;
                    }
                case 'CHECK':
                case 'RADIO':
                    result.push(object.checked);
                    return result;
                case 'MULTI':
                    var selected = object.getSelected();
                    selected.each(function(select) { result.push(select._object.text); });
                    return result;
                default:
                    result.push(selectedItem);
                    return result;
            }
        },


        /**
        *@description Retrieve data from the object on the screen depending on the given type.
        *@param {String} type  Kind of element used to store the value
        *@param {Object} object  Object used to store values
        *@returns String
        */
        getItemValue: function(type, object) {
            switch (type) {
                case 'DATE':
                    return object.actualDate;
                case 'TIME':
                    object.addZero();
                    return object.getSapTime();
                case 'AUTOCOMP':
                    var selected = object.getValue();
                    if (!selected)
                        return '';
                    else if (Object.isEmpty(selected.idAdded))
                        return selected.textAdded;
                    else
                        return selected.idAdded;
                case 'CHECK':
                case 'RADIO':
                    return object.checked;
                case 'MULTI':
                    var selected = object.getSelected();
                    var returnedValues = "";
                    selected.each(function(select) { returnedValues += select._object.data + ','; });
                    return returnedValues;
                default:
                    return object.value;
            }
        },

        /**
        *@description Retrieve data from the object on the screen and set it to JS default format.
        *				It is mainly to transform numbers.
        *@param {String} type  Kind of element used to store the value
        *@param {Object} object Object used to store values
        *@returns Any
        */
        getItemJsValue: function(type, object) {
            var value = this.getItemValue(type, object);
            switch (type) {
                case 'I':
                    return new Number(value);
                case 'N':
                case 'P':
                    return new Number(this.numberDisplayToSap(value, value.length));
                case 'F':
                    return new Number(this.floatDisplayToSap(value));
                default:
                    return value;
            }
        },

        /**
        *@description Retrieve data from the object on the screen and set it to SAP format.
        *@param {String} type  Kind of element used to store the value
        *@param {Object} object Object used to store values
        *@returns String
        */
        getItemSapValue: function(type, object, length) {
            var value = this.getItemValue(type, object);
            switch (type) {
                case 'DATE':
                    if (!Object.isEmpty(value))
                        return value.toString('yyyyMMdd');
                    else
                        return '00000000';
                case 'P':
                case 'N':
                    return this.numberDisplayToSap(value, length);
                case 'F':
                    return this.floatDisplayToSap(value);
                case 'CHECK':
                case 'RADIO':
                    if (value == true)
                        return 'X';
                    else
                        return '';
                default:
                    return value;
            }
        }
    });

var Reporting = Class.create(Reporting_standard, {
    initialize: function($super, appName) {
        $super(appName);
    },
    run: function($super, mode) {
        $super(mode);
    },
    close: function($super) {
        $super();
    }
});

var PA_Reporting_standard = Class.create(Reporting, {
    initialize: function($super, args) {
        $super(args);
    },
    run: function($super, args) {
        $super(args);
    }
});

var PA_Reporting = Class.create(PA_Reporting_standard, {
    initialize: function($super) {
        $super('PA_Reporting');
    },
    run: function($super) {
        $super("WA_ED");
    }
});

var Time_Reporting_standard = Class.create(Reporting, {
    initialize: function($super, args) {
        $super(args);
    },
    run: function($super) {
        $super('WA_PT');
    }
});

var Time_Reporting = Class.create(Time_Reporting_standard, {
    initialize: function($super) {
        $super("Time_Reporting");
    },
    run: function($super) {
        $super();
    }
})

var Pay_Reporting_standard = Class.create(Reporting, {
    initialize: function($super, args) {
        $super(args);
    },
    run: function($super) {
        $super('WA_PAY');
    }
});

var Pay_Reporting = Class.create(Pay_Reporting_standard, {
    initialize: function($super) {
        $super('Pay_Reporting');
    },
    run: function($super) {
        $super();
    }
});

var PFM_Reporting_standard = Class.create(Reporting, {
    initialize: function($super, args) {
        $super(args);
    },
    run: function($super) {
        //       $super("PFM_REP");
        //		BUG #3894
        $super("TM_PFM");
    }
});


var PFM_Reporting = Class.create(PFM_Reporting_standard, {
    initialize: function($super) {
        $super("PFM_Reporting");
    },
    run: function($super) {
        $super();
    },
    close: function($super) {
        $super();
    }
});

var OM_reporting_standard = Class.create(Reporting, {
    initialize: function($super, args) {
        $super(args);
    },
    run: function($super, args) {
        $super(args);
    },
    close: function($super) {
        $super();
    }
});

