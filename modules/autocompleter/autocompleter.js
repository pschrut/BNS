/*
 *@class JSONAutocompleter
 *@desc class with implementation of a autocompletion searchbox.
 *@inherit Autocompleter.Local
 */
var JSONAutocompleter = Class.create(Autocompleter.Local, {

    /*
    * @method initialize
    * @param divElement {String} Id of the div container for the autocompleter box.
    * @param options {JSON} A Javascript object containing all the options for the Autocompleter
    * @param json {JSON} An object with the data for the autocompleter.
    */
    initialize: function ($super, divElement, options, json) {
        this.iaz_preserved_elements = [];
        this.iaz_preserved_zindexes = [];
        this.setOptions(options);
        //This variable is used to tell if we should show all options due to the showEverythingOnButtonClick variable
        //or no. It is needed because otherwise there is no way to tell if the selector was called because of a click
        //on the arrow or because we started to type in the textArea.
        this.showAllOptions = true;
        //Keeps track of the status of the searches: it is true, if results are only partial and backend calls need
        //to be made for further searches
        this.refineSearch = false;
        //Based on the entered text and the search results, it contains whether the autocompleter should search locally
        //without calling backend or no
        this.searchLocally = false;
        //If the backend search returns an error, then this variable is set to true, to indicate that we must show error message
        this.error = false;
        this.enabled = true;
        //Keeps track of the last entry, but is only updated if a backend call is made
        this.lastEntry = null;

        if (Object.isElement(divElement)) {
            this.divElementId = divElement.identify()
        } else {
            this.divElementId = divElement;
            divElement = $(this.divElementId);
        }
        /*
        * @name timeoutExpired
        * @type Boolean
        * @desc A boolean that is true if the timeout to make a new call for new data
        * 		 has expired. If it's false, no new calls are made.
        */
        this.timeoutExpired = true;

        /*
        * @name options.array
        * @type Array
        * @desc this array contains the options that will be used to autocomplete the
        * 		user entries in the text area. its an Array of Hashes
        * @see initData
        */
        //this.options.array = new Array();
        /*
        * @name shownFlags
        * @type Array
        * @desc this array contains the flags with the first element that we should show
        */
        this.shownFlags = new Array();
        //Initialization of HTML elements that are going to be needed
        var formContainer = new Element('div', {
            'class': 'autocompleter_form_container'
        });

        var textAreaElement = new Element('input', {
            'type': 'text',
            'id': 'text_area_' + this.divElementId,
            'name': 'text_area_' + this.divElementId,
            'class': 'application_autocompleter_box'
        });
        textAreaElement.observe('focus', function (event) {
            if (this.options.label == textAreaElement.value) {
                textAreaElement.value = "";
            }
        } .bindAsEventListener(this));

        this.element = textAreaElement;

        var showAllButton = new Element('button', { 'alt': global.getLabel('year'), 'title': global.getLabel('year'), 'class': 'icon autocompleter_button_showall', 'id': 'button_' + this.divElementId });
        showAllButton.insert("&nbsp;");

        this.showAllButton = showAllButton;

        formContainer.insert(textAreaElement).insert(showAllButton);

        var optionsDivElement = new Element('div', {
            'id': 'options_' + this.divElementId,
            'class': 'autocompleter_autocomplete'
        });

        divElement.insert(formContainer).insert(optionsDivElement);
        divElement.addClassName('autocompleter_container');

        var aObjects = this.initData(json);
        var minChar = this.options.minChars;

        //Calling to the superclass initializer
        if (!options.virtualVariables)
            $super(textAreaElement.identify(), optionsDivElement.identify(), aObjects, options);
        else
            $super(textAreaElement, optionsDivElement, aObjects, options);
        //Force minChar to 0, if it's neccesary.
        if (minChar == 0 && this.options.minChars > 0) {
            this.options.minChars = 0;
        }
        if (this.options.autoWidth) {
            textAreaElement.setStyle({
                'width': this.textAreaWidth + 'px'
            });
        }

        //initialize i18n strings
        if (!Object.isEmpty(json.autocompleter.multilanguage)) {
            if (!Object.isEmpty(json.autocompleter.multilanguage.no_results))
                this.noResultsString = json.autocompleter.multilanguage.no_results;
            else
                this.noResultsString = global.getLabel('no_result');
        } else {
            this.noResultsString = global.getLabel('no_result');
        }

        showAllButton.observe('click', function (event) {
            this.shownFlags.clear();
            this.shownFlag = 0;
            if (!this.enabled) return;
            this.blurFromButton = true;
            this.element.focus();
            var aboutToHide = this.active;
            if (!this.active) {
                this.activate();
            } else {
                this.active = false;
                this.hide();
            }
            //If the option to call backend is enabled, then we search in backend
            if (this.options.searchWithService && !aboutToHide) {
                this.callService(true);
            }
            //We check the timeout. If it's expired we fire for new data and
            //restart the timeout.
            if (this.timeoutExpired) {
                if (this.options.events && this.options.events.get('onGetNewXml')) {
                    document.fire(this.options.events.get('onGetNewXml'), {
                        idAutocompleter: this.divElementId
                    });
                }
                //We delay startNewDataTimeout execution in the number of milliseconds specified in options.
                this.startNewDataTimeout.delay(this.options.timeout / 1000, this);
                this.timeoutExpired = false;
            }
        } .bindAsEventListener(this), true);

        //set the default value
        if (!Object.isUndefined(this.defaultElement)) {
            this.element.setValue(unescape(this.options.templateResult.interpolate(this.options.array[this.defaultElement])));
        } else if (!Object.isEmpty(this.options.label)) {
            this.setLabel(this.options.label);
        }
        Event.observe(this.element, 'keyup', this.onKeyPress.bindAsEventListener(this));
    },

    /*
    * @method setOptions
    * @param options {JSON} passed as an argument to the class constructor
    * @desc it configures the new searchbox based on the options passed as an argument to the constructor
    * @return void
    * @inherit Autocompleter.Local.setOptions(options)
    */
    setOptions: function (options) {
        var _this = this;
        this.options = Object.extend({
            /*
            * @name fireEventWhenDefaultValueSet
            * @type boolean
            * @desc if true, the onResultSelected event is fired when a defaultValue is set
            */
            fireEventWhenDefaultValueSet: true,
            /*
            * @name label
            * @type String
            * @desc a label to be shown inside the autocompleter. Just used if it has a value.
            */
            label: null,
            /*
            *@name events
            *@type hash
            *@desc hash with the events id
            */
            events: $H({}),
            /*
            * @name autoWidth
            * @type {boolean}
            * @desc when true the text area width is auto calculated, so the whole text fits it.
            */
            autoWidth: false,
            /*
            * @name showEverythingOnButtonClick
            * @type {boolean}
            * @desc when true on arrow button click list shows unfiltered options list. Otherwise it
            * 		 will show the filtered list.
            */
            showEverythingOnButtonClick: false,
            /*
            * @name emptyOnBlur
            * @type {boolean}
            * @desc when true text area is cleared if it lost the focus and there's not valid text entered. when false the
            * 		 autocompleter will show the last valid selected option.
            */
            emptyOnBlur: false,
            /*
            * @name minChar
            * @type {Integer}
            * @desc how many characters the user has to type before the options list is shown
            */
            minChars: 3,
            /*
            * @name timeout
            * @type {Integer}
            * @desc number of milisecond to wait (at least) between to consecutive events to ask for new data.
            * 		 Autocompleter won't ask for new data before the timeout expires.
            */
            timeout: 5000,
            /*
            * @name templateOptionsList
            * @type {Template}
            * @desc a string representing the template wanted to be used in options list
            * @see Documentation for Template class in prototype API
            */
            templateOptionsList: '#{text} \<#{data}\>',
            /*
            * @name templateResult
            * @type {Template}
            * @desc a string representing the template wanted to be used in text area
            * 		 when a new result is selected
            * @see Documentation for Template class in prototype API
            */
            templateResult: '#{text} \<#{data}\>',
            /*
            * @name splitSelectors
            * @type {Array}
            * @desc an Array of characters to be used as selectors
            * @see  you should read carefully origin.js multiSelectorSplit() documentation before
            * 		 adding new selectors.
            */
            splitSelectors: ['\\.', ',', '@'],
            /*
            * @name xmlToSend
            * @type {String}
            * @desc Contains the XML to send to the service, with <SEARCH_PATTERN /> where the
            *       search query should go
            */
            xmlToSend: null,
            /*
            * @name searchWithService
            * @type {boolean}
            * @desc If the search should be done through a service or no
            */
            searchWithService: false,
            /*
            * @name url
            * @type {string}
            * @desc URL of the service to be called
            */
            url: null,
            /*
            * @name method
            * @type {string}
            * @desc Method type of the service to be called (usually POST)
            */
            method: null,
            /*
            * @name maxShown
            * @type {Integer}
            * @desc how many results are shown, if auto, it will be changed to 10
            */
            maxShown: 'auto',
            /*
            * @method onShow
            * @param element {Element}
            * @param update{Element}
            * @desc method called when the list of options is shown. It could be used to give
            * 		 effects on showing the list, but it would need to respect the same code
            * 		 it includes now as it applies some CSS fixes to avoid crossbrowser problems.
            * @inherit Autocompleter.Base.options.onShow()
            */
            onShow: function (element, update) {
                _this.autocompleterOnShowFixes(update);
                update.show();
            },
            /*
            * @name noFilter
            * @type boolean
            * @desc if true, the autocompleter will show everything without filtering
            */
            noFilter: false,

            /*
            * @method onHide
            * @param element {Element}
            * @param update {Element}
            * @desc method called when the list of options is hidden. It could be used to give
            * 		 effects on hiding the list, but it would need to respect the same code
            * 		 it includes now as it applies some CSS fixes to avoid crossbrowser problems.
            * @inherit Autocompleter.Base.options.onHide()
            */
            onHide: function (element, update) {
                _this.autocompleterOnHideFixes(update);
                update.hide();
            },

            /*
            * @metod selector
            * @param instance {Autocompleter}
            * @desc method that implements the selection logic for the autocompletion
            * @return {String} A String that contains an <ul> with a list of options
            */
            selector: function (instance) {
                if (instance.blurFromButton == true)
                    instance.hide();
                instance.active = false;
                var ret = [];
                //Obtaining the entered text
                var entry = instance.getToken() == instance.options.label ? '' : escape(instance.getToken());
                var resultsList = '<ul id=ul_' + instance.divElementId + '>';
                //Used to calculate the width of the autocompleter options list
                var largestOption = 0;
                var optionsTemplate = new Template(instance.options.templateOptionsList);
                if (optionsTemplate.template.include('value'))
                    optionsTemplate.template = optionsTemplate.template.gsub('value', 'data');
                var reductionFactor = 1.3;

                //compute whether the list is being filtered or not.
                if (instance.options.showEverythingOnButtonClick && this.showAllOptions) {
                    instance.filter = false;
                } else {
                    instance.filter = entry.length && !instance.blurFromButton && !this.noFilter &&
                    //we should filter if backend calls are disabled, or if they are enabled, but local search should be done
                        (!this.searchWithService || (this.searchWithService && !instance.refineSearch && instance.searchLocally));
                }
                var shownFlag = instance.shownFlag;
                instance.shownFlags.push(shownFlag);
                var downHTML = "";
                var upHTML = "";
                this.moreValues = false;
                var length;
                if (instance.options.maxShown < instance.options.array.length)
                    length = instance.options.maxShown;
                else
                    length = instance.options.array.length;
                var query = unescape(entry).toLowerCase();
                //tokenizing the entry
                var words = query.split(' ');
                //The filtering algorithm:
                //Tokenizes the entry and searches for every word
                //Only shows the results that contain each and every word of the entry
                if (instance.filter) {
                    //we iterate through every option in the list and search for the entry
                    for (var i = shownFlag; i < instance.options.array.length; i++) {
                        //Get both text and data tokens
                        var sText = instance.options.array[i].get('text');
                        var sTextLowerCase = escape(unescape(sText).toLowerCase()).toLowerCase();
                        var sData = instance.options.array[i].get('data');
                        var sDataLowerCase = escape(unescape(sData).toLowerCase()).toLowerCase();
                        var title = instance.options.array[i].get('title') ? instance.options.array[i].get('title') : "";
                        //Create a string for the text and data using the options list template to search in the
                        //text that appears on the screen
                        //If the certain option does not have data, then we show only text
                        //We have to unescape it so that we do not search in signs like "&gt;"
                        if (Object.isEmpty(sData))
                            var option = sText;
                        else
                            var option = optionsTemplate.evaluate($H({
                                text: unescape(sText),
                                data: unescape(sData)
                            }));
                        //Searching in lower case to avoid problems with caps
                        var optionLowerCase = option.toLowerCase();
                        //List element that will include the new result.
                        if (Object.isEmpty(title))
                            title = option;
                        var listElement = "<li title='" + title + "' id='" + instance.divElementId + "_li_" + i + "'>&nbsp;";

                        var validOption = false;
                        //will be used to show the underlined text in the list with the correct capitalization
                        var correctCapEntry = '';
                        //variable to keep track of the result of the search
                        var allMatch = true;
                        //if we find all the words of the entry in the current option text, then we should show it as result
                        for (j = 0; j < words.length; j++) {
                            if (!optionLowerCase.include(words[j])) {
                                allMatch = false;
                                break;
                            }
                        }
                        //if the result is valid, then we escape the HTML, to be able to show < > correctly,
                        //we underline the result, and add to the result list
                        if (allMatch) {
                            //To determine the needed width for the results
                            if (largestOption < option.length)
                                largestOption = option.length;
                            option = option.escapeHTML();
                            words = instance.fixSearchQuery(words, sText);
                            option = underlineSearch(option, words, "autoc_coincidence");
                            if (ret.length < length) {

                                listElement = listElement.concat(option);
                                ret.push(listElement);
                            } else {
                                this.moreValues = true;
                            }
                        }

                    }
                } else {
                    //getting max width
                    for (var l = 0; l < instance.options.array.length; l++) {
                        var option = optionsTemplate.evaluate($H({
                            text: unescape(instance.options.array[l].get('text')),
                            data: unescape(instance.options.array[l].get('data'))
                        })).escapeHTML();
                        if (largestOption < option.length)
                            largestOption = option.length;
                    }
                    for (var i = shownFlag; i < shownFlag + length; i++) {
                        if (!instance.options.array[i].get('used')) {
                            var title = instance.options.array[i].get('title') ? instance.options.array[i].get('title') : "";
                            var option = instance.options.array[i].get('data') ? unescape(optionsTemplate.evaluate(instance.options.array[i])).escapeHTML() :
                                unescape(instance.options.array[i].get('text')).escapeHTML();
                            if (largestOption < option.length)
                                largestOption = option.length;
                            if (Object.isEmpty(title))
                                title = option;
                            if (entry != '') {
                                words = instance.fixSearchQuery(words, instance.options.array[i].get('text'));
                                option = underlineSearch(option, words, "autoc_coincidence");
                            }
                            var listElement = '<li title="' + title + '" id=\'' + instance.divElementId + '_li_' + i + '\'>&nbsp;';
                            listElement = listElement.concat(option);
                            listElement = listElement.concat('</li>');

                            ret.push(listElement);
                        }
                    }
                }
                if (instance.refineSearch && global.getLabel("refineSearch").length > largestOption) {
                    largestOption = global.getLabel("refineSearch").length;
                }
                //If we have to show an error message, then we set the width based on that
                if (instance.error && !Object.isEmpty(instance.errorMessage)) {
                    largestOption = instance.errorMessage.length;
                } else {
                    largestOption = largestOption != 0 ? largestOption : instance.noResultsString.length;
                }

                var fontSize = instance.update.getStyle('font-size').sub('px', '');
                if (largestOption > 20)
                    reductionFactor = 1.8;
                if (largestOption > 50)
                    reductionFactor = 2.3;
                var listSize = parseInt(fontSize) * largestOption / reductionFactor;
                if (instance.element.cumulativeOffset().left + listSize > document.viewport.getWidth())
                    listSize = document.viewport.getWidth() - instance.element.cumulativeOffset().left - 5;
                //We add the correct width for the whole list and join it to get shown to the user
                for (var k = 0; k < ret.length; k++) {
                    ret[k] = ret[k].sub('<li ', '<li style="width: ' + listSize + 'px;" ');
                }

                if (ret.length != 0) {
                    resultsList = resultsList.concat(ret.join(" "));
                    //We should show the error message if there was an error
                } else if (instance.error && !Object.isEmpty(instance.errorMessage)) {
                    instance.error = false;
                    //If there was an error, the refine search message should not be shown
                    var hideRefineMessage = true;
                    resultsList = resultsList.concat('<li style="width: ' + listSize + 'px; color:red" >' + instance.errorMessage + '</li>');
                } else {
                    resultsList = resultsList.concat('<li style="width: ' + listSize + 'px;" >' + instance.noResultsString + '</li>');
                }
                //If there are no results, the refine search message should not be shown
                if (ret.length == 0) {
                    var hideRefineMessage = true;
                }


                styleUl = ' style ="height: auto; overflow:hidden; max-height: none; margin-top:22px; width:' + listSize + 'px;"';

                resultsList = resultsList.concat('</ul>');
                resultsList = resultsList.sub('<ul', '<ul ' + styleUl);


                if (shownFlag > 0) {
                    upHTML = "<div id='" + instance.divElementId + "_goUp' style='position:absolute; top:0px; width:" + listSize + "px;' class='autocompleter_scrollingDiv'><div id='" + instance.divElementId + "_up_arrow' style='margin-left:45%; margin-top:5px;' class='application_up_arrow'></div></div>";
                } else {
                    upHTML = "<div id='" + instance.divElementId + "_notGoUp' style='position:absolute; top:0px; width:" + listSize + "px;' class='autocompleter_scrollingDiv'><div id='" + instance.divElementId + "_up_arrow' style='margin-left:45%; margin-top:5px;'></div></div>";
                }
                if (((instance.options.array.length > i) && !instance.filter) || (this.moreValues)) {
                    downHTML = "<div id='" + instance.divElementId + "_goDown' style='position:relative; top:0px; width:" + listSize + "px;' class='autocompleter_scrollingDiv'><div id='" + instance.divElementId + "_down_arrow' style='margin-left:45%; margin-top:5px;' class='application_down_arrow'></div></div>";
                } else {
                    downHTML = "<div id='" + instance.divElementId + "_notGoDown' style='position:relative; top:0px; width:" + listSize + "px;' class='autocompleter_scrollingDiv'><div id='" + instance.divElementId + "_down_arrow' style='margin-left:45%; margin-top:5px;'></div></div>";
                }
                //If we need to refine the search and we do not show an error message, then we show the refineSearch message
                if (instance.refineSearch && !hideRefineMessage) {
                    refineHTML = "<div id='" + instance.divElementId + "_refineSearch' style='position:relative; top:0px; width:" + listSize + "px;' class='autocompleter_scrollingDiv'><div id='" + instance.divElementId + "_refineSearchLabel' style='margin-left:5%; margin-top:3px; margin-bottom:3px;'><span class='label'>" +
                        global.getLabel("refineSearch") + "</span></div></div>";
                } else {
                    refineHTML = '';
                }
                return resultsList + upHTML + refineHTML + downHTML;
            }
        }, options ||
        {});
        //We substitute the search pattern tag with the search template that we will use for the search query
        if (!Object.isEmpty(this.options.xmlToSend)) {
            if (this.options.xmlToSend.include('<SEARCH_PATTERN />'))
                this.options.xmlToSend = this.options.xmlToSend.replace('<SEARCH_PATTERN />', '<SEARCH_PATTERN>#{search}</SEARCH_PATTERN>');
            else if (this.options.xmlToSend.include('<SEARCH_PATTERN></SEARCH_PATTERN>'))
                this.options.xmlToSend = this.options.xmlToSend.replace('<SEARCH_PATTERN></SEARCH_PATTERN>', '<SEARCH_PATTERN>#{search}</SEARCH_PATTERN>');
        }
        if (this.options.maxShown == 'auto')
            this.options.maxShown = 10;
    },
    /*
    * @method updateElement
    * @param updateElement {Element} DOM Element that is the selected option
    * @desc this method updates the text area the selected option and fires an event
    * 		 containing text and id for the new selected option an id of the autocompleter.
    * 		 Arguments passed to the handler use a JSON object with the following format:
    * 		 object = {
    * 			textAdded,
    * 			idAdded,
    * 			idAutocompleter
    * 		 }
    */
    updateElement: function (selectedElement, throwEvent) {
        var elementIndex;
        if (selectedElement) {
            elementIndex = selectedElement.id.substr(selectedElement.id.lastIndexOf('_') + 1);
        } else {
            elementIndex = null;
        }
        if (Object.isEmpty(throwEvent))
            throwEvent = true; //the resultSelected event is fired by default
        if (elementIndex && selectedElement.identify().include('anonymous_element') || Object.isEmpty(selectedElement)) {
            elementIndex = Object.isUndefined(this.lastSelected) ? this.defaultElement : this.lastSelected;
            if (Object.isUndefined(elementIndex)) {

                return;
            }
        } else {
            this.lastSelected = elementIndex;
        }
        var textAreaTemplate = new Template(this.options.templateResult);
        if (!Object.isEmpty(this.options.array[this.lastSelected])) {
            if (Object.isEmpty(this.options.array[this.lastSelected].get('data')))
                this.element.value = unescape(this.options.array[this.lastSelected].get('text'));
            else
                this.element.value = unescape(textAreaTemplate.evaluate(this.options.array[this.lastSelected]));

            //JAWs compliant
            this.element.title = this.element.value;

            var dataObject = {
                textAdded: unescape(this.options.array[this.lastSelected].get('text')),
                idAdded: unescape(this.options.array[this.lastSelected].get('data')),
                idAutocompleter: this.divElementId,
                isEmpty: false
            };
            this._selectedData = dataObject;
            if (this.options.events && this.options.events.get('onResultSelected') && throwEvent != false) {
                try {
                    this.element.focus();
                } catch (e) { };
                document.fire(this.options.events.get('onResultSelected'), dataObject);
            }
        } else {
            this._selectedData = null;
            if (this.options.events && this.options.events.get('onResultSelected') && throwEvent != false) {
                document.fire(this.options.events.get('onResultSelected'), {
                    isEmpty: true
                });
            }
        }
    },
    getValue: function () {
        if (Object.isUndefined(this._selectedData)) {
            if (!Object.isEmpty(this.element.getValue()) && !Object.isEmpty(this.options.array[this.lastSelected])) {
                var dataObject = {
                    textAdded: unescape(this.options.array[this.lastSelected].get('text')),
                    idAdded: unescape(this.options.array[this.lastSelected].get('data')),
                    idAutocompleter: this.divElementId,
                    isEmpty: false
                };
            } else {
                return null;
            }
            return dataObject;
        } else
            return this._selectedData;
    },
    /*
    * @method clearInput
    * @desc It initializes the autocompleter..
    */
    clearInput: function () {
        this.timeoutExpired = true;
        this.update.update('');
        this.element.clear();
        this.lastSelected = null;
        this._selectedData = null;
    },
    /*
    * @method initData
    * @param json {JSON} The JSON object with the data
    * @desc It initializes data to be searched from the json object
    * @return {Array} An array containig a Hash formed by:
    * 			text: The text field
    * 			data: The data field
    */
    initData: function (json) {
        var aObjects = json.autocompleter.object;
        var sObjects = new Array(aObjects.length);
        var maxLength = 0;
        var reductionFactor = 2;
        this.shownFlag = 0;
        for (var i = 0; i < aObjects.length; i++) {
            if (!Object.isEmpty(aObjects[i].text))
                var sText = escape(aObjects[i].text);
            else
                var sText = "";
            if (!Object.isEmpty(aObjects[i].title))
                var sTitle = aObjects[i].title;
            else
                var sTitle = "";
            if (aObjects[i].data)
                var sData = escape(aObjects[i].data);
            else
                var sData = "";

            sObjects[i] = $H({
                text: sText,
                data: sData,
                title: sTitle
            });

            if (this.options.autoWidth) {
                var optionLength = unescape(this.options.templateResult.interpolate(sObjects[i])).length;
                maxLength = optionLength > maxLength ? optionLength : maxLength;
            }
            //get if this is the default element selected in the object
            if (!Object.isUndefined(aObjects[i].def)) {
                if (aObjects[i].def.strip().toLowerCase() == 'x') {
                    this.defaultElement = i;
                    this.lastSelected = i;
                }
            }
        }
        if (this.options.autoWidth) {

            var fontSize = this.element.getStyle('font-size').sub('px', '');
            this.textAreaWidth = parseInt(fontSize) * maxLength / reductionFactor;
        }


        return sObjects;
    },

    /*
    * @method markPrevious
    * @desc method overriden to avoid strange scroll issue when using keyboard to move between options
    * @inherit Autocompleter.Base.markPrevious
    */
    markPrevious: function () {
        if (this.index > 0)
            this.index--
        else this.index = this.entryCount - 1;
        this.getEntry(this.index);
    },

    /*
    * @method markNext
    * @desc method overriden to avoid strange scroll issue when using keyboard to move between options
    * @inherit Autocompleter.Base.markNext
    */
    markNext: function () {
        if (this.index < this.entryCount - 1)
            this.index++
        else this.index = 0;
        this.getEntry(this.index);
    },

    /*
    * @method fixIEOverlapping
    * @desc method overriden to fix a bug in IE6 showing some  weird blank areas
    * @inherit Autocompleter.Base.fixIEOverlapping
    */
    fixIEOverlapping: function ($super) {
    },

    /*
    * @method onBlur
    * @desc method to be called when the text area losses focus
    * @param event {Event} Event object containing information about the event that called that method
    * @inherit Autocompleter.Base.onBlur
    */
    onBlur: function ($super, event) {
        if (!Object.isEmpty($(this.divElementId + '_goUp'))) {
            $(this.divElementId + '_goUp').observe('click', function (event) {
                this.scrollUp(this);
            } .bindAsEventListener(this));
        }
        if (!Object.isEmpty($(this.divElementId + '_goDown'))) {
            $(this.divElementId + '_goDown').observe('click', function (event) {
                this.scrollDown(this);
            } .bindAsEventListener(this));
        }
        this.blurFromButton = false;
        if (Prototype.Browser.IE) {
            if ($(document.activeElement).match('#options_' + this.divElementId)) {
                this.element.focus();
                return;
            }
        }

        //don't hide the options list when onblur is coming from the arrow.
        if (event.explicitOriginalTarget) {//FFox
            if (event.explicitOriginalTarget.id) {
                if ((event.explicitOriginalTarget.id.include(this.element.up().up().identify())) &&
                    ((event.explicitOriginalTarget.id.endsWith('_goDown')) ||
                    (event.explicitOriginalTarget.id.endsWith('_notGoDown')) ||
                    (event.explicitOriginalTarget.id.endsWith('_goUp')) ||
                    (event.explicitOriginalTarget.id.endsWith('_notGoUp')) ||
                    (event.explicitOriginalTarget.id.endsWith('_down_arrow')) ||
                    (event.explicitOriginalTarget.id.endsWith('_up_arrow')))) {
                    var func = this.element.focus.bind(this.element).defer();
                    return;
                }
            }
        } else if (document.activeElement) {//IE
            if (($(document.activeElement).identify().endsWith('_goDown') && $(document.activeElement).identify().include(Event.element(event).up().up().identify())) ||
                ($(document.activeElement).identify().endsWith('_notGoDown') && $(document.activeElement).identify().include(Event.element(event).up().up().identify())) ||
                ($(document.activeElement).identify().endsWith('_goUp') && $(document.activeElement).identify().include(Event.element(event).up().up().identify())) ||
                ($(document.activeElement).identify().endsWith('_notGoUp') && $(document.activeElement).identify().include(Event.element(event).up().up().identify())) ||
                ($(document.activeElement).identify().endsWith('_down_arrow') && $(document.activeElement).identify().include(Event.element(event).up().up().identify())) ||
                ($(document.activeElement).identify().endsWith('_up_arrow') && $(document.activeElement).identify().include(Event.element(event).up().up().identify()))) {
                this.element.focus();
                return;
            };
        }

        var comesFromButton = Try.these(
            function () {
                if (event.explicitOriginalTarget.id)
                    return (event.explicitOriginalTarget.match('#' + Event.element(event).up().identify() + ' .autocompleter_button_showall')) ||
                    (event.explicitOriginalTarget.className == "autocompleter_scrollingDiv");
                else
                    return (event.explicitOriginalTarget.parentNode.match('#' + Event.element(event).up().identify() + ' .autocompleter_button_showall')) ||
                    (event.explicitOriginalTarget.className == "autocompleter_scrollingDiv");
            },
            function () {
                return $(document.activeElement).match('#' + Event.element(event).up().identify() + ' .autocompleter_button_showall') ||
                $(document.activeElement).match('#' + Event.element(event).up().identify() + ' .autocompleter_autocomplete');
            }
            );

        var template = new Template(this.options.templateResult);
        if ((this.element.getValue() == '' && !this.options.emptyOnBlur || this.element.getValue() != '') && !Object.isEmpty(this.lastSelected)) {
            if (this.element.getValue() == '') {
                this.lastSelected = null;
                this._selectedData = null;
                if (this.options.events && this.options.events.get('onResultSelected') && event != false) {
                    document.fire(this.options.events.get('onResultSelected'), {
                        isEmpty: true
                    });
                }
            } else {
                if (!Object.isEmpty(this.options.array[this.lastSelected]))
                    this.element.setValue(unescape(template.evaluate(this.options.array[this.lastSelected])));
                else
                    this.element.setValue('');
            }
        } else if (Object.isEmpty(this.lastSelected) && !Object.isEmpty(this.options.label)) {
            this.setLabel(this.options.label);
        } else if (Object.isEmpty(this.lastSelected)) {
            this.element.clear();
        }

        if (!comesFromButton)
            $super(event);
    },
    /*
    * @method onHover
    * @desc method to be called when the mouse are over the autocompleter
    * @param event {Event} Event object containing information about the event that called that method
    * @inherit Autocompleter.Base.onHover
    */
    onHover: function (event) {
        var element = Event.findElement(event, 'LI');
        if (!Object.isEmpty(element)) {
            if (this.index != element.autocompleteIndex) {
                this.index = element.autocompleteIndex;
                this.render();
            }
        }
        Event.stop(event);
    },
    /*
    * @method onClick
    * @desc method to be called when the mouse clicks on the autocompleter
    * @param event {Event} Event object containing information about the event that called that method
    * @inherit Autocompleter.Base.onClick
    */
    onClick: function (event) {
        var element = Event.findElement(event, 'LI');
        if (!Object.isEmpty(element)) {
            this.index = element.autocompleteIndex;
            this.selectEntry();
            this.hide();
        }
    },
    /*
    * @method startNewDataTimeout
    * @param instance {AutocompleteSearch} the instance of this same object
    * @desc it sets the timeout to expired so new requests for data can be made.
    */
    startNewDataTimeout: function (instance) {
        instance.timeoutExpired = true;
    },

    /*
    * @method onKeyPress
    * @param event {Event} an object representing the fired event and containing data about it.
    * @desc it overrides the parent class method to fire an event for the developer when it
    * 		 is able to ask for new data.
    * @inherit Autocompleter.Local.onKeyPress
    */
    onKeyPress: function ($super, event) {
        if (event.type != 'keydown' && event.keyCode != Event.KEY_TAB) {
            if (this.element.value.startsWith(this.lastEntry))
                this.searchLocally = true;
            else
                this.searchLocally = false;
            //This is used to signal to the selector method that the selector was called due
            //to a button pressed, and not a click on the arrow
            this.showAllOptions = false;
            $super(event);
            this.showAllOptions = true;
            if (!Object.isEmpty($('options_' + this.divElementId))) {
                if (!$('options_' + this.divElementId).visible() || $('text_area_' + this.divElementId).value == '') {
                    this.shownFlags.clear();
                    this.shownFlag = 0;
                }
            } else {
                this.shownFlags.clear();
                this.shownFlag = 0;
            }
            if ((event.keyCode == Event.KEY_DOWN) && (this.index == 0) && (!Object.isEmpty($(this.divElementId + "_goDown")))) {
                this.scrollDown(this);
            }
            if ((event.keyCode == Event.KEY_UP) && (this.index == this.entryCount - 1) && (!Object.isEmpty($(this.divElementId + "_goUp")))) {
                this.scrollUp(this);
            }

            var hasMinChars = this.element.value.length >= this.options.minChars;
            if (event.keyCode != Event.KEY_DOWN && event.keyCode != Event.KEY_UP && event.keyCode != Event.KEY_RIGHT && event.keyCode != Event.KEY_LEFT) {
                this.blurFromButton = false;
            }
            if (this.changed && this.timeoutExpired && hasMinChars) {
                if (this.options.events && this.options.events.get('onGetNewXml')) {
                    document.fire(this.options.events.get('onGetNewXml'), {
                        idAutocompleter: this.divElementId
                    });
                }
            }
            //If the backend search should be done, then we call the callService function
            if (hasMinChars) {
                if (this.options.searchWithService && (this.refineSearch || !this.searchLocally)) {
                    this.lastEntry = this.element.getValue();
                    this.callService(false);
                }
            }
            //the TAB button can only be treated on 'keydown', because 'keyup' is fired from the receiving field
        } else if ((event.keyCode == Event.KEY_TAB) && this.active) {
            this.selectEntry();
            this.hide();
        }
    },
    /*
    * @method callService
    * @param fromButton {boolean} It is true, if the function was called by pressing the button of the autocompleter
    * @desc makes search call to backend
    */
    callService: function (fromButton) {
        var searchTemplate = new Template(this.options.xmlToSend);
        //To show the loading message
        global.showLoadingMsg = true;
        //If we need to show all results, then we should treat the entry as empty
        if (this.options.showEverythingOnButtonClick && fromButton)
            var searchQuery = '';
        else
        //We try to delete the parts after the separators, and strip the string from spaces
            var searchQuery = this.element.getValue().split('<')[0].split('[')[0].split(global.idSeparatorLeft)[0].strip();
        if (this.options.showEverythingOnButtonClick || !fromButton) {
            //Putting the search entry in the XML
            var xml = searchTemplate.evaluate($H({ search: searchQuery }));
            if (fromButton && !Object.isEmpty(this.lastSelected) && !Object.isEmpty(this.options.array) &&
               !Object.isEmpty(this.options.array[this.lastSelected])) {
                var defaultTags = '';
                var value = unescape(this.options.array[this.lastSelected].get('data'));
                var text = unescape(this.options.array[this.lastSelected].get('text'));
                if (!Object.isEmpty(value))
                    defaultTags = defaultTags + "<DEFAULT_VALUE>" + value.escapeHTML() + "</DEFAULT_VALUE>";
                if (!Object.isEmpty(text))
                    defaultTags = defaultTags + "<DEFAULT_TEXT>" + text.escapeHTML() + "</DEFAULT_TEXT>";
                xml = xml.replace('<SEARCH_PATTERN>', defaultTags + '<SEARCH_PATTERN>');
            }
            this.url = this.options.url;
            this.method = this.options.method;
            var call = new Call(this,
                $H({
                    xml: xml,
                    successMethod: 'fillFromService',
                    errorMethod: '_errorMethod',
                    infoMethod: Prototype.emptyFunction,
                    warningMethod: Prototype.emptyFunction
                }));
        }
    },
    /*
    * @method _failureMethod
    * @param data The response from backend
    * @desc handles failure response from backend
    */
    _failureMethod: function (data) {
        this._errorMethod(data);
    },
    /*
    * @method _errorMethod
    * @param data The response from backend
    * @desc handles error response from backend
    */
    _errorMethod: function (data) {
        //Puts empty data in the autocompleter
        var json = {
            autocompleter: {
                object: [],
                multilanguage: null
            }
        };
        //Error message must be shown
        this.error = true;
        //Takes the error message
        if (data && data.EWS && data.EWS.webmessage_text)
            this.errorMessage = data.EWS.webmessage_text;
        //Updates autocompleter
        this.updateInput(json);
    },
    /*
    * @method fillFromService
    * @param results {json} The response from backend
    * @desc Fills the autocompleter based on the response from backend
    */
    fillFromService: function (results) {
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        };
        //Fills the json from the response
        if (results && results.EWS && results.EWS.o_values && results.EWS.o_values.item) {
            objectToArray(results.EWS.o_values.item).each(function (node) {
                json.autocompleter.object.push({ text: node['@value'], data: node['@id'] });
            } .bind(this));
        }
        //If the maximum number of results is exceeded, then we should search in backend upon further searches
        if (results && results.EWS && results.EWS.o_max_num_exceeded == 'X') {
            this.refineSearch = true;
        } else {
            this.refineSearch = false;
        }
        //Updating the autocompleter
        var selected = this._selectedData;
        this.lastSelected = null;
        this.updateInput(json);
        if (!Object.isEmpty(selected)) {
            var value = selected.idAdded;
            var text = selected.textAdded;
            this.options.array.each(function (option, i) {
                if (option.get('text') == escape(text) && option.get('data') == escape(value)) {
                    this.lastSelected = i;
                    this.defaultElement = i;
                }
            } .bind(this));
        }
    },

    fixSearchQuery: function (search, text) {
        var words = search.clone();
        //This for loop is needed to avoid a bug
        //When we do the underlining, we convert < to &lt; and > to &gt;
        //if we have "l" or "t" or "lt" as a search word, and in the option it can
        //only be found in the data part, then the underlining function
        //would intend to underline it in the &lt; part, which would later lead to
        //an underlined &lt; and not the shown < sign
        for (j = 0; j < words.length; j++) {
            if ((words[j] == "l" && !text.toLowerCase().include("l")) ||
               (words[j] == "t" && !text.toLowerCase().include("t")) ||
               (words[j] == "lt" && !text.toLowerCase().include("lt")))
                words[j] = null;
        }
        return words;
    },

    /*
    * @method updateInput
    * @desc method that delete all operations been made and insert a new xml
    * @param input {JSON} the new JSON object
    */
    updateInput: function (input) {
        this.options.array = this.initData(input);
        if (this.active) {
            this.getUpdatedChoices();
            this.element.focus();
        }
        if (this.options.events && this.options.events.get('onDataLoaded'))
            document.fire(this.options.events.get('onDataLoaded'));
    },
    /*
    * @method setDefaultValue
    * @param option {String} the id or the text from the "text/data" pair the module receives from the XML doc.
    * @param isText {boolean} if the value passed in the second argument is text instead of data.
    * @return true if the change is made, false otherwhise.
    * @desc method to change the default value. If the value is not in the current data array
    * 		 the default value won't change.
    */
    setDefaultValue: function (value, isText, throwEvent) {
        var index = null;
        if (Object.isEmpty(isText)) isText = false;

        this.options.array.each(function (option, i) {
            if (isText && option.get('text') == escape(value)) index = i;
            else if (!isText && option.get('data') == escape(value)) index = i;
        });

        if (!Object.isEmpty(index)) {
            this.defaultElement = index;
            this.lastSelected = index;
            if (this.options.fireEventWhenDefaultValueSet == false)
                throwEvent = false;
            this.updateElement(null, throwEvent);
            return true;
        } else {
            return false;
        }
    },

    /*
    * @method autocompleterOnShowFixes
    * @desc method that apply some CSS fixes to avoid crossbrowser problems.
    * @param update {Element} element for the options list
    */
    autocompleterOnShowFixes: function (update) {
        this.ie_apply_zindex(update, 5001);
        if (update.getHeight() <= 200) {
            update.addClassName('autocompleter_not_overflow');
        }

        if (update.getHeight() > 200 && Prototype.Browser.IE && navigator.appVersion.include('7.0')) {
            update.addClassName('autocompleter_IE6_overflow');
        }
    },
    ie_apply_zindex: function (element_id, zindex, context_id) {
        // default values
        if (undefined == zindex) {
            zindex = 1;
        }
        var context = (undefined == context_id ? $(context_id) : $(document.body));
        var element = $(element_id);

        // undo past ie_apply_zindex()
        for (i = this.iaz_preserved_elements.length - 1; i >= 0; i--) {
            this.iaz_preserved_elements[i].setStyle({
                'z-index': this.iaz_preserved_zindexes[i]
            });
        }
        this.iaz_preserved_elements = [];
        this.iaz_preserved_zindexes = [];

        // find relative-positioned ancestors of element within context
        element.ancestors().each(
            function (ancestor) {
                if ('relative' == ancestor.getStyle('position')) {
                    // preserve ancestor's current z-index
                    this.iaz_preserved_elements.push(ancestor);
                    this.iaz_preserved_zindexes.push(ancestor.getStyle('z-index'));

                    // apply z-index to ancestor
                    ancestor.setStyle({
                        zIndex: zindex
                    });
                }
                if (ancestor == context) {
                    throw $break;
                }
            } .bind(this)
            );
    },
    /*
    * @method scrollUp
    * @desc method that scroll up the autocompleter list, executed when clicked the scroll button or 'up key' pressed
    * @param instance : instance of autocompleter
    */
    scrollUp: function (instance) {
        if (instance.shownFlag > 0) {
            if (instance.filter) {
                instance.shownFlag = instance.shownFlags[instance.shownFlags.indexOf(instance.shownFlag) - 1]
            } else {
                instance.shownFlag = instance.shownFlag - (instance.options.maxShown - 1);
            }
            if (instance.shownFlag < 0)
                instance.shownFlag = 0;
            if (!instance.filter)
                instance.blurFromButton = true;
            instance.getUpdatedChoices();
        }
    },
    /*
    * @method scrollDown
    * @desc method that scroll down the autocompleter list, executed when clicked the scroll button or 'down key' pressed
    * @param instance : instance of autocompleter
    */
    scrollDown: function (instance) {
        if (instance.shownFlag < (instance.options.array.length - instance.options.maxShown)) {
            if (instance.filter) {
                lastUnderscore = $('ul_' + instance.divElementId).lastChild.id.lastIndexOf('_');
                instance.shownFlag = $('ul_' + instance.divElementId).lastChild.id.substring(lastUnderscore + 1);

            } else {
                instance.shownFlag = instance.shownFlag + (instance.options.maxShown - 1);
            }
            if (instance.shownFlag > (instance.options.array.length - instance.options.maxShown))
                instance.shownFlag = (instance.options.array.length - instance.options.maxShown);
            if (!instance.filter)
                instance.blurFromButton = true;
            instance.getUpdatedChoices();
        }
    },
    /*
    * @method autocompleterOnHideFixes
    * @desc method that apply some CSS fixes to avoid crossbrowser problems.
    * @param update {Element} element for the options list
    */
    autocompleterOnHideFixes: function (update) {
        update.removeClassName('autocompleter_not_overflow');
        update.removeClassName('autocompleter_IE6_overflow');
    },
    /*
    * @method disable
    * @desc disables the autocompleter, so the user can't write or show the drop down
    */
    disable: function () {
        this.enabled = false;
        this.element.disable();
    },
    /*
    * @method enable
    * @desc enables the autocompleter after disabling it.
    */
    enable: function () {
        this.enabled = true;
        this.element.enable();
    },
    /*
    * @method loading
    * @desc disables the autocompleter and sets the button to be a "loading" picture
    */
    loading: function () {
        this.disable();
        this.update.hide();
        this.showAllButton.addClassName('autocompleter_button_showall_loading');
    },
    /*
    * @method loading
    * @desc enables the autocompleter and remove the "loading" status after calling to loading()
    */
    stopLoading: function () {
        this.showAllButton.removeClassName('autocompleter_button_showall_loading');
        this.enable();
    },
    /*
    * @method setSearchWithService
    * @param search {boolean} if the search should be done with a service
    * @desc sets whether the search logic should be done in backend through a service or no
    */
    setSearchWithService: function (search) {
        if (search)
            this.refineSearch = true;
        this.options.searchWithService = search;
    },
    /*
    * @method setXmlToSend
    * @param xml {string} the new XML that should be used to call the service
    * @desc sets the xml document that is to be sent to backend
    */
    setXmlToSend: function (xml) {
        if (xml.include('<SEARCH_PATTERN />'))
            xml = xml.replace('<SEARCH_PATTERN />', '<SEARCH_PATTERN>#{search}</SEARCH_PATTERN>');
        else if (xml.include('<SEARCH_PATTERN></SEARCH_PATTERN>'))
            xml = xml.replace('<SEARCH_PATTERN></SEARCH_PATTERN>', '<SEARCH_PATTERN>#{search}</SEARCH_PATTERN>');
        this.options.xmlToSend = xml;
    },
    /*
    * @method setLabel
    * @param label {String} the desired label.
    * @desc sets a label inside the text area that will not appear as an option.
    */
    setLabel: function (label) {
        this.element.setValue(label);
    },
    /*
    * @method changeLabel
    * @param label {String} the new desired label.
    * @desc change the label property.
    */
    changeLabel: function (label) {
        this.options.label = label;
        this.setLabel(this.options.label);
    },
    show: function () {
        this.options.onShow(this.element, this.update);
        if (!this.iefix &&
          (Prototype.Browser.IE) &&
          (Element.getStyle(this.update, 'position') == 'absolute')) {
            new Insertion.After(this.update,
           '<iframe id="' + this.update.id + '_iefix" ' +
           'style="display:none;position:absolute;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);" ' +
           'src="javascript:false;" frameborder="0" scrolling="no"></iframe>');
            this.iefix = $(this.update.id + '_iefix');
        }
        if (this.iefix) setTimeout(this.fixIEOverlapping.bind(this), 50);
    },
    getToken: function () {
        var bounds = this.getTokenBounds();
        return this.element.value.substring(bounds[0], bounds[1]);
    }
});