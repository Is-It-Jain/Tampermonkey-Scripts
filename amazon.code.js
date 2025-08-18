const strTest = str => /^[\(\)\[\]a-z;&%, 0-9]*$/gi.test(str);
var displayButton = true;

let DEVMODE = false;
let BETTERDEVMODE = false;
let MAYBES = new Map();

var ingredientsMap = new Map();
var ingredientsList = [];

let dietryList = [];

function normalizeName(name) {
    return name
        .replace(/\[.*?\]/g, '')
        .replace(/contains less than.*?% of/gi, '')
        .replace(/as a preservative/gi, '')
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z0-9\s]/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function callback(error, responseJson) {
    let loadingElement = document.querySelector("div#loading-box");

    if (error) {
        // Remove loading spinner
        if (loadingElement) {
            loadingElement.remove();
        }

        // Display error message as dialog (alert for simplicity)
        alert("Error occurred: " + error.message || error);
        return; // Stop further processing
    }

    if (responseJson) {
        // Hide/remove loading spinner
        if (loadingElement) {
            loadingElement.remove();
        }

        //create a custom popup element:
        const popup = document.createElement('div');

        popup.style.padding = '30px';
        popup.style.backgroundColor = '#d4edda';
        popup.style.border = '1px solid #c3e6cb';
        popup.style.borderRadius = '10px';
        popup.style.zIndex = '9999';
        popup.innerText = "Success! Product Details Saved!";

        let displayDivElement = document.querySelector("div#display-box");
        displayDivElement.appendChild(popup);
        document.getElementById("save-button").hidden = true;
    }
}

function add(data){
    let username = localStorage.getItem('par-username');
    let secret = localStorage.getItem('par-secret');
    data["key"] = username + '--' + secret;
    data["data"]["addedBy"] = username;
    var request = new XMLHttpRequest();

    request.onload = function () {
        if (request.status >= 200 && request.status < 300) {
            callback(null, JSON.parse(request.responseText));
        } else {
            callback(new Error('Request failed: ' + request.status), null);
        }
    };
    request.onerror = function () {
        callback(new Error('Network error'), null);
    };
    request.open('POST','https://mainserver-776168167171.us-west1.run.app/v1/create');
    request.setRequestHeader('Accept', 'application/json');
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify(data));
}

function check(name) {
    // Tons of typos and variants for ambiguous ingredients
    const ambiguous = [
        "natural flavor", "artificial flavor", "natural and artificial flavor",
        "natural color", "artificial color", "natural and artificial color",
        "natural flavors", "artificial flavors", "natural and artificial flavors",
        "natural colors", "artificial colors", "natural and artificial colors",
        "color", "colors",
        "natral flavor", "natrul flavor", "naturl flavor", "naturall flavor", "natural falvor", "natural flaver", "natural flaovr", "natural flovour", "natural flavo", "natural flvour", "natural flvr", "natural flavoer",
        "artifical flavor", "artificial falvor", "artificial flaver", "artificial flaovr", "artificial flovour", "artificial flavo", "artificial flvour", "artificial flvr", "artificial flavoer",
        "natural and artifical flavor", "natural and artificial falvor", "natural and artificial flaver", "natural and artificial flaovr", "natural and artificial flovour", "natural and artificial flavo", "natural and artificial flvour", "natural and artificial flvr", "natural and artificial flavoer",
        "natural colour", "artificial colour", "natural and artificial colour", "natural colours", "artificial colours", "natural and artificial colours",
        "colour", "colours", "colur", "colro", "colr", "colar", "collor", "coolor", "collour", "coloour",
        "natral color", "natrul color", "naturl color", "naturall color", "natural colro", "natural colur", "natural colr", "natural colar", "natural collor", "natural coolor",
        "artifical color", "artificial colro", "artificial colur", "artificial colr", "artificial colar", "artificial collor", "artificial coolor",
        "natural and artifical color", "natural and artificial colro", "natural and artificial colur", "natural and artificial colr", "natural and artificial colar", "natural and artificial collor", "natural and artificial coolor",
        "natural falvours", "natural flavoers", "natural flovors", "natural flvours", "natural flvr", "natural flavoers",
        "artificial falvours", "artificial flavoers", "artificial flovors", "artificial flvours", "artificial flvr", "artificial flavoers",
        "natural and artificial falvours", "natural and artificial flavoers", "natural and artificial flovors", "natural and artificial flvours", "natural and artificial flvr", "natural and artificial flavoers",
        "natural colros", "natural coluors", "natural colrs", "natural colars", "natural collors", "natural coolors",
        "artificial colros", "artificial coluors", "artificial colrs", "artificial colars", "artificial collors", "artificial coolors",
        "natural and artificial colros", "natural and artificial coluors", "natural and artificial colrs", "natural and artificial colars", "natural and artificial collors", "natural and artificial coolors"
    ];
    name = normalizeName(name);
    if (ingredientsMap.has(name)){
        return  (ingredientsMap.get(name).jain === "maybe" || ingredientsMap.get(name).vegetarian === "maybe" || ingredientsMap.get(name).vegan === "maybe");
    }
    return ambiguous.includes(name);
}

