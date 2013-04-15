/**
 *@fileOverview PFM_ShowDocs.js
 *@description It contains a class with functionality for calibration.
 */
/**
 *@constructor
 *@description Class with functionality for show rating distribution
 *@augments PFM_parent
 */
var PFM_RatingDistribution = Class.create(PFM_parent, {
    /**
    * Service used to get the Calibration XML
    * @type String
    */
    calibrationService: 'GET_PFMDIST2',
    virtualHtml: null,
    calibrationLabels: null,
    calibrationScreen: null,
    calibrationContainer: null,
    //variable used to control buttons
    refresh: true,
    refresh2: true,
    tempSendToManagerList: '',
    tempApproveRejectList: '',
    firstRunCal: false,

    initialize: function($super, appId) {
        this.appId = appId;
        $super(appId);
    },

    /*
    * @method run
    * @desc Starts calibration application
    * @return void
    */
    run: function($super, appId, args) {
        $super();
        this.calibrationContainer = '';
        if (this.firstRun || this.firstRunCal) {
            this.calibrationContainer = this.virtualHtml;
            this.loadCalibration(appId);
        }       
    },

    loadCalibration: function(appId, pair) {
        this.clearCalibrationContainer();
        this.drawCalibrationTable();
        this.drawCalibrationApproval();
        this.empId = global.objectId;
        this.objectType = global.objectType;

        var jsonUserRating = {
            EWS: {
                SERVICE: this.calibrationService,
                OBJECT: {
                    "#text": this.empId,
                    "-TYPE": this.objectType
                },
                PARAM: {
            }
        }
    };
    var xotree = new XML.ObjTree();
    this.makeAJAXrequest($H({
        xml: xotree.writeXML(jsonUserRating),
        successMethod: this.loadCalibrationBox.bind(this, this.empId)

    }));
   },
    clearCalibrationContainer: function() {
        this.calibrationContainer.update('');
        this.refresh2 = true;
        this.refresh = true;
    },
/**
*@description Method to draw the set of divs to handle the calibrations data
*/
drawCalibrationTable: function(JSON, xmlDoc) {
    var headersJSON = {
        Divs: [
                { Div: "unsatDiv", text: global.getLabel('PFM_UNSAT') },
                { Div: "needsDiv", text: global.getLabel('PFM_NEEDS') },
                { Div: "meetsDiv", text: global.getLabel('PFM_MEETS') },
                { Div: "exceedsDiv", text: global.getLabel('PFM_EXCEEDS') },
                { Div: "outstDiv", text: global.getLabel('PFM_OUTST') }
            ]
    };
    this.buildHeaders(headersJSON);
},
/**
*@description Method to build the table header
*/
buildHeaders: function(JSON) {
    var headers = JSON;

    for (var i = 0; i < headers.Divs.length; i++) {
        this.newCalArea = new Element('Div', {
            'id': 'PFM_' + headers.Divs[i].Div + 'area',
            'class': 'calibration_Area'
        });

        this.newHead = new Element('Div', {
            'id': 'PFM_' + headers.Divs[i].Div,
            'class': 'calibration_header'
        });

        this.newCalb = new Element('Div', {
            'id': 'PFM_' + headers.Divs[i].Div + 'calb',
            'class': 'calibration_col'
        });

        this.newCalArea.insert(this.newHead);
        this.newCalArea.insert(this.newCalb);

        this.calibrationContainer.insert(this.newCalArea);
        $('PFM_' + headers.Divs[i].Div).innerHTML = headers.Divs[i].text;
    }
},
/**
*@param template id
*@description Draws the tables and buttons for managers approvals
*/
drawCalibrationApproval: function(JSON, xmlDoc) {
    this.headerInserted = false;
    this.headerInserted2 = false;
    //title of the application
    var title = global.getLabel('PFM_Send2upApRe');
    var title2 = global.getLabel('PFM_Send2upAp');
    var selectAll = global.getLabel('PFM_SelectAll');
    //we create several part for the title, buttons, table, detail...            
    var html = "<div id='2upApprovalReLegend' class='PFM_individualDocsLegend'></div>" +
                   "<div><div id='virtualDocs_title2upApprovalRe' class='PFM_titleIndividualDoc2'><span>" + title2 + "</span></div>" +
                   "<div id='virtualDocs_SelectAll2' class='PFM_SelectAllOpDocs'><span>" + selectAll + "</span>" +
                   "<input id='virtualDocsCheckbox_selectAll2' type='checkbox' class='PFM_checkboxAll'/></div></div>" +
                   "<div id='virtualDocs_table2upApprovalRe' class='PFM_FirstTableIndividialDoc'></div>" +
                   "<div id='virtualDocs_Notable2upApprovalRe' class='Calibration_NoOpenDocs application_main_soft_text'></div>" +
                   "<div id='virtualDocs_sendManagerButton' class='PFM_ShowDocButtons'></div>" +
                   "<div><div id='virtualDocs_title2upApproval' class='PFM_titleIndividualDoc'><span>" + title + "</span></div>" +
                   "<div id='virtualDocs_SelectAll' class='PFM_SelectAllOpDocs'><span>" + selectAll + "</span>" +
                   "<input id='virtualDocsCheckbox_selectAll' type='checkbox' class='PFM_checkboxAll'/></div></div>" +
                   "<div id='virtualDocs_table2upApproval' class='PFM_FirstTableIndividialDoc'></div>" +
                   "<div id='virtualDocs_Notable2upApproval' class='PFM_NoOpenOwnDocs2 application_main_soft_text'></div>" +
                   "<div id='virtualDocs_approveRejectButtons' class='PFM_ShowDocButtons'></div>";

    this.calibrationContainer.insert(html);

    //we create the legend                                     
    var legendJSON = {
        legend: [
                { img: "application_icon_green", text: global.getLabel('completed') },
                { img: "application_icon_orange", text: global.getLabel('warning') },
                { img: "application_icon_red", text: global.getLabel('overdue') }

            ],
        showLabel: global.getLabel('showLgnd'),
        hideLabel: global.getLabel('closeLgnd')
    };
    var legendHTML = getLegend(legendJSON);
    this.calibrationContainer.down('div#2upApprovalReLegend').insert(legendHTML);
    //creating the table that contains the relations
    var table = "<table class='sortable PFM_sizeTableDocs' id='PFM2upApprovalOpenTable'>" +
                        "<thead>" +
                            "<tr id='PFM_headDocTable2upAp'>" +
                            "</tr>" +
                        "</thead>" +
                        "<tbody id='PFM2upApprovalOpenTableBody'></tbody>" +
                    "</table>";
    this.calibrationContainer.down('div#virtualDocs_table2upApproval').insert(table);
    this.calibrationContainer.down('div#2upApprovalReLegend').show();
    this.calibrationContainer.down('div#virtualDocs_table2upApproval').hide();
    this.calibrationContainer.down('div#virtualDocs_Notable2upApproval').insert("<span>" + global.getLabel('no2upApprovalRe') + "</span>")

    if (!this.tableShowed) {
        TableKit.Sortable.init('PFM2upApprovalOpenTable');
        this.tableShowed = true;
        TableKit.options.autoLoad = false;
        //this.setApprovalButtons();
    }
    else
        TableKit.reloadTable('PFM2upApprovalOpenTable');

    var table2 = "<table class='sortable PFM_sizeTableDocs' id='PFM2upApprovalOpenTable2'>" +
                        "<thead>" +
                            "<tr id='PFM_headDocTable2upAp2'>" +
                            "</tr>" +
                        "</thead>" +
                        "<tbody id='PFM2upApprovalOpenTableBody2'></tbody>" +
                    "</table>";
    this.calibrationContainer.down('div#virtualDocs_table2upApprovalRe').insert(table2);
    this.calibrationContainer.down('div#virtualDocs_table2upApprovalRe').hide();
    this.calibrationContainer.down('div#virtualDocs_Notable2upApprovalRe').insert("<span>" + global.getLabel('no2upApproval') + "</span>")

    if (!this.table2Showed) {
        TableKit.Sortable.init('PFM2upApprovalOpenTable2');
        this.table2Showed = true;
        TableKit.options.autoLoad = false;
        //this.setSendManagerButton();
    }
    else
        TableKit.reloadTable('PFM2upApprovalOpenTable2');
},
setSendManagerSelectBox: function(json) {
    $('virtualDocsCheckbox_selectAll2').observe('click', this.selectAllSendManager.bind(this, json));
},
setApprovalSelectBox: function(json) {
    $('virtualDocsCheckbox_selectAll').observe('click', this.selectAllApproval.bind(this, json));
},

/**
*@description Selects all the documents for approval or rejection when the selectAll checkbox is checked
*/
selectAllApproval: function(json) {

    var testIfSendManager = json.EWS.o_appraiser_4_c;

    $('PFM_2upApprove').stopObserving("click");
    $('PFM_2upReject').stopObserving("click");
    this.ButtonRefreshDocs.disable('PFM_2upApprove');
    this.ButtonRefreshDocs.disable('PFM_2upReject');    

    if (testIfSendManager) {
        var getDocsToSend = objectToArray(json.EWS.o_appraiser_4_c.yglui_str_search_document);
        if (this.virtualHtml.down('[id=virtualDocsCheckbox_selectAll]').checked) {
            $('PFM_2upApprove').observe('click', this.callToSubmitAll.bind(this, getDocsToSend, 'APPROVE'));
            $('PFM_2upReject').observe('click', this.callToSubmitAll.bind(this, getDocsToSend, 'REJECT'));
            this.ButtonRefreshDocs.enable('PFM_2upApprove');
            this.ButtonRefreshDocs.enable('PFM_2upReject');             
        }
    }
    rows = $('PFM2upApprovalOpenTableBody').childNodes;
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].childNodes[4].childNodes.length != '0' && rows[i].childNodes[4].childNodes[0].childNodes[0].type == 'checkbox') {
            if (this.virtualHtml.down('[id=virtualDocsCheckbox_selectAll]').checked) {
                rows[i].childNodes[4].childNodes[0].childNodes[0].checked = true;
            } else {
                rows[i].childNodes[4].childNodes[0].childNodes[0].checked = false;
            }
        }
    }
},
/**
*@description Selects all the documents to send for approval when the selectAll checkbox is checked
*/
selectAllSendManager: function(json) {
    var testIfSendManager = json.EWS.o_appraiser_4_a;
    $('PFM_SubmitMngr').stopObserving("click");
    this.ButtonRefreshDocs.disable('PFM_SubmitMngr');
    if (testIfSendManager) {
        var getDocsToSend = objectToArray(json.EWS.o_appraiser_4_a.yglui_str_search_document);
        if (this.virtualHtml.down('[id=virtualDocsCheckbox_selectAll2]').checked) {
            $('PFM_SubmitMngr').observe('click', this.callToSubmitAll.bind(this, getDocsToSend, 'SENDMANAGER'));
            this.ButtonRefreshDocs.enable('PFM_SubmitMngr');
        }
    }
    rows = $('PFM2upApprovalOpenTableBody2').childNodes;
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].childNodes[4].childNodes.length != '0' && rows[i].childNodes[4].childNodes[0].childNodes[0].type == 'checkbox') {
            if (this.virtualHtml.down('[id=virtualDocsCheckbox_selectAll2]').checked) {
                rows[i].childNodes[4].childNodes[0].childNodes[0].checked = true;
            } else {
                rows[i].childNodes[4].childNodes[0].childNodes[0].checked = false;
            }
        }
    }
},
setSelectboxes: function(table, json, action) {
    rows = $(table).childNodes;
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].childNodes[4].childNodes.length != '0' && rows[i].childNodes[4].childNodes[0].childNodes[0].type == 'checkbox') {
            $(rows[i].childNodes[4].childNodes[0].childNodes[0]).observe('click', this.updateTempJSON.bind(this, json, action, table));
        }
    }
},
updateTempJSON: function(json, action, table, obj) {

    switch (action) {
        case 'ApproveReject':
            $('PFM_2upApprove').stopObserving("click");
            $('PFM_2upReject').stopObserving("click");
            this.updateApproveRejectList(json, obj, table);
            //disable / enable buttons depending on checkboxes
            rows = $(table).childNodes;
            var checked = 0;
            for (var i = 0; i < rows.length; i++) {
                if (rows[i].childNodes[4].childNodes.length != '0' && rows[i].childNodes[4].childNodes[0].childNodes[0].type == 'checkbox') {
                    if(rows[i].childNodes[4].childNodes[0].childNodes[0].checked)
                        checked +=1;
                }
            }  
            if(checked > 0){
                $('PFM_2upApprove').observe('click', this.callToSubmitIndv.bind(this, this.tempApproveRejectList, 'APPROVE'));
                $('PFM_2upReject').observe('click', this.callToSubmitIndv.bind(this, this.tempApproveRejectList, 'REJECT'));            
                this.ButtonRefreshDocs.enable('PFM_2upApprove');
                this.ButtonRefreshDocs.enable('PFM_2upReject');     
            }else if(checked == 0){
                this.ButtonRefreshDocs.disable('PFM_2upApprove');
                this.ButtonRefreshDocs.disable('PFM_2upReject');        
            }                    
            break;
        case 'SendToManager':
            $('PFM_SubmitMngr').stopObserving("click");
            this.updateSendToManagerList(json, obj, table);
            //disable / enable buttons depending on checkboxes
            rows = $(table).childNodes;
            var checked = 0;
            for (var i = 0; i < rows.length; i++) {
                if (rows[i].childNodes[4].childNodes.length != '0' && rows[i].childNodes[4].childNodes[0].childNodes[0].type == 'checkbox') {
                    if(rows[i].childNodes[4].childNodes[0].childNodes[0].checked)
                        checked +=1;
                }
            }  
            if(checked > 0){
                $('PFM_SubmitMngr').observe('click', this.callToSubmitIndv.bind(this, this.tempSendToManagerList, 'SENDMANAGER'));            
                this.ButtonRefreshDocs.enable('PFM_SubmitMngr');    
            }else if(checked == 0){
                this.ButtonRefreshDocs.disable('PFM_SubmitMngr');      
            }                
            break;
    }
},
updateSendToManagerList: function(json, obj, table) {

    this.tempSendToManagerList = '';
    rows = $(table).childNodes;
    var documents = json.EWS.o_appraiser_4_a.yglui_str_search_document;
    if (documents.length) {
        for (var x = 0; x < rows.length; x++) {
            if (rows[x].childNodes[4].childNodes[0].childNodes[0].checked) {
                for (var i = 0; i < documents.length; i++) {
                    if (documents[i]['@doc_id'] + '/' == rows[x].childNodes[4].childNodes[0].childNodes[0].id) {
                        this.tempSendToManagerList += '<DOCUMENT id="' + documents[i]['@doc_id'] + '" />'
                    }
                }
            }
        }
    } else if (documents['@doc_id'] + '/' == rows[0].childNodes[4].childNodes[0].childNodes[0].id && rows[0].childNodes[4].childNodes[0].childNodes[0].checked) {
        this.tempSendToManagerList += '<DOCUMENT id="' + documents['@doc_id'] + '" />'
    }
},
updateApproveRejectList: function(json, obj, table) {
    this.tempApproveRejectList = '';
    rows = $(table).childNodes;
    var documents = json.EWS.o_appraiser_4_c.yglui_str_search_document;
    if (documents.length) {
        for (var x = 0; x < rows.length; x++) {
            if (rows[x].childNodes[4].childNodes[0].childNodes[0].checked) {
                for (var i = 0; i < documents.length; i++) {
                    if (documents[i]['@doc_id'] + '/' == rows[x].childNodes[4].childNodes[0].childNodes[0].id) {
                        this.tempApproveRejectList += '<DOCUMENT id="' + documents[i]['@doc_id'] + '" />'
                    }
                }
            }
        }
    } else if (documents['@doc_id'] + '/' == rows[0].childNodes[4].childNodes[0].childNodes[0].id && rows[0].childNodes[4].childNodes[0].childNodes[0].checked) {
        this.tempApproveRejectList += '<DOCUMENT id="' + documents['@doc_id'] + '" />'
    }
},

