let userID = window.location.href.split(`/users/`)[1];

function savePrivacy() {
    let privacy;
    let radios = document.getElementsByName("privacy");
    for (let radio of radios) {
        if (radio.checked) {
            if (radio.id === 'on') privacy = true;
            else if (radio.id === 'off') privacy = false;
        }
    }
    if (privacy != null) {
        let req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    alert("Privacy Saved!");
                } else if (this.status == 401 || this.status == 403) {
                    alert(this.responseText);
                }
            }
        }
        req.open("POST", `/users/${userID}`, true);
        req.setRequestHeader("Content-Type", "application/json");
        req.send(JSON.stringify({privacy: privacy}));
    }
}


function changePassword() {
    let newPassword = document.getElementById("psw").value;
    let pswRegex = /^(?!.*\s)(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/;
    if (!pswRegex.test(newPassword)) {
        alert("A validate password should have 8-20 characters, at least 1 lowercase letter, 1 uppercase letter, 1 digit, and no spaces.");
        return;
    }

    if (newPassword != null) {
        let req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    alert("Password Saved!");
                } else if (this.status == 400 || this.status == 401 || this.status == 403) {
                    alert(this.responseText);
                }
            } 
        }
        req.open("POST", `/users/${userID}`, true);
        req.setRequestHeader("Content-Type", "application/json");
        req.send(JSON.stringify({password: newPassword}));
    }
}