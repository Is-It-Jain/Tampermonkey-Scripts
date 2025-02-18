// ==UserScript==
// @name         Safeway Product Details to JSON
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Extract product details from Safeway product page and convert to JSON
// @author       Your Name
// @match        https://www.safeway.com/shop/product-details.*.html
// @grant        none
// ==/UserScript==
function add(data){
    XMLHttpRequest.prototype.open2 = window.btt_ajaxListener.tempOpen
    XMLHttpRequest.prototype.send2 = window.btt_ajaxListener.tempSend
    var request = new XMLHttpRequest();
    request.open2('POST','https://mainserver-776168167171.us-west1.run.app/v1/create');
    request.setRequestHeader('Accept', '*');
    request.setRequestHeader('content-type', 'application/json');
    request.send2(JSON.stringify(data));
}


(function() {
    'use strict';

    // Wait for the DOM to fully load
    window.addEventListener('load', function() {
        // Extract product name
        const productNameElement = document.querySelector('h1.product-details__product-title__text');
        const productName = productNameElement ? productNameElement.innerText.trim() : 'N/A';

        // Extract dietry info
        const dietryListElement = document.querySelectorAll('span.color-primary-default');
        const dietryList = [];
        dietryListElement.forEach(span => {
            var content = span.innerText.trim()
            if (content.length > 1) {
                dietryList.push(content);
                console.log(content);
            }

        });

        // Extract product description
        const productDescriptionElement = document.querySelector('p.body-text');
        const productDescription = productDescriptionElement ? productDescriptionElement.innerText.trim() : 'N/A';

        // Extract ingredients
        const ingredientsElement = document.querySelector('div#ingredientsTabContent').querySelector('div.body-text');
        const ingredientsText = ingredientsElement.innerText.split(',');
        const ingredientsList = [];
        ingredientsText.forEach(ingredient => {
            var ingredientTxt = ingredient.trim()
            if (ingredientTxt.startsWith('and')) {
                ingredientTxt = ingredientTxt.substring(3).trim();
            }
            if (ingredientTxt.endsWith('.')) {
                ingredientTxt = ingredientTxt.split('.')[0].trim();
            }
            if (ingredientTxt.length > 1) {
                ingredientsList.push(ingredientTxt);
                console.log(ingredientTxt);
            }

        });

        const categotiesElement = document.querySelector('ul.nav-Crumb');
        const categotiesListElement = categotiesElement.querySelectorAll('a.body-s');
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
        let productDetail = {
            "data":{
                "version":"Version 1.0",
                "data":{
                    "maindietary":[
                        {
                            "jain":"Maybe",
                            "reasonnotjain":"Unkown"
                        },
                        {
                            "vegitarian":"MAYBE",
                            "reasonnotvegitarian":"Unkown"
                        },
                        {
                            "vegan":"MAYBE",
                            "reasonnotvegan":"Unkown"
                        },
                        {
                            "tithi":"MAYBE",
                            "reasonnottithi":"Unkown"
                        }
                    ],
                    "dietary":dietryList,
                    "name":productName,
                    "discription":productDescription,
                    "categories":categoriesList,
                    "ingredients":ingredientsList,
                    "barcode":null,
                    "weburl":window.location.href,
                    "brand":"Unkown",
                    "images":images,
                    "store":[
                        "Safeway"
                    ]
                },
                "status":"NEW"
            },
            "database":"Item",
            "key": "PARSHWAPUSHINGDATATOSERVER",
            "source":"TAMPERPARSHWA"
        }
        // Convert JSON object to string with indentation
        const productDetailsJson = JSON.stringify(productDetail);

        // Output JSON to console
        console.log('Product Details JSON:', productDetailsJson);

        // Optionally, create a button to copy JSON to clipboard
        const copyButton = document.createElement('button');
        copyButton.innerText = 'Copy Product Details JSON';
        copyButton.style.position = 'fixed';
        copyButton.style.top = '10px';
        copyButton.style.right = '10px';
        copyButton.style.zIndex = 1000;
        document.body.appendChild(copyButton);

        copyButton.addEventListener('click', function() {
            navigator.clipboard.writeText(productDetailsJson).then(function() {
                add(productDetail);
                console.log(productDetail);
            }, function(err) {
                console.error('Could not copy text: ', err);
            });
        });
    });
})();
