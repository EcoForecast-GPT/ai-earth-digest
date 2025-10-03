# Simple FastAPI server to expose NASA weather service
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from server.nasa_weather_service import get_city_weather
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/nasa_weather")
def nasa_weather(city: str = Query(..., description="City name")):
    result = get_city_weather(city)
    return JSONResponse(content=result)
