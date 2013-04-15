/**
* @fileoverview fieldDisplayer2.js
* @description Contains all the functionalities for creating fields.
*      This fields can be read only or input fields, what the modules does is to decide what to
*      create from the information the programmer provides to the module, and implements few
*      functionalities like format check (for example in the case the field type is integer number
*      won't be possible to insert text)
*/

/**
* FieldDisplayerFactory will return a FieldDisplayer object according to the options given
* as an argument.
* @constructor
*/

var FieldDisplayerFactory = Class.create(origin,
/**
* @lends FielDisplayer
*/
{
/**
* It has a visual dependence in another field. (based on depend_type)
*/
DEPENDENCY_NEXT_TO: "X",
/**
* It has a visual and logic dependence in another field. (based on depend_type)
*/
DEPENDENCY_NEXT_TO_AND_LOGIC: "B",
/**
* It has a logic dependence in another field. (based on depend_type)
*/
DEPENDENCY_LOGIC: "",
/**
* Field type possible values.
*/
FIELD_TYPES: $H({
    A: "fieldTypeAutocompleter",
    B: "fieldTypeBubble",
    C: "fieldTypeCheckBox",
    D: "fieldTypeOutput",
    O: "fieldTypeOutput",
    V: "fieldTypeOutput",
    H: "fieldTypeHour",
    I: "fieldTypeText",
    L: "fieldTypeLink",
    E: "fieldTypeLinkToHandler",
    M: "fieldTypeImage",
    P: "fieldTypeDate",
    R: "fieldTypeRadioButton",
    //S: "fieldTypeSelectBox",
    S: "fieldTypeAutocompleter",
    T: "fieldTypeTextArea"
}),
/**
* The input doesn't have a label (based on label_type)
*/
LABEL_TYPE_NO_LABEL: "N",
/**
* Use the label on field settings fieldlabel (based on label_type)
*/
LABEL_TYPE_USE_SETTINGS: "V",
/**
* Use the label coming with the service in the standard way ((based on label_type)
*/
LABEL_TYPE_USE_LABEL_TAG: "",
/**
* Create mode.
*/
MODE_CREATE: "create",
/**
* Display mode.
*/
MODE_DISPLAY: "display",
/**
* Edit mode.
*/
MODE_EDIT: "edit",
/**
* Show text only (based on show_text)
*/
SHOW_TEXT_ONLY_TEXT_X: "X",
/**
* Show text only (based on show_text)
*/
SHOW_TEXT_ONLY_TEXT_I: "I",
/**
* Show text and value (based on show_text)
*/
SHOW_TEXT_VALUE_AND_TEXT: "B",
/**
* Show value only (based on show_text)
*/
SHOW_TEXT_ONLY_VALUE: null,

initialize: function() {
},
/**
* Returns a fieldDisplayer according to the JSON given in the options
* @param {JSON} optionsJSON The options coming from the service in JSON format.
* @param {String} screen The screen reference.
* @param {String} record The record reference.
* @param {String} mode the mode for the field displayer.
*/
getFieldDisplayer: function(optionsJSON, screen, record, key_str, appid, mode, labels, fieldDisplayerModified, cssClasses, xml_in, handler, name, getFieldValueAppend, randomId, rowSeqnr, variant, FPObject) {
    var options = this._parseOptions(optionsJSON, screen, record, key_str, appid, mode, labels, fieldDisplayerModified, cssClasses, xml_in, handler, name, getFieldValueAppend, randomId, rowSeqnr, variant, FPObject);
    var className = options.fieldType;
    return new window[className](options);
},
/**
* Takes the options in JSON format and convert them into a more easy readable format.
* @param {JSON} optionsJSON optionsJSON The options coming from the service in JSON format.
* @param {String} screen The screen reference.
* @param {String} record The record reference.
* @param {String} mode The operation mode
* @param {JSON|String} xml_in The xml_in which will be sent to the service. Can be both a JSON
* 						or a String.
* @return {JSON} the options parsed into an easily readable JSON object.
*/
_parseOptions: function(optionsJSON, screen, record, key_str, appid, mode, labels, fieldDisplayerModified, cssClasses, xml_in, handler, name, getFieldValueAppend, randomId, rowSeqnr, variant, FPObject) {
    this.labels = labels;
    if (!Object.isEmpty(optionsJSON.settings['visualOpt']))
        var visualOpt = optionsJSON.settings['visualOpt'];
    else
        var visualOpt = false;
    var options = {
        appId: appid,
        //cssClasses specific for this application, it overwrites the standard ones
        cssClasses: cssClasses,
        customXmlIn: xml_in,
        //data about the dependency, the field id and the dependency type.
        dependency: this._getDependency(optionsJSON),
        //get the template for the display format in the field displayer
        displayFormat: this._getDisplayFormat(optionsJSON, mode),
        //if defined, the fieldDisplayers will throw this event when changed
        fieldDisplayerModified: fieldDisplayerModified,
        //get the proper fieldType
        fieldType: this._getFieldType(optionsJSON),
        //if it's a hidden field or not
        hidden: this._getIsHidden(optionsJSON),
        //the id of the field
        id: optionsJSON.values["@fieldid"],
        //field format
        fieldFormat: optionsJSON.settings["@fieldformat"],
        keyStr: key_str,
        //the label to be shown for the field
        label: this._getLabel(optionsJSON),
        //if it's mandatory or not
        mandatory: this._getIsMandatory(optionsJSON),
        //the mode (create, edit or display
        mode: mode,
        objectType: this._getObjectType(),
        objectId: this._getObjectId(),
        //service_pai
        onChangeEvent: optionsJSON.settings["@service_pai"],
        //the JSON with the options. It will be updated with the user's interaction data.
        optionsJSON: optionsJSON,
        //if the field is output only or not
        outputOnly: this._getIsOutputOnly(optionsJSON),
        //the record (if any)
        record: record,
        //the screen (if any)
        screen: screen,
        //field techName (used to build dependencies)
        techName: optionsJSON.values["@fieldtechname"],
        //get the text and the value either from default_text/default_value on field settings
        //or the #text/value on field value
        text: this._getText(optionsJSON, screen, record, mode),
        value: this._getValue(optionsJSON, screen, record, mode),
        //service_values the service to the get the values list.
        valueListService: optionsJSON.settings["@service_values"],
        //field_type the field subtype
        type: optionsJSON.settings["@type"],
        //field handler (fieldTypeLinkToHandler)
        handler: handler,
        name: name,
        getFieldValueAppend: getFieldValueAppend,
        randomId: randomId,
        rowSeqnr: rowSeqnr,
        visualOpt: visualOpt,
        variant: variant, 
        FPObject: FPObject
    };
    if (optionsJSON.values["@fieldid"] == 'SPRSL' && appid == 'PD_DATA') {
        options.rechargeAll = true
    }
    return options;
},
/**
* Gets the dependency data according to options from the service.
* @param {JSON} optionsJSON optionsJSON The options coming from the service in JSON format.
* @return {JSON} The dependency data for this field displayer (from which field it depends and the type).
*/
_getDependency: function(optionsJSON) {
    var dependencyData;
    var dependType = optionsJSON.settings["@depend_type"];
    var dependField = optionsJSON.settings["@depend_field"];
    switch (dependType) {
        //only logic dependency is handled in field displayer.                
        case this.DEPENDENCY_NEXT_TO:
            dependencyData = {
                type: '',
                field: ''
            };
            break;
        case this.DEPENDENCY_NEXT_TO_AND_LOGIC:
        case this.DEPENDENCY_LOGIC:
            dependencyData = {
                type: dependType,
                field: dependField
            };
            break;
        //if none of the previous, give empty data.                
        default:
            dependencyData = {
                type: dependType,
                field: dependField
            };
            break;
    }

    return dependencyData;
},
/**
* Get the correct format to show text and value for a field
* @param {JSON} optionsJSON the options coming from the service in JSON format
* @return {Template} The template with the format for the field. This template will have
* 					  two fields: #{text} and #{value} which are self explained.
*/
_getDisplayFormat: function(optionsJSON, mode) {
    var template;
    var showText = optionsJSON.settings["@show_text"];
    switch (showText) {
        case this.SHOW_TEXT_ONLY_TEXT_I:
            if (optionsJSON.settings["@fieldid"] == "BETRG")
                template = new Template("#{value}");
            else
                template = new Template("#{text}");

            break;

        case this.SHOW_TEXT_ONLY_TEXT_X:
            template = new Template("#{text}");
            break;

        case this.SHOW_TEXT_ONLY_VALUE:
            //Fix to show the id correctly, in display mode we need "value" and in edit or create we need "data"
            if (mode == "display" || optionsJSON.settings["@display_attrib"] == "OUO" || (mode != "display" && optionsJSON.settings["@fieldformat"] == "V") || (mode != "display" && optionsJSON.settings["@fieldformat"] == "D")) {
                template = new Template("#{value}");
            } else {
                template = new Template("#{data}");
            }
            break;

        case this.SHOW_TEXT_VALUE_AND_TEXT:
        default:
            //Fix to show the id correctly, in display mode we need "value" and in edit or create we need "data"
            if (mode == "display" || optionsJSON.settings["@display_attrib"] == "OUO" || (mode != "display" && optionsJSON.settings["@fieldformat"] == "V") || (mode != "display" && optionsJSON.settings["@fieldformat"] == "D")) {
                template = new Template("#{text}" + " " + global.idSeparatorLeft + "#{value}" + global.idSeparatorRight);
            } else {
                template = new Template("#{text}" + " " + global.idSeparatorLeft + "#{data}" + global.idSeparatorRight);
            }
            break;
    }

    return template;
},
/**
* Gets the field type according to the options in optionsJSON.
* @param {JSON} optionsJSON the options coming from the service in JSON format.
* @return {String} the field type name.
*/
_getFieldType: function(optionsJSON, mode) {
    var type = optionsJSON.settings["@fieldformat"];
    if (optionsJSON.settings['@fieldid'] && optionsJSON.settings['@fieldid'].toLowerCase() == 'translation')
        return "fieldTypeHidden";
    //		if(this._getIsOutputOnly(optionsJSON) || mode == this.MODE_DISPLAY){
    if (this._getIsOutputOnly(optionsJSON)) {
        return "fieldTypeOutput";
    } else if (type && !this._getIsHidden(optionsJSON)) {
        type = this.FIELD_TYPES.get(type);
        if (!type) {
            throw "fieldformat is an unexistent type for field: " + optionsJSON.settings['@fieldid'];
        } else {
            return type;
        }
    } else if (!this._getIsHidden(optionsJSON)) {
        throw "fieldformat is empty for field: " + optionsJSON.settings['@fieldid'];
    } else {
        return "fieldTypeHidden";
    }
},
/**
* Get's if this is a hidden field or not
* @return {Boolean} true when it's hidden. False otherwise.
*/
_getIsHidden: function(optionsJSON) {
    var displayAttribute = optionsJSON.settings["@display_attrib"];
    if (displayAttribute == "HID" || displayAttribute == "HOU") {
        return true;
    } else {
        return false;
    }
},
/**
* Get's whether a field is mandatory to be filled or not.
* @param {JSON} optionsJSON optionsJSON The options coming from the service in JSON format.
* @return {Boolean} Whether the field is mandatory or not
*/
_getIsMandatory: function(optionsJSON) {
    var displayAttribute = optionsJSON.settings["@display_attrib"];
    if (displayAttribute == "MAN") {
        return true;
    } else {
        return false;
    }
},
/**
* Get's whether a field is output only or not.
* @param {JSON} optionsJSON optionsJSON The options coming from the service in JSON format.
* @return {Boolean} Whether the field is output only or not
*/
_getIsOutputOnly: function(optionsJSON) {
    var displayAttribute = optionsJSON.settings["@display_attrib"];
    var fieldFormat = optionsJSON.settings["@fieldformat"];
    //Checkboxes that are outout only should be treated as checkboxes, not output only
    if (displayAttribute == "OUO" && fieldFormat !="C") {
        return true;
    } else {
        return false;
    }
},
/**
* Gets the correct label from the optionsJSON according to the needed logic.
* @param {JSON} optionsJSON the options coming from the service in JSON format.
* @return {String} the label.
*/
_getLabel: function(optionsJSON) {

    var label;
    var labelType = optionsJSON.settings["@label_type"];
    switch (labelType) {
        case this.LABEL_TYPE_NO_LABEL:
            label = "";
            break;

        case this.LABEL_TYPE_USE_SETTINGS:
            label = optionsJSON.settings["@fieldlabel"];
            break;

        case this.LABEL_TYPE_USE_LABEL_TAG:
        default:
            //if there's no labels, return the fieldid.
            if (this.labels && this.labels.get(optionsJSON.values["@fieldid"])) {
                label = this.labels.get(optionsJSON.values["@fieldid"]);
            } else {
                label = global.getLabel(optionsJSON.values["@fieldid"]);
            }
            break;
    }

    return label;
},
/**
* Gets the object type, either from global or from the JSON options.
* @return {String} the object type.
*/
_getObjectType: function() {
    if (global.getPopulationName(global.currentApplication.appId) == 'NOPOP') {
        return global.objectType;
    } else {
        return global.getEmployee(global.getSelectedEmployees().first()).type;
    }
},
/**
* Gets the object ID, from global. The object id is the id of the selected employee
* If we are in multiple selection, we will use the logged user
* @return {String} The object ID, global.objectId if there is no one selected.
*/
_getObjectId: function() {
    //If we are in multiple selection
    if (!Object.isEmpty(global.currentSelectionType) && global.currentSelectionType == "multi") {
        return global.objectId;
    } else {
        var selected = global.getSelectedEmployees();
        if (Object.isEmpty(selected)) {
            return global.objectId;
        }
        if (selected.size() == 0) {
            return global.objectId;
        }
        return selected[0];
    }
},
/**
* Gets the correct text for the field according to options from the service and the mode
* @param {JSON} optionsJSON optionsJSON The options coming from the service in JSON format.
* @param {String} screen The screen reference.
* @param {String} record The record reference.
* @param {String} mode The operation mode, can be
* @return {String} the correct field text.
*/
_getText: function(optionsJSON, screen, record, mode) {
    var text;
    switch (mode) {
        case this.MODE_CREATE:
            text = optionsJSON.settings["@default_text"];
            break;

        case this.MODE_EDIT:
        case this.MODE_DISPLAY:
        default:

            text = optionsJSON.values["#text"];

            break;
    }
    return text;
},
/**
* Gets the correct value for the field according to options from the service and the mode
* @param {JSON} optionsJSON optionsJSON The options coming from the service in JSON format.
* @param {String} screen The screen reference.
* @param {String} record The record reference.
* @param {String} mode The operation mode, can be
* @return {String} the correct field value.
*/
_getValue: function(optionsJSON, screen, record, mode) {
    var value;
    switch (mode) {
        case this.MODE_CREATE:
            if (!Object.isEmpty(optionsJSON.settings["@default_value"])) {
                if ((optionsJSON.settings['@type'] == "DEC" || optionsJSON.settings['@type'] == "CURR") && displayToLong(optionsJSON.settings["@default_value"]).toString() != "NaN") {
                    if (optionsJSON.settings["@default_value"].split('.')[1]) {
                        var decimalLong = optionsJSON.settings["@default_value"].split('.')[1].length;
                        dispMode = longToDisplay(parseFloat(optionsJSON.settings["@default_value"], 10), decimalLong);
                    }
                    else {
                        dispMode = longToDisplay(parseFloat(optionsJSON.settings["@default_value"], 10));
                    }
                    value = dispMode;
                }
                else {
                    value = optionsJSON.settings["@default_value"];
                }
            }
            else {
                value = optionsJSON.settings["@default_value"];
            }
            break;

        case this.MODE_EDIT:
            if (!Object.isEmpty(optionsJSON.values["@value"])) {

                if ((optionsJSON.settings['@type'] == "DEC" || optionsJSON.settings['@type'] == "CURR") && displayToLong(optionsJSON.values["@value"]).toString() != "NaN") {
                    if (optionsJSON.values["@value"].split('.')[1]) {
                        var decimalLong = optionsJSON.values["@value"].split('.')[1].length;
                        dispMode = longToDisplay(parseFloat(optionsJSON.values["@value"], 10), decimalLong);
                    }
                    else {
                        dispMode = longToDisplay(parseFloat(optionsJSON.values["@value"], 10));
                    }
                    value = dispMode;
                }
                else {
                    value = optionsJSON.values["@value"];
                }
            }
            else {
                value = optionsJSON.values["@value"];
            }
            break;
        case this.MODE_DISPLAY:
        default:

            value = optionsJSON.values["@value"];

            break;
    }
    return value;
},
/**
* This function gets the actual value selected on the field, it should be extended by each one of the types
* to get the value
* @return {String} The actual value on the field
*/
getText: function() {

},
/**
* This function gets the actual ID of the selected value on the field, It should be extended by each one of the type
* to get the proper ID
* @return {String} The actual ID selected on the field
*/
getValue: function() {

}
});

