// ==UserScript==
// @name         Amazon Ingredients Extractor
// @namespace    tampermonkey.net/
// @version      2.0.0.0
// @description  Extract ingredients from Amazon product pages
// @author       Parshwa Shah
// @match        https://www.amazon.com/*
// @grant        none
// ==/UserScript==
const strTest = str => /^[\(\)\[\]a-z;&%, 0-9]*$/gi.test(str);
var displayButton = true;

var jainIngredients = [];
var nonJainIngredients = [];
var veganIngredients = [];
var nonVeganIngredients = [];
var vegetarianIngredients = [];
var notVegetarianIngredients = [];
var ingredientsMap = new Map();
var ingredientsList = [];

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

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // delete
          dp[i][j - 1],    // insert
          dp[i - 1][j - 1] // substitute
        );
      }
    }
  }

  return dp[m][n];
}

function findWordMatchScore(ingredient, input) {
  const ingredientWords = ingredient.toLowerCase().split(/\s+/);
  const inputWords = input.toLowerCase().split(/\s+/);

  let bestWordDistance = Infinity;

  for (const iw of ingredientWords) {
    for (const tw of inputWords) {
      if (iw === tw) return { distance: 0, word: iw }; // exact match
      const dist = levenshtein(iw, tw);
      if (dist < bestWordDistance) {
        bestWordDistance = dist;
      }
    }
  }

  return { distance: bestWordDistance };
}

function findNearestIngredientMatchWithConfidence(ingredientList, input) {
  let bestMatch = null;
  let bestScore = Infinity;

  for (const ingredient of ingredientList) {
    const { distance } = findWordMatchScore(ingredient, input);
    if (distance < bestScore) {
      bestScore = distance;
      bestMatch = ingredient;
    }
  }

  // Confidence = 1 - (normalized word-level distance)
  // Normalized using average word length (or 10 as safe default)
  const averageWordLength = 6;
  const confidence = Math.max(0, 1 - bestScore / averageWordLength);

  return {
    match: bestMatch,
    confidence: confidence.toFixed(2)
  };
}

function check (name) {return
                       name === "natural flavor" ||
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
                       name === "natural and artificial colors"}

function csvToJson(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines.shift().split(',');
    return lines.map(line => {
        const values = line.split(',');
        return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i]?.trim()]));
    });
}




fetch('https://is-it-jain.github.io/Tampermonkey-Scripts/ingredients-with-reason.csv').then(response => {
    if (!response.ok) throw new Error('Failed to fetch CSV');
    return response.text();
}).then(csv => {
    const jsonData = csvToJson(csv);
    localStorage.setItem("json", jsonData);
    console.log("jsonData");
    console.log(jsonData);
    for(let i in jsonData){
        let ingredient_details = jsonData[i];
        let name = ingredient_details.name
        ingredientsList.push(name);
        ingredientsMap.set(name,ingredient_details);

        //TODO: remove following code

        if (ingredient_details.jain.toLowerCase() === "yes"){
            jainIngredients.push(name);
        }else{
            nonJainIngredients.push(name,);
        }
        if (ingredient_details.vegan.toLowerCase() === "yes"){
            veganIngredients.push(name);
        }else{
            nonVeganIngredients.push(name);
        }
        if (ingredient_details.vegetarian.toLowerCase() === "yes"){
            vegetarianIngredients.push(name);
        }else{
            notVegetarianIngredients.push(name);
        }
        //TODO: remove above code
    }

    localStorage.setItem("ingredients Data", JSON.stringify({
        "ingredientsList": ingredientsList,
        "ingredientsMap": ingredientsMap,
        "jy": jainIngredients,
        "jn": nonJainIngredients,
        "vy": veganIngredients,
        "vn": nonVeganIngredients,
        "vegy": vegetarianIngredients,
        "vegn": notVegetarianIngredients,
        "loaded": 0
    }));

}).catch(err => {
    callback(err, null);
});


