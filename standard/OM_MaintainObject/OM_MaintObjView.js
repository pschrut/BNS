/*
 *@fileoverview OM_MaintObjView.js
 *@desc It contains a class with functionality for showing objects' information.
 */
/**
 *@constructor
 *@description Class with functionality for showing objects' information.
 *@augments Application
 */
var OM_MaintObjView_standard = Class.create(Application, 
/** 
*@lends OM_MaintObjView 
*/
{
    /*** SERVICES ***/

    /**
     *@type String
     *@description Maintain Objects service
     */
    maintObjectService: 'MAINT_OBJECT',
    /**
     *@type String
     *@description Get personal details service
     */
    getPersonalDetailsService: 'GET_PERS',

    /*** VARIABLES ***/
    /**
     *@type Hash
     *@description Object's details
     */
    details: new Hash(),
     /**
     *@type String
     *@description Initial date format
     */
    dateFormatIn: 'yyyy-MM-dd',
     /**
     *@type String
     *@description Final date format
     */
    dateFormatOut: 'dd.MM.yyyy',
    
    /*** METHODS ***/
    /**
     *Constructor of the class OM_MaintObjView
     */
    initialize: function($super,args) {                  
        $super(args);
    },
    /**
     *@description Starts OM_MaintObjView
     *@param {Object} args Application's args
     */
    run: function($super, args) {
        $super();
        if (balloon.isVisible())
            balloon.hide();
        this.running = true;
        this.virtualHtml.update("");
        this.details.set('begdate', args.get('begdate'));
        if (args.get('enddate'))
            this.details.set('enddate', args.get('enddate'));
        else
            this.details.set('enddate', '');
        this.details.set('node', args.get('node'));
        this.details.set('objectType', args.get('objectType'));
        if (args.get('root'))
            this.details.set('root', args.get('root'));
        else
            this.details.set('root', '');
        if (args.get('position'))
            this.details.set('position', args.get('position'));
        else
            this.details.set('position', '');
        this._getObjectDetails(this.details.get('objectType'));
    },
    /**
     *@description Stops OM_MaintObjView
     */
    close: function($super) {
        $super();
    },
    /**
     *@description Asks the backend for an object's information
     *@param {String} type Object type (org. unit, position or person)
     */
    _getObjectDetails: function(type) {
        var xml;
        // Org. units & positions
        if (type != 'P') {
            xml = "<EWS><SERVICE>" + this.maintObjectService + "</SERVICE>" +
                  "<OBJECT TYPE='" + this.details.get('objectType') + "'>" + this.details.get('node') + "</OBJECT>" +
                  "<PARAM>" +
                      "<O_ACTION>V</O_ACTION>" +
                      "<O_BEGDA>" + this.details.get('begdate') + "</O_BEGDA>" +
                      "<O_ENDDA>" + this.details.get('enddate') + "</O_ENDDA>" +
                  "</PARAM></EWS>";
        }
        // Persons
        else {
            xml = "<EWS><SERVICE>" + this.getPersonalDetailsService + "</SERVICE><PARAM>" +
                  "<O_PERNR>" + this.details.get('node') + "</O_PERNR>" +
                  "<O_POSITION>" + this.details.get('position') + "</O_POSITION>" +
                  "<O_DATE>" + this.details.get('begdate') + "</O_DATE>" +
                  "</PARAM></EWS>";
        }
        this.makeAJAXrequest($H({xml:xml, successMethod:'_showObjectDetails', ajaxID: type}));
    },
    /**
     *@description Shows an object's information
     *@param {JSON} json Object from the backend
     *@param {String} ID Object type
     */
    _showObjectDetails: function(json, ID) {
        // Show org. unit's details
        if (ID == 'O') {
            // Getting information
            var data = new Hash();
            var orgUnitDetails = new Array();
            var objects = objectToArray(json.EWS.o_object.yglui_tab_object);
            for (var i = 0; i < objects.length; i++)
                this._setObjectDataType(objects[i], data, ID);
            if (objects.length > 1) {
                data.each( function(element) {
                    if (Object.isEmpty(element.value['@descr'])) element.value['@descr'] = "-";
                });
                var aux;
                // Org. unit name
                if (data.get('stext')) {
                    aux = new Hash();
                    aux.set('label', global.getLabel('orgunitname'));
                    aux.set('info', data.get('stext')['@descr']);
                    orgUnitDetails.push(aux);
                }
                // Org. unit code
                if (data.get('short')) {
                    aux = new Hash();
                    aux.set('label', global.getLabel('orgunitcode'));
                    aux.set('info', data.get('short')['@descr']);
                    orgUnitDetails.push(aux);
                }
                var dataaux = new Hash(data);
                dataaux.unset('stext');
                dataaux.unset('short');
                dataaux.each( function(element) {
                    aux = new Hash();
                    aux.set('label', element.value['@flabel']);
                    aux.set('info', element.value['@descr']);
                    orgUnitDetails.push(aux);
                });
            }
            var orgUnit = json.EWS.o_orgunit;
            var street = orgUnit['@stras'];
            var number = orgUnit['@hausn'];
            if (Object.isEmpty(street)) {
                street = '-';
                number = '';
            }
            else
                if (Object.isEmpty(number))
                    number = '';
            var postal = orgUnit['@pstlz'];
            if (Object.isEmpty(postal)) postal = '-';
            var city = orgUnit['@ort01'];
            if (Object.isEmpty(city)) city = '-';
            var country = orgUnit['@land1_text'];
            if (Object.isEmpty(country)) country = '-';
            var phone = orgUnit['@telnr'];
            if (Object.isEmpty(phone)) phone = '-';
            var fax = orgUnit['@faxnr'];
            if (Object.isEmpty(fax)) fax = '-';
            var email = orgUnit['@smtpadr'];
            if (Object.isEmpty(email)) 
                email = '-';
            else
                email = "<a href='mailto:" + email + "'><span class='application_action_link'>" + email + "</span></a>";
            // Building info hash
            var dataHash = $H({
                title: global.getLabel('orgunitdetails'),
                subTitle1: $H({
                    subTitle: global.getLabel('basicdata'),
                    rows: orgUnitDetails
                }),
                subTitle2: $H({
                    subTitle: global.getLabel('address'),
                    rows: [$H({ label: global.getLabel('street') + '/' + global.getLabel('number'), info: street + " " + number }),
                           $H({ label: global.getLabel('postalcode'), info: postal }),
                           $H({ label: global.getLabel('city'), info: city }),
                           $H({ label: global.getLabel('country'), info: country }),
                           $H({ label: global.getLabel('PHONE'), info: phone }),
                           $H({ label: global.getLabel('fax'), info: fax }),
                           $H({ label: global.getLabel('EMAIL'), info: email })]
                }) 
            });
            // Obtaining HTML code from info hash
            var html = hashToHtml(dataHash);
            // Showing information
            var newContent = "<div style='text-align: left; width: 450px; ";
            if (Prototype.Browser.Gecko)
                newContent += "margin-left: 150px;"
            newContent += "'>" + html + "<br /></div>";
            this.virtualHtml.update(newContent);
        }
        // Show position's details
        if (ID == 'S') {
            // Getting information
            var data = new Hash();
            var positionDetails = new Array();
            var objects = objectToArray(json.EWS.o_object.yglui_tab_object);
            for (var i = 0; i < objects.length; i++)
                this._setObjectDataType(objects[i], data);
            var aux;
            if (objects.length > 1) {
                data.each( function(element) {
                    if (Object.isEmpty(element.value['@descr'])) element.value['@descr'] = "-";
                });
                // Org. unit name
                if (data.get('stext')) {
                    aux = new Hash();
                    aux.set('label', global.getLabel('posname'));
                    aux.set('info', data.get('stext')['@descr']);
                    positionDetails.push(aux);
                }
                // Org. unit code
                if (data.get('short')) {
                    aux = new Hash();
                    aux.set('label', global.getLabel('posabbr'));
                    aux.set('info', data.get('short')['@descr']);
                    positionDetails.push(aux);
                }
                var dataaux = new Hash(data);
                dataaux.unset('stext');
                dataaux.unset('short');
                dataaux.each( function(element) {
                    aux = new Hash();
                    aux.set('label', element.value['@flabel']);
                    aux.set('info', element.value['@descr']);
                    positionDetails.push(aux);
                });
            }
            // Date range
            var begda = json.EWS.o_begda;
            begda = Date.parseExact(begda, this.dateFormatIn).toString(this.dateFormatOut);
            var endda = json.EWS.o_endda;
            endda = Date.parseExact(endda, this.dateFormatIn).toString(this.dateFormatOut);
            var date = global.getLabel('from') + " " + begda + " " + global.getLabel('to').toLowerCase() + " " + endda;
            aux = new Hash();
            aux.set('label', global.getLabel('valDate'));
            aux.set('info', date);
            positionDetails.push(aux);
            // Org. unit
            var orgUnit = this.details.get('root');
            aux = new Hash();
            aux.set('label', global.getLabel('ORGEH'));
            aux.set('info', orgUnit);
            positionDetails.push(aux);
            // Other info
            var position = json.EWS.o_position;
            // Employee group
            var eegroup = position['@persg_text'];
            if (Object.isEmpty(eegroup))
                eegroup = '-';
            aux = new Hash();
            aux.set('label', global.getLabel('PERSG'));
            aux.set('info', eegroup);
            positionDetails.push(aux);
            // Employee subgroup
            var eesubgroup = position['@persk_text'];
            if (Object.isEmpty(eesubgroup))
                eesubgroup = '-';
            aux = new Hash();
            aux.set('label', global.getLabel('PERSK'));
            aux.set('info', eesubgroup);
            positionDetails.push(aux);
            // Email
            var email = position['@smtpadr'];
            if (Object.isEmpty(email)) 
                email = '-';
            else
                email = "<a href='mailto:" + email + "'><span class='application_action_link'>" + email + "</span></a>";
            aux = new Hash();
            aux.set('label', global.getLabel('EMAIL'));
            aux.set('info', email);
            positionDetails.push(aux);
            // Holder
            var holder = null;
            if (json.EWS.o_position.rel_p) {
                holder = "";
                var persons = objectToArray(json.EWS.o_position.rel_p.yglui_tab_pos_pers);
                for (var i = 0; i < persons.length; i++) {
                    if (i > 0)
                        holder += "<br />";
                    holder += persons[i]['@stext'] + " (" + persons[i]['@prozt'] + "%)";
                }
            }
            if (Object.isEmpty(holder))
                holder = '-';
            aux = new Hash();
            aux.set('label', global.getLabel('posholder'));
            aux.set('info', holder);
            positionDetails.push(aux);
            // Building info hash
            var dataHash = $H({
                title: global.getLabel('posdetails'),
                subTitle1: $H({
                    subTitle: '&nbsp',
                    rows: positionDetails
                })
            });
            // Obtaining HTML code from info hash
            var html = hashToHtml(dataHash);
            // Showing information
            var newContent = "<div style='text-align: left; width: 450px; ";
            if (Prototype.Browser.Gecko)
                newContent += "margin-left: 150px;"
            newContent += "'>" + html + "<br /></div>";
            this.virtualHtml.update(newContent);            
        }
        // Show person's details
        if (ID == 'P') {
            // Getting name
            var employeename = json.EWS.o_emp_name;
            if (Object.isEmpty(employeename)) employeename = '';
            // Getting personal details
            var persDetails = new Array();
            if (json.EWS.o_orgdata) {
                var persDetailsInfo = objectToArray(json.EWS.o_orgdata.yglui_tab_field);
                for (var i = 0; i < persDetailsInfo.length; i++) {
                    var aux = new Hash();
                    aux.set('label', global.getLabel(persDetailsInfo[i]['@field']));
                    aux.set('info', Object.isEmpty(persDetailsInfo[i]['@value']) ? '-' : persDetailsInfo[i]['@value']);
                    persDetails.push(aux);
                }
            }
            // Getting communication info
            var comDetails = new Array();
            if (json.EWS.o_communi) {
                var comDetailsInfo = objectToArray(json.EWS.o_communi.yglui_tab_field);
                for (var i = 0; i < comDetailsInfo.length; i++) {
                    var aux = new Hash();
                    aux.set('label', global.getLabel(comDetailsInfo[i]['@field']));
                    aux.set('info', Object.isEmpty(comDetailsInfo[i]['@value']) ? '-' : comDetailsInfo[i]['@value']);
                    comDetails.push(aux);
                }
            }
            // Building info hash
            var dataHash = $H({
                title: employeename,
                subTitle1: $H({
                    subTitle: global.getLabel('orgdata'),
                    rows: persDetails
                }),
                subTitle2: $H({
                    subTitle: global.getLabel('communication'),
                    rows: comDetails
                }) 
            });
            // Obtaining HTML code from info hash
            var infoData = hashToHtml(dataHash);
            // Showing information
            var html = "<table class='OMdisplay_info_table'>" +
                           "<tr>" +
                               "<th class='OMdisplay_info_title' colspan=2>" + global.getLabel('empdetails') + "</th>" +
                           "</tr>" +
                           "<tr>" +
                               "<td class='OMdisplay_info_photo'><div class='application_noPicture OMdisplay_photo'></div></td>" +
                               "<td class='OMdisplay_info_data'>" + infoData + "</td>" +
                           "</tr>" +
                       "</table>";
            var newContent = "<div style='text-align: left; width: 450px; ";
            if (Prototype.Browser.Gecko)
                newContent += "margin-left: 150px;"
            newContent += "'><br />" + html + "<br /></div>";
            this.virtualHtml.update(newContent);  
        }
    },
    /**
     *@description Sets an org. unit's data type and its content into a Hash
     *@param {JSON} object Org. unit's object
     *@param {Hash} hash Hash with org. unit's info
     *@param {String} type Object type (org. unit or position)
     */
    _setObjectDataType: function(object, hash, type) {
        if (hash.get(object['@fld_sbty'].toLowerCase())) {
            var secnumber = parseInt(object['@seqen']);
            var secaux = parseInt(hash.get(object['@fld_sbty'].toLowerCase())['@seqen']);
            var objectLanguage = object['@langu'];
            var hashLanguage = hash.get(object['@fld_sbty'].toLowerCase())['@langu'];
            if (((secnumber < secaux) && (hashLanguage != global.language)) || (objectLanguage == global.language))
                hash.set(object['@fld_sbty'].toLowerCase(), object);
        }
        else
            hash.set(object['@fld_sbty'].toLowerCase(), object);
    }
});

var OM_MaintObjView = Class.create(OM_MaintObjView_standard, {
    initialize: function($super) {
        $super('OM_MaintObjView');
    },
    run: function($super,args) {
        $super(args);
    },
    close: function($super) {
        $super();
    }
});