/*
*@fileoverview inbox.js
*@description This file keeps the new INBOX2.0 Application, which functionality is related to
*the class INBOX
*/

/*
*@class INBOX
*@description INBOX handler class
*@inherit Application
*/

var INBOX = Class.create(Application, {
    /**
    *@type String
    *@description Text used to filter entries in inbox items
    */
    textSearch: '',
    /**
    *@type String
    *@description Default text to place in boxes to add comments
    */
    defCommentText: '',
    /**
    *@type String
    *@description Value to place in fields without values
    */
    emptyField: '',
    /**
    *@type Number
    *@description Minimum number of lines to show the upper buttons
    */
    showUpSubmitButtonsNumber: 20,
    /**
    *@type String
    *@description Code used to indicate an approval
    */
    approveCode: null,
    /**
    *@type String
    *@description Code used to indicate a reject
    */
    rejectCode: null,
    /**
    *@type inboxTable
    *@description TableKit, is going to manage html where are shown the inbox tasks, the insertion,
    *deletion etc,
    */
    table: null,
    /**
    *@type Hash 
    *@description Hash is going to keep the same information that keeps the table attribute, but
    *much easier to access and use in general. We read xml from the back-end and store it completely
    *in this attribute
    */
    data: $H({}),

    SCMdata: $H({}),
    /**
    *@type Hash 
    *@description Hash where are kept all the selected tasks on the table
    */
    selectedRows: $H({}),
    /**
    *@type Long 
    *@description Actual number of tasks in the table
    */
    numberOfRows: 0,
    /**
    *@type Long 
    *@description Actual number of visible tasks in the table
    */
    visibleRows: 0,

    numberOfSCMRows: 0,

    visibleSCMRows: 0,
    /**
    *@type boolean
    *@description represents if the teamCalendar left menuItem it is visible or not
    */
    teamCalendarShown: false,
    /**
    *@type Date 
    *@description Actual date selected on the begda Calendar Object(on the left at the interface)
    */
    type: null,
    /**
    *@type Long 
    *@description To handle where to show the table
    */
    numberOfRequests: 0,

    /**
    *@type Object 
    *@description List of event handlers linked to the current object
    */
    bindings: null,

    /**
    *@type Boolean 
    *@description Indicate if we are in the details screen
    */
    inDetails: false,

    /**
    *@type String 
    *@description Label to indicate that there are no items
    */
    noTaskLabel: null,

    /**
    *@type Hash 
    *@description List of the buttons from id
    */
    buttons: null,

    subAppOpened: false,

    /**
    * @type Element
    * @description Divs for the "Pending Request" title part and the "Task" title
    */

    pendingContentDiv: null,
    taskTitleDiv: null,

    /**
    * @type Element
    * @description Div containing all the fields needed for reply
    */

    replyFieldsDiv: null,

    /**
    * @type Hash
    * @description Possible document types
    */

    docTypes: null,
    sendViaTypes: null,

    /**
    * Divs to store buttons for several screens
    */

    generalButtonsDiv: null,
    buttonsToApproveDiv: null,
    buttonsNotToApproveDiv: null,

    /*
    * Files that will be uploaded when a request is submitted
    */

    filesToBeUploaded: null,

    /*
    * Document types autocompleter
    */

    docTypeAutoComp: null,

    /*
    * Parameters for the current request (Request and HRW Id)
    */

    req_id: null,
    hrwid: null,

    /*
    * Div containing the reply text (etext)
    */

    etext: null,

    /*
    * Div for the file to be uploaded
    */

    uploadModule: null,

    /*
    * Div for creating a new request
    */

    createNewReqDiv: null,

    /*
    * Autocompleters for Services and Service Groups
    */

    acServiceGroup: null,
    acService: null,

    /*
    * Details to be sent by the user
    */

    commentDetails: null,

    /*
    * Array containing the multiple replies, and link to show them
    */

    multipleReplies: null,
    historyLink: null,


    initialize: function($super, appName) {
        $super(appName);

        this.bindings = {};
        this.bindings.filterByType = this.filterByType.bindAsEventListener(this);
        this.bindings.filterByDate = this.filterByDate.bindAsEventListener(this);
        this.bindings.filterByDatePend = this.filterByDatePend.bindAsEventListener(this);
        this.bindings.selectAll = this.selectAll.bindAsEventListener(this);
        this.bindings.selectRow = this.selectRow.bindAsEventListener(this)
        this.bindings.showDetails = this.showDetails.bindAsEventListener(this);
        this.bindings.fillAC = this.fillServiceGroups.bindAsEventListener(this);
        this.bindings.serviceSelected = this.onServiceSelected.bindAsEventListener(this);
    },

    run: function($super) {
        $super();

        if (this.firstRun && this.virtualHtml.innerHTML === '') {
            this.defCommentText = global.getLabel("comment");
            this.approveCode = '0001';
            this.rejectCode = '0002';
            this.emptyField = '/';
            this.teamCalendarShown = false;
            this.inDetails = false;
            this.buttons = $H();
            this.setInitialHTML();

            //requesting SAP for the needed data to initialize the inbox application
            var serviceXML = '<EWS>'
    + '<SERVICE>GET_INBOX_LST</SERVICE>'
    + '<PARAM/>'
    + '</EWS>';

            this.makeAJAXrequest($H({
                xml: serviceXML,
                successMethod: 'buildInitialHTML'
            }));

            this.getPendReq();
        }

        //the employee selects one tasks type to be shown
        document.observe('EWS:autocompleter_resultSelected', this.bindings.filterByType);
        //the employee selects a correct date on one of the inbox filtering datePickers
        document.observe('EWS:datepicker_CorrectDate', this.bindings.filterByDate);
        document.observe('EWS:datepicker_CorrectDatePend', this.bindings.filterByDatePend);
        // the user flag the select/unselect all
        document.observe('EWS:applicationInbox_selectAll', this.bindings.selectAll);
        //The user flaged or unflaged a line
        document.observe('EWS:applicationInbox_rowSelected', this.bindings.selectRow);
        // The user selected a user to show details
        document.observe('EWS:applicationInbox_openTaskDetails', this.bindings.showDetails);
        // The autocompleter is loaded
        document.observe('EWS:applicationInbox_loadServices', this.bindings.fillAC);
        document.observe('EWS:applicationInbox_serviceSelected', this.bindings.serviceSelected);

        document.observe('keypress', function(event) {
            if (event.shiftKey == true && event.keyCode === 13) {
                alert('Last inbox version: ' + sapToDisplayFormat('2009-09-30'));
            }
        } .bind(this));
    },

    close: function($super) {
        $super();
        //that´s needed to properly handle this attribute
        this.teamCalendarShown = false;
        document.stopObserving('EWS:autocompleter_resultSelected', this.bindings.filterByType);
        document.stopObserving('EWS:datepicker_CorrectDate', this.bindings.filterByDate);
        document.stopObserving('EWS:datepicker_CorrectDatePend', this.bindings.filterByDatePend);
        document.stopObserving('EWS:applicationInbox_selectAll', this.bindings.selectAll);
        document.stopObserving('EWS:applicationInbox_rowSelected', this.bindings.selectRow);
        document.stopObserving('EWS:applicationInbox_openTaskDetails', this.bindings.showDetails);
        document.stopObserving('EWS:applicationInbox_loadServices', this.bindings.fillAC);
        document.stopObserving('keypress');
    },
    /**
    *@descriptionsimulate a close and reopen the application
    */
    refreshInbox: function() {
        this.close();
        var inboxTable = this.virtualHtml.down('[id=Inbox_resultsTable]');

        if (!Object.isEmpty(inboxTable))
            TableKit.unloadTable(inboxTable);

        var scmTable = this.virtualHtml.down('[id=SCM_resultsTable]');

        if (!Object.isEmpty(scmTable))
            TableKit.unloadTable(scmTable);

        this.virtualHtml.update('');
        this.firstRun = true;
        this.run();
    },

    //***************************************
    //Initialization
    //***************************************
    /**
    *@description builds the inital HTML for the inbox application, from the options got from the back-end
    */
    setInitialHTML: function() {
        // Place the inbox application in the HTML DOM
        var inbox = new Element('div', {
            'class': 'applicationInbox_content'
        });
        this.virtualHtml.insert(inbox);
        // Add tittle
        var taskTitle = new Element('div', {
            'class': 'applicationInbox_taskTittle application_main_title2'
        });
        taskTitle.insert(global.getLabel('taskDetail'));
        inbox.insert(taskTitle);
        this.taskTitleDiv = taskTitle;
        // Add the filter line
        var complexSearch = new Element('input', {
            'type': 'text',
            'class': 'application_autocompleter_box applicationInbox_search',
            'value': global.getLabel('search'),
            'id': 'applicationInbox_complexTextSearch'
        });

        var filterOption = new Element('span', {
            'class': 'application_action_link applicationInbox_toggleFilters',
            'id': 'applicationInbox_toggleFilters'
        }).update(global.getLabel('filterOptions'));

        var inboxUp = new Element('div', {
            'id': 'applicationInbox_up',
            'class': 'applicationInbox_form'
        });
        inboxUp.insert(filterOption);
        inboxUp.insert(complexSearch);

        //creating the refresh button
        var refreshButton = { elements: [] };
        var refButton = {
            label: global.getLabel('refresh'),
            idButton: 'applicationInbox_refreshButton',
            className: 'applicationInbox_refreshButtonCss',
            handlerContext: null,
            handler: this.refreshInbox.bind(this),
            type: 'button',
            standardButton: true
        }

        refreshButton.elements.push(refButton);
        var rButton = new megaButtonDisplayer(refreshButton);
        inboxUp.insert(rButton.getButtons());

        inbox.insert(inboxUp);

        // Add the filter options line 
        var inboxFilter = new Element('div', {
            'id': 'applicationInbox_filters'
        }).update("<div class='applicationInbox_form'>" +
				"<span id='applicationInbox_form_fromLabel' class='application_main_text'>" + global.getLabel("from") + "</span>" +
				"<div class='applicationInbox_form_calendar'>" +
				"<div id='applicationInbox_form_begCal'></div>" +
				"</div>" +
				"<span id='applicationInbox_form_toLabel' class='application_main_text'>" + global.getLabel("to") + "</span>" +
				"<div class='applicationInbox_form_calendar'>" +
				"<div id='applicationInbox_form_endCal'></div>" +
				"</div>" +
				"<span id='applicationInbox_form_eventsTypeLabel' class='application_main_text'>" + global.getLabel("type") + "</span>" +
				"<div class='applicationInbox_form_autocompleter'>" +
				"<div id='applicationInbox_form_eventTypesSelect'></div>" +
				"</div>" +
		"</div>");

        inbox.insert(inboxFilter);

        // Add the upper line for mass approval
        var inboxDown = new Element('div', {
            'id': 'applicationInbox_down',
            'class': 'applicationInbox_down'
        });
        inbox.insert(inboxDown);

        //Add the content table with messages
        var inboxContent = new Element('div', {
            'id': 'applicationInbox_results',
            'class': 'applicationInbox_down'
        })
        inboxDown.insert(inboxContent);

        // Add the downer line for mass approval
        var inboxDownDown = new Element('div', {
            'id': 'applicationInbox_submitButtonsDown',
            'class': 'applicationInbox_submitButtons'
        });

        commentDown = new Element('input', {
            'id': 'applicationInbox_commentsInput',
            'type': 'text',
            'size': '60px',
            'class': 'application_autocompleter_box applicationInbox_comments',
            'value': this.defCommentText
        });
        inboxDownDown.insert(commentDown);

        // Add button 'New HR Request'
        var mbNewReq;
        var jsonButton = { elements: [] };
        var auxButton = {
            label: global.getLabel('CREATEHRREQUEST'),
            idButton: 'applicationInbox_NewReqButton',
            className: '',
            handlerContext: null,
            handler: this.newReqButtonHandler.bind(this),
            type: 'button',
            standardButton: true
        }

        jsonButton.elements.push(auxButton);
        mbNewReq = new megaButtonDisplayer(jsonButton);

        inboxDownDown.insert(mbNewReq.getButtons());
        inboxDown.insert(inboxDownDown);

        var details = new Element('div', {
            'id': 'applicationInbox_downDetails',
            'class': 'applicationInbox_downDetails'
        });
        inbox.insert(details);
        inbox.insert(new Element('div', {
            'class': 'application_clear_line'
        }));

        //Add pending request div
        var pendReqContent = new Element('div', {
            'class': 'applicationInbox_pendContent'
        });
        //Pending request tittle
        var pendTitle = new Element('div', {
            'class': 'applicationInbox_taskTittle application_main_title2'
        }).insert(global.getLabel('pendReq'));
        pendReqContent.insert(pendTitle);

        this.pendingContentDiv = pendReqContent;
        this.pendingContentDiv.hide();

        //add the search and the filter options
        var complexSearchPend = new Element('input', {
            'type': 'text',
            'class': 'application_autocompleter_box applicationInbox_search',
            'value': global.getLabel('search'),
            'id': 'applicationInbox_complexTextSearchPend'
        });

        var filterOptionPend = new Element('span', {
            'class': 'application_action_link applicationInbox_toggleFilters',
            'id': 'applicationInbox_toggleFilters_pend'
        }).update(global.getLabel('filterOptions'));

        var pendUp = new Element('div', {
            'id': 'applicationInbox_up_pend',
            'class': 'applicationInbox_form'
        });
        pendUp.insert(filterOptionPend);
        pendUp.insert(complexSearchPend);

        pendReqContent.insert(pendUp);

        // Add the filter options line 
        var pendFilter = new Element('div', {
            'id': 'applicationInbox_filters_pend'
        }).update("<div class='applicationInbox_form'>" +
				"<span id='applicationInbox_form_fromLabel_pend' class='application_main_text applicationInboxSCM_labels'>" + global.getLabel("from") + "</span>" +
				"<div class='applicationInbox_form_calendar'>" +
				"<div id='applicationInbox_form_begCal_pend'></div>" +
				"</div>" +
				"<span id='applicationInbox_form_toLabel_pend' class='application_main_text applicationInboxSCM_labels'>" + global.getLabel("to") + "</span>" +
				"<div class='applicationInbox_form_calendar'>" +
				"<div id='applicationInbox_form_endCal_pend'></div>" +
				"</div>" +
				"<span id='applicationInbox_form_eventsTypeLabel_pend' class='application_main_text applicationInboxSCM_labels'>" + global.getLabel("type") + "</span>" +
				"<div class='applicationInbox_form_autocompleter'>" +
				"<div id='applicationInbox_form_eventTypesSelect_pend'></div>" +
				"</div>" +
		"</div>");

        pendReqContent.insert(pendFilter);

        // Div to create a new HR request
        this.createNewReqDiv = new Element('div', { 'id': 'applicationInbox_createNewReq' });
        this.createNewReqDiv.hide();
        inbox.insert(this.createNewReqDiv);

        //Pending request content
        var pendDown = new Element('div', {
            'id': 'applicationInbox_pendingDown'
        });
        pendReqContent.insert(pendDown);
        inbox.insert(pendReqContent);

        // this.buildDecisions({}, commentUp, 'up');

        this.buildDecisions({}, commentDown, 'down');

        //some events that have to be caught
        complexSearch.observe('keyup', this.fieldKeyUp.bindAsEventListener(this));
        complexSearchPend.observe('keyup', this.fieldKeyUp.bindAsEventListener(this));

        complexSearch.observe('blur', function() {
            if (complexSearch.value == '') complexSearch.value = global.getLabel('search');
        } .bindAsEventListener(this));
        complexSearchPend.observe('blur', function() {
            if (complexSearchPend.value == '') complexSearchPend.value = global.getLabel('search');
        } .bindAsEventListener(this));
        complexSearch.observe('focus', this.fieldFocus.bindAsEventListener(this));
        complexSearchPend.observe('focus', this.fieldFocus.bindAsEventListener(this));

        commentDown.observe('blur', function() {
            if (commentDown.value == '') commentDown.value = this.defCommentText;
        } .bindAsEventListener(this));

        commentDown.observe('focus', function() {
            commentDown.value = '';
        } .bindAsEventListener(this));

        filterOption.observe('click', function(event) {
            inboxFilter.toggle();
        } .bindAsEventListener(this));
        filterOptionPend.observe('click', function(event) {
            pendFilter.toggle();
        } .bindAsEventListener(this));

        //we show what has to be shown at firsts
        inboxUp.hide();
        pendUp.hide();
        inboxFilter.toggle();
        pendFilter.toggle();
        inboxDown.hide();
    },

    /**
    *@param {Object} json user inbox options...
    *@description Build the elements in the screen from backend information
    */
    buildInitialHTML: function(json) {
        if (json.EWS.o_list != null) {

            //the datePickers objects to filter the table by date  
            this.begDatePicker = new DatePicker('applicationInbox_form_begCal', {
                draggable: true,
                correctDateOnBlur: true,
                manualDateInsertion: true,
                events: $H({ correctDate: 'EWS:datepicker_CorrectDate' })                
            });
            this.endDatePicker = new DatePicker('applicationInbox_form_endCal', {
                draggable: true,
                correctDateOnBlur: true,
                manualDateInsertion: true,
                events: $H({ correctDate: 'EWS:datepicker_CorrectDate' })
            });
            this.begDatePicker.linkCalendar(this.endDatePicker);

            //the AutocompleteSearch object to filter the table by task Type
            var busids = $A();
            if (!Object.isEmpty(json.EWS.o_busid))
                busids = objectToArray(json.EWS.o_busid.yglui_str_inbox_busid);

            var autoComp = {
                autocompleter: {
                    object: new Array()
                }
            };

            autoComp.autocompleter.object.push({
                data: '',
                text: global.getLabel('noTypeSelection'),
                def: 'X'
            });

            busids.each(function(busid) {
                autoComp.autocompleter.object.push({
                    data: busid['@busid'],
                    text: busid['@bustx']
                });
            });

            this.typesAutocompleter = new JSONAutocompleter('applicationInbox_form_eventTypesSelect', {
                showEverythingOnButtonClick: true,
                timeout: 5000,
                templateOptionsList: '#{text}',
                events: $H({ 'onResultSelected': 'EWS:autocompleter_resultSelected' })
            }, autoComp);
        }
        //creating the inbox table Object
        var tableHead = {
            type: this.labels.get('TYPE'),
            description: global.getLabel('DESCRIPTION'),
            requestedBy: global.getLabel('REQUESTBY'),
            onBehalfOf: global.getLabel('BEHALF'),
            date: global.getLabel('Date')
        };

        this.table = new InboxTable('applicationInbox_results', tableHead, this);
        // Add the sorting on the date format if not exist
        if (Object.isEmpty(TableKit.Sortable.types.dateInbox))
            TableKit.Sortable.addSortType(
	    		new TableKit.Sortable.Type('dateInbox', {
	    		    pattern: new RegExp(global.dateFormat.gsub(/(\.{1}|\\{1})/, function(match) {
	    		        return '\\' + match[0]
	    		    }).gsub(/[dDmMyY]{1}/, '\\d')),
	    		    normal: function(value) {
	    		        var dateObj = Date.parseExact(value, global.dateFormat);
	    		        if (dateObj) return dateObj.valueOf();
	    		        else return '';
	    		    }
	    		})
	        );
        //has to be loaded by the sortable table class wrapper: TableKit
        var tableOptions = {};
        if (!Object.isEmpty(json.EWS.o_nitems))
            tableOptions.pages = json.EWS.o_nitems;

        TableKit.Sortable.init("Inbox_resultsTable", tableOptions);
        //hidding the No results found row
        this.table.hideSingleRow(0);
        //disabling buttons
        $A(this.virtualHtml.select('.applicationInbox_submitButtonsStyle')).each(function(button) {
            this.buttons.get(button.id).disable(button.id);
        } .bind(this));

        //requesting the employee tasks to SAP
        this.initializeTable(json);


    },

    /**
    *@param {Object} json user inbox options...
    *@param {Element} commentNode Element that contains the comment associated to the submit buttons to add
    *@param {String} id Identifier of the task to submit when clicking (if several => keep null)
    *@description Build the lists of buttons for mass approval
    */
    buildDecisions: function(json, commentNode, id) {
        var decisions = $A();
        var idButton;
        if (Object.isEmpty(json.EWS)) {
            decisions.push({
                '@decision_tx': global.getLabel('approve'), //this.labels.get('APPROVE'),
                '@decision_id': this.approveCode
            });
            decisions.push({
                '@decision_tx': global.getLabel('reject'), //this.labels.get('REJECT'),
                '@decision_id': this.rejectCode
            });
        } else if (Object.isEmpty(json.EWS.o_list) || Object.isEmpty(json.EWS.o_list.yglui_str_pending_list.req_decision))
            return;
        else {
            decisions = objectToArray(json.EWS.o_list.yglui_str_inbox_list.req_decision.yglui_str_inbox_decision);
            for (var i = 0; i < decisions.length; i++) {
                decisions[i]['@decision_tx'] = decisions[i]['@decision_tx'].toUpperCase();
            }
        }

        decisions.each(function(decision) {
            // Add the action in the upper form
            var json = {
                elements: []
            };
            idButton = 'megaButtonInbox_' + id + '_' + decision['@decision_id'];
            var aux = {
                label: global.getLabel(decision['@decision_tx']),
                handlerContext: null,
                handler: '',
                type: 'button',
                idButton: idButton,
                className: 'applicationInbox_submitButtonsStyle',
                standardButton: true
            };
            json.elements.push(aux);
            var ButtonInbox = new megaButtonDisplayer(json);

            this.buttons.set(idButton, ButtonInbox);

            commentNode.insert({
                before: ButtonInbox.getButtons()
            });
            if (id == null || id === 'up' || id === 'down')
                ButtonInbox.updateHandler(idButton, function() {
                    this.submitTasks(decision['@decision_id'], commentNode.getValue());
                } .bindAsEventListener(this));
            else
                ButtonInbox.updateHandler(idButton, function() {
                    this.submitTask(id, decision['@decision_id'], commentNode.getValue());
                } .bindAsEventListener(this));
        } .bind(this));

    },
    //***************************************
    //Requesting to SAP
    //***************************************
    /**
    *@param {String} action 0001 (Approve) or 0002 (Decline) 
    *@param {String} comments comments added to the 'Approve' or 'Decline' tasks action
    *@descriptions Send the selected action on the selected tasks to SAP
    */
    submitTasks: function(action, comments) {
        Framework_stb.showSemitransparent();
        var comment = comments.stripScripts().stripTags();
        var keys = '';
        this.selectedRows.each(function(element) {
            keys += '<YGLUI_STR_INBOX_REQ_ID REQ_ID="' + element.key + '"/>';
            this.data.get(element.key)[2].set('submittedAs', action);
        } .bind(this));

        var serviceXml = '<EWS>'
			+ '<SERVICE>GET_INBOX_LST</SERVICE>'
			+ '<PARAM>'
			+ '<I_ACTION>U</I_ACTION>'
			+ '<I_TEQ_ID>' + keys + '</I_TEQ_ID>'
			+ '<I_DEC_ID>' + action + '</I_DEC_ID>'
			+ '<I_COMMENT>' + comment + '</I_COMMENT>'
			+ '</PARAM>'
			+ '</EWS>';

        this.makeAJAXrequest($H({
            xml: serviceXml,
            successMethod: 'processRespondSubmitTasks'
        }));

    },
    /**
    *@param {String} id Task id
    *@param {String} action Number of the action that could be 0001(Approve), 0002(Decline) or any other task action
    *@param {String} comments Comments added to the task action
    *@description Send the selected action on the task to SAP
    */
    submitTask: function(id, action, comments) {
        Framework_stb.showSemitransparent();
        var comment = comments.stripScripts().stripTags();

        this.data.get(id)[2].set('submittedAs', action);
        var serviceXml = '<EWS>'
			+ '<SERVICE>GET_INBOX_LST</SERVICE>'
			+ '<PARAM>'
			+ '<I_ACTION>U</I_ACTION>'
			+ '<I_TEQ_ID><YGLUI_STR_INBOX_REQ_ID REQ_ID="' + id + '"/></I_TEQ_ID>'
			+ '<I_DEC_ID>' + action + '</I_DEC_ID>'
			+ '<I_COMMENT>' + comment + '</I_COMMENT>'
			+ '</PARAM>'
			+ '</EWS>';

        this.makeAJAXrequest($H({
            xml: serviceXml,
            successMethod: 'processRespondSubmitTasks'
        }));

    },

    //***************************************
    //Filters
    //***************************************
    /**
    *@param {String} key Key of the row of the table with inbox items 
    *@description Check if there are some filters applied on this row
    *@return Boolean
    */
    checkHasFilter: function(key, scm) {

        var data = (scm != "SCM") ? this.data : this.SCMdata;

        return (data.get(key)[2].get('filteredByType')
				|| data.get(key)[2].get('filteredByText')
				|| data.get(key)[2].get('filteredByDate'));
    },

    /**
    *@param {String} key Key of the row of the table with inbox items.
    *@param {String} type Indicate the type of filter to set.
    *@param {Boolean} value is the filter to set or remove.
    *@return Boolean
    *@description Set the value of the filter for the given row and indicate if there is a real
    * 				modification in the display status of the row. 
    */
    setHiddenReason: function(key, type, value, scm) {

        var hadFilters = this.checkHasFilter(key, scm);
        var data;
        var table;
        var rows;

        if (scm == "SCM") {
            data = this.SCMdata;
            table = this.SCMtable;
            rows = this.SCMtable.SCMrows;
        }
        else {
            data = this.data;
            table = this.table;
            rows = this.table.rows;
        }

        switch (type) {
            case 'type':
                data.get(key)[2].set('filteredByType', value);
                break;
            case 'text':
                data.get(key)[2].set('filteredByText', value);
                break;
            case 'date':
                data.get(key)[2].set('filteredByDate', value);
                break;
        }

        var haveFilters = this.checkHasFilter(key, scm);

        // If there are no more filters and the entry is hide => show it
        //	and the contrary
        if (haveFilters == rows.get(key).visible()) {
            if (haveFilters)
                table.hideSingleRow(key, scm);
            else
                table.showSingleRow(key, scm);
        }

        // Check if there global filter state changed
        return (hadFilters != haveFilters);
    },

    /**
    *@param {String} type Filter to apply on the type of request
    *@param {Date} beginDate Filter to apply on the begin date
    *@param {Date} endDate Filter to apply on the end date
    *@param {String} searchText Filter to apply on the description text
    *@description Limit the number of displayed entries in the inbox
    */
    applyFilters: function(type, beginDate, endDate, searchText, scm) {
        if (scm == "SCM") {
            var data = this.SCMdata;
            var visibleRows = this.visibleSCMRows;
            var table = this.SCMtable;
        }
        else {
            var data = this.data;
            var visibleRows = this.visibleRows;
            var table = this.table;
        }
        data.each(function(element) {
            // If there is a filter on the type
            if (type != null) {
                if (element.value[0] == type || type == '') {
                    if (this.setHiddenReason(element.key, 'type', false, scm))
                        visibleRows++;
                } else {
                    if (this.setHiddenReason(element.key, 'type', true, scm))
                        visibleRows--;
                }
            }

            // If there is a filter on date
            if (beginDate != null && endDate != null) {
                var date = Date.parseExact(element.value[2].get('date'), global.dateFormat);
                if (date.between(beginDate, endDate)) {
                    if (this.setHiddenReason(element.key, 'date', false, scm))
                        visibleRows++;
                } else {
                    if (this.setHiddenReason(element.key, 'date', true, scm))
                        visibleRows--;
                }
            }

            // If there is a filter on the text
            if (searchText != null) {
                if (element.value[1].include(searchText)) {

                    var selection = (!searchText.empty()) ?
                        this.getFilteredSelection(element, searchText, scm) : this.getSimpleSelection(element, scm);

                    if (scm != "SCM") {
                        // element.value[2] --> some json details
                        table.modifyRow(element.key, this.table.getTaskDetailsRow(element.value[2].get('pendr'), selection));
                    }
                    else
                        table.modifyRow(element.key, this.table.rowContentSCMTemplate.evaluate(selection), "SCM");

                    if (this.setHiddenReason(element.key, 'text', false, scm))
                        visibleRows++;

                } else {
                    if (this.setHiddenReason(element.key, 'text', true, scm))
                        visibleRows--;
                }
            }
        } .bind(this));

        var downDiv = this.virtualHtml.down('[id=applicationInbox_down]');

        // If there are no rows => hide the table otherwise, show it
        if (this.visibleRows == 0 && downDiv.visible())
            downDiv.hide();
        else if (!downDiv.visible())
            downDiv.show();
    },
    /**
    *@param {Event} event The event generated when editing the type filter changed
    *@description makes appear in the inbox table only the tasks that have the same type than the selected one
    */
    filterByType: function(event) {
        var args = getArgs(event);
        if (args.idAutocompleter == 'applicationInbox_form_eventTypesSelect') {
            this.type = args.idAdded;

            this.applyFilters(this.type, null, null, null);
        }
    },

    /**
    *@param {Event} event The event generated when begin or end date changed
    *@description makes appear in the inbox table only the tasks which request Date is between begda and endda 
    *selected dates
    */
    filterByDate: function(event, scm) {
        var args = getArgs(event);
        var element = Event.element(event);

        var beg = (scm == "SCM") ? this.begDatePickerPend.actualDate : this.begDatePicker.actualDate;
        var end = (scm == "SCM") ? this.endDatePickerPend.actualDate : this.endDatePicker.actualDate;

        if (!Object.isEmpty(beg) || !Object.isEmpty(end)) {
            var auxBegDate = (beg) ? beg.clone() : end.actualDate.clone().add({ days: -9999 });
            var auxEndDate = (end) ? end.clone() : beg.clone().add({ days: 9999 });

            this.applyFilters(null, auxBegDate, auxEndDate, null, scm);
        }
    },

    /**
    * @method filterByDatePend
    * @desc Filters the requests when a date is selected
    */

    filterByDatePend: function(event) {
        this.filterByDate(event, "SCM");
    },

    /**
    *@param {Event} event The event generated when editing the complex search field
    *@description makes appear in the inbox table only the tasks that contain the typed text on the complex text search
    *input (emphasizing this text) 
    */
    fieldKeyUp: function(event) {
        this.textSearch = Event.element(event).value.toLowerCase();
        if (Event.element(event).identify() == "applicationInbox_complexTextSearchPend")
            this.applyFilters(null, null, null, this.textSearch, 'SCM');
        else
            this.applyFilters(null, null, null, this.textSearch);

    },

    /**
    *@description Give the content of the line with the complex search field content underlined 
    *@return Object
    */
    getFilteredSelection: function(element, value, scm) {
        var auxElement = element.value[2];
        var reqByString = !Object.isEmpty(auxElement.get('requestedBy')) ?
            underlineSearch(auxElement.get('requestedBy'), value, 'applicationInbox_textMatch') : "";

        if (scm == "SCM")
            return {
                index: auxElement.get('index'),
                type: auxElement.get('type'),
                description: underlineSearch(auxElement.get('description'), value, 'applicationInbox_textMatch'),
                requestedBy: reqByString,
                status: underlineSearch(auxElement.get('status'), value, 'applicationInbox_textMatch'),
                date: underlineSearch(auxElement.get('date'), value, 'applicationInbox_textMatch'),
                javas: auxElement.get('javas'),
                hrwid: underlineSearch(auxElement.get('hrwid'), value, 'applicationInbox_textMatch')
            };
        else
            return {
                index: auxElement.get('index'),
                type: auxElement.get('type'),
                description: underlineSearch(auxElement.get('description'), value, 'applicationInbox_textMatch'),
                requestedBy: reqByString,
                onBehalfOf: underlineSearch(auxElement.get('onBehalfOf'), value, 'applicationInbox_textMatch'),
                date: underlineSearch(auxElement.get('date'), value, 'applicationInbox_textMatch'),
                javas: auxElement.get('javas'),
                selected: (this.selectedRows.get(auxElement.get('index'))) ? 'checked' : ''
            };


    },

    /**
    *@description Give the content of the line without the complex search field content underlined
    *@return Object 
    */
    getSimpleSelection: function(element, scm) {
        var auxElement = element.value[2];

        if (scm == "SCM")
            return {
                index: auxElement.get('index'),
                type: auxElement.get('type'),
                description: auxElement.get('description'),
                requestedBy: auxElement.get('requestedBy'),
                status: auxElement.get('status'),
                date: auxElement.get('date'),
                javas: auxElement.get('javas'),
                hrwid: auxElement.get('hrwid')
            };
        else
            return {
                index: auxElement.get('index'),
                type: auxElement.get('type'),
                description: auxElement.get('description'),
                requestedBy: auxElement.get('requestedBy'),
                onBehalfOf: auxElement.get('onBehalfOf'),
                date: auxElement.get('date'),
                javas: auxElement.get('javas'),
                selected: (this.selectedRows.get(auxElement.get('index'))) ? 'checked' : ''
            };
    },
    //***************************************
    //Managing SAP respond
    //***************************************
    /**
    *@param {Object} json Tasks xml got from sap
    *@description Gets all the back-end responds to the get_task_lst requests already done, and initializes the 
    * proper class attributes (data, table, etc.)
    */
    initializeTable: function(json) {
        //every time we get a respond from SAP(three times: WEBFORM, TIME and LEARNING)
        this.numberOfRequests++;

        var rowsHash = $H();
        //all the tasks are there: //line on the xml
        var rows = $A();

        if (json.EWS.o_list) {
            objectToArray(json.EWS.o_list.yglui_str_inbox_list).each(function(list) {
                rows.push(list);
            } .bind(this));
        }
        //tasks type got it
        rows.each(function(element) {
            //for each task we get its data
            var row = $H({
                index: element["@req_id"],
                type: element["@req_bs"],
                description: element["@req_ds"],
                requestedBy: element["@req_cn"],
                onBehalfOf: element["@req_dn"],
                hotspot: element["@hotspot"],
                date: sapToDisplayFormat(element["@req_dt"]),
                javas: 'openTaskDetails',
                pendr: element["@pendr"],
                filteredByText: false,
                filteredByDate: false,
                filteredByType: false
            });

            row.each(function(item) {
                if (Object.isEmpty(item.value)) {
                    switch (item.key) {
                        case 'requestedBy':
                            if (!Object.isEmpty(element["@req_cr"])) {
                                row.set(item.key, element["@req_cr"]);
                                return;
                            }
                            break;
                        case 'onBehalfOf':
                            if (!Object.isEmpty(element["@req_dn"])) {
                                row.set(item.key, element["@req_dn"]);
                                return;
                            }
                            break;
                    }
                    row.set(item.key, this.emptyField);
                }
            } .bind(this));

            var searchText = row.get('description') + ' ' + row.get('requestedBy') + ' ' + row.get('onBehalfOf') + ' ' + row.get('date');

            //and set it on the data attribute(for not asking SAP anymore about this task)
            this.data.set(row.get('index'), [element["@req_bd"], searchText.toLowerCase(), row]);
            rowsHash.set(row.get('index'), row);
            this.numberOfRows++;
            this.visibleRows++;
        } .bind(this));

        // Ge tth eno tasks label
        this.noTaskLabel = this.labels.get('noInboxTasks');
        //Once we have all the tasks, we insert them into the table
        this.table.insertRows(rowsHash);
        //The table won´t be shown till we get all the tasks(3 services --> 3 types)
        this.showHideTable();
    },

    /**
    *@description Show the table with inbox items only if there are elements inside.
    *				Otherwise, set the message no Tasks
    */
    showHideTable: function() {
        if (this.inDetails) return;

        var down = this.virtualHtml.down('[id=applicationInbox_down]');
        var up = this.virtualHtml.down('[id=applicationInbox_up]');

        if (this.numberOfRows > 0 && this.visibleRows > 0) {
            if (!down.visible()) {
                down.show();
                up.show();
            }
        } else {
            down.hide();
            up.hide();
            this.virtualHtml.down('[id=applicationInbox_filters]').hide();
            this.virtualHtml.down('[id=applicationInbox_downDetails]').insert({ 'after': new Element('div', {
                'id': 'applicationInbox_noTasksMessage',
                'class': 'application_main_soft_text applicationInboxNotasks'
            }).update(this.noTaskLabel)
            });

        }
    },

    /**
    *@param {Object} jsonDetail task details xml got from the back-end
    *@param {Boolean} scm true is the request to show is a pending request
    *@description Updates and shows the task details div HTML, with the task details data just modified on the data attribute
    */
    updateDetails: function(scm, jsonDetails) {
        //showing the taks details div
        this.openScreen(new Element('div', { 'class': 'application_main_title2' }).update('Task details'));
        //Getting the task(id) detail fields
        var item = (scm) ? jsonDetails.EWS.o_list.yglui_str_pending_list : jsonDetails.EWS.o_list.yglui_str_inbox_list;
        if (Object.isEmpty(item['@req_at']))
            var newWay = false;
        else
            var newWay = true;
        this.req_id = item['@req_id'];

        var defFields = new Element('div', { 'class': 'applicationInbox_area_content' });
        var specInfoFields = new Element('div', { 'class': 'applicationInbox_area_content' });
        this.multipleReplies = new Array();

        // Get the user name or login if there is no name
        var reqBy = item['@req_bn'];
        if (Object.isEmpty(reqBy))
            reqBy = item['@req_cr'];

        // Get the delegation field that is the name in delegation or the login if no names.
        var delegateFrom = item['@req_dn'];
        if (Object.isEmpty(delegateFrom))
            delegateFrom = this.emptyField;

        // Get the list of default fields to display (common info)
        var elements = $A();

        elements.push([item['@req_bs'], this.labels.get('TYPE') + ': ', defFields, false]);
        elements.push([sapToDisplayFormat(item['@req_dt']), this.labels.get('CREATIONDATE') + ': ', defFields, false]);
        elements.push([reqBy, this.labels.get('REQUESTBY') + ': ', defFields, false]);

        if (scm)
            elements.push([item['@req_st'], this.labels.get('STATUS') + ': ', defFields, false]);
        else
            elements.push([delegateFrom, this.labels.get('BEHALF') + ': ', defFields, false]);

        elements.push([item['@req_ds'], global.getLabel('SUBJECT') + ': ', defFields, false]);

        if (!newWay && !scm) {
            var specFields = $A();
            // Get the list of particular fields to display
            if (!Object.isEmpty(jsonDetails.EWS.o_values))
                specFields = objectToArray(jsonDetails.EWS.o_values.yglui_str_wid_field);

            specFields.each(function(specField) {
                var value = specField['#text'];
                if (Object.isEmpty(value))
                    value = specField['@value'];

                if (Object.isEmpty(value))
                    value = this.emptyField;
                else if (specField['@fieldtechname'] == 'BEGDA' || specField['@fieldtechname'] == 'ENDDA')
                    value = sapToDisplayFormat(value);
                else if (specField['@fieldtechname'] == 'BEGUZ' || specField['@fieldtechname'] == 'ENDUZ')
                    value = sapToDisplayFormatTime(value);

                elements.push($A([value, global.getLabel(specField['@fieldlabel']) + ': ', specInfoFields]));
            } .bind(this))
            this.addElementsToDivs(elements, defFields, specInfoFields);
        }
        else {
            this.addElementsToDivs(elements, defFields);
            defFields.insert(new Element('div', { 'class': 'FWK_EmptyDiv' }).update(' '));

            // Information about documents, reply fields only for pending requests

            this.replyFieldsDiv = new Element('div', { 'id': 'applicationInbox_replyFields' });

            if (scm) {
                // Extract document types information
                this.docTypes = this.getDocTypes(jsonDetails);
                this.sendViaTypes = this.getSendViaTypes(jsonDetails);

                // Get the list of fields to display (specific info)
                var specElements = this.getSpecificFields(jsonDetails, specInfoFields);
                this.addElementsToDivs(specElements, specInfoFields);
                this.addReplyFields(this.replyFieldsDiv);
                this.replyFieldsDiv.hide();
                //this.addDocsInformation(jsonDetails, specInfoFields);

                // Initializates the array containing files to be uploaded
                this.filesToBeUploaded = new Array();
            }

            specInfoFields.insert(this.replyFieldsDiv);
        }
        specInfoFields.insert(new Element('div', { 'class': 'FWK_EmptyDiv' }).update(' '));

        var submitHtml = new Element('div', {
            'class': 'applicationInbox_submitButtonsDetails'
        });

        this.commentDetails = new Element('input', {
            'id': 'applicationInbox_commentsInputDetails',
            'value': this.defCommentText,
            'type': 'text',
            'size': '60px',
            'class': 'application_autocompleter_box applicationInbox_comments'
        });
        // Buttons

        var json = {
            elements: []
        };

        var auxExit = {
            label: global.getLabel('exit'), //this.labels.get('EXIT'),
            handlerContext: null,
            handler: this.taskDetailsExit.bindAsEventListener(this, ''),
            type: 'button',
            idButton: 'applicationInbox_ExitButton',
            className: 'applicationInbox_submitButtonsStyle',
            standardButton: true
        };

        var auxReply = {
            label: global.getLabel('Reply'),
            handlerContext: null,
            handler: this.addDescriptionButtonHandler.bind(this, jsonDetails, scm, 'Y'),
            type: 'button',
            idButton: 'applicationInbox_ReplyButton',
            className: 'applicationInbox_submitButtonsStyle',
            standardButton: true
        };

        var auxCancelReq = {
            label: this.labels.get('CANCELREQUEST'),
            handlerContext: null,
            handler: this.addDescriptionButtonHandler.bind(this, jsonDetails, scm, 'C'),
            type: 'button',
            idButton: 'applicationInbox_cancelReqButton',
            className: 'applicationInbox_submitButtonsStyle',
            standardButton: true
        };

        json.elements.push(auxReply);
        json.elements.push(auxCancelReq);
        json.elements.push(auxExit);

        var mb = new megaButtonDisplayer(json);
        this.generalButtonsDiv = new Element('div', { 'id': 'applicationInbox_generalButtons' }).insert(mb.getButtons());
        this.buttons.set('applicationInbox_ExitButton', mb);
        if (!newWay && !scm) {
            this.teamCal = new Element('div', {
                'class': 'application_action_link applicationInbox_TeamCal'
            }).update(global.getLabel('showTeamCal'));
            this.teamCal.observe('click', this.openTeamCalendar.bind(this));
        }
        if (newWay) {
            global.open({
                app: {
                    appId: item['@req_ap'],
                    tabId: 'SUBAPP',
                    view: item['@req_vi']
                },
                pendr: item['@pendr'],
                req_bd: item['@req_bd'],
                req_bn: item['@req_bn'],
                req_bp: item['@req_bp'],
                req_bs: item['@req_bs'],
                req_bt: item['@req_bt'],
                req_by: item['@req_by'],
                req_cn: item['@req_cn'],
                req_cp: item['@req_cp'],
                req_cr: item['@req_cr'],
                req_ct: item['@req_ct'],
                req_dl: item['@req_dl'],
                req_dn: item['@req_dn'],
                req_ds: item['@req_ds'],
                req_dt: item['@req_dt'],
                req_id: item['@req_id'],
                req_ta: item['@req_ta'],
                wi_id: item['@wi_id'],
                comingFrom: 'inbox'
            });
        }

        submitHtml.insert(this.generalButtonsDiv);

        this.buttonsToApproveDiv = new Element('div');
        this.buildButtonsToApprove(this.buttonsToApproveDiv, scm, jsonDetails);
        if (!scm)
            this.buttonsToApproveDiv.insert(this.commentDetails);
        this.buttonsNotToApproveDiv = new Element('div');
        this.buildButtonsNotToApprove(this.buttonsNotToApproveDiv);

        submitHtml.insert(this.buttonsToApproveDiv);
        submitHtml.insert(this.buttonsNotToApproveDiv);

        if (!scm) {
            this.generalButtonsDiv.hide();
        }
        else {
            if (item['@approve'] == 'X') {
                this.generalButtonsDiv.hide();
            }
            else {
                this.buttonsToApproveDiv.hide();
            }
        }
        this.buttonsNotToApproveDiv.hide();

        //// Updating the task details div 
        var divDetails = this.virtualHtml.down('[id=applicationInbox_downDetails]');
        divDetails.insert(new Element('div', { 'id': 'inboxApplication_defaultFields', 'class': 'inboxApplication_widget' }));
        divDetails.insert(new Element('div', { 'id': 'inboxApplication_specificInfo' }));
        divDetails.insert(new Element('div', { 'class': 'applicationInbox_Details_Inter_Area application_clear_line inboxApplication_widget' }).update(' '));
        if (!newWay)
            divDetails.insert(new Element('div', { 'id': 'inboxApplication_otherFields' }));
        divDetails.insert(new Element('div', { 'class': 'application_clear_line' }).update(' '));
        divDetails.insert(submitHtml);

        this.buildDetails(newWay);

        defFields.insert(new Element("div", { "class": "application_clear_line" }));
        specInfoFields.insert(new Element("div", { "class": "application_clear_line" }));

        divDetails.down('[id=unmWidgetContent_inboxApplication_defaultFields]').insert(defFields);
        divDetails.down('[id=inboxApplication_defaultFields]').insert(new Element("div", { "class": "application_clear_line" }));

        divDetails.down('[id=unmWidgetContent_inboxApplication_specificInfo]').insert(specInfoFields);
        divDetails.down('[id=inboxApplication_specificInfo]').insert(new Element("div", { "class": "application_clear_line" }));
        if (!newWay && !scm)
            divDetails.insert(this.teamCal);
    },

    /**
    *@description Build the widgets used to display details information
    */
    buildDetails: function(newWay) {
        // Create the widgets to store information
        var options = $H({
            title: this.labels.get('COMMONINFO'),
            collapseBut: true,
            targetDiv: 'inboxApplication_defaultFields',
            contentHTML: ''
        });
        new unmWidget(options);

        if (!newWay) {
            var options2 = $H({
                title: this.labels.get('SPECIFICINFO'),
                collapseBut: true,
                targetDiv: 'inboxApplication_specificInfo',
                contentHTML: ''
            });
            new unmWidget(options2);
        }
    },

    /*
    * @method addElementsToDivs
    * @desc Updates and adds elements to be shown in screen
    * @param elements Elements to be shown
    * @param fields Div to be updated
    */

    addElementsToDivs: function(elements, fields, otherFields) {
        var counterDef = 0;
        var counterOth = 0;
        var counterLines = 0;
        var width_title;
        var width_cont;
        //Add all the elements in the correct divs
        for (var i = 0; i < elements.size(); i++) {
            var element = elements[i];

            var div = new Element('div', {
                'class': 'applicationInbox_detailsSection'
            });
            // Each end of line is indicated with a clear both
            if (element[2] == fields) {
                if (element[3]) {
                    counterDef++;
                    div.addClassName('applicationInbox_allLineWidth');
                    width_title = 'applicationInbox_allLineTitleWidth';
                    width_cont = 'applicationInbox_allLineContentWidth';
                    if (!Object.isEmpty(element[4])) {
                        if (counterLines % 2 == 0) {
                            div.addClassName('applicationInbox_grey');
                        }
                        counterLines++;
                    }
                } else {
                    width_title = 'applicationInbox_semiLineTitleWidth';
                    width_cont = 'applicationInbox_semiLineContentWidth';
                }
                counterDef++;
                if ((counterDef % 2) == 1)
                    div.addClassName('application_clear_line');
            } else if (element[2] == otherFields) {
                width_title = 'applicationInbox_semiLineTitleWidth';
                width_cont = 'applicationInbox_semiLineContentWidth';
                counterOth++;
                if ((counterOth % 2) == 1)
                    div.addClassName('application_clear_line');
            }

            div.insert(new Element('div', {
                'class': 'application_main_soft_text applicationInbox_main_text ' + width_title
            }).update(element[1]));
            div.insert(new Element('div', {
                'class': 'application_main_text applicationInbox_main_text ' + width_cont
            }).update(element[0]));

            element[2].insert(div);

            // Store replies to be hidden
            if (element[1].startsWith(global.getLabel('Reply'))) {
                this.multipleReplies.push(div);
                div.hide();
            }

        }
    },

    /*
    * @method getSpecificFields
    * @desc Gets the fields to be shown as specific information
    * @param json json
    * @param resultDiv Div to be updated with elements
    * @returns A div containing the fields
    */

    getSpecificFields: function(json, resultDiv) {

        var fields = objectToArray(json.EWS.o_values.yglui_str_wid_field);
        var size = fields.size();
        var hashFields = new Hash();
        var cont = new Array();
        var seqnr;
        var replies = new Array();

        for (var i = 0; i < size; i++) {
            if (fields[i]['@fieldid'] == "RTEXT") {
                seqnr = parseInt(fields[i]['@fieldtseqnr'], 10);
                replies.push(seqnr);
                //formatting the replies values
                var formattedValue = fields[i]['#text'].gsub('\n', '<br>');
                hashFields.set(fields[i]['@fieldid'] + "_" + seqnr, { label: fields[i]['@fieldlabel'], value: formattedValue });
            }
            else {
                if (fields[i]['@fieldid'] == "ETEXT") {
                    var formattedValue = unescape(fields[i]['@value']).gsub('\n', '<br>');
                    hashFields.set(fields[i]['@fieldid'], { label: fields[i]['@fieldlabel'], value: formattedValue });
                }
                else {
                    hashFields.set(fields[i]['@fieldid'], { label: fields[i]['@fieldlabel'], value: fields[i]['@value'] });
                }
            }
        }

        cont.push(this.getArrayFromField(hashFields, 'COMPANY', null, resultDiv, false));

        if (hashFields.get('LDATE'))
            cont.push(new Array(sapToDisplayFormat(hashFields.get('LDATE').value),
                global.getLabel(hashFields.get('LDATE').label) + ':', resultDiv, false));

        var reqIdArray = this.getArrayFromField(hashFields, 'REQ_ID', null, resultDiv, false);
        var hrwIdArray = this.getArrayFromField(hashFields, 'HRWID', 'Request Ticket ID', resultDiv, false);

        // Stores values for Request and Hrw Id
        this.req_id = reqIdArray[0];
        this.hrwid = hrwIdArray[0];

        cont.push(reqIdArray);
        cont.push(hrwIdArray);
        cont.push(this.getArrayFromField(hashFields, 'SRVID', 'Service', resultDiv, false));
        cont.push(this.getArrayFromField(hashFields, 'GRPID', 'Service Group', resultDiv, false));
        cont.push(this.getArrayFromField(hashFields, 'ETEXT', null, resultDiv, true));

        // Last reply

        var limit = replies.size() - 1;  // Last reply has been already added

        if (limit >= 0) {
            cont.push(this.getArrayFromField(hashFields, 'RTEXT_' + replies[limit], 'Last Reply', resultDiv, true));
            cont.last().push('reply');
        }

        if (limit >= 1) {
            // Show full reply history

            var auxJson = { elements: [] };

            var hLink = {
                idButton: 'applicationInbox_showFullHistory',
                className: 'application_action_link',
                handler: this.toggleReplies.bind(this),
                label: this.labels.get('SHOWFULLHISTORY') + '...',
                type: 'link'
            };

            auxJson.elements.push(hLink);
            this.historyLink = new megaButtonDisplayer(auxJson)
            cont.push(new Array(this.historyLink.getButtons(), "", resultDiv, true));
        }

        // Multiple replies
        for (var i = limit - 1; i >= 0; i--) { // Reversed order
            cont.push(this.getArrayFromField(hashFields, 'RTEXT_' + replies[i], 'Reply (' + (i + 1) + ')', resultDiv, true));
            cont.last().push('reply');
        }
        return cont;
    },

    /*
    * @method toggleReplies
    * @desc Shows/Hides multiple replies
    */

    toggleReplies: function() {

        // Check if the replies are visible and change label

        if (!Object.isEmpty(this.multipleReplies[0]))
            if (this.multipleReplies[0].visible())
            this.historyLink.updateLabel('applicationInbox_showFullHistory', this.labels.get('SHOWFULLHISTORY') + '...');
        else
            this.historyLink.updateLabel('applicationInbox_showFullHistory', this.labels.get('SHOWFULLHISTORY') + '...');

        for (var i = 0; i < this.multipleReplies.size(); i++)
            this.multipleReplies[i].toggle();
    },

    /*
    * @method getArrayFromField
    * @desc Returns an array with all the information from a field
    * @param fields Hash containing all the fields
    * @param id Field id
    * @param label Preferred label, if null, it returns the default label
    * @param div Containing div
    * @param twidth {Boolean} True if the field takes full width, False otherwise
    */

    getArrayFromField: function(fields, id, label, div, twidth) {

        if (Object.isEmpty(fields.get(id)))
            return new Array(null, null, div, twidth);
        else {
            var v = fields.get(id).value;
            var l = Object.isEmpty(label) ? fields.get(id).label : label;

            return new Array(v, global.getLabel(l) + ':', div, twidth);
        }
    },

    /*
    * @method addDocsInformation
    * @desc Add the information on docs from Json to a div
    * @param json Json data
    * @param div Div to be updated
    */

    addDocsInformation: function(json, div) {

        var documents;
        var size;
        var docTable;

        if (!Object.isEmpty(json.EWS.o_document)) {

            documents = objectToArray(json.EWS.o_document);
            size = documents.size();

            div.insert(new Element('div',
                    { 'class': 'application_main_soft_text applicationInbox_main_text' }
                ).update(this.labels.get('DOCUMENTS') + ':'));

            docTable = new Element('table');
            var head = new Element('thead');
            var body = new Element('tbody');

            head.insert('<th>' + this.labels.get('TYPE') + '</th><th>' + this.labels.get('SENDVIA') + '</th><th>' +
              this.labels.get('FILENAME') + '</th>');

            if (!Object.isEmpty(this.docTypes) && !Object.isEmpty(this.sendViaTypes))
                for (var i = 0; i < size; i++) {

                var doc = documents[i].yglui_str_scm_inbox_document;
                var row = new Element('tr');

                row.insert('<td>' + this.docTypes.get(doc['@doctp']) + '</td><td>' + this.sendViaTypes.get(doc['@docsd']) + '</td><td>' +
                        doc['@fname'] + '</td>');

                body.insert(row);
            }

            docTable.insert(head);
            docTable.insert(body);

            div.insert(new Element('div', { 'class': 'applicationInbox_docTable' }).update(docTable));
        }
    },

    /*
    * @method addReplyFields
    * @desc Adds the fields used for the reply feature
    * @param div Div to be updated with the fields
    */

    addReplyFields: function(div) {

        // Reply text area

        var textAreaDiv = new Element('div', { 'class': 'applicationInbox_framedDetailsSection applicationInbox_allLineWidth' });
        var label = new Element('span',
                { 'class': 'application_main_soft_text applicationInbox_main_text applicationInbox_allLineTitleWidth' }
                ).update(global.getLabel('DESCRIPTION') + ':');
        var text = new Element('textarea', { 'class': 'applicationInbox_allLineContentWidth applicationInbox_textarea' });

        this.etext = text;

        textAreaDiv.insert(label);
        textAreaDiv.insert(text);
        div.insert(textAreaDiv);

        // New documents -> Disabled for now
        // div.insert(this.buildNewDocumentDiv());
    },

    /*
    * @method buildNewDocumentDiv
    * @desc Builds and returns a div containing all the information needed in a new document div
    * @returns The new document div
    */

    buildNewDocumentDiv: function() {

        var newDocumentPart = new Element('div', { 'class': 'applicationInbox_detailsSection applicationInbox_allLineWidth' });

        // Label

        label = new Element('span',
                    { 'class': 'application_main_soft_text applicationInbox_main_text applicationInbox_allLineTitleWidth' }
                    ).update(this.labels.get('NEWDOCUMENT') + ':');

        var newDocumentDiv = new Element('div',
                { 'id': 'applicationInbox_newDocumentDiv', 'class': 'applicationInbox_allLineContentWidth applicationInbox_down' });

        // Radio Button

        var radioBut = new Element('div', { 'id': 'applicationInbox_sendVia' });
        radioBut.insert(this.labels.get('CHOOSETO') + ':');

        var svTypesKeys = this.sendViaTypes.keys();
        var size = svTypesKeys.size();
        var checked = "";

        for (var i = 0; i < size; i++) {

            checked = (i == 0) ? "checked" : "";

            radioBut.insert("<input type='radio' name='sendViaType' " + checked + " value='" + svTypesKeys[i] + "'>"
                    + global.getLabel(this.sendViaTypes.get(svTypesKeys[i])) + "</input>");
        }

        newDocumentDiv.insert(radioBut);

        // Drop down list

        var drop = new Element('div');
        var jsonList = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noResults'),
                    search: global.getLabel('Search')
                }
            }
        };

        drop.insert(new Element('div',
                { 'class': 'applicationInbox_down applicationInbox_semiLineTitleWidth' }).update(this.labels.get('TYPEDOCUMENT') + ':'));

        var docKeys = this.docTypes.keys();
        size = docKeys.size();
        var selected;
        var autoc = new Element('div', { 'id': 'applicationInbox_listDocTypes' });

        for (var i = 0; i < size; i++) {
            selected = (i == 0) ? "x" : "";

            jsonList.autocompleter.object.push({ text: this.docTypes.get(docKeys[i]), data: docKeys[i], def: selected });
        }

        drop.insert(autoc);
        this.docTypeAutoComp = new JSONAutocompleter(autoc, { showEverythingOnButtonClick: true, virtualVariables: true }, jsonList);
        newDocumentDiv.insert(drop);

        // Input file

        var uploadFileDiv = new Element('div', { 'id': 'applicationInbox_uploadFile', 'class': 'applicationInbox_down' });

        this.uploadModule = new UploadModule(
                uploadFileDiv,
                'ST_DOC', //global.currentApplication.appId,
                'INBOX_UPD_REQ',
                true, this.successUpload.bind(this));

        newDocumentDiv.insert(uploadFileDiv);

        // Button

        var jsonButton = { elements: [] };
        var auxButton = {
            label: global.getLabel('Upload'),
            idButton: 'applicationInbox_uploadButton',
            className: 'applicationInbox_submitButtonsStyle',
            handlerContext: null,
            handler: this.uploadButtonHandler.bind(this),
            type: 'button',
            standardButton: true
        }

        jsonButton.elements.push(auxButton);
        newDocumentDiv.insert(new megaButtonDisplayer(jsonButton).getButtons());

        // Table with documents

        var docTable = new Element('table', { 'id': 'applicationInbox_filesToUploadTable' });
        var head = new Element('thead');
        head.insert('<th>' + this.labels.get('TYPE') + '</th><th>' + this.labels.get('SENDVIA') + '</th><th>' +
                  this.labels.get('FILENAME') + '</th>');

        docTable.insert(head);
        docTable.insert(new Element('tbody'));
        newDocumentDiv.insert(new Element('div', { 'class': 'applicationInbox_docTable' }).update(docTable));

        newDocumentPart.insert(label);
        newDocumentPart.insert(newDocumentDiv);

        return newDocumentPart;
    },

    /*
    * @method getSendViaTypes
    * @desc Gets and returns a hash containing the send via types in the JSON
    * @param json JSON data
    * @returns A hash with all the send types in the JSON
    */

    getSendViaTypes: function(json) {

        var types;
        var size;
        var hashSV = new Hash();

        if (!Object.isEmpty(json.EWS.o_docsd)) {

            types = json.EWS.o_docsd.yglui_str_scm_document_send;
            size = types.size();

            for (var i = 0; i < size; i++)
                hashSV.set(types[i]['@docsd'], types[i]['@doctx']);
        }
        else
            hashSV = null;

        return hashSV;
    },

    /*
    * @method getDocTypes
    * @desc Gets and returns a hash containing the document types in the JSON
    * @param json JSON data
    * @returns A hash with all the documenttypes in the JSON
    */

    getDocTypes: function(json) {

        var types;
        var size;
        var hashDT = new Hash();

        if (!Object.isEmpty(json.EWS.o_doctp)) {

            types = json.EWS.o_doctp.yglui_str_scm_document;
            size = types.size();

            for (var i = 0; i < size; i++)
                hashDT.set(types[i]['@doctp'], types[i]['@doctx']);
        }
        else
            hashDT = null;

        return hashDT;
    },

    /**
    * @method buildButtonsToApprove
    * @description Builds HTML of buttons in the to-approve screen
    * @param div Div to be updated
    */

    buildButtonsToApprove: function(div, scm, json) {
        var jsonButtons = { elements: [] };
        if (scm) {
            var auxApprove = {
                label: global.getLabel('approve'), //this.labels.get('APPROVE'),
                handlerContext: null,
                handler: this.addDescriptionButtonHandler.bind(this, json, scm, 'A'),
                type: 'button',
                idButton: 'applicationInbox_approveButton',
                className: 'applicationInbox_submitButtonsStyle',
                standardButton: true
            };

            var auxReject = {
                label: global.getLabel('reject'), //this.labels.get('REJECT'),
                handlerContext: null,
                handler: this.addDescriptionButtonHandler.bind(this, json, scm, 'R'),
                type: 'button',
                idButton: 'applicationInbox_rejectButton',
                className: 'applicationInbox_submitButtonsStyle',
                standardButton: true
            };
        }
        else {
            var auxApprove = {
                label: global.getLabel('approve'), //this.labels.get('APPROVE'),
                handlerContext: null,
                handler: this.approveButtonHandler.bind(this),
                type: 'button',
                idButton: 'applicationInbox_approveButton',
                className: 'applicationInbox_submitButtonsStyle',
                standardButton: true
            };

            var auxReject = {
                label: global.getLabel('reject'), //this.labels.get('REJECT'),
                handlerContext: null,
                handler: this.auxRejectButtonHandler.bind(this),
                type: 'button',
                idButton: 'applicationInbox_rejectButton',
                className: 'applicationInbox_submitButtonsStyle',
                standardButton: true
            };
        }
        var auxExitNotApproved = {
            label: global.getLabel('exit'), //this.labels.get('EXIT'),
            handlerContext: null,
            handler: this.taskDetailsExit.bindAsEventListener(this),
            type: 'button',
            idButton: 'applicationInbox_exitNotApprovedButton',
            className: 'applicationInbox_submitButtonsStyle',
            standardButton: true
        };

        jsonButtons.elements.push(auxApprove);
        jsonButtons.elements.push(auxReject);
        jsonButtons.elements.push(auxExitNotApproved);

        div.insert(new megaButtonDisplayer(jsonButtons).getButtons());

    },

    /**
    * @method buildButtonsNotToApprove
    * @description Builds HTML of buttons in the approved screen
    * @param div Div to be updated
    */

    buildButtonsNotToApprove: function(div) {

        this.descriptionButtons = { elements: [] };

        var auxSubmit = {
            label: global.getLabel('SENDHRW'),
            handlerContext: null,
            handler: this.submitButtonHandler.bindAsEventListener(this),
            type: 'button',
            idButton: 'applicationInbox_submitButton',
            className: 'applicationInbox_submitButtonsStyle',
            standardButton: true
        };

        var auxExitApproved = {
            label: global.getLabel('exit'), //this.labels.get('EXIT'),
            handlerContext: null,
            handler: this.exitApprovedButtonHandler.bindAsEventListener(this),
            type: 'button',
            idButton: 'applicationInbox_exitApprovedButton',
            className: 'applicationInbox_submitButtonsStyle',
            standardButton: true
        };

        this.descriptionButtons.elements.push(auxSubmit);
        this.descriptionButtons.elements.push(auxExitApproved);

        div.insert(new megaButtonDisplayer(this.descriptionButtons).getButtons());
    },

    getPendReq: function() {
        var xmlIn = '<EWS>'
                        + '<SERVICE>GET_PENDR_LST</SERVICE>'
                        + '<I_ACTION></I_ACTION>'
                        + '<DEL/>'
                   + '</EWS>';
        this.makeAJAXrequest($H({
            xml: xmlIn,
            successMethod: this.showPendRequest.bind(this)
        }));

    },

    showPendRequest: function(json) {

        var noPendingPart = json.EWS.o_no_pendr;

        if (Object.isEmpty(noPendingPart) || (noPendingPart.toLowerCase() != "x")) {

            this.pendingContentDiv.show();

            //the datePickers objects to filter the table by date

            if (Object.isEmpty(this.begDatePickerPend) && Object.isEmpty(this.endDatePickerPend)) {
                this.begDatePickerPend = new DatePicker('applicationInbox_form_begCal_pend', {
                    draggable: true,
                    correctDateOnBlur: true,
                    events: $H({ correctDate: 'EWS:datepicker_CorrectDatePend' })
                });
                this.endDatePickerPend = new DatePicker('applicationInbox_form_endCal_pend', {
                    draggable: true,
                    correctDateOnBlur: true,
                    events: $H({ correctDate: 'EWS:datepicker_CorrectDatePend' })
                });
                this.begDatePickerPend.linkCalendar(this.endDatePickerPend);
            }
            //the AutocompleteSearch object to filter the table by task Type

            if (Object.isEmpty(this.typesAutocompleter)) {
                var types = $A();
                if (!Object.isEmpty(json.EWS.o_srvid))
                    types = objectToArray(json.EWS.o_srvid.yglui_str_scm_srvid);

                var autoComp = {
                    autocompleter: {
                        object: new Array()
                    }
                };

                autoComp.autocompleter.object.push({
                    data: '',
                    text: global.getLabel('noTypeSelection'),
                    def: 'X'
                });

                types.each(function(type) {
                    autoComp.autocompleter.object.push({
                        data: type['@srvid'],
                        text: type['@srvtx']
                    });
                });

                this.typesAutocompleter = new JSONAutocompleter('applicationInbox_form_eventTypesSelect_pend', {
                    showEverythingOnButtonClick: true,
                    timeout: 5000,
                    templateOptionsList: '#{text}',
                    events: $H({ 'onResultSelected': 'EWS:autocompleter_resultSelected' })
                }, autoComp)
            }

            //showing the filter options
            this.virtualHtml.down('[id=applicationInbox_up_pend]').show();
            //Creating the SCM integration Table
            var tableSCMHead = {
                type: this.labels.get('TYPE'),
                description: this.labels.get('DESCRIPTION'),
                status: this.labels.get('STATUS'),
                date: this.labels.get('CDATE'),
                hrwid: this.labels.get('HRWID')
            };

            this.SCMtable = new InboxTable('applicationInbox_pendingDown', tableSCMHead, this, "SCM");
            // Add the sorting on the date format if not exist
            if (Object.isEmpty(TableKit.Sortable.types.dateInbox))
                TableKit.Sortable.addSortType(
	    		    new TableKit.Sortable.Type('dateInbox', {
	    		        pattern: new RegExp(global.dateFormat.gsub(/(\.{1}|\\{1})/, function(match) {
	    		            return '\\' + match[0]
	    		        }).gsub(/[dDmMyY]{1}/, '\\d')),
	    		        normal: function(value) {
	    		            var dateObj = Date.parseExact(value, global.dateFormat);
	    		            if (dateObj) return dateObj.valueOf();
	    		            else return '';
	    		        }
	    		    })
	            );
            //has to be loaded by the sortable table class wrapper: TableKit
            var tableOptions = {};
            if (!Object.isEmpty(json.EWS.o_nitems))
                tableOptions.pages = json.EWS.o_nitems;

            TableKit.Sortable.init("SCM_resultsTable", tableOptions);
            //hidding the No results found row
            this.SCMtable.hideSingleRow(0, "SCM");
            //include the content in the table
            this.fillSCMTable(json);
        }
        else 
        {
            this.virtualHtml.down('[id=applicationInbox_NewReqButton]').hide();
            this.pendingContentDiv.hide();
        }
    },

    /**
    *@param {Object} json Tasks xml got from sap
    *@description Gets all the back-end responds to the get_task_lst requests already done, and initializes the 
    * proper class attributes (data, table, etc.)
    */
    fillSCMTable: function(json) {
        //every time we get a respond from SAP(three times: WEBFORM, TIME and LEARNING)
        this.numberOfSCMRequests++;
        this.numberOfSCMRows = 0;
        this.visibleSCMRows = 0;

        var rowsHash = $H();
        //all the tasks are there: //line on the xml
        var rows = $A();

        if (json.EWS.o_list) {
            objectToArray(json.EWS.o_list.yglui_str_pending_list).each(function(list) {
                rows.push(list);
            } .bind(this));
        }
        //tasks type got it
        rows.each(function(element) {

            //for each task we get its data
            var row = $H({
                index: element["@req_id"],
                type: element["@req_bs"],
                description: element["@req_ds"],
                status: element["@req_st"],
                hotspot: element["@hotspot"],
                hrwid: element["@hrwid"],
                date: sapToDisplayFormat(element["@req_dt"]),
                javas: 'openTaskDetails',
                filteredByText: false,
                filteredByDate: false,
                filteredByType: false
            });

            row.each(function(item) {
                if (Object.isEmpty(item.value)) {
                    row.set(item.key, this.emptyField);
                }
            } .bind(this));

            var searchText = row.get('description') + ' ' + row.get('status') + ' ' +
			row.get('date') + ' ' + row.get('hrwid');

            //and set it on the data attribute(for not asking SAP anymore about this task)
            this.SCMdata.set(row.get('index'), [element["@req_bd"], searchText.toLowerCase(), row]);
            rowsHash.set(row.get('index'), row);
            this.numberOfSCMRows++;
            this.visibleSCMRows++;
        } .bind(this));

        //Once we have all the tasks, we insert them into the table
        this.SCMtable.insertRows(rowsHash, "SCM");
        //The table won´t be shown till we get all the tasks(3 services --> 3 types)
        //this.showHideTable();
    },
    /**
    *@param {Object} jsonAnswer xml from the back-end
    *@description Deletes a submitted(approved or declined) task information(from the data attribute) and the 
    *makes it disappear from the tasks table(the table attribute), decreasing the numberOfRows attribute...
    */
    processRespondSubmitTasks: function(jsonAnswer) {
        //hidding the task details div
        this.closeDetails();

        Framework_stb.hideSemitransparent();
        var messages = $A();
        if (!Object.isEmpty(jsonAnswer.EWS.o_upd_msg))
            messages = objectToArray(jsonAnswer.EWS.o_upd_msg.yglui_str_inbox_message);

        var hasModif = false;
        messages.each(function(message) {
            var requestId = message['@req_id'];

            switch (message['@msgtype']) {
                case 'I':
                case 'W':

                    // Add the message to indicate that all is fine
                    this.addMessageInfo(message['@msgline'], true);

                case 'S':
                    // Make the table line no more usable and no more selected
                    this.table.rows.get(requestId).stopObserving('click', this.table.objs.get(requestId).bfx);
                    this.selectedRows.unset(requestId);
                    this.table.rows.get(requestId).down('input').disable();

                    // Set the color to the line
                    this.table.changeRowColor(requestId, message['@dec_id']);
                    hasModif = true;
                    break;

                case 'E':
                    this.addMessageInfo(message['@msgline'], false);
                    break;

            }
        } .bind(this));

        // Disable or not the submit buttons
        if (this.selectedRows.size() == 0) {
            $A(this.virtualHtml.select('.applicationInbox_submitButtonsStyle')).each(function(button) {
                this.buttons.get(button.id).disable(button.id);
            } .bind(this));
        } else {
            $A(this.virtualHtml.select('.applicationInbox_submitButtonsStyle')).each(function(button) {
                this.buttons.get(button.id).enable(button.id);
            } .bind(this));
        }

        if (!hasModif) return;

        document.fire('EWS:refreshTimesheet');
        document.fire('EWS:refreshCalendars');

        //in 10 seconds the task related table row will disappear
        new PeriodicalExecuter(function(pe) {
            messages.each(function(message) {
                if (message['@msgtype'] == 'E') return;
                this.table.hideSingleRow(message['@req_id']);

                //here, properly updating the affected class attributes
                this.numberOfRows--;
                this.visibleRows--;
                this.data.unset(message['@req_id']);
            } .bind(this));


            var more = false;
            var submittedAndHidden = [];
            this.data.each(function(element) {
                if (!element.value[2].get('submittedAs')) return;

                if (this.table.rows.get(element.key).visible())
                    more = true;
                else
                    submittedAndHidden.push(element.key);
            } .bind(this));

            if (!more) {
                for (var iter = 0; iter < submittedAndHidden.size(); iter++) {
                    this.table.deleteSingleRow(id, true);
                }
            }

            this.showHideTable();

            this.virtualHtml.down('[id=applicationInbox_selectAll]').checked = false;

            pe.stop();
        } .bind(this), 10);

    },

    /**
    *@param {String} message The message to display on the screen
    *@param {Boolean} success Is the message to display a success or a failed info
    *@description Add a message as standard ones, but allow to have several ones
    */
    addMessageInfo: function(message, success) {
        if (success)
            var cName = 'fwk_successful';
        else
            var cName = 'fwk_unSuccessful';

        var successful = new Element('div', {
            'class': 'applicationInbox_message_info'
        }).update("<div class='" + cName + "_left'></div>"
				+ "<div class='" + cName + "_center'>" + message + "&nbsp;&nbsp;&nbsp;</div>"
				+ "<div class='" + cName + "_right'>"
				+ "<div class='application_currentSelection'></div>"
				+ "</div>"
		);

        $('infoMessage').insert(successful);
        successful.down('div.application_currentSelection').observe('click', successful.remove.bind(successful));

        new PeriodicalExecuter(function(pe) {
            successful.remove();
            pe.stop();
        }, 30);
    },

    //***************************************
    //Handling HTML events
    //***************************************
    /**
    *@description When clicking on the View  Team Calendar link, makes the teamCalendar application appear/disappear  in
    *subApplication mode
    */
    openTeamCalendar: function() {
        this.teamCalendarShown = !this.teamCalendarShown;
        if (!global.currentSubApplication) {
            //we´re going to open/close the teamCalendar application in subApplication mode          
            global.open($H({
                app: {
                    tabId: "SUBAPP",
                    appId: 'TEAM_MGM',
                    view: 'teamCalendar'
                },
                position: 'bottom',
                closing: !this.teamCalendarShown
            }));
            this.subAppOpened = true;
            this.teamCal.update(global.getLabel('hideTeamCal'));
        }
        else {
            global.closeSubApplication();
            this.subAppOpened = false;
            this.teamCal.update(global.getLabel('showTeamCal'));
        }
    },

    /**
    *@description Go back from the task Details view, to the main inbox screen(tasks table)
    */
    taskDetailsExit: function() {
        if (this.teamCalendarShown) {
            var obj = $H({
                app: {
                    tabId: "SUBAPP",
                    appId: 'TEAM_MGM',
                    view: 'teamCalendar'
                },
                position: 'bottom',
                closing: true
            });
            global.open(obj);
            this.teamCalendarShown = false;
        }
        if (global.currentSubApplication) {
            global.closeSubApplication();
        }
        this.closeDetails();
    },

    /*
    * @method newReqButtonHandler
    * @desc Shows screen to create a new HR request
    */

    newReqButtonHandler: function() {

        var xml = '<EWS>'
                + '<SERVICE>GET_CONTENT2</SERVICE>'
                + '<OBJECT TYPE="P">' + global.objectId + '</OBJECT>'
                + '<PARAM>'
                + '<APPID>INBOXSCM</APPID>'
                + '<WID_SCREEN>1</WID_SCREEN>'
                + '<OKCODE>NEW</OKCODE>'
                + '</PARAM>'
                + '<DEL/>'
                + '</EWS>';

        this.makeAJAXrequest($H({ xml: xml, successMethod: this.createNewRequest.bind(this) }));
    },

    /*
    * @method createNewRequest
    * @desc Shows screen for creating a new HR request
    */

    createNewRequest: function(json) {

        var fields = objectToArray(json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        var size = fields.size();
        var hashFields = new Hash();

        // Fields to be displayed
        var contentDiv = new Element('div');
        var fieldArray = new Array();

        for (var i = 0; i < size; i++)
            hashFields.set(fields[i]['@fieldid'], { label: fields[i]['@fieldlabel'], value: fields[i]['@value'] });

        if (hashFields.get('REQUESTEDBY'))
            fieldArray.push(this.getArrayFromField(hashFields, 'REQUESTEDBY', null, contentDiv, false));

        if (hashFields.get('ONBEHALF'))
            fieldArray.push(this.getArrayFromField(hashFields, 'ONBEHALFOF', null, contentDiv, false));

        this.addElementsToDivs(fieldArray, contentDiv);
        fieldArray.clear();

        contentDiv.insert(
            new Element('div', { 'class': 'applicationInbox_detailsSection' }).update(
            this.labels.get('TYPEREQUEST')
        ));

        // Service group

        var divAutoC = new Element('div', { 'id': 'applicationInbox_serviceGroupTypes' });
        var jsonList = {
            autocompleter: {
                object: new Array()
            }
        };

        fieldArray.push([divAutoC, this.labels.get('SERVICEGROUP'), contentDiv, true]);

        // Service

        var divAutoC2 = new Element('div', { 'id': 'applicationInbox_serviceTypes' });

        var jsonList2 = {
            autocompleter: {
                object: new Array()
            }
        };

        fieldArray.push([divAutoC2, this.labels.get('SERVICE'), contentDiv, true]);

        fieldArray.push([new Element('input',
            { 'id': 'applicationInbox_newReqDesc', 'class': 'applicationInbox_longInput' }), global.getLabel('Description'), contentDiv, true]);

        fieldArray.push([new Element('textarea',
            { 'id': 'applicationInbox_newReqText', 'class': 'applicationInbox_textarea' }), global.getLabel('Message'), contentDiv, true]);

        this.addElementsToDivs(fieldArray, contentDiv);

        // Empty div due to float issue
        contentDiv.insert(new Element('div', { 'class': 'FWK_EmptyDiv' }));

        this.openScreen(new Element('div', { 'class': 'application_main_title2' }).update('New Request'));

        new unmWidget($H({
            title: this.labels.get('REQUESTINFO'),
            collapseBut: true,
            targetDiv: this.createNewReqDiv,
            contentHTML: contentDiv.innerHTML
        }));

        this.acServiceGroup =
            new JSONAutocompleter(divAutoC.identify(),
                {
                    showEverythingOnButtonClick: true,
                    virtualVariables: true,
                    events:
                        $H({
                            onResultSelected: 'EWS:applicationInbox_serviceSelected'
                        })
                }, jsonList);

        this.fillServiceGroups();

        this.acService = new JSONAutocompleter(divAutoC2.identify(), { showEverythingOnButtonClick: true, virtualVariables: true }, jsonList2);

        // Buttons

        var jsonButton = { elements: [] };

        var create = {
            label: global.getLabel('Create'),
            idButton: 'applicationInbox_createButton',
            className: 'applicationInbox_submitButtonsStyle',
            handlerContext: null,
            handler: this.createButtonHandler.bind(this),
            type: 'button',
            standardButton: true
        };

        var cancel = {
            label: global.getLabel('Cancel'),
            idButton: 'applicationInbox_cancelButton',
            className: 'applicationInbox_submitButtonsStyle',
            handlerContext: null,
            handler: this.cancelButtonHandler.bind(this),
            type: 'button',
            standardButton: true
        };

        jsonButton.elements.push(create);
        jsonButton.elements.push(cancel);

        this.createNewReqDiv.insert(new megaButtonDisplayer(jsonButton).getButtons());
        this.createNewReqDiv.show();
    },

    /*
    * @method onServiceSelected
    * @desc Fills services according to the service group selected
    */

    onServiceSelected: function() {

        var grpid = this.acServiceGroup.getValue().idAdded;

        var xml = '<EWS>' +
                    '<SERVICE>GET_FIELD_SRVD</SERVICE>' +
                    '<OBJ TYPE="P">' + global.objectId + '</OBJ>' +
                    '<PARAM>' +
                    '<APPID>INBOXSCM</APPID>' +
                    '<FIELD FIELDID="SRVID" FIELDTECHNAME="SRVID" VALUE=""/>' +
                    '<DEP_FIELDS>' +
                    '<FIELD FIELDID="GRPID" FIELDTECHNAME="GRPID" VALUE="' + grpid + '"/>' +
                    '</DEP_FIELDS>' +
                    '</PARAM>' +
                    '<DEL/>' +
                    '</EWS>';

        this.makeAJAXrequest($H({ xml: xml, successMethod: this.loadDataIntoAC.bind(this, this.acService) }));

    },

    /*
    * @method fillServices
    * @desc Fills the Services autocompleter
    */

    fillServiceGroups: function() {

        var xml = '<EWS>' +
                    '<SERVICE>GET_FIELD_GRPD</SERVICE>' +
                    '<OBJ TYPE="P">' + global.objectId + '</OBJ>' +
                    '<PARAM>' +
                    '<APPID>INBOXSCM</APPID>' +
                    '<FIELD FIELDID="GRPID" FIELDTECHNAME="GRPID" VALUE=""/>' +
                    '</PARAM>' +
                    '<DEL/>' +
                    '</EWS>';

        this.makeAJAXrequest($H({ xml: xml, successMethod: this.loadDataIntoAC.bind(this, this.acServiceGroup) }));
    },

    /* 
    * @method loadDataIntoAC
    * @desc Loads the data in json into an autocompleter
    * @param json {Json} Data to be loaded
    * @param ac {AutoCompleter} Autocompleter to be filled
    */

    loadDataIntoAC: function(ac, json) {

        var valuesList = {
            autocompleter: {
                object: $A()
            }
        };

        var data = json.EWS.o_values;

        if (data) {
            objectToArray(data.item).each(function(item) {
                valuesList.autocompleter.object.push({
                    "data": item["@id"],
                    "text": item["@value"]
                });
            } .bind(this));
        }

        ac.clearInput();
        ac.updateInput(valuesList);
    },

    /*
    * @method createButtonHandler
    * @desc Creates a new HR request
    */

    createButtonHandler: function() {

        var grpid = this.acServiceGroup.getValue().idAdded;
        var srvid = this.acService.getValue().idAdded;
        var stext = this.createNewReqDiv.down("[id=applicationInbox_newReqDesc]").value;
        var etext = this.createNewReqDiv.down("[id=applicationInbox_newReqText]").value;

        var xml = '<EWS>' +
                    '<SERVICE>INBOX_CRE_REQ</SERVICE>' +
                    '<PARAM>' +
                    '<I_ACTION>C</I_ACTION>' +
                    '<I_REQUEST GRPID="' + grpid + '" SRVID="' + srvid + '" STEXT="' + stext + '" ETEXT="' + etext + '" />' +
                    '</PARAM>' +
                    '</EWS>';

        this.makeAJAXrequest($H({ xml: xml, successMethod: this.createNewReqOK.bind(this) }));

    },

    /*
    * @method createNewReqOK
    * @desc Uploads the pending requests table and goes back
    */

    createNewReqOK: function() {

        this.getPendReq();
        this.cancelButtonHandler();
    },

    /*
    * @method cancelButtonHandler
    * @desc Cancels the creation of a new HR request
    */

    cancelButtonHandler: function() {

        this.inDetails = false;
        this.virtualHtml.down('[id=applicationInbox_up]').show();
        this.virtualHtml.down('[id=applicationInbox_down]').show();
        this.virtualHtml.down('.applicationInbox_pendContent').show();
        this.taskTitleDiv.show();
        this.pendingContentDiv.show();
        this.hideTitle();
        this.createNewReqDiv.hide();
    },

    /*
    * @method addDescriptionButtonHandler
    * @desc Shows options to reply
    * @param json Json details
    */

    addDescriptionButtonHandler: function(json, scm, action) {

        this.approvedSCM = (scm) ? json.EWS.o_list.yglui_str_pending_list['@approve'] : json.EWS.o_list.yglui_str_inbox_list['@approve'];
        this.replyFieldsDiv.show();
        this.descriptionAction = action;

        if (!Object.isEmpty(this.approvedSCM)) {
            this.buttonsToApproveDiv.hide();
            this.buttonsNotToApproveDiv.show();
        }
        else {
            this.generalButtonsDiv.hide();
            this.buttonsNotToApproveDiv.show();
        }


    },

    /* 
    * @method approveButtonHandler
    * @desc Approves HR requests
    */

    approveButtonHandler: function(scm, hrId) {

        this.submitTask(this.req_id, "0001", this.commentDetails.value);
        this.taskDetailsExit();
    },

    /*
    * @method auxRejectButtonHandler
    * @desc Rejects HR requests
    */

    auxRejectButtonHandler: function(scm, hrId) {

        this.submitTask(this.req_id, "0002", this.commentDetails.value);
        this.taskDetailsExit();

    },

    /*
    * @method exitNotApprovedButtonHandler
    * @desc Exits from approved screen
    */

    exitNotApprovedButtonHandler: function() {

        this.replyFieldsDiv.hide();
        this.buttonsToApproveDiv.hide();
        this.generalButtonsDiv.show();
    },

    /*
    * @method submitButtonHandler
    * @desc Submits an approved request
    */
    submitButtonHandler: function(args) {
        var xml = '<EWS>' +
                    '<SERVICE>INBOX_UPD_REQ</SERVICE>' +
                    '<PARAM>' +
                    '<I_ACTION>' + this.descriptionAction + '</I_ACTION>' +
                    '<I_REQ_ID>' + this.req_id + '</I_REQ_ID>' +
                    '<I_HRWID>' + this.hrwid + '</I_HRWID>' +
                    '<I_ETEXT>' + this.etext.value + '</I_ETEXT>' +
                    '</PARAM>' +
                    '</EWS>';

        this.makeAJAXrequest($H({ xml: xml, successMethod: this.taskDetailsExit.bind(this) }));
    },

    /*
    * @method closeRequestInfo
    * @desc Closes the information screen for editing requests
    */

    closeRequestInfo: function() {
        this.replyFieldsDiv.hide();
        this.buttonsNotToApproveDiv.hide();
        this.generalButtonsDiv.show();
        this.clearFilesToUploadtable();
    },

    /*
    * @method successUpload
    * @desc To be run when a file has been successfully uploaded
    */

    successUpload: function() {

        var message = 'Request was successfully';
        var contentHTML = new Element('div');
        contentHTML.insert(message);

        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };

        var functionClose = function() {
            popUp.close();
            delete popUp;
            this.closeRequestInfo();
        };

        var auxClose = {
            idButton: 'ok',
            label: 'OK',
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: functionClose,
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(auxClose);
        contentHTML.insert(new megaButtonDisplayer(buttonsJson).getButtons());

        var popUp = new infoPopUp({
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350,
            showCloseButton: false
        });

    },

    /*
    * @method clearFilesToUploadtable
    * @desc Clears the files to be uploaded
    */

    clearFilesToUploadtable: function() {

        var tbody = this.replyFieldsDiv.select('[id=applicationInbox_filesToUploadTable]')[0].select('tbody')[0];
        tbody.update("");
        this.filesToBeUploaded.clear();
    },

    /*
    * @method exitApprovedButtonHandler
    * @desc Exits from approved requests screen
    */

    exitApprovedButtonHandler: function() {
        if (!Object.isEmpty(this.approvedSCM)) {
            this.buttonsToApproveDiv.show();
            this.buttonsNotToApproveDiv.hide();
        }
        else {
            this.generalButtonsDiv.show();
            this.buttonsNotToApproveDiv.hide();
        }
    },

    /*
    * @method uploadButtonHandler
    * @desc Performs actions to upload a file
    */

    uploadButtonHandler: function() {

        // Gets send via, document type and file name for the selected

        var svSelected = this.getSendViaSelected();
        var dtSelected = this.docTypeAutoComp.getValue().idAdded;
        var fnSelected = this.getFileNameToUpload();

        // Find table to update

        var tbody = this.replyFieldsDiv.select('[id=applicationInbox_filesToUploadTable]')[0].select('tbody')[0];
        var newRow = new Element('tr');

        newRow.insert(new Element('td').update(this.sendViaTypes.get(svSelected)));
        newRow.insert(new Element('td').update(this.docTypes.get(dtSelected)));
        newRow.insert(new Element('td').update(fnSelected));

        tbody.insert(newRow);
        this.filesToBeUploaded.push({ sv: svSelected, dt: dtSelected, fn: fnSelected });
    },

    /*
    * @method getFileNameToUpload
    * @desc Gets the file name that should be uploaded
    * @returns File name in file selector in new document part
    */

    getFileNameToUpload: function() {
        var fileField = this.replyFieldsDiv.select('[id=applicationInbox_uploadFile]')[0].select('[type=file]')[0];
        return fileField.value;
    },

    /*
    * @method getSendViaSelected
    * @desc Gets the send via type selected in the new document part
    * @returns Value of the selected radio button
    */

    getSendViaSelected: function() {

        var rButton = this.replyFieldsDiv.select('[id=applicationInbox_sendVia]')[0].select('[name=sendViaType]');
        var size = rButton.size();
        var found = false;
        var value = null;
        var i = 0;

        while ((i < size) && !found) {
            if (rButton[i].checked) {
                value = rButton[i].value;
                found = true;
            }
            else
                i++;
        }

        return value;
    },

    /**
    *@description Selects all the inbox tasks when the selectAll checkbox is checked
    */
    selectAll: function() {
        if (this.virtualHtml.down('[id=applicationInbox_selectAll]').checked) {
            this.data.each(function(element) {
                if ((!this.selectedRows.get(element.key)) && (this.table.rows.get(element.key).visible())) {
                    this.selectedRows.set(element.key, element.key);

                    var input = this.table.rows.get(element.key).down('.applicationInbox_tdCheckbox');

                    if (!Object.isEmpty(input))
                        input.checked = true;
                }
            } .bind(this));
        } else {
            this.data.each(function(element) {

                if (this.selectedRows.get(element.key)) {
                    this.selectedRows.unset(element.key);

                    var input = this.table.rows.get(element.key).down('.applicationInbox_tdCheckbox');

                    if (!Object.isEmpty(input))
                        input.checked = false;
                }
            } .bind(this));
        }
        if (this.selectedRows.size() == 0) {
            $A(this.virtualHtml.select('.applicationInbox_submitButtonsStyle')).each(function(button) {
                this.buttons.get(button.id).disable(button.id);
            } .bind(this));
        } else {
            $A(this.virtualHtml.select('.applicationInbox_submitButtonsStyle')).each(function(button) {
                this.buttons.get(button.id).enable(button.id);
            } .bind(this));
        }
    },

    /*
    *@description Shows the a detailed screen
    *@param title {String} Title for the screen to be shown
    */
    openScreen: function(title) {
        this.inDetails = true;
        this.virtualHtml.down('[id=applicationInbox_filters]').hide();
        this.virtualHtml.down('[id=applicationInbox_up]').hide();
        this.virtualHtml.down('[id=applicationInbox_down]').hide();
        this.virtualHtml.down('.applicationInbox_pendContent').hide();
        this.taskTitleDiv.hide();
        this.pendingContentDiv.hide();
        this.updateTitle(global.getLabel(title));
    },

    /**
    *@description Hides the task Details screen, showing the main inbox screen
    */
    closeDetails: function() {
        this.inDetails = false;
        this.virtualHtml.down('[id=applicationInbox_up]').show();
        this.virtualHtml.down('[id=applicationInbox_down]').show();
        this.virtualHtml.down('.applicationInbox_pendContent').show();
        this.virtualHtml.down('[id=applicationInbox_downDetails]').update();

        this.virtualHtml.down('[id=applicationInbox_filters_pend]').show();
        this.virtualHtml.down('[id=applicationInbox_up_pend]').show();
        this.virtualHtml.down('[id=applicationInbox_pendingDown]').show();
        this.taskTitleDiv.hide();
        this.pendingContentDiv.show();
        if (this.descriptionAction == 'C')
            this.getPendReq();
        else if (this.descriptionAction == 'A' || this.descriptionAction == 'R')
            this.refreshInbox();
    },

    /**
    *@param {Event} event Click on the inbox item line to show its details
    *@description Shows the task(id) details if they have already requested to the back-end, if not, requests
    *to the back-end for the task(id) details
    */
    showDetails: function(event) {

        var reqId = getArgs(event);
        var scm = false;
        var service;

        // Check if the id is a SCM (pending request) or a task

        if (!Object.isEmpty(this.data.get(reqId))) {
            if (this.data.get(reqId)[2].get('pendr').toLowerCase() == "x") {
                scm = true;
                service = '<SERVICE>GET_PENDR_LST</SERVICE>';
            }
            else {
                service = '<SERVICE>GET_INBOX_LST</SERVICE>';
            }
        }
        else {
            scm = true;
            service = '<SERVICE>GET_PENDR_LST</SERVICE>';
        }

        var xmlService = '<EWS>'
			+ service
			+ '<PARAM>'
			+ '<I_ACTION>D</I_ACTION>'
			+ '<I_REQ_ID>' + getArgs(event) + '</I_REQ_ID>'
			+ '</PARAM>'
			+ '<DEL />'
			+ '</EWS>';

        this.makeAJAXrequest($H({
            xml: xmlService,
            successMethod: this.updateDetails.bind(this, scm)
        }));
    },

    /**
    *@param {Event} event Event called when the user select a checkbox for an item
    *@description Adds/removes a task(id) from the selectedRows class attribute
    */
    selectRow: function(event) {
        var rowId = getArgs(event);
        if (this.selectedRows.get(rowId)) {
            this.selectedRows.unset(rowId);
        } else {
            this.selectedRows.set(rowId, rowId);
        }
        if (this.selectedRows.size() == 0) {
            $A(this.virtualHtml.select('.applicationInbox_submitButtonsStyle')).each(function(button) {
                this.buttons.get(button.id).disable(button.id);
            } .bind(this));
        } else {
            $A(this.virtualHtml.select('.applicationInbox_submitButtonsStyle')).each(function(button) {
                this.buttons.get(button.id).enable(button.id);
            } .bind(this));
        }

    },
    /**
    *@param {Event} event Event called when the user start editing a complex search 
    *@description This function is triggered when doing focus on the text field, and eliminates the help text
    */
    fieldFocus: function(event) {
        Event.element(event).value = '';
        this.fieldKeyUp(event);
    }

});

