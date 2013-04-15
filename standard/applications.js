/**
 *@fileoverview applications.js
 *@description here is declared the parent Application class
 */

/**
 *@constructor
 *@description this class will keep the whole information about an application instance
 *@augments origin
 */
var Application = Class.create(origin,
/**
* @lends Application
*/{
/**
* @type Element
* @description application title div Element
*/
title: null,
/**
* @type String
* @description population to be used by this application.
*/
populationName: null,

/**
* Whether it's running on popup, sub application mode or normal mode.
* its values can be "tabbed", "sub" or "popup"
* @type String
*/
currentRunningMode: null,
/**
*@param $super $super class initializer
*@param appName {String} the name of the application we want to create an instance of
*files about the application
*@description creates a new application with the proper attributes values
*/
initialize: function($super, options) {
    this.options = options;
    this.appName = options.className;
    this.firstRun = true;
    $super();
    this.populationName = global.getPopulationName(global.getTabIdByAppId(this.options.appId))
    this.running = false;
    this.targetDiv = 'app_' + this.appName;
    //        Here we create the parent <div> of the application
    this.virtualHtml = new Element('div', {
        id: this.targetDiv,
        className: 'applications_container_div'
    });
    this.virtualHtml.insert(this.title);
},
/**
*@description shows the target div of an application
*/
run: function(args) {
    var position = this.options.position;
    var mode = this.options.mode;
    if (!mode) {
        $('content').insert(this.virtualHtml);
        this.mode = "tabbed";
    } else if (mode == "sub") {
        this.mode = "sub";
        if (!this.running) {
            if (!position) {
                position = "bottom";
            }
            var insertion = {};
            insertion[position] = this.virtualHtml;
            $("content").insert(insertion);
        } else {
            this.close();
        }
    } else if (mode == "popUp" && !this.running) {
        this.popUpApplication = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    this.close();
                    this.popUpApplication.close();
                    delete this.popUpApplication;
                } .bind(this)
            }),
            htmlContent: this.virtualHtml.addClassName("applications_popUp_container_div"),
            width: 853,
            height: 700
        });
        //show the popUp
        this.mode = "popup";
        this.popUpApplication.create();
    }
    this.running = true;
},
/**
* Function that handles the employee selections and unselections that had
* happened while this application wasn't shown
*/
afterRun: function() {
	var populationName = global.getPopulationName(global.getTabIdByAppId(this.options.appId))
    var population = global.populations.get(populationName);
    population.each(function(employee) {
        if (!this.options.population.get(employee.key)) {
            var object = {};
            object[global.currentSelectionType + "Selected"] = false;
            this.options.population.set(employee.key, object);
        }
        var locallySelected = this.options.population.get(employee.key)[global.currentSelectionType + "Selected"];
        var globalSelected = employee.value[global.currentSelectionType + "Selected"];
        if (globalSelected && !locallySelected && this.onEmployeeSelected) {
            this.onEmployeeSelected({
                id: employee.key,
                name: employee.value.name,
                oType: employee.value.type,
                population: populationName
            });
        } else if (locallySelected && !globalSelected && this.onEmployeeUnselected) {
            this.onEmployeeUnselected({
                id: employee.key,
                name: employee.value.name,
                oType: employee.value.type,
                population: populationName
            });
        }

        if (locallySelected != globalSelected) {
            var object = this.options.population.get(employee.key);
            object[global.currentSelectionType + "Selected"] = globalSelected;
        }
    } .bind(this));
},
/**
*@description hides an application div --> close the application
*/
close: function() {
    if (this.virtualHtml.parentNode) {
        this.virtualHtml.remove();
    }
    this.firstRun = false;
    this.running = false;
},
/**
* Updates the application's title in case it exists, if not creates it
*/
updateTitle: function(text, css) {
    if (this.title && this.title.down('span')) {
        this.title.down('span').update(text);
        this.virtualHtml.insert({ top: this.title });
    } else {
        var className;
        if (css == '') {
            className = 'application_main_title'
        } else {
            className = css
        }
        this.title = new Element('div', {
            className: 'application_main_title_div'
        });
        var span = new Element('span', {
            className: css
        });
        span.update(text);
        this.title.insert(span);
        this.virtualHtml.insert({ top: this.title });
    }

    this.title.show();
},

