var LegalHolds = new Class.create(Application,

{
    currentScrollTop: 0,
    initialize: function($super, args) {
        $super(args);

        this.toggleFilterHandlerBinding = this.toggleFilterHandler.bindAsEventListener(this);
        this.empSlctChangeHandlerBinding = this.empSlctChangeHandler.bindAsEventListener(this);
        this.dateHandlerBinding = this.dateHandler.bindAsEventListener(this);
        this.searchFocusHandlerBinding = this.searchFocusHandler.bindAsEventListener(this);
        this.searchBlurHandlerBinding = this.searchBlurHandler.bindAsEventListener(this);
        this.searchKeyupHandlerBinding = this.searchKeyupHandler.bindAsEventListener(this);
        this.removeHoldHandlerBinding = this.removeHoldHandler.bindAsEventListener(this);
        this.viewFileHandlerBinding = this.viewFileHandler.bindAsEventListener(this);
        this.empHoldSlctHandlerBinding = this.empHoldSlctHandler.bindAsEventListener(this);

        this.addHoldHandlerBinding = this.addHoldHandler.bindAsEventListener(this);

        document.observe('EWS:legalHoldEmpSelected', this.empSlctChangeHandlerBinding);
        document.observe('EWS:legalHoldEmpHoldSelected', this.empHoldSlctHandlerBinding);

        this.page = 1;


    },

    empHoldSlctHandler: function(evt) {
        if (this.empHoldAutocompleter.element.value) {
            $('legal_hold_add_hold').removeClassName('leftRoundedCornerDisable');
            $('legal_hold_add_hold').down().removeClassName('centerRoundedButtonDisable');
            $('legal_hold_add_hold').down().next().removeClassName('rightRoundedCornerDisable');
        } else {
            $('legal_hold_add_hold').addClassName('leftRoundedCornerDisable');
            $('legal_hold_add_hold').down().addClassName('centerRoundedButtonDisable');
            $('legal_hold_add_hold').down().next().addClassName('rightRoundedCornerDisable');
        }

    },

    addHoldHandler: function(evt) {
        var emp = this.empHoldAutocompleter.getValue().idAdded;
        if (emp) {
            var xmlin = ''
            + ' <EWS>'
            + '     <SERVICE>DM_NEW_HLD</SERVICE>'
			+ '		<OBJECT TYPE="P">' + emp + '</OBJECT>'
            + '     <PARAM>'
		    + '         <I_V_COMMENT>' + this.virtualHtml.down('textarea').value + '</I_V_COMMENT>'
            + '     </PARAM>'
            + ' </EWS>';

            this.makeAJAXrequest($H({ xml: xmlin,
                successMethod: 'addRemoveHoldCallback',
                xmlFormat: false
            }));
        }
    },

    addRemoveHoldCallback: function(json) {
        this.filterTable();
    },

    removeHoldHandler: function(evt) {
        var span = evt.element();
        if (!span) return;
        var emp = span.getAttribute("emp");
        if (emp) {
            var xmlin = ''
            + ' <EWS>'
            + '     <SERVICE>DM_REMOVE_HOLD</SERVICE>'
			+ '		<OBJECT TYPE="P">' + emp + '</OBJECT>'
            + ' </EWS>';

            this.makeAJAXrequest($H({ xml: xmlin,
                successMethod: 'addRemoveHoldCallback',
                xmlFormat: false
            }));
        }

    },

    viewFileHandler: function(evt) {

        var span = evt.element();
        if (!span) return;
        var emp = span.getAttribute("emp");
        var empName = span.getAttribute("empName");
        if (emp) {
            global.open($H({
                app: {
                    tabId: 'SC_DOCU',
                    appId: "DOC_L_MA",
                    view: 'MyDocuments'
                },
                emp: emp,
                empName: empName,
                fromOut: true
            }));
        }

    },

    close: function($super) {
        $super();
    },

    run: function($super, args) {
        $super(args);
        document.observe('EWS:legalHoldList', this.dateHandlerBinding);
        if (this.firstRun) {
            this.virtualHtml.update();
            this.buildlegalHoldList();
        }
    },

    searchFocusHandler: function() {
        $('legalHoldList_search').value = '';
        this.filterValues.search = '';
        this.filterTable();
        this.toggleClearFilter();
    },

    searchBlurHandler: function() {
        if ($('legalHoldList_search').value == '') {
            $('legalHoldList_search').value = global.getLabel('DM_SEARCH');
        }
        this.toggleClearFilter();
    },

    searchKeyupHandler: function() {
        this.filterValues.search = $('legalHoldList_search').value;
        this.filterTable();
        this.toggleClearFilter();
    },

    dateHandler: function() {
        if (this.begDatePicker.actualDate && this.endDatePicker.actualDate) {
            this.filterValues.from = this.begDatePicker.actualDate;
            this.filterValues.to = this.endDatePicker.actualDate;
            this.filterTable();
        }
        this.toggleClearFilter();
    },

    toggleFilterHandler: function() {
        $('legalHoldListH1Div').toggle();
    },

    empSlctChangeHandler: function(evt) {

        var emp = '';
        if (evt.memo && evt.memo.textAdded) {
            emp = evt.memo.textAdded;
        }
        this.filterValues.emp = emp;
        this.filterTable();
        this.toggleClearFilter();

    },

    clearFilterHandler: function() {
        $('legalHoldList_search').value = global.getLabel('DM_SEARCH');
        this.empAutocompleter.clearInput();
        this.begDatePicker.clearFields();
        this.endDatePicker.clearFields();

        this.filterValues.from = '';
        this.filterValues.to = '';
        this.filterValues.search = '';
        this.filterValues.emp = '';
        this.filterTable();
        this.toggleClearFilter();
    },

    toggleClearFilter: function() {
        if ((this.filterValues.search)
        || ((this.filterValues.from) || (this.filterValues.to))
        || (this.filterValues.emp)) {
            $('legalHoldList_clearFilter').show();
        } else {
            $('legalHoldList_clearFilter').hide();
        }
    },

    filterValues: {
        search: '',
        from: '',
        to: '',
        emp: ''
    },

    originalTable: '',

    filterTable: function() {

        this.listContainer.stopObserving('scroll');
        this.listContainer.observe('scroll', this.scrollHandler.bind(this));
        this.currentScrollTop = 0;

        var emp = this.empAutocompleter.getValue();
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_LISTHOLD</SERVICE>';
        if (emp) {
            xmlin += '<OBJECT TYPE="P">' + emp.idAdded + '</OBJECT>';

        }
        xmlin += '     <DEL/><GCC/><LCC/>'
        + '     <PARAM>'
        + '         <I_V_PAGE>' + this.page + '</I_V_PAGE>'
        + '         <I_V_DATE_FROM>' + this.filterValues.from.toString('yyyyMMdd') + '</I_V_DATE_FROM>'
        + '         <I_V_DATE_TO>' + this.filterValues.to.toString('yyyyMMdd') + '</I_V_DATE_TO>'
        + '         <I_V_SRCH_PATTERN>' + this.filterValues.search + '</I_V_SRCH_PATTERN>'
        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'updateTable',
            xmlFormat: false
        }));

    },


    updateTable: function(json) {
        this.json = json;
        if (!json.EWS.o_i_hold_list || !json.EWS.o_i_hold_list.yglui_str_ecm_hold_filtlist) {
            this.listContainer.update('<span style="padding:2px;">' + global.getLabel('DML_NO_DATA_FOUND') + '.</span>');
            return;
        }

        var items = json.EWS.o_i_hold_list.yglui_str_ecm_hold_filtlist;
        if (!items.length) {
            items = new Array(items);
        }
        var j = 0;
        items.each(function(item) {
            if (item) {
                j++;
            }
        });
        var table = '<table style="float:left;with:100%;" class="sortable resizable body">' +
        '<thead style="display:none;">' +
        '         <tr style="position:relative;top:0px;">' +
                    '<th width="30%" class="table_sortfirstdesc" id="Th_EMPLOYEE">' + global.getLabel('DML_EMPLOYEE') + '</th>' +
                    '<th width="20%">' + global.getLabel('DML_DATE') + '</th>' +
                    '<th width="30%">' + global.getLabel('DML_COMMENT') + '</th>' +
					'<th width="10%"></th>' +
					'<th width="10%"></th>' +
                '</tr>' +
			'</thead><tbody>';

        items.each(function(item) {
            if (!item) return;
            table += '<tr>' +
                    '<td width="30%">' + underlineSearch((item['@ee_name'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</td>' +
                    '<td width="20%">' + underlineSearch((item['@date'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</td>' +
                    '<td width="30%">' + underlineSearch((item['@comment'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</td>' +
					'<td width="10%"><span empName="' + item['@ee_name'] + '" emp="' + item['@ee_id'] + '" class="application_action_link view_file">' + global.getLabel('DML_VIEW_FILE') + '</span></td>' +
					'<td width="10%"><span emp="' + item['@ee_id'] + '" class="application_action_link remove_hold">' + global.getLabel('DML_REMOVE_HOLD') + '</span></td>' +
					'</td>' +
                '</tr>';
        } .bind(this));
        if (j == 0) {
            table += '<tr><td><span style="padding:2px;">' + global.getLabel('DML_NO_DATA_FOUND') + '.</span></td><td></td><td></td><td></td><td></td></tr>';
            this.listHeader.hide();
        }
        table += '</tbody></table>';


        this.listContainer.update(table);
        this.registerEventsRemoveHold();
        this.registerEventsViewFile();
        var table = new TableKit(this.listContainer.down('table.body'), {
            marginL: 10,
            autoLoad: false,
            resizable: false,
            sortable: false,
            stripe: true
        });
        TableKit.Rows.stripe(this.listContainer.down('table.body'));
    },




    buildlegalHoldList: function() {
        var html = '<span class="application_main_title">' + global.getLabel('DML_LEGAL_HOLD') + '</span><br/><br/>';


        html +=
		'<table>' +
			'<tr>' +
				'<td>' +
					'' + global.getLabel('DML_ADD_NEW_LEGAL_HOLD_FOR_ALL_DOCUMENTS') + ':' +
				'</td>' +
				'<td>' +
					'<div id="legalHoldListEmpNameSlctAdd"></div>' +
				'</td>' +
			'</tr>' +
			'<tr>' +
				'<td align="right" valign="top">' +
					'' + global.getLabel('DML_WITH_THE_FOLLOWING_COMMENTS') + ':' +
				'</td>' +
				'<td>' +
					'<textarea style="float:left;" rows="2" cols="20"></textarea>' +
				'</td>' +
			'</tr>' +
			'<tr>' +
				'<td></td>' +
				'<td align="right">' +
					'<div id="legal_hold_add_hold" class="leftRoundedCorner leftRoundedCornerDisable">' +
						'<span class="centerRoundedButton centerRoundedButtonDisable">' + global.getLabel('DML_ADD_HOLD') + '</span>' +
						'<span class="rightRoundedCorner rightRoundedCornerDisable"></span>' +
					'</div>' +
				'</td>' +
			'</tr>' +
		'</table>';


        html +=
		'<div id="legalHoldListH0Div" style="width: 100%;text-align:left;margin-bottom:10px;">' +
			'<div id="legalHoldListH01Div" style="width: 49%; float: left;">' +
			'</div>' +
			'<div id="legalHoldListH02Div" style="float: right;">' +
				'<span class="application_action_link" style="float:left;margin-right: 10px;">' + global.getLabel('DML_FILTER_OPTIONS') + '</span>' +
				'<input type="text" id="legalHoldList_search" value="' + global.getLabel('DM_SEARCH') + '" class="application_autocompleter_box"/>' +
				'<span id="legalHoldList_clearFilter" class="application_action_link" style="margin-left: 10px;">&nbsp;' + global.getLabel('DML_CLEAR_FILTER') + '</span>' +
			'</div>' +
		'</div>';

        html +=
		'<div id="legalHoldListH1Div" style="width: 100%; margin-top: 40px; margin-bottom: 10px;">' +
			'<span style="float: left;">' + global.getLabel('DML_FROM') + ' : </span>' +
			'<div id="legalHoldListFrom"></div>' +
			'<span style="float: left;">' + global.getLabel('DML_TO') + ' : </span>' +
			'<div id="legalHoldListTo"></div>' +
			'<div style="width:49%;float:right;text-align:right;">' +
			'	<span style="float: left;" id="legalHoldListEmpName">' + global.getLabel('DML_EMPLOYEE_NAME') + ' : </span>' +
			'	<div id="legalHoldListEmpNameSlct"></div>' +
			'</div>' +
		'<br/></div>';

        this.virtualHtml.insert(html);
        $('legalHoldList_clearFilter').hide();
        $('legalHoldList_clearFilter').observe('click', this.clearFilterHandler.bind(this));
        //init emp name hold autocompleter
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DM_SEARCH')
                }
            }
        }
        this.empHoldAutocompleter = new JSONAutocompleter('legalHoldListEmpNameSlctAdd', {
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1,
            events: $H({
                onResultSelected: 'EWS:legalHoldEmpHoldSelected'
            })
        }, json);


        //init emp name filter autocompleter
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DM_SEARCH')
                }
            }
        }
        this.empAutocompleter = new JSONAutocompleter('legalHoldListEmpNameSlct', {
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1,
            events: $H({ onResultSelected: 'EWS:legalHoldEmpSelected' })
        }, json);

        $('legalHoldListH02Div').down().observe('click', this.toggleFilterHandlerBinding);
        $('legalHoldListH1Div').hide();

        this.begDatePicker = new DatePicker('legalHoldListFrom', {
            draggable: true,
            events: $H({ correctDate: 'EWS:legalHoldList' })
        });
        this.endDatePicker = new DatePicker('legalHoldListTo', {
            draggable: true,
            events: $H({ correctDate: 'EWS:legalHoldList' })
        });
        this.begDatePicker.linkCalendar(this.endDatePicker);

        //$('legalHoldListDocTypSlct').observe('change', this.docTypeSlctChangeHandlerBinding);
        $('legal_hold_add_hold').observe('click', this.addHoldHandlerBinding);
        $('legalHoldList_search').observe('focus', this.searchFocusHandlerBinding);
        $('legalHoldList_search').observe('blur', this.searchBlurHandlerBinding);
        $('legalHoldList_search').observe('keyup', this.searchKeyupHandlerBinding);

        this.getEmployeesList();

        var table = '<table class="sortable resizable header" style="border:1px solid #DCD2CE;">' +
        '     <thead>' +
        '         <tr>' +
                    '<th class="table_sortcol table_sortColDesc text" width="30%" class="table_sortfirstdesc" id="Th_EMPLOYEE">' + global.getLabel('DML_EMPLOYEE') + '</th>' +
                    '<th class="table_sortcol date-iso" width="20%" id="Th_DATE">' + global.getLabel('DML_DATE') + '</th>' +
                    '<th class="table_sortcol text" width="30%" id="Th_COMMENT">' + global.getLabel('DML_COMMENT') + '</th>' +
					'<th class="table_sortcol" width="10%" id="Th_VIEW"></th>' +
					'<th class="table_sortcol" width="10%" id="Th_REMOVE"></th>' +
                '</tr>' +
            '</thead><tbody></tbody></table>';

        this.listHeader = new Element("div", {
            style: 'text-align:left;float:left;width:100%;border:1px solid #DCD2CE;";'
        }).update(table);

        this.listContainer = new Element("div", {
            id: 'legalHold_ListContainer',
            'class': 'legalHold_ListContainer',
            'style': 'text-align:left;float:left;width:100%;border:1px solid #DCD2CE;'
        }).update('<span style="padding:2px;">' + global.getLabel('') + '.</span>');

        this.virtualHtml.insert(this.listHeader);
        this.virtualHtml.insert(this.listContainer);

        this.getTable();

    },

    sortByEmployee: function() {
        this.orderEmp = -1 * this.orderEmp;
        if (this.orderEmp == -1) {
            $('Th_EMPLOYEE').addClassName('table_sortColAsc');
            $('Th_EMPLOYEE').removeClassName('table_sortColDesc');
        } else {
            $('Th_EMPLOYEE').addClassName('table_sortColDesc');
            $('Th_EMPLOYEE').removeClassName('table_sortColAsc');
        }

        TableKit.Sortable.sort(this.listContainer.down('table.body'), 1, this.orderEmp);
        TableKit.Rows.stripe(this.listContainer.down('table.body'));
    },

    sortByDate: function() {
        this.orderDate = -1 * this.orderDate;
        if (this.orderDate == -1) {
            $('Th_DATE').addClassName('table_sortColAsc');
            $('Th_DATE').removeClassName('table_sortColDesc');
        } else {
            $('Th_DATE').addClassName('table_sortColDesc');
            $('Th_DATE').removeClassName('table_sortColAsc');
        }
        TableKit.Sortable.sort(this.listContainer.down('table.body'), 2, this.orderDate);
        TableKit.Rows.stripe(this.listContainer.down('table.body'));
    },

    sortByComment: function() {
        this.orderComment = -1 * this.orderComment;
        if (this.orderComment == -1) {
            $('Th_COMMENT').addClassName('table_sortColAsc');
            $('Th_COMMENT').removeClassName('table_sortColDesc');
        } else {
            $('Th_COMMENT').addClassName('table_sortColDesc');
            $('Th_COMMENT').removeClassName('table_sortColAsc');
        }
        TableKit.Sortable.sort(this.listContainer.down('table.body'), 3, this.orderComment);
        TableKit.Rows.stripe(this.listContainer.down('table.body'));
    },

    getTable: function() {

        this.currentScrollTop = 0;
        this.listContainer.stopObserving('scroll');
        this.listContainer.observe('scroll', this.scrollHandler.bind(this));

        this.page = 1;
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_LISTHOLD</SERVICE>'
        //+ '     <OBJECT TYPE="P"/>'
        + '     <DEL/><GCC/><LCC/>'
        + '     <PARAM>'
        + '         <I_V_PAGE>' + this.page + '</I_V_PAGE>'
        + '         <I_V_DATE_FROM></I_V_DATE_FROM>'
        + '         <I_V_DATE_TO></I_V_DATE_TO>'
        + '         <I_V_SRCH_PATTERN></I_V_SRCH_PATTERN>'
        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildTable',
            xmlFormat: false
        }));

    },

    buildTable: function(json) {

        this.originalTable = json;
        this.json = json;

        if (!json.EWS.o_i_hold_list || !json.EWS.o_i_hold_list.yglui_str_ecm_hold_filtlist) {
            this.listContainer.update('<span style="padding:2px;">' + global.getLabel('DML_NO_DATA_FOUND') + '.</span>');
            return;
        }

        var items = json.EWS.o_i_hold_list.yglui_str_ecm_hold_filtlist;

        var j = 0;
        items.each(function(item) {
            if (item) {
                j++;
            }
        });

        var table = '<table style="float:left;with:100%;" class="sortable resizable body">' +
        '<thead style="display:none;">' +
        '         <tr style="position:relative;top:0px;">' +
                    '<th width="30%" class="table_sortfirstdesc" id="Th_EMPLOYEE">' + global.getLabel('DML_EMPLOYEE') + '</th>' +
                    '<th width="20%">' + global.getLabel('DML_DATE') + '</th>' +
                    '<th width="30%">' + global.getLabel('DML_COMMENT') + '</th>' +
					'<th width="10%"></th>' +
					'<th width="10%"></th>' +
                '</tr>' +
			'</thead><tbody>';

        if (!items.length) {
            items = new Array(items);
        }

        items.each(function(item) {
            if (!item) return;
            table += '<tr>' +
                    '<td width="30%">' + underlineSearch((item['@ee_name'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</td>' +
                    '<td width="20%">' + underlineSearch((item['@date'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</td>' +
                    '<td width="30%">' + underlineSearch((item['@comment'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</td>' +
					'<td width="10%"><span empName="' + item['@ee_name'] + '" emp="' + item['@ee_id'] + '" class="application_action_link view_file">' + global.getLabel('DML_VIEW_FILE') + '</span></td>' +
					'<td width="10%"><span emp="' + item['@ee_id'] + '" class="application_action_link remove_hold">' + global.getLabel('DML_REMOVE_HOLD') + '</span></td>' +
					'</td>' +
                '</tr>';
        } .bind(this));

        if (j == 0) {
            table += '<tr><td><span style="padding:2px;">' + global.getLabel('DML_NO_DATA_FOUND') + '.</span></td><td></td><td></td><td></td><td></td></tr>';
            this.listHeader.hide();
        }

        table += '</tbody></table></div>';

        this.listContainer.update(table);
        this.registerEventsRemoveHold();
        this.registerEventsViewFile();
        var table = new TableKit(this.listContainer.down('table.body'), {
            marginL: 10,
            autoLoad: false,
            resizable: false,
            sortable: false,
            stripe: true
        });
        TableKit.Rows.stripe(this.listContainer.down('table.body'));

        $('Th_EMPLOYEE').stopObserving('click');
        $('Th_DATE').stopObserving('click');
        $('Th_COMMENT').stopObserving('click');

        $('Th_EMPLOYEE').observe('click', this.sortByEmployee.bind(this));
        $('Th_DATE').observe('click', this.sortByDate.bind(this));
        $('Th_COMMENT').observe('click', this.sortByComment.bind(this));

        this.orderEmp = -1;
        this.orderDate = -1;
        this.orderComment = -1;

    },

    getEmployeesList: function() {
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>SEARCH</SERVICE>'
        + '     <DEL></DEL>'
        + '     <PARAM>'
        + '         <FIELD FIELDTECHNAME="OBJID" />'
        + '         <DEP_FIELDS>'
        + '             <FIELD FIELDTECHNAME="OTYPE" VALUE="P" />'
        + '         </DEP_FIELDS>'
        + '         <SEARCH_PATTERN />'
        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildEmployeesList',
            xmlFormat: false
        }));
    },

    buildEmployeesList: function(json) {
        var jsonObject = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DM_SEARCH')
                }
            }
        }
        if (json.EWS.o_values) {
            var items = json.EWS.o_values.item;
            for (var i = 0; i < items.length; i++) {
                jsonObject.autocompleter.object.push({
                    data: items[i]["@id"],
                    text: items[i]["@value"]
                })
            }
        }
        this.empAutocompleter.updateInput(jsonObject);
        this.empHoldAutocompleter.updateInput(jsonObject);
    },

    registerEventsRemoveHold: function() {

        var removeHolds = $('content').select('span.remove_hold');
        for (var i = 0; i < removeHolds.length; i++) {
            removeHolds[i].observe('click', this.removeHoldHandlerBinding);
        }
    },

    registerEventsViewFile: function() {

        var viewFiles = $('content').select('span.view_file');
        for (var i = 0; i < viewFiles.length; i++) {
            viewFiles[i].observe('click', this.viewFileHandlerBinding);
        }
    },

    scrollHandler: function() {
        var div = this.listContainer;
        var scrollTop = div.scrollTop;
        var clientHeight = div.clientHeight;
        var scrollHeight = div.scrollHeight;
        if ((scrollTop > this.currentScrollTop) && (Math.abs(scrollTop - ((scrollHeight - clientHeight))) < 5)) {
            this.currentScrollTop = scrollTop;
            this.getNextPage();
        }

    },

    getNextPage: function() {

        this.page++;
        var emp = this.empAutocompleter.getValue();
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_LISTHOLD</SERVICE>';
        if (emp) {
            xmlin += '<OBJECT TYPE="P">' + emp.idAdded + '</OBJECT>';

        }
        xmlin += '     <DEL/><GCC/><LCC/>'
        + '     <PARAM>'
        + '         <I_V_PAGE>' + this.page + '</I_V_PAGE>'
        + '         <I_V_DATE_FROM>' + this.filterValues.from.toString('yyyyMMdd') + '</I_V_DATE_FROM>'
        + '         <I_V_DATE_TO>' + this.filterValues.to.toString('yyyyMMdd') + '</I_V_DATE_TO>'
        + '         <I_V_SRCH_PATTERN>' + this.filterValues.search + '</I_V_SRCH_PATTERN>'
        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'appendList',
            xmlFormat: false
        }));
    },

    appendList: function(json) {

        if (!json.EWS.o_i_hold_list || !json.EWS.o_i_hold_list.yglui_str_ecm_hold_filtlist) {
            this.currentScrollTop = 0;
            this.page--;
            return;
        }
        this.json.EWS.o_i_hold_list.yglui_str_ecm_hold_filtlist = this.json.EWS.o_i_hold_list.yglui_str_ecm_hold_filtlist.concat(json.EWS.o_i_hold_list.yglui_str_ecm_hold_filtlist);
        this.updateTable(this.json);

        this.listContainer.stopObserving('scroll');
        this.listContainer.observe('scroll', this.scrollHandler.bind(this));
    }

});