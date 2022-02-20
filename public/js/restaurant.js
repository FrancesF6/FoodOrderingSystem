let restaurantInfo = {};   // {_id: MongoDBID, name: String, min_order: Number, delivery_fee: Number, visibility: Boolean, rate: Number}
let restaurantMenu = {};   // {_id: MongoDBID, menu: {category: [{}, ...], ...}}

//**********************************************************************//
// REQUESTs

// onload - get full JSON information of the restaurant
function getRestaurantData() {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let res = JSON.parse(this.responseText);
            // update restaurant info and menu data
            restaurantInfo.name = res.name;
            restaurantInfo.min_order = res.min_order;
            restaurantInfo.delivery_fee = res.delivery_fee;
            restaurantInfo.visibility = res.visibility;
            restaurantInfo.rate = res.rate;
            restaurantMenu.menu = res.menu;
            // console.log(restaurantInfo, restaurantMenu);

            // render the html page with restaurant data
            renderRestaurantInfo();
            renderRestaurantMenu();
        }
    }
    req.open("GET", `${restaurantInfo._id}`, true);
    req.setRequestHeader("Accept", "application/json");
    req.send();
}


// send local restaurant info data to server
function saveRestaurantInfoChanges() {
    if (!updateRestaurantInfo()) return;   // any input invalid, not continue

    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                alert("Restaurant information saved!");
            } else if (this.status == 400 || this.status == 401 || this.status == 404) {
                alert(this.responseText);
            }
        }
    }
    req.open("PUT", `${restaurantInfo._id}`, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(restaurantInfo));
}


// send local restaurant menu data to server
function saveRestaurantMenuChanges() {
    if (!updateRestaurantMenu()) return;   // any input invalid, not continue

    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                alert("Restaurant menu saved!");
            } else if (this.status == 400 || this.status == 401 || this.status == 404) {
                alert(this.responseText);
            }
        }
    }
    req.open("PUT", `${restaurantInfo._id}`, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(restaurantMenu));
}


//**********************************************************************//
// Non-request handlers, only change html elements, not change local restaurantMenu data

// add a new text input of category
function addCategory() {
    let newCategory = document.createElement('div');
    newCategory.className = "category";
    // elements: img, label, text input, img, div
    newCategory.innerHTML = `<img class="addremove-pic" title="Remove category" src="/images/remove-category.png" onclick="removeCategory(this)">
                            <label>Category: </label><input type="text" class="category-input">
                            <img class="addremove-pic" title="Add a dish" src="/images/add-dish.png" onclick="addDish(this)">
                            <div class="dishes"></div>`;

    document.getElementById("menu-content").appendChild(newCategory);
}


// remove the div of a category
function removeCategory(node) {
    // console.log(node.parentNode);
    document.getElementById("menu-content").removeChild(node.parentNode);
}


// add a new text input of dish
function addDish(node) {
    let newDish = document.createElement('div');
    newDish.className = 'dish';
    // elements: label *3, text input *3, img
    newDish.innerHTML = `<label>Dish Name: </label><input type="text" class="dish-name-input">
                        <label>Price: </label><input type="text" class="dish-price-input">
                        <img class="addremove-pic" title="Remove dish" src="/images/remove-dish.png" onclick="removeDish(this)"><br>
                        <label>Description: </label><input type="text" class="dish-description-input">`;
    
    node.parentNode.lastElementChild.appendChild(newDish);
}


// remove the div of a dish
function removeDish(node) {
    // console.log(node.parentNode);
    node.parentNode.parentNode.removeChild(node.parentNode);
}


//**********************************************************************//
// HTML rendering

function renderRestaurantInfo() {
    document.getElementById("restaurant-id").innerText = `Restaurant ID: ${restaurantInfo._id}`;

    let stars = '';
	if (restaurantInfo.rate) {
		let rate = restaurantInfo.rate;
		while (rate >= 0.5) {
			if (rate >= 1) {
				stars += `<img class="rate-star" src="/images/star.png">`;
				rate --;
                continue;
			}
            stars += `<img class="rate-star" src="/images/star-half.png">`;
            rate -= 0.5;
		}
	}
    document.getElementById("restaurant-rate").innerHTML = stars;

    let infoInputs = document.getElementsByClassName("restaurant-info-inputs");
    for (let node of infoInputs) {
        node.value = restaurantInfo[node.id];
    }

    let visibleRadios = document.getElementsByClassName("visible-radios");
    for (let radio of visibleRadios) {
        if (restaurantInfo.visibility && radio.value === "true") radio.checked = true;
        else if (!restaurantInfo.visibility && radio.value === "false") radio.checked = true;
    }
}


