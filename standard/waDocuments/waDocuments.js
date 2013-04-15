var waDocuments = Class.create(Application, {


    initialize: function($super) {
        $super('waDocuments');
    },

    run: function($super) {
    $super();
	this.updateTitle('Workforce Administration Documents');
    },


    close: function($super) {
        $super();
    }

});