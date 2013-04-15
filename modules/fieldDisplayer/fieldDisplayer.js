/**
 * @fileoverview fieldDisplayer.js
 * @description Contains all the functionalities for creating fields.
 *      This fields can be readonly or input fields, what the modules does is to decide what to
 *      create from the information the programmer provides to the module, and implements few
 *      functionalities like format check (for example in the case the fieldtype is integer number
 *      won't be possible to insert text)
 */

/**
 * @constructor
 * @description This class generates a input field or a formated readonly text
 *      based on the parameters the programmer provides on the options object
 */
var FieldDisplayer = Class.create(
/**
 * @lends FieldDisplayer
 */{
    /**
     * @description Contains the HTML element
     * @type Prototype.Element
     */
    _element: null,
    /**
     * @description Contains a reference to the types contructors
     * @type Object
     */
    TYPES_REFERENCE: new Object(),
    /**
     * @description Initializes the class functionalities
     * @param options The FieldDisplayer options
     */
    initialize: function(options,storeResult) {
        /*
         * OPTIONS PARAMETERS
         * fieldFormat -> mandatory
         * fieldId -> mandatory
         * defaultValue -> optional
         * dependField -> optional
         * dependType -> optional
         * displayAttrib -> optional
         * fieldLabel -> optional
         * maxLength -> optional
         * type -> optional (mandatory then fieldFormat text input)
         * widScreen -> Information for requesting field data
         * strKey -> Information for requesting field data
         * formatCheckByUser -> optional [MODULE]
         * events -> optional [MODULE]
         * sapId -> mandatory on fields that needs to call SAP
         *  - valueInserted
         */
        this.options = options;
        //At least a value is needed
        if(Object.isEmpty(options.fieldId))
            throw "Error, you must set 'fieldId' on the options";
        //Storing the references to the different classes to instantiate
        this.TYPES_REFERENCE = {
            I: FieldTypeText,
            P: FieldTypeDate,
            A: FieldTypeAutocompleter,
            S: FieldTypeSelectBox,
            R: FieldTypeRadioButton,
            C: FieldTypeCheckBox,
            T: FieldTypeTextArea,
            H: FieldTypeHour,
            L: FieldTypeLink,
            M: FieldTypeImage,
            B: FieldTypeBubble
        };
        var object = new Object();
        //Read only text
        if(Object.isEmpty(options.fieldFormat))
            options.fieldFormat = 'I';
        this._element = new Element('div', {
            'class': 'fieldWrap fieldClearBoth fieldDispFloatLeft fieldDispTotalWidth'
        });
        if(options.fieldFormat == 'V' || options.fieldFormat == 'D' || (options.displayAttrib == 'OUO' && (options.fieldFormat != 'M' && options.fieldFormat != 'B'))) {
            object = {
                options: options,
                getElement: function() { 
                    return this._generateReadOnly();
                }.bind(this),
                checkFormat: function(){
                    return true;
                },
                getValue: function() {
                    return options.defaultValue.id;
                },
                getObjectValue: function() {
                    return {
                        id: '',
                        text: ''
                    };
                },
                getDependValue: function(includeNode) {
                    var value = $H();
                    //Getting the actual object value
                    if(includeNode)
                        value.set(options.sapId, this);
                    return value;
                }
            };
            this._object = object;
        }
        else
        {
            object = this.TYPES_REFERENCE[options.fieldFormat];
            this._statusElement = new Element('div', {
                'class': 'fieldStatus'
            });
            this._statusElement = new Element('span');
            object = new object(options,this._element,storeResult);
            this._object = object;
            object.setStoreResult(storeResult);
        }
        if(!Object.isEmpty(options.defaultValue) && options.assignDefaultValue && (options.mode == 'create')) {
            switch(this.options.showText) {
                case '':
                    storeResult['@value'] = options.defaultValue.id;
                    break;
                case 'X':
                    storeResult['#text'] = options.defaultValue.text;
                    break;
                case 'B':
                    storeResult['#text'] = options.defaultValue.text;
                    storeResult['@value'] = options.defaultValue.id;
                    break;
                case 'I':
                    storeResult['#text'] = options.defaultValue.text;
                    storeResult['@value'] = options.defaultValue.id;
                    break;
            }
        }
        //Creating the label caption
        var mandatoryIndicator = '';
        if(options.displayAttrib == 'MAN' && !options.notDisplayMandatory)
            mandatoryIndicator = ' *';
        if(options.displayAttrib == 'HID')
            this._element.hide();
        if(options.fieldLabel || mandatoryIndicator != '')
            this._element.insert('<label for="'+options.fieldId+'"><abbr title="'+(options.fieldLabel+mandatoryIndicator)+'">'+(options.fieldLabel+mandatoryIndicator).gsub(' ', '&nbsp;')+'</abbr></label>');
        if(typeof object.getElement() == "string")
            this._element.insert(object.getElement());
        else
            this._element.insert(object.getElement().writeAttribute("id",options.fieldId));
        this._element.insert(this._statusElement);
    },
    dependenciesSet: function() {
        if(typeof this._object.dependenciesSet == 'function')
            this._object.dependenciesSet();
    },
    _generateReadOnly: function() {
        if(!this.options.defaultValue)
            return '';
        else
        if(this.options.fieldFormat == 'D') {
            if(this.options.defaultValue)
                if(this.options.defaultValue.text.strip() == '9999-12-31')
                    return '<span>Infinite</span>';
                else
                    return '<span>'+sapToDisplayFormat(this.options.defaultValue.text)+'</span>';
        }
        else
            return '<span>'+this.options.defaultValue.text+'</span>';
    },
    /**
     * @description Returns the generated element
     * @return The generated element
     */
    getElement: function() {
        return this._element;
    },
    /**
     * @description Gets the value of the component
     * @return The value
     */
    getValue: function() {
        return this._object.getValue();
    },
    setValue: function(value) {
        if(this.TYPES_REFERENCE[this.options.fieldFormat])
            this._object.setValue(value);
        else
            this._element = this._generateReadOnly(value);
    },
    setDependObject: function(object) {
        if(this.TYPES_REFERENCE[this.options.fieldFormat])
            if(this._object)
                this._object.setDependObject(object);
    },
    getDependValue: function(includeNode) {
        return this._object.getDependValue(includeNode);
    },
    clearValue: function() {
        if(this.TYPES_REFERENCE[this.options.fieldFormat])
            this._object.clearValue();
        else
            this._element = '';
    },
    /**
     * @description Checks the field format
     * @return Return a true if the field format is correct taking into account if
     *         the field is mandatory or not
     */
    checkFormat: function() {
        return this._object.checkFormat();
    },
    /**
     * @description This function destroy the object
     */
    destroy: function() {
        if(typeof(this._object.destroy) == "function") {
            this._object.destroy();
        }
    }
});

