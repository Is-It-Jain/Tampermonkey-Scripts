// ==UserScript==
// @name         Amazon Ingredients Extractor
// @namespace    tampermonkey.net/
// @version      0.2
// @description  Extract ingredients from Amazon product pages
// @author       Parshwa Shah
// @match        www.amazon.com/*
// @grant        none
// ==/UserScript==
const strTest = str => /^[\(\)\[\]a-z;&%, 0-9]*$/gi.test(str);
var displayButton = true;
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

    }
}

function add(data){
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
  "cheddar cheese",
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
  "fruit juice",
  "vegetable juice",
  "ghee",
  "ginger powder",
  "glycerine",
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
  "lactose",
  "lauki",
  "lecithin",
  "lemon",
  "lemon juice",
  "less than 2% - dextrose",
  "less than 2% - lactose",
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
  "soy lecithin",
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
  "unsweetened chocolate",
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
  "whey",
  "whole milk powder",
  "whole wheat",
  "yeast",
  "yogurt",
  "zucchini",
  "soy lecithin",
  "titanium dioxide",
  "beeswax",
  "red 40",
  "red 40 lake",
  "yellow 5",
  "yellow 5 lake",
  "yellow 6",
  "yellow 6 lake",
  "blue 1",
  "blue 1 lake",
  "blue 2",
  "blue 2 lake",
  "butteroil",
  "hazelnuts",
  "lactic acid",
  "pine nuts",
  "sorbitol may also contain allspice",
  "sorbito",
  "allspice",
  "almond",
  "banana",
  "cardamom",
  "cinnamon",
  "cloves",
  "coffee",
  "lavender",
  "lemongrass",
  "rapeseed",
  "raspberries",
  "rosewater",
  "star anise",
  "staranise",
  "thyme",
  "togarashi",
  "curry powder",
  "date",
  "dates",
  "peppermint",
  "caramel",
  "pecan",
  "honey glazed pecans",
  "macadamia",
  "bar mix",
  "processed with alkali",
  "inulin",
  "sucralose",
  "acesulfame potassium",
  "carrageenan",
  "blueberries",
  "fructose",
  "spice extractives",
  "cultures",
  "dehydrated parsley",
  "pretzel declaration for wheels",
  "thiamin",
  "niacin",
  "iron",
  "tocopherols",
  "spices",
  "cheese crunchies enriched ground corn flour",
  "cheddar cheese blend",
  "cheese",
  "annatto",
  "sait",
  "cherries",
  "strawberry",
  "organic soy lecithin",
  "poppy seed",
  "sesame",
  "sesame seed",
  "celery seed",
];

var nonJainIngredients = [
  "apios",
  "arrowroot",
  "beet",
  "beet syrup",
  "beetroot",
  "burdock root",
  "carrot",
  "cassava",
  "celeriac",
  "chinese artichoke",
  "daikon",
  "dour cream",
  "egg",
  "egg whites",
  "eggs",
  "elephant yam",
  "fennel",
  "fennel bulb",
  "galangal",
  "garlic",
  "ginger",
  "horseradish",
  "jerusalem artichoke",
  "jicama",
  "kohlrabi",
  "leek",
  "lotus root",
  "malanga",
  "monoglycerides",
  "diglycerides",
  "oca",
  "onion",
  "onion powder",
  "parsnip",
  "potato",
  "radish",
  "radishes",
  "rutabaga",
  "rutabagas",
  "salsify",
  "shallot",
  "skirret",
  "sour cream",
  "suran",
  "sweet potato",
  "taro",
  "turnip",
  "turnips",
  "ulluco",
  "wasabi",
  "yam",
  "mushroom",
  "dried potatoes",
  "potatoes",
  "nachos",
  "riboflavin",
  "enzymes",
  "gelatin",
  "spirulina",
  "alpha tocopherol acetate",
  "vitamin e",
  "vitamin a palmitate",
];

