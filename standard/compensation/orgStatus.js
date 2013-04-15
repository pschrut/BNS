/**
* @constructor Budgets
* @description Implements Budgets menu.
* @augments Menu
*/
var OrgStatus = Class.create(Menu, {
    /**
    * Used to keep budget information
    * 
    * @type Hash
    */
    data: $H({}),

    counter: 0,

    tabId: 0,

    orgStatusServiceCallJSON: {
        EWS: {
            SERVICE: "COM_ORG_STATUS",
            PARAM: {
                review: '',
                begda: '',
                endda: ''
            }
        }
    },

    initialize: function($super, id, options) {
        $super(id, options);
        this.reviewPeriodSelectedBind = this.reviewPeriodSelected.bind(this);
        document.observe("EWS:compensationReviewPeriodSelected", this.reviewPeriodSelectedBind);

        this.onOrgUnitSelectBinding = this.onOrgUnitSelect.bindAsEventListener(this);
        document.observe("EWS:compensationOrgUnitSelected", this.onOrgUnitSelectBinding);

        this.tabSwitchBind = this.tabSwitch.bind(this);
        document.observe("EWS:changeScreen", this.tabSwitchBind);

        this.statusUpdatedBind = this.statusUpdated.bind(this);
        document.observe("EWS:statusUpdatedCOM", this.statusUpdatedBind);
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
        this.changeTitle(global.getLabel("orgStatus"));
    },

    orgStatusSuccess: function(json) {
        this.counter--;
        if (this.counter < 0)
            this.counter = 0;
        this.content = new Element("div", {
            id: "org_status_menu_content",
            "class": "menus_myTeamFieldContent"
        });

        var statusTable = new Element("table");
        var statusTableBody = new Element("tbody");
        var statusRow;
        var statusDesc;
        var statusVal;
        var statusCellD;
        var statusCellV;

        var recStatus = json.EWS.o_statuses.yglui_str_statuses;
        //adds each budget to the menu
        var new_tot = 0;
        if (recStatus.length > 0) {
            recStatus.each(function(field, i) {
                if (field["@stat_text"] == "New") {
                    new_tot = field["@stat_value"];
                }
                else {
                    statusRow = new Element("tr");

                    statusDesc = new Element("span", {
                        "class": "application_text_bolder"
                    }).update(field["@stat_text"]);

                    statusVal = new Element("span", {
                        "class": "application_text_bolder"
                    }).update(field["@stat_value"]);

                    statusCellD = new Element("td", {
                        "style": "width: 100px"
                    });
                    statusCellV = new Element("td", {
                        "style": "text-align: right"
                    });

                    statusCellD.insert(statusDesc);
                    statusCellV.insert(statusVal);

                    statusRow.insert(statusCellD).insert(statusCellV);
                    statusTableBody.insert(statusRow);
                }
            } .bind(this));

            statusTable.insert(statusTableBody);

            var statusTableT = new Element("table", {
                "style": "border-top: 1px solid black"
            });

            var statusTableTBody = new Element("tbody");

            statusRow = new Element("tr");
            statusDesc = new Element("span", {
                "class": "application_text_bolder"
            }).update("Total");

            statusVal = new Element("span", {
                "class": "application_text_bolder"
            }).update(((json.EWS.o_total - 0) - (new_tot - 0)));

            statusCellD = new Element("td", {
                "style": "width: 100px"
            });
            statusCellV = new Element("td", {
                "style": "text-align: right"
            });

            statusCellD.insert(statusDesc);
            statusCellV.insert(statusVal);

            statusRow.insert(statusCellD).insert(statusCellV);
            statusTableTBody.insert(statusRow);
            statusTableT.insert(statusTableTBody);

            this.content.insert(statusTable).insert(statusTableT);
            this.changeContent(this.content);
        }
    },

    tabSwitch: function(event) {
        this.tabId = 0;
        switch (event.memo.get("className")) {
            case "ReviewAndSend":
                this.tabId = 99;
                break;
            default:
                break;
        }
        var conversor = new XML.ObjTree();
        var orgStatusServiceCallXML = conversor.writeXML(this.orgStatusServiceCallJSON);
        //make the call to the service
        if (this.counter == 0 && this.tabId == 99) {
            this.counter++;
            this.makeAJAXrequest($H({
                xml: orgStatusServiceCallXML,
                successMethod: "orgStatusSuccess"
            }));
        }
    },


    onOrgUnitSelect: function(event) {
        if (this.currentOrg == "" || event.memo.orgunit != this.currentOrg) {
            this.currentOrg = event.memo.orgunit;
            this.orgStatusServiceCallJSON = {
                EWS: {
                SERVICE: "COM_ORG_STATUS",
                    OBJECT: {
                        "-TYPE": "O",
                        "#text": this.currentOrg
                    },
                    PARAM: {
                        review: this.orgStatusServiceCallJSON.EWS.PARAM.review,
                        begda: this.orgStatusServiceCallJSON.EWS.PARAM.begda,
                        endda: this.orgStatusServiceCallJSON.EWS.PARAM.endda
                    }
                }
            };
            var conversor = new XML.ObjTree();
            var orgStatusServiceCallXML = conversor.writeXML(this.orgStatusServiceCallJSON);
            //make the call to the service
            if (this.counter == 0 && this.tabId == 99) {
                this.counter++;
                this.makeAJAXrequest($H({
                    xml: orgStatusServiceCallXML,
                    successMethod: "orgStatusSuccess"
                }));
            }
        }
    },

    reviewPeriodSelected: function(event) {
        if (this.counter == 0 && this.tabId > 0 && this.orgStatusServiceCallJSON.EWS.PARAM.review != event.memo.period) {
            this.orgStatusServiceCallJSON.EWS.PARAM.begda = event.memo.begda;
            this.orgStatusServiceCallJSON.EWS.PARAM.ennda = event.memo.endda;
            this.orgStatusServiceCallJSON.EWS.PARAM.review = event.memo.period;
            var conversor = new XML.ObjTree();
            var orgStatusServiceCallXML = conversor.writeXML(this.orgStatusServiceCallJSON);
            //make the call to the service
            this.makeAJAXrequest($H({
                xml: orgStatusServiceCallXML,
                successMethod: "orgStatusSuccess"
            }));
            this.counter++;
        }
        else {
            if (this.orgStatusServiceCallJSON.EWS.PARAM.review != event.memo.period) {
                this.orgStatusServiceCallJSON.EWS.PARAM.begda = event.memo.begda;
                this.orgStatusServiceCallJSON.EWS.PARAM.endda = event.memo.endda;
                this.orgStatusServiceCallJSON.EWS.PARAM.review = event.memo.period;
            }
        }
        this.data.set("selected", event.memo.id);
    },

    statusUpdated: function(event) {
        var conversor = new XML.ObjTree();
        var orgStatusServiceCallXML = conversor.writeXML(this.orgStatusServiceCallJSON);
        //make the call to the service
        if (this.counter == 0 && this.tabId == 99) {
            this.counter++;
            this.makeAJAXrequest($H({
                xml: orgStatusServiceCallXML,
                successMethod: "orgStatusSuccess"
            }));
        }
    }

});