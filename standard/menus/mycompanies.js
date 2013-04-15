    /**
     * @constructor MyCompanies
     * @description A drop down menu implementing a company selection mechanism
     * @augments Menu
     */
var MyCompanies = Class.create(Menu,
/**
* @lends MyCompanies
*/
    {
    /**
    * @type {Object}
    * @description A JSON object with the needed structure to initialize the
    * 				companies autocompleter.
    */
    companies: null,

    initialize: function($super, id, options) {
        if (global.companies) {
            $super(id, options);
        }
        //search label
        this.searchLabel = Object.isEmpty(options.searchLabel) ? defaultLabels.get("search") : options.searchLabel;
        //noResults label
        this.noresultsLabel = Object.isEmpty(options.noResultsLabel) ? defaultLabels.get("noResults") : options.noResultsLabel;
    },
    /**
    * Create the autocompleter data structure in cases there's companies for the
    * current user.
    */
    setCompanies: function() {
        this.companies = new Element('div');
        global.companies.each(function(company) {
            var containerRow = new Element('div', { 'class': 'MyComp_row' });
            var auxRadio = new Element('input', { 'type': 'radio', 'value': company.key, 'name': 'companiesGroup', 'class': 'MyComp_RadioB', 'id': company.key });
            auxRadio.observe('click', this.onCompanySelected.bind(this, company.value));
            var name = new Element('div', { 'class': 'MyComp_CompanyName' }).insert(company.value.name);
            containerRow.insert(auxRadio);
            containerRow.insert(name);
            this.companies.insert(containerRow);
        } .bind(this));
        this.drawSearchField();
    },

    /**
    * Will show the menu in the corresponding place.
    * @param {Object} $super parent class method, is passed automatically.
    * @param {Object} element where to show the menu. is passed automatically by the MenusHandlers class
    */
    show: function($super, element) {
        this.setCompanies();
        $super(element);
        //if there aren't different companies, the companies menu is not being shown.
        if (this.companies) {
            this.changeTitle(global.getLabel("myCompanies"));
            this.changeContent(this.companies);
            this.initializing = true;
            var gcc = getURLParam("gcc");
            var lcc = getURLParam("lcc");
            if (!Object.isEmpty(gcc) && !Object.isEmpty(lcc)) {
                this.companies.down('[id=' + gcc + lcc + ']').defaultChecked = true;
                this.companies.down('[id=' + gcc + lcc + ']').checked = true;
            } else {
                this.companies.down('[id=' + global.companies.keys().first() + ']').defaultChecked = true;
                this.companies.down('[id=' + global.companies.keys().first() + ']').checked = true;
            }
            //this.changeContent(this.companies);

        } else {
            element.removeClassName("menus_item_container");
        }
    },
    /**
    * This method refreshes everything with a new GCC-LCC pair
    * @param {Object} event Event object, automatically passed when when the event is fired
    */
    onCompanySelected: function(company) {
        var gcc = company.gcc;
        var lcc = company.lcc;
        if (Object.isEmpty(getURLParam('customer'))) {
            var urlQuery = "?gcc=" + gcc + "&lcc=" + lcc;
        }
        else {
            var urlQuery = "?customer" + getURLParam('customer') + "&gcc=" + gcc + "&lcc=" + lcc;
        }
        window.location.search = urlQuery;
        $("loading_app_semitrans").show();

    },

    /**
    *@description Method to draw the Search Field Part
    */
    drawSearchField: function() {
        //create element
        var complexSearch = new Element('input', {
            'id': 'searchBox',
            'type': 'text',
            'class': 'menus_myTeamField',
            'value': this.searchLabel
        });
        var complexSearchDiv = new Element('div', {
            'id': 'searchBoxDiv',
            'class': 'genCat_level2'
        });
        complexSearchDiv.insert(complexSearch);
        this.companies.insert({ top: complexSearchDiv });
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
        Event.element(event).value = '';
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
        var rows = this.companies.select('.MyComp_row');
        for (var i = 0; i < rows.length; i++) {
            var textElement = rows[i].down('.MyComp_CompanyName');
            var text = textElement.innerHTML.toLowerCase();
            if (text.include(this.textSearch))
                rows[i].show();
            else
                rows[i].hide();
        }
    }
});