/**
* fieldDisplayer is a parent class for all the field displayer. It contains common code needed
* for all of them.
* @constructor
*/
var parentFieldDisplayer = Class.create(origin,
/**
* @lends fieldDisplayer
*/
{
DISPLAY_MODE: 'display',
/**
* It sets how the fieldDisplayer JSON has to be updated depending on its Class.
*/
jsonInsertion: $H({

    fieldTypeText: {
        text: '@value',
        id: null
    },
    fieldTypeAutocompleter: {
        text: '#text',
        id: '@value'
    },
    fieldTypeCheckBox: {
        id: '@value'
    },
    fieldTypeRadioButton: {
        id: '@value',
        text: null
    },
    fieldTypeSelectBox: {
        text: '#text',
        id: '@value',
        textNode: 'text'
    },
    fieldTypeHidden: {
        text: '#text',
        id: '@value'
    },
    fieldTypeOutput: {
        text: '#text',
        id: '@value'
    },
    fieldTypeTextArea: {
        text: '@value',
        id: null
    },
    fieldTypeDate: {
        text: '@value',
        id: '@value'
    },
    fieldTypeHour: {
        text: '@value',
        id: null
    }
}),
/**
* All the events and events being listened and it's handler functions.
* @type Hash
*/
_events: null,
/**
* The HTML Element object which contains the layout for this field displayer
* @type Element
*/
_element: null,
/**
* The Module instance used for the field displayer if any.
* @type Object
*/
_moduleInstance: null,
/**
* The html Element in which the  module will be inserted
*/
_moduleElement: null,
/**
* The html Element in which the label will be inserted
*/
_labelElement: null,
/**
* Hash in order to store the last value selected on every fieldDisplayer, since sometimes a field
* depends of another one of which onFieldChange event has been fired before because it is
* in the xml before.
* //TODO: REFACTOR: _lastValueSelected is no longer used. We should remove everywhere where it appears
*/
_lastValueSelected: $H(),
/**
* Indicates if the field has o hasn't got its value for the first time.
* This is useful to avoid calling paiEvents the first time the field is displayed.
*/
_firstTimeGettingValue: true,
/**
* Unique Id for every fieldDisplayer so that events do not get mixed
*/
_id: null,


initialize: function($super, options) {
    $super();
    this.options = options;
    this._id = Math.floor(Math.random() * 100000) + "";

    if ((options.mode != this.DISPLAY_MODE
    || options.fieldType == 'fieldTypeRadioButton'
    || options.fieldType == 'fieldTypeCheckBox'
    || options.fieldType == 'fieldTypeBubble'
    || options.fieldType == 'fieldTypeImage')
    && options.fieldType != 'fieldTypeOutput') {
        this._events = $H();
        this._setLayout();
        this._initializeModule();
        this._setOnChange();
        this._setHowToGetValue();
    } else {
        this._setLayoutDisplay();
    }
},
//METHODS TO DISPLAY THE OBJECT
//***********************************************************************************************************************************************
/**
* Prepare the layout for the field displayer
*/
_setLayoutDisplay: function() {
    if (this.options.hidden) {
        this._element = new Element("div").hide();
    } else {
        if (this.options.optionsJSON.settings['@depend_type'] == 'X' || this.options.optionsJSON.settings['@depend_type'] == 'V') {
            this._element = new Element("div", {
                "class": "fieldWrap fieldDispFloatLeft __there"
            });
        } else {
            this._element = new Element("div", {
                "class": "fieldWrapDisplayMode fieldClearBoth fieldDispFloatLeft",
                "id": this.options.id + '_' + this.options.appId + '_' + this.options.screen + '_' + this.options.record
            });
        }
        this._labelElement = new Element("div", {
            "class": "fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text",
            "title": this.options.label
        });
        this._labelElement.insert(this.options.label);
        if (this.options.mandatory && !this.options.visualOpt) {
            this._labelElement.insert("");
        }

        var content = this.options.displayFormat.evaluate({ text: this.options.text, value: this._formattedValue(this.options) });

        if (Object.isEmpty(this.options.value)) {
            content = content.gsub(" " + global.idSeparatorLeft + global.idSeparatorRight, '');
        }
        if (content.startsWith(" " + global.idSeparatorLeft) && content.endsWith(global.idSeparatorRight))
            content = content.substring(2, content.length - 1);
        this._moduleElement = new Element("div", {
            "class": "fieldDispFloatLeft",
            "id": this.options.appId + '_' + this.options.screen + '_' + this.options.record + '_' + this.options.id
        }).insert(content);

        // No label should be added if the field is a tcontent one
        //if (!this._isTContent(this.options))
        this._element.insert(this._labelElement);

        this._element.insert(this._moduleElement);
    }
},

/* 
* @method _isTContent
* @desc Checks if a field is a tcontent one
* @param options Field's options
* @return true if the field is a tcontent one, false otherwise
*/

_isTContent: function(options) {
    return !Object.isEmpty(options.optionsJSON.settings['@fieldsource'])
        && (options.optionsJSON.settings['@fieldsource'].toLowerCase() == 't');
},

/* @method _formattedValue
* @desc Returns a formatted value according to its type
* @param Options JSON options
* @return The formatted value
*/

_formattedValue: function(options) {

    var hour;
    var min;

    if (!Object.isEmpty(options) && !Object.isEmpty(options.value)) {

        if (options.type == "TIMS") {
            if (options.value.include(':')) {
                var time = options.value.split(':');
                fValue = time[0] + ":" + time[1];
            } else {
                hour = options.value.substring(0, 2);
                min = options.value.substring(2, 4);
                fValue = hour + ":" + min;
            }
        }
        else {
            fValue = options.value;
        }
    }
    else
        fValue = "";

    return fValue;

},

checkDate: function(options) {

    var dateOK = false;

    if ((options.objectType == 'D') || (options.fieldFormat == "P"))
        dateOK = true;

    return dateOK;
},
/**
* Prepare the layout for the field displayer
*/
_setLayout: function() {
    this.mandatoryIndicator = new Element('span', {
        'class': 'fieldDispMandatoryIndicator application_main_soft_text fieldDispFloatLeft'
    });
    this.mandatoryIndicator.insert('*');
    if (this.options.outputOnly) {
        this._element = new Element("div", {
            "class": "fieldWrapDisplayMode fieldClearBoth fieldDispFloatLeft"
        });
        this._labelElement = new Element("div", {
            "class": "fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text",
            "title": this.options.label
        });
    } else {
        if (this.options.optionsJSON.settings['@depend_type'] == 'X' || this.options.optionsJSON.settings['@depend_type'] == 'V') {
            this._element = new Element("div", {
                "class": "fieldWrap fieldDispFloatLeft __there"
            });
            this._labelElement = new Element("div", { // TO REFACTOR: this labelElement case is exactly the same as here above in the "this.options.outputOnly" case.
                "class": "fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text",
                "title": this.options.label
            });
        } else {
            this._element = new Element("div", {
                "class": "fieldWrap fieldDispFloatLeft __here",
                "id": this.options.id + '_' + this.options.appId + '_' + this.options.screen + '_' + this.options.record
            });
            this._labelElement = new Element("div", {
                "class": "fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text",
                "title": this.options.label
            });
        }
    }
    if ((this.options.mandatory && !this.options.visualOpt) && this.options.outputOnly) {
        this._labelElement.insert("  (*)");
    }
    if (this._labelElement)
        this._labelElement.insert(this.options.label);
    this._moduleElement = new Element("div", {
        "class": "fieldDispFloatLeft fieldDispField",
        "id": this.options.appId + '_' + this.options.screen + '_' + this.options.record + '_' + this.options.id
    });
    if (this._labelElement)// && !this._isTContent(this.options))
        this._element.insert(this._labelElement);

    this._element.insert(this._moduleElement);
    if ((this.options.mandatory && !this.options.visualOpt) && !this.options.outputOnly) {
        this._element.insert(this.mandatoryIndicator);
    }
    else {
        this.mandatoryIndicator.update("&nbsp");
        this._element.insert(this.mandatoryIndicator);
    }
},
/**
* Initializes the module needed for the field displayer (if any).
* //REFACTOR: this function is no longer used (but it's used the one from the child Classes)
*/
_initializeModule: function() {

},

/**
* Gets the values of the field, if it has a service associated
*/
getFieldValues: function() {
    //Just get the values if we're not in display mode, and the fieldType is one that actually can get the values
    //TODO: If there are fields that depend on a radio button or a check box?
    if (this.options.mode != "display" || this.options.fieldType == 'fieldTypeRadioButton' ||
		this.options.fieldType == 'fieldTypeCheckBox' || this.options.fieldType == 'fieldTypeBubble' ||
		this.options.fieldType == 'fieldTypeImage') {

        //If the field is going to ask for values and is not of a kind of fields that can't gent values:
        if ((this._getFieldValuesSuccess && this.options.valueListService && (this.options.fieldType != 'fieldTypeText') && (this.options.fieldType != 'fieldTypeOutput'))) {
            this._getFieldValues(this.getDependencyInfo());
        } else {
            //If the field is not going to ask for values, ask for the values of the fields that depend on it:
            this.getValuesDependantFields();
            this._firstTimeGettingValue = false; //Indicate that this is no longer its first time to get values
        }
    }
},


/**
* Function to get information about dependency: it's a hash that contains:
* - fieldid: the id of the field it depends on
* - fieldtechname: the techname of the field it depends on
* - value: the value of the field it depends on
* - nestedDep: this information, but about the field it depends on, called recursively
*
* This information is used to create the XML to look for values
*/
getDependencyInfo: function() {
    if (Object.isEmpty(this.parentField)) {
        return null;
    } else {
        var parentFieldDependency = this.parentField.getDependencyInfo();
        var dependencyInfo = $H({
            "fieldid": this.parentField.options.id,
            "fieldtechname": this.parentField.options.techName,
            "value": Object.isEmpty(this.parentField.getValue().id) ? "" : this.parentField.getValue().id,
            "nestedDep": parentFieldDependency
        });
        return dependencyInfo;
    }
},
/**
* Obtains the Element object ready to be inserted in any container.
* @return {Element} returns the Element object with the field displayer.
*/
getHtml: function() {
    return this._element;
},
//METHODS TO GET VALUES FROM SAP
//***********************************************************************************************************************************************
/**
* Makes a request to the service specified in options to get the values for the field.
* @param {Object} event
* @param {Object} xmlin If we want to use a different xmlin than the default
*/
_getFieldValues: function(depFieldInfo, xmlin) {
    if (Object.isEmpty(xmlin)) {
        //If we didn't set an alternative xmlin
        this.makeAJAXrequest($H({
            xml: this._getXMLIn(depFieldInfo),
            successMethod: this._getFieldValuesSuccess.bind(this)
        }));


    } else {
        //If we set an alternative xmlin
        this.makeAJAXrequest($H({
            xml: xmlin,
            successMethod: this._getFieldValuesSuccess.bind(this)
        }));
    }
},
/**
* It handles the success response from the request made in _getFieldValues method.
* @param {JSON} response the response from the service.
*/
_getFieldValuesSuccess: function() {
    if (this.options.cssClasses && Object.isHash(this.options.cssClasses)) {
        this.options.cssClasses.each(function(cssClass) {
            var a = 0;
            this._element.descendants().each(function(element) {
                if (element.hasClassName(cssClass.key)) {
                    element.removeClassName(cssClass.key);
                    element.addClassName(cssClass.value);
                }
            } .bind(this));
        } .bind(this));
    }
},
/**
* It generates the XML needed to make a request to a service to get the value list for
* the field displayer
* @param {String} dependencyField the field on which this one depends' id
* @return {String} The String with the XML to make a request to the service.
*/
_getXMLIn: function(depFieldsInfo) {
    var depFields = "";
    var depField = "";
    if (!Object.isEmpty(depFieldsInfo)) {
        depFields = '<FIELD FIELDID="' + depFieldsInfo.get('fieldid') + '" FIELDTECHNAME="' + depFieldsInfo.get('fieldtechname') + '" VALUE="' + depFieldsInfo.get('value') + '" />';
        while (depFieldsInfo.get('nestedDep')) {
            depFields += '<FIELD FIELDID="' + depFieldsInfo.get('nestedDep').get('fieldid') + '" FIELDTECHNAME="' + depFieldsInfo.get('nestedDep').get('fieldtechname') + '" VALUE="' + depFieldsInfo.get('nestedDep').get('value') + '" />';
            depFieldsInfo = depFieldsInfo.get('nestedDep');
        }
    }
    //build the service request if there's not a customized one
    if (!this.options.customXmlIn || !this.options.customXmlIn.get(this.options.id)) {
        //Check if we have something to add to the XML
        var xmlToAppend = "";
        if (!Object.isEmpty(this.options.getFieldValueAppend)) {
            xmlToAppend = this.options.getFieldValueAppend;
        }

        var oType = !Object.isEmpty(this.options.objectType) ? this.options.objectType : "";
        var oId = !Object.isEmpty(this.options.objectId) ? this.options.objectId : "";
        var appId = !Object.isEmpty(this.options.appId) ? this.options.appId : "";
        var strKey = !Object.isEmpty(this.options.keyStr) ? this.options.keyStr : "";
        var screenId = !Object.isEmpty(this.options.screen) ? this.options.screen : "";
        var jsonIn = '<EWS>' +
            '<SERVICE>' + this.options.valueListService + '</SERVICE>' +
            '<OBJECT TYPE="' + oType + '">' + oId + '</OBJECT>' +
            '<PARAM>' +
            '<APPID>' + appId + '</APPID>' +
            '<WID_SCREEN>' + screenId + '</WID_SCREEN>' +
            '<STR_KEY>' + strKey + '</STR_KEY>' +
            '<FIELD FIELDID="' + this.options.id + '" FIELDTECHNAME="' + this.options.techName + '" VALUE="" /> ' +
            '<DEP_FIELDS>' +
            depFields +
            '</DEP_FIELDS>' +
            '<SEARCH_PATTERN />' +
			xmlToAppend +
            '</PARAM>' +
            '</EWS>';

        return jsonIn;
    }
    //use the customized request to the service according to its format
    else if (Object.isString(this.options.customXmlIn)) {
        return this.options.customXmlIn;
    } else {
        if (Object.isString(this.options.customXmlIn.get(this.options.id)))
            return this.options.customXmlIn.get(this.options.id);
        else
            return json2xml.writeXML(this.options.customXmlIn.get(this.options.id));
    }
},
//METHODS TO MODIFY AND HANDLE JSON INTERACTION
//***********************************************************************************************************************************************
/**
* It updates the fieldDisplayer related piece of JSON.
* @param {Object (id:'string',text:'string')} The values to be inserted.
*/
updateJSON: function(val) {
    var changed = false;
    switch (this.options.optionsJSON.settings['@show_text']) {
        case 'I':
        case 'B':
            //saving both
            if (!Object.isEmpty(this.jsonInsertion.get(this.options.fieldType).id)) {
                if (this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).id] != val.id) {
                    //If both are null, then it should not change the value, and should not mark as "changed"
                    if (!Object.isEmpty(this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).id]) || !Object.isEmpty(val.id)) {
                        this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).id] = val.id;
                        changed = true;
                    }
                }
            }
            if (!Object.isEmpty(this.jsonInsertion.get(this.options.fieldType).text)) {
                if (this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).text] != val.text) {
                    //If both are null, then it should not change the text, and should not mark as "changed"
                    if (!Object.isEmpty(this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).text]) || !Object.isEmpty(val.text)) {
                        if (!Object.isEmpty(val.text)) {
                            this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).text] = val.text.escapeHTML().gsub("'", '&#39;').gsub('"', '&#34;');
                        } else {
                            this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).text] = val.text;
                        }
                        changed = true;
                    }
                }
            }
            break;
        case 'X':
            //saving text
            if (this.options.optionsJSON.values['#text'] != val.text) {
                //If both are null, then it should not change the text, and should not mark as "changed"
                if (!Object.isEmpty(this.options.optionsJSON.values['@text']) || !Object.isEmpty(val.text)) {
                    if (!Object.isEmpty(val.text)) {
                        this.options.optionsJSON.values['#text'] = val.text.escapeHTML().gsub("'", '&#39;').gsub('"', '&#34;');
                    } else {
                        this.options.optionsJSON.values['#text'] = val.text;
                    }
                    changed = true;
                }
            }
            break;
        default:
            //When it's a decimal number, or a currency number we make sure the format is correct:
            if (!Object.isEmpty(val.id)) {
                if ((this.options.type == "DEC" || this.options.type == "CURR") && displayToLong(val.id).toString() != "NaN") {
                    val.id = val.id.gsub(global.thousandsSeparator, '').gsub(global.commaSeparator, '.');
                    if (val.id.split('.')[1]) {
                        var decimalLong = val.id.split('.')[1].length;
                        dispMode = longToDisplay(parseFloat(val.id, 10), decimalLong);
                    }
                    else {
                        dispMode = longToDisplay(parseFloat(val.id, 10));
                    }
                    val.id = displayToLong(dispMode);
                }
            }
            //saving value
            if (this.options.optionsJSON.values['@value'] != val.id) {
                //If both are null, then it should not change the value, and should not mark as "changed"
                if (!Object.isEmpty(this.options.optionsJSON.values['@value']) || !Object.isEmpty(val.id)) {
                    this.options.optionsJSON.values['@value'] = val.id;
                    changed = true;
                }
            }
    }
    return changed;
},
_setOnChange: function(element, event) {
    if (Object.isEmpty(event)) event = 'change';
    if (!Object.isEmpty(element)) {
        if (Object.isElement(element)) {
            this._registerEvent(event, this._onFieldChange.bind(this, true), element);
        } else if (Object.isString(element)) {
            this._registerEvent(element, this._onFieldChange.bind(this, true));
        }
    } else {
        this._registerEvent(event, this._onFieldChange.bind(this, true), this._element);
    }
},
getValue: function() {
    return {
        id: this.idGetter(),
        text: this.textGetter()
    };
},
_setHowToGetValue: function(param) {
    if (!Object.isEmpty(param)) {
        var showText = this.options.optionsJSON.settings['@show_text'];
        if (Object.isEmpty(showText) || (showText == 'B') || (showText == 'I'))
            this.idGetter = param.id;
        if ((showText == 'B') || (showText == 'I') || (showText == 'X'))
            this.textGetter = param.text;
    }
},
idGetter: function() {
    return this.options.value
},
textGetter: function() {
    return this.options.text
},

