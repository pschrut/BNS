var enrolled_exists;

var HealthPlanScreen2 = Class.create(MultipleRecordsFieldsPanel, {
    _planArray: null,

    initialize: function($super, options, parentClass, selectedPanel, widScreen) {
        this._selectedPanel = selectedPanel;
        this._json = options.json;
        this._appId = options.appId;
        this.typeLink = false;
        this._options = options;
        this._fieldsPanels = new Hash();
        this._widScreen = widScreen;
        this._rowPointer = new Hash();
        this._contentPointer = new Hash();
        this._rowElement = new Hash();
        this._mode = options.mode;
        //$super();
        this._parentClass = parentClass;
        this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_REQUEST", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();
        this.dependentsCheckboxInfo = options.dependentsCheckboxInfo;

        writeXmlToMedicalBind = this.writeXmlToMedical.bind(this);
        document.stopObserving("EWS:benefits_1_writeXmlToMedical");
        document.observe("EWS:benefits_1_writeXmlToMedical", writeXmlToMedicalBind);

        updateMenuItemBind = this.updateMenuItem.bind(this);
        handleCheckboxesBind = this.handleCheckboxes.bind(this);

        disableCheckboxesBind = this.disableCheckboxes.bind(this);
        document.stopObserving("EWS:benefits_1_disableDependentsCheckboxes");
        document.observe("EWS:benefits_1_disableDependentsCheckboxes", disableCheckboxesBind);


        if (this._json.EWS.o_field_values) {
            this.createPlanArray();

            //  $super(this.createContent(), options);
            this._tableStructure = this.createContent();
            this._generateStructure();
        }
        else {
            this._element = '<div style="clear:both;"></div><span>' + options.noResultsHtml + '</span>';
        }

        this.buildSendXml = function(args) {
            document.fire("EWS:benefits_1_sendXmlToApp", "Medical");
            if (args) {
                var args = getArgs(args);
                var optionId = args.optionId;
                var coverageType = args.coverageType;

                //For use looping through yglui_str_wid_record nodes.
                var iterator = 0;
                var isSelectedPlan;
                var isSelectedNode;
                while (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator] != null) {
                    //For use looping through yglui_str_wid_field nodes.
                    var iterator2 = 0;
                    while (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2] != null) {
                        if (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@fieldid"] == "BEN_PLAN") {
                            isSelectedPlan = false;
                            if (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@value"] == optionId) {
                                isSelectedPlan = true;
                            }
                            //For use looping through yglui_str_wid_tcontent nodes.
                            var iterator3 = 0;
                            var pArray = objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.tcontents.yglui_str_wid_tcontent);
                            while (pArray[iterator3] != null) {
                                //For use looping through yglui_str_wid_field nodes.
                                var iterator4 = 0;
                                isSelectedNode = false;
                                while (pArray[iterator3].fields.yglui_str_wid_field[iterator4] != null) {
                                    if (pArray[iterator3].fields.yglui_str_wid_field[iterator4]["@fieldid"] == "DEP_COVER") {
                                        if (pArray[iterator3].fields.yglui_str_wid_field[iterator4]["@value"] == coverageType) {
                                            isSelectedNode = true;
                                        }
                                    }
                                    if (pArray[iterator3].fields.yglui_str_wid_field[iterator4]["@fieldid"] == "ENROLLED") {
                                        if (isSelectedNode && isSelectedPlan) {
                                            pArray[iterator3].fields.yglui_str_wid_field[iterator4]["@value"] = "X";
                                            pArray[iterator3].fields.yglui_str_wid_field[iterator4]["#text"] = "Yes";
                                        }
                                        else {
                                            pArray[iterator3].fields.yglui_str_wid_field[iterator4]["@value"] = "";
                                            pArray[iterator3].fields.yglui_str_wid_field[iterator4]["#text"] = "No";
                                        }
                                    }
                                    iterator4++;
                                }
                                iterator3++;
                            }
                        }
                        iterator2++;
                    }
                    iterator++;
                }
            }
            else {
                if (!(this.xmlToBackend)) {
                    this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_BENEFITS", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();
                }
                this.xmlToBackend.EWS.SERVICE = "SAVE_BENEFITS";
                this.xmlToBackend.EWS.PARAM.APPID = appID;

                this.xmlToBackend.EWS.PARAM.RECORDS = this._json.EWS.o_field_values;
            }

            document.fire("EWS:benefits_1_writeXmlToBackend", { json: this.xmlToBackend });
        } .bind(this);

        changeClassBind = this.changeClass.bind(this);

        buildSendXmlBindMedical = this.buildSendXml.bind(this);
        buildSendXmlBindMedical();
    },

    writeXmlToMedical: function(args) {
        var args = getArgs(args);
        var json = args.json;

        if (json) {
            this.xmlToBackend = json;
        }
    },

    updateMenuItem: function(args) {
        document.fire("EWS:benefits_1_updateMenuItem", { newValue: args.newValue });
    },

    handleCheckboxes: function(args) {
        var checkboxInfo = this.dependentsCheckboxInfo.get(getArgs(args).checkboxValue);

        document.fire("EWS:benefits_1_updateCheckboxes", checkboxInfo);
    },

    disableCheckboxes: function(args) {
        try {
            var checkboxInfo = this.dependentsCheckboxInfo.get(checkboxesToDisable);

            document.fire("EWS:benefits_1_updateCheckboxes", checkboxInfo);
        }
        catch (e) { }
    },

    createContent: function() {
        var tableData = {
            header: [],
            rows: $H()
        };
        var tmpHeader = [];
        var htmlToReturn;
        var headerIds = new Hash();
        var headerArray = new Array();
        var listOfHeaders = new Hash();

        //Getting the header
        this.setLabels();

        var iterator = 0;
        var seqNum = 0;
        tmpHeader.push({
            text: 'Plans',
            id: '',
            seqnr: ''
        });

        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            $A(objectToArray(record.contents.yglui_str_wid_content.tcontents.yglui_str_wid_tcontent)).each(function(item, j) {
                $A(objectToArray(item.fields.yglui_str_wid_field)).each(function(element, k) {
                    if (element['@fieldid'] == "DEP_COVER") {
                        //                        if ((headerIds.get(element['@value']) == null) && (element['@value'] != "0000")) {
                        if (headerIds.get(element['@value']) == null) {
                            headerIds.set(element['@value'], element['#text']);
                            tmpHeader.push({
                                text: element['#text'],
                                id: element['@value'],
                                seqnr: seqNum
                            });
                            headerArray.push(element['@value']);
                            seqNum++;
                        }
                    }
                } .bind(this));
            } .bind(this));
        } .bind(this));
        //Sorting the header by seqnr
        this._sortArray(tmpHeader);
        tableData.header = tmpHeader;
        var fieldInfoAux = objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record);

        //Go through each record
        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            var tmpData = [];
            var fieldInfo = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;

            var rowNumber = 0;
            var auxText = '';
            var aux2;
            var count = 0;
            var index;
            //Go through each field node to get the value of certain variables
            while (fieldInfo[rowNumber] != null) {
                if (fieldInfo[rowNumber]["@fieldid"] == "BEN_OPTION") {
                    var optionName = fieldInfo[rowNumber]["#text"];
                    aux2 = optionName;
                }
                if (fieldInfo[rowNumber]["@fieldid"] == "BEN_PLAN") {
                    var optionId = fieldInfo[rowNumber]["@value"];
    
                    for (index = 0; index < fieldInfoAux.length && count<2; index++) {
                        if (fieldInfoAux[index].contents.yglui_str_wid_content.fields.yglui_str_wid_field[1]["@fieldid"] == "BEN_PLAN") {
                            if (optionId == fieldInfoAux[index].contents.yglui_str_wid_content.fields.yglui_str_wid_field[1]["@value"]) {
                                count++;
                            }
                        }
                    }

                    if (count > 1) {
                        var planName = fieldInfo[rowNumber]["#text"] + ' - ' + aux2;
                    } else {
                        var planName = fieldInfo[rowNumber]["#text"];
                    }
                    count = 0;
                    var planNameB = planName;
                }
                if (fieldInfo[rowNumber]["@fieldid"] == "URL_PLAN") {
                    if (fieldInfo[rowNumber]["#text"] != null && fieldInfo[rowNumber]["#text"] != "") {
                        //planName = "<a class='application_action_link' href='" + fieldInfo[rowNumber]["#text"] + "' target='_blank'>" + planName + "</a>";
                        planName = "<div style='float:left;padding-right:5px'>" + planName + "</div><div onclick='window.open(\"" + fieldInfo[rowNumber]["#text"] + "\")' class='Rept_exportXML' border='0' style='border:0px;width:15px;height:15px;float:right;cursor:pointer'/>";
                    }
                }
                if (fieldInfo[rowNumber]["@fieldid"] == "WAIVE_PLAN") {
                    if (fieldInfo[rowNumber]["@value"] == "X") {
                        var isWaivePlan = true;
                        planName = planNameB;
                    }
                    else {
                        var isWaivePlan = false;
                    }
                }

                var planOptions = objectToArray(record.contents.yglui_str_wid_content.tcontents.yglui_str_wid_tcontent);
                var coverageOption = 0;
                var radioButtons = new Array();
                //Create the radioButtons array
                for (var x = 0; x < headerArray.length; x++) {
                    radioButtons.push('');
                }

                while (planOptions[coverageOption] != null) {
                    var fieldNumber = 0;
                    while (planOptions[coverageOption].fields.yglui_str_wid_field[fieldNumber] != null) {
                        if (planOptions[coverageOption].fields.yglui_str_wid_field[fieldNumber]["@fieldid"] == "DEP_COVER") {
                            var coverageType = planOptions[coverageOption].fields.yglui_str_wid_field[fieldNumber]["@value"];
                            var coverageName = planOptions[coverageOption].fields.yglui_str_wid_field[fieldNumber]["#text"];
                        }
                        if (planOptions[coverageOption].fields.yglui_str_wid_field[fieldNumber]["@fieldid"] == "EE_COST") {
                            var eeCost = Number(planOptions[coverageOption].fields.yglui_str_wid_field[fieldNumber]["#text"]).toFixed(2);
                        }
                        if (planOptions[coverageOption].fields.yglui_str_wid_field[fieldNumber]["@fieldid"] == "ENROLLED") {
                            var enrolled = planOptions[coverageOption].fields.yglui_str_wid_field[fieldNumber]["@value"];
                        }
                        fieldNumber++;
                    }
                    //Code to create radio buttons
                    //if (enrolled == "X") {
                    //    checkboxesToDisable = coverageType;
                    //    var checked = "checked='true'";
                    //}
                    //else {
                    //    var checked = '';
                    //}
                    if (enrolled == "X") {
                        checkboxesToDisable = coverageType;
                        var cellClass = "application_benefits_selected_option";
                        this.currentSelectionId = "option_" + optionId + "_" + coverageType;
                    }
                    else {
                        var cellClass = "application_benefits_unselected_option";
                    }

                    //var newRadio = "<input type='radio' " + checked + "  name='healthPlanRadio' value='radio_" + optionId + "_" + coverageType + "' onClick='buildSendXmlBindMedical({ optionId : &quot;" + optionId + "&quot;, coverageType: &quot;" + coverageType + "&quot;}); updateMenuItemBind({ newValue : " + Number(eeCost).toFixed(2) + "}); handleCheckboxesBind({ checkboxValue: &quot;" + coverageType + "&quot;});'/>";
                    //for (var z = 0; z < headerArray.length; z++) {
                    //    if (headerArray[z] == coverageType) {
                    //        radioButtons[z] = newRadio + " " + longToDisplay(Number(eeCost));
                    //    }
                    //}

                    for (var z = 0; z < headerArray.length; z++) {
                        if (headerArray[z] == coverageType) {
                            radioButtons[z] = "<a id='option_" + optionId + "_" + coverageType + "' class='" + cellClass + "' href='javascript:void(0);' onclick='changeClassBind(this.id);buildSendXmlBindMedical({ optionId : &quot;" + optionId + "&quot;, coverageType: &quot;" + coverageType + "&quot;}); updateMenuItemBind({ newValue : " + Number(eeCost).toFixed(2) + "}); handleCheckboxesBind({ checkboxValue: &quot;" + coverageType + "&quot;});'>" + longToDisplay(Number(eeCost)) + "</a>";
                        }

                    }

                    auxText = '';

                    coverageOption++;
                }

                auxText = '';

                rowNumber++;
            }
            tmpData.push({
                text: planName,
                id: 'hlt_label_' + i,
                seqnr: ''
            });

            for (var y = 0; y < radioButtons.length; y++) {
                tmpData.push({
                    text: radioButtons[y] != null ? radioButtons[y] : '',
                    id: '',
                    seqnr: y
                });
            }

            tableData.rows.set('row' + i, {
                data: tmpData
            });

        } .bind(this));

        return tableData;
    },

    changeClass: function(selectedObj) {
        if (this.currentSelectionId) {
            $(this.currentSelectionId).parentNode.parentNode.removeClassName("application_benefits_selected_tbl_row");
            $(this.currentSelectionId).parentNode.parentNode.addClassName(this.currentSelectionClass);
            $(this.currentSelectionId).removeClassName("application_benefits_selected_option");
            $(this.currentSelectionId).addClassName("application_benefits_unselected_option");
        }
        this.currentSelectionId = selectedObj;
        this.currentSelectionClass = $(selectedObj).parentNode.parentNode.className;
        $(selectedObj).parentNode.parentNode.removeClassName(this.currentSelectionClass);
        $(selectedObj).parentNode.parentNode.addClassName("application_benefits_selected_tbl_row");
        $(selectedObj).removeClassName("application_benefits_unselected_option");
        $(selectedObj).addClassName("application_benefits_selected_option");
    },


    /*changeClass: function(selectedObj) {
    if (this.lastRow) {
    this.lastRow.removeClassName("application_benefits_selected_tbl_row");
    this.lastRow.addClassName(this.lastRowClass);
    this.lastRow.isDefault = '';
    this.lastRow.lastChild.firstChild.className = "application_benefits_unselected_option";
    }
    this.lastRow = selectedObj.parentNode.parentNode;
    this.lastRowClass = $(selectedObj).parentNode.parentNode.className;
    $(selectedObj).parentNode.parentNode.removeClassName(this.lastRowClass);
    $(selectedObj).parentNode.parentNode.addClassName("application_benefits_selected_tbl_row");
    $(selectedObj).isDefault = 'X';
    $(selectedObj).parentNode.parentNode.lastChild.firstChild.className = "application_benefits_selected_option";
    },*/


    getRecords: function(pBenPlan, pBenOption) {
        var benPlan = "";
        var benOption = "";
        var returnArray = [];

        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            if (record['@screen'] == "1") {
                $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, i) {
                    if (field['@fieldid'] == "BEN_PLAN") {
                        benPlan = field['@value'];
                    } else if (field['@fieldid'] == "BEN_OPTION") {
                        benOption = field['@value'];
                    }
                } .bind(this));
            }

            if (benOption == pBenOption && benPlan == pBenPlan) {
                returnArray.push(record);
            }
        } .bind(this));

        if (returnArray.length == 1) {
            return returnArray[0];
        } else {
            return returnArray;
        }
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
        //this._parentClass.hashOfWidgets.get(this._appId).windowResizedAction();
    },

    createPlanArray: function() {
        this._planArray = [];
        var benPlan = "";
        var benOption = "";
        var prevBenPlan = "";
        var prevBenOption = "";

        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            if (record['@screen'] == "1") {

                $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, i) {
                    if (field['@fieldid'] == "BEN_PLAN") {
                        benPlan = field['@value'];
                    } else if (field['@fieldid'] == "BEN_OPTION") {
                        benOption = field['@value'];
                    }
                } .bind(this));

                if (benOption != prevBenOption || benPlan != prevBenPlan) {
                    this._planArray.push({
                        benPlan: benPlan,
                        benOption: benOption
                    });
                }

                prevBenPlan = benPlan;
                prevBenOption = benOption;
            }
        } .bind(this));
    }
});