/**
*@param template id
*@description Opens the selected appraisal template form
*/
openTemplate: function(obj, appId, tabId, view) {
    idOfLink = obj;
          var handler = global.open($H({
            app: {
                appId: appId,//'PFM_ODOC',
                tabId: tabId, //'PFM_IOV',
                view: view//'PFM_ShowDocs'                 
            },        
            idOfDoc:idOfLink,
            previousApp:this.options.appId
          }));
},

loadCalibrationBox: function(empId, JSON) {
    this.processBoxes(JSON, 'unsatisfactory');
    this.processBoxes(JSON, 'needs_imp');
    this.processBoxes(JSON, 'meet_req');
    this.processBoxes(JSON, 'exceeds_req');
    this.processBoxes(JSON, 'outstandings');
    this.processApprovals(JSON);
        for (var i = 0; i < this.getSelectedEmployees().keys().length; i++) {
            var employeeId = this.getSelectedEmployees().keys()[i];
            var args = {id: employeeId, 
                        name: this.getSelectedEmployees().get(employeeId).name,
                        oType: this.getSelectedEmployees().get(employeeId).oType,
                        population: this.getSelectedEmployees().get(employeeId).population };
            this.hideShowRating(args, 'block');
        }     
},

toggleStyle: function(id, step, boxStyle, obj) {
    if (step == "in") {
        if (obj.srcElement)obj.srcElement.className = 'rating_box rating_tile_' + boxStyle + '_highlighted';
        if (obj.target)obj.target.className = 'rating_box rating_tile_' + boxStyle + '_highlighted';
    } else {
        if (obj.srcElement)obj.srcElement.className = 'rating_box rating_tile_' + boxStyle;
        if (obj.target)obj.target.className = 'rating_box rating_tile_' + boxStyle;
    }
},
checkLongName: function(ratingName) {
    if(!ratingName)
        return "";
        
    if (ratingName.length > 12) {
        ratingName = ratingName.substr(0, 12) + "...";
    }
    return ratingName;
},

