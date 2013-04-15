/**
*@fileOverview PFM_CloseDocs.js
*@description It contains a class with functionality for managing indivuals documents.
*/
/**
*@constructor
*@description Class with functionality for indivuals documents.
*@augments Application
*/
var PFM_CloseDocs = Class.create(PFM_parent, {
    /**
    *@type Boolean
    *@description Tells if the first table is initialized
    */
    tableShowed: false,
    /**
    *@type Boolean
    *@description Tells if the second table is initialized
    */
    table2Showed: false,
    /**
    *@type String
    *@description Service used to load the individuals documents
    */
    getClosePFMdocsService: "SEARCH_DOCS",
    
    reload: false,
    //variable used to control refresh button
    refresh: true,
    /**
    *Constructor of the class PFM_CloseDocs
    */
    initialize: function($super, args) {
        $super(args);
    },
    /**
    *@description Starts PFM_CloseDocs
    */
    run: function($super, args) {
        $super(args);
        this.PFM_ClosedDocsContainer = this.virtualHtml;
        if (args) {
            if (args.get('refresh') == 'X')
                this.reload = true;
        }
        else
            this.reload = false;
        if (this.firstRun) {
            this.createHtml();
        }
        if (this.reload) {
            this.headerInserted = false;
            this.headerInserted2 = false;
            this.PFM_ClosedDocsContainer.down('tr#PFM_headDocTable').update("");
            this.PFM_ClosedDocsContainer.down('tbody#PFMCloseDocs_openTableBody').update("");
            this.PFM_ClosedDocsContainer.down('tr#PFM_headDocTable2').update("");
            this.PFM_ClosedDocsContainer.down('tbody#PFMCloseDocs_openTableBody2').update("");
            this.onEmployeeSelected();
        }
    },
    /*
    * @method createHtml
    * @desc create the screen with empty tables and titles
    */
    createHtml: function() {
        this.headerInserted = false;
        this.headerInserted2 = false;
        //title of the application
        var title = global.getLabel('openDocs');
        var title2 = global.getLabel('ownDoc');
        //we create several part for the title, buttons, table, detail...            
        var html = "<div id='ClosedDocsLegend' class='PFM_individualDocsLegend'></div>" +
                   "<div id='docsClosed_titleOwDc' class='PFM_titleIndividualDoc'><span>" + title2 + "</span></div>" +
                   "<div id='docsClosed_tableOwnDoc' class='PFM_FirstTableIndividialDoc'></div>" +
                   "<div id='docsClosed_NotableOwnDoc' class='PFM_NoOpenOwnDocs application_main_soft_text'></div>" +
                   "<div id='docsClosed_titleOpDc' class='PFM_titleIndividualDoc'><span>" + title + "</span></div>" +
                   "<div id='docsClosed_tableOpenDoc' class='PFM_FirstTableIndividialDoc'></div>" +
                   "<div id='docsClosed_NotableOpenDoc' class='PFM_NoOpenOwnDocs application_main_soft_text'></div>" +
                   "<div id='docsClosed_RefreshButton' class='PFM_ShowDocButtons'></div>";
        this.PFM_ClosedDocsContainer.update(html);
        //we create the legend                                     
        var legendJSON = {
            legend: [
                { img: "application_icon_orange", text: global.getLabel('PFM_Progress') },
                { img: "application_icon_green", text: global.getLabel('PFM_Completed') },
                { img: "applicationTeamCalendar_moreEventsIcon", text: global.getLabel('PFM_Overdue') }

            ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
        var legendHTML = getLegend(legendJSON);
        this.PFM_ClosedDocsContainer.down('div#ClosedDocsLegend').insert(legendHTML);
        //creating the table that contains the relations
        var table = "<table class='sortable PFM_sizeTableDocs' id='PFMCloseDocs_OpenTable'>" +
                        "<thead>" +
                            "<tr id='PFM_headDocTable'>" +
                            "</tr>" +
                        "</thead>" +
                        "<tbody id='PFMCloseDocs_openTableBody'></tbody>" +
                    "</table>";
        this.PFM_ClosedDocsContainer.down('div#docsClosed_tableOwnDoc').insert(table);
        this.PFM_ClosedDocsContainer.down('div#docsClosed_tableOwnDoc').hide();
        this.PFM_ClosedDocsContainer.down('div#docsClosed_NotableOwnDoc').insert("<span>" + global.getLabel('noOwnDocs') + "</span>")
        if (!this.tableShowed) {
            TableKit.Sortable.init('PFMCloseDocs_OpenTable');
            this.tableShowed = true;
            TableKit.options.autoLoad = false;
        }
        else
            TableKit.reloadTable('PFMCloseDocs_OpenTable');
        var table2 = "<table class='sortable PFM_sizeTableDocs' id='PFMCloseDocs_OpenTable2'>" +
                        "<thead>" +
                            "<tr id='PFM_headDocTable2'>" +
                            "</tr>" +
                        "</thead>" +
                        "<tbody id='PFMCloseDocs_openTableBody2'></tbody>" +
                    "</table>";
        this.PFM_ClosedDocsContainer.down('div#docsClosed_tableOpenDoc').insert(table2);
        this.PFM_ClosedDocsContainer.down('div#docsClosed_tableOpenDoc').hide();
        this.PFM_ClosedDocsContainer.down('div#docsClosed_NotableOpenDoc').insert("<span>" + global.getLabel('noOpenDocs') + "</span>")
        if (!this.table2Showed) {
            TableKit.Sortable.init('PFMCloseDocs_OpenTable2');
            this.table2Showed = true;
            TableKit.options.autoLoad = false;
        }
        else
            TableKit.reloadTable('PFMCloseDocs_OpenTable2');
    },
    /*
    * @method callToGetDocuments
    * @desc call service to fill the table
    */
    callToGetDocuments: function() {
        //call to sap 
        if (this.empId)
            var employee = this.empId;
        else
            var employee = "";
        var xmlToGetAssign = "<EWS>" +
                                    "<SERVICE>" + this.getClosePFMdocsService + "</SERVICE>" +
                                    "<OBJECT TYPE='P'>" + employee + "</OBJECT>" +
                                    "<DEL></DEL>" +
                                    "<PARAM>" +
                                        "<TABID>" + this.options.tabId + "</TABID>" +
                                    "</PARAM>" +
                                    "" +
                             "</EWS>";
        this.makeAJAXrequest($H({ xml: xmlToGetAssign, successMethod: 'processCallToGetDocs' }));
    },
    /*
    * @method processCallToGetDocs
    * @param json {json} The JSON object retrieved from the service
    * @desc call service to fill the table
    */
    processCallToGetDocs: function(json) {
        //variable used to save the values in json
        var a = 0;
        var classColumn = "";
        var classOfBubble = "";
        var classOfLink;
        var idOfDocument, idOfLink;
        var testIfApraisee = json.EWS.o_appraisee_docs;
        if (testIfApraisee) {
            var getDocsApraisee = objectToArray(json.EWS.o_appraisee_docs.yglui_str_search_document);
            var hashDocsApraisee;
            var _this = this;
            var html = '';
            var linkOfDocument = "";
            var tableSortFirst=false;
            //for every own document related to a person, we loop to enter a row in the table
            for (var i = 0; i < getDocsApraisee.length; i++) {
                hashDocsApraisee = $H(getDocsApraisee[i])
                html += "<tr>";
                //we read every field that is going to be a column in the table
                hashDocsApraisee.each(function(pair) {
                if((pair.key != '@tartb') && (pair.key != '@views') && (pair.key != '@appid')){
                    classColumn = "";
                    classOfLink = "";
                    classOfBubble = "";
                    idOfLink = "";
                    if (pair.key == '@s_bubble')
                        classColumn = 'PFM_bubbleColumn';
                    if (pair.value == 'Y')
                        classOfBubble = 'application_icon_orange';
                    else if (pair.value == 'G')
                        classOfBubble = 'application_icon_green';
                    else if (pair.value == 'R')
                        classOfBubble = 'application_icon_red';
                    else if (pair.value == 'B')
                        classOfBubble = 'applicationTeamCalendar_moreEventsIcon';
                    if (pair.key == '@s_bubble') {
                        pair.value = "";
                        pair.key = "";
                    }
                    if (pair.key == '@doc_id')
                        idOfDocument = "openDoc_" + pair.value;
                    if (pair.key == '@w_document') {
                        classOfLink = 'application_action_link';
                        idOfLink = idOfDocument;
                    }
                    if (pair.key == '@y_due_date')
                        pair.value = Date.parseExact(pair.value, 'yyyy-MM-dd').toString(global.dateFormat);
                    //if the value is not the id of the document and is not #text, we insert it in the table
                        //we insert the header
                    if (pair.key != '@doc_id' && pair.key != '#text' && pair.key != '@y_due_date') {    
                        if (i == 0 && !_this.headerInserted) {
                            if(pair.key!="" && !tableSortFirst){
                            _this.PFM_ClosedDocsContainer.down('tr#PFM_headDocTable').insert(
                                "<th class='table_sortfirstdesc "+classColumn+"'>"+global.getLabel(pair.key.gsub('@', ''))+"</th>"
	                                ); 
	                                tableSortFirst=true;
	                             }
	                             else
	                                _this.PFM_ClosedDocsContainer.down('tr#PFM_headDocTable').insert(
	                            "<th class='" + classColumn + "'>" + global.getLabel(pair.key.gsub('@', '')) + "</th>"
	                        );
                            if (_this.PFM_ClosedDocsContainer.down('tr#PFM_headDocTable').cells.length == 5)
                                _this.headerInserted = true;
                        }
                        //we insert every row in the table
                        html += "<td class='" + classColumn + "'><div id='" + idOfLink + "' class='" + classOfBubble + " " + classOfLink + "'>" + pair.value + "</div></td>";
                    }
                   }
                });
                html += "</tr>";
            }
            //we insert the html in th table
            this.PFM_ClosedDocsContainer.down('tbody#PFMCloseDocs_openTableBody').update(html);
            //we reload the table
            if (!this.table2Showed) {
                TableKit.Sortable.init('PFMCloseDocs_OpenTable');
                this.table2Showed = true;
                TableKit.options.autoLoad = false;
            }
            else
                TableKit.reloadTable('PFMCloseDocs_OpenTable');

            this.PFM_ClosedDocsContainer.down('div#ClosedDocsLegend').show();
            this.PFM_ClosedDocsContainer.down('div#docsClosed_NotableOwnDoc').hide();
            this.PFM_ClosedDocsContainer.down('div#docsClosed_tableOwnDoc').show();
        }
        else {
            this.PFM_ClosedDocsContainer.down('div#docsClosed_tableOwnDoc').hide();
            this.PFM_ClosedDocsContainer.down('div#docsClosed_NotableOwnDoc').show();
        }

        //we get the open documents  
        var testIfAprraiser = json.EWS.o_appraiser_docs;
        if (testIfAprraiser) {
            var getDocsAppraiser = objectToArray(json.EWS.o_appraiser_docs.yglui_str_search_document);
            var hashDocsAppraiser = $H(getDocsAppraiser[0]);
            var _this = this;
            html = '';
            //for every open document related to person, we loop to enter a row in the table
            for (var i = 0; i < getDocsAppraiser.length; i++) {
                hashDocsAppraiser = $H(getDocsAppraiser[i]);
                html += "<tr>";
                var tableSortFirst2=false;
                //we read every field that is going to be a column in the table
                hashDocsAppraiser.each(function(pair) {
                if((pair.key != '@tartb') && (pair.key != '@views') && (pair.key != '@appid')){
                    classColumn = "";
                    classOfLink = "";
                    classOfBubble = "";
                    idOfLink = "";
                    if (pair.key == '@s_bubble')
                        classColumn = 'PFM_bubbleColumn';
                    if (pair.value == 'Y')
                        classOfBubble = 'application_icon_orange';
                    else if (pair.value == 'G')
                        classOfBubble = 'application_icon_green';
                    else if (pair.value == 'R')
                        classOfBubble = 'application_icon_red';
                    else if (pair.value == 'B')
                        classOfBubble = 'applicationTeamCalendar_moreEventsIcon';
                    if (pair.key == '@s_bubble') {
                        pair.value = "";
                        pair.key = "";
                    }
                    if (pair.key == '@doc_id')
                        idOfDocument = "OwnDoc_" + pair.value;
                    if (pair.key == '@w_document') {
                        classOfLink = 'application_action_link';
                        idOfLink = idOfDocument;
                    }
                    if (pair.key == '@y_due_date')
                        pair.value = Date.parseExact(pair.value, 'yyyy-MM-dd').toString(global.dateFormat);
                    //if the value is not the id of the document and is not #text, we insert it in the table
                    if (pair.key != '@doc_id' && pair.key != '#text' && pair.key != '@y_due_date') {
                        //we insert the header
                        if (i == 0 && _this.headerInserted2 == false) {
                            if(pair.key!="" && !tableSortFirst2){
                                _this.PFM_ClosedDocsContainer.down('tr#PFM_headDocTable2').insert(
                                "<th class='table_sortfirstdesc "+classColumn+"'>"+global.getLabel(pair.key.gsub('@', ''))+"</th>"
	                                ); 
	                                tableSortFirst2=true;
	                             }
	                             else
	                             _this.PFM_ClosedDocsContainer.down('tr#PFM_headDocTable2').insert(
	                            "<th class='" + classColumn + "'>" + global.getLabel(pair.key.gsub('@', '')) + "</th>"
	                        );
                            if (_this.PFM_ClosedDocsContainer.down('tr#PFM_headDocTable2').cells.length == 5)
                                _this.headerInserted2 = true;
                        }
                        //we insert every row in the table
                        html += "<td class='" + classColumn + "'><div id='" + idOfLink + "' class='" + classOfBubble + " " + classOfLink + "'>" + pair.value + "</div></td>";
                    }
                    }
                });
                html += "</tr>";
                //we insert all in the table
                this.PFM_ClosedDocsContainer.down('tbody#PFMCloseDocs_openTableBody2').update(html);

            }
            //we reload the table
            if (!this.table2Showed) {
                TableKit.Sortable.init('PFMCloseDocs_OpenTable2');
                this.table2Showed = true;
                TableKit.options.autoLoad = false;
            }
            else
                TableKit.reloadTable('PFMCloseDocs_OpenTable2');

            this.PFM_ClosedDocsContainer.down('div#docsClosed_tableOpenDoc').show();    
            this.PFM_ClosedDocsContainer.down('div#docsClosed_NotableOpenDoc').hide();
        }
        else {
            this.PFM_ClosedDocsContainer.down('div#docsClosed_tableOpenDoc').hide();
            this.PFM_ClosedDocsContainer.down('div#docsClosed_NotableOpenDoc').show();
        }
        if (!testIfApraisee && !testIfAprraiser)
            this.PFM_ClosedDocsContainer.down('div#ClosedDocsLegend').hide();
        this.arrayOfInputs = this.PFM_ClosedDocsContainer.select('div.application_action_link');
        
       //keep view / appid / tab
       if(Object.jsonPathExists(json, 'EWS.o_appraisee_docs.yglui_str_search_document')){
            this.openAppInfoView = objectToArray(json.EWS.o_appraisee_docs.yglui_str_search_document)[0]['@views'];
            this.openAppInfoTab = objectToArray(json.EWS.o_appraisee_docs.yglui_str_search_document)[0]['@tartb'];
            this.openAppInfoAppId = objectToArray(json.EWS.o_appraisee_docs.yglui_str_search_document)[0]['@appid'];
       }else if(Object.jsonPathExists(json, 'EWS.o_appraiser_docs.yglui_str_search_document')){
            this.openAppInfoView = objectToArray(json.EWS.o_appraiser_docs.yglui_str_search_document)[0]['@views'];
            this.openAppInfoTab = objectToArray(json.EWS.o_appraiser_docs.yglui_str_search_document)[0]['@tartb'];
            this.openAppInfoAppId = objectToArray(json.EWS.o_appraiser_docs.yglui_str_search_document)[0]['@appid'];
       }
       
        this.testandObserveLinks();
        
    },
    /**
    * @description function that will create a refresh button and position it at the bottom of the individual docs section
    */
    setRefreshButton: function() {
        // Add button to refresh the list of individual documents
        if (this.refresh) {
            var divButtonsToJson = new Element('div', {
                'id': 'divButtonsJson_RefreshDocs'
            });
            var buttonJson = {
                elements: []
            };
            var auxRefresh = {
                idButton: 'PFM_RefreshButton',
                label: global.getLabel('PFM_RefreshButton'),
                handlerContext: null,
                handler: this.callToGetDocuments.bind(this),
                className: 'PMF_showDocsButton',
                type: 'button',
                standardButton: true
            };

            buttonJson.elements.push(auxRefresh);

            this.ButtonRefreshDocs = new megaButtonDisplayer(buttonJson);
            divButtonsToJson.insert(this.ButtonRefreshDocs.getButtons());
            this.ButtonRefreshDocs.enable('PFM_RefreshButton');
            $("docsClosed_RefreshButton").insert(divButtonsToJson);
            this.refresh = false;
        };
    },
    /*
    * @method testandObserveLinks
    * @desc asign onclick to the link
    */
    testandObserveLinks: function() {
        for (var i = 0; i < this.arrayOfInputs.length; i++)
            if (this.arrayOfInputs[i].id.include('openDoc') || this.arrayOfInputs[i].id.include('OwnDoc'))
            this.arrayOfInputs[i].observe('click', this.clickingOnDocument.bind(this));

    },
    /*
    * @method clickingOnDocument
    * @param event {Object} object that has the link with the id of the document
    * @desc we get the id of the doc clicked
    */
    clickingOnDocument: function(event) {
        var idOfLink = event.element().identify().split('_')[1];
        var handler = global.open($H({
            app: {
                appId: 'PFM_ODOC',	
                tabId: 'PFM_IOV',	                        
                view: 'PFM_ShowDocs'
            },
            idOfDoc:idOfLink,
            previousApp:this.options.appId,
            previousView: this.options.view
          }));
    },
   
    /*
    * @method onEmployeeSelected
    * @param args {Object} object that has the information about the user selected
    * @desc we get the id of the user selected and we call to load the documents
    */
    onEmployeeSelected: function(args) {
        this.empId = this.getSelectedEmployees().keys()[0];
        this.callToGetDocuments();

    },
    /*
    * @method onEmployeeUnselected
    * @param args {Object} object that has the information about the user unselected
    * @desc we get the id of the user unselected and we call to remove it from the table
    */
    onEmployeeUnselected: function(args) {
        if (this.getSelectedEmployees().size() == 0) {
            this.PFM_ClosedDocsContainer.down('div#ClosedDocsLegend').hide();
            this.PFM_ClosedDocsContainer.down('div#docsClosed_tableOpenDoc').hide();
            this.PFM_ClosedDocsContainer.down('div#docsClosed_NotableOpenDoc').show();
            this.PFM_ClosedDocsContainer.down('div#docsClosed_tableOwnDoc').hide();
            this.PFM_ClosedDocsContainer.down('div#docsClosed_NotableOwnDoc').show();
        }
    }

});
