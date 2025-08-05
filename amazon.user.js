// ==UserScript==
// @name         Amazon Ingredients Extractor 2 (Auto-fetch)
// @namespace    tampermonkey.net/
// @version      1
// @description  Extract ingredients from Amazon product pages
// @author       Parshwa Shah
// @match        https://*.amazon.com/*
// @grant        none
// ==/UserScript==

// --- DEV: Use localhost, PROD: Use GitHub Pages ---
const DEV = false; // set to true for dev, false for prod

const SCRIPT_URL = DEV
  ? 'https://localhost:8080/amazon.code.js'
  : 'https://is-it-jain.github.io/Tampermonkey-Scripts/amazon.code.js';

fetch(SCRIPT_URL)
  .then(r => r.text())
  .then(code => eval(code))
  .catch(err => console.error('Failed to load script:', err));