var veganIngredients = [
  "agar",
  "almonds",
  "apios",
  "apples",
  "arrowroot",
  "asafoetida",
  "avocado oil",
  "baingan",
  "baking soda",
  "bananas",
  "barley",
  "beet",
  "beet syrup",
  "beetroot",
  "bell peppers",
  "berries",
  "bitter gourd",
  "black-eyed peas",
  "bottle gourd",
  "brinjal",
  "broccoli",
  "burdock root",
  "cabbage",
  "calcium carbonate",
  "canola",
  "capsicum",
  "carnauba wax",
  "carrot",
  "cashews",
  "cassava",
  "cauliflower",
  "celeriac",
  "chana",
  "chickpeas",
  "chinese artichoke",
  "cilantro",
  "cocoa butter",
  "coconut",
  "coconut oil",
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
  "daikon",
  "dextrin",
  "dhania",
  "disodium phosphate",
  "dried ginger",
  "eggplant",
  "elephant yam",
  "enriched corn meal",
  "extracts of oregano",
  "fennel",
  "fennel bulb",
  "fenugreek leaves",
  "flaxseed",
  "fruit juice",
  "vegetable juice",
  "galangal",
  "garlic",
  "ginger",
  "ginger powder",
  "grapes",
  "green chilies",
  "green tea",
  "groundnut oil",
  "guava",
  "gum acacia",
  "hing",
  "horseradish",
  "hydrogenated cottonseed oil",
  "hydrogenated palm kernel oil",
  "invert sugar",
  "jaggery",
  "jeera",
  "jerusalem artichoke",
  "jicama",
  "kaddu",
  "karela",
  "kidney beans",
  "kohlrabi",
  "lauki",
  "leek",
  "lemon",
  "lemon juice",
  "less than 2% - dextrose",
  "lobia",
  "lotus root",
  "malanga",
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
  "oca",
  "olive oil",
  "onion",
  "onion powder",
  "oranges",
  "oregano",
  "palak",
  "palm",
  "palm kernel oil",
  "palm oil",
  "papaya",
  "parsnip",
  "partially hydrogenated soybean oil",
  "peanut butter",
  "peanuts",
  "pistachios",
  "plum",
  "pomegranate",
  "potato",
  "pumpkin",
  "pumpkin seeds",
  "quinoa",
  "radish",
  "radishes",
  "rajma",
  "raspberry powder",
  "rice",
  "rutabaga",
  "rutabagas",
  "salsify",
  "salt",
  "sea salt",
  "shallot",
  "skirret",
  "sodium citrate",
  "soy",
  "soybeans",
  "spinach",
  "sugar cane",
  "sunflower oil",
  "sunflower seeds",
  "suran",
  "sweet potato",
  "tamarind",
  "tapioca syrup",
  "taro",
  "tbhq to maintain freshness",
  "tofu",
  "tomatoes",
  "toor",
  "toor dal",
  "turmeric",
  "turmeric powder",
  "turnip",
  "turnips",
  "ulluco",
  "urad dal",
  "vanilla",
  "vanilla extract",
  "vanillin",
  "vegetable oil",
  "walnuts",
  "wasabi",
  "water",
  "wheat",
  "wheat flour",
  "wheat syrup",
  "whole wheat",
  "yam",
  "yeast",
  "zucchini",
  "titanium dioxide",
  "red 40",
  "red 40 lake",
  "yellow 5",
  "yellow 5 lake",
  "yellow 6",
  "yellow 6 lake",
  "blue 1",
  "blue 1 lake",
  "blue 2",
  "blue 2 lake",
  "sugar",
  "cane sugar",
  "hazelnuts",
  "mushroom",
  "lactic acid",
  "pine nuts",
  "sorbitol may also contain allspice",
  "sorbito",
  "allspice",
  "almond",
  "banana",
  "cardamom",
  "cinnamon",
  "cloves",
  "coffee",
  "lavender",
  "lemongrass",
  "rapeseed",
  "raspberries",
  "rosewater",
  "star anise",
  "staranise",
  "thyme",
  "togarashi",
  "curry powder",
  "date",
  "dates",
  "peppermint",
  "caramel",
  "pecan",
  "honey glazed pecans",
  "macadamia",
  "bar mix",
  "processed with alkali",
  "inulin",
  "sucralose",
  "acesulfame potassium",
  "carrageenan",
  "blueberries",
  "dried potatoes",
  "potatoes",
  "fructose",
  "spice extractives",
  "cultures",
  "dehydrated parsley",
  "pretzel declaration for wheels",
  "thiamin",
  "niacin",
  "iron",
  "tocopherols",
  "spices",
  "annatto",
  "sait",
  "cherries",
  "strawberry",
  "organic soy lecithin",
  "soy lecithin",
  "poppy seed",
  "sesame",
  "sesame seed",
  "spirulina",
];


