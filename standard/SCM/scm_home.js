/**
 * @class
 * @description Class in charge of displaying the home page of the SCM application
 * @author jonathanj & nicolasl
 * @augments Application
 * @version 1.0
 * 
 */
var scm_home = Class.create(Application,/** @lends scm_home.prototype */ {
    /**
     * Constructor for the class
     * @since 1.0
     */
	initialize: function ($super){
        $super("scm_home");
    },
	/**
	 * The function called when the application is displayed
	 * @param {JSON Object} args JSon object containing the parameters for the application
	 * @since 1.0
	 */
    run: function ($super, args){
        $super(args);
    },
	/**
	 * Function called when the application is closed
	 * @since 1.0
	 */
    close: function ($super){
        $super();
    }
});