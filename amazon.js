// ==UserScript==
// @name         Amazon Ingredients Extractor
// @namespace    tampermonkey.net/
// @version      0.2
// @description  Extract ingredients from Amazon product pages
// @author       Parshwa Shah
// @match        www.amazon.com/*
// @grant        none
// ==/UserScript==
const strTest = str => /^[\(\)\[\]a-z;&%\-, 0-9]*$/gi.test(str);

function add(data){
    var request = new XMLHttpRequest();
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
/*
const ingredients = [
  "Milk",
  "Soy Lecithin",
  "Palm Oil",
  "Peanuts",
  "Calcium Carbonate"
];

const input = "milk made in a facility that handles soy";

const result = findNearestIngredientMatchWithConfidence(ingredients, input);
console.log("Best Match:", result.match);
console.log("Confidence:", result.confidence);

*/


var jainIngredients = [
    "artificial flavors", "agar", "almonds", "apples", "artificial color", "artificial flavor", "asafoetida", "avocado oil",
    "baingan", "baking soda", "bananas", "barley", "bell peppers", "berries", "bitter gourd",
    "black-eyed peas", "bottle gourd", "brinjal", "broccoli", "butter", "buttermilk", "cabbage",
    "calcium carbonate", "cane sugar", "canola", "capsicum", "carnauba wax", "cashews", "cauliflower",
    "chana", "chickpeas", "chocolate", "cilantro", "clarified butter", "cocoa butter", "coconut",
    "coconut oil", "color", "coriander", "coriander leaves", "corn", "corn syrup", "corn syrup solids",
    "cornstarch", "cornstarch less than 1% of corn syrup", "cottage cheese", "cream", "cucumber",
    "cumin", "curd", "curry leaves", "dark chocolate", "dextrin", "dhania", "disodium phosphate",
    "dried ginger", "eggplant", "enriched corn meal", "extracts of oregano", "fenugreek leaves",
    "flaxseed", "fruit and vegetable juice", "ghee", "ginger powder", "grapes", "green chilies",
    "green tea", "groundnut oil", "guava", "gum acacia", "hing", "hydrogenated cottonseed oil",
    "hydrogenated palm kernel oil", "invert sugar", "jaggery", "jeera", "kaddu", "karela", "kidney beans",
    "lauki", "lecithin", "lemon", "lemon juice", "less than 2% - dextrose", "lobia", "maltodextrin",
    "mangoes", "methi", "milk", "milkfat", "millet", "mint", "monosodium glutamate", "moong", "moong dal",
    "mustard oil", "mustard seeds", "natural flavor", "oats", "olive oil", "oranges", "oregano", "palak",
    "palm", "palm kernel oil", "palm oil", "paneer", "papaya", "partially hydrogenated soybean oil",
    "peanut butter", "peanuts", "pgpr", "pistachios", "plum", "pomegranate", "pumpkin", "pumpkin seeds",
    "quinoa", "rajma", "raspberry powder", "rice", "salt", "sea salt", "skim milk", "sodium citrate",
    "soy", "soybeans", "spinach", "sugar", "sugar cane", "sunflower oil", "sunflower seeds", "tamarind",
    "tapioca syrup", "tbhq to maintain freshness", "tofu", "tomatoes", "toor", "toor dal", "turmeric",
    "turmeric powder", "urad dal", "vanilla", "vanilla extract", "vanillin", "vegetable oil", "walnuts",
    "water", "wheat", "wheat flour", "wheat syrup", "whey", "whole milk powder", "whole wheat", "yeast",
    "yogurt", "zucchini"
];

var nonJainIngredients = [
    "potatoes",
    "artificial and natural flavours",
    "natural flavours",
    "apios", "arrowroot", "beet", "beet syrup", "beetroot", "blue 1", "blue 1 lake", "blue 2", "blue 2 lake",
    "burdock root", "carrot", "cassava", "celeriac", "cheddar cheese", "chinese artichoke", "daikon",
    "dour cream", "egg", "egg whites", "eggs", "elephant yam", "fennel", "fennel bulb", "galangal",
    "garlic", "ginger", "horseradish", "includes blue 1 lake", "jerusalem artichoke", "jicama", "kohlrabi",
    "lactic acid", "less than 2% - lactose", "lotus root", "malanga", "oca", "onion", "onion powder",
    "parsnip", "potato", "radish", "radishes", "red 40", "red 40 lake", "rutabaga", "rutabagas", "salsify",
    "shallot", "skirret", "sour cream", "soy lecithin", "suran", "sweet potato", "taro", "turnip",
    "turnips", "ulluco", "wasabi", "yam", "yellow 5", "yellow 5 lake", "yellow 6", "yellow 6 lake"
];

var veganIngredients = [
    "potatoes",
    "sugar", "cane sugar", "agar", "yellow 6", "yellow 6 lake", "blue 1", "blue 1 lake", "blue 2", "blue 2 lake", "red 40", "red 40 lake", "yellow 5", "yellow 5 lake",
    "almonds",
    "apples",
    "artificial color",
    "artificial flavor",
    "asafoetida",
    "avocado oil",
    "baingan",
    "baking soda",
    "bananas",
    "barley",
    "bell peppers",
    "berries",
    "bitter gourd",
    "black-eyed peas",
    "bottle gourd",
    "brinjal",
    "broccoli",
    "cabbage",
    "calcium carbonate",
    "canola",
    "capsicum",
    "carnauba wax",
    "cashews",
    "cauliflower",
    "chana",
    "chickpeas",
    "cilantro",
    "cocoa butter",
    "coconut",
    "coconut oil",
    "color",
    "coriander",
    "coriander leaves",
    "corn",
    "corn syrup",
    "corn syrup solids",
    "cornstarch",
    "cornstarch less than 1% of corn syrup",
    "cucumber",
    "cumin",
    "curry leaves",
    "dextrin",
    "dhania",
    "disodium phosphate",
    "dried ginger",
    "eggplant",
    "enriched corn meal",
    "extracts of oregano",
    "fenugreek leaves",
    "flaxseed",
    "fruit and vegetable juice",
    "ginger powder",
    "grapes",
    "green chilies",
    "green tea",
    "groundnut oil",
    "guava",
    "gum acacia",
    "hing",
    "hydrogenated cottonseed oil",
    "hydrogenated palm kernel oil",
    "invert sugar",
    "jaggery",
    "jeera",
    "kaddu",
    "karela",
    "kidney beans",
    "lauki",
    "lemon",
    "lemon juice",
    "less than 2% - dextrose",
    "lobia",
    "maltodextrin",
    "mangoes",
    "methi",
    "millet",
    "mint",
    "monosodium glutamate",
    "moong",
    "moong dal",
    "mustard oil",
    "mustard seeds",
    "oats",
    "olive oil",
    "oranges",
    "oregano",
    "palak",
    "palm",
    "palm kernel oil",
    "palm oil",
    "papaya",
    "partially hydrogenated soybean oil",
    "peanut butter",
    "peanuts",
    "pistachios",
    "plum",
    "pomegranate",
    "pumpkin",
    "pumpkin seeds",
    "quinoa",
    "rajma",
    "raspberry powder",
    "rice",
    "salt",
    "sea salt",
    "sodium citrate",
    "soy",
    "soybeans",
    "spinach",
    "sugar cane",
    "sunflower oil",
    "sunflower seeds",
    "tamarind",
    "tapioca syrup",
    "tbhq to maintain freshness",
    "tofu",
    "tomatoes",
    "toor",
    "toor dal",
    "turmeric",
    "turmeric powder",
    "urad dal",
    "vanilla",
    "vanilla extract",
    "vanillin",
    "vegetable oil",
    "walnuts",
    "water",
    "wheat",
    "wheat flour",
    "wheat syrup",
    "whole wheat",
    "yeast",
    "zucchini"
];

var nonVeganIngredients = [
    "artificial and natural flavours",
    "natural flavours",
    "egg", "egg whites", "eggs", "mono and diglycerides",
    "butter", "buttermilk", "cheddar cheese", "chocolate", "clarified butter",
    "cottage cheese", "cream", "curd", "dark chocolate", "ghee", "milk", "milkfat", "natural flavor",
    "paneer", "pgpr", "skim milk", "whey", "whole milk powder", "yogurt", "unsweetened chocolate",
    "soy lecithin", "lecithin", "less than 2% - lactose", "lactic acid"
];

var vegiterianIngredients = [
    "potatoes",
    "agar",
    "almonds",
    "apples",
    "artificial color",
    "artificial flavor",
    "asafoetida",
    "avocado oil",
    "baingan",
    "baking soda",
    "bananas",
    "barley",
    "bell peppers",
    "berries",
    "bitter gourd",
    "black-eyed peas",
    "bottle gourd",
    "brinjal",
    "broccoli",
    "butter",
    "buttermilk",
    "cabbage",
    "calcium carbonate",
    "cane sugar",
    "canola",
    "capsicum",
    "carnauba wax",
    "cashews",
    "cauliflower",
    "chana",
    "chickpeas",
    "chocolate",
    "cilantro",
    "clarified butter",
    "cocoa butter",
    "coconut",
    "coconut oil",
    "color",
    "coriander",
    "coriander leaves",
    "corn",
    "corn syrup",
    "corn syrup solids",
    "cornstarch",
    "cornstarch less than 1% of corn syrup",
    "cottage cheese",
    "cream",
    "cucumber",
    "cumin",
    "curd",
    "curry leaves",
    "dark chocolate",
    "dextrin",
    "dhania",
    "disodium phosphate",
    "dried ginger",
    "eggplant",
    "enriched corn meal",
    "extracts of oregano",
    "fenugreek leaves",
    "flaxseed",
    "fruit and vegetable juice",
    "ghee",
    "ginger powder",
    "grapes",
    "green chilies",
    "green tea",
    "groundnut oil",
    "guava",
    "gum acacia",
    "hing",
    "hydrogenated cottonseed oil",
    "hydrogenated palm kernel oil",
    "invert sugar",
    "jaggery",
    "jeera",
    "kaddu",
    "karela",
    "kidney beans",
    "lauki",
    "lecithin",
    "lemon",
    "lemon juice",
    "less than 2% - dextrose",
    "lobia",
    "maltodextrin",
    "mangoes",
    "methi",
    "milk",
    "milkfat",
    "millet",
    "mint",
    "monosodium glutamate",
    "moong",
    "moong dal",
    "mustard oil",
    "mustard seeds",
    "natural flavor",
    "oats",
    "olive oil",
    "oranges",
    "oregano",
    "palak",
    "palm",
    "palm kernel oil",
    "palm oil",
    "paneer",
    "papaya",
    "partially hydrogenated soybean oil",
    "peanut butter",
    "peanuts",
    "pgpr",
    "pistachios",
    "plum",
    "pomegranate",
    "pumpkin",
    "pumpkin seeds",
    "quinoa",
    "rajma",
    "raspberry powder",
    "rice",
    "salt",
    "sea salt",
    "skim milk",
    "sodium citrate",
    "soy",
    "soybeans",
    "spinach",
    "sugar",
    "sugar cane",
    "sunflower oil",
    "sunflower seeds",
    "tamarind",
    "tapioca syrup",
    "tbhq to maintain freshness",
    "tofu",
    "tomatoes",
    "toor",
    "toor dal",
    "turmeric",
    "turmeric powder",
    "urad dal",
    "vanilla",
    "vanilla extract",
    "vanillin",
    "vegetable oil",
    "walnuts",
    "water",
    "wheat",
    "wheat flour",
    "wheat syrup",
    "whole milk powder",
    "whole wheat",
    "yeast",
    "yogurt",
    "zucchini",
    "apios",
    "arrowroot",
    "beet",
    "beet syrup",
    "beetroot",
    "blue 1",
    "blue 1 lake",
    "blue 2",
    "blue 2 lake",
    "burdock root",
    "carrot",
    "cassava",
    "celeriac",
    "cheddar cheese",
    "chinese artichoke",
    "daikon",
    "dour cream",
    "elephant yam",
    "fennel",
    "fennel bulb",
    "galangal",
    "garlic",
    "ginger",
    "horseradish",
    "includes blue 1 lake",
    "jerusalem artichoke",
    "jicama",
    "kohlrabi",
    "lactic acid",
    "less than 2% - lactose",
    "lotus root",
    "malanga",
    "oca",
    "onion",
    "onion powder",
    "parsnip",
    "potato",
    "radish",
    "radishes",
    "red 40",
    "red 40 lake",
    "rutabaga",
    "rutabagas",
    "salsify",
    "shallot",
    "skirret",
    "sour cream",
    "soy lecithin",
    "suran",
    "sweet potato",
    "taro",
    "turnip",
    "turnips",
    "ulluco",
    "wasabi",
    "yam",
    "yellow 5",
    "yellow 5 lake",
    "yellow 6",
    "yellow 6 lake"
];

var notVegiterianIngredients = [
    "artificial and natural flavours",
    "natural flavours","egg", "egg whites", "eggs", "mono and diglycerides"
];

var allIngredients = [].concat(notVegiterianIngredients,vegiterianIngredients,veganIngredients,nonVeganIngredients,nonJainIngredients,notVegiterianIngredients,jainIngredients)


function isJain(ingredientName){
    return jainIngredients.includes(ingredientName) && !nonJainIngredients.includes(ingredientName);
}

function isNonJain(ingredientName){
    return nonJainIngredients.includes(ingredientName);
}

function computeJainSinglIngredient (ingredient) {
    var jain = "";
    if (ingredient.subIngredients && ingredient.subIngredients.length > 0) {
        var subJain = computeJain(ingredient.subIngredients)
        if (subJain === "NO") { // if subIngredient is not jain
            return "NO";
        } else if (subJain === "YES") { // if subIngredient is jain
            jain = "YES";
        } else if (subJain === "MAYBE") { // if subIngredient is not sure jain
            jain = "MAYBE";
        }
    }
    if(isJain(ingredient.name.toLowerCase())) { // if ingredient is jain
        jain = "YES";
    } else if (isNotVegitarian(ingredient)) {// if ingredient is non vegiterian
        return "NO";
    } else if (isNonJain(ingredient.name.toLowerCase())){
        return "NO";
    } else if (!(jain === "YES" || jain === "NO")){ // not sure it is jain or not.
        jain = "MAYBE";
        let tmp = null;
        if (jain === "MAYBE") {
            tmp = findNearestIngredientMatchWithConfidence( allIngredients, ingredient.name );
            if (tmp.confidence > 0.9){
                console.log(`${ingredient.name} to ${tmp.match} with confidence ${tmp.confidence}`);
                return computeJainSinglIngredient({name:tmp.match})
            }
        }
    }
    return jain;
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
            var subJain = computeJain(ingredient.subIngredients)
            if (subJain === "NO") { // if subIngredient is not jain
                allJain = allJain && false;
                return "NO";
            } else if (subJain === "YES") { // if subIngredient is jain
                allJain = allJain && true;
            } else if (subJain === "MAYBE") { // if subIngredient is not sure jain
                allJain = allJain && false;
            }
        } else {
            let a = computeJainSinglIngredient(ingredients[i])
            if (a === "NO") {
                allJain = allJain && false;
                return "NO";
            } else if (a === "YES") {
                allJain = allJain && true;
            } else if (a === "MAYBE") {
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

function isNotVegitarian(ingredient){
    return notVegiterianIngredients.includes(ingredient.name.toLowerCase());
}

function isVegiterian(ingredient){
    return jainIngredients.includes(ingredient.name.toLowerCase()) ||
       vegiterianIngredients.includes(ingredient.name.toLowerCase());
}

function computeVegSinglIngredient (ingredient) {
    if (ingredient.subIngredients) {return computeVeg(ingredient.subIngredients)}
    if(isVegiterian(ingredient) && !isNotVegitarian(ingredient)){
        return "YES";
    } else if (isNotVegitarian(ingredient)){
        return "NO";
    } else {
        let tmp = null;
        tmp = findNearestIngredientMatchWithConfidence( allIngredients, ingredient.name );
        if (tmp.confidence > 0.9){
            console.log(`${ingredient.name} to ${tmp.match} with confidence ${tmp.confidence}`);
            return computeVegSinglIngredient({name:tmp.match})
        }else{return "MAYBE";}
    }
}

function computeVeg (ingredients) {
    let veg = true;
    let maybe = false;
    for (let i in ingredients) {
        let ing = ingredients[i];
        if (ing.subIngredients) {
            let subVeg = computeVeg(ing.subIngredients)
            if (subVeg === "NO"){
                return "NO";
            } else if(subVeg === "YES"){
                veg = veg && true;
            } else {
                maybe = maybe || true;
            }
            continue
        }
        let a = computeVegSinglIngredient(ingredients[i]);
        if (a == "YES") { veg &= true}
        else if (a == "NO") { return "NO" }
        else {
            let tmp = findNearestIngredientMatchWithConfidence( allIngredients, ingredients[i].name );
            if (tmp.confidence > 0.9){
                console.log(`${ingredients[i].name} to ${tmp.match} with confidence ${tmp.confidence}`);
                let b = computeVegSinglIngredient({name:tmp.match})
                if (b == "YES") { veg &= true}
                else if (b == "NO") { return "NO" }
                else {maybe = maybe || true;}
            }
            else {maybe = maybe || true;}
        }
    }
    if (maybe) {
        return "MAYBE";
    }else {
        return "YES";
    }
}

function computeVeganSinglIngredient(ingredient){
    if (ingredient.subIngredients) {return computeVegan(ingredient.subIngredients)}
    if(isVegan(ingredient) && !isNonVegan(ingredient)){
        return "YES";
    } else if (isNonVegan(ingredient)){
        return "NO";
    } else {
        let tmp = null;
        tmp = findNearestIngredientMatchWithConfidence( allIngredients, ingredient.name );
        if (tmp.confidence > 0.9){
            console.log(`${ingredient.name} to ${tmp.match} with confidence ${tmp.confidence}`);
            return computeVeganSinglIngredient({name:tmp.match})
        }else{return "MAYBE";}
    }
}

function computeVegan(ingredients){
    let veg = true;
    let maybe = false;
    for (let i in ingredients) {
        let ing = ingredients[i];
        if (ing.subIngredients) {
            let subVeg = computeVegan(ing.subIngredients)
            if (subVeg === "NO"){
                return "NO";
            } else if(subVeg === "YES"){
                veg = veg && true;
            } else {
                maybe = maybe || true;
            }
            continue
        }
        let a = computeVeganSinglIngredient(ingredients[i]);
        if (a == "YES") { veg &= true}
        else if (a == "NO") { return "NO" }
        else {
            let tmp = findNearestIngredientMatchWithConfidence( allIngredients, ingredients[i].name );
            if (tmp.confidence > 0.9){
                console.log(`${ingredients[i].name} to ${tmp.match} with confidence ${tmp.confidence}`);
                let b = computeVeganSinglIngredient({name:tmp.match})
                if (b == "YES") { veg &= true}
                else if (b == "NO") { return "NO" }
                else {maybe = maybe || true;}
            }
            else {maybe = maybe || true;}
        }
    }
    if (maybe) {
        return "MAYBE";
    }else {
        return "YES";
    }
}

function isVegan(ingredient){
    return veganIngredients.includes(ingredient.name.toLowerCase());
}

function isNonVegan(ingredient){
    return nonVeganIngredients.includes(ingredient.name.toLowerCase());
}

function isJainTithi(ingredient){
    return true
}

function displayIngredients (ingredients) {
    let displayString = "";
    for (let i = 0; i < ingredients.length; i++) {
        let jain = ingredients[i].jain;
        let veg = ingredients[i].vegitarian;
        let vegan = ingredients[i].vegan;
        displayString += "<tr>";
        displayString += "<td>" + ingredients[i].name + "</td>";
        displayString += "<td>" + jain + "</td>";
        displayString += "<td>" + veg + "</td>";
        displayString += "<td>" + vegan + "</td>";
        displayString += "</tr>";
        if (ingredients[i].subIngredients) {
            displayString += displayIngredients(ingredients[i].subIngredients);
        }
    }
    return displayString;
}

function displayIngredientsTable (ingredients) {
    var displayString = "<table><tr><th>Name</th><th>Jain?</th><th>Vegitarian?</th><th>Vegan?</th></tr>";

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

            if (landingImage) { images.push(landingImage.src)}

            if (imageDivElement != undefined) {
                const imgElements = imageDivElement.querySelectorAll('img');
                imgElements.forEach(img => {
                    var src = img.src;
                    images.push(src);
                });
            }

            var jain = computeJain(ingredientsList);
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
                                "vegitarian":veg
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
                    <h3>Vegan : ${vegan}</h3>
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
                if (((char === ',' || char === ';') && depth === 0) || (char === ')' && depth === 1)) {
                    if (depth === 1){depth--;current += ')'}
                    if (current == ''){continue}
                    current.replaceAll("  ", " ");
                    result.push(current.trim());
                    current = '';
                } else {
                    if (char === '(' || char === '[') depth++;
                    if (char === ')' || char === ']') depth--;
                    if (strTest(char)){
                        if (char === '[') {
                            current += '(';
                        } else if (char === ']'){
                            current += ')'
                        } else {
                            current += char;
                        }
                    }
                }
            }
            while (depth != 0){current += ")"; depth--;}
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
                        vegitarian: "",
                        vegan: "",
                        subIngredients: convertToJsonArray(match[2])
                    };
                } else {
                    tmp = {
                        name: item,
                        jain: "",
                        vegitarian: "",
                        vegan: ""
                    };
                }
                tmp.jain = computeJainSinglIngredient(tmp);
                tmp.vegitarian = computeVegSinglIngredient(tmp);
                tmp.vegan = computeVeganSinglIngredient(tmp);
                return tmp;
            });



            console.log("convertToJsonArray = " + JSON.stringify(structured, null, 3));
            return structured;
        }

        // Run the extraction
        extractIngredients();
    });
})();
