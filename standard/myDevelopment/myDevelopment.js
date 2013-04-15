/** 
* @fileOverview myDevelopment.js 
* @description File containing class LMS. This application is responsible of showing current trainings of one
* or deveral users. Trainings can be prebooked, or with a session booked.
*/

/**
*@constructor
*@description Class LMS. Shows prebooked, and booked trainings.
*@augments Application 
*/
var LMS = Class.create(Application,
/** 
*@lends OM_Maintain
*/
{

/*** SERVICES ***/
/**
* Service used to retreive booked trainings.
* @type String	
*/
prebookingService: "GET_PRBOOKINGS",

/**
* Service used to retrieve booked sessions
* @type String
*/
bookingService: "GET_BOOKINGS",
/**
* Service used to retrieve the possible reasons for the booking cancellation
* @type String
*/
cancelReasonsService: "GET_CAN_PARTI",
/**
* Service used to cancel a previous booking
* @type String
*/
cancelBookingService: "CANCELBOOKING",

cancelpreBookService: "CANCELPREBOOK",

/*** XMLs IN & OUT***/


xmlGetLabels: XmlDoc.create(),

/**
* Property to hold xml of the labels
* @type XmlDoc
*/
xmlLabels: XmlDoc.create(),

/**
* Property to call the service providing the trainings
* @type XmlDoc
*/
xmlGetTrainings: XmlDoc.create(),

/**
* Property to call the service providing the sessions
* @type XmlDoc
*/
xmlGetSessions: XmlDoc.create(),

xmlCancelPre: XmlDoc.create(),

/*** VARIABLES ***/

/**
* indicates the number of AJAX responses still to receive before the training html can be done...
* otherwise: performance problems!
* @type Integer
*/
responsesToGetTrainings: 0,

/**
* indicates the number of AJAX responses still to receive before the sessions html can be done...
* otherwise: performance problems!
* @type Integer
*/
responsesToGetSessions: 0,

/**
* property to keep the list of employees to show
* @type Array
*/
selectedEmployees: new Hash(),

/**
* property to know if the table with trainings have been shown already
* @type Array
*/
tableTrainingShowed: false,

/**
* property to know if the table with sessions have been shown already
* @type Array
*/
tableSessionsShowed: false,

/**
* lenght of results showed in training table
* @type Integer
*/
trainingsLength: 0,
/**
* lenght of results showed in training table
* @type Integer
*/
sessionsLength: 0,
/**
* property to keep the list of employees to show
* @type Array
*/
hashOfTrainings: new Hash(),
/**
* property to keep the list of employees to show
* @type Array
*/
hashOfSessions: new Hash(),
/**
* property to keep the list of labels
* @type Array
*/
hashOfLabels: new Hash(),
/**
* @type Integer
* @description Number of rows being displayed at a moment
*/
displayedRowsTrainings: 0,
/**
* @type Integer
* @description Number of rows being displayed at a moment
*/
displayedRowsSessions: 0,
/**
* if we open the application from book/prebook, reload all tables
* @type Boolean
*/
reload: false,
/**
* save Ids of employees with no information about trainings
* @type Array
*/
emptyTrainingsIds: [],
/**
* save Ids of employees with no information sessions
* @type Array
*/
emptySessionsIds: [],
/**
* json object with cancellation reasons
* @type json object
*/
jsonReasons: null,
/**
*@param $super The superclass (Application)
*@description Instantiates the app
*/
initialize: function($super, args) {
    $super(args);
    this.employeeColorChangedHandlerBinding = this.employeeColorChangedHandler.bindAsEventListener(this);
    this.cancelBookingConfBoxButtonBinding = this.cancelBookingConfBoxButton.bindAsEventListener(this);
},
/**
*@param $super The superclass: Application
*@param args Arguments coming from previous application
*@description When the user clicks on the app tag, load the html structure and sets the event observers
* which have changed.
*/
run: function($super, args) {
    $super();
    if (arguments.length > 1 && !Object.isEmpty(args)) {
        /* Due to bug #1037094, we always reload
        if (args.get('refresh') == 'X')
        this.reload = true;
        else
        this.reload = false;
        */
        if (args.get('app') == 'LMS') {
            this.firstRun = false;
        }
    }
    // Due to bug #1037094, we always reload
    this.reload = true;
    this.hashOfButtons = $H();
    if (this.firstRun) {
        // Launch the AJAX call to retrieve the labels
        //get the employee id
        this.trainingsLength = 0;
        this.sessionsLength = 0;
        this.reload = true;
        this.processLabels();
    }
    if (this.reload) {
        this.hashOfSessions = new Hash();
        this.hashOfTrainings = new Hash();
        for (var i = 0; i < this.getSelectedEmployees().keys().length; i++) {
            var employeeId = this.getSelectedEmployees().keys()[i];

            this.xmlGetTrainings = '<EWS>'
                                    + "<SERVICE>" + this.prebookingService + "</SERVICE>"
                                    + "<OBJECT TYPE='P'>" + employeeId + "</OBJECT>"
                                    + "<PARAM><I_APPID>" + this.options.appId + "</I_APPID></PARAM>"
                                    + '</EWS>';
            this.makeAJAXrequest($H({ xml: this.xmlGetTrainings, successMethod: 'processResponse', ajaxID: 'prebook' }));
            //booking
            this.xmlGetSessions = '<EWS>'
                                    + "<SERVICE>" + this.bookingService + "</SERVICE>"
                                    + "<OBJECT TYPE='P'>" + employeeId + "</OBJECT>"
                                    + "<PARAM><I_APPID>" + this.options.appId + "</I_APPID></PARAM>"
                                    + '</EWS>';
            this.makeAJAXrequest($H({ xml: this.xmlGetSessions, successMethod: 'processResponse', ajaxID: 'book' }));
        }
    }
    //set the event listeners
    document.observe("EWS:employeeColorChanged", this.employeeColorChangedHandlerBinding);
    document.observe("EWS:cancelBookingReasonAutocompleter_resultSelected", this.cancelBookingConfBoxButtonBinding);
},
/**
* Method called when the labels Xml is received.
* @param {HTTPResponse} req  Response of the AJAX call
*/
processLabels: function() {
    //this.xmlLabels = req;
    //this.updateTitle(this.labels.get('InProgress_tab'));
    this.showAll = global.getLabel('showDetails');
    this.hideAll = global.getLabel('hideDetails');
    //once we have retrieved the labels, create the html
    var html = "<div id='application_inProgress_trainingPrintSection'>"
                       + "<div id='application_inProgress_trainingSection'>"
                           + "<div id='application_inProgress_trainingSection_desc' class='application_inProgress_structure'><span class='application_main_text'>" + global.getLabel('trainingPreBook') + "</span></div>"
                           + "<div id='application_inProgress_trainingSection_table' class='application_inProgress_table'></div>"
                       + "</div>"
                       + "<div id='application_inProgress_sessionSection' class='application_inProgress_margin'>"
                           + "<div id='application_inProgress_sessionSection_desc' class='application_inProgress_structure'><span class='application_main_text'>" + global.getLabel('sessionsBook') + "</span></div>"
                           + "<div id='application_inProgress_sessionSection_table' class='application_inProgress_table'></div>"
                       + "</div>"
                       + "<div id='application_inProgress_linkToCATL'></div>"
            + "</div>";
    this.virtualHtml.insert(html);
},

/**
* Method called when the trainings Xml is received.
* @param {HTTPResponse} req Response of the AJAX call
* @param id Ajax request Id
*/
processResponse: function(req, id) {
    if (this.reload == true)
        this.reload = false;
    if (id == 'prebook')
        this.processTrainings(req);
    if (id == 'book')
        this.processSessions(req);

},
/**
* Method called when the trainings Xml is received.
* @param {HTTPResponse} req Response of the AJAX call
*/
processTrainings: function(req) {
    //first of all, keep the buttons 
    var arrayOfButtons = objectToArray(req.EWS.o_buttons.yglui_str_wid_button);
    for (var r = 0; r < arrayOfButtons.length; r++) {
        if (this.hashOfButtons.keys().indexOf(arrayOfButtons[r]['@action']) == -1) {
            this.hashOfButtons.set(arrayOfButtons[r]['@action'], {
                tarap: arrayOfButtons[r]['@tarap'],
                tabId: arrayOfButtons[r]['@tartb'],
                views: arrayOfButtons[r]['@views'],
                labelTag: arrayOfButtons[r]['@label_tag']
            });
        }
    }
    //convert the xml into a hash--> take values arrrays
    var employeeId = req.EWS.o_pernr;
    var employeeName = req.EWS.o_ename;
    if (!Object.isEmpty(req.EWS.o_trainings)) {
        var courses = objectToArray(req.EWS.o_trainings.yglui_tab_training);
        for (var i = 0; i < courses.length; i++) {
            var trainingId = courses[i]['@objid'];
            var item = courses[i]['@item'];
            var trainingName = courses[i]['@name'];
            var startDate = courses[i]['@begda'];
            var endDate = courses[i]['@endda'];
            var courseType = courses[i]['@course_type'];
            var durationDays = courses[i]['@dur_d'];
            var durationHours = courses[i]['@dur_h'];
            var sessions = courses[i]['@nb_sessions'];
            //crate the hash
            var shown = true;
            this.hashOfTrainings.set(trainingId + "_" + employeeId, {
                trainingId: trainingId,
                item: item,
                trainingName: trainingName,
                employeeId: employeeId,
                employeeName: employeeName,
                startDate: startDate,
                endDate: endDate,
                courseType: courseType,
                durationDays: durationDays,
                durationHours: durationHours,
                sessions: sessions,
                shown: shown
            });
        }
    }
    var labels = req.EWS.labels.item;
    for (var i = 0; i < labels.length; i++) {
        var lableId = labels[i]['@id'];
        var labelValue = labels[i]['@value'];
        this.hashOfLabels.set(lableId, { labelValue: labelValue });
    }
    this.trainingsLength = this.hashOfTrainings.keys().length;
    this.addTrainings();
},

/**
* Add all trainings to the training table for all employees selected
*/
addTrainings: function() {
    //prebook/book button info
    var tarap = this.hashOfButtons.get("LSOPREBOOK").tarap;
    var tabId = this.hashOfButtons.get("LSOPREBOOK").tabId;
    var views = this.hashOfButtons.get("LSOPREBOOK").views;
    this.displayedRowsTrainings = 0;
    //only when no more responses to get, we build the table        
    this.responsesToGetTrainings -= 1;
    if (this.responsesToGetTrainings <= 0) {
        if (this.trainingsLength != 0) {
            //create array to hold ids needing an observer
            var idsArray = [];
            //build the html table head structure
            var html = "<div class='application_inProgress_beforeTable'>" +
                                "<div class='application_inProgress_showHide'>" +
                                    "<span class='application_action_link' id='application_inProgress_trainingSection_allTrainingsShowDetails'>" + this.showAll + "</span>" + " / " +
                                    "<span class='application_action_link' id='application_inProgress_trainingSection_allTrainingsHideDetails'>" + this.hideAll + "</span>" +
                                "</div>" +
                           "</div>" +
                           "<table class='sortable' id='application_inProgress_trainingSection_resultsTable'>" +
                               "<thead>" +
                                   "<tr>" +
                                       "<th class='application_inProgress_results_table_colEmployee'>" + global.getLabel('employee') + "</th>" +
                                       "<th class='application_inProgress_results_table_colItemName table_sortfirstdesc'>" + global.getLabel('training') + "</th>" +
                                       "<th class='application_inProgress_results_table_colDate'>" + global.getLabel('validity') + "</th>" +
                                   "</tr>" +
                               "</thead>" +
                               "<tbody>";
            for (var i = 0; i < this.trainingsLength; i++) {
                if (this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).shown == true) {
                    var trainingId = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).trainingId;
                    var item = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).item;
                    var trainingName = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).trainingName;
                    var employeeId = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).employeeId;
                    var employeeName = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).employeeName;
                    var employeeColor = global.getColor(employeeId).toPaddedString(2);
                    var startDate = sapToDisplayFormat(this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).startDate);
                    var endDate = sapToDisplayFormat(this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).endDate);
                    var courseType = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).courseType;
                    var durationDays = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).durationDays;
                    var durationHours = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).durationHours;
                    var sessions = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).sessions;
                    //approved                    
                    var book = "&nbsp;";
                    if (sessions >= 1) {
                        //make available the "book" link
                        book = "<span onClick='javascript:global.open($H({app: { appId: \"" + tarap + "\",tabId: \"" + tabId + "\",view: \"" + views + "\"}, allSessions:\"X\", employee:\"" + employeeId + "\", isDelete:\"\", oType:\"D\", training:\"" + trainingId + "\", prevApp:\"LMS\"}));' class='application_action_link'>" + global.getLabel('book') + "</span>";
                    } else {
                        book = "<span class='application_action_link_disabled'>" + global.getLabel('book') + "</span>";
                    }
                    //save the id of the training link
                    idsArray.push("application_inProgress_trainingSection_training_" + employeeId + "_" + trainingId);
                    this.displayedRowsTrainings++;
                    //application_color_" + employeeColor + ";
                    html += "<tr id='application_inProgress_trainingSection_row_" + employeeId + "_" + trainingId + "'>";
                    html += "<td class='application_inProgress_results_table_td'>"
                                    + "<div id='application_inProgress_trainingSection_div_name_" + employeeId + "_" + trainingId + "' class='application_inProgress_name_div application_inProgress_results_table_td_text application_color_eeColor" + employeeColor + "'>" + employeeName + "</div>"
                                + "</td>"
                                + "<td class='application_inProgress_results_table_td'>"
                                    + "<div id='application_inProgress_icon_" + employeeId + "_" + trainingId + "' class='application_inProgress_icon_div " + "'></div>"
                                    + "<div class='application_inProgress_results_table_td_text' id='application_inProgress_trainingSection_training_" + employeeId + "_" + trainingId + "'><span class='application_action_link' >" + trainingName + "</span>"
                                    + "<div id='application_inProgress_trainingSection_trainingDetails_" + trainingId + "' class='application_inProgress_results_table_hiddenText'>"
                                        + "<div id='application_inProgress_trainingSection_trainingDetails_div'>"
                                            + "<div id='application_inProgress_trainingSection_trainingDetails_courseType'>"
                                                + "<div class='application_inProgress_left_column'>"
                                                    + "<span class='application_text_bolder'>" + global.getLabel('deliveryM') + "</span></div>"
                                                + "<div class='application_inProgress_right_column'>"
                                                    + "<span>" + courseType + "</span></div>"
                                            + "</div>"
                                            + "<div id='application_inProgress_trainingSection_trainingDetails_duration'>"
                                                + "<div class='application_inProgress_left_column'>"
                                                    + "<span class='application_text_bolder'>" + global.getLabel('duration') + "</span></div>"
                                                + "<div class='application_inProgress_right_column'>"
                                                    + "<span> " + durationDays + " " + global.getLabel('days') + " ( " + durationHours + " ) " + global.getLabel('hours') + " </span></div>"
                                            + "</div>"
                                            + "<div id='application_inProgress_trainingSection_trainingDetails_sessionsAvailable'>"
                                                + "<div class='application_inProgress_left_column'>"
                                                    + "<span class='application_text_bolder'>" + global.getLabel('sessions') + "</span></div>"
                                                + "<div class='application_inProgress_right_column'>"
                                                    + "<span> " + sessions + " </span></div>"
                                            + "</div>"
                                            + "<div id='application_inProgress_trainingSection_trainingDetails_cancel'>"
                                                + "<div class='application_inProgress_left_column'>" + book + "</div>"
                                                + "<div class='application_inProgress_right_column'>"
                                                + "<span employeeId=" + employeeId + " trainingId=" + trainingId + " class='application_action_link cancel_prebooking_link'>" + global.getLabel('cancelPrebook') + "</span></div>"
                                            + "</div>"
                                        + "</div></div>"
                                    + "</div>"
                                + "</td>"
                                + "<td class='application_inProgress_results_table_td'><div id='application_inProgress_trainingSection_div_validity_" + employeeId + "_" + i + "' class='application_inProgress_results_table_td_text'>" + startDate + " - " + endDate + "</div></td>"
                                + "</tr>";

                } //end if(this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).shown == true){
            } //end for (var i = 0; i < this.trainingsLength; i++)

            html += "</tbody></table>";
            this.virtualHtml.down('[id=application_inProgress_trainingSection_table]').update(html);
            var prebLinks = this.virtualHtml.select('.cancel_prebooking_link');
            for (var j = 0; j < prebLinks.length; j++) {
                prebLinks[j].stopObserving('click');
                prebLinks[j].observe("click", this.cancel_preBooking.bindAsEventListener(this));
            }
            this.virtualHtml.down('[id=application_inProgress_trainingSection_allTrainingsShowDetails]').observe('click', this.allTrainingsShowDetails.bind(this));
            this.virtualHtml.down('[id=application_inProgress_trainingSection_allTrainingsHideDetails]').observe('click', this.allTrainingsHideDetails.bind(this));

            for (var i = 0; i < idsArray.length; i++) {
                this.virtualHtml.down('[id=' + idsArray[i] + ']').observe('click', this.showHideTrainingDetails.bind(this, idsArray[i]));
            }
        } //end if(this.trainingsLength != 0)
        if (this.trainingsLength == 0 || this.displayedRowsTrainings == 0) {
            html = "<table id='application_inProgress_trainingSection_resultsTable' class='sortable resizable'>"
	                        + "<thead>"
		                        + "<tr><th class='table_sortfirstdesc application_history_table_colNoTtrainings'>" + global.getLabel('training') + "</th></tr>"
	                        + "</thead>"
	                        + "<tbody >"
                                + "<tr><td><div class='application_catalog_noFound'>" + global.getLabel('noTrainings') + "</div></td></tr>"
                            + "</tbody>"
                        + "</table>";
            this.virtualHtml.down('[id=application_inProgress_trainingSection_table]').update(html);
        } //if (this.trainingsLength == 0 || this.displayedRowsTrainings ==0)     

        if (!this.tableTrainingShowed) {
            this.tableTrainingShowed = true;
            TableKit.Sortable.init("application_inProgress_trainingSection_resultsTable");
        } else {
            TableKit.reloadTable("application_inProgress_trainingSection_resultsTable");
        }

    } //end if ((this.responsesToGetTrainings <= 0))      
},