//METHODS TO HANDLE EVENT INTERACTION
//***********************************************************************************************************************************************
/**
* It catches the field changed event.
* @param {Object} throwPaiEvent
* @param {Object} forceChanged
*/
_onFieldChange: function(throwPaiEvent, forceChanged) {
    if (Object.isEmpty(forceChanged) || (typeof forceChanged) != "boolean") {
        forceChanged = false;
    }
    var value = this.getValue();
    var changed = this.updateJSON(value);
    //Fix to avoid calling SAP when it's not neccesary
    if (!changed && !forceChanged) {
        //If it's the first time, but the value doesn't change, we make sure it counts as first time grtting value:
        this._firstTimeGettingValue = false;
        return;
    }
    if (throwPaiEvent && !Object.isEmpty(this.options.optionsJSON.settings['@service_pai'])) {
        var obj = {
            appId: this.options.appId,
            screen: this.options.screen,
            record: this.options.record,
            mode: this.options.mode,
            servicePai: this.options.optionsJSON.settings['@service_pai'],
            currentValue: value,
            fieldId: this.options.id
        };
        if (changed && !this._firstTimeGettingValue) {
            global.focusFieldID = {
                appId: this.options.appId,
                screen: this.options.screen,
                mode: this.options.mode,
                id: this.options.id,
                record: this.options.record
            };
            //If the field is inside a tContent, a different pai will be fired.
            if (this._isTContent(this.options)) {
                obj.rowSeqnr = this.options.rowSeqnr;
                document.fire('EWS:getContentModule_tContentPaiEvent_' + this.options.appId + this.options.name + this.options.randomId, obj);
            } else {
                document.fire('EWS:getContentModule_paiEvent_' + this.options.appId + this.options.name + this.options.randomId, obj);
            }
        }
    }
    if (!this._checkValidFormat()) {
        this.setInvalid();
    } else {
        this.setValid();
    }
    if (this.options.fieldDisplayerModified && changed)
        document.fire(this.options.fieldDisplayerModified, { field: this, value: value, first: this._firstTimeGettingValue, screen: this.options.screen, record: this.options.record, fieldName: this.options.id, type: this.options.fieldType });

    this._firstTimeGettingValue = false; //Indicate that this is no longer its first time to get values
    this.getValuesDependantFields();
    if (!Object.isEmpty(this.options.rechargeAll))
        if (this.options.rechargeAll)
        this.setRecharge(value);
    if (!Object.isEmpty(this.options.variant.get(this.options.appId + '_' + this.options.screen))) {
        if (this.options.variant.get(this.options.appId + '_' + this.options.screen).variantId == this.options.id && changed) {
            this.manageVariant(value);
        }
    }
},
manageVariant: function(value) {
    var type = this.options.variant.get(this.options.appId + '_' + this.options.screen).variantType;
    if (type == 'S') {
        //document.fire('EWS:variantS_' + this.options.appId, { 'variant': this.options.variant, objType: this.options.objectType, objId: this.options.objectId, record: this.options.record, screen: this.options.screen, keyStr: this.options.keyStr });
        this.options.FPObject.manageVariantService({ 'variant': this.options.variant, objType: this.options.objectType, objId: this.options.objectId, record: this.options.record, screen: this.options.screen, keyStr: this.options.keyStr, mode: this.options.mode });
    }
    else if (type == 'F') {
        var value = value.id;
        this.options.FPObject.manageVariantValue(this.options.record, this.options.screen, this.options.mode, this.options.keyStr, null, value);
    }
},

