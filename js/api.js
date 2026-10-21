// api.js - calls the USDA FoodData Central API and turns the JSON into simple objects

// Find one nutrient inside the foodNutrients array.
// nameStart = part of the nutrient name, unit (optional) = unit name like "KCAL"
function getNutrient(nutrients, nameStart, unit) {
  for (const n of nutrients) {
    if (n.nutrientName && n.nutrientName.includes(nameStart)) {
      if (unit === undefined || n.unitName === unit) {
        return n.value;
      }
    }
  }
  return 0; // nutrient not listed for this food
}

// Convert ONE food from the API JSON into a simple object (all values are per 100g)
function parseFood(f) {
  const nut = f.foodNutrients || [];
  return {
    name: f.description,                          // info 1: food name
    category: f.foodCategory || "Not specified",  // info 1: category
    kcal: getNutrient(nut, "Energy", "KCAL"),     // info 2: calories
    protein: getNutrient(nut, "Protein"),         // info 3: macros
    fat: getNutrient(nut, "Total lipid"),
    carbs: getNutrient(nut, "Carbohydrate"),
    fiber: getNutrient(nut, "Fiber"),             // info 4: fibre and sugar
    sugar: getNutrient(nut, "Sugars"),
    calcium: getNutrient(nut, "Calcium"),         // info 5: vitamins and minerals
    iron: getNutrient(nut, "Iron"),
    vitaminC: getNutrient(nut, "Vitamin C")
  };
}

// Search foods by name. Returns an array of parsed foods. Throws an error if the request fails.
async function searchFoods(query) {
  const url =
    API_URL +
    "?query=" + encodeURIComponent(query) +
    "&dataType=" + encodeURIComponent("Foundation,SR Legacy") + // per-100g data
    "&pageSize=15" +
    "&api_key=" + API_KEY;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("API request failed with status " + response.status);
  }

  const data = await response.json(); // JSON -> JavaScript object
  if (!data.foods) {
    return []; // no results
  }
  return data.foods.map(parseFood);
}