//IMPORTANT: Instantiate origin only when needed
var FieldType = Class.create(origin, {
    /**
     * @description Generated element
     * @type Prototype.Element
     */
    _element: null,
    /**
     * @description Indicates if the field is mandatory or not (Just for input fields)
     * @type Boolean
     */
    _mandatory: null,
    /**
     * @description This variable will contain the regular expresion for the format checking
     * @type RegExp
     */
    _formatRegExp: null,
    /**
     * @description Indicates if the service have already loaded the data from SAP
     * @type Boolean
     */
    _sapDataLoaded: null,
    _storeResult: null,
    dependObject: null,
    /**
     * @description Stores the max length for an input field
     * @type Integer
     */
    initialize: function($super, options, _statusElement, storeResult) {
        //Creating the element
        //TO INSERT ON THE PARENT CLASS
        $super('fieldDisplayer');
        this.TYPES_JSON_DATA_INSERTION = $H({
            I: {
                text: '@value',
                id: null
            },
            A: {
                text: '#text',
                id: '@value'
            },
            S: {
                text: '#text',
                id: '@value',
                textNode: 'text'
            },
            D: {
                text: '#text',
                id: '@value'
            },
            T: {
                text: '@value',
                id: null
            },
            P: {
                text: '@value',
                id: null
            },
            H: {
                text: '@value',
                id: null
            }
        });
        this._storeResult = storeResult;
        this.options = options;
        if (!this.options.events) {
            this.options.events = $H({
                valueInserted: 'EWS:fieldDisplayer_valueInserted_' + options.fieldId,
                formFieldModified: 'EWS:formFieldModified'
            });
        }
        this._statusElement = _statusElement;
        if (options.defaultValue)
            //if(!options.defaultValue.text)
            //    throw "FieldDisplayer module: Incorrect way of setting the default value attribute";
            this._defaultValue = options.defaultValue ? options.defaultValue : {
                id: '',
                text: ''
            };
        //Checking if mandatory or not
        options.displayAttrib && options.displayAttrib == 'MAN' ? this._mandatory = true : this._mandatory = false;
        if (this.options.dependField)
            document.observe('EWS:fieldDisplayer_value_inserted_' + this.options.dependField, this._clearValue.bind(this));
        this._sapDataLoaded = false;
    },
    setStoreResult: function(storeResult) {
        this._storeResult = storeResult;
    },
    setDependObject: function(object) {
        this.dependObject = object;
    },
    getDependValue: function(includeNode) {
        var value = $H();
        //Getting the actual object value
        if(includeNode)
            value.set(this.options.sapId, this);
        var dependValue;
        if (this.dependObject) {
            dependValue = this.dependObject.getDependValue(true);
            //Merging the depend value to the actual one
            if(dependValue)
                value = value.merge(dependValue.toObject());
        }
        return value;
    },
    dependenciesSet: function() {
    },
    destroy: function($super) {

    },
    /**
     * @description Returns the generated element
     * @return The generated element
     */
    getElement: function() {
        return this._element;
    },
    /**
     * @description Checks the input field format
     * @return True if the format is correct and false if not
     */
    checkFormat: function() {
        this._correct = true;
        if (this._mandatory)
            if (this._element.value == '' && this.options.fieldFormat != 'S') {
                this._incorrectField();
                this._correct = false;
            }
        return this._correct;
    },
    /**
     * @description Checks if the input field is empty
     * @return A boolean value indicating if it's empty or not
     */
    isEmpty: function() {

    },
    /**
     * @description Transform the element to indicate graphically is incorrect
     */
    _incorrectField: function() {
        this._statusElement.addClassName('fieldError fieldDispHeight');
    },
    /**
     * @description Transform the incorrect field into its normal status
     */
    _correctField: function() {
        this._statusElement.removeClassName('fieldError fieldDispHeight');
    },
    /**
     * @description Gets the component value
     */
    getValue: function() {

    },
    clearValue: function() {
        this._clearValue();
    },
    /**
     * @description Requests the information needed for the field
     */
    _requestFieldData: function() {
        //Hardcoded for the moment
        if ((!this.options.widScreen || !this.options.appId || !this.options.fieldTechName) && !this.options.predefinedXmlIn)
            return;
        else {
            var xmlIn;
            if (!this.options.predefinedXmlIn) {
                var dependentFields = '';
                if (this.dependObject) {
                    var dependencies = this.getDependValue();
                    var dependentFields = '';
                    dependencies.each(function(item){
                        var value = null;
                        if(item.value.options.defaultValue)
                            value = (item.value.options.defaultValue.id ? item.value.options.defaultValue.id : item.value.options.defaultValue.text);
                        if(value == null)
                            value = '';
                        value = !Object.isEmpty(item.value.getValue()) ? item.value.getValue() : value;
                        dependentFields += '<FIELD FIELDID="' + item.value.options.sapId + '" FIELDTECHNAME="' + item.value.options.fieldTechName + '" VALUE="' + value + '" />';
                    });
                }
                var serviceName = 'GET_FIELD_VAL';
                if (this.options.serviceValues)
                    serviceName = this.options.serviceValues;
                var objectType = !Object.isEmpty(this.options.objectType) ? this.options.objectType : global.objectType;
                var objectId = !Object.isEmpty(this.options.objectId) ? this.options.objectId : global.objectId;
                xmlIn = '<EWS>' +
                '<SERVICE>' + serviceName + '</SERVICE>' +
                '<OBJECT TYPE="' + objectType + '">' + objectId + '</OBJECT>' +
                '<PARAM>' +
                '<APPID>' + this.options.appId + '</APPID>' +
                '<WID_SCREEN>' + this.options.widScreen + '</WID_SCREEN>' +
                '<STR_KEY>' + this.options.strKey + '</STR_KEY>' +
                '<FIELD FIELDID="' + this.options.sapId + '" FIELDTECHNAME="' + this.options.fieldTechName + '" VALUE="" /> ' +
                '<DEP_FIELDS>' +
                dependentFields +
                '</DEP_FIELDS>' +
                '<SEARCH_PATTERN />' +
                '</PARAM>' +
                '</EWS>';
            }
            else {
                //Calling to the user defined service
                xmlIn = this.options.predefinedXmlIn;
            }
            if (this.options.sapId == 'TRANSLATION') {
                var object = {
                    EWS: {
                        o_values: {
                            item: []
                        }
                    }
                };
                global.translations.each(function(item) {
                    var node = new Object();
                    node['@value'] = item.key;
                    node['@id'] = item.key;
                    object.EWS.o_values.item.push(node);
                });
                this._processFieldData(object);
            }
            else{
                if(this.options.fieldFormat.toLowerCase() == 'a'){
                    this.autocompleter.loading();
                }    
                this.makeAJAXrequest($H({
                    xml: xmlIn,
                    successMethod: '_processFieldData'
                }));
            }
        }
    //this._processFieldData(JSON);
    },
    /**
     * @description Process the information needed for the field
     * @param JSON The returned JSON object
     */
    _processFieldData: function(JSON) {
        this._sapDataLoaded = true;
        if (!JSON.EWS.o_values && this.options.fieldFormat != 'A') {
            this._element.update('<span>No result found</span>');
            return false;
        }
        else
            return true;
    },
    /**
     * @description Perform the clear value on the  dependent fields
     */
    _dependFieldAction: function(data) {
        this._clearValue();
    },
    /**
     * @description Clears the field value leaving it empty
     */
    _clearValue: function() {

    },
    /**
     * @description This function is called every time we insert a value on a field
     */
    _valueInserted: function(defaultValue,fireEvent,noCheckField) {
        /*
        if (this.TYPES_JSON_DATA_INSERTION.get(this.options.fieldFormat)) {
            var insertion = this.TYPES_JSON_DATA_INSERTION.get(this.options.fieldFormat);
            var value = this.getObjectValue();
            if(this._storeResult) {
                if (insertion['id'])
                    this._storeResult[insertion['id']] = value.id != null ? value.id : '';
                if (insertion['text']) {
                    if (insertion['text'] in this._storeResult) {
                        this._storeResult[insertion['text']] = value.text != null ? value.text : '';
                    } else if ('@name' in this._storeResult) {
                        this._storeResult['@name'] = value.text != null ? value.text : '';
                    } else if (insertion['textNode'] in this._storeResult) {
                        this._storeResult[insertion['textNode']] = value.text != null ? value.text : '';
                    }
                }
            }
        }
        else {
            this._storeResult['@value'] = this.getObjectValue().id != null ? this.getObjectValue().id : '';
            this._storeResult['#text'] = this.getObjectValue().text != null ? this.getObjectValue().text : '';
        }
         */
        if(this._storeResult)
            if(Object.isEmpty(this.options.showText) && ('@name' in this._storeResult))
            {
                this._storeResult['@name'] = this.getObjectValue().text;
            }else{
        
                switch(this.options.showText) {
                    case '':
                        this._storeResult['@value'] = this.getObjectValue().id;
                        break;
                    case 'X':
                        this._storeResult['#text'] = this.getObjectValue().text;
                        break;
                    case 'B':
                        this._storeResult['#text'] = this.getObjectValue().text;
                        this._storeResult['@value'] = this.getObjectValue().id;
                        break;
                    case 'I':
                        this._storeResult['#text'] = this.getObjectValue().text;
                        this._storeResult['@value'] = this.getObjectValue().id;
                        break;
                }
            }
        if(noCheckField !== true)
            var valid = this.checkFormat();
        if (valid && defaultValue !== true && fireEvent !== false)
            if (this.options.events && Object.isHash(this.options.events)) {
                if (this.options.events.get('valueInserted')) {
                    document.fire(this.options.events.get('valueInserted'), {
                        value: this.getValue(),
                        servicePai: this.options.servicePai
                    });
                }
                
            }
        if (Object.isHash(this.options.events) && this.options.events.get('formFieldModified')) {
            document.fire(this.options.events.get('formFieldModified'), this.getValue());
        }
        if(noCheckField !== true)
            document.fire('EWS:fieldDisplayer_value_inserted_' + this.options.fieldId, {});
    }
});