function csvToJson(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines.shift().split(',');
    return lines.map(line => {
        const values = line.split(',');
        return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i]?.trim()]));
    });
}

let startCalculation = false;

if (DEVMODE && !BETTERDEVMODE) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.id = 'DEVCSVUPLOAD';
    fileInput.style.position = 'fixed';
    fileInput.style.top = '10px';
    fileInput.style.left = '10px';
    fileInput.style.zIndex = 10001;
    fileInput.title = 'Upload custom ingredients CSV';
    document.body.appendChild(fileInput);

    // Start extraction after upload
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            const csv = evt.target.result;
            const jsonData = csvToJson(csv);
            if (!jsonData || !jsonData.length) {
                alert('CSV file is empty or invalid.');
                return;
            }
            ingredientsList.length = 0;
            ingredientsMap.clear();
            for (const row of jsonData) {
                const key = normalizeName(row.name);
                ingredientsList.push(key);
                ingredientsMap.set(key, row);
            }
            window.ingredientsMap = ingredientsMap;
            alert('Custom CSV loaded: ' + jsonData.length + ' rows.');
            if (typeof window.startLoad === 'function') {
                startCalculation = true;
                window.startLoad();
            }
        };
        reader.readAsText(file);
    });

    // Fallback to remote fetch if no upload after short delay
    setTimeout(() => {
        if (typeof window.startLoad === 'function') {
            window.startLoad();
        }
    }, 1200);
}
if (!DEVMODE){
    fetch('https://is-it-jain.github.io/Tampermonkey-Scripts/ingredients-with-reason.csv')
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch CSV');
        return response.text();
    })
    .then(csv => {
        const jsonData = csvToJson(csv);
        console.log("CSV loaded", jsonData.length);
        for (const row of jsonData) {
            const key = normalizeName(row.name);
            ingredientsList.push(key);
            ingredientsMap.set(key, row);
        }
        window.ingredientsMap = ingredientsMap;
        console.log(ingredientsMap);
    })
    .catch(err => {
        console.error("Failed to fetch CSV:", err);
    });
}else if (BETTERDEVMODE) {
    fetch(`https://localhost:8080/${prompt("What is name of csv in the same directory as the amazon.code.js?")}.csv`)
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch CSV');
        return response.text();
    })
    .then(csv => {
        const jsonData = csvToJson(csv);
        console.log("CSV loaded", jsonData.length);
        for (const row of jsonData) {
            const key = normalizeName(row.name);
            ingredientsList.push(key);
            ingredientsMap.set(key, row);
        }
        window.ingredientsMap = ingredientsMap;
        console.log(ingredientsMap);
    })
    .catch(err => {
        console.error("Failed to fetch CSV:", err);
    });
}

