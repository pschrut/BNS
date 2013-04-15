/** 
* @fileOverview Onboarding.js 
* @description File containing class ONB. This application is responsible of 
* showing Onboarding choices.
*/

/**
*@constructor
*@description Class ONB. Shows Onboarding choices.
*@augments Application 
*/
var Onboarding = Class.create(Application,
{
    /*** SERVICES ***/
    /**
    * Service used to retreive application.
    * @type String	
    */
    AppliService: "GET_CON_ACTIO",

    /**
    * Service used to retrieve pending request
    * @type String
    */
    PendingService: "GET_TRANSPORT",

    /*** XMLs IN & OUT***/
    /**
    * Property to call the service providing the trainings
    * @type XmlDoc
    */
    xmlGetAppli: XmlDoc.create(),

    /**
    * Property to call the service providing the trainings nordin
    * @type XmlDoc
    */
    xmlGetPending: XmlDoc.create(),

    /*** VARIABLES ***/
    /** 
    * Number of application below each other
    * @type interger
    */
    nbapp: 2,

    /**
    *@param $super The superclass (Application)
    *@description Instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
        this._RefreshBinding = this._getPending.bind(this);
        //this.employeeColorChangedHandlerBinding = this.employeeColorChangedHandler.bindAsEventListener(this);
        //this.cancelBookingConfBoxButtonBinding = this.cancelBookingConfBoxButton.bindAsEventListener(this);
    },
    /**
    *@param $super The superclass: Application
    *@param args Arguments coming from previous application
    *@description When the user clicks on the app tag, load the html structure and sets the event observers
    * which have changed.
    */
    run: function($super, args) {
        $super();
        var gcc = getURLParam("gcc");
        var lcc = getURLParam("lcc");
        this.companyId = gcc + lcc;
        document.observe('EWS:RefreshPending', this._RefreshBinding);
        if (arguments.length > 1 && !Object.isEmpty(args)) {  // use?
            if (args.get('app') == 'ONB') {
                this.firstRun = false;
            }
        }
        this.reload = true;
        if (this.firstRun) {
            this.processLabels();
        }
        if (this.reload) {
            //Appli
            var tabId = global.getTabIdByAppId(global.currentApplication.appId);
            this.xmlGetAppli = "<EWS>"
                                    + "<SERVICE>" + this.AppliService + "</SERVICE>"
                                    + "<OBJECT TYPE=''></OBJECT>"
                                    + "<PARAM>"
                                    + "<CONTAINER>" + tabId + "</CONTAINER>"
                                    + "<MENU_TYPE>A</MENU_TYPE>"
                                    + "</PARAM>"
                                    + "</EWS>";

            this.makeAJAXrequest($H({ xml: this.xmlGetAppli, successMethod: 'processResponse', ajaxID: 'Appli' }));
            //Pending
            this._getPending();
        }
        //set the event listeners
        //document.observe('EWS:myCompanies_companySelected', this.onCompanySelected.bindAsEventListener(this));

    },

    _getPending: function() {
        this.xmlGetPending = '<EWS>'
            + "<SERVICE>" + this.PendingService + "</SERVICE>"
            + "<OBJECT TYPE='P'>" + "30000634" + "</OBJECT>"
            + "<PARAM></PARAM>"
            + '</EWS>';
        this.makeAJAXrequest($H({ xml: this.xmlGetPending, successMethod: 'processResponse', ajaxID: 'Pending' }));
    },

    /**
    * Method called when the labels Xml is received.
    * @param {HTTPResponse} req  Response of the AJAX call
    */
    processLabels: function() {

        var html = "<div id='application_onboarding'>"
                       + "<table class ='Onb'>"
                       + "<tr><td>"
                       + "<div id='company_name' class='Onb_Title application_main_title2'>" + global.getCompanyName() + "</div>"
                       + "</td></tr>"
        /* + "<tr><td>"
        + "<b><span class='application_main_text'>" + global.getLabel('Choose_option') + "</span></b>"
        + "</td></tr>"*/
                       + "<tr><td>"
                       + "<div class='Onb' id='options'></div>"
                       + "</td></tr>"
                       + "<tr><td>"
                       + "<b><span class='application_main_text'>" + global.getLabel('Pending Request') + "</span></b>"
                       + "</td></tr>"
                       + "<tr><td>"
                             + "<div id='legend'></div>"
                       + "</td></tr>"
                       + "<tr><td>"
                             + "<div id='pendingRequestSearch'>"
                             + "</div>"
                       + "</td></tr>"
                       + "<tr><td>"
                             + "<div id='pendingRequest'>"
                             + "</div>"
                        + "</td></tr>"
                  + "</div>";
        this.virtualHtml.insert(html);

        var widgetHash = $H({
            title: global.getLabel('Choose_option'),
            collapseBut: true,
            //onLoadCollapse: components.get('widgetCollapse'),
            targetDiv: 'options'
        });

        this.widget = new unmWidget(widgetHash);

    },

    /**
    * Method called when the Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    * @param id Ajax request Id
    */
    processResponse: function(req, id) {
        if (this.reload == true)
            this.reload = false;
        if (id == 'Appli')
            this.processAppli(req);
        if (id == 'Pending')
            this.processPending(req);

    },

    /**
    * Method called when the appli Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    processAppli: function(req) {
        //get Applications
        var menuItems = Object.isEmpty(req.EWS.o_actions) ? [] : objectToArray(req.EWS.o_actions.yglui_vie_tty_ac);
        this.lenght = menuItems.length;

        if ((this.lenght % 2) == 1)
            this.lenght = parseInt(this.lenght / 2) + 1;
        else
            this.lenght = parseInt(this.lenght / 2);
        if (this.lenght > this.nbapp) {
            this.nbapp = this.lenght;
        }

        var table = "<table width='100%'><tr><td colspan='2'><span class='application_text_italic'>"
                    + global.getLabel("Choose_OB_action")
                    + "</span></td></tr>";
        for (var j = 0; j < this.nbapp; j++) {
            table = table + "<tr id ='tr_" + j + "'>"
            + "<td id ='td_" + j + "_1'></td><td> </td>"
            + "<td id ='td_" + j + "_2'></td></tr>";
        }
        table = table + "</table>";
        //this.virtualHtml.down('[id=options]').update(table);
        this.virtualHtml.down('[id=unmWidgetContent_options]').update(table);

       

        for (var i = 0; i < menuItems.length; i++) {
            var id = menuItems[i]['@actio'];
            var appId = menuItems[i]['@tarap'];
            var view = menuItems[i]['@views'];
            var label = menuItems[i]['@actiot'];
            if (!Object.isEmpty(label)) {
                var pieces = label.split("((L))");
                var line = "<div class='Onb_Options'>"
                        + "<div class='Onb_navigationElement_div_up Onb_" + id + "'"
                        + "onClick='global.open($H({ app: { appId: \"" + appId + "\" , tabId:\"\" , view: \"" + view + "\" }, prevApp : \"" + global.currentApplication.appId + "\" , prevTab :\"" + global.currentApplication.tabId + "\"  , prevView :\"" + global.currentApplication.view + "\" }))'>"
                        + "</div>"
                        + "<span class='Onb_Text'>" + pieces[0] + "</span>";
                if (pieces[1]) {
                    line = line + "<span class='Onb_Text application_action_link' "
                            + "onClick='global.open($H({ app: { appId: \"" + appId + "\" , tabId:\"\" , view: \"" + view + "\" }, prevApp : \"" + global.currentApplication.appId + "\" , prevTab :\"" + global.currentApplication.tabId + "\"  , prevView :\"" + global.currentApplication.view + "\"  }))'>"
                            + pieces[1] + "</span>";
                }
                if (pieces[2]) {
                    line = line + "<span class='Onb_Text'>" + pieces[2] + "</span>";
                }
                line = line + "</div>";
            } else {
                var line = "<div class='Onb_Options'>"
                        + "<div class='Onb_navigationElement_div_up Onb_" + id + "'"
                        + "onClick='global.open($H({ app: { appId: \"" + appId + "\" , tabId:\"\" , view: \"" + view + "\" }, prevApp : \"Onboarding\"}))'>"
                        + "</div>"
                        + "<span class='Onb_Text'>" + global.getLabel(id) + "</span>";
                line = line + "</div>";
            }

           if (i > (this.nbapp - 1)) {
                var tr = i - this.nbapp;
                this.virtualHtml.down('[id=td_' + tr + '_2]').update(line);
            } else {
                this.virtualHtml.down('[id=td_' + i + '_1]').update(line);
            }

        }
    },

    /**
    * Method called when the Pending Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    processPending: function(req) {

        var html = "";
        if (Object.isEmpty(req.EWS.o_field_values)) {
            html = "<div>" + global.getLabel('no_result') + "</div>"
            this.virtualHtml.down('[id=pendingRequest]').update(html);
        } else {
            this.drawLegendPart();
            //html = "<table class='sortable' id='pendingRequest_resultsTable_" + this.companyId + "'>"
            html = "<table class='sortable' id='pendingRequest_resultsTable'>"
                  + "<thead>"
                  + "<tr>";
            var sort = '';
            objectToArray(req.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field).each(function(fieldSettings) {
                var label = global.getLabel(fieldSettings['@fieldid']);
                if (sort == '') {
                    html = html + "<th class='table_sortfirstdesc' id='" + fieldSettings['@fieldid'] + "'>" + label + "</th>";
                    sort = 'X';
                } else {
                    html = html + "<th id='" + fieldSettings['@fieldid'] + "'>" + label + "</th>";
                }
            } .bind(this));
            html = html + "</tr>"
                            + "</thead>"
                            + "<tbody id='pendingRequest_results_tbody'>"

            objectToArray(req.EWS.o_field_values.yglui_str_wid_record).each(function(fieldValues) {
                //debugger;
                html = html + "<tr>";
                objectToArray(fieldValues.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) { //

                    if (field['@value']) {
                        if (field['@fieldid'] == 'DATE')
                            var value = !Object.isEmpty(sapToObject(field['@value'])) ? sapToDisplayFormat(field['@value']) : field['@value'];
                        else if (field['@fieldid'] == 'APP' || field['@fieldid'] == 'TEXT')
                            var value = global.getLabel(field['@value']);
                        else if (field['@fieldid'] == 'STATUS')
                            switch (field['@value']) {
                            case '20':
                            case '30':
                            case '40':
                            case '50':
                                var value = "<span title='" + global.getLabel('in_progress') + "' class='application_icon_orange pdcPendReq_statusColumn'></span>";
                                break;
                            case '21':
                            case '22':
                            case '80':
                                var value = "<span title='" + global.getLabel('cancelled') + "' class='application_icon_red pdcPendReq_statusColumn'></span>";
                                break;
                            case '90':
                                var value = "<span title='" + global.getLabel('completed') + "' class='application_icon_green pdcPendReq_statusColumn'></span>";
                                break;
                        }
                        else
                            var value = field['@value'];
                    } else {
                        var value = '';
                    }

                    html = html + "<td class='Onb_list'>" + value + "</td>";
                } .bind(this));
                html = html + "</tr>";
            } .bind(this));
            html = html + "</tbody></table>";
            this.virtualHtml.down('[id=pendingRequest]').update(html);
            this.virtualHtml.down('[id=pendingRequestSearch]').update("");
            if (!this.tableRequestShowed) {
                this.tableRequestShowed = true;
                //this.tableRequestObject = new tableKitWithSearch(this.virtualHtml.down('table#pendingRequest_resultsTable_' + this.companyId + ''), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
                this.tableRequestObject = new tableKitWithSearch(this.virtualHtml.down('table#pendingRequest_resultsTable'), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
            } else {
                //this.tableRequestObject.reloadTable(this.virtualHtml.down('table#pendingRequest_resultsTable_' + this.companyId + ''));
                this.tableRequestObject.reloadTable(this.virtualHtml.down('table#pendingRequest_resultsTable'));
            }
            if (Object.isEmpty(this.virtualHtml.down('[id=refresh]'))) {
                var onclick = 'javascript:document.fire("EWS:RefreshPending");';
                //var box = this.virtualHtml.down('[id=pendingRequest_resultsTable_' + this.companyId + '_searchBoxDiv]');
                var box = this.virtualHtml.down('[id=pendingRequest_resultsTable_searchBoxDiv]');
                var refresh = "<table class='Onb'><tr><td id='SearchBox'></td><td><div class='Onb_link_right'><span id='refresh' class='application_action_link' onClick=" + onclick + ">"
                             + global.getLabel('Refresh') + "</span></div></td></tr></table>";

                this.virtualHtml.down('[id=pendingRequestSearch]').update(refresh);
                this.virtualHtml.down('[id=SearchBox]').insert(box);
            }
        }
    },

    /**
    *@description Method to draw the Legend Part
    */
    drawLegendPart: function() {
        var legendJSON = {
            legend: [
            {
                img: "application_icon_red",
                text: global.getLabel('cancelled')
            },
            {
                img: "application_icon_orange",
                text: global.getLabel('in_progress')
            },
            {
                img: "application_icon_green",
                text: global.getLabel('completed')
            }
            ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
        var legendHTML = getLegend(legendJSON);
        this.virtualHtml.down('[id=legend]').update(legendHTML);
    },
    /**
    * @description called when the application is not shown.
    */
    close: function($super) {
        $super();
        //unattach event handlers
        //document.stopObserving('EWS:myCompanies_companySelected', this.onCompanySelected.bindAsEventListener(this));
    }

});