setRecharge: function(value) {
    var oldValue = this.options.value;
    var oldText = this.options.text;
    var selectedEmployee = global.getSelectedEmployees().first();
    var loggedEmployee = global.objectId;
    var userLanguage = global.userLanguage;
    if (((oldText != value.text) || (oldValue != value.id)) && (selectedEmployee == loggedEmployee) && (userLanguage == '2'))
        global.reloadEWS = true;
    else
        global.reloadEWS = false;
},
/**
* Calls to getFieldValues for all the fields that depend on it.
*/
getValuesDependantFields: function() {
    //Loop through the dependant fields, calling getFieldValues for them
    if (!Object.isEmpty(this.dependantFields)) {
        var dependantFieldsKeys = this.dependantFields.keys();
        for (var i = 0; i < dependantFieldsKeys.size(); i++) {
            this.dependantFields.get(dependantFieldsKeys[i]).options.updateValue = true;
            this.dependantFields.get(dependantFieldsKeys[i]).getFieldValues();
        }
    }
},

/**
* Observes the given event on an element. If no element is given the event is observed on document.
* @param {String} eventName the name of the event to be observed.
* @param {Function} handler the handler function.
* @param {Element} (Optional) The Element object which will listen to the event. Will use document if it's not specified
*/
_registerEvent: function(eventName, handler, element) {
    //if the element isn't specified we take document
    if (Object.isUndefined(element)) {
        //observe the event
        document.observe(eventName, handler);
        //and store it
        this._events.set(eventName, {
            handler: handler,
            element: document
        });
    }
    //if specified we take the element given as argument
    else {
        element.observe(eventName, handler);
        this._events.set(eventName, {
            handler: handler,
            element: element
        });
    }
},
/**
* Stop observing all the events which're being listened by this field displayer.
*/
_stopObserve: function() {
    if (this._events)
        this._events.each(function(event) {
            var element = event.value.element;
            var handler = event.value.handler;
            var eventName = event.key;
            element.stopObserving(eventName, handler);
        });

    this._events = $H();
},
//GENERAL METHODS
//***********************************************************************************************************************************************
setInvalid: function() {
    //temporal invalid style
    this._element.addClassName('fieldError');
    if ($('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record))
        $('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record).show();
},
setValid: function() {
    //temporal valid style
    if (this._element) {
        this._element.removeClassName('fieldError');
        if ($('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record))
            $('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record).hide();
    }
},
/**
* Puts focus on the fieldDisplayer
* Should be overriden for fieldDisplayers that need to implement it
*/
setFocus: function() {
},
/**
* Checks if this field has valid values according to the options.
* @returns Boolean true when valid format, false otherwise.
*/
_checkValidFormat: function() {
    return Prototype.emptyFunction();
},
/**
* Destroys a field displayer by stopObserving all its events and removing its container.
*/
destroy: function(html) {
    this._stopObserve();
    if (Object.isEmpty(html)) {
        if (this._element && this._element.parentNode) {
            this._element.remove();
            delete this._element;
        }
    }
    else {
        this._element.parentNode.update(html);
    }
},
/**
* Test the validity of a field displayer data.
* @return {Boolean} true when valid, false if it's not valid.
*/
isValid: function() {
    return this._checkValidFormat();
},

/**
* Sets the fields that depend on that field (only logical dependence)
* @param {Object} dependantField
*/
setDependantFields: function(dependantField) {
    this.dependantFields = dependantField;
},

/**
* Sets the field that this field depends on
* @param {Object} parentField
*/
setParentField: function(parentField) {
    this.parentField = parentField;
}

});

/**
* fieldTypeAutocompleter will return a FieldDisplayer object representing an autocompleter.
* @constructor
* @augments FieldDisplayer
*/
var fieldTypeAutocompleter = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeAutocompleter
*/
{
initialize: function($super, options) {
    if (Object.isEmpty(options.valueListService)) {
        //setting 'get_field_val' as default service, since all the selectboxes need one service
        options.valueListService = "GET_FIELD_VAL";
    }
    $super(options);
},
/**
* Takes the values for the autocompleter from the service.
*/
_getFieldValuesSuccess: function($super, response) {
    var valuesList = {
        autocompleter: {
            object: $A()
        }
    };
    this._moduleInstance.clearInput();
    if (response.EWS.o_values) {
        objectToArray(response.EWS.o_values.item).each(function(item) {
            valuesList.autocompleter.object.push({
                "data": item["@id"],
                "text": item["@value"]
            });
        } .bind(this));
    }
    this._moduleInstance.updateInput(valuesList);
    if (!Object.isEmpty(this.options.value)) {
        this._moduleInstance.setDefaultValue(this.options.value, false, false);
        if (Object.isEmpty(this.options.onChangeEvent) || this._firstTimeGettingValue || this.options.updateValue) {//in order to avoid that an autocompleter will block the page refreshing the page without end.
            this.options.updateValue = false;
            this._onFieldChange(true, true);
        }
    }
    else {
        if (!Object.isEmpty(this.options.text)) {
            this._moduleInstance.setDefaultValue(this.options.text, true, false);
            if (Object.isEmpty(this.options.onChangeEvent) || this._firstTimeGettingValue || this.options.updateValue) {//in order to avoid that an autocompleter will block the page refreshing the page without end.
                this.options.updateValue = false;
                this._onFieldChange(true, true);
            }
        }
        else {
            //if (this._firstTimeGettingValue)
            this._onFieldChange(true, true);
        }
    }
    this._moduleInstance.stopLoading();
    //If the response does not include all the results, then the autocompleter has to call the service for future searches
    if(response.EWS.o_max_num_exceeded == 'X') {
        this._moduleInstance.setSearchWithService(true);
        //Setting the XML for the autocompleter that is to be sent to backend for searches
        var xmlin = this._getXMLIn(this.getDependencyInfo());
        this._moduleInstance.setXmlToSend(xmlin);
    }
    else
        this._moduleInstance.setSearchWithService(false);
    //method commented, since it deletes the values of all the autompleters in the json when
    //ANY interaction with the user is done
    //this._onFieldChange(false);
    this.setValid();
    $super(response);
    if(this.needsFocus) {
        if(!Object.isEmpty(this._moduleInstance) &&
           !Object.isEmpty(this._moduleInstance.element)) {
            this._moduleInstance.element.focus();
            if (Prototype.Browser.IE) {
                this._moduleInstance.element.focus();
            }
        }
        this.needsFocus = false;
    }
},
/**
* Initializes the autocompleter
*/
_initializeModule: function($super) {
    var json = {
        autocompleter: {
            object: $A()
        }
    };
    //Setting the XML for the autocompleter that is to be sent to backend for searches
    var xmlin = this._getXMLIn(this.getDependencyInfo());
    this._moduleInstance = new JSONAutocompleter(this._moduleElement, {
        showEverythingOnButtonClick: true,
        fireEventWhenDefaultValueSet: true,
        xmlToSend: xmlin,
        searchWithService: false,
        url: this.url,
        method: this.method,
        timeout: 500,
        templateResult: this.options.displayFormat.template,
        templateOptionsList: this.options.displayFormat.template,
        maxShown: 5,
        virtualVariables: true,
        events: $H({
            onResultSelected: 'EWS:autocompleter_resultSelected_' + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId,
            onDataLoaded: 'EWS:autocompleter_dataLoaded_' + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId
        })
    }, json);
    this._moduleInstance.loading();
    $super();
    this._moduleInstance.stopLoading.bind(this._moduleInstance).delay(3);
},
_setOnChange: function($super) {
    $super('EWS:autocompleter_resultSelected_' + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId);
},
_getFieldValues: function($super, depFieldInfo, xmlin){
    if((!Object.isEmpty(this.options.text) || !Object.isEmpty(this.options.value))) {
        var search = '';
        if(!Object.isEmpty(this.options.value))
            search = search + "<DEFAULT_VALUE>" + this.options.value.escapeHTML() + "</DEFAULT_VALUE>";
        if(!Object.isEmpty(this.options.text))
            search = search + "<DEFAULT_TEXT>" + this.options.text.escapeHTML() + "</DEFAULT_TEXT>";
        if(Object.isEmpty(xmlin))
            xmlin = this._getXMLIn(depFieldInfo);
        var xml = xmlin.replace('<SEARCH_PATTERN />', search + '<SEARCH_PATTERN />');
        $super(depFieldInfo, xml);
    } else {
        $super(depFieldInfo, xmlin);
    }
},
_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                if (!Object.isEmpty(this._moduleInstance.getValue()))
                    return this._moduleInstance.getValue().idAdded;
                else
                    return '';

            } .bind(this),
            text: function() {
                if (!Object.isEmpty(this._moduleInstance.getValue()))
                    return unescape(this._moduleInstance.getValue().textAdded);
                else
                    return '';
            } .bind(this)
        }
    $super(obj);
},
setFocus: function() {
    this.needsFocus = true;
    if(!Object.isEmpty(this._moduleInstance) &&
       !Object.isEmpty(this._moduleInstance.element) &&
       this._moduleInstance.enabled) {
        this._moduleInstance.element.focus();
        if (Prototype.Browser.IE) {
            this._moduleInstance.element.focus();
        }
    }
},
/**
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    if (this.options.mandatory && this._moduleInstance && (Object.isEmpty(this._moduleInstance.getValue()) || this._moduleInstance.getValue().isEmpty) && !this.options.visualOpt)
        return false;
    else
        return true;
}
});

/**
* fieldTypeBubble will return a FieldDisplayer object representing a color bubble.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeBubble = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeBubble
*/
{
/**
* Indexes the icon types according to the value given in the service
* @type Array
*/
ICON_TYPES: $A([
        "application_emptyBubble",
        "application_icon_red",
        "application_icon_orange",
        "application_icon_green"
        ]),

initialize: function($super, options) {
    $super(options);
},

/**
* Gets the class for the bubble icon from the icon types Array.
* @return {String} The class name if the value is correct. An empty String otherwise.
*/
_getBubbleClass: function() {
    var value = parseInt(this.options.value, 10);
    //Make sure the value is in the icons classes Array
    if (value >= this.ICON_TYPES.size()) {
        return "";
    }
    //return the class from the icons classes array
    else {
        return this.ICON_TYPES[value];
    }
},
/**
* Sets the bubble layout by using the original field displayer layout
* and giving it the proper class name
*/
_initializeModule: function($super) {
    this._moduleElement.addClassName(this._getBubbleClass);
    $super();
},
_checkValidFormat: function($super) {
    return true;
}
});

/**
* fieldTypecheckBox will return a FieldDisplayer object representing a checkBox.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeCheckBox = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypecheckBox
*/
{
initialize: function($super, options) {
    $super(options);
},
/**
* Initializes the check box
*/
_initializeModule: function($super) {
    //Main container, The checkBoxes will be placed here
    this._checkBoxesContainer = new Element('div', {});
    //Inserting the container on the parent element container
    this._moduleElement.update(this._checkBoxesContainer);
    if (Object.isEmpty(this.options.valueListService))
        this._createSingleComponent();
    else
        this._getFieldValues();
    var value = this.getValue();
    var changed = this.updateJSON(value);
    $super();
},
_getFieldValuesSuccess: function($super, response) {
    //Getting the field values from the response
    if (response.EWS.o_values && response.EWS.o_values.item) {
        this._checkBoxesContainer.update('');
        //Converting the object into an array just in case we have one record
        var values = objectToArray(response.EWS.o_values.item);
        //Going throught all the results
        values.each(function(_elem) {
            //Creating the checkBox element
            var checkBoxElement = new Element('input', {
                type: 'checkbox',
                name: _elem['@id'],
                disabled: (this.options.mode == this.DISPLAY_MODE) ? 'disabled' : ''
            });
            //Creating the item container
            var checkBoxSpan = new Element('span', {});
            checkBoxSpan.insert(_elem['@value']);
            //Inserting label and checkbox in an element
            var checkBoxContainer = new Element('div', {});
            checkBoxContainer.insert(checkBoxElement);
            checkBoxContainer.insert(checkBoxSpan);
            //Inserting the whole generated element in the parent container
            this._checkBoxesContainer.insert(checkBoxContainer)
            if (_elem['@default_value'] && (_elem['@default_value'] == 'X' || _elem['@default_value'] == 'Yes'))
                checkBoxElement.checked = true;
        } .bind(this));
        $super(response);
            if(this.needsFocus) {
                if(!Object.isEmpty(this._checkBoxesContainer) &&
                   !Object.isEmpty(this._checkBoxesContainer.down())) {
                    this._checkBoxesContainer.down().focus();
                    if (Prototype.Browser.IE) {
                        this._checkBoxesContainer.down().focus();
                    }
                }
                this.needsFocus = false;
            }
    }
    else
        return;
},
_createSingleComponent: function() {
    this._singleComponent = true;
    var disabled = (this.options.mode == this.DISPLAY_MODE || this.options.optionsJSON.settings['@display_attrib'] == 'OUO') ? true : false
    var checkBoxElement = new Element('input', {
        type: 'checkbox',
        disabled: disabled
    });
    this._checkBoxesContainer.insert(checkBoxElement);
    if(this.options.optionsJSON.settings['@show_text'] == 'X') {
        if (!Object.isEmpty(this.options.text) && (this.options.text == 'X' || this.options.text == 'Yes'))
            checkBoxElement.checked = true;
    } else {
        if (!Object.isEmpty(this.options.value) && (this.options.value == 'X' || this.options.value == 'Yes'))
            checkBoxElement.checked = true;
    }
    },
    setFocus: function() {
        this.needsFocus = true;
        if(!Object.isEmpty(this._checkBoxesContainer) &&
           !Object.isEmpty(this._checkBoxesContainer.down())) {
            this._checkBoxesContainer.down().focus();
            if (Prototype.Browser.IE) {
                this._checkBoxesContainer.down().focus();
            }
    }
},
/**
* @description Checks the field format
* @param $super Parent function
*/
_checkValidFormat: function($super) {
    return true;
},
_setOnChange: function($super) {
    if (this._singleComponent)
        $super(this._checkBoxesContainer.down(), 'click');
    else
        $super(this._checkBoxesContainer, 'click');
},
_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                if (this._singleComponent) {
                    var checked = (this._checkBoxesContainer.down().checked) ? 'X' : '';
                    return checked;
                } else {
                    var value = $A();
                    $A(this._checkBoxesContainer.childNodes).each(function(item) {
                        if (item.firstChild.checked)
                            value.push(item.firstChild.getAttribute('name'));
                    });
                    return value;
                }
            } .bind(this),
            text: function() {
                if (this._singleComponent) {
                    var checked = (this._checkBoxesContainer.down().checked) ? 'X' : '';
                    return checked;
                } else {
                    var value = $A();
                    $A(this._checkBoxesContainer.childNodes).each(function(item) {
                        if (item.firstChild.checked)
                            value.push(item.firstChild.getAttribute('name'));
                    });
                    return value;
                }
            } .bind(this)
        }
    $super(obj);
}
});

