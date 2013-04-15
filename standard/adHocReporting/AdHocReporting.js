var AdHocReporting = Class.create(Application, {

    initialize: function($super, args) {
        $super(args);
    },

    run: function($super, args) {
        $super(args);
        this.callToFillOver();
    },

    createHtml: function(json) {
        var div = new Element('div', { 'id': 'containerAdHocReporting', 'class': 'containerAdHocReporting' });
        var fullScreen = new Element('span', { 'class': 'applicationmyData_viewMore application_action_link' }).update(global.getLabel('Full Screen'));
        fullScreen.setStyle({
            float: 'right'
        });
        div.insert(fullScreen);
        var myIframe = new Element('iframe', { 'src': json.EWS.o_link, 'width': '100%', 'height': '600' });
        div.insert(myIframe);
        //adding an observer onmouseclick to fullScreen Link
        fullScreen.observe('click', this.fullScreenDiv.bind(this, json));
        this.virtualHtml.update("");
        this.virtualHtml.insert(div);
    },

    callToFillOver: function(wizardId) {

        var xmlOverview = "<EWS>"
                              + "<SERVICE>ADH_GET_LINK</SERVICE>"
                              + "<DEL/>"
                              + "<PARAM>"
                                + "<I_APPID>" + this.options.appId + "</I_APPID>"
                              + "</PARAM>"
                        + "</EWS>"

        this.makeAJAXrequest($H({
            xml: xmlOverview,
            successMethod: this.createHtml.bind(this)
        }));      

    },

    fullScreenDiv: function(json) {
        //We create a fullScreen div to show the iframe
        var div = new Element('div', { 'id': 'containerAdHocReporting', 'class': 'containerAdHocReporting', 'class': 'adHocReporting_FullScreenDiv' });
        var normalScreen = new Element('span', { 'class': 'applicationmyData_viewMore application_action_link' }).update(global.getLabel('Exit'));
        normalScreen.setStyle({
            float: 'right',
            margin: '0 10 0 0'
        });
        div.insert(normalScreen);
        var myIframe = new Element('iframe', { 'src': json.EWS.o_link });
        myIframe.setStyle({
            width: '100%',
            height: '100%'
        });
        div.insert(myIframe);
        //adding an observer onmouseclick to fullScreen Link
        normalScreen.observe('click', this.normalScreenDiv.bind(this, div));
       
        $(document.body).insert(div);
    },

    normalScreenDiv: function(element) {
        element.hide();
        element.remove();
    },

    close: function($super) {
        $super();
    }

});