var SuppLifeScreen = Class.create(MultipleRecordsFieldsPanel, {
    _planArray: null,

    initialize: function($super, options, parentClass, selectedPanel, widScreen) {
        enrolled_exists = false;
        this._selectedPanel = selectedPanel;
        this._json = options.json;
        this._appId = options.appId;
        this.typeLink = false;
        this._options = options;
        this._eoiPlanExists = false;
        this._fieldsPanels = new Hash();
        this._widScreen = widScreen;
        this._mode = options.mode;
        this._rowPointer = new Hash();
        this._contentPointer = new Hash();
        this._rowElement = new Hash();
        this.isEnrolled = -1;
        //$super();
        this._parentClass = parentClass;
        this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_REQUEST", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();

        writeXmlToSuppLifeBind = this.writeXmlToSuppLife.bind(this);
        document.stopObserving("EWS:benefits_1_writeXmlToSuppLife");
        document.observe("EWS:benefits_1_writeXmlToSuppLife", writeXmlToSuppLifeBind);

        updateMenuItemBind = this.updateMenuItem.bind(this);


        if (this._json.EWS.o_field_values) {
            this.createPlanArray();


            this._tableStructure = this.createContent();
            this._generateStructure();
        }
        else {
            this._element = '<div style="clear:both;"></div><span>' + options.noResultsHtml + '</span>';
        }

        this.buildSendXml = function(args) {
            document.fire("EWS:benefits_1_sendXmlToApp", "SuppLife");
            if (args) {
                var args = getArgs(args);
                var selectionNumber = args.selectionNumber;

                var iterator = 0;
                var arrayXmlToBackend = objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record);
                while (arrayXmlToBackend[iterator] != null) {
                    if (iterator == Number(selectionNumber)) {
                        var iterator2 = 0;
                        while (arrayXmlToBackend[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2] != null) {
                            if (arrayXmlToBackend[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@fieldid"] == "ENROLLED") {
                                arrayXmlToBackend[iterator].contents.yglui_str_wid_content["@selected"] = "X";
                                arrayXmlToBackend[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@value"] = "X";
                            }
                            if (arrayXmlToBackend[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@fieldid"] == "WAIVE_PLAN") {
                                var iteratorB = 0;
                                if (arrayXmlToBackend[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@value"] == "X") {
                                    if ($("beneficiaries_div")) {
                                        $("beneficiaries_div").style.display = "none";
                                    }
                                    while (arrayXmlToBackend[iteratorB] != null) {
                                        if (arrayXmlToBackend[iteratorB]["@screen"] == 2) {
                                            arrayXmlToBackend[iteratorB].contents.yglui_str_wid_content.fields.yglui_str_wid_field[3]["#text"] = "0";
                                            arrayXmlToBackend[iteratorB].contents.yglui_str_wid_content.fields.yglui_str_wid_field[3]["@value"] = "0";
                                        }
                                        iteratorB++;
                                    }
                                }
                                else {
                                    if ($("beneficiaries_div")) {
                                        $("beneficiaries_div").style.display = "";
                                    }
                                    var iteratorC = 0;
                                    while (arrayXmlToBackend[iteratorB] != null) {
                                        if (arrayXmlToBackend[iteratorB]["@screen"] == 2) {
                                            arrayXmlToBackend[iteratorB].contents.yglui_str_wid_content.fields.yglui_str_wid_field[3]["#text"] = $("percentage" + iteratorC).value;
                                            arrayXmlToBackend[iteratorB].contents.yglui_str_wid_content.fields.yglui_str_wid_field[3]["@value"] = $("percentage" + iteratorC).value;
                                            iteratorC++;
                                        }
                                        iteratorB++;
                                    }
                                }
                            }
                            iterator2++;
                        }
                    }
                    else {
                        var iterator2 = 0;
                        while (arrayXmlToBackend[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2] != null) {
                            if (arrayXmlToBackend[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@fieldid"] == "ENROLLED") {
                                arrayXmlToBackend[iterator].contents.yglui_str_wid_content["@selected"] = "";
                                arrayXmlToBackend[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@value"] = "";
                            }
                            iterator2++;
                        }
                    }
                    iterator++;
                }
                //                document.fire("EWS:benefits_1_writeXmlToBackend", { json: this.xmlToBackend });
            }
            else {
                if (!(this.xmlToBackend)) {
                    this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_BENEFITS", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();
                }
                this.xmlToBackend.EWS.SERVICE = "SAVE_BENEFITS";
                this.xmlToBackend.EWS.PARAM.APPID = appID;

                this.xmlToBackend.EWS.PARAM.RECORDS = this._json.EWS.o_field_values;
            }

            document.fire("EWS:benefits_1_writeXmlToBackend", { json: this.xmlToBackend });
        } .bind(this);

        updateBeneficiaryTblBind = this.updateBeneficiaryTbl.bind(this);
        changeClassBind = this.changeClass.bind(this);

        buildSendXmlBindSuppLife = this.buildSendXml.bind(this);
        buildSendXmlBindSuppLife();
    },

    writeXmlToSuppLife: function(args) {
        var args = getArgs(args);
        var json = args.json;

        if (json) {
            this.xmlToBackend = json;
        }
    },

    updateMenuItem: function(args) {
        document.fire("EWS:benefits_1_updateMenuItem", { newValue: args.newValue });
    },

    createContent: function() {
        var tableData = {
            header: [],
            rows: $H()
        };
        var tmpHeader = [];
        var headerIds = new Hash();
        var iterator = 0;
        //Getting the header
        this.setLabels();
        this.isEnrolled = -1;
        $A(this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field).each(function(item) {
            if (item['@fieldtype'] == 'H' && item['@display_attrib'] != 'HID' && item['@fieldid'] != 'ENROLLED') {
                tmpHeader.push({
                    text: item['@fieldlabel'] == null ? (this.labels.get(item['@fieldid']) == null ? '' : this.labels.get(item['@fieldid'])) : item['@fieldlabel'],
                    //text: '',
                    id: item['@fieldid'],
                    seqnr: item['@seqnr']
                });
                headerIds.set(item['@fieldid'], item['@seqnr']);
            }
        } .bind(this));
        //Sorting the header by seqnr
        this._sortArray(tmpHeader);
        tableData.header = tmpHeader;
        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            var tmpData = [];
            var isSelected = "";
            isSelected = record.contents.yglui_str_wid_content['@selected'];
            if (this._selectedPanel === i)
                record.contents.yglui_str_wid_content['@selected'] = 'X';
            else
                record.contents.yglui_str_wid_content['@selected'] = '';
            // WORKING CODE
            var tmpJson = deepCopy(this._json);
            tmpJson.EWS.o_field_values.yglui_str_wid_record = objectToArray(tmpJson.EWS.o_field_values.yglui_str_wid_record)[i];
            // END WORKING CODE

            // JUSTIN'S TEST CODE
            /*

            var tmpJson = { 'EWS': { 'o_date_ranges': '', 'o_field_settings': '', 'o_field_values': '', 'o_screen_buttons': '', 'o_widget_screens': '', 'labels': '', 'messages': '', 'webmessage_type': '', 'webmessage_text': ''} };
            tmpJson.EWS.labels = this._json.EWS.labels;
            tmpJson.EWS.o_field_settings = this._json.EWS.o_field_settings;
            tmpJson.EWS.o_widget_screens = this._json.EWS.o_widget_screens;
            tmpJson.EWS.o_field_values = this._json.EWS.o_field_values;
            tmpJson.EWS.o_field_values.yglui_str_wid_record = objectToArray(tmpJson.EWS.o_field_values.yglui_str_wid_record)[i];

            */
            // END JUSTIN'S TEST CODE

            this._sortArray(tmpData);

            var panel = new getContentModule({
                appId: this._appId,
                mode: this._mode,
                json: tmpJson,
                showCancelButton: false,
                buttonsHandlers: $H({
                    DEFAULT_EVENT_THROW: 'EWS:pdcChange_' + this._parentClass.tabId + '_' + this._appId,
                    paiEvent: 'EWS:paiEvent_' + this._appId + '_' + this._widScreen
                }),
                showButtons: $H({
                    edit: false,
                    display: false,
                    create: false
                })
            });

            /*var panel = new fieldsPanel({
            appId: this._appId,
            mode: this._mode,
            json: tmpJson,
            event: 'EWS:pdcChange_' + this._parentClass.tabId + '_' + this._appId,
            noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
            paiEvent: 'EWS:paiEvent_' + this._appId + '_' + this._widScreen,
            validForm: 'EWS:validFormHandler_' + this._appId + '_' + this._widScreen
            });*/

            objectToArray(record.contents.yglui_str_wid_content).last().fields.yglui_str_wid_field.each(function(content, j) {
                if (content["@fieldid"] == "EOI_REQIRD" && content["@value"] == "X") {
                    this._eoiPlanExists = true;

                    for (k = 0; k < tmpData.length; k++) {
                        if (tmpData[k].id == "BEN_OPTION") {
                            tmpData[k].text = tmpData[k].text + "<span style='color:red'>*</span>";
                        }
                    }

                }
                if (headerIds.get(content['@fieldid']) != undefined) {
                    auxText = null;

                    if (this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field[j]["@display_attrib"] != "HID") {
                        if (this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field[j]["@fieldformat"] != "R") {
                            var iterator2 = 0;
                            var eeCost = 0;
                            while (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2] != null) {
                                if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@fieldid"] == "EE_COST") {
                                    eeCost = Number(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@value"]).toFixed(2);
                                }
                                if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@fieldid"] == "ENROLLED") {
                                    if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@value"] == 'X') {
                                        this.isEnrolled = iterator;
                                        enrolled_exists = true;
                                    }
                                }
                                if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@fieldid"] == "WAIVE_PLAN") {
                                    if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@value"] == 'X') {
                                        enrolled_exists = false;
                                    }
                                }
                                iterator2++;
                            }
                            if ((content["#text"] != '') && (content["#text"] != null)) {
                                if (!isNaN(Number(content["#text"]))) {
                                    auxText = "<div isDefault='" + isSelected + "' style='cursor: pointer;' onClick='changeClassBind(this);updateBeneficiaryTblBind(this);buildSendXmlBindSuppLife({ selectionNumber : " + iterator + "}); updateMenuItemBind({ newValue : " + eeCost + "});'";
                                    if (this.isEnrolled == iterator) {
                                        auxText = auxText + " class='enrolled_Row'";
                                        this.isEnrolled = -1;
                                    }
                                    auxText = auxText + ">" + longToDisplay(Number(content["#text"])) + "</div>";
                                }
                                else {
                                    auxText = "<div isDefault='" + isSelected + "' style='cursor: pointer;'  onClick='changeClassBind(this);updateBeneficiaryTblBind(this);buildSendXmlBindSuppLife({ selectionNumber : " + iterator + "}); updateMenuItemBind({ newValue : " + eeCost + "});'>" + content["#text"] + "</div>";
                                }
                            }
                            else {
                                if (!isNaN(Number(content["@value"]))) {
                                    auxText = "<div isDefault='" + isSelected + "' style='cursor: pointer;' class = 'application_benefits_unselected_option' onClick='changeClassBind(this);updateBeneficiaryTblBind(this);buildSendXmlBindSuppLife({ selectionNumber : " + iterator + "}); updateMenuItemBind({ newValue : " + eeCost + "});'>" + longToDisplay(Number(content["@value"])) + "</div>";
                                }
                                else {
                                    auxText = "<div isDefault='" + isSelected + "' style='cursor: pointer;' class = 'application_benefits_unselected_option' onClick='changeClassBind(this);updateBeneficiaryTblBind(this);buildSendXmlBindSuppLife({ selectionNumber : " + iterator + "}); updateMenuItemBind({ newValue : " + eeCost + "});'>" + content["@value"] + "</div>";
                                }
                            }
                        }
                        else {
                            if (content["@value"] == 'X') {
                                var iterator2 = 0;
                                while (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2] != null) {
                                    if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@fieldid"] == "EE_COST") {
                                        auxText = "<input type='radio' name='suppLifeRadio' value='radio" + iterator + "' checked='true' onClick='buildSendXmlBindSuppLife({ selectionNumber : " + iterator + "}); updateMenuItemBind({ newValue : " + Number(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@value"]).toFixed(2) + "});'/>";
                                    }
                                    if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@fieldid"] == "WAIVE_PLAN") {
                                        if (!(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@value"] == 'X')) {
                                            enrolled_exists = true;
                                        }
                                    }
                                    iterator2++;
                                }
                                //auxText = "<input type='radio' name='suppLifeRadio' value='radio" + iterator + "' checked='true' onClick='buildSendXmlBindSuppLife({ selectionNumber : " + iterator + "}); updateMenuItemBind({ newValue : " + Number(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[5]["@value"]).toFixed(2) + "});'/>";
                                iterator++;
                            }
                            else {
                                var iterator2 = 0;
                                while (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2] != null) {
                                    if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@fieldid"] == "EE_COST") {
                                        auxText = "<input type='radio' name='suppLifeRadio' value='radio" + iterator + "' onClick='buildSendXmlBindSuppLife({ selectionNumber : " + iterator + "}); updateMenuItemBind({ newValue : " + Number(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@value"]).toFixed(2) + "});'/>";
                                    }
                                    iterator2++;
                                }
                                //auxText = "<input type='radio' name='suppLifeRadio' value='radio" + iterator + "' onClick='buildSendXmlBindSuppLife({ selectionNumber : " + iterator + "}); updateMenuItemBind({ newValue : " + Number(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[5]["@value"]).toFixed(2) + "});'/>";
                                iterator++;
                            }
                        }
                    }
                    if (auxText != null) {
                        tmpData.push({
                            text: auxText != null ? auxText : '',
                            id: content["@fieldid"],
                            seqnr: headerIds.get(content['@fieldid'])
                        });
                    }
                }
            } .bind(this));
            this._sortArray(tmpData);
            if (!Object.isEmpty(tmpData[0]) && (tmpData[0].text == ''))
                tmpData[0].text = global.getLabel('viewDetails');
            tableData.rows.set('row' + i, {
                data: tmpData
                //               element: panel.getElement()
            });
            iterator++;
            var index = objectToArray(record.contents.yglui_str_wid_content).last()['@rec_index'];
            this._fieldsPanels.set(index, panel);
            if (!this.currentlySelected)
                this.currentlySelected = index;
        } .bind(this));
        return tableData;
    },

    updateBeneficiaryTbl: function(obj) {
    },

    changeClass: function(selectedObj) {
        if (this.lastRow) {
            this.lastRow.removeClassName("application_benefits_selected_tbl_row");
            this.lastRow.addClassName(this.lastRowClass);
            this.lastRow.isDefault = '';
            this.lastRow.lastChild.firstChild.className = "application_benefits_unselected_option";
        }
        this.lastRow = selectedObj.parentNode.parentNode;
        this.lastRowClass = $(selectedObj).parentNode.parentNode.className;
        $(selectedObj).parentNode.parentNode.removeClassName(this.lastRowClass);
        $(selectedObj).parentNode.parentNode.addClassName("application_benefits_selected_tbl_row");
        $(selectedObj).isDefault = 'X';
        $(selectedObj).parentNode.parentNode.lastChild.firstChild.className = "application_benefits_selected_option";
    },

    getRecords: function(pBenPlan, pBenOption) {
        var benPlan = "";
        var benOption = "";
        var returnArray = [];

        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            if (record['@screen'] == "1") {
                $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, i) {
                    if (field['@fieldid'] == "BEN_PLAN") {
                        benPlan = field['@value'];
                    } else if (field['@fieldid'] == "BEN_OPTION") {
                        benOption = field['@value'];
                    }
                } .bind(this));
            }

            if (benOption == pBenOption && benPlan == pBenPlan) {
                returnArray.push(record);
            }
        } .bind(this));

        if (returnArray.length == 1) {
            return returnArray[0];
        } else {
            return returnArray;
        }
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
        //this._parentClass.hashOfWidgets.get(this._appId).windowResizedAction();
    },

    createPlanArray: function() {
        this._planArray = [];
        var benPlan = "";
        var benOption = "";
        var prevBenPlan = "";
        var prevBenOption = "";

        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            if (record['@screen'] == "1") {

                $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, i) {
                    if (field['@fieldid'] == "BEN_PLAN") {
                        benPlan = field['@value'];
                    } else if (field['@fieldid'] == "BEN_OPTION") {
                        benOption = field['@value'];
                    }
                } .bind(this));

                if (benOption != prevBenOption || benPlan != prevBenPlan) {
                    this._planArray.push({
                        benPlan: benPlan,
                        benOption: benOption
                    });
                }

                prevBenPlan = benPlan;
                prevBenOption = benOption;
            }
        } .bind(this));
    },

    eoiExists: function() {
        return this._eoiPlanExists;
    }
});

