var CompOrgUnits = Class.create(Menu, {
    /**
    * Used to keep the review periods begda and ennda and the selected review period
    * 
    * @type Hash
    */
    data: $H({}),

    objectType: null,

    objectId: null,

    content: null,

    initialize: function($super, id, options) {
        $super(id, options);

        // function to be called when the user selects a review period
        this.orgUnitSelectedBind = this.orgUnitSelected.bind(this);
        document.observe("EWS:compensationOrgUnitSelected", this.orgUnitSelectedBind);
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
        this.changeTitle(global.getLabel("compOrgUnits"));
        if (this.objectType != global.objectType && this.objectId != global.objectId) {
            this.objectId = global.objectId;
            this.objectType = global.objectType;
        // generate the XML for the call
        var orgUnitsServiceCallJSON = {
            EWS: {
                SERVICE: "COM_GET_OU_MGR",
                OBJECT: {
                    "-TYPE": global.objectType,
                    "#text": global.objectId
                }
            }
        };
        var conversor = new XML.ObjTree();
        var orgUnitsServiceCallXML = conversor.writeXML(orgUnitsServiceCallJSON);
        //and make the call to the service
        this.makeAJAXrequest($H({
            xml: orgUnitsServiceCallXML,
            successMethod: "orgUnitsSuccess"
        }));
        }
        else {
            this.changeContent(this.content);
        }
    },

    orgUnitsSuccess: function(json) {
        var orgs = objectToArray(json.EWS.o_ou_mgr.yglui_str_com_ou_mgr);
        this.content = new Element("div", {
            id: "org_units_periods_menu_content",
            "class": "",
            'align': 'left'
        });

        var list = new Element("ul", { 'class': 'my_selections_employeeList' });

        //adds each period to the menu
        if (orgs.length > 0) {
            orgs.each(function(field, i) {

            var listItem = new Element("li", { 'class': 'my_selections_employeeLi' });
                var orgUnit = new Element("input", {
                    type: "radio",
                    id: "org_unit_" + i,
                    name: "org_units",
                    "class": "my_selections_selection",
                    value: field["@objid"]
                });

                orgUnit.observe('click', function(event) {
                    document.fire('EWS:compensationOrgUnitSelected', {
                        id: "org_unit_" + i,
                        orgunit: field['@objid']
                    })
                });

                //variable for the description of the review period
                var orgUnitDesc = new Element("span", {
                    "class": "application_text_bolder application_main_soft_text"
                }).update(field["@stext"]);

                listItem.insert(orgUnit).insert(orgUnitDesc);
                //this.content.insert(revPeriod).insert(revPeriodDesc).insert("<br />");
                list.insert(listItem);
                //stores the begda and endda of the review period
            } .bind(this));
        }
        //the first period in the list is selected by default
        this.content.insert(list);
        if (this.data.get("selected")) {
            this.content.down("input#" + this.data.get("selected")).checked = true;
            this.content.down("input#" + this.data.get("selected")).defaultChecked = true;
        }
        else {
            this.content.down("input").checked = true;
            this.content.down("input").defaultChecked = true;
            this.data.set("selected", "org_unit_0");
        }
        this.changeContent(this.content);
        try {
						// modified miguelg - 20100224 begin: change parentElement by parentNode, so Firefox can understand
            if (orgs.length == 1)
                //document.getElementById('org_units_periods_menu_content').parentElement.parentElement.style.display = "none";
                document.getElementById('org_units_periods_menu_content').parentNode.parentNode.style.display = "none";
            else
                //document.getElementById('org_units_periods_menu_content').parentElement.parentElement.style.display = "";
                document.getElementById('org_units_periods_menu_content').parentNode.parentNode.style.display = "";
            // modified miguelg - 20100224 end
        } catch (e) { }
    },

    orgUnitSelected: function(event) {
        this.data.set("selected", event.memo.id);
    }
});