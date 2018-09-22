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
    var style = document.createElement("style");
    style.type = "text/css";
    var skillBars = document.getElementsByClassName("skill-bar");
    for (var i = 0; i < skillBars.length; i++)
    {
        var sb = skillBars.item(i);
        var b = sb.getElementsByClassName("bar").item(0);
        sb.id = "skill_" + i;
        style.innerHTML += " .show #" + sb.id + " .bar { width: " + b.innerHTML + "; }  \n";
        b.innerHTML = "";
    }
    document.getElementsByTagName("head")[0].appendChild(style);
}