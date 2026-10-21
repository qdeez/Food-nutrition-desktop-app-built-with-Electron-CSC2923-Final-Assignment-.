// log.js - My Food Log page: CRUD with Local Storage, daily totals, saved suggestions

let editId = null; // null = adding a new record, otherwise the id of the record being edited

// ---------- get the HTML elements ----------
const viewDate = document.getElementById("viewDate");
const goalInput = document.getElementById("goalInput");
const goalBtn = document.getElementById("goalBtn");
const goalMsg = document.getElementById("goalMsg");
const summaryBox = document.getElementById("summaryBox");
const barFill = document.getElementById("barFill");

const formTitle = document.getElementById("formTitle");
const nameInput = document.getElementById("nameInput");
const gramsInput = document.getElementById("gramsInput");
const mealInput = document.getElementById("mealInput");
const dateInput = document.getElementById("dateInput");
const kcalInput = document.getElementById("kcalInput");
const proteinInput = document.getElementById("proteinInput");
const carbsInput = document.getElementById("carbsInput");
const fatInput = document.getElementById("fatInput");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formMsg = document.getElementById("formMsg");

const logBody = document.getElementById("logBody");
const suggestHistory = document.getElementById("suggestHistory");
const clearSuggestBtn = document.getElementById("clearSuggestBtn");

// ---------- READ: show records for the selected date ----------
function renderLog() {
  const log = getLog();
  logBody.innerHTML = "";

  let totalKcal = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let count = 0;

  for (let i = 0; i < log.length; i++) {
    const r = log[i];
    if (r.date !== viewDate.value) {
      continue; // skip records from other dates
    }
    count++;

    // calculation: value per 100g -> value for the grams eaten
    const kcal = calcPortion(r.kcal100, r.grams);
    const protein = calcPortion(r.protein100, r.grams);
    const carbs = calcPortion(r.carbs100, r.grams);
    const fat = calcPortion(r.fat100, r.grams);
    totalKcal += kcal;
    totalProtein += protein;
    totalCarbs += carbs;
    totalFat += fat;

    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + r.name + "</td><td>" + r.meal + "</td><td>" + r.grams + "</td>" +
      "<td>" + kcal + "</td><td>" + protein + "</td><td>" + carbs + "</td><td>" + fat + "</td>" +
      '<td><button class="btn btn-small" data-action="edit" data-id="' + r.id + '">Edit</button>' +
      '<button class="btn btn-small btn-red" data-action="delete" data-id="' + r.id + '">Delete</button></td>';
    logBody.appendChild(tr);
  }

  // Empty state message
  if (count === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="8" class="empty-row">No food records for this date. Add one above or from the Food Search page.</td>';
    logBody.appendChild(tr);
  }

  showSummary(totalKcal, totalProtein, totalCarbs, totalFat);
}

// ---------- Daily summary (calculation) ----------
function showSummary(kcal, protein, carbs, fat) {
  const goal = getGoal();
  const remaining = Math.round((goal - kcal) * 10) / 10;
  const percent = Math.round((kcal / goal) * 100);

  let text =
    "<strong>Total calories:</strong> " + Math.round(kcal * 10) / 10 + " kcal of " + goal + " kcal goal (" + percent + "%)<br>" +
    "<strong>Protein:</strong> " + Math.round(protein * 10) / 10 + " g | " +
    "<strong>Carbs:</strong> " + Math.round(carbs * 10) / 10 + " g | " +
    "<strong>Fat:</strong> " + Math.round(fat * 10) / 10 + " g<br>";

  if (remaining >= 0) {
    text += "<strong>Calories remaining:</strong> " + remaining + " kcal";
    barFill.className = "bar-fill";
  } else {
    text += "<strong>Over your goal by:</strong> " + Math.abs(remaining) + " kcal";
    barFill.className = "bar-fill over";
  }

  summaryBox.innerHTML = text;
  barFill.style.width = Math.min(percent, 100) + "%"; // bar never goes past 100%
}

// ---------- Validate the form. Returns a record object, or null if invalid ----------
function readForm() {
  const name = nameInput.value.trim();

  if (name === "") {
    showMessage(formMsg, "Food name cannot be empty.", "error");
    return null;
  }
  if (!isValidNumber(gramsInput.value, 1, 5000)) {
    showMessage(formMsg, "Grams eaten must be between 1 and 5000.", "error");
    return null;
  }
  if (dateInput.value === "") {
    showMessage(formMsg, "Please choose a date.", "error");
    return null;
  }
  if (!isValidNumber(kcalInput.value, 0, 900)) {
    showMessage(formMsg, "Calories per 100g must be between 0 and 900.", "error");
    return null;
  }
  if (!isValidNumber(proteinInput.value, 0, 100) ||
      !isValidNumber(carbsInput.value, 0, 100) ||
      !isValidNumber(fatInput.value, 0, 100)) {
    showMessage(formMsg, "Protein, carbs and fat per 100g must be between 0 and 100.", "error");
    return null;
  }

  return {
    name: name,
    grams: Number(gramsInput.value),
    meal: mealInput.value,
    date: dateInput.value,
    kcal100: Number(kcalInput.value),
    protein100: Number(proteinInput.value),
    carbs100: Number(carbsInput.value),
    fat100: Number(fatInput.value)
  };
}

