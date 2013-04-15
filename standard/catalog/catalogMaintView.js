var CATLMAINTVIEW = Class.create(GenericCatalog, {
    cancelReasonsService: "GET_CAN_REAS",
    cancelCourseService: "CANCEL_COURSE",
    firmlyBookCourseService: "FIRMLY_BOOK",
    getCatSessionsService: 'GET_CATSESSION',
    getNavLinkService: 'GET_MAIN_LINK',
    returnHash: new Hash(),
    //bookingViewContainerChild: 'TM_L_CTD',
    /*
    *@method initialize
    *@param $super: the superclass: GenericCatalog
    *@desc instantiates the app
    */
    initialize: function($super, options) {
        $super(options, {
            containerParent: 'LRN_CAT',
            containerChild: 'TM_L_CTM',
            initialService: 'GET_CAT_ROOTS',
            getNodeChildrenService: 'GET_CAT_CHILD',
            searchService: 'GET_CAT_SEAR',
            searchedNodeSelectedService: 'GET_CAT_PAR',
            nodeClickedService: 'GET_CAT_ACTIO',
            applicationId: 'CATLMAINTVIEW'
        });
        this.actionClickedBinding = this.actionClicked.bindAsEventListener(this);
        this.cancelCourseConfBoxButtonBinding = this.cancelCourseConfBoxButton.bindAsEventListener(this);
        this.employeeSelectedAdvSearchBinding = this.reloadTree.bindAsEventListener(this);
    },

    /*
    *@method run
    *@param $super: the superclass: GenericCatalog
    * which have changed.
    */
    run: function($super, args) {
        $super(args);
        document.observe("EWS:cancelCourseReasonAutocompleter_resultSelected", this.cancelCourseConfBoxButtonBinding);
        document.observe(this.applicationId + ':action', this.actionClickedBinding);
        document.observe('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
    },
    setHTML: function(data) {
        if (!Object.isEmpty(data.EWS.o_root)) {
            this.json = data;
            this.data = this.handleData(data);
            this.labels = this.json.EWS.labels.item
            this.virtualHtml.insert(
            //"<div id='" + this.applicationId + "_level1' class='genCat_level1'></div>" +
					    "<div id='" + this.applicationId + "_level1_links' class='genCat_level1'></div>" +
					    "<div id='" + this.applicationId + "_level2' class='genCat_level2 trainingCat_level2'></div>" +
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
                idButton: buttonsAnswer[i]['@views']+'_button',
                label: buttonsAnswer[i]['@label_tag'],
                handlerContext: this,
                className: 'getContentLinks application_action_link',
                handler: this.openNavApp.bind(this, buttonsAnswer[i]['@action']),
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
                tabId: this.hashOfButtons.get(action).tarId,
                view: this.hashOfButtons.get(action).views
            }
        }));
    },
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
    *@description It sets the second HTML level (the autoCompleter one)
    */
    setAutoCompleterDiv: function() {
        this.autoCompleterLabel = new Element('span', { className: 'application_main_title3' });
///        this.radioButtonsGroup = new Element('div', { id: this.applicationId + '_radioButtonsGroup', className: 'genCat_radioButtonsGroup' });
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.autoCompleterLabel.update('Autocompleter Label').wrap('div', { className: 'genCat_label trainingCat_label' })); //this.data.autocompleterLabel));
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert("<div class='application_catalog_genCat_comp' id='" + this.applicationId + "_autocompleter'></div>");        
     //   this.virtualHtml.down('div#' + this.applicationId + '_level2').insert("<div class='genCat_comp' id='" + this.applicationId + "_autocompleter'></div>");
///        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.radioButtonsGroup);
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
/*        var cont = 0;
        objectToArray(this.json.EWS.o_legend.item).each(function(element) {
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
*/        
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
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert("<div><div class='application_action_link catalogFilterOptionsLink2' id='" + this.applicationId + "_filterOptionsLink'>" + global.getLabel('filterOptions') + "</div>"
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
        aux = { events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' }), defaultDate: objectToSap(this.datePickerBeg.actualDate.year()).gsub('-', '') };
        this.virtualHtml.down('[id=' + this.applicationId + '_filterOptionsLink]').observe("click", this.toggleFilterOptions.bindAsEventListener(this));
        this.virtualHtml.down('[id=' + this.applicationId + '_filterOptions]').hide();
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
        //2. course
        aux.legend.push({ img: "application_course", text: global.getLabel('E') }); 
        //3. green bar
        aux.legend.push({ img: "application_learning_statusBarGreen", text: global.getLabel('Green') });       
        //4. course type
        for (i = 0; i < itemsInLegend.length; i++) {
            if (itemsInLegend[i]['@id'] == 'D')
                aux.legend.push({ img: this.CLASS_OBJTYPE.get('D'), text: itemsInLegend[i]['@value'] }); 
        }        
        //5. insert curr           
        aux.legend.push({ img: "application_curriculum", text: global.getLabel('EC') });
        //6. yellow bar     
        aux.legend.push({ img: "application_learning_statusBarYellow", text: global.getLabel('Yellow') });
        //7. Curr type
        for (i = 0; i < itemsInLegend.length; i++) {
            if (itemsInLegend[i]['@id'] == 'DC')
                aux.legend.push({ img: this.CLASS_OBJTYPE.get('DC'), text: itemsInLegend[i]['@value'] }); 
        }  
        //8. Empty bar      
        aux.legend.push({ img: "application_learning_statusBarEmpty", text: global.getLabel('statusbar') });
        //9. Red bar        
        aux.legend.push({ img: "application_learning_statusBarRed", text: global.getLabel('Red') });
        this.virtualHtml.down('div#' + this.applicationId + '_level4').update(getLegend(aux));
        this.legend = this.virtualHtml.down('div#' + this.applicationId + '_level4');
    },
    /**     
    *@description It sets the first HTML level 
    */
    setTitleDiv: function() {
        this.title = new Element('span', { className: 'application_main_title' });
        this.virtualHtml.down('div#' + this.applicationId + '_level1').insert(this.title.update(global.getLabel('trainingsCatalogTitle')));
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
                if(booked>=total)
                    waitingListInfo = "<span class='catalogWaitingPeople'>" + global.getLabel('waiting')+": "+ wait + "</span>";
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
                                                            "<span class='treeHandler_text_node_content "+icon+" genCat_iconInTree catalogMarginIcon'></span>" + 
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
                this.virtualHtml.down("div#" + this.applicationId + "_" + ajaxId + "_" + i + "_ratingBar").update(getRating(total, booked, -1,false,optimum));

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
        var xml = "<EWS>" +
						"<SERVICE>" + this.nodeClickedService + "</SERVICE>" +
						"<OBJECT TYPE='" + oType + "'>" + sessionId + "</OBJECT>" +
						"<DEL></DEL>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
						"</PARAM>" +
				   "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'showSessionActions', ajaxID: {nodeId: this.applicationId + "_" + courseId + "_" + sessionId + "_session", objType: oType} }));

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
                var nodeId = ajaxId.nodeId.split("_")[4];
                var objectType= ajaxId.objType;
                var span = new Element('div', { 'class': 'application_action_link genCat_balloon_span' }).insert(text);
                html.insert(span);
                span.observe('click', document.fire.bind(document, this.applicationId + ":action", $H({
                    name: name,
                    nodeId: nodeId,
                    application: app,
                    okCode: okCode,
                    tabId: tabId,
                    view: view,
                    disma: disma,
                    objectType: objectType
                })));
            } .bind(this));
        } else {
            var span = new Element('div', { 'class': 'genCat_balloon_span' }).insert(global.getLabel('noActionsAvailable'));
            html.insert(span);
        }
        balloon.showOptions($H({
            domId: ajaxId.nodeId,
            content: html
        }));
    },
    /**     
    *@description It executes the code that belongs to the action clicked 
    */
    actionClicked: function(parameters) {
        var param = getArgs(parameters);
        var name = param.get('name');
        var nodeId = param.get('nodeId');
        var nextApp = param.get('application');
        var okCode = param.get('okCode');
        var nodeType = param.get('nodeType');
        var tabId = param.get('tabId') ? param.get('tabId') : param.get('tartb');
        var view = param.get('view');
        var disma = param.get('disma');
        var begDay = this.datePickerBeg.getDateAsArray().day;
        var begMonth = this.datePickerBeg.getDateAsArray().month;
        var begYear = this.datePickerBeg.getDateAsArray().year;
        if (begDay.length == 1)
            begDay = '0' + begDay;
        if (begMonth.length == 1)
            begMonth = '0' + begMonth;
        var begda = begYear + '-' + begMonth + '-' + begDay;
        var objType = param.get('objectType');
        //var okcod = param.get('okcod');        
        if (Object.isEmpty(okCode))
            okCode = '';
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
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'L', parentType: nodeType, displayMode: 'display' }));
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
                    begda: begda,
                    okCode: okCode
                }));
                break;
            case 'LSODISPLAYCT': //view course details
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'D', parentType: nodeType, displayMode: 'display' }));
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
                    begda: begda,
                    okCode: okCode
                }));
                break;
            case 'LSODISPLAYCURT': //view curriculum details
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'DC', parentType: nodeType, displayMode: 'display' }));
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
                    begda: begda,
                    okCode: okCode
                }));
                break;
            case 'LSODISPLAYCUR': //view curriculum details
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'DC', parentType: nodeType, displayMode: 'display' }));
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
                    begda: begda,
                    okCode: okCode
                }));
                break;
            case 'LSODISPLAYC': //view course session details
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'E', parentType: 'E', displayMode: 'display' }));
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
                    begda: begda,
                    okCode: okCode
                }));
                break;
            case 'LSOPREBKBOOK': //prebook-book participants (course)
                //document.fire('EWS:openApplication', $H({ app: 'BOOK', allSessions: '', employee: '', isDelete: '', oType: 'D', training: nodeId, prevApp: 'CATLMAINTVIEW' }));
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
                //document.fire('EWS:openApplication', $H({ app: 'CUR', allSessions: '', employee: '', isDelete: '', oType: 'DC', training: nodeId, prevApp: 'CATLMAINTVIEW' }));
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
            case 'LSOFOLLOWUP': //follow up a firmly booked course
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId }));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view,
                        nodeId: nodeId                        
                    },
                    objectId: nodeId,
                    objectType: objType
                }));
                break;
            case 'LSOFIRMLYBOOK': //firmly book a planned course
                this.firmlyBookCourse();
                balloon.hide();
                break;
            case 'LSOCANCELC': //cancel a course
                this.oType = 'E';
                this.getCancelReasons();
                balloon.hide();
                break;
            case 'LSOCANCELCUR': //cancel a curriculum
                this.oType = 'EC';
                this.getCancelReasons();
                balloon.hide();
                break;
            case 'LSOCREATECG': //create a course groupe   
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'L', parentType: nodeType, displayMode: 'create', okCode: okCode }));
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
                    displayMode: 'create',
                    okCode: okCode
                }));
                break;
            case 'LSOCREATECT': //create a course type   
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'D', parentType: nodeType, displayMode: 'create', okCode: okCode }));
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
                    displayMode: 'create',
                    okCode: okCode
                }));
                break;
            case 'LSOCREATECURT': //create a curriculum type   
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'DC', parentType: nodeType, displayMode: 'create', okCode: okCode }));
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
                    displayMode: 'create',
                    okCode: okCode
                }));
                break;
            case 'LSOCREATEC': //create a course session   
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'E', parentType: 'D', displayMode: 'create', okCode: okCode }));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'E',
                    parentType: 'D',
                    displayMode: 'create',
                    okCode: okCode
                }));
                break;
            case 'LSOCREATECUR': //create a curriculum session   
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'EC', parentType: 'DC', displayMode: 'create', okCode: okCode }));
                balloon.hide();
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: 'EC',
                    parentType: 'DC',
                    displayMode: 'create',
                    okCode: okCode
                }));
                break;
            case 'LSOMAINTAINCG': //maintain a course groupe   
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'L', parentType: nodeType, displayMode: 'edit', okCode: okCode }));
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
                    displayMode: 'edit',
                    begda: begda,
                    okCode: okCode
                }));
                break;
            case 'LSOMAINTAINCT': //maintain a course type  
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'D', parentType: nodeType, displayMode: 'edit', okCode: okCode }));
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
                    displayMode: 'edit',
                    begda: begda,
                    okCode: okCode
                }));
                break;
            case 'LSOMAINTAINCURT': //maintain a curriculum type  
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'DC', parentType: nodeType, displayMode: 'edit', okCode: okCode }));
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
                    displayMode: 'edit',
                    begda: begda,
                    okCode: okCode
                }));
                break;
            case 'LSOMAINTAINC': //maintain a planned course session  
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'E', parentType: 'E', displayMode: 'edit', okCode: okCode }));
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
                    displayMode: 'edit',
                    begda: begda,
                    okCode: okCode
                }));
                break;
            case 'LSOMAINTAINCUR': //maintain a curriculum session  
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'CATLMAINTVIEW', objectId: nodeId, oType: 'EC', parentType: 'EC', displayMode: 'edit', okCode: okCode }));
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
                    displayMode: 'edit',
                    begda: begda,
                    okCode: okCode
                }));
                break;
            case 'LSODELETECG': //delete a course group 
                this.genericDelete('L', nodeId, name, nextApp, global.getLabel('delete_CourseGroupInfo'), okCode);
                balloon.hide();
                break;
            case 'LSODELETECT': //delete a course type  
                this.genericDelete('D', nodeId, name, nextApp, global.getLabel('delete_CourseTypeInfo'), okCode);
                balloon.hide();
                break;
            case 'LSODELETECURT': //delete a curriculum type  
                this.genericDelete('DC', nodeId, name, nextApp, global.getLabel('delete_CurriculumTypeInfo'), okCode);
                balloon.hide();
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
    * @description Method that retrieves all the cancel reasons
    */
    getCancelReasons: function(event, oType) {
        if (Object.isEmpty(this.jsonReasons)) {
            var xmlReasons = "<EWS><SERVICE>" + this.cancelReasonsService + "</SERVICE></EWS>";
            this.makeAJAXrequest($H({ xml: xmlReasons, successMethod: 'cancelCourse' }));
        } else {
            this.cancelCourse(this.jsonReasons);
        }
    },
    /**
    * @description Method that cancel a course after the user confirmation
    */
    cancelCourse: function(json) {
        var cancelcourseHtml = "<div>"
                               + "<div>" + global.getLabel('cancellationReason') + "</div>"
                               + "<div><div id='cancelcourseAutocompleter' style='margin-top:10px;margin-bottom:10px;'></div></div>"
                               + "<div class ='dynamicFieldsPanelTable'>" + global.getLabel('cancelCourseConf') + "</div>"
                               + "</div>";
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(cancelcourseHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function() {
            if (_this)
                _this.cancelCourseRequest();
            cancelCoursePopUp.close();
            delete cancelCoursePopUp;
        };
        var callBack3 = function() {
            cancelCoursePopUp.close();
            delete cancelCoursePopUp;
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
        this.ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = this.ButtonObj.getButtons();
        this.ButtonObj.disable('Yes');
        //insert buttons in div
        contentHTML.insert(buttons);

        var cancelCoursePopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    cancelCoursePopUp.close();
                    delete cancelCoursePopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 600
        });
        cancelCoursePopUp.create();

        // Autocompleter initialization
        if (!Object.isEmpty(json.EWS)) {//first run of cancelcourse, building autocompleter structure
            this.jsonReasons = {
                autocompleter: {
                    object: [],
                    multilanguage: {
                        no_results: 'No results found',
                        search: 'Search'
                    }
                }
            }
            for (var i = 0; i < json.EWS.o_values.item.length; i++) {
                var data = json.EWS.o_values.item[i]['@id'];
                var text = json.EWS.o_values.item[i]['@value'];
                this.jsonReasons.autocompleter.object.push({
                    data: data,
                    text: text
                });
            }
        }
        this.reasonsAutocompleter = new JSONAutocompleter('cancelcourseAutocompleter', {
            showEverythingOnButtonClick: true,
            timeout: 8000,
            templateOptionsList: '#{text}',
            events: $H({ onResultSelected: 'EWS:cancelCourseReasonAutocompleter_resultSelected' })
        }, this.jsonReasons);

    },
    /**
    * @description Fired when it has been chosen a value in the reasons autocompleter, enables/disables the 'yes' button
    */
    cancelCourseConfBoxButton: function(args) {
        if (!Object.isEmpty(getArgs(args)) && (getArgs(args).isEmpty == false)) {
            this.ButtonObj.enable('Yes');
            this.reasonChosen = getArgs(args).idAdded;

        } else {
            this.ButtonObj.disable('Yes');
        }
    },
    /**
    * @description Builds the xml and send it to SAP for the cancel request
    */
    cancelCourseRequest: function() {
        var xml = "<EWS>"
                 + "<SERVICE>" + this.cancelCourseService + "</SERVICE>"
                 + "<OBJECT TYPE=\"" + this.oType + "\">" + this.nodeId + "</OBJECT>"
                 + "<O_REASON>" + this.reasonChosen + "</O_REASON>"
                 + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'cancelCourseAnswer' }));
    },
    /**
    * @description Receives the answer from SAP about the cancel course request.
    */
    cancelCourseAnswer: function(answer) {
        if (answer.EWS.o_status) {
            if (answer.EWS.o_status == "X")
                this.backTop();
        }
    },
    /**
    * @description Method that firmly books a course after the user confirmation
    */
    firmlyBookCourse: function() {
        var firmlybookCourseHtml = "<div>"
                               + "<span>" + global.getLabel('sessionActivated') + "</span><br>"
                               + "<div class='firmlyBookInfo'>"
                                   + "<span>-&nbsp;" + global.getLabel('noChangesSession') + "</span><br>"
                                   + "<span>-&nbsp;" + global.getLabel('bookingsStillDone') + "</span><br>"
                               + "</div>"
                               + "<span>" + global.getLabel('firmlyBookConf') + "</span>"
                               + "</div>";
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(firmlybookCourseHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function() {
            if (_this)
                _this.firmlybookCourseRequest();
            firmlyBookPopUp.close();
            delete firmlyBookPopUp;
        };
        var callBack3 = function() {
            firmlyBookPopUp.close();
            delete firmlyBookPopUp;
        };
        var aux = {
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
        buttonsJson.elements.push(aux);
        buttonsJson.elements.push(aux3);
        var ButtonObj2 = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj2.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);

        var firmlyBookPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    firmlyBookPopUp.close();
                    delete firmlyBookPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 600
        });
        firmlyBookPopUp.create();
    },
    /**
    * @description Builds the xml and send it to SAP for the firmly book request
    */
    firmlybookCourseRequest: function() {
        var xml = "<EWS>"
                 + "<SERVICE>" + this.firmlyBookCourseService + "</SERVICE>"
                 + "<OBJECT TYPE=\"E\">" + this.nodeId + "</OBJECT>"
                 + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'firmlybookCourseAnswer' }));
    },
    /**
    * @description Receives the answer from SAP about the firmly book request.
    */
    firmlybookCourseAnswer: function(answer) {
        if (answer.EWS.o_status) {
            if (answer.EWS.o_status == "X")
                this.backTop();
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
        document.stopObserving('EWS:cancelCourseReasonAutocompleter_resultSelected', this.cancelCourseConfBoxButtonBinding);
        document.stopObserving(this.applicationId + ':action', this.actionClickedBinding);
        document.stopObserving('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
    }

});