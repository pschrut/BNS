/** 
* @fileOverview teacher.js 
* @description File containing class TEACH This class is the one used to run teacher application
* This application gives the user the possibility to maintain an overview about the courses to give and the history for the trainings givens
*/

/**
*@constructor
*@description Class TEACH.
*@augments Application 
*/
var TEACH = Class.create(Application, {

    /*** SERVICES ***/
    /** 
    * Service used to get the trainings.
    * @type String
    */
    getTrainings: "GET_TEA_SESS",
    /** 
    * Service used to get the actions when you click in one training.
    * @type String
    */
    nodeClickedService: 'GET_CAT_ACTIO',
    /** 
    * Service used to get the cancelation Reasons.
    * @type String
    */
    cancelReasonsService: "GET_CAN_REAS",
    /** 
    * Service used to cancel a training to give.
    * @type String
    */
    cancelCourseService: "CANCEL_COURSE",
    /** 
    * Service used to confirm a training to give.
    * @type String
    */
    firmlyBookCourseService: "FIRMLY_BOOK",
    /*** VARIABLES ***/
    /**
    * @type XML
    * @XML to store the trainings to give
    */
    xmlGetTrainingsToGive: XmlDoc.create(),
    /**
    * @type XML
    * @XML to store the trainings given
    */
    xmlGetTrainingsGiven: XmlDoc.create(),
    /**
    * @type Hash
    * @XML to store the trainings structure
    */
    hashOfTrainings: new Hash(),
    /**
    * @type Boolean
    * @Flag to know if the tableKit for trainings to give is showed
    */
    tableShowed: false,
    /**
    * @type Boolean
    * @Flag to know if the tableKit for trainigs given is showed
    */
    tableGivenShowed: false,
    /**
    * @type Array
    * @Array to store the schedules' Ids
    */
    schedulesIds: [],
    /**
    * @type String
    * @Parent Container to call the service
    */
    containerParent: 'LRN_CAT',
    /**
    * @type String
    * @Child Container to call the service
    */
    containerChild: 'TM_L_TEA',

    /**
    *@param $super The superclass (Application)
    *@description Instantiates the app
    */
    initialize: function($super, options) {
        $super(options);
        this.actionClickedBinding = this.actionClicked.bindAsEventListener(this);
    },
    /**
    *@param $super The superclass: Application
    *@description when the user clicks on the app tag, load the html structure and sets the event observers
    * which have changed.
    */
    run: function($super, args) {
        $super(args);
        //parameters
        this.endDate = Date.today().addDays(-1);
        this.begDate = Date.today().addDays(-1).add(-1).year();
        this.begDate = this.begDate.toString('yyyy-MM-dd');
        this.endDate = this.endDate.toString('yyyy-MM-dd');
        this.objId = global.objectId;
        this.objType = global.objectType;
        this.applicationId = args.get('app').appId;
        if (this.firstRun) {
            this.createHTML();
        }
        this.callService();
        document.observe('EWS:teacher_DataChangeFrom', this.refresh.bindAsEventListener(this));
        document.observe('EWS:teacher_DataChangeTo', this.refresh.bindAsEventListener(this));
        document.observe(this.applicationId + ':action', this.actionClickedBinding);
        document.observe('EWS:cancelCourseReasonAutocompleter_resultSelected_teacher', this.cancelCourseConfBoxButton.bindAsEventListener(this));

    },
    /**
    *@description we are going to build all the HTML structure
    */
    createHTML: function() {
        var html = "<div id='application_teacher_contain_title_give' class='application_teacher_contain_title'>"
                        + "<h2 id='application_teacher_title_give' class='application_teacher_title'>" + global.getLabel('trainingsGive') + "</h2>"
                        + "<div id='application_teacher_giveDesc' class='application_teacher_desc'>" + global.getLabel('giveDesc') + "</div>"
                   + "</div>"
                   + "<div id='application_teacher_give_table' class='application_teacher_table_contain'></div>"
                   + "<div id='application_teacher_contain_title_given' class='application_teacher_contain_title'>"
                        + "<h2 id='application_teacher_title_given' class='application_teacher_title'>" + global.getLabel('trainingsGiven') + "</h2>"
                        + "<div id='application_teacher_givenDesc' class='application_teacher_desc'>" + global.getLabel('givenDesc') + "</div>"
                   + "</div>"
                   + "<div id='application_teacher_given_datepicker' class='application_teacher_datepicker_contain'>"
                        + "<div id='application_teacher_labelDates' class='application_teacher_dataLabel'>" + global.getLabel('reference') + "</div>"
                        + "<div id='application_teacher_from' class='application_teacher_fromTo'>" + global.getLabel('from') + "</div>"
                        + "<div id ='application_teacher_dateFrom' class='application_teacher_datePickerFrom'></div>"
                        + "<div id='application_teacher_to' class='application_teacher_fromTo'>" + global.getLabel('to') + "</div>"
                        + "<div id ='application_teacher_dateTo' class='application_teacher_datePickerTo'></div>"
                   + "</div>"
                   + "<div id='application_teacher_given_table' class='application_teacher_table_contain'></div>";
        this.virtualHtml.insert(html);
        //create datepickers
        this.createDates();
    },
    /**
    *@description we call get trainings service to get the list of trainings to 
    */
    callService: function() {
        // XML to get the trainings to give in the future (without dates)
        this.xmlGetTrainingsToGive = "<EWS>"
                                        + "<SERVICE>" + this.getTrainings + "</SERVICE>"
                                        + "<OBJECT TYPE='" + this.objType + "'>" + this.objId + "</OBJECT>"
                                    + "</EWS>";



        // XML to get the trainings given 
        this.xmlGetTrainingsGiven = "<EWS>"
                                        + "<SERVICE>" + this.getTrainings + "</SERVICE>"
                                        + "<OBJECT TYPE='" + this.objType + "'>" + this.objId + "</OBJECT>"
                                        + "<PARAM>"
                                            + "<I_BEGDA>" + this.begDate + "</I_BEGDA>"
                                            + "<I_ENDDA>" + this.endDate + "</I_ENDDA>"
                                            + "<I_APPID>" + this.applicationId + "</I_APPID>"
                                        + "</PARAM>"
                                    + "</EWS>";
        this.makeAJAXrequest($H({ xml: this.xmlGetTrainingsToGive, successMethod: 'processResponse', ajaxID: 'toGive' }));
        this.makeAJAXrequest($H({ xml: this.xmlGetTrainingsGiven, successMethod: 'processResponse', ajaxID: 'given' }));
    },
    /**
    *@param req is the response form sap with the information
    *@param id is the way to identify the ajax request
    *@description we receive the information, store the schedule structure and call to the right function to fill the HTML
    */
    processResponse: function(req, id) {
        if (id == 'toGive') {
            if (!Object.isEmpty(req.EWS.o_trainings)) {
                var trainings = objectToArray(req.EWS.o_trainings.yglui_tab_training);
                var schedule = objectToArray(req.EWS.o_schedule.yglui_tab_schedule);

                for (var i = 0; i < trainings.length; i++) {
                    var hashOfSchedules = new Hash();
                    var c = 0;
                    // storing the schedules details into a hash
                    for (var j = 0; j < schedule.length; j++) {
                        if (trainings[i]['@objid'] == schedule[j]['@objid']) {
                            var dayTypeSchedule = schedule[j]['@daytxt'];
                            var dayDataSchedule = schedule[j]['@evdat'];
                            var startTimeSchedule = schedule[j]['@beguz'];
                            var endTimeSchedule = schedule[j]['@enduz'];
                            hashOfSchedules.set(c, {
                                dayTypeSchedule: dayTypeSchedule,
                                dayDataSchedule: dayDataSchedule,
                                startTimeSchedule: startTimeSchedule,
                                endTimeSchedule: endTimeSchedule
                            });
                            c++;
                        }
                        this.hashOfTrainings.set(trainings[i]['@objid'], {
                            hashOfSchedules: hashOfSchedules,
                            begdaTraining: trainings[i]['@begda']
                        })
                    }
                }
            }
            this.trainingsToGive(req);
        }
        else
        //this.createDates(req);
            this.trainingsGiven(req);
    },
    /**
    *@param req is the response form sap with the information
    *@description we receive the information for the trainings to give, and we fill the HTML creating a table to show the information
    */
    trainingsToGive: function(req) {
        var labels = req.EWS.labels.item;
        if (!Object.isEmpty(req.EWS.o_trainings)) {
            var trainings = objectToArray(req.EWS.o_trainings.yglui_tab_training);
            //array to store the id of the divs to observe events
            var idsArray = [];
            //creating the HTML table
            var html = "<table id='application_teacher_tableKit' class='sortable application_teacher_table'>"
                    + "<thead>"
                        + "<tr><th class='table_sortfirstdesc application_teacher_tName' id='ThName'>" + global.getLabel('TrainName') + "</th><th id='ThLocation' class='application_teacher_thLoc'>" + global.getLabel('location') + "</th><th id='period' class='application_teacher_thPer'>" + global.getLabel('period') + "</th><th id='ThStatus' class='application_teacher_thStatus'>" + global.getLabel('status') + "</th><th id='ThReserved' class='application_teacher_thResr'>" + global.getLabel('reserved') + "</th><th id='ThWaiting' class='application_teacher_thWait'>" + global.getLabel('waiting') + "</th></tr>"
                    + "</thead><tbody id='tableKit_body'>";
            //filling the table        
            for (var i = 0; i < trainings.length; i++) {
                var name = trainings[i]['@name'];
                var location = trainings[i]['@location'];
                if (Object.isEmpty(location)) {
                    location = '';
                }
                var start = sapToDisplayFormat(trainings[i]['@begda']);
                var end = sapToDisplayFormat(trainings[i]['@endda']);
                var period = start + "&nbsp; - &nbsp;" + end;
                var code = trainings[i]['@istat_code'];
                for (var j = 0; j < labels.length; j++) {
                    if (labels[j]['@id'] == code)
                        var status = labels[j]['@value'];
                }
                var allowed = trainings[i]['@fcont'];
                var booked = trainings[i]['@bcont'];
                if (Object.isEmpty(booked))
                    booked = 0;
                var reserved = booked + "/" + allowed;
                var waiting = trainings[i]['@wcont'];
                if (Object.isEmpty(waiting))
                    waiting = 0;

                var res = parseInt(booked);
                var allow = parseInt(allowed);
                var bar = (res * 100) / allow;
                if (bar <= 66)
                    var color = '#55D455';
                else if (bar <= 99)
                    var color = '#DADA44';
                else
                    var color = '#FF0000';
                var barLenght = (40 / allow) * res;
                this.divId = 'application_teacher_period_' + trainings[i]['@objid'];
                idsArray.push(this.divId);
                html += "<tr id='Tr1'><td><div id='name_" + this.divId + "'><span id='span" + i + "'class='application_action_link'>" + name + "</span></div></td><td>" + location + "</td><td id='" + this.divId + "_TD'><div id='" + this.divId + "'><span class='application_action_link'>" + period + "</span></div></td><td>" + status + "</td><td><div class='application_book_allowed'><div id='application_book_bar" + i + "' class='application_book_reserved' style='width:" + barLenght + "px; background-color:" + color + "'></div></div>" + reserved + "</td><td>" + waiting + "</td></tr>";

            }
            html += "</tbody></table>";
            //Creating the tableKit
            if (this.tableShowed == false) {
                this.virtualHtml.down('[id=application_teacher_give_table]').update(html);
                TableKit.Sortable.init("application_teacher_tableKit", { pages: global.paginationLimit });
                TableKit.options.autoLoad = false;
                this.tableShowed = true;
                this.virtualHtml.down('[id=application_teacher_give_table]').show();
            }
            //if the tablekit was created, we refres it
            else {
                this.virtualHtml.down('[id=application_teacher_give_table]').update(html);
                TableKit.reloadTable("application_teacher_tableKit");
                this.virtualHtml.down('[id=application_teacher_give_table]').show();
            }
            //observe for all the trainigns schedules
            for (var j = 0; j < idsArray.length; j++) {
                this.schedulesIds.push(idsArray[j]);
                this.virtualHtml.down('[id=' + idsArray[j] + ']').observe('click', this._showSchedule.bind(this, j));
                this.virtualHtml.down('[id=name_' + idsArray[j] + ']').observe('click', this.nodeSessionClicked.bindAsEventListener(this, idsArray[j]));
            }
        }
        //if we don't have sessions to show
        else {
            var html = "<table id='application_teacher_tableKit' class='sortable application_teacher_table'>"
                    + "<thead>"
                        + "<tr><th class='table_sortfirstdesc application_teacher_tName' id='ThName'>" + global.getLabel('TrainName') + "</th><th id='ThLocation' class='application_teacher_thLoc'>" + global.getLabel('location') + "</th><th id='period' class='application_teacher_thPer'>" + global.getLabel('period') + "</th><th id='ThStatus' class='application_teacher_thStatus'>" + global.getLabel('status') + "</th><th id='ThReserved' class='application_teacher_thResr'>" + global.getLabel('reserved') + "</th><th id='ThWaiting' class='application_teacher_thWait'>" + global.getLabel('waiting') + "</th></tr>"
                    + "</thead>"
                    + "<tbody>"
                        + "<tr id='Tr1'><td>&nbsp;</td><td>&nbsp;</td><td>" + global.getLabel('noSessionsTea1') + "</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>"
                    + "</tbody>"
                   + "</table>";
            if (this.tableShowed == false) {
                this.virtualHtml.down('[id=application_teacher_give_table]').update(html);
                TableKit.Sortable.init("application_teacher_tableKit");
                this.tableShowed = true;
                this.virtualHtml.down('[id=application_teacher_give_table]').show();
            }
            else {
                this.virtualHtml.down('[id=application_teacher_give_table]').update(html);
                TableKit.reloadTable("application_teacher_tableKit");
                this.virtualHtml.down('[id=application_teacher_give_table]').show();
            }

        }
    },
    /**
    *@param sessionNumber give you the number of the session in each training
    *@description show the schedule for each session if you click on it
    */
    _showSchedule: function(sessionNumber) {
        var id;
        var divId;
        var Css = "";
        //identifying the object to show
        if (!Object.isEmpty(this.schedulesIds[sessionNumber])) {
            id = this.schedulesIds[sessionNumber].split('application_teacher_period_').join('');
            divId = this.schedulesIds[sessionNumber];
            Css = 'book_application_content_schedule';
        }

        if (!this.virtualHtml.down('[id=' + divId + '_I]')) {
            var newDiv = "<div id='" + divId + "_I'></div>";
            this.virtualHtml.down('[id=' + divId + '_TD]').insert(newDiv);
            var length = this.hashOfTrainings.get(id).hashOfSchedules.keys().length;
            var html = "<div id='book_application_schedule' class='" + Css + "'>";
            //create the divs with all the schedule
            for (var i = 0; i < length; i++) {
                var day = this.hashOfTrainings.get(id).hashOfSchedules.get(i).dayTypeSchedule;
                var date = this.hashOfTrainings.get(id).hashOfSchedules.get(i).dayDataSchedule;
                var dateFinal = sapToDisplayFormat(date);
                var startHour = this.hashOfTrainings.get(id).hashOfSchedules.get(i).startTimeSchedule;
                var endHour = this.hashOfTrainings.get(id).hashOfSchedules.get(i).endTimeSchedule;
                html += "<div id='book_application_schedule_row_" + i + "'>"
                        + "<div id='book_application_schedule_left" + i + "' class='book_application_left_column'>"
                            + "<span id='book_application_days_" + i + "' class='book_application_text_bolder'>" + day + "&nbsp;</span>"
                        + "</div>"
                        + "<div id='book_application_schedule_text" + i + "'>"
                            + "<span id='book_application_date_" + i + "'>" + dateFinal + "</span>"
                        + "</div>"
                        + "<div id='book_application_schedule_text" + i + "' class='book_application_schedule_text'>"
                            + "<span id='book_application_startH_" + i + "'>" + startHour + "&nbsp;-</span>"
                        + "</div>"
                        + "<div id='book_application_schedule_text" + i + "' class='book_application_schedule_text_final'>"
                            + "<span id='book_application_endH_" + i + "'>" + endHour + "</span>"
                        + "</div>"
                    + "</div>";
            }

            html += "</div>";
            this.virtualHtml.down('[id=' + divId + '_I]').update(html);
            this.virtualHtml.down('[id=' + divId + '_I]').addClassName('application_book_results_table_book_showedText');
        }
        else {
            var divShown = this.virtualHtml.down('[id=' + divId + '_TD]').select('.application_book_results_table_book_showedText')[0];
            var divHidden = this.virtualHtml.down('[id=' + divId + '_TD]').select('.application_book_results_table_book_hiddenText')[0];
            if (divHidden) {
                divHidden.removeClassName('application_book_results_table_book_hiddenText');
                divHidden.addClassName('application_book_results_table_book_showedText');
            }
            else {
                divShown.removeClassName('application_book_results_table_book_showedText');
                divShown.addClassName('application_book_results_table_book_hiddenText');
            }
        }
    },
    /**
    *@param req, response from sap with the information
    *@description we create 2 datePickers to filter the information by date
    */
    createDates: function(req) {
        var defaultFrom = Date.parseExact(this.begDate, "yyyy-MM-dd").toString('yyyyMMdd');
        var defaultTo = Date.parseExact(this.endDate, "yyyy-MM-dd").toString('yyyyMMdd');
        var maxDate = Date.today().toString('yyyyMMdd');
        this.teacherAppFrom = new DatePicker('application_teacher_dateFrom', { defaultDate: defaultFrom, toDate: maxDate, events: $H({ 'correctDate': 'EWS:teacher_DataChangeFrom' }) });
        this.teacherAppTo = new DatePicker('application_teacher_dateTo', { defaultDate: defaultTo, toDate: maxDate, events: $H({ 'correctDate': 'EWS:teacher_DataChangeTo' }) });
        this.teacherAppFrom.linkCalendar(this.teacherAppTo);
        //this.trainingsGiven(req);
    },
    /**
    *@param req, response from sap with the information
    *@description fill the table with the trainings given
    */
    trainingsGiven: function(req) {
        //reading info of button to view details
        var appId, tabId, view;
        if (req.EWS.o_buttons) {
            appId = req.EWS.o_buttons.yglui_str_wid_button['@tarap'];
            tabId = req.EWS.o_buttons.yglui_str_wid_button['@tartb'];
            view = req.EWS.o_buttons.yglui_str_wid_button['@views'];
        }
        if (!Object.isEmpty(req.EWS.o_trainings)) {
            var trainings = objectToArray(req.EWS.o_trainings.yglui_tab_training);
            //Creating the HTML table
            var html = "<table id='application_teacher_given_tableKit' class='sortable application_teacher_table'>"
                    + "<thead>"
                        + "<tr><th class='table_sortfirstdesc application_teacher_tGName' id='ThGName'>" + global.getLabel('TrainName') + "</th><th id='ThGLocation' class='application_teacher_thGLoc'>" + global.getLabel('location') + "</th><th id='thGperiod' class='application_teacher_thGPer'>" + global.getLabel('period') + "</th></tr>"
                    + "</thead><tbody id='tableKit_given_body'>";
            //filling the table with the courses        
            for (var i = 0; i < trainings.length; i++) {
                var name = trainings[i]['@name'];
                var location = trainings[i]['@location'];
                if (Object.isEmpty(location)) {
                    location = '';
                }
                var start = sapToDisplayFormat(trainings[i]['@begda']);
                var end = sapToDisplayFormat(trainings[i]['@endda']);
                var startDate = trainings[i]['@begda'];
                var endDate = trainings[i]['@endda'];
                var objId = trainings[0]['@objid'];
                var period = start + "&nbsp; - &nbsp;" + end;
                html += "<tr id='Tr1'>";
                //html += "<td>" + name + "</td><td>" + location + "</td><td>" + period + "</td></tr>";
                html += "<td><div class='application_action_link' onClick='javascript:global.open($H({app: { appId: \"" + appId + "\",tabId: \"" + tabId + "\",view: \"" + view + "\"}, objectId: \"" + objId + "\", oType:\"E\", parentType:\"E\", displayMode:\"display\", begda:\"" + startDate + "\", endda:\"" + endDate + "\" }));'>" + name + "</div></td><td>" + location + "</td><td>" + period + "</td></tr>";
            }
            html += "</tbody></table>";
            //Creating the tableKit
            if (this.tableGivenShowed == false) {
                this.virtualHtml.down('[id=application_teacher_given_table]').update(html);
                TableKit.Sortable.init("application_teacher_given_tableKit");
                this.tableGivenShowed = true;
                this.virtualHtml.down('[id=application_teacher_given_table]').show();
            }
            else {
                this.virtualHtml.down('[id=application_teacher_given_table]').update(html);
                TableKit.reloadTable("application_teacher_given_tableKit");
                this.virtualHtml.down('[id=application_teacher_given_table]').show();
            }
        }
        //We don't have sessions to show
        else {
            var html = "<table id='application_teacher_given_tableKit' class='sortable application_teacher_table'>"
                    + "<thead>"
                        + "<tr><th class='table_sortfirstdesc application_teacher_tGName' id='ThGName'>" + global.getLabel('TrainName') + "</th><th id='ThGLocation' class='application_teacher_thGLoc'>" + global.getLabel('location') + "</th><th id='thGperiod' class='application_teacher_thGPer'>" + global.getLabel('period') + "</th></tr>"
                    + "</thead>"
                    + "<tbody>"
                        + "<tr id='Tr1'><td>&nbsp;</td><td>" + global.getLabel('noSessionsTea2') + "</td><td>&nbsp;</td></tr>"
                    + "</tbody>"
                  + "</table>";
            if (this.tableGivenShowed == false) {
                this.virtualHtml.down('[id=application_teacher_given_table]').update(html);
                TableKit.Sortable.init("application_teacher_given_tableKit", { pages: global.paginationLimit });
                TableKit.options.autoLoad = false;
                this.tableShowed = true;
                this.virtualHtml.down('[id=application_teacher_given_table]').show();
            }
            else {
                this.virtualHtml.down('[id=application_teacher_given_table]').update(html);
                TableKit.reloadTable("application_teacher_given_tableKit");
                this.virtualHtml.down('[id=application_teacher_given_table]').show();
            }
        }
    },
    /**
    *@param event, variable with the event information
    *@description if you change the date in datePickers, the information is refreshed
    */
    refresh: function(event) {
        args = getArgs(event);
        var dayTo = this.teacherAppTo.getDateAsArray().day;
        var monthTo = this.teacherAppTo.getDateAsArray().month;
        var yearTo = this.teacherAppTo.getDateAsArray().year;
        var dayFrom = this.teacherAppFrom.getDateAsArray().day;
        var monthFrom = this.teacherAppFrom.getDateAsArray().month;
        var yearFrom = this.teacherAppFrom.getDateAsArray().year;
        if (dayTo.length == 1)
            dayTo = '0' + this.teacherAppTo.getDateAsArray().day;
        if (dayFrom.length == 1)
            dayFrom = '0' + this.teacherAppFrom.getDateAsArray().day;
        if (monthTo.length == 1)
            monthTo = '0' + this.teacherAppTo.getDateAsArray().month;
        if (monthFrom.length == 1)
            monthFrom = '0' + this.teacherAppFrom.getDateAsArray().month;
        var refreshFrom = yearFrom + '-' + monthFrom + '-' + dayFrom;
        var refreshTo = yearTo + '-' + monthTo + '-' + dayTo;
        this.xmlGetTrainingsGiven = "<EWS>"
                                        + "<SERVICE>" + this.getTrainings + "</SERVICE>"
                                        + "<OBJECT TYPE='" + this.objType + "'>" + this.objId + "</OBJECT>"
                                        + "<PARAM>"
                                            + "<I_BEGDA>" + refreshFrom + "</I_BEGDA>"
                                            + "<I_ENDDA>" + refreshTo + "</I_ENDDA>"
                                            + "<I_APPID>" + this.applicationId + "</I_APPID>"
                                        + "</PARAM>"
                                    + "</EWS>";
        this.makeAJAXrequest($H({ xml: this.xmlGetTrainingsGiven, successMethod: 'trainingsGiven' }));
    },
    nodeSessionClicked: function(event, courseId) {
        var id = courseId.split('_')[3];
        var aux = this.appName + "_" + id + "_O_" + event.element().identify();
        var xml = "<EWS>" +
						"<SERVICE>" + this.nodeClickedService + "</SERVICE>" +
						"<OBJECT TYPE='E'>" + id + "</OBJECT>" +
						"<DEL></DEL>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
						"</PARAM>" +
				   "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'showSessionActions', ajaxID: aux }));
    },
    /**     
    *@param args {JSON} node contextual actions
    *@param ajaxId {String} node id and type
    *@description It fills the Balloon object with a node contextual actions links:
    *when clicking on each link (action) it will retrieve the available actions
    */
    showSessionActions: function(args, ajaxId) {
        var object = ajaxId.split("_")[3];
        if (!Object.isEmpty(args.EWS.o_actions)) {
            var html = new Element('div');
            objectToArray(args.EWS.o_actions.yglui_vie_tty_ac).each(function(action) {
                var text = action['@actiot'];
                var name = action['@actio'];
                var nodeId = ajaxId.split("_")[1];
                var app = action['@tarap'];
                var okCode = action['@okcode'];
                var view = action['@views'];
                var nodeType;
                var tarty = action['@tarty'];
                var tartb = action['@tartb'];
                var disma = action['@disma'];
                var begdaTraining = this.hashOfTrainings.get(nodeId).begdaTraining;
                var span = new Element('div', { 'class': 'application_action_link' }).insert(text);
                html.insert(span);
                span.observe('click', document.fire.bind(document, this.applicationId + ":action", $H({
                    name: name,
                    nodeId: nodeId,
                    application: app,
                    okCode: okCode,
                    view: view,
                    nodeType: nodeType,
                    tarty: tarty,
                    tartb: tartb,
                    disma: disma,
                    begdaTraining: begdaTraining
                })));
            } .bind(this));
            balloon.showOptions($H({
                domId: object,
                content: html
            }));
        }
        else {
            balloon.showOptions($H({
                domId: object,
                content: "<div>" + global.getLabel('noActions') + "</div>"
            }));
        }
    },

    /**     
    *@description It executes the code that belongs to the action clicked 
    */
    actionClicked: function(parameters) {
        var name = getArgs(parameters).get('name');
        this.nodeId = getArgs(parameters).get('nodeId');
        var view = getArgs(parameters).get('view');
        var okCode = getArgs(parameters).get('okCode');
        var appId = getArgs(parameters).get('application');
        var disma = getArgs(parameters).get('disma');
        var begdaTraining = getArgs(parameters).get('begdaTraining');
        var displayMode;
        if (disma == 'D') {
            displayMode = 'display'
        } else if (disma == 'M') {
            displayMode = 'edit'
        };
        switch (name) {
            case 'LSODISPLAYC': //view course details
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'TEACH' }));//APPLICATION UNDER CONSTRUCTION
                global.open($H({
                    app: {
                        appId: appId,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: this.nodeId,
                    oType: 'E',
                    parentType: 'E',
                    displayMode: displayMode,
                    begda: begdaTraining
                }));

                balloon.hide();
                break;
            case 'LSOFOLLOWUP': //follow up a firmly booked course
                //document.fire('EWS:openApplication', $H({ app: nextApp, prevApp: 'TEACH', objectId: nodeId }));
                global.open($H({
                    app: {
                        appId: appId,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: this.nodeId,
                    oType: 'E',
                    parentType: 'E',
                    displayMode: displayMode,
                    begda: begdaTraining
                }));
                balloon.hide();
                break;
            case 'LSOFIRMLYBOOK': //firmly book a planned course
                this.firmlyBookCourse();
                balloon.hide();
                break;
            case 'LSOCANCELC': //cancel a planned course
                this.getCancelCourseReasons();
                balloon.hide();
                break;
            case 'LSOMAINTAINC':
                global.open($H({
                    app: {
                        appId: appId,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: this.nodeId,
                    oType: 'E',
                    parentType: 'E',
                    displayMode: displayMode,
                    begda: begdaTraining
                }));
                balloon.hide();
                break;
            default:
                balloon.hide();
                break;
        }
    },

    /**
    * @description Method that retrieves all the cancel reasons
    */
    getCancelCourseReasons: function(event) {
        if (Object.isEmpty(this.jsonReasons)) {
            var xmlReasons = "<EWS><SERVICE>" + this.cancelReasonsService + "</SERVICE></EWS>";
            this.makeAJAXrequest($H({ xml: xmlReasons, successMethod: 'cancelCourse' }));
        } else {
            this.cancelCourse(this.jsonReasons);
        }
    },
    /**
    * @description Method that cancel a course after the user confirmation
    */
    cancelCourse: function(json) {
        var cancelcourseHtml = "<div>"
                               + global.getLabel('cancellationReason')
                               + "<div><div id='cancelcourseAutocompleter' style='margin-top:10px;margin-bottom:10px;'></div></div>"
                               + global.getLabel('cancelCourseConf')
                               + "</div>";
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(cancelcourseHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function() {
            if (_this)
                _this.cancelCourseRequest();
            cancelcoursePopUp.close();
            delete cancelcoursePopUp;
        };
        var callBack3 = function() {
            cancelcoursePopUp.close();
            delete cancelcoursePopUp;
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

        var cancelcoursePopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    cancelcoursePopUp.close();
                    delete cancelcoursePopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 600
        });
        cancelcoursePopUp.create();
        // Autocompleter initialization
        if (!Object.isEmpty(json.EWS)) {//first run of cancelcourse, building autocompleter structure
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
        this.reasonsAutocompleter = new JSONAutocompleter('cancelcourseAutocompleter', {
            showEverythingOnButtonClick: true,
            timeout: 8000,
            templateOptionsList: '#{text}',
            events: $H({ onResultSelected: 'EWS:cancelCourseReasonAutocompleter_resultSelected_teacher' })
        }, this.jsonReasons);

    },
    /**
    * @description Fired when it has been chosen a value in the reasons autocompleter, enables/disables the 'yes' button
    */
    cancelCourseConfBoxButton: function(args) {
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
    cancelCourseRequest: function() {
        var xml = "<EWS>"
                 + "<SERVICE>" + this.cancelCourseService + "</SERVICE>"
                 + "<OBJECT TYPE=\"E\">" + this.nodeId + "</OBJECT>"
                 + "<O_REASON>" + this.reasonChosen + "</O_REASON>"
                 + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'cancelCourseAnswer' }));
    },
    /**
    * @description Receives the answer from SAP about the cancel course request.
    */
    cancelCourseAnswer: function(answer) {
        if (answer.EWS.o_status) {
            if (answer.EWS.o_status == "X")
                this.makeAJAXrequest($H({ xml: this.xmlGetTrainingsToGive, successMethod: 'processResponse', ajaxID: 'toGive' }));

        }
    },
    /**
    * @description Method that firmly books a course after the user confirmation
    */
    firmlyBookCourse: function() {
        var firmlybookCourseHtml = "<div>"
                               + "<span>" + global.getLabel('sessionActivated') + "</span><br>"
                               + "<div class=''>"
                                   + "<span>-&nbsp;" + global.getLabel('noChangesSession') + "</span><br>"
                                   + "<span>-&nbsp;" + global.getLabel('bookingsStillDone') + "</span><br>"
                               + "</div>"
                               + "<span>" + global.getLabel('firmlyBookConf') + "</span>"
                               + "</div>";
        var _this = this;
        //        var firmlybookCourseConfirmationBox = new ConfirmationBox({
        //            htmlContent: firmlybookCourseHtml,
        //            buttons: $H({
        //                'textContent': $H({ 'button0': global.getLabel('no'),
        //                    'button1': global.getLabel('yes')
        //                }),
        //                'callBacks': $H({ 'button0': function() {
        //                    firmlybookCourseConfirmationBox.close();
        //                    delete firmlybookCourseConfirmationBox;
        //                },
        //                    'button1': function() {
        //                        if (_this)
        //                            _this.firmlybookCourseRequest();
        //                        firmlybookCourseConfirmationBox.close();
        //                        delete firmlybookCourseConfirmationBox;
        //                    }
        //                })
        //            })
        //        });
        //        firmlybookCourseConfirmationBox.create();

        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(firmlybookCourseHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function() {
                        if (_this)
                            _this.firmlybookCourseRequest();
                        firmlybookCourseConfirmationBox.close();
                        delete firmlybookCourseConfirmationBox;
        };
        var callBack3 = function() {
            firmlybookCourseConfirmationBox.close();
            delete firmlybookCourseConfirmationBox;
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
        //insert buttons in div
        contentHTML.insert(buttons);

        var firmlybookCourseConfirmationBox = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    firmlybookCourseConfirmationBox.close();
                    delete firmlybookCourseConfirmationBox;
                    }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 600
        });
        firmlybookCourseConfirmationBox.create();
    },
    /**
    * @description Builds the xml and send it to SAP for the firmly book request
    */
    firmlybookCourseRequest: function() {
        var xml = "<EWS>"
                 + "<SERVICE>" + this.firmlyBookCourseService + "</SERVICE>"
                 + "<OBJECT TYPE=\"E\">" + this.nodeId + "</OBJECT>"
                 + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'firmlybookCourseAnswer' }));
    },
    /**
    * @description Receives the answer from SAP about the firmly book request.
    */
    firmlybookCourseAnswer: function(answer) {
        if (answer.EWS.o_status) {
            if (answer.EWS.o_status == "X")
                this.makeAJAXrequest($H({ xml: this.xmlGetTrainingsToGive, successMethod: 'processResponse', ajaxID: 'toGive' }));
        }
    },

    close: function($super) {
        $super();
        document.stopObserving('EWS:teacher_DataChangeFrom', this.refresh.bindAsEventListener(this));
        document.stopObserving('EWS:teacher_DataChangeTo', this.refresh.bindAsEventListener(this));
        document.stopObserving(this.applicationId + ':action', this.actionClickedBinding);

    }

});