var nonVeganIngredients = [
  "artificial color",
  "artificial flavor",
  "butter",
  "buttermilk",
  "cheddar cheese",
  "chocolate",
  "clarified butter",
  "color",
  "cottage cheese",
  "cream",
  "curd",
  "dark chocolate",
  "dour cream",
  "egg",
  "egg whites",
  "eggs",
  "ghee",
  "glycerine",
  "includes blue 1 lake",
  "lactose",
  "lecithin",
  "less than 2% - lactose",
  "milk",
  "milkfat",
  "diglycerides",
  "monoglycerides",
  "natural flavor",
  "paneer",
  "pgpr",
  "skim milk",
  "sour cream",
  "unsweetened chocolate",
  "whey",
  "whole milk powder",
  "yogurt",
  "confectioners glaze",
  "beeswax",
  "butteroil",
  "bacon",
  "nachos",
  "cheese crunchies enriched ground corn flour",
  "riboflavin",
  "cheddar cheese blend",
  "cheese",
  "enzymes",
  "gelatin",
  "alpha tocopherol acetate",
  "vitamin e",
  "vitamin a palmitate",
];

var vegetarianIngredients = [
  "agar",
  "almonds",
  "apios",
  "apples",
  "arrowroot",
  "artificial color",
  "artificial flavor",
  "asafoetida",
  "avocado oil",
  "baingan",
  "baking soda",
  "bananas",
  "barley",
  "beet",
  "beet syrup",
  "beetroot",
  "bell peppers",
  "berries",
  "bitter gourd",
  "black-eyed peas",
  "blue 1",
  "blue 1 lake",
  "blue 2",
  "blue 2 lake",
  "bottle gourd",
  "brinjal",
  "broccoli",
  "burdock root",
  "butter",
  "buttermilk",
  "cabbage",
  "calcium carbonate",
  "cane sugar",
  "canola",
  "capsicum",
  "carnauba wax",
  "carrot",
  "cashews",
  "cassava",
  "cauliflower",
  "celeriac",
  "chana",
  "cheddar cheese",
  "chickpeas",
  "chinese artichoke",
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
  "daikon",
  "dark chocolate",
  "dextrin",
  "dhania",
  "disodium phosphate",
  "dour cream",
  "dried ginger",
  "eggplant",
  "elephant yam",
  "enriched corn meal",
  "extracts of oregano",
  "fennel",
  "fennel bulb",
  "fenugreek leaves",
  "flaxseed",
  "fruit juice",
  "vegetable juice",
  "galangal",
  "garlic",
  "ghee",
  "ginger",
  "ginger powder",
  "glycerine",
  "grapes",
  "green chilies",
  "green tea",
  "groundnut oil",
  "guava",
  "gum acacia",
  "hing",
  "horseradish",
  "hydrogenated cottonseed oil",
  "hydrogenated palm kernel oil",
  "includes blue 1 lake",
  "invert sugar",
  "jaggery",
  "jeera",
  "jerusalem artichoke",
  "jicama",
  "kaddu",
  "karela",
  "kidney beans",
  "kohlrabi",
  "lactic acid",
  "lactose",
  "lauki",
  "lecithin",
  "leek",
  "lemon",
  "lemon juice",
  "less than 2% - dextrose",
  "less than 2% - lactose",
  "lobia",
  "lotus root",
  "malanga",
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
  "oca",
  "olive oil",
  "onion",
  "onion powder",
  "oranges",
  "oregano",
  "palak",
  "palm",
  "palm kernel oil",
  "palm oil",
  "paneer",
  "papaya",
  "parsnip",
  "partially hydrogenated soybean oil",
  "peanut butter",
  "peanuts",
  "pgpr",
  "pistachios",
  "plum",
  "pomegranate",
  "potato",
  "pumpkin",
  "pumpkin seeds",
  "quinoa",
  "radish",
  "radishes",
  "rajma",
  "raspberry powder",
  "red 40",
  "red 40 lake",
  "rice",
  "rutabaga",
  "rutabagas",
  "salsify",
  "salt",
  "sea salt",
  "shallot",
  "skim milk",
  "skirret",
  "sodium citrate",
  "sour cream",
  "soy",
  "soy lecithin",
  "soybeans",
  "spinach",
  "sugar",
  "sugar cane",
  "sunflower oil",
  "sunflower seeds",
  "suran",
  "sweet potato",
  "tamarind",
  "tapioca syrup",
  "taro",
  "tbhq to maintain freshness",
  "tofu",
  "tomatoes",
  "toor",
  "toor dal",
  "turmeric",
  "turmeric powder",
  "turnip",
  "turnips",
  "ulluco",
  "unsweetened chocolate",
  "urad dal",
  "vanilla",
  "vanilla extract",
  "vanillin",
  "vegetable oil",
  "walnuts",
  "wasabi",
  "water",
  "wheat",
  "wheat flour",
  "wheat syrup",
  "whey",
  "whole milk powder",
  "whole wheat",
  "yam",
  "yeast",
  "yellow 5",
  "yellow 5 lake",
  "yellow 6",
  "yellow 6 lake",
  "yogurt",
  "zucchini",
  "mushroom",
  "dried potatoes",
  "potatoes",
  "fructose",
  "spice extractives",
  "cultures",
  "dehydrated parsley",
  "pretzel declaration for wheels",
  "thiamin",
  "niacin",
  "iron",
  "tocopherols",
  "spices",
  "annatto",
  "sait",
  "cherries",
  "strawberry",
  "organic soy lecithin",
  "poppy seed",
  "sesame",
  "sesame seed",
  "spirulina",
  "alpha tocopherol acetate",
  "vitamin e",
  "vitamin a palmitate",
  "celery seed",
];