/**
* Method called when the sessions Xml is received.
* @param {HTTPResponse} req Response of the AJAX call
*/
processSessions: function(req) {
    //first of all, keep the buttons 
    var arrayOfButtons = objectToArray(req.EWS.o_buttons.yglui_str_wid_button);
    for (var r = 0; r < arrayOfButtons.length; r++) {
        if (this.hashOfButtons.keys().indexOf(arrayOfButtons[r]['@action']) == -1) {
            this.hashOfButtons.set(arrayOfButtons[r]['@action'], {
                tarap: arrayOfButtons[r]['@tarap'],
                tabId: arrayOfButtons[r]['@tartb'],
                views: arrayOfButtons[r]['@views'],
                labelTag: arrayOfButtons[r]['@label_tag']
            });
        }
    }
    var tarap = this.hashOfButtons.get("LSODISPLAYCAT").tarap;
    var tabId = this.hashOfButtons.get("LSODISPLAYCAT").tabId;
    var views = this.hashOfButtons.get("LSODISPLAYCAT").views;
    this.virtualHtml.down('[id=application_inProgress_linkToCATL]').update("<div onClick='javascript:global.open($H({app: { appId: \"" + tarap + "\",tabId: \"" + tabId + "\",view: \"" + views + "\"}}));' id='application_inProgress_gotoCatalog' class='application_action_link application_inProgress_structure'><span class='application_main_text'>" + global.getLabel('goToCatalog') + "</span></div>");
    //convert the xml into a hash--> take values arrrays
    var employeeId = req.EWS.o_pernr;
    var employeeName = req.EWS.o_ename;
    if (!Object.isEmpty(req.EWS.o_trainings)) {
        var booked = objectToArray(req.EWS.o_trainings.yglui_tab_training);
        for (var i = 0; i < booked.length; i++) {
            var curriculumId = booked[i]['@curr_id'];
            var otype = booked[i]['@otype'];
            var sessionId = booked[i]['@objid'];
            var item = booked[i]['@item'];
            var sessionName = booked[i]['@name'];
            var curriculumMandatory = booked[i]['@curr_mandatory'];
            var curriculumPosition = booked[i]['@curr_position'];
            var startDate = booked[i]['@begda'];
            var endDate = booked[i]['@endda'];
            var courseType = booked[i]['@course_type'];
            var durationDays = booked[i]['@dur_d'];
            var durationHours = booked[i]['@dur_h'];
            var location = booked[i]['@location'];
            var language = booked[i]['@langu'];
            if (Object.isEmpty(language)) {
                language = "&nbsp;";
            }
            var langu_text = booked[i]['@langu_text'];
            if (Object.isEmpty(langu_text)) {
                langu_text = "&nbsp;";
            }
            var priorityPriox = booked[i]['@priox'];
            var priorityText = booked[i]['@priox_cod'];
            //crate the hash
            var shown = true;
            this.hashOfSessions.set(sessionId + "_" + employeeId, {
                curriculumId: curriculumId,
                otype: otype,
                sessionId: sessionId,
                item: item,
                sessionName: sessionName,
                employeeId: employeeId,
                employeeName: employeeName,
                curriculumMandatory: curriculumMandatory,
                curriculumPosition: curriculumPosition,
                startDate: startDate,
                endDate: endDate,
                courseType: courseType,
                durationDays: durationDays,
                durationHours: durationHours,
                location: location,
                language: language,
                langu_text: langu_text,
                priorityPriox: priorityPriox,
                priorityText: priorityText,
                shown: shown
            });
        }
    }
    var labels = req.EWS.labels.item;
    for (var i = 0; i < labels.length; i++) {
        var lableId = labels[i]['@id'];
        var labelValue = labels[i]['@value'];
        this.hashOfLabels.set(lableId, { labelValue: labelValue });
    }
    this.sessionsLength = this.hashOfSessions.keys().length;
    this.addSessions();
},