/**
 * @constructor
 * @description Extends the FieldType class to add the text field behaviour
 */
var FieldTypeText = Class.create(FieldType,
/**
 * @lends FieldTypeText
 */{
    /**
     * @description Initializes the class functionalities
     */
    initialize: function($super,options,_statusElement,storeResult) {
        $super(options,_statusElement,storeResult);
        //Checking if the type is defined
        if(!options.type)
            throw "FieldDisplayer error: You should specify a type for input fields";
        //Creating the element
        this._element = new Element('input', {
            type: 'text',
            value: this._defaultValue ? this._defaultValue.text : null,
            maxlength: options.maxLength && options.maxlength != 0 ? options.maxLength : null,
            'class': 'fieldDisplayer_input'
        });
        //If mandatory binding the check format event
        if(!options.formatCheckByUser) {
            if(this._mandatory)
                this._element.observe('blur', this.checkFormat.bind(this));
            this._element.observe('focus', this._correctField.bind(this));
        }
        this._element.observe('blur',this._valueInserted.bind(this));
        //Defining the types regular expresions for check
        this._formatRegExp = {
            CHAR: null,
            NUMC: /^\s*\d+\s*$/,
            DEC: /^(?:\d+)(?:\.\d+)?$/
        };
        this.options = options;
    },
    /**
     * @description Checks the format of the input
     * @param $super The parent function
     */
    checkFormat: function($super) {
        $super();
        //Getting the regular expresion for the field type
        var regExp = this._formatRegExp[this.options.type];
        if(regExp)
            //Matching the format
            if(!this._element.value.match(regExp) && this._element.value.match(regExp) != null) {
                //Mark as incorrect
                this._incorrectField();
                this._correct = false;
            }
        if(this._correct)
            this._correctField();
        return this._correct;
    },
    getValue: function($super) {
        return this._element.value;
    },
    getObjectValue: function() {
        return {
            id: this.getValue(),
            text: this.getValue()
        };
    },
    setValue: function($super,value) {
        this._element.value = value;
    },
    _clearValue: function($super) {
        this._element.value = '';
        this._valueInserted();
    },
    destroy: function() {

    }
});
/**
 * @constructor
 * @description Add the specific funtionalities for creating a date field
 */
