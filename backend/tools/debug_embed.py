from chromadb.utils import embedding_functions
import numpy as np

embed_fn = embedding_functions.DefaultEmbeddingFunction()

texts = [
    "GLM 5.1 is a 744B-parameter MoE open-source LLM",
    "A brand new framework called Foo was released yesterday",
]

embeddings = embed_fn(texts)
for t, e in zip(texts, embeddings):
    e = np.array(e)
    print(f"'{t[:40]}...' -> dim={len(e)}, norm={np.linalg.norm(e):.4f}, first5={e[:5]}")

# manual cosine similarity
a, b = np.array(embeddings[0]), np.array(embeddings[1])
cos_sim = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
print(f"\nManual cosine similarity between the two DIFFERENT claims: {cos_sim:.4f}")