var BeneficiariesPanel = Class.create(MultipleRecordsFieldsPanel, {
    _planArray: null,

    initialize: function($super, options, parentClass, selectedPanel, widScreen) {
        this._selectedPanel = selectedPanel;
        this._json = options.json;
        this._appId = options.appId;
        this.typeLink = false;
        this._options = options;
        this._fieldsPanels = new Hash();
        this._widScreen = widScreen;
        this._rowPointer = new Hash();
        this._contentPointer = new Hash();
        this._rowElement = new Hash();
        this._mode = options.mode;
        //$super();
        this._parentClass = parentClass;
        this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_REQUEST", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();
        this.entireXml = options.entireXml;
        this.percentageValues = new Array();

        writeXmlToBeneficiariesBind = this.writeXmlToBeneficiaries.bind(this);
        document.stopObserving("EWS:benefits_1_writeXmlToBeneficiaries");
        document.observe("EWS:benefits_1_writeXmlToBeneficiaries", writeXmlToBeneficiariesBind);

        if (this._json.EWS.o_field_values) {
            this.createPlanArray();


            this._tableStructure = this.createContent();
            this._generateStructure();
        }
        else {
            this._element = '<div style="clear:both;"></div><span>' + options.noResultsHtml + '</span>';
        }
        this.buildSendXml = function(args) {
            document.fire("EWS:benefits_1_sendXmlToApp", "Beneficiaries");
            if (args) {
                var args = getArgs(args);
                var selectionNumber = args.selectionNumber;
                var value = args.value;
                var primary = args.primary;

                var iterator = 0;
                var screenNumberIterator = 0;

                //If a radio button was changed
                if (primary != null) {
                    while (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator] != null) {
                        if ((screenNumberIterator == selectionNumber) && (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator]["@screen"] == 2)) {
                            if (primary) {
                                this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[6]["#text"] = "";
                                this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[6]["@value"] = "";
                            }
                            if (!primary) {
                                this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[6]["#text"] = "X";
                                this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[6]["@value"] = "X";
                            }
                        }
                        if (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator]["@screen"] == 2) {
                            screenNumberIterator++;
                        }
                        iterator++;
                    }
                }

                else if (value != null) {
                    while (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator] != null) {
                        if ((screenNumberIterator == selectionNumber) && (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator]["@screen"] == 2)) {
                            this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[3]["#text"] = value;
                            this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[3]["@value"] = value;
                        }
                        if (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator]["@screen"] == 2) {
                            screenNumberIterator++;
                        }
                        iterator++;
                    }
                    //                    document.fire("EWS:benefits_1_writeXmlToBackend", { json: this.xmlToBackend });
                }
            }
            else {

                if (!(this.xmlToBackend)) {
                    this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_BENEFITS", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();
                }
                this.xmlToBackend.EWS.SERVICE = "SAVE_BENEFITS";
                this.xmlToBackend.EWS.PARAM.APPID = appID;

                //this.xmlToBackend.EWS.PARAM.RECORDS = this._json.EWS.o_field_values;
                this.xmlToBackend.EWS.PARAM.RECORDS = this.entireXml.EWS.o_field_values;
            }

            document.fire("EWS:benefits_1_writeXmlToBackend", { json: this.xmlToBackend });
        } .bind(this);

        this.onKeyDown = function(obj, noDecimal, eventObject) {

            var event = (window.event) ? window.event : eventObject;
            //var keyID = event.keyCode;

            var lAllowedCharacters = new Array(8, 16, 46, 18, 37, 39, 9); // Keycode events for forward, back, delete, shift, backspace, alt 
            var i, j;

            if (obj.value.indexOf(" ") != -1) {
                obj.value = obj.value.replace(" ", "");
            }
            // Disallow if shift or ctl has been pressed
            if (event.ctrlKey == true) {
                event.returnValue = false;
                return;
            }
            // Allow numeric input
            if (((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105)) && event.shiftKey == false) {
                return;
            }

            // Allow 1 decimal to be used

            if (noDecimal != true) {
                if (global.commaSeparator == ".") {
                    if (event.keyCode == 190 || event.keyCode == 110) {
                        if (obj.value.indexOf(".") == -1) {
                            return;
                        } else {
                            event.returnValue = false;
                            return;
                        }
                    }
                    if (event.keyCode == 188) {
                        return;
                    }
                } else if (global.commaSeparator == ",") {
                    if (event.keyCode == 188) {
                        if (obj.value.indexOf(",") == -1) {
                            return;
                        } else {
                            event.returnValue = false;
                            return;
                        }
                    }
                    if (event.keyCode == 190 || event.keyCode == 110) {
                        return;
                    }

                }
            }

            // Allow nagivation characters
            for (i = 0; i < lAllowedCharacters.length; ++i) {
                if (event.keyCode == lAllowedCharacters[i]) {
                    return
                }
            }
            if (window.event) {
                event.returnValue = false;
            }
            else {
                eventObject.cancelBubble = true;
            }
        } .bind(this);

        buildSendXmlBind = this.buildSendXml.bind(this);

        updatePercentagesBind = this.updatePercentages.bind(this);

        onKeyDownBind = this.onKeyDown.bind(this);

        buildSendXmlBind();
    },

    writeXmlToBeneficiaries: function(args) {
        var args = getArgs(args);
        var json = args.json;

        if (json) {
            this.xmlToBackend = json;
        }
    },

    updatePercentages: function(args) {
        var args = getArgs(args);
        var itemNumber = args.itemNumber;
        var value = args.value;

        this.percentageValues[itemNumber] = Number(value);
    },

    errorCheck: function() {
        var iterator = 0;
        if ("percentage" + iterator) { }
    },

    createContent: function() {
        var tableData = {
            header: [],
            rows: $H()
        };
        var tmpHeader = [];
        var headerIds = new Hash();
        var iterator = 0;
        var ctgRelev = true;

        //Getting the header
        this.setLabels();
        $A(this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field).each(function(item) {
            if (item['@fieldtype'] == 'H' && item['@display_attrib'] != 'HID') {
                tmpHeader.push({
                    text: item['@fieldid'] != null ? (this.labels.get(item['@fieldid']) == null ? '' : this.labels.get(item['@fieldid'])) : item['@fieldid'],
                    //text: '',
                    id: item['@fieldid'],
                    seqnr: item['@seqnr']
                });
                headerIds.set(item['@fieldid'], item['@seqnr']);
            }
        } .bind(this));
        //Sorting the header by seqnr
        this._sortArray(tmpHeader);
        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            var tmpData = [];
            if (this._selectedPanel === i)
                record.contents.yglui_str_wid_content['@selected'] = 'X';
            else
                record.contents.yglui_str_wid_content['@selected'] = '';
            // WORKING CODE
            //var tmpJson = deepCopy(this._json);
            //tmpJson.EWS.o_field_values.yglui_str_wid_record = objectToArray(tmpJson.EWS.o_field_values.yglui_str_wid_record)[i];
            // END WORKING CODE

            // JUSTIN'S TEST CODE
            var tmpJson = { 'EWS': { 'o_date_ranges': '', 'o_field_settings': '', 'o_field_values': '', 'o_screen_buttons': '', 'o_widget_screens': '', 'labels': '', 'messages': '', 'webmessage_type': '', 'webmessage_text': ''} };
            tmpJson.EWS.labels = this._json.EWS.labels;
            tmpJson.EWS.o_field_settings = this._json.EWS.o_field_settings;
            tmpJson.EWS.o_widget_screens = this._json.EWS.o_widget_screens;
            tmpJson.EWS.o_field_values = this._json.EWS.o_field_values;
            tmpJson.EWS.o_field_values.yglui_str_wid_record = objectToArray(tmpJson.EWS.o_field_values.yglui_str_wid_record)[i];
            // END JUSTIN'S TEST CODE

            this._sortArray(tmpData);

            var panel = new getContentModule({
                appId: this._appId,
                mode: this._mode,
                json: tmpJson,
                showCancelButton: false,
                buttonsHandlers: $H({
                    DEFAULT_EVENT_THROW: 'EWS:pdcChange_' + '_' + this._appId,
                    paiEvent: 'EWS:paiEvent_' + this._appId + '_' + this._widScreen
                }),
                showButtons: $H({
                    edit: false,
                    display: false,
                    create: false
                })
            });
            
            /*var panel = new fieldsPanel({
                appId: this._appId,
                mode: this._mode,
                json: tmpJson,
                event: 'EWS:pdcChange_' + '_' + this._appId,
                noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                paiEvent: 'EWS:paiEvent_' + this._appId + '_' + this._widScreen,
                validForm: 'EWS:validFormHandler_' + this._appId + '_' + this._widScreen
            });*/

            objectToArray(record.contents.yglui_str_wid_content).last().fields.yglui_str_wid_field.each(function(content, j) {
                if (headerIds.get(content['@fieldid']) != undefined) {
                    auxText = null;
                    if (this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field[j]["@display_attrib"] != "HID") {
                        if ((this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field[j]["@fieldformat"] != "R") && (this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field[j]["@fieldformat"] != "I")) {
                            if ((record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["#text"] != '') && (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["#text"] != null)) {
                                if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["@fieldid"] == "DATE_BIRTH") {
                                    auxText = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["#text"];
                                    sapFormatDate = auxText.substr(0, 4) + "-" + auxText.substr(4, 2) + "-" + auxText.substr(6, 2);
                                    auxText = Date.parseExact(sapFormatDate, "yyyy-MM-dd").toString(global.dateFormat);
                                }
                                else {
                                    auxText = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["#text"];
                                }
                            }
                            else {
                                if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["@fieldid"] == "DATE_BIRTH") {
                                    auxText = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["@value"];
                                    sapFormatDate = auxText.substr(0, 4) + "-" + auxText.substr(4, 2) + "-" + auxText.substr(6, 2);
                                    auxText = Date.parseExact(sapFormatDate, "yyyy-MM-dd").toString(global.dateFormat);
                                }
                                else {
                                    auxText = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["@value"];
                                }
                            }
                        }
                        if (this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field[j]["@fieldformat"] == "R") {

                            /*var k = 0;
                            while (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[k] != null) {
                                if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[k]["@fieldid"] == "CTG_RELEV") {
                                    if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[k]["@value"] == null)
                                        ctgRelev = false;
                                    else
                                        ctgRelev = true;
                                }
                                k++;
                            }*/
                            if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["@value"] == 'X') {
                                //if (ctgRelev) {
                                    auxText = "<input type='radio' name='dependentsRadio" + iterator + "' value='dependentsRadio" + iterator + "' onClick='buildSendXmlBind({ selectionNumber : " + iterator + ", primary: true})'/>";
                                    tmpData.push({
                                        text: auxText != null ? auxText : '',
                                        id: '',
                                        seqnr: headerIds.get(content['@fieldid'])
                                    });
                                    auxText = "<input type='radio' name='dependentsRadio" + iterator + "' value='dependentsRadio" + iterator + "' checked='true' onClick='buildSendXmlBind({ selectionNumber : " + iterator + ", primary: false})'/>";
                                    tmpData.push({
                                        text: auxText != null ? auxText : '',
                                        id: '',
                                        seqnr: headerIds.get(content['@fieldid'])
                                    });
                                //}
                                auxText = null;
                                iterator++;
                            }
                            else {
                                auxText = "<input type='radio' name='dependentsRadio" + iterator + "' value='dependentsRadio" + iterator + "' checked='true' onClick='buildSendXmlBind({ selectionNumber : " + iterator + ", primary: true})'/>";
                                if (ctgRelev) {
                                    tmpData.push({
                                        text: auxText != null ? auxText : '',
                                        id: '',
                                        seqnr: headerIds.get(content['@fieldid'])
                                    });
                                    auxText = "<input type='radio' name='dependentsRadio" + iterator + "' value='dependentsRadio" + iterator + "' onClick='buildSendXmlBind({ selectionNumber : " + iterator + ", primary: false})'/>";
                                    tmpData.push({
                                        text: auxText != null ? auxText : '',
                                        id: '',
                                        seqnr: headerIds.get(content['@fieldid'])
                                    });
                                }
                                auxText = null;
                                iterator++;
                            }
                        }
                        if (this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field[j]["@fieldformat"] == "I") {

                            auxText = "<input type='text' size = '1' maxLength = '3' id='percentage" + iterator + "' value='" + record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["@value"] + "' onchange='updatePercentagesBind({ itemNumber : " + iterator + ", value: this.value }); buildSendXmlBind({ selectionNumber : " + iterator + ", value: this.value }); javascript:document.fire(\"EWS:benefits_1_updateMenuItem\" );' onkeydown='onKeyDownBind(this, true, event);'/>";

                            this.percentageValues[iterator] = 0;
                        }
                    }
                    if (auxText != null) {
                        tmpData.push({
                            text: auxText != null ? auxText : '',
                            id: '',
                            seqnr: headerIds.get(content['@fieldid'])
                        });
                    }
                }

            } .bind(this));
            this._sortArray(tmpData);
            if (!Object.isEmpty(tmpData[0]) && (tmpData[0].text == ''))
                tmpData[0].text = global.getLabel('viewDetails');
            tableData.rows.set('row' + i, {
                data: tmpData,
                rowsClassName: "application_benefits_align_left"
                //               element: panel.getElement()
            });
            var index = objectToArray(record.contents.yglui_str_wid_content).last()['@rec_index'];
            this._fieldsPanels.set(index, panel);
            if (!this.currentlySelected)
                this.currentlySelected = index;
        } .bind(this));
        if (ctgRelev) {
            tmpHeader.last().text = "Primary"
            tmpHeader.push({
                text: "Contingent",
                id: "CONTINGENT",
                seqnr: 6
            });
        }
        tableData.header = tmpHeader;
        return tableData;
    },

    getRecords: function(pBenPlan, pBenOption) {
        var benPlan = "";
        var benOption = "";
        var returnArray = [];

        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            if (record['@screen'] == "1") {
                $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, i) {
                    if (field['@fieldid'] == "BEN_PLAN") {
                        benPlan = field['@value'];
                    } else if (field['@fieldid'] == "BEN_OPTION") {
                        benOption = field['@value'];
                    }
                } .bind(this));
            }

            if (benOption == pBenOption && benPlan == pBenPlan) {
                returnArray.push(record);
            }
        } .bind(this));

        if (returnArray.length == 1) {
            return returnArray[0];
        } else {
            return returnArray;
        }
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
        //this._parentClass.hashOfWidgets.get(this._appId).windowResizedAction();
    },

    createPlanArray: function() {
        this._planArray = [];
        var benPlan = "";
        var benOption = "";
        var prevBenPlan = "";
        var prevBenOption = "";

        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            if (record['@screen'] == "1") {

                $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, i) {
                    if (field['@fieldid'] == "BEN_PLAN") {
                        benPlan = field['@value'];
                    } else if (field['@fieldid'] == "BEN_OPTION") {
                        benOption = field['@value'];
                    }
                } .bind(this));

                if (benOption != prevBenOption || benPlan != prevBenPlan) {
                    this._planArray.push({
                        benPlan: benPlan,
                        benOption: benOption
                    });
                }

                prevBenPlan = benPlan;
                prevBenOption = benOption;
            }
        } .bind(this));
    }
});

