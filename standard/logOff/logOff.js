
var LOGOFF = Class.create(Application, {
    //It checks if the user is working each 60 seconds
    secs: 60,
    //Initial date of the user log on
    initialDate: new Date(),
    /**
    *@description Fires when the user do something in the application
    *@@param args The app
    */
    initialize: function($super, args) {
        $super(args);
        Ajax.Responders.register({
            onCreate: function() {
                //update the initial date because the user has done something in the application
                this.initialDate = new Date();
            } .bind(this)
        });
        this.iniTimeOut();
    },

    /**
    * @param args The app
    * @param $super The superclass run method
    * @description Executes the super class run method    
    */
    run: function($super, args) {
        $super(args);
        this.createHtml();
    },

    /**
    *@description Creates a periodicalExecuter. Checks each minute if the user is working in the application
    */
    iniTimeOut: function() {
        var timer = new PeriodicalExecuter(
                        function timeExpired(timer) {
                            var actualDate = new Date();
                            var diffDates = ((actualDate.getHours() * 3600) + (actualDate.getMinutes() * 60) + (actualDate.getSeconds())) - ((this.initialDate.getHours() * 3600) + (this.initialDate.getMinutes() * 60) + this.initialDate.getSeconds());
                            if (diffDates > global.logOffTime) {
                                timer.stop();
                                this.timeExpired();
                            }
                        } .bind(this),
                        this.secs
                    );
    },

    /**
    *@description Shows a message and 2buttons to confirm the log off
    */
    createHtml: function() {
        var div = new Element('div', { 'id': 'containerButtonsId', 'class': 'containerButtonsCss' });
        this.virtualHtml.update(div);
        var messageLogOff = new Element('div', { 'id': 'messageLogOffId', 'class': 'messageLog' });
        messageLogOff.insert(global.getLabel('confirmLogoff'));
        div.insert(messageLogOff);
        var buttonsJson = {
            mainClass: 'logOffButtons',
            elements: []
        };
        var button_Yes = {
            idButton: 'btn_Yes',
            label: global.getLabel('yes'),
            className: 'buttonMarginRightCss',
            handlerContext: null,
            handler: this.buttonClickedYes.bind(this),
            type: 'button',
            standardButton: true
        }
        buttonsJson.elements.push(button_Yes);
        var button_No = {
            idButton: 'btn_No',
            label: global.getLabel('no'),
            className: 'logOffButtons',
            handler: this.closePopUp2.bind(this),
            handlerContext: null,
            type: 'button',
            standardButton: true
        }
        buttonsJson.elements.push(button_No);
        var buttonOpenWiz = new megaButtonDisplayer(buttonsJson);
        div.insert(buttonOpenWiz.getButtons());
    },


    /**
    * Function called when the timer has expired
    */
    timeExpired: function() {
        var logOffXml = "<EWS><SERVICE>CLEAR_SESSION</SERVICE><PARAM><SSO>CLEAR</SSO><AREA/></PARAM></EWS>";
        this.makeAJAXrequest($H({
            xml: logOffXml,
            successMethod: this.showLoggedOffScreen.bind(this)
        }));
    },

    /**
    * After being logged off, show a screen with information about that. Then 
    */
    showLoggedOffScreen: function() {
        if ($('idDivInfoPopUpContainer')) {
            $('idDivInfoPopUpContainer').remove();
        }
        var contentHTML = new Element("div").insert("You have been logged off due to inactivity");
        var buttonsJson = {
            mainClass: 'logOffButtons',
            elements: []
        };
        var buttonOk = {
            idButton: 'logOff_okButton',
            label: global.getLabel('ok'),
            className: 'buttonMarginRightCss',
            handlerContext: null,
            handler: this.redirectToHome.bind(this),
            type: 'button',
            standardButton: true
        }
        buttonsJson.elements.push(buttonOk);
        var buttonsDisplayer = new megaButtonDisplayer(buttonsJson);
        contentHTML.insert(buttonsDisplayer.getButtons());

        var popup = new infoPopUp({
            closeButton: $H(
                { 'callBack': function() {
                    popup.close();
                    delete popup;
                }
                }),
            htmlContent: contentHTML,
            indicatorIcon: 'exclamation',
            width: 600,
            showCloseButton: false
        });
        popup.create();
    },

    /**
    * Redirects to home page
    */
    redirectToHome: function() {
        var url = __logOnUrl;
        if (!Object.isEmpty(global.redirectURL)) {
            url = global.redirectURL
        }
        window.location = url;
    },

    /**
    *@description Log off and return to the homepage.
    */
    buttonClickedYes: function() {
        /*
        var logOffXml = "<EWS><SERVICE>CLEAR_SESSION</SERVICE><PARAM><SSO>CLEAR</SSO><AREA/></PARAM></EWS>";
        this.makeAJAXrequest($H({
        xml: logOffXml,
        successMethod: this.closePopUp.bind(this)
        }));
        */
        this.closePopUp();
    },

    closePopUp2: function(json) {
        this.close();
        if (!Object.isEmpty(this.popUpApplication)) {
            this.popUpApplication.close();
            delete this.popUpApplication;
        }
    },

    /**
    *@description Close the current page
    */
    closePopUp: function(json) {
        this.close();
        if (!Object.isEmpty(this.popUpApplication)) {
            this.popUpApplication.close();
            delete this.popUpApplication;
        }
        //if (!Object.isEmpty(json)) {
        var messageType = 'S'; //json.EWS.messages.item['@msgty'];
        if (messageType == 'S')
            this.redirectToHome();

        //Added by KL: ticket: 1002594
        if (logOutAvo) { //already clear, not need to refresh
            logOutAvo.goingOut = true;
            logOutAvo.notResetFlag = true;
        }
        //Added by Kevin Feb 21st 2011
        //Modified by Mike Viray Feb 21st 2011
        //BNS Logoff Issue
        //    window.location = '../yglui_bsp_ews/logoff.html?msg=' + encodeURIComponent(global.getLabel('ZZ_LOGOFF'));
        // window.location = window.location.protocol + '//' + window.location.host + '/SSO_Redirect/logoff.jsp';
        //}
    },

    /**
    *@description Closes the application
    *@param $super The superclass: logOff
    */
    close: function($super) {
        $super();
    }
});