processBoxes: function(JSON, category) {
    this.category = category;
    rating = JSON.EWS.o_ratings.yglui_str_pfm_ratings;

    switch (this.category) {
        case 'unsatisfactory': if (!rating.unsatisfactory) { div = 'PFM_unsatDivcalb'; break; } else { rating = rating.unsatisfactory.yglui_str_pfm_rate_catagory; div = 'PFM_unsatDivcalb'; boxStyle = 'red'; break };
        case 'needs_imp': if (!rating.needs_imp) { div = 'PFM_needsDivcalb'; break; } else { rating = rating.needs_imp.yglui_str_pfm_rate_catagory; div = 'PFM_needsDivcalb'; boxStyle = 'orange'; break };
        case 'meet_req': if (!rating.meet_req) { div = 'PFM_meetsDivcalb'; break; } else { rating = rating.meet_req.yglui_str_pfm_rate_catagory; div = 'PFM_meetsDivcalb'; boxStyle = 'yellow'; break };
        case 'exceeds_req': if (!rating.exceed_req) { div = 'PFM_exceedsDivcalb'; break; } else { rating = rating.exceed_req.yglui_str_pfm_rate_catagory; div = 'PFM_exceedsDivcalb'; boxStyle = 'green'; break };
        case 'outstandings': if (!rating.outstandings) { div = 'PFM_outstDivcalb'; break; } else { rating = rating.outstandings.yglui_str_pfm_rate_catagory; div = 'PFM_outstDivcalb'; boxStyle = 'blue'; break };
        default: break;
    }
	// When user clicks on refresh, the method loadCalibrationBox is called twice. The second time the content is already created, so it duplicates the entries
	// added a line to clean up the div content, so it will only keep the content created the last call
	$(div).innerHTML = '';

    var pos = Position.positionedOffset($(div)).top + $(div).offsetHeight;

    if (!rating.length && rating['@pernr']) {

        var ratingName = this.checkLongName(rating['@name']);

        this.newRatingBox = new Element('Div', {
            'id': 'Rating_' + rating['@pernr'],
            'class': 'rating_box rating_tile_' + boxStyle
        }).update(ratingName + '(' + rating['@rating'] + ')');
        this.newRatingBox.observe('click', this.openTemplate.bind(this, rating['@appraisal_id'], rating['@appid'],rating['@tartb'],rating['@views']));
        this.newRatingBox.observe('mouseover', this.toggleStyle.bind(this, 'Rating_' + rating['@pernr'], 'in', boxStyle));
        this.newRatingBox.observe('mouseout', this.toggleStyle.bind(this, 'Rating_' + rating['@pernr'], 'out', boxStyle));

        $(div).insert(this.newRatingBox);

        pos = pos - 22;
        this.newRatingBox.style.top = pos + 'px';
        this.newRatingBox.style.display = "none";
    } else if (rating.length > 0) {
        for (var i = 0; i < rating.length; i++) {

            var ratingName = this.checkLongName(rating[i]['@name']);

            this.newRatingBox = new Element('Div', {
                'id': 'Rating_' + rating[i]['@pernr'],
                'class': 'rating_box rating_tile_' + boxStyle
            }).update(ratingName + '(' + rating[i]['@rating'] + ')');

            this.newRatingBox.observe('click', this.openTemplate.bind(this, rating[i]['@appraisal_id'], rating[i]['@appid'],rating[i]['@tartb'],rating[i]['@views']));
            this.newRatingBox.observe('mouseover', this.toggleStyle.bind(this, 'Rating_' + rating[i]['@pernr'], 'in', boxStyle));
            this.newRatingBox.observe('mouseout', this.toggleStyle.bind(this, 'Rating_' + rating[i]['@pernr'], 'out', boxStyle));

            $(div).insert(this.newRatingBox);

            pos = pos - 22;
            this.newRatingBox.style.top = pos + 'px';
            this.newRatingBox.style.display = "none";
        }
    }
},

