/**
 *@fileOverview origin.js
 *@description in this file appear all the general functions we need to make the application work:
 * - Browser Detection Class
 * - XML functions
 * - ...
 *plus the classes:
 * - origin --> the mother class for all our objects
 * - Application --> every application we create belongs to this class
 * - Call --> make us be able to request to the back-end
 */

/**
 * @description initialize the default settings for the AJAX URL, the logoff page and the timeout for automatic logoff...
 */
var __logOffUrl = "proxy.aspx?url=" + escape("http://euhr3glo.euhreka.erp:8001/sap/bc/bsp/sap/system/logoff.htm");
var __hostName = "../../proxy.aspx?url=" + escape("http://eu2r3edc.euhreka.erp:8002/sap/bc/yglui_httpentry?sap-client=300");
Ajax.Responders.register({
    /**
	* @description This function will be called when making a new AJAX request
	*/
    onCreate: function() {
        htmlBars = "";
        if($('loadingDiv') && this.startColor == undefined) {
            this.startColor = $('loadingDiv').getStyle('backgroundColor').gsub('#','');
            if(this.startColor.include('rgb')) {
                var colorString = "";
                this.startColor = this.startColor.gsub(/(rgb)|[(]|[)]/,'').split(",").each(function(color) {
                    color = parseInt(color,10).toString(16);
                    colorString += (color.toString().length == 1 ? "0"+color : color);
                });
                this.startColor = colorString;
            }
        }
        if (Ajax.activeRequestCount > 0)
            if(this.startColor)
                var colors = this.performGradient(this.startColor, 'ffffff', Ajax.activeRequestCount);
        for (var i = 0; i < Ajax.activeRequestCount && colors; i++) {
            htmlBars += "<div class='fwk_start_loadingBar' style='background-color: " + colors[i] + ";'></div>";
        }
        if($("loadingDiv")){ //HERE WE CHANGE THE VISIBILITY OF THE LOADING DIV
            $("loadingDiv").show();
            $("loadingBars").show();
            $('loadingBars').update(htmlBars);
        }
        Ajax.activeRequestCount++;
    },
    /**
	* @description This function will be executed when an AJAX request is done
	*/
    onComplete: function() {
        Ajax.activeRequestCount--;
        htmlBars = "";
        if(Ajax.activeRequestCount > 0)
            var colors = this.performGradient(this.startColor,'ffffff',Ajax.activeRequestCount);
        for (var i = 0; i < Ajax.activeRequestCount; i++) {
            htmlBars += "<div class='fwk_start_loadingBar' style='background-color: "+colors[i]+";'></div>";
        }
        if($('loadingBars'))$('loadingBars').update(htmlBars);
        if ($("loadingDiv") && Ajax.activeRequestCount == 0) {
            $("loadingDiv").hide();
            $("loadingBars").hide();
        }

    },
    /**
	* @description This functions makes a color gradient between two colors on the steps you indicate
	* @param startColor Start color
	* @param endColor End color
	* @param height Number of steps
	* @returns An array with the generated colors
	*/
    performGradient: function(startColor,endColor,height) {
        var startr = parseInt((startColor.charAt(0) + startColor.charAt(1)),16);
        var startg = parseInt((startColor.charAt(2) + startColor.charAt(3)),16)
        var startb = parseInt((startColor.charAt(4) + startColor.charAt(5)),16);
        var endr = parseInt((endColor.charAt(0) + endColor.charAt(1)),16);
        var endg = parseInt((endColor.charAt(2) + endColor.charAt(3)),16);
        var endb = parseInt((endColor.charAt(4) + endColor.charAt(5)),16);
        var diffr = endr - startr;
        var diffg = endg - startg;
        var diffb = endb - startb;
        var intervalr = 0;
        var intervalg = 0;
        var intervalb = 0;
        var curr = startr;
        var curg = startg;
        var curb = startb;
        var i = 0;
        intervalr = Math.round(diffr / height);
        intervalg = Math.round(diffg / height);
        intervalb = Math.round(diffb / height);
        var colorArray = [];
        while(i < height) {
            curr_str = curr.toString(16);

            if(curr < 16) {
                curr_str = "0" + curr_str;
            }
            curg_str = curg.toString(16);
            if(curg < 16) {
                curg_str = "0" + curg_str;
            }
            curb_str = curb.toString(16);
            if(curb < 16) {
                curb_str = "0" + curb_str;
            }
            cur_color = "#" + curr_str + curg_str + curb_str;
            colorArray.push(cur_color);
            curr += intervalr;
            curg += intervalg;
            curb += intervalb;
            i++;
        }
        return colorArray;
    }
});

/**
 * @param event {Event} or {Object} An object, to look for arguments inside of it.
 * @description if the object is an Event object, it looks for arguments passed in the
 *          binding and returns it. Otherwise it returns the same object.
 * @returns {Object}
 */
function getArgs(event){
    if(event.memo){
        return event.memo;
    }else{
        return event;
    }
}

/**
 *@param sapFormatDate {String} Date in SAP format
 *@description returns Date Object
 *@returns Date
 */
function sapToObject(sapFormatDate){
    return Date.parseExact(sapFormatDate, "yyyy-MM-dd");
}
/**
 *@param displayFormatDate {String} Date in Display format
 *@description returns Date Object
 *@returns Date
 */
function displayToObject(displayFormatDate){
    return Date.parseExact(displayFormatDate, global.dateFormat);
}
/**
 *@param date {Date} Date Object
 *@description returns string date in Display format
 *@returns String
 */
function objectToDisplay(date){
    return date.toString(global.dateFormat);
}
/**
 *@param date {Date} Date Object
 *@description returns string date in SAP format
 *@returns String
 */
function objectToSap(date){
    return date.toString("yyyy-MM-dd");
}

/**
 *@param sapFormatDate {String} Date in SAP format
 *@description returns sapFormatDate into loggedUser Display format
 *@returns String
 */
function sapToDisplayFormat(sapFormatDate){
    var date = Date.parseExact(sapFormatDate, "yyyy-MM-dd");
    return date.toString(global.dateFormat);
}
/**
 *@param displayFormatDate {String} Date in SAP loggedUser Display format
 *@description returns displayFormatDate into SAP format
 *@returns String
 */
function displayToSap(displayFormatDate){
    var date = Date.parseExact(displayFormatDate, global.dateFormat);
    return date.toString("yyyy-MM-dd");
}
/**
 *@param longNumber {String} Long number
 *@description returns longNumber into LoggedUser Number Format
 *@returns String
 */
