/*=============================================================
 * CalendarModule (Date picker)                               *
 * Version: 1.0                                               *
 * Author: SSW Development Team                               *
 =============================================================*/

/*
 * @fileoverview DatePicker.js
 * Contains definition and implementation of DatePicker. This class generates a date field with a calendar icon,
 * This icon create a calendar where the user can select a date and this automaticaly will be inserted on the fields.


/*
 * @class DatePicker
 * @desc DatePicker module class. This class generates a date field with a calendar.
 */
var DatePicker = Class.create({
    // Last day and month input. To avoid unnecesary checkings if the value has not been changed

    lastDayInput: "",
    lastMonthInput: "",
    lastYearInput: "",



    /*
    * @method initialize
    * @desc Constructor of the class. On this function the container div to insert the calendar will be asigned to a class variable.
    * On this function the system also load the text label from the XML Object and defines de default labels.
    * @param options {array} Calendar options
    * @param containerDiv {string} div where the calendar will be posicionated
    */
    initialize: function(containerDiv, options) {
        /* Getting the element where the calendar will be inserted */
        this.containerDiv = $(containerDiv); //DIV to insert the calendar
        this.containerDiv.addClassName('datePicker_mainContainer');
        this.currentSystemDate = new Date(); //The actual system date
        this.linkedCalendar = null;
        this.mainLinker = null;
        /* Getting the options */
        if (Object.isEmpty(options)) {
            this.events = null;
        } else if (Object.isEmpty(options.events)) {
            this.events = null;
        } else {
            this.events = options.events;
        }
                
        //Sets the main options of the DatePicker
        if (!Object.isEmpty(options)) {
            //Default date of the DatePicker
            if (!Object.isEmpty(options.defaultDate)) {
                this.optionsDefaultDate = this.strToDate(options.defaultDate);
            }
            //From date: useful for linked calendars
            if (!Object.isEmpty(options.fromDate))
                this.optionsMinDate = this.strToDate(options.fromDate);
            //To date: useful for linked calendars
            if (!Object.isEmpty(options.toDate))
                this.optionsMaxDate = this.strToDate(options.toDate);
            //If the correctDate event should only be fired on blur or date selection from calendar
            //and not every character change
            if (!Object.isEmpty(options.correctDateOnBlur))
                this.correctDateOnBlur = options.correctDateOnBlur;
            else
                this.correctDateOnBlur = false;
            //If an event should be fired upon initialize or no
            if (!Object.isEmpty(options.fireEventOnInitialize))
                this.fireEventOnInitialize = options.fireEventOnInitialize;
            else
                this.fireEventOnInitialize = false;
            //Whether the user should be able to enter the date manually,
            //or only through the small calendar
            if (!Object.isEmpty(options.manualDateInsertion))
                this.optionsManualDateInsertion = options.manualDateInsertion;
            else
                this.optionsManualDateInsertion = true;
            //Labels, if passed in options
            if (!Object.isEmpty(options.labels))
                this.labels = options.labels;
            else
                this.labels = null;
            //Whether the small calendar should be draggable or no
            if (!Object.isEmpty(options.draggable))
                this.optionsIsDraggable = options.draggable;
            else
                this.optionsIsDraggable = false;
            //If the empty date is valid or no - for mandatory fields it should be set to false
            if (!Object.isEmpty(options.emptyDateValid))
                this.optionsEmptyDateValid = options.emptyDateValid;
            else
                this.optionsEmptyDateValid = true;
            //If there is no default date set, then upon load the date will be set to the current system date
            if (!Object.isEmpty(options.systemDateWhenEmpty))
                this.optionsSystemDateWhenEmpty = options.systemDateWhenEmpty;
            else
                this.optionsSystemDateWhenEmpty = false;
        } else {
            //If there are no options, then we set the default parameters
            this.correctDateOnBlur = false;
            this.fireEventOnInitialize = false;
            this.optionsManualDateInsertion = true;
            this.labels = null;
            this.optionsIsDraggable = false;
            this.optionsEmptyDateValid = true;
            this.optionsSystemDateWhenEmpty = false;
        }
        
        //Getting the labels from global or options and putting them in the corresponding variables
        this.setMonthAndDayLabels();
        
        //Setting the week start day

        if (Object.isEmpty(global.calendarsStartDay)) {
            this.weekStartDay = 0;
        }
        else {
            this.weekStartDay = parseInt(global.calendarsStartDay,10);
            if (this.weekStartDay == 1)
                this.weekStartDay = 0;
            else if (this.weekStartDay == 0)
                this.weekStartDay = 1;
        }

        /* Loading the calendar */
        this.load();
    },
    /*
    * @method getWeek
    * @desc Gets the week number for a given date
    * @param date {Date} Date object
    * @return The week number
    */
    getWeek: function(date) {
        return date.getWeek();
    }
    ,
    /*
    * @method linkCalendar
    * @desc Links a calendar to other (Implements the From To behaviour, It is, if you click on the first calendar on a date
    *		 it will be set as minimum date on the second, and if you click on a date on the second calendar it will be set as
    *		 maximum date on the first.
    * @param calendar {datePicker} DatePicker object
    */
    linkCalendar: function(calendar) {
        //Linking the first calendar
        this.linkedCalendar = calendar;
        this.mainLinker = true;
        //Linking the second calendar
        calendar.linkedCalendar = this;
        calendar.mainLinker = false;
        if(!Object.isEmpty(this.actualDate)) {
            this.linkedCalendar.optionsMinDate = this.actualDate.clone();
        }
        if (!Object.isEmpty(this.linkedCalendar.actualDate)) {
            this.optionsMaxDate = this.linkedCalendar.actualDate.clone();
        }
    },
    /*
    * @method isLeapYear
    * @desc Checks if the year is a leap year
    * @param year {int} The year to be checked
    * @return true if the year is a leap year, false if not
    */
    isLeapYear: function(year) {
        return Date.isLeapYear(year);
    },
    updateRange: function(toDate, fromDate) {
        this.optionsMinDate = Date.parseExact(fromDate, "yyyyMMdd");
        this.optionsMaxDate = Date.parseExact(toDate, "yyyyMMdd");
    },
    /*
    * @method getDayOfWeek
    * @desc Calculates the day of the week for a given date
    * @param day {int} Day of the month
    * @param month {int} Month of the year
    * @param year {int} Year
    * @return the number of the day of the week
    */
    getDayOfWeek: function(day, month, year) {
        var tmpDate = new Date(year, month, day);
        var tmpDay = tmpDate.getDay();
        var res;
        if (tmpDay < this.weekStartDay) {
            var dif = this.weekStartDay - tmpDay;
            res = 7 - dif;
        }
        else {
            res = tmpDay - this.weekStartDay;
        }
        return res;
    },
    /*
    * @method strToDate
    * @desc Converts a date string (YYYYMMDD) to a date object
    * @param dateString {string} string to be converted
    * @return A date object
    */
    strToDate: function(dateString) {

        if (parseInt(dateString) != 0)
            return Date.parseExact(dateString, 'yyyyMMdd');
        else
            return Date.parseExact("00000000", 'yyyyMMdd');
    },
    /*
    * @method getWeekHeader
    * @desc Gets the names of the days of the week and calculates their positions
    * return An array containing the names of the days
    */
    getWeekHeader: function() {
        var fixedWeekDays = new Array(); //Stores the days of the week with the fixed positions
        var i = 0;
        for (var a = this.weekStartDay; a <= this.weekStartDay + 6; a++) {
            if (a <= 6) {
                fixedWeekDays[i] = this.labelDaysNames[a];
            }
            else {
                fixedWeekDays[i] = this.labelDaysNames[a % 7];
            }
            i++;
        }
        return fixedWeekDays;
    },
    /* @method loadCalendarPage
    * @desc This function fills in the calendar cells the days of a given month
    */
    loadCalendarPage: function() {
        this.calendarPageLoaded = true;
        this.daysActions = new Array(31); //Stores the days links and the actions for each day
        var startPosition; //Position of the first day of the month
        /* Getting the position of the first day of week */
        startPosition = this.getDayOfWeek(1, this.currentMonth, this.currentYear);
        var month = this.currentMonth;
        var year = this.currentYear;
        var column = 1;
        var row = 1;
        this.monthHeaderName.update(this.labelMonthsNames[this.currentMonth]);
        this.yearHeaderName.update(year);
        //Loading the previous days
        for (var a = 1; a <= startPosition; a++) {
            this.setDay(row, column, ""); //Setting empty cells
            column++;
        }
        var lastRow = 0;
        var weekNumbers = new Array(6);
        // Loading the month days
        for (var a = 1; a <= this.getMonthDays(month, year); a++) {
            //Calculating the week number for each row
            if (lastRow != row) {
                var date = new Date();
                date.setFullYear(year, month, a);
                weekNumbers[row - 1] = this.getWeek(date);
                lastRow = row;
            }
            a == this.currentSystemDate.getDate() &&
            month == this.currentSystemDate.getMonth() &&
            year == this.currentSystemDate.getFullYear() ?
            this.setDay(row, column, a, true) : this.setDay(row, column, a, false);
            if (column == 7) {
                column = 0;
                row++;
            }
            column++;
        }
        //Empty cells
        while (row < 7) {
            this.setDay(row, column, ""); //Setting empty cells
            if (column == 7) {
                column = 0;
                row++;
            }
            column++;
        }
        //Creating the number of the weeks table (To work on IE)
        var htmlTable = '<TABLE class="datePicker_wtable">';
        for (var i = 0; i <= 5; i++) {
            htmlTable += '<TR class="datePicker_wtr"><TD class="datePicker_wn">' + (weekNumbers[0] + i) + '</TD></TR>';
        }
        htmlTable += "</table>";
        this.weeksTd.update(htmlTable); //Updating the table
    },
    /*
    * @method getMonthDays
    * @desc Gets the number of days for a given month in a year
    * @param {Integer} month
    * @param {Integer} year
    * @return The number of days
    */
    getMonthDays: function(month, year) {
        return Date.getDaysInMonth(year, month);
    },
    /*
    * @method load
    * @desc This function loads the calendar and initialize the main components
    */
    load: function() {
        if (!Object.isEmpty(this.optionsDefaultDate)) {
            this.currentMonth = this.optionsDefaultDate.getMonth();
            this.currentYear = this.optionsDefaultDate.getFullYear();
        }
        else {
            var loadDate = this.currentSystemDate;
            this.currentMonth = loadDate.getMonth();
            this.currentYear = loadDate.getFullYear();
        }
        this.initOverlay(); //Creating the calendar elements

    },
    /*
    * @method loadYearSelectionDialog
    * @desc This function loads the Year selection list
    */
    loadYearSelectionDialog: function() {
        if (this.yearSelectionElements.size() > 1) {
            this.yearCounter = this.currentYear; //Actual calendar year
            var yearIndex = 0; //Counter
            //Filling the year selection with a range of years between currentYear-6 and currentYear+6
            for (var year = this.currentYear - 6; year <= this.currentYear + 6; year++) {
                this.yearSelectionElements[yearIndex].update(year);
                this.yearSelectionElements[yearIndex].stopObserving();
                this.yearSelectionElements[yearIndex].observe('click', this.changeYearByList.bindAsEventListener(this, year));
                yearIndex++;
            }
        }
    },
    /*
    * @method increaseYearSelectionDialog
    * @desc This function increases the year on the Year selection dialog
    */
    increaseYearSelectionDialog: function() {
        if (this.yearCounter < 9993) {
            var yearIndex = 0;
            var currentYear = this.yearCounter + 1;
            for (var year = currentYear - 6; year <= currentYear + 6; year++) {
                this.yearSelectionElements[yearIndex].update(year);
                this.yearSelectionElements[yearIndex].stopObserving('click');
                this.yearSelectionElements[yearIndex].observe('click', this.changeYearByList.bindAsEventListener(this, year));
                yearIndex++;
            }
            this.yearCounter++;
        }
    },
    /*
    * @method decreaseYearSelectionDialog
    * @desc This function decreases the year on the year selection dialog
    */
    decreaseYearSelectionDialog: function() {
        //This is the absolute minimun year 1900+6
        if (this.yearCounter > 1906) {
            var yearIndex = 0;
            var currentYear = this.yearCounter - 1;
            for (var year = currentYear - 6; year <= currentYear + 6; year++) {
                this.yearSelectionElements[yearIndex].update(year);
                this.yearSelectionElements[yearIndex].stopObserving('click');
                this.yearSelectionElements[yearIndex].observe('click', this.changeYearByList.bindAsEventListener(this, year));
                yearIndex++;
            }
            this.yearCounter--;
        }
    },
    /*
    * @method nextMonth
    * @desc Loads next month on the calendar view
    */
    nextMonth: function() {
        if (this.currentMonth == 11) {
            this.currentMonth = 0;
            this.currentYear++; //Increasing the year
        }
        else
            this.currentMonth++; //Increasing the month
        this.loadCalendarPage(); //Reloading the calendar content
    },
    /*
    * @method previousMonth
    * @desc Loads previous month on the calendar view
    */
    previousMonth: function() {
        if (this.currentMonth == 0) {
            this.currentMonth = 11;
            this.currentYear--; //Decreasing the year
        }
        else
            this.currentMonth--; //Decreasing the month
        this.loadCalendarPage();
    },
    /*
    * @method selectDay
    * @desc Day clicking event (This function is triggered when the user clicks on a calendar day)
    * @param event {Event} Event information
    * @param day {int} Selected date
    */
    selectDay: function(event, day) {
        this.showCalendar();
        var seguir = true;
        for (var i = 0; i < this.days.length && seguir; i++) {
            for (var j = 0; j < this.days[i].length && seguir; j++) {
                if (this.days[i][j].hasClassName('datePicker_actualSelected')) {
                    this.days[i][j].removeClassName('datePicker_actualSelected');
                    seguir = false;
                }
            }
        }
        if (Object.isEmpty(this.lastCurrentDay)) {
            this.lastCurrentDay = event.findElement();
        }
        this.lastCurrentDay.removeClassName('datePicker_actualSelected');
        this.lastCurrentDay = event.findElement();
        event.findElement().addClassName('datePicker_actualSelected');
        var args = $A(arguments); //Getting the arguments
        
        this.setDate(new Date(args[3], args[2] - 1, args[1]), true);



    },
    /*
    * @method showYearSelection
    * @desc This function shows or hides the list of the years
    */
    showYearSelection: function(e) {
        this.loadYearSelectionDialog();
        this.yearSelection.getStyle('display') != 'none' ? this.yearSelection.hide() : this.yearSelection.show();
    },
    /*
    * @method showCalendar
    * @desc This function shows and hide the calendar
    * @param e {Event} Event information
    */
    showCalendar: function(e) {
        if (this.calendarOverlay.getStyle('display') != 'none') {
            if (this.setVisible != null) {
                //hidding the calendar
                this.yearSelection.hide();
                this.monthSelection.hide();
                this.calendarOverlay.hide();
                this.setVisible = null;
                this.notHideCalendar = null;
                this.calendarOverlay.setStyle({
                    position: 'relative'
                });
            }
            //I call this function to avoid errors with Select elements in IE6
            iFrameToSelectHide(this.calendarOverlay);
        }
        else {
            //Calculating the position to posicionate the calendar
            //Showing the calendar
            Position.clone(this.formTableTextFields, this.calendarOverlay, {
                setHeight: false,
                setWidth: false
            });
            this.calendarOverlay.setStyle({
                position: 'absolute'
            });
            if (Prototype.Browser.Gecko)
                Position.clone(this.formTableTextFields, this.calendarOverlay, {
                    setHeight: false,
                    setWidth: false
                });
            this.calendarOverlay.setStyle({
                top: this.formTableTextFields.cumulativeOffset().top + 'px'
            });
            this.calendarOverlay.show();
            if (Object.isEmpty(this.setVisible))
                this.setVisible = false;
            this.notHideCalendar = true;
            //I call this function to avoid errors with Select elements in IE6
            iFrameToSelect(this.calendarOverlay);
            if (!this.calendarPageLoaded) 
                this.initCalendarDiv();
                this.loadCalendarPage();
        }
    },
    /*
    * @method showMonthSelection
    * @desc This functios hide or show the month selection panel depending on the current state it is
    */
    showMonthSelection: function() {
        if (this.monthSelection.getStyle('display') != 'none')
            this.monthSelection.hide();
        else
            this.monthSelection.show();
    },
    /*
    * @method changeMonthByList
    * @desc This function is called when the user clicks on the name of a month. The function change the calendar to the
    * Pressed month
    * @param event {Event} Event Object
    * @param month {int} Month number
    */
    changeMonthByList: function(event, month) {
        /* Getting the attributes */
        var monthNumber = $A(arguments);
        this.currentMonth = month;
        this.loadCalendarPage();
        this.monthSelection.hide();
        /* Hidding the month selection pannel */
        this.notHideCalendar = true;
    },
    /*
    * @method changeYearByList
    * @desc This function is triggered when clicking on one of the year of the year selection list
    * @param event {Event} Event information
    * @param year {int} Selected year
    */
    changeYearByList: function(event, year) {
        /* Getting the attributes */
        var monthNumber = $A(arguments);
        this.currentYear = year;
        this.loadCalendarPage();
        /* Hidding the month selection pannel */
        this.yearSelection.hide();
        this.notHideCalendar = true;
        this.loadYearSelectionDialog();
    },
    /*
    * @method checkStringDateFormat
    * @desc Replace some special characters with NaN (otherwise for example isNaN(.9) would return false)
    * @param str {String} String to replace the characters
    * @return The processed string
    */
    checkStringDateFormat: function(str) {
        str = str.replace(/\./g, 'NaN');
        str = str.replace(/\+/g, 'NaN');
        return str;
    },
    _monthFieldError: function(out) {
        if (this.monthField.hasClassName('application_autocompleter_box')) {
            this.changeClassName(this.monthField, 'application_autocompleter_box', 'application_input_error');
        }


    },
    _dayFieldError: function(out) {
        if (this.dayField.hasClassName('application_autocompleter_box')) {
            this.changeClassName(this.dayField, 'application_autocompleter_box', 'application_input_error');
        }

    },
    _yearFieldError: function(out) {
        if (this.yearField.hasClassName('application_autocompleter_box')) {
            this.changeClassName(this.yearField, 'application_autocompleter_box', 'application_input_error');
        }

    },

    /* 
    * @method checkDateFormat
    * @desc Checks the input date has the proper format
    * @param noLinkedCheck (bool) - if false, then if the date is correct, the linked calendar is check as well
    *       if true, the linked calendar is not checked. This is needed to avoid an infinite loop of checking
    *       the linked calendar
    */

    checkDateFormat: function(noLinkedCheck, onBlur) {
        var noYearError = true;
        var noMonthError = true;
        var noDayError = true;

        if(this.optionsEmptyDateValid && this.dateIsEmpty() && (Object.isEmpty(this.linkedCalendar) || 
            (!Object.isEmpty(this.linkedCalendar) && this.linkedCalendar.optionsEmptyDateValid && this.linkedCalendar.dateIsEmpty()))) {
            this.actualDate = null;
            this.changeClassNameInAll('application_input_error', 'application_autocompleter_box');
            this.raiseInternalEvent('correctDate');
            this.optionsMinDate = null;
            this.optionsMaxDate = null;
            if(!Object.isEmpty(this.linkedCalendar)) {
                this.linkedCalendar.changeClassNameInAll('application_input_error', 'application_autocompleter_box');
                this.linkedCalendar.raiseInternalEvent('correctDate');
                this.linkedCalendar.optionsMinDate = null;
                this.linkedCalendar.optionsMaxDate = null;
            }
        } else {
            //Replacing the spaces for ''
            //We check to see if the field has space or no, because if we did not, then upon
            //switching between the fields with tab, focus would not work correctly in IE
            //because as we assign a new value to the field, it messes up the focus
            if(this.yearField.value.include(' '))
            this.yearField.value = this.yearField.value.gsub(/\s/, '');
            if(this.monthField.value.include(' '))
            this.monthField.value = this.monthField.value.gsub(/\s/, '');
            if(this.dayField.value.include(' '))
            this.dayField.value = this.dayField.value.gsub(/\s/, '');
        //Int values
        var yearInt = parseInt(this.yearField.value, 10);
        var monthInt = parseInt(this.monthField.value, 10);
        var dayInt = parseInt(this.dayField.value, 10);
        //String values
        var yearString = this.checkStringDateFormat(this.yearField.value);
        var monthString = this.checkStringDateFormat(this.monthField.value);
        var dayString = this.checkStringDateFormat(this.dayField.value);
        //First check the format
            
            if (isNaN(monthInt) || isNaN(monthString) || monthInt < 1 || monthInt > 12) {
            //Changing the month field class
            noMonthError = false;
            this._monthFieldError();
            }
            if (isNaN(yearInt) || isNaN(yearString) || yearInt > 9999 || yearInt < 1900) {
            //Changin the year field class
            noYearError = false;
            this._yearFieldError();
            }

        if (isNaN(dayInt) || isNaN(dayString) || dayInt < 1 ||
                dayInt > this.getMonthDays(monthInt - 1, yearInt) || dayInt > 31) {
            //Changing the day field class
            noDayError = false;
            this._dayFieldError();
            }          
            
            if (noDayError && noMonthError && noYearError) {
                this.currentMonth = monthInt - 1;
                this.currentYear = yearInt;
                this.actualDate = new Date();
                this.actualDate.setFullYear(yearInt, monthInt - 1, dayInt);
                this.actualDate.clearTime();
                var tmpDate = new Date(yearInt, monthInt, dayInt);
                var outOfRange = this.isOutOfRange();
                if (outOfRange) {
                    this.raiseInternalEvent('wrongDate');
                    this.showOutOfRange();
                    this.changeClassNameInAll('application_autocompleter_box', 'application_input_error');
                } else {
                    this.changeClassNameInAll('application_input_error', 'application_autocompleter_box');
                    //We only raise the correct date event if it should be raised every time, or if it is the
                    //onBlur event of a field
                    if(!this.correctDateOnBlur || onBlur)
                        this.raiseInternalEvent('correctDate');
                }
                if (!Object.isEmpty(this.linkedCalendar)) {
                    if (this.mainLinker)
                        this.linkedCalendar.optionsMinDate = this.actualDate.clone();
                    else
                        this.linkedCalendar.optionsMaxDate = this.actualDate.clone();
                    if(!noLinkedCheck) {
                        this.linkedCalendar.checkDateFormat(true, onBlur);
                    }
                    
                }
        }
        else {
                this.actualDate = null;

        if (noMonthError && this.monthField.hasClassName('application_input_error'))
            this.changeClassName(this.monthField, 'application_input_error', 'application_autocompleter_box');

        if (noYearError && this.yearField.hasClassName('application_input_error'))
            this.changeClassName(this.yearField, 'application_input_error', 'application_autocompleter_box');

        if (noDayError && this.dayField.hasClassName('application_input_error'))
            this.changeClassName(this.dayField, 'application_input_error', 'application_autocompleter_box');
                this.raiseInternalEvent('wrongDate');






        };
        }


    },
    /*
    * @method getDateAsArray
    * @desc Gets the selected date as an array
    * @return An array with the date. array.day, array.month, array.year
    */
    getDateAsArray: function() {
        return {
            day: this.dayField.value,
            month: this.monthField.value,
            year: this.yearField.value
        };
    },

    /*
    * @method getActualDate
    * @desc Gets the selected date as a complete string
    * @return A date with the date in datePicker
    */

    getActualDate: function() {

        var day = (this.dayField.value.length == 1) ? '0' + this.dayField.value : this.dayField.value;
        var month = (this.monthField.value.length == 1) ? '0' + this.monthField.value : this.monthField.value;

        return this.yearField.value + '-' + month + '-' + day;
    },

    /*
    * @method initOverlay
    * @desc This function creates the overlay for the modal window that will contain the calendar
    */
    initOverlay: function() {

        // Stores default date format just in case Object does not exist
        var dateFormat;

        //Container elements
        this.formTableTextFields = new Element('div', {
            'class': 'datePicker_fields'
        }); //Creating the text fields container
        this.formTableCalendarIcon = new Element('div', {
            'class': 'datePicker_icon_box'
        }); //Creating the calendar icon box
        this.dayField = new Element('input', {
            type: 'text',
            'class': 'datePicker_text_day application_autocompleter_box',
            maxlength: '2',
            size: '2'
        }); //Creating the day text field
        this.monthField = new Element('input', {
            type: 'text',
            'class': 'datePicker_text_month application_autocompleter_box',
            maxlength: '2',
            size: '2'
        }); //Creating the month text field
        this.yearField = new Element('input', {
            type: 'text',
            'class': 'datePicker_text_year application_autocompleter_box',
            maxlength: '4',
            size: '4'
        }); //Creating the year field
        this.calendarIcon = new Element('div', {
            'class': 'datePicker_icon'
        }); //Creating the icon
        this.calendarIcon.observe('click', this.showCalendar.bind(this)); //Adding an action to the icon --> Show the calendar
        this.calendarOverlay = new Element('div', {
            id: 'datePicker_overlay',
            'class': 'datePicker_overlay'
        }).hide(); //Calendar container

        if (!Object.isEmpty(global))
            dateFormat = global.dateFormat;
        else
            dateFormat = 'dd.MM.yyyy';

        if (dateFormat.substring(0, 2).toLowerCase() == 'dd') {
            this.formTableTextFields.insert(this.dayField);
            this.formTableTextFields.insert(this.monthField);
            this.formTableTextFields.insert(this.yearField);
        }
        else {
            this.formTableTextFields.insert(this.monthField);
            this.formTableTextFields.insert(this.dayField);
            this.formTableTextFields.insert(this.yearField);
        }
        this.formTableCalendarIcon.insert(this.calendarIcon);
        this.containerDiv.insert(this.formTableTextFields);
        this.containerDiv.insert(this.formTableCalendarIcon);
        $(document.body).insert(this.calendarOverlay);
        // Default date
        if (!Object.isEmpty(this.optionsDefaultDate))
            var auxDate = this.optionsDefaultDate;
        else if (this.optionsSystemDateWhenEmpty)
            var auxDate = new Date();
        if(!Object.isEmpty(auxDate)) {
            this.dayField.value = auxDate.getDate();
            this.monthField.value = auxDate.getMonth() + 1;
            this.yearField.value = auxDate.getFullYear();

            this.lastYearInput = auxDate.getFullYear();
            this.lastMonthInput = auxDate.getMonth()+1;
            this.lastDayInput = auxDate.getDate();

            this.actualDate = new Date();
            this.actualDate.setFullYear(auxDate.getFullYear(), auxDate.getMonth(), auxDate.getDate());
            this.actualDate.clearTime();
        }
        if (this.optionsManualDateInsertion == false || Object.isEmpty(this.optionsManualDateInsertion)) {
            //Setting the fields as readonly
            this.dayField.writeAttribute('readonly');
            this.monthField.writeAttribute('readonly');
            this.yearField.writeAttribute('readonly');
        }
        //Actions to check the date format
        if (this.optionsManualDateInsertion) {
            this.dayField.observe('keyup', this.checkDateAndFocus.bind(this));
            this.monthField.observe('keyup', this.checkDateAndFocus.bind(this));
            this.yearField.observe('keyup', this.checkDateAndFocus.bind(this));
            if(this.correctDateOnBlur) {
                this.dayField.observe('blur', this.checkDateOnBlur.bind(this));
                this.monthField.observe('blur', this.checkDateOnBlur.bind(this));
                this.yearField.observe('blur', this.checkDateOnBlur.bind(this));
            }
        }
        $(document).observe('mousedown', this.checkOutside.bind(this));
        if(this.fireEventOnInitialize)
        this.checkDateFormat(false, true);
        //We do not want to show the DatePicker in error if it is empty and has just been created
        if(this.dateIsEmpty())
            this.changeClassNameInAll('application_input_error', 'application_autocompleter_box');

    },
    /*
    * @method initCalendarDiv
    * @desc This function creates the elements needed to show the DatePicker
    */
    initCalendarDiv: function() {
        //Creating the calendar header (Title + Close button)
        var header = new Element('div', {
            id: 'calendarHeader',
            'class': 'application_header_bar datePicker_header_modal'
        }).update('<div class="application_header_text application_text_bolder datePicker_label_title ">' + this.labelTitle + '</div>');
        if (Object.isEmpty(this.optionsIsDraggable)) {
            header.down(0).setStyle({
                cursor: 'default'
            });
        }
        this.close = new Element('div', {
            id: 'close',
            'class': 'application_rounded_close datePicker_align_close'
        });
        this.close.observe('click', this.showCalendar.bind(this));
        var calendarContent = new Element('div', {
            id: 'close',
            'class': 'datePicker_content'
        }); //Calendar content
        this.monthSelection = new Element('div', {
            'class': 'datePicker_month_selection'
        }).hide(); //Month selection pannel
        this.yearSelection = new Element('div', {
            'class': 'datePicker_year_selection'
        }).hide(); //Year selection pannel
        this.dayField.oncontextmenu = function() {
            return false;
        };
        this.monthField.oncontextmenu = function() {
            return false;
        };
        this.yearField.oncontextmenu = function() {
            return false;
        };
        this.calendarContent = calendarContent;
        //Creating the Month selection pannel
        this.monthSelectionElements = new Array(11);
        //Creating the month selection pannel
        for (var month = 0; month <= 11; month++) {
            this.monthSelectionElements[month] = new Element('a', {
                'class': 'datePicker_month_link'
            }).update(this.labelMonthsNames[month]);
            this.monthSelection.insert(this.monthSelectionElements[month]);
            /* Creating the action when clicking on the month */
            this.monthSelectionElements[month].observe('click', this.changeMonthByList.bindAsEventListener(this, month));
            this.monthSelectionElements[month].observe('mouseover', function(event) {
                this.changeClassName(event.findElement(),'datePicker_month_link','datePicker_month_link_over');
            }.bind(this));
            this.monthSelectionElements[month].observe('mouseout', function(event) {
                this.changeClassName(event.findElement(),'datePicker_month_link_over','datePicker_month_link');
            }.bind(this));
            this.monthSelection.insert(new Element('br'));
        }
        //Creating the Year selection pannel
        this.yearSelectionElements = new Array();
        var yearIndex = 0;
        //Year range between year-6 and year+6
        this.upArrow = new Element('a', {
            'class': 'application_up_arrow datePicker_up_arrow'
        });
        this.yearSelection.insert(this.upArrow);
        for (var year = this.currentYear - 6; year <= this.currentYear + 6; year++) {
            this.yearSelectionElements[yearIndex] = new Element('a', {
                'class': 'datePicker_year_link'
            }).update(year);
            this.yearSelection.insert(this.yearSelectionElements[yearIndex]);
            this.yearSelection.insert(new Element('br'));
            this.yearSelectionElements[yearIndex].observe('click', this.changeYearByList.bindAsEventListener(this, year));
            this.yearSelectionElements[yearIndex].observe('mouseover', function(event) {
                this.changeClassName(event.findElement(),'datePicker_year_link','datePicker_year_link_over');
            }.bind(this));
            this.yearSelectionElements[yearIndex].observe('mouseout', function(event) {
                this.changeClassName(event.findElement(),'datePicker_year_link_over','datePicker_year_link');
            }.bind(this));
            yearIndex++;
        }
        this.downArrow = new Element('a', {
            'class': 'application_down_arrow datePicker_down_arrow'
        });
        this.yearSelection.insert(this.downArrow);
        this.upArrow.observe('click', this.decreaseYearSelectionDialog.bind(this));
        this.downArrow.observe('click', this.increaseYearSelectionDialog.bind(this));
        this.yearCounter = this.currentYear;
        /* This event observe the click event on the document and check if the click was inside the datePicker_overlay element or not */
        calendarContent.insert(this.yearSelection);
        calendarContent.insert(this.monthSelection);
        header.insert(this.close);
        this.calendarOverlay.insert(header);
        this.calendarOverlay.insert(calendarContent);
        var table = new Element('table', {
            'class': 'datePicker'
        });
        var table_header = new Element('thead', {
            'class': 'datePicker_header'
        });
        var table_body = new Element('tbody', {
            'class': 'datePicker_body'
        });
        var table_footer = new Element('tfoot', {
            'class': 'datePicker_footer'
        });
        //Header elements
        var header_contents = new Element('tr');
        var header_month = new Element('td', {
            'class': 'datePicker_month_td',
            colspan: '4'
        }); //Month label
        var header_month_text = new Element('span', {
            'class': 'datePicker_month'
        });
        var header_year_text = new Element('span', {
            'class': 'datePicker_year'
        });

        this.monthHeaderName = header_month_text;
        header_month.insert(header_month_text);
        var header_year = new Element('td', {
            'class': 'datePicker_year_td',
            colspan: '4'
        }); //Year label
        header_year.insert(header_year_text);
        this.monthHeaderName.observe('click', this.showMonthSelection.bind(this));
        this.yearHeaderName = header_year_text;
        this.yearHeaderName.observe('click', this.showYearSelection.bind(this));
        header_contents.insert(header_month);
        header_contents.insert(header_year);
        header_week = new Element('tr', {
            'class': 'datePicker_w0'
        });
        var week_days_header = this.getWeekHeader();
        for (var day = 0; day < week_days_header.length; day++) {
            if (day == 0)
                header_week.insert(new Element('td'));
            header_week.insert(new Element('td', {
                'class': 'datePicker_wd'
            }).update(week_days_header[day]));
        }
        table_header.insert(header_contents);
        table_header.insert(header_week);
        //Body elements
        var body_weeks = new Array(6);
        var body_days = new Array(6);
        for (var i = 0; i < body_days.length; i++)
            body_days[i] = new Array(7);
        var week = 1;
        for (var i = 0; i < body_weeks.length; i++) {
            body_weeks[i] = new Element('tr', {
                'class': 'datePicker_w' + (i + 1)
            });
            if (i == 0) {
                this.weeksTd = new Element('td', {
                    'class': 'datePicker_wtd',
                    rowspan: '6'
                });
                body_weeks[i].insert(this.weeksTd);
            }
            for (var j = 0; j < body_days[week].length; j++) {
                if (this.weekStartDay == 0 && j == 0)
                    body_days[i][j] = new Element('td', {
                        'class': 'datePicker_d' + (7)
                    }).update('');
                if (this.weekStartDay == 0 && j != 0)
                    body_days[i][j] = new Element('td', {
                        'class': 'datePicker_d' + (j)
                    }).update('');
                if (this.weekStartDay != 0)
                    body_days[i][j] = new Element('td', {
                        'class': 'datePicker_d' + (j + this.weekStartDay)
                    }).update('');
                body_weeks[i].insert(body_days[i][j]);
            }
            table_body.insert(body_weeks[i]);
        }
        this.days = body_days;
        //Footer elements
        var footer_contents = new Element('tr');
        /* Creating the previous link and attaching an event to it */
        var previous_link = new Element('a', {
            'class': 'datePicker_month_nav'
            /*'href': 'javascript:;' */
        });
        previous_link.update('&lt;' + this.labelPrevious);
        previous_link.observe('click', this.previousMonth.bind(this));
        var next_link = new Element('a', {
            'class': 'datePicker_month_nav'
            //'href': 'javascript:;'
        });
        next_link.update(this.labelNext + '&gt;');
        next_link.observe('click', this.nextMonth.bind(this));
        var previous_button = new Element('td', {
            'class': 'datePicker_previous',
            colspan: '4'
        }).insert(previous_link);
        /* Creating the next link and attaching an event to it */
        var next_button = new Element('td', {
            'class': 'datePicker_next',
            colspan: '4'
        }).insert(next_link);
        //Assembly of elements
        footer_contents.insert(previous_button);
        footer_contents.insert(next_button);
        table_footer.insert(footer_contents);
        //Inserting the elements on the DIV
        table.insert(table_header);
        table.insert(table_body);
        table.insert(table_footer);
        calendarContent.insert(table);
        if (this.optionsIsDraggable == true) {
            new Draggable(this.calendarOverlay);
            header.setStyle({
                cursor: 'move'
            });
        }
    },

    /*
    * @method setDay
    * @desc This functions sets day number for a given week and day.
    * @param {Integer} week select the row (1-6)
    * @param {Integer} day select the column (1-7)
    * @param {Integer} value the given value for the day
    */
    setDay: function(week, day, value, selected) {
        var tmpDate;
        if (value != '') {
            tmpDate = new Date(this.currentYear, this.currentMonth, value);
            //Empty cell
            var inactive = false;
            if ((!Object.isEmpty(this.optionsMinDate) && this.optionsMinDate > tmpDate) || 
                (!Object.isEmpty(this.optionsMaxDate) && this.optionsMaxDate < tmpDate)) {
                    if (Object.isEmpty(this.daysActions[value]))
                        this.daysActions[value] = new Element('a', {
                            'class': 'datePicker_day_inactive'
                        }).update(value);
                    else {
                        this.daysActions[value].addClassName('datePicker_day_inactive');
                        this.daysActions[value].update(value);
                    }
                    inactive = true;
            }
            if (Object.isEmpty(this.daysActions[value]))
                this.daysActions[value] = new Element('a', {
                    'class': 'datePicker_day_link'
                }).update(value);
            else
                this.daysActions[value].update(value);
            this.daysActions[value].stopObserving('click', this.selectDay);
            if (!inactive)
                this.daysActions[value].observe('click', this.selectDay.bindAsEventListener(this, value, this.currentMonth + 1, this.currentYear));
        }
        if (week > 6 || week < 1 || day < 1 || day > 7) return;
        else
            if (selected) {
            this.days[week - 1][day - 1].update(this.daysActions[value]);
            this.days[week - 1][day - 1].addClassName('datePicker_selected');
        }
        else {
            if (value == '')
                this.days[week - 1][day - 1].update('<a class="datePicker_empty_day">&nbsp;</a>');
            else
                this.days[week - 1][day - 1].update(this.daysActions[value]);
            if (this.days[week - 1][day - 1].hasClassName('datePicker_selected'))
                this.days[week - 1][day - 1].removeClassName('datePicker_selected');
            // this.days[week - 1][day - 1].addClassName('datePicker_d' + (day).toString());
        }
        if (this.days[week - 1][day - 1].hasClassName('datePicker_actualSelected'))
            this.days[week - 1][day - 1].removeClassName('datePicker_actualSelected');
        if (!Object.isEmpty(tmpDate) && !Object.isEmpty(this.actualDate))
            if (Date.compare(tmpDate, this.actualDate.clearTime()) == 0) {
            this.changeClassName(this.days[week - 1][day - 1], 'datePicker_d' + (day), 'datePicker_actualSelected');
        }
    },
    /*
    * @method reloadDefaultDate
    * @desc Sets the actual date to the default date, and inserts the default date on the text fields
    */
    reloadDefaultDate: function() {
        var auxDate = this.optionsDefaultDate;
        this.dayField.value = auxDate.getDate();
        this.monthField.value = auxDate.getMonth() + 1;
        this.yearField.value = auxDate.getFullYear();
        this.actualDate = new Date(auxDate.getFullYear(), auxDate.getMonth(), auxDate.getDate());
        this.actualDate.clearTime();
    },
    /*
    * @method checkOutside
    * @desc This function checks if a click is done inside 'datePicker_overlay' element or not. If the click is outside the element the function hide
    * the calendar.
    * @param evt {Event} Event information
    */
    checkOutside: function(evt) {
        if (clickedOutsideElement('datePicker_overlay', evt))
            if (this.calendarOverlay.getStyle('display') == 'block') {
            //Hidding the calendar
            if (this.monthSelection)
                this.monthSelection.hide();
            if (this.yearSelection)
                this.yearSelection.hide();
            this.calendarOverlay.hide();
            //iFrameToSelectHide(this.calendarOverlay);
            this.setVisible = null;
            this.calendarOverlay.setStyle({
                position: 'relative'
            });
        }
        else {
            this.setVisible = false;
            this.notHideCalendar = null;
        }
    },

    /*
    * @method clearFields
    * @desc Clears day, month and year fields
    */

    clearFields: function() {
        this.dayField.value = '';
        this.monthField.value = '';
        this.yearField.value = '';
    },

    /*
    * @method checkDateAndFocus
    * @desc Checks date and moves focus if necessary
    * @param e Event raised
    */

    checkDateAndFocus: function(e) {
        this.checkDateFormat(false, false);
        //If we only fire correctDate on the blur event
        if(this.correctDateOnBlur) {
            //If there is an error, then we will not go to the next field, but
            //save the wrong date, so if we change it to a correct date later
            //we will see that the date has been modified
            //This is needed so that upon correcting the wrong date and leaving the field
            //the fieldWasModified method will return true in the checkDateOnBlur method
            if(Event.element(e).hasClassName('application_input_error')) {
                this.fieldWasModified(Event.element(e));
            //If the date is correct, we move to the next field if the field is completed
            } else {
                if (this.fieldWasModified(Event.element(e), true)) {
                    this.moveFocusToNextField(Event.element(e));
                }
            }
        } else {
        if (this.fieldWasModified(Event.element(e))) {
            this.moveFocusToNextField(Event.element(e));
            }
        }
    },
    /*
    * @method checkDateOnBlur
    * @desc If we should only fire correctDate on blur, then this function is used
    *   to check the date in order to fire the correctDate event
    * @param e Event raised
    */
    checkDateOnBlur: function(e) {
        if (this.fieldWasModified(Event.element(e))) {
            this.checkDateFormat(false, true);
        }
    },

    /*
    * @method fieldWasModified
    * @desc Checks if day, month or year have been modified. If so, it updates last input field
    * @param element Element to check
    * @param noLastChange if set to true, then the value of the last input will not be updated
    * @return true if the value has been change, false otherwise
    */

    fieldWasModified: function(element, noLastChange) {

        if ((element == this.dayField) && (this.lastDayInput != element.value)) {
            this.lastDayInput = noLastChange ? this.lastDayInput : element.value;
            return true;
        }
        else if ((element == this.monthField) && (this.lastMonthInput != element.value)) {
            this.lastMonthInput = noLastChange ? this.lastMonthInput : element.value;
            return true;
        }
        else if ((element == this.yearField) && (this.lastYearInput != element.value)) {
            this.lastYearInput = noLastChange ? this.lastYearInput : element.value;
            return true;
        }

        return false;
    },

    /*
    * @method moveFocusToNextField
    * @desc The focus is set in the next element if necessary (day --> month, month --> year)
    * @param element element holding the focus
    */

    moveFocusToNextField: function(element) {

        if ((element.value.length == 2) && !element.hasClassName('application_input_error')) {
            if (element == this.dayField) {
                this.monthField.focus();
            }
            else if (element == this.monthField) {
                this.yearField.focus();
            }
        };
    },

    /*
    * @method raiseInternalEvent
    * @desc Raises an internal event in datePicker
    * @param e Event to be raised
    */

    raiseInternalEvent: function(e) {
        if (this.events && this.events.get(e))
            document.fire(this.events.get(e),
                { id: this.containerDiv.id, day: this.dayInt, month: this.monthInt, year: this.yearInt });
    },

    /*
    * @method earlierThan
    * @desc Checks if the current date in date picker is earlier than the one in the argument
    * @param dP Date picker to compare with
    * @returns true if the current date is earlier than the argument, false otherwise
    */

    earlierThan: function(dP) {

        var date = dP.getDateAsArray();

        var day = parseInt(date.day, 10);
        var month = parseInt(date.month, 10);
        var year = parseInt(date.year, 10);

        if (year < this.yearField.value) return false;
        else {
            if (year > this.yearField.value) return true;
            else {
                if (month < this.monthField.value) return false;
                else {
                    if (month > this.monthField.value) return true;
                    else {
                        if (day < this.dayField.value) return false;
                        else {
                            if (day > this.dayField.value) return true;
                            else return false;
                        }
                    }
                }
            }
        }
    },

    /*
    * @method changeClassNameInAll
    * @desc Interchanges two classes for day, month and year fields
    * @param oldClass Class to be removed
    * @param newClass Class to be added
    */

    changeClassNameInAll: function(oldClass, newClass) {
        this.changeClassName(this.dayField, oldClass, newClass);
        this.changeClassName(this.monthField, oldClass, newClass);
        this.changeClassName(this.yearField, oldClass, newClass);
    },

    /*
    * @method changeClassName
    * @desc Interchanges two classes for the given element
    * @param element Element to be modified
    * @param oldClass Class to be removed
    * @param newClass Class to be added
    */

    changeClassName: function(element, oldClass, newClass) {
        element.removeClassName(oldClass);
        element.addClassName(newClass);
    },

    /*
    * @method dateHasEmptyField
    * @desc Checks if any field is empty
    * @return true if the date has one or more fields that are empty, false otherwise
    */

    dateHasEmptyField: function() {

        return ((this.dayField.value == '') || (this.monthField.value == '') || (this.yearField.value == ''));
    },

    /*
    * @method dateIsEmpty
    * @desc Checks if all fields are empty
    * @return true if the date has all fields empty, false otherwise
    */
    dateIsEmpty: function() {
        return ((this.dayField.value == '') && (this.monthField.value == '') && (this.yearField.value == ''));
    },
    /*
    * @method dateIsCompleted
    * @desc Checks if the date is completed, i.e., day/month/year has the minimum expected length
    * @return true if day and month are 1-2 characters long, and year is a 4 character string
    */

    dateIsCompleted: function() {

        return ((this.dayField.value.length > 0) && (this.monthField.value.length > 0) && (this.yearField.value.length == 4));
    },

    /*


    * @method setDate 
    * @desc Sets the current date according to the param's value
    * @param date {Date} Date to be set
    */

    setDate: function(date, onBlur) {
        this.actualDate = date;

        this.currentMonth = date.getMonth();
        this.currentYear = date.getFullYear();

        this.dayField.value = date.getDate();
        this.monthField.value = date.getMonth() + 1;
        this.yearField.value = date.getFullYear();

        this.lastDayInput = this.dayField.value;
        this.lastMonthInput = this.monthField.value;
        this.lastYearInput = this.yearField.value;

        this.checkDateFormat(false, onBlur);
    },

    /*
    * @method isOutOfRange
    * @Checks if the date is out of range
    * @returns true if the date is out of range, otherwise false
    */
    isOutOfRange: function() {
        if ((!Object.isEmpty(this.optionsMinDate) && this.optionsMinDate > this.actualDate) || 
            (!Object.isEmpty(this.optionsMaxDate) && this.optionsMaxDate < this.actualDate)) 
            return true;
        else
            return false;
    },
    /*
    * @method showOutOfRange 
    * @Shows the Out Of Range message under the DatePicker
    */
    showOutOfRange: function() {
        if (!this.pulsateDiv) {
            this.pulsateDiv = new Element('div', { 'id': 'datePicker_pulsateDiv', 'class': 'datePicker_pulsate_div_css' });
            this.pulsateDiv.insert(this.labelOutOfRange);
            this.formTableTextFields.insert(this.pulsateDiv);
        }
        this.pulsateDiv.show();
        if (Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 6) {
            Element.hide.delay(1, this.pulsateDiv);
        }
        else {
            this.pulsateDiv.fade({
                duration: 2.0,
                delay: 1.0
            });
        }
    },
    /*
    * @method setMonthAndDayLabels 
    * @Sets the month and day labels:
    *   it first tries in the options, then in global, then in defaultLabels
    */
    setMonthAndDayLabels: function() {
        this.labelMonthsNames = new Array();
        this.labelDaysNames = new Array();
        if (!Object.isEmpty(global) && !Object.isEmpty(global.labels) && !Object.isEmpty(global.labels.get('janMonth'))) {
            var jan = global.getLabel('janMonth');
            var feb = global.getLabel('febMonth');
            var mar = global.getLabel('marMonth');
            var apr = global.getLabel('aprMonth');
            var may = global.getLabel('mayMonth');
            var jun = global.getLabel('junMonth');
            var jul = global.getLabel('julMonth');
            var aug = global.getLabel('augMonth');
            var sep = global.getLabel('sepMonth');
            var oct = global.getLabel('octMonth');
            var nov = global.getLabel('novMonth');
            var dec = global.getLabel('decMonth');
            var sun = global.getLabel('sunDay').substring(0, 2);
            var mon = global.getLabel('monDay').substring(0, 2);
            var tue = global.getLabel('tueDay').substring(0, 2);
            var wed = global.getLabel('wedDay').substring(0, 2);
            var thu = global.getLabel('thuDay').substring(0, 2);
            var fri = global.getLabel('friDay').substring(0, 2);
            var sat = global.getLabel('satDay').substring(0, 2);
            this.labelTitle = global.getLabel('datePickerTitle');
            this.labelNext = global.getLabel('next');
            this.labelPrevious = global.getLabel('previous');
            this.labelOutOfRange = global.getLabel('outOfRange');
            this.labelMonthsNames.push(jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec);
            this.labelDaysNames.push(sun, mon, tue, wed, thu, fri, sat);
        } else {
            var jan = this.getLabel('jan');
            var feb = this.getLabel('feb');
            var mar = this.getLabel('mar');
            var apr = this.getLabel('apr');
            var may = this.getLabel('may');
            var jun = this.getLabel('jun');
            var jul = this.getLabel('jul');
            var aug = this.getLabel('aug');
            var sep = this.getLabel('sep');
            var oct = this.getLabel('oct');
            var nov = this.getLabel('nov');
            var dec = this.getLabel('dec');
            var sun = this.getLabel('sun').substring(0, 2);
            var mon = this.getLabel('mon').substring(0, 2);
            var tue = this.getLabel('tue').substring(0, 2);
            var wed = this.getLabel('wed').substring(0, 2);
            var thu = this.getLabel('thu').substring(0, 2);
            var fri = this.getLabel('fri').substring(0, 2);
            var sat = this.getLabel('sat').substring(0, 2);
            this.labelTitle = this.getLabel('title');
            this.labelNext = this.getLabel('next');
            this.labelPrevious = this.getLabel('previous');
            this.labelOutOfRange = this.getLabel('outOfRange');
            this.labelMonthsNames.push(jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec);
            this.labelDaysNames.push(sun, mon, tue, wed, thu, fri, sat);
        }
    },
    /**
	* @description gets the label from the options or returns the id if it does not exist
	* @param labelId {string} label id to be returned
	*/
    getLabel: function(labelId) {
        return (!Object.isEmpty(this.labels) && this.labels.get(labelId)) ? this.labels.get(labelId) : labelId;
    }
});




/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