/**
* fieldTypeDate will return a FieldDisplayer object representing a select box.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeDate = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeDate
*/
{
//To keep track of the validity of the Date
correctDate: false,
initialize: function($super, options) {
    $super(options);
    //This is to make sure that if we have a value, it gets to the json
    this._updateJSONDate();
    this.setValid();
},
/**
* Initializes the date picker
*/
_initializeModule: function($super) {
    //Changing the default date format for the defaultDate variable of the datepicker
    var date = null;
    if (!Object.isEmpty(this.options.value) && this.options.value != '0000-00-00') {
        date = this.options.value.gsub("-", "");
    }
    //Observes the event that is fired when a field of the date picker is blurred, so we update the JSON
    this._registerEvent('EWS:datePickerCorrectDate_' + this.options.id + '_' + this._id + '_' + this.options.appId + this.options.screen + this.options.record + this.options.randomId, this._correctDate.bind(this));
    this._registerEvent('EWS:datePickerWrongDate_' + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId, this._wrongDate.bind(this));
    this._moduleInstance = new DatePicker(this._moduleElement, {
        emptyDateValid: !this.options.mandatory,
        correctDateOnBlur: true,
        fireEventOnInitialize: true,
        defaultDate: date,
        events: $H({
            correctDate: 'EWS:datePickerCorrectDate_' + this.options.id + '_' + this._id + '_' + this.options.appId + this.options.screen + this.options.record + this.options.randomId,
            wrongDate: 'EWS:datePickerWrongDate_' + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId
        })
    });
    $super();
},
_setValue: function($super, value) {
    var date;
    if (!Object.isEmpty(value)) {
        date = Date.parseExact(value, ['yyyy-MM-dd', 'yyyy-MM-dd']);

    this._moduleInstance.setDate(date);
    }
},
/**
* Updates the correctDate variable to reflect the changes of the datePicker
*/
_correctDate: function() {
    this.correctDate = true;
    this._onFieldChange(true, true);
},
/**
* Updates the JSON and the correctDate variable to reflect the changes of the datePicker
*/
_wrongDate: function() {
    this.correctDate = false;
    this._onFieldChange(false);
},
/**
* Updates the JSON with the current value
*/
_updateJSONDate: function() {
    var value = this.getValue();
    this.updateJSON(value);
},
_checkValidFormat: function($super) {
    if (this._moduleInstance && !this.correctDate && !this.options.visualOpt)
        return false;
    else
        return true;
},
setFocus: function() {
    if (!Object.isEmpty(this._moduleInstance) && !Object.isEmpty(this._moduleInstance.dayField)) {
        this._moduleInstance.dayField.focus();
        if (Prototype.Browser.IE) {
            this._moduleInstance.dayField.focus();
        }
    }
},
_setOnChange: function($super) {
},

_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                if (this._moduleInstance.actualDate) {
                    return this._moduleInstance.actualDate.toString("yyyy-MM-dd");
                }
                if(this._moduleInstance.dateIsEmpty()) {
                    return '';
                } else
                    return this._moduleInstance.yearField.value + '-' + this._moduleInstance.monthField.value + '-' + this._moduleInstance.dayField.value;
            } .bind(this),
            text: function() {
                if(this._moduleInstance.dateIsEmpty()) {
                    return '';
                } else
                    return this._moduleInstance.yearField.value + '-' + this._moduleInstance.monthField.value + '-' + this._moduleInstance.dayField.value;
            } .bind(this)
        }
    $super(obj);
},