function longToDisplay(longNumber){
    if(!Object.isNumber(longNumber)){
//        if(log)
//            log.warning('The parameter '+longNumber+' is not a Long Number(possibly a String Object)');
        return null;
    }
    var number = new Number(longNumber.toPrecision(20)).floor().toString().toArray();
    var str = '';
    var period = 0;
    var thousand = true;
    for(var iter = number.size()-1;iter>=0;iter--){
        if(period == 3){
            var sep = (thousand)?'thousandsSeparator':'millionsSeparator';
            thousand = !(thousand);
            str =  number[iter] + global[sep] + str;
            period = 1;
        }else{
            var aux = str;
            str = number[iter] + str;
            period++;
        }
    }
    var fl = longNumber.toFixed(2).toString();
    var decimals = fl.gsub(fl.truncate(fl.indexOf('.'),''),'').sub('.',global.commaSeparator);
    str += decimals;
    return str;
}
/**
 *@param displayFormatNumber {String} Display number format
 *@description returns displayFormatNumber into loggedUser number Display format
 *@returns Number
 */
function displayToLong(displayFormatNumber){
    var plainNumber = displayFormatNumber.gsub(/\W+/,'');
    var firstPart = plainNumber.truncate(plainNumber.length-2,'');
    var secondPart = plainNumber.gsub(firstPart,'');
    alert(firstPart+'.'+secondPart);
    return new Number(firstPart+'.'+secondPart);
}

/**
 *@param mhash1 {Hash} first hash to be merged
 *@param mhash2 {Hash} second hash to be merged
 *@description merges (recursively in every hash level) 
 *two given hashes returning the result
 */
function recursiveMerge(mhash1, mhash2){
    var itHasHashInside = false;
    var hashes = $H({});
    var ret = mhash1.clone();
    mhash1.each(function(field){
        if (Object.isHash(field.value) && mhash2.get(field.key)) {
            hashes.set(field.key, this.recursiveMerge(mhash1.get(field.key), mhash2.get(field.key)));
            itHasHashInside = true;
        }
    }.bind(this));
    if (itHasHashInside) {
        hashes.each(function(field){
            ret.set(field.key, field.value);
        });
        return ret;
    }
    else {
        return mhash1.merge(mhash2);
    }
}

/**
*@param hash {hash} hash, with the information to convert to Html
*@description returns Html, a Html with the rigth format to use in the module infoPopUp
*@returns Html
*/
function hashToHtml(hash) {
    var title = hash.get('title');
    var html = "<div id='mainTitle' class='infoModule_main_titleCss application_main_title'>" + title + "</div>";
    for (var i = 1; i < hash.keys().length; i++) {
        var rows = hash.get(hash.keys()[i]).get('rows');
        var values = hash.get(hash.keys()[i]).values();
        html += "<div id=" + hash.get(hash.keys()[i]).keys()[0] + "_" + i + " class='infoModule_subtitle_css application_main_title2'>" + values[0] + "</div>";
        for (var j = 0; j < rows.length; j++) {
            html += "<div id='" + hash.keys()[i] + "_label_" + j + "' class='infoModule_labels_css application_main_text'>" + rows[j].get('label') + "</div>";
            html += "<div id='" + hash.keys()[i] + "_info_" + j + "' class='infoModule_info_css application_text_bolder'>" + rows[j].get('info') + "</div>";
        }
    }

    return html;
}

function getLegend(options) {
    var showed = false;
    var legend = objectToArray(options.legend);
    var showLabel = options.showLabel;
    var hideLabel = options.hideLabel;

    function hideShowLegend() {
        if (!showed) {
            showLabelDiv.hide();
            containRows.show();
            hideLabelDiv.show();
            showed = true;
        }
        else {
            containRows.hide();
            hideLabelDiv.hide();
            showLabelDiv.show();
            showed = false;
        }
    }
    var contain = new Element('div', ({ 'id': 'legend_module_contain', 'class': 'legend_module_containCss' }));
    var showLabelDiv = new Element('div', ({ 'id': 'legend_module_showLabel', 'class': 'application_action_link' })).update(showLabel);
    var hideLabelDiv = new Element('div', ({ 'id': 'legend_module_hideLabel', 'class': 'application_action_link' })).update(hideLabel);
    var containRows = new Element('div', ({ 'id': 'legend_module_containRows', 'class': 'legend_module_containRowsCss' }));
    contain.insert(showLabelDiv);
    contain.insert(hideLabelDiv);
    contain.insert(containRows);
    hideLabelDiv.hide();
    containRows.hide();
    showLabelDiv.observe('click', hideShowLegend.bind(this));
    hideLabelDiv.observe('click', hideShowLegend.bind(this));
    for (var i = 0; i < legend.length; i++) {
        var html = "<div class='legend_module_row_"+(i%3)+"'>"
                        + "<div class='" + legend[i]['img'] + " legend_module_column_" + (i % 3) + "'></div>"
                        + "<div class='legend_module_text'>" + legend[i]['text'] + "</div>"
                    + "</div>";
        containRows.insert(html);
    }
    return contain;

}

/**
 *@param json {JSON Object} JSON object that contains the table structure. Example:<br/>
 *
 *           {<br/>    
 *               id: 'targetDivId',<br/>
 *               header: ['header1','header2','header3','header4','header5'],<br/>
 *               row1: {content:['row1','row1','row1','row1','row1'],<br/>
 *                      tdIds:['row1Id','row1Id','row1Id','row1Id','row1Id'],<br/>
 *                      trId: 'id'<br/>
 *                     },<br/>
 *               row2: {content:['row2','row2','row2','row2','row2']},<br/>
 *               row3: {content:['row3','row3','row3','row3','row3'],trId: 'id3'},<br/>
 *               row4: {content:['row4','row4','row4','row4','row4']}<br/>
 *           }<br/><br/>        
 *				
 *			 where the only mandatory fields are:<br/>
 *           id and header, that must be named like that,<br/>
 *           then, the rest of the fields are the table rows, which<br/>
 *           name(JSON field key) it doesn´t matter when building the JSON structure, i mean,<br/>
 *           don´t have to be named row1,row2 etc.<br/><br/>
 *           
 *           Every row must have the mandatory field content, that must be an array containing the<br/>
 *           the row tds innerHTML(so every array index can be: 'plain text', new Element(), or '<span>... html text').<br/><br/>
 *			 
 *           There are two more not mandatory fields row related:<br/><br/>
 *           
 *                - tdIds --> array that contains the tds ids.<br/>
 *                - trId  --> string that sets the tr(row) id.<br/>
 *                	
 *@description This function it creates a simple HTML table, which content is passed as a parameter.
 */
