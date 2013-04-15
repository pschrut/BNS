/*
 *@fileoverview multiselect-searchbox.js
 *@desc         contains definition and implementation of multiselect searchbox web module
 */
/*
 *@class MultipleSelectSearchBox
 *@desc class with implementation of a autocompletion search box with muliple selection.
 *@inherit Autocompleter.Local
 */
var MultipleSelectSearchBox = Class.create(Autocompleter.Local, {

    /*
     * @method initialize
     * @param $super {Class} argument used to be able to use the superclass via $super keyword. DO NOT USE THIS
     * 			ARGUMENT ON NEW OBJECTS INITIALIZATION
     * @param divElement {String} The id of the DIV where the new multiselect will be created
     * @param options {JSON} A JSON object containing the options
     * @param xmlDoc {IXMLDOMDocument2} The XML document containing the options for the autocompletion.
     * @desc This method creates a new MultpleSelectSearchBox object taking the autocompletion options
     * 		 from the XML passed as an argument.
     * @return {MultipleSelectSearchBox} a new autocompletion search box
     * @inherit Autocompleter.Local.initialize
     */
    initialize: function($super, divElement, options, xmlDoc){
        /*
         * @name divElementId
         * @type String
         * @desc Id of the div element that will contain the autocompletion text area
         * 		 and the selected options list
         */
        this.divElementId = divElement;
        
        var aObjects = this.initData(xmlDoc);
        
        /*
         * @name options.array
         * @type Array
         * @desc this array contains the options that will be used to autocomplete the
         * 		user entries in the text area. its an Array of Hashes
         * @see initData
         */
        //this.options.array = new Array();
        
        //Initialization of HTML elements that are going to be needed
        
        var formContainer = new Element('div', {
            'class': 'multiselectSearchbox_form_container'
        });
        
        var textAreaElement = new Element('input', {
            'type': 'text',
            'id': 'text_area_' + divElement,
            'name': 'text_area_' + divElement,
            'class': 'multiselectSearchbox_textarea'
        });
        
        var showAllButton = new Element('input', {
			'type': 'button',
            'class': 'multiselectSearchbox_button_showall'
        });
        
        formContainer.insert(textAreaElement).insert(showAllButton);
        
        var optionsDivElement = new Element('div', {
            'id': 'options_' + divElement,
            'class': 'multiselectSearchbox_autocomplete'
        });
        
        var resultsElement = new Element('div', {
            'id': 'results_' + divElement,
            'class': 'multiselectSearchbox_selectedContainer'
        });
        
        divElement = $(divElement);
        divElement.insert(formContainer).insert(optionsDivElement).insert(resultsElement);
        divElement.addClassName('multiselectSearchbox_container');
        
        /*
         *@name result
         *@type Element
         *@desc html ul element that will contain the selected results
         */
        this.results = resultsElement;
        
        //Calling to the superclass initializer
        $super(textAreaElement.getAttribute('id'), optionsDivElement.getAttribute('id'), aObjects, options);
        
        
        showAllButton.observe('click', function(event){
            this.blurFromButton = true;
			//console.log('setting blurFromButton = true');
			this.element.focus();
            if (!this.active) {
                this.activate();
            }
        }.bindAsEventListener(this),true);
        
        //Setting correct overflow when expanding on width
        if (this.options.expandWidth) {
            resultsElement.addClassName('multiselectSearchbox_expand_width');
        }
        
    },
    
    /*
     * @method setOptions
     * @param options {JSON} passed as an argument to the class constructor
     * @desc it configures the new searchbox based on the options passed as an argument to the constructor
     * @return void
     * @inherit Autocompleter.Local.setOptions(options)
     */
    setOptions: function(options){
        this.options = Object.extend({
            minChars: 0,
            /*
             * @name templateOptionsList
             * @type {Template}
             * @desc a string representing the template wanted to be used in options list
             * @see Documentation for Template class in prototype API
             */
            templateOptionsList: '#{text} &lt;#{data}&gt;',
            /*
             * @name templateResultsList
             * @type {Template}
             * @desc a string representing the template wanted to be used in results list
             * @see Documentation for Template class in prototype API
             */
            templateResultsList: '#{text} &lt;#{data}&gt;',
            /*
             * @name splitSelectors
             * @type {Array}
             * @desc an Array of characters to be used as selectors
             * @see  you should read carefully origin.js multiSelectorSplit() documentation before
             * 		you use new selectors.
             */
            splitSelectors: ['\\.', ',', '@'],
            /*
             * @name expandWidth
             * @type {Boolean}
             * @desc a boolean that means if you want the list to expand on width or not
             */
            expandWidth: false,
            /*
             * @method onShow
             * @param element {Element}
             * @param update{Element}
             * @desc method called when the list of options is shown, Could be used to add effects, etc.
             */
            onShow: function(element, update){
                if (!update.style.position || update.style.position == 'absolute') {
                    update.style.position = 'absolute';
                }
                
                if (update.getHeight() <= 200) {
                    update.addClassName('multiselectSearchbox_not_overflow');
                }
                
                if (update.getHeight() > 200 && Prototype.Browser.IE && navigator.appVersion.include('6.0')) {
                    update.addClassName('multiselectSearchbox_IE6_overflow');
                }
                update.show();
            },
            
            /*
             * @method onHide
             * @param element {Element}
             * @param update {Element}
             * @desc method called when the list of options is hidden. Could be used to add effects, etc.
             */
            onHide: function(element, update){
                update.removeClassName('multiselectSearchbox_not_overflow');
                update.removeClassName('multiselectSearchbox_IE6_overflow');
                update.hide();
            },
            /*
             * @metod selector
             * @param instance {MultipleSelectSearchBox}
             * @desc method that implements the selection logic for the autocompletion
             * @return {String} A String that contains an <ul> with a list of options
             */
            selector: function(instance){
                instance.hide();
                instance.active = false;
                var ret = [];
                var entry = instance.getToken();
                var resultsList = '<ul>';
                var largestOption = 0;
                var optionsTemplate = new Template(instance.options.templateOptionsList);
                var reductionFactor = Prototype.Browser.IE ? 1.4 : 1.8;
                if (entry.length) {
                
                    for (var i = 0; i < instance.options.array.length; i++) {
                    
                        //we don't search in options already marked as used
                        if (instance.options.array[i].get('used')) 
                            continue;
                        
                        //Lis element that will include the new result.
                        var listElement = '<li id=\'' + instance.divElementId + '_li_' + i + '\'>';
                        
                        //Get both text and data tokens using default separators
                        var sText = instance.options.array[i].get('text');
                        var sData = instance.options.array[i].get('data');
                        var aText = sText.multiSeparatorsSplit(instance.options.splitSelectors);
                        var aData = sData.multiSeparatorsSplit(instance.options.splitSelectors);
                        
                        
                        var aSearching = aText.concat(aData);
                        var validOption = false;
                        //will be used to show the underlined text in the list with the correct capitalization
                        var correctCapEntry = '';
                        
                        //we search every token from both text and data
                        for (j = 0; j < aSearching.length; j++) {
                        
                            if (aSearching[j].toLowerCase().startsWith(entry.toLowerCase())) {
                                //Capitalize or decapitalize the found text.  getting it from the toke instead of the user entry
                                correctCapEntry = aSearching[j].substring(0, entry.length);
                                
                                //we sorround entry text with right capitalization with span (it make it underlined
                                var foundEntry = aSearching[j].sub(correctCapEntry, '<span class=\'multiselectSearchbox_coincidence\'>' + correctCapEntry + '</span>', 1);
                                
                                if (j < aText.length) {
                                    //we substitute the token's text found with the same text sorrounded by the <span> tag
                                    sText = sText.gsub(aSearching[j], foundEntry);
                                }
                                else {
                                    sData = sData.gsub(aSearching[j], foundEntry);
                                }
                                validOption = true;
                            }
                            //same search for the whole text
                            else if (sText.toLowerCase().startsWith(entry.toLowerCase())) {
                                correctCapEntry = sText.substring(0, entry.length);
                                sText = sText.sub(correctCapEntry, '<span class=\'multiselectSearchbox_coincidence\'>' + correctCapEntry + '</span>', 1);
                                validOption = true;
                            }
                            //same again for the whole data
                            else if (sData.toLowerCase().startsWith(entry.toLowerCase())) {
                                correctCapEntry = sData.substring(0, entry.length);
                                sData = sData.sub(correctCapEntry, '<span class=\'multiselectSearchbox_coincidence\'>' + correctCapEntry + '</span>', 1);
                                validOption = true;
                            }
                            
                        }
                        if (validOption) {
                            //We use the template to get the list format
                            listElement = listElement.concat(optionsTemplate.evaluate($H({
                                text: sText,
                                data: sData
                            })));
                            ret.push(listElement);
                        }
                        //Get the largest list element so the list width is set to its length
                        largestOption = listElement.gsub(/<(.|\n)*?>/, '').length > largestOption ? listElement.gsub(/<(.|\n)*?>/, '').length : largestOption;
						
                        
                    }
                }
                else {
                    for (var i = 0; i < instance.options.array.length; i++) {
                        if (!instance.options.array[i].get('used')) {
                            var listElement = '<li id=\'' + instance.divElementId + '_li_' + i + '\'>';
                            listElement = listElement.concat(optionsTemplate.evaluate(instance.options.array[i]));
                            listElement = listElement.concat('</li>');
                            
                            ret.push(listElement);
                            
                            largestOption = listElement.gsub(/<(.|\n)*?>/, '').length > largestOption ? listElement.gsub(/<(.|\n)*?>/, '').length : largestOption;
                        }
                    }
                }
                
                //Used to fix the "no results" message width issue
                largestOption = largestOption ? largestOption : global.getLabel('noResults').length;
				
				var fontSize = instance.update.getStyle('font-size').sub('px','');
				
				var listSize = parseInt(fontSize) * largestOption/reductionFactor;
                
                //We add the correct width for the whole list and join it to get shown to the user
                for (var k = 0; k < ret.length; k++) {
                    ret[k] = ret[k].sub('<li ', '<li style="width: ' + listSize + 'px;" ');
                }
                
                if (ret.length != 0) {
                    resultsList = resultsList.concat(ret.join(" "));
                }
                else {
                    resultsList = resultsList.concat('<li style="width: ' + listSize + 'px;" >' + global.getLabel('noResults') + '</li>');
                }
                
                styleUl = ' style ="width:' + listSize + 'px;"';
                
                resultsList = resultsList.concat('</ul>');
                resultsList = resultsList.sub('<ul', '<ul ' + styleUl);
                return resultsList;
            }
        }, options ||
        {});
    },
    
    /*
     * @method initData
     * @param xmlDoc {IXMLDOMDocument2} The XML with the data
     * @desc It initializes data to be searched from the XML document
     * @return {Array} An array containig a Hash formed by:
     * 			text: The xml text field
     * 			data: The xml data field
     * 			used: true if the current array field has been selected by the user
     */
    initData: function(xmlDoc){
        var aText = selectNodesCrossBrowser(xmlDoc, '//multiselect/object/text');
        var aData = selectNodesCrossBrowser(xmlDoc, '//multiselect/object/data');
        var aObjects = new Array(aText.length);
        
        for (i = 0; i < aText.length; i++) {
            var sText
            var sData
            
            sText = getText(aText[i]).strip();
            sData = getText(aData[i]).strip();
            
            aObjects[i] = $H({
                text: sText,
                data: sData,
                used: false
            });
        }
        
        this.noResultsString = readXmlText(xmlDoc, '//multiselect/multilanguage/no_results');
        this.searchString = readXmlText(xmlDoc, '//multiselect/multilanguage/search');
        
        return aObjects;
    },
    
    /*
     * @method updateElement
     * @param selectedElement {Element} the element the user has selected to be inserted in the list
     * @desc method that updates the selection list with the new selection
     * 		made by the user
     * @return void
     * @inherit Autocompleter.Local.updateElement(selectedElement)
     */
    updateElement: function(selectedElement){
        this.element.clear();
        this.element.focus();
        
        var elementNumber = selectedElement.getAttribute('id');
        //conditionals to avoid unexisting element to insert
        elementNumber = elementNumber ? elementNumber.gsub(this.divElementId + '_li_', '') : null;
        elementNumber = elementNumber ? parseInt(elementNumber) : null;
        
        //Used to don't add an element twice and to avoid adding unexisting elements
        if (!elementNumber && elementNumber != 0 || this.options.array[elementNumber].get('used')) 
            return;
        
        //Set this element as already in the selected list
        this.options.array[elementNumber].set('used', true);
        
        //use template to set the selected options data
        var selectedResultsTemplate = new Template(this.options.templateResultsList);
        var value = selectedResultsTemplate.evaluate(this.options.array[elementNumber]);
        
        //prepare the elements for the new list entry
        var deleteButton = new Element('span', {
            'class': 'multiselectSearchbox_delete'
        }).update('x');
        
        var listContainerTdText = new Element('td', {
            'class': 'multiselectSearchbox_containerTdText'
        }).update(value);
        
        var listContainerTable = new Element('table', {
            'id': this.divElementId + '_li_selected' + elementNumber,
            'class': 'multiselectSearchbox_container_table',
            'border': '0',
            'cellspacing': '0',
            'cellpadding': '0'
        });
        
        //added to avoid a bug with internet explorer not inserting the table
        var listContainerTbody = new Element('tbody');
        
        var listContainerTr = new Element('tr', {
            'class': 'multiselectSearchbox_containerTr'
        });
        var listContainerTdLeft = new Element('td', {
            'class': 'multiselectSearchbox_containerTdLeft'
        });
        var listContainerTdText = new Element('td', {
            'class': 'multiselectSearchbox_containerTdText'
        }).update(value);
        
        var listContainerTdRight = new Element('td', {
            'class': 'multiselectSearchbox_containerTdRight'
        }).insert(deleteButton);
        
        listContainerTr.insert(listContainerTdLeft);
        listContainerTr.insert(listContainerTdText);
        listContainerTr.insert(listContainerTdRight);
        
        listContainerTbody.insert(listContainerTr);
        
        listContainerTable.insert(listContainerTbody);
        
        this.results.insert(listContainerTable);
        
        //When not expanding width take 100% of the parent container
        if (!this.options.expandWidth) {
            listContainerTable.setStyle({
                'width': '100%'
            });
        }
        
        /*
         * It deletes the selected result when the user clicks the 'x' button
         * selected result is also marked as not used so it will not appear on
         * the XML once it's formed.
         */
        deleteButton.observe('click', function(event){
        
            var element = Event.element(event);
            
            //get to the table and get the id of the element to be removed to be also marked as not used
            var elementNumber = element.up().up().up().up().getAttribute('id');
            elementNumber = elementNumber.gsub(this.divElementId + '_li_selected', '');
            elementNumber = parseInt(elementNumber);
            
            this.options.array[elementNumber].set('used', false);
            
            //get to the table and remove from the DOM
            element.up().up().up().up().remove();
            
                document.fire('EWS:multipleselectSearchbox_resultRemoved', this.divElementId);
        }.bindAsEventListener(this));
        
            document.fire('EWS:multipleselectSearchbox_resultAdded', this.divElementId);
    },
    
    /*
     * @method updateInput
     * @desc method that delete all operations been made and insert a new xml
     * @param inputXml {IXMLDOMDocument2} the new XML document
     */
    updateInput: function(inputXml){
        this.results.update('');
        this.options.array = this.initData(inputXml);
    },
    
    /*
     * @method getXmlResults
     * @desc method that converts the selected results into an string with XML containing al the results
     * @return {String} a sting that contains the XML with the selected options
     */
    getXmlResults: function(){
        //Use a template to get every node to its XML format
        var template = new Template('<object><data>#{data}</data><text>#{text}</text></object>');
        var xmlDocument = '<multiselect>';
        
        this.options.array.each(function(e){
            if (e.get('used')) {
                xmlDocument = xmlDocument.concat(template.evaluate(e));
            }
        });
        xmlDocument = xmlDocument.concat('</multiselect>');
        
        return xmlDocument;
    },
    
    /*
     * @method markPrevious
     * @desc method overriden to avoid strange scroll issue when using keyboard to move between options
     * @inherit Autocompleter.Base.markPrevious
     */
    markPrevious: function(){
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
    markNext: function(){
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
    fixIEOverlapping: function(){
    },
    /*
     * @method onBlur
     * @desc method to be called when the text area losses focus
     * @param event {Event} Event object containing information about the event that called that method
     * @inherit Autocompleter.Base.onBlur
     */
    onBlur: function($super, event){
		var showAll = Try.these(
			function(){
				return event.explicitOriginalTarget.match('#' + Event.element(event).up().identify() + ' .multiselectSearchbox_button_showall');
			},
			function(){
				return $(document.activeElement).match('#' + Event.element(event).up().identify() + ' .multiselectSearchbox_button_showall') || 
					   $(document.activeElement).match('#' + Event.element(event).up().identify() + ' .multiselectSearchbox_autocomplete');
			}
		);
		//console.log(showAll);
		if(!showAll)
			$super(event);
    }
});








/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
