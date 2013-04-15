var Compensation_Statement = Class.create(Application, {

    initialize: function($super, options) {
        $super(options);
        this.managerId = global.objectId;
        this.actualEmployee = global.objectId;

        this.loadStatementBind = this.loadStatement.bind(this, "");

        this.handleEmployeeSelectionBind = this.handleEmployeeSelection.bind(this);
        
        this.loadStatementBinding = this.loadStatement.bind(this);
        

    },


    showStatement: function(args) {

        var validPerdiods = objectToArray(args.EWS.o_review_periods.yglui_str_com_strp);

        this.compTitleDiv = new Element("div", {}).update("<h2 style='text-align:left'>Compensation Confirmation Statement</h2>");

        this.compInformationDiv = new Element("div", {}).update("<h3 style='text-align:left'>Add info here.</h2>");

        this.reasonsTable = new Element("table", { id: "reasonsTable", 'align': 'left' });

        this.compStatement = new Element("div", { style: "text-align:left;padding-left:15px;" }).update("<span class='application_main_soft_text' style='text-align:left;font-size:14px;font-weight:bold;padding-right:10px'><br/><u>Statement</u><br/></span>");

        this.virtualHtml.insert(this.compStatement);
        validPerdiods.each(function(periods) {
            this.virtualHtml.insert("<br/><div id='" + periods['@crevi'] + "' class='application_action_link' style='text-align:left;padding-left:30px;font-size:12px' onclick='document.fire(\"EWS:loadStatement\",\"" + periods['@crevi'] + "\");'>" + periods['#text'] + "</div>");
        } .bind(this));

         this.virtualHtml.insert("<br/><div id='comp_conf_iframe'></div><br/><br/><br/><br/><br/><br/><br/><br/>");

    },

    run: function($super, args) {
        $super(args);
        global.objectId = this.managerId;
        document.observe("EWS:employeeMenuSync", this.handleEmployeeSelectionBind);
        document.observe('EWS:loadStatement', this.loadStatementBinding);
        
            this.viewPeriods();
        

    },
    close: function($super, args) {
        global.objectId = this.managerId;
        global.setEmployeeSelected(global.objectId, true);
        //this.resetXml();
        this.virtualHtml.update("");
        document.stopObserving("EWS:employeeMenuSync", this.handleEmployeeSelectionBind);
        document.stopObserving('EWS:loadStatement', this.loadStatementBinding);
        $super(args);
    },

    loadStatement: function(crevi) {
        var PeriodId = getArgs(crevi);
        var xmlGetCompStat = "<EWS>"
                       + "<SERVICE>COM_STATEMENT</SERVICE>"
                       + "<OBJ type=\"P\">" + global.objectId + "</OBJ>"
                       + "<PARAM>"
                       + "<REVIEW_PERIOD>" + PeriodId + "</REVIEW_PERIOD>"
                       + "</PARAM></EWS>";
        var url = this.url;
        while (('url' in url.toQueryParams())) { url = url.toQueryParams().url; }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
        url += xmlGetCompStat;
        var windowHandle = window.open(url, 'helpWindow', 'status=no,menubar=no,toolbar=no,location=no,scrollbars=yes,width=800 resizeable=no');
    },

    handleEmployeeSelection: function(args) {
        var args = getArgs(args);
        var employeeId = args.employeeId;
        if (employeeId != this.actualEmployee) {
            global.objectId = employeeId;
            this.actualEmployee = employeeId;
        }
    },

    viewPeriods: function(args) {

        var xmlIn = '<EWS>' +
	                        '<SERVICE>COM_STAT_GET</SERVICE>' +
	                        '</EWS>';

        this.makeAJAXrequest($H({
            xml: xmlIn,
            successMethod: 'showStatement'
        }));

    },

    compensationReviewPeriodSelected: function(ev) {
        if (this.rv_per_id == null || this.rv_per_id != ev.memo.period)
            this.rv_per_id = ev.memo.period;
    }
});