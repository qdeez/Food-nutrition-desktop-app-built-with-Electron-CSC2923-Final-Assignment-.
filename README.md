# NutritionPlan

Food nutrition desktop app built with Electron (CSC2923 Final Assignment).

## Features
- Search foods using the USDA FoodData Central API
- Diet-based food suggestions, saved in Local Storage
- Portion calculator and daily calorie/macro totals
- Food log with Create, Read, Update, Delete (Local Storage)

## How to run
1. Install Node.js
2. Open a terminal in this folder and run:
   ```
   npm install
   npm start
   ```
3. (Optional) Get a free API key at https://fdc.nal.usda.gov/api-key-signup and paste it into `js/config.js`.
   `DEMO_KEY` works for testing but has a low request limit.

## Structure
- `main.js` - Electron main process
- `index.html` - Food Search page
- `log.html` - My Food Log page
- `css/style.css` - styles
- `js/` - config, common helpers (Local Storage), API, search page, log page
