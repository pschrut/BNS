/**
*@fileoverview help.js
*@description Help content class
*/

/**
*@constructor
*@description this class implements all help content features.
*@augments Application
*/


var Help = Class.create(Application, {

    initialize: function($super, args) {

        $super(args);

        this.onOpenApplicationHandlerBinding = this.onOpenApplicationHandler.bindAsEventListener(this);
        this.moreButtonHandlerBinding = this.moreButtonHandler.bindAsEventListener(this);


        document.observe("EWS:changeScreen", this.onOpenApplicationHandlerBinding);

    },
    run: function($super, args) {

        $super(args);

        /*if(this.firstRun){
        //read from global.currentApplication
        this.onOpenApplicationHandler(global.currentApplication);
        }*/

        this.virtualHtml.update();

        //if (this.appId && this.tabId && this.view) {
        this.getHelp();
        //}


    },
    close: function($super) {
        $super();
    },

    onOpenApplicationHandler: function(event) {

        /*this.appId = global.currentApplication.appId;
        this.tabId = global.currentApplication.tabId;
        this.view = global.currentApplication.view;
        */

        /*var args = getArgs(event);

        this.appId = args.appId;
        this.tabId = args.tabId;
        this.view = args.view;*/

    },

    getHelp: function() {

        this.makeAJAXrequest($H({ xml:
        '<EWS><SERVICE>ECM_GET_help</SERVICE><OBJECT TYPE=""/><DEL/><GCC/><LCC/><PARAM><app_id>' + global.currentApplication.appId + '</app_id><tab_id>' + global.currentApplication.tabId + '</tab_id><view>' + global.currentApplication.view + '</view></PARAM></EWS>'
        , successMethod: 'buildHelp',
            xmlFormat: false
        }));
    },

    buildHelp: function(json) {

        this.summary = new Element("div").update('');

        if (json.EWS.o_summary) {

            this.title = global.getLabel('HelpInstructions');
            this.label = global.getLabel('Help_In_more');
            this.here = global.getLabel('Help_Ins_here');

            var sHtml = json.EWS.o_summary;
            var bHtml = json.EWS.o_body;

            //sHtml = sHtml.unescapeHTML();
            //bHtml = bHtml.unescapeHTML();

            this.summary.update(sHtml);
            this.body = new Element("div").update(bHtml);

            var bdyA = this.body.getElementsByTagName("a");
            for (i = 0; i < bdyA.length; i++) {
                bdyA[i].setAttribute('url_content', bdyA[i].getAttribute('href'));
                bdyA[i].removeAttribute('href');
            }
            this.moreButton = new Element('span', { 'class': 'application_action_link', 'id': 'here_help_link', 'tabindex': '0', 'title': this.label + ' ' + this.here }).update(this.here);
            this.moreButton.observe('click', this.moreButtonHandlerBinding);
            this.moreButton.observe('onkeydown', this.moreButtonHandlerBinding);
            this.summary.insert("... " + this.label + " ");
            this.summary.appendChild(this.moreButton);

        } else {
            this.summary.update(global.getLabel('NO_HELP_FOUND'));
            this.title = global.getLabel('HelpInstructions');
        }
        var targetDiv = new Element("div", {
            id: "helpDiv",
            'class': "help_container"
        });

        this.virtualHtml.insert(targetDiv);
        if (!Object.isEmpty($('here_help_link')))
            $('here_help_link').focus();
        var options = $H({
            title: this.title,
            collapseBut: true,
            contentHTML: this.summary,
            onLoadCollapse: false,
            targetDiv: 'helpDiv'
        });

        var helpWidget = new unmWidget(options);
    },

    moreButtonHandler: function(evt, noEvent) {

        var helpWindow = window.open('', 'helpWindow', 'menubar=no,status=no,scrollbars=no,menubar=no,height=456,width=600');
        helpWindow.document.write(""
        + "\n<html>"
        + "\n    <head>"
        + "\n        <title>" + this.title + "</title>"
        + "\n        <link href='css/CSS2.css' rel='stylesheet' type='text/css' />"
        + "\n    </head>"
        + "\n    <body>"
        + "\n          <div id='helpContent' class='help_full_container'>" + this.body.innerHTML + "</div>"
        + "\n          <div id='helpContent' class='help_full_close'><input type='button' value='" + global.getLabel('Help_Ins_close') + "' onclick='window.self.close();'></div>"
        + "\n    </body>"
        + "\n</html>");
        helpWindow.document.close();
    }

});