function checkIngredient (ingredient, type) {
    let ingredientName = ingredient.name;
    // If the ingredient has subIngredients, use the appropriate compute function and do NOT add to MAYBES
    console.log(ingredient)
    if (ingredient.subIngredients) {
        // Special case: if exactly 1 subingredient and parent exists in CSV, use parent's value directly
        if (ingredient.subIngredients.length === 1 && ingredientsMap.has(ingredientName)) {
            return ingredientsMap.get(ingredientName)[type];
        }
        
        // Normal case for multiple subingredients or when parent not in CSV
        if (type === "jain") {
            return computeJain(ingredient.subIngredients);
        } else if (type === "vegetarian") {
            return computeVegetarian(ingredient.subIngredients);
        } else if (type === "vegan") {
            return computeVegan(ingredient.subIngredients);
        } else {
            return "maybe";
        }
    }
    // Otherwise, check the map as before
    if (ingredientsMap.has(ingredientName)) {
        if(type !== "jain" && (dietryList.includes('Vegan') || dietryList.includes('plant-based') || dietryList.includes('Plant Based') || dietryList.includes('Plant-based'))) {
            return "yes";
        } else if(check(ingredientName)) {
            if  (dietryList.includes('Vegan') || dietryList.includes('plant-based') || dietryList.includes('Plant Based') || dietryList.includes('Plant-based')) {
                return "yes";
            }
            return "maybe";
        }
        return ingredientsMap.get(ingredientName)[type];
    }
    if (DEVMODE && !BETTERDEVMODE) {
        let arr = Array.from(ingredientsMap.keys());
        for (let i = 0; i < arr.length; i++) {
            if (ingredientName.includes(arr[i])) {
                console.log("Found in map: " + arr[i]);
                console.log("For " + ingredientName)
                return ingredientsMap.get(arr[i])[type];
            }
        }
    }
    // Only add to MAYBES if there are NO subIngredients
    if (DEVMODE && (!Array.isArray(ingredient.subIngredients) || ingredient.subIngredients.length === 0)) {
        MAYBES.set(ingredientName, true);
    }
    return "maybe";
}

function computeJain (ingredients) {
    let foundMaybe = false;
    let foundValid = false;
    for (let i = 0; i < ingredients.length; i++) {
        let ingredient = ingredients[i];
        if (check(ingredient.name)) {
            // skip this ingredient entirely
            continue;
        }
        foundValid = true;
        let value;
        if (ingredient.subIngredients && ingredient.subIngredients.length > 0) {
            value = checkIngredient(ingredient, "jain");
        } else {
            if (ingredient.jain == null) {
                ingredient.jain = checkIngredient(ingredient, "jain");
            }
            value = ingredient.jain;
        }
        if (value === "no") {
            return "no";
        } else if (value === "maybe") {
            foundMaybe = true;
        }
    }
    if (!foundValid) return "yes";
    return foundMaybe ? "maybe" : "yes";
}

function computeVegetarian (ingredients) {
    let foundMaybe = false;
    let foundValid = false;
    for (let i = 0; i < ingredients.length; i++) {
        let ing = ingredients[i];
        if (check(ing.name)) {
            continue; // skip this ingredient entirely
        }
        foundValid = true;
        let value;
        if (ing.subIngredients && ing.subIngredients.length > 0) {
            value = checkIngredient(ing, "vegetarian");
        } else {
            if (ing.vegetarian == null) {
                ing.vegetarian = checkIngredient(ing, "vegetarian");
            }
            value = ing.vegetarian;
        }
        if (value === "no") {
            return "no";
        } else if (value === "maybe") {
            foundMaybe = true;
        }
    }
    if (!foundValid) return "yes";
    return foundMaybe ? "maybe" : "yes";
}

