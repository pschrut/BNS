var BenefitStatement = Class.create(Application, {

    showOE: false,

    initialize: function($super, options) {
        $super(options);
        var begDate = Date.today();
        var futureDate = (begDate.getFullYear() + 1) + "-01-01";
        var pastDate = (begDate.getFullYear() - 1) + "-12-31";
        this.loadStatementBind = this.loadStatement.bind(this, "");
        this.futureBind = this.loadStatement.bind(this, futureDate);
        this.pastBind = this.loadStatement.bind(this, pastDate);
    },

    loadLifeEvents: function() {
        if (this.registerLifeEventPopup != null) {
            this.registerLifeEventPopup.close();
            delete this.registerLifeEventPopup;
        }

        if (this.reasonsTableBody != null) {
            this.reasonsTableBody.update("");
        }

        this.makeAJAXrequest($H({ xml: '<EWS><SERVICE>GET_REASONS</SERVICE><OBJECT TYPE="' + global.objectType + '">' + global.objectId + '</OBJECT><PARAM></PARAM></EWS>', 'successMethod': 'processReasons' }));
    },

    parseLabels: function(labels) {
        if (labels == null) {
            return;
        }
        labels = objectToArray(labels.item);
        labels.each(function(item) {
            this.labels.set(item['@id'], item['@value']);
        } .bind(this));
    },

    processReasons: function(result, value) {
        var x = 1;
        if (result.EWS.o_ee_events != null) {
            this.parseLabels(result.EWS.labels);
            var events = objectToArray(result.EWS.o_ee_events.yglui_str_event)

            events.each(function(row) {
                // Get values from the return XML
                var reason = row['#text'];
                var begda = objectToDisplay(row['@begda']);
                var endda = objectToDisplay(row['@endda']);
                var id = row['@id']

                if (id == 5000) {

                    var bd = " " + row['@begda'];
                    var ed = " " + row['@endda'];

                    var today = Date.today();

                    var bd2 = bd.gsub('-', ',').split(",");
                    var ed2 = ed.gsub('-', ',').split(",");

                    var bfec = new Date(bd2[0], bd2[1] - 1, bd2[2]);
                    var efec = new Date(ed2[0], ed2[1] - 1, ed2[2]);

                    if (today >= bfec && today <= efec) {
                        this.showOE = true;
                    } else {
                        this.showOE = false;
                    }
                }
            } .bind(this));
        }
        this.benefitsTitleDiv = new Element("div", {}).update("<h2 style='text-align:left'>Benefits Confirmation Statement</h2>");

        this.benefitsInformationDiv = new Element("div", {}).update("<h3 style='text-align:left'>You can find information on your benefits confirmation statement in this section.</h2>");

        //EDCK904595

        this.reasonsTable = new Element("table", { id: "reasonsTable", 'align': 'left' });

        this.benStatement = new Element("div", { style: "text-align:left;padding-left:15px;" }).update("<span class='application_main_soft_text' style='text-align:left;font-size:14px;font-weight:bold;padding-right:10px'><br/><u>Statement</u><br/></span>");

        var loadStatementLink = new Element("div", { "class": "application_action_link", style: "text-align:left;padding-left:30px;font-size:12px" }).update("<br/>" + global.getLabel('viewBenStatementCurrent'));
        loadStatementLink.observe("click", this.loadStatementBind);
        if (this.showOE) {
            var futureLink = new Element("div", { "class": "application_action_link", style: "text-align:left;padding-left:30px;font-size:12px" }).update("<br/>" + global.getLabel('viewBenStatementFuture'));
            futureLink.observe("click", this.futureBind);
        }

        var pastLink = new Element("div", { "class": "application_action_link", style: "text-align:left;padding-left:30px;font-size:12px" }).update("<br/>" + global.getLabel('viewBenStatementPast'));
        pastLink.observe("click", this.pastBind);

        // this.virtualHtml.insert(this.benefitsTitleDiv);
        // this.virtualHtml.insert(this.benefitsInformationDiv);
        this.virtualHtml.insert(this.benStatement);
        this.virtualHtml.insert(loadStatementLink);
        if (this.showOE) {
            this.virtualHtml.insert(futureLink);
        }
        this.virtualHtml.insert(pastLink);

        this.virtualHtml.insert("<div id='ben_conf_iframe'></div><br/><br/><br/><br/><br/><br/><br/><br/>");

    },

    run: function($super, args) {
        $super(args);

        if (this.firstRun) {
            this.loadLifeEvents();

        }
    },
    close: function($super, args) {
        $super(args);
    },

    loadStatement: function(date) {
        if (date == null) {
            date = "";
        }
        var xmlGetPayslip = "<EWS>"
                       + "<SERVICE>GET_STATEMENT</SERVICE>"
//                       + "<OBJECT TYPE='P'>" + global.objectId + "</OBJECT>"
                       + "<PARAM>"
                       + "<PERSNUM>" + global.objectId + "</PERSNUM>"
                       + "<BEGDA>" + date + "</BEGDA>"
                       + "</PARAM></EWS>";
        var url = this.url;
        while (('url' in url.toQueryParams())) { url = url.toQueryParams().url; }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
        url += xmlGetPayslip;
        var windowHandle = window.open(url, 'helpWindow', 'status=no,menubar=no,toolbar=no,location=no,scrollbars=yes,width=800 resizeable=no');
    }
});