var FieldTypeDate = Class.create(FieldType,
/**
 * @lends FieldTypeDate
 */{
    /**
     * @description Stores the DatePicker class instance
     * @type DatePicker
     */
    _datePicker: null,
    /**
     * @description Initializes the class functionalities
     */
    initialize: function($super,options,_statusElement,storeResult) {
        $super(options,_statusElement,storeResult);
        //Creating the element
        this._element = new Element('div', {
            'class': 'fieldDispFloatLeft',
            'id': options.htmlId ? options.htmlId : options.fieldId
        });
        this.options = options;
        var text = null;
        if(!Object.isEmpty(this._defaultValue) && !Object.isEmpty(this._defaultValue.text)){
            if(this._defaultValue.text != global.nullDate){
                text = this._defaultValue.text.gsub('-','').strip();
            }
        }
        this._datePicker = new DatePicker(this._element,{
            emptyDateValid: !this._mandatory,
            defaultDate: this._defaultValue ? text : null,
            events: $H({
                dateSelected: 'EWS:dateSelected_'+(options.htmlId ? options.htmlId : options.fieldId),
                correctDay: 'EWS:correctDateSelected_'+(options.htmlId ? options.htmlId : options.fieldId),
                wrongDate: 'EWS:wrongDateSelected_'+(options.htmlId ? options.htmlId : options.fieldId)
            }),
            manualDateInsertion: true
        });
        if(!options.formatCheckByUser) {
            this._datePicker.dayField.observe('blur', this.checkFormat.bind(this));
            this._datePicker.monthField.observe('blur', this.checkFormat.bind(this));
            this._datePicker.yearField.observe('blur', this.checkFormat.bind(this));
            this._datePicker.dayField.observe('focus', this._correctField.bind(this));
            this._datePicker.monthField.observe('focus', this._correctField.bind(this));
            this._datePicker.yearField.observe('focus', this._correctField.bind(this));
        }
        //document.stopObserving('EWS:dateSelected_'+(options.htmlId ? options.htmlId : options.fieldId));
        document.observe('EWS:dateSelected_'+(options.htmlId ? options.htmlId : options.fieldId), this._valueInserted.bind(this));
        //document.stopObserving('EWS:correctDateSelected_'+(options.htmlId ? options.htmlId : options.fieldId));
        document.observe('EWS:correctDateSelected_'+(options.htmlId ? options.htmlId : options.fieldId), this._valueInserted.bind(this));
        document.observe('EWS:wrongDateSelected_'+(options.htmlId ? options.htmlId : options.fieldId), this._valueInserted.bind(this));
        if(options.fieldId)
            document.observe('EWS:fieldLinkedAction_'+(this.options.htmlId ? this.options.htmlId : this.options.fieldId),this._dependFieldAction.bind(this));
    },
    /**
     * @description Checks the format
     */
    checkFormat: function($super) {
        $super();
        this._correct = (this.options.displayAttrib == 'MAN' && this._datePicker.actualDate == null) ? false : true;
        if(!this._correct)
            this._incorrectField();
        else
            this._correctField();
        return this._correct;
    },
    /**
     * @description Returns the DatePicker value on SAP format
     */
    getValue: function($super) {
        if(this._datePicker.actualDate != null)
            return this._datePicker.actualDate.toString('yyyy-MM-dd');
        else
            return '';
    },
    getObjectValue: function() {
        return {
            id: this.getValue(),
            text: this.getValue()
        };
    },
    setValue: function($super,value) {
        if(value != '00-00-0000') {
            var date = Date.parseExact(value,'yyyy-MM-dd');
            this._datePicker.currentMonth = date.getMonth();
            this._datePicker.currentYear = date.getFullYear();
            this._datePicker.loadCalendarPage();
            this._datePicker.dayField.value = date.getDate();
            this._datePicker.monthField.value = date.getMonth()+1;
            this._datePicker.yearField.value = date.getFullYear();
        }
    },
    _clearValue: function() {
        this._datePicker.dayField.value = '';
        this._datePicker.monthField.value = '';
        this._datePicker.yearField.value = '';
        this._datePicker.actualDate = null;
        this._valueInserted();
    },
    _dependFieldAction: function() {
        this._clearValue();
    },
    destroy: function($super) {
        //Stop observing the defined elements
        document.stopObserving('EWS:dateSelected_'+(this.options.htmlId ? this.options.htmlId : this.options.fieldId));
        document.stopObserving('EWS:correctDateSelected_'+(this.options.htmlId ? this.options.htmlId : this.options.fieldId));
        if(!this.options.formatCheckByUser) {
            this._datePicker.dayField.stopObserving('blur');
            this._datePicker.monthField.stopObserving('blur');
            this._datePicker.yearField.stopObserving('blur');
            this._datePicker.dayField.stopObserving('focus');
            this._datePicker.monthField.stopObserving('focus');
            this._datePicker.yearField.stopObserving('focus');
    }
        //Destroying the main container
        this._element.remove();
    }
});
/**
 * @constructor
 * @description Extend the FieldType funtionalities for creating an Autocompleter component
 */
