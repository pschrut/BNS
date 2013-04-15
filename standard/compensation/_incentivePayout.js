var IncentivePayout = Class.create(Application, {


    initialize: function($super,options) {
        $super(options);
    },

    run: function($super,args) {
        $super(args);
        if (this.firstRun) {
            this.displayOrgSummary();
            this.displayWhiteSpace();
            this.displayEmployeeList();
            this.displayWhiteSpace();
            this.displayButtons();
        }
    },

    displayOrgSummary: function() {
        var html = '<div id="orgSummary"><table width="100%" cellspacing="1">' +
                        '<tr><td colspan="5"><span class="application_main_title">Purchasing Department</span></td></tr>' +
                        '<tr bgColor="#DCD2CE">' +
                            '<td></td><td colspan="2">EEs</td>' +
                            '<td colspan="3">EICP</td>' +
                            '<td colspan="3">MICP</td>' +
                            '<td colspan="3">SEIP</td>' +
                            //'<td></td><td></td>' + 
                        '</tr>' +
                        '<tr bgColor="#DCD2CE">' +
                            '<td>Name</td><td>all</td><td>ok</td>' +
                            '<td>Budget</td><td>Spent</td><td>Remaining</td>' +
                            '<td>Budget</td><td>Spent</td><td>Remaining</td>' +
                            '<td>Budget</td><td>Spent</td><td>Remaining</td>' +
                            //'<td>Actions</td><td>Status</td>' + 
                        '</tr>' +
                        this.getOrgRowHtml('table_rowodd', 'application_text_bolder', 'John Smith', '9', '$200,000', '$111,000', '7.5', '$89,000', '', '$10,000', '$15,250', '10.0', '$-5,520', 'eeColor01', '$0', '$0', '0', '$0', '', 'Submit') +
                        //this.getOrgRowHtml('table_rowodd', 'application_text_bolder', 'Purchases dept', '9', '$200,000', '$0', '7.5', '$0', '', '$10,000', '$0', '10.0', '$0', '', '$0', '$0', '0', '$0', '', '') +
                        //this.getOrgRowHtml('', 'application_action_link', 'Central purchases Dept', '5', '$50,000', '$17,200', '4.0', '$32,900', '', '$25,000', '$17,200', '4.0', '$7,800', '', '$25,000', '$47,300', '11.5', '$-22,300', 'eeColor01', 'Complete') +
                        //this.getOrgRowHtml('table_rowodd', 'application_action_link', 'Internal accounting', '4', '$25,000', '$13,650', '3.5', '$11,350', '', '$25,000', '$13,650', '3.5', '$11,350', '', '$25,000', '$7,020', '1.8', '$17,980', '', '') +
                    '</table></div>'; 
        //alert(html);
        this.virtualHtml.insert(html);    
    },
    
    getOrgRowHtml: function(odd, orgClass, name, emps, eicpTotal, eicpAmount, eicpPer, eicpRem, eicpColor, micpTotal, micpAmount, micpPer, micpRem, micpColor, seipTotal, seipAmount, seipPer, seipRem, seipColor, action) {
        var actionClass = '';
        if (eicpColor == '')
            eicpColor = 'application_color_eeColor09';
        if (micpColor == '')
            micpColor = 'application_color_eeColor09';
        if (seipColor == '')
            seipColor = 'application_color_eeColor09';
        if (action != 'Approved')
            actionClass = 'application_action_link';
        var html =  '<tr class="'+odd+'">' +
                        '<td class="'+orgClass+'">'+name+'</td><td>'+emps+'</td><td>'+emps+'</td>' +
                        '<td>'+eicpTotal+'</td><td>'+eicpAmount+'</td><td class="'+eicpColor+'">'+eicpRem+'</td>' +
                        '<td>'+micpTotal+'</td><td>'+micpAmount+'</td><td class="'+micpColor+'">'+micpRem+'</td>' +
                        '<td>'+seipTotal+'</td><td>'+seipAmount+'</td><td class="'+seipColor+'">'+seipRem+'</td>' +
                        //'<td class="application_action_link">'+action+'</td><td align="center"><table><tr><td class="application_courseGroup"></td></tr></table></td>' + 
                    '</tr>';
        return html;
    },
    
    displayWhiteSpace: function() {
        var html = '<div id="whiteSpace" class="compensation_space_div"/>';
        this.virtualHtml.insert(html);
    },
    
    displayEmployeeList: function() {
        var html = '<div id="employeeList"><table width="100%" cellspacing="1">' +
                        '<tr><td colspan="13"><table cellspacing="0"><tr><td class="application_main_title2">Employee list</td><td width="10px"></td><td class="application_action_link">Actions</td></tr></table></td>'+
                        '<td colspan="3" class="application_action_link">Export to excel</td>' +
                        '<td align="right"><div class="application_verticalR_arrow"/></td></tr>' +
                        '<tr bgColor="#DCD2CE">' +
                            '<td></td><td></td><td></td><td></td><td></td><td>Perf</td>' +
                            '<td></td><td nowrap="true">Base</td>' +
                            '<td colspan="2">Ini Payout</td>' + 
                            '<td nowrap="true">Final</td>' +
                            '<td colspan="1"></td>' +
                            '<td colspan="3">Discretionary</td>' +
                            '<td colspan="2">Total Payout</td>' +
                        '</tr>' +
                        '<tr bgColor="#DCD2CE">' +
                            '<td>Employee</td><td></td><td>Job title</td><td>Gr</td><td>Curr</td><td>Rate</td>' +
                            '<td>Plan</td><td>Salary</td>' +
                            '<td title="Calculated % of target">%</td><td>Amount</td>' +
                            '<td>Payout</td>' +
                            '<td>Company</td>' +
                            '<td>base</td><td>%</td><td>Amount</td>' +
                            '<td>%</td><td>Amount</td>' +
                            //'<td>PR</td>' +
                        '</tr>' +
                        this.getEmployeeRowHtml('', 'Hillary Dollar', 'Engineer', '1B', 'USD', '1.2', 'EICP', '$100,000', '20', '$20,000', '25', '$23,200', '80', '$19,200', '4,800', '120', '24,000', '103', '', '$5,000') +
                        this.getEmployeeRowHtml('table_rowodd', 'Julie Angela', 'Tech assistant', '1A', 'USD', '0.9', 'EICP', '$35,000', '20', '$7,000', '200', '$14,000', '75', '$10,500', '1,750', '50.0', '11,900', '85', '', '$3,500') +
                        this.getEmployeeRowHtml('', 'Joaquin Campos', 'Tech consultant', '2C', 'USD', '0.8', 'EICP', '$40,000', '25', '$10,000', '50', '$20,000', '75', '$15,000', '5,000', '100', '20,000', '100', '30', '$5,000') +
                        this.getEmployeeRowHtml('table_rowodd', 'Duchalet Lucie', 'Engineer', '1A', 'USD', '1.1', 'EICP', '$35,000', '30', '$10,500', '40', '$14,000', '0', '$0', '7,000', '50.0', '7,000', '50', '', '$14,000') +
                        this.getEmployeeRowHtml('', 'Fco Javier Gar', 'Consultant', '2A', 'USD', '0.9', 'EICP', '$60,000', '25', '$15,000', '50', '$30,000', '50', '$15,000', '6,000', '40.0', '21,000', '70', '80', '$9,000') +
                        this.getEmployeeRowHtml('table_rowodd', 'Dave Grohl', 'Supervisor', '1E', 'CAN', '1.0', 'EICP', '$80,000', '25', '$20,000', '25', '$20,000', '75', '$15,000', '4,000', '80.0', '19,000', '95', '', '$5,000') +
                        this.getEmployeeRowHtml('', 'Julius Parker', 'Engineer', '3B', 'USD', '0.9', 'EICP', '$60,000', '25', '$15,000', '60', '$36,000', '75', '$27,000', '3,600', '40.0', '30,600', '85', '', '$5,400') +
                        this.getEmployeeRowHtml('table_rowodd', 'Julie Angela', 'Tech assistant', '1A', 'USD', '0.9', 'MICP', '$50,000', '25', '$12,500', '25', '$12,500', '70', '$8,750', '1,875', '50.0', '10,625', '85', '', '$3,750') +
                        this.getEmployeeRowHtml('', 'Fco Javier Gar', 'Consultant', '2A', 'USD', '0.9', 'MICP', '$40,000', '25', '$10,000', '10', '$4,000', '75', '$3,000', '1,000', '100', '4,000', '100', '', '$1,000') +
                        
                        // Uncomment following 5 lines to simluate drill down functionality
                        //this.getEmployeeRowHtml('', 'Marie Pierce', 'Engineer', '1A', 'USD', '1.1', '$87,000', '0.74', '$88,740', '2.0', '1.05', '4.0', '1,800', '2.0', '1,500', '0', '0.0') +
                        //this.getEmployeeRowHtml('table_rowodd', 'Andres Gomez', 'Tech consultant', '2C', 'USD', '0.8', '$66,500', '0.56', '$67,165', '1.0', '0.80', '4.0', '1,800', '1.0', '0', '0', '0.0') +
                        //this.getEmployeeRowHtml('', 'Lisa Davenport', 'Consultant', '2A', 'USD', '0.9', '$77,000', '0.97', '$80,850', '5.0', '1.04', '4.0', '2,310', '3.0', '2,500', '1,540', '2.0') +
                        //this.getEmployeeRowHtml('table_rowodd', 'Claudio Coello', 'Supervisor', '1E', 'CAN', '1.0', '$89,000', '0.90', '$92,560', '4.0', '1.05', '4.0', '3,560', '4.0', '2,300', '0', '0.0') +
                        //this.getEmployeeRowHtml('', 'Theresa Robs', 'Engineer', '3B', 'USD', '0.9', '$83,400', '0.86', '$85,068', '1.0', '1.27', '4.0', '1,668', '1.0', '1,700', '10,000', '11.0') +
                    '</table></div>';
        this.virtualHtml.insert(html);
    },
    
    getEmployeeRowHtml: function(rowClass, name, title, grad, curr, perf, plan, calcBase, perTO, targetOpp, perCP, calcPay, perND, nonDisc, disc, perDisc, total, perTotal, proRated, disp) {
        var discClass = 'fieldDisplayer_input';
        var calcClass = '';
        var calcAlt = 'Target Opp: ' + targetOpp + ' (' + perTO + '%)';
        var proRAlt = '';
        /*if (perTO < perCP)
        {
            calcClass = 'eeColor10';
            calcAlt = ' Calculated payout is bigger than original \n' + calcAlt; 
        }
        else if (perTO > perCP)
        {
            calcClass = 'eeColor13';
            calcAlt = ' Calculated payout is smaller than original \n' + calcAlt; 
        }*/
        proRated = '';
        if (proRated != '')
        {
            proRAlt = 'The final amount has been prorated for this employee. Whole year equivalent would be $' + total;  
            total = (parseInt(total.replace(/,/,'')) * (parseInt(proRated)) / 100);
            var strTotal = total.toString();
            total = '';
            while (strTotal.length > 3)
            {
                total = strTotal.substr(strTotal.length-3) + ',' + total;
                strTotal = strTotal.substr(0, strTotal.length-3);
            }
            total = (strTotal + ',' + total);
            total = total.substr(0, total.length-1);
            
        }
        //perDisc = '';
        //disc = '';
        //perTotal = '';
        //total = '';
        var html =  '<tr class="'+rowClass+'">' +
                        '<td class="application_action_link">'+name+'</td><td class="compensation_stickyNote_img"></td><td>'+title+'</td><td>'+grad+'</td><td>'+curr+'</td><td>'+perf+'</td>' +
                        '<td>'+plan+'</td><td class="amount">'+calcBase+'</td>' +
                        '<td>'+perTO+'</td><td>'+targetOpp+'</td>' +
                        //'<td class="'+calcClass+'" title="'+calcAlt+'">'+perCP+'</td><td class="'+calcClass+'" title="'+calcAlt+'">'+calcPay+'</td>' +
                        '<td class="'+calcClass+'" title="'+calcAlt+'">'+calcPay+'</td>' +
                        '<td title="75% of bonus defined by company. Initial amount $7,500. Final amount $15,000 due to company financial results">'+nonDisc+'</td>' +
                        '<td title="25% of bonus reserved for input. Initial amount $2,500. Final available amount $5,000 due to company financial results">'+disp+'</td><td><input class="'+discClass+'" size="2" value="'+perDisc+'"/></td><td><input class="'+discClass+'" size="3" value="'+disc+'"/></td>' +
                        '<td>'+perTotal+'</td><td title="'+proRAlt+'">$'+total+'</td>' +
                        //'<td>'+proRated+'</td>' +
                    '</tr>';
        return html;
    },

    close: function($super,args) {
        $super(args);
    }

});