var DependentsPanel = Class.create(MultipleRecordsFieldsPanel, {
    _planArray: null,

    initialize: function($super, options, parentClass, selectedPanel, widScreen) {
        this._selectedPanel = selectedPanel;
        this._json = options.json;
        this._appId = options.appId;
        this.typeLink = false;
        this._options = options;
        this._fieldsPanels = new Hash();
        this._widScreen = widScreen;
        this._rowPointer = new Hash();
        this._contentPointer = new Hash();
        this._rowElement = new Hash();
        this._mode = options.mode;
        this._parentClass = parentClass;
        this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_REQUEST", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();
        this.entireXml = options.entireXml;
        this.percentageValues = new Array();
        this.dependentsInfo = options.dependentsCheckboxInfo;

        writeXmlToBeneficiariesBind = this.writeXmlToBeneficiaries.bind(this);
        document.stopObserving("EWS:benefits_1_writeXmlToBeneficiaries");
        document.observe("EWS:benefits_1_writeXmlToBeneficiaries", writeXmlToBeneficiariesBind);


        updateCheckboxesBind = this.updateCheckboxes.bind(this);
        document.stopObserving("EWS:benefits_1_updateCheckboxes");
        document.observe("EWS:benefits_1_updateCheckboxes", updateCheckboxesBind);

        if (this._json.EWS.o_field_values) {
            this.createPlanArray();
            this._tableStructure = this.createContent();
            this._generateStructure();
        }
        else {
            this._element = '<div style="clear:both;"></div><span>' + options.noResultsHtml + '</span>';
        }
        this.buildSendXml = function(args) {
            document.fire("EWS:benefits_1_sendXmlToApp", "Beneficiaries");
            if (args) {
                var args = getArgs(args);
                var selectionNumber = args.selectionNumber;
                var checked = args.checked;

                var iterator = 0;
                var screenNumberIterator = 0;

                //If a radio button was changed
                while (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator] != null) {
                    if ((screenNumberIterator == selectionNumber) && (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator]["@screen"] == 2)) {
                        if (checked) {
                            var iterator2 = 0;
                            while (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2] != null) {
                                if (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@fieldid"] == "SELECTED") {
                                    this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["#text"] = "X";
                                    this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@value"] = "X";
                                }
                                iterator2++;
                            }
                        }
                        if (!checked) {
                            var iterator2 = 0;
                            while (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2] != null) {
                                if (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@fieldid"] == "SELECTED") {
                                    this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["#text"] = "";
                                    this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator2]["@value"] = "";
                                }
                                iterator2++;
                            }
                        }
                    }
                    if (this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[iterator]["@screen"] == 2) {
                        screenNumberIterator++;
                    }
                    iterator++;
                }
            }
            else {

                if (!(this.xmlToBackend)) {
                    this.xmlToBackend = '{ "EWS": { "SERVICE" : "SAVE_BENEFITS", "PARAM": { "APPID" : "", "RECORDS": "" }}}'.evalJSON();
                }
                this.xmlToBackend.EWS.SERVICE = "SAVE_BENEFITS";
                this.xmlToBackend.EWS.PARAM.APPID = appID;

                this.xmlToBackend.EWS.PARAM.RECORDS = this.entireXml.EWS.o_field_values;
            }

            document.fire("EWS:benefits_1_writeXmlToBackend", { json: this.xmlToBackend });
        } .bind(this);

        buildSendXmlBind = this.buildSendXml.bind(this);

        updatePercentagesBind = this.updatePercentages.bind(this);

        buildSendXmlBind();

        document.fire("EWS:benefits_1_disableDependentsCheckboxes");
    },

    updateCheckboxes: function(args) {
        var checkboxes = objectToArray(this.getElement().select("[id='dependentsCheckbox']"));
        var coverageInfo = args.memo;
        var coverageSubtype = null;
        var depType = '';

        for (var x = 0; x < checkboxes.length; x++) {
            depType = checkboxes[x].attributes.getNamedItem("deptype").value;
            coverageSubtype = coverageInfo.get(depType);

            if (coverageSubtype == null || coverageSubtype.maxDep == 0) {
                if (checkboxes[x].checked) {
                    checkboxes[x].click();
                }
                checkboxes[x].disabled = true;
            } else {
                checkboxes[x].disabled = false;
                if (!(checkboxes[x].checked)) {
                    //checkboxes[x].click();
                    checkboxes[x].checked = true;
                    this.buildSendXml({ selectionNumber: x, checked: checkboxes[x].checked })
                }
            }

        }
    },

    writeXmlToBeneficiaries: function(args) {
        var args = getArgs(args);
        var json = args.json;

        if (json) {
            this.xmlToBackend = json;
        }
    },

    updatePercentages: function(args) {
        var args = getArgs(args);
        var itemNumber = args.itemNumber;
        var value = args.value;

        this.percentageValues[itemNumber] = Number(value);
    },

    errorCheck: function() {
        var iterator = 0;
        if ("percentage" + iterator) { }
    },

    createContent: function() {
        var tableData = {
            header: [],
            rows: $H()
        };
        var tmpHeader = [];
        var headerIds = new Hash();
        var iterator = 0;
        //Getting the header
        this.setLabels();
        $A(this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field).each(function(item) {
            if (item['@fieldtype'] == 'H' && item['@display_attrib'] != 'HID') {
                tmpHeader.push({
                    text: item['@fieldid'] != null ? (this.labels.get(item['@fieldid']) == null ? '' : this.labels.get(item['@fieldid'])) : item['@fieldid'],
                    id: item['@fieldid'],
                    seqnr: item['@seqnr']
                });
                headerIds.set(item['@fieldid'], item['@seqnr']);
            }
        } .bind(this));
        //Sorting the header by seqnr
        this._sortArray(tmpHeader);
        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            var tmpData = [];
            if (this._selectedPanel === i)
                record.contents.yglui_str_wid_content['@selected'] = 'X';
            else
                record.contents.yglui_str_wid_content['@selected'] = '';
            this._sortArray(tmpData);

            objectToArray(record.contents.yglui_str_wid_content).last().fields.yglui_str_wid_field.each(function(content, j) {
                if (headerIds.get(content['@fieldid']) != undefined) {
                    auxText = null;
                    //If not a checkbox
                    var fieldFormatLooper = 0;
                    var fieldFormat;
                    while (this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field[fieldFormatLooper] != null) {
                        if (this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field[fieldFormatLooper]["@fieldid"] == content['@fieldid']) {
                            fieldFormat = this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field[fieldFormatLooper]["@fieldformat"];
                        }
                        fieldFormatLooper++;
                    }

                    if (fieldFormat != "C") {
                        if ((record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["#text"] != '') && (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["#text"] != null)) {
                            if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["@fieldid"] == "DATE_BIRTH") {
                                auxText = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["#text"];
                                sapFormatDate = auxText.substr(0, 4) + "-" + auxText.substr(4, 2) + "-" + auxText.substr(6, 2);
                                auxText = Date.parseExact(sapFormatDate, "yyyy-MM-dd").toString(global.dateFormat);
                            }
                            else {
                                auxText = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["#text"];
                            }
                        }
                        else {
                            if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["@fieldid"] == "DATE_BIRTH") {
                                auxText = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["@value"];
                                sapFormatDate = auxText.substr(0, 4) + "-" + auxText.substr(4, 2) + "-" + auxText.substr(6, 2);
                                auxText = Date.parseExact(sapFormatDate, "yyyy-MM-dd").toString(global.dateFormat);
                            }
                            else {
                                auxText = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["@value"];
                            }
                        }
                    }
                    //If checkbox
                    if (fieldFormat == "C") {
                        var ctgRelev = true;
                        var depType = "";
                        var k = 0;
                        while (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[k] != null) {
                            if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[k]["@fieldid"] == "DEP_TYPE") {
                                depType = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[k]["@value"];
                            }
                            k++;
                        }
                        if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[j]["@value"] == 'X') {
                            auxText = "<input id='dependentsCheckbox' type='checkbox' depType='" + depType + "' name='dependentsCheckbox'" + iterator + " value='dependentsCheckbox" + iterator + "' checked='true' onClick='buildSendXmlBind({ selectionNumber : " + iterator + ", checked: this.checked}); javascript:document.fire(\"EWS:benefits_1_updateMenuItem\" ); '/>";
                            //                            auxText = "<input id='dependentsCheckbox' type='checkbox' depType='" + depType + "' name='dependentsCheckbox'" + iterator + " value='dependentsCheckbox" + iterator + "' checked='true' onClick='buildSendXmlBind({ selectionNumber : " + iterator + ", checked: this.checked})'/>";
                            tmpData.push({
                                text: auxText != null ? auxText : '',
                                id: '',
                                seqnr: headerIds.get(content['@fieldid'])
                            });
                            auxText = null;
                            iterator++;
                        }
                        else {
                            auxText = "<input id='dependentsCheckbox' type='checkbox' depType='" + depType + "' name='dependentsCheckbox" + iterator + "' value='dependentsCheckbox" + iterator + "' onClick='buildSendXmlBind({ selectionNumber : " + iterator + ", checked: this.checked}); javascript:document.fire(\"EWS:benefits_1_updateMenuItem\" ); '/>";
                            //                            auxText = "<input id='dependentsCheckbox' type='checkbox' depType='" + depType + "' name='dependentsCheckbox" + iterator + "' value='dependentsCheckbox" + iterator + "' onClick='buildSendXmlBind({ selectionNumber : " + iterator + ", checked: this.checked})'/>";
                            tmpData.push({
                                text: auxText != null ? auxText : '',
                                id: '',
                                seqnr: headerIds.get(content['@fieldid'])
                            });
                            auxText = null;
                            iterator++;
                        }
                    }
                    if (auxText != null) {
                        tmpData.push({
                            text: auxText != null ? auxText : '',
                            id: '',
                            seqnr: headerIds.get(content['@fieldid'])
                        });
                    }
                }
                tableData.header = tmpHeader;
            } .bind(this));
            this._sortArray(tmpData);
            if (!Object.isEmpty(tmpData[0]) && (tmpData[0].text == ''))
                tmpData[0].text = global.getLabel('viewDetails');
            tableData.rows.set('row' + i, {
                data: tmpData,
                rowsClassName: "application_benefits_align_left"
            });
            var index = objectToArray(record.contents.yglui_str_wid_content).last()['@rec_index'];
            //this._fieldsPanels.set(index, panel);
            if (!this.currentlySelected)
                this.currentlySelected = index;
        } .bind(this));
        return tableData;
    },

    getRecords: function(pBenPlan, pBenOption) {
        var benPlan = "";
        var benOption = "";
        var returnArray = [];

        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            if (record['@screen'] == "1") {
                $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, i) {
                    if (field['@fieldid'] == "BEN_PLAN") {
                        benPlan = field['@value'];
                    } else if (field['@fieldid'] == "BEN_OPTION") {
                        benOption = field['@value'];
                    }
                } .bind(this));
            }

            if (benOption == pBenOption && benPlan == pBenPlan) {
                returnArray.push(record);
            }
        } .bind(this));

        if (returnArray.length == 1) {
            return returnArray[0];
        } else {
            return returnArray;
        }
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
        //this._parentClass.hashOfWidgets.get(this._appId).windowResizedAction();
    },

    createPlanArray: function() {
        this._planArray = [];
        var benPlan = "";
        var benOption = "";
        var prevBenPlan = "";
        var prevBenOption = "";

        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            if (record['@screen'] == "1") {

                $A(objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field)).each(function(field, i) {
                    if (field['@fieldid'] == "BEN_PLAN") {
                        benPlan = field['@value'];
                    } else if (field['@fieldid'] == "BEN_OPTION") {
                        benOption = field['@value'];
                    }
                } .bind(this));

                if (benOption != prevBenOption || benPlan != prevBenPlan) {
                    this._planArray.push({
                        benPlan: benPlan,
                        benOption: benOption
                    });
                }

                prevBenPlan = benPlan;
                prevBenOption = benOption;
            }
        } .bind(this));
    }
});