function computeVegan(ingredients){
    let foundMaybe = false;
    let foundValid = false;
    for (let i = 0; i < ingredients.length; i++) {
        let ing = ingredients[i];
        if (check(ing.name)) {
            continue; // skip this ingredient entirely
        }
        foundValid = true;
        let value;
        if (ing.subIngredients && ing.subIngredients.length > 0) {
            value = checkIngredient(ing, "vegan");
        } else {
            if (ing.vegan == null) {
                ing.vegan = checkIngredient(ing, "vegan");
            }
            value = ing.vegan;
        }
        if (value === "no") {
            return "no";
        } else if (value === "maybe") {
            foundMaybe = true;
        }
    }
    if (!foundValid) return "yes";
    return foundMaybe ? "maybe" : "yes";
}

function displayIngredients (ingredients, subCount = 0) {
    let displayString = "";
    let sub = "";
    for (let i = 0; i < subCount; i++){
        sub += "- ";
    }
    for (let i = 0; i < ingredients.length; i++) {
        let jain = ingredients[i].jain;
        let veg = ingredients[i].vegetarian;
        let vegan = ingredients[i].vegan;
        // Hide the button if any ingredient is maybe, but now when check()
        if (!check(ingredients[i].name)) {
            if (jain === "maybe" || veg === "maybe" || vegan === "maybe") {
                displayButton = false;
            }
        }
        displayString += "<tr>";
        displayString += "<td>" + sub + ingredients[i].name + "</td>";
        displayString += "<td>" + jain + "</td>";
        displayString += "<td>" + veg + "</td>";
        displayString += "<td>" + vegan + "</td>";
        displayString += "</tr>";
        if (ingredients[i].subIngredients) {
            displayString += displayIngredients(ingredients[i].subIngredients, subCount + 1);
        }
    }
    return displayString;
}

function displayIngredientsTable (ingredients) {
    var displayString = "<table><tr><th>Name</th><th>Jain?</th><th>Vegetarian?</th><th>Vegan?</th></tr>";

    displayString += displayIngredients(ingredients);
    if(DEVMODE){
        let array = MAYBES.keys().toArray()
        let data = ""
        for (let i in array){
            let dat = array[i]
            data += "<tr><td>" + dat + "</td></tr>"
        }
        displayString += data;
    }

    displayString += "</table>";
    return displayString;
}

function cleanAmazonUrl(url) {
  try {
    const urlObj = new URL(url);

    // Remove all query parameters
    urlObj.search = '';

    // Remove /ref=... part in pathname
    urlObj.pathname = urlObj.pathname.replace(/\/ref=.*$/, '');

    return urlObj.toString();
  } catch (e) {
    return 'Invalid URL';
  }
}



