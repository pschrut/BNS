/**
 * @fileOverview teamCalendar.js
 * @description File containing class teamCalendar Needed to see the calendar in a team view.
*/
var teamCalendar = Class.create(parentCalendar,
/**
*@lends teamCalendar
*/
{
    // PROPERTIES
    /**
     * @type Number
     * @description Logged user's personnel number
     */
    pernr: null,
    /**
     * @type Hash (id: name,color)
     * @description list of employees retrieved from getMyTeam. Employee view
     */
    myTeam: [],
    /**
     * @type array of hash (text, date)
     * @description list of days and labels for the TWO weeks view.
     */
    currentWeek: [],
    /**
     * @type Date
     * @description first day of the current week (not previous days) in the 2weeks view
     */
    begDate: '',
    /**
     * @type Date
     * @description last day of the current week (not following days) in the 2weeks view
     */
    endDate: '',
    /**
     * @type string
     * @description label od link select all. We need it to be a class attribute
     */
    selectAllLabel: '',
    /**
     * @type array
     * @description array of selected employees in manager view
     */
    selectedEmployees: [],
    /**
     * @type boolean
     * @description tells if employee is restricted to see colleague details...
     */
    employeeRestriction: null,
    /**
     * @type hash
     * @description hash of ws information
    */
    wsInformation : new Hash(),
    /**
     * @type Boolean
     * @description Says if the content for new event has been loaded
    */
    menuBalloonOpened: false,
    /**
     * @type hash
     * @description hash of events balloon information
    */
    eventsBalloonInformation : new Hash(),
    /**
     * @type Boolean
     * @description If the event last more than 13 days
    */
    isVeryLongEvent: false,
    /**
     * @type Boolean
     * @description Indicates if we have to refresh the events
    */
    refresh: false,
    /**
     *@param $super The superclass
     *@param appName Name of the applicacion: teamCalendar
     *@description instantiates the app
     */
	initialize: function($super,options) {
	    $super(options);
		this.datepicker_DateSelectedHandlerBinding = this._changeWeekHandler.bindAsEventListener(this);
		this.refreshButtonClickedBinding = this._refreshButtonClicked.bindAsEventListener(this);
		this._toggleFilterOptionsBinding = this._toggleFilterOptions.bind(this);
	},
    /**
     *@param $super The superclass
     *@description when the user clicks on the app tag, load the html structure and calendars for current week. If the user clicks on
     * the tag and it's not the first time, load new users selected in other apps, delete users unselected, and reaload colors
     * which have changed.
     */
	run: function($super, args) {
	    $super();
	    // this.firstRun causes problems, so we will use our own parameter
        if (this.firstRun) {
            this.dateFormat = global.dateFormat;
            this.pernr = global.objectId;
            this.employeeRestriction = (global.currentSelectionType == 'none') ? false : true;
            if (this.employeeRestriction)
                this.selectedEmployees = this.getSelectedEmployees();
            else {
                this.myTeam = new Hash();
                var emp = this.getPopulation()[0];
                this.myTeam.set(emp.objectId, $H({
                    name: emp.name,
                    color: 0,
                    selected: false,
                    otype: emp.objectType
                }));
            }
            this.today = Date.today();
            if ((!Object.isEmpty(args)) && (!Object.isEmpty(args.get('date'))))
                this.today = Date.parseExact(args.get('date'), 'yyyy-MM-dd');
            this._calLabels(this.today);
        }
        // If there were creations, modifications or deletions, we have to refresh the calendar
        if (this.refresh) {
            this._refreshButtonClicked();
            this.refresh = false;
        }
        // If application is opened in Time Entry, we will use its date
        if (((!Object.isEmpty(args)) && (!Object.isEmpty(args.get('date')))) && (!this.firstRun))
            this._changeWeek(Date.parseExact(args.get('date'), 'yyyy-MM-dd'));
        //set the event listeners
        document.observe('EWS:teamCalendar_CorrectDate', this.datepicker_DateSelectedHandlerBinding);
        document.observe('EWS:calendar_refreshButtonClicked_teamCalendar', this.refreshButtonClickedBinding);
	},
    /**
    * @description called when the application is not shown.
    */
    close: function($super){
        $super();
		document.stopObserving('EWS:teamCalendar_CorrectDate', this.datepicker_DateSelectedHandlerBinding);
		document.stopObserving('EWS:calendar_refreshButtonClicked_teamCalendar', this.refreshButtonClickedBinding);
    },
    /**
     *@param date Date selected in the datePicker, or today
     *@description load team Calendar for date selected
     */
	_calLabels: function(date) {
        if (this.firstRun)
            this._setInitialHTML();
        else
            this._changeWeek(date);
	},
    /**
     *@description load html structure and team Calendars for default date (today)
     */
	_setInitialHTML: function() {
        // HEADER HTML
        // Beg date - end date TodayButton DatePicker
        var week = 0;
        if (this.today.getWeek() > 52)
            week = this.today.getWeek() - 52;
        else
            week = this.today.getWeek();
        // If first day of the week is Sunday...
        if (global.calendarsStartDay < 1)
            this.begDate = this.today.clone().setWeek(week).moveToDayOfWeek(0, -1);
        // If not...
        else {
            // If first day of the week is not Sunday or Monday...
            if (global.calendarsStartDay > 1)
                this.begDate = this.today.clone().setWeek(week).moveToDayOfWeek(global.calendarsStartDay);
            // If first day of the week is Monday...
            else
                this.begDate = this.today.clone().setWeek(week);
        }
        this.endDate = this.begDate.clone().addDays(6);
        if(! this.today.between(this.begDate, this.endDate)) {
            this.begDate.addDays(-7);
            this.endDate.addDays(-7);
        }
        this.begDateLabel = this.begDate.toString('ddd').toLowerCase();
        this.endDateLabel = this.endDate.toString('ddd').toLowerCase();
        var html = "<div id='applicationTeamCalendar_outer'>" +
                       "<div id='applicationTeamCalendar_header'>" +
                           "<div class='applicationTeamCalendar_navButtonsDiv'>" +
                               "<div id='applicationTeamCalendar_prevButton' class='application_verticalL_arrow application_handCursor'></div>" +
                               "<div id='applicationTeamCalendar_postButton' class='application_verticalR_arrow application_handCursor'></div>" +
                           "</div>" +
                           "<div id='applicationTeamCalendar_currentWeek'>" +
                               global.labels.get(this.begDateLabel) +" "+ this.begDate.toString(this.dateFormat) + " - " + global.labels.get(this.endDateLabel) +" "+ this.endDate.toString(this.dateFormat) +
                           "</div>" +
                           "<div id='applicationTeamCalendar_todayButtonDiv'></div>" +
                           "<div id='applicationTeamCalendar_datePickerDiv'></div>" +
                           "<div id='applicationTeamCalendar_filterLabel' class='application_action_link'></div>" +
                       "</div>";               
        var json = {
                   elements:[]
                };
        var aux =   {
                idButton:'todayButton',
                label: global.getLabel('today'),
                handlerContext: null,
                handler: this._clickOnToday.bind(this),
                type: 'button',
                standardButton:true
              };                 
        json.elements.push(aux);                   
        var ButtonTeamCalendar = new megaButtonDisplayer(json);                 
        //update with the created html
        this.virtualHtml.insert(html);
        this.virtualHtml.down('[id=applicationTeamCalendar_todayButtonDiv]').insert(ButtonTeamCalendar.getButtons());
        //once we have retrieved the labels, create the html
        this.virtualHtml.insert(this.filterElement);
        html = "<div id='applicationTeamCalendar_body'>" +
                    "<div id='applicationTeamCalendar_content'>" +
                        "<div id='applicationTeamCalendar_tableDiv'></div>" +
                    "</div>" +
                    "<div id='applicationTeamCalendar_footer'></div>" +
                "</div>" +
                "<div id='applicationTeamCalendar_message'>" +
                "</div></div>";
        //update with the created html
        this.virtualHtml.insert(html);
        this.virtualHtml.down('[id=applicationTeamCalendar_message]').hide();
        this.virtualHtml.down('[id=applicationTeamCalendar_message]').insert(
                    "<div class='application_main_soft_text listCalendar_clearBoth listCalendar_noEventsFound'>" + global.getLabel("selectEmployeePlease") + "</div>" +
                    "<div class='listCalendar_clearBoth'>&nbsp;</div>"
        );
        //creation of the datePicker
        this.datePicker = new DatePicker('applicationTeamCalendar_datePickerDiv', {
                                manualDateInsertion: false,
                                defaultDate: this.today.toString('yyyyMMdd'),
                                draggable: true,
                                events: $H({correctDate: 'EWS:teamCalendar_CorrectDate'})
                            });
        //NAVIGATION
        //when the datePicker is used, reload the calendar by calling to changeWeekHandler --> globalEvents attached in run method
        //when "today" button is clicked, call "clickOnToday" method
        this.virtualHtml.down('[id=applicationTeamCalendar_prevButton]').observe('click',function(args){
            //go to the first day of the next week
            var lastWeek = this.begDate.clone().add(-7).days();
            this.menuBalloonOpened = false;
            //reload teamCalendar (the table with top and employees rows)
            //2nd parameter: is not neccesary to recalculate the week -> false
	        this._changeWeek(lastWeek, false);
        }.bind(this));
        this.virtualHtml.down('[id=applicationTeamCalendar_postButton]').observe('click',function(args){
            //go to the first day of the next week
            var nextWeek = this.begDate.clone().add(7).days();
            this.menuBalloonOpened = false;
            //reload teamCalendar (the table with top and employees rows)
            //2nd parameter: is not neccesary to recalculate the week -> false
	        this._changeWeek(nextWeek, false);
        }.bind(this));
        // END OF HEADER HTML
        //----------------------------------------------------------------------------------//
        //FOOTER HTML
        var labPresent = global.getLabel('present');
        var labPartAbs = global.getLabel('halfPresent');
        var labAbsent = global.getLabel('absent');
        var moreEvents = global.getLabel('moreEvents');
        this.selectAllLabel = global.getLabel('selectUnselectAll').split('/')[0] + ' ' + global.getLabel('selectUnselectAll').split(' ')[1];
        //create the html with the labels read
        var legendJSON = { 
            legend: [
                { img: "applicationTeamCalendar_presentIcon", text: labPresent },
                { img: "applicationTeamCalendar_partAbsentIcon", text: labPartAbs },
                { img: "applicationTeamCalendar_absentIcon", text: labAbsent },
                { img: "applicationTeamCalendar_moreEventsIcon", text: moreEvents }
            ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
        var legendHTML = getLegend(legendJSON);
        this.virtualHtml.down('[id=applicationTeamCalendar_footer]').update("<div id='applicationTeamCalendar_dropList'></div>");
        this.virtualHtml.down('[id=applicationTeamCalendar_footer]').insert(legendHTML);
        //if we have an x in restrict, we don't have to show the colleagues, only the calendar of the employee          
        if (this.employeeRestriction)
            this.virtualHtml.down('[id=applicationTeamCalendar_dropList]').hide();
        // END OF FOOTER
        //----------------------------------------------------------------------------------//
        //CALENDAR WITH CURRENT USER
        //get the date and text for the top table.
        this._getTopTableLabels(this.begDate);
        //draw the top tabel (date and texts): Mo 01, Tu 02...
        this._drawTopOfTable();
        //Check if it's a manager or not. Depending on that, the functionality is slightly different
        if (!this.employeeRestriction) {
            // Before drawing calendars, we need to load the drop list with "my team" members, since
            // in employee view we dont have left menu
            // create the xml for service GETMYTEAM
            var xmlGetMyTeam = "<EWS>" +
                               "<SERVICE>GET_MY_TEAM</SERVICE>" +
                               "<OBJECT TYPE='P'>" + this.pernr + "</OBJECT>" +
                               "<PARAM></PARAM>" +
                               "</EWS>";
            //calling the service
            this.makeAJAXrequest($H({xml:xmlGetMyTeam, successMethod:'_asEmp_insertMyTeam'}));
        }
        this.firstRun = false;
	},
    /**
     *@param date Date seed to build the labels
     *@description Parses the xml to create an array with labels for current week
     */
    _getTopTableLabels: function(date) {
        var actualDate = date.clone().addDays(-3);
        // 13 days (one week and 3 days before/after
        for (var i = 0; i < 13 ; i++) {
            var dayHash = new Hash();
            var style = 'normalDay';
            if (i < 3 || i >= 10)
                style = 'grayedDay';
            var dayNumber = actualDate.toString('dd');
            var dayName = global.labels.get(actualDate.toString('ddd').toLowerCase());
            dayHash.set('class', style);
            dayHash.set('date',dayNumber);
            dayHash.set('text',dayName);
            //save all values in the class attribute this.currentWeek
            this.currentWeek.push(dayHash);
            actualDate = actualDate.clone().addDays(1);
        }
    },
    /**
     *@param week Array with week labels
     *@description Draw the top of the calendar table, with the 2 weeks labels
     */
    _drawTopOfTable: function() {
        //creation of the table
        var table = new Element('table', {
            id: 'applicationTeamCalendar_table',
            'cellspacing': '0',
            'cellpadding': '0'
        });
        //creation of tbody
        var tbody = new Element('tbody', {
            id: 'applicationTeamCalendar_tbody'
        });
        //first row: text with the day within the week (mon, tue, wed..)
        var tr1 = new Element('tr');
        tr1.addClassName('applicationTeamCalendar_dateText');
        //td with empty space (we need that td because in the employees rows we'll place there the emp name
        var td_spaceCell1 = new Element('td').insert("<div class='applicationTeamCalendar_spaceCell'></div>");
        tr1.insert(td_spaceCell1);
        //move throught the week array to load the cells with the labels
        for (var j = 0; j < this.currentWeek.length; j++) {
            var td = new Element('td').insert( "<div class='applicationTeamCalendar_topcell'>"+this.currentWeek[j].get('text')+"</div>");
            //if it's te grayed or normal we add the proper style
            if (this.currentWeek[j].get('class') == 'grayedDay') {
                td.addClassName('application_main_soft_text');
            }
            if (this.currentWeek[j].get('class') == 'normalDay') {
                td.addClassName('applicationTeamCalendar_normalDay');
            }
            tr1.insert(td);
        }
        tbody.insert(tr1);
        //second row: date of the date: 23, 24, 25...
        var tr2 = new Element('tr');
        tr2.addClassName('applicationTeamCalendar_dateNumber');
        var td_spaceCell2 = new Element('td').insert("<div class='applicationTeamCalendar_spaceCell'></div>");
        tr2.insert(td_spaceCell2);
        for (var j = 0; j < this.currentWeek.length; j++) {
            var td = new Element('td').insert(  "<div class='applicationTeamCalendar_topcell'>"+this.currentWeek[j].get('date')+"</div>");
            //if it's te grayed or normal we add the proper style
            if (this.currentWeek[j].get('class') == 'grayedDay') {
                td.addClassName('application_main_soft_text');
            }
            if (this.currentWeek[j].get('class') == 'normalDay') {
                td.addClassName('applicationTeamCalendar_normalDay');
            }
            tr2.insert(td);
        }
        tbody.insert(tr2);
        table.insert(tbody);
        this.virtualHtml.down('[id=applicationTeamCalendar_tableDiv]').update(table);
    },
    /**
     *@param empPernr EmployeeId
     *@param empName Employee's name
     *@param empColor Employee's color
     *@description Draw the empty calendar row for an employee
     */
    _drawCalendarRow: function(empPernr, empName, empColor) {
        //a white cross which is a button to unselect employees, if the employee is not restricted
        var xTag = '';
        if (!this.employeeRestriction) {
            xTag = "<div class='application_currentSelection applicationTeamCalendar_closeButton'></div>";
            //getting the name and color from the hash of employees
            var employeePosition = this.myTeam.keys().indexOf(empPernr);
            //set selected=true in this.myTeam array
            this.myTeam.get(empPernr).set('selected', true);
            //get name and color of the employee
            empName = this.myTeam.get(empPernr).get('name');
            empColor = this.myTeam.get(empPernr).get('color');
        }
        var color = (empColor < 10) ? '0' + empColor : empColor;
        //html structure of the row
        var tr_empCalendar = new Element('tr', {
            id: empPernr+'_teamCalendar'
        });
        //column of the name: coloured square and name div *X cross in the coloured square if employee
        var td_name_content = "<div id='" + empPernr + "_button' class='applicationTeamCalendar_empButton eeColor" + color + "'><div class='applicationTeamCalendar_textInMiddleButton'>" + xTag + "</div></div>" +
                              "<div id='" + empPernr + "_name' class='applicationTeamCalendar_nameEmp application_color_eeColor" + color + "'><div title='" + empName + "' class='applicationTeamCalendar_textInMiddleName'>" + empName + "</div></div>";
        var td_name = new Element('td').insert(td_name_content);
        td_name.addClassName('applicationTeamCalendar_calRow');
        tr_empCalendar.insert(td_name);
        //parse the date to DATE format
        var date = this.begDate.clone();
        //go to the first day in the 2 weeks view
        var parsedDate = date.clone().add(-3).days().toString('yyyyMMdd');
        //create all the cells with empID_date as ID
        for (var j = 0; j < this.currentWeek.length; j++) {
            var td = new Element('td').insert("<div class='applicationTeamCalendar_cell' id='" + empPernr + "_" + parsedDate + "'></div>");
            td.addClassName('applicationTeamCalendar_calRow');
            tr_empCalendar.insert(td);
            date = Date.parseExact(parsedDate, 'yyyyMMdd');
            parsedDate = date.clone().add(1).days().toString('yyyyMMdd');
        }
        this.virtualHtml.down('[id=applicationTeamCalendar_tbody]').insert(tr_empCalendar);
        //if employee AND if employee is not restricted, make the X cross a button to unselect employees
        if(!this.employeeRestriction) {
            this.virtualHtml.down('[id='+empPernr+'_button]').addClassName('applicationTeamCalendar_handCursor');
            this.virtualHtml.down('[id='+empPernr+'_button]').observe('click', function(event){
                this.onEmployeeUnselected({id: empPernr});
            }.bind(this));
        }
    },
    /**
     *@param empPernr Id of the employee in either global o this.myTeam arrays
     *@param oType Object type
     *@description Insert the events for an employee in a determined week
     */
     _callToGetEvents: function(empPernr, oType) {
        //we must call the service with the end and beg date in the 2 weeks period, not in current week
        var begGrayed = this.begDate.clone().add(-3).days().toString('yyyy-MM-dd');
        var endGrayed = this.endDate.clone().add(3).days().toString('yyyy-MM-dd');
        if (!oType)
            oType = 'P';
        var xmlGetEvents = "<EWS>" +
                           "<SERVICE>GET_EVENTS</SERVICE>" +
                           "<OBJECT TYPE='" + oType + "'>" + empPernr + "</OBJECT>" +
                           "<PARAM>" +
                           "<o_begda_i>" + begGrayed + "</o_begda_i>" +
                           "<o_endda_i>" + endGrayed + "</o_endda_i>" +
                           "<o_li_incapp>" + this.getFilterSelectedOptions().get('string') + "</o_li_incapp>" +
                           "</PARAM>" +
                           "</EWS>";
        //calling the service GET_EVENTS
        this.makeAJAXrequest($H({xml:xmlGetEvents, successMethod:'_insertEvents', errorMethod: '_insertEventsError', ajaxID: empPernr}));
    },
    /**
     *@param json JSON from GET_EVENTS
     *@description Once the calendar is drawn, complete it with the events and workschedule
     */
    _insertEvents: function(json, ID) {
        if (!this.filterCreated) {
            var incapp = json.EWS.o_li_incapp.yglui_str_incap2;
            this.createFilterPanel(this.filterElement, this.appName, incapp);
            this.virtualHtml.down('[id=applicationTeamCalendar_filterLabel]').update(global.getLabel("filterOptions")).observe('click',this._toggleFilterOptionsBinding);
            this.filterCreated = true;
        }
        var pernr = ID;
        var wsXML = Object.isEmpty(json.EWS.o_workschedules) ? [] : objectToArray(json.EWS.o_workschedules.yglui_str_dailyworkschedule);
        var workschedules = [];
        if (wsXML.length > 0) {
            //create hash of workschedules
            for (var a = 0; a < wsXML.length; a++) {
                var workSchedule = new Hash();
                workSchedule.set('id', pernr + "_" + Date.parseExact(wsXML[a]['@workschedule_id'], 'yyyy-MM-dd').toString('yyyyMMdd'));
                workSchedule.set('text', wsXML[a]["@daily_wsc"]);
                workschedules.push(workSchedule);
            }
            //insert workschedules in cells
            for (var a = 0; a < this.currentWeek.length; a++) {
                var begEndDate = workschedules[a].get('id').substring(9,18);
                //insert workschedule in team calendar
                var cell_structure = "<div id='" + workschedules[a].get('id') + "_ws_teamCalendar' class='applicationTeamCalendar_cell_ws'>" +
                                         workschedules[a].get('text') +
                                     "</div>" +
                                     "<div id='" + workschedules[a].get('id') + "_content' class='applicationTeamCalendar_cell_content'></div>" +
                                     "<div id='" + workschedules[a].get('id') + "_moreEvents'></div>";
                this.virtualHtml.down('[id='+workschedules[a].get('id')+']').insert(cell_structure);
                //add css class
                if(workschedules[a].get('text') == 'FREE')
                    this.virtualHtml.down('[id='+workschedules[a].get('id')+']').addClassName('applicationTeamCalendar_cellAbsent');
                //managers can see details for everybody. Employees can just see their own event details
                if((this.employeeRestriction) || (!this.employeeRestriction && pernr == this.pernr) ){
                    //just put the hand cursor in owned cells
                    this.virtualHtml.down('[id='+workschedules[a].get('id')+'_ws_teamCalendar]').addClassName('applicationTeamCalendar_handCursor');
                    //call GET_CAL_MENU to get the content of the balloon that will be fired if the user wants to create an event in an empty cell
                    var xmlCalMenu = "<EWS>"
                                    + "<SERVICE>GET_CON_ACTIO</SERVICE>"
                                    + "<OBJECT TYPE='P'>" + pernr + "</OBJECT>"
                                    + "<PARAM>"
                                    + "<CONTAINER>CAL_MGM</CONTAINER>"
                                    + "<MENU_TYPE>N</MENU_TYPE>"
                                    + "</PARAM>"
                                    + "</EWS>";          
                    this.virtualHtml.down('[id='+workschedules[a].get('id')+'_content]').observe('click', this._callToGetCalMenu.bind(this, xmlCalMenu, pernr + '_' + begEndDate + '_content'));
                    this.virtualHtml.down('[id='+workschedules[a].get('id')+'_ws_teamCalendar]').observe('click', this._callToGetDWSDetails.bind(this, pernr, begEndDate));
                }
            }
            //END WORKSCHEDULES
            //*************************************************************************************************//
            //once the ws have been inserted, we retrieve the EVENTS
            var eventsXML = this._getEventHash(json);
            eventsXML.each( function(event) {
                event.value.set('drawn', false);
            });
            // This will be to find other events with the same date
            var otherEvents = new Hash(eventsXML);
            var balloon_footer = "<div id='applicationTeamCalendar_addNewEvent' class='application_action_link'>Add a new event</div>";
            //insert events in team calendar
            eventsXML.each( function(event) {
                if (!event.value.get('drawn')) {
                    var eventType = this._getEventByAppId(event.value.get('APPID').value, json.EWS.o_li_incapp.yglui_str_incap2); 
                    var eventBegDate = Date.parseExact(event.value.get('BEGDA').value, 'yyyy-MM-dd');
                    var eventEndDate = Object.isEmpty(event.value.get('ENDDA')) ? eventBegDate : Date.parseExact(event.value.get('ENDDA').value, 'yyyy-MM-dd');
                    var eventEmpId = event.value.get('PERNR').value;
                    var cell_id = eventEmpId + "_" + eventBegDate.toString('yyyyMMdd');
                    var allDay = event.value.get('ALLDF') ? (event.value.get('ALLDF').value == 'X' ? true : false) : false;
                    var comment = event.value.get('COMMENT') ? event.value.get('COMMENT').text : null;
                    var type = this._getEventSubtype(event);
                    var hours = event.value.get('STDAZ') ? event.value.get('STDAZ').value : "-";
                    var appId = eventType!='ERR' ? event.value.get('APPID').value : eventType;
                    //stop observing the click to create a new event
                    if (this.virtualHtml.down('[id=' + cell_id + '_content]')) {
                        this.virtualHtml.down('[id=' + cell_id + '_content]').stopObserving();
                        //create the event to insert it in the cell
                        var cell_id_content = "<div id='" + cell_id + "_event'>" + appId + "</div>";
                        this.virtualHtml.down('[id=' + cell_id + '_content]').insert(cell_id_content);
                        if ((this.eventCodes.get('ABS').get('appids').indexOf(appId) >= 0)  && allDay)
                            this.virtualHtml.down('[id='+cell_id+']').addClassName('applicationTeamCalendar_cellAbsent');
                        else if ((this.eventCodes.get('ABS').get('appids').indexOf(appId) >= 0) && !allDay)
                            this.virtualHtml.down('[id='+cell_id+']').addClassName('applicationTeamCalendar_cellPartAbsent');
                        //managers can see details of everybody's events. Employees can just see their own event details
                        if(( this.employeeRestriction ) || (!this.employeeRestriction && pernr == this.pernr) ){
                            //just put the hand cursor in owned cells
                            this.virtualHtml.down('[id=' + cell_id + '_event]').addClassName('applicationTeamCalendar_handCursor');
                            //creation of balloon content
                            var dateForBalloon = eventBegDate.toString(this.dateFormat) + ((eventType!='ERR'&&eventType!='HRZ'&&eventType!='INF')?(' - '+eventEndDate.toString(this.dateFormat)):'');
                            var eventStatus = this._getStatusOfEvent(event);
                            //event details: commment
                            var commentInEvent;
                            if(!Object.isEmpty(comment))
                                commentInEvent = "<span class='application_main_soft_text'>" + global.getLabel("comment")+ ": </span> " + comment;
                            else 
                                commentInEvent = global.getLabel('no_comments');
                                
                            //create the html content of the balloon
                            var eventSent = null;
                            if (event.value.get("APPID").value != "TSH_MGMT")
                                eventSent = this._getEvent(json, event.key);
                            else {
                                var position = parseInt(event.key.substring(event.key.lastIndexOf("_")+1));
		                        eventSent = this._getEvent(json, event.key, position);
                            }
                            var eventData = this._getEventData(event);
                            var balloon_content;
                            if(eventType=='ERR'||eventType=='HRZ'||eventType=='INF')
                                balloon_content = "<div class='application_action_link' onClick='global.open($H({ app: { appId: \"" + event.value.get('APPID').value + "\" , tabId: \"" + this.options.tabId + "\" , view: \"" + event.value.get('VIEW').value + "\" }, event: " + Object.toJSON(eventSent).gsub("'", "&#39;") + ", eventCodes: " + Object.toJSON(this.eventCodes).gsub("'", "&#39;") + ", employee: " + eventEmpId + ", eventInformation: " + Object.toJSON(eventData).gsub("'", "&#39;") + "}))'>" + type + "</div><p><span class='application_main_soft_text'>" + global.getLabel('date') + ": </span>" + dateForBalloon + "<br />"
                                                    + "<span class='application_main_soft_text'>" + global.getLabel('status') + ": </span>"+eventStatus
                                                    + "</p>";
                            else
                                balloon_content = "<div class='application_action_link' onClick='global.open($H({ app: { appId: \"" + event.value.get('APPID').value + "\" , tabId: \"" + this.options.tabId + "\" , view: \"" + event.value.get('VIEW').value + "\" }, event: " + Object.toJSON(eventSent).gsub("'", "&#39;") + ", eventCodes: " + Object.toJSON(this.eventCodes).gsub("'", "&#39;") + ", employee: " + eventEmpId + ", eventInformation: " + Object.toJSON(eventData).gsub("'", "&#39;") + "}))'>" + type + "</div><p><span class='application_main_soft_text'>" + global.getLabel('date') + ": </span>" + dateForBalloon + "<br />"
                                                    + "<span class='application_main_soft_text'>" + global.getLabel('nhours') + ": </span>"+hours+"<br /><span class='application_main_soft_text'>" + global.getLabel('status') + ": </span>"+eventStatus
                                                    + "<br />"+commentInEvent+"</p>";                                                     
                            //get other events with the same date
                            event.value.set('drawn', true);
                            // Delete selected event
                            otherEvents.unset(event.key);
                            otherEvents.each( function(otherEvent) {
                                if((!eventsXML.get(otherEvent.key).get('drawn')) && (otherEvent.value.get('BEGDA').value == eventBegDate.toString('yyyy-MM-dd'))){
                                    eventsXML.get(otherEvent.key).set('drawn', true);
                                    var otherEventEmpId = otherEvent.value.get('PERNR').value;
                                    var otherEventType = this._getEventByAppId(otherEvent.value.get('APPID').value, json.EWS.o_li_incapp.yglui_str_incap2);
                                    var otherAppId = otherEvent.value.get('APPID').value;
                                    this.virtualHtml.down('[id=' + cell_id + '_event]').insert('<div>' + otherAppId + '</div>');
                                    if ((this.virtualHtml.down('[id=' + cell_id + '_event]').childNodes.length > 2) && !(this.virtualHtml.down('[id=' + cell_id + '_moreEvents]').hasClassName('applicationTeamCalendar_cell_moreEvents')) )
                                        this.virtualHtml.down('[id=' + cell_id + '_moreEvents]').addClassName('applicationTeamCalendar_cell_moreEvents');
                                    var tempEndDate = !Object.isEmpty(otherEvent.value.get('ENDDA')) ? otherEvent.value.get('ENDDA').value : otherEvent.value.get('BEGDA').value; 
                                    var eventEndDateSpecific = Date.parseExact(tempEndDate, 'yyyy-MM-dd');
                                    var otherDateForBalloon = eventBegDate.toString(this.dateFormat) + ((otherEventType!='ERR'&&otherEventType!='HRZ'&&otherEventType!='INF')?(' - ' + eventEndDateSpecific.toString(this.dateFormat)):''); 
                                    eventStatus = this._getStatusOfEvent(otherEvent);
                                    //event details: commment
                                    var otherComment =  !Object.isEmpty(otherEvent.value.get('COMMENT')) ? otherEvent.value.get('COMMENT').text : "";
                                    if(!Object.isEmpty(otherComment))
                                        commentInEvent = "<span class='application_main_soft_text'>" + global.getLabel("comment") + ": </span> " + otherComment;
                                    else
                                        commentInEvent = global.getLabel('no_comments');
                                    //create the html content of the balloon
                                    var otherType = this._getEventSubtype(otherEvent);
                                    var otherHours = otherEvent.value.get('STDAZ') ? otherEvent.value.get('STDAZ').value : "-";
                                    var eventSent = null;
                                    if (event.value.get("APPID").value != "TSH_MGMT")
                                        eventSent = this._getEvent(json, otherEvent.key);
                                    else {
                                        var position = parseInt(otherEvent.key.substring(otherEvent.key.lastIndexOf("_")+1));
		                                eventSent = this._getEvent(json, otherEvent.key, position);
                                    }
                                    var otherEventData = this._getEventData(otherEvent);
                                    if(otherEventType=='ERR'||otherEventType=='HRZ'||otherEventType=='INF')
                                        balloon_content += "<div class='application_action_link' onClick='global.open($H({ app: { appId: \"" + otherEvent.value.get('APPID').value + "\" , tabId: \"" + this.options.tabId + "\" , view: \"" + otherEvent.value.get('VIEW').value + "\" }, event: " + Object.toJSON(eventSent).gsub("'", "&#39;") + ", eventCodes: " + Object.toJSON(this.eventCodes).gsub("'", "&#39;") + ", employee: " + otherEventEmpId + ", eventInformation: " + Object.toJSON(otherEventData).gsub("'", "&#39;") + "}))'>" + otherType + "</div><p><span class='application_main_soft_text'>" + global.getLabel('date') + ": </span>" + otherDateForBalloon + "<br />"
                                                    + "<span class='application_main_soft_text'>" + global.getLabel('status') + ": </span>"+eventStatus
                                                    + "</p>";
                                    else
                                        balloon_content += "<div class='application_action_link' onClick='global.open($H({ app: { appId: \"" + otherEvent.value.get('APPID').value + "\" , tabId: \"" + this.options.tabId + "\" , view: \"" + otherEvent.value.get('VIEW').value + "\" }, event: " + Object.toJSON(eventSent).gsub("'", "&#39;") + ", eventCodes: " + Object.toJSON(this.eventCodes).gsub("'", "&#39;") + ", employee: " + otherEventEmpId + ", eventInformation: " + Object.toJSON(otherEventData).gsub("'", "&#39;") + "}))'>" + otherType + "</div><p><span class='application_main_soft_text'>" + global.getLabel('date') + ": </span>" + otherDateForBalloon + "<br />"
                                                            + "<span class='application_main_soft_text'>" + global.getLabel('nhours') + ": </span>" + otherHours + "<br /><span class='application_main_soft_text'>" + global.getLabel('status') + ": </span>" + eventStatus
                                                            + "<br />" + commentInEvent + "</p>";
                                }
                            }.bind(this));
                            //declare the balloon
                            this.eventsBalloonInformation.set(cell_id, {
                                            events: balloon_content,
                                            footer: balloon_footer
                            });
                            this.virtualHtml.down('[id=' + cell_id + '_event]').observe('click', this._drawNewEventBalloon.bind(this, eventBegDate.toString('yyyyMMdd'), eventEmpId));
                        }//end if it's manager
                    }//end if !visited
                }
            }.bind(this));//end each
            //now we'll create or complete balloons for events which last more that a day
            var begDay,endDay,eventDays;
            eventsXML.each( function(event) {
                var eventEmpId = event.value.get('PERNR').value;
                this.isVeryLongEvent = false;
                //when the event lasts more than a day
                //calculate of the number of days between the begin date and the end date of the event
                begDay = Date.parseExact(event.value.get('BEGDA').value, 'yyyy-MM-dd').getOrdinalNumber();
                endDay = Object.isEmpty(event.value.get('ENDDA')) ? begDay : Date.parseExact(event.value.get('ENDDA').value, 'yyyy-MM-dd').getOrdinalNumber();
                eventDays = (endDay - begDay) + 1;
                //Control for very long events, to avoid infinite loop
                var begDateOf2Weeks = this.begDate.clone().add(-3).days();
                var endDateOf2Weeks = this.begDate.clone().add(9).days();
                var weekLength = this.currentWeek.length;
                var starts = Date.compare(begDateOf2Weeks, Date.parseExact(event.value.get('BEGDA').value, 'yyyy-MM-dd'));
                var ends;
                if (!Object.isEmpty(event.value.get('ENDDA')))
                    ends = Date.compare(Date.parseExact(event.value.get('ENDDA').value, 'yyyy-MM-dd'), endDateOf2Weeks);
                else
                    ends = Date.compare(Date.parseExact(event.value.get('BEGDA').value, 'yyyy-MM-dd'), endDateOf2Weeks);
                var virtualBegDate = Date.parseExact(event.value.get('BEGDA').value, 'yyyy-MM-dd');
                //if the event starts and ends in other weeks
                if ((eventDays > weekLength) && (starts == 1) && (ends == 1)) {
                    this.isVeryLongEvent = true;
                    eventDays = weekLength + 1;
                    virtualBegDate = this.begDate.clone().add(-4).days();
                }
                //if the event starts in this week, but finishes after
                if ((eventDays > weekLength) && (starts <= 0) && (ends == 1)) {
                    eventDays = weekLength + 1;
                }
                //if the event starts in another week, but ends in this one.
                if ((eventDays > weekLength) && (starts == 1) && (ends <= 0)) {
                    this.isVeryLongEvent = true;
                    eventDays = (endDay - begDateOf2Weeks.getOrdinalNumber()) + 2;
                    virtualBegDate = this.begDate.clone().add(-4).days();
                }
                if (eventDays > 1) {
                    var counter = 1;
                    for (var z = 1; z < eventDays; z++) {
                        var eventBegDate = Date.parseExact(event.value.get('BEGDA').value, 'yyyy-MM-dd');
                        var eventEndDate = Date.parseExact(event.value.get('ENDDA').value, 'yyyy-MM-dd');
                        var beg = this.isVeryLongEvent ? virtualBegDate : eventBegDate;
                        var begPlusZ = beg.clone().add(counter).days();
                        cell_id = pernr + "_" + begPlusZ.toString('yyyyMMdd');
                        var appId = event.value.get('APPID').value;
                        var allDay = event.value.get('ALLDF') ? (event.value.get('ALLDF').value == 'X' ? true : false) : false;
                        var comment = event.value.get('COMMENT').text;
                        var type = this._getEventSubtype(event);
                        var hours = event.value.get('STDAZ') ? event.value.get('STDAZ').value : "-";
                        var eventStatus = this._getStatusOfEvent(event);
                        var eventEmpId = event.value.get('PERNR').value;
                        if (this.virtualHtml.down('[id=' + cell_id + ']')) {
                            //if there is already another event
                            if (this.virtualHtml.down('[id='+cell_id+'_event]')) {
                                this.virtualHtml.down('[id='+cell_id+'_event]').insert("<div>" + appId + "</div>");
                                if ((this.virtualHtml.down('[id=' + cell_id + '_event]').childNodes.length > 2) && !(this.virtualHtml.down('[id=' + cell_id + '_moreEvents]').hasClassName('applicationTeamCalendar_cell_moreEvents')) )
                                    this.virtualHtml.down('[id=' + cell_id + '_moreEvents]').addClassName('applicationTeamCalendar_cell_moreEvents');
                            }
                            else {
                            //if there is no event yet in that cell. Also we check that the cell exists
                                if (this.virtualHtml.down('[id=' + cell_id + '_content]')) {
                                    this.virtualHtml.down('[id=' + cell_id + '_content]').stopObserving();
                                    var cell_id_content_x = "<div id='" + cell_id + "_event'>" + appId + "</div>";
                                    this.virtualHtml.down('[id=' + cell_id + '_content]').insert(cell_id_content_x);
                                }
                            }
                            //color of the cell
                            if((this.eventCodes.get('ABS').get('appids').indexOf(appId) >= 0) && allDay)
                                this.virtualHtml.down('[id=' + cell_id + ']').addClassName('applicationTeamCalendar_cellAbsent');
                            else if ((this.eventCodes.get('ABS').get('appids').indexOf(appId) >= 0) && !allDay)
                                    this.virtualHtml.down('[id='+cell_id+']').addClassName('applicationTeamCalendar_cellPartAbsent');
                            //see details in balloons. Just for manager, o owned if employee
                            if(( this.employeeRestriction ) || (!this.employeeRestriction && pernr == this.pernr) ){
                                //just put the hand cursor in owned cells
                                this.virtualHtml.down('[id=' + cell_id + '_event]').addClassName('applicationTeamCalendar_handCursor');
                                //creation of balloon content
                                var dateForBalloon = eventBegDate.toString(this.dateFormat) +' - '+ eventEndDate.toString(this.dateFormat);
                                var eventStatus = this._getStatusOfEvent(event);
                                //event details: commment
                                var commentInEvent;
                                if(!Object.isEmpty(comment))
                                    commentInEvent = "<span class='application_main_soft_text'>" + global.getLabel("comment") + ": </span> " + comment;
                                else
                                    commentInEvent = global.getLabel('no_comments');
                                //create the html content of the balloon
                                if (!this.eventsBalloonInformation.get(cell_id)) {
                                    //there is no balloon created yet in that cell
                                    var eventSent = null;
                                    if (event.value.get("APPID").value != "TSH_MGMT")
                                        eventSent = this._getEvent(json, event.key);
                                    else {
                                        var position = parseInt(event.key.substring(event.key.lastIndexOf("_")+1));
		                                eventSent = this._getEvent(json, event.key, position);
                                    }
                                    var eventData = this._getEventData(event);
                                    var balloon_content = "<div class='application_action_link' onClick='global.open($H({ app: { appId: \"" + event.value.get('APPID').value + "\" , tabId: \"" + this.options.tabId + "\" , view: \"" + event.value.get('VIEW').value + "\" }, event: " + Object.toJSON(eventSent).gsub("'", "&#39;") + ", eventCodes: " + Object.toJSON(this.eventCodes).gsub("'", "&#39;") + ", employee: " + eventEmpId + ", eventInformation: " + Object.toJSON(eventData).gsub("'", "&#39;") + "}))'>" + type + "</div><p><span class='application_main_soft_text'>" + global.getLabel('date') + " </span>" + dateForBalloon + "<br />"
                                                            + "<span class='application_main_soft_text'>" + global.getLabel('nhours') + ": </span>" + hours + "<br /><span class='application_main_soft_text'>" + global.getLabel('status') + ": </span>" + eventStatus
                                                            + "<br />" + commentInEvent + "</p>";
                                    //declare the balloon
                                    this.eventsBalloonInformation.set(cell_id, {
                                                    events: balloon_content,
                                                    footer: balloon_footer
                                    });
                                    this.virtualHtml.down('[id=' + cell_id + '_event]').observe('click', this._drawNewEventBalloon.bind(this, begPlusZ.toString('yyyyMMdd'), eventEmpId));
                                }
                                else{
                                    //there is already a balloon with other events information. 
                                    //We'll append the current event info to the bottom
                                    var old_content = this.eventsBalloonInformation.get(cell_id).events;
                                    var eventSent = null;
                                    if (event.value.get("APPID").value != "TSH_MGMT")
                                        eventSent = this._getEvent(json, event.key);
                                    else {
                                        var position = parseInt(event.key.substring(event.key.lastIndexOf("_")+1));
		                                eventSent = this._getEvent(json, event.key, position);
                                    }
                                    var eventData = this._getEventData(event);
                                    var new_content = old_content + "<div class='application_action_link' onClick='global.open($H({ app: { appId: \"" + event.value.get('APPID').value + "\" , tabId: \"" + this.options.tabId + "\" , view: \"" + event.value.get('VIEW').value + "\" }, event: " + Object.toJSON(eventSent).gsub("'", "&#39;") + ", eventCodes: " + Object.toJSON(this.eventCodes).gsub("'", "&#39;") + ", employee: " + eventEmpId + ", eventInformation: " + Object.toJSON(eventData).gsub("'", "&#39;") + "}))'>" + type + "</div><p><span class='application_main_soft_text'>" + global.getLabel('date') + ": </span>" + dateForBalloon + "<br />"
                                                            + "<span class='application_main_soft_text'>" + global.getLabel('nhours') + ": </span>" + hours + "<br /><span class='application_main_soft_text'>" + global.getLabel('status') + ": </span>" + eventStatus
                                                            + "<br />" + commentInEvent + "</p>";
                                    //declare the balloon
                                    this.eventsBalloonInformation.set(cell_id, {
                                                    events: new_content,
                                                    footer: balloon_footer
                                    });
                                    this.virtualHtml.down('[id=' + cell_id + '_event]').stopObserving();
                                    this.virtualHtml.down('[id=' + cell_id + '_event]').observe('click',this._drawNewEventBalloon.bind(this, begPlusZ.toString('yyyyMMdd'), eventEmpId));
                                }
                            }//end if
                        }//end if
                    counter ++;
                    }//end for (var z=1; z<eventDays; z++)
                }//end if
            }.bind(this));//end each
        }//enf if wsXMLLength> 0
    },
    /**
     *@param event Hash with event's information
     *@description Returns the event subtype
     */
    _getEventSubtype: function(event) {
        if (event.value.get('AWART'))
            return event.value.get('AWART').text;
        else if (event.value.get('SUBTY'))
            return event.value.get('SUBTY').text;
        else if (event.value.get('VTART'))
            return event.value.get('VTART').text;
        else if (event.value.get('ZTART')){
            if(event.value.get("ANZHL"))
                return ("#"+event.value.get('ZTART').text + ": " + event.value.get("ANZHL").value);
            else 
                return event.value.get('ZTART').text;
        }
        else if (event.value.get('SATZA'))
            return global.getLabel("timeInfo");
        else if (event.value.get('LDATE'))
            return global.getLabel("timeError");
        else     
            return "---";
    },
    /**
     *@param date Date whose week we want to set
     *@param redefineWeek Says if it is neccesary to recalculate the week
     *@description Parses the xml and redraws the calendar table: top labels and employees rows
     */
	_changeWeek: function(date, redefineWeek) {
	    if (Object.isEmpty(redefineWeek))
	        redefineWeek = true;
        this.currentWeek.clear();
        //draw the top tabel (date and texts): Mo 01, Tu 02...
        // HEADER HTML
        // Beg date - end date TodayButton DatePicker
        // If first day of the week is Sunday...
        if (redefineWeek) {
		var week = 0;
		if (date.getWeek() > 52)
			week = date.getWeek() - 52;
		else
			week = date.getWeek();
            if (global.calendarsStartDay < 1)
		this.begDate = date.clone().setWeek(week).moveToDayOfWeek(0, -1);
            // If not...
            else {
                // If first day of the week is not Sunday or Monday...
                if (global.calendarsStartDay > 1)
			this.begDate = date.clone().setWeek(week).moveToDayOfWeek(global.calendarsStartDay);
                // If first day of the week is Monday...
                else
			this.begDate = date.clone().setWeek(week);
            }
            this.endDate = this.begDate.clone().addDays(6);
            if(! date.between(this.begDate, this.endDate)) {
                this.begDate.addDays(-7);
                this.endDate.addDays(-7);
            }
        }
        else {
            this.begDate = date.clone();
            this.endDate = this.begDate.clone().addDays(6);
        }
        this.begDateLabel = this.begDate.toString('ddd').toLowerCase();
        this.endDateLabel = this.endDate.toString('ddd').toLowerCase();
        this._getTopTableLabels(this.begDate);
        this.virtualHtml.down('[id=applicationTeamCalendar_currentWeek]').update(global.labels.get(this.begDateLabel) + " " + this.begDate.toString(this.dateFormat) + " - " + global.labels.get(this.endDateLabel) + " " + this.endDate.toString(this.dateFormat));
        this._drawTopOfTable();
        //Check if it's a manager or not. Depending on that, the functionality is slightly different
        if (this.employeeRestriction) {
            //if manager
            var length = this.selectedEmployees.keys().length;
            if (length > 0) {
                for(var i = 0; i < length; i++) {
                    var id = this.selectedEmployees.keys()[i];
                    var employee = this.selectedEmployees.get(id);
                    var oType = employee.otype;
                    //draw the empty calendar
                    this._drawCalendarRow(id, employee.name, employee.color);
                    //insert the events and ws
                    this._callToGetEvents(id, oType);
                }
            }
        }
        else {
            //if employee
            var length = this.myTeam.keys().length;
            if (length > 0) {
                for(var i = 0; i < length; i++){
                    var id = this.myTeam.keys()[i];
                    if (this.myTeam.get(id).get("selected")) {
                        //draw the empty calendar
                        this._drawCalendarRow(id, this.myTeam.get(id).get("name"), this.myTeam.get(id).get("color"));
                        //insert the events and ws
                        this._callToGetEvents(id, this.myTeam.get(id).get("otype"));
                    }
                }
            }
        }
	},
    /**
     *@description When the user clicks on today button, if we are not viewing "today" week, load it
     */
    _clickOnToday: function (){
        var beg, end;
        if (global.calendarsStartDay < 1)
            beg = this.today.clone().setWeek(this.today.getWeek()).moveToDayOfWeek(0, -1);
        // If not...
        else {
            // If first day of the week is not Sunday or Monday...
            if (global.calendarsStartDay > 1)
                beg = this.today.clone().setWeek(this.today.getWeek()).moveToDayOfWeek(global.calendarsStartDay);
            // If first day of the week is Monday...
            else
                beg = this.today.clone().setWeek(this.today.getWeek());
        }
        end = beg.clone().addDays(6);
        //if today is not within the current week
        if(! this.begDate.between(beg,end)){
            this.menuBalloonOpened = false;
            this._calLabels(this.today);
            this.datePicker.reloadDefaultDate();
        }
    },
    /**
     *@description Delete the calendar for old date and calls a method to redraw what its needed
     */
	_changeWeekHandler: function() {
        //get the new selected date
        var date = this.datePicker.actualDate;
        //reload teamCalendar (the table with top and employees rows)
        this._calLabels(date);
	},
    /**
     *@param args Selected employee's information
     *@description When an employee is selected, we draw his/her calendar
     */
    onEmployeeSelected: function(args) {
        var selectedEmployees = this.getSelectedEmployees().toArray();
        if ((selectedEmployees.length > 0) && (!this.virtualHtml.down('[id=applicationTeamCalendar_body]').visible())) {
            this.virtualHtml.down('[id=applicationTeamCalendar_body]').show();
            this.virtualHtml.down('[id=applicationTeamCalendar_message]').hide();
        }
        var employeeId = args.id;
        var employeeName = args.name;
        var employeeColor = global.getColor(employeeId);
        var oType = args.oType;
        //check that the calendar is not already drawn
        if(! this.virtualHtml.down('[id='+employeeId+'_teamCalendar]')) {
            if (this.employeeRestriction)
                this.selectedEmployees.set(employeeId, { 'name': employeeName, 'color': employeeColor, 'otype': oType });
            else
                this.myTeam.get(employeeId).set('selected', true);
            //draw empty calendar
            this._drawCalendarRow(employeeId, employeeName, employeeColor);
            this._callToGetEvents(employeeId, oType);
        }
    },
    /**
     *@param args Unselected employee's information
     *@description When an employee is unselected, we hide his/her calendar
     */
    onEmployeeUnselected: function(args) {
	    var employeeId = args.id;
        //if the employee exists (has a calendar drawn)
        if (this.virtualHtml.down('[id=' + employeeId + '_teamCalendar]')){
            //remove his calendar from the team calendar
            this.virtualHtml.down('[id=' + employeeId + '_teamCalendar]').remove();
            //if manager:  remove the empId from this.selectedEmployees
            if (this.employeeRestriction) {
                this.selectedEmployees.unset(employeeId);
            }
            else
                this.myTeam.get(employeeId).set('selected', false);
        }
        var selectedEmployees = this.getSelectedEmployees().toArray();
        if(selectedEmployees.length == 0) {
            this.virtualHtml.down('[id=applicationTeamCalendar_body]').hide();
            this.virtualHtml.down('[id=applicationTeamCalendar_message]').show();
        }
    },
    /**
     *@param workschedules Workschedule of the week
     *@param a Day within the week
     *@param pernr EmployeeId
     *@param begEndDate Date of the day clicked
     *@description Calls sap to get details or retrieve from hash (class attribute)
     */
    _callToGetDWSDetails: function(pernr, begEndDate){
        var date = Date.parseExact(begEndDate, 'yyyyMMdd').toString('yyyy-MM-dd');
        //call GET_DWS_DTAILS if the user wants to see ws details
        var xmlGetDWS = "<EWS>" +
                        "<SERVICE>GET_DWS_DTAILS</SERVICE>" +
                        "<PARAM>" +
                            "<o_begda>" + date + "</o_begda>" +
                            "<o_endda>" + date + "</o_endda>" +
                            "<o_pernr>" + pernr + "</o_pernr>" +
                        "</PARAM>" +
                        "</EWS>";
        this.makeAJAXrequest($H({xml:xmlGetDWS, successMethod:'_getDWSDetails'}));
    },
    /**
     *@param json JSON from GET_DWS_DTAILS service
     *@description Retrieves the details of the ws and call a method to create a balloon with this information
     */
    _getDWSDetails: function(json) {
        //get content
        var codeWS = json.EWS.o_tprog;
        var contentWS = json.EWS.o_dws_details['@ttext'];
        var contentPlannedWH = json.EWS.o_dws_details['@sollz'];
        var contentPlannedWT_begin = json.EWS.o_dws_details['@sobeg'];
        var contentPlannedWT_end = json.EWS.o_dws_details['@soend'];
        var contentPlannedWT = contentPlannedWT_begin + " - " + contentPlannedWT_end;
        var hashOfWscTypes = new Hash();
        hashOfWscTypes.set(0, {wsFrom: json.EWS.o_dws_details['@btbeg'], wsText: json.EWS.labels.item[0]['@value'], wsTo: json.EWS.o_dws_details['@btend']});
        hashOfWscTypes.set(1, {wsFrom: json.EWS.o_dws_details['@etbeg'], wsText: json.EWS.labels.item[1]['@value'], wsTo: json.EWS.o_dws_details['@etend']});
        hashOfWscTypes.set(2, {wsFrom: json.EWS.o_dws_details['@f1beg'], wsText: json.EWS.labels.item[2]['@value'], wsTo: json.EWS.o_dws_details['@f1end']});
        hashOfWscTypes.set(3, {wsFrom: json.EWS.o_dws_details['@f2beg'], wsText: json.EWS.labels.item[3]['@value'], wsTo: json.EWS.o_dws_details['@f2end']});
        hashOfWscTypes.set(4, {wsFrom: json.EWS.o_dws_details['@k1beg'], wsText: json.EWS.labels.item[4]['@value'], wsTo: json.EWS.o_dws_details['@k1end']});
        hashOfWscTypes.set(5, {wsFrom: json.EWS.o_dws_details['@k2beg'], wsText: json.EWS.labels.item[5]['@value'], wsTo: json.EWS.o_dws_details['@k2end']});
        hashOfWscTypes.set(6, {wsFrom: json.EWS.o_dws_details['@k3beg'], wsText: json.EWS.labels.item[6]['@value'], wsTo: json.EWS.o_dws_details['@k3end']});
        hashOfWscTypes.set(7, {wsFrom: json.EWS.o_dws_details['@pabeg'], wsText: json.EWS.labels.item[7]['@value'], wsTo: json.EWS.o_dws_details['@paend']});
        hashOfWscTypes.set(8, {wsFrom: json.EWS.o_dws_details['@v1beg'], wsText: json.EWS.labels.item[8]['@value'], wsTo: json.EWS.o_dws_details['@v1end']});
        hashOfWscTypes.set(9, {wsFrom: json.EWS.o_dws_details['@v2beg'], wsText: json.EWS.labels.item[9]['@value'], wsTo: json.EWS.o_dws_details['@v2end']});
        this.wsInformation.set(codeWS, {
                            contentWS: contentWS,
                            contentPlannedWH: contentPlannedWH,
                            contentPlannedWT: contentPlannedWT,
                            hashOfWscTypes: hashOfWscTypes
                            });
        //div id: to know where the user clicked
        var employeeID = json.EWS.o_pernr;
        var date = Date.parseExact(json.EWS.o_begda, 'yyyy-MM-dd').toString('yyyyMMdd');
        this._drawDWSBalloon(employeeID, date, codeWS);
    },
    /**
     *@param employeeId Id of the employee whose calendar was clicked
     *@param date Date of the cell which was clicked
     *@param codeWS Code of the worschedule
     *@description Creates a balloon with information about the ws
     */    
    _drawDWSBalloon: function(employeeId, date, codeWS){
        var labWS = global.getLabel('work_schedule');
        var labPlannedWH = global.getLabel('planned_wh');
        var labPlannedWS = global.getLabel('planned_wt');
        var labFrom = global.getLabel("from");
        var labTo = global.getLabel("to");
        var labType = global.getLabel('type');
        var balloon_content = "<p><span class='application_main_soft_text'>"+labWS+":</span> "+this.wsInformation.get(codeWS).contentWS+"<br /><span class='application_main_soft_text'>"
                              +labPlannedWH+":</span> "+this.wsInformation.get(codeWS).contentPlannedWH+"<br /><span class='application_main_soft_text'>"
                              +labPlannedWS+":</span> "+"<br />"+this.wsInformation.get(codeWS).contentPlannedWT+"</p>";
        //If the planned working hours are not 0.0
        if(this.wsInformation.get(codeWS).contentPlannedWH != "0.0"){
            //TABLE
            var table = new Element('table', {
                id: 'ws_table',
                'cellspacing': '10'
            });
            var tbody = new Element('tbody', {
                id: 'tbody'
            });
            //first row  FROM-TO-TYPE
            var tr1 = new Element('tr');
            var td_from = new Element('td').insert("<span class='application_main_soft_text'><u>"+labFrom+"</u></span>");
            tr1.insert(td_from);
            var td_to = new Element('td').insert("<span class='application_main_soft_text'><u>"+labTo+"</u></span>");
            tr1.insert(td_to);
            var td_type = new Element('td').insert("<span class='application_main_soft_text'><u>"+labType+"</u></span>");
            tr1.insert(td_type);
            tbody.insert(tr1);
            //Remaining rows: information about wsc types
            for (var i = 0; i < this.wsInformation.get(codeWS).hashOfWscTypes.keys().length; i++) {
                var value_from = this.wsInformation.get(codeWS).hashOfWscTypes.get(i).wsFrom;
                var value_to = this.wsInformation.get(codeWS).hashOfWscTypes.get(i).wsTo;
                if(!(value_from == "  :  :  " || value_from == "00:00:00" || value_to == "  :  :  " || value_to == "00:00:00")){
                    var tr_loop = new Element('tr');
                    var td_from_loop = new Element('td').insert(value_from);
                    tr_loop.insert(td_from_loop);
                    var td_to_loop = new Element('td').insert(value_to);
                    tr_loop.insert(td_to_loop);
                    var td_type_loop = new Element('td').insert(this.wsInformation.get(codeWS).hashOfWscTypes.get(i).wsText);
                    tr_loop.insert(td_type_loop);
                    tbody.insert(tr_loop);
                }
            }
            table.insert(tbody);
            balloon_content += "<table id='ws_table' cellspacing='10' "+table.innerHTML+"</table>";
        }
        //create the balloon
        var div_id = employeeId+"_"+date+"_ws_teamCalendar";
        balloon.showOptions($H({domId: div_id, content: balloon_content}));
    },
    /**
     *@param json JSON from GET_MYTEAM service
     *@description Retrieves the team members (name and Id), and creates a drop down list with them
     */
    _asEmp_insertMyTeam: function(json) {
		var employees = null;
		var populations = objectToArray(json.EWS.o_population.yglui_str_population);
		// Only EMP population
		if (populations.length == 1)
            employees = objectToArray(json.EWS.o_population.yglui_str_population.population.yglui_str_popul_obj);
        // More than one population
        else {
            for (var i = 0; (i < populations.length) && Object.isEmpty(employees); i++) {
                if (populations[i]['@population_id'] == 'EMP')
                    employees = objectToArray(populations[i].population.yglui_str_popul_obj);
            }
        }
        //keeping ids and name as a hash for each employee
        var empHash = new Hash();
        //Previous selected employee (logged one)
        var idSelected = '---';
        if (this.myTeam.keys().length > 0)
            idSelected = this.myTeam.keys()[0];
        for (var i = 0; i < employees.length ; i++){
            var color;
            //random color
            var rand_no = Math.random();
            rand_no = rand_no * 16;
            color = Math.ceil(rand_no);
            // Previous selected employee
            if (employees[i]['@objid'] == idSelected)
                color = this.myTeam.get(this.myTeam.keys()[0]).get('color');
            //creation of the hash of employees: [id{name, color, selected}]; Selectes = true when his/her calendar is shown
            var selected = false;
            // Previous selected employee
            if ((idSelected != '---') && ((idSelected == employees[i]['@objid'])))
                selected = true;
            empHash.set(employees[i]['@objid'], $H({ 
                name: employees[i]['@name'],
                color: color,
                selected: selected,
                otype: employees[i]['@otype']
            }));
        }
        //keep all team members in this.myTeam
        this.myTeam = empHash;
        //insert the drop down list in the html
	    var string = "<form name='formEmployees' method='post'><select id='applicationTeamCalendar_myTeamDropList' name='year'>";
        string += "<option value='none_selected'>" + global.getLabel("selectEmp") + "</option>";
	    //insert the new values in the list
	    for(var j=0; j<(this.myTeam).keys().length; j++){
            string += "<option value='"+(this.myTeam).keys()[j]+"'>"+this.myTeam.get((this.myTeam).keys()[j]).get("name")+"</option>";
	    }
	    string += "</select></form>" +
	              "<span id='applicationTeamCalendar_linkSelectAll' class='applicationTeamCalendar_handCursor applicationTeamCalendar_alignText application_action_link'>" +
	              this.selectAllLabel + 
	              "</span><br /><br />";
        //insert the list in the html
	    this.virtualHtml.down('[id=applicationTeamCalendar_dropList]').update(string);
        //when clicking linkSelectAll we'll call employeeSelectedHandler for everybody in the team
        this.virtualHtml.down('[id=applicationTeamCalendar_linkSelectAll]').observe('click', function(){
            this.myTeam.each( function(pair) {
                this.onEmployeeSelected({ id: pair.key, name: pair.value.name, color: pair.value.color, oType: pair.value.otype });
            }.bind(this));
        }.bind(this));
        //observe if another employee is selected
        this.virtualHtml.down('[id=applicationTeamCalendar_myTeamDropList]').observe('change', function(){
                var emp = this.virtualHtml.down('[id=applicationTeamCalendar_myTeamDropList]').options[this.virtualHtml.down('[id=applicationTeamCalendar_myTeamDropList]').selectedIndex].value;
                if(emp != 'none_selected'){
                    //mark "select an employee" as selected
                    this.virtualHtml.down('[id=applicationTeamCalendar_myTeamDropList]')[this.virtualHtml.down('[id=applicationTeamCalendar_myTeamDropList]').options[this.virtualHtml.down('[id=applicationTeamCalendar_myTeamDropList]').selectedIndex].index].selected = false;
                    this.virtualHtml.down('[id=applicationTeamCalendar_myTeamDropList]')[0].selected = true;
                    var employee = this.myTeam.get(emp);
                    this.onEmployeeSelected({ id: emp, name: employee.get('name'), color: employee.get('color'), oType: employee.get('otype') });
                }
        }.bind(this));
    },
    /**
     *@param xmlCalMenu Xml_in of GET_CAL_MENU service
     *@description Makes an AJAX request with the xml provided
     */
    _callToGetCalMenu: function(xmlCalMenu, balloonId){
            this.makeAJAXrequest($H({xml: xmlCalMenu, successMethod: '_getCalMenu', ajaxID: balloonId}));
    },
    /**
     *@param json JSON from GET_CON_ACTIO service
     *@description Retrieves the menu opcion for empty cells and creates a balloon with that menu
     */
    _getCalMenu: function(json, ID){
        if (!this.menuBalloonOpened)
            this.menuBalloonOpened = true;
	    var employeeID = ID.split('_')[0];
	    var date =  ID.split('_')[1];
        //div id
        var div_id = employeeID + "_" + date;
        var employeeName = this.getEmployee(employeeID).name;
        var parsedDate = Date.parseExact(date, 'yyyyMMdd').toString('yyyy-MM-dd');
        //get menu items
        var menuItems = Object.isEmpty(json.EWS.o_actions) ? [] : objectToArray(json.EWS.o_actions.yglui_vie_tty_ac);
        var actionsList = new Element("ul", {
            "class": "applicationTeamCalendar_optionList"
        });
        for(var i = 0; i < menuItems.length; i++) {
            var id = menuItems[i]['@actio'];
            var appId;
            switch (id) {
                case "ABSENCE": appId = "ABS"; break;
                case "ATTENDANCE": appId = "ATT"; break;
                case "AVAILABILITY": appId = "AVL"; break;
                case "OVERTIME": appId = "OVT"; break;
                case "SUBSTITUTION": appId = "SUB"; break;
                default: appId = "---"; break;
            }
            var event = this._getEmptyEvent(employeeID, employeeName, appId, parsedDate);
            //create the balloon content
            var label = menuItems[i]['@actiot'];
            var pieces = label.split("((L))");
            var view = menuItems[i]['@views'];
            var actionText = pieces[0] + "<span class='application_action_link' onClick='global.open($H({ app: { appId: \"" + appId + "\" , tabId: \"" + this.options.tabId + "\" , view: \"" + view + "\" }, event: " + Object.toJSON(event) + ", eventCodes: " + Object.toJSON(this.eventCodes) + "}))'>" + pieces[1] + "</span>" + pieces[2];
            var listElement = new Element("li").update(actionText);
			actionsList.insert(listElement);
        }
        //instantiate the balloon
        balloon.showOptions($H({domId: div_id+'_content', content: actionsList}));
    },
    /**
    * @param begEndDate Begin/end date for GET_CAL_MENU service
    * @param pernr Employee's personal number for GET_CAL_MENU service
    * @description Creates a balloon with information for creating a new event
    */
    _drawNewEventBalloon: function(begEndDate, pernr) {
        balloon.showOptions($H({
            domId: pernr + "_" + begEndDate + "_event",
            content: this.eventsBalloonInformation.get(pernr + "_" + begEndDate).events + this.eventsBalloonInformation.get(pernr + "_" + begEndDate).footer
        }));
        var xmlCalMenu = "<EWS>"
                        + "<SERVICE>GET_CON_ACTIO</SERVICE>"
                        + "<OBJECT TYPE='P'>" + pernr + "</OBJECT>"
                        + "<PARAM>"
                        + "<CONTAINER>CAL_MGM</CONTAINER>"
                        + "<MENU_TYPE>N</MENU_TYPE>"
                        + "</PARAM>"
                        + "</EWS>";
		//Accesing the balloon to add the click event on it. Out of the application DOM scope
		//so $() is used instead of this.virtualHtml.down()
        $('applicationTeamCalendar_addNewEvent').observe('click', this._callToGetCalMenu.bind(this, xmlCalMenu, pernr + '_'+ begEndDate + '_content'));
    },
    /**
    * @description Toggles the filter form
    */
    _toggleFilterOptions: function() {
        this.filterElement.toggle();
    },
    /**
    * @description Does a refresh
    */
    _refreshButtonClicked: function() {
        var selectedEmployees = this.employeeRestriction ? this.getSelectedEmployees().toArray() : this.myTeam.toArray();
        selectedEmployees.each( function(pern) {
            var show = true;
            if (!this.employeeRestriction) {
                var selected = !Object.isEmpty(pern.value.selected) ? pern.value.selected : pern.value.get('selected');
                if (!selected)
                    show = false;
            }
            if (show) {
                var id = pern.key;
                var name = !Object.isEmpty(pern.value.name) ? pern.value.name : pern.value.get('name');
                var color = !Object.isEmpty(pern.value.color) ? pern.value.color : pern.value.get('color');
                var oType = !Object.isEmpty(pern.value.oType) ? pern.value.oType : pern.value.get('oType');
                this.virtualHtml.down('[id=' + id + '_teamCalendar]').remove();
                this._drawCalendarRow(id, name, color);
                this._callToGetEvents(id, oType);
            }
        }.bind(this));
    },
    /**
     *@description Returns the event type by its appId
     *@param {String} appId The application id
     *@param {Array} incapp Structure that contents the type event and its appId
     *@returns {String} The event type
     */
    _getEventByAppId: function(appId, incapp){
        var result;
        incapp.each(function(item){
            if(item['@appid'] == appId){
                result = item["@event"];
                throw $break;
            }
        }.bind(this));
        return result;
    },
    /**
     *@param json JSON from GET_EVENTS
     *@description Once the calendar is drawn, complete it with the events and workschedule (after an error)
     */
    _insertEventsError: function(json, ID) {
        this._errorMethod(json);
        this._insertEvents(json, ID);
    },
    /**
    * @description Returns an event's essential information
    * @param {Hash} event Event from parent calendar
    * @returns {JSON} Event data
    */
    _getEventData: function(event) {
        var data = event.value;
        // Dates' calculation
        var begDate;
        if(data.get("DATUM"))
            begDate = data.get("DATUM").value;
        else if(data.get("BEGDA"))
            begDate = data.get("BEGDA").value;
        else
            begDate = data.get("LDATE").value;
        var begTime = data.get("BEGUZ") ? data.get("BEGUZ").value : "00:00:00";
        if (begTime == "24:00:00")
            begTime = "00:00:00";
        if(data.get("ENDDA")) {
            var endDate = data.get("ENDDA").value;
            var endTime = data.get("ENDUZ") ? data.get("ENDUZ").value : "00:00:00";
            if (endTime == "24:00:00")
                endTime = "00:00:00";
        }
        else {
            var endDate = begDate;
            var endTime = begTime;
        }
        var begDateObject = sapToObject(begDate, begTime);
        var endDateObject = sapToObject(endDate, endTime);
        // Event text
        var eventText;
        if (data.get("AWART")) {
            eventText = data.get("AWART").text;
        } else if(data.get("SUBTY")) {
            eventText = data.get("SUBTY").text;
        } else if(data.get("VTART")) {
            eventText = data.get("VTART").text;
        } else if (data.get("ZTART")) {
            eventText = data.get("ZTART").text;
        } else if (data.get("SATZA")) {
            eventText = global.getLabel("timeInfo");
        } else if (data.get("LDATE")) {
            eventText = global.getLabel("timeError");
        } else {
            eventText = "NOTEXT";
        }
        if (data.get("ANZHL"))
            eventText = data.get("ANZHL").value + " " + eventText;
        var eventData = {
            begDate: begDateObject,
            endDate: endDateObject,
            daysLength: data.get("ABWTG") ? data.get("ABWTG").value : 0,
            hoursLength: data.get("STDAZ") ? data.get("STDAZ").value : 0,
            // Will be false if "value" parameter doesn't exists
            allDay: data.get("ALLDF") && data.get("ALLDF").value && data.get("ALLDF").value.toLowerCase() == "x" || data.get("SATZA") != undefined || data.get("LDATE") != undefined,
            text: eventText,
            pernr: data.get("PERNR").value,
            id: event.key,
            status: data.get("STATUS"),
            appId: data.get("APPID").value,
            view: data.get("VIEW") ? data.get("VIEW").value : ""
        };
        return eventData;
    }
});