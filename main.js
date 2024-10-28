/**
 * todolist
 *
 * zmieniajace wielkosc komorki aby dopasowac sie do liczby w srodku
 *
 * polaczyc przyciski refresh z update grid size V
 * przyciski zeby uzytkownik mogl ustawic dowolna liczbe kolumn i wierszy V
 * rulesety V
 * kolory V
 */
var grid = document.getElementById("grid");
var refreshButton = document.getElementById("refresh-button");
var clearValuesButton = document.getElementById("clear-button");
var ruleset = document.querySelector("select#ruleset");
var columnInput = document.querySelector("input#input-columns");
var rowInput = document.querySelector("input#input-rows");
var colorsInput = document.querySelector("input#input-colors");
var hueMin = document.querySelector("input#input-hue-range-min");
var hueMax = document.querySelector("input#input-hue-range-max");
var currentGridSize = { "col": 0, "row": 0 };
//#region coordinates
function getCell(col, row) {
    var _a;
    if (document.getElementById("r".concat(row)) != null) {
        var elements = (_a = document.getElementById("r".concat(row))) === null || _a === void 0 ? void 0 : _a.querySelectorAll("input");
        if (elements != null) {
            for (var i = 0; i < (elements === null || elements === void 0 ? void 0 : elements.length); i++) {
                var col_ = elements[i].getAttribute("data-col");
                if (col_ != null && parseInt(col_) == col) {
                    return elements[i];
                }
            }
        }
        return null;
    }
    else {
        return null;
    }
}
function getCellUpLeft(col, row) {
    if (row % 2) {
        // odd row number (row with margin)
        return getCell(col, row - 1);
    }
    else {
        // even row number (row without margin)
        return getCell(col - 1, row - 1);
    }
}
function getCellUpRight(col, row) {
    if (row % 2) {
        // odd row number (row with margin)
        return getCell(col + 1, row - 1);
    }
    else {
        // even row number (row without margin)
        return getCell(col, row - 1);
    }
}
//#endregion
//#region simple grid operations
function generateGrid(col, row) {
    removeGrid();
    for (var r = 0; r < row; r++) {
        var rowDiv = document.createElement("div");
        if (r % 2) {
            rowDiv.style.setProperty("margin-left", "35px");
        }
        // create alternating row lengths
        var rowLength = void 0;
        if (r % 2 == 0) {
            rowLength = col + 1;
        }
        else {
            rowLength = col;
        }
        for (var c = 0; c < rowLength; c++) {
            var cell = document.createElement("input");
            if (r == 0) {
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
            cell.value = "0";
            rowDiv.appendChild(cell);
        }
        rowDiv.style.setProperty("white-space", "nowrap");
        rowDiv.id = "r".concat(r);
        if (grid != null)
            grid.appendChild(rowDiv);
    }
}
function removeGrid() {
    if (grid != null)
        grid.innerHTML = "";
}
function clearGrid() {
    grid === null || grid === void 0 ? void 0 : grid.querySelectorAll("input").forEach(function (cell) {
        cell.value = "0";
        cell.style.backgroundColor = "hsl(240, 20%, 15%)";
    });
}
//#endregion
// map function to turn a wide range of values into a small range of colors
function mapValue(value, minValue, maxValue, minOutput, maxOutput) {
    return minOutput + (maxOutput - minOutput) * (value - minValue) / (maxValue - minValue);
}
function recalculateColors() {
    if (!(colorsInput === null || colorsInput === void 0 ? void 0 : colorsInput.checked)) {
        grid === null || grid === void 0 ? void 0 : grid.querySelectorAll("input").forEach(function (cell) {
            cell.style.backgroundColor = "hsl(240, 20%, 15%)";
        });
        return;
    }
    var hueMin_ = hueMin === null || hueMin === void 0 ? void 0 : hueMin.value;
    var hueMax_ = hueMax === null || hueMax === void 0 ? void 0 : hueMax.value;
    var max = 0;
    var min = 0;
    var cells = grid === null || grid === void 0 ? void 0 : grid.querySelectorAll("input");
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
        console.log("setting hue value to: ".concat(hue));
        if (value == 0) {
            cell.style.backgroundColor = "hsl(".concat(hue, ", 80%, 20%)");
        }
    }
}
function getRulesetFunc() {
    switch (ruleset === null || ruleset === void 0 ? void 0 : ruleset.value) {
        case "add":
            return function (x, y) { return x + y; };
        case "multiply":
            return function (x, y) { return x * y; };
        case "multiply2":
            return function (x, y) { return x * y * (-1); };
        default:
            console.warn("Invalid ruleset");
            return function (x, y) { return 0; };
    }
}
function recalculate() {
    grid === null || grid === void 0 ? void 0 : grid.querySelectorAll("input").forEach(function (cell) {
        var _a, _b;
        //console.log(`calculating cell at ${cell.getAttribute("data-row")}, ${cell.getAttribute("data-col")}`)
        if (cell.hasAttribute("data-row") && cell.hasAttribute("data-col")) {
            // get cells above on the left and right
            var cellRow = cell.getAttribute("data-row");
            var cellCol = cell.getAttribute("data-col");
            var cellRowN = void 0, cellColN = void 0; // cell coordinates as numbers
            if (cellCol != null) {
                cellColN = parseInt(cellCol);
            }
            if (cellRow != null) {
                cellRowN = parseInt(cellRow);
            }
            var valL = (_a = getCellUpLeft(cellColN, cellRowN)) === null || _a === void 0 ? void 0 : _a.value;
            var valR = (_b = getCellUpRight(cellColN, cellRowN)) === null || _b === void 0 ? void 0 : _b.value;
            if (valL != null && valR != null) {
                cell.value = getRulesetFunc()(parseFloat(valL), parseFloat(valR)).toString();
            }
        }
    });
}
refreshButton === null || refreshButton === void 0 ? void 0 : refreshButton.addEventListener("click", function () {
    if (currentGridSize.col != (columnInput === null || columnInput === void 0 ? void 0 : columnInput.valueAsNumber) || currentGridSize.row != (rowInput === null || rowInput === void 0 ? void 0 : rowInput.valueAsNumber)) {
        if ((columnInput === null || columnInput === void 0 ? void 0 : columnInput.valueAsNumber) != undefined && (rowInput === null || rowInput === void 0 ? void 0 : rowInput.valueAsNumber) != undefined) {
            generateGrid(columnInput === null || columnInput === void 0 ? void 0 : columnInput.valueAsNumber, rowInput === null || rowInput === void 0 ? void 0 : rowInput.valueAsNumber);
        }
    }
    recalculate();
    recalculateColors();
    if (columnInput != null && rowInput != null) {
        currentGridSize.col = columnInput.valueAsNumber;
        currentGridSize.row = rowInput.valueAsNumber;
    }
});
clearValuesButton === null || clearValuesButton === void 0 ? void 0 : clearValuesButton.addEventListener("click", function () {
    clearGrid();
});
colorsInput === null || colorsInput === void 0 ? void 0 : colorsInput.addEventListener("click", function () {
    recalculateColors();
});
document.addEventListener("DOMContentLoaded", function () {
    refreshButton === null || refreshButton === void 0 ? void 0 : refreshButton.click();
});
document.addEventListener("keydown", function (key) {
    if (key.key == "Escape") {
        clearValuesButton === null || clearValuesButton === void 0 ? void 0 : clearValuesButton.click();
    }
    if (key.key == "Enter") {
        refreshButton === null || refreshButton === void 0 ? void 0 : refreshButton.click();
    }
});
