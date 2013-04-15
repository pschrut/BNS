/** 
* @fileOverview displayOrgUnit.js 
* @description File containing class displayOrgUnit. 
* Application for Maintain and Display in OM.
*/

/**
*@constructor
*@description Class displayOrgUnit.
*@augments getContentDisplayer 
*/
var DisplayOrgUnit = Class.create(getContentDisplayer, {
    /**
    * Variable to show or not cancel button
    * @type Boolean
    */
    showCancelButton: false,
    /**
    *Constructor of the class displayOrgUnit
    */
    initialize: function($super, args) {
        $super(args);
    },
    /**
    *@description Starts displayOrgUnit
    */
    run: function($super, args) {
        $super(args);
    },
    /**
    *@description Stops displayOrgUnit
    */
    close: function($super) {
        $super();

    }
});