function isJain(ingredientName){
    return jainIngredients.includes(ingredientName.toLowerCase()) && !nonJainIngredients.includes(ingredientName.toLowerCase());
}

function isNonJain(ingredientName){
    return nonJainIngredients.includes(ingredientName.toLowerCase()) || notVegetarianIngredients.includes(ingredientName.toLowerCase());
}

function computeJainSinglIngredient (ingredient) {
    if(ingredient && ingredient.name) {
        if (check(ingredient.name)){
            return "MAYBE";
        }
        if (ingredient.jain !== null){
            return ingredient.jain;
        }
        var vegSingle = ingredient.vegetarian;
        if (vegSingle == null){
            vegSingle = computeVegSinglIngredient(ingredient);
        }
        var isJainValue = isJain(ingredient.name);
        var isNotJainValue = isNonJain(ingredient.name);
        if (ingredient.subIngredients && ingredient.subIngredients.length > 0) {
            var subJain = computeJain(ingredient.subIngredients);
            if (subJain === "NO") { // if subIngredient is not jain
                return "NO";
            } else if (subJain === "YES") { // if subIngredient is jain
                return "YES";
            } else if (subJain === "MAYBE") { // if subIngredient is not sure jain
                if (isJainValue && !isNotJainValue) {
                    return "YES";
                } else if (isNotJainValue || vegSingle === "NO") {
                    return "NO";
                }
                return "MAYBE";
            }
        } else if(isJainValue) { // if ingredient is jain
            return "YES";
        } else if (isNotJainValue || vegSingle === "NO") {// if ingredient is non vegetarian or non jain
            return "NO";
        } else { // not sure it is jain or not.
            let nearestMatchIngredient = null;
            nearestMatchIngredient = findNearestIngredientMatchWithConfidence( jainIngredients, ingredient.name );
            if (nearestMatchIngredient.confidence > 0.9){
                if (check(nearestMatchIngredient.match)){
                    return "MAYBE";
                }
                console.log(`${ingredient.name} to ${nearestMatchIngredient.match} with confidence ${nearestMatchIngredient.confidence}`);
                return "YES";
            } else {
                nearestMatchIngredient = findNearestIngredientMatchWithConfidence( nonJainIngredients, ingredient.name );
                if (nearestMatchIngredient.confidence > 0.9){
                    console.log(`${ingredient.name} to ${nearestMatchIngredient.match} with confidence ${nearestMatchIngredient.confidence}`);
                    if (check(nearestMatchIngredient.match)){
                        return "MAYBE";
                    }
                    return "NO";
                } else {
                    return "MAYBE";
                }
            }
        }
    }
    return "MAYBE";
}

function computeJain (ingredients) {
    var jain = "YES";

    var allJain = true;
    var anyNonVeg = false;
    var anyNonJain = false;
    let stop = false;
    for (let i = 0; i < ingredients.length; i++) {
        if(stop) {continue}
        var ingredient = ingredients [i];
        if (ingredient.subIngredients && ingredient.subIngredients.length > 0) {
            if(ingredients[i].jain == null){
                ingredients[i].jain = computeJainSinglIngredient(ingredients[i]);
            }
            let subJain = ingredients[i].jain;
            if (subJain === "NO") { // if subIngredient is not jain
                allJain = allJain && false;
                return "NO";
            } else if (subJain === "YES") { // if subIngredient is jain
                allJain = allJain && true;
            } else if (subJain === "MAYBE") { // if subIngredient is not sure jain
                allJain = allJain && false;
            }
        } else {
            if(ingredients[i].jain == null){
                ingredients[i].jain = computeJainSinglIngredient(ingredients[i]);
            }
            let jainVal = ingredients[i].jain;
            if (jainVal === "NO") {
                allJain = allJain && false;
                return "NO";
            } else if (jainVal === "YES") {
                allJain = allJain && true;
            } else if (jainVal === "MAYBE") {
                allJain = allJain && false;
            }
        }
    }

    if (allJain && !anyNonVeg) {
        jain = "YES"
    } else if (anyNonVeg || anyNonJain) {
        jain = "NO"
    } else {
        jain = "MAYBE"
    }
    return jain;
}

