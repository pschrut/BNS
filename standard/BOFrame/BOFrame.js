
var frame_standard = Class.create(origin,
{
    initialize: function($super, virtualHtml, hashOfWidgets, appId, firstRun) {
        $super();
        this.virtualHtml = virtualHtml;
        this.firstRun = firstRun;
        this.hashOfWidgets = hashOfWidgets
        this._widget = this.hashOfWidgets.get(appId);
        this.appid = appId;
        this.fillFrame();
    },
    fillFrame: function() {

        if (this.firstRun) {

            var div = new Element('div');
            div.setStyle({ 'float': 'left', 'width': '100%', 'height': '250px', 'overflow': 'hidden' });

            var the_length = this.appid.length;
            var last_char = this.appid.charAt(the_length - 1);


            switch (last_char) {

                case '1':
                    div.update("<iframe scrolling='yes' border='no' marginwidth='0' marginheight='0' style='border:0px;overflow:hidden' width='100%' height='100%' src='http://www.ramondino.com/nga/ews/bo/Competence%20gaps.swf'/>");
                    break;
                case '2':
                    div.update("<iframe scrolling='yes' border='no' marginwidth='0' marginheight='0' style='border:0px;overflow:hidden' width='100%' height='100%' src='http://www.ramondino.com/nga/ews/bo/PMP_SS.swf'/>");
                    break;
                case '3':
                    div.update("<iframe scrolling='yes' border='no' marginwidth='0' marginheight='0' style='border:0px;overflow:hidden' width='100%' height='100%' src='http://www.ramondino.com/nga/ews/bo/Headcount_SS.swf'/>");
                    break;
                case '4':
                    div.update("<iframe scrolling='yes' border='no' marginwidth='0' marginheight='0' style='border:0px;overflow:hidden' width='100%' height='100%' src='http://www.ramondino.com/nga/ews/bo/sigma.swf'/>");
                    break;
                case '5':
                    div.update("<iframe scrolling='yes' border='no' marginwidth='0' marginheight='0' style='border:0px;overflow:hidden' width='100%' height='100%' src='http://www.ramondino.com/nga/ews/bo/hr_termination.swf'/>");
                    break;
                case '6':
                    div.update("<iframe scrolling='yes' border='no' marginwidth='0' marginheight='0' style='border:0px;overflow:hidden' width='100%' height='100%' src='http://www.ramondino.com/nga/ews/bo/performance_benchmarking.swf'/>");
                    break;
                case '7':
                    div.update("<iframe scrolling='yes' border='no' marginwidth='0' marginheight='0' style='border:0px;overflow:hidden' width='100%' height='100%' src='http://www.ramondino.com/nga/ews/bo/unemployment_trends.swf'/>");
                    break;
                case '8':
                    div.update("<iframe scrolling='yes' border='no' marginwidth='0' marginheight='0' style='border:0px;overflow:hidden' width='100%' height='100%' src='http://www.ramondino.com/nga/ews/bo/housing_sales_trends.swf'/>");
                    break;
                case '9':
                    div.update("<iframe scrolling='yes' border='no' marginwidth='0' marginheight='0' style='border:0px;overflow:hidden' width='100%' height='100%' src='http://www.ramondino.com/nga/ews/bo/College_Costs_Calculator_Present.swf'/>");
                    break;
                default:
                    div.update("<iframe scrolling='yes' border='no' marginwidth='0' marginheight='0' style='border:0px;overflow:hidden' width='100%' height='100%' src='http://www.ramondino.com/nga/ews/bo/compensation_analysis.swf'/>");
                    break;
            }

            this._widget.setContent(div);
            //this.virtualHtml.insert(div);
            //this.virtualHtml.insert("<div style='clear:both'>&nbsp;</div>"); 

        }
    },
    close: function($super) {
        $super();
    }
});

/*var frame = Class.create(frame_standard , {
    initialize: function($super) {
        $super('frame');
    },
    run: function($super) {
        $super();
    },
    close: function($super) {
        $super();
    }
});*/