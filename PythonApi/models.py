from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date
import json


class Movie(BaseModel):
    id: int
    title: str = Field(..., description="Movie title")
    overview: Optional[str] = Field(None, description="Movie overview/plot")
    genres: List[Dict[str, Any]] = Field(default_factory=list, description="List of genre objects")
    keywords: List[Dict[str, Any]] = Field(default_factory=list, description="List of keyword objects")
    tagline: Optional[str] = Field(None, description="Movie tagline")
    cast: List[Dict[str, Any]] = Field(default_factory=list, description="List of cast members")
    crew: List[Dict[str, Any]] = Field(default_factory=list, description="List of crew members")
    production_companies: List[Dict[str, Any]] = Field(default_factory=list, description="Production companies")
    production_countries: List[Dict[str, Any]] = Field(default_factory=list, description="Production countries")
    spoken_languages: List[Dict[str, Any]] = Field(default_factory=list, description="Spoken languages")
    original_language: Optional[str] = Field(None, description="Original language code")
    original_title: Optional[str] = Field(None, description="Original title")
    release_date: Optional[str] = Field(None, description="Release date")
    runtime: Optional[float] = Field(None, description="Runtime in minutes")
    vote_average: Optional[float] = Field(None, description="Average vote score")
    vote_count: Optional[int] = Field(None, description="Number of votes")
    popularity: Optional[float] = Field(None, description="Popularity score")
    is_favorite: bool = Field(False, description="User favorite flag")
    personal_rating: Optional[float] = Field(None, description="Personal rating (1-10)")
    personal_notes: Optional[str] = Field(None, description="Personal notes")

    @classmethod
    def from_csv_row(cls, row_data: Dict[str, Any], movie_id: int) -> "Movie":
        """Create Movie instance from CSV row data"""
        import pandas as pd
        
        def safe_string(value: Any) -> Optional[str]:
            """Safely convert value to string, handling NaN"""
            if pd.isna(value) or value is None:
                return None
            return str(value) if value != "" else None
        
        def safe_json_parse(value: Any) -> List[Dict[str, Any]]:
            """Safely parse JSON string, return empty list if invalid"""
            if pd.isna(value) or not value or str(value).strip() == "":
                return []
            try:
                # Handle malformed JSON with double quotes
                cleaned = str(value).replace('""', '"')
                return json.loads(cleaned)
            except (json.JSONDecodeError, TypeError, AttributeError):
                return []
        
        def safe_number(value: Any, num_type=float) -> Optional[float]:
            """Safely convert to number, handling NaN and invalid values"""
            if pd.isna(value) or value is None:
                return None
            try:
                return num_type(value)
            except (ValueError, TypeError):
                return None
        
        return cls(
            id=movie_id,
            title=safe_string(row_data.get("title_y")) or "Untitled",
            overview=safe_string(row_data.get("overview")),
            genres=safe_json_parse(row_data.get("genres", "")),
            keywords=safe_json_parse(row_data.get("keywords", "")),
            tagline=safe_string(row_data.get("tagline")),
            cast=safe_json_parse(row_data.get("cast", "")),
            crew=safe_json_parse(row_data.get("crew", "")),
            production_companies=safe_json_parse(row_data.get("production_companies", "")),
            production_countries=safe_json_parse(row_data.get("production_countries", "")),
            spoken_languages=safe_json_parse(row_data.get("spoken_languages", "")),
            original_language=safe_string(row_data.get("original_language")),
            original_title=safe_string(row_data.get("original_title")),
            release_date=safe_string(row_data.get("release_date")),
            runtime=safe_number(row_data.get("runtime"), float),
            vote_average=safe_number(row_data.get("vote_average"), float),
            vote_count=safe_number(row_data.get("vote_count"), int),
            popularity=safe_number(row_data.get("popularity"), float),
            is_favorite=False,
            personal_rating=None,
            personal_notes=None
        )


class CreateMovieCommand(BaseModel):
    title: str = Field(..., description="Movie title")
    overview: Optional[str] = None
    genres: List[Dict[str, Any]] = Field(default_factory=list)
    keywords: List[Dict[str, Any]] = Field(default_factory=list)
    tagline: Optional[str] = None
    cast: List[Dict[str, Any]] = Field(default_factory=list)
    crew: List[Dict[str, Any]] = Field(default_factory=list)
    production_companies: List[Dict[str, Any]] = Field(default_factory=list)
    production_countries: List[Dict[str, Any]] = Field(default_factory=list)
    spoken_languages: List[Dict[str, Any]] = Field(default_factory=list)
    original_language: Optional[str] = None
    original_title: Optional[str] = None
    release_date: Optional[str] = None
    runtime: Optional[float] = None
    vote_average: Optional[float] = None
    vote_count: Optional[int] = None
    popularity: Optional[float] = None


class UpdateMovieCommand(BaseModel):
    title: Optional[str] = None
    overview: Optional[str] = None
    is_favorite: Optional[bool] = None
    personal_rating: Optional[float] = Field(None, ge=1, le=10, description="Personal rating (1-10)")
    personal_notes: Optional[str] = None


class MovieFilters(BaseModel):
    search: Optional[str] = Field(None, description="Search in title, overview, cast, crew")
    genres: Optional[List[str]] = Field(None, description="Filter by genre names")
    year_from: Optional[int] = Field(None, description="Minimum release year")
    year_to: Optional[int] = Field(None, description="Maximum release year")
    rating_from: Optional[float] = Field(None, description="Minimum vote average")
    rating_to: Optional[float] = Field(None, description="Maximum vote average")
    runtime_from: Optional[int] = Field(None, description="Minimum runtime")
    runtime_to: Optional[int] = Field(None, description="Maximum runtime")
    language: Optional[str] = Field(None, description="Original language")
    is_favorite: Optional[bool] = Field(None, description="Filter favorites")
    personal_rating_from: Optional[float] = Field(None, description="Minimum personal rating")
    personal_rating_to: Optional[float] = Field(None, description="Maximum personal rating")


class PaginatedMovieResponse(BaseModel):
    items: List[Movie]
    total: int
    page: int
    size: int
    pages: int


class SignUpRequest(BaseModel):
    user_input: str = Field(..., description="Single sentence containing all user information (name, phone, address)")


class ParsedUserInfo(BaseModel):
    first_name: str = Field(..., description="First name")
    last_name: str = Field(..., description="Last name")
    phone_number: str = Field(..., description="Phone number")
    street_address: str = Field(..., description="Street address including number")
    apartment_number: Optional[str] = Field(None, description="Apartment/unit number")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State/Province")
    country: str = Field(..., description="Country")
    zip_code: str = Field(..., description="ZIP/Postal code")


class UserProfile(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone_number: str
    street_address: str
    apartment_number: Optional[str] = None
    city: str
    state: str
    country: str
    zip_code: str
    created_at: str