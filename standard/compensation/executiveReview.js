var ExecutiveReview = Class.create(CompensationTab, {

    initialize: function($super, args) {
    $super("ExecutiveReview", { 'obj_name': 'ExecutiveReview', 'COMP_CATEGORY': '5', 'SERVICE_NAME': 'COM_EMP_LIST' });
    },

    run: function($super, args) {
        $super(args);
    },

    close: function($super, args) {
        $super(args);
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
    }
 
});