// ==UserScript==
// @name         Amazon Ingredients Extractor
// @namespace    tampermonkey.net/
// @version      0.2
// @description  Extract ingredients from Amazon product pages
// @author       Parshwa Shah
// @match        www.amazon.com/*
// @grant        none
// ==/UserScript==
debugger
const strTest = str => /^[\(\)\[\]a-z, 0-9]*$/gi.test(str);

function add(data){
    var request = new XMLHttpRequest();
    request.open('POST','https://mainserver-776168167171.us-west1.run.app/v1/create');
    request.setRequestHeader('Accept', 'application/json');
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify(data));
}


var jainIngredients = [
    "wheat",
    "rice",
    "barley",
    "oats",
    "quinoa",
    "millet",
    "corn",
    "chickpeas",
    "chana",
    "kidney beans",
    "rajma",
    "black-eyed peas",
    "lobia",
    "soybeans",
    "bottle gourd",
    "lauki",
    "bitter gourd",
    "karela",
    "pumpkin",
    "kaddu",
    "cucumber",
    "bell peppers",
    "capsicum",
    "cabbage",
    "moong dal",
    "toor dal",
    "urad dal",
    "moong",
    "toor",
    "apples",
    "bananas",
    "oranges",
    "mangoes",
    "papaya",
    "grapes",
    "pomegranate",
    "guava",
    "berries",
    "cauliflower",
    "broccoli",
    "spinach",
    "palak",
    "fenugreek leaves",
    "methi",
    "tomatoes",
    "eggplant",
    "brinjal",
    "baingan",
    "zucchini",
    "milk",
    "yogurt",
    "curd",
    "ghee",
    "clarified butter",
    "paneer",
    "cottage cheese",
    "buttermilk",
    "almonds",
    "cashews",
    "walnuts",
    "pistachios",
    "sunflower seeds",
    "pumpkin seeds",
    "turmeric",
    "cumin",
    "jeera",
    "coriander",
    "dhania",
    "mustard seeds",
    "asafoetida",
    "hing",
    "dried ginger",
    "ginger powder",
    "green chilies",
    "curry leaves",
    "mint",
    "cilantro",
    "coriander leaves",
    "mustard oil",
    "sunflower oil",
    "coconut oil",
    "olive oil",
    "groundnut oil",
    "avocado oil",
    "sugar",
    "sugar cane",
    "jaggery",
    "tofu",
    "coconut",
    "tamarind",
    "lemon juice",
    "lemon",
    "salt",
    "vanilla extract",
    "vanilla",
    "fruit and vegetable juice",
    "sea salt",
    "green tea",
    "plum",
    "flaxseed",
    "oregano",
    "extracts of oregano",
    "natural flavor",
    "sodium citrate",
    "palm oil",
    "palm",
    "milk fat",
    "butter",
    "tapioca syrup",
    "water",
    "raspberry powder",
    "soy lecithin",
    "sodium citrate",
    "corn syrup",
    "corn",
    "whole milk powder",
    "butter",
    "green tea",
    "fruit and vegetable juice",
    "color",
    "cream",
    "agar",
    "enriched corn meal",
    "vegetable oil",
    "salt",
    "partially hydrogenated soybean oil",
    "maltodextrin",
    "disodium phosphate",
    "monosodium glutamate"
];


var nonVegiterianIngredients = [];

var nonJainIngredients = [
    "beet syrup",
    "beet",
    "unsweetened chocolate",
    "cocoa butter",
    "whey",
    "cheddar cheese",
    "dour cream",
    "artificial flavor",
    "lactic acid",
    "artificial color (including yellow 6)",
];

var tithiIngredients = [];

var veganIngredients = [];

var vegiterianIngredients = [
    "beet syrup",
    "beet",
    "unsweetened chocolate",
    "cocoa butter",
    "whey",
    "cheddar cheese",
    "dour cream",
    "artificial flavor",
    "lactic acid",
    "artificial color (including yellow 6)",
];


function isJain(ingredientName){
    return jainIngredients.includes(ingredientName) && !nonJainIngredients.includes(ingredientName);
}

function isNonJain(ingredientName){
    return nonJainIngredients.includes(ingredientName);
}


