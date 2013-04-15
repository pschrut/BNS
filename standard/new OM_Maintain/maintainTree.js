/** 
* @fileOverview maintainTree.js 
* @description File containing class maintainTree. 
* Application for Maintain OM.
*/

/**
*@constructor
*@description Class maintainTree_standard.
*@augments GenericCatalog 
*/
var MaintainTree = Class.create(GenericCatalog,
/** 
*@lends maintainTree_standard
*/
    {
    initialService: 'GET_ROOTS_OM',
    getNodeChildrenService: 'GET_CHILD_OM',
    searchedNodeSelectedService: 'GET_PAR_OM',
    hashOfButtons: $H(),
    linksLoaded: false,
    /**
    *Constructor of the class maintainTree_standard
    */
    initialize: function($super, args) {
        $super(args, {
            containerParent: 'OM_MGMT',
            containerChild: 'MGMT_OS'
        });
        this.actionClickedBinding = this.actionClicked.bindAsEventListener(this);
        this.employeeSelectedAdvSearchBinding = this.reloadTree.bindAsEventListener(this);
    },

    /**
    *@description Starts maintainTree_standard
    */
    run: function($super, args) {
        $super(args);
        document.observe(this.applicationId + ':action', this.actionClickedBinding);
        document.observe('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
    },
    /**     
    *@param name {String} node name
    *@param otype {String} node type
    *@description It formats a node name so as to be properly shown on the treeHandler 
    *(assigning it the correct className --> to show the proper tree icon)
    */
    formatName: function(name, otype) {
        return "<![CDATA[<table class='genCat_alignSpanInTree'>]]>" +
	            "<![CDATA[<tr><td class='treeHandler_iconSize'><div class='treeHandler_text_node_content " + this.CLASS_OBJTYPE.get(otype) + " genCat_iconInTree'></div></td>]]>" +
                "<![CDATA[<td class='treeHandler_textSize'><span class='treeHandler_text_node_content'>" + name + "</span></tr><tr><td class='genCat_additionalInfo' colspan='2'></td><td></td></tr></table>]]>";
    },
    /**     
    *@param json {JSON} nodes list
    *@param save {Boolean} true/false: to keep the result or not as the currentXML
    *(depending on if we are changing the node context or not, i mean completely refreshing
    *the treeHandler)
    *@description It turns a SAP node list into the proper format to be shown on the treeHandler
    */
    buildTreeXml: function(json) {
        var text = '<nodes>';
        var numberNoRoot = 0;
        json.each(function(node) {
            aux = {
                name: node.value['@stext'],
                id: node.value['@objid'],
                type: node.value['@otype'],
                icon: node.value['@icon'],
                plvar: node.value['@plvar'],
                children: (node.value['@parnt'] && (node.value['@parnt'].toLowerCase() == 'x')) ? 'X' : '',
                parent: node.value['@rootid'],
                select: (Object.isEmpty(node.value['@select'])) ? "" : node.value['@select'],
                textName: node.value['@stext']
            };
            this.nodes.set(aux.id, aux);
            aux.name = this.formatName(node.value['@stext'], node.value['@icon'])
            text += (node.value['@rootid']) ? this.templateNodes.evaluate(aux) : this.templateRoot.evaluate(aux);
            if (node.value['@rootid']) numberNoRoot++;
        } .bind(this));
        text += (json.size() == numberNoRoot) ? '</nodes>' : '</node></nodes>';
        return text;
    },
    handleData: function(data) {
        var structure = $H({});
        if (!Object.isEmpty(data.EWS.o_children))
            var nodes = data.EWS.o_children.yglui_str_parent_children_om;
        if (data.EWS.o_root || data.EWS.o_parent) {
            if (data.EWS.o_root) {
                //store the roots of the tree in a hash
                var roots = objectToArray(data.EWS.o_root.yglui_str_parent_children_om);
                this.numberOfRoots = roots.length;
                for (var i = 0; i < this.numberOfRoots; i++) {
                    this.hashOfRoots.set(i, roots[i]['@objid']);
                }
                //this.rootId = data.EWS.o_root.yglui_str_parent_children['@objid'];
                objectToArray(data.EWS.o_root.yglui_str_parent_children_om).each(function(node) {
                    structure.set(node['@objid'], $H({}));
                    structure.get(node['@objid']).set(node['@objid'], node);
                } .bind(this));
            } else {
                [data.EWS.o_parent].each(function(node) {
                    structure.set(node['@objid'], $H({}));
                    structure.get(node['@objid']).set(node['@objid'], node);
                } .bind(this));
            }
            if (nodes) {
                structure.each(function(root) {
                    objectToArray(nodes).each(function(nd) {
                        if (nd['@rootid'] == root.key) {
                            structure.get(root.key).set(nd['@objid'], nd);
                        }
                    } .bind(this));
                } .bind(this));
            }
        } else {
            if (nodes) {
                objectToArray(nodes).each(function(nd) {
                    structure.set(nd['@objid'], nd);
                } .bind(this));
            }
        }
        return structure;
    },
    /**     
    *@param data {JSON} node context
    *@description It sets the node context on the treeHandler, after receiving it as the respond
    *to the get node parent (context) information service.
    */
    navigateTo: function(type, data) {
        this.trees.each(function(tree) {
            tree.value.stopObserving();
        } .bind(this));
        this.virtualHtml.down('div#' + this.applicationId + '_level5').update('');
        delete this.trees;
        this.trees = $H({});
        this.data = this.handleData(data);
        this.setTreeDiv();
        if (!Object.isEmpty(data) && !Object.isEmpty(data.EWS) && !Object.isEmpty(data.EWS.o_parent) && !Object.isEmpty(data.EWS.o_parent['@objid'])) {
            this.trees.each(function(tree) {
                tree.value.expandNodeById(data.EWS.o_parent['@objid']);
            } .bind(this));
        } else if (!Object.isEmpty(data) && !Object.isEmpty(data.EWS) && !Object.isEmpty(data.EWS.o_root)) {
            if (Object.isEmpty(type) || !Object.isString(type)) {
                this.trees.each(function(tree) {
                    objectToArray(data.EWS.o_root.yglui_str_parent_children_om).each(function(root) {
                        tree.value.expandNodeById(root['@objid']);
                    } .bind(this));
                } .bind(this));
            }
            else {
                this.trees.get(type).expandNodeById(type);
            }
        }
    },
    /**     
    *@description It sets the HTML structure 
    */
    setHTML: function(data) {
        this.json = data;
        this.data = this.handleData(data);
        this.virtualHtml.insert(
					"<div id='" + this.applicationId + "_level3' class='genCat_level3'></div>" +
					"<div id='" + this.applicationId + "_level2' class='genCat_level2'></div>" +
					"<div id='" + this.applicationId + "_level4' class='genCat_level4'></div>" +
					"<div class='genCat_backTop'>" +
					    "<span id='" + this.applicationId + "_backTop' class='application_action_link'>" + global.getLabel("backtoroot") + "</span>" +
					"</div>" +
					"<div style='clear:both'>&nbsp;</div>" +
					"<div id='" + this.applicationId + "_level5' class='genCat_level5'></div>"
		);
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').observe('click', function() {
            //clear autocompleter
            this.autoCompleter.clearInput();
            //return to first tree
            this.backTop();
        } .bind(this));
        this.setDatePickersDiv();
        this.setAutoCompleterDiv();
        this.setLegendDiv();
        this.setTreeDiv();
        this.trees.each(function(tree) {
            tree.value.expandNodeById(tree.key);
        } .bind(this));
    },
    /**     
    *@description It sets the third HTML level (the DatePickers one)
    */
    setDatePickersDiv: function() {
        this.datePickersLabel = new Element('span', { className: 'application_main_title3' });
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert("<div class='genCat_comp OM_Maintain_datesDiv' id='" + this.applicationId + "_datePickers'>" +
																				"<span class='application_main_text genCat_from'>" + global.getLabel('date') + "</span>" +
																				"<div id='" + this.applicationId + "_datePickerBeg'></div>" +
    																		  "</div>");
        var aux = { events: $H({ correctDate: 'EWS:' + this.applicationId + '_correctDay' }),
            defaultDate: objectToSap(new Date()).gsub('-', '')
        };
        this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
    },
    /**     
    *@description It sets the second HTML level (the autoCompleter one)
    */
    setAutoCompleterDiv: function() {
        this.autoCompleterLabel = new Element('span', { className: 'application_main_title3' });
        this.radioButtonsGroup = new Element('div', { id: this.applicationId + '_radioButtonsGroup', className: 'genCat_radioButtonsGroup OM_Maintain_searchDiv' });
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert("<div class='genCat_comp OM_Maintain_searchDiv' id='" + this.applicationId + "_autocompleter'></div>");
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.radioButtonsGroup);
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
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
        var radioButton = "<div class='OM_checkboxes'><input type='radio' name='gcRadioGroup' value='O' checked>" + global.getLabel('ORGEH') + "</input></div>" +
                          "<div class='OM_checkboxes'><input type='radio' name='gcRadioGroup' value='S'>" + global.getLabel('PLANS') + "</input></div>";
        this.radioButtonsGroup.insert(radioButton);
        //Advanced Search
        this.advancedSearchDiv = new Element('div', { id: this.applicationId + '_advancedSearch', className: 'OM_Maintain_searchDiv' });
        //PROVISIONAL SOLUTION: links in tree
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.advancedSearchDiv);
        var advancedSearchButton = new Element("div", { "class": "application_handCursor" }).insert(new Element("div", {
            "class": "application_catalog_image application_catalog_image_AS"
        }).insert("&nbsp")).insert(new Element("div", {
            "class": "as_button"
        }).insert(global.getLabel('SRC_OV'))).observe("click", this.getAdvSearchlinks.bind(this));
        var advancedSearchLinks = new Element("div", { "id": "advSearchLinks", "class": "OM_advsSearchLinks" });

        // SOLUTION FOR SUBAPPLICATION IN POP UP : NEXT RELEASE        
        //        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.advancedSearchDiv);
        //        var advancedSearchButton = new Element("div", { "class": "application_handCursor" }).insert(new Element("div", {
        //            "class": "application_catalog_image application_catalog_image_AS"
        //        }).insert("&nbsp")).insert(new Element("div", {
        //            "class": "as_button"
        //        }).insert(global.getLabel('SRC_OV'))).observe("click", global.open.bind(global, $H({
        //            app: {
        //                tabId: "POPUP",
        //                appId: "advSearchOM",
        //                view: "advSearchOM"
        //            },
        //            containerChild:this.containerChild
        //END OF SOLUTION FOR SUBAPPLICATION IN POP UP : NEXT RELEASE        

        // SOLUTION FOR ONE OBJECT (PERSON)            
        //            app: {
        //                tabId: "POPUP",
        //                appId: "ADVS",
        //                view: "AdvancedSearch"
        //            },
        //            sadv_id: "STD_OM",
        //            multiple: false,
        //            addToMenu: false
        // END OF SOLUTION FOR ONE OBJECT

        //        })));


        this.advancedSearchDiv.insert(advancedSearchButton);

        this.advancedSearchDiv.insert(advancedSearchLinks);
        this.virtualHtml.down('div#advSearchLinks').hide();
    },
    /**     
    *@description It gets links of Advanced Search from sap the first time
    */
    getAdvSearchlinks: function() {
        //check if links for Adv Search have been loaded before
        if (!this.linksLoaded) {
            //calling sap to get different object for Adv Search
            var xml = "<EWS>"
                          + "<SERVICE>GET_MSHLP</SERVICE>"
                          + "<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>"
                          + "<PARAM>"
                            + "<APPID>" + this.containerChild + "</APPID>"
                          + "</PARAM>"
                        + "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'setAdvSearchlinks' }));
        } else {
            this.setAdvSearchlinks();
        }
    },
    /**     
    *@description It draws links and defines functinality for each button
    */
    setAdvSearchlinks: function(json) {
        if (!this.linksLoaded) {
            //update variable
            this.linksLoaded = true;
            // get info about links
            this.buttonsAnswer = objectToArray(json.EWS.o_tabs.yglui_str_madv_tab);
            var buttonsNavJson = {
                elements: []
                //mainClass: 'moduleInfoPopUp_stdButton_div_left'
            };
            this.numberOfLinks = this.buttonsAnswer.length;
            for (var i = 0; i < this.numberOfLinks; i++) {
                //save button info
                var seqnr = this.buttonsAnswer[i]['@seqnr'];
                this.hashOfButtons.set(seqnr, {
                    appId: this.buttonsAnswer[i]['@appid'],
                    label_tag: this.buttonsAnswer[i]['@label_tag'],
                    sadv_id: this.buttonsAnswer[i]['@sadv_id']
                });

                var aux = {
                    idButton: this.buttonsAnswer[i]['@sadv_id'] + '_button',
                    label: this.buttonsAnswer[i]['@label_tag'],
                    handlerContext: null,
                    className: 'getContentLinks application_action_link',
                    handler: this.openNavApp.bind(this, seqnr),
                    eventOrHandler: false,
                    type: 'link'
                };
                buttonsNavJson.elements.push(aux);
            } //end for
            var ButtonObj = new megaButtonDisplayer(buttonsNavJson);
            //insert buttons in div
            this.virtualHtml.down('div#advSearchLinks').insert(ButtonObj.getButtons());
        }
        //showing/hiding links
        if (!this.virtualHtml.down('div#advSearchLinks').visible()) {
            this.virtualHtml.down('div#advSearchLinks').show();
        } else {
            this.virtualHtml.down('div#advSearchLinks').hide();
        }
    },
    /**     
    *@description It opens Advanced Search application after clicking on a link.
    */
    openNavApp: function(seqnr) {
        global.open($H({
            app: {
                tabId: "POPUP",
                appId: "ADVS",
                view: "AdvancedSearch"
            },
            sadv_id: this.hashOfButtons.get(seqnr).sadv_id,
            multiple: false,
            addToMenu: false
        }));
    },
    /**     
    *@description It sets the fourth HTML level  (the Legend one)
    */
    setLegendDiv: function() {
        if (this.json.EWS.labels) {
            var aux = new Object();
            var text = '';
            aux.legend = [];
            aux.showLabel = global.getLabel('showLgnd');
            aux.hideLabel = global.getLabel('closeLgnd');
            this.json.EWS.o_legend.item.each(function(element) {
                for (i = 0; i < this.json.EWS.o_legend.item.length; i++) {
                    if (this.json.EWS.labels.item[i]['@id'] == element['@otype'])
                        text = this.json.EWS.labels.item[i]['@value'];
                }
                aux.legend.push({ img: this.CLASS_OBJTYPE.get(element['@otype']), text: text });
            } .bind(this));
            this.virtualHtml.down('div#' + this.applicationId + '_level4').update(getLegend(aux));
            this.legend = this.virtualHtml.down('div#' + this.applicationId + '_level4');
        }
    },
    /**
    *@param args {JSON} node contextual actions
    *@param ajaxId {String} node id and type
    *@description It fills the Balloon object with a node contextual actions links:
    *when clicking on each link (action) it will be fire the event this.applicationId+":action" 
    *containing the related action information (default: the action name) as 
    *the event sent parameters.
    */
    showActions: function(args, ajaxId) {
        var elementId = 'treeHandler_text_' + ajaxId.split('_')[0] + '_div_' + ajaxId.split('_')[2] + '_' + this.applicationId + '_level5_' + ajaxId.split('_')[1];
        var element = this.virtualHtml.down('span#' + elementId);
        var divChild = element.down('td.treeHandler_textSize').down();
        var divChildId = divChild.identify();
        var html = new Element('div');
        if (args && args.EWS && args.EWS.o_actions && args.EWS.o_actions.yglui_vie_tty_ac) {
            objectToArray(args.EWS.o_actions.yglui_vie_tty_ac).each(function(action) {
                var name = action['@actio'];
                var textAux = action['@actiot'];
                //var text = textAux.gsub('\\(\\(L\\)\\)', '');
                var text = textAux.gsub('((L))', '');
                var app = action['@tarap'];
                var okCode = action['@okcod'];
                var nodeId = ajaxId.split("_")[0];
                var nodeType = ajaxId.split('_')[1];
                var mode = action['@tarty'];
                var view = action['@views'];
                var span = new Element('div', { 'class': 'application_action_link genCat_balloon_span' }).insert(text);
                html.insert(span);
                span.observe('click', document.fire.bind(document, this.applicationId + ":action", $H({
                    name: name,
                    nodeId: nodeId,
                    application: app,
                    nodeType: nodeType,
                    okCode: okCode,
                    mode: mode,
                    view: view
                })));
            } .bind(this));
        } else {
            var span = new Element('div', { 'class': 'genCat_balloon_span' }).insert(global.getLabel('noActionsAvailable'));
            html.insert(span);
        }
        balloon.showOptions($H({
            domId: divChildId,
            content: html
        }));
    },
    /**     
    *@description It executes the code that belongs to the action clicked 
    */
    actionClicked: function(parameters) {
        var name = getArgs(parameters).get('name');
        var nodeId = getArgs(parameters).get('nodeId');
        var nextApp = getArgs(parameters).get('application');
        var nodeType = getArgs(parameters).get('nodeType');
        var okCode = getArgs(parameters).get('okCode');
        var mode = getArgs(parameters).get('mode');
        var view = getArgs(parameters).get('view');
        var date = (this.datePickerBeg).getActualDate().toString('yyyy-MM-dd')

        switch (name) {
            case 'OM_MASS_TRANSL': // mass translation
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    mode: mode
                }));
                balloon.hide();
                break;
            case 'OM_ORG_CREATE': // create an org unit
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: 'O',
                    displayMode: 'create',
                    okCode: okCode,
                    mode: mode
                }));
                balloon.hide();
                break;
            case 'OM_ORG_DEL': // delete an org unit
                this.deleteObject(nodeType, nodeId, name, '', global.getLabel('deleteObj'), okCode);
                balloon.hide();
                break;
            case 'OM_ORG_DELIMIT': // delimit an org unit
                this.genericDelete(nodeType, nodeId, name, '', global.getLabel('delimitObj'), okCode);
                balloon.hide();
                break;
            case 'OM_ORG_DISPLAY': // view org unit details
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: 'POPUP',
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: 'O',
                    displayMode: 'display',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'OM_ORG_EDIT': // edit an org unit
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    parentType: nodeType,
                    oType: 'O',
                    displayMode: 'edit',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'OM_CHANGE_ASS_O': // change assign
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    parentType: nodeType,
                    oType: 'O',
                    displayMode: 'edit',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'OM_ASSIGN_HOLDER': // assign holder
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    parentType: nodeType,
                    oType: 'S',
                    displayMode: 'create',
                    okCode: okCode,
                    mode: mode
                }));
                balloon.hide();
                break;
            case 'OM_ASSIGN_SUCC': // assign succesor
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    parentType: nodeType,
                    oType: 'S',
                    displayMode: 'edit',
                    okCode: okCode,
                    mode: mode
                }));
                balloon.hide();
                break;
            case 'OM_CHANGE_ASSIGN': // change assign
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    parentType: nodeType,
                    oType: 'S',
                    displayMode: 'edit',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'OM_POS_CREATE': // create position
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: 'S',
                    displayMode: 'create',
                    okCode: okCode,
                    mode: mode
                }));
                balloon.hide();
                break;
            case 'OM_POS_DEL': // delete a position
                this.deleteObject(nodeType, nodeId, name, '', global.getLabel('deleteObj'), okCode);
                balloon.hide();
                break;
            case 'OM_POS_DELIMIT': // delimit a position
                this.genericDelete(nodeType, nodeId, name, '', global.getLabel('delimitObj'), okCode);
                balloon.hide();
                break;
            case 'OM_POS_DISPLAY': // view position details
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: 'POPUP',
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: 'S',
                    displayMode: 'display',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'OM_POS_EDIT': // edit a position
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    parentType: nodeType,
                    oType: 'S',
                    displayMode: 'edit',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'OM_MGMT_ASSIGN': // manage holder assign
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    parentType: nodeType,
                    oType: 'S',
                    displayMode: 'edit',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'OM_PERSON_DISPLAY': // view person details
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: 'POPUP',
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: 'P',
                    displayMode: 'display',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            default:
                balloon.hide();
                break;
        }
    },
    reloadTree: function(parameters) {
        //hide links of Adv Search
        this.virtualHtml.down('div#advSearchLinks').hide();
        //get results from Adv. Search pop up        
        var objectHash = getArgs(parameters).get('employeesAdded');
        var args = $H({});
        if (objectHash.size() != 0) {
            var objectId, objectName, objectType;
            objectHash.each(function(pair) {
                objectId = pair[0];
                objectName = pair[1].name;
                objectType = pair[1].type;
            } .bind(this));
            //insert info about elements selected in Adv Search
            args.set('idAdded', objectId + '_' + objectType);
        } else {
            args.set('idAdded', '');
        }
        this.nodeSelected(args);
    },
    /**
    * @description Method that deletes a course type/group or curriculum type after the user confirmation
    */
    deleteObject: function(oType, objectId, actionId, appName, message, code) {
        var messageFrom;
        var genericDeleteHtml = "<div>"
                                   + "<div><span>" + message + "</span></div>"
                                   + "</div>";
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
                _this.deleteRequest(oType, objectId, actionId, appName, code);
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

    /**
    * @description Builds the xml and send it to SAP for the Delete request
    */
    deleteRequest: function(oType, objectId, actionId, appName, code) {
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
    *@description Stops maintainTree_standard
    */
    close: function($super) {
        $super();
        document.stopObserving(this.applicationId + ':action', this.actionClickedBinding);
        document.stopObserving('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
    }
});