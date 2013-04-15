/**
 *@fileOverview OM_HolderAssign.js
 *@description It contains a class with functionality for managing holder assignments.
 */
/**
 *@constructor
 *@description Class with functionality for managing holder assignments.
 *@augments Application
 */
var OM_HolderAssign_standard = Class.create(Application,
/** 
*@lends OM_HolderAssign_standard 
*/
{   /**
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
    *@type String
    *@description Variable to control if a list of persons has been loaded
    */
    personsLoaded: false,
    /**
    *@type String
    *@description Autocompleter of person 
    */
    personsAutocompleter: null,
    /**
    *@type String
    *@description Value of autocompleter of person 
    */
    personsAutocompleterValue: "",
    /**
    *@type Boolean
    *@description Variable to control if a list of positions has been loaded
    */
    positionsLoaded: false,
    /**
    *@type AutocompleteSearch
    *@description Autocompleter of positions
    */
    positionsAutocompleter: null,
    /**
    *@type String
    *@description Autocompleter of positions 
    */
    positionsAutocompleterValue: "",
    /**
    *Constructor of the class OM_HolderAssign_standard
    */
    initialize: function($super, args) {
        $super(args);
        this.setEventsPropertiesBinding = this.setEventsProperties.bindAsEventListener(this);
    },
    /**
    *@description Starts OM_HolderAssign_standard
    */
    run: function($super, args) {
        $super();
        this.OM_MaintHolderAssignContainer = this.virtualHtml;
        //read args and values from global        
        this.dateFormat = "yyyyMMdd"; // when ready, read this format from global
        var parsedDate = args.get('date');
        this.date = Date.parseExact(parsedDate, this.dateFormat).toString('yyyy-MM-dd');
        this.endDate = "9999-12-31";
        this.objectID = args.get('node');
        this.objectType = args.get('objectType');
        this.assignedTo = args.get('root');
        this.enddate = args.get('enddate');
        this.name = args.get('name').gsub('--', ' ');
        //hide balloons
        if (balloon.isVisible())
            balloon.hide();
        //create the html structure of the application 
        this.createHtml();
        //draw the screen to assign  holder
        this.drawScreenAssignHolder();
        //event to control autocompleter
        document.observe("EWS:autocompleterResultSelected", this.setEventsPropertiesBinding);
    },
    /**
    *@description Creates the html structure
    */
    createHtml: function() {
        //create the html structure
        var html = "<div id='OM_MaintHolderAssign_TitleDiv' class='OM_MaintHolderAssignDiv'></div>" +
                       "<div id='OM_MaintHolderAssign_AssignScreenDiv' class='OM_MaintHolderAssignDiv'></div>" +
                       "<div id='OM_MaintHolder_ButtonsDiv' class='OM_MaintHolderAssignDiv'></div>";
        //insert the html
        this.virtualHtml.insert(html);
     },   
    /**
    *@description Draw the title part
    */
    drawTitle: function() {
        //insert the title in the div
        this.virtualHtml.down('[id=OM_MaintHolderAssign_TitleDiv]').update("<span class='application_main_title'>" + global.getLabel('assignHolder') + "</span>");
    },
    /**
    *@description Draw the screen
    */
    drawScreenAssignHolder: function() {
        //draw the title
        this.drawTitle();
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
                            "<div id='OM_MaintHolder_autocompleterPersonsField' class='OM_MaintHolder_autocompleterWidth'></div>" +
                       "</div>" +
                       "<div class='OM_MaintHolder_partDiv'>" +
                               "<span class='application_main_text OM_MaintHolder_DescrPartText'>" + global.getLabel('sttaffingPerc') + "</span>" +
                               "<input type='text' id='OM_MaintHolder_staffingField' class='OM_MaintHolder_StaffingField' value='" + this.staff + "'></input>" +
                               "<span class='application_main_text OM_MaintHolder_PercentegeText'>" + global.getLabel('%') + "</span>" +
                       "</div>" +
                       "<div class='OM_MaintHolder_partDiv'>" +
                               "<span class='application_main_text OM_MaintHolder_DescrPartText'>" + global.getLabel('position') + "</span>" +
                               "<span class='OM_MaintHolder_text'>" + this.name + "</span>" +
                       "</div>" +
                       "<div id='OM_MaintHolder_positionDiv' class='OM_MaintHolder_partDiv'>" +
                               "<span class='application_main_text OM_MaintHolder_DescrPartText'>" + global.getLabel('positionFrom') + "</span>" +
                               "<div id='OM_MaintHolder_autocompleterPositionsField' class='OM_MaintHolder_autocompleterWidth'></div>" +
                       "</div>" +
                       "<div id='OM_MaintHolder_noPositionDiv'' class='OM_MaintHolder_partDiv'></div>" +
                       "<div class='OM_MaintHolder_partActionDiv'>" +
                            "<form id='applicationDEL_actions'>" +
                                "<div class='OM_MaintHolder_radioButtonDiv'>" +
                                    "<input id='OM_MaintHolder_radioButtonAdditionalOcc' type='radio' name='radioButtonAction' value='" + global.getLabel('additOcup') + "' class='OM_MaintHolder_radioButtonAddOcc'/>" +
                                    "<span class='application_main_text OM_MaintHolder_radioButton'>" + global.getLabel('additOcup') + "</span>" +
                                "</div>" +
                                "<div class='OM_MaintHolder_radioButtonDiv'>" +
                                    "<input id='OM_MaintHolder_radioButtonTransfer' type='radio' name='radioButtonAction' value='" + global.getLabel('transfer') + "' class='OM_MaintHolder_radioButtonTransfer'/>" +
                                    "<span class='application_main_text OM_MaintHolder_radioButton'>" + global.getLabel('transfer') + "</span>" +
                                "</div>" +
                            "</form>" +
                       "</div>";
        //insert the html 
        this.virtualHtml.down('[id=OM_MaintHolderAssign_AssignScreenDiv]').update(html);
        //mark the Add Occ option by default
        this.virtualHtml.down("[id=OM_MaintHolder_radioButtonAdditionalOcc]").checked = true;
        //hide the autocompleter of positions
        this.virtualHtml.down("[id=OM_MaintHolder_positionDiv]").hide();
        this.virtualHtml.down("[id= OM_MaintHolder_noPositionDiv]").show();
        //if the user clicks on Add Occ option
        this.virtualHtml.down("[id=OM_MaintHolder_radioButtonAdditionalOcc]").observe('click', function() {
            //hide the autocompleter of positions
            this.virtualHtml.down("[id=OM_MaintHolder_positionDiv]").hide();
            this.virtualHtml.down("[id= OM_MaintHolder_noPositionDiv]").show();
        } .bind(this));
        //if the user clicks on Transfer option
        this.virtualHtml.down("[id=OM_MaintHolder_radioButtonTransfer]").observe('click', function() {
            if (!Object.isEmpty(this.personsAutocompleter.element.value)) {
                //show the autocompleter of positions
                this.virtualHtml.down("[id=OM_MaintHolder_positionDiv]").show();
                this.virtualHtml.down("[id= OM_MaintHolder_noPositionDiv]").hide();
            }
        } .bind(this));
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
        //persons autocompleter definition
        var jsonPersons = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        this.personsAutocompleter = new JSONAutocompleter('OM_MaintHolder_autocompleterPersonsField', {
            events: $H({ onResultSelected: 'EWS:autocompleterResultSelected' }),
            showEverythingOnButtonClick: true,
            timeout: 1000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            maxShown: 8,
            emptyOnBlur: true,
            minChars: 1
        }, jsonPersons);
        //set the value
        this.personsAutocompleter.clearInput();
        //if the user clicks on the icon to load the list of persons          
        this.virtualHtml.down("[id=OM_MaintHolder_autocompleterPersonsField]").observe('click', function() {
            this.getPersons();
        } .bind(this));
        //if the user removes the value of the person in the autocompleter, the positions autocompleter is hidden
        this.virtualHtml.down("[id=text_area_OM_MaintHolder_autocompleterPersonsField]").observe('keyup', function() {
            if (Object.isEmpty(this.personsAutocompleter.element.value)) {
                //show the autocompleter of positions
                this.virtualHtml.down("[id=OM_MaintHolder_positionDiv]").hide();
                this.virtualHtml.down("[id= OM_MaintHolder_noPositionDiv]").show();
            }
        } .bind(this));
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
            events: $H({ onResultSelected: 'EWS:autocompleterResultSelected' }),
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateOptionsList: '#{text}',
            maxShown: 8,
            emptyOnBlur: true,
            minChars: 3
        }, jsonPositions);
        this.positionsAutocompleter.clearInput();
        //if the user clicks on the icon to load the list of positions          
        this.virtualHtml.down("[id=OM_MaintHolder_autocompleterPositionsField]").observe('click', function() {
            this.getPositions();
        } .bind(this));
        //draw the buttons
        this.drawButtons();
    },
    /**
    *@description Calls sap to get the list of persons
    */
    getPersons: function() {
        if (!this.personsLoaded) {
            //visual effect for autocompleter 
            this.personsAutocompleter.loading();
            //call to sap to get the persons
            var xmlToGetPersons = "<EWS>" +
                                "<SERVICE>" + this.searchObjectsService + "</SERVICE>" +
                                "<PARAM>" +
                                  "<ORG_UNIT>N</ORG_UNIT>" +
                                  "<POSITION>N</POSITION>" +
                                  "<COSTCENT>N</COSTCENT>" +
                                  "<PERSON>Y</PERSON>" +
                                  "<O_BEGDA>" + this.date + "</O_BEGDA>" +
                                  "<O_ENDDA>" + this.endDate + "</O_ENDDA>" +
                                  "<TEXT></TEXT>" +
                                  "<MAX></MAX>" +
                              "</PARAM>" +
                           "</EWS>";
            this.makeAJAXrequest($H({ xml: xmlToGetPersons, successMethod: 'setPersons' }));
        }
    },
    /**
    *@description Inserts the information from sap in the autocompleter after 'success' answer from sap
    *@param {JSON} jsonObject Object from the backend
    */
    setPersons: function(json) {
        //stop visual effect for autocompleter 
        this.personsAutocompleter.stopLoading();
        //update that the persons list has been recovered
        this.personsLoaded = true;
        //update the autocompleter to load
        this.from = "setPersons";
        //get the information (service), and insert it into the autocompleter.
        this.personsAutocompleter.updateInput(this.buildAutocompleterXML(json));
    },
    /**
    *@description Calls sap to get the list of positions
    */
    getPositions: function() {
        if (!this.positionsLoaded) {
            //visual effect for autocompleter 
            this.positionsAutocompleter.loading();
            //call to sap to get the positions
            var xmlToGetPositions = "<EWS>" +
                                "<SERVICE>" + this.getMaintAssignService + "</SERVICE>" +
                                "<OBJECT TYPE='P'>" + this.personsAutocompleterValue + "</OBJECT>" +
                                "<DEL></DEL>" +
                                "<PARAM>" +
                                    "<O_ACTION>V</O_ACTION>" +
                                    "<O_RELATIONS>" +
                                    "<YGLUI_TAB_RELATIONS sclas='S'/>" +
                                    "</O_RELATIONS>" +
                                "</PARAM>" +
                                "</EWS>";
            this.makeAJAXrequest($H({ xml: xmlToGetPositions, successMethod: 'setPositions', informationMethod: 'setEmptyPositions' }));
        }
    },
    /**
    *@description Inserts the information from sap in the autocompleter after 'success' answer from sap
    *@param {JSON} jsonObject Object from the backend
    */
    setPositions: function(json) {
        //stop visual effect for autocompleter 
        this.positionsAutocompleter.stopLoading();
        //update that the positions list has been recovered
        this.positionsLoaded = true;
        //update the autocompleter to load
        this.from = "setPositions";
        //get the information (SEARCH_OBJECTS service), and insert it into the autocompleter.
        this.positionsAutocompleter.updateInput(this.buildAutocompleterXML(json));
    },
    /**
    *@description Removes the information of the autocompleter after 'information' answer from sap
    *@param {JSON} jsonObject Object from the backend
    */
    setEmptyPositions: function(json) {
        this._infoMethod(json);
        this.positionsAutocompleter.clearInput();
    },
    /**
    *@description Fills the autocompleter
    *@param {JSON} jsonObject Object from the backend
    */
    buildAutocompleterXML: function(json) {
        var jsonAutocompleter = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        if (!Object.isEmpty(json)) {
            //get the number of elements of the list
            if (this.from == "setPersons") {
                this.personsList = objectToArray(json.EWS.o_objects.yglui_tab_objects);
                this.sizePersonsList = this.personsList.length;
            }
            if (this.from == "setPositions") {
                this.positionsList = objectToArray(json.EWS.o_result.yglui_tab_relations_output);
                this.sizePositionsList = this.positionsList.length;
            }

            //initialize variables
            var data, text;
            if (this.from == "setPersons") {
                //get the information of every person of the list
                for (var i = 0; i < this.sizePersonsList; i++) {
                    tex = Object.isEmpty(this.personsList[i]["@stext"]) ? '' : this.personsList[i]["@stext"];
                    jsonAutocompleter.autocompleter.object.push({
                        data: this.personsList[i]["@objid"],
                        text: tex
                    })
                }
            } else if (this.from == "setPositions") {
                //get the information of every position of the list
                var id, begda, endda, dat, tex;
                for (var i = 0; i < this.sizePositionsList; i++) {
                    //get the information of every person of the list
                    id = this.positionsList[i]['@sobid'];
                    begda = this.positionsList[i]['@begda'];
                    endda = this.positionsList[i]['@endda'];
                    dat = dat = id + "_" + begda + "_" + endda;
                    //put an empty value if the text is null
                    tex = Object.isEmpty(this.positionsList[i]['@stext_dest']) ? '' : this.positionsList[i]['@stext_dest'];
                    jsonAutocompleter.autocompleter.object.push({
                        data: dat,
                        text: tex
                    })
                }
            }
        }
        //return the result
        return jsonAutocompleter;
    },
    /**
    *@description Fills the autocompleter
    *@param {JSON} jsonObject Object from the backend
    *@param event The event 'autocompleterResultSelected'
    */
    setEventsProperties: function(event) {
        var args = getArgs(event);
        //persons autocompleter
        if (args.idAutocompleter == "OM_MaintHolder_autocompleterPersonsField") {
            this.personsAutocompleterValue = args.idAdded;
            if (this.virtualHtml.down("[id=OM_MaintHolder_radioButtonTransfer]").checked) {
                //show the autocompleter of positions
                this.virtualHtml.down("[id=OM_MaintHolder_positionDiv]").show();
                this.virtualHtml.down("[id= OM_MaintHolder_noPositionDiv]").hide();
            }
            this.positionsAutocompleter.clearInput();
            this.positionsLoaded = false;
        }
        //positions autocompleter
        if (args.idAutocompleter == "OM_MaintHolder_autocompleterPositionsField") {
            this.positionsAutocompleterValue = args.idAdded;
        }
    },
    /**
    *@description Method to draw the buttons
    */
    drawButtons: function() {
        //create div for buttons
        var buttonsDiv = "<div id='OM_MaintHolder_Buttons' class='OM_MaintHolder_ButtonsPart'></div>";
        var json = {
            elements: []
        };
        var auxSave = {
            label: global.getLabel('save'),
            className: 'OM_MaintHolder_saveButton',
            idButton: 'OM_MaintHolder_saveButton',
            handlerContext: null,
            handler: this.callToCreateAssign.bind(this),
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxSave);
        var auxCancel = {
            label: global.getLabel('cancel'),
            idButton: 'OM_MaintHolder_cancelButton',
            className: 'OM_MaintHolder_cancelButton',
            handlerContext: null,
            handler: this.cancelButton.bind(this),
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxCancel);
        var ButtonOMHolderAssign = new megaButtonDisplayer(json);
        this.virtualHtml.down('div#OM_MaintHolder_ButtonsDiv').update(buttonsDiv);
        this.virtualHtml.down('div#OM_MaintHolder_Buttons').insert(ButtonOMHolderAssign.getButtons());
    },
    /**
    *@description Opens the previous app
    */
    cancelButton: function() {
        //remove the screen
        this.virtualHtml.update("");
        this.personsLoaded = false;
        this.positionsLoaded = false;
        //open the OM_Maintain app
        document.fire('EWS:openApplication', $H({ app: 'OM_Maintain' }));
    },
    /**
    *@description Calls a method depending of the option clicked
    */
    callToCreateAssign: function() {
        //call to sap depending of each case
        if (this.virtualHtml.down("[id=OM_MaintHolder_radioButtonTransfer]").checked) {
            this.callToCreateTransfer();
        } else if (this.virtualHtml.down("[id=OM_MaintHolder_radioButtonAdditionalOcc]").checked) {
            this.callToCreateAddOcc();
        }
    },
    /**
    *@description Calls sap to create an additional occupancy
    */
    callToCreateAddOcc: function() {
        //get the information
        var fromDate = this.fromDatePicker.actualDate.toString('yyyy-MM-dd');
        var toDate = this.toDatePicker.actualDate.toString('yyyy-MM-dd');
        var personId = this.personsAutocompleterValue;
        var staff = this.virtualHtml.down('[id=OM_MaintHolder_staffingField]').value;
        //call sap to create the assign
        var xmlToCreateAddOccAssign = "<EWS>" +
                                            "<SERVICE>" + this.getMaintAssignService + "</SERVICE>" +
                                            "<OBJECT TYPE='S'>" + this.objectID + "</OBJECT>" +
                                            "<PARAM>" +
                                                "<O_ACTION>C</O_ACTION>" +
                                                "<O_RELATIONS>" +
                                                    "<YGLUI_TAB_RELATIONS rsign='A' relat='008'" +
                                                        " begda='" + fromDate + "' endda='" + toDate + "' " +
                                                        " sclas_new='S' sobid_new='" + this.objectID + "'" +
                                                        " sclas='P' sobid='" + personId + "' prozt='" + staff + "'" +
                                                    "/>" +
                                                "</O_RELATIONS>" +
                                            "</PARAM>" +
                                          "</EWS>";
        this.makeAJAXrequest($H({ xml: xmlToCreateAddOccAssign, successMethod: 'processCallToCreateAddOcc' }));

    },
    /**
    *@description Returns to the previous app
    */
    processCallToCreateAddOcc: function(json) {
        //remove the screen
        this.virtualHtml.update("");
        this.personsLoaded = false;
        this.positionsLoaded = false;
        //return to the OM_Maintain
        document.fire('EWS:openApplication', $H({ app: 'OM_Maintain', refresh: true }));
    },
    /**
    *@description Calls sap to create a transfer
    */
    callToCreateTransfer: function() {
        //get the information
        var fromDate = this.fromDatePicker.actualDate.toString('yyyy-MM-dd');
        var toDate = this.toDatePicker.actualDate.toString('yyyy-MM-dd');
        var personId = this.personsAutocompleterValue;
        var begdaOld = this.positionsAutocompleterValue.split('_')[1];
        var enddaOld = this.positionsAutocompleterValue.split('_')[2];
        var positionId = this.positionsAutocompleterValue.split('_')[0];
        var staff = Object.isEmpty(this.virtualHtml.down('[id=OM_MaintHolder_staffingField]').value) ? '100' : this.virtualHtml.down('[id=OM_MaintHolder_staffingField]').value;
        //call sap to create the assign
        var xmlToCreateTransferAssign = "<EWS>" +
                                                "<SERVICE>" + this.getMaintAssignService + "</SERVICE>" +
                                                "<OBJECT TYPE='S'>" + this.objectID + "</OBJECT>" +
                                                "<PARAM>" +
                                                    "<O_ACTION>C</O_ACTION>" +
                                                    "<O_RELATIONS>" +
                                                        "<YGLUI_TAB_RELATIONS rsign='A' relat='008'" +
                                                            " begda='" + fromDate + "' endda='" + toDate + "' " +
                                                            " sclas_new='S' sobid_new='" + this.objectID + "'" +
                                                            " begda_old='" + begdaOld + "' endda_old='" + enddaOld + "'" +
                                                            " sclas_old='S' sobid_old='" + positionId + "' sclas='P' " +
                                                            " sobid='" + personId + "' prozt='" + staff + "'" +
                                                        "/>" +
                                                    "</O_RELATIONS>" +
                                                "</PARAM>" +
                                            "</EWS>";
        this.makeAJAXrequest($H({ xml: xmlToCreateTransferAssign, successMethod: 'processCallToCreateTransfer', informationMethod: 'informToCreateTransfer' }));
    },
    /**
    *@description Returns to the previous app after 'success' answer from sap
    */
    processCallToCreateTransfer: function(json) {
        //remove the screen
        this.virtualHtml.update("");
        this.personsLoaded = false;
        this.positionsLoaded = false;
        //return to the OM_Maintain
        document.fire('EWS:openApplication', $H({ app: 'OM_Maintain', refresh: true }));
    },
    /**
    *@description Returns to the previous app after 'information' answer from sap
    */
    informToCreateTransfer: function(json) {
        //show the info message from sap 
        this._infoMethod(json);
        //remove the screen
        this.virtualHtml.update("");
        this.personsLoaded = false;
        this.positionsLoaded = false;
        //return to the OM_Maintain
        document.fire('EWS:openApplication', $H({ app: 'OM_Maintain', refresh: true }));
    },
    /**
    *@description Stops OM_HolderAssign_standard
    */
    close: function($super) {
        $super();
        document.stopObserving("EWS:autocompleterResultSelected", this.setEventsPropertiesBinding);
    }
});

var OM_HolderAssign = Class.create(OM_HolderAssign_standard, {
    initialize: function($super){
        $super('OM_HolderAssign');
    },
    run: function($super, args){
        $super(args);
    },
    close: function($super){
        $super();
    }
});