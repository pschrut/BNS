var candidates = Class.create(Application, {
	initialize: function($super) {
        $super('candidates');
    },
	run: function($super) {
    $super();
    this.updateTitle('Candidates');
    },
	close: function($super) {
        $super();
    }
});