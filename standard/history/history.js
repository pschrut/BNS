/** 
* @fileOverview history.js 
* @description The class contained in this file creates an application that shows the training history of one or several users.
*/

/**
*@constructor
*@description Class HIS.
*@augments Application 
*/
var HIS = Class.create(Application,
/** 
*@lends OM_Maintain
*/
{

/*** SERVICES ***/
/**
* Service used to retreive booked trainings.
* @type String	
*/
historyService: "TRAINING_HIST",
/*** VARIABLES ***/
/**
* indicates whether to show the pricing or not.
* @type String
*/
showPricing: "",
/**
* indicates the number of AJAX responses still to receive before the history html can be done...
* otherwise: performance problems!
* @type Integer
*/
responsesToGet: 0,
/**
* lenght of results showed in history table
* @type Integer
*/
historyLength: 0,
/**
* property to know if the table with trainings have been shown already
* @type Boolean
*/
tableShowed: false,
/**
* property to keep the list of employees to show
* @type Hash
*/
selectedEmployees: new Hash(),
/**
* property to keep the list of employees to show
* @type Hash
*/
hashOfTrainings: new Hash(),
/**
* @type DatePicker
* @description Begining date
*/
begDatePicker: null,
/**
* @type DatePicker
* @description Ending date
*/
endDatePicker: null,
/**
* @type Array
* @description All trainings' internal & external price
*      sumPrices[0]: internal price
*      sumPrices[0]: external price
*/
sumPrices: [],
/**
* @type Integer
* @description Number of rows being displayed at a moment
*/
displayedRows: 0,
/**
*@param $super The superclass: Application
*@description instantiates the app
*/
initialize: function($super, options) {
    $super(options);
    this.employeeColorChangedHandlerBinding = this.employeeColorChangedHandler.bindAsEventListener(this);
    this.changeDatePickersBinding = this.applyFilterHandler.bindAsEventListener(this);
},
/**
*@param $super: the superclass: Application
*@description when the user clicks on the app tag, load the html structure and sets the event observers
* which have changed.
*/
run: function($super) {
    $super();
    if (this.firstRun) {
        //get the employee id
        this.pernr = global.objectId;
        this.buildPage();
    }
    //set the event listeners
    document.observe("EWS:employeeColorChanged", this.employeeColorChangedHandlerBinding);
    document.observe("EWS:historyDateCorrect", this.changeDatePickersBinding);
},
/**
* Method called when the app is loaded.
*/
buildPage: function() {
    //once we have retrieved the labels, create the html
    var html = "<div id='application_history_filter'>"
                       + "<div id='application_history_filter_content' >"
                           + "<div id='application_history_filter_top'>"
                               + "<div class='application_history_filter_struct application_text_bolder'>" + global.getLabel('referencePeriod') + "</div>"
                               + "<div class='application_history_filter_struct'>" + global.getLabel('from') + "</div><div id='application_history_dpFrom' class='application_history_filter_struct'></div>"
                               + "<div class='application_history_filter_struct'>" + global.getLabel('to') + "</div><div id='application_history_dpTo' class='application_history_filter_struct'></div>"
                           + "</div>"
                       + "</div></div>"
                  + "</div>"
                  + "<div id='application_history_content'>"
                       + "<div id='application_history_table'></div>"
                       + "<div id='application_history_price'></div>"
                  + "</div>";
    this.virtualHtml.insert(html);
    //event listeners
    // DatePickers definition
    var begDate = Date.today().add({ years: -1 });
    var endDate = Date.today();
    // begDateAux is for fixing the problem with date limits
    var begDateAux = begDate.clone();
    begDateAux.addDays(-1);
    begDate = begDate.toString('yyyyMMdd');
    begDateAux = begDateAux.toString('yyyyMMdd');
    var endDateAux = endDate.clone();
    endDateAux.addDays(1);
    endDate = endDate.toString('yyyyMMdd');
    endDateAux = endDateAux.toString('yyyyMMdd');
    this.begDatePicker = new DatePicker('application_history_dpFrom', {
        defaultDate: begDate,
        toDate: endDate,
        optionsIsDraggable: true,
        events: $H({ 'correctDate': 'EWS:historyDateCorrect', dateSelected: 'EWS:historyDateCorrect' })
    });
    this.endDatePicker = new DatePicker('application_history_dpTo', {
        defaultDate: endDate,
        fromDate: begDate,
        optionsIsDraggable: true,
        events: $H({ 'correctDate': 'EWS:historyDateCorrect', dateSelected: 'EWS:historyDateCorrect' })
    });
    this.int_cur = "";
    this.ext_cur = "";
    this.begDatePicker.linkCalendar(this.endDatePicker);
},
/**
* Method called when the history is received.
* @param {JSON Object} json Response of the AJAX call
*/
processHistory: function(json) {
    //take button options from req
    this.details_tarap = json.EWS.o_buttons.yglui_str_wid_button['@tarap'];
    this.details_tabId = json.EWS.o_buttons.yglui_str_wid_button['@tartb'];
    this.details_views = json.EWS.o_buttons.yglui_str_wid_button['@views'];
    var trainingsLength = 0;
    if (!Object.isEmpty(json.EWS.o_trainings)) {
        var trainings = objectToArray(json.EWS.o_trainings.yglui_tab_training);
        trainingsLength = trainings.length;
    }
    //take values
    this.showPricing = json.EWS.o_price;
    var employeeName = json.EWS.o_ename;
    var employeeId = json.EWS.o_pernr;
    for (var i = 0; i < trainingsLength; i++) {
        var trainingName = trainings[i]['@name'];
        var trainingId = trainings[i]['@objid'];
        var courseTypeCode = trainings[i]['@course_type'];
        var ext_cur = trainings[i]['@ewaer'];
        var externalP = trainings[i]['@ekost'];
        var int_cur = trainings[i]['@iwaer'];
        var internalP = trainings[i]['@ikost'];
        var startDate = trainings[i]['@begda'];
        var endDate = trainings[i]['@endda'];
        var curriculumId = trainings[i]['@curr_id'];
        var currName = trainings[i]['@curr_name'];
        //crate the hash         
        this.hashOfTrainings.set(trainingId + '_' + employeeId, {
            trainingName: trainingName,
            trainingId: trainingId,
            employeeName: employeeName,
            employeeId: employeeId,
            courseTypeCode: courseTypeCode,
            ext_cur: ext_cur,
            externalP: externalP,
            int_cur: int_cur,
            internalP: internalP,
            startDate: startDate,
            endDate: endDate,
            curriculumId: curriculumId,
            currName: currName,
            shown: true
        });
    }
    this.historyLength = this.hashOfTrainings.keys().length;
    this.addHistory();
},
/**
* add all trainings to the history table for all employees selected    
*/
addHistory: function() {
    //variables to sum up prices
    var intP = 0;
    var extP = 0;
    this.displayedRows = 0;
    this.responsesToGet -= 1;
    if (this.responsesToGet <= 0) {
        if (this.historyLength != 0 && this.showPricing == 'X') {
            var html = "<table id='application_history_tableKit' class='sortable resizable'>"
	            + "<thead>"
		            + "<tr><th class='table_sortfirstdesc application_history_table_colEmployee_withPrice'>" + global.getLabel('employee')
		            + "</th><th class ='application_history_table_colTraining_withPrice'>" + global.getLabel('training') + "</th>"
		            + "<th class='application_history_table_colPrice'>" + global.getLabel('iPrice_ePrice') + "</th>"
		            + "<th class='application_history_results_table_colDate_withPrice'>" + global.getLabel('validityP') + "</th></tr>"
	            + "</thead><tbody id='tableKit_body'>";
            for (var i = 0; i < this.historyLength; i++) {
                if (this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).shown == true) {
                    var trainingName = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).trainingName;
                    var trainingId = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).trainingId;
                    var employeeName = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).employeeName;
                    var employeeId = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).employeeId;
                    var ext_cur = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).ext_cur;
                    var externalP = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).externalP;
                    var int_cur = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).int_cur;
                    var internalP = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).internalP;
                    var startDate = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).startDate;
                    var endDate = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).endDate;
                    var curriculumId = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).curriculumId;
                    var currName = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).currName;
                    //                        var employeeColor = this.getSelectedEmployees().get(employeeId).color.toPaddedString(2);
                    var employeeColor = global.getColor(employeeId).toPaddedString(2);
                    //curriculum name in brackets 
                    var curriculumName = "";
                    if (curriculumId != '00000000') {
                        curriculumName = "(" + currName + ")";
                    }
                    //if start and end date is the same, just show one
                    var validity = startDate.substr(8, 2) + '.' + startDate.substr(5, 2) + '.' + startDate.substr(0, 4) + " - " + endDate.substr(8, 2) + '.' + endDate.substr(5, 2) + '.' + endDate.substr(0, 4);
                    if (startDate == endDate) {
                        validity = startDate.substr(8, 2) + '.' + startDate.substr(5, 2) + '.' + startDate.substr(0, 4);
                    }
                    //sum prices
                    intP += parseInt(internalP, 10);
                    extP += parseInt(externalP, 10);
                    if (parseInt(internalP, 10) == 0 && parseInt(externalP, 10) == 0) {
                        internalP = "";
                        externalP = "";
                    }
                    if (Object.isEmpty(int_cur))
                        int_cur = "";
                    else
                        this.int_cur = int_cur;
                    if (Object.isEmpty(ext_cur))
                        ext_cur = "";
                    else
                        this.ext_cur = ext_cur;
                    this.displayedRows++;
                    html += "<tr class='application_history_row' id='application_history_row_" + trainingId + "_" + employeeId + "'>"
                                + "<td><div id='application_history_td_emp_" + trainingId + "_" + employeeId + "' class='application_history_name_div application_color_eeColor" + employeeColor + "'>" + employeeName + "</div></td>"
                                + "<td><div id='application_history_training_td_" + trainingId + "_" + employeeId + "' class='application_action_link' onClick='javascript:global.open($H({app: { appId: \"" + this.details_tarap + "\",tabId: \"" + this.details_tabId + "\",view: \"" + this.details_views + "\"}, objectId: \"" + trainingId + "\", oType:\"E\", parentType:\"E\", displayMode:\"display\", begda:\"" + startDate + "\", endda:\"" + endDate + "\" }));'>" + trainingName + curriculumName + "</div></td>"
                                + "<td>" + int_cur + " " + internalP + " " + ext_cur + " " + externalP + "</td>"
                                + "<td>" + validity + "</td></tr>";
                } //end if(this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).shown == true)
            } //end for (var i = 0; i < this.historyLength; i++) 
            html += "</tbody></table>";
            this.virtualHtml.down('[id=application_history_table]').update(html);
            //total price div
            this.sumPrices[0] = intP;
            this.sumPrices[1] = extP;
            var html_price = "<span class='application_text_bolder'>" + global.getLabel('totalPrice') + ":&nbsp;</span>"
                                + "<span id='application_history_totalPrices' class='application_main_text'>" + this.int_cur + " " + this.sumPrices[0] + " / " + this.ext_cur + " " + this.sumPrices[1] + " </span>"
            this.virtualHtml.down('[id=application_history_price]').update(html_price);

        }
        //the same table, without the price column. Also, we dont create the total price div
        else if (this.historyLength != 0 && this.showPricing == '') {
            var html = "<table id='application_history_tableKit' class='sortable resizable'>"
	            + "<thead>"
		            + "<tr><th class='table_sortfirstdesc application_history_table_colEmployee_withoutPrice'>" + global.getLabel('employee')
		            + "</th><th class ='application_history_table_colTraining_withoutPrice'>" + global.getLabel('training') + "</th>"
		            + "<th class='application_history_results_table_colDate_withoutPrice'>" + global.getLabel('validityP') + "</th></tr>"
	            + "</thead><tbody id='tableKit_body'>";
            for (var i = 0; i < this.historyLength; i++) {
                if (this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).shown == true) {
                    var trainingName = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).trainingName;
                    var trainingId = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).trainingId;
                    var employeeName = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).employeeName;
                    var employeeId = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).employeeId;
                    var startDate = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).startDate;
                    var endDate = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).endDate;
                    var curriculumId = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).curriculumId;
                    var currName = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).currName;
                    //                        var employeeColor = this.getSelectedEmployees().get(employeeId).color.toPaddedString(2);
                    var employeeColor = global.getColor(employoeeId).toPaddedString(2);
                    var curriculumName = "";
                    if (curriculumId != '00000000') {
                        curriculumName = "(" + currName + ")";
                    }
                    //if start and end date is the same, just show one
                    var validity = startDate.substr(8, 2) + '.' + startDate.substr(5, 2) + '.' + startDate.substr(0, 4) + " - " + endDate.substr(8, 2) + '.' + endDate.substr(5, 2) + '.' + endDate.substr(0, 4);
                    if (startDate == endDate) {
                        validity = startDate.substr(8, 2) + '.' + startDate.substr(5, 2) + '.' + startDate.substr(0, 4);
                    }
                    html += "<tr class='application_history_row' id='application_history_row_" + trainingId + "_" + employeeId + "'>"
                                + "<td><div id='application_history_td_emp_" + trainingId + "_" + employeeId + "' class='application_history_name_div application_color_eeColor" + employeeColor + "'>" + employeeName + "</div></td>"
                                + "<td><div id='application_history_training_td_" + trainingId + "_" + employeeId + "' class='application_action_link' onClick='javascript:global.open($H({app: { appId: \"" + this.details_tarap + "\",tabId: \"" + this.details_tabId + "\",view: \"" + this.details_views + "\"}, objectId: \"" + trainingId + "\", oType:\"E\", parentType:\"E\", displayMode:\"display\", begda:\"" + startDate + "\", endda:\"" + endDate + "\" }));'>" + trainingName + curriculumName + "</div></td>"
                                + "<td>" + validity + "</td></tr>";
                } //end if(this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).shown == true)
            } //end for (var i = 0; i < this.historyLength; i++) 
            html += "</tbody></table>";
            this.virtualHtml.down('[id=application_history_table]').update(html);
        } //end if (this.historyLength != 0 && this.showPricing == '')
        // when the table is empty
        if (this.historyLength == 0 || this.displayedRows == 0) {
            html = "<table id='application_history_tableKit' class='sortable resizable'>"
	                        + "<thead>"
		                        + "<tr><th class='table_sortfirstdesc application_history_table_colNoTtrainings'>" + global.getLabel('trainingsFound') + "</th></tr>"
	                        + "</thead>"
	                        + "<tbody >"
                                + "<tr><td><div class='application_catalog_noFound'>" + global.getLabel('noHistoryFound') + "</div></td></tr>"
                            + "</tbody>"
                        + "</table>";
            this.virtualHtml.down('[id=application_history_table]').update(html);
            if (this.showPricing == 'X') {
                //total price div                            
                this.virtualHtml.down('[id=application_history_price]').update("");
            }
        } //end if (this.historyLength != 0 || this.displayedRows==0)            
        if (this.tableShowed == false) {
            TableKit.Sortable.init("application_history_tableKit");
            this.tableShowed = true;
        }
        else {
            TableKit.reloadTable("application_history_tableKit");
        }
    } //end f (this.responsesToGet <= 0)

},
/*** Event Handlers ***/
/**
*@param event Data about the employee just selected
*@description When a employee is selected, we redraw the tables
*/
onEmployeeSelected: function(args) {
    var employeeId = args.id;
    //add the employee and its attributes to the class array	
    var name = args.name;
    var color = args.color;
    this.selectedEmployees.set(employeeId, {
        name: name,
        color: color,
        selected: 'true'
    });
    var isSaved = false;
    //check if we have loaded this employee before. If not, call SAP                                              
    for (var i = 0; i < this.hashOfTrainings.keys().length; i++) {
        if (this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).employeeId == employeeId) {
            isSaved = true;
            this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).shown = true;
        }
    }
    if (isSaved) {
        this.addHistory();
    } else {
        var begDay = this.begDatePicker.getDateAsArray().day;
        var begMonth = this.begDatePicker.getDateAsArray().month;
        var begYear = this.begDatePicker.getDateAsArray().year;
        var endDay = this.endDatePicker.getDateAsArray().day;
        var endMonth = this.endDatePicker.getDateAsArray().month;
        var endYear = this.endDatePicker.getDateAsArray().year;
        if (begDay.length == 1)
            begDay = '0' + begDay;
        if (begMonth.length == 1)
            begMonth = '0' + begMonth;
        if (endDay.length == 1)
            endDay = '0' + endDay;
        if (endMonth.length == 1)
            endMonth = '0' + endMonth;
        //trainings: call to service
        var xmlGetHistory = '<EWS>'
                            + '<SERVICE>' + this.historyService + '</SERVICE>'
                            + "<OBJECT TYPE ='P'>" + employeeId + "</OBJECT>"
                            + '<PARAM>'
                            + '<O_BEGDA>' + begYear + '-' + begMonth + '-' + begDay + '</O_BEGDA>'
                            + '<O_ENDDA>' + endYear + '-' + endMonth + '-' + endDay + '</O_ENDDA>'
                            + "<I_APPID>" + this.options.appId + "</I_APPID>"
                            + '</PARAM></EWS>';
        this.makeAJAXrequest($H({ xml: xmlGetHistory, successMethod: 'processHistory' }));
    }
},
/**
*@param employeeId Employee ID of employee who has been unselected
*@description When a employee color is changed, we reload coloured parts of his calendar
*/
onEmployeeUnselected: function(args) {
    var employeeId = args.id;
    for (var i = this.historyLength - 1; i >= 0; i--) {
        var trainingId = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).trainingId;
        //we delete employee's trainings from the html         
        if (this.virtualHtml.down("[id=application_history_row_" + trainingId + "_" + employeeId + "]")) {
            this.virtualHtml.down("[id=application_history_row_" + trainingId + "_" + employeeId + "]").remove();
            var key = trainingId + "_" + employeeId;
            this.hashOfTrainings.get(key).shown = false;
            //re-calculate total prices
            this.sumPrices[0] -= parseInt(this.hashOfTrainings.get(key).internalP);
            this.sumPrices[1] -= parseInt(this.hashOfTrainings.get(key).externalP);
            var ext_cur = this.hashOfTrainings.get(key).ext_cur;
            var int_cur = this.hashOfTrainings.get(key).int_cur;
            //update the prices
            this.virtualHtml.down('[id=application_history_totalPrices]').update("<span id='application_history_totalPrices' class='application_main_text'>" + int_cur + " " + this.sumPrices[0] + " / " + ext_cur + " " + this.sumPrices[1] + " </span>");
            //decrement displayed rows
            this.displayedRows--;
            if (this.tableShowed == false) {
                TableKit.Sortable.init("application_history_tableKit");
                this.tableShowed = true;
            }
            else {
                TableKit.reloadTable("application_history_tableKit");
            }
        }
    }
    if (this.displayedRows == 0) {
        //drawing the empty table with the "No trainings" message           
        var html = "<table id='application_history_tableKit' class='sortable resizable'>"
                            + "<thead>"
	                            + "<tr><th class='table_sortfirstdesc application_history_table_colNoTtrainings'>" + global.getLabel('trainingsFound') + "</th></tr>"
                            + "</thead>"
                            + "<tbody >"
                                + "<tr><td><div class='application_catalog_noFound'>" + global.getLabel('noHistoryFound') + "</div></td></tr>"
                            + "</tbody>"
                        + "</table>";
        this.virtualHtml.down('[id=application_history_table]').update(html);
        if (this.tableShowed == false) {
            TableKit.Sortable.init("application_history_tableKit");
            this.tableShowed = true;
        }
        else {
            TableKit.reloadTable("application_history_tableKit");
        }
    }
    this.historyLength = this.hashOfTrainings.keys().length;
    //delete the employee from the hash
    this.selectedEmployees.unset(employeeId);
},

