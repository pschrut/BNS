/**
* @constructor Budgets
* @description Implements Budgets menu.
* @augments Menu
*/
var Budgets = Class.create(Menu, {
    /**
    * Used to keep budget information
    * 
    * @type Hash
    */
    data: $H({}),

    tabId: 0,

    initialJson: null,

    isLoaded: false,

    counter: 0,
    
    budgetSymbol: "$",

    /**
    * @type Hash
    * @description List of labels added dynamically
    */
    dynLabels: null,

    budgetsServiceCallJSON: {
        EWS: {
            SERVICE: "COM_GET_BUDGT",
            OBJECT: {
                "-TYPE": '',
                "#text": ''
            },
            PARAM: {
                period_begda: '',
                period_endda: '',
                review_period: '',
                comp_category: ''
            }
        }
    },

    initialize: function($super, id, options) {
        $super(id, options);
        this.dynLabels = $H();
        this.budgetHoverBind = this.budgetHover.bind(this);
        this.budgetOutBind = this.budgetOut.bind(this);

        this.onOrgUnitSelectBinding = this.onOrgUnitSelect.bindAsEventListener(this);
        document.observe("EWS:compensationOrgUnitSelected", this.onOrgUnitSelectBinding);

        this.tabSwitchBind = this.tabSwitch.bind(this);
        document.observe("EWS:changeScreen", this.tabSwitchBind);

        this.reviewPeriodSelectedBind = this.reviewPeriodSelected.bind(this);
        document.observe("EWS:compensationReviewPeriodSelected", this.reviewPeriodSelectedBind);

        this.budgetUpdateBind = this.budgetUpdate.bind(this);
        document.observe("EWS:compensation_updatedAmount", this.budgetUpdateBind);

        this.undoSelectedBind = this.undoSelected.bind(this);
        document.observe("EWS:undoSelectedCOM", this.undoSelectedBind);
        this.data.set("selected", "rev_period_0");

    },

    /**
    * 
    * @param {Object}
    *            $super
    * @param {Object}
    *            element
    */
    show: function($super, element) {
        $super(element);
        this.changeTitle(global.getLabel("budgets"));
    },

    budgetsSuccess: function(json) {
        this.counter--;
        if (this.counter < 0)
            this.counter = 0;
        this.initialJson = json;
        this.drawContent(json);
    },

    drawContent: function(json) {
        this.content = new Element("div", {
            id: "budgets_menu_content",
            "class": "menus_myTeamFieldContent"
        });
        this.addToLabels(json);
        var budgetsTable = new Element("table", { 'width': '100%' });
        var budgetsTableBody = new Element("tbody");
        var budgetsRow;
        var budgetsDesc;
        var budgetsVal;
        var budgetsCellD;
        var budgetsCellV;
        var recBudgets = null;
        if (!Object.isEmpty(json.EWS.o_budgets)) {
            recBudgets = objectToArray(json.EWS.o_budgets.yglui_str_com_budget);
            //adds each budget to the menu
            if (recBudgets.length > 0) {
                recBudgets.each(function(field, i) {
                    budgetsRow = new Element("tr", {
                        "id": "budgetRow"
                    });
                    //variable for the description of the budget
                    var budgetsDesc = new Element("span", {
                        "class": "application_text_bolder"
                    }).update(field["@stext"]);

                    //variable for the remaining amount of the budget
                    var remNum = field["@bud_remain"];
                    remNum = longToDisplay(parseFloat(remNum));
                    
                    // Currency symbol does not need to be displayed for unit budgets
                    // TODO: Stop hard coding '$' as the currency symbol 
                    if ((!field["@currency"]) || (field["@currency"] == ""))
                        this.budgetSymbol = "";
                    else
                        this.budgetSymbol = "$";
                    var budgetsVal = new Element("span", {
                        "class": "application_text_bolder",
                        "id": "budgetRow_" + field["@butyp"],
                        "remaining": field["@bud_remain"],
                        "spent": field["@bud_spent"],
                        "total": field["@bud_total"]
                    }).update(this.budgetSymbol + remNum);

                    budgetsVal.observe("mouseover", this.budgetHoverBind);
                    budgetsVal.observe("mouseout", this.budgetOutBind);

                    budgetsCellD = new Element("td", {
                        "style": "width: 100px", 'style': 'white-space:nowrap;', 'widht': '70%'
                    });
                    budgetsCellV = new Element("td", {
                        "style": "text-align: right", 'style': 'white-space:nowrap;', 'align': 'right'
                    });

                    budgetsCellD.insert(budgetsDesc);
                    budgetsCellV.insert(budgetsVal);

                    if ((field["@bud_remain"] - 0) < 0) {
                        budgetsCellV.style.color = "red";
                    }
                    else {
                        budgetsCellV.style.color = "black";
                    }
                    budgetsRow.insert(budgetsCellD).insert(budgetsCellV);
                    budgetsTableBody.insert(budgetsRow);
                    this.data.set("budget", {
                        remaining: field["@bud_remain"],
                        total: field["@bud_total"],
                        spent: field["@bud_spent"],
                        objid: field["@objid"],
                        butyp: field["@butyp"]
                    });
                } .bind(this));
            }
        }
        else {
            var tr = new Element('tr');
            var td = new Element('td');
            tr.insert(td);
            td.insert(new Element('span').update(this.getDynLabels('noBudgets')));
            budgetsTableBody.insert(tr);
        }
        budgetsTable.insert(budgetsTableBody);
        this.content.insert(budgetsTable).insert("<div id='bHover' style='text-align: right'/>");
        this.changeContent(this.content);
    },

    reviewPeriodSelected: function(event) {
        if (this.counter == 0 && this.tabId > 0 && this.budgetsServiceCallJSON.EWS.PARAM.review_period != event.memo.period) {
            this.budgetsServiceCallJSON.EWS.PARAM.period_begda = event.memo.begda;
            this.budgetsServiceCallJSON.EWS.PARAM.period_endda = event.memo.endda;
            this.budgetsServiceCallJSON.EWS.PARAM.review_period = event.memo.period;
            var conversor = new XML.ObjTree();
            var budgetsServiceCallXML = conversor.writeXML(this.budgetsServiceCallJSON);
            //make the call to the service
            this.makeAJAXrequest($H({
                xml: budgetsServiceCallXML,
                successMethod: "budgetsSuccess"
            }));
            this.counter++;
        }
        else {
            if (this.budgetsServiceCallJSON.EWS.PARAM.review_period != event.memo.period) {
                this.budgetsServiceCallJSON.EWS.PARAM.period_begda = event.memo.begda;
                this.budgetsServiceCallJSON.EWS.PARAM.period_endda = event.memo.endda;
                this.budgetsServiceCallJSON.EWS.PARAM.review_period = event.memo.period;
            }
        }
        this.data.set("selected", event.memo.id);
    },

    onOrgUnitSelect: function(ev) {
        if (this.counter == 0 && this.tabId > 0 && this.budgetsServiceCallJSON.EWS.OBJECT['#text'] != event.memo.orgunit) {
            this.budgetsServiceCallJSON.EWS.OBJECT['-TYPE'] = 'O';
            this.budgetsServiceCallJSON.EWS.OBJECT['#text'] = event.memo.orgunit;
            var conversor = new XML.ObjTree();
            var budgetsServiceCallXML = conversor.writeXML(this.budgetsServiceCallJSON);
            this.makeAJAXrequest($H({
                xml: budgetsServiceCallXML,
                successMethod: "budgetsSuccess"
            }));
            this.counter++;
        }
        else {
            if (this.budgetsServiceCallJSON.EWS.OBJECT['#text'] != event.memo.orgunit) {
                this.budgetsServiceCallJSON.EWS.OBJECT['-TYPE'] = 'O';
                this.budgetsServiceCallJSON.EWS.OBJECT['#text'] = event.memo.orgunit;
            }
        }
    },

    budgetHover: function(event) {
        var originalTarget = getEventSrc(event);
        var budgetOriginal = new Element("span", {
            "class": "application_text_bolder application_main_soft_text"
        });

        var dispNum = originalTarget.getAttribute('total');
        dispNum = longToDisplay(parseFloat(dispNum));

        budgetOriginal.update("Original budget: " + this.budgetSymbol + dispNum);
        var budgetSpent = new Element("span", {
            "class": "application_text_bolder application_main_soft_text"
        });

        dispNum = originalTarget.getAttribute('spent');
        dispNum = longToDisplay(parseFloat(dispNum));
        budgetSpent.update("Spent budget: " + this.budgetSymbol + dispNum);
        this.content.down("div#bHover").update(budgetOriginal).insert("<br />").insert(budgetSpent);
    },

    budgetOut: function(event) {
        this.content.down("div#bHover").update("");
    },

    undoSelected: function() {
        this.drawContent(this.initialJson);
    },

    tabSwitch: function(event) {
        this.tabId = 0;
        switch (event.memo.get("className")) {
            case "SalaryReview":
                this.tabId = 1;
                break;
            case "BonusPayment":
                this.tabId = 2;
                break;
            case "LTI":
                this.tabId = 4;
                break;
            default:
                break;
        }
        var conversor = new XML.ObjTree();
        this.budgetsServiceCallJSON.EWS.PARAM.comp_category = this.tabId;
        var budgetsServiceCallXML = conversor.writeXML(this.budgetsServiceCallJSON);
        //make the call to the service
        if (this.counter == 0 && this.tabId > 0) {
            this.makeAJAXrequest($H({
                xml: budgetsServiceCallXML,
                successMethod: "budgetsSuccess"
            }));
            this.counter++;
        }
        this.data.set("selected", event.memo.id);

    },

    budgetUpdate: function(event) {
        var budgetId = "budgetRow_" + event.memo.args[4].value;
        var buggetSpan = document.getElementById(budgetId);
				if (buggetSpan)
				{
	        var remaining = buggetSpan.readAttribute("remaining");
	        var spent = buggetSpan.readAttribute("spent");
	        var total = buggetSpan.readAttribute("total");
	
	        spent = Math.round((spent - 0) * 100) / 100 + Math.round(((event.memo.value - 0) - (removeCommas(event.memo.args[5].oldvalue) - 0)) * 100) / 100
	        remaining = Math.round(((total - 0) - spent) * 100) / 100;
	        budgetId = "budgetRow_" + event.memo.args[4].value;
	        buggetSpan = document.getElementById(budgetId);
	        if (remaining < 0) {
	            buggetSpan.style.color = "red";
	        }
	        else {
	            buggetSpan.style.color = "black";
	        }
	
	        buggetSpan.writeAttribute("spent", spent);
	        buggetSpan.writeAttribute("remaining", remaining);
	
	        buggetSpan.update(this.budgetSymbol + longToDisplay(remaining));
	      }
    },

    /**
    * @description Add the dynamic labels from the received XML to a global list
    * @param {Object} json the received XML with Json format
    */
    addToLabels: function(json) {
        if (Object.isEmpty(json.EWS.labels)) return;
        objectToArray(json.EWS.labels.item).each(function(label) {
            if (!Object.isEmpty(label['@id']) && !Object.isEmpty(label['@value']))
                this.dynLabels.set(label['@id'], label['@value']);
        } .bind(this));
    },
    /**
    * @description Get the label associated to an Id
    * @param {String} labelId Id of the label to get
    */
    getDynLabels: function(labelId) {
        if (Object.isEmpty(labelId)) return '';
        var label = this.dynLabels.get(labelId);
        if (Object.isEmpty(label)) label = labelId;
        return label;
    }

});