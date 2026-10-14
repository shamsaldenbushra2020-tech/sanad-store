const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');
const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');

function readJSON(file) {
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw);
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function getProducts() {
  return readJSON(PRODUCTS_FILE);
}

function saveProducts(products) {
  writeJSON(PRODUCTS_FILE, products);
}

function getSettings() {
  return readJSON(SETTINGS_FILE);
}

function saveSettings(settings) {
  writeJSON(SETTINGS_FILE, settings);
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

module.exports = {
  getProducts,
  saveProducts,
  getSettings,
  saveSettings,
  genId
};
