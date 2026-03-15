from env import *
import requests
import numpy as np

materials = {}
dimensionality = 1024
threshold = 0.5

def initialize_materials_and_embeddings():
    response = requests.get(f"{BACKEND_URL}/api/get_descriptions")

    materials.clear()

    if response.status_code == 200:
        payload = response.json()

        # Backend currently returns parallel arrays: id_material + description.
        if isinstance(payload, dict):
            material_ids = payload.get("id_material", [])
            descriptions = payload.get("description", [])
            for material_id, description in zip(material_ids, descriptions):
                if material_id and description:
                    materials[material_id] = description
        # Keep compatibility with a list-of-dicts payload shape.
        elif isinstance(payload, list):
            for item in payload:
                if not isinstance(item, dict):
                    continue
                material_id = item.get("material_id") or item.get("id")
                description = item.get("description")
                if material_id and description:
                    materials[material_id] = description

        print(f"Successfully loaded {len(materials)} materials from backend.")
    else:
        print(f"Failed to load materials: {response.status_code}")

    embeddings = None
    id_to_material = {}

    for id, (material_id, description) in enumerate(materials.items()):
        id_to_material[id] = material_id
        response = requests.post(f"{EMBEDDINGS_URL}", json={"text": description})
        if response.status_code == 200:
            print(f"Successfully sent description for material {material_id} to embeddings service.")
            vector = response.json().get("embedding")
        else:
            print(f"Failed to send description for material {material_id}: {response.status_code}")
            vector = np.zeros(dimensionality)

        if embeddings is None:
            embeddings = np.array(vector)
            continue
            
        new_embedding = np.array(vector)
        embeddings = np.vstack([embeddings, new_embedding])

    return embeddings, materials, id_to_material

def get_most_relevant_materials(query: str, embeddings, id_to_material, top_k: int = 1):
    response = requests.post(f"{EMBEDDINGS_URL}", json={"text": query})
    if response.status_code == 200:
        print("Successfully sent query to embeddings service.")
        query_vector = np.array(response.json().get("embedding"))
    else:
        print(f"Failed to send query: {response.status_code}")
        query_vector = np.zeros(dimensionality)

    if embeddings is None:
        print("No embeddings available to compare against.")
        return []

    similarities = np.dot(embeddings, query_vector) / (np.linalg.norm(embeddings, axis=1) * np.linalg.norm(query_vector) + 1e-10)
    top_indices = np.argsort(similarities)[-top_k:][::-1]
    relevant_materials = [(id_to_material[idx], materials[id_to_material[idx]], similarities[idx]) for idx in top_indices if similarities[idx] >= threshold]

    return relevant_materials