/*
* @method processApprovals
* @param json {json} The JSON object retrieved from the service
* @desc call service to fill the tables
*/
processApprovals: function(json) {
    //variable used to save the values in json
    var classColumn = "";
    var classOfBubble = "";
    var classOfLink;
    var idOfDocument, idOfLink;
    var testIfApproveReject = json.EWS.o_appraiser_4_a;
    if (!Object.isEmpty(testIfApproveReject)) {
        var getDocsApraisee = objectToArray(json.EWS.o_appraiser_4_a.yglui_str_search_document);
        var hashDocsApraisee;
        var _this = this;
        var html = '';
        var linkOfDocument = "";
        //for every own document related to a person, we loop to enter a row in the table
        for (var i = 0; i < getDocsApraisee.length; i++) {
            hashDocsApraisee = $H(getDocsApraisee[i])
            html += "<tr>";
            //we read every field that is going to be a column in the table
            hashDocsApraisee.each(function(pair) {
            if((pair.key != '@tartb') && (pair.key != '@views') && (pair.key != '@appid') && (pair.key != '@zz_roles')){
                classColumn = "";
                classOfLink = "";
                classOfBubble = "";
                idOfLink = "";
                if (pair.key == '@s_bubble')
                    classColumn = 'PFM_bubbleColumn';
                if (pair.value == 'Y')
                    classOfBubble = 'application_icon_orange';
                else if (pair.value == 'G')
                    classOfBubble = 'application_icon_green';
                else if (pair.value == 'R')
                    classOfBubble = 'application_icon_red';
                else if (pair.value == 'B')
                    classOfBubble = 'applicationTeamCalendar_moreEventsIcon';
                if (pair.key == '@s_bubble') {
                    pair.value = "";
                    pair.key = "";
                }
                if (pair.key == '@doc_id') {
                    idOfDocument = "ApproveReject_" + pair.value;
                    idOfCheckBox = pair.value;
                }
                if (pair.key == '@w_document') {
                    classOfLink = 'application_action_link';
                    idOfLink = idOfDocument;
                }
                if (pair.key == '@y_due_date')
                    pair.value = Date.parseExact(pair.value, 'yyyy-MM-dd').toString(global.dateFormat);
                //if the value is not the id of the document and is not #text, we insert it in the table
                if (pair.key != '@doc_id' && pair.key != '#text' && pair.key != '@y_due_date') {
                    //we insert the header
                    if (i == 0 && !_this.headerInserted) {
                        _this.calibrationContainer.down('tr#PFM_headDocTable2upAp2').insert(
	                            "<th class='" + classColumn + "'>" + global.getLabel(pair.key.gsub('@', '')) + "</th>"
	                        );
                        if (_this.calibrationContainer.down('tr#PFM_headDocTable2upAp2').cells.length == 4) {
                            _this.headerInserted = true;
                            _this.calibrationContainer.down('tr#PFM_headDocTable2upAp2').insert("<th class='" + classColumn + "'></th>");
                        }
                    }
                    //we insert every row in the table
                    html += "<td class='" + classColumn + "'><div id='" + idOfLink + "' class='" + classOfBubble + " " + classOfLink + "'>" + pair.value + "</div></td>";
                }
               }
            });
            html += '<td class=' + classColumn + '><div class="applicationPFM_div_tdSepCheckbox"><input #{selected} class="applicationInbox_tdCheckbox" type="checkbox" id=' + idOfCheckBox + '/></div></td>';
            html += "</tr>";
        }
        //we insert the html in th table
        this.calibrationContainer.down('tbody#PFM2upApprovalOpenTableBody2').update(html);
        this.setSendManagerSelectBox(json);
        this.setSelectboxes('PFM2upApprovalOpenTableBody2', json, 'SendToManager');
        this.setSendManagerButton();

        //we reload the table
        if (!this.table2Showed) {
            TableKit.Sortable.init('PFM2upApprovalOpenTable2');
            this.table2Showed = true;
            TableKit.options.autoLoad = false;

        }
        else
            TableKit.reloadTable('PFM2upApprovalOpenTable2');

        this.calibrationContainer.down('div#2upApprovalReLegend').show();
        this.calibrationContainer.down('div#virtualDocs_Notable2upApprovalRe').hide();
        this.calibrationContainer.down('div#virtualDocs_table2upApprovalRe').show();
    }
    else {
        this.calibrationContainer.down('div#virtualDocs_table2upApprovalRe').hide();
        this.calibrationContainer.down('div#virtualDocs_Notable2upApprovalRe').show();
    }

    //we get the open documents  

    var testIfApprove = json.EWS.o_appraiser_4_c;
    if (!Object.isEmpty(testIfApprove)) {
        var getDocsAppraiser = objectToArray(json.EWS.o_appraiser_4_c.yglui_str_search_document);
        var hashDocsAppraiser = $H(getDocsAppraiser[0]);
        var _this = this;
        html = '';
        //for every open document related to person, we loop to enter a row in the table
        for (var i = 0; i < getDocsAppraiser.length; i++) {
            hashDocsAppraiser = $H(getDocsAppraiser[i]);
            html += "<tr>";
            //we read every field that is going to be a column in the table
            hashDocsAppraiser.each(function(pair) {
             if((pair.key != '@tartb') && (pair.key != '@views') && (pair.key != '@appid') && (pair.key != '@zz_roles')){
                classColumn = "";
                classOfLink = "";
                classOfBubble = "";
                idOfLink = "";
                if (pair.key == '@s_bubble')
                    classColumn = 'PFM_bubbleColumn';
                if (pair.value == 'Y')
                    classOfBubble = 'application_icon_orange';
                else if (pair.value == 'G')
                    classOfBubble = 'application_icon_green';
                else if (pair.value == 'R')
                    classOfBubble = 'application_icon_red';
                else if (pair.value == 'B')
                    classOfBubble = 'applicationTeamCalendar_moreEventsIcon';
                if (pair.key == '@s_bubble') {
                    pair.value = "";
                    pair.key = "";
                }

                if (pair.key == '@doc_id') {
                    idOfDocument = "SendManager_" + pair.value;
                    idOfCheckBox = pair.value;
                }
                if (pair.key == '@w_document') {
                    classOfLink = 'application_action_link';
                    idOfLink = idOfDocument;
                }
                if (pair.key == '@y_due_date')
                    pair.value = Date.parseExact(pair.value, 'yyyy-MM-dd').toString(global.dateFormat);
                //if the value is not the id of the document and is not #text, we insert it in the table
                if (pair.key != '@doc_id' && pair.key != '#text' && pair.key != '@y_due_date' && pair.key != '@z_flag_approval') {
                    //we insert the header
                    if (i == 0 && _this.headerInserted2 == false) {
                        _this.calibrationContainer.down('tr#PFM_headDocTable2upAp').insert(
	                            "<th class='" + classColumn + "'>" + global.getLabel(pair.key.gsub('@', '')) + "</th>"
	                        );
                        if (_this.calibrationContainer.down('tr#PFM_headDocTable2upAp').cells.length == 4) {
                            _this.headerInserted2 = true;
                            _this.calibrationContainer.down('tr#PFM_headDocTable2upAp').insert("<th class='" + classColumn + "'></th>");
                        }
                    }

                    //we insert every row in the table
                    html += "<td class='" + classColumn + "'><div id='" + idOfLink + "' class='" + classOfBubble + " " + classOfLink + "'>" + pair.value + "</div></td>";
                }
               }
            });

            html += '<td class=' + classColumn + '><div class="applicationPFM_div_tdSepCheckbox"><input #{selected} class="applicationInbox_tdCheckbox" type="checkbox" id=' + idOfCheckBox + '/></div></td>';

            html += "</tr>";
            //we insert all in the table
            this.calibrationContainer.down('tbody#PFM2upApprovalOpenTableBody').update(html);
            this.setApprovalSelectBox(json);
            this.setSelectboxes('PFM2upApprovalOpenTableBody', json, 'ApproveReject');
            this.setApprovalButtons();
        }
        //we reload the table
        if (!this.tableShowed) {
            TableKit.Sortable.init('PFM2upApprovalOpenTable');
            this.tableShowed = true;
            TableKit.options.autoLoad = false;

        }
        else
            TableKit.reloadTable('PFM2upApprovalOpenTable');
        //add select all checkbox

        this.calibrationContainer.down('div#2upApprovalReLegend').show();
        this.calibrationContainer.down('div#virtualDocs_Notable2upApproval').hide();
        this.calibrationContainer.down('div#virtualDocs_table2upApproval').show();
    }
    else {
        this.calibrationContainer.down('div#virtualDocs_table2upApproval').hide();
        this.calibrationContainer.down('div#virtualDocs_Notable2upApproval').show();
    }
//    if (!testIfApproveReject && !testIfApprove)
        //this.calibrationContainer.down('div#individualDocsLegend').hide();
    this.arrayOfInputs = this.calibrationContainer.select('div.application_action_link');
    this.testandObserveLinks();
    
    //keep view / appid / tab
       if(Object.jsonPathExists(json, 'EWS.o_appraiser_4_a.yglui_str_search_document')){
            this.openAppInfoView = objectToArray(json.EWS.o_appraiser_4_a.yglui_str_search_document)[0]['@views'];
            this.openAppInfoTab = objectToArray(json.EWS.o_appraiser_4_a.yglui_str_search_document)[0]['@tartb'];
            this.openAppInfoAppId = objectToArray(json.EWS.o_appraiser_4_a.yglui_str_search_document)[0]['@appid'];
       }else if(Object.jsonPathExists(json, 'EWS.o_appraiser_4_c.yglui_str_search_document')){
            this.openAppInfoView = objectToArray(json.EWS.o_appraiser_4_c.yglui_str_search_document)[0]['@views'];
            this.openAppInfoTab = objectToArray(json.EWS.o_appraiser_4_c.yglui_str_search_document)[0]['@tartb'];
            this.openAppInfoAppId = objectToArray(json.EWS.o_appraiser_4_c.yglui_str_search_document)[0]['@appid'];
       }

    //this.setRefreshButton();
},
/*
* @method testandObserveLinks
* @desc asign onclick to the link
*/
testandObserveLinks: function() {
    for (var i = 0; i < this.arrayOfInputs.length; i++)
        if (this.arrayOfInputs[i].id.include('ApproveReject') || this.arrayOfInputs[i].id.include('SendManager'))
        this.arrayOfInputs[i].observe('click', this.clickingOnDocument.bind(this));

},
/*
* @method clickingOnDocument
* @param event {Object} object that has the link with the id of the document
* @desc we get the id of the doc clicked
*/
clickingOnDocument: function(event) {
    var idOfLink=event.element().identify().split('_')[1];
          var handler = global.open($H({
            app: {
                appId: this.openAppInfoAppId,	
                tabId: this.openAppInfoTab,	                        
                view: this.openAppInfoView
            },
            idOfDoc:idOfLink,
            previousApp:this.options.appId
          }));
},
/**
* @description function that will sumbit for approval selected documents
*/
callToSubmitAll: function(getDocsToSend, action, obj) {
    if (action == 'SENDMANAGER') {
        var comment = $('PFM_CommentBox_2upApproval').value;
    } else {
        var comment = $('PFM_CommentBox_2upApprovalRe').value;
    }
    var xmlId = ''
    objectToArray(getDocsToSend).each(function(item) {
        xmlId += '<DOCUMENT id="' + item['@doc_id'] + '" />'
    });

    this.makeAJAXrequest($H({ xml:
        '<EWS><SERVICE>SUBMIT_CALB</SERVICE><OBJECT TYPE=""/><OBJECT TYPE=""></OBJECT><DEL></DEL><GCC></GCC><LCC></LCC><PARAM><ACTIONS>' + action + '</ACTIONS><DOCUMENTS>' + xmlId + '</DOCUMENTS><COMMENT>' + comment + '</COMMENT><STEP></STEP></PARAM></EWS>',
        successMethod: this.reloadDistribution.bind(this, this.empId)
    }));
},
/**
* @description function that will sumbit for approval selected documents
*/
callToSubmitIndv: function(listToSubmit, action, obj) {
    if (action == 'SENDMANAGER') {
        var comment = $('PFM_CommentBox_2upApproval').value;
    } else {
        var comment = $('PFM_CommentBox_2upApprovalRe').value;
    }
    if (listToSubmit) {
        this.makeAJAXrequest($H({ xml:
        '<EWS><SERVICE>SUBMIT_CALB</SERVICE><OBJECT TYPE=""/><OBJECT TYPE=""></OBJECT><DEL></DEL><GCC></GCC><LCC></LCC><PARAM><ACTIONS>' + action + '</ACTIONS><DOCUMENTS>' + listToSubmit + '</DOCUMENTS><COMMENT>' + comment + '</COMMENT><STEP></STEP></PARAM></EWS>',
            successMethod: this.reloadDistribution.bind(this, this.empId)
        }));
    }
},

