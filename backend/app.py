import random
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import requests

# Load the trained model, food encoder, and other encoders
with open("food_recommendation_model.pkl", "rb") as file:
    model = pickle.load(file)

with open("food_encoder.pkl", "rb") as file:
    food_encoder = pickle.load(file)

with open("health_goal_encoder.pkl", "rb") as file:
    mlb_health_goal = pickle.load(file)

with open("dietary_restriction_encoder.pkl", "rb") as file:
    mlb_dietary_restriction = pickle.load(file)

# Spoonacular API key for fetching recipes
SPOONACULAR_API_KEY = '31df176a62904b498132fa5a7507cd7f'

# Create the Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# List of all possible weather types
WEATHER_TYPES = [
    "Partly Cloudy", "Cloudy", "Overcast", "Sunny", "Mostly Sunny", "Mostly Cloudy",
    "Rain", "Light Rain", "Heavy Rain", "Showers", "Thunderstorm", "Light Thunderstorm",
    "Heavy Thunderstorm", "Snow", "Light Snow", "Heavy Snow", "Flurries", "Sleet",
    "Hail", "Fog", "Mist", "Windy", "Gale", "Tornado", "Dust", "Hazy", "Smoke"
]

# Function to fetch full recipe details
def fetch_recipe_details(food_name):
    response = requests.get(f'https://api.spoonacular.com/recipes/complexSearch',
                            params={
                                'query': food_name,
                                'apiKey': SPOONACULAR_API_KEY,
                                'number': 1  # Fetch 1 recipe
                            })
    
    if response.status_code != 200:
        return {'description': 'Error fetching data', 'url': '', 'video_url': '', 'image': ''}
    
    data = response.json()
    
    if data['results']:
        recipe_id = data['results'][0]['id']
        recipe_details = requests.get(f'https://api.spoonacular.com/recipes/{recipe_id}/information',
                                      params={'apiKey': SPOONACULAR_API_KEY})
        
        if recipe_details.status_code != 200:
            return {'description': 'Error fetching recipe details', 'url': '', 'video_url': '', 'image': ''}
        
        recipe_data = recipe_details.json()
        
        recipe_url = recipe_data.get('sourceUrl', '')
        recipe_instructions = recipe_data.get('instructions', 'No instructions available.')
        recipe_image = recipe_data.get('image', '')  # Default to empty string if no image is found
        recipe_video_url = recipe_data.get('video', {}).get('videoUrl', '')  # Safely access video URL

        return {
            'description': recipe_instructions,
            'url': recipe_url,
            'video_url': recipe_video_url,
            'image': recipe_image
        }
    
    return {'description': 'No recipe available', 'url': '', 'video_url': '', 'image': ''}

@app.route("/predict_food", methods=["POST"])
def predict_food():
    data = request.json
    
    # Prepare the feature list with temperature and humidity
    features = [data['temperature'], data['humidity']]

    # Encode all weather types
    for weather_type in WEATHER_TYPES:
        features.append(1 if data['weather_type'] == weather_type else 0)

    # Encode health goals
    health_goals = mlb_health_goal.transform([data['health_goals']])
    features.extend(health_goals[0])

    # Encode dietary restrictions
    dietary_restrictions = mlb_dietary_restriction.transform([data['dietary_restrictions']])
    features.extend(dietary_restrictions[0])

    # Predict the food (encoded)
    food_encoded = model.predict([features])[0]

    # Decode the food
    food = food_encoder.inverse_transform([food_encoded])[0]

    # Randomly shuffle food suggestions if the same food appears consecutively
    food_list = food_encoder.classes_  # Get the list of possible food options
    food_suggestion = random.choice(food_list)  # Randomly choose a food suggestion

    # Get the recipe details for the recommended food
    recipe_details = fetch_recipe_details(food_suggestion)

    return jsonify({
        "recommended_food": food_suggestion,  # Return random food suggestion
        "recipe_description": recipe_details['description'],
        "recipe_url": recipe_details['url'],
        "recipe_video_url": recipe_details['video_url'],
        "recipe_image": recipe_details['image']
    })

if __name__ == "__main__":
    app.run(debug=True)
