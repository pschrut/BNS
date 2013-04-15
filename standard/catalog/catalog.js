
var CATL = Class.create(GenericCatalog, {

    getCatSessionsService: 'GET_CATSESSION',
    getNavLinkService: 'GET_MAIN_LINK',
    //maintViewContainerChild: 'TM_L_CTM',
    //mvv
    returnHash: new Hash(),
    /*
    *@method initialize
    *@param $super: the superclass: GenericCatalog
    *@desc instantiates the app
    */
    initialize: function($super, options) {
        $super(options, {
            containerParent: 'LRN_CAT',
            containerChild: 'TM_L_CTD',
            initialService: 'GET_CAT_ROOTS',
            getNodeChildrenService: 'GET_CAT_CHILD',
            searchService: 'GET_CAT_SEAR',
            searchedNodeSelectedService: 'GET_CAT_PAR',
            nodeClickedService: 'GET_CAT_ACTIO',
            applicationId: 'CATL'
        });
        this.actionClickedBinding = this.actionClicked.bindAsEventListener(this);
        ///mvv
        this.employeeSelectedAdvSearchBinding = this.reloadTree.bindAsEventListener(this);
    },

    /*
    *@method run
    *@param $super: the superclass: GenericCatalog
    * which have changed.
    */
    run: function($super, args) {
    
    
/***********************************************************************************************************/   
        $super(args);
        this.selectedCourses = $H();
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
            if (!Object.isEmpty(args.get('popupMode'))) {
                this.popupMode = args.get('popupMode');
            }else{
                this.popupMode = false;
            }
            if(args.get('DFPcourses')){
            ///if(!Object.isEmpty(args.get('DFPcourses'))){
                this.selectedCourses = args.get('DFPcourses');
            }
        }
        document.observe(this.applicationId + ':action', this.actionClickedBinding);
        ///mvv
        document.observe('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
/***********************************************************************************************************/        
    },
    setHTML: function(data) {
        if (!Object.isEmpty(data.EWS.o_root)) {
            this.json = data;
            this.data = this.handleData(data);
            this.labels = this.json.EWS.labels.item
            if (this.checkBoxes) {
                this.virtualHtml.insert(
			                "<div id='" + this.applicationId + "_level1' class='genCat_level1'></div>" +
					        "<div id='" + this.applicationId + "_level2' class='genCat_level2 trainingCat_level2 '></div>" +
					        "<div id='" + this.applicationId + "_level3' class='genCat_level3'></div>" +
					        "<div id='" + this.applicationId + "_level4' class='genCat_level4 trainingCat_level2'></div>" +
					        "<div class='genCat_backTop'>" +
					            "<span id='" + this.applicationId + "_backTop' class='application_action_link'>" + global.getLabel('Back to Top') + "</span>" +
					        "</div>" +
					        "<div style='clear:both'>&nbsp;</div>" +
					        "<div id='" + this.applicationId + "_level5' class='genCat_level5'></div>"
					        + "<div id='" + this.applicationId + "_level6' class='genCat_level6'></div>"
		                    );
            } else {
                this.virtualHtml.insert(
                //"<div id='"+this.applicationId+"_level1' class='genCat_level1'></div>"+
			                "<div id='" + this.applicationId + "_level1_links' class='genCat_level1'></div>" +
					        "<div id='" + this.applicationId + "_level2' class='genCat_level2 trainingCat_level2'></div>" +
					        "<div id='" + this.applicationId + "_level3' class='genCat_level3 '></div>" +
					        "<div class='genCat_level3' id='learning_addNewTraining'></div>" +
					        "<div id='" + this.applicationId + "_level4' class='genCat_level4 trainingCat_level2'></div>" +
					        "<div class='genCat_backTop'>" +
					            "<span id='" + this.applicationId + "_backTop' class='application_action_link'>" + global.getLabel('Back to Top') + "</span>" +
					        "</div>" +
					        "<div style='clear:both'>&nbsp;</div>" +
					        "<div id='" + this.applicationId + "_level5' class='genCat_level5'></div>"
		        );
            }
            this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
            this.virtualHtml.down('span#' + this.applicationId + '_backTop').observe('click', function() {
                this.backTop();
            } .bind(this));
            if (this.checkBoxes) {
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
                this.setTitleDiv();
            }

            //this.setTitleDiv();            
            this.setAutoCompleterDiv();
            this.setAutoCompleterLabel(global.getLabel('searchByKeyWord'));
            this.setDatePickersDiv();
            this.setLegendDiv();
            this.setTreeDiv();
            this.trees.each(function(tree) {
                tree.value.expandNodeById(tree.key);
            } .bind(this));
        } else {
            //if there's no data, we go to the maint catalog            
            global.open($H({
                app: {
                    appId: 'TM_L_CTM',
                    tabId: 'LRN_CAT',
                    view: 'CATLMAINTVIEW'
                }
            }));
        }
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
    },
    
    /**     
*@param json {JSON} nodes list
*@param save {Boolean} true/false: to keep the result or not as the currentXML
*(depending on if we are changing the node context or not, i mean completely refreshing
*the treeHandler)
*@description It turns a SAP node list into the proper format to be shown on the treeHandler
*/
/*mvv
buildTreeXml: function(json) {
    var text = '<nodes>';
    var numberNoRoot = 0;    
    json.each(function(node) {
        if(this.selectedCourses.size() > 0){
            var aux = this.selectedCourses.keys();
            var isInDFP;
            if(aux.indexOf(node.value['@objid'])>0){
                isInDFP ="";
            }else{
                isInDFP =(Object.isEmpty(node.value['@select'])) ? "" : node.value['@select'];
            }
            aux = {
                name: node.value['@stext'],
                id: node.value['@objid'],
                type: node.value['@otype'],
                plvar: node.value['@plvar'],
                children: (node.value['@parnt'] && (node.value['@parnt'].toLowerCase() == 'x')) ? 'X' : '',
                parent: node.value['@rootid'],
                select: isInDFP,///"",///(Object.isEmpty(node.value['@select'])) ? "" : node.value['@select'],
                textName: node.value['@stext']         
            };
        }else{
            aux = {
                    name: node.value['@stext'],
                    id: node.value['@objid'],
                    type: node.value['@otype'],
                    plvar: node.value['@plvar'],
                    children: (node.value['@parnt'] && (node.value['@parnt'].toLowerCase() == 'x')) ? 'X' : '',
                    parent: node.value['@rootid'],
                    select: (Object.isEmpty(node.value['@select'])) ? "" : node.value['@select'],
                    textName: node.value['@stext']         
                };
        }
        this.nodes.set(aux.id, aux);
        aux.name = this.formatName(node.value['@stext'], node.value['@otype'])
        text += (node.value['@rootid']) ? this.templateNodes.evaluate(aux) : this.templateRoot.evaluate(aux);
        if (node.value['@rootid']) numberNoRoot++;
    } .bind(this));
    text += (json.size() == numberNoRoot) ? '</nodes>' : '</node></nodes>';
    return text;
},
mvv*/
    /**     
    *@description It calls SAP to get the links
    */
    setNavigationLinks: function(data) {
        if (!Object.isEmpty(data.EWS.o_root) && !this.checkBoxes) {
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
            if (buttonsAnswer[i]['@action'] != "LSOREQUESTTRAIN") {//navigation links 
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
            }
            else if (buttonsAnswer[i]['@action'] == "LSOREQUESTTRAIN") {
                //request new training link
                var buttonNewTrainingJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                };
                var appId2 = buttonsAnswer[i]['@tarap'];
                var tabId2 = buttonsAnswer[i]['@tartb'];
                var view2 = buttonsAnswer[i]['@views'];
                var okcode2 = buttonsAnswer[i]['@okcode'];
                var callBack2 = function() {
                    global.open($H({
                        app: {
                            appId: appId2,
                            tabId: tabId2,
                            view: view2                            
                        },
                        okcode: okcode2,
                        displayMode: 'create'
                    }));
                };
                var aux = {
                    idButton: buttonsAnswer[i]['@action'],
                    label: global.getLabel('reqnewtrain'),
                    handlerContext: null,
                    eventOrHandler: false,
                    className: 'application_action_link',
                    handler: callBack2,
                    type: 'link'
                };
                buttonNewTrainingJson.elements.push(aux);
                var ButtonObj = new megaButtonDisplayer(buttonNewTrainingJson);
                var button = ButtonObj.getButtons();
                //insert buttons in div
                var id = this.applicationId + "_level3";
                this.virtualHtml.down('div#' + id).insert(button);

            } //end else
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
    *@description It sets the second HTML level (the autoCompleter one)
    */
    setAutoCompleterDiv: function() {
        this.autoCompleterLabel = new Element('span', { className: 'application_main_title3' });
///mvv        this.radioButtonsGroup = new Element('div', { id: this.applicationId + '_radioButtonsGroup', className: 'genCat_radioButtonsGroup' });
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.autoCompleterLabel.update('Autocompleter Label').wrap('div', { className: 'genCat_label trainingCat_label' })); //this.data.autocompleterLabel));
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert("<div class='application_catalog_genCat_comp' id='" + this.applicationId + "_autocompleter'></div>");
///mvv        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.radioButtonsGroup);
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
/*mvv        var cont = 0;
        objectToArray(this.json.EWS.o_legend.item).each(function(element) {
            cont++;
            var text;
            if (cont == this.json.EWS.o_legend.item.length)
                var checked = "checked";
            else
                var checked = "";
///mvv            var radioButton = "<input type='radio' name='gcRadioGroup' value='" + element['@otype'] + "' class='genCat_radioButton' " + checked + "/>";
///mvv            var radioButtonDiv = new Element('div');
            for (i = 0; i < this.json.EWS.labels.item.length; i++) {
                if (this.json.EWS.labels.item[i]['@id'] == element['@otype'])
                    text = '<span style="float:left;">' + this.json.EWS.labels.item[i]['@value'] + '</span>';
            }
///mvv            radioButtonDiv.insert(radioButton);
///mvv            radioButtonDiv.insert(text);
///mvv            this.radioButtonsGroup.insert(radioButtonDiv);
        } .bind(this));
mvv */        
        if (!this.checkBoxes) {
            //Advanced Search
            this.advancedSearchDiv = new Element('div', { id: this.applicationId + '_advancedSearch', className: 'genCat_radioButtonsGroup' }); 
            //PROVISIONAL SOLUTION: links in tree
            this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.advancedSearchDiv);
            var advancedSearchButton = new Element("div", { "class": "application_handCursor megaButtonDisplayer_floatLeft" }).insert(new Element("div", {
                "class": "application_catalog_image application_catalog_image_AS"
            }).insert("&nbsp")).insert(new Element("div", {
                "class": "as_button"
            }).insert("Advanced Search")).observe("click", this.getAdvSearchlinks.bind(this));
            var advancedSearchLinks = new Element("div", { "id": "advSearchLinks", "class": "advsSearchLinks" }); ///"class": "advSearchLink" }); 
            this.advancedSearchDiv.insert(advancedSearchButton);

            this.advancedSearchDiv.insert(advancedSearchLinks);
            this.virtualHtml.down('div#advSearchLinks').hide();
        }
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
                    handler: this.openNavAppAdv.bind(this, seqnr),
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
    openNavAppAdv: function(seqnr) {
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
    ///mvv
    reloadTree: function(parameters) {
        var objectHash = getArgs(parameters).get('employeesAdded');
        var args = $H({});
        if(objectHash.size() > 0){
        var objectId, objectName, objectType;
        objectHash.each(function(pair) {
            objectId = pair[0];
            objectName = pair[1].name;
            objectType = pair[1].type;
        } .bind(this));
        //call method to refresh the tree
        args.set('idAdded', objectId + '_' + objectType);
        }else{
            args.set('idAdded', '');
        }
        this.nodeSelected(args);
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
        var htmlFilterOptions = '';
        var count = 0;
        this.statusArray = new Array;
        for (var i = 0; i < this.labels.length; i++) {
            if (this.labels[i]['@id'].startsWith('Status')) {
                this.statusArray[count] = this.labels[i]['@value'];
                switch (count) {
                    case 0: var color = 'black'
                        break;
                    case 1: var color = 'green'
                        break;
                    case 2: var color = 'purple'
                        break;
                    case 3: var color = 'red'
                        break;
                }
                if (count < 2)
                    htmlFilterOptions += "<div class= 'catalogFilterOptionsDiv' id='" + this.applicationId + "_label_" + this.labels[i]['@id'] + "'><div class='catalogFilterOptionsIcons'><input id='" + this.applicationId + "_checkbox_" + this.labels[i]['@id'] + "' type='checkbox' name='catalogFilterOptions' value='catalogFilterOption_" + count + "' checked/></div><div class='application_text_bolder' style='color:" + color + "'>" + this.labels[i]['@value'] + "</div></div>";
                else
                    htmlFilterOptions += "<div class= 'catalogFilterOptionsDiv' id='" + this.applicationId + "_label_" + this.labels[i]['@id'] + "'><div class='catalogFilterOptionsIcons'><input id='" + this.applicationId + "_checkbox_" + this.labels[i]['@id'] + "' type='checkbox' name='catalogFilterOptions' value='catalogFilterOption_" + count + "' /></div><div class='application_text_bolder' style='color:" + color + "'>" + this.labels[i]['@value'] + "</div></div>";
                count++;
            }
        };
        if (!this.checkBoxes) {
            this.virtualHtml.down('div#learning_addNewTraining').insert("<div><div class='application_action_link catalogFilterOptionsLink' id='" + this.applicationId + "_filterOptionsLink'>" + global.getLabel('filterOptions') + "</div>"
		                                                                          + "<div class='catalogFilterOptions' id='" + this.applicationId + "_filterOptions'>" + htmlFilterOptions + "</div>"
		                                                                     + "</div>");
            this.labels.each(function(label) {
                if (label['@id'].startsWith('Status')) {
                    this.virtualHtml.down("[id='" + this.applicationId + "_checkbox_" + label['@id'] + "']").observe('click', function() {
                        this.backTop();
                    } .bind(this));
                }
            } .bind(this));
            var aux = { events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' }), startDay: 1, defaultDate: objectToSap(new Date()).gsub('-', '') };
            this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
            aux = { events: $H({ 'correctDateOnBlur': 'EWS:' + this.applicationId + '_correctDay' }), manualDateInsertion: true, defaultDate: objectToSap(this.datePickerBeg.actualDate.year()).gsub('-', '') };
            this.virtualHtml.down('[id=' + this.applicationId + '_filterOptionsLink]').observe("click", this.toggleFilterOptions.bindAsEventListener(this));
            this.virtualHtml.down('[id=' + this.applicationId + '_filterOptions]').hide();
        } else {
            var aux = { events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' }), startDay: 1, defaultDate: objectToSap(new Date()).gsub('-', '') };
            this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
            aux = { events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' }), defaultDate: objectToSap(this.datePickerBeg.actualDate.year()).gsub('-', '') };
        }
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
        
        var itemsInLegend = objectToArray(this.json.EWS.labels.item);
        //1. course group
        for (i = 0; i < itemsInLegend.length; i++) {
            if (itemsInLegend[i]['@id'] == 'L')
                aux.legend.push({ img: this.CLASS_OBJTYPE.get('L'), text: itemsInLegend[i]['@value'] }); 
        }
        //when the catalogue is in popup mode doesnt show bar icons
        if(!this.checkBoxes){
            //2. course
            aux.legend.push({ img: "application_course", text: global.getLabel('E') }); 
            //3. green bar
            aux.legend.push({ img: "application_learning_statusBarGreen", text: global.getLabel('Green') });       
        }
        //4. course type
        for (i = 0; i < itemsInLegend.length; i++) {
            if (itemsInLegend[i]['@id'] == 'D')
                aux.legend.push({ img: this.CLASS_OBJTYPE.get('D'), text: itemsInLegend[i]['@value'] }); 
        }
        //when the catalogue is in popup mode doesnt show bar icons  
        if(!this.checkBoxes){      
            //5. insert curr           
            aux.legend.push({ img: "application_curriculum", text: global.getLabel('EC') });
            //6. yellow bar     
            aux.legend.push({ img: "application_learning_statusBarYellow", text: global.getLabel('Yellow') });
        }
        //7. Curr type
        for (i = 0; i < itemsInLegend.length; i++) {
            if (itemsInLegend[i]['@id'] == 'DC')
                aux.legend.push({ img: this.CLASS_OBJTYPE.get('DC'), text: itemsInLegend[i]['@value'] }); 
        }  
        //when the catalogue is in popup mode doesnt show bar icons
        if(!this.checkBoxes){
            //8. Empty bar      
            aux.legend.push({ img: "application_learning_statusBarEmpty", text: global.getLabel('statusbar') });
        
            //9. Red bar        
            aux.legend.push({ img: "application_learning_statusBarRed", text: global.getLabel('Red') });
        }
        this.virtualHtml.down('div#' + this.applicationId + '_level4').update(getLegend(aux));
        this.legend = this.virtualHtml.down('div#' + this.applicationId + '_level4');
    },
    /**     
    *@description It sets the first HTML level 
    */
    setTitleDiv: function() {
        this.title = new Element('span', { className: 'application_main_title' });
        if (this.checkBoxes) {
            this.virtualHtml.down('div#' + this.applicationId + '_level1').insert(this.title.update(global.getLabel('trainingsCatalogADD')));
        } else {
            this.virtualHtml.down('div#' + this.applicationId + '_level1').insert(this.title.update(global.getLabel('trainingsCatalogTitle')));
        }
    },
    /**     
    *@description It calls to SAP for retrieving the course details 
    */
    retrieveCourseSessions: function(courseId, courseType) {
        var htmlFilter = '';
        this.labels.each(function(label) {
            if (label.key.startsWith('Status')) {
                if (this.virtualHtml.down("[id='" + this.applicationId + "_checkbox_" + label.key + "']").checked)
                    htmlFilter += '1';
                else
                    htmlFilter += '0';
            }
        } .bind(this));
        var begDay = this.datePickerBeg.getDateAsArray().day;
        var begMonth = this.datePickerBeg.getDateAsArray().month;
        var begYear = this.datePickerBeg.getDateAsArray().year;
        if (begDay.length == 1)
            begDay = '0' + begDay;
        if (begMonth.length == 1)
            begMonth = '0' + begMonth;
        var xml = "<EWS>"
                + "<SERVICE>" + this.getCatSessionsService + "</SERVICE>"
                + "<OBJECT TYPE='" + courseType + "'>" + courseId + "</OBJECT>"
                + "<DEL></DEL>"
                + "<PARAM>"
                      + '<I_BEGDA>' + begYear + '-' + begMonth + '-' + begDay + '</I_BEGDA>'
                      + "<FILTER>" + htmlFilter + "</FILTER>"
                + "</PARAM>"
                + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'showCourseSessions', ajaxID: courseId }));
    },
    /**     
    *@description It retrieves the course details and show them 
    */
    showCourseSessions: function(answer, ajaxId) {
        if (!Object.isEmpty(answer.EWS.o_cat_ses)) {
            var sessions = objectToArray(answer.EWS.o_cat_ses.yglui_str_catses);
            var htmlAdditionalInfo = '';
            for (var i = 0; i < sessions.length; i++) {
                var begDa = sapToDisplayFormat(sessions[i]['@begda']);
                var endDa = sapToDisplayFormat(sessions[i]['@endda']);
                var location = sessions[i]['@location'];
                var objId = sessions[i]['@objid'];
                var status = this.statusArray[sessions[i]['@status'] - 1]; //our array begins with '0'
                var total = parseInt(sessions[i]['@total'], 10);
                var wait = parseInt(sessions[i]['@wait'], 10);
                var booked = parseInt(sessions[i]['@booked'], 10);
                var optimum = parseInt(sessions[i]['@optim'], 10);
                var otype = sessions[i]['@otype'];
                var plvar = sessions[i]['@plvar'];
                var name = sessions[i]['@name'];
                var descr = sessions[i]['@descr'];
                var preq = sessions[i]['@preq'];
                if(!Object.isEmpty(preq))
                    preq = preq.gsub('curriLabel', global.getLabel('curriculum'));                
                switch (sessions[i]['@status']) {
                    case '1': var color = 'black';
                        break;
                    case '2': var color = 'green';
                        break;
                    case '3': var color = 'purple';
                        break;
                    case '4': var color = 'red';
                        break;
                }
                if (Object.isEmpty(location))
                    location = "";
                var waitingListInfo = "";
                var icon = (otype == 'E') ? 'application_course' : 'application_curriculum';
                if (booked >= total)
                    waitingListInfo = "<span class='catalogWaitingPeople'>" + global.getLabel('waiting') + ": " + wait + "</span>";
                var descToolTip = "";
                if(!Object.isEmpty(descr)){  
                    descToolTip += "<tr><td class='catalogTooltip'>"+global.getLabel('description2')+" "+"</td><td>"+descr+"</td></tr>";   
                }
                if(!Object.isEmpty(location))
                    descToolTip += "<tr><td class='catalogTooltip'>"+global.getLabel('location2')+" "+"</td><td>"+location+"</td></tr>";                
                if(!Object.isEmpty(preq)){  
                    descToolTip += "<tr><td class='catalogTooltip'>"+global.getLabel('Prerequisite')+" "+"</td><td>"+preq+"</td></tr>";   
                }                
                var spanToolTip = "";
                if(!Object.isEmpty(descToolTip))  
                    spanToolTip = "<div><table>"+descToolTip+"</table></div>";                         
                htmlAdditionalInfo += "<div class='catalogSession'> " +
                                                    "<table>" +
                                                        "<tr class='catalogSessionDetails'>" +
                                                            "<td class='catalogTitleSize'>" + 
                                                                "<div class='Ntooltip'>"+spanToolTip+
                                                                    "<span class='treeHandler_text_node_content "+icon+" genCat_iconInTree catalogMarginIcon '></span>" + 
                                                                    "<span id='" + this.applicationId + "_" + ajaxId + "_" + objId + "_session' class='application_action_link'> " + name + "  " + begDa + " - " + endDa + "</span>" +                                                                                                                                                                                                 
                                                                "</div>"+
                                                            "</td>" +       
                                                            "<td><span class='catalogStatusSize' style='color:" + color + ";'>" +" "+ status + "</span></td>" +                                                     
                                                            "<td class='catalogBookedTotalSize'>" +
                                                                "<div class='catalogBookedTotal Ntooltip'>" + booked + "/" + total + "<div>"+global.getLabel('totalBook')+"</div></div>" +
                                                            "</td>" +
                                                           "<td class='catalogRatingBarSize'>" +
                                                                "<div class='catalogRatingBar' id='" + this.applicationId + "_" + ajaxId + "_" + i + "_ratingBar'></div>" +
                                                            "</td>" +
                                                            "<td>" + waitingListInfo +
                                                            "</td>" +
                                                        "</tr>" +
                                                    "</table>" +
                                                "</div>";
            }
            this.toggleAdditionalInfo(ajaxId, htmlAdditionalInfo)
            for (var i = 0; i < sessions.length; i++) {
                var total = parseInt(sessions[i]['@total'], 10);
                var booked = parseInt(sessions[i]['@booked'], 10);
                var optimum = parseInt(sessions[i]['@optim'], 10);
                this.virtualHtml.down("div#" + this.applicationId + "_" + ajaxId + "_" + i + "_ratingBar").update(getRating(total, booked, -1, false, optimum));
                this.virtualHtml.down("span#" + this.applicationId + "_" + ajaxId + "_" + sessions[i]['@objid'] + "_session").observe('click', this.nodeSessionClicked.bindAsEventListener(this, ajaxId, sessions[i]['@objid'], sessions[i]['@otype']));
            }
        } else {
            var htmlAdditionalInfo = '<span class="application_main_soft_text">' + global.getLabel("noSessionsLearning") + '</span>';
            this.toggleAdditionalInfo(ajaxId, htmlAdditionalInfo)
        }
    },
    /**     
    *@param args {event} event thrown by when a session has been clicked.
    *@description It gets a node contextual actions from SAP.
    */
    nodeSessionClicked: function(event, courseId, sessionId, oType) {
        if (this.arguments) {
            if (!this.checkBoxes) {
                var params = getArgs(args);
                this.returnCourse(params);
            }
        }
        else {
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
        }
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
                var nodeId = ajaxId.split("_")[4];
                var okCode = action['@okcod'];
                var tabId = action['@tartb'];
                var view = action['@views'];
                var disma = action['@disma'];
                //var nodeType = getArgs(parameters).get('nodeType');		        		        
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
    *@description It executes the code that belongs to the action clicked 
    */
    actionClicked: function(parameters) {
        var name = getArgs(parameters).get('name');
        var nodeId = getArgs(parameters).get('nodeId');
        var nextApp = getArgs(parameters).get('application');
        var nodeType = getArgs(parameters).get('nodeType');
        var tabId = getArgs(parameters).get('tartb');
        var view = getArgs(parameters).get('view');
        var disma = getArgs(parameters).get('disma');
        var okCode = getArgs(parameters).get('okCode');
        var begDay = this.datePickerBeg.getDateAsArray().day;
        var begMonth = this.datePickerBeg.getDateAsArray().month;
        var begYear = this.datePickerBeg.getDateAsArray().year;
        if (begDay.length == 1)
            begDay = '0' + begDay;
        if (begMonth.length == 1)
            begMonth = '0' + begMonth;
        var begda = begYear + '-' + begMonth + '-' + begDay;
        this.nodeId = nodeId;
        switch (name) {
            case 'LSORETRIEVEC': // show courses
                this.retrieveCourseSessions(nodeId, 'D');
                balloon.hide();
                break;
            case 'LSORETRIEVECUR': // show curriculums
                this.retrieveCourseSessions(nodeId, 'DC');
                balloon.hide();
                break;
            case 'LSODISPLAYCG': // view course group details
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATL', objectId: nodeId, oType: 'L', parentType: nodeType, displayMode: 'display'}));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'L',
                    parentType: nodeType,
                    displayMode: 'display',
                    disma: disma,
                    begda:begda,
                    okCode: okCode
                }));
                break;
            case 'LSODISPLAYCT': //view course details
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATL', objectId: nodeId, oType: 'D', parentType: nodeType, displayMode: 'display'}));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'D',
                    parentType: nodeType,
                    displayMode: 'display',
                    disma: disma,
                    begda:begda,
                    okCode: okCode
                }));
                break;
            case 'LSODISPLAYCURT': //view curriculum details
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATL', objectId: nodeId, oType: 'DC', parentType: nodeType, displayMode: 'display'}));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'DC',
                    parentType: nodeType,
                    displayMode: 'display',
                    disma: disma,
                    begda:begda,
                    okCode: okCode
                }));
                break;
            case 'LSODISPLAYC': //view course session details
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATL', objectId: nodeId, oType: 'E', parentType: 'E', displayMode: 'display'}));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'E',
                    parentType: 'E',
                    displayMode: 'display',
                    disma: disma,
                    begda:begda,
                    okCode: okCode
                }));
                break;
            case 'LSODISPLAYCUR': //view curriculum session details
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATL', objectId: nodeId, oType: 'EC', parentType: 'EC', displayMode: 'display'}));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'EC',
                    parentType: 'EC',
                    displayMode: 'display',
                    disma: disma,
                    begda:begda,
                    okCode: okCode
                }));
                break;
            case 'LSOPREBKBOOK': //prebook-book participants (course)
                //document.fire('EWS:openApplication', $H({ app: 'BOOK', allSessions: '', employee: '', isDelete: '', oType: 'D', training: nodeId, prevApp: 'CATL' }));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    allSessions: '',
                    employee: '',
                    isDelete: '',
                    oType: 'D',
                    training: nodeId,
                    disma: disma,
                    okCode: okCode
                }));
                break;
            case 'LSOBOOKCUR': // book participants (curriculum)
                //document.fire('EWS:openApplication', $H({ app: 'CUR', allSessions: '', employee: '', isDelete: '', oType: 'DC', training: nodeId, prevApp: 'CATL' }));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    allSessions: '',
                    employee: '',
                    isDelete: '',
                    oType: 'DC',
                    training: nodeId,
                    disma: disma,
                    okCode: okCode
                }));
                break;
            default:
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATL', objectId: nodeId}));
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

    returnSeveralCourses: function() {
        this.returnHash = new Hash();
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
        this.popUpApplication.close();
        delete this.popUpApplication;
        if (this.returnHash.size() != 0) {
            document.fire('EWS:returnSelected'+this.screen, $H({ hash: this.returnHash, cont: this.cont, InScreen: this.screen, sec: this.sec }));
        }
        this.close();        

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
        document.fire('EWS:returnSelected'+this.screen, $H({ hash: this.returnHash, cont: this.cont, InScreen: this.screen, sec: this.sec }));

        this.popUpApplication.close();
        delete this.popUpApplication;
        this.close();
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
        document.stopObserving(this.applicationId + ':action', this.actionClickedBinding);
        ///mvv
        document.stopObserving('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
        this.returnHash = new Hash();
    }

});