function createSimpleTable(json){
	 //keeping needed values
     var target = json.id;
     var headerFields = json.header;
     var columns = headerFields.size();
	 //the table element
     var table = new Element('table');
     table.update('<tbody></tbody>');
	 //the table will be sized as its container element --> the targeted one
     table.setStyle({'height':'100%','width':'100%'});
     var rows = $H(json);    
	 //everything that is neither the target id nor the header is in fact a row
     rows.unset('id');rows.unset('header');     
	 //setting the header using the common CSS class 
     var header = new Element('tr',{'class':''});
     headerFields.each(function(field){
        var th = new Element('th');
        header.insert(th.insert(field));     
     });    
	 //inserting the header element into the table
     table.down().insert(header);
	 //inserting each row
     rows.each(function(row){
	 	//the row id
        var trId = (row.value.trId)?row.value.trId:'';
        var tr = new Element('tr',{'id':trId});     
		//for each column (the header number of columns is the maximum number)   
        for(var i=0;i<columns;i++){
		   //the HTML element or text to be inserted
           var value = (row.value.content[i])?row.value.content[i]:'&nbsp;';
		   //the cell id
           var tdId = (row.value.tdIds && row.value.tdIds[i])?row.value.tdIds[i]:'';
           var td = new Element('td',{'id':tdId});
		   //inserting the cell into the row
           tr.insert(td.insert(value));        
        }       
		//inserting the row into the table
        table.down().insert(tr);
     });
	 //and finally inserting the table into the target div
     $(target).insert(table);
}
/**
 *@param str {String} string where searching(case insensitive)
 *@param search {String} searched string
 *@param emphasizeClass {String} name of the css Class used to emphasized the searched string
 *@description returns the str string with the search string emphasized at it
 *@returns String
 */
function underlineSearch(str, search, emphasizeClass) {

    return str.gsub(new RegExp(search, "i"), function(match) {
        return "<span class='" + emphasizeClass + "'>" + match + "</span>";
    });
}
/**
 * @param aSeparators {Array} An array of caracters that are going to be treated as separators
 * @description Method that returns the string that calls it splitted into parts for all the specified separators
 * 		 Example:
 * 		 var str = 'Francisco.Catacroker@northgatearinso.com';
 * 		 str.multiSeparatorsSplit();
 * 		 -> ['Francisco','Catacroker','northgatearinso','com']
 * - It's important to take into account that character considered as special characters in regular expressions
 *   need to be scaped. Taking that into account will avoid regular expresion of being computed. However regular
 *   expresions could also be used to select the caracters that will be taken as separators. e.g. use '\\.' instead
 *   of '.'
 * @returns {Array} An array containing the calling string splitted
 */
String.prototype.multiSeparatorsSplit = function(aSeparators) {
    if (!aSeparators) {
        aSeparators = [',', '\\.', '@'];
    }
    substituteString = this;
    //Change any separator on the list to be a blank space
    for (i = 0; i < aSeparators.length; i++) {
        var separator = aSeparators[i]
        substituteString = substituteString.gsub(separator, ' ');
    }

    return substituteString.split(' ');
}

/**
*@param xmlDoc the xml document
*@param xslDoc the xsl document
*@param virtualHtml the html element where the result will be updated
*@description transforms the xml document with the xsl document and
*updates the virtualHTML with the html result
*@returns Boolean
*/

 function xslTransformation (xmlDoc, xslDoc, virtualHtml) {

    if (!xmlDoc || !xslDoc || !virtualHtml) {
        return false;
    }

    if (document.implementation && document.implementation.createDocument) { //Mozilla
        var xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xslDoc);
        var resultDocument = xsltProcessor.transformToFragment(xmlDoc, document);

        virtualHtml.update();
        virtualHtml.appendChild(resultDocument);
    } else if (window.ActiveXObject) { // IE
        
        virtualHtml.update(xmlDoc.transformNode(xslDoc));
    } else {
        return false;
    }

    return true;
}



/**
 *@param xml {IXMLDOMDocument2} the xml we want to search in
 *@param sXPath {String} XPath that guides to the correct nodes
 *@description returns, just in case the current browser was Firefox, a set
 *of nodes corresponding to the sXPath passed as a parameter
 *@returns Array
 */
