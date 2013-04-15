/**
 * @constructor MySelections2
 * @description Class to implement the My Selections menu.
 * @augments Menu
 */
var MySelections2 = Class.create(EmployeeMenu,
/**
* @lends MySelections2
*/
{

/**
* Tell whether to show the ID on the left menus or not
* @type Boolean
*/
showId: null,
/**
* Name for the group that is being showed
*/
actualGroupName: null,
/**
* ID for the group that is being showed
*/
actualGroupId: null,
/**
* Button container for the groups button
*/
groupButtonContainer: null,
/**
* Element that shows the name of the group
*/
actualGroupNameElement: null,
/**
* Id for the actual population 
*/
populationId: null,

/**
* Width for the balloon 
*/
balloonWidth: 400,

initialize: function($super, id, options) {
    $super(id, options);
    this.showId = global.showId;
    document.observe("EWS:addEmployee", this.addEmployee.bind(this));
},

/**
* Initializes the employee names one of the employees in the population
*/
_initializeNameElement: function($super, employeeId) {
    $super(employeeId);
    //initialize the element
    var employeeNameContainer = new Element("div", {
        "class": "my_selections_employeeNameDiv"
    }).update(new Element("span", {
        "class": "application_text_bolder application_main_soft_text"
    }).update(new Element("abbr", {
        "title": this.population.get(employeeId).name
    }).update(this.population.get(employeeId).name)));
    //and fill it
    this._nameElements.set(employeeId, employeeNameContainer);
},

/**
* Give the proper styles to the selection elements
*/
_initializeSelectElement: function($super, employeeId) {
    $super(employeeId);
    //give the myselection style
    this._selectElements.get(employeeId).radio.addClassName("my_selections_selection");
    this._selectElements.get(employeeId).checkbox.addClassName("my_selections_selection");
    //Add the proper style if the id is being shown
    if (!this.showId) {
        this._selectElements.get(employeeId).radio.addClassName("my_selections_selectionClear");
        this._selectElements.get(employeeId).checkbox.addClassName("my_selections_selectionClear");
    }
},

/**
* Adds an employee to the menu
*/
addEmployee: function(args) {
    var employeeId = getArgs(args);
    //don't add the user if it already exists
    if (this._selectElements.get(employeeId)) {
        return;
    }
    this.initializeElements($A([employeeId]));
    var employeeElement = this.getEmployeeElement(employeeId);
    this.employeeList.insert({
        top: employeeElement
    });
    new Effect.Highlight(employeeElement.down("div.my_selections_employeeNameDiv"), {
        startcolor: "#66AA00",
        endcolor: "#ffffff"
    });
},

/**
* Gets the advanced search ID for this menu.
* @return {String} the advanced search id
*/
getAdvancedSearchId: function() {
    var advSearchId = global.tabid_leftmenus.get(this.application.tabId).get(this.menuId).advancedSearchId;
    return advSearchId ? advSearchId : "STD_P2";
},

/**
* Returns a DIV with the proper styling containing the color element for
* the employee
*/
getColorElement: function(employeeId) {
    var employeeColorContainer = this._colorElements.get(employeeId)[global.getSelectionType(this.application)];
    employeeColorContainer.addClassName("my_selections_employeeColor");
    if (!this.showId) {
        employeeColorContainer.addClassName("my_selections_employeeColor_noId");
    }
    return employeeColorContainer;
},
/**
* Returns a container with all the elements for a given employee
* (selection, color, employee name, etc...)
*/
getEmployeeElement: function(employeeId) {

    var employeeElement = new Element("li", {
        "class": "my_selections_employeeLi"
    });
    //insert the selection element
    employeeElement.insert(this.getSelectionElement(employeeId));

    //Insert the employee name
    employeeElement.insert(this._nameElements.get(employeeId));

    //create and insert insert the employee id element(if global.showId)
    var employeeIdContainer = new Element("div", {
        "class": "my_selections_employeeIdDiv"
    }).update(this.showId ? pernrToDisplay(employeeId) : "");

    employeeElement.insert(employeeIdContainer);

    //Insert the color element for the employee
    employeeElement.insert(this.getColorElement(employeeId));

    return employeeElement;

},

/**
* Returns the element contining the selection element.
*/
getSelectionElement: function(employeeId) {
    var selectionElement;
    //get the element depending on the selection type
    if (global.getSelectionType(this.application) == "single") {
        selectionElement = this._selectElements.get(employeeId).radio;
    }
    else
        if (global.getSelectionType(this.application) == "multi") {
        selectionElement = this._selectElements.get(employeeId).checkbox;
    }
    //and enclose it whith a container
    var selectionElementContainer = new Element("div");
    if (this.showId) {
        selectionElementContainer.setStyle({
            "float": "left"
        });
    }
    selectionElementContainer.insert(selectionElement);

    if (global.employeeIsSelected(employeeId)) {
        this.select(employeeId);
    }

    return selectionElementContainer;
},

/**
* keeps the menus synchronized when working on single select mode
*/
menuSync: function($super, event) {

    if (!this.application || !this.population) {
        return;
    }

    var args = getArgs(event);
    var employeeId = args.employeeId;
    var selected = args.selected;

    //exit since this is a synchro event for my details
    if (global.getSelectionType(this.application) == "none" || this.population.get(employeeId) && this.population.get(employeeId).actual) {
        return;
    }

    if (global.getSelectionType(this.application) == "single" && selected) {
        this.select(employeeId);
    }
    else
        if (global.getSelectionType(this.application) == "single") {
        this.unselect(employeeId);
    }
    else
        if (global.getSelectionType(this.application) == "multi" && selected) {
        this.select(employeeId);
    }
    else
        if (global.getSelectionType(this.application) == "multi") {
        this.unselect(employeeId);
    }

},

/**
* Overriden to disallow selecting more persons than indicated on GET_USETTINGS
*/
onClickSelect: function($super, event, employeeId) {
    var count = 0;
    var maxSelection = global.maxSelectedEmployees;
    this.population.each(function(employee) {
        count = global.employeeIsSelected(employee.key) ? count + 1 : count;
    });

    var multiSelection = global.getSelectionType(this.application) == "multi";

    if (multiSelection && (count <= maxSelection && $F(event.element()) != null || $F(event.element()) == null) ||
		!multiSelection) {

        $super(event, employeeId);
    }
    else {
        this._infoMethod("Maximum selection number reached");
        event.element().checked = false;
    }
},

/**
* Draws the menu in the screen
*/
show: function($super, element, menuArgs) {
    this.populationId = global.getPopulationName(global.currentApplication.tabId);
    this.changeTitle(global.getLabel("mySelections"));

    if (Prototype.Browser.IE && this._content.parentNode) {
        this._content.remove();
    }

    //Set the population as the current application's one
    var populationName = global.getPopulationName(global.getTabIdByAppId(this.application.appId));
    this.population = menuArgs.rolid ? menuArgs.rolId : global.populations.get(populationName);

    //don't draw the menu if no employees in the population
    if (!this.population) {
        return;
    }
    //Create a Json so we can use the list search module
    this.populationJson = {
        elements: []
    };
    var populationKeys = this.population.keys();
    var populationSize = populationKeys.size();
    for (var i = 0; i < populationSize; i++) {
        var employee = this.population.get(populationKeys[i]);
        var jsonElement = {
            text: employee.name,
            id: populationKeys[i]
        };
        this.populationJson.elements.push(jsonElement);
    }

    this._content.addClassName("my_selections_menu_content");

    // Advance search div construction, SRC_OV is the tag for Advanced Search

    var advancedSearchButton = new Element("div", {
        "class": "application_handCursor"
    }).insert(new Element("div", {
        "class": "application_catalog_image application_catalog_image_AS"
    }).insert("&nbsp")).insert(new Element("div", {
        "class": "as_button"
    }).insert(global.getLabel('SRC_OV'))).observe("click", global.open.bind(global, $H({
        app: {
            tabId: "POPUP",
            appId: "ADVS",
            view: "AdvancedSearch"
        },
        sadv_id: this.getAdvancedSearchId(),
        comeFromMenu: true
    })));

    this._content.update(advancedSearchButton);

    //Add the search field;
    this.searchField = new Element("input", {
        "class": "my_selections_searchField",
        "type": "text",
        "value": global.getLabel("search")
    });

    //Use the List Search module to search within the list
    this.listSearch = new ListSearch(this.populationJson.elements, {
        caseSensitive: false,
        returnHash: true,
        dataFilteredEvent: "EWS:mySelectionsSearch",
        searchField: this.searchField
    });

    //Observing the the search performed event, it prints the results
    document.observe('EWS:mySelectionsSearch', this.updatePopulationTable.bindAsEventListener(this));

    this._content.insert(this.searchField);

    //Groups button:
    //Show only if selection type is multiple:
    if (global.currentSelectionType == "multi") {
        //Buttons to select and deselect all
        //Create a JSon to create the megabutton selectAll
        var jsonGroupingButtons = {
            elements: [],
            defaultButtonClassName: 'application_action_link'
        };
        var jsonSelectAllButtonElement = {
            label: global.getLabel('selectAll'),
            idButton: 'myselections_selectAllButtonInner',
            className: 'application_action_link',
            handlerContext: null,
            handler: this.selectAll.bind(this),
            type: 'link'
        };
        jsonGroupingButtons.elements.push(jsonSelectAllButtonElement);

        var jsonDeselectAllButtonElement = {
            label: global.getLabel('deselectAll'),
            className: 'application_action_link',
            idButton: 'myselections_deselectAllButtonInner',
            handlerContext: null,
            handler: this.deselectAll.bind(this),
            type: 'link'
        };
        jsonGroupingButtons.elements.push(jsonDeselectAllButtonElement);

        //Create a JSon to create the megabutton for groups
        var groups = global.groups.get(global.getPopulationName(global.currentApplication.tabId));
        var numberOfGroups = 1;
        var defaultGroup = null;
        var defaultGroupName = global.getLabel("all");
        if (!Object.isEmpty(groups) && !Object.isEmpty(groups.groups)) {
            numberOfGroups = 1 + groups.groups.size(); // +1 because we are counting the "all" group
            if (!Object.isEmpty(groups.defaultGroup)) {
                defaultGroup = groups.groups.get(groups.defaultGroup);
                defaultGroupName = defaultGroup.name;
            }
        }
        var jsonGroupButtonElement = {
            idButton: "myselections_groupsButtonInner",
            label: (global.getLabel('groups') + '(' + numberOfGroups + ')'),
            className: 'application_action_link',
            handlerContext: null,
            handler: this.openGroupManagerPopUp.bind(this),
            type: 'link'
        };
        jsonGroupingButtons.elements.push(jsonGroupButtonElement);
        //We call ButtonDisplayer class to get the elements to display
        this.groupButtonDisplayer = new megaButtonDisplayer(jsonGroupingButtons);
        this.groupButtonContainer = this.groupButtonDisplayer.getButtons();
        this.groupButtonContainer.id = "myselections_groupsButtons";
        this._content.insert(this.groupButtonContainer);

        //If there are no groups for this, we disable the button:
        if (groups == undefined || !groups) {
            this.groupButtonDisplayer.disable("myselections_groupsButtonInner");
        }

        //Name of the shown group
        this.actualGroupNameElement = new Element("div", {
            "class": "mySelections_groupName"
        }).insert(defaultGroupName);
        this._content.insert(this.actualGroupNameElement);

    }
    this.employeeList = new Element("ul", {
        "class": "my_selections_employeeList"
    });
    //Hash to store each row of the table
    this.rowsEmployeeList = $H();

    this._content.insert(this.employeeList);

    //set the initial status for all the elements needed for each employee.
    this.initializeElements(this.population.keys());

    //loop the employees in the population
    this.population.each(function(employee) {
        //do not draw if it's the actual employee
        if (employee.value.actual) {
            return;
        }

        var employeeId = employee.key;

        var employeeElement = this.getEmployeeElement(employeeId);
        //Store each row in a hash, so we can update the list efficiently
        this.rowsEmployeeList.set(employee.key, employeeElement);

        //Insert the employee element in the list
        this.employeeList.insert(employeeElement);

        if (global.employeeIsSelected(employee.key)) {
            this.select(employee.key);
        }

    } .bind(this));

    this.renderMenu();
    $super(element);
    //When all is created, open the default group
    if (!Object.isEmpty(defaultGroup) && defaultGroup.loaded) {
        this.openGroup(defaultGroup.id, false, true);
    }
},

/**
* Function called when we try to open the group popup.
* It calls the service to get the groups and name of each one:
*/
openGroupManagerPopUp: function() {
    var xmlIn = "<EWS>"
					+ "<SERVICE>GET_GROUP</SERVICE>"
					+ "<PARAM>"
						+ "<POPULATION_ID>" + this.populationId + "</POPULATION_ID>"
					+ "</PARAM>"
				+ "</EWS>"

    this.makeAJAXrequest($H({ xml: xmlIn, successMethod: 'showGroupManagerPopUp' }));
},

/**
* Shows the group manager pop up
* @param {Object} data The json received after calling the SAP service to get the name of the groups
*/
showGroupManagerPopUp: function(data) {
    //Update the name for the groups we have
    if (!Object.isEmpty(data) && !Object.isEmpty(data.EWS.o_groups) && !Object.isEmpty(data.EWS.o_groups.item)) {
        var items = objectToArray(data.EWS.o_groups.item);
        var groups = global.groups.get(this.populationId).groups;
        for (var i = 0; i < items.size(); i++) {
            if (groups.get(items[i]['@id'])) {
                //If the group exists, just update the name
                groups.get(items[i]['@id']).name = items[i]['@name']
            }
        }
    }

    this.contentGroupManager = new Element("div", {
        "id": "myselections_groupManagerDiv",
        "class": "application_text_bolder application_text_italic application_main_soft_text"
    });

    //Container for the add group part
    this.addGroupContainer = new Element("div", {
        "class": "myselection_addGroupContainer"
    });

    this.addGroupContainer.insert((new Element("p")).insert("Create new group from current selection:")); //TODO: use label instead of hard code
    //Text field for the name of the new group
    this.newGroupField = new Element("input", {
        "class": "myselections_newGroupField",
        "type": "text",
        "id": "myselections_newGroupField",
        "value": "",
        "maxlength": "20"
    });
    this.addGroupContainer.insert(this.newGroupField);
    //Add group button
    var jsonAddButton = {
        elements: [],
        defaultButtonClassName: ''
    };
    var jsonAddButtonElement = {
        label: global.getLabel('add'),
        idButton: 'mySelections_addButton',
        handlerContext: null,
        handler: this.addButtonPushed.bind(this),
        type: 'button',
        standardButton: true
    };
    jsonAddButton.elements.push(jsonAddButtonElement);
    //We call ButtonDisplayer class to get the elements to display
    this.addButtonDisplayer = new megaButtonDisplayer(jsonAddButton);
    this.addGroupContainer.insert(this.addButtonDisplayer.getButtons());
    this.addGroupContainer.insert(new Element("br"));
    this.contentGroupManager.insert(this.addGroupContainer);

    //Separator
    this.contentGroupManager.insert(new Element("div", {
        "class": "myselections_horizontalLine"
    }));

    this.contentGroupManager.insert((new Element("p")).insert("Manage or open group:")); //TODO: use label instead of hard code

    //Table with groups
    var groupsTable = new Element("table", {
        "class": "mySelections_groupTable"
    });
    var groupsTableHead = new Element("thead");
    this.groupsTableBody = new Element("tbody");
    groupsTableHead.insert(
		"<tr>"
			+ "<th>" + global.getLabel("delete") + "</th>"
			+ "<th id='mySelections_nameHeader'>" + global.getLabel("name") + "</th>"
			+ "<th>" + global.getLabel("default") + "</th>"
		+ "</tr>"
	);

    groupsTable.insert(groupsTableHead);
    groupsTable.insert(this.groupsTableBody);

    //Get the groups for this app: 
    var groups = global.groups.get(global.getPopulationName(global.currentApplication.tabId));

    //Add the all group:
    var isAllDefault = Object.isEmpty(groups.defaultGroup);
    this.addRowToGroupTable(null, global.getLabel("All"), isAllDefault);

    if (!Object.isEmpty(groups) && !Object.isEmpty(groups.groups)) {
        var groupsKeys = groups.groups.keys();
        for (var i = 0; i < groupsKeys.size(); i++) {
            this.addRowToGroupTable(groups.groups.get(groupsKeys[i]).id, groups.groups.get(groupsKeys[i]).name, groups.groups.get(groupsKeys[i]).isDefault);
        }
    }
    this.contentGroupManager.insert(groupsTable);

    //Options to open groups
    this.contentGroupManager.insert((new Element("p")).insert("Options to open groups:")); //TODO: use label instead of hard code
    this.option1Radio = new Element("input", {
        "type": "radio",
        "name": "groupManagerRadioGroup",
        "value": "add",
        "defaultChecked": "defaultChecked", //For IE
        "checked": "checked"
    });
    this.contentGroupManager.insert(this.option1Radio);
    this.contentGroupManager.insert("add employees of the group to My Selection"); //TODO: use label instead of hard code
    this.contentGroupManager.insert(new Element("br"));
    this.option2Radio = new Element("input", {
        "type": "radio",
        "name": "groupManagerRadioGroup",
        "value": "refresh"
    });

    this.contentGroupManager.insert(this.option2Radio);
    this.contentGroupManager.insert("refresh My Selection with these employees"); //TODO: use label instead of hard code

    //We use the Balloon component: it has only one instance, which we have to add content to everytime we open it
    this.showBalloon();

},

/**
* Shows or updates the balloon
*/
showBalloon: function() {
    balloon.showOptions($H({
        domId: this.groupButtonContainer.id,
        content: this.contentGroupManager,
        dinamicWidth: this.balloonWidth
    }));
},

/**
* Selects all the shown employees in my selections.
* If the number of employees is higher than the maximum selectable, we select only the maximum
*/
selectAll: function() {
    var populationKeys = this.population.keys();
    for (var i = 0; i < populationKeys.size(); i++) {
        var employee = this.population.get(populationKeys[i]);
        if (!employee.actual) {
            if (this.rowsEmployeeList.get(populationKeys[i]).visible()) {
                this.select(populationKeys[i]);
                global.setEmployeeSelected(populationKeys[i], true);
            }
        }
    }
},

/**
* Deselects all the shown employees in my selections.
*/
deselectAll: function() {
    var populationKeys = this.population.keys();
    for (var i = 0; i < populationKeys.size(); i++) {
        var employee = this.population.get(populationKeys[i]);
        if (!employee.actual) {
            this.unselect(populationKeys[i]);
            global.setEmployeeSelected(populationKeys[i], false);
        }
    }
},
/**
* Updates the population showing only the employees included in populationJson
* @param {Object} json
*/
updatePopulationTable: function(json) {
    var searchResults = this.listSearch.getResults();
    var populationKeys = this.population.keys();
    var populationSize = populationKeys.size();
    for (var i = 0; i < populationSize; i++) {
        var employee = this.population.get(populationKeys[i]);
        //If the employee is the actual employee, it's not shown, so no action is needed
        if (!employee.actual) {
            if (searchResults.get(populationKeys[i])) {
                //If the employee's name matches the search string
                this.rowsEmployeeList.get(populationKeys[i]).show();
            }
            else {
                //If the employee's name doesn't match the search string
                this.rowsEmployeeList.get(populationKeys[i]).hide();
            }
        }
    }
},
/**
* Called when the add button is pushed.
* If no employees are selected, or no name has been entered, it will inform the user
*/
addButtonPushed: function() {
    //Take the name from the input field
    var groupName = this.newGroupField.value;
    var population = global.populations.get(global.getPopulationName(global.currentApplication.tabId));
    var populationKeys = population.keys();
    this.newGroupMembers = $A();
    //Get the selected employees
    for (var i = 0; i < populationKeys.size(); i++) {
        //If it's the actual employee, don't add it
        if (global.employeeIsSelected(populationKeys[i]) && !population.get(populationKeys[i]).actual) {
            this.newGroupMembers.push(populationKeys[i]);
        }
    }
    if (Object.isEmpty(groupName)) {
        //If no name for the group has been entered
        alert('You must enter a name for the group');
        this.newGroupField.focus();
    }
    else if (this.newGroupMembers.size() == 0) {
        //If no employee is selected
        alert('You must select at least one member for the group');
        balloon.hide();
    } else {
        //Check if there's a group with that name
        var actualGroups = global.groups.get(this.populationId).groups;
        var actualGroupsKeys = actualGroups.keys();
        var repeatedName = false;
        for (var i = 0; i < actualGroupsKeys.size(); i++) {
            if (actualGroups.get(actualGroupsKeys[i]).name == groupName) {
                repeatedName = true;
                break;
            }
        }
        if (repeatedName && !confirm("There is already a group with this name.\n Are you sure you want to overwrite it?")) {
            this.newGroupField.focus();
        } else {
            this.addGroup(groupName, this.newGroupMembers, repeatedName);
        }
    }


},
/**
* Adds a group
* @param {String} name The name of the group
* @param {Array} members An array containing  the ids of the employees that will be in the group
*/
addGroup: function(name, members, overwrite) {
    if (Object.isEmpty(name) || Object.isEmpty(members)) {
        //If there is no name or members, do nothing:
        return;
    }
    var stringObjects = "";
    for (var i = 0; i < members.size(); i++) {
        stringObjects += "<YGLUI_STR_HROBJECT><OTYPE>P</OTYPE><OBJID>" + members[i] + "</OBJID></YGLUI_STR_HROBJECT>";
    }

    var xmlIn = "<EWS>"
					+ "<SERVICE>SET_GROUP</SERVICE>"
					+ "<PARAM>"
						+ "<POPULATION_ID>" + this.populationId + "</POPULATION_ID>"
						+ "<NAME>" + name + "</NAME>"
						+ "<OBJECTS>"
							+ stringObjects
						+ "</OBJECTS>"
					+ "</PARAM>"
				+ "</EWS>"

    this.makeAJAXrequest($H({ xml: xmlIn, successMethod: this.groupAdded.bind(this, overwrite) }));
},

/**
* Function called when a group has been added
*/
groupAdded: function(overwrite, data) {
    //Get the name of the group and members, to update the data in global
    var newGroupId = data.EWS.o_group['@id'];
    var newGroupName = data.EWS.o_group['@name'];
    var members = $H();
    for (var i = 0; i < this.newGroupMembers.size(); i++) {
        members.set(this.newGroupMembers[i], this.newGroupMembers[i]);
    }
    if (overwrite) {
        global.groups.get(this.populationId).groups.each(function(group) {
            if (group.value.name == newGroupName) {
                group.value.members = members;
                group.value.id = newGroupId;
                group.value.loaded = true;
            }
        } .bind(this));

    } else {
        //We add it for the current population in global
        this.setGroup(this.populationId, newGroupId, newGroupName, members);
        //Update the table in the groupManager popup
        this.addRowToGroupTable(newGroupId, newGroupName, false);
        //Update the number of groups in the Groups(X) button
        var newGroupNumber = global.groups.get(this.populationId).groups.keys().size() + 1;
        this.updateGroupNumberLabel(newGroupNumber);
        //Update the balloon, to show all the data without scroll
        balloon.hide();
    }
},

/**
* Adds a row to the the groups table in the manageGroups popup
* @param {Object} groupId The id of the group, null if it's the All group
* @param {Object} groupName The name of the group
* @param {Object} isDefault  If it's the default group
*/
addRowToGroupTable: function(groupId, groupName, isDefault) {
    var newRow = new Element("tr", {
        "id": "mySelections_groupRow_" + groupId,
        "class": "mySelections_groupRow"
    });
    var deleteColumn = new Element("td");
    var nameColumn = new Element("td");
    var defaultColumn = new Element("td");

    //Delete group button
    if (!Object.isEmpty(groupId)) {
        var jsonDeleteButton = {
            elements: []
        };
        var jsonDeleteButtonElement = {
            label: " ",
            idButton: 'mySelections_deleteButton' + groupId,
            className: 'application_currentSelection',
            handlerContext: null,
            handler: this.deleteButtonPushed.bind(this, groupId),
            type: 'link',
            standardButton: true
        };
        jsonDeleteButton.elements.push(jsonDeleteButtonElement);
        //We call ButtonDisplayer class to get the elements to display
        var deleteButtonDisplayer = new megaButtonDisplayer(jsonDeleteButton);
        deleteColumn.insert(deleteButtonDisplayer.getButtons());
    }


    //Megabutton to select the group
    var jsonOpenButton = {
        elements: []
    };
    var jsonOpenButtonElement = {
        label: groupName,
        idButton: 'mySelections_openButton' + groupId,
        className: 'application_action_link',
        handlerContext: null,
        handler: this.openButtonPushed.bind(this, groupId),
        type: 'link',
        standardButton: true
    };
    jsonOpenButton.elements.push(jsonOpenButtonElement);
    //We call ButtonDisplayer class to get the elements to display
    var openButtonDisplayer = new megaButtonDisplayer(jsonOpenButton);
    nameColumn.insert(openButtonDisplayer.getButtons());
    //Set default group radio

    var setDefaultRadio = new Element("input", {
        "id": "mySelections_radio_" + ((Object.isEmpty(groupId)) ? "all" : groupId),
        "type": "radio",
        "name": "groupTableRadioGroup",
        "value": "refresh"
    });
    if (isDefault) {
        setDefaultRadio.checked = true;
        setDefaultRadio.defaultChecked = true;
    }
    setDefaultRadio.observe("click", this.setDefaultRadioPushed.bind(this, groupId));
    defaultColumn.insert(setDefaultRadio);

	 if (Object.isEmpty(groupId)) {
	 	//If it's the "All" group, we'll store the radio button for default,
		//This will allow to set the "All" group as default when deleting the default group
		this.allDefaultRadio = setDefaultRadio;
	 }


    newRow.insert(deleteColumn);
    newRow.insert(nameColumn);
    newRow.insert(defaultColumn);
    this.groupsTableBody.insert(newRow);
},

/**
* Removes the group from the groups table in the popup
* @param {Object} groupId
*/
removeRowFromGroupTable: function(groupId) {
    var rowId = "mySelections_groupRow_" + groupId;
    this.groupsTableBody.down("#" + rowId).remove();
},


/**
* Updates the group number label
* @param {Object} newGroupNumber If it's set, uses this number, if not, gets it from global
*/
updateGroupNumberLabel: function(newGroupNumber) {
    //If we haven't received a group number:
    if (Object.isEmpty(newGroupNumber)) {
        if (!Object.isEmpty(global.groups.get(this.populationId))) {
            newGroupNumber = global.groups.get(this.populationId).groups.size() + 1;
        } else {
            newGroupNumber = -1;
        }
    }
    this.groupButtonDisplayer.updateLabel("myselections_groupsButtonInner", (global.getLabel('groups') + '(' + newGroupNumber + ')'));
},

/**
* Function called when the delete button for a group is used
* @param {Object} groupId
*/
deleteButtonPushed: function(groupId) {
    //Check if the parameter is received
    if (Object.isEmpty(groupId)) {
        return;
    }
    //Call the service to delete the group:
    var xmlIn = "<EWS>"
					+ "<SERVICE>UNSET_GROUP</SERVICE>"
					+ "<PARAM>"
                        + "<POPULATION_ID>" + this.populationId + "</POPULATION_ID>"
						+ "<GROUP id='" + groupId + "'></GROUP>"
					+ "</PARAM>"
				+ "</EWS>";
    this.makeAJAXrequest($H({ xml: xmlIn, successMethod: this.groupDeleted.bind(this, groupId) }));

},

/**
* When a group has been deleted
* @param {Object} data
*/
groupDeleted: function(groupId, data) {
    //Remove the group from the global data:
    this.unsetGroup(this.populationId, groupId);
    //Remove it from the table
    this.removeRowFromGroupTable(groupId);
    //Update the group number
    this.updateGroupNumberLabel();
},

/**
* Function called when the open button for a group is clicked
* @param {Object} groupId The id of the group, null if it's the "all" group
*/
openButtonPushed: function(groupId) {
    //If it's the all group
    if (Object.isEmpty(groupId)) {
        var selectMembers = false;
        var onlyShowMembers = false;
        if (this.option1Radio.checked) {
            selectMembers = true;
            onlyShowMembers = false;
        } else {
            selectMembers = true;
            onlyShowMembers = true;
        }
        this.openGroup(groupId, selectMembers, onlyShowMembers);
        //Close popup
        balloon.hide();
    } else {
        //If it's other, call the service, and select the ones returned by it.
        //Check if the group is already loaded
        var groups = global.groups.get(global.getPopulationName(global.currentApplication.tabId)).groups;
        if (groups.get(groupId)) {
            //If the group exists
            if (groups.get(groupId).loaded) {
                var selectMembers = false;
                var onlyShowMembers = false;
                if (this.option1Radio.checked) {
                    selectMembers = true;
                    onlyShowMembers = false;
                } else {
                    selectMembers = true;
                    onlyShowMembers = true;
                }
                this.openGroup(groupId, selectMembers, onlyShowMembers);
                //Close popup
                balloon.hide();
            } else {
                //Call the service to get the data
                var xmlIn = "<EWS>"
					+ "<SERVICE>GET_GROUP_VAL</SERVICE>"
					+ "<PARAM>"
						+ "<GROUP id='" + groupId + "'></GROUP>"
					+ "</PARAM>"
				+ "</EWS>";
                this.makeAJAXrequest($H({ xml: xmlIn, successMethod: 'groupLoaded' }));
            }
        }
    }
},

/**
* Function called when a group has been loaded
* @param {Object} data
*/
groupLoaded: function(data) {
    //Set the group in the global data
    if (!Object.isEmpty(data.EWS.o_group)) {
        var groupId = data.EWS.o_group['@id']
        var groupName = data.EWS.o_group['@name']
        var groupMembers = $H({});
        if (!Object.isEmpty(data.EWS.o_objects) && !Object.isEmpty(data.EWS.o_objects.yglui_str_hrobject)) {
            var membersJson = data.EWS.o_objects.yglui_str_hrobject;
            for (var i = 0; i < membersJson.size(); i++) {
                groupMembers.set(membersJson[i]['@objid'], membersJson[i]);
            }
        }
        this.setGroup(this.populationId, groupId, groupName, groupMembers);

        var selectMembers = false;
        var onlyShowMembers = false;
        if (this.option1Radio.checked) {
            selectMembers = true;
            onlyShowMembers = false;
        } else {
            selectMembers = true;
            onlyShowMembers = true;
        }
        this.openGroup(groupId, selectMembers, onlyShowMembers);
        //Close popup
        balloon.hide();
    }
},

/**
* Opens a group
* @param {Object} groupId
* @param {Object} selectMembers
* @param {Object} onlyShowMembers
*/
openGroup: function(groupId, selectMembers, onlyShowMembers) {
    //If it's the All group, show and select or not depending on the options
    var groupToOpen = null;
    var groupName = null;
    if (Object.isEmpty(groupId)) {
        //It's the "All" group
        groupToOpen = this.population;
        groupName = global.getLabel("All");
    } else {
        //A normal group
        //Check if the data exists in global
        if (!Object.isEmpty(global.groups.get(this.populationId)) && !Object.isEmpty(global.groups.get(this.populationId).groups.get(groupId))) {
            groupToOpen = global.groups.get(this.populationId).groups.get(groupId).members;
            groupName = global.groups.get(this.populationId).groups.get(groupId).name;
        } else {
            return;
        }
    }

    //Loop through the table to show and select depending on the options:
    if (onlyShowMembers || selectMembers) {
        var keysRowElements = this.rowsEmployeeList.keys();
        for (var i = 0; i < keysRowElements.size(); i++) {
            if (Object.isEmpty(this.population.get(keysRowElements[i]).actual) || !this.population.get(keysRowElements[i]).actual) {
                if (onlyShowMembers) {
                    //See if that person is in the group and show it or not dependeing on that:
                    if (!Object.isEmpty(groupToOpen.get(keysRowElements[i]))) {
                        //It's a member of the group
                        this.rowsEmployeeList.get(keysRowElements[i]).show();
                    } else {
                        //It's not a member of the group
                        this.rowsEmployeeList.get(keysRowElements[i]).hide();
                    }
                }
                if (selectMembers) {
                    //See if that person is in the group and select it or not dependeing on that:
                    if (!Object.isEmpty(groupToOpen.get(keysRowElements[i]))) {
                        //It's a member of the group
                        this.select(keysRowElements[i]);
                        global.setEmployeeSelected(keysRowElements[i], true);
                        //If it's not visible, show it:
                        if (!this.rowsEmployeeList.get(keysRowElements[i]).visible()) {
                            this.rowsEmployeeList.get(keysRowElements[i]).show();
                        }
                    } else {
                        //It's not a member of the group
                        this.unselect(keysRowElements[i]);
                        global.setEmployeeSelected(keysRowElements[i], false);
                    }
                }
            }
        }
    }
    //Update the group label with the name of the group
    if (!Object.isEmpty(groupName)) {
        this.actualGroupNameElement.update(groupName);
    }
},

/**
* Set or updates a group (it will overwrite the one existing)
* @param {Object} populationId
* @param {Object} groupId
* @param {Object} groupName
* @param {Object} groupMembers
*/
setGroup: function(populationId, groupId, groupName, groupMembers) {
    //If we don't have a container for the population, do nothing:
    var populationGroups = global.groups.get(populationId);
    if (populationGroups != null) {
        //Update the info on that group, or create it if it doesn't exist
        populationGroups.groups.set(groupId, {
            id: groupId,
            name: groupName,
            isDefault: false,
            members: groupMembers,
            loaded: true
        });
    }
},

/**
* Unsets a group
* @param {Object} populationId
* @param {Object} groupId
*/
unsetGroup: function(populationId, groupId) {
    var populationGroups = global.groups.get(populationId);
    if (populationGroups != null) {
		//If it's the default group, set the All group as default.
		if(!Object.isEmpty(populationGroups.groups.get(groupId))){
			if(populationGroups.groups.get(groupId).isDefault){
				this.allDefaultRadio.checked = true;
        		this.allDefaultRadio.defaultChecked = true;
				populationGroups.defaultGroup = null;
			}
		}
        //Remove the group
        populationGroups.groups.unset(groupId);
    }
},
/**
* Function called when the set as default radio button is clicked
* @param {Object} groupId
*/
setDefaultRadioPushed: function(groupId) {
    if (Object.isEmpty(groupId)) {
        //Call the service to unset the default group
        var xmlIn = "<EWS>"
						+ "<SERVICE>UNSET_GROUP_DEF</SERVICE>"
						+ "<PARAM>"
	                        + "<POPULATION_ID>" + this.populationId + "</POPULATION_ID>"
						+ "</PARAM>"
					+ "</EWS>";
    }
    else {
        //Call the service to set the group as default
        var xmlIn = "<EWS>"
						+ "<SERVICE>SET_GROUP_DEF</SERVICE>"
						+ "<PARAM>"
	                        + "<POPULATION_ID>" + this.populationId + "</POPULATION_ID>"
							+ "<GROUP id='" + groupId + "'></GROUP>"
						+ "</PARAM>"
					+ "</EWS>";
    }
    this.makeAJAXrequest($H({ xml: xmlIn, successMethod: this.groupSetAsDefault.bind(this, groupId) }));
},

/**
* Function called when the service to set a group as default has returned the data 
* @param {Object} data
*/
groupSetAsDefault: function(newDefaultId, data) {
    var olderDefault = global.groups.get(this.populationId).defaultGroup;
    //Unset the last default:
    if (!Object.isEmpty(olderDefault)) {
        global.groups.get(this.populationId).groups.get(olderDefault).isDefault = false;
    }
    //Set the new default
    if (!Object.isEmpty(newDefaultId)) {
        //If the new default is a normal group
        global.groups.get(this.populationId).groups.get(newDefaultId).isDefault = true;
        global.groups.get(this.populationId).defaultGroup = newDefaultId;
    } else {
        //If the new default is the All group
        global.groups.get(this.populationId).defaultGroup = "";
    }
},

close: function($super) {
    $super();
}
});

function pernrToDisplay(id) {
    return "<span class='application_main_soft_text'>" + global.idSeparatorLeft + id + global.idSeparatorRight + "</span>";
}