// Function to extract ingredients
function extractIngredients() {
    // Common selectors where ingredients might be found
    const possibleSelectors = [
        '#nic-ingredients-content'
    ];

    let ingredients = '';
    let ingredientsListForDiet = [];

    // Extract product name
    const productNameElement = document.querySelector('span#productTitle');
    const productName = productNameElement ? productNameElement.innerText.trim() : 'N/A';

    const dietryListData = document.getElementsByClassName('a-size-base a-color-base _cse-nutritional-info-and-ingredient-card_style_dilText__1iIqY');

    for (let i = 0; i < dietryListData.length; i++) {
        const element = dietryListData[i];
        const text = element.innerText.trim();
        if (text) {
            dietryList.push(text);
        }
    }

    // Extract product description
    const productDescriptionElement = document.querySelector('div#productDescription_feature_div');
    const productDescriptionSpanElement = productDescriptionElement? productDescriptionElement.querySelector('span') : undefined;
    const productDescription = productDescriptionSpanElement ? productNameElement.innerText.trim() : 'N/A';

    // Extract ingredients
    for (let selector of possibleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            const text = element.firstChild.textContent.trim();
            if (text) {
                ingredients = text;
                ingredientsListForDiet = convertToJsonArray(ingredients)[0];
            }
        }
    }

    // extract categories
    const categotiesElement = document.querySelector('div#desktop-breadcrumbs_feature_div');
    const categotiesListElement = categotiesElement.querySelectorAll('a.a-link-normal');
    const categoriesList = [];
    categotiesListElement.forEach(categoryLinkElement => {
        var categoriesText = categoryLinkElement.innerText.trim();
        if (categoriesText != 'Categories') {
            categoriesList.push(categoriesText);
        }
    });

    const nutritionsDivElement = document.querySelector('div.nutrition-panel');
    const nutritionsFacts = {};

    const container = document.querySelector('#main-image-container');
    const imgElements = container.querySelectorAll('img');
    const imageSrcs = Array.from(imgElements)
        .map(img => img.getAttribute('src'))
        .filter(src => src && src.startsWith('http') && !src.endsWith("gif"));
    console.log(JSON.stringify(imageSrcs, null, 2));

    const productDetailsElement = document.querySelector('div#detailBullets_feature_div');
    const bulletItems = document.querySelectorAll('#detailBullets_feature_div .a-list-item');
    let upcValues = [];
    for (const item of bulletItems) {
        const labelSpan = item.querySelector('.a-text-bold');
        if (labelSpan && labelSpan.textContent.trim().startsWith('UPC')) {
            const valueSpan = labelSpan.nextElementSibling;
            if (valueSpan) {
                const upcValue = valueSpan.textContent.trim();
                upcValues = upcValue.split(/\s+/);
                console.log('UPC:', upcValues);
            }
            break;
        }
    }

    let jain = computeJain(ingredientsListForDiet);
    let veg = computeVegetarian(ingredientsListForDiet);
    let vegan = computeVegan(ingredientsListForDiet);

    let productDetail = {
        "data":{
            "version":"Version 2.0",
            "data":{
                "maindietary":[
                    { "jain":jain },
                    { "vegetarian":veg },
                    { "vegan":vegan },
                    { "tithi":"maybe" }
                ],
                "dietary":dietryList,
                "name":productName,
                "description":productDescription,
                "categories":categoriesList,
                "ingredients":ingredientsListForDiet,
                "barcode": upcValues,
                "weburl": cleanAmazonUrl(window.location.href),
                "brand":"Unkown",
                "images":imageSrcs,
                "store":[ "Amazon" ]
            },
            "status":"NEW"
        },
        "database":"Items",
        "source":"TAMPERPARSHWA"
    }

    // Convert JSON object to string with indentation
    const productDetailsJson = JSON.stringify(productDetail, null, 2);
    // Output JSON to console
    console.log('Product Details JSON:', productDetailsJson);

    // Check if item already exists before creating display
    function checkIfItemExists(barcodes, itemName, callback) {
        // If no barcodes found, proceed normally
        if (!barcodes || barcodes.length === 0) {
            console.log('No barcode found, proceeding with analysis');
            callback(true);
            return;
        }

        // Use the first barcode for the check
        const barcode = barcodes[0];
        const encodedBarcode = encodeURIComponent(barcode);
        const getRequest = new XMLHttpRequest();
        getRequest.open('GET', `https://mainserver-776168167171.us-west1.run.app/v1/getItem?q=${encodedBarcode}`, true);
        
        getRequest.onreadystatechange = function() {
            if (getRequest.readyState === 4) {
                if (getRequest.status === 200) {
                    try {
                        const response = JSON.parse(getRequest.responseText);
                        console.log('API Response:', response);
                        
                        // Check if response["0"] exists and is not null
                        const hasItems = response["0"] != null;
                        
                        if (hasItems) {
                            // Item exists - show confirmation dialog
                            const shouldUpdate = confirm(`Item with barcode "${barcode}" already exists in the database. Do you want to continue and potentially update it?`);
                            if (shouldUpdate) {
                                console.log('User chose to continue with existing item');
                                callback(true);
                            } else {
                                console.log('User chose to cancel - item already exists');
                                callback(false);
                            }
                        } else {
                            // Item doesn't exist, proceed normally
                            console.log('No existing items found, proceeding with analysis');
                            callback(true);
                        }
                    } catch (e) {
                        console.error('Error parsing response:', e);
                        callback(true); // Proceed if parsing fails
                    }
                } else {
                    console.error('Error checking item existence:', getRequest.status);
                    callback(true); // Proceed if check fails
                }
            }
        };
        
        getRequest.onerror = function() {
            console.error('Network error checking item existence');
            callback(true); // Proceed if network error
        };
        
        getRequest.send();
    }

    // Check if item exists first, then create display
    checkIfItemExists(upcValues, productName, function(shouldProceed) {
        if (!shouldProceed) {
            // User chose not to proceed, show a simple message
            const displayBox = document.createElement('div');
            displayBox.style.position = 'fixed';
            displayBox.style.top = '40px';
            displayBox.style.right = '10px';
            displayBox.style.padding = '10px';
            displayBox.style.backgroundColor = '#fff3cd';
            displayBox.style.border = '1px solid #ffeaa7';
            displayBox.style.borderRadius = '5px';
            displayBox.style.zIndex = '9999';
            displayBox.style.maxWidth = '400px';
            displayBox.innerHTML = `
                <h3>Product Check Cancelled</h3>
                <p>Item with this barcode already exists in database. Analysis cancelled.</p>
            `;
            document.body.appendChild(displayBox);
            return;
        }

        // Create a floating display box
        if (ingredients) {
        const displayBox = document.createElement('div');
        displayBox.id = 'display-box';
        displayBox.style.position = 'fixed';
        displayBox.style.top = '40px';
        displayBox.style.right = '10px';
        displayBox.style.padding = '10px';
        displayBox.style.backgroundColor = '#ffffff';
        displayBox.style.border = '1px solid #ddd';
        displayBox.style.borderRadius = '5px';
        displayBox.style.zIndex = '9999';
        displayBox.style.maxWidth = '400px';
        displayBox.style.maxHeight = '700px';
        displayBox.style.overflow = 'auto';

        displayBox.innerHTML = `
            <h3>Jain : ${jain}</h3>
            <h3>Vegetarian : ${veg}</h3>
            <h3>Vegan : ${vegan}</h3>
            <h3>URL : ${cleanAmazonUrl(window.location.href)}</h3>
            <h3>Dietry : ${JSON.stringify(dietryList)}</h3>
            <h3>Ingredients:</h3>
            <p>${displayIngredientsTable(ingredientsListForDiet)}</p>
        `;
        document.body.appendChild(displayBox);

        console.log("displayButton: " + displayButton);

        if(displayButton) {
            // Optionally, create a button to copy JSON to clipboard
            const copyButton = document.createElement('button');
            copyButton.innerText = 'Save Product Details';
            copyButton.id = 'save-button';
            copyButton.style.backgroundColor = '#ADD8E6';
            copyButton.style.border = '2px solid #ddd';
            copyButton.style.borderRadius = '10px';
            copyButton.style.textAlign = 'left';
            copyButton.style.fontSize = '30px';
            copyButton.style.zIndex = 9999;
            displayBox.appendChild(copyButton);

            copyButton.addEventListener('click', function() {
                let worked = false;
                let username = localStorage.getItem('par-username');
                let secret = localStorage.getItem('par-secret');

                function sendRequest(user, pass) {
                    var request = new XMLHttpRequest();
                    request.open('POST', 'https://mainserver-776168167171.us-west1.run.app/v1/login', true);
                    request.setRequestHeader('Content-Type', 'application/json');

                    request.onreadystatechange = function () {
                        if (request.readyState === 4) {
                            if (request.status === 200 && request.responseText.trim() === 'GOOD') {
                                localStorage.setItem('par-username', user);
                                localStorage.setItem('par-secret', pass);
                                worked = true;
                                
                                navigator.clipboard.writeText("").then(function() {
                                    const loadingBox = document.createElement('div');
                                    loadingBox.id = 'loading-box';
                                    loadingBox.style.position = 'fixed';
                                    loadingBox.style.top = '40px';
                                    loadingBox.style.right = '10px';
                                    loadingBox.style.padding = '20px';
                                    loadingBox.style.backgroundColor = '#ffffff';
                                    loadingBox.style.border = '1px solid #ddd';
                                    loadingBox.style.borderRadius = '5px';
                                    loadingBox.style.zIndex = '10000';
                                    loadingBox.style.display = 'flex';
                                    loadingBox.style.justifyContent = 'center';
                                    loadingBox.style.alignItems = 'center';
                                    loadingBox.innerHTML = `<div style="
                                      width: 300px;
                                      height: 300px;
                                      border: 4px solid #ccc;
                                      border-top: 4px solid #3498db;
                                      border-radius: 50%;
                                      animation: spin 1s linear infinite;
                                      "></div>
                                      `;
                                    document.body.appendChild(loadingBox);
                                    add(productDetail);
                                }, function(err) {
                                    console.error('Could not copy text: ', err);
                                });
                            } else {
                                alert('Authentication failed. You messed up.');
                            }
                        }
                    };
                    var data = JSON.stringify({ key: user+'--'+pass });
                    request.send(data);
                }

                if (!username || !secret) {
                    username = prompt('Enter your username:');
                    secret = prompt('Enter your password:');
                    if (!username || !secret) {
                        alert('Username and password are required.');
                        return;
                    }
                }
                sendRequest(username, secret);
            });
        }
    } else {
        const displayBox = document.createElement('div');
        displayBox.style.position = 'fixed';
        displayBox.style.top = '10px';
        displayBox.style.right = '10px';
        displayBox.style.padding = '10px';
        displayBox.style.backgroundColor = '#f8f8f8';
        displayBox.style.border = '1px solid #ddd';
        displayBox.style.borderRadius = '5px';
        displayBox.style.zIndex = '9999';
        displayBox.style.maxWidth = '400px';
        displayBox.style.maxHeight = '500px';
        displayBox.style.overflow = 'auto';
        displayBox.innerHTML = `
            <h3>Ingredients:</h3>
            <p>Unable to find ingredients, please look for another item.</p>
        `;
        document.body.appendChild(displayBox);
    }
    }); // Close the checkIfItemExists callback
}

