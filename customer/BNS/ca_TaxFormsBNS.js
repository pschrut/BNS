/**
*@fileoverview CA_taxForms.js
*@description Here there is the class YCA_TAXF. This class models end year taxes form. It allows the user 
* to select the year and then displays the available tax forms in pfd format in IFRAME
*/

/**
*@constructor
*@description Class Canadian Tax forms, gives a PDF with the payslip.
*@augments Application 
*/
var YCA_TAXF = Class.create(YCA_TAXF,
/** 
*@lends YCA_TAXF
*/
{

/**
* @method getListOfPayslip - BNS, to diplay amended X
*@param json: json Object with the dates from sap
*@description we test if the dates are between dates in date pickers
*/
getListOfTaxForms: function (json) {
    this.virtualHtml.down('div#PAY_outer').update();
    this.virtualHtml.down('div#W2_outer').update();
    this.virtualHtml.down('div#PAY_textLoading').update('');
    //Add div to hold the Note of confidentiality. EzequielB April 2013.
    this.virtualHtml.down('div#PAY_Note').update('');
    Element.hide('payslip_titleOfPayslip');
    Element.hide('PAY_iframe');
    var html = "";
    var title1 = '';
    try {
        if (!Object.isEmpty(json.EWS) && !Object.isEmpty(json.EWS.o_taxforms_list) && !Object.isEmpty(json.EWS.o_taxforms_list.ycaui_str_taxforms_list)) {

            var listOfDates = objectToArray(json.EWS.o_taxforms_list.ycaui_str_taxforms_list);

            // Set show history off as defualt.
            var show_with_history = '';
            if (!Object.isEmpty(json.EWS.o_show_history)) {
                show_with_history = json.EWS.o_show_history;
            }

            var documentType = '';

            var lastT4 = '';
            var lastT4A = '';
            var lastT4NR = '';
            var lastRel1 = '';
            var lastRel2 = '';

            // Link holders for latest documents in each category
            var t4_body = new Element('div', { 'class': 't4_taxformsDiv' });
            var t4a_body = new Element('div', { 'class': 't4a_taxformsDiv' });
            var t4nr_body = new Element('div', { 'class': 't4nr_taxformsDiv' });
            var rel1_body = new Element('div', { 'class': 'rel1_taxformsDiv' });
            var rel2_body = new Element('div', { 'class': 'rel2_taxformsDiv', 'style': 'float:center;' });

            // Table for latest documents in each category when showing without the history
            var bodyTable = new Element('table', {
                'cellspacing': '1',
                'id': 'bodyTable',
                'style': 'width:55%;',
                'class': 'data-table'
            });
            var bodyThead = new Element('thead');
            bodyTable.insert(bodyThead);
            // Row 1 with colspan
            var bodyTr = new Element('tr', { 'class': 'table_nosort', 'id': 'headerTr' });
            bodyThead.insert(bodyTr);
            var bodyTd = new Element('th', { 'style': 'display: ""', 'id': 'thName', 'class': 'table_doubleHeaderUpper' });
            bodyTd.insert(new Element('span', { 'id': 'thSpanId' }).update(global.getLabel('LAST_AV_FORM')));
            bodyTr.insert(bodyTd);
            var bodyTbody = new Element('tbody');
            bodyTable.insert(bodyTbody);

            if (show_with_history == '') {
                this.virtualHtml.down('div#PAY_outer').insert(bodyTable);
            }

            var cur_form_type = "";
            var newest_form = false;
            var form_type = "";
            var form_name = "";

            // Checking to see got how many form_name = AMENDMENT
            var intAmmendmentCount = 0
            var formTypeHash = $H({});
            var formType = "";
            for (var j = 0; j < listOfDates.length; j++) {
                form_name = listOfDates[j]['@document_type'];
                if (form_name == 'AMENDMENT') {
                    //store the first type
                    if (Object.isEmpty(formType))
                        formType = listOfDates[j]['@appl'];
                    else if (formType != listOfDates[j]['@appl']) {
                        formType = listOfDates[j]['@appl'];
                        if (!Object.isEmpty(formTypeHash.get(formType)))
                            intAmmendmentCount = parseInt(formTypeHash.get(formType))
                        else
                            intAmmendmentCount = 0
                    }
                    //check the hash table
                    if (!Object.isEmpty(formTypeHash.get(formType)))
                        intAmmendmentCount = parseInt(formTypeHash.get(formType))
                    intAmmendmentCount = intAmmendmentCount + 1;
                    formTypeHash.set(formType, intAmmendmentCount);
                }
            } //for

            // Main loop
            for (var i = 0; i < listOfDates.length; i++) {

                documentType = global.getLabel('TAXF_TITLE') + ' ' + this.taxYear;
                title1 = documentType;
                form_type = listOfDates[i]['@appl'];
                form_name = listOfDates[i]['@document_type']
                // Check if the current form is of a new type.
                if (cur_form_type != form_type) {
                    cur_form_type = form_type;
                    newest_form = false;
                }

                var header_label = '';
                var document_header = listOfDates[i]['@appl'];
                // Get label for document type (amendm or production)
                if (document_header == 'REL1') {
                    document_header = global.getLabel('REL1');
                }
                else if (document_header == 'REL2') {
                    document_header = global.getLabel('REL2');
                }
                intAmmendmentCount = 0;
                if (form_name == 'AMENDMENT') {
                    intAmmendmentCount = parseInt(formTypeHash.get(form_type))
                    //                    if (intAmmendmentCount == 1) {
                    //                        document_header = document_header + ' (' + global.getLabel('AMENDED') + ')';
                    //                        intAmmendmentCount = intAmmendmentCount - 1;
                    //                        formTypeHash.set(form_type, intAmmendmentCount);
                    //                    }
                    //                    else {
                    document_header = document_header + ' (' + global.getLabel('AMENDED') + ' ' + (intAmmendmentCount) + ')';
                    intAmmendmentCount = intAmmendmentCount - 1;
                    formTypeHash.set(form_type, intAmmendmentCount);
                    //                    }

                }
                //fix to display amended form 2011/3/8
                //var doc_header = Object.isEmpty(listOfDates[i]['@runid_date']) ? "" : sapToDisplayFormat(listOfDates[i]['@runid_date'])
                //document_header = document_header + "&nbsp;" + doc_header;
                html = "<div class='taxform_listDates'><span id='callingForm" + "_" + listOfDates[i]['@doc_text'] + "_" + listOfDates[i]['@runid'] +
                        "_" + listOfDates[i]['@pabrj'] +
                        "_" + listOfDates[i]['@appl'] + "' class='application_action_link'>" +
                        document_header + "</span></div>";

                // Where to add the link?
                if (newest_form == false) {
                    // Add to the header
                    newest_form = true;

                    if (show_with_history == 'X') {
                        if (form_type == 'REL1') {
                            lastRel1 = html;
                        }
                        else if (form_type == 'REL2') {
                            lastRel2 = html;
                        }
                        else if (form_type == 'T4NR') {
                            lastT4NR = html;
                        }
                        else if (form_type == 'T4') {
                            lastT4 = html;
                        }
                        else {
                            if (form_type == 'T4A') {
                                lastT4A = html;
                            }
                        }
                    }
                    else {
                        var bodyTr = new Element('tr');
                        bodyTbody.insert(bodyTr);
                        var bodyTd = new Element('td', { 'style': 'display:""' });
                        bodyTr.insert(bodyTd);
                        bodyTd.insert(html);
                        html = "";
                    }
                }
                else {
                    // Save history links only is flag is on.
                    if (show_with_history == 'X') {
                        // Add to the body
                        if (form_type == 'T4') {
                            var old_t4 = t4_body.innerHTML;
                            if (old_t4.length > 0) {
                                t4_body.innerHTML = old_t4 + '<br />' + html;
                            }
                            else {
                                t4_body.innerHTML = html;
                            }
                        }
                        else if (form_type == 'T4A') {
                            var old_t4a = t4a_body.innerHTML;
                            if (old_t4a.length > 0) {
                                t4a_body.innerHTML = old_t4a + '<br />' + html;
                            }
                            else {
                                t4a_body.innerHTML = html;
                            }
                        }
                        else if (form_type == 'T4NR') {
                            var old_t4nr = t4a_body.innerHTML;
                            if (old_t4nr.length > 0) {
                                t4nr_body.innerHTML = old_t4nr + '<br />' + html;
                            }
                            else {
                                t4nr_body.innerHTML = html;
                            }
                        }
                        else if (form_type == 'REL1') {
                            var old_rel1 = rel1_body.innerHTML;
                            if (old_rel1.length > 0) {
                                rel1_body.innerHTML = old_rel1 + '<br />' + html;
                            }
                            else {
                                rel1_body.innerHTML = html;
                            }
                        }
                        else if (form_type == 'REL2') {
                            var old_rel2 = rel2_body.innerHTML;
                            if (old_rel2.length > 0) {
                                rel2_body.innerHTML = old_rel2 + '<br />' + html;
                            }
                            else {
                                rel2_body.innerHTML = html;
                            }
                        }
                    } // if show_fistory = 'X'    
                }
                html = "";

                this.virtualHtml.down('div#payslip_titleDate').update(title1);
                this.virtualHtml.down('div#payslip_titleDate').show();
            } // for

            // Save history links only is flag is on.
            if (show_with_history == 'X') {
                var data_t4 = $H({});

                data_t4.set('row1', { data: [{ text: '', id: 't4_1' },
                                { text: 'T4', id: 't4_2' },
                                { text: lastT4, id: 't4_3'}],
                    element: t4_body
                });

                var data_t4a = $H({});
                data_t4a.set('row2', { data: [{ text: '', id: 't4a_1' },
                                   { text: 'T4A', id: 't4a_2' },
                                   { text: lastT4A, id: 't4a_3'}],
                    element: t4a_body
                });

                var data_t4nr = $H({});
                data_t4nr.set('row3', { data: [{ text: '', id: 't4nr_1' },
                                   { text: 'T4NR', id: 't4nr_2' },
                                   { text: lastT4NR, id: 't4nr_3'}],
                    element: t4nr_body
                });
                var data_rel1 = $H({});
                data_rel1.set('row4', { data: [{ text: '', id: 't4rel1_1' },
                                  { text: global.getLabel('REL1'), id: 't4rel1_2' },
                                  { text: lastRel1, id: 't4rel1_3'}],
                    element: rel1_body
                });
                var data_rel2 = $H({});
                data_rel2.set('row5', { data: [{ text: '', id: 't4rel2_1' },
                                   { text: global.getLabel('REL2'), id: 't4rel2_2' },
                                   { text: lastRel2, id: 't4rel3_3'}],
                    element: rel2_body
                });

                var data = {
                    header: [{ text: global.getLabel('HISTORY'), id: 'col1' },
                             { text: global.getLabel('FORM_TYPE'), id: 'col2' },
                             { text: global.getLabel('LAST_FORM'), id: 'col3'}],
                    rows: $H({})
                };

                var table = new SimpleTable(data, {});

                // If there is data for corresponding formt type, include it into table.  

                if (lastT4.length > 1) {
                    table.addRow(data_t4);
                }
                if (lastT4NR.length > 1) {
                    table.addRow(data_t4nr);
                }
                if (lastT4A.length > 1) {
                    table.addRow(data_t4a);
                }
                if (lastRel1.length > 1) {
                    table.addRow(data_rel1);
                }
                if (lastRel2.length > 1) {
                    table.addRow(data_rel2);
                }

                table.getElement().style.width = "55%";
                this.virtualHtml.down('div#PAY_outer').insert(table.getElement());
            }
            else {
                // Show without history - do nothing at the moment
                TableKit.Sortable.init('bodyTable', { pages: 1 });
                TableKit.options.autoLoad = false;
            }
        }
    } catch (e) { }

    if (this.virtualHtml.down('div#PAY_outer').childElements().size() == 0) {
        this.virtualHtml.down('div#payslip_titleDate').hide();
    } else {
        this.virtualHtml.down('div#PAY_outer').observe('click', this.clickOnTaxForm.bind(this));
    }
    if (this.virtualHtml.down('div#PAY_outer').childElements().size() == 0) {
        this.virtualHtml.down('div#PAY_outer').update("<span class='payslip_noPayslip application_main_error_text'>" + global.getLabel('noTaxList') + "</span>");
    }
}

});