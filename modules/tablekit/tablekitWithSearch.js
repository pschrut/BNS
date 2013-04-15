/**
 *@fileOverview tableKitWithSearch.js
 *@description In this file it has been implement the tablekit with web search in it
 */
 
/**
 *@constructor
 *@description class that describes the tablekit with search
 */
var tableKitWithSearch = Class.create(
/**
* @lends tableKitWithSearch
*/
{
timeOutExpired: true,
initialize: function(table, options) {
    //search label
    this.searchLabel = Object.isEmpty(options.searchLabel) ? defaultLabels.get("search") : options.searchLabel;
    //noResults label
    this.noresultsLabel = Object.isEmpty(options.noResultsLabel) ? defaultLabels.get("noResults") : options.noResultsLabel;
    //class variables
    this.tableId = table.identify();
    this.tableObject = table;
    this.originalTable = this.tableObject.cloneNode(true).writeAttribute('id', Math.random().toString().gsub('\\.', '_'));
    //build the table
    this.buildTable(options);
    this.drawSearchField();


},
buildTable: function(options) {
    //instantiate tablekit
    if (this.tableObject.down().next().rows.length == 0) {
        var cellHtml = "<tr><td>" + this.noresultsLabel + "</td></tr>";
        $(this.tableObject.down().next()).insert(cellHtml);
        var columns;
        if (Prototype.Browser.IE)
            columns = this.tableObject.cells.length - 1;
        else if (Prototype.Browser.Gecko)
            columns = this.tableObject.rows[0].cells.length;
        this.tableObject.down().next().rows[0].cells[0].colSpan = columns;
        $(this.tableObject.down().next().rows[0].cells[0]).setStyle({ 'textAlign': 'center' });
    }
    TableKit.Sortable.init(this.tableObject, options);
    TableKit.options.autoLoad = false;
},
reloadTable: function(table) {
    //save table
    this.tableId = table.identify();
    this.tableObject = table;
    this.originalTable = this.tableObject.cloneNode(true).writeAttribute('id', Math.random().toString().gsub('\\.', '_'));
    //if no rowa
    if (this.tableObject.down().next().rows.length == 0) {
        var cellHtml = "<tr><td>" + this.noresultsLabel + "</td></tr>";
        $(this.tableObject.down().next()).insert(cellHtml);
        var columns;
        if (Prototype.Browser.IE)
            columns = this.tableObject.cells.length - 1;
        else if (Prototype.Browser.Gecko)
            columns = this.tableObject.rows[0].cells.length;
        this.tableObject.down().next().rows[0].cells[0].colSpan = columns;
        $(this.tableObject.down().next().rows[0].cells[0]).setStyle({ 'textAlign': 'center' });
    }
    //reload tablekit
    TableKit.reloadTable(this.tableObject);
    this.drawSearchField();
},
/**
*@description Method to draw the Search Field Part
*/
drawSearchField: function() {
    //create element
    var complexSearch = new Element('input', {
        'id': this.tableId + '_searchBox',
        'type': 'text',
        'class': 'application_autocompleter_box menus_myTeamField',
        'value': this.searchLabel
    });
    var complexSearchDiv = new Element('div', {
        'id': this.tableId + '_searchBoxDiv',
        'class': 'genCat_level2'
    });
    complexSearchDiv.insert(complexSearch);
    Element.insert(this.tableObject, { before: complexSearchDiv });
    this.tableObject.addClassName('FWK_EmptyDiv');
    //events
    complexSearch.observe('keyup', this.fieldKeyUp.bindAsEventListener(this));
    complexSearch.observe('blur', function() {
        if (complexSearch.value == '') complexSearch.value = this.searchLabel;
    } .bindAsEventListener(this));
    complexSearch.observe('focus', this.fieldFocus.bindAsEventListener(this));

},
/**
*@param {Event} event Event called when the user start editing a complex search 
*@description This function is triggered when doing focus on the text field, and eliminates the help text
*/
fieldFocus: function(event) {
    //Event.element(event).value = '';
    if (Event.element(event).value == this.searchLabel) {
        event.element(event).select();
        return;
    }
    this.fieldKeyUp(event);
},
/**
*@description Method to get the info to show in the table depending of the Search filter
*/
startNewDataTimeout: function(instance) {
    instance.timeOutExpired = true;
},
/**
*@param {Event} event The event generated when editing the complex search field
*@description makes appear in the pending request table only the tasks that contain the typed text on the complex text search
*input (emphasizing this text) 
*/
fieldKeyUp: function(event) {
    this.textSearch = Event.element(event).value.toLowerCase();
    if (this.timeOutExpired == true) {
        this.applyFilters();
        this.timeOutExpired = false;
        this.startNewDataTimeout.delay(0.5 / 1000, this);
    } else {
        this.applyFilters.bind(this).defer();
    }

},
/**
*@param {String} searchText Filter to apply on the description text
*@description Limit the number of displayed entries in the table
*/
applyFilters: function() {
    //copy original table so we can delete rows in the new table
    this.filteredTable = this.originalTable.cloneNode(true).writeAttribute('id', Math.random().toString().gsub('\\.', '_'));
    //number of rows, without counting the th
    var tbodyId = this.originalTable.down().next().identify();
    var rows = this.originalTable.down().next().rows;
    var rowsLength = rows.length;
    var dataColumn = "";
    var rowsToBeDeleted = new Array();
    for (var i = 0; i < rowsLength; i++) {
        //put text in an array
        var columns = rows[i].cells;
        dataColumn = "";
        for (var j = 0; j < columns.length; j++) {
            //to extract the text, we have to differenciate between FF and IE
            if (Prototype.Browser.IE)
                dataColumn += rows[i].cells[j].innerText + " ";
            else if (Prototype.Browser.Gecko)
                dataColumn += rows[i].cells[j].textContent + " ";
        }
        dataColumn = dataColumn.toLowerCase();
        if (!dataColumn.include(this.textSearch)) {
            //keep indiex of row to delete
            rowsToBeDeleted.push(i);
        }
    }
    //delete rows

    for (var h = rowsLength - 1; h > -1; h--) {
        if (rowsToBeDeleted.indexOf(h) != -1)
            this.filteredTable.down().next().deleteRow(h);
    }
    //give new html to the tablekit
    if (this.filteredTable.down().next().rows.length == 0) {
        var cellHtml = "<tr><td>" + this.noresultsLabel + "</td></tr>";
        $(this.filteredTable.down().next()).insert(cellHtml);
        var columns;
        if (Prototype.Browser.IE)
            columns = this.filteredTable.cells.length - 1;
        else if (Prototype.Browser.Gecko)
            columns = this.filteredTable.rows[0].cells.length;
        this.filteredTable.down().next().rows[0].cells[0].colSpan = columns;
        $(this.filteredTable.down().next().rows[0].cells[0]).setStyle({ 'textAlign': 'center' });
    }
    this.tableObject.down().next().update(this.filteredTable.down().next().innerHTML);
    TableKit.reloadTable(this.tableObject);
}
});
