declare interface Math {
    log10(x: number): number;
}

let grid: HTMLDivElement | null = document.querySelector("div#grid")
let refreshButton: HTMLButtonElement | null = document.querySelector("button#refresh-button")
let clearValuesButton: HTMLButtonElement | null = document.querySelector("button#clear-button")

let ruleset: HTMLSelectElement | null = document.querySelector("select#ruleset")

let columnInput: HTMLInputElement | null = document.querySelector("input#input-columns")
let rowInput: HTMLInputElement | null = document.querySelector("input#input-rows")

let colorsInput: HTMLInputElement | null = document.querySelector("input#input-colors")

let hueMin: HTMLInputElement | null = document.querySelector("input#input-hue-range-min")
let hueMax: HTMLInputElement | null = document.querySelector("input#input-hue-range-max")

let currentGridSize = {"col":0,"row":0}

//#region coordinates

function getCell(col: number, row: number) {
    if (document.getElementById(`r${row}`) != null) {
        let elements = document.getElementById(`r${row}`)?.querySelectorAll("input")
        if (elements != null) {
            for (let i = 0; i < elements?.length; i++) {
                let col_ = elements[i].getAttribute("data-col")
                if (col_ != null && parseInt(col_) == col) {
                    return elements[i]
                }
            }
        }
        return null
    } else {
        return null
    }
}

function getCellUpLeft(col: number, row: number) : HTMLInputElement | null {
    if (row%2) {
        // odd row number (row with margin)
        return getCell(col, row-1)
    } else {
        // even row number (row without margin)
        return getCell(col-1, row-1)
    }
}

function getCellUpRight(col: number, row: number) : HTMLInputElement | null {
    if (row%2) {
        // odd row number (row with margin)
        return getCell(col+1, row-1)
    } else {
        // even row number (row without margin)
        return getCell(col, row-1)
    }
}

//#endregion

//#region simple grid operations
function generateGrid(col: number, row: number) {
    removeGrid()
    for (let r = 0; r < row; r++) {
        let rowDiv = document.createElement("div")
        if (r%2) {
            rowDiv.style.setProperty("margin-left", "35px")
        }

        // create alternating row lengths
        let rowLength: number
        if (r%2 == 0) {
            rowLength = col + 1
        } else {
            rowLength = col
        }

        for (let c = 0; c < rowLength; c++) { 
            let cell = document.createElement("input")
            if (r==0) {
                cell.disabled = false
                cell.style.border = "1px solid aliceblue"
            } else {
                cell.disabled = true
            }
            cell.dataset.col = c.toString()
            cell.dataset.row = r.toString()

            cell.title = `column: ${c}, row: ${r}`

            cell.type = "text"
            cell.value = "0"
            rowDiv.appendChild(cell)
        }
        rowDiv.style.setProperty("white-space", "nowrap")
        rowDiv.id = `r${r}`
        if (grid != null) grid.appendChild(rowDiv)
    }
}

function removeGrid() {
    if (grid != null) grid.innerHTML = ""
}

function clearGrid() {
    grid?.querySelectorAll("input").forEach((cell) => { 
        cell.value = "0"
        cell.style.backgroundColor = "hsl(240, 20%, 15%)"
    })
}

//#endregion

// map function to turn a wide range of values into a small range of colors
function mapValue(value, minValue, maxValue, minOutput, maxOutput) {
    return minOutput + (maxOutput - minOutput) * (value - minValue) / (maxValue - minValue);
}

function recalculateColors() {
    if (!colorsInput?.checked) {
        grid?.querySelectorAll("input").forEach((cell) => {
            cell.style.backgroundColor = "hsl(240, 20%, 15%)"
        })
        return;
    }

    let hueMin_ = hueMin?.value
    let hueMax_ = hueMax?.value

    let max = 0
    let min = 0
    let cells = grid?.querySelectorAll("input")
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
        console.log(`setting hue value to: ${hue}`);

        if (value == 0) {
            cell.style.backgroundColor = `hsl(${hue}, 80%, 20%)`
        }
    }
}

function getRulesetFunc() {
    switch (ruleset?.value) {
        case "add":
            return (x: number,y: number) => x+y
        case "multiply":
            return (x: number,y: number) => x*y
        case "multiply2":
            return (x: number,y: number) => x*y*(-1)
        default:
            console.warn("Invalid ruleset")
            return (x: number,y: number) => 0
    }
}

function recalculate() {
    grid?.querySelectorAll("input").forEach((cell) => {
        //console.log(`calculating cell at ${cell.getAttribute("data-row")}, ${cell.getAttribute("data-col")}`)
        if (cell.hasAttribute("data-row") && cell.hasAttribute("data-col")) {
            // get cells above on the left and right
            let cellRow = cell.getAttribute("data-row")
            let cellCol = cell.getAttribute("data-col")
            let cellRowN, cellColN // cell coordinates as numbers
            if (cellCol != null) {
                cellColN = parseInt(cellCol)
            }
            if (cellRow != null) {
                cellRowN = parseInt(cellRow)
            }

            let valL = getCellUpLeft(cellColN, cellRowN)?.value
            let valR = getCellUpRight(cellColN, cellRowN)?.value

            if (valL != null && valR != null) {
                cell.value = getRulesetFunc()(parseFloat(valL), parseFloat(valR)).toString()
            }
        }
    })
}

refreshButton?.addEventListener("click", () => {
    if (currentGridSize.col != columnInput?.valueAsNumber || currentGridSize.row != rowInput?.valueAsNumber) {
        if (columnInput?.valueAsNumber != undefined && rowInput?.valueAsNumber != undefined) {
            generateGrid(columnInput?.valueAsNumber, rowInput?.valueAsNumber)
        }
    }
    
    recalculate()
    recalculateColors()
    
    if (columnInput!=null && rowInput!=null) {
        currentGridSize.col = columnInput.valueAsNumber
        currentGridSize.row = rowInput.valueAsNumber
    }
})

clearValuesButton?.addEventListener("click", () => {
    clearGrid()
})

colorsInput?.addEventListener("click", () => {
    recalculateColors();
})

document.addEventListener("DOMContentLoaded", () => {
    refreshButton?.click()
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

// todo fix case when alt tabbing
document.addEventListener("keyup", (key) => {
    if (key.key == "Escape") {
        clearValuesButton!.style.backgroundColor = "hsl(5, 100%, 75%)"
    }
    if (key.key == "Enter") {
        refreshButton!.style.backgroundColor = "hsl(93, 100%, 75%)"
    }
})