/**
 *@fileoverview payslip.js
 *@description Here there is the class PAY. This class models payslip form. It allows the user 
 * to select the year and payroll period, and then displays the payslip in pfd formt in IFRAME
 */
 
 /**
 *@constructor
 *@description Class PAY, gives a PDF with the payslip.
 *@augments Application 
*/
var PAY = Class.create(Application,
/** 
*@lends PAY
*/
{
/*** SERVICES ***/
/** 
* Service used to show the payslip associated to the date selected
* @type String
*/
getFormPayslip: "GET_PAYSLP_FRM",
/** 
* Service used to get the list of payslips
* @type String
*/
getRangePayslip: "GET_PAYSLP_LST",
/** 
* Service used to get a payslip
* @type String
*/
accessPayslip: "GET_PAYSLIP",
/** 
* Service array when we save all dates we get for a user
* @type Array
*/

/*** VARIABLES ***/

/** 
* Hash when we save all dates we get for a user
* @type Hash
*/
hashOfDates: null,
/** 
* div that contain the main screen
* @type DOM element
*/
PayslipContainer: null,
/** 
* div that contain datePickers
* @type DOM element
*/
payslipDatePickers: null,
/** 
* div that contain firt datePicker
* @type DOM element
*/
payslipBegDate: null,
/** 
* div that contain the second datePicker
* @type DOM element
*/

payslipEndDate: null,
/** 
* datePicker to get the begin date
* @type datePicker
*/
dpPayslipBegDate: null,
/** 
* datePicker to get the end date
* @type datePicker
*/
dpPayslipEndDate: null,
/** 
* url to get the iframe
* @type String
*/
url: "",
/** 
* it tells us if there is some payslip between the selected dates for the selected user
* @type boolean
*/
payslipFound: false,
/** 
* it tells us if there is some payslip  for the selected user
* @type boolean
*/
payslipFoundUser: false,
/**
* @method changeDatePickers
*@param $super The superclass (Application)
*@description Creates the html structure calling a SAP service
*/
initialize: function($super, args) {
    //get the name of the app
    $super(args);
    this.hashOfDates = $H();
    this.clickOnSelectedDatesBinding = this.clickOnSelectedDates.bindAsEventListener(this);
},
/**
* @method run
*@param $super: the superclass: Application
*@description When the user clicks on "payslip" tag, call to the service to load the years.
*/
run: function($super) {
    //call to run method of the superclass        
    $super();
    if (this.firstRun) {
        this.createrHtml();
    }
    document.observe("EWS:payslip_CorrectDate", this.clickOnSelectedDatesBinding);
},
/**
* @method close
*@param $super: the superclass: Application
*/
close: function($super) {
    $super();
    document.stopObserving("EWS:payslip_CorrectDate", this.clickOnSelectedDatesBinding);
},
/**
* @method createrHtml
*@description Creates the html structure of the application
*/
createrHtml: function() {
    this.payslipDatePickers = new Element('div', {
        'class': 'payslip_datePickersDiv',
        'id': 'pay_datePickers'
    });
    this.virtualHtml.insert(this.payslipDatePickers);
    this.payslipBegDate = new Element('div', {
        'class': 'payslip_BegDatePickerDiv',
        'id': 'pay_BegDatePicker'
    });
    this.payslipDatePickers.insert(
            "<div class='payslipSpanDP'>" + global.getLabel('from') + "</div>"
        );
    this.payslipDatePickers.insert(this.payslipBegDate);
    this.payslipEndDate = new Element('div', {
        'class': 'payslip_EndDatePickerDiv',
        'id': 'pay_EndDatePicker'
    });
    this.payslipDatePickers.insert(
            "<div class='payslipSpanDP payslipSpanDPSecond'>" + global.getLabel('to') + "</div>"
        );
    this.payslipDatePickers.insert(this.payslipEndDate);
    //        // Refresh button
    //        this.payslipRefreshButton = new Element('div', {
    //            'id': 'pay_divRefreshButton'  
    //        });
    //        this.virtualHtml.insert(this.payslipRefreshButton);
    //        var json = {
    //            elements:[]
    //        };
    //        var aux =   {
    //            idButton:'pay_refreshButton',
    //            label: global.getLabel('refresh'),
    //            handlerContext: null,
    //            handler: "",
    //            type: 'button',
    //            standardButton: true
    //        };
    //        json.elements.push(aux);
    //        var refreshButton = new megaButtonDisplayer(json);
    //        this.virtualHtml.down('[id=pay_divRefreshButton]').insert(refreshButton.getButtons());
    // Date picker initialization
    var dateBegin = Date.today().toString('yyyy-MM-dd').split('-')[0] + "0101";
    var dateEnd = Date.today().toString('yyyy-MM-dd').split('-')[0] + "1231";
    this.dpPayslipBegDate = new DatePicker('pay_BegDatePicker', {
        defaultDate: dateBegin,
        draggable: true,
        manualDateInsertion: false,
        events: $H({ correctDate: 'EWS:payslip_CorrectDate' })
    });
    this.dpPayslipEndDate = new DatePicker('pay_EndDatePicker', {
        defaultDate: dateEnd,
        draggable: true,
        manualDateInsertion: false,
        events: $H({ correctDate: 'EWS:payslip_CorrectDate' })
    });
    this.dpPayslipBegDate.linkCalendar(this.dpPayslipEndDate);
    this.virtualHtml.insert(
            "<div id='payslip_titleDate' class='payslipPayDate application_main_soft_text'>" + global.getLabel('payDate') + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>" +
            "<div id='PAY_outer' class='payslip_listDates'></div>" +

			"<div id='W2_titleDate' class='payslipPayDate application_main_soft_text'>" + global.getLabel('W2Forms') + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>" +
            "<div id='W2_outer' class='payslip_listDates'></div>" +

            "<div id='payslip_titleOfPayslip'></div>" +
            "<div id='PAY_textLoading'></div>" +
            "<div id='PAY_iframe' class='payslip_iframe'></div>");
    this.virtualHtml.down('div#payslip_titleDate').hide();
    this.virtualHtml.down('div#W2_titleDate').hide();
},
/**
* @method callToGetListOfPayslip
*@description calls the service to get all payslips for an user
*/
callToGetListOfPayslip: function() {
    var pernr = !Object.isEmpty(this.leftMenuId) ? this.leftMenuId : this.empId;
    var xmlToGetPayslips = "<EWS>" +
                                    "<SERVICE>" + this.getRangePayslip + "</SERVICE>" +
                                    '<OBJECT TYPE="P">' + pernr + '</OBJECT>' +
                                    "<PARAM></PARAM>" +
                           "</EWS>";
    this.makeAJAXrequest($H({ xml: xmlToGetPayslips, successMethod: 'getListOfPayslip' }));
},
/**
* @method getListOfPayslip
*@param json: json Object with the dates from sap
*@description we test if the dates are between dates in date pickers
*/
getListOfPayslip: function(json) {
    this.virtualHtml.down('div#PAY_outer').update();
    this.virtualHtml.down('div#W2_outer').update();
    Element.hide('payslip_titleOfPayslip');
    Element.hide('PAY_iframe');
    var html = "";
    var title1 = '';
    var title2 = '';
    var j = 0;
    try {
        if (!Object.isEmpty(json.EWS) && !Object.isEmpty(json.EWS.o_payslip_list) && !Object.isEmpty(json.EWS.o_payslip_list.yglui_str_payslip_list)) {
            this.payslipFoundUser = true;
            var listOfDates = objectToArray(json.EWS.o_payslip_list.yglui_str_payslip_list);
            var parsedBegDate = this.dpPayslipBegDate.actualDate;
            var parsedEndDate = this.dpPayslipEndDate.actualDate;
            var documentType = '';
            for (var i = 0; i < listOfDates.length; i++) {
                // new payslip from RL
                if (!Object.isUndefined(listOfDates[i]['@document_type']) && !Object.isEmpty(listOfDates[i]['@document_type'])) {
                    documentType = listOfDates[i]['@document_type'];
                } else {
                    documentType = 'payslip';
                }

                if (documentType.toUpperCase() == 'PAYSLIP') {
                    //title1 = documentType;
                    title1 = global.getLabel('payslip');
                } else {
                    //title2 = documentType;
                    title2 = global.getLabel('payslip');
                }

                if (!Object.isEmpty(listOfDates[i]['@offcy']) && listOfDates[i]['@offcy'] == 'X') {
                    var idOffCicle = 'payslip_' + listOfDates[i]['@paydt'] + '_' + j;
                    this.hashOfDates.set(listOfDates[i]['@paydt'] + "_" + j, { offcy: listOfDates[i]['@offcy'], pabrj: listOfDates[i]['@pabrj'], pabrp: listOfDates[i]['@pabrp'], offCycle: true, payid: listOfDates[i]['@payid'], docType: documentType, ocrtx: listOfDates[i]['@ocrtx'], inpid: listOfDates[i]['@inpid'] });
                    j++;
                }
                else
                    this.hashOfDates.set(listOfDates[i]['@paydt'], { offcy: listOfDates[i]['@offcy'], pabrj: listOfDates[i]['@pabrj'], pabrp: listOfDates[i]['@pabrp'], offCycle: false, payid: listOfDates[i]['@payid'], docType: documentType, inpid: listOfDates[i]['@inpid'] });

                if (Date.parseExact(listOfDates[i]['@paydt'].gsub('-', ""), "yyyyMMdd").between(parsedBegDate, parsedEndDate)) {
                    this.payslipFound = true;
                    if (listOfDates[i]['@offcy'] == 'X') {
                        if (listOfDates[i]['@inpid'] == '') {
                            html = "<div class='payslip_listDates'><span id=" + idOffCicle + " class='application_action_link'>" + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat) + "</span><span class='payslip_colorNoLinkBlue application_text_bolder'>&nbsp;(" + global.getLabel('offCycle') + " - " + listOfDates[i]['@ocrtx'] + ")</span></div>";
                        }
                        else {
                            html = "<div class='payslip_listDates'><span id=" + idOffCicle + " class='application_action_link'>" + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat) + "</span><span class='payslip_colorNoLinkBlue application_text_bolder'>&nbsp;(" + global.getLabel('offCycle') + " - " + listOfDates[i]['@ocrtx'] + ") (" + listOfDates[i]['@inpid'] + ")</span></div>";
                        }
                    }
                    else {
                        //                        Commented because we want to show dates in all cases (ticket 1043250)
                        //                        // new payslip from RL
                        //                        if (!Object.isEmpty(listOfDates[i]['@document_type'])) {
                        //                            html = "<div class='payslip_listDates'><span id='payslip_" + listOfDates[i]['@paydt'] + "' class='application_action_link'>" + listOfDates[i]['@pabrj'] + '-' + listOfDates[i]['@pabrp'] + "</span></div>";
                        //                        } else {
                        //                            //
                        //                            html = "<div class='payslip_listDates'><span id='payslip_" + listOfDates[i]['@paydt'] + "' class='application_action_link'>" + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat) + "</span></div>";
                        //                        }
                        html = "<div class='payslip_listDates'><span id='payslip_" + listOfDates[i]['@paydt'] + "' class='application_action_link'>" + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat) + "</span></div>";
                    }

                    if (documentType.toUpperCase() == 'PAYSLIP') {
                        this.virtualHtml.down('div#PAY_outer').insert(html);
                        html = "";
                    } else {
                        this.virtualHtml.down('div#W2_outer').insert(html);
                        html = "";
                    }
                }

                this.virtualHtml.down('div#payslip_titleDate').update(title1);
                this.virtualHtml.down('div#W2_titleDate').update(title2);
                if (this.payslipFound) {
                    this.virtualHtml.down('div#payslip_titleDate').show();
                    this.virtualHtml.down('div#W2_titleDate').show();
                }

            }
            //				this.virtualHtml.down('div#PAY_outer').insert(html); 
        } else {
            this.payslipFoundUser = false;
        }
    } catch (e) { }
    //        if(html==""){
    //				this.virtualHtml.down('div#PAY_outer').update("<span class='payslip_noPayslip application_main_error_text'>"+global.getLabel('noPayslip')+"</span>"); 
    //              this.virtualHtml.down('div#payslip_titleDate').hide();
    //        }
    if (this.virtualHtml.down('div#PAY_outer').childElements().size() == 0) {
        this.virtualHtml.down('div#payslip_titleDate').hide();
    } else {
        this.virtualHtml.down('div#PAY_outer').observe('click', this.clickOnDateShowPayslip.bind(this));
    }
    if (this.virtualHtml.down('div#W2_outer').childElements().size() == 0) {
        this.virtualHtml.down('div#W2_titleDate').hide();
    } else {
        this.virtualHtml.down('div#W2_outer').observe('click', this.clickOnDateShowPayslip.bind(this));
    }

    if (this.virtualHtml.down('div#PAY_outer').childElements().size() == 0 &&
			this.virtualHtml.down('div#W2_outer').childElements().size() == 0) {
        this.virtualHtml.down('div#PAY_outer').update("<span class='payslip_noPayslip application_main_error_text'>" + global.getLabel('noPayslip') + "</span>");
    }



},