var FieldTypeAutocompleter = Class.create(FieldType, {
    datePicker: null,
    /**
    * @description Initializes the class functionalities
    */
    initialize: function($super,options,_statusElement,storeResult) {
        $super(options,_statusElement,storeResult);
        //Creating the element
        this._element = new Element('div', {
            id: 'autocompleter_' + options.htmlId
        });
        var showTextFormat = '#{text}';
        if (options.showText)
            showTextFormat = this._showTextDisplay(options.showText);
        if(options.htmlId)
            options.htmlId = options.htmlId + Math.random().toString().gsub('.','');
        this.autocompleter = new JSONAutocompleter(this._element, {
            events: $H({
                onGetNewXml: 'EWS:autocompleterGetNewXml_' + options.htmlId,
                onResultSelected: 'EWS:autocompleterResultSelected' + options.htmlId,
                onDataLoaded: 'EWS:autocompleterDataLoaded' + options.htmlId
            }),
            showEverythingOnButtonClick: true,
            timeout: 5000,
            maxShown: 5,
            virtualVariables: true,
            fireEventWhenDefaultValueSet: this.options.fireEventWhenDefaultValueSet == undefined ? true : this.options.fireEventWhenDefaultValueSet,
            templateResult: showTextFormat,
            templateOptionsList: showTextFormat.gsub('<', '&lt;').gsub('>', '&gt;')
        }, {
            autocompleter: {
                object: []
            }
        });
        //If mandatory binding the check format event
        if (!options.formatCheckByUser) {
            if (this._mandatory)
                this.autocompleter.element.observe('blur', this.checkFormat.bind(this));
            this.autocompleter.element.observe('focus', this._correctField.bind(this));
        }
        if ((this._mandatory || this.options.defaultValue) && !this.options.dependField)
            this._requestFieldData();
        else {
            document.observe('EWS:autocompleterGetNewXml_' + options.htmlId, this._requestFieldData.bind(this));
            if (this.options.defaultValue) {
                var data = {
                    EWS: {
                        o_values: {
                            item: [{
                                '@id': this.options.defaultValue.id,
                                '@value': this.options.defaultValue.text
}]
                            }
                        }
                    };
                    this._processFieldData(data);
                }
            }
            this._valueInsertedBind = this._valueInserted.bind(this);
            //document.stopObserving('EWS:autocompleterResultSelected'+options.fieldId);
            document.observe('EWS:autocompleterResultSelected' + options.htmlId, this._valueInsertedBind);
        },
        _showTextDisplay: function(showText) {
            var format;
            switch (showText) {
                case 'X':
                    format = '#{text}';
                    break;
                case 'B':
                    format = '#{text} <#{data}>';
                    break;
                case '':
                    format = '#{data}';
                    break;
                case 'I':
                    format = '#{text}';
                    break;
                default:
                    format = '#{text} <#{data}>';
                    break;
            }
            return format;
        },
        /**
        * @description Checks the componen format
        */
        checkFormat: function($super) {
            $super();
            if (Object.isEmpty(this.autocompleter.element.value) && this.options.displayAttrib == 'MAN') {
                this._correct = false;
                this._incorrectField();
            }
            else
                this._correct = true;
            return this._correct;
        },
        _processFieldData: function($super, JSON) {
            $super(JSON);
            var updateData = $A();
            this.autocompleter.stopLoading();
            if (JSON.EWS.o_values) {
                objectToArray(JSON.EWS.o_values.item).each(function(item) {
                    updateData.push({
                        data: item['@id'] == null ? '' : item['@id'],
                        text: item['@value'] == null ? '' : item['@value']
                    });
                });
                this.autocompleter.updateInput({
                    autocompleter: {
                        object: updateData
                    }
                });
            }
            if (this.options.defaultValue) {
                this._setDefaultValue(this.options.defaultValue.id);
            }
        },
        /**
        * @description Gets the component value
        */
        getValue: function($super) {
            if (this.autocompleter.getValue())
                return this.autocompleter.getValue().idAdded;
            else
                return '';
        },
        getObjectValue: function() {
            if (this.autocompleter.getValue()) {
                var value = this.autocompleter.getValue();
                return {
                    id:   unescape(value.idAdded),
                    text: unescape(value.textAdded)
                };
            }
            else
                return {
                    id: null,
                    text: null
                };
        },
        setValue: function($super, value) {
            this._requestFieldData();
            this.autocompleter.setDefaultValue(value);
        },
        _clearValue: function() {
            this.autocompleter.clearInput();
            this._valueInserted(true);
        },
        _setDefaultValue: function($super, value) {
            this.autocompleter.setDefaultValue(value, false, false);
        },
        destroy: function($super) {
            $super();
            document.stopObserving('EWS:autocompleterResultSelected' + this.options.htmlId);
            document.stopObserving('EWS:autocompleterGetNewXml_' + this.options.htmlId, this._requestFieldData.bind(this));
        }
    });

