/**
 *@fileOverview XBoxGrid.js
 *@description It contains a class with functionality for evaluate an organization's talent team.
 */

var XBoxGrid = Class.create(PFM_parent, 
{
    
    getTopSectionService : 'XBG_LOAD_APP',
   
    getGetGridService : 'XBG_LOAD_GRID',
   
    getEmpGridService : 'XBG_GET_EE_DATA',
    
    getEmpActionsService : 'GET_EMP_ACTIO',
    
    getContentService: 'GET_CONTENT2',
    
    boxSchedules: $H({}),
       
    PFM_BGSelectChanged: false,
    
    boxGrid_axis:null,
    
    toolTips: null,
    
    appTop: null,
    
    appProfile: null,
    
    maxCol: null,
    
    maxRow: null,
    
    obligatory3:null,
    
    boxGrid:null,
    
    selectedErrEmpHash:null,
    
    errMissingCount:null,
       
    initialize: function($super, args) {
            this.ie = Prototype.Browser.IE;
            this.appID = args.appId;
            selectedErrEmpHash='';
            errMissingCount=0;
            $super(args);
 	},
	
	run:function($super, args){
	        $super(args);
	        if(this.firstRun){
	            this.getTopSection();
            }
	},
	
	getTopSection: function(){
           
            var xmlTopSect="<EWS>" +
                           "<SERVICE>"+this.getTopSectionService+"</SERVICE>" +
                           "<DEL/><PARAM>" +
                           "<I_APPID>"+this.appID+"</I_APPID></PARAM>"+
                           "</EWS>";
      
            this.makeAJAXrequest($H({ xml: xmlTopSect,
                successMethod: 'successTopSection',
                xmlFormat: false
            }));
    },
    
    successTopSection: function(json){
            this.divTopSection = new Element('div', {
                        'id': 'PFM_BGdivTopMenu',
                        'class': 'PFM_BGFloatLeft PFM_BGTotalWidth'
                    });
            this.divTopSection.insert("<div class='PFM_BGFloatLeft PFM_BGHalfWidth PFM_BGBolder' id='PFM_BGLeftTopMenu'></div>");
            
            var rightTopSection=new Element('div',{
                'class':'PFM_BGFloatLeft PFM_BGHalfWidth',
                'id':'PFM_BGRightTopMenu'
            });
            this.divTopSection.insert(rightTopSection);
            var jsonObject = {
                elements:[]
            };
            var auxRefresh =   {
                    label: global.getLabel("refresh"),
                    handlerContext: null,
                    className:'PFM_BGButtonRefresh',
                    handler: this.updateBoxGrid.bind(this,''),
                    type: 'button',
                    standardButton:true
            };                 
            jsonObject.elements.push(auxRefresh);  
            this.ButtonRefreshGrid = new megaButtonDisplayer(jsonObject);
            this.divTopSection.insert(this.ButtonRefreshGrid.getButtons());
            
            this.Axisselect=$A();
            for(var i=0;i<3;i++){
                var container = new Element('div',{
                    'class':'PFM_BGFloatLeft PFM_BGTotalWidth PFM_BGLabelsAlign',
                    'id':'PFM_BG_axis' + i
                });
                container.insert("<span class='PFM_BGFloatLeft PFM_BGHalfWidth PFM_BGAxisLabels' id='PFM_BG_labelAxis_"+i+"'>"+global.getLabel('axis')+" "+(i+1)+":</span>");
                var PFM_BGSelect=new Element('select',{
                    'class':'fieldDisplayer_select PFM_BGFloatLeft PFM_BGHalfWidth'
                }).observe('change', this.changeSelect.bind(this));
                this.Axisselect.push(PFM_BGSelect);
                container.insert(PFM_BGSelect);
                rightTopSection.insert(container);
            }
            this.virtualHtml.update(this.divTopSection);
            this.PFM_mainDivGrid=new Element('div',{
                'class':'XBG_BGFloatRightPFM_BGTotalWidth XBG_BGAlignGridTopTable',
                'id': 'PFM_BGMainDiv'
            });
            this.virtualHtml.insert(this.PFM_mainDivGrid);
            this.PFM_mainMissingGrid=new Element('div',{
                'class':'PFM_BGFloatLeft PFM_BGTotalWidth',
                'id': 'PFM_BGMissingDiv'
            });
            this.virtualHtml.insert(this.PFM_mainMissingGrid);  
            this.PFM_mainFootGrid=new Element('div',{
                'class':'PFM_BGFloatLeft PFM_BGTotalWidth XBG_BGAlignGridTable',
                'id': 'PFM_BGFootDiv'
            });
            this.virtualHtml.insert(this.PFM_mainFootGrid);
            
            
            this.PFM_BGOptionsAxis=$H({});
            appProfile=json.EWS.o_fieldset_profile;
            appTop=json.EWS.o_fieldset_top;
            toolTips = json.EWS.o_tooltip_allowed;   
            
            if(!Object.isEmpty(appTop)){
                  this.getFieldSetTop(appTop);
            }
            
            boxGrid_axis=json.EWS.o_dimensions.yglui_str_xbg_dimension;
            
            for(var k=0;k<boxGrid_axis.size();k++){
                var defaultValueAxi= Object.isEmpty(boxGrid_axis[k]['@default_axe']) ? "" : boxGrid_axis[k]['@default_axe'];
                this.PFM_BGOptionsAxis.set(boxGrid_axis[k]['@dim_code'], {'value': this.labels.get(boxGrid_axis[k]['@dim_code']), 'defaultAxi': defaultValueAxi});
            }

            for(var i=0;i<this.Axisselect.size();i++){
                var options = '';
                for(var j=0;j<boxGrid_axis.size();j++){
                    var PFM_BGValue=this.labels.get(boxGrid_axis[j]['@dim_tag']);
                    var PFM_BGDefault="";
                    var PFM_BGDefaultIE=false;
                    obligatory3 = json.EWS.o_axes.yglui_str_xbg_axe[2]['@obligatory'];
              
                    if((boxGrid_axis[j]['@default_axe']=='1' && i==0) 
                    || (boxGrid_axis[j]['@default_axe']=='2' && i==1) 
                    || (boxGrid_axis[j]['@default_axe']=='0' && i==2)){
                        if(boxGrid_axis[j]['@default_axe']=='0' && i==2 && obligatory3!='X'){
                            var PFM_BGDefault=""; 
                            var PFM_BGDefaultIE=true;
                        }else{
                            var PFM_BGDefault="selected"; 
                            var PFM_BGDefaultIE=true;
                        }
                    }
                    if (Prototype.Browser.Gecko){ 
                        options=options + '<option value="' + boxGrid_axis[j]['@dim_code'] +'" '+PFM_BGDefault+'>' + PFM_BGValue + '</option>'; 
                    }
                    else{
                        this.Axisselect[i].options[j] = new Option(PFM_BGValue ,boxGrid_axis[j]['@dim_code'], false, PFM_BGDefaultIE);
                    }
            }
            if(i==2 && obligatory3!='X'){
                var obOptions = boxGrid_axis.size();
                this.Axisselect[2].options[obOptions] = new Option("N/A" ,"", false, PFM_BGDefaultIE);
            }
            if(Prototype.Browser.Gecko){
                if(i==2 && obligatory3!='X'){
                    options=options + '<option value="" selected>N/A</option>';
                }
                this.Axisselect[i].update(options);
            }
        }
        this.getEmptyGrid();
   
    },
    
    getFieldSetTop:function(events){
            var xmlToShowContent =    "<EWS>"
                                    + "<SERVICE>"+this.getContentService+"</SERVICE>"
                                    + "<OBJECT TYPE='P'>"+global.objectId+"</OBJECT>"
                                    + "<PARAM>"
                                    + "<APPID>"+appTop+"</APPID>"
                                    + "<WID_SCREEN>1</WID_SCREEN>"
                                    + "</PARAM>"
                                    + "</EWS>";
            this.makeAJAXrequest($H({ xml: xmlToShowContent, successMethod: 'successFieldSetTop' })); 
    },
    
    
    successFieldSetTop: function(json){
            var mode = 'display';
	        var values = json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content;
	        var contentHTML = new Element('div');
	        var fields = objectToArray(values.fields.yglui_str_wid_field);
            var auxDetail = new getContentModule({
                appId: appTop,
                mode: 'display',
                json: json,
                showCancelButton: false,
                showButtons: $H({
                    edit: false,
                    display: false,
                    create: false
                })
            });
            this.divTopSection.down('[id = PFM_BGLeftTopMenu]').update(auxDetail.getHtml());
     },
     
     
     updateBoxGrid:function(){
      
          if(this.PFM_BGSelectChanged){
             for(i=0; i<maxRow; i++){
                for(j=0; j<maxCol; j++){
                  this.newGrid.removeCell('PFM_mainBoxGridTable', i, j);
                }
             }
             this.newGrid.removeCellByContent('PFM_mainBoxGridTable', 'horizontalTitle');
             this.newGrid.removeCellByContent('PFM_mainBoxGridTable', 'verticalTitle');
             if(!Object.isEmpty(this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridDesc'))){
                   this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridDesc').remove();
                   this.MissingGridDesc = null; 
             }
             
            var mySplitResult = selectedErrEmpHash.split(",");

            for(i = 0; i < mySplitResult.length; i++){
	            if(!Object.isEmpty(this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridTable_'+mySplitResult[i]))){
                    this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridTable_'+mySplitResult[i]).remove();
                }
            }
            this.MissingGridTable=null;
            selectedErrEmpHash='';
            errMissingCount=0;
             
            this.getEmptyGrid();
            this.renderSelectedEmployees();
          }// end if this.PFM_BGSelectChanged
     },
     
     renderSelectedEmployees: function(){
            var employees = this.getSelectedEmployees();
         
            employees.each(function(employee){
                if(!Object.isEmpty(this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridTable_'+employee.key))){
                       this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridTable_'+employee.key).remove();
                }
                
                if(!Object.isEmpty(this.PFM_mainDivGrid.down('div#PFM_BGLegendFoot'))){
                       this.PFM_mainDivGrid.down('div#PFM_BGLegendFoot').remove();
                       this.PFM_BGAxis3=null;
                }
                this.onEmployeeSelected({
                    id: employee.key,
                    name: employee.value.name,
                    oType: employee.value.oType,
                    population: employee.value.population,
                    color: employee.value.color 
                });
            }.bind(this));
     },
     
     changeSelect:function(event){
            this.PFM_BGSelectChanged=true;
     },
     
     getEmptyGrid: function(){
            var paramAXES_WITH_DIM;
            var PFM_BGAxi1;
            var PFM_BGAxi2;
            var PFM_BGAxi3;
             
            if(!Object.isEmpty(this.Axisselect[0][this.Axisselect[0].selectedIndex].value))
                 PFM_BGAxi1="<YGLUI_STR_XBG_AXE_WITH_DIM AXE_CODE=\"1\" DIM_CODE='"+this.Axisselect[0][this.Axisselect[0].selectedIndex].value+"' />";
                 
            if(!Object.isEmpty(this.Axisselect[1][this.Axisselect[1].selectedIndex].value))
                 PFM_BGAxi2="<YGLUI_STR_XBG_AXE_WITH_DIM AXE_CODE=\"2\" DIM_CODE='"+this.Axisselect[1][this.Axisselect[1].selectedIndex].value+"' />";
            
            paramAXES_WITH_DIM =   PFM_BGAxi1 + PFM_BGAxi2;
                 
            if(!Object.isEmpty(this.Axisselect[2][this.Axisselect[2].selectedIndex].value)) {
                 PFM_BGAxi3="<YGLUI_STR_XBG_AXE_WITH_DIM AXE_CODE=\"3\" DIM_CODE='"+this.Axisselect[2][this.Axisselect[2].selectedIndex].value+"' />";
                 paramAXES_WITH_DIM =   PFM_BGAxi1 + PFM_BGAxi2 + PFM_BGAxi3;
            }
            
            var xmlEmptyGrid = "<EWS>"+
                               "<SERVICE>"+this.getGetGridService+"</SERVICE>"+
                               "<DEL></DEL>"+
                               "<PARAM>"+
                               "<I_APPID>"+this.appID+"</I_APPID>"+
                               "<I_AXES_WITH_DIM>"+
                               paramAXES_WITH_DIM+
                               "</I_AXES_WITH_DIM>"+
                               "</PARAM></EWS>";
            
            this.makeAJAXrequest($H({ xml: xmlEmptyGrid, successMethod: 'successEmptyGrid' }));     
     },
     
     
     successEmptyGrid: function(json){
     
            if(!Object.isEmpty(json.EWS.o_dim_values)){
            
                var labelsToGetHeaders=json.EWS.o_dim_values.yglui_str_xbg_dim_value;
                
                if(!Object.isEmpty(labelsToGetHeaders[1]['@dim_code'])){
                        for(k1=0; k1<boxGrid_axis.length;k1++){
                            if(labelsToGetHeaders[1]['@dim_code']==boxGrid_axis[k1]['@dim_code']){
                                var textHorToShow = this.labels.get(boxGrid_axis[k1]['@dim_tag']);
                            }
                        }
                }
                
                if(!Object.isEmpty(labelsToGetHeaders[0]['@dim_code'])){
                        for(w=0; w<boxGrid_axis.length;w++){
                            if(labelsToGetHeaders[0]['@dim_code']==boxGrid_axis[w]['@dim_code']){
                                var textVerToShow = this.labels.get(boxGrid_axis[w]['@dim_tag']);
                            }
                        }
                }
                maxCol = labelsToGetHeaders[1].values.yglui_str_xbg_value.length+1;
                maxRow = labelsToGetHeaders[0].values.yglui_str_xbg_value.length+1;
                
                if(labelsToGetHeaders.length > 2){
                        if(!Object.isEmpty(labelsToGetHeaders[2]['@dim_code'])){
                            for(n2=0; n2<boxGrid_axis.length;n2++){
                                if(labelsToGetHeaders[2]['@dim_code']==boxGrid_axis[n2]['@dim_code']){
                                    var textAxis3ToShow = this.labels.get(boxGrid_axis[n2]['@dim_tag']);
                                }
                            }
                        }
                }
                else 
                    var textAxis3ToShow="";
         
                if(!this.BoxGridTable){
                    this.BoxGridTable=new Element('div',{
                        'class':'PFM_BGFloatLeft',
                        'id':'PFM_mainBoxGridTable'
                    });
                    this.PFM_mainDivGrid.insert(this.BoxGridTable);
                }
                
                if(Prototype.Browser.Gecko)
                     var tdClass = "XBG_tdVerticalMoz";
                else
                    var tdClass = "XBG_tdVertical"; 
       
                if(!this.newGrid)
                    this.newGrid=new boxGridModule('PFM_mainBoxGridTable', maxRow, maxCol,"");//tdClass);
                
                this.newGrid.setCellStyle('PFM_mainBoxGridTable', 165, 80, "#EFF5FB", "X");
                this.newGrid.setVerTitle('PFM_mainBoxGridTable', this.htmlFormatVerticalText(textVerToShow));
                this.newGrid.setHorTitle('PFM_mainBoxGridTable', textHorToShow);
                
                
                var horizontalHash=$H({});
                var verticalHash=$H({});
                var thirdAxiHash=$H({});
                
                for(var i=0;i<labelsToGetHeaders.length;i++){
                        if(!Object.isEmpty(labelsToGetHeaders[i].values)){
                                var headersToShow=labelsToGetHeaders[i].values.yglui_str_xbg_value;
                                
                                if(i==0){
                                      for(var j=0;j<headersToShow.length;j++){
                                        verticalHash.set(headersToShow[j]['@val_pos'].gsub('00', ''), this.labels.get(headersToShow[j]['@val_tag']));
                                     } 
                                     this.newGrid.verticalHeader('PFM_mainBoxGridTable', verticalHash);    
                                }
                                if(i==1){
                                    for(var k=0;k<headersToShow.length;k++){
                                            horizontalHash.set(headersToShow[k]['@val_pos'].gsub('00', ''), this.labels.get(headersToShow[k]['@val_tag']));
                                        }
                                        this.newGrid.horizontalHeader('PFM_mainBoxGridTable', horizontalHash);
                                }
                                if(labelsToGetHeaders.length>2){
                                      for(var p=0;p<headersToShow.length;p++){
                                          thirdAxiHash.set(headersToShow[p]['@val_pos'].gsub('00', ''), this.labels.get(headersToShow[p]['@val_tag']));
                                      }  
                                }
                        }
                }  
           
                if(!Object.isEmpty(textAxis3ToShow)){
                    if(!this.PFM_BGAxis3){
                        this.PFM_BGAxis3=new Element('div',{
                            'class':'PFM_BGFloatLeft PFM_BGTotalWidth PFM_BGAlignGridLegendTable',
                            'id':'PFM_BGLegendFoot'
                        });
                        this.PFM_mainDivGrid.insert(this.PFM_BGAxis3);
                    }
                    
                    this.PFM_BGAxis3.update("<span class='PFM_BGBolder'></span><div class='PFM_BGTextInLeft PFM_BGClearBoth' id='PFM_BGLegend'></div>");
                    var myJSONObject = { legend: [
                        { img: "application_icon_green", text: thirdAxiHash.get('3') },
                        { img: "application_icon_orange", text: thirdAxiHash.get('2') },
                        { img: "application_icon_red", text: thirdAxiHash.get('1') }
                    ],
                        showLabel: this.labels.get("XBG_SHOW_LEGEND")+" "+textAxis3ToShow,
                        hideLabel: this.labels.get("XBG_HIDE_LEGEND")+" "+textAxis3ToShow
                    };
                    var html = getLegend(myJSONObject);
                    this.PFM_BGAxis3.down('div#PFM_BGLegend').insert(html);
                }
                if(!this.PFM_BGSelectChanged)
                    this.getContentGrid();  
            }   
     },
     
     getContentGrid: function(empSelectedId){
     
            var objId;
            var objType;
            if(empSelectedId != null){
                objId = empSelectedId.id;
                objType = empSelectedId.oType;
            }else{
                objId = global.objectId;
                objType = global.objectType;
            }
             var paramAXES_WITH_DIM;
             var PFM_BGAxi1;
             var PFM_BGAxi2;
             var PFM_BGAxi3;
                 
             if(!Object.isEmpty(this.Axisselect[0][this.Axisselect[0].selectedIndex].value))
                  PFM_BGAxi1="<YGLUI_STR_XBG_AXE_WITH_DIM AXE_CODE=\"1\" DIM_CODE='"+this.Axisselect[0][this.Axisselect[0].selectedIndex].value+"' />";
                     
             if(!Object.isEmpty(this.Axisselect[1][this.Axisselect[1].selectedIndex].value))
                  PFM_BGAxi2="<YGLUI_STR_XBG_AXE_WITH_DIM AXE_CODE=\"2\" DIM_CODE='"+this.Axisselect[1][this.Axisselect[1].selectedIndex].value+"' />";
             
              paramAXES_WITH_DIM =  PFM_BGAxi1 + PFM_BGAxi2;
                     
             if(!Object.isEmpty(this.Axisselect[2][this.Axisselect[2].selectedIndex].value)){
                 PFM_BGAxi3="<YGLUI_STR_XBG_AXE_WITH_DIM AXE_CODE=\"3\" DIM_CODE='"+this.Axisselect[2][this.Axisselect[2].selectedIndex].value+"' />";
                 paramAXES_WITH_DIM =   PFM_BGAxi1 + PFM_BGAxi2 + PFM_BGAxi3;
             }
                
             var xmlToFillGrid = "<EWS><SERVICE>"+this.getEmpGridService+"</SERVICE>"+
                                     "<DEL/><PARAM>"+
                                     "<I_APPID>"+this.appID+"</I_APPID>"+
                                     "<I_AXES_WITH_DIM>"+
                                     paramAXES_WITH_DIM+
                                     "</I_AXES_WITH_DIM>"+
                                     "<I_EMPLOYEES>"+
                                     "<YGLUI_STR_HROBJECT PLVAR=\"01\" OTYPE='"+objType+"' OBJID='"+objId+"'/>"+
                                     "</I_EMPLOYEES>"+
                                     "</PARAM></EWS>"; 
                               
            this.makeAJAXrequest($H({ xml: xmlToFillGrid, successMethod: 'successContentGrid' }));  
     },
     
     
    successContentGrid:function(json){
           this.PFM_BGridContent=$H({});
           var contentMissing='';
           var _this=this; 
           if(!Object.isEmpty(json.EWS.o_ee_errors)){
                                 
                   errMissingCount=errMissingCount+1;
                   var empMissingGrid=json.EWS.o_ee_errors.yglui_str_xbg_ee_error;
                   
                   if(!this.MissingGridDesc){
                       this.MissingGridDesc=new Element('div',{
                                           'class':'PFM_BGFloatLeft XBG_BGMissingGridDesc',
                                           'id':'PFM_mainMissingGridDesc'
                       });
                       
                       this.PFM_mainMissingGrid.insert(this.MissingGridDesc);
                       this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridDesc').update(_this.labels.get("XBG_MISSING_INFO")); 
                   } 
                   
                   if(!Object.isEmpty(empMissingGrid.length)){
                        contentMissing = "<div id='PFM_missingInfo'>"
                                       + "<table><tr class='XBG_missingGridTr'><td colspan=\"2\">"
                                       + "<tr><td class='XBG_missingGridTd'><div class='PFM_BGFloatLeft application_verticalR_arrow' id='PFM_MissingContent_"+empMissingGrid[0]['@objid']+"'>&nbsp;&nbsp;  </div>"+empMissingGrid[0]['@ee_name']
                                       + "</td><td><table class='PFM_BGFloatLeft'>";
                        
                        for(var m=0;m<empMissingGrid.length;m++){
                             var empMissingId = empMissingGrid[m]['@objid'];
                             contentMissing +="<tr><td class='PFM_BGFloatLeft'><div>&nbsp;"+_this.labels.get("XBG_ERROR_TYPE_"+empMissingGrid[m]['@er_type'])+" "+_this.labels.get("XBG_DIM_"+empMissingGrid[m]['@dim_code'])+"</div></td></tr>"; 
                        }
                        
                        contentMissing += "</table></td></tr></table></div>"; 
                        selectedErrEmpHash = empMissingGrid[0]['@objid']+","+selectedErrEmpHash;         
                    }
                    else{
                             var empMissingId = empMissingGrid['@objid'];
                             selectedErrEmpHash = empMissingGrid['@objid']+","+selectedErrEmpHash;
                             contentMissing = "<div id='PFM_missingInfo'>"
                                       + "<table><tr class='XBG_missingGridTr'><td colspan=\"2\">"
                                       + "<tr><td class='XBG_missingGridTd'><div class='PFM_BGFloatLeft application_verticalR_arrow' id='PFM_MissingContent_"+empMissingGrid['@objid']+"'>&nbsp;&nbsp;  </div>"+empMissingGrid['@ee_name']
                                       + "</td><td>"
                                       + "<div>&nbsp;&nbsp;"+_this.labels.get("XBG_ERROR_TYPE_"+empMissingGrid['@er_type'])+" "+_this.labels.get("XBG_DIM_"+empMissingGrid['@dim_code'])+"</div>"
                                       + "</td></tr></table></div>";      
                    }
                    
                   this.MissingGridTable=new Element('div',{
                                        'class':'PFM_BGFloatLeft XBG_MissingDiv',
                                        'id':'PFM_mainMissingGridTable_'+empMissingId
                    });
                   this.PFM_mainMissingGrid.insert(this.MissingGridTable);
                   this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridTable_'+empMissingId).update(contentMissing)
                   this.PFM_mainMissingGrid.down('div#PFM_MissingContent_'+empMissingId).observe('click', _this.getClickEmployeeInfo.bind(_this, empMissingId));
           
           }
                 
           if(!Object.isEmpty(json.EWS.o_ee_results)){
                    var employeesInGrid=json.EWS.o_ee_results.yglui_str_xbg_ee_result;
                    var imgClass;
           
            for(var i=0;i<1;i++){
                var coordX=$H({}); coordY=$H({}); coordZ=$H({}); axes=$H({});
                var coordPerEmp=employeesInGrid.values.yglui_str_xbg_rslt_value;
                
                var empCoordX = employeesInGrid.values.yglui_str_xbg_rslt_value[0]['@val_pos'].replace("00", "");
                var empCoordY = employeesInGrid.values.yglui_str_xbg_rslt_value[1]['@val_pos'].replace("00", "");
                if(!Object.isEmpty(employeesInGrid.values.yglui_str_xbg_rslt_value[2]))
                    var empCoordZ = employeesInGrid.values.yglui_str_xbg_rslt_value[2]['@val_pos'].replace("00", "");
                    
              
                if(toolTips=="X"){
                    var scoreX = this.labels.get("XBG_DIM_"+employeesInGrid.values.yglui_str_xbg_rslt_value[0]['@dim_code'])+" : "+trim(employeesInGrid.values.yglui_str_xbg_rslt_value[0]['@val_score']);
                        if(!Object.isEmpty(boxGrid_axis[0]['@unit_tag']))
                            scoreX = scoreX + this.labels.get(boxGrid_axis[0]['@unit_tag']);
                        else
                            scoreX = scoreX;
                    
                    var scoreY = this.labels.get("XBG_DIM_"+employeesInGrid.values.yglui_str_xbg_rslt_value[1]['@dim_code'])+" : "+trim(employeesInGrid.values.yglui_str_xbg_rslt_value[1]['@val_score']);
                        if(!Object.isEmpty(boxGrid_axis[1]['@unit_tag']))
                            scoreY = scoreY + this.labels.get(boxGrid_axis[1]['@unit_tag']);
                        else
                            scoreY = scoreY;
                         
                    if(!Object.isEmpty(employeesInGrid.values.yglui_str_xbg_rslt_value[2])){
                        var scoreZ = this.labels.get("XBG_DIM_"+employeesInGrid.values.yglui_str_xbg_rslt_value[2]['@dim_code'])+" : "+trim(employeesInGrid.values.yglui_str_xbg_rslt_value[2]['@val_score']);
                        if(!Object.isEmpty(boxGrid_axis[2]['@unit_tag']))
                            scoreZ = scoreZ + this.labels.get(boxGrid_axis[2]['@unit_tag']);
                        else 
                            scoreZ = scoreZ;
                    }
                    else
                        var scoreZ ="";
                        
                    
                    var acronymTitle="<div id='CAL_acronymWrapper_"+employeesInGrid['@objid']+"' class='PFM_BGFloatLeft'>"+
                                     employeesInGrid['@ee_name']+
                                     "</div><div id='toverdiv_"+employeesInGrid['@objid']+"' class=\"XBG_mouseOverToolTips\">"+
                                     scoreX+"<br>&nbsp;"+scoreY+"<br>&nbsp;"+scoreZ+"</div>";
                                   
                }
                else{
                    var acronymTitle =employeesInGrid['@ee_name'];
                }
                 
                if((empCoordX!="0")&&(empCoordY!="0")){
                        
                        if(!Object.isEmpty(empCoordZ)){
                                switch (empCoordZ) {
                                case '1': imgClass = "XBG_thirdAxisRed"; break;
                                case '2': imgClass = "XBG_thirdAxisOrange"; break;
                                case '3': imgClass = "XBG_thirdAxisGreen"; break;
                                default:
                                    this.view = ""; break;
                                }
                        
                        }
                        if(!_this.BoxGridTable.down('table#PFM_BGridTable_pos'+empCoordX+'_'+empCoordY)){
                
                                var table="<table class='PFM_BGTotalWidth' id='PFM_BGridTable_pos"+empCoordX+"_"+empCoordY+"'>"+
                                                "<tbody>"+
                                                    "<tr id='PFM_BGridTable_"+employeesInGrid['@objid']+"'><td>"+
                                                        "<div class='PFM_BGFloatLeft'>"+
                                                            "<div class='PFM_BGFloatLeft application_verticalR_arrow' id='PFM_BGContent_"+employeesInGrid['@objid']+"'></div>"+
                                                            "<span class='PFM_BGFloatLeft PFM_BGAlignTextInGrid' id='PFM_BGEmpoyee_"+empCoordX+"_"+empCoordY+"'>"+
                                                            acronymTitle+
                                                            "</span>"+
                                                            "<div class='"+imgClass+"'></div>"+
                                                        "</div>"+
                                                    "</td><tr>"+
                                                "</tbody>"+
                                          "</table>";
                                _this.newGrid.fillCell('PFM_mainBoxGridTable', table, empCoordX, empCoordY);
                                _this.BoxGridTable.down('div#PFM_BGContent_'+employeesInGrid['@objid']).observe('click', _this.getClickEmployeeInfo.bind(_this, employeesInGrid['@objid']));
                                _this.BoxGridTable.down('div#CAL_acronymWrapper_'+employeesInGrid['@objid']).observe('mouseover', function() { this.onDivMouseOver('toverdiv_'+employeesInGrid['@objid'],_this.BoxGridTable.down('div#CAL_acronymWrapper_'+employeesInGrid['@objid'])); } .bind(this));
                                _this.BoxGridTable.down('div#CAL_acronymWrapper_'+employeesInGrid['@objid']).observe('mouseout', function() { this.onDivMouseOut('toverdiv_'+employeesInGrid['@objid']); } .bind(this));
                        }
                        else{
                        
                                _this.BoxGridTable.down('table#PFM_BGridTable_pos'+empCoordX+'_'+empCoordY + " tbody").insert("<tr id='PFM_BGridTable_"+employeesInGrid['@objid']+"'><td><div class='PFM_BGFloatLeft'>"+
                                                        "<div class='PFM_BGFloatLeft application_verticalR_arrow' id='PFM_BGContent_"+employeesInGrid['@objid']+"'></div>"+
                                                        "<span class='PFM_BGFloatLeft PFM_BGAlignTextInGrid'>"+
                                                        acronymTitle+
                                                        "</span>"+
                                                        "<div class='"+imgClass+"'></div></div></td></tr>");
                        
                                _this.BoxGridTable.down('div#PFM_BGContent_'+employeesInGrid['@objid']).observe('click', _this.getClickEmployeeInfo.bind(_this, employeesInGrid['@objid']));
                                _this.BoxGridTable.down('div#CAL_acronymWrapper_'+employeesInGrid['@objid']).observe('mouseover', function() { this.onDivMouseOver('toverdiv_'+employeesInGrid['@objid'],_this.BoxGridTable.down('div#CAL_acronymWrapper_'+employeesInGrid['@objid'])); } .bind(this));
                                _this.BoxGridTable.down('div#CAL_acronymWrapper_'+employeesInGrid['@objid']).observe('mouseout', function() { this.onDivMouseOut('toverdiv_'+employeesInGrid['@objid']); } .bind(this));
                        }
                }
            }// end Employee in Grid for
         
         }// end if result
         this.boxSchedules.unset(this._selectedEmployee.id);
     
    },
    
    onEmployeeUnselected: function(event) {
        this.onEmployeeSelected(event, true);
    },
    
    onEmployeeSelected: function(event, unselect) {
		    var employee = getArgs(event);
            this._selectedEmployee = employee;
           
            var _this = this;
            if(unselect==true){
		            if(!Object.isEmpty(_this.BoxGridTable.down('tr#PFM_BGridTable_'+employee.id))){
		                _this.BoxGridTable.down('tr#PFM_BGridTable_'+employee.id).hide();
		            }else if(!Object.isEmpty(_this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridTable_'+employee.id))){
		                 _this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridTable_'+employee.id).hide();
		                 errMissingCount= errMissingCount-1;
		                 if(errMissingCount==0){
		                        if(!Object.isEmpty(this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridDesc'))){
                                   this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridDesc').hide();
                             }
                		             
		                 }
    		             
		            }
		     }else{
		     if (this.PFM_mainDivGrid)
		            if(!Object.isEmpty(this.PFM_mainDivGrid.down('div#PFM_mainBoxGridTable'))){
                            if(!Object.isEmpty(_this.BoxGridTable.down('tr#PFM_BGridTable_'+employee.id))){
		                         _this.BoxGridTable.down('tr#PFM_BGridTable_'+employee.id).show();
		                    }
		                    else if(!Object.isEmpty(_this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridTable_'+employee.id))){
		                          errMissingCount= errMissingCount+1;
        	                      if(errMissingCount==1){
        	                        this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridDesc').show();
        	                      }
		                        _this.PFM_mainMissingGrid.down('div#PFM_mainMissingGridTable_'+employee.id).show();
		                    }
		                    else{
		                        this.getContentGrid(event);
		                    }
                       }
                    }// end else
    },
    
    getClickEmployeeInfo:function(pernrEmp, events){
            var xmlToShowContent =  "<EWS>"
                                    + "<SERVICE>"+this.getContentService+"</SERVICE>"
                                    + "<OBJECT TYPE='P'>"+pernrEmp+"</OBJECT>"
                                    + "<PARAM>"
                                    + "<APPID>"+appProfile+"</APPID>"
                                    + "<WID_SCREEN>1</WID_SCREEN>"
                                    + "</PARAM>"
                                    + "</EWS>";
            this.makeAJAXrequest($H({ xml: xmlToShowContent, successMethod: 'onMouseUpSelection' })); 
    },
    
    onMouseUpSelection: function(json){
	      var mode = 'display';
	      var auxDetail = new getContentModule({
                appId: appProfile,
                mode: 'display',
                json: json,
                showCancelButton: false,
                showButtons: $H({
                    edit: false,
                    display: false,
                    create: false
                })
           });
           
           
           this.onMouseUpSelection = new infoPopUp({
                closeButton: $H({
                    'textContent': 'Close',
                    'callBack': this.closePopUp.bind(this, true)
                }),
                htmlContent: auxDetail.getHtml(),
                indicatorIcon: 'information',
                width: 500,
                height: 800
            });
            this.onMouseUpSelection.create();
	      
	},
	
	closePopUp: function(fireEvent) {
            global.editingGetContent = null; //This way if a paiEvent is fired it won't try to open this
            if (!Object.isEmpty(this.onMouseUpSelection)) {
                this.onMouseUpSelection.close();
                delete this.onMouseUpSelection;
           }
    },
    
    getStyle:function (obj, styleProp){
          if (obj.currentStyle)
                return obj.currentStyle[styleProp];
          else if (window.getComputedStyle)
                return document.defaultView.getComputedStyle(obj,null).getPropertyValue(styleProp);
    },
         
    onDivMouseOver: function (id, obj) {
            document.getElementById(id).style.visibility = 'visible';
            var marginTop = 15;
            var curleft = 0;
              var curtop = obj.offsetHeight + 5;
              var border;
              var container = obj;
              if (obj.offsetParent)
              {
                do
                {
                  // XXX: If the element is position: relative we have to add borderWidth
                  if (this.getStyle(obj, 'position') == 'relative')
                  {
                    if (border = _pub.getStyle(obj, 'border-top-width')) curtop += parseInt(border);
                    if (border = _pub.getStyle(obj, 'border-left-width')) curleft += parseInt(border);
                  }
                  curleft += obj.offsetLeft;
                  curtop += obj.offsetTop;
                }
                while (obj = obj.offsetParent)
              }
              else if (obj.x)
              {
                curleft += obj.x;
                curtop += obj.y;
              }
              
             elOff = {
			    left: curleft + 'px',
			    top: curtop + 'px'
			};
			this.BoxGridTable.down('div#'+id).setStyle(elOff).setStyle({ zIndex: '100', position: 'absolute' });
     },

     onDivMouseOut: function (id)   {
           document.getElementById(id).style.visibility = 'hidden';
     },
     
     htmlFormatVerticalText: function(text){
        //insert tag <em></em> for each character
     auxText = "<ul><em class='XBG_Vertical'>";
        arrayText = text.toArray();
        for (i = 0; i < arrayText.length-1; i++) {
            auxText += arrayText[i] + "</em><em class='XBG_Vertical'>"
        }
        auxText += arrayText[arrayText.length-1]+'</em></ul>';
        return auxText;
     }  
});

