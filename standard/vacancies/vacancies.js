var vacancies = Class.create(Application, {


    initialize: function($super) {
        $super('vacancies');
    },

    run: function($super) {
    $super();
    this.updateTitle('Vacancies');
    },


    close: function($super) {
        $super();
    }

});