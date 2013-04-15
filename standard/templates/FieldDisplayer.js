/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var FieldDisplayerApp = Class.create(Application,{
    initialize: function($super) {
        $super('FieldDisplayerApp');
    },
    run: function($super) {
        $super();
        if(this.firstRun)
            try {
                this._loadData();
            }
            catch(err) {
                alert('Error: '+err);
            }
    },
    close: function() {
        $super();
    },
    _loadData: function() {
        this.virtualHtml.insert('<h3>Two input fields, mandatory with automatic format check</h3>'+
            '<div id="fields"></div>'+
            '<h5>Depent fields</h5>'+
            '<div id="fields_link"></div>');
        var fieldDisplayer = new FieldDisplayer({
            fieldFormat: 'I',
            fieldId: 'FIELD1',
            displayAttrib: 'MAN',
            fieldLabel: 'Insert a number',
            type: 'NUMC',
            maxLength: 4
        });
        fieldDisplayer.setValue('123');
        var fieldDisplayerDec = new FieldDisplayer({
            fieldFormat: 'I',
            fieldId: 'FIELD1',
            displayAttrib: 'MAN',
            fieldLabel: 'Insert a decimal number',
            type: 'DEC',
            maxLength: 4
        });
        var fieldDisplayerText= new FieldDisplayer({
            fieldFormat: 'I',
            fieldId: 'FIELD2',
            displayAttrib: 'MAN',
            fieldLabel: 'Insert your name',
            type: 'CHAR'
        });
        $('fields').insert(fieldDisplayer.getElement());
        $('fields').insert(fieldDisplayerDec.getElement());
        $('fields').insert(fieldDisplayerText.getElement());
        var fieldDisplayerLink = new FieldDisplayer({
            fieldFormat: 'I',
            fieldId: 'COUNTRY',
            displayAttrib: 'MAN',
            fieldLabel: 'Insert a country',
            type: 'CHAR',
            maxLength: 10
        });
        var fieldDisplayerLink2 = new FieldDisplayer({
            fieldFormat: 'I',
            fieldId: 'REGION',
            displayAttrib: 'MAN',
            fieldLabel: 'Insert a region',
            type: 'CHAR',
            maxLength: 10,
            dependField: 'COUNTRY'
        });
        var fieldDisplayerLink3 = new FieldDisplayer({
            fieldFormat: 'D',
            fieldId: 'DATE_FOUNDATION',
            displayAttrib: 'MAN',
            fieldLabel: 'Insert a region',
            dependField: 'REGION',
            type: 'CHAR',
            maxLength: 10,
            defaultValue: '2008-04-01'
        });
        $('fields_link').insert(fieldDisplayerLink.getElement());
        $('fields_link').insert(fieldDisplayerLink2.getElement());
        $('fields_link').insert(fieldDisplayerLink3.getElement());
        this.virtualHtml.insert('<h3>Fiel displayer with autocompleter</h3>'+
            '<div id="fields2"></div>');
        var fieldDisplayerAutocompleter = new FieldDisplayer({
            fieldFormat: 'A',
            fieldId: 'TRFAR',
            displayAttrib: 'MAN',
            fieldLabel: 'Insert a date',
            widScreen: '1',
            strKey: '3000042900080 9999123120090201000',
            appId: 'REL_SALA'
        });
        $('fields2').insert(fieldDisplayerAutocompleter.getElement());
        fieldDisplayerAutocompleter.setValue('01');
        function _parseFields() {
            alert('Text Area value: '+fieldDisplayerAutocompleter.getValue());
        }
        this.virtualHtml.insert('<br />'+
            '<input type="button" onClick="javascript: _parseFields();" value="Get fields values" />'+
            '<h3>Fiel displayer with date input</h3>'+
            '<div id="fields3"></div>');
        var fieldDisplayerDate = new FieldDisplayer({
            fieldFormat: 'P',
            fieldId: 'DATEPICKER1',
            displayAttrib: 'MAN',
            fieldLabel: 'Insert a date'
        });
        $('fields3').insert(fieldDisplayerDate.getElement());
        function _parseFields() {
            alert('DatePicker value: '+fieldDisplayerDate.getValue());
        }
        function _updateValue() {
            fieldDisplayerDate.setValue('2007-01-01');
        }
        this.virtualHtml.insert('<br />'+
            '<input type="button" onClick="javascript: _parseFields();" value="Get fields values" />'+
            '<input type="button" id="updateButton" value="Update datepicker value" />'+
            '<h3>Field displayer with a select box</h3>'+
            '<div id="fields4"></div>');
        $('updateButton').observe('click', _updateValue);
        var fieldDisplayerSelectBox = new FieldDisplayer({
            fieldFormat: 'S',
            fieldId: 'LAND1',
            displayAttrib: 'MAN',
            fieldLabel: 'Select a value',
            widScreen: '3',
            strKey: '3000042900061      9999123120080101000',
            appId: 'PD_DATA'
        });
        $('fields4').insert(fieldDisplayerSelectBox.getElement());
        function _parseFields2() {
            alert('DatePicker value: '+fieldDisplayerSelectBox.getValue());
        }
        this.virtualHtml.insert('<input type="button" onClick="javascript: _parseField2();" value="Get fields values" />'+
            '<h3>Field displayer with a text area</h3>'+
            '<div id="fields5"></div>'+
            '<script type="text/javascript">');
        var fieldDisplayerTextArea = new FieldDisplayer({
            fieldFormat: 'T',
            fieldId: 'DATEPICKER2',
            displayAttrib: 'MAN',
            fieldLabel: 'Select a value'
        });
        fieldDisplayerTextArea.setValue('This is an example value using setValue(value)');
        $('fields5').insert(fieldDisplayerTextArea.getElement());
        function _parseTextArea() {
            alert('Text Area value: '+fieldDisplayerTextArea.getValue());
        }
        this.virtualHtml.insert('<input type="button" onClick="javascript: _parseTextArea();" value="Get fields values" />'+
            '<h3>Field displayer with a radio button</h3>'+
            '<div id="fields6"></div>');
        var fieldDisplayerRadioButton = new FieldDisplayer({
            fieldFormat: 'R',
            fieldId: 'LAND1',
            displayAttrib: 'MAN',
            fieldLabel: 'Select a value',
            widScreen: '3',
            strKey: '3000042900061      9999123120080101000',
            appId: 'PD_DATA'
        });
        $('fields6').insert(fieldDisplayerRadioButton.getElement());
        function _parseFields2() {
            alert('DatePicker value: '+fieldDisplayerRadioButton.getValue());
        }
        this.virtualHtml.insert('<input type="button" onClick="javascript: _parseFields2();" value="Get fields values" />'+
            '<h3>Field displayer with a checkbox</h3>'+
            '<div id="fields7"></div>');
        var fieldDisplayerCheckBox = new FieldDisplayer({
            fieldFormat: 'C',
            fieldId: 'LAND1',
            widScreen: '3',
            strKey: '3000042900061      9999123120080101000',
            appId: 'PD_DATA'
        });
        $('fields7').insert(fieldDisplayerCheckBox.getElement());
        function _parseFieldsCheckBox() {
            alert('Check Box value: '+fieldDisplayerCheckBox.getValue());
        }
        this.virtualHtml.insert('<input type="button" onClick="javascript: _parseFieldsCheckBox();" value="Get fields values" />'+
            '<h3>Field type value</h3>'+
            '<div id="readonly"></div>');
        var fieldDisplayerValue = new FieldDisplayer({
            fieldFormat:'V',
            fieldId: 'READONLY1',
            fieldLabel: 'This is text',
            defaultValue: 'This is text value'
        });
        $('readonly').insert(fieldDisplayerValue.getElement());
        this.virtualHtml.insert('<h3>Field displayer type hour</h3>'+
            '<div id="hourfield"></div>');
        var fieldDisplayerHour = new FieldDisplayer({
            fieldFormat:'H',
            fieldId: 'HOURFIELD1',
            fieldLabel: 'Insert a time'
        });
        $('hourfield').insert(fieldDisplayerHour.getElement());
        function _parseFieldsHour() {
            alert(fieldDisplayerHour.getValue());
        }
        this.virtualHtml.insert('<input type="button" onClick="javascript: _parseFieldsHour();" value="Get fields values" />');
    }
});

