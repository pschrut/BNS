var reDocuments = Class.create(Application, {


    initialize: function($super) {
        $super('reDocuments');
    },

    run: function($super) {
    $super();
	this.updateTitle('Recruitment Documents');
    },


    close: function($super) {
        $super();
    }

});