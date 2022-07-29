//Handles loading, displaying, updating, and saving the tile sheet and tile map data.


/**--------------------------------------------------------------------------------
 * setting up canvas contexts, variables, and tilesheet image to use
 * -------------------------------------------------------------------------------- */

//define the format for the tilesheet which is saved and loaded from local storage
var tileSheetObject = {
    pixelArray: [], //will be 32 arrays that contain 32 bools defining pixels, accessed in [x][y] form
    colorArray: [] //will be 8 arrays of 8 tuple entries defining colors for each tile, accessed in [x][y] form
};

var tileMapObject = {
    tileArray: [] //will be 16 arrays of 16 tuples referring to the graphics tile for that map tile
}

var tileSheet = document.getElementById('TileSheet');
tsctx = tileSheet.getContext('2d');
tsctx.imageSmoothingEnabled = false;

var tileEditor = document.getElementById('TileEditor');
tectx = tileEditor.getContext('2d');
tectx.imageSmoothingEnabled = false;
var foregroundColor = document.getElementById('FGColor');
foregroundColor.onchange = function(){updateTileColors();};
var backgroundColor = document.getElementById('BGColor');
backgroundColor.onchange = function(){updateTileColors();};

var tileMap = document.getElementById('MapEditor');
tmctx = tileMap.getContext('2d');
tmctx.imageSmoothingEnabled = false;

//The currently selected tile, needed for tile editor and map editor
//the XY is in tiles, ie [1,1] is the tile second from the left and second from the top
currentTileXY = [0,0];

//Mouse clicking functionality
function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    //sanitize the numbers if they equal or exceed the bounds of the canvas,
    //which can happen due to clicking the border, and cause errors in whatever
    //is calling this function.
    if (x >= canvas.width)
    {
        x = canvas.width - 1;
    }
    if(y >= canvas.height)
    {
        y = canvas.height - 1;
    }

    return [x,y]
}

tileSheet.addEventListener("mousedown", function(e)
{
    onClickTileSheet(e);
});

tileEditor.addEventListener("mousedown", function(e)
{
    onClickTileEditor(e);
});

tileMap.addEventListener("mousedown", function(e)
{
    onClickTileMap(e);
});

//we'll use this to turn off the grid when exporting
tileMapGridEnable = true;

exportButton = document.getElementById("exportButton");
exportButton.addEventListener("mousedown", function(e)
{
    exportTileMap(e);
});

//on load, we'll try to fetch a tilesheet from storage, or create one if it isn't there
window.onload = loadFromStorage();


/**--------------------------------------------------------------------------------
 * Script and functions 
 * -------------------------------------------------------------------------------- */

//TODO: need to implement saving and loading an object from storage, 
//which will require conversion to a string.  
function loadFromStorage()
{
    //if(!localStorage.getItem('tileSheetObject')) {
        for(let x = 0; x < 32; x++)
        {
            tileSheetObject.pixelArray.push([]);
            for(let y = 0; y < 32; y++)
            {
                tileSheetObject.pixelArray[x].push(false);
            }
        }

        for(let tileX = 0; tileX < 8; tileX++)
        {
            tileSheetObject.colorArray.push([]);
            for(let tileY = 0; tileY < 8; tileY++)
            {
                let tuple = ['black', 'white']; //in "background color, foreground color" format
                tileSheetObject.colorArray[tileX].push(tuple);
            }
        }
        //todo: save tileSheetObject to storage

        for(let x = 0; x < 16; x++)
        {
            tileMapObject.tileArray.push([]);
            for(let y = 0; y < 16; y++)
            {
                tileMapObject.tileArray[x].push([0,0]);
            }
        }
        //todo: save tileMapObject to storage
    /*} else {
        //todo: load tilesheet and map
    }*/

    updateTileSheet();
    updateTileEditor();
    updateTileMap();
}

