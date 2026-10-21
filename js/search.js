// search.js - Food Search page: API call, suggestion logic, portion calculation, add to log

let currentFoods = [];   // foods returned by the last search
let selectedFood = null; // food the user is viewing in the detail panel

// ---------- get the HTML elements ----------
const foodInput = document.getElementById("foodInput");
const dietSelect = document.getElementById("dietSelect");
const searchBtn = document.getElementById("searchBtn");
const statusMsg = document.getElementById("statusMsg");

const suggestSection = document.getElementById("suggestSection");
const suggestInfo = document.getElementById("suggestInfo");
const suggestList = document.getElementById("suggestList");
const resultsSection = document.getElementById("resultsSection");
const resultsList = document.getElementById("resultsList");

const detailSection = document.getElementById("detailSection");
const detailName = document.getElementById("detailName");
const detailCategory = document.getElementById("detailCategory");
const nutrientTable = document.getElementById("nutrientTable");
const gramsInput = document.getElementById("gramsInput");
const mealSelect = document.getElementById("mealSelect");
const addBtn = document.getElementById("addBtn");
const calcResult = document.getElementById("calcResult");
const detailMsg = document.getElementById("detailMsg");

// Names for the diet options (used when saving suggestions)
const DIET_NAMES = {
  highprotein: "High Protein",
  lowcarb: "Low Carb",
  lowcal: "Low Calorie",
  highfiber: "High Fibre"
};

// ---------- 1. Search (API + JSON) ----------
async function doSearch() {
  const query = foodInput.value.trim();

  // Error scenario 1: invalid input
  if (query === "") {
    showMessage(statusMsg, "Please enter a food name first.", "error");
    return;
  }
  if (query.length < 2) {
    showMessage(statusMsg, "Food name must have at least 2 characters.", "error");
    return;
  }

  // DOM change: show loading state on the button
  searchBtn.disabled = true;
  searchBtn.textContent = "Searching...";
  showMessage(statusMsg, "Loading food data...", "info");
  detailSection.classList.add("hidden");

  try {
    currentFoods = await searchFoods(query);

    // Error scenario 2: empty results
    if (currentFoods.length === 0) {
      showMessage(statusMsg, 'No foods found for "' + query + '". Try another name.', "error");
      suggestSection.classList.add("hidden");
      resultsSection.classList.add("hidden");
      return;
    }

    showMessage(statusMsg, "Found " + currentFoods.length + ' foods for "' + query + '".', "success");
    showResults();
    showSuggestions(true); // true = save to Local Storage
  } catch (err) {
    // Error scenario 3: failed API request
    showMessage(statusMsg, "Could not load food data. Check your internet connection or API key, then try again.", "error");
    suggestSection.classList.add("hidden");
    resultsSection.classList.add("hidden");
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = "Search";
  }
}

// ---------- 2. Suggestion logic (my own if...else) ----------
// Checks every food against the chosen diet. Returns a list of {food, reason}.
function suggestFoods(foods, diet) {
  const result = [];

  for (let i = 0; i < foods.length; i++) {
    const f = foods[i];
    let reason = "";

    if (diet === "highprotein") {
      if (f.protein >= 15) {
        reason = "High in protein (" + f.protein + " g per 100g)";
      }
    } else if (diet === "lowcarb") {
      if (f.carbs <= 10) {
        reason = "Low in carbs (" + f.carbs + " g per 100g)";
      }
    } else if (diet === "lowcal") {
      if (f.kcal > 0 && f.kcal <= 100) {
        reason = "Low in calories (" + f.kcal + " kcal per 100g)";
      }
    } else if (diet === "highfiber") {
      if (f.fiber >= 5) {
        reason = "High in fibre (" + f.fiber + " g per 100g)";
      }
    }

    // reason stays empty if the food does not fit the diet
    if (reason !== "") {
      result.push({ food: f, reason: reason });
    }
  }

  return result;
}

// Show suggestions on screen and (optionally) save them in Local Storage
function showSuggestions(saveIt) {
  const diet = dietSelect.value;
  suggestList.innerHTML = ""; // DOM change: clear old list
  suggestSection.classList.remove("hidden");

  // No diet chosen yet
  if (diet === "") {
    suggestInfo.textContent = "Choose a diet / nutrition goal above to get suggestions.";
    return;
  }

  const suggestions = suggestFoods(currentFoods, diet);

  // Fallback message when nothing fits
  if (suggestions.length === 0) {
    suggestInfo.textContent =
      "No suitable foods found for " + DIET_NAMES[diet] + " in these results. Try another search or another goal.";
    return;
  }

  suggestInfo.textContent = suggestions.length + " food(s) match your " + DIET_NAMES[diet] + " goal:";
  for (let i = 0; i < suggestions.length; i++) {
    suggestList.appendChild(makeFoodItem(suggestions[i].food, suggestions[i].reason));
  }

  if (saveIt) {
    saveSuggestionRecord(diet, suggestions);
  }
}

