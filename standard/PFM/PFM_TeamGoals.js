/**
 *@fileOverview PFM_IndividualDocs.js
 *@description It contains a class with functionality for managing indivuals documents.
 */
/**
 *@constructor
 *@description Class with functionality for indivuals documents.
 *@augments Application
 */
var PFM_TeamGoals = Class.create(GenericCatalog, {

    /**
    *@type Template
    *@description treeHandler nodes Template. Are set 
    * - children ('X' or '')  
    * - name
    * - id
    * - type
    * - plvar
    * by default.
    */
    templateNodes: new Template('<node childs="#{children}"><name>#{name}</name><id>#{id}_#{goalType}</id><type>#{type}</type><plvar>#{plvar}</plvar></node>'),
    /**
    *@type Template
    *@description treeHandler root node Template. Are set 
    * - children ('X' or '')  
    * - name
    * - id
    * - type
    * - plvar
    * by default.
    */
    templateRoot: new Template('<node childs="#{children}"><name>#{name}</name><id>#{id}_#{goalType}</id><type>#{type}</type><plvar>#{plvar}</plvar>'),

    returnHash: new Hash(),

    /**
    *@type Hash
    *@description Stores ids for tree node expansion
    */
    treeNodeHash: new Hash(),

    initialize: function($super, options) {
        $super(options, {
            containerParent: 'PFM_CCG',
            containerChild: options.appId,
            initialService: 'GET_GOALS_SET',
            getNodeChildrenService: 'GET_CAT_CHILD',
            searchService: 'GET_CAT_SEAR',
            searchedNodeSelectedService: 'GET_CAT_PAR',
            nodeClickedService: 'GET_CAT_ACTIO',
            applicationId: 'PFM_TeamGoals'
        });
        this.actionClickedBinding = this.actionClicked.bindAsEventListener(this);
        //document.observe("EWS:employeeSelected_PFM_ADMIN" + "single", this.onEmployeeSelectionChangeBinding);		
    },
    run: function($super, args) {
        $super(args);

        if (Object.isEmpty(args)) {
            this.arguments = false;
        }
        else {
            if (!Object.isEmpty(args.get('multiple'))) {
                this.arguments = true;
                this.checkBoxes = args.get('multiple');
                this.cont = args.get('cont');
                this.screen = args.get('screen');
                this.sec = args.get('sec');
            } else {
                this.arguments = false;
            }
        }
        document.observe(this.applicationId + ':action', this.actionClickedBinding);
    },
    setHTML: function(data) {
        this.json = data;
        this.data = this.handleData(data);
        this.virtualHtml.update("");
        this.virtualHtml.insert(
        //title removed after ivan's request (in order to show it again, just uncomment these lines)
        //"<div id='" + this.applicationId + "_level1' class='genCat_level1'></div>" +
					"<div style='clear:both'>&nbsp;</div>" +
					"<div id='" + this.applicationId + "_level2' style='display:none' class='genCat_level2'></div>" +
        //"<div id='" + this.applicationId + "_level3' class='genCat_level3'></div>" +
        //"<div id='" + this.applicationId + "_level4' class='genCat_level4'></div>" +
        //"<div class='genCat_backTop'>" +
					"<div style='display:none'>" +
        //					    "<span id='" + this.applicationId + "_backTop' class='application_action_link'>" + global.getLabel('Back to Top') + "</span>" +
						"<span id='" + this.applicationId + "_backTop' class='application_action_link'></span>" +
					"</div>" +
					"<div style='clear:both'></div>" +
					"<div id='" + this.applicationId + "_level5' class='genCat_level5'></div>" +
					"<div id='" + this.applicationId + "_level6' class='genCat_level6'>" +
					"</div>"


		);
        var json = {
            elements: []
        };
        var aux = {
            label: global.getLabel('add'),
            handlerContext: null,
            handler: this.returnSeveralGoals.bind(this),
            type: 'button',
            idButton: this.applicationId + '_buttonAdd',
            className: 'genCat_button',
            standardButton: true
        };
        json.elements.push(aux);
        var ButtonJobCatalog = new megaButtonDisplayer(json);
        this.virtualHtml.down('[id=' + this.applicationId + '_level6]').insert(ButtonJobCatalog.getButtons());
        if (!this.checkBoxes)
            this.virtualHtml.down('[id=' + this.applicationId + '_level6]').hide();
        this.setTitleDiv();
        this.setDatePickersDiv();
        this.setTreeDiv();
        this.trees.each(function(tree) {
            tree.value.expandNodeById(tree.key);
        } .bind(this));
    },

    /**     
    *@description It sets the fifth HTML level (the treeHandler one)
    */
    setTreeDiv: function() {
        this.data.each(function(element) {
            this.currentXMLs.set(element.key, stringToXML(this.buildTreeXml(element.value)));
            var auxDiv = new Element('div', { 'id': 'div_' + element.key + '_' + this.applicationId + '_level5' });
            this.virtualHtml.down('div#' + this.applicationId + '_level5').insert(auxDiv);
            var treeKey = this.treeNodeHash.get(element.key);
            this.trees.set(treeKey, new TreeHandler('div_' + element.key + '_' + this.applicationId + '_level5', this.currentXMLs.get(element.key), { checkBoxes: this.checkBoxes }));
        } .bind(this));
    },
    /**     
    *@description It sets the first HTML level 
    */
    setTitleDiv: function() {
        //title removed after ivan's request (in order to show it again, just uncomment these lines)
        /*
        this.title = new Element('span', { className: 'application_main_title' });
        this.virtualHtml.down('div#' + this.applicationId + '_level1').insert(this.title.update(global.getLabel('Job Catalogue - Mantain Mode')));
        */
    },
    /**     
    *@description It sets the third HTML level (the DatePickers one)
    */
    setDatePickersDiv: function() {
        this.datePickersLabel = new Element('span', { className: 'application_main_title3' });
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.datePickersLabel.update(global.getLabel('date')).wrap('div', { className: 'genCat_label' })); //this.data.datePickersLabel));	
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert("<div class='genCat_comp' id='" + this.applicationId + "_datePickers'>" +
																				"<div id='" + this.applicationId + "_datePickerBeg'></div>" +
																		  "</div>");
        var aux = { events: $H({ 'correctDay': 'EWS:' + this.applicationId + '_correctDay' }), defaultDate: objectToSap(new Date()).gsub('-', '') };
        this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
    },

    nodeClicked: function(args) {
        if (this.arguments) {
            if (!this.checkBoxes) {
                var params = getArgs(args);
                this.returnGoal(params);
            }
        }
        else {
            var aux = getArgs(args).get('nodeName') + '_' + getArgs(args).get('treeName').split('_')[0];
            var xml = "<EWS>" +
						"<SERVICE>" + this.nodeClickedService + "</SERVICE>" +
						"<OBJECT TYPE='" + aux.split('_')[2] + "'>" + aux.split('_')[0] + "</OBJECT>" +
						"<DEL></DEL>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							"<I_SCREEN>" + aux.split('_')[1] + "</I_SCREEN>" +
						"</PARAM>" +
				   "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'showActions', ajaxID: aux }));
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
        var elementId = 'treeHandler_text_' + ajaxId.split('_')[0] + '_' + ajaxId.split('_')[1] + '_div_' + ajaxId.split('_')[1] + '_' + this.applicationId + '_level5_' + ajaxId.split('_')[2];
        var element = this.virtualHtml.down('span#' + elementId);
        var divChild = element.down('td.treeHandler_textSize').down();
        var divChildId = divChild.identify();
        var html = new Element('div');
        if (args && args.EWS && args.EWS.o_actions && args.EWS.o_actions.yglui_vie_tty_ac) {
            objectToArray(args.EWS.o_actions.yglui_vie_tty_ac).each(function(action) {
                var name = action['@actio'];
                var text = action['@actiot'];
                var app = action['@tarap'];
                var okCode = action['@okcod'];
                var nodeId = ajaxId.split("_")[0];
                var nodeType = ajaxId.split('_')[2];
                var goalType = ajaxId.split('_')[1];
                var view = action['@views'];
                var tarty = action['@tarty'];
                var tartb = action['@tartb'];
                var disma = action['@disma'];
                var span = new Element('div', { 'class': 'application_action_link genCat_balloon_span' }).insert(text);
                html.insert(span);
                span.observe('click', document.fire.bind(document, this.applicationId + ":action", $H({
                    name: name,
                    nodeId: nodeId,
                    application: app,
                    nodeType: nodeType,
                    okCode: okCode,
                    goalType: goalType,
                    view: view,
                    tarty: tarty,
                    tartb: tartb,
                    disma: disma
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
                plvar: node.value['@plvar'],
                children: (node.value['@parnt'] && (node.value['@parnt'].toLowerCase() == 'x')) ? 'X' : '',
                parent: node.value['@group_id'],
                textName: node.value['@stext'],
                goalType: node.value['@goal_type']
            };
            this.nodes.set(aux.id, aux);
            aux.name = this.formatName(node.value['@stext'], node.value['@otype'])
            text += (node.value['@rootid']) ? this.templateNodes.evaluate(aux) : this.templateRoot.evaluate(aux);
            if (node.value['@rootid']) numberNoRoot++;
        } .bind(this));
        text += (json.size() == numberNoRoot) ? '</nodes>' : '</node></nodes>';
        return text;
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
        var goalType = getArgs(parameters).get('goalType');
        var tabId = getArgs(parameters).get('tartb');
        var view = getArgs(parameters).get('view');

        // Retrieve goal type for selected node		
        switch (name) {
            case 'APP_PFMTMGLCREATE': // create a goal
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'PFM_TeamGoals', objectId: nodeId, parentType: nodeType, oType: 'VJ', displayMode: 'create', okCode: okCode, goalType: goalType }));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'VJ',
                    parentType: nodeType,
                    displayMode: 'create',
                    okCode: okCode,
                    prevApp: 'PFM_TeamGoals',
                    goalType: goalType
                }));
                break;
            case 'APP_PFMTMGLVIEW': // view details of a goal
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'PFM_TeamGoals', objectId: nodeId, oType: 'O', parentType: nodeType, displayMode: 'display', okCode: okCode }));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'O',
                    parentType: nodeType,
                    displayMode: 'display',
                    okCode: okCode,
                    prevApp: 'PFM_TeamGoals'
                }));
                break;
            case 'APP_PFMTMGLEDIT': // edit the goal
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'PFM_TeamGoals', objectId: nodeId, oType: 'O', parentType: nodeType, displayMode: 'edit', okCode: okCode, goalType: goalType }));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'O',
                    parentType: nodeType,
                    displayMode: 'edit',
                    okCode: okCode,
                    prevApp: 'PFM_TeamGoals',
                    goalType: goalType
                }));
                break;
            case 'APP_PFMTMGLDEL': // edit the goal
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'PFM_TeamGoals', objectId: nodeId, oType: 'O', parentType: nodeType, displayMode: 'edit', okCode: okCode }));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'O',
                    parentType: nodeType,
                    displayMode: 'edit',
                    okCode: okCode,
                    prevApp: 'PFM_TeamGoals'
                }));
                break;
            default:
                balloon.hide();
                break;
        }
    },
    returnSeveralGoals: function() {
        for (var i = 0; i < this.trees.keys().length; i++) {
            var selected = this.trees.get(this.trees.keys()[i]).getSelected().keys();
            for (var j = 0; j < selected.length; j++) {
                var child = this.nodes.get(selected[j]);
                var parentId = child['parent'];
                if (Object.isEmpty(parentId)) {
                    parentId = '';
                    var parentName = '';
                    var parentType = '';
                }
                else {
                    var parent = this.nodes.get(parentId);
                    var parentName = parent['textName'];
                    var parentType = parent['type'];

                }
                var childId = child['id'];
                var childName = child['textName'];
                var childType = child['type'];
                this.returnHash.set(childId, {
                    childName: childName,
                    childType: childType,
                    parentId: parentId,
                    parentName: parentName,
                    parentType: parentType

                });
            }
        }
        if (this.returnHash.size() != 0) {
            document.fire('EWS:returnSelected', $H({ hash: this.returnHash, cont: this.cont, InScreen: this.widgetsFlag, sec: this.sec }));
        }
        this.popUpApplication.close();
        delete this.popUpApplication;
        this.close();

    },

    returnGoal: function(params) {
        var childId = params.get('nodeName').split('_')[0];
        var child = this.nodes.get(childId);
        var parentId = child['parent'];
        if (Object.isEmpty(parentId)) {
            parentId = '';
            var parentName = '';
            var parentType = '';
        }
        else {
            var parent = this.nodes.get(parentId);
            var parentName = parent['textName'];
            var parentType = child['type'];
        }
        var childName = child['textName'];
        var childType = child['type'];
        this.returnHash.set(childId, {
            childName: childName,
            childType: childType,
            parentId: parentId,
            parentName: parentName,
            parentType: parentType
        });
        document.fire('EWS:returnSelected', $H({ hash: this.returnHash, cont: this.cont, InScreen: this.screen, sec: this.sec }));
        this.popUpApplication.close();
        delete this.popUpApplication;
        this.close();
    },
    close: function($super) {
        $super();
        this.returnHash = new Hash();
        document.stopObserving(this.applicationId + ':action', this.actionClickedBinding);
    },
    handleData: function(data) {
        var structure = $H({});
        var nodes = null;
        if (data.EWS.o_children && data.EWS.o_children.yglui_str_parent_children_pfm) nodes = data.EWS.o_children.yglui_str_parent_children_pfm;
        if (data.EWS.o_root || data.EWS.o_parent) {
            if (data.EWS.o_root)
                objectToArray(data.EWS.o_root.yglui_str_parent_children_pfm).each(function(node) {
                    structure.set(node['@group_id'], $H({}));
                    structure.get(node['@group_id']).set(node['@objid'], node);
                    this.treeNodeHash.set(node['@group_id'], node['@objid'] + "_" + node['@goal_type']);
                } .bind(this));
            else
                [data.EWS.o_parent].each(function(node) {
                    structure.set(node['@group_id'], $H({}));
                    structure.get(node['@group_id']).set(node['@objid'], node);
                    this.treeNodeHash.set(node['@group_id'], node['@objid'] + "_" + node['@goal_type']);
                } .bind(this));

            structure.each(function(root) {
                if (nodes) {
                    objectToArray(nodes).each(function(nd) {
                        if (nd['@group_id'] == root.key) {
                            structure.get(root.key).set(nd['@objid'], nd);
                        }
                    }
					.bind(this));
                }
            } .bind(this));
        } else {

            objectToArray(nodes).each(function(nd) {
                structure.set(nd['@objid'], nd);
            } .bind(this));
        }
        return structure;
    },
    /**     
    *@param results {JSON} search service results list
    *@description It fills the autocompleter with the search service results list.
    */
    showList: function(results) {
        //this.autoCompleter.stopLoading();
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: 'No results found',
                    search: 'Search'
                }
            }
        };
        if (results && results.EWS && results.EWS.o_objects && results.EWS.o_objects.yglui_str_parent_children) {
            objectToArray(results.EWS.o_objects.yglui_str_parent_children).each(function(node) {
                json.autocompleter.object.push({ text: node['@stext'], data: node['@objid'] + '_' + node['@otype'] });
            } .bind(this));
        }
        this.autoCompleter.updateInput(json);
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
                tree.value.expandNodeById(data.EWS.o_parent['@objid'] + "_" + data.EWS.o_parent['@goal_type']);
            } .bind(this));
        } else if (!Object.isEmpty(data) && !Object.isEmpty(data.EWS) && !Object.isEmpty(data.EWS.o_root)) {
            if (Object.isEmpty(type) || !Object.isString(type)) {
                this.trees.each(function(tree) {
                    objectToArray(data.EWS.o_root.yglui_str_parent_children).each(function(root) {
                        tree.value.expandNodeById(root['@objid'] + "_" + root['@goal_type']);
                    } .bind(this));
                } .bind(this));
            }
            else {
                this.trees.get(type).expandNodeById(type);
            }
        }
    },

    /*
    * @method onEmployeeSelected
    * @param args {Object} object that has the information about the user selected
    * @desc we get the id of the user selected and we call to load the documents
    */
    onEmployeeSelected: function(args) {
        this.empId = args.id;
        this.getInitialData();
    },

    /**     
    *@description Initial service which gets the labels and root node context to be shown
    *on the treeHandler.
    */
    getInitialData: function() {
        //call to sap 
        if (this.empId) {
            var employee = this.empId;
            //        else
            //            var employee = "";

            var xml = "<EWS>" +
							    "<SERVICE>" + this.initialService + "</SERVICE>" +
							    "<OBJECT TYPE='P'>" + employee + "</OBJECT>" +
							    "<PARAM>" +
								    "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
								    "<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
            //"<CONTAINER_PARENT>PFM_CCG</CONTAINER_PARENT>" +
            //"<CONTAINER_CHILD>PFM_CCG</CONTAINER_CHILD>" +
								    "<DATUM>" + objectToSap(new Date()) + "</DATUM>" +
							    "</PARAM>" +
					       "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'setHTML' }));
        }
    }
});
