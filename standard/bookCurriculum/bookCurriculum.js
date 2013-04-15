var CUR = Class.create(Application, {

    /*** SERVICES ***/
    createCurriculumBook: "BOOK_CURRI",
    /** 
    * Service used to get the labels.
    * @field labelsService
    * @type String
    */
    getCurriculumsService: "GET_CURRICULMS",
    /** 
    * Service used to delete a booked training.
    * @field cancelBookingService
    * @type String
    */
    cancelBookingService: "CANCEL_BOOKING",
    /** 
    * Service used to retrieve sessions from a curriculum.
    * @type String
    */
    getSessCurriService: "GET_SESS_CURRI",
    /**
    * Service used to retrieve the possible reasons for the booking cancellation
    * @type String
    */
    cancelReasonsService: "GET_CAN_PARTI",
    /**
    * Service used to cancel the curriculum booking
    * @type String
    */
    cancelCurBookService: "CANCELCURBOOK",
    /*** XMLs IN & OUT***/
    xmlCreateBook: XmlDoc.create(),
    /**
    * Property to call the service with labels
    * @field xmlGetLabels
    * @type XmlDoc
    */
    xmlGetCurriculums: XmlDoc.create(),
    /**
    * Property to call the service to delete the booking
    * @field xmlCancelBooking
    * @type XmlDoc
    */
    xmlCancelBooking: XmlDoc.create(),
    /*** VARIABLES ***/
    isDelete: "",
    getAllSessions: "",
    otype: "",
    trainingId: "",
    employeeId: "",
    previousApp: "",
    tableshowed: false,
    hashOfCurriculums: new Hash(),
    scheduleShowed: "",
    employeesIds: [],
    sessionIds: [],
    trainingsArray: [],
    firstBook: true,
    firstDeleteBookCurr: true,
    firstViewDetails: true,
    hash: new Hash(),
    hashOfBooks: new Hash(),
    divId: "",
    callToSap: "",
    previousApp: "",
    tablesCont: 0,
    divHash: new Hash(),
    hashErrors: new Hash(),
    /** 
    * Indicates if the employe is a manager or not
    * @type string
    */
    isManager: "",


    /*
    * @name reasonsAutocompleter
    * @type Object
    * @desc Cancellation reasons autocompleter
    */
    reasonsAutocompleter: null,
    /*
    * @name reasonsAutocompleterValue
    * @type String
    * @desc Cancellation reasons autocompleter's value
    */
    reasonsAutocompleterValue: "",

    initialize: function($super, args) {
        $super(args);
        this._checkSelectedEmployeesBinding = this._checkSelectedEmployees.bindAsEventListener(this);
        this.cancelBookCurr_setCancellationReasonBinding = this.cancelBookCurr_setCancellationReason.bindAsEventListener(this);
    },

    run: function($super, args) {
        $super();
        document.observe('EWS:autocompleterResultSelected_application_bookCurr_entryData', this._checkSelectedEmployees.bindAsEventListener(this));
        document.observe('EWS:BookCurr_removeBox', this._checkSelectedEmployees.bindAsEventListener(this));
        document.observe("EWS:cancelCurriculumReasonAutocompleter_resultSelected", this.cancelBookCurr_setCancellationReasonBinding);
        if (this.firstRun) {
            this.virtualHtml.insert("<div id='application_CURR_parent'></div>");
        }
        //get the employee id
        this.getAllSessions = args.get('allSessions');
        this.employeeId = args.get('employee');
        this.isDelete = args.get('isDelete');
        this.otype = args.get('oType');
        this.trainingId = args.get('training');
        if (!Object.isEmpty(args.get('prevApp')))
            this.previousApp = args.get('prevApp');
        else this.previousApp = "LMS";
        if (this.isDelete != 'X') {
            this.xmlGetCurriculums = "<EWS>"
                                        + "<SERVICE>" + this.getCurriculumsService + "</SERVICE>"
                                        + "<OBJECT TYPE='" + this.otype + "'>" + this.trainingId + "</OBJECT>"
                                     + "</EWS>";
            this.makeAJAXrequest($H({ xml: this.xmlGetCurriculums, successMethod: 'processCurriculums' }));
        } else {
            this.xmlGetCurriculums = "<EWS>"
                                    + "<SERVICE>" + this.getSessCurriService + "</SERVICE>"
                                    + "<OBJECT TYPE=\"" + this.otype + "\">" + this.trainingId + "</OBJECT>"
                                    + "<PARAM>"
                                    + "<O_PERNR>" + this.employeeId + "</O_PERNR>"
                                    + "</PARAM>"
                                    + "</EWS>";
            this.makeAJAXrequest($H({ xml: this.xmlGetCurriculums, successMethod: 'cancelCurriculumBooking' }));
        }

    },
    cancelCurriculumBooking: function(json) {

        if (Object.isEmpty(json.EWS.o_curriculum))
            var curriculumsNumber = 0;
        else if (Object.isEmpty(json.EWS.o_curriculum.yglui_tab_training.length)) {
            var curriculumsNumber = 1;
        } else {
            var curriculumsNumber = json.EWS.o_curriculum.yglui_tab_training.length;
        }
        if (curriculumsNumber == 0) {
            if (json.EWS.o_curriculum.yglui_tab_training) {
                var curriculum = json.EWS.o_curriculum.yglui_tab_training;
                var curriculumName = curriculum['@name'];
                var employeeName = json.EWS.o_ename;
                var status = global.getLabel(curriculum['@priox_cod']);
                var language = curriculum['@langu_text'];
                var location = curriculum['@location'];
                var provider = curriculum['@provider'];
                var curriculumId = curriculum['@objid'];
                var cancelPolicy = json.EWS.o_cancel_policy;
            }
            this.hashOfCurriculums.set(curriculumId, {
                curriculumName: curriculumName,
                employeeName: employeeName,
                status: status,
                language: language,
                location: location,
                provider: provider,
                cancelPolicy: cancelPolicy
            });
            this.updateTitle(global.getLabel('cancelBooking') + "&nbsp;" + this.hashOfCurriculums.get(this.hashOfCurriculums.keys()[0]).curriculumName,'application_main_title getContentDisplayerTitle');
            this.noSessions();
        } else {
            for (var c = 0; c < curriculumsNumber; c++) {
                if (json.EWS.o_curriculum.yglui_tab_training) {
                    var curriculum = objectToArray(json.EWS.o_curriculum.yglui_tab_training);
                    var curriculumName = curriculum[c]['@name'];
                    var employeeName = json.EWS.o_ename;
                    var status = global.getLabel(curriculum[c]['@priox_cod']);
                    var language = curriculum[c]['@langu_text'];
                    var location = curriculum[c]['@location'];
                    var provider = curriculum[c]['@provider'];
                    var curriculumId = curriculum[c]['@objid'];
                    var cancelPolicy = json.EWS.o_cancel_policy;
                }
                this.hashOfCurriculums.set(curriculumId, {
                    curriculumName: curriculumName,
                    employeeName: employeeName,
                    status: status,
                    language: language,
                    location: location,
                    provider: provider,
                    cancelPolicy: cancelPolicy,
                    hashOfTrainings: $H({})
                });
                //TRAININGS DATA
                if(!Object.isEmpty(json.EWS.o_curriculum_elements))
                    var trainings=objectToArray(json.EWS.o_curriculum_elements.yglui_tab_training);
                else
                    var trainings=new Array();

                var length = trainings.length;
                for (var i = 0; i < length; i++) {
                    var trainingsIdXML = trainings[i]['@objid'];
                    var trainingsNameXML = trainings[i]['@name'];
                    var trainingsBegda = trainings[i]['@begda'];
                    var trainingsEndda = trainings[i]['@endda'];
                    var trainingsParent = trainings[i]['@parent'];

                    if (curriculumId == trainingsParent)
                        this.hashOfCurriculums.get(curriculumId).hashOfTrainings.set(trainingsIdXML, {
                            trainingsIdXML: trainingsIdXML,
                            trainingsNameXML: trainingsNameXML,
                            trainingsBegda: trainingsBegda,
                            trainingsEndda: trainingsEndda,
                            hashOfSchedules: $H({})
                        });

                    var scheduleXML = objectToArray(json.EWS.o_schedule.yglui_tab_schedule);
                    for (var k = 0; k < scheduleXML.length; k++) {
                        var scheduleId = scheduleXML[k]['@objid'];
                        var dayTypeSchedule = scheduleXML[k]['@daytxt'];
                        var dayDataSchedule = scheduleXML[k]['@evdat'];
                        var startTimeSchedule = scheduleXML[k]['@beguz'];
                        var endTimeSchedule = scheduleXML[k]['@enduz'];

                        if (trainingsIdXML == scheduleId) {
                            var newIndex = this.hashOfCurriculums.get(curriculumId).hashOfTrainings.get(trainingsIdXML).hashOfSchedules.keys().length;
                            this.hashOfCurriculums.get(curriculumId).hashOfTrainings.get(trainingsIdXML).hashOfSchedules.set(newIndex, {
                                scheduleId: scheduleId,
                                dayTypeSchedule: dayTypeSchedule,
                                dayDataSchedule: dayDataSchedule,
                                startTimeSchedule: startTimeSchedule,
                                endTimeSchedule: endTimeSchedule
                            });
                        }
                    }
                }
            }
            this.hash = this.hashOfCurriculums;
            //Cancel booking
            this.updateTitle(global.getLabel('cancelBooking') + "&nbsp;" + this.hash.get(this.hash.keys()[0]).curriculumName,'application_main_title getContentDisplayerTitle');
            if (Object.isEmpty(this.jsonReasons)) {
                var xmlReasons = "<EWS><SERVICE>" + this.cancelReasonsService + "</SERVICE></EWS>";
                this.makeAJAXrequest($H({ xml: xmlReasons, successMethod: 'cancelBookCurr_createHtml' }));
            } else {
                this.cancelBookCurr_createHtml(this.jsonReasons);
            }
        }
    },
    processCurriculums: function(xml) {
        //TRAINING DATA
        var currDesc = xml.EWS.o_curriculum_desc.yglui_tab_training_desc;
        var curriculumName = currDesc['@name'];
        var curriculumTypeId = currDesc['@objid'];
        var currentUserId = global.objectId;
        var description1 = currDesc['@descr1'];
        var description2 = currDesc['@descr2'];
        var description3 = currDesc['@descr3'];
        var description4 = currDesc['@descr4'];
        var domainName = currDesc['@domain'];
        if (!Object.isEmpty(xml.EWS.o_curriculum))
        var curriculums = objectToArray(xml.EWS.o_curriculum.yglui_tab_training);
        else 
            var curriculums = new Array();
        if (curriculums.length == 0) {
            this.hashOfCurriculums.set(curriculumTypeId, {
                curriculumName: curriculumName,
                curriculumTypeId: curriculumTypeId,
                currentUserId: currentUserId,
                description1: description1,
                description2: description2,
                description3: description3,
                description4: description4,
                domainName: domainName
            });
            this.updateTitle(global.getLabel('titleCurr') + "&nbsp;" + this.hashOfCurriculums.get(this.hashOfCurriculums.keys()[0]).curriculumName,'application_main_title getContentDisplayerTitle');
            this.noSessions();
        }
        else {
            for (c = 0; c < curriculums.length; c++) {
                var currName = curriculums[c]['@name'];
                var curriculumId = curriculums[c]['@objid'];
                var startDate = curriculums[c]['@begda'];
                var endDate = curriculums[c]['@endda'];
                var language = curriculums[c]['@langu_text'];
                var allowed = curriculums[c]['@fcont'];
                var reserved = curriculums[c]['@bcont'];
                var waitingList = curriculums[c]['@wcont'];
                var priority = curriculums[c]['@priox'];
                var priox = curriculums[c]['@priox_cod'];
                var provider = curriculums[c]['@provider'];
                var location = curriculums[c]['@location'];
                if (Object.isEmpty(language)) language = '&nbsp;';
                if (Object.isEmpty(location)) location = '&nbsp;';
                if (Object.isEmpty(provider)) provider = '&nbsp;';
                if (Object.isEmpty(waitingList)) waitingList = '0';

                this.hashOfCurriculums.set(curriculumId, {
                    curriculumName: curriculumName,
                    curriculumTypeId: curriculumTypeId,
                    currentUserId: currentUserId,
                    description1: description1,
                    description2: description2,
                    description3: description3,
                    description4: description4,
                    currName: currName,
                    curriculumId: curriculumId,
                    startDate: startDate,
                    endDate: endDate,
                    language: language,
                    allowed: allowed,
                    reserved: reserved,
                    waitingList: waitingList,
                    priority: priority,
                    priox: priox,
                    provider: provider,
                    location: location,
                    domainName: domainName,
                    hashOfTrainings: $H({})
                });
                //SESSIONS DATA
                if (!Object.isEmpty(xml.EWS.o_curriculum_elements))
                    var trainings = objectToArray(xml.EWS.o_curriculum_elements.yglui_tab_training);
                else 
                    var trainings = new Array();

                var length = trainings.length;
                for (var j = 0; j < length; j++) {
                    var ParentCurIdXML = trainings[j]['@curr_id'];
                    if (ParentCurIdXML == curriculumId) {
                        var trainingsIdXML = trainings[j]['@parent'];
                        if (Object.isEmpty(this.hashOfCurriculums.get(curriculumId).hashOfTrainings.get(trainingsIdXML))) {
                            var trainingsNameXML = trainings[j]['@course_type'];
                            this.hashOfCurriculums.get(curriculumId).hashOfTrainings.set(trainingsIdXML, {
                                trainingsIdXML: trainingsIdXML,
                                trainingsNameXML: trainingsNameXML,

                                hashOfSessions: $H({})
                            });
                        }
                        for (var i = 0; i < length; i++) {
                            var parentCourse = trainings[i]['@parent'];
                            var currId = trainings[i]['@curr_id'];
                            if (parentCourse == trainingsIdXML && currId == curriculumId) {
                                var sessionIdXML = trainings[i]['@objid'];
                                var sessionNameXML = trainings[i]['@name'];
                                var locationXML = trainings[i]['@location'];
                                var languageXML = trainings[i]['@langu_text'];
                                var startDateXML = trainings[i]['@begda'];
                                var endDateXML = trainings[i]['@endda']
                                var int_curXML = trainings[i]['@iwaer']
                                var internalPXML = trainings[i]['@ikost'];
                                var ext_curXML = trainings[i]['@ewaer'];
                                var externalPXML = trainings[i]['@ekost'];
                                var allowedXML = trainings[i]['@fcont'];
                                var reservedXML = trainings[i]['@bcont'];
                                var optimumXML = trainings[i]['@ocont'];
                                var waitingListXML = trainings[i]['@wcont'];
                                var priorityCodeXML = trainings[i]['@priox'];
                                var priorityTextXML = trainings[i]['@priox_cod'];
                                var hashOfSchedules = $H({});
                                var days = objectToArray(xml.EWS.o_schedule.yglui_tab_schedule);
                                var cont = 0;
                                for (var k = 0; k < days.length; k++) {
                                    var scheduleId = days[k]['@objid'];
                                    if (scheduleId == sessionIdXML) {
                                        var dayTypeSchedule = days[k]['@daytxt'];
                                        var dayDataSchedule = days[k]['@evdat'];
                                        var startTimeSchedule = days[k]['@beguz'];
                                        var endTimeSchedule = days[k]['@enduz'];
                                        hashOfSchedules.set(cont, {
                                            dayTypeSchedule: dayTypeSchedule,
                                            dayDataSchedule: dayDataSchedule,
                                            startTimeSchedule: startTimeSchedule,
                                            endTimeSchedule: endTimeSchedule
                                        });
                                        cont++;
                                        this.hashOfCurriculums.get(curriculumId).hashOfTrainings.get(trainingsIdXML).hashOfSessions.set(sessionIdXML, {
                                            sessionIdXML: sessionIdXML,
                                            sessionNameXML: sessionNameXML,
                                            locationXML: locationXML,
                                            languageXML: languageXML,
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
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // apply the correct transformation 

            this.hash = this.hashOfCurriculums;
            this._processType();
        }
    },

    _processType: function() {

        if (this.otype == "EC") {
            if (this.isDelete == 'X') {
                //Cancel booking
                this.updateTitle(global.getLabel('cancelTitle') + "&nbsp;" + this.hash.get(this.hash.keys()[0]).curriculumName,'application_main_title getContentDisplayerTitle');
                this.cancelBookCurr_createHtml();
            }
            else {
                //View details
                this.updateTitle(global.getLabel('viewTitle') + "&nbsp;" + this.hash.get(this.hash.keys()[0]).curriculumName,'application_main_title getContentDisplayerTitle');
                this._viewDetails();
            }
        }

        else {
            //Book
            this.updateTitle(global.getLabel('titleCurr') + "&nbsp;" + this.hash.get(this.hash.keys()[0]).curriculumName,'application_main_title getContentDisplayerTitle');
            this._book();
        }

    },

    _viewDetails: function() {
        this.firstViewDetails = false;
        var trainingsHtml = "<table id='application_bookCurr_cancelBook_trainingsTable'>";
        var trainingsHash = this.hash.get(this.hash.keys()[0]).hashOfTrainings;
        var counter = 0;
        var idsArray = [];
        var type = this.hash.get(this.hash.keys()[0]).cancelType;

        trainingsHash.each(function(training) {
            var sessionId = training.value.hashOfSessions.keys()[0];
            trainingsHtml += "<tr id='application_bookCurr_viewDetails_trainingRow'><div id='application_bookCurr_viewDetails_training_" + training.value.trainingsIdXML + "' >"
            trainingsHtml += "<td><div class='application_bookCurr_cancelBook_trainingName'>";
            trainingsHtml += training.value.trainingsNameXML;
            trainingsHtml += "</div></td>";
            var startDate = Date.parseExact(training.value.hashOfSessions.get(sessionId).startDateCode, 'yyyyMMdd').toString('dd.MM.yyyy');
            var endDate = Date.parseExact(training.value.hashOfSessions.get(sessionId).endDateCode, 'yyyyMMdd').toString('dd.MM.yyyy');
            trainingsHtml += "<td><div class='application_bookCurr_cancelBook_periodDiv' id='application_bookCurr_viewDetails_period_" + sessionId + "_TD'>"
                                        + "<span id='application_bookCurr_viewDetails_period_" + sessionId + "' class='application_action_link'> " + startDate + " - " + endDate + " </span></div>"
                                        + "</div></td>"
            trainingsHtml += "</div></tr>";


        });
        trainingsHtml += '</table>';


        var html = "<div id='application_bookCurr_viewDetails_parent'>" +
        "<div id='application_bookCurr_viewDetails_title' class='application_book_cancelBook_content'>" +
                "<div class='application_book_cancelBook_row'>" +
        	        "<div id='application_bookCurr_viewDetails_for' class='application_book_cancelBook_left_column_name'>" +
        		        global.getLabel('forBig') +
        	        "</div>" +
        	        "<div id='application_bookCurr_viewDetails_name' class='application_book_cancelBook_right_column'>" +
        		        this.hash.get(this.hash.keys()[0]).employeeName +
        	        "</div>" +
        	    "</div>" +
        	    "<div class='application_book_cancelBook_row'>" +
        	        "<div id='application_bookCurr_viewDetails_label' class='application_book_cancelBook_left_column_name'>" +
        		        global.getLabel('status') +
        	        "</div>" +
			        "<div id='application_bookCurr_viewDetails_status' class='application_book_cancelBook_right_column'>" +
        		        this.hash.get(this.hash.keys()[0]).priority +
        	        "</div>" +
        	    "</div>" +
        	    "<div id='application_bookCurr_viewDetails_name2' class='application_book_cancelBook_desc_left application_text_bolder'>" +
        		    this.hash.get(this.hash.keys()[0]).curriculumName +
        	    "</div>" +
        	    "<div class='application_book_cancelBook_desc_right'>" +
			        "<div class='application_book_cancelBook_row'>" +
			            "<div id='application_bookCurr_viewDetails_language_label' class='application_text_bolder application_book_cancelBook_left_column'>" +
				            global.getLabel('language') + ":" +
			            "</div>" +
        	            "<div id='application_bookCurr_viewDetails_language'class='application_book_cancelBook_right_column'>" +
        		            this.hash.get(this.hash.keys()[0]).language +
        	            "</div>" +
			        "</div>" +
			        "<div class='application_book_cancelBook_row'>" +
			            "<div id='application_bookCurr_viewDetails_location_label' class='application_text_bolder application_book_cancelBook_left_column'>" +
				            global.getLabel('location') + ":" +
			            "</div>" +
        	            "<div id='application_bookCurr_viewDetails_location' class='application_book_cancelBook_right_column'>" +
        		            this.hash.get(this.hash.keys()[0]).location +
        	            "</div>" +
			        "</div>" +
			        /*mvv "<div class='application_book_cancelBook_row'>" +
			            "<div id='application_bookCurr_viewDetails_provider_label' class='application_text_bolder application_book_cancelBook_left_column'>" +
				            global.getLabel('provider') +
			            "</div>" +
        	            "<div id='application_bookCurr_viewDetails_provider' class='application_book_cancelBook_right_column'>" +
        		            this.hash.get(this.hash.keys()[0]).provider +
        	            "</div>" +
			        "</div>" +
			        */
			        "<div class='application_book_cancelBook_row'>" +
			            "<div id='application_bookCurr_viewDetails_trainings' class='application_text_bolder'>" +
        		            global.getLabel('trainings') +
				            "<div id='application_bookCurr_viewDetails_trainings_list'>" +
					            trainingsHtml +
				            "</div>" +
        	            "</div>" +
        	        "</div>" +
        	    "</div>" +
			    "<div id='application_bookCurr_viewDetails_description' class='application_book_cancelBook_desc_left application_text_bolder'>" +
        		    global.getLabel('training_description') +
        	    "</div>" +
        	    "<div class='application_book_cancelBook_row'>" +
			        "<div id='application_bookCurr_viewDetails_subdomain_label' class='book_application_label2'>" +
				        global.getLabel('domainName') +
			        "</div>" +
        	        "<div id='application_bookCurr_viewDetails_subdomain'class='book_application_main_text2'>" +
        		        this.hash.get(this.hash.keys()[0]).domainName +
        	        "</div>" +
			    "</div>" +
        	"</div>" +
            "<div id='application_bookCurr_viewDetails_footer' class='application_book_cancelBook_footer_div'>" +
        //"<input class='application_book_buttonInput' type='button' id='application_bookCurr_viewDetails_exit_app' onClick='javascript:document.fire(\"EWS:openApplication\", $H({ app: \"" + this.previousApp + "\", refresh:\"X\"}));'/>" +
                "<div id='application_bookCurr_viewDetails_secondScreen' class='application_book_cancelBook_secondScreen_class'>" +
                    "<span id='application_bookCurr_viewDetails_question'>" + global.getLabel("cancellation_confirmation") + "</span>" +
        //"<input class='application_book_buttonInput application_book_cancelBook_cancelBook_button' type='button' id='application_bookCurr_viewDetails_cancelBook'/>" +
        //"<input class='application_book_buttonInput application_book_cancelBook_exit_secondScreen_button' type='button' id='application_bookCurr_viewDetails_exit_secondScreen'/>" +
                "</div>" +
            "</div>" +
        "</div>";

        this.virtualHtml.down('[id=application_CURR_parent]').update(html);

        var json = {
            elements: []
        };
        var auxExitApp = {
            //event: "EWS:openApplication",
            eventOrHandler: false,
            //data: $H({ app: this.previousApp, refresh: 'X' }),
            label: global.getLabel('cancel'),
            className: 'application_book_buttonInput',
            idButton: 'application_bookCurr_viewDetails_exit_app',
            type: 'button',
            standardButton: true,
            handler: global.goToPreviousApp.bind(global),
            handlerContext: null          
        };
        json.elements.push(auxExitApp);
        var ButtonJobProfile = new megaButtonDisplayer(json);
        var json = {
            elements: [],
            defaultButtonClassName: 'application_book_buttonInput'
        };
        var auxCancelBook = {
            handlerContext: null,
            handler: this.cancelBookCurr_confirmCancel.bind(this),
            label: global.getLabel("confirm"),
            idButton: 'application_bookCurr_viewDetails_cancelBook',
            className: 'application_book_cancelBook_cancelBook_button',
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxCancelBook);
        var auxExitScondScreen = {
            handlerContext: null,
            handler: this.cancelBookCurr_hideSecondScreen.bind(this),
            label: getText(selectSingleNodeCrossBrowser(this.xmlCurriculums, "/OpenHR/buttons/button[@action='cancel']/@text")),
            idButton: 'application_bookCurr_viewDetails_exit_secondScreen',
            className: 'application_book_cancelBook_exit_secondScreen_button',
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxExitScondScreen);
        var ButtonViewDetails_secondScreen = new megaButtonDisplayer(json);
        this.virtualHtml.down('[id=application_bookCurr_viewDetails_footer]').insert(ButtonJobProfile.getButtons());
        this.virtualHtml.down('[id=application_bookCurr_viewDetails_secondScreen]').insert(ButtonViewDetails_secondScreen.getButtons());
        this.virtualHtml.down('[id=application_CURR_parent]').show();
        this.virtualHtml.down('[id=application_bookCurr_viewDetails_secondScreen]').hide();
        //main screen buttons                                         
        //this.virtualHtml.down('[id=application_bookCurr_viewDetails_exit_app]').value = getText(selectSingleNodeCrossBrowser(this.xmlCurriculums, "/OpenHR/buttons/button[@action='exit']/@text"));
        //second screen buttons
        //this.virtualHtml.down('[id=application_bookCurr_viewDetails_cancelBook]').value = global.getLabel("confirm");
        //this.virtualHtml.down('[id=application_bookCurr_viewDetails_cancelBook]').observe('click', this.cancelBookCurr_confirmCancel.bind(this));
        //this.virtualHtml.down('[id=application_bookCurr_viewDetails_exit_secondScreen]').value = getText(selectSingleNodeCrossBrowser(this.xmlCurriculums, "/OpenHR/buttons/button[@action='cancel']/@text"));
        //this.virtualHtml.down('[id=application_bookCurr_viewDetails_exit_secondScreen]').observe('click', this.cancelBookCurr_hideSecondScreen.bind(this));

        //schedules listeners 
        var hashTrainingsKeys = this.hash.get(this.hash.keys()[0]).hashOfTrainings.keys();
        var hashOfTrainings = this.hash.get(this.hash.keys()[0]).hashOfTrainings;
        this.tablesCont = 0;
        this.divHash.set(this.hash.keys()[0], {
            trainingDiv: new Hash()
        });

        for (this.tablesCont = 0; this.tablesCont < hashTrainingsKeys.length; this.tablesCont++) {

            this.divHash.get(this.hash.keys()[0]).trainingDiv.set(hashTrainingsKeys[this.tablesCont], {
                schedulesDiv: new Hash()
            });

            var sessionId = hashOfTrainings.get(hashOfTrainings.keys()[this.tablesCont]).hashOfSessions.keys()[0];
            this.divHash.get(this.hash.keys()[0]).trainingDiv.get(hashTrainingsKeys[this.tablesCont]).schedulesDiv.set(0, {
                arg1: "",
                arg2: "",
                arg3: "application_bookCurr_viewDetails_period_" + sessionId
            });
            this.virtualHtml.down("[id=application_bookCurr_viewDetails_period_" + sessionId + "]").observe('click', this.bookCurr_showSchedule.bind(this, this.hash.keys()[0], hashTrainingsKeys[this.tablesCont], 0));

        }


    },

    noSessions: function() {
        this.firstBook = false;
        var html = "<div id='application_bookCurr_book_main'></div>";
        this.virtualHtml.down('[id=application_CURR_parent]').update(html);
        this.virtualHtml.down('[id=application_CURR_parent]').show();
        var curr = this.hashOfCurriculums.keys()[0];
        var html = "<div id='application_bookCurr_book_title' class='book_application_title'>"
                            + "<div id='book_application_for' class='application_bookCurr_book_label_for'>" + global.getLabel('forBig') + "</div>"
                            + "<div id='application_bookCurr_book_mass_entry' class='application_book_radio_button'></div>"
                            + "<div id='bookCurr_application_getFromLeft' class='application_book_getLeftMenu'></div>"
                        + "</div>"
                        + "<div id='application_bookCurr_book_cur' class='application_bookCurr_book_title'>" + global.getLabel('curriculums') + "</div>";
        this.virtualHtml.down('[id=application_bookCurr_book_main]').update(html);

        html = "<div id='application_bookCurr_book_desc'>"
                            + "<div id='application_bookCurr_book_cur'>"
                                + "<div id='application_bookCurr_book_nameCur' class='application_bookCurr_book_names_noSessions'>" + this.hashOfCurriculums.get(curr).curriculumName + "</div>"
                            + "</div>"
                            + "<div id='application_bookCurr_book_table'></div>";
        this.virtualHtml.down('[id=application_bookCurr_book_main]').insert(html);

        html = "<div id='application_bookCurr_book_training_description'></div>"
                        + "<div id='application_bookCurr_book_buttons_book' class='application_book_contains_buttons_noSessions'>"
                            + "<div id='application_bookCurr_book_cancel_button' class='application_book_buttonPreb'></div>"
                        + "</div>";
        this.virtualHtml.down('[id=application_bookCurr_book_main]').insert(html);
        var json = {
            elements: []
        };
        var auxCancelButtonBook = {
            //event: "EWS:openApplication",
            eventOrHandler: false,
            //data: $H({ app: this.previousApp }),
            label: global.getLabel('cancel'),
            idButton: 'application_bookCurr_book_cancel_button_book',
            type: 'button',
            standardButton: true,            
            handlerContext: null,
            handler: global.goToPreviousApp.bind(global)            
        };
        json.elements.push(auxCancelButtonBook);
        var ButtonBookCancelButton = new megaButtonDisplayer(json);
        this.virtualHtml.down('[id=application_bookCurr_book_cancel_button]').insert(ButtonBookCancelButton.getButtons());
        html = "<table id='book_application_tableKit' class='sortable bookCurr_application_table'>"
                                    + "<thead>"
	                                    + "<tr><th class='table_sortfirstdesc book_application_thLoc' id='ThLocation'>" + global.getLabel('location') + "</th><th id='ThLanguage' class='book_application_thLang'>" + global.getLabel('language') + "</th><th id='period' class='book_application_thPer'>" + global.getLabel('period') + "</th><th id='Thprice' class='book_application_thPric'>" + global.getLabel('price') + "</th><th id='ThReserved' class='book_application_thResr'>" + global.getLabel('reserved') + "</th><th id='ThWaiting' class='book_application_thWait'>" + global.getLabel('waiting') + "</th></tr>"
                                    + "</thead>"
                                    + "<tbody>"
                                        + "<tr id='Tr1'><td>&nbsp;</td><td>&nbsp;</td><td>" + global.getLabel('noSessions') + "</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>"
                                    + "</tbody>"
                               + "</table></div>";
        this.virtualHtml.down('[id=application_bookCurr_book_table]').insert(html);
        TableKit.Sortable.init("book_application_tableKit");
    },

    _book: function() {
        this.firstBook = false;
        var buttonsJson={
            elements: []
        };
        var html = "<div id='application_bookCurr_book_main'></div>";
        this.virtualHtml.down('[id=application_CURR_parent]').update(html);
        this.virtualHtml.down('[id=application_CURR_parent]').show();
        var curLength = this.hash.keys().length;
        var curId = this.hash.keys();
        var html = "<div id='application_bookCurr_book_title' class='book_application_title'>"
                        + "<div id='book_application_for' class='application_bookCurr_book_label_for'>" + global.getLabel('forBig') + "</div>"
                        + "<div id ='application_bookCurr_entryData' class='application_book_curr_margin book_application_mass'></div>"
                        + "<div id='application_bookCurr_book_mass_entry' class='application_book_radio_button'></div>"
                        + "<div id='bookCurr_application_getFromLeft' class='application_book_getLeftMenu'></div>"
                    + "</div>"
                    + "<h2 id='application_bookCurr_book_cur' class='application_bookCurr_book_title'>" + global.getLabel('curr') + "</h2>";
        this.virtualHtml.down('[id=application_bookCurr_book_main]').update(html);
        var buttonHeader;
        var btnNameCur;
        var reserved;
        for (var i = 0; i < curLength; i++) {
            reserved = this.hash.get(curId[i]).reserved;
            if (Object.isEmpty(reserved)) reserved = 0;
            btnNameCur ={
                idButton: 'nameCurId' + curId[i],
                label: this.hash.get(curId[i]).currName,
                className: 'application_action_link',
                type: 'link',
                eventOrHandler: false,
                handlerContext: null,
                handler: this.detailsCur.bind(this, 'application_bboCurr_book_content_' + curId[i], 'application_bookCurr_book_training_title_'+ curId[i])
            };
            buttonsJson.elements.clear();
            buttonsJson.elements.push(btnNameCur);

            buttonHeader=new megaButtonDisplayer(buttonsJson);           
            html = "<div id='application_bookCurr_book_desc_" + curId[i] + "'>"
                        + "<div id='application_bookCurr_book_cur_" + curId[i] + "'>"
                            + "<div id='application_bookCurr_book_checkBox_" + curId[i] + "' class='application_bookCurr_book_icons application_book_curr_marginLink'><input id='application_curriculum_check_" + curId[i] + "' type='checkbox' name='group2'/></div>"                            
                            + "<div id='application_bookCurr_book_nameCur_" + curId[i] + "' class='application_bookCurr_book_names application_book_curr_marginLink'></div>" 
                        + "</div>"
                        + "<div id='application_bboCurr_book_content_" + curId[i] + "'>"
                            + "<div id='application_bookCurr_book_language_" + curId[i] + "' class='fieldClearBoth application_text_bolder application_book_curr_left_column'>" + global.getLabel('language') + "</div>" 
                            + "<div id='application_bookCurr_book_lang_" + curId[i] + "' class='book_application_main_viewDetails'>" + this.hash.get(curId[i]).language + "</div>"
                            + "<div id='application_bookCurr_book_reserved_" + curId[i] + "' class='fieldClearBoth application_text_bolder application_book_curr_left_column'>" + global.getLabel('capacity') + "</div>"
                            + "<div id='application_bookCurr_book_ratingBar_" + curId[i] + "' class='application_bookCurr_book_bar' ></div>"
                            + "<div id='application_bookCurr_book_reserv_" + curId[i] + "' class='application_bookCurr_book_reserved'>" + reserved + "/" + this.hash.get(curId[i]).allowed + "</div>"
                            + "<div id='application_bookCurr_book_waiting_" + curId[i] + "' class='application_bookCurr_book_waiting'>(" + global.getLabel('waiting2') + "&nbsp;" + this.hash.get(curId[i]).waitingList + ")</div>"
                            + "<div id='application_bookCurr_book_location_" + curId[i] + "' class='fieldClearBoth application_text_bolder application_book_curr_left_column'>" + global.getLabel('location') + "</div>"
                            + "<div id='application_bookCurr_book_loc_" + curId[i] + "' class='book_application_main_viewDetails'>" + this.hash.get(curId[i]).location + "</div>"
                            /*mvv + "<div id='application_bookCurr_book_provided_" + curId[i] + "' class='fieldClearBoth application_text_bolder application_book_curr_left_column'>" + global.getLabel('provider') + "</div>"
                            + "<div id='application_bookCurr_book_prov_" + curId[i] + "' class='book_application_main_viewDetails'>" + this.hash.get(curId[i]).provider + "</div>"*/
                            + "<div id='application_bookCurr_book_period_" + curId[i] + "' class='fieldClearBoth application_text_bolder application_book_curr_left_column'>" + global.getLabel('period') + "</div>"
                            + "<div id='application_bookCurr_book_per_" + curId[i] + "' class='book_application_main_viewDetails'>" + this.hash.get(curId[i]).startDate + '&nbsp;-&nbsp;' + this.hash.get(curId[i]).endDate + "</div>"
                        + "</div>"
                         + "<div id='application_bookCurr_book_training_title_" + curId[i] + "'>"
                            + "<div id='application_bookCurr_book_max_" + curId[i] + "' class='application_verticalR_arrow application_bookCurr_book_options'></div>"
                            + "<div id='application_bookCurr_book_min_" + curId[i] + "' class='application_down_arrow application_bookCurr_book_options'></div>"
                            + "<div id='application_bookCurr_book_training_tittle_" + curId[i] + "' class='application_bookCurr_book_label'>" + global.getLabel('trainings') + "</div>"
                            + "<div id='application_bookCurr_book_table_" + curId[i] + "'></div>"
                        + "</div>"
                        
                    + "</div>";
                    
            this.virtualHtml.down('[id=application_bookCurr_book_main]').insert(html);
            this.virtualHtml.down('[id=application_bookCurr_book_nameCur_' + curId[i]+']').insert(buttonHeader.getButtons());            
            var max = parseInt(this.hash.get(curId[i]).allowed);
            var booked = parseInt(reserved);
            this.virtualHtml.down('[id=application_bookCurr_book_ratingBar_' + curId[i] + ']').update(getRating(max, booked, -1)); ;
            this.virtualHtml.down('[id=application_bookCurr_book_max_' + curId[i] + ']').observe('click', this._showTrainings.bind(this, curId[i]));
            this.virtualHtml.down('[id=application_bookCurr_book_min_' + curId[i] + ']').observe('click', this._hideTrainings.bind(this, curId[i]));
            this.virtualHtml.down('[id=application_bookCurr_book_min_' + curId[i] + ']').hide();
            this.virtualHtml.down('[id=application_bboCurr_book_content_' + curId[i]+']').hide();            
            this.virtualHtml.down('[id=application_bookCurr_book_training_title_' + curId[i]+']').hide();
            this.virtualHtml.down('[id=application_curriculum_check_' + curId[i] + ']').observe('click', this._bookCurr_chekAll.bind(this, curId[i]));
        }
        html = "<div id='application_bookCurr_book_training_description' class='application_bookCurr_book_training_desc'></div>"
                    + "<div id='application_bookCurr_book_buttons_book' class='application_book_contains_buttons'>"
        //+ "<div id='application_bookCurr_book_cancel_button' class='application_book_buttonPreb'><input id='application_bookCurr_book_cancel_button_book' type='button' onClick='javascript:document.fire(\"EWS:openApplication\", $H({app:\"CATL\"}))' value=" + global.getLabel('cancel') + " /></div>"
        // + "<div id='application_bookCurr_book_book_button' class='application_book_buttoPreb'><input id='application_bookCurr_book_button_book' class='application_book_buttonInput' type='button' value=" + global.getLabel('book') + " /></div>"
                    + "</div>";
        this.virtualHtml.down('[id=application_bookCurr_book_main]').insert(html);
        var json = {
            elements: [],
            defaultButtonClassName: 'application_book_buttonPreb'
        };
        var auxCancelButtonBook = {
            //event: "EWS:openApplication",
            eventOrHandler: false,
            //data: $H({ app: 'CATL' }),
            label: global.getLabel('cancel'),
            idButton: 'application_bookCurr_book_cancel_button_book',
            type: 'button',
            standardButton: true,
            handlerContext: null,
            handler: global.goToPreviousApp.bind(global)            
        };
        json.elements.push(auxCancelButtonBook);
        var auxBookButtonBook = {
            handlerContext: null,
            handler: '',
            label: global.getLabel('book'),
            idButton: 'application_bookCurr_book_button_book',
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxBookButtonBook);
        this.Buttonbook_buttons_book = new megaButtonDisplayer(json);
        this.virtualHtml.down('[id=application_bookCurr_book_buttons_book]').insert(this.Buttonbook_buttons_book.getButtons());
        var json2 = {
            elements: []
        };
        var auxGetLeft = {
            label: global.getLabel('getPeopleFromLeft'),
            handler: this.getPeopleFromLeftMenu.bind(this),
            type: 'link',
            idButton: 'application_bookCurr_getLeft',
            className: 'application_action_link application_book_curr_getLeftButton',
            standardButton: true
        };
        json2.elements.push(auxGetLeft);
        this.ButtonBookGetLeft = new megaButtonDisplayer(json2);
        this.virtualHtml.down('[id=bookCurr_application_getFromLeft]').insert(this.ButtonBookGetLeft.getButtons());
        this.Buttonbook_buttons_book.disable('application_bookCurr_book_button_book');
        //   if (Object.isEmpty(this.populationName)) {
        //     this.virtualHtml.down('[id=application_bookCurr_entryData]').hide();
        //       this.virtualHtml.down('[id=book_application_mass_entry]').update(global.name);
        //   }
        // else {
        this.virtualHtml.down('[id=application_bookCurr_book_mass_entry]').hide();
        var allEmployees = this.getPopulation();
        var json = { autocompleter: { object: $A()} };
        for (var i = 0; i < allEmployees.length; i++) {
            json.autocompleter.object.push({
                data: allEmployees[i].objectId,
                text: allEmployees[i].name
            });
        }

        this.multiSelect = new MultiSelect('application_bookCurr_entryData', { autocompleter: { showEverythingOnButtonClick: true,
            timeout: 5000,
            templateResult: '#{text}',
            maxShown: 5,
            minChars: 1
        },
            events: $H({ onRemoveBox: 'EWS:BookCurr_removeBox' })
        }, json);
        this.isManager = 'X';
        //}
        for (var j = 0; j < curId.length; j++) {
            this.divHash.set(curId[j], {
                trainingDiv: new Hash()
            });
            var hashTrainings = this.hash.get(curId[j]).hashOfTrainings.keys();
            //no results found
            if(hashTrainings.length == 0){                
                this.virtualHtml.down('[id=application_bookCurr_book_table_'+curId[j]+']').update("<div><span class = 'fieldDispTotalWidth fieldDispFloatLeft application_main_soft_text pdcPendReq_emptyTableDataPart'>"+global.getLabel('noResults')+"</span></div>");  
                this.virtualHtml.down('[id=application_bookCurr_book_table_' + curId[j] + ']').hide();
                this.virtualHtml.down('[id=application_curriculum_check_' + curId[j] + ']').disabled= true;
            }          
            this.tablesCont = 0;
            for (this.tablesCont = 0; this.tablesCont < hashTrainings.length; this.tablesCont++) {
                this.trainingsArray.push(hashTrainings[this.tablesCont]);
                var viewDetailsSessionId = this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.keys()[0];
                var html = "<div id='application_bookCurr_book_content_table" + this.tablesCont + "' class='application_bookCurr_book_content_table'>"
                            + "<div id='application_bookCurr_book_table_title" + this.tablesCont + "' class= 'application_bookCurr_table_title'>"
                                + "<div id='application_bookCurr_book_trainName" + this.tablesCont + "' class='application_bookCurr_book_trainName'>" + parseInt(this.tablesCont + 1) + "." + this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).trainingsNameXML + "</div>"
                            + "</div>";
                var hashSessions = this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.keys();
                var idsArray = [];
                html += "<table id='book_application_tableKit_" + curId[j] + "_" + this.tablesCont + "' class='sortable bookCurr_application_table'>"
                            + "<thead>"
	                            + "<tr><th class='table_sortfirstdesc book_application_thLoc' id='ThLocation'>" + global.getLabel('location') + "</th><th id='ThLanguage' class='book_application_thLang'>" + global.getLabel('language') + "</th><th id='period' class='book_application_thPer'>" + global.getLabel('period') + "</th><th id='Thprice' class='book_application_thPric'>" + global.getLabel('price') + "</th><th id='ThReserved' class='book_application_thResr'>" + global.getLabel('reserved') + "</th><th id='ThWaiting' class='book_application_thWait'>" + global.getLabel('waiting') + "</th></tr>"
                            + "</thead><tbody id='tableKit_body'>";
                for (var i = 0; i < hashSessions.length; i++) {
                    var location = this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).locationXML;
                    var language = this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).languageXML;
                    if(Object.isEmpty(language)) 
                        language = '';
                    var begDa = this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).startDateXML;
                    var begDate = Date.parseExact(begDa, "yyyy-MM-dd").toString('dd.MM.yyyy');
                    var endDa = this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).endDateXML;
                    var finalDate = Date.parseExact(endDa, "yyyy-MM-dd").toString('dd.MM.yyyy');
                    var period = finalDate + "&nbsp; - &nbsp;" + begDate;
                    var price = this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).internalPXML + this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).int_curXML + "/" + this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).externalPXML + this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).ext_curXML;
                    var reserved = this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).reservedXML + "/" + this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).allowedXML;
                    var waiting = this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).waitingListXML;
                    if (Object.isEmpty(waiting)) waiting = 0;
                    var res = parseInt(this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).reservedXML);
                    var optimum = this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).optimumXML;            
                    var allow = parseInt(this.hash.get(curId[j]).hashOfTrainings.get(hashTrainings[this.tablesCont]).hashOfSessions.get(hashSessions[i]).allowedXML);
                    if (res < optimum)
                        var color = '#55D455'; //green
                    else if (res >= optimum && res < allow)
                        var color = '#D6AE00'; //yellow
                    else if (res == allow)
                        var color = '#FF0000'; //red
                    var barLenght = (40 / allow) * res;
                    this.divId = 'application_bookCurr_book_period_' + curId[j] + "_" + hashSessions[i];
                    idsArray.push(this.divId);
                    //mvv html += "<tr id='Tr1'><td><input id='" + this.divId + "_checkbox' type='checkbox' name='" + curId[j] + '_' + hashTrainings[this.tablesCont] + "'>" + location + "</td><td>" + language + "</td><td id='" + this.divId + "_TD'><div id='" + this.divId + "'><span class='application_action_link'>" + period + "</span></div></td><td>" + price + "</td><td>" + reserved + "</td><td>" + waiting + "</td></tr>";
                    html += "<tr id='Tr1'><td><div id='" + this.divId + "_checkbox'>" + location + "</td><td>" + language + "</td><td id='" + this.divId + "_TD'><div id='" + this.divId + "'><span class='application_action_link'>" + period + "</span></div></td><td>" + price + "</td><td><div class='application_book_allowed'><div id='application_book_bar" + j + "' class='application_book_reserved' style='width:" + barLenght + "px; background-color:" + color + "'></div></div>" + reserved + "</td><td>" + waiting + "</td></tr>";                   
                }

                html += "</tbody></table></div>";


                if (!$("book_application_tableKit_" + curId[j] + "_" + this.tablesCont)) {
                    this.virtualHtml.down('[id=application_bookCurr_book_table_' + curId[j] + ']').insert(html);
                    TableKit.Sortable.init("book_application_tableKit_" + curId[j] + "_" + this.tablesCont);
                    this.virtualHtml.down('[id=application_bookCurr_book_table_' + curId[j] + ']').hide();
                }
                else {
                    this.virtualHtml.down('[id=application_bookCurr_book_table' + curId[j] + ']').update(html);
                    TableKit.reloadTable("book_application_tableKit_" + curId[j] + "_" + this.tablesCont);
                    this.virtualHtml.down('[id=application_bookCurr_book_table' + curId[j] + ']').hide();
                }
                this.divHash.get(curId[j]).trainingDiv.set(hashTrainings[this.tablesCont], {
                    schedulesDiv: new Hash()
                });

                for (var c = 0; c < idsArray.length; c++) {
                    this.divHash.get(curId[j]).trainingDiv.get(hashTrainings[this.tablesCont]).schedulesDiv.set(c, {
                        arg1: idsArray[c],
                        arg2: "",
                        arg3: ""
                    });


                    $(idsArray[c]).observe('click', this.bookCurr_showSchedule.bind(this, curId[j], hashTrainings[this.tablesCont], c));
                    //mvv remove checkboxes in trainings $(idsArray[c] + '_checkbox').observe('click', this.bookCurr_checkbox.bind(this, curId[j], idsArray, c));
                }
            }
        }

        this._checkSelectedEmployees();
        var html = "<div id ='book_application_row1'>"
                    + "<div id='book_application_subDo' class='book_application_label2'>" + global.getLabel('domainName') + "</div>"
                    + "<div id='book_application_domain' class='book_application_main_text2'>" + this.hash.get(curId[0]).domainName + "</div>"
                + "</div>"
                    + "<div id='book_application_row2'>"
                    + "<div id='book_application_content' class='book_application_label2'>" + global.getLabel('location2') + "</div>"
                + "<div id='book_application_nameC' class='book_application_main_text2'>" + this.hash.get(curId[0]).location + "</div>"
                + "</div>"
                + "<div id ='book_application_row3'>"
                    + "<div id='book_application_GeneralDesc' class='book_application_label2'>" + global.getLabel('generalDesc') + "</div>"
                    + "<div id='book_application_Generel' class='book_application_main_text2'>" + this.hash.get(curId[0]).description1 + "</div>"
                + "</div>"
                + "<div id ='book_application_row4'>"
                    + "<div id='book_application_subDo' class='book_application_label2'>" + global.getLabel('course_content') + "</div>"
                    + "<div id='book_application_domain' class='book_application_main_text2'>" + this.hash.get(curId[0]).description2 + "</div>"
                + "</div>"
                + "<div id ='book_application_row5'>"
                    + "<div id='book_application_subDo' class='book_application_label2'>" + global.getLabel('note') + "</div>"
                    + "<div id='book_application_domain' class='book_application_main_text2'>" + this.hash.get(curId[0]).description3 + "</div>"
                + "</div>"
                    + "<div id ='book_application_row6'>"
                    + "<div id='book_application_subDo' class='book_application_label2'>" + global.getLabel('extended') + "</div>"
                + "<div id='book_application_domain' class='book_application_main_text2'>" + this.hash.get(curId[0]).description4 + "</div>"
                + "</div>";
        var isIE6 = false/*@cc_on || @_jscript_version < 5.7@*/;
        if (Prototype.Browser.Gecko || isIE6) {
            html += "<div style='clear:left; font-size:0px; margin:0px; padding:0px;'></div>";
        }

        var detailsCurWidget = $H({
            title: global.getLabel('CurriculumDesc'),
            collapseBut: true,
            contentHTML: html,
            onLoadCollapse: false,
            targetDiv: 'application_bookCurr_book_training_description'
        });
        var CurWidget = new unmWidget(detailsCurWidget);
        var cont = 0;
        if (Object.isEmpty(this.hash.get(this.hash.keys()[0]).domainName)) {
            this.virtualHtml.down('div#book_application_row1').hide();
            cont++;
        }
        if (Object.isEmpty(this.hash.get(this.hash.keys()[0]).location) || this.hash.get(this.hash.keys()[0]).location == "&nbsp;") {
            this.virtualHtml.down('div#book_application_row2').hide();
            cont++;
        }
        if (Object.isEmpty(this.hash.get(this.hash.keys()[0]).description1)) {
            this.virtualHtml.down('div#book_application_row3').hide();
            cont++;
        }
        if (Object.isEmpty(this.hash.get(this.hash.keys()[0]).description2)) {
            this.virtualHtml.down('div#book_application_row4').hide();
            cont++;
        }
        if (Object.isEmpty(this.hash.get(this.hash.keys()[0]).description3)) {
            this.virtualHtml.down('div#book_application_row5').hide();
            cont++;
        }
        if (Object.isEmpty(this.hash.get(this.hash.keys()[0]).description4)) {
            this.virtualHtml.down('div#book_application_row6').hide();
            cont++;
        }

        if (cont != 6) {
            CurWidget.close();
        }

    },
    detailsCur: function(nameCurId, trainingCurId){ 
       this.virtualHtml.down('[id='+nameCurId+']').toggle();
       this.virtualHtml.down('[id='+trainingCurId+']').toggle();
    },

    getPeopleFromLeftMenu: function() {
        this.leftMenuToMultiSelect(this.multiSelect);
        this._checkSelectedEmployees();
    },

    _back_history: function() {
        document.fire('EWS:openApplication', $H({ app: 'HIS' }));
    },

    bookCurr_showSchedule: function(curId, idTraining, sessionNumber) {
        var sesId = sessionNumber;
        var divId;
        var curId = curId;
        var Css = "";
        var idSession = "";

        if (!Object.isEmpty(this.divHash.get(curId).trainingDiv.get(idTraining).schedulesDiv.get(sessionNumber).arg1)) {
            divId = this.divHash.get(curId).trainingDiv.get(idTraining).schedulesDiv.get(sessionNumber).arg1;
            Css = 'book_application_content_schedule';
            idSession = this.divHash.get(curId).trainingDiv.get(idTraining).schedulesDiv.get(sessionNumber).arg1.split('_')[5];
            if (!this.virtualHtml.down('[id=' + divId + '_I]')) {
                var newDiv = "<div id='" + divId + "_I'></div>";
                this.virtualHtml.down('[id=' + divId + '_TD]').insert(newDiv);
                var html = "<div id='book_application_schedule' class='" + Css + "'>";
                var length = this.hash.get(curId).hashOfTrainings.get(idTraining).hashOfSessions.get(idSession).hashOfSchedules.keys().length;
                for (var i = 0; i < length; i++) {
                    var day = this.hash.get(curId).hashOfTrainings.get(idTraining).hashOfSessions.get(idSession).hashOfSchedules.get(i).dayTypeSchedule;
                    var date = this.hash.get(curId).hashOfTrainings.get(idTraining).hashOfSessions.get(idSession).hashOfSchedules.get(i).dayDataSchedule;
                    var dateFinal = Date.parseExact(date, "yyyy-MM-dd").toString('dd.MM.yyyy');
                    var startHour = this.hash.get(curId).hashOfTrainings.get(idTraining).hashOfSessions.get(idSession).hashOfSchedules.get(i).startTimeSchedule;
                    var endHour = this.hash.get(curId).hashOfTrainings.get(idTraining).hashOfSessions.get(idSession).hashOfSchedules.get(i).endTimeSchedule;
                    html += "<div id='book_application_schedule_row_" + i + "'>"
                        + "<div id='book_application_schedule_left" + i + "' class='book_application_left_column'>"
                            + "<span id='book_application_days_" + i + "' class='book_application_text_bolder'>" + day + "&nbsp;</span>"
                        + "</div>"
                        + "<div id='book_application_schedule_text" + i + "' class='application_curr_text_not_bolder'>"
                            + "<span id='book_application_date_" + i + "'>" + dateFinal + "</span>"
                        + "</div>"
                        + "<div id='book_application_schedule_text" + i + "' class='book_application_schedule_text application_curr_text_not_bolder'>"
                            + "<span id='book_application_startH_" + i + "'>" + startHour + "&nbsp;-</span>"
                        + "</div>"
                        + "<div id='book_application_schedule_text" + i + "' class='book_application_schedule_text_final application_curr_text_not_bolder'>"
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
        }
        else if (!Object.isEmpty(this.divHash.get(curId).trainingDiv.get(idTraining).schedulesDiv.get(sessionNumber).arg2)) {
            divId = this.divHash.get(curId).trainingDiv.get(idTraining).schedulesDiv.get(sessionNumber).arg2;
            Css = 'book_application_content_schedule';
            idSession = this.divHash.get(curId).trainingDiv.get(idTraining).schedulesDiv.get(sessionNumber).arg2.split('_')[4];
            if (!this.virtualHtml.down('[id=' + divId + '_I]')) {
                var newDiv = "<div id='" + divId + "_I'></div>";
                this.virtualHtml.down('[id=' + divId + '_TD]').insert(newDiv);
                var html = "<div id='book_application_schedule' class='" + Css + "'>";
                var length = this.hash.get(curId).hashOfTrainings.get(idTraining).hashOfSchedules.keys().length;
                for (var i = 0; i < length; i++) {
                    var day = this.hash.get(curId).hashOfTrainings.get(idTraining).hashOfSchedules.get(i).dayTypeSchedule;
                    var date = this.hash.get(curId).hashOfTrainings.get(idTraining).hashOfSchedules.get(i).dayDataSchedule;
                    var dateFinal = Date.parseExact(date, "yyyy-MM-dd").toString('dd.MM.yyyy');
                    var startHour = this.hash.get(curId).hashOfTrainings.get(idTraining).hashOfSchedules.get(i).startTimeSchedule;
                    var endHour = this.hash.get(curId).hashOfTrainings.get(idTraining).hashOfSchedules.get(i).endTimeSchedule;
                    html += "<div id='book_application_schedule_row_" + i + "'>"
                        + "<div id='book_application_schedule_left" + i + "' class='book_application_left_column'>"
                            + "<span id='book_application_days_" + i + "' class='book_application_text_bolder'>" + day + "&nbsp;</span>"
                        + "</div>"
                        + "<div id='book_application_schedule_text" + i + "' class='application_curr_text_not_bolder'>"
                            + "<span id='book_application_date_" + i + "'>" + dateFinal + "</span>"
                        + "</div>"
                        + "<div id='book_application_schedule_text" + i + "' class='book_application_schedule_text application_curr_text_not_bolder'>"
                            + "<span id='book_application_startH_" + i + "'>" + startHour + "&nbsp;-</span>"
                        + "</div>"
                        + "<div id='book_application_schedule_text" + i + "' class='book_application_schedule_text_final application_curr_text_not_bolder'>"
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
        }
        else if (!Object.isEmpty(this.divHash.get(curId).trainingDiv.get(idTraining).schedulesDiv.get(sessionNumber).arg3)) {
            divId = this.divHash.get(curId).trainingDiv.get(idTraining).schedulesDiv.get(sessionNumber).arg3;
            Css = 'bookCurr_application_content_schedule_viewDetails';
            idSession = this.divHash.get(curId).trainingDiv.get(idTraining).schedulesDiv.get(sessionNumber).arg3.split('_')[4];
        }
    },

    _checkSelectedEmployees: function() {
        var curr = this.divHash.keys();
            var count = 0;
        for (var j = 0; j < curr.length; j++) {
            if(this.virtualHtml.down('[id=application_curriculum_check_'+this.hash.keys()[j]+']').checked == true){               
                    count++;
                }
            this.employeesIds.clear();
            var selectedEmployeesLength = this.multiSelect.getSelected().length;
            var selectedEmployeesNames = "";

            if (selectedEmployeesLength == 0) {
                var noSelect = global.getLabel("selectEmployeePlease");
                this.virtualHtml.down('[id=application_bookCurr_book_mass_entry]').update(noSelect);
                this.Buttonbook_buttons_book.disable('application_bookCurr_book_button_book');
            }
            else {
                if (count > 0 ) {
                    this.Buttonbook_buttons_book.enable('application_bookCurr_book_button_book');
                    this.Buttonbook_buttons_book.updateHandler('application_bookCurr_book_button_book', this._bookCurr_make_book.bind(this));
                }
                for (var i = 0; i < selectedEmployeesLength; i++) {
                    this.employeesIds[i] = this.multiSelect.getSelected()[i]._object.data;
                }
            }
        }
    },

    _bookCurr_chekAll: function(curId) {
        var checkAll = this.virtualHtml.select('[input[name=group2]');
        if (this.virtualHtml.down('[id=application_curriculum_check_' + curId + ']').checked == true) {
            this.virtualHtml.down('[id=application_bookCurr_book_table_' + curId + ']').show();
            this.virtualHtml.down('[id=application_bookCurr_book_max_' + curId + ']').hide();
            this.virtualHtml.down('[id=application_bookCurr_book_min_' + curId + ']').show();
            this.sessionIds.clear();
            for (var j = 0; j < checkAll.length; j++) {
                checkAll[j].checked = false;
            }
            this.virtualHtml.down('[id=application_curriculum_check_' + curId + ']').checked = true;
            /* mvv remove checkboxes in trainings
            var curriculums = this.divHash.keys();
            for (var j = 0; j < curriculums.length; j++) {
                var Alltrainings = this.divHash.get(curriculums[j]).trainingDiv.keys();
                for (var c = 0; c < Alltrainings.length; c++) {
                    var schecules = this.divHash.get(curriculums[j]).trainingDiv.get(Alltrainings[c]).schedulesDiv.keys();
                    for (var i = 0; i < schecules.length; i++) {
                        this.virtualHtml.down('[id=' + this.divHash.get(curriculums[j]).trainingDiv.get(Alltrainings[c]).schedulesDiv.get(i).arg1 + '_checkbox]').checked = false;
                    }
                }
            }*/
            var curr = this.divHash.get(curId);
            var trainings = curr.trainingDiv.keys();
            for (var c = 0; c < trainings.length; c++) {
                /*mvv remove checkboxes in trainings this.virtualHtml.down('[id=' + curr.trainingDiv.get(trainings[c]).schedulesDiv.get(0).arg1 + '_checkbox]').checked = true;*/
                var id = this.virtualHtml.down('[id=' + curr.trainingDiv.get(trainings[c]).schedulesDiv.get(0).arg1 + '_checkbox]').id.split('_')[5];
                this.sessionIds.push(id + "_" + trainings[c]);
                this.Buttonbook_buttons_book.enable('application_bookCurr_book_button_book');
                this.Buttonbook_buttons_book.updateHandler('application_bookCurr_book_button_book', this._bookCurr_make_book.bind(this));
                //this.virtualHtml.down('[id=application_bookCurr_book_button_book]').observe('click', this._bookCurr_make_book.bind(this));

            }
            this._checkSelectedEmployees();
        }
        else {
            var curr = this.divHash.get(curId);
            var trainings = curr.trainingDiv.keys();
            for (var c = 0; c < trainings.length; c++) {
                this.virtualHtml.down('[id=' + curr.trainingDiv.get(trainings[c]).schedulesDiv.get(0).arg1 + '_checkbox]').checked = false;
            }
            this.Buttonbook_buttons_book.disable('application_bookCurr_book_button_book');
            this.sessionIds.clear();
        }
    },
/* remove checkboxes in trainings
    bookCurr_checkbox: function(curId, array, pointer) {
        if (this.virtualHtml.down('[id=' + array[pointer] + '_checkbox]').checked == false) {
            this.virtualHtml.down('[id=application_curriculum_check_' + curId + ']').checked = false;
            this.Buttonbook_buttons_book.disable('application_bookCurr_book_button_book');
        }
        else {
            var count = 0;
            this.sessionIds.clear();
            for (var i = 0; i < array.length; i++) {
                if (array[i] + '_checkbox' != array[pointer] + '_checkbox') {
                    this.virtualHtml.down('[id=' + array[i] + '_checkbox]').checked = false;
                }
            }
            var curr = this.divHash.get(curId);
            var trainings = curr.trainingDiv.keys();
            for (var c = 0; c < trainings.length; c++) {
                var schedules = curr.trainingDiv.get(trainings[c]).schedulesDiv.keys();
                for (var j = 0; j < schedules.length; j++) {
                    if (this.virtualHtml.down('[id=' + curr.trainingDiv.get(trainings[c]).schedulesDiv.get(j).arg1 + '_checkbox]').checked == true) {
                        count++;
                        var id = this.virtualHtml.down('[id=' + curr.trainingDiv.get(trainings[c]).schedulesDiv.get(j).arg1 + '_checkbox]').id.split('_')[5];
                        this.sessionIds.push(id + "_" + trainings[c]);
                    }
                }
            }
            if (trainings.length == count) {
                this.Buttonbook_buttons_book.enable('application_bookCurr_book_button_book');
                this.virtualHtml.down('[id=application_curriculum_check_' + curId + ']').checked = true;
                this.Buttonbook_buttons_book.updateHandler('application_bookCurr_book_button_book', this._bookCurr_make_book.bind(this));
                //this.virtualHtml.down('[id=application_bookCurr_book_button_book]').observe('click', this._bookCurr_make_book.bind(this));
                this._checkSelectedEmployees();
            }
            else {
                this.sessionIds.clear();
            }
        }
    },
*/
    _showTrainings: function(curId) {
        this.virtualHtml.down('[id=application_bookCurr_book_table_' + curId + ']').show();
        this.virtualHtml.down('[id=application_bookCurr_book_max_' + curId + ']').hide();
        this.virtualHtml.down('[id=application_bookCurr_book_min_' + curId + ']').show();

    },

    _hideTrainings: function(curId) {
        this.virtualHtml.down('[id=application_bookCurr_book_table_' + curId + ']').hide();
        this.virtualHtml.down('[id=application_bookCurr_book_min_' + curId + ']').hide();
        this.virtualHtml.down('[id=application_bookCurr_book_max_' + curId + ']').show();
    },

    _bookCurr_make_book: function() {
        var currId;
        var checkAll = this.virtualHtml.select('[input[name=group2]');
        for (var i = 0; i < checkAll.length; i++) {
            if (checkAll[i].checked) {
                currId = checkAll[i].id.split('_')[3];
            }
        }

        var priox = 50;
        var currStart = this.hash.get(currId).startDate;
        var currEnd = this.hash.get(currId).endDate;
        var sesId = "";
        var order = "";
        var empId = [];

        empId = this.employeesIds;
        this.callToSap = 1;
        var xml = "<EWS>"
                + "<SERVICE>" + this.createCurriculumBook + "</SERVICE>"
                + "<PARAM>"
                  + "<O_TABLE_PERNR>";

        for (var i = 0; i < empId.length; i++) {
            xml += "<YGLUI_TAB_PERNR PERNR=\"" + empId[i] + "\"/>";
        }
        xml += "</O_TABLE_PERNR>"
                            + "<O_BEGDA>" + currStart + "</O_BEGDA>"
                            + "<O_ENDDA>" + currEnd + "</O_ENDDA>"
                            + "<O_CURRI_SESS>" + currId + "</O_CURRI_SESS>"
                            + "<O_ELEMENTS>";

        for (var j = 0; j < this.sessionIds.length; j++) {
            sesId = this.sessionIds[j].split('_')[0];
            xml += "<YGLUI_TAB_TRAINING_SESSIONS ET_OBJID=\"" + sesId + "\"/>";
        }
        xml += "</O_ELEMENTS>"
                + "</PARAM>"
                + "</EWS>";

        this.makeAJAXrequest($H({ xml: xml, successMethod: 'bookCurr_processBook' }));
    },

    /*
    *@method cancelBook_createHtml
    * @desc 
    * @return void
    */
    cancelBookCurr_createHtml: function(jsonReason) {
        this.firstDeleteBookCurr = false;
        var trainingsHtml = "<table id='application_bookCurr_cancelBook_trainingsTable'>";
        var trainingsHash = this.hash.get(this.hash.keys()[0]).hashOfTrainings;
        var counter = 0;
        var idsArray = [];
        var type = this.hash.get(this.hash.keys()[0]).cancelPolicy;

        trainingsHash.each(function(training) {
            var trainingId = training.key;
            trainingsHtml += "<tr id='application_bookCurr_cancelBook_trainingRow'><div id='application_bookCurr_cancelBook_training_" + training.value.trainingsIdXML + "' >"
            if (type != 'A') {
                trainingsHtml += "<td><input class='application_bookCurr_cancelBook_check' id='application_bookCurr_cancelBook_" + counter + "_" + training.value.trainingsIdXML + "_checkbox' type='checkbox' name='cbCancel'/></td>";
                idsArray.push("application_bookCurr_cancelBook_" + counter + "_" + training.value.trainingsIdXML + "_checkbox");
                counter++;
            }
            trainingsHtml += "<td><div class='application_bookCurr_cancelBook_trainingName'>";
            trainingsHtml += training.value.trainingsNameXML;
            trainingsHtml += "</div></td>";
            var startDate = Date.parseExact(training.value.trainingsBegda, 'yyyy-MM-dd').toString('dd.MM.yyyy');
            var endDate = Date.parseExact(training.value.trainingsEndda, 'yyyy-MM-dd').toString('dd.MM.yyyy');
            trainingsHtml += "<td><div class='application_bookCurr_cancelBook_periodDiv' id='application_bookCurr_cancelBook_period_" + trainingId + "_TD'>"
                                        + "<span id='application_bookCurr_cancelBook_period_" + trainingId + "' class='application_action_link'> " + startDate + " - " + endDate + " </span></div>"
                                        + "</div></td>"
            trainingsHtml += "</div></tr>";


        });
        trainingsHtml += '</table>';

        var name = this.hash.get(this.hash.keys()[0]).employeeName;
        if (Object.isEmpty(name)) {
            name = '';
        }
        var status = this.hash.get(this.hash.keys()[0]).status;
        if (Object.isEmpty(status)) {
            status = '';
        }
        var language = this.hash.get(this.hash.keys()[0]).language;
        if (Object.isEmpty(language)) {
            language = '';
        }
        var location = this.hash.get(this.hash.keys()[0]).location;
        if (Object.isEmpty(location)) {
            location = '';
        }
        var provider = this.hash.get(this.hash.keys()[0]).provider;
        if (Object.isEmpty(provider)) {
            provider = '';
        }
        var html = "<div id='application_bookCurr_cancelBook_parent'>" +
        "<div id='application_bookCurr_cancelBook_title' class='application_book_cancelBook_content'>" +
                "<div class='application_book_cancelBook_row'>" +
        	        "<div id='application_bookCurr_cancelBook_for' class='application_text_bolder application_book_cancelBook_left_column_name application_main_soft_text'>" +
        		        global.getLabel('forBig') +
        	        "</div>" +
        	        "<div id='application_bookCurr_cancelBook_name' class='application_book_cancelBook_right_column'>" +
        		        name +
        	        "</div>" +
        	    "</div>" +
        	    "<div class='application_book_cancelBook_row'>" +
        	        "<div id='application_bookCurr_cancelBook_label' class='application_text_bolder application_book_cancelBook_left_column_name application_main_soft_text'>" +
        		        global.getLabel('status') +
        	        "</div>" +
			        "<div id='application_bookCurr_cancelBook_status' class='application_book_cancelBook_right_column'>" +
        		        status +
        	        "</div>" +
        	    "</div>" +
			        "<div class='application_book_cancelBook_row'>" +
			            "<div id='application_bookCurr_cancelBook_language_label' class='application_text_bolder application_book_cancelBook_left_column_name application_main_soft_text'>" +
				            global.getLabel('language') +
			            "</div>" +
        	            "<div id='application_bookCurr_cancelBook_language'class='application_book_cancelBook_right_column'>" +
        		            language +
        	            "</div>" +
			        "</div>" +
			        "<div class='application_book_cancelBook_row'>" +
			            "<div id='application_bookCurr_cancelBook_location_label' class='application_text_bolder application_book_cancelBook_left_column_name application_main_soft_text'>" +
				            global.getLabel('location') +
			            "</div>" +
        	            "<div id='application_bookCurr_cancelBook_location' class='application_book_cancelBook_right_column'>" +
        		           location +
        	            "</div>" +
			        "</div>" +
			        /*mvv "<div class='application_book_cancelBook_row'>" +
			            "<div id='application_bookCurr_cancelBook_provider_label' class='application_text_bolder application_book_cancelBook_left_column_name application_main_soft_text'>" +
				            global.getLabel('provider') +
			            "</div>" +
        	            "<div id='application_bookCurr_cancelBook_provider' class='application_book_cancelBook_right_column'>" +
        		            provider +
        	            "</div>" +
			        "</div>" +
			        */
			        "<div class='application_book_cancelBook_row'>" +
			            "<div id='application_bookCurr_cancelBook_cancelReason_label' class='application_text_bolder application_book_cancelBook_left_column_name_auto application_main_soft_text'>" +
				            global.getLabel('cancellationReason') +
			            "</div>" +
        	            "<div id='application_bookCurr_cancelBook_cancelReason' class='application_book_cancelBook_autocompleter_column'>" +
                            "<div id='application_bookCurr_cancellationReason'></div>" +
        	            "</div>" +
			        "</div>" +
			        "<div class='application_book_cancelBook_row'>" +
			            "<div id='application_bookCurr_cancelBook_trainings' class='application_text_bolder application_book_cancelBook_left_column_name'>" +
        		            global.getLabel('trainings') +
				            "<div id='application_bookCurr_cancelBook_trainings_list'>" +
					            trainingsHtml +
				            "</div>" +
        	            "</div>" +
        	        "</div>" +
        	        
        	"</div>" +
            "<div id='application_bookCurr_cancelBook_footer' class='application_book_cancelBook_footer_div'>" +
        //"<input class='application_book_buttonInput' type='button' id='application_bookCurr_cancelBook_requestCancellation' disabled/>" +
        //"<input class='application_book_buttonInput' type='button' id='application_bookCurr_cancelBook_exit_app' onClick='javascript:document.fire(\"EWS:openApplication\", $H({ app: \"" + this.previousApp + "\", refresh:\"X\"}));'/>" +
             //   "<div id='application_bookCurr_cancelBook_secondScreen' class='applications_container_div application_over_semiTransparent'>" +
               //     "<div class='application_book_semiTrans'><span id='application_bookCurr_cancelBook_question'>" + global.getLabel("cancellation_confirmation") + "</span></div>" +
                 //   "<div id='application_book_cancelBookButtons' class='application_book_cancelBook_buttons'>" +
        // "<input class='application_book_buttonInput application_book_cancelBook_cancelBook_button' type='button' id='application_bookCurr_cancelBook_cancelBook'/>" +
        //"<input class='application_book_buttonInput application_book_cancelBook_exit_secondScreen_button' type='button' id='application_bookCurr_cancelBook_exit_secondScreen'/>" +
                    "</div>" +
                "</div>" +
            "</div>" +
        "</div>";

        this.virtualHtml.down('[id=application_CURR_parent]').update(html);
        var json = {
            elements: [],
            defaultButtonClassName: 'application_book_buttonInput'
        };
        var auxExitSdScreen = {
            //data: $H({ app: this.previousApp, refresh: 'X' }),
            eventOrHandler: false,
            label: global.getLabel('cancel'),
            //event: "EWS:openApplication",
            idButton: 'application_bookCurr_cancelBook_exit_app',
            className: 'fieldDispFloatRight',
            type: 'button',
            standardButton: true,
            handlerContext: null,
            handler: global.goToPreviousApp.bind(global)
        };
        json.elements.push(auxExitSdScreen);
        var auxReqCancel = {
            handlerContext: null,
            handler: this.cancelBookCurr_showSecondScreen.bind(this),
            label: global.getLabel('cancelBookCurr'),
            idButton: 'application_bookCurr_cancelBook_requestCancellation',
            className: 'fieldDispFloatRight',
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxReqCancel);      
        this.ButtoncancelBook_footer = new megaButtonDisplayer(json);
        /*
        var json = {
            elements: [],
            defaultButtonClassName: 'application_book_buttonInput'
        };
        var auxReqCancel = {
            handlerContext: null,
            handler: this.cancelBookCurr_confirmCancel.bind(this),
            label: global.getLabel("confirm"),
            idButton: 'application_bookCurr_cancelBook_cancelBook',
            className: 'application_book_cancelBook_cancelBook_button',
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxReqCancel);
        var auxExitSdScreen = {
            handlerContext: null,
            label: global.getLabel('cancel'),
            handler: this.cancelBookCurr_hideSecondScreen.bind(this),
            idButton: 'application_bookCurr_cancelBook_exit_secondScreen',
            className: 'application_book_cancelBook_exit_secondScreen_button',
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxExitSdScreen);
        var ButtoncancelBook_buttons = new megaButtonDisplayer(json);
        */
        this.virtualHtml.down('[id=application_bookCurr_cancelBook_footer]').insert(this.ButtoncancelBook_footer.getButtons());
        //this.virtualHtml.down('[id=application_book_cancelBookButtons]').insert(ButtoncancelBook_buttons.getButtons());
        this.virtualHtml.down('[id=application_CURR_parent]').show();
        //this.virtualHtml.down('[id=application_bookCurr_cancelBook_secondScreen]').hide();
        //main screen buttons                                         
        //this.virtualHtml.down('[id=application_bookCurr_cancelBook_requestCancellation]').value = global.getLabel('request');
        //this.virtualHtml.down('[id=application_bookCurr_cancelBook_requestCancellation]').observe('click', this.cancelBookCurr_showSecondScreen.bind(this));
        //this.virtualHtml.down('[id=application_bookCurr_cancelBook_exit_app]').value = global.getLabel('exit');
        //second screen buttons
        //this.virtualHtml.down('[id=application_bookCurr_cancelBook_cancelBook]').value = global.getLabel("confirm");
        //this.virtualHtml.down('[id=application_bookCurr_cancelBook_cancelBook]').observe('click', this.cancelBookCurr_confirmCancel.bind(this));
        //this.virtualHtml.down('[id=application_bookCurr_cancelBook_exit_secondScreen]').value = global.getLabel('cancel');
        //this.virtualHtml.down('[id=application_bookCurr_cancelBook_exit_secondScreen]').observe('click', this.cancelBookCurr_hideSecondScreen.bind(this));
        //checkbox listeners
        if (type != 'A') {
            for (var j = 0; j < idsArray.length; j++) {
                this.virtualHtml.down('[id=' + idsArray[j] + ']').observe('click', this.cancelBookCurr_checkbox.bind(this, idsArray, j));
            }
        }
        //schedules listeners 
        var hashTrainingsKeys = this.hash.get(this.hash.keys()[0]).hashOfTrainings.keys();
        var hashOfTrainings = this.hash.get(this.hash.keys()[0]).hashOfTrainings;
        this.tablesCont = 0;
        this.divHash.set(this.hash.keys()[0], {
            trainingDiv: new Hash()
        });

        for (this.tablesCont = 0; this.tablesCont < hashTrainingsKeys.length; this.tablesCont++) {

            this.divHash.get(this.hash.keys()[0]).trainingDiv.set(hashTrainingsKeys[this.tablesCont], {
                schedulesDiv: new Hash()
            });

            this.divHash.get(this.hash.keys()[0]).trainingDiv.get(hashTrainingsKeys[this.tablesCont]).schedulesDiv.set(0, {
                arg1: "",
                arg2: "application_bookCurr_cancelBook_period_" + hashTrainingsKeys[this.tablesCont],
                arg3: ""
            });
            this.virtualHtml.down('[id=' + 'application_bookCurr_cancelBook_period_' + hashTrainingsKeys[this.tablesCont] + ']').observe('click', this.bookCurr_showSchedule.bind(this, this.hash.keys()[0], hashTrainingsKeys[this.tablesCont], 0));

        }

        // Autocompleter initialization
        if (!Object.isEmpty(jsonReason.EWS)) {//first run of cancelBooking, building autocompleter structure
            this.jsonReasons = {
                autocompleter: {
                    object: [],
                    multilanguage: {
                        no_results: 'No results found',
                        search: 'Search'
                    }
                }
            }
            for (var i = 0; i < jsonReason.EWS.o_values.item.length; i++) {
                var data = jsonReason.EWS.o_values.item[i]['@id'];
                var text = jsonReason.EWS.o_values.item[i]['@value'];
                this.jsonReasons.autocompleter.object.push({
                    data: data,
                    text: text
                });
            }
        }
        this.reasonsAutocompleter = new JSONAutocompleter('application_bookCurr_cancellationReason', {
            showEverythingOnButtonClick: true,
            timeout: 8000,
            autoWidth : true,
            templateOptionsList: '#{text}',
            events: $H({ onResultSelected: 'EWS:cancelCurriculumReasonAutocompleter_resultSelected' })
        }, this.jsonReasons);

    },
    cancelBookCurr_checkbox: function(array, position) {
        if (this.hash.get(this.hash.keys()[0]).cancelPolicy == 'P') {//cancel partial 
            var cbArray = this.virtualHtml.select('[name="cbCancel"]');
            if ($(array[position]).checked == false) {
                for (var i = 0; i < cbArray.length; i++) {
                    if (cbArray[i] == $(array[position])) break;
                    cbArray[i].checked = false;
                }
            } else {
                var selectedCB = false;
                for (var i = 0; i < cbArray.length; i++) {
                    if (cbArray[i] == $(array[position])) selectedCB = true;
                    if (selectedCB) cbArray[i].checked = true;
                }
            }
        }
    },
    /*
    * @method CancellationReason
    * @param args {Object} Information about the autocompleter
    * @desc Gets an autocompleter's value (Type or Status)
    * @return void
    */
    cancelBookCurr_setCancellationReason: function(args) {
        if (!Object.isEmpty(getArgs(args)) && (getArgs(args).isEmpty == false)) {
            if ($('application_bookCurr_cancelBook_requestCancellation')) {
                this.ButtoncancelBook_footer.enable('application_bookCurr_cancelBook_requestCancellation');
                this.reasonChosen = getArgs(args).idAdded;
            }
        } else {
            if ($('application_bookCurr_cancelBook_requestCancellation'))
                this.ButtoncancelBook_footer.disable('application_bookCurr_cancelBook_requestCancellation');
        }
    },
    /*
    *@method cancelPreBook_showSecondScreen
    * @desc 
    * @return void
    */
    cancelBookCurr_showSecondScreen: function() {
        var _this = this; 
        var contentHTML = new Element('div', { 'class': 'application_bookCurr_confirm_popUp' });
        contentHTML.insert("<div class='moduleInfoPopUp_std_leftMargin'>" + global.getLabel("cancellation_confirmation") + "</div>");         
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };                                   
        var callBackExit = function() {
            _this.cancelBookCurrPopUp.close();
            delete _this.cancelBookCurrPopUp;
        };
        var exitB = {
            idButton: 'application_bookCurr_cancelBook_exit_secondScreen',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBackExit,
            type: 'button',
            standardButton: true
        };        
        var requestB = {
            idButton: 'application_bookCurr_cancelBook_cancelBook',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: this.cancelBookCurr_confirmCancel.bind(this),
            type: 'button',
            standardButton: true
        };  
        buttonsJson.elements.push(requestB);  
        buttonsJson.elements.push(exitB);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();  
        //insert buttons in div
        contentHTML.insert(buttons);                                    
        this.cancelBookCurrPopUp = new infoPopUp({

            closeButton: $H({                
                'callBack': function() {
                    _this.cancelBookCurrPopUp.close();
                    delete _this.cancelBookCurrPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        this.cancelBookCurrPopUp.create();        

    },
    /*
    *@method cancelPreBook_hideSecondScreen
    * @desc 
    * @return void
    */
    /*
    cancelBookCurr_hideSecondScreen: function() {
        Framework_stb.hideSemitransparent();
        this.virtualHtml.down('[id=application_bookCurr_cancelBook_secondScreen]').hide();
    },
    */
    /*
    *@method cancelPreBook_confirmCancel
    * @desc 
    * @return void
    */
    cancelBookCurr_confirmCancel: function() {
        //hide the second screen
        //Framework_stb.hideSemitransparent();
        //this.virtualHtml.down('[id=application_bookCurr_cancelBook_secondScreen]').hide();
        //call SAP to cancel the prebooking

        var reason = '';
        if(this.reasonChosen)
            reason = this.reasonChosen;
        //var session = this.hash.get(this.hash.keys()[0]).curriculumId.split('_')[0];
        //var training = this.hash.get(this.hash.keys()[0]).curriculumTypeId;

        var sendTrainings = "<LIST_TRAININGS>";
        var cbArray = this.virtualHtml.select('[name="cbCancel"]');
        var id;
        for (var i = 0; i < cbArray.length; i++) {
            if (!cbArray[i].checked) {
                id = cbArray[i].id.split('_')[4];
                sendTrainings += "<YGLUI_TAB_TRAINING_SESSIONS ET_OBJID=\"" + id + "\"/>";
            }
        }
        sendTrainings += "</LIST_TRAININGS>";
        this.xmlCancelBooking = "<EWS>"
                                + "<SERVICE>" + this.cancelCurBookService + "</SERVICE>"
                                + "<OBJECT TYPE=\"" + this.otype + "\">" + this.hash.keys()[0] + "</OBJECT>"
                                + "<PARAM>"
                                + "<O_PERNR>" + this.employeeId + "</O_PERNR>"
                                + "<O_REASON>" + reason + "</O_REASON>"
                                + sendTrainings
                                + "</PARAM>"
                                + "</EWS>";
        this.makeAJAXrequest($H({ xml: this.xmlCancelBooking, successMethod: 'cancelBookCurr_openInProgressApp' }));

    },
    /*
    *@method cancelPreBook_openInProgressApp
    * @desc 
    * @return void
    */
    cancelBookCurr_openInProgressApp: function(req) {
        //document.fire('EWS:openApplication', $H({ app: 'LMS', refresh: 'X' }));
        this.cancelBookCurrPopUp.close();
        delete  this.cancelBookCurrPopUp;        
        global.goToPreviousApp();  
    },

    bookCurr_processBook: function(req) {
        var status = "<div id='application_book_contain_status'>"
                    + "<h2 id='application_book_status_title' class='application_book_status'>" + global.getLabel('status') + "</h2>";
        var pernrTable = objectToArray(req.EWS.o_table_pernr.yglui_tab_pernr);
        var pernrNames = objectToArray(req.EWS.o_pernr_name.yglui_str_popul_obj);
        if (Object.isEmpty(req.EWS.o_message)) {
            for (var j = 0; j < pernrTable.length; j++) {
                var pernr = pernrTable[j]['@pernr'];
                var namepernr = pernrNames[j]['@name'];
                status += "<div class='application_book_status_line'><div class='application_icon_green align_application_book_icons'></div><div class='application_book_status_pernr'>"  +namepernr+' ['+ pernr +']' + "</div><div class='application_book_status_label'>" + global.getLabel('statusOk') + "</div></div>";
            }
        }
        else {
            var message = objectToArray(req.EWS.o_message.yglui_tab_message);
            var namepernr ='';
            for (var j = 0; j < pernrTable.length; j++) {
                var pernr = pernrTable[j]['@pernr'];
                var cont = true;
                for (var i = 0; i < message.length && cont; i++) {
                    var employee = message[i]['@pernr'];
                    if (pernr == employee) {
                        for(var x=0;x<pernrNames.size();x++){
                            if (pernrNames[x]['@objid']==employee){
                                namepernr = pernrNames[x]['@name'];
                            }
                        }
                        var type = message[i]['@type'];
                        if (type == 'E' || type == 'W') {
                            var cssClass = type == 'E' ? 'application_icon_red' :'application_icon_orange';
                            var error = message[i]['@message'];
                            var label = type == 'E' ? global.getLabel('statusError') : global.getLabel('statusOk');                        
                            status += "<div class='application_book_status_line'><div class='" + cssClass + " align_application_book_icons'></div><div class='application_book_status_pernr'>" +namepernr+' ['+ employee+']' + "</div><div class='application_book_status_label'>" + label + "</div><div></div><div class='application_book_status_error_message'>" + error + "</div></div>";
                            cont = false;
                        }
                        else if(type == 'S') {
                            status += "<div class='application_book_status_line'><div class='application_icon_green align_application_book_icons'></div><div class='application_book_status_pernr'>" +namepernr+' ['+ employee+']' + "</div><div class='application_book_status_label'>" + global.getLabel('statusOk') + "</div></div>";
                            cont = false;
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
        var callBack = function() {
            curriculumStatusPopUp.close();
            delete curriculumStatusPopUp;
            global.goToPreviousApp();
        };
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

        var curriculumStatusPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    curriculumStatusPopUp.close();
                    delete curriculumStatusPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',//mvv 'confirmation',
            width: 600
        });
        curriculumStatusPopUp.create();
    },

    _goToLearning: function() {
        Framework_stb.hideSemitransparent();
        document.fire('EWS:openApplication', $H({ app: 'LMS', refresh: 'X' }));
    },


    close: function($super) {
        if (!this.firstBook || !this.firstDeleteBookCurr || !this.firstViewDetails) {
            this.updateTitle('');
            this.virtualHtml.down('[id=application_CURR_parent]').hide();
            this.hashOfCurriculums = new Hash();
            this.employeesIds = [];
            this.sessionIds = [];
            this.trainingsArray = [];
            this.hash = new Hash();
            this.hashOfBooks = new Hash();
            this.divHash = new Hash();
            this.hashErrors = new Hash();
        }
        var tables = this.virtualHtml.select('[id^="book_application_tableKit"]');
        if (tables.length != 0) {
            for (var i = 0; i < tables.length; i++)
                TableKit.unloadTable(tables[i]);
        }

        $super();
        document.stopObserving("EWS:employeeSelected", this._checkSelectedEmployeesBinding);
        document.stopObserving("EWS:employeeUnselected", this._checkSelectedEmployeesBinding);
        document.stopObserving('EWS:cancelCurriculumReasonAutocompleter_resultSelected', this.cancelBookCurr_setCancellationReasonBinding);
    }

});