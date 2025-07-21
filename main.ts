declare interface Math {
    log10(x: number): number;
}

const defaultCellColor : string = "hsl(240, 20%, 15%)";

let gridDisplay: HTMLDivElement | null = document.querySelector("div#grid")
let refreshButton: HTMLButtonElement | null = document.querySelector("button#refresh-button")
let clearValuesButton: HTMLButtonElement | null = document.querySelector("button#clear-button")

let rulesetSelector: HTMLSelectElement | null = document.querySelector("select#ruleset")

let columnInput: HTMLInputElement | null = document.querySelector("input#input-columns")
let rowInput: HTMLInputElement | null = document.querySelector("input#input-rows")

let colorsInput: HTMLInputElement | null = document.querySelector("input#input-colors")

let hueMinInput: HTMLInputElement | null = document.querySelector("input#input-hue-range-min")
let hueMaxInput: HTMLInputElement | null = document.querySelector("input#input-hue-range-max")

function getRulesetFunc() : Function {
    switch (rulesetSelector?.value) {
        case "add":
            return (l: number,r: number) => l+r
        case "multiply":
            return (l: number,r: number) => l*r
        case "multiply2":
            return (l: number,r: number) => l*r*(-1)
        case "subtractLR":
            return (l: number,r: number) => l-r
        case "subtractRL":
            return (l: number,r: number) => r-l
        default:
            console.warn("Invalid ruleset")
            return (l: number,r: number) => 0
    }
}

// entirely static class
class Grid {
    public static grid: number[][];

    public static getRows() : number {
        return this.grid.length
    }

    public static getColumns(oddRow : boolean) : number {
        return this.grid[0].length - ((oddRow) ? 1 : 0)
    }

    public static getColumnsFromRowNumber(rowNumber : number) {
        return this.getColumns((rowNumber%2 == 1) ? true : false)
    }

    public static outOfBounds(coords : Coordinates) : boolean {
        return coords.row < 0 || coords.row > this.getRows() - 1 || coords.column < 0 || coords.column > this.getColumnsFromRowNumber(coords.row) - 1
    }

    public static getCellValue(coords : Coordinates) : number {
        if (this.outOfBounds(coords)) {
            return 0
        }
        return this.grid[coords.row][coords.column];
    }

    public static setCellValue(coords : Coordinates, value : number) : void {
        if (this.outOfBounds(coords)) {
            return
        }
        this.grid[coords.row][coords.column] = value;
    }

    /**
     * fill the internal grid with zeros
     * @param columns the number of cells in (2n)th rows (rows with an even index, like the topmost row).  
     * In (2n-1)th rows (odd index), the number of cells is columns-1
    */
    public static generateGrid(columns : number, rows : number) : void {
        this.grid = new Array<Array<number>>(rows);
        
        //console.log("rows amount: " + this.grid.length)
        for (let r = 0; r < rows; r++) {
            // create alternating row lengths
            let rowLength: number
            if (r%2 == 0) {
                rowLength = columns
            } else {
                rowLength = columns - 1
            }

            this.grid[r] = new Array<number>(rowLength)
            //console.log("columns in row " + r + ": " + this.grid[r].length)
            for (let c = 0; c < rowLength; c++) {
                this.setCellValue(new Coordinates(c, r), 0)
            }
        }
    }

    public static calculate(rulesetFunction : Function) : void {
        console.log("Running calculation...")
        for (let r = 1; r < this.getRows(); r++) {
            for (let c = 0; c < this.getColumnsFromRowNumber(r); c++) {
                let valL = this.getCellValue(new Coordinates(c,r).getCoordsUpLeft())
                let valR = this.getCellValue(new Coordinates(c,r).getCoordsUpRight())
                let res = rulesetFunction()(valL, valR)

                this.setCellValue(new Coordinates(c, r), res)
                //console.log(`set internal value at [${c}, ${r}] to: ` + res)
            }
        }
    }

    public static clearValues() : void {
        for (let r = 0; r < this.getRows(); r++) {
            for (let c = 0; c < this.getColumnsFromRowNumber(r); c++) {
                this.grid[r][c] = 0
            }
        }
    }

    public static consoleLogGrid() : void {
        let res : string = "Grid:\n"
        this.grid.forEach((row_) => {
            row_.forEach((col_) => {
                res += col_.toString() + ", "
            })
            res += "\n"
        })
        console.log(res)
    }
}

class Coordinates {
    public column: number
    public row: number

    constructor(column_ : number, row_ : number) {
        this.column = column_;
        this.row = row_;
    }

    public getCoordsUpLeft() : Coordinates {
        if (this.row%2) {
            // odd row number (row with margin)
            return new Coordinates(this.column, this.row - 1)
        } else {
            // even row number (row without margin)
            return new Coordinates(this.column - 1, this.row - 1)
        }
    }

    public getCoordsUpRight() : Coordinates {
        if (this.row%2) {
            // odd row number (row with margin)
            return new Coordinates(this.column + 1, this.row - 1)
        } else {
            // even row number (row without margin)
            return new Coordinates(this.column, this.row - 1)
        }
    }

    public isEqual(c : Coordinates) {
        return (this.column==c.column && this.row == c.row)
    }
}