function splitIngredient(item2) {
    let item = "";
    let name = item2.trim();
    let sub = null;
    let depth = 0;
    let start = -1;

    for (let i = 0; i < item2.length; i++) {
        item += item2[i];
        if (item2[i] === '(') {
            if (depth === 0) start = i;
            depth++;
        } else if (item2[i] === ')') {
            depth--;
            if (depth === 0) break;
        }
    }

    // If there's still an unmatched `(`, auto-close it
    while (depth > 0) {
        item += ')';
        depth--;
    }

    if (start === -1) {
        // No parentheses found
        return [item2.trim(), null];
    }

    name = item.slice(0, start).trim();
    sub = item.slice(start + 1, item.length - 1).trim();

    return [name, sub];
}   

function convertToJsonArray(input) {
    input = input
        .split(/CONTAINS:/gi)[0]
        .replace(/AND\/OR/gi, ', ')
        .replace(/&/gi, ', ')
        .replace(/\*/gi, ', ')
        .replace(/<.*?>/gi, "")
        .replace(/ingredients:/gi, "")
        .replace(/contains less than.*?% of/gi, "")
        .replace(/\./gi, ', ')
        .replace(/\:/gi, ', ')
        .replace(/the following/gi, '')
        .replace(/\.$/g, '')
        .replace(/\[/g, '(')
        .replace(/\]/g, ')')
        .replace(/\s+/g, ' ')
        .replace(/ AND /gi, ', ')
        .replace(/ OR /gi, ', ')
        .replace(/ ,/gi, ',');

    const result = [];
    let current = '';
    let depth = 0;

    for (let char of input) {
        if ((char === ',' || char === ';') && depth === 0) {
            if (current.trim()) {
                result.push(current.trim());
            }
            current = '';
        } else {
            if (char === '(') depth++;
            else if (char === ')') depth--;
            if (strTest(char)) {
                current += char;
            }
        }
    }

    if (current.trim()) result.push(current.trim());

    const finalList = result.map(item => item.replace(/^and\s+/i, '').trim());

    let isSpecialCase = false;
    let specialCaseData = undefined;

    const structured = finalList.map(item => {
        const [name, subString] = splitIngredient(item);
        let ingredient = {
            name: normalizeName(name),
            jain: null,
            vegetarian: null,
            vegan: null,
            subIngredients: null
        };
        if (ingredient.name.replace(/[0-9]/gi, '') == "") {return {name: "NOT REAL"};}

        if (subString) {
            const [subIngredients, isSpecialCase2, specialCaseData2] = convertToJsonArray(subString);
            ingredient.subIngredients = subIngredients;

            if (ingredient.name === "emulsifier") {
                isSpecialCase = true;
                specialCaseData = subIngredients;
            }

            if (isSpecialCase2) {
                ingredient.subIngredients.push({
                    name: "emulsifier",
                    jain: ingredient.jain,
                    vegetarian: ingredient.vegetarian,
                    vegan: ingredient.vegan,
                    subIngredients: specialCaseData2
                });
            }
        }

        ingredient.vegan = checkIngredient(ingredient, "vegan");
        ingredient.vegetarian = checkIngredient(ingredient, "vegetarian");
        ingredient.jain = checkIngredient(ingredient, "jain");

        return ingredient;

    }).filter(item => item.name !== "NOT REAL");

    return [structured, isSpecialCase, specialCaseData];
}