/**
* @method hideTitle
* @desc Hides the application's title
*/

hideTitle: function() {
    this.title.hide();
},

/**
* Method to be overwritten in order to do something when an employee is selected
*/
onEmployeeSelected: null,
/**
* Method to be overwritten in order to do something when an employee is unselected
*/
onEmployeeUnselected: null,
/**
* Returns a list with all the selected employees for the current population
* @return Hash keys are the selected employees ids, it will contain also
* 				a JSON object with the object type, id, color and population.
*/
getSelectedEmployees: function() {
	var populationName = global.getPopulationName(global.getTabIdByAppId(this.options.appId));
    var population = global.populations.get(populationName);
    var populationSelected = $H({});

    population.each(function(employee) {
        if (employee.value[global.currentSelectionType + "Selected"]) {
            populationSelected.set(employee.key, {
                id: employee.key,
                name: employee.value.name,
                oType: employee.value.type,
                population: populationName,
                color: global.getColor(employee.key)
            });
        }
    });

    return populationSelected;
},
/**
* Returns an employee from the population (selected or not)
* @param employee {String} the employee id
* @return the employee data. In other case, <strong>null</strong> is returned
*/
getEmployee: function(employeeID) {
    var employeeData = null;
    var populationName = global.getPopulationName(global.getTabIdByAppId(this.options.appId));
    var employee = global.populations.get(populationName).get(employeeID);

    var employeeData = {
        color: global.getColor(employeeID),
        name: employee.name,
        id: employee.id
    };

    return employeeData;
},
/**
* Gives all the population members for the logged user. The first one is him/herself. If no
* population it only gets him/herself.
* @returns An array of JSON objects with the data for each employee.
*/
getPopulation: function() {
	var populationName = global.getPopulationName(global.getTabIdByAppId(this.options.appId));
    var population = global.populations.get(populationName);
    var populationAdapted = $A();

    //Adapt the population data to the one expected by the developer.
    population.each(function(employee) {
        populationAdapted.push({
            objectType: employee.value.type,
            objectId: employee.key,
            name: employee.value.name,
            color: global.getColor(employee.key)
        });
    });

    return populationAdapted;
},
/**
* Gets a String telling which is the selection type used by this application
* @return <ul><li>none if there's no selection</li><li>single if it's single selection</li>
* 			<li>multi if it's multiple selection</li></ul>
*/
getSelectionMode: function() {
    var selectionMode = 0;
    //gets the selection mode code from the menus data in global.
    //this data comes with the my selections menu data.
    if (global.tabid_leftmenus.get(this.appName) &&
			global.tabid_leftmenus.get(this.appName).get("SELECT")) {

        selectionMode = global.tabid_leftmenus.get(this.appName).get("SELECT").menuType;
    }
    var selectionType = "none";
    //get the selection type. If no selection mode found for this app put
    //none as the selection type (e.g. Inbox)
    selectionMode = parseInt(selectionMode, 10);
    switch (selectionMode) {
        case 2:
            selectionType = "multi";
            break;
        case 1:
            selectionType = "single";
            break;
        default:
            selectionType = "none";
            break;
    }

    return selectionType;
},

/**
* Copy the selected people in the left menu to an multiselect.
* @param multiselect {Object} the multiselect Object to add the selection form left menu
*/
leftMenuToMultiSelect: function(multiSelect) {
    multiSelect.defaultBoxes();
    var allEmployees = objectToArray(multiSelect.JSON.autocompleter.object);
    var selected = this.getSelectedEmployees().keys();
    var employeesToAdd = $A();
    var conti = true;
    for (var i = 0; i < allEmployees.length; i++) {
        conti = true;
        for (var j = 0; j < selected.length && conti; j++) {
            if (selected[j] == allEmployees[i].data) {
                employeesToAdd.push(i);
                conti = false;
            }
        }
    }
    multiSelect.addBoxes(employeesToAdd);
},

changeScreen: function(app) {
    if (global.WEB_SCREENS) {
        var data = global.WEB_SCREENS.get(app);
        if (data) {
            document.fire("EWS:changeScreen", data);
        }
    }
}
});