var FieldTypeSelectBox = Class.create(FieldType,{
    datePicker: null,
    /**
     * @description Initializes the class functionalities
     */
    initialize: function($super,options,_statusElement,storeResult) {
        $super(options,_statusElement,storeResult);
        //Creating the element
        this._element = new Element('select',{
            'class': 'fieldDisplayer_select fieldDispHeight',
            'id': options.htmlId
        });
        this._valueInsertedBind = this._valueInserted.bind(this);
        //Requesting the field data
        //if(this.options.displayAttrib == 'MAN' && Object.isEmpty(this.options.defaultValue) && Object.isEmpty(this.options.dependField))
        //Requesting the field data
        if(!this.options.dependField)
            this._requestFieldData();
    //else {
    //Setting the default value if defined
    //  if(!Object.isEmpty(this.options.defaultValue))
    //  this._setDefaultValue(this.options.defaultValue);
    //  this._requestFieldDataBind = this._requestFieldData.bind(this);
    //The data will be requested at the moment the user try to select an item on the selectable area
    //  this._element.observe('click',this._requestFieldDataBind);
    //}
    },
    /**
     * @description Checks the field format
     * @param $super parent method
     * @return If the format is correct or not
     */
    checkFormat: function($super) {
        $super();
        if(this._mandatory && Object.isEmpty(this.getValue())) {
            this._correct = false;
            this._incorrectField();
            return false;
        }
        else {
            this._correctField();
            return this._correct;
        }
    },
    _valueInserted: function($super,param1,param2,noCheckField) {
        $super(param1,param2,noCheckField);
        if(noCheckField !== true)
            this.checkFormat();
    },
    /**
     * @description Sets a value on the element
     * @param $super Parent method initializer
     * @param value The new value to be setted up
     */
    setValue: function($super,value) {
        
    },
    /**
     * @description Gets the current selected value
     * @param $super Parent function initializer
     * @returns The selected value
     */
    getValue: function($super) {
        if(this._element.selectedIndex != -1) {
            var value = this._element.options[this._element.selectedIndex].value;
            if(Object.isEmpty(value))
                return null;
            else
                return value;
        }
        else
            return '';
    },
    dependenciesSet: function($super) {
        $super();
        if(!this.dataProcessed)
            if(this.options.dependField)
                this._requestFieldData();
    },
    getObjectValue: function() {
        if(this._element.selectedIndex != -1) {
            var option = this._element.options[this._element.selectedIndex];
            return {
                id:option.value,
                text:option.text
            };
        }
        else
            return {
                id:null,
                text:null
            };
    },
    /**
     * @description Parses the GET_FIELD_VAL JSON to insert the element on the selectable box
     * @param $super Parent class initializer
     * @param JSON The JSON to be parsed
     */
    _processFieldData: function($super,JSON) {
        this._dataProcessed = true;
        //this._element.update('');
        //Cleaning the element
        this._element.update('');
        if(JSON.EWS.o_values) {
            this._element.insert('<option value=""></option>');
            var selectNext = false;
            var isIE6 = /msie|MSIE 6/.test(navigator.userAgent);
            objectToArray(JSON.EWS.o_values.item).each(function(item, index) {
                if(item['@id'] === null)
                    item['@id'] = '';
                var selected = false;
                if(selectNext) {
                    selected = true;
                    selectNext = false;
                }
                if(this.options.defaultValue)
                    if(this.options.defaultValue.id === item['@id'])
                        isIE6 ? selectNext = true : selected = true;
                if(!Prototype.Browser.IE)
                    this._element.insert(new Option(this._formatShowText(item, this.options.showText),item["@id"], false, selected));
                else
                    this._element.add(new Option(this._formatShowText(item, this.options.showText),item["@id"], false, selected));
            }.bind(this));            
        }
        this._element.stopObserving('click',this._requestFieldDataBind);
        this._valueInserted(true,false,true);
        this._element.observe('change',this._valueInsertedBind);
    },
    _formatShowText: function(node,showText) {
        var id = global.idSeparatorLeft + node['@id']+global.idSeparatorRight;
        switch(showText) {
            case 'X':
                return node['@value'];
                break;
            case 'B':
                return node['@value']+id;
                break;
            case '':
                return node['@id'];
                break;
            case 'I':
                return node['@value'];
                break;
        }
    },
    _clearValue: function($super) {
        $super();
        $A(this._element.childNodes).each(function(item,i) {
            item.selected = i == 0 ? true : false;
        });
        //Once the dependent field indicated us that the field needts to be
        // cleared we request the data to SAP again
        this._requestFieldData();
        this._valueInserted();
    },
    _setDefaultValue: function(value) {
        if(!value.text)
            return;
        else
            this._element.insert('<option value="'+value.id+'" selected>'+value.text+'</option>');

    },
    destroy: function() {

    }
});

