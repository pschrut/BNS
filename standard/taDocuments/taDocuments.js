var taDocuments = Class.create(Application, {


    initialize: function($super) {
        $super('taDocuments');
    },

    run: function($super) {
    $super();
	this.updateTitle('Talent Management Documents');
    },


    close: function($super) {
        $super();
    }

});