var ReviewAndSend_standard = Class.create(Application, {
    // 
    currentOrg: "",
    historyOrg: "",

    orgList: new Array(),
    json: null,
    orgUnitChangedFlag: false,
    multiPanel: null,
    repollFlag: false,
    currentPeriod: "",
    hashOfWidgets: $H({}),

    initialize: function($super, args) {
        $super(args);
        this.onPeriodSelectBinding = this.onPeriodSelect.bindAsEventListener(this);
        this.onOrgUnitSelectBinding = this.onOrgUnitSelect.bindAsEventListener(this);
        document.observe("EWS:compensationReviewPeriodSelected", this.onPeriodSelectBinding);
        document.observe("EWS:compensationOrgUnitSelected", this.onOrgUnitSelectBinding);

        this.setRepollBinding = this.setRepoll.bindAsEventListener(this);
        document.observe("EWS:CompCategoryUpdated", this.setRepollBinding);
    },

    run: function($super, args) {
        $super(args);
        document.observe("EWS:compensationReviewPeriodSelected", this.onPeriodSelectBinding);
        if ((this.firstRun || this.repollFlag || this.orgUnitChangedFlag) && this.currentPeriod != "") {
            if (!this.repollFlag) {
                this.orgList.clear();
            }
            this.orgUnitChangedFlag = false;
            this.loadScreen();
        }
    },

    close: function($super, args) {
        $super(args);
    },

    /**
    * @description Calls the get_content service
    */
    loadScreen: function() {
        var sendXml = '<EWS><SERVICE>GET_CONTENT_B</SERVICE>';
        if (this.currentOrg != '') {
            sendXml += '<OBJECT TYPE="O">' + this.currentOrg + '</OBJECT>'
        } else {
            sendXml += '<OBJECT TYPE="O"></OBJECT>';

        }
        sendXml += "<PARAM>";
        sendXml += "<APPID>COM_RAS</APPID>";
        sendXml += "<SUBTYPE>" + this.currentPeriod + "</SUBTYPE>";
        sendXml += "</PARAM></EWS>";

        this.repollFlag = false;

        this.makeAJAXrequest($H({ xml: sendXml, successMethod: 'renderScreen' }));

    },



    /**
    * @description Builds the screen based off the XML from the get_content_b service
    * @param json - Xml object
    */
    renderScreen: function(json) {
        this.json = json;
        this.records = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
        var canApprove;
        var canReject;
        var canSubmit;
        var buttons;
        var orgFound = false;
        var firstOrgId;
        var firstOrgText;

        // Fill the internal labels hash
        this.parseLabels(this.json.EWS.labels);

        // Process the records returned
        objectToArray(json.EWS.o_field_values.yglui_str_wid_record).each(function(record, i) {
            if (i == 0) {
                // Store the top level org id
                firstOrgId = record.contents.yglui_str_wid_content['@key_str'];
            }

            objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field, j) {
                if (field['@fieldid'] == 'CAN_SUBMIT') {
                    canSubmit = field['@value'];
                }
                if (field['@fieldid'] == 'CAN_APPROVE') {
                    canApprove = field['@value'];
                }
                if (field['@fieldid'] == 'CAN_REJECT') {
                    canReject = field['@value'];
                }
                if (field['@fieldid'] == 'ORG_TEXT') {
                    if (i == 0) {
                        // Store the top level org text
                        firstOrgText = field['@value'];
                    } else {
                        field['@value'] = '<span style="float:left">&#160;&#160;&#160;</span>' + field['@value'];
                    }
                }


            } .bind(this));

            if (record.contents.yglui_str_wid_content.tcontents != null) {
                objectToArray(record.contents.yglui_str_wid_content.tcontents.yglui_str_wid_tcontent).each(function(tcontent, j) {
                    objectToArray(tcontent.fields.yglui_str_wid_field).each(function(field, j) {
                        if (field['@fieldid'] == 'BUD_REMAIN' || field['@fieldid'] == 'BUD_TOTAL' || field['@fieldid'] == 'BUD_SPENT') {


                            if (field['@value'] < 0) {
                                field['@value'] = '-' + longToDisplay(field['@value'] * -1);
                                field['@value'] = "<span style='color:red;width:20px;text-align:right' nowrap>" + field['@value'] + "</span>";
                            } else {
                                field['@value'] = longToDisplay(field['@value'] * 1);
                            }
                        }
                    } .bind(this));
                } .bind(this));
            }
            newButtons = new Array();

            objectToArray(record.contents.yglui_str_wid_content.buttons.yglui_str_wid_button).each(function(button, j) {
                // Set the type on the buttons to the OKCode
                button['@type'] = button['@okcode'];

                // Gather the actions that the user is allowed to perform
                if (button['@okcode'] == 'APR' && canApprove == 'X') {
                    newButtons.push(button);
                }
                if (button['@okcode'] == 'REJ' && canReject == 'X') {
                    newButtons.push(button);
                }
                if (button['@okcode'] == 'SUB' && canSubmit == 'X') {
                    newButtons.push(button);
                }
            } .bind(this));

            // Replace the action buttons with only the ones that are usable according to the field values
            record.contents.yglui_str_wid_content.buttons.yglui_str_wid_button = newButtons;
        } .bind(this));

        var multiPanel = new SendAndReviewPanel({
            appId: 'COM_RAS',
            json: json,
            event: 'EWS:cmpApproveReject',
            paiEvent: 'EWS:paicmpApproveReject',
            noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>'
        }, this, '1', '1');

        // Store the top level org id and text in the org list, which is used to build the org nav links
        var orgObj = {
            orgId: firstOrgId,
            orgText: firstOrgText
        }

        this.orgList.each(function(org, j) {
            if (org.orgId == firstOrgId) {
                orgFound = true;
            }
        } .bind(this));

        if (orgFound != true) {
            this.orgList.push(orgObj);
        }

        multiPanel.getElement().style.width = '100%';
        multiPanel.getElement().style.textAlign = 'left';

        this.clearScreen();

        // Get the organizational navigation links
        this.virtualHtml.insert(this.getOrgNavigation());

        // Create the Show All/Hide All links
        this.virtualHtml.insert("<span style='float:right;'> <span  width=100%' class='application_action_link' onclick='javascript:document.fire(\"EWS:cmpToggleRows\", \"true\" );'   >"
                                   + this.labels.get("showAllDetails") + "</span><span> / " +
        "<span class='application_action_link' onclick='javascript:document.fire(\"EWS:cmpToggleRows\",  \"false\" );' >" + this.labels.get("hideAllDetails") + "</span></span> ");

        this.virtualHtml.insert(multiPanel.getElement());
        this.virtualHtml.insert("<br/>");

        // Add budget note
        this.virtualHtml.insert("<div style='float:left;'>" + this.labels.get('budgetNote') + "</div>");
        this.virtualHtml.insert("<br/>");

        // Set up observers for all the actions
        document.observe('EWS:cmpActionRaised', this.handleAction.bind(this, multiPanel));
        document.observe('EWS:cmpShowDetail', this.viewDetail.bind(this, multiPanel));
        document.observe('EWS:cmpViewHistory', this.viewHistory.bind(this, multiPanel));
        document.observe('EWS:cmpOrgDrillDown', this.orgDrillDown.bind(this, multiPanel));
        document.observe('EWS:cmpToggleRows', this.toggleRows.bind(this, multiPanel));

        document.fire('EWS:statusUpdatedCOM', {
            orgunit: this.currentOrg
        });

        this.multiPanel = multiPanel;
    },

    /**
    * @description Show/Hides all rows
    */
    toggleRows: function() {
        var args = $A(arguments);
        this.multiPanel.toggleAllRows(args[1].memo);
    },

    /**
    * @description Clears the screen and event handlers
    */
    clearScreen: function() {
        document.stopObserving('EWS:cmpActionRaised');
        document.stopObserving('EWS:cmpShowDetail');
        document.stopObserving('EWS:cmpViewHistory');
        document.stopObserving('EWS:cmpOrgDrillDown');
        document.stopObserving('EWS:cmpToggleRows');

        this.virtualHtml.update('');
    },

    /**
    * @description Loads the application associated with the budget selected
    */
    viewDetail: function() {
        var args = $A(arguments);
        var data = getArgs(args[1]).split(':');
        appid = data[1]

        document.fire('EWS:COMP_skipCall');
        document.fire('EWS:compensationTopOrgUnitSelected', {
            orgunit: data[0]
        });
        var appId = "";
        switch (appid) {
            case 'SalaryReview':
                appId = 'COM_SALR';
                break;
            case 'BonusPayment':
                appId = 'COM_BOPA';
                break;
            case 'LTI':
                appId = 'COM_LTI';
                break;
        }

        global.open($H({
            app: {
                appId: appid,
                view: this.args
            }
        })
        );
    },

    _sortArray: function(array) {
        var k;
        for (var i = 0; i < array.length; i++) {
            k = i;
            for (var j = i + 1; j < array.length; j++) {
                if (parseInt(array[j].seqnr, 10) < parseInt(array[k].seqnr, 10)) {
                    var tmp = array[k];
                    array[k] = array[j];
                    array[j] = tmp;
                    k = j - 1;
                }

            }
        }
        return array;
    },

    viewHistory: function() {
        var args = $A(arguments);

        this.historyOrg = args[1].memo;

        var sendXml = '<EWS><SERVICE>GET_CONTENT_B</SERVICE>';
        sendXml += '<OBJECT TYPE="O">' + this.historyOrg + '</OBJECT>'

        sendXml += "<PARAM>";
        sendXml += "<APPID>COM_PROG</APPID>";
        sendXml += "<SUBTYPE>" + this.currentPeriod + "</SUBTYPE>";
        sendXml += "</PARAM></EWS>";

        this.repollFlag = false;

        this.makeAJAXrequest($H({ xml: sendXml, successMethod: 'showHistoryPopup' }));
    },
    showHistoryPopup: function(historyJson) {
        var contentHTML = new Element('div');
        var orgText = "";
        var orgManagerName = "";

        objectToArray(this.records).each(function(record, i) {
            if (record.contents.yglui_str_wid_content['@key_str'] == this.historyOrg) {
                objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field, j) {
                    if (field['@fieldid'] == 'ORG_TEXT') {
                        orgText = field['@value'];
                    }
                    if (field['@fieldid'] == 'CHIEF_NAME') {
                        orgManagerName = field['@value'];
                    }
                } .bind(this));
            }

        } .bind(this));

        ;

        var table = new Element('table', {
            'class': 'sortable',
            'id': 'orgHistoryTable',
            'style': 'margin-top: 20px; width:95%;margin-right:20px; float:right;'
        });
        var thead = new Element('thead')
        table.insert(thead);
        var tr = new Element('tr');
        thead.insert(tr);

        var headers = this._sortArray(objectToArray(historyJson.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field));
        var records = objectToArray(historyJson.EWS.o_field_values.yglui_str_wid_record);

        headers.each(function(header, i) {
            tr.insert(new Element('th').update(this.labels.get(header['@fieldid'])));
        } .bind(this));

        var tbody = new Element('tbody');
        table.insert(tbody);

        records.each(function(record, j) {
            tr = new Element('tr');
            tbody.insert(tr);

            var fields = objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);

            fields.each(function(field, k) {
                if (field['#text'] != null) {
                    tr.insert(new Element('td').update(field['#text']));
                } else {
                    tr.insert(new Element('td').update(field['@value']));
                }
            } .bind(this));
        } .bind(this));

        contentHTML.insert("<table class='application_text_bolder' style='margin-right:20px;width:95%; float:right;'><tr><td style='width:20%;float:left;' >" + this.labels.get('planningManager') + "</td><td style='width:75%; float:left;'>" + orgManagerName + "</td></tr>"
                         + "<tr><td style='width:20%;float:left;' >" + this.labels.get('orgUnitText') + "</td><td style='width:75%; float:left;'>" + orgText + "</td></tr></table>");

        contentHTML.insert(table);
        TableKit.Sortable.init(table, { pages: 50 });
        TableKit.options.autoLoad = true;

        var buttonsJson = {
            elements: []
        };
        var cancel = function(data) {
            TableKit.unloadTable('orgHistoryTable');
            historyPopup.close();
            delete historyPopup;
        };
        /*
        var cancelButton = {
        idButton: 'cancel',
        label: global.getLabel('close'),
        handlerContext: null,
        className: 'infoPopUp_exampleButton',
        handler: cancel.bind(this),
        type: 'button',
        style: 'float:right',
        standardButton: true
        };
      
      buttonsJson.elements.push(cancelButton);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttonDiv = new Element('div', { style: 'float:right;margin-right:20px' });
        buttonDiv.insert(ButtonObj.getButtons());
      
      contentHTML.insert('<br/><br/><br/>');
        contentHTML.insert(buttonDiv);
        */
        var historyPopup = new infoPopUp({

            closeButton: $H({
                'callBack': function() {
                    TableKit.unloadTable('orgHistoryTable');
                    historyPopup.close();
                    delete historyPopup;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'confirmation',
            width: 800
        });

        historyPopup.create();

    },

    /**
    * @description Returns HTML that allows the user to go back to previous org units
    */
    getOrgNavigation: function() {
        var returnHTML = "<span style='width:100%; float:left; text-align:left;' >";

        this.orgList.each(function(org, j) {
            if (j + 1 == this.orgList.length) {
                returnHTML += "<span nowrap style='text-align:left;'>" + org.orgText + "</span>";
            } else {
                var onclickevent = 'javascript:document.fire("EWS:cmpOrgDrillDown", "' + org.orgId + '");';
                returnHTML += "<span nowrap style='text-align:left;' class='application_action_link' onclick='" + onclickevent + "' >" + org.orgText + "</span> <span> -&gt; </span>";
            }
        } .bind(this));
        returnHTML += "</span>";

        return returnHTML;
    },

    /**
    * @description Rebuilds the org list and loads th selected org unit
    */
    orgDrillDown: function() {
        var args = $A(arguments);
        var orgUnit = getArgs(args[1]);
        var orgReached = false;
        var newOrgList = new Array();
        this.currentOrg = orgUnit;
        document.fire('EWS:compensationTopOrgUnitSelected', {
            orgunit: orgUnit
        });
        this.orgList.each(function(org, j) {
            if (org.orgId == orgUnit) {
                orgReached = true;
            }

            if (!orgReached) {
                newOrgList.push(org);
            }

        } .bind(this));
        this.orgList = newOrgList;

        this.loadScreen();
    },
    /**
    * Parses the labels and stores it on the labels hash
    * @param labels Labels node
    */
    parseLabels: function(labels) {
        labels = objectToArray(labels.item);
        ;
        labels.each(function(item) {
            this.labels.set(item['@id'], item['@value']);
        } .bind(this));
    },

    /**
    * @description Creates infoPopup where the user enters comments before performing the action
    * @param json - Xml object
    */
    handleAction: function() {
        var args = $A(arguments);
        var data = getArgs(args[1]);
        data = data.split('_');

        var contentHTML = new Element('div');

        contentHTML.insert("<span>" + this.labels.get('enterComment') + "</span><br/><br/>");
        contentHTML.insert("<textArea width='100%' height='100%' id='com_ras_comment' cols='30' rows='4' type='textarea' />");

        var buttonsJson = {
            elements: []
        };

        var cancel = function(data) {
            commentPopup.close();
            delete commentPopup;
        };

        var confirm = function() {
            this.performAction(data, contentHTML.childNodes[3].value);

            commentPopup.close();
            delete commentPopup;
        };

        var aux1 = {
            idButton: 'save',
            label: global.getLabel('save'),
            handlerContext: null,
            className: 'infoPopUp_exampleButton',
            handler: confirm.bind(this, data),
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux1);

        var aux2 = {
            idButton: 'cancel',
            label: global.getLabel('cancel'),
            handlerContext: null,
            className: 'infoPopUp_exampleButton',
            handler: cancel.bind(this, data),
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        contentHTML.insert(ButtonObj.getButtons());

        if (data[1] == 'REJ') {
            var icon = 'exclamation';
        } else {
            var icon = 'confirmation';
        }

        var commentPopup = new infoPopUp({

            closeButton: $H({
                'callBack': function() {

                    commentPopup.close();
                    delete commentPopup;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: icon,
            width: 300
        });

        commentPopup.create();
    },

    /**
    * @description Calls service COM_UPD_STATUS
    * @param data- Action to perform
    * @param comment - commentText to be stored as a note on the org unit
    */
    performAction: function(data, commentText) {

        var sendXml = '<EWS><SERVICE>COM_UPD_STATUS</SERVICE>';
        var orgUnitRecord = this.records[data[0] - 1];
        var orgUnit = orgUnitRecord.contents.yglui_str_wid_content['@key_str'];
        sendXml += '<OBJECT TYPE="O">' + orgUnit + '</OBJECT>'
        sendXml += "<PARAM><CREVI>" + this.currentPeriod + "</CREVI>";
        sendXml += "<ACTION>" + data[1] + "</ACTION>";
        sendXml += "<COMMENT>" + commentText + "</COMMENT>";

        sendXml += "</PARAM></EWS>";

        this.makeAJAXrequest($H({ xml: sendXml, successMethod: 'loadScreen' }));
    },

    /**
    * @description Called when the review period changes
    * @param event - Contains the period selected
    */
    onPeriodSelect: function(event) {
        if (this.currentPeriod == "" || event.memo.period != this.currentPeriod || this.repollFlag == true) {
            this.currentPeriod = event.memo.period;
            this.repollFlag = true;
            //this.currentOrg = "";
            if (this.running) {
                this.virtualHtml.update('');
                //this.orgList.clear();
                this.loadScreen();
            }
        }
    },

    onOrgUnitSelect: function(event) {
        if (this.currentOrg == "" || event.memo.orgunit != this.currentOrg) {
            this.orgUnitChangedFlag = true;
            this.currentOrg = event.memo.orgunit;
            if (this.running) {
                this.virtualHtml.update('');
                this.orgList.clear();
                this.loadScreen();
            }
        }
    },

    /**
    * @description Called when the review period changes
    * @param event - Contains the period selected
    */
    setRepoll: function() {
        this.repollFlag = true;
    }

});

var ReviewAndSend = Class.create(ReviewAndSend_standard, {

    initialize: function($super, args) {
        $super(args);
    },

    run: function($super, args) {
        $super(args);
    },


    close: function($super, args) {
        $super(args);
    }

});

var SendAndReviewPanel = Class.create(MultipleRecordsFieldsPanel, {
    simpleTable: null,

    createContent: function() {
        var tableData = {
            header: [],
            rows: $H()
        };
        var tmpHeader = [];
        var headerIds = new Hash();

        //Getting the header
        this.setLabels();
        $A(this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field).each(function(item) {
            if (item['@fieldtype'] == 'H' && item['@fieldsource'] != 'T') {
                tmpHeader.push({
                    text: item['@fieldlabel'] == null ? this.labels.get(item['@fieldid']) : item['@fieldlabel'],
                    id: item['@fieldid'],
                    seqnr: item['@seqnr']
                });
                headerIds.set(item['@fieldid'], item['@seqnr']);
            }
        } .bind(this));
        //Sorting the header by seqnr
        this._sortArray(tmpHeader);
        tableData.header = tmpHeader;
        //var tmpJson = deepCopy(this._json);
        var tmpRecords = objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record);

        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            var tmpData = [];
            if (this._selectedPanel === i)
                record.contents.yglui_str_wid_content['@selected'] = 'X';
            else
                record.contents.yglui_str_wid_content['@selected'] = '';

            //            tmpJson.EWS.o_field_values.yglui_str_wid_record = objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)[i];
            this._json.EWS.o_field_values.yglui_str_wid_record = tmpRecords[i];
            //this._sortArray(tmpData);
            var panel = new fieldsPanel({
                appId: this._appId,
                mode: 'display',
                json: this._json,
                event: 'EWS:cmpActionRaised',
                noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                paiEvent: 'EWS:paiEvent_' + this._appId + '_' + this._widScreen,
                validForm: 'EWS:validFormHandler_' + this._appId + '_' + this._widScreen
            });

            var simpleTables = panel.getElement().getElementsByClassName('simpleTable_table');
            panel.getElement().style.marginLeft = '10%';
            contentElement = panel.getElement();
            if (!Object.isEmpty(simpleTables[0])) {
                this.simpleTable = simpleTables[0];
                this.simpleTable.style.width = '80%';
            }


            objectToArray(record.contents.yglui_str_wid_content).last().fields.yglui_str_wid_field.each(function(content, j) {
                if (headerIds.get(content['@fieldid']) != undefined) {
                    var auxText = (!Object.isEmpty(content['#text'])) ? content['#text'] : content['@value'];
                    if (!Object.isEmpty(panel.getFieldInfo(content['@fieldid'])) && (panel.getFieldInfo(content['@fieldid'])['@type'] == 'DATS')) {
                        auxText = (!Object.isEmpty(auxText)) ? sapToDisplayFormat(auxText) : '';
                    }
                    tmpData.push({
                        text: auxText != null ? auxText : '',
                        id: '',
                        seqnr: headerIds.get(content['@fieldid'])
                    });
                }
            } .bind(this));
            this._sortArray(tmpData);
            if (!Object.isEmpty(tmpData[0]) && (tmpData[0].text == ''))
                tmpData[0].text = global.getLabel('viewDetails');
            tableData.rows.set('row' + i, {
                data: tmpData,
                element: contentElement
            });
            var index = objectToArray(record.contents.yglui_str_wid_content).last()['@rec_index'];
            this._fieldsPanels.set(index, panel);
            if (!this.currentlySelected)
                this.currentlySelected = index;
        } .bind(this));
        return tableData;
    },
    _toggleContentElement: function() {
        var args = $A(arguments);
        args[0].toggle();
        if (args[1].hasClassName('application_verticalR_arrow')) {
            args[1].removeClassName('application_verticalR_arrow');
            args[1].addClassName('application_down_arrow');
        }
        else {
            args[1].removeClassName('application_down_arrow');
            args[1].addClassName('application_verticalR_arrow');
        }
    },
    toggleAllRows: function(pHide) {
        var lHide = pHide;

        this._contentPointer.each(function(cont, i) {
            if (lHide != "true") {
                cont[1].style.display = 'none';
            } else {
                cont[1].style.display = '';
            }
        } .bind(this));
    }

});