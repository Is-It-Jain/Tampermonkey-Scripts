// ==UserScript==
// @name         Amazon Ingredients Extractor 2
// @namespace    tampermonkey.net/
// @version      2.0.0.1
// @description  Extract ingredients from Amazon product pages
// @author       Parshwa Shah
// @match        https://www.amazon.com/*
// @grant        none
// ==/UserScript==
const strTest = str => /^[\(\)\[\]a-z;&%, 0-9]*$/gi.test(str);
var displayButton = true;

let DEVMODE = true;
let MAYBES = new Map();

var ingredientsMap = new Map();
var ingredientsList = [];

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

function check (name) {
    return name === "natural flavor" ||
        name === "artificial flavor" ||
        name === "natural and artificial flavor" ||
        name === "natural color" ||
        name === "artificial color" ||
        name === "natural and artificial color" ||
        name === "natural flavors" ||
        name === "artificial flavors" ||
        name === "natural and artificial flavors" ||
        name === "natural colors" ||
        name === "artificial colors" ||
        name === "natural and artificial colors"
}

function csvToJson(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines.shift().split(',');
    return lines.map(line => {
        const values = line.split(',');
        return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i]?.trim()]));
    });
}

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

function checkIngredient (ingredient, type) {
    let ingredientName = ingredient.name;
    if (ingredientsMap.has(ingredientName)) {
        return ingredientsMap.get(ingredientName)[type];
    }
    if(DEVMODE){
        MAYBES.set(ingredientName, true);
    }
    return "maybe";
}

function computeJain (ingredients) {
    var jain = "yes";

    var allJain = true;
    var anyNonVeg = false;
    var anyNonJain = false;
    let stop = false;
    for (let i = 0; i < ingredients.length; i++) {
        if(stop) {continue}
        var ingredient = ingredients [i];
        if (ingredient.subIngredients && ingredient.subIngredients.length > 0) {
            if(ingredients[i].jain == null){
                ingredients[i].jain = checkIngredient(ingredients[i], "jain");
            }
            let subJain = ingredients[i].jain;
            if (subJain === "no") { // if subIngredient is not jain
                allJain = allJain && false;
                return "no";
            } else if (subJain === "yes") { // if subIngredient is jain
                allJain = allJain && true;
            } else if (subJain === "maybe") { // if subIngredient is not sure jain
                allJain = allJain && false;
            }
        } else {
            if(ingredients[i].jain == null){
                ingredients[i].jain = checkIngredient(ingredients[i], "jain");
            }
            let jainVal = ingredients[i].jain;
            if (jainVal === "no") {
                allJain = allJain && false;
                return "no";
            } else if (jainVal === "yes") {
                allJain = allJain && true;
            } else if (jainVal === "maybe") {
                allJain = allJain && false;
            }
        }
    }

    if (allJain && !anyNonVeg) {
        jain = "yes"
    } else if (anyNonVeg || anyNonJain) {
        jain = "no"
    } else {
        jain = "maybe"
    }
    return jain;
}

function computeVegetarian (ingredients) {
    //TODO: change similar to compute Jain also change computeVegan has bugs.
    let veg = true;
    let maybe = false;
    for (let i in ingredients) {
        let ing = ingredients[i];
        if (ing.subIngredients) {
            if (ingredients[i].vegetarian == null){
                ingredients[i].vegetarian = checkIngredient(ingredients[i], "vegetarian");
            }
            let subVeg = ingredients[i].vegetarian;
            if (subVeg === "no"){
                return "no";
            } else if(subVeg === "yes"){
                veg = veg && true;
            } else {
                maybe = maybe || true;
            }
            continue;
        }
        if (ingredients[i].vegetarian == null){
            ingredients[i].vegetarian = checkIngredient(ingredients[i], "vegetarian");
        }
        let isVeg = ingredients[i].vegetarian;
        if (isVeg == "yes") {
            veg &= true;
        }
        else if (isVeg == "no") {
            return "no";
        }
        else {
            maybe = maybe || true;
        }
    }
    if (maybe) {
        return "maybe";
    } else {
        return "yes";
    }
}