/**
* add all sessions to the session table for all employees selected
*/
addSessions: function() {
    //view details button info
    var tarap = this.hashOfButtons.get("LSODISPLAYC").tarap;
    var tabId = this.hashOfButtons.get("LSODISPLAYC").tabId;
    var views = this.hashOfButtons.get("LSODISPLAYC").views;
    //create table
    this.displayedRowsSessions = 0;
    this.responsesToGetSessions -= 1;
    if (this.responsesToGetSessions <= 0) {
        if (this.sessionsLength != 0) {
            //create array to hold ids needing an observer
            var idsArray = [];
            //build the html table head structure
            var html = "<div class='application_inProgress_beforeTable'>" +
                                "<div class='application_inProgress_showHide'>" +
                                    "<span class='application_action_link' id='application_inProgress_sessionSection_allSessionsShowDetails'>" + this.showAll + "</span>" + " / " +
                                    "<span class='application_action_link' id='application_inProgress_sessionSection_allSessionsHideDetails'>" + this.hideAll + "</span>" +
                                "</div>" +
                           "</div>" +
                           "<table class='sortable' id='application_inProgress_sessionSection_resultsTable'>" +
                               "<thead>" +
                                   "<tr>" +
                                       "<th class='application_inProgress_results_table_colEmployee'>" + global.getLabel('employee') + "</th>" +
                                       "<th class='application_inProgress_results_table_colItemName table_sortfirstdesc'>" + global.getLabel('sessionName') + "</th>" +
                                       "<th class='application_inProgress_results_table_colDate'>" + global.getLabel('validity') + "</th>" +
                                   "</tr>" +
                               "</thead>" +
                               "<tbody>";
            for (var i = 0; i < this.sessionsLength; i++) {
                if (this.hashOfSessions.get(this.hashOfSessions.keys()[i]).shown == true) {
                    var curriculumId = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).curriculumId;
                    var otype = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).otype;
                    var sessionId = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).sessionId;
                    var item = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).item;
                    var sessionName = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).sessionName;
                    var employeeId = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).employeeId;
                    var employeeName = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).employeeName;
                    var employeeColor = global.getColor(employeeId).toPaddedString(2);
                    var curriculumMandatory = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).curriculumMandatory;
                    var curriculumPosition = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).curriculumPosition;
                    var startDate = objectToSap(new Date()); //this.hashOfSessions.get(this.hashOfSessions.keys()[i]).startDate;
                    var endDate = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).endDate;
                    var courseType = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).courseType;
                    var durationDays = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).durationDays;
                    var durationHours = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).durationHours;
                    var location = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).location;
                    var language = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).language;
                    var langu_text = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).langu_text;
                    var priorityPriox = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).priorityPriox;
                    var priorityText = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).priorityText;
                    if (Object.isEmpty(priorityText)) {
                        var priorityLabel = this.hashOfLabels.get('priox_app').labelValue;
                    }
                    else {
                        var priorityLabel = this.hashOfLabels.get(priorityText).labelValue;
                    }
                    //approved
                    var priority_icon = '';
                    var book = "&nbsp;";
                    if (priorityPriox == '99') {
                        //pending for approval
                        //priority_icon = "application_rounded_question1 " + employeeColor;
                        book = "<span class='application_action_link'>" + global.getLabel('cancelBook') + "</span>";
                    } /*else if (delFlag == "X") {
                        //pending for deletion
                        priority_icon = "application_rounded_x1 " + employeeColor;
                    }*/
                    else if (priorityPriox != '99' /*&& Object.isEmpty(delFlag)*/) {
                        //make available the "cancel book" link
                        book = "<span class='application_action_link'>" + global.getLabel('cancelBook') + "</span>";
                    }
                    if (curriculumId == '00000000' && otype == 'E') {
                        idsArray.push("application_inProgress_sessionSection_session_" + employeeId + "_" + sessionId);
                        this.displayedRowsSessions++;
                        //application_color_" + employeeColor + "
                        html += "<tr id='application_inProgress_sessionSection_row_" + employeeId + "_" + sessionId + "'>";
                        html += "<td class='application_inProgress_results_table_td'>"
                                        + "<div id='application_inProgress_sessionSection_div_name_" + employeeId + "_" + sessionId + "' class='application_inProgress_name_div application_inProgress_results_table_td_text application_color_eeColor" + employeeColor + "'>" + employeeName + "</div>"
                                    + "</td>"
                                    + "<td class='application_inProgress_results_table_td'>"
                                        + "<div id='application_inProgress_icon_" + employeeId + "_" + sessionId + "' class='application_inProgress_icon_div " + "'></div>"
                                        + "<div class='application_inProgress_results_table_td_text' id='application_inProgress_sessionSection_session_" + employeeId + "_" + sessionId + "'><span class='application_action_link' >" + sessionName + "</span>"
                                        + "<div id='application_inProgress_sessionSection_sessionDetails_" + sessionId + "' class='application_inProgress_results_table_hiddenText'>"
                                            + "<div id='application_inProgress_sessionSection_sessionDetails_div'>"
                                                + "<div id='application_inProgress_sessionSection_sessionDetails_courseType'>"
                                                    + "<div class='application_inProgress_left_column'>"
                                                        + "<span class='application_text_bolder'>" + global.getLabel('deliveryM') + "</span></div>"
                                                    + "<div class='application_inProgress_right_column'>"
                                                        + "<span >" + courseType + "</span></div>"
                                                + "</div>"
                                                + "<div id='application_inProgress_sessionSection_sessionDetails_duration'>"
                                                    + "<div class='application_inProgress_left_column'>"
                                                        + "<span class='application_text_bolder'>" + global.getLabel('duration') + "</span></div>"
                                                    + "<div class='application_inProgress_right_column'>"
                                                        + "<span > " + durationDays + " " + global.getLabel('days') + " ( " + durationHours + " ) " + global.getLabel('hours') + " </span></div>"
                                                + "</div>"
                                                + "<div id='application_inProgress_sessionSection_sessionDetails_location'>"
                                                    + "<div class='application_inProgress_left_column'>"
                                                        + "<span class='application_text_bolder'>" + global.getLabel('location') + "</span></div>"
                                                    + "<div class='application_inProgress_right_column'>"
                                                        + "<span >" + location + "</span></div>"
                                                + "</div>"
                                                + "<div id='application_inProgress_sessionSection_sessionDetails_language'>"
                                                    + "<div class='application_inProgress_left_column'>"
                                                        + "<span class='application_text_bolder'>" + global.getLabel('language') + "</span></div>"
                                                    + "<div class='application_inProgress_right_column'>"
                                                        + "<span >" + langu_text + "</span></div>"
                                                + "</div>"
                                                + "<div id='application_inProgress_sessionSection_sessionDetails_status'>"
                                                    + "<div class='application_inProgress_left_column'>"
                                                        + "<span class='application_text_bolder'>" + global.getLabel('status') + "</span></div>"
                                                    + "<div class='application_inProgress_right_column'>"
                                                        + "<span > " + priorityLabel + " </span></div>"
                                                + "</div>"

                                                + "<div id='application_inProgress_sessionSection_sessionDetails_cancel'>"
                                                    + "<div class='application_inProgress_left_column'>"
                                                        + "<span onClick='javascript:global.open($H({app: { appId: \"" + tarap + "\",tabId: \"" + tabId + "\",view: \"" + views + "\"},objectId: \"" + sessionId + "\", oType:\"E\", parentType:\"E\", displayMode:\"display\", begda:\"" + startDate + "\", endda:\"" + endDate + "\" }));' class='application_action_link'>" + global.getLabel('viewDetails') + "</span></div>"
                                                    + "<div class='application_inProgress_right_column'>"
                                                        + "<span id='application_inProgress_cancelBooking_" + i + "'>" + book + "</span></div>"
                                                + "</div>"
                                            + "</div></div>"
                                        + "</div>"
                                    + "</td>"
                                    + "<td class='application_inProgress_results_table_td'><div id='application_inProgress_sessionSection_div_validity_" + employeeId + "_" + sessionId + "' class='application_inProgress_results_table_td_text'>" + sapToDisplayFormat(startDate) + " - " + sapToDisplayFormat(endDate) + "</div></td>"
                                    + "</tr>";
                    } //end if
                    //curriculums
                    else if (otype == 'EC') {
                        //'show details' button info for curriculum
                        var tabIdCurrDetails = this.hashOfButtons.get("LSODISPLAYCUR").tabId;
                        var appIdCurrDetails = this.hashOfButtons.get("LSODISPLAYCUR").tarap;
                        var viewCurrDetails = this.hashOfButtons.get("LSODISPLAYCUR").views;
                        //'cancel' button info for curriculum
                        var tabIdCurrCancel = this.hashOfButtons.get("LSOCANCELBOOKINGCUR").tabId;
                        var tarapCurrCancel = this.hashOfButtons.get("LSOCANCELBOOKINGCUR").tarap;
                        var viewCurrCancel = this.hashOfButtons.get("LSOCANCELBOOKINGCUR").views;

                        this.displayedRowsSessions++;
                        //application_color_" + employeeColor + "
                        html += "<tr id='application_inProgress_sessionSection_row_" + employeeId + "_" + sessionId + "'>";
                        html += "<td class='application_inProgress_results_table_td'>"
                                        + "<div id='application_inProgress_sessionSection_div_name_" + employeeId + "_" + curriculumId + "' class='application_inProgress_name_div application_inProgress_results_table_td_text' application_color_eeColor" + employeeColor + ">" + employeeName + "</div>"
                                    + "</td>"
                                    + "<td class='application_inProgress_results_table_td'>"
                                        + "<div id='application_inProgress_icon_" + employeeId + "_" + sessionId + "' class='application_inProgress_icon_div " + "'></div>"
                                        + "<div class='application_inProgress_results_table_td_text' id='application_inProgress_sessionSection_curr_" + employeeId + "_" + curriculumId + "'>" + sessionName
                                            + "<span class='application_inProgress_training_icon_curr_div application_inProgress_training_icon_curr_options' title='" + global.getLabel('curriculum') + "'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>"
                                            + "<span onClick='javascript:global.open($H({app: { appId: \"" + appIdCurrDetails + "\",tabId: \"" + tabId + "\",view: \"" + viewCurrDetails + "\"},objectId: \"" + sessionId + "\", oType:\"EC\", parentType:\"EC\", displayMode:\"display\", begda:\"" + startDate + "\", endda:\"" + endDate + "\" }));' class='application_action_link application_inProgress_training_icon_curr_options'>" + global.getLabel('viewDetails') + "</span>"
                                            + "<span onClick='javascript:global.open($H({app: { appId: \"" + tarapCurrCancel + "\",tabId: \"" + tabIdCurrCancel + "\",view: \"" + viewCurrCancel + "\"}, allSessions:\"X\", employee:\"" + employeeId + "\", isDelete:\"X\", oType:\"EC\", training:\"" + sessionId + "\", prevApp:\"LMS\"}));' class='application_action_link application_inProgress_training_icon_curr_options'>" + global.getLabel('cancelBook') + "</span>"
                                        + "</div>"
                                    + "</td>"
                                    + "<td class='application_inProgress_results_table_td'><div id='application_inProgress_sessionSection_div_validity_" + employeeId + "_" + curriculumId + "' class='application_inProgress_results_table_td_text'>" + startDate + " - " + endDate + "</div></td>"
                                    + "</tr>";

                    } //end 2nd if
                } //end if(this.hashOfSessions.get(this.hashOfSessions.keys()[i]).shown == true)
            } //end for for (var i = 0; i < this.sessionsLength; i++)
            html += "</tbody></table>";
            //insert the html
            this.virtualHtml.down('[id=application_inProgress_sessionSection_table]').update(html);
            for (var i = 0; i < this.sessionsLength; i++) {
                if (this.virtualHtml.down('[id=application_inProgress_cancelBooking_' + i + ']')) {
                    this.virtualHtml.down('[id=application_inProgress_cancelBooking_' + i + ']').observe('click', this.getCancelBookingReasons.bind(this));
                }
            }
            // processing for curriculums            
            var toInsert = "";
            this.hashOfSessions.each(function(curr) {
                if (curr.value.otype == 'EC') {
                    var counter = 1;
                    var currId = curr.value.curriculumId;
                    var empId = curr.value.employeeId;
                    var sessId = curr.value.sessionId;
                    var key = sessId + "_" + empId;
                    //for trainings inside a curriculum                       
                    for (var i = 0; i < this.sessionsLength; i++) {
                        var curriculumId = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).curriculumId;
                        var otype = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).otype;
                        var employeeId = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).employeeId;
                        if ((curriculumId == currId) && (otype == 'E') && (employeeId == empId) && this.hashOfSessions.get(key).shown) {
                            var sessionId = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).sessionId;
                            var item = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).item;
                            var sessionName = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).sessionName;
                            var employeeName = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).employeeName;
                            var employeeColor = global.getColor(employeeId).toPaddedString(2);
                            var curriculumMandatory = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).curriculumMandatory;
                            var curriculumPosition = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).curriculumPosition;
                            var startDate = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).startDate;
                            var endDate = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).endDate;
                            var courseType = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).courseType;
                            var durationDays = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).durationDays;
                            var durationHours = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).durationHours;
                            var location = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).location;
                            var language = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).language;
                            var priorityPriox = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).priorityPriox;
                            var priorityText = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).priorityText;
                            if (Object.isEmpty(priorityText)) {
                                var priorityLabel = this.hashOfLabels.get('priox_app').labelValue;
                            }
                            else {
                                var priorityLabel = this.hashOfLabels.get(priorityText).labelValue;
                            }

                            idsArray.push("application_inProgress_sessionSection_curr_session_" + employeeId + "_" + curriculumId + "_" + sessionId);
                            toInsert = "";
                            toInsert += "<div id='application_inProgress_sessionSection_curr_session_" + employeeId + "_" + curriculumId + "_" + sessionId + "' class='application_inProgress_sessionSection_curr'><span class='application_action_link'>" + counter + ". " + sessionName + "</span>";
                            toInsert += "<div id='application_inProgress_sessionSection_currDetails_" + employeeId + "_" + curriculumId + "_" + sessionId + "' class='application_inProgress_results_table_hiddenText'>"
                                                + "<div id='application_inProgress_sessionSection_currDetails_div'>"
                                                    + "<div id='application_inProgress_sessionSection_currDetails_courseType'>"
                                                        + "<div class='application_inProgress_left_column'>"
                                                            + "<span class='application_text_bolder'>" + global.getLabel('deliveryM') + "</span></div>"
                                                        + "<div class='application_inProgress_right_column'>"
                                                            + "<span >" + courseType + "</span></div>"
                                                    + "</div>"
                                                    + "<div id='application_inProgress_sessionSection_currDetails_duration'>"
                                                        + "<div class='application_inProgress_left_column'>"
                                                            + "<span class='application_text_bolder'>" + global.getLabel('startDate') + "</span></div>"
                                                        + "<div class='application_inProgress_right_column'>"
                                                            + "<span > " + startDate + " - " + endDate + "</span></div>"
                                                    + "</div>"
                                                    + "<div id='application_inProgress_sessionSection_currDetails_duration'>"
                                                        + "<div class='application_inProgress_left_column'>"
                                                            + "<span class='application_text_bolder'>" + global.getLabel('duration') + "</span></div>"
                                                        + "<div class='application_inProgress_right_column'>"
                                                            + "<span > " + durationDays + " " + global.getLabel('days') + " ( " + durationHours + " ) " + global.getLabel('hours') + " </span></div>"
                                                    + "</div>"
                                                    + "<div id='application_inProgress_sessionSection_currDetails_location'>"
                                                        + "<div class='application_inProgress_left_column'>"
                                                            + "<span class='application_text_bolder'>" + global.getLabel('location') + "</span></div>"
                                                        + "<div class='application_inProgress_right_column'>"
                                                            + "<span >" + location + "</span></div>"
                                                    + "</div>"
                                                    + "<div id='application_inProgress_sessionSection_currDetails_language'>"
                                                        + "<div class='application_inProgress_left_column'>"
                                                            + "<span class='application_text_bolder'>" + global.getLabel('language') + "</span></div>"
                                                        + "<div class='application_inProgress_right_column'>"
                                                            + "<span >" + langu_text + "</span></div>"
                                                    + "</div>"
                                                    + "<div id='application_inProgress_sessionSection_currDetails_status'>"
                                                        + "<div class='application_inProgress_left_column'>"
                                                            + "<span class='application_text_bolder'>" + global.getLabel('status') + "</span></div>"
                                                        + "<div class='application_inProgress_right_column'>"
                                                            + "<span > " + priorityLabel + " </span></div>"
                                                    + "</div>"
                                                    + "<div id='application_inProgress_sessionSection_currDetails_cancel'>"
                                                        + "<div class='application_inProgress_left_column'>"
                                                            + "<span onClick='javascript:global.open($H({app: { appId: \"" + tarap + "\",tabId: \"" + tabId + "\",view: \"" + views + "\"}, objectId: \"" + sessionId + "\", oType:\"E\", parentType:\"E\", displayMode:\"display\", begda:\"" + startDate + "\", endda:\"" + endDate + "\" }));' class='application_action_link'>" + global.getLabel('viewDetails') + "</span></div>"
                                                        + "<div class='application_inProgress_right_column'>"
                                                            + "<span >&nbsp;</span></div>"
                                                    + "</div>"
                                                + "</div></div>"
                            counter++;
                            //insert in the proper corresponding row
                            this.virtualHtml.down('[id=' + "application_inProgress_sessionSection_curr_" + employeeId + "_" + curriculumId + ']').insert(toInsert);
                        } //end if
                    } //end for                                            
                } //end if                                            
            } .bind(this));
            this.virtualHtml.down('[id=application_inProgress_sessionSection_allSessionsShowDetails]').observe('click', this.allSessionsShowDetails.bind(this));
            this.virtualHtml.down('[id=application_inProgress_sessionSection_allSessionsHideDetails]').observe('click', this.allSessionsHideDetails.bind(this));
            for (var i = 0; i < idsArray.length; i++) {
                this.virtualHtml.down('[id=' + idsArray[i] + ']').observe('click', this.showHideSessionDetails.bind(this, idsArray[i]));
            }
        } //end if(this.sessionsLength != 0)
        if (this.sessionsLength == 0 || this.displayedRowsSessions == 0) {
            html = "<table id='application_inProgress_sessionSection_resultsTable' class='sortable resizable'>"
	                        + "<thead>"
		                        + "<tr><th class='table_sortfirstdesc application_history_table_colNoTtrainings'>" + global.getLabel('training') + "</th></tr>"
	                        + "</thead>"
	                        + "<tbody >"
                                + "<tr><td><div class='application_catalog_noFound'>" + global.getLabel('noSessions') + "</div></td></tr>"
                            + "</tbody>"
                        + "</table>";
            this.virtualHtml.down('[id=application_inProgress_sessionSection_table]').update(html);
        } //if (this.trainingsLength == 0 || this.displayedRowsTrainings ==0)  

        if (!this.tableSessionShowed) {
            this.tableSessionShowed = true;
            TableKit.Sortable.init("application_inProgress_sessionSection_resultsTable");
        }
        else {
            TableKit.reloadTable("application_inProgress_sessionSection_resultsTable");
        }

    } //end if (this.responsesToGetSessions <= 0 && this.sessionsLength != 0)     
},
/**
* @description Method that cancel a booking after the user confirmation
*/
getCancelBookingReasons: function(event) {
    if (event.explicitOriginalTarget) {// FFOX
        var cancelBookingIndex = event.explicitOriginalTarget.parentNode.parentNode.id.substr(event.explicitOriginalTarget.parentNode.parentNode.id.lastIndexOf('_') + 1);
    } else
        var cancelBookingIndex = event.srcElement.parentElement.id.substr(event.srcElement.parentElement.id.lastIndexOf('_') + 1);
    this.sessionId = this.hashOfSessions.get(this.hashOfSessions.keys()[cancelBookingIndex]).sessionId;
    this.employeeId = this.hashOfSessions.get(this.hashOfSessions.keys()[cancelBookingIndex]).employeeId;
    if (Object.isEmpty(this.jsonReasons)) {
        var xmlReasons = "<EWS><SERVICE>" + this.cancelReasonsService + "</SERVICE></EWS>";
        this.makeAJAXrequest($H({ xml: xmlReasons, successMethod: 'cancelBooking' }));
    } else {
        this.cancelBooking(this.jsonReasons);
    }
},
/**
* @description Method that cancel a booking after the user confirmation
*/
cancelBooking: function(json) {
    var cancelBookingHtml = "<div>"
                           + "<div>" + global.getLabel('cancellationReason') + "</div>"
                           + "<div><div id='cancelBookingAutocompleter' style='margin-top:10px;margin-bottom:10px;'></div></div>"
                           + "<div class ='dynamicFieldsPanelTable'>" + global.getLabel('cancellationConf') + "</div>"
                           + "</div>";
    var _this = this;
    var contentHTML = new Element('div');
    contentHTML.insert(cancelBookingHtml);
    //buttons
    var buttonsJson = {
        elements: [],
        mainClass: 'moduleInfoPopUp_stdButton_div_right'
    };
    var callBack = function() {
        if (_this)
            _this.cancelBookingRequest();
        cancelCoursePopUp.close();
        delete cancelCoursePopUp;
    };
    var callBack3 = function() {
        cancelCoursePopUp.close();
        delete cancelCoursePopUp;
    };
    var aux2 = {
        idButton: 'Yes',
        label: global.getLabel('yes'),
        handlerContext: null,
        className: 'moduleInfoPopUp_stdButton',
        handler: callBack,
        type: 'button',
        standardButton: true
    };
    var aux3 = {
        idButton: 'No',
        label: global.getLabel('no'),
        handlerContext: null,
        className: 'moduleInfoPopUp_stdButton',
        handler: callBack3,
        type: 'button',
        standardButton: true
    };
    buttonsJson.elements.push(aux2);
    buttonsJson.elements.push(aux3);
    this.ButtonObj = new megaButtonDisplayer(buttonsJson);
    var buttons = this.ButtonObj.getButtons();
    this.ButtonObj.disable('Yes');
    //insert buttons in div
    contentHTML.insert(buttons);

    var cancelCoursePopUp = new infoPopUp({

        closeButton: $H({
            'textContent': 'Close',
            'callBack': function() {

                cancelCoursePopUp.close();
                delete cancelCoursePopUp;
            }
        }),
        htmlContent: contentHTML,
        indicatorIcon: 'information',
        width: 600
    });
    cancelCoursePopUp.create();
    // Autocompleter initialization
    if (!Object.isEmpty(json.EWS)) {//first run of cancelBooking, building autocompleter structure
        this.jsonReasons = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: 'No results found',
                    search: 'Search'
                }
            }
        }
        for (var i = 0; i < json.EWS.o_values.item.length; i++) {
            var data = json.EWS.o_values.item[i]['@id'];
            var text = json.EWS.o_values.item[i]['@value'];
            this.jsonReasons.autocompleter.object.push({
                data: data,
                text: text
            });
        }
    }
    this.reasonsAutocompleter = new JSONAutocompleter('cancelBookingAutocompleter', {
        showEverythingOnButtonClick: true,
        autoWidth: true,
        timeout: 8000,
        templateOptionsList: '#{text}',
        events: $H({ onResultSelected: 'EWS:cancelBookingReasonAutocompleter_resultSelected' })
    }, this.jsonReasons);

},
/**
* @description Fired when it has been chosen a value in the reasons autocompleter, enables/disables the 'yes' button
*/
cancelBookingConfBoxButton: function(args) {
    if (!Object.isEmpty(getArgs(args)) && (getArgs(args).isEmpty == false)) {
        this.ButtonObj.enable('Yes');
        this.reasonChosen = getArgs(args).idAdded;

    } else {
        this.ButtonObj.disable('Yes');
    }
},
/**
* @description Builds the xml and send it to SAP for the cancel request
*/
cancelBookingRequest: function() {
    var xml = "<EWS>"
             + "<SERVICE>" + this.cancelBookingService + "</SERVICE>"
             + "<OBJECT TYPE=\"E\">" + this.sessionId + "</OBJECT>"
             + "<PARAM>"
             + "<O_PERNR>" + this.employeeId + "</O_PERNR>"
             + "<O_REASON>" + this.reasonChosen + "</O_REASON>"
             + "</PARAM>"
             + "</EWS>";
    this.makeAJAXrequest($H({ xml: xml, successMethod: 'cancelBookingAnswer' }));
},
/**
* @description Receives the answer from SAP about the cancel booking request.
*/
cancelBookingAnswer: function(answer) {
    //refresh LMS application
    global.open($H({
        app: {
            appId: this.options.appId,
            tabId: this.options.tabId,
            view: this.options.view
        }
    }));
},