function updateTileSheet()
{
    let scaleFactor = tileSheet.width/32;

    for(let x = 0; x < 32; x++)
    {
        for(let y = 0; y < 32; y++)
        {
            let value = tileSheetObject.pixelArray[x][y]; //where true = foreground color, false = background color
            let colors = tileSheetObject.colorArray[Math.floor(x/4)][Math.floor(y/4)];
            if(value == true)
            {
                tsctx.fillStyle = colors[1];
                tsctx.fillRect(x*scaleFactor, y*scaleFactor, scaleFactor, scaleFactor);
            }
            else
            {
                tsctx.fillStyle = colors[0];
                tsctx.fillRect(x*scaleFactor, y*scaleFactor, scaleFactor, scaleFactor);
            }
        }
    }

    //draw the grid lines
    tsctx.beginPath();
    for(let x = 0; x < 32; x += 4)
    {
        /* The magic 0.5 numbers below are so that the lines are rendered
        thin and solid; without it, the canvas will try to draw the line 
        between two columns of pixels, creating a 2-pixel-wide partially 
        transparent line, as the line covers 0.5 pixels of each column.*/
        tsctx.moveTo(x*scaleFactor+0.5, 0);
        tsctx.lineTo(x*scaleFactor+0.5, 64*scaleFactor);
    }
    for(let y = 0; y < 32; y += 4)
    {
        tsctx.moveTo(0, y*scaleFactor+0.5);
        tsctx.lineTo(64*scaleFactor, y*scaleFactor+0.5);
    }
    tsctx.strokeStyle = "#ffffff";
    tsctx.lineWidth = 1;
    tsctx.stroke();

    //finally, draw box around currently selected tile
    tsctx.strokeStyle = "#00ff55";
    tsctx.strokeRect(currentTileXY[0]*4*scaleFactor+0.5,currentTileXY[1]*4*scaleFactor+0.5,4*scaleFactor,4*scaleFactor);
}

//for efficiency, only update the tile that was changed
//does this make a meaningful difference in practice?
//dunno, haven't benchmarked, but I hope so.
function updateTileSheetCurrentTile()
{
    let xOffset = currentTileXY[0]*4;
    let yOffset = currentTileXY[1]*4;
    let colors = tileSheetObject.colorArray[currentTileXY[0]][currentTileXY[1]];

    let scaleFactor = tileSheet.width/32;

    for(let x = xOffset; x < xOffset + 4; x++)
    {
        for(let y = yOffset; y < yOffset + 4; y++)
        {
            let value = tileSheetObject.pixelArray[x][y]; //where true = foreground color, false = background color

            if(value == true)
            {
                tsctx.fillStyle = colors[1];
                tsctx.fillRect(x*scaleFactor, y*scaleFactor, scaleFactor, scaleFactor);
            }
            else
            {
                tsctx.fillStyle = colors[0];
                tsctx.fillRect(x*scaleFactor, y*scaleFactor, scaleFactor, scaleFactor);
            }
        }
    }

    //draw box around currently selected tile
    tsctx.strokeStyle = "#00ff55";
    tsctx.strokeRect(currentTileXY[0]*4*scaleFactor+0.5,currentTileXY[1]*4*scaleFactor+0.5,4*scaleFactor,4*scaleFactor);
}

function updateTileEditor()
{
    let xOffset = currentTileXY[0]*4;
    let yOffset = currentTileXY[1]*4;
    let colors = tileSheetObject.colorArray[currentTileXY[0]][currentTileXY[1]];
    let scaleFactor = tileEditor.width/4;

    for(let x = 0; x < 4; x++)
    {
        for(let y = 0; y < 4; y++)
        {
            value = tileSheetObject.pixelArray[xOffset+x][yOffset+y];
            if(value == true)
            {
                tectx.fillStyle = colors[1];
                tectx.fillRect(x*scaleFactor, y*scaleFactor, scaleFactor, scaleFactor);
            }
            else
            {
                tectx.fillStyle = colors[0];
                tectx.fillRect(x*scaleFactor, y*scaleFactor, scaleFactor, scaleFactor);
            }
        }
    }

    //draw the grid lines
    tectx.beginPath();
    for(let x = 0; x < 4; x++)
    {
        /* The magic 0.5 numbers below are so that the lines are rendered
        thin and solid; without it, the canvas will try to draw the line 
        between two columns of pixels, creating a 2-pixel-wide partially 
        transparent line, as the line covers 0.5 pixels of each column.*/
        tectx.moveTo(x*scaleFactor+0.5, 0);
        tectx.lineTo(x*scaleFactor+0.5, 4*scaleFactor);
    }
    for(let y = 0; y < 64; y++)
    {
        tectx.moveTo(0, y*scaleFactor+0.5);
        tectx.lineTo(4*scaleFactor, y*scaleFactor+0.5);
    }
    tectx.strokeStyle = "#ffffff";
    tectx.lineWidth = 1;
    tectx.stroke();
}