/**
*@method clickOnSelectedDates
*@description called when we select a date from the dqatePickers
*/
clickOnSelectedDates: function(event) {
    Element.hide('payslip_titleOfPayslip');
    if (this.payslipFoundUser) {
        var html = "";
        if (getArgs(event).id == 'pay_BegDatePicker') {
            var date = this.dpPayslipBegDate.getDateAsArray();
            //var monthOfTwoDigits=(getArgs(event).month).toPaddedString(2);
            var newBegDate = Date.today().set({ day: parseInt(date.day), month: parseInt(date.month) - 1, year: parseInt(date.year) }).toString('yyyy.MM.dd');
            var newEndDate = this.dpPayslipEndDate.actualDate.toString('yyyy.MM.dd');
        }
        else {
            var date = this.dpPayslipEndDate.getDateAsArray();
            var newBegDate = this.dpPayslipBegDate.actualDate.toString('yyyy.MM.dd');
            var newEndDate = Date.today().set({ day: parseInt(date.day), month: parseInt(date.month) - 1, year: parseInt(date.year) }).toString('yyyy.MM.dd');
        }
        var parsedBegDate = Date.parseExact(newBegDate.gsub('.', ""), "yyyyMMdd");
        var parsedEndDate = Date.parseExact(newEndDate.gsub('.', ""), "yyyyMMdd");
        var keysOfPayslip = new Array();
        keysOfPayslip = this.hashOfDates.keys();
        this.virtualHtml.down('div#PAY_outer').update();
        this.virtualHtml.down('div#W2_outer').update();
        this.hashOfDates.each(function(pair) {
            if ((pair.key.split('_')).length > 1)
                var dateOfPayslip = pair.key.split('_')[0];
            else
                var dateOfPayslip = pair.key;
            var datetoCompare = Date.parseExact(dateOfPayslip.gsub('-', ""), "yyyyMMdd");
            if (datetoCompare.between(parsedBegDate, parsedEndDate)) {
                if (pair.value.offCycle) {
                    if ((pair.value.payid != '') && (pair.value.payid != '0') && (pair.value.payid != null)) {
                        html += "<div class='payslip_listDates'><span id='payslip_" + pair.key + "' class='application_action_link'>" + Date.parseExact(dateOfPayslip, "yyyy-MM-dd").toString(global.dateFormat) + "</span><span class='payslip_colorNoLinkBlue application_text_bolder'>&nbsp;(" + global.getLabel('offCycle') + " - " + pair.value.ocrtx + ") (" + pair.value.inpid + ")</span></div>";
                    }
                    else {
                        html += "<div class='payslip_listDates'><span id='payslip_" + pair.key + "' class='application_action_link'>" + Date.parseExact(dateOfPayslip, "yyyy-MM-dd").toString(global.dateFormat) + "</span><span class='payslip_colorNoLinkBlue application_text_bolder'>&nbsp;(" + global.getLabel('offCycle') + " - " + pair.value.ocrtx + ")</span></div>";
                    }
                }
                else {
                    // new payslip from RL
                    if (!Object.isEmpty(pair.value.docType)) {
                        //html = "<div class='payslip_listDates'><span id='payslip_" + pair.key + "' class='application_action_link'>" + pair.value.pabrj + '-' + pair.value.pabrp + "</span></div>";                    
                        html = "<div class='payslip_listDates'><span id='payslip_" + pair.key + "' class='application_action_link'>" + Date.parseExact(pair[0], "yyyy-MM-dd").toString(global.dateFormat) + "</span></div>";
                    } else {
                        html = "<div class='payslip_listDates'><span id='payslip_" + pair.key + "' class='application_action_link'>" + Date.parseExact(pair.value.paydt, "yyyy-MM-dd").toString(global.dateFormat) + "</span></div>";
                    }
                }
                if (pair.value.docType.toUpperCase() == 'PAYSLIP') {
                    this.virtualHtml.down('div#PAY_outer').insert(html);
                    html = "";
                } else {
                    this.virtualHtml.down('div#W2_outer').insert(html);
                    html = "";
                }
                //                    html+="<div class='payslip_listDates'><span id='payslip_"+pair.key+"' class='application_action_link'>"+Date.parseExact(dateOfPayslip, "yyyy-MM-dd").toString(global.dateFormat)+"</span></div>";          
                //               this.virtualHtml.down('div#payslip_titleDate').show();

            }
        } .bind(this));
        //        this.virtualHtml.down('div#PAY_outer').update(html);
        //        if(html==""){

        //                this.virtualHtml.down('div#PAY_outer').update("<span class='payslip_noPayslip application_main_error_text'>"+global.getLabel('noPayslip')+"</span>");     
        //                this.virtualHtml.down('div#payslip_titleDate').hide();
        //        }     
        if (this.virtualHtml.down('div#PAY_outer').childElements().size() == 0) {
            this.virtualHtml.down('div#payslip_titleDate').hide();
        } else {
            this.virtualHtml.down('div#PAY_outer').observe('click', this.clickOnDateShowPayslip.bind(this));
        }
        if (this.virtualHtml.down('div#W2_outer').childElements().size() == 0) {
            this.virtualHtml.down('div#W2_titleDate').hide();
        } else {
            this.virtualHtml.down('div#W2_outer').observe('click', this.clickOnDateShowPayslip.bind(this));
        }

        if (this.virtualHtml.down('div#PAY_outer').childElements().size() == 0 &&
			    this.virtualHtml.down('div#W2_outer').childElements().size() == 0) {
            this.payslipFound = false;
            this.virtualHtml.down('div#PAY_outer').update("<span class='payslip_noPayslip application_main_error_text'>" + global.getLabel('noPayslip') + "</span>");
            this.virtualHtml.down('div#payslip_titleDate').hide();
        } else {
            this.virtualHtml.down('div#payslip_titleDate').show();
            this.payslipFound = true;
        }

    }
    this.virtualHtml.down('div#PAY_iframe').hide();
},
/**
* @method clickOnDateShowPayslip
*@param event: date selected from the list of payslips
*@description show the payslip associated to the date selected
*/
clickOnDateShowPayslip: function(event) {
    var idOfLinkSelected = event.element().identify();
    var splitOfId = idOfLinkSelected.split('_');
    var idOfLinkSelected = (splitOfId[2]) ? splitOfId[1] + "_" + splitOfId[2] : splitOfId[1];
    var dateOfLinkSelected = splitOfId[1];
    var valuesDateInHash = this.hashOfDates.get(idOfLinkSelected);
    var pabrj = this.hashOfDates.get(idOfLinkSelected).pabrj;
    var pabrp = this.hashOfDates.get(idOfLinkSelected).pabrp;
    // new payslip from RL
    var payid = this.hashOfDates.get(idOfLinkSelected).payid;
    if (payid == null) payid = '';
    var inpid = this.hashOfDates.get(idOfLinkSelected).inpid;
    if (inpid == null) inpid = '';
    //
    var offcy = Object.isEmpty(this.hashOfDates.get(idOfLinkSelected).offcy) ? "" : this.hashOfDates.get(idOfLinkSelected).offcy;
    var html_iframe = "<iframe id='payslip_iframePDF' width='700' height='500' frameborder='1'></iframe>";
    var textLoading = global.getLabel('payOfDate') + " " + Date.parseExact(dateOfLinkSelected, 'yyyy-MM-dd').toString(global.dateFormat);
    this.virtualHtml.down('div#payslip_titleOfPayslip').update("<span class='payslip_textPayslipLoaded application_main_soft_text'>" + textLoading + "</span>");
    this.virtualHtml.down('div#PAY_iframe').update(html_iframe);
    this.virtualHtml.down('div#payslip_titleOfPayslip').show();
    this.virtualHtml.down('div#PAY_iframe').show();
    var pernr = !Object.isEmpty(this.leftMenuId) ? this.leftMenuId : this.empId;
    this.xmlGetPayslip = "<EWS>"
                         + "<SERVICE>" + this.getFormPayslip + "</SERVICE>"
                         + "<PARAM>"
                             + "<I_OBJ>" + pernr + "</I_OBJ>"
                             + "<I_PABRJ>" + pabrj + "</I_PABRJ>"
                             + "<I_PABRP>" + pabrp + "</I_PABRP>"
                             + "<I_PAYDT>" + dateOfLinkSelected + "</I_PAYDT>"
    // New payslip form RL
    //+ "<I_PAYID></I_PAYID>" 
    //
							 + "<I_PAYID>" + payid + "</I_PAYID>"
							 + "<I_INPID>" + inpid + "</I_INPID>"
                             + "<I_OFFCY>" + offcy + "</I_OFFCY>"
                         + "</PARAM></EWS>";
    /*say what you want to do when downloaded*/
    this.virtualHtml.down('iframe#payslip_iframePDF').onreadystatechange = function() { //IE
        if (this.virtualHtml.down('iframe#payslip_iframePDF').readyState == "loaded" || this.virtualHtml.down('iframe#payslip_iframePDF').readyState == "complete") {
            this.virtualHtml.down('div#PAY_textLoading').update('');
        }
    } .bind(this);
    this.virtualHtml.down('iframe#payslip_iframePDF').onload = function() { //FF                
        this.virtualHtml.down('div#PAY_textLoading').update('');
    } .bind(this);
    var url = this.url;
    while (('url' in url.toQueryParams())) { url = url.toQueryParams().url; }
    url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
    /*put the right URL in order to start dowloading*/
    this.virtualHtml.down('iframe#payslip_iframePDF').src = url + this.xmlGetPayslip;
    /*put the loading while doawnloading*/
    this.virtualHtml.down('div#PAY_textLoading').update("<span class='PAY_textLoadingSpan'>" + global.getLabel('loading..') + "</span>");

},

/**
* It handles the employeeSelected event getting needed data to show
* this new employee's events on the payslip
* @param event the info about this employee selection
* @param unselect is true if we want to unselect instead of selecting
*/
onEmployeeSelected: function(args) {
    this.payslipFound = false;
    this.empId = args.id;
    this.callToGetListOfPayslip();
},

onEmployeeUnselected: Prototype.emptyFunction

});