/**
*@fileoverview StartPage.js
*@description
*/

/**
*@constructor
*@description 
*@augments Application
*/


//var content = new Content('StartPageContainer');

var StartPage = Class.create(Application, {

    appSubArea: null,

    initialize: function($super, options) {
        $super(options);
    },

    run: function($super, args) {
        $super(args);
        if (this.firstRun) {
            this.virtualHtml.update();
            this.getContent(this.options.mnmid, this.options.sbmid);
        }

    },

    close: function($super) {
        $super();
    },

    getContent: function(appArea, appSubArea) {

        this.makeAJAXrequest($H({ xml:
        '<EWS><SERVICE>ECM_GET_STRTPGE</SERVICE><OBJECT TYPE=""/><DEL/><GCC/><LCC/><PARAM><area_id>' + appArea + '</area_id><sub_area_id>' + appSubArea + '</sub_area_id></PARAM></EWS>'
        , successMethod: 'build',
            xmlFormat: true
        }));
    },

    build: function(xml) {

        var xmlParser = new XML.ObjTree();
        xmlParser.attr_prefix = '@';
        var json = xmlParser.parseXML(xmlToString(xml));

        var html = xmlToString(xml.getElementsByTagName('o_startpage')[0]).replace(/<(\/)?o_startpage>/g, '');
        html = html.unescapeHTML();
        var body = new Element("div", {
            id: "StartPageContainer",
            style: "width:100%;text-align:left;margin-bottom:20px;"
            //TODOD : move to css/CSS2.cs
        }).update('<h2>' + '' + '</h2>' + html);

        var anchors = body.getElementsByTagName("a");
        for (i = 0; i < anchors.length; i++) {
            anchors[i].setAttribute('url_content', anchors[i].getAttribute('href'));
            anchors[i].setAttribute('onclick', 'if(content){content.getLink(event);}');
            anchors[i].removeAttribute('href');
        }
        var imgs = body.getElementsByTagName("img");
        for (i = 0; i < imgs.length; i++) {
            imgs[i].setAttribute('src', 'km?mod=load&amp;service=getImg&amp;imgPath=' + imgs[i].getAttribute('src'));
        }

        this.virtualHtml.insert(body);
    }

});