(function() {
    'use strict';

    // Wait for page to load completely
    window.startLoad = function() {
        // Show loading spinner first
        // Create and show a CSS loading spinner
        const loadingBox = document.createElement('div');
        loadingBox.id = 'loading-box';
        loadingBox.style.position = 'fixed';
        loadingBox.style.top = '40px';
        loadingBox.style.right = '10px';
        loadingBox.style.padding = '20px';
        loadingBox.style.backgroundColor = '#ffffff';
        loadingBox.style.border = '1px solid #ddd';
        loadingBox.style.borderRadius = '5px';
        loadingBox.style.zIndex = '10000';
        loadingBox.style.display = 'flex';
        loadingBox.style.justifyContent = 'center';
        loadingBox.style.alignItems = 'center';
        loadingBox.innerHTML = `<div style="
                                  width: 30px;
                                  height: 30px;
                                  border: 4px solid #ccc;
                                  border-top: 4px solid #3498db;
                                  border-radius: 50%;
                                  animation: spin 1s linear infinite;
                                  "></div>
                                  `;
        // Add animation CSS (only once)
        if (!document.getElementById('spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.innerHTML = `
                               @keyframes spin {
                                     0% { transform: rotate(0deg); }
                                     100% { transform: rotate(360deg); }
                               }
                               `;
            document.head.appendChild(style);
        }

        // Simulate loading (or replace with real async logic)
        setTimeout(() => {

            // Run the extraction
            if(!startCalculation) {
                return;
            }
            extractIngredients();
            document.body.removeChild(loadingBox); // Remove spinner
        }, 1000); // adjust time if needed


    };
    if (!DEVMODE || BETTERDEVMODE) {
        startCalculation = true;
        // Always start loading when the script runs in non-dev mode
        window.startLoad();
    }
})();