function isNotVegetarian(ingredientName){
    return notVegetarianIngredients.includes(ingredientName.toLowerCase());
}

function isVegetarian(ingredientName){
    return jainIngredients.includes(ingredientName.toLowerCase()) ||
       vegetarianIngredients.includes(ingredientName.toLowerCase()) ||
       veganIngredients.includes(ingredientName.toLowerCase());
}

function computeVegSinglIngredient (ingredient) {
    if (check(ingredient.name)){
        return "MAYBE";
    }
    if (ingredient.vegetarian){
        return ingredient.vegetarian;
    }
    let isVeg = "MAYBE";
    if (ingredient.subIngredients) {
        let isVeg = computeVeg(ingredient.subIngredients);

        if (isVeg === "NO") { // if subIngredient is not jain
            return "NO";
        } else if (isVeg === "YES") { // if subIngredient is jain
            return "YES";
        } else if (isVeg === "MAYBE") { // if subIngredient is not sure jain

            if ( (isVegetarian(ingredient.name) || isVegan(ingredient.name)) && !isNotVegetarian(ingredient.name)) {
                return "YES";
            } else if (isNotVegetarian(ingredient.name)) {
                return "NO";
            }
            return "MAYBE";
        }
    }
    if( (isVegetarian(ingredient.name) || isVegan(ingredient.name)) && !isNotVegetarian(ingredient.name)){
        return "YES";
    } else if (isNotVegetarian(ingredient.name)){
        return "NO";
    } else {
        let tmp = null;
        let tmp2 = null;
        let tmp3 = null;
        tmp = findNearestIngredientMatchWithConfidence( vegetarianIngredients, ingredient.name );
        tmp2 = findNearestIngredientMatchWithConfidence( jainIngredients, ingredient.name );
        tmp3 = findNearestIngredientMatchWithConfidence( veganIngredients, ingredient.name );
        if (tmp.confidence > 0.9 || tmp2.confidence > 0.9 || tmp3.confidence > 0.9){
            console.log(`${ingredient.name} to ${tmp.match} with confidence ${tmp.confidence}`);
            console.log(`${ingredient.name} to ${tmp2.match} with confidence ${tmp2.confidence}`);
            console.log(`${ingredient.name} to ${tmp3.match} with confidence ${tmp3.confidence}`);
            if (check(tmp.match)){
                return "MAYBE";
            }
            return "YES";
        } else {
            tmp = findNearestIngredientMatchWithConfidence( notVegetarianIngredients, ingredient.name );
            if (tmp.confidence > 0.9 || tmp2.confidence > 0.9){
                console.log(`${ingredient.name} to ${tmp.match} with confidence ${tmp.confidence}`);
                if (check(tmp.match)){
                    return "MAYBE";
                }
                return "NO";
            }
            return "MAYBE";
        }
    }
    return "MAYBE";
}

function computeVeg (ingredients) {
    let veg = true;
    let maybe = false;
    for (let i in ingredients) {
        let ing = ingredients[i];
        if (ing.subIngredients) {
            if (ingredients[i].vegetarian == null){
                ingredients[i].vegetarian = computeVegSinglIngredient(ingredients[i]);
            }
            let subVeg = ingredients[i].vegetarian;
            if (subVeg === "NO"){
                return "NO";
            } else if(subVeg === "YES"){
                veg = veg && true;
            } else {
                maybe = maybe || true;
            }
            continue;
        }
        if (ingredients[i].vegetarian == null){
            ingredients[i].vegetarian = computeVegSinglIngredient(ingredients[i]);
        }
        let isVeg = ingredients[i].vegetarian;
        if (isVeg == "YES") {
            veg &= true;
        }
        else if (isVeg == "NO") {
            return "NO";
        }
        else {
            /*
            let tmp = findNearestIngredientMatchWithConfidence( allIngredients, ingredients[i].name );
            if (tmp.confidence > 0.9){
                console.log(`${ingredients[i].name} to ${tmp.match} with confidence ${tmp.confidence}`);
                let b = computeVegSinglIngredient({name:tmp.match})
                if (b == "YES") { veg &= true}
                else if (b == "NO") { return "NO" }
                else {maybe = maybe || true;}
            }
            else {maybe = maybe || true;}
            */
            maybe = maybe || true;
        }
    }
    if (maybe) {
        return "MAYBE";
    } else {
        return "YES";
    }
}