function selectNodesFireFox(xml,sXPath) {
    var oEvaluator = new XPathEvaluator();
    var oResult = oEvaluator.evaluate(sXPath, xml.documentElement, null,XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var aNodes = new Array();
    if (oResult != null) {
        var oElement = oResult.iterateNext();
        while(oElement) {
            aNodes.push(oElement);
            oElement = oResult.iterateNext();
        }
    }
    return aNodes;
}
/**
 *@param xml {IXMLDOMDocument2} the xml we want to search in
 *@param xPath {String} XPath that guides to the correct nodes
 *@description returns a set of nodes corresponding to the sXPath passed as a parameter. It is
 *crossbrowser
 *@returns Array
 */
function selectNodesCrossBrowser(xml, xPath) {
    if (Prototype.Browser.IE) {

        return xml.selectNodes(xPath);
    } else if (Prototype.Browser.Gecko) {

        return selectNodesFireFox(xml, xPath);
    }
}

/**
 *@description create an XML document
 *@returns IXMLDOMDocument2
 */
function XmlDoc() {}

XmlDoc.create = function () {
    if(Prototype.Browser.IE)
    {
        var xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
        return xmlDoc;
    }else if(Prototype.Browser.Gecko){
        var doc = document.implementation.createDocument("", "", null);
        return doc;
    }
}
/**
 *@param xmlDoc {IXMLDOMDocument2} the xml we want to search in
 *@param elementPath {String} XPath that guides to the correct node
 *@description returns a nodes corresponding to the elementPath passed as a parameter. It is
 *crossbrowser
 *@returns IXMLDOMDocument2
 */
function selectSingleNodeCrossBrowser(xmlDoc, elementPath) {
    if (Prototype.Browser.IE) {
        return xmlDoc.selectSingleNode(elementPath);
    } else if (Prototype.Browser.Gecko) {
        var xpe = new XPathEvaluator();
        var nsResolver = xpe.createNSResolver(xmlDoc.ownerDocument == null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
        var results = xpe.evaluate(elementPath, xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

        return results.singleNodeValue;
    }
}
/**
 *@param xml {IXMLDOMDocument2} The xml to be read
 *@param xPath {String} The XPATH expression to locate the node within the xml
 *@description we get the node value specified by the xPath. ItÂ´s a crossbrowser function
 *@returns String
 */
function readXmlText(xml, xPath) {
    var node;
    node = selectSingleNodeCrossBrowser(xml, xPath);
    if (node) {
        if (document.implementation) {
            if (node.firstChild != null) {

                return node.firstChild.nodeValue;
            } else {

                return node.text;
            }
        }
    } else {

        return "";
    }
}
/**
* @description Gets the text from a node
* @param element Element
* @returns {String} The node text
*/
function getText(element) {
    if (Prototype.Browser.IE) {

        return element.text.strip();
    } else if (Prototype.Browser.Gecko) {

        return element.textContent.strip();
    }
}
/**
* @description Reads a XML file for a given path
* @param path
* @returns The XMl doc
*/
function readXmlFile(path) {
    xmlDoc = XmlDoc.create();
    xmlDoc.async = false;
    xmlDoc.load(path);
    return xmlDoc;
}
/**
 *@param strParamName {String} Parameter name to retrieve
 *@description obtains get parameters by name
 *@returnsString
 */
function getURLParam(strParamName) {
    var strHref = window.location.href;
    var params = strHref.toQueryParams();
    var firstPartParams = $H(strHref.toQueryParams())
    var secondPartParams = $H(strHref.substr(strHref.indexOf("#") + 1).toQueryParams())
    var result = firstPartParams.merge(secondPartParams);
    return (result.get(strParamName)) ? result.get(strParamName) : '';
}

/**
 * @description This method checks if a click is outside or inside an element
 * @param elemId ID of the element to check if the click is outside of it
 * @param evet Event information
 * @returns a boolean value indicating if the click is inside of the element or not
 */
function clickedOutsideElement(elemId, evt) {
    var theElem = '';
    if (window.event)
        theElem = _getEventTarget(window.event);
    else theElem = _getEventTarget(evt);
    while (theElem != null) {
        if (theElem.id == elemId)
            return false;
        theElem = theElem.offsetParent;
    }
    return true;
}

/**
 * @description Auxiliar function for clickOutsideElement, gets the target of the event
 * @param evt {Event} The event to get the target
 * @returns The target
 */
function _getEventTarget(evt) {
    var targ = (evt.target) ? evt.target : evt.srcElement;
    if(targ != null) {
        if (targ.nodeType == 3) targ = targ.parentNode;
    }

    return targ;
}

/**
 *@param xmlstring {String} String to convert
 *@description Converts a string into a XML document.
 *@returns xml {IXMLDOMDocument2}
 */
function stringToXML(xmlstring) {
    var xml;
    if (Prototype.Browser.IE) {
        xml = XmlDoc.create();
        xml.loadXML(xmlstring);
    } else {
        var parser = new DOMParser();
        xml = parser.parseFromString(xmlstring, "text/xml");
    }

    return xml;
}
/**
 *@param node {XML Node} Node from where got the xml text
 *@description Gets a xml document or node xml text(structure)
 *@returns String
 */
function xmlToString(node) {
    var text = '';
    if (Prototype.Browser.IE) {
        text = node.xml;
    } else {
        var serializer = new XMLSerializer();
        text = serializer.serializeToString(node);
    }

    return text;
}

/**
 * @param obj {Object}
 * @description Method that compares the incoming object with [null, undefined and a blank string], it will return true
 *           if the object is any of these values
 * @returns {boolean} True or false
 */
Object.isEmpty = function(obj) {
    if (Object.isUndefined(obj))

        return true;
    else if (obj == null)

        return true;
    else if (typeof obj == "string" && obj == "")

        return true;
    else
        return false;
}

function centerContainer(_stCenterElement, _stContentElement) {

    var inDetectedHeight = 0;
    var inAverageLossCompensation = 16;

    // If margin left was not set, it will generate a JavaScript error so avoidance is a must
    if(!Object.isEmpty($(_stContentElement).getStyle('marginLeft'))) {

        // In FF it's possible that the main element doesn't contain the height
        if($(_stContentElement).getHeight() < 1) {

            // Hopefully one of the sub elements has a height
            if(!Object.isEmpty($(_stContentElement))) {

                var inTeller = 0;

                while(inTeller < $(_stContentElement).childNodes.length) {

                    if(!Object.isEmpty($(_stContentElement).childNodes[inTeller].id)) {

                        inDetectedHeight += $(_stContentElement).childNodes[inTeller].getHeight();
                    }

                    inTeller++;
                }
            }
        } else {

            inDetectedHeight = $(_stContentElement).getHeight();
        }

        if(!(Object.isEmpty($(_stContentElement)) || Object.isEmpty($(_stCenterElement))) ) {

            $(_stCenterElement).setStyle({

                marginTop: '-' + String((inDetectedHeight / 2) + inAverageLossCompensation) + 'px',
                marginLeft: '-' + String(($(_stContentElement).getWidth() / 2) + parseInt($(_stContentElement).getStyle('marginLeft'))) + 'px'
            });
        }

        // IE6 Correction. Centering in a general way does work in IE7 and FF but not in IE6
        // so some style data had to be adapted to fix this.
        if((self.navigator.userAgent).indexOf("MSIE 6.0") > -1) {

            $(_stContentElement).setStyle({

                marginTop: document.documentElement.scrollTop + 'px',
                position: 'absolute'
            });
        }
    } else {

        log.debug('Left margin of ' + $(_stContentElement) + ' was not set!');
    }
}

/**
 * @method objectToArray
 * @param obj {Object} : Object we want to convert
 * @description This function will convert an object into an array
 *       (if the object is an array, it will return the same object)
 * @return {Array} Array with the object or the object itself
 */
function objectToArray(obj) {
    if (!Object.isArray(obj)) {
        var objArray = [obj];
        return objArray;
    }
    return obj;
}


     /**
     *@param total {Integer} The number of possible levels
     *@param current {Integer} The current level
     *@param required {Integer} The required level. If required == -1, then required bar is not displayed.
     *@description Creates a drawing of the rating
     */     
  function getRating(total,current,required){
        //check if we have required, or is a simple rating
        var simple = false;
        if(required == -1){ 
            required = current;
            simple = true;
        }
        var ratingHtml = new Element('table', {
            id: 'PFM_rating',
            'cellspacing': '0',
            'cellpadding': '0'
        });               
        //creation of tbody                                   
        var tbody = new Element('tbody', {
            id: 'PFM_rating_tbody'
        }); 
        var tr1 = new Element('tr');
        tr1.addClassName('PFM_tr_currentLevel');  
        for (var j = 0; j < total; j++) {
            var td = new Element('td').insert(  "<div class='PFM_ratingCurrent_cell'></div>");
            td.addClassName('PFM_currentLevel');
            if(j<current && current >= required) td.addClassName('PFM_greenLevel');
            else if(j<current && current < required) td.addClassName('PFM_yellowLevel');
            tr1.insert(td);
        }              
        var tr2 = new Element('tr');
        tr2.addClassName('PFM_tr_requiredLevel');
        for (var j = 0; j < total; j++) {
            var td = new Element('td').insert(  "<div class='PFM_ratingRequired_cell'></div>");
            td.addClassName('PFM_requiredLevel');
            if(j<required && !simple) td.addClassName('PFM_grayLevel');
            if(j<required && simple) td.addClassName('PFM_greenLevel');
            tr2.insert(td);
        }          
        tbody.insert(tr1);
        tbody.insert(tr2);
        ratingHtml.insert(tbody); 
        return ratingHtml;    
    }

/**
 * @constructor
 * @description Stores the services and contains function to get the services
 */
var ServicesCache = Class.create(
/**
* @lends ServicesCache
*/
{
    /**
	* @description The services map hash, this HASH KEY information about the services storage
	* @type Hash
	*/
    servicesMap: $H({
        //Inbox services
        get_task_detail: {
            store: true
        },
        task_action: {
            refresh: $H({
                get_events: function(jsonIn, jsonOut){
                    return true;
                }
            })
        },
        get_task_labels: {
            store: true
        },
        //My Delegations services
        get_delegations_list: {
            store: true
        },
        delegation_handler: {
            refresh: $H({
                get_current_delegations: function(jsonIn, jsonOut){
                },
                get_delegated_employees: function(jsonIn, jsonOut){
                }
            })
        },
        delegation_form: {
            store: true
        },
        //Time Entry
        save_event: {
            refresh: $H({
                get_events: function(jsonIn, jsonOut){
                    return true;
                }
            })
        },
        delete_event: {
            refresh: $H({
                get_events: function(jsonIn, jsonOut){
                    return true;
                }
            })
        },
        //Monthly Calendar
        get_training_events: {
            store: true
        },
        //List Calendar
        get_history_labels: {
            store: true
        },
        get_event_types: {
            store: true
        },
        get_event_statuses: {
            store: true
        },
        //Quotas
        get_quotas: {
            store: true
        },
        get_quotas_labels: {
            store: true
        },
        //Payslip
        getpayslipform: {
            store: true
        },
        getpayslipyears: {
            store: true
        },
        getpayslipperiod: {
            store: true
        },
        //Team Calendar
        get_cal_label: {
            store: true
        },
        getmyteam: {
            store: true
        },
        get_events: {
            store: true
        },
        get_cal_menu: {
            store: true
        },
        get_dws_dtails: {
            store: true
        },
        //In progress
        get_inprogress_labels: {
            store: true
        },
        get_booked_trainings: {
            store: true
        },
        get_booked_sessions: {
            store: true
        },
        //History
        get_history_labels: {
            store: true
        },
        get_training_history: {
            store: true
        },
        //Book
        cancel_prebooking: {
            refresh: $H({
                get_booked_trainnings: function(jsonIn, jsonOut){
                },
                get_booked_sessions: function(jsonIn, jsonOut){
                },
                get_prebook: function(jsonIn, jsonOut){
                }
            })
        },
        cancel_booking: {
            refresh: $H({
                get_booked_trainnings: function(jsonIn, jsonOut){
                },
                get_booked_sessions: function(jsonIn, jsonOut){
                },
                get_curriculums: function(jsonIn, jsonOut){
                }
            })
        },
        create_booking: {
            refresh: $H({
                get_booked_trainnings: function(jsonIn, jsonOut){
                },
                get_booked_sessions: function(jsonIn, jsonOut){
                }
            })
        },
        //Book Curriculum
        create_curr_booking: {
            refresh: $H({
                get_booked_trainnings: function(jsonIn, jsonOut){
                },
                get_booked_sessions: function(jsonIn, jsonOut){
                },
                get_curriculums: function(jsonIn, jsonOut){
                }
            })
        },
        get_curriculums: {
            store: true
        },
        //Prebook Application
        get_prebook: {
            store: true
        },
        create_prebooking: {
            refresh: $H({
                get_booked_trainnings: function(jsonIn, jsonOut){
                },
                get_booked_sessions: function(jsonIn, jsonOut){
                },
                get_curriculums: function(jsonIn, jsonOut){
                }
            })
        },
        //My Data
        get_my_data_groups: {
            store: true
        },
        get_widgets: {
            store: true
        },
        get_widget: {
            store: true
        },
        //OM
        get_om: {
            store: true
        },
        get_pers: {
            store: true
        },
        search_objects: {
            store: true
        },
        get_actions: {
            store: true
        },
        maint_object: {
            refresh: $H({
                get_om: function(jsonIn, jsonOut){
                    return (jsonIn.EWS.PARAM.O_ACTION == "C" || 
                            jsonIn.EWS.PARAM.O_ACTION == "M" || 
                            jsonIn.EWS.PARAM.O_ACTION == "D" || 
                            jsonIn.EWS.PARAM.O_ACTION == "L")
                }
            })
        },
        maint_lang: {
            store: true
        },
        maint_assign: {
            refresh: $H({
                get_om: function(jsonIn, jsonOut){
                    return (jsonIn.EWS.PARAM.O_ACTION == "U" ||
                            jsonIn.EWS.PARAM.O_ACTION == "C" ||
                            jsonIn.EWS.PARAM.O_ACTION == "L" ||
                            jsonIn.EWS.PARAM.O_ACTION == "D")
                }
            })
        },
		my_details: {
			store: true
		}
    }),
    /**
	 * @description stores all the called services
	 * @type Prototype.Hash
	 */
    cache: $H(),
    initialize: function() {

    },
    /**
	 * @description Stores a service on the cache
	 * @param {String} xmlIn the XML in that will form the key on the cache
	 * @param {JSON} xmlOut the content of the request
	 * @param {String} service The service name
	 */
    setService: function(xmlIn,xmlOut,service) {
        service = service.toLowerCase();
        if (this.store(service)) {
            //If the service doesn't exists on the cache we create it
            if (Object.isUndefined(this.cache.get(service)))
                this.cache.set(service, $H());
            //Storing the JSON object with the key generated from the xmlIn
            this.cache.get(service).set(this._generateKey(xmlIn), xmlOut);
        }
        var xmlParser = new XML.ObjTree();
        var jsonIn = xmlParser.parseXML(xmlIn);
        var jsonOut = xmlParser.parseXML(xmlOut);
        if (this.get(service) && this.get(service).refresh) {
            this.get(service).refresh.each(function(pair){
                var key = pair.key;
                var functionObject = pair.value;

                if (functionObject(jsonIn, jsonOut)) {
                    this.removeService(key);
                }
            }.bind(this));
        }
    },
    /**
	 * @description  Gets the service from the cache and return it
	 * @param {String} service The service name
	 * @param {String} xmlIn The XML in (key)
	 * @returns JSON object
	 */
    getService: function(service,xmlIn) {
        service = service.toLowerCase();
        return this.cache.get(service).get(this._generateKey(xmlIn));
    },
    /**
	 * @description Gets the service metadata.
	 * @paran {String} service the name of the service
	 * @return JSON the service metadata stored in a JSON object.
	 */
    get: function(service){
        service = service.toLowerCase();
        return this.servicesMap.get(service);
    },
    /**
	 * @description Gets whether the service has to be stored or not.
	 * @param {String} service the name of the service
	 * @return {Boolean} a boolean value. True only when the service data has to be stored. False otherwise
	 */
    store: function(service){
        service = service.toLowerCase();
        if (!Object.isUndefined(global.servicesCache.get(service))) {
            if (global.servicesCache.get(service).store != null) {
                return global.servicesCache.get(service).store;
            }else{
                return false;
            }
        }
    },
    /**
	 * @description Removes the service from the cache
	 * @param {String} service The service name
	 * @param {String} xmlIn the XML in (key)
	 */
    removeService: function(service) {
        service = service.toLowerCase();
        this.cache.unset(service);
    },
    /**
	 * @description Checks if the service is registed on the cache
	 * @param {String} service The service name
	 * @param {String} xmlIn The XML in (key)
	 */
    serviceExists: function(service,xmlIn) {
        if(this.cache.get(service) != undefined)
            if(this.cache.get(service).get(this._generateKey(xmlIn)) != undefined)
                return true;
        return false;
    },
    /**
	 * @description Generates an unique key from the XML in
	 * @param {String} xmlIn
	 * @returns The formed key
	 */
    _generateKey: function(xmlIn) {
        var key = 0;
        var div = 1;
        var lastCode = xmlIn.charCodeAt(0);
        for(var i = 0; i < xmlIn.length; i++) {
            lastCode += xmlIn.charCodeAt(i)*div;
            key += lastCode;
            if(i > 0)
                div = lastCode%xmlIn.charCodeAt(i-1);
        }
        return key;
    }
});

/**
 *@constructor
 *@description the parent class of any other from our application
 *give us the ability to make an AJAX request with the proper parameters
 */
var origin = Class.create(
/**
* @lends origin
*/
{
    initialize: function(target) {
        /**
		*@type String
		*@description id widget div
		*/
        this.target = target;
        /**
		*@type String
		*@description url of back-end system
		*/
        this.url = __hostName;

        this.created = false;
        /**
		*@type String
		*@description method for ajax request, by default POST
		*/
        this.method = "POST";
        /**
		*@type Hash
		*@description hash containing labels from last call
		*/
        this.labels = $H({});
        /**
		*@type string
		*@description congtains the default error method
		*/
        this.errorMethod = 'defaultErrorMethod';
        /**
		*@type string
		*@description congtains the default warningMethod
		*/
        this.warningMethod = 'defaultWarningMethod';
        /**
		*@type string
		*@description congtains the default informationMethod
		*/
        this.informationMethod = 'defaultInformationMethod';
        /**
		*@type string
		*@description congtains the default failureMethod
		*/
        this.failureMethod = 'defaultFailureMethod';
    },
    /**
		*@description requests the proper service to the back-end
		*/
    requestData: function() {
        var call = new Call(this);
    },
    /**
		* @description Performs an AJAX request
		* @param options The AJAX request options
		*/
    makeAJAXrequest: function(options){
        if(this.appName) {
            var area = global.applicationArea.get(this.appName)
            if(global.labelsCache.get(area) == undefined) {
                this.requestLabels = true;
                this.labelsArea = area;
            }
        }
        //the XML is needed always
        if(options.get('xml'))
            this.xml = options.get('xml');
        //the method to be called in case of success
        if(options.get('successMethod'))
            this.setSuccesMethod(options.get('successMethod'));
        //the method to be called in case of type "E"
        if(options.get('failureMethod'))
            this.setFailureMethod(options.get('failureMethod'));
        //the method to be called in case of type "I"
        if(options.get('informationMethod'))
            this.informationMethod = options.get('informationMethod');
        //the method to be called in case of type "W"
        if(options.get('warningMethod'))
            this.warningMethod = options.get('warningMethod');
        //the method to be called when the ajax request did not work at all (the server is down, wrong address, ...)
        if(options.get('errorMethod'))
            this.errorMethod = options.get('errorMethod');
        //the method to be called when the ajax request did not work at all (the server is down, wrong address, ...)
        if(options.get('ajaxID'))
            this.ajaxID = options.get('ajaxID');
        //whether the response has to be passed to the callback method in JSON or XML format
        if(options.get('xmlFormat'))
            this.xmlFormat = options.get('xmlFormat');
        this.requestData();
    },
    /**
		*@param args {String} text message to be shown on the framework screen
		*@description this method show the default error, warning, and info text messages
		*/
    defaultFailureMethod: function(data){
        var errorText = data.EWS.webmessage_text;
        var infoDivName = 'fwk_infoDiv';
        if(!$(infoDivName)){
            var total = new Element('div',{
                id:'fwk_info_total',
                className:'info_total_div'
            });
            total.update("<div class='info_div_up'>"
                +"<div class='info_div_up_leftCorner'></div>"
                +"<div class='info_div_up_center'></div>"
                +"<div class='info_div_up_rightCorner'></div>"
                +"</div>"
                +"<div id='"+infoDivName+"' class='"+infoDivName+"'><div class='fwk_info_logo'></div>"
                +"<div class='application_currentSelection fwk_right_corner'></div></div>"
                +"<div class='info_div_down'>"
                +"<div class='info_div_down_leftCorner'></div>"
                +"<div class='info_div_down_center'></div>"
                +"<div class='info_div_down_rightCorner'></div>"
                +"</div>");
            $('frameWork').insert(total);
            var inserted = $('fwk_info_total');
            inserted.down('div.application_currentSelection').observe('click',function(args){
                if(inserted){
                    inserted.remove();
                    Framework_stb.hideSemitransparent();
                }
            });
        }
        var div = $(infoDivName);
        Framework_stb.showSemitransparent();
        var auxDiv = new Element('div',{
            className:'application_sap_info_text_div'
        });
        auxDiv.update("<span>"+errorText+"</span>");
        div.insert(auxDiv);
    },
    /**
		*@param args {String} text message to be shown on the framework screen
		*@description this method show the default error, warning, and info text messages
		*/
    defaultInformationMethod: function(data){
        var delayTime = 10;
        var cName = 'fwk_successful';
        var successful = new Element('div',{
            className:cName
        });
        successful.update(
            "<div class='"+cName+"_left'></div>"
            +"<div class='"+cName+"_center'>"+data.EWS.webmessage_text+"&nbsp;&nbsp;&nbsp;</div>"
            +"<div class='"+cName+"_right'>"
            +"<div class='application_currentSelection'></div>"
            +"</div>"
            );
        /****************************************************/
        $('infoMessage').update(successful);
        successful.down('div.application_currentSelection').observe('click', successful.remove.bind(successful));
        new PeriodicalExecuter(function(pe) {
            try {
                successful.remove();
            } catch (err) {
                if (log) {
                    log.warn('origin: impossible to remove information advice');
                }
            }
            pe.stop();
        }, delayTime);
    },
    /**
		*@param args {String} text message to be shown on the framework screen
		*@description this method show the default error, warning, and info text messages
		*/
    defaultWarningMethod: function(data){
        var delayTime = 10;
        var cName = 'fwk_unSuccessful';
        var successful = new Element('div',{
            className:cName
        });
        successful.update(
            "<div class='"+cName+"_left'></div>"
            +"<div class='"+cName+"_center'>"+data.EWS.webmessage_text+"&nbsp;&nbsp;&nbsp;</div>"
            +"<div class='"+cName+"_right'>"
            +"<div class='application_currentSelection'></div>"
            +"</div>"
            );
        /****************************************************/
        $('infoMessage').update(successful);
        successful.down('div.application_currentSelection').observe('click', successful.remove.bind(successful));

        new PeriodicalExecuter(function(pe) {
            successful.remove();
            pe.stop();
        }, delayTime);
    },
    /**
		*@param args {String} text message to be shown on the framework screen
		*@description this method show the default error, warning, and info text messages
		*/
    defaultErrorMethod: function(args){
        var errorText = "Fatal error (server down, ajax call to wrong URL, ...)";
        var infoDivName = 'fwk_infoDiv';
        if(!$(infoDivName)){
            var total = new Element('div',{
                id:'fwk_info_total',
                className:'info_total_div'
            });
            total.update("<div class='info_div_up'>"
                +"<div class='info_div_up_leftCorner'></div>"
                +"<div class='info_div_up_center'></div>"
                +"<div class='info_div_up_rightCorner'></div>"
                +"</div>"
                +"<div id='"+infoDivName+"' class='"+infoDivName+"'><div class='fwk_info_logo'></div>"
                +"<div class='application_currentSelection fwk_right_corner'></div></div>"
                +"<div class='info_div_down'>"
                +"<div class='info_div_down_leftCorner'></div>"
                +"<div class='info_div_down_center'></div>"
                +"<div class='info_div_down_rightCorner'></div>"
                +"</div>");
            $('frameWork').insert(total);
            var inserted = $('fwk_info_total');
            inserted.down('div.application_currentSelection').observe('click',function(args){
                if(inserted){
                    inserted.remove();
                    Framework_stb.hideSemitransparent();
                }
            });
        }
        var div = $(infoDivName);
        Framework_stb.showSemitransparent();
        var auxDiv = new Element('div', {
            className: 'application_sap_info_text_div'
        });
        auxDiv.update("<span>" + errorText + "</span>");
        div.insert(auxDiv);
    },

    /**
		*@param service {String} service name
		*@description set name of initial service
		*/
    setService: function(service) {
        this.service = service;
    },

    /**
		*@method setSuccesMethod
		*@param succesMethod {String} the method it has to be run after receiving
		*the respond from the back-end
		*@description sets the succes method
		*/
    setSuccesMethod: function(succesMethod){
        this.succesMethod = succesMethod;
    },
    /**
		*@param failureMethod {String} the method it has to be run after receiving
		*the respond from the back-end if has occured an error
		*@description sets the failure method
		*/
    setFailureMethod: function(failureMethod){
        this.failureMethod = failureMethod;
    },

    /**
	        *@description get the name of the method is going to be run after receiving the
	        *back-end respond
	        *@retuns String
	        */
    getSuccesMethod: function(){
        return this.succesMethod;
    }
});


/**
 *@constructor
 *@description makes an AJAX call for an object
 */
var Call = Class.create(
/**
* @lends Call
*/
{
    /**
	*@param object {Object} the object which is going to make the call
	*@description creates a new AJAX request
	*/
    initialize: function(object){
        var xmlFormat = object.xmlFormat;
        var successMethod = object.succesMethod;
        var failureMethod = object.failureMethod;
        var informationMethod = object.informationMethod;
        var warningMethod = object.warningMethod;
        var errorMethod = object.errorMethod;
        var ajaxID = object.ajaxID;
        if (object.xml) {
            //Creating the JSON converter
            var xmlParser = new XML.ObjTree();
            var xmlJson = xmlParser.parseXML(object.xml);
            var serviceName = xmlJson.EWS ? xmlJson.EWS.SERVICE.toLowerCase() : '';
            //Checking if the services is in the old or in the new format
            xmlJson.EWS.DEL = getURLParam('roleOf');
			//Inserting GCC and LCC if any.
            var gcc = getURLParam("gcc");
            var lcc = getURLParam("lcc");
            if(!Object.isEmpty(gcc) && !Object.isEmpty(lcc)){
                xmlJson.EWS.GCC = gcc;
                xmlJson.EWS.LCC = lcc;
            }
            //if(object.requestLabels)
            //    Object.extend(xmlJson.EWS, {LABELS: {item: object.labelsArea}});
            //Converting JSON object to XML
            object.xml = xmlParser.writeXML(xmlJson, true);
            var xmlIn = object.xml;
        }
        //If this call is in the cache make the callback with the stored data.
        if (
			global && 
			global.servicesCache && 
			global.servicesCache.serviceExists(serviceName, object.xml)
		) {
            //Gettin the JSON object
            var data = global.servicesCache.getService(serviceName, xmlIn);
            //Calling to the callback
            object[successMethod](data, ajaxID);
        } else {
            var AJAXREQ = new Ajax.Request(object.url, {
                method: object.method,
                asynchronous: true,
                postBody: object.xml,
                onSuccess: function(req){
                    //Creating an instance of the XML2JSON converter
                    var xml = new XML.ObjTree();
                    //Setting the attributes prefix
                    xml.attr_prefix = '@';
                    //Parsing the XML
                    var data = xml.parseDOM(req.responseXML.documentElement);
                    //if(data.EWS.labels && object.labelsArea)
                    //    global.parseLabels(data.EWS.labels,object.labelsArea);
                    /************************************************************/
                    /*        TEMPORAL SOLUTION FOR NEW SERVICES MESSAGES       */
                    /************************************************************/
                    var error;
                    var errorText;
                    if (data.EWS && data.EWS.webmessage_text && data.EWS.webmessage_type) {
                        error = data.EWS.webmessage_type;
                        errorText = data.EWS.webmessage_text;
                    }
                    //Use the failureMethod in case the service is returning an error.
                    if (error == 'E') {
                        object[failureMethod](data, ajaxID);
                    } else {
                        //Handle the service storing.
                        if (global && !Object.isUndefined(global) && !Object.isUndefined(global.servicesCache) && !Object.isUndefined(xmlIn)) {
                            global.servicesCache.setService(xmlIn, data, serviceName);
                        }
                        //go to the proper callback function.
						
                        if(xmlFormat){
                            data = req.responseXML;
                        }
						
                        if (error == 'I') {
                            object[informationMethod](data, ajaxID);
                        } else if (error == 'W') {
                            object[warningMethod](data, ajaxID);
                        } //else {
                            object[successMethod](data, ajaxID);
//                        }
                    }
                },
                onFailure: function(req){
                    object[errorMethod]();
                }
            });
        }
    }
});

/**
 *@constructor
 *@description Class to contain the data needed for a time event, begin date and end date.
 */
var CAL_Event = Class.create(origin,
/**
* @lends CAL_Event
*/{
    /**
     * @type String
     * @description A string with a unique identification for an event
     */
    id: null,
    /**
     * @type String
     * @description A string with a unique identification for this event's owner employe
     */
    employee: null,
    /**
     * @type String
     * @description A string the type of event:
	 *	    ABS - Absence
	 *	    ATT - Attendance
	 *      AVL - Availability
	 *	    OVT - Overtime
	 *	    WSC - Work Schedule
	 *      REM - Remuneration
     */
    appId: null,
    /**
     * @type String
     * @description A string the subtype of event
     */
    subAppId: null,
    /**
     * @type Integer
     * @description A Integer to know whether the event is in approval, rejected or accepted
     *         1 - in approval
     *         2 - sent for deletion
     *         3 - accepted
     */
    status: null,
    /**
     * @type String
     * @description A String with a short description for the event
     */
    text: null,
    /**
     * @type Date
     * @description A Date object with the beggining date for an event
     */
    begDate: null,
    /**
     * @type Date
     * @description A Date object with the ending date for an event
     */
    endDate: null,
    /**
     * @type Integer
     * @description The length in days for the event, 0 if it's not a whole day event.
     */
    daysLength: null,
    /**
     * @type boolean
     * @description true if the event lasts all day long
     */
    allDay: null,
    /**
     * @type Date
     * @description A Date object with the beggining date and hour for an object
     */
    hoursLength: null,
    /**
     * @type String
     * @description A String containing a long description for the event.
     */
    comment: null,
    /**
     * @type Boolean
     * @description flag to tell if it's a training event or a normal one.
     */
    isTraining: false,
    /**
     * @type Boolean
     * @description If the event has been drawn or not
     */
    drawn: false,
    /**
     * @type String
     * @description A String containing the name of the application where the object was created.
     */
    createdIn: null,
    /**
     * @param id {String} a String with the event id to search inside the XML document
     * @param xmlDoc {IXMLDOMDocument2} A XML Document containing the data for the event.
     * @description It creates a new CAL_Event from an XML coming from the GET_EVENTS or GET_TRAINING_EVENTS
     */
    initialize: function($super, id, xmlDoc, training) {
        $super();
        if (xmlDoc) {
            xmlDoc.OpenHR.events.event = objectToArray(xmlDoc.OpenHR.events.event);
            var eventXML = xmlDoc.OpenHR.events.event.find(function(element) {

                return element["@id"] == id;
            });
            if (eventXML) {
                if (training) {
                    this.parseTrainingEvent(eventXML);
                } else {
                    this.parseEvent(eventXML);
                }
            }
        }
    },
    /**
     * @param id {String} The ID for the event that want to be parsed
     * @param xmlDoc {IXMLDOMDocument2} The XML Document where the desired event is.
     * @description parses an Event coming from the GET_EVENTS service service response
     */
    parseEvent: function(xmlDoc) {
        var day, month, year, hour, minute, second;
        this.id = xmlDoc["@id"];
        //setting each of the attributes from the XML and deleting extra blank spaces if the
        //attribute is set, otherwhise it would cause a bug.
        this.employee = xmlDoc.employee["@id"];
        this.text = xmlDoc.type["@text"];
        // Application ID
        this.appId = xmlDoc["@appId"];
        this.subAppId = xmlDoc.type["#text"];
        //reading begining data for the event to create the Date object to define it
        var beginDay = xmlDoc.beginDate["#text"];
        var beginHour = xmlDoc.beginHour ? xmlDoc.beginHour["#text"] : '';
        if (!Object.isEmpty(beginHour) && beginHour.gsub(' ', '') == "::" || Object.isEmpty(beginHour)) beginHour = '';
        beginHour = beginHour == "240000" ? "235959" : beginHour;
        beginDay = beginDay.gsub('-', '');
        this.begDate = beginHour.blank() ? Date.parseExact(beginDay, "yyyyMMdd") : Date.parseExact(beginDay + beginHour, "yyyyMMddHHmmss");
        //reading ending data for the event to create the Date object to define it
        var endDay = xmlDoc.endDate["#text"];
        endDay = endDay.gsub('-', '');
        var endHour = xmlDoc.endHour ? xmlDoc.endHour["#text"] : '';
        if (!Object.isEmpty(endHour) && endHour.gsub(' ', '') == "::" || Object.isEmpty(endHour)) endHour = '';
        endHour = endHour == "240000" ? "235959" : endHour;
        this.endDate = endHour.blank() ? Date.parseExact(endDay, "yyyyMMdd") : Date.parseExact(endDay + endHour, "yyyyMMddHHmmss");
        //event length
        this.daysLength = xmlDoc.days;
        this.hoursLength = xmlDoc.hours;
        this.hoursLength = this.hoursLength ? this.hoursLength.strip() : '';
        //comments
        this.comment = xmlDoc.comment;
        //whether the event lasts all day long or not
        this.allDay = xmlDoc["@allDay"] == "X";
        //Whether the event is sent for approval (1), sent for deletion (2) or none of them (3)
        var deletionFlag = xmlDoc["@delFlag"];
        var statusFlag = xmlDoc["@inApproval"];
        if (statusFlag == 'X') {
            this.status = 1;
        } else if (deletionFlag == 'X') {
            this.status = 2;
        } else {
            this.status = 3;
        }
    },
    /**
	 * @param id {String} The ID for the event that want to be parsed
	 * @param xmlDoc {IXMLDOMDocument2} The XML Document where the desired event is.
	 * @description parses an Event coming from the GET_TRAINING_EVENTS service response
	 */
    parseTrainingEvent: function(id, xmlDoc) {
        this.isTraining = true;
        this.parseEvent(id, xmlDoc);
    },
    toJSON: function(){
        var auxObject = Object.clone(this);
        auxObject.begDate = this.begDate.toString('ddMMyyyy HHmmss')
        auxObject.endDate = this.endDate.toString('ddMMyyyy HHmmss');
        auxObject.toJSON = null;

        return  Object.toJSON(auxObject);
    }
});