/**
 * @class
 * @description Overwrite the DatePicker class to add automatically the translation of monthes.
 * @author jonathanj & nicolasl
 * @version 2.0
 */
var SCM_DatePicker = Class.create(DatePicker, {
	/**
	 * Overwrite the standard creator to add the translations in the options
	 * @param {Object} containerDiv
	 * @param {Object} options
	 */
	initialize: function($super, containerDiv, options) {		
		//Set the labels
		options.labels				= $H({
            jan		: global.getLabel('janMonth'),
            feb		: global.getLabel('febMonth'),
            mar		: global.getLabel('marMonth'),
            apr		: global.getLabel('aprMonth'),
            may		: global.getLabel('mayMonth'),
            jun		: global.getLabel('junMonth'),
            jul		: global.getLabel('julMonth'),
            aug		: global.getLabel('augMonth'),
            sep		: global.getLabel('sepMonth'),
            oct		: global.getLabel('octMonth'),
            nov		: global.getLabel('novMonth'),
            dec		: global.getLabel('decMonth'),
            sun		: global.getLabel('sunDay'),
            mon		: global.getLabel('monDay'),
            tue		: global.getLabel('tueDay'),
            wed		: global.getLabel('wedDay'),
            thu		: global.getLabel('thuDay'),
            fri		: global.getLabel('friDay'),
            sat		: global.getLabel('satDay'),
            title	: global.getLabel('datePickerTitle'),
            next	: global.getLabel('next'),
            previous: global.getLabel('previous')            
        });

		$super(containerDiv, options);
	}
});