_formattedValue: function(options) {

    return (!Object.isEmpty(options) && !Object.isEmpty(options.value)) ? sapToDisplayFormat(options.value) : "";
}

});

/**
* fieldTypeHidden will return a FieldDisplayer hidden (no graphical representation)
* @constructor
* @augments fieldTypeHidden
*/
var fieldTypeHidden = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeHidden
*/
{
_setLayout: function() {
    this._element = new Element("div");
},
_initializeModule: function() {
    var depValue = !Object.isEmpty(this.options.value) ? this.options.value : this.options.optionsJSON.settings['@default_value'];
    document.fire("EWS:fieldChanged_" + this.options.techName + this.options.appId + this.options.screen + this.options.record + this.options.randomId, $H({
        fieldid: this.options.id,
        fieldtechname: this.options.techName,
        value: depValue
    }));
    this._lastValueSelected.set(this.options.techName + this.options.appId + this.options.screen + this.options.record, $H({
        fieldid: this.options.id,
        fieldtechname: this.options.techName,
        value: depValue
    }));
    if (this.options.techName != this.options.id) {
        //in PFM, it is taken into account the fieldId for dependencies, instead of the fieldTechName
        document.fire("EWS:fieldChanged_" + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId, $H({
            fieldid: this.options.id,
            fieldtechname: this.options.techName,
            value: depValue
        }));
        this._lastValueSelected.set(this.options.id + this.options.appId + this.options.screen + this.options.record, $H({
            fieldid: this.options.id,
            fieldtechname: this.options.techName,
            value: depValue
        }));
    }
    if (this.options.mode != 'edit') {
        if (Object.isEmpty(this.options.optionsJSON.values['@value']) && Object.isEmpty(this.options.optionsJSON.values['#text'])) {
            text = !Object.isEmpty(this.options.optionsJSON.settings['@default_text']) ? this.options.optionsJSON.settings['@default_text'] : '';
            id = !Object.isEmpty(this.options.optionsJSON.settings['@default_value']) ? this.options.optionsJSON.settings['@default_value'] : '';
            var changed = this.updateJSON({
                id: id,
                text: text
            })
        }
    }
    else {
        if (Object.isEmpty(this.options.optionsJSON.values['@value'])) {
            id = '';
        }
        else {
            id = this.options.optionsJSON.values['@value'];
        }

        if (Object.isEmpty(this.options.optionsJSON.values['#text'])) {
            text = '';
        }
        else {
            text = this.options.optionsJSON.values['#text'];
        }
    }
},
_checkValidFormat: function($super) {
    return true;
},
_getFieldValues: function() {
    this._onFieldChange(false, true);
    return Prototype.emptyFunction();
}
});

