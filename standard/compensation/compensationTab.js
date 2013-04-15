var CompensationTab = Class.create(Application, {

    myJson: null,

    rv_per_id: null,

    rv_per_begda: null,

    rv_per_endda: null,

    org_unit_id: null,

    obj_name: '',

    excelTable: new ExcelTable(),

    orgSummary: new OrgSummary(),

    COMP_CATEGORY: 0,

    SERVICE_NAME: '',

    isRunning: false,

    isLoaded: false,

    args: null,

    initialize: function($super, args, extraArgs) {
        $super(args);
        this.args = args;
        this.obj_name = extraArgs.obj_name;
        this.COMP_CATEGORY = extraArgs.COMP_CATEGORY;
        this.SERVICE_NAME = extraArgs.SERVICE_NAME;
        this.onEmpTableReadyBinding = this.onEmpTableReady.bind(this);
        this.compensationReviewPeriodSelectedBinding = this.compensationReviewPeriodSelected.bind(this);
        this.onOrgSummaryTableReadyBinding = this.onOrgSummaryTableReady.bindAsEventListener(this);
        this.onAmountUpdatedOrgSummaryBinding = this.onAmountUpdatedOrgSummary.bindAsEventListener(this);
        this.onOrgUnitSelectedBinding = this.onOrgUnitSelected.bindAsEventListener(this);
        this.onHiddeButtonsBinding = this.onHiddeButtons.bindAsEventListener(this);
        this.onShowButtonsBinding = this.onShowButtons.bindAsEventListener(this);
        this.exportToExcelBinding = this.exportToExcel.bindAsEventListener(this);
        this.updateEEBinding = this.updateEE.bindAsEventListener(this);
        this.compensationReloadTableBinding = this.compensationReloadTable.bindAsEventListener(this);
        this.onTopOrgUnitSelectBinding = this.onTopOrgUnitSelect.bindAsEventListener(this);
        document.observe('EWS:compensationReviewPeriodSelected', this.compensationReviewPeriodSelectedBinding);
        document.observe('EWS:compensationOrgUnitSelected', this.onOrgUnitSelectedBinding);
        document.observe("EWS:compensationTopOrgUnitSelected", this.onTopOrgUnitSelectBinding);
    },

    run: function($super, args) {
        $super(args);
        this.isRunning = true;
        if (this.firstRun) {
            document.observe('EWS:compensation_empTableReady', this.onEmpTableReadyBinding);
            document.observe('EWS:compensation_summaryTableReady', this.onOrgSummaryTableReadyBinding);
            document.observe('EWS:compensation_updatedAmount', this.onAmountUpdatedOrgSummaryBinding);
            document.observe('EWS:compensationOrgUnitSelected', this.onOrgUnitSelectedBinding);
            document.observe('EWS:compensation_hidebuttons', this.onHiddeButtonsBinding);
            document.observe('EWS:compensation_showbuttons', this.onShowButtonsBinding);
            document.observe('EWS:compensationExportToExcel', this.exportToExcelBinding);
            document.observe('EWS:compensation_updateEE', this.updateEEBinding);
            document.observe('EWS:compensationReloadTable', this.compensationReloadTableBinding); 
            if (this.virtualHtml.down('[id=orgSummaryDiv]'))
                this.virtualHtml.down('[id=orgSummaryDiv]').remove();
            if (this.virtualHtml.down('[id=empListDiv]'))
                this.virtualHtml.down('[id=empListDiv]').remove();
            if (this.virtualHtml.down('[id=idSpaceA]'))
                this.virtualHtml.down('[id=idSpaceA]').remove();
            this.virtualHtml.insert(new Element("div", {
                "class": "",
                "id": "orgSummaryDiv"
            }));
            this.displayWhiteSpace('idSpaceA');

            this.virtualHtml.insert(new Element("div", {
                "id": "empListDiv",
                "class": "COM_holder"
            }));
        }
        this.displayButtons();
        this.getEmpList();
    },


    displayWhiteSpace: function(idSpace) {
        var html = '<div id="' + idSpace + '" class="COM_space_div" />';
        this.virtualHtml.insert(html);
    },


    /**
    *@description Call the service COM_EM_LT_MCD to get the list of existent employees
    *				that match some given filter data.
    *@param {OBJECTID} id of the org unit to be send to SAP.
    *@param {CREVI} review period. 
    *@param {CCATE} compensation category 
    */
    getEmpList: function() {
        if (!Object.isEmpty(this.rv_per_id)) {
            var servXml = '<EWS>'
						+ '<SERVICE>' + this.SERVICE_NAME + '</SERVICE>'
						+ '<OBJECT TYPE="O">' + this.org_unit_id + '</OBJECT>'
						+ '<PARAM>'
						+ '<REVIEW_PERIOD>' + this.rv_per_id + '</REVIEW_PERIOD>'
						+ '<BEGDA>' + this.rv_per_begda + '</BEGDA>'
						+ '<ENDDA>' + this.rv_per_endda + '</ENDDA>'
						+ '<COMP_CATEGORY>' + this.COMP_CATEGORY + '</COMP_CATEGORY>'
						+ '</PARAM>'
						+ '</EWS>';
            this.makeAJAXrequest($H({
                xml: servXml,
                successMethod: 'buildEmployeeList'
            }));
        }
        else { document.fire('EWS:compensation_hidebuttons'); }
    },

    exportToExcel: function() {
        var servXml = '<EWS>'
						+ '<SERVICE>' + this.SERVICE_NAME + '</SERVICE>';
        servXml += '<PARAM>'
                + '<REVIEW_PERIOD>' + this.rv_per_id + '</REVIEW_PERIOD>'
                + '<BEGDA>' + this.rv_per_begda + '</BEGDA>'
                + '<ENDDA>' + this.rv_per_endda + '</ENDDA>'
                + '<COMP_CATEGORY>' + this.COMP_CATEGORY + '</COMP_CATEGORY>'
                + '<EXCEL_MODE>X</EXCEL_MODE>';
        if (this.org_unit_id != null) {
            servXml += '<ORGUNIT>' + this.org_unit_id + '</ORGUNIT>';
        }

        servXml += '</PARAM>'
                + '</EWS>';

        var url = this.url;
        while (('url' in url.toQueryParams())) { url = url.toQueryParams().url; }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
        url += servXml;
        window.open(url);
    },

    compensationReviewPeriodSelected: function(ev) {
        this.rv_per_begda = ev.memo.begda;
        this.rv_per_endda = ev.memo.endda;
        if (this.rv_per_id == null || this.rv_per_id != ev.memo.period) {
            this.rv_per_id = ev.memo.period;

            if (this.isRunning)
                this.getEmpList();
        }
    },

    compensationReloadTable: function(ev) {
        this.rv_per_begda = ev.memo.begda;
        this.rv_per_endda = ev.memo.endda;
        this.rv_per_id = ev.memo.period;

        if (this.isRunning)
            this.getEmpList();
    },

    buildEmployeeList: function(json) {
        myJson = json;
        this.excelTable.buildEmployeeList(myJson, this.obj_name, this.args);
        this.orgSummary.buildOrgSummary(myJson);
    },

    onEmpTableReady: function() {
        var html = this.excelTable.getEmpTable();
        this.virtualHtml.down('[id=empListDiv]').update(html);
        // Add the table kit for the list of tickets
        try {
            //instantiate the tablekit with search
            TableKit.Sortable.init('bodyTable');
        }
        catch (e) { }
        try {
            TableKit.reloadTable("bodyTable");
        }
        catch (e) { }

    },

    onOrgSummaryTableReady: function() {
        var html = this.orgSummary.getSumTable();
        if (this.isRunning)
            this.virtualHtml.down('[id=orgSummaryDiv]').insert(html);
    },

    onAmountUpdated: function(ev) {
        this.rv_per_id = ev.memo.period;
    },

    onAmountUpdatedOrgSummary: function(amountChanged) {
        if (this.isRunning)
            if (!Object.isEmpty(amountChanged)) {
            this.orgSummary.rebuild(amountChanged);
        }
    },

    updateEE: function(eeChanged) {
        if (this.isRunning)
            this.orgSummary.updateEE(eeChanged);
    },


    onOrgUnitSelected: function(ev) {
        this.org_unit_id = ev.memo.orgunit;
        if (this.isRunning)
            this.getEmpList();
    },

    onTopOrgUnitSelect: function(ev) {
        this.org_unit_id = ev.memo.orgunit;
    },

    onHiddeButtons: function(ev, hidde) {
        if (this.isRunning)
            document.getElementById('buttons').style.display = 'none';
    },

    onShowButtons: function(ev, hidde) {
        if (this.isRunning)
            document.getElementById('buttons').style.display = '';
    },


    displayButtons: function() {
        while (document.getElementById('buttons')) {
            document.getElementById('buttons').remove()
        };
        var buttonsDiv = new Element('div', { 'id': 'buttons', 'style': 'margin-top:10px' });
        var buttonsTable = new Element('table', { 'id': 'buttonsTable', 'align': 'right', 'cellspacing': '0' });

        buttonsDiv.insert(buttonsTable);

        var tbody = new Element('tbody');
        buttonsTable.insert(tbody);

        var tr = new Element('tr');
        tbody.insert(tr);

        var td = new Element('td');
        tr.insert(td);

        //create the buttons
        var span = new Element('div', {
            'id': 'saveButton',
            'class': 'centerRoundedButton',
            'style': 'clear:both;float:left;cursor: pointer;'
        }).update("SAVE");
        span.observe('click', this.buttonClicked.bindAsEventListener(this, 'SAVE'));
        td.insert(span);

        span = new Element('div', { 'class': 'rightRoundedCorner', 'style': 'float:left' });
        td.insert(span);

        var td = new Element('td');
        tr.insert(td);

        span = new Element('div', {
            'class': 'centerRoundedButton',
            'style': 'clear:none;float:left;margin-left:10px;cursor: pointer;'
        }).update("UNDO");
        span.observe('click', this.buttonClicked.bindAsEventListener(this, 'UNDO'));
        td.insert(span);

        span = new Element('div', { 'class': 'rightRoundedCorner', 'style': 'float:left' });
        td.insert(span);

        this.virtualHtml.insert(buttonsDiv);
    },

    close: function($super, args) {
        this.isRunning = false;
        this.isLoaded = false;
        $super();
    },

    /**
    *@description Method to handle the button click
    */
    buttonClicked: function(event, action, lineId) {
        document.getElementById('saveChangesNote').style.display = 'none';
        if (action == "UNDO") {
            //populate the edit screen with data
            this.excelTable.restore();
            this.orgSummary.restore();
        }
        else if (action == "SAVE") {
            this.excelTable.save();
        }
    },

    getExcelTable: function() { return this.excelTable; }

});
