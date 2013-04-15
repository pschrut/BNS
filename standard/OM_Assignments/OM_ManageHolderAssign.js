/**
 *@fileOverview OM_HolderAssign.js
 *@description It contains a class with functionality for managing holder assignments.
 */
/**
 *@constructor
 *@description Class with functionality for managing holder assignments.
 *@augments Application
 */
var OM_ManageHolderAssign_standard = Class.create(Application,
/** 
*@lends OM_ManageHolderAssign_standard 
*/
{   
    /**
    *@type String
    *@description Service used to mintain an assignment.
    */
    getMaintAssignService: "MAINT_ASSIGN",
    /**
    *@type String
    *@description Search objects service
    */
    searchObjectsService: 'SEARCH_OBJECTS',
    /**
    *@type Hash
    *@description Elements received 
    */
    hashAC: new Hash(),
    /**
    *@type Hash
    *@description Elements related 
    */
    hashOfElementsRelated: new Hash(),
    /**
    *@type Hash
    *@description Elements to send 
    */
    hashToSend: new Hash(),
    /**
    *@type Long
    *@description Number of elements checked
    */
    countOfChecked: 0,
    /**
    *@type AutocompleteSearch
    *@description Autocompleter of position
    */
    positionsAutocompleter: null,
    /**
    *@type String
    *@description Autocompleter value
    */
    positionsAutocompleterValue: "",
    /**
    *@type Long
    *@description Autocompleter value
    */
    positionsAutocompleterDefaultValue: "",
    /**
    *@type String
    *@description Type of assign
    */
    assignType: "",
    /**
    *@type String
    *@description Initial date format
    */
    dateFormatIn: 'yyyy-MM-dd',
    /**
    *@type Boolean
    *@description Tells if the table is initialized
    */
    tableShowed: false,
    /**
    *Constructor of the class OM_HolderAssign
    */
    initialize: function($super, args) {
        $super(args);
        this.setSearchTextBinding = this.setSearchText.bindAsEventListener(this);
        this.makeSimpleSearchBinding = this.makeSimpleSearch.bindAsEventListener(this);
    },
    /**
    *@description Starts OM_HolderAssign
    */
    run: function($super, args) {
        $super();
        this.OM_MaintHolderAssignContainer = this.virtualHtml;
        //read args and values from global        
        this.dateFormat = global.dateFormat;
        this.objectID = args.get('node');
        //hide balloons
        if (balloon.isVisible())
            balloon.hide();
        //we create the first DOM
        if (!this.firstRun) {
            this.countOfChecked = 0;
        }
        //create the html structure of the application 
        this.createHtml();
        this.callToGetAssign();
        //events to control autocompleter
        document.observe('EWS:autocompleter_getNewXML', this.setSearchTextBinding);
        document.observe('EWS:autocompleter_resultSelected', this.makeSimpleSearchBinding);
    },
    /**
    *@description Stops OM_HolderAssign
    */
    close: function($super) {
        $super();
        document.stopObserving('EWS:autocompleter_getNewXML', this.setSearchTextBinding);
        document.stopObserving('EWS:autocompleter_resultSelected', this.makeSimpleSearchBinding);
    },
    /*
    * @method createHtml
    * @description Creates the first screen of the maintHolderAssign
    */
    createHtml: function() {
        //title of the application
        var title = global.getLabel('manageHA');
        //we create several part for the title, buttons, table, detail...            
        var html = "<span class='application_main_title'>" + title + "</span>" +
                       "<div id='OMholderAssign_emptyTable' class='application_main_soft_text OMholderAssignNoHolder'></div>" +
                       "<div id='OMholderAssign_orgUnits' class='OMholderAssign_oUDiv'></div>" +
                       "<div id='OMholderAssign_actions'></div>" +
                       "<div id='OMholderAssign_addOcc' class='OMholderAssign_detailsDiv'></div>" +
                       "<div id='OMholderAssign_buttons'></div>";
        this.OM_MaintHolderAssignContainer.update(html);
        this.OM_MaintHolderAssignContainer.down('div#OMholderAssign_addOcc').hide();
        //creating the table that contains the relations
        var table = "<table class='sortable' id='OMholderAssign_orgUnitsTable'>" +
                            "<thead>" +
                                "<tr>" +
                                    "<th class='OMholderAssign_orgUnitsTable_colCheck'></th>" +
                                    "<th class='OMholderAssign_orgUnitsTable_colOrgUnit'>" + global.getLabel('holder') + "</th>" +
                                    "<th class='OMholderAssign_orgUnitsTable_colPosition'>" + global.getLabel('position') + "</th>" +
                                    "<th class='OMholderAssign_orgUnitsTable_colRelation'>" + global.getLabel('staffing%') + "</th>" +
                                    "<th class='OMholderAssign_orgUnitsTable_colDates'>" + global.getLabel('valDate') + "</th>" +
                                    "<th class='OMholderAssign_orgUnitsTable_colHolder'>" + global.getLabel('action') + "</th>" +
                                "</tr>" +
                            "</thead>" +
                            "<tbody id='OMholderAssign_orgUnitsTable_body'></tbody>" +
                        "</table>";
        this.OM_MaintHolderAssignContainer.down('div#OMholderAssign_orgUnits').insert(table);

        this.OM_MaintHolderAssignContainer.down('div#OMholderAssign_emptyTable').show();
        this.OM_MaintHolderAssignContainer.down('div#OMholderAssign_orgUnits').hide();
        this.OM_MaintHolderAssignContainer.down('div#OMholderAssign_actions').hide();
        //clickable actions
        var actions = "<span id='OMholderAssign_actions_delete' class='OM_MaintHolder_link application_main_soft_text'>" + global.getLabel('delete') + "</span>" +
                          "<span id='OMholderAssign_actions_delimit' class='OM_MaintHolder_link application_main_soft_text'>" + global.getLabel('delimit') + "</span>" +
                          "<span id='OMholderAssign_actions_addOcc' class='application_action_link OMholderAssign_create'>" + global.getLabel('additOcup') + "</span>";
        this.OM_MaintHolderAssignContainer.down('div#OMholderAssign_actions').insert(actions);
        this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_addOcc').observe('click', this.showHolderAssignScreen.bind(this, "addOcc"));
        //exit  button
        var json = {
                        elements:[],
                        mainClass:'OMholderAssign_button OMposAssign_shown'
                    };
        var aux =   {
                idButton:'OMholderAssign_button_exit',
                label: global.getLabel('exit'),
                handlerContext: null,
                handler: this._goBack.bind(this),
                type: 'button',
                standardButton:true
              };                 
        json.elements.push(aux); 
        var ButtonJExit=new megaButtonDisplayer(json); 
        this.OM_MaintHolderAssignContainer.down('div#OMholderAssign_buttons').insert(ButtonJExit.getButtons());
    },
    /*
    * @method _goBack
    * @description Returns to OM_Maintain application
    */
    _goBack: function() {
        document.fire("EWS:openApplication", $H({ app: 'OM_Maintain' }));
    },
    /*
    * @method deleteDelimitHolderAssign
    * @param action: D if delete L if delimit
    * @description function that call deleteDelimitApplication to delete or delimit a relation
    */
    deleteDelimitHolderAssign: function(action) {
        var app = "OM_DeleteDelimit";
        var appToOpen = "OM_ManageHolderAssign";
        var i = 0;
        var _this = this;
        //we loop over the hash with the elements in the table
        this.hashOfElementsRelated.each(function(pair) {
            var a = 0;
            if (_this.hashOfElementsRelated.get(pair.key).checked) {
                var valueInsideHash = pair.value;
                _this.hashToSend.set(i, { relat: valueInsideHash.relat, idToAssign: pair.key, begDate: valueInsideHash.bedda, rsign: "B", sclas: "S", endDate: valueInsideHash.endda });
                i++;
            }
        });
        if (this.hashToSend.size() != 0) {
            document.fire("EWS:openApplication", $H({ mode: "popUp", app: app, appToOpen: appToOpen, action: action, node: this.objectID, objectType: "P", hash: this.hashToSend }));
        }
    },
    /*
    * @description Calls the service to fill the table
    */
    callToGetAssign: function() {
        //call to sap 
        var xmlToGetAssign = "<EWS>" +
                                        "<SERVICE>" + this.getMaintAssignService + "</SERVICE>" +
                                        "<OBJECT TYPE='P'>" + this.objectID + "</OBJECT>" +
                                        "<DEL></DEL>" +
                                        "<PARAM>" +
                                            "<O_ACTION>V</O_ACTION>" +
                                            "<O_RELATIONS>" +
                                            "<YGLUI_TAB_RELATIONS sclas='S'/>" +
                                            "</O_RELATIONS>" +
                                        "</PARAM>" +
                                     "</EWS>";
        this.makeAJAXrequest($H({ xml: xmlToGetAssign, successMethod: 'processCallToGetAssign' }));
    },
    /*
    * @description Fills the table with the data from SAP
    * @param json: {JSON} The JSON object retrieved from the service
    */
    processCallToGetAssign: function(json) {
        var value = objectToArray(json.EWS.o_result.yglui_tab_relations_output);
        //if there aren't assignments
        if (value.length == 0) {
            this.virtualHtml.down('[id=OMholderAssign_emptyTable]').update(global.getLabel('emptyHolderAssign'));
        } else {
            //remove the contain of the table
            this.OM_MaintHolderAssignContainer.down('tbody#OMholderAssign_orgUnitsTable_body').update("");
            //we make a loop over the elements returned from SAP, to fill the table
            for (var i = 0; i < value.size(); i++) {
                var employeeHolder = value[i]["@stext_orig"];
                //get the name of the holder employee
                if (i == 0) {
                    this.employeeHolder = employeeHolder;
                }
                var positionHolder = value[i]["@stext_dest"];
                this.begDatePosition = value[i]["@begda"];
                this.endDatePosition = value[i]["@endda"];
                var bedDateHolder = Date.parseExact(value[i]["@begda"], 'yyyy-MM-dd').toString(this.dateFormat);
                var endDateHolder = Date.parseExact(value[i]["@endda"], 'yyyy-MM-dd').toString(this.dateFormat);
                var percentageHolder = value[i]["@prozt"].gsub("\\.0", "");
                this.idOfPosition = value[i]["@sobid"];
                this.relationCode = value[i]["@relat"];
                this.hashOfElementsRelated.set(this.idOfPosition, { relat: this.relationCode, bedda: this.begDatePosition, endda: this.endDatePosition });
                this.OM_MaintHolderAssignContainer.down('tbody#OMholderAssign_orgUnitsTable_body').insert(
                        "<tr>" +
                            "<td><input id='OMManageHolderAssign_check_" + this.idOfPosition + "' type='checkbox'/></td>"
                            + "<td>" + employeeHolder + "</td>"
                            + "<td><div>" + positionHolder + "</div></td>"
                            + "<td>" + percentageHolder + "</td>"
                            + "<td>" + bedDateHolder + " - " + endDateHolder + "</td>"
                            + "<td id='" + this.idOfPosition + "_" + i + "'><div class='application_action_link'>" + global.getLabel('transfer') + "</div></td>"
                         + "</tr>"
                    );
                //Transfer link
                this.OM_MaintHolderAssignContainer.down('[id=' + this.idOfPosition + '_' + i + ']').observe('click', this.showHolderAssignScreen.bind(this, global.getLabel('transfer'), this.idOfPosition, this.begDatePosition, this.endDatePosition));
            }
            this.OM_MaintHolderAssignContainer.down('tbody#OMholderAssign_orgUnitsTable_body').observe("click", function(event) {
                var element = event.element();
                var idOfElement = element.identify();
                if (idOfElement.include("OMManageHolderAssign_check_"))
                    this.inputChecked(idOfElement);
            } .bindAsEventListener(this));

            if (this.OM_MaintHolderAssignContainer.down('tbody#OMholderAssign_orgUnitsTable_body').rows.length != 0) {
                this.OM_MaintHolderAssignContainer.down('div#OMholderAssign_emptyTable').hide();
                this.OM_MaintHolderAssignContainer.down('div#OMholderAssign_orgUnits').show();
                this.OM_MaintHolderAssignContainer.down('div#OMholderAssign_actions').show();
            }
            if (!this.tableShowed) {
                TableKit.Sortable.init('OMholderAssign_orgUnitsTable');
                this.tableShowed = true;
                TableKit.options.autoLoad = false;
            }
            else
                TableKit.reloadTable('OMholderAssign_orgUnitsTable');
            //draw the hidden screen of assignments
            this.drawScreenAddOccAssignHolder();
        }


    },
    /*
    * @description Defining styles and actions of delete/delimit 
    * @param idOfInput: {String} id of the element
    */
    inputChecked: function(idOfInput) {
        this.countOfChecked;
        if (this.OM_MaintHolderAssignContainer.down('input#' + idOfInput + '').checked) {
            this.hashOfElementsRelated.get(idOfInput.split('_')[2]).checked = true;
            this.countOfChecked++;
            this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delete').addClassName('application_action_link');
            this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delete').removeClassName('OM_MaintHolder_link application_main_soft_text');
            if (this.countOfChecked == 1) {
                this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delimit').removeClassName('OM_MaintHolder_link application_main_soft_text');
                this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delimit').addClassName('application_action_link');
            }
            else {
                this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delimit').removeClassName('application_action_link');
                this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delimit').addClassName('OM_MaintHolder_link application_main_soft_text');
            }
        }
        else {
            this.countOfChecked--;
            this.hashOfElementsRelated.get(idOfInput.split('_')[2]).checked = false;
            if (this.countOfChecked == 1) {
                this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delimit').removeClassName('OM_MaintHolder_link application_main_soft_text');
                this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delimit').addClassName('application_action_link');
            }
            if (this.countOfChecked == 0) {
                this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delete').removeClassName('application_action_link');
                this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delimit').removeClassName('application_action_link');
                this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delete').addClassName('OM_MaintHolder_link application_main_soft_text');
                this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delimit').addClassName('OM_MaintHolder_link application_main_soft_text');
            }
        }
        if (this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delete').hasClassName('application_action_link'))
            this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delete').observe('click', this.deleteDelimitHolderAssign.bind(this, 'D'));
        else
            this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delete').stopObserving();
        if (this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delimit').hasClassName('application_action_link'))
            this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delimit').observe('click', this.deleteDelimitHolderAssign.bind(this, 'L'));
        else
            this.OM_MaintHolderAssignContainer.down('span#OMholderAssign_actions_delimit').stopObserving();
    },
    /*
    * @description Shows the detail screen of record clicked
    * @param assign: {String} Type of assign (transfer or add occ)
    * @param posOldId: {String} id of the old position
    * @param begdaOld: {String} begda value of the old position
    * @param enddaOld: {String} enndda value of the old position
    */
    showHolderAssignScreen: function(assign, posOldId, begdaOld, enddaOld) {
        //show the screen
        this.OM_MaintHolderAssignContainer.down('div#OMholderAssign_addOcc').show();
        if (assign == global.getLabel('transfer')) {
            //update global variable about link clicked
            this.assignType = global.getLabel('transfer');
            //update the subtitle of the screen
            var subtitle = global.getLabel('assignHolder') + " - " + global.getLabel('transfer');
            //save the info in globals variables
            this.posOldId = posOldId;
            this.begdaOld = begdaOld;
            this.enddaOld = enddaOld;
        } else {
            //update global variable about link clicked
            this.assignType = global.getLabel('additOcup');
            //update the subtitle of the screen
            var subtitle = global.getLabel('assignHolder') + " - " + global.getLabel('additOcup');
        }
        this.virtualHtml.down('[id=OMholderAssign_detailsTitle]').update(subtitle);
        //clear the autocompleter value
        this.positionsAutocompleter.clearInput();
        //hide the button exit
        this.virtualHtml.down('div#OMholderAssign_button_exit').hide();
    },
    /*
    * @description Draw screen of details of an assign
    */
    drawScreenAddOccAssignHolder: function() {
        //title 
        var subtitle = global.getLabel('assignHolder');
        var details = "<div id='OMholderAssign_details_title' class='application_header_bar'><span id='OMholderAssign_detailsTitle' class='OMholderAssign_detailsTitle'>" + subtitle + "</span></div>";
        this.virtualHtml.down('[id=OMholderAssign_addOcc]').insert(details);
        //initialize the percentage staff
        this.staff = '100';
        //create the html structure
        var html = "<div class='OM_MaintHolder_partDiv'>" +
                            "<span class='application_main_text OM_MaintHolder_DescrPartValDateText'>" + global.getLabel('valDate') + "</span>" +
                            "<span class='application_main_text OM_MaintHolder_calendarTextField'>" + global.getLabel('from') + "</span>" +
                            "<div class='OM_MaintHolder_calendar' id='OM_MaintHolder_form_begCal'></div>" +
                            "<span class='application_main_text OM_MaintHolder_calendarTextField'>" + global.getLabel('to') + "</span>" +
                            "<div class='OM_MaintHolder_calendar' id='OM_MaintHolder_endCal'></div>" +
                       "</div>" +
                       "<div class='OM_MaintHolder_partDiv'>" +
                            "<span class='application_main_text OM_MaintHolder_DescrPartText'>" + global.getLabel('name') + "</span>" +
                            "<span class='OM_MaintHolder_text'>" + this.employeeHolder + "</span>" +
                       "</div>" +
                       "<div class='OM_MaintHolder_partDiv'>" +
                               "<span class='application_main_text OM_MaintHolder_DescrPartText'>" + global.getLabel('sttaffingPerc') + "</span>" +
                               "<input type='text' id='OM_MaintHolder_staffingField' class='OM_MaintHolder_StaffingField' value='" + this.staff + "'></input>" +
                               "<span class='application_main_text OM_MaintHolder_PercentegeText'>" + global.getLabel('%') + "</span>" +
                       "</div>" +
                       "<div id='OM_MaintHolder_positionDiv' class='OM_MaintHolder_partDiv'>" +
                               "<span class='application_main_text OM_MaintHolder_DescrPartText'>" + global.getLabel('position') + "</span>" +
                               "<div id='OM_MaintHolder_autocompleterPositionsField' class='OM_MaintHolder_autocompleterWidth'></div>" +
                       "</div>" +
                       "<div id='OM_MaintHolder_Buttons' class='OM_MaintHolder_ButtonsPart'></div>";
        //insert the html structure in the div
        this.virtualHtml.down('[id=OMholderAssign_addOcc]').insert(html);
        
        var json = {
            elements:[]
        };
        var auxSave =   {
            label: global.getLabel('save'),
            idButton:'OM_MaintHolder_saveButton',
            type: 'button',
            className:'OM_MaintHolder_saveButton',
            standardButton:true,
            handlerContext: null,
            handler: this.callToCreateAddOcc.bind(this, '')
        };                 
        json.elements.push(auxSave);
        var auxCancel =   {
            label: global.getLabel('cancel'),
            idButton:'OM_MaintHolder_cancelButton',
            type: 'button',
            className:'OM_MaintHolder_cancelButton',
            standardButton:true,
            handlerContext: null,
            handler: this.cancelButton.bind(this)
        };                 
        json.elements.push(auxCancel);
        var ButtonSaveCancel=new megaButtonDisplayer(json);
        this.virtualHtml.down('[id=OM_MaintHolder_Buttons]').insert(ButtonSaveCancel.getButtons());
        //DatePickers definition
        var fromDate = Date.today().toString('yyyyMMdd');
        var toDate = "99991231"
        this.fromDatePicker = new DatePicker('OM_MaintHolder_form_begCal', {
            defaultDate: fromDate,
            draggable: true,
            manualDateInsertion: true,
            emptyDateValid: true
        });
        this.toDatePicker = new DatePicker('OM_MaintHolder_endCal', {
            defaultDate: toDate,
            draggable: true,
            manualDateInsertion: true
        });
        this.fromDatePicker.linkCalendar(this.toDatePicker);
        //positions autocompleter definition
        var jsonPositions = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        this.positionsAutocompleter = new JSONAutocompleter('OM_MaintHolder_autocompleterPositionsField', {
            showEverythingOnButtonClick: true,
            timeout: 1000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1,
            noFilter: true,
            events: $H({ onGetNewXml: 'EWS:autocompleter_getNewXML',
                onResultSelected: 'EWS:autocompleter_resultSelected'
            })
        }, jsonPositions);
        //if the user clicks on the cancel button
        //this.virtualHtml.down('input#OM_MaintHolder_cancelButton').observe('click', this.cancelButton.bind(this));
        //if the user clicks on the save button
        //this.virtualHtml.down('input#OM_MaintHolder_saveButton').observe('click', this.callToCreateAddOcc.bind(this));
        // Arrow in autocompleter
        this.virtualHtml.down('input#button_OM_MaintHolder_autocompleterPositionsField').observe('click', function() {
            this.positionsAutocompleter.clearInput();
        } .bind(this));
        // Arrow in autocompleter
        this.virtualHtml.down('input#button_OM_MaintHolder_autocompleterPositionsField').observe('click', function() {
            this.positionsAutocompleter.clearInput();
        } .bind(this));
    },
    /*
    * @description Sets the values of position autocompleter
    */
    setSearchText: function() {
        this.positionsAutocompleterValue = this.positionsAutocompleter.element.value;
        this.positionsAutocompleterDefaultValue = this.positionsAutocompleter.element.value;
        // Service restriction
        if (this.positionsAutocompleterValue.length > 12)
            this.positionsAutocompleterValue = this.positionsAutocompleterValue.substring(0, 12);
        this.callToGetOptionsSearch();
    },
    /**
    *@description Asks the backend for positions (autocompleter)
    */
    callToGetOptionsSearch: function() {
        if (Object.isEmpty(this.positionsAutocompleterValue)) {
            this.positionsAutocompleterValue = '*';
        }
        var date = Date.today().toString(this.dateFormatIn);
        // Call to the service
        var xml = "<EWS>" +
                          "<SERVICE>" + this.searchObjectsService + "</SERVICE>" +
                          "<PARAM>" +
                              "<ORG_UNIT>N</ORG_UNIT>" +
                              "<POSITION>Y</POSITION>" +
                              "<COSTCENT>N</COSTCENT>" +
                              "<PERSON>N</PERSON>" +
                              "<O_BEGDA>" + date + "</O_BEGDA>" +
                              "<O_ENDDA>" + date + "</O_ENDDA>" +
                              "<TEXT>" + this.positionsAutocompleterValue + "</TEXT>" +
                              "<MAX>12</MAX>" +
                          "</PARAM>" +
                      "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'buildAutocompleterJSON' }));
    },
    /**
    * @description Fills autocompleter
    * @param json: {JSON} The JSON object retrieved from the service
    */
    buildAutocompleterJSON: function(jsonObject) {
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
        // If we receive a json with results.
        if (jsonObject.EWS.o_objects) {
            var array = objectToArray(jsonObject.EWS.o_objects.yglui_tab_objects);
            for (var i = 0; i < array.length; i++) {
                var idObject = array[i]["@objid"];
                var type = array[i]["@otype"];
                var text = Object.isEmpty(array[i]["@stext"]) ? array[i]["@short"] : array[i]["@stext"];
                var bDate = array[i]["@begda"];
                var eDate = array[i]["@endda"];
                this.hashAC.set(idObject, { type: type, idObject: idObject, text: text, bDate: bDate, eDate: eDate });
            }
            this.hashAC.each(function(pair) {
                var text = Object.isEmpty(pair.value['text']) ? "" : pair.value['text'];
                json.autocompleter.object.push({
                    data: pair.key,
                    text: text
                });
            });
        }
        this.positionsAutocompleter.updateInput(json);
        this.positionsAutocompleter.setDefaultValue(this.positionsAutocompleterDefaultValue, true, false);
        if (jsonObject.EWS.webmessage_text)
            this._infoMethod(jsonObject);
    },
    /**
    *@description Gets elements for the selected object and updates the chart
    *@param {Object} args Information about the autocompleter
    */
    makeSimpleSearch: function(args) {
        if (!Object.isEmpty(getArgs(args)) && (getArgs(args).isEmpty == false)) {
            var elementChosen = this.hashAC.get(getArgs(args).idAdded);
            var positionsId = elementChosen.idObject;
            this.positionsAutocompleterValue = elementChosen.text;
        }
        else
            this.positionsAutocompleterValue = "";
    },
    /**
    *@description Hides the screen
    */
    cancelButton: function() {
        //hide the screen
        this.OM_MaintHolderAssignContainer.down('div#OMholderAssign_addOcc').hide();
        //show the button exit
        this.virtualHtml.down('div#OMholderAssign_button_exit').show();
    },
    /**
    *@description Calls sap to create an additional occupancy
    */
    callToCreateAddOcc: function() {
        //get the information
        var fromDate = this.fromDatePicker.actualDate.toString('yyyy-MM-dd');
        var toDate = this.toDatePicker.actualDate.toString('yyyy-MM-dd');
        var staff = this.virtualHtml.down('[id=OM_MaintHolder_staffingField]').value;
        if (!Object.isEmpty(this.positionsAutocompleter.lastSelected))
            var posId = this.positionsAutocompleter.options.array[this.positionsAutocompleter.lastSelected].get('data');
        //call sap to create the assign (add occ or transfer)
        var xmlToCreateAssign;
        if (this.assignType == global.getLabel('additOcup')) {
            xmlToCreateAssign = "<EWS>" +
                                        "<SERVICE>" + this.getMaintAssignService + "</SERVICE>" +
                                        "<OBJECT TYPE='S'>" + this.objectID + "</OBJECT>" +
                                        "<PARAM>" +
                                            "<O_ACTION>C</O_ACTION>" +
                                            "<O_RELATIONS>" +
                                                "<YGLUI_TAB_RELATIONS rsign='A' relat='008'" +
                                                    " begda='" + fromDate + "' endda='" + toDate + "' " +
                                                    " sclas_new='S' sobid_new='" + posId + "'" +
                                                    " sclas='P' sobid='" + this.objectID + "' prozt='" + staff + "'" +
                                                "/>" +
                                            "</O_RELATIONS>" +
                                        "</PARAM>" +
                                   "</EWS>";
        } else if (this.assignType == global.getLabel('transfer')) {
            xmlToCreateAssign = "<EWS>" +
                                            "<SERVICE>" + this.getMaintAssignService + "</SERVICE>" +
                                            "<OBJECT TYPE='S'>" + this.objectID + "</OBJECT>" +
                                            "<PARAM>" +
                                                "<O_ACTION>C</O_ACTION>" +
                                                "<O_RELATIONS>" +
                                                    "<YGLUI_TAB_RELATIONS rsign='A' relat='008'" +
                                                        " begda='" + fromDate + "' endda='" + toDate + "' " +
                                                        " sclas_new='S' sobid_new='" + posId + "'" +
                                                        " begda_old='" + this.begdaOld + "' endda_old='" + this.enddaOld + "'" +
                                                        " sclas_old='S' sobid_old='" + this.posOldId + "' sclas='P' " +
                                                        " sobid='" + this.objectID + "' prozt='" + staff + "'" +
                                                    "/>" +
                                                "</O_RELATIONS>" +
                                            "</PARAM>" +
                                      "</EWS>";
        }
        this.makeAJAXrequest($H({ xml: xmlToCreateAssign, successMethod: 'processCallToCreateAddOcc' }));
    },
    /**
    * @description Hides the screen after 'success' answer from sap
    * @param json: {JSON} The JSON object retrieved from the service
    */
    processCallToCreateAddOcc: function(json) {
        //remove the screen to create the assign
        this.virtualHtml.down('[id=OMholderAssign_addOcc]').update("");
        //hide the screen
        this.virtualHtml.down('[id=OMholderAssign_addOcc]').hide();
        //show the button exit
        this.virtualHtml.down('div#OMholderAssign_button_exit').show();
        //call to sap 
        this.callToGetAssign();
    }
});

var OM_ManageHolderAssign = Class.create(OM_ManageHolderAssign_standard, {
    initialize: function($super){
        $super('OM_ManageHolderAssign');
    },
    run: function($super, args){
        $super(args);
    },
    close: function($super){
        $super();
    }
});