function updateDisplay() : void {
    removeGrid()
    console.log(`Generating display... size: ${Grid.getColumns(false)}x${Grid.getRows()}`)
    for (let r = 0; r < Grid.getRows(); r++) {
        let rowDiv = document.createElement("div")
        if (r%2) {
            rowDiv.style.setProperty("margin-left", "35px")
        }

        for (let c = 0; c < Grid.getColumnsFromRowNumber(r); c++) { 
            let cell = document.createElement("input")
            if (r==0) {
                // special instructions for creating the first row, where the user can type in values
                cell.disabled = false
                cell.style.border = "1px solid aliceblue"
            } else {
                cell.disabled = true
            }
            cell.dataset.col = c.toString()
            cell.dataset.row = r.toString()

            cell.title = `column: ${c}, row: ${r}`

            cell.type = "text"
            cell.value = Grid.getCellValue(new Coordinates(c,r)).toString()
            rowDiv.appendChild(cell)
        }
        rowDiv.style.setProperty("white-space", "nowrap")
        rowDiv.id = `r${r}`
        if (gridDisplay != null) gridDisplay.appendChild(rowDiv)
    }
}

function removeGrid() {
    console.log("Removing display...")
    if (gridDisplay != null) gridDisplay.innerHTML = ""
}

function readUserInputs() {
    console.log("Reading user inputs...")
    gridDisplay?.querySelectorAll("input").forEach((cell) => {
        if (cell.dataset.row == "0") {
            let col = cell.dataset.col
            if (col != null) {
                Grid.setCellValue(new Coordinates(parseInt(col), 0), parseFloat(cell.value))
                //console.log(`x:${col} set to: ${parseFloat(cell.value)}`)
            }
        }
    })
}

// map function to turn a wide range of values into a small range of colors (lerp)
function mapValue(value, minValue, maxValue, minOutput, maxOutput) {
    return minOutput + (maxOutput - minOutput) * (value - minValue) / (maxValue - minValue);
}

function colorCells() {
    if (!colorsInput?.checked) {
        gridDisplay?.querySelectorAll("input").forEach((cell) => {
            cell.style.backgroundColor = defaultCellColor
        })
        return;
    }

    let hueMin_ = hueMinInput?.value
    let hueMax_ = hueMaxInput?.value

    let max = 0
    let min = 0
    let cells = gridDisplay?.querySelectorAll("input")
    if (cells == null) return;
    for (let i = 0; i < cells?.length; i++) {
        let cell = cells[i]
        let value: number = parseFloat(cell.value)
        if (i==0) {
            max = value
            min = value
            continue;
        }

        if (value > max) {
            max = value
        }

        if (value < min) {
            min = parseFloat(cell.value)
        }
    }
    console.log("max value: " + max)
    console.log("min value: " + min)

    // map values to custom color gradient
    for (let i = 0; i < cells?.length; i++) {
        let cell = cells[i]
        let value = parseFloat(cell.value)

        // map to something larger than 0 so that logarithms can handle it
        let positiveMappedValue = mapValue(value, min, max, 1/1000, 1000)
        //console.log(`turned ${value} into ${positiveMappedValue}`)
        
        let loggedValue = Math.log10(positiveMappedValue)

        let hue = mapValue(loggedValue, Math.log10(1/1000), Math.log10(1000), hueMin_, hueMax_)

        hue = Math.round(hue)

        cell.style.backgroundColor = `hsl(${hue}, 80%, 30%)`
        //console.log(`setting hue value to: ${hue}`);

        if (value == 0) {
            cell.style.backgroundColor = `hsl(${hue}, 80%, 20%)`
        }
    }
}

function clearGrid() {
    Grid.clearValues()
    updateDisplay()
}

clearValuesButton?.addEventListener("click", () => {
    clearGrid()
})

colorsInput?.addEventListener("click", () => {
    colorCells();
})

document.addEventListener("keydown", (key) => {
    if (key.key == "Escape") {
        clearValuesButton?.click()
        clearValuesButton!.style.backgroundColor = "hsl(5, 100%, 35%)"
    }
    if (key.key == "Enter") {
        refreshButton?.click()
        refreshButton!.style.backgroundColor = "hsl(93, 100%, 20%)"
    }
})

document.addEventListener("keyup", (key) => {
    if (key.key == "Escape") {
        clearValuesButton!.style.backgroundColor = "hsl(5, 100%, 75%)"
    }
    if (key.key == "Enter") {
        refreshButton!.style.backgroundColor = "hsl(93, 100%, 75%)"
    }
})


function getUserInput_GridSize() : Coordinates {
    let columns = columnInput?.valueAsNumber
    let rows = rowInput?.valueAsNumber

    if (columns != null && rows != null) {
        return new Coordinates(columns, rows)
    } else {
        // this will never be returned, unless the grid size input fields dont exist for some reason
        return new Coordinates(-1,-1)
    }
}

let oldGridSize : Coordinates;

/**
 * makes a new internal grid and updates the display
 */
function generateNewGrid() : void {
    let size = getUserInput_GridSize()
    oldGridSize = size
    console.log(`generating a ${size.column}x${size.row} grid`)
    Grid.generateGrid(size.column, size.row)
    console.log(`grid has ${Grid.getRows()} rows`)
    updateDisplay()
}

function initGrid() {
    generateNewGrid()
}

function refresh() {
    // if columns/rows amount changed, generate a new empty grid
    if (!(oldGridSize.isEqual(getUserInput_GridSize()))) {
        console.log(`grid size changed, from ${oldGridSize.column}x${oldGridSize.row} 
            to ${getUserInput_GridSize().column}x${getUserInput_GridSize().row}`)
        initGrid()
        console.log(`generated a grid, size ${Grid.getColumns(false)}x${Grid.getRows()}`)
    }

    readUserInputs()
    Grid.calculate(getRulesetFunc)
    console.log("finished calculating")
    updateDisplay()
    colorCells()
}

document.addEventListener("DOMContentLoaded", () => {
    initGrid()
})

refreshButton?.addEventListener("click", () => {
    refresh()
})