function renderRestaurantMenu() {
    let menu = document.getElementById("menu-content");
    menu.innerHTML = "";   // clear

    for (let category in restaurantMenu.menu) {
        let newCategory = document.createElement('div');
        newCategory.className = "category";
        newCategory.innerHTML = `<img class="addremove-pic" title="Remove category" src="/images/remove-category.png" onclick="removeCategory(this)">
                                <label>Category: </label><input type="text" class="category-input" value="${category}">
                                <img class="addremove-pic" title="Add a dish" src="/images/add-dish.png" onclick="addDish(this)">`;

        // div for storing category's dishes
        let newDishesDiv = document.createElement('div');
        newDishesDiv.className = "dishes";
        for (let dish of restaurantMenu.menu[category]) {
            let newDish = document.createElement('div');
            newDish.className = 'dish';
            newDish.innerHTML = `<label>Dish Name: </label>
                                <input type="text" class="dish-name-input" value="${dish.name}">
                                <label>Price: </label>
                                <input type="text" class="dish-price-input" value="${dish.price}">
                                <img class="addremove-pic" title="Remove dish" src="/images/remove-dish.png" onclick="removeDish(this)"><br>
                                <label>Description: </label>
                                <input type="text" class="dish-description-input" value="${dish.description}">`;
            newDishesDiv.appendChild(newDish);
        }
        newCategory.appendChild(newDishesDiv);
        
        menu.appendChild(newCategory);
    }
}


//**********************************************************************//
// HELPER FUNCTIONS

// get restaurant info from DOM input, validate and save to local RAM
// only called before save restaurant info changes to server
function updateRestaurantInfo() {
    let infoData = {};   // for temp use, update restaurantInfo after validation
    let infoInputs = document.getElementsByClassName("restaurant-info-inputs");
    for (let node of infoInputs) {
        // client side validation: input length must > 0
        if (node.value.trim().length === 0) {
            alert(`${node.name} is required!`);
            return false;
        }
        // trim restaurant name and save
        if (node.id === "name") infoData.name = node.value.trim();
        
        // client side validation: fee and min-order should be numbers and save
        else if (node.id === "delivery_fee" || node.id === "min_order") {
            if (isNaN(Number(node.value))) {
                alert(`${node.name} should be a number!`);
                return false;
            } else {
                infoData[node.id] = Number(node.value);
            }
        }
    }

    let visibleRadios = document.getElementsByClassName("visible-radios");
    for (let radio of visibleRadios) {
        if (radio.checked) {
            if (radio.value === "true") infoData.visibility = true;
            else if (radio.value === "false") infoData.visibility = false;
        }
    }
    restaurantInfo.name = infoData.name;
    restaurantInfo.min_order = infoData.min_order;
    restaurantInfo.delivery_fee = infoData.delivery_fee;
    restaurantInfo.visibility = infoData.visibility;
    return true;
}


// get restaurant menu from DOM input, validate and save to local RAM
// only called before save restaurant menu changes to server
function updateRestaurantMenu() {
    // validate categories - no empty and no duplicate
    let categorySet = new Set();
    let categories = document.getElementsByClassName("category-input");
    for (let node of categories) {
        // validate: not empty
        if (node.value.trim().length === 0) {
            alert(`Category name is required! (delete if not needed)`);
            return false;
        }
        // validate: no duplicates
        if (categorySet.has(node.value.trim())) {
            alert(`No duplicate categories allowed! (delete if not needed)`);
            return false;
        }
        categorySet.add(node.value.trim());
    }

    // validate dishes - no empty and no duplicate
    let dishSet = new Set();
    let dishes = document.getElementsByClassName("dish-name-input");
    for (let node of dishes) {
        // validate: not empty
        if (node.value.trim().length === 0) {
            alert(`Dish name is required! (delete if not needed)`);
            return false;
        }
        // validate: no duplicates
        if (dishSet.has(node.value.trim())) {
            alert(`No duplicate dishes allowed! (delete if not needed)`);
            return false;
        }
        dishSet.add(node.value.trim());
    }

    // validate dish prices - no empty
    let dishPrices = document.getElementsByClassName("dish-price-input");
    for (let node of dishPrices) {
        // validate: not number or is 0
        if (isNaN(Number(node.value)) || Number(node.value) == 0) {
            alert(`Dish price is required! (delete if not needed)`);
            return false;
        }
    }

    // all validation done, save the menu data from DOM
    let menuData = {};   // update restaurantMenu after validation
    let categoryDivs = document.getElementsByClassName("category");
    for (let categoryDiv of categoryDivs) {   // categoryDiv: <div class="category">...</div>
        let newCategory = '';
        for (let node of categoryDiv.childNodes) {
            // get category name
            if (node.className === "category-input") {
                newCategory = node.value.trim();
                menuData[newCategory] = [];
            }
            // get category's dishes and push to the array
            else if (node.className === "dishes") {
                for (let dishDiv of node.childNodes) {   // dishDiv: <div class="dish">...</div>
                    let newDish = {};
                    // get dish's name, price and description
                    for (let dishInfoNode of dishDiv.childNodes) {
                        if (dishInfoNode.className === "dish-name-input") {
                            newDish.name = dishInfoNode.value.trim();
                        } else if (dishInfoNode.className === "dish-price-input") {
                            newDish.price = Number(dishInfoNode.value);
                        } else if (dishInfoNode.className === "dish-description-input") {
                            newDish.description = dishInfoNode.value.trim();
                        }
                    }
                    // check if dish's required attributes exist (avoid bad html resource)
                    if (!newDish.name || !newDish.price || !menuData.hasOwnProperty(newCategory) || newCategory === '') return false;
                    menuData[newCategory].push(newDish);
                }
            }

        }
    }
    restaurantMenu.menu = menuData;
    return true;
}


function init() {
    restaurantInfo._id = window.location.href.split('/restaurants/')[1];
    restaurantMenu._id = restaurantInfo._id;
    getRestaurantData();
}