/** Event Handlers **/
/**
*@param args 
*@description when a employee is selected, we redraw the tables
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
    if (this.emptyTrainingsIds.indexOf(employeeId) != -1 || this.emptySessionsIds.indexOf(employeeId) != -1)
        isSaved = true;
    for (var i = 0; i < this.hashOfTrainings.keys().length; i++) {
        if (this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).employeeId == employeeId) {
            isSaved = true;
            this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).shown = true;
        }
    }
    for (var i = 0; i < this.hashOfSessions.keys().length; i++) {
        var canBeRow = false;
        var otype = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).otype;
        var curriculumId = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).curriculumId;
        if ((curriculumId == '00000000' && otype == 'E') || otype == 'EC')
            canBeRow = true;
        if (this.hashOfSessions.get(this.hashOfSessions.keys()[i]).employeeId == employeeId && canBeRow) {
            isSaved = true;
            this.hashOfSessions.get(this.hashOfSessions.keys()[i]).shown = true;
        }
    }
    if (isSaved) {
        this.addTrainings();
        this.addSessions();
    } else {
        //prebooking

        this.xmlGetTrainings = '<EWS>'
                                    + "<SERVICE>" + this.prebookingService + "</SERVICE>"
                                    + "<OBJECT TYPE='P'>" + employeeId + "</OBJECT>"
                                    + "<PARAM><I_APPID>" + this.options.appId + "</I_APPID></PARAM>"
                                    + '</EWS>';
        this.makeAJAXrequest($H({ xml: this.xmlGetTrainings, successMethod: 'processResponse', ajaxID: 'prebook' }));
        //booking
        this.xmlGetSessions = '<EWS>'
                                    + "<SERVICE>" + this.bookingService + "</SERVICE>"
                                    + "<OBJECT TYPE='P'>" + employeeId + "</OBJECT>"
                                    + "<PARAM><I_APPID>" + this.options.appId + "</I_APPID></PARAM>"
                                    + '</EWS>';
        this.makeAJAXrequest($H({ xml: this.xmlGetSessions, successMethod: 'processResponse', ajaxID: 'book' }));
    }
},

cancel_preBooking: function(event) {
    var element = event.element();
    if (element.match(".cancel_prebooking_link")) {
        var employee = element.getAttribute("employeeId");
        var training = element.getAttribute("trainingId");
        var cancelPreBookingHtml = "<div>" + global.getLabel('cancelPre') + "</div>";
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(cancelPreBookingHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function() {
            if (_this)
                _this.cancelPreBookingRequest(employee, training);
            cancelPrePopUp.close();
            delete cancelPrePopUp;
        };
        var callBack3 = function() {
            cancelPrePopUp.close();
            delete cancelPrePopUp;
        };
        var aux = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux);
        buttonsJson.elements.push(aux3);
        var ButtonObj2 = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj2.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);

        var cancelPrePopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    cancelPrePopUp.close();
                    delete cancelPrePopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        cancelPrePopUp.create();
    }
},

cancelPreBookingRequest: function(employee, training) {
    this.xmlCancelPre = "<EWS>"
                        + "<SERVICE>" + this.cancelpreBookService + "</SERVICE>"
                        + "<OBJECT TYPE=\"D\">" + training + "</OBJECT>"
                        + "<PARAM>"
                            + "<O_PERNR>" + employee + "</O_PERNR>"
                        + "</PARAM>"
                     + "</EWS>";
    this.makeAJAXrequest($H({ xml: this.xmlCancelPre, successMethod: 'cancelPreBookingAnswer' }));
},
cancelPreBookingAnswer: function(req) {
    //refresh LMS application
    global.open($H({
        app: {
            appId: this.options.appId,
            tabId: this.options.tabId,
            view: this.options.view
        }
    }));
},

/**
*@param args args[0]: employee ID, args[1]: old color of the employee whose color has changed
*@description When a employee color is changed, we reload coloured parts of the tables
*/
employeeColorChangedHandler: function(args) {
    if (this.getEmployee(args[0]).selected) {
        //trainings
        var rowsT = this.virtualHtml.down('[id=application_inProgress_trainingSection_table]').select('.application_inProgress_name_div');
        for (var i = 0; i < rowsT.length; i++) {
            var div_id = rowsT[i].identify();
            if (div_id.include(args[0])) {
                this.virtualHtml.down('[id=' + div_id + ']').removeClassName('application_color_' + args[1]);
                this.virtualHtml.down('[id=' + div_id + ']').addClassName('application_color_' + global.getSelectedEmployees().get(args[0]).color.strip());
            }
        }
        //trainings icons
        var rowsIconT = this.virtualHtml.down('[id=application_inProgress_trainingSection_table]').select('.application_inProgress_icon_div');
        for (var i = 0; i < rowsIconT.length; i++) {
            var div_id = rowsIconT[i].identify();
            if (div_id.include(args[0]) && this.virtualHtml.down('[id=' + div_id + ']').hasClassName(args[1])) {
                this.virtualHtml.down('[id=' + div_id + ']').removeClassName(args[1]);
                this.virtualHtml.down('[id=' + div_id + ']').addClassName(global.getSelectedEmployees().get(args[0]).color.strip());
            }
        }
        //sessions
        var rows = this.virtualHtml.down('[id=application_inProgress_sessionSection_resultsTable]').select('.application_inProgress_name_div');
        for (var i = 0; i < rows.length; i++) {
            var div_id = rows[i].identify();
            if (div_id.include(args[0])) {
                this.virtualHtml.down('[id=' + div_id + ']').removeClassName('application_color_' + args[1]);
                this.virtualHtml.down('[id=' + div_id + ']').addClassName('application_color_' + global.getSelectedEmployees().get(args[0]).color.strip());
            }
        }
        //sessions icons
        var rowsIcon = this.virtualHtml.down('[id=application_inProgress_sessionSection_resultsTable]').select('.application_inProgress_icon_div');
        for (var i = 0; i < rowsIcon.length; i++) {
            var div_id = rowsIcon[i].identify();
            if (div_id.include(args[0]) && this.virtualHtml.down('[id=' + div_id + ']').hasClassName(args[1])) {
                this.virtualHtml.down('[id=' + div_id + ']').removeClassName(args[1]);
                this.virtualHtml.down('[id=' + div_id + ']').addClassName(global.getSelectedEmployees().get(args[0]).color.strip());
            }
        }
    }
},
/**
*@param employeeId Employee ID of employee who has been unselected
*@description When a employee color is changed, we reload coloured parts of his calendar
*/
onEmployeeUnselected: function(args) {
    var employeeId = args.id;
    //trainings  
    this.trainingsLength = this.hashOfTrainings.keys().length;
    for (var i = this.trainingsLength - 1; i >= 0; i--) {
        var trainingId = this.hashOfTrainings.get(this.hashOfTrainings.keys()[i]).trainingId;
        //we delete employee's trainings from the html         
        if (this.virtualHtml.down('[id=' + "application_inProgress_trainingSection_row_" + employeeId + "_" + trainingId + ']')) {
            this.virtualHtml.down('[id=' + "application_inProgress_trainingSection_row_" + employeeId + "_" + trainingId + ']').remove();
            var key = trainingId + "_" + employeeId;
            this.hashOfTrainings.get(key).shown = false;
            //decrement displayed rows
            this.displayedRowsTrainings--;
            if (!this.tableTrainingShowed) {
                this.tableTrainingShowed = true;
                TableKit.Sortable.init("application_inProgress_trainingSection_resultsTable");
            } else {
                TableKit.reloadTable("application_inProgress_trainingSection_resultsTable");
            }
        }
    }
    if (this.displayedRowsTrainings == 0) {
        //drawing the empty table with the "No trainings" message           
        var html = "<table id='application_inProgress_trainingSection_resultsTable' class='sortable resizable'>"
                            + "<thead>"
	                            + "<tr><th class='table_sortfirstdesc application_history_table_colNoTtrainings'>" + global.getLabel('training') + "</th></tr>"
                            + "</thead>"
                            + "<tbody >"
                                + "<tr><td><div class='application_catalog_noFound'>" + global.getLabel('noTrainings') + "</div></td></tr>"
                            + "</tbody>"
                        + "</table>";
        this.virtualHtml.down('[id=application_inProgress_trainingSection_table]').update(html);
        if (this.tableTrainingShowed == false) {
            TableKit.Sortable.init("application_inProgress_trainingSection_resultsTable");
            this.tableTrainingShowed = true;
        }
        else {
            TableKit.reloadTable("application_inProgress_trainingSection_resultsTable");
        }
    }
    //sessions      
    this.sessionsLength = this.hashOfSessions.keys().length;
    for (var i = this.sessionsLength - 1; i >= 0; i--) {
        var sessionId = this.hashOfSessions.get(this.hashOfSessions.keys()[i]).sessionId;
        //we delete employee's sessions from the html                        
        if (this.virtualHtml.down('[id=' + "application_inProgress_sessionSection_row_" + employeeId + "_" + sessionId + ']')) {
            this.virtualHtml.down('[id=' + "application_inProgress_sessionSection_row_" + employeeId + "_" + sessionId + ']').remove();
            var key = sessionId + "_" + employeeId;
            this.hashOfSessions.get(key).shown = false;
            //decrement displayed rows
            this.displayedRowsSessions--;
            if (this.tableSessionShowed == false) {
                TableKit.Sortable.init("application_inProgress_sessionSection_resultsTable");
                this.tableSessionShowed = true;
            }
            else {
                TableKit.reloadTable("application_inProgress_sessionSection_resultsTable");
            }
        }
    }
    if (this.displayedRowsSessions == 0) {
        //drawing the empty table with the "No trainings" message           
        var html = "<table id='application_inProgress_sessionSection_resultsTable' class='sortable resizable'>"
                            + "<thead>"
	                            + "<tr><th class='table_sortfirstdesc application_history_table_colNoTtrainings'>" + global.getLabel('training') + "</th></tr>"
                            + "</thead>"
                            + "<tbody >"
                                + "<tr><td><div class='application_catalog_noFound'>" + global.getLabel('noSessions') + "</div></td></tr>"
                            + "</tbody>"
                        + "</table>";
        this.virtualHtml.down('[id=application_inProgress_sessionSection_table]').update(html);
        if (this.tableSessionShowed == false) {
            TableKit.Sortable.init("application_inProgress_sessionSection_resultsTable");
            this.tableSessionShowed = true;
        }
        else {
            TableKit.reloadTable("application_inProgress_sessionSection_resultsTable");
        }
    }

    //delete the employee from the hash
    this.selectedEmployees.unset(employeeId);
},
/**
* @description Shows all training' details
*/
allTrainingsShowDetails: function() {
    var rows = this.virtualHtml.down('[id=application_inProgress_trainingSection_table]').select('.application_inProgress_results_table_hiddenText');
    for (var i = 0; i < rows.length; i++) {
        rows[i].removeClassName('application_inProgress_results_table_hiddenText');
        rows[i].addClassName('application_inProgress_results_table_showedText');
    }
},
/**
* @description Hidess all training' details
*/
allTrainingsHideDetails: function() {
    var rows = this.virtualHtml.down('[id=application_inProgress_trainingSection_table]').select('.application_inProgress_results_table_showedText');
    for (var i = 0; i < rows.length; i++) {
        rows[i].removeClassName('application_inProgress_results_table_showedText');
        rows[i].addClassName('application_inProgress_results_table_hiddenText');
    }
},
/**
* @param {Number} args Information about the training (its row)
* @description Shows/Hides an trainings's details
*/
showHideTrainingDetails: function(args) {
    //for expanded divs, hide them. for hidden ones, expand them
    var divShown = this.virtualHtml.down('[id=' + args + ']').select('.application_inProgress_results_table_showedText')[0];
    var divHidden = this.virtualHtml.down('[id=' + args + ']').select('.application_inProgress_results_table_hiddenText')[0];
    if (!Object.isEmpty(divHidden)) {
        divHidden.removeClassName('application_inProgress_results_table_hiddenText');
        divHidden.addClassName('application_inProgress_results_table_showedText');
    }
    else {
        divShown.removeClassName('application_inProgress_results_table_showedText');
        divShown.addClassName('application_inProgress_results_table_hiddenText');
    }
},
/**
* @description Shows all Sessions' details
*/
allSessionsShowDetails: function() {
    var rows = this.virtualHtml.down('[id=application_inProgress_sessionSection_resultsTable]').select('.application_inProgress_results_table_hiddenText');
    for (var i = 0; i < rows.length; i++) {
        rows[i].removeClassName('application_inProgress_results_table_hiddenText');
        rows[i].addClassName('application_inProgress_results_table_showedText');
    }
},
/**
* @description Hidess all Sessions' details
*/
allSessionsHideDetails: function() {
    var rows = this.virtualHtml.down('[id=application_inProgress_sessionSection_resultsTable]').select('.application_inProgress_results_table_showedText');
    for (var i = 0; i < rows.length; i++) {
        rows[i].removeClassName('application_inProgress_results_table_showedText');
        rows[i].addClassName('application_inProgress_results_table_hiddenText');
    }
},

/**
* @param {Number} args Information about the session (its id)
* @description Shows/Hides an session's details
*/
showHideSessionDetails: function(args) {
    //for expanded divs, hide them. for hidden ones, expand them
    var divShown = this.virtualHtml.down('[id=' + args + ']').select('.application_inProgress_results_table_showedText')[0];
    var divHidden = this.virtualHtml.down('[id=' + args + ']').select('.application_inProgress_results_table_hiddenText')[0];
    if (!Object.isEmpty(divHidden)) {
        divHidden.removeClassName('application_inProgress_results_table_hiddenText');
        divHidden.addClassName('application_inProgress_results_table_showedText');
    }
    else {
        divShown.removeClassName('application_inProgress_results_table_showedText');
        divShown.addClassName('application_inProgress_results_table_hiddenText');
    }
},

/**
* @description called when the application is not shown.
*/
close: function($super) {
    $super();
    this.emptyTrainingsIds.clear();
    this.emptySessionsIds.clear();
    //unattach event handlers
    document.stopObserving('EWS:employeeColorChanged', this.employeeColorChangedHandlerBinding);
    document.stopObserving('EWS:cancelBookingReasonAutocompleter_resultSelected', this.cancelBookingConfBoxButtonBinding);
}


});