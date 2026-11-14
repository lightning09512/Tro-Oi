
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
import re

app = FastAPI(title="Tro-Oi AI Service")

# Model hỗ trợ nhiều ngôn ngữ, bao gồm tiếng Việt
model = SentenceTransformer(
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)

class RankRequest(BaseModel):
    query: str
    descriptions: list[str]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/parse-search")
def parse_search(data: SearchRequest):
    text = data.query.lower()
    filters = {
        "district": None,
        "max_price": None,
        "amenities": [],
        "pets_allowed": None
    }

    # Demo trích xuất điều kiện bằng quy tắc
    districts = [
        "bình thạnh", "thủ đức", "gò vấp",
        "tân bình", "quận 1", "quận 7"
    ]

    for district in districts:
        if district in text:
            filters["district"] = district
            break

    price = re.search(
        r"(?:dưới|tối đa|không quá)\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr)",
        text
    )
    if price:
        amount = float(price.group(1).replace(",", "."))
        filters["max_price"] = int(amount * 1_000_000)

    amenity_names = {
        "máy lạnh": "air_conditioner",
        "điều hòa": "air_conditioner",
        "gác": "loft",
        "ban công": "balcony",
        "máy giặt": "washing_machine"
    }

    for keyword, code in amenity_names.items():
        if keyword in text and code not in filters["amenities"]:
            filters["amenities"].append(code)

    if "cho nuôi mèo" in text or "cho nuôi thú cưng" in text:
        filters["pets_allowed"] = True

    return {
        "query": data.query,
        "filters": filters
    }

@app.post("/rank")
def rank(data: RankRequest):
    if not data.descriptions:
        return {"results": []}

    texts = [data.query] + data.descriptions

    embeddings = model.encode(
        texts,
        normalize_embeddings=True
    )

    query_embedding = embeddings[0]
    room_embeddings = embeddings[1:]

    scores = room_embeddings @ query_embedding

    results = [
        {"index": i, "score": float(score)}
        for i, score in enumerate(scores)
    ]

    return {
        "results": sorted(
            results,
            key=lambda x: x["score"],
            reverse=True
        )
    }
