/**
* @constructor MyDetails2
* @description Implements My Details menu.
* @augments EmployeeMenu
*/

var MyDetails2 = Class.create(EmployeeMenu,
/**
* @lends MyDetails2
*/
{
/**
* It contains the data from the MY_DETAILS service
* but in a easier to understand and to use format.
* @type Hash
*/
_data: null,

/**
* Marks if a particular area has been already visited by the user or not
* if not the user will be automatically selected.
*/
_visitedArea: null,

initialize: function ($super, id, options) {
    $super(id, options);
    this._content.addClassName("my_details_menu_content");
    this._data = $H({});
    this._visitedArea = $H({});
},

/**
* Takes the element with the color for this employee
* @param {String} objectId the pernr
* @return Element the HTML with the proper classes to fit in the menu
* 						and show the color
*/
getColorElement: function (objectId) {
    var colorElement = this._colorElements.get(objectId)[global.getSelectionType(this.application)];
    if (!colorElement.hasClassName("my_details_color")) {
        colorElement.addClassName("my_details_color");
    }
    return colorElement;
},

/**
* Takes the element to make the selections depending whether it's single
* or multiple selection
* @param {String} objectId the pernr
* @return Element returns the checkbox or radio button depending
* 				   on the selection type.
*/
getSelectionElement: function (objectId) {
    var selectionElement;
    if (global.getSelectionType(this.application) == "single") {
        selectionElement = this._selectElements.get(objectId).radio;
    } else if (global.getSelectionType(this.application) == "multi") {
        selectionElement = this._selectElements.get(objectId).checkbox;
    }
    return selectionElement;
},

/**
* Creates an HTML element for one detail using its label and value
* @param {String} label
* @param {String} text
* @return {JSON} a JSON containing a property for the label HTML element and another one for the value HTML.
*/
getDetailElement: function (label, value) {

    //puth both label and value into a container
    var labelDiv = new Element("div", {
        "class": "my_details_keyDiv"
    }).update(label);

    var valueDiv = new Element("span", {
        "class": "application_text_bolder my_details_valueDiv"
    }).update(value);

    return {
        label: labelDiv,
        value: valueDiv
    };

},
/**
* Creates the html code needed to represent one object's position
* and it's details which can be hidden and shown.
* @param {String} objectId
* @param {String} position
* @param {Array} detailElements
* 
* @return {Element} the HTML for the position
*/
getPositionElement: function (objectId, position, positionIndex, detailElements) {

    //Create the global container for the position
    var positionIdContainer = new Element("div", {
        id: "my_details_" + objectId + "_" + position,
        "class": "my_details_positionIdDiv"
    });


    //Hide and populate the details contaienr
    var detailsContainer = new Element("div", {
        "class": "my_details_detailsDiv"
    });

    detailsContainer.hide();
    detailElements.each(function (detail) {
        detailsContainer.insert(detail.label);
        detailsContainer.insert(detail.value);
    });

    //Create the container for the object ID
    var idSpan = new Element("div", {
        'tabindex': '0',
        "class": "application_action_link",
        "title": objectId, "alt": objectId
    }).update(objectId);

    var idContainer = new Element("div", {
        "class": "my_details_idDiv"
    }).insert(idSpan);

    if (this._data.get("hasSelections") && positionIndex == 0 && global.getSelectionType(this.application) != "none") {
        idContainer.insert({
            top: this.getSelectionElement(objectId)
        });
    } else {
        idContainer.addClassName("my_details_idDiv_noRadio");
    }


    //make the objectId text be able to hide and show the details
    idSpan.observe("click", detailsContainer.toggle.bind(detailsContainer));
    idSpan.observe("keydown", detailsContainer.toggle.bind(detailsContainer));

    //Create the position name container
    var positionContainer = new Element("div", {
        "class": "my_details_positionName"
    }).insert(new Element("abbr", {
        title: position
    }).update(new Element("span", {
        "class": "application_text_bolder"
    }).update(position)));

    positionIdContainer.insert(idContainer).insert(positionContainer);

    //Get the color element for the object Id (only if it's the first one)
    if (positionIndex == 0) {
        var colorElement = this.getColorElement(objectId);
        //positionIdContainer.insert(colorElement);
        if (global.employeeIsSelected(objectId)) {
            this.select(objectId);
        }
    }

    //insert the details element
    positionIdContainer.insert(detailsContainer);

    return positionIdContainer;
},

/**
* Selects the current logged employee if needed.
*/
initialSelections: function () {

    var hasSelections = this._data.get("hasSelections");
    var hasSelectionType = global.getSelectionType(this.application) != "none";
    var objects = this._data.get("objects").keys();

    var population = global.getPopulationName(this.application.tabId);
    //get if the area has been already visited

    var visited = this._visitedArea.get(population);

    if (visited) {
        visited = this._visitedArea.get(population)[global.getSelectionType(this.application)];
    }

    if (!this._visitedArea.get(population)) {
        this._visitedArea.set(population, {
            single: global.getSelectionType(this.application) == "single",
            multi: global.getSelectionType(this.application) == "multi"
        });
    }
    //select the user if not visited and put it as visited.
    if (hasSelections && hasSelectionType && !visited || !visited) {

        global.setEmployeeSelected(global.objectId, true);
        this._visitedArea.get(population)[global.getSelectionType(this.application)] = true;
    }

},

/**
* Keeps the menus synchronized when single selection mode
*/
menuSync: function ($super, event) {
    var args = getArgs(event);
    var employeeId = args.employeeId;
    var selected = args.selected;

    if (!this._data.get("objects").keys().include(employeeId)) {
        return;
    }

    if (global.getSelectionType(this.application) == "single" && selected) {
        this.select(employeeId);
    } else if (global.getSelectionType(this.application) == "single") {
        this.unselect(employeeId);
    } else if (global.getSelectionType(this.application) == "multi" && selected) {
        this.select(employeeId);
    } else if (global.getSelectionType(this.application) == "multi") {
        this.unselect(employeeId);
    }

},

/**
* Handles the MY_DETAILS service response and renders
* the menu content when this is done.
*/
myDetailsSuccess: function (json) {
    this.parseMyDetailsData(json);
    this.initializeElements(this._data.get("objects").keys());
    this.renderMenu();
    this.initialSelections();
},

/**
* Handles the MY_DETAILS service response and parses the data
* to prepare it to be shown in the menu
* @param {JSON} json The response from the service
*/
parseMyDetailsData: function (json) {
    this._data.set("objectName", json.EWS.o_name);
    this._data.set("hasSelections", json.EWS.o_selection == "X");
    var objects = $H();
    //Parse the details
    if (json.EWS.o_details.yglui_str_pd_detail) {
        objectToArray(json.EWS.o_details.yglui_str_pd_detail).each(function (object) {

            //parse the details
            var details = $A();
            var objectId = object["@object"];

            //add the objectId to global if its different from the one in global

            if (objectId != global.objectId) {
                global.addColor(objectId);
                global.populations.each(function (population) {
                    if (!population.value.get(objectId)) {
                        population.value.set(objectId, {
                            type: global.objectType,
                            name: global.name,
                            singleSelected: true,
                            singleElement: null,
                            singleColor: 0,
                            multiSelected: true,
                            multiElement: null,
                            multiColor: 0,
                            actual: true
                        });
                    }
                });
            }

            if (Object.jsonPathExists(object, "fields.yglui_str_wid_field")) {
                var jsonDetails = object.fields.yglui_str_wid_field;
                objectToArray(jsonDetails).each(function (detail) {
                    details.push({
                        label: detail["@fieldlabel"],
                        text: detail["#text"]
                    });
                });
            }

            //Parse the positions
            var positions = $A();
            var orgUnits = $A();
            //Get the employee positions (if any)
            if (object.positions) {
                var jsonPositions = object.positions.yglui_str_o_s;
                objectToArray(jsonPositions).each(function (positionAndOrgUnit) {
                    //Get the position itselft
                    var position = positionAndOrgUnit.positions;
                    //and the related orgunit details
                    var orgUnit = positionAndOrgUnit.orgunits.yglui_str_wid_field;
                    //get the position name
                    positions.push(position["#text"]);
                    //get the organizational unit data
                    orgUnits.push({
                        label: this.labels.get(orgUnit["@fieldid"]),
                        text: orgUnit["#text"]
                    });
                } .bind(this));
            }
            //The employee doesn't have positions
            else {
                positions.push(global.getLabel("noPosition"));
            }

            //store the details, positions and orgunits for this object
            objects.set(objectId, {
                details: details,
                positions: positions,
                orgUnits: orgUnits
            });

        } .bind(this));

        this._data.set("objects", objects);
    }
},

/**
* Renders the whole menu and it's content.
*/
renderMenu: function ($super) {

    // insert the name to be shown in the top of the menu
    var objectNameContainer = new Element("div", {
        id: "my_details_username"
    }).insert(new Element("button", {
        "class": "application_text_bolder"
    }).update(this._data.get("objectName")));

    this._content.update(objectNameContainer);

    //Insert the object type and the position headers.
    var objectTypeContainer = new Element("div", {
        "class": "my_details_oType_container"
    });

    var objectTypeHeader = new Element("div", {
        "class": "my_details_oType application_text_bolder application_main_soft_text"
    }).update(global.getLabel("MYDETAILSID"));

    objectTypeContainer.insert(objectTypeHeader);

    var positionLabelHeader = new Element("div", {
        "class": "my_details_positionLabel application_text_bolder application_main_soft_text"
    }).update(global.getLabel("position"));

    objectTypeContainer.insert(positionLabelHeader);

    this._content.insert(objectTypeContainer);

    //Loop all the objects and draw them
    this._data.get("objects").each(function (object) {
        var details = object.value.details;
        var positions = object.value.positions;
        var orgUnits = object.value.orgUnits;

        positions.each(function (position, positionIndex) {
            //get the orgUnit related to this position
            var orgUnit = orgUnits[positionIndex];

            //put all the details together with the orgunit to
            //loop them.
            if (orgUnit) {
                var allDetails = $A([orgUnit, details]).flatten();
            } else {
                allDetails = details;
            }

            //get all the detail elements into an array
            var detailElements = $A();

            allDetails.each(function (detail) {
                var label = detail.label;
                var text = detail.text;

                var detailElement = this.getDetailElement(label, text);
                detailElements.push(detailElement);
            } .bind(this));

            //use all the previous to get the position element, with the clickable objectid,
            //the position text and the show/hide details container
            var positionElement = this.getPositionElement(object.key, position, positionIndex, detailElements);

            this._content.insert(positionElement);

        } .bind(this));
    } .bind(this));

    $super();
},

/**
* Handles one employee selection
*/
select: function ($super, event, employeeId) {
    $super(event, employeeId);
},
/**
* Shows the menu widget in the proper element and starts the call
* to the MY_DETAILs service
* @param {Element} element the HTML element in which the menu will be shown
*/
show: function ($super, element) {
    this.changeTitle(global.getLabel("myDetails"));

    //menu container
    //		this._content.update();


    $super(element);

    // generate the XML for the call
    var myDetailsServiceCallJSON = {
        EWS: {
            SERVICE: "MY_DETAILS",
            OBJECT: {
                "-TYPE": global.objectType,
                "#text": global.objectId
            }
        }
    };
    var conversor = new XML.ObjTree();
    var myDetailsServiceCallXML = conversor.writeXML(myDetailsServiceCallJSON);
    //and make the call to the service
    this.makeAJAXrequest($H({
        xml: myDetailsServiceCallXML,
        successMethod: this.myDetailsSuccess.bind(this)
    }));
},
/**
* Handles one employee unselection
*/
unselect: function ($super, event, employeeId) {
    $super(event, employeeId);
},

/**
* Super class close method
*/
close: function ($super) {
    $super();
}

});