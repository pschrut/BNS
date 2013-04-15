var Comp_Reporting = Class.create(Reporting, {
    initialize: function($super, options) {
        $super(options);
    },
    run: function($super, args) {
        $super('TM_CMP');
    }
});