function computeJainSubIngredients (subIngredients){
    var jain = "YES";

    var allSubJain = true;
    var anySubNonVeg = false;
    var anySubNonJain = false;
    for (let i = 0; i < subIngredients.length; i++) {
        var subIngredient = subIngredients[i];

        if(isJain(subIngredient.name.toLowerCase())) {// if subIngredient is jain
            allSubJain = allSubJain && true;
        } else if (isNonVegiterian(subIngredient.name.toLowerCase())) {// if subIngredient is non vegiterian
            anySubNonVeg = anySubNonVeg || true;
        } else if (isNonJain(subIngredient.name.toLowerCase())){
            anySubNonJain = anySubNonJain || true;
        } else { // not sure it is jain or not.
             allSubJain = allSubJain && false;
        }
    }
    if (allSubJain && !anySubNonVeg) {
        jain = "YES"
    } else if (anySubNonVeg || anySubNonJain) {
        jain = "NO"
    } else {
        jain = "MAYBE"
    }
    return jain;
}

function computeJainSinglIngredient (ingredient) {
    var jain = "";
    if (ingredient.subIngredients && ingredient.subIngredients.length > 0) {
        var subJain = computeJainSubIngredients(ingredient.subIngredients)
        if (subJain === "NO") { // if subIngredient is not jain
            jain = "NO";
        } else if (subJain === "YES") { // if subIngredient is jain
            jain = "YES";
        } else if (subJain === "MAYBE") { // if subIngredient is not sure jain
            jain = "MAYBE";
        }
    }
    if(isJain(ingredient.name.toLowerCase())) { // if ingredient is jain
        jain = "YES";
    } else if (isNonVegiterian(ingredient.name.toLowerCase())) {// if ingredient is non vegiterian
        jain = "NO";
    } else if (isNonJain(ingredient.name.toLowerCase())){
        jain = "NO";
    } else if (!(jain === "YES" || jain === "NO")){ // not sure it is jain or not.
        jain = "MAYBE";
    }
    return jain;
}

