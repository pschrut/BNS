var PREB = Class.create(Application, {

    /*** SERVICES ***/
    /** 
    * Service used to create prebooking.
    * @field createPrebooking
    * @type String
    */
    createPrebooking: "CREATEPREBOOK",
    /*** XMLs IN & OUT***/
    /**
    * Property to call the service with labels
    * @field xmlGetPrebook
    * @type XmlDoc
    */
    xmlGetPrebook: XmlDoc.create(),
    /**
    * Property to call the service with labels
    * @field xmlGetPrebook
    * @type XmlDoc
    */
    xmlCreatePrebook: XmlDoc.create(),
    /**
    * Property to hold xml of the labels
    * @field xmlPreBook
    * @type XmlDoc
    */
    xmlPrebook: XmlDoc.create(),

    /*** VARIABLES ***/
    /**
    * property to keep the list of employee ids  
    * @field selectedEmployees
    * @type Array
    */
    selectedEmployees: [],
    /**
    * property to keep the list of employee index in json 
    * @field employeesIndex
    * @type Array
    */
    employeesIndex: [],
    /**
    * property to keep the list of employees and their info
    * @field employeeInfoHash
    * @type Hash
    */
    employeeInfoHash: new Hash(),
    /**
    * property keep the trainingId 
    * @field trainingId
    * @type String
    */
    trainingId: '',
    /**
    * property keep the training name 
    * @field trainingName
    * @type String
    */
    trainingName: '',
    /**
    * indicates the number of AJAX calls to be made
    * @field callsToBeMade
    * @type Integer
    */
    responsesToGet: 0,
    /**
    * indicates if at least one employee is not prebooked yet
    * @field oneEmployeeOk
    * @type Boolean
    */
    oneEmployeeOk: false,
    /*
    * @name begDatePicker
    * @type DatePicker
    * @desc Begining date
    */
    begDatePicker: null,
    /*
    * @name correctBegDatePicker
    * @type Boolean
    * @desc Says if begDatePicker has correct value
    */
    correctBegDatePicker: true,
    comment: '',
    priority: 99,

    initialize: function($super, options) {
        $super(options);
        this.changeDatePickersHandlerBinding = this.changeDatePickers.bind(this);
    },

    run: function($super, args) {
        $super();
        document.observe('EWS:autocompleterResultSelected_preBook_application_entryData', this._checkSelectedEmployees.bindAsEventListener(this));
        document.observe('EWS:preBook_removeBox', this._checkSelectedEmployees.bindAsEventListener(this));
        if (this.firstRun) {
            this.virtualHtml.insert("<div id='application_prebook_parent'></div>");
        } else {
            this.virtualHtml.down('[id=application_prebook_parent]').update('');
        }
        this.selectedEmployees = args.get('employee');
        this.trainingId = args.get('training');
        this.currentApp = args.get('app');
        this.processPrebook();
        //set the event listeners
        document.observe("EWS:datepicker_CorrectDate", this.changeDatePickersHandlerBinding);
        //document.observe("EWS:datepicker_WrongDate", this.changeDatePickersHandlerBinding);

    },

    processPrebook: function() {
        var html = "<div id='application_prebook_content'>"
                           + "<div id='preBook_application_title' class='preBook_application_title'>"
                               + "<div id='PreBook_application_for' class='book_application_label_for2 fieldClearBoth fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text'>" + global.getLabel('forBig') + "</div>"
                                + "<div id ='preBook_application_entryData' class='book_application_mass'></div>"
                                + "<div id='preBook_application_mass_entry' class='application_book_radio_button'></div>"
                            + "</div>"
                           + "<div id='application_prebook_options'>"
                               + "<div id='application_prebook_validity' class='preBook_application_title'>"
                                   + "<div class='fieldDispFloatLeft book_application_label_for2 fieldClearBoth fieldCaption fieldDispHeight fieldDispLabel fieldDispNoWrap application_main_soft_text'>" + global.getLabel('date') + "</div>"
                                   + "<div id='application_prebook_dpFrom' ></div>"
                               + "</div>"
                               + "<div id='application_prebook_comment' class='preBook_application_title'>"
                                   + "<div class='fieldDispFloatLeft book_application_label_for2 fieldClearBoth fieldCaption fieldDispHeight fieldDispLabel fieldDispNoWrap application_main_soft_text'>" + global.getLabel('comment') + "</div>"
                                   + "<div id='application_prebook_commentInputDiv'>"
                                   + "<input type='text' id='application_prebook_commentInput' maxlength='2000' size='2000' class='application_prebook_box'/>"
                                   + "</div>"
                               + "</div>"
                           + "</div>"
                            + "<div id='application_prebook_bottom' class='application_prebook_footer'></div>"
                           + "</div>";
        this.virtualHtml.down('[id=application_prebook_parent]').update(html);

        var json = {
            elements: [],
            defaultButtonClassName: 'applicationPrebookFooter'
        };
        var auxCancel = {
            label: global.getLabel('cancel'),
            idButton: 'application_prebook_cancel_button',
            type: 'button',
            //event: "EWS:openApplication",
            //data: $H({ app: 'BOOK', allSessions: '', employee: '', isDelete: '', oType: 'D', training: this.trainingId, prevApp: 'PREB' }),
            eventOrHandler: false,
            standardButton: true,
            handlerContext: null,
            handler: global.goToPreviousApp.bind(global, {                
                allSessions: '',
                employee: this.selectedEmployees,
                isDelete: '',
                oType: 'D',
                prevApp: this.currentApp.view,
                training: this.trainingId
                })                                     
        };
        json.elements.push(auxCancel);
        var auxPrebook = {
            label: global.getLabel('prebook'),
            idButton: 'application_prebook_prebookButton',
            type: 'button',
            handlerContext: null,
            handler: this.callToPreBook.bind(this),
            standardButton: true
        };
        json.elements.push(auxPrebook);
        this.ButtonPrebook = new megaButtonDisplayer(json);
        this.virtualHtml.down('[id=application_prebook_bottom]').insert(this.ButtonPrebook.getButtons());
        // if (Object.isEmpty(this.populationName)) {
        //     this.virtualHtml.down('[id=preBook_application_entryData]').hide();
        //     this.virtualHtml.down('[id=preBook_application_mass_entry]').update(global.name);
        // }
        // else {
        this.virtualHtml.down('[id=preBook_application_mass_entry]').hide();
        var allEmployees = this.getPopulation();
        var json = { autocompleter: { object: $A()} };
        for (var i = 0; i < allEmployees.length; i++) {
            json.autocompleter.object.push({
                data: allEmployees[i].objectId,
                text: allEmployees[i].name
            });
        }

        this.preBookMultiSelect = new MultiSelect('preBook_application_entryData', { autocompleter: { showEverythingOnButtonClick: true,
            timeout: 5000,
            templateResult: '#{text}',
            maxShown: 5,
            minChars: 1
        },
            events: $H({ onRemoveBox: 'EWS:preBook_removeBox' })
        }, json);
        this.isManager = 'X';
        //this.leftMenuToMultiSelect(this.preBookMultiSelect);
        //}
        var employeesIndex = $A();
        for (var i = 0; i < allEmployees.length; i++) {
            for (var j = 0; j < this.selectedEmployees.length; j++) {
                if (allEmployees[i].objectId == this.selectedEmployees[j])
                    employeesIndex.push(i);
            }
        }
        this.preBookMultiSelect.addBoxes(employeesIndex);
        this._checkSelectedEmployees();
        // DatePickers definition
        this.begDate = Date.today();
        // begDateAux is to fixing the problem with date limits
        var begDateAux = this.begDate.clone();
        begDateAux = begDateAux.toString('yyyyMMdd');
        this.begDatePicker = new DatePicker('application_prebook_dpFrom', {
            defaultDate: begDateAux,
            draggable: true,
            manualDateInsertion: true,
            events: $H({ 'correctDateOnBlur': 'EWS:datepicker_CorrectDate'})
        });

        //}
    },
    /*
    * @method changeDatePickers
    * @param args {Object} Information about the datepicker and its new date
    * @desc Changes a datepicker's parameters
    * @return void
    */
    changeDatePickers: function(ar) {
//        var args = getArgs(ar);
        this.begDate = this.begDatePicker.actualDate;
//        if (!Object.isEmpty(begDate))
//            begDate.clearTime();
//        var changed = false;
//        if (args.id.id == "application_prebook_dpFrom") {
//            if (Object.isEmpty(begDate)) {
//                this.correctBegDatePicker = false;
//            }
//            changed = true;
//        }
    },
    /*
    * @method checkButton
    * @desc Looks if there are correct parameters in the form and enables/disables
    *       the 'Prebook' button
    * @return void
    */
    _checkSelectedEmployees: function() {
        if (this.preBookMultiSelect.getSelected().length == 0) {
            this.ButtonPrebook.disable('application_prebook_prebookButton');
            return false;
        }
        else
            this.ButtonPrebook.enable('application_prebook_prebookButton');
    },

    callToPreBook: function() {
        this.comment = this.virtualHtml.down('[id=application_prebook_commentInput]').value;
        //for each EE with prebook available, we get call the prebook service.
        var auxBegda = this.begDate.toString(global.dateFormat);
        var begda = Date.parse(auxBegda, "dd.MM.yyyy").toString('yyyy-MM-dd');
        this.xmlCreatePrebook = "<EWS>"
                                    + "<SERVICE>" + this.createPrebooking + "</SERVICE>"
                                    + "<OBJECT TYPE='D'>" + this.trainingId + "</OBJECT>"
                                    + "<PARAM>"
                                    + "<I_APPID>"+this.options.appId+"</I_APPID>"
                                    + "<I_COMMENT yycom='" + this.comment + "'></I_COMMENT>"
                                    + "<I_DATE>" + begda + "</I_DATE>"
                                    + "<O_TABLE_PERNR>";

        for (var i = 0; i < this.preBookMultiSelect.getSelected().length; i++) {
            this.xmlCreatePrebook += "<YGLUI_TAB_PERNR PERNR='" + this.preBookMultiSelect.getSelected()[i]._object.data + "' />";
        }
        this.xmlCreatePrebook += "</O_TABLE_PERNR>"
                            + "</PARAM>"
                            + "</EWS>";
        this.makeAJAXrequest($H({ xml: this.xmlCreatePrebook, successMethod: 'prebookCreated' }));

    },

    prebookCreated: function(req) {
        var status = "<div id='application_book_contain_status'>"
                    + "<h2 id='application_book_status_title' class='application_book_status'>" + global.getLabel('status') + "</h2>";
        var pernrTable = objectToArray(req.EWS.o_table_pernr.yglui_tab_pernr);
        var pernrNames = objectToArray(req.EWS.o_pernr_name.yglui_str_popul_obj);
        if (Object.isEmpty(req.EWS.o_message)) {
            for (var j = 0; j < pernrTable.size(); j++) {
                var pernr = pernrTable[j]['@pernr'];
                var namepernr = pernrNames[j]['@name'];
                status += "<div class='application_book_status_line'><div class='application_icon_green align_application_book_icons'></div><div class='application_book_status_pernr'>" +namepernr+' ['+ pernr +']'+ "</div><div class='application_book_status_label'>" + global.getLabel('statusPreOk') + "</div></div>";
            }
        }
        else {
            var message = objectToArray(req.EWS.o_message.yglui_tab_message);
            var namepernr ='';
            for (var j = 0; j < pernrTable.size(); j++) {
                var pernr = pernrTable[j]['@pernr'];
                var warningIcon = false;
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
                            var cssClass = type == 'E' ? 'application_icon_red' :'application_icon_orange';
                            var error = message[i]['@message'];
                            var label = type == 'E' ? global.getLabel('statusPreError') : global.getLabel('statusPreOk');
                            if (type == 'E' || (type == 'W' && !warningIcon)) {
                                status += "<div class='application_book_status_line'><div class='" + cssClass + " align_application_book_icons'></div><div class='application_book_status_pernr'>" +namepernr+' ['+ employee +']'+ "</div><div class='application_book_status_label'>" + label + "</div><div></div><div class='application_book_status_error_message'>" + error + "</div></div>";
                                warningIcon = true;
                            } else if (warningIcon) {
                                status += "<div class='application_book_status_line'><div class='application_book_status_error_message'>" + error + "</div></div>";
                        }
                        }
                        else if(type == 'S'){
                            status += "<div class='application_book_status_line'><div class='application_icon_green align_application_book_icons'></div><div class='application_book_status_pernr'>"+namepernr+' [' + employee +']'+  "</div><div class='application_book_status_label'>" + global.getLabel('statusPreOk') + "</div></div>";
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
        //take button options from req
        tarap = req.EWS.o_buttons.yglui_str_wid_button['@tarap'];
        tabId = req.EWS.o_buttons.yglui_str_wid_button['@tartb'];
        views = req.EWS.o_buttons.yglui_str_wid_button['@views'];                           
        var callBack = function() {
            global.open($H({
                app: {
                   appId: tarap,
                   tabId: tabId,
                   view: views
                }
            }));
            preBookPopUp.close();
            delete preBookPopUp;
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
        var preBookPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    preBookPopUp.close();
                    delete preBookPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 600
        });
        preBookPopUp.create();
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
        document.stopObserving('EWS:datepicker_CorrectDate', this.changeDatePickersHandlerBinding);
        //document.stopObserving('EWS:datepicker_WrongDate', this.changeDatePickersHandlerBinding);

    }

});