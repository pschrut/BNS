/**
 * @class
 * @description Class displaying the version of the displayed application.
 * @author JONATHANJ
 * @version 1.0
 */
var versionDisplayer = Class.create(/**@lends versionDisplayer*/{
	/**
	 * Version to be displayed
	 * @type String
	 * @since 1.0
	 */
	version: '',
	/**
	 * Label displayed before the version number
	 * @type String
	 * @default 'App. Version'
	 * @since 1.0
	 */
	label:'App. Version',
	/**
	 * Template used to display the version.
	 * @type String
	 * @since 1.0
	 */
	template:'<div id="appVers" class="fwk_appVers"><span id="appVersText">#{label}</span><span id="appVersNbr">&nbsp;#{version}</span></div>',
	
	moreInfo: '',
	
	/**
	 * Class constructor for the version displayer.
	 * @param {JSon} args
	 * @since 1.0
	 */
	initialize:function(args){
		this.version = args.version;
		if(args.versionLabel) this.label = args.versionLabel;
		if(args.moreInfo) this.moreInfo = args.moreInfo;
		this.display();
	},
	/**
	 * 
	 */
	display:function(){
		
		this.remove();
		$('fwk_7').insert(new Template(this.template).evaluate({label:this.label, version:this.version}));
		$('fwk_7').down('[id="appVersText"]').observe('click', function(){
			//if (!Object.isEmpty(this.moreInfo)) {
//				if (!Object.isUndefined($('fwk_7').down('[id="appMoreVers"]')) && !Object.isEmpty($('fwk_7').down('[id="appMoreVers"]'))) 
//					$('fwk_7').down('[id="appMoreVers"]').remove();
//				else {
//					$('fwk_7').down('[id="appVers"]').insert(new Element('div', {
//						'id': 'appMoreVers',
//						'style': 'border: 1px solid rgb(255, 238, 170); position: relative; height: 60px; background-color: white; bottom: 75px; z-index: 2500; width: 100px;'
//					}));
//					$('fwk_7').down('[id="appMoreVers"]').insert(this.moreInfo);
//				}
			//}
			new scm_agentPreferences();
		}.bind(this));
	},
	/**
	 * 
	 */
	remove:function(){
		if(!Object.isUndefined($('fwk_7').down('[id="appVers"]')))
			$('fwk_7').down('[id="appVers"]').remove();
		if(!Object.isUndefined($('fwk_7').down('[id="appMoreVers"]')))
			$('fwk_7').down('[id="appMoreVers"]').remove();
	},
	addInfo:function(info){
		this.moreInfo += info;
	}
});