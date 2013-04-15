/**
*@fileOverview OM_MaintObjCreate.js
*@description It contains a class with functionality to maintain objects.
*/
/**
*@constructor
*@description Class with functionality to maintain objects.
*@augments Application
*/
var OM_MaintObjCreate_standard = Class.create(Application,

{
    /**
    *@type String
    *@description Service used to create an object.
    */
    getMaintObjService: "MAINT_OBJECT",
    /**
    *@type String
    *@description Service used to get the subtypes
    */
    getSubtypesService: "GET_SUBTYPE",
    /**
    *@type String
    *@description Service used to get the cost center list
    */
    getCostCenterService: "GET_COSTCENTRS",
    /**
    *@type String
    *@description Service used to get the countries
    */
    getCountryService: "GET_COUNTRY",
    /**
    *@type String
    *@description Service used to get the regions
    */
    getRegionService: "GET_REGIONS",
    /**
    *@type String
    *@description Service used to get the ee groups
    */
    getEEgroupService: "GET_EEGROUP",
    /**
    *@type String
    *@description Service used to get the ee subgroups
    */
    getEEsubgroupService: "GET_EESUBGR",
    /**
    *@type String
    *@description variable to control if the staff indicator in Create O screen is selected
    */
    staffIndicator: '',
    /**
    *@type String
    *@description variable to control if the vacancy indicator in Create S screen is selected
    */
    vacPosIndicator: '',
    /**
    *@type String
    *@description variable to control if the staff indicator in Create S screen is selected
    */
    staffPosIndicator: '',
    /**
    *@type String
    *@description variable to control if the obsolete indicator in Create S screen is selected
    */
    obsPosIndicator: '',
    /**
    *@type String variable to control if the key position indicator in Create S screen is selected
    *@description 
    */
    keyPosIndicator: '',
    /**
    *@type String variable to control if the Head of Org. indicator in Create S screen is selected
    *@description 
    */
    manPosIndicator: '',
    descrPartShown: '',

    //autocompleters
    subtypesLoaded: false,
    subtypesAutocompleter: null,
    subtypesAutocompleterValue: null,

    costCenterLoaded: false,
    costCenterAutocompleter: null,
    costCenterAutocompleterValue: null,

    countryLoaded: false,
    countryAutocompleter: null,
    countryAutocompleterValue: null,

    regionLoaded: false,
    regionAutocompleter: null,
    regionAutocompleterValue: null,

    eeGroupLoaded: false,
    eeGroupAutocompleter: null,
    eeGroupAutocompleterValue: null,

    eeSubgroupLoaded: false,
    eeSubgroupAutocompleter: null,
    eeSubgroupAutocompleterValue: null,
    /**
    *Constructor of the class OM_MaintObjCreate
    */
    initialize: function($super, args) {
        $super(args);
        this.setEventsPropertiesBinding = this.setEventsProperties.bindAsEventListener(this);
    },
    /**
    *@description Starts OM_MaintObjCreate
    *@param {Object} args Application's args
    */
    run: function($super, args) {
        $super();
        this.OM_MaintObjCreateContainer = this.virtualHtml;
        //read args and values from global        
        this.dateFormat = "yyyyMMdd";
        this.objectID = args.get('node');
        var parsedDate = args.get('date');
        this.date = Date.parseExact(parsedDate, this.dateFormat).toString('yyyy-MM-dd');
        this.objectType = args.get('objectType');
        this.assignedTo = args.get('root');
        this.userLanguage = global.language;
        this.descrPartShown = false;
        //initialize the variables about autocompleter 
        this.subtypesAutocompleterValue = "";
        this.costCenterAutocompleterValue = "";
        this.countryAutocompleterValue = "";
        this.regionAutocompleterValue = "";
        this.eeGroupAutocompleterValue = "";
        this.eeSubgroupAutocompleterValue = "";
        //hide balloons
        if (balloon.isVisible())
            balloon.hide();
        //create the html structure of the application 
        this.createHtml();
        //get the possible languages to translate
        this.getLanguages();
        //event to control autocompleter
        document.observe("EWS:autocompleterResultSelected", this.setEventsPropertiesBinding);
    },
    /**
    *@description Create the html structure
    */
    createHtml: function() {
        //html structure
        var html = "<div id='OM_MaintObjCreate_TitleDiv' class='OM_MaintObjCreate_TitleDiv'></div>" +
                    "<div id='OM_MaintObjCreate_TransDiv' class='OM_MaintObjCreate_TransDiv'></div>" +
                    "<div id='OM_MaintObjCreate_TitlePartDiv' class='OM_MaintObjCreate_TitlePartDiv'></div>" +
                    "<div id='OM_MaintObjCreate_DescrPartDiv' class='OM_MaintObjCreate_DescrPartDiv'></div>" +
                    "<div id='OM_MaintObjCreate_DatePartDiv' class='OM_MaintObjCreate_DatePartDiv'></div>" +
                    "<div id='OM_MaintObjCreate_CostCenterPartDiv' class='OM_MaintObjCreate_RelPartDiv'></div>" +
                    "<div id='OM_MaintObjCreate_RelPartDiv' class='OM_MaintObjCreate_RelPartDiv'></div>" +
                    "<div id='OM_MaintObjCreate_AddressPartDiv' class='OM_MaintObjCreate_AddressPartDiv'></div>" +
                    "<div id='OM_MaintObjCreate_RelPosPartDiv' class='OM_MaintObjCreate_RelPosPartDiv'></div>" +
                    "<div id='OM_MaintObjCreate_ButtonsDiv' class='OM_MaintObjCreate_ButtonsDiv'></div>";
        this.virtualHtml.insert(html);
    },
    /**
    *@description Get the possible languages
    */
    getLanguages: function() {
        //get the languages id from global
        var languages = global.translations;
        //save id and description from label in a hash
        this.languagesHash = $H({});
        var language, languageDescr;
        languages.each(function(pair) {
            language = pair[0];
            languageDescr = global.getLabel(pair[0]);
            this.languagesHash.set(language,
                                                $H({
                                                    languDescr: languageDescr,
                                                    title: '',
                                                    abrev: '',
                                                    descrType: '',
                                                    descr: '',
                                                    subtypes: $H({})
                                                })
                    );
            //default value for the main subtype in each language
            this.languagesHash.get(language).get('subtypes').set('0001', '');
        } .bind(this));
        //save default values of the languages to create the object(user language)
        this.actualLanguage = this.userLanguage;
        //draw the screen to create the object
        this.drawCreateObjectScreen();
    },
    /**
    *@description Draw screen
    */
    drawCreateObjectScreen: function() {
        //draw the title
        this.drawTitle();
        //draw the translation part
        this.drawTransPart();
        //draw the title/abrev part
        this.drawTitlePart();
        //draw the description part
        this.drawDescrPart();
        //draw the date part
        this.drawDatePart();
        //draw different part if the object type to create is O or S
        if (this.objectType == 'O') {
            //hide divs about positions
            this.virtualHtml.down('div#OM_MaintObjCreate_RelPosPartDiv').hide();
            //draw the cost center part
            this.drawCostCenterPart();
            //draw the relation part
            this.drawRelPart();
            //draw the address part
            this.drawAddressPart();
        } else if (this.objectType == 'S') {
            //hide divs about org unit
            this.virtualHtml.down('div#OM_MaintObjCreate_CostCenterPartDiv').hide();
            this.virtualHtml.down('div#OM_MaintObjCreate_RelPartDiv').hide();
            this.virtualHtml.down('div#OM_MaintObjCreate_AddressPartDiv').hide();
            //draw the position part
            this.drawPositionPart();
        }
        //draw te buttons
        this.drawButtons();
    },
    /**
    *@description Draw title of screen
    */
    drawTitle: function() {
        //write the title depending of the object type
        var title;
        if (this.objectType == 'O') {
            title = global.getLabel('createO');
        } else if (this.objectType == 'S') {
            title = global.getLabel('createS');
        }
        //insert the title in the div
        this.virtualHtml.down('[id=OM_MaintObjCreate_TitleDiv]').update("<span class='application_main_title'>" + title + "</span>");
    },
    /**
    *@description Draw translation part
    */
    drawTransPart: function() {
        //html structure
        var html = "<div class='OM_MaintObjCreate_partDiv'>" +
                        "<span class='application_main_soft_text OM_MaintObjCreate_Text '>" + global.getLabel('translation') + "</span>" +
                        "<div id='OM_MaintObjCreate_languages'></div>" +
                   "</div>";
        //insert the html structure in the div
        this.virtualHtml.down('[id=OM_MaintObjCreate_TransDiv]').update(html);
        //languages definition     
        var languageHtml = '';
        var lang, langDesc;
        this.languagesHash.each(function(pair) {
            lang = pair[0];
            langDesc = pair[1].get('languDescr');
            languageHtml += "<div><span id='OM_MaintObjCreate_" + lang + "' class='application_action_link OM_MaintObjCreate_linkDisabled'>" + langDesc + "</span></div>";
        } .bind(this));
        //insert the languages
        this.virtualHtml.down('[id=OM_MaintObjCreate_languages]').insert(languageHtml);
        this.virtualHtml.down('span#OM_MaintObjCreate_' + this.actualLanguage + '').removeClassName('application_action_link');
        this.virtualHtml.down('span#OM_MaintObjCreate_' + this.actualLanguage + '').addClassName('OM_MaintObjCreate_linkDisabled');
        //if the user changes the language   
        this.languagesHash.each(function(pair) {
            lang = pair[0];
            //for each language
            this.virtualHtml.down('[id=OM_MaintObjCreate_' + lang + ']').observe('click', this.updateLanguageDescrPart.bind(this, lang));
        } .bind(this));
    },
    /**
    *@description Update the links of translations 
    */
    updateLanguageDescrPart: function(lang) {
        if (this.descrPartShown) {
            //save the last info (last language)
            var title = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_TitleField').value);
            var abrev = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_AbrevField').value);
            this.languagesHash.get(this.actualLanguage).set("title", title);
            this.languagesHash.get(this.actualLanguage).set("abrev", abrev);
            if (Object.isEmpty(this.subtypeAutocompleterFirstValue)) {
                this.languagesHash.get(this.actualLanguage).get('subtypes').set('0001', this.getRigthText(this.virtualHtml.down('[id=OM_MaintObjCreate_DescrField]').value));
            } else {
                this.languagesHash.get(this.actualLanguage).get('subtypes').set(this.subtypeAutocompleterFirstValue, this.getRigthText(this.virtualHtml.down('[id=OM_MaintObjCreate_DescrField]').value));
            }
            //initialize the autocompleter value for the new language
            this.subtypeAutocompleterFirstValue = '0001';
            //read the hash about desc part in the language selected
            this.virtualHtml.down('input#OM_MaintObjCreate_TitleField').value = this.languagesHash.get(lang).get("title");
            this.virtualHtml.down('input#OM_MaintObjCreate_AbrevField').value = this.languagesHash.get(lang).get("abrev");
            // DEFAULT VALUE??
            this.subtypesAutocompleter.setDefaultValue('0001', false, false);
            this.subtypesAutocompleterValue = '0001';
            this.virtualHtml.down('input#OM_MaintObjCreate_DescrField').value = Object.isEmpty(this.languagesHash.get(lang).get('subtypes').get(this.subtypesAutocompleterValue)) ? '' : this.languagesHash.get(lang).get('subtypes').get(this.subtypesAutocompleterValue);
            //update the current language
            this.actualLanguage = lang;
            //remove the languages of translations
            this.virtualHtml.down('[id=OM_MaintObjCreate_TransDiv]').update("");
            //draw the languages
            this.drawTransPart();
        } else {
            //get the information
            var title = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_TitleField').value);
            var abrev = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_AbrevField').value);
            //save  the last info about title in the language hash before changing to another language 
            this.languagesHash.get(this.actualLanguage).set("title", title);
            this.languagesHash.get(this.actualLanguage).set("abrev", abrev);
            //read the hash about desc part in the language selected
            this.virtualHtml.down('input#OM_MaintObjCreate_TitleField').value = this.languagesHash.get(lang).get("title");
            this.virtualHtml.down('input#OM_MaintObjCreate_AbrevField').value = this.languagesHash.get(lang).get("abrev");
            //update the current language
            this.actualLanguage = lang;
            //remove the languages of translations
            this.virtualHtml.down('[id=OM_MaintObjCreate_TransDiv]').update("");
            //draw the languages
            this.drawTransPart();
        }

    },
    /**
    *@description Draw title part
    */
    drawTitlePart: function() {
        //html structure
        var html = "<div class='OM_MaintObjCreate_partDiv'>" +
                       "<span class='application_main_soft_text OM_MaintObjCreate_Text'>" + global.getLabel('title') + "</span>" +
                       "<div class='OM_MaintObjCreate_TextFieldDiv'><input type='text' id='OM_MaintObjCreate_TitleField' class='OM_MaintObjCreate_TitleField'></input></div>" +
                       "<span class='application_main_soft_text OM_MaintObjCreate_AbrevText'>" + global.getLabel('abbr') + "</span>" +
                       "<div class='OM_MaintObjCreate_TextFieldDiv'><input type='text' id='OM_MaintObjCreate_AbrevField'></input></div>" +
                   "</div>";
        //insert the html structure in the div
        this.virtualHtml.down('[id=OM_MaintObjCreate_TitlePartDiv]').update(html);
    },
    /**
    *@description Draw description part
    */
    drawDescrPart: function() {
        //html structure
        var html = "<div id='OM_MaintObjCreate_DescrPartLink' class='application_action_link OM_MaintObjCreate_TextLink'>" + global.getLabel('editDescr') + "</div>" +
                    "<div id='OM_MaintObjCreate_partDiv' class='OM_MaintObjCreate_partDiv'>" +
                       "<div id='OM_MaintObjCreate_DescrPartCloseLink' class='application_action_link OM_MaintObjCreate_TextLink'>" + global.getLabel('viewLess') + "</div>" +
                       "<div class='OM_MaintObjCreate_field'>" +
                           "<span class='application_main_soft_text OM_MaintObjCreate_DescrPartText'>" + global.getLabel('descrType') + "</span>" +
                           "<div class='OM_MaintObjCreate_TextFieldDiv'>" +
                                "<div id='OM_MaintObjCreate_autocompleterDescrTypeField' class='OM_MaintObjCreate_TitleField'></div>" +
                           "</div>" +
                       "</div>" +
                       "<div>" +
                           "<span class='application_main_soft_text OM_MaintObjCreate_DescrPartText'>" + global.getLabel('descr') + "</span>" +
                           "<div class='OM_MaintObjCreate_TextFieldDiv'><textarea cols='20' rows='6' id='OM_MaintObjCreate_DescrField' class='OM_MaintObjCreate_DescrField'></textarea></div>" +
                       "</div>" +
                   "</div>";
        //insert the html structure in the div
        this.virtualHtml.down('[id=OM_MaintObjCreate_DescrPartDiv]').update(html);
        if (!this.descrPartShown) {
            //autocompleter definition
            var jsonSubtypes = {
                autocompleter: {
                    object: [],
                    multilanguage: {
                        no_results: global.getLabel('noresults'),
                        search: global.getLabel('search')
                    }
                }
            }
            this.subtypesAutocompleter = new JSONAutocompleter('OM_MaintObjCreate_autocompleterDescrTypeField', {
                events: $H({ onResultSelected: 'EWS:autocompleterResultSelected' }),
                showEverythingOnButtonClick: true,
                timeout: 5000,
                templateOptionsList: '#{text}',
                maxShown: 8,
                emptyOnBlur: true
            }, jsonSubtypes);
            this.getSubtypes();
            //if the user clicks on the icon to load the list of subtypes          
            this.virtualHtml.down("[id=OM_MaintObjCreate_autocompleterDescrTypeField]").observe('click', function() {
                this.getSubtypes();
            } .bind(this));
        }
        //hide the description part
        this.virtualHtml.down('[id=OM_MaintObjCreate_partDiv]').hide();
        this.virtualHtml.down('[id=OM_MaintObjCreate_DescrPartLink]').observe('click', this.showDescrPart.bind(this));
        this.virtualHtml.down('[id=OM_MaintObjCreate_DescrPartCloseLink]').observe('click', this.hideDescrPart.bind(this));
    },
    /**
    *@description Show description part
    */
    showDescrPart: function() {
        //update variable to control if description part is shown
        this.descrPartShown = true;
        //hide the 'edit description' link
        this.virtualHtml.down('[id=OM_MaintObjCreate_DescrPartLink]').hide();
        //show the 'edit description' part
        this.virtualHtml.down('[id=OM_MaintObjCreate_partDiv]').show();
        //set default value (general description)
        this.subtypesAutocompleter.setDefaultValue('0001', false, false);
        this.virtualHtml.down('input#OM_MaintObjCreate_DescrField').value = Object.isEmpty(this.languagesHash.get(this.actualLanguage).get('subtypes').get('0001')) ? '' : this.languagesHash.get(this.actualLanguage).get('subtypes').get('0001');
    },
    /**
    *@description Show description part
    */
    hideDescrPart: function() {
        //update variable to control if description part is shown
        this.descrPartShown = false;
        //save the description info in the actual language
        if (Object.isEmpty(this.subtypeAutocompleterFirstValue)) {
            this.languagesHash.get(this.actualLanguage).get('subtypes').set('0001', this.virtualHtml.down('[id=OM_MaintObjCreate_DescrField]').value);
        } else {
            this.languagesHash.get(this.actualLanguage).get('subtypes').set(this.subtypeAutocompleterFirstValue, this.virtualHtml.down('[id=OM_MaintObjCreate_DescrField]').value);
        }
        //hide the 'edit description' part
        this.virtualHtml.down('[id=OM_MaintObjCreate_partDiv]').hide();
        //show the 'edit description' link
        this.virtualHtml.down('[id=OM_MaintObjCreate_DescrPartLink]').show();
    },
    /**
    *@description Draw date part
    */
    drawDatePart: function() {
        //html structure
        var html = "<div class='OM_MaintObjCreate_partDiv'>" +
                        "<div class='OM_MaintObjCreate_calendarDatesDiv'>" +
                            "<span class='application_main_soft_text OM_MaintObjCreate_calendarText'>" + global.getLabel('valDate') + "</span>" +
                            "<span class='application_main_text OM_MaintObjCreate_calendarTextField'>" + global.getLabel('from') + "</span>" +
                            "<div class='OM_MaintObjCreate_calendar' id='OM_MaintObjCreate_form_begCal'></div>" +
                            "<span class='application_main_text OM_MaintObjCreate_calendarTextField'>" + global.getLabel('to') + "</span>" +
                            "<div class='OM_MaintObjCreate_calendar' id='OM_MaintObjCreate_endCal'></div>" +
                        "</div>" +
                   "</div>";
        //insert the html structure in the div
        this.virtualHtml.down('[id=OM_MaintObjCreate_DatePartDiv]').update(html);
        //DatePickers definition
        var fromDate = Date.today().toString('yyyyMMdd');
        var toDate = "99991231"
        this.fromDatePicker = new DatePicker('OM_MaintObjCreate_form_begCal', {
            defaultDate: fromDate,
            draggable: true,
            manualDateInsertion: true,
            emptyDateValid: true
        });
        this.toDatePicker = new DatePicker('OM_MaintObjCreate_endCal', {
            defaultDate: toDate,
            draggable: true,
            manualDateInsertion: true
        });
        this.fromDatePicker.linkCalendar(this.toDatePicker);
    },
    /**
    *@description Draw cost center part
    */
    drawCostCenterPart: function() {
        //html structure
        var html = "<div class='OM_MaintObjCreate_partDiv'>" +
                           "<span class='application_main_soft_text OM_MaintObjCreate_DescrPartText'>" + global.getLabel('costcenter') + "</span>" +
                           "<div id='OM_MaintObjCreate_autocompleterCostCenterField' class='OM_MaintObjCreate_TitleField'></div>" +
                   "</div>";
        //insert the html structure in the div
        this.virtualHtml.down('[id=OM_MaintObjCreate_CostCenterPartDiv]').update(html);
        //show div about org unit
        this.virtualHtml.down('div#OM_MaintObjCreate_CostCenterPartDiv').show();
        //cost center autocompleter definition
        var jsonCostCenter = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        this.costCenterAutocompleter = new JSONAutocompleter('OM_MaintObjCreate_autocompleterCostCenterField', {
            events: $H({ onResultSelected: 'EWS:autocompleterResultSelected' }),
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateOptionsList: '#{text}',
            maxShown: 8,
            emptyOnBlur: true,
            minChars: 1
        }, jsonCostCenter);
        this.costCenterAutocompleter.clearInput();
        //if the user clicks on the icon to load the list of cost center
        this.virtualHtml.down("[id=OM_MaintObjCreate_autocompleterCostCenterField]").observe('click', function() {
            this.getCostCenter();
        } .bind(this));
    },
    /**
    *@description Calling sap to get list of cost center
    */
    getCostCenter: function() {
        if (!this.costCenterLoaded) {
            //initialize variable
            this.from = "";
            //visual effect for autocompleter 
            this.costCenterAutocompleter.loading();
            //call to sap to get the cost center list
            xml = "<EWS>" +
                    "<SERVICE>" + this.getCostCenterService + "</SERVICE>" +
                    "<OBJECT TYPE='K'></OBJECT>" +
                    "<LABELS></LABELS>" +
                    "<PARAM>" +
                        "<PATTERN></PATTERN>" +
                        "<DATUM>" + this.date + "</DATUM>" +
                        "<LANGUAGE>" + this.userLanguage + "</LANGUAGE>" +
                        "</PARAM>" +
                    "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'setCostCenter' }));
        }
    },
    /**
    *@description Get the cost centers information 
    *@param {JSON} json Object from the backend
    */
    setCostCenter: function(json) {
        //stop visual effect of autocompleter 
        this.costCenterAutocompleter.stopLoading();
        //update that the cost center list has been loaded
        this.costCenterLoaded = true;
        //the list will be loaded from the successMethod
        this.from = "setCostCenter";
        //get the information (GET_COSTCENTER service), and insert it into the autocompleter.
        this.costCenterAutocompleter.updateInput(this.buildAutocompleterXML(json));
    },
    /**
    *@description Draw relation part
    */
    drawRelPart: function() {
        //html structure
        var html = "<div class='OM_MaintObjCreate_partDiv'>" +
                       "<div>" +
                           "<span class='application_main_soft_text OM_MaintObjCreate_DescrPartText'>" + global.getLabel('assignedTo') + "</span>" +
                           "<span class='OM_MaintObjCreate_TextFieldDiv'>" + this.assignedTo + "</span>" +
                       "</div>" +
                       "<div>" +
                           "<span class='application_main_soft_text OM_MaintObjCreate_DescrPartText'>" + global.getLabel('indicators') + "</span>" +
                           "<div class='OM_MaintObjCreate_TextFieldDiv'><input type='checkbox' id='OM_MaintObjCreate_StaffIndicatorField'>" + global.getLabel('staff') + "</input></div>" +
                       "</div>"
        "</div>";
        //insert the html structure in the div
        this.virtualHtml.down('[id=OM_MaintObjCreate_RelPartDiv]').update(html);
        //show divs about org unit
        this.virtualHtml.down('div#OM_MaintObjCreate_RelPartDiv').show();
        //if the user selects the staff indicator
        this.virtualHtml.down('[id=OM_MaintObjCreate_StaffIndicatorField]').observe('click', this.updateStaffIndicator.bind(this));
    },
    /**
    *@description Update indicator
    */
    updateStaffIndicator: function() {
        if (this.virtualHtml.down('[id=OM_MaintObjCreate_StaffIndicatorField]').checked) {
            this.staffIndicator = 'X';
        } else {
            this.staffIndicator = '';
        }
    },
    /**
    *@description Draw address part
    */
    drawAddressPart: function() {
        //html structure
        var html = "<div id='OM_MaintObjCreate_AddressPartLink' class='application_action_link OM_MaintObjCreate_TextLink'>" + global.getLabel('editAddr') + "</div>" +
                   "<div id='OM_MaintObjCreate_AddressPart' class='OM_MaintObjCreate_partDiv'>" +
                        "<div id='OM_MaintObjCreate_AddressPartCloseLink' class='application_action_link OM_MaintObjCreate_TextLink'>" + global.getLabel('viewLess') + "</div>" +
                        "<table class='OM_MaintObjCreate_Table'>" +
                            "<tr>" +
                                "<td><span class='application_main_soft_text OM_MaintObjCreate_LabelText'>" + global.getLabel('street') + "</span></td>" +
                                "<td><input type='text' id='OM_MaintObjCreate_StreetField' class='OM_MaintObjCreate_LongText'></input></td>" +
                                "<td><span class='application_main_soft_text OM_MaintObjCreate_LabelText'>" + global.getLabel('houseNr') + "</span></td>" +
                                "<td><input type='text' id='OM_MaintObjCreate_HouseNumberField' class='OM_MaintObjCreate_ShortText'></input></td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td><span class='application_main_soft_text OM_MaintObjCreate_LabelText'>" + global.getLabel('postalcode') + "</span></td>" +
                                "<td><input type='text' id='OM_MaintObjCreate_PostalCodeField' class='OM_MaintObjCreate_ShortText'></input></td>" +
                                "<td><span class='application_main_soft_text OM_MaintObjCreate_LabelText'>" + global.getLabel('city') + "</span></td>" +
                                "<td><input type='text' id='OM_MaintObjCreate_CityField' class='OM_MaintObjCreate_LongText'></input></td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td><span class='application_main_soft_text OM_MaintObjCreate_LabelText'>" + global.getLabel('country') + "</span></td>" +
                                "<td><div id='OM_MaintObjCreate_autocompleterCountryField' class='OM_MaintObjCreate_TitleField'></div></td>" +
                                "<td><span class='application_main_soft_text OM_MaintObjCreate_LabelText'>" + global.getLabel('regio') + "</span></td>" +
                                "<td><div id='OM_MaintObjCreate_autocompleterRegionField'></div></td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td><span class='application_main_soft_text OM_MaintObjCreate_LabelText'>" + global.getLabel('phoneNr') + "</span></td>" +
                                "<td><input type='text' id='OM_MaintObjCreate_PhoneNumbField' class='OM_MaintObjCreate_LongText'></input></td>" +
                                "<td><span class='application_main_soft_text OM_MaintObjCreate_LabelText'>" + global.getLabel('faxNr') + "</span></td>" +
                                "<td><input type='text' id='OM_MaintObjCreate_FaxNumbField' class='OM_MaintObjCreate_LongText'></input></td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td><span class='application_main_soft_text OM_MaintObjCreate_LabelText'>" + global.getLabel('emailAddr') + "</span></td>" +
                                "<td><input type='text' id='OM_MaintObjCreate_emailField' class='OM_MaintObjCreate_LongText'></input></td>" +
                            "</tr>" +
                        "</table>" +
                   "</div>";
        //insert the html structure in the div
        this.virtualHtml.down('[id=OM_MaintObjCreate_AddressPartDiv]').update(html);
        //show divs about org unit
        this.virtualHtml.down('div#OM_MaintObjCreate_AddressPartDiv').show();
        //country autocompleter definition
        var jsonCountry = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        this.countryAutocompleter = new JSONAutocompleter('OM_MaintObjCreate_autocompleterCountryField', {
            events: $H({ onResultSelected: 'EWS:autocompleterResultSelected' }),
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateOptionsList: '#{text}',
            maxShown: 8,
            emptyOnBlur: true,
            minChars: 1
        }, jsonCountry);
        this.countryAutocompleter.clearInput();
        //if the user clicks on the icon to load the list of countries          
        this.virtualHtml.down("[id=OM_MaintObjCreate_autocompleterCountryField]").observe('click', function() {
            this.getCountry();
        } .bind(this));
        //region autocompleter definition
        var jsonRegion = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        this.regionAutocompleter = new JSONAutocompleter('OM_MaintObjCreate_autocompleterRegionField', {
            events: $H({ onResultSelected: 'EWS:autocompleterResultSelected' }),
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateOptionsList: '#{text}',
            maxShown: 8,
            emptyOnBlur: true
        }, jsonRegion);
        this.regionAutocompleter.clearInput();
        //if the user clicks on the icon to load the list of regions          
        this.virtualHtml.down("[id=OM_MaintObjCreate_autocompleterRegionField]").observe('click', function() {
            if (this.regionAutocompleter.enabled)
                this.getRegion();
        } .bind(this));
        //disable the autocompleter region until any country value is selected
        this.regionAutocompleter.disable();
        //hide the description part
        this.virtualHtml.down('[id=OM_MaintObjCreate_AddressPart]').hide();
        this.virtualHtml.down('[id=OM_MaintObjCreate_AddressPartLink]').observe('click', this.showAdddresPart.bind(this));
        this.virtualHtml.down('[id=OM_MaintObjCreate_AddressPartCloseLink]').observe('click', this.hideAddressPart.bind(this));
    },
    /**
    *@description Show address part
    */
    showAdddresPart: function() {
        this.virtualHtml.down('[id=OM_MaintObjCreate_AddressPartLink]').hide();
        this.virtualHtml.down('[id=OM_MaintObjCreate_AddressPart]').show();
    },
    /**
    *@description Hide address part
    */
    hideAddressPart: function() {
        this.virtualHtml.down('[id=OM_MaintObjCreate_AddressPart]').hide();
        this.virtualHtml.down('[id=OM_MaintObjCreate_AddressPartLink]').show();
    },
    /**
    *@description Draw position part
    */
    drawPositionPart: function() {
        //html structure
        var html = "<div class='OM_MaintObjCreate_partDiv'>" +
                       "<div class='OM_MaintObjCreate_AssignField'>" +
                           "<span class='application_main_soft_text OM_MaintObjCreate_DescrPartText'>" + global.getLabel('assignedTo') + "</span>" +
                           "<span class='OM_MaintObjCreate_TitleField'>" + this.assignedTo + "</span>" +
                           "<span class='OM_MaintObjCreate_HeadOrgField'>" + global.getLabel('headOrg') + "<input type='checkbox' id='OM_MaintObjCreate_ManagerIndicatorField'></input></span>" +
                       "</div>" +
                       "<div class='OM_MaintObjCreate_field'>" +
                           "<span class='application_main_soft_text OM_MaintObjCreate_DescrPartText'>" + global.getLabel('eeGroup') + "</span>" +
                           "<div class='OM_MaintObjCreate_TextFieldDiv'>" +
                                "<div id='OM_MaintObjCreate_autocompleterEEgroupField' class='OM_MaintObjCreate_TitleField'></div>" +
                           "</div>" +
                       "</div>" +
                       "<div class='OM_MaintObjCreate_field'>" +
                           "<span class='application_main_soft_text OM_MaintObjCreate_DescrPartText'>" + global.getLabel('eeSubGroup') + "</span>" +
                           "<div class='OM_MaintObjCreate_TextFieldDiv'>" +
                                "<div id='OM_MaintObjCreate_autocompleterEEsubgroupField' ></div>" +
                           "</div>" +
                       "</div>" +
                       "<div class='OM_MaintObjCreate_field'>" +
                           "<span class='application_main_soft_text OM_MaintObjCreate_DescrPartText'>" + global.getLabel('indicators') + "</span>" +
                           "<div class='OM_MaintObjCreate_IndicatorFieldDiv'><input type='checkbox' id='OM_MaintObjCreate_VacPosIndicatorField'>" + global.getLabel('vacancy') + "</input></div>" +
                           "<div class='OM_MaintObjCreate_IndicatorFieldDiv'><input type='checkbox' id='OM_MaintObjCreate_StaffPosIndicatorField'>" + global.getLabel('staff') + "</input></div>" +
                           "<div class='OM_MaintObjCreate_IndicatorFieldDiv'><input type='checkbox' id='OM_MaintObjCreate_ObsPosIndicatorField'>" + global.getLabel('obsolete') + "</input></div>" +
                           "<div class='OM_MaintObjCreate_IndicatorFieldDiv'><input type='checkbox' id='OM_MaintObjCreate_KeyPosIndicatorField'>" + global.getLabel('keyPos') + "</input></div>" +
                       "</div>" +
                       "<div class='OM_MaintObjCreate_field'>" +
                           "<span class='application_main_soft_text OM_MaintObjCreate_DescrPartText'>" + global.getLabel('emailAddr') + "</span>" +
                           "<div class='OM_MaintObjCreate_EmailSField'><input type='text' id='OM_MaintObjCreate_emailPosField' class='OM_MaintObjCreate_EmailSField'></input></div>" +
                       "</div>" +
                       "<div class='OM_MaintObjCreate_field'>" +
                           "<span class='application_main_soft_text OM_MaintObjCreate_DescrPartText'>" + global.getLabel('nrPos') + "</span>" +
                           "<div class='OM_MaintObjCreate_NumberPosField'><input type='text' id='OM_MaintObjCreate_numberPosField' class='OM_MaintObjCreate_NumberPosField'></input></div>" +
                       "</div>" +
                   "</div>";
        //insert the html structure in the div
        this.virtualHtml.down('[id=OM_MaintObjCreate_RelPosPartDiv]').update(html);
        //show divs about positions
        this.virtualHtml.down('div#OM_MaintObjCreate_RelPosPartDiv').show();
        //default value for number of position
        this.virtualHtml.down('input#OM_MaintObjCreate_numberPosField').value = 1;
        //eegroup autocompleter definition
        var jsonEEgroup = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        this.eeGroupAutocompleter = new JSONAutocompleter('OM_MaintObjCreate_autocompleterEEgroupField', {
            events: $H({ onResultSelected: 'EWS:autocompleterResultSelected' }),
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateOptionsList: '#{text}',
            maxShown: 8,
            emptyOnBlur: true
        }, jsonEEgroup);
        this.eeGroupAutocompleter.clearInput();
        //if the user clicks on the icon to load the list of ee groups          
        this.virtualHtml.down("[id=OM_MaintObjCreate_autocompleterEEgroupField]").observe('click', function() {
            this.getEEgroup();
        } .bind(this));
        //eesubgroup autocompleter definition
        var jsonEEsubgroup = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        this.eeSubgroupAutocompleter = new JSONAutocompleter('OM_MaintObjCreate_autocompleterEEsubgroupField', {
            events: $H({ onResultSelected: 'EWS:autocompleterResultSelected' }),
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateOptionsList: '#{text}',
            maxShown: 8,
            emptyOnBlur: true
        }, jsonEEsubgroup);
        this.eeSubgroupAutocompleter.clearInput();
        //if the user clicks on the icon to load the list of ee subgroups          
        this.virtualHtml.down("[id=OM_MaintObjCreate_autocompleterEEsubgroupField]").observe('click', function() {
            if (this.eeSubgroupAutocompleter.enabled)
                this.getEEsubgroup();
        } .bind(this));
        //disable the autocompleter eesubgroup until any ee group value is selected
        this.eeSubgroupAutocompleter.disable();
        //if the user selects any indicator
        this.virtualHtml.down('[id=OM_MaintObjCreate_VacPosIndicatorField]').observe('click', this.updateVacPosIndicator.bind(this));
        this.virtualHtml.down('[id=OM_MaintObjCreate_StaffPosIndicatorField]').observe('click', this.updateStaffPosIndicator.bind(this));
        this.virtualHtml.down('[id=OM_MaintObjCreate_ObsPosIndicatorField]').observe('click', this.updateObsPosIndicator.bind(this));
        this.virtualHtml.down('[id=OM_MaintObjCreate_KeyPosIndicatorField]').observe('click', this.updateKeyPosIndicator.bind(this));
        this.virtualHtml.down('[id=OM_MaintObjCreate_ManagerIndicatorField]').observe('click', this.updateManPosIndicator.bind(this));
    },
    /**
    *@description update indicator
    */
    updateVacPosIndicator: function() {
        if (this.virtualHtml.down('[id=OM_MaintObjCreate_VacPosIndicatorField]').checked) {
            this.vacPosIndicator = 'X';
        } else {
            this.vacPosIndicator = '';
        }
    },
    /**
    *@description Update indicator
    */
    updateStaffPosIndicator: function() {
        if (this.virtualHtml.down('[id=OM_MaintObjCreate_StaffPosIndicatorField]').checked) {
            this.staffPosIndicator = 'X';
        } else {
            this.staffPosIndicator = '';
        }
    },
    /**
    *@description Update indicator
    */
    updateObsPosIndicator: function() {
        if (this.virtualHtml.down('[id=OM_MaintObjCreate_ObsPosIndicatorField]').checked) {
            this.obsPosIndicator = 'X';
        } else {
            this.obsPosIndicator = '';
        }
    },
    /**
    *@description Update indicator
    */
    updateKeyPosIndicator: function() {
        if (this.virtualHtml.down('[id=OM_MaintObjCreate_KeyPosIndicatorField]').checked) {
            this.keyPosIndicator = 'X';
        } else {
            this.keyPosIndicator = '';
        }
    },
    /**
    *@description Update indicator
    */
    updateManPosIndicator: function() {
        if (this.virtualHtml.down('[id=OM_MaintObjCreate_ManagerIndicatorField]').checked) {
            this.manPosIndicator = 'X';
        } else {
            this.manPosIndicator = '';
        }
    },
    /**
    *@description Draw buttons
    */
    drawButtons: function() {
        //create div for buttons
        var buttonsDiv = "<div id='OM_MaintObjCreate_Buttons' class='OM_MaintObjCreate_ButtonsPart'></div>";
        var json = {
            elements: []
        };
        var auxSave = {
            label: global.getLabel('save'),
            className: 'OM_MaintObjCreate_saveButton',
            idButton: 'OM_MaintObjCreate_saveButton',
            handlerContext: null,
            handler: this.callToCreateObject.bind(this, ''),
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxSave);
        var auxCancel = {
            label: global.getLabel('cancel'),
            idButton: 'OM_MaintObjCreate_cancelButton',
            className: 'OM_MaintObjCreate_saveButton',
            handlerContext: null,
            handler: this.cancelButton.bind(this),
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxCancel);
        var ButtonOMmaintObjCreate = new megaButtonDisplayer(json);
        this.virtualHtml.down('div#OM_MaintObjCreate_ButtonsDiv').update(buttonsDiv);
        this.virtualHtml.down('div#OM_MaintObjCreate_Buttons').insert(ButtonOMmaintObjCreate.getButtons());
    },
    /**
    *@description Return to the previous app after cancel button clicked
    */
    cancelButton: function() {
        //remove the screen
        this.virtualHtml.update("");
        //update values in variable to control if lists have been loaded
        this.subtypesLoaded = false;
        this.costCenterLoaded = false;
        this.countryLoaded = false;
        this.regionLoaded = false;
        this.eeGroupLoaded = false;
        this.eeSubgroupLoaded = false;
        //open the OM_Maintain app
        document.fire('EWS:openApplication', $H({ app: 'OM_Maintain' }));
    },
    /**
    *@description Call sap to create the object
    */
    callToCreateObject: function() {
        //save the last info in the last language 
        var title = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_TitleField').value);
        var abrev = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_AbrevField').value);
        //save the information in the hash
        this.languagesHash.get(this.actualLanguage).set("title", title);
        this.languagesHash.get(this.actualLanguage).set("abrev", abrev);
        if (this.descrPartShown) {
            if (Object.isEmpty(this.subtypeAutocompleterFirstValue)) {
                this.languagesHash.get(this.actualLanguage).get('subtypes').set('0001', this.getRigthText(this.virtualHtml.down('[id=OM_MaintObjCreate_DescrField]').value));
            } else {
                this.languagesHash.get(this.actualLanguage).get('subtypes').set(this.subtypeAutocompleterFirstValue, this.getRigthText(this.virtualHtml.down('[id=OM_MaintObjCreate_DescrField]').value));
            }
        }
        //get the date
        var fromDate = this.fromDatePicker.actualDate.toString('yyyy-MM-dd');
        var toDate = this.toDatePicker.actualDate.toString('yyyy-MM-dd');

        //get the rest of field depending the object type to create
        if (this.objectType == 'O') {
            var costCenterValue, idCostCenter, kokrsCostCenter;
            if (!Object.isEmpty(this.costCenterAutocompleterValue)) {
                costCenterValue = this.costCenterAutocompleterValue;
                idCostCenter = costCenterValue.split('/')[0];
                kokrsCostCenter = costCenterValue.split('/')[1];
            } else {
                costCenterValue = '';
                idCostCenter = '';
                kokrsCostCenter = '';
            }
            var street = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_StreetField').value);
            var houseNumb = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_HouseNumberField').value);
            var postalCode = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_PostalCodeField').value);
            var city = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_CityField').value);
            var country = this.countryAutocompleterValue;
            var region = this.regionAutocompleterValue;
            var phoneNumb = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_PhoneNumbField').value);
            var faxNumb = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_FaxNumbField').value);
            var email = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_emailField').value);
        } else if (this.objectType == 'S') {
            var jobPos = '50000112'; //AT THE MOMENT THIS IS THE VALUE
            var eeGroupPos = this.eeGroupAutocompleterValue;
            var eeSubGroupPos = this.eeSubgroupAutocompleterValue;
            var emailPos = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_emailPosField').value);
            var numberPos = this.getRigthText(this.virtualHtml.down('input#OM_MaintObjCreate_numberPosField').value);
        }
        //generate xml
        this.xmlToCreateObject = "<EWS>" +
                                    "<SERVICE>" + this.getMaintObjService + "</SERVICE>" +
                                    "<OBJECT TYPE='O'>" + this.objectID + "</OBJECT>" +
                                    "<DEL></DEL>" +
                                    "<PARAM>" +
                                        "<O_OTYPE>" + this.objectType + "</O_OTYPE>" +
                                        "<O_ACTION>C</O_ACTION>" +
                                        "<O_BEGDA>" + fromDate + "</O_BEGDA>" +
                                        "<O_ENDDA>" + toDate + "</O_ENDDA>" +
                                        "<O_OBJECT>";
        //add the info in any language   
        var lang, titleLang, abrevLang, descrTypeLang, descrLang;
        this.languagesHash.each(function(pair) {
            lang = pair[0];
            titleLang = pair[1].get('title');
            abrevLang = pair[1].get('abrev');
            if (!Object.isEmpty(titleLang)) {
                this.xmlToCreateObject += "<YGLUI_TAB_OBJECT langu='" + lang + "' infty='1000' fld_sbty='STEXT' descr='" + titleLang + "'/>";
            }
            if (!Object.isEmpty(abrevLang)) {
                this.xmlToCreateObject += "<YGLUI_TAB_OBJECT langu='" + lang + "' infty='1000' fld_sbty='SHORT' descr='" + abrevLang + "'/>";
            }
            pair[1].get('subtypes').each(function(pair) {
                descrTypeLang = pair[0];
                descrLang = pair[1];
                this.xmlToCreateObject += "<YGLUI_TAB_OBJECT langu='" + lang + "' infty='1002' fld_sbty='" + descrTypeLang + "' descr='" + descrLang + "'/>";
            } .bind(this));
        } .bind(this));
        this.xmlToCreateObject += "</O_OBJECT>";
        if (this.objectType == 'O') {
            this.xmlToCreateObject += "<O_ORGUNIT>" +
                                            "<STABS>" + this.staffIndicator + "</STABS>" +
                                            "<ABTEL></ABTEL>" +
                                            "<STRAS>" + street + "</STRAS>" +
                                            "<HAUSN>" + houseNumb + "</HAUSN>" +
                                            "<PSTLZ>" + postalCode + "</PSTLZ>" +
                                            "<ORT01>" + city + "</ORT01>" +
                                            "<LAND1>" + country + "</LAND1>" +
                                            "<REGIO>" + region + "</REGIO>" +
                                            "<TELNR>" + phoneNumb + "</TELNR>" +
                                            "<FAXNR>" + faxNumb + "</FAXNR>" +
                                            "<SMTPADR>" + email + "</SMTPADR>" +
                                            "<REL_K>" + idCostCenter + "</REL_K>" +
                                            "<REL_KOKRS>" + kokrsCostCenter + "</REL_KOKRS>" +
                                            "<REL_O>" + this.objectID + "</REL_O>" +
                                        "</O_ORGUNIT>";
        } else if (this.objectType == 'S') {
            this.xmlToCreateObject += "<O_POSITION>" +
                                            "<STABS>" + this.staffPosIndicator + "</STABS>" +
                                            "<ABTEL></ABTEL>" +
                                            "<VACAN>" + this.vacPosIndicator + "</VACAN>" +
                                            "<PERSG>" + eeGroupPos + "</PERSG>" +
                                            "<PERSK>" + eeSubGroupPos + "</PERSK>" +
                                            "<REDUN>" + this.obsPosIndicator + "</REDUN>" +
                                            "<SMTPADR>" + emailPos + "</SMTPADR>" +
                                            "<OMLEADER>" + this.manPosIndicator + "</OMLEADER>" +
                                            "<REL_O>" + this.objectID + "</REL_O>" +
                                            "<REL_J>" + jobPos + "</REL_J>" +
                                            "<ZZKEY>" + this.keyPosIndicator + "</ZZKEY>" +
                                            "<NRPOS>" + numberPos + "</NRPOS>" +
                                        "</O_POSITION>";
        }
        this.xmlToCreateObject += "</PARAM>" +
                                "</EWS>";
        this.makeAJAXrequest($H({ xml: this.xmlToCreateObject, successMethod: 'processCallToCreateObject' }));
    },
    /**
    *@description Proccess answer from sap
    */
    processCallToCreateObject: function() {
        //remove the screen
        this.virtualHtml.update("");
        //update variables
        this.subtypesLoaded = false;
        this.costCenterLoaded = false;
        this.countryLoaded = false;
        this.regionLoaded = false;
        this.eeGroupLoaded = false;
        this.eeSubgroupLoaded = false;
        //initialize checkboxes variables
        this.manPosIndicator = '';
        this.vacPosIndicator = '';
        this.staffPosIndicator = '';
        this.keyPosIndicator = '';
        this.obsPosIndicator = '';
        //return to the OM_Maintain
        document.fire('EWS:openApplication', $H({ app: 'OM_Maintain', refresh: true }));
    },
    /**
    *@description Save the value selected in the autocompleter
    */
    setEventsProperties: function(event) {
        var args = getArgs(event);
        //subtypes autocompleter
        if (args.idAutocompleter == "OM_MaintObjCreate_autocompleterDescrTypeField") {
            //get the id subtype
            this.subtypesAutocompleterValue = args.idAdded;
            //get the subtype description
            this.descrSubtypeValue = this.virtualHtml.down('[id=OM_MaintObjCreate_DescrField]').value;
            //add the value in the hash
            if (Object.isEmpty(this.subtypeAutocompleterFirstValue)) {
                this.languagesHash.get(this.actualLanguage).get('subtypes').set('0001', this.descrSubtypeValue);
            } else {
                this.languagesHash.get(this.actualLanguage).get('subtypes').set(this.subtypeAutocompleterFirstValue, this.descrSubtypeValue);
            }
            //update variable last id value
            this.subtypeAutocompleterFirstValue = args.idAdded;
            //initialize description 
            this.virtualHtml.down('[id=OM_MaintObjCreate_DescrField]').value = Object.isEmpty(this.languagesHash.get(this.actualLanguage).get('subtypes').get(this.subtypesAutocompleterValue)) ? '' : this.languagesHash.get(this.actualLanguage).get('subtypes').get(this.subtypesAutocompleterValue);
        }
        //cost center autocompleter
        if (args.idAutocompleter == "OM_MaintObjCreate_autocompleterCostCenterField") {
            this.costCenterAutocompleterValue = args.idAdded.gsub('%20', ' ');
        }
        //country autocompleter
        if (args.idAutocompleter == "OM_MaintObjCreate_autocompleterCountryField") {
            this.countryAutocompleterValue = args.idAdded;
            this.regionAutocompleter.clearInput();
            this.regionAutocompleter.enable();
            this.regionLoaded = false;
        }
        //region autocompleter
        if (args.idAutocompleter == "OM_MaintObjCreate_autocompleterRegionField") {
            this.regionAutocompleterValue = args.idAdded;
        }
        //ee group autocompleter
        if (args.idAutocompleter == "OM_MaintObjCreate_autocompleterEEgroupField") {
            this.eeGroupAutocompleterValue = args.idAdded;
            this.eeSubgroupAutocompleter.clearInput();
            this.eeSubgroupAutocompleter.enable();
            this.eeSubgroupLoaded = false;
        }
        //ee subgroup autocompleter
        if (args.idAutocompleter == "OM_MaintObjCreate_autocompleterEEsubgroupField") {
            this.eeSubgroupAutocompleterValue = args.idAdded;
        }
    },
    /**
    *@description CAll sap to get list of subtypes
    */
    getSubtypes: function() {
        if (!this.subtypesLoaded) {
            //initialize variable to control if the size of the list is greater than 30 records
            this.from = "";
            //call to sap to get the subtypes
            var xml = "<EWS>" +
                            "<SERVICE>" + this.getSubtypesService + "</SERVICE>" +
                            "<DEL/>" +
                            "<PARAM>" +
                                "<O_INFOTYPE>1002</O_INFOTYPE>" +
                            "</PARAM>" +
                       "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'setSubtypes' }));
        }
    },
    /**
    *@description Proccess answer from sap
    */
    setSubtypes: function(json) {
        //update that the subtypes list has been loaded
        this.subtypesLoaded = true;
        //the list will be loaded from the successMethod
        this.from = "setSubtypes";
        //get the information (GET_SUBTYPE service), and insert it into the autocompleter.
        this.subtypesAutocompleter.updateInput(this.buildAutocompleterXML(json));
    },
    /**
    *@description Call sap to get the list of countries
    */
    getCountry: function() {
        if (!this.countryLoaded) {
            //initialize variable to control if the size of the list is greater than 30 records
            this.from = "";
            //visual effect for autocompleter 
            this.countryAutocompleter.loading();
            //call to sap to get the countries
            var xml = "<EWS>" +
                            "<SERVICE>" + this.getCountryService + "</SERVICE>" +
                            "<DEL/>" +
                            "<PARAM>" +
                            "</PARAM>" +
                       "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'setCountry' }));
        }
    },
    /**
    *@description Proccess answer from sap
    */
    setCountry: function(json) {
        //stop visual effect of autocompleter
        this.countryAutocompleter.stopLoading();
        //update that the countries list has been loaded
        this.countryLoaded = true;
        //the list will be loaded from the successMethod
        this.from = "setCountry";
        //get the information (GET_COUNTRY service), and insert it into the autocompleter.
        this.countryAutocompleter.updateInput(this.buildAutocompleterXML(json));
    },
    /**
    *@description Call to sap to get the list of regions
    */
    getRegion: function() {
        if (!this.regionLoaded) {
            //initialize variable to control if the size of the list is greater than 30 records
            this.from = "";
            //visual effect of autocompleter 
            this.regionAutocompleter.loading();
            //call to sap to get the regions
            var xml = "<EWS>" +
                            "<SERVICE>" + this.getRegionService + "</SERVICE>" +
                            "<DEL/>" +
                            "<PARAM>" +
                                "<o_country>" + this.countryAutocompleterValue + "</o_country>" +
                            "</PARAM>" +
                       "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'setRegion' }));
        }
    },
    /**
    *@description Proccess answer from sap
    */
    setRegion: function(json) {
        //stop visual effect of autocompleter 
        this.regionAutocompleter.stopLoading();
        //update that the countries list has been loaded
        this.regionLoaded = true;
        //the list will be loaded from the successMethod
        this.from = "setRegion";
        //get the information (GET_REGION service), and insert it into the autocompleter.
        this.regionAutocompleter.updateInput(this.buildAutocompleterXML(json));
    },
    /**
    *@description Call to sap to get the list of eegroup
    */
    getEEgroup: function() {
        if (!this.eeGroupLoaded) {
            //initialize variable to control if the size of the list is greater than 30 records
            this.from = "";
            //visual effect of autocompleter 
            this.eeGroupAutocompleter.loading();
            //call to sap to get the subtypes
            var xml = "<EWS>" +
                            "<SERVICE>" + this.getEEgroupService + "</SERVICE>" +
                            "<DEL/>" +
                            "<PARAM>" +
                            "</PARAM>" +
                       "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'setEEgroup' }));
        }
    },
    /**
    *@description Proccess answer from sap
    */
    setEEgroup: function(json) {
        //stop visual effect of autocompleter 
        this.eeGroupAutocompleter.stopLoading();
        //update that the eegroups list has been loaded
        this.eeGroupLoaded = true;
        //the list will be loaded from the successMethod
        this.from = "setEEgroup";
        //get the information (GET_EEGROUP service), and insert it into the autocompleter.
        this.eeGroupAutocompleter.updateInput(this.buildAutocompleterXML(json));
    },
    /**
    *@description Call to sap to get the list of eesubgroup
    */
    getEEsubgroup: function() {
        if (!this.eeSubgroupLoaded) {
            //initialize variable to control if the size of the list is greater than 30 records
            this.from = "";
            //visual effect of autocompleter 
            this.eeSubgroupAutocompleter.loading();
            //call to sap to get the subtypes
            var xml = "<EWS>" +
                            "<SERVICE>" + this.getEEsubgroupService + "</SERVICE>" +
                            "<DEL/>" +
                            "<PARAM>" +
                                "<O_EEGROUP>" + this.eeGroupAutocompleterValue + "</O_EEGROUP>" +
                            "</PARAM>" +
                       "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'setEEsubgroup' }));
        }
    },
    /**
    *@description Proccess answer from sap
    */
    setEEsubgroup: function(json) {
        //stop visual effect of autocompleter 
        this.eeSubgroupAutocompleter.stopLoading();
        //update that the ee subgroups list has been loaded
        this.eeSubgroupLoaded = true;
        //the list will be loaded from the successMethod
        this.from = "setEEsubgroup";
        //get the information (GET_EESUBGROUP service), and insert it into the autocompleter.
        this.eeSubgroupAutocompleter.updateInput(this.buildAutocompleterXML(json));
    },
    /**
    *@description Fills  autocompleter
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
            if (this.from == "setSubtypes") {
                this.subtypesList = objectToArray(json.EWS.o_subtypes.yglui_tab_subtypes);
                this.sizeSubtypesList = this.subtypesList.length;
            }
            if (this.from == "setCostCenter") {
                this.costCenterList = objectToArray(json.EWS.o_costcenters.item);
                this.sizeCostCenterList = this.costCenterList.length;
            }
            if (this.from == "setCountry") {
                this.countryList = objectToArray(json.EWS.o_country.yglui_tab_country);
                this.sizeCountryList = this.countryList.length;
            }
            if (this.from == "setRegion") {
                this.regionList = objectToArray(json.EWS.o_regions.yglui_tab_region);
                this.sizeRegionList = this.regionList.length;
            }
            if (this.from == "setEEgroup") {
                this.EEgroupList = objectToArray(json.EWS.o_group.yglui_tab_eegroup);
                this.sizeEEgroupList = this.EEgroupList.length;
            }
            if (this.from == "setEEsubgroup") {
                this.EEsubgroupList = objectToArray(json.EWS.o_subgroup.yglui_tab_eesubgr);
                this.sizeEEsubgroupList = this.EEsubgroupList.length;
            }
            //initialize variables
            var data, text;
            if (this.from == "setSubtypes") {
                //get the information of every subtype of the list
                for (var i = 0; i < this.sizeSubtypesList; i++) {
                    jsonAutocompleter.autocompleter.object.push({
                        data: this.subtypesList[i]["@subtype_code"],
                        text: this.subtypesList[i]["@stext"]
                    })
                }
            } else if (this.from == "setCostCenter") {
                //get the information of every cost center of the list
                for (var i = 0; i < this.sizeCostCenterList; i++) {
                    var data = this.costCenterList[i].cost['@costcenter'] + "/" + this.costCenterList[i]['@kokrs'];
                    jsonAutocompleter.autocompleter.object.push({
                        data: data,
                        text: this.costCenterList[i].cost['@name']
                    })
                }
            } else if (this.from == "setCountry") {
                //get the information of every country of the list
                for (var i = 0; i < this.sizeCountryList; i++) {
                    jsonAutocompleter.autocompleter.object.push({
                        data: this.countryList[i]["@country_code"],
                        text: this.countryList[i]['@country_text']
                    })
                }
            } else if (this.from == "setRegion") {
                //get the information of every region of the list
                for (var i = 0; i < this.sizeRegionList; i++) {
                    jsonAutocompleter.autocompleter.object.push({
                        data: this.regionList[i]["@regio"],
                        text: this.regionList[i]["@bezei"]
                    })
                }
            } else if (this.from == "setEEgroup") {
                //get the information of every ee group of the list
                for (var i = 0; i < this.sizeEEgroupList; i++) {
                    jsonAutocompleter.autocompleter.object.push({
                        data: this.EEgroupList[i]["@eegroup_code"],
                        text: this.EEgroupList[i]["@etext"]
                    })
                }
            } else if (this.from == "setEEsubgroup") {
                //get the information of every ee subgroup of the list
                for (var i = 0; i < this.sizeEEsubgroupList; i++) {
                    jsonAutocompleter.autocompleter.object.push({
                        data: this.EEsubgroupList[i]["@eesubgr_code"],
                        text: this.EEsubgroupList[i]["@etext"]
                    })
                }
            }
        }
        //return the result
        return jsonAutocompleter;
    },
    /**
    *@description Method to treat special characters 
    */
    getRigthText: function(text) {
        if (text.include('&'))
            text = text.gsub('&', '&amp;');
        if (text.include('<'))
            text = text.gsub('<', '&lt;');
        if (text.include('>'))
            text = text.gsub('<', '&gt;');
        if (text.include('"'))
            text = text.gsub('"', '&quot;');
        if (text.include("'"))
            text = text.gsub("'", '&apos;');
        return text;
    },
    /**
    *@description Stops OM_MaintObjCreate
    */
    close: function($super) {
        $super();
        document.stopObserving("EWS:autocompleterResultSelected", this.setEventsPropertiesBinding);
    }
});


var OM_MaintObjCreate = Class.create(OM_MaintObjCreate_standard, {
    initialize: function($super) {
        $super('OM_MaintObjCreate');
    },
    run: function($super,args) {
        $super(args);
    },
    close: function($super) {
        $super();
    }
});
