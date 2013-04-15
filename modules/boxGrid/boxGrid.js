/* 
* @fileoverview boxGrid.js
* @description This module implements the functionalities for creating a box grid.
*/

/**
* @constructor
* @description The box grid functionalities
*/
var boxGridModule = Class.create({
    /**
    * @description Initializes the class to build a table with the number of rows and columns introduced. Hoizontal and vertical
    * colour in header is added
    */
    initialize: function(target, numberOfRows, numberOfCols, tdId) {
                        
        var html = "<table>" +
                    "<tr>" +
                        "<td colspan='2' id='horizontalTitle' class='horizontalTitle'></td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td class='"+tdId+"' id='verticalTitle'></td>" +
                        "<td id='mainTable'>" +
                        "</td>" +
                    "</tr>" +
                    "</table>";
        $(target).insert(html);

        var tableHtml = "<table id='table' cellspacing='0' border='1' cellpadding='0' class='tableBoxGrid'>";
        for (var i = 0; i < numberOfRows; i++) {
            if (i == 0) {
                tableHtml += "<thead id='thead'>" +
                                "<tr id='row_" + i + "'>";
                for (var j = 0; j < numberOfCols; j++) {
                    tableHtml += "<th class='headerHorCellTable' id='row_" + i + "_col_" + j + "'>&nbsp;</th>";
                }
                tableHtml += "</tr></thead><tbody id='tbody'>";
            } else {
                tableHtml += "<tr id='row_" + i + "'>";
                for (var j = 0; j < numberOfCols; j++) {
                    if (j == 0) {
                        tableHtml += "<td class='headerVerCellTable' id='row_" + i + "_col_" + j + "'>&nbsp;</td>";
                    } else {
                        tableHtml += "<td class='gradient' id='row_" + i + "_col_" + j + "'>&nbsp;</td>";
                    }
                }
                tableHtml += "</tr>";
            }
        }
        tableHtml += "</tbody></table>";
        $(target).down('td#mainTable').insert(tableHtml);

    },

    /**
    * @description Method to set the horizontal title
    */
    setHorTitle: function(target, title) {
        var html = "<div class='horTitleLabel'>" + title + "</div>";
        $(target).down('td#horizontalTitle').update(html);
    },

    /**
    * @description Method to set the vertical title
    */
    setVerTitle: function(target, title) {
        $(target).down('td#verticalTitle').update(title);
//        $(target).down('div#textVerTitle').update(toVerticalString(title));
    },

    /**
    * @description Method to define header style(color)
    */
    setHeaderStyle: function(target, color) {
        var numberOfCols = $(target).down('tr#row_0').getElementsByTagName('th').length;
        var numberOfRows = $(target).down('[id=table]').rows.length;
        if (color != "") {
            for (var j = 0; j < numberOfCols; j++) {
                $(target).down('th#row_0_col_' + j).setStyle({
                    'background': color
                });
            }
            for (var j = 1; j < numberOfRows; j++) {
                $(target).down('td#row_' + j + '_col_0').setStyle({
                    'background': color
                });
            }
        }
    },

    /**
    * @description Method to define cell style(width, heigth)
    */
    setCellStyle: function(target, width, height, color, noBgColor) {
        var numberOfCols = $(target).down('tr#row_0').getElementsByTagName('th').length;
        var numberOfRows = $(target).down('[id=table]').rows.length;
        if (color == "") color = 'white';
        for (var i = 1; i < numberOfRows; i++) {
            for (var j = 1; j < numberOfCols; j++) {
                $(target).down('td#row_' + i + '_col_' + j).setStyle({
                            'background':color,
                            'width': width + 'px',
                            'height': height + 'px'
                 });
                 if(noBgColor=="X"){
                        $(target).down('td#row_' + i + '_col_' + j).style.background=''
                 }
            }
        }
    },

    /**
    * @description Method to fill a cell with a html structure
    */
    fillCell: function(target, html, row, col) {
        if ($(target).down('td#row_' + row + '_col_' + col))
            $(target).down('td#row_' + row + '_col_' + col).update(html);
    },
    /**
    * @description Method to remove the content of a cell, searching the cell by its position (row,column)
    */
    removeCell: function(target, row, col) {
        var html = "&nbsp;&nbsp;";
        if ($(target).down('td#row_' + row + '_col_' + col))
            $(target).down('td#row_' + row + '_col_' + col).update(html);
        else if ($(target).down('th#row_' + row + '_col_' + col))
            $(target).down('th#row_' + row + '_col_' + col).update(html);
    },
    /**
    * @description Method to remove the content of a cell, searching the cell by its content
    */
    removeCellByContent: function(target, idDiv) {
        if ($(target).down('div#' + idDiv)) {
            var cell = $(target).down('div#' + idDiv).up().identify();
            var row = cell.split('_')[1];
            var col = cell.split('_')[3];
            var html = "&nbsp;&nbsp;";
            $(target).down('td#row_' + row + '_col_' + col).update(html);
        }
    },
  
    /**
    * @description Method to add the horizontal header labels. Labels are read from a hash
    */
    horizontalHeader: function(target, headerHash) {
        var numberOfCols = $(target).down('tr#row_0').getElementsByTagName('th').length;
        if (headerHash.size() == numberOfCols - 1) {
            var header;
            for (var i = 1; i < numberOfCols; i++) {
                header = headerHash.get(i);
                if (header != "") {
                    $(target).down('th#row_0_col_' + i).update(header);
                }
            }
        }
    },
    /**
    * @description Method to add the vertical header labels. Labels are read from a hash
    * (description are inserted from second row)
    */
    verticalHeader: function(target, headerHash) {
        var numberOfRows = $(target).down('[id=table]').rows.length;
        if (headerHash.size() == numberOfRows - 1) {
            var header;
            for (var i = 1; i < numberOfRows; i++) {
                header = headerHash.get(i);
                if (header != "") {
                    $(target).down('td#row_' + i + '_col_0').update(header);
                }
            }
        }
    }
});



