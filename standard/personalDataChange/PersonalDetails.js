/**
 * @fileOverview personalDetails.js
 * @description Contains the classes for the application PersonalDetails
 *  it contains a class which inherits from PDCChange and init the widget listin
 *  and content creatiion.
 */

/**
 * @constructor
 * @description This class contains the funcionalities for creating the PersonalDetails
 *  application
 */
var PersonalDetails = Class.create(PDChange,
/**
 * @lends PersonalDetails
 */
{
    /**
     * @description Initializes the application
     * @param $super The parent initialize method reference
     */
    initialize: function($super) {
        //Calling the parent method
        $super("PersonalDetails");
    },
    /**
     * @description This method is called when the application is needed to be shown on the screenm
     * @param $super Parent method reference
     */
    run: function($super) {
        //Calling the parent method
        $super("ED_PD");
    },
    /**
     * @description This method is called when the application needs to be closed
     */
    close: function($super) {
        //Calling the parent method
        $super();
    }
});