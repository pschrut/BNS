/*
 *@fileoverview drawTree.js
 *@desc drawTree handler class implemented here, a component to draw a tree between some divs
 */

/*
 *@class drawTree
 *@desc this class represents the drawTree handler
 */
var drawTree = Class.create({
    /*
    *@method initialize
    *@param divs {Hash} keeps the divs that we want to join
    *@desc creates every lines between divs to create a tree
    */
    initialize: function(divs, frame) {
        var line = new jsGraphics(frame);
        this.stroke = 2;
        line.setColor("#000000");
        line.setStroke(this.stroke);
        this.line = line;
        this.divs = divs;
        this.frame = frame;
        this.draw(divs);
    },

    draw: function(divs) {
        this.line.clear();
        var key = divs.keys()[0];
        var parent = divs.get(key).parent;
        var parentPosition = $(parent).positionedOffset();
        var parentHeight = $(parent).getHeight();
        var width = $(parent).getWidth();
        var staff = divs.get(key).staff;
        var sons = divs.get(key).sons;
        var margin = 15;

        if ((staff.length != 0) || (sons.length != 0)) {
            if (staff.length != 0) {
                var down = 0;
                for (var i = 0; i < staff.length; i++) {
                    var staffHeight = $(staff[i]).getHeight();
                    var staffPosition = $(staff[i]).positionedOffset();
                    var downStaff = staffPosition.top;
                    if (downStaff > down) {
                        down = downStaff + staffHeight / 2;
                    }
                    if (staffPosition[0] < parentPosition[0] + width / 2) this.line.drawLine(parentPosition[0] + width / 2, staffPosition[1] + staffHeight / 2, staffPosition[0] + width, staffPosition[1] + staffHeight / 2);
                    else this.line.drawLine(parentPosition[0] + width / 2, staffPosition[1] + staffHeight / 2, staffPosition[0] - this.stroke, staffPosition[1] + staffHeight / 2);
                }
            }
            if (sons.length != 0) {
                var rigth = 0;
                var left = $(this.frame).getWidth();
                var up = $(sons[0]).positionedOffset().top;
                for (var i = 0; i < sons.length; i++) {
                    var positionVer = $(sons[i]).positionedOffset().top;
                    var positionHor = $(sons[i]).positionedOffset().left;
                    if (positionVer < up) {
                        up = positionVer;
                    }
                    if (positionHor > rigth) {
                        rigth = positionHor;
                    }
                    if (positionHor < left) {
                        left = positionHor;
                    }
                }

                this.line.drawLine(left + width / 2, up - margin, rigth + width / 2, up - margin);
                this.line.drawLine(parentPosition.left + width / 2, parentPosition.top + parentHeight, parentPosition.left + width / 2, up - margin);

                for (var i = 0; i < sons.length; i++) {
                    var hor = $(sons[i]).positionedOffset().left + width / 2;
                    var ver = $(sons[i]).positionedOffset().top;
                    this.line.drawLine(hor, up - margin, hor, ver - this.stroke);
                }
            }
            else {
                this.line.drawLine(parentPosition.left + width / 2, parentPosition.top + parentHeight, parentPosition.left + width / 2, down);
            }
            this.line.paint();
        }
    },

    refresh: function() {
        this.draw(this.divs);
    }
});    
    	
	
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */	
