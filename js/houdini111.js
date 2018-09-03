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