var dependentsInfoScreen = Class.create({

    dependentsInfo: $H({}),
     
    initialize: function(xmlIn) {

        var xmlInput;

        $A(objectToArray(xmlIn.xmlIn.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            var coverageID;
            var minDep;
            var maxDep;
            var minTotal;
            var maxTotal;
            var subType;

            var coverageInformation = Class.create({ coverageID: '', minDep: '', maxDep: '', minTotal: '', maxTotal: '', subType: '' });

            var iterator = 0;
            var dependentsTypes;

            while (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator] != null) {
                if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@fieldid"] == "COVID") {
                    coverageID = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@value"];
                }
                if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@fieldid"] == "MIN_DEP") {
                    minDep = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@value"];
                }
                if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@fieldid"] == "MAX_DEP") {
                    maxDep = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@value"];
                }
                if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@fieldid"] == "MIN_TOTAL") {
                    minTotal = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@value"];
                }
                if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@fieldid"] == "MAX_TOTAL") {
                    maxTotal = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@value"];
                }
                if (record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@fieldid"] == "SUBTY") {
                    subType = record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@value"];
                    if (!subType) {
                        subType = "";
                    }
                }
                iterator++;
            }

            var singleCoverageInfo = new coverageInformation();
            singleCoverageInfo.coverageID = coverageID;
            singleCoverageInfo.minDep = minDep;
            singleCoverageInfo.maxDep = maxDep;
            singleCoverageInfo.minTotal = minTotal;
            singleCoverageInfo.maxTotal = maxTotal;
            singleCoverageInfo.subType = subType;

            if (!this.dependentsInfo.get(coverageID)) {
                this.dependentsInfo.set(coverageID, new Hash());
            }
            if (!this.dependentsInfo.get(coverageID).get(subType)) {
                this.dependentsInfo.get(coverageID).set(subType, singleCoverageInfo);
            }

        }.bind(this));
    }

});

