const dietaryRestrictionsCheckboxes = document.querySelectorAll(
    'input[name="dietaryRestrictions"]'
  );
  const noneCheckbox = document.querySelector('input[value="None"]');
  
  const apiKey = "dcc8afdf52dde4823f259788f3ef0e36";
  
  function fetchWeatherData() {
    if (navigator.geolocation) {
      document.getElementById("btn-recommendation").textContent =
        "Getting Recommandation...";
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
  
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
          )
            .then((response) => {
              if (!response.ok) {
                throw new Error(
                  "Failed to fetch weather data: " + response.statusText
                );
              }
              return response.json();
            })
            .then((data) => {
              if (data && data.weather && data.weather[0]) {
                displayWeatherData(data);
  
                // Get selected health goals and dietary restrictions
                const healthGoals = getSelectedOptions("healthGoals");
                const dietaryRestrictions = getSelectedOptions(
                  "dietaryRestrictions"
                );

                toggleNutrition();
  
                suggestFood(data, healthGoals, dietaryRestrictions);
                document.getElementById("btn-recommendation").textContent =
                  "Get Recommendation";
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                throw new Error("Invalid weather data response");
              }
            })
            .catch((error) => {
              console.error("Error fetching weather data:", error);
              document.getElementById("btn-recommendation").textContent =
                "Get Recommendation";
              alert(
                "Could not fetch weather data. Please check your API key and try again."
              );
            });
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Could not access your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }
  
  function displayWeatherData(data) {
    document.getElementById("weather").innerHTML = `
          <strong>Weather:</strong> ${data.weather[0].description.toUpperCase()}<br>
          <strong>Temperature:</strong> ${data.main.temp}°C<br>
          <strong>Humidity:</strong> ${data.main.humidity}%
      `;
  }
  
  function suggestFood(weatherData, healthGoals, dietaryRestrictions) {
    const temperature = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const weatherType = weatherData.weather[0].main;
  
    fetch("http://127.0.0.1:5000/predict_food", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        temperature: temperature,
        humidity: humidity,
        weather_type: weatherType,
        health_goals: healthGoals,
        dietary_restrictions: dietaryRestrictions,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("mydata", data);
        // Display food recommendation
        document.getElementById("recommendation-text").innerText =
          data.recommended_food;
  
        // Show the recipe section with the recipe details
        document.getElementById("recipeSection").style.display = "block";
        document.getElementById("recipeDescription").innerHTML =
          data.recipe_description || "<p>No instructions available.</p>";
  
        document.querySelector(".dish-image").src = data.recipe_image;
  
        // Dynamically set the recipe URL and video link
        const recipeUrl = document.getElementById("recipeUrl");
        const recipeVideoUrl = document.getElementById("recipeVideoUrl");
  
        if (data.recipe_url) {
          recipeUrl.innerHTML = `<a href="${data.recipe_url}" target="_blank">View Full Recipe</a>`;
        } else {
          recipeUrl.innerHTML = "No recipe URL available.";
        }
  
        if (data.recipe_video_url) {
          recipeVideoUrl.innerHTML = `<a href="${data.recipe_video_url}" target="_blank">Watch Recipe Video</a>`;
        } else {
          recipeVideoUrl.innerHTML = "No video URL available.";
        }
      })
      .catch((error) => {
        console.error("Error fetching recommendation:", error);
        alert("Could not fetch food recommendation. Please try again.");
      });
  }
  
  // Toggle the recipe visibility when the "Show Recipe" button is clicked
  function toggleRecipe() {
    const recipeDetails = document.getElementById("recipeDetails");
    if (recipeDetails.style.display === "none") {
      recipeDetails.style.display = "block";
    } else {
      recipeDetails.style.display = "none";
    }
  }
  
  // Function to get selected options from checkboxes
  function getSelectedOptions(name) {
    const selectedOptions = [];
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    checkboxes.forEach((checkbox) => {
      selectedOptions.push(checkbox.value);
    });
    return selectedOptions;
  }
  
  // Call the function to fetch weather data when the page loads
  window.onload = fetchWeatherData;
  
  document.querySelector(".aliz-ko-lado").addEventListener("click", async () => {
    const lado = await fetch("https://api.spoonacular.com/recipes/zorro-1957092");
    console.log(lado);
  });
  
  document.querySelector(".dish-image").addEventListener("load", () => {
    document.querySelector(".dish-image").classList.remove("hidden");
    const dishName = document.getElementById("recommendation-text").textContent;
    const dishName1 = dishName.split(" ").join("-");
    document.querySelector(
      "#recipeVideoUrl"
    ).innerHTML = `<a href="https://www.youtube.com/results?search_query=${dishName1}-food">Click For Video Link</a>`;
  });
  
  noneCheckbox.addEventListener("change", function () {
    if (this.checked) {
      dietaryRestrictionsCheckboxes.forEach(function (checkbox) {
        if (checkbox !== noneCheckbox) {
          checkbox.checked = false;
        }
      });
    }
  });
  
  dietaryRestrictionsCheckboxes.forEach(function (checkbox) {
    if (checkbox !== noneCheckbox) {
      checkbox.addEventListener("change", () => {
        noneCheckbox.checked = false;
      });
    }
  });

// Function to fetch nutrition data based on food name
function fetchNutritionData(foodName) {
    const spoonacularApiKey = "31df176a62904b498132fa5a7507cd7f"; // Replace with your API key
    fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${foodName}&addRecipeNutrition=true&apiKey=${spoonacularApiKey}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          const nutrition = data.results[0].nutrition;
          displayNutritionData(nutrition);
        } else {
          console.log("No nutrition data found.");
          document.getElementById("nutritionSection").innerHTML = "Nutrition information is not available.";
        }
      })
      .catch((error) => {
        console.error("Error fetching nutrition data:", error);
      });
  }
  
  // Function to display nutrition data in the nutrition section
  function displayNutritionData(nutrition) {
    const nutritionSection = document.getElementById("nutritionSection");
    
    // Clear the previous content and show the nutrition info
    nutritionSection.innerHTML = `
      <h3>Nutritional Information:</h3>
      <ul>
        ${nutrition.nutrients
          .map(
            (nutrient) =>
              `<li>${nutrient.name}: ${nutrient.amount} ${nutrient.unit}</li>`
          )
          .join("")}
      </ul>
    `;
    
    // Display the nutrition section (if hidden)
    nutritionSection.style.display = "block";
  }
  
  // Function to toggle nutrition section visibility
  function toggleNutrition() {
    const nutritionSection = document.getElementById("nutritionSection");
  
    // Toggle visibility and fetch nutrition data if visible
    if (nutritionSection.style.display === "none" || !nutritionSection.style.display) {
      nutritionSection.style.display = "block"; // Show the section
      const foodName = document.getElementById("recommendation-text").innerText.toUpperCase(); // Get food name from the recommendation section
      fetchNutritionData(foodName); // Fetch nutrition data for the current recommended food
    } else {
      nutritionSection.style.display = "none"; // Hide the section
    }
  }
  
  