/**
*@param args args[0]: employee ID; args[1]: old color of the employee whose color has changed
*@description When a employee color is changed, we reload coloured parts of the tables
*/
employeeColorChangedHandler: function(event) {
    var args = getArgs(event);
    if (this.getEmployee(args[0]).selected) {
        var rowsT = this.virtualHtml.down('[id=application_history_table]').select('.application_history_name_div');
        for (var i = 0; i < rowsT.length; i++) {
            var div_id = rowsT[i].identify();
            if (div_id.include(args[0])) {
                rowsT[i].removeClassName('application_color_' + args[1]);
                rowsT[i].addClassName('application_color_' + this.getSelectedEmployees().get(args[0]).color.strip());
            }
        }
    }
},
/**
* @description When clicking "Refresh" button, apply current filter and refresh table with history
*/
applyFilterHandler: function() {
    var begDate = this.begDatePicker.actualDate;
    var endDate = this.endDatePicker.actualDate;
    //hide items out of the filter
    for (var i = this.historyLength - 1; i >= 0; i--) {
        var trainingId = this.hashOfTrainings.keys()[i];
        var trainingBegDate = Date.parseExact(this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).startDate, "yyyy-MM-dd");
        var trainingEndDate = Date.parseExact(this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).endDate, "yyyy-MM-dd");
        var beginnings = Date.compare(begDate, trainingBegDate);
        var ends = Date.compare(trainingEndDate, endDate);
        if ((beginnings <= 0 && ends <= 0)) {
            this.hashOfTrainings.get(trainingId).shown = true;
        } else {
            this.hashOfTrainings.get(trainingId).shown = false;
        }
    }
    //redraw table
    this.addHistory();
},

/**
* @description called when the application is not shown.
*/
close: function($super) {
    $super();
    document.stopObserving('EWS:employeeColorChanged', this.employeeColorChangedHandlerBinding);
    document.stopObserving('EWS:historyDateCorrect', this.changeDatePickersBinding);
}

});