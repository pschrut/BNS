/**
* @constructor MyBenefits
* @description Class to implement the My Benefits menu.
* @augments Menu
*/
var MyBenefits = Class.create(Menu,
/**
* @lends MyBenefits
*/
{

selectedAdjustmentReason: "",
statusCell: null,

initialize: function($super, id, options) {
    $super(id, options);

    var selectedMenuItem = 0;
    var lastMenuItem = 0;

    this.plansArray = null;

    this.getBenefitsEventInfoMenuBind = this.getBenefitsEventInfoMenu.bind(this);
    document.observe("EWS:benefits_1_eventSelected", this.getBenefitsEventInfoMenuBind);

    this.highlightMenuItemBind = this.highlightMenuItem.bind(this);
    document.observe("EWS:benefits_1_menuItemSelected", this.highlightMenuItemBind);

    this.goBackOnePageBind = this.goBackOnePage.bind(this);
    document.observe("EWS:benefits_1_goBackOnePage", this.goBackOnePageBind);

    this.goForwardOnePageBind = this.goForwardOnePage.bind(this);
    document.observe("EWS:benefits_1_goForwardOnePage", this.goForwardOnePageBind);

    this.updateMenuItemBind = this.updateMenuItem.bind(this);
    document.observe("EWS:benefits_1_updateMenuItem", this.updateMenuItemBind);

    this.resetMenuBind = this.resetMenu.bind(this);
    document.observe("EWS:benefits_1_resetMenu", this.resetMenuBind);

    this.goToPageBind = this.goToPage.bind(this);
    document.observe("EWS:benefits_1_goToPage", this.goToPageBind);

    this.closeEnrollmentBind = this.closeEnrollment.bind(this);
    document.observe("EWS:benefits_1_closeEnrollment", this.closeEnrollmentBind);

},

closeEnrollment: function() {
    document.fire("EWS:benefits_1_resetMenu");
},

close: function($super) {
    $super();
    document.stopObserving("EWS:benefits_1_eventSelected", this.getBenefitsEventInfoMenuBind);
    if (!Object.isEmpty(this.benefitsMenuContent))
        this.benefitsMenuContent = '';
},

resetMenu: function() {
    var selectedMenuItem = 0;
    var lastMenuItem = 0;

    this.plansArray = null;
    this.benefitsMenuContent.update(global.getLabel('noEnrollmentSelected'));
},

/**
* 
* @param {Object} $super
* @param {Object} element
* @param args
*/
show: function($super, element, args) {
    $super(element);
    if (Object.isEmpty(this.benefitsMenuContent)) {
        this.changeTitle(global.getLabel("My Benefits"));
        this.benefitsMenuContent = new Element("div", {
            id: "my_benefits_menu_content",
            style: "clear:both"
        });
        this.benefitsMenuContent.update(global.getLabel('noEnrollmentSelected'));
    }
    this.changeContent(this.benefitsMenuContent);
},

getBenefitsEventInfoMenu: function(event) {
    this.selectedAdjustmentReason = event.memo;
    this.makeAJAXrequest($H({ xml: '<EWS><SERVICE>GET_PLANS</SERVICE><OBJECT TYPE="' + global.objectType + '">' + global.objectId + '</OBJECT><PARAM><EVENT_CODE>' + event.memo + '</EVENT_CODE></PARAM></EWS>', successMethod: 'changeBenefitsMenu' }));
},

changeBenefitsMenu: function(inputXml) {
    //Put in code in here to manipulate the results of the GET_PLANS call to display in the benefits menu.  -JP-
    this.benefitsMenuContent.update('');
    this.changeContent(this.benefitsMenuContent);
    global.parseLabels(inputXml.EWS.labels, "GET_PLANS");
    var plans = objectToArray(inputXml.EWS.o_benefits.yglui_str_ben_plan_out);
    this.plansArray = plans;
    var plansTable = new Element("table", {});
    var plansTableBody = new Element("tbody", {});
    plansTable.insert(plansTableBody);
    var totalCost = 0.0;
    var singlePlan = Class.create({ planText: '', planID: '', appID: '' });
    var arrayOfPlans = $A();
    var currentArrayIndex = 0;

    plans.each(function(row, i) {
        var newPlansTableRow = new Element("tr", {});
        var onclickEvent = "javascript:document.fire('EWS:benefits_1_selectPage', '" + currentArrayIndex + "');";

        if (i == 0) {
            var colspan = 2;
        } else {
            var colspan = 1;
        }
        var newPlansTableCellText = '<td style="text-align:left;" colspan="' + colspan + '" class="titleCell, application_benefits_unselected_item" onclick="' + onclickEvent + '">' + row['@plan_text'] + '</td>';

        var mySinglePlan = new singlePlan();

        mySinglePlan.planText = row['@plan_text'];
        if (!mySinglePlan.planText) { mySinglePlan.planText = ''; }
        mySinglePlan.planID = row['@plan_type'];
        if (!mySinglePlan.planID) { mySinglePlan.planID = ''; }
        mySinglePlan.appID = row['@appid'];
        if (!mySinglePlan.appID) { mySinglePlan.appID = ''; }
        arrayOfPlans[currentArrayIndex] = mySinglePlan;
        currentArrayIndex++;
        plansTableBody.insert(newPlansTableRow);
        //newPlansTableCellText.update(row['@plan_text']);
        newPlansTableRow.insert(newPlansTableCellText);
        if (i != 0) {
            var newPlansTableCellCost = new Element("td", { style: "text-align:right", width: "50%" });
            if (row['@plan_categ']) {
                newPlansTableCellCost.update(longToDisplay(Number(row['@cost']), 2));
            }
            else {
                newPlansTableCellCost.update('');
            }
            newPlansTableRow.insert(newPlansTableCellCost);
            totalCost += row['@cost'];
        }
    } .bind(this));

    var newPlansTableRow = new Element("tr", {});
    //var onclickEvent = "javascript:document.fire('EWS:benefits_1_selectPage', $H({ rowNumber: " + currentArrayIndex + ", planText: 'Summary' }));document.fire('EWS:benefits_1_startPlanPage', $H({ rowNumber: " + currentArrayIndex + ", planText: 'Summary' }));selectedMenuItem = " + currentArrayIndex + ";";
    var onclickEvent = "javascript:document.fire('EWS:benefits_1_selectPage', " + currentArrayIndex + ");selectedMenuItem = " + currentArrayIndex + ";";
    var newPlansTableCellText = '<td style="text-align:left;" class="titleCell, application_benefits_unselected_item" onclick="' + onclickEvent + '">Summary</td>';

    var mySinglePlan = new singlePlan();
    var mySinglePlan2 = new singlePlan();

    mySinglePlan.planText = 'Summary';
    if (!mySinglePlan.planText) { mySinglePlan.planText = ''; }
    mySinglePlan.planID = '';
    if (!mySinglePlan.planID) { mySinglePlan.planID = ''; }
    mySinglePlan.appID = '';
    if (!mySinglePlan.appID) { mySinglePlan.appID = ''; }
    arrayOfPlans[currentArrayIndex] = mySinglePlan;

    mySinglePlan2.planText = 'Confirmation';
    if (!mySinglePlan2.planText) { mySinglePlan2.planText = ''; }
    mySinglePlan2.planID = '';
    if (!mySinglePlan2.planID) { mySinglePlan2.planID = ''; }
    mySinglePlan2.appID = '';
    if (!mySinglePlan2.appID) { mySinglePlan2.appID = 'CONFIRMATION'; }
    arrayOfPlans[currentArrayIndex + 1] = mySinglePlan2;

    plansTableBody.insert(newPlansTableRow);
    //newPlansTableCellText.update('Summary');
    newPlansTableRow.insert(newPlansTableCellText);


    var statusRow = new Element("tr", {});
    this.statusCell = new Element("td", { colspan: 2, style: "text-align: left;font-weight:bold;color:red;" });
    this.statusCell.addClassName("application_text_bolder");
    this.statusCell.update(global.getLabel("statusNew", "GET_PLANS"));

    statusRow.insert(this.statusCell);
    plansTableBody.insert(statusRow);

    lastMenuItem = currentArrayIndex;

    document.fire("EWS:benefits_1_adjustmentReasonSelected", $H({ array: arrayOfPlans, selectedAdjustmentReason: this.selectedAdjustmentReason }));
    this.benefitsMenuContent.insert(plansTable);

},

highlightMenuItem: function(args) {
    var args = getArgs(args);
    rowNumber = args.get("rowNumber");
    selectedMenuItem = args.get("rowNumber");
    selectedItemText = args.get("planText");

    //document.fire("EWS:benefits_1_updatePlanTitle", { planTitle: selectedItemText });

    while (this.benefitsMenuContent.down('td.application_benefits_selected_item')) {
        this.benefitsMenuContent.down('td.application_benefits_selected_item').addClassName('application_benefits_unselected_item');
        this.benefitsMenuContent.down('td.application_benefits_selected_item').removeClassName('application_benefits_selected_item');
    }
    if (this.benefitsMenuContent.down('td.application_benefits_unselected_item', rowNumber)) {
        this.benefitsMenuContent.down('td.application_benefits_unselected_item', rowNumber).addClassName('application_benefits_selected_item');
    }

},

updateMenuItem: function(args) {
    var args = getArgs(args);
    value = args.newValue;

    if (args.newValue != null) {
        if (this.benefitsMenuContent.down('td.application_benefits_selected_item').nextElementSibling) {
            this.benefitsMenuContent.down('td.application_benefits_selected_item').nextElementSibling.innerHTML = longToDisplay(Number(value), 2);
        } else {
            this.benefitsMenuContent.down('td.application_benefits_selected_item').nextSibling.innerHTML = longToDisplay(Number(value), 2);
        }
    }
    this.statusCell.update(global.getLabel("statusChanged", "GET_PLANS"));
},

goBackOnePage: function(args) {
    selectedMenuItem--;
    if (selectedMenuItem == this.plansArray.length) {
        document.fire("EWS:benefits_1_startPlanPage", $H({ 'rowNumber': selectedMenuItem, 'planText': 'Summary' }));
    }
    else if (selectedMenuItem == this.plansArray.length + 1) {
        document.fire("EWS:benefits_1_startPlanPage", $H({ 'rowNumber': selectedMenuItem, 'planText': 'Confirmation' }));
    }
    else {
        document.fire("EWS:benefits_1_startPlanPage", $H({ 'rowNumber': selectedMenuItem, 'planText': this.plansArray[selectedMenuItem]["@plan_text"] }));
    }
    document.fire("EWS:benefits_1_menuItemSelected", $H({ 'rowNumber': selectedMenuItem }));

    if (selectedMenuItem == 0) {
        document.fire("EWS:benefits_1_disableButton", { 'buttonID': 'benefits_buttonPrevious' });
    }
},

goForwardOnePage: function(args) {
    selectedMenuItem++;
    if (selectedMenuItem == this.plansArray.length) {
        document.fire("EWS:benefits_1_startPlanPage", $H({ 'rowNumber': selectedMenuItem, 'planText': 'Summary' }));
    }
    else if (selectedMenuItem == this.plansArray.length + 1) {
        document.fire("EWS:benefits_1_startPlanPage", $H({ 'rowNumber': selectedMenuItem, 'planText': 'Confirmation' }));
    }
    else {
        document.fire("EWS:benefits_1_startPlanPage", $H({ 'rowNumber': selectedMenuItem, 'planText': this.plansArray[selectedMenuItem]["@plan_text"] }));
    }
    document.fire("EWS:benefits_1_menuItemSelected", $H({ 'rowNumber': selectedMenuItem }));
},

goToPage: function(args) {
    args = getArgs(args);
    selectedMenuItem = args.pageNumber;
    if (selectedMenuItem == "summary") {
        selectedMenuItem = this.plansArray.length;
    }
    if (selectedMenuItem == this.plansArray.length) {
        document.fire("EWS:benefits_1_startPlanPage", $H({ 'rowNumber': selectedMenuItem, 'planText': 'Summary' }));
    }
    else {
        document.fire("EWS:benefits_1_startPlanPage", $H({ 'rowNumber': selectedMenuItem, 'planText': this.plansArray[selectedMenuItem]["@plan_text"] }));
    }
    document.fire("EWS:benefits_1_menuItemSelected", $H({ 'rowNumber': selectedMenuItem }));

    if (selectedMenuItem == 0) {
        document.fire("EWS:benefits_1_disableButton", { 'buttonID': 'benefits_buttonPrevious' });
    }
}

});