/**
*@constructor
*@description this class implements the Related links menu.
*@augments Menu
*/
var Related = Class.create(Menu,
/**
* @lends Related
*/
{


initialize: function($super, id, options) {
    $super(id, options);

    this.onOpenApplicationHandlerBinding = this.onOpenApplicationHandler.bindAsEventListener(this);
    document.observe("EWS:changeScreen", this.onOpenApplicationHandlerBinding);
},
/**
* This method refreshes related links items when the current application change.
* @param {Object} event Event object, automatically passed when when the event is fired
*/

onOpenApplicationHandler: function(event) {

    /*var args = getArgs(event);
    this.appId = args.appId;
    this.tabId = args.tabId;*/

},
/**
* Draws the related links menu.
* @param {Element} element Where the menu will be shown
*/
show: function($super, element) {
    $super(element);
    this.getRelatedLinks();
    /*if (this.appId && this.tabId) {
    this.getRelatedLinks();
    } else {
    this.changeTitle(global.getLabel('RelatedLinks'));
    this.changeContent('');
    }
    this.appId = '';
    this.tabId = '';*/
},

/**
* Request related links list
* @param {String} appID the current application ID
*/
getRelatedLinks: function() {
    this.makeAJAXrequest($H({ xml:
            '<EWS><SERVICE>ECM_GET_RELLNK</SERVICE><OBJECT TYPE=""/><DEL/><GCC/><LCC/><PARAM><app_id>' + global.currentApplication.appId + '</app_id><tab_id>' + global.currentApplication.tabId + '</tab_id><view_Id>' + global.currentApplication.view + '</view_Id></PARAM></EWS>'
            , successMethod: 'buildRelatedLinks'
            , xmlFormat: false
    }));
},
/**
* Build the related links items
* @param {Object} json the response
*/
buildRelatedLinks: function(json) {



    this.changeTitle(global.getLabel('RelatedLinks'));
    var content = new Element("div", {
        id: "relatedlinks_menu_content"
    });
    //Object.jsonPathExists(json, 'EWS.o_rel_links.yglui_str_ecm_rel_links.items.yglui_str_ecm_rellink')
    if (json.EWS.o_rel_links.yglui_str_ecm_rel_links.items) {

        var items;
        if (json.EWS.o_rel_links.yglui_str_ecm_rel_links.items.yglui_str_ecm_rellink.length) {
            items = json.EWS.o_rel_links.yglui_str_ecm_rel_links.items.yglui_str_ecm_rellink;
        } else {
            items = Array(json.EWS.o_rel_links.yglui_str_ecm_rel_links.items.yglui_str_ecm_rellink);
        }

        items.each(function(item) {
            var rlSpan = new Element("div", { 'class': 'application_action_link' }).update(item['@link_label']);
            content.insert(
            new Element("div", { 'class': 'related_container' }).update(rlSpan)
        );
            if (item['@link_url'].indexOf('http://') >= 0 || item['@link_url'].indexOf('https://') >= 0) {

                rlSpan.update('<a href="' + item['@link_url'] + '" target="_blank" class="application_action_link">' + item['@link_label'] + '</a>');
            } else {

                rlSpan.observe("click", this.openApplication.bindAsEventListener(this, item['@link_url']));
            }
        } .bind(this));

        // Add PDF link.
        var rlSpan = new Element("div", { 'class': 'application_action_link' }).update("");
        content.insert(
                new Element("div", { 'class': 'related_container' }).update(rlSpan)
            );
        if(global.o_language == 'E')
            rlSpan.update('<a href="http://' + window.location.hostname + '/sap/bc/bsp/sap/yglui_bsp_ews/customer/BNS/statdeden.pdf" target="_blank" class="application_action_link">Statutory deductions</a>');
        else
            rlSpan.update('<a href="http://' + window.location.hostname + '/sap/bc/bsp/sap/yglui_bsp_ews/customer/BNS/statdenfr.pdf" target="_blank" class="application_action_link">Déductions Statutaires</a>');
    } else {
        // Add PDF link.
        var rlSpan = new Element("div", { 'class': 'application_action_link' }).update("");
        content.insert(
            new Element("div", { 'class': 'related_container' }).update(rlSpan)
        );
        if (global.o_language == 'E')
            rlSpan.update('<a href="http://' + window.location.hostname + '/sap/bc/bsp/sap/yglui_bsp_ews/customer/BNS/statdeden.pdf" target="_blank" class="application_action_link">Statutory deductions</a>');
        else
            rlSpan.update('<a href="http://' + window.location.hostname + '/sap/bc/bsp/sap/yglui_bsp_ews/customer/BNS/statdedfr.pdf" target="_blank" class="application_action_link">Déductions Statutaires</a>');
    }
    this.changeContent(content);
},


openApplication: function(event, appClass) {
    appClass = appClass.split(',');
    global.open($H({
        app: {
            appId: appClass[1],
            tabId: appClass[0],
            view: appClass[2]
        }
    }));
}

});



$('help_button').observe('click', function() {

    if (!global.currentSubApplication) { // we don’t have one sub application running
        global.open($H({
            app: {
                tabId: "SUBAPP",
                appId: "HELP_APP",
                view: "Help"
            },
            position: "top"
        }));
    } else {// we have one sub application running
        global.closeSubApplication();
    }
} .bind(this));