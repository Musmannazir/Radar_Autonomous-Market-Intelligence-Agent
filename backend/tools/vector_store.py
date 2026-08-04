import chromadb
from chromadb.utils import embedding_functions
from tools.db import log_finding

CHROMA_PATH = "db/chroma"
COLLECTION_NAME = "radar_findings"

client = chromadb.PersistentClient(path=CHROMA_PATH)
embed_fn = embedding_functions.DefaultEmbeddingFunction()

def get_collection(name: str = COLLECTION_NAME):
    return client.get_or_create_collection(
        name=name,
        embedding_function=embed_fn,
        metadata={"hnsw:space": "cosine"},
    )

collection = get_collection()  # the real, production collection

def is_duplicate(claim: str, similarity_threshold: float = 0.75, coll=None) -> bool:
    coll = coll or collection
    count = coll.count()
    if count == 0:
        return False
    results = coll.query(query_texts=[claim], n_results=1)
    if not results["distances"] or not results["distances"][0]:
        return False
    distance = results["distances"][0][0]
    similarity = 1 - distance
    print(f"[DEBUG] '{claim[:50]}...' -> similarity={similarity:.3f}")
    return similarity >= similarity_threshold

def add_finding(claim: str, source_url: str, run_id: str, coll=None):
    coll = coll or collection
    coll.add(
        documents=[claim],
        metadatas=[{"source_url": source_url, "run_id": run_id}],
        ids=[f"{run_id}::{hash(claim)}"],
    )
    log_finding(run_id, claim, source_url, confidence=None, is_new=True)

def filter_new_findings(findings: list[dict], run_id: str, coll=None) -> list[dict]:
    coll = coll or collection
    new_findings = []
    for f in findings:
        if is_duplicate(f["claim"], coll=coll):
            print(f"[DUP] Skipping already-seen: {f['claim'][:60]}...")
            continue
        add_finding(f["claim"], f["source_url"], run_id, coll=coll)
        f["is_new"] = True
        new_findings.append(f)
    return new_findings

if __name__ == "__main__":
    # use a throwaway test collection so we never pollute the real store
    client.delete_collection("radar_findings_test") if "radar_findings_test" in [c.name for c in client.list_collections()] else None
    test_coll = get_collection("radar_findings_test")

    test_run_1 = [
        {"claim": "GLM 5.1 is a 744B-parameter MoE open-source LLM with a 200K token context",
         "source_url": "https://example.com/a"},
    ]
    print("Run 1 (should all be new):")
    result1 = filter_new_findings(test_run_1, "test-run-1", coll=test_coll)
    print(f"-> {len(result1)} new findings")

    test_run_2 = [
        {"claim": "GLM 5.1 is a 744-billion parameter open-source model with 200K context length",
         "source_url": "https://example.com/b"},
        {"claim": "A brand new framework called Foo was released yesterday",
         "source_url": "https://example.com/c"},
    ]
    print("\nRun 2 (first should be flagged as dup, second should be new):")
    result2 = filter_new_findings(test_run_2, "test-run-2", coll=test_coll)
    print(f"-> {len(result2)} new findings")

    client.delete_collection("radar_findings_test")  # cleanup after test