var healthSavingsPlanScreen = Class.create({

    labels: null,
    valuesHash: null,
    textHash: null,
    payPeriods: null,
    xmlToBackend: null,
    contributionHash: $H({}),
    contributionAmount: null,

    calculateContributionAmount: function(args) {
        contributionAmount = 0;
        this.contributionHash.each(function(i) {
            if (args.screen == null) {
                if (i[0].indexOf(args.memo.screen) != -1) {
                    contributionAmount += i.value;
                }
            }
            else {
                if (i[0].indexOf(args.screen) != -1) {
                    contributionAmount += i.value;
                }
            }
        });
        this.setContributionAmount(contributionAmount);
    },

    setContributionAmount: function(value) {
        if (!isNaN(Number(value))) {
            document.fire("EWS:benefits_1_updateMenuItem", { newValue: Number(value) });
        }
        if (!isNaN(Number(getArgs(value).value))) {
            document.fire("EWS:benefits_1_updateMenuItem", { newValue: Number(getArgs(value).value) });
        }
    },

    initialize: function() {
        calculateContributionAmountBind = this.calculateContributionAmount.bind(this);
        document.stopObserving("EWS:benefits_1_calculateContributionAmount");
        document.observe("EWS:benefits_1_calculateContributionAmount", calculateContributionAmountBind);

        setContributionAmountBind = this.setContributionAmount.bind(this);
        document.stopObserving("EWS:benefits_1_setContributionAmount");
        document.observe("EWS:benefits_1_setContributionAmount", setContributionAmountBind);
    },

    createHealthSavingsPlanTable: function(taxType, contributionType, abbreviatedContributionType, bonusType, valueField, minField, maxField, labels, valuesHash, textHash, payPeriods, xmlToBackend) {
        this.xmlToBackend = xmlToBackend;

        this.labels = labels;
        this.valuesHash = valuesHash;
        this.textHash = textHash;
        this.payPeriods = payPeriods;

        var taxTypeText = taxType;
        var contributionTypeText = contributionType;
        var abbreviationContributionTypeText = abbreviatedContributionType;
        var bonusTypeText = bonusType;
        var valueFieldName = valueField;
        var minFieldName = minField;
        var maxFieldName = maxField;

        var upperCaseTaxTypeText = taxTypeText.substr(0, 1).toUpperCase() + taxTypeText.substr(1, taxTypeText.length);
        var XMLArray = objectToArray(this.xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record);
        var annualValueExists = null;
        if (contributionTypeText == "Amount") {
            annualValueExists = true;
        }
        else {
            annualValueExists = false;
        }

        var updateXml = function(args) {
            var args = getArgs(args);
            var sapFieldId = args.sapFieldId;
            var frontendField = args.frontendField;
            var iterator = 0;
            while (XMLArray[0].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator] != null) {
                if (XMLArray[0].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@fieldid"] == sapFieldId) {
                    XMLArray[0].contents.yglui_str_wid_content.fields.yglui_str_wid_field[iterator]["@value"] = Number(displayToLong(frontendField.value));
                }
                iterator++;
            }
            document.fire("EWS:benefits_1_writeXmlToBackend", { json: this.xmlToBackend });
        } .bind(this)

        fieldToEdit = valueFieldName;

        var mainDiv = new Element('div', {});
        var mainTable = new Element('table', {});
        var mainTbody = new Element('tbody', {});
        var tableRow1 = new Element('tr', {});
        var tableCell1 = new Element('td', { 'id': taxTypeText + contributionTypeText + 'Label', width: '35%', 'style': 'text-align:left' });
        var tableCell2 = new Element('td', { 'id': taxTypeText + contributionTypeText + 'Field', width: '15%', 'style': 'text-align:right; padding-right:20px' });
        var tableCell3 = new Element('td', { 'id': taxTypeText + 'Min', width: '35%', 'style': 'text-align:left' });
        var tableCell4 = new Element('td', { 'id': taxTypeText + 'Min' + contributionTypeText, width: '15%' });
        var tableRow2 = new Element('tr', {});
        var tableCell5 = new Element('td', { 'id': 'annual' + upperCaseTaxTypeText + contributionTypeText + 'Label', width: '35%', 'style': 'text-align:left' });
        var tableCell6 = new Element('td', { 'id': 'annual' + upperCaseTaxTypeText + contributionTypeText + 'Field', width: '15%', 'style': 'text-align:right; padding-right:20px' });
        var tableCell7 = new Element('td', { 'id': taxTypeText + 'Max', width: '35%', 'style': 'text-align:left' });
        var tableCell8 = new Element('td', { 'id': taxTypeText + 'MaxAmount', width: '15%' });
        mainTable.insert(mainTbody);
        mainTbody.insert(tableRow1);
        mainTbody.insert(tableRow2);
        tableRow1.insert(tableCell1);
        tableRow1.insert(tableCell2);
        tableRow1.insert(tableCell3);
        tableRow1.insert(tableCell4);
        tableRow2.insert(tableCell5);
        tableRow2.insert(tableCell6);
        tableRow2.insert(tableCell7);
        tableRow2.insert(tableCell8);

        var mainLabel = new Element("span", {}).update(this.labels.get(taxTypeText + bonusTypeText + contributionTypeText));
        tableCell1.insert(mainLabel);
        var mainField = new Element("input", { 'id': taxTypeText + bonusTypeText + contributionTypeText, 'type': 'text', 'value': longToDisplay(Number(valuesHash.get(valueFieldName))), 'style': 'text-align:right', size: '10', maxLength: '8' });
        if (contributionType == "Amount") {
            mainField.observe("blur", function() {
                if (mainField.value.indexOf(',') == -1 && mainField.value.indexOf('.') == -1) {
                    mainField.value = longToDisplay(Number(mainField.value));
                    //this.contributionHash.set(taxTypeText + bonusTypeText + contributionTypeText + xmlToBackend.EWS.PARAM.RECORDS.yglui_str_wid_record[0].contents.yglui_str_wid_content["@key_str"], Number(mainField.value));
                }
                //else {
                this.contributionHash.set(taxTypeText + bonusTypeText + contributionTypeText + XMLArray[0].contents.yglui_str_wid_content["@key_str"], Number(displayToLong(mainField.value)));
                //}
                this.calculateContributionAmount({ 'screen': XMLArray[0].contents.yglui_str_wid_content["@key_str"] });
            } .bind(this));
            this.contributionHash.set(taxTypeText + bonusTypeText + contributionTypeText + XMLArray[0].contents.yglui_str_wid_content["@key_str"], Number(valuesHash.get(valueFieldName)));
        }
        tableCell2.insert(mainField);

        var annualLabel = new Element("span", {}).update(this.labels.get("annual" + upperCaseTaxTypeText + bonusTypeText + contributionTypeText));
        tableCell5.insert(annualLabel);
        if (annualValueExists) {
            var annualField = new Element("span", { 'style': 'text-align:right' }).update(longToDisplay(Number((Number(valuesHash.get(valueFieldName)) * Number(payPeriods)))));
        }
        else {
            var annualField = new Element("span", { 'style': 'text-align:right' }).update();
        }
        tableCell6.insert(annualField);
        var minLabel = new Element("span", {}).update(this.labels.get(taxTypeText + bonusTypeText + abbreviationContributionTypeText + "Min"));
        if (valuesHash.get(minFieldName) == null) {
            valuesHash.set(minFieldName, "0.0");
        }
        var minValue = new Element("span", { 'style': 'text-align:right' }).update((longToDisplay(Number(Number(valuesHash.get(minFieldName)) * Number(payPeriods)))));
        tableCell3.insert(minLabel);
        tableCell4.insert(minValue);
        var maxLabel = new Element("span", {}).update(this.labels.get(taxTypeText + bonusTypeText + abbreviationContributionTypeText + "Max"));
        if (valuesHash.get(maxFieldName) == null) {
            valuesHash.set(maxFieldName, "0.0");
        }
        var maxValue = new Element("span", { 'style': 'text-align:right' }).update(longToDisplay(Number((Number(valuesHash.get(maxFieldName)) * Number(payPeriods)))));
        tableCell7.insert(maxLabel);
        tableCell8.insert(maxValue);

        var onKeyDown = function(obj, noDecimal, eventObject) {

            var event = (window.event) ? window.event : eventObject;
            //var keyID = event.keyCode;

            var lAllowedCharacters = new Array(8, 16, 46, 18, 37, 39, 9, 188); // Keycode events for forward, back, delete, shift, backspace, alt 
            var i, j;

            if (obj.value.indexOf(" ") != -1) {
                obj.value = obj.value.replace(" ", "");
            }
            // Disallow if shift or ctl has been pressed
            if (event.ctrlKey == true) {
                event.returnValue = false;
                return;
            }
            // Allow numeric input
            if (((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105)) && event.shiftKey == false) {
                return;
            }

            // Allow 1 decimal to be used

            if (noDecimal != true) {
                if (global.commaSeparator == ".") {
                    if (event.keyCode == 190 || event.keyCode == 110) {
                        if (obj.value.indexOf(".") == -1) {
                            return;
                        } else {
                            event.returnValue = false;
                            return;
                        }
                    }
                    if (event.keyCode == 188) {
                        return;
                    }
                } else if (global.commaSeparator == ",") {
                    if (event.keyCode == 188) {
                        if (obj.value.indexOf(",") == -1) {
                            return;
                        } else {
                            event.returnValue = false;
                            return;
                        }
                    }
                    if (event.keyCode == 190 || event.keyCode == 110) {
                        return;
                    }

                }
            }

            // Allow nagivation characters
            for (i = 0; i < lAllowedCharacters.length; ++i) {
                if (event.keyCode == lAllowedCharacters[i]) {
                    return
                }
            }
            if (window.event) {
                event.returnValue = false;
            }
            else {
                eventObject.cancelBubble = true;
            }
        } .bind(this);

        mainField.observe("blur", function(args) { if (annualValueExists) { annualField.update(longToDisplay(Number((Math.round((Number(displayToLong(mainField.value)) * Number(payPeriods)) * 100) / 100).toFixed(2)))); } updateXml({ 'sapFieldId': valueFieldName, 'frontendField': mainField }); } .bind(this));
        mainField.observe("keydown", function(event) { onKeyDown(mainField, false, event); });

        return mainTable;
    }
});