/**
*@fileoverview payslip.js
*@description: ScotiaBank: custom payslip display
* to select the year and payroll period, and then displays the payslip in pfd formt in IFRAME
*/
var PAY = Class.create(PAY,
{

    run: function($super) {
        //call to run method of the superclass        
        $super();
        if (this.firstRun) {
            this.createrHtml();
        }
        if (global.o_language == 'E')
            document.title = "Payslip | Scotiabank";
        else
            document.title = "Afficher fiche de paye | Scotiabank";
        document.observe("EWS:payslip_CorrectDate", this.clickOnSelectedDatesBinding);
    },
    
    createrHtml: function($super) {
        this.createAutoCompleter();
        $super();
        this.payslipDatePickers.hide();
        //Add div to hold the Note of confidentiality. EzequielB April 2013.
        this.virtualHtml.insert("<div id='PAY_Note'></div>");
    },
    //to create the autocompleter for payslip
    createAutoCompleter: function() {
        this.taxformsDatePickers = new Element('div', {
            'class': 'payslip_datePickersDiv',
            'style': 'float:left;width:300px',
            'id': 'tax_datePickers'
        });

        var audiblePayslip = new Element('div', {
            'class': 'payslip_datePickersDiv',
            'style': 'float:right;width:200px',
            'id': 'audiblePayslip'
        })
        this.audiblePayslipCheckbox = new Element('input', {
            'type': 'checkbox',
            'title': global.getLabel('audible_pay'),
            'id': 'audCheckbox'
        })
        audiblePayslip.insert(this.audiblePayslipCheckbox)
        audiblePayslip.insert('<label for="audCheckbox">' + global.getLabel('audible_pay') + '</label>')
        audiblePayslip.hide();
        this.audiblePayslipDiv = audiblePayslip
        this.virtualHtml.insert(this.taxformsDatePickers);
        this.virtualHtml.insert(audiblePayslip);
        this.taxformsDatePickers.insert(
            "<label for='text_area_autocompleterYears' class='payslipSpanDP'>" + global.getLabel('TAX_YEAR') + "</label>"
        );

        //audbile payslip
        this.audiblePayslipCheckboxBinding = this.audiblePayslipCheckboxSelected.bindAsEventListener(this);
        this.audiblePayslipCheckbox.stopObserving('click', this.audiblePayslipCheckboxBinding);
        this.audiblePayslipCheckbox.observe('click', this.audiblePayslipCheckboxBinding);
    },
    createAutocompleterYears: function() {
        var arrayYears = new Array();
        // First you for which taxes are available
        var dateBegin = Date.today().toString('yyyy-MM-dd').split('-')[0];
        this.taxformsDatePickers.insert("<div id=\"autocompleterYears\"></div>");
        //only show the years that contains paylsip.
        for (var i = 0; i < this.hashOfDates.keys().size(); i++) {
            var year = this.hashOfDates.keys()[i].substring(0, 4)
            if ((arrayYears.select(function(item) { if (item.data == year) return true })).size() == 0)
                arrayYears.push({ data: year, text: year })
            if (i == 0) dateBegin = year
        }

        var jsonYears = {
            autocompleter: {
                object: arrayYears
            }
        };

        var text_lab = global.getLabel('TAX_YEAR_S');
        this.autocompleterYears = new JSONAutocompleter('autocompleterYears', {
            events: $H({ onResultSelected: 'EWS:payslipYearSelected' }),
            showEverythingOnButtonClick: false,
            templateOptionsList: '#{text}',
            templateResult: '#{text}',
            label: text_lab,
            width: '250px',
            minChars: 1
        }, jsonYears);
        //setting the default value
        this.autocompleterYears.setDefaultValue(dateBegin, false, false);
        this.payslipYearSelectedBinding = this.payslipYearSelected.bindAsEventListener(this);
        document.stopObserving('EWS:payslipYearSelected', this.payslipYearSelectedBinding);
        document.observe('EWS:payslipYearSelected', this.payslipYearSelectedBinding);
        this.payslipYearSelected(null, dateBegin)
    },
    /**     
    *@param args {Event} event thrown by the autoCompleter when a node has been selected from 
    *its search results list.
    *@description It gets a node context (parent and siblings) from SAP.
    */
    payslipYearSelected: function(args, year) {
        this.payYear = args ? args.memo.idAdded : year;
        var parsedBegDate = Date.parseExact(this.payYear.toString() + '0101', 'yyyyMMdd')
        var parsedEndDate = Date.parseExact(this.payYear.toString() + '1231', 'yyyyMMdd')
        this.getListOfPayslip(this.json, parsedBegDate, parsedEndDate)
    },

    /**     
    *@param args {Event} event thrown by the autoCompleter when a node has been selected from 
    *its search results list.
    *@description It gets a node context (parent and siblings) from SAP.
    */
    audiblePayslipCheckboxSelected: function(args) {
        //do something
        //this.audiblePayslipCheckbox.checked
    },
    getListOfPayslip: function(json, begDate, endDate) {
        this.json = json;
        //show the chexkbox or not
        if (!Object.isEmpty(json.EWS.o_audpay_show))
            this.audiblePayslipDiv.show();

        this.virtualHtml.down('div#PAY_outer').stopObserving('click', this.clickOnDateShowPayslipBinding);
        this.virtualHtml.down('div#W2_outer').stopObserving('click', this.clickOnDateShowPayslipBinding);
        this.virtualHtml.down('div#PAY_outer').update();
        this.virtualHtml.down('div#W2_outer').update();
        Element.hide('payslip_titleOfPayslip');
        Element.hide('PAY_iframe');
        var html = "";
        var title1 = '';
        var title2 = '';
        var j = 0;
        var tablePay;
        var tablePayBody = '<tbody>';
        var gotPayslip = false;
        var count = 0;
        try {
            //scotia bank to output the net amt - yglui_str_payslip_list
            //if (!Object.isEmpty(json.EWS) && !Object.isEmpty(json.EWS.o_payslip_list) && !Object.isEmpty(json.EWS.o_payslip_list.yglui_str_payslip_list)) {
            if (!Object.isEmpty(json.EWS) && !Object.isEmpty(json.EWS.o_payslip_list) && !Object.isEmpty(json.EWS.o_payslip_list.zbns_str_payslip_list)) {
                this.payslipFoundUser = true;
                //scotia bank to output the net amt
                //var listOfDates = objectToArray(json.EWS.o_payslip_list.yglui_str_payslip_list);
                var listOfDates = objectToArray(json.EWS.o_payslip_list.zbns_str_payslip_list);
                var parsedBegDate = begDate ? begDate : this.dpPayslipBegDate.actualDate;
                var parsedEndDate = endDate ? endDate : this.dpPayslipEndDate.actualDate;
                var documentType = '';
                for (var i = 0; i < listOfDates.length; i++) {
                    // new payslip from RL
                    if (!Object.isUndefined(listOfDates[i]['@document_type']) && !Object.isEmpty(listOfDates[i]['@document_type'])) {
                        documentType = listOfDates[i]['@document_type'];
                    } else {
                        documentType = 'payslip';
                    }

                    var idSelect = listOfDates[i]['@paydt'] + "@" + i
                    if (documentType.toUpperCase() == 'PAYSLIP') {
                        //title1 = documentType;
                        title1 = global.getLabel('payslip_for') + ' ' + parsedBegDate.toString('yyyy-MM-dd').split('-')[0]; ;
                    } else {
                        //title2 = documentType;
                        title2 = global.getLabel('payslip_for');
                    }

                    if (!Object.isEmpty(listOfDates[i]['@offcy']) && listOfDates[i]['@offcy'] == 'X') {
                        var idOffCicle = 'payslip_' + idSelect + '_' + j;
                        this.hashOfDates.set(idSelect + "_" + j, { offcy: listOfDates[i]['@offcy'], pabrj: listOfDates[i]['@pabrj'], pabrp: listOfDates[i]['@pabrp'], offCycle: true, payid: listOfDates[i]['@payid'], docType: documentType, ocrtx: listOfDates[i]['@ocrtx'], inpid: listOfDates[i]['@inpid'] });
                        j++;
                    }
                    else
                        this.hashOfDates.set(idSelect, { offcy: listOfDates[i]['@offcy'], pabrj: listOfDates[i]['@pabrj'], pabrp: listOfDates[i]['@pabrp'], offCycle: false, payid: listOfDates[i]['@payid'], docType: documentType, inpid: listOfDates[i]['@inpid'] });
                    //Scotia - creaate table
                    tablePay = new Element('table', { cellspacing: '0', cellpadding: '0', id: 'tablePay', className: 'sortable FWK_EmptyDiv', style: 'float:left;width:50%' });
                    var header = '<thead><tr><th class="table_sortfirstdesc table_sortcol" ><div class="emptyButton sortable" tabindex="0" title="' + global.getLabel('pay_date') + '">' + global.getLabel('pay_date') +
                    '</div></th><th class="table_sortfirstdesc table_sortcol" ><div class="emptyButton sortable" tabindex="0" title="' + global.getLabel('net_amt') + '">' + global.getLabel('net_amt') + '</div></th></tr>'
                    tablePay.insert(header);

                    if (Date.parseExact(listOfDates[i]['@paydt'].gsub('-', ""), "yyyyMMdd").between(parsedBegDate, parsedEndDate)) {
                        this.payslipFound = true;
                        if (listOfDates[i]['@offcy'] == 'X') {
                            if (listOfDates[i]['@inpid'] == '') {
                                gotPayslip = true;
                                html = "<tr class='#{text}'><td><div class=''><button tabindex='0' id=" + idOffCicle + " class='application_action_link' title='" + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat) + "'>"
                                            + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat)
                                            + "</button></div></td><td><div class='emptyButton sortable' title='" + longToDisplay(parseFloat(listOfDates[i]['@betrg'], 10), 2) + "'>"
                                            + longToDisplay(parseFloat(listOfDates[i]['@betrg'], 10), 2) + "</div></td></tr>";
                                //removed the offcycle
                                //                                html = "<tr class='#{text}'><td><div class=''><button id=" + idOffCicle + " class='application_action_link'>"
                                //                                            + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat)
                                //                                            + "</button><span class='payslip_colorNoLinkBlue application_text_bolder'>&nbsp;("
                                //                                            + global.getLabel('offCycle') + " - " + listOfDates[i]['@ocrtx'] + ")</span></div></td><td><button class='emptyButton sortable' title='" + longToDisplay(parseFloat(listOfDates[i]['@betrg'], 10), 2) + "'>"
                                //                                            + longToDisplay(parseFloat(listOfDates[i]['@betrg'], 10), 2) + "</button></td></tr>";

                            }
                            else {
                                gotPayslip = true;
                                html = "<tr class='#{text}'><td><div class=''><button  tabindex='0' id=" + idOffCicle
                                + " class='application_action_link' title='" + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat) + "'>" + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat)
                                + "</button></div></td><td><div class='emptyButton sortable' title='" + longToDisplay(parseFloat(listOfDates[i]['@betrg'], 10), 2) + "'>"
                                + longToDisplay(parseFloat(listOfDates[i]['@betrg'], 10), 2) + "</div></td></tr>";
                                //removed the offcycle
                                //                                html = "<tr class='#{text}'><td><div class=''><button id=" + idOffCicle
                                //                                + " class='application_action_link'>" + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat)
                                //                                + "</button><span class='payslip_colorNoLinkBlue application_text_bolder'>&nbsp;(" + global.getLabel('offCycle') + " - "
                                //                                + listOfDates[i]['@ocrtx'] + ") (" + listOfDates[i]['@inpid'] + ")</span></div></td><td><button class='emptyButton sortable' title='" + longToDisplay(parseFloat(listOfDates[i]['@betrg'], 10), 2) + "'>"
                                //                                + longToDisplay(parseFloat(listOfDates[i]['@betrg'], 10), 2) + "</button></td></tr>";
                            }
                        }
                        else {
                            //                        Commented because we want to show dates in all cases (ticket 1043250)
                            //                        // new payslip from RL
                            //                        if (!Object.isEmpty(listOfDates[i]['@document_type'])) {
                            //                            html = "<div class=''><span id='payslip_" + listOfDates[i]['@paydt'] + "' class='application_action_link'>" + listOfDates[i]['@pabrj'] + '-' + listOfDates[i]['@pabrp'] + "</span></div>";
                            //                        } else {
                            //                            //
                            //                            html = "<div class=''><span id='payslip_" + listOfDates[i]['@paydt'] + "' class='application_action_link'>" + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat) + "</span></div>";
                            //                        }
                            gotPayslip = true;
                            html = "<tr class='#{text}'><td><div class=''><button tabindex='0' id='payslip_" + idSelect
                            + "' class='application_action_link' title='" + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat) + "'>" + Date.parseExact(listOfDates[i]['@paydt'], "yyyy-MM-dd").toString(global.dateFormat)
                            + "</button></div></td><td><div  class='emptyButton sortable' title='" + longToDisplay(parseFloat(listOfDates[i]['@betrg'], 10), 2) + "'>" + longToDisplay(parseFloat(listOfDates[i]['@betrg'], 10), 2) + "</div></td></tr>";
                        }

                        if (documentType.toUpperCase() == 'PAYSLIP') {
                            //this.virtualHtml.down('div#PAY_outer').insert(html);
                            var css = (count % 2 == 0 ? 'table_roweven' : 'table_rowodd');
                            tablePayBody += html.gsub('#{text}', css)
                            count++;
                            html = "";
                        } else {
                            this.virtualHtml.down('div#W2_outer').insert(html);
                            html = "";
                        }
                    }
                    //JAWS compliant
                    //                    title1 = "<button class='emptyButton softTextLoaded' title='" + title1 + "'>" + title1 + "</button>"
                    //                    title2 = "<button class='emptyButton softTextLoaded' title='" + title2 + "'>" + title2 + "</button>"
                    //                    this.virtualHtml.down('div#payslip_titleDate').update(title1);
                    //                    this.virtualHtml.down('div#W2_titleDate').update(title2);
                    //                    if (this.payslipFound) {
                    //                        this.virtualHtml.down('div#payslip_titleDate').show();
                    //                        this.virtualHtml.down('div#W2_titleDate').show();
                    //                    }

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
        if (gotPayslip) {
            this.virtualHtml.down('div#PAY_outer').insert(tablePay);
            tablePayBody += '</tbody>'
            tablePay.insert(tablePayBody)
            //            this.tablePayObject = new tableKitWithSearch(this.virtualHtml.down('table#tablePay'), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
        }

        this.clickOnDateShowPayslipBinding = this.clickOnDateShowPayslip.bindAsEventListener(this);
        if (this.virtualHtml.down('div#PAY_outer').childElements().size() == 0) {
            this.virtualHtml.down('div#payslip_titleDate').hide();
        } else {
            this.virtualHtml.down('div#PAY_outer').observe('click', this.clickOnDateShowPayslipBinding);
        }
        if (this.virtualHtml.down('div#W2_outer').childElements().size() == 0) {
            this.virtualHtml.down('div#W2_titleDate').hide();
        } else {
            this.virtualHtml.down('div#W2_outer').observe('click', this.clickOnDateShowPayslipBinding);
        }

        if (this.virtualHtml.down('div#PAY_outer').childElements().size() == 0 &&
			this.virtualHtml.down('div#W2_outer').childElements().size() == 0) {
            this.virtualHtml.down('div#PAY_outer').update("<span class='payslip_noPayslip application_main_error_text'>" + global.getLabel('noPayslip') + "</span>");
        }
        if (Object.isEmpty(this.autocompleterYears)) {
            this.createAutocompleterYears();
        }
    },

    //to prevent error on click
    clickOnDateShowPayslip: function($super, event) {
        var idOfLinkSelected = event.element().identify();
        var splitOfId = idOfLinkSelected.split('_');
        if (Object.isEmpty(splitOfId)) return;
        var idOfLinkSelected = (splitOfId[2]) ? splitOfId[1] + "_" + splitOfId[2] : splitOfId[1];
        var dateOfLinkSelected = splitOfId[1];
        var valuesDateInHash = this.hashOfDates.get(idOfLinkSelected);
        if (!Object.isEmpty(this.hashOfDates.get(idOfLinkSelected))) {
            //$super(event)
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
            if (dateOfLinkSelected.include('@')) dateOfLinkSelected = (dateOfLinkSelected.split('@'))[0]
            var offcy = Object.isEmpty(this.hashOfDates.get(idOfLinkSelected).offcy) ? "" : this.hashOfDates.get(idOfLinkSelected).offcy;
            var html_iframe = "<iframe id='payslip_iframePDF' width='700' height='500' frameborder='1'></iframe>";
            var textLoading = global.getLabel('payOfDate') + " " + Date.parseExact(dateOfLinkSelected, 'yyyy-MM-dd').toString(global.dateFormat);
            this.virtualHtml.down('div#payslip_titleOfPayslip').update("<span class='payslip_textPayslipLoaded application_main_soft_text'>" + textLoading + "</span>");
            //this.virtualHtml.down('div#PAY_iframe').update(html_iframe);
            this.virtualHtml.down('div#payslip_titleOfPayslip').show();
            //this.virtualHtml.down('div#PAY_iframe').show();
            var pernr = !Object.isEmpty(this.leftMenuId) ? this.leftMenuId : this.empId;
            this.xmlGetPayslip = "<EWS>"
                         + "<SERVICE>" + this.getFormPayslip + "</SERVICE>"
                         + "<PARAM>"
                             + "<I_OBJ>" + pernr + "</I_OBJ>"
                             + "<I_PABRJ>" + pabrj + "</I_PABRJ>"
                             + "<I_PABRP>" + pabrp + "</I_PABRP>"
                             + "<I_PAYDT>" + dateOfLinkSelected + "</I_PAYDT>"
            //Scotia: 
                            + "<I_AUDIBLE>" + (this.audiblePayslipCheckbox.checked ? 'X' : '') + "</I_AUDIBLE>"
            // New payslip form RL
            //+ "<I_PAYID></I_PAYID>" 
            //
							 + "<I_PAYID>" + payid + "</I_PAYID>"
							 + "<I_INPID>" + inpid + "</I_INPID>"
                             + "<I_OFFCY>" + offcy + "</I_OFFCY>"
                         + "</PARAM></EWS>";
            /*say what you want to do when downloaded*/
            /*
            this.virtualHtml.down('iframe#payslip_iframePDF').onreadystatechange = function () { //IE
            if (this.virtualHtml.down('iframe#payslip_iframePDF').readyState == "loaded" || this.virtualHtml.down('iframe#payslip_iframePDF').readyState == "complete") {
            this.virtualHtml.down('div#PAY_textLoading').update('');
            }
            } .bind(this);
            this.virtualHtml.down('iframe#payslip_iframePDF').onload = function () { //FF                
            this.virtualHtml.down('div#PAY_textLoading').update('');
            } .bind(this);
            */
            var url = this.url;
            while (('url' in url.toQueryParams())) { url = url.toQueryParams().url; }
            url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
            window.open(url + this.xmlGetPayslip);
            //CR 20130117: open payslip in popup
            /*put the right URL in order to start dowloading*/
            //this.virtualHtml.down('iframe#payslip_iframePDF').src = url + this.xmlGetPayslip;
            /*put the loading while doawnloading*/
            //this.virtualHtml.down('div#PAY_textLoading').update("<span class='PAY_textLoadingSpan'>" + global.getLabel('loading..') + "</span>");

        }
    }

});