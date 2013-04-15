/** 
* @fileOverview WhoIsWho.js 
* @description File containing class WhoIsWho. 
* Application for Who is Who coverflow.
*/
/**
*@constructor
*@description Class WhoIsWho
*@augments Application 
*/
var WhoIsWho = Class.create(Application, {
    getWiWService: 'GET_WIW_FLOW2',
    initialService: 'GET_CAT_ROOTS',
    getNodeChildrenService: 'GET_CAT_CHILD',
    advSearchLinksService: 'GET_MSHLP',
    hashOfButtons: $H(),
    linksLoaded: false,
    noPicture: 'user.jpg',
    infoChanged: false,

    containerParent: 'OM_WIW',
    containerChild: 'OM_WIW',
    trees: $H({}),
    checkBoxes: true,
    json: null,
    data: null,
    root: {},
    nodes: null,
    currentXMLs: null,
    templateNodes: new Template('<node childs="#{children}"><name>#{name}</name><id>#{id}</id><type>#{type}</type><plvar>#{plvar}</plvar><select>#{select}</select><checkRoot>#{checkRoot}</checkRoot></node>'),
    templateRoot: new Template('<node childs="#{children}"><name>#{name}</name><id>#{id}</id><type>#{type}</type><plvar>#{plvar}</plvar><select>#{select}</select><checkRoot>#{checkRoot}</checkRoot>'),
    applicationId: '',
    CLASS_OBJTYPE: $H({
        O: 'applicationOM_folder',
        S: 'applicationOM_person',
        P: 'applicationOM_manager'

    }),
    showLink: '',
    treeLoaded: '',
    returnHash: null,
    noResults: false,

    /**
    *Constructor of the class WhoIsWho
    */
    initialize: function($super, args) {
        $super(args);
        this.applicationId = getArgs(args).appId;
        //autocompleter events
        this.nodeSearchBinding = this.nodeSearch.bindAsEventListener(this);
        this.nodeSelectedBinding = this.nodeSelected.bindAsEventListener(this);
        this.employeeSelectedAdvSearchBinding = this.reloadFlow.bindAsEventListener(this);
        //tree
        this.nodes = $H({});
        this.trees = $H({});
        this.currentXMLs = $H({});
        this.returnHash = $H({});
        this.getChildrenBinding = this.nodeChildren.bindAsEventListener(this);
    },
    /**
    *@description Starts WhoIsWho
    */
    run: function($super, args) {
        $super(args);
        this.applicationId = args.get('app').appId;
        if (this.firstRun) {
            this.getData();
        }
        //autocompleter events
        document.observe(this.applicationId + ':nodeSearch', this.nodeSearchBinding);
        document.observe(this.applicationId + ':nodeSelected', this.nodeSelectedBinding);
        document.observe('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
        //tree
        document.observe("EWS:treeHandler_GiveMeXml", this.getChildrenBinding);
    },
    /**     
    *@description It calls sap to get information 
    */
    getData: function() {
        //call to sap 
        var xml = "<EWS>" +
                        "<SERVICE>" + this.getWiWService + "</SERVICE>" +
                        "<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>" +
                        "<PARAM>" +
                            "<APPID>" + this.applicationId + "</APPID>" +
                            "<WID_SCREEN>*</WID_SCREEN>" +
                        "</PARAM>" +
                   "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'processData' }));
    },
    /**     
    *@description It processes info from sap
    */
    processData: function(json) {
        //initialize global variables
        this.showLink = true;
        this.treeLoaded = false;
        //create html structure
        this.createHtml();
        //show "back to root" link if the info is not initial information
        if (this.infoChanged) {
            this.virtualHtml.down('span#' + this.applicationId + '_backTop').show();
        }
        //save the json/picture for each employee
        this.jsonForEmployee(json);
        //draw coverflow with info
        this.drawingCoverflow();
    },
    /**     
    *@description It draws html structure
    */
    createHtml: function() {
        this.virtualHtml.update("");
        var html = "<div id='" + this.applicationId + "_autocompleterDiv' class='whoiswho_autocompleterDiv'></div>" +
                   "<div id='" + this.applicationId + "_level5' class='whoiswho_treeDiv'></div>" +
                   "<div class='whoiswho_backTop'>" +
				            "<span id='" + this.applicationId + "_backTop' class='application_action_link fieldDispFloatLeft'>" + global.getLabel("myTeam") + "</span>" +
				   "</div>" +
				   "<div id='" + this.applicationId + "_noResult'>" + global.getLabel('noresults') + "</div>" +
                   "<div id='whoIsWho_coverFlowContainer' class='whoiswho_containerDiv'>" +
                           "<div id='covFlow' class='whoiswho_coverflowDiv'></div>" +
                   "</div>" +
                   "<div id='details' class='whoiswho_detailsDiv'></div>";
        this.virtualHtml.insert(html);
        //event 'back to top' link     
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').observe('click', function() {
            this.backTop();
        } .bind(this));
        //hide 'Back to top' link
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
        this.virtualHtml.down('div#' + this.applicationId + '_noResult').hide();
        //draw autocompleter
        this.setAutoCompleterDiv();
        //draw show tree link
        this.showTreeDiv = "<div class='fieldDispFloatLeft whoiswho_showTreeDiv'><span id='" + this.applicationId + "_catalogLink' class='application_action_link'>" + global.getLabel("Show Org. Tree") + "</span></div>";
        this.virtualHtml.down('div#' + this.applicationId + "_autocompleterDiv").insert(this.showTreeDiv);
        // event catalog link
        this.virtualHtml.down('span#' + this.applicationId + '_catalogLink').observe('click', function() {
            this.showTree();
        } .bind(this));
        //Advanced Search
        this.advancedSearchDiv = new Element('div', { id: this.applicationId + '_advancedSearch', className: 'fieldDispFloatRight whoiswho_advSearchDiv' });
        //PROVISIONAL SOLUTION: links in tree
        this.virtualHtml.down('div#' + this.applicationId + "_autocompleterDiv").insert(this.advancedSearchDiv);
        var advancedSearchButton = new Element("div", { "class": "application_handCursor" }).insert(new Element("div", {
            "class": "application_catalog_image application_catalog_image_AS"
        }).insert("&nbsp")).insert(new Element("div", {
            "class": "as_button"
        }).insert(global.getLabel('SRC_OV'))).observe("click", this.getAdvSearchlinks.bind(this));
        var advancedSearchLinks = new Element("div", { "id": "advSearchLinks", "class": "advSearchLink" });
        this.advancedSearchDiv.insert(advancedSearchButton);
        this.advancedSearchDiv.insert(advancedSearchLinks);
        this.virtualHtml.down('div#advSearchLinks').hide();
        //hide tree div
        this.virtualHtml.down('div#' + this.applicationId + '_level5').hide();
    },
    /**     
    *@description It stores information from sap
    */
    jsonForEmployee: function(json) {
        //initializing variables to save information about details
        var settingsHash = new Hash();
        var settingsScreensHash = new Hash();
        var valuesHash = new Hash();
        var valuesScreensHash = new Hash();
        this.hashOfJson = new Hash();
        this.hashOfEmployees = new Hash();
        //initializing variables to save information about pictures
        this.hashOfPictures = new Hash();
        //get the field_values for each object
        var idObject, screen;
        this.values = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
        //number of records
        this.numberOfEmployees = this.values.length;
        var previousObjectValue = this.values[0].hrobject["@objid"];
        var j = 0;
        for (var i = 0; i < this.numberOfEmployees; i++) {
            idObject = this.values[i].hrobject["@objid"];
            if (idObject == previousObjectValue) {
                screen = this.values[i]["@screen"];
                valuesScreensHash.set(j, this.values[i]);
                j++;
            } else {
                valuesHash.set(previousObjectValue, valuesScreensHash);
                previousObjectValue = idObject;
                valuesScreensHash = new Hash();
                j = 0;
                screen = this.values[i]["@screen"];
                valuesScreensHash.set(j, this.values[i]);
                j++;
            }
        }
        valuesHash.set(previousObjectValue, valuesScreensHash);
        //get the field_setting for each object
        var idObject, screen;
        var settings = json.EWS.o_field_settings.yglui_str_wid_fs_record;
        //build the json for each object
        var jsonObject, objectType, object, picture, idEmployee, nameEmployee, dataList, datalistSize;
        //build json for objects
        for (var i = 0; i < this.numberOfEmployees; i++) {
            object = this.values[i].hrobject['@objid'];
            if (valuesHash.get(object)) {
                jsonObject = { o_field_settings: { yglui_str_wid_fs_record: settings },
                    o_field_values: { yglui_str_wid_record: valuesHash.get(object).values() },
                    o_widget_screens: { yglui_str_wid_screen: json.EWS.o_widget_screens.yglui_str_wid_screen },
                    o_screen_buttons: json.EWS.o_screen_buttons,
                    o_widget_screens: json.EWS.o_widget_screens,
                    labels: json.EWS.labels
                };
                dataList = objectToArray(valuesHash.get(object)._object[0].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                datalistSize = dataList.size();
                for (var j = 0; j < datalistSize; j++) {
                    if (dataList[j]['@fieldid'] == 'PICTURE') {
                        picture = dataList[j]['@value'];
                        if (Object.isEmpty(dataList[j]['@value']))
                            picture = this.noPicture;
                    } else if (dataList[j]['@fieldid'] == 'PERNR') {
                        idEmployee = dataList[j]['@value'];
                        nameEmployee = dataList[j]['#text'];
                    }
                }
            } else {
                jsonObject = "";
            }
            jsonObject = { EWS: jsonObject };
            this.hashOfJson.set(object, jsonObject);
            this.hashOfPictures.set(object, picture);
            this.hashOfEmployees.set(idEmployee, nameEmployee);
        };
    },
    /**     
    *@description It draws coverflow
    */
    drawingCoverflow: function() {
        //remove old coverflow if exists
        if (this.virtualHtml.down('div#covFlow'))
            this.virtualHtml.down('div#covFlow').update("");
        //build structure for pictures
        var items = [];
        var aux, idObject, label;
        for (var i = 0; i < this.numberOfEmployees; i++) {
            idObject = this.values[i].hrobject["@objid"];
            label = '';
            aux = { id: this.hashOfPictures.get(idObject), label: label, thumbnail: this.hashOfPictures.get(idObject) };
            items[i] = aux;
        };
        this.employeePosition = 0;
        cFlow2.create(this, "covFlow", items, 0.75, 0.15, 1.8, 10, 8, 4);
        //initializing variable of picture selected
        this.itemSelected = 0;
    },
    /**     
    *@description It sets the autocompleter structure 
    */
    setAutoCompleterDiv: function() {
        this.virtualHtml.down('div#' + this.applicationId + '_autocompleterDiv').insert("<div id='" + this.applicationId + "_autocompleter'></div>");
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
            templateOptionsList: '#{text}',
            templateResult: '#{text}',
            maxShown: 20,
            minChars: 1
        }, json);
    },
    /**     
    *@description It gets a search node results list.
    */
    nodeSearch: function(args) {
        if (getArgs(args).idAutocompleter == this.applicationId + '_autocompleter') {
            var json = {
                autocompleter: {
                    object: [],
                    multilanguage: {
                        no_results: global.getLabel('noresults'),
                        search: global.getLabel('search')
                    }
                }
            };
            if (!this.noResults) {
                //read values to fill autocompleter list from hash
                var text, id;
                var hashOfEmployeesSize = this.hashOfEmployees.size();
                for (var i = 0; i < hashOfEmployeesSize; i++) {
                    id = this.hashOfEmployees.keys()[i];
                    text = this.hashOfEmployees.get(id);
                    data = id + '_' + i;
                    json.autocompleter.object.push({ text: text, data: data });
                }
            }
            this.autoCompleter.updateInput(json);
        }
    },
    /**     
    *@param args {Event} event thrown by the autoCompleter when a node has been selected from 
    *its search results list.
    *@description It reload information for selected employee.
    */
    nodeSelected: function(args) {
        if (!getArgs(args).isEmpty) {
            if (getArgs(args).idAdded || getArgs(args).get('idAdded')) {
                var idArg = getArgs(args).idAdded ? getArgs(args).idAdded : getArgs(args).get('idAdded');
                if (!Object.isEmpty(idArg)) {
                    var id = idArg.split('_')[0];
                    var N = idArg.split('_')[1];
                    // show employee selected in autocompleter
                    cFlow2.update(this.hashOfPictures.get(id), N);
                    //clean autocompleter 
                    this.autoCompleter.clearInput();
                }
            }
        }
    },
    /**     
    *@description It gets links of Advanced Search from sap the first time
    */
    getAdvSearchlinks: function() {
        var xml = "<EWS>"
                      + "<SERVICE>" + this.advSearchLinksService + "</SERVICE>"
                      + "<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>"
                      + "<PARAM>"
                        + "<APPID>" + this.applicationId + "</APPID>"
                      + "</PARAM>"
                  + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'setAdvSearchlinks' }));
    },
    /**     
    *@description It draws links and defines functinality for each button
    */
    setAdvSearchlinks: function(json) {
        // get info about links
        if (json.EWS.o_tabs.yglui_str_madv_tab) {
            this.buttonsAnswer = objectToArray(json.EWS.o_tabs.yglui_str_madv_tab);
            this.numberOfLinks = this.buttonsAnswer.length;
            var seqnr = this.buttonsAnswer[0]['@seqnr'];
            this.hashOfButtons.set(seqnr, {
                appId: this.buttonsAnswer[0]['@appid'],
                label_tag: this.buttonsAnswer[0]['@label_tag'],
                sadv_id: this.buttonsAnswer[0]['@sadv_id']
            });
            this.openNavApp(seqnr);
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
            multiple: true,
            addToMenu: false
        }));
    },
    /**     
    *@description It gets parameter selecetd in Adv Search and reloads coverflow.
    */
    reloadFlow: function(parameters) {
        //get results from Adv. Search pop up
        var objectHash = getArgs(parameters).get('employeesAdded');
        if (objectHash.size() != 0) {
            var objectId, objectName, objectType;
            objectHash.each(function(pair) {
                objectId = pair[0];
                objectName = pair[1].name;
                objectType = pair[1].type;
            } .bind(this));
            //update variable to control that info shown has changed (from Adv Search)
            this.infoChanged = true;
            //call to sap to get info for reloading coverflow
            var xml = "";
            xml += "<EWS>" +
                            "<SERVICE>" + this.getWiWService + "</SERVICE>" +
                            "<PARAM>" +
                                "<APPID>" + this.applicationId + "</APPID>" +
                                "<WID_SCREEN>*</WID_SCREEN>" +
                                "<PERNR_LIST>"
            objectHash.each(function(pair) {
                objectId = pair[0];
                xml += "<YGLUI_STR_HROBJECT OTYPE='P' OBJID='" + objectId + "'/>";
            } .bind(this));
            xml += "</PERNR_LIST>" +
                    "</PARAM>" +
                    "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'processData' }));
        }
    },
    /**     
    *@description Calls sap to get initial data
    */
    backTop: function() {
        //call sap with the first service to get first data to show
        this.getData();
        //hide 'Back to Top' link
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
        //updating variable
        this.infoChanged = false;
    },
    /**     
    *@description Calls sap to get initial data
    */
    showTree: function() {
        if (this.showLink) {
            //update label of link
            this.virtualHtml.down('span#' + this.applicationId + '_catalogLink').update(global.getLabel("Hide Org. Tree"));
            if (!this.treeLoaded) {
                //call sap to get info about the tree to show
                this.getInitialTreeData();
            }
            //update variable
            this.showLink = false;
            //show the tree
            this.virtualHtml.down('div#' + this.applicationId + '_level5').show();

        } else {
            //update label of link
            this.virtualHtml.down('span#' + this.applicationId + '_catalogLink').update(global.getLabel("Show Org. Tree"));
            //hide the tree
            this.virtualHtml.down('div#' + this.applicationId + '_level5').hide();
            //update variable
            this.showLink = true;
        }
    },
    /**     
    *@description Initial service which gets the labels and root node context to be shown
    *on the treeHandler.
    */
    getInitialTreeData: function() {
        var xml = "<EWS>" +
						"<SERVICE>" + this.initialService + "</SERVICE>" +
						"<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							"<DATUM>" + objectToSap(new Date()) + "</DATUM>" +
						"</PARAM>" +
				   "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'setTreeDiv' }));
    },
    /**     
    *@description It sets the HTML structure (the treeHandler)
    */
    setTreeDiv: function(data) {
        this.treeLoaded = true;
        this.json = data;
        this.data = this.handleData(data);
        this.data.each(function(element) {
            this.currentXMLs.set(element.key, stringToXML(this.buildTreeXml(element.value)));
            var auxDiv = new Element('div', { 'id': 'div_' + element.key + '_' + this.applicationId + '_level5' });
            this.virtualHtml.down('div#' + this.applicationId + '_level5').insert(auxDiv);
            this.trees.set(element.key, new TreeHandler('div_' + element.key + '_' + this.applicationId + '_level5', this.currentXMLs.get(element.key), { checkBoxes: this.checkBoxes }));
        } .bind(this));
        this.trees.each(function(tree) {
            tree.value.expandNodeById(tree.key);
        } .bind(this));
        //refresh button
        this.refreshButton = "<div class='fieldDispFloatRight'><span id='" + this.applicationId + "_refreshButton' class='application_action_link'>" + global.getLabel("refresh") + "</span></div>";
        this.virtualHtml.down('div#' + this.applicationId + '_level5').insert(this.refreshButton);
        this.virtualHtml.down('span#' + this.applicationId + '_refreshButton').observe('click', function() {
            this.refreshFlow();
        } .bind(this));
    },
    /**     
    *@description It builds json structure of the tree
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
                parent: node.value['@rootid'],
                select: (Object.isEmpty(node.value['@select'])) ? "" : node.value['@select'],
                textName: node.value['@stext'],
                checkRoot: node.value['@select_root']
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
    *@description It builds right structure of json (method for catalog part)
    */
    handleData: function(data) {
        var structure = $H({});
        if (!Object.isEmpty(data.EWS.o_children))
            var nodes = data.EWS.o_children.yglui_str_parent_children;
        if (data.EWS.o_root || data.EWS.o_parent) {
            if (data.EWS.o_root) {
                this.rootId = data.EWS.o_root.yglui_str_parent_children['@objid'];
                objectToArray(data.EWS.o_root.yglui_str_parent_children).each(function(node) {
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
    *@description It gets a node the list of children.
    */
    nodeChildren: function(args) {
        var aux = this.nodes.get(getArgs(args).split('_')[1]);
        var xml = "<EWS>" +
						"<SERVICE>" + this.getNodeChildrenService + "</SERVICE>" +
						"<OBJECT TYPE='" + aux.type + "'>" + aux.id + "</OBJECT>" +
						"<DEL></DEL>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							"<DATUM>" + objectToSap(new Date()) + "</DATUM>" +
						"</PARAM>" +
				   "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'expandNode', ajaxID: aux.id }));
    },
    /**     
    *@param name {String} node name
    *@param otype {String} node type
    *@description It formats a node name so as to be properly shown on the treeHandler (method for catalog part)
    *(assigning it the correct className --> to show the proper tree icon)
    */
    formatName: function(name, otype) {
        return "<![CDATA[<table class='genCat_alignSpanInTree'>]]>" +
	            "<![CDATA[<tr><td class='treeHandler_iconSize'><div class='treeHandler_text_node_content " + this.CLASS_OBJTYPE.get(otype) + " genCat_iconInTree'></div></td>]]>" +
                "<![CDATA[<td class='treeHandler_textSize'><span class='treeHandler_text_node_content'>" + name + "</span></tr><tr><td class='genCat_additionalInfo' colspan='2'></td><td></td></tr></table>]]>";
    },
    /**     
    *@param json {JSON} node children data got from SAP
    *@param ajaxId {String} node id
    *@description It expands a node in the treeHandler, showing its children (method for catalog part)
    */
    expandNode: function(json, ajaxId) {
        var auxXml = (this.currentXMLs.get(ajaxId)) ? this.currentXMLs.get(ajaxId) : this.currentXMLs.get(this.getRoot(ajaxId));
        var parentNode = selectSingleNodeCrossBrowser(auxXml, "/nodes//node[id='" + ajaxId + "']");
        var xml = stringToXML(this.buildTreeXml(this.handleData(json)));
        var children = selectNodesCrossBrowser(xml, "/nodes//node");
        for (var i = 0; i < children.length; i++) {
            var aux = children[i].cloneNode(true);
            parentNode.appendChild(aux);
        }
        var root = (this.nodes.get(this.getRoot(ajaxId)).id) ? this.nodes.get(this.getRoot(ajaxId)).id : ajaxId;
        var clickOn = 'div_' + ajaxId + '_div_' + root + '_' + this.applicationId + '_level5';
        document.fire('EWS:treeHandler_GiveMeXml_done', {
            xml: xml,
            clicked: clickOn
        });
    },
    /**     
    *@description It returns id of root node (method for catalog part).
    */
    getRoot: function(id) {
        if (this.nodes.get(id).parent) {
            return this.getRoot(this.nodes.get(id).parent);
        } else {
            return id;
        }
    },
    /**     
    *@description It gets objects checked in tree and reloads coverflow.
    */
    refreshFlow: function() {
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
        //update variable to control that info shown has changed (from Adv Search)
        this.infoChanged = true;
        //call to sap to get info for reloading coverflow
        var xml = "";
        var objectId, objectType;
        xml += "<EWS>" +
                        "<SERVICE>" + this.getWiWService + "</SERVICE>" +
                        "<PARAM>" +
                            "<APPID>" + this.applicationId + "</APPID>" +
                            "<WID_SCREEN>*</WID_SCREEN>" +
                            "<ORG_UNITS_LIST>"
        this.returnHash.each(function(pair) {
            objectId = pair[0];
            objectType = pair[1].childType;
            xml += "<YGLUI_STR_HROBJECT OTYPE='" + objectType + "' OBJID='" + objectId + "'/>";
        } .bind(this));
        xml += "</ORG_UNITS_LIST>" +
                "</PARAM>" +
                "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'drawRefreshFlow' }));
    },
    /**     
    *@description It processes info from sap
    */
    drawRefreshFlow: function(json) {
        //removing hash with objects selected in tree
        this.returnHash = $H({});
        if (json.EWS.o_field_values) {
            if (this.virtualHtml.down('div#whoIsWho_coverFlowContainer'))
                this.virtualHtml.down('div#whoIsWho_coverFlowContainer').show();
            if (this.virtualHtml.down('div#details'))
                this.virtualHtml.down('div#details').show();
            this.virtualHtml.down('div#' + this.applicationId + '_noResult').hide();
            this.noResults = false;
            //save the json/picture for each employee
            this.jsonForEmployee(json);
            //draw coverflow with info
            this.drawingCoverflow();
        } else {
            //show message no results
            if (this.virtualHtml.down('div#whoIsWho_coverFlowContainer'))
                this.virtualHtml.down('div#whoIsWho_coverFlowContainer').hide();
            if (this.virtualHtml.down('div#details'))
                this.virtualHtml.down('div#details').hide();
            this.virtualHtml.down('div#' + this.applicationId + '_noResult').show();
            this.noResults = true;
        }
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
        document.stopObserving(this.applicationId + ':nodeSearch', this.nodeSearchBinding);
        document.stopObserving(this.applicationId + ':nodeSelected', this.nodeSelectedBinding);
        document.stopObserving('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
        //tree
        document.stopObserving("EWS:treeHandler_GiveMeXml", this.getChildrenBinding);
    }
});