/**
* fieldTypeHour will return a FieldDisplayer a time entry field
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeHour = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeHour
*/
{
initialize: function($super, options) {
    $super(options);
    //This is to make sure that if we have a value, it gets to the json
    var value = this.getValue();
    this.updateJSON(value);
    this.setValid();
},

/**
* Initializes the hour field properly.
*/
_initializeModule: function($super) {
    this._moduleInstance = new HourField(this._moduleElement, {
        viewSecs: 'no',
        format: "24",
        defaultTime: (!Object.isEmpty(this.options.value)) ? this.options.value.gsub(':', '') : '000000',
        events: $H({
            //onCorrectTime: 'EWS:hourfield_correct_' + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId,
            onCorrectTime: 'EWS:hourfield_correct_' + this.options.id + '_' + this._id + '_' + this.options.appId + this.options.screen + this.options.record + this.options.randomId,
            onIncorrectTime: 'EWS:hourfield_incorrect_' + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId
        })

    });
    var value = this.getValue();
    var changed = this.updateJSON(value);
    $super();
},
    setFocus: function() {
        if(!Object.isEmpty(this._moduleInstance) && !Object.isEmpty(this._moduleInstance.contentHour)) {
            this._moduleInstance.contentHour.focus();
            if (Prototype.Browser.IE) {
                this._moduleInstance.contentHour.focus();
            }
        }
    },
/**
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    return true;
},
_setOnChange: function($super) {
    $super('EWS:hourfield_correct_' + this.options.id + '_' + this._id + '_' + this.options.appId + this.options.screen + this.options.record + this.options.randomId);
},
_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                return this._moduleInstance.getSapTime();
            } .bind(this),
            text: function() {
                return this._moduleInstance.getSapTime();
            } .bind(this)
        }
    $super(obj);
}
});

/**
* fieldTypeImage will return a FieldDisplayer object representing an image
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeImage = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeImage
*/
{
initialize: function($super, options) {
    $super(options);
},

/**
* Creates the HTML element needed for the image.
*/
_setLayout: function($super) {
    //$super();
    //value will specify the URL to load the image
    if (this.options.value) {
        this._element = new Element("img", {
            "src": options.value,
            "border": 0
        });
    }
    //If the URL isn't specified give it a standard style.
    else {
        this._element.addClassName("application_noPicture");
    }
},
_checkValidFormat: function($super) {
    return true;
}
}
);



