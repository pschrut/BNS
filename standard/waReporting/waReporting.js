var waReporting = Class.create(Application, {


    initialize: function($super) {
        $super('waReporting');
    },

    run: function($super) {
    $super();
	this.updateTitle('Workforce Administration Reporting');
    },


    close: function($super) {
        $super();
    }

});