reloadDistribution: function(obj) {
    this.firstRun = true;
    this.calibrationContainer.update('');
    this.run(this.options.appId)
},
/**
*@param $super The superclass: Application
*@description Closes the application
*/
close: function($super) {
    this.firstRunCal = true;
    this.table2Showed = false;
    this.tableShowed = false;
    $super();
},

/**
* @description function that will create a refresh button and position it at the bottom of the individual docs section
*/
setSendManagerButton: function() {
    // Add button to refresh the list of individual documents
    if (this.refresh) {
        var divButtonsToJson = new Element('div', {
            'id': 'divButtonsJson_sendManager'
        });

        var commentIndDocs = new Element('div', ({
            'id': 'comment_indDocs',
            'class': 'PFM_CommentLabel'
        })).update(global.getLabel('PFM_CommentIndDocs'));

        divButtonsToJson.insert(commentIndDocs);

        var commentPFM = new Element('input', {
            'id': 'PFM_CommentBox_2upApproval',
            'class': 'PFM_commentBox',
            'type': 'text',
            'size': '30px',
            'value': '',
            'maxlength': '255'
        });

        divButtonsToJson.insert(commentPFM);

        var buttonJson = {
            elements: []
        };


        var auxSubmitMngr = {
            idButton: 'PFM_SubmitMngr',
            label: global.getLabel('PFM_SubmitMngr'),
            handlerContext: null,
            handler: null,
            className: 'PMF_showDocsButton',
            type: 'button',
            standardButton: true
        };

        buttonJson.elements.push(auxSubmitMngr);

        this.ButtonRefreshDocs = new megaButtonDisplayer(buttonJson);
        divButtonsToJson.insert(this.ButtonRefreshDocs.getButtons());
        this.ButtonRefreshDocs.disable('PFM_SubmitMngr');

        $("virtualDocs_sendManagerButton").insert(divButtonsToJson);
        this.refresh = false;
    };
},
/**
* @description function that will create a refresh button and position it at the bottom of the individual docs section
*/
setApprovalButtons: function() {
    // Add button to refresh the list of individual documents
    if (this.refresh2) {
        var divButtonsToJson = new Element('div', {
            'id': 'divButtonsJson_approveReject'
        });

        var commentIndDocs = new Element('div', ({
            'id': 'comment_indDocs',
            'class': 'PFM_CommentLabel'
        })).update(global.getLabel('PFM_CommentIndDocs'));

        divButtonsToJson.insert(commentIndDocs);

        var commentPFM = new Element('input', {
            'id': 'PFM_CommentBox_2upApprovalRe',
            'class': 'PFM_commentBox',
            'type': 'text',
            'size': '30px',
            'value': '',
            'maxlength': '255'
        });

        divButtonsToJson.insert(commentPFM);

        var buttonJson = {
            elements: []
        };
        var auxReject = {
            idButton: 'PFM_2upReject',
            label: global.getLabel('PFM_RejectRatings'),
            handlerContext: null,
            handler: null,
            className: 'PMF_showDocsButton',
            type: 'button',
            standardButton: true
        };

        buttonJson.elements.push(auxReject);
        var auxApprove = {
            idButton: 'PFM_2upApprove',
            label: global.getLabel('PFM_ApproveRatings'),
            handlerContext: null,
            handler: null,
            className: 'PMF_showDocsButton',
            type: 'button',
            standardButton: true
        };

        buttonJson.elements.push(auxApprove);

        this.ButtonRefreshDocs = new megaButtonDisplayer(buttonJson);
        divButtonsToJson.insert(this.ButtonRefreshDocs.getButtons());
        this.ButtonRefreshDocs.disable('PFM_2upApprove');
        this.ButtonRefreshDocs.disable('PFM_2upReject');

        $("virtualDocs_approveRejectButtons").insert(divButtonsToJson);
        this.refresh2 = false;
    };
},

