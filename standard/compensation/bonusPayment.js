var BonusPayment = Class.create(CompensationTab, {

    initialize: function($super, args) {
        $super(args, { 'obj_name': 'BonusPayment', 'COMP_CATEGORY': '2', 'SERVICE_NAME': 'COM_EMP_PLANS' });
    },

    run: function($super, args) {
        $super(args);
    },

    close: function($super, args) {
        $super();
        //document.stopObserving('EWS:compensation_empDetailSelected');
        /*
        document.stopObserving('EWS:compensationReviewPeriodSelected', this.compensationReviewPeriodSelectedBinding);
        document.stopObserving('EWS: compensationOrgUnitSelected', this.onOrgUnitSelectedBinding);
        document.stopObserving('EWS:compensation_updatedAmount', this.onAmountUpdatedBinding);        
        */
        document.stopObserving('EWS:compensation_empTableReady', this.onEmpTableReadyBinding);
        document.stopObserving('EWS:compensationExportToExcel', this.exportToExcelBinding);
        document.stopObserving('EWS:compensation_summaryTableReady', this.onOrgSummaryTableReadyBinding);
        document.stopObserving('EWS:compensation_hidebuttons', this.onHiddeButtonsBinding);
        this.firstRun = true;
    }

});