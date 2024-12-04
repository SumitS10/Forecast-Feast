import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
import pickle

# Load dataset
data = pd.read_csv("../data/weather_health_food_recommendations.csv", on_bad_lines='skip')



# Split 'Health_Goal' and 'Dietary_Restriction' by commas into lists
data['Health_Goal'] = data['Health_Goal'].str.split(', ')
data['Dietary_Restriction'] = data['Dietary_Restriction'].str.split(', ')

# Replace NaN values with empty lists if necessary
data['Health_Goal'] = data['Health_Goal'].apply(lambda x: x if isinstance(x, list) else [])
data['Dietary_Restriction'] = data['Dietary_Restriction'].apply(lambda x: x if isinstance(x, list) else [])

# Use MultiLabelBinarizer to transform the health goals and dietary restrictions into binary format
mlb_health_goal = MultiLabelBinarizer()
mlb_dietary_restriction = MultiLabelBinarizer()

health_goal_columns = mlb_health_goal.fit_transform(data['Health_Goal'])
dietary_restriction_columns = mlb_dietary_restriction.fit_transform(data['Dietary_Restriction'])

# Create new columns for health goals and dietary restrictions
health_goal_columns_df = pd.DataFrame(health_goal_columns, columns=mlb_health_goal.classes_)
dietary_restriction_columns_df = pd.DataFrame(dietary_restriction_columns, columns=mlb_dietary_restriction.classes_)

# Concatenate the original data with the new binary columns
data = pd.concat([data, health_goal_columns_df, dietary_restriction_columns_df], axis=1)

# Drop the original columns we have transformed into binary columns
data.drop(columns=['Health_Goal', 'Dietary_Restriction'], inplace=True)

# Encode categorical data (Weather_Type is already categorical, so we can apply pd.get_dummies)
data = pd.get_dummies(data, columns=['Weather_Type'])

# Define features and target
X = data[['Temperature', 'Humidity'] + list(health_goal_columns_df.columns) + list(dietary_restriction_columns_df.columns) + [col for col in data.columns if 'Weather_Type' in col]]
y = data['Recommended_Food']

# Encode food names (target variable)
food_encoder = LabelEncoder()
y_encoded = food_encoder.fit_transform(y)

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

# Train the classifier
clf = RandomForestClassifier()
clf.fit(X_train, y_train)

# Save the trained model and encoder
with open("food_recommendation_model.pkl", "wb") as file:
    pickle.dump(clf, file)

with open("food_encoder.pkl", "wb") as file:
    pickle.dump(food_encoder, file)

with open("health_goal_encoder.pkl", "wb") as file:
    pickle.dump(mlb_health_goal, file)

with open("dietary_restriction_encoder.pkl", "wb") as file:
    pickle.dump(mlb_dietary_restriction, file)

print("Model and encoders saved!")
