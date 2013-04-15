var HourField = Class.create(
    /**
*@lends OM_Maintain_Application
*/
    {
        /**
* Reference to an existing element.
* @type Object
*/
        id: 'hourField',
        /**
* To show the seconds or not; 1=show, 0=hide
* @type Int
*/
        viewSecs: 'yes',
        /**
* The format of the time; 12 hours, 2= 24hours
* @type Int
*/
        format: '12',
        /**
* The default time to be shown 
* @type Int
*/
        defaultTime: '000000', //default time
        /**
* The variable with the value of the hour introduced by the user 
* @type Int
*/
        fieldHours: '00',
        /**
* The variable with the value of the minutes introduced by the user 
* @type Int
*/
        fieldMinutes: '00',
        /**
* The variable with the value of the seconds introduced by the user 
* @type Int
*/
        fieldSeconds: '00',
        /**
* If format = 12 hours, the user will have to chose am or pm
* @type String
*/
        fieldAmPm: 'am',
        /**
* @type Hash 
* @description The list of event names that can be fired @name objEvents 
*/
        objEvents: null,

        /**
*@param id Id of the div in which there will be created the hourField
*@param options Parameters to specify if viewing seconds or not, the time format and the default time
*@description initialize hourFields
*/
        initialize: function(id, options) {
            if (!$(id)) {
                throw (id + " doesn't exist!");
                return false;
            } else {
                this.id = (Object.isElement(id)) ? id.identify() : id;
                this.virtualObject = $(id);
            }
            //reading parameters from "options". In case the user didn't specify, we use a default one
            if (options.format != '12')
                this.format = options.format;
            if (options.defaultTime != '000000' && !(isNaN(options.defaultTime)))
                this.defaultTime = options.defaultTime;
            if (options.viewSecs != 'yes') {
                this.viewSecs = options.viewSecs;
            }

            this.options = Object.extend({
                events: null
            }, options || {});
            this.objEvents = this.options.events;

            //split the default time hhmmss into 3 values: hours, minutes, seconds
            this.fieldHours = this.defaultTime.substring(0, 2);
            this.fieldMinutes = this.defaultTime.substring(2, 4);
            this.fieldSeconds = this.defaultTime.substring(4, 6);
            this.createFields();
        },

        createFields: function() {
            var checkedAm = true;
            var checkedPm = false;
            //hours
            if (this.format == '12' && this.fieldHours > 12) {
                this.fieldHours = this.fieldHours - 12; //if has been introduced a 24h time with an am/pm format (not posssible)
                checkedAm = false;
                checkedPm = true;
            }
            var separator = new Element('span', {
                'id': this.id + '_hourdfield_separator',
                'class': 'hourField_span_divider'
            }).update(':');
            this.contentHour = new Element('input', {
                'id': this.id + '_hh',
                'value': this.fieldHours,
                'maxlength': 2,
                'size': 2,
                'class': 'application_autocompleter_box hourField_correct',
                'oncontextmenu': 'return false'
            });
            this.virtualObject.insert(this.contentHour);
            this.virtualObject.insert(separator);
            this.contentMin = new Element('input', {
                'id': this.id + '_mm',
                'value': this.fieldMinutes,
                'maxlength': 2,
                'size': 2,
                'class': 'application_autocompleter_box hourField_correct',
                'oncontextmenu': 'return false'
            });
            this.virtualObject.insert(this.contentMin);
            if (this.viewSecs == 'yes') {
                var separator2 = new Element('span', {
                    'id': this.id + '_hourdfield_separator2',
                    'class': 'hourField_span_divider'
                }).update(':');
                this.virtualObject.insert(separator2);
                this.contentSec = new Element('input', {
                    'id': this.id + '_ss',
                    'value': this.fieldSeconds,
                    'maxlength': 2,
                    'size': 2,
                    'class': 'application_autocompleter_box hourField_correct',
                    'oncontextmenu': 'return false'
                });
                this.virtualObject.insert(this.contentSec);
            }

            if (this.format == '12') {
                this.amRadio = new Element('input', {
                    'type': 'radio',
                    'name': this.id + '_ampm',
                    'id': this.id + 'AM'
                });
                this.amRadio.defaultChecked = checkedAm;
                var labelAm = new Element('label', {
                    'for': 'radio',
                    'class': 'hourField_ampm'
                }).update('am');
                this.pmRadio = new Element('input', {
                    'type': 'radio',
                    'name': this.id + '_ampm',
                    'id': this.id + 'PM'
                });
                this.pmRadio.defaultChecked = checkedPm;
                var labelPm = new Element('label', {
                    'for': 'radio',
                    'class': 'hourField_ampm'
                }).update('pm');
                this.virtualObject.insert(this.amRadio);
                this.virtualObject.insert(labelAm);
                this.virtualObject.insert(this.pmRadio);
                this.virtualObject.insert(labelPm);
            }
            this.addZero();
            this.contentHour.observe('focus', this.storeCorrectValue.bind(this, this.contentHour));
            this.contentHour.observe('keyup', this.checkHour.bind(this));
            //this.contentHour.observe('keypress', this.checkHour.bind(this));
            this.contentMin.observe('focus', this.storeCorrectValue.bind(this, this.contentMin));
            this.contentMin.observe('keyup', this.checkMin.bind(this));
            //this.contentMin.observe('keypress', this.checkMin.bind(this));
            if (this.viewSecs == 'yes') {
                this.contentSec.observe('focus', this.storeCorrectValue.bind(this, this.contentSec));
                this.contentSec.observe('keyup', this.checkSec.bind(this));
            //this.contentSec.observe('keypress', this.checkSec.bind(this));
            }
        },

        addZero: function() {
            if (this.contentHour.value.length == 1) {
                this.contentHour.stopObserving('blur');
                this.contentHour.value = "0" + this.contentHour.value;
            }
            else if (this.contentHour.value.length == 0) {
                this.contentHour.stopObserving('blur');
                this.contentHour.value = "00" + this.contentHour.value;
            }
            if (this.contentMin.value.length == 1) {
                this.contentMin.value = "0" + this.contentMin.value;
            }
            else if (this.contentMin.value.length == 0) {
                this.contentMin.value = "00" + this.contentMin.value;
            }
            if (this.viewSecs == 'yes') {
                if (this.contentSec.value.length == 1) {
                    this.contentSec.value = "0" + this.contentSec.value;
                }
                else if (this.contentSec.value.length == 0) {
                    this.contentSec.value = "00" + this.contentSec.value;
                }
            }

        },
        storeCorrectValue: function(field) {
            if (!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onCorrectTime'))) {
                document.fire(this.objEvents.get('onCorrectTime'));
            }
            if (field == this.contentHour) {
                this.lastHourRigth = this.contentHour.value;
                this.contentHour.stopObserving('focus');
            }
            else if (field == this.contentMin) {
                this.lastMinRigth = this.contentMin.value;
                this.contentMin.stopObserving('focus');
            }
            else {
                this.lastSecRigth = this.contentSec.value;
                this.contentSec.stopObserving('focus');
            }

        },

        checkHour: function() {
            this.removeSpaces(this.contentHour);
            if (isNaN(this.contentHour.value) || this.contentHour.value.include('+') || this.contentHour.value.include('-') || this.contentHour.value.include('.')) {
                this.addError(this.contentHour);
            }
            else {
                if (this.format == '12') {
                    if (this.contentHour.value < 0 || this.contentHour.value > 12)
                        this.addError(this.contentHour);
                    else
                        this.removeError(this.contentHour);
                }
                else {
                    if (this.contentHour.value < 0 || this.contentHour.value > 23)
                        this.addError(this.contentHour);
                    else
                        this.removeError(this.contentHour);
                }
            }
        },

        checkMin: function() {
            this.removeSpaces(this.contentMin);
            if (isNaN(this.contentMin.value) || this.contentMin.value.include('+') || this.contentMin.value.include('-') || this.contentMin.value.include('.')) {
                this.addError(this.contentMin);
            }
            else {
                if (this.contentMin.value < 0 || this.contentMin.value > 59)
                    this.addError(this.contentMin);
                else
                    this.removeError(this.contentMin);
            }
        },

        checkSec: function() {
            this.removeSpaces(this.contentSec);
            if (isNaN(this.contentSec.value) || this.contentSec.value.include('+') || this.contentSec.value.include('-') || this.contentSec.value.include('.')) {
                this.addError(this.contentSec);
            }
            else {
                if (this.contentSec.value < 0 || this.contentSec.value > 59)
                    this.addError(this.contentSec);
                else
                    this.removeError(this.contentSec);
            }
        },
        removeSpaces: function(field) {
            if (field.value.include(' '))
                field.value = field.value.gsub(/\s/, '');
        },

        addError: function(field) {
            if (!field.hasClassName('hourField_error')) {
                field.removeClassName('application_autocompleter_box');
                field.addClassName('hourField_error');
                field.observe('blur', function(event) {
                    if (field == this.contentHour)
                        field.value = this.lastHourRigth;
                    else if (field == this.contentMin)
                        field.value = this.lastMinRigth;
                    else
                        field.value = this.lastSecRigth;
                    if (!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onCorrectTime'))) {
                        document.fire(this.objEvents.get('onCorrectTime'));
                    }
                    field.removeClassName('hourField_error');
                    field.addClassName('application_autocompleter_box');
                    field.observe('focus', this.storeCorrectValue.bind(this, field));
                    field.stopObserving('blur');
                } .bind(this));
            }
            if (!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onIncorrectTime'))) {
                document.fire(this.objEvents.get('onIncorrectTime'));
            }
        },

        removeError: function(field) {
            field.stopObserving('blur');
            if (!field.hasClassName('application_autocompleter_box')) {
                field.removeClassName('hourField_error');
                field.addClassName('application_autocompleter_box');
            }
            if (field.value.length == 2)
                this.storeCorrectValue(field);
            else {
                field.observe('blur', function(event) {
                    this.addZero();
                    if (!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onCorrectTime'))) {
                        document.fire(this.objEvents.get('onCorrectTime'));
                    }
                    field.observe('focus', this.storeCorrectValue.bind(this, field));
                } .bind(this));
            }
        },

        getSapTime: function() {
            var time;

            if (this.format == '12' && this.pmRadio.checked)
                var hour = parseFloat(this.contentHour.value) + 12;
            else
                var hour = this.contentHour.value;
            if (this.viewSecs == 'yes')
                var sec = this.contentSec.value;
            else
                var sec = "00";
            time = hour + this.contentMin.value + sec;
            return time;
        }

    });