/**
* fieldTypeLinkToHandler will return a FieldDisplayer object representing an application link.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeLinkToHandler = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeLink
*/
{
initialize: function($super, options) {
    $super(options);
},
/**
* Creates the element and gives it the proper class name
*/
_setLayout: function($super) {
    $super();
    this._element = new Element("span", {
        "class": "application_action_link"
    }).update(this.options.label);
    if (this.options.handler && this.options.handler.get(this.options.id))
        this._element.observe('click', this.options.handler.get(this.options.id));
    else
        this._element.observe('click', this.defaultHandler);
},
/*
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    return true;
},
defaultHandler: function() {
    alert('This is the fieldTypeLinkToHandler default handler. You should pass the buttonsHandler option to the fieldsPanel constructor, using this field id as the hash key.');
}
});


/**
* fieldTypeLink will return a FieldDisplayer object representing an application link.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeLink = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeLink
*/
{
initialize: function($super, options) {
    $super(options);
},
/**
* Creates the element and gives it the proper class name
*/
_setLayout: function($super) {
    $super();
    this.element = new Element("a", {
        "class": "application_action_link",
        "href": this.options.value
    }).update(this.options.text);
},
/*
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    return true;
}
});

/**
* fieldTypeRadioButton will return a FieldDisplayer object representing a radio button.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeRadioButton = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeRadioButton
*/
{
/**
* @description Contains que parent DIV of the type where the radio buttons will be placed
* @type Prototype.Element
*/
_radioButtonContainer: null,
/**
* @description Initializes the field type
* @param $super The parent funciton
* @param options The field settings
*/
initialize: function($super, options) {
    $super(options);
},
/**
* @description Parses the JSON values and converts it into field values
* @param $super The parent class
* @param response The JSON response
*/
_getFieldValuesSuccess: function($super, response) {
    //Getting the field values from the response
    if (!Object.isEmpty(response.EWS.o_values) && !Object.isEmpty(response.EWS.o_values.item)) {
        //Converting the object into an array just in case we have one record
        var values = objectToArray(response.EWS.o_values.item);
        //Going throught all the results
        values.each(function(_elem, index) {
            //Creating the radio element
            var radioElement;
            var disabled = (this.options.mode == this.DISPLAY_MODE) ? 'disabled' : '';
            if ((Object.isEmpty(this.options.value) && (index == 0)) || (this.options.value == _elem['@id'])) {
                radioElement = "<input checked " + disabled + " type='radio' value='" + _elem['@id'] + "' name='" + this.options.id + this.options.appId + this.options.screen + this.options.record + "' />";
            } else {
                radioElement = "<input type='radio' " + disabled + " value='" + _elem['@id'] + "' name='" + this.options.id + this.options.appId + this.options.screen + this.options.record + "' />";
            }
            //Creating the item container
            var radioButtonSpan = new Element('span', {
                'class': 'fieldDisplayer_radioLabel'
            });
            //Inserting the radio button in the item container
            radioButtonSpan.insert(_elem['@value']);
            //Inserting the whole generated element in the parent container
            var container = new Element('div', {
                'class': 'fieldDispClearBoth fieldDispFloatLeft'
            });
            container.insert(radioElement);
            container.insert(radioButtonSpan);
            this._radioButtonContainer.insert(container);
        } .bind(this));
        if (this._firstTimeGettingValue) {
            var value = this.getValue();
            var changed = this.updateJSON(value);
        }
        this._firstTimeGettingValue = false;
        $super(response);
            if(this.needsFocus) {
                if(!Object.isEmpty(this._radioButtonContainer) &&
                   !Object.isEmpty(this._radioButtonContainer.firstChild) && 
                   !Object.isEmpty(this._radioButtonContainer.firstChild.firstChild)) {
                    this._radioButtonContainer.firstChild.firstChild.focus();
                    if (Prototype.Browser.IE) {
                        this._radioButtonContainer.firstChild.firstChild.focus();
                    }
                }
                this.needsFocus = false;
            }
    }
},
_initializeModule: function($super) {
    //Main container, The radio buttons will be placed here
    this._radioButtonContainer = new Element('div', {});
    //Inserting the container on the parent element container
    this._moduleElement.update(this._radioButtonContainer);
    $super();
    },
    setFocus: function() {
        this.needsFocus = true;
        if(!Object.isEmpty(this._radioButtonContainer) &&
           !Object.isEmpty(this._radioButtonContainer.firstChild) && 
           !Object.isEmpty(this._radioButtonContainer.firstChild.firstChild)) {
            this._radioButtonContainer.firstChild.firstChild.focus();
            if (Prototype.Browser.IE) {
                this._radioButtonContainer.firstChild.firstChild.focus();
            }
        }
},
/*
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    return true;
},
_setOnChange: function($super) {
    $super(this._radioButtonContainer, 'click');
},
_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                var checkedValue = '';
                var radios = objectToArray(this._radioButtonContainer.select('[name=' + this.options.id + this.options.appId + this.options.screen + this.options.record + ']'));
                if (!Object.isEmpty(radios) && (radios.size() > 0)) {
                    radios.each(function(r) {
                        if (r.checked) {
                            checkedValue = r.getValue();
                            return;
                        }
                    } .bind(this));
                    return checkedValue;
                } else {
                    return '';
                }
            } .bind(this),
            text: function() {
                var checkedValue = '';
                var radios = objectToArray(this._radioButtonContainer.select('[name=' + this.options.id + this.options.appId + this.options.screen + this.options.record + ']'));
                if (!Object.isEmpty(radios) && (radios.size() > 0)) {
                    radios.each(function(r) {
                        if (r.checked) {
                            checkedValue = r.getValue();
                            return;
                        }
                    } .bind(this));
                    return checkedValue;
                } else {
                    return '';
                }
            } .bind(this)
        }
    $super(obj);
}
});

/**
* fieldTypeSelectBox will return a FieldDisplayer object representing a select box.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeSelectBox = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeSelectBox
*/
{
/**
* The select box html element
* @type {Element}
*/
select: null,
initialize: function($super, options) {
    if (Object.isEmpty(options.valueListService)) {
        //setting 'get_field_val' as default service, since all the selectboxes need one service
        options.valueListService = "GET_FIELD_VAL";
    }
    $super(options);
},
/**
* Handles the response from the GET_FIELD_VALUES service to fill the select box.
* @param {JSON} response The response from the service.
*/
_getFieldValuesSuccess: function($super, response) {
    if (response.EWS.o_values) {
        if (!this.options.mandatory) {
            this.select.insert(new Element("option", {
                "value": "",
                "selected": true
            }));
        }
        objectToArray(response.EWS.o_values.item).each(function(item) {
            var selected = (item['@id'] == this.options.value) ? true : false;
            this.select.insert(new Element("option", {
                "value": item["@id"],
                "selected": selected
            }).insert(item["@value"]));
        } .bind(this));
        this._onFieldChange(false);
        this.setValid();
        $super(response);
    }

},
/**
* Initializes the select box with the proper options
*/
_initializeModule: function($super) {
    this.select = new Element("select", {
        "name": this._moduleElement.identify() + "_select"
    });
    this._moduleElement.insert(this.select);
    $super();
},
_setOnChange: function($super) {
    $super(this.select, 'change');
},
_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                if (this.select.selectedIndex != -1)
                    return (this.select.options[this.select.selectedIndex]).value;
                else
                    return null;
            } .bind(this),
            text: function() {
                if (this.select.selectedIndex != -1)
                    return (this.select.options[this.select.selectedIndex]).text;
                else
                    return null;
            } .bind(this)
        }
    $super(obj);
},
    setFocus: function() {
        if(!Object.isEmpty(this.select)) {
            this.select.focus();
            if (Prototype.Browser.IE) {
                this.select.focus();
            }
        }
    },
/**
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    return true;
}
});

/**
* fieldTypeText will return a FieldDisplayer object representing a text field.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeText = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeText
*/
{
/**
* @description Stores the regular expresion to check certain text format
*/
TEXT_FORMATS_REGEXP: {
    CHAR: true, // Checks if the text is a string
    NUMC: /^\s*\d+\s*$/, // Checks if the text is an int
    DEC: /^(?:\d+)(?:\.\d+)?$/ // Checks if the text is a decimal number
},
/**
* @description Initializes the class
* @param $super Parent class initialize method
* @param Field type settings
*/
initialize: function($super, options) {
    $super(options);
    //this._onFieldChange(false);
    this.setValid();
},
/**
* Initializes the text input properly.
*/
_initializeModule: function($super) {
    //If we have defined a maximum length
    var maxLength = null;
    if (!Object.isEmpty(this.options.optionsJSON.settings['@length'])) {
        maxLength = parseInt(this.options.optionsJSON.settings['@length'], 10);
        if (maxLength == 0) {
            maxLength = null;
        }
    }
    this.textFieldElement = new Element("input", {
        "type": "text",
        "class": "fieldDispWidth",
        "value": (!Object.isEmpty(this.options.value)) ? this.options.value.gsub('&#37;', '%') : this.options.text
    });
    if (!Object.isEmpty(maxLength)) {
        this.textFieldElement.writeAttribute("maxlength", maxLength);
    }
    this._moduleElement.update(this.textFieldElement);

    var value = this.getValue();
    var changed = this.updateJSON(value);
    //Calling the parent function
    $super();
},
setFocus: function() {
    if(!Object.isEmpty(this.textFieldElement)) {
        this.textFieldElement.focus();
        if (Prototype.Browser.IE) {
            this.textFieldElement.focus();
        }
    }
},
/**
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    var regExp = this.TEXT_FORMATS_REGEXP[this.options.type];
    if (this.options.mode == this.DISPLAY_MODE)
        return true;
    if (!this.options.mandatory)
        return true;
    else if ((Object.isEmpty(this.textGetter())) && (Object.isEmpty(this.idGetter())) && !this.options.visualOpt)
        return false;
    else
        return true
    // in case regExp is undefined it was return false. Therefor condition !regExp added [EefjeC]
    if (!Object.isEmpty(this.textGetter())) {
        if ((!Object.isEmpty(regExp) && this.textGetter().strip().match(regExp)) || (regExp == true || !regExp)) {
            return true;
        } else {
            return false;
        }
    }
    if (!Object.isEmpty(this.idGetter())) {
        if ((!Object.isEmpty(regExp) && this.idGetter().strip().match(regExp)) || (regExp == true || !regExp)) {
            return true;
        } else {
            return false;
        }
    }
},
_setOnChange: function($super) {
    $super(this._moduleElement.down(), 'blur');
},
_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                return this._moduleElement.down().getValue();
            } .bind(this),
            text: function() {
                return this._moduleElement.down().getValue();
            } .bind(this)
        }
    $super(obj);
},

_formattedValue: function(options) {
    var returnValue;
    var valueTrim;

    if (!Object.isEmpty(options) && !Object.isEmpty(options.value)) {

        valueTrim = options.value.strip();

        if (options.type && ((options.type == "CURR") || (options.type == "DEC"))) {
            if (valueTrim.split('.')[1]) {
                var decimalLong = valueTrim.split('.')[1].length;
                returnValue = longToDisplay(parseFloat(valueTrim, 10), decimalLong);
            }
            else {
                returnValue = longToDisplay(parseFloat(valueTrim, 10));
            }
        }
        else {
            returnValue = options.value;
        }
    }
    else
        returnValue = "";

    return returnValue;
}

});

var fieldTypeTextArea = Class.create(fieldTypeText,
/**
* @lends fieldTypeTextArea
*/
{
initialize: function($super, options) {
    $super(options);
    //this._onFieldChange(false);
    this.setValid();
},

/**
* Initializes the text input properly.
*/
_initializeModule: function($super) {
    $super();
    this.textAreaElement = new Element("textarea", {
        'class': 'fieldDisplayer_textArea'
    });
    this._moduleElement.update(this.textAreaElement);
    //If we have defined a maximum length
    if (!Object.isEmpty(this.options.optionsJSON.settings['@length'])) {
        var maxLength = parseInt(this.options.optionsJSON.settings['@length'], 10);
        if (!Object.isEmpty(maxLength) && maxLength > 0) {
            //Create a text area to inform of the maximum length:
            this.textAreaError = new Element("div", { "class": "application_main_soft_text" }).insert("The maximum length for this field is " + maxLength + " characters");
            this.textAreaError.hide();
            this._moduleElement.insert(this.textAreaError);
            //Create a event listener to check the max length
            this.textAreaElement.observe('keyup', this._checkTextAreaLength.bind(this, maxLength));
        }
    }

    //Calling the parent function
    var value = (!Object.isEmpty(this.options.value)) ? this.options.value : this.options.text;
    if (!Object.isEmpty(value))
        this._moduleElement.down().insert(value);
    var valueForJSON = this.getValue();
    this.updateJSON(valueForJSON);
},
_checkTextAreaLength: function(maxLength) {
    if (this.textAreaElement.value.length > maxLength - 1) {
        this.textAreaElement.value = this.textAreaElement.value.truncate(maxLength, "");
        this.textAreaError.show();
    }
    else {
        this.textAreaError.hide();
    }
},
setFocus: function() {
    if(!Object.isEmpty(this.textAreaElement)) {
        this.textAreaElement.focus();
        if (Prototype.Browser.IE) {
            this.textAreaElement.focus();
        }
    }
},
_checkValidFormat: function($super) {
    if (this.options.mandatory && this.textAreaElement.value == '' && !this.options.visualOpt)
        return false;
    else
        return true;
}
});

/**
* FielTypeOuput
*/
var fieldTypeOutput = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeOutput
*/
{
initialize: function($super, options) {
    $super(options);
},

/**
* _setLayoutDisplay
*/
_setLayoutDisplay: function($super) {
    $super();
    //After setting the layout we initialize the values:
    var content = this.options.displayFormat.evaluate(this.options);
    var text = '';
    var id = '';
    if (Object.isEmpty(this.options.value))
        content = content.gsub(" " + global.idSeparatorLeft + global.idSeparatorRight, '');
    if (content.startsWith(" " + global.idSeparatorLeft) && content.endsWith(global.idSeparatorRight))
        content = content.substring(2, content.length - 1);
    //this._moduleElement.update(new Element("span").insert(content));
    if (Object.isEmpty(this.options.optionsJSON.values['@value']) && Object.isEmpty(this.options.optionsJSON.values['#text'] && !content.blank())) {
        text = !Object.isEmpty(this.options.optionsJSON.settings['@default_text']) ? this.options.optionsJSON.settings['@default_text'] : '';
        id = !Object.isEmpty(this.options.optionsJSON.settings['@default_value']) ? this.options.optionsJSON.settings['@default_value'] : '';
        var changed = this.updateJSON({
            id: id,
            text: text
        })
    }
},
_checkValidFormat: function($super) {
    return true;
},

_formattedValue: function(options) {
    var value;

    if (!Object.isEmpty(options) && !Object.isEmpty(options.value)) {
        if (!Object.isEmpty(options.type)) {
            if (options.type == "DATS")
                value = sapToDisplayFormat(options.value);
            else {
                if ((options.type == "DEC") || (options.type == "CURR")) {
                    if (options.value.split('.')[1]) {
                        var decimalLong = options.value.split('.')[1].length;
                        value = longToDisplay(parseFloat(options.value, 10), decimalLong);
                    }
                    else {
                        value = longToDisplay(parseFloat(options.value, 10));
                    }
                }
                else {
                    value = options.value;
                }
            }
        } else {
            value = options.value;
        }
    }
    else
        value = "";

    return value;
}
});

fdFactory = new FieldDisplayerFactory();

/**
* Alias for FieldDisplayerFactory#getFieldDisplayer() method
*
* @param {JSON}
*            optionsJSON The options coming from the service in JSON format.
* @param {String}
*            screen The screen reference.
* @param {String}
*            record The record reference.
* @param {String}
*            mode the mode for the field displayer.
* @return FieldDisplayer a new FieldDisplayer object configured according to the options given.
*/
function $FD(optionsJSON, screen, record, key_str, appid, mode, labels, fieldDisplayerModified, cssClasses, xml_in, handler, name, getFieldValueAppend, ramdomId, rowSeqnr, variant, FPObject) {
    return fdFactory.getFieldDisplayer(optionsJSON, screen, record, key_str, appid, mode, labels, fieldDisplayerModified, cssClasses, xml_in, handler, name, getFieldValueAppend, ramdomId, rowSeqnr, variant, FPObject);
}