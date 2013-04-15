
var CATLFollowUp = Class.create(Application, {

    getParticipantsService: 'GET_PARTICIPNT',
    getParticipantsServiceCurr: 'GET_PART_CUR',
    followUpService: 'FOLLOW_UP',
    /*
    *@method initialize
    *@param $super: the superclass: Application
    *@desc instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
        this.attendedSelectedBinding = this.attendedSelected.bind(this);
    },

    /*
    *@method run
    *@param $super: the superclass: Application
    * which have changed.
    */
    run: function($super, args) {
        $super();
        this.objectId = getArgs(args).get('objectId');
        this.prevApp = getArgs(args).get('prevApp');
        this.objType = getArgs(args).get('objectType');
        this.hasOfParticipants = $H();
        this.hashOfMultiselects = $H();
        this.getParticipants();
        document.observe('EWS:folloUp_attendedChecked', this.attendedSelectedBinding);
    },
    /**     
    *@description Initial service which gets the participants
    */
    getParticipants: function() {
        if (this.objType == 'EC'){
            var xml = "<EWS>"
                        + "<SERVICE>" + this.getParticipantsServiceCurr + "</SERVICE>"
                        + "<OBJECT TYPE=\"EC\">" + this.objectId + "</OBJECT>"
                     + "</EWS>";
        }else{
            var xml = "<EWS>"
                        + "<SERVICE>" + this.getParticipantsService + "</SERVICE>"
                        + "<OBJECT TYPE=\"E\">" + this.objectId + "</OBJECT>"
                     + "</EWS>";
        }
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'setParticipants' }));
    },
    /**     
    *@param data {JSON} labels and root node information
    *@description It sets the initial application screen using the information sent by SAP,
    */
    setParticipants: function(data) {
        if (!Object.isEmpty(data.EWS.o_participant)) {
            var xmlParser = new XML.ObjTree();
            xmlParser.attr_prefix = '@';
            var xmlDoc = xmlParser.writeXML(data.EWS.o_participant)
            this.oldParticipantsTable = xmlDoc.substr(xmlDoc.indexOf('<lso_followup'));
            var participants = objectToArray(data.EWS.o_participant);
            var participantsTable = "<table style='width:100%' class='sortable' id='" + this.appName + "_participants'><thead>";
            var passColumn = !Object.isEmpty(data.EWS.o_pas) ? "<th id='" + this.appName + "_participantsPass'>" + global.getLabel('pass') + "</th>" : '';
            var appraisalDocsColumn = !Object.isEmpty(data.EWS.o_lca) ? "<th id='" + this.appName + "_participantsAppraisalDocs'>" + global.getLabel('appraisalDocs') + "</th>" : '';
            participantsTable += "<tr>" +
                                    "<th class='table_sortfirstdesc' id='" + this.appName + "_participantsNames'>" + global.getLabel('participants') + "</th>" +
                                    "<th id='" + this.appName + "_participantsAttended'>" + global.getLabel('attended') + "</th>" +
                                    passColumn +
                                    appraisalDocsColumn +
                                 "</tr>";
            participantsTable += "</thead><tbody>";
            this.employees = objectToArray(data.EWS.o_ee_name.yglui_str_ee_name);
            this.employeesInCourse = $A();
            for (var i = 0; i < participants.length; i++) {
                this.participants = objectToArray(participants[i].lso_followup_rfc);
                this.participantsLength = this.participants.length;
                for (var j = 0; j < this.participantsLength; j++) {
                    var employeeId = this.participants[j]['@parid'];
                    this.employeesInCourse.push(employeeId);
                    for (var k = 0; k < this.employees.length; k++) {
                        if (this.employees[k]['@ee_id'] == employeeId)
                            var name = this.employees[k]['@ee_name'];
                    }
                    var lorules = '';
                    var attended = '';
                    var pass = '';
                    if(this.participants[j]['@lorules'] == 'X'){
                        //show checkboxes disabled
                        pass = '';
                        attended = '';
                        lorules = 'DISABLED';
                    } else{                                       
                        attended = this.participants[j]['@confirmed'];
                        if (attended == 'X')
                            attended = 'checked';
                        else
                            attended = '';
                        pass = this.participants[j]['@passed'];
                        if (pass == 'X')
                            pass = 'checked';
                        else
                            pass = '';
                    }
                    this.hasOfParticipants.set(employeeId, {
                        id: employeeId,
                        name: name
                    });
                    participantsTable += "<tr id='" + this.appName + "_" + employeeId + "'>";
                    participantsTable += "<td>" + name + "</td>";
                    participantsTable += "<td><input id='" + employeeId + "_Attended' onClick='javascript:document.fire(\"EWS:folloUp_attendedChecked\",$H({employeeId:\"" + employeeId + "\", empName: \"" + name + "\"}))'type='checkbox' name='" + employeeId + "_attended_checkBox' " + attended + lorules+ " ></td>";

                    if (!Object.isEmpty(data.EWS.o_pas))
                        participantsTable += "<td><input id='" + employeeId + "_Pass' type='checkbox' name='" + employeeId + "_pass_checkBox' " + pass + lorules+"></td>";
                    if (!Object.isEmpty(data.EWS.o_lca))
                        participantsTable += "<td><input id='" + employeeId + "_AppraisalDocs' type='checkbox' name='" + employeeId + "_pass_checkBox'"+lorules+"></td>";
                    participantsTable += "</tr>";
                }
            }
            participantsTable += "</tbody></table>";
        } else {
            var participantsTable = global.getLabel('noParticipants');
        }
        if (data.EWS.o_transfer) {
            var transferTable = "<table style='width:100%' class='sortable' id='" + this.appName + "_transfer'><thead>";
            transferTable += "<tr><th class='table_sortfirstdesc' id='" + this.appName + "_transferQualifications'>" + global.getLabel('qualifications') + "</th><th id='" + this.appName + "_transferProficiency'>" + global.getLabel('proficiency') + "</th><th id='" + this.appName + "_transferTo'>" + global.getLabel('transferTo') + "</th></tr>";
            transferTable += "</thead><tbody>";
            var getCompetences = !Object.isEmpty(data.EWS.o_competences) ? data.EWS.o_competences.yglui_str_competences : null;
            if (getCompetences) {
                var hashToSaveQualifications = $H({});
                for (var i = 0; i < getCompetences.length; i++)
                    hashToSaveQualifications.set(getCompetences[i]['@objid'], getCompetences[i]['@c_text']);
            }
            var getTransfer = data.EWS.o_transfer.lso_quali_transfer_rfc;
            this.transferQualifications = $H({});
            for (var i = 0; i < getTransfer.length; i++) {
                var textQualifications = hashToSaveQualifications.get(getTransfer[i]['@quaid']);
                var proficiency = Object.isEmpty(getTransfer[i]['@chara_text']) ? "" : getTransfer[i]['@chara_text'];
                transferTable += "<tr id='transfer_" + getTransfer[i]['@quaid'] + "'>";
                transferTable += "<td>" + textQualifications + "</td>";
                transferTable += "<td>" + proficiency + "</td>";
                transferTable += "<td><div id='transferTo_" + i + "' class='followUp_multiselect'></div></td>";
                transferTable += "</tr>";
                this.transferQualifications.set(getTransfer[i]['@quaid'], getTransfer[i]);
            }
            transferTable += "</tbody></table>";
        }
        this.virtualHtml.update(
			        "<div id='" + this.appName + "_level1' class='application_main_title followUp_title'>" + global.getLabel('followUp') + "</div>" +
					"<div id='" + this.appName + "_level2' class='application_main_title2 followUp_title2'>" + global.getLabel('managePartic') + "</div>" +
					"<div id='" + this.appName + "_level3' class='followUp_tableDiv'>" + participantsTable + "</div>" +
					"<div id='" + this.appName + "_level4' class='application_main_title2 followUp_title2'>" + global.getLabel('transferQualifications') + "</div>" +
					"<div id='" + this.appName + "_level5' class='followUp_tableDiv'>" + transferTable + "</div>" +
					"<div id='" + this.appName + "_level6' class='followUp_buttonsDiv'></div>"
		);
        if (!data.EWS.o_transfer) {
            this.virtualHtml.down('div#' + this.appName + '_level4').hide();
            this.virtualHtml.down('div#' + this.appName + '_level5').hide();
        }
        if (this.virtualHtml.down('table#' + this.appName + '_transfer')) {
            var numberOfRows = this.virtualHtml.down('table#' + this.appName + '_transfer').down('tbody').rows.length;
            var employeeList = this.getPopulation();
            this.hashWithEmployees = $H({});
            for (var k = 0; k < this.employeesInCourse.length; k++) {
                var _this = this;
                employeeList.each(function(pair) {
                    var a = 0;
                    if (_this.employeesInCourse[k] == pair.objectId)
                        _this.hashWithEmployees.set(pair.name, pair.objectId);
                });
            }
            for (var i = 0; i < numberOfRows; i++) {
                this.jsonMultiselect = { autocompleter: { object: $A()} };
                var _this = this;
                this.hashWithEmployees.each(function(pair) {
                    var attendedChecked = _this.virtualHtml.down('input#' + pair.value + '_Attended').checked;
                    if (attendedChecked)
                        _this.jsonMultiselect.autocompleter.object.push({
                            data: pair.value, /*objId*/
                            text: pair.key   /*name*/
                        })
                });
                this.multiSelect = new MultiSelect('transferTo_' + i, {
                    autocompleter: {
                        showEverythingOnButtonClick: false,
                        timeout: 5000,
                        templateResult: '#{text}',
                        minChars: 1
                    }
                }, this.jsonMultiselect);
                this.hashOfMultiselects.set("multiSelect_" + i, this.multiSelect);
            }
        }
        var json = {
            elements: [],
            defaultButtonClassName: 'followUpButtons'
        };
        var auxCancel = {
            label: global.getLabel('cancel'),
            idButton: '' + this.appName + '_cancelButton',
            type: 'button',
            standardButton: true,
            eventOrHandler: false,
            handlerContext: null,
            handler: global.goToPreviousApp.bind(global)
        };
        json.elements.push(auxCancel);
        var auxFollowUp = {
            idButton: '' + this.appName + '_followUpButton',
            label: global.getLabel('confirmFollow'),
            handlerContext: null,
            handler: this.followUp.bind(this),
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxFollowUp);
        var ButtonJobProfile = new megaButtonDisplayer(json);
        this.virtualHtml.down('div#' + this.appName + '_level6').insert(ButtonJobProfile.getButtons());
        if (!Object.isEmpty(data.EWS.o_participant)) {
            if (this.tableKitInitialized == false) {
                TableKit.Sortable.init(this.virtualHtml.down("table#" + this.appName + "_participants"), { pages: 10 });
                this.tableKitInitialized = true;
            } else {
                TableKit.reloadTable(this.virtualHtml.down("table#" + this.appName + "_participants"), { pages: 10 });
            }
            TableKit.options.autoLoad = false;
        }
        if (data.EWS.o_transfer) {
            if (this.tableKit2Initialized == false) {
                TableKit.Sortable.init(this.virtualHtml.down("table#" + this.appName + "_transfer"), { pages: 10 });
                this.tableKit2Initialized = true;
            } else {
                TableKit.reloadTable(this.virtualHtml.down("table#" + this.appName + "_transfer"), { pages: 10 });
            }
            TableKit.options.autoLoad = false;
        }
    },
    /*
    * @desc called when the user clicks the checkbox 'attended'.
    */
    attendedSelected: function(args) {
        for (var m = 0; m < this.hashOfMultiselects.keys().length; m++) {
            var multiSelect = this.hashOfMultiselects.get('multiSelect_' + m);
            //reset the multiselect
            var selected = deepCopy(multiSelect.getSelected());
            //get selected employees (boxes)
            multiSelect.defaultBoxes();
            //reset the json and create a new one with all attendants.
            var jsonMultiselect = { autocompleter: { object: $A()} };
            jsonMultiselect.autocompleter.object.clear();
            for (var i = 0; i < this.hasOfParticipants.keys().length; i++) {
                var id = this.hasOfParticipants.get(this.hasOfParticipants.keys()[i]).id;
                var name = this.hasOfParticipants.get(this.hasOfParticipants.keys()[i]).name;
                var attendedChecked = this.virtualHtml.down('input#' + id + '_Attended').checked;
                if (attendedChecked)
                    jsonMultiselect.autocompleter.object.push({
                        data: id, //objId
                        text: name   //name                
                    })
            }
            //update Json in multiselect
            multiSelect.updateInput(jsonMultiselect);
            //draw boxes for the selected (alreday had boxes) employees
            var indexEmp = new Array();
            for (var a = 0; a < selected.length; a++) {
                var idToFind = selected[a].data;
                if (this.virtualHtml.down('input#' + idToFind + '_Attended').checked) {
                    //look for position in autocomp 
                    var position = -1;
                    jsonMultiselect.autocompleter.object.each(function(emp, it) {
                        var a = 0;
                        a = 1;
                        if (emp.data == idToFind) {
                            position = it;
                        }
                    } .bind(this));
                    indexEmp.push(position);
                }
            }
            multiSelect.addBoxes(indexEmp);
            this.hashOfMultiselects.set('multiSelect_' + m, multiSelect);
        }
    },
    /*
    * @desc called when the user clicks on'follow up'.
    */
    followUp: function() {
        var followUpCourseHtml = "<div>"
                               + "<span>" + global.getLabel('followUpCourseInfo') + "</span><br>"
                               + "<span>" + global.getLabel('followUpConf') + "</span>"
                               + "</div>";
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(followUpCourseHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            if (_this)
                _this.followUpConfirm();
            followPopUp.close();
            delete followPopUp;
        };
        var callBack3 = function() {
            followPopUp.close();
            delete followPopUp;
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
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        var followPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    followPopUp.close();
                    delete followPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        followPopUp.create();
    },
    /*
    * @method followUpConfrim
    * @desc called when the user confirms the 'follow up'. We store the changes and do the follow Up.
    */
    followUpConfirm: function() {
        var xml = "<EWS>"
                    + "<SERVICE>" + this.followUpService + "</SERVICE>"
                    + "<OBJECT TYPE=\"E\">" + this.objectId + "</OBJECT>"
                    + "<PARAM>"
                    + "<I_FOLLOW_UP>";
        var tempParticipantsTable = this.oldParticipantsTable;
        for (var i = 0; i < this.participantsLength; i++) {
            var employeeTable = tempParticipantsTable.substring(0, tempParticipantsTable.indexOf('/>') + 2);
            tempParticipantsTable = tempParticipantsTable.gsub(employeeTable, '');
            var attended = this.virtualHtml.down("[id=" + this.participants[i]['@parid'] + "_Attended]").checked;
            if (attended == false)
                employeeTable = employeeTable.gsub(' confirmed="X"', ' confirmed=""')
            else
                employeeTable = employeeTable.gsub(' confirmed=""', ' confirmed="X"');
            var pass = (this.virtualHtml.down("[id=" + this.participants[i]['@parid'] + "_Pass]")) ? this.virtualHtml.down("[id=" + this.participants[i]['@parid'] + "_Pass]").checked : null;
            if (!Object.isEmpty(pass)) {
                if (pass == false)
                    employeeTable = employeeTable.gsub(' passed="X"', ' passed=""')
                else
                    employeeTable = employeeTable.gsub(' passed=""', ' passed="X"');
            }
            xml += employeeTable;
        }
        xml += "</I_FOLLOW_UP>";
        xml += "<I_PERNR>";
        //put selected employees in AppraisalDocs checkbox
        for (var i = 0; i < this.participantsLength; i++) {
            if(this.virtualHtml.down("[id=" + this.participants[i]['@parid'] + "_AppraisalDocs]")){
                var appraisal = this.virtualHtml.down("[id=" + this.participants[i]['@parid'] + "_AppraisalDocs]").checked;
                if (appraisal)
                    xml += '<yglui_tab_pernr pernr="'+this.participants[i]['@parid']+'"/>'    
            }
        }        
        xml += "</I_PERNR>";
        xml += "<I_QUALI>";
        if (this.transferQualifications) {
            var _this = this;
            this.transferQualifications.each(function(pair) {
                var rowOfQualifications = _this.virtualHtml.down('tr#transfer_' + pair.key);
                var multiSelectCreated = rowOfQualifications.select('div.multiSelect_text');
                for (var i = 0; i < multiSelectCreated.length; i++) {
                    var stringWithName = new String();
                    stringWithName = multiSelectCreated[i].innerHTML.gsub('&nbsp;', ' ');
                    var idOfTransferEmp = _this.hashWithEmployees.get(stringWithName);
                    xml += "<lso_quali_transfer_rfc chara='" + pair.value['@chara'] + "' chara_text='" + pair.value['@chara_text'] + "' exper='" + pair.value['@exper'] + "' parid='" + idOfTransferEmp + "' passed='' patyp='" + pair.value['@patyp'] + "' plvar='" + pair.value['@plvar'] + "' quabg='" + pair.value['@quabg'] + "' quaen='" + pair.value['@quaen'] + "' quaid='" + pair.value['@quaid'] + "' quaty='" + pair.value['@quaty'] + "' scale='" + pair.value['@scale'] + "' tpartdocno=''></lso_quali_transfer_rfc>";
                }
            });
        }
        xml += "</I_QUALI>"
                   + "</PARAM>"
                + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'saveChangesAnswer' }));
    },
    /*
    * @method saveChangesAnswer
    * @desc it retrieves the change answer
    */
    saveChangesAnswer: function(answer) {
        //if (!Object.isEmpty(answer.EWS.o_follow_up))
        //document.fire('EWS:openApplication', $H({ app: this.prevApp, prevApp: 'CATLFollowUp' }));
        global.goToPreviousApp();
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
        document.stopObserving('EWS:folloUp_attendedChecked', this.attendedSelectedBinding);
    }

});
