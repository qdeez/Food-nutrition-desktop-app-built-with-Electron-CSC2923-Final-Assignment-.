// common.js - helper functions shared by both pages (Local Storage + small utilities)

// ---------- Local Storage ----------
function loadData(key, fallback) {
  try {
    const text = localStorage.getItem(key);
    if (text === null) {
      return fallback;
    }
    return JSON.parse(text);
  } catch (err) {
    return fallback;
  }
}

// Save any object/array into Local Storage as a JSON string
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Food log records (used by CRUD on the log page)
function getLog() {
  return loadData("foodLog", []);
}
function saveLog(list) {
  saveData("foodLog", list);
}

// Saved suggestions (history)
function getSuggestions() {
  return loadData("suggestions", []);
}
function saveSuggestions(list) {
  saveData("suggestions", list);
}

// Daily calorie goal
function getGoal() {
  return loadData("calorieGoal", 2000);
}
function saveGoal(value) {
  saveData("calorieGoal", value);
}

function todayStr() {
  return new Date().toLocaleDateString("en-CA");
}

// Calculate nutrient amount for a portion: (value per 100g / 100) x grams
function calcPortion(per100, grams) {
  return Math.round((per100 * grams) / 100 * 10) / 10; 
}

// Check that text is a number between min and max (empty text is invalid)
function isValidNumber(text, min, max) {
  if (text === "" || text === null) {
    return false;
  }
  const n = Number(text);
  if (isNaN(n)) {
    return false;
  }
  if (n < min || n > max) {
    return false;
  }
  return true;
}

// Show a feedback message inside an element. type = "success", "error" or "info"
function showMessage(element, text, type) {
  element.textContent = text;
  element.className = "msg " + type;
}

// Hide a message element
function hideMessage(element) {
  element.textContent = "";
  element.className = "msg hidden";
}
