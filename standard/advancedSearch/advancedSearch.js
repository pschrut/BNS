var AdvancedSearch = Class.create(Application,
{

    /**
    * From which result was the last search performed
    * @type int
    */
    from: null,

    /**
    * Which one was the last result on the last search
    * @type int
    */
    to: null,
    /**
    * Number of results per search
    * @type int
    */
    records: null,

    /**
    * Total number of records found
    * @type int
    */
    recordsFound: null,

    /**
    * JSON object used to perform the last search
    * @type JSON
    */
    jsoninLastSearch: null,

    /**
    * Container used for the field panel
    * @type Element
    */
    searchFormContainer: null,

    /**
    * Container used for the search results
    * @type Element
    */
    searchResultsContainer: null,
    /**
    * Store the number of the actual page, starts with 1
    * @type Element
    */
    actualPage: 1,

    /**
    * A list of the currently selected employees to add them to the list.
    */
    addingQueue: null,

    initialize: function($super, options) {
        $super(options);
        document.observe("EWS:AS_buttonClicked", this.onButtonClicked.bind(this));
        this.from = 0;
        this.to = 0;
        this.records = 0;
        this.addingQueue = $H({});
    },

    /**
    * Loads a new advanced search from the beginning.
    */
    run: function($super, args) {

        $super(args);
        this.searchId = args.get('sadv_id');
        this.filters = args.get('filterValues');
        this.screen = args.get('screen');
        this.comeFromMenu = false;
        if (!Object.isEmpty(args.get('comeFromMenu')))
            this.comeFromMenu = args.get('comeFromMenu');
        else
            this.comeFromMenu = false;
        if (!Object.isEmpty(args.get('multiple')))
            this.multiple = args.get('multiple');
        else
            this.multiple = true;
        if (!Object.isEmpty(args.get('addToMenu')))
            this.addToMenu = args.get('addToMenu');
        else
            this.addToMenu = true;
        //initialize the containers if it's the first time
        if (this.firstRun) {
            this.searchFormContainer = new Element("div", { 'class': 'PFM_statusCss' });
            this.searchResultsContainer = new Element("div", {
                "id": "adv_search_results"
            });
            this.virtualHtml.insert(this.searchFormContainer).insert(this.searchResultsContainer);
        }
        this.records = parseInt(global.paginationLimit);
        //prepare the GET_SHLP call
        var application = global.currentApplication;
        var appId = application.appId;

        var jsonin_GET_SHLP = {
            EWS: {
                SERVICE: "GET_SHLP",
                PARAM: {
                    SADV_ID: this.searchId,
                    APPID: appId
                }
            }
        };

        //convert it to XML and send
        var conversor = new XML.ObjTree();
        var xmlin_GET_SHLP = conversor.writeXML(jsonin_GET_SHLP);
        this.makeAJAXrequest($H({
            xml: xmlin_GET_SHLP,
            successMethod: this.getShlpSuccess.bind(this)
        }));
    },

    /**
    * Get's the currently opened screen
    */
    getScreen: function() {
        return this.advancedSearchFieldPanel.currentSelected;
    },

    /**
    * Handles click on load button
    */
    loadHandler: function(args) {
        this.close();
        global.open({
            app: {
                tabId: 'POPUP',
                appId: 'TM_L_CT',
                view: 'loadAVS'
            },
            searchId: this.searchId,
            screen: this.getScreen(), 
            multiple: this.multiple
        });
    },

    /**
    * Prompts the user for a name for the filter 
    */
    getFilterName: function() {
        if (Object.isEmpty(this.saveContainer)) {
            this.saveContainer = new Element("div", { 'class': 'ADVS_saveBox ' });
            var mainContainer = this.virtualHtml.down('[id=applicationsLayerButtons]').insert(this.saveContainer);
            //Div container of label Mask Name, and the input for write the number
            mainContainer.removeClassName('fieldDispFloatRight');
            mainContainer.addClassName('fieldDispFloatLeft');
            //Create the div structure, for show label, input, and buttons in a single line
            this.globalContainer = new Element("div");
            this.globalContainer.addClassName("inlineContainer application_clear_line applications_text_Value");
            this.inputContainer = new Element("div");
            this.inputContainer.addClassName("inlineElement");
            //------------------------------------------------------------------------------
            var inputFilter = new Element("input", {
                type: "text",
                maxlength: 20,
                width: 120
            });
        //Label MaskName    
        var label = new Element('span', {'class':'application_main_soft_text'});
        label.update(global.getLabel('MaskName'));
        this.inputContainer.insert(label);
        this.inputContainer.insert(inputFilter);
        
            var buttonsJSON = {
                elements: []
            };
            var okJSON = {
                idButton: 'ok',
                label: global.getLabel('OK'),
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: function() {
                    this.saveHandler($F(inputFilter), this.saveContainer);
                } .bind(this),
                type: 'button',
                standardButton: true
            };
            // first button
            var cancelJSON = {
                idButton: 'cancel',
                label: global.getLabel('Cancel'),
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: this.saveContainer.hide.bind(this.saveContainer),
                type: 'button',
                standardButton: true
            };
            buttonsJSON.elements.push(okJSON);
            buttonsJSON.elements.push(cancelJSON);
            var megaButtons = new megaButtonDisplayer(buttonsJSON);
            var buttons = megaButtons.getButtons();
            buttons.addClassName('inlineElement');
            // buttons
            this.globalContainer.insert(this.inputContainer);
            this.globalContainer.insert(buttons);
            this.saveContainer.insert(this.globalContainer);
          
        }
        else {
            this.saveContainer.show();
        }
    },

    /**
    * Handles click on save button
    */
    saveHandler: function(name, container) {
        var screen = this.getScreen();
        var valid =  this.advancedSearchFieldPanel.validateForm(screen);
        var FP_screens = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < FP_screens.length; i++) {
            if (FP_screens[i]['@screen'] == screen) {
                var fields = objectToArray(FP_screens[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
            }
        }
        var jsonin_SAVE_FILTER = {
            EWS: {
                SERVICE: "SET_SHLP_VAL",
                PARAM: {
                    SADV_ID: this.searchId,
                    WID_SCREEN: screen,
                    NAME: name,
                    FILTER: {
                        yglui_str_wid_field: $A()
                    }
                }
            }
        };
        for (var j = 0; j < fields.length; j++) {
            jsonin_SAVE_FILTER.EWS.PARAM.FILTER.yglui_str_wid_field.push(fields[j]);
        }
        var conversor = new XML.ObjTree();
        conversor.attr_prefix = '@';
        var xmlin_SAVE_FILTER = conversor.writeXML(jsonin_SAVE_FILTER);
        //and make the call to the service
        if (validForm.correctForm == true) {
            this.makeAJAXrequest($H({
                xml: xmlin_SAVE_FILTER,
                successMethod: container.hide.bind(container)
        
        }));
        }

    },
    /**
    * Handles click on cancel button
    */
    cancelHandler: function(args) {
        this.close();
        this.popUpApplication.close();
        delete this.popUpApplication;
    },
    /**
    * Handles click on start button
    */
    startHandler: function(args) {
        var screenId = this.getScreen();

        //get all the field values for the selected screen 
        var fields = objectToArray(this.advancedSearchFieldPanel.json.EWS.o_field_values.yglui_str_wid_record).find(function(fieldValues) {
            return fieldValues["@screen"] == screenId;
        });
        fields = objectToArray(fields.contents.yglui_str_wid_content.fields.yglui_str_wid_field);

        //copy the field values with the right format
        var fieldsArray = $A();
        fields.each(function(fieldData) {
            fieldsArray.push({
                "@fieldid": fieldData["@fieldid"],
                "@fieldlabel": fieldData["@fieldlabel"],
                "@fieldtechname": fieldData["@fieldtechname"],
                "@fieldtseqnr": fieldData["@fieldseqnr"],
                "@value": fieldData["@value"]
            });
        });

        //generate the needed json for the search
        var jsonin_ADV_SEARCH = {
            EWS: {
                SERVICE: "ADV_SEARCH",
                /*OBJECT: {
                "#text": global.objectId,
                "@TYPE": global.objectType
                },*/
                PARAM: {
                    WID_SCREEN: screenId,
                    SADV_ID: this.searchId,
                    FILTER: {
                        //include the field values modified by the user
                        yglui_str_wid_field: fieldsArray
                    }
                }
            }
        };
        this.search(jsonin_ADV_SEARCH);
    },

    /**
    * It performs the advanced search
    */
    search: function(jsonin, previousNext) {
        var maxPage = this.recordsFound / this.records;
        maxPage = maxPage.ceil();
        //initial search
        if (!previousNext) {
            this.jsoninLastSearch = deepCopy(jsonin);
            this.actualPage = 1;
        }
        //next
        else if (previousNext == 'next') {
            jsonin = this.jsoninLastSearch;
            jsonin.EWS.PARAM.O_FROM = this.to + 1;
            this.actualPage++;
        }
        //previous
        else if (previousNext == 'prev') {
            jsonin = this.jsoninLastSearch;
            jsonin.EWS.PARAM.O_FROM = this.from - this.records;
            this.actualPage--;

        }
        //first
        else if (previousNext == 'first') {
            this.jsoninLastSearch.EWS.PARAM.O_FROM = null;
            jsonin = this.jsoninLastSearch;
            this.actualPage = 1;
        }
        //last
        else if (previousNext == 'last') {
            jsonin = this.jsoninLastSearch;
            var module = this.recordsFound % this.records;
            var div = this.recordsFound / this.records;
            if (module == 0) {
                jsonin.EWS.PARAM.O_FROM = (this.records * div.floor()) - this.records + 1;
            }
            else {
                jsonin.EWS.PARAM.O_FROM = (this.records * div.floor()) + 1;
            }
            this.actualPage = maxPage;
        }
        //page number
        else {
            if (previousNext > maxPage) {
                previousNext = maxPage;
                this.input.value = maxPage;
            }
            jsonin = this.jsoninLastSearch;
            jsonin.EWS.PARAM.O_FROM = (this.records * previousNext) - this.records + 1;
            this.actualPage = previousNext;
        }

        var conversor = new XML.ObjTree();
        conversor.attr_prefix = '@';
        var xmlin_ADV_SEARCH = conversor.writeXML(jsonin);
        //and make the call to the service
        this.makeAJAXrequest($H({
            xml: xmlin_ADV_SEARCH,
            successMethod: this.advSearchSuccess.bind(this)
        }));

    },
    /**
    * Handles the AJAX response for ADV_SEARCH service
    */
    advSearchSuccess: function(response) {

        if (!Object.jsonPathExists(response, "EWS.o_result.values.item")) {
            this.searchResultsContainer.update("No results found");
            return;
        }

        //retrieve data from the search to be used in the pagination
        this.from = parseInt(response.EWS.o_from, 10);
        this.recordsFound = parseInt(response.EWS.o_records_found, 10);

        //initialize the containers for the table
        var table = new Element("table").addClassName('sortable');
        var thead = new Element("thead");
        var tbody = new Element("tbody");

        this.searchResultsContainer.update(table);
        table.insert(thead).insert(tbody);

        //insert table cells
        var headersData = objectToArray(response.EWS.o_result.header.item);

        var selection = new Element("th").insert("Select");

        //store all headers together
        var headers = $A([selection]);

        headersData.each(function(headerData, index) {
            var classToSort = index == 0 ? "table_sortfirstdesc" : "";

            //Create the headers elemetns
            headers[parseInt(headerData["@colseqnr"], 10)] = new Element("th", {
                'class': classToSort
            }).insert(new Element("acronym", {
                title: headerData["@colname"]
            }).insert(headerData["@colname"]));
        });
        headers = $A(headers);

        //loop headers and put all of them into a tr
        var trHead = new Element("tr");
        headers.each(function(header) {
            trHead.insert(header);
        });

        thead.insert(trHead);

        var resultsData = objectToArray(response.EWS.o_result.values.item);

        //calculate search data for the pagination
        this.to = this.from - 1 + resultsData.size();

        var results = $A();
        //create needed elements 
        resultsData.each(function(result, index) {

            var name = result["@name"];
            var type = result["@otype"];
            var employeeId = result["@objid"];
            var strKey = result["@str_key"];

            var columns = $A();
            if (this.multiple) {
                var checkbox = new Element("input", { "type": "checkbox" });

                checkbox.observe("click", function(event) {
                    if (this.addingQueue.get(employeeId)) {
                        this.addingQueue.unset(employeeId);
                    } else {
                        this.addingQueue.set(employeeId, {
                            name: name,
                            type: type,
                            strKey: strKey
                        });
                    }
                } .bind(this));
                columns.push(checkbox);
                if (this.addingQueue.keys().include(result['@objid'])) {
                    checkbox.checked = true;
                    checkbox.defaultChecked = true;
                }
            }
            else {
                var radio = new Element("input", { "type": "radio", "name": "employees" });
                radio.observe("click", function(event) {
                    this.addingQueue = $H();
                    this.addingQueue.set(employeeId, {
                        name: name,
                        type: type,
                        strKey: strKey
                    });
                } .bind(this));
                columns.push(radio);

            }

            objectToArray(result.columns.item).each(function(column) {
                columns[parseInt(column["@colseqnr"], 10)] = new Element("acronym", {
                    "title": column["@value"]
                }).insert(column["@value"]);
            });

            columns = $A(columns);

            results.push(columns);

        } .bind(this));
        //insert them in the table
        results.each(function(result) {
            var tr = new Element("tr");
            result.each(function(column) {
                tr.insert(new Element("td").insert(column));
            });

            tbody.insert(tr);
        });

        TableKit.Sortable.init(table);
        TableKit.options.autoLoad = false;

        //Draw the pagination
        if (this.recordsFound > this.records) {
            this.drawPagination();
        }

        //Put the add button


        var addButtonJson = {
            elements: [{
                idButton: 'addEmployee',
                label: global.getLabel('addAdvancedSearch'),
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: function() {
                    if (this.addToMenu) {
                        this.addingQueue.each(function(employee) {
                            global.addEmployee(employee.value.name, employee.key, employee.value.type);
                        });
                    }
                    document.fire('EWS:allEmployeesAdded', $H({ comeFromMenu: this.comeFromMenu, employeesAdded: this.addingQueue }));
                    this.close();
                } .bind(this),
                type: 'button',
                standardButton: true
}]
            };
            var addButton = new megaButtonDisplayer(addButtonJson);
            var addButtonElement = addButton.getButtons();

            this.searchResultsContainer.insert(addButtonElement);
        },
        /**
        * Draws the elements for the pagination.
        */
        drawPagination: function() {
            var buttonsContainer = new Element("div", {
                'class': 'ADVS_buttonsContainer'
            }).insert("<div id='ADVS_prevButtons' class='ADVS_buttons'></div>")
	.insert("<div id='ADVS_textArea' class='ADVS_buttons'></div>")
	.insert("<div id='ADVS_nextButtons' class='ADVS_buttons'></div>");
            //Create Div to include the number of page
            var maxPage = this.recordsFound / this.records;
            maxPage = maxPage.ceil();
            this.numbers = new Element('div', { 'class': 'ADVS_numbers' }).insert(this.actualPage + '/' + maxPage);
            buttonsContainer.insert(this.numbers);

            //Draw the buttons
            //previous buttons
            var prevJson = {
                elements: []
            };
            var prev = {
                idButton: 'previous',
                label: '&lt',
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: this.search.bind(this, null, 'prev'),
                type: 'button',
                standardButton: true
            };
            // first button
            var first = {
                idButton: 'first',
                label: '&lt&lt',
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: this.search.bind(this, null, 'first'),
                type: 'button',
                standardButton: true
            };
            prevJson.elements.push(first);
            prevJson.elements.push(prev);
            var ButtonsPrev = new megaButtonDisplayer(prevJson);
            var pButtons = ButtonsPrev.getButtons();
            //next buttons
            var nextJson = {
                elements: []
            };
            var next = {
                idButton: 'next',
                label: '&gt',
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: this.search.bind(this, null, 'next'),
                type: 'button',
                standardButton: true
            };
            //last button
            var last = {
                idButton: 'last',
                label: '&gt&gt',
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: this.search.bind(this, null, 'last'),
                type: 'button',
                standardButton: true
            };
            nextJson.elements.push(next);
            nextJson.elements.push(last);
            var ButtonsNext = new megaButtonDisplayer(nextJson);
            var nButtons = ButtonsNext.getButtons();
            //insert buttons in div
            buttonsContainer.down('[id=ADVS_prevButtons]').insert(pButtons);
            buttonsContainer.down('[id=ADVS_nextButtons]').insert(nButtons);

            //create the text field for introduce the numbers
            if (!this.input) {
                this.input = new Element("input", { 'type': 'text', 'class': 'ADVS_textArea' });
                this.input.observe('keyup', this.pressEnter.bindAsEventListener(this));
            }
            //insert text area
            buttonsContainer.down('[id=ADVS_textArea]').insert(this.input);

            this.searchResultsContainer.insert(buttonsContainer);
            if (this.actualPage == 1) {
                ButtonsPrev.disable('previous');
                ButtonsPrev.disable('first');
            }
            else if (this.actualPage == maxPage) {
                ButtonsNext.disable('next');
                ButtonsNext.disable('last');
            }

        },

        /**
        * Check if the user introduce an Enter in the text Area
        */
        pressEnter: function(event) {
            if (event.keyCode == Event.KEY_RETURN) {
                var value = parseInt(this.input.value);
                this.search(null, value);
            }
        },
        /**
        * Handles click on clear button
        */
        clearHandler: function(args) {
            this.advancedSearchFieldPanel.destroy();
            this.advancedSearchFieldPanel = new getContentModule({
                appId: objectToArray(this.json.EWS.o_widget_screens.yglui_str_wid_screen)[0]["@appid"],
                mode: 'create',
                showCancelButton: false,
                hideButtonsOnCreate: false,
                json: this.json,
                buttonsHandlers: $H({
                    DEFAULT_EVENT_THROW: "EWS:AS_buttonClicked"
                })
            });
            this.searchFormContainer.update(this.advancedSearchFieldPanel.getHtml());
            this.searchFormContainer.down('div#applicationsLayer_button_CLEAR').className = 'fieldDispFloatLeft';
            this.searchFormContainer.down('div#applicationsLayer_button_LOAD').className = 'fieldDispFloatLeft';
            this.searchFormContainer.down('div#applicationsLayer_button_SAVE').className = 'fieldDispFloatLeft';
        },

        /**
        * Handles the click in one of the field panel's buttons.
        */
        onButtonClicked: function(args) {
            var buttonArgs = getArgs(args);
            switch (buttonArgs.action) {
                case "SAVE":
                    this.getFilterName(args);
                    break;
                case "CANCEL":
                    this.cancelHandler(args);
                    break;
                case "START":
                    this.startHandler(args);
                    break;
                case "CLEAR":
                    this.clearHandler(args);
                    break;
                case "LOAD":
                    this.loadHandler(args);
                    break;
            }
        },

        /**
        * Handle the response for the GET_SHLP service
        */
        getShlpSuccess: function(response) {

            this.json = response;
            if (this.filters) {
                var screensValues = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
                for (var i = 0; i < screensValues.length; i++) {
                    if (screensValues[i]['@screen'] == this.screen) {
                        screensValues[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field = this.filters;
                    }
                }
            }
            //If the field panel already exists, remove it and create a new one.
            if (this.advancedSearchFieldPanel) {
                this.advancedSearchFieldPanel.destroy();
                delete this.advancedSearchFieldPanel;
            }

            if (this.screen) {
                var index = 0;
                objectToArray(response.EWS.o_widget_screens.yglui_str_wid_screen).each(function(screen, screenIndex) {
                    if (screen["@screen"] == this.screen) {
                        index = screenIndex;
                        throw $break;
                    }
                } .bind(this));
                objectToArray(response.EWS.o_widget_screens.yglui_str_wid_screen)[index]["@selected"] = "X";
            } else {
                var anySelected = false;
                objectToArray(response.EWS.o_widget_screens.yglui_str_wid_screen).each(function(screen, index) {
                    if (screen["@selected"] == "X") {
                        anySelected = true;
                        throw $break;
                    }
                });
                if (!anySelected) {
                    objectToArray(response.EWS.o_widget_screens.yglui_str_wid_screen)[0]["@selected"] = "X";
                }
            }

            //create the advanced search's field panel
            this.advancedSearchFieldPanel = new getContentModule({
                appId: objectToArray(response.EWS.o_widget_screens.yglui_str_wid_screen)[0]["@appid"],
                mode: 'edit',
                showCancelButton: false,
                hideButtonsOnEdit: false,
                json: this.json,
                buttonsHandlers: $H({
                    DEFAULT_EVENT_THROW: "EWS:AS_buttonClicked",
                    paiEvent: this.advSearchPai.bind(this)
                })
            });
            this.searchFormContainer.update(this.advancedSearchFieldPanel.getHtml());
            this.searchFormContainer.down('div#applicationsLayer_button_CLEAR').className = 'fieldDispFloatLeft';
            this.searchFormContainer.down('div#applicationsLayer_button_LOAD').className = 'fieldDispFloatLeft';
            this.searchFormContainer.down('div#applicationsLayer_button_SAVE').className = 'fieldDispFloatLeft';
        },
        advSearchPai: function(args) {
            var arguments = getArgs(args);
            var servicePai = arguments.servicePai;
            var application = global.currentApplication;
            var appId = application.appId;
            var jsonToSend = {
                EWS: {
                    SERVICE: servicePai,
                    PARAM: {
                        SADV_ID: this.searchId,
                        APPID: appId,
                        FILTER: this.json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields
                    }
                }
            };
            var json2xml = new XML.ObjTree();
            json2xml.attr_prefix = '@';
            this.makeAJAXrequest($H({
                xml: json2xml.writeXML(jsonToSend),
                successMethod: 'getShlpSuccess'
            }));
        },
        /**
        * Closes the advanced search and resets its properties
        */
        close: function($super) {
            this.from = null;
            this.saveContainer = null;
            this.to = null;
            this.records = null;
            this.addingQueue = $H({});
            //Destroy the fieldpanel
            if (this.advancedSearchFieldPanel) {
                this.advancedSearchFieldPanel.getHtml().remove();
                this.advancedSearchFieldPanel.destroy();
                //and clear the advanced search containers
                this.searchFormContainer.update();
                this.searchResultsContainer.update();
            }
            this.popUpApplication.close();
            $super();
        }
    });
    var loadAVS = Class.create(Application, {

        initialize: function($super, args) {
            $super(args);

        },
        /**
        * Load a new filter search
        */
        run: function($super, args) {
            $super(args);
            this.searchId = args.get('searchId');
            this.appId = this.options.appId;
            this.screen = args.get('screen');
            this.pages = parseInt(global.paginationLimit);
            this.filterMultiple = args.get('multiple');
            this.container = new Element('div', { 'id': 'load_containerList', 'class': 'loadContainer' });
            if (this.firstRun) {
                this.virtualHtml.insert(this.container);
            }
            else {
                this.virtualHtml.update(this.container);
            }
            this.getFilterList();
        },
        /**
        * Call to the service to retrieve a list with all the filters saved
        */
        getFilterList: function() {
            var jsonin_load_filter = {
                EWS: {
                    SERVICE: "GET_SHLP_LST",
                    PARAM: {
                        SADV_ID: this.searchId,
                        SCREEN: '',
                        APPID: this.appId
                    }
                }
            };
            var conversor = new XML.ObjTree();
            conversor.attr_prefix = '@';
            var xmlin_load_filter = conversor.writeXML(jsonin_load_filter);
            //and make the call to the service
            this.makeAJAXrequest($H({
                xml: xmlin_load_filter,
                successMethod: this.manageFilterList.bind(this)
            }));
        },
        /**
        * Create a list with all the filters 
        */
        manageFilterList: function(json) {
            var radioHash = $H();
            //new container for the table
            var tableContainer = new Element('div', { 'id': 'filterContainer' });
            this.container.update(tableContainer);
            if (!Object.isEmpty(json.EWS.o_sadv_h)) {
                //creating the table structure
                var html = "<table id='ADVS_filterTable' class='sortable ADVS_table'>"
                        + "<thead>"
	                        + "<tr><th class='table_sortfirstdesc ADVS_filter_radio' id='ADVS_radio'>" + global.getLabel('select') + "</th><th id='ADVS_filter' class='ADVS_filter_name'>" + global.getLabel('filter') + "</th></tr>"
                        + "</thead><tbody id='tableKit_body'>";
                // get the data for each filter
                var filters = objectToArray(json.EWS.o_sadv_h.item);
                for (var i = 0; i < filters.length; i++) {
                    var seqnr = filters[i]['@seqnr'];
                    var name = filters[i]['#text'];
                    var saveId = filters[i]['@sadv_id'];
                    html += "<tr><td><input id='checkBox_" + seqnr + "' type='radio' name='group1' value='" + seqnr + "'/></td><td class='ADVS_td_name'>" + name + "</td></tr>";
                    radioHash.set(seqnr, {
                        seqnr: seqnr,
                        name: name,
                        saveId: saveId
                    });

                }
                html += "</tbody></table>";
                tableContainer.update(html);
                //Starting the table kit
                TableKit.Sortable.init($('ADVS_filterTable'), { pages: this.pages });
                TableKit.options.autoLoad = false;
                //observe the click in the table to update the radio buttons
                tableContainer.observe('click', this.updateRadio.bindAsEventListener(this, radioHash));
            }
            else {
                var html = "<table id='ADVS_filterTable_empty' class='sortable ADVS_table'>"
                        + "<thead>"
	                        + "<tr>"
	                            + "<th class='table_sortfirstdesc ADVS_filter_radio' id='ADVS_radio'>" + global.getLabel('select') + "</th>"
	                            + "<th id='ADVS_filter' class='ADVS_filter_name'>" + global.getLabel('filter') + "</th>"
	                        + "</tr>"
                        + "</thead>"
                        + "<tbody id='tableKit_body'>"
                            + "<tr>"
                                + "<td></td>"
                                + "<td>" + global.getLabel('noResults') + "</td>"
                            + "</tr>"
                        + "</tbody>"
                       + "</table>";

                tableContainer.update(html);
                //Starting the table kit
                TableKit.Sortable.init($('ADVS_filterTable_empty'), { pages: this.pages });
                TableKit.options.autoLoad = false;
            }
            this.includeButtons();
        },
        /**
        * Update a data structure to store the info for each radio button
        */
        updateRadio: function(event, hash) {
            // if you are clicked in an input
            if (event.element().match("input")) {
                var seqnr = event.element().value;
                this.loadData = { 'seqnr': seqnr, 'name': hash.get(seqnr).name, 'saveId': hash.get(seqnr).saveId };
            }
        },
        /**
        * Include the buttons to handle the application 
        */
        includeButtons: function() {
            var contentButtons = new Element('div', { 'class': 'ADVS_containerButtons' });
            this.container.insert(contentButtons);

            var buttonsJson = {
                elements: []
            };
            //back button
            var back = {
                idButton: 'back',
                label: global.getLabel('back'),
                handlerContext: null,
                className: 'ADVS_backButton',
                handler: this.goBack.bind(this),
                type: 'button',
                standardButton: true
            };
            //select button
            var select = {
                idButton: 'select',
                label: global.getLabel('select'),
                handlerContext: null,
                className: 'ADVS_selectButton',
                handler: this.selectFilter.bind(this),
                type: 'button',
                standardButton: true
            };
            //delete button
            var deleteB = {
                idButton: 'delete',
                label: global.getLabel('delete'),
                handlerContext: null,
                className: 'ADVS_deleteButton',
                handler: this.deleteFilter.bind(this),
                type: 'button',
                standardButton: true
            };
            buttonsJson.elements.push(select);
            buttonsJson.elements.push(deleteB);
            buttonsJson.elements.push(back);
            var buttonsADVS = new megaButtonDisplayer(buttonsJson);
            var buttons = buttonsADVS.getButtons();
            //insert buttons in div
            contentButtons.update(buttons);
        },

        selectFilter: function() {
            var name = this.loadData.name;
            var saveId = this.loadData.saveId;
            var seqnr = this.loadData.seqnr;
            var jsonin_select_filter = {
                EWS: {
                    SERVICE: "GET_SHLP_VAL",
                    PARAM: {
                        SADV_ID: saveId,
                        SEQNR: seqnr,
                        APPID: this.appId
                    }
                }
            };
            var conversor = new XML.ObjTree();
            conversor.attr_prefix = '@';
            var xmlin_select_filter = conversor.writeXML(jsonin_select_filter);
            //and make the call to the service
            this.makeAJAXrequest($H({
                xml: xmlin_select_filter,
                successMethod: this.chargeFilter.bind(this)
            }));
        },

        chargeFilter: function(json) {
            var screen = json.EWS.o_sadv_h['@screen'];
            var searchId = json.EWS.o_sadv_h['@sadv_id'];
            var values = json.EWS.o_sadv_v.yglui_str_wid_field;
            this.close();
            global.open({
                app: {
                    tabId: 'POPUP',
                    appId: 'ADVS',
                    view: 'AdvancedSearch'
                },
                "sadv_id": this.searchId,
                "filterValues": values,
                "screen": screen,
                "multiple": this.filterMultiple
            });
        },

        deleteFilter: function() {
            var name = this.loadData.name;
            var saveId = this.loadData.saveId;
            var seqnr = this.loadData.seqnr;
            var jsonin_delete_filter = {
                EWS: {
                    SERVICE: "DEL_SHLP",
                    PARAM: {
                        SADV_ID: saveId,
                        SEQNR: seqnr
                    }
                }
            };
            var conversor = new XML.ObjTree();
            conversor.attr_prefix = '@';
            var xmlin_delete_filter = conversor.writeXML(jsonin_delete_filter);
            //and make the call to the service
            this.makeAJAXrequest($H({
                xml: xmlin_delete_filter,
                successMethod: this.manageDeleteFilter.bind(this)
            }));
        },

        manageDeleteFilter: function(json) {
            if ($('ADVS_filterTable'))
                TableKit.unloadTable($('ADVS_filterTable'));
            else
                TableKit.unloadTable($('ADVS_filterTable_empty'));
            this.getFilterList();

        },
        /**
        * Open again the advanced search application
        */
        goBack: function() {
            this.close();
            global.open({
                app: {
                    tabId: 'POPUP',
                    appId: 'ADVS',
                    view: 'AdvancedSearch'
                },
                "sadv_id": this.searchId
            });
        },
        /**
        * Close the application
        */
        close: function($super) {
            if ($('ADVS_filterTable'))
                TableKit.unloadTable($('ADVS_filterTable'));
            else
                TableKit.unloadTable($('ADVS_filterTable_empty'));
            this.popUpApplication.close();
            $super();
        }

    });