function computeVegan(ingredients){
    let veg = true;
    let maybe = false;
    for (let i in ingredients) {
        let ing = ingredients[i];
        if (ing.subIngredients) {
            if (ingredients[i].vegan == null){
                ingredients[i].vegan = checkIngredient(ingredients[i], "vegan");
            }
            let subVeg = ingredients[i].vegan;
            if (subVeg === "no"){
                return "no";
            } else if(subVeg === "yes"){
                veg = veg && true;
            } else {
                maybe = maybe || true;
            }
            continue
        }
        if (ingredients[i].vegan == null){
            ingredients[i].vegan = checkIngredient(ingredients[i], "vegan");
        }
        let isVegan = ingredients[i].vegan;
        if (isVegan == "yes") {
            veg &= true;
        }
        else if (isVegan == "no") {
            return "no";
        }
        else {
            maybe = maybe || true;
        }
    }
    if (maybe) {
        return "maybe";
    }else {
        return "yes";
    }
}

function isJainTithi(ingredientName){
    return true
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
        displayButton &= ! (jain === "maybe") && !(veg === "maybe") && !(vegan === "maybe()");
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
    let otherIngredientsAsJson;
    let ingredientsList = [];

    // Extract product name
    const productNameElement = document.querySelector('span#productTitle');
    const productName = productNameElement ? productNameElement.innerText.trim() : 'N/A';

    const dietryList = [];

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
                otherIngredientsAsJson = convertToJsonArray(ingredients)[0];
                ingredientsList.push(...otherIngredientsAsJson);
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


    let jain = computeJain(ingredientsList);
    let veg = computeVegetarian(ingredientsList);
    let vegan = computeVegan(ingredientsList);

    let productDetail = {
        "data":{
            "version":"Version 2.0",
            "data":{
                "maindietary":[
                    {
                        "jain":jain
                    },
                    {
                        "vegetarian":veg
                    },
                    {
                        "vegan":vegan
                    },
                    {
                        "tithi":"maybe"
                    }
                ],
                "dietary":dietryList,
                "name":productName,
                "description":productDescription,
                "categories":categoriesList,
                "ingredients":ingredientsList,
                "barcode": upcValues,
                "weburl": cleanAmazonUrl(window.location.href),
                "brand":"Unkown",
                "images":imageSrcs,
                "store":[
                    "Amazon"
                ]
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
        console.log(otherIngredientsAsJson);

        displayBox.innerHTML = `
                    <h3>Jain : ${jain}</h3>
                    <h3>Vegetarian : ${veg}</h3>
                    <h3>Vegan : ${vegan}</h3>
                    <h3>URL : ${cleanAmazonUrl(window.location.href)}</h3>
                    <h3>Dietry : ${JSON.stringify(dietryList)}</h3>
                    <h3>Ingredients:</h3>
                    <p>${displayIngredientsTable(otherIngredientsAsJson)}</p>
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
                                //alert('Authenticated successfully!');
                                worked = true;
                                navigator.clipboard.writeText("").then(function() {

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
                                    //navigator.clipboard.writeText(productDetailsJson);

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
                if (!worked){
                    return;
                }
                navigator.clipboard.writeText(productDetailsJson).then(function() {

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
                    //navigator.clipboard.writeText(productDetailsJson);

                }, function(err) {
                    console.error('Could not copy text: ', err);
                });
            });
        } else {

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
        .replace(/contains less than.*?% of/gi, "")
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
    });

    return [structured, isSpecialCase, specialCaseData];
}

(function() {
    'use strict';

    // Wait for page to load completely
    window.addEventListener('load', function() {
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
            extractIngredients();
            document.body.removeChild(loadingBox); // Remove spinner
        }, 1000); // adjust time if needed


    });
})();
