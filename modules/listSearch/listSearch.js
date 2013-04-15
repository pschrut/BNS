/**
 * @fileoverview listSearch.js
 * @description Implements all the funcionalities for creating a searchable list
 */

/**
 * @constructor
 * @description Contains all the functionalities for creating a Search for a given
 * search expresion
 */
var ListSearch = Class.create(
/**
 * @lends ListSearch
*/{
    /**
     * @description COntains the options object
*/
options: null,
    /**
     * @description Contains the list where perform the search
*/
dataList: null,
    /**
     * @description Initializes the class
     * @param dataList The data list
     * @param options The ListSearch options
*/
initialize: function(dataList, options) {
    this.dataList = dataList;
    //Use default options    
    this.options = {
        dataFilteredEvent: 'EWS:listSearchFiltered',
        maxNumberOfResult: -1,
        caseSensitive: false,
        returnHash: false,
        searchField: undefined
    };
    //Set the non-default options
    if (!Object.isEmpty(options.dataFilteredEvent)) {
        this.options.dataFilteredEvent = options.dataFilteredEvent;
    }
    if (!Object.isEmpty(options.maxNumberOfResult)) {
        this.options.maxNumberOfResult = options.maxNumberOfResult;
    }
    if (!Object.isEmpty(options.caseSensitive)) {
        this.options.caseSensitive = options.caseSensitive;
    }
    if (!Object.isEmpty(options.returnHash)) {
        this.options.returnHash = options.returnHash;
    }
    if (!Object.isEmpty(options.searchField)) {
        this.options.searchField = options.searchField;
    }

    if (!Object.isEmpty(this.options.searchField)) {
        //Bind the events to the search field:
        //On key up: update the table with the text in this field
        this.options.searchField.observe('keyup', this.fieldKeyUp.bindAsEventListener(this));

        //On blur: if the box is empty, put the "Search" label again
        this.options.searchField.observe('blur', function() {
        if (this.options.searchField.value == '')
            this.options.searchField.value = global.getLabel('search');
        } .bindAsEventListener(this));
        //On focus: if the box has the "Search" label, empty it
        this.options.searchField.observe('focus', function() {
            if (this.options.searchField.value == global.getLabel('search'))
                this.options.searchField.value = '';
        } .bindAsEventListener(this));
    }

},

    /**
* Function called when a key is pressed in the search field
*/
fieldKeyUp: function() {
    //Perform search, it fires EWS:mySelectionsSearch event
    this.performSearch(this.options.searchField.value);
},

/**
     * @description This function will be called to perform the search
     * @param data The string to be searched
*/
    performSearch: function(data) {
	//Trim the string to delete unnnecesary whitespaces
	data = data.replace(/^\s+|\s+$/g,'');
    if (!this.options.caseSensitive) {
            data = data.toLowerCase();
	}		
    if (this.options.returnHash) {
        var returnHash = $H();
    } else {
        var returnArray = $A();
    }

    for (var i = 0; i < this.dataList.size(); i++) {
        var text = this.dataList[i].text;
		if(Object.isEmpty(text)){
		    text = "";
		}
		if(!this.options.caseSensitive){
		    text = text.toLowerCase();
        }
		//Separate words from the search string
		
		var words = data.split(' ');
		//See if all words are matched in each item of the list
		var allMatch = true;
		for(var j=0; j<words.size(); j++){
			if(!text.include(words[j])){
				allMatch = false;
				break;
			}			
		}
		//If all the words were matched, we add it to the results
        if (allMatch)
            if (this.options.maxNumberOfResult - 1 >= i || this.options.maxNumberOfResult == -1) {
            if (this.options.returnHash) {
                //Debug
                if(Object.isEmpty(this.dataList[i].text)){
                    returnHash.set(this.dataList[i].id, "Empty");
                }
                else{
                    returnHash.set(this.dataList[i].id, this.dataList[i].text);
                }
            } else {
                returnArray.push(this.dataList[i]);
            }
        }
    }
    if (this.options.returnHash) {
		this.results = returnHash;
        document.fire(this.options.dataFilteredEvent, { searchText: data, searchResult: returnHash, originalElements: this.dataList});
    } else {
		this.results = returnArray;
        document.fire(this.options.dataFilteredEvent, { searchText: data, searchResult: returnArray, originalElements: this.dataList });
    }
},

/**
 * Returns the results of the last search
 */
getResults: function(){
	return this.results;
}
});


