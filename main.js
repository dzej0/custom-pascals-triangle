var defaultCellColor = "hsl(240, 20%, 15%)";
var gridDisplay = document.querySelector("div#grid");
var refreshButton = document.querySelector("button#refresh-button");
var clearValuesButton = document.querySelector("button#clear-button");
var rulesetSelector = document.querySelector("select#ruleset");
var columnInput = document.querySelector("input#input-columns");
var rowInput = document.querySelector("input#input-rows");
var colorsInput = document.querySelector("input#input-colors");
var hueMinInput = document.querySelector("input#input-hue-range-min");
var hueMaxInput = document.querySelector("input#input-hue-range-max");
function getRulesetFunc() {
    switch (rulesetSelector === null || rulesetSelector === void 0 ? void 0 : rulesetSelector.value) {
        case "add":
            return function (l, r) { return l + r; };
        case "multiply":
            return function (l, r) { return l * r; };
        case "multiply2":
            return function (l, r) { return l * r * (-1); };
        case "subtractLR":
            return function (l, r) { return l - r; };
        case "subtractRL":
            return function (l, r) { return r - l; };
        default:
            console.warn("Invalid ruleset");
            return function (l, r) { return 0; };
    }
}
// entirely static class
var Grid = /** @class */ (function () {
    function Grid() {
    }
    Grid.getRows = function () {
        return this.grid.length;
    };
    Grid.getColumns = function (oddRow) {
        return this.grid[0].length - ((oddRow) ? 1 : 0);
    };
    Grid.getColumnsFromRowNumber = function (rowNumber) {
        return this.getColumns((rowNumber % 2 == 1) ? true : false);
    };
    Grid.outOfBounds = function (coords) {
        return coords.row < 0 || coords.row > this.getRows() - 1 || coords.column < 0 || coords.column > this.getColumnsFromRowNumber(coords.row) - 1;
    };
    Grid.getCellValue = function (coords) {
        if (this.outOfBounds(coords)) {
            return 0;
        }
        return this.grid[coords.row][coords.column];
    };
    Grid.setCellValue = function (coords, value) {
        if (this.outOfBounds(coords)) {
            return;
        }
        this.grid[coords.row][coords.column] = value;
    };
    /**
     * fill the internal grid with zeros
     * @param columns the number of cells in (2n)th rows (rows with an even index, like the topmost row).
     * In (2n-1)th rows (odd index), the number of cells is columns-1
    */
    Grid.generateGrid = function (columns, rows) {
        this.grid = new Array(rows);
        //console.log("rows amount: " + this.grid.length)
        for (var r = 0; r < rows; r++) {
            // create alternating row lengths
            var rowLength = void 0;
            if (r % 2 == 0) {
                rowLength = columns;
            }
            else {
                rowLength = columns - 1;
            }
            this.grid[r] = new Array(rowLength);
            //console.log("columns in row " + r + ": " + this.grid[r].length)
            for (var c = 0; c < rowLength; c++) {
                this.setCellValue(new Coordinates(c, r), 0);
            }
        }
    };
    Grid.calculate = function (rulesetFunction) {
        console.log("Running calculation...");
        for (var r = 1; r < this.getRows(); r++) {
            for (var c = 0; c < this.getColumnsFromRowNumber(r); c++) {
                var valL = this.getCellValue(new Coordinates(c, r).getCoordsUpLeft());
                var valR = this.getCellValue(new Coordinates(c, r).getCoordsUpRight());
                var res = rulesetFunction()(valL, valR);
                this.setCellValue(new Coordinates(c, r), res);
                //console.log(`set internal value at [${c}, ${r}] to: ` + res)
            }
        }
    };
    Grid.clearValues = function () {
        for (var r = 0; r < this.getRows(); r++) {
            for (var c = 0; c < this.getColumnsFromRowNumber(r); c++) {
                this.grid[r][c] = 0;
            }
        }
    };
    Grid.consoleLogGrid = function () {
        var res = "Grid:\n";
        this.grid.forEach(function (row_) {
            row_.forEach(function (col_) {
                res += col_.toString() + ", ";
            });
            res += "\n";
        });
        console.log(res);
    };
    return Grid;
}());
var Coordinates = /** @class */ (function () {
    function Coordinates(column_, row_) {
        this.column = column_;
        this.row = row_;
    }
    Coordinates.prototype.getCoordsUpLeft = function () {
        if (this.row % 2) {
            // odd row number (row with margin)
            return new Coordinates(this.column, this.row - 1);
        }
        else {
            // even row number (row without margin)
            return new Coordinates(this.column - 1, this.row - 1);
        }
    };
    Coordinates.prototype.getCoordsUpRight = function () {
        if (this.row % 2) {
            // odd row number (row with margin)
            return new Coordinates(this.column + 1, this.row - 1);
        }
        else {
            // even row number (row without margin)
            return new Coordinates(this.column, this.row - 1);
        }
    };
    Coordinates.prototype.isEqual = function (c) {
        return (this.column == c.column && this.row == c.row);
    };
    return Coordinates;
}());
function updateDisplay() {
    removeGrid();
    console.log("Generating display... size: ".concat(Grid.getColumns(false), "x").concat(Grid.getRows()));
    for (var r = 0; r < Grid.getRows(); r++) {
        var rowDiv = document.createElement("div");
        if (r % 2) {
            rowDiv.style.setProperty("margin-left", "35px");
        }
        for (var c = 0; c < Grid.getColumnsFromRowNumber(r); c++) {
            var cell = document.createElement("input");
            if (r == 0) {
                // special instructions for creating the first row, where the user can type in values
                cell.disabled = false;
                cell.style.border = "1px solid aliceblue";
            }
            else {
                cell.disabled = true;
            }
            cell.dataset.col = c.toString();
            cell.dataset.row = r.toString();
            cell.title = "column: ".concat(c, ", row: ").concat(r);
            cell.type = "text";
            cell.value = Grid.getCellValue(new Coordinates(c, r)).toString();
            rowDiv.appendChild(cell);
        }
        rowDiv.style.setProperty("white-space", "nowrap");
        rowDiv.id = "r".concat(r);
        if (gridDisplay != null)
            gridDisplay.appendChild(rowDiv);
    }
}
function removeGrid() {
    console.log("Removing display...");
    if (gridDisplay != null)
        gridDisplay.innerHTML = "";
}
function readUserInputs() {
    console.log("Reading user inputs...");
    gridDisplay === null || gridDisplay === void 0 ? void 0 : gridDisplay.querySelectorAll("input").forEach(function (cell) {
        if (cell.dataset.row == "0") {
            var col = cell.dataset.col;
            if (col != null) {
                Grid.setCellValue(new Coordinates(parseInt(col), 0), parseFloat(cell.value));
                //console.log(`x:${col} set to: ${parseFloat(cell.value)}`)
            }
        }
    });
}
// map function to turn a wide range of values into a small range of colors (lerp)
function mapValue(value, minValue, maxValue, minOutput, maxOutput) {
    return minOutput + (maxOutput - minOutput) * (value - minValue) / (maxValue - minValue);
}
function colorCells() {
    if (!(colorsInput === null || colorsInput === void 0 ? void 0 : colorsInput.checked)) {
        gridDisplay === null || gridDisplay === void 0 ? void 0 : gridDisplay.querySelectorAll("input").forEach(function (cell) {
            cell.style.backgroundColor = defaultCellColor;
        });
        return;
    }
    var hueMin_ = hueMinInput === null || hueMinInput === void 0 ? void 0 : hueMinInput.value;
    var hueMax_ = hueMaxInput === null || hueMaxInput === void 0 ? void 0 : hueMaxInput.value;
    var max = 0;
    var min = 0;
    var cells = gridDisplay === null || gridDisplay === void 0 ? void 0 : gridDisplay.querySelectorAll("input");
    if (cells == null)
        return;
    for (var i = 0; i < (cells === null || cells === void 0 ? void 0 : cells.length); i++) {
        var cell = cells[i];
        var value = parseFloat(cell.value);
        if (i == 0) {
            max = value;
            min = value;
            continue;
        }
        if (value > max) {
            max = value;
        }
        if (value < min) {
            min = parseFloat(cell.value);
        }
    }
    console.log("max value: " + max);
    console.log("min value: " + min);
    // map values to custom color gradient
    for (var i = 0; i < (cells === null || cells === void 0 ? void 0 : cells.length); i++) {
        var cell = cells[i];
        var value = parseFloat(cell.value);
        // map to something larger than 0 so that logarithms can handle it
        var positiveMappedValue = mapValue(value, min, max, 1 / 1000, 1000);
        //console.log(`turned ${value} into ${positiveMappedValue}`)
        var loggedValue = Math.log10(positiveMappedValue);
        var hue = mapValue(loggedValue, Math.log10(1 / 1000), Math.log10(1000), hueMin_, hueMax_);
        hue = Math.round(hue);
        cell.style.backgroundColor = "hsl(".concat(hue, ", 80%, 30%)");
        //console.log(`setting hue value to: ${hue}`);
        if (value == 0) {
            cell.style.backgroundColor = "hsl(".concat(hue, ", 80%, 20%)");
        }
    }
}
function clearGrid() {
    Grid.clearValues();
    updateDisplay();
}
clearValuesButton === null || clearValuesButton === void 0 ? void 0 : clearValuesButton.addEventListener("click", function () {
    clearGrid();
});
colorsInput === null || colorsInput === void 0 ? void 0 : colorsInput.addEventListener("click", function () {
    colorCells();
});
document.addEventListener("keydown", function (key) {
    if (key.key == "Escape") {
        clearValuesButton === null || clearValuesButton === void 0 ? void 0 : clearValuesButton.click();
        clearValuesButton.style.backgroundColor = "hsl(5, 100%, 35%)";
    }
    if (key.key == "Enter") {
        refreshButton === null || refreshButton === void 0 ? void 0 : refreshButton.click();
        refreshButton.style.backgroundColor = "hsl(93, 100%, 20%)";
    }
});
document.addEventListener("keyup", function (key) {
    if (key.key == "Escape") {
        clearValuesButton.style.backgroundColor = "hsl(5, 100%, 75%)";
    }
    if (key.key == "Enter") {
        refreshButton.style.backgroundColor = "hsl(93, 100%, 75%)";
    }
});
function getUserInput_GridSize() {
    var columns = columnInput === null || columnInput === void 0 ? void 0 : columnInput.valueAsNumber;
    var rows = rowInput === null || rowInput === void 0 ? void 0 : rowInput.valueAsNumber;
    if (columns != null && rows != null) {
        return new Coordinates(columns, rows);
    }
    else {
        // this will never be returned, unless the grid size input fields dont exist for some reason
        return new Coordinates(-1, -1);
    }
}
var oldGridSize;
/**
 * makes a new internal grid and updates the display
 */
function generateNewGrid() {
    var size = getUserInput_GridSize();
    oldGridSize = size;
    console.log("generating a ".concat(size.column, "x").concat(size.row, " grid"));
    Grid.generateGrid(size.column, size.row);
    console.log("grid has ".concat(Grid.getRows(), " rows"));
    updateDisplay();
}
function initGrid() {
    generateNewGrid();
}
function refresh() {
    // if columns/rows amount changed, generate a new empty grid
    if (!(oldGridSize.isEqual(getUserInput_GridSize()))) {
        console.log("grid size changed, from ".concat(oldGridSize.column, "x").concat(oldGridSize.row, " \n            to ").concat(getUserInput_GridSize().column, "x").concat(getUserInput_GridSize().row));
        initGrid();
        console.log("generated a grid, size ".concat(Grid.getColumns(false), "x").concat(Grid.getRows()));
    }
    readUserInputs();
    Grid.calculate(getRulesetFunc);
    console.log("finished calculating");
    updateDisplay();
    colorCells();
}
document.addEventListener("DOMContentLoaded", function () {
    initGrid();
});
refreshButton === null || refreshButton === void 0 ? void 0 : refreshButton.addEventListener("click", function () {
    refresh();
});
