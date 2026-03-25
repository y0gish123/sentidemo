from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load .env from parent directory explicitly
dotenv_path = os.path.join(os.path.dirname(__file__), '../.env')
load_dotenv(dotenv_path)

client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
db = client['sentinel']
incidents_collection = db['incidents']

def save_incident(data):
    # Ensure it's a dict before inserting if it's a pydantic model
    if hasattr(data, "model_dump"):
        data_dict = data.model_dump()
    else:
        data_dict = dict(data)
    incidents_collection.insert_one(data_dict)
    return data_dict

def get_incidents(n=10):
    # return list of incidents without the MongoDB _id
    incidents = list(incidents_collection.find().sort('timestamp', -1).limit(n))
    for inc in incidents:
        if '_id' in inc:
            del inc['_id']
    return incidents
