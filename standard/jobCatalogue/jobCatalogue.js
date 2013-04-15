/** 
* @fileOverview jobCatalogue.js 
* @description File containing class JCAT. 
* Application for Job Catalogue.
*/

/**
*@constructor
*@description Class JCAT.
*/
var JCAT = Class.create(GenericCatalog, {

    getCatSessionsService: 'GET_CATSESSION',
    maintViewContainerChild: 'TM_L_CTM',
    returnHash: new Hash(),
    hashOfButtons: $H(),
    linksLoaded: false,
    /*
    *@method initialize
    *@param $super: the superclass: GenericCatalog
    *@desc instantiates the app
    */
    initialize: function($super, args) {
        $super(args, {
            containerParent: 'JOB_CA',
            containerChild: 'JOB_CA',
            applicationId: args.className
        });
        this.actionClickedBinding = this.actionClicked.bindAsEventListener(this);
        this.employeeSelectedAdvSearchBinding = this.reloadTree.bindAsEventListener(this);
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
        document.observe(this.applicationId + ':action', this.actionClickedBinding);
        document.observe('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
    },
    setHTML: function(data) {
        this.json = data;
        this.data = this.handleData(data);

        this.virtualHtml.insert(
        //title removed after ivan's request (in order to show it again, just uncomment these lines)
        //"<div id='" + this.applicationId + "_level1' class='genCat_level1'></div>" +
					"<div id='" + this.applicationId + "_level2' class='genCat_level3'></div>" +
					"<div id='" + this.applicationId + "_level3' class='genCat_level3'></div>" +
					"<div id='" + this.applicationId + "_level4' class='genCat_level4'></div>" +
					"<div class='genCat_backTop'>" +
					    "<span id='" + this.applicationId + "_backTop' class='application_action_link'>" + global.getLabel("backtoroot") + "</span>" +
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
            handler: this.returnSeveralJobs.bind(this),
            type: 'button',
            idButton: this.applicationId + '_buttonAdd',
            className: 'genCat_button',
            standardButton: true
        };
        json.elements.push(aux);
        var ButtonJobCatalog = new megaButtonDisplayer(json);
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
        this.virtualHtml.down('[id=' + this.applicationId + '_level6]').insert(ButtonJobCatalog.getButtons());
        if (!this.checkBoxes)
            this.virtualHtml.down('[id=' + this.applicationId + '_level6]').hide();
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').observe('click', function() {
            //clear autocompleter
            this.autoCompleter.clearInput();
            //return to first tree
            this.backTop();
        } .bind(this));
        this.setTitleDiv();
        this.setDatePickersDiv();
        this.setAutoCompleterDiv();
        this.setAutoCompleterLabel(global.getLabel('Go to'));
        this.setLegendDiv();
        this.setTreeDiv();
        this.trees.each(function(tree) {
            tree.value.expandNodeById(tree.key);
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
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.datePickersLabel.update(global.getLabel('date')).wrap('div', { className: 'genCat_label' })); //this.data.datePickersLabel));	
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert("<div class='genCat_comp' id='" + this.applicationId + "_datePickers'>" +
																				"<div id='" + this.applicationId + "_datePickerBeg'></div>" +
																		  "</div>");
        var aux = { events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' }),
                    defaultDate: objectToSap(new Date()).gsub('-', '')
        };
        this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
    },
    /**     
    *@description It sets the second HTML level (the autoCompleter one)
    */
    setAutoCompleterDiv: function() {
        this.autoCompleterLabel = new Element('span', { className: 'application_main_title3' });
        this.radioButtonsGroup = new Element('div', { id: this.applicationId + '_radioButtonsGroup', className: 'genCat_radioButtonsGroup' });
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.autoCompleterLabel.update('Autocompleter Label').wrap('div', { className: 'genCat_label' })); //this.data.autocompleterLabel));
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert("<div class='genCat_comp' id='" + this.applicationId + "_autocompleter'></div>");
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.radioButtonsGroup);
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
        var cont = 0;
        this.json.EWS.o_legend.item.each(function(element) {
            cont++;
            var text;
            if (cont == this.json.EWS.o_legend.item.length)
                var checked = "checked";
            else
                var checked = "";
            var radioButton = "<input type='radio' name='gcRadioGroup' value='" + element['@otype'] + "' class='genCat_radioButton' " + checked + "/>";
            var radioButtonDiv = new Element('div');
            for (i = 0; i < this.json.EWS.labels.item.length; i++) {
                if (this.json.EWS.labels.item[i]['@id'] == element['@otype'])
                    text = '<span style="float:left;">' + this.json.EWS.labels.item[i]['@value'] + '</span>';
            }
            radioButtonDiv.insert(radioButton);
            radioButtonDiv.insert(text);
            this.radioButtonsGroup.insert(radioButtonDiv);
        } .bind(this));
        //Advanced Search
        this.advancedSearchDiv = new Element('div', { id: this.applicationId + '_advancedSearch', className: 'jobCat_searchDiv' });
        //PROVISIONAL SOLUTION: links in tree
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.advancedSearchDiv);
        var advancedSearchButton = new Element("div", { "class": "application_handCursor" }).insert(new Element("div", {
            "class": "application_catalog_image application_catalog_image_AS"
        }).insert("&nbsp")).insert(new Element("div", {
            "class": "as_button"
        }).insert(global.getLabel('SRC_OV'))).observe("click", this.getAdvSearchlinks.bind(this));
        var advancedSearchLinks = new Element("div", { "id": "advSearchLinks", "class": "OM_advsSearchLinks" });
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
                    className: 'getContentLinks application_action_link jobCat_searchLinkDiv',
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
                for (i = 0; i < this.json.EWS.labels.item.length; i++) {
                    if (this.json.EWS.labels.item[i]['@id'] == element['@otype'])
                        text = this.json.EWS.labels.item[i]['@value'];
                }
                aux.legend.push({ img: this.CLASS_OBJTYPE.get(element['@otype']), text: text });
            } .bind(this));
            this.virtualHtml.down('div#' + this.applicationId + '_level4').update(getLegend(aux));
            this.legend = this.virtualHtml.down('div#' + this.applicationId + '_level4');
        }
    },

    nodeClicked: function(args) {
        if (this.arguments) {
            if (!this.checkBoxes) {
                var params = getArgs(args);
                this.returnJob(params);
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
    /**     
    *@description It executes the code that belongs to the action clicked 
    */
    actionClicked: function(parameters) {
        var name = getArgs(parameters).get('name');
        var nodeId = getArgs(parameters).get('nodeId');
        var nextApp = getArgs(parameters).get('application');
        var nodeType = getArgs(parameters).get('nodeType');
        var okCode = getArgs(parameters).get('okCode');
        var view = getArgs(parameters).get('view');
        var tarty = getArgs(parameters).get('tarty');
        var date = (this.datePickerBeg).actualDate.toString('yyyy-MM-dd')
        var tab;
        if (tarty != 'P') { tab = this.options.tabId } else { tab = 'POPUP' };
        switch (name) {
            case 'JOBFAMCREATE': // create a job family
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tab,
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: '9C',
                    displayMode: 'create',
                    okCode: okCode
                }));
                balloon.hide();
                break;
            case 'JOBFAMDELETE': // delete the job family
                this.deleteObject(nodeType, nodeId, name, '', global.getLabel('deleteJobFamInfo'), okCode);
                balloon.hide();
                break;
            case 'JOBFAMDELIMIT': // delimit a job family
                this.genericDelete(nodeType, nodeId, name, '', global.getLabel('delimitObj'), okCode);
                balloon.hide();
                break;
            case 'JOBFAMEDIT': // edit the job family
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tab,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    oType: '9C',
                    parentType: nodeType,
                    displayMode: 'edit',
                    okCode: okCode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'JOBFAMVIEW': // view details of a job family
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: 'POPUP',
                        view: view
                    },
                    objectId: nodeId,
                    oType: '9C',
                    parentType: nodeType,
                    displayMode: 'display',
                    okCode: okCode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'JOB_CHANGE_ASS_9C': // 'change assignment' in job family
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tab,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    oType: '9C',
                    parentType: nodeType,
                    displayMode: 'edit',
                    okCode: okCode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'JOBCREATE': // create a job
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tab,
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: 'C',
                    displayMode: 'create',
                    okCode: okCode
                }));
                balloon.hide();
                break;
            case 'JOBDELETE': // delete the job
                this.deleteObject(nodeType, nodeId, name, '', global.getLabel('deleteJobInfo'), okCode);
                balloon.hide();
                break;
            case 'JOBDELIMIT': // delimit a job
                this.genericDelete(nodeType, nodeId, name, '', global.getLabel('delimitObj'), okCode);
                balloon.hide();
                break;
            case 'JOBEDIT': // edit the job
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tab,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    oType: 'C',
                    parentType: nodeType,
                    displayMode: 'edit',
                    okCode: okCode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'JOBVIEW': // view details of a job
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: 'POPUP',
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'C',
                    parentType: nodeType,
                    displayMode: 'display',
                    okCode: okCode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'JOBADDDATA': // 'edit additional data' action in Job
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tab,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    oType: 'C',
                    parentType: nodeType,
                    displayMode: 'edit',
                    okCode: okCode,
                    tarty: tarty,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'JOBADDDATADIS': // 'view additional data' action in Job 
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: 'POPUP',
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'C',
                    parentType: nodeType,
                    displayMode: 'edit',
                    okCode: okCode,
                    tarty: tarty,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'JOB_CHANGE_ASS_C': // 'change assignment' in job
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tab,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    oType: 'C',
                    parentType: nodeType,
                    displayMode: 'edit',
                    okCode: okCode,
                    begda: date
                }));
                balloon.hide();
                break;
            default:
                balloon.hide();
                break;
        }
    },
    returnSeveralJobs: function() {
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

    returnJob: function(params) {
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
    /**
    * @description Method that reloads the tree after selecting an object in Adv Search pop up. 
    */
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
    * @description Method that deletes an object after the user confirmation
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
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
        this.returnHash = new Hash();
        document.stopObserving(this.applicationId + ':action', this.actionClickedBinding);
        document.stopObserving('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
    }
});