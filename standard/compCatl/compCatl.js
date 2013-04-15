var COMPCATL = Class.create(GenericCatalog, {

    getCatSessionsService: 'GET_CATSESSION',
    /*
    *@method initialize
    *@param $super: the superclass: GenericCatalog
    *@desc instantiates the app
    */
    returnHash: new Hash(),

    getContentService: 'GET_CONTENT',
    initialize: function($super, args) {
        $super(args, {
            containerParent: 'PFM_CCG',
            containerChild: args.appId,
            initialService: 'GET_CAT_ROOTS',
            getNodeChildrenService: 'GET_CAT_CHILD',
            searchService: 'GET_CAT_SEAR',
            searchedNodeSelectedService: 'GET_CAT_PAR',
            nodeClickedService: 'GET_CAT_ACTIO',
            applicationId: args.className
        });
        this.action = this.actionClicked.bindAsEventListener(this);
    },

    /*
    *@method run
    *@param $super: the superclass: GenericCatalog
    * which have changed.
    */
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
        document.observe(this.applicationId + ':action', this.action);
    },
    close: function($super) {
        $super();
        document.stopObserving(this.applicationId + ':action', this.action);
        document.stopObserving(this.applicationId + ':nodeSelected', this.resultSelected);

        this.returnHash = new Hash();
    },
    setHTML: function(data) {
        this.json = data;
        this.data = this.handleData(data);

        this.virtualHtml.update(
			        "<div id='" + this.applicationId + "_level1' class='genCat_level1'></div>" +
					"<div id='" + this.applicationId + "_level2' class='genCat_level2'></div>" +
					"<div id='" + this.applicationId + "_level3' class='genCat_level3'></div>" +
					"<div id='" + this.applicationId + "_level4' class='genCat_level4'></div>" +
					"<div class='genCat_backTop'>" +
					    "<span id='" + this.applicationId + "_backTop' class='application_action_link'>" + global.getLabel('Back to Top') + "</span>" +
					"</div>" +
					"<div style='clear:both'>&nbsp;</div>" +
					"<div id='" + this.applicationId + "_level5' class='genCat_level5'></div>" +
					"<div id='" + this.applicationId + "_level6' class='genCat_level6'>" +
        //"<input id='" + this.applicationId + "_buttonAdd' type='button' value=" + global.getLabel('add') + " class='genCat_button'>" +
					"</div>"
		);
        var json = {
            elements: []
        };
        var aux = {
            label: global.getLabel('add'),
            handlerContext: null,
            handler: this.returnSeveralCourses.bind(this),
            idButton: this.applicationId + "_buttonAdd",
            className: 'genCat_button',
            type: 'button',
            standardButton: true
        };
        json.elements.push(aux);
        var ButtonCompCatl = new megaButtonDisplayer(json);
        this.virtualHtml.down('div#' + this.applicationId + '_level6').insert(ButtonCompCatl.getButtons());
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
        if (!this.checkBoxes)
            this.virtualHtml.down('div#' + this.applicationId + '_level6').hide();
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').observe('click', function() {
            this.backTop();
        } .bind(this));
        this.setTitleDiv();
        this.setAutoCompleterDiv();
        this.setDatePickersDiv();
        this.setLegendDiv();
        this.setTreeDiv();
        this.trees.each(function(tree) {
            tree.value.expandNodeById(tree.key);
        } .bind(this));
    },

    setTitleDiv: function() {
        this.title = new Element('span', { className: 'application_main_title' });
        this.virtualHtml.down('div#' + this.applicationId + '_level1').insert(this.title.update(global.getLabel('compCatalogTitle'))); //this.data.title));		
    },

    setLegendDiv: function() {
        var aux = new Object();
        var text = '';
        aux.legend = [];
        aux.showLabel = global.getLabel('showLegend');
        aux.hideLabel = global.getLabel('hideLegend');
        this.json.EWS.o_legend.item.each(function(element) {
            for (i = 0; i < this.json.EWS.labels.item.length; i++) {
                if (this.json.EWS.labels.item[i]['@id'] == element['@otype'])
                    text = this.json.EWS.labels.item[i]['@value'];
            }
            aux.legend.push({ img: this.CLASS_OBJTYPE.get(element['@otype']), text: text });
        } .bind(this));
        this.virtualHtml.down('div#' + this.applicationId + '_level4').update(getLegend(aux));
        this.legend = this.virtualHtml.down('div#' + this.applicationId + '_level4');
    },

    setDatePickersDiv: function() {
        this.datePickersLabel = new Element('span', { className: 'application_main_title3' });
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.datePickersLabel.update(global.getLabel('date')).wrap('div', { className: 'genCat_label' })); //this.data.datePickersLabel));	
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert("<div class='genCat_comp' id='" + this.applicationId + "_datePickers'>" +
																				"<div id='" + this.applicationId + "_datePickerBeg'></div>" +
																		  "</div>");
        var aux = { defaultDate: objectToSap(new Date()).gsub('-', ''), events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' }) };
        this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
        this.setAutoCompleterLabel(global.getLabel('goto'));
        var elements = this.virtualHtml.select('.genCat_comp');
        for (var i = 0; i < elements.length; i++) {
            elements[i].addClassName('comp_catl_elemnts');
        }
    },

    nodeClicked: function(args) {
        if (this.arguments) {
            if (!this.checkBoxes) {
                var params = getArgs(args);
                this.returnCourse(params);
            }
        }
        else {
            var aux = getArgs(args).get('nodeName') + '_' + getArgs(args).get('treeName').split('_')[1];
            var xml = "<EWS>" +
						"<SERVICE>" + this.nodeClickedService + "</SERVICE>" +
						"<OBJECT TYPE='" + aux.split('_')[1] + "'>" + aux.split('_')[0] + "</OBJECT>" +
						"<DEL></DEL>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
						"</PARAM>" +
				   "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'showActions', ajaxID: aux }));
        }

    },

    returnSeveralCourses: function() {
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
            document.fire('EWS:returnSelected', $H({ hash: this.returnHash, cont: this.cont, InScreen: this.screen, sec: this.sec }));
        }
        this.popUpApplication.close();
        delete this.popUpApplication;
        this.close();        
     
    },

    actionClicked: function(parameters) {
        var name = getArgs(parameters).get('name');
        var nodeId = getArgs(parameters).get('nodeId');
        this.nodeId = nodeId;
        var nextApp = getArgs(parameters).get('application');
        var nodeType = getArgs(parameters).get('nodeType');
        var okCode = getArgs(parameters).get('okCode');
        //when sap sends it
        //var tabId = getArgs(parameters).get('tartb');
        //var view = getArgs(parameters).get('view');
        //in the meanwhile
        var tabId = this.options.tabId;
        var view = '';
        switch (name) {
            case 'CQK_ADD_COMP': //add Competency
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'COMPCATL', objectId: nodeId, oType: 'Q', parentType: nodeType, displayMode: 'create', okCode: okCode }));
                balloon.hide();
                global.open($H({
                    app: {
                       appId: nextApp, //"CQK_QUAL"
                       tabId: tabId,
                       view: 'COMP_CATL_AC' //COMP_CATL_AC
                    },
                    prevApp: 'COMPCATL', 
                    objectId: nodeId, 
                    oType: 'Q', 
                    parentType: nodeType,
                    displayMode: 'create',
                    okCode: okCode
                }));                 
                break;
            case 'CQK_ADD_COMP_GROUP': //add Competency group
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'COMPCATL', objectId: nodeId, oType: 'QK', parentType: nodeType, displayMode: 'create', okCode: okCode }));
                balloon.hide();
                global.open($H({
                    app: {
                       appId: nextApp, //'CQK_GRP'
                       tabId: tabId,
                       view: 'COMP_CATL_ACG' // 'COMP_CATL_ACG'
                    },
                    prevApp: 'COMPCATL', 
                    objectId: nodeId, 
                    oType: 'QK', 
                    parentType: nodeType,
                    displayMode: 'create',
                    okCode: okCode
                }));                                
                break;
            case 'CQK_VIEW_COMP_GROUP': //View Group Details
                this.getContentForDescription(nextApp, nodeId, nodeType, '');
                balloon.hide();
                break;
            case 'CQK_VIEW_COMP': //View competency details
                this.getContentForDescription(nextApp, nodeId, nodeType, '');
                balloon.hide();
                break;
            case 'CQK_DEL_COMP_GROUP': //Delete competency group
                this.genericDelete(nodeType, nodeId, name, this.appName, global.getLabel('delete_competencyGroupInfo'), 'DELO');
                balloon.hide();
                break;
            case 'CQK_DEL_COMP': //Delete competency 
                this.genericDelete(nodeType, nodeId, name, this.appName, global.getLabel('delete_competencyInfo'), 'DELO');
                balloon.hide();
                break;
            case 'CQK_EDIT_COMP': //Edit Competency
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'COMPCATL', oType: 'Q', parentType: nodeType, objectId: nodeId, displayMode: 'edit', okCode: okCode }));
                balloon.hide();
                global.open($H({
                    app: {
                       appId: nextApp, //"CQK_QUAL"
                       tabId: tabId,
                       view: 'COMP_CATL_AC' // 'COMP_CATL_AC'
                    },
                    prevApp: 'COMPCATL', 
                    objectId: nodeId, 
                    oType: 'Q', 
                    parentType: nodeType,
                    displayMode: 'edit',
                    okCode: okCode
                }));                
                break;
            case 'CQK_EDIT_COMP_GROUP': //Edit Competency group
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'COMPCATL', oType: 'QK', parentType: nodeType, objectId: nodeId, displayMode: 'edit', okCode: okCode }));
                balloon.hide();
                global.open($H({
                    app: {
                       appId: nextApp, //"CQK_GRP"
                       tabId: tabId,
                       view: 'COMP_CATL_ACG' // 'COMP_CATL_ACG'
                    },
                    prevApp: 'COMPCATL', 
                    objectId: nodeId, 
                    oType: 'QK', 
                    parentType: nodeType,
                    displayMode: 'edit',
                    okCode: okCode
                }));                 
                break;
            default:
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'TEACH', objectId: nodeId }));
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
    returnCourse: function(params) {
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
    getContentForDescription: function(nextApp, objectId, oType, newMode) {
        if (newMode == 'create')
            var mode = 'NEW';
        else
            var mode = '';
        var xml = "<EWS>"
                  + "<SERVICE>" + this.getContentService + "</SERVICE>"
                  + "<OBJECT TYPE='" + oType + "'>" + objectId + "</OBJECT>"
                  + "<PARAM>"
                    + "<APPID>" + nextApp + "</APPID>"
                    + "<WID_SCREEN>*</WID_SCREEN>"
                    + "<PERIOD_BEGDA>" + objectToSap(new Date()) + "</PERIOD_BEGDA>"
                    + "<PERIOD_ENDDA>9999-12-31</PERIOD_ENDDA>"
                    + "<OKCODE>" + mode + "</OKCODE>"
                  + "</PARAM>"
                + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'setContentForDescription' }));
    },
    setContentForDescription: function(answer) {
        this.answer = answer;
        if (!Object.isEmpty(answer.EWS.o_field_settings)) {
            fp = new getContentModule({ mode: 'display', json: answer, appId: this.appName }).getHtml();
            var contentHTML = new Element('div', { 'id': 'CompCat_viewDetails' });
            contentHTML.insert(fp);
            var viewDetailsPopUp = new infoPopUp({

                closeButton: $H({
                    'callBack': function() {

                        viewDetailsPopUp.close();
                        delete viewDetailsPopUp;
                    }
                }),
                htmlContent: contentHTML,
                width: 600
            });
            viewDetailsPopUp.create();

        }
    }     
});