function computeVeganSinglIngredient(ingredient){
    if (ingredient && ingredient.name){
        if (check(ingredient.name)){
            return "MAYBE";
        }
        if (ingredient.vegan !== null){
            return ingredient.vegan;
        }
        var vegSingle = ingredient.vegetarian;
        if (vegSingle == null){
            vegSingle = computeVegSinglIngredient(ingredient);
        }
        var isVeganVal = isVegan(ingredient.name);
        var isNonVeganVal = isNonVegan(ingredient.name);

        if (ingredient.subIngredients) {
            var subVegan = computeVegan(ingredient.subIngredients)
            if (subVegan === "NO") { // if subIngredient is not jain
                return "NO";
            } else if (subVegan === "YES") { // if subIngredient is jain
                return "YES";
            } else if (subVegan === "MAYBE") { // if subIngredient is not sure jain

                if (isVeganVal && !isNonVeganVal) {
                    return "YES";
                } else if (isNonVeganVal || vegSingle === "NO") {
                    return "NO";
                }
                return "MAYBE";
            }
        }
        if(isVeganVal && !isNonVeganVal){
            return "YES";
        } else if (isNonVeganVal || vegSingle === "NO"){
            return "NO";
        } else {
            let nearestIngredient = null;
            nearestIngredient = findNearestIngredientMatchWithConfidence( veganIngredients, ingredient.name );
            if (nearestIngredient.confidence > 0.9){
                console.log(`${ingredient.name} to ${nearestIngredient.match} with confidence ${nearestIngredient.confidence}`);
                if (check(nearestIngredient.match)){
                    return "MAYBE";
                }
                return "YES";
            } else {
                nearestIngredient = findNearestIngredientMatchWithConfidence( nonVeganIngredients, ingredient.name );
                if (nearestIngredient.confidence > 0.9){
                    console.log(`${ingredient.name} to ${nearestIngredient.match} with confidence ${nearestIngredient.confidence}`);
                    if (check(nearestIngredient.match)){
                        return "MAYBE";
                    }
                    return "NO";
                }
                return "MAYBE";
            }
        }
    }
    return "MAYBE";
}

function computeVegan(ingredients){
    let veg = true;
    let maybe = false;
    for (let i in ingredients) {
        let ing = ingredients[i];
        if (ing.subIngredients) {
            if (ingredients[i].vegan == null){
                ingredients[i].vegan = computeVeganSinglIngredient(ingredients[i]);
            }
            let subVeg = ingredients[i].vegan;
            if (subVeg === "NO"){
                return "NO";
            } else if(subVeg === "YES"){
                veg = veg && true;
            } else {
                maybe = maybe || true;
            }
            continue
        }
        if (ingredients[i].vegan == null){
            ingredients[i].vegan = computeVeganSinglIngredient(ingredients[i]);
        }
        let isVegan = ingredients[i].vegan;
        if (isVegan == "YES") {
            veg &= true;
        }
        else if (isVegan == "NO") {
            return "NO";
        }
        else {
            /*
            let tmp = findNearestIngredientMatchWithConfidence( allIngredients, ingredients[i].name );
            if (tmp.confidence > 0.9){
                console.log(`${ingredients[i].name} to ${tmp.match} with confidence ${tmp.confidence}`);
                let b = computeVeganSinglIngredient({name:tmp.match})
                if (b == "YES") { veg &= true}
                else if (b == "NO") { return "NO" }
                else {maybe = maybe || true;}
            }
            else {maybe = maybe || true;}
            */
            maybe = maybe || true;
        }
    }
    if (maybe) {
        return "MAYBE";
    }else {
        return "YES";
    }
}