function computeJain (ingredients) {
    var jain = "YES";

    var allJain = true;
    var anyNonVeg = false;
    var anyNonJain = false;
    for (let i = 0; i < ingredients.length; i++) {
        var ingredient = ingredients [i];
        if (ingredient.subIngredients && ingredient.subIngredients.length > 0) {
            var subJain = computeJainSubIngredients(ingredient.subIngredients)
            if (subJain === "NO") { // if subIngredient is not jain
                allJain = allJain && false;
            } else if (subJain === "YES") { // if subIngredient is jain
                allJain = allJain && true;
            } else if (subJain === "MAYBE") { // if subIngredient is not sure jain
                allJain = allJain && false;
            }
        } else if(isJain(ingredient.name.toLowerCase())) { // if ingredient is jain
               allJain = allJain && true;
        } else if (isNonVegiterian(ingredient.name.toLowerCase())) {// if ingredient is non vegiterian
            anyNonVeg = anyNonVeg || true;
        } else if (isNonJain(ingredient.name.toLowerCase())){
            anyNonJain = anyNonJain || true;
        } else { // not sure it is jain or not.
             allJain = allJain && false;
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

function isNotVegitarian(ingredient){
    return nonVegiterianIngredients.includes(ingredient.name.toLowerCase());
}

function isVegiterian(ingredient){
    return jainIngredients.includes(ingredient.name.toLowerCase()) ||
       vegiterianIngredients.includes(ingredient.name.toLowerCase());
}

function computeVegSinglIngredient (ingredient, jain) {
    if (jain == "YES") {
        return "YES";
    } else if (jain == "MAYBE" || jain == "NO") {
        //check item
        if(isVegiterian(ingredient) && !isNotVegitarian(ingredient)){
            return "YES";
        } else if (isNotVegitarian(ingredient)){
            return "NO";
        } else {
            return "MAYBE";
        }
    }
}

function computeVeg (ingredients, jain) {
    if (jain == "YES") {
        return "YES";
    } else if (jain == "MAYBE" || jain == "NO") {
        //check item
        return "MAYBE";
    }
}

function isVegan(ingredient){
    return true
}

function isJainTithi(ingredient){
    return true
}

function isNonVegiterian(ingredient){
    return false
}

function displayIngredients (ingredients) {
    let displayString = "";
    for (let i = 0; i < ingredients.length; i++) {
        let jain = computeJainSinglIngredient(ingredients[i]);
        let veg = computeVegSinglIngredient(ingredients[i], jain);
        displayString += "<tr>";
        displayString += "<td>" + ingredients[i].name + "</td>";
        displayString += "<td>" + jain + "</td>";
        displayString += "<td>" + veg + "</td>";
        displayString += "</tr>";
        if (ingredients[i].subIngredients) {
            displayString += displayIngredients(ingredients[i].subIngredients);
        }
    }
    return displayString;
}

function displayIngredientsTable (ingredients) {
    var displayString = "<table><tr><th>Name</th><th>Jain?</th><th>Vegitarian?</th></tr>";

    displayString += displayIngredients(ingredients);

    displayString += "</table>";
    return displayString;
}


(function() {
    'use strict';

    // Wait for page to load completely
    window.addEventListener('load', function() {
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

            const productDescriptionElement = document.querySelector('div#productDescription');
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

            const imageDivElement = document.querySelector('div.slick-list');
            const images = [];

            if (imageDivElement != undefined) {
                const imgElements = imageDivElement.querySelectorAll('img');
                imgElements.forEach(img => {
                    var src = img.src;
                    images.push(src);
                });
            }

            var jain = computeJain(ingredientsList);
            let veg = computeVeg(ingredientsList,jain);

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
                                "vegan":"MAYBE"
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
                        "barcode":null,
                        "weburl":window.location.href,
                        "brand":"Unkown",
                        "images":images,
                        "store":[
                            "Amazon"
                        ]
                    },
                    "status":"NEW"
                },
                "database":"Items",
                "key": "PARSHWAPUSHINGDATATOSERVER",
                "source":"TAMPERPARSHWA"
            }

            // Convert JSON object to string with indentation
            const productDetailsJson = JSON.stringify(productDetail, null, 2);

            // Output JSON to console
            console.log('Product Details JSON:', productDetailsJson);



            // Create a floating display box
            if (ingredients) {

                const displayBox = document.createElement('div');
                displayBox.style.position = 'fixed';
                displayBox.style.top = '40px';
                displayBox.style.right = '10px';
                displayBox.style.padding = '10px';
                displayBox.style.backgroundColor = '#ffffff';
                displayBox.style.border = '1px solid #ddd';
                displayBox.style.borderRadius = '5px';
                displayBox.style.zIndex = '9999';
                displayBox.style.maxWidth = '400px';
                displayBox.style.maxHeight = '500px';
                displayBox.style.overflow = 'auto';
                console.log(otherIngredientsAsJson);

                displayBox.innerHTML = `
                    <h3>Jain : ${jain}</h3>
                    <h3>Vegitarian : ${veg}</h3>
                    <h3>Ingredients:</h3>
                    <p>${displayIngredientsTable(otherIngredientsAsJson)}</p>
                `;
                document.body.appendChild(displayBox);

                // Optionally, create a button to copy JSON to clipboard
                const copyButton = document.createElement('button');
                copyButton.innerText = 'Click Here to Save Product Details to Steps To Kindness';
                copyButton.style.position = 'fixed';
                copyButton.style.top = '20px';
                copyButton.style.right = '20px';
                copyButton.style.backgroundColor = '#f8f8f8';
                copyButton.style.border = '1px solid #ddd';
                copyButton.style.borderRadius = '5px';
                copyButton.style.textAlign = 'left';
                copyButton.style.fontSize = '17px';
                copyButton.style.zIndex = 10000;
                document.body.appendChild(copyButton);

                copyButton.addEventListener('click', function() {
                    navigator.clipboard.writeText(productDetailsJson).then(function() {
                        add(productDetail);
                        navigator.clipboard.writeText(productDetailsJson);

                    }, function(err) {
                        console.error('Could not copy text: ', err);
                    });
                });
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
                    <p>Unable to find ingredients, please looks for another item.</p>
                `;
                document.body.appendChild(displayBox);

            }
        }


        function convertToJsonArray(input) {
            // Remove "Ingredients:" prefix and trailing period
            const cleaned = input.replace(/^Ingredients:\s*/, '').replace(/\.$/, '');

            // Split into ingredients while keeping parentheses content together
            const result = [];
            let current = '';
            let depth = 0;

            for (let char of cleaned) {
                if (char === ',' && depth === 0) {
                    result.push(current.trim());
                    current = '';
                } else {
                    if (char === '(' || char === '[') depth++;
                    if (char === ')' || char === ']') depth--;
                    if (strTest(char)){
                        current += char;
                    }
                }
            }
            if (current.trim()) result.push(current.trim());

            // Normalize "and" before last ingredient
            const finalList = result.map(item => item.replace(/^and\s+/i, '').trim());

            // Convert to unified JSON format
            const structured = finalList.map(item => {
                const match = item.match(/^(.+?)\s*\((.*?)\)$/);
                let tmp
                if (match) {
                    tmp = {
                        name: match[1].trim(),
                        jain: "",
                        subIngredients: convertToJsonArray(match[2])
                    };
                } else {
                    tmp = {
                        name: item,
                        jain: ""
                    };
                }
                tmp.jain = computeJainSinglIngredient(tmp);
                return tmp;
            });



            console.log("convertToJsonArray = " + JSON.stringify(structured, null, 3));
            return structured;
        }

        // Run the extraction
        extractIngredients();
    });
})();