var FieldTypeRadioButton = Class.create(FieldType,{
    datePicker: null,
    /**
     * @description Initializes the class functionalities
     */
    initialize: function($super,options,_statusElement,storeResult) {
        $super(options,_statusElement,storeResult);
        //Creating the element
        this._element = new Element('div', {
            'class': 'fieldDispFloatLeft'
        });
        this.options = options;
        this._valueInsertedBind = this._valueInserted.bind(this);
        this._requestFieldData();
    },
    checkFormat: function($super) {
        $super();
        return this._correct;
    },
    setValue: function($super,value) {
        return value;
    },
    getValue: function($super) {
        var checked;
        $A(this._element.childNodes).each(function(item) {
            if(item.down())
                if(item.down().down().checked)
                    checked = item.down().down().value;
        });
        return checked;
    },
    getObjectValue:function() {
        return {
            id:this.getValue(),
            text:null
        };
    },
    _processFieldData: function($super,JSON) {
        $super(JSON);
        if(JSON.EWS.o_values) {
            var first;
            JSON.EWS.o_values.item.each(function(item) {
                if(item['@id'] === null)
                    item['@id'] = '';
                var radioButton = new Element('input', {
                    type: 'radio',
                    name: this.options.fieldId,
                    value: item['@id']
                });
                var radioButtonSpan = new Element('span', {
                    'class': 'fieldDispFloatLeft fieldDispHalfSize'
                });
                radioButtonSpan.insert(radioButton);
                if(!first)
                    first = radioButton;
                this._element.insert(new Element('div',{
                    'class':'fieldDispFloatLeft fieldDispHalfSize'
                }).insert(radioButtonSpan).insert("<span class='fieldDispFloatLeft fieldDispHalfSize'>&nbsp;"+item['@value']+"</span>"));
                if(this.options.defaultValue && this.options.defaultValue.id)
                    if(item['@id'] == this.options.defaultValue.id) {
                        radioButton.checked = true;
                        this._valueInserted();
                    }
                radioButton.observe('click', this._valueInsertedBind);
            }.bind(this));
            if(!this.options.defaultValue) {
                first.checked = true;
                this._valueInserted(true);
            }
        }
    },
    _clearValue: function($super) {
        $A(this._element.childNodes).each(function(item) {
            item.firstChild.checked =  false;
        });
        this._valueInserted();
    },
    destroy: function() {

    }
});

