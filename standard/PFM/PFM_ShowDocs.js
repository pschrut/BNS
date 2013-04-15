/**
 *@fileOverview PFM_ShowDocs.js
 *@description It contains a class with functionality for team documents.
 */
/**
 *@constructor
 *@description Class with functionality for show individual and team docs.
 *@augments PFM_parent
 */
var PFM_ShowDocs = Class.create(PFM_parent, 
/** 
*@lends PFM_ShowDocs
*/
{
    /**
    *@type String
    *@description Service used to get the document to show
    */
    getPFMTeamService: "GET_DOCUMENT",
    /**
    *@type String
    *@description Service used to get infotypes
    */    
    getPFMdetails: "GET_CONTENT",
    /**
    *@type String
    *@description Service used to get infotypes
    */    
    getPFMLog: "GET_PFM_LOG",

    /**
    *@type Hash
    *@description Hash keeping all needed field panels
    */      
    fieldPanelsHash: new Hash(),
    /**
    *@type Array
    *@description Array keeping all the group layouts
    */      
    grArrayMain: null,
    
    /**
    * @description array of field IDs to displayu
    */
    fieldInfo: $A(["FAPP", "PAPP", "ZFAP"]),
    
    partAppraisersJson : "",
    /**
    * @description remains pointer to current element being added to section
    */
    currentElement: null,

    /**
    * @description IDs for the goal types 
    */
    teamGoals: "TeamGoals",
    corpVals: "CorpValues",
//    priorGoals: "PriorGoals",
//    currentGoalType: "PriorGoals",  
     
    isPfmAdmin: false,
    showDropdown: 0,
    
    /**
     *@param $super The superclass (PFM_parent)
     *@description Instantiates the app
     */  
    initialize: function($super, args) {
        $super(args);
        this.types = ['C', 'D', 'E', 'F'];
        this.editBindingSD = this.editSimpleDoc.bindAsEventListener(this);
        this.addElementFromCatBindingSD = this.addElementFromCat.bindAsEventListener(this);
        this.docAddElementWithoutCatBindingSD = this.docAddElementWithoutCat.bindAsEventListener(this);
        this.goalSelectedBind = this.goalSelected.bind(this);
    },
    /**
     *@param $super The superclass: PFM_parent
     *@param args The selected user id
     *@description when the user clicks on the button 'view details', it open the job profile main screen
     */	
    run: function($super, args) {
        $super(args);
        //init variables
        this.json = {};
        this.grArrayMain = $A();
        this.PFM_ShowDocsContainer = this.virtualHtml;
        this.createHtml();
        this.idDoc = args.get('idOfDoc');
        this.prevApp = args.get('previousApp');
        this.prevView = args.get('previousView');
        this.callToGetDisplayDoc();
        this.lastElementAdded = null;
        //observers
        document.observe('EWS:PFM_docChangeSimpleDoc', this.editBindingSD);
        document.observe('EWS:returnSelected', this.addElementFromCatBindingSD);
        document.observe('EWS:PFM_docAddElementWithoutCat', this.docAddElementWithoutCatBindingSD);
        document.observe('EWS:PFM_goalSelected', this.goalSelectedBind);    
        document.observe('EWS:PFM_fieldModified', this.fieldModified.bind(this));        
    },
    /**
     *@param $super The superclass: PFM_parent
     *@description Closes the application
     */    
    close: function($super) {
        $super();
        document.stopObserving('EWS:PFM_docChangeSimpleDoc', this.editBindingSD);
        document.stopObserving('EWS:returnSelected', this.addElementFromCatBindingSD);
        document.stopObserving('EWS:PFM_docAddElementWithoutCat', this.docAddElementWithoutCatBindingSD);       
        document.stopObserving('EWS:PFM_goalSelected', this.goalSelectedBind);
    },
    /**
    * @description we create the Dom where we're going to insert the doc
    */
    createHtml: function() {
        this.PFM_ShowDocsContainer.update("<div id='PFM_showDocsLegend' class='PFM_showDocsLegend'></div>" +
            "<div id='PFM_uploadAttachment' class='PFM_showDocsAttach'><iframe id='uploadIFR' width='100%' height='0' frameborder='0' style='float:right'></iframe></div>" +
            "<div id='PFM_showDocsMain' class='PFM_ShowDocDiv'></div>" +
            "<div id='PFM_showDocsChange' class='PFM_ShowDocDiv'></div>" +
            "<div id='PFM_showAddAppraiser' class='PFM_ShowDocDiv'></div>" +
            "<div id='PMF_showDocsButtons' class='PFM_ShowDocButtons'></div>" +
            "<div id='" + this.appName + "saveMessage' class='application_main_soft_text PFM_ShowDocsSaveChanges'>" + global.getLabel('saveMessage') + "</div>");
        //hide the message
        this.toggleSaveChangesMessage(false);
        //we create the legend    
                                        
        var legendJSON = {
            legend: [
//                { img: "application_emptyBubble", text: global.getLabel('notDone') },
//                { img: "application_icon_green", text: global.getLabel('completed') },
//                { img: "application_icon_orange", text: global.getLabel('warning') },
//                { img: "application_icon_red", text: global.getLabel('GAP_ANAL') }
            ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
        var legendHTML = getLegend(legendJSON);
                legendHTML.update('');
        function printFriendly() {
            var title = global.getLabel('PFM_Print_Performance');
            var helpWindow = window.open('', 'helpWindow', 'status=no,menubar=no,toolbar=no,location=no,scrollbars=yes,width=730,height=600');
//            helpWindow.document.write($("PFM_showDocsMain").innerHTML);
            helpWindow.document.write(""
            + "\n<html>"
            + "\n    <head>"
            + "\n       <title>" + title + "</title>"
            + "\n       <link href='css/CSS2.css' rel='stylesheet' type='text/css' />"
            + "\n       <!--[if IE]>"
            + "\n       <link rel='stylesheet' type='text/css' href='css/CSS2_IE7.css' />"
            + "\n       <![endif]-->"
            + "\n       <!--[if lt IE 7]>"
            + "\n       <link rel='stylesheet' type='text/css' href='css/CSS2_IE6.css' />"
            + "\n       <![endif]-->"
            + "\n    </head>"
            + "\n    <body>"
            + "\n    <div class='PFM_printScreen'></div>"
//            + "\n    <div class='PFM_printIcon'>" + $(fwk_print).outerHTML + "</div>"
            + "\n    <div class='PFM_printIcon'>"
            + "\n    <div class='application_main_print' id='fwk_print' onclick='window.print();'></div>"
            + "\n    </div>"
            + "\n    " + $("PFM_showDocsMain").innerHTML
            + "\n    </body>"
            + "\n</html>");
            helpWindow.document.close();
        }

        function changeLog() {
         var xmlDocsLog = "<EWS>" +
                                "<SERVICE>" + this.getPFMLog + "</SERVICE>" +
                                "<OBJECT TYPE='P'>" + global.objectId + "</OBJECT>" +
                                "<PARAM>" +
                                "<DOC_ID>" + this.idDoc + "</DOC_ID>" +
                                "</PARAM>" +
                                "<DEL></DEL>"+
                            "</EWS>";
        this.makeAJAXrequest($H({ xml: xmlDocsLog, successMethod: 'getChangeLog'}));
        }

        function collapseAll() {
            var pfmWidgets = $('content').select('div.PFM_ShowDocsWidgDiv2');
            for (var i = 0; i < pfmWidgets.length; i++) {
                var arrows = pfmWidgets[i].select('.group_module_arrowD_margin');
                for (var j = 0; j < arrows.length; j++) {
                    arrows[j].fire('EWS:toggleRow');
                }
            }
        }

        function expandAll() {
            var pfmWidgets = $('content').select('div.PFM_ShowDocsWidgDiv');
            $('content').select('div.PFM_ShowDocsWidgDiv2').each(function(a) { pfmWidgets.push(a) });
            for (var i = 0; i < pfmWidgets.length; i++) {
                var widgetHeader = pfmWidgets[i].down(0);
                var headerName = widgetHeader.next().id;
                var headerBtn = widgetHeader.down(0).next().id;
                this.expandPFMWidget(headerName, headerBtn);
                var arrows = pfmWidgets[i].select('.group_module_arrowR_margin');
                for (var j = 0; j < arrows.length; j++) {
                    arrows[j].fire('EWS:toggleRow');
                }
            }        
        }


        function addAppraiser() {
            var json_UPD_DELEGATION = {
                EWS: {
                    SERVICE: "PFM_APPRAISERS",
                    OBJECT: {
                        "#text": global.objectId,
                        "-TYPE": global.objectType
                    },
                    PARAM: {
                        DOC_ID: this.idDoc,
                        SEARCH_PATTERN: '',
                        MAX: '25'
                    },
                    DEL: {}
                }
            };

            var jsonConverter = new XML.ObjTree();
            this.makeAJAXrequest($H({
                xml: jsonConverter.writeXML(json_UPD_DELEGATION),
                successMethod: "addAppraiserEditor"
            }));
        }

        function uploadAttach() {
            var iframeWindow = document.getElementById('uploadIFR');
            if (iframeWindow.getAttribute('height') <= 0) {
                var json_PFM_ATTACHMENTS = {
                    EWS: {
                        SERVICE: "PFM_ATTACHMENTS",
                        DEL: {},
                        PARAM: {
                            DOC_ID: this.idDoc
                        }
                    }
                };

                var jsonConverter = new XML.ObjTree();
                this.makeAJAXrequest($H({
                    xml: jsonConverter.writeXML(json_PFM_ATTACHMENTS),
                    successMethod: "uploadAttachmentEditor"
                }));
            } else {
                iframeWindow.setAttribute('height', '0');
            }
        }

        function reloadAttachmentList() {
            var json_PFM_ATTACHMENTS = {
                EWS: {
                    SERVICE: "PFM_ATTACHMENTS",
                    DEL: {},
                    PARAM: {
                        DOC_ID: this.idDoc
                    }
                }
            };

            var jsonConverter = new XML.ObjTree();
            this.makeAJAXrequest($H({
                xml: jsonConverter.writeXML(json_PFM_ATTACHMENTS),
                successMethod: "uploadAttachmentEditor"
            }));
        }

        var appraiserLabel = new Element('span', ({
            'id': 'legend_module_ExpandLabel',
            'class': 'application_action_link'
        })).update(global.getLabel('PFM_Appraiser'));

        var expandLabel = new Element('span', ({
            'id': 'legend_module_ExpandLabel',
            'class': 'application_action_link'
        })).update(global.getLabel('PFM_Expand_All'));

        var collapseLabel = new Element('span', ({
            'id': 'legend_module_CollapseLabel',
            'class': 'application_action_link'
        })).update(global.getLabel('PFM_Collapse_All'));

        var printLabel = new Element('span', ({
            'id': 'legend_module_printLabel',
            'class': 'application_action_link'
        })).update(global.getLabel('PFM_Print_Friendly'));

        var ratingInfoLabel = new Element('span', ({
            'id': 'legend_module_ratingInfo',
            'class': 'application_action_link'
        })).update(global.getLabel('PFM_Rating_Info'));

        var changeLogLabel = new Element('span', ({
            'id': 'legend_module_changeLogLabel',
            'class': 'application_action_link'
        })).update(global.getLabel('PFM_Manager_Log'));

        var uploadAttachLabel = new Element('span', ({
            'id': 'legend_module_changeLogLabel',
            'class': 'application_action_link'
        })).update(global.getLabel('PFM_Upload_Attachment'));

        // Only Managers can see Add Appraiser
        this.addAppraiserElement = new Element('span', ({'style': 'display:none;'})).insert(appraiserLabel);
        this.addAppraiserElement.insert(new Element('span', ({})).update('&nbsp; | &nbsp;'));
        legendHTML.insert(this.addAppraiserElement);
        
        legendHTML.insert(expandLabel);
        
        legendHTML.insert(new Element('span', ({})).update('&nbsp; | &nbsp;')); // spacer to break the underline
        
        legendHTML.insert(collapseLabel);
        
        this.changeLogElement = new Element('span', ({'style': 'display:none;'})).insert(new Element('span', ({})).update('&nbsp; | &nbsp;')); 
        this.changeLogElement.insert(changeLogLabel);
        legendHTML.insert(this.changeLogElement);

        legendHTML.insert(new Element('span', ({})).update('&nbsp; | &nbsp;')); 
        
        legendHTML.insert(printLabel);

        legendHTML.insert(new Element('span', ({})).update('&nbsp; | &nbsp;')); 
        
        legendHTML.insert(ratingInfoLabel);

        this.uploadAttachmentElement = new Element('span', ({ 'style': 'display:none;' })).insert(new Element('span', ({})).update('&nbsp; | &nbsp;')); // spacer to break the underline
        this.uploadAttachmentElement.insert(uploadAttachLabel);
        legendHTML.insert(this.uploadAttachmentElement);

        var ratingInfoDiv = new Element('div', {
            'id': 'divRatingInfo',
            'style': 'display: none;'
        });

        appraiserLabel.observe('click', addAppraiser.bind(this));
        expandLabel.observe('click', expandAll.bind(this));
        collapseLabel.observe('click', collapseAll.bind(this));
        printLabel.observe('click', printFriendly.bind(this));
        ratingInfoLabel.observe('click', this.toggleDescriptions.bind(this, ratingInfoDiv, ratingInfoLabel));
        changeLogLabel.observe('click', changeLog.bind(this));
        uploadAttachLabel.observe('click', uploadAttach.bind(this));
        document.observe('EWS:PFM_reloadUploadAttach', reloadAttachmentList.bind(this));
        this.virtualHtml.down('div#PFM_showDocsLegend').insert(legendHTML);
        this.virtualHtml.down('div#PFM_showDocsLegend').insert(ratingInfoDiv);
    },
    /**
    * @description calls GET_DOCUMENT service to get the specified document
    */
    callToGetDisplayDoc: function() {
        var xmlDocs = "<EWS>" +
                                "<SERVICE>" + this.getPFMTeamService + "</SERVICE>" +
                                "<DEL></DEL>" +
                                "<PARAM>" +
                                    "<DOC_ID>" + this.idDoc + "</DOC_ID>" +
                                "</PARAM>" +
                            "</EWS>";
        this.makeAJAXrequest($H({ xml: xmlDocs, successMethod: 'processCallToDisplayDoc', errorMethod: 'errorWhenGettingDoc' }));
    },
    /**
    * @param json: {JSON} The JSON object retrieved from the service
    * @description we receive a json with the error, so we get back to the dashboard
    */    
    errorWhenGettingDoc: function(json){
        
        if(json.EWS.webmessage_type = 'E'){         
            var _this = this;
            var contentHTML = new Element('div').insert(json.EWS.webmessage_text);
            var errorPopUp = new infoPopUp({
                closeButton: $H({
                    'textContent': 'Close',
                    'callBack': function() {
                        errorPopUp.close();
                        delete errorPopUp;
                        global.goToPreviousApp(); 
                    }
                }),
                htmlContent: contentHTML,
                indicatorIcon: 'exclamation',
                width: 350
            });
            errorPopUp.create();         
        }
        //this._errorMethod();
        //global.goToPreviousApp(); 
    },
    /**
    * @param json: {JSON} The JSON object retrieved from the service
    * @description we receive a json with info from SAP
    */
    processCallToDisplayDoc: function(json) {
    	// Set Appraisal ID
		this.appraisalID = "";
		if(json.EWS.o_part_appraisers){
			var apPernr = json.EWS.o_part_appraisers.yglui_str_pfm_part_appraisers["@pernr"];
			var apArray = objectToArray(json.EWS.o_content.head.part_appraissers.yglui_str_doc_participant);
			for (var i=0; i<apArray.length; i++){
				if (apArray[i]["@id"]==apPernr)
					this.appraisalID = apArray[i]["@part_ap_id"]; 		
			}
		}
		
        this.json = json;
        var globalActions = Object.isEmpty(this.json.EWS.o_content.actions.yglui_vie_tty_ac) ? '' : objectToArray(this.json.EWS.o_content.actions.yglui_vie_tty_ac);
        var partJson = this.json.EWS.o_content.sections;
        var headers = this.json.EWS.o_content.head.headers;
        
        var globalActions = Object.isEmpty(this.json.EWS.o_content.actions.yglui_vie_tty_ac) ? '' : objectToArray(this.json.EWS.o_content.actions.yglui_vie_tty_ac);
        var partJson = this.json.EWS.o_content.sections;
        var headers = this.json.EWS.o_content.head.headers;
        var partAppraisers = this.json.EWS.o_part_appraisers;

        if (this.addAppraiserElement != null) {
            if (this.json.EWS.o_custom != null // check custom node
                    && this.json.EWS.o_custom['@deny_part_appr'] != null // check deny part appraiser node only 'X' means block
                    && this.json.EWS.o_custom['@deny_part_appr'] == 'X') {
                this.addAppraiserElement.style.display = 'none';
            } else {
                this.addAppraiserElement.style.display = 'inline';
            }
        }

        if (this.uploadAttachmentElement != null) {
            if (this.json.EWS.o_custom != null // check custom node
                    && this.json.EWS.o_custom['@deny_attachment'] != null // check deny add attachment node only; 'X' means block
                    && this.json.EWS.o_custom['@deny_attachment'] == 'X') {
                this.uploadAttachmentElement.style.display = 'none';
            } else {
                //this.uploadAttachmentElement.style.display = 'inline';
                this.uploadAttachmentElement.style.display = 'none';
            }
        }
        
        this.isPfmAdmin = (this.json.EWS.o_custom['@is_perf_admin'] == "X") ? true : false;

        if (this.changeLogElement != null) {
            if (this.isPfmAdmin) {
                this.changeLogElement.style.display = 'inline';
            } else if (global.getPopulationName('PFM_ShowDocs') == 'MNR') {
                var appraisee = this.json.EWS.o_content.head.appraisees.yglui_str_hrobject['@objid'];

                if (appraisee == global.objectId) {
                    this.changeLogElement.style.display = 'none';
                } else {
                    this.changeLogElement.style.display = 'inline';
                }
            } else {
                //this.changeLogElement.style.display = 'none';
                this.changeLogElement.style.display = 'inline';
            }
        }
        
        //manage doc headers
        if (headers) {
            this.PFM_ShowDocsContainer.down('div#PFM_showDocsMain').update("");
            headers = headers.yglui_str_doc_header;
            for (var i = 0; i < headers.length; i++) {
                //create widget for each header and insert fieldpanel
                var headerJSON = new Object();
                headerJSON.EWS = headers[i];
                headerJSON.EWS.labels = this.json.EWS.labels;
                var field = new getContentModule({ 
                    mode: 'display', 
                    showCancelButton:false, 
                    json: headerJSON, 
                    appId: 'PFM_ShowDocs', 
                    showButtons: $H({
                        edit : false,
                        display: false,
                        create: false
                    }),                    
                    noResultsHtml: '<span>' + global.getLabel('noResults') + '</span>' }).getHtml();
                var nameOfHead = headerJSON.EWS.o_widget_screens.yglui_str_wid_screen["@label_tag"];
                var elementToDisplayHeader = new Element('div', {
                    'id': 'PMF_showDocWidgetHeader_' + i,
                    'class': 'PFM_ShowDocsWidgDiv'
                });
                this.PFM_ShowDocsContainer.down('div#PFM_showDocsMain').insert(elementToDisplayHeader);
                var widgetHeaderCont = new Element('div', {
                    id: 'PFM_showDocsHeaderCont' + i
                });
                //we need an empty div at the bottom
                var divEmptyJson = new Element('div', {
                    'class': 'FWK_EmptyDiv'
                });
                widgetHeaderCont.insert(field);
                widgetHeaderCont.insert(divEmptyJson);
                var objOptions = $H({
                    title: nameOfHead,
                    events: $H({ 
                        onToggle: 'EWS:myWidgetToggle'
                    }),
                    collapseBut: true,
                    contentHTML: widgetHeaderCont,
                    onLoadCollapse: false,
                    targetDiv: 'PMF_showDocWidgetHeader_' + i
                });
                var myWidget = new unmWidget(objOptions);
            }
        }
        //manage sections
        if (partJson) {
            partJson = objectToArray(partJson.yglui_str_doc_section);
            for (var i = 0; i < partJson.length; i++) {
                //calculate maximum row number
                if (!(['@elements'] in partJson[i])) {
                    var elements = objectToArray(partJson[i].elements.yglui_str_doc_element);
                    this.max_row = 0;
                    for (var j = 0; j < elements.length; j++) {
                        var numberRow = parseInt(elements[j].ehead['@row_id'],10);
                        if (numberRow > this.max_row) {
                            this.max_row = numberRow;
                        }
                    }
                }
                //create widget for each section, and insert grouped layouts
                var nameOfHead = Object.isEmpty(partJson[i].shead['@name']) ? "" : partJson[i].shead['@name'];
                var elementToDisplayWidget = new Element('div', {
                    'id': 'PMF_showDocWidget_' + i,
                    'class': 'PFM_ShowDocsWidgDiv2'
                });
                this.PFM_ShowDocsContainer.down('div#PFM_showDocsMain').insert(elementToDisplayWidget);
                var divButtonsToJson = new Element('div', {
                    'id': 'divButtonsJson_' + i
                });
                var simpleTableExample = new Element('div', {
                    id: 'PFM_simpleTableExample' + i
                });
                divButtonsToJson.insert(simpleTableExample);
                if (partJson[i].shead['@layout_type'] == 'E' || partJson[i].shead['@layout_type'] == 'F') {
                    var newJson = this.getDocToGroupedLayout(partJson[i], true, i, partAppraisers);
                    this.grArrayMain.push(new groupedLayout(newJson, simpleTableExample, true));
                }
                else {
                    var newJson = this.getDocToGroupedLayout(partJson[i], false, i, partAppraisers);
                    this.grArrayMain.push(new groupedLayout(newJson, simpleTableExample, false));
                }
                var html = this.grArrayMain[i].buildGroupLayout();
                // BUTTON CREATION
                var buttonsInWidget = partJson[i].actions;
                if (buttonsInWidget) {
                    buttonsInWidget = objectToArray(buttonsInWidget.yglui_vie_tty_ac);
                    var buttonJson = {
                        elements: []
                    };
                    for (var k = 0; k < buttonsInWidget.length; k++) {
                        var sec = buttonsInWidget[k]['@methd'];
                        //if is a simple doc, hide the option 'add', in case we have it
                        if ((partJson[i].shead['@layout_type'] == 'A' || partJson[i].shead['@layout_type'] == 'B') && buttonsInWidget[k]['@actio'] == "IDOC_SEC_ADD");
                        //for the actions that will be shown
                        else {
                            var nextApp = buttonsInWidget[k]['@tarap'];
                            var okcode = buttonsInWidget[k]['@okcod'];
                            //add elements from the default element, without catalogue
                            if (Object.isEmpty(nextApp) && (partJson[i].shead['@layout_type'] != 'A' && partJson[i].shead['@layout_type'] != 'B')) {
                                var event = 'EWS:PFM_docAddElementWithoutCat';
                                var data = $H({
                                    cont: i,
                                    section: sec,
                                    actio: buttonsInWidget[k]['@actio']
                                });
                                //button with event #1
                                var aux = {
                                    idButton: buttonsInWidget[k]['@actio'],
                                    label: buttonsInWidget[k]['@actiot'],
                                    data: data,
                                    className: 'application_action_link PFM_AlignLinksWidgets',
                                    event: event,
                                    type: 'link',
                                    eventOrHandler: true 
                                };                                                               
                            }
                            //if it's a simple doc, and the action is 'change'
                            else if (Object.isEmpty(nextApp) && okcode == 'MOD' && (partJson[i].shead['@layout_type'] == 'A' || partJson[i].shead['@layout_type'] == 'B')) {
                                var event = 'EWS:PFM_docChangeSimpleDoc';
                                var data = $H({ 
                                    cont: i
                                });
                                //button with handler #2
//                                var aux = {
//                                    idButton: buttonsInWidget[k]['@actio'],
//                                    label: buttonsInWidget[k]['@actiot'],
//                                    data: data,
//                                    className: 'application_action_link PFM_AlignLinksWidgets',
//                                    event: event,
//                                    type: 'link',
//                                    eventOrHandler: true 
//                                };                                 
                            }
                            //if we have to call get_content after clicking on the action
                            else {
                                //button with handler
                                var event = 'EWS:openApplication';
                                var aux = {
                                    idButton: buttonsInWidget[k]['@actio'],
                                    label: buttonsInWidget[k]['@actiot'],                                
                                    className: 'application_action_link PFM_AlignLinksWidgets',                                
                                    type: 'link',
                                    eventOrHandler: false,
                                    handlerContext: null,
                                    handler: global.open.bind(global, $H({
                                        app: {
                                            appId: nextApp,	
                                            tabId: buttonsInWidget[k]['@tartb'],	                        
		                                    view: buttonsInWidget[k]['@views']
                                        },
                                        multiple: true, 
                                        cont: i, 
                                        sec: sec
                                    }))                                 
                                };                                
                            }
                            buttonJson.elements.push(aux);
                        }
                    }
                    var ButtonShowDocsLink = new megaButtonDisplayer(buttonJson);
                    divButtonsToJson.insert(ButtonShowDocsLink.getButtons());
                }
                //insert buttons in widget
                var divEmptyJson = new Element('div', {
                    'class': 'FWK_EmptyDiv'
                });
                divButtonsToJson.insert(divEmptyJson);
                var objOptions = $H({
                    title: nameOfHead,
                    events: $H({ 
                        onToggle: 'EWS:myWidgetToggle'
                    }),
                    collapseBut: true,
                    contentHTML: divButtonsToJson,
                    onLoadCollapse: false,
                    targetDiv: 'PMF_showDocWidget_' + i
                });
                var myWidget = new unmWidget(objOptions);
            }
        }
        else {
            //this.virtualHtml.down('div#PFM_showDocsLegend').hide();
            //this.PFM_ShowDocsContainer.down('div#PFM_showDocsMain').insert("<div class='application_main_error_text'>" + global.getLabel("noDocs") + "</div>");
            
            var _this = this;
            var contentHTML = new Element('div').insert(global.getLabel("noDocs"));
            var errorPopUp = new infoPopUp({
                closeButton: $H({
                    'textContent': 'Close',
                    'callBack': function() {
                        errorPopUp.close();
                        delete errorPopUp;
                        global.goToPreviousApp();
                    }
                }),
                htmlContent: contentHTML,
                indicatorIcon: 'exclamation',
                width: 350
            });
            errorPopUp.create();               
        }
        //GLOBAL BUTTONS
        var mainButtonsJson = {
            elements: [],
            mainClass: 'PFM_ShowDocsGeneralButons'
        };
        for (var i = 0; i < globalActions.length; i++) {
            if (globalActions[i]['@okcod'] || globalActions[i]['@actio'] == 'IDOC_SAVE') {
                var dataInButton = $H({});
                dataInButton.set(this.idDoc, globalActions[i]);
                var data = dataInButton;
                var functionToGo = this.saveDocument;
            }
            else if (globalActions[i]['@actio'] == 'IDOC_CANCEL') {
                var data = '';
                var functionToGo = this.goBack;
            }
            else {
                var data = globalActions[i]['@tarap'];
                var functionToGo = this.goBack;
            }
            var aux = {
                idButton: globalActions[i]['@actio'],
                label: globalActions[i]['@actiot'],
                handlerContext: null,
                handler: functionToGo.bind(this, data),
                className: 'PMF_showDocsButton',
                type: 'button',
                standardButton: true
            };
            mainButtonsJson.elements.push(aux);
        }
        var ButtonShowDocs = new megaButtonDisplayer(mainButtonsJson);
        this.PFM_ShowDocsContainer.down('div#PMF_showDocsButtons').insert(ButtonShowDocs.getButtons());
    },
    
    wrapMsgText: function(MsgText, wordLength) {
        var wrappedText = '';
        var lastPosition = 0;

        for (var i = 0; i < Math.floor(MsgText.length / wordLength); i++) {
            wrappedText += MsgText.substring(lastPosition, MsgText.substring(lastPosition, i * wordLength + wordLength).lastIndexOf(' ') + lastPosition) + '<br/>';
            lastPosition += MsgText.substring(lastPosition, i * wordLength + wordLength).lastIndexOf(' ') + 1;
        }
        wrappedText += MsgText.substring(lastPosition);
        return wrappedText;
    },
    /**
     *@param event Event thrown when closing the catalogue
     *@description Receives the selected nodes, and calls to get content to retrieve the default element structure
     */      
    addElementFromCat: function(event) {
        //receive selected elements
        this.elementsAdded = getArgs(event).get('hash');
        var cont = getArgs(event).get('cont');
        var sec = getArgs(event).get('sec');
        //process default element
        var sections = objectToArray(this.json.EWS.o_content.sections.yglui_str_doc_section);
        var default_element;
        for (var i = 0; i < sections.length; i++) {
            if (sections[i].shead['@sect_id'] == sec) {
                var sectionJson = sections[i];
                default_element = deepCopy(sections[i].element_def);
            }
        }
        //for each element selected, insert an structured node in the xml
        this.elementsAdded.each(function(pair) {
            default_element.ehead['@name'] = pair.value['childName'];
            default_element.ehead['@group_by'] = pair.value['parentName'];
            default_element.ehead.ref_object.yglui_str_hrobject['@objid'] = pair.key;
            this.max_row++;
            default_element.ehead['@row_id'] = this.max_row.toPaddedString(4);
            this.lastElementAdded = parseInt(default_element.ehead['@row_id'],10);
            default_element.ehead.ref_object.yglui_str_hrobject['@otype'] = pair.value['childType'];
            if (['@elements'] in sectionJson) {
                //sections[i] = elements
                delete sectionJson["@elements"];
                sectionJson.elements = {
                    yglui_str_doc_element: deepCopy(default_element)
                };
            }
            else {
                sectionJson.elements.yglui_str_doc_element = objectToArray(sectionJson.elements.yglui_str_doc_element);
                sectionJson.elements.yglui_str_doc_element.push(deepCopy(default_element));
            }
        } .bind(this));
        //modify json to indicate we changed the section
        sectionJson["@modified"] = true;
        //reload screen
        delete (this.grArrayMain[cont]);
        this.virtualHtml.down('div#PFM_simpleTableExample' + cont).update('');
        if (sectionJson.shead['@layout_type'] == 'E' || sectionJson.shead['@layout_type'] == 'F')
            var newJson = this.getDocToGroupedLayout(sectionJson, true, cont);
        else
            var newJson = this.getDocToGroupedLayout(sectionJson, false, cont);
        this.grArrayMain[cont] = new groupedLayout(newJson, this.virtualHtml.down('div#PFM_simpleTableExample' + cont));
        this.grArrayMain[cont].buildGroupLayout();
        //to show the message
        this.toggleSaveChangesMessage(true);
    },
    
    
    /**
    * @description function executed that expands all the PFM widgets, if expanded before, nothing happens
    */
    expandPFMWidget: function(idWidget, idButton) {
        this.widgetContent = idWidget;
        this.widgetCollapseButton = idButton;
        if (!($(this.widgetContent).visible())) {
            $(this.widgetContent).show();
        }
        if ($(this.widgetCollapseButton).hasClassName('application_rounded_maximize')) {
            $(this.widgetCollapseButton).removeClassName('application_rounded_maximize');
            $(this.widgetCollapseButton).addClassName('application_rounded_minimize');
        }
    },
    /**
    * @description function executed that collapses all the PFM widget, if collapsed before, nothing happens
    */
    collapsePFMWidget: function(idWidget, idButton) {
        this.widgetContent = idWidget;
        this.widgetCollapseButton = idButton;
        if ($(this.widgetContent).visible()) {
            $(this.widgetContent).hide();
        }
        if ($(this.widgetCollapseButton).hasClassName('application_rounded_minimize')) {
            $(this.widgetCollapseButton).removeClassName('application_rounded_minimize');
            $(this.widgetCollapseButton).addClassName('application_rounded_maximize');
        }
    },

    goBackIndDocs: function() {
        // Show standard interface
        $("PFM_showDocsLegend").setStyle({ display: 'block' });
        $("PFM_showDocsMain").setStyle({ display: 'block' });
        $("PFM_showDocsChange").setStyle({ display: 'none' });
        $("PFM_showAddAppraiser").setStyle({ display: 'none' });
        $("PMF_showDocsButtons").setStyle({ display: 'block' });
    },

    /**
    * @description function executed retrieves the change log of performance documents from Mc Dermott FM
    */
    getChangeLog: function(json) {
        // Show changeLog div, hide others        
        $("PFM_showDocsLegend").setStyle({ display: 'none' });
        $("PFM_showDocsMain").setStyle({ display: 'none' });
        $("PFM_showDocsChange").setStyle({ display: 'block' });
        $("PFM_showAddAppraiser").setStyle({ display: 'none' });
        $("PMF_showDocsButtons").setStyle({ display: 'none' });
        document.getElementById('uploadIFR').setAttribute('height', '0');

        // Get JSON nodes and initialize variables
        if (json.EWS.o_action_log == null)return;

        var getDocPfmLog = objectToArray(json.EWS.o_action_log.yglui_str_pfm_action_log);
        var hashDocsLogItem = $H(getDocPfmLog[0]);
        var col1, col2, col3, col4, col5, col6, col7;
        var html = '<br/>';
        html += '<table class="sortable PFM_sizeTableDocs" id="PFM_showDocsChangeTable">';
        html += '<thead><tr>' +
                '<th>&nbsp;</th>' +
                '<th class="table_sortfirstdesc">&nbsp;&nbsp;&nbsp;' + this.labels.get("created_date") + '</th>' +
                '<th>&nbsp;&nbsp;&nbsp;' + this.labels.get("created_time") + '</th>' +
                '<th>&nbsp;&nbsp;&nbsp;' + this.labels.get("created_user") + '</th>' +
                '<th>&nbsp;&nbsp;&nbsp;' + this.labels.get("msgtxt") + '</th>' +
                '<th>&nbsp;&nbsp;&nbsp;' + this.labels.get("administrator") + '</th>' +
                '</tr></thead>';

        // Produce the body
        html += '<tbody>';
        for (var i = 0; i < getDocPfmLog.length; i++) {
            // Re-default values before setting current values
            col1 = '<td></td>'; col2 = '<td></td>'; col3 = '<td></td>'; col4 = '<td></td>';
            col5 = '<td></td>'; col6 = '<td></td>';
            hashDocsLogItem = $H(getDocPfmLog[i]);

            html += '<tr>';
            hashDocsLogItem.each(function(pair) {
                if (pair.key == '@ap_status') { 
                    col1 = '<td></td>';
                }
                if (pair.key == '@created_date') {
                    col2 = '<td>' + pair.value + '</td>';
                }
                if (pair.key == '@created_time') {
                    col3 = '<td>' + pair.value + '</td>';
                }
                if (pair.key == '@created_user') {
                    col4 = '<td>' + pair.value + '</td>';
                }
                if (pair.key == '@msgtxt') {
                    if (pair.value.length > 70)
                        col5 = '<td>' + PFM_ShowDocs.prototype.wrapMsgText(pair.value, 70) + '</td>';
                    else
                        col5 = '<td>' + pair.value + '</td>';
                }
                if (pair.key == '@administrator') {
                    if (pair.value == null)
                        col6 = '<td></td>';
                    else
                        col6 = '<td>' + pair.value + '</td>';
                }
            });
            html += col1 + col2 + col3 + col4 + col5 + col6;
            html += '</tr>';
        }
        html += '</tbody>';
        html += '</table>';
        html += '<br/>';

        // Add button to close changeLog div and reopen previous divs
        var divButtonsToJson = new Element('div', {
            'id': 'divButtonsJson_changeLog'
        });
        var buttonJson = {
            elements: []
        };
        var aux = {
            idButton: '',
            label: global.getLabel('PFM_GoBackButton'),
            handlerContext: null,
            handler: this.goBackIndDocs.bind(),
            className: 'PMF_showDocsButton',
            type: 'button',
            standardButton: true
        };
        buttonJson.elements.push(aux);

        var ButtonShowDocsLink = new megaButtonDisplayer(buttonJson);
        divButtonsToJson.insert(ButtonShowDocsLink.getButtons());

        $("PFM_showDocsChange").innerHTML = html;
        // Append button to div
        $("PFM_showDocsChange").insert(divButtonsToJson);

        // Format the table nicely
        TableKit.reloadTable('PFM_showDocsChangeTable');
    },

    uploadAttachmentEditor: function(json) {
        var filesAttached = new Element('span', ({
            'id': 'legend_module_ExpandLabel',
            'class': ''
        })).update(this.labels.get("PFM_PresentFiles"));
        
        var title = "";
        var iframeWindow = document.getElementById('uploadIFR');
        
        var fileNameLabel = this.labels.get('PFM_Attach_LabelText');
        var fileName = global.getLabel('PFM_FileName');
        var submit = global.getLabel('PFM_AttachSubmit_Label');
        var pfmDownload = global.getLabel('PFM_Download');
        var pfmDelete = global.getLabel("PFM_Delete"); 
        
        var iframeDoc = document.getElementById('uploadIFR').contentWindow.document;
        var docContent = "<html>"
        + "\n    <head>"
        + "\n       <title>" + title + "</title>"
        + "\n       <link href='css/CSS2.css' rel='stylesheet' type='text/css' />"
        + "\n       <!--[if IE]>"
        + "\n       <link rel='stylesheet' type='text/css' href='css/CSS2_IE7.css' />"
        + "\n       <![endif]-->"
        + "\n       <!--[if lt IE 7]>"
        + "\n       <link rel='stylesheet' type='text/css' href='css/CSS2_IE6.css' />"
        + "\n       <![endif]-->"
        + "\n       <script type='text/javascript'>"
        + "\n       var extArray = new Array('.gif', '.jpg', 'jpeg', '.png', '.tif', '.tiff', '.pdf', '.rtf' ,'.txt', '.odf', '.ods', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pps');"
        + "\n       function checkFile(form, file) {"
        + "\n           allowSubmit = false;"
        + "\n           if (!file) { return false;}"
        + "\n           while (file.indexOf('\\\\') != -1) "
        + "\n               file = file.slice(file.indexOf('\\\\') + 1);"
        + "\n           ext = file.slice(file.indexOf('.')).toLowerCase();"
        + "\n           for (var i = 0; i < extArray.length; i++) {"
        + "\n               if (extArray[i] == ext) { allowSubmit = true; break; }"
        + "\n           }"
        + "\n           if (allowSubmit) "
        + "\n               { return allowSubmit; }"
        + "\n           else"
        + "\n               { alert('" + global.getLabel('PFM_UploadWarning_Label') + "'+(extArray.join(' '))); return allowSubmit; }"
        + "\n       }"
        + "\n       </script>"
        + "\n       </head>"
        + "\n    <body style='background:none'>"
        + "\n    <div>"
        //+ fileNameLabel.innerHTML
        + "\n    <form id='file_upload_form' method='post' enctype='multipart/form-data' action='/sap/bc/bsp/sap/yglui_bsp_upfl/upload_file.htm' >"
        + "\n    <input type='hidden' name='appName' value='" + this.appName + "'/><input type='hidden' name='docID' value='" + this.idDoc + "'/>"
        //+ "\n    File Name: <input type='file' name='echoFile' size='50'/><input type='submit' onClick='return checkFile(this.form, this.form.echoFile.value);' class='application_action_link' style='border=0;background-color=white;' name='onInputProcessing(upload)' value='" + submit + "'/>"
        + "\n    "+ fileName +" <input type='file' name='echoFile' size='50'/><input type='submit' onClick='return checkFile(this.form, this.form.echoFile.value);' class='pfm_action_link' style='border:0;background-color:white;' name='onInputProcessing(upload)' value='" + submit + "'/>"
        + "\n <br><br>"
        + fileNameLabel
        + "\n    </div>"
        + "\n    </form>";

        // get current login to compare deletion rights
        var userLogin = '';
        if (json.EWS.o_current_userid != null)
            userLogin = json.EWS.o_current_userid.toUpperCase();
        //docContent += filesAttached.outerHTML;
        var fileListCount = 0;
        if (json.EWS.o_attachments != null) {
            var getAttachments = objectToArray(json.EWS.o_attachments.hap_s_attachments);
            // Produce the body        
            docContent += '<table>';
            for (var i = 0; i < getAttachments.length; i++) {
                //docContent += '<tr><td><a href="/sap/bc/bsp/sap/zupload_file/transition_parameter.htm?appName=PFM_ShowDocsDel&attachID='+getAttachments[i]['@id']+'"><div class="deleteIcon"></div></a></td><td><div class="attachDiv attach_' + getAttachments[i]['@type'] + '"></div></td><td><font style="font-size:12px">' + getAttachments[i]['@name'] + '.' + getAttachments[i]['@type'].toLowerCase() + '</font></td></tr>';
                // View button
                docContent += '<tr><td><form id="file_view_form" method="post" enctype="multipart/form-data" action="/sap/bc/bsp/sap/yglui_bsp_upfl/upload_file.htm"><input type="hidden" name="appName" value="PFM_ShowDocsView"><input type="hidden" name="attachID" value="' + getAttachments[i]['@id'] + '"><input type="hidden" name="contentType" value="' + getAttachments[i]['@type'] + '"><input type="hidden" name="fileName" value="' + getAttachments[i]['@name'] + '"><input type="submit" class="PFM_delete_attach pfm_action_link" style="border:0;background-color:white;" name="onInputProcessing(upload)" value="' + pfmDownload + '"/></form></td><td>';

                // Delete button, check login = uploader
                if (userLogin == getAttachments[i]['@last_user'].toUpperCase())

                    docContent += '<form id="file_delete_form" method="post" enctype="multipart/form-data" action="/sap/bc/bsp/sap/yglui_bsp_upfl/upload_file.htm"><input type="hidden" name="appName" value="PFM_ShowDocsDel"><input type="hidden" name="attachID" value="' + getAttachments[i]['@id'] + '"><input type="submit" class="PFM_delete_attach pfm_action_link" style="border:0;background-color:white;" name="onInputProcessing(upload)" value="' + pfmDelete + '"/></form></td>';

                else
                    docContent += '</td>';
                docContent += '<td><div class="attachDiv attach_' + getAttachments[i]['@type'] + '"></div></td><td><font style="font-size:12px;vertical-align:top;">' + getAttachments[i]['@name'] + '.' + getAttachments[i]['@type'].toLowerCase() + '</font></td></tr>';
                fileListCount++;
            }
            docContent += '</table>';
        }
        docContent += "\n    </body>"
        docContent += "\n</html>";
        iframeDoc.write(docContent);
        iframeDoc.close();
        iframeWindow.setAttribute('height', 100 + 30 * fileListCount);
    },

    /**
    * @description function executed provides additional appraisers
    */
    addAppraiserEditor: function(json) {
        // Show AddAppraiser div, hide others        
        $("PFM_showDocsLegend").setStyle({ display: 'none' });
        $("PFM_showDocsMain").setStyle({ display: 'none' });
        $("PFM_showDocsChange").setStyle({ display: 'none' });
        $("PFM_showAddAppraiser").setStyle({ display: 'block' });
        $("PMF_showDocsButtons").setStyle({ display: 'none' });
        document.getElementById('uploadIFR').setAttribute('height', '0');

        var maxFieldLength = 255;
        function maxLength(field) {
            if ($("PFM_commentDiv").value.length > maxFieldLength) {
                $("PFM_commentDiv").value = $("PFM_commentDiv").value.substr(0, maxFieldLength);
            }
        }

        // add title
        var titleText = this.labels.get("PFM_AddAppraiserTitle");
        var enterNameText = this.labels.get("PFM_AddAppraiserText");
        var title = new Element("div", {
            "class": "applicationPFM_alignLeft applicationPFM_title"
        }).insert(new Element("span", {
            "class": "applicationPFM_alignLeft applicationPFM_title application_main_title applicationPFM_nofloat"
        }).insert(titleText));
        this.virtualHtml.down('div#PFM_showAddAppraiser').update(title);

        var divClasses = {
            "class": "applicationPFM_nofloat applicationPFM_alignLeft applicationPFM_title"
        };
        var spanClasses = {
            "class": "applicationPFM_nofloat application_text_bolder2"
        };

        currentAppraisersLabelContainer = new Element("div", {
            "class": "applicationPFM_alignLeft"
        });
        var currentAppraisersLabel = new Element("div", divClasses).insert(new Element("span", spanClasses).update(this.labels.get("PFM_CurrentAppraisers")));
        currentAppraisersLabelContainer.insert(currentAppraisersLabel);

        var appraiserContainer = new Element('div', {
            'class': 'PFM_part_appraisers_list_div'
        });

        appraiserContainer.insert(currentAppraisersLabelContainer);

        var appraiserTable = new Element('table', {
            'id': 'current_part_appraisers_table',
            'class': 'PFM_part_appraisers_sortable'
        });

        //build header
        var tableHead = new Element("thead");
        var tableHeaderLine = new Element("tr");

        tableHeaderLine.insert(new Element('th', {
            'class': 'table_nosortcol'
        }).update(this.labels.get("NACHN"))); 

        tableHeaderLine.insert(new Element('th', {
            'class': 'table_nosortcol'
        }).update(this.labels.get("VORNA")));

        tableHead.insert(tableHeaderLine);
        appraiserTable.insert(tableHead);

        //build body
        var tableBody = new Element("tbody");

        var currentAppraisers = $A();
        if (!Object.isEmpty(json.EWS.o_part_appraisers))
            currentAppraisers = objectToArray(json.EWS.o_part_appraisers.yglui_str_pfm_part_appraisers);

        if (currentAppraisers.length > 0) {
            currentAppraisers.each(function(partAppraiser) {
                var tableBodyLine = new Element("tr");
                tableBodyLine.insert(new Element('td', {
                    'class': 'sortable'
                }).update(partAppraiser['@nachn']));
                tableBodyLine.insert(new Element('td', {
                    'class': 'sortable'
                }).update(partAppraiser['@vorna']));
                tableBody.insert(tableBodyLine);
            });
        } else {
            var tableBodyLine = new Element("tr");
            tableBodyLine.insert(new Element('td', {
                'class': 'sortable',
                'colspan': '2'
            }).update(this.labels.get("PFM_NoAppraiserFound")));
            tableBody.insert(tableBodyLine);
        }

        appraiserTable.insert(tableBody);
        appraiserContainer.insert(appraiserTable);

        appraisersContainer = new Element("div", {
            "class": "applicationPFM_alignLeft"
        });
        var appraisersContainer1 = new Element("div", divClasses).insert(new Element("span", spanClasses).update(appraiserContainer));
        appraisersContainer.insert(appraisersContainer1);

        $("PFM_showAddAppraiser").insert(appraisersContainer);

        // Add name of appraiser text and autocomplete
        this.enterNameContainer = new Element("div", {
            "class": "applicationPFM_alignLeft"
        });
        var enterName = new Element("div", divClasses).insert(new Element("span", spanClasses).update(enterNameText));
        this.enterNameContainer.insert(enterName);
    
        this.buttonsContainer = new Element("div", {});

        $A([this.enterNameContainer,
            this.buttonsContainer]).each(function(element) {
                this.virtualHtml.down('div#PFM_showAddAppraiser').insert(element);
            } .bind(this));

        var autocompleterContainer = new Element("div", {
            "class": "autocompleter_form_container2",
            id: "applicationAddAppr_autocompleter"
        });
        this.enterNameContainer.insert(autocompleterContainer);
        var namesArray = $A();
        var namesArrayPernoEmail = $A();
        this.users = objectToArray(json.EWS.o_pfm_users.item);
        this.users.each(function(user) {
            namesArray.push({
                text: user["@ename"],
                data: user["@pernr"]
            });
        });
        var autocompleterJson = {
            autocompleter: {
                object: namesArray,
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        };
        this.delegationsAutocompleter = new JSONAutocompleter(autocompleterContainer.identify(), {
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateResult: '#{text}',
            templateOptionsList: "#{text}",
            minChars: 2,
            events: $H({ //onGetNewXml: 'EWS:applicationAddAppr_search',
                onResultSelected: "EWS:applicationAddAppr_nameSelected"
            })
        }, autocompleterJson);

        var autocompleterContainerError = new Element("div", {
            id: "applicationAddAppr_error"
        });
        this.enterNameContainer.insert(autocompleterContainerError);
        $('text_area_applicationAddAppr_autocompleter').className = 'PFM_autocompleter';
//        this.callSearchBinding = this._callSearch.bindAsEventListener(this);
//        document.observe('EWS:applicationAddAppr_search', this.callSearchBinding);
        this.autoCompleterSelectedBinding = this.autocompleterSelected.bindAsEventListener(this);
        document.observe("EWS:applicationAddAppr_nameSelected", this.autoCompleterSelectedBinding);

        this.enterCommentContainer = new Element("div", {
            "class": "applicationPFM_alignLeft"
        });
        var enterComment = new Element("div", divClasses).insert(new Element("span", spanClasses).update(this.labels.get("PFM_AppraiserCommentText")));

        this.enterNameContainer.insert(enterComment);

        var commentDiv = new Element("textarea", { "id": "PFM_commentDiv", "rows": "3", "cols": "40", "class": "fieldDisplayer_input" });
        this.enterNameContainer.insert(commentDiv);

        commentDiv.observe('keyup', maxLength.bind(this));
        commentDiv.observe('keydown', maxLength.bind(this));

        // Add button to close addAppraiser div and reopen previous divs as well as Add Appraiser
        var divButtonsToJson = new Element('div', {
            'id': 'divButtonsJson_AddAppraiser'
        });
        var buttonJson = {
            elements: []
        };
        var auxAdd = {
            idButton: 'PFM_AddAppraiserButton',
            label: this.labels.get("PFM_AddAppraiserButton"),
            handlerContext: null,
            handler: this.goAddAppraiser.bind(this),
            className: 'PMF_showDocsButton',
            type: 'button',
            standardButton: true
        };
        buttonJson.elements.push(auxAdd);

        var aux = {
            idButton: '',
            label: global.getLabel('PFM_GoBackButton'),
            handlerContext: null,
            handler: this.goBackIndDocs.bind(),
            className: 'PMF_showDocsButton',
            type: 'button',
            standardButton: true
        };
        buttonJson.elements.push(aux);

        this.ButtonAddAppraiser = new megaButtonDisplayer(buttonJson);
        divButtonsToJson.insert(this.ButtonAddAppraiser.getButtons());
        this.ButtonAddAppraiser.disable('PFM_AddAppraiserButton');
        $("PFM_showAddAppraiser").insert(divButtonsToJson);
    },

    /**
    * Function to be runned when an option is selected in the autocompleter
    */
    autocompleterSelected: function(event) {
        // Clear any error message
        $('applicationAddAppr_error').innerHTML = '';
        var args = getArgs(event);
        this.selectedUser = this.users.find(function(user) {
            return user["@pernr"] == args.idAdded;
        });
        // Check presence of email
        if (this.selectedUser != undefined && this.selectedUser["@email"] != null)
            this.ButtonAddAppraiser.enable('PFM_AddAppraiserButton');
        else {
            this.ButtonAddAppraiser.disable('PFM_AddAppraiserButton');
            if (this.delegationsAutocompleter.element.value != '')
                $('applicationAddAppr_error').innerHTML = this.labels.get("PFM_EmailError");
        }
    },
    
//        _callSearch: function() {
//            var searchPattern = '';
//            if (Object.isEmpty(this.delegationsAutocompleter.element.value)) {
//                searchPattern = '';
//            } else {
//                searchPattern = this.delegationsAutocompleter.element.value;
//            }
//            // Call to the service
//            var json_UPD_DELEGATION = {
//                EWS: {
//                    SERVICE: "PFM_APPRAISERS",
//                    OBJECT: {
//                        "#text": global.objectId,
//                        "-TYPE": global.objectType
//                    },
//                    PARAM: {
//                        DOC_ID: this.idDoc,
//                        SEARCH_PATTERN: searchPattern,
//                        MAX: '25'
//                    },
//                    DEL: {}
//                }
//            };

//            var jsonConverter = new XML.ObjTree();
//            this.makeAJAXrequest($H({
//                xml: jsonConverter.writeXML(json_UPD_DELEGATION),
//                successMethod: "_buildAutocompleterJSON"
//            }));
//    },
    
    _buildAutocompleterJSON: function(jsonObject) {
        this.hashAC = $H({});
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        // If we receive a json with results..
        if (jsonObject.EWS.o_pfm_users) {
            this.users = objectToArray(jsonObject.EWS.o_pfm_users.item)
            for (var i = 0; i < this.users.length; i++) {
                json.autocompleter.object.push({
                    data: this.users[i]["@pernr"],
                    text: this.users[i]["@ename"]
                })
            }
        }
        this.delegationsAutocompleter.updateInput(json);
        if (jsonObject.EWS.webmessage_text) {
            this._infoMethod(jsonObject);
        }
    },
    
    /**
    * @description function executed adds appraiser
    */
    goAddAppraiser: function(showDocs) {
        this.makeAJAXrequest($H({ xml:
            '<EWS><SERVICE>ADD_APPRAISER</SERVICE><OBJECT TYPE="P">' + global.objectId + '</OBJECT><PARAM><APPID>PFM</APPID><DOC_ID>' + this.idDoc + '</DOC_ID><APPR_ID>' + this.selectedUser["@pernr"] + '</APPR_ID><APPR_COMMENT>' + $("PFM_commentDiv").innerHTML + '</APPR_COMMENT></PARAM><DEL></DEL></EWS>'
            , successMethod: 'goBackIndDocs'
        }));
    },
    
    /**
     *@param event Event thrown when selectiong the option 'add' and its not from catalogue
     *@description Inserts a new element in the json, and shows it so the user can initialize its values
     */  
    docAddElementWithoutCat: function(event) {
        this.cont = getArgs(event).get('cont');
        this.sectionId = getArgs(event).get('section');
        var actio = getArgs(event).get('actio');
        //MCD: reference goal
//        if (this.sectionId == "0002") this.showDropdown = true;
        if(actio == 'IDOC_SECT_ADD')
            this.showDropdown = 1;  
        else if(actio == 'IDOC_SECC_ADD')
            this.showDropdown = 2;               
        else this.showDropdown = 0;   
        //end MCD: reference goal     
        //insert the element in the proper section
        var sections = this.checkJson(this.json, ['EWS', 'o_content', 'sections', 'yglui_str_doc_section']);
        if (sections.answer) {
            sections = objectToArray(this.json.EWS.o_content.sections.yglui_str_doc_section);
            for (var i = 0; i < sections.size(); i++) {
                if (sections[i].shead['@sect_id'] == this.sectionId) {
                    //keep it so we can use it if the user cancels the action
                    this.sectionBeforeAdding = deepCopy(sections[i]);
                    //insert as a new element. check if there were existing elements or not to insert it properly
                    this.currentSection = sections[i];
                    this.currentSection["@modified"] = true;
                    var default_element = deepCopy(sections[i].element_def);

                    objectToArray(default_element.columns.yglui_str_doc_col_val).each(function(field) {
                        if (field['@fieldid'] != "FWGT") {
                            field['#text'] = '';
                            field['@value'] = '';
                        }
                    }.bind(this));
                    
                    this.setReload();                    
                    var elements = this.checkJson(this.currentSection, ['elements', 'yglui_str_doc_element']);
                    if (elements.answer) {
                        if('@elements' in this.currentSection){    
                            var max = 0;  
                            default_element.ehead['@row_id'] = max.toString();  
                            this.lastElementAdded = parseInt(default_element.ehead['@row_id'],10);     
                            elementsPath = {
                                yglui_str_doc_element : default_element
                            };
                            this.currentSection.elements = elementsPath;
                            delete this.currentSection['@elements'];                                                
                        }else{
                            elements = objectToArray(this.currentSection.elements.yglui_str_doc_element);
                            
                            var max = 0;
                            if (elements.length > 0) {
                                max = parseInt(elements[0].ehead['@row_id'], 10);
                            }                                                        
                            elements.each(function(element) {
                                if (parseInt(element.ehead['@row_id'],10) > max) {
                                    max = parseInt(element.ehead['@row_id'],10);
                                }
                            } .bind(this));
                            default_element.ehead['@row_id'] = (max + 1).toString();
                            this.lastElementAdded = parseInt(default_element.ehead['@row_id'],10);
                            elements.push(default_element);
                            this.currentSection.elements.yglui_str_doc_element = elements;
                        } 
                        //open a pop up with the elememnt so the user can edit its values           
                        this.printCollection = [];
                        //Destroying the elements        
                        this.destroyFields();
                        this.currentElement = default_element;
                        this.addElement(default_element);
                        this.printFields(this.currentSection);
                    }
                }
            }
        }
    },    
    /**
    * @description When after opening an element (existing or new) the user cancels, we have to go back to the previous state
    * @param event {Args} Data about the cancelling
    */   
    cancelAction: function(){   
        //close pop up
        this.editWindow.close();
        delete this.editWindow;           
        //loop through elements and deleted the last one added    
        var recordToDelete;
        var elements = objectToArray(this.currentSection.elements.yglui_str_doc_element);        
        elements.each(function(element) {
            if (!Object.isEmpty(this.lastElementAdded) &&  (element.ehead['@row_id'] == this.lastElementAdded.toString())) {
                recordToDelete = element;
            }
        }.bind(this));  
        this.currentSection.elements.yglui_str_doc_element = objectToArray(this.currentSection.elements.yglui_str_doc_element).without(recordToDelete);                
        //remove from the screen
        var sections = objectToArray(this.json.EWS.o_content.sections.yglui_str_doc_section);
        var sectionCounter;
        for(var i=0; i<sections.length;i++){
            if(sections[i].shead['@sect_id'] == this.sectionId)
                sectionCounter = i;                
        }
        this.grArrayMain[sectionCounter].deleteRow(this.lastElementAdded);  
    },     
    
     /**  
    * @description Generates the HTML to pop up the value descriptions
    */
    toggleDescriptions: function(divElement, linkElement) {

        divElement.toggle();
        if (divElement.visible()) {
            //linkElement.update("Hide Rating Info");
            linkElement.update(global.getLabel('PFM_Hide_Info'));
            var gKmXMLPath = "standard/PFM/kmXML";
            var descriptUrl = gKmXMLPath + '/' + 'PFM' + '_field_value_descriptions.xml';
            var xmlParser = new XML.ObjTree();
            xmlParser.attr_prefix = '@';
            var xmlDoc = readXmlFile(descriptUrl);
            var auxJson = xmlParser.parseXML(xmlToString(xmlDoc));

            var descriptNodes = auxJson.EWS.o_content.o_value_descriptions.yglui_str_description;

            var ratingClassBody = "PFM_perfDescriptions_body";

            if (divElement.id == "divRatingInfo") {
                ratingClassBody = "PFM_perfDescriptions_body2";
            }

            divElement.update("<a name='PFM_rating_descripts'></a>");
            for (var i = 0; i < descriptNodes.length; i++) {
                divElement.insert(new Element('div', { 'class': 'PFM_perfDescriptions_head' }).update(descriptNodes[i]['@short']));
                divElement.insert(new Element('div', { 'class': ratingClassBody }).update(descriptNodes[i]['@text']));
            }
        }
        else
            linkElement.update(global.getLabel('PFM_Rating_Info'));
    },
        
     /**  
     *@description Opens a pop up with an element, so the user can modify its values
     */      
    printFields: function(section){   
        //this.reloadFlag = false;
        //observe changes
        document.observe('EWS:PFM_popUp_fieldModified', this.setReloadBinding);
        //put the element in a pop up in edit mode
        var _this = this;

        this.editWindow = new infoPopUp({                
            htmlContent: "<div class='PFM_fieldPanel fieldDispTotalWidth'></div>",
            width: 600,
            events: $H({ 
                onClose: 'EWS:PFM_doc_popUpClosed'
            }),
            closeButton :   $H( {                        
                'callBack':  _this.cancelAction.bind(this)
                //'callBack': this.testFormAndDoAction.bind(this, "editWindow")

            })                            
        });
        this.editWindow.create();           
        var auxDiv = this.editWindow.obInfoPopUpContainer.down('[class=PFM_fieldPanel fieldDispTotalWidth]');       
        if (this.json.EWS.o_custom['@deny_goal_ref'] != "X" && (this.showDropdown == 1 || this.showDropdown == 2)) {
            if (this.showDropdown == 1) {
                this.currentGoalType = this.teamGoals;               
            }else if(this.showDropdown == 2){
                this.currentGoalType = this.corpVals;
            }
             this.addGoalSearch(auxDiv, this.currentGoalType);
        }        
        this.printCollection.each(function(field){
            auxDiv.insert(field);            
        }.bind(this));  
        var errorMessageDiv = new Element ('div', {
            'class': 'PFM_editWindow_errorMessage'
        });    
        auxDiv.insert(errorMessageDiv);         
        var cancenlButtonJson = {
            elements:[],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };         
        var aux =   {
            idButton: 'saveDraftAddButton',
            label: global.getLabel('saveDraft'),
            handlerContext: null,
            handler: this.testFormAndDoAction.bind(this,"editWindow"),
            className: 'moduleInfoPopUp_stdButton',
            type: 'button',
            standardButton: true
        }; 
        cancenlButtonJson.elements.push(aux);
        var cancelButtonObj=new megaButtonDisplayer(cancenlButtonJson);  
        auxDiv.insert(cancelButtonObj.getButtons());       
           
        //if needed, hides some options   
        if (this.types.indexOf(section.shead['@layout_type']) < 0) {
            var json = {
                elements: [],
                mainClass: 'buttonDisplayer_container'
            };
            objectToArray(section.actions.yglui_vie_tty_ac).each(function(action) {
                if (action['@okcod'] != 'MOD') {
                    var aux = {
                        idButton: action['@actio'],
                        label: action['@actiot'],
                        handlerContext: null,
                        handler: this.runAction.bind(this, section, action['@actiot']),
                        className: 'application_action_link',
                        event: 'EWS:parentPFM_action',
                        type: 'link',
                        eventOrHandler: false
                    };
                    json.elements.push(aux);
                }
            } .bind(this));
            var auxButtons = new megaButtonDisplayer(json);
            auxDiv.insert(auxButtons.getButtons());
        }                
    }, 
    /**
    * @description When closing / saving info in an infoPopUp, checks if the fields are ok. If not, shows a message and does not close the infoPopUp
    * @param infoPopUp {String} The name or identificator of the infoPopUp
    * @param FPObject {fieldPanel} The fieldPanel we want to check
    */    
    testFormAndDoAction: function(infoPopUp){
        var accessedObject;
        switch(infoPopUp){
            case "editWindow":
                accessedObject = this.editWindow;
                break;
        }  
        var validation = this.validateForm();              
        if(validation.correctForm){
            this.destroyFields();
            accessedObject.close(); 
            delete accessedObject;   
        }else{
            accessedObject.obInfoPopUpContainer.down('div.PFM_editWindow_errorMessage').update(validation.errorMessage);
        }        
    },
    /**
     * Destroys all the elements
     */
    destroyFields: function() {
        //Going throught all the elements and destroy it
        if(this.fieldObjects)
            this.fieldObjects.each(function(field) {
                if(typeof field.value.destroy == "function")
                    field.value.destroy();
            });
        //Reseting the hash
        this.fieldObjects = $H();
    },
    cancelAddition: function(args){    
        //replace new section (with element) with the old one
        if(! Object.isEmpty(this.sectionBeforeAdding))
            if ( "@modified" in this.sectionBeforeAdding == false){
                delete this.currentSection['@modified'];
            }
        //to hide the message
        if(! this.saveChangesMessage.visible())
            this.toggleSaveChangesMessage(false); 
        if(! Object.isEmpty(this.sectionBeforeAdding))
            this.currentSection.elements = deepCopy(this.sectionBeforeAdding.elements);           
        this.reloadFlag = false;          
        this.editWindow.close();
        delete this.editWindow; 
    },  
    /**
     *@param row Json with the element structure
     *@description Add element in the pop up, so the user can edit it
     */	     
    addElement: function(row) {
        var cols_def = objectToArray(row.col_defs.yglui_str_doc_col_def);
        var cols = objectToArray(row.columns.yglui_str_doc_col_val);
        var headersStructure = new Hash();
        //sort both cols_def and cols
        var auxCols = new Array();

        var pappRatingCtr = 0;
        var pappCommentCtr = 0;
        var partAppraisers = objectToArray(this.partAppraisersJson.yglui_str_pfm_part_appraisers);

        //loop in headers to sort them
        for (var i = 1; i < cols_def.length; i++) {
            if (cols_def[i]['@fieldid'] == "PAPP") {
                if (cols_def[i]['@fieldlabel'].substr(cols_def[i]['@fieldlabel'].length - 1) != ")")
                    //if (partAppraisers[pappRatingCtr]) cols_def[i]['@fieldlabel'] = cols_def[i]['@fieldlabel'] + " (" + partAppraisers[pappRatingCtr]['@vorna'] + " " + partAppraisers[pappRatingCtr]['@nachn'] + ")";
                    if (partAppraisers[pappRatingCtr]) cols_def[i]['@fieldlabel'] = "Rating (" + partAppraisers[pappRatingCtr]['@vorna'] + " " + partAppraisers[pappRatingCtr]['@nachn'] + ")";
                pappRatingCtr++;
            } else if (cols_def[i]['@fieldid'] == "_PAPP") {
                if (cols_def[i]['@fieldlabel'].substr(cols_def[i]['@fieldlabel'].length - 1) != ")")
                    if (partAppraisers[pappCommentCtr]) cols_def[i]['@fieldlabel'] = cols_def[i]['@fieldlabel'] + " (" + partAppraisers[pappCommentCtr]['@vorna'] + " " + partAppraisers[pappCommentCtr]['@nachn'] + ")";
                pappCommentCtr++;
            }

            for (var j = 0; j < cols_def.length - 1; j++) {
                if (parseInt(cols_def[j]['@seqnr'], 10) > parseInt(cols_def[j + 1]['@seqnr'], 10)) {
                    var temp = cols_def[j];
                    cols_def[j] = cols_def[j + 1];
                    cols_def[j + 1] = temp;
                }
            }
        }    
        for (var i = 0; i < cols_def.length; i++) {    
            headersStructure.set(cols_def[i]['@fieldid'], {
                order: parseInt(cols_def[i]['@seqnr'],10)
            });               
        }
        for (var b = 0; b < cols.length; b++) {
            if (headersStructure.get(cols[b]['@fieldid']))
            cols[b]['@order'] = headersStructure.get(cols[b]['@fieldid']).order;
        }

        //Sorting (Part Appraisers' Ratings and Comments)
        //first, we move the PAPP fields to the bottom of the array
        var z = cols.length;
        for (var c = 0; c < z; c++) {
            if (cols[c]['@fieldid'] == "PAPP" || cols[c]['@fieldid'] == "_PAPP") {
                cols[cols.length] = cols[c];
                cols.splice(c, 1);
                c--;
                z--;
            }
        }

        //then, we sort the columns to insert them correctly - Originally from core
        for (var c = 1; c < cols.length; c++) {
            for (var d = 0; d < cols.length - 1; d++) {
                if (cols[d]['@order'] > cols[d + 1]['@order']) {
                    if (cols[d]['@fieldid'] != "PAPP" && cols[d]['@fieldid'] != "_PAPP") {
                    var temp = cols[d];
                    cols[d] = cols[d + 1];
                    cols[d + 1] = temp;
                }
            }
        }                   
        }

        //finally, we re-sort the columns to insert them correctly
        for (var c = 0; c < cols_def.length - 1; c++) {
            if (cols[c] && cols_def[c]['@fieldid'] != cols[c]['@fieldid']) {
                for (var d = c; d < cols.length - 1; d++) {
                    if (cols_def[c]['@fieldid'] == cols[d]['@fieldid']) {
                        var temp = cols[c];
                        cols[c] = cols[d];
                        cols[d] = temp;
                        break;
                    }
                }
            }
        }
        //End of Sorting

        var firstField = this.createField(row.ehead,null,true);
        this.fieldObjects.set(firstField.options.fieldId, firstField);  
        this.printCollection.push(firstField.getElement());     

        for (var i = 0; i < cols.size(); i++) {
            if (this.isColumn(cols_def[i])) {
                var auxObject = {
                    id: row.ehead.template.yglui_str_hrobject['@objid'],
                    type: row.ehead.template.yglui_str_hrobject['@otype'],
                    techName: cols[i]['@column_id']
                };
                var field = this.createField([cols_def[i], cols[i], row.ehead['@row_id']], auxObject,true);
                if (this.fieldInfo.indexOf((cols[i]['@fieldid'])) != -1) {
                    this.makeDescriptions(field);
                }
                this.fieldObjects.set(field.options.fieldId, field);
                this.printCollection.push(field.getElement());
            }
        }
    },
    /**
    * @description Generate goal search fields for 
    * @param section {Json} Section json
    */
    addGoalSearch: function(div, goalId) {

        div.insert(new Element('div', ({ 'class': 'fieldWrap', 'id': this.applicationId + '_autocompleter' })));
        div.down('div.fieldWrap').insert('<label for="' + this.labels.get('refGoal') + '"><abbr title="' + this.labels.get('refGoal') + '">' + this.labels.get('refGoal') + '</abbr></label><div id="'+this.applicationId + '_autocompleterDiv" class="PFM_goalAutocDiv"></div>');
        this.buildGoalAutoComplete(div, goalId);

    },

    buildGoalAutoComplete: function(div, goalId) {

        this.autoCompleter = new JSONAutocompleter(this.applicationId + '_autocompleterDiv', {
            events: $H({ onResultSelected: 'EWS:PFM_goalSelected'
            //onGetNewXml: this.applicationId + ':nodeSearch',
            }),
            showEverythingOnButtonClick: true,
            //noFilter: true,
            timeout: 0,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            maxShown: 20,
            minChars: 1
        }, this.buildGoalAutocompleteList(goalId));

//        var radbutton_group = "radBtnGrp_Goals";
//        var fieldName1 = "radBtn_" + this.teamGoals;
//        var fieldName2 = "radBtn_" + this.corpVals;
//        var fieldName3 = "radBtn_" + this.priorGoals;
//        var fieldName4 = "radBtn_" + this.naGoals;
//        var _this = this;

//        var radio1 = new Element('input',
//									({ 'type': 'radio',
//									    'name': radbutton_group,
//									    'value': fieldName1
//									}));
//        radio1.observe('click', function() { try { _this.refreshGoalSearch(_this.teamGoals); } catch (e) { } });
//        div.down('div.fieldWrap').insert("<br/>");
//        div.down('div.fieldWrap').insert(new Element('div', ({ 'id': 'goalTypes', 'style': 'float:right;padding-right: 80px;' })).insert(new Element('div', ({ 'class': 'div_goalTypes_row' })).update(radio1).insert(this.labels.get('teamGoal'))));
//        if (goalId == this.teamGoals) radio1.checked = true;

//        var radio2 = new Element('input',
//									({ 'type': 'radio',
//									    'name': radbutton_group,
//									    'value': fieldName2
//									}));
//        radio2.observe('click', function() { try { _this.refreshGoalSearch(_this.corpVals); } catch (e) { } });
//        div.down('div#goalTypes').insert(new Element('div', ({ 'class': 'div_goalTypes_row' })).insert(radio2).insert(this.labels.get('comGoal')));
//        if (goalId == this.corpVals) radio2.checked = true;

//        var radio3 = new Element('input',
//									({ 'type': 'radio',
//									    'name': radbutton_group,
//									    'value': fieldName3
//									}));
//        radio3.observe('click', function() { try { _this.refreshGoalSearch(_this.priorGoals); } catch (e) { } });
//        div.down('div#goalTypes').insert(new Element('div', ({ 'class': 'div_goalTypes_row' })).insert(radio3).insert(this.labels.get('prevGoal')));
//        if (goalId == this.priorGoals) radio3.checked = true;

        //        var radio4 = new Element('input',
        //									({ 'type': 'radio',
        //									    'name': radbutton_group,
        //									    'value': fieldName4
        //									}));
        //        radio4.observe('click', function() { try { _this.refreshGoalSearch(_this.naGoals).bind(_this); } catch (e) { } });
        //        div.down('div#goalTypes').insert(new Element('div', ({ 'class': 'div_goalTypes_row' })).insert(radio4).insert("N/A"));
        //        if (goalId == this.naGoals) radio4.checked = true;
    },

    buildGoalAutocompleteList: function(goalType) {
        var goalsArray = $A();
        switch (goalType) {
            case this.priorGoals:
                if (this.json.EWS.o_prior_years_goals) {
                    var docSections = objectToArray(this.json.EWS.o_prior_years_goals.yglui_str_doc_section);
                    for (var i = 0; i < docSections.length; i++) {
                        if (docSections[i].elements) {
                            this.oldGoalsObj = objectToArray(docSections[i].elements.yglui_str_doc_element);
                            this.oldGoalsObj.each(function(goal) {
                                goalsArray.push({
                                    text: goal.ehead["@name"],
                                    data: goal.ehead.template.yglui_str_hrobject["@objid"]
                                });
                            });
                        }
                    }
                }
                break;
            case this.teamGoals:
                if (this.json.EWS.o_team_goals) {
                    this.teamGoalsObj = objectToArray(this.json.EWS.o_team_goals.yglui_str_pfm_goal);
                    for (var i = 0; i < this.teamGoalsObj.length; i++) {
                        goalsArray.push({
                            text: this.teamGoalsObj[i]["@title"],
                            data: this.teamGoalsObj[i]["@objid"]
                        });
                    }
                }
                break;
            case this.corpVals:
                if (this.json.EWS.o_corp_goals) {
                    this.corpGoalsObj = objectToArray(this.json.EWS.o_corp_goals.yglui_str_pfm_goal);
                    for (var i = 0; i < this.corpGoalsObj.length; i++) {
                        goalsArray.push({
                            text: this.corpGoalsObj[i]["@title"],
                            data: this.corpGoalsObj[i]["@objid"]
                        });
                    }
                }
                break;
        }
        var goalsJSON = {
            autocompleter: {
                object: goalsArray,
                multilanguage: {
                    no_results: 'No results found',
                    search: 'Search'
                }
            }
        };
        return goalsJSON;
    },    
    goalSelected: function(event) {
        var args = getArgs(event);
        var popupFieldVals = $H({});
        var objType = "";
        switch (this.currentGoalType) {
            case this.priorGoals:
                this.oldGoalsObj.each(function(goal) {
                    var hrobj = goal.ehead.template.yglui_str_hrobject["@objid"];
                    if (hrobj == args.idAdded) {
                        var oldGoalFields = objectToArray(goal.columns.yglui_str_doc_col_val);
                        oldGoalFields.each(function(goalFields) {
                            if (goalFields["#text"] == null)
                                popupFieldVals.set(goalFields["@fieldid"], goalFields["@value"]);
                            else
                                popupFieldVals.set(goalFields["@fieldid"], goalFields["#text"]);
                        });
                        // Add Title
                        popupFieldVals.set("header", goal.ehead["@name"]);
                    }
                } .bind(this));
                objType = "VC";
                break;
            case this.teamGoals:
                this.teamGoalsObj.each(function(goal) {
                    if (goal["@objid"] == args.idAdded) {
                        popupFieldVals.set("header", goal["@title"]);
                        if (goal["@description"]) popupFieldVals.set("_OBJ0", goal["@description"]);
                        if (goal["@target"]) popupFieldVals.set("_ZMPK", goal["@target"]);
                        //if (goal["@endda"]) popupFieldVals.set("OBJE", goal["@endda"]);
                        //if (goal["@begda"]) popupFieldVals.set("OBJB", goal["@begda"]);
                    }
                } .bind(this));
                objType = "VJ";
                break;
            case this.corpVals:
                this.corpGoalsObj.each(function(goal) {
                    if (goal["@objid"] == args.idAdded) {
                        popupFieldVals.set("header", goal["@title"]);
                        if (goal["@description"]) popupFieldVals.set("_OBJ0", goal["@description"]);
                        if (goal["@target"]) popupFieldVals.set("_ZMPK", goal["@target"]);
                        //if (goal["@endda"]) popupFieldVals.set("OBJE", goal["@endda"]);
                        //if (goal["@begda"]) popupFieldVals.set("OBJB", goal["@begda"]);
                    }
                } .bind(this));
                objType = "VJ";
                break;
        }
        this.fieldObjects.each(function(fieldObj) {
            var sapId = fieldObj.value.options.sapId;
            if (sapId) {
                if (popupFieldVals.get(sapId)) {
                    if (fieldObj.value._object._datePicker) {
                        try {
                            fieldObj.value.setValue(popupFieldVals.get(sapId));
                        }
                        catch (e) {
                            fieldObj.value._object._datePicker.initCalendarDiv();
                            fieldObj.value.setValue(popupFieldVals.get(sapId));
                        }
                    }
                    else {
                        fieldObj.value.setValue(popupFieldVals.get(sapId));
                    }
                    if (fieldObj.value._object._datePicker) fieldObj.value._object._datePicker.actualDate = popupFieldVals.get(sapId);
                    fieldObj.value._object._valueInserted();
                }
                else {
                    if (fieldObj.value._object._datePicker) {
                        fieldObj.value._object._clearValue();
                    }
                    else {
                        if(!Object.isEmpty(fieldObj.value._object.setValue)){
                            fieldObj.value.setValue('');
                            fieldObj.value._object._valueInserted();
                        }
                    }
                }
            }
            else if (fieldObj.key.startsWith('header')) {
                if (popupFieldVals.get('header')) {
                    fieldObj.value.setValue(popupFieldVals.get('header'));
                    fieldObj.value._object._valueInserted();
                }
            }
        } .bind(this));
        this.updateRefObject(objType, args.idAdded, "01");
        this.setReload();
    }, 
//    refreshGoalSearch: function(goalId) {
//        $(this.applicationId + '_autocompleter').update('');
//        $(this.applicationId + '_autocompleter').insert('<label for="' + this.labels.get('refGoal') + '"><abbr title="' + this.labels.get('refGoal') + '">' + this.labels.get('refGoal') + '</abbr></label><div id="'+this.applicationId + '_autocompleterDiv" class="PFM_goalAutocDiv"></div>');
//        var div = this.editWindow.obInfoPopUpContainer.down('[class=PFM_fieldPanel fieldDispTotalWidth]');
//        this.currentGoalType = goalId;
//        this.buildGoalAutoComplete(div, goalId);
//    },
    updateRefObject: function(otype, objid, plvar) {
        this.currentElement.ehead.ref_object.yglui_str_hrobject["@otype"] = otype;
        this.currentElement.ehead.ref_object.yglui_str_hrobject["@objid"] = objid;
        this.currentElement.ehead.ref_object.yglui_str_hrobject["@plvar"] = plvar;
    },           
    /**
     *@param args Info about the clicked element
     *@description Put element in the pop up, so the user can edit it
     */	        
    editElement: function(args) {
        this.cont = getArgs(args).get('sectionCounter');
        this.sectionId = getArgs(args).get('sectionId');
        //MCD: reference goal
//        if (this.sectionId == "0002") this.showDropdown = true;
//        else this.showDropdown = false; 
//        var sectionsArray = objectToArray(this.json.EWS.o_content.sections.yglui_str_doc_section);
//        for(var i=0; i< sectionsArray.length; i++){
//            if(sectionsArray[i].shead['@sect_id'] == this.sectionId){
//                var actionsArray = objectToArray(sectionsArray[i].actions.yglui_vie_tty_ac);
//                for(var j=0;j<actionsArray.length;j++){
//                    if(actionsArray[j]['@okcod'] == 'INS'){
//                        if(actionsArray[j]['actio'] == 'IDOC_SECT_ADD')
//                            this.showDropdown = 1;
//                        else if(actionsArray[j]['actio'] == 'IDOC_SECC_ADD')
//                            this.showDropdown = 2;               
//                        else this.showDropdown = 0;                                 
//                    }
//                }
//            }
//        }        
        //MCD: reference goal
//        if (this.sectionId == "0002") this.showDropdown = true;      
        //end MCD
        this.showDropdown = 0;
        var rowId = getArgs(args).get('rowId');
        var sections = this.checkJson(this.json, ['EWS', 'o_content', 'sections', 'yglui_str_doc_section']);
        if (sections.answer) {
            objectToArray(sections.obj).each(function(singleSection) {
                if (singleSection.shead['@sect_id'] == this.sectionId) {
                    this.printCollection = [];
                    //Destroying the 
                    this.destroyFields();
                    this.currentSection = singleSection;
                    this.currentSection["@modified"] = true;
                    objectToArray(this.currentSection.elements.yglui_str_doc_element).each(function(row) {
                        if (row.ehead['@row_id'] == rowId) {
                            this.addElement(row);
                            this.currentElement = row;
                            return;
                        }
                    } .bind(this));
                    this.printFields(this.currentSection);
                    return;
                }
            } .bind(this));
        }
    },
    /**
     *@param event Info about the clicked element
     *@description Deletes element from json and screen
     */    
    deleteRequest: function(event) {
        var args = getArgs(event);
        var rowId = args.get('rowId');
        var grId = args.get('sectionCounter');
        var sectionId = args.get("sectionId");
        this.grArrayMain[grId].deleteRow(rowId);
        //Loop sections to find the one to remove
        objectToArray(this.json.EWS.o_content.sections.yglui_str_doc_section).each(function(section, sectionIndex) {
            if (section.shead["@sect_id"] == sectionId) {
                var sectionsArray = objectToArray(this.json.EWS.o_content.sections.yglui_str_doc_section);
                if (Object.isArray(section.elements.yglui_str_doc_element)) {                    
                    sectionsArray[sectionIndex].elements.yglui_str_doc_element.each(function(element, elementIndex) {
                        if (element.ehead["@row_id"] == rowId) {
                            var auxElement = sectionsArray[sectionIndex].elements.yglui_str_doc_element[elementIndex];
                            sectionsArray[sectionIndex].elements.yglui_str_doc_element = sectionsArray[sectionIndex].elements.yglui_str_doc_element.without(auxElement);
                            sectionsArray[sectionIndex]["@modified"] = true;
                        }
                    } .bind(this));
                } else {
                    sectionsArray[sectionIndex].elements = null;
                    sectionsArray[sectionIndex]["@modified"] = true;
                }
            }
        } .bind(this));
        //to show the message
        this.toggleSaveChangesMessage(true);
    },
    /**
    * @description Open a given application, normally, the previous application
    * @param appToOpen {String} The previous application that we want to open again 
    */ 
    goBack: function(appToOpen) {
        global.open($H({
            app: {
                appId: this.prevApp,	                       
                view: this.prevView
    },
            refresh:'X'
        }));        
    },
    /**
    * @description Buils the xml_in to call to SAP with service save_doc
    * @param event {Args} Data about the event
    */      
    saveDocument: function(args) {
        //hide the message
        this.toggleSaveChangesMessage(false);
        //button parameters
        var idOfDocument = args.keys()[0];
        var contentOfButton = args.get(idOfDocument);
        var bustx = Object.isEmpty(contentOfButton['@bustx']) ? "" : contentOfButton['@bustx'];
        var busid = Object.isEmpty(contentOfButton['@busid']) ? "" : contentOfButton['@busid'];
        var disma = Object.isEmpty(contentOfButton['@disma']) ? "" : contentOfButton['@disma'];
        var methd = Object.isEmpty(contentOfButton['@methd']) ? "" : contentOfButton['@methd'];
        var tarap = Object.isEmpty(contentOfButton['@tarap']) ? "" : contentOfButton['@tarap'];
        var tarty = Object.isEmpty(contentOfButton['@tarty']) ? "" : contentOfButton['@tarty'];
        var okcod = Object.isEmpty(contentOfButton['@okcod']) ? "" : contentOfButton['@okcod'];
        var actio = Object.isEmpty(contentOfButton["@actio"]) ? "" : contentOfButton["@actio"];
        var actiot = Object.isEmpty(contentOfButton["@actiot"]) ? "" : contentOfButton["@actiot"];
        var mandt = Object.isEmpty(contentOfButton["@mandt"]) ? "" : contentOfButton["@mandt"];
        // Getting accessed object (there is only one employee selected -single selection-)
        var pernr = global.getSelectedEmployees().first();
        //create the json (xml_in)
        var jsonDocs = {
            EWS: {
                SERVICE: "SAVE_DOCUMENT",
                OBJECT: { "@TYPE": "P", "#text": pernr }, // Accessed object
                PARAM: {
                    DOC_ID: idOfDocument,
                    action: {
                        "@actio": actio,
                        "@actiot": actiot,
                        "@busid": busid,
                        "@bustx": bustx,
                        "@disma": disma,
                        "@mandt": mandt,
                        "@methd": methd,
                        "@okcod": okcod,
                        "@tarap": tarap,
                        "@tarty": tarty
                    },
                    SECTIONS: { 
                        yglui_str_doc_section: $A()
                    }
                }
            }
        };
        var modifiedSectionsNumber = 0;
        objectToArray(this.json.EWS.o_content.sections.yglui_str_doc_section).each(function(section) {
            if ("@modified" in section) {
//                modifiedSectionsNumber ++;
                jsonDocs.EWS.PARAM.SECTIONS.yglui_str_doc_section.push(section);
            }
        });
//        if(modifiedSectionsNumber > 0){
            var json2xml = new XML.ObjTree();
            json2xml.attr_prefix = '@';
            this.makeAJAXrequest($H({
                xml: json2xml.writeXML(jsonDocs),
                successMethod: 'processCallToSaveDocument'
            }));
//        }
    },
    /**
    * @description Process the call to save_doc. If no errors, open the previous app
    * @param response {Json} The response from the save_doc 
    */      
    processCallToSaveDocument: function(jsonObject) {
        var valueOfError = jsonObject.EWS.webmessage_type;
        if (valueOfError != 'E'){
//            global.goToPreviousApp({refresh: 'X'});
                global.open($H({
                    app: {
                        appId: this.options.appId,	
                        tabId: this.options.tabId,	                        
                        view: this.options.view
                    },
                    idOfDoc:this.idDoc,
                    previousApp:this.prevApp,
                    previousView: this.prevView
                }));
        }
    },
    /**
    * @description Add header to simple table
    * @param firstRow {Json} Header information
    */     
    addHeaderToSimpleTable: function(firstRow) {
        if (this.types.indexOf(this.currentSection.shead['@layout_type']) < 0) {
            this.editableTableData.header.push({
                text: '*',
                id: 'header_0_' + this.appName + '_editableTable_deleteActionHeader'
            });
        }
        //By default first Header is Title
        this.editableTableData.header.push({
            text: global.getLabel('title'),
            id: 'header_0_' + this.appName + '_editableTable'
        });
        var cols_def = objectToArray(firstRow.col_defs.yglui_str_doc_col_def);
        for (var i = 0; i < cols_def.size(); i++) {
            if (this.isColumn(cols_def[i])) {
                var columnHeader = this.chooseLabel(cols_def[i]['@fieldid'], cols_def[i]['@label_type'], cols_def[i]['@fieldlabel']);
                this.editableTableData.header.push({
                    text: columnHeader,
                    id: 'header_' + (i + 1) + '_' + this.appName + '_editableTable'
                });
            }
        }
    },
    /**
    * @description Add header to simple table
    * @param field {Json} Field data
    * @param object Acessed object
    * @param addLabel Label info of the id
    */     
    createField: function(field, object,addLabel) {
        var resultField = null;
        var auxObject   = null;
        var randFactor  = Math.random().toString().replace(/\./,''); 
        //if it is header or a normal column
        if (!Object.isEmpty(field['@row_id'])) {
            if (!Object.isEmpty(field['@name']))
                auxObject = {
                    id: field['@name'],
                    text: field['@name']
                };
            resultField = new FieldDisplayer(
            {
                fieldFormat: 'I',
                fieldId: 'header_' + field['@row_id'] + randFactor,
                displayAttrib: (!Object.isEmpty(field['@enable_edit_name']) && (field['@enable_edit_name'].toLowerCase() == 'x')) ? 'MAN' : 'OUO',
                defaultValue: auxObject,
                type: (!Object.isEmpty(field['@type'])) ? field['@type'] : 'CHAR',
                maxLength: field['@length'],
                events: $H({ 
                    formFieldModified: 'EWS:PFM_popUp_fieldModified'
                }),
                fieldLabel: (addLabel)?global.getLabel('title'):''               
            }, field);
        } else {
            oneField = field[0];
            oneField['@value'] = field[1]['@value'];
            oneField['#text'] = field[1]['#text'];
            var pXml = '';
            if (!Object.isEmpty(oneField['@service_values']) && !Object.isEmpty(object)) {
                pXml = "<EWS>" +
                "<SERVICE>" + oneField['@service_values'] + "</SERVICE>" +
                "<OBJECT TYPE='" + object.type + "'>" + object.id + "</OBJECT>" +
                "<PARAM>" +
                "<FIELD FIELDID='" + oneField['@fieldid'] + "' FIELDLABEL='" + oneField['@fieldlabel'] + "' FIELDTECHNAME='" + object.techName + "' VALUE='' />" +
                "</PARAM>" +
                "</EWS>";
            }
            var def = (this.defaultValue) ? this.chooseValue(oneField['@default_value'], oneField['@default_text'], oneField['@show_text']) : this.chooseValue(oneField['@value'], oneField['#text'], oneField['@show_text']);
            var dValue = (this.defaultValue) ? oneField['@default_value'] : oneField['@value'];
            var label = this.chooseLabel(oneField['@fieldid'], oneField['@label_type'], oneField['@fieldlabel']);
            if (!Object.isEmpty(def) || !Object.isEmpty(dValue))
                auxObject = {
                    id: dValue,
                    text: def
                };
            resultField = new FieldDisplayer(
            {
                fieldFormat: (!Object.isEmpty(oneField['@fieldformat'])) ? oneField['@fieldformat'].strip() : '',
                fieldId: (!Object.isEmpty(oneField['@fieldid'])) ? this.appName + field[2] + oneField['@fieldid'].strip() : '',
                sapId: (!Object.isEmpty(oneField['@fieldid'])) ? oneField['@fieldid'].strip() : '',
                displayAttrib: (!Object.isEmpty(oneField['@display_attrib'])) ? oneField['@display_attrib'].strip() : '',
                type: (!Object.isEmpty(oneField['@type'])) ? oneField['@type'].strip() : 'CHAR',
                maxLength: (!Object.isEmpty(oneField['@length'])) ? oneField['@length'].strip() : '',
                defaultValue: auxObject,
                events: $H({ 
                    formFieldModified: 'EWS:PFM_popUp_fieldModified'
                }),
                serviceValues: (!Object.isEmpty(oneField['@service_values'])) ? oneField['@service_values'].strip() : 'default',
                strKey: 'default',
                predefinedXmlIn: pXml,
                widScreen: 'default',
                appId: 'default',
                showText: (!Object.isEmpty(oneField['@show_text'])) ? oneField['@show_text'].strip() : '',
                fieldLabel: (addLabel)?label:''
            }, field[1]);
        }
        return resultField;
    },
    
    /**
    * @description When field directly modified from header line, mark document as modified
    */
    fieldModified: function() {
        var sections = objectToArray(this.json.EWS.o_content.sections.yglui_str_doc_section);
        sections.each(function(element) { element["@modified"] = true; });
        document.stopObserving('EWS:PFM_fieldModified', this.fieldModified.bind(this));
    },    
    
    /**
    * @description Generates the HTML to pop up the value descriptions
    */
    makeDescriptions: function(fieldObj) {
        if (fieldObj._element.select('div')[0])
            var l_fieldObj = fieldObj._element.select('div')[0];
        else
            var l_fieldObj = fieldObj._element;
           
        var descript_link = new Element('a', { 'href': '#PFM_rating_descripts' }).update("Rating Info");
        var descript_div = new Element('div', { 'class': 'fieldWrap' });
        descript_div.hide();
        descript_link.observe('click', this.toggleDescriptions.bind(this, descript_div, descript_link));
        l_fieldObj.insert('&#160;');
        l_fieldObj.insert(descript_link);
        l_fieldObj.insert(descript_div);
    },
    
    /**It checks all the fielDisplayer objects state, and returns true if the form validation was ok, or
	* false plus the errorMessage String in other case.    
    * @returns Object
    */  
    validateForm: function(){
        var state = true;
        var message = '';
        //looping over all fieldDisplayer objects
        this.fieldObjects.each(function(field){   
            //To avoid crashing because of any fieldDisplayer type without checkFormat() method
            try{
                //calling each fieldDisplayer checkFormat() method
                if(!field.value.checkFormat()){
                    state = false;
                    if(field.value && field.value.options)
                        message += '<br/>'+field.value.options.fieldLabel+': '+global.getLabel('fieldError');
                }
            }catch(e){}
        }.bind(this));    
        //state= 'true' || 'false' and erroMessage:"field1Label: globalErrorMessage + field2Label: globalErrorMessage etc."
        return {
            correctForm:state,
            errorMessage:message
        };
    },
    /**
    * @description Add row to simple table
    * @param row {Json} Row data
    */     
    addRowToSimpleTable: function(row) {
        var cols_def = objectToArray(row.col_defs.yglui_str_doc_col_def);
        var cols = objectToArray(row.columns.yglui_str_doc_col_val);
        var headersStructure = new Hash();
        //sort both cols_def and cols
        var auxCols = new Array();
        //loop in headers to sort them
        for (var i = 1; i < cols_def.length; i++) {
            for (var j = 0; j < cols_def.length - 1; j++) {
                if (parseInt(cols_def[j]['@seqnr'], 10) > parseInt(cols_def[j + 1]['@seqnr'], 10)) {
                    var temp = cols_def[j];
                    cols_def[j] = cols_def[j + 1];
                    cols_def[j + 1] = temp;
                }
            }
        }    
        for (var i = 0; i < cols_def.length; i++) {    
            headersStructure.set(cols_def[i]['@fieldid'], {
                order: parseInt(cols_def[i]['@seqnr'],10)
            });               
        }
        for (var b = 0; b < cols.length; b++) {
            cols[b]['@order'] = headersStructure.get(cols[b]['@fieldid']).order;
        }
        //first, we sort the columns to insert them correctly
        for (var c = 1; c < cols.length; c++) {
            for (var d = 0; d < cols.length - 1; d++) {
                if (cols[d]['@order'] > cols[d + 1]['@order']) {
                    var temp = cols[d];
                    cols[d] = cols[d + 1];
                    cols[d + 1] = temp;
                }
            }
        }           
        var firstField = this.createField(row.ehead,null,false);
        this.fieldObjects.set(firstField.options.fieldId, firstField);
        this.editableTableData.rows.set('row' + row.ehead['@row_id'], { 
            data: []
        });
        if (this.types.indexOf(this.currentSection.shead['@layout_type']) < 0 && this.currentSection.shead['@layout_type'] != 'B') {
            this.addDeleteButton(row);
        }
        this.editableTableData.rows.get('row' + row.ehead['@row_id']).data.push({ 
            text: firstField.getElement()
        });
        for (var i = 0; i < cols.size(); i++) {
            if (this.isColumn(cols_def[i])) {
                var auxObject = {
                    id: row.ehead.template.yglui_str_hrobject['@objid'],
                    type: row.ehead.template.yglui_str_hrobject['@otype'],
                    techName: cols[i]['@column_id']
                };
                var field = this.createField([cols_def[i], cols[i], row.ehead['@row_id']], auxObject,false);
                this.fieldObjects.set(field.options.fieldId, field);
                this.editableTableData.rows.get('row' + row.ehead['@row_id']).data.push({
                    id: 'row' + row.ehead['@row_id'],
                    text: field.getElement()
                });
            }
        }
    },
    /**
    * @description In simple documents, adds the delete button (cross) in a given row
    * @param row The row in the table
    */  
    addDeleteButton: function(row) {
        var mainButtonsJson = {
            elements: [],
            mainClass: 'PFM_ShowDocsGeneralButons'
        };
        var aux = {
            idButton: 'deleteButton_' + row.ehead['@row_id'],
            label: '',
            handlerContext: null,
            handler: this.deleteRow.bind(this, row),
            className: 'application_currentSelection PFM_delete_cross',
            type: 'button'
        };
        mainButtonsJson.elements.push(aux);
        var button = new megaButtonDisplayer(mainButtonsJson);
        this.editableTableData.rows.get('row' + row.ehead['@row_id']).data.push({ 
            text: button.getButtons()
        });
    },
    /**
    * @description In simple documents, deletes a row in a table
    * @param row The row in the table
    */     
    deleteRow: function(row) {
        if (Object.isArray(this.currentSection.elements.yglui_str_doc_element)) {
            this.currentSection.elements.yglui_str_doc_element.each(function(rowElement) {
                if (rowElement.ehead['@row_id'] == row.ehead['@row_id']) {
                    this.currentSection.elements.yglui_str_doc_element = this.currentSection.elements.yglui_str_doc_element.without(rowElement);
                }
            } .bind(this));
        } else {
            this.currentSection.elements = null;
        }
        this.table.removeRow('row' + row.ehead['@row_id']);
        this.setReload();
    },    
    /**
    * @description Show a simple table in a pop up
    * @param section {Json} Section json
    */      
    showTableInPopUp: function(section) {
        this.reloadFlag = false;
        //observe changes
        document.observe('EWS:PFM_popUp_fieldModified', this.setReloadBinding);
      
        var _this = this;
        this.editWindow = new infoPopUp({                
            htmlContent: "<div class='PFM_fieldPanel fieldDispTotalWidth'></div>",
            width: 900,
            events: $H({ 
                onClose: 'EWS:PFM_doc_popUpClosed'
            }),
            closeButton :   $H( {                        
                'callBack':     function() {
                    _this.editWindow.close();
                    delete _this.editWindow;                    
                }
            })                            
        });
        this.editWindow.create();                
        var auxDiv = this.editWindow.obInfoPopUpContainer.down('[class=PFM_fieldPanel fieldDispTotalWidth]');
        auxDiv.insert(this.table.getElement());
        if (this.types.indexOf(section.shead['@layout_type']) < 0) {
            var json = {
                elements: [],
                mainClass: 'buttonDisplayer_container'
            };
            objectToArray(section.actions.yglui_vie_tty_ac).each(function(action) {
                if (action['@okcod'] != 'MOD') {
                    var aux = {
                        idButton: action['@actio'],
                        label: action['@actiot'],
                        handlerContext: null,
                        handler: this.runAction.bind(this, section, action['@actiot']),
                        className: 'application_action_link',
                        event: 'EWS:parentPFM_action',
                        type: 'link',
                        eventOrHandler: false
                    };
                    json.elements.push(aux);
                }
            } .bind(this));
            var auxButtons = new megaButtonDisplayer(json);
            auxDiv.insert(auxButtons.getButtons());
        }

    },
    /**
    * @description For simple docs, perform an action
    * @param section {Json} Section json
    * @param action {Json} Selected action
    */      
    runAction: function(section, action) {
        switch (action) {
            case 'Add': this.addRow(section); break;
        }
    },
    /**
    * @description Add row in simple table
    * @param section {Json} Section json
    */      
    addRow: function(section) {
        var auxRow = deepCopy(section.element_def);
        var rowIndex = parseInt(this.editableTableData.rows.keys().max().gsub('row', ''),10) + 1;
        auxRow.ehead['@row_id'] = rowIndex;
        this.addRowToSimpleTable(auxRow);
        var auxObject = $H();
        auxObject.set('row' + rowIndex, this.editableTableData.rows.get('row' + rowIndex));
        this.table.addRow(auxObject);
        if (['@elements'] in this.currentSection) {
            delete this.currentSection["@elements"];
            this.currentSection.elements = {
                yglui_str_doc_element: deepCopy(auxRow)
            };
        }
        else {
            this.currentSection.elements.yglui_str_doc_element = objectToArray(this.currentSection.elements.yglui_str_doc_element);
            this.currentSection.elements.yglui_str_doc_element.push(deepCopy(auxRow));
        }
        this.setReload();

    },
    /**
    * @description Edit a simple doc
    * @param data Data abnout the event thrown when the action was clicked
    */      
    editSimpleDoc: function(data) {
        this.cont = getArgs(data).get('cont');
        this.editableTableData = {
            header: [],
            rows: $H()
        };
        //Destroy fields
        this.destroyFields();
        this.editWindow = null;
        this.defaultValue = false;
        if (this.checkEmpty([this.json, this.json.EWS, this.json.EWS.o_content, this.json.EWS.o_content.sections, this.json.EWS.o_content.sections.yglui_str_doc_section])) {
            this.currentSection = objectToArray(this.json.EWS.o_content.sections.yglui_str_doc_section)[getArgs(data).get('cont')];
        }
        this.addHeaderToSimpleTable(objectToArray(this.currentSection.elements.yglui_str_doc_element)[0]);
        if (!Object.isEmpty(this.currentSection)) {
            objectToArray(this.currentSection.elements.yglui_str_doc_element).each(function(row) {
                this.addRowToSimpleTable(row);
            } .bind(this));
            this.table = new SimpleTable(this.editableTableData, {});
            this.showTableInPopUp(this.currentSection);
        }
    },
    /**
    * @description Event launched to reload a section, because something inside was modified
    * @param event {Args} Data about the modified section
    */  
    setReload: function(event) {
        this.reloadFlag = true;
        document.stopObserving('EWS:PFM_popUp_fieldModified', this.setReloadBinding);
        //modify json to indicate we changed the section
        this.currentSection["@modified"] = true;


    },
    /**
    * @description When closing the pop up, if needed, reload a section
    */      
    reloadSection: function() {
        //to show the message
        this.toggleSaveChangesMessage(true);    
        delete (this.grArrayMain[this.cont]);
        this.virtualHtml.down('div#PFM_simpleTableExample' + this.cont).update('');
        if (this.currentSection.shead['@layout_type'] == 'E' || this.currentSection.shead['@layout_type'] == 'F')
            var newJson = this.getDocToGroupedLayout(this.currentSection, true, this.cont);
        else
            var newJson = this.getDocToGroupedLayout(this.currentSection, false, this.cont);
        this.grArrayMain[this.cont] = new groupedLayout(newJson, this.virtualHtml.down('div#PFM_simpleTableExample' + this.cont));
        this.grArrayMain[this.cont].buildGroupLayout();
    }
});