function isVegan(ingredientName){
    return veganIngredients.includes(ingredientName.toLowerCase());
}

function isNonVegan(ingredientName){
    return nonVeganIngredients.includes(ingredientName.toLowerCase());
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
        if (check(ingredients[i].name)){
        }else{
            displayButton &= ! (jain === "MAYBE") && !(veg === "MAYBE") && !(vegan === "MAYBE()");
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
                otherIngredientsAsJson = convertToJsonArray(ingredients);
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


    /*

            const imageDivElement = document.querySelector('div.slick-list');
            const images = [];

            if (landingImage) {
                images.push(landingImage.src);
            }

            if (imageDivElement != undefined) {
                const imgElements = imageDivElement.querySelectorAll('img');
                imgElements.forEach(img => {
                    let src = img.src;
                    images.push(src);
                });
            }*/

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
                upcValues = upcValue.split(/\s+/); // splits on one or more spaces
                console.log('UPC:', upcValues);
            }
            break; // stop after finding the first UPC
        }
    }


    let jain = computeJain(ingredientsList);
    let veg = computeVeg(ingredientsList);
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
                        "tithi":"MAYBE"
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

function convertToJsonArraySub(input) {
    input = input
        .split(/CONTAINS:/gi)[0]
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
            current += char;
        }
    }

    if (current.trim()) result.push(current.trim());

    const finalList = result.map(item => item.replace(/^and\s+/i, '').trim());

    let isSpecialCase = false;
    let specialCaseData = undefined;

    const structured = finalList.map(item => {
        const [name, subString] = splitIngredient(item);
        let ingredient = {
            name: name.toLowerCase(),
            jain: null,
            vegetarian: null,
            vegan: null,
            subIngredients: null
        };

        if (subString) {
            const [subIngredients, isSpecialCase2, specialCaseData2] = convertToJsonArraySub(subString);
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

        ingredient.vegan = computeVeganSinglIngredient(ingredient);
        ingredient.vegetarian = computeVegSinglIngredient(ingredient);
        ingredient.jain = computeJainSinglIngredient(ingredient);

        return ingredient;
    });

    return [structured, isSpecialCase, specialCaseData];
}

function convertToJsonArray(input) {
    input = input
        .split(/CONTAINS:/gi)[0]
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

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if ((char === ',' || char === ';') && depth === 0) {
            if (current.trim()) result.push(current.trim());
            current = '';
            continue;
        }

        if (char === '(') depth++;
        else if (char === ')') depth--;

        if (strTest(char)) {
            current += char;
        }
    }

    if (current.trim()) result.push(current.trim());

    const finalList = result.map(item => item.replace(/^and\s+/i, '').trim());

    const structured = finalList.map(item => {
        const [name, subString] = splitIngredient(item);
        let ingredient = {
            name: name.toLowerCase(),
            jain: null,
            vegetarian: null,
            vegan: null,
            subIngredients: null
        };

        if (subString) {
            const [subIngredients, isSpecialCase, specialCaseData] = convertToJsonArraySub(subString);
            ingredient.subIngredients = subIngredients;

            if (ingredient.name === "emulsifier") {
                ingredient.subIngredients.push({
                    name: "emulsifier",
                    jain: ingredient.jain,
                    vegetarian: ingredient.vegetarian,
                    vegan: ingredient.vegan,
                    subIngredients: specialCaseData
                });
            }
        }

        ingredient.vegan = computeVeganSinglIngredient(ingredient);
        ingredient.vegetarian = computeVegSinglIngredient(ingredient);
        ingredient.jain = computeJainSinglIngredient(ingredient);

        return ingredient;
    });

    console.log("convertToJsonArray = " + JSON.stringify(structured, null, 3));
    return structured;
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
