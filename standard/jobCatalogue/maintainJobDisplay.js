/** 
* @fileOverview maintainJobDisplay.js 
* @description File containing class maintainJobDisplay. 
* Application for Job Catalogue - View Job.
*/

/**
*@constructor
*@description Class maintainJobDisplay.
*@augments Application 
*/
var MaintainJobDisplay = Class.create(getContentDisplayer, {
    /**
    * Variable to show or not cancel button
    * @type Boolean
    */
    showCancelButton: false,
    /**
    *Constructor of the class maintainJobFamDisplay
    */
    initialize: function($super, args) {
        $super(args);
    },
    /**
    *@description Starts maintainJobFamDisplay
    */
    run: function($super, args) {
        $super(args);
    },
    /**
    *@description Stops maintainJobFamDisplay
    */
    close: function($super) {
        $super();
    }
});