var activitiesCalendar = Class.create(Application, {


    initialize: function($super) {        
        $super('activitiesCalendar');
    },

    run: function($super) {
    $super();
	this.updateTitle('Activities Calendar');
    },


    close: function($super) {
        $super();
    }

});