const taxRate = 0.1;

let restaurantData = {};   // data of current restaurant, {_id, name, min_order, delivery_fee, visibility, menu: {}, rate}
let order = {};   // order = {dishIndex: quantity, ...}

let currentSubtotal = 0;
let currentTotal = 0;
let currentTax = 0;

let dropDownList = document.getElementById("restaurant_list");
dropDownList.onchange = changeRestaurant;


//**********************************************************************//
// REQUEST

// submit the order
function submitOrder(){
	let orderData = {};   // orderData = {dishName: quantity, ...}
	for (let dishIndex in order) {
		orderData[getDishByIndex(dishIndex).name] = order[dishIndex];
	}
	let info = {
		restaurantID: restaurantData._id,
		subtotal: currentSubtotal,
		total: currentTotal,
		fee: restaurantData.delivery_fee,
		tax: currentSubtotal * taxRate,
		order: orderData
	};

	let req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 201) {
				alert("Order Placed Successfully!");
				order = {};   // clear shopping cart

				// redirect to the page to view the newly created order
				window.location.href = `/order/${JSON.parse(this.responseText)}`;
			} else if (this.status == 500) {
				alert(this.responseText);
			}
		}
	}
	req.open("POST", `/order`, true);
	req.setRequestHeader("Content-Type", "application/json");
	req.setRequestHeader("Accept", "application/json");
	req.send(JSON.stringify(info));
}


// change restaurant data
function changeRestaurant() {
	document.getElementById("bodypart").style.display = "block";

	// if restaurantData is empty, or change restaurant name
	if (!restaurantData.name || restaurantData.name !== dropDownList.value) {
		// check order items emptiness
		if (!isEmpty(order)) {
			if (!confirm("Are you sure you want to clear order and switch menus?")) {
				// user cancel switch restaurant
				dropDownList.value = restaurantData._id;
				return;
			}
		}

		let req = new XMLHttpRequest();
		req.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				let res = JSON.parse(this.responseText);
				// in res.menu, dishes do not have indices
				updateRestaurantData(res);   // change restaurant
				order = {};
				
				// HTML renders
				renderRestaurantInfo();
				renderRestaurantCategories();
				renderRestaurantMenu();
				renderOrderSummary();

				console.log(`Restaurant changed to ${restaurantData.name}!`);  // DBEUG
			}
		}
		req.open("GET", `/restaurants/${dropDownList.value}`, true);
		req.setRequestHeader("Accept", "application/json");
		req.send();
	}
}


//**********************************************************************//
// (non-request) Event Handlers

// add item
function addItem(index) {
	// console.log("addItem index: ", index);
	if (order.hasOwnProperty(index)) order[index] ++;
	else order[index] = 1;
	// console.log("order: ", order);
	renderOrderSummary();
}

// remove item
function removeItem(index) {
	// console.log("removeItem index: ", index);
	if (order.hasOwnProperty(index)) {
		order[index] --;
		if (order[index] <= 0) delete order[index];
		// console.log("order: ", order);
		renderOrderSummary();
	}
}


//**********************************************************************//
// HTML RENDERS

// render restaurant's basic info in html
function renderRestaurantInfo() {
	// render the information of selected restaurant: name, min_order, delivery_fee, rate)
	document.getElementById("rName").innerHTML = restaurantData.name;
	document.getElementById("info-left-container").innerHTML = `Minimum Order: $${restaurantData.min_order}<br>
	Delivery Fee: $${restaurantData.delivery_fee}`;
	let stars = '';
	if (restaurantData.rate) {
		let rate = restaurantData.rate;
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
	document.getElementById("info-middle-container").innerHTML = stars;
}

// render categories (indices) in html
function renderRestaurantCategories() {
	if (restaurantData.menu) {
		let result = `<p><b>Categories</b></p>`;
		for (let category in restaurantData.menu) {
			result += `<a class="category-link" href="#${category}">${category}</a><br>`;
		}
		document.getElementById("the_category").innerHTML = result;
	}
}

// render menu items (main column) in html
function renderRestaurantMenu() {
	if (restaurantData.menu) {
		let menu = restaurantData.menu;
		let result = ``;
		for (let category in menu) {
			result += `<div id="${category}" class="category"><p><b>${category}</b></p>`;
			for (let dishIndex in menu[category]) {
				let dish = menu[category][dishIndex];
				result += `<p>${dish.name} (\$${dish.price.toFixed(2)}) `
				+ `<img class="add-remove-pic" src="images/order-add.png" onclick="addItem(${dishIndex})">`
				+ `<br>${dish.description}</p>`;
			}
			result += "</div>";
		}
		document.getElementById("the_menu").innerHTML = result;
	}
}

// render order summary in html && update global data of order summary
// called whenever a dish is added/removed in the order
function renderOrderSummary() {
	let result = "<p>";
	currentSubtotal = 0;   // clear to initialize
	
	// For each dish currently in the order
	for (let dishIndex in order) {
		let dish = getDishByIndex(dishIndex);
		// console.log("dish: ", dish);
		currentSubtotal += dish.price * order[dishIndex];
		result += `${dish.name} × ${order[dishIndex]} ($${(dish.price * order[dishIndex]).toFixed(2)}) `
				+ `<img class="add-remove-pic" src="images/order-remove.png" onclick="removeItem(${dishIndex})"><br>`;
	}
	result += `</p>`;
	
	result += `<p>Subtotal: $${(currentSubtotal).toFixed(2)}<br>
	Tax: $${(currentSubtotal * taxRate).toFixed(2)}<br>
	Delivery Fee: $${restaurantData.delivery_fee.toFixed(2)}<br>`;

	currentTotal = currentSubtotal + (currentSubtotal * taxRate) + restaurantData.delivery_fee;
	result += `Total: $${currentTotal.toFixed(2)}<br></p>`;

	// decide whether to show the submit button
	if (currentSubtotal >= restaurantData.min_order) {
		result += `<div id="submit-area"><input type="button" id="submit-button" value="Submit Order" onclick="submitOrder()"></div>`;
	} else {
		result += `You must add $${(restaurantData.min_order-currentSubtotal).toFixed(2)} more to your order before submitting.`;
	}

	document.getElementById("order_summary").innerHTML = result;
}


//**********************************************************************//
// helper functions

// formatting restaurant data, assign each dish a unique index
function updateRestaurantData(res) {
	restaurantData = {
		_id: res._id,
		name: res.name,
		min_order: res.min_order,
		delivery_fee: res.delivery_fee,
		rate: res.rate,
		menu: {}
	};
	// populate each dish with unique index
	let menu = res.menu;
	let dishIndex = 0;
	for (let category in menu) {
		restaurantData.menu[category] = {};
		for (let dish of menu[category]) {
			restaurantData.menu[category][dishIndex++] = dish;
		}
	}
}


// return the dish object of given dish index
function getDishByIndex(index) {
	let category = getCategoryByIndex(index);
	if (category != null) return restaurantData.menu[category][index];
	else return null;
}


// return the category of given dish index
function getCategoryByIndex(index) {
	if (restaurantData.menu) {
		for (let category in restaurantData.menu) {
			if (restaurantData.menu[category].hasOwnProperty(index)) return category;
		}
	}
	return null;
}


// returns true if order is empty, false otherwise
function isEmpty(orderlist) {
    for (let dishIndex in orderlist) {
		if (orderlist[dishIndex] != 0)
            return false;
    }
    return true;
}