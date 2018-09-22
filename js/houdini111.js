function finalize()
{
    PR.prettyPrint();
    noDrag();
    progressBarsStyle();
}

function noDrag()
{
    var elements = document.querySelectorAll('noDrag');
    for (i = 0; i < elements.length; i++){ elements[i].draggable = false; }
}


function resizeCheck()
{
    if ($(window).width() <= 992) { removeBorder(); }
    else if ($(window).width() > 992) { addBorder(); }
    /*
    if ($(window).width() < 768)
    {
        removeBorder();
    }
    else if ($(window).width() >= 768 && $(window).width() <= 992)
    {
        removeBorder();
    }
    else if ($(window).width() > 992 && $(window).width() <= 1200)
    {
        addBorder();
    }
    else
    {
        addBorder();
    }
    */
}

function removeBorder()
{
    document.getElementById("sideColumn").style.borderLeftStyle = "none";
}

function addBorder()
{
    document.getElementById("sideColumn").style.borderLeftStyle = "solid";
}

function progressBarsStyle()
{
    var tmp = generateColor('#77A3C3', '#1E2542', 100);

    var style = document.createElement("style");
    style.type = "text/css";
    var skillBars = document.getElementsByClassName("skill-bar");
    for (var i = 0; i < skillBars.length; i++)
    {
        var sb = skillBars.item(i);
        var b = sb.getElementsByClassName("bar").item(0);
        var percent = b.innerHTML;
        sb.id = "skill_" + i;
        style.innerHTML += " .show #" + sb.id + " .bar { width: " + percent + "; }  \n";
        b.style.backgroundColor = "#"+tmp[parseInt(percent.substring(0, percent.length - 1))-1];
        b.innerHTML = "";
    }
    document.getElementsByTagName("head")[0].appendChild(style);
}



//Gradient Functions

function hex(c) {
    var s = "0123456789abcdef";
    var i = parseInt(c);
    if (i == 0 || isNaN(c))
        return "00";
    i = Math.round(Math.min(Math.max(0, i), 255));
    return s.charAt((i - i % 16) / 16) + s.charAt(i % 16);
}

/* Convert an RGB triplet to a hex string */
function convertToHex(rgb) {
    return hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
}

/* Remove '#' in color hex string */
function trim(s) { return (s.charAt(0) == '#') ? s.substring(1, 7) : s }

/* Convert a hex string to an RGB triplet */
function convertToRGB(hex) {
    var color = [];
    color[0] = parseInt((trim(hex)).substring(0, 2), 16);
    color[1] = parseInt((trim(hex)).substring(2, 4), 16);
    color[2] = parseInt((trim(hex)).substring(4, 6), 16);
    return color;
}

function generateColor(colorStart, colorEnd, colorCount) {

    // The beginning of your gradient
    var start = convertToRGB(colorStart);

    // The end of your gradient
    var end = convertToRGB(colorEnd);

    // The number of colors to compute
    var len = colorCount;

    //Alpha blending amount
    var alpha = 0.0;

    var arr = [];

    for (i = 0; i < len; i++) {
        var c = [];
        alpha += (1.0 / len);

        c[0] = start[0] * alpha + (1 - alpha) * end[0];
        c[1] = start[1] * alpha + (1 - alpha) * end[1];
        c[2] = start[2] * alpha + (1 - alpha) * end[2];

        arr.push(convertToHex(c));

    }

    return arr;
}


