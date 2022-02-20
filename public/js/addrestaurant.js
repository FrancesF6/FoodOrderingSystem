function addRestaurant() {
    let newRestaurant = {};
    let formInputs = document.getElementsByClassName("add-form-inputs");
    for (let node of formInputs) {
        // client side validation: input length must > 0
        if (node.value.trim().length === 0) {
            alert(`${node.name} is required!`);
            return;
        }
        // new restaurant name trimmed
        if (node.id === "name") newRestaurant.name = node.value.trim();

        // client side validation: fee and min-order should be numbers
        else if (node.id === "delivery_fee" || node.id === "min_order") {
            if (isNaN(Number(node.value))) {
                alert(`${node.name} should be a number!`);
                return;
            }
            newRestaurant[node.id] = Number(node.value);
        }
    }
    // console.log("new restaurant: ", newRestaurant);

    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 201) {
                let newID = JSON.parse(this.responseText);
                window.location.href = `/restaurants/${newID}`;  // redirect to the page to view the newly created restaurant
            } else if (this.status == 400 || this.status == 401) {
                alert(this.responseText);
            }
        }
    }
    req.open("POST", `/restaurants/add`, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Accept", "application/json");
    req.send(JSON.stringify(newRestaurant));
}