/**
*@param args Args received when an employee is selected
*@description repositions in one brick the top rating boxes. 
*/
checkHasTop: function(parent, args, i, x, action) {
    ratingNodes = parent.parentNode.parentNode.children[x].children[1].children;
    if (ratingNodes.length > 0) {
        for (var z = 0; z < ratingNodes.length; z++) {
                  pos = ratingNodes[z].style.top; 
        }
    }
},
/**
*@param args Args received when an employee is selected
*@description shows or hide the rating calibration box for the selected employee
*/
hideShowRating: function(args, action) {
    if (args.id != global.objectId) {
        var nodeBox = 'Rating_' + args.id;
        if ($(nodeBox) != null) {
            var parent = $(nodeBox).parentNode;
            for (var x = 0; x < parent.parentNode.parentNode.children.length; x++) {
                if (parent.parentNode.parentNode.children[x].className == 'calibration_Area') {
                    for (var i = 0; i < parent.parentNode.parentNode.children[x].children[1].children.length; i++) {
                        if (parent.parentNode.parentNode.children[x].children[1].children[i].id == 'Rating_' + args.id) {
                            parent.parentNode.parentNode.children[x].children[1].children[i].style.display = action;
                            this.checkHasTop(parent, args, i, x, action);
                        }
                    }
                }
            }
        }
    }
},

/**
*@param args Args received when an employee is selected
*@description Loads the selected user calibration
*/
onEmployeeSelected: function(args) {
    this.hideShowRating(args, 'block');
},
/**
* @param args Args received when an employee is unselected
* @description This function is call every time an employee is unselected on the left menu
*/
onEmployeeUnselected: function(args, obj) {
    this.hideShowRating(args, 'none');
}
});