/**
*@class inboxTable
*@description The inbox table instantiates this class
*/
var InboxTable = Class.create({
    /**
    *@type String
    *@description table html code
    */
    html: '',

    /**
    *@type Element 
    *@description parent table Element
    */
    domLive: null,

    /**
    *@type String
    *@description Code used to indicate an approval
    */
    approveCode: null,

    /**
    *@type String
    *@description Code used to indicate a reject
    */
    rejectCode: null,

    /**
    *@type Template 
    *@description Every row has its html structure
    */
    rowContentTemplate: new Template('<td class="applicationInbox_table_type">'
			+ '<div class="applicationInbox_div_tdSepCheckbox">'
			+ '<input #{selected} class="applicationInbox_tdCheckbox" type="checkbox"/>'
			+ '</div>'
			+ '<div class="applicationInbox_div_tdSepText applicationInbox_table_row">'
			+ '<span class="application_action_link">#{type}</span>'
			+ '</div>'
			+ '</td>'
			+ '<td class="applicationInbox_table_description">'
			+ '<div class="applicationInbox_table_row">#{description}</div>'
			+ '</td>'
			+ '<td class="applicationInbox_table_requestedBy">'
			+ '<span class="applicationInbox_table_row">#{requestedBy}</span>'
			+ '</td>'
			+ '<td class="applicationInbox_table_requestedBy">'
			+ '<span class="applicationInbox_table_row">#{onBehalfOf}</span>'
			+ '</td>'
			+ '<td class="applicationInbox_table_date dateInbox">'
			+ '<span class="applicationInbox_table_row">#{date}</span>'
			+ '</td>'),

    /**
    *@type Template 
    *@description Every row has its html structure
    */
    rowContentSCMTemplate: new Template('<td class="applicationInbox_table_type">'
			+ '<div class="applicationInbox_div_tdSepText applicationInbox_table_row">'
			+ '<span class="application_action_link">#{type}</span>'
			+ '</div>'
			+ '</td>'
			+ '<td class="applicationInbox_table_description">'
			+ '<div class="applicationInbox_table_row">#{description}</div>'
			+ '</td>'
			+ '<td class="applicationInbox_table_requestedBy">'
			+ '<span class="applicationInbox_table_row">#{status}</span>'
			+ '</td>'
			+ '<td class="applicationInbox_table_date dateInbox">'
			+ '<span class="applicationInbox_table_row">#{date}</span>'
			+ '</td>'
			+ '<td class="applicationInbox_table_date dateInbox">'
			+ '<span class="applicationInbox_table_row">#{hrwid}</span>'
			+ '</td>'),

    /*
    *@type Hash 
    *@description Hash that keeps all the table rows Elements(really easy to access, modify, add and delete any row)
    */
    rows: $H({}),
    objs: $H({}),

    SCMrows: $H({}),
    SCMobjs: $H({}),

    initialize: function(target, header, parentInbox, scm) {
        this.target = target;
        this.approveCode = parentInbox.approveCode;
        this.rejectCode = parentInbox.rejectCode;
        var tableElement = $(target);

        if (!Object.isEmpty(scm)) {
            this.scm = true;
            this.html = '<table class="sortable applicationInbox_table_size" id="SCM_resultsTable">'
			+ '<thead>'
			+ '<tr>'
			+ '<th class="applicationInbox_table_type">&nbsp;&nbsp;' + header.type + '</th>'
			+ '<th class="applicationInbox_table_description">' + header.description + '</th>'
			+ '<th class="applicationInbox_table_requestedBy">' + header.status + '</th>'
			+ '<th class="table_sortfirstdesc applicationInbox_table_date dateInbox">' + header.date + '</th>'
			+ '<th class="applicationInbox_table_requestedBy">' + header.hrwid + '</th>'
			+ '</tr>'
			+ '</thead>'
			+ '<tbody>'
			+ '</tbody>'
			+ '</table>';

            var newRow = new Element('tr', { 'id': 'applicationInbox_noMatches_SCM' });
            newRow.insert("<td>&nbsp;</td><td>" + parentInbox.labels.get('NoInboxRequest') + "</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>");
            this.SCMrows = new Hash();
            this.SCMrows.set(0, newRow);

            if (Object.isEmpty(tableElement.down('thead'))) {
                tableElement.insert(this.html);
                tableElement.down('tbody').insert(newRow);
            }
            else {
                tableElement.down('tbody').update(newRow);
                TableKit.reloadTable("SCM_resultsTable");
            }
        }
        else {
            this.html =
				'<input id="applicationInbox_selectAll" type="checkbox" class="applicationInbox_selectAllInput"/>'
			+ '<span class="application_title_text applicationInbox_selectAllText">' + global.getLabel('selectUnselectAll') + '</span>'
			+ '<table class="sortable applicationInbox_table_size" id="Inbox_resultsTable">'
			+ '<thead>'
			+ '<tr>'
			+ '<th class="applicationInbox_table_type">&nbsp;&nbsp;' + header.type + '</th>'
			+ '<th class="applicationInbox_table_description">' + header.description + '</th>'
			+ '<th class="applicationInbox_table_requestedBy">' + header.requestedBy + '</th>'
			+ '<th class="applicationInbox_table_requestedBy">' + header.onBehalfOf + '</th>'
			+ '<th class="table_sortfirstdesc applicationInbox_table_date dateInbox">' + header.date + '</th>'
			+ '</tr>'
			+ '</thead>'
			+ '<tbody>'
			+ '</tbody>'
			+ '</table>';

            this.domLive = new Element('div');
            this.domLive.update(this.html);
            this.domLive.down('[id=applicationInbox_selectAll]').observe('click', function(event) {
                document.fire('EWS:applicationInbox_selectAll')
            });

            var newRow = new Element('tr', { 'id': 'applicationInbox_noMatches' });
            newRow.insert("<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>");
            this.rows.set(0, newRow);
            this.domLive.down('tbody').insert(newRow);
            tableElement.insert(this.domLive);
        }
    },

    /**
    *@param rowsHash {Hash} hash that keeps all the rows we want to add to the table
    *@description Adds several row to the table, and reloads(TableKit) it
    */
    insertRows: function(rowsHash, scm) {
        // If there are several elements, remove the initial line
        if (scm != "SCM") {
            if (rowsHash.size() > 0)
                $('applicationInbox_noMatches').remove();

            this.rows = new Hash();

            rowsHash.each(function(element) {
                this.insertSingleRow(element.value, false);
            } .bind(this));
            TableKit.reloadTable("Inbox_resultsTable");
        }
        else {
            if (rowsHash.size() > 0)
                $('applicationInbox_noMatches_SCM').remove();

            this.SCMrows = new Hash();

            rowsHash.each(function(element) {
                this.insertSingleRow(element.value, false, "SCM");
            } .bind(this));
            TableKit.reloadTable("SCM_resultsTable");
        }
    },

    /**
    *@param singleRow {Hash} row to be inserted
    *@param reLoad {boolean} if the table(TableKit) has to be reloaded
    *@description Inserts a row in the table(and reloads it if it´s the case)
    */
    insertSingleRow: function(singleRow, reLoad, scm) {
        if (scm == 'SCM') {
            var selection =
		    {
		        index: singleRow.get('index'),
		        type: singleRow.get('type'),
		        description: singleRow.get('description'),
		        onBehalfOf: singleRow.get('onBehalfOf'),
		        status: singleRow.get('status'),
		        date: singleRow.get('date'),
		        javas: singleRow.get('javas'),
		        hrwid: singleRow.get('hrwid')
		    };
        }
        else {
            var selection =
		    {
		        index: singleRow.get('index'),
		        type: singleRow.get('type'),
		        description: singleRow.get('description'),
		        requestedBy: singleRow.get('requestedBy'),
		        onBehalfOf: singleRow.get('onBehalfOf'),
		        status: singleRow.get('status'),
		        date: singleRow.get('date'),
		        javas: singleRow.get('javas'),
		        hrwid: singleRow.get('hrwid')
		    };
        }
        //we create a new tr Element
        var newRow = new Element('tr');
        //and its html is created with our rowContentTemplate Template help
        if (scm != "SCM") {
            newRow.insert(this.getTaskDetailsRow(singleRow.get('pendr'), selection));
            this.rows.set(singleRow.get('index'), newRow);
            this.domLive.down('tbody').insert(newRow);
        }
        else {
            newRow.insert(this.rowContentSCMTemplate.evaluate(selection));
            this.SCMrows.set(singleRow.get('index'), newRow);
            $(this.target).down('tbody').insert(newRow);
        }

        // row is highlighted when hotspot is flagged
        if (singleRow.get('hotspot').toLowerCase() == "x")
            newRow.addClassName('highlighted');

        //the attribute rows has one more row

        //inserting the newRow into the html

        var obj = {
            fx: function(args) {
                var elem = Event.element(args);
                //if is the taks row checkbox
                if ((!elem.hasClassName('applicationInbox_tdCheckbox')) && elem.up().hasClassName('applicationInbox_div_tdSepText')) {
                    this[selection.javas](singleRow.get('index'));
                } else if (elem.hasClassName('applicationInbox_tdCheckbox')) {//if not
                    document.fire('EWS:applicationInbox_rowSelected', this.rows.index(newRow));
                }
            } .bind(this)
        };
        obj.bfx = obj.fx.bindAsEventListener(obj);
        this.objs.set(singleRow.get('index'), obj);
        //the newRow has something to execute when clicking on it
        if (selection.javas) {
            newRow.observe('click', obj.bfx);
        }
        if (reLoad) TableKit.reloadTable("Inbox_resultsTable");
    },

    /**
    *@param rowsHash {Hash} all the rows to be deleted from the table
    *@description deletes several rows from the table and reloads(TableKit) it
    */
    deleteRows: function(rowsHash) {
        rowsHash.each(function(element) {
            this.deleteSingleRow(element.value.get('index'), false);
        } .bind(this));
        TableKit.reloadTable("Inbox_resultsTable");
    },

    /**
    *@param id {String} row id to be deleted
    *@param reLoad {boolean} if the table(TableKit) has to be reloaded
    *@description Deletes a row(id) from the table(and reloads it if it´s the case)
    */
    deleteSingleRow: function(id, reLoad) {
        this.rows.get(id).remove();
        if (reLoad) TableKit.reloadTable("Inbox_resultsTable");
        this.rows.unset(id);
        this.objs.unset(id);
    },

    /**
    *@param id {String} row id to be shown
    *@description Shows a row(id) in the table and indicate if it was visible previously.
    *@return Boolean
    */
    showSingleRow: function(id, scm) {

        var visibleBefore;

        if (scm != "SCM") {
            visibleBefore = (this.rows.get(id).visible());
            this.rows.get(id).show();
        }
        else {
            visibleBefore = (this.SCMrows.get(id).visible());
            this.SCMrows.get(id).show();
        }
        return visibleBefore;
    },

    /**
    *@param id {String} row id to be hidden
    *@description Hides a row(id) in the table and indicate if the row was previously hidden
    *@return Boolean
    */
    hideSingleRow: function(id, scm) {
        if (scm != 'SCM') {
            var hiddenBefore = !(this.rows.get(id).visible());
            this.rows.get(id).hide();
        }
        else {
            var hiddenBefore = !(this.SCMrows.get(id).visible());
            this.SCMrows.get(id).hide();
        }
        return hiddenBefore;
    },

    /**
    *@param id {String} row id to be modified
    *@param html {String} html code to assign to this row(id) innetHTML attribute
    *@description Updates a row(id) innerHTML with the hmtl parameter code
    */
    modifyRow: function(id, html, scm) {
        if (scm != "SCM")
            this.rows.get(id).update(html);
        else
            this.SCMrows.get(id).update(html);
    },

    /**
    *@param {String} id Row id to be color changed
    *@param {String} actionType Indicate the type of action to select a color
    *@description changes a row(id) color depending on the row state(approved or declined)
    */
    changeRowColor: function(id, actionType) {
        var row = this.rows.get(id);
        var classname = '';

        switch (actionType) {
            case this.approveCode:
                classname = 'eeColor10';
                break;
            case this.rejectCode:
                classname = 'eeColor01';
                break;
            default:
                classname = 'eeColor06';
                break;
        }

        row.removeClassName(row.className);
        row.addClassName(classname);

        row.childElements().each(function(td) {
            var span = td.down('span');
            if (span) span.addClassName(classname);
        });
    },

    /**
    *@param {String} id task row id 
    *@description Start the display of the show details
    */
    openTaskDetails: function(id) {
        document.fire('EWS:applicationInbox_openTaskDetails', id);
    },

    /**
    * @method getTaskDetailsRow
    * @desc Gets the HTML code for a row in Task Details
    * @param id Row id
    * @returns HTML for the now
    */

    getTaskDetailsRow: function(pendr, info) {

        var html = '<td class="applicationInbox_table_type">'
        html += '<div class="applicationInbox_div_tdSepCheckbox">';

        if (pendr.toLowerCase() != "x") {

            var selected = (!Object.isEmpty(info.selected)) ? info.selected : "";
            html += '<input class="applicationInbox_tdCheckbox" type="checkbox" ' + selected + '/>';
        }
        else
            html += '&nbsp;';

        html += '</div>';

        html += '<div class="applicationInbox_div_tdSepText applicationInbox_table_row">'
			+ '<span class="application_action_link">' + info.type + '</span>'
			+ '</div>'
			+ '</td>'
			+ '<td class="applicationInbox_table_description">'
			+ '<div class="applicationInbox_table_row">' + info.description + '</div>'
			+ '</td>'
			+ '<td class="applicationInbox_table_requestedBy">'
			+ '<span class="applicationInbox_table_row">' + info.requestedBy + '</span>'
			+ '</td>'
			+ '<td class="applicationInbox_table_requestedBy">'
			+ '<span class="applicationInbox_table_row">' + info.onBehalfOf + '</span>'
			+ '</td>'
			+ '<td class="applicationInbox_table_date dateInbox">'
			+ '<span class="applicationInbox_table_row">' + info.date + '</span>'
			+ '</td>';

        return html;

    }

});