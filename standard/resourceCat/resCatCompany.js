/** 
* @fileOverview resCatCompany.js 
* @description File containing class resCatCompany. 
* Application for Resource Catalogue.
*/

/**
*@constructor
*@description Class resCatCompany.
*/
var resCatCompany = Class.create(GenericCatalog, {

    getCatSessionsService: 'GET_CATSESSION',
    getNavLinkService: 'GET_MAIN_LINK',
    /*
    *@method initialize
    *@param $super: the superclass: GenericCatalog
    *@desc instantiates the app
    */
    initialize: function($super, options) {
        $super(options, {
            containerParent: 'LRN_RES',
            containerChild: 'TM_L_CTC',
            initialService: 'GET_CAT_ROOTS',
            getNodeChildrenService: 'GET_CAT_CHILD',
            searchService: 'GET_CAT_SEAR',
            searchedNodeSelectedService: 'GET_CAT_PAR',
            nodeClickedService: 'GET_CAT_ACTIO',
            applicationId: 'resCatCompany'  //applicationId: args.className
        });
        this.actionClickedBinding = this.actionClicked.bindAsEventListener(this);
    },

    /*
    *@method run
    *@param $super: the superclass: GenericCatalog
    * which have changed.
    */
    run: function($super, args) {
        $super(args);
        document.observe(this.applicationId + ':action', this.actionClickedBinding);
    },
    setHTML: function(data) {
        var xml = "<EWS>" +
				    "<SERVICE>" + this.initialService + "</SERVICE>" +
				    "<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>" +
				    "<DEL></DEL>" +
				    "<PARAM>" +
					    "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
					    "<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
				    "</PARAM>" +
		       "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'setNavigationLinks' }));

        if (!Object.isEmpty(data.EWS.o_root)) {
            this.json = data;
            this.data = this.handleData(data);
            this.labels = this.json.EWS.labels.item
            this.virtualHtml.insert(
            //"<div id='"+this.applicationId+"_level1' class='genCat_level1'></div>"+
            "<div id='" + this.applicationId + "_level1_links' class='genCat_level1'></div>" +
	        "<div id='" + this.applicationId + "_level2' class='genCat_level2 trainingCat_level2'></div>" +
	        "<div class='learningNewReq_alignLink' id='learning_addNewTraining'></div>" +
	        "<div id='" + this.applicationId + "_level3' class='genCat_level3'></div>" +
	        "<div id='" + this.applicationId + "_level4' class='genCat_level4 trainingCat_level2'></div>" +
	        "<div class='genCat_backTop'>" +
	            "<span id='" + this.applicationId + "_backTop' class='application_action_link'>" + global.getLabel('Back to Top') + "</span>" +
	        "</div>" +
	        "<div style='clear:both'>&nbsp;</div>" +
	        "<div id='" + this.applicationId + "_level5' class='genCat_level5'></div>"
	    );

            this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
            this.virtualHtml.down('span#' + this.applicationId + '_backTop').observe('click', function() {
                this.backTop();
            } .bind(this));

            //this.setTitleDiv();            
            this.setAutoCompleterDiv();
            this.setAutoCompleterLabel(global.getLabel('searchByKeyWord'));
            this.setDatePickersDiv();
            this.setLegendDiv();
            this.setTreeDiv();
            this.trees.each(function(tree) {
                tree.value.expandNodeById(tree.key);
            } .bind(this));
        }
    },

    /**     
    *@description It calls SAP to get the links
    */
    setNavigationLinks: function(data) {
        if (!Object.isEmpty(data.EWS.o_root)) {
            var xml = "<EWS>" +
                        "<SERVICE>" + this.getNavLinkService + "</SERVICE>" +
                        "<OBJECT TYPE='P'>" + global.objectId + "</OBJECT>" +
                        "<PARAM>" +
                            "<I_APPID>" + this.applicationId + "</I_APPID>" +
                        "</PARAM>" +
                        "<DEL/>" +
                    "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'drawNavLinks' }));
        }
    },

    /**     
    *@description It sets the value to show the maintenance link
    */
    drawNavLinks: function(json) {
        this.hashOfButtons = $H();
        var buttonsAnswer = objectToArray(json.EWS.o_buttons.yglui_str_wid_button);
        var buttonsNavJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        for (var i = 0; i < buttonsAnswer.length; i++) {
            //save button info
            if (this.hashOfButtons.keys().indexOf(buttonsAnswer[i]['@action']) == -1) {
                this.hashOfButtons.set(buttonsAnswer[i]['@action'], {
                    tarap: buttonsAnswer[i]['@tarap'],
                    tabId: buttonsAnswer[i]['@tartb'],
                    views: buttonsAnswer[i]['@views']
                });
            }
            var aux = {
                idButton: buttonsAnswer[i]['@views'] + '_button',
                label: buttonsAnswer[i]['@label_tag'],
                handlerContext: null,
                className: 'getContentLinks application_action_link',
                handler: this.openNavApp.bind(this, buttonsAnswer[i]['@action']),
                eventOrHandler: false,
                type: 'link'
            };
            buttonsNavJson.elements.push(aux);

        } //end for
        var ButtonObj = new megaButtonDisplayer(buttonsNavJson);
        var buttonsNav = ButtonObj.getButtons();
        //insert buttons in div
        this.virtualHtml.down('div#' + this.applicationId + '_level1_links').insert(buttonsNav);
        //disable current link:   
        for (var i = 0; i < buttonsAnswer.length; i++)
            if (buttonsAnswer[i]['@views'] == this.appName)
            ButtonObj.disable(this.appName + '_button');
    },
    openNavApp: function(action) {
        global.open($H({
            app: {
                appId: this.hashOfButtons.get(action).tarap,
                tabId: this.hashOfButtons.get(action).tabId,
                view: this.hashOfButtons.get(action).views
            }
        }));
    },


    /**     
    *@description It sets the third HTML level (the DatePickers one)
    */
    setDatePickersDiv: function() {
        this.datePickersLabel = new Element('span', { className: 'application_main_title3' });
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.datePickersLabel.update(global.getLabel('date')).wrap('div', { className: 'genCat_label trainingCat_label' }));
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert("<div class='catalog_comp' id='" + this.applicationId + "_datePickers'>" +
																				    "<div id='" + this.applicationId + "_datePickerBeg'></div>" +
																		      "</div>");
        var aux = { events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' }), startDay: 1, defaultDate: objectToSap(new Date()).gsub('-', '') };
        this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
        aux = { events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' }), defaultDate: objectToSap(this.datePickerBeg.actualDate.year()).gsub('-', '') };

    },
    /**     
    *@param args {event} event thrown by when a session has been clicked.
    *@description It gets a node contextual actions from SAP.
    */
    nodeSessionClicked: function(event, courseId, sessionId, oType) {
        var xml = "<EWS>" +
						"<SERVICE>" + this.nodeClickedService + "</SERVICE>" +
						"<OBJECT TYPE='" + oType + "'>" + sessionId + "</OBJECT>" +
						"<DEL></DEL>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
						"</PARAM>" +
				   "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'showSessionActions', ajaxID: this.applicationId + "_" + courseId + "_" + sessionId + "_session" }));

    },
    /**     
    *@param args {JSON} node contextual actions
    *@param ajaxId {String} node id and type
    *@description It fills the Balloon object with a node contextual actions links:
    *when clicking on each link (action) it will retrieve the available actions
    */
    showSessionActions: function(args, ajaxId) {
        var html = new Element('div');
        if (args && args.EWS && args.EWS.o_actions && args.EWS.o_actions.yglui_vie_tty_ac) {
            objectToArray(args.EWS.o_actions.yglui_vie_tty_ac).each(function(action) {
                var name = action['@actio'];
                var text = action['@actiot'];
                var app = action['@tarap'];
                var okCode = action['@okcod'];
                var tabId = action['@tartb'];
                var view = action['@views'];
                var disma = action['@disma'];
                var nodeId = ajaxId.split("_")[4];
                var span = new Element('div', { 'class': 'application_action_link genCat_balloon_span' }).insert(text);
                html.insert(span);
                span.observe('click', document.fire.bind(document, this.applicationId + ":action", $H({
                    name: name,
                    nodeId: nodeId,
                    application: app,
                    okCode: okCode,
                    tabId: tabId,
                    view: view,
                    disma: disma
                })));
            } .bind(this));
        } else {
            var span = new Element('div', { 'class': 'genCat_balloon_span' }).insert(global.getLabel('noActionsAvailable'));
            html.insert(span);
        }
        balloon.showOptions($H({
            domId: ajaxId,
            content: html
        }));
    },

    /**     
    *@description It toggles the filter options div
    */
    toggleFilterOptions: function() {
        this.virtualHtml.down('[id=' + this.applicationId + '_filterOptions]').toggle();
    },
    /**     
    *@description It sets the fourth HTML level  (the Legend one)
    */
    setLegendDiv: function() {
        var aux = new Object();
        var text = '';
        aux.legend = [];
        aux.showLabel = global.getLabel('showLegend');
        aux.hideLabel = global.getLabel('hideLegend');
        objectToArray(this.json.EWS.o_legend.item).each(function(element) {
            for (i = 0; i < this.json.EWS.labels.item.length; i++) {
                if (this.json.EWS.labels.item[i]['@id'] == element['@otype'])
                    text = this.json.EWS.labels.item[i]['@value'];
            }
            aux.legend.push({ img: this.CLASS_OBJTYPE.get(element['@otype']), text: text });
        } .bind(this));
        this.virtualHtml.down('div#' + this.applicationId + '_level4').update(getLegend(aux, 1));
        this.legend = this.virtualHtml.down('div#' + this.applicationId + '_level4');
    },
    /**     
    *@description It sets the second HTML level (the autoCompleter one)
    */
    setAutoCompleterDiv: function() {
        this.autoCompleterLabel = new Element('span', { className: 'application_main_title3' });
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.autoCompleterLabel.update('Autocompleter Label').wrap('div', { className: 'genCat_label trainingCat_label' })); //this.data.autocompleterLabel));
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert("<div class='genCat_comp' id='" + this.applicationId + "_autocompleter'></div>");
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: 'No results found',
                    search: 'Search'
                }
            }
        };
        this.autoCompleter = new JSONAutocompleter(this.applicationId + '_autocompleter', {
            events: $H({ onGetNewXml: this.applicationId + ':nodeSearch',
                onResultSelected: this.applicationId + ':nodeSelected'
            }),
            showEverythingOnButtonClick: true,
            noFilter: true,
            timeout: 0,
            templateResult: '#{text}',
            maxShown: 20,
            minChars: 1
        }, json);

    },
    /**     
    *@param args {Event} event thrown by the autoCompleter object when a node search has to be
    *performanced.
    *@description It gets a search node results list from the back-end.
    */
    nodeSearch: function(args) {
        if (getArgs(args).idAutocompleter == this.applicationId + '_autocompleter') {
            //this.autoCompleter.loading();
            var xml = "<EWS>" +
						    "<SERVICE>" + this.searchService + "</SERVICE>" +
						    "<DEL></DEL>" +
						    "<PARAM>" +
							    "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							    "<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							    "<PATTERN>" + this.autoCompleter.element.getValue() + "</PATTERN>" +
							    "<DATUM>" + objectToSap(this.datePickerBeg.actualDate) + "</DATUM>" +
						    "</PARAM>" +
				      "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'showList' }));
        }

    },
    /**     
    *@description It executes the code that belongs to the action clicked 
    */
    actionClicked: function(parameters) {
        var name = getArgs(parameters).get('name');
        var nodeId = getArgs(parameters).get('nodeId');
        var nextApp = getArgs(parameters).get('application');
        var okCode = getArgs(parameters).get('okCode');
        var nodeType = getArgs(parameters).get('nodeType');
        var tabId = getArgs(parameters).get('tabId');
        var view = getArgs(parameters).get('view');
        var disma = getArgs(parameters).get('disma');
        //var okcod = getArgs(parameters).get('okcod');
        nodeType = getArgs(parameters).get('nodeType');
        var tarty = getArgs(parameters).get('tarty');
        if (tarty == 'P') { tabId = 'POPUP' };
        if (Object.isEmpty(okCode))
            okCode = '';
        this.nodeId = nodeId;
        switch (name) {
            case "LSOCREATEU": // Create Company

                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'U',
                    parentType: nodeType,
                    displayMode: 'create',
                    okCode: okCode
                }));
                break;
            case "LSODELETEU": // Delete Company

                this.genericDelete('U', nodeId, name, nextApp, global.getLabel('delete_resourceInfo'), okCode);
                balloon.hide();
                break;
            case "LSODISPLAYU": // View Details 

                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'U',
                    parentType: nodeType,
                    displayMode: 'display',
                    okCode: okCode
                }));
                break;
            case "LSOMAINTAINU": // Maintain Company

                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'U',
                    parentType: nodeType,
                    displayMode: 'edit',
                    okCode: okCode
                }));
                break;
            case "LSOREASIGNU": // Reassign
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    oType: nodeType,
                    parentType: nodeType,
                    displayMode: 'create',
                    okCode: "NEW"
                }));
                break;
            default:
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId }));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId
                }));
                break;
        }
    },
    /**
    * @description Builds the xml and send it to SAP for the Delete request
    */
    genericDeleteRequest: function(oType, objectId, actionId, appName, code) {
        if (Object.isEmpty(appName))
            appName = "";
        var xml = "<EWS>"
                        + "<SERVICE>" + this.genericDeleteService + "</SERVICE>"
                        + "<OBJECT TYPE=\"" + oType + "\">" + objectId + "</OBJECT>"
                        + "<PARAM>"
                            + "<REQ_ID></REQ_ID>"
                            + "<APPID>" + appName + "</APPID>"
                            + "<BUTTON ACTION=\"" + actionId + "\" OKCODE=\"" + code + "\" />"
                        + "</PARAM>"
                     + "</EWS>";

        this.makeAJAXrequest($H({ xml: xml, successMethod: 'genericDeleteAnswer' }));
    },
    /**
    * @description Method that deletes a course type/group or curriculum type after the user confirmation
    */
    genericDelete: function(oType, objectId, actionId, appName, message, code) {
        var messageFrom;
        if (code == 'CUT') { messageFrom = global.getLabel('delimitFrom') } else { messageFrom = global.getLabel('deleteFrom') }
        var genericDeleteHtml = "<div>"
                                   + "<div><span>" + message + "</span></div>"
                                   + "</div>";
        var aux = { manualDateInsertion: true,
            defaultDate: objectToSap(new Date()).gsub('-', '')
        };
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(genericDeleteHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function() {
            if (_this)
                _this.genericDeleteRequest(oType, objectId, actionId, appName, code);
            deleteCataloguePopUp.close();
            delete deleteCataloguePopUp;
        };
        var callBack3 = function() {
            deleteCataloguePopUp.close();
            delete deleteCataloguePopUp;
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

        var deleteCataloguePopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    deleteCataloguePopUp.close();
                    delete deleteCataloguePopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 600
        });
        deleteCataloguePopUp.create();
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
        document.stopObserving(this.applicationId + ':action', this.actionClickedBinding);
    }
});