var FieldTypeCheckBox = Class.create(FieldType,{
    datePicker: null,
    /**
     * @description Initializes the class functionalities
     */
    initialize: function($super,options,_statusElement,storeResult) {
        $super(options,_statusElement,storeResult);
        //Creating the element
        this._element = new Element('div',{
            'class': 'fieldDispFloatLeft'
        });
        this._valueInsertedBind = this._valueInserted.bind(this);
        this.options = options;
        if(Object.isEmpty(this.options.serviceValues))
            this._createSingleComponent();
        else 
            this._requestFieldData();
    },
    checkFormat: function($super) {
        $super();
        return this._correct;
    },
    setValue: function($super,value) {
        return value;
    },
    getValue: function($super) {
        var value = $A();
        if(this._singleComponent) {
            if(this._element.down().checked)
                return 'X';
            else
                return ' ';
        }
        else {
            $A(this._element.childNodes).each(function(item) {
                if(item.firstChild.checked)
                    value.push(item.firstChild.getAttribute('name'));
            });
        }
        return value;
    },
    getObjectValue: function() {
        return {
            id:this.getValue(),
            text:this.getValue()
        };
    },
    _processFieldData: function($super,JSON) {
        $super(JSON);
        if(JSON.EWS.o_values) {
            JSON.EWS.o_values.item.each(function(item) {
                if(item['@id'] === null)
                    item['@id'] = '';
                var checkbox = new Element('input', {
                    type: 'checkbox',
                    name: item['@id'],
                    value: item['@value']
                });
                if(item['@default_value'] == 'X')
                    checkbox.checked = true;
                this._element.insert(new Element('div').insert(checkbox).insert(item['@value']).insert('<br />'));
                checkbox.observe('click', this._valueInsertedBind);
            }.bind(this));
        }
    },
    _createSingleComponent: function() {
        this._singleComponent = true;
        var checkbox = '<input type="checkbox"'+(!Object.isEmpty(this.options.defaultValue) && (this.options.defaultValue.id == 'X') ? ' checked' : '') +' />';
        this._element.insert(checkbox);
        this._element.down().observe('click', this._valueInsertedBind);
    },
    _clearValue: function($super) {
        $A(this._element.childNodes).each(function(item,i) {
            item.firstChild.checked = false;
        });
        this._valueInserted();
    },
    destroy: function() {

    }
});

/**
 * @constructor
 * @description Extends the FieldType class to add the text field behaviour
 */
var FieldTypeTextArea = Class.create(FieldType,
/**
 * @lends FieldTypeText
 */{
    /**
     * @description Initializes the class functionalities
     */
    initialize: function($super,options,_statusElement,storeResult) {
        $super(options,_statusElement,storeResult);
        //Creating the element
        this._element = new Element('textarea',{
            'class': 'fieldDisplayer_textArea'
        });
        if(options.defaultValue)
            this._element.update(options.defaultValue.text);
        //If mandatory binding the check format event
        if(!options.formatCheckByUser) {
            if(this._mandatory)
                this._element.observe('blur', this.checkFormat.bind(this));
            this._element.observe('focus', this._correctField.bind(this));
        }
        this._valueInsertedBind = this._valueInserted.bind(this);
        this._element.observe('blur',this._valueInsertedBind);
        this.options = options;
    },
    getValue: function($super) {
        return this._element.value;
    },
    setValue: function($super,value) {
        this._element.update(value);
    },
    getObjectValue: function() {
        return {
            id: this.getValue(),
            text:this.getValue()
        };
    },
    _clearValue: function() {
        this._element.value = '';
        this._valueInserted();
    },
    destroy: function() {

    }
});
var FieldTypeHour = Class.create(FieldType,{
    initialize: function($super,options,_statusElement,storeResult) {
        $super(options,_statusElement,storeResult);
        this._element = new Element('div',{
            'class': 'fieldDispFloatLeft fieldElement_fixedWidth'
        });
        this._hourField = new HourField(this._element,{
            viewSecs: 'no',
            format: '24',
            events: $H({
                onIncorrectTime: 'EWS:fieldDisplayerHourIncorrect_'+options.fieldId,
                onCorrectTime: 'EWS:fieldDisplayerHourCorrect_'+options.fieldId
            }),
            defaultTime: this._defaultValue?this._defaultValue.id.gsub(':',''):'000000',
            addErrorField: false
        });
        document.observe('EWS:fieldDisplayerHourIncorrect_'+options.fieldId,this._incorrectField.bind(this));
        document.observe('EWS:fieldDisplayerHourCorrect_'+options.fieldId,this._correctField.bind(this));
        this._valueInsertedBind = this._valueInserted.bind(this);
        document.observe('EWS:fieldDisplayerHourCorrect_'+options.fieldId,this._valueInsertedBind);
    },
    getValue: function($super) {
        return this._hourField.getSapTime();
    },
    getObjectValue: function() {
        return {
            id: this.getValue(),
            text: this.getValue()
        };
    },
    setValue: function($super,value) {
        return value;
    },
    _incorrectField: function($super) {
        $super();
    },
    _clearValue: function() {
        this.contentHour = '00';
        this.contentMin = '00';
        this._valueInserted();
    },
    destroy: function() {

    }
});

var FieldTypeLink = Class.create(FieldType,{
    initialize: function($super,options,_statusElement) {
        this._element = new Element('span', {
            'class': 'application_action_link'
        });
        this._element.update(options.defaultValue);
    }
});

var FieldTypeImage = Class.create(FieldType,{
    initialize: function($super,options,_statusElement) {
        $super(options,_statusElement);
    },
    destroy: function() {

    }
});

var FieldTypeBubble = Class.create(FieldType,{
    initialize: function($super,options,_statusElement) {
        $super(options,_statusElement);
        var className;
        if(this.options.defaultValue)
            className = this._getBubbleColor(parseInt(this.options.defaultValue.id));
        else
            className = '';
        this._element = new Element('div',{
            'class': className
        });
    },
    _getBubbleColor: function(value) {

        var bubble = '';
        switch (value) {
            case 0:
                bubble = "application_emptyBubble";
                break;
            case 1:
                bubble = "application_icon_red";
                break;
            case 2:
                bubble = "application_icon_orange";
                break;
            case 3:
                bubble = "application_icon_green";
                break;
        }
        return bubble;

    },
    destroy: function() {

    }
});
