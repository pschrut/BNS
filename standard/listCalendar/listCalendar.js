/**
 *@fileOverview listCalendar.js
 *@description It contains a class with functionality for showing a list of time events associated with some user/s.
 */
/**
 *@constructor
 *@description Class with functionality for showing a list of time events associated with some user/s
 *@augments Application
 */
var listCalendar = Class.create(parentCalendar,
/** 
 *@lends listCalendar
 */
{
    /**
     *@type DatePicker
     *@description Begining date
     */
    begDatePicker: null,
    /**
     *@type DatePicker
     *@description Ending date
     */
    endDatePicker: null,
    /**
     *@type Boolean
     *@description Says if the table was showed
     */
    tableShowed: false,
    /**
     *@type Number
     *@description Contains the found events' number
     */
    currentResultsLength: 0,
    /**
     *@type Array
     *@description List of selected employees
     */
    employees: [],
    /**
     *@type String
     *@description Label for "Show all"
     */
    showAll: "",
    /**
     *@type String
     *@description Label for "Hide all"
     */
    hideAll: "",
    _tableLoaded: null,
    _alreadyRunning: null,
    /**
     *@type String
     *@description Date format from global
     */
    dateFormat: "dd.MM.yyyy",   // global.getOption("dateFormat")
/**
* @type Element
* @description Error message when end date is earlier than begin date
*/
errorDateMsg: null,

    /**
     *Constructor of the class listCalendar
     */
    initialize: function($super, options) {
        $super(options);
        this._checkSelectedEmployeesBinding = this._checkSelectedEmployees.bind(this);
        this._tableLoaded = false;
        this._eventsLoaded = new Hash();
        this._numResultHash = $H();
        this.currentResultsLength = 0;
        this.refreshButtonClickedBinding = this._refreshButtonClicked.bind(this);
        this._toggleFilterOptionsBind = this._toggleFilterOptions.bind(this);
    },
    /**
     *@description Starts listCalendar
     */
    run: function($super) {
        if(!this._alreadyRunning) {
            this._alreadyRunning = true;
            $super();
            if (this.firstRun)
                this._setInitialHTML();
            else {
                if (!this._tableLoaded)
                    this._refreshButtonClicked();
            }
            if (this.refresh) {
                this._refreshButtonClicked();
                this.refresh = false;
            }
            document.observe('EWS:calendar_refreshButtonClicked_listCalendar', this.refreshButtonClickedBinding);
            document.observe('timeFilter_button_listCalendar', this.refreshButtonClickedBinding);
        }
    },
    /**
     *@description Stops listCalendar
     */
    close: function($super) {
        this._alreadyRunning = false;
        $super();
        document.stopObserving('EWS:calendar_refreshButtonClicked_listCalendar', this.refreshButtonClickedBinding);
        document.stopObserving('timeFilter_button_listCalendar', this.refreshButtonClickedBinding);
    },
    /**
     *@description Gets information from the backend and builds the HTML code corresponding to the form that will filter the events
     */
    _setInitialHTML: function() {
        // HTML
        var html = "<div id='applicationlistCalendar_content'>"+
            "<div class='applicationlistCalendar_form'>" +
            "<span id='applicationlistCalendar_form_fromLabel' class='application_main_text'>" + global.getLabel('from') + "</span>" +
            "<div class='applicationlistCalendar_form_calendar'>" +
            "<div id='applicationlistCalendar_form_begCal'></div>" +
            "</div>" +
            "<span id='applicationlistCalendar_form_toLabel' class='application_main_text'>" + global.getLabel('to') + "</span>" +
            "<div class='applicationlistCalendar_form_calendar'>" +
            "<div id='applicationlistCalendar_form_endCal'></div>" +
            "</div>" +
            "<div id='applicationlistCalendar_form_divButton'></div>" +
            "<div id='applicationlistCalendar_form_filterLabel' class='application_action_link'></div>" +
            "</div>";
        var json = {
            elements:[]
        };
        var aux =   {
            idButton:'applicationlistCalendar_form_button',
            label: global.getLabel('refresh'),
            handlerContext: null,
            handler: this._checkSelectedEmployees.bind(this,true),
            type: 'button',
            standardButton: true
        };
        json.elements.push(aux);
        var ButtonListCalendar=new megaButtonDisplayer(json);
        this.virtualHtml.insert(html);

        this.errorDateMsg = new Element('div', { 'id': 'errorDateMsg', 'class': 'datePicker_pulsate_div_css' });
        this.errorDateMsg.insert('End date earlier than start date');
        this.errorDateMsg.hide();
        this.virtualHtml.insert(this.errorDateMsg);

        this.virtualHtml.down('[id=applicationlistCalendar_form_divButton]').insert(ButtonListCalendar.getButtons());
        this.virtualHtml.insert(this.filterElement);
        html = "<div id='applicationlistCalendar_results' style='display: none;'></div>"+
            "<div id='applicationlistCalendar_status'></div>"+
            "<div class='listCalendar_clearBoth'>&nbsp;</div></div>";
        this.virtualHtml.insert(html);
            
        this.virtualHtml.down('[id=applicationlistCalendar_results]').update(this._createTableStructure());
        // DatePickers definition
        var begDate = Date.today().moveToFirstDayOfMonth();
        begDate = begDate.toString('yyyyMMdd');
        var endDate = Date.today().moveToLastDayOfMonth();
        endDate = endDate.toString('yyyyMMdd');
        this.begDatePicker = new DatePicker('applicationlistCalendar_form_begCal', {
            defaultDate: begDate,
            draggable: true,
            manualDateInsertion: true
        });
        this.endDatePicker = new DatePicker('applicationlistCalendar_form_endCal', {
            defaultDate: endDate,
            draggable: true,
            manualDateInsertion: true
        });
        this.begDatePicker.linkCalendar(this.endDatePicker);
    },
    _refreshButtonClicked: function() {
        this._eventsLoaded = new Hash();
        this._numResultHash = $H();
        this._checkSelectedEmployees();
    },
    _toggleFilterOptions: function() {
        this.filterElement.toggle();
        this.virtualHtml.down("[id='applicationlistCalendar_form_button']").toggle();
    },
    /**
     *@description Gets information from the back-end about all the events that will be showed
     */
    _getEvents: function(employee) {
        var selectedEmployees = this.getSelectedEmployees().toArray();
        if(selectedEmployees.length == 0) {
            this.virtualHtml.down('[id=applicationlistCalendar_results]').hide();
            this.employees = [];
            var html = "<div class='application_main_soft_text listCalendar_clearBoth listCalendar_noEventsFound'>" + global.getLabel("selectEmployeePlease") + "</div>";
            this.virtualHtml.down('[id=applicationlistCalendar_status]').update(html);
        }
        else {
            this.virtualHtml.down('[id=applicationlistCalendar_status]').update('');
            var begda = this.begDatePicker.getActualDate();
            var endda = this.endDatePicker.getActualDate();
            var jsonGetEvents = {
                EWS: {
                    SERVICE: "GET_EVENTS",
                    OBJECT: {
                        "#text": employee.id ? employee.id : employee.key,
                        "-TYPE": employee.oType ? employee.oType : employee.value.oType
                    },
                    PARAM: {
                        o_begda_i: begda,
                        o_endda_i: endda,
                        o_li_incapp: this.getFilterSelectedOptions().get('object')
                    }
                }
            }
            var xotree = new XML.ObjTree();
            this.makeAJAXrequest($H({
                xml:xotree.writeXML(jsonGetEvents),
                successMethod:'_showResults',
                errorMethod: '_showResultsError',
                ajaxID: employee.id ? employee.id : employee.key
            }));
        }
    },
    _createTableStructure: function() {
        var html = "<div id='applicationlistCalendar_results_beforeTable'>" +
            "<div id='applicationlistCalendar_results_showHide'>" +
            "<span class='application_action_link' id='listCalendar_allEventsShowDetails'>" + global.getLabel('showAll') + "</span>" + " / " +
            "<span class='application_action_link' id='listCalendar_allEventsHideDetails'>" + global.getLabel('hideAll') + "</span>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "<table class='sortable' id='applicationlistCalendar_resultsTable'>" +
            "<thead>" +
            "<tr>" +
            "<th id='applicationlistCalendar_results_table_colDay'>" + global.getLabel("day") + "</th>" +
            "<th id='applicationlistCalendar_results_table_colDate' class='table_sortfirstdesc'>" + global.getLabel("date") + "</th>" +
            "<th id='applicationlistCalendar_results_table_colName'>" + global.getLabel("name") + "</th>" +
            "<th id='applicationlistCalendar_results_table_colEvent'>" + global.getLabel("eventType") + "</th>" +
            "</tr>" +
            "</thead>" +
            "<tbody id='listCalendar_tbody'>"+
            "</tbody></table>";
        return html;
    },
    /**
     *@description Shows all the events obtained as upper form's result
     *@param {JSON} json Object from the backend
     *@param {String} id Employee's id
     */
    _showResults: function(json, id) {
        if (!this.filterCreated) {
            var incapp = json.EWS.o_li_incapp.yglui_str_incap2;
            this.createFilterPanel(this.filterElement, this.appName, incapp);
            this.virtualHtml.down('[id=applicationlistCalendar_form_filterLabel]').update(global.getLabel("filterOptions")).observe('click',this._toggleFilterOptionsBind);
            this.filterCreated = true;
        }
        this._removeEmployeeRows(id);
        this.jsonHash = this._getEventHash(json);
        var html = '';
        var message = json.EWS.messages;
        if (json.EWS.o_field_values) {
            var prevDate = null;
            //variable to save the status text of every event
            var statusDescription = "";
            var i = 0;
            this._numResultHash.set(id, this.jsonHash.keys().length);
            this.jsonHash.each(function(event) {
                var date = event.value.get('BEGDA') ? event.value.get('BEGDA').value :
                    event.value.get('DATUM').value;
                date = Date.parseExact(date, "yyyy-MM-dd");
                var day = date.getDay();
                day = global.getLabel(date.toString('ddd').toLowerCase()+'Day');
                var parsedDate = date.toString(this.dateFormat);
                var name = event.value.get('PERNR').text;
                var pern = id;
                var eventName;
                if(event.value.get("AWART")){
                    eventName = event.value.get("AWART").text;
                }else if(event.value.get("SUBTY")){
                    eventName = event.value.get("SUBTY").text;
                }else if(event.value.get("VTART")){
                    eventName = event.value.get("VTART").text;
                } else if (event.value.get("ZTART")) {
                    eventName = event.value.get("ZTART").text;
                } else if (event.value.get("SATZA")) {
                    eventName = global.getLabel("timeInfo");
                } else if(event.value.get("LDATE")) {
                    eventName = global.getLabel("timeError");    
                } else {
                    eventName = "NOTEXT";
                }
                var timeData;
                if(event.value.get("ANZHL"))
                     timeData = event.value.get("ANZHL").value;
                if(timeData)
                    eventName = timeData + " " + eventName;
                if(event.value.get('COMMENT'))
                    var comment = (event.value.get('COMMENT').value) ? event.value.get('COMMENT').value : (event.value.get('COMMENT').text != null) ? event.value.get('COMMENT').text : "";

                var parsedBeginDate = date;
                var endDate = !Object.isEmpty(event.value.get('ENDDA')) ? event.value.get('ENDDA').value : "";
                var parsedEndDate;
                if (Object.isEmpty(endDate)){
                    //parsedEndDate = parsedBeginDate; 
                    parsedEndDate = parsedBeginDate.toString(this.dateFormat);
                }
                else {
                    parsedEndDate = this._parseDate(endDate);
                    if (!Object.isEmpty(parsedEndDate))
                        parsedEndDate = parsedEndDate.toString(this.dateFormat);
                    else
                        parsedEndDate = date;
                }
                html += "<tr class='employeeRow_"+pern+"'>";
                if (prevDate != parsedDate) {
                    html += "<td class='applicationlistCalendar_results_table_td'><div id='applicationlistCalendar_div_day_" + id + "_" + i + "' class='applicationlistCalendar_results_table_td_text'>" + day + "</div></td>" +
                        "<td class='applicationlistCalendar_results_table_td'><div id='applicationlistCalendar_div_date_" + id + "_" + i + "' class='applicationlistCalendar_results_table_td_text'>" + parsedDate + "</div></td>";
                }
                else {
                    html += "<td class='applicationlistCalendar_results_table_td'><div id='applicationlistCalendar_div_day_" + id + "_" + i + "' style='display: none;' class='applicationlistCalendar_results_table_td_text'>" + day + "</div></td>" +
                        "<td class='applicationlistCalendar_results_table_td'><div id='applicationlistCalendar_div_date_" + id + "_" + i + " style='display: none;' class='applicationlistCalendar_results_table_td_text'>" + parsedDate + "</div></td>";
                }
                var color = this.getSelectedEmployees().get(id).color < 10 ? '0'+this.getSelectedEmployees().get(id).color.toString() : this.getSelectedEmployees().get(id).color;
                var when = parsedDate;
                //check if the end date is different of the begin date to show it
                if (parsedDate != parsedEndDate){
                    when += " - " + parsedEndDate;
                }
                 
                var linklabel;
                var eventType = this._getEventByAppId(event.value.get('APPID').value, json.EWS.o_li_incapp.yglui_str_incap2); 
                if(eventType=='ERR'||eventType=='HRZ'||eventType=='INF') linklabel = global.getLabel("DML_VIEW_DETAILS");
                else linklabel = global.getLabel("editEvent");    
                      
                html += "<td class='applicationlistCalendar_results_table_td'>" +
                            "<div class='applicationlistCalendar_results_table_td_text application_action_link application_text_bolder' id='listCalendar_eventDetails_" + id + '_' + i + "'>"  + name + "</div>" +
                            "<div id='applicationlistCalendar_div_event_" + id + '_' + i + "' class='applicationlistCalendar_results_table_hiddenEvent' style='display: none;'>" +
                                "<div class='applicationlistCalendar_results_table_event'>" +
                                    "<div class='applicationlistCalendar_results_table_event_when'><span class='application_text_bolder'>" + global.getLabel("when") + ": </span><span title='" + when + "'>" + when + "</span></div>" +
                                    "<div class='applicationlistCalendar_results_table_event_status'><span class='application_text_bolder'>" + global.getLabel("status") + ": </span><span title='" + this._getStatusOfEvent(event) + "'>" + this._getStatusOfEvent(event) + "</span></div>" +
                                    "<div class='applicationlistCalendar_results_table_event_comment' id='applicationlistCalendar_event_comment_" + id + '_' + i + "'><span class='application_text_bolder'>" + global.getLabel("comment") + ": </span><span title='" + comment + "'>" + comment + "</span></div>" +
                                    "<div>" +
                                        "<div class='applicationlistCalendar_results_table_event_link'>" +
                                            "<span class='application_action_link' id='applicationlistCalendar_event_link_" + id + '_' + i + "'>" + linklabel + "</span>" +
                                        "</div>" +
                                    "</div>" +
                                "</div>" +
                            "</div>" +
                        "</td>" +
                        "<td class='applicationlistCalendar_results_table_td'>" +
                            "<div class='applicationlistCalendar_results_table_td_text'><span class=''>"+this._createEventType(event.value.get('STATUS'), eventName,color,event.value)+"</div>" +
                        "</td></tr>";
                prevDate = parsedDate;
                i++;
                this.currentResultsLength++;
            }.bind(this));
            this.virtualHtml.down('[id=listCalendar_tbody]').insert(html);
            this.virtualHtml.down('[id=listCalendar_allEventsShowDetails]').observe('click', this._allShowDetails.bind(this));
            this.virtualHtml.down('[id=listCalendar_allEventsHideDetails]').observe('click', this._allHideDetails.bind(this));
            this.virtualHtml.down('[id=applicationlistCalendar_results_table_colDay]').observe('click', this._hideRepeatedDates.bind(this));
            this.virtualHtml.down('[id=applicationlistCalendar_results_table_colDate]').observe('click', this._hideRepeatedDates.bind(this));
            this.virtualHtml.down('[id=applicationlistCalendar_results_table_colName]').observe('click', this._showAllData.bind(this));
            this.virtualHtml.down('[id=applicationlistCalendar_results_table_colEvent]').observe('click', this._showAllData.bind(this));
            this.jsonHash.each(function(event, j) {
                this.virtualHtml.down('[id=listCalendar_eventDetails_' + id + '_' + j+']').observe('click', this._showDetails.bind(this,j,id));
                var beginDate = event.value.get('BEGDA') ? event.value.get('BEGDA').value :
                    event.value.get('DATUM').value;
                var parsedBeginDate = this._parseDate(beginDate);
                var endDate = !Object.isEmpty(event.value.get('ENDDA')) ? event.value.get('ENDDA').value : "";
                var parsedEndDate;
                if (Object.isEmpty(endDate))
                    parsedEndDate = parsedBeginDate;
                else
                    parsedEndDate = this._parseDate(endDate);
                var eventSent;
                if (Object.isEmpty(this._eventsLoaded.get(event.key))) {
                    eventSent = this._getEvent(json, event.key);
                    this._eventsLoaded.set(event.key, eventSent);
                }
                else
                    eventSent = this._eventsLoaded.get(event.key);
                var appId = event.value.get('APPID').value;
                var view = event.value.get('VIEW').value;
                this.virtualHtml.down('[id=applicationlistCalendar_event_link_' + id + '_' + j+']').observe('click', this._openDetails.bind(this, eventSent, event.key, id, appId, view));
            
                //hide comment if the type event is Time Error, Time Information or Hours Realized (Positive Time)
                var eventType = this._getEventByAppId(event.value.get('APPID').value, json.EWS.o_li_incapp.yglui_str_incap2);
                if(eventType=='ERR'||eventType=='HRZ'||eventType=='INF')
                    this.virtualHtml.down('[id=applicationlistCalendar_event_comment_' + id + '_' + j+']').hide();    
            }.bind(this));
            if(!this._tableLoaded) {
                if (this.running) {
                    this._tableKit = TableKit.Sortable.init("applicationlistCalendar_resultsTable", { 
                        pages: global.paginationLimit
                    });
                    //TableKit.Sortable.init("applicationlistCalendar_resultsTable");
                    //this.virtualHtml.down('[id=applicationlistCalendar_results]').show();
                    this._tableLoaded = true;
                }
            }
            else
                TableKit.reloadTable("applicationlistCalendar_resultsTable");
            this.virtualHtml.down('[id=applicationlistCalendar_results]').show();
        }
        if(this.currentResultsLength == 0) {
            if (this._tableLoaded) {
                this.virtualHtml.down('[id=applicationlistCalendar_results_beforeTable]').hide();
                this.virtualHtml.down('[id=applicationlistCalendar_resultsTable]').hide();
            }
            var html = "<div class='application_main_soft_text listCalendar_clearBoth listCalendar_noEventsFound'>" + "No events found" + "</div>";
            this.virtualHtml.down('[id=applicationlistCalendar_status]').update(html);
        }
        else if (this._tableLoaded) {
            if (!Object.isEmpty(this.virtualHtml.down('[id=applicationlistCalendar_status]').innerHTML))
                this.virtualHtml.down('[id=applicationlistCalendar_status]').update('');
            this.virtualHtml.down('[id=applicationlistCalendar_results_beforeTable]').show();
            this.virtualHtml.down('[id=applicationlistCalendar_resultsTable]').show();
            this._hideRepeatedDates();
        }
        if (!Object.isEmpty(message))
            this._infoMethod(json);
    },
    _removeEmployeeRows: function(pern) {
        try {
            var currentResults = this.currentResultsLength;
            $A(this.virtualHtml.down('[id=listCalendar_tbody]').childNodes).each(function(row) {
                if(row.hasClassName('employeeRow_'+pern)) {
                    if(row)
                        row.remove();
                    this.currentResultsLength--;
                }
                else if (!row.visible())
                    row.show();
            }.bind(this));
            if ((this.currentResultsLength > 0) && (this.currentResultsLength != currentResults))
                TableKit.reloadTable("applicationlistCalendar_resultsTable");
        }
        catch(err) {
            alert(err);
        }
    },
    _createEventType: function(eventType, eventName, color, eventNode) {
        var html;
        var fullDay = false;
        if(eventNode.get('ALLDF') && eventNode.get('ALLDF').value && eventNode.get('ALLDF').value.toLowerCase() == 'x' || eventNode.get("SATZA") != undefined || eventNode.get("LDATE") != undefined)
            fullDay = true;
        var templates = $H({
            fullDay: new Template("<div class='listCalendar_event'><div class='listCalendar_borderTop eeColor#{color}'></div><div class='eeColor#{color} listCalendar_event'><div class='#{iconClassName} listCalendar_icon'></div><div class='#{timesheet}' style='overflow: hidden;'>#{name}</div></div><div class='listCalendar_borderTop eeColor#{color}'></div></div>"),
            partial: new Template("<div class='listCalendar_event_border'><div class='#{iconClassName} listCalendar_icon eeColor#{color}'></div><div class='application_color_eeColor#{color} #{timesheet}'>#{name}</div></div>")
        });
        var icon = '';
        switch(eventType) {
            case 1:
            case 5:
                icon = 'application_rounded_question';
                break;
            case 2:
                icon = 'application_rounded_x';
                break;
            case 4:
                icon = 'application_rounded_draft';
                break;
            case 7:
                icon = 'application_rounded_ok';
                break;
            default:
                break;
        }
        var timesheetEvent = false;
        if ((eventType == 4) || (eventType == 5) || (eventType == 6))
            timesheetEvent = true;
        var object = {
            iconClassName: (icon == '') ? '' : fullDay ? icon : icon+'1',
            color: color,
            name: fullDay ? eventName : eventNode.get('BEGUZ') ? sapToDisplayFormatTime(eventNode.get('BEGUZ').value) + ' ' + eventName : eventName,
            timesheet: timesheetEvent ? 'application_text_italic' : ''
        };
        if(fullDay)
            return templates.get('fullDay').evaluate(object);
        else
            return templates.get('partial').evaluate(object);
    },
    /**
     *@description Defines what to do when an employee is selected
     */
    onEmployeeSelected: function(employee) {
        this._getEvents(employee);
    },
    /**
     *@description Defines what to do when an employee is unselected
     */
    onEmployeeUnselected: function(employee) {
        this._removeEmployeeRows(employee.id);
        var message = global.getLabel("selectEmployeePlease");
        if (this.getSelectedEmployees().keys().length > 0)
            message = "No events found";
        if (this.currentResultsLength == 0) {
            this.virtualHtml.down('[id=applicationlistCalendar_results]').hide();
            var html = "<div class='application_main_soft_text listCalendar_clearBoth listCalendar_noEventsFound'>" + message + "</div>";
            this.virtualHtml.down('[id=applicationlistCalendar_status]').update(html);
        }
        else
            this._hideRepeatedDates();
    },
    /**
     *@description Checks if there are selected employees, and if yes, launches the GET_HISTORY_EVENTS service; if not, it checks if there are some color changes
     */
    _checkSelectedEmployees: function() {

    var begDate;

    if (this.endDatePicker.earlierThan(this.begDatePicker)) {

        begDate = this.begDatePicker.getDateAsArray();

        this.errorDateMsg.show();
        this.errorDateMsg.fade({ duration: 4.0 });
        this.endDatePicker.setDate(Date.parse(begDate.month + "." + begDate.day + "." + begDate.year));
    }

        var selectedEmployees = this.getSelectedEmployees().toArray();
        selectedEmployees.each(function(pern) {
            this._getEvents(pern);
        }.bind(this));

    },
    /**
     *@description Shows/Hides an event's details
     *@param {Number} args Information about the event (its row)
     */
    _showDetails: function(args,id,show) {
        if (typeof show == 'boolean') {
            show ?
                this.virtualHtml.down('[id=applicationlistCalendar_div_event_' + id + '_' + args+']').show() :
                this.virtualHtml.down('[id=applicationlistCalendar_div_event_' + id + '_' + args+']').hide();
        }
        else {
            this.virtualHtml.down('[id=applicationlistCalendar_div_event_' + id + '_' + args+']').toggle();
        }
    },
    /**
     *@description Shows all events' details
     */
    _allShowDetails: function() {
        this._numResultHash.each(function(item) {
            for(var i = 0; i <= item.value-1; i++) {
                this._showDetails(i,item.key,true);
            }
        }.bind(this));
    },
    /**
     *@description Hides all events' details
     */
    _allHideDetails: function() {
        this._numResultHash.each(function(item) {
            for(var i = 0; i <= item.value-1; i++) {
                this._showDetails(i,item.key,false);
            }
        }.bind(this));
    },
    /**
     *@description Hides all events' repeated dates
     */
    _hideRepeatedDates: function() {
        var rows = this.virtualHtml.down('[id=applicationlistCalendar_resultsTable]').childElements()[1].childElements();
        var prevDate = null;
        // This variable will control table pagination
        var i = 0;
        rows.each( function(row) {
            var childNodes = row.childNodes;
            var row1 = childNodes[0].down();
            var row2 = childNodes[1].down();
            var date = row2.innerHTML;
            if(date == prevDate) {
                row1.hide();
                row2.hide();
            }
            else if(!row1.visible()) {
                row1.show();
                row2.show();
            }
            prevDate = date;
        }.bind(this));
    },
    /**
     *@description Show all data in the results table
     */
    _showAllData: function() {
        var table = this.virtualHtml.down('[id=listCalendar_tbody]');
        $A(table.childNodes).each(function(row) {
            var cols = row.childNodes;
            cols[0].down().show();
            cols[1].down().show();
        });
    },
    /**
     *@description Launches the timeEntryScreen app for the selected event
     *@param {JSON} eventList Object that contains all events info
     *@param {String} key Event's key
     *@param {String} pernr Employee's id
     *@param {String} appId Event's appId
     *@param {String} view Event's view
     */
    _openDetails: function(event, key, pernr, appId, view) {
        var eventData = this._getEventData(key);
        global.open( $H({
            app: {
                appId: appId,
                tabId: this.options.tabId,
                view: view
            },
            event: event,
            eventCodes: this.eventCodes,
            employee: pernr,
            eventInformation: eventData
        }));
    },
    /**
     *@description Parses a date string into a date object
     *@param {String} date Date which format will be changed
     *@returns {Date} Parsed date
     */
    _parseDate: function(date) {
        var parsedDate = null;
        // Dates like 20.12.2008
        if (!Object.isEmpty(date.match(/\d{2}.\d{2}.\d{4}/)))
            parsedDate = Date.parseExact(date, "d.M.yyyy");
        else
            parsedDate = Date.parseExact(date, "yyyy-MM-dd");
        return parsedDate;
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
     * @description Shows all the events obtained as upper form's result (after an error)
     * @param {JSON} json Object from the backend
     * @param {String} id Employee's id
     */
    _showResultsError: function(json, ajaxID) {
        this._errorMethod(json);
        this._showResults(json, ajaxID);
    },
    /**
    * @description Returns an event's essential information
    * @param {String} key Event's id
    * @returns {JSON} Event data
    */
    _getEventData: function(key) {
        var data = this.jsonHash.get(key);
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
            id: key,
            status: data.get("STATUS"),
            appId: data.get("APPID").value,
            view: data.get("VIEW") ? data.get("VIEW").value : ""
        };
        return eventData;
    }
});