// Save the suggestions into Local Storage (keep the latest 10 searches)
function saveSuggestionRecord(diet, suggestions) {
  const history = getSuggestions();
  const names = [];
  for (let i = 0; i < suggestions.length; i++) {
    names.push({ name: suggestions[i].food.name, reason: suggestions[i].reason });
  }
  history.unshift({
    id: Date.now(),
    date: todayStr(),
    query: foodInput.value.trim(),
    diet: DIET_NAMES[diet],
    foods: names
  });
  saveSuggestions(history.slice(0, 10));
}

// ---------- 3. Show the results list ----------
function showResults() {
  resultsList.innerHTML = "";
  for (let i = 0; i < currentFoods.length; i++) {
    resultsList.appendChild(makeFoodItem(currentFoods[i], ""));
  }
  resultsSection.classList.remove("hidden");
}

// Build one <li> for a food (DOM manipulation with createElement)
function makeFoodItem(food, extraText) {
  const li = document.createElement("li");

  const info = document.createElement("div");
  const name = document.createElement("div");
  name.className = "food-name";
  name.textContent = food.name;
  if (extraText !== "") {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Suggested";
    name.appendChild(badge);
  }
  const detail = document.createElement("div");
  detail.className = "food-info";
  if (extraText !== "") {
    detail.textContent = extraText;
  } else {
    detail.textContent = food.category + " | " + food.kcal + " kcal per 100g";
  }
  info.appendChild(name);
  info.appendChild(detail);

  const btn = document.createElement("button");
  btn.className = "btn btn-small";
  btn.textContent = "View";
  btn.dataset.name = food.name; // remember which food this button belongs to

  li.appendChild(info);
  li.appendChild(btn);
  return li;
}

// ---------- 4. Detail panel ----------
function showDetail(food) {
  selectedFood = food;
  detailName.textContent = food.name;
  detailCategory.textContent = "Category: " + food.category;

  const rows = [
    ["Calories", food.kcal + " kcal"],
    ["Protein", food.protein + " g"],
    ["Carbohydrates", food.carbs + " g"],
    ["Fat", food.fat + " g"],
    ["Fibre", food.fiber + " g"],
    ["Sugar", food.sugar + " g"],
    ["Calcium", food.calcium + " mg"],
    ["Iron", food.iron + " mg"],
    ["Vitamin C", food.vitaminC + " mg"]
  ];

  nutrientTable.innerHTML = "";
  for (let i = 0; i < rows.length; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + rows[i][0] + "</td><td>" + rows[i][1] + "</td>";
    nutrientTable.appendChild(tr);
  }

  gramsInput.value = 100;
  hideMessage(detailMsg);
  detailSection.classList.remove("hidden");
  updatePortion();
  detailSection.scrollIntoView({ behavior: "smooth" });
}

// ---------- 5. Calculation: nutrition for the chosen portion ----------
function updatePortion() {
  if (selectedFood === null) {
    return;
  }

  // Input validation: grams must be a number between 1 and 5000
  if (!isValidNumber(gramsInput.value, 1, 5000)) {
    calcResult.textContent = "Enter a portion size between 1 and 5000 grams.";
    return;
  }

  const grams = Number(gramsInput.value);
  // formula: value per 100g / 100 x grams
  calcResult.innerHTML =
    "<strong>Nutrition for " + grams + " g:</strong><br>" +
    "Calories: " + calcPortion(selectedFood.kcal, grams) + " kcal<br>" +
    "Protein: " + calcPortion(selectedFood.protein, grams) + " g | " +
    "Carbs: " + calcPortion(selectedFood.carbs, grams) + " g | " +
    "Fat: " + calcPortion(selectedFood.fat, grams) + " g";
}

// ---------- 6. Create a food log record ----------
function addToLog() {
  if (selectedFood === null) {
    showMessage(detailMsg, "Please select a food first.", "error");
    return;
  }
  if (!isValidNumber(gramsInput.value, 1, 5000)) {
    showMessage(detailMsg, "Portion size must be between 1 and 5000 grams.", "error");
    return;
  }

  const log = getLog();
  log.push({
    id: Date.now(),
    name: selectedFood.name,
    grams: Number(gramsInput.value),
    meal: mealSelect.value,
    date: todayStr(),
    kcal100: selectedFood.kcal,
    protein100: selectedFood.protein,
    carbs100: selectedFood.carbs,
    fat100: selectedFood.fat
  });
  saveLog(log);

  showMessage(detailMsg, selectedFood.name + " was added to your food log (" + mealSelect.value + ").", "success");
}

// ---------- Event handlers ----------
searchBtn.addEventListener("click", doSearch);

// press Enter inside the food box to search
foodInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    doSearch();
  }
});

// changing the diet updates suggestions without calling the API again
dietSelect.addEventListener("change", function () {
  if (currentFoods.length > 0) {
    showSuggestions(true);
  }
});

// one click listener per list: find the food from the button that was clicked
function handleListClick(e) {
  if (e.target.tagName === "BUTTON") {
    for (let i = 0; i < currentFoods.length; i++) {
      if (currentFoods[i].name === e.target.dataset.name) {
        showDetail(currentFoods[i]);
        break;
      }
    }
  }
}
resultsList.addEventListener("click", handleListClick);
suggestList.addEventListener("click", handleListClick);

// portion calculation updates while typing
gramsInput.addEventListener("input", updatePortion);

addBtn.addEventListener("click", addToLog);