// ---------- CREATE and UPDATE ----------
function saveRecord() {
  const data = readForm();
  if (data === null) {
    return; // validation message already shown
  }

  const log = getLog();

  if (editId === null) {
    // CREATE: add a new record
    data.id = Date.now();
    log.push(data);
    showMessage(formMsg, data.name + " was added to your food log.", "success");
  } else {
    // UPDATE: replace the record that has the same id
    for (let i = 0; i < log.length; i++) {
      if (log[i].id === editId) {
        data.id = editId;
        log[i] = data;
      }
    }
    showMessage(formMsg, data.name + " was updated.", "success");
  }

  saveLog(log); // write to Local Storage
  viewDate.value = data.date; // show the date we just saved to
  resetForm(false);
  renderLog();
}

// Put a record into the form so the user can edit it
function startEdit(id) {
  const log = getLog();
  for (let i = 0; i < log.length; i++) {
    if (log[i].id === id) {
      const r = log[i];
      nameInput.value = r.name;
      gramsInput.value = r.grams;
      mealInput.value = r.meal;
      dateInput.value = r.date;
      kcalInput.value = r.kcal100;
      proteinInput.value = r.protein100;
      carbsInput.value = r.carbs100;
      fatInput.value = r.fat100;

      editId = id;
      formTitle.textContent = "Edit food record";
      saveBtn.textContent = "Update Record";
      cancelBtn.classList.remove("hidden");
      hideMessage(formMsg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
}

// ---------- DELETE ----------
function deleteRecord(id) {
  if (!confirm("Delete this food record?")) {
    return;
  }
  const log = getLog();
  const newLog = [];
  for (let i = 0; i < log.length; i++) {
    if (log[i].id !== id) {
      newLog.push(log[i]); // keep everything except the deleted one
    }
  }
  saveLog(newLog);
  renderLog();
  showMessage(formMsg, "Record deleted.", "success");
}

// Clear the form and go back to "add" mode
function resetForm(clearMessage) {
  nameInput.value = "";
  gramsInput.value = "";
  kcalInput.value = "";
  proteinInput.value = "";
  carbsInput.value = "";
  fatInput.value = "";
  mealInput.value = "Breakfast";
  dateInput.value = todayStr();

  editId = null;
  formTitle.textContent = "Add a food record";
  saveBtn.textContent = "Add Record";
  cancelBtn.classList.add("hidden");
  if (clearMessage) {
    hideMessage(formMsg);
  }
}

// ---------- Calorie goal ----------
function saveGoalClick() {
  if (!isValidNumber(goalInput.value, 500, 10000)) {
    showMessage(goalMsg, "Calorie goal must be between 500 and 10000 kcal.", "error");
    return;
  }
  saveGoal(Number(goalInput.value));
  showMessage(goalMsg, "Daily calorie goal saved.", "success");
  renderLog();
}

// ---------- Saved suggestions (stored in Local Storage by the Food Search page) ----------
function renderSuggestions() {
  const history = getSuggestions();
  suggestHistory.innerHTML = "";

  if (history.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No saved suggestions yet. Search a food and choose a diet goal on the Food Search page.";
    suggestHistory.appendChild(li);
    return;
  }

  for (let i = 0; i < history.length; i++) {
    const h = history[i];
    const li = document.createElement("li");
    const names = [];
    for (let j = 0; j < h.foods.length; j++) {
      names.push(h.foods[j].name);
    }
    li.innerHTML =
      "<div><div class='food-name'>" + h.diet + " | search: " + h.query + " (" + h.date + ")</div>" +
      "<div class='food-info'>" + names.join("; ") + "</div></div>";
    suggestHistory.appendChild(li);
  }
}

// ---------- Event handlers ----------
saveBtn.addEventListener("click", saveRecord);
cancelBtn.addEventListener("click", function () {
  resetForm(true);
});
goalBtn.addEventListener("click", saveGoalClick);
viewDate.addEventListener("change", renderLog);

// Edit / Delete buttons inside the table
logBody.addEventListener("click", function (e) {
  if (e.target.tagName === "BUTTON") {
    const id = Number(e.target.dataset.id);
    if (e.target.dataset.action === "edit") {
      startEdit(id);
    } else if (e.target.dataset.action === "delete") {
      deleteRecord(id);
    }
  }
});

clearSuggestBtn.addEventListener("click", function () {
  saveSuggestions([]);
  renderSuggestions();
});

// ---------- Start: runs when the page opens ----------
viewDate.value = todayStr();
dateInput.value = todayStr();
goalInput.value = getGoal();
renderLog();
renderSuggestions();
