var settings = Class.create(Application, {


    initialize: function($super) {
        $super('settings');
    },

    run: function($super) {
    $super();
    this.updateTitle('Settings');
    },


    close: function($super) {
        $super();
    }

});