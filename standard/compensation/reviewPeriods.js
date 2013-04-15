/**
* @constructor ReviewPeriods
* @description Implements Review Periods menu.
* @augments Menu
*/
var ReviewPeriods = Class.create(Menu, {
    /**
    * Used to keep the review periods begda and ennda and the selected review period
    * 
    * @type Hash
    */
    data: $H({}),

    objectType: null,

    objectId: null,

    content: null,

    /**
    * @type Hash
    * @description List of labels added dynamically
    */
    dynLabels: null,


    counter: 0,

    initialize: function($super, id, options) {
        $super(id, options);
        this.dynLabels = $H();
        // function to be called when the user selects a review period
        this.reviewPeriodSelectedBind = this.reviewPeriodSelected.bind(this);
        this.savedTabBind = this.savedTab.bind(this);
        //Initialize all COM tabs to listen to review periods changes
        global.initializeApplicationByAppId('COM_SALR');
        global.initializeApplicationByAppId('COM_BOPA');
        global.initializeApplicationByAppId('COM_LTI');
        global.initializeApplicationByAppId('COM_RAS');
        document.observe("EWS:compensationReviewPeriodSelected", this.reviewPeriodSelectedBind);
        document.observe("EWS:savedTab", this.savedTabBind);
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
        this.changeTitle(global.getLabel("reviewPeriods"));
        
        if ((this.objectType != global.objectType && this.objectId != global.objectId) || (Object.isEmpty(this.content) && this.counter == 0)) {
            this.counter++;
            this.objectId = global.objectId;
            this.objectType = global.objectType;
            // generate the XML for the call
            var reviewPeriodsServiceCallJSON = {
                EWS: {
                    SERVICE: "COM_GET_PRIOD"
                }
            };
            var conversor = new XML.ObjTree();
            var reviewPeriodsServiceCallXML = conversor.writeXML(reviewPeriodsServiceCallJSON);
            //and make the call to the service
            this.makeAJAXrequest($H({
                xml: reviewPeriodsServiceCallXML,
                successMethod: "reviewPeriodsSuccess"
            }));
        }
        else {
            try {
                if (!Object.isEmpty(this.content)) {
                    this.changeContent(this.content);
                }
            }
            catch (e) { }
        }

    },

    savedTab: function() {
        document.fire('EWS:compensationReloadTable', {
            id: this.data.get("selected"),
            period: this.content.down("input#" + this.data.get("selected")).getAttribute("value"),
            begda: this.data.get(this.content.down("input#" + this.data.get("selected")).getAttribute("value")).begda,
            endda: this.data.get(this.content.down("input#" + this.data.get("selected")).getAttribute("value")).endda
        });
    },

    reviewPeriodsSuccess: function(json) {
        this.counter--;
        if (this.counter < 0)
            this.counter = 0;
        this.addToLabels(json);
        this.content = new Element("div", {
            id: "review_periods_menu_content",
            "class": "",
            'align': 'left'
        });
        if (Object.isEmpty(json.EWS.o_periods)) {
            this.content.insert(new Element('span').update(this.getDynLabels('noPeriods')));
            this.changeContent(this.content);
            return;
        }
        var periods = objectToArray(json.EWS.o_periods.yglui_str_periods);
        var list = new Element("ul", { 'class': 'my_selections_employeeList' });

        //adds each period to the menu
        if (periods.length > 0) {
            periods.each(function(field, i) {

                var listItem = new Element("li", { 'class': 'my_selections_employeeLi' });
                var revPeriod = new Element("input", {
                    type: "radio",
                    id: "rev_period_" + i,
                    name: "rev_periods",
                    "class": "my_selections_selection my_selections_selectionClear",
                    value: field["@crevi"]
                });

                revPeriod.observe('click', function(event) {
                    document.fire('EWS:compensationReviewPeriodSelected', {
                        id: 'rev_period_' + i,
                        period: field['@crevi'],
                        begda: field['@slbeg'],
                        endda: field['@slend'],
                        // added miguelg - 20100604 begin. Flag to indicate whether the event happens when the user clicks
                        clicked: true
                        // adeed miguelg - 20100604 end
                    })
                });

                //variable for the description of the review period
                var revPeriodDesc = new Element("span", {
                    "class": "application_text_bolder application_main_soft_text"
                }).update(field["@crevi_text"]);
                var revPeriodDescAbbr = new Element('abbr');
                revPeriodDescAbbr.insert(revPeriodDesc);
                listItem.insert(revPeriod).insert(revPeriodDescAbbr);
                //this.content.insert(revPeriod).insert(revPeriodDesc).insert("<br />");
                list.insert(listItem);
                //stores the begda and endda of the review period
                this.data.set(field["@crevi"], {
                    begda: field["@slbeg"],
                    endda: field["@slend"]
                });
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
            this.data.set("selected", "rev_period_0");
        }
        this.changeContent(this.content);

        document.fire('EWS:compensationReviewPeriodSelected', {
            id: this.data.get("selected"),
            period: this.content.down("input#" + this.data.get("selected")).getAttribute("value"),
            begda: this.data.get(this.content.down("input#" + this.data.get("selected")).getAttribute("value")).begda,
            endda: this.data.get(this.content.down("input#" + this.data.get("selected")).getAttribute("value")).endda
        });
    },

    reviewPeriodSelected: function(event) {
        this.data.set("selected", event.memo.id);
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