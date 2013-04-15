var Enrollement = Class.create(Application, {
    /**
    * json object with benefits update reasons
    * @type json object
    */
    jsonReasons: null, //new Hash(),

    /**
    * json object with benefits update reasons
    * @type json object
    */
    registerLifeEventPopup: null, //new Hash(),

    benEffectiveDate: "",
    options: null,

    initialize: function($super, options) {
        $super(options);
        this.options = options;
        this.managerId = global.objectId;
        this.actualEmployee = global.objectId;
        var listOfPlans = $A();
        var currentPlan = null;

        var planID = null;
        var appID = null;
        var rowNumber = null;

        var selectedReasonID = null;
        var selectedMenuItemText = "";

        var labels = null;

        this.widgetContainer = "BEN_DEP";
        this.lastSaveSuccessful = false;

        this.adjustmentReasonSelectedBind = this.adjustmentReasonSelected.bind(this);
        document.observe("EWS:benefits_1_adjustmentReasonSelected", this.adjustmentReasonSelectedBind);

        this.handleEmployeeSelectionBind = this.handleEmployeeSelection.bind(this);
        document.observe("EWS:employeeMenuSync", this.handleEmployeeSelectionBind);

        this.startPlanPageBind = this.startPlanPage.bind(this);
        document.observe("EWS:benefits_1_startPlanPage", this.startPlanPageBind);

        this.registerLifeEventBinding = this.registerLifeEvent.bind(this);
        document.observe("EWS:benefits_1_registerLifeEvent", this.registerLifeEventBinding);

        this.previousButtonHandlerBinding = this.previousButtonHandler.bind(this);
        document.observe("EWS:benefits_1_previousButtonClicked", this.previousButtonHandlerBinding);

        this.nextButtonHandlerBinding = this.nextButtonHandler.bind(this);
        document.observe("EWS:benefits_1_nextButtonClicked", this.nextButtonHandlerBinding);

        this.submitButtonHandlerBinding = this.submitButtonHandler.bind(this);
        document.observe("EWS:benefits_1_submitButtonClicked", this.submitButtonHandlerBinding);

        this.saveButtonHandlerBinding = this.saveButtonHandler.bind(this);
        document.observe("EWS:benefits_1_saveButtonClicked", this.saveButtonHandlerBinding);

        this.selectPageHandlerBinding = this.selectPageHandler.bind(this);
        document.observe("EWS:benefits_1_selectPage", this.selectPageHandlerBinding);

        this.sendXmlToBackendBinding = this.sendXmlToBackend.bind(this);
        document.observe("EWS:benefits_1_sendXmlToBackend", this.sendXmlToBackendBinding);

        this.writeXmlToBackendBinding = this.writeXmlToBackend.bind(this);
        document.observe("EWS:benefits_1_writeXmlToBackend", this.writeXmlToBackendBinding);

        this.sendXmlToAppBinding = this.sendXmlToApp.bind(this);
        document.observe("EWS:benefits_1_sendXmlToApp", this.sendXmlToAppBinding);

        this.updatePlanTitleBinding = this.updatePlanTitle.bind(this);
        document.observe("EWS:benefits_1_updatePlanTitle", this.updatePlanTitleBinding);

        this.restartApplicationBinding = this.restartApplication.bind(this);
        document.observe("EWS:benefits_1_homeButtonClicked", this.restartApplicationBinding);

        this.saveSuccessfulBinding = this.saveSuccessful.bind(this);
        document.observe("EWS:benefits_1_saveSuccessful", this.saveSuccessfulBinding);

        this.finalSaveSuccessfulBinding = this.finalSaveSuccessful.bind(this);
        document.observe("EWS:benefits_1_finalSaveSuccessful", this.finalSaveSuccessfulBinding);

        this.disableButtonBinding = this.disableButtonHandler.bind(this);
        document.observe("EWS:benefits_1_disableButton", this.disableButtonBinding);

        this.enableButtonBinding = this.enableButtonHandler.bind(this);
        document.observe("EWS:benefits_1_enableButton", this.enableButtonBinding);

        this.parseScreenBind = this.parseScreen.bind(this);
        this.loadStatementBind = this.loadStatement.bind(this, "");

        var json = {
            elements: [],
            defaultButtonClassName: 'classOfMainDiv'
        };


        this.xmlToBackend = null;

        this.nextStep = null;
    },
    run: function($super) {
        $super();
        //if (this.firstRun) {
        global.objectId = this.managerId;
        document.observe("EWS:employeeMenuSync", this.handleEmployeeSelectionBind);
        this.startApplication();
        this.firstRun = true;
        this.isClosing = false;
        //}
    },
    close: function($super) {
        // If the user is still on the main page, we don't show a warning message.
        if (this.firstRun) {
            this.isClosing = true;
            global.objectId = this.managerId;
            global.setEmployeeSelected(global.objectId, true);
            $super();
            this.resetXml();
            this.virtualHtml.update("");
            document.stopObserving("EWS:employeeMenuSync", this.handleEmployeeSelectionBind);
        }
        else {
            if (confirm(this.labels.get("confirmHome"))) {
                this.isClosing = true;
                global.objectId = this.managerId;
                global.setEmployeeSelected(global.objectId, true);
                $super();
                this.resetXml();
                this.virtualHtml.update("");
                document.stopObserving("EWS:employeeMenuSync", this.handleEmployeeSelectionBind);
            }
        }
    },

    startApplication: function(args) {
        if (!Object.isEmpty($('benefitsHeaderDiv'))) {
            var theParent = $('benefitsHeaderDiv').parentElement;
            if (theParent) {
                theParent.removeChild($('benefitsHeaderDiv'));
            }
        }

        if (!Object.isEmpty($('benefitsContentDiv'))) {
            var theParent = $('benefitsContentDiv').parentElement;
            if (theParent) {
                theParent.removeChild($('benefitsContentDiv'));
            }
        }

        if (!Object.isEmpty($('benefitsFooterDiv'))) {
            var theParent = $('benefitsFooterDiv').parentElement;
            if (theParent) {
                theParent.removeChild($('benefitsFooterDiv'));
            }
        }

        this.headerDiv = new Element("div", { 'id': 'benefitsHeaderDiv', 'style': 'margin: 15px 0px 20px 25px; text-align: left;' });
        this.contentDiv = new Element("div", { 'id': 'benefitsContentDiv', 'style': 'margin: 15px 0px 20px 25px; text-align: left;' });
        this.footerDiv = new Element("div", { 'id': 'benefitsFooterDiv' });
        this.virtualHtml.insert(this.headerDiv);
        this.virtualHtml.insert(this.contentDiv);
        this.virtualHtml.insert(this.footerDiv);

        this.benefitsTitleDiv = new Element("div", {}).update("<span style='text-align:left;font-weight:bold' class='application_main_text'>Benefits Enrollment</span>");
        this.headerDiv.update(this.benefitsTitleDiv);

        this.benefitsInformationDiv = new Element("div", {}).update("<h2 style='text-align:left'></h2>");
        this.contentDiv.update(this.benefitsInformationDiv);

        this.reasonsTableDiv = new Element("div", { "style": "width:100%" });
        this.selectBenefitsReasonDiv = new Element("div", {}).update("<h2 style='text-align:left'></h2>");
        this.reasonsTable = new Element("table", { 'align': 'left', style: "margin-bottom: 10px; width: 440px;", "class": "application_inProgress_table" });
        this.reasonsTableBody = new Element("tbody", {});
        this.reasonsTableHeader = new Element("thead", {});
        this.reasonsTable.update(this.reasonsTableHeader);
        this.reasonsTable.insert(this.reasonsTableBody);

        this.reasonsTableDiv.update(this.reasonsTable);

        this.headerDiv.insert(this.benefitsTitleDiv);
        this.contentDiv.insert(this.selectBenefitsReasonDiv);
        this.contentDiv.insert(this.reasonsTableDiv);

        var newLifeEventLink = new Element("div", { "class": "application_action_link", style: "padding-top:0px; padding-left:25px; text-align:left;clear:left" }).update("<br>" + global.getLabel("regLifeEvent") + "</br>");
        newLifeEventLink.observe("click", this.registerLifeEventBinding);
        this.contentDiv.insert(newLifeEventLink);

        this.loadLifeEvents();
    },

    restartApplication: function($super) {
        // If the user is still on the main page, we don't show a warning message.
        if (this.firstRun) {
            this.resetXml();
            this.returnXml = null;
            this.headerDiv.update();
            this.contentDiv.update();
            this.footerDiv.update();
            this.startApplication();
            document.fire("EWS:benefits_1_resetMenu");
        }
        else {
            if (confirm(this.labels.get("confirmHome"))) {
                this.firstRun = true;
                this.resetXml();
                this.returnXml = null;
                this.headerDiv.update();
                this.contentDiv.update();
                this.footerDiv.update();
                this.startApplication();
                document.fire("EWS:benefits_1_resetMenu");
            }
        }
    },

    writeXmlToBackend: function(args) {
        var args = getArgs(args);
        var json = args.json;

        if (json) {
            this.xmlToBackend = json;
        }
    },

    sendXmlToApp: function(args) {
        var args = getArgs(args);
        var appName = args.appName;

        document.fire("EWS:benefits_1_writeXmlTo" + args + "", { 'json': this.xmlToBackend });
    },

    sendXmlToBackend: function(args) {
        args = getArgs(args);
        this.nextStep = args.goToStep;
        // Send constructed XML to backend, and if there are no errors, go to the next step.
        //if ((this.xmlToBackend != null) && (this.xmlToBackend != "<EWS><SERVICE></SERVICE><PARAM><APPID></APPID><RECORDS></RECORDS></PARAM><DEL></DEL></EWS>")) {
        if ((this.xmlToBackend != null) && (this.xmlToBackend.EWS.PARAM.RECORDS != "")) {
            var records = new XML.ObjTree();
            records.attr_prefix = '@';
            xmlIn = '<EWS>' +
            '<SERVICE>' + this.xmlToBackend.EWS.SERVICE + '</SERVICE>' +
            '<OBJECT TYPE="' + global.objectType + '">' + global.objectId + '</OBJECT>' +
            '<PARAM>' +
            '<APPID>' + this.xmlToBackend.EWS.PARAM.APPID + '</APPID>' +
            '<RECORDS>' + records.writeXML(this.xmlToBackend.EWS.PARAM.RECORDS, true) +
            '</RECORDS></PARAM><DEL></DEL></EWS>';
            this.makeAJAXrequest($H({ xml: xmlIn, successMethod: 'saveSuccessful' }));
        }
        // If there is no constructed XML going to the backend (like on the Dependents Change page)
        // always just send a message that the save was successful.
        else {
            this.saveSuccessful();
        }
    },

    updatePlanTitle: function(args) {
        var args = getArgs(args);
        selectedMenuItemText = args.planTitle;
    },

    saveSuccessful: function() {
        this.resetXml();
        if (this.nextStep == "previous") {
            document.fire("EWS:benefits_1_goBackOnePage");
        }
        if (this.nextStep == "next") {
            document.fire("EWS:benefits_1_goForwardOnePage");
        }
        if (this.nextStep == "summary") {
            document.fire("EWS:benefits_1_goToPage", { 'pageNumber': this.nextStep });
        }
        if (!isNaN(Number(this.nextStep))) {
            document.fire("EWS:benefits_1_goToPage", { 'pageNumber': Number(this.nextStep) });
        }
        this.nextStep = null;

    },

    finalSaveSuccessful: function(json) {
        var messages = json.EWS.messages.item[0]['#text'];

        var loadStatementLink = new Element("div", { "class": "application_action_link", style: "text-align:left;padding-left:30px;font-size:12px" }).update("<br/>" + "Confirmation Statement");
        loadStatementLink.observe("click", this.loadStatementBind);

        var buttonsJson = {
            elements: []
        };
        var okExit = function() {
            succesfullPopUp.close();
        } .bind(this);

        var okButton = {
            idButton: 'ok',
            label: 'Ok',
            handlerContext: null,
            className: 'infoPopUp_exampleButton fieldDispFloatRight',
            handler: okExit,
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(okButton);

        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();

        var contentHTML = new Element('div');
        contentHTML.insert("<p><span>");
        contentHTML.insert(messages);
        contentHTML.insert("</span></p>");
        contentHTML.insert(loadStatementLink).insert("<br /><br />");


        contentHTML.insert(buttons);



        var succesfullPopUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {

                    this.close();
                }
            }),

            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 500
        });
        var showPopUp = succesfullPopUp.create();

        this.resetXml();
        this.nextStep = null;

        this.firstRun = true;
        this.headerDiv.update();
        this.contentDiv.update();
        this.footerDiv.update();
        this.startApplication();
        document.fire("EWS:benefits_1_resetMenu");
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
    },

    resetXml: function() {
        this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_BENEFITS", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();
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

    processReasons: function(result, value) {
        var x = 1;
        if (result.EWS.o_ee_events != null) {
            this.parseLabels(result.EWS.labels);
            var events = objectToArray(result.EWS.o_ee_events.yglui_str_event)

            var headerRow = new Element("tr", {});
            //var emptyCell = new Element("td", { style: "width:300px" });
            var enrollmentEventsHeader = new Element("th", { "class": "table_sortfirstdesc application_history_table_colNoTtrainings table_sortcol", "style": "width:300px;padding-left:5px;" }).update(this.labels.get("enrollmentEvents"));
            var availabilityPeriodHeader = new Element("th", { "class": "table_sortfirstdesc application_history_table_colNoTtrainings table_sortcol", "style": "width:45%" }).update(this.labels.get("availabilityPeriod"));
            // Add new elements to the Reasons Table
            //headerRow.insert(emptyCell);
            headerRow.update(enrollmentEventsHeader);
            headerRow.insert(availabilityPeriodHeader);
            this.reasonsTableHeader.update(headerRow);

            //this.reasonsTableBody.update(tableHeader);
            fireEventIdBind = this.fireEventId.bind(this);

            events.each(function(row) {
                // Create new table elements
                var newTableRow = new Element("tr", {});
                var newReasonTableCell = new Element("td", {});
                var newReasonFormatSpan = new Element("span", { "class": "application_action_link" });
                var newPeriodTableCell = new Element("td", {});
                // Get values from the return XML
                var reason = row['#text'];
                var begda = objectToDisplay(row['@begda']);
                var endda = objectToDisplay(row['@endda']);
                var id = row['@id']
                selectedReasonID = id;
                var newListItem = new Element("div", { 'id': 'tableRow' + reason, style: 'text-align:left;padding-left:5px' }).update(reason);
                newListItem.observe('click', function() { fireEventIdBind(id, row['@effective_date'], row['@begda']); });
                // Add new elements to the Reasons Table
                newReasonFormatSpan.update(newListItem);
                newReasonTableCell.update(newReasonFormatSpan);
                newPeriodTableCell.update(begda + " - " + endda);
                newTableRow.update(newReasonTableCell);
                newTableRow.insert(newPeriodTableCell);
                this.reasonsTableBody.insert(newTableRow);
            } .bind(this));
            if (this.reasonsTable.tBodies.length > 1) {
                this.reasonsTable.removeChild(this.reasonsTable.tBodies[0])
            }
            this.reasonsTable.removeAttribute("id");
            TableKit.Sortable.init(this.reasonsTable);
            this.reasonsTable.className = "sortable";
            availabilityPeriodHeader.className = "table_sortfirstdesc application_history_table_colNoTtrainings table_sortcol";
            availabilityPeriodHeader.style.fontWeight = "bold";
            availabilityPeriodHeader.style.paddingBottom = "0px";
            enrollmentEventsHeader.style.fontWeight = "bold";
            enrollmentEventsHeader.style.paddingBottom = "0px";

        }
        // Save the virtual Html of the title page for later use.
        this.mainTitleVirtualHtml = this.virtualHtml;

        var registrationOptions = objectToArray(result.EWS.o_event_list.yglui_str_event);
        this.jsonReasons = new Hash();
        for (var i = 0; i < registrationOptions.length; i++) {
            var reasonId = registrationOptions[i]['@id'];
            var reasonText = registrationOptions[i]['#text'];
            this.jsonReasons.set(reasonId, { reasonValue: reasonText });
        }
    },

    fireEventId: function(id, effDate, depDate) {
        var today = new Date().toString("yyyy-MM-dd");
        if (today > effDate) {
            this.benEffectiveDate = effDate;
        } else {
            this.benEffectiveDate = today;
        }
        this.benDepBegda = depDate;
        document.fire("EWS:benefits_1_eventSelected", id);
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

    adjustmentReasonSelected: function(args) {
        var args = getArgs(args);
        array = args.get("array");
        this.selectedAdjustmentReason = args.get("selectedAdjustmentReason");

        listOfPlans = array;
        if (listOfPlans[0]) {
            document.fire("EWS:benefits_1_startPlanPage", $H({ rowNumber: '0', planText: listOfPlans[0].planText }));
            document.fire("EWS:benefits_1_menuItemSelected", $H({ rowNumber: '0', planText: listOfPlans[0].planText }));
            document.fire("EWS:benefits_1_disableButton", { 'buttonID': 'benefits_buttonPrevious' });
        }
    },

    startPlanPage: function(args) {

        var args = getArgs(args);
        var rowNumber = args.get("rowNumber");
        var planText = args.get("planText");

        planID = listOfPlans[rowNumber].planID;
        appID = listOfPlans[rowNumber].appID;

        //        document.fire("EWS:benefits_1_changePlanName", { 'planName': planText });
        selectedMenuItemText = planText;

        if ((planID != "") && (appID != "")) {
            this.makeAJAXrequest($H({ xml: '<EWS><SERVICE>GET_CONTENT_B</SERVICE><OBJECT TYPE="' + global.objectType + '">' + global.objectId + '</OBJECT><PARAM><APPID>' + appID + '</APPID><SUBTYPE>' + planID + '</SUBTYPE><WID_SCREEN>*</WID_SCREEN><OKCODE>MOD</OKCODE></PARAM></EWS>', 'successMethod': 'transformPlanPage' }));
        }
        else {
            this.transformPlanPage();
        }
    },

    registerLifeEvent: function(args) {
        // Create object just in time.
        var hash = $H({
            title: 'Register A New Life Event'
        });

        // Key/values arrays for options.
        var jkeys = null;
        var jvalies = null;

        var content = hashToHtml(hash);

        var contentHTML = new Element('div');
        contentHTML.insert(content);

        //possible events drop down
        var selectEvents = new Element('select', {
            'id': 'pop_events'
        });

        // Object is not empty
        if (!Object.isEmpty(this.jsonReasons)) {

            //alert('filling object with data!!!!! ');

            jkeys = this.jsonReasons.keys();
            jvalies = this.jsonReasons.values();

            var options = "";

            for (var i = 0; i < jkeys.length; i++) {
                options = options + '<option value="' + jkeys[i] + '">' + jvalies[i].reasonValue + '</option>';
            }
            selectEvents.update(options);
            selectEvents.selectedIndex = 0;
        }
        else // Fill list with some test values
        {
            var options = '<option value="' + '0' + '">' + 'No Update reasons passed ' + '</option>';
            selectEvents.update(options);
            selectEvents.selectedIndex = 0;
        }

        var somehtml =
            "<span id='benefit_event_label'>" + this.labels.get("selectEvent") + "&nbsp;&nbsp;</span>" +
            "<span id='benefit_event_data'>";

        contentHTML.insert(somehtml);
        contentHTML.insert(selectEvents);
        contentHTML.insert("<br/><br/>");

        // contentHTML.insert("<span id='benefit_date_picker'>");

        var date_div = new Element("div", { id: "datepicker" });
        //date_div.update("Date of the event*");
        contentHTML.insert("<div style='float:left;' id='benefit_date_label'>" + this.labels.get("dateOfEvent") + "&nbsp;&nbsp;</div>");
        contentHTML.insert(date_div);

        // DatePickers definition
        var begDate = Date.today();
        //begDate = begDate.toString(global.dateFormat);
        begDate = begDate.toString('yyyyMMdd');
        var begDatePicker = new DatePicker(date_div, {
            defaultDate: begDate,
            toDate: begDate,
            draggable: false,
            manualDateInsertion: true,
            events: $H({ dateSelected: "EWS:datePicker_1_dateSelected" })
        });

        this.calendar = begDatePicker;

        //        contentHTML.insert("</span><BR><BR><span id='benefit_buttons'>");
        contentHTML.insert("<BR><BR><span id='benefit_buttons'>");

        //buttons
        var buttonsJson = {
            elements: []
        };
        var f = function() {
            this.registerLifeEventPopup.close();
            delete this.registerLifeEventPopup;
        };

        var ff = function() {
            var event_date = begDatePicker.actualDate; //.toString('yyyy-MM-dd');
            var reason_ind = selectEvents.selectedIndex;

            var xmlText = "<EWS>"
                         + "<SERVICE>CREATE_EVENT</SERVICE>"
                         + "<OBJECT TYPE='" + global.objectType + "'  >" + global.objectId + "</OBJECT>"
                         + "<PARAM>"
                         + "<event_code>" + jkeys[reason_ind] + "</event_code>"
                         + "<effective_date>" + event_date.toString('yyyy-MM-dd') + "</effective_date>"
                         + "</PARAM>"
                         + '</EWS>';

            this.makeAJAXrequest($H({ xml: xmlText, errorMethod: this.displayError.bind(this), 'successMethod': this.loadLifeEvents.bind(this) }));
        };



        var aux2 = {
            idButton: 'cancel',
            label: 'Cancel',
            handlerContext: null,
            className: 'infoPopUp_exampleButton',
            handler: f.bind(this),
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux2);

        var aux3 = {
            idButton: 'register',
            label: 'Register',
            handlerContext: null,
            className: 'infoPopUp_exampleButton',
            handler: ff.bind(this),
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux3);

        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();

        //insert buttons in div
        contentHTML.insert(buttons);
        contentHTML.insert("</span>");

        contentHTML.insert("<BR><BR>");

        // contentHTML.insert("<span id='benefit_text'>* The date of the event must be within the last 31 days</span>");

        //this.registerLifeEventPopup = new infoPopUp({ - no good, because then popup
        // cannot be closed with registerLifeEventPopup.close();...

        this.registerLifeEventPopup = new infoPopUp({
            closeButton: $H({
                'callBack': function() {

                    this.close();
                }
            }),

            htmlContent: contentHTML,
            indicatorIcon: 'void',
            width: 500
        });

        var currpopup = this.registerLifeEventPopup.create();

        //this.dateSelectedBind = begDatePicker.dateSelected.bind(this);
        //document.observe("EWS:datePicker_1_dateSelected", this.dateSelectedBind);
    },
    displayError: function(errorMessage) {
        if (this.registerLifeEventPopup.obHtmlContent.down("div.application_main_error_text") == null) {
            this.registerLifeEventPopup.obHtmlContent.insert('<div class="application_main_error_text">' + errorMessage.EWS.webmessage_text + '</div>');
        }
        else {
            this.registerLifeEventPopup.obHtmlContent.down("div.application_main_error_text").update(errorMessage.EWS.webmessage_text);
        }
    },

    transformPlanPage: function(returnXml, ajaxID) {
        var onKeyDown = function(obj, noDecimal, eventObject) {

            var event = (window.event) ? window.event : eventObject;
            //var keyID = event.keyCode;

            var lAllowedCharacters = new Array(8, 16, 46, 18, 37, 39, 9, 188); // Keycode events for forward, back, delete, shift, backspace, alt, comma 
            var i, j;

            if (obj.value.indexOf(" ") != -1) {
                obj.value = obj.value.replace(" ", "");
            }
            // Disallow if shift or ctl has been pressed
            if (event.ctrlKey == true) {
                event.returnValue = false;
                return;
            }
            // Allow numeric input
            if (((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105)) && event.shiftKey == false) {
                return;
            }

            // Allow 1 decimal to be used

            if (noDecimal != true) {
                if (global.commaSeparator == ".") {
                    if (event.keyCode == 190 || event.keyCode == 110) {
                        if (obj.value.indexOf(".") == -1) {
                            return;
                        } else {
                            event.returnValue = false;
                            return;
                        }
                    }
                    if (event.keyCode == 188) {
                        return;
                    }
                } else if (global.commaSeparator == ",") {
                    if (event.keyCode == 188) {
                        if (obj.value.indexOf(",") == -1) {
                            return;
                        } else {
                            event.returnValue = false;
                            return;
                        }
                    }
                    if (event.keyCode == 190 || event.keyCode == 110) {
                        return;
                    }

                }
            }

            // Allow nagivation characters
            for (i = 0; i < lAllowedCharacters.length; ++i) {
                if (event.keyCode == lAllowedCharacters[i]) {
                    return
                }
            }
            if (window.event) {
                event.returnValue = false;
            }
            else {
                eventObject.cancelBubble = true;
            }
        } .bind(this);

        // Fill the internal labels hash
        if (returnXml) {
            if (returnXml.EWS.labels) {
                this.parseLabels(returnXml.EWS.labels);
            }
        }

        //Insert code here to transform the XML into an HTML page
        appID = appID;
        planID = planID;

        this.contentDiv.update();

        if (appID == "CONFIRMATION") {
            var json = {
                elements: [],
                defaultButtonClassName: 'classOfMainDiv'

            };
            var buttonSubmit = {
                label: global.getLabel('submit'),
                idButton: 'benefits_buttonSubmit',
                className: 'OM_MassTrans_buttonsSecond',
                event: "EWS:benefits_1_submitButtonClicked",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            json.elements.push(buttonSubmit);
            var buttonPrevious = {
                label: global.getLabel("previous"),
                idButton: 'benefits_buttonPrevious',
                className: 'OM_MassTrans_buttonsSecond',
                event: "EWS:benefits_1_previousButtonClicked",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            json.elements.push(buttonPrevious);
            var buttonHome = {
                label: global.getLabel("home"),
                idButton: 'benefits_buttonHome',
                className: 'OM_MassTrans_selectButton',
                event: "EWS:benefits_1_homeButtonClicked",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            json.elements.push(buttonHome);
            //we call ButtonDisplayer class to get the elements to display
            this.ButtonDisplayerExample = new megaButtonDisplayer(json);
            //when we are going to insert the div containing the buttons we do this:

            var buttonDisplayerDiv = new Element("div", { 'class': 'application_benefits_section_noborder' });
            buttonDisplayerDiv.insert(this.ButtonDisplayerExample.getButtons());
            //this.footerDiv.insert(buttonDisplayerDiv);
            this.footerDiv.update(buttonDisplayerDiv);
        }
        else if ((appID == "") && (planID == "")) {
            //        if (this.footerDiv.innerHTML == "") {
            var json = {
                elements: [],
                defaultButtonClassName: 'classOfMainDiv'

            };
            var buttonNext = {
                label: global.getLabel('confirm'),
                idButton: 'benefits_buttonNext',
                className: 'OM_MassTrans_buttonsSecond',
                event: "EWS:benefits_1_nextButtonClicked",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            json.elements.push(buttonNext);
            var buttonPrevious = {
                label: global.getLabel("previous"),
                idButton: 'benefits_buttonPrevious',
                className: 'OM_MassTrans_buttonsSecond',
                event: "EWS:benefits_1_previousButtonClicked",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            json.elements.push(buttonPrevious);
            var buttonHome = {
                label: global.getLabel("home"),
                idButton: 'benefits_buttonHome',
                className: 'OM_MassTrans_selectButton',
                event: "EWS:benefits_1_homeButtonClicked",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            json.elements.push(buttonHome);
            //we call ButtonDisplayer class to get the elements to display
            this.ButtonDisplayerExample = new megaButtonDisplayer(json);
            //when we are going to insert the div containing the buttons we do this:

            var buttonDisplayerDiv = new Element("div", { 'class': 'application_benefits_section_noborder' });
            buttonDisplayerDiv.insert(this.ButtonDisplayerExample.getButtons());
            //this.footerDiv.insert(buttonDisplayerDiv);
            this.footerDiv.update(buttonDisplayerDiv);
            //        }
        }
        else {


            //        if (this.footerDiv.innerHTML == "") {
            var json = {
                elements: [],
                defaultButtonClassName: 'classOfMainDiv'

            };
            var buttonNext = {
                label: global.getLabel('next'),
                idButton: 'benefits_buttonNext',
                className: 'OM_MassTrans_buttonsSecond',
                event: "EWS:benefits_1_nextButtonClicked",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            json.elements.push(buttonNext);
            var buttonPrevious = {
                label: global.getLabel("previous"),
                idButton: 'benefits_buttonPrevious',
                className: 'OM_MassTrans_buttonsSecond',
                event: "EWS:benefits_1_previousButtonClicked",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            json.elements.push(buttonPrevious);
            var buttonHome = {
                label: global.getLabel("home"),
                idButton: 'benefits_buttonHome',
                className: 'OM_MassTrans_selectButton',
                event: "EWS:benefits_1_homeButtonClicked",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            json.elements.push(buttonHome);
            var buttonSave = {
                label: global.getLabel("save"),
                idButton: 'OM_MassTrans_save',
                className: 'OM_MassTrans_buttonsSecond',
                event: "EWS:benefits_1_saveButtonClicked",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            json.elements.push(buttonSave);

            //we call ButtonDisplayer class to get the elements to display
            this.ButtonDisplayerExample = new megaButtonDisplayer(json);
            //when we are going to insert the div containing the buttons we do this:

            var buttonDisplayerDiv = new Element("div", { 'class': 'application_benefits_section_noborder' });
            buttonDisplayerDiv.insert(this.ButtonDisplayerExample.getButtons());
            //this.footerDiv.insert(buttonDisplayerDiv);
            this.footerDiv.update(buttonDisplayerDiv);
            //        }
        }

        this.contentDiv.update();

        //Dependents and Beneficiaries
        this.headerDiv.update("<span style='text-align:left;font-weight:bold' class='application_main_text'>" + selectedMenuItemText + "</span>");

        if ((appID == "BEN_DEP") && (planID == "")) {

            var myOptions = Object.clone(this.options);
            myOptions.appId = "BEN_DEP";
            myOptions.className = "Dependents";
            myOptions.view = "Dependents";

            var dependentsWidget = new Dependents(myOptions);
            dependentsWidget.setEffectiveDate(this.benEffectiveDate, this.benDepBegda);
            this.widgetsReadyBinding = dependentsWidget.fillWidgets.bind(this);
            document.observe('PDC:widgetsReady' + this.widgetContainer, this.widgetsReadyBinding);

            this.widgetsStructure = new GetWidgets({
                eventName: 'PDC:widgetsReady' + this.widgetContainer,
                service: 'GET_WIDGETS',
                tabId: this.widgetContainer,
                objectType: global.objectType,
                objectId: global.objectId,
                target: this.contentDiv
            });

            var widScreen = 1;

        }
        else {
            //DependentsWidget.close();
        }
        //Medical Dental Vision
        if (appID == "BEN_HLTH") {

            //Get Plan information
            var screenOneXml = this.parseScreenBind({ 'inputXML': returnXml, 'screenNumber': 1 });
            //Get Dependents
            var screenTwoXml = this.parseScreenBind({ 'inputXML': returnXml, 'screenNumber': 2 });
            //Get Dependent configuration information
            var screenThreeXml = this.parseScreenBind({ 'inputXML': returnXml, 'screenNumber': 3 });

            //Build Plan table
            var healthPlanDiv = new Element("div", { "style": "width:90%" });
            //var healthPlanTable = new Element("table", {});

            //Build Dependents table
            var healthDependentsDiv = new Element("div", { 'class': 'application_benefits_section_border', "style": "width:90%" });
            var healthDependentsTable = new Element("table", {});

            var dependentsInfo = new dependentsInfoScreen({
                xmlIn: screenThreeXml
            });

            var healthPlans = new HealthPlanScreen2({
                appId: appID,
                json: screenOneXml,
                mode: 'edit',
                event: 'EWS:healthPlanUpdate',
                noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                entireXml: returnXml,
                dependentsCheckboxInfo: dependentsInfo.dependentsInfo
            }, this, '1', '1');
            healthPlans.getElement().id = "Health_Table";
            healthPlanDiv.update(healthPlans.getElement());
            // Add the table kit for the list of tickets
            try {
                //instantiate the tablekit with search
                TableKit.Sortable.init(healthPlanDiv.down("table[id=Health_Table]"), { pages: '100' });
            }
            catch (e) { }
            try {
                TableKit.reloadTable(healthPlanDiv.down("table[id=Health_Table]"), { pages: '100' });
            }
            catch (e) { }
            TableKit.options.autoLoad = true;
            healthPlans.getElement().className = "sortable";
            healthPlans.getElement().down("th", 0).style.paddingLeft = "5px";

            var ial = 0;
            while (healthPlanDiv.down("td#hlt_label_" + ial) != null) {
                healthPlanDiv.down("td#hlt_label_" + ial).style.textAlign = 'left';
                healthPlanDiv.down("#hlt_label_" + ial).style.paddingLeft = "15px";
                ial++;
            }

            ial = 0;
            var tempNCell;
            while ((tempNCell = healthPlanDiv.down("td", ial)) != null) {
                if (tempNCell.id.indexOf("hlt") == -1) {
                    tempNCell.style.textAlign = 'right';
                    tempNCell.style.paddingRight = '10px';
                }
                ial++;
            }

            tableHeaders = healthPlans.getElement().getElementsBySelector('th');
            for (var j = 0; j < tableHeaders.length; j++) {
                //tableHeaders[j].addClassName("table_nosort");                
                tableHeaders[j].addClassName("auto_width");
                tableHeaders[j].style.border = "0px";
                if (tableHeaders[j].innerHTML != "Plans") {
                    tableHeaders[j].style.textAlign = 'right';
                    tableHeaders[j].style.paddingRight = '10px';
                }

            }

            this.contentDiv.insert(healthPlanDiv);

            var screenTwoDiv = new Element("div", { "style": "width: 90%;" });
            if (screenTwoXml != null) {
                if (screenTwoXml.EWS.o_field_values.yglui_str_wid_record.length != 0) {
                    var screenTwoDiv = new Element("div", {});
                }
                else {
                    var screenTwoDiv = new Element("div", {});
                }
                screenTwoDiv.style.margin = "15px 0px 20px 0px";
                screenTwoDiv.style.textAlign = "left";
                screenTwoDiv.style.width = "90%";
                var depPanel = new DependentsPanel({
                    appId: appID,
                    mode: 'edit',
                    json: screenTwoXml,
                    event: 'EWS:benDependent_' + appID,
                    noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                    paiEvent: 'EWS:paiEvent_' + appID + '_benDependent',
                    validForm: 'EWS:validFormHandler_' + appID + '_benDependent',
                    entireXml: returnXml
                });
                this.simpleTable = depPanel.getElement();
                tableHeaders = depPanel.getElement().getElementsBySelector('th');


                for (var j = 0; j < tableHeaders.length; j++) {
                    //tableHeaders[j].addClassName("table_nosort");
                    tableHeaders[j].addClassName("auto_width");
                    tableHeaders[j].style.border = "0px";
                }

                tableCells = depPanel.getElement().getElementsBySelector('td')
                for (var j = 0; j < tableCells.length; j++) {
                    tableCells[j].align = "left";
                    tableCells[j].addClassName("auto_width");
                }

                this.simpleTable.style.width = '100%';
                try {
                    TableKit.Sortable.init(this.simpleTable, { pages: 50 });
                }
                catch (e) { }

                try {
                    TableKit.reloadTable(this.simpleTable, { pages: '100' });
                }
                catch (e) { }
                this.simpleTable.className = "sortable";
                screenTwoDiv.insert(depPanel.getElement());
                this.contentDiv.insert(screenTwoDiv);
                this.contentDiv.insert("<br/>");
            }
            if ($("benefitsContentDiv").down(".application_benefits_selected_option")) {
                healthPlans.changeClass($("benefitsContentDiv").down(".application_benefits_selected_option"));
            }
        }

        //Supp Life
        if (appID == "BEN_INSU") {

            var screenOneDiv = new Element("div", {});

            var screenOneXml = this.parseScreenBind({ 'inputXML': returnXml, 'screenNumber': 1 });
            var healthPlans = new SuppLifeScreen({
                appId: appID,
                json: screenOneXml,
                mode: 'edit',
                event: 'EWS:healthPlanUpdate',
                noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                entireXml: returnXml
            }, this, '1', '1');
            //            this.contentDiv.update(healthPlans.getElement());
            screenOneDiv.update(healthPlans.getElement());

            if (healthPlans.eoiExists()) {
                screenOneDiv.insert("<br/>");
                screenOneDiv.insert("<span style='color:red'>" + this.labels.get("eoiNote") + "</span>");
            }
            this.contentDiv.update(screenOneDiv);

            this.simpleTable = healthPlans.getElement();

            tableHeaders = healthPlans.getElement().getElementsBySelector('th')
            for (var j = 0; j < tableHeaders.length; j++) {
                //tableHeaders[j].addClassName("table_nosort");
                tableHeaders[j].addClassName("auto_width");
                tableHeaders[j].style.border = "0px";
                tableHeaders[j].style.paddingLeft = "5px";
                if (tableHeaders[j].id != "BEN_OPTION") {
                    tableHeaders[j].style.paddingRight = "10px";
                    tableHeaders[j].style.textAlign = "right";
                }
            }
            tableCells = healthPlans.getElement().getElementsBySelector('td')
            for (var j = 0; j < tableCells.length; j++) {

                tableCells[j].addClassName("auto_width");
                if (tableCells[j].id == "BEN_OPTION") {
                    tableCells[j].align = "left";
                    tableCells[j].style.paddingLeft = "15px";
                    try {
                        tableCells[j].down("div").getAttribute("style").setAttribute("cssText", tableCells[j].down("div").getAttribute("style").getAttribute("cssText") + ";float:left;");
                    }
                    catch (e) {
                        tableCells[j].down("div").setAttribute("style", tableCells[j].down("div").getAttribute("style") + ";float:left;");
                    }
                }
                else {
                    tableCells[j].style.textAlign = "right";
                    tableCells[j].style.paddingRight = "10px";
                    tableCells[j].style.paddingLeft = "15px";
                    tableCells[j].style.width = "117px";
                }
            }

            this.simpleTable.style.width = '80%';
            try {
                TableKit.Sortable.init(this.simpleTable, { pages: 50 });
            }
            catch (e) { }

            try {
                TableKit.reloadTable(this.simpleTable, { pages: '100' });
            }
            catch (e) { }
            this.simpleTable.className = "sortable";

            this.contentDiv.insert("<br/>");

            var screenTwoXml = this.parseScreenBind({ 'inputXML': returnXml, 'screenNumber': 2 });
            if (screenTwoXml) {
                if (screenTwoXml.EWS.o_field_values.yglui_str_wid_record.length != 0) {
                    var screenTwoDiv = new Element("div", { 'class': 'sortable', id: 'beneficiaries_div', 'style': 'width:80%' });
                }
                else {
                    var screenTwoDiv = new Element("div", { 'class': 'application_benefits_section_noborder', id: 'beneficiaries_div' });
                }

                var depPanel = new BeneficiariesPanel({
                    appId: appID,
                    mode: 'edit',
                    json: screenTwoXml,
                    event: 'EWS:benDependent_' + appID,
                    noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                    paiEvent: 'EWS:paiEvent_' + appID + '_benDependent',
                    validForm: 'EWS:validFormHandler_' + appID + '_benDependent',
                    entireXml: returnXml
                });
                this.simpleTable = depPanel.getElement();
                tableHeaders = depPanel.getElement().getElementsBySelector('th')
                for (var j = 0; j < tableHeaders.length; j++) {
                    //tableHeaders[j].addClassName("table_nosort");
                    tableHeaders[j].style.border = "0px";
                }
                tableCells = depPanel.getElement().getElementsBySelector('td')
                for (var j = 0; j < tableCells.length; j++) {
                    tableCells[j].align = "left";
                }
                this.simpleTable.style.width = '100%';
                TableKit.Sortable.init(this.simpleTable, { pages: 50 });
                try {
                    TableKit.Sortable.init(this.simpleTable, { pages: 50 });
                }
                catch (e) { }

                try {
                    TableKit.reloadTable(this.simpleTable, { pages: '100' });
                }
                catch (e) { }
                if (!enrolled_exists) {
                    screenTwoDiv.style.display = "none";
                }
                screenTwoDiv.insert(depPanel.getElement());
                this.contentDiv.insert(screenTwoDiv);
                this.simpleTable.className = "sortable";
                this.contentDiv.insert("<br/>");
                //this.contentDiv.insert(depPanel.getElement());
            }
            healthPlans.changeClass($("benefitsContentDiv").down(".enrolled_Row"));
        }
        //Health Savings Plan
        if ((appID == "BEN_SAV")) {

            this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_BENEFITS", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();
            this.xmlToBackend.EWS.SERVICE = "SAVE_BENEFITS";
            this.xmlToBackend.EWS.PARAM.APPID = appID;
            this.xmlToBackend.EWS.PARAM.RECORDS = returnXml.EWS.o_field_values;

            var fildsArray1 = objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record);
            var fieldsArray = objectToArray(fildsArray1[0].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
            var valuesHash = $H({});
            var textHash = $H({});
            for (var i = 0; i < fieldsArray.length; i++) {
                valuesHash.set(fieldsArray[i]["@fieldid"], fieldsArray[i]["@value"]);
                textHash.set(fieldsArray[i]["@fieldid"], fieldsArray[i]["#text"]);
            }
            var amountOkay = valuesHash.get("AMT_OK");
            var percentageOkay = valuesHash.get("PCT_OK");
            var unitsOkay = valuesHash.get("UNT_OKAY");

            var pretaxOkay = valuesHash.get("PRETAX_OK");
            var posttaxOkay = valuesHash.get("PSTTAX_OK");

            var bonusPretaxOkay = valuesHash.get("BON_PREOK");
            var bonusPosttaxOkay = valuesHash.get("BON_PSTOK");

            var payPeriods = valuesHash.get("PAYPERIODS");

            var healthSavingsWrapperDiv = new Element("div", { 'class': 'application_benefits_section_border_wide', 'style': 'width: 600px;' });

            var fieldToEdit = null;

            var testHealthSavingsPlanScreen = new healthSavingsPlanScreen();

            //Pre-tax Amount (Salary)
            if (amountOkay && pretaxOkay) {
                if (healthSavingsWrapperDiv.innerHTML != "") {
                    healthSavingsWrapperDiv.insert("<br/>");
                }
                healthSavingsWrapperDiv.insert(testHealthSavingsPlanScreen.createHealthSavingsPlanTable("preTax", "Amount", "Amt", "", "PRETAX_AMT", "PRETAX_MIN", "PRETAX_MAX", this.labels, valuesHash, textHash, payPeriods, this.xmlToBackend));
            }

            //Pre-tax Amount (Bonus)
            if (amountOkay && bonusPretaxOkay) {
                if (healthSavingsWrapperDiv.innerHTML != "") {
                    healthSavingsWrapperDiv.insert("<br/>");
                }
                healthSavingsWrapperDiv.insert(testHealthSavingsPlanScreen.createHealthSavingsPlanTable("preTax", "Amount", "Amt", "Bonus", "BON_PREAMT", "BPRAMT_MIN", "BPRAMT_MAX", this.labels, valuesHash, textHash, payPeriods, this.xmlToBackend));
            }

            //Pre-tax Percentage
            if (percentageOkay && pretaxOkay) {
                if (healthSavingsWrapperDiv.innerHTML != "") {
                    healthSavingsWrapperDiv.insert("<br/>");
                }
                healthSavingsWrapperDiv.insert(testHealthSavingsPlanScreen.createHealthSavingsPlanTable("preTax", "Percentage", "Pct", "", "PRETAX_PCT", "PREPCT_MIN", "PREPCT_MAX", this.labels, valuesHash, textHash, payPeriods, this.xmlToBackend));
            }

            //Pre-tax Percentage (Bonus)
            if (percentageOkay && bonusPretaxOkay) {
                if (healthSavingsWrapperDiv.innerHTML != "") {
                    healthSavingsWrapperDiv.insert("<br/>");
                }
                healthSavingsWrapperDiv.insert(testHealthSavingsPlanScreen.createHealthSavingsPlanTable("preTax", "Percentage", "Pct", "Bonus", "BON_PREPCT", "BPRPCT_MIN", "BPRPCT_MAX", this.labels, valuesHash, textHash, payPeriods, this.xmlToBackend));
            }

            //Pre-tax Units
            if (unitsOkay && pretaxOkay) {
                if (healthSavingsWrapperDiv.innerHTML != "") {
                    healthSavingsWrapperDiv.insert("<br/>");
                }
                healthSavingsWrapperDiv.insert(testHealthSavingsPlanScreen.createHealthSavingsPlanTable("preTax", "Units", "Units", "", "PRETAX_UNT", "PREUNT_MIN", "PREUNT_MAX", this.labels, valuesHash, textHash, payPeriods, this.xmlToBackend));
            }

            //Pre-tax Units (Bonus)
            if (unitsOkay && bonusPretaxOkay) {
                if (healthSavingsWrapperDiv.innerHTML != "") {
                    healthSavingsWrapperDiv.insert("<br/>");
                }
                healthSavingsWrapperDiv.insert(testHealthSavingsPlanScreen.createHealthSavingsPlanTable("preTax", "Units", "Units", "Bonus", "BON_PREUNT", "BPRUNT_MIN", "BPRUNT_MAX", this.labels, valuesHash, textHash, payPeriods, this.xmlToBackend));
            }

            //Post-tax Amount
            if (amountOkay && posttaxOkay) {
                if (healthSavingsWrapperDiv.innerHTML != "") {
                    healthSavingsWrapperDiv.insert("<br/>");
                }
                healthSavingsWrapperDiv.insert(testHealthSavingsPlanScreen.createHealthSavingsPlanTable("postTax", "Amount", "Amt", "", "PSTTAX_AMT", "PSTAMT_MIN", "PSTAMT_MAX", this.labels, valuesHash, textHash, payPeriods, this.xmlToBackend));
            }

            //Pre-tax Amount (Bonus)
            if (amountOkay && bonusPretaxOkay) {
                if (healthSavingsWrapperDiv.innerHTML != "") {
                    healthSavingsWrapperDiv.insert("<br/>");
                }
                healthSavingsWrapperDiv.insert(testHealthSavingsPlanScreen.createHealthSavingsPlanTable("postTax", "Amount", "Amt", "Bonus", "BON_PSTAMT", "BSTAMT_MIN", "BSTAMT_MAX", this.labels, valuesHash, textHash, payPeriods, this.xmlToBackend));
            }

            //Post-tax Percentage
            if (percentageOkay && posttaxOkay) {
                if (healthSavingsWrapperDiv.innerHTML != "") {
                    healthSavingsWrapperDiv.insert("<br/>");
                }
                healthSavingsWrapperDiv.insert(testHealthSavingsPlanScreen.createHealthSavingsPlanTable("postTax", "Percentage", "Pct", "", "PSTTAX_PCT", "PSTPCT_MIN", "PSTPCT_MAX", this.labels, valuesHash, textHash, payPeriods, this.xmlToBackend));
            }

            //Post-tax Percentage (Bonus)
            if (percentageOkay && bonusPosttaxOkay) {
                if (healthSavingsWrapperDiv.innerHTML != "") {
                    healthSavingsWrapperDiv.insert("<br/>");
                }
                healthSavingsWrapperDiv.insert(testHealthSavingsPlanScreen.createHealthSavingsPlanTable("postTax", "Percentage", "Pct", "Bonus", "BON_PSTPCT", "BSTPCT_MIN", "BSTPCT_MAX", this.labels, valuesHash, textHash, payPeriods, this.xmlToBackend));
            }

            //Post-tax Units
            if (unitsOkay && posttaxOkay) {
                if (healthSavingsWrapperDiv.innerHTML != "") {
                    healthSavingsWrapperDiv.insert("<br/>");
                }
                healthSavingsWrapperDiv.insert(testHealthSavingsPlanScreen.createHealthSavingsPlanTable("postTax", "Units", "Units", "", "PSTTAX_UNT", "PSTUNT_MIN", "PSTUNT_MAX", this.labels, valuesHash, textHash, payPeriods, this.xmlToBackend));
            }

            //Post-tax Units (Bonus)
            if (unitsOkay && bonusPretaxOkay) {
                if (healthSavingsWrapperDiv.innerHTML != "") {
                    healthSavingsWrapperDiv.insert("<br/>");
                }
                healthSavingsWrapperDiv.insert(testHealthSavingsPlanScreen.createHealthSavingsPlanTable("postTax", "Units", "Units", "Bonus", "BON_PSTUNT", "BSTUNT_MIN", "BSTUNT_MAX", this.labels, valuesHash, textHash, payPeriods, this.xmlToBackend));
            }

            var contentsArray = objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record);
            var iterator = 0;

            var healthCareFSAPlan = Class.create({ benPlan: '', contribAmt: '', contribMax: '', contribMin: '', enrolled: '', payPeriods: '', planType: '', urlPlan: '', waivePlan: '', ytdAmount: '' });
            var plansArray = $A();

            //Create an array of all the Health Care FSAs in the return XML
            while (contentsArray[iterator] != null) {

                var singlePlan = new healthCareFSAPlan();

                singlePlan.benPlan = textHash.get("BEN_PLAN");
                singlePlan.contribAmt = "";
                singlePlan.contribMax = "";
                singlePlan.contribMin = "";
                singlePlan.enrolled = valuesHash.get("ENROLLED");
                singlePlan.payPeriods = valuesHash.get("PAYPERIODS");
                singlePlan.planType = valuesHash.get("PLAN_TYPE");
                singlePlan.urlPlan = valuesHash.get("URL_PLAN");
                singlePlan.waivePlan = valuesHash.get("WAIVE_PLAN");
                singlePlan.ytdAmount = "";

                plansArray[iterator] = singlePlan;

                iterator++;
            }

            //Get the Health Care FSA URL and determine if the employee is currently waiving the FSA.
            iterator = 0;
            var waivePlanNumber = 0;
            var healthCareFsaUrl = null;
            var enrolledPlanNumber = null;
            var contribAmt;
            var contribMin;
            var contribMax;
            var payPeriods;
            var ytdAmount;
            while (plansArray[iterator]) {
                if (plansArray[iterator].waivePlan) {
                    waivePlanNumber = iterator;
                } else if (enrolledPlanNumber == null) {
                    enrolledPlanNumber = iterator;
                }
                if (!(plansArray[iterator].waivePlan)) {
                    contribAmt = Number(plansArray[iterator].contribAmt);
                    contribMin = Number(plansArray[iterator].contribMin);
                    contribMax = Number(plansArray[iterator].contribMax);
                    payPeriods = Number(plansArray[iterator].payPeriods);
                    ytdAmount = Number(plansArray[iterator].ytdAmount);
                    if (payPeriods == 0) {
                        payPeriods = 1;
                    }
                }
                if (plansArray[iterator].urlPlan)
                    healthCareFsaUrl = plansArray[iterator].urlPlan;
                if (plansArray[iterator].enrolled)
                    enrolledPlanNumber = iterator;
                iterator++;
            }

            var buttonsjson = { elements: [] };

            var contributeButtonsDiv = new Element("div", { 'class': 'application_benefits_section_noborder' });
            var contributeDiv = new Element("div", {});
            var removeContributionDiv = new Element("div", {});
            contributeButtonsDiv.insert(contributeDiv);
            contributeButtonsDiv.insert(removeContributionDiv);


            var noHealthPlanSelectedDiv = new Element("div", { "id": "NoHealthPlanSelectedDiv" }).update(this.labels.get("contributionWaived"));
            var contributeButton = {

                label: this.labels.get("contribute"),
                idButton: 'benefits_healthCareFsaContribute',
                event: "EWS:benefits_1_showHealthCareFSA",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            buttonsjson.elements.push(contributeButton);
            var ContributeButtonDisplayer = new megaButtonDisplayer(buttonsjson);
            contributeDiv.insert(ContributeButtonDisplayer.getButtons());
            contributeDiv.style.marginLeft = "-5px";
            buttonsjson = { elements: [] };

            var healthPlanSelectedDiv = new Element("div", {});

            var yearlyContributionSpan = new Element("span", { 'class': 'application_benefits_align_left' });
            var yearlyContributionInput = new Element("input", { 'class': 'application_benefits_float_left', 'value': (contribAmt - ytdAmount).toFixed(2) });

            yearlyContributionInput.observe('blur', function() {
                yearlyContributionInput.value = Number(yearlyContributionInput.value).toFixed(2);
                perPayPeriodInput.value = ((yearlyContributionInput.value - ytdAmount) / payPeriods).toFixed(2);
                plansArray[enrolledPlanNumber].contribAmt = yearlyContributionInput.value;
                buildSendXml();
            });
            var perYearLabel = new Element("div", {}).update(this.labels.get("perYear"));
            yearlyContributionSpan.insert(yearlyContributionInput);
            yearlyContributionSpan.insert(perYearLabel);
            healthPlanSelectedDiv.insert(yearlyContributionSpan);

            healthPlanSelectedDiv.insert("<br/>");

            var perPayPeriodSpan = new Element("span", { 'class': 'application_benefits_align_left' });
            var perPayPeriodInput = new Element("input", { disabled: true, 'class': 'application_benefits_noneditable_textbox application_benefits_float_left', 'value': ((contribAmt - ytdAmount) / payPeriods).toFixed(2) });
            var perPayPeriodLabel = new Element("div", {}).update(this.labels.get("perPayPeriod"));
            perPayPeriodSpan.insert(perPayPeriodInput);
            perPayPeriodSpan.insert(perPayPeriodLabel);
            healthPlanSelectedDiv.insert(perPayPeriodSpan);

            healthPlanSelectedDiv.insert("<br/>");

            var minimumPerYearSpan = new Element("span", {});
            //var minimumPerYearLabel = new Element("div", {}).update(this.labels.get("minimumPerYear") + ":  " + contribMin.toFixed(2));
            var minimumPerYearLabel = new Element("div", {});
            minimumPerYearSpan.insert(minimumPerYearLabel);
            healthPlanSelectedDiv.insert(minimumPerYearSpan);

            healthPlanSelectedDiv.insert("<br/>");

            var maximumPerYearSpan = new Element("span", {});
            //var maximumPerYearLabel = new Element("div", {}).update(this.labels.get("maximumPerYear") + ":  " + contribMax.toFixed(2));
            var maximumPerYearLabel = new Element("div", {});
            maximumPerYearSpan.insert(maximumPerYearLabel);
            healthPlanSelectedDiv.insert(maximumPerYearSpan);

            var removeContributionButton = {
                label: this.labels.get("removeContribution"),
                idButton: 'benefits_healthCareFsaRemove',
                event: "EWS:benefits_1_hideHealthCareFSA",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            buttonsjson.elements.push(removeContributionButton);
            var RemoveButtonDisplayer = new megaButtonDisplayer(buttonsjson);
            removeContributionDiv.insert(RemoveButtonDisplayer.getButtons());
            removeContributionDiv.style.marginLeft = "-5px";

            var noHealthPlanWrapperDiv = new Element("div", { 'class': 'application_benefits_section_noborder' });

            noHealthPlanWrapperDiv.insert(noHealthPlanSelectedDiv);

            this.contentDiv.insert(contributeButtonsDiv);
            this.contentDiv.insert(noHealthPlanWrapperDiv);

            var screenTwoXml = this.parseScreenBind({ 'inputXML': returnXml, 'screenNumber': 2 });
            if (screenTwoXml) {
                if (screenTwoXml.EWS.o_field_values.yglui_str_wid_record.length != 0) {
                    var screenTwoDiv = new Element("div", { 'class': '', 'style': 'clear:left;width:600px' });
                }
                else {
                    var screenTwoDiv = new Element("div", { 'class': 'application_benefits_section_noborder' });
                }

                var depPanel = new BeneficiariesPanel({
                    appId: appID,
                    mode: 'edit',
                    json: screenTwoXml,
                    event: 'EWS:benDependent_' + appID,
                    noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                    paiEvent: 'EWS:paiEvent_' + appID + '_benDependent',
                    validForm: 'EWS:validFormHandler_' + appID + '_benDependent',
                    entireXml: returnXml
                });

                this.simpleTable = depPanel.getElement();
                tableHeaders = depPanel.getElement().getElementsBySelector('th')
                for (var j = 0; j < tableHeaders.length; j++) {
                    //tableHeaders[j].addClassName("table_nosort");
                    tableHeaders[j].style.border = "0px";
                }
                tableCells = depPanel.getElement().getElementsBySelector('td')
                for (var j = 0; j < tableCells.length; j++) {
                    tableCells[j].align = "left";
                }
                this.simpleTable.style.width = '100%';
                try {
                    TableKit.Sortable.init(this.simpleTable, { pages: 50 });
                }
                catch (e) { }

                try {
                    TableKit.reloadTable(this.simpleTable, { pages: '100' });
                }
                catch (e) { }
                this.simpleTable.className = "sortable";
                screenTwoDiv.insert(depPanel.getElement());
                //this.contentDiv.insert(depPanel.getElement());
            }

            var hideHealthCareFSAInfo = function(args) {
                // Don't set the amount if the screen is being initially loaded. Otherwise status indicator will update
                if (args != true) {
                    document.fire("EWS:benefits_1_setContributionAmount", { value: 0 });
                }
                noHealthPlanWrapperDiv.style.display = "block";
                healthSavingsWrapperDiv.style.display = "none"
                contributeDiv.style.display = "block";
                removeContributionDiv.style.display = "none";
                if (screenTwoDiv) screenTwoDiv.style.display = "none";
                iterator = 0;
                if (plansArray[iterator].waivePlan == 'X') {
                    plansArray[iterator].enrolled = 'X';
                }
                else {
                    plansArray[iterator].enrolled = '';
                }
                //Un-enroll
                $A(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)).each(function(record, i) {
                    var isWaivePlan = false;
                    $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, j) {
                        if (record["@fieldid"] == "WAIVE_PLAN") {
                            if ((record["@value"] == "X") || (record["#text"])) {
                                isWaivePlan = true;
                            }
                            else {
                                isWaivePlan = false;
                            }
                        }
                    } .bind(this));
                    $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, j) {
                        if (field["@fieldid"] == "ENROLLED") {
                            if (isWaivePlan) {
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["@value"] = "X";
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["#text"] = "X";
                            }
                            else {
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["@value"] = "";
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["#text"] = "";
                            }
                        }
                    } .bind(this));
                } .bind(this));
                //  $A(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(record, i) {
                //      if (record["@fieldid"] == "WAIVE_PLAN") {
                //          if ((record["@value"] == "X") || (record["#text"])) {
                //              isWaivePlan = true;
                //         }
                //          else {
                //              isWaivePlan = false;
                //          }
                //      }
                //  } .bind(this));
            } .bind(this);
            var hideHealthCareFSAInfoBind = hideHealthCareFSAInfo.bind(this);
            document.observe("EWS:benefits_1_hideHealthCareFSA", hideHealthCareFSAInfoBind);

            var showHealthCareFSAInfo = function(args) {
                // Don't set the amount if the screen is being initially loaded. Otherwise status indicator will update
                if (args != true) {
                    document.fire("EWS:benefits_1_calculateContributionAmount", { 'screen': fildsArray1[0].contents.yglui_str_wid_content["@key_str"] });
                }
                noHealthPlanWrapperDiv.style.display = "none";
                healthSavingsWrapperDiv.style.display = "block";
                contributeDiv.style.display = "none";
                removeContributionDiv.style.display = "block";
                if (screenTwoDiv) screenTwoDiv.style.display = "block";
                iterator = 0;
                if (plansArray[iterator].waivePlan == 'X') {
                    plansArray[iterator].enrolled = '';
                }
                else {
                    plansArray[iterator].enrolled = 'X';
                }

                //Enroll
                $A(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)).each(function(record, i) {
                    var isWaivePlan = false;
                    $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, j) {
                        if (record["@fieldid"] == "WAIVE_PLAN") {
                            if ((record["@value"] == "X") || (record["#text"])) {
                                isWaivePlan = true;
                            }
                            else {
                                isWaivePlan = false;
                            }
                        }
                    } .bind(this));
                    $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, j) {
                        if (field["@fieldid"] == "ENROLLED") {
                            if (isWaivePlan) {
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["@value"] = "";
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["#text"] = "";
                            }
                            else {
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["@value"] = "X";
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["#text"] = "X";
                            }
                        }
                    } .bind(this));
                } .bind(this));

                plansArray[iterator].contribAmt = yearlyContributionInput.value;
            } .bind(this);
            var showHealthCareFSAInfoBind = showHealthCareFSAInfo.bind(this);
            document.observe("EWS:benefits_1_showHealthCareFSA", showHealthCareFSAInfoBind);

            //If waived...
            if (waivePlanNumber == enrolledPlanNumber) {
                hideHealthCareFSAInfo(true);
            }
            //If not waived...
            else {
                showHealthCareFSAInfo(true);
            }


            this.contentDiv.insert(healthSavingsWrapperDiv);
            if (screenTwoXml) {
                this.contentDiv.insert(screenTwoDiv);
                this.contentDiv.insert("<br/>");
            }


        }
        // ========== START Health Care FSA ========== //
        if (appID == "BEN_FSA") {
            //this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_REQUEST", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();

            this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_BENEFITS", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();

            this.xmlToBackend.EWS.SERVICE = "SAVE_BENEFITS";
            this.xmlToBackend.EWS.PARAM.APPID = appID;
            //this.xmlToBackend.EWS.o_field_values = returnXml.EWS.o_field_values;
            this.xmlToBackend.EWS.PARAM.RECORDS = returnXml.EWS.o_field_values;

            var contentsArray = objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record);
            var iterator = 0;

            var healthCareFSAPlan = Class.create({ benPlan: '', contribAmt: '', contribMax: '', contribMin: '', enrolled: '', payPeriods: '', planType: '', urlPlan: '', waivePlan: '', ytdAmount: '' });
            var plansArray = $A();

            //Create an array of all the Health Care FSAs in the return XML
            while (contentsArray[iterator] != null) {
                var singlePlan = new healthCareFSAPlan();

                singlePlan.benPlan = contentsArray[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[0]["#text"];
                singlePlan.contribAmt = contentsArray[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[1]["@value"];
                singlePlan.contribMax = contentsArray[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[2]["@value"];
                singlePlan.contribMin = contentsArray[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[3]["@value"];
                singlePlan.enrolled = contentsArray[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[4]["@value"];
                singlePlan.payPeriods = contentsArray[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[5]["@value"];
                singlePlan.planType = contentsArray[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[6]["@value"];
                singlePlan.urlPlan = contentsArray[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[7]["@value"];
                singlePlan.waivePlan = contentsArray[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[8]["@value"];
                singlePlan.ytdAmount = contentsArray[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[9]["@value"];

                plansArray[iterator] = singlePlan;

                iterator++;
            }

            //Get the Health Care FSA URL and determine if the employee is currently waiving the FSA.
            iterator = 0;
            var waivePlanNumber = 0;
            var healthCareFsaUrl = null;
            var enrolledPlanNumber = 0;
            var enrolledHS = false;
            var contribAmt;
            var contribMin;
            var contribMax;
            var payPeriods;
            var ytdAmount;
            while (plansArray[iterator]) {
                if (plansArray[iterator].waivePlan) {
                    waivePlanNumber = iterator;
                } else if (enrolledPlanNumber == null) {
                    enrolledPlanNumber = iterator;
                }
                if (!(plansArray[iterator].waivePlan)) {
                    contribAmt = Number(plansArray[iterator].contribAmt);
                    contribMin = Number(plansArray[iterator].contribMin);
                    contribMax = Number(plansArray[iterator].contribMax);
                    payPeriods = Number(plansArray[iterator].payPeriods);
                    ytdAmount = Number(plansArray[iterator].ytdAmount);
                    if (payPeriods == 0) {
                        payPeriods = 1;
                    }
                }
                if (plansArray[iterator].urlPlan)
                    healthCareFsaUrl = plansArray[iterator].urlPlan;
                if (plansArray[iterator].enrolled) {
                    enrolledPlanNumber = iterator;
                    enrolledHS = true;
                }
                iterator++;
            }

            var buildSendXml = function() {
                this.xmlToBackend.EWS.SERVICE = "SAVE_BENEFITS";
                this.xmlToBackend.EWS.PARAM.APPID = appID;
                //this.xmlToBackend.EWS.o_field_values = returnXml.EWS.o_field_values;

                iterator = 0;
                while (plansArray[iterator] != null) {
                    objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record)[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[0]["#text"] = plansArray[iterator].benPlan;
                    objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record)[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[1]["@value"] = plansArray[iterator].contribAmt;
                    objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record)[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[2]["@value"] = plansArray[iterator].contribMax;
                    objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record)[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[3]["@value"] = plansArray[iterator].contribMin;
                    objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record)[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[4]["@value"] = plansArray[iterator].enrolled;
                    objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record)[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[5]["@value"] = plansArray[iterator].payPeriods;
                    objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record)[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[6]["@value"] = plansArray[iterator].planType;
                    objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record)[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[7]["@value"] = plansArray[iterator].urlPlan;
                    objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record)[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[8]["@value"] = plansArray[iterator].waivePlan;
                    objectToArray(returnXml.EWS.o_field_values.yglui_str_wid_record)[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[9]["@value"] = plansArray[iterator].ytdAmount;
                    iterator++;
                }

                this.xmlToBackend.EWS.PARAM.RECORDS = returnXml.EWS.o_field_values;
            } .bind(this);

            var buttonsjson = { elements: [] };

            var contributeButtonsDiv = new Element("div", { 'class': 'application_benefits_section_noborder' });
            var contributeDiv = new Element("div", {});
            var removeContributionDiv = new Element("div", {});
            contributeButtonsDiv.insert(contributeDiv);
            contributeButtonsDiv.insert(removeContributionDiv);

            var noHealthPlanSelectedDiv = new Element("div", { "id": "NoHealthPlanSelectedDiv" }).update(this.labels.get("contributionWaived"));
            var contributeButton = {
                label: this.labels.get("contribute"),
                idButton: 'benefits_healthCareFsaContribute',
                event: "EWS:benefits_1_showHealthCareFSA",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            buttonsjson.elements.push(contributeButton);
            var ContributeButtonDisplayer = new megaButtonDisplayer(buttonsjson);
            contributeDiv.insert(ContributeButtonDisplayer.getButtons());
            contributeDiv.style.marginLeft = "-5px";
            buttonsjson = { elements: [] };

            var healthPlanSelectedDiv = new Element("div", { "width": "100%", 'style': 'padding:10px' });

            var yearlyContributionDiv = new Element("div", { 'class': 'application_benefits_align_left', "style": "clear:left", "width": "50%" });
            var yearlyContributionInput = new Element("input", { "size": "8", 'class': 'application_benefits_float_left', 'value': longToDisplay(Number(contribAmt - ytdAmount)), 'maxlength': contribMax.toFixed(2).length });

            yearlyContributionInput.observe('blur', function() {

                yearlyContributionInput.value = yearlyContributionInput.value.gsub(global['thousandsSeparator'], '');
                yearlyContributionInput.value = displayToLong(yearlyContributionInput.value);
                perPayPeriodInput.value = longToDisplay(Number(((yearlyContributionInput.value - ytdAmount) / payPeriods)));
                plansArray[enrolledPlanNumber].contribAmt = yearlyContributionInput.value;
                yearlyContributionInput.value = longToDisplay(Number(yearlyContributionInput.value));
                buildSendXml();
                document.fire("EWS:benefits_1_updateMenuItem", { newValue: displayToLong(perPayPeriodInput.value) });
            });
            yearlyContributionInput.observe("keydown", function(event) { onKeyDown(yearlyContributionInput, false, event); });

            var perYearLabel = new Element("span", { 'align': 'left', 'style': 'float:left' }).update(this.labels.get("perYear") + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
            yearlyContributionDiv.insert(yearlyContributionInput);
            yearlyContributionDiv.insert(perYearLabel);
            healthPlanSelectedDiv.insert(yearlyContributionDiv);

            //healthPlanSelectedDiv.insert("<br/>");

            var perPayPeriodDiv = new Element("div", { 'class': 'application_benefits_align_left', "style": "float:left", "width": "50%" });
            var perPayPeriodInput = new Element("input", { "size": "8", disabled: true, 'class': 'application_benefits_noneditable_textbox application_benefits_float_left', 'value': (longToDisplay(Number(contribAmt - ytdAmount) / payPeriods)) });
            var perPayPeriodLabel = new Element("span", { 'align': 'left' }).update(this.labels.get("perPayPeriod"));
            perPayPeriodDiv.insert(perPayPeriodInput);
            perPayPeriodDiv.insert(perPayPeriodLabel);
            healthPlanSelectedDiv.insert(perPayPeriodDiv);

            healthPlanSelectedDiv.insert("<br/><br/>");

            var minimumPerYearSpan = new Element("span", {});
            var minimumPerYearLabel = new Element("div", { 'align': 'right' }).update(this.labels.get("minimumPerYear") + ":  " + longToDisplay(contribMin));
            minimumPerYearSpan.insert(minimumPerYearLabel);
            healthPlanSelectedDiv.insert(minimumPerYearSpan);

            // healthPlanSelectedDiv.insert("<br/>");

            var maximumPerYearSpan = new Element("span", {});
            var maximumPerYearLabel = new Element("div", { 'align': 'right' }).update(this.labels.get("maximumPerYear") + ":  " + longToDisplay(contribMax));
            maximumPerYearSpan.insert(maximumPerYearLabel);
            healthPlanSelectedDiv.insert(maximumPerYearSpan);

            var removeContributionButton = {
                label: this.labels.get("removeContribution"),
                idButton: 'benefits_healthCareFsaRemove',
                event: "EWS:benefits_1_hideHealthCareFSA",
                eventOrHandler: true,
                type: 'button',
                standardButton: true
            };
            buttonsjson.elements.push(removeContributionButton);
            var RemoveButtonDisplayer = new megaButtonDisplayer(buttonsjson);
            removeContributionDiv.insert(RemoveButtonDisplayer.getButtons());
            removeContributionDiv.style.marginLeft = "-5px";

            var noHealthPlanWrapperDiv = new Element("div", { 'class': 'application_benefits_section_noborder' });
            var healthPlanWrapperDiv = new Element("div", { 'class': 'application_benefits_section_border', 'style': '' });

            noHealthPlanWrapperDiv.insert(noHealthPlanSelectedDiv);
            healthPlanWrapperDiv.insert(healthPlanSelectedDiv);

            this.contentDiv.insert(contributeButtonsDiv);
            this.contentDiv.insert(noHealthPlanWrapperDiv);
            this.contentDiv.insert(healthPlanWrapperDiv);

            var hideHealthCareFSAInfo = function(args) {
                if (args != true) {
                    document.fire("EWS:benefits_1_updateMenuItem", { newValue: 0 });
                }
                noHealthPlanWrapperDiv.style.display = "";
                healthPlanWrapperDiv.style.display = "none";
                contributeDiv.style.display = "";
                removeContributionDiv.style.display = "none";
                if (screenTwoDiv) screenTwoDiv.style.display = "none";
                iterator = 0;
                if (plansArray[iterator].waivePlan == 'X') {
                    plansArray[iterator].enrolled = 'X';
                }
                else {
                    plansArray[iterator].enrolled = '';
                }
                $A(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)).each(function(record, i) {
                    var isWaivePlan = false;
                    $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, j) {
                        if (record["@fieldid"] == "WAIVE_PLAN") {
                            if ((record["@value"] == "X") || (record["#text"])) {
                                isWaivePlan = true;
                            }
                            else {
                                isWaivePlan = false;
                            }
                        }
                    } .bind(this));
                    $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, j) {
                        if (field["@fieldid"] == "ENROLLED") {
                            if (isWaivePlan) {
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["@value"] = "X";
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["#text"] = "X";
                            }
                            else {
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["@value"] = "";
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["#text"] = "";
                            }
                        }
                    } .bind(this));
                } .bind(this));
            } .bind(this);
            var hideHealthCareFSAInfoBind = hideHealthCareFSAInfo.bind(this);
            document.observe("EWS:benefits_1_hideHealthCareFSA", hideHealthCareFSAInfoBind);

            var showHealthCareFSAInfo = function(args) {
                if (args != true) {
                    document.fire("EWS:benefits_1_updateMenuItem", { newValue: displayToLong(perPayPeriodInput.value) });
                }
                noHealthPlanWrapperDiv.style.display = "none";
                healthPlanWrapperDiv.style.display = "";
                contributeDiv.style.display = "none";
                removeContributionDiv.style.display = "";
                if (screenTwoDiv) screenTwoDiv.style.display = "none";
                iterator = 0;
                if (plansArray[iterator].waivePlan == 'X') {
                    plansArray[iterator].enrolled = '';
                }
                else {
                    plansArray[iterator].enrolled = 'X';
                }

                $A(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)).each(function(record, i) {
                    var isWaivePlan = false;
                    $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, j) {
                        if (record["@fieldid"] == "WAIVE_PLAN") {
                            if ((record["@value"] == "X") || (record["#text"])) {
                                isWaivePlan = true;
                            }
                            else {
                                isWaivePlan = false;
                            }
                        }
                    } .bind(this));
                    $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, j) {
                        if (field["@fieldid"] == "ENROLLED") {
                            if (isWaivePlan) {
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["@value"] = "";
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["#text"] = "";
                            }
                            else {
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["@value"] = "X";
                                objectToArray(objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record)[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field)[j]["#text"] = "X";
                            }
                        }
                    } .bind(this));
                } .bind(this));

                plansArray[iterator].contribAmt = yearlyContributionInput.value;
            } .bind(this);
            var showHealthCareFSAInfoBind = showHealthCareFSAInfo.bind(this);
            document.observe("EWS:benefits_1_showHealthCareFSA", showHealthCareFSAInfoBind);

            //If waived...
            if (!enrolledHS) {
                hideHealthCareFSAInfo(true);
            }
            //If not waived...
            else {
                showHealthCareFSAInfo(true);
            }
        }
        // ========== END Health Care FSA ========== //

        //Dependent Care FSA
        if (appID == "BEN_FSA") {

        }

        //Miscellaneous (Should look like an insurance screen)
        if (appID == "BEN_MISC") {

            var screenOneDiv = new Element("div", { 'class': 'application_benefits_section_border' });

            var screenOneXml = this.parseScreenBind({ 'inputXML': returnXml, 'screenNumber': 1 });
            if (this.parseScreenBind({ 'inputXML': returnXml, 'screenNumber': 2 }) != null) {
                var miscPlans = new SuppLifeScreen({
                    appId: appID,
                    json: screenOneXml,
                    mode: 'edit',
                    event: 'EWS:miscPlanUpdate',
                    noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                    entireXml: returnXml
                }, this, '1', '1');
            }
            else {
                var miscPlans = new SuppLifeScreen({
                    appId: appID,
                    json: returnXml,
                    mode: 'edit',
                    event: 'EWS:miscPlanUpdate',
                    noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                    entireXml: returnXml
                }, this, '1', '1');
            }
            screenOneDiv.update(miscPlans.getElement());
            this.contentDiv.update(screenOneDiv);

            this.simpleTable = miscPlans.getElement();
            tableHeaders = miscPlans.getElement().getElementsBySelector('th')
            for (var j = 0; j < tableHeaders.length; j++) {
                //tableHeaders[j].addClassName("table_nosort");
            }
            tableCells = miscPlans.getElement().getElementsBySelector('td')
            for (var j = 0; j < tableCells.length; j++) {
                tableCells[j].align = "left";
            }
            this.simpleTable.style.width = '100%';
            try {
                TableKit.Sortable.init(this.simpleTable, { pages: 50 });
            }
            catch (e) { }

            try {
                TableKit.reloadTable(this.simpleTable, { pages: '100' });
            }
            catch (e) { }

            this.contentDiv.insert("<br/>");

            var screenTwoXml = this.parseScreenBind({ 'inputXML': returnXml, 'screenNumber': 2 });
            if (screenTwoXml != null) {
                if (screenTwoXml.EWS.o_field_values.yglui_str_wid_record.length != 0) {
                    var screenTwoDiv = new Element("div", { 'class': 'application_benefits_section_border' });
                }
                else {
                    var screenTwoDiv = new Element("div", { 'class': 'application_benefits_section_noborder' });
                }

                var depPanel = new BeneficiariesPanel({
                    appId: appID,
                    mode: 'edit',
                    json: screenTwoXml,
                    event: 'EWS:benDependent_' + appID,
                    noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                    paiEvent: 'EWS:paiEvent_' + appID + '_benDependent',
                    validForm: 'EWS:validFormHandler_' + appID + '_benDependent',
                    entireXml: returnXml
                });

                this.simpleTable = depPanel.getElement();
                tableHeaders = depPanel.getElement().getElementsBySelector('th')
                for (var j = 0; j < tableHeaders.length; j++) {
                    //tableHeaders[j].addClassName("table_nosort");
                }
                tableCells = depPanel.getElement().getElementsBySelector('td')
                for (var j = 0; j < tableCells.length; j++) {
                    tableCells[j].align = "left";
                }
                this.simpleTable.style.width = '100%';
                TableKit.Sortable.init(this.simpleTable, { pages: 50 });
                TableKit.options.autoLoad = true;

                screenTwoDiv.insert(depPanel.getElement());
                this.contentDiv.insert(screenTwoDiv);
                this.contentDiv.insert("<br/>");
            }
        }

        //Summary
        if ((appID == "") && (planID == "")) {
            this.makeAJAXrequest($H({ xml: '<EWS><SERVICE>GET_PLANS</SERVICE><OBJECT TYPE="' + global.objectType + '">' + global.objectId + '</OBJECT><PARAM><EVENT_CODE>' + this.selectedAdjustmentReason + '</EVENT_CODE></PARAM></EWS>', 'successMethod': 'processSummary' }));
        }

        //Confirmation
        if ((appID == "CONFIRMATION") && (planID == "")) {
            var confirmationTextDiv = new Element("div", { 'style': 'text-align: left' }).update("By clicking the \"Submit\" button below, I acknowledge that the information I have provided is true and accurate to the best of my knowledge.");
            var confirmationCheckboxDiv = new Element("div", { 'style': 'text-align: left' });
            var confirmationCheckbox = new Element("input", { 'type': 'checkbox' });
            var confirmationCheckboxText = new Element("span", { 'style': 'text-align: left' }).update("By checking this box, I acknowledge that I agree to these terms & conditions.");
            this.ButtonDisplayerExample.disable('benefits_buttonSubmit');
            confirmationCheckbox.observe("click", function() {
                if (confirmationCheckbox.checked) {
                    this.ButtonDisplayerExample.enable('benefits_buttonSubmit');
                }
                if (!confirmationCheckbox.checked) {
                    this.ButtonDisplayerExample.disable('benefits_buttonSubmit');
                }
            } .bind(this));
            this.contentDiv.update(confirmationTextDiv);
            this.contentDiv.insert("<br/>");
            confirmationCheckboxDiv.insert(confirmationCheckbox);
            confirmationCheckboxDiv.insert(confirmationCheckboxText);
            this.contentDiv.insert(confirmationCheckboxDiv);
        }
    },

    parseScreen: function(args) {
        var args = getArgs(args);
        var inputXML = args.inputXML;
        var outputData = { 'EWS': { 'o_date_ranges': '', 'o_field_settings': '', 'o_field_values': '', 'o_screen_buttons': '', 'o_widget_screens': '', 'labels': '', 'messages': '', 'webmessage_type': '', 'webmessage_text': ''} };
        var screenNumber = args.screenNumber;
        var currentIndex = 0;
        var arrayOfNodes = new Array();

        outputData.EWS.labels = inputXML.EWS.labels;

        var arrayInputXML3 = objectToArray(inputXML.EWS.o_field_settings.yglui_str_wid_fs_record);
        while (arrayInputXML3[currentIndex] != null) {
            if (arrayInputXML3[currentIndex]["@screen"] == screenNumber) {
                arrayOfNodes.push(arrayInputXML3[currentIndex]);
            }
            currentIndex++;
        }
        outputData.EWS.o_field_settings = { 'yglui_str_wid_fs_record': arrayOfNodes };

        if (objectToArray(outputData.EWS.o_field_settings.yglui_str_wid_fs_record).length == 1) {
            outputData.EWS.o_field_settings.yglui_str_wid_fs_record = outputData.EWS.o_field_settings.yglui_str_wid_fs_record[0];
        }

        currentIndex = 0;
        arrayOfNodes = new Array();

        var arrayInputXML1 = objectToArray(inputXML.EWS.o_field_values.yglui_str_wid_record);
        while (arrayInputXML1[currentIndex] != null) {
            if (arrayInputXML1[currentIndex]["@screen"] == screenNumber) {
                arrayOfNodes.push(arrayInputXML1[currentIndex]);
            }
            currentIndex++;
        }
        outputData.EWS.o_field_values = { 'yglui_str_wid_record': arrayOfNodes };

        if (outputData.EWS.o_field_values.yglui_str_wid_record.length == 1) {
            outputData.EWS.o_field_values.yglui_str_wid_record = outputData.EWS.o_field_values.yglui_str_wid_record[0];
        }

        currentIndex = 0;
        arrayOfNodes = new Array();

        if (objectToArray(outputData.EWS.o_field_values.yglui_str_wid_record).length == 0) {
            return null;
        }
        var arrayInputXML2 = objectToArray(inputXML.EWS.o_widget_screens.yglui_str_wid_screen);
        while (arrayInputXML2[currentIndex] != null) {
            if (arrayInputXML2[currentIndex]["@screen"] == screenNumber) {
                arrayOfNodes.push(arrayInputXML2[currentIndex]);
            }
            currentIndex++;
        }
        outputData.EWS.o_widget_screens = { 'yglui_str_wid_screen': arrayOfNodes };

        if (objectToArray(outputData.EWS.o_widget_screens.yglui_str_wid_screen).length == 1) {
            outputData.EWS.o_widget_screens.yglui_str_wid_screen = outputData.EWS.o_widget_screens.yglui_str_wid_screen[0];
        }

        return outputData;

    },

    processSummary: function(returnXml, ajaxID) {
        var lastOption = null;
        var xmlRowNumber = 0;
        var tableSectionNumber = 0;
        var radioButton = null;
        var preTaxTotal = 0.00;
        var postTaxTotal = 0.00;
        var employerTotal = 0.00;
        //  debugger;
        var data = {
            header: [{ text: "     " },
             { text: this.labels.get('plan'), id: 'col1' },
             { text: "     " },
             { text: this.labels.get('planElection'), id: 'col2' },
             { text: "     " },
             { text: this.labels.get('preTax'), id: 'col3' },
             { text: "     " },
             { text: this.labels.get('postTax'), id: 'col4' },
             { text: "     " },
             { text: this.labels.get('employerCost'), id: 'col5'}],
            rows: $H({})
        };

        if (objectToArray(returnXml.EWS.o_benefits.yglui_str_ben_plan_out).length == 1 && returnXml.EWS.o_benefits.yglui_str_ben_plan_out["@appid"] == "BEN_DEP") {
            var message = new Element("div");
            message.update(this.labels.get('messageText'));
            this.contentDiv.insert(message);
        }
        else {
            while (returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber] != null) {
                if (returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@plan_type"] != "") {
                    var plan = "<span class='application_action_link' onclick='javascript:document.fire(\"EWS:benefits_1_selectPage\", \"" + xmlRowNumber + "\");' >" + returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@plan_text"] + "</span>";
                    var planElection = returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@election_text"];
                    var pretaxInd = returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@pretax_ind"];
                    var planCateg = returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@plan_categ"];
                    var depXml = returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber].dep_names;
                    var dependents = new Array();
                    if (depXml != null) {
                        var iterator = 0;
                        while (depXml[iterator] != null) {
                            iterator++;
                        }
                    }
                    if (returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@appid"] == "BEN_FSA") {
                        pretaxInd = "X";
                    }
                    if (pretaxInd == "X") {
                        var preTax = returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@cost"];
                        preTaxTotal += Number(preTax);
                        var postTax = "";
                    }
                    else {
                        var preTax = "";
                        var postTax = returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@cost"];
                        postTaxTotal += Number(postTax);
                    }
                    var employerCost = returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@er_cost"];
                    employerTotal += Number(employerCost);

                    if (returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@appid"] == "BEN_HLTH") {
                        if (!(returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber].depNames)) {
                            data.rows.set("row" + xmlRowNumber, { data: [{},
                                                             { text: plan, id: 'planID' + xmlRowNumber },
                                                             {},
                                                             { text: planElection, id: 'planElection' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(preTax), 2), id: 'preTax' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(postTax), 2), id: 'postTax' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(employerCost), 2), id: 'employerCost' + xmlRowNumber}],
                                element: this.labels.get("noDependents")
                            });
                        }
                        if (returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber].dep_names) {
                            var iterator = 0;
                            var dependentsOutput = "";
                            while (objectToArray(returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber].dep_names)[iterator]) {
                                if (dependentsOutput != "") {
                                    dependentsOutput != "<br/>";
                                }
                                dependentsOutput += objectToArray(returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber].dep_names.yglui_str_ben_dep_list)[iterator]["@dep_name"];
                                dependentsOutput += " ("
                                dependentsOutput += objectToArray(returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber].dep_names.yglui_str_ben_dep_list)[iterator]["@relation"];
                                dependentsOutput += ") <br/>"
                                iterator++;
                            }
                            data.rows.set("row" + xmlRowNumber, { data: [{},
                                                             { text: plan, id: 'planID' + xmlRowNumber },
                                                             {},
                                                             { text: planElection, id: 'planElection' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(preTax), 2), id: 'preTax' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(postTax), 2), id: 'postTax' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(employerCost), 2), id: 'employerCost' + xmlRowNumber}],
                                element: "<div>" + dependentsOutput + "</div>"
                            });
                        }
                    }
                    else if ((returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@appid"] == "BEN_INSU") || (returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@appid"] == "BEN_SAV") || (returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber]["@appid"] == "BEN_MISC")) {
                        if (!(returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber].dep_names)) {
                            data.rows.set("row" + xmlRowNumber, { data: [{},
                                                             { text: plan, id: 'planID' + xmlRowNumber },
                                                             {},
                                                             { text: planElection, id: 'planElection' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(preTax), 2), id: 'preTax' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(postTax), 2), id: 'postTax' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(employerCost), 2), id: 'employerCost' + xmlRowNumber}]
                            });
                        }
                        if (returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber].dep_names) {
                            var iterator = 0;
                            var dependentsOutput = "";
                            while (objectToArray(returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber].dep_names.yglui_str_ben_dep_list)[iterator]) {
                                if (dependentsOutput != "") {
                                    dependentsOutput != "<br/>";
                                }
                                dependentsOutput += objectToArray(returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber].dep_names.yglui_str_ben_dep_list)[iterator]["@dep_name"];
                                dependentsOutput += " ("
                                dependentsOutput += objectToArray(returnXml.EWS.o_benefits.yglui_str_ben_plan_out[xmlRowNumber].dep_names.yglui_str_ben_dep_list)[iterator]["@relation"];
                                dependentsOutput += ") <br/>"
                                iterator++;
                            }
                            data.rows.set("row" + xmlRowNumber, { data: [{},
                                                             { text: plan, id: 'planID' + xmlRowNumber },
                                                             {},
                                                             { text: planElection, id: 'planElection' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(preTax), 2), id: 'preTax' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(postTax), 2), id: 'postTax' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(employerCost), 2), id: 'employerCost' + xmlRowNumber}],
                                element: "<div>" + dependentsOutput + "</div>"
                            });
                        }
                    }
                    else {
                        if (planCateg) {
                            data.rows.set("row" + xmlRowNumber, { data: [{},
                                                             { text: plan, id: 'planID' + xmlRowNumber },
                                                             {},
                                                             { text: planElection, id: 'planElection' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(preTax), 2), id: 'preTax' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(postTax), 2), id: 'postTax' + xmlRowNumber },
                                                             {},
                                                             { text: longToDisplay(Number(employerCost), 2), id: 'employerCost' + xmlRowNumber}]
                            });
                        }
                    }
                }
                xmlRowNumber++;


            }
            data.rows.set("row" + xmlRowNumber, { data: [{},
                                                         { text: '' },
                                                         { text: '' },
                                                         { text: '' },
                                                         { text: '' },
                                                         { text: '________', id: 'simpleline' },
                                                         { text: '' },
                                                         { text: '________', id: 'simpleline' },
                                                         { text: '' },
                                                         { text: '________', id: 'simpleline'}]
            });

            xmlRowNumber++;

            data.rows.set("row" + xmlRowNumber, { data: [{},
                                                         { text: '' },
                                                         { text: 'Totals', id: 'totals' },
                                                         { text: '' },
                                                         { text: '' },
                                                         { text: longToDisplay(Number(preTaxTotal), 2), id: 'pretaxtotal' },
                                                         { text: '' },
                                                         { text: longToDisplay(Number(postTaxTotal), 2), id: 'posttaxtotal' },
                                                         { text: '' },
                                                         { text: longToDisplay(Number(employerTotal), 2), id: 'employertotal'}]
            });

            //Instantiating the table
            var table = new SimpleTable(data, ({ 'typeLink': false, 'rowsClassName': 'application_benefits_table_body' }));
            table.getElement().style.width = "95%";
            tableHeaders = table.getElement().getElementsBySelector('th')
            for (var j = 0; j < tableHeaders.length; j++) {
                tableHeaders[j].addClassName("auto_width");
                if (tableHeaders[j].id == "col3" || tableHeaders[j].id == "col4" || tableHeaders[j].id == "col5") {
                    tableHeaders[j].style.textAlign = "right";
                }
            }
            tableCells = table.getElement().getElementsBySelector('td')
            for (var j = 0; j < tableCells.length; j++) {
                tableCells[j].addClassName("auto_width");
                if (tableCells[j].id.indexOf("preTax") != -1 || tableCells[j].id.indexOf("postTax") != -1 || tableCells[j].id.indexOf("employerCost") != -1) {
                    tableCells[j].style.textAlign = "right";
                }
                if (tableCells[j].id == "totals" || tableCells[j].id == "pretaxtotal" || tableCells[j].id == "posttaxtotal" || tableCells[j].id == "employertotal" || tableCells[j].id == "simpleline") {
                    tableCells[j].style.textAlign = "right";
                }
            }

            //Add show All / Hide All links
            var expandDiv = "<div class='ben_application_inProgress_beforeTable'>" +
                            "<div class='ben_application_inProgress_showHide' style='text-align:right'>" +
                            "<span class='application_action_link' id='ben_application_inProgress_sessionSection_allSessionsShowDetails'>Show All</span>" + " / " +
                            "<span class='application_action_link' id='ben_application_inProgress_sessionSection_allSessionsHideDetails'>Hide All</span>" +
                            "</div>" +
                            "</div>";
            this.contentDiv.insert(expandDiv);
            $('ben_application_inProgress_sessionSection_allSessionsShowDetails').observe('click', this.allSessionsShowDetails.bind(this));
            $('ben_application_inProgress_sessionSection_allSessionsHideDetails').observe('click', this.allSessionsHideDetails.bind(this));

            //Inserting in the document the generated table
            this.contentDiv.insert(table.getElement());
            this.contentDiv.insert(new Element('br'));
            this.contentDiv.insert(new Element('br'));
            this.contentDiv.insert(new Element('br'));

        }
    },

    allSessionsShowDetails: function() {
        var rows = this.contentDiv.getElementsByTagName('div');
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].className == "treeHandler_align_verticalArrow application_verticalR_arrow")
                rows[i].click();
        }
    },

    allSessionsHideDetails: function() {
        var rows = this.contentDiv.getElementsByTagName('div');
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].className == "treeHandler_align_verticalArrow application_down_arrow")
                rows[i].click();
        }
    },

    getDependentsJson: function(pJson, pPlanId, pUpdateMode) {
        var lJson = deepCopy(pJson);
        var lDepArray = [];
        var lNotElig = false;

        if (pPlanId == null) { pPlanId = 'M000' };

        $A(objectToArray(lJson.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, i) {
                if (field['@fieldid'] == "BEN_PLAN" && field['@value'] == pPlanId) {
                    lDepArray.push(record);
                }
                if (field['@fieldid'] == "NOT_ELIG") {
                    if (field['@value'] == "X") {
                        lNotElig = true;
                    } else {
                        lNotElig = false;
                    }
                }

                if (pUpdateMode == true && field['@fieldid'] == "SELECTED") {
                    if (lNotElig) {
                        field['@value'] = "X";
                    } else {
                        field['@value'] = "";
                    }
                }

            } .bind(this));
        } .bind(this));

        if (Object.isEmpty(lDepArray)) {
            return null;
        } else if (lDepArray.length == 1) {
            lJson.EWS.o_field_values.yglui_str_wid_record = lDepArray[0];
        } else {
            lJson.EWS.o_field_values.yglui_str_wid_record = lDepArray;
        }

        return lJson;
    },

    previousButtonHandler: function(args) {
        this.sendXmlToBackend({ 'goToStep': 'previous' });
    },

    nextButtonHandler: function(args) {
        this.sendXmlToBackend({ 'goToStep': 'next' });
    },

    handleEmployeeSelection: function(args) {
        var args = getArgs(args);
        var employeeId = args.employeeId;
        if (employeeId != this.actualEmployee) {
            global.objectId = employeeId;
            this.actualEmployee = employeeId;
            if (!this.isClosing) {
                this.restartApplication();
            }
        }
    },

    submitButtonHandler: function(args) {
        this.ButtonDisplayerExample.disable('benefits_buttonSubmit');
        this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_BENEFITS", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();
        var records = new XML.ObjTree();
        records.attr_prefix = '@';
        xmlIn = '<EWS>' +
        '<SERVICE>' + this.xmlToBackend.EWS.SERVICE + '</SERVICE>' +
        '<OBJECT TYPE="' + global.objectType + '">' + global.objectId + '</OBJECT>' +
        '<PARAM>' +
        '<APPID>' + this.xmlToBackend.EWS.PARAM.APPID + '</APPID>' +
        '<RECORDS>' + records.writeXML(this.xmlToBackend.EWS.PARAM.RECORDS, true) +
        '</RECORDS></PARAM><DEL></DEL></EWS>';
        this.makeAJAXrequest($H({ xml: xmlIn, successMethod: 'finalSaveSuccessful' }));
    },

    saveButtonHandler: function(args) {
        this.sendXmlToBackend({ 'goToStep': 'summary' });
    },

    disableButtonHandler: function(args) {
        this.ButtonDisplayerExample.disable(getArgs(args).buttonID);
    },

    enableButtonHandler: function(args) {
        this.ButtonDisplayerExample.enable(getArgs(args).buttonID);
    },

    selectPageHandler: function(args) {
        this.sendXmlToBackend({ 'goToStep': args.memo });
    }

});