var notVegetarianIngredients = [
    "egg",
    "egg whites",
    "eggs",
    "diglycerides",
    "monolycerides",
    "confectioners glaze",
    "chiken",
    "pig",
    "meat",
    "bacon",
    "gelatin",
    "beef",
    "flavors",
    "chicken",
    "pork",

];

var allIngredients = [].concat(notVegetarianIngredients,vegetarianIngredients,veganIngredients,nonVeganIngredients,nonJainIngredients,notVegetarianIngredients,jainIngredients)


function isJain(ingredientName){
    return jainIngredients.includes(ingredientName.toLowerCase()) && !nonJainIngredients.includes(ingredientName.toLowerCase());
}

function isNonJain(ingredientName){
    return nonJainIngredients.includes(ingredientName.toLowerCase()) || notVegetarianIngredients.includes(ingredientName.toLowerCase());
}

function computeJainSinglIngredient (ingredient) {
    if(ingredient && ingredient.name) {
        var vegSingle = computeVegSinglIngredient(ingredient);
        var isJainValue = isJain(ingredient.name);
        var isNotJainValue = isNonJain(ingredient.name);
        if (ingredient.subIngredients && ingredient.subIngredients.length > 0) {
            var subJain = computeJain(ingredient.subIngredients)
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
            let tmp = null;
            tmp = findNearestIngredientMatchWithConfidence( jainIngredients, ingredient.name );
            if (tmp.confidence > 0.9){
                console.log(`${ingredient.name} to ${tmp.match} with confidence ${tmp.confidence}`);
                return "YES";
            } else {
                tmp = findNearestIngredientMatchWithConfidence( nonJainIngredients, ingredient.name );
                if (tmp.confidence > 0.9){
                    console.log(`${ingredient.name} to ${tmp.match} with confidence ${tmp.confidence}`);
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
            let subJain = computeJainSinglIngredient(ingredients[i]);
            if (subJain === "NO") { // if subIngredient is not jain
                allJain = allJain && false;
                return "NO";
            } else if (subJain === "YES") { // if subIngredient is jain
                allJain = allJain && true;
            } else if (subJain === "MAYBE") { // if subIngredient is not sure jain
                allJain = allJain && false;
            }
        } else {
            let a = computeJainSinglIngredient(ingredients[i]);
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

function isNotVegetarian(ingredientName){
    return notVegetarianIngredients.includes(ingredientName.toLowerCase());
}

function isVegetarian(ingredientName){
    return jainIngredients.includes(ingredientName.toLowerCase()) ||
       vegetarianIngredients.includes(ingredientName.toLowerCase()) ||
       veganIngredients.includes(ingredientName.toLowerCase());
}

function computeVegSinglIngredient (ingredient) {
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
            return "YES";
        } else {
            tmp = findNearestIngredientMatchWithConfidence( notVegetarianIngredients, ingredient.name );
            if (tmp.confidence > 0.9 || tmp2.confidence > 0.9){
                console.log(`${ingredient.name} to ${tmp.match} with confidence ${tmp.confidence}`);
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
            let subVeg = computeVegSinglIngredient(ingredients[i]);
            if (subVeg === "NO"){
                return "NO";
            } else if(subVeg === "YES"){
                veg = veg && true;
            } else {
                maybe = maybe || true;
            }
            continue;
        }
        let isVeg = computeVegSinglIngredient(ingredients[i]);
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
        var isVeganVal = isVegan(ingredient.name);
        var isNonVeganVal = isNonVegan(ingredient.name)
        var vegSingle = computeVegSinglIngredient(ingredient);
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
            let tmp = null;
            tmp = findNearestIngredientMatchWithConfidence( veganIngredients, ingredient.name );
            if (tmp.confidence > 0.9){
                console.log(`${ingredient.name} to ${tmp.match} with confidence ${tmp.confidence}`);
                return "YES";
            } else {
                tmp = findNearestIngredientMatchWithConfidence( nonVeganIngredients, ingredient.name );
                if (tmp.confidence > 0.9){
                    console.log(`${ingredient.name} to ${tmp.match} with confidence ${tmp.confidence}`);
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
            let subVeg = computeVeganSinglIngredient(ingredients[i]);
            if (subVeg === "NO"){
                return "NO";
            } else if(subVeg === "YES"){
                veg = veg && true;
            } else {
                maybe = maybe || true;
            }
            continue
        }
        let isVegan = computeVeganSinglIngredient(ingredients[i]);
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
        displayButton &= ! (jain === "MAYBE") && !(veg === "MAYBE") && !(vegan === "MAYBE");
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
                    navigator.clipboard.writeText(productDetailsJson);

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

function convertToJsonArraySub(input, parent){
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
        let tmp = {
                name: "",
                jain: "",
                vegetarian: "",
                vegan: "",
                subIngredients: null
            };
        if (match){
            tmp.name = match[1].trim().toLowerCase();
        }else{
            tmp.name = item.trim().toLowerCase();
        }
        if (parent.jain === "YES"){
            tmp.jain = parent.jain;
        }else{
            tmp.jain = computeJainSinglIngredient(tmp);
        }
        if (parent.vegetarian === "YES"){
            tmp.vegetarian = parent.vegetarian;
        }else{
            tmp.vegetarian = computeVegSinglIngredient(tmp);
        }
        if (parent.vegan === "YES"){
            tmp.vegan = parent.vegan;
        }else{
            tmp.vegan = computeVeganSinglIngredient(tmp);
        }
        if (match) {
            tmp.subIngredients = convertToJsonArraySub(match[2], tmp);
        }
        if (tmp.name === "emulsifier")
        {
            tmp.jain = parent.jain;
            tmp.vegan = parent.vegan;
            tmp.vegetarian = parent.vegetarian;
        }
        return tmp;
    });



    console.log("convertToJsonArray = " + JSON.stringify(structured, null, 3));
    return structured;
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
        let tmp = {
                name: "",
                jain: "",
                vegetarian: "",
                vegan: "",
                subIngredients: null
            };
        if (match){
            tmp.name = match[1].trim().toLowerCase();
        }else{
            tmp.name = item.trim().toLowerCase();
        }
        tmp.jain = computeJainSinglIngredient(tmp);
        tmp.vegetarian = computeVegSinglIngredient(tmp);
        tmp.vegan = computeVeganSinglIngredient(tmp);
        if (match) {
            tmp.subIngredients = convertToJsonArraySub(match[2], tmp);
        }
        return tmp;
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
