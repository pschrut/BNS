/**
 * @class
 * @description Display the tasks of a ticket
 * @author jonathanj & nicolasl
 * @version 2.0
 */
var scm_ticketTasks = Class.create(Application, /** @lends scm_teamPool.prototype */{   
    /**
	 * 
	 * @param {Object} args
	 * @since 2.0
	 */
	initialize: function ($super, args){
        $super(args);
    },
	
	/**
	 * 
	 * @param {Object} args
	 * @since 2.0
	 */
	run: function($super, args) {
		$super(args);
    },
    
	/**
	 * 
	 * @since 2.0
	 */
    close: function($super) {
        $super(false);
	}
});