const outhoverStarOpacity = 0.5;
let rateDiv = document.getElementById("rate");

// on hover star, change both it and previous stars' opacity to 1
function hoverStar(e) {
    let thisStarID = e.id.split('star-')[1];
    for (let node of rateDiv.childNodes) {
        if (node.className === "set-rate-star") {
            if (node.id.split('star-')[1] <= thisStarID) {
                node.style.opacity = 1;
            } else break;
        }
    }
}

// out hover star, change all stars' color to default opacity
function outHoverStar() {
    for (let node of rateDiv.childNodes) {
        if (node.className === "set-rate-star") {
            node.style.opacity = outhoverStarOpacity;
        }
    }
}

// when clicking, ask the user to confirm and then make the request
function setRate(e) {
    let thisStarID = e.id.split('star-')[1];
    if (!confirm(`Are you sure to rate the order as ${thisStarID} star?`)) {
        // user cancel set star
        outHoverStar();
        return;
    }

    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 201) {
                location.reload();
            } else if (this.status == 400 || this.status == 401 || this.status == 404) {
                alert(this.responseText);
            }
        }
    }
    req.open("PUT", window.location.href, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({rate: Number(thisStarID)}));
}