/** 
* @fileOverview displayPerson.js 
* @description File containing class displayPerson. 
* Application for Maintain and Display in OM.
*/

/**
*@constructor
*@description Class displayPerson.
*@augments Application 
*/
var DisplayPerson = Class.create(getContentDisplayer, {
    /**
    * Variable to show or not cancel button
    * @type Boolean
    */
    showCancelButton: false,
    /**
    *Constructor of the class displayPerson
    */
    initialize: function($super, args) {
        $super(args);
    },
    /**
    *@description Starts displayPerson
    */
    run: function($super, args) {
        $super(args);
    },
    /**
    *@description Stops displayPerson
    */
    close: function($super) {
        $super();

    }
});