function updateTileMap()
{
    let scaleFactor = tileMap.width/64;

    for(let x = 0; x < 16; x++)
    {
        for(let y = 0; y < 16; y++)
        {
            let tileXY = tileMapObject.tileArray[x][y];
            let tileX = tileXY[0];
            let tileY = tileXY[1];
            let colors = tileSheetObject.colorArray[tileX][tileY];

            for(let px = 0; px < 4; px++)
            {
                for(let py = 0; py < 4; py++)
                {
                    let value = tileSheetObject.pixelArray[tileX*4+px][tileY*4+py]; //where true = foreground color, false = background color
                    if(value == true)
                    {
                        tmctx.fillStyle = colors[1];
                        tmctx.fillRect(x*4*scaleFactor+px*scaleFactor, y*4*scaleFactor+py*scaleFactor, scaleFactor, scaleFactor);
                    }
                    else
                    {
                        tmctx.fillStyle = colors[0];
                        tmctx.fillRect(x*4*scaleFactor+px*scaleFactor, y*4*scaleFactor+py*scaleFactor, scaleFactor, scaleFactor);
                    }
                }
            }

        }
    }

    if(tileMapGridEnable == true)
    {
        //draw the grid lines
        tmctx.beginPath();
        for(let x = 0; x < 64; x += 4)
        {
            tmctx.moveTo(x*scaleFactor+0.5, 0);
            tmctx.lineTo(x*scaleFactor+0.5, 64*scaleFactor);
        }
        for(let y = 0; y < 64; y += 4)
        {
            tmctx.moveTo(0, y*scaleFactor+0.5);
            tmctx.lineTo(64*scaleFactor, y*scaleFactor+0.5);
        }
        tmctx.strokeStyle = "#ffffff";
        tmctx.lineWidth = 1;
        tmctx.stroke();
    }

}

function onClickTileSheet(e)
{
    let xy = getMousePosition(tileSheet, e);
    let scaleFactor = tileSheet.width/32;
    currentTileXY[0] = Math.floor(xy[0]/(4*scaleFactor));
    currentTileXY[1] = Math.floor(xy[1]/(4*scaleFactor));

    //update the colors in the select boxes to match the newly selected tile
    let currentColors = tileSheetObject.colorArray[currentTileXY[0]][currentTileXY[1]]
    backgroundColor.value = currentColors[0];
    foregroundColor.value = currentColors[1];

    //further performance/efficiency gains may come from only updating
    //the tile sheet's grid and selection box, rather than rereading all pixels
    updateTileSheet();
    updateTileEditor();
}

function onClickTileMap(e)
{
    let xy = getMousePosition(tileMap, e);
    let scaleFactor = tileMap.width/64;
    let tileX = Math.floor(xy[0]/(4*scaleFactor));
    let tileY = Math.floor(xy[1]/(4*scaleFactor));
    //tileMapObject.tileArray[tileX][tileY] = currentTileXY;
    /**^No!  Do not do this!  This will set it to point to currentTileXY,
     * Not give it the value.*/
    let tX = currentTileXY[0];
    let tY = currentTileXY[1];
    tileMapObject.tileArray[tileX][tileY] = [tX, tY];
    updateTileMap();
}

function onClickTileEditor(e)
{
    let xy = getMousePosition(tileEditor, e);
    let scaleFactor = tileEditor.width/4;
    pixelX = Math.floor(xy[0]/scaleFactor) + currentTileXY[0]*4;
    pixelY = Math.floor(xy[1]/scaleFactor) + currentTileXY[1]*4;
    tileSheetObject.pixelArray[pixelX][pixelY] = !tileSheetObject.pixelArray[pixelX][pixelY];
    updateTileSheetCurrentTile();
    updateTileEditor();
    updateTileMap();
}

function updateTileColors()
{
    tileSheetObject.colorArray[currentTileXY[0]][currentTileXY[1]] = [backgroundColor.value,foregroundColor.value];
    updateTileSheetCurrentTile();
    updateTileEditor();
    updateTileMap();
}

function exportTileMap()
{
    let gridEnableValue = tileMapGridEnable;
    tileMapGridEnable = false;
    updateTileMap();
    
    //export
    var exportPNG = tileMap.toDataURL('image/png');
    //copied from github
    // Create a link
    var downloadLink = document.createElement('a');
    // Add the name of the file to the link
    downloadLink.download = 'tilemap.png';
    // Attach the data to the link
    downloadLink.href = exportPNG;
    // Get the code to click the download link
    downloadLink.click();

    //reenable grid if previously enabled
    tileMapGridEnable = gridEnableValue;
    updateTileMap();
}