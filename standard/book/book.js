/** 
 * @fileOverview book.js 
 * @description The application implemented with the book class allows the user to:
 * a) go to another application to prebook a training
 * b) book a session of a training
 * c) cancel a prebook
 * d) cancel a book
 * e) view details of a training
*/
/**
 *@constructor
 *@description BOOK.
 *@augments Application 
*/
var BOOK = Class.create(Application,
/** 
*@lends OM_Maintain
*/
{
/*** SERVICES ***/
/** 
* Service used to create a booking.
* @type String
*/
createBook: "CREATE_BOOKING",
/** 
* Service used to get the labels.
* @type String
*/
getSessionsService: "GET_SES_DET",
/** 
* Service used to delete a prebooked training.
* @type String
*/
cancelPreBookingService: "CANCEL_PREBOOKING",
/** 
* Service used to delete a booked training.
* @type String
*/
cancelBookingService: "CANCEL_BOOKING",
/*** XMLs IN & OUT***/
/**
* Xml to call to the CREATE_BOOKING service
* @type XmlDoc
*/
xmlCreateBook: XmlDoc.create(),
/**
* Property to call the service with sessions
* @type XmlDoc
*/
xmlGetSessions: XmlDoc.create(),
/**
* Property to call the service to delete the prebooking
* @type XmlDoc
*/
xmlCancelPrebooking: XmlDoc.create(),
/**
* Property to hold the xml to delete the booking
* @type XmlDoc
*/
xmlCancelBooking: XmlDoc.create(),
/*** VARIABLES ***/
/** 
* Parameter of the service, indicating if is a delete action
* @type String
*/
isDelete: "",
/** 
* Parameter of the service, indicating if all sessions are going to be retrieved
* @type String
*/
getAllSessions: "",
/** 
* Parameter of the service, indicating the otype of the training
* @type String
*/
otype: "",
/** 
* Parameter of the service, indicating the training/session Id
* @type String
*/
trainingId: "",
/** 
* Parameter of the service, indicating the employee Id
* @type String
*/
employeeId: "",
/** 
* Parameter of the openApplication event, indication the app where we come from
* @type String
*/
previousApp: "",
/** 
* Indicates if the tablekit table has been shown once.
* @type Boolean
*/
tableshowed: false,
/** 
* Hash containing the trainings retrieved from the xml
* @type Hash
*/
hashOfTrainings: new Hash(),
/** 
* Indicates if schedules have been shown once.
* @type String
*/
scheduleShowed: "",
/** 
* Array containing employees Ids
* @type Array
*/
employeesIds: [],
/** 
* Indicates if the book screen has been loaded for the first time
* @type Boolean
*/
firstBook: true,
/** 
* Indicates if we sholud check the employee selection
* @type Boolean
*/
checkEmployees: false,
/** 
* Indicates if the employe is a manager or not
* @type string
*/
isManager: "",
/** 
* Indicates if the delete prebook screen has been loaded for the first time
* @type Boolean
*/
firstDeletePre: true,
/** 
* Indicates if the delete screen has been loaded for the first time
* @type Boolean
*/
firstDeleteBook: true,
/** 
* Indicates if the view details screen has been loaded for the first time
* @type Boolean
*/
firstViewDetails: true,
/** 
* Hash containing information retrieved from the xml
* @type Hash
*/
hash: new Hash(),
/** 
* Hash containing information about users and their booking status
* @type Hash
*/
hashOfBooks: new Hash(),
/** 
* Id of the div we want to expand
* @type String
*/
divId: "",
/** 
* Number of calls we have to make (numer of employees selected)
* @type Integer
*/
callToSap: 0,
/** 
* Array containing the Ids of the schedules
* @type Array
*/
schedulesIds: [],
/** 
* Indicates if we just want to see the training info
* @type String
*/
onlyTrainingInfo: '',

/**
*@param $super: the superclass: Application
*@description instantiates the app
*/
initialize: function($super, args) {
    $super(args);
    this._checkSelectedEmployeesBinding = this._checkSelectedEmployees.bindAsEventListener(this);
},
/**
*@param $super The superclass: Application
*@param args Arguments sent from other application
*@description when the user clicks on the app tag, load the html structure and sets the event observers
* which have changed.
*/
run: function($super, args) {
    $super();
    //event observers
    //document.observe('EWS:autocompleterResultSelected_book_application_entryData', this._checkSelectedEmployees.bindAsEventListener(this));
    document.observe('EWS:Book_removeBox', this._checkSelectedEmployees.bindAsEventListener(this));
    document.observe('EWS:Book_boxAdded', this._checkSelectedEmployees.bindAsEventListener(this));
    this.hashOfButtons = $H();
    if (this.firstRun) {
        this.virtualHtml.insert("<div id='application_LMS_parent'></div>");
    }
    //get arguments sent from previous app
    //this.pernr = global.getLoggedUser().id;
    this.getAllSessions = args.get('allSessions');
    this.employeeId = args.get('employee');
    this.isDelete = args.get('isDelete');
    this.otype = args.get('oType');
    this.trainingId = args.get('training');
    if (!Object.isEmpty(args.get('prevApp')))
        this.previousApp = args.get('prevApp');
    else this.previousApp = "";
    this.onlyTrainingInfo = (this.getAllSessions == 'X' && this.employeeId == '') ? 'X' : '';
    //create the xml, and call to SAP
    this.xmlGetSessions = '<EWS>'
                + "<SERVICE>" + this.getSessionsService + "</SERVICE>"
                + "<OBJECT TYPE='" + this.otype + "'>" + this.trainingId + "</OBJECT>"
                + "<PARAM>"
                    + "<O_PERNR>" + global.objectId + "</O_PERNR>"
                    + "<I_APPID>" + this.options.appId + "</I_APPID>"
                + "</PARAM>"
                + '</EWS>';
    this.makeAJAXrequest($H({ xml: this.xmlGetSessions, successMethod: 'processSessions' }));
},
/**
* Method called when the labels Xml is received.
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
                label: arrayOfButtons[r]['@label_tag']
            });
        }
    }
    //TRAINING DATA
    var trainingDesc = req.EWS.o_training_desc.yglui_tab_training_desc;
    var trainingName = trainingDesc['@name'];
    var trainingId = trainingDesc['@objid'];
    var employeeId = req.EWS.o_pernr;
    var employeeName = req.EWS.o_ename;
    var currentUserId = global.objectId;
    var currentUserName = global.userName;
    //var isManager = getText(selectSingleNodeCrossBrowser(this.xmlSessions, "/OpenHR/training/isManager"));
    var description1 = trainingDesc['@descr1'];
    var description2 = trainingDesc['@descr2'];
    var description3 = trainingDesc['@descr3'];
    var description4 = trainingDesc['@descr4'];
    var internalPriceCurr = trainingDesc['@iwaer'];
    var internalPrice = trainingDesc['@ikost'];
    var externalPriceCurr = trainingDesc['@ewaer'];
    var externalPrice = trainingDesc['@ekost'];
    var durationDays = trainingDesc['@dur_d'];
    var durationHours = trainingDesc['@dur_h'];
    if (!Object.isEmpty(req.EWS.o_organizers))
        var organizer = req.EWS.o_organizers.lso_objectmail_c['@stext'];
    else
        var organizer = null;
    if (!Object.isEmpty(req.EWS.o_required))
        var prerequisite = req.EWS.o_required.lso_qualiprof_c['@quatx'];
    else
        var prerequisite = null;
    if (!Object.isEmpty(req.EWS.o_target))
        var target_qualification = req.EWS.o_target.lso_qualiprof_c['@quatx'];
    else
        var target_qualification = null;
    var domainName = trainingDesc['@domain'];
    //create a hash to contain the info about the trainings
    this.hashOfTrainings.set(trainingId, {
        trainingName: trainingName,
        trainingId: trainingId,
        employeeId: employeeId,
        employeeName: employeeName,
        currentUserId: currentUserId,
        currentUserName: currentUserName,
        description1: description1,
        description2: description2,
        description3: description3,
        description4: description4,
        internalPriceCurr: internalPriceCurr,
        internalPrice: internalPrice,
        externalPriceCurr: externalPriceCurr,
        externalPrice: externalPrice,
        durationDays: durationDays,
        durationHours: durationHours,
        organizer: organizer,
        prerequisite: prerequisite,
        target_qualification: target_qualification,
        domainName: domainName,
        hashOfSessions: new Hash()
    })
    //SESSIONS DATA
    if (!Object.isEmpty(req.EWS.o_trainings)) {
        var sessions = objectToArray(req.EWS.o_trainings.yglui_tab_training);
        var length = sessions.length;
        for (var i = 0; i < length; i++) {
            var sessionsIdXML = sessions[i]['@objid'] + '_' + req.EWS.o_pernr;
            var sessionsNameXML = sessions[i]['@name'];
            var employeeIdXML = req.EWS.o_pernr;
            var employeeNameXML = req.EWS.o_ename;
            var courseTypeXML = sessions[i]['@course_type'];
            var locationXML = sessions[i]['@location'];
            var languageXML = sessions[i]['@langu'];
            var langu_text = sessions[i]['@langu_text'];
            var startDateXML = sessions[i]['@begda'];
            var endDateXML = sessions[i]['@endda'];
            if (!Object.isEmpty(sessions[i]['@iwaer']))
                var int_curXML = sessions[i]['@iwaer'];
            else
                var int_curXML = '';
            var internalPXML = sessions[i]['@ikost'];
            if (!Object.isEmpty(sessions[i]['@ewaer']))
                var ext_curXML = sessions[i]['@ewaer'];
            else
                var ext_curXML = '';
            var externalPXML = sessions[i]['@ekost'];
            var allowedXML = sessions[i]['@fcont'];
            if (!Object.isEmpty(sessions[i]['@bcont']))
                var reservedXML = sessions[i]['@bcont'];
            else
                var reservedXML = 0;
            if (!Object.isEmpty(sessions[i]['@ocont']))
                var optimumXML = sessions[i]['@ocont'];
            else
                var optimumXML = 0;
            var waitingListXML = sessions[i]['@wcont'];
            var priorityCodeXML = sessions[i]['@priox'];
            var priorityTextXML = sessions[i]['@prioz_cod'];
            var hashOfSchedules = new Hash();
            if (req && req.EWS && req.EWS.o_schedule && req.EWS.o_schedule.yglui_tab_schedule) {
                var scheduleXML = objectToArray(req.EWS.o_schedule.yglui_tab_schedule);
                var scheduleLength = scheduleXML.length;
            } else
                var schedulelength = 0;
            var j = 0;
            for (var c = 0; c < scheduleLength; c++) {
                var scheduleId = scheduleXML[c]['@objid'];
                if (scheduleId == sessions[i]['@objid']) {
                    var dayTypeSchedule = scheduleXML[c]['@daytxt'];
                    var dayDataSchedule = scheduleXML[c]['@evdat'];
                    var startTimeSchedule = scheduleXML[c]['@beguz'];
                    var endTimeSchedule = scheduleXML[c]['@enduz'];
                    //create a subHash to put it into the parent Hash
                    hashOfSchedules.set(j, {
                        dayTypeSchedule: dayTypeSchedule,
                        dayDataSchedule: dayDataSchedule,
                        startTimeSchedule: startTimeSchedule,
                        endTimeSchedule: endTimeSchedule
                    })
                    j++;
                }
            }
            //create a hash to contain the info about the sessions
            this.hashOfTrainings.get(trainingId).hashOfSessions.set(sessionsIdXML, {
                sessionsIdXML: sessionsIdXML,
                sessionsNameXML: sessionsNameXML,
                employeeIdXML: employeeIdXML,
                employeeNameXML: employeeNameXML,
                courseTypeXML: courseTypeXML,
                locationXML: locationXML,
                languageXML: languageXML,
                langu_textXML: langu_text,
                startDateXML: startDateXML,
                endDateXML: endDateXML,
                int_curXML: int_curXML,
                internalPXML: internalPXML,
                ext_curXML: ext_curXML,
                externalPXML: externalPXML,
                allowedXML: allowedXML,
                reservedXML: reservedXML,
                optimumXML: optimumXML,
                waitingListXML: waitingListXML,
                priorityCodeXML: priorityCodeXML,
                priorityTextXML: priorityTextXML,
                hashOfSchedules: hashOfSchedules
            })
        }
    }
    // apply the correct transformation
    this.hash = this.hashOfTrainings.get(trainingId);
    //call to the method that decides where we have to go next
    this._processType();

},
/**
*@description This method decides where we have to go next, depending on the parameters received in initialize
*/
_processType: function() {

    if (this.otype == "D") {
        //Book
        this.updateTitle(global.getLabel('titleBook') + "&nbsp;" + this.hash.trainingName, 'application_main_title getContentDisplayerTitle');
        this._book();
    }
    else {
        //View details
        this.updateTitle(global.getLabel('viewTitle') + "&nbsp;" + this.hash.trainingName, 'application_main_title getContentDisplayerTitle');
        this._viewDetails();
    }
},
/**
*@description Creates the "view details" screen. This screen shows (display only) training/session information
*/
_viewDetails: function() {
    this.firstViewDetails = false;
    var sessionId = this.hash.hashOfSessions.keys()[0];
    var html = "<div id='book_application_parent'>"
                        + "<div id='book_application_title' class='book_application_title'>"
                            + "<div id='book_application_specificDetails'>"
                            + "<div id='book_application_for' class='book_application_label_text'>" + this.labels.get('forBig') + "</div>"
                            + "<div id='book_application_name'class='book_application_main_text'>" + this.hash.employeeName + "</div>"
                            + "<div id='book_application_status' class='book_application_label_text'>" + this.labels.get('status') + "</div>"
                            + "<div id='book_application_priox'class='book_application_main_text'>" + this.hash.hashOfSessions.get(sessionId).priorityTextXML + "</div>"
                            + "<div id='book_application_sessions' class='book_application_label_title'>" + this.labels.get('sessions') + "</div>"
                            + "<div id='book_application_space'class='book_application_main_text'>&nbsp;</div>"
                            + "<div id='book_application_course' class='book_application_label2'>" + this.labels.get('courseType') + ":</div>"
                            + "<div id='book_application_courseName'class='book_application_main_viewDetails'>" + this.hash.hashOfSessions.get(sessionId).courseTypeXML + "</div>"
                            + "<div id='book_application_location' class='book_application_label2'>" + this.labels.get('location') + ":</div>"
                            + "<div id='book_application_loc' class='book_application_main_viewDetails'>" + this.hash.hashOfSessions.get(sessionId).locationXML + "</div>"
                            + "<div id='book_application_language' class='book_application_label2'>" + this.labels.get('language') + ":</div>"
                            + "<div id='book_application_lang'class='book_application_main_viewDetails'>" + this.hash.hashOfSessions.get(sessionId).languageXML + "</div>"
                            + "<div id='book_application_period' class='book_application_label2'>" + this.labels.get('period') + ":</div>"
                            + "<div id='book_application_period_viewDetails_" + sessionId + "_TD' class='book_application_main_viewDetails'><span id ='book_application_period_viewDetails_" + sessionId + "'class='application_action_link'>" + this.hash.hashOfSessions.get(sessionId).startDateXML + "&nbsp; - &nbsp;" + this.hash.hashOfSessions.get(sessionId).endDateXML + "</span></div>"
                            + "</div>"
                            + "<div id='book_application_desc' class='book_application_label_title'>" + this.labels.get('training_description') + "</div>"
                            + "<div id='book_application_space2'class='book_application_main_viewDetails'>&nbsp;</div>"
                            + "<div id ='book_application_rowBook1'>"
                                + "<div id='book_application_subBookDo' class='book_application_label2'>" + this.labels.get('domainName') + "</div>"
                                + "<div id='book_application_domainBook' class='book_application_main_text2'>" + this.hash.domainName + "</div>"
                            + "</div>"
                            + "<div id='book_application_rowBook2'>"
                                + "<div id='book_application_contentBook' class='book_application_label2'>" + this.labels.get('duration') + "</div>"
                                + "<div id='book_application_nameCBook' class='book_application_main_text2'>" + this.hash.durationDays + "&nbsp;" + this.labels.get('days') + "&nbsp;" + this.hash.durationHours + "(&nbsp;" + this.labels.get('hours') + "&nbsp;)" + "</div>"
                            + "</div>"
                            + "<div id ='book_application_rowBook3'>"
                                + "<div id='book_application_GeneralDescBook' class='book_application_label2'>" + this.labels.get('genDesc') + "</div>"
                                + "<div id='book_application_GenerelBook' class='book_application_main_text2'>" + this.hash.description1 + "</div>"
                            + "</div>"
                            + "<div id ='book_application_rowBook4'>"
                                + "<div id='book_application_subDoBook2' class='book_application_label2'>" + this.labels.get('busEv') + "</div>"
                                + "<div id='book_application_domainBook2' class='book_application_main_text2'>" + this.hash.description2 + "</div>"
                            + "</div>"
                            + "<div id ='book_application_rowBook5'>"
                                + "<div id='book_application_subDoBook3' class='book_application_label2'>" + this.labels.get('notes') + "</div>"
                                + "<div id='book_application_domainBook3' class='book_application_main_text2'>" + this.hash.description3 + "</div>"
                            + "</div>"
                            + "<div id ='book_application_rowBook6'>"
                                + "<div id='book_application_subDoBook4' class='book_application_label2'>" + this.labels.get('extBus') + "</div>"
                                + "<div id='book_application_domainBook4' class='book_application_main_text2'>" + this.hash.description4 + "</div>"
                            + "</div>"
                            + "<div id ='book_application_rowBook7'>"
                                + "<div id='book_application_subDoBook5' class='book_application_label2'>" + this.labels.get('price2') + "</div>"
                                + "<div id='book_application_domainBook5' class='book_application_main_text2'>" + this.hash.internalPrice + this.hash.internalPriceCurr + "&nbsp;/&nbsp;" + this.hash.externalPrice + this.hash.externalPriceCurr + "</div>"
                            + "</div>"
                        + "</div>"
                   + "</div>";
    this.virtualHtml.down('[id=application_LMS_parent]').update(html);
    this.virtualHtml.down('[id=application_LMS_parent]').show();
    if (this.onlyTrainingInfo == 'X') {
        this.virtualHtml.down('[id=book_application_specificDetails]').hide();
    }
    if (this.hash.domainName == '') this.virtualHtml.down('[id=book_application_rowBook1]').hide();
    else this.virtualHtml.down('[id=book_application_rowBook1]').show();
    if (this.hash.durationDays == '' || this.hash.durationDays == '0') this.virtualHtml.down('[id=book_application_rowBook2]').hide();
    else this.virtualHtml.down('[id=book_application_rowBook2]').show();
    if (this.hash.description1 == '') this.virtualHtml.down('[id=book_application_rowBook3]').hide();
    else this.virtualHtml.down('[id=book_application_rowBook3]').show();
    if (this.hash.description2 == '') this.virtualHtml.down('[id=book_application_rowBook4]').hide();
    else this.virtualHtml.down('[id=book_application_rowBook4]').show();
    if (this.hash.description3 == '') this.virtualHtml.down('[id=book_application_rowBook5]').hide();
    else this.virtualHtml.down('[id=book_application_rowBook5]').show();
    if (this.hash.description4 == '') this.virtualHtml.down('[id=book_application_rowBook6]').hide();
    else this.virtualHtml.down('[id=book_application_rowBook6]').show();
    if (this.hash.internalPrice == '' || this.hash.internalPrice == '0.0') this.virtualHtml.down('[id=book_application_rowBook7]').hide();
    else this.virtualHtml.down('[id=book_application_rowBook7]').show();
    var button = "<div id='book_application_button' class='book_application_button'></div>";
    this.virtualHtml.down('[id=book_application_parent]').insert(button);
    var json = {
        elements: []
    };
    var auxExit = {
        label: this.xmlSessions.getElementsByTagName('button')[4].getAttribute('text'),
        idButton: 'exit_button',
        handlerContext: null,
        handler: this._back_history.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxExit);
    var ButtonJobProfile = new megaButtonDisplayer(json);
    this.virtualHtml.down('[id=book_application_button]').insert(ButtonJobProfile.getButtons());
    this.schedulesIds.push("", "", "book_application_period_viewDetails_" + sessionId);
    this.virtualHtml.down('[id=book_application_period_viewDetails_' + sessionId + ']').observe('click', this._showSchedule.bind(this, this.schedulesIds));
},
/**
*@description Creates the "book training" screen. This screen allows the user to book a session in a training
*/
_book: function() {
    this.firstBook = false;
    var html = "<div id='book_application_main'></div>";
    this.virtualHtml.down('[id=application_LMS_parent]').update(html);
    this.virtualHtml.down('[id=application_LMS_parent]').show();
    if (this.previousApp == 'LMS') {
        //update title
        this.updateTitle(global.getLabel('book') + "&nbsp;" + this.hash.trainingName, 'application_main_title2');
        var html = "<div id='book_application_for' class='book_application_label_for2 fieldClearBoth fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text'>" + global.getLabel('forBig') + "</div>"
                   + "<div id='book_application_forText' class='fieldDispFloatLeft'></div>"
                        + "<div id='book_application_mass_entry' class='application_book_radio_button'></div>"
                        + "<div id='book_application_getFromLeft' class='application_book_getLeftMenu'></div>"
                    + "<div id='book_application_sessions' class='book_application_label_title'>" + global.getLabel('sessions') + "</div>"
                    + "<div id='book_application_table' class='book_application_tableCss'></div>"
                    + "<div id='application_book_training_desc_book'>&nbsp;<div id='book_application_contain_details' class='book_application_label_contain'></div></div>"
                    + "<div id='application_book_buttons_book' class='application_book_buttonsBook'></div>";
    }
    else {
        var html = "<div id='book_application_title' class='book_application_title'>"
                    + "<div id='book_application_for' class='book_application_label_for2 fieldClearBoth fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text'>" + global.getLabel('forBig') + "</div>"
                        + "<div id='book_application_forText' class='fieldDispFloatLeft'></div>"
                        + "<div id='book_application_entryData' class='book_application_mass'></div>"
                        + "<div id='book_application_mass_entry' class='application_book_radio_button'></div>"
                        + "<div id='book_application_getFromLeft' class='application_book_getLeftMenu'></div>"
                    + "</div>"
                    + "<div id='book_application_sessions' class='book_application_label_title'>" + global.getLabel('sessions') + "</div>"
                    + "<div id='book_application_table' class='book_application_tableCss'></div>"
                    + "<div id='application_book_training_desc_book'>&nbsp;<div id='book_application_contain_details' class='book_application_label_contain'></div></div>"
                    + "<div id='application_book_buttons_book' class='application_book_buttonsBook'></div>";
    }
    //where to go when cancelling
    var tarap = this.hashOfButtons.get("LSODISPLAYCAT").tarap;
    var tabId = this.hashOfButtons.get("LSODISPLAYCAT").tabId;
    var views = this.hashOfButtons.get("LSODISPLAYCAT").views;
    if (this.previousApp == 'LMS') {
        var handler = global.goToPreviousApp.bind(global);
    } else {
        var handler = global.open.bind(global, $H({
            app: {
                appId: tarap,
                tabId: tabId,
                view: views
            }
        }))
    }
    this.virtualHtml.down('[id=book_application_main]').update(html);
    var json = {
        elements: [],
        defaultButtonClassName: 'application_book_contains_buttons'
    };
    var auxCancel = {
        //event: "EWS:openApplication",
        eventOrHandler: false,
        //data: $H({ app: this.previousApp }),
        label: global.getLabel('cancel'),
        idButton: 'application_book_cancel_button_book',
        type: 'button',
        standardButton: true,
        handlerContext: null,
        handler: handler
    };
    json.elements.push(auxCancel);
    var auxBook = {
        handlerContext: null,
        handler: '',
        label: global.getLabel('book'),
        idButton: 'application_book_button_book',
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxBook);
    var auxPrebook = {
        handlerContext: null,
        handler: '',
        label: this.hashOfButtons.get("LSOPREBOOK").label,
        idButton: 'application_book_pre_button_book',
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxPrebook);
    var auxWaiting = {
        handlerContext: null,
        handler: '',
        label: global.getLabel('waitingList'),
        idButton: 'application_book_button_waiting',
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxWaiting);

    this.ButtonBookButtons = new megaButtonDisplayer(json);
    this.virtualHtml.down('[id=application_book_buttons_book]').insert(this.ButtonBookButtons.getButtons());
    var json2 = {
        elements: []
    };
    //If it's called from Learn. Catalogue to book
    if (this.previousApp != 'LMS') {
        var auxGetLeft = {
            label: global.getLabel('getPeopleFromLeft'),
            handler: this.getPeopleFromLeftMenu.bind(this),
            type: 'link',
            idButton: 'application_book_getLeft',
            className: 'application_action_link application_book_getLeftButton',
            standardButton: true
        };
        json2.elements.push(auxGetLeft);
    }
    this.ButtonBookGetLeft = new megaButtonDisplayer(json2);
    this.virtualHtml.down('[id=book_application_getFromLeft]').insert(this.ButtonBookGetLeft.getButtons());
    //    if (Object.isEmpty(this.populationName)) {
    //        this.virtualHtml.down('[id=book_application_entryData]').hide();
    //        this.virtualHtml.down('[id=book_application_mass_entry]').update(global.name);
    //    }
    //    else {
    this.virtualHtml.down('[id=book_application_mass_entry]').hide();
    this.allEmployees = this.getPopulation();
    var json = { autocompleter: { object: $A()} };
    for (var i = 0; i < this.allEmployees.length; i++) {
        json.autocompleter.object.push({
            data: this.allEmployees[i].objectId,
            text: this.allEmployees[i].name
        });
    }
    //If it's called from Overview to book
    if (this.previousApp == 'LMS') {
        var a = 0;
        for (var i = 0; i < this.allEmployees.length; i++) {
            if (this.allEmployees[i].objectId == this.employeeId) {
                this.virtualHtml.down("div#book_application_for").show();
                var html = "&nbsp;" + this.allEmployees[i].name;
                this.virtualHtml.down('[id=book_application_forText]').insert(html);
                this.empBook = this.allEmployees[i].objectId;
            }
        }
        this.isManager = 'X';
        var employeesIndex = $A();
        for (var i = 0; i < this.allEmployees.length; i++) {
            if (this.allEmployees[i].objectId == this.employeeId)
                employeesIndex.push(i);
        }
    }
    else {
        this.multiSelect = new MultiSelect(this.virtualHtml.down("div#book_application_entryData"), { autocompleter: { showEverythingOnButtonClick: true,
            timeout: 5000,
            templateResult: '#{text}',
            maxShown: 5,
            minChars: 1
        },
            events: $H({ onRemoveBox: 'EWS:Book_removeBox', onResultSelected: 'EWS:Book_boxAdded' })
        }, json);

        this.isManager = 'X';
        var employeesIndex = $A();
        if (this.previousApp == 'PREB') {
            for (var i = 0; i < this.allEmployees.length; i++) {
                for (var j = 0; j < this.employeeId.length; j++) {
                    if (this.allEmployees[i].objectId == this.employeeId[j])
                        employeesIndex.push(i);
                }
            }
        } else {
            for (var i = 0; i < this.allEmployees.length; i++) {
                if (this.allEmployees[i].objectId == this.employeeId)
                    employeesIndex.push(i);
            }
        }
        this.multiSelect.addBoxes(employeesIndex);
    }
    this.ButtonBookButtons.disable('application_book_button_book');
    this.virtualHtml.down('[id=application_book_button_waiting]').hide();
    if (this.previousApp == 'LMS') { this.virtualHtml.down('[id=application_book_pre_button_book]').hide(); }
    var hashSessions = this.hash.hashOfSessions.keys();
    this.languageValueEmpty = true;
    if (hashSessions.length != 0) {
        var idsArray = [];
        var html = "<table id='book_application_tableKit' class='sortable book_application_table'>"
	                        + "<thead>"
		                        + "<tr><th class='table_sortfirstdesc book_application_thLoc' id='ThLocation'>" + global.getLabel('location') + "</th><th id='ThLanguage' class='book_application_thLang'>" + global.getLabel('language') + "</th><th id='period' class='book_application_thPer'>" + global.getLabel('period') + "</th><th id='Thprice' class='book_application_thPric'>" + global.getLabel('price') + "</th><th id='ThReserved' class='book_application_thResr'>" + global.getLabel('reserved') + "</th><th id='ThWaiting' class='book_application_thWait'>" + global.getLabel('waiting') + "</th></tr>"
	                        + "</thead><tbody id='tableKit_body'>";
        for (var i = 0; i < hashSessions.length; i++) {
            var location = Object.isEmpty(this.hash.hashOfSessions.get(hashSessions[i]).locationXML) ? '' : this.hash.hashOfSessions.get(hashSessions[i]).locationXML;
            var language = Object.isEmpty(this.hash.hashOfSessions.get(hashSessions[i]).langu_textXML) ? '' : this.hash.hashOfSessions.get(hashSessions[i]).langu_textXML;
            if (language != '')
                this.languageValueEmpty = true;
            var period = this.hash.hashOfSessions.get(hashSessions[i]).startDateXML + "&nbsp; - &nbsp;" + this.hash.hashOfSessions.get(hashSessions[i]).endDateXML;
            var price = this.hash.hashOfSessions.get(hashSessions[i]).internalPXML + this.hash.hashOfSessions.get(hashSessions[i]).int_curXML + "/" + this.hash.hashOfSessions.get(hashSessions[i]).externalPXML + this.hash.hashOfSessions.get(hashSessions[i]).ext_curXML;
            var reserved = this.hash.hashOfSessions.get(hashSessions[i]).reservedXML + "/" + this.hash.hashOfSessions.get(hashSessions[i]).allowedXML;
            var waiting = this.hash.hashOfSessions.get(hashSessions[i]).waitingListXML;
            var res = parseInt(this.hash.hashOfSessions.get(hashSessions[i]).reservedXML);
            var optimum = this.hash.hashOfSessions.get(hashSessions[i]).optimumXML;
            var allow = parseInt(this.hash.hashOfSessions.get(hashSessions[i]).allowedXML);
            //var bar = (res * 100) / allow;
            if (res < optimum)
                var color = '#55D455'; //green
            else if (res >= optimum && res < allow)
                var color = '#D6AE00'; //yellow
            else if (res == allow)
                var color = '#FF0000'; //red
            var barLenght = (40 / allow) * res;
            if (Object.isEmpty(waiting)) waiting = 0;
            this.divId = 'book_application_period_' + hashSessions[i];
            idsArray.push(this.divId);
            html += "<tr id='Tr1'><td><input id='" + this.divId + "_checkbox' type='checkbox' name='group1'/>" + location + "</td><td class='tdLanguage'>" + language + "</td><td id='" + this.divId + "_TD'><div id='" + this.divId + "'><span class='application_action_link'>" + period + "</span></div></td><td>" + price + "</td><td><div class='application_book_allowed'><div id='application_book_bar" + i + "' class='application_book_reserved' style='width:" + barLenght + "px; background-color:" + color + "'></div></div>" + reserved + "</td><td>" + waiting + "</td></tr>";
        }

        html += "</tbody></table>";

        if (this.tableShowed == false) {
            this.virtualHtml.down('[id=book_application_table]').update(html);
            TableKit.Sortable.init("book_application_tableKit");
            this.tableShowed = true;
            this.virtualHtml.down('[id=book_application_table]').show();
        }
        else {
            this.virtualHtml.down('[id=book_application_table]').update(html);
            TableKit.reloadTable("book_application_tableKit");
            this.virtualHtml.down('[id=book_application_table]').show();
        }
        if (!this.languageValueEmpty) {
            var tdInLanguageColumn = this.virtualHtml.select('td.tdLanguage');
            tdInLanguageColumn.invoke('remove');
            this.virtualHtml.down('[id=ThLanguage]').remove();
        }
        this._checkSelectedEmployees();
        for (var j = 0; j < idsArray.length; j++) {
            this.schedulesIds.push(idsArray[j], "", "");
            this.virtualHtml.down('[id=' + idsArray[j] + ']').observe('click', this._showSchedule.bind(this, j));
            this.virtualHtml.down('[id=' + idsArray[j] + '_checkbox' + ']').observe('click', this.book_checkbox.bind(this, idsArray, j));
        }
    }

    else {
        var html = "<table id='book_application_tableKit' class='sortable book_application_table'>"
                            + "<thead>"
	                            + "<tr><th class='table_sortfirstdesc book_application_thLoc' id='ThLocation'>" + global.getLabel('location') + "</th><th id='ThLanguage' class='book_application_thLang'>" + global.getLabel('language') + "</th><th id='period' class='book_application_thPer'>" + global.getLabel('period') + "</th><th id='Thprice' class='book_application_thPric'>" + global.getLabel('price') + "</th><th id='ThReserved' class='book_application_thResr'>" + global.getLabel('reserved') + "</th><th id='ThWaiting' class='book_application_thWait'>" + global.getLabel('waiting') + "</th></tr>"
                            + "</thead>"
                            + "<tbody>"
                                + "<tr id='Tr1'><td>&nbsp;</td><td>&nbsp;</td><td>" + global.getLabel('noValSess') + "</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>"
                            + "</tbody>"
                       + "</table>";
        this.virtualHtml.down('[id=book_application_table]').update(html);
        TableKit.reloadTable("book_application_tableKit");
        this.tableShowed = true;
        this.virtualHtml.down('[id=book_application_table]').show();
        this._checkSelectedEmployees();
    }
    var html = "<div id='contain'>"
                    + "<div id ='book_application_row1'>"
                        + "<div id='book_application_subDo' class='book_application_label_for2 fieldClearBoth fieldCaption fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text'>" + global.getLabel('domainName') + "</div>"
                        + "<div id='book_application_domain'>" + this.hash.domainName + "</div>"
                    + "</div>"
                    + "<div id='book_application_row2'>"
                        + "<div id='book_application_content' class='book_application_label_for2 fieldClearBoth fieldCaption fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text'>" + global.getLabel('duration') + "</div>"
                        + "<div id='book_application_nameC'>" + this.hash.durationDays + "&nbsp;" + global.getLabel('days') + "&nbsp;" + this.hash.durationHours + "(&nbsp;" + global.getLabel('hours') + "&nbsp;)" + "</div>"
                    + "</div>"
                    + "<div id ='book_application_row3'>"
                        + "<div id='book_application_GeneralDesc' class='book_application_label_for2 fieldClearBoth fieldCaption fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text'>" + this.labels.get('genDesc') + "</div>"
                        + "<div id='book_application_Generel'>" + this.hash.description1 + "</div>"
                    + "</div>"
                    + "<div id ='book_application_row4'>"
                        + "<div id='book_application_content' class='book_application_label_for2 fieldClearBoth fieldCaption fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text'>" + this.labels.get('busEv') + "</div>"
                        + "<div id='book_application_domain'>" + this.hash.description2 + "</div>"
                    + "</div>"
                    + "<div id ='book_application_row5'>"
                        + "<div id='book_application_note' class='book_application_label_for2 fieldClearBoth fieldCaption fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text'>" + this.labels.get('notes') + "</div>"
                        + "<div id='book_application_domain'>" + this.hash.description3 + "</div>"
                    + "</div>"
                    + "<div id ='book_application_row6'>"
                        + "<div id='book_application_extended' class='book_application_label_for2 fieldClearBoth fieldCaption fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text'>" + this.labels.get('extBus') + "</div>"
                        + "<div id='book_application_domain'>" + this.hash.description4 + "</div>"
                    + "</div>"
                    + "<div id ='book_application_row7'>"
                        + "<div id='book_application_price' class='book_application_label_for2 fieldClearBoth fieldCaption fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text'>" + global.getLabel('price') + "</div>"
                        + "<div id='book_application_domain'>" + this.hash.internalPrice + this.hash.internalPriceCurr + "&nbsp;/&nbsp;" + this.hash.externalPrice + this.hash.externalPriceCurr + "</div>"
                    + "</div>"
                + "</div>";
    if (Prototype.Browser.Gecko) {
        html += "<div style='clear:left; font-size:0px; margin:0px; padding:0px;'></div>";
    }

    var detailsWidget = $H({
        title: global.getLabel('trainingDesc'),
        collapseBut: true,
        contentHTML: html,
        onLoadCollapse: false,
        targetDiv: 'book_application_contain_details'
    });
    var myWidget = new unmWidget(detailsWidget);
    if (Object.isEmpty(this.hash.domainName))
        this.virtualHtml.down('div#book_application_row1').hide();
    if (Object.isEmpty(this.hash.durationDays) || this.hash.durationDays == 0)
        this.virtualHtml.down('div#book_application_row2').hide();
    if (Object.isEmpty(this.hash.description1))
        this.virtualHtml.down('div#book_application_row3').hide();
    if (Object.isEmpty(this.hash.description2))
        this.virtualHtml.down('div#book_application_row4').hide();
    if (Object.isEmpty(this.hash.description3))
        this.virtualHtml.down('div#book_application_row5').hide();
    if (Object.isEmpty(this.hash.description4))
        this.virtualHtml.down('div#book_application_row6').hide();
    if (Object.isEmpty(this.hash.internalPrice) || this.hash.internalPrice == 0.0 || this.hash.internalPrice == 0)
        this.virtualHtml.down('div#book_application_row7').hide();
},

getPeopleFromLeftMenu: function() {
    this.leftMenuToMultiSelect(this.multiSelect);
    this._checkSelectedEmployees();
},

/**
*@description Goes back to the previous application
*/
_back_history: function() {
    //document.fire('EWS:openApplication', $H({ app: this.previousApp }));
    global.goToPreviousApp();
},
/**
*@description Creates the "book training" screen. This screen allows the user to book a session in a training
*@param sessionNumber Number of the session to be expanded (in order to see the schedule)
*/
_showSchedule: function(sessionNumber) {
    var id;
    var divId;
    var Css = "";
    if (!Object.isEmpty(this.schedulesIds[sessionNumber * 3])) {
        if (!Object.isEmpty(this.schedulesIds[sessionNumber * 3])) {
            id = this.schedulesIds[sessionNumber * 3].split('book_application_period_').join('');
            divId = this.schedulesIds[sessionNumber * 3];
            Css = 'book_application_content_schedule';
        }
    }
    else if (!Object.isEmpty(this.schedulesIds[1])) {
        id = this.schedulesIds[1].split('application_book_cancelBook_period_').join('');
        divId = this.schedulesIds[1];
        Css = 'book_application_content_schedule';
    }
    else if (!Object.isEmpty(this.schedulesIds[2])) {
        id = this.schedulesIds[2].split('book_application_period_viewDetails_').join('');
        divId = this.schedulesIds[2];
        Css = 'book_application_content_schedule_viewDetails';
    }


    if (!this.virtualHtml.down('[id=' + divId + '_I]')) {
        var newDiv = "<div id='" + divId + "_I'></div>";
        this.virtualHtml.down('[id=' + divId + '_TD]').insert(newDiv);
        var length = this.hash.hashOfSessions.get(id).hashOfSchedules.keys().length;
        var html = "<div id='book_application_schedule' class='" + Css + "'>";

        for (var i = 0; i < length; i++) {
            var day = this.hash.hashOfSessions.get(id).hashOfSchedules.get(i).dayTypeSchedule;
            var date = this.hash.hashOfSessions.get(id).hashOfSchedules.get(i).dayDataSchedule;
            var dateFinal = Date.parseExact(date, "yyyy-MM-dd").toString('dd.MM.yyyy');
            var startHour = this.hash.hashOfSessions.get(id).hashOfSchedules.get(i).startTimeSchedule;
            var endHour = this.hash.hashOfSessions.get(id).hashOfSchedules.get(i).endTimeSchedule;
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
*@description Check which employees are selected in the left menu, and add them to the screen
*/
_checkSelectedEmployees: function() {
    //If it's called from Overview to book
    if (this.previousApp == 'LMS') {
        this.employeesIds.clear();
        var selectedEmployeesLength = 1;
        var selectedEmployeesNames = "";
        if (this.virtualHtml.down('[id=' + this.divId + '_checkbox]').checked) {
            this.ButtonBookButtons.enable('application_book_button_book')
        } else {
            this.ButtonBookButtons.disable('application_book_button_book')
        }
        this.ButtonBookButtons.updateHandler('application_book_button_book', this._book_make_book.bind(this, ''));
        for (var i = 0; i < selectedEmployeesLength; i++) {
            this.employeesIds[i] = this.allEmployees[i].objectId;

        }
    }
    else {
        this.employeesIds.clear();
        var selectedEmployeesLength = this.multiSelect.getSelected().length;
        var selectedEmployeesNames = "";
        if (selectedEmployeesLength == 0) {
            var noSelect = global.getLabel("selectEmployeePlease");
            this.virtualHtml.down('[id=book_application_mass_entry]').update(noSelect);
            this.ButtonBookButtons.disable('application_book_pre_button_book');
            this.ButtonBookButtons.disable('application_book_button_book');
        }
        else {
            if (this.virtualHtml.down('[id=' + this.divId + '_checkbox]') && this.virtualHtml.down('[id=' + this.divId + '_checkbox]').checked) {
                this.ButtonBookButtons.enable('application_book_button_book');
                this.ButtonBookButtons.disable('application_book_pre_button_book');
                this.ButtonBookButtons.updateHandler('application_book_button_book', this._book_make_book.bind(this, ''));
            } else {
                this.ButtonBookButtons.enable('application_book_pre_button_book');
                this.ButtonBookButtons.disable('application_book_button_book');
                this.ButtonBookButtons.updateHandler('application_book_pre_button_book', this._book_make_prebook.bind(this, ''));
            }
            for (var i = 0; i < selectedEmployeesLength; i++) {
                this.employeesIds[i] = this.multiSelect.getSelected()[i]._object.data;
            }
        }
    }
},
/**
*@description Controls the checkboxes in the  booking screen
*@param array Array containing the checkboxes Id
*@param pointer Indicates which Id in the array is the one we want
*/
book_checkbox: function(array, pointer) {
    this.divId = array[pointer];
    for (var i = 0; i < array.length; i++) {
        if (array[i] + '_checkbox' != array[pointer] + '_checkbox') {
            this.virtualHtml.down('[id=' + array[i] + '_checkbox]').checked = false;
        }
    }
    if (this.virtualHtml.down('[id=' + array[pointer] + '_checkbox]').checked == false) {
        this.ButtonBookButtons.disable('application_book_button_book');
        if (this.previousApp != 'LMS') {
            var selectedEmployeesLength = this.multiSelect.getSelected().length;
            if (selectedEmployeesLength != 0) {
                this.ButtonBookButtons.enable('application_book_pre_button_book');
            }
        }
    }
    else {
        if (this.previousApp == 'LMS') {
            var selectedEmployeesLength = 1;
        } else {
            //check if "for" has any user
            var selectedEmployeesLength = this.multiSelect.getSelected().length;
        }
        if (selectedEmployeesLength == 0) {
            this.ButtonBookButtons.disable('application_book_pre_button_book');
            this.ButtonBookButtons.disable('application_book_button_book');
        } else {
            this.ButtonBookButtons.disable('application_book_pre_button_book');
            this.ButtonBookButtons.enable('application_book_button_book');
            this.ButtonBookButtons.updateHandler('application_book_button_book', this._book_make_book.bind(this, ''));
            //this.virtualHtml.down('[id=application_book_book_button]').observe('click', this._book_make_book.bind(this));
        }
        var id = array[pointer].split('book_application_period_').join('');
        this.virtualHtml.down('[id=' + array[pointer] + '_checkbox]').value = id;        
    }
},
/**
*@description Goes to the prebook application, so that to be able to prebook a training.
*/
_book_make_prebook: function() {
    var empId = deepCopy(this.employeesIds);
    var trainingId = this.hash.trainingId;
    //prebook/book button info
    var tarap = this.hashOfButtons.get("LSOPREBOOK").tarap;
    var tabId = this.hashOfButtons.get("LSOPREBOOK").tabId;
    var views = this.hashOfButtons.get("LSOPREBOOK").views;
    global.open($H({ app: { appId: tarap, tabId: tabId, view: views }, employee: empId, training: trainingId }));
},
/**
*@description Creates a book of a session in a training
*/
_book_make_book: function() {
    var trainingId = this.hash.trainingId;
    var id = this.virtualHtml.down('[id=' + this.divId + '_checkbox]').value;
    var priox = this.hash.hashOfSessions.get(id).priorityCodeXML;
    var startDate = this.hash.hashOfSessions.get(id).startDateXML;
    var endDate = this.hash.hashOfSessions.get(id).endDateXML;
    var empId = this.employeesIds;
    this.callToSap = 1;
    var sessionId = id.split('_' + global.objectId).join(''); //this.hash.currentUserId
    this.xmlCreateBook = "<EWS>"
                                + "<SERVICE>" + this.createBook + "</SERVICE>"
                                + "<OBJECT TYPE=\"E\">" + sessionId + "</OBJECT>"
                                + "<PARAM>"
                                    + "<O_TABLE_PERNR>";
    for (var i = 0; i < empId.length; i++) {
        if(this.empBook){
            this.xmlCreateBook += "<yglui_tab_pernr pernr=\"" + this.empBook + "\"/>";
        }else{
            this.xmlCreateBook += "<yglui_tab_pernr pernr=\"" + empId[i] + "\"/>";
        }
    }
    this.xmlCreateBook += "</O_TABLE_PERNR>"
                               + "<O_BEGDA>" + startDate + "</O_BEGDA>"
                               + "<O_ENDDA>" + endDate + "</O_ENDDA>"
                            + "</PARAM>"
                        + "</EWS>";

    this.makeAJAXrequest($H({ xml: this.xmlCreateBook,
        successMethod: 'book_processBook'
    }));
},
/**
* @description Creates the html of the cancel prebook screen
*/
cancelPreBook_createHtml: function() {
    this.firstDeletePre = false;
    var html = "<div id='application_book_cancelPre_parent'>"
                                + "<div id='application_book_cancelPre_content'>"
                                    + "<div class='application_book_cancelBook_row' id='application_book_cancelPre_employee'>"
                                        + "<div class='application_book_cancelPre_left_column_name'>"
                                            + "<span class='application_text_bolder'>" + global.getLabel("for") + "</span></div>"
                                        + "<div class='application_book_cancelPre_right_column'>"
                                            + "<span> " + this.hash.employeeName + " </span></div>"
                                    + "</div>"
                                    + "<div class='application_book_cancelBook_desc_left application_text_bolder' >" + global.getLabel('training_description') + "</div>"
                                    + "<div class='application_book_cancelBook_desc_right'>"
                                        + "<div class='application_book_cancelBook_row' id='application_book_cancelPre_subDomain'>"
                                            + "<div class='application_book_cancelPre_left_column'>"
                                                + "<span class='application_text_bolder'>" + global.getLabel("domainName") + "</span></div>"
                                            + "<div class='application_book_cancelPre_right_column'>"
                                                + "<span> " + this.hash.domainName + " </span></div>"
                                        + "</div>"
                                        + "<div class='application_book_cancelBook_row' id='application_book_cancelPre_duration'>"
                                            + "<div class='application_book_cancelPre_left_column'>"
                                                + "<span class='application_text_bolder'>" + global.getLabel("duration") + "</span></div>"
                                            + "<div class='application_book_cancelPre_right_column'>"
                                                + "<span> " + this.hash.durationDays + " " + global.getLabel("days") + " ( " + this.hash.durationHours + " ) " + global.getLabel("hours") + " </span></div>"
                                        + "</div>"
                                        + "<div class='application_book_cancelBook_row' id='application_book_cancelPre_target'>"
                                            + "<div class='application_book_cancelPre_left_column'>"
                                                + "<span class='application_text_bolder'>" + global.getLabel("Target_Qualification") + "</span></div>"
                                            + "<div class='application_book_cancelPre_right_column'>"
                                                + "<span> " + this.hash.target_qualification + " </span></div>"
                                        + "</div>"
                                        + "<div class='application_book_cancelBook_row' id='bapplication_book_cancelPre_price'>"
                                            + "<div class='application_book_cancelPre_left_column'>"
                                                + "<span class='application_text_bolder'>" + global.getLabel("price2") + "</span></div>"
                                            + "<div class='application_book_cancelPre_right_column'>"
                                                + "<span> " + this.hash.internalPrice + "/" + this.hash.externalPrice + " </span></div>"
                                        + "</div>"
                                    + "</div>"
                                + "</div>"
                                + "<div id='application_book_cancelPre_footer'>"
    //+ "<input class='application_book_buttonInput' type='button' id='application_book_cancelPre_requestCancellation'/>"
    //+ "<input class='application_book_buttonInput' type='button' id='application_book_cancelPre_exit_app' onClick='javascript:document.fire(\"EWS:openApplication\", $H({ app: \"" + this.previousApp + "\", refresh:\"X\" }));'/>"
                                    + "<div id='application_book_cancelPre_secondScreen'class='applications_container_div application_over_semiTransparent'>"
                                        + "<div class='application_book_semiTrans'><span id='application_book_cancelPre_question'>" + global.getLabel("cancellation_confirmation") + "</span></div>"
                                        + "<div id='application_book_cancelBookButtons' class='application_book_cancelBook_buttons'>"
    //+ "<input class='application_book_buttonInput application_book_cancelBook_cancelBook_button' type='button' id='application_book_cancelPre_cancelPrebook'/>"
    //+ "<input class='application_book_buttonInput application_book_cancelBook_exit_secondScreen_button' type='button' id='application_book_cancelPre_exit_secondScreen'/>"
                                        + "</div>"
                                    + "</div>"
                                + "</div>"
                           + "</div>";
    this.virtualHtml.down('[id=application_LMS_parent]').update(html);
    var json = {
        elements: [],
        defaultButtonClassName: 'application_book_buttonInput'
    };
    var auxReqCancel = {
        label: getText(selectSingleNodeCrossBrowser(this.xmlSessions, "/OpenHR/buttons/button[@action='request']/@text")),
        handlerContext: null,
        idButton: 'application_book_cancelPre_requestCancellation',
        handler: this.cancelPreBook_showSecondScreen.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxReqCancel);
    var auxExit = {
        label: getText(selectSingleNodeCrossBrowser(this.xmlSessions, "/OpenHR/buttons/button[@action='exit']/@text")),
        idButton: 'application_book_cancelPre_exit_app',
        //event: 'EWS:openApplication',
        type: 'button',
        //data: $H({ app: this.previousApp, refresh: 'X' }),
        standardButton: true,
        eventOrHandler: false,
        handlerContext: null,
        handler: global.goToPreviousApp.bind(global)
    };
    json.elements.push(auxExit);
    this.ButtonCancelPrebook = new megaButtonDisplayer(json);

    var json = {
        elements: [],
        defaultButtonClassName: 'application_book_buttonInput'
    };
    var auxCancelBook = {
        label: this.labels.get("confirmDelButton"),
        handlerContext: null,
        className: 'application_book_cancelBook_cancelBook_button',
        idButton: 'application_book_cancelPre_cancelPrebook',
        handler: this.cancelPreBook_confirmCancel.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxCancelBook);
    var auxExitBook = {
        label: getText(selectSingleNodeCrossBrowser(this.xmlSessions, "/OpenHR/buttons/button[@action='cancel']/@text")),
        handlerContext: null,
        className: 'application_book_cancelBook_exit_secondScreen_button',
        idButton: 'application_book_cancelPre_exit_secondScreen',
        handler: this.cancelPreBook_hideSecondScreen.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxExitBook);
    this.ButtonCancelBook = new megaButtonDisplayer(json);
    this.virtualHtml.down('[id=application_book_cancelPre_footer]').insert(this.ButtonCancelPrebook.getButtons());
    this.virtualHtml.down('[id=application_book_cancelBookButtons]').insert(this.ButtonCancelBook.getButtons());
    this.virtualHtml.down('[id=application_LMS_parent]').show();
    this.virtualHtml.down('[id=application_book_cancelPre_secondScreen]').hide();
    //main screen buttons                                         
    //this.virtualHtml.down('[id=application_book_cancelPre_requestCancellation]').value = getText(selectSingleNodeCrossBrowser(this.xmlSessions, "/OpenHR/buttons/button[@action='request']/@text"));
    //this.virtualHtml.down('[id=application_book_cancelPre_requestCancellation]').observe('click', this.cancelPreBook_showSecondScreen.bind(this));
    //this.virtualHtml.down('[id=application_book_cancelPre_exit_app]').value = getText(selectSingleNodeCrossBrowser(this.xmlSessions, "/OpenHR/buttons/button[@action='exit']/@text"));
    //second screen buttons
    //this.virtualHtml.down('[id=application_book_cancelPre_cancelPrebook]').value = this.labels.get("confirmDelButton");
    //this.virtualHtml.down('[id=application_book_cancelPre_cancelPrebook]').observe('click', this.cancelPreBook_confirmCancel.bind(this));
    //this.virtualHtml.down('[id=application_book_cancelPre_exit_secondScreen]').value = getText(selectSingleNodeCrossBrowser(this.xmlSessions, "/OpenHR/buttons/button[@action='cancel']/@text"));
    // this.virtualHtml.down('[id=application_book_cancelPre_exit_secondScreen]').observe('click', this.cancelPreBook_hideSecondScreen.bind(this));

},
/**
* @description If the user really wants to cancel a prebook, go to the Cancel Prebook application
*/
cancelPreBook_confirmCancel: function() {
    //hide the second screen
    Framework_stb.hideSemitransparent();
    this.virtualHtml.down('[id=application_book_cancelPre_secondScreen]').hide();
    //call SAP to cancel the prebooking
    this.xmlCancelPrebooking = '<OpenHR>'
                    + "<SERVICE>" + this.cancelPreBookingService + "</SERVICE>"
                    + '<ToSAP>'
                    + "<employee id='" + this.employeeId + "'>"
                    + "<prebooking objid='" + this.trainingId + "'/>"
                    + "</employee>"
                    + "<language>" + global.getOption("__language") + "</language>"
                    + '</ToSAP></OpenHR>';
    this.makeAJAXrequest($H({ xml: this.xmlCancelPrebooking, successMethod: 'cancelPreBook_openInProgressApp' }));
},
/**
* @description Goes to the previous application (normally, LMS)
*/
cancelPreBook_openInProgressApp: function(req) {
    //document.fire('EWS:openApplication', $H({ app: this.previousApp, refresh: 'X' }));
    global.goToPreviousApp();
},
/**
* @description Shows cancelPreBook semitransparent pop up   
*/
cancelPreBook_showSecondScreen: function() {
    Framework_stb.showSemitransparent();
    this.virtualHtml.down('[id=application_book_cancelPre_secondScreen]').show();

},
/**
* @description Hides cancelPreBook semitransparent pop up
*/
cancelPreBook_hideSecondScreen: function() {
    Framework_stb.hideSemitransparent();
    this.virtualHtml.down('[id=application_book_cancelPre_secondScreen]').hide();
},

/**
* @description Shows the status of the booking after calling SAP
* @param req Result of the AJAX request
*/
book_processBook: function(req) {
    var status = "<div id='application_book_contain_status'>"
                    + "<h2 id='application_book_status_title' class='application_book_status'>" + global.getLabel('status') + "</h2>";
    var pernrTable = objectToArray(req.EWS.o_table_pernr.yglui_tab_pernr);
    var pernrNames = objectToArray(req.EWS.o_pernr_name.yglui_str_popul_obj);
    if (Object.isEmpty(req.EWS.o_message)) {
        for (var j = 0; j < pernrTable.size(); j++) {
            var pernr = pernrTable[j]['@pernr'];
            var namepernr = pernrNames[j]['@name'];
            status += "<div class='application_book_status_line'><div class='application_icon_green align_application_book_icons'></div><div class='application_book_status_pernr'>"  +namepernr+' ['+ pernr +']'+ "</div><div class='application_book_status_label'>" + global.getLabel('statusOk') + "</div></div>";
        }
    }
    else {
        var message = objectToArray(req.EWS.o_message.yglui_tab_message);
        var namepernr ='';
        for (var j = 0; j < pernrTable.size(); j++) {
            var pernr = pernrTable[j]['@pernr'];
            var warningIcon = false;
            var errorIcon = false;
            for (var i = 0; i < message.size(); i++) {
                var employee = message[i]['@pernr'];
                if (pernr == employee) {
                    for(var x=0;x<pernrNames.size();x++){
                        if (pernrNames[x]['@objid']==employee){
                            namepernr = pernrNames[x]['@name'];
                        }
                    }
                    var type = message[i]['@type'];
                    if (type == 'E' || type == 'W') {
                        var cssClass = type == 'E' ? 'application_icon_red' : 'application_icon_orange';
                        var error = message[i]['@message'];
                        var label = type == 'E' ? global.getLabel('statusError') : global.getLabel('statusOk');
                        if ((type == 'E' && !errorIcon) || (type == 'W' && !warningIcon)) {
                            status += "<div class='application_book_status_line'><div class='" + cssClass + " align_application_book_icons'></div><div class='application_book_status_pernr'>" +namepernr+' ['+ employee+']' + "</div><div class='application_book_status_label'>" + label + "</div><div></div><div class='application_book_status_error_message'>" + error + "</div></div>";
                            warningIcon = true; 
                            errorIcon = true;
                        } else if (warningIcon || errorIcon) {
                            status += "<div class='application_book_status_line'><div class='application_book_status_error_message'>" + error + "</div></div>";
                        }
                    }
                    else if(type == 'S') {
                        status += "<div class='application_book_status_line'><div class='application_icon_green align_application_book_icons'></div><div class='application_book_status_pernr'>"+namepernr+' ['+ employee+']'+ "</div><div class='application_book_status_label'>" + global.getLabel('statusOk') + "</div></div>";
                    }
                }
            }
        }
    }
    status += "</div>";
    var _this = this;
    var contentHTML = new Element('div');
    contentHTML.insert(status);
    //buttons
    var buttonsJson = {
        elements: [],
        mainClass: 'moduleInfoPopUp_stdButton_div_right'
    };
    //where to go when cancelling
    var tarap = this.hashOfButtons.get("LSODISPLAYCAT").tarap;
    var tabId = this.hashOfButtons.get("LSODISPLAYCAT").tabId;
    var views = this.hashOfButtons.get("LSODISPLAYCAT").views;
    if (this.previousApp == 'LMS') {
        var callBack = function() {
            bookStatusPopUp.close();
            delete bookStatusPopUp;
            global.goToPreviousApp();
        };
    } else {
        var callBack = function() {
            bookStatusPopUp.close();
            delete bookStatusPopUp;
            global.open($H({
                app: {
                    appId: tarap,
                    tabId: tabId,
                    view: views
                }
            }))
        };
    }
    var aux2 = {
        idButton: 'goTo',
        label: global.getLabel('ok'),
        handlerContext: null,
        className: 'moduleInfoPopUp_stdButton',
        handler: callBack,
        type: 'button',
        standardButton: true
    };

    buttonsJson.elements.push(aux2);
    var ButtonObj = new megaButtonDisplayer(buttonsJson);
    var buttons = ButtonObj.getButtons();
    //insert buttons in div
    contentHTML.insert(buttons);

    var bookStatusPopUp = new infoPopUp({

        closeButton: $H({
            'textContent': 'Close',
            'callBack': function() {

                bookStatusPopUp.close();
                delete bookStatusPopUp;
            }
        }),
        htmlContent: contentHTML,
        indicatorIcon: 'information',
        width: 600
    });
    bookStatusPopUp.create();
},
/**
* @description Closes the book application 
*/
close: function($super) {
    if (!this.firstBook || !this.firstDeleteBook || !this.firstDeletePre || !this.firstViewDetails) {
        this.updateTitle('');
        this.virtualHtml.down('[id=application_LMS_parent]').hide();
        this.hashOfTrainings = new Hash();
        this.schedulesIds.clear();
        this.employeesIds.clear();
        this.hash = new Hash();
        this.hashOfBooks = new Hash();
        //if (this.virtualHtml.down("[id=book_application_tableKit]"))
        //  TableKit.unloadTable("book_application_tableKit");
    }
    $super();
    //document.stopObserving("EWS:employeeSelected", this._checkSelectedEmployeesBinding);
    //document.stopObserving("EWS:employeeUnselected", this._checkSelectedEmployeesBinding);
}

});